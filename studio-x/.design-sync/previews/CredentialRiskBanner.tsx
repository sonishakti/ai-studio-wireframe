import { CredentialRiskBanner } from 'studio-x'

// agt_collections runs the "cheapest" stack (LLM vendor = Anthropic), and the
// Anthropic "Claude API Key" credential is in the EXPIRING set — so the banner
// has real risk to surface and renders its expiry warning + "Rotate key" CTA.
export const ExpiringKey = () => (
  <div className="max-w-2xl">
    <CredentialRiskBanner deploymentId="dep_collections_q2" agentId="agt_collections" />
  </div>
)
