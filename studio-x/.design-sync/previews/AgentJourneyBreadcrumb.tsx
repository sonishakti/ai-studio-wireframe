import { AgentJourneyBreadcrumb } from 'studio-x'

// Mid-journey — Stack + Knowledge Base done (✓), currently on MCP, Deploy still
// upcoming. Every segment is clickable so editing can jump anywhere.
export const InProgress = () => (
  <div className="max-w-2xl">
    <AgentJourneyBreadcrumb
      agentName="Support Bot v2"
      status="draft"
      active="mcp"
      completion={{
        persona: true,
        stack: true,
        knowledge: true,
        mcp: false,
        connectors: false,
        deployment: false,
      }}
      onJump={() => {}}
    />
  </div>
)

// Live agent ready to deploy — every build step complete (✓), parked on the
// Deploy step, "live" status badge filled.
export const ReadyToDeploy = () => (
  <div className="max-w-2xl">
    <AgentJourneyBreadcrumb
      agentName="Aria"
      status="live"
      active="deployment"
      completion={{
        persona: true,
        stack: true,
        knowledge: true,
        mcp: true,
        connectors: true,
        deployment: false,
      }}
      onJump={() => {}}
    />
  </div>
)
