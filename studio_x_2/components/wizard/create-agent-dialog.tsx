"use client"

import * as React from "react"
import {
  CalendarClock, Smile, Phone, BellRing, ShoppingBag, BarChart3, Sparkles, Globe, Check, Code2,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AGENT_TEMPLATES } from "@/lib/campaign-data"
import { channelLabel, type DeployChannel } from "@/lib/wizard-draft"

/**
 * CreateAgentDialog — AI-only (v5, owner 2026-07-28 second pass: "remove the
 * current templates; consider AI-generated templates instead"): describe what
 * you want in two lines (mock AI form validation says when it's enough to
 * build from), enable the channels it should serve, Create. The static
 * template grid is GONE — the description IS the template generator; the
 * inference names what it set up in the landing toast.
 */

/** Template icons keyed by AGENT_TEMPLATES ids. Exported — the Start
 *  landing's template rows + the header template chip still use the set. */
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
  /** The describe-box text — folded into the seeded prompt. */
  description?: string
  /** One-line explanation of what the mock inference picked. */
  inferred?: string
}

/** Keyword → generated-template heuristics (wireframe stand-in for a model). */
const TEMPLATE_HINTS: { id: string; direction: "inbound" | "batch"; words: RegExp }[] = [
  { id: "appointment-reminder", direction: "batch", words: /appointment|remind|reminder|no-show|schedule/i },
  { id: "nps-survey", direction: "batch", words: /survey|nps|feedback|csat|poll/i },
  { id: "payment-reminder", direction: "batch", words: /payment|invoice|dues|collect|balance|overdue/i },
  { id: "ivr", direction: "inbound", words: /ivr|route|routing|press|department|menu|receptionist|front desk/i },
  { id: "ecommerce", direction: "inbound", words: /e-?commerce|order|refund|return|shop|store|support/i },
]

const OUTBOUND_WORDS = /outbound|call out|campaign|dial|call (my|the|a) (list|contacts|customers)|cold call/i
const INBOUND_WORDS = /inbound|answer|hotline|front desk|reception|24\/7|picks? up|receptionist/i
/** SDK/existing-app phrasings (RTE persona): "add it to my app", "our RTC
 *  channels", "via the SDK/API" — the Code / SDK channel, no phone number. */
const CODE_WORDS = /\bsdk\b|\bapi\b|\brtc\b|(my|our|existing) (own )?app|in-app|integrat|embed (it |the agent )?in|pipeline only|no phone number/i

type ChipId = "phone" | "web" | "code"

/** The channel chips offered at setup (owner: Phone Number · Web Widget ·
 *  Code / SDK, with WhatsApp/Telegram as future). Direction (inbound vs
 *  batch) comes from the description — one agent never holds both. */
const CHANNEL_CHIPS: { id: ChipId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "phone", label: "Phone number", icon: Phone },
  { id: "web", label: "Web widget", icon: Globe },
  { id: "code", label: "Code / SDK", icon: Code2 },
]

function infer(text: string, chips: Set<ChipId>): { templateId: string; channels: DeployChannel[]; inferred: string } {
  const tpl = TEMPLATE_HINTS.find((t) => t.words.test(text))
  // Direction: explicit wording wins; else the matched template's; else inbound.
  const direction: "inbound" | "batch" = OUTBOUND_WORDS.test(text)
    ? "batch"
    : INBOUND_WORDS.test(text)
      ? "inbound"
      : tpl?.direction ?? "inbound"
  const codey = CODE_WORDS.test(text)
  const channels = new Set<DeployChannel>()
  // The phone channel exists only when its chip is on (or nothing was picked,
  // where the direction is the sensible default — unless the description
  // reads SDK/existing-app, where Code / SDK is the sensible default) — a
  // web-only pick stays web-only even when the description sounds outbound.
  if (chips.has("phone") || (chips.size === 0 && !codey)) channels.add(direction)
  if (chips.has("web")) channels.add("web")
  if (chips.has("code") || (chips.size === 0 && codey)) channels.add("code")
  const tplName = tpl ? AGENT_TEMPLATES.find((t) => t.id === tpl.id)?.name : undefined
  const channelWords = [...channels].map(channelLabel)
  return {
    templateId: tpl?.id ?? "blank",
    channels: [...channels],
    inferred: `${tplName ? `Generated from your description (closest shape: ${tplName})` : "Generated from your description"} · channels: ${channelWords.join(" + ")}`,
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
  /** A Start-landing template row can still pre-seed the description. */
  defaultTemplateId?: string
}) {
  const [description, setDescription] = React.useState("")
  const [chips, setChips] = React.useState<Set<ChipId>>(new Set(["phone"]))

  // Fresh form each open — a dialog that remembers the last aborted create
  // reads as someone else's draft. A template row pre-seeds the describe box.
  React.useEffect(() => {
    if (open) {
      const tpl = defaultTemplateId !== "blank" ? AGENT_TEMPLATES.find((t) => t.id === defaultTemplateId) : undefined
      setDescription(tpl ? `${tpl.description}.` : "")
      setChips(new Set(["phone"]))
    }
  }, [open, defaultTemplateId])

  // Mock "AI form validation": enough signal = a verb-ish description of
  // reasonable length. The line below the box says what's missing.
  const words = description.trim().split(/\s+/).filter(Boolean)
  const enough = words.length >= 5
  const validation = !description.trim()
    ? null
    : enough
      ? { ok: true, msg: "Enough to build from — we'll set up the prompt, template shape, and channels." }
      : { ok: false, msg: "Add a bit more — what should it do, and for whom? (e.g. \"Call my customer list about overdue invoices\")" }

  const toggleChip = (id: ChipId) =>
    setChips((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const create = () => {
    const inf = infer(description, chips)
    const tplName = AGENT_TEMPLATES.find((t) => t.id === inf.templateId)?.name
    onCreate({
      name: inf.templateId !== "blank" && tplName ? tplName : "Custom agent",
      channels: inf.channels,
      templateId: inf.templateId,
      description: description.trim(),
      inferred: inf.inferred,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 p-0 sm:max-w-[560px]">
        <DialogHeader className="border-b border-border px-6 py-4 text-left">
          <DialogTitle>Create new agent</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* The one door: describe it, get an agent (AI-generated template). */}
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
              autoFocus
              className="min-h-[64px] text-sm"
              placeholder={"Two lines is enough — e.g. \"Call my customer list to remind them about overdue invoices, in English and Spanish.\""}
            />
            {/* One PERSISTENT live region from mount — a region must be live
                before its content changes to announce reliably. */}
            <p
              aria-live="polite"
              className={cn(
                "flex items-start gap-1.5 text-xs",
                validation?.ok ? "text-success" : "text-muted-foreground",
              )}
            >
              {validation?.ok && <Check className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />}
              {validation
                ? validation.msg
                : "We generate the template from your description — no picking from a list. Everything stays editable in the builder."}
            </p>
          </div>

          {/* Channels at setup (owner): enable several; inbound vs outbound is
              read from the description — one agent never holds both. */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Where should it run?</Label>
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Channels">
              {CHANNEL_CHIPS.map((c) => {
                const on = chips.has(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleChip(c.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      on
                        ? "border-primary bg-primary/[0.06] text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/25",
                    )}
                  >
                    <c.icon className="h-3.5 w-3.5" aria-hidden /> {c.label}
                    {on && <Check className="h-3.5 w-3.5 text-primary" aria-hidden />}
                  </button>
                )
              })}
              <Badge variant="outline" className="h-8 gap-1.5 rounded-full px-3 font-normal text-muted-foreground">
                WhatsApp <span className="text-xs uppercase">soon</span>
              </Badge>
              <Badge variant="outline" className="h-8 gap-1.5 rounded-full px-3 font-normal text-muted-foreground">
                Telegram <span className="text-xs uppercase">soon</span>
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Whether the phone channel answers or dials is read from your description — one agent
              can&apos;t handle both inbound and outbound.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button onClick={create} disabled={!enough} className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Create Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Smile stays exported-adjacent for TEMPLATE_ICONS fallbacks elsewhere.
export const FALLBACK_TEMPLATE_ICON = Smile
