import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from 'studio-x'
import { Sparkles, FileText } from 'lucide-react'

// InputGroupTextarea with a block-end toolbar addon.
export const SystemPrompt = () => (
  <InputGroup className="w-96">
    <InputGroupTextarea
      rows={4}
      defaultValue="You are Aria, a warm inbound support agent for Agora. Greet the caller by name, verify their account, and resolve billing questions before offering to transfer."
    />
    <InputGroupAddon align="block-end" className="border-t justify-between">
      <InputGroupText>
        <FileText />
        System prompt
      </InputGroupText>
      <InputGroupButton variant="default" size="xs">
        <Sparkles />
        Improve
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
)

// InputGroupTextarea with a block-start label addon.
export const LabeledNote = () => (
  <InputGroup className="w-96">
    <InputGroupAddon align="block-start" className="border-b">
      <InputGroupText>Call notes · Session #4821</InputGroupText>
    </InputGroupAddon>
    <InputGroupTextarea
      rows={3}
      placeholder="Caller asked about overage charges on the Q3 invoice…"
    />
  </InputGroup>
)
