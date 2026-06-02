"use client"

import * as React from "react"
import { Copy, PhoneIncoming, PhoneOutgoing, Download, Play } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export interface CallTranscriptTurn {
  speaker: "Agent" | "Customer"
  text: string
}

export interface CallDetail {
  id: string
  type: "Inbound" | "Outbound"
  from: string
  to: string
  campaign: string
  agent: string
  timestamp: string
  durationSec: number
  outcome: "Successful" | "Failed" | "Cannot Predict"
  transcript: CallTranscriptTurn[]
}

const OUTCOME_BADGE: Record<CallDetail["outcome"], "default" | "destructive" | "secondary"> = {
  Successful: "default",
  Failed: "destructive",
  "Cannot Predict": "secondary",
}

export function CallDetailSheet({
  call,
  open,
  onOpenChange,
}: {
  call: CallDetail | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] w-full overflow-y-auto p-0">
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle>Call Details</SheetTitle>
        </SheetHeader>

        {call && (
          <div className="px-5 py-4 space-y-4">
            {/* Metadata */}
            <div className="space-y-2.5">
              <Field label="Call ID" value={call.id} copyable />
              <Field
                label="Call Type"
                custom={
                  <Badge variant="outline" className="gap-1">
                    {call.type === "Inbound" ? <PhoneIncoming className="h-3 w-3" /> : <PhoneOutgoing className="h-3 w-3" />}
                    {call.type}
                  </Badge>
                }
              />
              <Field label="From" value={call.from} copyable />
              <Field label="To" value={call.to} copyable />
              <Field label="Campaign" value={call.campaign} />
              <Field label="Agent" value={call.agent} />
              <Field label="Timestamp" value={call.timestamp} />
              <Field label="Call Duration" value={`${call.durationSec} seconds`} />
              <Field
                label="Call Outcome"
                custom={<Badge variant={OUTCOME_BADGE[call.outcome]}>{call.outcome}</Badge>}
              />
            </div>

            <Separator />

            {/* Recording actions */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.info("Mock: would play recording")}>
                <Play className="h-3.5 w-3.5" /> Play recording
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => toast.success("Mock: transcript downloaded")}>
                <Download className="h-3.5 w-3.5" /> Transcript
              </Button>
            </div>

            {/* Transcript */}
            <div className="space-y-2">
              <p className="text-sm font-semibold">Transcript</p>
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                {call.transcript.map((t, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className={t.speaker === "Agent" ? "text-xs font-medium text-primary" : "text-xs font-medium text-muted-foreground"}>
                      {t.speaker}
                    </p>
                    <p className="text-sm leading-relaxed">{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Field({
  label,
  value,
  custom,
  copyable,
}: {
  label: string
  value?: string
  custom?: React.ReactNode
  copyable?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      {custom ?? (
        <span className="inline-flex items-center gap-1.5 text-sm text-right">
          <span className="truncate">{value}</span>
          {copyable && (
            <button
              type="button"
              onClick={() => {
                if (value) void navigator.clipboard.writeText(value)
                toast.success(`${label} copied`)
              }}
              className="text-muted-foreground hover:text-foreground"
              title={`Copy ${label}`}
            >
              <Copy className="h-3 w-3" />
            </button>
          )}
        </span>
      )}
    </div>
  )
}
