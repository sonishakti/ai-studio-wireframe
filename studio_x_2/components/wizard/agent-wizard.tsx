"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Rocket, Mic, Plus, Undo2, SlidersHorizontal, ListChecks, Timer, ChevronDown, Sparkles } from "lucide-react"
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
import { CallSettings } from "@/components/wizard/step-call-settings"
import { STEP_TITLES, STEP_ICONS, stepTitle, stepManifest } from "@/components/wizard/types"
import { publishDeployment } from "@/components/wizard/channel-configs"
import { useDebouncedEffect } from "@/hooks/use-debounced-effect"
import { markBuildStart, track, Events } from "@/lib/analytics"
import { getAgent, stackLine, stackEstimateFor, presetLatencyBreakdown, AGENT_TEMPLATES, STACK_PRESETS, PHONE_NUMBERS, type ImportedAgentConfig } from "@/lib/campaign-data"
import {
  getVoiceArtifact, defaultPromptFor, type VoiceArtifact,
} from "@/lib/voice-artifacts"
import {
  importedConfigToArtifact, importedAgentToDraft, stashImportNotice, takeImportNotice,
} from "@/lib/import-agent"
import {
  EMPTY_DRAFT, agentToDraft, templateToDraft, restoreDraft, saveDraft, clearDraft,
  publishBlockReason, channelTarget, typeLabel, MOCK_CSV_ROWS, type AgentDraft, type AgentType,
} from "@/lib/wizard-draft"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

/**
 * AgentWizard — the unified creation surface (new · edit · onboarding · empty).
 *
 * A SCROLL-SPY ONE-PAGER (composition winner C5, 2026-07-07): all four steps
 * render open in the main column (owner 2026-07-13: channel connection lives
 * INSIDE Deploy — "connect a phone number" is not a step); a sticky rail holds
 * the agent lockup, the step list (spy-highlighted, with value recaps), and
 * the live deploy state.
 * NOTHING IS LOCKED — every field is editable at any time, zero clicks to
 * reach any of it. Publish is a HINT, not a gate: the reason is shown, the
 * button still works. Deep-links: `?step=N` scrolls to a section, `?dc=`
 * presets a channel + scrolls to Configure, `?artifact=` selects a custom
 * voice. Draft autosaves; live agents get per-section "Reset to live".
 */
export function AgentWizard({
  id,
  landing,
  warming,
  autoTalk,
  blank,
  onCreateNew,
  onBrowseTemplates,
  onImportAsNew,
}: {
  id: string
  /** Rendered inline on /agents (not the standalone edit route) — show the
   *  first-run chrome (secondary-starts line + inviting heading + create). */
  landing?: boolean
  /** First-run only: the user left the provisioning ceremony early, so Aria
   *  is still warming — Talk is disabled WITH its promise attached ("this
   *  exact button flips on"), never silently dead. */
  warming?: boolean
  /** Open the Talk panel on mount — the ceremony's "Say hello" CTA must land
   *  IN the conversation, not on a form (user-test 2026-07-09 S2). */
  autoTalk?: boolean
  /** Start truly blank, skipping the draft restore. A PROP (not just ?blank=1)
   *  because "New agent" remounts this component in the same tick as its
   *  router.push — the mount effect would read the OLD URL and resurrect a
   *  stale draft (race found in the 2026-07-07 walkthrough). */
  blank?: boolean
  onCreateNew?: () => void
  /** Opens the starter-templates sheet — templates must be reachable from the
   *  default landing, not just the list view (heuristic-eval #4). */
  onBrowseTemplates?: () => void
  /** "Create as new agent" from the import dialog: the host page remounts the
   *  builder on the seeded new-agent draft INLINE (no page hop). Without it
   *  (standalone edit route) the wizard falls back to /agents/new/edit. */
  onImportAsNew?: () => void
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
  React.useEffect(() => {
    if (autoTalk) setTalkOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTalk])
  // Optional depth sections (Advanced / Analysis / Call settings) — collapsed
  // by default so the novice skips them; the rail entry expands + scrolls.
  const [optOpen, setOptOpen] = React.useState<{ advanced: boolean; analysis: boolean; call: boolean }>({ advanced: false, analysis: false, call: false })
  // Which section the scroll-spy currently highlights when it's an optional one
  // (numbered steps live in `openStep`; the two coordinate so exactly one rail
  // row reads active).
  const [activeOpt, setActiveOpt] = React.useState<"advanced" | "analysis" | "call" | null>(null)
  // muteSpy is defined further down (after the scroll refs); a ref lets the
  // earlier openOptional reach it without a use-before-define.
  const muteSpyRef = React.useRef<(ms: number) => void>(() => {})
  const openOptional = (key: "advanced" | "analysis" | "call") => {
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
  // Step 4 (Deploy) is deployment itself: ✓ only when the agent is actually
  // live — "complete" next to "Everything's set" was a contradiction (#13).
  // Channel facts (number attached, CSV in) surface through the row recap.
  const isLive = isEdit && existing!.status === "live"
  const isDone = (n: number) =>
    n === 1 ? voiceDone : n === 2 ? typeDone : n === 3 ? promptDone : isLive
  const setupCount = [1, 2, 3].filter(isDone).length

  // Row detail line — ALWAYS informative (heuristic-eval #1): summaries are
  // recognition data, not a completion reward, so prefer real values whenever
  // they exist, ✓ or not; fall back to the step's content manifest.
  const rowDetail = (n: number): string => {
    const summary = stepSummary(n)
    if (summary) return summary
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
    // Old ?step=5 links (pre-2026-07-13, when Deploy was the fifth step) land
    // on the merged Deploy step instead of dangling.
    const stepToOpen = stepParam >= 1 && stepParam <= 4 ? stepParam : stepParam === 5 ? 4 : null
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
      // An import just landed here ("Create as new agent" / list-view import
      // writes the slot, then remounts the builder) — say THAT, not a generic
      // "Draft restored", and offer the replaced draft back if there was one.
      const notice = takeImportNotice()
      if (notice) {
        const prev = notice.prev
        // Stable id: the StrictMode replay REPLACES this toast instead of
        // stacking a duplicate.
        toast.success(`${notice.name} imported as a new agent`, {
          id: "import-landing",
          description: notice.hadPrompt
            ? "Voice, engine, prompt, and greeting came in. Point it at a channel and deploy."
            : "Voice and engine came in — the export had no prompt, so we started one for you.",
          action: prev
            ? {
                label: "Undo import",
                onClick: () => {
                  dirty.current = true
                  setDraft(prev)
                  saveDraft(prev)
                },
              }
            : undefined,
        })
      } else {
        toast("Draft restored", { description: `Picked up at Step ${at}: ${STEP_TITLES[at - 1]}.` })
      }
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
      if (typeof n === "number" && n >= 1 && n <= 4) {
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
            setActiveOpt(id.replace("wizard-opt-", "") as "advanced" | "analysis" | "call")
          } else {
            const n = Number(id.replace("wizard-step-", ""))
            if (n >= 1 && n <= 4) { setOpenStep(n); setActiveOpt(null) }
          }
        }
      },
      { rootMargin: "-15% 0px -65% 0px" },
    )
    for (let i = 1; i <= 4; i++) {
      const el = document.getElementById(`wizard-step-${i}`)
      if (el) obs.observe(el)
    }
    for (const key of ["advanced", "analysis", "call"]) {
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

  // ── Import landing (user-test #6, 2×S1) ─────────────────────────────────────
  // The old path pushed every import through seedFromVoice, whose keep-existing-
  // prompt rule (right for voice SWITCHING) silently dropped the imported prompt
  // whenever the open draft (Aria) already had one — while the toast claimed the
  // prompt was "below". Now the import is routed EXPLICITLY: editing a saved
  // agent asks where it lands (new agent vs apply here), and applying over a
  // non-empty prompt asks which prompt wins. Every toast states what happened.
  const [importPending, setImportPending] = React.useState<
    { config: ImportedAgentConfig; phase: "dest" | "conflict" } | null
  >(null)

  const promptConflict = (config: ImportedAgentConfig) => {
    const cur = draftRef.current.systemPrompt.trim()
    const inc = config.systemPrompt?.trim()
    return !!(cur && inc && cur !== inc)
  }

  const onImported = (config: ImportedAgentConfig) => {
    if (isEdit) {
      // A saved agent is open — the import must never silently rewrite it.
      setImportPending({ config, phase: "dest" })
      return
    }
    if (promptConflict(config)) {
      setImportPending({ config, phase: "conflict" })
      return
    }
    applyImport(config, { replacePrompt: true })
  }

  /** Apply the import INTO the open draft. Voice + engine always update;
   *  `replacePrompt` decides whether the imported prompt/greeting overwrite
   *  non-empty ones (seedFromVoice alone keeps existing text). */
  const applyImport = (config: ImportedAgentConfig, opts: { replacePrompt: boolean }) => {
    const artifact = importedConfigToArtifact(config)
    const before = JSON.parse(JSON.stringify(draftRef.current)) as AgentDraft
    const hadOwnPrompt = !!before.systemPrompt.trim()
    const importedPrompt = !!config.systemPrompt?.trim()
    dirty.current = true
    setDraft((d) => {
      const seeded = seedFromVoice(d, artifact)
      if (opts.replacePrompt && importedPrompt) {
        return {
          ...seeded,
          systemPrompt: config.systemPrompt!,
          greeting: config.firstMessage?.trim() ? config.firstMessage : seeded.greeting,
        }
      }
      return seeded
    })
    const promptChanged = importedPrompt ? opts.replacePrompt || !hadOwnPrompt : !hadOwnPrompt
    toast.success(
      importedPrompt && !promptChanged
        ? `${config.name} applied — kept your prompt`
        : `${config.name} applied`,
      {
        description:
          importedPrompt && promptChanged && hadOwnPrompt
            ? "Imported prompt and greeting replaced this draft's. Voice and engine updated too."
            : importedPrompt && promptChanged
              ? "Voice, engine, prompt, and greeting are in. Review below."
              : importedPrompt
                ? "Voice and engine updated; your prompt and greeting stayed."
                : hadOwnPrompt
                  ? "Voice and engine updated — the export had no prompt, so yours stayed."
                  : "Voice and engine updated — the export had no prompt, so we started one for you.",
        action: {
          label: "Undo",
          onClick: () => {
            dirty.current = true
            setDraft(before)
          },
        },
      },
    )
    // Review lands where the change is: the prompt when it moved, else voice.
    openRow(promptChanged ? 3 : 1)
  }

  /** Land the import as its OWN draft — the open agent stays untouched. Writes
   *  the new-agent slot, stashes the landing notice (with the replaced draft,
   *  if any, for Undo), and remounts the builder on it. */
  const createAsNewFromImport = (config: ImportedAgentConfig) => {
    const artifact = importedConfigToArtifact(config)
    const seeded = importedAgentToDraft(config, artifact)
    const prev = restoreDraft()
    const prevHasWork = !!(prev && (prev.name.trim() || prev.systemPrompt.trim() || prev.voice))
    saveDraft(seeded)
    stashImportNotice({
      name: config.name,
      hadPrompt: !!config.systemPrompt?.trim(),
      prev: prevHasWork ? prev! : undefined,
    })
    if (onImportAsNew) onImportAsNew()
    else router.push("/agents/new/edit")
  }

  const publishingRef = React.useRef(false)
  // Batch pre-flight — a ref (not state) so the confirmed re-entry into
  // publish() can't race the dialog's close render.
  const batchConfirmedRef = React.useRef(false)
  const [batchConfirmOpen, setBatchConfirmOpen] = React.useState(false)
  const publish = () => {
    if (publishingRef.current) return // guard: double-click must not double-publish
    const reason = publishBlockReason(draftRef.current)
    if (reason) { toast.error("Not ready to deploy yet", { description: reason }); return }
    // Batch pre-flight (user-test 2026-07-09, S2 ×2 personas): one click must
    // never start dialing a whole contact list silently — confirm the count,
    // caller ID, window, and an honest cost estimate first.
    if (draftRef.current.type === "outbound" && !batchConfirmedRef.current) {
      setBatchConfirmOpen(true)
      return
    }
    batchConfirmedRef.current = false
    publishingRef.current = true
    // Disarm any pending debounced autosave BEFORE clearing the slot — a save
    // firing mid-navigation would resurrect the consumed draft (re-eval #16).
    dirty.current = false
    const agentId = draft.agentId ?? `agt_${Date.now().toString(36)}`
    publishDeployment({
      router, agentId, agentName: draft.name || "Your agent",
      channel: channelLabel(draft), name: draft.name || "Deployment",
      mode: draft.type ?? undefined,
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
      // LIVE target comes from the deployed BASELINE, never the draft — a draft
      // mid-reconfiguration rendered "live on No contacts yet" (user-test P0 #1).
      if (isLive) return `Deployed · live on ${channelTarget(baseline.current ?? draft)}`
      if (!draft.type) return undefined
      return channelLine(draft)
    }
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
    : blockReason ?? "Review the Deploy step and go live."

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
              ? isLive
                ? "Your ready-made agent is already live. Talk to it, then make it yours."
                : "Talk to your ready-made agent, set it up, and put it live."
              : isEdit
              ? "Edit anything below. Changes save automatically."
              : "Four steps to a live agent, in any order. Changes save automatically."}
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
            . Vapi, Retell, Bland, and ElevenLabs exports map in — with a field-by-field report of
            what carried.
          </p>
        </div>
      )}

      {/* Below lg the rail stacks above the sections and scrolls away, so a
          slim sticky strip keeps STEP NAV + progress + deploy in the fold
          (C2 harvest; top-12 = the app header's h-12, no see-through band). */}
      <div className="sticky top-12 z-30 -mx-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <span className="flex shrink-0 items-center gap-1" role="group" aria-label="Jump to step">
          {[1, 2, 3, 4].map((n) => (
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
              {n}
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
                  {/* The default agent's "why is this Live / who pays" answer
                      lives in a tooltip ON the badge that raises the question,
                      not as an always-visible strip (owner 2026-07-09). */}
                  {landing ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="shrink-0 cursor-help">{warming ? "Warming up" : cardStatus}</Badge>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[240px]">
                        <p className="font-medium">Provisioned free. Testing in-browser costs nothing.</p>
                        <p className="mt-1 text-primary-foreground/70">
                          Runs Agora Balanced: {STACK_PRESETS.balanced.llm.model} · {STACK_PRESETS.balanced.asr.vendor} {STACK_PRESETS.balanced.asr.model} · {STACK_PRESETS.balanced.tts.vendor}. Change it in step 1.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">{warming ? "Warming up" : cardStatus}</Badge>
                  )}
                </div>
                {/* No role tag under the name (owner 2026-07-09) — the rail's
                    Voice row already recaps the persona. New drafts keep the
                    pick-a-voice nudge until one is chosen. */}
                {!isEdit && (
                  <p className="truncate px-1 text-sm text-muted-foreground">
                    {cardVoice?.name ?? "Pick a voice to start"}
                  </p>
                )}
              </div>
            </div>
            {/* Always outline: this button OPENS the Talk panel. Turning it
                red mid-test made it read as "end call" while it did no such
                thing (audit 2026-07-07); truncate guards long agent names. */}
            {/* Hero on first landing: with a live agent and nothing changed,
                "talk to it" IS the pitch — Redeploy shouting before any edit was
                a meaningless CTA (user-test 2026-07-09). They swap once dirty. */}
            <Button
              variant={isLive && !anyEdited ? "default" : "outline"}
              size="sm"
              className="w-full gap-1.5"
              disabled={warming}
              onClick={() => setTalkOpen(true)}
            >
              <Mic className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{testing ? "Open the live test" : `Talk to ${draft.name || "your agent"}`}</span>
            </Button>
            {warming && (
              <p role="status" className="text-xs text-muted-foreground">
                Warming up. This exact button flips on the moment it finishes.
              </p>
            )}
          </div>

          {/* Scroll-spy step list — recaps make it a recognition map (C3 harvest).
              Plain icon + label rows, same idiom as the app sidebar: NO completion
              ticks (owner 2026-07-08) — the recap line under each title already
              says what's set, and the deploy block carries overall progress. */}
          <nav aria-label="Build steps" className="space-y-0.5">
            {[1, 2, 3, 4].map((n) => {
              const Icon = STEP_ICONS[n]
              const detail = rowDetail(n)
              const active = n === selected && !activeOpt
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => openRow(n)}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/40",
                    active && "bg-accent/60",
                  )}
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{stepTitle(n, draft)}</span>
                    <span className="line-clamp-1 block text-xs text-muted-foreground" title={detail}>{detail}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Optional depth — power-user sections, not part of "N of 3".
              Three of them (owner 2026-07-13): Advanced · Analysis · Call
              settings. */}
          <div className="space-y-0.5">
            <p className="px-2.5 pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">Optional</p>
            {([
              { key: "advanced" as const, label: "Advanced", icon: SlidersHorizontal },
              { key: "analysis" as const, label: "Analysis", icon: ListChecks },
              { key: "call" as const, label: "Call settings", icon: Timer },
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
                <o.icon className={cn("h-4 w-4 shrink-0", activeOpt === o.key ? "text-foreground" : "text-muted-foreground")} aria-hidden />
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
            <div className="space-y-1">
              {/* The heading reports what is live IN PRODUCTION — always the
                  deployed baseline's target. Reading the draft here produced
                  "Live on No contacts yet" mid-reconfiguration, corrupting the
                  one string whose job is production truth (user-test P0 #1). */}
              <p className="text-sm font-semibold">
                {isLive ? `Live on ${channelTarget(baseline.current ?? draft)}` : `${setupCount} of 3 set up`}
              </p>
              {/* Edit-state lives HERE — one fixed slot in the deploy block,
                  where "not live yet" is decided. The badge REPLACES the prose
                  when edits are pending (same message twice = noise); under the
                  agent name it flickered and shoved the lockup (owner
                  2026-07-09). */}
              {isLive && anyEdited ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Badge variant="warning">Unsaved changes</Badge> Redeploy to apply.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{deploySub}</p>
              )}
            </div>
            <Button
              variant={isLive && !anyEdited ? "outline" : "default"}
              className="w-full gap-1.5"
              onClick={publish}
            >
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
        {/* No overflow-hidden here — it would break the sticky section headers
            (sticky can't escape a clipped ancestor). The rail is unaffected (it
            lives in the other grid column). Corners: the first header rounds to
            match the card's top-right (2026-07-08). */}
        <div className="min-w-0 divide-y divide-border border-t border-border lg:border-t-0 lg:border-l">
          {[1, 2, 3, 4].map((n) => {
            const Icon = STEP_ICONS[n]
            return (
              <section
                key={n}
                id={`wizard-step-${n}`}
                aria-labelledby={`wizard-step-${n}-title`}
                className="scroll-mt-24"
              >
                {/* Banded header: an opaque strip + bordered icon chip marks
                    where each section STARTS — a 1px divider alone read as one
                    flat page (arrange pass, 2026-07-08). STICKY on desktop
                    (lg:top-12 = under the app header) so the current section's
                    title stays anchored while you scroll it; bg must be opaque so
                    content slides cleanly under. The icon NAMES the section;
                    never a completion tick (rail + deploy block own progress). */}
                <header className={cn(
                  "z-20 flex items-center justify-between gap-3 border-b border-border bg-muted px-5 py-3 lg:sticky lg:top-12",
                  n === 1 && "lg:rounded-tr-2xl",
                )}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <h3 id={`wizard-step-${n}-title`} className="truncate text-sm font-semibold">{stepTitle(n, draft)}</h3>
                  </div>
                  {/* LIVE agents only: with autosave there is no Save/Cancel,
                      so this is the one way back to the deployed config after
                      an accidental edit. HIDDEN until the step actually differs
                      from live — a control you can't use is noise, not state
                      (owner 2026-07-09). Icon-only + tooltip. */}
                  {isLive && stepDirty(n) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 text-muted-foreground"
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
                {/* Width discipline: steps 1/3 cap themselves; 2 and 4 manage
                    their own layout (type cards + the batch-calls split and the
                    widget studio need the full pane). py-6 gives each section
                    air under its header band. */}
                <div className="px-5 py-6">
                  {n === 1 && <StepVoice draft={draft} update={update} onSelectVoice={selectVoice} />}
                  {n === 2 && (
                    <StepType
                      draft={draft}
                      update={(patch) => (patch.type ? selectType(patch.type) : update(patch))}
                      liveNote={isLive && baseline.current
                        ? `${draft.name || "Your agent"} is live on ${channelTarget(baseline.current)}. Switching sets that aside (undoable) and applies on redeploy.`
                        : undefined}
                    />
                  )}
                  {n === 3 && <StepBuild draft={draft} update={update} />}
                  {/* Deploy = channel connection + review + go live, ONE step
                      (owner 2026-07-13): "Choose how callers reach your agent"
                      lives here, and connecting a number is not a step. */}
                  {n === 4 && (
                    <div className="space-y-8">
                      <StepConfigure draft={draft} update={update} />
                      <div className="border-t border-border pt-6 [&>*]:max-w-4xl">
                        <StepPublish
                          draft={draft}
                          live={isLive}
                          onPublish={publish}
                          onFix={(m) => openRow(m)}
                          talking={testing}
                          onToggleTalk={toggleTest}
                        />
                      </div>
                    </div>
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

          {/* Optional depth: Call settings — the batch tuning that used to
              crowd the channel step (owner 2026-07-13: three in advanced). */}
          <OptionalSection
            id="wizard-opt-call"
            icon={Timer}
            title="Call settings"
            summary="Call window · concurrency · retries"
            open={optOpen.call}
            onOpenChange={(o) => setOptOpen((s) => ({ ...s, call: o }))}
          >
            <CallSettings draft={draft} update={update} />
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
          className="flex w-full flex-col gap-0 overflow-y-auto p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">{draft.name || (isEdit ? existing!.name : "Your new agent")}</SheetTitle>
            <p className="text-sm text-muted-foreground">Agent details & test</p>
            {/* Say what the test IS. All three personas clicked, watched a silent
                orb, and could not tell working from broken (user-test 2026-07-09).
                The real transcript lives behind the future-scope flag. */}
            <p className="text-xs text-muted-foreground">
              Simulated preview. No live audio in this wireframe, and testing in-browser is free.
            </p>
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

      {/* Batch pre-flight — the ONE confirmation in the wizard. Deploying an
          outbound agent starts real calls to a whole list; the moment deserves
          a manifest (count · caller ID · window · honest cost estimate), and
          "talk to it first" is offered as the safer path. */}
      <AlertDialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Start calling {MOCK_CSV_ROWS} contacts?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  Deploying starts the batch immediately — {draft.name || "your agent"} dials
                  every contact in {draft.config.outbound?.csvName ?? "your list"}.
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>· Caller ID: {PHONE_NUMBERS.find((n) => n.id === draft.config.outbound?.numberId)?.number ?? "selected number"}</li>
                  <li>· Call window: {draft.config.outbound?.callWindow === "anytime" ? "anytime" : draft.config.outbound?.callWindow === "extended" ? "extended hours" : "business hours (contact's local time)"}</li>
                  {/* Same default the Step-4 select shows — the manifest of
                      truth must not disagree with the setting (user-test S3). */}
                  <li>· Up to {draft.config.outbound?.maxConcurrent ?? 10} calls at once</li>
                  <li className="tabular-nums">
                    {/* Rate derives from THIS agent's stack — a hardcoded 0.10
                        overquoted cheaper presets 66% at the moment of spend
                        approval (user-test 2026-07-09 P0). */}
                    · Estimate: ~${Math.round(MOCK_CSV_ROWS * 2 * cardEst.costPerMin)} if every
                    call runs ~2 min at ${cardEst.costPerMin.toFixed(2)}/min — actual cost
                    follows real talk time
                  </li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="ghost"
              onClick={() => { setBatchConfirmOpen(false); setTalkOpen(true) }}
            >
              Talk to it first
            </Button>
            <AlertDialogCancel>Not yet</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                batchConfirmedRef.current = true
                setBatchConfirmOpen(false)
                publish()
              }}
            >
              Start the batch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import landing — never silent (user-test #6, 2×S1). Phase "dest": a
          saved agent is open, so the import asks where it lands. Phase
          "conflict": applying over a non-empty prompt asks which prompt wins.
          Cancel aborts the whole import — nothing is written until a choice. */}
      <AlertDialog open={!!importPending} onOpenChange={(o) => { if (!o) setImportPending(null) }}>
        <AlertDialogContent>
          {importPending?.phase === "dest" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Where should {importPending.config.name} land?</AlertDialogTitle>
                <AlertDialogDescription>
                  You&apos;re editing {existing?.name ?? "an agent"}{isLive ? ", which is live" : ""}. Import{" "}
                  {importPending.config.name} as its own agent, or apply its voice, engine, and prompt to{" "}
                  {existing?.name ?? "this agent"}{isLive ? " — applied changes only go live when you redeploy" : ""}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <Button
                  variant="outline"
                  onClick={() => {
                    const config = importPending.config
                    if (promptConflict(config)) {
                      setImportPending({ config, phase: "conflict" })
                    } else {
                      setImportPending(null)
                      applyImport(config, { replacePrompt: true })
                    }
                  }}
                >
                  Apply to {existing?.name ?? "this agent"}
                </Button>
                <AlertDialogAction
                  onClick={() => {
                    const config = importPending.config
                    setImportPending(null)
                    createAsNewFromImport(config)
                  }}
                >
                  Create as new agent
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : importPending ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>Which prompt should this agent use?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2.5 text-sm">
                    <p>
                      {draft.name || "This draft"} already has a prompt, and {importPending.config.name} brings
                      its own. Voice and engine update either way.
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-xs">
                        <span className="font-medium text-foreground">Current</span>{" "}
                        <span className="text-muted-foreground">
                          “{truncPrompt(draft.systemPrompt)}”
                        </span>
                      </p>
                      <p className="text-xs">
                        <span className="font-medium text-foreground">Imported</span>{" "}
                        <span className="text-muted-foreground">
                          “{truncPrompt(importPending.config.systemPrompt ?? "")}”
                        </span>
                      </p>
                    </div>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel import</AlertDialogCancel>
                <Button
                  variant="outline"
                  onClick={() => {
                    const config = importPending.config
                    setImportPending(null)
                    applyImport(config, { replacePrompt: false })
                  }}
                >
                  Keep current prompt
                </Button>
                <AlertDialogAction
                  onClick={() => {
                    const config = importPending.config
                    setImportPending(null)
                    applyImport(config, { replacePrompt: true })
                  }}
                >
                  Use imported prompt
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : null}
        </AlertDialogContent>
      </AlertDialog>
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
          {/* Same banded, sticky header language as the numbered sections, so
              optional depth reads as a peer section, not stray rows (arrange
              2026-07-08). Opaque bg so content scrolls cleanly under it. */}
          <button type="button" className="z-20 flex w-full items-center justify-between gap-3 border-b border-border bg-muted px-5 py-3 text-left transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:sticky lg:top-12">
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
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
        <CollapsibleContent className="px-5 py-6">
          {children}
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

/** The first step whose completion predicate is unmet — used only for the
 *  "Start here" nudge + restore cursor. Not a gate. Channel + go-live share
 *  step 4 now, so anything past the prompt resumes there. */
function firstIncomplete(d: AgentDraft): number {
  if (d.voice === null) return 1
  if (d.type === null) return 2
  if (d.systemPrompt.trim() === "") return 3
  return 4
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

/** One-line preview for the prompt-conflict dialog — enough to recognize
 *  which prompt is which, not to read it. */
function truncPrompt(s: string, n = 90): string {
  const flat = s.replace(/\s+/g, " ").trim()
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat
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
