"use client"

import * as React from "react"
import { FileText, Plus, Pencil, Trash2, X, ChevronLeft } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { DEFAULT_ANALYSIS, type AnalysisConfig, type DataPoint, type DataPointType } from "@/lib/wizard-draft"

/**
 * Analysis section (Figma "Call Analysis") — the structured outputs the agent
 * extracts from each call: named data points with a type and (for enums)
 * allowed values. Results already render in Monitor / the call-detail sheet;
 * this is the define side. Requires transcription to be on.
 */
export function StepAnalysis({
  value,
  onChange,
}: {
  value: AnalysisConfig | undefined
  onChange: (next: AnalysisConfig) => void
}) {
  const cfg = value ?? DEFAULT_ANALYSIS
  const patch = (p: Partial<AnalysisConfig>) => onChange({ ...cfg, ...p })
  // null = closed; "new" = add; a DataPoint = edit that one.
  const [editing, setEditing] = React.useState<DataPoint | "new" | null>(null)

  const upsert = (dp: DataPoint) => {
    const exists = cfg.dataPoints.some((d) => d.id === dp.id)
    patch({ dataPoints: exists ? cfg.dataPoints.map((d) => (d.id === dp.id ? dp : d)) : [...cfg.dataPoints, dp] })
    setEditing(null)
  }
  const remove = (id: string) => patch({ dataPoints: cfg.dataPoints.filter((d) => d.id !== id) })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Record calls and pull out structured data. You&apos;ll see the results on Monitor and each call.
      </p>

      {/* Transcription gate */}
      <section className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Transcription &amp; recording</p>
            <p className="text-xs text-muted-foreground">Store the transcript so data points can be extracted.</p>
          </div>
        </div>
        <Switch checked={cfg.transcribe} onCheckedChange={(transcribe) => patch({ transcribe })} aria-label="Transcription and recording" />
      </section>

      {/* Data points */}
      <section className="space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">Data points</p>
            <p className="text-xs text-muted-foreground">What to extract from each conversation.</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 gap-1.5" disabled={!cfg.transcribe} onClick={() => setEditing("new")}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add data point
          </Button>
        </div>

        {!cfg.transcribe ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            Turn on transcription to define data points.
            {cfg.dataPoints.length > 0 && ` Your ${cfg.dataPoints.length} saved data point${cfg.dataPoints.length === 1 ? "" : "s"} ${cfg.dataPoints.length === 1 ? "is" : "are"} kept, but nothing is extracted while this is off.`}
          </p>
        ) : cfg.dataPoints.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
            No data points yet. Add one to start extracting structured output.
          </p>
        ) : (
          <div className="space-y-2">
            {cfg.dataPoints.map((dp) => (
              <div key={dp.id} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span className="truncate">{dp.name}</span>
                    <Badge variant="secondary" className="shrink-0 font-normal">{dp.type}</Badge>
                  </p>
                  {dp.description && <p className="line-clamp-1 text-xs text-muted-foreground">{dp.description}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Edit ${dp.name}`} onClick={() => setEditing(dp)}>
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Remove ${dp.name}`} onClick={() => remove(dp.id)}>
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <DataPointSheet
        editing={editing}
        onClose={() => setEditing(null)}
        onSave={upsert}
      />
    </div>
  )
}

const TYPES: { id: DataPointType; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "number", label: "Number" },
  { id: "boolean", label: "Yes / No" },
  { id: "enum", label: "One of a list" },
]

function DataPointSheet({ editing, onClose, onSave }: { editing: DataPoint | "new" | null; onClose: () => void; onSave: (dp: DataPoint) => void }) {
  const open = editing !== null
  const existing = editing && editing !== "new" ? editing : null
  const [name, setName] = React.useState("")
  const [type, setType] = React.useState<DataPointType>("text")
  const [description, setDescription] = React.useState("")
  const [values, setValues] = React.useState<string[]>([])
  const [valDraft, setValDraft] = React.useState("")

  // Reset the form each time the sheet target changes.
  React.useEffect(() => {
    setName(existing?.name ?? "")
    setType(existing?.type ?? "text")
    setDescription(existing?.description ?? "")
    setValues(existing?.allowedValues ?? [])
    setValDraft("")
  }, [editing]) // eslint-disable-line react-hooks/exhaustive-deps

  const addValue = () => {
    const v = valDraft.trim()
    if (v && !values.includes(v)) setValues([...values, v])
    setValDraft("")
  }
  const save = () => {
    const id = existing?.id ?? `dp_${Date.now().toString(36)}`
    onSave({ id, name: name.trim(), type, description: description.trim(), ...(type === "enum" ? { allowedValues: values } : {}) })
  }
  const canSave = name.trim().length > 0 && (type !== "enum" || values.length > 0)

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <button type="button" onClick={onClose} className="mb-1 inline-flex items-center gap-1 rounded text-xs text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Back
          </button>
          <SheetTitle>{existing ? "Edit data point" : "Add data point"}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="space-y-1.5">
            <Label htmlFor="dp-name" className="text-sm font-medium">Name</Label>
            <Input id="dp-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. sentiment" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as DataPointType)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dp-desc" className="text-sm font-medium">Description</Label>
            <Textarea id="dp-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[72px] text-sm" placeholder="What should the agent capture, and when?" />
          </div>
          {type === "enum" && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Allowed values</Label>
              <div className="flex items-center gap-2">
                <Input value={valDraft} onChange={(e) => setValDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValue() } }} placeholder="e.g. positive" className="text-sm" />
                <Button variant="outline" size="sm" onClick={addValue} disabled={!valDraft.trim()}>Add</Button>
              </div>
              {values.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {values.map((v) => (
                    <Badge key={v} variant="secondary" className="gap-1 pr-1 font-normal">
                      {v}
                      <button type="button" onClick={() => setValues(values.filter((x) => x !== v))} aria-label={`Remove ${v}`} className="rounded-sm text-muted-foreground hover:text-foreground">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!canSave} onClick={save}>{existing ? "Save" : "Add data point"}</Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
