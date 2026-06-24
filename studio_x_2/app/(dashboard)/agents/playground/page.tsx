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
import {
  newVoiceId,
  saveVoiceArtifact,
  getVoiceArtifact,
  type VoiceArtifact,
} from "@/lib/voice-artifacts"
import { toast } from "sonner"

/**
 * Voice Playground — build or refine a CUSTOM voice (Step 1's "Create custom
 * voice" and a custom's "Edit" both land here; imports route here pre-filled).
 * "Create your custom voice" persists the artifact and returns to the wizard
 * with it selected (`/agents/new/edit?artifact=<id>`).
 */

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]
const TTS_VOICES = ["rachel", "adam", "bella", "josh", "sky", "river"]

export default function PlaygroundPage() {
  const router = useRouter()
  const idRef = React.useRef<string>("")
  const [name, setName] = React.useState("")
  const [tagline, setTagline] = React.useState("")
  const [personality, setPersonality] = React.useState("")
  const [tone, setTone] = React.useState("Friendly")
  const [language, setLanguage] = React.useState("en-US")
  const [ttsVoice, setTtsVoice] = React.useState("rachel")
  const [firstMessage, setFirstMessage] = React.useState("")
  const [source, setSource] = React.useState<string | undefined>()
  const [systemPrompt, setSystemPrompt] = React.useState<string | undefined>()
  const [speaking, setSpeaking] = React.useState(false)

  // Load an existing custom (edit / returning import) or mint a fresh id.
  React.useEffect(() => {
    const artifactId = new URLSearchParams(window.location.search).get("artifact")
    const existing = artifactId ? getVoiceArtifact(artifactId) : undefined
    if (existing) {
      idRef.current = existing.id
      setName(existing.name)
      setTagline(existing.tagline)
      setPersonality(existing.personality)
      setTone(existing.tone)
      setLanguage(existing.language)
      setTtsVoice(existing.ttsVoice)
      setFirstMessage(existing.firstMessage)
      setSource(existing.source)
      setSystemPrompt(existing.systemPrompt)
    } else {
      idRef.current = newVoiceId()
      setName("My custom voice")
      setTagline("A voice I built")
      setPersonality("Warm, concise, and helpful.")
      setFirstMessage("Hi! How can I help you today?")
    }
  }, [])

  const create = () => {
    const artifact: VoiceArtifact = {
      id: idRef.current,
      name: name.trim() || "Custom voice",
      kind: "custom",
      tagline: tagline.trim() || "Custom voice",
      personality: personality.trim(),
      tone,
      language,
      ttsVoice,
      firstMessage: firstMessage.trim() || "Hi! How can I help you today?",
      systemPrompt,
      source: source ?? "Playground",
    }
    saveVoiceArtifact(artifact)
    toast.success(`${artifact.name} created`, { description: "Selected in your agent." })
    router.push(`/agents/new/edit?artifact=${artifact.id}`)
  }

  const playSample = () => {
    setSpeaking(true)
    toast("Playing sample", { description: `${name} · ${ttsVoice}` })
    window.setTimeout(() => setSpeaking(false), 2200)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={() => router.push("/agents/new/edit")}
        >
          <ArrowLeft className="h-4 w-4" /> Back to creation
        </Button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Voice playground</h1>
          {source && source !== "Playground" && (
            <Badge variant="secondary" className="font-normal">From {source}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Shape a custom voice — how it sounds and how it behaves. Save it and it&apos;s selected back in your agent.
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

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">TTS voice</Label>
              <Select value={ttsVoice} onValueChange={setTtsVoice}>
                <SelectTrigger className="text-sm capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TTS_VOICES.map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tone</Label>
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
            <Label htmlFor="pg-greeting" className="text-sm font-medium">Opening line</Label>
            <Textarea
              id="pg-greeting"
              value={firstMessage}
              onChange={(e) => setFirstMessage(e.target.value)}
              className="min-h-[64px] text-sm"
            />
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
        <Button variant="ghost" onClick={() => router.push("/agents/new/edit")}>Cancel</Button>
        <Button className="gap-1.5" onClick={create}>
          <Sparkles className="h-4 w-4" /> Create your custom voice
        </Button>
      </div>
    </div>
  )
}
