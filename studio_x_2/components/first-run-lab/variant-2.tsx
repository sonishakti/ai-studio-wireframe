"use client"

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import type { FirstRunVariantProps } from "./spec"

/**
 * Variant 2 · placeholder. The original variant-2 was referenced by the lab's
 * page.tsx (commit 2cea4e6) but its file was never committed and the untracked
 * copy disappeared from disk (2026-07-09) — this stub keeps the lab route
 * building. Re-author the variant or drop it from page.tsx.
 */
export function Variant2(_props: FirstRunVariantProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
      <AlertTriangle className="h-5 w-5 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium">Variant 2 is missing</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Its source file was never committed (see the note in variant-2.tsx). Use variants 1 and 3, or re-author this one.
      </p>
    </div>
  )
}
