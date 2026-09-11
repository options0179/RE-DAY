const jobs = [
  {
    id: "job-ux",
    name: "UX 디자이너",
    reason: "관찰한 문제를 구조화하고 사람들과 해결책을 만드는 일",
    tasks: "사용자 조사 · 요구사항 정리 · 프로토타입 검토",
  },
  {
    id: "job-pm",
    name: "서비스 기획자",
    reason: "여러 팀의 목표를 정리하고 다음 행동을 설계하는 일",
    tasks: "문제 정의 · 일정 조율 · 결과 검토",
  },
];

export default function JobsPage() {
  return (
    <main className="page-shell narrow">
      <p className="eyebrow">02 / job match</p>
      <h1>이런 직무를 먼저 경험해볼까요?</h1>
      <p className="intro">
        추천 결과는 가능성을 탐색하기 위한 제안입니다. 정답이나 적합도 판정이
        아닙니다.
      </p>
      <div className="card-list">
        {jobs.map((job) => (
          <article className="choice-card" key={job.id}>
            <div>
              <h2>{job.name}</h2>
              <p>{job.reason}</p>
              <small>{job.tasks}</small>
            </div>
            <a className="secondary-button" href={`/simulation/${job.id}`}>
              하루 살펴보기
            </a>
          </article>
        ))}
      </div>
    </main>
  );
}
