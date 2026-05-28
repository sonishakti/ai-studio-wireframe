"use client"

import * as React from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import { DeployChooser, DeployChooserFooter } from "@/components/deploy-chooser"

/**
 * Right-side drawer that opens from the Deploy button in the agent editor.
 * Shows the same 3-choice chooser as /deploy (Inbound · Outbound · Code) so
 * the mental model is identical regardless of entry point.
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
            Pick how this agent goes live. You can add more channels later from the
            campaign it lands in.
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6 space-y-5">
          <DeployChooser variant="sheet" agentId={agentId} />
          <DeployChooserFooter />
        </div>
      </SheetContent>
    </Sheet>
  )
}
