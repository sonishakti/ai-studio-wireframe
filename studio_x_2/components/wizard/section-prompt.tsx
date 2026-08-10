"use client"

import * as React from "react"
import { Sparkles, Lock, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { extractVars } from "@/lib/campaign-data"
import { SectionRow } from "@/components/wizard/section-row"
import { hasChannel, greetingSpeaksName } from "@/lib/wizard-draft"
import type { StepProps } from "@/components/wizard/types"

/**
 * Context › Prompt (v4/v5 IA, 2026-07-28): system prompt (+ Rewrite) →
 * Greeting → Failure message. The TEMPLATE picker lives in the header chip.
 * CUSTOM-CONFIG OVERRIDES (owner, second pass): fields the JSON drawer has
 * overridden render warning-flagged AND DISABLED — the JSON is their source
 * of truth until unlocked here.
 */
export function SectionPrompt({
  draft,
  update,
  templateFlash = 0,
  onUnlock,
  templateSlot,
}: StepProps & {
  /** Bumped by the template menu when a template overwrites the prompt —
   *  flashes the editor so the swap visibly lands. */
  templateFlash?: number
  /** Releases a custom-config override so the field is editable again. */
  onUnlock?: (field: string) => void
  /** The template picker (Figma 2867-53592: "Choose an Agent Template"). */
  templateSlot?: React.ReactNode
}) {
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)
  const batch = hasChannel(draft, "batch")
  const overridden = (field: string) => (draft.configOverrides ?? []).includes(field)
  const [rewriteOpen, setRewriteOpen] = React.useState(false)

  const OverrideFlag = ({ field }: { field: string }) => (
    <span className="flex items-center justify-between gap-2 rounded-md border border-warning/50 bg-warning/10 px-2.5 py-1.5 text-xs text-foreground">
      <span className="flex min-w-0 items-center gap-1.5">
        <TriangleAlert className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
        Controlled by your custom config JSON.
      </span>
      {onUnlock && (
        <button
          type="button"
          className="shrink-0 underline underline-offset-2 hover:text-foreground"
          onClick={() => onUnlock(field)}
        >
          Unlock
        </button>
      )}
    </span>
  )

  return (
    <SectionRow
      id="wz-3-prompt"
      label="Set up your agent's foundational context"
    >
      {/* Template first (Figma): the prompt below is what it writes. */}
      {templateSlot && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Choose an Agent Template</Label>
          <div>{templateSlot}</div>
        </div>
      )}

      {/* System prompt + Rewrite */}
      <div className="space-y-1.5">
        <Label htmlFor="wz-prompt" className="flex items-center gap-1.5 text-sm font-medium">
          System prompt
          {overridden("systemPrompt") && <Lock className="h-3 w-3 text-warning" aria-hidden />}
        </Label>
        {overridden("systemPrompt") && <OverrideFlag field="systemPrompt" />}
        <div key={templateFlash} className={templateFlash > 0 ? "wz-anchor-flash relative" : "relative"}>
          <Textarea
            id="wz-prompt"
            value={draft.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value })}
            disabled={overridden("systemPrompt")}
            className={cn(
              "min-h-[220px] pb-12 font-mono text-sm leading-relaxed",
              overridden("systemPrompt") && "border-warning/50 opacity-80",
            )}
            placeholder={"You are a helpful voice agent for Acme.\nBe concise. Greet the caller, resolve their request, and escalate to a human if asked.\nUse {{name}} and {{account}} when available."}
          />
          {/* Rewrite Prompt (Figma 2976-92001) — an instruction modal, not a
              bare toast. The rewrite itself is simulated. */}
          {!overridden("systemPrompt") && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="sx-sparkle-hover absolute bottom-2.5 right-2.5 gap-1.5"
              onClick={() => setRewriteOpen(true)}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> Rewrite Prompt
            </Button>
          )}
        </div>
        {/* Variable chips: on Batch calls these are filled from each
            campaign's CSV — the dependency runs Go Live → prompt. */}
        {vars.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-xs text-muted-foreground">
              Variables detected{batch ? " (filled from your campaign CSVs)" : ""}:
            </span>
            {vars.map((v) => (
              <Badge key={v} variant="secondary" className="h-6 px-2 font-mono text-xs">{`{{${v}}}`}</Badge>
            ))}
          </div>
        )}
        {/* Inbound has no CSV to fill from — name the roadmap item instead of
            leaving the variables unexplained (user-test 2026-07-29: the
            Retell-webhook switcher hit silence here). */}
        {vars.length > 0 && !batch && hasChannel(draft, "inbound") && (
          <p className="text-xs text-muted-foreground">
            Inbound agents: per-call variables via API — coming soon.
          </p>
        )}
      </div>

      {/* Greeting */}
      <div id="wz-3-greeting" className="scroll-mt-28 space-y-1.5">
        <Label htmlFor="wz-greeting" className="flex items-center gap-1.5 text-sm font-medium">
          Greeting Message
          {overridden("greeting") && <Lock className="h-3 w-3 text-warning" aria-hidden />}
        </Label>
        {overridden("greeting") && <OverrideFlag field="greeting" />}
        <Textarea
          id="wz-greeting"
          value={draft.greeting}
          onChange={(e) => update({ greeting: e.target.value })}
          disabled={overridden("greeting")}
          className={cn("min-h-[64px] text-sm", overridden("greeting") && "border-warning/50 opacity-80")}
          placeholder={batch
            ? "Hey {{name}}, I'm calling from Acme about your account…"
            : "Hi, thanks for calling. How can I help you today?"}
        />
        {/* Rename nudge (user-test 2026-07-28): a functional agent name
            spoken aloud — "this is Payment Reminder" — sounds wrong to the
            caller, and nothing pointed that out. */}
        {greetingSpeaksName(draft) && (
          <p className="text-xs text-muted-foreground">
            Your agent introduces itself as &ldquo;{draft.name.trim()}&rdquo; — give it a
            caller-facing name? Rename it in the header, then update the greeting to match.
          </p>
        )}
      </div>

      {/* Failure message (proposal — new field). */}
      <div className="space-y-1.5">
        <Label htmlFor="wz-failure" className="flex items-center gap-1.5 text-sm font-medium">
          Failure Message
          {overridden("failureMessage") && <Lock className="h-3 w-3 text-warning" aria-hidden />}
        </Label>
        {overridden("failureMessage") && <OverrideFlag field="failureMessage" />}
        <Textarea
          id="wz-failure"
          value={draft.failureMessage}
          onChange={(e) => update({ failureMessage: e.target.value })}
          disabled={overridden("failureMessage")}
          className={cn("min-h-[64px] text-sm", overridden("failureMessage") && "border-warning/50 opacity-80")}
          placeholder="Oops, I can't seem to answer that."
        />
        {/* When it plays — the field arrived with no trigger doc (journey
            test 2026-07-22 D1: "when does that play?"). */}
        <p className="text-xs text-muted-foreground">
          Played when the agent can&apos;t respond — a model error, tool timeout, or dropped connection.
        </p>
      </div>

      <RewritePromptDialog
        open={rewriteOpen}
        onOpenChange={setRewriteOpen}
        onRewrite={(instruction) => {
          // Simulated rewrite — the wireframe appends the direction as a tone
          // rule so the button visibly changes the prompt.
          const base = draft.systemPrompt.trim()
          update({
            systemPrompt: `${base}${base ? "\n\n" : ""}Tone & style: ${instruction.trim().replace(/\.$/, "")}.`,
          })
          toast("Prompt rewritten", {
            description: "Simulated — a model would restructure the whole prompt here, not just append the direction.",
          })
        }}
      />
    </SectionRow>
  )
}

/** Rewrite Prompt (Figma 2976-92001): one instruction, one Rewrite button. */
function RewritePromptDialog({
  open, onOpenChange, onRewrite,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onRewrite: (instruction: string) => void
}) {
  const [instruction, setInstruction] = React.useState("")
  React.useEffect(() => { if (open) setInstruction("") }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Rewrite Prompt
            <Badge variant="secondary" className="text-xs">AI</Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder="Make the agent personality more customer friendly and soft spoken."
            className="min-h-[88px] text-sm"
            aria-label="How to update the system prompt"
          />
          <p className="text-xs text-muted-foreground">
            Describe how would you like to update the system prompt.
          </p>
        </div>
        <DialogFooter>
          <Button
            disabled={!instruction.trim()}
            onClick={() => { onRewrite(instruction); onOpenChange(false) }}
          >
            Rewrite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
