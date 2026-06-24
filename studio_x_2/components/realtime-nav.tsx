"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Realtime Services = the Agora RTE catalog (Voice/Video/Live/Chat/Signaling…)
// — human↔human SDK comms. There is no "session" surface here; consumption is
// *usage*. So no Sessions tab — just a jump to usage. Agent sessions live in
// the Monitor hub (/sessions).
export function RealtimeNav() {
  return (
    <div className="border-b bg-background px-6">
      <div className="flex items-center justify-between gap-3 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Realtime Services</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enable and configure the Agora RTE services your project uses.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="gap-1.5 shrink-0">
          <Link href="/billing/usage">View usage <ArrowRight className="h-3.5 w-3.5" /></Link>
        </Button>
      </div>
    </div>
  )
}
