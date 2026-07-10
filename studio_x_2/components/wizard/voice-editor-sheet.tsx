"use client"

import * as React from "react"
import { Play, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  newVoiceId, saveVoiceArtifact, type VoiceArtifact,
} from "@/lib/voice-artifacts"
import type { AgentStack } from "@/lib/campaign-data"

/**
 * VoiceEditorSheet — create, fork, or edit a custom voice WITHOUT leaving the
 * builder (owner 2026-07-09: "everything accessible within this page"). It
 * replaces the /agents/playground round-trip for the Step-1 flows.
 *
 * It edits the PERSONA only (name, tagline, personality, tone, opening line).
 * The engine is no longer duplicated here: Step 1 renders StackConfig inline
 * and owns `draft.stack`, so the sheet SNAPSHOTS that stack onto the saved
 * artifact. One engine, one place to edit it.
 *
 * Presets are IMMUTABLE: editing one forks a new custom (mode="fork"), matching
 * the Playground's original rule.
 */

export type VoiceEditorMode =
  | { kind: "create" }
  | { kind: "fork"; from: VoiceArtifact }
  | { kind: "edit"; artifact: VoiceArtifact }

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]

export function VoiceEditorSheet({
  mode,
  stack,
  onClose,
  onSaved,
}: {
  /** null = closed. */
  mode: VoiceEditorMode | null
  /** The agent's current engine — snapshotted onto the saved artifact. */
  stack: AgentStack
  onClose: () => void
  onSaved: (v: VoiceArtifact) => void
}) {
  const open = mode !== null
  const [name, setName] = React.useState("")
  const [tagline, setTagline] = React.useState("")
  const [personality, setPersonality] = React.useState("")
  const [tone, setTone] = React.useState("Friendly")
  const [firstMessage, setFirstMessage] = React.useState("")

  // Seed the form each time the sheet target changes (create / fork / edit).
  React.useEffect(() => {
    if (!mode) return
    if (mode.kind === "edit") {
      const a = mode.artifact
      setName(a.name); setTagline(a.tagline); setPersonality(a.personality)
      setTone(a.tone); setFirstMessage(a.firstMessage)
    } else if (mode.kind === "fork") {
      const f = mode.from
      setName(`${f.name} (custom)`); setTagline(f.tagline); setPersonality(f.personality)
      setTone(f.tone); setFirstMessage(f.firstMessage)
    } else {
      setName("My custom voice"); setTagline("A voice I built")
      setPersonality("Warm, concise, and helpful."); setTone("Friendly")
      setFirstMessage("Hi! How can I help you today?")
    }
  }, [mode])

  const canSave = name.trim().length > 0

  const save = () => {
    if (!mode) return
    const base =
      mode.kind === "edit" ? mode.artifact
      : mode.kind === "fork" ? mode.from
      : undefined
    const artifact: VoiceArtifact = {
      // Editing a custom keeps its id; creating or FORKING a preset mints a new
      // one (presets are immutable).
      id: mode.kind === "edit" ? mode.artifact.id : newVoiceId(),
      name: name.trim() || "Custom voice",
      kind: "custom",
      tagline: tagline.trim() || "Custom voice",
      personality: personality.trim(),
      tone,
      language: base?.language ?? "en-US",
      firstMessage: firstMessage.trim() || "Hi! How can I help you today?",
      systemPrompt: base?.systemPrompt,
      // The engine rides with the voice, but it's EDITED in Step 1 — snapshot it.
      // ttsVoice mirrors stack.tts.voice so older readers still resolve a voice.
      ttsVoice: stack.tts.voice,
      stack,
      source:
        mode.kind === "fork" ? `Customized from ${mode.from.name}`
        : mode.kind === "edit" ? (mode.artifact.source ?? "Custom")
        : "Custom",
    }
    saveVoiceArtifact(artifact)
    toast.success(
      mode.kind === "edit" ? `${artifact.name} saved` : `${artifact.name} created`,
      { description: "Selected in your agent." },
    )
    onSaved(artifact)
  }

  const title =
    mode?.kind === "edit" ? "Edit voice"
    : mode?.kind === "fork" ? `Customize ${mode.from.name}`
    : "Create a custom voice"

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            {mode?.kind === "fork"
              ? "Ready-made voices can't be changed, so this saves a copy you own."
              : "How it sounds and behaves. Its models are set in Models & speed, on this page."}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ve-name" className="text-sm font-medium">Voice name</Label>
              <Input id="ve-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ve-tagline" className="text-sm font-medium">Tagline</Label>
              <Input id="ve-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line that describes it" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ve-personality" className="text-sm font-medium">Personality</Label>
            <Textarea
              id="ve-personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="min-h-[88px] text-sm"
              placeholder="e.g. Warm, patient, solution-first. Never rushes the caller."
            />
          </div>

          <div className="max-w-xs space-y-1.5">
            <Label className="text-sm font-medium">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ve-opening" className="text-sm font-medium">Opening line</Label>
            <Textarea
              id="ve-opening"
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className="min-h-[64px] text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Seeds the agent&apos;s greeting only while that field is still empty.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/30 px-3 py-2.5">
            <p className="min-w-0 text-xs text-muted-foreground">
              Saved with your current engine: <span className="font-mono">{stack.tts.voice}</span> on {stack.tts.vendor}.
            </p>
            <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => toast(`Playing a sample of ${name || "this voice"}`)}>
              <Play className="h-3.5 w-3.5" aria-hidden /> Sample
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="gap-1.5" disabled={!canSave} onClick={save}>
            <Sparkles className="h-4 w-4" aria-hidden />
            {mode?.kind === "edit" ? "Save voice" : "Create voice"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
