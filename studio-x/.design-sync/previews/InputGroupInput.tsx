import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupText,
} from 'studio-x'
import { Search, Hash } from 'lucide-react'

// InputGroupInput as the control in a search group.
export const Search_ = () => (
  <InputGroup className="w-80">
    <InputGroupAddon>
      <Search />
    </InputGroupAddon>
    <InputGroupInput placeholder="Search sessions by caller ID…" />
  </InputGroup>
)

// InputGroupInput holding a value alongside a leading icon.
export const Filled = () => (
  <InputGroup className="w-80">
    <InputGroupAddon>
      <Hash />
    </InputGroupAddon>
    <InputGroupInput defaultValue="campaign-q3-renewals" />
  </InputGroup>
)

// InputGroupInput between a currency prefix and a unit suffix.
export const Numeric = () => (
  <InputGroup className="w-72">
    <InputGroupAddon>
      <InputGroupText>$</InputGroupText>
    </InputGroupAddon>
    <InputGroupInput type="number" defaultValue="50" />
    <InputGroupAddon align="inline-end">
      <InputGroupText>USD / mo</InputGroupText>
    </InputGroupAddon>
  </InputGroup>
)
