"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Rocket, Undo2, ChevronRight, Bot, Copy, Check, EllipsisVertical, Mic } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCopyFeedback } from "@/hooks/use-copy-feedback"
import { CustomConfigDrawer } from "@/components/custom-config-drawer"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { VoiceSection } from "@/components/wizard/voice-section"
import { ChannelSection } from "@/components/wizard/channel-section"
import { SectionPrompt } from "@/components/wizard/section-prompt"
import { SectionKnowledgeTools } from "@/components/wizard/step-build"
import { DeploySection } from "@/components/wizard/deploy-section"
import { TestSection, type LiveTestIdentity } from "@/components/wizard/test-section"
import { TestPanel, type TestPanelTab } from "@/components/wizard/test-panel"
import { TemplateMenu } from "@/components/wizard/template-menu"
import { SectionRows } from "@/components/wizard/section-row"
import { DeployPreflight } from "@/components/wizard/deploy-preflight"
import { STEP_TITLES, SECTION_COUNT, SECTION_GROUPS, STEP_ICONS, stepTitle, resolveStepParam } from "@/components/wizard/types"
import { publishDeployment } from "@/components/wizard/channel-configs"
import { useDebouncedEffect } from "@/hooks/use-debounced-effect"
import { markBuildStart, track, Events } from "@/lib/analytics"
import { getAgent, stackLine, stackEstimateFor, stackLatencyDetail, AGENT_TEMPLATES, STACK_PRESETS, PHONE_NUMBERS, type ImportedAgentConfig } from "@/lib/campaign-data"
import {
  getVoiceArtifact, defaultPromptFor, type VoiceArtifact,
} from "@/lib/voice-artifacts"
import {
  importedConfigToArtifact, importedAgentToDraft, stashImportNotice, takeImportNotice,
} from "@/lib/import-agent"
import {
  EMPTY_DRAFT, DEFAULT_CALL_BEHAVIOR, agentToDraft, templateToDraft, restoreDraft, saveDraft, clearDraft,
  publishBlockReason, channelTarget, channelLabel, hasChannel, hasWebWidget, inboundSurfaces, primaryChannel, activeCampaigns,
  draftHosting,
  type AgentDraft, type DeployChannel,
} from "@/lib/wizard-draft"
import { hostingSummary, isPinned } from "@/lib/hosting-regions"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  draftToSessionAgent, upsertSessionAgent, readStatusOverrides, subscribeAgentStore,
} from "@/lib/agent-store"
import { toast } from "sonner"

/**
 * AgentWizard — the unified creation surface (new · edit · onboarding · empty).
 *
 * A SCROLL-SPY ONE-PAGER in v4 order (2026-07-28): the hot path is THREE core
 * sections — VOICE (tier + voice) · CHANNEL (multi-select) · CONTEXT (prompt +
 * knowledge) — then GO LIVE, the deploy panel (campaigns · inbound settings ·
 * structured outputs · review & deploy). Everything deeper lives in slide-out
 * panels. v8 "Test Strip" (judge round 2026-07-29): sections are COLLAPSIBLE
 * (multi-open, all open by default, folded rows recap their values) and a
 * sticky TEST STRIP under the header carries Talk · Run simulations · the
 * last verdict, so testing is first-class at the top of the page.
 * NOTHING IS LOCKED — every field is editable at any time.
 * Publish is a HINT, not a gate. Deep-links: `?step=N` (legacy 1–7 mapped),
 * `?dc=` seeds a channel, `?artifact=` selects a custom voice. Draft
 * autosaves; live agents get per-section "Reset to live".
 */
/** An explicit close of the right rail is remembered; reopening forgets it. */
const RAIL_CLOSED_KEY = "sx:wizard_rail_closed"

export function AgentWizard({
  id,
  landing,
  warming,
  autoTalk,
  blank,
  onCreateNew,
  onImportAsNew,
}: {
  id: string
  /** Rendered inline on /agents (not the standalone edit route). */
  landing?: boolean
  /** First-run only: Aria is still warming — Talk is disabled WITH its promise
   *  attached, never silently dead. */
  warming?: boolean
  /** Open the Test panel on mount — the ceremony's "Say hello" CTA must land
   *  IN the conversation, not on a form (user-test 2026-07-09 S2). */
  autoTalk?: boolean
  /** Start truly blank, skipping the draft restore. A PROP (not just ?blank=1)
   *  because "New agent" remounts this component in the same tick as its
   *  router.push (race found in the 2026-07-07 walkthrough). */
  blank?: boolean
  onCreateNew?: () => void
  /** "Create as new agent" from the import dialog (inline landing). */
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
  // Master-detail selection: the rail ALWAYS highlights a step. null = "no
  // explicit choice yet" — the render falls back to a default captured once.
  const [openStep, setOpenStep] = React.useState<number | null>(null)

  // ── Collapsible sections (Test Strip layout, judge round 2026-07-29) ───────
  // Default = ALL OPEN (the v7 one-pager stays the first-run experience;
  // collapse is opt-in focus, not hiding). Deterministic: user toggles persist
  // per agent slot and are restored verbatim — no auto-collapse heuristics.
  // Bodies stay MOUNTED when collapsed (hidden) so section-local state — the
  // live talk test, campaign editors — survives a fold.
  const collapseKey = `sx:wizard_collapsed:${isEdit ? existing!.id : "new"}`
  const [collapsedSet, setCollapsedSet] = React.useState<Set<number>>(new Set())
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(collapseKey)
      if (raw) {
        const nums = (JSON.parse(raw) as number[]).filter((n) => n >= 1 && n <= SECTION_COUNT)
        if (nums.length) setCollapsedSet(new Set(nums))
      }
    } catch { /* wireframe only */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const persistCollapsed = (s: Set<number>) => {
    try { window.localStorage.setItem(collapseKey, JSON.stringify([...s])) } catch { /* ignore */ }
  }
  const toggleSection = (n: number) =>
    setCollapsedSet((s) => {
      const next = new Set(s)
      if (next.has(n)) next.delete(n)
      else next.add(n)
      persistCollapsed(next)
      return next
    })
  /** Deep links, rail clicks, and fix-flows EXPAND their target first. */
  const expandSection = (n: number) =>
    setCollapsedSet((s) => {
      if (!s.has(n)) return s
      const next = new Set(s)
      next.delete(n)
      persistCollapsed(next)
      return next
    })
  const setAllCollapsed = (collapse: boolean) => {
    const next = collapse ? new Set([1, 2, 3, 4, 5]) : new Set<number>()
    persistCollapsed(next)
    setCollapsedSet(next)
  }

  // The Test strip's verdict line — fed by the sims panel's "Run all".
  const [simSummary, setSimSummary] = React.useState<{ passed: number; failed: number; total: number } | null>(null)

  // The docked Test panel — the RIGHT RAIL (Figma 2861-52041). It opens by
  // default at lg+ so the rail is part of the layout rather than a surface you
  // have to know exists; closing it is remembered per browser. Below lg it is
  // a Sheet, so it must stay closed there or it would cover the builder.
  const [testOpen, setTestOpen] = React.useState(false)
  const [testTab, setTestTab] = React.useState<TestPanelTab>("simulations")
  React.useEffect(() => {
    try {
      if (window.localStorage.getItem(RAIL_CLOSED_KEY) === "1") return
    } catch { /* wireframe only */ }
    if (window.matchMedia("(min-width: 1024px)").matches) setTestOpen(true)
  }, [])
  /** Remember an explicit close; reopening clears the memory. */
  const setRailOpen = React.useCallback((o: boolean) => {
    setTestOpen(o)
    try {
      if (o) window.localStorage.removeItem(RAIL_CLOSED_KEY)
      else window.localStorage.setItem(RAIL_CLOSED_KEY, "1")
    } catch { /* ignore */ }
  }, [])
  const openTest = React.useCallback((tab: TestPanelTab) => {
    setTestTab(tab)
    setRailOpen(true)
  }, [setRailOpen])
  React.useEffect(() => {
    // The ceremony's "Say hello" lands ON the live contextual test (section 4)
    // — the talk surface lives there now, not in the panel.
    if (autoTalk) window.setTimeout(() => openRowRef.current(4), 150)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoTalk])
  // The identity card's "Talk to it" toggle (mock test, mirrors the home).
  const [testing, setTesting] = React.useState(false)
  // Visible autosave status (heuristic-eval #6). idle → saving → saved.
  const [saveState, setSaveState] = React.useState<"idle" | "saving" | "saved">("idle")
  const dirty = React.useRef(false)
  const draftRef = React.useRef(draft)
  draftRef.current = draft

  // The selection the rail renders. Default locked on FIRST render — tracking
  // firstIncomplete live would yank the highlight mid-edit.
  const defaultSelected = React.useRef<number | null>(null)
  if (defaultSelected.current == null) defaultSelected.current = isEdit ? 1 : firstIncomplete(draft)
  const selected = openStep ?? defaultSelected.current

  const update = React.useCallback((patch: Partial<AgentDraft>) => {
    dirty.current = true
    setSaveState("saving")
    setDraft((d) => ({ ...d, ...patch }))
  }, [])

  // ── Section completion — for the mobile chips + the resume cursor ONLY.
  //    1 Voice · 2 Channel · 3 Context · 4 Go Live (✓ only when live).
  const voiceDone = draft.voice !== null
  const channelsDone =
    draft.channels.length > 0 &&
    (!hasChannel(draft, "inbound") ||
      (inboundSurfaces(draft).length > 0 &&
        (!inboundSurfaces(draft).includes("phone") || (draft.config.inbound?.numberIds.length ?? 0) > 0)))
  const promptDone = draft.systemPrompt.trim().length > 0
  const isLive = isEdit && existing!.status === "live"
  // Status chip stays truthful when the agent is paused FROM THE LIST — the
  // shared store syncs it here. NO Pause control in the builder (owner veto,
  // 2026-07-21, re-confirmed 2026-07-29): pausing lives on the list row only.
  const [statusOverride, setStatusOverride] = React.useState<"live" | "paused" | null>(null)
  React.useEffect(() => {
    if (!isEdit) return
    const sync = () => setStatusOverride(readStatusOverrides()[existing!.id] ?? null)
    sync()
    return subscribeAgentStore(sync)
  }, [isEdit, existing])
  const effectiveStatus = statusOverride ?? (isEdit ? existing!.status : null)

  // ── Hedonic layer: ticks pop only for IN-SESSION completions. ──────────────
  const initialDones = React.useRef<Set<number> | null>(null)
  const [savePulse, setSavePulse] = React.useState(0)
  const [launchBurst, setLaunchBurst] = React.useState(false)
  const isDone = (n: number) =>
    n === 1 ? voiceDone : n === 2 ? channelsDone : n === 3 ? promptDone : n === 4 ? true : isLive
  if (initialDones.current === null) initialDones.current = new Set([1, 2, 3, 4, 5].filter(isDone))

  // ── One-primary discipline: while Go Live's CTA is on screen, the header
  //    Deploy demotes so exactly ONE filled primary exists. ───────────────────
  const publishRegionRef = React.useRef<HTMLDivElement>(null)
  const [publishInView, setPublishInView] = React.useState(false)
  React.useEffect(() => {
    const el = publishRegionRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => setPublishInView(e.isIntersecting), { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  void publishInView // reserved for CTA demotion styling

  // Header template chip → prompt-editor flash so the apply visibly lands.
  const [templateFlash, setTemplateFlash] = React.useState(0)

  /** Release a custom-config override — the field becomes editable again. */
  const unlockOverride = (field: string) => {
    update({ configOverrides: (draftRef.current.configOverrides ?? []).filter((f) => f !== field) })
    toast(`${field === "systemPrompt" ? "System prompt" : field === "greeting" ? "Greeting" : "Field"} unlocked`, {
      description: "Edits here now win over the custom config.",
    })
  }

  // ── Mount: time-to-live clock; restore + ?artifact/?dc/?step/?template/?blank ──
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    // Mounted only for the commit ?view=list is about to replace — do NOTHING.
    if (params.get("view") === "list") return
    markBuildStart()
    const artifactId = params.get("artifact")
    const dc = params.get("dc")
    const stepParam = parseInt(params.get("step") ?? "", 10)
    // Legacy v3 links (6 Test · 7 Go live) map onto the v5 sections.
    const stepToOpen = Number.isFinite(stepParam) ? resolveStepParam(stepParam) : null
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
      // Reset baseline for a saved agent = its DEPLOYED config.
      baseline.current = agentToDraft(existing!)
      // Unsaved edits survive a refresh via the per-agent slot (#6).
      const unsaved = restoreDraft(existing!.id)
      if (unsaved) {
        setDraft(unsaved)
        // Sync the ref NOW — the dc path below reads draftRef (audit 2026-07-07).
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
        // Multi-select: a deep link ADDS the channel; a direction conflict
        // (inbound XOR batch) swaps — announced, same as the Channel toggle.
        setDraft((d) => {
          const next = applyDc(d, dc)
          announceDcSwap(d, next)
          return next
        })
        dirty.current = true
        openLater(2)
      } else if (stepToOpen) {
        openLater(stepToOpen)
      }
      return
    }

    // ?blank=1 — an explicitly blank builder must not resurrect the previous
    // draft (re-eval #4). The saved slot is left intact.
    if (blank || params.get("blank") === "1") {
      setDraft({ ...EMPTY_DRAFT })
      baseline.current = { ...EMPTY_DRAFT }
      stripParam("blank")
      if (stepToOpen) openLater(stepToOpen)
      return
    }

    // Template seeding (?template=) — but NEVER clobber real work (re-eval #4).
    const templateId = params.get("template")
    const tpl = templateId ? AGENT_TEMPLATES.find((t) => t.id === templateId) : undefined
    if (tpl) {
      stripParam("template")
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
        // Persist NOW, not via the debounced autosave (remount race, 2026-07-07).
        saveDraft(seeded)
        baseline.current = seeded
        dirty.current = true
        toast.success(`Started from ${tpl.name}`, {
          description: "Name, prompt, and greeting are pre-filled. Tweak anything.",
        })
        // Land on the SEEDED draft's first gap (Channel) — the rail's default
        // was locked from the pre-seed empty draft, parking it on Voice
        // (user-test 2026-07-29).
        if (!stepToOpen) openLater(firstIncomplete(seeded))
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
      // An import/creation just landed here — say THAT, not "restored".
      const notice = takeImportNotice()
      if (notice?.kind === "create") {
        toast.success(`${notice.name} created`, {
          id: "import-landing",
          description: notice.inferred
            ? `${notice.inferred}. Review, then deploy.`
            : "Template applied — pick its channels, then deploy.",
        })
      } else if (notice) {
        const prev = notice.prev
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
        toast("Draft restored", { id: "import-landing", description: `Picked up at ${STEP_TITLES[at - 1]}.` })
      }
      if (!stepToOpen && !dc) openLater(notice?.kind === "create" ? 1 : at)
    }
    if (dc) {
      const before = next
      next = applyDc(next, dc)
      announceDcSwap(before, next)
    }
    setDraft(next)
    baseline.current = next
    if (dc) openLater(2)
    else if (stepToOpen) openLater(stepToOpen)
    if (artifactId || dc) {
      dirty.current = true
      saveDraft(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ⌘K commands open sections via this event when a wizard is already mounted
  // (a same-route ?step push never re-fires the mount parser — re-eval #2).
  const openRowRef = React.useRef<(n: number) => void>(() => {})
  const openTestRef = React.useRef(openTest)
  openTestRef.current = openTest
  React.useEffect(() => {
    const onOpenStep = (e: Event) => {
      const raw = (e as CustomEvent<number>).detail
      if (typeof raw !== "number") return
      e.preventDefault()
      const n = resolveStepParam(raw)
      if (n) openRowRef.current(n)
    }
    const onOpenTest = (e: Event) => { e.preventDefault(); openTestRef.current("simulations") }
    window.addEventListener("sx:open-wizard-step", onOpenStep)
    window.addEventListener("sx:open-test-panel", onOpenTest)
    return () => {
      window.removeEventListener("sx:open-wizard-step", onOpenStep)
      window.removeEventListener("sx:open-test-panel", onOpenTest)
    }
  }, [])

  // Autosave BOTH modes (edit gets a per-agent slot) + drive the status chip.
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
    setSavePulse((p) => p + 1)
  }, [draft], 600)

  // ── Step navigation — one-pager: "opening" a step = scrolling to it. ───────
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
    // Guarantee arrival: silently-dropped smooth scrolls jump instantly.
    window.setTimeout(() => {
      if (Math.abs(el.getBoundingClientRect().top - 96) > 120) el.scrollIntoView({ block: "start" })
    }, 450)
  }
  // While a chosen scroll glides, mute the spy so the clicked step stays lit.
  const spyMutedUntil = React.useRef(0)
  const muteSpy = (ms: number) => { spyMutedUntil.current = Date.now() + ms }
  const openRow = (n: number) => {
    expandSection(n)
    setOpenStep(n)
    syncStepParam(n)
    muteSpy(800)
    scrollToStep(n)
  }
  openRowRef.current = openRow

  // Stack writes come from the Voice section + its Advanced sheet.
  const updateStack = (stack: AgentDraft["stack"]) => {
    muteSpy(800)
    update({ stack })
  }

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

  // ── Per-section reset — against a stable baseline (deployed config for a
  //    live agent, this visit's landing state for a new draft). v4 slices:
  //    1 Voice (voice + stack + speech tuning) · 2 Channel (channels + config)
  //    · 3 Context (words + knowledge/tools) · 4 Go Live (campaigns + outputs
  //    + call behavior). Section 2's reset must NOT clear campaigns — those
  //    belong to 4.
  const baseline = React.useRef<AgentDraft | null>(null)
  const stepSlice = (d: AgentDraft, n: number): Partial<AgentDraft> =>
    n === 1 ? { voice: d.voice, stack: d.stack, advanced: d.advanced }
    : n === 2 ? { channels: d.channels, config: d.config, hosting: d.hosting }
    : n === 3 ? { systemPrompt: d.systemPrompt, greeting: d.greeting, failureMessage: d.failureMessage, knowledge: d.knowledge, mcp: d.mcp, connectors: d.connectors }
    : n === 5 ? { campaigns: d.campaigns, analysis: d.analysis, callBehavior: d.callBehavior }
    : {}
  const stepDirty = (n: number) => {
    const base = baseline.current
    if (!base) return false
    return JSON.stringify(stepSlice(draft, n)) !== JSON.stringify(stepSlice(base, n))
  }
  const resetStep = (n: number) => {
    const base = baseline.current
    if (!base) return
    const cur = draftRef.current
    const before = JSON.parse(JSON.stringify(stepSlice(cur, n))) as Partial<AgentDraft>
    dirty.current = true
    // Deep-clone: the baseline must never share references with the live draft.
    update(JSON.parse(JSON.stringify(stepSlice(base, n))) as Partial<AgentDraft>)
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

  // Whole-agent discard: reverting three edited steps must not take three clicks.
  const discardEdits = () => {
    const base = baseline.current
    if (!base) return
    const before = JSON.parse(JSON.stringify(draftRef.current)) as AgentDraft
    dirty.current = true
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

  // Apply an edited-JSON patch from the Custom config drawer (F4). Fields the
  // JSON overrides get FLAGGED + DISABLED in the UI (owner 2026-07-28) until
  // unlocked — the JSON is their source of truth while listed.
  const OVERRIDABLE = ["systemPrompt", "greeting", "failureMessage"] as const
  const applyConfigPatch = (patch: Partial<AgentDraft>) => {
    const before = JSON.parse(JSON.stringify(draftRef.current)) as AgentDraft
    dirty.current = true
    // Only fields the JSON actually CHANGED lock — the drawer seeds the full
    // draft, so mere presence would spuriously lock untouched fields.
    const overridden = OVERRIDABLE.filter(
      (k) => patch[k] !== undefined && patch[k] !== draftRef.current[k],
    )
    setDraft((d) => ({
      ...d,
      ...patch,
      configOverrides: [...new Set([...(d.configOverrides ?? []), ...overridden])],
    }))
    toast.success("Config applied", {
      description: overridden.length
        ? `Your JSON edits are in the draft — ${overridden.length} field${overridden.length > 1 ? "s are" : " is"} now controlled by the custom config (flagged in Prompt & knowledge).`
        : "Your JSON edits are in the draft.",
      action: { label: "Undo", onClick: () => { dirty.current = true; setDraft(before) } },
    })
  }

  // Picking a voice seeds the draft (tier-preserving — see seedFromVoice).
  const selectVoice = (v: VoiceArtifact) => {
    dirty.current = true
    setDraft((d) => seedFromVoice(d, v))
  }

  // ── Import landing (user-test #6, 2×S1) — routed EXPLICITLY. ───────────────
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
   *  non-empty ones. */
  const applyImport = (config: ImportedAgentConfig, opts: { replacePrompt: boolean }) => {
    const artifact = importedConfigToArtifact(config)
    const before = JSON.parse(JSON.stringify(draftRef.current)) as AgentDraft
    const hadOwnPrompt = !!before.systemPrompt.trim()
    const importedPrompt = !!config.systemPrompt?.trim()
    dirty.current = true
    setDraft((d) => {
      let seeded = seedFromVoice(d, artifact)
      // Imports carry their ENGINE too (the report's LLM row claims it) —
      // unlike a plain voice switch, the artifact's whole stack applies.
      if (artifact.stack) {
        seeded = { ...seeded, stack: { ...artifact.stack, language: d.stack.language } }
      }
      if (config.callBehavior) {
        seeded = {
          ...seeded,
          callBehavior: { ...DEFAULT_CALL_BEHAVIOR, ...d.callBehavior, ...config.callBehavior },
        }
      }
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
    // Review lands where the change is: Context when the prompt moved, else Voice.
    openRow(promptChanged ? 3 : 1)
  }

  /** Land the import as its OWN draft — the open agent stays untouched. */
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

  // Code/SDK third deploy state (user-test #9, D3 S2).
  const [codeDeployedNow, setCodeDeployedNow] = React.useState(false)
  const publishingRef = React.useRef(false)
  // Pre-flight — the ONE confirmation for every deploy (2026-07-24); a ref so
  // the confirmed re-entry can't race the dialog's close render.
  const preflightConfirmedRef = React.useRef(false)
  const [preflightOpen, setPreflightOpen] = React.useState(false)
  const publish = () => {
    if (publishingRef.current) return // double-click must not double-publish
    // No-op honesty (user-test #10, D1 S3).
    const channelsChanged = isLive && !!baseline.current &&
      JSON.stringify(draftRef.current.channels) !== JSON.stringify(baseline.current.channels)
    if (isLive && !anyEdited && !channelsChanged) {
      toast("Already live", { description: "No changes since the last deploy." })
      return
    }
    if (!preflightConfirmedRef.current) {
      setPreflightOpen(true)
      return
    }
    preflightConfirmedRef.current = false
    // Belt-and-suspenders: the pre-flight only arms its confirm when green.
    const reason = publishBlockReason(draftRef.current)
    if (reason) { toast.error("Not ready to deploy yet", { description: reason }); return }
    publishingRef.current = true
    // Disarm any pending debounced autosave BEFORE clearing the slot (re-eval #16).
    dirty.current = false
    const agentId = draft.agentId ?? `agt_${Date.now().toString(36)}`
    // Code/SDK deploys STAY on the step: the snippets need the minted ID
    // (user-test #7, D3 S2). Monitor rides the success toast instead.
    const stay = primaryChannel(draftRef.current) === "code"
    const doPublish = () => {
      const d = draftRef.current
      const primary = primaryChannel(d)
      // The list is the ledger (user-test 2026-07-28 P0): a deployed agent
      // must EXIST in All agents — record it in the shared session store,
      // runs and all, so it lands at the top of the list.
      if (!isEdit) upsertSessionAgent(draftToSessionAgent(d, agentId))
      publishDeployment({
        router, agentId, agentName: draft.name || "Your agent",
        channel: d.channels.map(channelLabel).join(" · ") || "—",
        name: draft.name || "Deployment",
        mode: primary === "batch" ? "outbound" : primary === "code" ? "code" : "inbound",
        stay,
      })
      if (stay) {
        setCodeDeployedNow(true)
        const next = { ...draftRef.current, agentId }
        setDraft(next)
        draftRef.current = next
        saveDraft(next, isEdit ? next.agentId : undefined)
        publishingRef.current = false
        return
      }
      // Deploying consumes the working copy — clear whichever slot this was.
      clearDraft(isEdit ? draft.agentId : undefined)
    }
    // Hedonic climax: ~900ms launch rings before the action completes.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doPublish()
      return
    }
    setLaunchBurst(true)
    window.setTimeout(() => {
      doPublish()
      if (stay) window.setTimeout(() => setLaunchBurst(false), 300)
    }, 900)
  }

  // ── Identity facts the Test panel + header share. ──────────────────────────
  const cardVoice = React.useMemo(
    () => (draft.voice ? getVoiceArtifact(draft.voice.id) : undefined),
    [draft.voice],
  )
  const codeDeployed = hasChannel(draft, "code") && !isLive && (codeDeployedNow || (!isEdit && !!draft.agentId))
  const cardStatus = isEdit && effectiveStatus
    ? effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)
    : codeDeployed ? "Deployed" : "Draft"
  const cardStack = stackLine(draft.stack)
  const cardEst = stackEstimateFor(draft.stack)
  const cardLatency = draft.stack.pipeline === "mllm" ? undefined : stackLatencyDetail(draft.stack)
  const toggleTest = () => {
    const channel = primaryChannel(draft) ?? "unknown"
    if (testing) track(Events.agent_test_ended, { channel, agent_id: draft.agentId ?? "new", duration_sec: 30 })
    else track(Events.agent_test_started, { channel, agent_id: draft.agentId ?? "new" })
    setTesting((t) => !t)
  }

  const blockReason = publishBlockReason(draft)
  // Honest deploy-state line: a live agent with pending edits says so.
  const dirtyCount = isLive ? [1, 2, 3, 5].filter(stepDirty).length : 0
  const anyEdited = dirtyCount > 0
  const deploySub = isLive
    ? anyEdited
      ? `${dirtyCount} section${dirtyCount > 1 ? "s" : ""} edited · not live`
      : // Clean state must not imply pending changes (user-test 2026-07-29).
        "Live — edits stay draft until you redeploy."
    : codeDeployed
    ? "Deployed — goes live when your app connects."
    : blockReason ?? "Review Go Live and deploy."
  const baselineBatch = !!baseline.current?.channels.includes("batch")
  const channelsChanged = isLive && !!baseline.current &&
    JSON.stringify(draft.channels) !== JSON.stringify(baseline.current.channels)
  const deployCta = !isLive
    ? codeDeployed ? "Redeploy" : "Deploy"
    : channelsChanged && hasChannel(draft, "batch") && !baselineBatch ? "Launch batch calls"
    : anyEdited || channelsChanged ? "Redeploy" : "Live — no changes"
  const active = activeCampaigns(draft)
  const preflightCta =
    hasChannel(draft, "batch") && active.length > 0
      ? active.every((c) => c.launch?.mode === "scheduled")
        ? `Schedule run${active.length > 1 ? "s" : ""}`
        : `Start run${active.length > 1 ? "s" : ""}`
      : deployCta === "Live — no changes" ? "Deploy" : deployCta

  // The live contextual test's identity card (Test section, inline).
  const liveTestIdentity: LiveTestIdentity = {
    name: draft.name,
    namePlaceholder: isEdit ? existing!.name : "Your new agent",
    onNameChange: (v) => update({ name: v }),
    agentId: draft.agentId,
    status: cardStatus,
    subtitle: isEdit ? (existing!.role ?? "Voice agent") : (cardVoice?.name ?? "Pick a voice to start"),
    stack: cardStack,
    language: `${draft.stack.language ?? "English"} · ${draft.stack.pipeline === "mllm" ? "Realtime" : STACK_PRESETS[draft.stack.preset].label}`,
    costPerMin: cardEst?.costPerMin,
    latencyMs: cardEst?.latencyMs,
    latencyBreakdown: cardLatency,
    channel: draft.channels.length ? {
      label: channelTarget(draft),
      onClick: () => openRow(2),
    } : undefined,
    talking: testing,
    onToggleTalk: toggleTest,
    talkLabel: `Talk to ${draft.name || "your agent"}`,
  }

  const previewStatus =
    warming ? "Warming up"
    : effectiveStatus === "paused" ? "Paused"
    : isLive || effectiveStatus === "live" ? "Live"
    : codeDeployed ? "Deployed" : "Draft"
  const { copied: idCopied, copy: copyId } = useCopyFeedback()

  // Strip Talk = the button does what it says: expand + scroll to the live
  // contextual test AND start it (a teleport that lands mid-action was the
  // judges' disorientation flag — arriving in a started test resolves it).
  const stripTalk = () => {
    openRow(4)
    if (!testing) toggleTest()
  }

  /** One-line value recap a COLLAPSED section shows in its heading row —
   *  recognition over recall while folded (Concertina graft). Live agents
   *  append "· edited" so dirtiness never hides inside a closed section. */
  const sectionRecap = (n: number): string => {
    const edited = isLive && stepDirty(n) ? " · edited" : ""
    if (n === 1)
      return draft.voice
        ? `${cardVoice?.name ?? "Custom voice"} · ${draft.stack.pipeline === "mllm" ? "Realtime" : STACK_PRESETS[draft.stack.preset].label} · ${draft.stack.language ?? "English"}${edited}`
        : "No voice yet"
    // "No deployment TYPE picked yet", never "No deployment yet" — on this
    // screen bare "deployment" describes LIVE state (the header chip), not a
    // config gap (user-test 2026-07-29; vocabulary sweep 2026-07-30).
    if (n === 2) {
      // A pinned region is a compliance decision — it must stay visible when
      // the section is folded. Automatic is the default, so it stays quiet.
      const region = isPinned(draftHosting(draft)) ? ` · ${hostingSummary(draftHosting(draft))}` : ""
      return draft.channels.length
        ? `${channelTarget(draft)}${region}${edited}`
        : `No deployment type picked yet${region}`
    }
    if (n === 3) {
      if (!draft.systemPrompt.trim()) return "No prompt yet"
      const parts = ["Prompt set"]
      if (draft.knowledge.length) parts.push(`${draft.knowledge.length} knowledge`)
      const tools = draft.mcp.length + draft.connectors.length
      if (tools) parts.push(`${tools} tool${tools > 1 ? "s" : ""}`)
      return parts.join(" · ") + edited
    }
    if (n === 4)
      return simSummary
        ? `${simSummary.passed}/${simSummary.total} sims passed · simulated`
        : "Not tested yet"
    return isLive
      ? anyEdited ? `${dirtyCount} section${dirtyCount > 1 ? "s" : ""} edited · not live` : "Live"
      : codeDeployed ? "Deployed" : blockReason ?? "Ready to deploy"
  }

  return (
    // Full-bleed shell — data-fluid removes the layout cap; the wizard owns
    // all spacing: no card, no outer padding, flush border-divided columns.
    <div data-fluid className="flex flex-col">
      {/* Breadcrumbs: All Agents › {name} › Edit Agent. */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 border-b border-border px-5 py-2 text-xs text-muted-foreground">
        <a href="/agents?view=list" className="rounded transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">All Agents</a>
        <ChevronRight className="h-3 w-3" aria-hidden />
        <span className="max-w-[12rem] truncate text-foreground">{draft.name || (isEdit ? existing!.name : "New agent")}</span>
      </nav>
      {/* Header — identity on the left, Test + Deploy on the right. */}
      <header className="flex items-center gap-4 border-b border-border px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <h1 aria-label={draft.name || (isEdit ? existing!.name : "Your new agent")} className="min-w-0 shrink-0">
            <input
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={isEdit ? existing!.name : "Name your agent"}
              aria-label="Agent name"
              className="max-w-[18rem] rounded-md bg-transparent text-base font-semibold leading-6 outline-none [field-sizing:content] placeholder:font-normal placeholder:text-muted-foreground/60 focus:bg-muted/50"
            />
          </h1>
          {/* Template chip next to the name (v4: the template moved OUT of the
              prompt section to the top, per owner). */}
          <TemplateMenu
            draft={draft}
            update={update}
            onApplied={() => { setTemplateFlash((k) => k + 1); openRow(3) }}
          />
          {/* Status chip beside the name. */}
          <Badge variant="secondary" className="shrink-0 text-xs">{previewStatus === "Warming up" ? "Draft" : previewStatus}</Badge>
          {/* Copyable agent ID. */}
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
          {/* Kebab overflow: New agent · Import · Template. */}
          {(onCreateNew || !isEdit || landing) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9" aria-label="More actions">
                  <EllipsisVertical className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onCreateNew && (
                  <DropdownMenuItem onClick={onCreateNew}>New agent</DropdownMenuItem>
                )}
                {(!isEdit || landing) && (
                  <ImportAgentSheet onImported={onImported}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Import an existing agent</DropdownMenuItem>
                  </ImportAgentSheet>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* </> config view (icon-only). */}
          <CustomConfigDrawer draft={draft} onEditStep={openRow} onApply={applyConfigPatch} iconOnly />
          <Button variant="secondary" size="sm" className="min-w-16 gap-1.5" onClick={publish}>
            {deployCta}
          </Button>
        </div>
      </header>

      {/* TEST STRIP (judge-round winner 2026-07-29) — testing is ambient, not a
          destination: both test modes + the freshest verdict live in one slim
          bar directly under the header, sticky at lg+ so "does it work yet?"
          is answerable at every scroll depth. Replaces the header Test button. */}
      <div className="z-30 flex h-12 items-center gap-2 border-b border-border bg-background/95 px-5 backdrop-blur lg:sticky lg:top-12">
        <Button
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={warming}
          onClick={stripTalk}
          aria-label={`Talk to ${draft.name || "your agent"} — opens the live test`}
        >
          <Mic className="h-3.5 w-3.5" aria-hidden />
          <span className="max-w-[14rem] truncate">
            {testing ? "Talking — jump to test" : `Talk to ${draft.name || "your agent"}`}
          </span>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          onClick={() => (testOpen ? setRailOpen(false) : openTest("simulations"))}
          aria-pressed={testOpen}
        >
          Run simulations
        </Button>
        {/* Verdict line — states split (user-test 2026-07-30): "· simulated"
            tags actual RESULTS only; pre-run is a plain "No sim runs yet".
            The wireframe-wide disclosure is the standing note beside it. */}
        <button
          type="button"
          onClick={() => openTest("simulations")}
          className="ml-auto hidden min-w-0 truncate rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
        >
          {simSummary
            ? `Last run: ${simSummary.passed}/${simSummary.total} passed · simulated`
            : "No sim runs yet"}
        </button>
        <span className="hidden shrink-0 text-xs text-muted-foreground/70 lg:inline">
          Wireframe — all runs are simulated
        </span>
      </div>

      {/* Below lg the rail stacks above the sections; a slim sticky strip keeps
          step nav + deploy in the fold (top-12 = the app header height). */}
      <div className="sticky top-12 z-30 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-2 backdrop-blur lg:hidden">
        <span className="flex shrink-0 items-center gap-1" role="group" aria-label="Jump to section">
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
              {n}
            </button>
          ))}
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{deploySub}</p>
        <Button size="sm" className="shrink-0 gap-1.5" onClick={publish}>
          {deployCta}
        </Button>
      </div>

      {/* FLUSH grid: rail 320 · config canvas · (optional) docked Test panel.
          The Test column is `auto` — the panel owns its width via drag. */}
      <div
        className={cn(
          "grid grid-cols-1 items-start lg:grid-cols-[320px_minmax(0,1fr)]",
          testOpen && "lg:grid-cols-[320px_minmax(0,1fr)_auto]",
        )}
      >
        {/* Rail — pure nav; scrolls internally on short viewports. */}
        <aside className="min-w-0 space-y-5 border-b border-border p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:border-b-0">
          {/* Grouped rail (owner mock 2026-07-30): CUSTOMIZE · SHIP headers +
              per-row icons over the same rows. */}
          <nav aria-label="Build sections" className="space-y-3">
            {SECTION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-2.5 pb-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.steps.map((n) => {
                    const isActive = n === selected
                    const Icon = STEP_ICONS[n]
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => openRow(n)}
                        aria-current={isActive ? "step" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent/40",
                          isActive && "bg-accent/60",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{stepTitle(n, draft)}</span>
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
                          {isDone(n) ? (
                            <Check className={cn("h-3.5 w-3.5 text-success/80", !initialDones.current?.has(n) && "sx-tick-pop")} />
                          ) : (
                            <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                          )}
                        </span>
                        {isDone(n) && <span className="sr-only">(done)</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Fold control — "Expand all" whenever anything is folded. A real
              ghost button, not a footnote link: it's load-bearing now that
              fold state persists per agent (user-test 2026-07-30). */}
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setAllCollapsed(collapsedSet.size === 0)}
          >
            {collapsedSet.size > 0 ? "Expand all" : "Collapse all"}
          </Button>

          {/* Autosave feedback — "DRAFT saved", not "Saved" (user-test #11). */}
          {saveState !== "idle" && (
            <p className="px-2.5 text-xs text-muted-foreground" role="status" aria-live="polite">
              {saveState === "saving" ? "Saving…" : "Draft saved"}
            </p>
          )}

          {/* Dirty ramp to Go Live + Discard (2026-07-22 D1). */}
          {((isLive && anyEdited) || codeDeployed) && (
            <div className="space-y-2 border-t border-border pt-3">
              {isLive && anyEdited && (
                <p className="px-0.5 text-xs text-warning">{dirtyCount} section{dirtyCount > 1 ? "s" : ""} edited · not live</p>
              )}
              {codeDeployed && (
                <p className="px-0.5 text-xs text-muted-foreground">Deployed — goes live when your app connects.</p>
              )}
              {isLive && anyEdited && (
                <>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openRow(5)}>
                    Review &amp; deploy
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={discardEdits}>
                    Discard edits
                  </Button>
                </>
              )}
            </div>
          )}
        </aside>

        {/* Center column: borderless sections divided by hairlines. No
            overflow-hidden (sticky headers need to escape). */}
        <div className="min-w-0 divide-y divide-border border-t border-border lg:border-t-0 lg:min-h-[calc(100vh-10rem)] lg:border-l">
          {[1, 2, 3, 4, 5].map((n) => {
            const folded = collapsedSet.has(n)
            return (
              <section
                key={n}
                id={`wizard-step-${n}`}
                aria-labelledby={`wizard-step-${n}-title`}
                className="scroll-mt-24"
              >
                {/* Plain sticky heading over a hairline — now the collapse
                    toggle too (Test Strip winner): the whole row is the
                    button, a bare chevron is the only added chrome, and a
                    folded section recaps its values inline. */}
                <header className="z-20 flex items-center gap-1 border-b border-border bg-background lg:sticky lg:top-24">
                  <h3 id={`wizard-step-${n}-title`} className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleSection(n)}
                      aria-expanded={!folded}
                      aria-controls={`wizard-step-${n}-body`}
                      className="flex w-full min-w-0 items-center gap-2 px-5 py-3 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <ChevronRight
                        className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !folded && "rotate-90")}
                        aria-hidden
                      />
                      <span className="shrink-0 text-sm font-semibold">{stepTitle(n, draft)}</span>
                      {isDone(n) && <Check className="h-3.5 w-3.5 shrink-0 text-success/80" aria-hidden />}
                      {folded && (
                        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                          {sectionRecap(n)}
                        </span>
                      )}
                    </button>
                  </h3>
                  {/* LIVE agents: the one way back to the deployed config. */}
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
                {/* Folded ≠ unmounted: section-local state (the live talk
                    test, campaign editors) must survive a fold. */}
                <div id={`wizard-step-${n}-body`} className={cn("p-5", folded && "hidden")}>
                  {/* Sections 1–3 cap for readability; Go Live stays fluid
                      (the campaigns' 50/50 CSV grid manages its own width). */}
                  <div className={cn("min-w-0", n <= 3 && "max-w-5xl")}>
                  {/* 1 · VOICE — the two handles: tier (cost) + voice. */}
                  {n === 1 && (
                    <SectionRows>
                      <VoiceSection
                        draft={draft}
                        update={update}
                        onSelectVoice={selectVoice}
                        onStackChange={updateStack}
                      />
                    </SectionRows>
                  )}
                  {/* 2 · DEPLOYMENT — pick the type + per-type connection. */}
                  {n === 2 && (
                    <>
                      {/* Deployment vs Go Live disambiguation (user-test
                          2026-07-30): the TYPE is chosen here; the launch
                          lives in Go Live. Owner-locked labels untouched. */}
                      <p className="pb-5 text-sm text-muted-foreground">
                        Where your agent takes calls — launch it in Go Live.
                      </p>
                      <SectionRows>
                        <ChannelSection
                          draft={draft}
                          update={update}
                          liveChannels={isLive ? baseline.current?.channels : undefined}
                          onGoToStep={openRow}
                        />
                      </SectionRows>
                    </>
                  )}
                  {/* 3 · CONTEXT — the words; knowledge & tools collapse to a
                      compact "add additional context" door (owner 2026-07-28). */}
                  {n === 3 && (
                    <SectionRows>
                      <SectionPrompt
                        draft={draft}
                        update={update}
                        templateFlash={templateFlash}
                        onUnlock={unlockOverride}
                      />
                      {/* KB · MCP · connectors UPFRONT (owner 2026-07-29:
                          "don't nest them"). */}
                      <SectionKnowledgeTools draft={draft} update={update} />
                    </SectionRows>
                  )}
                  {/* 4 · TEST — live contextual test inline; simulations in
                      the docked panel. */}
                  {n === 4 && (
                    <TestSection
                      draft={draft}
                      identity={liveTestIdentity}
                      onOpenSims={() => openTest("simulations")}
                    />
                  )}
                  {/* 5 · GO LIVE — the deploy panel. */}
                  {n === 5 && (
                    <DeploySection
                      draft={draft}
                      update={update}
                      live={isLive}
                      deployCta={isLive || codeDeployed ? deployCta : undefined}
                      onPublish={publish}
                      onFix={openRow}
                      publishRegionRef={publishRegionRef}
                    />
                  )}
                  </div>
                </div>
              </section>
            )
          })}
        </div>

        {/* Docked Test panel — the third grid column when open (lg+); a Sheet
            below lg. Resizable by dragging its left border. */}
        <TestPanel
          open={testOpen}
          onOpenChange={setRailOpen}
          tab={testTab}
          onTabChange={setTestTab}
          draft={draft}
          agentName={draft.name || (isEdit ? existing!.name : "your agent")}
          widgetGreeting={draft.greeting.trim() || undefined}
          onRunSummary={setSimSummary}
          // ONE talk state across the rail and the inline section-4 test —
          // two independent "is a call up?" flags would contradict each other.
          talking={testing}
          onToggleTalk={toggleTest}
          talkDisabled={warming}
        />
      </div>

      {/* Deploy climax — ~900ms launch rings, purely celebratory. */}
      {launchBurst && (
        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-[2px]" aria-hidden>
          <span className="sx-launch-ring absolute h-40 w-40 rounded-full border-2 border-primary/50" />
          <span className="sx-launch-ring absolute h-40 w-40 rounded-full border border-primary/35" style={{ animationDelay: "0.15s" }} />
          <span className="sx-launch-ring absolute h-40 w-40 rounded-full border border-success/40" style={{ animationDelay: "0.3s" }} />
          <span className="sx-launch-lift flex flex-col items-center gap-2">
            <Rocket className="h-10 w-10 text-primary" />
            <span className="text-sm font-semibold">{draft.name || "Your agent"} is going live…</span>
          </span>
        </div>
      )}

      {/* Pre-flight — the ONE confirmation for every deploy. */}
      <DeployPreflight
        open={preflightOpen}
        onOpenChange={setPreflightOpen}
        draft={draft}
        ctaLabel={preflightCta}
        liveInboundNumber={
          isLive &&
          baseline.current?.channels.includes("inbound") &&
          !hasChannel(draft, "inbound") &&
          hasChannel(draft, "batch")
            ? PHONE_NUMBERS.find((n) => n.id === baseline.current!.config.inbound?.numberIds[0])?.number ?? "its inbound number"
            : undefined
        }
        onConfirm={() => { preflightConfirmedRef.current = true; publish() }}
        onFix={(m) => openRow(m)}
        onTalkFirst={() => openRow(4)}
        simSummary={simSummary}
        onViewSims={() => openTest("simulations")}
      />

      {/* Import landing — never silent (user-test #6, 2×S1). */}
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
 *  restore cursor. Not a gate. v5 order: Voice → Channel → Context → Test →
 *  Go Live; Test runs on defaults, so a complete draft resumes at Go Live. */
function firstIncomplete(d: AgentDraft): number {
  if (d.voice === null) return 1
  if (d.channels.length === 0) return 2
  if (d.systemPrompt.trim() === "") return 3
  return 5
}

/** Picking a voice adopts its SOUND, not its whole engine (v4: the model tier
 *  is the Voice section's own cost handle — a voice pick must not silently
 *  reset it). The TTS slot follows the voice so vendor + voice stay coherent;
 *  prompt/greeting seed only while empty. */
function seedFromVoice(d: AgentDraft, v: VoiceArtifact): AgentDraft {
  const tts = v.stack?.tts ?? { vendor: v.provider ?? "ElevenLabs", voice: v.ttsVoice }
  return {
    ...d,
    voice: { kind: v.kind, id: v.id },
    name: d.name || v.name,
    stack: { ...d.stack, tts },
    systemPrompt: d.systemPrompt.trim() ? d.systemPrompt : v.systemPrompt ?? defaultPromptFor(v),
    greeting: d.greeting.trim() ? d.greeting : v.firstMessage,
  }
}

/** One-line preview for the prompt-conflict dialog. */
function truncPrompt(s: string, n = 90): string {
  const flat = s.replace(/\s+/g, " ").trim()
  return flat.length > n ? `${flat.slice(0, n - 1)}…` : flat
}

/** Toast when a `?dc=` deep link swapped the direction (inbound XOR batch) —
 *  the loss must be announced, same as the Channel section's toggle. */
function announceDcSwap(before: AgentDraft, after: AgentDraft) {
  const dropped = before.channels.find((c) => !after.channels.includes(c))
  const added = after.channels.find((c) => !before.channels.includes(c))
  if (!dropped || !added) return
  const directionPair =
    (dropped === "inbound" && added === "batch") || (dropped === "batch" && added === "inbound")
  toast(`Switched to ${channelLabel(added)}`, {
    description: directionPair
      ? "One agent can't handle both inbound and outbound. The previous setup is kept — switch back in Deployment to restore it."
      : `One deployment per agent — your ${channelLabel(dropped)} setup is kept. Switch back in Deployment to restore it.`,
  })
}

/** `?dc=` deep link → ADD that channel to the draft (multi-select: additive;
 *  direction conflicts swap, announced by announceDcSwap) + seed its
 *  connection state. */
function applyDc(d: AgentDraft, dc: string): AgentDraft {
  const primary: DeployChannel | null =
    dc === "inbound" || dc === "web" ? "inbound" : dc === "batch" ? "batch" : dc === "code" ? "code" : null
  if (!primary) return d
  const surfaces = dc === "web"
    ? [...new Set([...(d.config.inbound?.surfaces ?? []), "web" as const])]
    : d.config.inbound?.surfaces ?? ["phone" as const]
  return {
    ...d,
    channels: [primary],
    config: {
      ...d.config,
      ...(primary === "inbound"
        ? { inbound: { numberIds: d.config.inbound?.numberIds ?? [], surfaces } }
        : {}),
      ...(primary === "code" ? { code: { added: true } } : {}),
    },
  }
}
