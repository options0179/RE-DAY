import Link from "next/link";

const steps = [
  "관심사와 선호 환경을 입력합니다.",
  "나에게 맞는 직무와 세계관을 선택합니다.",
  "하루의 장면을 직접 판단하고 회고합니다.",
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>RE:DAY</span>
        </Link>
        <nav className="site-nav" aria-label="주요 메뉴">
          <Link href="/history">지난 기록</Link>
          <Link href="/copilot">Copilot 대화</Link>
        </nav>
      </header>

      <section className="hero" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="eyebrow">AI 직무 경험 시뮬레이션</p>
          <h1 id="page-title">내가 선택한 직무의 하루를,<br />미리 경험해보세요.</h1>
          <p className="intro">
            관심 있는 일을 고르고 현실적인 상황 속에서 직접 판단해보세요.
            선택의 결과를 돌아보며 나에게 맞는 일을 더 선명하게 알아갈 수 있습니다.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/onboarding">
              내 직무 경험 시작하기 <span aria-hidden="true">→</span>
            </Link>
            <Link className="text-button" href="/copilot">
              Copilot에게 먼저 물어보기
            </Link>
          </div>
        </div>
        <div className="hero-note" aria-label="RE:DAY 서비스 안내">
          <span className="status-dot" aria-hidden="true" />
          <div>
            <strong>나를 알아가는 가장 현실적인 방법</strong>
            <p>직무 선택부터 하루의 회고까지, AI가 함께합니다.</p>
          </div>
        </div>
      </section>

      <section className="steps" aria-labelledby="steps-title">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2 id="steps-title">세 단계로 가볍게 시작해요</h2>
          <p>정답을 맞히는 테스트가 아니라, 나의 선택을 확인하는 경험입니다.</p>
        </div>
        <ol>
          {steps.map((step, index) => (
            <li key={step}>
              <span className="step-number">{String(index + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
