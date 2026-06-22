"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  Mic,
  PhoneOff,
  Phone,
  CreditCard,
  Lock,
  CheckCircle2,
  Sparkles,
  FlaskConical,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AgentSphere } from "@/components/agent-test-panel"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import {
  STACK_PRESETS,
  CLAIMABLE_NUMBERS,
  PORT_CARRIERS,
  PLAN_USAGE,
  type ImportedAgentConfig,
} from "@/lib/campaign-data"

/**
 * DefectorFlow — the radical "paste-to-live" activation experiment.
 * ────────────────────────────────────────────────────────────────
 * Built for the switcher, not the greenfield builder. Three steps, one motion:
 * paste a rival config → hear YOUR agent on Agora → claim a number. Honesty
 * fixes applied vs the raw concept: the "ring" is an in-browser call (labeled
 * as such; real telephony needs the number step), the account is created
 * EXPLICITLY (email field, not silently), and there's no fabricated countdown.
 */

const SOURCES = ["Vapi", "Retell", "Bland", "ElevenLabs", "Generic JSON"] as const

const EXAMPLE = `{
  "name": "Acme Support",
  "voice": "elevenlabs:rachel",
  "llm": { "model": "gpt-4o" },
  "first_message": "Hi! Thanks for calling Acme — how can I help?",
  "system_prompt": "You are Acme's tier-1 support agent…",
  "tools": ["transfer_call", "check_order_status"]
}`

type Step = "paste" | "cloning" | "live" | "claim" | "done"
type Line = { role: "agent" | "you"; text: string }

function digits(s: string) {
  return s.replace(/\D/g, "")
}

function parseConfig(raw: string, source: string): { ok: boolean; config?: ImportedAgentConfig; error?: string } {
  try {
    const p = JSON.parse(raw)
    if (typeof p !== "object" || !p || !p.name) {
      return { ok: false, error: "That JSON is missing a name — paste your agent's config." }
    }
    return {
      ok: true,
      config: {
        name: String(p.name),
        systemPrompt: p.system_prompt ?? p.systemPrompt ?? p.prompt,
        firstMessage: p.first_message ?? p.firstMessage ?? p.greeting,
        voice: typeof p.voice === "string" ? p.voice : p.voice?.voice ?? p.tts?.voice,
        llmModel: p.llm?.model ?? p.model,
        language: p.language,
        tools: Array.isArray(p.tools)
          ? p.tools.map((t: unknown) => (typeof t === "string" ? t : (t as { name?: string })?.name)).filter(Boolean)
          : undefined,
        source,
      },
    }
  } catch {
    return { ok: false, error: "That doesn't parse as JSON — check for a stray comma." }
  }
}

export function DefectorFlow() {
  const [step, setStep] = React.useState<Step>("paste")
  const [source, setSource] = React.useState<(typeof SOURCES)[number]>("Vapi")
  const [pasted, setPasted] = React.useState("")
  const [config, setConfig] = React.useState<ImportedAgentConfig | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const timers = React.useRef<number[]>([])

  const after = React.useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms)
    timers.current.push(id)
  }, [])
  React.useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const agentId = "agt_defect"
  const voice = config?.voice || STACK_PRESETS.balanced.tts.voice
  const model = config?.llmModel || STACK_PRESETS.balanced.llm.model

  function submitPaste() {
    const res = parseConfig(pasted, source)
    if (!res.ok || !res.config) {
      setError(res.error ?? "Couldn't read that config.")
      return
    }
    setError(null)
    setConfig(res.config)
    track(Events.defect_paste_submitted, { source } as never)
    setStep("cloning")
    after(1700, () => {
      track(Events.defect_cloned_live, { source, agent_id: agentId } as never)
      track(Events.agent_test_started, { channel: "web", agent_id: agentId, intent: "defect" })
      setStep("live")
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-2xl px-6 py-10">
        {/* Brand + experiment label */}
        <div className="mb-8 flex items-center justify-between">
          <Link href="/deploy" className="text-xl font-semibold lowercase tracking-tight">agora</Link>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <FlaskConical className="h-3 w-3" /> Experimental flow
          </Badge>
        </div>

        <StepDots step={step} />

        {step === "paste" && (
          <PasteStep
            source={source}
            setSource={setSource}
            pasted={pasted}
            setPasted={(v) => { setPasted(v); if (error) setError(null) }}
            error={error}
            onSubmit={submitPaste}
          />
        )}

        {step === "cloning" && config && (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
            <div>
              <p className="text-lg font-semibold">Cloning {config.name} onto Agora…</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Mapping {voice} · {model} onto Agora&apos;s bundled stack. No keys needed.
              </p>
            </div>
          </div>
        )}

        {step === "live" && config && (
          <LiveStep config={config} voice={voice} model={model} agentId={agentId} after={after} onDone={() => setStep("claim")} />
        )}

        {step === "claim" && config && (
          <ClaimStep config={config} agentId={agentId} after={after} onLive={() => setStep("done")} />
        )}

        {step === "done" && config && <DoneStep name={config.name} />}
      </div>
    </main>
  )
}

// ─── step dots ──────────────────────────────────────────────────────────────

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["paste", "live", "claim"]
  const idx = step === "cloning" ? 0 : step === "done" ? 2 : order.indexOf(step)
  const labels = ["Paste", "Hear it", "Claim"]
  return (
    <div className="mb-8 flex items-center gap-2">
      {labels.map((l, i) => (
        <React.Fragment key={l}>
          <div className="flex items-center gap-1.5">
            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium",
              i <= idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{i + 1}</span>
            <span className={cn("text-xs", i <= idx ? "font-medium text-foreground" : "text-muted-foreground")}>{l}</span>
          </div>
          {i < labels.length - 1 && <span className="h-px flex-1 bg-border" />}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── step 1: paste ─────────────────────────────────────────────────────────

function PasteStep({
  source, setSource, pasted, setPasted, error, onSubmit,
}: {
  source: string
  setSource: (s: (typeof SOURCES)[number]) => void
  pasted: string
  setPasted: (v: string) => void
  error: string | null
  onSubmit: () => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Switching from Vapi or Retell? Paste your agent.</h1>
        <p className="mt-1.5 text-muted-foreground">
          Hear your own agent ring on Agora in under a minute — no rebuild, no keys. Then claim a number.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SOURCES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSource(s)}
            className={cn("rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              source === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="defect-json">Paste your {source} config</Label>
        <Textarea
          id="defect-json"
          rows={11}
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          placeholder={EXAMPLE}
          className="font-mono text-xs"
        />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>

      <Button size="lg" className="gap-2" onClick={onSubmit} disabled={!pasted.trim()}>
        Make it ring <ArrowRight className="h-4 w-4" />
      </Button>
      <p className="text-xs text-muted-foreground">
        We map voice, model, prompt and tools onto Agora&apos;s bundled stack. Nothing is charged here.
      </p>
    </div>
  )
}

// ─── step 2: live (hear your agent) ─────────────────────────────────────────

function LiveStep({
  config, voice, model, agentId, after, onDone,
}: {
  config: ImportedAgentConfig
  voice: string
  model: string
  agentId: string
  after: (ms: number, fn: () => void) => void
  onDone: () => void
}) {
  const [lines, setLines] = React.useState<Line[]>(
    config.firstMessage ? [{ role: "agent", text: config.firstMessage }] : [],
  )
  const [speaking, setSpeaking] = React.useState(false)
  const [turns, setTurns] = React.useState(0)

  function talk() {
    if (speaking) return
    const t = turns
    setTurns(t + 1)
    const ex = [
      { you: "What can you do?", agent: "Everything your old setup did — I answer calls, qualify leads and book appointments, now on Agora." },
      { you: "Nice — how do I put you on a number?", agent: "Hit “End & claim a number” and I'll be live on a real line in a moment." },
    ]
    const pair = ex[Math.min(t, ex.length - 1)]
    setLines((l) => [...l, { role: "you", text: pair.you }])
    setSpeaking(true)
    after(900, () => { setLines((l) => [...l, { role: "agent", text: pair.agent }]); setSpeaking(false) })
  }

  function end() {
    track(Events.agent_test_ended, { channel: "web", agent_id: agentId, duration_sec: 0 })
    onDone()
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-5">
        <AgentSphere size={104} active={speaking} />
        <div className="min-w-0">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live on Agora
          </Badge>
          <h2 className="mt-1.5 truncate text-2xl font-semibold tracking-tight">{config.name}</h2>
          <p className="font-mono text-xs text-muted-foreground">{model} · nova-2 · {voice}</p>
        </div>
      </div>

      <p className="rounded-lg border border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground">
        You&apos;re hearing <span className="font-medium text-foreground">your own agent</span> in this browser. Putting it on a
        real phone number is the next step.
      </p>

      {lines.length > 0 && (
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-border bg-background p-3">
          {lines.map((l, i) => (
            <div key={i} className={cn("flex", l.role === "you" ? "justify-end" : "justify-start")}>
              <span className={cn("max-w-[85%] rounded-lg px-3 py-1.5 text-xs",
                l.role === "you" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{l.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={talk} disabled={speaking}>
          <Mic className="h-3.5 w-3.5" /> Talk
        </Button>
        <Button size="sm" variant="destructive" className="gap-1.5" onClick={end}>
          <PhoneOff className="h-3.5 w-3.5" /> End &amp; claim a number
        </Button>
      </div>
    </div>
  )
}

// ─── step 3: claim (account + number) ───────────────────────────────────────

function ClaimStep({
  config, agentId, after, onLive,
}: {
  config: ImportedAgentConfig
  agentId: string
  after: (ms: number, fn: () => void) => void
  onLive: () => void
}) {
  const [email, setEmail] = React.useState("")
  const [tab, setTab] = React.useState<"new" | "port">("new")
  const [areaCode, setAreaCode] = React.useState(CLAIMABLE_NUMBERS[0].areaCode)
  const [cardNum, setCardNum] = React.useState("")
  const [exp, setExp] = React.useState("")
  const [cvc, setCvc] = React.useState("")
  const [carrier, setCarrier] = React.useState("")
  const [portNum, setPortNum] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  const reserved = CLAIMABLE_NUMBERS.find((n) => n.areaCode === areaCode) ?? CLAIMABLE_NUMBERS[0]
  const emailOk = /.+@.+\..+/.test(email)

  function go() {
    if (!emailOk) { setErr("Enter your email — we'll create your Agora account with it."); return }
    if (tab === "new") {
      if (digits(cardNum).length < 12 || digits(exp).length < 3 || digits(cvc).length < 3) {
        setErr("Enter your card to claim the number."); return
      }
      setErr(null); setBusy(true)
      track(Events.card_captured, { path: "new_number", agent_id: agentId, channel: "inbound" })
      track(Events.phone_number_assigned, { number: reserved.number, agent_id: agentId, ported: false } as never)
      after(1200, () => { track(Events.deployment_went_live, { agent_id: agentId, ported: false } as never); setBusy(false); onLive() })
    } else {
      if (!carrier) { setErr("Pick the carrier your number is with."); return }
      if (digits(portNum).length < 10) { setErr("Enter the number to port."); return }
      setErr(null); setBusy(true)
      track(Events.phone_number_assigned, { number: portNum, agent_id: agentId, ported: true } as never)
      after(1200, () => { track(Events.deployment_went_live, { agent_id: agentId, ported: true } as never); setBusy(false); onLive() })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Put {config.name} on a real number</h2>
        <p className="mt-1 text-muted-foreground">Your 300 free minutes apply first. Get a new number, or keep your own.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="defect-email">Your email</Label>
        <Input id="defect-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (err) setErr(null) }} placeholder="you@company.com" autoComplete="email" />
        <p className="text-xs text-muted-foreground">We&apos;ll create your Agora account with this email — no separate signup.</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as "new" | "port"); setErr(null) }}>
        <TabsList className="w-full">
          <TabsTrigger value="new" className="flex-1 gap-1.5"><Phone className="h-3.5 w-3.5" /> Get a new number</TabsTrigger>
          <TabsTrigger value="port" className="flex-1 gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" /> Port your number</TabsTrigger>
        </TabsList>

        <TabsContent value="new" className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="defect-area">Area code</Label>
            <Select value={areaCode} onValueChange={setAreaCode}>
              <SelectTrigger id="defect-area"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLAIMABLE_NUMBERS.map((n) => <SelectItem key={n.areaCode} value={n.areaCode}>{n.areaCode} — {n.region}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="font-mono text-base font-semibold tabular-nums">{reserved.number}</p>
            <Badge variant="secondary" className="gap-1 text-xs"><Sparkles className="h-3 w-3" /> Reserved</Badge>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/[0.04] px-4 py-3 text-sm">
            <p className="font-medium">$0 today.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {PLAN_USAGE.freeMinutesIncluded} free minutes first, then pay-as-you-go. We warn you at {PLAN_USAGE.warnAtMinutes} min — never a surprise suspension.
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="defect-card">Card number</Label>
              <Input id="defect-card" value={cardNum} onChange={(e) => { setCardNum(e.target.value); if (err) setErr(null) }} inputMode="numeric" placeholder="1234 5678 9012 3456" autoComplete="cc-number" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5"><Label htmlFor="defect-exp">Expiry</Label><Input id="defect-exp" value={exp} onChange={(e) => setExp(e.target.value)} placeholder="MM / YY" autoComplete="cc-exp" /></div>
              <div className="flex-1 space-y-1.5"><Label htmlFor="defect-cvc">CVC</Label><Input id="defect-cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" autoComplete="cc-csc" /></div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Encrypted by our payment processor. We never store your card.</p>
          </div>
        </TabsContent>

        <TabsContent value="port" className="space-y-4 pt-4">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] px-4 py-3 text-sm">
            <p className="font-medium">Keep your number — no card needed.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Billing stays with your carrier until the port completes. No double-pay during cutover.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defect-carrier">Current carrier</Label>
            <Select value={carrier} onValueChange={(v) => { setCarrier(v); if (err) setErr(null) }}>
              <SelectTrigger id="defect-carrier"><SelectValue placeholder="Select your carrier" /></SelectTrigger>
              <SelectContent>{PORT_CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defect-portnum">Number to port</Label>
            <Input id="defect-portnum" value={portNum} onChange={(e) => { setPortNum(e.target.value); if (err) setErr(null) }} inputMode="tel" placeholder="+1 (555) 123-4567" />
          </div>
        </TabsContent>
      </Tabs>

      {err && <p role="alert" className="text-sm text-destructive">{err}</p>}

      <Button size="lg" className="w-full gap-1.5" onClick={go} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : tab === "new" ? <CreditCard className="h-4 w-4" /> : <ArrowLeftRight className="h-4 w-4" />}
        {busy ? "Going live…" : tab === "new" ? "Claim number & go live" : "Port & go live (no card)"}
      </Button>
    </div>
  )
}

// ─── step 4: done ───────────────────────────────────────────────────────────

function DoneStep({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{name} is live on Agora</h2>
        <p className="mt-1.5 text-muted-foreground">
          You switched in one motion — no rebuild. Place a real call to see it in Monitor.
        </p>
      </div>
      <Separator className="max-w-xs" />
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild className="gap-1.5"><Link href="/monitor">Open Monitor <ArrowRight className="h-4 w-4" /></Link></Button>
        <Button variant="outline" asChild><Link href="/deploy">Go to Studio</Link></Button>
      </div>
    </div>
  )
}
