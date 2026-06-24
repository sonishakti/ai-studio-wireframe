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

export const Open = () => (
  <div className="h-80">
    <Select defaultOpen defaultValue="aria">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select an agent" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectLabel>Voice agents</SelectLabel>
          <SelectItem value="aria">Aria — Inbound Support</SelectItem>
          <SelectItem value="nova">Nova — Outbound Sales</SelectItem>
          <SelectItem value="echo">Echo — After-hours</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Chat agents</SelectLabel>
          <SelectItem value="sage">Sage — Web widget</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  </div>
)

export const Closed = () => (
  <Select defaultValue="aria">
    <SelectTrigger className="w-56">
      <SelectValue placeholder="Select an agent" />
    </SelectTrigger>
    <SelectContent position="popper">
      <SelectItem value="aria">Aria — Inbound Support</SelectItem>
      <SelectItem value="nova">Nova — Outbound Sales</SelectItem>
    </SelectContent>
  </Select>
)
