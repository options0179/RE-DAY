"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

type Job = { jobId: string; name: string; description: string; standardTasks: string[]; skills: string[] };
type Variant = { variantId: string; worldTitle?: string; difficulty?: number };

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [variants, setVariants] = useState<Record<string, Variant[]>>({});
  const [error, setError] = useState("");

  useEffect(() => { api<{ jobs: Job[] }>("/jobs").then(({ jobs: values }) => setJobs(values)).catch((reason) => setError(reason instanceof Error ? reason.message : "직무를 불러오지 못했습니다.")); }, []);

  async function start(job: Job) {
    try {
      const result = await api<{ variants: Variant[] }>(`/jobs/${job.jobId}/variants`);
      const variant = result.variants[0];
      if (!variant) throw new Error("이 직무에 등록된 variant가 없습니다. Firebase jobProfiles/{jobId}/variants를 먼저 등록해 주세요.");
      const created = await api<{ simulation: { sessionId: string } }>("/simulations", { method: "POST", body: JSON.stringify({ jobId: job.jobId, variantId: variant.variantId, worldTitle: variant.worldTitle ?? job.name, difficulty: variant.difficulty ?? 2 }) });
      router.push(`/simulation/${created.simulation.sessionId}`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "시뮬레이션을 시작하지 못했습니다."); }
  }

  return <main className="page-shell narrow"><p className="eyebrow">02 / job match</p><h1>Firebase의 직무 프로필</h1><p className="intro">jobProfiles 컬렉션에서 불러온 데이터입니다.</p>{error && <p role="alert">{error}</p>}<div className="card-list">{jobs.map((job) => <article className="choice-card" key={job.jobId}><div><h2>{job.name}</h2><p>{job.description}</p><small>{job.standardTasks.join(" · ")}{job.skills.length ? ` · ${job.skills.join(" · ")}` : ""}</small></div><button className="secondary-button" onClick={() => start(job)}>하루 시작하기</button></article>)}</div></main>;
}
