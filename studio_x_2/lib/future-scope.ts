"use client"

import * as React from "react"

/**
 * Future-scope flag (2026-07-09) — gates the 6 roadmap P0 features (X1 · A1 ·
 * A6 · A3 · D1 · F-Eval) behind a top-bar toggle so the live app defaults to
 * the CURRENT product and nobody confuses upcoming work with what ships today.
 *
 * Default OFF: a first-time visitor sees the shipping product; flipping the
 * "Future scope" switch reveals the roadmap features, persisted per-browser.
 * SSR-safe: server + first client paint render the default, then the effect
 * syncs from localStorage (a one-frame flash for someone who left it ON is
 * acceptable in a wireframe).
 */

const KEY = "sx:future-scope"
const EVENT = "sx:future-scope-change"

export const FUTURE_SCOPE_DEFAULT = false

export function readFutureScope(): boolean {
  if (typeof window === "undefined") return FUTURE_SCOPE_DEFAULT
  const v = window.localStorage.getItem(KEY)
  return v == null ? FUTURE_SCOPE_DEFAULT : v === "1"
}

export function setFutureScope(v: boolean) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, v ? "1" : "0")
  // Notify every subscriber in this tab (localStorage's own "storage" event
  // only fires cross-tab).
  window.dispatchEvent(new CustomEvent(EVENT))
}

/** Read + toggle the flag; re-renders on any change from any component. */
export function useFutureScope(): [boolean, (v: boolean) => void] {
  const [on, setOn] = React.useState(FUTURE_SCOPE_DEFAULT)

  React.useEffect(() => {
    setOn(readFutureScope())
    const sync = () => setOn(readFutureScope())
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const set = React.useCallback((v: boolean) => {
    setFutureScope(v)
    setOn(v)
  }, [])

  return [on, set]
}
