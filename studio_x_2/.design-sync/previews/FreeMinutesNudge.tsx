import { FreeMinutesNudge } from 'studio-x'

// The half-tier card nudge. With the mock PLAN_USAGE (150 of 300 free minutes
// used, no card on file) it renders the primary state: "You've used your 150
// free minutes. Add a card to unlock 150 more — free." A cyan gift card with a
// progress bar at the 150/150 threshold and an Add-a-card CTA that opens the
// payment sheet.
export const Default = () => (
  <div className="w-[640px]">
    <FreeMinutesNudge />
  </div>
)
