"use client"

import * as React from "react"
import {
  CirclePlus, CalendarClock, Smile, Phone, BellRing, ShoppingBag, BarChart3, Sparkles,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AGENT_TEMPLATES } from "@/lib/campaign-data"
import type { DeployChannel } from "@/lib/wizard-draft"

/**
 * CreateAgentDialog — AI-first (v4 IA, 2026-07-28, owner direction): the FIRST
 * field is a two-line "describe what you want to build" box — creating from it
 * infers the closest template + channels (mock inference: keyword matching, no
 * model in this wireframe; the landing toast says what was inferred). Below
 * it, the templates as a clean one-per-line radio list. The builder is where
 * you EDIT an agent; this modal is where one is born.
 */

/** Template icons keyed by AGENT_TEMPLATES ids. Exported — the Start
 *  landing's template rows + the header template chip use the same set. */
export const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "appointment-reminder": CalendarClock,
  "nps-survey": BarChart3,
  ivr: Phone,
  "payment-reminder": BellRing,
  ecommerce: ShoppingBag,
}

export interface CreateAgentValue {
  name: string
  channels: DeployChannel[]
  templateId: string
  /** The describe-box text, when the agent was created from it — folded into
   *  the seeded prompt so the user's words aren't dropped. */
  description?: string
  /** One-line explanation of what the mock inference picked. */
  inferred?: string
}

/** Keyword → template heuristics (wireframe stand-in for a model call). */
const TEMPLATE_HINTS: { id: string; channels: DeployChannel[]; words: RegExp }[] = [
  { id: "appointment-reminder", channels: ["batch"], words: /appointment|remind|reminder|no-show|schedule/i },
  { id: "nps-survey", channels: ["batch"], words: /survey|nps|feedback|csat|poll/i },
  { id: "payment-reminder", channels: ["batch"], words: /payment|invoice|dues|collect|balance|overdue/i },
  { id: "ivr", channels: ["inbound"], words: /ivr|route|routing|press|department|menu/i },
  { id: "ecommerce", channels: ["inbound"], words: /e-?commerce|order|refund|return|shop|store|support/i },
]

const CHANNEL_HINTS: { channel: DeployChannel; words: RegExp }[] = [
  { channel: "batch", words: /outbound|call out|campaign|dial|call (my|the|a) (list|contacts|customers)/i },
  { channel: "inbound", words: /inbound|answer|hotline|front desk|reception|24\/7/i },
  { channel: "web", words: /widget|website|web ?page|site visitors/i },
  { channel: "code", words: /sdk|api|in-app|my app|embed in/i },
]

function inferFromDescription(text: string): { templateId: string; channels: DeployChannel[]; inferred: string } {
  const tpl = TEMPLATE_HINTS.find((t) => t.words.test(text))
  const channels = new Set<DeployChannel>(tpl?.channels ?? [])
  for (const c of CHANNEL_HINTS) if (c.words.test(text)) channels.add(c.channel)
  const tplName = tpl ? AGENT_TEMPLATES.find((t) => t.id === tpl.id)?.name : undefined
  return {
    templateId: tpl?.id ?? "blank",
    channels: [...channels],
    inferred: tplName
      ? `Closest template: ${tplName}${channels.size ? ` · channels: ${[...channels].join(", ")}` : ""}`
      : channels.size
        ? `Started blank · channels: ${[...channels].join(", ")}`
        : "Started blank — pick channels in the builder",
  }
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  onCreate,
  defaultTemplateId = "blank",
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: (v: CreateAgentValue) => void
  /** Pre-selected template when opened from a Start-landing row. */
  defaultTemplateId?: string
}) {
  const [description, setDescription] = React.useState("")
  const [templateId, setTemplateId] = React.useState(defaultTemplateId)

  // Fresh form each open — a dialog that remembers the last aborted create
  // reads as someone else's draft.
  React.useEffect(() => {
    if (open) { setDescription(""); setTemplateId(defaultTemplateId) }
  }, [open, defaultTemplateId])

  const templates = AGENT_TEMPLATES.filter((t) => t.id !== "blank")
  const described = description.trim().length > 0

  const create = () => {
    if (described) {
      const inf = inferFromDescription(description)
      const tplName = AGENT_TEMPLATES.find((t) => t.id === inf.templateId)?.name
      onCreate({
        name: inf.templateId !== "blank" && tplName ? tplName : "Custom agent",
        channels: inf.channels,
        templateId: inf.templateId,
        description: description.trim(),
        inferred: inf.inferred,
      })
      return
    }
    const tpl = AGENT_TEMPLATES.find((t) => t.id === templateId)
    onCreate({
      name: templateId === "blank" || !tpl ? "" : tpl.name,
      channels: [],
      templateId,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle>Create new agent</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* The AI door comes FIRST (owner): say it, get an agent. */}
          <div className="space-y-2">
            <Label htmlFor="ca-desc" className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              What do you want to build?
            </Label>
            <Textarea
              id="ca-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="min-h-[56px] text-sm"
              placeholder={"Describe it in two lines — e.g. \"Call my customer list to remind them about overdue invoices, in English and Spanish.\""}
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll set up the closest template and channels from your description. You can change everything in the builder.
            </p>
          </div>

          <div className="flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or start from a template</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Templates — a clean radio LIST, one per line (owner direction). */}
          <div
            role="radiogroup"
            aria-label="Template"
            className={cn("space-y-1", described && "pointer-events-none opacity-50")}
          >
            <TemplateRow
              icon={CirclePlus}
              label="Blank agent"
              desc="Start from scratch — your own prompt, voice, and channels."
              selected={templateId === "blank"}
              onSelect={() => setTemplateId("blank")}
            />
            {templates.map((t) => (
              <TemplateRow
                key={t.id}
                icon={TEMPLATE_ICONS[t.id] ?? Smile}
                label={t.name}
                desc={t.description}
                selected={templateId === t.id}
                onSelect={() => setTemplateId(t.id)}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button onClick={create} className="gap-1.5">
            {described && <Sparkles className="h-3.5 w-3.5" aria-hidden />}
            Create Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TemplateRow({
  icon: Icon, label, desc, selected, onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  desc: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        selected ? "border-primary bg-primary/[0.03]" : "border-transparent hover:bg-accent/40",
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{desc}</span>
      </span>
      <span
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary" : "border-muted-foreground/50",
        )}
        aria-hidden
      >
        <span className={cn("h-2 w-2 rounded-full bg-primary transition-transform", selected ? "scale-100" : "scale-0")} />
      </span>
    </button>
  )
}
