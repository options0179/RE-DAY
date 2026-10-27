import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Button, Chip } from "../components/ui";
import { api } from "../lib/api";
import type { HistoryItemView } from "../lib/types";

const FILTERS = [
  { key: "all", label: "전체" },
  { key: "byJob", label: "직업별" },
  { key: "recent", label: "최근순" },
] as const;

export default function History() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");
  const [items, setItems] = useState<HistoryItemView[]>([]);

  useEffect(() => {
    api.history.list(filter).then(setItems);
  }, [filter]);

  return (
    <AppShell title="체험 기록">
      <h2>내가 경험한 하루들</h2>

      <div style={{ display: "flex", gap: 8, margin: "16px 0" }}>
        {FILTERS.map((item) => (
          <Chip key={item.key} pressed={filter === item.key} onClick={() => setFilter(item.key)}>
            {item.label}
          </Chip>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((item) => (
          <div key={item.sessionId} className="re-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700 }}>{item.jobName}</div>
              <div style={{ color: "var(--re-ink-muted)", fontSize: 13 }}>{item.variantTitle} · 상황 {item.totalSteps}개 완료</div>
            </div>
            {item.summaryAvailable ? (
              <Button variant="link" onClick={() => navigate(`/review/${item.sessionId}`)}>
                회고 보기
              </Button>
            ) : null}
          </div>
        ))}
        {items.length === 0 ? <p style={{ color: "var(--re-ink-muted)" }}>아직 완료한 체험이 없어요.</p> : null}
      </div>

      <p style={{ marginTop: 24, fontSize: 13, color: "var(--re-ink-muted)" }}>
        체험 기록은 점수 경쟁보다 선택과 생각의 변화를 보여줍니다.
      </p>
      <Button style={{ marginTop: 12 }} onClick={() => navigate("/jobs")}>
        다른 직업의 하루 경험하기
      </Button>
    </AppShell>
  );
}
