"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mic, PhoneOff, Plus, Upload, Check, ChevronRight, Pencil, Gauge, DollarSign, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { getDefaultAgent, stackSummary, stackEstimate, type ImportedAgentConfig } from "@/lib/campaign-data"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

/**
 * GoLiveHome — the first-run LANDING page as an ONBOARDING SHORTCUT WIDGET
 * (2026-06-24, chosen from a widget-shape audit: "finish-your-agent journey").
 *
 * A first-time user lands here and immediately sees WHAT TO DO to get their
 * ready-made agent (Aria) live: the agent up top, then the five journey steps as
 * shortcuts that deep-link straight into the builder at that step
 * (`/agents/agt_default/edit?step=N`). It doubles as the create-new-agent entry
 * (+ Create · Import · View all agents). Legibility-first — no tiny/dimmed text.
 */

const STEPS: { n: number; label: string; hint: string; isDone: (a: ReturnType<typeof getDefaultAgent>) => boolean }[] = [
  { n: 1, label: "Choose your voice", hint: "Voice & personality", isDone: (a) => !!a.stack?.tts?.voice },
  { n: 2, label: "Select agent type", hint: "Inbound · Outbound · Code", isDone: () => false },
  { n: 3, label: "System prompt & connectors", hint: "Behavior, knowledge, tools", isDone: (a) => !!a.persona?.personality },
  { n: 4, label: "Configure deployment", hint: "Phone · web · code", isDone: () => false },
  { n: 5, label: "Test & publish", hint: "Take it live", isDone: () => false },
]

export function GoLiveHome({ onViewAll }: { onViewAll?: () => void }) {
  const router = useRouter()
  const agent = getDefaultAgent()
  const est = stackEstimate(agent)
  const [talking, setTalking] = React.useState(false)

  React.useEffect(() => {
    track(Events.default_agent_provisioned, { agent_id: agent.id })
  }, [agent.id])

  const toggleTalk = () => {
    if (talking) track(Events.agent_test_ended, { channel: "web", agent_id: agent.id, duration_sec: 30 })
    else track(Events.agent_test_started, { channel: "web", agent_id: agent.id })
    setTalking((t) => !t)
  }

  const onImported = (_config: ImportedAgentConfig) => {
    toast.success("Agent imported", { description: "Opening it in the builder…" })
    router.push("/agents/new/edit")
  }

  const doneCount = STEPS.filter((s) => s.isDone(agent)).length
  const editStep = (n: number) => `/agents/${agent.id}/edit?step=${n}`

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6">
      {/* Aria identity */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <AgentSphere size={76} active={talking} />
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">{agent.name}</h1>
              <Badge variant="secondary">{talking ? "Connected" : "Ready to deploy"}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{agent.role ?? "Your ready-made agent"}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-sm text-muted-foreground">
              <span className="font-mono">{stackSummary(agent)}</span>
              <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" aria-hidden />{est.costPerMin.toFixed(2)}/min</span>
              <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" aria-hidden />{est.latencyMs}ms</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            {talking ? (
              <Button variant="destructive" className="gap-1.5" onClick={toggleTalk}>
                <PhoneOff className="h-4 w-4" aria-hidden /> End call
              </Button>
            ) : (
              <Button className="gap-1.5" onClick={toggleTalk}>
                <Mic className="h-4 w-4" aria-hidden /> Talk to {agent.name}
              </Button>
            )}
            <Button variant="outline" className="gap-1.5" asChild>
              <Link href={`/agents/${agent.id}/edit`}><Pencil className="h-4 w-4" aria-hidden /> Edit</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Journey shortcuts — each deep-links into the builder at that step */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight">Get {agent.name} live</h2>
          <span className="text-sm text-muted-foreground">{doneCount} of {STEPS.length} done</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={STEPS.length}>
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / STEPS.length) * 100}%` }} />
        </div>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
          {STEPS.map((s) => {
            const done = s.isDone(agent)
            return (
              <Link
                key={s.n}
                href={editStep(s.n)}
                className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/40"
              >
                <span className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  done ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
                )}>
                  {done ? <Check className="h-4 w-4" aria-hidden /> : s.n}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">{done ? "Done — open to edit" : s.hint}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground/80">
                  {done ? (<><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</>) : "Set up"}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Doubles as create / import / list */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild className="gap-1.5">
            <Link href="/agents/new/edit"><Plus className="h-4 w-4" aria-hidden /> Create new agent</Link>
          </Button>
          <ImportAgentSheet onImported={onImported}>
            <Button variant="outline" className="gap-1.5">
              <Upload className="h-4 w-4" aria-hidden /> Import
            </Button>
          </ImportAgentSheet>
        </div>
        <Button variant="ghost" className="gap-1.5" onClick={onViewAll} asChild={!onViewAll}>
          {onViewAll ? (
            <span><List className="h-4 w-4" aria-hidden /> View all agents</span>
          ) : (
            <Link href="/agents?view=list"><List className="h-4 w-4" aria-hidden /> View all agents</Link>
          )}
        </Button>
      </div>
    </main>
  )
}
