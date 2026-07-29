"use client"

import * as React from "react"
import { ChevronDown, Smile } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TEMPLATE_ICONS } from "@/components/wizard/create-agent-dialog"
import { AGENT_TEMPLATES } from "@/lib/campaign-data"
import type { StepProps } from "@/components/wizard/types"

/**
 * TemplateMenu — the header chip next to the agent name (v4 IA, 2026-07-28:
 * the template moved OUT of the prompt section to the top). Shows the applied
 * template ("Blank" default); picking one applies it — over a non-empty
 * prompt only after an explicit "replace the prompt?" confirm, since applying
 * overwrites the system prompt.
 */
export function TemplateMenu({
  draft,
  update,
  onApplied,
}: StepProps & {
  /** Fired after a template lands — the host flashes the prompt editor. */
  onApplied?: () => void
}) {
  const templates = AGENT_TEMPLATES.filter((t) => t.id !== "blank")
  const current = templates.find((t) => t.name === draft.templateName)
  const [pendingId, setPendingId] = React.useState<string | null>(null)

  const apply = (id: string) => {
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    update({
      templateName: tpl.name,
      systemPrompt: `You are ${tpl.name}, a voice agent. ${tpl.description}.\n\nBe concise and helpful. Greet the caller, do your job, and escalate to a human if asked.`,
      greeting: draft.greeting.trim() ? draft.greeting : `Hi, thanks for calling. How can I help you today?`,
      failureMessage: draft.failureMessage.trim() ? draft.failureMessage : "Oops, I can't seem to answer that.",
    })
    toast(`${tpl.name} template applied`, { description: "The system prompt was replaced — edit it in Context." })
    onApplied?.()
  }

  const pick = (id: string) => {
    // A non-empty prompt is real work — replacing it needs an explicit yes.
    if (draft.systemPrompt.trim() && current?.id !== id) setPendingId(id)
    else apply(id)
  }

  const pending = pendingId ? templates.find((t) => t.id === pendingId) : undefined

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-6 shrink-0 gap-1 rounded-full px-2.5 text-xs font-normal text-muted-foreground"
            aria-label={`Agent template: ${current?.name ?? "Blank"}`}
          >
            <span className="max-w-[12rem] truncate">Template: {current?.name ?? "Blank"}</span>
            <ChevronDown className="h-3 w-3" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-muted-foreground">Agent template</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {templates.map((t) => {
            const Icon = TEMPLATE_ICONS[t.id] ?? Smile
            return (
              <DropdownMenuItem key={t.id} onClick={() => pick(t.id)}>
                <Icon className="size-4" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
                {current?.id === t.id && <span className="text-xs text-muted-foreground">current</span>}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={!!pendingId} onOpenChange={(o) => { if (!o) setPendingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the current prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              Applying {pending?.name ?? "this template"} rewrites the system prompt in Context.
              Your greeting and failure message stay unless they&apos;re empty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my prompt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const id = pendingId
                setPendingId(null)
                if (id) apply(id)
              }}
            >
              Apply template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
