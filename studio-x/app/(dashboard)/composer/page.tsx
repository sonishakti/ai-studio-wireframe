"use client"

import * as React from "react"
import Link from "next/link"
import {
  Bot,
  Sparkles,
  ArrowRight,
  PanelRightClose,
  PanelRightOpen,
  Phone,
  MessageCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ComposerChat } from "@/components/composer-chat"
import { AgentSphere } from "@/components/agent-test-panel"

export default function ComposerPage() {
  const [showDraft, setShowDraft] = React.useState(true)
  // The rail only populates once Composer actually proposes a draft. Until then
  // it shows a first-run empty state instead of a fabricated "Support Bot".
  const [hasDraft, setHasDraft] = React.useState(false)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-1 min-h-0">
        {/* Main: chat */}
        <div className="flex-1 min-w-0">
          <ComposerChat title="Composer" onDraftUpdate={() => setHasDraft(true)} />
        </div>

        {/* Right rail: live agent draft preview */}
        {showDraft && (
          <AgentDraftRail
            hasDraft={hasDraft}
            onClose={() => setShowDraft(false)}
            onDiscard={() => {
              setHasDraft(false)
              toast.success("Draft discarded")
            }}
          />
        )}

        {/* Re-open button when collapsed */}
        {!showDraft && (
          <Button
            variant="outline"
            size="icon"
            className="m-3 h-8 w-8 self-start"
            onClick={() => setShowDraft(true)}
            aria-label="Show draft preview"
            title="Show draft"
          >
            <PanelRightOpen className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Agent draft rail ────────────────────────────────────────────────────────

function AgentDraftRail({
  hasDraft,
  onClose,
  onDiscard,
}: {
  hasDraft: boolean
  onClose: () => void
  onDiscard: () => void
}) {
  return (
    <aside className="hidden lg:flex flex-col w-[360px] shrink-0 border-l border-border bg-card/30 min-h-0">
      <header className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="h-4 w-4 text-muted-foreground shrink-0" />
          <h2 className="text-sm font-semibold truncate">Draft preview</h2>
          {hasDraft && (
            <Badge variant="outline" className="text-xs">
              Unsaved
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClose}
          aria-label="Hide draft preview"
          title="Hide draft"
        >
          <PanelRightClose className="h-3.5 w-3.5" />
        </Button>
      </header>

      {!hasDraft ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-8 min-h-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted mb-3">
            <Bot className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No draft yet</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
            Your agent draft will appear here as you describe it to Composer.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
            {/* Visualization */}
            <div className="flex flex-col items-center gap-3 py-2">
              <Badge variant="secondary" className="text-xs">
                Support Bot (draft)
              </Badge>
              <AgentSphere size={72} />
              <p className="text-xs text-muted-foreground">Composer is shaping the agent…</p>
            </div>

            {/* Stat rows */}
            <Section title="Identity">
              <Row label="Name" value="Support Bot" />
              <Row label="Role" value="E-commerce support" />
              <Row label="Voice" value="ElevenLabs · Rachel" />
            </Section>

            <Section title="Models">
              <Row label="LLM" value="gpt-4o" />
              <Row label="ASR" value="DeepGram streaming" />
              <Row label="TTS" value="ElevenLabs" />
            </Section>

            <Section title="Tools">
              <ToolRow icon={Phone} label="Lookup order by phone" status="enabled" />
              <ToolRow icon={MessageCircle} label="Send SMS receipt" status="enabled" />
              <ToolRow icon={Bot} label="Transfer to human" status="pending" />
            </Section>

            <Section title="Guardrails">
              <Row label="Max response" value="50 words" />
              <Row label="Never reveal" value="AI status" />
              <Row label="Failure msg" value="Please hold on a second." mono />
            </Section>
          </div>

          <footer className="border-t border-border px-4 py-3 shrink-0 space-y-2">
            <Button className="w-full gap-1.5" size="sm" asChild>
              <Link href="/agents/new/edit">
                <Sparkles className="h-3.5 w-3.5" /> Open in editor <ArrowRight className="h-3.5 w-3.5 ml-auto" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={onDiscard}
            >
              Discard draft
            </Button>
          </footer>
        </>
      )}
    </aside>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-xs text-right break-words", mono && "font-mono")}>{value}</span>
    </div>
  )
}

function ToolRow({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  status: "enabled" | "pending"
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs flex-1 truncate">{label}</span>
      <Badge
        variant={status === "enabled" ? "default" : "outline"}
        className="text-xs px-1.5 py-0"
      >
        {status === "enabled" ? "On" : "…"}
      </Badge>
    </div>
  )
}
