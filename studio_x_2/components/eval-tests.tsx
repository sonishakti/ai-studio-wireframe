"use client"

import * as React from "react"
import {
  Play, Plus, Trash2, CheckCircle2, XCircle, MessageSquareText, Wrench, Braces, ClipboardCheck,
  AudioLines, ShieldCheck,
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
  EVAL_SUITE, EVAL_RUN, caseType, canRunWithAudio, runEstimate, AGORA_RATE_PER_MIN,
  type EvalCase, type EvalCaseResult, type AssertionKind, type EvalTurn,
  type EvalCaseType, type RunMode, type ToolMocking,
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

/** The two machines, in the user's words. The sentences are the whole teaching
 *  job: Vapi says "did it make the right next decision" vs "did it reach the
 *  right outcome", and that framing tested better than any jargon we had. */
const TYPE_META: Record<EvalCaseType, { label: string; question: string; blurb: string }> = {
  decision: {
    label: "Decision check",
    question: "Did it make the right next move?",
    blurb: "You give the conversation so far. Only the agent's next reply is judged. Runs in seconds, no audio, no minutes.",
  },
  conversation: {
    label: "Conversation",
    question: "Did it reach the right outcome?",
    blurb: "A caller you describe pursues a goal to the end. Run it as text, or with audio to hear the real thing.",
  },
}

/** Spoken form of a run, used on buttons and result rows alike. */
const modeLabel = (m: RunMode) => (m === "audio" ? "audio" : "text")

/** "~4 min" / "~8s" — the honest half of asking someone to spend minutes. */
const spell = (seconds: number) =>
  seconds >= 90 ? `~${Math.round(seconds / 60)} min` : `~${Math.max(1, Math.round(seconds))}s`

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
  onRunSummary?: (s: { passed: number; failed: number; total: number; mode: RunMode }) => void
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
  // Deleted rows (owner 2026-09-16). One set covers both sources: a generated
  // case belongs to the parent, so it can only be hidden here — and Regenerate
  // remounts this component, which is the right moment for the suite to come
  // back whole.
  const [removed, setRemoved] = React.useState<Set<string>>(new Set())
  // Generated (contextual) cases lead; the starter suite + authored follow.
  const cases = React.useMemo(
    () => [...extra.map((e) => e.case), ...authored].filter((c) => !removed.has(c.id)),
    [extra, authored, removed],
  )
  const setCases = (fn: (prev: EvalCase[]) => EvalCase[]) => setAuthored(fn)
  // Deleting a scenario can throw away authored work, so it undoes — the same
  // bargain every other destructive switch in the builder makes.
  const removeCase = (c: EvalCase) => {
    setRemoved((prev) => new Set([...prev, c.id]))
    toast(`"${c.name}" deleted`, {
      action: {
        label: "Undo",
        onClick: () =>
          setRemoved((prev) => {
            const next = new Set(prev)
            next.delete(c.id)
            return next
          }),
      },
    })
  }
  const [addOpen, setAddOpen] = React.useState(false)
  const [running, setRunning] = React.useState<{ case: EvalCase; mode: RunMode } | null>(null)
  const [openResult, setOpenResult] = React.useState<EvalCaseResult | null>(null)
  // "Run all" runs the SUITE (round-6: opening one case's sheet read as the
  // other two vanishing) — brief running state, then a summary line.
  const [runningAll, setRunningAll] = React.useState<RunMode | false>(false)
  // What mode each case last ran in — the seed results carry their own, and a
  // run in this session overrides it. A result never displays a mode it did
  // not run in.
  const [ranMode, setRanMode] = React.useState<Map<string, RunMode>>(new Map())
  // Design set 22–23 Jul (AgentBuilder/DEFAULT): sample scenarios ship
  // UN-RUN — status "–" until the user runs them. No fake failures on first
  // paint (2026-07-24 P0). Verdicts exist only for cases the user ran.
  const [ranIds, setRanIds] = React.useState<Set<string>>(new Set())
  /** What a result row is allowed to claim: the mode this session ran it in,
   *  else the mode the seed result carries, else text. */
  const modeFor = (c: EvalCase, res: EvalCaseResult): RunMode =>
    !canRunWithAudio(c) ? "text" : ranMode.get(c.id) ?? res.mode ?? "text"

  const resultFor = (id: string) =>
    ranIds.has(id)
      ? extra.find((e) => e.case.id === id)?.result ?? run.results.find((r) => r.caseId === id)
      : undefined
  const allResults = [...extra.map((e) => e.result), ...run.results]
  const ranResults = allResults.filter((r) => ranIds.has(r.caseId))
  const stats = { passed: ranResults.filter((r) => r.verdict === "pass").length, total: ranResults.length }
  const textRun = runEstimate(cases, "text")
  const audioRun = runEstimate(cases, "audio")
  const decisionCount = cases.filter((c) => caseType(c) === "decision").length

  // 2026-07-21 (owner): the Test section IS this feature — test scenarios from
  // the cn2meet roadmap (F-Eval), no longer future-scope-gated and no longer a
  // sidecar under a "start test call" button. The hosting SectionRow carries
  // the title + description, so the header here is just the actions.

  // A run has a MODE, and the mode is chosen at the moment of spending, not
  // stored as a setting (research 2026-09-16: Vapi and LiveKit both put it on
  // the run). An audio run skips decision checks, which have no audio to run.
  const runAll = (mode: RunMode) => {
    track(Events.suite_run_all, {})
    setRunningAll(mode)
    window.setTimeout(() => {
      setRunningAll(false)
      const eligible = mode === "audio" ? cases.filter(canRunWithAudio) : cases
      const results = allResults.filter((r) => eligible.some((c) => c.id === r.caseId))
      // MERGE, never replace: an audio run skips the decision checks, and a
      // skipped check must not lose the result it already has.
      setRanIds((prev) => new Set([...prev, ...results.map((r) => r.caseId)]))
      setRanMode((m) => {
        const next = new Map(m)
        results.forEach((r) => next.set(r.caseId, mode))
        return next
      })
      const passed = results.filter((r) => r.verdict === "pass").length
      onRunSummary?.({ passed, failed: results.length - passed, total: results.length, mode })
      const skipped = mode === "audio" ? cases.length - eligible.length : 0
      toast(`${results.length} test${results.length === 1 ? "" : "s"} ran with ${modeLabel(mode)}`, {
        description: [
          `${passed} passed · ${results.length - passed} failed.`,
          skipped > 0 && `${skipped} decision check${skipped === 1 ? "" : "s"} skipped: they have no audio to run.`,
          "Open a row for the transcript.",
        ].filter(Boolean).join(" "),
      })
    }, mode === "audio" ? 2000 : 1200)
  }
  // A single-row run reveals THAT case's verdict when its sheet closes.
  const runOne = (c: EvalCase, mode: RunMode = "text") => {
    setRunning({ case: c, mode })
    setRanIds((s) => new Set([...s, c.id]))
    setRanMode((m) => new Map(m).set(c.id, mode))
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Failing ↔ Deploy relationship, nested behind a dotted hint (owner
            2026-07-21: reduce upfront text). Figma copy: a question link. */}
        <InfoHint label={variant === "section" ? "Do failing scenarios block deploy?" : "How scoring works?"}>
          A judge model scores each run: {"{verdict, score, reason}"} per assertion. A failure
          caused by a real config gap names the setting to fix. Failing scenarios never block deploy.
        </InfoHint>
        <div className="flex items-center gap-2">
          {leadingActions}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!!runningAll || textRun.count === 0}
            onClick={() => runAll("text")}
          >
            <Play className="h-3.5 w-3.5" aria-hidden />{" "}
            {runningAll === "text" ? "Running…" : `Run all as text · ${spell(textRun.seconds)}`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={!!runningAll || audioRun.count === 0}
            onClick={() => runAll("audio")}
          >
            <AudioLines className="h-3.5 w-3.5" aria-hidden />{" "}
            {runningAll === "audio"
              ? "Calling…"
              : `Run with audio · ${spell(audioRun.seconds)} · ~$${audioRun.cost.toFixed(2)}`}
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add case
          </Button>
        </div>
      </div>
      {/* Two currencies, said once. A text run costs nothing and proves the
          words; an audio run spends real agent minutes and proves the call. */}
      <p className="text-xs text-muted-foreground">
        Text runs are free. An audio run places {audioRun.count === 1 ? "a simulated call" : `${audioRun.count} simulated calls`} through
        the real speech pipeline and bills agent minutes at ${AGORA_RATE_PER_MIN.toFixed(2)}/min.
        {decisionCount > 0 && ` ${decisionCount} decision check${decisionCount === 1 ? "" : "s"} stay${decisionCount === 1 ? "s" : ""} text either way.`}
      </p>
      {headerNote ? <div className="text-xs text-muted-foreground">{headerNote}</div> : null}

      {/* Suite TABLE (Figma 2861-52041): rail = Test Name · Status · run;
          section adds Description + the mono "02/03 PASSING · 01 FAILED" bar. */}
      <div className="@container overflow-hidden rounded-lg border border-border">
        {/* Section variant only (Figma 2867-110660) — the rail table has no
            bar: the badges + the results footer already carry run state, and a
            prose bar above a narrow table breaks the F-pattern scan
            (owner 2026-08-10: no added text). */}
        {variant === "section" && stats.total > 0 && (
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2 font-mono text-xs uppercase tracking-wider">
            <span>{pad2(stats.passed)}/{pad2(cases.length)} passing</span>
            {stats.total - stats.passed > 0 && (
              <span className="text-destructive">{pad2(stats.total - stats.passed)} failed</span>
            )}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test Name</TableHead>
              {variant === "section" && <TableHead>Type</TableHead>}
              {/* First to go when the rail squeezes the column: the sentence is
                  nice, the type and the verdict are load-bearing. */}
              {variant === "section" && <TableHead className="hidden @2xl:table-cell">Description</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cases.length === 0 && (
              <TableRow>
                <TableCell colSpan={variant === "section" ? 4 : 3} className="py-6 text-center text-xs text-muted-foreground">
                  No scenarios left. Add a case, or generate a set from your agent&apos;s context.
                </TableCell>
              </TableRow>
            )}
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
                    {/* The rail has no room for a column, and the type is not
                        optional information — it decides what a pass means. */}
                    {variant === "rail" && (
                      <span className="block text-xs font-normal text-muted-foreground">
                        {TYPE_META[caseType(c)].label}
                      </span>
                    )}
                  </TableCell>
                  {variant === "section" && (
                    <TableCell className="text-muted-foreground">{TYPE_META[caseType(c)].label}</TableCell>
                  )}
                  {variant === "section" && (
                    <TableCell className="hidden max-w-[260px] truncate text-muted-foreground @2xl:table-cell">
                      {caseType(c) === "decision"
                        ? `After: ${c.history?.[0]?.text ?? "the caller's opening line"}`
                        : `Caller wants to ${c.persona.goal || ", "}`}
                    </TableCell>
                  )}
                  <TableCell>
                    {res ? (
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={res.verdict === "pass" ? "secondary" : "destructive"}
                          className={cn("gap-1 text-xs", res.verdict === "pass" && "bg-success/15 text-success")}
                        >
                          {res.verdict === "pass" ? "Pass" : "Fail"}
                        </Badge>
                        {/* A text pass is not evidence the call sounds right.
                            The row says which one it is, every time. */}
                        <span className="font-mono text-xs tabular-nums text-muted-foreground">
                          {modeFor(c, res)}
                          {modeFor(c, res) === "audio" && res.seconds ? ` ${Math.floor(res.seconds / 60)}:${String(res.seconds % 60).padStart(2, "0")}` : ""}
                        </span>
                      </span>
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
                      aria-label={`Run ${c.name} as text`}
                      onClick={() => runOne(c, "text")}
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    {/* A decision check is text by definition, so it is never
                        offered an audio run it could not honour. */}
                    {canRunWithAudio(c) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        aria-label={`Run ${c.name} with audio, about 74 seconds of agent time`}
                        onClick={() => runOne(c, "audio")}
                      >
                        <AudioLines className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground"
                      aria-label={`Delete ${c.name}`}
                      onClick={() => removeCase(c)}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden />
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
      <RunSheet
        caseItem={running?.case ?? null}
        mode={running?.mode ?? "text"}
        onOpenChange={(o) => !o && setRunning(null)}
        result={running ? resultFor(running.case.id) : undefined}
      />
      <ResultSheet result={openResult} caseItem={openResult ? cases.find((c) => c.id === openResult.caseId) : undefined} onOpenChange={(o) => !o && setOpenResult(null)} />
    </section>
  )
}

const pad2 = (n: number) => String(n).padStart(2, "0")


// ─── Run: simulated caller, live transcript, verdict ──────────────────────────

function RunSheet({
  caseItem,
  result,
  mode,
  onOpenChange,
}: {
  caseItem: EvalCase | null
  result?: EvalCaseResult
  /** Which machine is running. Decides what the sheet may claim was proved. */
  mode: RunMode
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
          <SheetDescription>
            {caseItem && caseType(caseItem) === "decision"
              ? "Judging the next reply only. No audio."
              : mode === "audio"
                ? `Caller: ${caseItem?.persona.identity} · through the real speech pipeline`
                : `Caller: ${caseItem?.persona.identity} · text only, no audio`}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <SimulatedBanner />
          {mode === "text" && (
            <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              A text run proves the words, not the call. Speech recognition, the voice and
              turn-taking are not exercised — run it with audio for those.
            </p>
          )}
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
  const [picked, setPicked] = React.useState<EvalCaseType>("conversation")
  const [persona, setPersona] = React.useState({ identity: "", goal: "", personality: "" })
  const [said, setSaid] = React.useState("")
  const [tools, setTools] = React.useState<ToolMocking>("mock-all")
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
      setSaid("")
      setTools("mock-all")
    }
  }, [open, prefill])

  // A real call is always a conversation — it already happened out loud, so
  // the choice is derived rather than pushed into state behind the user.
  const type: EvalCaseType = prefill ? "conversation" : picked

  const canSave = Boolean(
    name.trim() && assertion.trim() && (type === "decision" ? said.trim() : persona.goal.trim()),
  )

  function save() {
    track(prefill ? Events.save_call_as_test : Events.test_authored, {})
    onSave?.({
      id: `ec_${Date.now().toString(36)}`,
      name: name.trim(),
      type,
      persona: type === "decision" ? { identity: "", goal: "", personality: "" } : { ...persona },
      ...(type === "decision" ? { history: [{ role: "caller" as const, text: said.trim() }] } : {}),
      tools,
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
              ? "We kept the caller and transcript. Just say what should always be true."
              : "Cast a caller, then say what must always be true."}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-6">
          {/* The type is the first question because it changes everything
              under it — and because it is the seam engineering builds on. */}
          {!prefill && (
            <div className="space-y-2">
              <Label>What are you checking?</Label>
              <ToggleGroup
                type="single"
                value={type}
                onValueChange={(v) => v && setPicked(v as EvalCaseType)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {(["decision", "conversation"] as EvalCaseType[]).map((t) => (
                  <ToggleGroupItem key={t} value={t} className="flex-1 text-xs">
                    {TYPE_META[t].question}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <p className="text-xs text-muted-foreground">{TYPE_META[type].blurb}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tc-name">Case name</Label>
            <Input id="tc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === "decision" ? "e.g. Refuses to promise a refund" : "e.g. Books a demo"} />
          </div>

          {type === "decision" && (
            <div className="space-y-1.5">
              <Label htmlFor="tc-said">What the caller just said</Label>
              <Textarea
                id="tc-said"
                value={said}
                onChange={(e) => setSaid(e.target.value)}
                placeholder="This is the third time I've called. I want my money back today."
                className="min-h-[72px] text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Everything up to here is taken as given. Only the agent&apos;s next reply is judged.
              </p>
            </div>
          )}

          <div className={cn("space-y-2 rounded-lg border border-border p-3", type === "decision" && "hidden")}>
            <p className="text-xs font-medium">The caller</p>
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

          {/* Rainy 4. Every serious competitor states this and we did not. */}
          <div className="space-y-2">
            <Label>Tools</Label>
            <ToggleGroup
              type="single"
              value={tools}
              onValueChange={(v) => v && setTools(v as ToolMocking)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <ToggleGroupItem value="mock-all" className="flex-1 text-xs">Mock every tool</ToggleGroupItem>
              <ToggleGroupItem value="call-real" className="flex-1 text-xs">Call the real ones</ToggleGroupItem>
            </ToggleGroup>
            <p className={cn("flex items-start gap-1.5 text-xs", tools === "mock-all" ? "text-muted-foreground" : "text-warning")}>
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {tools === "mock-all"
                ? "The agent gets a made-up answer from each tool. Nothing reaches your systems."
                : "This test will book, charge and write for real, every time it runs."}
            </p>
          </div>

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
