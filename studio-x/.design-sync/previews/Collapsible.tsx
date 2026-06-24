import { Collapsible, CollapsibleTrigger, CollapsibleContent } from 'studio-x'
import { ChevronDown } from 'lucide-react'

export function LatencyBreakdown() {
  return (
    <Collapsible defaultOpen className="w-72 rounded-md border p-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
        <span>Latency breakdown — 410ms</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Speech-to-text</span>
          <span>120ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span>LLM inference</span>
          <span>210ms</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Text-to-speech</span>
          <span>80ms</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export function AdvancedConfig() {
  return (
    <Collapsible defaultOpen className="w-72 rounded-md border p-3">
      <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium">
        <span>Advanced deployment settings</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center justify-between">
          <span>Interruption sensitivity</span>
          <span>Medium</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Max call duration</span>
          <span>15 min</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Fallback voice</span>
          <span>Nova</span>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
