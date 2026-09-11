"use client"

import * as React from "react"
import { Play, Square } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

/**
 * One shared simulated player (Design Tracker 01): every audio control is a
 * real ▶/■ button with a visible stop state. Nothing autoplays; a sample "runs"
 * for three seconds, starting another silences the one playing — on ANY
 * surface (dialog rows, the compare tray, the Models row) — and unmounting the
 * owner silences it too. No live audio in this wireframe: the one-time toast
 * says so on every play.
 */

const SAMPLE_MS = 3000

/** The surface currently playing, module-wide, so two hooks never overlap. */
let active: { token: symbol; stop: () => void } | null = null

export interface SimulatedPlayer {
  playingId: string | null
  toggle: (voice: { id: string; name: string }) => void
  stop: () => void
}

export function useSimulatedPlayer(): SimulatedPlayer {
  const [token] = React.useState(() => Symbol("sample-player"))
  const [playingId, setPlayingId] = React.useState<string | null>(null)
  const timer = React.useRef<number | null>(null)

  const stop = React.useCallback(() => {
    if (timer.current != null) {
      window.clearTimeout(timer.current)
      timer.current = null
    }
    setPlayingId(null)
    if (active?.token === token) active = null
  }, [token])

  const toggle = React.useCallback(
    (voice: { id: string; name: string }) => {
      if (playingId === voice.id) {
        stop()
        return
      }
      if (active && active.token !== token) active.stop()
      if (timer.current != null) window.clearTimeout(timer.current)
      active = { token, stop }
      setPlayingId(voice.id)
      toast("Simulated preview", {
        description: `No live audio in this wireframe — ${voice.name} would play here.`,
      })
      timer.current = window.setTimeout(() => {
        timer.current = null
        setPlayingId(null)
        if (active?.token === token) active = null
      }, SAMPLE_MS)
    },
    [playingId, stop, token],
  )

  // Unmount (dialog closed, sheet dismissed) silences whatever this owner started.
  React.useEffect(() => stop, [stop])

  return { playingId, toggle, stop }
}

export function VoiceSampleButton({
  voice,
  player,
  variant = "ghost",
  size = "icon-sm",
  disabled,
  className,
}: {
  voice: { id: string; name: string }
  player: SimulatedPlayer
  variant?: React.ComponentProps<typeof Button>["variant"]
  size?: React.ComponentProps<typeof Button>["size"]
  disabled?: boolean
  className?: string
}) {
  const playing = player.playingId === voice.id
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={className}
      aria-label={`${playing ? "Stop" : "Play"} ${voice.name}`}
      aria-pressed={playing}
      onClick={() => player.toggle(voice)}
    >
      {playing
        ? <Square className="size-3.5 fill-current" aria-hidden />
        : <Play className="size-3.5" aria-hidden />}
    </Button>
  )
}
