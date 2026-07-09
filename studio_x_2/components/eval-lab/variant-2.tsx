"use client"

import * as React from "react"
import {
  Sparkles, Radio, RotateCcw, Check, X, CheckCircle2, XCircle,
  Ear, Brain, AudioLines, Plus, Trash2, User, Target, Drama, Wand2,
  ArrowRight, ScrollText, Wrench, Database, ClipboardCheck, PhoneCall,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
// Reuse the exact idioms of the two surfaces this feature sits beside, so the
// eval lab can't visually diverge from them:
//  • StateBanner — the verdict banner (same tones as Billing money states).
//  • AgentSphere — the same orb the Talk test uses; here it's SMALL + captioned
//    with an explicit state, which is the whole fix (never a bare pulsing orb).
import { StateBanner } from "@/components/usage-spend-card"
import { AgentSphere } from "@/components/agent-test-panel"
import { SUITE, RUN, AGENT, type EvalScenario, type EvalVariantProps } from "./spec"
import { evalRunStats, type AssertionKind, type EvalCaseResult } from "@/lib/campaign-data"

/**
 * Variant 2 — "Conversation-first": the TRANSCRIPT is the product.
 * ────────────────────────────────────────────────────────────────
 * The thesis: "did it work?" is answered by watching the call, not reading a
 * table. So every surface centers a chat transcript of a simulated conversation.
 *  • RUNNING  — a live, streaming transcript (caller vs agent) + a persistent
 *    listening/thinking/speaking line + a small AgentSphere, under a bold
 *    "Simulated call" header (R7 closes the orb gap, R8 the honesty label).
 *  • RESULTS  — the same transcript per case; agent turns carry inline ✓/✗
 *    assertion chips; a compact rail flips between the 3 cases; the FAILING case
 *    opens first with the invented-discount turn highlighted + judge reasoning.
 *  • AUTHOR   — "cast the caller" (persona) then "what must always be true?"
 *    (rubric / tool-call / data-point assertions); "Run this case" → RUNNING.
 *  • SAVE-FROM-CALL — a real call log with "Turn this into a test": keep the
 *    transcript as the case's reference, only ask for the assertion (R5).
 */

// ─── Shared vocab ─────────────────────────────────────────────────────────────

// The three assertion kinds we let people AUTHOR (the type also has "exact",
// but rubric/tool-call/data-point cover the research asks R4/R6). One place so
// the author form, the chips, and the labels never drift.
const KIND_META: Record<
  Exclude<AssertionKind, "exact">,
  { label: string; icon: React.ComponentType<{ className?: string }>; hint: string; placeholder: string; mono: boolean }
> = {
  rubric: {
    label: "Rubric", icon: ScrollText, mono: false,
    hint: "A plain-language rule the judge scores.",
    placeholder: "offers a specific time and confirms the caller's email",
  },
  "tool-call": {
    label: "Tool call", icon: Wrench, mono: true,
    hint: "A tool the agent must actually call.",
    placeholder: "book_demo",
  },
  "data-point": {
    label: "Data point", icon: Database, mono: true,
    hint: "A value the agent must capture.",
    placeholder: "caller_email",
  },
}
const AUTHORABLE_KINDS = Object.keys(KIND_META) as (keyof typeof KIND_META)[]

// The seeded happy case + its run are the RUNNING demo material.
const HAPPY_CASE = SUITE.cases.find((c) => c.id === "ec_happy")!
const HAPPY_RESULT = RUN.results.find((r) => r.caseId === "ec_happy")!

export function Variant2({ scenario }: EvalVariantProps) {
  // View is seeded from the prop but LOCAL so intra-flow jumps work in place —
  // "Run this case" (author→running) and "edit caller" (running→author) are the
  // whole point of a conversation-first loop; a table variant wouldn't have them.
  const [view, setView] = React.useState<EvalScenario["view"]>(scenario.view)
  const [cameFromAuthor, setCameFromAuthor] = React.useState(false)
  React.useEffect(() => setView(scenario.view), [scenario.view])

  return (
    <div className="mx-auto w-full max-w-3xl">
      {view === "author" && (
        <AuthorView onRun={() => { setCameFromAuthor(true); setView("running") }} />
      )}
      {view === "running" && (
        <RunningView
          fromAuthor={cameFromAuthor}
          onEditCaller={() => setView("author")}
        />
      )}
      {view === "results" && <ResultsView />}
      {view === "save-from-call" && <SaveFromCallView />}
    </div>
  )
}

// ─── The transcript primitives (shared by RUNNING + RESULTS) ──────────────────

/** One chat turn. Caller sits RIGHT + primary tint (the "user"); agent sits LEFT
 *  + muted (the "assistant") — the standard chat reading. `flag` promotes a turn
 *  to destructive (the offending line in a failed case). Bubbles are token bg
 *  only: bg-primary/10 vs bg-muted. */
function TurnBubble({
  role,
  children,
  flag = false,
}: {
  role: "caller" | "agent"
  children: React.ReactNode
  flag?: boolean
}) {
  const isAgent = role === "agent"
  return (
    <div className={cn("flex flex-col gap-1", isAgent ? "items-start" : "items-end")}>
      <span className="px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {isAgent ? AGENT.name : "Simulated caller"}
      </span>
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isAgent ? "rounded-tl-sm bg-muted" : "rounded-tr-sm bg-primary/10",
          flag && "bg-destructive/10 ring-1 ring-destructive/40",
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** The three-dot "typing" bubble for the in-flight turn while streaming. Motion
 *  is gated at the dot (motion-safe:animate-bounce) — reduced-motion users never
 *  see the stream at all (we jump to the full transcript), so this is belt +
 *  suspenders. */
function TypingBubble({ role }: { role: "caller" | "agent" }) {
  return (
    <TurnBubble role={role}>
      <span className="flex items-center gap-1 py-0.5" aria-label="typing">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 motion-safe:animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </span>
    </TurnBubble>
  )
}

// ─── RUNNING — a live simulated call ──────────────────────────────────────────

type AgentState = "listening" | "thinking" | "speaking" | "ended"
const STATE_META: Record<AgentState, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  listening: { label: "Listening", icon: Ear, cls: "text-primary" },
  thinking: { label: "Thinking", icon: Brain, cls: "text-primary" },
  speaking: { label: "Speaking", icon: AudioLines, cls: "text-primary" },
  ended: { label: "Call ended", icon: CheckCircle2, cls: "text-success" },
}

function RunningView({ fromAuthor, onEditCaller }: { fromAuthor: boolean; onEditCaller: () => void }) {
  const turns = HAPPY_RESULT.transcript

  // Build a scripted timeline from the transcript so the agent-state line and
  // the revealed turns stay in lockstep. For each turn we emit two events:
  //   1. "typing"  — the in-flight turn; agent is Listening (caller) or Thinking
  //   2. "settled" — the turn is now on screen; agent is Speaking (its own turn)
  // then a final "ended" event. Driving BOTH from one index guarantees the
  // status text can never lie about what's on screen.
  const timeline = React.useMemo(() => {
    const evts: { reveal: number; state: AgentState; typing: "caller" | "agent" | null }[] = []
    turns.forEach((t, i) => {
      evts.push({ reveal: i, state: t.role === "caller" ? "listening" : "thinking", typing: t.role })
      evts.push({ reveal: i + 1, state: t.role === "agent" ? "speaking" : "listening", typing: null })
    })
    evts.push({ reveal: turns.length, state: "ended", typing: null })
    return evts
  }, [turns])

  const [ti, setTi] = React.useState(0)
  const evt = timeline[Math.min(ti, timeline.length - 1)]
  const revealed = evt.reveal
  const agentState = evt.state
  const running = ti < timeline.length - 1

  // Advance the timeline on a timer; typing beats linger, settled beats are
  // quick. Reduced-motion: skip straight to the finished transcript (honesty
  // rule still holds — the state line reads "Call ended" and every turn is
  // present). Cleanup prevents overlapping timers on replay/unmount.
  React.useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      setTi(timeline.length - 1)
      return
    }
    if (ti >= timeline.length - 1) return
    const dur = timeline[ti].typing ? 1250 : 550
    const id = window.setTimeout(() => setTi((n) => n + 1), ti === 0 ? 650 : dur)
    return () => window.clearTimeout(id)
  }, [ti, timeline])

  const StateIcon = STATE_META[agentState].icon
  const stats = evalRunStats(RUN)

  return (
    <div className="space-y-4">
      {/* R8 — this must NEVER read as a real call. A loud "Simulated call"
          header + a Simulated pill + a $0-minutes reassurance carry that. */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Simulated call</h2>
              <Badge variant="secondary" className="gap-1 text-xs">
                <Sparkles className="h-3 w-3" /> Simulated
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              A scripted caller talks to {AGENT.name} — no real minutes used.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setTi(0)}
          disabled={running}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Replay
        </Button>
      </header>

      {/* Who the caller is — the persona under test, so you read the transcript
          knowing the intent it's probing. */}
      <div className="rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs">
        <span className="font-medium">Case · {HAPPY_CASE.name}</span>
        <span className="text-muted-foreground">
          {" — "}{HAPPY_CASE.persona.identity}. Wants to {HAPPY_CASE.persona.goal}.
        </span>
      </div>

      {/* Persistent agent-state line + SMALL sphere. This is the anti-orb: the
          orb is here, but it's captioned with an explicit, changing state, so
          the user always knows the agent is doing something (not frozen). */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5">
        <AgentSphere size={40} active={agentState === "thinking" || agentState === "speaking"} />
        <div className="min-w-0">
          <div className={cn("flex items-center gap-1.5 text-sm font-medium", STATE_META[agentState].cls)}>
            <StateIcon className="h-4 w-4" />
            {STATE_META[agentState].label}
            {running && agentState !== "ended" && <span className="text-muted-foreground">…</span>}
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            {running ? `Turn ${Math.min(revealed + 1, turns.length)} of ${turns.length}` : `${turns.length} turns · complete`}
          </p>
        </div>
      </div>

      {/* The transcript IS the product. aria-live so the stream is announced. */}
      <div
        className="space-y-3 rounded-xl border border-border bg-card p-4"
        aria-live="polite"
      >
        {turns.slice(0, revealed).map((t, i) => (
          <TurnBubble key={i} role={t.role}>
            <p>{t.text}</p>
            {/* A tool the agent fired mid-turn — shown as evidence, not chrome. */}
            {t.note && (
              <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                <Wrench className="h-3 w-3" /> {t.note}
              </p>
            )}
          </TurnBubble>
        ))}
        {/* In-flight turn — the typing bubble on the correct side. */}
        {evt.typing && <TypingBubble role={evt.typing} />}
      </div>

      {/* Completion footer — points at the verdict without pretending to grade
          here (grading is the RESULTS surface). */}
      {!running && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3.5 py-3">
          <p className="text-sm text-muted-foreground">
            Simulation complete. In the suite this run scored{" "}
            <span className="font-medium text-foreground tabular-nums">{stats.passed}/{stats.total}</span> cases.
          </p>
          <div className="flex items-center gap-2">
            {fromAuthor && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={onEditCaller}>
                <Wand2 className="h-3.5 w-3.5" /> Edit the caller
              </Button>
            )}
            <Button size="sm" className="gap-1.5">
              See verdict <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── RESULTS — the same transcript view, now graded ───────────────────────────

type MergedAssertion = {
  id: string
  kind: AssertionKind
  text: string
  verdict: "pass" | "fail"
  reasoning: string
}

/** Join the case's assertion DEFINITIONS (kind/text) with the run's per-assertion
 *  VERDICTS (pass/fail + reasoning). */
function mergedAssertions(result: EvalCaseResult): MergedAssertion[] {
  const def = SUITE.cases.find((c) => c.id === result.caseId)!
  return result.assertions.map((r) => {
    const a = def.assertions.find((x) => x.id === r.id)!
    return { id: a.id, kind: a.kind, text: a.text, verdict: r.verdict, reasoning: r.reasoning }
  })
}

/** Anchor each assertion to the agent turn it's "about", so the chip lands next
 *  to the evidence rather than in a detached list:
 *   • tool-call → the turn whose note names the tool
 *   • a FAILED assertion → the offending turn (the one carrying a note), so the
 *     invented-discount line gets both the destructive highlight AND its reason
 *   • otherwise → the final agent turn (the verdict is about the whole reply). */
function anchorMap(result: EvalCaseResult): Map<number, MergedAssertion[]> {
  const merged = mergedAssertions(result)
  const agentIdx = result.transcript.flatMap((t, i) => (t.role === "agent" ? [i] : []))
  const lastAgent = agentIdx[agentIdx.length - 1]
  const notedAgent = agentIdx.find((i) => result.transcript[i].note)
  const map = new Map<number, MergedAssertion[]>()
  for (const a of merged) {
    let idx = lastAgent
    if (a.kind === "tool-call") {
      const hit = agentIdx.find((i) => (result.transcript[i].note ?? "").toLowerCase().includes(a.text.toLowerCase()))
      if (hit != null) idx = hit
    } else if (a.verdict === "fail" && notedAgent != null) {
      idx = notedAgent
    }
    if (!map.has(idx)) map.set(idx, [])
    map.get(idx)!.push(a)
  }
  return map
}

function AssertionChip({ a }: { a: MergedAssertion }) {
  const ok = a.verdict === "pass"
  const meta = a.kind === "exact" ? KIND_META.rubric : KIND_META[a.kind]
  const KindIcon = meta.icon
  return (
    <div
      className={cn(
        "rounded-lg border px-2.5 py-2 text-xs",
        ok ? "border-success/40 bg-success/5" : "border-destructive/40 bg-destructive/5",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          className={cn(
            "mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
            ok ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive",
          )}
        >
          {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <KindIcon className="h-3 w-3" /> {meta.label}
            </span>
            <span className={cn("font-medium", meta.mono && "font-mono")}>{a.text}</span>
          </p>
          {/* The judge's one-line reasoning — inline, next to the turn it judged. */}
          <p className="mt-0.5 text-muted-foreground">{a.reasoning}</p>
        </div>
      </div>
    </div>
  )
}

function ResultsView() {
  const stats = evalRunStats(RUN)
  // Failing case opens by DEFAULT — the red verdict is the reason you ran this,
  // so don't make the user hunt for it.
  const firstFail = RUN.results.find((r) => r.verdict === "fail")?.caseId
  const [selectedId, setSelectedId] = React.useState<string>(firstFail ?? RUN.results[0].caseId)

  const result = RUN.results.find((r) => r.caseId === selectedId)!
  const caseDef = SUITE.cases.find((c) => c.id === selectedId)!
  const anchors = React.useMemo(() => anchorMap(result), [result])
  const failed = result.verdict === "fail"
  const failingAssertion = mergedAssertions(result).find((a) => a.verdict === "fail")

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Suite results</h2>
            <Badge variant="secondary" className="gap-1 text-xs">
              <Sparkles className="h-3 w-3" /> Simulated
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{AGENT.name} · every case is a watched conversation</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {stats.passed} / {stats.total} passed
          </p>
          <p className="text-xs text-muted-foreground">1 needs a fix</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[210px_1fr]">
        {/* Compact rail — flip between the three transcripts. Each row is a
            pass/fail dot + name; the failing one is unmistakable. */}
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible" aria-label="Cases">
          {RUN.results.map((r) => {
            const c = SUITE.cases.find((x) => x.id === r.caseId)!
            const pass = r.verdict === "pass"
            const active = r.caseId === selectedId
            return (
              <button
                key={r.caseId}
                type="button"
                onClick={() => setSelectedId(r.caseId)}
                aria-current={active}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors md:w-full",
                  active ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
                )}
              >
                {pass ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className={cn("block text-xs", pass ? "text-muted-foreground" : "text-destructive")}>
                    {pass ? "Passed" : "Failed"}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>

        <div className="min-w-0 space-y-3">
          {/* Verdict banner — same StateBanner as the Billing money surfaces. */}
          {failed ? (
            <StateBanner tone="destructive" icon={XCircle}>
              <p className="text-sm font-medium">Failed · {caseDef.name}</p>
              <p className="text-xs text-muted-foreground">
                {failingAssertion?.reasoning ?? "An assertion did not hold."}
              </p>
            </StateBanner>
          ) : (
            <StateBanner tone="success" icon={CheckCircle2}>
              <p className="text-sm font-medium">Passed · {caseDef.name}</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                All {result.assertions.length} assertion{result.assertions.length === 1 ? "" : "s"} held.
              </p>
            </StateBanner>
          )}

          {/* The caller under test — same context line as RUNNING. */}
          <p className="px-1 text-xs text-muted-foreground">
            <User className="mr-1 inline h-3 w-3" />
            {caseDef.persona.identity} · <span className="italic">{caseDef.persona.personality}</span>
          </p>

          {/* Same transcript view — but agent turns now carry inline ✓/✗ chips,
              and the offending turn is highlighted destructive. */}
          <div className="space-y-3 rounded-xl border border-border bg-card p-4">
            {result.transcript.map((t, i) => {
              const chips = anchors.get(i)
              const turnFailed = !!chips?.some((a) => a.verdict === "fail")
              return (
                <div key={i} className="space-y-1.5">
                  <TurnBubble role={t.role} flag={turnFailed}>
                    <p>{t.text}</p>
                    {t.note && (
                      <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                        <Wrench className="h-3 w-3" /> {t.note}
                      </p>
                    )}
                  </TurnBubble>
                  {chips && chips.length > 0 && (
                    <div className="ml-1 max-w-[82%] space-y-1.5">
                      {chips.map((a) => (
                        <AssertionChip key={a.id} a={a} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AUTHOR — "cast the caller", then "what must always be true?" ─────────────

function PersonaField({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" /> {label}
      </Label>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

type DraftAssertion = { id: string; kind: keyof typeof KIND_META; text: string }
let assertSeq = 0

function AuthorView({ onRun }: { onRun: () => void }) {
  // Seed from the happy case so the form reads populated, not empty. Persona is
  // free text — the "casting" metaphor: identity / goal / personality.
  const [caseName, setCaseName] = React.useState(HAPPY_CASE.name)
  const [identity, setIdentity] = React.useState(HAPPY_CASE.persona.identity)
  const [goal, setGoal] = React.useState(HAPPY_CASE.persona.goal)
  const [personality, setPersonality] = React.useState(HAPPY_CASE.persona.personality)
  const [asserts, setAsserts] = React.useState<DraftAssertion[]>(() =>
    HAPPY_CASE.assertions
      .filter((a) => a.kind !== "exact")
      .map((a) => ({
        id: `a${assertSeq++}`,
        kind: a.kind as keyof typeof KIND_META,
        // Rubric text is stored WITHOUT the "PASS if " prefix — the chip renders
        // it, so the field stays a clean sentence to edit (R4).
        text: a.kind === "rubric" ? a.text.replace(/^PASS if\s+/i, "") : a.text,
      })),
  )

  const setAssert = (id: string, patch: Partial<DraftAssertion>) =>
    setAsserts((xs) => xs.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  const addAssert = () =>
    setAsserts((xs) => [...xs, { id: `a${assertSeq++}`, kind: "rubric", text: "" }])
  const removeAssert = (id: string) => setAsserts((xs) => xs.filter((a) => a.id !== id))

  const canRun = identity.trim() && goal.trim() && asserts.some((a) => a.text.trim())

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-center gap-2">
          <Drama className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Design a test</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Cast a caller, then say what must always be true. We&apos;ll run it as a simulated call.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="case-name" className="text-sm font-medium">Case name</Label>
        <Input id="case-name" value={caseName} onChange={(e) => setCaseName(e.target.value)} placeholder="e.g. Books a demo" />
      </div>

      {/* Cast the caller — a persona reads like a character sheet (R1, R2: this
          is the SIMULATED caller, not the agent talking to itself). */}
      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">Cast the caller</p>
            <p className="text-xs text-muted-foreground">Who your agent will be tested against — a role, not real traffic.</p>
          </div>
        </div>
        <PersonaField icon={User} label="Who's calling" hint="Their identity and situation.">
          <Input value={identity} onChange={(e) => setIdentity(e.target.value)} placeholder="Jordan, ops lead at a 40-person startup" />
        </PersonaField>
        <PersonaField icon={Target} label="What they want" hint="The goal that drives the call.">
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="book a product demo for next week" />
        </PersonaField>
        <PersonaField icon={Drama} label="How they behave" hint="Personality and tactics — this shapes how they push.">
          <Textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            className="min-h-[64px] text-sm"
            placeholder="Friendly, decisive, a little rushed."
          />
        </PersonaField>
      </section>

      {/* Assertions — "what should always be true?" Rubric = plain-language
          PASS-if; tool-call / data-point cover R6 (not just text). */}
      <section className="space-y-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold">What should always be true?</p>
            <p className="text-xs text-muted-foreground">Each one is checked against the transcript after the call.</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {asserts.map((a) => {
            const meta = KIND_META[a.kind]
            return (
              <div key={a.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <Select value={a.kind} onValueChange={(v) => setAssert(a.id, { kind: v as keyof typeof KIND_META })}>
                    <SelectTrigger className="h-8 w-[128px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AUTHORABLE_KINDS.map((k) => {
                        const KIcon = KIND_META[k].icon
                        return (
                          <SelectItem key={k} value={k} className="text-xs">
                            <KIcon className="h-3.5 w-3.5" /> {KIND_META[k].label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground">{meta.hint}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-7 w-7 shrink-0 text-muted-foreground"
                    aria-label="Remove assertion"
                    onClick={() => removeAssert(a.id)}
                    disabled={asserts.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {a.kind === "rubric" ? (
                  // The "PASS if" is a fixed prefix chip so the rule always reads
                  // as a pass condition; the field is just the clause.
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="shrink-0 font-mono text-xs">PASS if</Badge>
                    <Input
                      value={a.text}
                      onChange={(e) => setAssert(a.id, { text: e.target.value })}
                      placeholder={meta.placeholder}
                      className="text-sm"
                    />
                  </div>
                ) : (
                  <Input
                    value={a.text}
                    onChange={(e) => setAssert(a.id, { text: e.target.value })}
                    placeholder={meta.placeholder}
                    className="font-mono text-sm"
                  />
                )}
              </div>
            )
          })}
        </div>

        <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={addAssert}>
          <Plus className="h-3.5 w-3.5" /> Add assertion
        </Button>
      </section>

      {/* "Run this case" jumps straight to RUNNING — the author's payoff is
          watching the caller they cast actually talk to the agent. */}
      <div className="flex items-center justify-end gap-2">
        <Button className="gap-1.5" onClick={onRun} disabled={!canRun}>
          <PhoneCall className="h-4 w-4" /> Run this case
        </Button>
      </div>
    </div>
  )
}

// ─── SAVE-FROM-CALL — a real call becomes a regression test ──────────────────

function SaveFromCallView() {
  // The source is a REAL call log (reusing the happy transcript as the recording)
  // — deliberately framed as LIVE, not Simulated, so the "save" moment is clearly
  // "capture something that already happened."
  const call = HAPPY_RESULT.transcript
  const [capturing, setCapturing] = React.useState(false)
  const [assertion, setAssertion] = React.useState("")
  const [kind, setKind] = React.useState<keyof typeof KIND_META>("rubric")
  const [saved, setSaved] = React.useState(false)

  const save = () => {
    setSaved(true)
    // Wireframe: no backend — the toast stands in for persistence to the suite.
    toast.success("Saved as a regression test", {
      description: "The recording is kept as the case's reference transcript.",
    })
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 text-success">
            <PhoneCall className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Call recording</h2>
              {/* NOT "Simulated" — the honesty label works both ways. */}
              <Badge variant="outline" className="gap-1 border-success/40 text-xs text-success">
                <Radio className="h-3 w-3" /> Live call
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              Inbound · +1 (415) 555-0132 · 1m 48s
            </p>
          </div>
        </div>
        {!capturing && !saved && (
          <Button size="sm" className="gap-1.5" onClick={() => setCapturing(true)}>
            <ClipboardCheck className="h-4 w-4" /> Turn this into a test
          </Button>
        )}
      </header>

      {saved && (
        <StateBanner tone="success" icon={CheckCircle2}>
          <p className="text-sm font-medium">Saved to your suite as a regression test.</p>
          <p className="text-xs text-muted-foreground">
            The recording below is the case&apos;s reference transcript. It&apos;ll re-run against every future version of {AGENT.name}.
          </p>
        </StateBanner>
      )}

      {/* The capture panel — the whole R5 move: keep the transcript, only ask
          for the assertion. Persona is pre-filled FROM the call (read-only). */}
      {capturing && !saved && (
        <section className="space-y-4 rounded-xl border border-primary/30 bg-primary/[0.03] p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold">One thing left: what should always be true here?</p>
            <p className="text-xs text-muted-foreground">
              We kept the recording as the reference and pre-filled the caller from it. You just add the check.
            </p>
          </div>

          {/* Pre-filled persona — derived from the call, editable later, so the
              user isn't retyping what the transcript already shows. */}
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="gap-1 font-normal">
              <User className="h-3 w-3" /> Inbound caller (from recording)
            </Badge>
            <Badge variant="secondary" className="gap-1 font-normal">
              <Target className="h-3 w-3" /> book a demo
            </Badge>
            <Badge variant="secondary" className="gap-1 font-normal">
              <Drama className="h-3 w-3" /> friendly, decisive
            </Badge>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2">
              <Select value={kind} onValueChange={(v) => setKind(v as keyof typeof KIND_META)}>
                <SelectTrigger className="h-8 w-[128px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTHORABLE_KINDS.map((k) => {
                    const KIcon = KIND_META[k].icon
                    return (
                      <SelectItem key={k} value={k} className="text-xs">
                        <KIcon className="h-3.5 w-3.5" /> {KIND_META[k].label}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">{KIND_META[kind].hint}</span>
            </div>
            {kind === "rubric" ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0 font-mono text-xs">PASS if</Badge>
                <Input
                  autoFocus
                  value={assertion}
                  onChange={(e) => setAssertion(e.target.value)}
                  placeholder={KIND_META.rubric.placeholder}
                  className="text-sm"
                />
              </div>
            ) : (
              <Input
                autoFocus
                value={assertion}
                onChange={(e) => setAssertion(e.target.value)}
                placeholder={KIND_META[kind].placeholder}
                className="font-mono text-sm"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCapturing(false)}>Cancel</Button>
            <Button size="sm" className="gap-1.5" disabled={!assertion.trim()} onClick={save}>
              <ClipboardCheck className="h-4 w-4" /> Save as test
            </Button>
          </div>
        </section>
      )}

      {/* The real transcript — the reference that gets KEPT. Read-only, but the
          same bubble idiom as the simulated views, so a saved test and a live
          call read as the same object. */}
      <div className="space-y-3 rounded-xl border border-border bg-card p-4">
        {call.map((t, i) => (
          <TurnBubble key={i} role={t.role}>
            <p>{t.text}</p>
            {t.note && (
              <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-background/60 px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                <Wrench className="h-3 w-3" /> {t.note}
              </p>
            )}
          </TurnBubble>
        ))}
      </div>
    </div>
  )
}
