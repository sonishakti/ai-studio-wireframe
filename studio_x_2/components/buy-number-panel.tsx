"use client"

import * as React from "react"
import { AlertTriangle, CheckCircle2, Loader2, PhoneCall, Radio, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { track, Events } from "@/lib/analytics"
import { StateBanner } from "@/components/usage-spend-card"
import { FactLog, pushLine, type LogLine } from "@/components/fact-log"
import { NumberPickRow, CAPABILITY_LABEL } from "@/components/number-pick-row"
import {
  searchNumbers, addSessionNumber, markTurnedUp, readSessionNumbers,
  type CatalogNumber, type NumberType,
} from "@/lib/number-store"

/**
 * BuyNumberPanel — the "Get a number" branch of AddPhoneNumberSheet
 * (16 · phone number purchase, 2026-09-17). Sibling of SipQuickConnect, which
 * is the other branch of this same sheet: same two props, same fact log, same
 * ending. A file rather than an inline branch for the reason the sibling is
 * one — the sheet already holds a toggle and two branches.
 *
 * Four stages: search · results · turning up · verify. There is no checkout
 * stage and no amount anywhere on screen, because Agora documents no telephony
 * charge: an exact amount needs a rate, and the rate is an open question. The
 * commit button carries the house "Requires Engine" caption where the figure
 * would be.
 *
 * The honesty contract it inherits from its sibling:
 *  • the wait between "it is mine" and "it works" is a timestamped fact log,
 *    never a bare spinner, and it names no duration
 *  • the flow ENDS on a call the user places that rings and connects, never an
 *    "acquired" checkmark (provisioning success ≠ call success)
 *  • the number joins the session ledger the moment it is acquired, so closing
 *    the sheet mid-wait does not lose it, and the inventory row carries the
 *    same state this panel is showing
 * Mock only: timers stand in for the real reserve → route → turn up.
 */

type Stage = "search" | "results" | "turning-up" | "verify" | "done"

export function BuyNumberPanel({
  onConnected,
  onFallback,
}: {
  /** Number acquired, turned up and verified by a real call → hand it back to
   *  the sheet (the sibling's prop, same name and arity). */
  onConnected: (e164: string) => void
  /** Escape to a number the user already owns (R8 — always reachable). */
  onFallback: () => void
}) {
  const [stage, setStage] = React.useState<Stage>("search")
  const [areaCode, setAreaCode] = React.useState("")
  const [type, setType] = React.useState<NumberType>("local")
  const [rows, setRows] = React.useState<CatalogNumber[]>([])
  const [pickedIdx, setPickedIdx] = React.useState<number | null>(null)
  /** The one thing the search could not give the user, in their words. */
  const [notice, setNotice] = React.useState<string | null>(null)
  const [acquired, setAcquired] = React.useState<{ id: string; e164: string } | null>(null)
  const [log, setLog] = React.useState<LogLine[]>([])
  const [callState, setCallState] = React.useState<"idle" | "ringing" | "connected">("idle")
  const [callSec, setCallSec] = React.useState(0)
  const timers = React.useRef<number[]>([])
  const clock = React.useRef<number | null>(null)
  const searchedAt = React.useRef<number | null>(null)

  React.useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    if (clock.current) clearInterval(clock.current)
  }, [])

  function runSearch() {
    const term = areaCode.trim()
    const result = searchNumbers(term, type)
    searchedAt.current = Date.now()
    setPickedIdx(null)
    if (!result.ok) {
      // A blank area code matches every row, so this line always names the one
      // the user typed.
      setRows([])
      setNotice(`No numbers free in ${term} right now. Try another area code.`)
      track(Events.number_purchase_blocked, { step: "search", code: "no_results", recoverable: true })
      return
    }
    setNotice(null)
    setRows(result.rows)
    setStage("results")
  }

  function commit() {
    if (pickedIdx == null) return
    const n = rows[pickedIdx]
    if (!n) return

    // Someone else took it between the search and the commit: drop the row,
    // stay on the results, say so.
    if (n.taken) {
      track(Events.number_purchase_blocked, { step: "provisioning", code: "number_taken", recoverable: true })
      setRows((r) => r.filter((x) => x.e164 !== n.e164))
      setPickedIdx(null)
      setNotice("That number was taken a moment ago. Pick another.")
      return
    }

    const isFirst = readSessionNumbers().length === 0
    const row = addSessionNumber({ e164: n.e164, label: n.city, capability: n.capability })
    track(Events.number_purchase_completed, {
      country: "US",
      number_type: n.type === "toll-free" ? "toll_free" : "local",
      area_code: n.areaCode,
      search_to_commit_ms: searchedAt.current ? Date.now() - searchedAt.current : 0,
      result_rank: pickedIdx + 1,
      is_first_number: isFirst,
    })

    setAcquired({ id: row.id, e164: row.number })
    setNotice(null)
    setStage("turning-up")
    setLog((l) => pushLine(l, "Number reserved"))
    timers.current.push(window.setTimeout(() => {
      setLog((l) => pushLine(l, "Routing configured"))
    }, 1000))
    timers.current.push(window.setTimeout(() => {
      setLog((l) => pushLine(l, "Line turned up"))
      markTurnedUp(row.id)
      setStage("verify")
    }, 1900))
  }

  function decline(step: "search" | "results") {
    track(Events.number_purchase_declined, { step })
    onFallback()
  }

  function placeTestCall() {
    setCallState("ringing")
    track(Events.test_call_placed, {})
    setCallSec(0)
    clock.current = window.setInterval(() => setCallSec((s) => s + 1), 1000)
    timers.current.push(window.setTimeout(() => {
      if (clock.current) clearInterval(clock.current)
      setCallState("connected")
      track(Events.test_call_connected, {})
      setLog((l) => pushLine(l, "Test call answered · two-way audio confirmed"))
      setStage("done")
    }, 2600))
  }

  // ── Stage 1: one field, one toggle ──────────────────────────────────────
  if (stage === "search") {
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="buy-area-code" className="text-xs text-muted-foreground">Area code</Label>
          <Input
            id="buy-area-code"
            inputMode="numeric"
            className="font-mono text-sm"
            placeholder="415"
            value={areaCode}
            onChange={(e) => setAreaCode(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Leave it blank to see numbers from anywhere in the US.</p>
        </div>

        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(v) => { if (v) setType(v as NumberType) }}
          variant="outline"
          size="sm"
          className="w-full"
          aria-label="Number type"
        >
          <ToggleGroupItem value="local" className="flex-1 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
            Local
          </ToggleGroupItem>
          <ToggleGroupItem value="toll-free" className="flex-1 text-xs data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
            Toll-free
          </ToggleGroupItem>
        </ToggleGroup>

        <NoticeLine text={notice} />

        <Button className="w-full gap-1.5" onClick={runSearch}>
          <Search className="h-4 w-4" /> Search numbers
        </Button>

        <p className="text-xs text-muted-foreground">
          Outside the US,{" "}
          <button
            type="button"
            onClick={() => decline("search")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            connect a number you own
          </button>.
        </p>
      </div>
    )
  }

  // ── Stage 2: the result list, and one commit that carries no amount ─────
  if (stage === "results") {
    return (
      <div className="space-y-4">
        {rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Pick a number to route</p>
            {rows.map((n, i) => (
              <NumberPickRow
                key={n.e164}
                e164={n.e164}
                meta={`${n.city} · ${CAPABILITY_LABEL[n.capability]}`}
                capability={n.capability}
                selected={pickedIdx === i}
                onSelect={() => { setPickedIdx(i); setNotice(null) }}
              />
            ))}
          </div>
        )}

        <NoticeLine text={notice} />

        <div className="space-y-1.5">
          <Button className="w-full" onClick={commit} disabled={pickedIdx == null}>
            Get this number
          </Button>
          <p className="text-xs text-muted-foreground">Requires Engine · number catalog and pricing</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => { setStage("search"); setPickedIdx(null); setNotice(null) }}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Try another area code
          </button>
          <button
            type="button"
            onClick={() => decline("results")}
            className="underline underline-offset-2 hover:text-foreground"
          >
            Connect a number you own instead
          </button>
        </div>
      </div>
    )
  }

  // ── Stages 3–5: the wait, then the call that proves it ──────────────────
  return (
    <div className="space-y-4">
      {stage === "turning-up" && acquired && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-balance">Turning up {acquired.e164}</p>
          <p className="text-xs text-muted-foreground">Calls do not connect until this finishes.</p>
        </div>
      )}

      <FactLog lines={log} working={stage === "turning-up"} />

      {(stage === "verify" || stage === "done") && (
        <StateBanner
          tone={callState === "connected" ? "success" : "primary"}
          icon={callState === "connected" ? CheckCircle2 : Radio}
        >
          {callState === "connected" ? (
            <p className="text-sm font-medium text-balance">
              Verified with a real call · {acquired?.e164} is live.
            </p>
          ) : (
            <>
              <p className="text-sm font-medium text-balance">The line is up. Now prove it connects.</p>
              <p className="text-xs text-muted-foreground">
                Configuration success isn&apos;t call success. Place a real test call before you rely on it.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Button size="sm" className="gap-1.5" onClick={placeTestCall} disabled={callState === "ringing"}>
                  {callState === "ringing"
                    ? <><Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" /> Ringing… {callSec}s</>
                    : <><PhoneCall className="h-3.5 w-3.5" /> Place test call</>}
                </Button>
              </div>
            </>
          )}
        </StateBanner>
      )}

      {stage === "done" && (
        <Button className="w-full" onClick={() => { if (acquired) onConnected(acquired.e164) }}>
          Route this number
        </Button>
      )}
    </div>
  )
}

/** The one thing the search could not do, said once, where it happened. */
function NoticeLine({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <p className="flex items-start gap-2 text-xs text-warning">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span className="min-w-0 flex-1">{text}</span>
    </p>
  )
}
