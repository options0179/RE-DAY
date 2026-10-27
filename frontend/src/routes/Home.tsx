import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Button, Card } from "../components/ui";
import { api } from "../lib/api";
import type { HomeSummaryView } from "../lib/types";

export default function Home() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<HomeSummaryView | null>(null);
  const [showContinueModal, setShowContinueModal] = useState(false);

  useEffect(() => {
    api.home.summary().then(setSummary);
  }, []);

  function handleStartNewExperience() {
    if (summary?.activeSession) {
      setShowContinueModal(true);
      return;
    }
    navigate("/jobs");
  }

  return (
    <AppShell title="홈">
      <h2>오늘은 어떤 하루를 살아볼까요?</h2>
      <Button onClick={handleStartNewExperience} style={{ marginTop: 8 }}>
        새로운 직업 체험 시작
      </Button>

      <div style={{ display: "flex", gap: 20, marginTop: 32, flexWrap: "wrap" }}>
        {summary?.activeSession ? (
          <Card className="re-active-session" style={{ flex: "2 1 320px" }}>
            <div style={{ fontSize: 13, color: "var(--re-ink-muted)", fontWeight: 600 }}>진행 중인 체험</div>
            <div style={{ fontSize: 22, fontWeight: 700, margin: "8px 0" }}>{summary.activeSession.jobName}</div>
            <div style={{ color: "var(--re-ink-muted)" }}>
              {summary.activeSession.variantTitle} · 진행 {summary.activeSession.currentStepIndex} / {summary.activeSession.totalSteps}
            </div>
            <Button style={{ marginTop: 16 }} onClick={() => navigate(`/simulation/${summary.activeSession!.sessionId}`)}>
              이어하기
            </Button>
          </Card>
        ) : null}

        {summary?.recentRecords.length ? (
          <Card style={{ flex: "1 1 240px" }}>
            <div style={{ fontSize: 13, color: "var(--re-ink-muted)", fontWeight: 600 }}>최근 체험 기록</div>
            {summary.recentRecords.slice(0, 1).map((record) => (
              <div key={record.sessionId} style={{ marginTop: 8 }}>
                <div style={{ fontWeight: 700 }}>{record.jobName}</div>
                <div style={{ color: "var(--re-ink-muted)", fontSize: 13 }}>체험 완료</div>
                <Button variant="link" onClick={() => navigate(`/review/${record.sessionId}`)}>
                  회고 보기
                </Button>
              </div>
            ))}
          </Card>
        ) : null}
      </div>

      <p style={{ marginTop: 32, color: "var(--re-ink-muted)", fontSize: 13 }}>
        관심 직업이 없더라도 직접 입력하며 탐색할 수 있어요.
      </p>

      {showContinueModal && summary?.activeSession ? (
        <div className="re-modal-overlay" style={overlayStyle}>
          <Card style={{ maxWidth: 420 }}>
            <h3>체험을 이어서 시작할까요?</h3>
            <p style={{ color: "var(--re-ink-muted)" }}>
              진행 중인 {summary.activeSession.jobName} 체험이 있어요. 이어서 진행하거나 새로운 직업으로 다시 시작할 수 있어요.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <Button onClick={() => navigate(`/simulation/${summary.activeSession!.sessionId}`)}>이어하기</Button>
              <Button variant="ghost" onClick={() => { setShowContinueModal(false); navigate("/jobs"); }}>
                새로운 직업으로 시작
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(65, 55, 47, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
