package com.reday.sessions;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "experience_summaries")
@Getter
@Setter
@NoArgsConstructor
public class ExperienceSummary {

  @Id
  private String sessionId;

  @Column(length = 2000)
  private String timelineSummary;

  @ElementCollection
  @CollectionTable(name = "experience_summary_strengths", joinColumns = @JoinColumn(name = "session_id"))
  @Column(name = "strength", length = 1000)
  private List<String> strengths = new ArrayList<>();

  @ElementCollection
  @CollectionTable(name = "experience_summary_try_next", joinColumns = @JoinColumn(name = "session_id"))
  @Column(name = "try_next", length = 1000)
  private List<String> tryNext = new ArrayList<>();

  @Column(length = 2000)
  private String userReflection;

  @ElementCollection
  @CollectionTable(name = "experience_summary_achievements", joinColumns = @JoinColumn(name = "session_id"))
  @Column(name = "title", length = 500)
  private List<String> achievementTitles = new ArrayList<>();

  private Instant savedAt = Instant.now();
}
