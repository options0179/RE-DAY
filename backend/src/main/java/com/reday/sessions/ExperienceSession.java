package com.reday.sessions;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "experience_sessions")
@Getter
@Setter
@NoArgsConstructor
public class ExperienceSession {

  @Id
  private String id;

  private Long ownerId;
  private String jobId;
  private String variantId;

  @Enumerated(EnumType.STRING)
  private SessionStatus status = SessionStatus.BRIEFING;

  private int currentStepIndex = 0;

  /** Confirmed once, at creation, from the variant's situationTemplates — never recalculated. */
  private int totalSteps;

  @Column(length = 2000)
  private String draftResponse;

  // Client-visible stale-write token, checked by SessionService; JPA does not use @Version locking here.
  private int stateVersion = 1;

  private String parentSessionId;
  private Integer branchFromStepIndex;

  private Instant startedAt = Instant.now();
  private Instant updatedAt = Instant.now();
  private Instant completedAt;
}
