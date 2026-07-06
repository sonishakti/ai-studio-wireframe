"use client"

import * as React from "react"
import { Code2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { CodeBlock } from "@/components/code-block"
import { getVoiceArtifact } from "@/lib/voice-artifacts"
import { channelTarget, type AgentDraft } from "@/lib/wizard-draft"

/**
 * CustomConfigDrawer — the "</> Custom config" escape hatch (edit mode).
 *
 * Power users get the agent's full JSON — everything the wizard steps set,
 * assembled from the live draft — to eyeball, copy into the API, or diff.
 * The config is only assembled while the sheet is OPEN (it re-renders with
 * every draft keystroke otherwise), and the body is the standard CodeBlock,
 * which brings the copy button.
 */
export function CustomConfigDrawer({ draft }: { draft: AgentDraft }) {
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5">
          <Code2 className="h-4 w-4" aria-hidden /> Custom config
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Custom config</SheetTitle>
          <p className="text-sm text-muted-foreground">
            The full agent config as JSON — everything the steps set, in one place.
          </p>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <CodeBlock language="json" filename="agent-config.json">{json}</CodeBlock>
        </div>
      </SheetContent>
    </Sheet>
  )
}
