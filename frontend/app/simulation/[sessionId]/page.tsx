import SimulationScene from "./simulation-scene";

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SimulationScene jobId={sessionId} />;
}
