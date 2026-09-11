"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, currentUserId } from "../../lib/api";

export default function OnboardingPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!rawText.trim()) return setError("관심 있는 활동을 입력해 주세요.");
    setSaving(true);
    setError("");
    try {
      await api(`/users/${currentUserId()}/preferences`, {
        method: "POST",
        body: JSON.stringify({ rawText, interestActivities: rawText.split(/[,\s]+/).filter(Boolean) }),
      });
      router.push("/jobs");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="page-shell narrow">
      <p className="eyebrow">01 / onboarding</p>
      <h1>어떤 일을 할 때 가장 몰입하나요?</h1>
      <p className="intro">입력한 내용은 Firebase의 사용자 preferences와 jobMatches에 저장됩니다.</p>
      <form className="onboarding-form" onSubmit={submit}>
        <label htmlFor="interest">관심 있는 활동</label>
        <textarea id="interest" value={rawText} onChange={(event) => setRawText(event.target.value)} rows={5} />
        {error && <p role="alert">{error}</p>}
        <button className="primary-button" type="submit" disabled={saving}>{saving ? "저장 중..." : "직무 찾아보기"}</button>
      </form>
    </main>
  );
}
