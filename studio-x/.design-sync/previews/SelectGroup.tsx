// Shown in context — SelectGroup + SelectLabel partition the open listbox.
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from 'studio-x'

export const Grouped = () => (
  <div className="h-80">
    <Select defaultOpen defaultValue="us">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Americas</SelectLabel>
          <SelectItem value="us">US East (Virginia)</SelectItem>
          <SelectItem value="br">South America (São Paulo)</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Europe</SelectLabel>
          <SelectItem value="eu">EU West (Ireland)</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
)
