export default function ReviewPage() {
  return (
    <main className="page-shell narrow">
      <p className="eyebrow">04 / review</p>
      <h1>오늘의 선택을 돌아볼까요?</h1>
      <p className="intro">
        해결 여부보다, 어떤 정보를 확인하고 누구와 소통했는지를 중심으로
        기록했습니다.
      </p>
      <section className="result-card">
        <p className="eyebrow">얻은 업적</p>
        <h2>일단 보고는 했다</h2>
        <p>문제를 숨기지 않고 관련된 사람에게 상황을 공유했습니다.</p>
      </section>
      <section className="scene-card">
        <h2>다시 시도해볼 장면</h2>
        <p>
          상황을 공유하기 전에 변경 범위를 먼저 확인했다면 어떤 흐름이
          만들어졌을지 비교해볼 수 있습니다.
        </p>
        <a className="secondary-button" href="/simulation/job-ux">
          장면부터 다시 시작하기
        </a>
      </section>
      <a className="secondary-button" href="/jobs">
        다른 직무도 살펴보기
      </a>
    </main>
  );
}
