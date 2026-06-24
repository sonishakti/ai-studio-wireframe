import { Switch, Label } from 'studio-x'

export const States = () => (
  <div className="flex items-center gap-6">
    <Switch />
    <Switch defaultChecked />
  </div>
)

export const Sizes = () => (
  <div className="flex items-center gap-6">
    <Switch size="sm" defaultChecked />
    <Switch size="default" defaultChecked />
  </div>
)

export const WithLabel = () => (
  <div className="flex items-center justify-between w-72">
    <Label htmlFor="after-hours">After-hours routing</Label>
    <Switch id="after-hours" defaultChecked />
  </div>
)

export const Group = () => (
  <div className="grid gap-3 w-72">
    <div className="flex items-center justify-between">
      <Label htmlFor="voicemail">Voicemail drop</Label>
      <Switch id="voicemail" defaultChecked />
    </div>
    <div className="flex items-center justify-between">
      <Label htmlFor="callback">Auto-callback</Label>
      <Switch id="callback" />
    </div>
  </div>
)

export const Disabled = () => (
  <div className="flex items-center gap-6">
    <Switch disabled />
    <Switch disabled defaultChecked />
  </div>
)
