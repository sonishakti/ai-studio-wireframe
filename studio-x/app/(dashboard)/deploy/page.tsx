import { DeployChooser, DeployChooserFooter } from "@/components/deploy-chooser"
import { DeployNav } from "@/components/deploy-nav"

export const metadata = {
  title: "Deploy",
}

export default function DeployHubPage() {
  return (
    <div className="flex flex-col flex-1">
      <DeployNav />

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Pick how your agent goes live</h2>
            <p className="text-sm text-muted-foreground">
              Connect your agent to a channel. You can add more anytime.
            </p>
          </div>
          <DeployChooser variant="page" />
          <DeployChooserFooter />
        </div>
      </main>
    </div>
  )
}
