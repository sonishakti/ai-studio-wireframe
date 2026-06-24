import { DeployContextBar } from 'studio-x'

// DeployContextBar only renders when opened FROM an agent (?agent=… in the URL);
// standalone it correctly renders null. Seed the query param at module load so
// the component's mount-time read of window.location.search resolves to a real
// agent (Aria) — recreating the in-context "here's the way back" rail.
if (typeof window !== 'undefined' && !window.location.search.includes('agent=')) {
  window.history.replaceState(null, '', `${window.location.pathname}?agent=agt_default`)
}

// Came from the Aria builder's Deploy step into the Phone Numbers channel —
// the slim sticky return rail keeps the agent one click away.
export const FromAgent = () => (
  <div className="max-w-2xl">
    <DeployContextBar channelLabel="Phone Numbers" />
  </div>
)
