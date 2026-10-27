package com.reday.sessions;

import com.reday.ai.SceneAnalysisService;
import com.reday.ai.SceneAnalysisService.SceneAnalysisResult;
import com.reday.common.ApiException;
import com.reday.jobs.JobCatalogEntry;
import com.reday.jobs.JobService;
import com.reday.jobs.JobVariant;
import com.reday.jobs.SituationTemplate;
import com.reday.sessions.dto.SessionDtos.AnalysisView;
import com.reday.sessions.dto.SessionDtos.ConflictView;
import com.reday.sessions.dto.SessionDtos.CreateSessionRequest;
import com.reday.sessions.dto.SessionDtos.OutcomeView;
import com.reday.sessions.dto.SessionDtos.RollbackRequest;
import com.reday.sessions.dto.SessionDtos.SessionView;
import com.reday.sessions.dto.SessionDtos.SituationView;
import com.reday.sessions.dto.SessionDtos.StepView;
import com.reday.sessions.dto.SessionDtos.SubmitStepRequest;
import com.reday.sessions.dto.SessionDtos.SummaryRequest;
import com.reday.sessions.dto.SessionDtos.SummaryView;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SessionService {

  private final ExperienceSessionRepository sessionRepository;
  private final ExperienceStepRepository stepRepository;
  private final ExperienceSummaryRepository summaryRepository;
  private final JobService jobService;
  private final SceneAnalysisService sceneAnalysisService;

  public SessionService(ExperienceSessionRepository sessionRepository, ExperienceStepRepository stepRepository,
      ExperienceSummaryRepository summaryRepository, JobService jobService, SceneAnalysisService sceneAnalysisService) {
    this.sessionRepository = sessionRepository;
    this.stepRepository = stepRepository;
    this.summaryRepository = summaryRepository;
    this.jobService = jobService;
    this.sceneAnalysisService = sceneAnalysisService;
  }

  @Transactional
  public SessionView create(Long userId, CreateSessionRequest request) {
    JobVariant variant = jobService.getVariant(request.variantId());
    if (!variant.getJobId().equals(request.jobId())) {
      throw ApiException.badRequest("variantId가 jobId에 속하지 않습니다");
    }
    JobCatalogEntry job = jobService.getJob(request.jobId());

    ExperienceSession session = new ExperienceSession();
    session.setId(UUID.randomUUID().toString());
    session.setOwnerId(userId);
    session.setJobId(job.getId());
    session.setVariantId(variant.getId());
    session.setStatus(SessionStatus.BRIEFING);
    session.setCurrentStepIndex(0);
    session.setTotalSteps(variant.getSituationTemplates().size());
    session.setStateVersion(1);
    sessionRepository.save(session);

    return toSessionView(session, job, variant);
  }

  /** Full step history for the chat timeline — GET /sessions/:id alone only carries the current situation. */
  @Transactional(readOnly = true)
  public List<StepView> listSteps(Long userId, String sessionId) {
    ExperienceSession session = requireOwned(userId, sessionId);
    return stepRepository.findBySessionIdOrderByStepIndexAsc(sessionId).stream()
        .map(step -> toStepView(step, session))
        .toList();
  }

  @Transactional(readOnly = true)
  public SessionView get(Long userId, String sessionId) {
    ExperienceSession session = requireOwned(userId, sessionId);
    JobCatalogEntry job = jobService.getJob(session.getJobId());
    JobVariant variant = jobService.getVariant(session.getVariantId());
    return toSessionView(session, job, variant);
  }

  @Transactional
  public void saveDraft(Long userId, String sessionId, String text) {
    ExperienceSession session = requireOwned(userId, sessionId);
    session.setDraftResponse(text);
    session.setUpdatedAt(Instant.now());
    sessionRepository.save(session);
  }

  @Transactional
  public StepView submitStep(Long userId, String sessionId, SubmitStepRequest request) {
    ExperienceSession session = requireOwned(userId, sessionId);

    if (session.getStateVersion() != request.expectedStateVersion()) {
      StepView latest = stepRepository.findBySessionIdAndStepIndex(sessionId, session.getCurrentStepIndex() - 1)
          .map(step -> toStepView(step, session))
          .orElse(null);
      throw new ApiException(org.springframework.http.HttpStatus.CONFLICT, "다른 요청이 먼저 처리되어 상태가 바뀌었습니다",
          new ConflictView(session.getStateVersion(), latest));
    }
    if (request.stepIndex() != session.getCurrentStepIndex()) {
      throw ApiException.badRequest("stepIndex가 현재 진행 단계와 일치하지 않습니다");
    }
    if (session.getCurrentStepIndex() >= session.getTotalSteps()) {
      throw ApiException.badRequest("이미 모든 상황에 응답했습니다");
    }

    JobCatalogEntry job = jobService.getJob(session.getJobId());
    JobVariant variant = jobService.getVariant(session.getVariantId());
    SituationTemplate template = variant.getSituationTemplates().get(session.getCurrentStepIndex());

    SceneAnalysisResult result = sceneAnalysisService.analyze(job.getName(), template.getNarrative(), request.responseText());

    ExperienceStep step = new ExperienceStep();
    step.setId(UUID.randomUUID().toString());
    step.setSessionId(session.getId());
    step.setStepIndex(session.getCurrentStepIndex());
    step.setSituationTitle(template.getTitle());
    step.setSituationNarrative(template.getNarrative());
    step.setTimePressure(template.getTimePressure());
    step.setResponseText(request.responseText());
    step.setSubmittedAt(Instant.now());
    applyAnalysis(step, result);
    step.setFinalStep(session.getCurrentStepIndex() == session.getTotalSteps() - 1);
    stepRepository.save(step);

    session.setCurrentStepIndex(session.getCurrentStepIndex() + 1);
    session.setStateVersion(session.getStateVersion() + 1);
    session.setDraftResponse(null);
    session.setStatus(SessionStatus.IN_PROGRESS);
    session.setUpdatedAt(Instant.now());
    sessionRepository.save(session);

    return toStepView(step, session);
  }

  @Transactional
  public SessionView rollback(Long userId, String sessionId, RollbackRequest request) {
    ExperienceSession original = requireOwned(userId, sessionId);
    if (request.toStepIndex() < 0 || request.toStepIndex() > original.getCurrentStepIndex()) {
      throw ApiException.badRequest("toStepIndex가 유효한 범위를 벗어났습니다");
    }

    ExperienceSession branch = new ExperienceSession();
    branch.setId(UUID.randomUUID().toString());
    branch.setOwnerId(userId);
    branch.setJobId(original.getJobId());
    branch.setVariantId(original.getVariantId());
    branch.setStatus(request.toStepIndex() == 0 ? SessionStatus.BRIEFING : SessionStatus.IN_PROGRESS);
    branch.setCurrentStepIndex(request.toStepIndex());
    branch.setTotalSteps(original.getTotalSteps());
    branch.setStateVersion(1);
    branch.setParentSessionId(original.getId());
    branch.setBranchFromStepIndex(request.toStepIndex());
    sessionRepository.save(branch);

    List<ExperienceStep> priorSteps = stepRepository.findBySessionIdOrderByStepIndexAsc(original.getId()).stream()
        .filter(step -> step.getStepIndex() < request.toStepIndex())
        .toList();
    for (ExperienceStep source : priorSteps) {
      ExperienceStep copy = new ExperienceStep();
      copy.setId(UUID.randomUUID().toString());
      copy.setSessionId(branch.getId());
      copy.setStepIndex(source.getStepIndex());
      copy.setSituationTitle(source.getSituationTitle());
      copy.setSituationNarrative(source.getSituationNarrative());
      copy.setTimePressure(source.getTimePressure());
      copy.setResponseText(source.getResponseText());
      copy.setSubmittedAt(source.getSubmittedAt());
      copy.setBehaviorTags(source.getBehaviorTags());
      copy.setImmediateEffect(source.getImmediateEffect());
      copy.setDelayedEffect(source.getDelayedEffect());
      copy.setRelationshipChange(source.getRelationshipChange());
      copy.setTaskChange(source.getTaskChange());
      copy.setEvidence(source.getEvidence());
      copy.setCharacterReaction(source.getCharacterReaction());
      copy.setTimeConsumedMinutes(source.getTimeConsumedMinutes());
      copy.setCarryOverIssueIds(source.getCarryOverIssueIds());
      copy.setSlotComplete(source.isSlotComplete());
      copy.setFinalStep(source.isFinalStep());
      stepRepository.save(copy);
    }

    JobCatalogEntry job = jobService.getJob(branch.getJobId());
    JobVariant variant = jobService.getVariant(branch.getVariantId());
    return toSessionView(branch, job, variant);
  }

  @Transactional
  public SummaryView complete(Long userId, String sessionId) {
    ExperienceSession session = requireOwned(userId, sessionId);
    if (session.getCurrentStepIndex() < session.getTotalSteps()) {
      throw ApiException.badRequest("모든 상황에 응답해야 완료할 수 있습니다");
    }

    Optional<ExperienceSummary> existing = summaryRepository.findById(sessionId);
    if (existing.isPresent()) {
      return toSummaryView(existing.get());
    }

    List<ExperienceStep> steps = stepRepository.findBySessionIdOrderByStepIndexAsc(sessionId);

    ExperienceSummary summary = new ExperienceSummary();
    summary.setSessionId(sessionId);
    summary.setTimelineSummary(steps.stream()
        .map(step -> (step.getStepIndex() + 1) + ". " + step.getSituationTitle() + " — " + step.getCharacterReaction())
        .collect(Collectors.joining("\n")));
    summary.setStrengths(steps.stream()
        .filter(step -> step.getRelationshipChange() >= 0)
        .map(ExperienceStep::getEvidence)
        .filter(text -> text != null && !text.isBlank())
        .limit(3)
        .toList());
    summary.setTryNext(steps.stream()
        .filter(step -> step.getRelationshipChange() < 0)
        .map(ExperienceStep::getEvidence)
        .filter(text -> text != null && !text.isBlank())
        .limit(3)
        .toList());
    summary.setAchievementTitles(steps.stream()
        .flatMap(step -> step.getBehaviorTags().stream())
        .distinct()
        .limit(3)
        .map(tag -> "행동 근거: " + tag)
        .toList());
    summaryRepository.save(summary);

    session.setStatus(SessionStatus.COMPLETED);
    session.setCompletedAt(Instant.now());
    session.setUpdatedAt(Instant.now());
    sessionRepository.save(session);

    return toSummaryView(summary);
  }

  @Transactional(readOnly = true)
  public SummaryView getSummary(Long userId, String sessionId) {
    requireOwned(userId, sessionId);
    return summaryRepository.findById(sessionId)
        .map(this::toSummaryView)
        .orElseThrow(() -> ApiException.notFound("아직 회고가 생성되지 않았습니다"));
  }

  @Transactional
  public SummaryView updateSummary(Long userId, String sessionId, SummaryRequest request) {
    requireOwned(userId, sessionId);
    ExperienceSummary summary = summaryRepository.findById(sessionId)
        .orElseThrow(() -> ApiException.badRequest("먼저 체험을 완료해주세요"));
    summary.setUserReflection(request.userReflection());
    summary.setSavedAt(Instant.now());
    summaryRepository.save(summary);
    return toSummaryView(summary);
  }

  ExperienceSession requireOwned(Long userId, String sessionId) {
    ExperienceSession session = sessionRepository.findById(sessionId)
        .orElseThrow(() -> ApiException.notFound("세션을 찾을 수 없습니다"));
    if (!session.getOwnerId().equals(userId)) {
      throw ApiException.notFound("세션을 찾을 수 없습니다");
    }
    return session;
  }

  private void applyAnalysis(ExperienceStep step, SceneAnalysisResult result) {
    step.setBehaviorTags(result.analysis().behaviorTags());
    step.setImmediateEffect(result.analysis().immediateEffect());
    step.setDelayedEffect(result.analysis().delayedEffect());
    step.setRelationshipChange(result.analysis().relationshipChange());
    step.setTaskChange(result.analysis().taskChange());
    step.setEvidence(result.analysis().evidence());
    step.setCharacterReaction(result.consequence().characterReaction());
    step.setTimeConsumedMinutes(result.consequence().timeConsumedMinutes());
    step.setCarryOverIssueIds(result.consequence().carryOverIssueIds());
    step.setSlotComplete(result.consequence().slotComplete());
  }

  private SessionView toSessionView(ExperienceSession session, JobCatalogEntry job, JobVariant variant) {
    SituationView currentSituation = null;
    if (session.getStatus() != SessionStatus.COMPLETED && session.getStatus() != SessionStatus.ABANDONED
        && session.getCurrentStepIndex() < variant.getSituationTemplates().size()) {
      SituationTemplate template = variant.getSituationTemplates().get(session.getCurrentStepIndex());
      currentSituation = new SituationView(template.getTitle(), template.getNarrative(), template.getTimePressure());
    }
    return new SessionView(
        session.getId(), session.getStatus().name(), job.getId(), job.getName(), variant.getId(),
        variant.getWorldTitle(), variant.getRoleDescription(), session.getDraftResponse(),
        session.getCurrentStepIndex(), session.getTotalSteps(), session.getStateVersion(),
        session.getParentSessionId(), currentSituation, session.getStartedAt(), session.getUpdatedAt(),
        session.getCompletedAt());
  }

  private StepView toStepView(ExperienceStep step, ExperienceSession session) {
    JobCatalogEntry job = jobService.getJob(session.getJobId());
    JobVariant variant = jobService.getVariant(session.getVariantId());
    SituationView situation = new SituationView(step.getSituationTitle(), step.getSituationNarrative(), step.getTimePressure());
    AnalysisView analysis = new AnalysisView(step.getBehaviorTags(), step.getImmediateEffect(), step.getDelayedEffect(),
        step.getRelationshipChange(), step.getTaskChange(), step.getEvidence());
    OutcomeView outcome = new OutcomeView(step.getCharacterReaction(), step.getTimeConsumedMinutes(),
        step.getCarryOverIssueIds(), step.isSlotComplete(), step.isFinalStep());
    return new StepView(step.getId(), step.getSessionId(), step.getStepIndex(), situation, step.getResponseText(),
        step.getSubmittedAt(), analysis, outcome, toSessionView(session, job, variant));
  }

  private SummaryView toSummaryView(ExperienceSummary summary) {
    return new SummaryView(summary.getSessionId(), summary.getTimelineSummary(), summary.getStrengths(),
        summary.getTryNext(), summary.getUserReflection(), summary.getAchievementTitles(), summary.getSavedAt());
  }
}
