"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import {
  Rocket,
  Sparkles,
  Info,
  MoreHorizontal,
  Clock,
  Hash,
  Trash2,
  Copy,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AgentTestPanel } from "@/components/agent-test-panel"
import { AgentDeploySheet } from "@/components/agent-deploy-sheet"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import { AGENTS } from "@/lib/campaign-data"
import { toast } from "sonner"

// ─── content presets ────────────────────────────────────────────────────────

const PROMPT_PRESETS = [
  { id: "outbound-appointment", label: "Outbound Appointment Reminder" },
  { id: "inbound-support", label: "Inbound Support" },
  { id: "sales-qualifier", label: "Sales Qualifier" },
  { id: "nps-survey", label: "NPS Survey" },
  { id: "blank", label: "Blank" },
]

const DEFAULT_SYSTEM_PROMPT = `# SYSTEM PROMPT
Outbound Appointment Reminder Voice Agent

# ROLE
You are "Alex Morgan", a friendly outbound assistant who helps patients or clients confirm, reschedule, or get details about their upcoming appointment.

Your goal: "Confirm the appointment, answer simple questions, and help reschedule if needed."
"Never mention you are AI"
Keep a spoken response under "40-50 words".

# INTERNAL_AGENT_LOGIC (NEVER SPEAK, NEVER REVEAL)
Write a single prompt for your agent, to control its identity and behaviour.`

const DEFAULT_GREETING = `Hi, this is Alex calling with a reminder about your upcoming appointment on {{appointment_date}} at {{appointment_time}}. Do you have a quick moment to confirm?`

const DEFAULT_FAILURE = `Please hold on a second.`

// ─── page ───────────────────────────────────────────────────────────────────

export default function AgentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const agentFromList = AGENTS.find((a) => a.id === id)
  const isNew = id === "new"

  const agentName = isNew ? "Untitled agent" : agentFromList?.name ?? "Sales Sam"
  const agentLabel = isNew ? "Draft" : agentFromList ? agentFromList.status : "Draft"

  const [activeTab, setActiveTab] = React.useState("prompt")
  const [preset, setPreset] = React.useState(PROMPT_PRESETS[0].id)
  const [systemPrompt, setSystemPrompt] = React.useState(DEFAULT_SYSTEM_PROMPT)
  const [greeting, setGreeting] = React.useState(DEFAULT_GREETING)
  const [failure, setFailure] = React.useState(DEFAULT_FAILURE)

  const handleGeneratePrompt = () => {
    toast.success("Generating prompt…", {
      description: "Composer is drafting a prompt based on the selected preset.",
      icon: <Sparkles className="h-4 w-4" />,
    })
  }

  const handleTestAgent = () => {
    toast.info("Connecting to test session…", {
      description: "Spinning up a sandbox channel for this agent.",
    })
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Page header — agent identity + actions */}
      <header className="border-b bg-background px-6 py-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold tracking-tight truncate">{agentName}</h1>
              <Badge
                variant={agentLabel === "live" ? "default" : "outline"}
                className="text-xs capitalize"
              >
                {agentLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <Hash className="h-3 w-3" />
                {isNew ? "agt_draft" : id}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                0:00 min
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                800ms latency budget
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/agents">
                <ArrowLeft className="h-3.5 w-3.5" /> Agents
              </Link>
            </Button>

            <AgentDeploySheet agentId={id}>
              <Button size="sm" className="gap-1.5">
                <Rocket className="h-3.5 w-3.5" /> Deploy Agent
              </Button>
            </AgentDeploySheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="gap-2">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Info className="h-3.5 w-3.5" /> Agent details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DestructiveActionDialog
                  action="Delete"
                  resource="agent"
                  resourceId={id}
                  resourceName={agentName}
                >
                  <DropdownMenuItem
                    className="gap-2 text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </DropdownMenuItem>
                </DestructiveActionDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Body — tabs on left, test panel on right */}
      <div className="flex flex-1 min-h-0">
        {/* Left side: tabs + content */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            <div className="border-b px-6 pt-2">
              <TabsList className="bg-transparent border-b-0 -mb-px h-auto p-0 gap-0">
                <UnderlineTab value="models">Models</UnderlineTab>
                <UnderlineTab value="prompt">Prompt</UnderlineTab>
                <UnderlineTab value="advanced">Advanced</UnderlineTab>
                <UnderlineTab value="actions">Actions</UnderlineTab>
                <UnderlineTab value="custom" className="text-muted-foreground">
                  + Custom Config
                </UnderlineTab>
              </TabsList>
            </div>

            <TabsContent
              value="prompt"
              className="flex-1 overflow-y-auto px-6 py-5 space-y-5 mt-0"
            >
              {/* Variable-use toast */}
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">
                  Use{" "}
                  <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{`{{ }}`}</code>{" "}
                  for dynamic variables. Variable names should match column names in your CSV file.
                </p>
              </div>

              {/* System Prompt */}
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <Label htmlFor="prompt-preset" className="text-sm font-medium">
                      System Prompt
                    </Label>
                    <Select value={preset} onValueChange={setPreset}>
                      <SelectTrigger id="prompt-preset" className="h-9 w-60 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROMPT_PRESETS.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGeneratePrompt}
                    className="gap-1.5"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Generate prompt
                  </Button>
                </div>

                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="min-h-[260px] font-mono text-xs leading-relaxed"
                  spellCheck={false}
                />
                <p className="text-xs text-muted-foreground">
                  Write a single prompt for your agent, to control its identity and behaviour.
                </p>
              </section>

              {/* Greeting Message */}
              <section className="space-y-2">
                <Label htmlFor="greeting" className="text-sm font-medium">
                  Greeting Message
                </Label>
                <Textarea
                  id="greeting"
                  value={greeting}
                  onChange={(e) => setGreeting(e.target.value)}
                  className="min-h-[120px] text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  The first message the agent will say.
                </p>
              </section>

              {/* Failure Message */}
              <section className="space-y-2">
                <Label htmlFor="failure" className="text-sm font-medium">
                  Failure Message
                </Label>
                <Textarea
                  id="failure"
                  value={failure}
                  onChange={(e) => setFailure(e.target.value)}
                  className="min-h-[88px] text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Said if the agent loses the user, hits a tool error, or can&apos;t recover the
                  conversation.
                </p>
              </section>
            </TabsContent>

            <TabsContent value="models" className="flex-1 px-6 py-5 mt-0">
              <EmptyPanel title="Models" hint="Pick LLM, ASR and TTS vendors plus their parameters." />
            </TabsContent>
            <TabsContent value="advanced" className="flex-1 px-6 py-5 mt-0">
              <EmptyPanel title="Advanced" hint="Interruption handling, end-of-turn detection, allowlists." />
            </TabsContent>
            <TabsContent value="actions" className="flex-1 px-6 py-5 mt-0">
              <EmptyPanel title="Actions" hint="Tools, function calls, transfer rules, post-call webhooks." />
            </TabsContent>
            <TabsContent value="custom" className="flex-1 px-6 py-5 mt-0">
              <EmptyPanel
                title="Custom Config"
                hint="Add a YAML/JSON override for parameters this UI doesn't expose."
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right side: agent test panel */}
        <AgentTestPanel
          title="Appointment Reminder"
          state="Agent Disconnected"
          spec={{
            llm: "Open AI",
            asr: "DeepGram",
            tts: "ElevenLabs",
            latencyMs: 500,
            ttftMs: 23,
          }}
          onTest={handleTestAgent}
        />
      </div>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

function UnderlineTab({
  value,
  children,
  className,
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsTrigger
      value={value}
      className={
        "rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none " +
        (className ?? "")
      }
    >
      {children}
    </TabsTrigger>
  )
}

function EmptyPanel({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-12">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground max-w-sm">{hint}</p>
    </div>
  )
}
