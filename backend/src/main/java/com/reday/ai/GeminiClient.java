package com.reday.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

/** Direct port of the former backend/src/ai/gemini-client.ts — same endpoint shape, same error semantics. */
@Component
public class GeminiClient {

  private final String apiKey;
  private final String model;
  private final RestClient restClient;
  private final ObjectMapper objectMapper = new ObjectMapper();

  public GeminiClient(@Value("${reday.gemini.api-key}") String apiKey, @Value("${reday.gemini.model}") String model) {
    this.apiKey = apiKey == null ? "" : apiKey.trim();
    this.model = model == null ? "" : model.trim();

    var requestFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout(10_000);
    requestFactory.setReadTimeout(30_000);
    this.restClient = RestClient.builder().requestFactory(requestFactory).build();
  }

  /** Overload for callers that don't need a constrained output shape. */
  public String generate(String systemInstruction, String userPrompt) {
    return generate(systemInstruction, userPrompt, null);
  }

  /**
   * @param responseSchema Gemini's OpenAPI-subset schema (uppercase types: OBJECT, STRING,
   *     ARRAY, INTEGER, BOOLEAN; "properties", "required", "items", "nullable"). When present,
   *     this constrains decoding to that exact shape instead of relying on the model to follow a
   *     plain-text "respond with JSON only" instruction, which it doesn't reliably do.
   */
  public String generate(String systemInstruction, String userPrompt, Map<String, Object> responseSchema) {
    if (apiKey.isEmpty()) {
      throw new IllegalStateException("GEMINI_API_KEY is required");
    }
    if (model.isEmpty()) {
      throw new IllegalStateException("GEMINI_MODEL is required");
    }

    String url = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s"
        .formatted(model, apiKey);

    // thinkingBudget 0 disables the model's default "thinking" pass — on gemini-3.8-flash that
    // pass alone took 200s+ in testing even for a one-word reply; without it, ~7s on a short
    // prompt. responseMimeType + responseSchema constrain decoding at the API level:
    // main-instructions.md is the old Copilot Studio Agent's conversational system prompt, and a
    // plain-text "respond with JSON only" instruction isn't enough — without responseMimeType it
    // answers in its narrative/choice-button persona, and even with responseMimeType alone it
    // invents its own JSON shape instead of the one spelled out in the prompt text.
    var generationConfig = new java.util.HashMap<String, Object>();
    generationConfig.put("thinkingConfig", Map.of("thinkingBudget", 0));
    generationConfig.put("responseMimeType", "application/json");
    if (responseSchema != null) {
      generationConfig.put("responseSchema", responseSchema);
    }

    Map<String, Object> requestBody = Map.of(
        "systemInstruction", Map.of("parts", new Object[] {Map.of("text", systemInstruction)}),
        "contents", new Object[] {Map.of("role", "user", "parts", new Object[] {Map.of("text", userPrompt)})},
        "generationConfig", generationConfig);

    // Read the raw bytes and parse manually instead of letting RestClient pick a converter by
    // Content-Type: Gemini sometimes answers a 200 with "application/octet-stream" instead of
    // "application/json", which makes Spring's Jackson converter refuse the body outright.
    byte[] rawBody;
    try {
      rawBody = restClient.post()
          .uri(url)
          .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
          .body(requestBody)
          .retrieve()
          .body(byte[].class);
    } catch (org.springframework.web.client.RestClientResponseException e) {
      String upstreamMessage = extractErrorMessage(parseJson(e.getResponseBodyAsByteArray()));
      throw new IllegalStateException("Gemini request failed (%d): %s".formatted(e.getStatusCode().value(), upstreamMessage));
    }
    JsonNode body = parseJson(rawBody);

    String text = extractText(body);
    if (text == null || text.isBlank()) {
      throw new IllegalStateException("Gemini response did not contain text");
    }
    return text;
  }

  private JsonNode parseJson(byte[] raw) {
    if (raw == null || raw.length == 0) {
      return null;
    }
    try {
      return objectMapper.readTree(raw);
    } catch (Exception e) {
      throw new IllegalStateException("Gemini response was not valid JSON: " + new String(raw, StandardCharsets.UTF_8), e);
    }
  }

  private static String extractErrorMessage(JsonNode body) {
    if (body == null) {
      return "unknown upstream error";
    }
    JsonNode message = body.path("error").path("message");
    return message.isMissingNode() ? "unknown upstream error" : message.asText();
  }

  private static String extractText(JsonNode body) {
    if (body == null) {
      return null;
    }
    JsonNode parts = body.path("candidates").path(0).path("content").path("parts");
    if (!parts.isArray()) {
      return null;
    }
    StringBuilder builder = new StringBuilder();
    parts.forEach(part -> builder.append(part.path("text").asText("")));
    return builder.toString().trim();
  }
}
