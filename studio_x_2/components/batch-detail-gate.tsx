"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { BatchDetail } from "@/components/batch-detail"
import { useFutureScope, readFutureScope } from "@/lib/future-scope"
import type { Deployment } from "@/lib/campaign-data"

/**
 * D1 is future-scope-gated. On → the batch detail view; off → the pre-roadmap
 * behavior (a live batch is "managed in Monitor"), so we bounce to /monitor.
 * A client gate because the flag is per-browser localStorage. We read the flag
 * SYNCHRONOUSLY on mount (readFutureScope) so an on-user is never briefly
 * redirected by the reactive default; the reactive hook then handles live
 * toggles.
 */
export function BatchDetailGate({ deployment }: { deployment: Deployment }) {
  const router = useRouter()
  const [future] = useFutureScope()
  const [decided, setDecided] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    const on = readFutureScope()
    setDecided(on)
    if (!on) router.replace("/monitor")
  }, [router])

  // React to a live toggle-off while viewing.
  React.useEffect(() => {
    if (decided !== null && !future) router.replace("/monitor")
  }, [future, decided, router])

  if (decided === null || !future) return null
  return <BatchDetail deployment={deployment} />
}
