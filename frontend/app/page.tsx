const steps = [
  "관심사와 선호 환경을 입력합니다.",
  "나에게 맞는 직무와 세계관을 선택합니다.",
  "하루의 장면을 직접 판단하고 회고합니다.",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">RE:DAY / career simulation</p>
        <h1 id="page-title">내가 선택한 직무의 하루를, 먼저 경험해보세요.</h1>
        <p className="intro">
          Copilot Agent가 직무의 현실적인 상황을 만들고, 당신의 선택이 업무와
          관계에 어떤 변화를 만드는지 함께 보여드립니다.
        </p>
        <a className="primary-button" href="/onboarding">
          시작하기
        </a>
      </section>

      <section className="steps" aria-labelledby="steps-title">
        <h2 id="steps-title">진행 방식</h2>
        <ol>
          {steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
