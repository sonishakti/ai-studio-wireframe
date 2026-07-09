"use client"

// F-Eval variant 3 — "Confidence dashboard" (the ship-decision framing).
// ─────────────────────────────────────────────────────────────────────────────
// The thesis: evals exist to answer ONE question — "is this agent safe to
// deploy?" So the flagship surface (RESULTS) leads with a confidence read — a
// big "2 / 3 cases passing" + a StateBanner that gates the deploy decision
// ("1 test failing — review before you deploy" / "All tests pass — ready to
// deploy"). Everything else hangs off that verdict.
//
// The two honesty rules from spec.ts are load-bearing here, not decoration:
//   • RUNNING renders a live TRANSCRIPT + explicit agent state + a "Simulated"
//     label — never a bare orb (closes the 3×-recurring Talk-test trust gap).
//   • Every run carries a "Simulated" badge + verdict banner so a test can
//     never be mistaken for a real call.
//
// All state derives from SUITE/RUN + evalRunStats — the verdict machine is the
// seeded mock data, never re-implemented. Timers are mock + motion-gated.

import * as React from "react"
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Rocket, Plus,
  PhoneCall, Ear, Loader2, AudioLines, FlaskConical, ArrowRight, Save,
  Wrench, Hash, MessageSquareText, ChevronDown, AlertTriangle, ArrowLeft,
} from "lucide-react"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
// Reuse the exact banner idiom from the Billing money surfaces — the verdict
// read and the spend read must speak in one voice.
import { StateBanner } from "@/components/usage-spend-card"
// Reuse the shared orb — the honesty rule bans a *bare* orb, not the orb; here
// it sits ABOVE a live transcript + state chip + "Simulated" label.
import { AgentSphere } from "@/components/agent-test-panel"
import { SUITE, RUN, AGENT, type EvalVariantProps } from "@/components/eval-lab/spec"
import {
  evalRunStats,
  type EvalCase, type EvalCaseResult, type EvalTurn, type AssertionKind,
} from "@/lib/campaign-data"

// One local view state so the surfaces feel wired together (Run again ↔ dashboard
// ↔ Add a check) without leaving the harness. Seeded from the scenario; remounts
// per scenario via the harness key, so this never fights the URL.
type View = "author" | "running" | "results" | "save-from-call"

// Join each authored case with its run result once — the dashboard, the run
// overlay, and the save flow all read the same pairing.
function caseResult(caseId: string): EvalCaseResult | undefined {
  return RUN.results.find((r) => r.caseId === caseId)
}

// prefers-reduced-motion: the run overlay animates a transcript; honor the
// setting by rendering the finished state instantly instead of stepping.
function useReducedMotion() {
  const [reduce, setReduce] = React.useState(false)
  React.useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduce(m.matches)
    sync()
    m.addEventListener?.("change", sync)
    return () => m.removeEventListener?.("change", sync)
  }, [])
  return reduce
}

export function Variant3({ scenario }: EvalVariantProps) {
  const [view, setView] = React.useState<View>(scenario.view)
  const reduce = useReducedMotion()
  const stats = evalRunStats(RUN) // { passed, total, allPass } — never recomputed by hand

  return (
    <div className="space-y-4">
      {view === "results" && (
        <ConfidenceDashboard
          stats={stats}
          onRunAgain={() => setView("running")}
          onAddCheck={() => setView("author")}
        />
      )}
      {view === "running" && (
        <RunOverlay reduce={reduce} onSeeResults={() => setView("results")} />
      )}
      {view === "author" && <AddCheck onBack={() => setView("results")} />}
      {view === "save-from-call" && <SaveFromCall onBack={() => setView("results")} />}
    </div>
  )
}

// ─── RESULTS · the confidence dashboard (flagship surface) ────────────────────
// Reads top-to-bottom as a ship decision: headline read → gate banner → the
// (not-yet-wired) deploy-gate note → the case grid where the red one opens.

function ConfidenceDashboard({
  stats,
  onRunAgain,
  onAddCheck,
}: {
  stats: { passed: number; total: number; allPass: boolean }
  onRunAgain: () => void
  onAddCheck: () => void
}) {
  const failing = stats.total - stats.passed
  // The failing case opens inline; passing cases can open too, but the red one
  // is the reason to be here, so it starts expanded.
  const firstFail = SUITE.cases.find((c) => caseResult(c.id)?.verdict === "fail")
  const [expandedId, setExpandedId] = React.useState<string | null>(firstFail?.id ?? null)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Pre-deploy checks</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {AGENT.name} · {stats.total} simulated callers, run just now
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onAddCheck}>
              <Plus className="h-3.5 w-3.5" /> Add a check
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={onRunAgain}>
              <FlaskConical className="h-3.5 w-3.5" /> Run again
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Headline confidence read: number before adjective ──────────── */}
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
              stats.allPass ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {stats.allPass ? <ShieldCheck className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
          </div>
          <div>
            <p className="text-3xl font-semibold tracking-tight tabular-nums leading-none">
              {stats.passed} / {stats.total}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              cases passing{" "}
              {failing > 0 && (
                <span className="text-destructive font-medium tabular-nums">
                  · {failing} failing
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── The gate read: this banner is the deploy decision ──────────── */}
        {stats.allPass ? (
          <StateBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium">All tests pass — ready to deploy.</p>
            <p className="text-xs text-muted-foreground">
              Every simulated caller got a safe, on-task answer. Re-run after any prompt
              or stack change.
            </p>
          </StateBanner>
        ) : (
          <StateBanner tone="destructive" icon={ShieldAlert}>
            <p className="text-sm font-medium">
              {failing} test failing — review before you deploy.
            </p>
            <p className="text-xs text-muted-foreground">
              Your agent invented a discount it was never given. Fix the prompt or add a
              guardrail, then re-run — open the red case below to see exactly where.
            </p>
          </StateBanner>
        )}

        {/* ── Reference the deploy story WITHOUT building the gate ────────── */}
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Rocket className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          Not a gate yet — a future <span className="font-medium text-foreground">Go Live</span>{" "}
          check could block deploy while this suite is red. For now it&apos;s advisory.
        </p>

        <Separator />

        {/* ── Case grid: compact tiles, the failing one opens inline ─────── */}
        <div className="grid gap-3 sm:grid-cols-2">
          {SUITE.cases.map((c) => {
            const result = caseResult(c.id)
            const expanded = expandedId === c.id
            return (
              <CaseTile
                key={c.id}
                evalCase={c}
                result={result}
                expanded={expanded}
                onToggle={() => setExpandedId(expanded ? null : c.id)}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// One case tile. Compact by default; expands to the transcript + the assertion
// that broke. The expanded tile spans the full row so the transcript has room.
function CaseTile({
  evalCase,
  result,
  expanded,
  onToggle,
}: {
  evalCase: EvalCase
  result: EvalCaseResult | undefined
  expanded: boolean
  onToggle: () => void
}) {
  const failed = result?.verdict === "fail"
  const failedAssertion = result?.assertions.find((a) => a.verdict === "fail")
  const authored = evalCase.assertions.find((a) => a.id === failedAssertion?.id)

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        expanded && "sm:col-span-2",
        failed ? "border-destructive/40 bg-destructive/[0.03]" : "border-border bg-card",
      )}
    >
      {/* Whole header is the toggle — a tile, not a nested control soup. */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
      >
        <VerdictBadge verdict={result?.verdict} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{evalCase.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            Wants to {evalCase.persona.goal}
          </p>
          {/* The one-line judge reason lives on the tile for fails — the read
              is available before you even open the transcript. */}
          {failed && failedAssertion && (
            <p className="mt-1.5 text-xs text-destructive">
              {failedAssertion.reasoning}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded && result && (
        <div className="space-y-3 border-t border-border/60 px-3.5 py-3">
          {/* Which assertion, in the author's own words. */}
          <div className="space-y-1.5">
            {result.assertions.map((a) => {
              const src = evalCase.assertions.find((x) => x.id === a.id)
              return (
                <div key={a.id} className="flex items-start gap-2">
                  {a.verdict === "pass" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-success" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-destructive" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs">{assertionLabel(src)}</p>
                    <p className="text-xs text-muted-foreground">{a.reasoning}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* The transcript — flagNotes surfaces the invented-discount turn. */}
          <TranscriptView turns={result.transcript} flagNotes={failed} />

          {/* Close the loop back to the ship decision. */}
          {failed && authored && (
            <p className="text-xs text-muted-foreground">
              This is the turn to fix. Re-run to clear the gate.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── RUNNING · the run overlay (honesty rules live here) ──────────────────────
// Framed as batch progress — "checking case 1 of 3…" — but each case shows its
// own live transcript + agent state, and a permanent "Simulated" label. This is
// the anti-bare-orb: the orb is present, but it is never the only proof of work.

function RunOverlay({
  reduce,
  onSeeResults,
}: {
  reduce: boolean
  onSeeResults: () => void
}) {
  const total = RUN.results.length
  const totalTurns = RUN.results.reduce((n, r) => n + r.transcript.length, 0)

  // caseIdx === total ⇒ the whole batch is done. turnIdx = turns revealed in
  // the current case. Reduced motion jumps straight to done.
  const [caseIdx, setCaseIdx] = React.useState(reduce ? total : 0)
  const [turnIdx, setTurnIdx] = React.useState(0)
  const done = caseIdx >= total

  React.useEffect(() => {
    if (reduce) setCaseIdx(total)
  }, [reduce, total])

  React.useEffect(() => {
    if (reduce || done) return
    const current = RUN.results[caseIdx]
    // 500ms lead-in on a new case (the "dialing" beat), 750ms per turn after.
    const t = window.setTimeout(() => {
      if (turnIdx < current.transcript.length) setTurnIdx((n) => n + 1)
      else {
        setCaseIdx((n) => n + 1)
        setTurnIdx(0)
      }
    }, turnIdx === 0 ? 500 : 750)
    return () => window.clearTimeout(t)
  }, [caseIdx, turnIdx, done, reduce])

  const current = done ? null : RUN.results[caseIdx]
  const revealed = current ? current.transcript.slice(0, turnIdx) : []
  // Turns already fully checked in earlier cases + turns shown now → smooth bar.
  const checkedTurns =
    RUN.results.slice(0, caseIdx).reduce((n, r) => n + r.transcript.length, 0) + turnIdx
  const pct = Math.round((checkedTurns / totalTurns) * 100)

  // Agent state from the last revealed turn: caller spoke ⇒ agent thinking;
  // agent spoke ⇒ speaking; nothing yet ⇒ listening for the caller.
  const lastRole = revealed[revealed.length - 1]?.role
  const agentState: AgentState =
    revealed.length === 0 ? "listening" : lastRole === "caller" ? "thinking" : "speaking"

  const currentCase = current
    ? SUITE.cases.find((c) => c.id === current.caseId)
    : undefined

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Running pre-deploy checks</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {total} simulated callers — no real numbers dialed, no minutes billed.
            </CardDescription>
          </div>
          {/* The label that must never be missing — a test ≠ a real call. */}
          <Badge variant="warning" className="gap-1">
            <FlaskConical className="h-3 w-3" /> Simulated
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* ── Batch progress across all N cases ──────────────────────────── */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
            <span>
              {done
                ? `Checked ${total} of ${total} cases`
                : `Checking case ${caseIdx + 1} of ${total} · ${currentCase?.name ?? ""}`}
            </span>
            <span>{pct}%</span>
          </div>
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Batch progress"
            className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className={cn("h-full rounded-full transition-all", done ? "bg-success" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Per-case dots — neutral while running (no verdict spoiler). */}
          <div className="mt-2 flex items-center gap-1.5">
            {RUN.results.map((r, i) => (
              <span
                key={r.caseId}
                aria-hidden
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i < caseIdx ? "w-6 bg-foreground/30" : i === caseIdx && !done ? "w-8 bg-primary" : "w-6 bg-muted",
                )}
              />
            ))}
          </div>
        </div>

        {!done ? (
          <>
            {/* ── Orb + state chip: proof-of-life, but not the ONLY proof ── */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <AgentSphere size={72} active={agentState === "speaking"} />
              <AgentStateChip state={agentState} reduce={reduce} />
            </div>

            {/* ── Live transcript: the actual proof of work ──────────────── */}
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <PhoneCall className="h-3.5 w-3.5" />
                Simulated caller: {currentCase?.persona.identity}
              </div>
              <TranscriptView turns={revealed} compact />
            </div>
          </>
        ) : (
          // Done — hand off to the confidence read; user-driven, never auto.
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium">All {total} cases checked.</p>
              <p className="text-xs text-muted-foreground">
                Here&apos;s whether this agent is safe to deploy.
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={onSeeResults}>
              See the confidence read <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

type AgentState = "listening" | "thinking" | "speaking"

// The explicit agent state — the other half of the anti-bare-orb rule. A word,
// not a mood; an icon that says what the agent is doing right now.
function AgentStateChip({ state, reduce }: { state: AgentState; reduce: boolean }) {
  const meta: Record<AgentState, { label: string; Icon: React.ComponentType<{ className?: string }>; spin?: boolean }> = {
    listening: { label: "Listening", Icon: Ear },
    thinking: { label: "Thinking", Icon: Loader2, spin: true },
    speaking: { label: "Speaking", Icon: AudioLines },
  }
  const { label, Icon, spin } = meta[state]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
      <Icon className={cn("h-3.5 w-3.5 text-primary", spin && !reduce && "animate-spin")} />
      {label}
    </span>
  )
}

// ─── AUTHOR · "Add a check" (reachable from the dashboard) ────────────────────
// Framed as "add what must always be true before you ship." A Case = a persona
// (identity/goal/personality) + a plain-language assertion. Tool-call and
// data-point kinds are first-class, not text-only (R1/R4/R6).

const KIND_META: Record<
  Exclude<AssertionKind, "exact">,
  { label: string; Icon: React.ComponentType<{ className?: string }>; fieldLabel: string; placeholder: string }
> = {
  rubric: {
    label: "Rubric",
    Icon: MessageSquareText,
    fieldLabel: "Pass if…",
    placeholder: "PASS if the agent explains value before quoting a price.",
  },
  "tool-call": {
    label: "Tool call",
    Icon: Wrench,
    fieldLabel: "Tool that must be called",
    placeholder: "book_demo",
  },
  "data-point": {
    label: "Data point",
    Icon: Hash,
    fieldLabel: "Data point that must be captured",
    placeholder: "caller_email",
  },
}

function AddCheck({ onBack }: { onBack: () => void }) {
  const [kind, setKind] = React.useState<Exclude<AssertionKind, "exact">>("rubric")
  const [identity, setIdentity] = React.useState("")
  const [goal, setGoal] = React.useState("")
  const [personality, setPersonality] = React.useState("")
  const [name, setName] = React.useState("")
  const [assertion, setAssertion] = React.useState("")
  // Mock persistence — a wireframe, no backend. Newly-added checks stack on top
  // of the seeded suite so the action feels real.
  const [added, setAdded] = React.useState<string[]>([])

  const kindMeta = KIND_META[kind]
  const canAdd = name.trim() && goal.trim() && assertion.trim()

  function add() {
    if (!canAdd) return
    setAdded((prev) => [name.trim(), ...prev])
    setName(""); setIdentity(""); setGoal(""); setPersonality(""); setAssertion("")
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Add a check</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Add what must always be true before you ship.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Context: the suite already holds N checks — this adds one more. */}
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            This suite guards {SUITE.cases.length + added.length} things
          </p>
          <div className="flex flex-wrap gap-1.5">
            {added.map((n) => (
              <Badge key={`new-${n}`} variant="secondary" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" /> {n} · just added
              </Badge>
            ))}
            {SUITE.cases.map((c) => (
              <Badge key={c.id} variant="outline">{c.name}</Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* ── Persona: the simulated caller (R1/R2) ──────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            The simulated caller
          </p>
          <Field id="ac-name" label="Case name">
            <Input id="ac-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Refund request" />
          </Field>
          <Field id="ac-identity" label="Who they are">
            <Input id="ac-identity" value={identity} onChange={(e) => setIdentity(e.target.value)}
              placeholder="Casey, an existing customer past their trial" />
          </Field>
          <Field id="ac-goal" label="What they want">
            <Input id="ac-goal" value={goal} onChange={(e) => setGoal(e.target.value)}
              placeholder="get a refund for a duplicate charge" />
          </Field>
          <Field id="ac-personality" label="How they behave">
            <Input id="ac-personality" value={personality} onChange={(e) => setPersonality(e.target.value)}
              placeholder="Frustrated, wants a fast resolution." />
          </Field>
        </div>

        <Separator />

        {/* ── Assertion: plain-language rubric OR a tool/data check (R4/R6) ─ */}
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            What must be true
          </p>
          <ToggleGroup
            type="single"
            variant="outline"
            value={kind}
            onValueChange={(v) => v && setKind(v as Exclude<AssertionKind, "exact">)}
            className="flex-wrap"
          >
            {(Object.keys(KIND_META) as Array<Exclude<AssertionKind, "exact">>).map((k) => {
              const { label, Icon } = KIND_META[k]
              return (
                <ToggleGroupItem key={k} value={k} className="gap-1.5 text-xs">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>

          <Field id="ac-assertion" label={kindMeta.fieldLabel}>
            {kind === "rubric" ? (
              <Textarea id="ac-assertion" rows={2} value={assertion}
                onChange={(e) => setAssertion(e.target.value)} placeholder={kindMeta.placeholder} />
            ) : (
              <Input id="ac-assertion" value={assertion} className="font-mono"
                onChange={(e) => setAssertion(e.target.value)} placeholder={kindMeta.placeholder} />
            )}
          </Field>
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <kindMeta.Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {kind === "rubric"
              ? "A judge reads the transcript and marks this pass or fail — write it like a rule."
              : kind === "tool-call"
                ? "The run passes only if the agent actually calls this tool."
                : "The run passes only if this value gets captured during the call."}
          </p>
        </div>

        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" disabled={!canAdd} onClick={add}>
            <Plus className="h-3.5 w-3.5" /> Add to suite
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── SAVE-FROM-CALL · turn a real call into a regression test (R5) ────────────
// The whitespace move: a real call looked off — save it so it can never regress.
// Everything except the assertion is pre-filled FROM the call; the user only
// answers "what should always be true here?"

function SaveFromCall({ onBack }: { onBack: () => void }) {
  // Stand in the failing case for a "real call that looked off" — same shape a
  // captured call would have (persona derived, transcript verbatim).
  const source = SUITE.cases.find((c) => caseResult(c.id)?.verdict === "fail") ?? SUITE.cases[0]
  const call = caseResult(source.id)
  // Pre-fill the assertion with the obvious guardrail; the user confirms/edits.
  const [assertion, setAssertion] = React.useState(
    "PASS if the agent never invents a discount that isn't in the prompt.",
  )
  const [saved, setSaved] = React.useState(false)

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm">Save this call as a test</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              A real call looked off. Save it as a failing test so it can&apos;t regress.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onBack}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {saved ? (
          <StateBanner tone="success" icon={CheckCircle2}>
            <p className="text-sm font-medium">Saved as a failing regression test.</p>
            <p className="text-xs text-muted-foreground">
              It runs with every future suite — this exact miss can&apos;t slip back in
              unnoticed. It&apos;ll show red on the dashboard until the prompt is fixed.
            </p>
          </StateBanner>
        ) : (
          <StateBanner tone="warning" icon={AlertTriangle}>
            <p className="text-sm font-medium">This call looked off.</p>
            <p className="text-xs text-muted-foreground">
              The agent offered a discount that isn&apos;t in its prompt. Capture it as a
              test so it&apos;s caught before every deploy from now on.
            </p>
          </StateBanner>
        )}

        {/* Pre-filled FROM the call — read-only, the point is you didn't type it. */}
        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pre-filled from the call
            </p>
            <Badge variant="secondary" className="gap-1">
              <PhoneCall className="h-3 w-3" /> Real call · 2m ago
            </Badge>
          </div>
          <PrefillRow label="Caller" value={source.persona.identity} />
          <PrefillRow label="They wanted" value={source.persona.goal} />
          {call && (
            <div className="pt-1">
              <TranscriptView turns={call.transcript} flagNotes compact />
            </div>
          )}
        </div>

        {/* The ONE thing the user supplies. */}
        <Field id="sfc-assertion" label="What should always be true here?">
          <Textarea id="sfc-assertion" rows={2} value={assertion}
            onChange={(e) => { setAssertion(e.target.value); setSaved(false) }} />
        </Field>

        <div className="flex justify-end">
          <Button size="sm" className="gap-1.5" disabled={!assertion.trim() || saved} onClick={() => setSaved(true)}>
            <Save className="h-3.5 w-3.5" /> Save as failing test
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

// The pass/fail verdict badge — the atom the whole dashboard is built from.
function VerdictBadge({ verdict }: { verdict?: "pass" | "fail" }) {
  if (verdict === "pass") {
    return (
      <span className="mt-0.5 inline-flex h-6 items-center gap-1 rounded-md bg-success/10 px-1.5 text-xs font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" /> Pass
      </span>
    )
  }
  if (verdict === "fail") {
    return (
      <span className="mt-0.5 inline-flex h-6 items-center gap-1 rounded-md bg-destructive/10 px-1.5 text-xs font-medium text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Fail
      </span>
    )
  }
  return <span className="mt-0.5 inline-flex h-6 items-center rounded-md bg-muted px-1.5 text-xs text-muted-foreground">—</span>
}

// A transcript is proof of work. caller left / agent right; a turn's `note`
// (the invented-discount flag) surfaces as a destructive callout when flagNotes.
function TranscriptView({
  turns,
  flagNotes = false,
  compact = false,
}: {
  turns: EvalTurn[]
  flagNotes?: boolean
  compact?: boolean
}) {
  if (turns.length === 0) {
    return <p className="py-2 text-center text-xs text-muted-foreground">Connecting…</p>
  }
  return (
    <div className={cn("space-y-2", !compact && "rounded-lg border border-border bg-muted/20 p-3")}>
      {turns.map((t, i) => {
        const isAgent = t.role === "agent"
        return (
          <div key={i} className={cn("flex", isAgent ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] space-y-1", isAgent ? "items-end text-right" : "items-start")}>
              <p className="text-[0.625rem] font-medium uppercase tracking-wider text-muted-foreground">
                {isAgent ? "Agent" : "Caller"}
              </p>
              <p
                className={cn(
                  "inline-block rounded-lg px-2.5 py-1.5 text-xs",
                  isAgent ? "bg-primary/10 text-foreground" : "bg-card border border-border",
                  // The offending turn wears its flag when we're rendering a verdict.
                  flagNotes && t.note && "border border-destructive/50 bg-destructive/[0.06]",
                )}
              >
                {t.text}
              </p>
              {flagNotes && t.note && (
                <p className="flex items-center gap-1 text-[0.625rem] text-destructive">
                  <AlertTriangle className="h-3 w-3 shrink-0" /> {t.note}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function PrefillRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{value}</span>
    </div>
  )
}

// Human-readable label for an authored assertion, whatever its kind.
function assertionLabel(a?: { kind: AssertionKind; text: string }): string {
  if (!a) return "Assertion"
  if (a.kind === "tool-call") return `Calls ${a.text}`
  if (a.kind === "data-point") return `Captures ${a.text}`
  return a.text
}
