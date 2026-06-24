// SeverityBadge — severity pill for a diagnosed issue, mapped onto the
// design-token badge variants (critical = destructive, warning, info = secondary).
import { SeverityBadge } from 'studio-x'

export const All = () => (
  <div className="flex items-center gap-2">
    <SeverityBadge severity="critical" />
    <SeverityBadge severity="warning" />
    <SeverityBadge severity="info" />
  </div>
)

export const InIssueRow = () => (
  <div className="flex flex-col gap-2 w-80">
    <div className="flex items-center gap-2 rounded-lg border border-border p-2">
      <SeverityBadge severity="critical" />
      <span className="text-sm font-medium truncate">LLM latency exceeded 3s on turn 4</span>
    </div>
    <div className="flex items-center gap-2 rounded-lg border border-border p-2">
      <SeverityBadge severity="warning" />
      <span className="text-sm font-medium truncate">Barge-in not honored mid-response</span>
    </div>
  </div>
)
