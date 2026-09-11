export default function OnboardingPage() {
  return (
    <main className="page-shell narrow">
      <p className="eyebrow">01 / onboarding</p>
      <h1>어떤 일을 할 때 가장 몰입하나요?</h1>
      <p className="intro">
        아직 정답을 고를 필요는 없습니다. 관심 있는 활동을 바탕으로 직무를
        찾아볼게요.
      </p>
      <form className="onboarding-form">
        <label htmlFor="interest">관심 있는 활동</label>
        <textarea
          id="interest"
          name="interest"
          placeholder="예: 사람들의 불편을 관찰하고 문제를 정리하는 일을 좋아해요."
          rows={5}
        />
        <button className="primary-button" type="button">
          직무 찾아보기
        </button>
      </form>
    </main>
  );
}
