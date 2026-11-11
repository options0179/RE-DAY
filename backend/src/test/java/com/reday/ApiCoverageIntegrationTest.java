package com.reday;

import static org.assertj.core.api.Assertions.assertThat;

import com.reday.ai.SceneAnalysisService;
import com.reday.ai.SceneAnalysisService.Consequence;
import com.reday.ai.SceneAnalysisService.ResponseAnalysis;
import com.reday.ai.SceneAnalysisService.SceneAnalysisResult;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * Exercises every endpoint in docs/dev/frontend-backend-contract.md over real HTTP (not the service
 * layer) — routing, status codes, auth, and JSON shapes all go through the actual Spring MVC
 * stack. SceneAnalysisService is mocked so this never depends on the live, occasionally slow
 * Gemini API; GeminiClient/prompt-loading wiring is still exercised indirectly by
 * SessionServiceTest staying green with the real beans constructed.
 */
@SuppressWarnings("unchecked")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiCoverageIntegrationTest {

  @LocalServerPort
  private int port;

  @Autowired
  private TestRestTemplate rest;

  @MockBean
  private SceneAnalysisService sceneAnalysisService;

  private String url(String path) {
    return "http://localhost:" + port + path;
  }

  private HttpHeaders authHeaders(String token) {
    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(token);
    return headers;
  }

  private record RegisteredUser(String email, String accessToken, Long userId) {
  }

  private RegisteredUser signUpVerifyAndLogIn(String emailPrefix) {
    String email = emailPrefix + "-" + System.nanoTime() + "@example.com";

    ResponseEntity<Map> signup = rest.postForEntity(
        url("/auth/signup"), Map.of("email", email, "password", "password123", "displayName", "통합테스트"), Map.class);
    assertThat(signup.getStatusCode()).isEqualTo(HttpStatus.ACCEPTED);
    String verificationToken = (String) signup.getBody().get("devVerificationToken");
    assertThat(verificationToken).isNotBlank();

    ResponseEntity<Void> verify = rest.postForEntity(url("/auth/verify-email"), Map.of("token", verificationToken), Void.class);
    assertThat(verify.getStatusCode()).isEqualTo(HttpStatus.OK);

    ResponseEntity<Map> login = rest.postForEntity(url("/auth/login"), Map.of("email", email, "password", "password123"), Map.class);
    assertThat(login.getStatusCode()).isEqualTo(HttpStatus.OK);
    String accessToken = (String) login.getBody().get("accessToken");
    Map<String, Object> user = (Map<String, Object>) login.getBody().get("user");
    assertThat((Boolean) user.get("emailVerified")).isTrue();

    return new RegisteredUser(email, accessToken, ((Number) user.get("id")).longValue());
  }

  @Test
  void healthEndpointReportsOk() {
    ResponseEntity<Map> health = rest.getForEntity(url("/health"), Map.class);
    assertThat(health.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(health.getBody().get("ok")).isEqualTo(true);
  }

  @Test
  void fullJourneyExercisesEveryEndpoint() {
    stubSceneAnalysis();

    // --- auth: signup / verify-email / login / consent ---
    RegisteredUser user = signUpVerifyAndLogIn("journey");

    ResponseEntity<Void> consent = rest.exchange(url("/auth/consent"), HttpMethod.POST,
        new HttpEntity<>(Map.of("version", "v1"), authHeaders(user.accessToken())), Void.class);
    assertThat(consent.getStatusCode()).isEqualTo(HttpStatus.OK);

    // --- home: empty before any session ---
    ResponseEntity<Map> homeBefore = rest.exchange(url("/home/summary"), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), Map.class);
    assertThat(homeBefore.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(homeBefore.getBody().get("activeSession")).isNull();
    assertThat((List<?>) homeBefore.getBody().get("recentRecords")).isEmpty();

    // --- jobs: search / popular / variants ---
    ResponseEntity<List> popular = rest.exchange(url("/jobs/popular"), HttpMethod.GET, HttpEntity.EMPTY, List.class);
    assertThat(popular.getStatusCode()).isEqualTo(HttpStatus.OK);
    Map<String, Object> designerJob = ((List<Map<String, Object>>) popular.getBody()).stream()
        .filter(job -> "디자이너".equals(job.get("name")))
        .findFirst().orElseThrow();
    String jobId = (String) designerJob.get("id");

    ResponseEntity<List> search = rest.exchange(url("/jobs?query=디자이너"), HttpMethod.GET, HttpEntity.EMPTY, List.class);
    assertThat(search.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat((List<Map<String, Object>>) search.getBody()).anyMatch(job -> job.get("id").equals(jobId));

    ResponseEntity<List> variants = rest.exchange(url("/jobs/" + jobId + "/variants"), HttpMethod.GET, HttpEntity.EMPTY, List.class);
    assertThat(variants.getStatusCode()).isEqualTo(HttpStatus.OK);
    Map<String, Object> variant = ((List<Map<String, Object>>) variants.getBody()).get(0);
    String variantId = (String) variant.get("id");
    int totalSteps = ((Number) variant.get("totalSteps")).intValue();
    assertThat(totalSteps).isGreaterThan(0);

    // --- sessions: create / get / draft / steps(list) ---
    ResponseEntity<Map> created = rest.exchange(url("/sessions"), HttpMethod.POST,
        new HttpEntity<>(Map.of("jobId", jobId, "variantId", variantId), authHeaders(user.accessToken())), Map.class);
    assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    String sessionId = (String) created.getBody().get("id");
    assertThat(created.getBody().get("status")).isEqualTo("BRIEFING");
    assertThat(((Number) created.getBody().get("totalSteps")).intValue()).isEqualTo(totalSteps);
    int stateVersion = ((Number) created.getBody().get("stateVersion")).intValue();

    ResponseEntity<Map> fetched = rest.exchange(url("/sessions/" + sessionId), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), Map.class);
    assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);

    ResponseEntity<Void> draft = rest.exchange(url("/sessions/" + sessionId + "/draft"), HttpMethod.PATCH,
        new HttpEntity<>(Map.of("text", "작성 중인 응답"), authHeaders(user.accessToken())), Void.class);
    assertThat(draft.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

    ResponseEntity<List> stepsBeforeAnswering = rest.exchange(url("/sessions/" + sessionId + "/steps"), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), List.class);
    assertThat(stepsBeforeAnswering.getBody()).isEmpty();

    // --- sessions/steps: conflict (409) on a stale expectedStateVersion ---
    ResponseEntity<Map> conflictResponse = rest.exchange(url("/sessions/" + sessionId + "/steps"), HttpMethod.POST,
        new HttpEntity<>(Map.of("stepIndex", 0, "expectedStateVersion", stateVersion + 99, "responseText", "충돌 테스트"),
            authHeaders(user.accessToken())),
        Map.class);
    assertThat(conflictResponse.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    Map<String, Object> conflictDetails = (Map<String, Object>) conflictResponse.getBody().get("details");
    assertThat(((Number) conflictDetails.get("currentStateVersion")).intValue()).isEqualTo(stateVersion);

    // --- sessions/steps: submit step 0 for real ---
    Map<String, Object> step0 = submitStep(sessionId, user.accessToken(), 0, stateVersion, "첫 번째 응답입니다.");
    stateVersion = currentStateVersion(step0);
    assertThat(((Number) step0.get("stepIndex")).intValue()).isZero();
    assertThat(((Map<String, Object>) step0.get("outcome")).get("characterReaction")).isEqualTo("테스트 반응");

    // --- sessions/steps/{index}/retry: exercised explicitly for step 1 ---
    if (totalSteps > 1) {
      Map<String, Object> retried = retryStep(sessionId, user.accessToken(), 1, stateVersion, "재시도 경로로 제출한 응답");
      stateVersion = currentStateVersion(retried);
    }

    // --- submit remaining steps (if any) through the normal endpoint ---
    for (int i = 2; i < totalSteps; i++) {
      Map<String, Object> step = submitStep(sessionId, user.accessToken(), i, stateVersion, "응답 " + i);
      stateVersion = currentStateVersion(step);
    }

    ResponseEntity<List> stepsAfterAnswering = rest.exchange(url("/sessions/" + sessionId + "/steps"), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), List.class);
    assertThat(stepsAfterAnswering.getBody()).hasSize(totalSteps);

    // --- sessions/rollback: branch from a fresh session, verify the original is untouched ---
    ResponseEntity<Map> secondSession = rest.exchange(url("/sessions"), HttpMethod.POST,
        new HttpEntity<>(Map.of("jobId", jobId, "variantId", variantId), authHeaders(user.accessToken())), Map.class);
    String secondSessionId = (String) secondSession.getBody().get("id");
    submitStep(secondSessionId, user.accessToken(), 0, 1, "되돌리기 테스트용 응답");

    ResponseEntity<Map> rollback = rest.exchange(url("/sessions/" + secondSessionId + "/rollback"), HttpMethod.POST,
        new HttpEntity<>(Map.of("toStepIndex", 0), authHeaders(user.accessToken())), Map.class);
    assertThat(rollback.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    assertThat(rollback.getBody().get("parentSessionId")).isEqualTo(secondSessionId);
    assertThat(((Number) rollback.getBody().get("currentStepIndex")).intValue()).isZero();
    String branchSessionId = (String) rollback.getBody().get("id");

    ResponseEntity<Map> originalStillAt1 = rest.exchange(url("/sessions/" + secondSessionId), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), Map.class);
    assertThat(((Number) originalStillAt1.getBody().get("currentStepIndex")).intValue()).isEqualTo(1);

    // --- sessions/complete + summary (GET/PUT) ---
    ResponseEntity<Map> completed = rest.exchange(url("/sessions/" + sessionId + "/complete"), HttpMethod.POST,
        new HttpEntity<>(authHeaders(user.accessToken())), Map.class);
    assertThat(completed.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(completed.getBody().get("sessionId")).isEqualTo(sessionId);

    ResponseEntity<Map> summaryFetched = rest.exchange(url("/sessions/" + sessionId + "/summary"), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), Map.class);
    assertThat(summaryFetched.getStatusCode()).isEqualTo(HttpStatus.OK);

    ResponseEntity<Map> summaryUpdated = rest.exchange(url("/sessions/" + sessionId + "/summary"), HttpMethod.PUT,
        new HttpEntity<>(Map.of("userReflection", "한 줄 회고입니다"), authHeaders(user.accessToken())), Map.class);
    assertThat(summaryUpdated.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(summaryUpdated.getBody().get("userReflection")).isEqualTo("한 줄 회고입니다");

    // --- history: all / byJob filters ---
    ResponseEntity<List> historyAll = rest.exchange(url("/history?filter=all"), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), List.class);
    assertThat(historyAll.getBody()).anyMatch(item -> ((Map<?, ?>) item).get("sessionId").equals(sessionId));

    ResponseEntity<List> historyByJob = rest.exchange(url("/history?filter=byJob"), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), List.class);
    assertThat(historyByJob.getStatusCode()).isEqualTo(HttpStatus.OK);

    // --- home: completed session now shows up in recentRecords, in-progress one is activeSession ---
    ResponseEntity<Map> homeAfter = rest.exchange(url("/home/summary"), HttpMethod.GET,
        new HttpEntity<>(authHeaders(user.accessToken())), Map.class);
    assertThat((List<Map<String, Object>>) homeAfter.getBody().get("recentRecords"))
        .anyMatch(item -> item.get("sessionId").equals(sessionId));
    assertThat(homeAfter.getBody().get("activeSession")).isNotNull();
    // 가장 최근에 업데이트된 "진행 중" 세션이 와야 함 — second session 또는 거기서 갈라진 branch 둘 다 후보.
    assertThat(((Map<String, Object>) homeAfter.getBody().get("activeSession")).get("sessionId"))
        .isIn(secondSessionId, branchSessionId);
  }

  @Test
  void accessControlRejectsUnauthenticatedAndCrossUserRequests() {
    stubSceneAnalysis();
    RegisteredUser owner = signUpVerifyAndLogIn("owner");
    RegisteredUser stranger = signUpVerifyAndLogIn("stranger");

    List<Map<String, Object>> popular = rest.exchange(url("/jobs/popular"), HttpMethod.GET, HttpEntity.EMPTY, List.class).getBody();
    String jobId = (String) popular.get(0).get("id");
    List<Map<String, Object>> variants = rest.exchange(url("/jobs/" + jobId + "/variants"), HttpMethod.GET, HttpEntity.EMPTY, List.class)
        .getBody();
    String variantId = (String) variants.get(0).get("id");

    ResponseEntity<Map> session = rest.exchange(url("/sessions"), HttpMethod.POST,
        new HttpEntity<>(Map.of("jobId", jobId, "variantId", variantId), authHeaders(owner.accessToken())), Map.class);
    String sessionId = (String) session.getBody().get("id");

    // no Authorization header at all
    ResponseEntity<Map> noAuth = rest.exchange(url("/sessions/" + sessionId), HttpMethod.GET, HttpEntity.EMPTY, Map.class);
    assertThat(noAuth.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);

    // a different, fully logged-in user must not be able to read someone else's session
    ResponseEntity<Map> wrongOwner = rest.exchange(url("/sessions/" + sessionId), HttpMethod.GET,
        new HttpEntity<>(authHeaders(stranger.accessToken())), Map.class);
    assertThat(wrongOwner.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

    // duplicate signup with the same email must be rejected
    ResponseEntity<Map> duplicateSignup = rest.postForEntity(url("/auth/signup"),
        Map.of("email", owner.email(), "password", "password123", "displayName", "dup"), Map.class);
    assertThat(duplicateSignup.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

    // wrong password
    ResponseEntity<Map> badLogin = rest.postForEntity(url("/auth/login"),
        Map.of("email", owner.email(), "password", "not-the-password"), Map.class);
    assertThat(badLogin.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
  }

  private Map<String, Object> submitStep(String sessionId, String accessToken, int stepIndex, int expectedStateVersion, String responseText) {
    ResponseEntity<Map> response = rest.exchange(url("/sessions/" + sessionId + "/steps"), HttpMethod.POST,
        new HttpEntity<>(Map.of("stepIndex", stepIndex, "expectedStateVersion", expectedStateVersion, "responseText", responseText),
            authHeaders(accessToken)),
        Map.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    return response.getBody();
  }

  private Map<String, Object> retryStep(String sessionId, String accessToken, int stepIndex, int expectedStateVersion, String responseText) {
    ResponseEntity<Map> response = rest.exchange(url("/sessions/" + sessionId + "/steps/" + stepIndex + "/retry"), HttpMethod.POST,
        new HttpEntity<>(Map.of("expectedStateVersion", expectedStateVersion, "responseText", responseText), authHeaders(accessToken)),
        Map.class);
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    return response.getBody();
  }

  private int currentStateVersion(Map<String, Object> stepBody) {
    Map<String, Object> session = (Map<String, Object>) stepBody.get("session");
    return ((Number) session.get("stateVersion")).intValue();
  }

  private void stubSceneAnalysis() {
    org.mockito.Mockito.when(sceneAnalysisService.analyze(org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString()))
        .thenReturn(new SceneAnalysisResult(
            new ResponseAnalysis(new ArrayList<>(List.of("침착함")), "즉각 효과", null, 1, 0, "증거"),
            new Consequence("테스트 반응", 10, new ArrayList<>(), false)));
  }
}
