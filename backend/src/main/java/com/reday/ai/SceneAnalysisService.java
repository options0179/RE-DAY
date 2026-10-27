package com.reday.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;

/**
 * Port of backend/src/ai/agent-orchestrator.ts#analyzeResponse. Given a job, the situation the
 * user faced, and their free-text response, asks Gemini (grounded in docs/agent's extracted
 * Copilot Agent instructions + skill prompts) to analyze the response and its in-world outcome.
 */
@Service
public class SceneAnalysisService {

  /**
   * Of the 9 extracted skills, only these two produce this call's output (analysis +
   * consequence) — the rest (worldbuilder, scenegeneerator, crisisgenerator,
   * jobientresolver, dayreviewcomposer, narrativehumanizer, realityvalidator) cover other
   * parts of the old Copilot Agent flow that this service doesn't perform. Sending all 9 made
   * the system instruction ~32KB, which the free-tier Gemini key rejected outright with a 503
   * "high demand"; trimming to just these two keeps the prompt within what actually succeeds.
   */
  private static final Set<String> RELEVANT_SKILLS = Set.of("responseanalyzer", "consequencesimulator");

  /**
   * Gemini's structured-output schema for this call's JSON contract. Without this, the model
   * doesn't reliably follow the shape spelled out in buildSystemInstruction()'s text — it either
   * ignores the "JSON only" instruction entirely (answering in main-instructions.md's narrative
   * persona instead) or emits valid-but-differently-shaped JSON (e.g. a self-invented
   * "consequence_simulation" object). See GeminiClient#generate for how this is applied.
   */
  private static final Map<String, Object> RESPONSE_SCHEMA = Map.of(
      "type", "OBJECT",
      "properties", Map.of(
          "skillCalls", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")),
          "analysis", Map.of(
              "type", "OBJECT",
              "properties", Map.of(
                  "behaviorTags", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")),
                  "immediateEffect", Map.of("type", "STRING"),
                  "delayedEffect", Map.of("type", "STRING", "nullable", true),
                  "relationshipChange", Map.of("type", "INTEGER"),
                  "taskChange", Map.of("type", "INTEGER"),
                  "evidence", Map.of("type", "STRING")),
              "required", List.of("behaviorTags", "immediateEffect", "relationshipChange", "taskChange", "evidence")),
          "consequence", Map.of(
              "type", "OBJECT",
              "properties", Map.of(
                  "characterReaction", Map.of("type", "STRING"),
                  "timeConsumedMinutes", Map.of("type", "INTEGER"),
                  "carryOverIssueIds", Map.of("type", "ARRAY", "items", Map.of("type", "STRING")),
                  "slotComplete", Map.of("type", "BOOLEAN")),
              "required", List.of("characterReaction", "timeConsumedMinutes", "carryOverIssueIds", "slotComplete"))),
      "required", List.of("skillCalls", "analysis", "consequence"));

  public record ResponseAnalysis(List<String> behaviorTags, String immediateEffect, String delayedEffect,
      int relationshipChange, int taskChange, String evidence) {
  }

  public record Consequence(String characterReaction, int timeConsumedMinutes, List<String> carryOverIssueIds,
      boolean slotComplete) {
  }

  public record SceneAnalysisResult(ResponseAnalysis analysis, Consequence consequence) {
  }

  private final AgentPromptCatalog promptCatalog;
  private final GeminiClient geminiClient;
  private final ObjectMapper objectMapper = new ObjectMapper();

  public SceneAnalysisService(AgentPromptCatalog promptCatalog, GeminiClient geminiClient) {
    this.promptCatalog = promptCatalog;
    this.geminiClient = geminiClient;
  }

  public SceneAnalysisResult analyze(String jobName, String incident, String responseText) {
    AgentPromptCatalog.Prompts prompts = promptCatalog.load();
    List<AgentPromptCatalog.SkillPrompt> relevantSkills = prompts.skills().stream()
        .filter(skill -> RELEVANT_SKILLS.contains(skill.name()))
        .toList();

    String systemInstruction = buildSystemInstruction(prompts, relevantSkills);
    String userPrompt = "직무: %s\n현재 사건: %s\n사용자 응답: %s".formatted(jobName, incident, responseText);
    String raw = geminiClient.generate(systemInstruction, userPrompt, RESPONSE_SCHEMA);
    return parseResult(raw);
  }

  private static String buildSystemInstruction(AgentPromptCatalog.Prompts prompts, List<AgentPromptCatalog.SkillPrompt> relevantSkills) {
    StringBuilder builder = new StringBuilder();
    builder.append(prompts.mainInstructions());
    builder.append("\n\n## 추출된 Skill 안내");
    for (AgentPromptCatalog.SkillPrompt skill : relevantSkills) {
      builder.append("\n\n### Skill: ").append(skill.name()).append('\n').append(skill.content());
    }
    builder.append("\n\n## 출력 계약\n");
    builder.append("JSON object만 반환한다. skillCalls는 사용한 Skill 파일명 배열이다. analysis와 consequence는 제공된 구조를 정확히 따른다.\n");
    builder.append("analysis: { behaviorTags: string[], immediateEffect: string, delayedEffect: string | null, relationshipChange: number, taskChange: number, evidence: string }\n");
    builder.append("consequence: { characterReaction: string, timeConsumedMinutes: number, carryOverIssueIds: string[], slotComplete: boolean }");
    return builder.toString();
  }

  private SceneAnalysisResult parseResult(String raw) {
    // skillCalls is part of the response contract (and the schema) but isn't used past this
    // point — ExperienceStep never persists it — so it's read for shape validation only. The
    // model writes human-readable names from the skill prompts ("Response Analyzer") rather than
    // our internal slugs ("responseanalyzer"), so there's nothing meaningful left to validate
    // its *contents* against.
    String trimmed = raw.replaceFirst("(?i)^```json\\s*", "").replaceFirst("\\s*```$", "").trim();
    JsonNode value;
    try {
      value = objectMapper.readTree(trimmed);
    } catch (Exception e) {
      throw new IllegalStateException("invalid Agent result: expected JSON", e);
    }
    if (!value.has("skillCalls") || !value.get("skillCalls").isArray()) {
      throw new IllegalStateException("invalid Agent result: skillCalls is required");
    }

    JsonNode analysisNode = value.path("analysis");
    JsonNode consequenceNode = value.path("consequence");
    if (analysisNode.isMissingNode() || consequenceNode.isMissingNode()) {
      throw new IllegalStateException("invalid Agent result: analysis and consequence are required");
    }

    List<String> behaviorTags = new ArrayList<>();
    analysisNode.path("behaviorTags").forEach(node -> behaviorTags.add(node.asText()));
    ResponseAnalysis analysis = new ResponseAnalysis(
        behaviorTags,
        analysisNode.path("immediateEffect").asText(),
        analysisNode.path("delayedEffect").isNull() ? null : analysisNode.path("delayedEffect").asText(null),
        analysisNode.path("relationshipChange").asInt(),
        analysisNode.path("taskChange").asInt(),
        analysisNode.path("evidence").asText());

    List<String> carryOverIssueIds = new ArrayList<>();
    consequenceNode.path("carryOverIssueIds").forEach(node -> carryOverIssueIds.add(node.asText()));
    Consequence consequence = new Consequence(
        consequenceNode.path("characterReaction").asText(),
        consequenceNode.path("timeConsumedMinutes").asInt(),
        carryOverIssueIds,
        consequenceNode.path("slotComplete").asBoolean(false));

    return new SceneAnalysisResult(analysis, consequence);
  }
}
