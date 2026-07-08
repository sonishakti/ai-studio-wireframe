"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Rocket, Check, Mic, Plus, Undo2, SlidersHorizontal, ListChecks, ChevronDown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { AgentIdentityCard } from "@/components/agent-identity-card"
import { AgentSphere } from "@/components/agent-test-panel"
import { CustomConfigDrawer } from "@/components/custom-config-drawer"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { StepVoice } from "@/components/wizard/step-voice"
import { StepAdvanced } from "@/components/wizard/step-advanced"
import { StepAnalysis } from "@/components/wizard/step-analysis"
import { StepType } from "@/components/wizard/step-type"
import { StepBuild } from "@/components/wizard/step-build"
import { StepConfigure } from "@/components/wizard/step-configure"
import { StepPublish } from "@/components/wizard/step-publish"
import { STEP_TITLES, STEP_ICONS, stepTitle, stepManifest } from "@/components/wizard/types"
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
 * A SCROLL-SPY ONE-PAGER (composition winner C5, 2026-07-07): all five steps
 * render open in the main column; a sticky rail holds the agent lockup, the
 * step list (spy-highlighted, with value recaps), and the live deploy state.
 * NOTHING IS LOCKED — every field is editable at any time, zero clicks to
 * reach any of it. Publish is a HINT, not a gate: the reason is shown, the
 * button still works. Deep-links: `?step=N` scrolls to a section, `?dc=`
 * presets a channel + scrolls to Configure, `?artifact=` selects a custom
 * voice. Draft autosaves; live agents get per-section "Reset to live".
 */
export function AgentWizard({
  id,
  landing,
  blank,
  onCreateNew,
  onBrowseTemplates,
}: {
  id: string
  /** Rendered inline on /agents (not the standalone edit route) — show the
   *  first-run chrome (secondary-starts line + inviting heading + create). */
  landing?: boolean
  /** Start truly blank, skipping the draft restore. A PROP (not just ?blank=1)
   *  because "New agent" remounts this component in the same tick as its
   *  router.push — the mount effect would read the OLD URL and resurrect a
   *  stale draft (race found in the 2026-07-07 walkthrough). */
  blank?: boolean
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
  // Master-detail selection (2026-07-07): the right card ALWAYS shows a step.
  // null = "no explicit choice yet" — the render falls back to a default
  // captured once on first render (edit reviews from step 1; a new draft lands
  // on its first incomplete step). Kept nullable so ?step deep links and the
  // ⌘K event keep their exact semantics.
  const [openStep, setOpenStep] = React.useState<number | null>(null)
  // The Talk panel (identity card + live test) — the ONLY right-side Sheet now.
  const [talkOpen, setTalkOpen] = React.useState(false)
  // Optional depth sections (F1 Advanced / F8 Analysis) — collapsed by default
  // so the novice skips them; the rail entry expands + scrolls.
  const [optOpen, setOptOpen] = React.useState<{ advanced: boolean; analysis: boolean }>({ advanced: false, analysis: false })
  // Which section the scroll-spy currently highlights when it's an optional one
  // (numbered steps live in `openStep`; the two coordinate so exactly one rail
  // row reads active).
  const [activeOpt, setActiveOpt] = React.useState<"advanced" | "analysis" | null>(null)
  // muteSpy is defined further down (after the scroll refs); a ref lets the
  // earlier openOptional reach it without a use-before-define.
  const muteSpyRef = React.useRef<(ms: number) => void>(() => {})
  const openOptional = (key: "advanced" | "analysis") => {
    setOptOpen((o) => ({ ...o, [key]: true }))
    // Mark it active now and mute the spy for the glide so the numbered-step
    // highlight doesn't fight the jump (matches openRow's behaviour).
    setActiveOpt(key)
    muteSpyRef.current(1500)
    window.setTimeout(() => document.getElementById(`wizard-opt-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60)
  }
  // The identity card's "Talk to it" toggle (mock test, mirrors the home).
  const [testing, setTesting] = React.useState(false)
  // Visible autosave status — "the copy promises autosave, so show it working"
  // (heuristic-eval #6). idle → saving (on change) → saved (after the write).
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle")
  const dirty = React.useRef(false)
  const draftRef = React.useRef(draft)
  draftRef.current = draft

  // The selection the right card renders. Default is locked on FIRST render —
  // if it tracked firstIncomplete live, finishing a step inline would yank the
  // card to the next step mid-edit. The mount effect overrides it for restored
  // drafts and deep links via setOpenStep.
  const defaultSelected = React.useRef<number | null>(null)
  if (defaultSelected.current == null) defaultSelected.current = isEdit ? 1 : firstIncomplete(draft)
  const selected = openStep ?? defaultSelected.current

  const update = React.useCallback((patch: Partial<AgentDraft>) => {
    dirty.current = true
    setSaveState("saving")
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  // Intent switch (Step 2): stash the departing branch's config instead of
  // silently dropping it — otherwise an old CSV/number leaks into publish and
  // dials real contacts on the wrong channel. Undo restores it. A MAP, not a
  // single slot: two consecutive flips must not discard the first branch's
  // set-aside config (audit 2026-07-07).
  const typeStash = React.useRef<Partial<Record<AgentType, AgentDraft["config"]>>>({})
  const restoreTypeStash = React.useCallback((t: AgentType) => {
    const s = typeStash.current[t]
    if (!s) return
    dirty.current = true
    setDraft((d) => ({ ...d, type: t, config: { ...d.config, ...s } }))
    delete typeStash.current[t]
  }, [])
  const selectType = React.useCallback((next: AgentType) => {
    const d = draftRef.current
    if (d.type === next) return
    // Flipping back to a type whose config we set aside restores it — the
    // "set aside, not deleted" promise must not depend on the transient toast.
    if (typeStash.current[next]) {
      restoreTypeStash(next)
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
      typeStash.current[departing] = { [departing]: d.config[departing] } as AgentDraft["config"]
      const nextConfig = { ...d.config }
      delete nextConfig[departing]
      setDraft({ ...d, type: next, config: nextConfig })
      const nameOf = typeLabel
      const detail =
        departing === "outbound" ? "contacts CSV and caller-ID number"
        : departing === "inbound" ? "phone number" : "code setup"
      toast(`Switched to ${nameOf(next)}`, {
        description: `Your ${nameOf(departing)} setup (${detail}) was set aside, not deleted.`,
        action: { label: "Undo", onClick: () => restoreTypeStash(departing) },
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
    if (n === 5 && configReady) return "Review your agent and go live"
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
    // Highlight + scroll to the deep-linked step once sections have painted.
    // Scheduled HERE, not via a ref-consuming effect: an [openStep]-keyed
    // effect cancels its own timeout when the queued setOpenStep commits
    // (audit 2026-07-07: deep links highlighted but never scrolled).
    const openLater = (n: number) => {
      setOpenStep(n)
      muteSpy(1500)
      window.setTimeout(() => scrollToStep(n), 120)
    }
    // One-shot params must not survive into a refresh (re-eval #4).
    const stripParam = (key: string) => {
      const url = new URL(window.location.href)
      url.searchParams.delete(key)
      window.history.replaceState({}, "", url)
    }

    if (isEdit) {
      // Reset baseline for a saved agent = its DEPLOYED config ("Reset to
      // live"), even when unsaved edits are restored on top.
      baseline.current = agentToDraft(existing!)
      // Unsaved edits survive a refresh via the per-agent slot (#6) —
      // offer a way back to the saved agent rather than silently resuming.
      const unsaved = restoreDraft(existing!.id)
      if (unsaved) {
        setDraft(unsaved)
        // Sync the ref NOW: selectType below reads draftRef, which otherwise
        // still holds the pre-restore snapshot until the next render, and its
        // non-functional setDraft would clobber the restored edits (audit
        // 2026-07-07: a ?dc= link silently reverted unsaved prompts).
        draftRef.current = unsaved
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
    if (blank || params.get("blank") === "1") {
      setDraft({ ...EMPTY_DRAFT })
      baseline.current = { ...EMPTY_DRAFT }
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
        baseline.current = saved
        toast("Resumed your draft", {
          description: `Kept your unsaved work instead of starting from ${tpl.name}.`,
          action: {
            label: "Reset to template",
            onClick: () => {
              dirty.current = true
              setDraft(templateToDraft(tpl))
            },
          },
        })
      } else {
        const seeded = templateToDraft(tpl)
        setDraft(seeded)
        // Persist NOW, not via the debounced autosave: the standalone edit
        // route can remount the wizard right after this effect (observed
        // 2026-07-07); the remount's restore path must find the seed or the
        // template silently degrades to a blank draft.
        saveDraft(seeded)
        baseline.current = seeded
        dirty.current = true
        toast.success(`Started from ${tpl.name}`, {
          description: "Name, prompt, and greeting are pre-filled. Tweak anything.",
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
        toast.success(`${v.name} selected`, { description: "Custom voice ready. Keep building." })
      }
    } else if (restored) {
      const at = firstIncomplete(restored)
      toast("Draft restored", { description: `Picked up at Step ${at}: ${STEP_TITLES[at - 1]}.` })
      // Land the highlight where the work stopped (the default locked on
      // first render was computed from the empty draft).
      if (!stepToOpen && !dc) openLater(at)
    }
    if (dc) {
      const t = dcToType(dc)
      if (t) next = { ...next, type: t, config: dcToConfig(dc, next.config) }
    }
    setDraft(next)
    // Reset baseline = what this visit landed with, never the pre-restore
    // empty draft (one Reset click must not erase restored work).
    baseline.current = next
    if (dc) openLater(4)
    else if (stepToOpen) openLater(stepToOpen)
    if (artifactId || dc) {
      dirty.current = true
      // Survive an immediate remount (see the template branch above).
      saveDraft(next)
    }
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
  // EDIT mode only: a draft byte-identical to the deployed baseline is NOT
  // unsaved work — clear the slot so "Reset to live" doesn't leave a ghost
  // that greets the next visit with a false "Resuming unsaved edits" toast
  // (audit 2026-07-07). New drafts must NOT get this treatment: a template
  // seed equals ITS baseline by definition, and clearing would lose it on
  // refresh.
  useDebouncedEffect(() => {
    if (!dirty.current) return
    if (isEdit && baseline.current && JSON.stringify(draftRef.current) === JSON.stringify(baseline.current)) {
      clearDraft(existing!.id)
      dirty.current = false
      setSaveState("saved")
      return
    }
    saveDraft(draftRef.current, isEdit ? existing!.id : undefined)
    setSaveState("saved")
  }, [draft], 600)

  // ── Step navigation — one-pager (2026-07-07): every section is always open;
  //    "opening" a step means scrolling it into view. ?step=N mirrors explicit
  //    navigation only (spy-driven highlight changes stay out of the URL).
  const syncStepParam = (n: number | null) => {
    const url = new URL(window.location.href)
    if (n == null) url.searchParams.delete("step")
    else url.searchParams.set("step", String(n))
    window.history.replaceState({}, "", url)
  }
  const scrollToStep = (n: number) => {
    const el = document.getElementById(`wizard-step-${n}`)
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
    // Some environments silently drop smooth scrolls (and reduced-motion users
    // skip the glide anyway) — guarantee arrival: if the section top isn't
    // near the reading line shortly after, jump instantly. scroll-mt-24 = 96px.
    window.setTimeout(() => {
      if (Math.abs(el.getBoundingClientRect().top - 96) > 120) el.scrollIntoView({ block: "start" })
    }, 450)
  }
  // While a chosen scroll glides, the spy would re-highlight every section it
  // passes — mute it for the ride so the clicked step stays selected.
  const spyMutedUntil = React.useRef(0)
  const muteSpy = (ms: number) => { spyMutedUntil.current = Date.now() + ms }
  muteSpyRef.current = muteSpy
  const openRow = (n: number) => {
    // Set the highlight FIRST: on a short page (everything in one fold, the
    // 4K case) nothing scrolls, so the click must still give feedback.
    setOpenStep(n)
    syncStepParam(n)
    muteSpy(800)
    scrollToStep(n)
  }
  openRowRef.current = openRow

  // Scroll-spy: the rail highlights the section under the reading line.
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (Date.now() < spyMutedUntil.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          const id = visible[0].target.id
          if (id.startsWith("wizard-opt-")) {
            // An optional section is under the reading line — highlight IT and
            // drop the numbered-step highlight so exactly one rail row is active.
            setActiveOpt(id.replace("wizard-opt-", "") as "advanced" | "analysis")
          } else {
            const n = Number(id.replace("wizard-step-", ""))
            if (n >= 1 && n <= 5) { setOpenStep(n); setActiveOpt(null) }
          }
        }
      },
      { rootMargin: "-15% 0px -65% 0px" },
    )
    for (let i = 1; i <= 5; i++) {
      const el = document.getElementById(`wizard-step-${i}`)
      if (el) obs.observe(el)
    }
    for (const key of ["advanced", "analysis"]) {
      const el = document.getElementById(`wizard-opt-${key}`)
      if (el) obs.observe(el)
    }
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Per-section reset — against a stable baseline: the DEPLOYED config for
  //    a live agent ("Reset to live"), or the state this visit started from
  //    for a new draft. Set once by the mount effect. Buttons disable when the
  //    section is clean, so reset is never a silent no-op or a surprise wipe.
  const baseline = React.useRef<AgentDraft | null>(null)
  const stepSlice = (d: AgentDraft, n: number) =>
    n === 1 ? { voice: d.voice, stack: d.stack }
    : n === 2 ? { type: d.type }
    : n === 3 ? { systemPrompt: d.systemPrompt, greeting: d.greeting, knowledge: d.knowledge, mcp: d.mcp, connectors: d.connectors }
    : { config: d.config }
  const stepDirty = (n: number) => {
    const base = baseline.current
    if (!base) return false
    return JSON.stringify(stepSlice(draft, n)) !== JSON.stringify(stepSlice(base, n))
  }
  const resetStep = (n: number) => {
    const base = baseline.current
    if (!base) return
    // Snapshot what's being wiped: reset is one click and must offer a way
    // back (owner call, 2026-07-07).
    const before = JSON.parse(JSON.stringify(
      n === 2 ? { type: draftRef.current.type, config: draftRef.current.config } : stepSlice(draftRef.current, n),
    )) as Partial<AgentDraft>
    dirty.current = true
    // Type and channel setup are coupled: restoring the type WITHOUT the
    // baseline config would bring back an inbound agent with its number gone
    // (selectType stashes-and-deletes the departing branch; audit 2026-07-07).
    const slice = n === 2 ? { type: base.type, config: base.config } : stepSlice(base, n)
    if (n === 2) typeStash.current = {}
    // Deep-clone: the baseline must never share references with the live draft.
    update(JSON.parse(JSON.stringify(slice)) as Partial<AgentDraft>)
    toast("Step reset to the live version", {
      action: {
        label: "Undo",
        onClick: () => {
          dirty.current = true
          update(before)
        },
      },
    })
  }

  // Whole-agent discard: reverting three edited steps must not take three
  // clicks. Lives in the deploy block, only when something is pending.
  const discardEdits = () => {
    const base = baseline.current
    if (!base) return
    const before = JSON.parse(JSON.stringify(draftRef.current)) as AgentDraft
    dirty.current = true
    typeStash.current = {}
    setDraft(JSON.parse(JSON.stringify(base)) as AgentDraft)
    toast("Edits discarded", {
      description: "Back to the live configuration.",
      action: {
        label: "Undo",
        onClick: () => {
          dirty.current = true
          setDraft(before)
        },
      },
    })
  }

  // Apply an edited-JSON patch from the Custom config drawer (F4). Snapshot
  // first so a bad paste is one Undo away.
  const applyConfigPatch = (patch: Partial<AgentDraft>) => {
    const before = JSON.parse(JSON.stringify(draftRef.current)) as AgentDraft
    dirty.current = true
    setDraft((d) => ({ ...d, ...patch }))
    toast.success("Config applied", {
      description: "Your JSON edits are in the draft.",
      action: { label: "Undo", onClick: () => { dirty.current = true; setDraft(before) } },
    })
  }

  // Picking a voice seeds the draft. No jump: on the one-pager the next step
  // is already visible right below.
  const selectVoice = (v: VoiceArtifact) => {
    dirty.current = true
    setDraft((d) => seedFromVoice(d, v))
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
    if (reason) { toast.error("Not ready to deploy yet", { description: reason }); return }
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
      // Step 1 is voice + language now (the engine moved to the Playground),
      // so the recap matches that scope; the full stack + $/min live on the
      // agent card.
      return cardVoice ? `${cardVoice.name} · ${draft.stack.language ?? "English"}` : undefined
    }
    if (n === 2) return draft.type ? typeLabel(draft.type) : undefined
    if (n === 3) {
      if (!promptDone) return undefined
      const chars = draft.systemPrompt.trim().length
      // KB / MCP / connectors are three distinct resources now (F6, 2026-07-07),
      // so the recap names each rather than flattening them into one "actions"
      // count that miscalled a knowledge base an action.
      const bits: string[] = []
      if (draft.knowledge.length) bits.push(`${draft.knowledge.length} knowledge`)
      if (draft.mcp.length) bits.push(`${draft.mcp.length} MCP`)
      if (draft.connectors.length) bits.push(`${draft.connectors.length} connector${draft.connectors.length === 1 ? "" : "s"}`)
      return [
        `Prompt · ${chars} chars`,
        draft.greeting.trim() ? "Greeting set" : "No greeting",
        bits.length ? bits.join(", ") : "No tools yet",
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
  // Honest deploy-state line: a live agent with pending edits says so (the
  // missing dirty signal was the top finding in every operator audit run).
  // The optional Advanced / Analysis sections autosave too, so a live agent
  // with only optional edits must still read "not live yet" (audit 2026-07-07).
  const optionalDirty = () => {
    const base = baseline.current
    if (!base) return false
    return (
      JSON.stringify(draft.advanced ?? null) !== JSON.stringify(base.advanced ?? null) ||
      JSON.stringify(draft.analysis ?? null) !== JSON.stringify(base.analysis ?? null)
    )
  }
  const anyEdited = isLive && ([1, 2, 3, 4].some(stepDirty) || optionalDirty())
  const deploySub = isLive
    ? anyEdited
      ? "Edits are not live yet. Redeploy to apply."
      : "Changes apply on your next redeploy."
    : blockReason ?? "Review Step 5 and go live."

  return (
    // data-fluid opts out of the layout's 1536px cap: the builder uses the
    // whole viewport (composition-concept winner C5, 2026-07-07).
    <div data-fluid className="w-full space-y-6 px-4 py-8 pb-16 sm:px-6 xl:px-10 2xl:px-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {landing ? "Deploy an AI agent in minutes" : isEdit ? "Edit your agent" : "Create your agent"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {landing
              ? "Talk to your ready-made agent, set it up, and put it live."
              : isEdit
              ? "Edit anything below. Changes save automatically."
              : "Five steps to a live agent, in any order. Changes save automatically."}
          </p>
        </header>
        <div className="flex shrink-0 items-center gap-2">
            {/* The whole agent on one read-only surface, with per-section jump
                links into the editing steps. */}
            <CustomConfigDrawer draft={draft} onEditStep={openRow} onApply={applyConfigPatch} />
            {onCreateNew && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onCreateNew}>
                <Plus className="h-4 w-4" aria-hidden /> New agent
              </Button>
            )}
          </div>
      </div>

      {/* Tertiary tier: the "start differently" paths, demoted into a quiet
          alert-style banner so they read below the H1 and the agent (H2)
          without competing (hierarchy pass, 2026-07-08). */}
      {(!isEdit || landing) && (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
        >
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <p className="min-w-0">
            Prefer to start differently?{" "}
            {onBrowseTemplates && (
              <>
                <button
                  type="button"
                  onClick={onBrowseTemplates}
                  className="rounded font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Start from a template
                </button>
                {" or "}
              </>
            )}
            <ImportAgentSheet onImported={onImported}>
              <button
                type="button"
                className="rounded font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                import an existing agent
              </button>
            </ImportAgentSheet>
            . Vapi, Retell, Bland, and ElevenLabs configs map automatically.
          </p>
        </div>
      )}

      {/* Below lg the rail stacks above the sections and scrolls away, so a
          slim sticky strip keeps STEP NAV + progress + deploy in the fold
          (C2 harvest; top-12 = the app header's h-12, no see-through band). */}
      <div className="sticky top-12 z-30 -mx-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <span className="flex shrink-0 items-center gap-1" role="group" aria-label="Jump to step">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => openRow(n)}
              aria-label={`Step ${n}: ${stepTitle(n, draft)}${isDone(n) ? ", done" : ""}`}
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                isDone(n) ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground",
                n === selected && "ring-1 ring-ring",
              )}
            >
              {isDone(n) ? <Check className="h-3 w-3" aria-hidden /> : n}
            </button>
          ))}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{deploySub}</p>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={publish}>
          <Rocket className="h-3.5 w-3.5" aria-hidden /> {isLive ? "Redeploy" : "Deploy"}
        </Button>
      </div>

      {/* ONE-PAGER as a UNIFIED CARD (2026-07-08): the rail (LHS) and the step
          content (RHS) live inside one bordered surface split by a full-height
          divider, so they read as a single master-detail structure rather than
          two loose regions. Every step renders open; the sticky rail is agent
          lockup + scroll-spy step list + live deploy state. ?step=N scrolls. */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="grid grid-cols-1 items-start lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5 p-4 lg:sticky lg:top-16 lg:self-start lg:p-5">
          {/* Agent lockup */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <AgentSphere size={44} active={testing} />
              <div className="min-w-0 flex-1">
                {/* Agent name = the page's H2 (the subject under the H1 title).
                    It stays inline-editable; aria-label names the heading since
                    its only child is the input. */}
                <div className="flex items-center gap-2">
                  <h2 aria-label={draft.name || (isEdit ? existing!.name : "Your new agent")} className="min-w-0 flex-1">
                    <input
                      value={draft.name}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder={isEdit ? existing!.name : "Name your agent"}
                      aria-label="Agent name"
                      className="w-full rounded-md bg-transparent px-1 text-lg font-semibold tracking-tight outline-none placeholder:font-normal placeholder:text-muted-foreground/60 focus:bg-muted/50"
                    />
                  </h2>
                  <Badge variant="secondary" className="shrink-0">{cardStatus}</Badge>
                </div>
                <p className="truncate px-1 text-sm text-muted-foreground">
                  {isEdit ? (existing!.role ?? "Voice agent") : (cardVoice?.name ?? "Pick a voice to start")}
                </p>
                {/* Edit state lives in a badge, not baked into the name/CTA.
                    Its own row so it never truncates the role line. */}
                {isLive && anyEdited && (
                  <div className="px-1 pt-1">
                    <Badge variant="warning">Unsaved changes</Badge>
                  </div>
                )}
              </div>
            </div>
            {/* Always outline: this button OPENS the Talk panel. Turning it
                red mid-test made it read as "end call" while it did no such
                thing (audit 2026-07-07); truncate guards long agent names. */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5"
              onClick={() => setTalkOpen(true)}
            >
              <Mic className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{testing ? "Open the live test" : `Talk to ${draft.name || "your agent"}`}</span>
            </Button>
          </div>

          {/* Scroll-spy step list — recaps make it a recognition map (C3 harvest). */}
          <nav aria-label="Build steps" className="space-y-0.5">
            {[1, 2, 3, 4, 5].map((n) => {
              const done = isDone(n)
              const Icon = STEP_ICONS[n]
              const detail = rowDetail(n)
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => openRow(n)}
                  aria-current={n === selected && !activeOpt ? "step" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/40",
                    n === selected && !activeOpt && "bg-accent/60",
                  )}
                >
                  <span className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    done ? "border-success/40 bg-success/10 text-success" : "border-border text-muted-foreground",
                  )}>
                    {done ? <Check className="h-3 w-3" aria-hidden /> : <Icon className="h-3 w-3" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{stepTitle(n, draft)}</span>
                    <span className="line-clamp-1 block text-xs text-muted-foreground" title={detail}>{detail}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Optional depth — power-user sections, not part of "N of 5". */}
          <div className="space-y-0.5">
            <p className="px-2.5 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Optional</p>
            {([
              { key: "advanced" as const, label: "Advanced", icon: SlidersHorizontal },
              { key: "analysis" as const, label: "Analysis", icon: ListChecks },
            ]).map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => openOptional(o.key)}
                aria-current={activeOpt === o.key ? "location" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/40",
                  activeOpt === o.key && "bg-accent/60",
                )}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                  <o.icon className="h-3 w-3" aria-hidden />
                </span>
                <span className="text-sm font-medium">{o.label}</span>
              </button>
            ))}
          </div>

          {/* Deploy state — honest about pending edits (audit fix: every
              operator run flagged the missing dirty signal). */}
          <div className={cn(
            "space-y-2.5 rounded-lg border p-3",
            isLive ? "border-success/40 bg-success/10" : "border-border bg-card",
          )}>
            {/* ONE progress fraction: the step list above already shows what's
                done; a second "N of 5" with a different denominator read as a
                contradiction (audit 2026-07-07). */}
            <div>
              <p className="text-sm font-semibold">
                {isLive ? `Live on ${channelTarget(draft)}` : `${setupCount} of 4 set up`}
              </p>
              <p className="text-xs text-muted-foreground">{deploySub}</p>
            </div>
            <Button className="w-full gap-1.5" onClick={publish}>
              <Rocket className="h-4 w-4" aria-hidden /> {isLive ? "Redeploy" : "Deploy"}
            </Button>
            {/* One action to walk away from ALL pending edits (owner call,
                2026-07-07) — shown only when something is actually pending. */}
            {isLive && anyEdited && (
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={discardEdits}>
                Discard edits
              </Button>
            )}
            {saveState !== "idle" && (
              <p className="text-center text-xs text-muted-foreground" role="status" aria-live="polite">
                {saveState === "saving" ? "Saving…" : "Saved"}
              </p>
            )}
          </div>
        </aside>

        {/* RHS pane of the unified card: the steps are borderless sections
            separated by a divider (the card frame + the LHS border-l give the
            structure), not nested cards. Sections cap content width so 4K shows
            structure, not 900px inputs (audit width-discipline fix). */}
        <div className="min-w-0 divide-y divide-border border-t border-border lg:border-t-0 lg:border-l">
          {[1, 2, 3, 4, 5].map((n) => {
            const Icon = STEP_ICONS[n]
            return (
              <section
                key={n}
                id={`wizard-step-${n}`}
                aria-labelledby={`wizard-step-${n}-title`}
                className="scroll-mt-24"
              >
                <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* The header icon NAMES the section (its own icon), never a
                        completion tick — done-state already lives in the rail;
                        duplicating it here read as noise (owner call 2026-07-08). */}
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <h3 id={`wizard-step-${n}-title`} className="truncate text-sm font-semibold">{stepTitle(n, draft)}</h3>
                  </div>
                  {/* LIVE agents only: with autosave there is no Save/Cancel,
                      so this is the one way back to the deployed config after
                      an accidental edit. Icon-only + tooltip — a quiet affordance,
                      not a text button competing with the title (owner 2026-07-08). */}
                  {isLive && n < 5 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground"
                          disabled={!stepDirty(n)}
                          onClick={() => resetStep(n)}
                          aria-label="Reset this step to the live version"
                        >
                          <Undo2 className="h-3.5 w-3.5" aria-hidden />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset this step to the live version</TooltipContent>
                    </Tooltip>
                  )}
                </header>
                {/* Width discipline: cap the text-heavy steps so 4K doesn't
                    stretch inputs; card-grid steps (2) span the full pane. */}
                <div className={cn("px-5 py-5", (n === 4 || n === 5) && "[&>*]:max-w-4xl")}>
                  {n === 1 && <StepVoice draft={draft} update={update} onSelectVoice={selectVoice} />}
                  {n === 2 && <StepType draft={draft} update={(patch) => (patch.type ? selectType(patch.type) : update(patch))} />}
                  {n === 3 && <StepBuild draft={draft} update={update} />}
                  {n === 4 && <StepConfigure draft={draft} update={update} />}
                  {n === 5 && (
                    <StepPublish
                      draft={draft}
                      onPublish={publish}
                      onFix={(m) => openRow(m)}
                      talking={testing}
                      onToggleTalk={toggleTest}
                    />
                  )}
                </div>
              </section>
            )
          })}

          {/* Optional depth: Advanced (F1). Collapsed by default. */}
          <OptionalSection
            id="wizard-opt-advanced"
            icon={SlidersHorizontal}
            title="Advanced"
            summary="Turn-taking · speech · filter words · history"
            open={optOpen.advanced}
            onOpenChange={(o) => setOptOpen((s) => ({ ...s, advanced: o }))}
          >
            <StepAdvanced
              value={draft.advanced}
              onChange={(advanced) => update({ advanced })}
              realtime={draft.stack.pipeline === "mllm"}
            />
          </OptionalSection>

          {/* Optional depth: Analysis / structured outputs (F8). */}
          <OptionalSection
            id="wizard-opt-analysis"
            icon={ListChecks}
            title="Analysis"
            summary="Transcription · structured data points"
            open={optOpen.analysis}
            onOpenChange={(o) => setOptOpen((s) => ({ ...s, analysis: o }))}
          >
            <StepAnalysis
              value={draft.analysis}
              onChange={(analysis) => update({ analysis })}
            />
          </OptionalSection>
        </div>
        </div>
      </div>

      {/* Talk panel — the agent's full identity card + live test, on demand.
          Steps render inline now, so the ONLY job of the right panel is
          "meet/test your agent" (master-detail direction, 2026-07-07). */}
      <Sheet open={talkOpen} onOpenChange={setTalkOpen}>
        {/* Don't autofocus the card's name input — Radix would select its text
            and one stray keystroke would rename the agent. Esc/tab still work
            (dismiss listens on the document; the focus trap catches Tab). */}
        <SheetContent
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">{draft.name || (isEdit ? existing!.name : "Your new agent")}</SheetTitle>
            <p className="text-sm text-muted-foreground">Agent details & live test</p>
          </SheetHeader>
          <div className="p-4">
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
              channel={draft.type ? {
                label: channelLine(draft),
                onClick: () => { setTalkOpen(false); openRow(4) },
              } : undefined}
              talking={testing}
              onToggleTalk={toggleTest}
              talkLabel={`Talk to ${draft.name || "your agent"}`}
              endLabel="End test"
              className="border-0 p-2 lg:static"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** An optional, collapsed-by-default depth section in the one-pager (Advanced,
 *  Analysis). Same card chrome as a step, but toggle-expanded and un-numbered. */
function OptionalSection({
  id, icon: Icon, title, summary, open, onOpenChange, children,
}: {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  summary: string
  open: boolean
  onOpenChange: (o: boolean) => void
  children: React.ReactNode
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <section id={id} className="scroll-mt-24">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{title}</span>
                  <Badge variant="outline" className="shrink-0 text-muted-foreground">Optional</Badge>
                </span>
                <span className="line-clamp-1 block text-xs text-muted-foreground">{summary}</span>
              </span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="border-t border-border px-5 py-5">
          {children}
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

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
  // The voice carries its engine (2026-07-07): presets and Playground customs
  // both ship a COHERENT stack (vendor + voice always match). The builder's
  // spoken language wins (it's a Step-1 agent trait, not part of the voice).
  // A legacy custom saved before this change has no stack → keep the current
  // stack but force an ElevenLabs voice so vendor + voice stay coherent.
  const stack = v.stack
    ? { ...v.stack, language: d.stack.language }
    : { ...d.stack, tts: { vendor: "ElevenLabs", voice: v.ttsVoice } }
  return {
    ...d,
    voice: { kind: v.kind, id: v.id },
    name: d.name || v.name,
    stack,
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
