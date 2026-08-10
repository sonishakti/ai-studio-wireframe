"use client"

import * as React from "react"
import { X, Sparkles, Mic, PhoneOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { TestsSection } from "@/components/eval-tests"
import { AgentSphere } from "@/components/agent-test-panel"
import { SimTranscript, SimulatedBanner, AgentStateChips, type SimState } from "@/components/sim-transcript"
import { WidgetPreviewCard } from "@/components/widget-studio"
import { generateContextualCases } from "@/components/wizard/test-section"
import { hasWebWidget, type AgentDraft } from "@/lib/wizard-draft"
import {
  stackEstimateFor, stackLatencyDetail, type EvalCase, type EvalCaseResult, type EvalTurn,
} from "@/lib/campaign-data"

/** Below lg (1024) the docked column doesn't exist — the panel falls back to
 *  a Sheet. Must match the grid's `lg:` breakpoint, NOT useIsMobile's 768. */
function useBelowLg() {
  const [below, setBelow] = React.useState(false)
  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    const onChange = () => setBelow(mql.matches)
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])
  return below
}

/**
 * TestPanel — the builder's right rail (Figma 2861-52041).
 *
 * Two peers behind one segmented control:
 *  · SIMULATIONS — the auto-generated contextual scenario suite. Still the
 *    DEFAULT tab: the owner lock (2026-07-29, "the RHS Test panel should have
 *    simulations, NOT the agent call") decides what you land on, and the Figma
 *    decides what else is reachable. Both hold.
 *  · TEST AGENT — the orb + Talk, so the rail can answer "does it sound right?"
 *    without scrolling to section 4. The inline live test in section 4 is
 *    unchanged; this is an additional door to the same mock, not a move.
 *  · WIDGET — appears only when the web surface is on.
 *
 * SESSION STATISTICS sits under all three, always visible: which vendor is in
 * each pipeline slot, what each contributes to first-word latency, and the
 * cost per minute. It is the fastest read of "what am I actually shipping?"
 * and it is what makes the model-tier slider's trade-off legible while you use
 * any tab.
 *
 * Docked, not an overlay — a real grid column, so the main column flexes
 * beside it. RESIZABLE by dragging its left border. Below lg it falls back to
 * a full-width Sheet.
 */

const WIDTH_KEY = "sx:test_panel_w"
const MIN_W = 360
const MAX_W = 720
const DEFAULT_W = 460

export type TestPanelTab = "simulations" | "agent" | "widget"

/** The scripted exchange the rail's Talk mock plays — evidence of a working
 *  agent rather than a silent orb (the top recurring break in user tests). */
const RAIL_TALK: EvalTurn[] = [
  { role: "agent", text: "Hi! Thanks for calling — how can I help today?" },
  { role: "caller", text: "I wanted to check on my order." },
  { role: "agent", text: "Happy to help. What's the order number?" },
  { role: "caller", text: "It's 4471." },
  { role: "agent", text: "Got it — order 4471 ships tomorrow and arrives Friday.", note: "lookup_order called" },
]

export function TestPanel({
  open,
  onOpenChange,
  tab,
  onTabChange,
  draft,
  agentName,
  widgetGreeting,
  onRunSummary,
  talking,
  onToggleTalk,
  talkDisabled,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  tab: TestPanelTab
  onTabChange: (t: TestPanelTab) => void
  draft: AgentDraft
  agentName: string
  widgetGreeting?: string
  /** Bubbles each completed "Run all" up to the Test strip's verdict line. */
  onRunSummary?: (s: { passed: number; failed: number; total: number }) => void
  /** Host-owned talk state — SHARED with the inline section-4 test so the two
   *  surfaces can never disagree about whether a call is up. */
  talking?: boolean
  onToggleTalk?: () => void
  /** First run: Aria is still warming. Disabled WITH its reason, never dead. */
  talkDisabled?: boolean
}) {
  const isMobile = useBelowLg()
  const showWidgetTab = hasWebWidget(draft)

  // Width state — persisted so the drag survives reloads.
  const [width, setWidth] = React.useState(DEFAULT_W)
  React.useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(WIDTH_KEY))
      if (saved >= MIN_W && saved <= MAX_W) setWidth(saved)
    } catch { /* wireframe only */ }
  }, [])
  const commitWidth = (w: number) => {
    const clamped = Math.min(MAX_W, Math.max(MIN_W, Math.round(w)))
    setWidth(clamped)
    try { window.localStorage.setItem(WIDTH_KEY, String(clamped)) } catch { /* ignore */ }
  }

  // Drag the LEFT border: pointer capture keeps the drag alive outside the
  // strip; width = distance from the pointer to the viewport's right edge.
  const dragging = React.useRef(false)
  const onDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    commitWidth(window.innerWidth - e.clientX)
  }
  const onDragEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  // Simulations — generated from the draft's own context; the generation
  // counter keys TestsSection so run state RESETS per generation (old
  // verdicts must not dress up fresh, un-run results — review 2026-07-28).
  const [generated, setGenerated] = React.useState<{ case: EvalCase; result: EvalCaseResult }[]>([])
  const [generating, setGenerating] = React.useState(false)
  const [generation, setGeneration] = React.useState(0)
  // Figma 2974-91538: after a run, the Simulations tab's footer swaps from
  // SESSION STATISTICS to SIMULATION RESULTS (passed/failed counts).
  const [lastRun, setLastRun] = React.useState<{ passed: number; failed: number; total: number } | null>(null)
  const generate = () => {
    setGenerating(true)
    window.setTimeout(() => {
      const cases = generateContextualCases(draft)
      setGenerated(cases)
      setGeneration((g) => g + 1)
      setGenerating(false)
      toast(`${cases.length} scenarios generated from your context`, {
        description: "Built from the prompt, greeting, channel, and call behavior. Run them to score.",
      })
    }, 900)
  }

  const activeTab = tab === "widget" && !showWidgetTab ? "simulations" : tab

  const body = (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as TestPanelTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b border-border px-4 py-2.5">
          <TabsList id="wz-rail-tabs" className="h-8">
            <TabsTrigger value="simulations" className="text-xs">Simulations</TabsTrigger>
            <TabsTrigger value="agent" className="text-xs">Test Agent</TabsTrigger>
            {showWidgetTab && <TabsTrigger value="widget" className="text-xs">Widget</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="simulations" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="min-w-0 text-sm text-muted-foreground">
              {generated.length
                ? `${generated.length} contextual scenarios — regenerate after big prompt changes.`
                : "Autogenerate simulation from your prompt, channel, and call behavior."}
            </p>
            <Button size="sm" variant={generated.length ? "outline" : "default"} className="gap-1.5" disabled={generating} onClick={generate}>
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> {generating ? "Generating…" : generated.length ? "Regenerate" : "Autogenerate"}
            </Button>
          </div>
          <TestsSection
            key={generation}
            agentName={agentName}
            extra={generated}
            onRunSummary={(s) => { setLastRun(s); onRunSummary?.(s) }}
          />
        </TabsContent>

        <TabsContent value="agent" className="min-h-0 flex-1 overflow-y-auto p-4">
          <TalkTab
            agentName={agentName}
            greeting={draft.greeting.trim() || undefined}
            talking={!!talking}
            onToggleTalk={onToggleTalk}
            disabled={talkDisabled}
          />
        </TabsContent>

        {showWidgetTab && (
          <TabsContent value="widget" className="min-h-0 flex-1 overflow-y-auto p-4">
            <WidgetPreviewCard agentId={draft.agentId ?? "new"} greeting={widgetGreeting} />
          </TabsContent>
        )}
      </Tabs>

      {/* Footer is contextual (Figma): Simulations tab shows its results once
          a run exists; every other state shows the pipeline stats. */}
      {activeTab === "simulations" && lastRun
        ? <SimulationResults passed={lastRun.passed} failed={lastRun.failed} />
        : <SessionStatistics draft={draft} />}
    </div>
  )

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 text-left">
            <SheetTitle className="text-base">Test {agentName}</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    )
  }

  // Closed ≠ unmounted: TestsSection holds authored cases + run verdicts in
  // local state — toggling the panel must not silently discard that work
  // (review 2026-07-29; display:none creates no grid cell, so the 2-col
  // layout is unaffected).
  if (!open) {
    return <div className="hidden" aria-hidden>{body}</div>
  }

  return (
    <div
      className="relative hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:self-start"
      style={{ width }}
      role="complementary"
      aria-label={`Test ${agentName}`}
    >
      {/* The drag handle — the panel's left border, made grabbable. */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize test panel (double-click to reset)"
        title="Drag to resize · double-click to reset"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onDoubleClick={() => commitWidth(DEFAULT_W)}
        className={cn(
          "group absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize touch-none select-none",
          "hover:bg-primary/20 active:bg-primary/30",
        )}
      >
        <span className="absolute inset-y-0 left-0 w-px bg-border transition-colors group-hover:bg-primary/50" aria-hidden />
      </div>

      <div className="flex h-full max-h-[calc(100vh-6rem)] flex-col pl-1.5">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <p className="min-w-0 truncate text-sm font-semibold">Test {agentName}</p>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            onClick={() => onOpenChange(false)}
            aria-label="Close test panel"
          >
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </header>
        {body}
      </div>
    </div>
  )
}

// ─── Test agent — the orb + Talk (Figma's right-rail default state) ───────────

function TalkTab({
  agentName, greeting, talking, onToggleTalk, disabled,
}: {
  agentName: string
  greeting?: string
  talking: boolean
  onToggleTalk?: () => void
  disabled?: boolean
}) {
  const [state, setState] = React.useState<SimState>("listening")
  const turns = React.useMemo<EvalTurn[]>(
    () => (greeting ? [{ role: "agent" as const, text: greeting }, ...RAIL_TALK.slice(1)] : RAIL_TALK),
    [greeting],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-4 py-6">
        <AgentSphere size={132} active={talking} />
        <Button
          id="wz-rail-talk"
          size="sm"
          variant={talking ? "outline" : "default"}
          className="gap-1.5"
          disabled={disabled || !onToggleTalk}
          onClick={onToggleTalk}
        >
          {talking
            ? <><PhoneOff className="h-3.5 w-3.5" aria-hidden /> End test</>
            : <><Mic className="h-3.5 w-3.5" aria-hidden /> Talk to {agentName}</>}
        </Button>
        {disabled && (
          <p className="text-xs text-muted-foreground">
            {agentName} is still warming up — this unlocks in a moment.
          </p>
        )}
      </div>

      {talking ? (
        <div className="space-y-2.5">
          <SimulatedBanner />
          <AgentStateChips state={state} />
          <SimTranscript turns={turns} stream onState={setState} compact />
        </div>
      ) : (
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          A one-off call in full persona. For coverage across awkward callers — interruptions,
          jailbreaks, silence — run <span className="font-medium text-foreground">Simulations</span> instead.
        </p>
      )}
    </div>
  )
}

// ─── Session statistics — the pipeline, priced and timed ──────────────────────

function SessionStatistics({ draft }: { draft: AgentDraft }) {
  const est = stackEstimateFor(draft.stack)
  const lat = stackLatencyDetail(draft.stack)
  const mllm = draft.stack.pipeline === "mllm"
  // Figma 2861-52655 orders the pipeline rows LLM · ASR · TTS and reads out
  // avg e2e latency, avg LLM TTFT, and avg cost — nothing else.
  const ttftMs = Math.max(15, Math.round(lat.llmMs * 0.18))

  const slots = mllm
    ? [{ slot: "MLLM", name: `${draft.stack.llm.vendor} ${draft.stack.llm.model}`, ms: est.latencyMs }]
    : [
        { slot: "LLM", name: `${draft.stack.llm.vendor} ${draft.stack.llm.model}`, ms: lat.llmMs },
        { slot: "ASR", name: `${draft.stack.asr.vendor} ${draft.stack.asr.model}`, ms: lat.asrMs },
        { slot: "TTS", name: `${draft.stack.tts.vendor}`, ms: lat.ttsMs },
      ]

  return (
    <section
      id="wz-rail-stats"
      className="shrink-0 border-t border-border px-4 py-3"
      aria-label="Session statistics"
    >
      <h4 className="pb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Session statistics
      </h4>
      <dl className="space-y-1">
        {slots.map((s) => (
          <div key={s.slot} className="flex items-baseline gap-2">
            <dt className="w-9 shrink-0 font-mono text-xs uppercase text-muted-foreground">{s.slot}</dt>
            <dd className="min-w-0 flex-1 truncate text-sm">{s.name}</dd>
            <dd className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{s.ms}ms</dd>
          </div>
        ))}
      </dl>
      <dl className="mt-2.5 space-y-1 border-t border-border pt-2.5">
        <StatRow label="Avg. e2e latency" value={`${est.latencyMs} ms`} />
        {/* Gloss lives in the tooltip, not another line (copy discipline
            2026-08-10). */}
        <StatRow label="Avg. LLM TTFT" value={`${ttftMs} ms`} title="Time to first token — how fast the model starts responding" />
        <StatRow label="Avg. cost" value={`$${est.costPerMin.toFixed(2)} / min`} />
      </dl>
      <p className="pt-2 text-xs text-muted-foreground/70">Wireframe estimates.</p>
    </section>
  )
}

/** Figma 2974-91538 — the rail footer once a suite run completes. */
function SimulationResults({ passed, failed }: { passed: number; failed: number }) {
  const pad2 = (n: number) => String(n).padStart(2, "0")
  return (
    <section className="shrink-0 border-t border-border px-4 py-3" aria-label="Simulation results">
      <h4 className="pb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Simulation results
      </h4>
      <dl className="space-y-1">
        <div className="flex items-baseline gap-2">
          <dt className="min-w-0 flex-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">Passed</dt>
          <dd className="shrink-0 font-mono text-xs tabular-nums text-success">{pad2(passed)}</dd>
        </div>
        <div className="flex items-baseline gap-2">
          <dt className="min-w-0 flex-1 font-mono text-xs uppercase tracking-wide text-muted-foreground">Failed</dt>
          <dd className={cn("shrink-0 font-mono text-xs tabular-nums", failed > 0 ? "text-destructive" : "text-muted-foreground")}>{pad2(failed)}</dd>
        </div>
      </dl>
    </section>
  )
}

function StatRow({ label, value, title }: { label: string; value: string; title?: string }) {
  return (
    <div className="flex items-baseline gap-2" title={title}>
      <dt className={cn("min-w-0 flex-1 truncate font-mono text-xs uppercase tracking-wide text-muted-foreground", title && "cursor-help underline decoration-dotted underline-offset-2")}>
        {label}
      </dt>
      <dd className="shrink-0 font-mono text-xs tabular-nums">{value}</dd>
    </div>
  )
}
