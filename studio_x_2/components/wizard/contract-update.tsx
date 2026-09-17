"use client"

import * as React from "react"
import { ArrowRight, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { detectRetired, planMigration } from "@/lib/legacy-config"

/**
 * "Built on an older setup" (design 09).
 *
 * The banner states the fact and nothing else. It does not scold, it does not
 * say the agent is broken, and it does not offer to fix anything before the
 * user has seen what fixing means. The one action opens a list of before and
 * after rows, because this rewrites a config they wrote.
 */
export function ContractUpdateBanner({
  customConfig, onApply,
}: {
  customConfig?: string
  onApply: (next: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [applied, setApplied] = React.useState(false)
  const retired = React.useMemo(() => detectRetired(customConfig), [customConfig])
  const plan = React.useMemo(() => (open ? planMigration(customConfig) : null), [open, customConfig])

  if (applied) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border bg-success/5 px-5 py-2.5 text-sm">
        <span className="font-medium">Settings updated.</span>
        <span className="text-muted-foreground">Republish for the change to reach live calls.</span>
      </div>
    )
  }

  if (!retired.length) return null

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-border bg-warning/5 px-5 py-2.5">
        <History className="size-4 shrink-0 text-warning" aria-hidden />
        <p className="min-w-0 flex-1 text-sm">
          <span className="font-medium">This agent was built on an older setup.</span>{" "}
          <span className="text-muted-foreground">
            {retired.length} setting{retired.length === 1 ? "" : "s"} moved in a later release:{" "}
            <code className="font-mono text-xs">{retired.join(", ")}</code>
          </span>
        </p>
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
          See what changes
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">What changes</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {plan?.rows.map((r) => (
              <div key={r.path} className="space-y-1.5 rounded-md border border-stroke p-3">
                <p className="font-mono text-xs text-muted-foreground">{r.path}</p>
                {/* Two columns, each able to shrink: a long value has to wrap
                    rather than push the panel open. */}
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <code className="min-w-0 break-words rounded bg-muted/60 px-2 py-1 text-xs line-through opacity-70">{r.before}</code>
                  <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <code className="min-w-0 break-words rounded bg-success/10 px-2 py-1 text-xs">{r.after}</code>
                </div>
                <p className="text-xs text-muted-foreground">{r.reason}</p>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Anything not listed here is left exactly as you wrote it.
            </p>
          </div>
          <SheetFooter className="shrink-0 flex-row gap-2 border-t border-border px-5 py-3">
            <Button variant="ghost" className="flex-1" onClick={() => setOpen(false)}>Leave it</Button>
            <Button
              className="flex-1"
              onClick={() => { if (plan) { onApply(plan.next); setApplied(true); setOpen(false) } }}
            >
              Update the settings
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
