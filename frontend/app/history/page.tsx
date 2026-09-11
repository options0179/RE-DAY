const sessions = [
  {
    job: "UX 디자이너",
    date: "2026년 9월 11일",
    summary: "문제를 발견하고 먼저 상황을 공유했습니다.",
    sceneId: "scene-1",
  },
];

export default function HistoryPage() {
  return (
    <main className="page-shell narrow">
      <p className="eyebrow">history</p>
      <h1>내가 지나온 하루</h1>
      <p className="intro">
        완료한 시뮬레이션과 다시 살펴보고 싶은 장면을 확인할 수 있습니다.
      </p>
      <div className="card-list">
        {sessions.map((session) => (
          <article className="choice-card" key={session.date}>
            <div>
              <p className="eyebrow">{session.date}</p>
              <h2>{session.job}</h2>
              <p>{session.summary}</p>
            </div>
            <a className="secondary-button" href={`/review/${session.sceneId}`}>
              회고 보기
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
