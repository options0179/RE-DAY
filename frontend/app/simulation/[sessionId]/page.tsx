import SimulationScene from "./simulation-scene";

export function generateStaticParams() {
  return [{ sessionId: "demo" }];
}

export default async function SimulationPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <SimulationScene jobId={sessionId} />;
}
