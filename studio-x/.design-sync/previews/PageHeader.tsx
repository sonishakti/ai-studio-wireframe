// PageHeader — the sticky-style title row for a dashboard page: title +
// optional description and an actions slot on the right.
import { PageHeader, Button } from 'studio-x'
import { Plus, Download } from 'lucide-react'

export const Default = () => (
  <div className="w-[640px] border border-border rounded-lg overflow-hidden">
    <PageHeader
      title="Call History"
      description="Every call across all deployments, with per-call diagnosis."
      actions={
        <Button size="sm" variant="outline" className="gap-1.5">
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      }
    />
  </div>
)

export const Dense = () => (
  <div className="w-[640px] border border-border rounded-lg overflow-hidden">
    <PageHeader
      dense
      title="Agents"
      actions={
        <Button size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> New agent
        </Button>
      }
    />
  </div>
)

export const TitleOnly = () => (
  <div className="w-[640px] border border-border rounded-lg overflow-hidden">
    <PageHeader
      title="Diagnostics"
      description="Triage and route remediation for issues across live deployments."
    />
  </div>
)
