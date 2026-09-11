import ReviewPageClient from "./review-page-client";

export function generateStaticParams() {
  return [{ sessionId: "demo" }];
}

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <ReviewPageClient sessionId={sessionId} />;
}
