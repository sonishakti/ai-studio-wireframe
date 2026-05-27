import { DeploySecuredModeGate } from "./secured-mode-gate-wrapper"

/**
 * Deploy layout — wraps every /deploy/* channel page with a Secured Mode
 * gate. If Secured mode is off, users see the warning before they can complete
 * setup — they CAN still configure, but the gate makes clear that traffic is
 * limited until they enable App Certificate.
 *
 * The gate itself is a client component (reads project state); this layout
 * is a Server Component so it can wrap any nested page.
 */
export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DeploySecuredModeGate />
      {children}
    </>
  )
}
