"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, PhoneCall, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StateBanner } from "@/components/usage-spend-card"
import { track, Events } from "@/lib/analytics"

/**
 * TrunkTestCall — the ending both branches of the sheet share, and the same
 * block the number page's Connection row opens.
 *
 * A3's durable rule: provisioning success is not call success. Manual SIP used
 * to reach "Phone number added successfully!" off six filled fields having
 * proved nothing, while the guided branch next door earned the same screen with
 * a real call. One ending, and it is the call.
 *
 * `test_call_placed` and `test_call_connected` are the events, unchanged: the
 * success line already exists and a second name for it would be a third
 * vocabulary for one status.
 *
 * Mock only: a timer stands in for the ring. The outcome is the caller's to
 * decide — nothing here rolls a die — so a trunk the carrier is rejecting today
 * keeps rejecting until something about it changes.
 */
export function TrunkTestCall({
  e164,
  outcome = "connects",
  onConnected,
  onFailed,
}: {
  /** The number the customer dials. Empty until they have typed one. */
  e164: string
  /** What this trunk does when it is called. The number page passes "rejected"
   *  for a trunk that was rejected last time and has not been edited since. */
  outcome?: "connects" | "rejected"
  /** The call got through. The sheet advances on this and nothing else. */
  onConnected?: () => void
  /** It did not. The caller logs its own line; the row here states it and
   *  offers the ladder. */
  onFailed?: () => void
}) {
  const [state, setState] = React.useState<"idle" | "ringing" | "connected" | "failed">("idle")
  const [sec, setSec] = React.useState(0)
  const timer = React.useRef<number | null>(null)
  const clock = React.useRef<number | null>(null)

  React.useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
    if (clock.current) clearInterval(clock.current)
  }, [])

  const place = () => {
    setState("ringing")
    setSec(0)
    track(Events.test_call_placed, {})
    clock.current = window.setInterval(() => setSec((s) => s + 1), 1000)
    timer.current = window.setTimeout(() => {
      if (clock.current) clearInterval(clock.current)
      if (outcome === "connects") {
        setState("connected")
        track(Events.test_call_connected, {})
        onConnected?.()
      } else {
        setState("failed")
        track(Events.trunk_setup_blocked, { step: "test_call", code: 403 })
        onFailed?.()
      }
    }, 4000)
  }

  if (state === "connected") {
    return (
      <StateBanner tone="success" icon={CheckCircle2}>
        <p className="text-sm font-medium">{e164} answered in {sec || 4}s with two-way audio.</p>
      </StateBanner>
    )
  }

  return (
    <StateBanner tone={state === "failed" ? "warning" : "primary"} icon={Radio}>
      {state === "failed" ? (
        <p className="text-sm font-medium">The call did not connect.</p>
      ) : (
        <>
          <p className="text-sm font-medium">Your trunk is saved. Now hear it ring.</p>
          {e164.trim() ? (
            <p className="text-xs text-muted-foreground">Place a call to {e164} and answer it.</p>
          ) : null}
        </>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={place} disabled={state === "ringing"}>
          {state === "ringing"
            ? <><Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" /> Ringing {sec}s</>
            : <><PhoneCall className="h-3.5 w-3.5" /> Call this number</>}
        </Button>
        {state === "failed" && (
          <Button size="sm" variant="outline" asChild>
            <Link href="/calls">See what happened</Link>
          </Button>
        )}
      </div>
    </StateBanner>
  )
}
