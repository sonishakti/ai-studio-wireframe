import { Avatar, AvatarFallback } from 'studio-x'

// The three built-in sizes — sm (size-6) · default (size-8) · lg (size-10).
export const Sizes = () => (
  <div className="flex items-center gap-4">
    <Avatar size="sm">
      <AvatarFallback>AR</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>NV</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
  </div>
)

// A row of teammates — each Avatar carries initials in the muted fallback.
export const Team = () => (
  <div className="flex items-center gap-3">
    <Avatar>
      <AvatarFallback>MJ</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>TP</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>EL</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>DK</AvatarFallback>
    </Avatar>
  </div>
)
