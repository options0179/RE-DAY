package com.reday.jobs;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One row of the "하루 시작" briefing timeline (e.g. "09:00" / "사용자 의견 검토"). */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TaskTimelineEntry {
  private String time;
  private String label;
}
