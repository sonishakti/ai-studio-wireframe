"use client"

import * as React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import { AgentDeploymentPanel } from "@/components/agent-deployment-panel"

/**
 * Right-side drawer that opens from the Deploy button in the agent editor.
 * Wraps AgentDeploymentPanel — same data, same controls, presented as a
 * slide-out so it doesn't take the user out of the editing context.
 *
 *   <AgentDeploySheet agentId={id}>
 *     <Button>Deploy</Button>
 *   </AgentDeploySheet>
 */
export function AgentDeploySheet({
  agentId,
  children,
}: {
  agentId: string
  children: React.ReactNode
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-[640px] w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Deploy this agent</SheetTitle>
          <SheetDescription>
            Pick a channel — or several. One agent can be live across Telephony,
            Web Widget, WhatsApp and Direct API at the same time.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          <AgentDeploymentPanel agentId={agentId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
