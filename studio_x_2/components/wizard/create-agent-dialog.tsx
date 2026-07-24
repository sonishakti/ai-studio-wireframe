"use client"

import * as React from "react"
import {
  Megaphone, PhoneIncoming, Braces, CirclePlus, CalendarClock, Smile, Phone,
  BellRing, ShoppingBag, BarChart3,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AGENT_TEMPLATES } from "@/lib/campaign-data"
import type { AgentType } from "@/lib/wizard-draft"

/**
 * CreateAgentDialog — the New-Agent entry (owner design set 22–23 Jul 2026,
 * Figma 2698-109062): name → agent type → template → Create Agent. The
 * builder is where you EDIT an agent; this modal is where one is born.
 */

const TYPES: { id: AgentType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "outbound", label: "Batch Calls", icon: Megaphone },
  { id: "inbound", label: "Inbound", icon: PhoneIncoming },
  { id: "code", label: "Code/ SDK", icon: Braces },
]

/** Template icons keyed by AGENT_TEMPLATES ids (design shows icon cards).
 *  Exported — the Start landing's template rows use the same set. */
export const TEMPLATE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "appointment-reminder": CalendarClock,
  "nps-survey": BarChart3,
  ivr: Phone,
  "payment-reminder": BellRing,
  ecommerce: ShoppingBag,
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  onCreate,
  defaultTemplateId = "blank",
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreate: (v: { name: string; type: AgentType; templateId: string }) => void
  /** Pre-selected template when opened from a Start-landing row. */
  defaultTemplateId?: string
}) {
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<AgentType>("inbound")
  const [templateId, setTemplateId] = React.useState(defaultTemplateId)

  // Fresh form each open — a dialog that remembers the last aborted create
  // reads as someone else's draft.
  React.useEffect(() => {
    if (open) { setName(""); setType("inbound"); setTemplateId(defaultTemplateId) }
  }, [open, defaultTemplateId])

  const templates = AGENT_TEMPLATES.filter((t) => t.id !== "blank")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 p-0 sm:max-w-[600px]">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle>Create new agent</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="space-y-2">
            <Label htmlFor="ca-name" className="text-sm font-medium">Agent Name</Label>
            <Input
              id="ca-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Aria Agent"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose an agent type based on your requirements</Label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Agent type">
              {TYPES.map((t) => {
                const on = type === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setType(t.id)}
                    className={cn(
                      "flex items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors",
                      on ? "border-foreground/60 ring-1 ring-foreground/40" : "border-border hover:bg-accent/40",
                    )}
                  >
                    <span className="min-w-0">
                      <t.icon className="mb-1.5 h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="block text-sm font-medium">{t.label}</span>
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        on ? "border-foreground" : "border-muted-foreground/50",
                      )}
                      aria-hidden
                    >
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose a template</Label>
            <div className="space-y-3 rounded-lg border border-border p-3" role="radiogroup" aria-label="Template">
              <TemplateCard
                icon={CirclePlus}
                label="Blank Template"
                selected={templateId === "blank"}
                onSelect={() => setTemplateId("blank")}
                wide
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {templates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    icon={TEMPLATE_ICONS[t.id] ?? Smile}
                    label={t.name}
                    selected={templateId === t.id}
                    onSelect={() => setTemplateId(t.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button
            onClick={() => onCreate({ name: name.trim(), type, templateId })}
          >
            Create Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TemplateCard({
  icon: Icon, label, selected, onSelect, wide,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  selected: boolean
  onSelect: () => void
  wide?: boolean
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border px-3 text-center transition-colors",
        wide ? "w-full flex-row py-5" : "py-6",
        selected ? "border-foreground/60 ring-1 ring-foreground/40" : "border-border hover:bg-accent/40",
      )}
    >
      <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </button>
  )
}
