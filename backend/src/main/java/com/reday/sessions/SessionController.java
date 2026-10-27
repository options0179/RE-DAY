package com.reday.sessions;

import com.reday.common.CurrentUserId;
import com.reday.sessions.dto.SessionDtos.CreateSessionRequest;
import com.reday.sessions.dto.SessionDtos.DraftRequest;
import com.reday.sessions.dto.SessionDtos.RetryStepRequest;
import com.reday.sessions.dto.SessionDtos.RollbackRequest;
import com.reday.sessions.dto.SessionDtos.SessionView;
import com.reday.sessions.dto.SessionDtos.StepView;
import com.reday.sessions.dto.SessionDtos.SubmitStepRequest;
import com.reday.sessions.dto.SessionDtos.SummaryRequest;
import com.reday.sessions.dto.SessionDtos.SummaryView;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/sessions")
public class SessionController {

  private final SessionService sessionService;

  public SessionController(SessionService sessionService) {
    this.sessionService = sessionService;
  }

  @PostMapping
  public ResponseEntity<SessionView> create(@CurrentUserId Long userId, @Valid @RequestBody CreateSessionRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.create(userId, request));
  }

  @GetMapping("/{sessionId}")
  public SessionView get(@CurrentUserId Long userId, @PathVariable String sessionId) {
    return sessionService.get(userId, sessionId);
  }

  @GetMapping("/{sessionId}/steps")
  public java.util.List<com.reday.sessions.dto.SessionDtos.StepView> listSteps(@CurrentUserId Long userId, @PathVariable String sessionId) {
    return sessionService.listSteps(userId, sessionId);
  }

  @PatchMapping("/{sessionId}/draft")
  public ResponseEntity<Void> saveDraft(@CurrentUserId Long userId, @PathVariable String sessionId, @RequestBody DraftRequest request) {
    sessionService.saveDraft(userId, sessionId, request.text());
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{sessionId}/steps")
  public ResponseEntity<StepView> submitStep(@CurrentUserId Long userId, @PathVariable String sessionId,
      @Valid @RequestBody SubmitStepRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.submitStep(userId, sessionId, request));
  }

  @PostMapping("/{sessionId}/steps/{stepIndex}/retry")
  public StepView retryStep(@CurrentUserId Long userId, @PathVariable String sessionId, @PathVariable int stepIndex,
      @Valid @RequestBody RetryStepRequest request) {
    SubmitStepRequest submit = new SubmitStepRequest(stepIndex, request.expectedStateVersion(), request.responseText());
    return sessionService.submitStep(userId, sessionId, submit);
  }

  @PostMapping("/{sessionId}/rollback")
  public ResponseEntity<SessionView> rollback(@CurrentUserId Long userId, @PathVariable String sessionId,
      @Valid @RequestBody RollbackRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(sessionService.rollback(userId, sessionId, request));
  }

  @PostMapping("/{sessionId}/complete")
  public SummaryView complete(@CurrentUserId Long userId, @PathVariable String sessionId) {
    return sessionService.complete(userId, sessionId);
  }

  @GetMapping("/{sessionId}/summary")
  public SummaryView getSummary(@CurrentUserId Long userId, @PathVariable String sessionId) {
    return sessionService.getSummary(userId, sessionId);
  }

  @PutMapping("/{sessionId}/summary")
  public SummaryView updateSummary(@CurrentUserId Long userId, @PathVariable String sessionId, @RequestBody SummaryRequest request) {
    return sessionService.updateSummary(userId, sessionId, request);
  }
}
