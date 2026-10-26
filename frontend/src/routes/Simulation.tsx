import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GeneratingIndicator, MessageBubble, ProgressBadge, SituationCard } from "../components/chat";
import { AppShell } from "../components/layout";
import { Banner, Button, TextArea } from "../components/ui";
import { api, ApiError } from "../lib/api";
import type { ApiConflictError, SessionView, StepView } from "../lib/types";

type ComposerStatus = "idle" | "generating" | "error" | "conflict";

export default function Simulation() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionView | null>(null);
  const [steps, setSteps] = useState<StepView[]>([]);
  const [briefingAcknowledged, setBriefingAcknowledged] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [composerStatus, setComposerStatus] = useState<ComposerStatus>("idle");
  const [conflict, setConflict] = useState<ApiConflictError["details"] | null>(null);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function loadAll() {
    if (!sessionId) return;
    const [sessionResponse, stepsResponse] = await Promise.all([api.sessions.get(sessionId), api.sessions.listSteps(sessionId)]);
    setSession(sessionResponse);
    setSteps(stepsResponse);
    setDraftText(sessionResponse.draftResponse ?? "");
    if (sessionResponse.status !== "BRIEFING") setBriefingAcknowledged(true);
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  function onDraftChange(value: string) {
    setDraftText(value);
    if (!session) return;
    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = setTimeout(() => {
      api.sessions.saveDraft(session.id, value).catch(() => {});
    }, 600);
  }

  async function handleSubmit() {
    if (!session || !draftText.trim()) return;
    setComposerStatus("generating");
    try {
      const step = await api.sessions.submitStep(session.id, {
        stepIndex: session.currentStepIndex,
        expectedStateVersion: session.stateVersion,
        responseText: draftText.trim(),
      });
      setSteps((prev) => [...prev, step]);
      setSession(step.session);
      setDraftText("");
      setComposerStatus("idle");
    } catch (e) {
      handleSubmitError(e);
    }
  }

  async function handleRetry() {
    if (!session) return;
    setComposerStatus("generating");
    try {
      const step = await api.sessions.retryStep(session.id, session.currentStepIndex, {
        expectedStateVersion: session.stateVersion,
        responseText: draftText.trim(),
      });
      setSteps((prev) => [...prev, step]);
      setSession(step.session);
      setDraftText("");
      setComposerStatus("idle");
    } catch (e) {
      handleSubmitError(e);
    }
  }

  function handleSubmitError(e: unknown) {
    if (e instanceof ApiError && e.status === 409) {
      setConflict((e.body as ApiConflictError).details);
      setComposerStatus("conflict");
    } else {
      setComposerStatus("error");
    }
  }

  async function handleResolveConflict() {
    setConflict(null);
    setComposerStatus("idle");
    await loadAll();
  }

  async function handleRollback(toStepIndex: number) {
    if (!session) return;
    const branch = await api.sessions.rollback(session.id, toStepIndex);
    navigate(`/simulation/${branch.id}`);
  }

  async function handleComplete() {
    if (!session) return;
    await api.sessions.complete(session.id);
    navigate(`/review/${session.id}`);
  }

  if (!session) {
    return (
      <AppShell title="하루 시작">
        <p>불러오는 중…</p>
      </AppShell>
    );
  }

  if (session.status === "COMPLETED") {
    return (
      <AppShell title={session.variantTitle}>
        <p>이미 완료된 체험이에요.</p>
        <Button onClick={() => navigate(`/review/${session.id}`)}>회고 보기</Button>
      </AppShell>
    );
  }

  const allStepsAnswered = session.currentStepIndex >= session.totalSteps;

  if (session.status === "BRIEFING" && !briefingAcknowledged) {
    return (
      <AppShell title={session.variantTitle}>
        <h2>{session.variantTitle}</h2>
        <div className="re-card" style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--re-ink-muted)" }}>나의 역할</div>
          <p>{session.roleDescription}</p>
        </div>
        <Button style={{ marginTop: 24 }} onClick={() => setBriefingAcknowledged(true)}>
          준비됐어요 · 첫 상황으로
        </Button>
      </AppShell>
    );
  }

  return (
    <AppShell title={session.variantTitle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>{session.variantTitle}</h2>
        <ProgressBadge current={Math.min(session.currentStepIndex + (allStepsAnswered ? 0 : 1), session.totalSteps)} total={session.totalSteps} />
      </div>

      <div className="re-chat" style={{ marginTop: 20 }}>
        {steps.map((step) => (
          <div key={step.id} className="re-chat">
            <MessageBubble align="left" tone="narration" speaker={step.situation.title}>
              {step.situation.narrative}
            </MessageBubble>
            <MessageBubble align="right" tone="mine" speaker="나">
              {step.responseText}
            </MessageBubble>
            <MessageBubble align="left" tone="outcome" speaker="결과">
              {step.outcome.characterReaction}
            </MessageBubble>
            <div>
              <Button variant="link" onClick={() => handleRollback(step.stepIndex)}>
                ↺ 이 상황부터 다시 선택하기
              </Button>
            </div>
          </div>
        ))}

        {allStepsAnswered ? (
          <div className="re-card">
            <p>모든 상황에 응답했어요. 하루를 마무리하고 회고를 남겨볼까요?</p>
            <Button onClick={handleComplete}>하루 회고하기</Button>
          </div>
        ) : (
          session.currentSituation && (
            <>
              <SituationCard situation={session.currentSituation} />

              <div className="re-composer">
                <span style={{ fontSize: 13, fontWeight: 600 }}>내 행동 / 대답 입력</span>

                {composerStatus === "conflict" && conflict ? (
                  <Banner danger>
                    다른 기기나 탭에서 먼저 진행된 변경이 있어요. 최신 상태를 불러와야 계속할 수 있어요.
                    <div style={{ marginTop: 8 }}>
                      <Button variant="ghost" onClick={handleResolveConflict}>
                        최신 상태로 새로고침
                      </Button>
                    </div>
                  </Banner>
                ) : null}

                {composerStatus === "error" ? (
                  <Banner danger>
                    응답을 반영하지 못했어요. 입력한 내용은 그대로 남아있어요.
                    <div style={{ marginTop: 8 }}>
                      <Button onClick={handleRetry}>다시 보내기</Button>
                    </div>
                  </Banner>
                ) : null}

                {composerStatus === "generating" ? (
                  <GeneratingIndicator />
                ) : (
                  <div className="re-composer__row">
                    <TextArea
                      value={draftText}
                      onChange={(e) => onDraftChange(e.target.value)}
                      placeholder="예: 문제의 영향과 수정 범위를 먼저 확인하겠습니다."
                      disabled={composerStatus === "conflict"}
                    />
                    <Button onClick={handleSubmit} disabled={!draftText.trim() || composerStatus === "conflict"}>
                      이렇게 대응할게요
                    </Button>
                  </div>
                )}

                <Button variant="link" onClick={() => navigate("/home")}>
                  잠시 나가기 → 홈에서 이어하기
                </Button>
              </div>
            </>
          )
        )}
      </div>
    </AppShell>
  );
}
