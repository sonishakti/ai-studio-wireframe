"use client"

import * as React from "react"
import Link from "next/link"
import {
  Code2, ChevronDown, Mic, X, MessageSquare, Palette, Type, Settings2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DeployNav } from "@/components/deploy-nav"
import { AGENTS } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Web Widget — simplified (2026-06-12) ─────────────────────────────────────
//
// Second pass: the first port carried App Builder's *project* concepts
// ("ACME Customer Support — AI Widget", Product Information, a 6-section left
// nav). In Studio the widget simply puts AN AGENT on your site, so the agent
// picker leads (like /deploy/code) and everything else is one config scroll:
// Appearance · Text · Behavior. Preview left, config right, Embed to finish.

type PreviewMode = "collapsed" | "voice" | "chat"
type InteractionMode = "chat" | "voice" | "voice+chat"

// Brand palettes — user-selected widget colors (data, not app theme tokens).
const PALETTES = [
  { id: "cyan", label: "Agora Cyan", accent: "#3AB7E5" },
  { id: "indigo", label: "Indigo", accent: "#6366F1" },
  { id: "emerald", label: "Emerald", accent: "#10B981" },
  { id: "rose", label: "Rose", accent: "#F43F5E" },
  { id: "amber", label: "Amber", accent: "#F59E0B" },
]

const BLOB_STYLES = ["Aura", "Pulse", "Orbit", "Ripple", "Solid"]

export default function WebWidgetPage() {
  const [agentId, setAgentId] = React.useState(AGENTS[0].id)
  const [mode, setMode] = React.useState<PreviewMode>("voice")

  // ── config (the few things a Studio widget actually needs) ──
  const [interaction, setInteraction] = React.useState<InteractionMode>("voice+chat")
  const [palette, setPalette] = React.useState(PALETTES[0])
  const [blobStyle, setBlobStyle] = React.useState("Aura")
  const [cta, setCta] = React.useState("Try our Voice AI Agent")
  const [greeting, setGreeting] = React.useState("Hi there! How can I help you today?")
  const [listening, setListening] = React.useState("Agent Listening…")
  const [connecting, setConnecting] = React.useState("Connecting…")
  const [errorMsg, setErrorMsg] = React.useState("An error occurred.")
  const [requireTerms, setRequireTerms] = React.useState(false)

  // Pre-fill the agent when arriving from the Deploy chooser (?agent=…).
  React.useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("agent")
    if (a && AGENTS.some((x) => x.id === a)) setAgentId(a)
  }, [])

  // Interaction mode constrains which preview modes make sense.
  const allowVoice = interaction !== "chat"
  const allowChat = interaction !== "voice"
  React.useEffect(() => {
    if (mode === "voice" && !allowVoice) setMode(allowChat ? "chat" : "collapsed")
    if (mode === "chat" && !allowChat) setMode(allowVoice ? "voice" : "collapsed")
  }, [interaction, mode, allowVoice, allowChat])

  const accent = palette.accent
  const iframe = `<iframe
  src="https://studio.agora.io/embed/${agentId}?token=PUBLIC_TOKEN"
  width="400" height="600" allow="microphone"
></iframe>`

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DeployNav
        action={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/deploy/code?agent=${agentId}`}>Get code →</Link>
            </Button>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => { navigator.clipboard?.writeText(iframe); toast.success("Embed snippet copied") }}
            >
              <Code2 className="h-3.5 w-3.5" /> Embed
            </Button>
          </div>
        }
      />

      {/* Agent + preview-mode row */}
      <div className="flex items-end justify-between gap-4 border-b bg-background px-6 py-3 flex-wrap">
        <div className="space-y-1.5 w-64">
          <Label className="text-sm font-medium">
            AI Agent <span className="text-destructive">*</span>
          </Label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {AGENTS.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pb-0.5">
          <span className="text-xs text-muted-foreground">Preview:</span>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
            {([
              { id: "collapsed", label: "Collapsed", on: true },
              { id: "voice", label: "Voice", on: allowVoice },
              { id: "chat", label: "Chat", on: allowChat },
            ] as const).map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!m.on}
                onClick={() => setMode(m.id)}
                className={cn(
                  "rounded px-2.5 h-6 text-xs font-medium transition-colors whitespace-nowrap",
                  mode === m.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                  !m.on && "opacity-40 cursor-not-allowed",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-pane: preview + one config scroll */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex items-center justify-center bg-muted/20 p-8 min-w-0 overflow-auto">
          <WidgetPreview mode={mode} accent={accent} cta={cta} greeting={greeting} allowChat={allowChat} />
        </div>

        <aside className="w-80 shrink-0 border-l bg-background overflow-y-auto p-4 space-y-6">
          {/* Appearance */}
          <section className="space-y-3">
            <GroupLabel icon={Palette} label="Appearance" />
            <Field label="Color">
              <div className="flex flex-wrap gap-2">
                {PALETTES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPalette(p)}
                    title={p.label}
                    className={cn(
                      "h-8 w-12 rounded-md border-2 transition-all",
                      palette.id === p.id ? "border-foreground scale-105" : "border-transparent",
                    )}
                    style={{ backgroundColor: p.accent }}
                  />
                ))}
              </div>
            </Field>
            <Field label="Voice blob style">
              <Select value={blobStyle} onValueChange={setBlobStyle}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOB_STYLES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </section>

          {/* Text */}
          <section className="space-y-3">
            <GroupLabel icon={Type} label="Text" />
            <Field label="Button label"><Input value={cta} onChange={(e) => setCta(e.target.value)} /></Field>
            <Field label="Greeting"><Input value={greeting} onChange={(e) => setGreeting(e.target.value)} /></Field>
            <Field label="Listening status"><Input value={listening} onChange={(e) => setListening(e.target.value)} /></Field>
            <Field label="Connecting status"><Input value={connecting} onChange={(e) => setConnecting(e.target.value)} /></Field>
            <Field label="Error message"><Input value={errorMsg} onChange={(e) => setErrorMsg(e.target.value)} /></Field>
          </section>

          {/* Behavior */}
          <section className="space-y-3">
            <GroupLabel icon={Settings2} label="Behavior" />
            <Field label="Interaction mode">
              <Select value={interaction} onValueChange={(v) => setInteraction(v as InteractionMode)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chat">Chat Only</SelectItem>
                  <SelectItem value="voice">Voice Only</SelectItem>
                  <SelectItem value="voice+chat">Voice and Chat</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">Terms and Conditions</p>
                <p className="text-xs text-muted-foreground">Require visitors to accept terms before talking.</p>
              </div>
              <Switch checked={requireTerms} onCheckedChange={setRequireTerms} />
            </div>
            <p className="text-xs text-muted-foreground">
              Allowed domains and what the agent says are set on the widget&apos;s{" "}
              <Link href="/deploy/inbound" className="underline underline-offset-2 hover:text-foreground">
                inbound deployment
              </Link>.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

// ─── preview ─────────────────────────────────────────────────────────────────

function WidgetPreview({
  mode, accent, cta, greeting, allowChat,
}: {
  mode: PreviewMode; accent: string; cta: string; greeting: string; allowChat: boolean
}) {
  if (mode === "collapsed") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-background shadow-lg">
          <span className="h-5 w-5 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff6, ${accent})` }} />
          <span className="text-sm font-medium">{cta}</span>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Powered by Agora&apos;s <span style={{ color: accent }}>Conversational AI</span>
        </p>
      </div>
    )
  }

  if (mode === "chat") {
    return (
      <div className="flex w-[360px] flex-col rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="h-6 w-6 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #fff8, ${accent})` }} />
          <span className="text-sm font-medium">Agora Agent</span>
        </div>
        <div className="flex flex-col gap-2 p-4 h-[320px]">
          <div className="self-start max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">{greeting}</div>
          <div className="self-end max-w-[80%] rounded-2xl rounded-tr-sm px-3 py-2 text-sm text-white" style={{ backgroundColor: accent }}>
            What are your support hours?
          </div>
        </div>
        <div className="flex items-center gap-2 border-t px-3 py-2">
          <div className="flex-1 rounded-full bg-muted px-3 py-2 text-xs text-muted-foreground">Type a message…</div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ backgroundColor: accent }}>
            <MessageSquare className="h-4 w-4" />
          </span>
        </div>
      </div>
    )
  }

  // voice
  return (
    <div className="flex w-[300px] flex-col items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-xl">
      <div
        className="h-24 w-24 rounded-full"
        style={{ background: `radial-gradient(circle at 35% 30%, #ffffffcc, ${accent} 60%, #1b1b2b)`, boxShadow: `0 0 32px ${accent}66` }}
      />
      <p className="text-center text-sm text-foreground">{greeting}</p>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
          <Mic className="h-4 w-4" /> <ChevronDown className="h-3 w-3" />
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><X className="h-4 w-4" /></span>
        {allowChat && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted"><MessageSquare className="h-4 w-4" /></span>
        )}
      </div>
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function GroupLabel({ icon: Icon, label }: { icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </p>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}
