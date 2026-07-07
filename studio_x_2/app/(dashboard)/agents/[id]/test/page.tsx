import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { AgentPlayground } from "@/components/agent-playground"
import { getAgent, AGENTS } from "@/lib/campaign-data"

interface Props {
  params: Promise<{ id: string }>
}

/** Pre-generate mock agent ids: dynamic rendering left client children under
 *  [id] segments un-hydrated (see /agents/[id]/edit, 2026-07-07). */
export function generateStaticParams() {
  return [{ id: "new" }, ...AGENTS.map((a) => ({ id: a.id }))]
}

export default async function AgentTestPage({ params }: Props) {
  const { id } = await params
  const isNew = id === "new"
  // A stale deep-link to a deleted/unknown agent must not present a working
  // playground for an agent that doesn't exist — branch to not-found.
  if (!isNew && !getAgent(id)) notFound()
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Test Playground"
        description={isNew ? "Test your draft agent before deploying." : "Talk to your agent right from this browser tab."}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/agents/${id}/edit`}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back to editor
            </Link>
          </Button>
        }
      />
      <main className="flex-1 p-6">
        <AgentPlayground agentId={id} />
      </main>
    </div>
  )
}
