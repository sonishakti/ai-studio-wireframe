import { notFound } from "next/navigation"
import { DEPLOYMENTS, getDeployment } from "@/lib/campaign-data"
import { BatchDetail } from "@/components/batch-detail"

// A LIVE batch deployment's detail view (D1). Replaces the old redirect-to-
// Monitor: a slow/throttled batch needs a real home that reads "paced ≠ failed".
// Inbound deployments keep their own surface; this route is batch-only.
export function generateStaticParams() {
  return DEPLOYMENTS.filter((d) => d.kind === "batch").map((d) => ({ id: d.id }))
}

export default async function BatchCallsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const deployment = getDeployment(id)
  if (!deployment || deployment.kind !== "batch") notFound()
  return <BatchDetail deployment={deployment} />
}
