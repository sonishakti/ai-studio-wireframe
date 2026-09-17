"use client"

import * as React from "react"

/**
 * DesignFocus — where a review link lands (design-ops rule 2026-09-11).
 *
 * A prototype link has to open AT the start of the journey, not at the top of
 * the page: `?focus=<id>` finds `[data-design-focus="<id>"]`, scrolls it to the
 * centre and rings it for 2.6 s, then stands down and leaves the element as it
 * found it.
 *
 * Mounted by the page that owns the anchor, not by the dashboard layout: nine
 * designs land in this app at once and the layout is the file they would all
 * reach for. It is self-contained on purpose, so any surface can mount its own
 * copy and a later design-kit commit can lift it into the layout once.
 *
 * An anchor that also carries `data-design-focus-open` is pressed once it has
 * been found (17, 2026-09-17): some journeys start inside a sheet, and a link
 * that lands on the button that opens it has landed one click short.
 *
 * The only other implementation, `focusOn` in components/wizard/agent-wizard.tsx,
 * is a callback closed over wizard step state and runs on the wizard page. The
 * two never meet, so there is no owner flag and nothing to coordinate.
 *
 * Reads window.location.search rather than useSearchParams, the same way the
 * deploy wizards read ?agent=, so mounting it never forces a Suspense boundary.
 */
export function DesignFocus(): null {
  React.useEffect(() => {
    const focus = new URLSearchParams(window.location.search).get("focus")
    // Ids are ours: anything else is not an anchor, and never reaches a selector.
    if (!focus || !/^[\w-]{1,64}$/.test(focus)) return

    let tries = 0
    let pending = 0
    let ringing = 0
    let opening = 0
    let target: HTMLElement | null = null
    let previousOutline = ""

    const clear = () => {
      if (!target) return
      target.style.outline = previousOutline
      target.style.outlineOffset = ""
      target = null
    }

    const attempt = () => {
      const el = document.querySelector<HTMLElement>(`[data-design-focus="${focus}"]`)
      if (!el) {
        // The anchor can be one render behind the mount, or inside a card that
        // only appears once its data has been read in an effect.
        if (tries++ < 40) pending = window.setTimeout(attempt, 200)
        return
      }
      target = el
      previousOutline = el.style.outline
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" })
      el.style.outline = "3px solid #e11d48"
      el.style.outlineOffset = "8px"
      el.style.transition = "outline-color 600ms ease"
      ringing = window.setTimeout(clear, 2600)
      // The ring lands on the trigger first, then the surface it opens: the
      // reviewer sees which door was taken before the door is open.
      if (el.hasAttribute("data-design-focus-open")) opening = window.setTimeout(() => el.click(), 500)
    }

    pending = window.setTimeout(attempt, 350)
    return () => {
      window.clearTimeout(pending)
      window.clearTimeout(ringing)
      window.clearTimeout(opening)
      clear()
    }
  }, [])

  return null
}
