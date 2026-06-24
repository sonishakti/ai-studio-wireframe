import { Input, Label } from 'studio-x'

export const Default = () => (
  <div className="grid gap-2 w-72">
    <Label htmlFor="agent-name">Agent name</Label>
    <Input id="agent-name" defaultValue="Aria — Inbound Support" />
  </div>
)

export const Placeholder = () => (
  <div className="grid gap-2 w-72">
    <Label htmlFor="phone">Phone number</Label>
    <Input id="phone" type="tel" placeholder="+1 (555) 010-0000" />
  </div>
)

export const Types = () => (
  <div className="grid gap-4 w-72">
    <div className="grid gap-2">
      <Label htmlFor="email">Notification email</Label>
      <Input id="email" type="email" placeholder="ops@acme.io" />
    </div>
    <div className="grid gap-2">
      <Label htmlFor="apikey">API key</Label>
      <Input id="apikey" type="password" defaultValue="sk-live-9f3a7c21" />
    </div>
  </div>
)

export const Invalid = () => (
  <div className="grid gap-2 w-72">
    <Label htmlFor="minutes">Daily minute cap</Label>
    <Input id="minutes" aria-invalid defaultValue="-150" />
    <p className="text-xs text-destructive">Enter a value of 150 or more.</p>
  </div>
)

export const Disabled = () => (
  <div className="grid gap-2 w-72">
    <Label htmlFor="project-id">Project ID</Label>
    <Input id="project-id" disabled defaultValue="proj_8a21f0c4" />
  </div>
)
