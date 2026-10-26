import type { ReactNode } from "react";
import type { SituationView } from "../lib/types";
import { Badge } from "./ui";

export function ProgressBadge({ current, total }: { current: number; total: number }) {
  // N과 M 모두 variant에서 온 값 — 고정 4가 아니라 세션마다 달라질 수 있다.
  return <Badge>진행 {current} / {total}</Badge>;
}

export function SituationCard({ situation }: { situation: SituationView }) {
  return (
    <div className="re-situation-card">
      <span className="re-situation-card__label">상황</span>
      <div className="re-situation-card__title">{situation.title}</div>
      <p>{situation.narrative}</p>
      <span className="re-situation-card__pressure">{situation.timePressure}</span>
    </div>
  );
}

export function MessageBubble({
  align,
  tone,
  speaker,
  children,
}: {
  align: "left" | "right";
  tone: "narration" | "mine" | "outcome";
  speaker?: string;
  children: ReactNode;
}) {
  const toneClass = tone === "mine" ? " re-bubble--mine" : tone === "outcome" ? " re-bubble--outcome" : "";
  return (
    <div className={`re-bubble-row${align === "right" ? " re-bubble-row--mine" : ""}`}>
      <div className={`re-bubble${toneClass}`}>
        {speaker ? <span className="re-bubble__speaker">{speaker}</span> : null}
        {children}
      </div>
    </div>
  );
}

export function GeneratingIndicator() {
  return (
    <div className="re-generating" role="status">
      <span className="re-generating__dot" />
      <span className="re-generating__dot" />
      <span className="re-generating__dot" />
      다음 상황을 준비하고 있어요…
    </div>
  );
}
