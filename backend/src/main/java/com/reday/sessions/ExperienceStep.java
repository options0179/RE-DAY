package com.reday.sessions;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Immutable once created — a session's steps are a write-once log, never edited in place. */
@Entity
@Table(name = "experience_steps", uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "step_index"}))
@Getter
@Setter
@NoArgsConstructor
public class ExperienceStep {

  @Id
  private String id;

  @Column(name = "session_id")
  private String sessionId;

  @Column(name = "step_index")
  private int stepIndex;

  private String situationTitle;

  @Column(length = 2000)
  private String situationNarrative;

  private String timePressure;

  @Column(length = 2000)
  private String responseText;

  private Instant submittedAt;

  // EAGER: small, always read together with the step, and DTOs built from a *loaded* step
  // (listSteps) get serialized after the transaction closes — lazy here throws
  // LazyInitializationException at the HTTP boundary.
  @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
  @CollectionTable(name = "experience_step_behavior_tags", joinColumns = @JoinColumn(name = "step_id"))
  @Column(name = "tag")
  private List<String> behaviorTags = new ArrayList<>();

  @Column(length = 1000)
  private String immediateEffect;

  @Column(length = 1000)
  private String delayedEffect;

  private int relationshipChange;
  private int taskChange;

  @Column(length = 1000)
  private String evidence;

  @Column(length = 1000)
  private String characterReaction;

  private int timeConsumedMinutes;

  @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
  @CollectionTable(name = "experience_step_carry_over_issues", joinColumns = @JoinColumn(name = "step_id"))
  @Column(name = "issue_id")
  private List<String> carryOverIssueIds = new ArrayList<>();

  private boolean slotComplete;
  private boolean isFinalStep;

  private Instant createdAt = Instant.now();
}
