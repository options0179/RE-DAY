package com.reday.jobs;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobVariantRepository extends JpaRepository<JobVariant, String> {
  List<JobVariant> findByJobId(String jobId);
}
