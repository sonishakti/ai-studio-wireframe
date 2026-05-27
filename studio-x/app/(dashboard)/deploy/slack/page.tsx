import Link from "next/link"
import { ArrowRight, Hash, Bell } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DeploySlackPage() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deploy to Slack"
        description="Add your agent to a Slack workspace as a bot. Channel mentions, DMs, slash commands."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/deploy"><ArrowRight className="h-3.5 w-3.5 rotate-180" /> All channels</Link>
          </Button>
        }
      />
      <main className="flex-1 p-6 max-w-3xl">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center text-center gap-3 py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/15">
              <Hash className="h-6 w-6 text-pink-500" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Slack deployment coming soon</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              We're testing the Slack channel with a small group of customers. Join the waitlist and
              we'll let you know when it's generally available.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button asChild>
                <Link href="/help/contact-sales"><Bell className="h-4 w-4" /> Join waitlist</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/deploy">Back to deployments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
