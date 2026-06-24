import { Label, Input, Checkbox, Switch } from 'studio-x'

export const WithInput = () => (
  <div className="grid gap-2 w-72">
    <Label htmlFor="webhook">Webhook URL</Label>
    <Input id="webhook" placeholder="https://acme.io/agora/events" />
  </div>
)

export const WithCheckbox = () => (
  <Label className="flex items-center gap-2">
    <Checkbox defaultChecked />
    Record this campaign&apos;s calls
  </Label>
)

export const WithSwitch = () => (
  <div className="flex items-center justify-between w-72">
    <Label htmlFor="live">Deployment is live</Label>
    <Switch id="live" defaultChecked />
  </div>
)

export const Disabled = () => (
  <div className="grid gap-2 w-72">
    <Label htmlFor="locked" className="peer-disabled:opacity-50">
      Region (locked)
    </Label>
    <Input id="locked" className="peer" disabled defaultValue="us-east" />
  </div>
)
