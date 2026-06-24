import { ActivationChecklist } from 'studio-x'

// The new-user onboarding checklist: signup → first deployed agent. Header with
// a sparkle badge, "0 / 5" progress, and an expanded list of the five steps
// (Pick a starting point · Configure · Test in the playground · Publish · Choose
// where it answers) with the first marked "Up next" and a cyan CTA. Reads step
// completion from localStorage, so in a fresh capture it renders the zero-state.
export const Default = () => (
  <div className="w-[720px]">
    <ActivationChecklist />
  </div>
)
