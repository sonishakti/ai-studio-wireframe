"use client"

import * as React from "react"
import { ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import { StepAnalysis } from "@/components/wizard/step-analysis"
import type { AnalysisConfig } from "@/lib/wizard-draft"

/**
 * Call capture — transcription & data points, configured FROM MONITOR
 * (owner 2026-07-17: capture is monitoring content, not builder config; it
 * left the Go-live section). Persists to its own per-agent slot, NOT the
 * builder draft — writing the draft slot would greet the next builder visit
 * with a false "Resuming unsaved edits" toast for a purely-monitoring change.
 * Wireframe scope: one default agent (Aria).
 */
const CAPTURE_KEY = "sx:call_capture:agt_default"

export function CallCaptureSheet() {
  const [open, setOpen] = React.useState(false)
  const [cfg, setCfg] = React.useState<AnalysisConfig | undefined>(undefined)
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CAPTURE_KEY)
      if (raw) setCfg(JSON.parse(raw) as AnalysisConfig)
    } catch {
      /* ignore — wireframe */
    }
  }, [])
  const onChange = (next: AnalysisConfig) => {
    setCfg(next)
    try {
      window.localStorage.setItem(CAPTURE_KEY, JSON.stringify(next))
    } catch {
      /* ignore — wireframe */
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ListChecks className="h-3.5 w-3.5" aria-hidden /> Call capture
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle>Call capture</SheetTitle>
          <SheetDescription>Applies to Aria.</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <StepAnalysis value={cfg} onChange={onChange} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
