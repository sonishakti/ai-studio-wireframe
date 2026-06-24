import { Separator } from 'studio-x'

export function StackedSections() {
  return (
    <div className="flex w-72 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Aria — Inbound Support</span>
        <span className="text-sm text-muted-foreground">Live · 1,204 minutes this week</span>
      </div>
      <Separator />
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Nova — Renewal Outreach</span>
        <span className="text-sm text-muted-foreground">Paused · Batch Calls</span>
      </div>
    </div>
  )
}

export function InlineMetrics() {
  return (
    <div className="flex h-10 items-center gap-4 text-sm">
      <div className="flex flex-col">
        <span className="font-medium">98.2%</span>
        <span className="text-muted-foreground">Uptime</span>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col">
        <span className="font-medium">410ms</span>
        <span className="text-muted-foreground">Latency</span>
      </div>
      <Separator orientation="vertical" />
      <div className="flex flex-col">
        <span className="font-medium">2,397</span>
        <span className="text-muted-foreground">Calls</span>
      </div>
    </div>
  )
}
