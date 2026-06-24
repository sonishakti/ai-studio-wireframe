import { Avatar, AvatarImage, AvatarFallback } from 'studio-x'

// A tiny inline data-URI so the image renders offline (cyan tile with "AR").
const CYAN_TILE =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%2306b6d4'/><text x='32' y='42' font-family='sans-serif' font-size='26' fill='white' text-anchor='middle'>AR</text></svg>"

// AvatarImage loads a real picture; the fallback initials show while/if it fails.
export const Loaded = () => (
  <div className="flex items-center gap-4">
    <Avatar size="lg">
      <AvatarImage src={CYAN_TILE} alt="Aria Reyes" />
      <AvatarFallback>AR</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarImage src={CYAN_TILE} alt="Aria Reyes" />
      <AvatarFallback>AR</AvatarFallback>
    </Avatar>
  </div>
)

// When the src can't resolve, AvatarFallback takes over — initials in the muted tile.
export const FallbackOnError = () => (
  <div className="flex items-center gap-4">
    <Avatar size="lg">
      <AvatarImage src="" alt="Noah Vega" />
      <AvatarFallback>NV</AvatarFallback>
    </Avatar>
    <Avatar size="lg">
      <AvatarImage src="" alt="Sasha Kapoor" />
      <AvatarFallback>SK</AvatarFallback>
    </Avatar>
  </div>
)
