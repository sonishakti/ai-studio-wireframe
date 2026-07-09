"use client"

// F-Eval · Variant 1 — "Suite table + drawer" (the manage-many design).
// ─────────────────────────────────────────────────────────────────────────────
// The surface is a TEST SUITE table: one row per Case. Everything else is a
// Sheet drawer over that table — authoring, a live run, and the verdict readout.
// Why a table + drawers: a suite grows to dozens of regression cases; the list
// must stay scannable while any one case can be opened without leaving it.
//
// The two honesty rules this variant is built to keep (spec.ts R7/R8 — they
// close the 3×-recurring "Talk test is a bare pulsing orb" trust gap):
//   • RUNNING renders a LIVE transcript + an explicit listening/thinking/speaking
//     STATE chip — never a bare orb (the old AgentSphere is deliberately absent).
//   • Every run wears an unmistakable "SIMULATED" label + a verdict banner, so a
//     test can never be mistaken for a real customer call.
//
// Hard constraints: only @/components/ui/* (Table, Sheet, Badge, Button,
// Textarea, Select, Input, Label) + the shared StateBanner; design tokens only
// (no hex / no arbitrary values); tabular-nums on every count/verdict.

import * as React from "react"
import {
  Play, Plus, X, Trash2, ArrowRight, AlertTriangle, Radio, Sparkles,
  CheckCircle2, XCircle, ScrollText, Wrench, Database,
  Ear, Brain, Volume2, User, Bot, PhoneIncoming,
} from "lucide-react"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { StateBanner } from "@/components/usage-spend-card"
import {
  SUITE, RUN, AGENT, type EvalVariantProps,
} from "@/components/eval-lab/spec"
import {
  evalRunStats, type AssertionKind, type EvalTurn,
} from "@/lib/campaign-data"

// The one case the RUNNING view streams (spec: EVAL_RUN's ec_happy transcript,
// revealed turn-by-turn). The failing case (ec_objection) is what RESULTS opens.
const RUNNING_CASE_ID = "ec_happy"
const FAILING_CASE_ID = "ec_objection"

// ── Presentational maps — one place so the table cell, the editor Select, and
//    the verdict drawer never disagree on an assertion kind's label/icon. ──────
const KIND_META: Record<
  Exclude<AssertionKind, "exact">,
  { label: string; icon: React.ComponentType<{ className?: string }>; valueLabel: string; placeholder: string; multiline: boolean }
> = {
  // Rubric authoring is plain language — a "PASS if…" sentence, not a regex (R4).
  rubric: {
    label: "Rubric", icon: ScrollText, valueLabel: "Pass rule — plain language",
    placeholder: "PASS if…  e.g. PASS if the agent offers a specific time and confirms the caller's email.",
    multiline: true,
  },
  // Assertions beyond text: a tool must fire, a data point must be captured (R6).
  "tool-call": {
    label: "Tool call", icon: Wrench, valueLabel: "Tool that must be called",
    placeholder: "Tool name — e.g. book_demo", multiline: false,
  },
  "data-point": {
    label: "Data point", icon: Database, valueLabel: "Data point that must be captured",
    placeholder: "Data key — e.g. caller_email", multiline: false,
  },
}
const KINDS = Object.keys(KIND_META) as Array<keyof typeof KIND_META>

// The three agent states the RUNNING view narrates in words — the orb replacement.
type Phase = "listening" | "thinking" | "speaking"
const PHASE_META: Record<Phase, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  listening: { label: "Listening", icon: Ear },
  thinking: { label: "Thinking", icon: Brain },
  speaking: { label: "Speaking", icon: Volume2 },
}

// Mock "recent real call" the save-from-test flow captures (whitespace feature E3).
// Persona + transcript are lifted from the call; only the assertion is left blank.
const MOCK_CALL = {
  id: "call_8f2a",
  when: "Today · 2:14 PM · 47s",
  from: "+1 (415) 555-0142",
  persona: {
    identity: "Inbound caller from +1 (415) 555-0142",
    goal: "reschedule an existing appointment to next week",
    personality: "Polite, in a hurry, mentions a scheduling conflict.",
  },
  transcript: [
    { role: "caller", text: "Hey, I need to move my Thursday appointment." },
    { role: "agent", text: "No problem — I have you Thursday at 10am. Want to try next Tuesday instead?" },
    { role: "caller", text: "Tuesday at 10 works great, thanks." },
    { role: "agent", text: "Done — I've moved it to Tuesday 10am and texted you a confirmation.", note: "reschedule_appointment called" },
  ] as EvalTurn[],
}

// Respect the OS motion setting: gate the streaming reveal + pulse. Reduced-motion
// users get the full transcript at once (still honest — proof of work, no theater).
function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false)
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  return reduced
}

// ─────────────────────────────────────────────────────────────────────────────

export function Variant1({ scenario }: EvalVariantProps) {
  const { view } = scenario
  const reduced = useReducedMotion()
  const stats = evalRunStats(RUN)

  // Verdicts only exist once a run has happened — RESULTS is the only view that
  // fills the table's verdict column; author/save-from-call show "Not run".
  const showVerdicts = view === "results"
  const verdictByCase = React.useMemo(
    () => Object.fromEntries(RUN.results.map((r) => [r.caseId, r.verdict])) as Record<string, "pass" | "fail">,
    [],
  )

  // Each overlay's open state is seeded from the scenario, but stays interactive
  // (Run all / Add case / a row click drive them too) so the surface feels real.
  const [runningOpen, setRunningOpen] = React.useState(view === "running")
  const [addOpen, setAddOpen] = React.useState(view === "author" || view === "save-from-call")
  const prefillFromCall = view === "save-from-call"
  const [resultsCaseId, setResultsCaseId] = React.useState<string | null>(
    view === "results" ? FAILING_CASE_ID : null,
  )

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      {/* ── Header: what this is + the two verbs (Run all · Add case) ─────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Test suite</h2>
          <p className="text-xs text-muted-foreground">
            {AGENT.name} ·{" "}
            <span className="tabular-nums">{SUITE.cases.length}</span> cases
            {showVerdicts && (
              <>
                {" · "}
                <span
                  className={cn(
                    "tabular-nums font-medium",
                    stats.allPass ? "text-success" : "text-foreground",
                  )}
                >
                  {stats.passed}/{stats.total} passing
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add case
          </Button>
          {/* R3 — one action runs every case; here it opens the live run panel. */}
          <Button size="sm" onClick={() => setRunningOpen(true)}>
            <Play className="h-3.5 w-3.5" /> Run all
            <span className="tabular-nums opacity-80">({SUITE.cases.length})</span>
          </Button>
        </div>
      </div>

      {/* ── RESULTS only: a failure never hides in a green table — it earns a
             red line above the fold that opens the offending case. ──────────── */}
      {showVerdicts && !stats.allPass && (
        <StateBanner tone="destructive" icon={AlertTriangle}>
          <p className="text-sm font-medium">
            {SUITE.cases.find((c) => c.id === FAILING_CASE_ID)?.name} failed — the agent
            invented a discount that isn&apos;t in the prompt.
          </p>
          <button
            type="button"
            onClick={() => setResultsCaseId(FAILING_CASE_ID)}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive underline-offset-2 hover:underline"
          >
            Review the failing turn <ArrowRight className="h-3 w-3" />
          </button>
        </StateBanner>
      )}

      {/* ── SAVE-FROM-CALL: the affordance that turns a real call into a test.
             One button pre-fills the drawer; the user only adds the rule (E3). ── */}
      {prefillFromCall && (
        <StateBanner tone="primary" icon={PhoneIncoming}>
          <p className="text-sm font-medium">Save this call as a regression test</p>
          <p className="text-xs text-muted-foreground">
            {MOCK_CALL.when} · {MOCK_CALL.from} — persona &amp; transcript are captured for you.
            Add one thing: what should always be true here?
          </p>
          <div className="mt-2">
            <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Sparkles className="h-3.5 w-3.5" /> Save as test
            </Button>
          </div>
        </StateBanner>
      )}

      {/* ── The suite table — the spine of the manage-many design ──────────── */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case</TableHead>
              <TableHead>Simulated caller&apos;s goal</TableHead>
              <TableHead className="text-right">Checks</TableHead>
              <TableHead className="text-right">Last verdict</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SUITE.cases.map((c) => {
              const verdict = showVerdicts ? verdictByCase[c.id] : undefined
              const clickable = Boolean(verdict)
              return (
                <TableRow
                  key={c.id}
                  data-state={resultsCaseId === c.id ? "selected" : undefined}
                  className={cn(clickable && "cursor-pointer")}
                  onClick={clickable ? () => setResultsCaseId(c.id) : undefined}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {c.name}
                      {c.fromCallId && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <PhoneIncoming className="h-3 w-3" /> from call
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-muted-foreground">
                    {c.persona.goal}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1.5">
                      {[...new Set(c.assertions.map((a) => a.kind))]
                        .filter((k): k is keyof typeof KIND_META => k in KIND_META)
                        .map((k) => {
                          const Icon = KIND_META[k].icon
                          return <Icon key={k} className="h-3.5 w-3.5 text-muted-foreground" />
                        })}
                      <span className="tabular-nums">{c.assertions.length}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {verdict ? (
                      <VerdictBadge verdict={verdict} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Not run</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* ═══ Overlays ═══════════════════════════════════════════════════════ */}
      <AddCaseSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        prefill={prefillFromCall}
        reduced={reduced}
      />
      <RunningSheet
        open={runningOpen}
        onOpenChange={setRunningOpen}
        reduced={reduced}
        onSeeVerdict={() => {
          setRunningOpen(false)
          setResultsCaseId(RUNNING_CASE_ID)
        }}
      />
      <ResultsSheet
        caseId={resultsCaseId}
        onOpenChange={(o) => !o && setResultsCaseId(null)}
      />
    </div>
  )
}

// ── Verdict pill — Badge has no "success" variant, so pass borrows success
//    tokens (still token-only); fail uses the built-in destructive variant. ────
function VerdictBadge({ verdict }: { verdict: "pass" | "fail" }) {
  return verdict === "pass" ? (
    <Badge variant="outline" className="gap-1 border-success/40 bg-success/10 text-success">
      <CheckCircle2 className="h-3 w-3" /> Pass
    </Badge>
  ) : (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3 w-3" /> Fail
    </Badge>
  )
}

// ─── AUTHOR / SAVE-FROM-CALL — the add-case drawer ───────────────────────────
// Persona (identity/goal/personality) as a stacked sequence describing one caller
// + an assertions editor where each assertion picks a kind and rubric is a plain
// "PASS if…" textarea. In prefill mode the persona + a read-only transcript are
// filled from a real call and only the assertion is left blank (E3 whitespace).

type DraftAssertion = { id: string; kind: keyof typeof KIND_META; text: string }

function AddCaseSheet({
  open, onOpenChange, prefill, reduced,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  prefill: boolean
  reduced: boolean
}) {
  const [identity, setIdentity] = React.useState("")
  const [goal, setGoal] = React.useState("")
  const [personality, setPersonality] = React.useState("")
  const [assertions, setAssertions] = React.useState<DraftAssertion[]>([])

  // Re-seed each time the sheet opens (mirrors SpendControlsSheet). Prefill lifts
  // the persona from the captured call; authoring starts blank. Either way the
  // assertion row is empty — the one thing the human must supply.
  React.useEffect(() => {
    if (!open) return
    if (prefill) {
      setIdentity(MOCK_CALL.persona.identity)
      setGoal(MOCK_CALL.persona.goal)
      setPersonality(MOCK_CALL.persona.personality)
    } else {
      setIdentity("")
      setGoal("")
      setPersonality("")
    }
    setAssertions([{ id: "d1", kind: "rubric", text: "" }])
  }, [open, prefill])

  function addAssertion() {
    setAssertions((prev) => [
      ...prev,
      { id: `d${prev.length + 1}_${Date.now()}`, kind: "rubric", text: "" },
    ])
  }
  function updateAssertion(id: string, patch: Partial<DraftAssertion>) {
    setAssertions((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)))
  }
  function removeAssertion(id: string) {
    setAssertions((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{prefill ? "Save call as test" : "Add a case"}</SheetTitle>
          <SheetDescription>
            {prefill
              ? "Persona and transcript are pre-filled from the call. Add the rule that should always hold."
              : "A case is a simulated caller plus the checks that must pass every run."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-6 pb-4">
          {/* Prefill: the captured call, read-only — proof of where this came from */}
          {prefill && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <PhoneIncoming className="h-3.5 w-3.5" /> Captured transcript · {MOCK_CALL.when}
              </p>
              <div className="space-y-2">
                {MOCK_CALL.transcript.map((t, i) => (
                  <TurnBubble key={i} turn={t} notesTone="muted" />
                ))}
              </div>
            </div>
          )}

          {/* Persona — stacked, because these three describe ONE caller in sequence */}
          <section className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Simulated caller
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="ac-identity">Identity</Label>
              <Input
                id="ac-identity"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="e.g. Jordan, ops lead at a 40-person startup"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-goal">Goal</Label>
              <Input
                id="ac-goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. book a product demo for next week"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-personality">Personality</Label>
              <Textarea
                id="ac-personality"
                rows={2}
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="e.g. Friendly, decisive, a little rushed."
              />
            </div>
          </section>

          {/* Assertions — the empty row the human must fill. In prefill mode this
              is THE task; its label asks the whitespace question directly (E3). */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {prefill ? "What should always be true here?" : "Checks"}
              </p>
              <Badge variant="secondary" className="tabular-nums">
                {assertions.length}
              </Badge>
            </div>

            {assertions.map((a, idx) => {
              const meta = KIND_META[a.kind]
              return (
                <div key={a.id} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <Select
                      value={a.kind}
                      onValueChange={(v) => updateAssertion(a.id, { kind: v as keyof typeof KIND_META })}
                    >
                      <SelectTrigger className="h-8 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KINDS.map((k) => {
                          const Icon = KIND_META[k].icon
                          return (
                            <SelectItem key={k} value={k}>
                              <Icon className="h-3.5 w-3.5" /> {KIND_META[k].label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label="Remove check"
                      disabled={assertions.length === 1}
                      onClick={() => removeAssertion(a.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`ac-val-${a.id}`} className="text-xs text-muted-foreground">
                      {meta.valueLabel}
                    </Label>
                    {meta.multiline ? (
                      <Textarea
                        id={`ac-val-${a.id}`}
                        rows={2}
                        value={a.text}
                        onChange={(e) => updateAssertion(a.id, { text: e.target.value })}
                        // Prefill nudges the exact question the user must answer.
                        placeholder={
                          prefill && idx === 0
                            ? "PASS if…  e.g. PASS if it confirms the new time and texts a confirmation."
                            : meta.placeholder
                        }
                      />
                    ) : (
                      <Input
                        id={`ac-val-${a.id}`}
                        value={a.text}
                        onChange={(e) => updateAssertion(a.id, { text: e.target.value })}
                        placeholder={meta.placeholder}
                      />
                    )}
                  </div>
                </div>
              )
            })}

            <Button variant="outline" size="sm" className="w-full" onClick={addAssertion}>
              <Plus className="h-3.5 w-3.5" /> Add another check
            </Button>
          </section>
        </div>

        <SheetFooter className="px-6">
          {/* Wireframe: persistence is mocked — the sheet just closes on save. */}
          <Button onClick={() => onOpenChange(false)}>
            {prefill ? "Save test" : "Add case"}
          </Button>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── RUNNING — the orb-gap fix ───────────────────────────────────────────────
// No AgentSphere. Instead: an unmistakable SIMULATED banner, the persona doing
// the calling (so it reads as a caller, not agent self-talk), an explicit
// listening→thinking→speaking STATE chip, and a transcript that streams in
// turn-by-turn (motion-gated). Proof of work you can read, not a mood light.

function RunningSheet({
  open, onOpenChange, reduced, onSeeVerdict,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  reduced: boolean
  onSeeVerdict: () => void
}) {
  const runCase = SUITE.cases.find((c) => c.id === RUNNING_CASE_ID)
  const transcript = React.useMemo(
    () => RUN.results.find((r) => r.caseId === RUNNING_CASE_ID)?.transcript ?? [],
    [],
  )

  const [revealed, setRevealed] = React.useState(0)
  const [phase, setPhase] = React.useState<Phase>("listening")
  const done = revealed >= transcript.length

  // Stream the transcript each time the run panel opens. A caller turn ⇒ the
  // agent is "listening"; before an agent turn it "thinks", then "speaks" as the
  // line lands. Reduced-motion ⇒ reveal all at once, rest on "speaking".
  React.useEffect(() => {
    if (!open) return
    if (reduced) {
      setRevealed(transcript.length)
      setPhase("speaking")
      return
    }
    setRevealed(0)
    setPhase(transcript[0]?.role === "agent" ? "thinking" : "listening")
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []
    const advance = (i: number) => {
      if (cancelled || i >= transcript.length) return
      const turn = transcript[i]
      setPhase(turn.role === "agent" ? "thinking" : "listening")
      timers.push(
        setTimeout(() => {
          if (cancelled) return
          if (turn.role === "agent") setPhase("speaking")
          setRevealed(i + 1)
          timers.push(setTimeout(() => advance(i + 1), 1000))
        }, 850),
      )
    }
    advance(0)
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [open, reduced, transcript])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Running · {runCase?.name}</SheetTitle>
          <SheetDescription>
            A synthetic caller is exercising {AGENT.name}. Nothing here reaches a real customer.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6 pb-4">
          {/* R8 — SIMULATED, loud and unmissable. A test must never pass for real. */}
          <div className="flex items-center justify-between rounded-lg border border-warning/40 bg-warning/10 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
              <Radio className={cn("h-4 w-4", !reduced && "animate-pulse")} /> Simulated
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              No minutes billed · not a real call
            </span>
          </div>

          {/* R2 — the caller is a persona, not the agent talking to itself. */}
          {runCase && (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Simulated caller
              </p>
              <p className="text-sm">{runCase.persona.identity}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Goal: {runCase.persona.goal}</p>
            </div>
          )}

          {/* R7 — the orb replacement: the agent's state in WORDS, not a glow. */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(Object.keys(PHASE_META) as Phase[]).map((p) => {
              const active = !done && phase === p
              const Icon = PHASE_META[p].icon
              return (
                <span
                  key={p}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors",
                    active
                      ? "border-primary/40 bg-primary/10 font-medium text-primary"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active && !reduced && "animate-pulse")} />
                  {PHASE_META[p].label}
                </span>
              )
            })}
            {done && (
              <span className="inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Run complete
              </span>
            )}
          </div>

          {/* Live transcript — the proof of work. Turns appear as the run speaks. */}
          <div className="space-y-3">
            {transcript.slice(0, revealed).map((t, i) => (
              <TurnBubble key={i} turn={t} notesTone="muted" />
            ))}
            {!done && (
              <p className="pl-8 text-xs text-muted-foreground">
                {phase === "listening" ? "Caller speaking…" : "Agent responding…"}
              </p>
            )}
          </div>
        </div>

        <SheetFooter className="px-6">
          {done ? (
            <Button onClick={onSeeVerdict}>
              See verdict <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Streaming the simulated call…</span>
          )}
          <SheetClose asChild>
            <Button variant="outline">
              <X className="h-3.5 w-3.5" /> {done ? "Close" : "Stop run"}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── RESULTS — the verdict drawer for one case ───────────────────────────────
// StateBanner verdict (pass=success / fail=destructive) + the per-assertion list
// naming WHICH check broke and the judge's one-line reason + the full transcript
// with the offending turn (the invented discount) flagged in destructive.

function ResultsSheet({
  caseId, onOpenChange,
}: {
  caseId: string | null
  onOpenChange: (o: boolean) => void
}) {
  const suiteCase = SUITE.cases.find((c) => c.id === caseId)
  const result = RUN.results.find((r) => r.caseId === caseId)
  const failed = result?.verdict === "fail"

  return (
    <Sheet open={caseId != null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{suiteCase?.name}</SheetTitle>
          <SheetDescription>{suiteCase?.persona.identity}</SheetDescription>
        </SheetHeader>

        {suiteCase && result && (
          <div className="space-y-5 px-6 pb-4">
            {/* Verdict banner — the honest headline of the whole run (R8). */}
            <StateBanner
              tone={failed ? "destructive" : "success"}
              icon={failed ? XCircle : CheckCircle2}
            >
              <p className="text-sm font-medium">
                {failed ? "Failed" : "Passed"} ·{" "}
                <span className="tabular-nums">
                  {result.assertions.filter((a) => a.verdict === "pass").length}/
                  {result.assertions.length}
                </span>{" "}
                checks passed
              </p>
              <p className="text-xs text-muted-foreground">
                {failed
                  ? "One or more checks broke — the failing turn is flagged in the transcript below."
                  : "Every check held on this simulated run."}
              </p>
            </StateBanner>

            {/* Per-assertion list — which check, its verdict, the judge's reason. */}
            <section className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Checks
              </p>
              {result.assertions.map((ar) => {
                const def = suiteCase.assertions.find((a) => a.id === ar.id)
                const kind = def && def.kind in KIND_META
                  ? KIND_META[def.kind as keyof typeof KIND_META]
                  : null
                const Icon = kind?.icon ?? ScrollText
                return (
                  <div
                    key={ar.id}
                    className={cn(
                      "rounded-lg border p-3",
                      ar.verdict === "fail"
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" /> {kind?.label ?? "Rubric"}
                        </p>
                        <p className="text-sm">{def?.text}</p>
                      </div>
                      <VerdictBadge verdict={ar.verdict} />
                    </div>
                    {/* The judge's one-line reasoning — required on a failure. */}
                    <p
                      className={cn(
                        "mt-2 border-t pt-2 text-xs",
                        ar.verdict === "fail"
                          ? "border-destructive/30 text-destructive"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      <span className="font-medium">Judge:</span> {ar.reasoning}
                    </p>
                  </div>
                )
              })}
            </section>

            {/* Full transcript — the failing case's invented-discount turn is
                visible and flagged, so the verdict is inspectable, not asserted. */}
            <section className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Transcript
              </p>
              {result.transcript.map((t, i) => (
                <TurnBubble
                  key={i}
                  turn={t}
                  notesTone={failed ? "destructive" : "muted"}
                />
              ))}
            </section>
          </div>
        )}

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── One transcript turn, reused by RUNNING / RESULTS / the prefill capture ────
// A note carries either a neutral tool trace (muted) or, on a failed case, the
// reason the turn is wrong (destructive + AlertTriangle) — that flag is how the
// invented-discount turn becomes visibly the culprit.
function TurnBubble({
  turn, notesTone,
}: {
  turn: EvalTurn
  notesTone: "muted" | "destructive"
}) {
  const isCaller = turn.role === "caller"
  const Icon = isCaller ? User : Bot
  return (
    <div className="flex gap-2">
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
          isCaller ? "border-border bg-muted text-muted-foreground" : "border-primary/30 bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-xs font-medium text-muted-foreground">
          {isCaller ? "Simulated caller" : AGENT.name}
        </p>
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            isCaller ? "border-border bg-muted/40" : "border-border bg-card",
          )}
        >
          {turn.text}
        </div>
        {turn.note && (
          <p
            className={cn(
              "inline-flex items-center gap-1 text-xs",
              notesTone === "destructive" ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {notesTone === "destructive" ? (
              <AlertTriangle className="h-3 w-3 shrink-0" />
            ) : (
              <Wrench className="h-3 w-3 shrink-0" />
            )}
            {turn.note}
          </p>
        )}
      </div>
    </div>
  )
}
