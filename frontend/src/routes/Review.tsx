import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Button, Card, TextArea } from "../components/ui";
import { api } from "../lib/api";
import type { SummaryView } from "../lib/types";

export default function Review() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<SummaryView | null>(null);
  const [reflection, setReflection] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    api.sessions.getSummary(sessionId).then((value) => {
      setSummary(value);
      setReflection(value.userReflection ?? "");
    });
  }, [sessionId]);

  async function handleSave() {
    if (!sessionId) return;
    const updated = await api.sessions.updateSummary(sessionId, reflection);
    setSummary(updated);
    setSaved(true);
  }

  if (!summary) {
    return (
      <AppShell title="하루 회고">
        <p>불러오는 중…</p>
      </AppShell>
    );
  }

  return (
    <AppShell title="하루 회고">
      <h2>오늘의 나는 어땠을까요?</h2>

      <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
        <Card style={{ flex: "1 1 300px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--re-ink-muted)" }}>하루 요약</div>
          <p style={{ whiteSpace: "pre-line" }}>{summary.timelineSummary}</p>
        </Card>
        <Card style={{ flex: "1 1 300px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--re-ink-muted)" }}>잘한 선택 / 다음에 시도할 점</div>
          <ul>
            {summary.strengths.map((item, i) => (
              <li key={`s-${i}`}>{item}</li>
            ))}
            {summary.tryNext.map((item, i) => (
              <li key={`t-${i}`} style={{ color: "var(--re-ink-muted)" }}>
                {item}
              </li>
            ))}
          </ul>
          {summary.achievementTitles.length ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--re-ink-muted)", marginTop: 12 }}>업적</div>
              <ul>
                {summary.achievementTitles.map((title, i) => (
                  <li key={i}>{title}</li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--re-ink-muted)" }}>나의 한 줄 회고</div>
        <TextArea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="이 직업을 경험해 보니 어떤 생각이 들었나요?"
          style={{ width: "100%", marginTop: 8 }}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
        <Button onClick={handleSave}>회고 저장하기</Button>
        {saved ? <Button variant="ghost" onClick={() => navigate("/history")}>체험 기록으로</Button> : null}
      </div>
    </AppShell>
  );
}
