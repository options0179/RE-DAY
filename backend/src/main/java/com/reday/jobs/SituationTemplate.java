package com.reday.jobs;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * One fixed "상황 대응" step a variant presents, in order. The number of templates IS the
 * session's totalSteps — different variants have different counts, so progress ("N / M") is
 * never a hardcoded constant. See docs/dev/frontend-backend-contract.md §5.
 */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SituationTemplate {
  private String title;

  @jakarta.persistence.Column(length = 2000)
  private String narrative;

  private String timePressure;
}
