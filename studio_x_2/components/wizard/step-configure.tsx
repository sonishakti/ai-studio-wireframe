"use client"

import * as React from "react"
import {
  Upload, Check, AlertTriangle, Plug, PhoneIncoming, Globe, ExternalLink, Radio,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CodeBlock } from "@/components/code-block"
import { ConfigCard, WebWidgetConfig } from "@/components/wizard/channel-configs"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import {
  MOCK_CSV_COLUMNS,
  outboundMissingVars,
  type InboundMode,
} from "@/lib/wizard-draft"
import type { StepProps } from "@/components/wizard/types"

/**
 * Step 4 — Configure. Branches on `draft.type`:
 *   • inbound  → phone number (telephony) OR web widget (embed)
 *   • outbound → caller-ID number + contacts CSV (with {{var}} validation)
 *   • code     → SDK/API snippets + Docs Center
 *
 * The prompt + greeting were set in Step 3 and are NOT re-asked here — this step
 * is purely about WHERE/HOW the agent runs. The agent id (for snippets) is the
 * draft's agentId or "new" until published.
 */
export function StepConfigure({ draft, update }: StepProps) {
  const agentId = draft.agentId ?? "new"

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Configure</h2>
        <p className="text-sm text-muted-foreground">
          {draft.type === "inbound" && "Choose how callers reach your agent."}
          {draft.type === "outbound" && "Attach a caller-ID phone number and your contacts."}
          {draft.type === "code" && "Drop the agent into your own app."}
        </p>
      </header>

      {draft.type === "inbound" && <InboundConfigure draft={draft} update={update} agentId={agentId} />}
      {draft.type === "outbound" && <OutboundConfigure draft={draft} update={update} />}
      {draft.type === "code" && <CodeConfigure agentId={agentId} />}
    </div>
  )
}

// ─── Inbound — phone number OR web widget ─────────────────────────────────────

function InboundConfigure({
  draft, update, agentId,
}: StepProps & { agentId: string }) {
  const mode: InboundMode = draft.config.inbound?.mode ?? "phone"
  const available = PHONE_NUMBERS.filter((n) => n.status === "unassigned")
  const setMode = (m: InboundMode) =>
    update({ config: { ...draft.config, inbound: { ...draft.config.inbound, mode: m } } })
  const setNumber = (numberId: string) =>
    update({ config: { ...draft.config, inbound: { mode, numberId } } })

  return (
    <div className="space-y-4">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && setMode(v as InboundMode)}
        className="grid grid-cols-2 gap-2"
      >
        <ToggleGroupItem value="phone" className="h-auto flex-col items-start gap-1 rounded-lg border border-border p-3 data-[state=on]:border-primary data-[state=on]:bg-primary/5">
          <span className="flex items-center gap-2 text-sm font-medium"><PhoneIncoming className="h-4 w-4" /> Phone number</span>
          <span className="text-xs font-normal text-muted-foreground">Answer calls 24/7</span>
        </ToggleGroupItem>
        <ToggleGroupItem value="web" className="h-auto flex-col items-start gap-1 rounded-lg border border-border p-3 data-[state=on]:border-primary data-[state=on]:bg-primary/5">
          <span className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4" /> Web widget</span>
          <span className="text-xs font-normal text-muted-foreground">Embed on your site</span>
        </ToggleGroupItem>
      </ToggleGroup>

      {mode === "phone" ? (
        <ConfigCard title="Answer a phone number">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Phone number</Label>
            <Select value={draft.config.inbound?.numberId ?? ""} onValueChange={setNumber}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Choose an available number" />
              </SelectTrigger>
              <SelectContent>
                {available.map((n) => (
                  <SelectItem key={n.id} value={n.id}>{n.number} · {n.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              No number free? Agora routes your own carrier number — connect one via SIP in Resources › Numbers.
            </p>
          </div>
        </ConfigCard>
      ) : (
        <WebWidgetConfig agentId={agentId} />
      )}
    </div>
  )
}

// ─── Outbound — caller-ID + contacts CSV with {{var}} validation ──────────────

function OutboundConfigure({ draft, update }: StepProps) {
  const available = PHONE_NUMBERS.filter((n) => n.status === "unassigned")
  const out = draft.config.outbound
  const setNumber = (numberId: string) =>
    update({ config: { ...draft.config, outbound: { ...out, numberId } } })
  const attachCsv = () => {
    update({ config: { ...draft.config, outbound: { ...out, csvName: "contacts.csv" } } })
    toast.success("contacts.csv attached", {
      description: `248 contacts · columns: ${MOCK_CSV_COLUMNS.join(", ")}`,
    })
  }

  const missing = outboundMissingVars(draft)
  const hasCsv = !!out?.csvName

  return (
    <ConfigCard title="Launch batch calls">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Caller-ID number</Label>
        <Select value={out?.numberId ?? ""} onValueChange={setNumber}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Choose the number to dial from" />
          </SelectTrigger>
          <SelectContent>
            {available.map((n) => (
              <SelectItem key={n.id} value={n.id}>{n.number} · {n.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Contacts</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={attachCsv}>
            <Upload className="h-3.5 w-3.5" /> {hasCsv ? "Replace CSV" : "Upload contacts CSV"}
          </Button>
          {hasCsv && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="h-3.5 w-3.5 text-primary" /> {out!.csvName}
            </span>
          )}
        </div>
        {hasCsv && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            <span className="text-xs text-muted-foreground">Columns:</span>
            {MOCK_CSV_COLUMNS.map((c) => (
              <Badge key={c} variant="outline" className="h-6 px-2 font-mono text-xs font-medium">{c}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Template validation — the prompt's {{vars}} must be supplied by the CSV. */}
      {hasCsv && (
        missing.length === 0 ? (
          <div className="flex items-start gap-2.5 rounded-md border border-success/40 bg-success/5 p-3">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
            <p className="text-xs leading-relaxed text-foreground">
              All prompt variables are covered by your CSV columns. Ready to deploy.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-foreground">
                Your contacts CSV is missing {missing.length} variable{missing.length > 1 ? "s" : ""}:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missing.map((v) => (
                  <Badge key={v} variant="outline" className="h-6 border-destructive/40 px-2 font-mono text-xs font-medium text-destructive">{`{{${v}}}`}</Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Fix it either way: add these as columns to your contacts CSV, or remove them from the system prompt. Deploy stays blocked until they match.
              </p>
            </div>
          </div>
        )
      )}

      <OutboundSettings draft={draft} update={update} />

      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2.5">
        <Plug className="h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {draft.mcp.length > 0
            ? `${draft.mcp.length} connector${draft.mcp.length > 1 ? "s" : ""} from the prompt step will run during calls.`
            : "Attach CRM/calendar connectors in the System prompt step to act during calls."}
        </p>
      </div>
    </ConfigCard>
  )
}

// Other outbound settings — call window, concurrency, retries. Stored on the
// DRAFT (not drawer-local state) so they survive close/reopen and appear in
// the row summary, review, and config JSON (heuristic-eval finding #7).
function OutboundSettings({ draft, update }: StepProps) {
  const out = draft.config.outbound
  const patch = (p: Partial<NonNullable<typeof out>>) =>
    update({ config: { ...draft.config, outbound: { ...out, ...p } } })
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Other settings</Label>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Call window</Label>
          <Select
            value={out?.callWindow ?? "business"}
            onValueChange={(v) => patch({ callWindow: v as "business" | "extended" | "anytime" })}
          >
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="business">Business hours (9–5)</SelectItem>
              <SelectItem value="extended">Extended (8–8)</SelectItem>
              <SelectItem value="anytime">Anytime</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Max concurrent</Label>
          <Select
            value={String(out?.maxConcurrent ?? 10)}
            onValueChange={(v) => patch({ maxConcurrent: Number(v) })}
          >
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["5", "10", "25", "50"].map((c) => <SelectItem key={c} value={c}>{c} calls</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Retry unanswered</Label>
          <Select
            value={String(out?.retries ?? 1)}
            onValueChange={(v) => patch({ retries: Number(v) })}
          >
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Don&apos;t retry</SelectItem>
              <SelectItem value="1">Once</SelectItem>
              <SelectItem value="2">Twice</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

// ─── Code — SDK/API snippets + Docs Center ────────────────────────────────────

function CodeConfigure({ agentId }: { agentId: string }) {
  const connect = `import { AgentClient } from "@agora/agent-sdk"

const client = new AgentClient({
  agentId: "${agentId}",
  apiKey: process.env.AGORA_API_KEY,
})

// Add the agent to a live Agora RTC channel
await client.joinChannel({ channel: "support-room" })`

  const stop = `// Stop the agent and leave the channel
await client.leaveChannel()
await client.stop()`

  return (
    <div className="space-y-4">
      <ConfigCard title="Add to your app">
        <p className="text-sm text-muted-foreground">
          Install the SDK, then drop the agent into any Agora channel. No phone number needed — it runs wherever your app does.
        </p>
        <CodeBlock language="bash" filename="install">npm install @agora/agent-sdk</CodeBlock>
        <CodeBlock language="typescript" filename="join.ts">{connect}</CodeBlock>
      </ConfigCard>

      <ConfigCard title="Stop the agent">
        <p className="text-sm text-muted-foreground">
          End the session when you&apos;re done — releases the channel and stops billing for it.
        </p>
        <CodeBlock language="typescript" filename="stop.ts">{stop}</CodeBlock>
      </ConfigCard>

      <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Radio className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-medium">Full SDK reference</p>
            <p className="text-xs text-muted-foreground">Channels, events, function calling, and more.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" asChild>
          <a href="https://docs.agora.io/en/" target="_blank" rel="noopener noreferrer">
            Docs Center <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </div>
    </div>
  )
}
