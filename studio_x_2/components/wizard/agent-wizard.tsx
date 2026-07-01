"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Download, Rocket, Check, Pencil, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { StepVoice } from "@/components/wizard/step-voice"
import { StepType } from "@/components/wizard/step-type"
import { StepBuild } from "@/components/wizard/step-build"
import { StepConfigure } from "@/components/wizard/step-configure"
import { StepPublish } from "@/components/wizard/step-publish"
import { STEP_TITLES } from "@/components/wizard/types"
import { publishDeployment } from "@/components/wizard/channel-configs"
import { useDebouncedEffect } from "@/hooks/use-debounced-effect"
import { markBuildStart } from "@/lib/analytics"
import { getAgent, type ImportedAgentConfig } from "@/lib/campaign-data"
import {
  newVoiceId, saveVoiceArtifact, getVoiceArtifact, type VoiceArtifact,
} from "@/lib/voice-artifacts"
import {
  EMPTY_DRAFT, agentToDraft, restoreDraft, saveDraft, clearDraft,
  publishBlockReason, channelTarget, type AgentDraft, type AgentType,
} from "@/lib/wizard-draft"
import { toast } from "sonner"

/**
 * AgentWizard — the unified creation surface (new · edit · onboarding · empty).
 *
 * A CHECKLIST + EDIT DRAWERS. The whole path is visible at a glance; each row
 * opens a focused drawer to edit that step. NOTHING IS LOCKED — every step is
 * openable and fully editable at any time (the user needs full visibility).
 * Completion only drives the ✓ + the progress count + a "Start here" nudge on
 * the suggested next step. Publish is a HINT, not a gate: the reason is shown,
 * the button still works. Deep-links: `?step=N` opens a step, `?dc=` presets a
 * channel + opens Configure, `?artifact=` selects a custom voice. Draft autosaves.
 */
export function AgentWizard({ id }: { id: string }) {
  const router = useRouter()
  const existing = id !== "new" ? getAgent(id) : undefined
  const isEdit = !!existing

  const initialDraft = React.useMemo<AgentDraft>(
    () => (existing ? agentToDraft(existing) : { ...EMPTY_DRAFT }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [draft, setDraft] = React.useState<AgentDraft>(initialDraft)
  // null = checklist overview; 1..5 = that step's drawer is open.
  const [openStep, setOpenStep] = React.useState<number | null>(null)
  const dirty = React.useRef(false)
  const draftRef = React.useRef(draft)
  draftRef.current = draft

  const update = React.useCallback((patch: Partial<AgentDraft>) => {
    dirty.current = true
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  // ── Step completion — for the ✓, the progress count, and the "Start here"
  //    nudge ONLY. It never gates access: every step is always openable/editable.
  const voiceDone = draft.voice !== null
  const typeDone = draft.type !== null
  const promptDone = draft.systemPrompt.trim().length > 0
  const configReady = typeDone && publishBlockReason(draft) === null
  const isDone = (n: number) =>
    n === 1 ? voiceDone : n === 2 ? typeDone : n === 3 ? promptDone : n === 4 ? configReady : false
  const completeCount = [1, 2, 3, 4, 5].filter(isDone).length

  // Row detail line: the summary when done, otherwise a short nudge. Never "locked".
  const rowDetail = (n: number): string => {
    if (isDone(n)) return stepSummary(n) ?? "Done"
    return n === firstIncomplete(draft) ? "Start here — about a minute" : "Tap to open"
  }

  // ── Mount: time-to-live clock; restore + ?artifact + ?dc + ?step deep-links. ──
  React.useEffect(() => {
    markBuildStart()
    const params = new URLSearchParams(window.location.search)
    const artifactId = params.get("artifact")
    const dc = params.get("dc")
    const stepParam = parseInt(params.get("step") ?? "", 10)
    const stepToOpen = stepParam >= 1 && stepParam <= 5 ? stepParam : null
    // Open the deep-linked step's drawer.
    const openLater = (n: number) => setOpenStep(n)

    if (isEdit) {
      if (dc) {
        const t = dcToType(dc)
        if (t) setDraft((d) => ({ ...d, type: t, config: dcToConfig(dc, d.config) }))
        openLater(4)
      } else if (stepToOpen) {
        openLater(stepToOpen)
      }
      return
    }

    const restored = restoreDraft()
    let next = restored ?? { ...EMPTY_DRAFT }
    if (artifactId) {
      const v = getVoiceArtifact(artifactId)
      if (v) {
        next = seedFromVoice(next, v)
        toast.success(`${v.name} selected`, { description: "Custom voice ready — keep building." })
      }
    } else if (restored) {
      const at = firstIncomplete(restored)
      toast("Draft restored", { description: `Picked up at Step ${at} — ${STEP_TITLES[at - 1]}.` })
    }
    if (dc) {
      const t = dcToType(dc)
      if (t) next = { ...next, type: t, config: dcToConfig(dc, next.config) }
    }
    setDraft(next)
    if (dc) openLater(4)
    else if (stepToOpen) openLater(stepToOpen)
    if (artifactId || dc) dirty.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useDebouncedEffect(() => { if (dirty.current && !isEdit) saveDraft(draftRef.current) }, [draft], 600)

  // ── Drawer navigation ────────────────────────────────────────────────────────
  const openRow = (n: number) => setOpenStep(n)
  const closeDrawer = () => setOpenStep(null)
  const advanceFrom = (n: number) => setOpenStep(n < 5 ? n + 1 : null)
  const backFrom = (n: number) => setOpenStep(Math.max(1, n - 1))

  // Picking a voice seeds the draft + chains to the type step.
  const selectVoice = (v: VoiceArtifact) => {
    dirty.current = true
    setDraft((d) => seedFromVoice(d, v))
    setOpenStep(2)
  }

  const onImported = (config: ImportedAgentConfig) => {
    const vid = newVoiceId()
    saveVoiceArtifact({
      id: vid, name: config.name, kind: "custom",
      tagline: config.source ? `Imported from ${config.source}` : "Imported agent",
      personality: config.systemPrompt ? config.systemPrompt.slice(0, 140) : "Imported behavior",
      tone: "Professional", language: config.language ?? "en-US",
      ttsVoice: config.voice ?? "rachel", firstMessage: config.firstMessage ?? "Hi, how can I help you today?",
      systemPrompt: config.systemPrompt, source: config.source ?? "Import",
    })
    if (dirty.current) saveDraft(draftRef.current)
    router.push(`/agents/playground?artifact=${vid}`)
  }

  const publish = () => {
    const reason = publishBlockReason(draftRef.current)
    if (reason) { toast.error("A couple of things to finish first", { description: reason }); return }
    const agentId = draft.agentId ?? `agt_${Date.now().toString(36)}`
    clearDraft()
    publishDeployment({
      router, agentId, agentName: draft.name || "Your agent",
      channel: channelLabel(draft), name: draft.name || "Deployment",
    })
  }

  // ── Collapsed-row summaries ──────────────────────────────────────────────────
  function stepSummary(n: number): string | undefined {
    if (n === 1) {
      const v = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
      return v ? `${v.name} · ${v.tagline}` : undefined
    }
    if (n === 2) return draft.type ? draft.type[0].toUpperCase() + draft.type.slice(1) : undefined
    if (n === 3) {
      if (!promptDone) return undefined
      const parts = ["Prompt set"]
      if (draft.knowledge.length) parts.push(`${draft.knowledge.length} knowledge`)
      if (draft.mcp.length) parts.push(`${draft.mcp.length} connector${draft.mcp.length > 1 ? "s" : ""}`)
      return parts.join(" · ")
    }
    if (n === 4) return draft.type ? `${channelLabel(draft)} · ${channelTarget(draft)}` : undefined
    return undefined
  }

  const blockReason = publishBlockReason(draft)

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 pb-24 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {isEdit ? `Edit ${existing!.name}` : "Create your agent"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? "Open any step to edit it — changes save automatically."
            : "Five short steps to a live agent. Open any step, in any order — it all saves as you go."}
        </p>
      </header>

      {!isEdit && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-medium">Already have an agent elsewhere?</p>
              <p className="text-sm text-muted-foreground">
                Import a Vapi / Retell / ElevenLabs config — we map it to a custom voice you can tune, then drop you back here with it selected.
              </p>
            </div>
          </div>
          <ImportAgentSheet onImported={onImported}>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              <Download className="h-4 w-4" aria-hidden /> Import your agent
            </Button>
          </ImportAgentSheet>
        </div>
      )}

      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="wz-name" className="text-sm font-medium">Agent name</Label>
        <Input id="wz-name" value={draft.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Acme Support" />
      </div>

      {/* Checklist — every row opens; nothing is locked. */}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {[1, 2, 3, 4, 5].map((n) => {
          const done = isDone(n)
          const isActive = !done && n === firstIncomplete(draft)
          return (
            <button
              key={n}
              type="button"
              onClick={() => openRow(n)}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-accent/40",
                isActive && "bg-primary/5",
              )}
            >
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                done && "border-primary bg-primary/10 text-primary",
                isActive && "border-primary bg-primary text-primary-foreground",
                !done && !isActive && "border-border text-muted-foreground",
              )}>
                {done ? <Check className="h-4 w-4" aria-hidden /> : n}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{STEP_TITLES[n - 1]}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{rowDetail(n)}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground/80">
                {done ? (<><Pencil className="h-3.5 w-3.5" aria-hidden /> Edit</>) : isActive ? "Start" : "Open"}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </span>
            </button>
          )
        })}
      </div>

      {/* Sticky progress + publish (publish is a hint, not a lock). */}
      <div className="sticky bottom-4 z-30">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card/95 px-4 py-3 shadow-sm backdrop-blur">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{completeCount} of 5 complete</p>
            <p className="line-clamp-2 text-sm text-muted-foreground">{blockReason ?? "Everything's set — ready to go live 🎉"}</p>
          </div>
          <Button className="shrink-0 gap-1.5" onClick={() => setOpenStep(5)}>
            <Rocket className="h-4 w-4" aria-hidden /> Test &amp; publish
          </Button>
        </div>
      </div>

      {/* Edit drawer — always fully interactive. */}
      {/* modal={false}: a modal Radix dialog opened programmatically on mount
          (the ?step deep-link) trips its focus guard and won't open. Non-modal
          opens reliably, and lets the checklist stay visible behind the drawer. */}
      <Sheet
        modal={false}
        open={openStep != null}
        onOpenChange={(o) => !o && closeDrawer()}
      >
        {/* Roomy drawer — the shadcn default caps a right sheet at max-w-sm (384px),
            which cramps the step forms. Override with a data-[side]-prefixed width so
            it actually wins the specificity fight. */}
        <SheetContent side="right" aria-modal className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
          {openStep != null && (
            <>
              <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
                <SheetTitle className="text-base">{STEP_TITLES[openStep - 1]}</SheetTitle>
                <p className="text-sm text-muted-foreground">Step {openStep} of 5</p>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {openStep === 1 && <StepVoice draft={draft} onSelectVoice={selectVoice} />}
                {openStep === 2 && <StepType draft={draft} update={update} />}
                {openStep === 3 && <StepBuild draft={draft} update={update} />}
                {openStep === 4 && <StepConfigure draft={draft} update={update} />}
                {openStep === 5 && <StepPublish draft={draft} onPublish={publish} />}
              </div>

              {openStep < 5 && (
                <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
                  <Button variant="ghost" className="gap-1.5" disabled={openStep === 1} onClick={() => backFrom(openStep)}>
                    Back
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={closeDrawer}>Save &amp; close</Button>
                    <Button className="gap-1.5" onClick={() => advanceFrom(openStep)}>
                      Save &amp; continue <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** The first step whose completion predicate is unmet — used only for the
 *  "Start here" nudge + restore cursor. Not a gate. */
function firstIncomplete(d: AgentDraft): number {
  if (d.voice === null) return 1
  if (d.type === null) return 2
  if (d.systemPrompt.trim() === "") return 3
  if (publishBlockReason(d)) return 4
  return 5
}

function seedFromVoice(d: AgentDraft, v: VoiceArtifact): AgentDraft {
  return {
    ...d,
    voice: { kind: v.kind, id: v.id },
    name: d.name || v.name,
    systemPrompt: d.systemPrompt.trim() ? d.systemPrompt : v.systemPrompt ?? defaultPromptFor(v),
    greeting: d.greeting.trim() ? d.greeting : v.firstMessage,
  }
}

function defaultPromptFor(v: VoiceArtifact): string {
  return `You are ${v.name}, a voice agent. ${v.personality}

Be concise and helpful. Greet the caller, understand what they need, resolve it, and escalate to a human if asked.`
}

function dcToType(dc: string): AgentType | null {
  if (dc === "inbound" || dc === "web") return "inbound"
  if (dc === "batch") return "outbound"
  if (dc === "code") return "code"
  return null
}

function dcToConfig(dc: string, config: AgentDraft["config"]): AgentDraft["config"] {
  if (dc === "inbound") return { ...config, inbound: { mode: "phone" } }
  if (dc === "web") return { ...config, inbound: { mode: "web" } }
  if (dc === "batch") return { ...config, outbound: { ...config.outbound } }
  if (dc === "code") return { ...config, code: {} }
  return config
}

function channelLabel(d: AgentDraft): string {
  if (d.type === "outbound") return "Batch calls"
  if (d.type === "code") return "Embed"
  if (d.type === "inbound" && d.config.inbound?.mode === "web") return "Web widget"
  return "Inbound"
}
