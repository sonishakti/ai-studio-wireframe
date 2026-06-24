import { Toggle } from 'studio-x'
import { Mic, MicOff, Bold, Phone } from 'lucide-react'

export const Variants = () => (
  <div className="flex items-center gap-3">
    <Toggle>Default</Toggle>
    <Toggle variant="outline">Outline</Toggle>
  </div>
)

export const States = () => (
  <div className="flex items-center gap-3">
    <Toggle>Off</Toggle>
    <Toggle defaultPressed>On</Toggle>
  </div>
)

export const Sizes = () => (
  <div className="flex items-center gap-3">
    <Toggle size="sm" variant="outline" defaultPressed>
      Small
    </Toggle>
    <Toggle size="default" variant="outline" defaultPressed>
      Default
    </Toggle>
    <Toggle size="lg" variant="outline" defaultPressed>
      Large
    </Toggle>
  </div>
)

export const WithIcon = () => (
  <div className="flex items-center gap-3">
    <Toggle variant="outline" aria-label="Mute" defaultPressed>
      <MicOff />
    </Toggle>
    <Toggle variant="outline" aria-label="Unmute">
      <Mic />
    </Toggle>
    <Toggle variant="outline" defaultPressed>
      <Bold /> Bold
    </Toggle>
    <Toggle variant="outline">
      <Phone /> Call
    </Toggle>
  </div>
)

export const Disabled = () => (
  <div className="flex items-center gap-3">
    <Toggle variant="outline" disabled>
      Off
    </Toggle>
    <Toggle variant="outline" disabled defaultPressed>
      On
    </Toggle>
  </div>
)
