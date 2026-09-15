"use client"

import * as React from "react"
import { AudioLines, CircleHelp, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { openAdvanced } from "@/components/wizard/advanced-settings-sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DEFAULT_DISCLOSURE, composeOpening, openingOf, type AgentDraft, type OpeningConfig,
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
}: {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
  overridden: boolean
  overrideFlag?: React.ReactNode
  /** Opens the test rail on Test Agent and starts the call. */
  onHearOpening?: () => void
}) {
  const o = openingOf(draft)
  const patch = (p: Partial<OpeningConfig>) => update({ opening: { ...o, ...p } })
  const callerFirst = o.speaksFirst === "caller"
  const hears = composeOpening(draft)

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
                    The agent says this before the greeting, so callers know they are speaking to a machine. Several countries require it.
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Switch id="wz-opening-disclose" checked={o.disclose} onCheckedChange={(v) => patch({ disclose: v })} disabled={overridden} />
            </div>
            {o.disclose && (
              <div className="space-y-1.5">
                <Label htmlFor="wz-opening-disclosure" className="text-sm font-medium">Disclosure sentence</Label>
                <Input
                  id="wz-opening-disclosure"
                  value={o.disclosure}
                  onChange={(e) => patch({ disclosure: e.target.value })}
                  placeholder={DEFAULT_DISCLOSURE}
                  disabled={overridden}
                  className="text-sm italic"
                />
                {o.disclosure !== DEFAULT_DISCLOSURE && (
                  <button
                    type="button"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                    onClick={() => patch({ disclosure: DEFAULT_DISCLOSURE })}
                  >
                    Reset to the default
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Not a field. It looked like one, so people tried to type in it
              (owner 2026-09-15): it is the composed line, shown as a line. */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium" id="wz-opening-hears-label">Callers hear</Label>
            <div className="flex items-start gap-2">
              <p
                id="wz-opening-hears"
                aria-labelledby="wz-opening-hears-label"
                data-testid="wz-opening-callers-hear"
                className="min-h-[44px] flex-1 rounded-md bg-muted/40 px-3 py-2.5 text-sm leading-relaxed"
              >
                {hears ? <Spoken>{hears}</Spoken> : <span className="text-muted-foreground">Write a greeting above</span>}
              </p>
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" onClick={onHearOpening} disabled={!hears}>
                <AudioLines className="h-3.5 w-3.5" aria-hidden /> Hear the opening
              </Button>
            </div>
          </div>
        </>
      )}

      {/* What happens when nobody speaks is a CALL rule, not an opening one.
          It sat here as a stray recap line (owner 2026-09-15); the door goes
          to the same advanced panel every other section uses. */}
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={() => openAdvanced("call")}>
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden /> Advanced settings
      </Button>
    </div>
  )
}
