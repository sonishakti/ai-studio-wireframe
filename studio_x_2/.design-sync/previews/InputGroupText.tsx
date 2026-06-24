import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from 'studio-x'
import { Globe, Clock } from 'lucide-react'

// InputGroupText as a leading static prefix.
export const Prefix = () => (
  <InputGroup className="w-80">
    <InputGroupAddon>
      <Globe />
      <InputGroupText>https://</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput defaultValue="acme.agora.io" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>.dev</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
)

// InputGroupText as a trailing unit label.
export const UnitSuffix = () => (
  <InputGroup className="w-72">
    <InputGroupAddon>
      <Clock />
    </InputGroupAddon>
    <InputGroupInput type="number" defaultValue="30" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>sec timeout</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
)

// InputGroupText as an inline character/count hint inside a block addon.
export const CountHint = () => (
  <InputGroup className="w-96">
    <InputGroupAddon>
      <InputGroupText>Agent name</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput defaultValue="Aria" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>4 / 40</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
)
