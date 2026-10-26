package com.reday.sessions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.reday.ai.SceneAnalysisService;
import com.reday.ai.SceneAnalysisService.Consequence;
import com.reday.ai.SceneAnalysisService.ResponseAnalysis;
import com.reday.ai.SceneAnalysisService.SceneAnalysisResult;
import com.reday.auth.User;
import com.reday.auth.UserRepository;
import com.reday.common.ApiException;
import com.reday.jobs.JobCatalogRepository;
import com.reday.jobs.JobVariantRepository;
import com.reday.sessions.dto.SessionDtos.CreateSessionRequest;
import com.reday.sessions.dto.SessionDtos.RollbackRequest;
import com.reday.sessions.dto.SessionDtos.SessionView;
import com.reday.sessions.dto.SessionDtos.StepView;
import com.reday.sessions.dto.SessionDtos.SubmitStepRequest;
import com.reday.sessions.dto.SessionDtos.SummaryView;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;

@SpringBootTest
class SessionServiceTest {

  @Autowired
  private SessionService sessionService;
  @Autowired
  private UserRepository userRepository;
  @Autowired
  private JobCatalogRepository jobCatalogRepository;
  @Autowired
  private JobVariantRepository jobVariantRepository;

  @MockBean
  private SceneAnalysisService sceneAnalysisService;

  private Long userId;
  private String jobId;
  private String variantId;

  @BeforeEach
  void setUp() {
    User user = new User();
    user.setEmail("session-test-" + System.nanoTime() + "@example.com");
    user.setPasswordHash("unused");
    user.setEmailVerified(true);
    userId = userRepository.save(user).getId();

    // seeded by JobSeedData at application startup
    jobId = jobCatalogRepository.findAll().stream()
        .filter(job -> job.getName().equals("디자이너"))
        .findFirst().orElseThrow().getId();
    variantId = jobVariantRepository.findByJobId(jobId).get(0).getId();

    when(sceneAnalysisService.analyze(anyString(), anyString(), anyString())).thenReturn(new SceneAnalysisResult(
        new ResponseAnalysis(List.of("침착함"), "즉각 효과", null, 1, 0, "증거"),
        new Consequence("반응", 10, List.of(), false)));
  }

  @Test
  void totalStepsComesFromTheVariantNotAConstant() {
    SessionView session = sessionService.create(userId, new CreateSessionRequest(jobId, variantId));
    // 시드 데이터의 UX 디자이너 variant는 4단계 — "진행 N/4"가 상수가 아니라 variant에서 온 값임을 보증
    assertThat(session.totalSteps()).isEqualTo(4);
    assertThat(session.status()).isEqualTo("BRIEFING");
  }

  @Test
  void stateVersionConflictReturns409WithDetails() {
    SessionView session = sessionService.create(userId, new CreateSessionRequest(jobId, variantId));

    assertThatThrownBy(() -> sessionService.submitStep(userId, session.id(),
        new SubmitStepRequest(0, session.stateVersion() + 1, "확인하겠습니다")))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getStatus())
        .isEqualTo(HttpStatus.CONFLICT);
  }

  @Test
  void submittingAllStepsThenCompletingProducesASummary() {
    SessionView session = sessionService.create(userId, new CreateSessionRequest(jobId, variantId));
    int version = session.stateVersion();
    for (int i = 0; i < session.totalSteps(); i++) {
      StepView step = sessionService.submitStep(userId, session.id(), new SubmitStepRequest(i, version, "응답 " + i));
      version = step.session().stateVersion();
    }

    SummaryView summary = sessionService.complete(userId, session.id());
    assertThat(summary.sessionId()).isEqualTo(session.id());
    assertThat(sessionService.get(userId, session.id()).status()).isEqualTo("COMPLETED");
  }

  @Test
  void rollbackCreatesABranchThatKeepsTheOriginalIntact() {
    SessionView session = sessionService.create(userId, new CreateSessionRequest(jobId, variantId));
    StepView firstStep = sessionService.submitStep(userId, session.id(), new SubmitStepRequest(0, session.stateVersion(), "첫 응답"));

    SessionView branch = sessionService.rollback(userId, session.id(), new RollbackRequest(0));

    assertThat(branch.id()).isNotEqualTo(session.id());
    assertThat(branch.parentSessionId()).isEqualTo(session.id());
    assertThat(branch.currentStepIndex()).isZero();
    // 원본 세션은 그대로 1단계까지 진행된 상태를 유지한다
    assertThat(sessionService.get(userId, session.id()).currentStepIndex()).isEqualTo(1);
    assertThat(firstStep.outcome().characterReaction()).isEqualTo("반응");
  }
}
