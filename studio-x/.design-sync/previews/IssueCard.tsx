// IssueCard — a single diagnosed issue with severity, root cause, suggested fix,
// and a deep-link "Fix this" action that routes to where the fix lives.
import { IssueCard } from 'studio-x'

const latencyIssue = {
  id: "call_8821:llm_latency:4",
  ruleId: "llm_latency",
  title: "LLM latency exceeded 3s on turn 4",
  severity: "critical" as const,
  turn: 4,
  timestamp: "1:12",
  rootCause:
    "The model took 3.4s to respond after the caller finished speaking, creating dead air the caller filled by repeating themselves.",
  suggestedFix:
    "Switch this deployment's reasoning model to a lower-latency tier, or trim the system prompt.",
  fixTarget: { level: "deployment" as const, id: "dep_aria_inbound", section: "prompt" },
}

const bargeInIssue = {
  id: "call_8821:barge_in:6",
  ruleId: "barge_in",
  title: "Barge-in not honored mid-response",
  severity: "warning" as const,
  turn: 6,
  timestamp: "1:58",
  rootCause:
    "The caller interrupted but the agent kept speaking for 1.8s before yielding — turn-taking sensitivity is set too low.",
  suggestedFix: "Raise interruption sensitivity in the agent's turn-taking settings.",
  fixTarget: { level: "agent" as const, id: "agent_aria", section: "turn-taking" },
}

export const InCallSheet = () => (
  <div className="w-96">
    <IssueCard issue={latencyIssue} surface="call_sheet" deploymentId="dep_aria_inbound" />
  </div>
)

export const InQueue = () => (
  <div className="w-96">
    <IssueCard
      issue={bargeInIssue}
      surface="queue"
      deploymentId="dep_aria_inbound"
      deploymentName="Aria — Inbound Support"
      count={14}
    />
  </div>
)
