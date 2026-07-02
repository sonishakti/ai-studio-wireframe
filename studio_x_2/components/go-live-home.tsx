"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Mic, PhoneOff, Plus, Upload, Pencil, Gauge, DollarSign, List,
  AudioLines, Route, FileText, Settings2, Rocket, SlidersHorizontal, History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { getDefaultAgent, stackSummary, stackEstimate, type ImportedAgentConfig } from "@/lib/campaign-data"
import { hasDraft, restoreDraft, saveDraft, clearDraft, firstIncompleteStep } from "@/lib/wizard-draft"
import { STEP_TITLES } from "@/components/wizard/types"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"

/**
 * GoLiveHome — the first-run LANDING page as an ONBOARDING SHORTCUT WIDGET.
 *
 * LEFT (unchanged): the ready-made agent, Aria — talk to it or edit it.
 * RIGHT (2026-07-02, matched to Figma node 1912-65355): an icon-led 5-card
 * list of the creation steps; each card deep-links into the builder at that
 * step (`?step=N`). The channel row carries inline intent pills that deep-link
 * to the channel-preset builder (`?dc=`). Above the two columns: an import
 * accelerator banner + the "Deploy an AI agent in minutes" heading + create.
 * Labels follow the /organize + /clarify locks (not the Figma's older wording):
 * "Choose how it runs" (4 intents incl. Web), "System prompt", "Test & publish".
 */

// The four channel intents (locked: 4 flat peers — Web promoted out of Inbound).
// Each deep-links to the builder's channel-preset handler (`?dc=`).
const INTENTS = [
  { id: "inbound", label: "Inbound", dc: "inbound" },
  { id: "web", label: "Web", dc: "web" },
  { id: "outbound", label: "Outbound", dc: "batch" },
  { id: "code", label: "Code", dc: "code" },
] as const

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

  // Surface an unfinished draft so a returning user resumes it, instead of only
  // rediscovering it by clicking Create new agent.
  const [draftInfo, setDraftInfo] = React.useState<{ step: number; title: string } | null>(null)
  React.useEffect(() => {
    if (!hasDraft()) return
    const d = restoreDraft()
    if (!d) return
    const step = firstIncompleteStep(d)
    setDraftInfo({ step, title: STEP_TITLES[step - 1] })
  }, [])
  const discardDraft = () => {
    const cached = restoreDraft()
    clearDraft()
    setDraftInfo(null)
    toast("Draft discarded", {
      action: {
        label: "Undo",
        onClick: () => {
          if (!cached) return
          saveDraft(cached)
          const step = firstIncompleteStep(cached)
          setDraftInfo({ step, title: STEP_TITLES[step - 1] })
        },
      },
    })
  }

  const editStep = (n: number) => `/agents/${agent.id}/edit?step=${n}`
  const voice = stackSummary(agent).split("·").pop()?.trim()
  const voiceSub = voice ? voice.charAt(0).toUpperCase() + voice.slice(1) : "Warm, natural voice"
  // Aria ships inbound-on-phone → mark "Inbound" as the active intent pill.
  const activeIntent = "inbound"

  const ROWS = [
    { n: 1, Icon: AudioLines, label: "Choose your voice", sub: voiceSub },
    { n: 2, Icon: Route, label: "Choose how it runs", sub: "How your agent connects", pills: true },
    { n: 3, Icon: FileText, label: "System prompt", sub: "Behavior · connectors" },
    { n: 4, Icon: Settings2, label: "Configure", sub: "Attach number · upload contacts" },
    { n: 5, Icon: Rocket, label: "Test & publish", sub: "Take it live" },
  ] as const

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      {/* Import accelerator — meet developers migrating from another platform */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Coming from Vapi, Retell, Bland or ElevenLabs?</p>
          <p className="text-sm text-muted-foreground">Import your agent — we&rsquo;ll map the voice, system prompt, model and tools in seconds.</p>
        </div>
        <ImportAgentSheet onImported={onImported}>
          <Button variant="outline" className="shrink-0 gap-1.5">
            <Upload className="h-4 w-4" aria-hidden /> Import agent
          </Button>
        </ImportAgentSheet>
      </div>

      {/* Page heading + primary actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold tracking-tight">Deploy an AI agent in minutes</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onViewAll} asChild={!onViewAll}>
            {onViewAll ? (
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap"><List className="h-4 w-4" aria-hidden /> View all agents</span>
            ) : (
              <Link href="/agents?view=list"><List className="h-4 w-4" aria-hidden /> View all agents</Link>
            )}
          </Button>
          <Button asChild className="gap-1.5">
            <Link href="/agents/new/edit"><Plus className="h-4 w-4" aria-hidden /> Create new agent</Link>
          </Button>
        </div>
      </div>

      {/* Unfinished draft — resume where you left off */}
      {draftInfo && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <History className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Unfinished agent draft</p>
              <p className="text-sm text-muted-foreground">You left off at Step {draftInfo.step}: {draftInfo.title}.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button size="sm" asChild>
              <Link href="/agents/new/edit">Resume draft</Link>
            </Button>
            <Button size="sm" variant="ghost" onClick={discardDraft}>Discard</Button>
          </div>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* LEFT — the ready-made agent (unchanged) */}
        <section className="flex flex-col rounded-xl border border-border bg-card p-6 lg:sticky lg:top-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <AgentSphere size={104} active={talking} />
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">{agent.name}</h2>
                <Badge variant="secondary">{talking ? "Connected" : "Ready to deploy"}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{agent.role ?? "Your ready-made agent"}</p>
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-border pt-4">
            <p className="break-words font-mono text-sm text-muted-foreground">{stackSummary(agent)}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" aria-hidden />{est.costPerMin.toFixed(2)}/min</span>
              <span className="inline-flex items-center gap-1"><Gauge className="h-3.5 w-3.5" aria-hidden />{est.latencyMs}ms</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2">
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
              <Link href={`/agents/${agent.id}/edit`}><Pencil className="h-4 w-4" aria-hidden /> Edit agent</Link>
            </Button>
          </div>
        </section>

        {/* RIGHT — the creation steps as an icon-led card list (Figma 1912-65355) */}
        <section className="overflow-hidden rounded-xl border border-border">
          {ROWS.map((row, i) => (
            <div
              key={row.n}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5",
                i > 0 && "border-t border-border",
              )}
            >
              <Link href={editStep(row.n)} className="group flex min-w-0 flex-1 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                  <row.Icon className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.sub}</p>
                </div>
              </Link>

              {"pills" in row && row.pills ? (
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  {INTENTS.map((it) => (
                    <Link
                      key={it.id}
                      href={`/agents/${agent.id}/edit?dc=${it.dc}`}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                        it.id === activeIntent
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                      )}
                    >
                      {it.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href={editStep(row.n)}
                  aria-label={`Open ${row.label}`}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                </Link>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  )
}
