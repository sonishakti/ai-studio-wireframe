"use client"

import * as React from "react"
import { toast } from "sonner"

/**
 * useCopyFeedback — clipboard write + transient "copied" flag, done once.
 *
 * Owns the reset timer properly: re-copying re-arms it (no early icon flip)
 * and unmount clears it (no setState on an unmounted component). Use this
 * instead of hand-rolling clipboard + setTimeout in each component.
 */
export function useCopyFeedback(resetMs = 1600) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<number | null>(null)

  React.useEffect(() => () => {
    if (timer.current != null) window.clearTimeout(timer.current)
  }, [])

  const copy = React.useCallback(
    async (text: string, successMsg: string, description?: string) => {
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success(successMsg, description ? { description } : undefined)
        if (timer.current != null) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), resetMs)
      } catch {
        toast.error("Couldn't copy — select it manually.")
      }
    },
    [resetMs],
  )

  return { copied, copy }
}
