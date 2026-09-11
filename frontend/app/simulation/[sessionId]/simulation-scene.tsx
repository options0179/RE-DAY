"use client";

import { FormEvent, useState } from "react";

export default function SimulationScene({ jobId }: { jobId: string }) {
  const [response, setResponse] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function submitResponse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (response.trim().length === 0) return;
    setSubmitted(true);
  }

  return (
    <main className="page-shell narrow">
      <p className="eyebrow">03 / simulation · {jobId}</p>
      <div className="scene-progress" aria-label="진행 상황">
        <span>09:30</span>
        <span>첫 번째 장면</span>
      </div>
      <p className="checkpoint-note">자동 저장됨 · 마지막 체크포인트 09:30</p>
      <h1>이전 버전 파일이 공유되었습니다.</h1>
      <p className="intro">
        개발팀에 아직 검토되지 않은 파일이 공유되었습니다. 30분 뒤 회의에서
        사용할 자료라서 지금 확인이 필요합니다.
      </p>
      <section className="scene-card" aria-labelledby="scene-context">
        <h2 id="scene-context">지금 알고 있는 사실</h2>
        <ul>
          <li>공유된 파일명은 `checkout-flow-v2`입니다.</li>
          <li>파일을 받은 사람은 개발팀 선임입니다.</li>
          <li>어떤 내용이 바뀌었는지는 아직 확인하지 못했습니다.</li>
        </ul>
      </section>
      {submitted ? (
        <section className="result-card" aria-live="polite">
          <p className="eyebrow">분석 완료</p>
          <h2>먼저 상황을 공유하고 사실을 확인하려고 했어요.</h2>
          <p>
            문제를 숨기지 않고 확인할 대상을 좁혔습니다. 다음 장면에서는 팀과
            수정 범위를 조율하게 됩니다.
          </p>
          <a className="primary-button" href="/review/demo">
            장면 회고 보기
          </a>
        </section>
      ) : (
        <form className="onboarding-form" onSubmit={submitResponse}>
          <label htmlFor="response">어떻게 대응하시겠어요?</label>
          <textarea
            id="response"
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            placeholder="생각한 행동과 그 이유를 자유롭게 적어주세요."
            rows={6}
          />
          <button className="primary-button" type="submit">
            이 선택으로 진행하기
          </button>
        </form>
      )}
    </main>
  );
}
