"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, RotateCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { track, Events } from "@/lib/analytics"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    track(Events.page_error_rendered, {
      path: typeof window !== "undefined" ? window.location.pathname : "unknown",
      digest: error.digest,
    })
    // eslint-disable-next-line no-console
    console.error("[studio-x] page error:", error)
  }, [error])

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
        </div>

        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-destructive">Error</p>
          <h1 className="text-2xl font-semibold tracking-tight mt-1">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We ran into a problem rendering this page. Your data is safe — this is
            a UI hiccup. Try again, and if it keeps happening let support know.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-muted-foreground mt-3">
              Error ID: <span className="bg-muted px-1.5 py-0.5 rounded">{error.digest}</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button onClick={reset}>
            <RotateCw className="h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/agents">
              <Home className="h-4 w-4" /> Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/help/contact">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
