package com.reday.sessions.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;

public final class SessionDtos {
  private SessionDtos() {
  }

  public record CreateSessionRequest(@NotBlank String jobId, @NotBlank String variantId) {
  }

  public record SituationView(String title, String narrative, String timePressure) {
  }

  public record SessionView(
      String id,
      String status,
      String jobId,
      String jobName,
      String variantId,
      String variantTitle,
      String roleDescription,
      String draftResponse,
      int currentStepIndex,
      int totalSteps,
      int stateVersion,
      String parentSessionId,
      SituationView currentSituation,
      Instant startedAt,
      Instant updatedAt,
      Instant completedAt) {
  }

  public record DraftRequest(String text) {
  }

  public record SubmitStepRequest(@Min(0) int stepIndex, @Min(1) int expectedStateVersion, @NotBlank String responseText) {
  }

  public record RetryStepRequest(@Min(1) int expectedStateVersion, @NotBlank String responseText) {
  }

  public record AnalysisView(List<String> behaviorTags, String immediateEffect, String delayedEffect,
      int relationshipChange, int taskChange, String evidence) {
  }

  public record OutcomeView(String characterReaction, int timeConsumedMinutes, List<String> carryOverIssueIds,
      boolean slotComplete, boolean isFinalStep) {
  }

  public record StepView(
      String id,
      String sessionId,
      int stepIndex,
      SituationView situation,
      String responseText,
      Instant submittedAt,
      AnalysisView analysis,
      OutcomeView outcome,
      SessionView session) {
  }

  public record ConflictView(int currentStateVersion, StepView latestStep) {
  }

  public record RollbackRequest(@Min(0) int toStepIndex) {
  }

  public record SummaryRequest(String userReflection) {
  }

  public record SummaryView(String sessionId, String timelineSummary, List<String> strengths, List<String> tryNext,
      String userReflection, List<String> achievementTitles, Instant savedAt) {
  }

  public record HistoryItemView(String sessionId, String jobId, String jobName, String variantTitle, String status,
      int currentStepIndex, int totalSteps, Instant updatedAt, Instant completedAt, boolean summaryAvailable) {
  }

  public record ActiveSessionView(String sessionId, String jobName, String variantTitle, int currentStepIndex,
      int totalSteps) {
  }

  public record HomeSummaryView(ActiveSessionView activeSession, List<HistoryItemView> recentRecords) {
  }
}
