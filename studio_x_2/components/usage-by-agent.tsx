import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { AGENTS, DEPLOYMENTS, STACK_CATALOG, type AgentStack } from "@/lib/campaign-data"

/**
 * UsageByAgent — the per-agent minutes breakdown under the Usage page's Agents
 * grain (feature 22, 2026-09-17).
 * ──────────────────────────────────────────────────────────────────────────
 * The finest grain this feature can honestly draw is an agent in minutes.
 * Minutes are DERIVED, never typed: calls × average handle time, both of which
 * every deployment already carries. The subtitle states that derivation,
 * because an estimate shows its inputs, and share is computed from the total
 * rather than hand-written beside it.
 *
 * Two columns are deliberately absent. No money: a dollar beside a model name
 * is the claim OpenAI's own API refuses to make, and Agora charges the same
 * $0.10 a minute whichever model runs, so a per-model amount would be invented
 * arithmetic. No managed-or-your-key mode: that claim cannot be honest until
 * the managed vendor list is corrected, and printing it here would put an
 * existing wrong answer on a second surface.
 */

/** One row: an agent, what it ran, and how much of the total it carried. */
interface AgentUsageRow {
  agentId: string
  agentName: string
  minutes: number
  /** Percent of the breakdown's own total, to one decimal. */
  share: number
  /** Empty when the agent record is gone: a row never invents a stack. */
  models: string[]
}

/**
 * The models that carried the call, read from STACK_CATALOG so a row can never
 * name something the catalog does not list. The TTS slot carries a voice where
 * the other two carry a model, which is the same three tokens `stackLine()`
 * prints everywhere else in the builder.
 */
function stackModels(s?: AgentStack): string[] {
  if (!s) return []
  if (s.pipeline === "mllm") {
    const m = STACK_CATALOG.mllm.find((o) => o.vendor === s.llm.vendor && o.model === s.llm.model)
    return m ? [m.label] : []
  }
  const stt = STACK_CATALOG.stt.find((o) => o.vendor === s.asr.vendor && o.model === s.asr.model)
  const llm = STACK_CATALOG.llm.find((o) => o.vendor === s.llm.vendor && o.model === s.llm.model)
  const tts = STACK_CATALOG.tts.find((o) => o.vendor === s.tts.vendor)
  return [stt?.label, llm?.label, tts ? `${tts.label} ${s.tts.voice}` : undefined]
    .filter((x): x is string => Boolean(x))
}

/** Agent minutes across every recorded call — the number the page's "has it
 *  anything to show?" question reads, so the answer is on the page's own
 *  table instead of a meter that lives elsewhere. */
export function agentMinutesTotal(): number {
  let total = 0
  for (const d of DEPLOYMENTS) total += (d.metrics.calls * d.metrics.avgHandleTimeSec) / 60
  return Math.round(total)
}

/** Deployments fold into their agent; an agent with no recorded call gets no
 *  row, rather than a zero that reads as a measurement. */
function agentRows(): AgentUsageRow[] {
  const byAgent = new Map<string, { name: string; minutes: number }>()
  for (const d of DEPLOYMENTS) {
    const minutes = (d.metrics.calls * d.metrics.avgHandleTimeSec) / 60
    if (minutes <= 0) continue
    const prev = byAgent.get(d.agentId)
    byAgent.set(d.agentId, {
      name: prev?.name ?? d.agentName,
      minutes: (prev?.minutes ?? 0) + minutes,
    })
  }
  const total = [...byAgent.values()].reduce((n, a) => n + a.minutes, 0)
  return [...byAgent.entries()]
    .map(([agentId, a]) => ({
      agentId,
      agentName: a.name,
      minutes: Math.round(a.minutes),
      share: total > 0 ? Math.round((a.minutes / total) * 1000) / 10 : 0,
      models: stackModels(AGENTS.find((x) => x.id === agentId)?.stack),
    }))
    .sort((a, b) => b.minutes - a.minutes)
}

export function UsageByAgent() {
  const rows = agentRows()
  const total = agentMinutesTotal()

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-6 pt-5 pb-4">
          <p className="text-xs text-muted-foreground">
            Minutes by agent, across every recorded call: calls × average handle time.
          </p>
          <p className="text-xs font-medium tabular-nums">{total.toLocaleString()} min</p>
        </div>

        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">No agent calls recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Minutes</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.agentId}>
                  <TableCell className="font-medium">
                    {r.agentName}
                    {r.models.length > 0 && (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {r.models.join(" · ")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums">{r.minutes.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 max-w-[200px]">
                      <Progress value={r.share} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                        {r.share}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="space-y-1 border-t px-6 py-4 text-xs text-muted-foreground">
          <p>
            Every model in a call carries the same minutes. Agora charges $0.10 a minute whichever
            model runs.
          </p>
          <p>
            This estimates charges so far this period. The bill is generated at the start of next
            month.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
