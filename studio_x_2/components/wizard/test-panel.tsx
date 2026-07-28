"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { AgentIdentityCard } from "@/components/agent-identity-card"
import type { StackLatencyBreakdown } from "@/lib/campaign-data"
import { TestsSection } from "@/components/eval-tests"
import { WidgetPreviewCard } from "@/components/widget-studio"

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
 * TestPanel — the agent's test surface (v4 IA, 2026-07-28): the persistent
 * right preview column is GONE; the header Test button toggles this DOCKED
 * panel instead. Docked, not an overlay — it takes a real grid column so the
 * main column flexes beside it and nothing renders underneath. RESIZABLE by
 * dragging its left border (pointer-capture drag, clamped, double-click
 * resets, width persisted). Below lg it falls back to a full-width Sheet.
 *
 * Tabs: Talk (identity card + simulated live test) · Scenarios (the
 * run-simulation eval suite — the reason the drag-wider exists) · Widget
 * (web-widget preview, web channel only).
 */

const WIDTH_KEY = "sx:test_panel_w"
const MIN_W = 360
const MAX_W = 720
const DEFAULT_W = 420

export type TestPanelTab = "talk" | "scenarios" | "widget"

export interface TestPanelIdentity {
  name: string
  namePlaceholder: string
  onNameChange: (v: string) => void
  agentId?: string
  status: string
  subtitle: string
  stack: string
  language: string
  costPerMin?: number
  latencyMs?: number
  latencyBreakdown?: StackLatencyBreakdown
  channel?: { label: string; onClick: () => void }
  talking: boolean
  onToggleTalk: () => void
  talkLabel: string
}

export function TestPanel({
  open,
  onOpenChange,
  tab,
  onTabChange,
  identity,
  agentName,
  showWidgetTab,
  widgetAgentId,
  widgetGreeting,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  tab: TestPanelTab
  onTabChange: (t: TestPanelTab) => void
  identity: TestPanelIdentity
  agentName: string
  showWidgetTab?: boolean
  widgetAgentId?: string
  widgetGreeting?: string
}) {
  const isMobile = useBelowLg()

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
  // 6px strip; width = distance from the pointer to the viewport's right edge.
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

  const activeTab = tab === "widget" && !showWidgetTab ? "talk" : tab

  const body = (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as TestPanelTab)} className="flex min-h-0 flex-1 flex-col gap-0">
      <div className="shrink-0 border-b border-border px-4 py-2.5">
        <TabsList className="h-8">
          <TabsTrigger value="talk" className="text-xs">Talk</TabsTrigger>
          <TabsTrigger value="scenarios" className="text-xs">Scenarios</TabsTrigger>
          {showWidgetTab && <TabsTrigger value="widget" className="text-xs">Widget</TabsTrigger>}
        </TabsList>
      </div>
      <TabsContent value="talk" className="min-h-0 flex-1 overflow-y-auto p-4">
        {/* Say what the test IS — a silent orb read as broken (user-test
            2026-07-09). */}
        <p className="pb-3 text-xs text-muted-foreground">
          Simulated preview — no live audio in this wireframe.
        </p>
        <AgentIdentityCard
          name={identity.name}
          namePlaceholder={identity.namePlaceholder}
          onNameChange={identity.onNameChange}
          agentId={identity.agentId}
          status={identity.status}
          subtitle={identity.subtitle}
          stack={identity.stack}
          language={identity.language}
          costPerMin={identity.costPerMin}
          latencyMs={identity.latencyMs}
          latencyBreakdown={identity.latencyBreakdown}
          channel={identity.channel}
          talking={identity.talking}
          onToggleTalk={identity.onToggleTalk}
          talkLabel={identity.talkLabel}
          endLabel="End test"
          className="border-0 p-2 lg:static"
        />
      </TabsContent>
      <TabsContent value="scenarios" className="min-h-0 flex-1 overflow-y-auto p-4">
        <p className="pb-3 text-xs text-muted-foreground">
          Simulated callers that prove {agentName} behaves — run them before real traffic.
        </p>
        <TestsSection agentName={agentName} />
      </TabsContent>
      {showWidgetTab && (
        <TabsContent value="widget" className="min-h-0 flex-1 overflow-y-auto p-4">
          <WidgetPreviewCard agentId={widgetAgentId ?? "new"} greeting={widgetGreeting} />
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

  if (!open) return null

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
