"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AddLinesSheet } from "@/components/concurrency-card"
import { CONCURRENCY, concurrencyStats } from "@/lib/campaign-data"
import { useFutureScope } from "@/lib/future-scope"
import { type StepProps } from "@/components/wizard/types"

/**
 * Call settings — the third OPTIONAL section (owner 2026-07-13: "four steps and
 * then three in advanced"). Holds the batch-call tuning that used to crowd the
 * channel step: call window · max concurrent · retries (+ the at-the-wall
 * capacity note). Values still live on draft.config.outbound, so the deploy
 * pre-flight manifest and rail recap read them unchanged.
 */
export function CallSettings({ draft, update }: StepProps) {
  if (draft.type !== "outbound") {
    // Explorable, not hidden (builder philosophy): say who this is for
    // instead of vanishing the row for non-batch agents.
    return (
      <p className="text-sm text-muted-foreground">
        These settings apply to Batch calls. Pick <span className="font-medium text-foreground">Batch calls</span> above
        to schedule the window, concurrency, and retries.
      </p>
    )
  }
  return (
    <div className="max-w-3xl space-y-4">
      <OutboundSettings draft={draft} update={update} />
      <OutboundCapacityNote draft={draft} />
    </div>
  )
}

// Batch settings — stored on the DRAFT (not section-local state) so they
// survive close/reopen and appear in the rail recap, the deploy review, and
// the config JSON (heuristic-eval finding #7).
function OutboundSettings({ draft, update }: StepProps) {
  const out = draft.config.outbound
  const patch = (p: Partial<NonNullable<typeof out>>) =>
    update({ config: { ...draft.config, outbound: { ...out, ...p } } })
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Call window</Label>
        <Select
          value={out?.callWindow ?? "business"}
          onValueChange={(v) => patch({ callWindow: v as "business" | "extended" | "anytime" })}
        >
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {/* Whose 9–5 matters on a call campaign — say it (user-test S3). */}
            <SelectItem value="business">Business hours (9–5, contact&apos;s local time)</SelectItem>
            <SelectItem value="extended">Extended (8–8, contact&apos;s local time)</SelectItem>
            <SelectItem value="anytime">Anytime</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Max concurrent</Label>
        <Select
          value={String(out?.maxConcurrent ?? 10)}
          onValueChange={(v) => patch({ maxConcurrent: Number(v) })}
        >
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["5", "10", "25", "50"].map((c) => <SelectItem key={c} value={c}>{c} calls</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Retry unanswered</Label>
        <Select
          value={String(out?.retries ?? 1)}
          onValueChange={(v) => patch({ retries: Number(v) })}
        >
          <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Don&apos;t retry</SelectItem>
            <SelectItem value="1">Once</SelectItem>
            <SelectItem value="2">Twice</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/** At-the-wall purchase moment (A6, graft from the judge round's variant C):
 *  picking a max-concurrent above the project's line capacity is where the
 *  limit is FELT — so the unlock lives here, inline, not on a billing page
 *  the operator would have to go find. One component owns ALL capacity
 *  communication for batch calls (a split select-suffix + note drifted). */
function OutboundCapacityNote({ draft }: { draft: StepProps["draft"] }) {
  const [purchasedBoost, setPurchasedBoost] = React.useState(0)
  const [linesOpen, setLinesOpen] = React.useState(false)
  const [future] = useFutureScope()
  const stats = concurrencyStats({ ...CONCURRENCY, purchased: CONCURRENCY.purchased + purchasedBoost })
  const chosen = draft.config.outbound?.maxConcurrent ?? 10
  const overBy = Math.max(0, chosen - stats.totalLines)

  // A6 (self-serve concurrency) is future-scope-gated.
  if (!future) return null
  if (overBy === 0 && purchasedBoost === 0) return null

  return (
    <>
      {overBy > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.04] px-3 py-2.5">
          <p className="flex-1 min-w-0 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {chosen} at once is above your {stats.totalLines} concurrent lines.
            </span>{" "}
            Calls beyond {stats.totalLines} queue until a line frees — nothing drops. +{overBy}{" "}
            lines (${overBy * stats.pricePerLineMo}/mo, prorated today) removes the queue.
          </p>
          <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => setLinesOpen(true)}>
            Add lines
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border border-success/40 bg-success/5 px-3 py-2.5">
          <Check className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-muted-foreground">
            {stats.totalLines} concurrent lines — your max of {chosen} runs without queuing.
          </p>
        </div>
      )}
      <AddLinesSheet
        open={linesOpen}
        onOpenChange={setLinesOpen}
        purchased={CONCURRENCY.purchased + purchasedBoost}
        queued={0}
        totalLines={stats.totalLines}
        capHeadroomUsd={null}
        onCommit={(qty) => { setPurchasedBoost((b) => Math.max(0, b + qty)); setLinesOpen(false) }}
      />
    </>
  )
}
