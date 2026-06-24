// cmdk renders inline (no portal) — a command palette with groups, separator, shortcuts.
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from 'studio-x'
import { PhoneCall, MessageSquare, Plus, Rocket, Settings } from 'lucide-react'

export const Palette = () => (
  <div className="h-96">
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Search agents and actions…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Agents">
          <CommandItem>
            <PhoneCall />
            Aria — Inbound Support
          </CommandItem>
          <CommandItem>
            <PhoneCall />
            Nova — Outbound Sales
          </CommandItem>
          <CommandItem>
            <MessageSquare />
            Sage — Web widget
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem>
            <Plus />
            New agent
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Rocket />
            Deploy a campaign
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <Settings />
            Project settings
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </div>
)

// Empty state — query with no matches.
export const Empty = () => (
  <div className="h-72">
    <Command className="rounded-lg border shadow-md max-w-md">
      <CommandInput placeholder="Search…" value="zzzzz" />
      <CommandList>
        <CommandEmpty>No agents or actions match “zzzzz”.</CommandEmpty>
        <CommandGroup heading="Agents">
          <CommandItem>Aria — Inbound Support</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  </div>
)
