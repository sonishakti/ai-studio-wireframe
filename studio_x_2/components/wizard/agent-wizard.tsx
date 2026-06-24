"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Sparkles, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { WizardStepper, type StepperItem } from "@/components/wizard/wizard-stepper"
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
  type AgentDraft,
  type AgentType,
} from "@/lib/wizard-draft"
import { toast } from "sonner"

/**
 * AgentWizard — the one creation surface that powers all four entry modes:
 * NEW (`id==="new"`), EDIT (load an existing agent), ONBOARDING and EMPTY-STATE
 * (both just link to `/agents/new/edit`). Five gated steps, one autosaved draft,
 * fastest path to a live agent.
 *
 *   1 Voice → 2 Type → 3 System prompt → 4 Configure → 5 Test & publish
 *
 * Top accelerator: Import a 3rd-party agent → seed a custom Voice → Playground →
 * return here with it selected. Draft autosaves to localStorage and restores on
 * refresh; publishing clears it and lands on Monitor (the north-star handoff).
 */
export function AgentWizard({ id }: { id: string }) {
  const router = useRouter()
  const existing = id !== "new" ? getAgent(id) : undefined
  const isEdit = !!existing

  const [draft, setDraft] = React.useState<AgentDraft>(() =>
    existing ? agentToDraft(existing) : { ...EMPTY_DRAFT },
  )
  const [active, setActive] = React.useState(1)
  const dirty = React.useRef(false)
  const draftRef = React.useRef(draft)
  draftRef.current = draft

  const update = React.useCallback((patch: Partial<AgentDraft>) => {
    dirty.current = true
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  // ── Mount: start the time-to-live clock, then (new mode only) restore a draft,
  //    apply a returning ?artifact selection, and honor a ?dc channel preselect. ─
  React.useEffect(() => {
    markBuildStart()

    const params = new URLSearchParams(window.location.search)
    const artifactId = params.get("artifact")
    const dc = params.get("dc")

    // Edit mode: the draft is already loaded with every step open. Honor a ?dc
    // (e.g. a "Deploy via inbound" card from the home) by switching the channel
    // and jumping straight to Configure.
    if (isEdit) {
      if (dc) {
        const t = dcToType(dc)
        if (t) {
          setDraft((d) => ({ ...d, type: t, config: dcToConfig(dc, d.config) }))
          setActive(4)
        }
        window.history.replaceState({}, "", `/agents/${id}/edit`)
      }
      return
    }

    let next = restoreDraft() ?? { ...EMPTY_DRAFT }
    let jumpTo: number | null = null

    if (artifactId) {
      const v = getVoiceArtifact(artifactId)
      if (v) {
        next = seedFromVoice(next, v)
        jumpTo = 2
        toast.success(`${v.name} selected`, { description: "Custom voice ready — keep building." })
      }
    } else if (restoreDraft()) {
      toast("Draft restored", { description: "Picked up right where you left off." })
    }

    if (dc) {
      const t = dcToType(dc)
      if (t) {
        next = { ...next, type: t, config: dcToConfig(dc, next.config) }
        jumpTo = jumpTo ?? 3
      }
    }

    setDraft(next)
    if (jumpTo) setActive(jumpTo)
    if (artifactId || dc) {
      dirty.current = true
      window.history.replaceState({}, "", "/agents/new/edit")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Autosave (debounced, gated on a dirty flag so restores don't rewrite). ───
  useDebouncedEffect(
    () => {
      if (dirty.current && !isEdit) saveDraft(draftRef.current)
    },
    [draft],
    600,
  )

  // ── Step gating ──────────────────────────────────────────────────────────────
  const voiceDone = draft.voice !== null
  const typeDone = draft.type !== null
  const promptDone = draft.systemPrompt.trim().length > 0
  const configReady = typeDone && publishBlockReason(draft) === null

  const items: StepperItem[] = [
    { n: 1, title: STEP_TITLES[0], locked: false, complete: voiceDone },
    { n: 2, title: STEP_TITLES[1], locked: !voiceDone, complete: typeDone },
    { n: 3, title: STEP_TITLES[2], locked: !typeDone, complete: typeDone && promptDone },
    { n: 4, title: STEP_TITLES[3], locked: !typeDone, complete: configReady },
    { n: 5, title: STEP_TITLES[4], locked: !typeDone, complete: false },
  ]

  const canAdvance =
    (active === 1 && voiceDone) ||
    (active === 2 && typeDone) ||
    (active === 3 && promptDone) ||
    active === 4

  const navigate = (n: number) => {
    if (!items[n - 1].locked) setActive(n)
  }

  // ── Step 1 voice selection — seed the draft + auto-advance. ──────────────────
  const selectVoice = (v: VoiceArtifact) => {
    dirty.current = true
    setDraft((d) => seedFromVoice(d, v))
    setActive(2)
  }

  // ── Import accelerator — mint a custom voice from the parsed config, then send
  //    the user to the Playground to finalize it (returns here with ?artifact). ─
  const onImported = (config: ImportedAgentConfig) => {
    const id = newVoiceId()
    const artifact: VoiceArtifact = {
      id,
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
    if (dirty.current) saveDraft(draftRef.current) // keep progress for the round-trip
    router.push(`/agents/playground?artifact=${id}`)
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

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">
          {isEdit ? `Edit ${existing!.name}` : "Create your agent"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Five steps to a live agent — saved automatically as you go.
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

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="lg:sticky lg:top-6 lg:self-start">
          <WizardStepper items={items} active={active} onNavigate={navigate} />
        </div>

        <div className="min-w-0 space-y-6">
          <div className="rounded-xl border border-border bg-card/30 p-5 sm:p-6">
            {active === 1 && <StepVoice draft={draft} onSelectVoice={selectVoice} />}
            {active === 2 && <StepType draft={draft} update={update} />}
            {active === 3 && <StepBuild draft={draft} update={update} />}
            {active === 4 && <StepConfigure draft={draft} update={update} />}
            {active === 5 && <StepPublish draft={draft} onPublish={publish} />}
          </div>

          {/* Footer nav — Publish lives inside Step 5, so hide Continue there. */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="gap-1.5"
              disabled={active === 1}
              onClick={() => setActive((a) => Math.max(1, a - 1))}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            {active < 5 && (
              <Button
                className="gap-1.5"
                disabled={!canAdvance}
                onClick={() => canAdvance && setActive((a) => Math.min(5, a + 1))}
              >
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Seed a draft from a chosen voice, without clobbering user-typed prompt/greeting. */
function seedFromVoice(d: AgentDraft, v: VoiceArtifact): AgentDraft {
  return {
    ...d,
    voice: { kind: v.kind, id: v.id },
    name: d.name || v.name,
    systemPrompt: d.systemPrompt.trim()
      ? d.systemPrompt
      : v.systemPrompt ?? defaultPromptFor(v),
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
