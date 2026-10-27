package com.reday.jobs;

import com.reday.common.ApiException;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class JobService {

  private final JobCatalogRepository jobRepository;
  private final JobVariantRepository variantRepository;

  public JobService(JobCatalogRepository jobRepository, JobVariantRepository variantRepository) {
    this.jobRepository = jobRepository;
    this.variantRepository = variantRepository;
  }

  public List<JobCatalogEntry> search(String query) {
    if (query == null || query.isBlank()) {
      return jobRepository.findAll();
    }
    String needle = query.trim().toLowerCase(Locale.KOREAN);
    return jobRepository.findAll().stream()
        .filter(job -> job.getName().toLowerCase(Locale.KOREAN).contains(needle)
            || job.getAliases().stream().anyMatch(alias -> alias.toLowerCase(Locale.KOREAN).contains(needle)))
        .toList();
  }

  public List<JobCatalogEntry> popular() {
    return jobRepository.findByPopularTrue();
  }

  public List<JobVariant> variantsOf(String jobId) {
    if (!jobRepository.existsById(jobId)) {
      throw ApiException.notFound("직업을 찾을 수 없습니다: " + jobId);
    }
    return variantRepository.findByJobId(jobId);
  }

  public JobVariant getVariant(String variantId) {
    return variantRepository.findById(variantId).orElseThrow(() -> ApiException.notFound("직업 variant를 찾을 수 없습니다: " + variantId));
  }

  public JobCatalogEntry getJob(String jobId) {
    return jobRepository.findById(jobId).orElseThrow(() -> ApiException.notFound("직업을 찾을 수 없습니다: " + jobId));
  }
}
