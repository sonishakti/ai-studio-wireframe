"use client"

import * as React from "react"
import {
  Upload, AudioLines, Shapes, FileText, SlidersHorizontal, Rocket, Check,
  ChevronDown, ChevronRight, ArrowRight, ArrowLeft, Mic, PhoneIncoming, PhoneOutgoing,
  Code2, Sparkles, MessageSquare, Pencil, Circle, Dot,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AgentSphere } from "@/components/agent-test-panel"

/**
 * THROWAWAY harness — 10 design OPTIONS for the unified agent-creation widget.
 * Every option renders the SAME `STEPS`/`IMPORT` spec below, so each provably
 * accounts for EVERY line of the brief (import · voice + "edit a preset → custom"
 * · type · prompt+connectors+test · configure branches · test & publish). Pick a
 * direction at /agents/builder-lab?v=1..10; the winner gets the real build.
 */

type Step = {
  n: number
  t: string
  icon: React.ComponentType<{ className?: string }>
  items?: string[]
  branches?: { k: string; icon: React.ComponentType<{ className?: string }>; items: string[] }[]
}

const IMPORT = {
  t: "Import your agent",
  d: "Paste a Vapi · Retell · Bland · ElevenLabs config — we map voice, prompt, model & tools, drop you in the Playground to tweak, then return with the artifact selected.",
}

const STEPS: Step[] = [
  {
    n: 1, t: "Choose your voice", icon: AudioLines,
    items: [
      "Preset voices — Aria · Nova · Sage · Max (immutable)",
      "Edit a preset → Playground → “Create your custom” → back with the artifact selected",
      "Or build a custom voice from scratch in the Playground",
    ],
  },
  {
    n: 2, t: "Select agent type", icon: Shapes,
    items: ["Inbound — answer calls or web", "Outbound — dial a contact list", "Code — run inside your own app"],
  },
  {
    n: 3, t: "System prompt", icon: FileText,
    items: ["System prompt + greeting", "Add a knowledge base", "Add MCP connectors", "Quick test as you write"],
  },
  {
    n: 4, t: "Configure", icon: SlidersHorizontal,
    branches: [
      { k: "Inbound", icon: PhoneIncoming, items: ["Enable telephony + attach a phone number", "or Web widget → embed code + edit-widget accelerator"] },
      { k: "Outbound", icon: PhoneOutgoing, items: ["Attach a caller-ID number", "Upload contacts CSV — validated vs the prompt’s {{variables}}", "Other outbound settings"] },
      { k: "Code", icon: Code2, items: ["SDK / API snippets", "Add agent to an Agora channel · Stop agent", "Outlink to Docs Center for all APIs"] },
    ],
  },
  {
    n: 5, t: "Test & publish", icon: Rocket,
    items: ["Full-context test — talk to the finished agent", "Publish → the agent goes live"],
  },
]

// ─── shared bits ──────────────────────────────────────────────────────────────

function Items({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Dot className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{i}</span>
        </li>
      ))}
    </ul>
  )
}

function Branches({ branches }: { branches: NonNullable<Step["branches"]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {branches.map((b) => (
        <div key={b.k} className="rounded-lg border border-border bg-muted/20 p-3">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"><b.icon className="h-3.5 w-3.5" /> {b.k}</p>
          <Items items={b.items} />
        </div>
      ))}
    </div>
  )
}

function StepBody({ step }: { step: Step }) {
  return step.branches ? <Branches branches={step.branches} /> : <Items items={step.items!} />
}

function ImportBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3", compact && "py-2.5")}>
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div>
          <p className="text-sm font-medium">{IMPORT.t}</p>
          {!compact && <p className="max-w-2xl text-xs text-muted-foreground">{IMPORT.d}</p>}
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5"><Upload className="h-3.5 w-3.5" /> Import</Button>
    </div>
  )
}

/** A status circle: done(check) / active(filled n) / idle(n). */
function Num({ n, state }: { n: number; state: "done" | "active" | "idle" }) {
  return (
    <span className={cn(
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
      state === "active" && "border-primary bg-primary text-primary-foreground",
      state === "done" && "border-primary bg-primary/10 text-primary",
      state === "idle" && "border-border text-muted-foreground",
    )}>
      {state === "done" ? <Check className="h-3.5 w-3.5" /> : n}
    </span>
  )
}

function PublishBar() {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">Steps complete → the agent goes live.</p>
      <Button size="sm" className="gap-1.5"><Rocket className="h-3.5 w-3.5" /> Test &amp; publish</Button>
    </div>
  )
}

// ─── V1 · Stacked accordion (current) ─────────────────────────────────────────
function V1() {
  const [open, setOpen] = React.useState(1)
  return (
    <div className="mx-auto max-w-2xl space-y-3">
      <ImportBar />
      {STEPS.map((s) => {
        const state = open === s.n ? "active" : s.n < open ? "done" : "idle"
        return (
          <div key={s.n} className={cn("rounded-xl border border-border bg-card/30", open === s.n && "border-primary/60 ring-1 ring-primary/40")}>
            <button onClick={() => setOpen(s.n)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
              <Num n={s.n} state={state} />
              <span className="flex-1 text-sm font-semibold">{s.t}</span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open === s.n && "rotate-180")} />
            </button>
            {open === s.n && <div className="space-y-3 border-t border-border px-4 py-4"><StepBody step={s} /></div>}
          </div>
        )
      })}
    </div>
  )
}

// ─── V2 · Left rail + content ─────────────────────────────────────────────────
function V2() {
  const [active, setActive] = React.useState(1)
  const s = STEPS[active - 1]
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ImportBar compact />
      <div className="grid gap-5 sm:grid-cols-[200px_1fr]">
        <nav className="space-y-1">
          {STEPS.map((x) => (
            <button key={x.n} onClick={() => setActive(x.n)} className={cn("flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm", active === x.n ? "bg-accent font-medium" : "text-muted-foreground hover:bg-accent/50")}>
              <Num n={x.n} state={active === x.n ? "active" : x.n < active ? "done" : "idle"} />
              {x.t}
            </button>
          ))}
        </nav>
        <div className="rounded-xl border border-border bg-card/30 p-5">
          <p className="mb-3 flex items-center gap-2 text-base font-semibold"><s.icon className="h-4 w-4 text-muted-foreground" /> {s.t}</p>
          <StepBody step={s} />
          <div className="mt-5 flex justify-between">
            <Button variant="ghost" size="sm" disabled={active === 1} onClick={() => setActive((a) => a - 1)}><ArrowLeft className="h-4 w-4" /></Button>
            <Button size="sm" className="gap-1.5" onClick={() => setActive((a) => Math.min(5, a + 1))}>Continue <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── V3 · Top horizontal stepper ──────────────────────────────────────────────
function V3() {
  const [active, setActive] = React.useState(1)
  const s = STEPS[active - 1]
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ImportBar compact />
      <div className="flex items-center justify-between">
        {STEPS.map((x, i) => (
          <React.Fragment key={x.n}>
            <button onClick={() => setActive(x.n)} className="flex flex-col items-center gap-1.5">
              <Num n={x.n} state={active === x.n ? "active" : x.n < active ? "done" : "idle"} />
              <span className={cn("hidden text-[11px] sm:block", active === x.n ? "text-foreground" : "text-muted-foreground")}>{x.t}</span>
            </button>
            {i < STEPS.length - 1 && <div className={cn("h-px flex-1", x.n < active ? "bg-primary" : "bg-border")} />}
          </React.Fragment>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card/30 p-5">
        <p className="mb-3 flex items-center gap-2 text-base font-semibold"><s.icon className="h-4 w-4 text-muted-foreground" /> {s.t}</p>
        <StepBody step={s} />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" disabled={active === 1} onClick={() => setActive((a) => a - 1)} className="gap-1.5"><ArrowLeft className="h-4 w-4" /> Back</Button>
        <Button onClick={() => setActive((a) => Math.min(5, a + 1))} className="gap-1.5">Continue <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}

// ─── V4 · Single long scroll + sticky publish ─────────────────────────────────
function V4() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-16">
      <ImportBar />
      {STEPS.map((s) => (
        <section key={s.n} className="rounded-xl border border-border bg-card/30 p-5">
          <p className="mb-3 flex items-center gap-2.5 text-sm font-semibold"><Num n={s.n} state="idle" /> {s.t}</p>
          <StepBody step={s} />
        </section>
      ))}
      <div className="sticky bottom-4"><PublishBar /></div>
    </div>
  )
}

// ─── V5 · Two-pane: build + live preview ──────────────────────────────────────
function V5() {
  const [active, setActive] = React.useState(1)
  const s = STEPS[active - 1]
  return (
    <div className="mx-auto grid max-w-4xl gap-5 lg:grid-cols-[1fr_300px]">
      <div className="space-y-3">
        <ImportBar compact />
        {STEPS.map((x) => (
          <div key={x.n} className={cn("rounded-xl border border-border bg-card/30", active === x.n && "border-primary/60 ring-1 ring-primary/40")}>
            <button onClick={() => setActive(x.n)} className="flex w-full items-center gap-3 px-4 py-3 text-left">
              <Num n={x.n} state={active === x.n ? "active" : "idle"} />
              <span className="flex-1 text-sm font-semibold">{x.t}</span>
              <ChevronRight className={cn("h-4 w-4 text-muted-foreground", active === x.n && "rotate-90")} />
            </button>
            {active === x.n && <div className="border-t border-border px-4 py-4"><StepBody step={s} /></div>}
          </div>
        ))}
      </div>
      <aside className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card/40 p-5 lg:sticky lg:top-6 lg:self-start">
        <Badge variant="secondary" className="text-xs">Live preview</Badge>
        <AgentSphere size={104} />
        <p className="text-center text-xs text-muted-foreground">Talk to it as you build — always one tap away.</p>
        <Button size="sm" className="gap-1.5"><Mic className="h-3.5 w-3.5" /> Test agent</Button>
      </aside>
    </div>
  )
}

// ─── V6 · Tabs ────────────────────────────────────────────────────────────────
function V6() {
  const [active, setActive] = React.useState(1)
  const s = STEPS[active - 1]
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <ImportBar compact />
      <div className="flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {STEPS.map((x) => (
          <button key={x.n} onClick={() => setActive(x.n)} className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors", active === x.n ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <x.icon className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{x.t}</span><span className="sm:hidden">{x.n}</span>
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card/30 p-5"><StepBody step={s} /></div>
    </div>
  )
}

// ─── V7 · Card board (fill in any order) ──────────────────────────────────────
function V7() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <ImportBar compact />
      <div className="grid gap-3 sm:grid-cols-2">
        {STEPS.map((s) => (
          <button key={s.n} className="flex flex-col gap-2 rounded-xl border border-border bg-card/30 p-4 text-left transition-colors hover:border-primary/40">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground"><s.icon className="h-4 w-4" /></span>
              <div className="flex-1"><p className="text-sm font-semibold">{s.t}</p><p className="text-[11px] text-muted-foreground">Step {s.n}</p></div>
              <Circle className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <div className="line-clamp-3 text-xs text-muted-foreground">{(s.items ?? s.branches?.flatMap((b) => b.items))?.join(" · ")}</div>
          </button>
        ))}
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-4 text-center">
          <Button className="gap-1.5"><Rocket className="h-4 w-4" /> Test &amp; publish</Button>
        </div>
      </div>
    </div>
  )
}

// ─── V8 · Conversational guided ───────────────────────────────────────────────
function V8() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-card/30 p-5">
        {STEPS.slice(0, 2).map((s) => (
          <div key={s.n} className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageSquare className="h-3.5 w-3.5" /></span>
            <div className="rounded-lg rounded-tl-none bg-muted/40 px-3 py-2"><p className="text-sm font-medium">{s.t}?</p><p className="mt-0.5 text-xs text-muted-foreground">{(s.items ?? []).join(" · ")}</p></div>
          </div>
        ))}
        <div className="flex items-start justify-end gap-2.5">
          <div className="rounded-lg rounded-tr-none bg-primary/10 px-3 py-2 text-sm">Aria · Inbound ✓</div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageSquare className="h-3.5 w-3.5" /></span>
          <div className="rounded-lg rounded-tl-none bg-muted/40 px-3 py-2"><p className="text-sm font-medium">Now your system prompt + connectors</p><p className="mt-0.5 text-xs text-muted-foreground">prompt · greeting · knowledge · MCP · quick test</p></div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5">
        <input placeholder="Type your answer, or pick an option above…" className="flex-1 bg-transparent px-2 text-sm outline-none" />
        <Button size="sm" className="shrink-0 gap-1.5">Next <ArrowRight className="h-3.5 w-3.5" /></Button>
      </div>
      <p className="text-center text-xs text-muted-foreground">Guides through all 5 steps → configure branch → test &amp; publish.</p>
    </div>
  )
}

// ─── V9 · Canvas / pipeline ───────────────────────────────────────────────────
function V9() {
  const [active, setActive] = React.useState(1)
  const s = STEPS[active - 1]
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <ImportBar compact />
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((x, i) => (
          <React.Fragment key={x.n}>
            <button onClick={() => setActive(x.n)} className={cn("flex shrink-0 flex-col items-center gap-1.5 rounded-xl border px-4 py-3 transition-colors", active === x.n ? "border-primary bg-primary/5" : "border-border bg-card hover:border-foreground/20")}>
              <x.icon className={cn("h-5 w-5", active === x.n ? "text-primary" : "text-muted-foreground")} />
              <span className="text-[11px] font-medium">{x.t}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
          </React.Fragment>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card/30 p-5">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><s.icon className="h-4 w-4 text-muted-foreground" /> {s.t}</p>
        <StepBody step={s} />
      </div>
    </div>
  )
}

// ─── V10 · Compact checklist + edit drawers ───────────────────────────────────
function V10() {
  const [open, setOpen] = React.useState<number | null>(3)
  return (
    <div className="mx-auto max-w-xl space-y-3 pb-16">
      <ImportBar compact />
      <div className="overflow-hidden rounded-xl border border-border">
        {STEPS.map((s) => (
          <div key={s.n} className="border-b border-border last:border-0">
            <button onClick={() => setOpen(open === s.n ? null : s.n)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/30">
              <Num n={s.n} state="idle" />
              <span className="flex-1 text-sm font-medium">{s.t}</span>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Pencil className="h-3 w-3" /> Edit</span>
            </button>
            {open === s.n && <div className="bg-muted/20 px-4 py-3"><StepBody step={s} /></div>}
          </div>
        ))}
      </div>
      <div className="sticky bottom-4"><PublishBar /></div>
    </div>
  )
}

const VARIANTS = [
  { n: 1, name: "Stacked accordion", c: V1 },
  { n: 2, name: "Left rail + content", c: V2 },
  { n: 3, name: "Top stepper", c: V3 },
  { n: 4, name: "Single long scroll", c: V4 },
  { n: 5, name: "Build + live preview", c: V5 },
  { n: 6, name: "Tabs", c: V6 },
  { n: 7, name: "Card board", c: V7 },
  { n: 8, name: "Conversational", c: V8 },
  { n: 9, name: "Canvas pipeline", c: V9 },
  { n: 10, name: "Checklist + drawers", c: V10 },
]

export default function BuilderLabPage() {
  const [v, setV] = React.useState(1)
  React.useEffect(() => {
    const p = parseInt(new URLSearchParams(window.location.search).get("v") ?? "1", 10)
    if (p >= 1 && p <= 10) setV(p)
  }, [])
  const go = (n: number) => {
    setV(n)
    window.history.replaceState({}, "", `/agents/builder-lab?v=${n}`)
  }
  const Active = VARIANTS[v - 1].c

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="mx-auto mb-6 max-w-3xl text-center">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Creation-widget option {v}/10 · {VARIANTS[v - 1].name}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">Every option covers the full spec — import · voice (+ edit-preset→custom) · type · prompt+connectors+test · configure branches · test &amp; publish.</p>
      </div>
      <Active />

      <div className="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit max-w-[95vw] flex-wrap items-center justify-center gap-1 rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg backdrop-blur">
        {VARIANTS.map((x) => (
          <button key={x.n} onClick={() => go(x.n)} title={x.name}
            className={cn("flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors", v === x.n ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
            {x.n}
          </button>
        ))}
      </div>
    </div>
  )
}
