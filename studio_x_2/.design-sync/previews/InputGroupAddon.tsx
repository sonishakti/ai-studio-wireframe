import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from 'studio-x'
import { Search, Globe } from 'lucide-react'

// InputGroupAddon featured in leading + trailing positions.
export const LeadingAndTrailing = () => (
  <InputGroup className="w-80">
    <InputGroupAddon>
      <Search />
    </InputGroupAddon>
    <InputGroupInput placeholder="Search call history…" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>342 calls</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
)

// InputGroupAddon with align="inline-start" holding a protocol prefix.
export const InlineStart = () => (
  <InputGroup className="w-80">
    <InputGroupAddon>
      <Globe />
      <InputGroupText>https://</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput defaultValue="agent.agora.io/webhook" />
  </InputGroup>
)

// InputGroupAddon with align="inline-end" holding a unit suffix.
export const InlineEnd = () => (
  <InputGroup className="w-72">
    <InputGroupInput defaultValue="150" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>minutes</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
)
