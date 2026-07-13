"use client"

import * as React from "react"
import {
  Bot, ChevronDown, Code2, Copy, ImagePlus, Info, Mic, MessageSquareText, RotateCcw, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { AgentSphere } from "@/components/agent-test-panel"
import { AGENTS } from "@/lib/campaign-data"

/**
 * WidgetStudio — Deploy › Web Widget (Figma 847-17167, "04_Deploy_Web_Widget
 * (From_App_Builder)"). The missing page: a two-column widget configurator —
 * config sections on the left (Behaviour · Appearance · Text · Branding ·
 * Semantic Colors · Input Fields · UI Elements), a live preview on the right
 * (Collapsed · Voice Mode · Chat Mode), and Get Code / Embed actions that copy
 * the snippet.
 *
 * The preview's colors are USER CONFIG (data, not chrome) — inline styles are
 * correct there; the studio chrome itself stays on design tokens.
 * Figma defect flagged, not adopted: placeholder "An error occured" → we ship
 * "An error occurred". The frame's sidebar shows the pre-revamp IA — per the
 * standing rule, Figma page CONTENT is canonical, its sidebar is not.
 */

interface WidgetConfig {
  interactionMode: "voice-chat" | "voice" | "chat"
  theme: "dark" | "light"
  blobStyle: "aura" | "orb" | "pulse"
  buttonLabel: string
  greeting: string
  listeningStatus: string
  connectingStatus: string
  errorMessage: string
  brandColor: string
  brandTextColor: string
  fontColor: string
  secondaryColor: string
  bgColor: string
  // Semantic colors
  successColor: string
  warningColor: string
  errorColor: string
  // Input fields
  inputBg: string
  inputPlaceholder: string
  inputRadius: number
  // UI elements
  showMic: boolean
  showChat: boolean
  showClose: boolean
  poweredBy: boolean
}

const DEFAULTS: WidgetConfig = {
  interactionMode: "voice-chat",
  theme: "dark",
  blobStyle: "aura",
  buttonLabel: "Try our Voice AI Agent",
  greeting: "Hi there, I'm Agora Agent. How can I help you today?",
  listeningStatus: "Agent Listening…",
  connectingStatus: "Connecting…",
  errorMessage: "An error occurred",
  brandColor: "#099DFD",
  brandTextColor: "#FFFFFF",
  fontColor: "#333333",
  secondaryColor: "#19394D",
  bgColor: "#111111",
  successColor: "#22C55E",
  warningColor: "#F59E0B",
  errorColor: "#EF4444",
  inputBg: "#1D1F23",
  inputPlaceholder: "Type a message…",
  inputRadius: 8,
  showMic: true,
  showChat: true,
  showClose: true,
  poweredBy: true,
}

type PreviewMode = "collapsed" | "voice" | "chat"

export function WidgetStudio() {
  const liveAgents = AGENTS.filter((a) => a.status === "live")
  const [agentId, setAgentId] = React.useState(liveAgents[0]?.id ?? AGENTS[0].id)
  const [cfg, setCfg] = React.useState<WidgetConfig>(DEFAULTS)
  const [mode, setMode] = React.useState<PreviewMode>("collapsed")
  const set = <K extends keyof WidgetConfig>(k: K, v: WidgetConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }))

  const snippet = `<script
  src="https://cdn.agora.io/agent-widget.js"
  data-agent-id="${agentId}"
  data-mode="${cfg.interactionMode}"
  data-theme="${cfg.theme}"
  data-blob="${cfg.blobStyle}"
  data-label="${cfg.buttonLabel}"
  data-brand-color="${cfg.brandColor}"
  async
></script>`

  const copySnippet = () => {
    void navigator.clipboard?.writeText(snippet).catch(() => {})
    toast("Embed snippet copied", {
      description: "Paste it before </body> on any page.",
    })
  }

  return (
    <main className="flex flex-1 flex-col" data-fluid>
      {/* ── Header: agent picker + embed actions ─────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-6 py-4">
        <div className="w-full max-w-xs space-y-1.5">
          <Label className="text-xs text-muted-foreground">Select Agent</Label>
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}{a.status !== "live" ? ` · ${a.status}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copySnippet}>Get Code</Button>
          <Button size="sm" className="gap-1.5" onClick={copySnippet}>
            <Code2 className="h-4 w-4" /> Embed
          </Button>
        </div>
      </div>

      <div className="grid flex-1 lg:grid-cols-2">
        {/* ── LEFT: config sections ───────────────────────────────────────── */}
        <div className="border-b border-border lg:border-b-0 lg:border-r">
          <Section title="Behaviour" defaultOpen>
            <FieldRow label="Interaction Mode">
              <Select value={cfg.interactionMode} onValueChange={(v) => set("interactionMode", v as WidgetConfig["interactionMode"])}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="voice-chat">Voice &amp; Chat</SelectItem>
                  <SelectItem value="voice">Voice only</SelectItem>
                  <SelectItem value="chat">Chat only</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </Section>

          <Section title="Appearance" defaultOpen>
            <FieldRow label="Select a theme">
              <Select value={cfg.theme} onValueChange={(v) => set("theme", v as WidgetConfig["theme"])}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark Theme</SelectItem>
                  <SelectItem value="light">Light Theme</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Voice blob style">
              <Select value={cfg.blobStyle} onValueChange={(v) => set("blobStyle", v as WidgetConfig["blobStyle"])}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aura">Aura</SelectItem>
                  <SelectItem value="orb">Orb</SelectItem>
                  <SelectItem value="pulse">Pulse</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>
          </Section>

          <Section title="Text" defaultOpen>
            <TextField label="Button label" value={cfg.buttonLabel} onChange={(v) => set("buttonLabel", v)} />
            <TextField label="Greeting" value={cfg.greeting} onChange={(v) => set("greeting", v)} />
            <TextField label="Listening status" value={cfg.listeningStatus} onChange={(v) => set("listeningStatus", v)} />
            <TextField label="Connecting status" value={cfg.connectingStatus} onChange={(v) => set("connectingStatus", v)} />
            <TextField label="Error message" value={cfg.errorMessage} onChange={(v) => set("errorMessage", v)} />
          </Section>

          <Section title="Branding" defaultOpen>
            <ColorField label="Primary Action/Brand Color" value={cfg.brandColor} onChange={(v) => set("brandColor", v)} />
            <ColorField
              label="Primary Action Text Color"
              value={cfg.brandTextColor}
              onChange={(v) => set("brandTextColor", v)}
              onReset={() => set("brandTextColor", DEFAULTS.brandTextColor)}
            />
            <ColorField label="Font Color" value={cfg.fontColor} onChange={(v) => set("fontColor", v)} />
            <ColorField label="Secondary Action Color" value={cfg.secondaryColor} onChange={(v) => set("secondaryColor", v)} />
            <FieldRow
              label={
                <span className="inline-flex items-center gap-1.5">
                  Background Image
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[220px]">
                      Shown behind the voice view. PNG/JPG, ≤1&nbsp;MB. Overrides the background color.
                    </TooltipContent>
                  </Tooltip>
                </span>
              }
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => toast.info("Mock: image picker")}
              >
                <ImagePlus className="h-4 w-4" /> Choose Image
              </Button>
            </FieldRow>
            <ColorField label="Background Color" value={cfg.bgColor} onChange={(v) => set("bgColor", v)} />
          </Section>

          <Section title="Semantic Colors">
            <ColorField label="Success" value={cfg.successColor} onChange={(v) => set("successColor", v)} />
            <ColorField label="Warning" value={cfg.warningColor} onChange={(v) => set("warningColor", v)} />
            <ColorField label="Error" value={cfg.errorColor} onChange={(v) => set("errorColor", v)} />
          </Section>

          <Section title="Input Fields">
            <ColorField label="Input background" value={cfg.inputBg} onChange={(v) => set("inputBg", v)} />
            <TextField label="Placeholder text" value={cfg.inputPlaceholder} onChange={(v) => set("inputPlaceholder", v)} />
            <FieldRow label="Corner radius">
              <Select value={String(cfg.inputRadius)} onValueChange={(v) => set("inputRadius", Number(v))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[4, 8, 12, 999].map((r) => (
                    <SelectItem key={r} value={String(r)}>{r === 999 ? "Pill" : `${r}px`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          </Section>

          <Section title="UI Elements">
            <ToggleRow label="Microphone button" checked={cfg.showMic} onChange={(v) => set("showMic", v)} />
            <ToggleRow label="Chat button" checked={cfg.showChat} onChange={(v) => set("showChat", v)} />
            <ToggleRow label="Close button" checked={cfg.showClose} onChange={(v) => set("showClose", v)} />
            <ToggleRow label='"Powered by Agora" footer' checked={cfg.poweredBy} onChange={(v) => set("poweredBy", v)} />
          </Section>
        </div>

        {/* ── RIGHT: live preview ─────────────────────────────────────────── */}
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-3">
            <p className="text-sm font-medium">Live Preview</p>
            <Tabs value={mode} onValueChange={(v) => setMode(v as PreviewMode)}>
              <TabsList className="h-9">
                <TabsTrigger value="collapsed" className="text-xs">Collapsed</TabsTrigger>
                <TabsTrigger value="voice" className="text-xs">Voice Mode</TabsTrigger>
                <TabsTrigger value="chat" className="text-xs">Chat Mode</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex flex-1 items-start justify-center bg-muted/20 p-8 lg:sticky lg:top-12">
            <WidgetPreview cfg={cfg} mode={mode} />
          </div>
        </div>
      </div>
    </main>
  )
}

// ─── The widget itself — colors come from user config (inline by design) ─────

function WidgetPreview({ cfg, mode }: { cfg: WidgetConfig; mode: PreviewMode }) {
  const dark = cfg.theme === "dark"
  const surface = dark ? cfg.bgColor : "#FFFFFF"
  const ink = dark ? "#FDFDFD" : cfg.fontColor

  if (mode === "collapsed") {
    // The launcher a visitor sees before opening the widget.
    return (
      <div className="flex h-[420px] w-[375px] flex-col items-end justify-end gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg"
          style={{ background: cfg.brandColor, color: cfg.brandTextColor }}
        >
          <Mic className="h-4 w-4" />
          {cfg.buttonLabel}
        </button>
        <button
          type="button"
          aria-label="Open widget"
          className="flex h-9 w-9 items-center justify-center rounded-full border shadow"
          style={{ background: surface, color: ink, borderColor: cfg.secondaryColor }}
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex h-[420px] w-[375px] flex-col overflow-hidden rounded-2xl shadow-xl"
      style={{ background: surface, color: ink }}
    >
      {mode === "voice" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <AgentSphere size={90} active />
          <p className="text-lg leading-snug">{cfg.greeting}</p>
          <p className="text-xs opacity-60">{cfg.listeningStatus}</p>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          <div className="mb-1 flex items-center gap-2">
            <AgentSphere size={28} active />
            <span className="text-xs opacity-70">{cfg.connectingStatus}</span>
          </div>
          <div
            className="max-w-[80%] px-3 py-2 text-sm"
            style={{ background: cfg.secondaryColor, color: "#FDFDFD", borderRadius: cfg.inputRadius }}
          >
            {cfg.greeting}
          </div>
          <div
            className="ml-auto max-w-[80%] px-3 py-2 text-sm"
            style={{ background: cfg.brandColor, color: cfg.brandTextColor, borderRadius: cfg.inputRadius }}
          >
            What are your opening hours?
          </div>
          <div className="mt-auto pt-2">
            <div
              className="flex items-center px-3 py-2 text-sm opacity-80"
              style={{ background: cfg.inputBg, color: "#FDFDFD", borderRadius: cfg.inputRadius }}
            >
              {cfg.inputPlaceholder}
            </div>
          </div>
        </div>
      )}

      {/* Bottom controls — mic pill + close + chat (per Figma) */}
      <div className="flex items-center justify-center gap-2.5 pb-5">
        {cfg.showMic && (
          <button
            type="button"
            className="flex items-center gap-2 rounded-full px-3.5 py-2"
            style={{ background: cfg.brandColor, color: cfg.brandTextColor }}
            aria-label="Microphone"
          >
            <Mic className="h-4 w-4" />
            <span className="flex items-end gap-0.5" aria-hidden>
              <span className="h-1.5 w-0.5 rounded-full bg-current" />
              <span className="h-2.5 w-0.5 rounded-full bg-current" />
              <span className="h-1 w-0.5 rounded-full bg-current" />
            </span>
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
        {cfg.showClose && (
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: cfg.brandColor, color: cfg.brandTextColor }}
            aria-label="End"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {cfg.showChat && (
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border"
            style={{ borderColor: cfg.secondaryColor, color: ink }}
            aria-label="Chat"
          >
            <MessageSquareText className="h-4 w-4" />
          </button>
        )}
      </div>
      {cfg.poweredBy && (
        <p className="pb-2 text-center text-[10px] uppercase tracking-wider opacity-40">
          Powered by Agora
        </p>
      )}
    </div>
  )
}

// ─── Form primitives (Figma anatomy: section title left, fields right) ───────

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-b border-border">
      <div className="grid gap-x-8 px-6 py-5 sm:grid-cols-[180px_minmax(0,1fr)]">
        <CollapsibleTrigger asChild>
          <button type="button" className="flex h-fit items-center gap-2 text-left text-sm font-medium">
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", !open && "-rotate-90")} />
            {title}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 max-sm:pt-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function FieldRow({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <FieldRow label={label}>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
    </FieldRow>
  )
}

function ColorField({
  label,
  value,
  onChange,
  onReset,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  onReset?: () => void
}) {
  return (
    <FieldRow label={label}>
      <div className="flex items-center gap-2">
        <label
          className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border"
          style={{ background: value }}
          aria-label={`${label} swatch`}
        >
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
        </label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm uppercase"
          aria-label={`${label} hex value`}
        />
        {onReset && (
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={onReset} aria-label={`Reset ${label}`}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </FieldRow>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  )
}
