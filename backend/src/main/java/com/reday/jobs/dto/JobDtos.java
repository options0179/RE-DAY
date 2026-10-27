package com.reday.jobs.dto;

import com.reday.jobs.JobCatalogEntry;
import com.reday.jobs.JobVariant;
import java.util.List;

public final class JobDtos {
  private JobDtos() {
  }

  public record JobSummary(String id, String name, String category, String summary) {
    public static JobSummary from(JobCatalogEntry entry) {
      return new JobSummary(entry.getId(), entry.getName(), entry.getCategory(), entry.getSummary());
    }
  }

  public record TaskTimelineItem(String time, String label) {
  }

  public record JobVariantSummary(String id, String jobId, String worldTitle, String roleDescription,
      List<TaskTimelineItem> taskTimeline, int totalSteps) {
    public static JobVariantSummary from(JobVariant variant) {
      List<TaskTimelineItem> timeline = variant.getTaskTimeline().stream()
          .map(entry -> new TaskTimelineItem(entry.getTime(), entry.getLabel()))
          .toList();
      return new JobVariantSummary(variant.getId(), variant.getJobId(), variant.getWorldTitle(),
          variant.getRoleDescription(), timeline, variant.getSituationTemplates().size());
    }
  }
}
