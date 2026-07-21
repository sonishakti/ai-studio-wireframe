"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Rocket, Mic, Plus, Undo2, ChevronDown, ChevronRight, CircleCheck, Bot, Copy, Check, EllipsisVertical, Upload, FileText, KeyRound } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { AgentIdentityCard } from "@/components/agent-identity-card"
import { AgentSphere } from "@/components/agent-test-panel"
import { AgentPreviewPanel } from "@/components/wizard/agent-preview-panel"
import { useCopyFeedback } from "@/hooks/use-copy-feedback"
import { CustomConfigDrawer } from "@/components/custom-config-drawer"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { StepVoice } from "@/components/wizard/step-voice"
import { StepAdvanced, HistoryField } from "@/components/wizard/step-advanced"
import { StepType } from "@/components/wizard/step-type"
import { SectionPrompt } from "@/components/wizard/section-prompt"
import { SectionKnowledgeTools } from "@/components/wizard/step-build"
import { StepConfigure } from "@/components/wizard/step-configure"
import { StepPublish } from "@/components/wizard/step-publish"
import { CallSettings } from "@/components/wizard/step-call-settings"
import { StepAnalysis } from "@/components/wizard/step-analysis"
import { StackTradeoffSlider, StackModelsDetail, StackModelPicker } from "@/components/wizard/stack-config"
import { TestsSection } from "@/components/eval-tests"
import { STEP_TITLES, STEP_ICONS, SECTION_GROUPS, SECTION_COUNT, stepTitle, stepToc } from "@/components/wizard/types"
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
 * A SCROLL-SPY ONE-PAGER in v3 JOURNEY ORDER (IA doc 2026-07-17): the agent
 * ships working on universal defaults, so the sections run Channel → Prompt
 * (Set up) → Voice & speech · Models · Knowledge & Tools (Customize, collapsed)
 * → Go live (Ship). The rail is an OUTLINER: the active section expands to its
 * subsection TOC, every anchor navigable from the left.
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
  // Accordion (v3): the SET UP pair + the SHIP pair are expanded on load; the
  // three Customize sections collapse to their header rows — universal
  // defaults mean nobody has to open them. Opening a rail item or a deep link
  // expands.
  const [expandedSteps, setExpandedSteps] = React.useState<Record<number, boolean>>({ 1: true, 2: true, 6: true, 7: true })
  const toggleStep = (n: number) => setExpandedSteps((s) => ({ ...s, [n]: !s[n] }))
  // The Talk panel (identity card + live test) — the ONLY right-side Sheet now.
  const [talkOpen, setTalkOpen] = React.useState(false)
  React.useEffect(() => {
    if (autoTalk) setTalkOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTalk])
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
  // Never pre-select the channel (owner 2026-07-17): the cards show no choice
  // and no config until the user picks — even on a saved agent, whose live
  // channel is stated by the liveNote line + the panel summary instead. A
  // restored NEW draft carries the user's own earlier pick, so it stays shown.
  const [channelTouched, setChannelTouched] = React.useState(!isEdit)
  const restoreTypeStash = React.useCallback((t: AgentType) => {
    const s = typeStash.current[t]
    if (!s) return
    setChannelTouched(true)
    dirty.current = true
    setDraft((d) => ({ ...d, type: t, config: { ...d.config, ...s } }))
    delete typeStash.current[t]
  }, [])
  const selectType = React.useCallback((next: AgentType) => {
    setChannelTouched(true)
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

  // ── Section completion — for the mobile chips + the resume cursor ONLY. It
  //    never gates access: every section is always openable/editable. Order:
  //    1 Channel · 2 Prompt · 3 Voice · 4 Models · 5 Tools · 6 Test ·
  //    7 Go live. Customize + Test run on working defaults → always "done";
  //    Go live ✓ only when actually live.
  const voiceDone = draft.voice !== null
  const typeDone = draft.type !== null
  const promptDone = draft.systemPrompt.trim().length > 0
  const isLive = isEdit && existing!.status === "live"
  const isDone = (n: number) =>
    n === 1 ? typeDone : n === 2 ? promptDone : n === 3 ? voiceDone : n === 7 ? isLive : true

  // ── One-primary discipline (CTA-judge round 2026-07-14, graft B) ───────────
  // While step 4's own go-live CTA is on screen, the rail's Deploy demotes to
  // outline so exactly ONE filled primary exists at the commit moment — every
  // judge flagged the duplicate-primary collision on sticky arrangements.
  const publishRegionRef = React.useRef<HTMLDivElement>(null)
  const [publishInView, setPublishInView] = React.useState(false)
  React.useEffect(() => {
    const el = publishRegionRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setPublishInView(e.isIntersecting), { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

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
    // ?step=N now speaks the v3 journey order (1 Channel … 6 Go live).
    const stepToOpen = stepParam >= 1 && stepParam <= SECTION_COUNT ? stepParam : null
    // Highlight + scroll to the deep-linked step once sections have painted.
    // Scheduled HERE, not via a ref-consuming effect: an [openStep]-keyed
    // effect cancels its own timeout when the queued setOpenStep commits
    // (audit 2026-07-07: deep links highlighted but never scrolled).
    const openLater = (n: number) => {
      setOpenStep(n)
      // Accordion: a deep link must EXPAND its section, not just scroll to a
      // collapsed header (same rule as openRow).
      setExpandedSteps((s) => ({ ...s, [n]: true }))
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
        openLater(1)
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
    if (dc) openLater(1)
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
      if (typeof n === "number" && n >= 1 && n <= SECTION_COUNT) {
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
  const openRow = (n: number) => {
    // Set the highlight FIRST: on a short page (everything in one fold, the
    // 4K case) nothing scrolls, so the click must still give feedback.
    setOpenStep(n)
    // Accordion: opening a section from the rail/deep-link expands it (it may
    // have been collapsed) so the scroll lands on real content, not a header.
    setExpandedSteps((s) => ({ ...s, [n]: true }))
    syncStepParam(n)
    muteSpy(800)
    scrollToStep(n)
  }
  openRowRef.current = openRow

  // Outliner navigation (v3): a rail TOC entry jumps STRAIGHT to its
  // subsection anchor — "everything navigable from the left panel, no RHS
  // scrolling to find anything". Expands the section first so the anchor
  // exists, then glides.
  // The TOC entry the user last jumped to — highlighted in the rail so the
  // outliner shows "you are here" (owner 2026-07-17).
  const [activeAnchor, setActiveAnchor] = React.useState<string | null>(null)
  const openAnchor = (n: number, anchorId: string) => {
    setOpenStep(n)
    setActiveAnchor(anchorId)
    setExpandedSteps((s) => ({ ...s, [n]: true }))
    syncStepParam(n)
    muteSpy(1500)
    window.setTimeout(() => {
      const el = document.getElementById(anchorId)
      if (!el) { scrollToStep(n); return }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
      // Arrival feedback: flash the target block so the jump visibly lands —
      // especially when it was already on screen and nothing scrolled.
      el.classList.remove("wz-anchor-flash")
      void el.offsetWidth // restart the animation on repeat clicks
      el.classList.add("wz-anchor-flash")
      window.setTimeout(() => el.classList.remove("wz-anchor-flash"), 1500)
      // Same arrival guarantee as scrollToStep: some environments silently
      // drop long smooth scrolls — if the anchor isn't near the reading line
      // shortly after, jump instantly. scroll-mt-28 = 112px.
      window.setTimeout(() => {
        if (Math.abs(el.getBoundingClientRect().top - 112) > 140) el.scrollIntoView({ block: "start" })
      }, 450)
    }, 120)
  }

  // Stack edits can collapse/expand content ABOVE the clicked control
  // (MLLM hides the speech knobs in Voice & speech, the preset block
  // unmounts), which yanked the viewport around. Pin the Models anchor's
  // viewport position across the reflow: measure before the update, correct
  // scroll in a layout effect before paint.
  const stackAnchor = React.useRef<{ el: HTMLElement; top: number } | null>(null)
  const updateStack = (stack: AgentDraft["stack"]) => {
    const el = document.getElementById("wz-4-arch")
    stackAnchor.current = el ? { el, top: el.getBoundingClientRect().top } : null
    muteSpy(800)
    update({ stack })
  }
  React.useLayoutEffect(() => {
    const a = stackAnchor.current
    if (!a) return
    stackAnchor.current = null
    const delta = a.el.getBoundingClientRect().top - a.top
    if (Math.abs(delta) > 1) window.scrollBy({ top: delta })
  }, [draft.stack])

  // Scroll-spy: the rail highlights the section under the reading line.
  React.useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (Date.now() < spyMutedUntil.current) return
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          const n = Number(visible[0].target.id.replace("wizard-step-", ""))
          if (n >= 1 && n <= SECTION_COUNT) setOpenStep(n)
        }
      },
      { rootMargin: "-15% 0px -65% 0px" },
    )
    for (let i = 1; i <= SECTION_COUNT; i++) {
      const el = document.getElementById(`wizard-step-${i}`)
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
  // v3 slices: 1 Channel (type + config — coupled) · 2 Prompt (words) ·
  // 3 Voice & speech (voice + language/STT/TTS + speech tuning; the whole
  // `advanced` rides here — its history field renders in section 5 but resets
  // with 3, an accepted draft simplification) · 4 Models (pipeline/preset/LLM)
  // · 5 Knowledge & Tools · 6 Go live (owns no fields — capture config lives
  // on Monitor now).
  // Sections 3 and 4 split the shared stack object — they get their own
  // pick/apply paths below; this covers the sections that own whole fields.
  const stepSlice = (d: AgentDraft, n: number): Partial<AgentDraft> =>
    n === 1 ? { type: d.type, config: d.config }
    : n === 2 ? { systemPrompt: d.systemPrompt, greeting: d.greeting }
    : n === 5 ? { knowledge: d.knowledge, mcp: d.mcp, connectors: d.connectors }
    : {}
  const stepDirty = (n: number) => {
    const base = baseline.current
    if (!base) return false
    // Sections 3 and 4 share the stack object; compare only their own fields.
    if (n === 3) {
      const pick = (d: AgentDraft) => ({ voice: d.voice, advanced: d.advanced, language: d.stack.language, asr: d.stack.asr, tts: d.stack.tts })
      return JSON.stringify(pick(draft)) !== JSON.stringify(pick(base))
    }
    if (n === 4) {
      const pick = (d: AgentDraft) => ({ pipeline: d.stack.pipeline, preset: d.stack.preset, llm: d.stack.llm })
      return JSON.stringify(pick(draft)) !== JSON.stringify(pick(base))
    }
    return JSON.stringify(stepSlice(draft, n)) !== JSON.stringify(stepSlice(base, n))
  }
  const resetStep = (n: number) => {
    const base = baseline.current
    if (!base) return
    // Snapshot what's being wiped: reset is one click and must offer a way
    // back (owner call, 2026-07-07).
    const cur = draftRef.current
    const sliceFor = (src: AgentDraft): Partial<AgentDraft> =>
      n === 3
        ? { voice: src.voice, advanced: src.advanced, stack: { ...cur.stack, language: src.stack.language, asr: src.stack.asr, tts: src.stack.tts } }
        : n === 4
        ? { stack: { ...cur.stack, pipeline: src.stack.pipeline, preset: src.stack.preset, llm: src.stack.llm } }
        : stepSlice(src, n)
    const before = JSON.parse(JSON.stringify(sliceFor(cur))) as Partial<AgentDraft>
    dirty.current = true
    // Channel: type and its setup are coupled — restoring the type WITHOUT the
    // baseline config would bring back an inbound agent with its number gone
    // (selectType stashes-and-deletes the departing branch; audit 2026-07-07).
    const slice = sliceFor(base)
    if (n === 1) typeStash.current = {}
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
    // Review lands where the change is: the prompt when it moved, else voice
    // (v3 order: Prompt = 2, Voice & speech = 3).
    openRow(promptChanged ? 2 : 3)
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

  // Code/SDK third deploy state (user-test #9, D3 S2): after the stay-branch
  // deploy the UI still read "Draft + go live" while the toast said deployed.
  // Session flag + the minted agentId on a NEW draft (persists via saveDraft)
  // both witness the deploy, so a refresh keeps the truth.
  const [codeDeployedNow, setCodeDeployedNow] = React.useState(false)
  const publishingRef = React.useRef(false)
  // Batch pre-flight — a ref (not state) so the confirmed re-entry into
  // publish() can't race the dialog's close render.
  const batchConfirmedRef = React.useRef(false)
  const [batchConfirmOpen, setBatchConfirmOpen] = React.useState(false)
  const publish = () => {
    if (publishingRef.current) return // guard: double-click must not double-publish
    const reason = publishBlockReason(draftRef.current)
    if (reason) { toast.error("Not ready to deploy yet", { description: reason }); return }
    // No-op honesty (user-test #10, D1 S3): redeploying an untouched live
    // agent fired a success toast + Monitor hop while nothing changed — a
    // fake success devalues every later toast.
    const tChanged = isLive && !!baseline.current && draftRef.current.type !== baseline.current.type
    if (isLive && !anyEdited && !tChanged) {
      toast("Already live", { description: "No changes since the last deploy." })
      return
    }
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
    // Code/SDK deploys STAY on the step: the snippet card says "deploy first,
    // then copy", so deploy must mint the ID into the visible snippets, not
    // teleport to Monitor away from them (user-test #7, D3 S2). Monitor rides
    // the success toast as an action instead.
    const stay = draftRef.current.type === "code"
    publishDeployment({
      router, agentId, agentName: draft.name || "Your agent",
      channel: channelLabel(draft), name: draft.name || "Deployment",
      mode: draft.type ?? undefined,
      stay,
    })
    if (stay) {
      setCodeDeployedNow(true)
      const next = { ...draftRef.current, agentId }
      setDraft(next)
      draftRef.current = next
      // The working copy survives (with its minted ID) — persist it so a
      // refresh keeps the now-real snippets, and re-arm publish for later edits.
      saveDraft(next, isEdit ? next.agentId : undefined)
      publishingRef.current = false
      return
    }
    // Deploying consumes the working copy — clear whichever slot this was.
    clearDraft(isEdit ? draft.agentId : undefined)
  }

  // ── Left identity card (shared component — keeps the agent present, same as
  //    the Agents home, so it never "goes missing" when you enter the builder). ──
  // One voice lookup per id change — getVoiceArtifact reads localStorage, and
  // this value is needed by the card subtitle AND the Step-1 row summary.
  const cardVoice = React.useMemo(
    () => (draft.voice ? getVoiceArtifact(draft.voice.id) : undefined),
    [draft.voice],
  )
  // "Deployed" ≠ "Live" for Code/SDK: the deploy mints the ID; traffic (and
  // billing) starts when the app connects. Witnessed by the session flag OR a
  // minted agentId on a NEW draft (edit-mode drafts always carry an id).
  const codeDeployed = draft.type === "code" && !isLive && (codeDeployedNow || (!isEdit && !!draft.agentId))
  const cardStatus = isEdit
    ? existing!.status.charAt(0).toUpperCase() + existing!.status.slice(1)
    : codeDeployed ? "Deployed" : "Draft"
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
  // `advanced` rides section 3, so the section slices cover every field the
  // builder edits (capture/`analysis` is edited on Monitor, not here).
  const anyEdited = isLive && [1, 2, 3, 4, 5].some(stepDirty)
  const deploySub = isLive
    ? anyEdited
      ? "Edits are not live yet. Redeploy to apply."
      : "Changes apply on your next redeploy."
    : codeDeployed
    ? "Deployed — goes live when your app connects."
    : blockReason ?? "Review the Deploy step and go live."
  // "Redeploy" on a live agent being REPOINTED read as re-publishing the OLD
  // channel at the moment of launching a first batch (user-test #7, D1 S3) —
  // when the type changed since the live baseline, name what actually starts.
  const typeChanged = isLive && !!baseline.current && draft.type !== baseline.current.type
  const deployCta = !isLive
    ? codeDeployed ? "Redeploy" : "Deploy"
    : typeChanged && draft.type === "outbound" ? "Launch batch calls"
    : typeChanged && draft.type ? `Deploy ${typeLabel(draft.type)}`
    : "Redeploy"

  // Graft A (judge round): the Deploy fill invites action only when acting
  // means something — a ready draft or a dirty live agent. A clean live agent,
  // a blocked draft, or an already-deployed code agent gets the outline.
  const deployHot = isLive ? anyEdited : codeDeployed ? false : !blockReason

  // ── Lazyweb design-improve (2026-07-20, report ccf47285) ──────────────────
  // F1 "Progress Rail": the rail pins the ONE step that moves the draft
  // forward. Hidden when there is nothing to do (clean live agent, deployed
  // code agent) — a permanent "Next" with no next reads as a broken promise.
  const nextUp = codeDeployed ? null : !isLive ? firstIncomplete(draft) : anyEdited ? 7 : null
  // F2 "Agent Recipe": the build-log strip's validation readout — derived from
  // the draft (wireframe-honest), listing the artifacts that compile right now.
  const buildValidated = [typeDone && "channel", promptDone && "prompt", voiceDone && "voice"].filter(
    Boolean,
  ) as string[]

  // Three-column shell (Figma "Shell Exploration", 2026-07-15): the agent
  // lives in a persistent right preview panel; the header owns identity +
  // Deploy; the rail is pure nav.
  const [previewCollapsed, setPreviewCollapsed] = React.useState(false)
  // The right panel doubles as the web-widget preview (owner 2026-07-15): on a
  // web-widget channel it shows a [Agent | Widget] toggle and defaults to the
  // widget view — "here's how your widget looks."
  const [previewView, setPreviewView] = React.useState<"agent" | "widget">("agent")
  const isWebWidget = draft.type === "inbound" && draft.config.inbound?.mode === "web"
  React.useEffect(() => {
    setPreviewView(isWebWidget ? "widget" : "agent")
  }, [isWebWidget])
  const { copied: idCopied, copy: copyId } = useCopyFeedback()
  const previewStatus = warming ? "Warming up" : isLive ? "Live" : codeDeployed ? "Deployed" : "Draft"
  // The panel's deployment summary — the same facts the Go-live review used
  // to card up, now always visible and live (owner 2026-07-17).
  const previewSummary = {
    voice: cardVoice ? { name: cardVoice.name, tagline: cardVoice.tagline } : undefined,
    models: stackLine(draft.stack, { full: true }),
    estimateLatencyMs: cardEst.latencyMs,
    estimateCostPerMin: cardEst.costPerMin,
    channel: draft.type ? channelLine(draft) : undefined,
    // Draft↔live linkage (Lazyweb F4): rows that differ from the deployed
    // config carry a "pending" chip, closing the edit → validate → ship loop.
    pending: isLive
      ? {
          voice: stepDirty(3),
          models: stepDirty(4),
          estimate: stepDirty(3) || stepDirty(4),
          channel: stepDirty(1),
        }
      : undefined,
  }

  return (
    // Full-bleed three-column shell built to the Figma "Shell Exploration"
    // (node 2508:97094) 20px grid — data-fluid removes the layout cap, the
    // layout adds NO padding, so the wizard owns all spacing: no card, no
    // outer padding, flush border-divided columns.
    <div data-fluid className="flex flex-col">
      {/* Header — px-5 py-4, border-b, gap-4 items-center (Figma Base/Header). */}
      <header className="flex items-center gap-4 border-b border-border px-5 py-4">
        <AgentSphere size={32} active={testing} />
        <div className="flex min-w-0 flex-1 items-center gap-8">
          <h1 aria-label={draft.name || (isEdit ? existing!.name : "Your new agent")} className="min-w-0 shrink-0">
            <input
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={isEdit ? existing!.name : "Name your agent"}
              aria-label="Agent name"
              className="max-w-[18rem] rounded-md bg-transparent text-base font-semibold leading-6 outline-none [field-sizing:content] placeholder:font-normal placeholder:text-muted-foreground/60 focus:bg-muted/50"
            />
          </h1>
          {/* Copyable agent ID — borderless (Figma): bot icon · mono 12/50% ·
              copy icon. Appears once the agent has an id. */}
          {draft.agentId && (
            <button
              type="button"
              onClick={() => copyId(draft.agentId!, "Agent ID copied")}
              className="inline-flex shrink-0 items-center gap-0.5 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Copy agent ID ${draft.agentId}`}
            >
              <Bot className="size-4" aria-hidden />
              <span className="flex items-center gap-1">
                <span className="font-mono text-xs opacity-50">{draft.agentId}</span>
                {idCopied ? <Check className="size-3 text-success" aria-hidden /> : <Copy className="size-3" aria-hidden />}
              </span>
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Kebab overflow (Figma): New agent · Import · Template. */}
          {(onCreateNew || onBrowseTemplates || !isEdit || landing) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9" aria-label="More actions">
                  <EllipsisVertical className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCreateNew && (
                  <DropdownMenuItem onClick={onCreateNew}>
                    <Plus className="size-4" aria-hidden /> New agent
                  </DropdownMenuItem>
                )}
                {(!isEdit || landing) && (
                  <ImportAgentSheet onImported={onImported}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Upload className="size-4" aria-hidden /> Import an existing agent
                    </DropdownMenuItem>
                  </ImportAgentSheet>
                )}
                {onBrowseTemplates && (
                  <DropdownMenuItem onClick={onBrowseTemplates}>
                    <FileText className="size-4" aria-hidden /> Start from a template
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Talk on <xl (the right preview panel owns Talk at xl+). */}
          <Button variant="outline" size="sm" className="gap-1.5 xl:hidden" disabled={warming} onClick={() => setTalkOpen(true)}>
            <Mic className="size-4" aria-hidden /> Talk
          </Button>
          {/* </> config view (icon-only, 32px, Figma code-xml). */}
          <CustomConfigDrawer draft={draft} onEditStep={openRow} onApply={applyConfigPatch} iconOnly />
          {/* Deploy — secondary (Figma), min-w-16 px-2 py-1.5. */}
          <Button variant="secondary" size="sm" className="min-w-16 gap-1.5" onClick={publish}>
            <Rocket className="size-4" aria-hidden /> {deployCta}
          </Button>
        </div>
      </header>

      {/* Below lg the rail stacks above the sections; a slim sticky strip keeps
          step nav + deploy in the fold (top-12 = the app header height). */}
      <div className="sticky top-12 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-2 backdrop-blur lg:hidden">
        <span className="flex shrink-0 items-center gap-1" role="group" aria-label="Jump to section">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
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
          <Rocket className="h-3.5 w-3.5" aria-hidden /> {deployCta}
        </Button>
      </div>

      {/* FLUSH three-column grid (Figma "Shell Exploration"): rail 320 · config
          canvas · preview 400, divided by borders (no card, no gaps, no outer
          padding). The preview column is `auto` — the panel owns its width. */}
      <div className="grid grid-cols-1 items-start lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_auto]">
        {/* Rail — p-5 (20px, Figma), border-r divider; scrolls internally on
            short viewports so the deploy state stays reachable. */}
        <aside className="min-w-0 space-y-5 border-b border-border p-5 lg:sticky lg:top-12 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:border-b-0">
          {/* Rail = pure nav now (Figma 2026-07-15): the agent identity moved
              to the header and the sphere/Talk to the right preview panel, so
              the rail holds only the CONFIGURE + OPTIONAL section lists. */}

          {/* Pinned "Next: …" card (Lazyweb design-improve F1, safe bet): the
              rail opens with the one step that moves the draft toward live —
              orientation without reading the whole outline. A quiet card, not
              a primary: the one-primary discipline stays with Deploy. */}
          {nextUp != null && (
            <button
              type="button"
              onClick={() => openRow(nextUp)}
              className="flex w-full items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2.5 text-left shadow-xs transition-colors hover:border-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-xs uppercase text-muted-foreground opacity-50">Next</span>
                <span className="block truncate text-sm font-medium">{stepTitle(nextUp, draft)}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {isLive ? "Redeploy to apply your edits." : NEXT_HINTS[nextUp]}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          )}

          {/* OUTLINER rail (v3): three journey groups — Set up · Customize ·
              Ship. The ACTIVE section expands to its subsection TOC; clicking
              a TOC entry jumps the RHS straight to that anchor, so everything
              is navigable from the left panel. */}
          <nav aria-label="Build sections" className="space-y-4">
            {SECTION_GROUPS.map((g) => (
              <div key={g.label} className="space-y-0.5">
                <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  {g.label}
                </p>
                {g.steps.map((n) => {
                  const Icon = STEP_ICONS[n]
                  const active = n === selected
                  // Untouched channel → its TOC shows no setup entries yet
                  // (mirrors the RHS: config appears only after a pick).
                  const toc = stepToc(n, channelTouched ? draft : { ...draft, type: null })
                  return (
                    <React.Fragment key={n}>
                      <button
                        type="button"
                        onClick={() => openRow(n)}
                        aria-current={active ? "step" : undefined}
                        aria-expanded={active}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/40",
                          active && "bg-accent/60",
                        )}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{stepTitle(n, draft)}</span>
                        {/* Completion tick (Lazyweb F1): the rail owns progress —
                            devs see where they are without opening anything. */}
                        {isDone(n) && (
                          <>
                            <Check className="h-3.5 w-3.5 shrink-0 text-success/80" aria-hidden />
                            <span className="sr-only">(done)</span>
                          </>
                        )}
                      </button>
                      {/* The section's TOC — the LHS table of contents of the
                          page (v3 ask). Shown for the active section only, so
                          the rail stays scannable. One continuous border-l line
                          for every nested entry (the SidebarMenuSub treatment,
                          on rail tokens — the component itself is bound to
                          SidebarProvider tokens, so we mirror its line style). */}
                      {active && toc.length > 0 && (
                        <ul className="mb-1 ml-[1.15rem] flex min-w-0 flex-col gap-0.5 border-l border-border py-0.5 pl-2">
                          {toc.map((t) => (
                            <li key={t.id}>
                              <button
                                type="button"
                                onClick={() => openAnchor(n, t.id)}
                                aria-current={activeAnchor === t.id ? "location" : undefined}
                                className={cn(
                                  "flex h-7 w-full min-w-0 items-center rounded-md px-2 text-left text-xs transition-colors hover:bg-accent/40 hover:text-foreground",
                                  activeAnchor === t.id ? "bg-accent/60 text-foreground" : "text-muted-foreground",
                                )}
                              >
                                <span className="min-w-0 flex-1 truncate">{t.label}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Autosave feedback survives the lean pass for BOTH modes — losing
              "Saving…/Saved" would un-fix heuristic-eval #6. "DRAFT saved",
              not "Saved": the bare word one line above "Unsaved changes" read
              as the product contradicting itself (user-test #11, D1) —
              saved-as-draft ≠ live. */}
          {saveState !== "idle" && (
            <p className="px-2.5 text-xs text-muted-foreground" role="status" aria-live="polite">
              {saveState === "saving" ? "Saving…" : "Draft saved"}
            </p>
          )}

          {/* Deploy moved to the HEADER (Figma "Shell Exploration" 2026-07-15).
              The rail keeps ONLY the validated state signals the header button
              doesn't carry: the dirty / code-deployed truth lines + Discard
              (every test round praised these; don't drop them silently). */}
          {((isLive && anyEdited) || codeDeployed) && (
            <div className="space-y-2 border-t border-border pt-3">
              {isLive && anyEdited && (
                <p className="px-0.5 text-xs text-warning">Unsaved changes — redeploy to apply.</p>
              )}
              {codeDeployed && (
                <p className="px-0.5 text-xs text-muted-foreground">Deployed — goes live when your app connects.</p>
              )}
              {isLive && anyEdited && (
                <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={discardEdits}>
                  Discard edits
                </Button>
              )}
            </div>
          )}
        </aside>

        {/* RHS pane of the unified card: the steps are borderless sections
            separated by a divider (the card frame + the LHS border-l give the
            structure), not nested cards. Sections cap content width so 4K shows
            structure, not 900px inputs (audit width-discipline fix). */}
        {/* No overflow-hidden here — it would break the sticky section headers
            (sticky can't escape a clipped ancestor). The rail is unaffected (it
            lives in the other grid column). Corners: the first header rounds to
            match the card's top-right (2026-07-08). */}
        {/* Full-height column dividers live on the CENTER (owner 2026-07-15:
            the borders "only reached half the page" because the sticky rail/
            panel columns are shorter than the content). min-h fills the
            viewport so the dividers span it even when the accordion is short;
            border-l = rail divider (lg+), border-r = panel divider (xl+). */}
        <div className="min-w-0 divide-y divide-border border-t border-border lg:border-t-0 lg:min-h-[calc(100vh-7rem)] lg:border-l xl:border-r">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const Icon = STEP_ICONS[n]
            // The section's compiled output (Lazyweb F2 "Agent Recipe"): each
            // band reads as a build artifact — "output: inbound · +1 …" — not
            // a flat form header. Sections 6–7 produce actions, not artifacts.
            const artifact = n <= 5 ? artifactLine(n, draft, cardVoice?.name) : null
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
                {/* Accordion header (owner 2026-07-15): the band is a toggle —
                    clicking it expands/collapses the section; a chevron shows
                    state. Sticky under the app header while its body scrolls. */}
                <header className="z-20 flex items-center gap-1 border-b border-border bg-muted lg:sticky lg:top-12">
                  <button
                    type="button"
                    onClick={() => toggleStep(n)}
                    aria-expanded={!!expandedSteps[n]}
                    aria-controls={`wizard-step-${n}-body`}
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-5 py-3 text-left transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                    <h3 id={`wizard-step-${n}-title`} className="truncate text-sm font-semibold">{stepTitle(n, draft)}</h3>
                    {/* The band's mono output line (Lazyweb F2): what this
                        section compiles to right now — so a collapsed section
                        still states its artifact. md+ only; small screens keep
                        the lean header. */}
                    {artifact != null && (
                      <span className="ml-auto hidden min-w-0 shrink truncate text-right font-mono text-xs text-muted-foreground/60 md:block">
                        output: {artifact || "—"}
                      </span>
                    )}
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", artifact == null ? "ml-auto" : "ml-auto md:ml-0", expandedSteps[n] && "rotate-180")} aria-hidden />
                  </button>
                  {/* LIVE agents only: with autosave there is no Save/Cancel, so
                      this is the one way back to the deployed config. HIDDEN
                      until the step differs from live. */}
                  {isLive && stepDirty(n) && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-3 h-7 w-7 shrink-0 text-muted-foreground"
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
                {/* Section anatomy = [label | content] (Figma 2026-07-14): a
                    quiet repeat of the step name in a 190px label column at
                    xl+, the form in a roomy content column. aria-hidden — the
                    band's h3 already names the section. Steps 1–3 cap at 4xl
                    for readability; Deploy stays fluid (the batch split + the
                    widget studio manage their own width). */}
                {/* Body renders only when the section is expanded (accordion). */}
                {expandedSteps[n] && (
                <div id={`wizard-step-${n}-body`} className="p-5">
                  <div className={cn("min-w-0", n !== 1 && "max-w-4xl")}>
                  {/* 1 · CHANNEL — the fork. The cards start UNSELECTED (even
                      on a saved agent — the liveNote + panel summary state the
                      live channel); config flows in below only after a pick,
                      with NO separators, so it reads as one continuous flow
                      (owner 2026-07-17). */}
                  {n === 1 && (
                    <div className="space-y-6">
                      <div id="wz-1-pick" className="scroll-mt-28 max-w-4xl">
                        <StepType
                          draft={draft}
                          displayType={channelTouched ? undefined : null}
                          update={(patch) => (patch.type ? selectType(patch.type) : update(patch))}
                          liveNote={isLive && baseline.current
                            ? `${draft.name || "Your agent"} is live on ${channelTarget(baseline.current)}. Switching sets that aside (undoable) and applies on redeploy.`
                            : undefined}
                          liveType={isLive ? baseline.current?.type ?? null : null}
                        />
                      </div>
                      {channelTouched && draft.type && (
                        <div id="wz-1-setup" className="scroll-mt-28">
                          <StepConfigure
                            draft={draft}
                            update={(patch) => (patch.type ? selectType(patch.type) : update(patch))}
                            onChooseType={() => openAnchor(1, "wz-1-pick")}
                          />
                        </div>
                      )}
                      {channelTouched && draft.type === "outbound" && (
                        <div id="wz-1-callsettings" className="scroll-mt-28 space-y-3">
                          <p className="text-sm font-medium">Call settings &amp; schedule</p>
                          <CallSettings draft={draft} update={update} />
                        </div>
                      )}
                    </div>
                  )}
                  {/* 2 · PROMPT — the words, rewritten for the channel. */}
                  {n === 2 && <SectionPrompt draft={draft} update={update} onPickVoice={() => openAnchor(3, "wz-3-voice")} />}
                  {/* 3 · VOICE & SPEECH (Customize) — voice, language/STT, and
                      the dissolved Advanced speech tuning. */}
                  {n === 3 && (
                    <div className="space-y-8">
                      <StepVoice draft={draft} update={update} onSelectVoice={selectVoice} />
                      <div className="border-t border-border pt-6">
                        <StepAdvanced
                          value={draft.advanced}
                          onChange={(advanced) => update({ advanced })}
                          realtime={draft.stack.pipeline === "mllm"}
                          showHistory={false}
                        />
                      </div>
                    </div>
                  )}
                  {/* 4 · MODELS (Customize) — pipeline, the latency↔cost
                      slider, and the ALWAYS-VISIBLE model selects (owner
                      2026-07-17), plus BYOK. Stack edits go through
                      updateStack (spy mute + scroll pinning). */}
                  {n === 4 && (
                    <div className="space-y-8">
                      <div id="wz-4-arch" className="scroll-mt-28">
                        <StackModelsDetail stack={draft.stack} onChange={updateStack} showPicker={false} />
                      </div>
                      <div id="wz-4-model" className="scroll-mt-28 space-y-8">
                        <StackTradeoffSlider stack={draft.stack} onChange={updateStack} />
                        <StackModelPicker stack={draft.stack} onChange={updateStack} />
                        {/* BYOK lives WITH the model selects — override the
                            ASR/LLM/TTS vendors with your own keys (owner
                            2026-07-17; was oddly placed in Knowledge & Tools). */}
                        <div className="flex items-center gap-2.5 rounded-md border border-border bg-muted/30 px-3.5 py-2.5">
                          <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                          <p className="text-xs text-muted-foreground">
                            Using your own vendor accounts? Add keys in{" "}
                            <a href="/project/vendor-credentials" className="underline underline-offset-2 hover:text-foreground">
                              Manage › Vendor Credentials
                            </a>{" "}
                            — the ASR, LLM, and TTS you pick here will use them.
                          </p>
                        </div>
                      </div>
                      {/* Conversation history is MODEL config — how much
                          context the LLM keeps — not a tool (owner
                          2026-07-17: it read as oddly placed in Tools). */}
                      <HistoryField
                        id="wz-4-history"
                        value={draft.advanced}
                        onChange={(advanced) => update({ advanced })}
                      />
                    </div>
                  )}
                  {/* 5 · KNOWLEDGE & TOOLS (Customize). */}
                  {n === 5 && <SectionKnowledgeTools draft={draft} update={update} />}
                  {/* 6 · TEST (Ship) — try the agent before deploying: the
                      simulated test call + (gated) eval suites. */}
                  {n === 6 && (
                    <div className="space-y-8">
                      <div id="wz-6-test" className="scroll-mt-28 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                          Talk to {draft.name || "your agent"} with the current prompt and voice.
                        </p>
                        <Button variant="secondary" size="sm" className="shrink-0 gap-1.5" disabled={warming} onClick={() => setTalkOpen(true)}>
                          <Mic className="h-3.5 w-3.5" aria-hidden /> Start a test call
                        </Button>
                      </div>
                      {/* Evals (F-Eval) — future-scope-gated; renders nothing
                          unless the flag is on. */}
                      <TestsSection agentName={draft.name || "your agent"} />
                    </div>
                  )}
                  {/* 7 · GO LIVE — what each call records (transcripts ·
                      recording · success eval · data points — the v3 "Analysis
                      → Go live" fold, finally wired 2026-07-21) + review &
                      deploy. */}
                  {n === 7 && (
                    <div className="space-y-8">
                      <div id="wz-7-capture" className="scroll-mt-28 space-y-3">
                        <p className="text-sm font-medium">Transcripts, recording &amp; analysis</p>
                        <StepAnalysis
                          value={draft.analysis}
                          onChange={(analysis) => update({ analysis })}
                          channel={draft.type === "code" ? "session" : "call"}
                        />
                      </div>
                      {/* publishRegionRef feeds graft B: while this in-step
                          go-live CTA is on screen, the rail Deploy demotes. */}
                      <div id="wz-7-review" ref={publishRegionRef} className="scroll-mt-28 border-t border-border pt-6">
                        <StepPublish
                          draft={draft}
                          live={isLive}
                          ctaLabel={isLive || codeDeployed ? deployCta : undefined}
                          onPublish={publish}
                          onFix={(m) => openRow(m)}
                        />
                      </div>
                    </div>
                  )}
                  </div>
                </div>
                )}
              </section>
            )
          })}
          {/* Build log (Lazyweb F2 "Agent Recipe"): the compile readout closing
              the config column — which artifacts validate right now, derived
              live from the draft. The divide-y column gives it its top rule. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3">
            <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CircleCheck className="h-3.5 w-3.5" aria-hidden /> Build log
            </span>
            <span className="min-w-0 font-mono text-xs text-muted-foreground/60">
              validated:{" "}
              {buildValidated.length
                ? buildValidated.map((v, i) => (
                    <React.Fragment key={v}>
                      {i > 0 && " · "}
                      <span className="text-primary">{v}</span>
                    </React.Fragment>
                  ))
                : "nothing yet — pick a channel to start"}
            </span>
          </div>
        </div>

        {/* Third column: the persistent agent preview (xl+ only — no phantom
            grid cell below xl). Sticky under the app header. */}
        <div className="hidden xl:block xl:sticky xl:top-12 xl:max-h-[calc(100vh-3rem)] xl:self-start xl:overflow-hidden">
          <AgentPreviewPanel
            name={draft.name || (isEdit ? existing!.name : "")}
            statusLabel={previewStatus}
            isLive={isLive}
            statusHint={landing ? "Sample agent — live on the Balanced stack until you change it in Models." : undefined}
            latencyMs={cardEst.latencyMs}
            costPerMin={cardEst.costPerMin}
            summary={previewSummary}
            testing={testing}
            warming={!!warming}
            onTalk={() => setTalkOpen(true)}
            collapsed={previewCollapsed}
            onToggleCollapsed={() => setPreviewCollapsed((v) => !v)}
            view={previewView}
            onViewChange={setPreviewView}
            showWidgetToggle={!!isWebWidget}
            widgetAgentId={draft.agentId ?? "new"}
            widgetGreeting={draft.greeting.trim() || undefined}
          />
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
              Simulated preview — no live audio in this wireframe.
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
              {draft.config.outbound?.launch?.mode === "scheduled"
                ? `Schedule calls to ${MOCK_CSV_ROWS} contacts?`
                : `Start calling ${MOCK_CSV_ROWS} contacts?`}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  {draft.config.outbound?.launch?.mode === "scheduled"
                    ? `Deploying arms the schedule — ${draft.name || "your agent"} starts dialing ${draft.config.outbound?.csvName ?? "your list"} at the time below.`
                    : `Deploying starts the batch immediately — ${draft.name || "your agent"} dials every contact in ${draft.config.outbound?.csvName ?? "your list"}.`}
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {/* One agent ↔ one channel: launching the batch takes the
                      live inbound line dark — say it at the moment of
                      commitment, not only in the earlier stash toast
                      (user-test #7, D1 latent). */}
                  {isLive && baseline.current?.type === "inbound" && baseline.current.config.inbound?.numberId && (
                    <li>
                      · {draft.name || "Your agent"} stops answering{" "}
                      {PHONE_NUMBERS.find((n) => n.id === baseline.current!.config.inbound?.numberId)?.number ?? "its inbound number"}{" "}
                      while on Batch calls
                    </li>
                  )}
                  {draft.config.outbound?.launch?.mode === "scheduled" && (
                    <li>
                      · Starts: {draft.config.outbound.launch.startDate ?? "date not set"}{" "}
                      {draft.config.outbound.launch.startTime ?? ""}{" "}
                      {draft.config.outbound.launch.timezone ? `(${draft.config.outbound.launch.timezone})` : ""}
                    </li>
                  )}
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
              {draft.config.outbound?.launch?.mode === "scheduled" ? "Schedule the batch" : "Start the batch"}
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

/** The first section whose completion predicate is unmet — used only for the
 *  restore cursor. Not a gate. v3 journey order: channel first, then the
 *  prompt; voice has a working default, so past the prompt resume at Go live. */
function firstIncomplete(d: AgentDraft): number {
  if (d.type === null) return 1
  if (d.systemPrompt.trim() === "") return 2
  if (d.voice === null) return 3
  return 7
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

/** One-line CTA under the rail's pinned "Next" card (Lazyweb F1). Keys are
 *  exactly firstIncomplete's possible returns. */
const NEXT_HINTS: Record<number, string> = {
  1: "Pick how it handles calls.",
  2: "Write what it says.",
  3: "Pick its voice.",
  7: "Review & deploy.",
}

/** What a section compiles to right now — the band's mono "output:" line
 *  (Lazyweb design-improve 2026-07-20, Agent Recipe variant: the accordion
 *  reads as build artifacts, not a flat form). Empty string = nothing yet
 *  (the band renders an em dash). Sections 6–7 have no artifact. */
function artifactLine(n: number, d: AgentDraft, voiceName?: string): string {
  if (n === 1) return d.type ? channelLine(d) : ""
  if (n === 2) {
    const parts = [d.systemPrompt.trim() && "system", d.greeting.trim() && "greeting"].filter(Boolean)
    return parts.join(" · ")
  }
  if (n === 3) {
    const parts = [voiceName, d.stack.language ?? "English"].filter(Boolean)
    return parts.join(" · ")
  }
  if (n === 4) return stackLine(d.stack)
  if (n === 5) {
    const parts = [
      d.knowledge.length && `kb ${d.knowledge.length}`,
      d.mcp.length && `mcp ${d.mcp.length}`,
      d.connectors.length && `crm ${d.connectors.length}`,
    ].filter(Boolean) as string[]
    return parts.join(" · ")
  }
  return ""
}
