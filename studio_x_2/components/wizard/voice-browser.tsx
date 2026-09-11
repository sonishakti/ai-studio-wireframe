"use client"

import * as React from "react"
import { Check, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoHint } from "@/components/wizard/info-hint"
import { OwnVoiceForm, type OwnVoiceVendor } from "@/components/wizard/own-voice-form"
import { VoiceSampleButton, useSimulatedPlayer } from "@/components/wizard/voice-sample-button"
import { useStoredState } from "@/hooks/use-stored-state"
import { inferVoiceUseCase, rankVoicesForUseCase } from "@/lib/voice-recommendations"
import type { VoiceArtifact } from "@/lib/voice-artifacts"

const PAGE_SIZE = 8
const ALL = "all"
/** Hick's-law budget (Design Tracker 01): decide among ≤3 twice, never among 62. */
const COMPARE_MAX = 3

/** Voice browser (Figma "Select Voice") — a filterable, paginated catalog with
 *  per-voice traits + id + a mock sample, replacing the plain Step-1 dropdown.
 *  Design Tracker 01 (converged A + B + D): a Recommended strip above the
 *  table read from the prompt, a Compare column + tray (≤3), and "Add your
 *  own voice" — all inside this dialog; table, filters and paging unchanged. */
export function VoiceBrowser({
  open,
  onOpenChange,
  voices,
  selectedId,
  onSelect,
  useCaseHint,
  language,
  agentId,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  voices: VoiceArtifact[]
  selectedId?: string
  onSelect: (v: VoiceArtifact) => void
  /** The prompt IS the use case — the strip infers it from these words. */
  useCaseHint?: { systemPrompt: string; greeting: string; templateName?: string }
  /** Spoken language (draft.stack.language) — a match scores in the ranking. */
  language?: string
  /** Scopes the persisted shortlist (`sx:voice_shortlist:<agentId|new>`). */
  agentId?: string
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

  const clearFilters = () => {
    setProvider(ALL); setQ(""); setGender(ALL); setAccent(ALL); setType(ALL)
  }

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

  // ── A · Recommended — tags vs the prompt, never benchmarks. ────────────────
  const useCase = useCaseHint ? inferVoiceUseCase(useCaseHint) : null
  const recommended = rankVoicesForUseCase(voices, useCase, { language })
  const recommendedIds = new Set(recommended.map((v) => v.id))

  // ── B · Compare — a shortlist of ≤3, persisted per agent. ──────────────────
  const [shortlist, setShortlist] = useStoredState<string[]>(`sx:voice_shortlist:${agentId ?? "new"}`, [])
  const shortlisted = shortlist
    .map((id) => voices.find((v) => v.id === id))
    .filter((v): v is VoiceArtifact => !!v)
  const compareFull = shortlisted.length >= COMPARE_MAX
  const toggleCompare = (id: string, on: boolean) => {
    const without = shortlist.filter((x) => x !== id)
    setShortlist(on ? [...without, id].slice(-COMPARE_MAX) : without)
  }

  // ── D · Add your own voice — the form takes the strip's place. ─────────────
  const [ownVoiceOpen, setOwnVoiceOpen] = React.useState(false)
  const vendor: OwnVoiceVendor = provider === "Azure" ? "Azure" : "ElevenLabs"

  // One shared element: closing the dialog silences it (rule 7).
  const player = useSimulatedPlayer()
  const close = () => { player.stop(); setOwnVoiceOpen(false); onOpenChange(false) }
  const handleOpenChange = (o: boolean) => { if (o) onOpenChange(true); else close() }
  const use = (v: VoiceArtifact) => { onSelect(v); close() }

  const readGreetingId = React.useId()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {ownVoiceOpen ? (
            <OwnVoiceForm
              vendor={vendor}
              onSave={(v) => { setOwnVoiceOpen(false); use(v) }}
              onCancel={() => setOwnVoiceOpen(false)}
            />
          ) : recommended.length > 0 ? (
            <section data-design-focus="voice-recommended" className="border-b border-border pb-2" aria-label="Recommended voices">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-1">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <h3 className="text-sm font-medium">Recommended{useCase ? ` for ${useCase}` : ""}</h3>
                  <InfoHint label="Based on voice tags, not benchmarks">
                    Ranked from each voice&apos;s type and trait tags against your prompt and greeting.
                  </InfoHint>
                </span>
                <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setOwnVoiceOpen(true)}>
                  Add your own voice
                </Button>
              </div>
              <ul className="divide-y divide-border">
                {recommended.map((v) => {
                  const on = v.id === selectedId
                  return (
                    <li key={v.id} className="flex items-center gap-2 py-1.5">
                      <VoiceSampleButton voice={v} player={player} className="text-muted-foreground" />
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-sm font-medium">{v.name}</span>
                        {(v.traits ?? []).map((t) => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}
                      </span>
                      <Button size="sm" variant={on ? "secondary" : "outline"} onClick={() => use(v)}>
                        {on ? "Selected" : "Use voice"}
                      </Button>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Voice</TableHead>
                <TableHead className="hidden md:table-cell">Traits</TableHead>
                <TableHead className="hidden sm:table-cell">Voice ID</TableHead>
                <TableHead className="w-20 text-center">Compare</TableHead>
                <TableHead className="w-24 text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((v) => {
                const on = v.id === selectedId
                const inShortlist = shortlist.includes(v.id)
                return (
                  <TableRow key={v.id} className={cn("group", (on || recommendedIds.has(v.id)) && "bg-primary/5")}>
                    <TableCell>
                      <VoiceSampleButton voice={v} player={player} size="icon-xs" className="h-7 w-7 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium">
                        {v.name}
                        {on && <Check className="h-3.5 w-3.5 text-primary" aria-hidden />}
                      </span>
                      <span className="text-xs text-muted-foreground">{v.gender} · {v.accent} · {v.voiceType}</span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="flex flex-wrap gap-1">
                        {(v.traits ?? []).map((t) => <Badge key={t} variant="secondary" className="font-normal">{t}</Badge>)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><span className="font-mono text-xs text-muted-foreground">{v.voiceId ?? v.ttsVoice}</span></TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        className="mx-auto"
                        aria-label={`Compare ${v.name}`}
                        checked={inShortlist}
                        disabled={compareFull && !inShortlist}
                        title={compareFull && !inShortlist ? `${COMPARE_MAX} of ${COMPARE_MAX}` : undefined}
                        onCheckedChange={(c) => toggleCompare(v.id, c === true)}
                      />
                    </TableCell>
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
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    No voices match{" "}
                    <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* B · The compare tray — docked above the paging footer while ≥1 is
            shortlisted. Vendor samples in v1; "Read my greeting" waits on the
            Studio preview endpoint and says so. */}
        {shortlisted.length > 0 && (
          <section data-design-focus="voice-compare" className="shrink-0 border-t border-border px-5 py-3" aria-label="Compare voices">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">
                Compare <span className="font-mono text-xs font-normal text-muted-foreground">{shortlisted.length} of {COMPARE_MAX}</span>
              </span>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setShortlist([])}>Clear</Button>
            </div>
            <ul className="divide-y divide-border">
              {shortlisted.map((v) => (
                <li key={v.id} className="flex items-center gap-2 py-1.5">
                  <VoiceSampleButton voice={v} player={player} className="text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.name}</span>
                  <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{v.voiceId ?? v.ttsVoice}</span>
                  <Button size="sm" variant={v.id === selectedId ? "secondary" : "outline"} onClick={() => use(v)}>
                    {v.id === selectedId ? "Selected" : "Use voice"}
                  </Button>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  {/* A disabled control swallows pointer events — the wrapper
                      carries the tooltip and stays keyboard-reachable. */}
                  <span tabIndex={0} className="inline-flex items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Checkbox id={readGreetingId} disabled aria-label="Read my greeting" />
                    <Label htmlFor={readGreetingId} className="text-xs font-normal text-muted-foreground">Read my greeting</Label>
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-72">Requires the Studio preview to read your greeting in each voice.</TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">· Requires Studio preview</span>
            </div>
          </section>
        )}

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
