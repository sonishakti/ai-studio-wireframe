"use client"

import * as React from "react"
import { PhoneCall } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * NumberPickRow — the selectable number row BOTH branches of
 * AddPhoneNumberSheet render (16 · phone number purchase, 2026-09-17). It is
 * lifted out of `sip-quick-connect.tsx:241-268`, which was already this
 * component: the same mono e164, the same quiet sub-line, the same capability
 * Badge, the same bordered selectable button with a disabled variant. Drawing
 * a second one in the buy branch would be a third styling of one row inside
 * one sheet.
 *
 * It also settles the capability wording on the one vocabulary already
 * shipping ("inbound + outbound" / "outbound only"), extended by the
 * inbound-only case, so a bought number and a brought number never wear two
 * labels for one value.
 *
 * Two click contracts, one row: pass `selected` where picking and committing
 * are separate steps (the buy branch), omit it where the click IS the commit
 * (quick connect).
 */

export type NumberCapability = "inbound+outbound" | "outbound-only" | "inbound-only"

export const CAPABILITY_LABEL: Record<NumberCapability, string> = {
  "inbound+outbound": "inbound + outbound",
  "outbound-only": "outbound only",
  "inbound-only": "inbound only",
}

export function NumberPickRow({
  e164,
  meta,
  capability,
  selected,
  disabled,
  onSelect,
}: {
  e164: string
  /** The row's quiet sub-line: where the number is from, what it does. */
  meta: React.ReactNode
  capability: NumberCapability
  /** Selected state is an ink tint + ink border, never the primary fill. */
  selected?: boolean
  /** A row that cannot be picked at all (e.g. outbound-only on an inbound job). */
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-dashed border-border opacity-60"
          : selected
            ? "border-primary/60 bg-primary/[0.04]"
            : "border-border hover:border-primary/40 hover:bg-accent/30",
      )}
    >
      <PhoneCall className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-sm">{e164}</span>
        <span className="block text-xs text-muted-foreground">{meta}</span>
      </span>
      <Badge
        variant={capability === "inbound+outbound" ? "secondary" : "outline"}
        className="shrink-0 text-xs"
      >
        {CAPABILITY_LABEL[capability]}
      </Badge>
    </button>
  )
}
