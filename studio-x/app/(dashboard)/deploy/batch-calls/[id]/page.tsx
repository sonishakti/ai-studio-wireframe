"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import {
  ArrowLeft, Bot, FileSpreadsheet, Braces, Phone, Info, Save, RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { CredentialRiskBanner } from "@/components/credential-risk-banner"
import { getDeployment, STATUS_BADGE, extractVars } from "@/lib/campaign-data"
import { toast } from "sonner"

// Batch Call detail — a deployment owns the WHOLE prompt + the contact CSV.
// The CSV's columns are auto-detected as {{vars}}; the prompt references them
// and each call substitutes that row's values (2026-06-11 revamp).
export default function BatchCallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const deployment = getDeployment(id)

  const [prompt, setPrompt] = React.useState(deployment?.prompt ?? "")
  const [greeting, setGreeting] = React.useState(deployment?.greeting ?? "")
  const [tab, setTab] = React.useState("overview")

  // Hash-aware deep-linking: a fixHref like #prompt must open the Prompt tab
  // (its content is unmounted while another tab is active) AND scroll to it.
  React.useEffect(() => {
    const h = window.location.hash.replace("#", "")
    if (!h) return
    if (h === "prompt" || h === "greeting") setTab("prompt")
    const t = setTimeout(() => {
      document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 60)
    return () => clearTimeout(t)
  }, [])

  if (!deployment || deployment.kind !== "batch") {
    return (
      <div className="flex flex-col flex-1 items-center justify-center gap-3 p-10 text-center">
        <p className="text-sm font-medium">Batch not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/deploy/batch-calls"><ArrowLeft className="h-3.5 w-3.5" /> Back to Batch Calls</Link>
        </Button>
      </div>
    )
  }

  const d = deployment
  const s = STATUS_BADGE[d.status]
  const columns = d.contacts?.columns ?? []
  const usedVars = extractVars(prompt + " " + greeting)
  const unusedColumns = columns.filter((c) => !usedVars.includes(c))
  const unknownVars = usedVars.filter((v) => !columns.includes(v))
  const pct = d.progress && d.progress.total > 0
    ? Math.round((d.progress.completed / d.progress.total) * 100)
    : 0

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title={d.name}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={s.variant}>{s.label}</Badge>
            <Button variant="ghost" size="sm" asChild className="gap-1 shrink-0">
              <Link href="/deploy/batch-calls"><ArrowLeft className="h-3.5 w-3.5" /> All batches</Link>
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 space-y-4">
        <div id="channel" className="flex items-center gap-4 text-xs text-muted-foreground scroll-mt-20">
          <Link
            href={`/agents/${d.agentId}/edit`}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Bot className="h-3 w-3" /> {d.agentName}
          </Link>
          {d.channel.kind === "telephony" && (
            <span className="inline-flex items-center gap-1 font-mono">
              <Phone className="h-3 w-3" /> {d.channel.numbers.join(", ")}
            </span>
          )}
          {d.startDate && <span>Starts {d.startDate}</span>}
        </div>
        <CredentialRiskBanner deploymentId={d.id} agentId={d.agentId} />

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prompt">Prompt &amp; Variables</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
          </TabsList>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <KpiCard label="Calls placed" value={d.metrics.calls > 0 ? d.metrics.calls.toLocaleString() : "—"} />
              <KpiCard label="Success rate" value={d.metrics.calls > 0 ? `${d.metrics.successRate}%` : "—"} />
              <KpiCard
                label="Dial-through"
                value={d.progress ? `${pct}%` : "—"}
                extra={
                  d.progress ? (
                    <>
                      <Progress value={pct} className="h-1.5 mt-2" />
                      <p className="text-xs text-muted-foreground tabular-nums mt-1">
                        {d.progress.completed.toLocaleString()} / {d.progress.total.toLocaleString()}
                      </p>
                    </>
                  ) : null
                }
              />
            </div>
            <Card>
              <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  Calls from this batch appear in Monitor with the batch filter applied.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/calls?batch=${d.id}`}>View call history →</Link>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Prompt & Variables — the per-deployment layer ────────────── */}
          <TabsContent value="prompt" className="mt-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <div className="space-y-5 min-w-0">
                <section id="prompt" className="space-y-2 scroll-mt-20">
                  <Label htmlFor="batch-prompt" className="text-sm font-medium">System Prompt</Label>
                  <Textarea
                    id="batch-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[260px] font-mono text-xs leading-relaxed"
                    spellCheck={false}
                  />
                  <p className="text-xs text-muted-foreground">
                    Applies to this batch only — calls dialed from now on pick up your edits.
                  </p>
                </section>

                <section id="greeting" className="space-y-2 scroll-mt-20">
                  <Label htmlFor="batch-greeting" className="text-sm font-medium">Greeting</Label>
                  <Textarea
                    id="batch-greeting"
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    className="min-h-[88px] text-sm"
                  />
                  <p className="text-xs text-muted-foreground">First line of every call. Variables resolve per contact row.</p>
                </section>

                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => toast.success("Prompt saved", { description: "Applies to calls dialed from now on." })}
                >
                  <Save className="h-3.5 w-3.5" /> Save changes
                </Button>
              </div>

              {/* Variables rail — auto-detected from the CSV */}
              <div className="space-y-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Braces className="h-3.5 w-3.5 text-primary" /> Variables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Auto-detected from <span className="font-mono">{d.contacts?.fileName}</span> columns.
                      Click to copy.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {columns.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-label={`Copy ${c} variable`}
                          aria-pressed={usedVars.includes(c)}
                          onClick={() => {
                            navigator.clipboard?.writeText(`{{${c}}}`)
                            toast.success(`{{${c}}} copied`)
                          }}
                          className={
                            "rounded-md border px-1.5 py-0.5 font-mono text-xs transition-colors " +
                            (usedVars.includes(c)
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border bg-muted/40 text-muted-foreground hover:text-foreground")
                          }
                        >
                          {`{{${c}}}`}
                        </button>
                      ))}
                    </div>
                    {unusedColumns.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {unusedColumns.length} column{unusedColumns.length === 1 ? "" : "s"} not referenced yet.
                      </p>
                    )}
                    {unknownVars.length > 0 && (
                      <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-2">
                        <Info className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed">
                          {unknownVars.map((v) => `{{${v}}}`).join(", ")} not found in the CSV —
                          these resolve empty at dial time.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Contacts ─────────────────────────────────────────────────── */}
          <TabsContent value="contacts" className="mt-4 space-y-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium font-mono truncate">{d.contacts?.fileName ?? "No file"}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.contacts
                      ? `${d.contacts.rowCount.toLocaleString()} rows · columns: ${d.contacts.columns.join(", ")}`
                      : "Upload a CSV to dial."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => toast.info("Replace contacts", { description: "New columns re-detect variables automatically." })}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Replace file
                </Button>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground">
              Changing the CSV re-detects variables. Variables the prompt references must exist
              as columns, or they resolve empty.
            </p>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function KpiCard({ label, value, extra }: { label: string; value: string; extra?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold tabular-nums mt-1">{value}</p>
        {extra}
      </CardContent>
    </Card>
  )
}
