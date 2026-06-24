import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  Button,
} from 'studio-x'
import {
  Pencil,
  PhoneCall,
  Copy,
  Power,
  Trash2,
} from 'lucide-react'

// Full action menu — label, items, shortcut, separator, destructive item.
export const Actions = () => (
  <div className="h-80">
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Agent actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-56">
        <DropdownMenuLabel>Aria — Inbound Support</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <Pencil />
            Edit prompt
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <PhoneCall />
            Test call
            <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Copy />
            Duplicate
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Delete deployment
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)

// Selectable state — checkbox + radio items inside one open menu.
export const Selectable = () => (
  <div className="h-80">
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Call filters</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-56">
        <DropdownMenuLabel>Show channels</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked>Inbound voice</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Outbound batch</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem>Web widget</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value="recent">
          <DropdownMenuRadioItem value="recent">Most recent</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="duration">Longest duration</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="cost">Highest cost</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)

// Status menu — disabled item + destructive stop.
export const Status = () => (
  <div className="h-72">
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Deployment</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-56">
        <DropdownMenuLabel>Live · carrying traffic</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Power />
          Pause traffic
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Copy />
          Roll back (no prior version)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 />
          Take offline
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
