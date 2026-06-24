import { FreeMinutesBlock } from 'studio-x'

// The detailed free-minutes meter that lives inside the account menu. Reads
// the single source of truth (PLAN_USAGE → freeMinutesStats): plan badge, a
// progress bar of minutes used, and "remaining / included" minutes. Shown in
// a menu-width container the way it appears in the dropdown.
export const Default = () => (
  <div className="w-72 rounded-lg border border-border bg-card p-1.5">
    <FreeMinutesBlock />
  </div>
)
