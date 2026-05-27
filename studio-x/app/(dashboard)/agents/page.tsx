"use client"

import * as React from "react"
import Link from "next/link"
import { Bot, Plus, Phone, Upload, Sparkles, Mic, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// ─── pre-built templates (matches Figma node 90:14575) ───────────────────────

type Template = {
  id: string
  name: string
  description: string
  llm: string
  asr: string
  tts: string
}

const TEMPLATES: Template[] = [
  {
    id: "appointment-reminder",
    name: "Appointment Reminder",
    description: "Automatically call customers to remind them of upcoming appointments",
    llm: "Open AI",
    asr: "DeepGram",
    tts: "ElevenLabs",
  },
  {
    id: "nps-survey",
    name: "NPS Survey",
    description: "Gather customer feedback through voice surveys",
    llm: "Open AI",
    asr: "DeepGram",
    tts: "ElevenLabs",
  },
  {
    id: "ivr",
    name: "Interactive Voice Response (IVR)",
    description: "Route callers to the right department automatically",
    llm: "Anthropic",
    asr: "DeepGram",
    tts: "ElevenLabs",
  },
  {
    id: "payment-reminder",
    name: "Payment Reminder",
    description: "Follow up with customers about pending payments",
    llm: "Open AI",
    asr: "DeepGram",
    tts: "ElevenLabs",
  },
  {
    id: "ecommerce",
    name: "Customer service for e-commerce",
    description: "Very short description here",
    llm: "Open AI",
    asr: "DeepGram",
    tts: "ElevenLabs",
  },
]

export default function AgentsPage() {
  const [selectedId, setSelectedId] = React.useState("appointment-reminder")
  const [isCalling, setIsCalling] = React.useState(false)
  const selected = TEMPLATES.find((t) => t.id === selectedId)!

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deploy your first AI agent in minutes"
        description="Import your agent OR start with a pre-built template"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-1.5">
              <Upload className="h-4 w-4" /> Import Agent
            </Button>
            <Button asChild>
              <Link href="/agents/new/edit">
                <Plus className="h-4 w-4" /> Deploy New Agent
              </Link>
            </Button>
          </div>
        }
      />

      <main className="flex-1 grid grid-cols-1 gap-6 p-6 lg:grid-cols-[1fr_360px] min-h-0">
        {/* ─── LEFT: template list ─────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Bot className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Pre-built by agora</span>
          </div>

          <div className="space-y-2">
            {TEMPLATES.map((tpl) => {
              const isSelected = selectedId === tpl.id
              return (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedId(tpl.id)}
                  className={cn(
                    "w-full rounded-lg border bg-card px-4 py-4 text-left transition-all",
                    isSelected
                      ? "border-primary/60 shadow-sm ring-1 ring-primary/30"
                      : "hover:border-foreground/20 hover:bg-accent/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                    </div>
                    {isSelected && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation()
                            setIsCalling(true)
                          }}
                        >
                          Test
                        </Button>
                        <Button size="sm" className="h-8 text-xs gap-1" asChild>
                          <Link
                            href={`/agents/${tpl.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            Deploy as new agent
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ─── RIGHT: playground ──────────────────────────────────── */}
        <aside className="rounded-lg border bg-card flex flex-col">
          {/* Selected agent chip */}
          <div className="flex items-center justify-center pt-6 pb-4">
            <Badge variant="outline" className="gap-1.5 px-3 py-1">
              <Sparkles className="h-3 w-3 text-primary" />
              {selected.name}
            </Badge>
          </div>

          {/* Microphone orb */}
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div
              className={cn(
                "relative w-36 h-36 rounded-full flex items-center justify-center transition-all",
                isCalling
                  ? "bg-gradient-to-br from-primary/40 via-primary/20 to-transparent shadow-[0_0_60px_-10px_hsl(var(--primary)/0.5)] animate-pulse"
                  : "bg-gradient-to-br from-zinc-300 via-zinc-200 to-zinc-100 dark:from-zinc-600 dark:via-zinc-700 dark:to-zinc-800 shadow-inner",
              )}
            >
              <div
                className={cn(
                  "w-24 h-24 rounded-full",
                  isCalling
                    ? "bg-gradient-to-br from-primary/80 to-primary/40"
                    : "bg-gradient-to-br from-zinc-400 to-zinc-600 dark:from-zinc-500 dark:to-zinc-700",
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              {isCalling ? "Agent Listening…" : "Agent Idle"}
            </p>
            <Button
              size="sm"
              className="mt-4 gap-1.5"
              onClick={() => setIsCalling((v) => !v)}
              variant={isCalling ? "destructive" : "default"}
            >
              <Phone className="h-3.5 w-3.5" />
              {isCalling ? "End Call" : "Start Call"}
            </Button>
          </div>

          <Separator />

          {/* Stats footer */}
          <div className="px-5 py-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">LLM</span>
              <span className="font-medium">{selected.llm}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ASR</span>
              <span className="font-medium">{selected.asr}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">TTS</span>
              <span className="font-medium">{selected.tts}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-wider">Average End-to-End Latency</span>
              <span className="font-medium tabular-nums">{isCalling ? "612 ms" : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase tracking-wider">Average LLM Time to First Token</span>
              <span className="font-medium tabular-nums">{isCalling ? "184 ms" : "—"}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
