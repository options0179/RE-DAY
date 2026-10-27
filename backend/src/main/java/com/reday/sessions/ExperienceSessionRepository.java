package com.reday.sessions;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExperienceSessionRepository extends JpaRepository<ExperienceSession, String> {
  List<ExperienceSession> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);

  Optional<ExperienceSession> findFirstByOwnerIdAndStatusOrderByUpdatedAtDesc(Long ownerId, SessionStatus status);
}
