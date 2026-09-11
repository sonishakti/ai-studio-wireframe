"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { stackFor } from "@/lib/campaign-data"
import { newVoiceId, saveVoiceArtifact, type VoiceArtifact } from "@/lib/voice-artifacts"

/**
 * Add your own voice (Design Tracker 01, verdict D): an id, a name, an
 * unchecked consent, a scope line. Cloning happens at the vendor — the link
 * goes there. No fake verification, no "processing" theatre: Save writes a
 * custom VoiceArtifact and the caller selects it.
 */

export type OwnVoiceVendor = "ElevenLabs" | "Azure"

const CLONE_LINKS: Record<OwnVoiceVendor, string> = {
  ElevenLabs: "https://elevenlabs.io/app/voice-lab",
  Azure: "https://speech.microsoft.com/portal/customvoice",
}

/** Same persona seed the preset factory uses for a support generalist. */
function ownVoiceArtifact(vendor: OwnVoiceVendor, voiceId: string, name: string): VoiceArtifact {
  return {
    id: newVoiceId(),
    name,
    kind: "custom",
    tagline: `Your voice · ${vendor}`,
    personality: "Warm, concise, and professional. Solves first, escalates only when needed.",
    tone: "Friendly",
    language: "en-US",
    ttsVoice: voiceId,
    firstMessage: "Hi, thanks for calling. How can I help you today?",
    stack: { ...stackFor("balanced"), pipeline: "stt-llm-tts", language: "English", tts: { vendor, voice: voiceId } },
    provider: vendor,
    voiceId,
    source: "Your voice",
  }
}

export function OwnVoiceForm({
  vendor,
  onSave,
  onCancel,
}: {
  /** The active provider tab — decides the clone link and the saved provider. */
  vendor: OwnVoiceVendor
  onSave: (v: VoiceArtifact) => void
  onCancel: () => void
}) {
  const uid = React.useId()
  const [voiceId, setVoiceId] = React.useState("")
  const [name, setName] = React.useState("")
  const [consent, setConsent] = React.useState(false)
  const canSave = voiceId.trim().length > 0 && consent

  const save = () => {
    const id = voiceId.trim()
    onSave(saveVoiceArtifact(ownVoiceArtifact(vendor, id, name.trim() || id)))
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (canSave) save() }}
      className="space-y-3 border-b border-border pb-4"
      aria-label="Add your own voice"
    >
      <p className="text-sm font-medium">Add your own voice</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-id`} className="text-xs text-muted-foreground">Voice ID</Label>
          <Input
            id={`${uid}-id`}
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            className="font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${uid}-name`} className="text-xs text-muted-foreground">Name</Label>
          <Input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm"
            autoComplete="off"
          />
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            id={`${uid}-consent`}
            checked={consent}
            onCheckedChange={(c) => setConsent(c === true)}
          />
          <Label htmlFor={`${uid}-consent`} className="text-sm font-normal">
            I have the rights and consent to use this voice
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">Usable in this project only</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={!canSave}>Save voice</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <a
          href={CLONE_LINKS[vendor]}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Clone a voice at {vendor} ↗
        </a>
      </div>
    </form>
  )
}
