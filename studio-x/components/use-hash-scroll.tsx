"use client"

import * as React from "react"

/**
 * Scroll the element matching the current URL hash into view on mount — so the
 * diagnostics `fixHref()` deep-links (e.g. #prompt, #greeting, #failure, #channel)
 * actually land on their section. Pair with `id="…"` + `scroll-mt-*` on the
 * targets. Re-runs when the hash changes within the page.
 */
export function useHashScroll() {
  React.useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace("#", "")
      if (!hash) return
      const el = document.getElementById(hash)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
    scrollToHash()
    window.addEventListener("hashchange", scrollToHash)
    return () => window.removeEventListener("hashchange", scrollToHash)
  }, [])
}
