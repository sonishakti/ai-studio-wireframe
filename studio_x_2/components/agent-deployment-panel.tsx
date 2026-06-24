"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, Info, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { type Agent } from "@/lib/campaign-data"
import { cn } from "@/lib/utils"
import {
  CHANNELS,
  type Channel,
  InboundConfig,
  BatchConfig,
  EmbedConfig,
  WebWidgetConfig,
  publishDeployment,
} from "@/components/wizard/channel-configs"

/**
 * AgentDeploymentPanel — the "Deploy" step of the agent editor (legacy panel).
 *
 * Self-contained, in-builder deploy surface: configuring + going live happens
 * HERE, on /agents/[id]/edit — the user is never ejected to a /deploy/* route.
 * The channel configs + the go-live action now live in
 * `components/wizard/channel-configs.tsx` (shared with the creation wizard);
 * this panel composes them with its modular-persona block + channel chooser.
 *
 * Structure:
 *   1. Persona block (personality override + inherited identity chips)
 *   2. Channel chooser — Inbound · Batch calls · Embed · Web widget
 *   3. The chosen channel's inline config (from channel-configs)
 *   4. Go live → publishDeployment() → track + toast + /monitor
 *
 * Guard: a brand-new agent (id === "new") has never been saved, so go-live is
 * disabled until it persists.
 */

const TONES = ["Friendly", "Professional", "Neutral", "Playful"]
const LANGUAGES = ["en-US", "en-GB", "es-ES", "hi-IN", "ja-JP"]

export function AgentDeploymentPanel({ id, agent }: { id: string; agent?: Agent }) {
  const router = useRouter()
  const isUnsaved = id === "new" || !agent
  const agentName = agent?.name ?? "the agent"
  const [editIdentity, setEditIdentity] = React.useState(false)

  // ── Persona (modular: base on the agent, overridden per deployment) ─────────
  const [personality, setPersonality] = React.useState(
    agent?.persona.personality ?? "Warm, concise, professional",
  )
  const [tone, setTone] = React.useState(agent?.persona.tone ?? "Friendly")
  const [language, setLanguage] = React.useState(agent?.persona.language ?? "en-US")
  const [brand, setBrand] = React.useState(agent?.persona.brand ?? "")

  // ── Channel selection — the hero. Default to inbound; ?dc= overrides below. ──
  const [channel, setChannel] = React.useState<Channel | null>("inbound")

  // Preselect a channel when arriving from a channel card (?dc=…). Keeps deploy
  // fully in-context — the user is never routed to a /deploy/* page.
  React.useEffect(() => {
    const dc = new URLSearchParams(window.location.search).get("dc")
    if (dc === "inbound" || dc === "batch" || dc === "code" || dc === "web") {
      setChannel(dc)
    }
  }, [])

  // Going live: track the north-star event + time-to-live, then land on Monitor.
  const goLive = (label: string, name: string) => {
    if (isUnsaved) return
    publishDeployment({
      router,
      agentId: id,
      agentName: agent?.name ?? "",
      channel: label,
      name,
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {isUnsaved && (
        <div className="flex items-start gap-2.5 rounded-md border border-border bg-muted/40 p-3">
          <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-foreground leading-relaxed">
            Save this agent first to deploy it. Finish the Stack step, then the channels below unlock.
          </p>
        </div>
      )}

      {/* ── Persona = WHO the agent is, MODULAR per deployment. The agent's
          persona is the reusable base; here you override only what this
          deployment needs — usually just the personality. ─────────────────── */}
      <section className="space-y-3">
        <div>
          <p className="text-sm font-medium">Persona for this deployment</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Inherits {agentName}&apos;s voice — only the personality changes here, unless you edit the identity.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dp-personality" className="text-sm font-medium">Personality for this deployment</Label>
          <Textarea
            id="dp-personality"
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="min-h-[96px] text-sm"
            placeholder="e.g. Warm, patient, solution-first"
          />
          <p className="text-xs text-muted-foreground">
            Pre-filled from {agentName}. Edit to tailor this deployment.
          </p>
        </div>

        <div className="space-y-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">Identity from {agentName}</p>
            <button
              type="button"
              onClick={() => setEditIdentity((v) => !v)}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {editIdentity ? "Done" : "Edit identity"}
            </button>
          </div>
          {!editIdentity ? (
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs font-normal">Tone · {tone}</Badge>
              <Badge variant="outline" className="text-xs font-normal">Language · {language}</Badge>
              {brand && <Badge variant="outline" className="text-xs font-normal">Brand · {brand}</Badge>}
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Brand</Label>
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Acme" />
              </div>
              <p className="text-xs text-muted-foreground">Edits to identity apply to this deployment only.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Channel = WHERE/HOW it goes live. The hero — the action you take on
          this screen, foregrounded. ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">Choose how it goes live</h2>
          <p className="text-sm text-muted-foreground">
            One agent, one channel. Pick where {agent?.name ?? "your agent"} starts taking traffic.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {CHANNELS.map((c) => {
            const Icon = c.icon
            const selected = channel === c.id
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setChannel(c.id)}
                aria-pressed={selected}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-foreground/20 hover:bg-accent/40",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                <span className="flex-1 text-sm font-medium">{c.title}</span>
                {selected && <Check className="h-4 w-4 shrink-0 text-primary" />}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── 3. The chosen channel's inline config (shared with the wizard) ───── */}
      {channel === "inbound" && (
        <InboundConfig disabled={isUnsaved} onGoLive={goLive} />
      )}
      {channel === "batch" && (
        <BatchConfig disabled={isUnsaved} onGoLive={goLive} />
      )}
      {channel === "code" && <EmbedConfig agentId={id} />}
      {channel === "web" && <WebWidgetConfig agentId={id} />}

      {/* ── 4. Footer — managing live deployments lives in Monitor ───────────── */}
      <Link
        href="/monitor"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Manage live deployments in Monitor
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}
