"use client"

import * as React from "react"
import { BookOpen, Plug, Plus, X, Check, Play, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet"
import { KNOWLEDGE_BASES, MCP_SERVERS, extractVars } from "@/lib/campaign-data"
import type { StepProps } from "@/components/wizard/types"

/**
 * Step 3 — System prompt. The behavioral core: the prompt + the greeting it
 * opens with, plus optional Knowledge bases and MCP connectors attached inline
 * (a Sheet — "manage in Resources" without navigating away). Autosave kicks in
 * from here (the host debounces the whole draft).
 */
export function StepBuild({ draft, update }: StepProps) {
  const vars = extractVars(`${draft.systemPrompt} ${draft.greeting}`)

  return (
    <div className="space-y-5">
      {/* No inner h2: the section header above already names this step. */}
      <p className="text-sm text-muted-foreground">
        Tell {draft.name || "your agent"} how to behave and give it knowledge and connectors. Saves automatically as you type.
      </p>

      {/* Prompt owns the left column at xl; greeting + tools + test dock right
          (width-discipline: structure on big screens, one column on small). */}
      <div className="grid gap-x-10 gap-y-5 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="min-w-0 space-y-2">
          <Label htmlFor="wz-prompt" className="text-sm font-medium">System prompt</Label>
          <Textarea
            id="wz-prompt"
            value={draft.systemPrompt}
            onChange={(e) => update({ systemPrompt: e.target.value })}
            className="min-h-[180px] font-mono text-sm leading-relaxed xl:min-h-[260px]"
            placeholder={"You are a helpful voice agent for Acme.\nBe concise. Greet the caller, resolve their request, and escalate to a human if asked.\nUse {{name}} and {{account}} when available."}
          />
          <p className="text-xs text-muted-foreground">
            Wrap dynamic values in <code className="font-mono">{"{{double_braces}}"}</code>. For Batch calls, they map to your CSV columns.
          </p>
          {vars.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-xs text-muted-foreground">Variables detected:</span>
              {vars.map((v) => (
                <Badge key={v} variant="secondary" className="h-6 px-2 font-mono text-xs">{`{{${v}}}`}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="wz-greeting" className="text-sm font-medium">Greeting</Label>
            <Textarea
              id="wz-greeting"
              value={draft.greeting}
              onChange={(e) => update({ greeting: e.target.value })}
              className="min-h-[72px] text-sm"
              placeholder="The first line your agent speaks, e.g. Hi, thanks for calling Acme, how can I help?"
            />
          </div>

          <div className="grid gap-4">
            <AttachField
              icon={BookOpen}
              title="Knowledge base"
              description="Ground answers in your docs."
              items={KNOWLEDGE_BASES.map((k) => ({ id: k.id, name: k.name, meta: k.status === "ready" ? `${k.chunks} chunks` : "Indexing…" }))}
              selectedIds={draft.knowledge}
              onChange={(knowledge) => update({ knowledge })}
              manageLabel="Add knowledge base"
            />
            <AttachField
              icon={Plug}
              title="MCP connector"
              description="Give it tools: CRM, calendar, APIs."
              items={MCP_SERVERS.map((m) => ({ id: m.id, name: m.name, meta: `${m.tools} tools` }))}
              selectedIds={draft.mcp}
              onChange={(mcp) => update({ mcp })}
              manageLabel="Add MCP connector"
            />
          </div>

          <QuickTest name={draft.name} greeting={draft.greeting} />
        </div>
      </div>
    </div>
  )
}

// ─── Quick test — hear the opening + a sample reply without leaving the step ───

function QuickTest({ name, greeting }: { name: string; greeting: string }) {
  const [ran, setRan] = React.useState(false)
  const agent = name || "Your agent"
  const opener = greeting.trim() || "Hi, thanks for reaching out. How can I help?"
  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Quick test</p>
          <p className="text-xs text-muted-foreground">Hear how it opens and a sample reply.</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={() => setRan(true)}>
          <Play className="h-3.5 w-3.5" /> {ran ? "Run again" : "Run a sample turn"}
        </Button>
      </div>
      {ran && (
        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
          <Turn who={agent} text={opener} agent />
          <Turn who="Caller" text="Do you have any availability tomorrow?" />
          <Turn who={agent} text="Let me check that for you. What time of day works best?" agent />
          <p className="pt-1 text-xs text-muted-foreground">Full voice test: use &ldquo;Talk to your agent&rdquo; in the sidebar.</p>
        </div>
      )}
    </section>
  )
}

function Turn({ who, text, agent = false }: { who: string; text: string; agent?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full", agent ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
        <MessageSquare className="h-3 w-3" />
      </span>
      <p className="text-xs leading-relaxed"><span className="font-medium">{who}:</span> <span className="text-muted-foreground">{text}</span></p>
    </div>
  )
}

// ─── Attach field — chips + a Sheet checklist (no nav-away) ────────────────────

interface AttachItem { id: string; name: string; meta: string }

function AttachField({
  icon: Icon,
  title,
  description,
  items,
  selectedIds,
  onChange,
  manageLabel,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  items: AttachItem[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  manageLabel: string
}) {
  const selected = items.filter((i) => selectedIds.includes(i.id))
  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])

  return (
    <section className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((i) => (
            <Badge key={i.id} variant="secondary" className="gap-1 pr-1 font-normal">
              {i.name}
              <button
                type="button"
                onClick={() => toggle(i.id)}
                aria-label={`Remove ${i.name}`}
                className="rounded-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="w-full gap-1.5">
            <Plus className="h-3.5 w-3.5" /> {manageLabel}
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>
              Attach to this agent. Manage the full library in Resources.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-4 pb-4">
            {items.map((i) => {
              const on = selectedIds.includes(i.id)
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => toggle(i.id)}
                  aria-pressed={on}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
                    on ? "border-primary bg-primary/5" : "border-border hover:bg-accent/40",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    <p className="text-xs text-muted-foreground">{i.meta}</p>
                  </div>
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-border",
                    )}
                  >
                    {on && <Check className="h-3 w-3" />}
                  </span>
                </button>
              )
            })}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}
