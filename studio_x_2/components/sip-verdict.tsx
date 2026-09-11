"use client"

import * as React from "react"
import Link from "next/link"
import { TriangleAlert, ArrowRight, Wrench, Copy, Check, CircleHelp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SeverityBadge } from "@/components/severity-badge"
import { cn } from "@/lib/utils"
import { BLAME_LABEL, type SipTrace } from "@/lib/sip-trace"

/**
 * SipVerdict — the answer before the evidence (Design Tracker 11, verdict A).
 *
 * One component renders the verdict wherever it appears — the SIP tab above
 * the ladder and the Diagnosis tab's first card — so the summary can never
 * contradict the ladder. Three states, each with its own weight:
 *
 *  • a failure: code + reason, who it is attributed to, what happened, and
 *    the fix as a link (two links when the fix has two homes);
 *  • no trace retained: a neutral block — "we don't know" gets a next step
 *    (retention setting, the Call-ID for support, the Events tab), not the
 *    certain-cause layout in grey;
 *  • answered: one line.
 */

export const SIP_RETENTION_LABEL = "Retention: 7 days"

export function SipVerdict({
  trace,
  variant = "ladder",
  onSeeEvents,
  className,
}: {
  trace: SipTrace
  /** `ladder` = above the SIP ladder; `card` = an issue card on Diagnosis. */
  variant?: "ladder" | "card"
  /** When given, "See the Events tab" switches tabs instead of pointing. */
  onSeeEvents?: () => void
  className?: string
}) {
  const card = variant === "card"

  if (!trace.retained) {
    return (
      <div
        data-design-focus="sip-verdict"
        className={cn("space-y-2.5 rounded-lg border border-border bg-muted/30 p-3.5", className)}
      >
        <div className="flex items-start gap-2.5">
          <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium">Cause could not be determined</p>
            <p className="text-sm text-muted-foreground">No signalling trace was retained for this call.</p>
          </div>
        </div>
        <dl className="space-y-1.5 pl-[1.625rem] text-xs">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <dt className="text-muted-foreground">SIP Call-ID</dt>
            <dd className="flex min-w-0 items-center gap-1">
              <span className="truncate font-mono">{trace.sipCallId}</span>
              <CopyButton value={trace.sipCallId} label="SIP Call-ID" />
            </dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <dt className="text-muted-foreground">{SIP_RETENTION_LABEL}</dt>
            <dd>
              <Link href="/project/settings" className="text-primary underline-offset-4 hover:underline">Change</Link>
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[1.625rem] text-xs">
          <Link href="/help/contact" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
            Send the Call-ID to support <ArrowRight className="h-3 w-3" />
          </Link>
          {onSeeEvents ? (
            <button type="button" onClick={onSeeEvents} className="text-primary underline-offset-4 hover:underline">
              See the Events tab
            </button>
          ) : (
            <span className="text-muted-foreground">See the Events tab</span>
          )}
        </div>
      </div>
    )
  }

  if (!trace.failure) {
    return (
      <div data-design-focus="sip-verdict" className={cn("rounded-lg border border-border bg-muted/30 px-3.5 py-2.5", className)}>
        <p className="text-sm">Signaling completed normally — the call was answered and ended with a BYE.</p>
      </div>
    )
  }

  const f = trace.failure
  return (
    <div
      data-design-focus="sip-verdict"
      className={cn("space-y-2.5 rounded-lg border border-destructive/40 bg-destructive/5 p-3.5", className)}
    >
      <div className="flex items-start gap-2.5">
        {card ? (
          <SeverityBadge severity="critical" className="mt-0.5 shrink-0" />
        ) : (
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium">SIP {f.code} {f.reason}</p>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              Attributed to
              <Badge variant="outline" className="font-normal">{BLAME_LABEL[f.blame]}</Badge>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{f.explain}</p>
          <p className={cn("text-sm", card && "text-xs text-foreground/80")}>
            {card && <span className="font-medium">Suggested fix: </span>}{f.fix}
          </p>
        </div>
      </div>
      {(f.fixHref || f.fixSecondary) && (
        <div className="flex flex-wrap items-center gap-2">
          {f.fixHref && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={f.fixHref}>
                {card ? <><Wrench className="h-3.5 w-3.5" /> Fix this</> : <>Go fix this <ArrowRight className="h-3.5 w-3.5" /></>}
              </Link>
            </Button>
          )}
          {f.fixSecondary && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href={f.fixSecondary.href}>
                {f.fixSecondary.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = React.useState(false)
  return (
    <Button
      variant="ghost" size="icon" className="h-5 w-5 shrink-0"
      onClick={() => {
        navigator.clipboard?.writeText(value)
        setCopied(true); setTimeout(() => setCopied(false), 1600)
      }}
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span className="sr-only">Copy {label}</span>
    </Button>
  )
}
