"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

type Simulation = { sessionId: string; jobId: string; status: string; updatedAt: string };

export default function HistoryPage() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { api<{ simulations: Simulation[] }>("/history").then(({ simulations: values }) => setSimulations(values)).catch((reason) => setError(reason instanceof Error ? reason.message : "히스토리를 불러오지 못했습니다.")); }, []);
  return <main className="page-shell narrow"><p className="eyebrow">history</p><h1>내가 지나온 하루</h1><p className="intro">simulations 컬렉션에서 Firebase로 불러온 기록입니다.</p>{error && <p role="alert">{error}</p>}<div className="card-list">{simulations.map((simulation) => <article className="choice-card" key={simulation.sessionId}><div><p className="eyebrow">{new Date(simulation.updatedAt).toLocaleString("ko-KR")}</p><h2>{simulation.jobId}</h2><p>{simulation.status}</p></div><a className="secondary-button" href={`/simulation/${simulation.sessionId}`}>이어하기</a></article>)}</div></main>;
}
