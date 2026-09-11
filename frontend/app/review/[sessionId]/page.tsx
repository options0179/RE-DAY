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
      <a className="secondary-button" href="/jobs">
        다른 직무도 살펴보기
      </a>
    </main>
  );
}
