import { Avatar, AvatarFallback } from 'studio-x'

// Default fallback — initials in the muted tile, the safe offline default.
export const Initials = () => (
  <div className="flex items-center gap-3">
    <Avatar>
      <AvatarFallback>AR</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>NV</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>MJ</AvatarFallback>
    </Avatar>
  </div>
)

// Colored fallback tiles — override the bg/text via className for per-user accents.
export const Colored = () => (
  <div className="flex items-center gap-3">
    <Avatar size="lg">
      <AvatarFallback className="bg-primary text-primary-foreground">AR</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback className="bg-emerald-500 text-white">NV</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback className="bg-violet-500 text-white">SK</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarFallback className="bg-amber-500 text-white">MJ</AvatarFallback>
    </Avatar>
  </div>
)

// Fallback scales with the Avatar size — text steps down to xs on sm.
export const AcrossSizes = () => (
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
