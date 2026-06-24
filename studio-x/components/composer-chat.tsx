"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
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
  FileText,
  AlertCircle,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { track, Events } from "@/lib/analytics"
import { useVoiceSession, VoiceCallDock } from "@/components/composer-voice-call"

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant"

export interface ChatMessage {
  id: string
  role: ChatRole
  text: string
  actions?: Array<{ label: string; onClick?: () => void }>
  code?: { language: string; body: string }
  /** Attached file (wireframe — name + kind only). */
  attachment?: { name: string }
  /** How this message was entered. */
  via?: "voice" | "text"
  at?: string
  /** Assistant turn failed — render the error/retry treatment. */
  error?: boolean
}

// ─── Quick-start prompts ─────────────────────────────────────────────────────

const QUICK_STARTS = [
  { icon: Wand2, label: "Build an agent", prompt: "Help me build a customer support voice agent for an e-commerce store." },
  { icon: Wrench, label: "Set up telephony", prompt: "Walk me through buying a phone number and connecting it to my inbound campaign." },
  { icon: Bug, label: "Debug latency", prompt: "My Sales Qualifier agent has 1.4s first-token latency. Help me diagnose it." },
  { icon: Sparkles, label: "Improve prompt", prompt: "Review my agent's system prompt and suggest improvements." },
]

const ATTACH_FILES = ["support-faq.pdf", "product-catalog.csv", "returns-policy.docx", "brand-voice.md"]

// ─── Component ───────────────────────────────────────────────────────────────

interface ComposerChatProps {
  initialMessages?: ChatMessage[]
  compact?: boolean
  onClose?: () => void
  title?: string
  contextChip?: string
  /** Notified when the assistant updates the agent draft (voice or text). */
  onDraftUpdate?: (note: string) => void
  className?: string
}

export function ComposerChat({
  initialMessages = [],
  compact = false,
  onClose,
  title = "Composer",
  contextChip,
  onDraftUpdate,
  className,
}: ComposerChatProps) {
  const router = useRouter()
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = React.useState("")
  const [isThinking, setIsThinking] = React.useState(false)
  const attachIdx = React.useRef(0)
  const failNext = React.useRef(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const pushMessage = React.useCallback((role: ChatRole, text: string) => {
    setMessages((prev) => [...prev, { id: `m_${Date.now()}_${prev.length}`, role, text, via: "voice", at: "voice" }])
  }, [])

  // Voice session streams spoken turns directly into this same thread.
  const voice = useVoiceSession({ onMessage: pushMessage, onDraftUpdate })

  // Auto-scroll on new messages / streaming
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, isThinking, voice.livePartial])

  // Resolve an assistant turn for a prompt — succeeds, or fails into an
  // error bubble carrying a Retry action so the unhappy path has a real design.
  const resolveAssistantTurn = React.useCallback(
    (prompt: string) => {
      setIsThinking(true)
      window.setTimeout(() => {
        const willFail = failNext.current
        failNext.current = false
        setMessages((prev) =>
          willFail
            ? [
                ...prev,
                {
                  id: `m_${Date.now()}_e`,
                  role: "assistant",
                  text: "Couldn't reach Composer just now. Check your connection and try again.",
                  error: true,
                  actions: [{ label: "Retry", onClick: () => resolveAssistantTurn(prompt) }],
                  via: "text",
                  at: "just now",
                },
              ]
            : [
                ...prev,
                {
                  id: `m_${Date.now()}_a`,
                  role: "assistant",
                  text: assistantReplyFor(prompt),
                  actions: assistantActionsFor(prompt, router),
                  via: "text",
                  at: "just now",
                },
              ],
        )
        setIsThinking(false)
      }, 700)
    },
    [router],
  )

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    // Wireframe: the first "Retry" after a failure succeeds; a prompt mentioning
    // offline/error/timeout exercises the failure path so it stays reviewable.
    failNext.current = /\b(offline|timeout|error|fail)\b/i.test(trimmed)
    setMessages((prev) => [...prev, { id: `m_${Date.now()}_u`, role: "user", text: trimmed, via: "text", at: "just now" }])
    setDraft("")
    resolveAssistantTurn(trimmed)
  }

  const attachDoc = () => {
    const name = ATTACH_FILES[attachIdx.current % ATTACH_FILES.length]
    attachIdx.current += 1
    setMessages((prev) => [
      ...prev,
      { id: `m_${Date.now()}_f`, role: "user", text: "", attachment: { name }, via: voice.active ? "voice" : "text", at: "just now" },
    ])
    track(Events.composer_doc_attached, { name, during_call: voice.active })

    if (voice.active) {
      // Composer acknowledges by voice, streamed into the thread.
      window.setTimeout(() => voice.say(`Got it — I'll use ${name} as context while we build.`), 400)
    } else {
      setIsThinking(true)
      window.setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: `m_${Date.now()}_a`, role: "assistant", text: `Thanks — I've added ${name} as context. What should I do with it?`, via: "text", at: "just now" },
        ])
        setIsThinking(false)
      }, 700)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(draft)
    }
  }

  const hasConversation = messages.length > 0
  const onCall = voice.phase !== "idle"

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
            {contextChip && <Badge variant="outline" className="text-xs">{contextChip}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            Build, configure, and debug agents — by chat or voice.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => {
            if (onCall) voice.end()
            setMessages([])
            toast.success("New chat")
          }}
        >
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Chat history"
          title="History"
          onClick={() => toast.info("Mock: would open chat history")}
        >
          <History className="h-3.5 w-3.5" />
        </Button>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} aria-label="Close Composer" title="Close">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </header>

      {/* Call dock — slim, persistent; chat stays visible below */}
      {onCall && <VoiceCallDock session={voice} compact={compact} />}

      {/* Messages / empty state — ALWAYS visible */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 min-h-0">
        {!hasConversation && !onCall ? (
          <EmptyState compact={compact} onPick={(p) => send(p)} onStartVoice={voice.start} />
        ) : (
          <div className={cn("mx-auto space-y-5", compact ? "max-w-none" : "max-w-2xl")}>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} compact={compact} />
            ))}
            {/* Live streamed Composer caption (voice) */}
            {voice.livePartial && voice.captionsOn && (
              <StreamingBubble text={voice.livePartial} compact={compact} />
            )}
            {/* Thinking — text path, or voice composer turn with no caption yet */}
            {(isThinking || (voice.turn === "composer" && !voice.livePartial)) && <ThinkingIndicator />}
          </div>
        )}
      </div>

      {/* Input — ALWAYS available (type or attach, even mid-call) */}
      <footer className="border-t border-border px-4 py-3 shrink-0">
        <div className={cn("mx-auto", compact ? "max-w-none" : "max-w-2xl")}>
          {hasConversation && !onCall && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <QuickChip onClick={() => send("Open this in the agent editor.")}>Open editor</QuickChip>
              <QuickChip onClick={() => send("Save this as a campaign draft.")}>Save as campaign</QuickChip>
              <QuickChip onClick={() => send("Run a test call.")}>Test call</QuickChip>
            </div>
          )}

          <div className="rounded-lg border border-border bg-card focus-within:ring-2 focus-within:ring-ring/40 transition-shadow">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={onCall ? "Type to add context while you talk…" : "Ask Composer to build, configure, or debug…"}
              rows={2}
              className="border-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-sm"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Attach a document" title="Attach a document" onClick={attachDoc}>
                  <Paperclip className="h-3.5 w-3.5" />
                </Button>
                {/* Mic starts voice when idle; the dock owns talk during a call */}
                {!onCall && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Talk to Composer" title="Talk to Composer" onClick={voice.start}>
                    <Mic className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onCall && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    On call
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground hidden sm:block">
                  <kbd className="font-mono">↵</kbd> send · <kbd className="font-mono">⇧↵</kbd> newline
                </p>
                <Button size="sm" className="h-7 gap-1.5 text-xs" disabled={!draft.trim()} onClick={() => send(draft)}>
                  Send <Send className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </footer>
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
    <div className={cn("mx-auto h-full flex flex-col items-center justify-center text-center py-6", compact ? "max-w-none" : "max-w-2xl")}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-4">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h2 className="text-lg font-semibold tracking-tight">What are we building?</h2>
      <p className="text-sm text-muted-foreground mt-1 max-w-md">
        Describe an agent, talk it through, or attach a doc to start from.
      </p>

      {/* Single voice-first CTA — same action as the input mic */}
      <button
        type="button"
        onClick={onStartVoice}
        className="group mt-5 inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/5 pl-2 pr-4 py-2 hover:bg-primary/10 hover:border-primary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
              type="button"
              onClick={() => onPick(q.prompt)}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
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
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-md", isUser ? "bg-muted" : "bg-primary/10")}>
        {isUser ? <User className="h-3.5 w-3.5 text-muted-foreground" /> : <Bot className="h-3.5 w-3.5 text-primary" />}
      </div>
      <div className={cn("flex flex-col gap-1.5 min-w-0", isUser ? "items-end" : "items-start", compact ? "max-w-[calc(100%-3rem)]" : "max-w-[85%]")}>
        {message.attachment && (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{message.attachment.name}</p>
              <p className="text-xs text-muted-foreground">Attached</p>
            </div>
          </div>
        )}
        {message.text && (
          <div
            className={cn(
              "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words",
              message.error
                ? "flex items-start gap-2 border border-destructive/40 bg-destructive/10 text-foreground"
                : isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
            )}
          >
            {message.error && <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" aria-hidden />}
            <span>{message.text}</span>
          </div>
        )}
        {message.code && (
          <pre className="w-full rounded-md border border-border bg-card p-3 text-xs font-mono overflow-x-auto">{message.code.body}</pre>
        )}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {message.actions.map((a) => (
              <QuickChip key={a.label} onClick={a.onClick}>
                {a.label === "Retry" && <RotateCcw className="h-3 w-3" />}
                {a.label}
              </QuickChip>
            ))}
          </div>
        )}
        {message.at && (
          <p className="text-xs text-muted-foreground tabular-nums inline-flex items-center gap-1">
            {message.via === "voice" && <Mic className="h-2.5 w-2.5" />}
            {message.at}
          </p>
        )}
      </div>
    </div>
  )
}

function StreamingBubble({ text, compact }: { text: string; compact: boolean }) {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Bot className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className={cn("flex flex-col gap-1.5 min-w-0 items-start", compact ? "max-w-[calc(100%-3rem)]" : "max-w-[85%]")}>
        <div className="rounded-lg px-3 py-2 text-sm bg-muted text-foreground whitespace-pre-wrap break-words">
          {text}
          <span className="inline-block w-1.5 h-4 -mb-0.5 ml-0.5 bg-primary animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Mic className="h-2.5 w-2.5" /> speaking…
        </p>
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
  return <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-pulse" style={{ animationDelay: `${delay}ms` }} />
}

function QuickChip({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      {children}
    </button>
  )
}

// ─── Canned replies (wireframe demo) ─────────────────────────────────────────

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

type AppRouter = ReturnType<typeof useRouter>

function assistantActionsFor(prompt: string, router: AppRouter): ChatMessage["actions"] {
  const lower = prompt.toLowerCase()
  if (lower.includes("latency")) {
    return [
      { label: "Open Monitor", onClick: () => router.push("/monitor") },
      { label: "Open agent editor", onClick: () => router.push("/agents/new/edit") },
    ]
  }
  if (lower.includes("phone number") || lower.includes("telephony")) {
    return [
      { label: "Draft campaign", onClick: () => router.push("/deploy/batch-calls/new") },
      { label: "Browse numbers", onClick: () => router.push("/deploy/phone-numbers") },
    ]
  }
  if (lower.includes("support") || lower.includes("agent")) {
    return [
      { label: "Open in editor", onClick: () => router.push("/agents/new/edit") },
      { label: "Change defaults", onClick: () => toast.info("Mock: would open model picker") },
    ]
  }
  return undefined
}
