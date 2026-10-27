package com.reday.jobs;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobCatalogRepository extends JpaRepository<JobCatalogEntry, String> {
  List<JobCatalogEntry> findByPopularTrue();

  List<JobCatalogEntry> findByNameContainingIgnoreCase(String query);
}
