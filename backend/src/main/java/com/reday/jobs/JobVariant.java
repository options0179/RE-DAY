package com.reday.jobs;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "job_variants")
@Getter
@Setter
@NoArgsConstructor
public class JobVariant {

  @Id
  private String id;

  private String jobId;
  private String worldTitle;

  @jakarta.persistence.Column(length = 1000)
  private String roleDescription;

  // EAGER: always small, always read together with the variant, and read outside any
  // transaction boundary from controllers/DTO mappers — lazy would throw LazyInitializationException.
  @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
  @CollectionTable(name = "job_variant_task_timeline", joinColumns = @JoinColumn(name = "variant_id"))
  @OrderColumn(name = "entry_order")
  private List<TaskTimelineEntry> taskTimeline = new ArrayList<>();

  /** Length of this list IS totalSteps for any session created against this variant. */
  @ElementCollection(fetch = jakarta.persistence.FetchType.EAGER)
  @CollectionTable(name = "job_variant_situation_templates", joinColumns = @JoinColumn(name = "variant_id"))
  @OrderColumn(name = "step_order")
  private List<SituationTemplate> situationTemplates = new ArrayList<>();
}
