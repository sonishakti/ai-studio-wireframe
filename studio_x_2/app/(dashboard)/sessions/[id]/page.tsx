"use client"

import * as React from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MonitorNav } from "@/components/monitor-nav"
import { SessionDetail } from "@/components/session-detail"
import { getSessionTrace } from "@/lib/session-trace"

/**
 * Session detail — `/sessions/[id]`. Sessions previously had NO detail view:
 * the list rendered rows that looked clickable (identical to Call History's)
 * and went nowhere, which every persona in the 2026-07-29 focus group read as
 * a broken table rather than a missing feature. Q3 roadmap P1 (2026-07).
 */
export default function SessionDetailPage() {
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(String(params?.id ?? ""))
  const trace = React.useMemo(() => getSessionTrace(id), [id])

  return (
    <div className="flex flex-1 flex-col">
      <MonitorNav subtitle="Every agent conversation session across test and live calls." />
      {trace ? (
        <SessionDetail trace={trace} />
      ) : (
        <main className="flex-1 p-6 pt-4">
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
            <Radio className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">Session not found</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              No session matches <span className="font-mono">{id}</span>. It may have aged out of the retention window.
            </p>
            <Button asChild size="sm" className="mt-1">
              <Link href="/sessions">Back to sessions</Link>
            </Button>
          </div>
        </main>
      )}
    </div>
  )
}
