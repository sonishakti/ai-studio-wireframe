import { Checkbox, Label } from 'studio-x'

export const States = () => (
  <div className="flex items-center gap-6">
    <Checkbox />
    <Checkbox defaultChecked />
  </div>
)

export const WithLabel = () => (
  <Label className="flex items-center gap-2">
    <Checkbox defaultChecked />
    Enable call recording
  </Label>
)

export const Group = () => (
  <div className="grid gap-3">
    <Label className="flex items-center gap-2">
      <Checkbox defaultChecked />
      Transcribe calls
    </Label>
    <Label className="flex items-center gap-2">
      <Checkbox defaultChecked />
      Run sentiment analysis
    </Label>
    <Label className="flex items-center gap-2">
      <Checkbox />
      Send summary to CRM
    </Label>
  </div>
)

export const Disabled = () => (
  <div className="flex items-center gap-6">
    <Label className="flex items-center gap-2">
      <Checkbox disabled />
      Off (locked)
    </Label>
    <Label className="flex items-center gap-2">
      <Checkbox disabled defaultChecked />
      On (locked)
    </Label>
  </div>
)
