import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from 'studio-x'
import { Copy, Check, X } from 'lucide-react'

// InputGroupButton as a trailing text action.
export const TextButton = () => (
  <InputGroup className="w-96">
    <InputGroupInput defaultValue="agora_a3f9c2e1-7b4d-48a0-9e21" readOnly />
    <InputGroupAddon align="inline-end">
      <InputGroupButton>
        <Copy />
        Copy key
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)

// InputGroupButton with the default (filled) variant.
export const PrimaryButton = () => (
  <InputGroup className="w-80">
    <InputGroupInput placeholder="Enter phone number to verify" />
    <InputGroupAddon align="inline-end">
      <InputGroupButton variant="default">Verify</InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)

// InputGroupButton as icon-only actions (size="icon-xs").
export const IconButtons = () => (
  <InputGroup className="w-80">
    <InputGroupInput defaultValue="Nova — Outbound Sales" />
    <InputGroupAddon align="inline-end">
      <InputGroupButton size="icon-xs" aria-label="Confirm">
        <Check />
      </InputGroupButton>
      <InputGroupButton size="icon-xs" aria-label="Clear">
        <X />
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)
