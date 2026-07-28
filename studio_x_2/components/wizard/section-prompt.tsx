"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { extractVars } from "@/lib/campaign-data"
import { SectionRow } from "@/components/wizard/section-row"
import { hasChannel } from "@/lib/wizard-draft"
import type { StepProps } from "@/components/wizard/types"

/**
 * Context › Prompt (v4 IA, 2026-07-28): system prompt (+ Rewrite) → Greeting →
 * Failure Message. The TEMPLATE picker left this section — it lives in the
 * header as a chip next to the agent name (owner direction: "remove editing
 * the template from the agent prompt and move it to top near agent name").
 * `templateFlash` still lets the header apply visibly land here.
 */
export function SectionPrompt({
  draft,
  update,
  templateFlash = 0,
}: StepProps & {
  /** Bumped by the header's template menu when a template overwrites the
   *  prompt — flashes the editor so the swap visibly lands. */
  templateFlash?: number
}) {
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)
  const batch = hasChannel(draft, "batch")

  return (
    <SectionRow
      id="wz-3-prompt"
      label={<span className="text-sm font-normal text-muted-foreground">Decides your agent&apos;s core behaviour</span>}
    >
      {/* System prompt + Rewrite */}
      <div className="space-y-1.5">
        <Label htmlFor="wz-prompt" className="text-sm font-medium">System prompt</Label>
        <div key={templateFlash} className={templateFlash > 0 ? "wz-anchor-flash relative" : "relative"}>
          <Textarea
            id="wz-prompt"
            value={draft.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value })}
            className="min-h-[220px] pb-12 font-mono text-sm leading-relaxed"
            placeholder={"You are a helpful voice agent for Acme.\nBe concise. Greet the caller, resolve their request, and escalate to a human if asked.\nUse {{name}} and {{account}} when available."}
          />
          {/* Rewrite Prompt (proposal) — same simulated-disclosure idiom as
              voice previews: no model runs in this wireframe. */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="sx-sparkle-hover absolute bottom-2.5 right-2.5 gap-1.5"
            onClick={() => toast("Simulated preview", { description: "No model runs in this wireframe — Rewrite Prompt would polish your prompt here." })}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden /> Rewrite Prompt
          </Button>
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
      </div>

      {/* Greeting */}
      <div id="wz-3-greeting" className="scroll-mt-28 space-y-1.5">
        <Label htmlFor="wz-greeting" className="text-sm font-medium">Greeting Message</Label>
        <Textarea
          id="wz-greeting"
          value={draft.greeting}
          onChange={(e) => update({ greeting: e.target.value })}
          className="min-h-[64px] text-sm"
          placeholder={batch
            ? "Hey {{name}}, I'm calling from Acme about your account…"
            : "Hi, thanks for calling. How can I help you today?"}
        />
      </div>

      {/* Failure message (proposal — new field). */}
      <div className="space-y-1.5">
        <Label htmlFor="wz-failure" className="text-sm font-medium">Failure Message</Label>
        <Textarea
          id="wz-failure"
          value={draft.failureMessage}
          onChange={(e) => update({ failureMessage: e.target.value })}
          className="min-h-[64px] text-sm"
          placeholder="Oops, I can't seem to answer that."
        />
        {/* When it plays — the field arrived with no trigger doc (journey
            test 2026-07-22 D1: "when does that play?"). */}
        <p className="text-xs text-muted-foreground">
          Played when the agent can&apos;t respond — a model error, tool timeout, or dropped connection.
        </p>
      </div>
    </SectionRow>
  )
}
