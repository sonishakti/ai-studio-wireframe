"use client"

import * as React from "react"
import {
  Sparkles,
  Send,
  Paperclip,
  Mic,
  Bot,
  User,
  Wand2,
  Wrench,
  Bug,
  Plus,
  History,
  X,
  AudioLines,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ComposerVoiceCall, type VoiceTurn } from "@/components/composer-voice-call"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  /** Optional follow-up action chips on assistant messages. */
  actions?: Array<{ label: string; onClick?: () => void }>
  /** Optional code/config block shown beneath the message. */
  code?: { language: string; body: string }
  /** Display timestamp. */
  at?: string
}

// ─── Quick-start prompts ─────────────────────────────────────────────────────

const QUICK_STARTS = [
  {
    icon: Wand2,
    label: "Build an agent",
    prompt: "Help me build a customer support voice agent for an e-commerce store.",
  },
  {
    icon: Wrench,
    label: "Set up telephony",
    prompt: "Walk me through buying a phone number and connecting it to my inbound campaign.",
  },
  {
    icon: Bug,
    label: "Debug latency",
    prompt: "My Sales Qualifier agent has 1.4s first-token latency. Help me diagnose it.",
  },
  {
    icon: Sparkles,
    label: "Improve prompt",
    prompt: "Review my agent's system prompt and suggest improvements.",
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

interface ComposerChatProps {
  /** Pre-seeded conversation, or empty for blank slate. */
  initialMessages?: ChatMessage[]
  /** Render in compact mode (used inside slide-over panel). */
  compact?: boolean
  /** Render the close X (used in slide-over). */
  onClose?: () => void
  /** Title shown in header. Defaults to "Composer". */
  title?: string
  /** Context chip shown next to title (e.g., page name when used as panel). */
  contextChip?: string
  className?: string
}

export function ComposerChat({
  initialMessages = SEED_MESSAGES,
  compact = false,
  onClose,
  title = "Composer",
  contextChip,
  className,
}: ComposerChatProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const [mode, setMode] = React.useState<"text" | "voice">("text")
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const enterVoice = () => setMode("voice")

  const exitVoice = (turns: VoiceTurn[], reason: "ended" | "text") => {
    setMode("text")
    if (turns.length > 0) {
      setMessages((prev) => [
        ...prev,
        ...turns.map((t) => ({
          id: t.id,
          role: (t.role === "you" ? "user" : "assistant") as ChatRole,
          text: t.text,
          at: "from voice",
        })),
      ])
    }
    toast.success(
      reason === "ended" ? "Voice session ended" : "Switched to text",
      { description: turns.length > 0 ? "Transcript saved to the chat." : undefined },
    )
  }

  // Auto-scroll on new messages
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isThinking])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const userMsg: ChatMessage = {
      id: `m_${Date.now()}_u`,
      role: "user",
      text: trimmed,
      at: "just now",
    }
    setMessages((prev) => [...prev, userMsg])
    setDraft("")
    setIsThinking(true)

    // Simulated assistant reply (wireframe — no real AI wiring)
    window.setTimeout(() => {
      const reply: ChatMessage = {
        id: `m_${Date.now()}_a`,
        role: "assistant",
        text: assistantReplyFor(trimmed),
        actions: assistantActionsFor(trimmed),
        at: "just now",
      }
      setMessages((prev) => [...prev, reply])
      setIsThinking(false)
    }, 700)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }

  const hasConversation = messages.length > 0

  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold truncate">{title}</h1>
            {contextChip && (
              <Badge variant="outline" className="text-xs">
                {contextChip}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Build, configure, and debug agents by chatting.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            setMessages([])
            toast.success("New chat")
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="History">
          <History className="h-3.5 w-3.5" />
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </header>

      {mode === "voice" ? (
        <ComposerVoiceCall compact={compact} onExit={exitVoice} />
      ) : (
      <>
      {/* Messages / empty state */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 min-h-0">
        {!hasConversation ? (
          <EmptyState compact={compact} onPick={(p) => send(p)} onStartVoice={enterVoice} />
        ) : (
          <div className={cn("mx-auto space-y-5", compact ? "max-w-none" : "max-w-2xl")}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} compact={compact} />
            ))}
            {isThinking && <ThinkingIndicator />}
          </div>
        )}
      </div>

      {/* Input area */}
      <footer className="border-t border-border px-4 py-3 shrink-0">
        <div className={cn("mx-auto", compact ? "max-w-none" : "max-w-2xl")}>
          {/* Quick-action chips (only when conversation has started) */}
          {hasConversation && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <QuickChip onClick={() => send("Show this in the agent editor.")}>
                Open editor
              </QuickChip>
              <QuickChip onClick={() => send("Save this as a campaign draft.")}>
                Save as campaign
              </QuickChip>
              <QuickChip onClick={() => send("Run a test call.")}>
                Test call
              </QuickChip>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card focus-within:ring-2 focus-within:ring-ring/40 transition-shadow">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Composer to build, configure, or debug…"
              rows={2}
              className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" title="Attach">
                  <Paperclip className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Talk to Composer"
                  onClick={enterVoice}
                >
                  <Mic className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  <kbd className="font-mono">↵</kbd> send · <kbd className="font-mono">⇧↵</kbd> newline
                </p>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  disabled={!draft.trim()}
                  onClick={() => send(draft)}
                >
                  Send <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </>
      )}
    </div>
  )
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function EmptyState({
  compact,
  onPick,
  onStartVoice,
}: {
  compact: boolean
  onPick: (prompt: string) => void
  onStartVoice: () => void
}) {
  return (
    <div
      className={cn(
        "mx-auto h-full flex flex-col items-center justify-center text-center py-6",
        compact ? "max-w-none" : "max-w-2xl",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">What are we building?</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Describe an agent in plain English, talk it through, or pick a quick start.
      </p>

      {/* Talk-to-Composer CTA — voice-first entry */}
      <button
        onClick={onStartVoice}
        className="group mt-5 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/5 pl-2 pr-4 py-2 hover:bg-primary/10 hover:border-primary/50 transition-colors"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <AudioLines className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium">Talk to Composer</span>
        <span className="text-xs text-muted-foreground">build by voice</span>
      </button>

      <div className="flex items-center gap-3 my-5 w-full max-w-xs">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or type</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
        {QUICK_STARTS.map((q) => {
          const Icon = q.icon
          return (
            <button
              key={q.label}
              onClick={() => onPick(q.prompt)}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <Icon className="h-3.5 w-3.5 text-foreground" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-medium">{q.label}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{q.prompt}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MessageBubble({ message, compact }: { message: ChatMessage; compact: boolean }) {
  const isUser = message.role === "user"
  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
          isUser ? "bg-muted" : "bg-primary/10",
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Bot className="h-3.5 w-3.5 text-primary" />
        )}
      </div>
      <div
        className={cn(
          "flex flex-col gap-1.5 min-w-0",
          isUser ? "items-end" : "items-start",
          compact ? "max-w-[calc(100%-3rem)]" : "max-w-[85%]",
        )}
      >
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {message.text}
        </div>
        {message.code && (
          <pre className="w-full rounded-md border border-border bg-card p-3 text-xs font-mono overflow-x-auto">
            {message.code.body}
          </pre>
        )}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {message.actions.map((a) => (
              <QuickChip key={a.label} onClick={a.onClick}>
                {a.label}
              </QuickChip>
            ))}
          </div>
        )}
        {message.at && (
          <p className="text-xs text-muted-foreground tabular-nums">{message.at}</p>
        )}
      </div>
    </div>
  )
}

function ThinkingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="rounded-lg bg-muted px-3 py-2 flex items-center gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </div>
    </div>
  )
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  )
}

function QuickChip({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
    >
      {children}
    </button>
  )
}

// ─── Seed messages + canned replies (wireframe demo) ─────────────────────────

const SEED_MESSAGES: ChatMessage[] = []

function assistantReplyFor(prompt: string): string {
  const lower = prompt.toLowerCase()
  if (lower.includes("latency")) {
    return "First-token latency above 1s usually means ASR streaming isn't enabled or the LLM model is too large. Check the Models tab — switch DeepGram to streaming mode, and try gpt-4o-mini for faster TTFT. I can open the agent editor at that tab if you'd like."
  }
  if (lower.includes("phone number") || lower.includes("telephony")) {
    return "Got it. To connect a number to an inbound campaign: 1) Go to Phone Numbers → Buy number, pick a region. 2) Create or open the campaign, add the Telephony channel. 3) Pick your agent. Want me to draft the campaign for you?"
  }
  if (lower.includes("prompt")) {
    return "Strong system prompts have four parts: ROLE, GOAL, CONSTRAINTS, and FAILURE FALLBACK. Want me to refactor your current prompt into that structure?"
  }
  if (lower.includes("support") || lower.includes("agent")) {
    return "I'll draft a customer-support voice agent. Defaults: gpt-4o + DeepGram streaming + ElevenLabs voice. The system prompt will cover order lookup, returns, and escalation. Confirm or tweak the defaults and I'll open it in the editor."
  }
  return "Got it. Tell me more about what should change, or pick a quick action below to take this somewhere."
}

function assistantActionsFor(prompt: string): ChatMessage["actions"] {
  const lower = prompt.toLowerCase()
  if (lower.includes("latency")) {
    return [
      { label: "Open Monitor", onClick: () => toast.info("Mock: would navigate to /monitor") },
      { label: "Open agent editor", onClick: () => toast.info("Mock: would open editor on Models tab") },
    ]
  }
  if (lower.includes("phone number") || lower.includes("telephony")) {
    return [
      { label: "Draft campaign", onClick: () => toast.info("Mock: would prefill /campaigns/new") },
      { label: "Browse numbers", onClick: () => toast.info("Mock: would navigate to /campaigns/phone-numbers") },
    ]
  }
  if (lower.includes("support") || lower.includes("agent")) {
    return [
      { label: "Open in editor", onClick: () => toast.info("Mock: would open /agents/draft/edit") },
      { label: "Change defaults", onClick: () => toast.info("Mock: would open model picker") },
    ]
  }
  return undefined
}
