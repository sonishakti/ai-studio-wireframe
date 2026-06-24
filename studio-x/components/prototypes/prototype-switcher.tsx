"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

/**
 * PrototypeSwitcher — throwaway floating bar to flip between deploy-step design
 * variants while auditing. Cycles with ←/→ keys (ignored while typing) or the
 * arrow buttons. Hidden in production builds so a stray merge can't ship it.
 * DELETE once a direction wins.
 */
export function PrototypeSwitcher({
  variants,
  current,
  onChange,
}: {
  variants: { key: string; label: string }[]
  current: string
  onChange: (key: string) => void
}) {
  const idx = Math.max(0, variants.findIndex((v) => v.key === current))
  const go = React.useCallback(
    (dir: 1 | -1) => {
      const next = (idx + dir + variants.length) % variants.length
      onChange(variants[next].key)
    },
    [idx, variants, onChange],
  )

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || (el as HTMLElement).isContentEditable)
      if (typing) return
      if (e.key === "ArrowLeft") go(-1)
      if (e.key === "ArrowRight") go(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go])

  if (process.env.NODE_ENV === "production") return null

  const cur = variants[idx]
  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-foreground px-1.5 py-1 text-background shadow-lg">
        <button onClick={() => go(-1)} className="rounded-full p-1.5 hover:bg-background/15" aria-label="Previous variant">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 text-xs font-medium tabular-nums whitespace-nowrap">
          {cur.key} — {cur.label} <span className="opacity-60">({idx + 1}/{variants.length})</span>
        </span>
        <button onClick={() => go(1)} className="rounded-full p-1.5 hover:bg-background/15" aria-label="Next variant">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
