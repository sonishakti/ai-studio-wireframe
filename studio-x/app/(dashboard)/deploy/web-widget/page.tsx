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
import { PageHeader } from "@/components/page-header"
import { DeployContextBar } from "@/components/deploy-context-bar"
import { AGENTS } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Web Widget — config-left, live-preview-right (2026-06-15) ───────────────
//
// Third pass, per Figma 04_Deploy_Future_scope (847:17167): config is the main
// scroll on the left (agent picker leads, like /deploy/code), with a pinned
// 420px live-preview panel on the right showing the widget exactly as a
// visitor would see it — glow + agent avatar + greeting + one combined
// mic/end/chat input bar (the Figma "Chat-InputWidget").

type PreviewMode = "collapsed" | "widget"
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
  const [mode, setMode] = React.useState<PreviewMode>("widget")

  // ── config (the few things a Studio widget actually needs) ──
  const [interaction, setInteraction] = React.useState<InteractionMode>("voice+chat")
  const [palette, setPalette] = React.useState(PALETTES[0])
  const [blobStyle, setBlobStyle] = React.useState("Aura")
  const [cta, setCta] = React.useState("Try our Voice AI Agent")
  const [greeting, setGreeting] = React.useState("Hi there, I'm Agora Agent. How can I help you today?")
  const [listening, setListening] = React.useState("Agent Listening…")
  const [connecting, setConnecting] = React.useState("Connecting…")
  const [errorMsg, setErrorMsg] = React.useState("An error occurred.")
  const [requireTerms, setRequireTerms] = React.useState(false)

  // Pre-fill the agent when arriving from the Deploy chooser (?agent=…).
  React.useEffect(() => {
    const a = new URLSearchParams(window.location.search).get("agent")
    if (a && AGENTS.some((x) => x.id === a)) setAgentId(a)
  }, [])

  const allowVoice = interaction !== "chat"
  const allowChat = interaction !== "voice"

  const accent = palette.accent
  const iframe = `<iframe
  src="https://studio.agora.io/embed/${agentId}?token=PUBLIC_TOKEN"
  width="400" height="600" allow="microphone"
></iframe>`

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <DeployContextBar channelLabel="Web widget" />
      <PageHeader
        title="Web widget"
        actions={
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

      {/* config (left, main scroll) + live preview (right, pinned) */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 min-w-0 overflow-y-auto p-6 space-y-6">
          {/* Agent picker — leads, like /deploy/code */}
          <div className="space-y-1.5 w-full max-w-[360px]">
            <Label className="text-sm font-medium">
              Select Agent <span className="text-destructive">*</span>
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

          {/* Appearance */}
          <section className="space-y-3 max-w-[360px]">
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
          <section className="space-y-3 max-w-[360px]">
            <GroupLabel icon={Type} label="Text" />
            <Field label="Button label"><Input value={cta} onChange={(e) => setCta(e.target.value)} /></Field>
            <Field label="Greeting"><Input value={greeting} onChange={(e) => setGreeting(e.target.value)} /></Field>
            <Field label="Listening status"><Input value={listening} onChange={(e) => setListening(e.target.value)} /></Field>
            <Field label="Connecting status"><Input value={connecting} onChange={(e) => setConnecting(e.target.value)} /></Field>
            <Field label="Error message"><Input value={errorMsg} onChange={(e) => setErrorMsg(e.target.value)} /></Field>
          </section>

          {/* Behavior */}
          <section className="space-y-3 max-w-[360px]">
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
        </div>

        {/* Live preview — pinned right, 420px (Figma 04_Deploy_Future_scope) */}
        <aside className="hidden lg:flex w-[420px] shrink-0 flex-col border-l bg-muted/20">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-xs font-medium text-muted-foreground">Live preview</span>
            <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
              {([
                { id: "widget", label: "Widget" },
                { id: "collapsed", label: "Collapsed" },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "rounded px-2.5 h-6 text-xs font-medium transition-colors whitespace-nowrap",
                    mode === m.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center p-5">
            <WidgetPreview mode={mode} accent={accent} cta={cta} greeting={greeting} allowVoice={allowVoice} allowChat={allowChat} />
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── preview ─────────────────────────────────────────────────────────────────

function WidgetPreview({
  mode, accent, cta, greeting, allowVoice, allowChat,
}: {
  mode: PreviewMode; accent: string; cta: string; greeting: string; allowVoice: boolean; allowChat: boolean
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

  // widget — agent glow + greeting + combined Mic/End/Chat input bar
  return (
    <div className="relative flex h-[420px] w-[375px] flex-col items-center overflow-hidden rounded-xl border border-border bg-background shadow-xl">
      <div
        className="absolute left-1/2 top-[130px] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{ backgroundColor: accent, opacity: 0.35 }}
      />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-10 text-center">
        <div
          className="h-20 w-20 rounded-full"
          style={{ background: `radial-gradient(circle at 35% 30%, #ffffffcc, ${accent} 60%, #1b1b2b)`, boxShadow: `0 0 32px ${accent}66` }}
        />
        <p className="text-base leading-snug text-foreground">{greeting}</p>
      </div>
      <div className="flex items-center gap-2 pb-8">
        {allowVoice && (
          <span className="flex h-9 items-center gap-2 rounded-full bg-muted px-4">
            <Mic className="h-4 w-4" />
            <span className="flex items-end gap-0.5">
              {[5, 9, 6, 11, 4].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full bg-foreground/40" style={{ height: `${h}px` }} />
              ))}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        )}
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <X className="h-4 w-4" />
        </span>
        {allowChat && (
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border">
            <MessageSquare className="h-4 w-4" />
          </span>
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
