"use client"

import * as React from "react"
import { CircleHelp, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DEFAULT_CALL_BEHAVIOR, DEFAULT_DISCLOSURE, composeOpening, openingOf, type AgentDraft, type OpeningConfig,
} from "@/lib/wizard-draft"

/**
 * Opening (design 04 · Greeting, filler & disclaimer — ported from the
 * ng-console prototype, 2026-09-11). One place for the first seconds of a
 * call: who speaks first · greeting · can callers interrupt it · tell the
 * caller it's an AI (sentence editable) · the composed "Callers hear" line ·
 * a one-line silence recap · Hear the opening. The AI disclosure is composed
 * into the greeting because the Engine has no field for it.
 *
 * Owner (2026-09-15), two corrections:
 *  · CALLER-FIRST hides the fields it disables instead of greying them out
 *    with explanatory placeholder text. A row of dead controls carrying prose
 *    in the input reads as broken; one quiet sentence says the same thing.
 *  · Lines the agent SAYS are set apart from the interface's own words —
 *    typographic quotes and italics, everywhere one appears.
 */

/** What the agent says out loud, never confusable with UI copy. */
function Spoken({ children }: { children: React.ReactNode }) {
  return (
    <span className="italic">
      <span className="not-italic text-muted-foreground/70" aria-hidden>&ldquo;</span>
      {children}
      <span className="not-italic text-muted-foreground/70" aria-hidden>&rdquo;</span>
    </span>
  )
}

export function SectionOpening({
  draft,
  update,
  overridden,
  overrideFlag,
  onHearOpening,
  onChangeSilence,
}: {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
  overridden: boolean
  overrideFlag?: React.ReactNode
  /** Opens the test rail on Test Agent and starts the call. */
  onHearOpening?: () => void
  /** Jumps to the call rules (silence hang-up) in Deployment. */
  onChangeSilence?: () => void
}) {
  const o = openingOf(draft)
  const patch = (p: Partial<OpeningConfig>) => update({ opening: { ...o, ...p } })
  const callerFirst = o.speaksFirst === "caller"
  const hears = composeOpening(draft)
  const [editing, setEditing] = React.useState(false)
  // Absent = untouched → the defaults apply, so the recap never says "stays
  // quiet" for an agent that will in fact hang up after 120 s.
  const cb = draft.callBehavior ?? DEFAULT_CALL_BEHAVIOR
  const silenceLine = cb.silenceHangup
    ? `Hangs up after ${cb.silenceTimeoutSec}s of silence`
    : "Stays quiet if the caller goes silent"

  return (
    <div className="space-y-5">
      {overridden && overrideFlag}

      {/* Who speaks first — the switch the rest of this row depends on. */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="wz-opening-who" className="text-sm font-medium">Who speaks first</Label>
        <ToggleGroup
          id="wz-opening-who"
          type="single"
          variant="outline"
          size="sm"
          value={o.speaksFirst}
          onValueChange={(v) => v && patch({ speaksFirst: v as OpeningConfig["speaksFirst"] })}
          aria-label="Who speaks first"
        >
          <ToggleGroupItem value="agent" className="px-3 text-xs">Agent</ToggleGroupItem>
          <ToggleGroupItem value="caller" className="px-3 text-xs">Caller</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {callerFirst ? (
        /* Nothing to script: the agent answers whatever it hears. One line,
           no disabled fields (owner 2026-09-15). */
        <p className="text-sm text-muted-foreground">
          The agent waits and answers what it hears. Nothing is scripted for the first turn.
        </p>
      ) : (
        <>
          {/* Greeting */}
          <div className="space-y-1.5">
            <Label htmlFor="wz-greeting" className="text-sm font-medium" data-design-focus="greeting">Greeting</Label>
            <Textarea
              id="wz-greeting"
              value={draft.greeting}
              onChange={(e) => update({ greeting: e.target.value })}
              disabled={overridden}
              className={cn("min-h-[64px] text-sm italic", overridden && "border-warning/50 opacity-80")}
              placeholder="Hi, thanks for calling. How can I help you today?"
            />
          </div>

          {/* Interruptible */}
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="wz-opening-interrupt" className="text-sm font-medium">Callers can interrupt the greeting</Label>
            <Switch id="wz-opening-interrupt" checked={o.interruptible} onCheckedChange={(v) => patch({ interruptible: v })} disabled={overridden} />
          </div>

          {/* AI disclosure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="wz-opening-disclose" className="flex items-center gap-1.5 text-sm font-medium">
                Tell the caller it&apos;s an AI
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Why disclose">
                      <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64 text-xs">
                    Says the sentence before the greeting. Required in several regions (EU AI Act, Article 50): on by default is the compliant choice.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Switch id="wz-opening-disclose" checked={o.disclose} onCheckedChange={(v) => patch({ disclose: v })} disabled={overridden} />
            </div>
            {o.disclose && (
              <div className="flex items-center gap-2">
                {editing ? (
                  <Input
                    autoFocus
                    value={o.disclosure}
                    onChange={(e) => patch({ disclosure: e.target.value })}
                    onBlur={() => setEditing(false)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditing(false) }}
                    className="h-8 text-xs italic"
                    aria-label="Disclosure sentence"
                  />
                ) : (
                  <span className="text-xs text-foreground">
                    <Spoken>{o.disclosure || DEFAULT_DISCLOSURE}</Spoken>
                  </span>
                )}
                <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => setEditing((e) => !e)}>
                  {editing ? "Done" : "Edit"}
                </button>
                {o.disclosure !== DEFAULT_DISCLOSURE && (
                  <button type="button" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => patch({ disclosure: DEFAULT_DISCLOSURE })}>
                    Reset
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Callers hear: the composed line, read-only, in a field like
              Greeting; Hear the opening sits on the same line. */}
          <div className="space-y-1.5">
            <Label htmlFor="wz-opening-hears" className="text-sm font-medium">Callers hear</Label>
            <div className="flex items-start gap-2">
              <Textarea
                id="wz-opening-hears"
                readOnly
                rows={2}
                value={hears ? `“${hears}”` : ""}
                placeholder="Write a greeting above"
                aria-describedby="wz-opening-hears-hint"
                data-testid="wz-opening-callers-hear"
                className="min-h-[60px] flex-1 resize-none text-sm italic"
              />
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" onClick={onHearOpening} disabled={!hears}>
                <Play className="h-3.5 w-3.5" aria-hidden /> Hear the opening
              </Button>
            </div>
            <p id="wz-opening-hears-hint" className="text-xs text-muted-foreground">
              Read-only. The AI sentence and the greeting, in the order callers hear them.
            </p>
          </div>
        </>
      )}

      {/* Silence recap → call rules */}
      <p className="text-xs text-muted-foreground">
        {silenceLine}
        {onChangeSilence && (
          <button type="button" className="ml-2 font-medium text-foreground hover:underline" onClick={onChangeSilence}>Change</button>
        )}
      </p>
    </div>
  )
}
