"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Rocket, Check, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AgentIdentityCard } from "@/components/agent-identity-card"
import { CustomConfigDrawer } from "@/components/custom-config-drawer"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { StepVoice } from "@/components/wizard/step-voice"
import { StepType } from "@/components/wizard/step-type"
import { StepBuild } from "@/components/wizard/step-build"
import { StepConfigure } from "@/components/wizard/step-configure"
import { StepPublish } from "@/components/wizard/step-publish"
import { STEP_TITLES, STEP_GROUPS, STEP_ICONS, stepTitle, stepManifest } from "@/components/wizard/types"
import { publishDeployment } from "@/components/wizard/channel-configs"
import { useDebouncedEffect } from "@/hooks/use-debounced-effect"
import { markBuildStart, track, Events } from "@/lib/analytics"
import { getAgent, stackLine, stackEstimateFor, presetLatencyBreakdown, AGENT_TEMPLATES, STACK_PRESETS, type ImportedAgentConfig } from "@/lib/campaign-data"
import {
  newVoiceId, saveVoiceArtifact, getVoiceArtifact, type VoiceArtifact,
} from "@/lib/voice-artifacts"
import {
  EMPTY_DRAFT, agentToDraft, templateToDraft, restoreDraft, saveDraft, clearDraft,
  publishBlockReason, channelTarget, typeLabel, type AgentDraft, type AgentType,
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
export function AgentWizard({
  id,
  landing,
  onCreateNew,
  onBrowseTemplates,
}: {
  id: string
  /** Rendered inline on /agents (not the standalone edit route) — show the
   *  first-run chrome (secondary-starts line + inviting heading + create). */
  landing?: boolean
  onCreateNew?: () => void
  /** Opens the starter-templates sheet — templates must be reachable from the
   *  default landing, not just the list view (heuristic-eval #4). */
  onBrowseTemplates?: () => void
}) {
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
  // The left identity card's "Talk to it" toggle (mock test, mirrors the home).
  const [testing, setTesting] = React.useState(false)
  // Visible autosave status — "the copy promises autosave, so show it working"
  // (heuristic-eval #6). idle → saving (on change) → saved (after the write).
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle")
  const dirty = React.useRef(false)
  const draftRef = React.useRef(draft)
  draftRef.current = draft

  const update = React.useCallback((patch: Partial<AgentDraft>) => {
    dirty.current = true
    setSaveState("saving")
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  // Intent switch (Step 2): stash the departing branch's config instead of
  // silently dropping it — otherwise an old CSV/number leaks into publish and
  // dials real contacts on the wrong channel. Undo restores it.
  const typeStash = React.useRef<{ type: AgentType; config: AgentDraft["config"] } | null>(null)
  const restoreTypeStash = React.useCallback(() => {
    const s = typeStash.current
    if (!s) return
    dirty.current = true
    setDraft((d) => ({ ...d, type: s.type, config: { ...d.config, ...s.config } }))
    typeStash.current = null
  }, [])
  const selectType = React.useCallback((next: AgentType) => {
    const d = draftRef.current
    if (d.type === next) return
    // Flipping back to the type whose config we set aside restores it — the
    // "set aside, not deleted" promise must not depend on the transient toast.
    if (typeStash.current?.type === next) {
      restoreTypeStash()
      return
    }
    dirty.current = true
    const departing = d.type
    const hasData =
      departing === "outbound" ? !!(d.config.outbound?.numberId || d.config.outbound?.csvName)
      : departing === "inbound" ? !!d.config.inbound?.numberId
      : departing === "code" ? !!d.config.code?.added
      : false
    if (departing && hasData) {
      typeStash.current = { type: departing, config: { [departing]: d.config[departing] } as AgentDraft["config"] }
      const nextConfig = { ...d.config }
      delete nextConfig[departing]
      setDraft({ ...d, type: next, config: nextConfig })
      const nameOf = typeLabel
      const detail =
        departing === "outbound" ? "contacts CSV and caller-ID number"
        : departing === "inbound" ? "phone number" : "code setup"
      toast(`Switched to ${nameOf(next)}`, {
        description: `Your ${nameOf(departing)} setup — ${detail} — was set aside, not deleted.`,
        action: { label: "Undo", onClick: restoreTypeStash },
      })
    } else {
      setDraft({ ...d, type: next })
    }
  }, [restoreTypeStash])

  // ── Step completion — for the ✓, the progress count, and the "Start here"
  //    nudge ONLY. It never gates access: every step is always openable/editable.
  const voiceDone = draft.voice !== null
  const typeDone = draft.type !== null
  const promptDone = draft.systemPrompt.trim().length > 0
  // Row 4's ✓ reflects STEP-4 facts only — an attached number must show even
  // while the prompt is still empty (re-eval #18); whole-draft readiness stays
  // the sticky bar's job via publishBlockReason.
  const step4Done =
    typeDone &&
    (draft.type === "outbound"
      ? !!(draft.config.outbound?.numberId && draft.config.outbound?.csvName)
      : draft.type === "inbound" && (draft.config.inbound?.mode ?? "phone") === "phone"
      ? !!draft.config.inbound?.numberId
      : true)
  const configReady = typeDone && publishBlockReason(draft) === null
  // Step 5 is deployment itself: ✓ only when the agent is actually live —
  // "4 of 5 complete" next to "Everything's set" was a contradiction (#13).
  const isLive = isEdit && existing!.status === "live"
  const isDone = (n: number) =>
    n === 1 ? voiceDone : n === 2 ? typeDone : n === 3 ? promptDone : n === 4 ? step4Done : isLive
  const setupCount = [1, 2, 3, 4].filter(isDone).length

  // Row detail line — ALWAYS informative (heuristic-eval #1): summaries are
  // recognition data, not a completion reward, so prefer real values whenever
  // they exist, ✓ or not; fall back to the step's content manifest.
  const rowDetail = (n: number): string => {
    const summary = stepSummary(n)
    if (summary) return summary
    if (n === 5 && configReady) return "Everything's set — review and go live"
    return stepManifest(n, draft)
  }

  // ── Mount: time-to-live clock; restore + ?artifact/?dc/?step/?template/?blank ──
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Mounted only for the commit that ?view=list is about to replace — do
    // NOTHING (no toast, no restore, no analytics stamp): a stray "Resuming
    // unsaved edits" toast over the list had a destructive Discard (re-eval #7).
    if (params.get("view") === "list") return
    markBuildStart()
    const artifactId = params.get("artifact")
    const dc = params.get("dc")
    const stepParam = parseInt(params.get("step") ?? "", 10)
    const stepToOpen = stepParam >= 1 && stepParam <= 5 ? stepParam : null
    // Open the deep-linked step's drawer.
    const openLater = (n: number) => setOpenStep(n)
    // One-shot params must not survive into a refresh (re-eval #4).
    const stripParam = (key: string) => {
      const url = new URL(window.location.href)
      url.searchParams.delete(key)
      window.history.replaceState({}, "", url)
    }

    if (isEdit) {
      // Unsaved edits survive a refresh via the per-agent slot (#6) —
      // offer a way back to the saved agent rather than silently resuming.
      const unsaved = restoreDraft(existing!.id)
      if (unsaved) {
        setDraft(unsaved)
        toast("Resuming unsaved edits", {
          description: `${existing!.name} has changes that were never deployed.`,
          action: {
            label: "Discard",
            onClick: () => {
              clearDraft(existing!.id)
              setDraft(agentToDraft(existing!))
            },
          },
        })
      }
      // A voice built in the playground applies to THIS agent too (re-eval #3).
      if (artifactId) {
        const v = getVoiceArtifact(artifactId)
        if (v) {
          setDraft((d) => seedFromVoice(unsaved ?? d, v))
          dirty.current = true
          toast.success(`${v.name} selected`, { description: `Voice updated on ${existing!.name}.` })
          stripParam("artifact")
        }
      }
      if (dc) {
        // Route through the stash/undo machinery — a deep link must not flip a
        // live agent's channel more silently than the UI would (re-eval #17).
        const t = dcToType(dc)
        if (t) {
          selectType(t)
          if (dc === "web") setDraft((d) => ({ ...d, config: dcToConfig(dc, d.config) }))
          dirty.current = true
        }
        openLater(4)
      } else if (stepToOpen) {
        openLater(stepToOpen)
      }
      return
    }

    // ?blank=1 — an explicitly blank builder ("Create new agent") must not
    // resurrect the previous draft (re-eval #4). The saved slot is left intact.
    if (params.get("blank") === "1") {
      setDraft({ ...EMPTY_DRAFT })
      stripParam("blank")
      if (stepToOpen) openLater(stepToOpen)
      return
    }

    // Template seeding (?template=) — but NEVER clobber real work: a saved
    // draft with content wins, with a "Reset to template" way back (re-eval #4).
    const templateId = params.get("template")
    const tpl = templateId ? AGENT_TEMPLATES.find((t) => t.id === templateId) : undefined
    if (tpl) {
      stripParam("template") // refresh falls through to the normal restore path
      const saved = restoreDraft()
      const savedHasWork = saved && (saved.name.trim() || saved.systemPrompt.trim() || saved.voice)
      if (savedHasWork) {
        setDraft(saved)
        toast("Resumed your draft", {
          description: `You have unsaved work — kept it instead of starting from ${tpl.name}.`,
          action: {
            label: "Reset to template",
            onClick: () => {
              dirty.current = true
              setDraft(templateToDraft(tpl))
            },
          },
        })
      } else {
        setDraft(templateToDraft(tpl))
        dirty.current = true
        toast.success(`Started from ${tpl.name}`, {
          description: "Name, prompt, and greeting are pre-filled — tweak anything.",
        })
      }
      if (stepToOpen) openLater(stepToOpen)
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

  // ⌘K "Agent settings" commands open drawers via this event when a wizard is
  // already mounted — a same-route ?step push never re-fires the mount parser,
  // so the palette was inert exactly on /agents (re-eval #2). Refs keep the
  // listener stable while openRow stays fresh.
  const openRowRef = React.useRef<(n: number) => void>(() => {})
  React.useEffect(() => {
    const onOpenStep = (e: Event) => {
      const n = (e as CustomEvent<number>).detail
      if (typeof n === "number" && n >= 1 && n <= 5) {
        e.preventDefault()
        openRowRef.current(n)
      }
    }
    window.addEventListener("sx:open-wizard-step", onOpenStep)
    return () => window.removeEventListener("sx:open-wizard-step", onOpenStep)
  }, [])

  // Autosave BOTH modes (edit gets a per-agent slot) + drive the status chip.
  useDebouncedEffect(() => {
    if (!dirty.current) return
    saveDraft(draftRef.current, isEdit ? existing!.id : undefined)
    setSaveState("saved")
  }, [draft], 600)

  // ── Drawer navigation — mirrored into the URL (?step=N via replaceState, so
  //    refresh restores the open drawer and the link is shareable, while Back
  //    still exits the page predictably — heuristic-eval #20). A snapshot taken
  //    on open powers the footer's "Undo changes" (#18).
  const openSnapshot = React.useRef<AgentDraft | null>(null)
  const syncStepParam = (n: number | null) => {
    const url = new URL(window.location.href)
    if (n == null) url.searchParams.delete("step")
    else url.searchParams.set("step", String(n))
    window.history.replaceState({}, "", url)
  }
  const openRow = (n: number) => {
    openSnapshot.current = draftRef.current
    setOpenStep(n)
    syncStepParam(n)
  }
  openRowRef.current = openRow
  const closeDrawer = () => { setOpenStep(null); syncStepParam(null) }
  // Deep-link/refresh opens bypass openRow — capture a baseline anyway so
  // "Undo changes" is never a silent no-op (re-eval #6); reset on close so the
  // next open re-captures.
  React.useEffect(() => {
    if (openStep != null && openSnapshot.current == null) openSnapshot.current = draftRef.current
    if (openStep == null) openSnapshot.current = null
  }, [openStep])
  const advanceFrom = (n: number) => {
    openSnapshot.current = draftRef.current
    const next = n < 5 ? n + 1 : null
    setOpenStep(next)
    syncStepParam(next)
  }
  const backFrom = (n: number) => {
    openSnapshot.current = draftRef.current
    const prev = Math.max(1, n - 1)
    setOpenStep(prev)
    syncStepParam(prev)
  }
  const undoDrawerChanges = () => {
    const snap = openSnapshot.current
    if (!snap) return
    dirty.current = true
    // The sheet is non-modal, so the card's name field and the row-2 type
    // toggle stay editable behind it — preserve those (re-eval #14), and drop
    // any stale type stash so a later restore can't reapply old config.
    setDraft((d) => ({ ...snap, name: d.name, type: d.type }))
    typeStash.current = null
    toast("Changes undone", { description: "Everything changed in this drawer since opening it was reverted (name and type kept)." })
  }

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
    if (dirty.current) saveDraft(draftRef.current, isEdit ? existing!.id : undefined)
    // Thread the ORIGIN agent so the playground round-trip returns here, not
    // to a fresh create builder (re-eval #3).
    router.push(`/agents/playground?artifact=${vid}&agent=${draft.agentId ?? "new"}`)
  }

  const publishingRef = React.useRef(false)
  const publish = () => {
    if (publishingRef.current) return // guard: double-click must not double-publish
    const reason = publishBlockReason(draftRef.current)
    if (reason) { toast.error("A couple of things to finish first", { description: reason }); return }
    publishingRef.current = true
    // Disarm any pending debounced autosave BEFORE clearing the slot — a save
    // firing mid-navigation would resurrect the consumed draft (re-eval #16).
    dirty.current = false
    const agentId = draft.agentId ?? `agt_${Date.now().toString(36)}`
    publishDeployment({
      router, agentId, agentName: draft.name || "Your agent",
      channel: channelLabel(draft), name: draft.name || "Deployment",
    })
    // Deploying consumes the working copy — clear whichever slot this was.
    clearDraft(isEdit ? draft.agentId : undefined)
  }

  // ── Collapsed-row summaries — VALUES, not booleans (heuristic-eval #15/#16) ──
  function stepSummary(n: number): string | undefined {
    if (n === 1) {
      // Full line = preset + models + language, so those settings have a
      // visible home outside the drawer.
      return cardVoice ? `${cardVoice.name} · ${stackLine(draft.stack, { full: true })}` : undefined
    }
    if (n === 2) return draft.type ? typeLabel(draft.type) : undefined
    if (n === 3) {
      if (!promptDone) return undefined
      const chars = draft.systemPrompt.trim().length
      return [
        `Prompt · ${chars} chars`,
        draft.greeting.trim() ? "Greeting set" : "No greeting",
        `${draft.knowledge.length} knowledge`,
        `${draft.mcp.length} connector${draft.mcp.length === 1 ? "" : "s"}`,
      ].join(" · ")
    }
    if (n === 4) {
      if (!draft.type) return undefined
      const parts = [channelLine(draft)]
      const out = draft.config.outbound
      if (draft.type === "outbound" && (out?.callWindow || out?.maxConcurrent || out?.retries != null)) {
        const win = out.callWindow === "extended" ? "8–8" : out.callWindow === "anytime" ? "anytime" : "9–5"
        parts.push(`${win} · ${out.maxConcurrent ?? 10} lines · retry ×${out.retries ?? 1}`)
      }
      return parts.join(" · ")
    }
    if (n === 5 && isLive) return `Deployed · live on ${channelTarget(draft)}`
    return undefined
  }

  // ── Left identity card (shared component — keeps the agent present, same as
  //    the Agents home, so it never "goes missing" when you enter the builder). ──
  // One voice lookup per id change — getVoiceArtifact reads localStorage, and
  // this value is needed by the card subtitle AND the Step-1 row summary.
  const cardVoice = React.useMemo(
    () => (draft.voice ? getVoiceArtifact(draft.voice.id) : undefined),
    [draft.voice],
  )
  const cardStatus = isEdit ? existing!.status.charAt(0).toUpperCase() + existing!.status.slice(1) : "Draft"
  // Stats come from the DRAFT's stack (not the saved agent) so the card's
  // $/min + latency move live as the Step-1 stack config changes — and new
  // drafts show numbers from first paint (balanced default).
  const cardStack = stackLine(draft.stack)
  const cardEst = stackEstimateFor(draft.stack)
  // No per-provider breakdown for a single-model pipeline.
  const cardLatency = draft.stack.pipeline === "mllm" ? undefined : presetLatencyBreakdown(draft.stack.preset)
  const toggleTest = () => {
    if (testing) track(Events.agent_test_ended, { channel: draft.type ?? "unknown", agent_id: draft.agentId ?? "new", duration_sec: 30 })
    else track(Events.agent_test_started, { channel: draft.type ?? "unknown", agent_id: draft.agentId ?? "new" })
    setTesting((t) => !t)
  }

  const blockReason = publishBlockReason(draft)

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 pb-24 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {landing ? "Deploy an AI agent in minutes" : isEdit ? "Edit your agent" : "Create your agent"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {landing
              ? "Talk to your ready-made agent, set it up, and put it live — all on this page."
              : isEdit
              ? "Open any step to edit it — changes save automatically."
              : "Five short steps to a live agent. Open any step, in any order — it all saves as you go."}
          </p>
        </header>
        <div className="flex shrink-0 items-center gap-2">
            {/* The whole agent on one read-only surface — available in every
                mode, with per-section jump links into the editing steps.
                (No "View all agents" button here — the page's Builder | All
                agents switch already owns that.) */}
            <CustomConfigDrawer draft={draft} onEditStep={openRow} />
            {onCreateNew && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onCreateNew}>
                <Plus className="h-4 w-4" aria-hidden /> New agent
              </Button>
            )}
          </div>
      </div>

      {/* Secondary starts stay one quiet line — never a banner competing with
          the H1. Both paths remain one click away. */}
      {(!isEdit || landing) && (
        <p className="text-sm text-muted-foreground">
          Starting differently?{" "}
          {onBrowseTemplates && (
            <>
              <button
                type="button"
                onClick={onBrowseTemplates}
                className="rounded font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Start from a template
              </button>
              {" · "}
            </>
          )}
          <ImportAgentSheet onImported={onImported}>
            <button
              type="button"
              className="rounded font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Import your agent
            </button>
          </ImportAgentSheet>{" "}
          — Vapi, Retell, Bland, and ElevenLabs configs map automatically.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* LEFT — the agent stays present (shared card, identical to the home). */}
        <AgentIdentityCard
          name={draft.name}
          namePlaceholder={isEdit ? existing!.name : "Your new agent"}
          onNameChange={(v) => update({ name: v })}
          agentId={draft.agentId}
          status={cardStatus}
          subtitle={isEdit ? (existing!.role ?? "Voice agent") : (cardVoice?.name ?? "Pick a voice to start")}
          stack={cardStack}
          language={`${draft.stack.language ?? "English"} · ${draft.stack.pipeline === "mllm" ? "Realtime" : STACK_PRESETS[draft.stack.preset].label}`}
          costPerMin={cardEst?.costPerMin}
          latencyMs={cardEst?.latencyMs}
          latencyBreakdown={cardLatency}
          // WHERE the agent takes traffic — visible on the always-present card,
          // not just inside the Step-4 drawer (heuristic-eval #11).
          channel={draft.type ? {
            label: channelLine(draft),
            onClick: () => openRow(4),
          } : undefined}
          talking={testing}
          onToggleTalk={toggleTest}
          talkLabel={`Talk to ${draft.name || "your agent"}`}
          endLabel="End test"
        />

        {/* RIGHT — the build steps */}
        <div className="space-y-6">
          {/* Checklist — chunked into two labeled groups (variant-audit winner
              V2, 2026-07-06): "Your agent" = what it is, "How it goes live" =
              where it runs. Every row opens; nothing is locked. Canonical step
              ids 1-5 (drawers, ?step=N, Back/Next) are unchanged — only the
              visual grouping differs, so rows show ✓ or their step ICON, never
              digits that would read out of order. */}
          {STEP_GROUPS.map((group) => (
            <section key={group.label} className="space-y-2">
              <h2 className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h2>
              <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {group.steps.map((n) => {
                  const done = isDone(n)
                  const isActive = !done && n === firstIncomplete(draft)
                  const Icon = STEP_ICONS[n]
                  const summary = stepSummary(n)
                  return (
                    // A div (not one big <button>) so row 2 can host the inline
                    // intent control without nesting interactive elements. The
                    // div still takes clicks so the whole hover-highlighted row
                    // opens the step (real buttons inside carry keyboard/AT
                    // semantics; their clicks bubble to the same idempotent
                    // openRow).
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                    <div
                      key={n}
                      onClick={() => openRow(n)}
                      className={cn(
                        "group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-accent/40",
                        isActive && "bg-primary/5",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => openRow(n)}
                        aria-current={isActive ? "step" : undefined}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                          done && "border-primary bg-primary/10 text-primary",
                          isActive && "border-primary bg-primary text-primary-foreground",
                          !done && !isActive && "border-border text-muted-foreground",
                        )}>
                          {done ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            {stepTitle(n, draft)}
                            {/* The last step never carries a first-step nudge (re-eval #10). */}
                            {isActive && (
                              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                {n === 5 ? "Ready to deploy" : "Start here · ~1 min"}
                              </span>
                            )}
                          </span>
                          {/* Value line when set; the content manifest stays
                              visible UNDERNEATH it (recognition data never
                              hides behind completion — audit harvest from V5). */}
                          {summary ? (
                            <>
                              <span className="line-clamp-1 block text-sm text-foreground/90">{summary}</span>
                              <span className="line-clamp-1 block text-xs text-muted-foreground/70">{stepManifest(n, draft)}</span>
                            </>
                          ) : (
                            <span className="line-clamp-1 block text-sm text-muted-foreground">{rowDetail(n)}</span>
                          )}
                        </span>
                      </button>
                      {/* Row 2 — switch the intent without opening the drawer.
                          Routed through selectType so channel data gets the
                          stash + undo toast. ToggleGroup = real radio semantics. */}
                      {n === 2 && (
                        // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
                        <span className="hidden shrink-0 md:block" onClick={(e) => e.stopPropagation()}>
                          <ToggleGroup
                            type="single"
                            value={draft.type ?? ""}
                            onValueChange={(v) => v && selectType(v as AgentType)}
                            variant="outline"
                            size="sm"
                            aria-label="Agent type"
                          >
                            {(["outbound", "inbound", "code"] as const).map((t) => (
                              <ToggleGroupItem key={t} value={t} className="text-xs">
                                {typeLabel(t)}
                              </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                        </span>
                      )}
                      {/* The row itself is the affordance — a quiet chevron. */}
                      <button
                        type="button"
                        onClick={() => openRow(n)}
                        aria-label={`${done ? "Edit" : "Open"} step ${n}: ${stepTitle(n, draft)}`}
                        className="shrink-0 rounded text-muted-foreground transition-colors group-hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <ChevronRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}

      {/* Sticky progress + publish (publish is a hint, not a lock). A LIVE
          agent shows its real state — never "attach a number" contradicting
          the Live badge (heuristic-eval #2/#13); live gets a quiet success
          accent (variant-audit harvest, tokens only). */}
      <div className="sticky bottom-4 z-30">
        <div className={cn(
          "flex items-center justify-between gap-3 rounded-xl border px-4 py-3 shadow-sm backdrop-blur",
          isLive ? "border-success/40 bg-success/10" : "border-border bg-card/95",
        )}>
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {isLive
                ? `Live on ${channelTarget(draft)}`
                : `${setupCount} of 4 set up${setupCount === 4 ? " — ready to deploy" : ""}`}
            </p>
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {isLive
                ? "Edit any step — changes go out when you redeploy."
                : blockReason ?? "Everything's set — review Step 5 and go live."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {saveState !== "idle" && (
              <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
                {saveState === "saving" ? "Saving…" : "Saved"}
              </span>
            )}
            <Button className="gap-1.5" onClick={() => openRow(5)}>
              <Rocket className="h-4 w-4" aria-hidden /> {isLive ? "Redeploy" : "Deploy"}
            </Button>
          </div>
        </div>
      </div>
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
                <SheetTitle className="text-base">{stepTitle(openStep, draft)}</SheetTitle>
                <p className="text-sm text-muted-foreground">Step {openStep} of 5 · {stepManifest(openStep, draft)}</p>
              </SheetHeader>

              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {openStep === 1 && <StepVoice draft={draft} update={update} onSelectVoice={selectVoice} />}
                {openStep === 2 && <StepType draft={draft} update={(patch) => (patch.type ? selectType(patch.type) : update(patch))} />}
                {openStep === 3 && <StepBuild draft={draft} update={update} />}
                {openStep === 4 && <StepConfigure draft={draft} update={update} />}
                {openStep === 5 && (
                  <StepPublish
                    draft={draft}
                    onPublish={publish}
                    onFix={(n) => openRow(n)}
                    talking={testing}
                    onToggleTalk={toggleTest}
                  />
                )}
              </div>

              {/* One footer for ALL steps (step 5 included — it had no exit but
                  X/Esc, #18). Labels promise exactly what happens: changes are
                  already autosaved, so "Done", not a fictional "Save". */}
              <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" disabled={openStep === 1} onClick={() => backFrom(openStep)}>
                    Back
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={undoDrawerChanges}>
                    Undo changes
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={closeDrawer}>Done</Button>
                  {openStep < 5 && (
                    <Button size="sm" className="gap-1.5" onClick={() => advanceFrom(openStep)}>
                      Next step <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </div>
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
    // The persona IS the TTS voice — keep the stack in lockstep so the card,
    // the Voice dropdown, and the exported config all name the same voice.
    stack: { ...d.stack, tts: { ...d.stack.tts, voice: v.ttsVoice } },
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
  // One vocabulary: "Code / SDK" everywhere (heuristic-eval #19) — "embed" is
  // reserved for the web widget's copy.
  if (d.type === "code") return "Code / SDK"
  if (d.type === "inbound" && d.config.inbound?.mode === "web") return "Web widget"
  return "Inbound"
}

/** "label · target" — deduped when they coincide (web mode returns
 *  "Web widget" for both; "Web widget · Web widget" read as a bug, re-eval #15). */
function channelLine(d: AgentDraft): string {
  const label = channelLabel(d)
  const target = channelTarget(d)
  return label === target ? label : `${label} · ${target}`
}
