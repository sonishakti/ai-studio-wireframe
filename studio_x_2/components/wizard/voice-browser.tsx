"use client"

import * as React from "react"
import { Play, Check, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { VoiceArtifact } from "@/lib/voice-artifacts"

const PAGE_SIZE = 8
const ALL = "all"

/** Voice browser (Figma "Select Voice") — a filterable, paginated catalog with
 *  per-voice traits + id + a mock sample, replacing the plain Step-1 dropdown.
 *  Custom voices still come from the Playground; this browses the ready-made
 *  catalog and calls onSelect (the same seed path as before). */
export function VoiceBrowser({
  open,
  onOpenChange,
  voices,
  selectedId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  voices: VoiceArtifact[]
  selectedId?: string
  onSelect: (v: VoiceArtifact) => void
}) {
  const providers = React.useMemo(() => {
    const set = new Set<string>()
    voices.forEach((v) => set.add(v.kind === "custom" ? "Custom" : v.provider ?? "ElevenLabs"))
    return [...set]
  }, [voices])
  const accents = React.useMemo(
    () => [...new Set(voices.map((v) => v.accent).filter(Boolean) as string[])].sort(),
    [voices],
  )
  const types = React.useMemo(
    () => [...new Set(voices.map((v) => v.voiceType).filter(Boolean) as string[])].sort(),
    [voices],
  )

  const [provider, setProvider] = React.useState(ALL)
  const [q, setQ] = React.useState("")
  const [gender, setGender] = React.useState(ALL)
  const [accent, setAccent] = React.useState(ALL)
  const [type, setType] = React.useState(ALL)
  const [page, setPage] = React.useState(0)

  // Any filter change returns to page 1 so results are never "empty but paged".
  React.useEffect(() => { setPage(0) }, [provider, q, gender, accent, type])

  const providerOf = (v: VoiceArtifact) => (v.kind === "custom" ? "Custom" : v.provider ?? "ElevenLabs")
  const filtered = voices.filter((v) => {
    if (provider !== ALL && providerOf(v) !== provider) return false
    if (gender !== ALL && v.gender !== gender) return false
    if (accent !== ALL && v.accent !== accent) return false
    if (type !== ALL && v.voiceType !== type) return false
    if (q.trim()) {
      const hay = `${v.name} ${v.tagline} ${v.voiceId ?? ""} ${(v.traits ?? []).join(" ")}`.toLowerCase()
      if (!hay.includes(q.trim().toLowerCase())) return false
    }
    return true
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const use = (v: VoiceArtifact) => { onSelect(v); onOpenChange(false) }
  const sample = (v: VoiceArtifact) => toast("Playing sample", { description: `${v.name} · ${v.voiceId ?? v.ttsVoice}` })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <DialogTitle>Select voice</DialogTitle>
        </DialogHeader>

        <div className="shrink-0 space-y-3 border-b border-border px-5 py-4">
          {providers.length > 1 && (
            <Tabs value={provider} onValueChange={setProvider}>
              <TabsList>
                <TabsTrigger value={ALL}>All</TabsTrigger>
                {providers.map((p) => <TabsTrigger key={p} value={p}>{p}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search voices" className="pl-9" aria-label="Search voices" />
            </div>
            <FilterSelect label="Gender" value={gender} onChange={setGender} options={["Male", "Female", "Neutral"]} />
            <FilterSelect label="Accent" value={accent} onChange={setAccent} options={accents} />
            <FilterSelect label="Type" value={type} onChange={setType} options={types} />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Voice</TableHead>
                <TableHead>Traits</TableHead>
                <TableHead>Voice ID</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((v) => {
                const on = v.id === selectedId
                return (
                  <TableRow key={v.id} className={cn("group", on && "bg-primary/5")}>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label={`Play ${v.name} sample`} onClick={() => sample(v)}>
                        <Play className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        {v.name}
                        {on && <Check className="h-3.5 w-3.5 text-primary" aria-hidden />}
                      </span>
                      <span className="text-xs text-muted-foreground">{v.gender} · {v.accent} · {v.voiceType}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex flex-wrap gap-1">
                        {(v.traits ?? []).map((t) => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}
                      </span>
                    </TableCell>
                    <TableCell><span className="font-mono text-xs text-muted-foreground">{v.voiceId ?? v.ttsVoice}</span></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant={on ? "secondary" : "outline"} onClick={() => use(v)}>
                        {on ? "Selected" : "Use voice"}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {pageRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                    No voices match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-3">
          <span className="text-xs text-muted-foreground">{filtered.length} voice{filtered.length === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} aria-label="Previous page" onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1} of {pages}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= pages - 1} aria-label="Next page" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[110px] text-sm" aria-label={label}>
        <SelectValue>{value === ALL ? label : value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label.toLowerCase()}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
