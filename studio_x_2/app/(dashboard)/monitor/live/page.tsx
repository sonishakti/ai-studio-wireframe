"use client"

import * as React from "react"
import Link from "next/link"
import { Pause, Play, PhoneIncoming, PhoneOutgoing, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { MonitorNav } from "@/components/monitor-nav"
import { LiveCallDrawer, StateBadge } from "@/components/live-call-drawer"
import { AddLinesSheet } from "@/components/concurrency-card"
import { Button } from "@/components/ui/button"
import { CONCURRENCY, concurrencyStats } from "@/lib/campaign-data"
import { liveCalls, mmss, queuedCallers, riskLine, verb, type LiveCall, type VerbId } from "@/lib/live-calls"

/**
 * Live calls (design 12).
 *
 * Retell's version of this page is a table of everything in progress with an
 * empty state that reads "No Ongoing Calls". That is the right shape and it
 * answers the wrong question: with forty calls up, a table sorted by start
 * time tells an operator nothing about WHICH one to open. So the calls that
 * have gone wrong sort to the top and say why, in the caller's words.
 *
 * The clock is the other borrowed idea. LiveKit's sessions list carries an
 * explicit "Auto-refresh off" toggle, which is the only honest way to show
 * data that is always a few seconds behind: name the lag and let it be paused
 * while someone reads a row.
 */
export default function LiveCallsPage() {
  const [calls, setCalls] = React.useState<LiveCall[]>(() => liveCalls())
  const [live, setLive] = React.useState(true)
  const [age, setAge] = React.useState(0)
  const [openId, setOpenId] = React.useState<string | null>(null)
  const [linesOpen, setLinesOpen] = React.useState(false)
  const [purchased, setPurchased] = React.useState(0)

  // One second of wall clock per second of call, and an age counter that keeps
  // the page honest about how stale it is. Paused means paused: the rows stop
  // moving so a row can be read without it sliding away.
  React.useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => {
      setCalls((cs) => cs.map((c) => ({ ...c, elapsed: c.elapsed + 1 })))
      setAge(0)
    }, 1000)
    return () => window.clearInterval(t)
  }, [live])

  React.useEffect(() => {
    if (live) return
    const t = window.setInterval(() => setAge((a) => a + 1), 1000)
    return () => window.clearInterval(t)
  }, [live])

  const stats = concurrencyStats({ ...CONCURRENCY, purchased: CONCURRENCY.purchased + purchased })
  const queued = queuedCallers(calls.length, stats.totalLines)

  // Issues first. Within each group, the longest-running call is the one most
  // likely to need someone.
  const ordered = React.useMemo(
    () => [...calls].sort((a, b) => Number(!!b.risk) - Number(!!a.risk) || b.elapsed - a.elapsed),
    [calls],
  )
  const open = calls.find((c) => c.id === openId) ?? null
  const needing = calls.filter((c) => c.risk).length

  const act = (id: VerbId, text?: string) => {
    if (!open) return
    if (id === "takeover") {
      // Barge-in is the whole point: the agent goes quiet on the same tick,
      // not when its sentence finishes.
      setCalls((cs) => cs.map((c) => (c.id === open.id ? { ...c, operatorJoined: true, state: "on hold" } : c)))
      toast("The agent is muted. You are on the line.")
      return
    }
    if (id === "end") {
      setCalls((cs) => cs.filter((c) => c.id !== open.id))
      setOpenId(null)
      toast("Call ended.")
      return
    }
    if (id === "say" && text) {
      setCalls((cs) => cs.map((c) => (
        c.id === open.id ? { ...c, turns: [...c.turns, { role: "agent" as const, at: c.elapsed, text }] } : c
      )))
      toast("The agent will say that at the next gap.")
      return
    }
    toast(verb(id).help)
  }

  return (
    <div className="flex flex-1 flex-col">
      <MonitorNav subtitle="What is happening right now, and what you can do about it." />

      <div className="space-y-4 p-6">
        {/* The header answers three things at a glance: how many are up, how
            close to the wall we are, and how old this picture is. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <p className="text-sm">
              <span className="text-2xl font-semibold tabular-nums">{calls.length}</span>{" "}
              <span className="text-muted-foreground">live now</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.totalLines - calls.length > 0
                ? `${stats.totalLines - calls.length} of ${stats.totalLines} lines free`
                : `All ${stats.totalLines} lines busy`}
            </p>
            {needing > 0 && (
              <p className="flex items-center gap-1.5 text-sm text-warning">
                <ShieldAlert className="size-4" aria-hidden />
                {needing} need{needing === 1 ? "s" : ""} a look
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {live ? "Updating every second" : `Paused ${age}s ago`}
            </p>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setLive((l) => !l); setAge(0) }}>
              {live ? <><Pause className="size-3.5" aria-hidden /> Pause</> : <><Play className="size-3.5" aria-hidden /> Resume</>}
            </Button>
          </div>
        </div>

        {queued > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2.5">
            <p className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{queued} caller{queued === 1 ? " is" : "s are"} holding for a line.</span>{" "}
              <span className="text-muted-foreground">Nothing is dropped, and they are waiting.</span>
            </p>
            <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => setLinesOpen(true)}>
              Add lines
            </Button>
          </div>
        )}

        {ordered.length === 0 ? (
          // Nothing live is a normal state, not a failure, so the page says
          // what it is waiting for rather than apologising.
          <div className="rounded-lg border border-dashed border-stroke px-6 py-10 text-center">
            <p className="text-sm font-medium">No calls in progress</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Calls appear here the moment someone dials a live number or a batch run starts dialling.
            </p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/calls">See finished calls</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr className="text-left">
                  <th scope="col" className="px-3 py-2 font-medium">Caller</th>
                  <th scope="col" className="px-3 py-2 font-medium">Agent</th>
                  <th scope="col" className="px-3 py-2 font-medium">Doing</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Length</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((c) => {
                  const why = riskLine(c)
                  const Dir = c.direction === "inbound" ? PhoneIncoming : PhoneOutgoing
                  return (
                    <tr
                      key={c.id}
                      className={cn(
                        "border-b border-border last:border-0",
                        c.risk ? "bg-warning/[0.04]" : "hover:bg-accent/30",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <Dir className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="font-mono text-xs">{c.direction === "inbound" ? c.from : c.to}</span>
                        </span>
                        {/* The reason lives on the row, not behind a tooltip:
                            an operator scanning forty rows never hovers. */}
                        {why && <span className="mt-0.5 block text-xs text-warning">{why}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.agentName}</td>
                      <td className="px-3 py-2.5"><StateBadge call={c} /></td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">{mmss(c.elapsed)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setOpenId(c.id)}>
                          Open
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <LiveCallDrawer
        call={open}
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        onAct={act}
      />

      <AddLinesSheet
        open={linesOpen}
        onOpenChange={setLinesOpen}
        purchased={CONCURRENCY.purchased + purchased}
        queued={queued}
        totalLines={stats.totalLines}
        capHeadroomUsd={null}
        onCommit={(qty) => { setPurchased((p) => Math.max(0, p + qty)); setLinesOpen(false) }}
      />
    </div>
  )
}
