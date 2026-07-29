"use client"

import * as React from "react"
import { X, Sparkles, Braces } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { TestsSection } from "@/components/eval-tests"
import { InfoHint } from "@/components/wizard/info-hint"
import { WidgetPreviewCard } from "@/components/widget-studio"
import { generateContextualCases } from "@/components/wizard/test-section"
import { hasWebWidget, type AgentDraft } from "@/lib/wizard-draft"
import type { EvalCase, EvalCaseResult } from "@/lib/campaign-data"

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
 * TestPanel — the SIMULATIONS surface (v6, owner 2026-07-29: "the RHS Test
 * panel should have simulations, NOT the agent call"): the header Test button
 * toggles this DOCKED panel holding the auto-generated contextual scenario
 * suite; the live talk test lives in the TEST section of the main column.
 * Docked, not an overlay — it takes a real grid column so the main column
 * flexes beside it. RESIZABLE by dragging its left border (pointer-capture
 * drag, clamped, double-click resets, width persisted). Below lg it falls
 * back to a full-width Sheet. A Widget tab previews the web widget when that
 * surface is enabled.
 */

const WIDTH_KEY = "sx:test_panel_w"
const MIN_W = 360
const MAX_W = 720
const DEFAULT_W = 460

export type TestPanelTab = "simulations" | "widget"

export function TestPanel({
  open,
  onOpenChange,
  tab,
  onTabChange,
  draft,
  agentName,
  widgetGreeting,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  tab: TestPanelTab
  onTabChange: (t: TestPanelTab) => void
  draft: AgentDraft
  agentName: string
  widgetGreeting?: string
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
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TestPanelTab)} className="flex min-h-0 flex-1 flex-col gap-0">
      <div className="shrink-0 border-b border-border px-4 py-2.5">
        <TabsList className="h-8">
          <TabsTrigger value="simulations" className="text-xs">Simulations</TabsTrigger>
          {showWidgetTab && <TabsTrigger value="widget" className="text-xs">Widget</TabsTrigger>}
        </TabsList>
      </div>
      <TabsContent value="simulations" className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3.5 py-2.5">
          <p className="min-w-0 text-sm text-muted-foreground">
            {generated.length
              ? `${generated.length} contextual scenarios — regenerate after big prompt changes.`
              : "Generate ~12 scenarios from your prompt, channel, and call behavior."}
          </p>
          <Button size="sm" variant={generated.length ? "outline" : "default"} className="gap-1.5" disabled={generating} onClick={generate}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> {generating ? "Generating…" : generated.length ? "Regenerate" : "Auto-generate"}
          </Button>
        </div>
        <TestsSection
          key={generation}
          agentName={agentName}
          extra={generated}
          headerNote={
            <span className="inline-flex items-center gap-1.5">
              <Braces className="h-3.5 w-3.5" aria-hidden />
              Scored by a judge model returning structured output — {"{verdict, score, reason}"} per assertion.
              <InfoHint label="How failures point at fixes">
                When a scenario fails because of a real config gap (transfer off, silence
                hang-up off), the judge&apos;s reason names the setting and where to change it.
              </InfoHint>
            </span>
          }
        />
      </TabsContent>
      {showWidgetTab && (
        <TabsContent value="widget" className="min-h-0 flex-1 overflow-y-auto p-4">
          <WidgetPreviewCard agentId={draft.agentId ?? "new"} greeting={widgetGreeting} />
        </TabsContent>
      )}
    </Tabs>
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
      className="relative hidden lg:block lg:sticky lg:top-12 lg:max-h-[calc(100vh-3rem)] lg:self-start"
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

      <div className="flex h-full max-h-[calc(100vh-3rem)] flex-col pl-1.5">
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
