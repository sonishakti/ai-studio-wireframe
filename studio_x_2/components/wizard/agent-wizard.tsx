"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sparkles, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { StepSection } from "@/components/wizard/step-section"
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
  newVoiceId,
  saveVoiceArtifact,
  getVoiceArtifact,
  type VoiceArtifact,
} from "@/lib/voice-artifacts"
import {
  EMPTY_DRAFT,
  agentToDraft,
  restoreDraft,
  saveDraft,
  clearDraft,
  publishBlockReason,
  channelTarget,
  type AgentDraft,
  type AgentType,
} from "@/lib/wizard-draft"
import { toast } from "sonner"

/**
 * AgentWizard — the one creation surface (new · edit · onboarding · empty-state).
 *
 * Presented as an UPFRONT STEPPED WIDGET: all five steps render at once, stacked.
 * Each later step is VISIBLE but DISABLED (dimmed + lock) until the previous step
 * is COMPLETE — strictly sequential, so the whole path reads at a glance and the
 * "fastest time to deploy" is obvious. Finishing a step collapses it to a summary
 * and opens the next; completed steps can be re-opened to edit in place.
 *
 *   1 Voice → 2 Type → 3 System prompt → 4 Configure → 5 Test & publish
 *
 * Draft autosaves to localStorage and restores on refresh (opening the first
 * incomplete step); publishing clears it and lands on Monitor.
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
  const [expandedStep, setExpandedStep] = React.useState(() => firstIncomplete(initialDraft))
  const dirty = React.useRef(false)
  const draftRef = React.useRef(draft)
  draftRef.current = draft

  const update = React.useCallback((patch: Partial<AgentDraft>) => {
    dirty.current = true
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  // ── Step gating — STRICTLY SEQUENTIAL: step N+1 unlocks only when step N is
  //    complete. This is the "disabled until the previous step is done" rule. ───
  const voiceDone = draft.voice !== null
  const typeDone = draft.type !== null
  const promptDone = draft.systemPrompt.trim().length > 0
  const configReady = typeDone && publishBlockReason(draft) === null

  const meta = [
    { n: 1, title: STEP_TITLES[0], locked: false, complete: voiceDone },
    { n: 2, title: STEP_TITLES[1], locked: !voiceDone, complete: typeDone },
    { n: 3, title: STEP_TITLES[2], locked: !typeDone, complete: promptDone },
    { n: 4, title: STEP_TITLES[3], locked: !promptDone, complete: configReady },
    { n: 5, title: STEP_TITLES[4], locked: !configReady, complete: false },
  ] as const

  const statusOf = (m: (typeof meta)[number]): "locked" | "active" | "done" =>
    m.locked ? "locked" : m.complete ? "done" : "active"

  // Continue → open the next unlocked step. Back → previous unlocked step.
  const advanceFrom = (n: number) => {
    for (let k = n + 1; k <= 5; k++) if (!meta[k - 1].locked) return setExpandedStep(k)
    setExpandedStep(0)
  }
  const backFrom = (n: number) => {
    for (let k = n - 1; k >= 1; k--) if (!meta[k - 1].locked) return setExpandedStep(k)
  }
  const canContinue = (n: number) =>
    (n === 1 && voiceDone) ||
    (n === 2 && typeDone) ||
    (n === 3 && promptDone) ||
    (n === 4 && configReady)

  // ── Mount: time-to-live clock; (new mode) restore + ?artifact + ?dc. ─────────
  React.useEffect(() => {
    markBuildStart()
    const params = new URLSearchParams(window.location.search)
    const artifactId = params.get("artifact")
    const dc = params.get("dc")

    if (isEdit) {
      if (dc) {
        const t = dcToType(dc)
        if (t) {
          setDraft((d) => ({ ...d, type: t, config: dcToConfig(dc, d.config) }))
          setExpandedStep(4) // deploy-from-home → jump to Configure
        }
        window.history.replaceState({}, "", `/agents/${id}/edit`)
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
      toast("Draft restored", { description: "Picked up right where you left off." })
    }

    if (dc) {
      const t = dcToType(dc)
      if (t) next = { ...next, type: t, config: dcToConfig(dc, next.config) }
    }

    setDraft(next)
    setExpandedStep(firstIncomplete(next))
    if (artifactId || dc) {
      dirty.current = true
      window.history.replaceState({}, "", "/agents/new/edit")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Autosave (debounced; gated on dirty so restores don't immediately rewrite). ─
  useDebouncedEffect(
    () => {
      if (dirty.current && !isEdit) saveDraft(draftRef.current)
    },
    [draft],
    600,
  )

  // ── Guard: if the expanded step became locked (e.g. the user cleared the type),
  //    snap the cursor back to the first incomplete step. ───────────────────────
  React.useEffect(() => {
    if (expandedStep >= 1 && meta[expandedStep - 1]?.locked) {
      setExpandedStep(firstIncomplete(draft))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, expandedStep])

  // ── Step 1 voice selection — seed the draft + open the next step. ────────────
  const selectVoice = (v: VoiceArtifact) => {
    dirty.current = true
    setDraft((d) => seedFromVoice(d, v))
    setExpandedStep(2)
  }

  // ── Import accelerator — mint a custom voice, send to Playground (returns ?artifact). ─
  const onImported = (config: ImportedAgentConfig) => {
    const vid = newVoiceId()
    const artifact: VoiceArtifact = {
      id: vid,
      name: config.name,
      kind: "custom",
      tagline: config.source ? `Imported from ${config.source}` : "Imported agent",
      personality: config.systemPrompt ? config.systemPrompt.slice(0, 140) : "Imported behavior",
      tone: "Professional",
      language: config.language ?? "en-US",
      ttsVoice: config.voice ?? "rachel",
      firstMessage: config.firstMessage ?? "Hi, how can I help you today?",
      systemPrompt: config.systemPrompt,
      source: config.source ?? "Import",
    }
    saveVoiceArtifact(artifact)
    if (dirty.current) saveDraft(draftRef.current)
    router.push(`/agents/playground?artifact=${vid}`)
  }

  // ── Publish — the north-star action. ─────────────────────────────────────────
  const publish = () => {
    const reason = publishBlockReason(draftRef.current)
    if (reason) {
      toast.error("Not ready to publish", { description: reason })
      return
    }
    const agentId = draft.agentId ?? `agt_${Date.now().toString(36)}`
    clearDraft()
    publishDeployment({
      router,
      agentId,
      agentName: draft.name || "Your agent",
      channel: channelLabel(draft),
      name: draft.name || "Deployment",
    })
  }

  // ── Collapsed-step summaries ─────────────────────────────────────────────────
  const voiceSummary = () => {
    const v = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
    return v ? `${v.name} · ${v.tagline}` : undefined
  }
  const typeSummary = () =>
    draft.type ? draft.type[0].toUpperCase() + draft.type.slice(1) : undefined
  const buildSummary = () => {
    if (!promptDone) return undefined
    const parts = ["Prompt set"]
    if (draft.knowledge.length) parts.push(`${draft.knowledge.length} knowledge`)
    if (draft.mcp.length) parts.push(`${draft.mcp.length} connector${draft.mcp.length > 1 ? "s" : ""}`)
    return parts.join(" · ")
  }
  const configSummary = () =>
    draft.type ? `${channelLabel(draft)} · ${channelTarget(draft)}` : undefined

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {isEdit ? `Edit ${existing!.name}` : "Create your agent"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Five steps to a live agent — each unlocks as you finish the one before it. Saved automatically.
        </p>
      </header>

      {/* Top accelerator — import an existing agent (above the main flow). */}
      {!isEdit && (
        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Already have an agent elsewhere?</p>
              <p className="text-xs text-muted-foreground">
                Import a Vapi / Retell / ElevenLabs config — we map it to a custom voice you can tune in the playground.
              </p>
            </div>
          </div>
          <ImportAgentSheet onImported={onImported}>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5">
              <Download className="h-3.5 w-3.5" /> Import your agent
            </Button>
          </ImportAgentSheet>
        </div>
      )}

      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="wz-name" className="text-sm font-medium">Agent name</Label>
        <Input
          id="wz-name"
          value={draft.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="e.g. Acme Support"
        />
      </div>

      {/* The upfront stack — all five steps visible at once. */}
      <div className="space-y-3">
        <StepSection
          n={1} title={STEP_TITLES[0]} status={statusOf(meta[0])} open={expandedStep === 1}
          summary={voiceSummary()} onEdit={() => setExpandedStep(1)}
          onContinue={() => advanceFrom(1)} canContinue={canContinue(1)}
        >
          <StepVoice draft={draft} onSelectVoice={selectVoice} />
        </StepSection>

        <StepSection
          n={2} title={STEP_TITLES[1]} status={statusOf(meta[1])} open={expandedStep === 2}
          summary={typeSummary()} onEdit={() => setExpandedStep(2)}
          onBack={() => backFrom(2)} onContinue={() => advanceFrom(2)} canContinue={canContinue(2)}
        >
          <StepType draft={draft} update={update} />
        </StepSection>

        <StepSection
          n={3} title={STEP_TITLES[2]} status={statusOf(meta[2])} open={expandedStep === 3}
          summary={buildSummary()} onEdit={() => setExpandedStep(3)}
          onBack={() => backFrom(3)} onContinue={() => advanceFrom(3)} canContinue={canContinue(3)}
        >
          <StepBuild draft={draft} update={update} />
        </StepSection>

        <StepSection
          n={4} title={STEP_TITLES[3]} status={statusOf(meta[3])} open={expandedStep === 4}
          summary={configSummary()} onEdit={() => setExpandedStep(4)}
          onBack={() => backFrom(4)} onContinue={() => advanceFrom(4)} canContinue={canContinue(4)}
        >
          <StepConfigure draft={draft} update={update} />
        </StepSection>

        <StepSection
          n={5} title={STEP_TITLES[4]} status={statusOf(meta[4])} open={expandedStep === 5}
          onEdit={() => setExpandedStep(5)} onBack={() => backFrom(5)}
        >
          <StepPublish draft={draft} onPublish={publish} />
        </StepSection>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** The first step whose completion predicate is unmet — the cursor on
 *  load / restore / edit. (voice→1, type→2, prompt→3, config→4, else 5.) */
function firstIncomplete(d: AgentDraft): number {
  if (d.voice === null) return 1
  if (d.type === null) return 2
  if (d.systemPrompt.trim() === "") return 3
  if (publishBlockReason(d)) return 4
  return 5
}

/** Seed a draft from a chosen voice, without clobbering user-typed prompt/greeting. */
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
