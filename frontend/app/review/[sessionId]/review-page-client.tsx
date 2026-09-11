"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Scene = {
  analysis?: { behaviorTags: string[]; immediateEffect: string; evidence: string };
  consequence?: { characterReaction: string };
};

export default function ReviewPageClient({ sessionId }: { sessionId: string }) {
  const [scene, setScene] = useState<Scene | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ scene: Scene | null }>(`/simulations/${sessionId}`)
      .then(({ scene: value }) => setScene(value))
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "회고를 불러오지 못했습니다."),
      );
  }, [sessionId]);

  return (
    <main className="page-shell narrow">
      <p className="eyebrow">04 / review</p>
      <h1>Firebase에 저장된 선택을 돌아볼까요?</h1>
      <p className="intro">장면과 분석은 simulations/{sessionId}/scenes에서 읽습니다.</p>
      {error && <p role="alert">{error}</p>}
      {scene?.analysis ? (
        <>
          <section className="result-card">
            <p className="eyebrow">행동 근거</p>
            <h2>{scene.analysis.behaviorTags.join(" · ") || "분석 대기"}</h2>
            <p>{scene.analysis.evidence}</p>
            <p>{scene.analysis.immediateEffect}</p>
          </section>
          <section className="scene-card">
            <h2>결과</h2>
            <p>{scene.consequence?.characterReaction ?? "저장된 consequence가 없습니다."}</p>
          </section>
        </>
      ) : (
        <p className="intro">아직 저장된 장면이 없습니다.</p>
      )}
      <Link className="secondary-button" href="/history">
        히스토리로 돌아가기
      </Link>
    </main>
  );
}
