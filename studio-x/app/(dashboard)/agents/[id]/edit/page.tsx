"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import {
  Rocket,
  Info,
  MoreHorizontal,
  Hash,
  Trash2,
  Copy,
  ArrowLeft,
  PhoneIncoming,
  PhoneOutgoing,
  Zap,
  Scale,
  PiggyBank,
  BookOpen,
  Wrench,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import {
  AGENTS,
  DEPLOYMENTS,
  STACK_PRESETS,
  type StackPreset,
} from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Agent editor — Stack + Persona ONLY (2026-06-11 revamp) ─────────────────
//
// The agent is the reusable half: persona, model stack, knowledge, actions.
// The prompt, custom code, and dynamic variables live on each DEPLOYMENT
// (inbound or Batch Calls), authored at deploy time. The old Prompt tab and
// the "{{vars}} must match your CSV" banner are gone from here by design.
// See references/ia-revamp-agent-vs-deployment.md.

const PRESET_ICON: Record<StackPreset, React.ComponentType<{ className?: string }>> = {
  fastest: Zap,
  balanced: Scale,
  cheapest: PiggyBank,
}

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]

const LLM_VENDORS = ["OpenAI", "Anthropic", "Google"]
const ASR_VENDORS = ["Deepgram", "Whisper", "AssemblyAI"]
const TTS_VENDORS = ["ElevenLabs", "Azure", "PlayHT"]

export default function AgentEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const agent = AGENTS.find((a) => a.id === id)
  const isNew = id === "new"

  const agentName = isNew ? "Untitled agent" : agent?.name ?? "Sales Sam"
  const agentLabel = isNew ? "Draft" : agent ? agent.status : "Draft"
  // Backlinks: which deployments this reusable agent backs (one channel each).
  const deployedIn = isNew ? [] : DEPLOYMENTS.filter((d) => d.agentId === id)

  // Deploy target — chosen up front so the channel is never an afterthought.
  const [target, setTarget] = React.useState<"inbound" | "batch">("inbound")

  // Persona (the "change personality" tweak)
  const [personality, setPersonality] = React.useState(agent?.persona.personality ?? "Warm, concise, professional")
  const [tone, setTone] = React.useState(agent?.persona.tone ?? "Friendly")
  const [language, setLanguage] = React.useState(agent?.persona.language ?? "en-US")
  const [brand, setBrand] = React.useState(agent?.persona.brand ?? "")

  // Stack — speed-vs-cost preset first, vendors drill down underneath.
  const [preset, setPreset] = React.useState<StackPreset>(agent?.stack.preset ?? "balanced")
  const [llmVendor, setLlmVendor] = React.useState(agent?.stack.llm.vendor ?? STACK_PRESETS.balanced.llm.vendor)
  const [llmModel, setLlmModel] = React.useState(agent?.stack.llm.model ?? STACK_PRESETS.balanced.llm.model)
  const [asrVendor, setAsrVendor] = React.useState(agent?.stack.asr.vendor ?? STACK_PRESETS.balanced.asr.vendor)
  const [ttsVendor, setTtsVendor] = React.useState(agent?.stack.tts.vendor ?? STACK_PRESETS.balanced.tts.vendor)

  const applyPreset = (p: StackPreset) => {
    setPreset(p)
    const def = STACK_PRESETS[p]
    setLlmVendor(def.llm.vendor)
    setLlmModel(def.llm.model)
    setAsrVendor(def.asr.vendor)
    setTtsVendor(def.tts.vendor)
    toast.success(`${def.label} stack applied`, { description: def.hint })
  }

  const handleTestAgent = () => {
    toast.info("Connecting to test session…", {
      description: "Spinning up a sandbox channel for this agent.",
    })
  }

  const continueHref = target === "inbound" ? "/deploy/inbound/new" : "/deploy/batch-calls/new"

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Page header — agent identity + deploy target + actions */}
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
              {/* Deploy target — picked FIRST, points at the deployment surface */}
              <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
                {(
                  [
                    { key: "inbound", label: "Inbound", icon: PhoneIncoming },
                    { key: "batch", label: "Batch Calls", icon: PhoneOutgoing },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTarget(t.key)}
                    className={cn(
                      "flex items-center gap-1 rounded px-2 h-6 text-xs font-medium transition-colors",
                      target === t.key
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <t.icon className="h-3 w-3" /> {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 font-mono">
                <Hash className="h-3 w-3" />
                {isNew ? "agt_draft" : id}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
                800ms latency budget
              </span>
            </div>
            {deployedIn.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground pt-0.5">
                <span>Deployed in:</span>
                {deployedIn.map((d) => (
                  <Link
                    key={d.id}
                    href={d.kind === "batch" ? `/deploy/batch-calls/${d.id}` : `/deploy/inbound/${d.id}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-foreground hover:border-primary/40 transition-colors"
                  >
                    {d.kind === "batch" ? (
                      <PhoneOutgoing className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <PhoneIncoming className="h-3 w-3 text-muted-foreground" />
                    )}
                    {d.name}
                  </Link>
                ))}
              </div>
            )}
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
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <Tabs defaultValue="persona" className="flex flex-col flex-1 min-h-0">
            <div className="border-b px-6 pt-2">
              <TabsList className="bg-transparent border-b-0 -mb-px h-auto p-0 gap-0">
                <UnderlineTab value="persona">Persona</UnderlineTab>
                <UnderlineTab value="stack">Stack</UnderlineTab>
                <UnderlineTab value="knowledge">Knowledge</UnderlineTab>
                <UnderlineTab value="actions">Actions</UnderlineTab>
              </TabsList>
            </div>

            {/* ── Persona — the light "change personality" tweak ──────────── */}
            <TabsContent value="persona" className="flex-1 overflow-y-auto px-6 py-5 space-y-5 mt-0">
              {/* Wayfinding: prompts moved to deployments */}
              <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">
                  Looking for the prompt? Each deployment has its own — open{" "}
                  <Link href="/deploy" className="underline underline-offset-2 hover:text-primary">
                    Deploy
                  </Link>{" "}
                  to edit what this agent says on a number, widget, or batch.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tone of voice</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personality" className="text-sm font-medium">Personality</Label>
                <Textarea
                  id="personality"
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className="min-h-[88px] text-sm"
                  placeholder="e.g. Warm, patient, solution-first"
                />
                <p className="text-xs text-muted-foreground">
                  How the agent sounds and behaves — e.g. warm, patient, never pushy.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium">Brand</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Acme"
                  className="max-w-sm"
                />
                <p className="text-xs text-muted-foreground">
                  The company the agent represents. Used in introductions across deployments.
                </p>
              </div>
            </TabsContent>

            {/* ── Stack — speed-vs-cost FIRST, vendors underneath ─────────── */}
            <TabsContent value="stack" className="flex-1 overflow-y-auto px-6 py-5 space-y-5 mt-0">
              <section className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Optimize for</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pick a goal — vendors are set for you. Drill into any of them below.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {(Object.keys(STACK_PRESETS) as StackPreset[]).map((p) => {
                    const def = STACK_PRESETS[p]
                    const Icon = PRESET_ICON[p]
                    const selected = preset === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => applyPreset(p)}
                        className={cn(
                          "flex flex-col gap-2 rounded-lg border p-4 text-left transition-all",
                          selected
                            ? "border-primary/60 bg-primary/5 shadow-sm"
                            : "border-border bg-card hover:border-primary/30",
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-md",
                            selected ? "bg-primary/15" : "bg-muted",
                          )}>
                            <Icon className={cn("h-4 w-4", selected ? "text-primary" : "text-muted-foreground")} />
                          </div>
                          {selected && <Badge variant="default" className="text-xs">Selected</Badge>}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{def.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{def.hint}</p>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {def.llm.model} · {def.asr.model} · {def.tts.voice}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Vendors</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manual overrides — changing any of these keeps the preset as a starting point.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">LLM</Label>
                    <Select value={llmVendor} onValueChange={setLlmVendor}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {LLM_VENDORS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      className="font-mono text-xs h-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">ASR</Label>
                    <Select value={asrVendor} onValueChange={setAsrVendor}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ASR_VENDORS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">TTS</Label>
                    <Select value={ttsVendor} onValueChange={setTtsVendor}>
                      <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TTS_VENDORS.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Vendor keys live in{" "}
                  <Link href="/project/vendor-credentials" className="underline underline-offset-2 hover:text-foreground">
                    Vendor Credentials
                  </Link>.
                </p>
              </section>
            </TabsContent>

            {/* ── Knowledge ───────────────────────────────────────────────── */}
            <TabsContent value="knowledge" className="flex-1 overflow-y-auto px-6 py-5 space-y-4 mt-0">
              <AttachPanel
                icon={BookOpen}
                title="Knowledge bases"
                attached={agent?.knowledge ?? []}
                emptyHint="No knowledge attached. The agent answers from the model alone."
                manageHref="/integrations"
                manageLabel="Manage in Integrations"
              />
            </TabsContent>

            {/* ── Actions ─────────────────────────────────────────────────── */}
            <TabsContent value="actions" className="flex-1 overflow-y-auto px-6 py-5 space-y-4 mt-0">
              <AttachPanel
                icon={Wrench}
                title="Tools & MCP servers"
                attached={agent?.actions ?? []}
                emptyHint="No tools attached. Add MCP servers or connectors so the agent can act."
                manageHref="/integrations"
                manageLabel="Manage in Integrations"
              />
            </TabsContent>
          </Tabs>

          {/* Continue into the deployment — prompt/vars are authored there */}
          <div className="border-t bg-background px-6 py-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Next: write what the agent says on this{" "}
              {target === "inbound" ? "line" : "batch"}.
            </p>
            <Button size="sm" className="gap-1.5" asChild>
              <Link href={continueHref}>
                Continue to {target === "inbound" ? "Inbound" : "Batch Calls"}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        <AgentTestPanel
          title={agentName}
          state="Agent Disconnected"
          spec={{
            llm: llmVendor,
            asr: asrVendor,
            tts: ttsVendor,
            latencyMs: preset === "fastest" ? 380 : preset === "balanced" ? 500 : 720,
            ttftMs: preset === "fastest" ? 18 : preset === "balanced" ? 23 : 41,
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

const ATTACHMENT_LABEL: Record<string, string> = {
  kb_01: "Product Docs",
  kb_02: "FAQs v3",
  kb_03: "Policy Handbook",
  mcp_01: "CRM Connector",
  mcp_02: "Calendar API",
}

function AttachPanel({
  icon: Icon,
  title,
  attached,
  emptyHint,
  manageHref,
  manageLabel,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  attached: string[]
  emptyHint: string
  manageHref: string
  manageLabel: string
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium flex items-center gap-1.5">
          <Icon className="h-4 w-4 text-muted-foreground" /> {title}
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href={manageHref}>{manageLabel} →</Link>
        </Button>
      </div>
      {attached.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center">
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">{emptyHint}</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {attached.map((id) => (
            <span
              key={id}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-sm"
            >
              {ATTACHMENT_LABEL[id] ?? id}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
