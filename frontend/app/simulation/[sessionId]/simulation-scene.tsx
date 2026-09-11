"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Scene = { sceneId: string; incident: { title: string; visibleSituation: string; availableInformation: string[]; timePressure: string }; analysis?: { behaviorTags: string[]; immediateEffect: string; relationshipChange: number; taskChange: number; evidence: string }; consequence?: { characterReaction: string; timeConsumedMinutes: number; carryOverIssueIds: string[]; slotComplete: boolean } };
type Simulation = { sessionId: string; jobId: string; currentSlotId: string; stateVersion: number; elapsedMinutes?: number };
type Variant = { title?: string; incident?: Scene["incident"]; scenes?: Array<{ incident: Scene["incident"] }> };

export default function SimulationScene({ jobId }: { jobId: string }) {
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [variant, setVariant] = useState<Variant | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api<{ simulation: Simulation; variant: Variant | null; scene: Scene | null }>(`/simulations/${jobId}`).then((value) => { setSimulation(value.simulation); setVariant(value.variant); setScene(value.scene); }).catch((reason) => setError(reason instanceof Error ? reason.message : "시뮬레이션을 불러오지 못했습니다.")); }, [jobId]);
  const incident = scene?.incident ?? variant?.incident ?? variant?.scenes?.[0]?.incident;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!simulation || !incident || !response.trim()) return;
    try {
      const result = await api<{ simulation: Simulation; scene: Scene }>(`/simulations/${jobId}/scenes`, { method: "POST", body: JSON.stringify({ responseText: response, incident, analysis: { behaviorTags: [], immediateEffect: "Agent 분석 대기", delayedEffect: null, relationshipChange: 0, taskChange: 0, evidence: response }, consequence: { characterReaction: "Agent 분석 대기", timeConsumedMinutes: 0, carryOverIssueIds: [], slotComplete: false }, sourceRefs: [], promptVersion: "pending-agent-analysis" }) });
      setSimulation(result.simulation); setScene(result.scene); setResponse("");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "응답을 저장하지 못했습니다."); }
  }

  return <main className="page-shell narrow"><p className="eyebrow">03 / simulation · {simulation?.jobId ?? jobId}</p>{error && <p role="alert">{error}</p>}{incident ? <><div className="scene-progress"><span>{simulation?.elapsedMinutes ?? 0}분</span><span>{simulation?.currentSlotId}</span></div><h1>{incident.title}</h1><p className="intro">{incident.visibleSituation}</p><section className="scene-card"><h2>지금 알고 있는 사실</h2><ul>{incident.availableInformation.map((item) => <li key={item}>{item}</li>)}</ul><p>{incident.timePressure}</p></section>{scene?.analysis && <section className="result-card"><p className="eyebrow">저장된 분석</p><p>{scene.analysis.evidence}</p></section>}<form className="onboarding-form" onSubmit={submit}><label htmlFor="response">어떻게 대응하시겠어요?</label><textarea id="response" value={response} onChange={(event) => setResponse(event.target.value)} rows={6} /><button className="primary-button" type="submit">Firebase에 저장하기</button></form></> : <p className="intro">Firebase의 jobProfiles/{simulation?.jobId}/variants/{String((simulation as unknown as { variantId?: string })?.variantId ?? "")}에 장면 데이터가 없습니다.</p>}</main>;
}
