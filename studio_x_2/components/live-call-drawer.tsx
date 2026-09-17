"use client"

import * as React from "react"
import { Ear, Hand, PhoneOff, Send, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { mmss, riskLine, verb, type LiveCall, type VerbId } from "@/lib/live-calls"

const ICON: Record<VerbId, React.ComponentType<{ className?: string }>> = {
  listen: Ear,
  say: Send,
  takeover: Hand,
  end: PhoneOff,
}

/**
 * One live call, and the four things you can do to it (design 12).
 *
 * The order is deliberate and it is the order of consequence: hear it, add to
 * it, take it, end it. Listening changes nothing for the caller, so it is one
 * click. The two the caller would notice are confirmed, and the confirmation
 * says what the caller experiences, not what the system does.
 */
export function LiveCallDrawer({
  call, open, onOpenChange, onAct,
}: {
  call: LiveCall | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onAct: (id: VerbId, text?: string) => void
}) {
  const [listening, setListening] = React.useState(false)
  const [line, setLine] = React.useState("")
  const [confirming, setConfirming] = React.useState<VerbId | null>(null)

  React.useEffect(() => { if (!open) { setListening(false); setLine(""); setConfirming(null) } }, [open])

  if (!call) return null
  const why = riskLine(call)

  const run = (id: VerbId, text?: string) => {
    const v = verb(id)
    if (v.confirm && confirming !== id) { setConfirming(id); return }
    setConfirming(null)
    if (id === "listen") setListening((l) => !l)
    if (id === "say") setLine("")
    onAct(id, text)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
          <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
            <SheetTitle className="text-base">{call.direction === "inbound" ? call.from : call.to}</SheetTitle>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{call.agentName}</span>
              <span aria-hidden>·</span>
              <span className="font-mono tabular-nums">{mmss(call.elapsed)}</span>
              <span aria-hidden>·</span>
              <StateBadge call={call} />
            </p>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {why && (
              <p className="mb-4 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2 text-sm">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                {why}
              </p>
            )}

            {call.operatorJoined && (
              <p className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
                <span className="font-medium">You are on the line.</span>{" "}
                <span className="text-muted-foreground">The agent is muted and will not speak again unless you end this.</span>
              </p>
            )}

            {/* The last few turns. Not the whole call: an operator deciding
                whether to step in reads the last thing said, not the history. */}
            <p className="pb-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">Now</p>
            {call.turns.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody has spoken yet.</p>
            ) : (
              <ol className="space-y-2.5">
                {call.turns.slice(-6).map((t, i) => (
                  <li key={i} className="grid grid-cols-[3rem_minmax(0,1fr)] gap-3">
                    <span className="pt-0.5 font-mono text-xs tabular-nums text-muted-foreground">{mmss(t.at)}</span>
                    <span className="min-w-0 text-sm">
                      <span className={cn("font-medium", t.role === "agent" ? "text-foreground" : "text-muted-foreground")}>
                        {t.role === "agent" ? call.agentName : "Caller"}
                      </span>{" "}
                      <span className="italic">&ldquo;{t.text}&rdquo;</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            <p className="mt-4 text-xs text-muted-foreground">
              Last answer took {call.latencyMs > 0 ? `${(call.latencyMs / 1000).toFixed(1)}s` : "no turn yet"}.
            </p>
          </div>

          {/* The verbs, in order of consequence. */}
          <div className="shrink-0 space-y-2 border-t border-border px-5 py-3">
            <div className="flex flex-wrap gap-2">
              {(["listen", "takeover", "end"] as VerbId[]).map((id) => {
                const v = verb(id)
                const Icon = ICON[id]
                const on = id === "listen" && listening
                return (
                  <Button
                    key={id}
                    variant={id === "end" ? "destructive" : on ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => run(id)}
                    title={v.help}
                  >
                    <Icon className="size-3.5" aria-hidden />
                    {on ? "Stop listening" : v.label}
                  </Button>
                )
              })}
            </div>
            <div className="flex gap-2">
              <Input
                value={line}
                onChange={(e) => setLine(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && line.trim()) run("say", line) }}
                placeholder="Give the agent a line to say"
                aria-label="Give the agent a line to say"
                className="text-sm"
              />
              <Button size="sm" className="h-9 shrink-0 gap-1.5" disabled={!line.trim()} onClick={() => run("say", line)}>
                <Send className="size-3.5" aria-hidden /> Say it
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {listening ? "You are hearing this call. Nobody hears you." : verb("say").help}
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* The confirmation says what the CALLER gets, because that is the part
          that cannot be undone. */}
      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirming ? `${verb(confirming).label}?` : ""}</AlertDialogTitle>
            <AlertDialogDescription>{confirming ? verb(confirming).help : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (confirming) { const id = confirming; setConfirming(null); onAct(id) } }}
            >
              {confirming === "end" ? "End it" : "Take over"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function StateBadge({ call }: { call: LiveCall }) {
  if (call.operatorJoined) return <Badge variant="destructive" className="text-xs">You are on the line</Badge>
  const tone =
    call.state === "speaking" ? "bg-primary/10 text-primary"
    : call.state === "ringing" ? "bg-muted text-muted-foreground"
    : call.state === "thinking" ? "bg-warning/10 text-warning"
    : "bg-success/10 text-success"
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium", tone)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {call.state === "listening" ? "listening to the caller" : call.state}
    </span>
  )
}
