"use client"

import * as React from "react"
import { use } from "react"
import Link from "next/link"
import {
  Info,
  MoreHorizontal,
  Hash,
  Trash2,
  Copy,
  ArrowLeft,
  Zap,
  Scale,
  PiggyBank,
  BookOpen,
  Wrench,
  Plug,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent } from "@/components/ui/tabs"
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
import { AgentJourneyBreadcrumb, type AgentSection } from "@/components/agent-journey-breadcrumb"
import { AgentDeploymentPanel } from "@/components/agent-deployment-panel"
import { DestructiveActionDialog } from "@/components/destructive-action-dialog"
import {
  AGENTS,
  DEPLOYMENTS,
  STACK_PRESETS,
  STACK_ESTIMATE,
  credentialsAtRiskForAgent,
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

// Per-preset latency breakdown for the test panel. e2e MUST equal the existing
// latencyMs so nothing regresses; asr/llm/tts are the component estimates and
// bestCase is the achievable floor. ttftMs == llmMs (LLM time-to-first-token).
const LATENCY_BY_PRESET: Record<
  StackPreset,
  { asrMs: number; llmMs: number; ttsMs: number; e2eMs: number; bestMs: number }
> = {
  fastest: { asrMs: 90, llmMs: 200, ttsMs: 70, e2eMs: 380, bestMs: 300 },
  balanced: { asrMs: 130, llmMs: 300, ttsMs: 90, e2eMs: 520, bestMs: 420 },
  cheapest: { asrMs: 180, llmMs: 480, ttsMs: 120, e2eMs: 780, bestMs: 640 },
}

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
  // Expiring vendor keys this agent's stack depends on (surfaced on the Stack step).
  const credAtRisk = isNew ? [] : credentialsAtRiskForAgent(id)

  // Agent experience = a journey breadcrumb (not tabs). The section is controlled
  // here and mirrored to the URL hash so #behavior / #deployment deep-links work.
  const [section, setSection] = React.useState<AgentSection>("stack")
  React.useEffect(() => {
    const map: Record<string, AgentSection> = {
      // Persona is no longer a standalone step — it lives inside Deploy (2026-06-24).
      // Old #persona / #behavior deep-links land on Deploy where the form now is.
      behavior: "deployment", persona: "deployment", stack: "stack",
      knowledge: "knowledge", mcp: "mcp", connectors: "connectors",
      actions: "mcp", // back-compat: the old combined #actions now lands on MCP
      deployment: "deployment",
    }
    const applyHash = () => {
      const s = map[window.location.hash.replace("#", "")]
      if (s) setSection(s)
    }
    applyHash() // cold load / navigation that mounts with a hash (e.g. row → Deploy)
    // Also honor hash changes that arrive after mount (in-app links to #deployment
    // while the editor is already open) so the Deploy deep-link is never a no-op.
    window.addEventListener("hashchange", applyHash)
    return () => window.removeEventListener("hashchange", applyHash)
  }, [id])
  const jump = (s: AgentSection) => {
    setSection(s)
    window.history.replaceState(null, "", `#${s}`)
  }

  // Names match the Figma design: MCP and Connectors are distinct (not a combined
  // "Actions"). Agent.actions holds tool ids; mcp_* are MCP servers, the rest are
  // connectors.
  const mcpAttached = (agent?.actions ?? []).filter((a) => a.startsWith("mcp"))
  const connectorAttached = (agent?.actions ?? []).filter((a) => !a.startsWith("mcp"))
  const completion: Record<AgentSection, boolean> = isNew
    ? { persona: false, stack: false, knowledge: false, mcp: false, connectors: false, deployment: false }
    : {
        persona: true,
        stack: true,
        knowledge: (agent?.knowledge.length ?? 0) > 0,
        mcp: mcpAttached.length > 0,
        connectors: connectorAttached.length > 0,
        deployment: deployedIn.length > 0,
      }

  // Persona now lives INSIDE the Deploy step (AgentDeploymentPanel owns its
  // state) — each deployment carries its own voice + prompt (2026-06-24).

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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Editor header — intentional full-bleed exception to PageHeader: the
          journey breadcrumb IS the header (identity h1 + the section stepper),
          the same pattern the Deploy wizard's stepper uses. */}
      <header className="border-b bg-background px-6 py-3 space-y-2">
        <div className="flex items-start justify-between gap-4">
          <AgentJourneyBreadcrumb
            agentName={agentName}
            status={agentLabel}
            active={section}
            completion={completion}
            onJump={jump}
          />

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/agents">
                <ArrowLeft className="h-3.5 w-3.5" /> Agents
              </Link>
            </Button>

            {/* Deploy is the breadcrumb's finish-line step — no redundant header
                CTA. The stepper's "Deploy" segment is the single go-live affordance. */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Agent actions">
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
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 font-mono">
            <Hash className="h-3 w-3" />
            {isNew ? "agt_draft" : id}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60" aria-hidden />
            800ms latency budget
          </span>
        </div>
      </header>

      {/* Body — section content on left, test panel on right. The journey
          breadcrumb in the header controls which section shows. */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
          <Tabs value={section} onValueChange={(v) => jump(v as AgentSection)} className="flex flex-col flex-1 min-h-0">

            {/* ── Stack — speed-vs-cost FIRST, vendors underneath ─────────── */}
            <TabsContent value="stack" className="flex-1 overflow-y-auto px-6 py-5 space-y-5 mt-0">
              {credAtRisk.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    <span className="font-medium">
                      This stack uses {credAtRisk.map((c) => c.vendor).join(", ")}, whose key is{" "}
                      {credAtRisk[0].status === "expired" ? "expired" : "expiring"}.
                    </span>{" "}
                    Live deployments on this agent will fail until it&apos;s rotated —{" "}
                    <Link href="/integrations?tab=credentials" className="underline underline-offset-2 hover:text-foreground">
                      rotate the key
                    </Link>
                    .
                  </p>
                </div>
              )}
              {/* Optimize for — lean metric pills (won a 5-prototype audit): pick a
                  goal, compare $/min · latency at a glance; vendors drill down below. */}
              <section className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Optimize for</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pick a goal — vendors are set for you. Drill into any of them below.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(STACK_PRESETS) as StackPreset[]).map((p) => {
                    const def = STACK_PRESETS[p]
                    const Icon = PRESET_ICON[p]
                    const selected = preset === p
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => applyPreset(p)}
                        aria-pressed={selected}
                        className={cn(
                          "flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors",
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:border-foreground/20",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                          <span className="text-sm font-medium">{def.label}</span>
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground">
                          ${STACK_ESTIMATE[p].costPerMin.toFixed(2)}/min · {LATENCY_BY_PRESET[p].e2eMs}ms
                        </span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">{STACK_PRESETS[preset].hint}</p>
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
                  <Link href="/integrations?tab=credentials" className="underline underline-offset-2 hover:text-foreground">
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
                manageHref="/integrations?tab=knowledge"
                manageLabel="Manage in Resources"
              />
            </TabsContent>

            {/* ── MCP — distinct from Connectors, per the design ──────────── */}
            <TabsContent value="mcp" className="flex-1 overflow-y-auto px-6 py-5 space-y-4 mt-0">
              <AttachPanel
                icon={Wrench}
                title="MCP servers"
                attached={mcpAttached}
                emptyHint="No MCP servers attached. Add one in Resources so the agent can act."
                manageHref="/integrations?tab=mcp"
                manageLabel="Manage in Resources"
              />
            </TabsContent>

            {/* ── Connectors ──────────────────────────────────────────────── */}
            <TabsContent value="connectors" className="flex-1 overflow-y-auto px-6 py-5 space-y-4 mt-0">
              <AttachPanel
                icon={Plug}
                title="Connectors"
                attached={connectorAttached}
                emptyHint="No connectors attached. Add Hubspot, Jira, and more in Resources."
                manageHref="/integrations?tab=connectors"
                manageLabel="Manage in Resources"
              />
            </TabsContent>

            {/* ── Deployment — where this agent is live + go-live (the finish line) ── */}
            <TabsContent value="deployment" className="flex-1 overflow-y-auto px-6 py-5 mt-0">
              <AgentDeploymentPanel id={id} agent={agent} />
            </TabsContent>
          </Tabs>
        </div>

        <AgentTestPanel
          title={agentName}
          state="Agent Disconnected"
          spec={{
            llm: llmVendor,
            asr: asrVendor,
            tts: ttsVendor,
            // A brand-new unsaved draft has never run — show em-dashes, not
            // measured-looking figures. Saved agents show the stack's per-provider
            // breakdown (ASR + LLM TTFT + TTS → end-to-end, with a best-case floor).
            latencyMs: isNew ? null : LATENCY_BY_PRESET[preset].e2eMs,
            ttftMs: isNew ? null : LATENCY_BY_PRESET[preset].llmMs,
            asrMs: isNew ? null : LATENCY_BY_PRESET[preset].asrMs,
            llmMs: isNew ? null : LATENCY_BY_PRESET[preset].llmMs,
            ttsMs: isNew ? null : LATENCY_BY_PRESET[preset].ttsMs,
            bestCaseMs: isNew ? null : LATENCY_BY_PRESET[preset].bestMs,
          }}
          onTest={handleTestAgent}
          onConfigure={() => jump("stack")}
        />
      </div>
    </div>
  )
}

// ─── helpers ────────────────────────────────────────────────────────────────

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
