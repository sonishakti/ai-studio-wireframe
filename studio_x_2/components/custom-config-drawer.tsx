"use client"

import * as React from "react"
import { Code2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { CodeBlock } from "@/components/code-block"
import { getVoiceArtifact } from "@/lib/voice-artifacts"
import { channelTarget, type AgentDraft } from "@/lib/wizard-draft"

/**
 * CustomConfigDrawer — "View config (JSON)": the whole agent on one read-only
 * surface, in ANY mode (new draft included). Honest about what it is — nothing
 * here edits; each section links to the step that does (heuristic-eval #17).
 * The Get-code section exposes the SDK + widget snippets read-only so copying
 * an embed never requires switching the agent's channel (#12).
 */
export function CustomConfigDrawer({
  draft,
  onEditStep,
}: {
  draft: AgentDraft
  /** Jump to the wizard step that edits a JSON section. */
  onEditStep?: (step: number) => void
}) {
  const [open, setOpen] = React.useState(false)

  // Voice lookup hits localStorage and stringify walks the whole draft —
  // skip both for the (usual) closed state.
  const json = React.useMemo(() => {
    if (!open) return ""
    const voice = draft.voice ? getVoiceArtifact(draft.voice.id) : undefined
    const config = {
      agent_id: draft.agentId ?? "unpublished",
      name: draft.name || "Untitled agent",
      voice: voice
        ? { id: voice.id, name: voice.name, tts_voice: voice.ttsVoice, language: voice.language }
        : null,
      stack: draft.stack,
      type: draft.type,
      channel_target: draft.type ? channelTarget(draft) : null,
      system_prompt: draft.systemPrompt,
      greeting: draft.greeting,
      knowledge: draft.knowledge,
      connectors: draft.mcp,
      config: draft.config,
    }
    return JSON.stringify(config, null, 2)
  }, [open, draft])

  const agentId = draft.agentId ?? "your-agent-id"
  const sdkSnippet = `import { AgentClient } from "@agora/agent-sdk"

const client = new AgentClient({
  agentId: "${agentId}",
  apiKey: process.env.AGORA_API_KEY,
})

await client.joinChannel({ channel: "support-room" })`

  const widgetSnippet = `<script
  src="https://cdn.agora.io/agent-widget.js"
  data-agent-id="${agentId}"
  async
></script>`

  const sections: { label: string; step: number }[] = [
    { label: "Voice & models", step: 1 },
    { label: "Type & channel", step: 2 },
    { label: "Prompt & tools", step: 3 },
    { label: "Channel setup", step: 4 },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Code2 className="h-4 w-4" aria-hidden /> View config (JSON)
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">View config (JSON)</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Read-only — edit via the steps or the API. Everything the steps set, in one place.
          </p>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {onEditStep && (
            <div className="flex flex-wrap gap-1.5">
              {sections.map((s) => (
                <Button
                  key={s.step}
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
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
              For reference — copying these never changes how your agent is deployed.
            </p>
            <CodeBlock language="typescript" filename="sdk.ts">{sdkSnippet}</CodeBlock>
            <CodeBlock language="html" filename="widget.html">{widgetSnippet}</CodeBlock>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
