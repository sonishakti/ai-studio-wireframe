"use client"

import * as React from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { extractVars, AGENT_TEMPLATES } from "@/lib/campaign-data"
import { SectionRow } from "@/components/wizard/section-row"
import type { StepProps } from "@/components/wizard/types"

/**
 * Section 2 — Agent Prompt (proposal 2639-102124, 2026-07-22): ONE row whose
 * LHS is the purpose blurb ("Decides your agent's core behaviour"); the RHS
 * stacks Template → System prompt (+ Rewrite Prompt) → Greeting Message →
 * Failure Message. The system prompt is the ONE behavior definition (the
 * Persona block stays dead, owner 2026-07-21).
 */
export function SectionPrompt({ draft, update }: StepProps) {
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)

  // Template choice seeds name/prompt/greeting like the ?template= deep link
  // does, but INLINE — and names the preview panel's identity badge.
  const templates = AGENT_TEMPLATES.filter((t) => t.id !== "blank")
  const selectedTemplate = templates.find((t) => t.name === draft.templateName)

  // Template-applied beat: the prompt editor flashes so the swap visibly
  // LANDS (reuses the wz-anchor-flash arrival idiom; keyed to replay).
  const [templateFlash, setTemplateFlash] = React.useState(0)

  const applyTemplate = (id: string) => {
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    setTemplateFlash((k) => k + 1)
    update({
      templateName: tpl.name,
      systemPrompt: `You are ${tpl.name}, a voice agent. ${tpl.description}.\n\nBe concise and helpful. Greet the caller, do your job, and escalate to a human if asked.`,
      greeting: draft.greeting.trim() ? draft.greeting : `Hi, thanks for calling. How can I help you today?`,
      failureMessage: draft.failureMessage.trim() ? draft.failureMessage : "Oops, I can't seem to answer that.",
    })
    toast(`${tpl.name} template applied`, { description: "The system prompt was replaced — edit it below." })
  }

  return (
    <SectionRow
      id="wz-2-prompt"
      label={<span className="text-sm font-normal text-muted-foreground">Decides your agent&apos;s core behaviour</span>}
    >
      {/* Template */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Choose an Agent Template</Label>
        <Select value={selectedTemplate?.id ?? ""} onValueChange={applyTemplate}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder={draft.templateName ?? "Pick a starting point"} />
          </SelectTrigger>
          <SelectContent>
            {templates.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

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
        {/* Variable chips: on Batch calls these are filled from the CSV
            uploaded in Channel — the dependency runs channel → prompt. */}
        {vars.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-xs text-muted-foreground">
              Variables detected{draft.type === "outbound" ? " (filled from your contacts CSV)" : ""}:
            </span>
            {vars.map((v) => (
              <Badge key={v} variant="secondary" className="h-6 px-2 font-mono text-xs">{`{{${v}}}`}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Greeting */}
      <div id="wz-2-greeting" className="scroll-mt-28 space-y-1.5">
        <Label htmlFor="wz-greeting" className="text-sm font-medium">Greeting Message</Label>
        <Textarea
          id="wz-greeting"
          value={draft.greeting}
          onChange={(e) => update({ greeting: e.target.value })}
          className="min-h-[64px] text-sm"
          placeholder={draft.type === "outbound"
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
