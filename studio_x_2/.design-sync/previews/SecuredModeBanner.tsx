import { SecuredModeBanner, SecuredModePill } from 'studio-x'

// Test mode — the high-priority P0 banner pushing the user to enable the App
// Certificate before taking production traffic.
export const TestMode = () => (
  <div className="max-w-2xl">
    <SecuredModeBanner enabled={false} />
  </div>
)

// Secured mode active — the slim green confirmation row (tokens required).
export const Active = () => (
  <div className="max-w-2xl">
    <SecuredModeBanner enabled />
  </div>
)

// The inline pill — both states side by side, for App ID rows / deploy flows.
export const Pill = () => (
  <div className="flex flex-wrap items-center gap-3">
    <SecuredModePill enabled={false} />
    <SecuredModePill enabled />
  </div>
)
