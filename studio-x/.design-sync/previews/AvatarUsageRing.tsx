import { AvatarUsageRing } from 'studio-x'

// The free-minutes ring wrapped around an account avatar, shown at three fill
// levels — healthy (cyan), warning (amber ≥80%), and over-cap (red ≥100%) —
// the way Claude rings its context meter. Ambient on every screen.
export const Levels = () => (
  <div className="flex items-center gap-8 p-4">
    <div className="flex flex-col items-center gap-2">
      <AvatarUsageRing pctUsed={42} size={40}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          JD
        </span>
      </AvatarUsageRing>
      <span className="text-xs text-muted-foreground">42% used</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <AvatarUsageRing pctUsed={86} size={40}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          AR
        </span>
      </AvatarUsageRing>
      <span className="text-xs text-muted-foreground">86% used</span>
    </div>
    <div className="flex flex-col items-center gap-2">
      <AvatarUsageRing pctUsed={100} size={40}>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
          MK
        </span>
      </AvatarUsageRing>
      <span className="text-xs text-muted-foreground">Cap reached</span>
    </div>
  </div>
)

// A larger, thicker ring — the same primitive scaled up for a profile-header
// placement, sitting half-used at the card-nudge threshold (150 / 300 min).
export const Large = () => (
  <div className="p-4">
    <AvatarUsageRing pctUsed={50} size={64} stroke={4}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        AR
      </span>
    </AvatarUsageRing>
  </div>
)
