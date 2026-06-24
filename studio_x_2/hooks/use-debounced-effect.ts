import * as React from "react"

/**
 * useDebouncedEffect — run `effect` after `delay`ms of no change to `deps`.
 *
 * Powers the wizard's draft autosave: we persist after the user pauses typing,
 * not on every keystroke. The pending timer is cleared on unmount or whenever a
 * dependency changes, so only the last edit in a burst is written.
 */
export function useDebouncedEffect(
  effect: () => void,
  deps: React.DependencyList,
  delay = 600,
) {
  const effectRef = React.useRef(effect)
  effectRef.current = effect

  React.useEffect(() => {
    const t = setTimeout(() => effectRef.current(), delay)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay])
}
