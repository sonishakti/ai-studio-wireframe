import { Button } from 'studio-x'
import { Plus, Phone, ArrowRight, Trash2 } from 'lucide-react'

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Deploy agent</Button>
    <Button variant="secondary">Save draft</Button>
    <Button variant="outline">Configure</Button>
    <Button variant="ghost">Cancel</Button>
    <Button variant="destructive">Delete</Button>
    <Button variant="link">Learn more</Button>
  </div>
)

export const Sizes = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm">Small</Button>
    <Button size="default">Default</Button>
    <Button size="lg">Large</Button>
  </div>
)

export const WithIcons = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>
      <Plus /> New campaign
    </Button>
    <Button variant="outline">
      <Phone /> Call now
    </Button>
    <Button variant="ghost">
      Continue <ArrowRight />
    </Button>
    <Button variant="destructive">
      <Trash2 /> Remove
    </Button>
  </div>
)

export const IconButtons = () => (
  <div className="flex items-center gap-3">
    <Button size="icon" aria-label="Add">
      <Plus />
    </Button>
    <Button size="icon-sm" variant="outline" aria-label="Call">
      <Phone />
    </Button>
    <Button size="icon-lg" variant="ghost" aria-label="Next">
      <ArrowRight />
    </Button>
  </div>
)

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button disabled>Deploy agent</Button>
    <Button variant="outline" disabled>
      Configure
    </Button>
  </div>
)
