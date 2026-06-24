"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import { ArrowLeft, Bot, Save } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ChannelBadge } from "@/components/campaign-channel-badges"
import { CredentialRiskBanner } from "@/components/credential-risk-banner"
import { useHashScroll } from "@/components/use-hash-scroll"
import { getDeployment, STATUS_BADGE } from "@/lib/campaign-data"
import { toast } from "sonner"

// Inbound deployment detail — one agent answering on one channel. The
// environment-specific prompt lives HERE, not on the agent (2026-06-11).
export default function InboundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const deployment = getDeployment(id)
  useHashScroll()

  const [prompt, setPrompt] = React.useState(deployment?.prompt ?? "")
  const [greeting, setGreeting] = React.useState(deployment?.greeting ?? "")
  const [failure, setFailure] = React.useState(deployment?.failure ?? "")

  if (!deployment || deployment.kind !== "inbound") {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm font-medium">Inbound deployment not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/deploy/inbound"><ArrowLeft className="h-3.5 w-3.5" /> Back to Inbound</Link>
        </Button>
      </div>
    )
  }

  const d = deployment
  const s = STATUS_BADGE[d.status]
  const answersOn =
    d.channel.kind === "telephony" ? d.channel.numbers.join(", ")
    : d.channel.kind === "whatsapp" ? d.channel.sender
    : d.channel.kind === "sms" ? d.channel.number
    : d.channel.domains.join(", ")

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title={d.name}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={s.variant}>{s.label}</Badge>
            <ChannelBadge channel={d.channel} withLabel />
            <Button variant="ghost" size="sm" asChild className="gap-1 shrink-0">
              <Link href="/deploy/inbound"><ArrowLeft className="h-3.5 w-3.5" /> All inbound</Link>
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-5">
          <div id="channel" className="flex items-center gap-4 text-xs text-muted-foreground scroll-mt-20">
            <Link
              href={`/agents/${d.agentId}/edit`}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Bot className="h-3 w-3" /> {d.agentName}
            </Link>
            <span className="font-mono">{answersOn}</span>
            {d.ringsPerWeek !== undefined && d.ringsPerWeek > 0 && (
              <span className="tabular-nums">{d.ringsPerWeek.toLocaleString()} rings/wk</span>
            )}
          </div>
          <CredentialRiskBanner deploymentId={d.id} agentId={d.agentId} />

          <section id="prompt" className="space-y-2 scroll-mt-20">
            <Label htmlFor="ib-prompt" className="text-sm font-medium">System Prompt</Label>
            <Textarea
              id="ib-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[240px] font-mono text-xs leading-relaxed"
              spellCheck={false}
            />
            <p className="text-xs text-muted-foreground">
              What the agent should do when answering here. Voice and personality come
              from the{" "}
              <Link href={`/agents/${d.agentId}/edit`} className="underline underline-offset-2 hover:text-foreground">
                agent
              </Link>.
            </p>
          </section>

          <section id="greeting" className="space-y-2 scroll-mt-20">
            <Label htmlFor="ib-greeting" className="text-sm font-medium">Greeting</Label>
            <Textarea
              id="ib-greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="min-h-[72px] text-sm"
            />
          </section>

          <section id="failure" className="space-y-2 scroll-mt-20">
            <Label htmlFor="ib-failure" className="text-sm font-medium">Failure Message</Label>
            <Textarea
              id="ib-failure"
              value={failure}
              onChange={(e) => setFailure(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Said if the agent loses the caller, hits a tool error, or can&apos;t recover.
            </p>
          </section>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => toast.success("Deployment saved", { description: "Applies to new conversations immediately." })}
            >
              <Save className="h-3.5 w-3.5" /> Save changes
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/calls?deployment=${d.id}`}>View call history →</Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Conversations</p>
                <p className="text-lg font-semibold tabular-nums mt-0.5">
                  {d.metrics.calls > 0 ? d.metrics.calls.toLocaleString() : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Resolution rate</p>
                <p className="text-lg font-semibold tabular-nums mt-0.5">
                  {d.metrics.calls > 0 ? `${d.metrics.successRate}%` : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avg handle time</p>
                <p className="text-lg font-semibold tabular-nums mt-0.5">
                  {d.metrics.avgHandleTimeSec > 0
                    ? `${Math.floor(d.metrics.avgHandleTimeSec / 60)}m ${(d.metrics.avgHandleTimeSec % 60).toString().padStart(2, "0")}s`
                    : "—"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
