"use client"

import * as React from "react"
import Link from "next/link"
import {
  Info, Palette, Waves, MessageSquareText, Bot, Settings2,
  Eye, Save, Download, Code2, ChevronDown, Mic, X, MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { DeployNav } from "@/components/deploy-nav"
import { AGENTS } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

// ─── Web Widget builder (App Builder Console, Figma 540:36057) ───────────────
//
// A 3-pane studio: section nav (left) · live preview (center) · config (right).
// Configures the embeddable Agora AI widget — theme, voice blob, content, and
// the agent it runs — then Save / Download Code / Embed. Lives as a Deploy tab
// so "where do I configure a web-widget deployment?" has a first-class home.

type Section = "product" | "theme" | "blob" | "content" | "agent" | "config"
type PreviewMode = "collapsed" | "voice" | "chat"
type InteractionMode = "chat" | "voice" | "voice+chat"

const NAV: { group: string; items: { id: Section; label: string; icon: React.ComponentType<{ className?: string }> }[] }[] = [
  { group: "General", items: [{ id: "product", label: "Product Information", icon: Info }] },
  {
    group: "Branding",
    items: [
      { id: "theme", label: "Theme", icon: Palette },
      { id: "blob", label: "Voice Blob", icon: Waves },
      { id: "content", label: "Content", icon: MessageSquareText },
    ],
  },
  {
    group: "App Features",
    items: [
      { id: "agent", label: "AI Agent", icon: Bot },
      { id: "config", label: "Configuration", icon: Settings2 },
    ],
  },
]

// Brand palettes — user-selected colors (data, not app theme tokens).
const PALETTES = [
  { id: "cyan", label: "Agora Cyan", accent: "#3AB7E5" },
  { id: "indigo", label: "Indigo", accent: "#6366F1" },
  { id: "emerald", label: "Emerald", accent: "#10B981" },
  { id: "rose", label: "Rose", accent: "#F43F5E" },
  { id: "amber", label: "Amber", accent: "#F59E0B" },
]

const BLOB_STYLES = ["Aura", "Pulse", "Orbit", "Ripple", "Solid"]

export default function WebWidgetBuilderPage() {
  const [section, setSection] = React.useState<Section>("product")
  const [mode, setMode] = React.useState<PreviewMode>("voice")

  // ── config state ──
  const [projectName, setProjectName] = React.useState("ACME Customer Support")
  const [projectDesc, setProjectDesc] = React.useState("")
  const [interaction, setInteraction] = React.useState<InteractionMode>("voice+chat")
  const [palette, setPalette] = React.useState(PALETTES[0])
  const [blobStyle, setBlobStyle] = React.useState("Aura")
  const [agentId, setAgentId] = React.useState(AGENTS[0].id)
  const [cta, setCta] = React.useState("Try our Voice AI Agent")
  const [greeting, setGreeting] = React.useState("Hi there, I'm Agora Agent. How can I help you today?")
  const [listening, setListening] = React.useState("Agent Listening…")
  const [connecting, setConnecting] = React.useState("Connecting…")
  const [errorMsg, setErrorMsg] = React.useState("An error occurred.")
  const [requireTerms, setRequireTerms] = React.useState(false)

  // Interaction mode constrains which preview modes are available.
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
      <DeployNav />

      {/* Builder top bar */}
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 h-12 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium truncate">{projectName || "Untitled widget"}</span>
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            AI Widget
          </span>
        </div>

        {/* Page mode toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Page:</span>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
            {([
              { id: "collapsed", label: "Collapsed", on: true },
              { id: "voice", label: "Voice Mode", on: allowVoice },
              { id: "chat", label: "Chat Mode", on: allowChat },
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

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Preview"><Eye className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Widget saved")}>
            <Save className="h-3.5 w-3.5" /> Save
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <Link href={`/deploy/code?agent=${agentId}`}><Download className="h-3.5 w-3.5" /> Download Code</Link>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => { navigator.clipboard?.writeText(iframe); toast.success("Embed snippet copied") }}>
            <Code2 className="h-3.5 w-3.5" /> Embed
          </Button>
        </div>
      </div>

      {/* 3-pane body */}
      <div className="flex flex-1 min-h-0">
        {/* Left — section nav */}
        <nav className="w-56 shrink-0 border-r bg-background overflow-y-auto p-3 space-y-4">
          {NAV.map((grp) => (
            <div key={grp.group} className="space-y-1">
              <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{grp.group}</p>
              {grp.items.map((it) => {
                const active = section === it.id
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setSection(it.id)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                      active ? "bg-accent text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                    )}
                  >
                    <it.icon className="h-4 w-4 shrink-0" /> {it.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Center — live preview */}
        <div className="flex-1 flex items-center justify-center bg-muted/20 p-8 min-w-0 overflow-auto">
          <WidgetPreview
            mode={mode}
            accent={accent}
            cta={cta}
            greeting={greeting}
            allowChat={allowChat}
          />
        </div>

        {/* Right — config panel */}
        <aside className="w-80 shrink-0 border-l bg-background overflow-y-auto">
          <div className="border-b px-4 py-3">
            <p className="text-sm font-medium">
              {section === "product" && "Product information"}
              {section === "theme" && "Theme"}
              {section === "blob" && "Customize Voice Blob"}
              {section === "content" && "Configure Widget Agent"}
              {section === "agent" && "AI Agent"}
              {section === "config" && "Configuration"}
            </p>
          </div>
          <div className="p-4 space-y-5">
            {section === "product" && (
              <>
                <Field label="Project Name">
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
                </Field>
                <Field label="Project Description">
                  <Textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="Type your Project Description here."
                    className="min-h-[88px] text-sm"
                  />
                </Field>
                <Field label="Interaction Mode">
                  <Select value={interaction} onValueChange={(v) => setInteraction(v as InteractionMode)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chat">Chat Only</SelectItem>
                      <SelectItem value="voice">Voice Only</SelectItem>
                      <SelectItem value="voice+chat">Voice and Chat</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}

            {section === "theme" && (
              <>
                <Field label="Select a color palette">
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
                <Accordion label="Add your Branding" />
                <Accordion label="UI Elements" />
                <Accordion label="Semantic Colors" />
              </>
            )}

            {section === "blob" && (
              <>
                <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
                  <span className="flex-1 rounded bg-primary/10 text-primary text-center text-xs font-medium py-1">Presets</span>
                  <span className="flex-1 text-center text-xs font-medium text-muted-foreground py-1">Custom</span>
                </div>
                <Field label="Blob Style">
                  <Select value={blobStyle} onValueChange={setBlobStyle}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BLOB_STYLES.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <p className="text-xs text-muted-foreground">
                  The animated orb shown while the agent listens and speaks. Switch to Voice Mode to preview.
                </p>
              </>
            )}

            {section === "content" && (
              <>
                <Field label="CTA Label"><Input value={cta} onChange={(e) => setCta(e.target.value)} /></Field>
                <Field label="Greeting"><Input value={greeting} onChange={(e) => setGreeting(e.target.value)} /></Field>
                <Field label="Listening Status"><Input value={listening} onChange={(e) => setListening(e.target.value)} /></Field>
                <Field label="Connecting Status"><Input value={connecting} onChange={(e) => setConnecting(e.target.value)} /></Field>
                <Field label="Error Message"><Input value={errorMsg} onChange={(e) => setErrorMsg(e.target.value)} /></Field>
                <div className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Terms and Conditions</p>
                    <p className="text-xs text-muted-foreground">Require callers to accept terms before call.</p>
                  </div>
                  <Switch checked={requireTerms} onCheckedChange={setRequireTerms} />
                </div>
              </>
            )}

            {section === "agent" && (
              <>
                <Field label="Agent">
                  <Select value={agentId} onValueChange={setAgentId}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AGENTS.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <p className="text-xs text-muted-foreground">
                  The reusable agent this widget runs. Edit its persona and stack on the{" "}
                  <Link href={`/agents/${agentId}/edit`} className="underline underline-offset-2 hover:text-foreground">agent</Link>.
                  The widget&apos;s prompt is this inbound deployment&apos;s prompt.
                </p>
              </>
            )}

            {section === "config" && (
              <p className="text-xs text-muted-foreground">
                Advanced: allowed domains, session limits, and rate limiting. Configured per
                deployment in{" "}
                <Link href="/deploy/inbound" className="underline underline-offset-2 hover:text-foreground">Inbound</Link>.
              </p>
            )}
          </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
    </div>
  )
}

function Accordion({ label }: { label: string }) {
  return (
    <button type="button" className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm hover:bg-accent/50 transition-colors">
      <span className="font-medium">{label}</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" />
    </button>
  )
}
