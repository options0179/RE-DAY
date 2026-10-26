package com.reday.ai;

import com.fasterxml.jackson.databind.JsonNode;
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

  public GeminiClient(@Value("${reday.gemini.api-key}") String apiKey, @Value("${reday.gemini.model}") String model) {
    this.apiKey = apiKey == null ? "" : apiKey.trim();
    this.model = model == null ? "" : model.trim();

    var requestFactory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
    requestFactory.setConnectTimeout(10_000);
    requestFactory.setReadTimeout(90_000);
    this.restClient = RestClient.builder().requestFactory(requestFactory).build();
  }

  public String generate(String systemInstruction, String userPrompt) {
    if (apiKey.isEmpty()) {
      throw new IllegalStateException("GEMINI_API_KEY is required");
    }
    if (model.isEmpty()) {
      throw new IllegalStateException("GEMINI_MODEL is required");
    }

    String url = "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s"
        .formatted(model, apiKey);

    Map<String, Object> requestBody = Map.of(
        "systemInstruction", Map.of("parts", new Object[] {Map.of("text", systemInstruction)}),
        "contents", new Object[] {Map.of("role", "user", "parts", new Object[] {Map.of("text", userPrompt)})});

    JsonNode body;
    try {
      body = restClient.post()
          .uri(url)
          .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
          .body(requestBody)
          .retrieve()
          .body(JsonNode.class);
    } catch (org.springframework.web.client.RestClientResponseException e) {
      String upstreamMessage = extractErrorMessage(e.getResponseBodyAs(JsonNode.class));
      throw new IllegalStateException("Gemini request failed (%d): %s".formatted(e.getStatusCode().value(), upstreamMessage));
    }

    String text = extractText(body);
    if (text == null || text.isBlank()) {
      throw new IllegalStateException("Gemini response did not contain text");
    }
    return text;
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
