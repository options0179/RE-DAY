"use client";

import { useState } from "react";
import Link from "next/link";

const steps = [
  { number: "01", title: "관심사를 알려주세요", text: "좋아하는 활동과 선호하는 환경을 간단히 입력합니다." },
  { number: "02", title: "직무의 하루를 선택하세요", text: "나에게 맞는 직무와 현실적인 상황을 골라봅니다." },
  { number: "03", title: "직접 판단하고 돌아보세요", text: "나의 선택이 만든 결과를 확인하고 다음 선택을 준비합니다." },
];

const examples = [
  { job: "UX 디자이너", time: "10:30", type: "예상치 못한 문제", title: "이전 버전의 파일이 공유됐어요", description: "30분 뒤 개발팀 회의가 시작됩니다. 영향을 받는 화면은 3개입니다.", author: "개발팀 선임", message: "어떤 파일이 최종본인지 지금 확인할 수 있을까요?", status: "남은 시간 28분 · 미해결 문제 1개" },
  { job: "서비스 기획자", time: "13:20", type: "요구사항 충돌", title: "두 팀이 서로 다른 요청을 보냈어요", description: "개발팀과 운영팀이 서로 다른 우선순위를 요구하고 있습니다.", author: "프로젝트 담당자", message: "오늘 안에 어느 요청부터 반영할지 정해야 합니다.", status: "남은 시간 40분 · 확인할 요청 2개" },
  { job: "콘텐츠 마케터", time: "16:10", type: "결과 보고", title: "예상보다 캠페인 반응이 낮아요", description: "보고까지 50분이 남았고, 원인을 확정하기에는 정보가 부족합니다.", author: "마케팅 담당자", message: "현재 확인된 내용부터 먼저 정리할 수 있을까요?", status: "남은 시간 50분 · 확인할 지표 3개" },
];

export default function HomePage() {
  const [exampleIndex, setExampleIndex] = useState(0);
  const example = examples[exampleIndex];
  const goToExample = (direction: number) => setExampleIndex((exampleIndex + direction + examples.length) % examples.length);

  return (
    <main>
      <header className="site-header page-width">
        <Link className="brand" href="/" aria-label="RE:DAY 홈"><span className="brand-mark" aria-hidden="true">R</span><span className="brand-name">RE:DAY</span></Link>
        <nav className="site-nav" aria-label="주요 메뉴"><Link href="/history">지난 기록</Link><Link href="/copilot">Copilot 대화</Link></nav>
      </header>

      <section className="hero page-width" aria-labelledby="page-title">
        <div className="hero-grid">
          <div className="hero-copy">
            <p className="hero-badge"><span aria-hidden="true">✦</span> AI 직무 경험 시뮬레이션</p>
            <h1 id="page-title" className="hero-title"><span className="hero-title-primary">직무의 하루를,</span><span className="hero-title-line"><strong className="hero-highlight">실패해도 괜찮은</strong><span className="hero-title-secondary"> 곳에서</span></span><span className="hero-title-action">먼저 경험해보세요.</span></h1>
            <p className="intro">관심 있는 일을 고르고 현실적인 상황 속에서 직접 판단해보세요. 성공도 실패도 모두 경험이 되어, 나에게 맞는 일을 더 선명하게 찾아갈 수 있습니다.</p>
            <ul className="hero-features" aria-label="RE:DAY의 특징"><li><span className="feature-dot" aria-hidden="true" />현실적인 직무 상황</li><li><span className="feature-dot" aria-hidden="true" />자유로운 대처</li><li><span className="feature-dot" aria-hidden="true" />저장 후 다시 시작</li></ul>
          </div>
          <div className="hero-panel" aria-roledescription="carousel" aria-label="직무 상황 예시" aria-live="polite">
            <div className="preview-top"><div><span className="preview-badge">서비스 예시 화면</span><p className="preview-note">실제 시뮬레이션에서는 사용자의 선택에 따라 결과가 달라집니다.</p></div><span className="preview-count">예시 {exampleIndex + 1} / {examples.length}</span></div>
            <div className="simulation-header"><div><span className="simulation-time">{example.time}</span><strong>{example.job}의 하루</strong></div><span className="simulation-label">{example.type}</span></div>
            <div className="simulation-body"><h2>{example.title}</h2><p className="simulation-description">{example.description}</p><div className="simulation-message"><span className="message-avatar" aria-hidden="true">{example.author.slice(0, 1)}</span><div><strong>{example.author}</strong><p>“{example.message}”</p></div></div><div className="simulation-guidance"><span aria-hidden="true">✉</span> 실제 체험에서는 여기에 나만의 대처를 입력할 수 있어요.</div><div className="simulation-footer"><span><i aria-hidden="true">◷</i> {example.status}</span></div></div>
            <div className="carousel-controls"><button type="button" onClick={() => goToExample(-1)} aria-label="이전 예시">←</button><div className="carousel-dots">{examples.map((item, index) => <button type="button" key={item.job} className={index === exampleIndex ? "is-active" : ""} onClick={() => setExampleIndex(index)} aria-label={`예시 ${index + 1} 보기`} aria-current={index === exampleIndex ? "true" : undefined} />)}</div><button type="button" onClick={() => goToExample(1)} aria-label="다음 예시">→</button></div>
          </div>
        </div>
      </section>

      <section className="about-section page-width" id="about" aria-labelledby="about-title"><div className="section-heading"><p className="eyebrow">RE:DAY가 하는 일</p><h2 id="about-title">정답을 정해두지 않고,<br />도전할 수 있는 장면을 만들어요.</h2></div><div className="about-list"><article className="about-item"><span className="outline-number">01</span><div><p className="item-label">현실적인 직무 상황</p><h3>업무에서 마주칠 장면을<br />안전하게 먼저 경험합니다.</h3><p>Copilot Agent가 직무에 맞는 상황을 만들고, 실제 업무처럼 판단할 수 있게 도와줍니다.</p></div></article><article className="about-item"><span className="outline-number">02</span><div><p className="item-label">선택의 결과 확인</p><h3>내가 어떤 방식으로<br />문제를 해결하는지 살펴봅니다.</h3><p>나의 대응이 업무와 관계에 어떤 변화를 만드는지 장면별로 확인합니다.</p></div></article><article className="about-item"><span className="outline-number">03</span><div><p className="item-label">나를 위한 회고</p><h3>경험을 쌓을수록<br />나에게 맞는 일이 선명해집니다.</h3><p>지난 시뮬레이션을 다시 보며 나의 강점과 선호를 차분히 돌아봅니다.</p></div></article></div></section>

      <section className="services page-width" id="services" aria-labelledby="services-title"><div className="section-heading"><p className="eyebrow">서비스 이용 방법</p><h2 id="services-title"><span>세 단계</span>로 가볍게 시작해요</h2><p>작은 선택부터 시작해, 나만의 속도로 직무를 알아갑니다.</p></div><div className="service-grid">{steps.map((step, index) => <div className="service-step" key={step.number}><article className="service-card"><span className={`step-number step-${index + 1}`}>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>{index < steps.length - 1 && <span className="step-connector" aria-hidden="true">→</span>}</div>)}</div></section>

      <section className="agent-section page-width" aria-labelledby="agent-title"><div><p className="eyebrow">지금 시작해보세요</p><h2 id="agent-title">실패해도 괜찮아요.<br />직무의 하루를 먼저 경험해보세요.</h2></div><div className="agent-actions"><Link className="primary-button" href="/onboarding">직무 경험 시작하기 →</Link><Link className="secondary-button" href="/copilot">Copilot과 먼저 대화하기</Link></div></section>
    </main>
  );
}
