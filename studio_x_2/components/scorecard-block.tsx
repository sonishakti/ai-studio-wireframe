"use client"

import * as React from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { track, Events } from "@/lib/analytics"
import {
  CRITERIA_LIMIT, DEFAULT_SCORECARD, SCORECARD_EVENT, readScorecard, writeScorecard,
  type Scorecard,
} from "@/lib/scorecard"
import { RUN_EVENT, latestRun, readSuiteState, type StoredRun } from "@/lib/eval-runs"
import { EVAL_SUITE, type AssertionKind, type EvalAssertion, type EvalCase } from "@/lib/campaign-data"

/**
 * Scorecard block — the ONE editor for the checks an agent is graded on, and
 * the read-only summary the test surfaces mount beside their runs.
 *
 * 14 · Evals & scorecards (2026-09-17), direction C: the grading sentence used
 * to exist twice, as a switch over a 2000-character textarea in two places with
 * opposite defaults, and nothing read either copy. It is now a list of named
 * criteria, and a criterion is an assertion — the same record a test run is
 * graded on. The rows and the sheet copy the data-point grammar in
 * `components/wizard/step-analysis.tsx`, because the two lists live in one fold
 * and must read as one object. The summary lives HERE rather than in the test
 * surfaces, so the editor and the summary read one store and cannot disagree.
 *
 * There is no transcription gate on this block: criteria grade every test run,
 * and a test run needs no stored call transcript. What DOES need one is grading
 * a finished call, and the caption under the rows says so.
 */

const pad2 = (n: number) => String(n).padStart(2, "0")

/** Row-badge vocabulary — mirrors KIND_META in `components/eval-tests.tsx`, so
 *  a criterion and the assertion it grades are labelled the same word. */
const KIND_BADGE: Record<AssertionKind, string> = {
  rubric: "Rubric", "tool-call": "Tool call", "data-point": "Data point", exact: "Exact",
}

/** The three kinds the case author already offers. */
const KINDS: AssertionKind[] = ["rubric", "tool-call", "data-point"]

/** The scorecard for this agent, re-read whenever any mounted surface writes
 *  one (the editor in the builder and the summary in Test are on screen at the
 *  same time). Seeded on the first render so the server and the client agree. */
function useScorecard(agentId: string): [Scorecard, (next: Scorecard) => void] {
  const [sc, setSc] = React.useState<Scorecard>(() => ({
    ...DEFAULT_SCORECARD,
    agentId,
    criteria: DEFAULT_SCORECARD.criteria.map((c) => ({ ...c })),
  }))

  React.useEffect(() => {
    setSc(readScorecard(agentId))
    const onChanged = (e: Event) => {
      if ((e as CustomEvent<{ agentId: string }>).detail?.agentId === agentId) {
        setSc(readScorecard(agentId))
      }
    }
    window.addEventListener(SCORECARD_EVENT, onChanged)
    return () => window.removeEventListener(SCORECARD_EVENT, onChanged)
  }, [agentId])

  const commit = React.useCallback((next: Scorecard) => {
    writeScorecard(next)
    setSc(readScorecard(next.agentId))
  }, [])

  return [sc, commit]
}

export function ScorecardBlock({ agentId, transcribe }: { agentId: string; transcribe: boolean }) {
  const [sc, commit] = useScorecard(agentId)
  // null = closed; "new" = add; an assertion = edit that one.
  const [editing, setEditing] = React.useState<EvalAssertion | "new" | null>(null)
  const criteria = sc.criteria
  const atLimit = criteria.length >= CRITERIA_LIMIT

  const upsert = (a: EvalAssertion) => {
    const exists = criteria.some((c) => c.id === a.id)
    commit({ ...sc, criteria: exists ? criteria.map((c) => (c.id === a.id ? a : c)) : [...criteria, a] })
    if (!exists) track(Events.criterion_authored, { agent_id: agentId, criteria_count: criteria.length + 1 })
    setEditing(null)
  }
  const remove = (id: string) => {
    commit({ ...sc, criteria: criteria.filter((c) => c.id !== id) })
    setEditing(null)
  }

  return (
    <div data-design-focus="scorecard" className="scroll-mt-44 space-y-3 border-b border-border pb-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">Scorecard</p>
          <p className="text-xs text-muted-foreground">The named checks every test run is graded on.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={atLimit}
          onClick={() => setEditing("new")}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden /> Add criterion
        </Button>
      </div>

      {criteria.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          No criteria yet. Add one check to start grading.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-wider text-muted-foreground">
            <span>{sc.name}</span>
            <span>{pad2(criteria.length)}/{CRITERIA_LIMIT}</span>
          </div>
          {criteria.map((c) => {
            const title = c.name?.trim() || c.text
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{title}</span>
                    <Badge variant="secondary" className="shrink-0 font-normal">{KIND_BADGE[c.kind]}</Badge>
                  </p>
                  {c.name?.trim() && <p className="line-clamp-1 text-xs text-muted-foreground">{c.text}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Edit ${title}`} onClick={() => setEditing(c)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Remove ${title}`} onClick={() => remove(c.id)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {atLimit && (
        <p className="text-xs text-muted-foreground">30 criteria is the limit. Remove one to add another.</p>
      )}

      {/* The half this build cannot ship, named where the criteria are written:
          Agora keeps no transcript for a finished call, so nothing grades one
          yet. The test runs below need no stored transcript, which is why the
          rows above stay live either way. */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Grading finished calls needs their stored transcripts · Requires Engine</p>
        {!transcribe && <p>Transcripts are off for this agent, so no call is kept to grade.</p>}
      </div>

      <CriterionSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={upsert}
        onRemove={remove}
      />
    </div>
  )
}

export function CriterionSheet({
  editing,
  onClose,
  onSave,
  onRemove,
}: {
  editing: EvalAssertion | "new" | null
  onClose: () => void
  onSave: (a: EvalAssertion) => void
  onRemove: (id: string) => void
}) {
  const open = editing !== null
  const existing = editing && editing !== "new" ? editing : null
  const [name, setName] = React.useState("")
  const [kind, setKind] = React.useState<AssertionKind>("rubric")
  const [text, setText] = React.useState("")

  // Reset the form each time the sheet target changes.
  React.useEffect(() => {
    setName(existing?.name ?? "")
    setKind(existing?.kind ?? "rubric")
    setText(existing?.text ?? "")
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = name.trim().length > 0 && text.trim().length > 0
  const save = () => {
    onSave({
      id: existing?.id ?? `cr_${Date.now().toString(36)}`,
      kind,
      name: name.trim(),
      text: text.trim(),
      ...(existing?.criterionId ? { criterionId: existing.criterionId } : {}),
    })
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{existing ? "Edit the criterion" : "Add a criterion"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-6">
          <div className="space-y-1.5">
            <Label htmlFor="cr-name">Name</Label>
            <Input id="cr-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Never promises a refund" />
          </div>

          <div className="space-y-2">
            <Label>What should always be true?</Label>
            <ToggleGroup
              type="single"
              value={kind}
              onValueChange={(v) => v && setKind(v as AssertionKind)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {KINDS.map((k) => (
                <ToggleGroupItem key={k} value={k} className="flex-1 text-xs">{KIND_BADGE[k]}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            {kind === "rubric" ? (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="PASS if the agent takes the request and never promises one itself."
                className="min-h-[72px] text-sm"
              />
            ) : (
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={kind === "tool-call" ? "open_ticket" : "email"}
                className="font-mono text-sm"
              />
            )}
            <p className="text-xs text-muted-foreground">
              {kind === "rubric"
                ? "An AI judge scores this in plain language."
                : kind === "tool-call"
                  ? "Passes if the agent calls this tool."
                  : "Passes if this field was captured."}
            </p>
          </div>
        </div>

        <SheetFooter className="px-6">
          {existing && (
            <Button
              variant="ghost"
              className="mr-auto gap-1.5 text-destructive hover:text-destructive"
              onClick={() => onRemove(existing.id)}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> Remove criterion
            </Button>
          )}
          <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
          <Button disabled={!canSave} onClick={save}>{existing ? "Save" : "Add criterion"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── The read-only summary the test surfaces mount ───────────────────────────

/** A criterion the latest run never judged is an absence, not a third verdict
 *  word: the run either graded it or it did not happen. */
type CriterionState = "pass" | "fail" | "not-run"

/** What the latest run said about one criterion. A case is graded under a
 *  criterion when one of its assertions points at it, so the suite is what
 *  joins the two halves — a fail anywhere wins, a pass anywhere counts, and
 *  nothing judged is Not run. */
function stateFor(crit: EvalAssertion, cases: EvalCase[], run: StoredRun | undefined): CriterionState {
  if (!run) return "not-run"
  let judged = false
  for (const c of cases) {
    for (const a of c.assertions ?? []) {
      if (a.criterionId !== crit.id) continue
      const verdict = run.results
        ?.find((r) => r.result?.caseId === c.id)
        ?.result.assertions.find((x) => x.id === a.id)?.verdict
      if (!verdict) continue
      judged = true
      if (verdict === "fail") return "fail"
    }
  }
  return judged ? "pass" : "not-run"
}

export function ScorecardSummary({ agentId }: { agentId: string }) {
  const [sc] = useScorecard(agentId)
  const [run, setRun] = React.useState<StoredRun | undefined>(undefined)
  const [cases, setCases] = React.useState<EvalCase[]>(EVAL_SUITE.cases)

  React.useEffect(() => {
    const reread = () => {
      setRun(latestRun(agentId))
      setCases(readSuiteState(agentId, EVAL_SUITE.cases).cases)
    }
    reread()
    window.addEventListener(RUN_EVENT, reread)
    return () => window.removeEventListener(RUN_EVENT, reread)
  }, [agentId])

  const criteria = sc.criteria

  return (
    <div className="space-y-2">
      {criteria.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          No criteria yet.
        </p>
      ) : (
        criteria.map((c) => {
          const state = stateFor(c, cases, run)
          return (
            <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm">{c.name?.trim() || c.text}</span>
              <Badge
                variant={state === "fail" ? "destructive" : "secondary"}
                className={cn(
                  "shrink-0 text-xs",
                  state === "pass" && "bg-success/15 text-success",
                  state === "not-run" && "text-muted-foreground",
                )}
              >
                {state === "pass" ? "Pass" : state === "fail" ? "Fail" : "Not run"}
              </Badge>
            </div>
          )
        })
      )}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {pad2(criteria.length)}/{CRITERIA_LIMIT}
        </span>
        <button
          type="button"
          className="rounded text-xs text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => window.dispatchEvent(new CustomEvent("sx:focus", { detail: "scorecard" }))}
        >
          Open scorecard
        </button>
      </div>
    </div>
  )
}
