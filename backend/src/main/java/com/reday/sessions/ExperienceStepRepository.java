package com.reday.sessions;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperienceStepRepository extends JpaRepository<ExperienceStep, String> {
  List<ExperienceStep> findBySessionIdOrderByStepIndexAsc(String sessionId);

  Optional<ExperienceStep> findBySessionIdAndStepIndex(String sessionId, int stepIndex);
}
