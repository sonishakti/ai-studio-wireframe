"use client"

import * as React from "react"
import Link from "next/link"
import { Shield, ShieldCheck, AlertTriangle, ArrowRight, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * SecuredModeBanner — surfaces App Certificate activation status.
 *
 * In Agora's docs: "Secured mode: APP ID + Token (Recommended)". A project
 * without the App Certificate enabled is in test mode — limited quota, no
 * production traffic. Enabling the Primary Certificate is the P0 step
 * between signup and production deploy. This banner persists until enabled.
 *
 * Once enabled, it collapses to a small confirmation pill that can be
 * dismissed entirely (info still available in Project Settings).
 *
 * Usage: pass `enabled` from the project state (false on new projects).
 *   <SecuredModeBanner enabled={project.appCertificateEnabled} />
 */

const DISMISS_KEY = "sx:secured-mode-confirm-dismissed"

export function SecuredModeBanner({
  enabled,
  variant = "full",
}: {
  enabled: boolean
  variant?: "full" | "compact"
}) {
  const [confirmDismissed, setConfirmDismissed] = React.useState(false)

  React.useEffect(() => {
    if (enabled && typeof window !== "undefined") {
      setConfirmDismissed(window.localStorage.getItem(DISMISS_KEY) === "1")
    }
  }, [enabled])

  // ───── NOT YET ACTIVATED — high-priority banner ─────────────────────────
  if (!enabled) {
    return (
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardContent
          className={cn(
            "flex items-center gap-4",
            variant === "full" ? "p-5" : "px-4 py-3",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Your project is in test mode</p>
              <Badge variant="outline" className="text-xs border-amber-500/40 text-amber-700 dark:text-amber-400">
                P0
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Enable <span className="font-medium text-foreground">Secured mode</span> (App Certificate)
              to take real traffic, lift quota caps, and require tokens for client auth. Required for
              production deployments on every channel.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/project/settings#secured-mode">
              Enable secured mode <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // ───── ENABLED, NOT YET DISMISSED — small confirmation ─────────────────
  if (!confirmDismissed) {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-3 px-4 py-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs">
              <span className="font-medium">Secured mode active.</span>
              <span className="text-muted-foreground"> Tokens are required for SDK authentication. Last verified 2 min ago.</span>
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
            <Link href="/project/settings#secured-mode">Manage</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setConfirmDismissed(true)
              window.localStorage.setItem(DISMISS_KEY, "1")
            }}
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Dismissed — render nothing
  return null
}

/**
 * Smaller inline pill version — for placement next to App ID display
 * in Project Settings, agent editor, deploy flows etc.
 */
export function SecuredModePill({ enabled }: { enabled: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 text-xs",
        enabled
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
      )}
    >
      {enabled ? <ShieldCheck className="h-2.5 w-2.5" /> : <Shield className="h-2.5 w-2.5" />}
      {enabled ? "Secured mode" : "Test mode"}
    </Badge>
  )
}

/**
 * Inline warning to surface in deploy flows when secured mode is off.
 * Smaller than the banner, but blocks the primary CTA path.
 */
export function SecuredModeGate({ enabled }: { enabled: boolean }) {
  if (enabled) return null
  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="flex items-start gap-3 px-4 py-3">
        <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <p className="font-medium text-foreground">Secured mode required for production traffic</p>
          <p className="text-muted-foreground mt-0.5">
            You can complete this setup, but the channel will run in test mode (limited concurrent
            users, quota throttled) until you enable the App Certificate.
          </p>
          <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" asChild>
            <Link href="/project/settings#secured-mode">Enable Secured mode →</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
