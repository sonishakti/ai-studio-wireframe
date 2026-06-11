"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ArrowRight, Upload, FileSpreadsheet, Braces, Rocket, Check, Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DeployNav } from "@/components/deploy-nav"
import { AGENTS, PHONE_NUMBERS, extractVars, STACK_PRESETS } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// New Batch Call — the deploy-time layer where the prompt, custom code, and
// dynamic variables are authored (2026-06-11 revamp). The flow fixes the old
// inversion: CSV first, THEN the prompt — so variables exist before they're
// referenced. Steps: Basics → Contacts → Prompt → Launch.

const STEPS = ["Basics", "Contacts", "Prompt"] as const

// Wireframe stand-in for parsing the uploaded file's header row.
const MOCK_CSV = {
  fileName: "contacts.csv",
  rowCount: 1500,
  columns: ["phone", "name", "company", "appointment_date", "appointment_time"],
}

const STARTER_PROMPT = `# ROLE
Describe who the agent is on THIS batch and what a successful call looks like.

# CONTEXT (per row)
Reference your CSV columns, e.g. calling {{name}} from {{company}}.

# CONSTRAINTS
Keep spoken responses under 40 words.`

export default function NewBatchCallPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(0)

  // Step 1 — Basics
  const [name, setName] = React.useState("")
  const [agentId, setAgentId] = React.useState<string>("")
  const [numberId, setNumberId] = React.useState<string>("pn_05")

  // Step 2 — Contacts
  const [file, setFile] = React.useState<typeof MOCK_CSV | null>(null)

  // Step 3 — Prompt
  const [prompt, setPrompt] = React.useState(STARTER_PROMPT)
  const [greeting, setGreeting] = React.useState("Hi {{name}}, this is an automated call from our team.")

  const agent = AGENTS.find((a) => a.id === agentId)
  const columns = file?.columns ?? []
  const usedVars = extractVars(prompt + " " + greeting)

  const canNext =
    step === 0 ? Boolean(name.trim() && agentId)
    : step === 1 ? Boolean(file)
    : true

  const handleLaunch = () => {
    toast.success(`"${name}" is ready to dial`, {
      description: `${file?.rowCount.toLocaleString()} contacts · ${columns.length} variables detected.`,
    })
    router.push("/deploy/batch-calls")
  }

  return (
    <div className="flex flex-col flex-1">
      <DeployNav />

      <main className="flex-1 p-6">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          {/* Stepper */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {STEPS.map((label, i) => (
                <React.Fragment key={label}>
                  <span
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-medium",
                      i === step ? "text-primary" : i < step ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] tabular-nums",
                        i === step
                          ? "border-primary bg-primary/10 text-primary"
                          : i < step
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border",
                      )}
                    >
                      {i < step ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    {label}
                  </span>
                  {i < STEPS.length - 1 && <span className="h-px w-6 bg-border" />}
                </React.Fragment>
              ))}
            </div>
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/deploy/batch-calls"><ArrowLeft className="h-3.5 w-3.5" /> Cancel</Link>
            </Button>
          </div>

          {/* ── Step 1: Basics ───────────────────────────────────────────── */}
          {step === 0 && (
            <Card>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="batch-name" className="text-sm font-medium">Batch name</Label>
                  <Input
                    id="batch-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Q3 Renewal Reminders"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Agent</Label>
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Pick the agent that dials" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGENTS.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {agent && (
                    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
                      <Bot className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {agent.persona.tone} · {agent.persona.language} ·{" "}
                        {STACK_PRESETS[agent.stack.preset].label} stack ({agent.stack.llm.model})
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    The agent brings its reusable persona and stack. The prompt for this batch
                    comes in step 3.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dial from</Label>
                  <Select value={numberId} onValueChange={setNumberId}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PHONE_NUMBERS.filter((n) => n.label === "Outbound Pool" || n.status === "unassigned").map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.number} — {n.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Step 2: Contacts — CSV columns become {{vars}} ───────────── */}
          {step === 1 && (
            <Card>
              <CardContent className="p-5 space-y-4">
                {!file ? (
                  <button
                    type="button"
                    onClick={() => {
                      setFile(MOCK_CSV)
                      toast.success("contacts.csv uploaded", {
                        description: `${MOCK_CSV.columns.length} columns detected as variables.`,
                      })
                    }}
                    className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center transition-colors hover:border-primary/40"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload contact CSV</span>
                    <span className="text-xs text-muted-foreground">
                      Needs a phone column. Every other column becomes a {`{{variable}}`} for the prompt.
                    </span>
                  </button>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted shrink-0">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium font-mono">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">{file.rowCount.toLocaleString()} rows</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setFile(null)}>Change file</Button>
                    </div>

                    <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
                      <p className="text-xs font-medium flex items-center gap-1.5">
                        <Braces className="h-3.5 w-3.5 text-primary" /> Variables detected from columns
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {file.columns.map((c) => (
                          <span key={c} className="rounded-md border border-border bg-card px-1.5 py-0.5 font-mono text-xs">
                            {`{{${c}}}`}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Each call substitutes that row&apos;s values — nothing to declare manually.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Step 3: Prompt — authored here, with the vars in reach ───── */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_240px]">
              <Card>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-prompt" className="text-sm font-medium">System Prompt</Label>
                    <Textarea
                      id="new-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[220px] font-mono text-xs leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-greeting" className="text-sm font-medium">Greeting</Label>
                    <Textarea
                      id="new-greeting"
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      className="min-h-[72px] text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="h-fit">
                <CardContent className="p-4 space-y-2.5">
                  <p className="text-xs font-medium flex items-center gap-1.5">
                    <Braces className="h-3.5 w-3.5 text-primary" /> Your variables
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {columns.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPrompt((p) => p + ` {{${c}}}`)}
                        className={cn(
                          "rounded-md border px-1.5 py-0.5 font-mono text-xs transition-colors",
                          usedVars.includes(c)
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {`{{${c}}}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Click to insert into the prompt.</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Footer nav */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button size="sm" className="gap-1" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>
                Next <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={handleLaunch}>
                <Rocket className="h-3.5 w-3.5" /> Launch batch
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
