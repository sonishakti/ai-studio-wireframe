"use client"

import * as React from "react"

/** Read a JSON value from localStorage — `fallback` on the server, on a miss,
 *  or on a parse error. Same guards as `lib/voice-artifacts.ts`. */
export function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* quota / private mode — wireframe only */
  }
}

/**
 * useStoredState — useState backed by localStorage under an `sx:` key. The
 * value is read lazily on the first render and written through on set (no
 * effect, no cascading render). Mount it in client-only surfaces — dialog and
 * sheet content — where nothing server-rendered depends on the value.
 */
export function useStoredState<T>(key: string, fallback: T): [T, (next: T) => void] {
  const [value, setValue] = React.useState<T>(() => readStored(key, fallback))
  const set = React.useCallback((next: T) => {
    writeStored(key, next)
    setValue(next)
  }, [key])
  return [value, set]
}
