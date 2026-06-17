import { DeployNav } from "@/components/deploy-nav"
import { GoLiveHome } from "@/components/go-live-home"

export const metadata = {
  title: "Go Live",
}

// Hub Overview = the "Go Live" first-run home (2026-06-17 activation realignment):
// the default agent is already live; the user hears it work, then puts it on
// real traffic. The believe-then-scale flow lives in <GoLiveHome />.
export default function DeployHubPage() {
  return (
    <div className="flex flex-col flex-1">
      <DeployNav />
      <GoLiveHome />
    </div>
  )
}
