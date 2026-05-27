import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { AgentPlayground } from "@/components/agent-playground"

interface Props {
  params: Promise<{ id: string }>
}

export default async function AgentTestPage({ params }: Props) {
  const { id } = await params
  const isNew = id === "new"
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Test Playground"
        description={isNew ? "Test your draft agent before publishing." : "Talk to your agent right from this browser tab."}
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
