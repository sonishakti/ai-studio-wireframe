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

/** Direction each template kind implies — ONE channel per agent. */
const KIND_DIRECTION: Record<string, DeployChannel> = {
  "appointment-reminder": "batch",
  "nps-survey": "batch",
  "payment-reminder": "batch",
  ivr: "inbound",
  ecommerce: "inbound",
}

/** The one channel + template the create resolves to. A picked template KIND
 *  wins; otherwise the description decides (mock inference). */
function infer(text: string, kindId: string): { templateId: string; channels: DeployChannel[]; inferred: string } {
  const described = text.trim().length > 0
  const kindTpl = kindId !== "blank" ? AGENT_TEMPLATES.find((t) => t.id === kindId) : undefined
  if (kindTpl) {
    const dir = KIND_DIRECTION[kindTpl.id] ?? "inbound"
    return {
      templateId: kindTpl.id,
      channels: [dir],
      inferred: `${kindTpl.name} template · channel: ${channelLabel(dir)}`,
    }
  }
  const tpl = described ? TEMPLATE_HINTS.find((t) => t.words.test(text)) : undefined
  const direction: "inbound" | "batch" = OUTBOUND_WORDS.test(text)
    ? "batch"
    : INBOUND_WORDS.test(text)
      ? "inbound"
      : tpl?.direction ?? "inbound"
  const codey = described && CODE_WORDS.test(text)
  const channels: DeployChannel[] = codey ? ["code"] : [direction]
  const tplName = tpl ? AGENT_TEMPLATES.find((t) => t.id === tpl.id)?.name : undefined
  return {
    templateId: tpl?.id ?? "blank",
    channels,
    inferred: described
      ? `${tplName ? `Generated from your description (closest shape: ${tplName})` : "Generated from your description"} · channel: ${channels.map(channelLabel).join(" + ")}`
      : `Blank agent · channel: ${channels.map(channelLabel).join(" + ")}`,
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
  const [kindId, setKindId] = React.useState("blank")

  // Fresh form each open — a dialog that remembers the last aborted create
  // reads as someone else's draft. A Start-landing row pre-seeds the kind.
  React.useEffect(() => {
    if (open) {
      setDescription("")
      setKindId(defaultTemplateId)
    }
  }, [open, defaultTemplateId])

  // Mock "AI form validation": enough signal = a verb-ish description of
  // reasonable length. The line below the box says what's missing.
  const words = description.trim().split(/\s+/).filter(Boolean)
  const enough = words.length >= 5
  const validation = !description.trim()
    ? null
    : enough
      ? { ok: true, msg: "Enough to build from — we'll set up the prompt, template shape, and channel." }
      : { ok: false, msg: "Add a bit more — what should it do, and for whom? (e.g. \"Call my customer list about overdue invoices\")" }

  const create = () => {
    const inf = infer(description, kindId)
    const tplName = AGENT_TEMPLATES.find((t) => t.id === inf.templateId)?.name
    onCreate({
      name: inf.templateId !== "blank" && tplName ? tplName : description.trim() ? "Custom agent" : "",
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
            <Label htmlFor="ca-desc" className="text-sm font-medium">What do you want to build?</Label>
            <Textarea
              id="ca-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              autoFocus
              className="min-h-[64px] text-sm"
              placeholder={"Two lines is enough — e.g. \"Call my customer list to remind them about overdue invoices, in English and Spanish\" — or: \"Add an agent to my RTC app via the SDK.\""}
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

          {/* Not sure what to type? Pick the KIND instead (owner 2026-07-29:
              "ask what kind of a template do you want" — a fallback for users
              unsure about the two lines). */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">What kind of a template do you want?</Label>
            <div role="radiogroup" aria-label="Template kind" className="space-y-1">
              <KindRow
                icon={Sparkles}
                label="Let my description decide"
                selected={kindId === "blank"}
                onSelect={() => setKindId("blank")}
              />
              {AGENT_TEMPLATES.filter((t) => t.id !== "blank").map((t) => (
                <KindRow
                  key={t.id}
                  icon={TEMPLATE_ICONS[t.id] ?? Smile}
                  label={t.name}
                  selected={kindId === t.id}
                  onSelect={() => setKindId(t.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-6 py-3">
          <Button onClick={create} disabled={!enough && kindId === "blank"}>
            Create agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function KindRow({
  icon: Icon, label, selected, onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
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
