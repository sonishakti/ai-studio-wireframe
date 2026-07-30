"use client"

import * as React from "react"
import { Code2, Pencil, Check, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { CodeBlock } from "@/components/code-block"
import { getVoiceArtifact } from "@/lib/voice-artifacts"
import { channelTarget, enforceDirection, type AgentDraft, type CampaignDraft, type DeployChannel } from "@/lib/wizard-draft"

/**
 * CustomConfigDrawer — "Custom config": the whole agent as JSON. VIEW by default;
 * a power user can switch to EDIT and paste/tweak the JSON to build a fully
 * custom agent (Figma "Custom Config", User Story 2.0). Apply is guarded — it
 * merges only known editable keys into the draft and offers an Undo. The
 * Get-code section (SDK + widget snippets) stays read-only.
 */
export function CustomConfigDrawer({
  draft,
  onEditStep,
  onApply,
  iconOnly,
}: {
  draft: AgentDraft
  /** Jump to the wizard step that edits a JSON section. */
  onEditStep?: (step: number) => void
  /** Merge an edited-JSON patch into the draft (with the host's undo/autosave). */
  onApply?: (patch: Partial<AgentDraft>) => void
  /** Header (Figma "Shell Exploration") renders this as an icon-only 32px
   *  </> button; elsewhere it keeps its "Custom config" label. */
  iconOnly?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const onOpen = (e: Event) => { e.preventDefault(); setOpen(true) }
    window.addEventListener("sx:open-config-drawer", onOpen)
    return () => window.removeEventListener("sx:open-config-drawer", onOpen)
  }, [])

  // The canonical read-only view of the draft.
  const json = React.useMemo(() => {
    if (!open) return ""
    const voice = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
    const config: Record<string, unknown> = {
      agent_id: draft.agentId ?? "unpublished",
      name: draft.name || "Untitled agent",
      voice: voice
        ? { id: voice.id, name: voice.name, tts_voice: voice.ttsVoice, language: voice.language }
        : null,
      stack: draft.stack,
      channels: draft.channels,
      channel_target: draft.channels.length ? channelTarget(draft) : null,
      system_prompt: draft.systemPrompt,
      greeting: draft.greeting,
      failure_message: draft.failureMessage,
      knowledge: draft.knowledge,
      mcp: draft.mcp,
      connectors: draft.connectors,
      campaigns: draft.campaigns,
      config: draft.config,
    }
    if (draft.advanced) config.advanced = draft.advanced
    if (draft.analysis) config.analysis = draft.analysis
    if (draft.callBehavior) config.call_behavior = draft.callBehavior
    return JSON.stringify(config, null, 2)
  }, [open, draft])

  const startEdit = () => { setText(json); setError(null); setEditing(true) }
  const cancelEdit = () => { setEditing(false); setError(null) }
  const onText = (v: string) => {
    setText(v)
    try { JSON.parse(v); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : "Invalid JSON") }
  }
  const apply = () => {
    let parsed: Record<string, unknown>
    try { parsed = JSON.parse(text) as Record<string, unknown> }
    catch { setError("Invalid JSON"); return }
    onApply?.(toPatch(parsed)) // the host owns the applied/undo toast
    setEditing(false)
  }

  const agentId = draft.agentId ?? "your-agent-id"
  const sdkSnippet = `import { AgentClient } from "@agora/agent-sdk"

const client = new AgentClient({
  agentId: "${agentId}",
  appId: process.env.AGORA_APP_ID, // Project Settings › App ID
})

// uid: auto-assigned when omitted; pass your own to override.
await client.joinChannel({ channel: "support-room", uid: 9001 })`
  const widgetSnippet = `<script
  src="https://cdn.agora.io/agent-widget.js"
  data-agent-id="${agentId}"
  async
></script>`

  // v8 sections (2026-07-30): Voice & Models · Deployment · Prompt & knowledge · Test · Go Live.
  const sections: { label: string; step: number }[] = [
    { label: "Voice & Models", step: 1 },
    { label: "Deployment", step: 2 },
    { label: "Prompt & knowledge", step: 3 },
    { label: "Go Live", step: 5 },
  ]

  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) cancelEdit() }}>
      <SheetTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className="size-8" aria-label="Custom config (JSON)">
            <Code2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Code2 className="h-4 w-4" aria-hidden /> Custom config
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="text-base">Custom config</SheetTitle>
            {onApply && !editing && (
              <Button variant="outline" size="sm" className="gap-1.5" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit JSON
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {editing ? "Edit the JSON and apply it to your agent." : "The whole agent as JSON. Edit it, or copy the code."}
          </p>
        </SheetHeader>

        {editing ? (
          <>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <Textarea
                value={text}
                onChange={(e) => onText(e.target.value)}
                spellCheck={false}
                className="min-h-[420px] font-mono text-xs leading-relaxed"
                aria-label="Agent config JSON"
              />
              {error ? (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
                  <span className="text-foreground">Invalid JSON. <span className="text-muted-foreground">{error}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 p-3 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span className="text-muted-foreground">Valid JSON. These apply: name, system_prompt, greeting, failure_message, stack, channels, campaigns, knowledge, mcp, connectors, config, advanced, analysis, call_behavior. Voice is read-only here (pick it in the Voice & Models section).</span>
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
              <Button variant="ghost" size="sm" onClick={cancelEdit}>Cancel</Button>
              <Button size="sm" disabled={!!error} onClick={apply}>Apply to agent</Button>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {onEditStep && (
              <div className="flex flex-wrap gap-1.5">
                {sections.map((s) => (
                  <Button
                    key={s.step}
                    variant="outline"
                    size="sm"
                    className={cn("h-7 gap-1 text-xs")}
                    onClick={() => { setOpen(false); onEditStep(s.step) }}
                  >
                    <Pencil className="h-3 w-3" aria-hidden /> {s.label}
                  </Button>
                ))}
              </div>
            )}

            <CodeBlock language="json" filename="agent-config.json">{json}</CodeBlock>

            <section className="space-y-2">
              <p className="text-sm font-semibold">Get code</p>
              <p className="text-sm text-muted-foreground">
                For reference only. Copying these doesn&apos;t change your deployment.
              </p>
              <CodeBlock language="typescript" filename="sdk.ts">{sdkSnippet}</CodeBlock>
              <CodeBlock language="html" filename="widget.html">{widgetSnippet}</CodeBlock>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** A stack is only safe to apply if it carries the three engine sub-objects the
 *  rest of the app dereferences unconditionally (stackLine reads llm.model /
 *  asr.model / tts.voice). A partial stack from hand-edited JSON would white-screen
 *  the builder on the next render, so we reject it rather than apply it. */
function isValidStack(v: unknown): boolean {
  if (!v || typeof v !== "object") return false
  const s = v as Record<string, unknown>
  const ok = (o: unknown, key: string) =>
    !!o && typeof o === "object" && typeof (o as Record<string, unknown>)[key] === "string"
  return ok(s.llm, "model") && ok(s.asr, "model") && ok(s.tts, "voice")
}

/** Map an edited-JSON object to a guarded draft patch — only known, safe keys,
 *  so a typo'd or hostile field can't corrupt the draft. */
function toPatch(parsed: Record<string, unknown>): Partial<AgentDraft> {
  const p: Partial<AgentDraft> = {}
  const strArr = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : undefined)
  if (typeof parsed.name === "string") p.name = parsed.name
  if (typeof parsed.system_prompt === "string") p.systemPrompt = parsed.system_prompt
  if (typeof parsed.greeting === "string") p.greeting = parsed.greeting
  if (typeof parsed.failure_message === "string") p.failureMessage = parsed.failure_message
  const kn = strArr(parsed.knowledge); if (kn) p.knowledge = kn
  const mc = strArr(parsed.mcp); if (mc) p.mcp = mc
  const co = strArr(parsed.connectors); if (co) p.connectors = co
  if (Array.isArray(parsed.channels)) {
    // Direction rule holds for JSON edits too (inbound XOR batch).
    p.channels = enforceDirection((parsed.channels as unknown[]).filter(
      (c): c is DeployChannel => c === "inbound" || c === "batch" || c === "web" || c === "code",
    ), "inbound")
  }
  if (Array.isArray(parsed.campaigns)) {
    // Campaigns apply only when every entry carries the fields the Go Live
    // panel dereferences (id/name/status) — a partial row would break render.
    const ok = (parsed.campaigns as unknown[]).every(
      (c) => !!c && typeof c === "object" &&
        typeof (c as Record<string, unknown>).id === "string" &&
        typeof (c as Record<string, unknown>).name === "string" &&
        typeof (c as Record<string, unknown>).status === "string",
    )
    if (ok) p.campaigns = parsed.campaigns as CampaignDraft[]
  }
  if (isValidStack(parsed.stack)) p.stack = parsed.stack as AgentDraft["stack"]
  if (parsed.config && typeof parsed.config === "object") {
    // Sanitize per-field — a hand-typed `numberIds: "555"` would white-screen
    // the Channel section (numberIds.map), same guard class as isValidStack.
    const cfg = parsed.config as Record<string, unknown>
    const inbound = cfg.inbound && typeof cfg.inbound === "object" ? (cfg.inbound as Record<string, unknown>) : undefined
    const numberIds = Array.isArray(inbound?.numberIds)
      ? inbound.numberIds.filter((n): n is string => typeof n === "string")
      : undefined
    const surfaces = Array.isArray(inbound?.surfaces)
      ? (inbound.surfaces as unknown[]).filter((x): x is "phone" | "web" => x === "phone" || x === "web")
      : undefined
    const code = cfg.code && typeof cfg.code === "object" ? (cfg.code as Record<string, unknown>) : undefined
    p.config = {
      ...(numberIds || inbound ? { inbound: { numberIds: numberIds ?? [], ...(surfaces ? { surfaces } : {}) } } : {}),
      ...(code ? { code: { added: !!code.added } } : {}),
    }
  }
  if (parsed.advanced && typeof parsed.advanced === "object") p.advanced = parsed.advanced as AgentDraft["advanced"]
  if (parsed.analysis && typeof parsed.analysis === "object") p.analysis = parsed.analysis as AgentDraft["analysis"]
  if (parsed.call_behavior && typeof parsed.call_behavior === "object") p.callBehavior = parsed.call_behavior as AgentDraft["callBehavior"]
  return p
}
