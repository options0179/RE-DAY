package com.reday.sessions;

import com.reday.jobs.JobCatalogEntry;
import com.reday.jobs.JobService;
import com.reday.jobs.JobVariant;
import com.reday.sessions.dto.SessionDtos.ActiveSessionView;
import com.reday.sessions.dto.SessionDtos.HistoryItemView;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

/** Read-only projections shared by /home and /history — both render the same ExperienceSession rows, just filtered/sorted differently. */
@Service
public class SessionQueryService {

  private final ExperienceSessionRepository sessionRepository;
  private final ExperienceSummaryRepository summaryRepository;
  private final JobService jobService;

  public SessionQueryService(ExperienceSessionRepository sessionRepository, ExperienceSummaryRepository summaryRepository,
      JobService jobService) {
    this.sessionRepository = sessionRepository;
    this.summaryRepository = summaryRepository;
    this.jobService = jobService;
  }

  public ActiveSessionView activeSessionOf(Long userId) {
    return sessionRepository.findByOwnerIdOrderByUpdatedAtDesc(userId).stream()
        .filter(session -> session.getStatus() == SessionStatus.BRIEFING || session.getStatus() == SessionStatus.IN_PROGRESS)
        .findFirst()
        .map(this::toActiveSession)
        .orElse(null);
  }

  public List<HistoryItemView> recentRecordsOf(Long userId, int limit) {
    return sessionRepository.findByOwnerIdOrderByUpdatedAtDesc(userId).stream()
        .filter(session -> session.getStatus() == SessionStatus.COMPLETED)
        .limit(limit)
        .map(this::toHistoryItem)
        .toList();
  }

  public List<HistoryItemView> history(Long userId, String filter) {
    List<ExperienceSession> sessions = sessionRepository.findByOwnerIdOrderByUpdatedAtDesc(userId).stream()
        .filter(session -> session.getStatus() == SessionStatus.COMPLETED)
        .toList();
    if ("byJob".equals(filter)) {
      return sessions.stream()
          .sorted(Comparator.comparing((ExperienceSession session) -> jobService.getJob(session.getJobId()).getName())
              .thenComparing(ExperienceSession::getUpdatedAt, Comparator.reverseOrder()))
          .map(this::toHistoryItem)
          .toList();
    }
    // "all"과 "recent" 모두 최근 업데이트순 — 둘을 다른 정렬로 나눌 근거가 아직 없어 동일하게 둠.
    return sessions.stream().map(this::toHistoryItem).toList();
  }

  private ActiveSessionView toActiveSession(ExperienceSession session) {
    JobCatalogEntry job = jobService.getJob(session.getJobId());
    JobVariant variant = jobService.getVariant(session.getVariantId());
    return new ActiveSessionView(session.getId(), job.getName(), variant.getWorldTitle(), session.getCurrentStepIndex(),
        session.getTotalSteps());
  }

  private HistoryItemView toHistoryItem(ExperienceSession session) {
    JobCatalogEntry job = jobService.getJob(session.getJobId());
    JobVariant variant = jobService.getVariant(session.getVariantId());
    return new HistoryItemView(session.getId(), job.getId(), job.getName(), variant.getWorldTitle(),
        session.getStatus().name(), session.getCurrentStepIndex(), session.getTotalSteps(), session.getUpdatedAt(),
        session.getCompletedAt(), summaryRepository.existsById(session.getId()));
  }
}
