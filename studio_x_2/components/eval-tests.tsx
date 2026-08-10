"use client"

import * as React from "react"
import {
  Play, Plus, CheckCircle2, XCircle, MessageSquareText, Wrench, Braces, ClipboardCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"
import { toast } from "sonner"
import { InfoHint } from "@/components/wizard/info-hint"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { StateBanner } from "@/components/usage-spend-card"
import { SimTranscript, AgentStateChips, SimulatedBanner, type SimState } from "@/components/sim-transcript"
import {
  EVAL_SUITE, EVAL_RUN,
  type EvalCase, type EvalCaseResult, type AssertionKind, type EvalTurn,
} from "@/lib/campaign-data"

/**
 * TestsSection + EvalResults — evals/simulation (F-Eval, judge winner V1
 * "suite table" + V2 inline verdict coupling + shared SimTranscript;
 * LEARNINGS §20 2026-07-09).
 *
 * Author a Suite → Case (persona + plain-language assertions) in a Sheet (the
 * step-build ResourceField idiom); Run all streams the cases as simulated
 * callers with a live transcript + verdict; the failing case names WHICH
 * assertion broke, anchored onto the offending turn. "Save a real call as a
 * test" reuses the same sheet, pre-filled.
 */

const KIND_META: Record<AssertionKind, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  rubric: { label: "Rubric", icon: MessageSquareText },
  "tool-call": { label: "Tool call", icon: Wrench },
  "data-point": { label: "Data point", icon: Braces },
  exact: { label: "Exact", icon: ClipboardCheck },
}

// The failing turn per result (the flagged bubble) — derived, not hardcoded.
function flaggedTurnIndex(result: EvalCaseResult): number | undefined {
  if (result.verdict !== "fail") return undefined
  const i = result.transcript.findIndex((t) => t.note)
  return i >= 0 ? i : undefined
}

export function TestsSection({
  agentName: _agentName = "your agent",
  extra = [],
  headerNote,
  onRunSummary,
  variant = "rail",
  leadingActions,
}: {
  agentName?: string
  /** Contextual auto-generated cases + their synthesized judge results (v5
   *  Test section, 2026-07-28) — rendered ABOVE the starter suite; results
   *  still hide until the case is run. */
  extra?: { case: EvalCase; result: EvalCaseResult }[]
  /** One quiet line under the actions — e.g. the judge-model disclosure. */
  headerNote?: React.ReactNode
  /** Reports each completed "Run all" — feeds the builder's Test strip verdict. */
  onRunSummary?: (s: { passed: number; failed: number; total: number }) => void
  /** Figma 2861-52041: the rail table is Name·Status only; the Test section
   *  adds a Description column + the mono "02/03 PASSING" header bar. */
  variant?: "rail" | "section"
  /** Rendered before Run all — the section slots Autogenerate here. */
  leadingActions?: React.ReactNode
}) {
  const run = EVAL_RUN
  // The suite is STATE so authored cases actually land in the table —
  // "Add case" silently discarding work was the round-6 #1 trust break.
  const [authored, setAuthored] = React.useState<EvalCase[]>(EVAL_SUITE.cases)
  // Generated (contextual) cases lead; the starter suite + authored follow.
  const cases = React.useMemo(() => [...extra.map((e) => e.case), ...authored], [extra, authored])
  const setCases = (fn: (prev: EvalCase[]) => EvalCase[]) => setAuthored(fn)
  const [addOpen, setAddOpen] = React.useState(false)
  const [running, setRunning] = React.useState<EvalCase | null>(null)
  const [openResult, setOpenResult] = React.useState<EvalCaseResult | null>(null)
  // "Run all" runs the SUITE (round-6: opening one case's sheet read as the
  // other two vanishing) — brief running state, then a summary line.
  const [runningAll, setRunningAll] = React.useState(false)
  const [lastRunNote, setLastRunNote] = React.useState<string | null>(null)
  // Design set 22–23 Jul (AgentBuilder/DEFAULT): sample scenarios ship
  // UN-RUN — status "–" until the user runs them. No fake failures on first
  // paint (2026-07-24 P0). Verdicts exist only for cases the user ran.
  const [ranIds, setRanIds] = React.useState<Set<string>>(new Set())
  const resultFor = (id: string) =>
    ranIds.has(id)
      ? extra.find((e) => e.case.id === id)?.result ?? run.results.find((r) => r.caseId === id)
      : undefined
  const allResults = [...extra.map((e) => e.result), ...run.results]
  const ranResults = allResults.filter((r) => ranIds.has(r.caseId))
  const stats = { passed: ranResults.filter((r) => r.verdict === "pass").length, total: ranResults.length }
  const hasRun = ranIds.size > 0

  // 2026-07-21 (owner): the Test section IS this feature — test scenarios from
  // the cn2meet roadmap (F-Eval), no longer future-scope-gated and no longer a
  // sidecar under a "start test call" button. The hosting SectionRow carries
  // the title + description, so the header here is just the actions.

  const runAll = () => {
    track(Events.suite_run_all, {})
    setRunningAll(true)
    window.setTimeout(() => {
      setRunningAll(false)
      const results = allResults.filter((r) => cases.some((c) => c.id === r.caseId))
      setRanIds(new Set(results.map((r) => r.caseId)))
      const passed = results.filter((r) => r.verdict === "pass").length
      const notRun = cases.length - results.length
      setLastRunNote(
        `Last run just now — ${passed} passed · ${results.length - passed} failed${notRun > 0 ? ` · ${notRun} not run (new case)` : ""}`,
      )
      onRunSummary?.({ passed, failed: results.length - passed, total: results.length })
      toast(`${results.length} scenario${results.length === 1 ? "" : "s"} ran`, {
        description: `${passed} passed · ${results.length - passed} failed. Open a row for the transcript.`,
      })
    }, 1200)
  }
  // A single-row run reveals THAT case's verdict when its sheet closes.
  const runOne = (c: EvalCase) => {
    setRunning(c)
    setRanIds((s) => new Set([...s, c.id]))
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Failing ↔ Deploy relationship, nested behind a dotted hint (owner
            2026-07-21: reduce upfront text). Figma copy: a question link. */}
        <InfoHint label={variant === "section" ? "Do failing scenarios block deploy?" : "How scoring works?"}>
          A judge model scores each run — {"{verdict, score, reason}"} per assertion. A failure
          caused by a real config gap names the setting to fix. Failing scenarios never block deploy.
        </InfoHint>
        <div className="flex items-center gap-2">
          {leadingActions}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={runningAll}
            onClick={runAll}
          >
            <Play className="h-3.5 w-3.5" />{" "}
            {runningAll ? "Running…" : hasRun ? `Re-Run (${cases.length})` : `Run all (${cases.length})`}
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add case
          </Button>
        </div>
      </div>
      {headerNote ? <div className="text-xs text-muted-foreground">{headerNote}</div> : null}

      {/* Suite TABLE (Figma 2861-52041): rail = Test Name · Status · run;
          section adds Description + the mono "02/03 PASSING · 01 FAILED" bar. */}
      <div className="overflow-hidden rounded-lg border border-border">
        {variant === "section" ? (
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 font-mono text-xs uppercase tracking-wider">
            <span className={cn(stats.total > 0 ? "text-foreground" : "text-muted-foreground")}>
              {stats.total > 0 ? `${pad2(stats.passed)}/${pad2(cases.length)} passing` : "Not run yet"}
            </span>
            {stats.total > 0 && stats.total - stats.passed > 0 && (
              <span className="text-destructive">{pad2(stats.total - stats.passed)} failed</span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 text-xs">
            <span className="font-medium">
              {stats.total > 0 ? `${stats.passed}/${stats.total} passing` : "Not run yet"}
              {lastRunNote ? <span className="font-normal text-muted-foreground"> · {lastRunNote}</span> : null}
            </span>
            {stats.total > 0 && <StatusPill passed={stats.passed} total={stats.total} />}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Name</TableHead>
              {variant === "section" && <TableHead>Description</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.map((c) => {
              const res = resultFor(c.id)
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <button
                      type="button"
                      className="rounded text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => res && setOpenResult(res)}
                    >
                      {c.name}
                    </button>
                  </TableCell>
                  {variant === "section" && (
                    <TableCell className="max-w-[260px] truncate text-muted-foreground">
                      Caller wants to {c.persona.goal || "—"}
                    </TableCell>
                  )}
                  <TableCell>
                    {res ? (
                      <Badge
                        variant={res.verdict === "pass" ? "secondary" : "destructive"}
                        className={cn("gap-1 text-xs", res.verdict === "pass" && "bg-success/15 text-success")}
                      >
                        {res.verdict === "pass" ? "Pass" : "Fail"}
                      </Badge>
                    ) : (
                      /* Figma: un-run rows carry a quiet "Not Run" badge. */
                      <Badge variant="secondary" className="text-xs text-muted-foreground">Not Run</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Run ${c.name}`}
                      onClick={() => runOne(c)}
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <AddCaseSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onSave={(c) => {
          setCases((prev) => [...prev, c])
          toast.success(`"${c.name}" added to the suite`, { description: "It runs with the next Run all." })
        }}
      />
      <RunSheet caseItem={running} onOpenChange={(o) => !o && setRunning(null)} result={running ? resultFor(running.id) : undefined} />
      <ResultSheet result={openResult} caseItem={openResult ? cases.find((c) => c.id === openResult.caseId) : undefined} onOpenChange={(o) => !o && setOpenResult(null)} />
    </section>
  )
}

const pad2 = (n: number) => String(n).padStart(2, "0")

function StatusPill({ passed, total }: { passed: number; total: number }) {
  const allPass = passed === total
  const failing = total - passed
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", allPass ? "text-success" : "text-destructive")}>
      {allPass ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {allPass ? "All tests pass" : `${failing} test${failing === 1 ? "" : "s"} failing`}
    </span>
  )
}

// ─── Run: simulated caller, live transcript, verdict ──────────────────────────

function RunSheet({
  caseItem,
  result,
  onOpenChange,
}: {
  caseItem: EvalCase | null
  result?: EvalCaseResult
  onOpenChange: (o: boolean) => void
}) {
  const [state, setState] = React.useState<SimState>("listening")
  const [done, setDone] = React.useState(false)

  React.useEffect(() => {
    if (caseItem) { setDone(false); setState("listening"); track(Events.test_run_started, {}) }
  }, [caseItem])

  const turns: EvalTurn[] = result?.transcript ?? []
  const flagged = result ? flaggedTurnIndex(result) : undefined

  return (
    <Sheet open={!!caseItem} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-center gap-2">{caseItem?.name}</SheetTitle>
          <SheetDescription>Caller: {caseItem?.persona.identity}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <SimulatedBanner />
          <AgentStateChips state={done ? "ended" : state} />
          {caseItem && (
            <SimTranscript
              key={caseItem.id}
              turns={turns}
              stream
              flaggedIndex={flagged}
              onState={(s) => { setState(s); if (s === "ended") { setDone(true); if (result) track(Events.test_run_completed, { verdict: result.verdict }) } }}
            />
          )}
          {done && result && (
            <StateBanner tone={result.verdict === "pass" ? "success" : "destructive"} icon={result.verdict === "pass" ? CheckCircle2 : XCircle}>
              <p className="text-sm font-medium">
                {result.verdict === "pass" ? "Passed" : "Failed"} ({result.assertions.filter((a) => a.verdict === "pass").length}/{result.assertions.length} checks)
              </p>
              {result.assertions.filter((a) => a.verdict === "fail").map((a) => (
                <p key={a.id} className="text-xs text-muted-foreground">{a.reasoning}</p>
              ))}
            </StateBanner>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Result: verdict + assertions anchored to the offending turn (V2 graft) ──

function ResultSheet({
  result,
  caseItem,
  onOpenChange,
}: {
  result: EvalCaseResult | null
  caseItem?: EvalCase
  onOpenChange: (o: boolean) => void
}) {
  const flagged = result ? flaggedTurnIndex(result) : undefined
  return (
    <Sheet open={!!result} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{caseItem?.name}</SheetTitle>
          <SheetDescription>Caller: {caseItem?.persona.identity}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {result && (
            <>
              <StateBanner tone={result.verdict === "pass" ? "success" : "destructive"} icon={result.verdict === "pass" ? CheckCircle2 : XCircle}>
                <p className="text-sm font-medium">
                  {result.verdict === "pass" ? "Passed" : "Failed"} ({result.assertions.filter((a) => a.verdict === "pass").length}/{result.assertions.length} checks)
                </p>
              </StateBanner>
              <div className="space-y-1.5" onClick={() => track(Events.assertion_failed_viewed, {})}>
                {result.assertions.map((a) => (
                  <div key={a.id} className="flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    {a.verdict === "pass" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                    <span className="min-w-0 flex-1">
                      {caseItem?.assertions.find((x) => x.id === a.id)?.text ?? "Check"}
                      <span className="block text-xs text-muted-foreground">{a.reasoning}</span>
                    </span>
                  </div>
                ))}
              </div>
              <p className="pt-1 text-xs font-medium text-muted-foreground">Transcript</p>
              <SimTranscript turns={result.transcript} flaggedIndex={flagged} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Author a case (persona + assertions), reused for save-as-test ────────────

export function AddCaseSheet({
  open,
  onOpenChange,
  prefill,
  onSave,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Save-a-real-call-as-a-test: pre-fill persona + transcript, ask only for
   *  the assertion (R5 — the whitespace). */
  prefill?: { identity: string; goal: string; personality: string; transcript: EvalTurn[]; callId: string }
  /** Receives the authored case — the host appends it to its suite. Without
   *  this the sheet silently discarded work (user-test 2026-07-21 round 6). */
  onSave?: (c: EvalCase) => void
}) {
  const [name, setName] = React.useState("")
  const [persona, setPersona] = React.useState({ identity: "", goal: "", personality: "" })
  const [kind, setKind] = React.useState<AssertionKind>("rubric")
  const [assertion, setAssertion] = React.useState("")

  React.useEffect(() => {
    if (open && prefill) {
      setName("Saved from a real call")
      setPersona({ identity: prefill.identity, goal: prefill.goal, personality: prefill.personality })
    } else if (open && !prefill) {
      // Seed a worked example so the first test isn't a blank page (V2 graft).
      setName("")
      setPersona({ identity: "", goal: "", personality: "" })
    }
  }, [open, prefill])

  const canSave = name.trim() && persona.goal.trim() && assertion.trim()

  function save() {
    track(prefill ? Events.save_call_as_test : Events.test_authored, {})
    onSave?.({
      id: `ec_${Date.now().toString(36)}`,
      name: name.trim(),
      persona: { ...persona },
      assertions: [{ id: "a1", kind, text: assertion.trim() }],
      ...(prefill ? { fromCallId: prefill.callId } : {}),
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{prefill ? "Save this call as a test" : "Add a test case"}</SheetTitle>
          <SheetDescription>
            {prefill
              ? "We kept the caller and transcript — just say what should always be true."
              : "Cast a simulated caller, then say what must always be true."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6">
          <div className="space-y-1.5">
            <Label htmlFor="tc-name">Case name</Label>
            <Input id="tc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Books a demo" />
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-medium">The simulated caller</p>
            <div className="space-y-1.5">
              <Label htmlFor="tc-id" className="text-xs text-muted-foreground">Identity</Label>
              <Input id="tc-id" value={persona.identity} onChange={(e) => setPersona({ ...persona, identity: e.target.value })} placeholder="Jordan, ops lead at a startup" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-goal" className="text-xs text-muted-foreground">Goal</Label>
              <Input id="tc-goal" value={persona.goal} onChange={(e) => setPersona({ ...persona, goal: e.target.value })} placeholder="book a demo for next week" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc-pers" className="text-xs text-muted-foreground">Personality</Label>
              <Input id="tc-pers" value={persona.personality} onChange={(e) => setPersona({ ...persona, personality: e.target.value })} placeholder="Friendly, decisive, a little rushed" />
            </div>
          </div>

          {prefill && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">From the real call</p>
              <SimTranscript turns={prefill.transcript} compact />
            </div>
          )}

          <div className="space-y-2">
            <Label>What should always be true?</Label>
            <ToggleGroup type="single" value={kind} onValueChange={(v) => v && setKind(v as AssertionKind)} variant="outline" size="sm" className="w-full">
              {(["rubric", "tool-call", "data-point"] as AssertionKind[]).map((k) => (
                <ToggleGroupItem key={k} value={k} className="flex-1 text-xs">{KIND_META[k].label}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            {kind === "rubric" ? (
              <Textarea value={assertion} onChange={(e) => setAssertion(e.target.value)} placeholder="PASS if the agent offers a specific time and confirms the caller's email." className="min-h-[72px] text-sm" />
            ) : (
              <Input value={assertion} onChange={(e) => setAssertion(e.target.value)} placeholder={kind === "tool-call" ? "book_demo" : "email"} className="font-mono text-sm" />
            )}
            <p className="text-xs text-muted-foreground">
              {kind === "rubric" ? "An AI judge scores this in plain language." : kind === "tool-call" ? "Passes if the agent calls this tool." : "Passes if this field was captured."}
            </p>
          </div>
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
          <Button disabled={!canSave} onClick={save}>{prefill ? "Save as test" : "Add case"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
