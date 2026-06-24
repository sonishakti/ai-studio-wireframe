import { Textarea, Label } from 'studio-x'

export const Default = () => (
  <div className="grid gap-2 w-96">
    <Label htmlFor="prompt">System prompt</Label>
    <Textarea
      id="prompt"
      rows={4}
      defaultValue="You are Aria, a warm inbound support agent for Acme. Greet the caller, confirm their account, and resolve billing questions in under three minutes."
    />
  </div>
)

export const Placeholder = () => (
  <div className="grid gap-2 w-96">
    <Label htmlFor="greeting">Opening greeting</Label>
    <Textarea
      id="greeting"
      placeholder="Hi, thanks for calling Acme — how can I help you today?"
    />
  </div>
)

export const Invalid = () => (
  <div className="grid gap-2 w-96">
    <Label htmlFor="instructions">Call instructions</Label>
    <Textarea id="instructions" aria-invalid rows={3} defaultValue="" />
    <p className="text-xs text-destructive">Instructions are required before deploy.</p>
  </div>
)

export const Disabled = () => (
  <div className="grid gap-2 w-96">
    <Label htmlFor="transcript">Last transcript</Label>
    <Textarea
      id="transcript"
      disabled
      rows={3}
      defaultValue={"Caller: I'd like to update my plan.\nAria: Of course — let me pull up your account."}
    />
  </div>
)
