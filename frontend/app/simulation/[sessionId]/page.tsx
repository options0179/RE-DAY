import SimulationScene from "./simulation-scene";

export default function SimulationPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return <SimulationScene jobId={params.sessionId} />;
}
