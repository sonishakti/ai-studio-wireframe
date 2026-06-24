import { Badge } from 'studio-x'
import { Check, TriangleAlert, Circle } from 'lucide-react'

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge>Live</Badge>
    <Badge variant="secondary">Draft</Badge>
    <Badge variant="destructive">Failed</Badge>
    <Badge variant="warning">Degraded</Badge>
    <Badge variant="outline">Inactive</Badge>
    <Badge variant="ghost">Muted</Badge>
  </div>
)

export const WithIcons = () => (
  <div className="flex flex-wrap items-center gap-2">
    <Badge>
      <Check /> Resolved
    </Badge>
    <Badge variant="warning">
      <TriangleAlert /> Needs attention
    </Badge>
    <Badge variant="secondary">
      <Circle /> Queued
    </Badge>
  </div>
)
