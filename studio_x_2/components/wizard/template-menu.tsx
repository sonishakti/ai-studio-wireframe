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
import { AGENT_TEMPLATES, STACK_PRESETS, stackFor } from "@/lib/campaign-data"
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
    // A template is a config payload, not a prompt string: it carries its own
    // worked prompt, greeting, failure line AND the speed/cost preset that
    // suits the job. It used to write four generic sentences and ignore the
    // stack entirely, which made the whole feature feel decorative.
    update({
      templateName: tpl.name,
      systemPrompt: tpl.prompt,
      greeting: tpl.greeting,
      failureMessage: tpl.failure,
      stack: stackFor(tpl.preset, draft.stack.modality),
    })
    toast(`${tpl.name} template applied`, {
      description: `Prompt, greeting, and the ${STACK_PRESETS[tpl.preset].label} model stack are set — edit anything in Prompt & knowledge.`,
    })
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
            <AlertDialogTitle>Apply {pending?.name ?? "this template"}?</AlertDialogTitle>
            <AlertDialogDescription>
              A template now sets more than the prompt — here&apos;s exactly what changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* The diff. A binary replace-or-cancel gave no way to judge the
              trade, and now that templates carry a real payload there is
              genuinely more at stake than one text field. */}
          {pending && (
            <ul className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <li className="flex gap-2">
                <span className="text-muted-foreground">Prompt</span>
                <span className="ml-auto text-right">
                  {draft.systemPrompt.trim() ? "replaced" : "written"} · {pending.prompt.split("\n\n").length} sections
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-muted-foreground">Greeting</span>
                <span className="ml-auto truncate text-right">&ldquo;{pending.greeting}&rdquo;</span>
              </li>
              <li className="flex gap-2">
                <span className="text-muted-foreground">Model stack</span>
                <span className="ml-auto text-right">{STACK_PRESETS[pending.preset].label}</span>
              </li>
              {pending.extract.length > 0 && (
                <li className="flex gap-2">
                  <span className="shrink-0 text-muted-foreground">Extracts</span>
                  <span className="ml-auto text-right text-xs text-muted-foreground">
                    {pending.extract.join(" · ")}
                  </span>
                </li>
              )}
              <li className="flex gap-2 border-t border-border pt-1.5 text-xs text-muted-foreground">
                <span>Your voice, channel, and knowledge stay as they are.</span>
              </li>
            </ul>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep what I have</AlertDialogCancel>
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
