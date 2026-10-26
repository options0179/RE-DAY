import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "../components/layout";
import { Button, Chip, Field, TextInput } from "../components/ui";
import { api, ApiError } from "../lib/api";
import type { JobSummary, JobVariantSummary } from "../lib/types";

export default function Jobs() {
  const navigate = useNavigate();
  const [popular, setPopular] = useState<JobSummary[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<JobSummary[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
  const [variant, setVariant] = useState<JobVariantSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    api.jobs.popular().then(setPopular);
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim()) api.jobs.search(query).then(setResults);
      else setResults([]);
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  async function selectJob(job: JobSummary) {
    setSelectedJob(job);
    setVariant(null);
    const variants = await api.jobs.variants(job.id);
    setVariant(variants[0] ?? null);
  }

  async function startExperience() {
    if (!selectedJob || !variant) return;
    setStarting(true);
    setError(null);
    try {
      const session = await api.sessions.create({ jobId: selectedJob.id, variantId: variant.id });
      navigate(`/simulation/${session.id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "체험을 시작하지 못했습니다");
    } finally {
      setStarting(false);
    }
  }

  const chipList = query.trim() ? results : popular;

  return (
    <AppShell title="직업 선택">
      <h2>경험해 보고 싶은 직업은?</h2>

      <div style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <Field label="직업을 직접 입력해 주세요">
            <TextInput placeholder="예: UX 디자이너" value={query} onChange={(e) => setQuery(e.target.value)} />
          </Field>
          <div style={{ marginTop: 16, fontSize: 13, fontWeight: 600, color: "var(--re-ink-muted)" }}>
            {query.trim() ? "검색 결과" : "추천 직업"}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {chipList.map((job) => (
              <Chip key={job.id} pressed={selectedJob?.id === job.id} onClick={() => selectJob(job)}>
                {job.name}
              </Chip>
            ))}
            {query.trim() && results.length === 0 ? (
              <span style={{ fontSize: 13, color: "var(--re-ink-muted)" }}>일치하는 직업이 없어요 — 비슷한 직업을 골라볼까요?</span>
            ) : null}
          </div>
        </div>

        <div style={{ flex: "1 1 280px" }} className="re-card">
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--re-ink-muted)" }}>선택한 직업 소개</div>
          {selectedJob && variant ? (
            <>
              <p style={{ fontWeight: 700 }}>{selectedJob.summary}</p>
              <p style={{ color: "var(--re-ink-muted)" }}>{variant.roleDescription}</p>
              <p style={{ fontSize: 13, color: "var(--re-ink-muted)" }}>이 직업의 체험은 {variant.totalSteps}개의 상황으로 구성돼요.</p>
            </>
          ) : (
            <p style={{ color: "var(--re-ink-muted)" }}>무슨 일을 하는지 · 어떤 상황을 경험하는지</p>
          )}
        </div>
      </div>

      {error ? <p className="re-error-text">{error}</p> : null}
      <Button style={{ marginTop: 24 }} disabled={!selectedJob || !variant || starting} onClick={startExperience}>
        이 직업으로 하루 시작
      </Button>
    </AppShell>
  );
}
