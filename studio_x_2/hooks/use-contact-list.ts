"use client"

import * as React from "react"
import { LIST_EVENT, loadList, type ParsedContactList } from "@/lib/contact-list"

/**
 * useContactList — read the parsed list a surface does not own.
 *
 * The Opening lives in section 3 and the file is chosen in section 2, both
 * mounted at once on the one-pager, so the read has to react to the upload
 * rather than arrive as a prop through two sections (direction C, 2026-09-17:
 * SectionOpening keeps its five props).
 *
 * localStorage is client-only, so the read happens in an effect: null on the
 * server and on the first paint, the stored list after it. Same listen-and-
 * re-read idiom as `useWidgetState` (`components/widget-studio.tsx`).
 */

/** `useLayoutEffect` lands the list before the browser paints, so the "Callers
 *  hear" line never flashes its braces and then resolves. React has no layout
 *  pass on the server, where it would warn — `useEffect` there, which never
 *  runs anyway. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? React.useEffect : React.useLayoutEffect

export function useContactList(agentId: string, runId: string): ParsedContactList | null {
  const [list, setList] = React.useState<ParsedContactList | null>(null)

  useIsomorphicLayoutEffect(() => {
    const read = () => setList(loadList(agentId, runId))
    read()
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ agentId: string; runId: string }>).detail
      if (!detail || (detail.agentId === agentId && detail.runId === runId)) read()
    }
    window.addEventListener(LIST_EVENT, onChanged)
    return () => window.removeEventListener(LIST_EVENT, onChanged)
  }, [agentId, runId])

  return list
}
