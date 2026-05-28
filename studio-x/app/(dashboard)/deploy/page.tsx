import { PageHeader } from "@/components/page-header"
import { DeployChooser, DeployChooserFooter } from "@/components/deploy-chooser"

export const metadata = {
  title: "Deploy",
}

export default function DeployHubPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deploy an agent"
        description="Pick how your agent goes live. You can add more channels later."
      />

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <DeployChooser variant="page" />
          <DeployChooserFooter />
        </div>
      </main>
    </div>
  )
}
