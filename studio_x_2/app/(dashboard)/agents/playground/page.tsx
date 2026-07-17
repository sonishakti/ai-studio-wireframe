"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AgentSphere } from "@/components/agent-test-panel"
import { StackConfig } from "@/components/wizard/stack-config"
import {
  newVoiceId,
  saveVoiceArtifact,
  getVoiceArtifact,
  takePlaygroundStack,
  type VoiceArtifact,
} from "@/lib/voice-artifacts"
import { stackFor, type AgentStack } from "@/lib/campaign-data"
import { toast } from "sonner"

/** The Playground's starting stack — the balanced cascade (mirrors
 *  EMPTY_DRAFT.stack). Voices with no saved stack fall back to this. */
const DEFAULT_STACK: AgentStack = { ...stackFor("balanced"), pipeline: "stt-llm-tts", language: "English" }

/** A legacy custom (saved before the engine moved here) has a ttsVoice but no
 *  stack — build one so its voice survives instead of snapping to the default. */
const legacyStack = (ttsVoice: string): AgentStack => ({ ...DEFAULT_STACK, tts: { vendor: "ElevenLabs", voice: ttsVoice } })

/**
 * Voice Playground — build or refine a CUSTOM voice (Step 1's "Create custom
 * voice" and a custom's "Edit" both land here; imports route here pre-filled).
 * "Create your custom voice" persists the artifact and returns to the wizard
 * with it selected (`/agents/new/edit?artifact=<id>`).
 */

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]

export default function PlaygroundPage() {
  const router = useRouter()
  const idRef = React.useRef<string>("")
  const [name, setName] = React.useState("")
  const [tagline, setTagline] = React.useState("")
  const [personality, setPersonality] = React.useState("")
  const [tone, setTone] = React.useState("Friendly")
  // Persona metadata carried through (the spoken language a deployed agent uses
  // is a builder Step-1 trait — not editable here, to avoid a write-only field).
  const [language, setLanguage] = React.useState("en-US")
  const [firstMessage, setFirstMessage] = React.useState("")
  const [source, setSource] = React.useState<string | undefined>()
  const [systemPrompt, setSystemPrompt] = React.useState<string | undefined>()
  // The engine + the specific TTS voice both live in the stack now.
  const [stack, setStack] = React.useState<AgentStack>(DEFAULT_STACK)
  const [speaking, setSpeaking] = React.useState(false)

  // Three ways in: ?artifact= edits an existing custom in place; ?from= forks a
  // preset into a NEW editable custom (the spec's "Edit Aria → custom artifact");
  // otherwise start a blank one.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const existing = params.get("artifact") ? getVoiceArtifact(params.get("artifact")!) : undefined
    const forkOf = params.get("from") ? getVoiceArtifact(params.get("from")!) : undefined
    // The builder that sent us here — exits return to IT, not to a fresh
    // create flow (re-eval #3: editing Aria then saving must land back on Aria).
    setOriginAgent(params.get("agent"))
    // The builder hands off the agent's CURRENT engine so a fork/new voice
    // starts from where the agent already runs (not a fresh Balanced) — a live
    // Fastest agent must not silently downgrade on save (stack-move review).
    const handoff = takePlaygroundStack()
    if (existing) {
      idRef.current = existing.id
      setName(existing.name)
      setTagline(existing.tagline)
      setPersonality(existing.personality)
      setTone(existing.tone)
      setLanguage(existing.language)
      setFirstMessage(existing.firstMessage)
      setSource(existing.source)
      setSystemPrompt(existing.systemPrompt)
      // Editing a saved custom: its OWN engine is authoritative.
      setStack(existing.stack ?? legacyStack(existing.ttsVoice))
    } else if (forkOf) {
      idRef.current = newVoiceId()
      setName(`${forkOf.name} (custom)`)
      setTagline(forkOf.tagline)
      setPersonality(forkOf.personality)
      setTone(forkOf.tone)
      setLanguage(forkOf.language)
      setFirstMessage(forkOf.firstMessage)
      setSource(`Customized from ${forkOf.name}`)
      setSystemPrompt(forkOf.systemPrompt)
      // Forking a preset: start from the agent's current engine (handoff),
      // then the preset's canonical, then Balanced.
      setStack(handoff ?? forkOf.stack ?? legacyStack(forkOf.ttsVoice))
    } else {
      idRef.current = newVoiceId()
      setName("My custom voice")
      setTagline("A voice I built")
      setPersonality("Warm, concise, and helpful.")
      setFirstMessage("Hi! How can I help you today?")
      if (handoff) setStack(handoff)
    }
  }, [])

  const [originAgent, setOriginAgent] = React.useState<string | null>(null)
  /** The originating builder's route ("new" or an agent id). */
  const originHref = (suffix: string) =>
    !originAgent || originAgent === "new"
      ? `/agents/new/edit${suffix}`
      : `/agents/${originAgent}/edit${suffix}`

  const create = () => {
    const artifact: VoiceArtifact = {
      id: idRef.current,
      name: name.trim() || "Custom voice",
      kind: "custom",
      tagline: tagline.trim() || "Custom voice",
      personality: personality.trim(),
      tone,
      language,
      firstMessage: firstMessage.trim() || "Hi! How can I help you today?",
      systemPrompt,
      // The engine (incl. its coherent TTS vendor + voice) rides with the voice.
      // ttsVoice mirrors stack.tts.voice so older readers still resolve a voice.
      ttsVoice: stack.tts.voice,
      stack,
      source: source ?? "Playground",
    }
    saveVoiceArtifact(artifact)
    toast.success(`${artifact.name} created`, { description: "Selected in your agent." })
    router.push(originHref(`?artifact=${artifact.id}`))
  }

  const playSample = () => {
    setSpeaking(true)
    toast("Playing sample", { description: `${name} · ${stack.tts.voice}` })
    window.setTimeout(() => setSpeaking(false), 2200)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => router.push(originHref("?step=3"))}
        >
          <ArrowLeft className="h-4 w-4" /> Back to your agent
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Voice playground</h1>
          {source && source !== "Playground" && (
            <Badge variant="secondary" className="font-normal">From {source}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Shape a custom voice: how it sounds, how it behaves, and the models behind it. Save it and it&apos;s selected back in your agent.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Editor */}
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pg-name" className="text-sm font-medium">Voice name</Label>
              <Input id="pg-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pg-tagline" className="text-sm font-medium">Tagline</Label>
              <Input id="pg-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One line that describes it" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pg-personality" className="text-sm font-medium">Personality</Label>
            <Textarea
              id="pg-personality"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="min-h-[88px] text-sm"
              placeholder="e.g. Warm, patient, solution-first. Never rushes the caller."
            />
          </div>

          {/* The TTS voice + spoken-language are NOT here: the voice lives in
              the coherent Models section below (vendor + voice together), and
              the deployed spoken language is a builder Step-1 trait. */}
          <div className="max-w-xs space-y-2">
            <Label className="text-sm font-medium">Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pg-greeting" className="text-sm font-medium">Opening line</Label>
            <Textarea
              id="pg-greeting"
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className="min-h-[64px] text-sm"
            />
          </div>

          {/* The engine behind the voice (2026-07-07: moved here from builder
              Step 1). The voice + language above own the TTS voice + language;
              this picks speed/cost and the STT/LLM/TTS vendors. */}
          <div className="border-t border-border pt-5">
            <StackConfig stack={stack} onChange={setStack} />
          </div>
        </div>

        {/* Preview */}
        <aside className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card/40 p-6 lg:sticky lg:top-6 lg:self-start">
          <Badge variant="secondary" className="max-w-full truncate px-3 py-1 text-xs">{name || "Custom voice"}</Badge>
          <p className="text-xs font-medium text-muted-foreground">{speaking ? "Speaking…" : "Preview"}</p>
          <AgentSphere size={120} active={speaking} />
          <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={playSample}>
            <Play className="h-3.5 w-3.5" /> Play sample
          </Button>
          <p className="line-clamp-3 text-center text-xs text-muted-foreground">
            &ldquo;{firstMessage || "Hi! How can I help you today?"}&rdquo;
          </p>
        </aside>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={() => router.push(originHref(""))}>Cancel</Button>
        <Button className="gap-1.5" onClick={create}>
          <Sparkles className="h-4 w-4" /> Create your custom voice
        </Button>
      </div>
    </div>
  )
}
