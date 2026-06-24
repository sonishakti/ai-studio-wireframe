// DropdownMenuLabel can't render alone — shown as the section header of an open menu.
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  Button,
} from 'studio-x'
import { PhoneCall, MessageSquare, Globe } from 'lucide-react'

export const Labeled = () => (
  <div className="h-80">
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Add channel</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-56">
        <DropdownMenuLabel>Live channels</DropdownMenuLabel>
        <DropdownMenuItem>
          <PhoneCall />
          Inbound phone number
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Globe />
          Web widget
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Messaging</DropdownMenuLabel>
        <DropdownMenuItem>
          <MessageSquare />
          WhatsApp
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)

// Inset label aligns with items that carry leading icons.
export const Inset = () => (
  <div className="h-72">
    <DropdownMenu open>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Region</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="w-56">
        <DropdownMenuLabel inset>Deploy region</DropdownMenuLabel>
        <DropdownMenuItem inset>US East (Virginia)</DropdownMenuItem>
        <DropdownMenuItem inset>EU West (Ireland)</DropdownMenuItem>
        <DropdownMenuItem inset>Asia Pacific (Singapore)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
)
