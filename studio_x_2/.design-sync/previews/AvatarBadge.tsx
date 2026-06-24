import { Avatar, AvatarFallback, AvatarBadge } from 'studio-x'
import { Check } from 'lucide-react'

// Status dot — an empty AvatarBadge sits bottom-right, ring-matched to the surface.
export const OnlineStatus = () => (
  <div className="flex items-center gap-5">
    <Avatar>
      <AvatarFallback>AR</AvatarFallback>
      <AvatarBadge className="bg-emerald-500" />
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback>NV</AvatarFallback>
      <AvatarBadge className="bg-emerald-500" />
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback>SK</AvatarFallback>
      <AvatarBadge className="bg-muted-foreground" />
    </Avatar>
  </div>
)

// Badge auto-sizes to the parent Avatar (sm · default · lg).
export const AcrossSizes = () => (
  <div className="flex items-center gap-5">
    <Avatar size="sm">
      <AvatarFallback>AR</AvatarFallback>
      <AvatarBadge className="bg-emerald-500" />
    </Avatar>
    <Avatar>
      <AvatarFallback>NV</AvatarFallback>
      <AvatarBadge className="bg-emerald-500" />
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback>SK</AvatarFallback>
      <AvatarBadge className="bg-emerald-500" />
    </Avatar>
  </div>
)

// Badge with an icon — the primary cyan badge holds a tiny check at default/lg.
export const WithIcon = () => (
  <div className="flex items-center gap-5">
    <Avatar size="lg">
      <AvatarFallback>AR</AvatarFallback>
      <AvatarBadge>
        <Check />
      </AvatarBadge>
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback>MJ</AvatarFallback>
      <AvatarBadge>
        <Check />
      </AvatarBadge>
    </Avatar>
  </div>
)
