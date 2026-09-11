"use client"

import { BatchDetail } from "@/components/batch-detail"
import type { Deployment } from "@/lib/campaign-data"

/**
 * D1 batch detail — formerly behind the Future-scope switch (removed
 * 2026-09-11: the roadmap features are the product). Kept as a thin wrapper so
 * the route file does not change.
 */
export function BatchDetailGate({ deployment }: { deployment: Deployment }) {
  return <BatchDetail deployment={deployment} />
}
