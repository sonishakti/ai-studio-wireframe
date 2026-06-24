import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from 'studio-x'
import { Search, Phone, Copy, Sparkles } from 'lucide-react'

export const SearchInput = () => (
  <InputGroup className="w-80">
    <InputGroupAddon>
      <Search />
    </InputGroupAddon>
    <InputGroupInput placeholder="Search agents, numbers, calls…" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>⌘K</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
)

export const WithTrailingButton = () => (
  <InputGroup className="w-80">
    <InputGroupAddon>
      <Phone />
    </InputGroupAddon>
    <InputGroupInput defaultValue="+1 (415) 555-0142" />
    <InputGroupAddon align="inline-end">
      <InputGroupButton>
        <Copy />
        Copy
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)

export const ApiKey = () => (
  <InputGroup className="w-96">
    <InputGroupAddon>
      <InputGroupText>sk-live</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput defaultValue="a3f9c2e1-7b4d-48a0-9e21-cd83f1" readOnly />
    <InputGroupAddon align="inline-end">
      <InputGroupButton variant="default" size="xs">
        Reveal
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)

export const TextareaGroup = () => (
  <InputGroup className="w-96">
    <InputGroupTextarea
      rows={4}
      defaultValue="You are Aria, a friendly inbound support agent for Agora. Greet callers, confirm their account, and resolve billing questions."
    />
    <InputGroupAddon align="block-end" className="border-t justify-between">
      <InputGroupText>System prompt · 132 chars</InputGroupText>
      <InputGroupButton variant="default" size="xs">
        <Sparkles />
        Improve
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)
