package com.reday.jobs;

import com.reday.jobs.dto.JobDtos.JobSummary;
import com.reday.jobs.dto.JobDtos.JobVariantSummary;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/jobs")
public class JobController {

  private final JobService jobService;

  public JobController(JobService jobService) {
    this.jobService = jobService;
  }

  @GetMapping
  public List<JobSummary> search(@RequestParam(required = false) String query) {
    return jobService.search(query).stream().map(JobSummary::from).toList();
  }

  @GetMapping("/popular")
  public List<JobSummary> popular() {
    return jobService.popular().stream().map(JobSummary::from).toList();
  }

  @GetMapping("/{jobId}/variants")
  public List<JobVariantSummary> variants(@PathVariable String jobId) {
    return jobService.variantsOf(jobId).stream().map(JobVariantSummary::from).toList();
  }
}
