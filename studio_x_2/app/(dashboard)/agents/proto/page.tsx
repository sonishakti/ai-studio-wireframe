"use client"

import * as React from "react"
import Link from "next/link"
import {
  Mic, Plus, Upload, ArrowRight, ArrowLeftRight, PhoneIncoming, PhoneOutgoing,
  Code2, Gauge, DollarSign, Sparkles, Rocket, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AgentSphere } from "@/components/agent-test-panel"
import { ImportAgentSheet } from "@/components/import-agent-sheet"
import { getDefaultAgent, stackEstimate } from "@/lib/campaign-data"

/**
 * THROWAWAY prototype harness for the /agents homepage redesign (simplification).
 * 10 lean directions on ?v=1..10 + a floating switcher. The winner gets folded
 * into components/go-live-home.tsx and this route is deleted.
 */

const NEW = "/agents/new/edit"

function Aria() {
  return getDefaultAgent()
}

// ─── V1 · Bare hero — sphere + two buttons, nothing else ──────────────────────
function V1() {
  const a = Aria()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <AgentSphere size={132} />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{a.name} is ready</h1>
        <p className="text-sm text-muted-foreground">Your AI agent, live from minute one. Talk to it, then put it to work.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button size="lg" className="gap-2"><Mic className="h-4 w-4" /> Talk to {a.name}</Button>
        <Button size="lg" variant="outline" asChild className="gap-2"><Link href={NEW}><Plus className="h-4 w-4" /> Create agent</Link></Button>
      </div>
    </div>
  )
}

// ─── V2 · Intent-first list — "what do you want to build?" rows, no cards ──────
function V2() {
  const rows = [
    { icon: PhoneIncoming, t: "Answer phone calls", d: "An agent that picks up your inbound calls 24/7", dc: "inbound" },
    { icon: PhoneOutgoing, t: "Make outbound calls", d: "Upload a list and your agent dials each contact", dc: "batch" },
    { icon: Code2, t: "Embed in your app", d: "Drop the agent into your product via SDK or API", dc: "code" },
  ]
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">What do you want to build?</h1>
        <p className="text-sm text-muted-foreground">Start from an intent — we&apos;ll set up the rest. Or talk to Aria, your ready-made agent.</p>
      </div>
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border">
        {rows.map((r) => (
          <Link key={r.t} href={`${NEW}?dc=${r.dc}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-accent/40">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"><r.icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{r.t}</p>
              <p className="text-xs text-muted-foreground">{r.d}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        <button className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"><Mic className="h-3.5 w-3.5" /> Talk to Aria first</button>
      </p>
    </div>
  )
}

// ─── V3 · Single primary CTA + quiet secondaries + thin usage bar ─────────────
function V3() {
  const a = Aria()
  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card/40 p-5">
        <AgentSphere size={72} />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{a.name}</p>
          <p className="text-xs text-muted-foreground">{a.role} · ready to deploy</p>
        </div>
        <Badge variant="secondary" className="shrink-0">Live</Badge>
      </div>
      <div className="space-y-2">
        <Button size="lg" className="w-full gap-2"><Mic className="h-4 w-4" /> Talk to {a.name}</Button>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href={NEW} className="font-medium text-foreground hover:text-primary">Create another</Link>
          <span>·</span>
          <ImportAgentSheet><button className="font-medium text-foreground hover:text-primary">Import an agent</button></ImportAgentSheet>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground"><span>Free minutes</span><span>112 / 300 used</span></div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: "37%" }} /></div>
      </div>
    </div>
  )
}

// ─── V4 · Conversation-led — big talk panel, deploy as a quiet link ───────────
function V4() {
  const a = Aria()
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-5 py-8 text-center">
      <Badge variant="secondary">{a.name} · {a.role}</Badge>
      <AgentSphere size={148} />
      <p className="text-sm text-muted-foreground">Press to talk — it&apos;s free on your in-browser minutes.</p>
      <Button size="lg" className="gap-2 rounded-full px-8"><Mic className="h-4 w-4" /> Start talking</Button>
      <Link href={NEW} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        Ready to deploy or build your own <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  )
}

// ─── V5 · List/launch — no hero; agents list + create ─────────────────────────
function V5() {
  const a = Aria()
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Your agents</h1>
        <Button asChild className="gap-1.5"><Link href={NEW}><Plus className="h-4 w-4" /> Create agent</Link></Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <div className="flex items-center gap-4 px-5 py-4">
          <AgentSphere size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2"><p className="text-sm font-medium">{a.name}</p><Badge variant="secondary" className="text-[11px]">Live</Badge></div>
            <p className="text-xs text-muted-foreground">{a.role}</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5"><Mic className="h-3.5 w-3.5" /> Talk</Button>
          <Button size="sm" className="gap-1.5">Deploy <ArrowRight className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        <ImportAgentSheet><button className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"><Upload className="h-3.5 w-3.5" /> Import from Vapi / Retell / ElevenLabs</button></ImportAgentSheet>
      </p>
    </div>
  )
}

// ─── V6 · Two-up split — Aria left, next steps right ──────────────────────────
function V6() {
  const a = Aria()
  const steps = [
    { icon: Mic, t: "Talk to it", d: "Hear it live in your browser" },
    { icon: Rocket, t: "Deploy it", d: "Put it on a phone number or the web", href: NEW },
    { icon: Plus, t: "Create a new agent", d: "Start fresh from a voice", href: NEW },
  ]
  return (
    <div className="mx-auto grid max-w-3xl items-center gap-6 py-4 sm:grid-cols-2">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/40 p-6 text-center">
        <AgentSphere size={120} />
        <p className="text-base font-semibold">{a.name}</p>
        <p className="text-xs text-muted-foreground">{a.role} · live</p>
      </div>
      <div className="space-y-2">
        {steps.map((s) => {
          const inner = (
            <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-accent/40">
              <s.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1"><p className="text-sm font-medium">{s.t}</p><p className="text-xs text-muted-foreground">{s.d}</p></div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
          )
          return s.href ? <Link key={s.t} href={s.href}>{inner}</Link> : <button key={s.t} className="block w-full text-left">{inner}</button>
        })}
      </div>
    </div>
  )
}

// ─── V7 · Command bar — describe the agent you want ───────────────────────────
function V7() {
  return (
    <div className="mx-auto max-w-xl space-y-5 py-10 text-center">
      <Sparkles className="mx-auto h-7 w-7 text-primary" />
      <h1 className="text-2xl font-semibold tracking-tight">Describe the agent you want</h1>
      <form action={NEW} className="flex items-center gap-2">
        <Input placeholder="e.g. A friendly receptionist that books appointments…" className="h-11 text-sm" />
        <Button type="submit" size="lg" className="shrink-0 gap-1.5">Build <ArrowRight className="h-4 w-4" /></Button>
      </form>
      <p className="text-sm text-muted-foreground">or <Link href={NEW} className="font-medium text-foreground hover:text-primary">talk to Aria</Link>, your ready-made agent</p>
    </div>
  )
}

// ─── V8 · Stat-minimal — sphere + free-minutes ring + two buttons ─────────────
function V8() {
  const a = Aria()
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-5 py-8 text-center">
      <AgentSphere size={120} />
      <div><p className="text-lg font-semibold">{a.name}</p><p className="text-xs text-muted-foreground">{a.role}</p></div>
      <div className="flex items-center gap-6 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Gauge className="h-4 w-4" /> {stackEstimate(a).latencyMs}ms</span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground"><DollarSign className="h-4 w-4" /> {stackEstimate(a).costPerMin.toFixed(2)}/min</span>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Button size="lg" className="gap-2"><Mic className="h-4 w-4" /> Talk to {a.name}</Button>
        <Button size="lg" variant="outline" asChild className="gap-2"><Link href={NEW}><Rocket className="h-4 w-4" /> Deploy it</Link></Button>
      </div>
    </div>
  )
}

// ─── V9 · Path teaser — 3-step tracker + start ────────────────────────────────
function V9() {
  const steps = ["Talk to it", "Configure", "Go live"]
  return (
    <div className="mx-auto max-w-xl space-y-6 py-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Deploy an AI agent in minutes</h1>
      <div className="flex items-center justify-center gap-2">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">{i + 1}</span>
              <span className="text-sm text-muted-foreground">{s}</span>
            </div>
            {i < steps.length - 1 && <div className="h-px w-6 bg-border" />}
          </React.Fragment>
        ))}
      </div>
      <Button size="lg" asChild className="gap-2"><Link href={NEW}><ArrowRight className="h-4 w-4" /> Start with Aria</Link></Button>
    </div>
  )
}

// ─── V10 · Ultra-minimal empty ────────────────────────────────────────────────
function V10() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-5 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Deploy an AI agent in minutes</h1>
      <Button size="lg" asChild className="gap-2"><Link href={NEW}><Plus className="h-4 w-4" /> Create your agent</Link></Button>
      <Link href={NEW} className="text-sm text-muted-foreground hover:text-foreground">or talk to Aria, your ready-made agent →</Link>
    </div>
  )
}

const VARIANTS = [
  { n: 1, name: "Bare hero", c: V1 },
  { n: 2, name: "Intent list", c: V2 },
  { n: 3, name: "One CTA + usage", c: V3 },
  { n: 4, name: "Conversation-led", c: V4 },
  { n: 5, name: "List / launch", c: V5 },
  { n: 6, name: "Two-up split", c: V6 },
  { n: 7, name: "Command bar", c: V7 },
  { n: 8, name: "Stat-minimal", c: V8 },
  { n: 9, name: "Path teaser", c: V9 },
  { n: 10, name: "Ultra-minimal", c: V10 },
]

export default function ProtoHomePage() {
  const [v, setV] = React.useState(1)
  React.useEffect(() => {
    const p = parseInt(new URLSearchParams(window.location.search).get("v") ?? "1", 10)
    if (p >= 1 && p <= 10) setV(p)
  }, [])
  const go = (n: number) => {
    setV(n)
    window.history.replaceState({}, "", `/agents/proto?v=${n}`)
  }
  const Active = VARIANTS[v - 1].c

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <p className="mx-auto mb-6 max-w-3xl text-center text-xs uppercase tracking-wider text-muted-foreground">
        Homepage prototype {v}/10 · {VARIANTS[v - 1].name}
      </p>
      <Active />

      {/* Floating switcher */}
      <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[95vw] flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur">
        {VARIANTS.map((x) => (
          <button
            key={x.n}
            onClick={() => go(x.n)}
            title={x.name}
            className={cn(
              "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors",
              v === x.n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
            )}
          >
            {x.n}
          </button>
        ))}
      </div>
    </div>
  )
}
