import Link from "next/link";

const steps = [
  { number: "01", title: "관심사를 알려주세요", text: "좋아하는 활동과 선호하는 환경을 간단히 입력합니다." },
  { number: "02", title: "직무의 하루를 선택하세요", text: "나에게 맞는 직무와 현실적인 상황을 골라봅니다." },
  { number: "03", title: "직접 판단하고 돌아보세요", text: "나의 선택이 만든 결과를 확인하고 다음 선택을 준비합니다." },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header page-width">
        <Link className="brand" href="/">
          <span className="brand-mark">R</span>
          <span>RE:DAY</span>
        </Link>
        <nav className="site-nav" aria-label="주요 메뉴">
          <Link href="/history">지난 기록</Link>
          <Link href="/copilot">Copilot 대화</Link>
        </nav>
      </header>

      <section className="hero page-width" aria-labelledby="page-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">AI 직무 경험 시뮬레이션</p>
            <h1 id="page-title">내가 선택한 직무의 하루를,<br /><span>미리 경험해보세요.</span></h1>
            <p className="intro">
              관심 있는 일을 고르고 현실적인 상황 속에서 직접 판단해보세요.
              선택의 결과를 돌아보며 나에게 맞는 일을 더 선명하게 알아갈 수 있습니다.
            </p>
          </div>
          <div className="hero-panel">
            <p className="panel-label">RE:DAY가 함께할게요</p>
            <h2>나를 알아가는<br />가장 현실적인 방법</h2>
            <p>직무 선택부터 하루의 회고까지, AI가 차근차근 안내합니다.</p>
            <Link className="primary-button" href="/onboarding">
              직무 경험 시작하기 <span aria-hidden="true">→</span>
            </Link>
            <div className="stat-row" aria-label="서비스 특징">
              <div><strong>3단계</strong><span>간단한 시작</span></div>
              <div><strong>실시간</strong><span>AI 상황 생성</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section page-width" id="about" aria-labelledby="about-title">
        <div className="section-heading">
          <p className="eyebrow">RE:DAY가 하는 일</p>
          <h2 id="about-title">정답을 알려주는 대신,<br />직접 경험할 기회를 만들어요.</h2>
        </div>
        <div className="about-list">
          <article className="about-item">
            <span className="outline-number">01</span>
            <div><p className="item-label">현실적인 직무 상황</p><h3>업무에서 마주칠 장면을<br />안전하게 먼저 경험합니다.</h3><p>Copilot Agent가 직무에 맞는 상황을 만들고, 실제 업무처럼 판단할 수 있게 도와줍니다.</p></div>
          </article>
          <article className="about-item">
            <span className="outline-number">02</span>
            <div><p className="item-label">선택의 결과 확인</p><h3>내가 어떤 방식으로<br />문제를 해결하는지 살펴봅니다.</h3><p>나의 대응이 업무와 관계에 어떤 변화를 만드는지 장면별로 확인합니다.</p></div>
          </article>
          <article className="about-item">
            <span className="outline-number">03</span>
            <div><p className="item-label">나를 위한 회고</p><h3>경험을 쌓을수록<br />나에게 맞는 일이 선명해집니다.</h3><p>지난 시뮬레이션을 다시 보며 나의 강점과 선호를 차분히 돌아봅니다.</p></div>
          </article>
        </div>
      </section>

      <section className="services page-width" id="services" aria-labelledby="services-title">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2 id="services-title">세 단계로 가볍게 시작해요</h2>
          <p>정답을 맞히는 테스트가 아니라, 나의 선택을 확인하는 경험입니다.</p>
        </div>
        <div className="service-grid">
          {steps.map((step) => (
            <article className="service-card" key={step.number}>
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="agent-section page-width" aria-labelledby="agent-title">
        <div>
          <p className="eyebrow">지금 시작해보세요</p>
          <h2 id="agent-title">혼자 고민하지 말고,<br />AI와 첫 장면을 열어보세요.</h2>
        </div>
        <div className="agent-actions">
          <Link className="primary-button" href="/onboarding">직무 경험 시작하기 →</Link>
          <Link className="secondary-button" href="/copilot">Copilot과 먼저 대화하기</Link>
        </div>
      </section>
    </main>
  );
}
