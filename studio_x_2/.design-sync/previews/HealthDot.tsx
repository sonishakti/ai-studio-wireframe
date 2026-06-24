// HealthDot — a small status dot for an agent/deployment/call's diagnosed health.
// Token-only colors: healthy = cyan (primary), degraded = amber (warning),
// unhealthy = red (destructive).
import { HealthDot } from 'studio-x'

export const States = () => (
  <div className="flex flex-col gap-3">
    <HealthDot status="healthy" label />
    <HealthDot status="degraded" label />
    <HealthDot status="unhealthy" label />
  </div>
)

export const DotOnly = () => (
  <div className="flex items-center gap-4">
    <HealthDot status="healthy" />
    <HealthDot status="degraded" />
    <HealthDot status="unhealthy" />
  </div>
)

export const InRow = () => (
  <div className="flex items-center justify-between w-72 rounded-lg border border-border px-3 py-2">
    <span className="text-sm font-medium">Aria — Inbound Support</span>
    <HealthDot status="degraded" label />
  </div>
)
