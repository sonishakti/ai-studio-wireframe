"use client"

import * as React from "react"
import {
  Upload, Check, AlertTriangle, Download, EllipsisVertical, Plus, RotateCcw,
  Pencil, Copy, Trash2, Lock,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AddPhoneNumberSheet } from "@/components/add-phone-number-sheet"
import { InfoHint } from "@/components/wizard/info-hint"
import { CampaignDialingFields, CampaignLaunchFields } from "@/components/wizard/step-call-settings"
import { PHONE_NUMBERS } from "@/lib/campaign-data"
import {
  MOCK_CSV_COLUMNS, MOCK_CSV_ROWS, campaignMissingVars, promptVars, makeCampaign, newCampaignId,
  campaignRollup, campaignDialed,
  type AgentDraft, type CampaignDraft, type CampaignStatus,
} from "@/lib/wizard-draft"
import {
  MAX_ROWS, REQUIRED_COLUMN, parseContactCsv, saveList,
  type ParsedContactList,
} from "@/lib/contact-list"
import { useContactList } from "@/hooks/use-contact-list"
import { type StepProps } from "@/components/wizard/types"

/**
 * CampaignsCard — batch calling as MANAGED CAMPAIGNS (v4 IA, 2026-07-28):
 * an agent runs several — different CSVs, regions/languages, in parallel
 * (e.g. one Spanish + two English by region). Completed campaigns re-run as a
 * fresh draft. Editing is INLINE (owner: the contacts CSV lays out
 * half-and-half inside the Go Live panel, never bleeding under the Test
 * panel) — the editor expands in place, contacts on the right half.
 *
 * v9 (2026-08-03): the list scales past three runs. A ROLL-UP bar answers
 * "what is this agent dialing right now?" without expanding anything, running
 * runs carry DIAL PROGRESS, and a STATUS FILTER appears once the list is long
 * enough to hide the row you came for. Every one of those is read-only — the
 * editing model (inline, one open at a time) is unchanged.
 */

const STATUS_META: Record<CampaignStatus, { label: string; cls: string; dot?: boolean }> = {
  draft: { label: "Draft", cls: "text-muted-foreground" },
  scheduled: { label: "Scheduled", cls: "text-foreground" },
  running: { label: "Running", cls: "text-success", dot: true },
  completed: { label: "Completed", cls: "text-muted-foreground" },
}

/** Region-flavored language tags — labels a campaign row (the agent's spoken
 *  language stays a Voice trait; this is the campaign's audience tag). */
const CAMPAIGN_LANGUAGES = [
  "English (US)", "English (UK)", "English (IN)", "Spanish (MX)", "Spanish (ES)",
  "French (FR)", "German (DE)", "Hindi (IN)", "Mandarin (CN)",
]

/** Filter chips appear only once a list can actually hide something. */
const FILTER_THRESHOLD = 4
type RunFilter = "all" | CampaignStatus

export function CampaignsCard({ draft, update }: StepProps) {
  const campaigns = draft.campaigns
  // null = closed · "new" = creating · id = editing that row. The first run
  // opens with its fields already asked (owner 2026-09-15): a draft run is an
  // unfinished form, not a row to go and find.
  const [editing, setEditing] = React.useState<string | null>(
    () => (campaigns.length === 0 ? "new" : campaigns.find((c) => c.status === "draft")?.id ?? null),
  )
  const [newDraft, setNewDraft] = React.useState<CampaignDraft | null>(
    () => (campaigns.length === 0 ? { ...makeCampaign("Run 01"), numberId: draft.config.batch?.callerId } : null),
  )
  const [filter, setFilter] = React.useState<RunFilter>("all")

  const roll = campaignRollup(draft)
  const showFilter = campaigns.length >= FILTER_THRESHOLD
  const visible = showFilter && filter !== "all"
    ? campaigns.filter((c) => c.status === filter)
    : campaigns
  const filterCount = (f: RunFilter) =>
    f === "all" ? roll.total : campaigns.filter((c) => c.status === f).length
  // A second run is a real idea only once the first one has left draft; before
  // that "New run" competes with the run you are already filling in.
  const showNewRun = campaigns.length === 0 || campaigns.some((c) => c.status !== "draft")

  const setCampaigns = (next: CampaignDraft[]) => update({ campaigns: next })
  const patchCampaign = (id: string, patch: Partial<CampaignDraft>) =>
    setCampaigns(campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  // Creating/copying a run while a filter is on would open an editor the list
  // is hiding — clear the filter so the new row is always the one you land on.
  const startNew = () => {
    setFilter("all")
    // New runs INHERIT the agent-level caller ID (user-test 2026-08-10 S2:
    // setting the number in Deployment and again per run read as a trap).
    setNewDraft({ ...makeCampaign(`Run ${campaigns.length + 1}`), numberId: draft.config.batch?.callerId })
    setEditing("new")
  }
  const duplicate = (c: CampaignDraft) => {
    setFilter("all")
    const copy: CampaignDraft = {
      ...c,
      id: newCampaignId(),
      name: `${c.name} (copy)`,
      status: "draft",
      locked: false,
      rerunOf: undefined,
      launch: { mode: "now" },
    }
    setCampaigns([...campaigns, copy])
    setEditing(copy.id)
    toast(`${c.name} duplicated`, { description: "A fully editable copy. Change anything." })
  }
  /** RERUN (owner 2026-07-28, distinct from Duplicate): SAME agent, SAME
   *  config — only the contact list (and timing) change, so aggregated
   *  analytics stay comparable across runs. Everything else locks. */
  const rerun = (c: CampaignDraft) => {
    setFilter("all")
    const next: CampaignDraft = {
      ...c,
      id: newCampaignId(),
      name: `${c.name}: rerun`,
      csvName: null,
      contacts: undefined,
      status: "draft",
      locked: true,
      rerunOf: c.rerunOf ?? c.id,
      launch: { mode: "now" },
    }
    setCampaigns([...campaigns, next])
    setEditing(next.id)
    toast(`Rerunning ${c.name}`, {
      description: "Config is locked to the original run: upload the new contact list and launch.",
    })
  }
  const remove = (c: CampaignDraft) => {
    setCampaigns(campaigns.filter((x) => x.id !== c.id))
    toast(`${c.name} deleted`, {
      action: { label: "Undo", onClick: () => setCampaigns([...campaigns]) },
    })
  }

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2.5">
          <p className="text-sm font-semibold">Campaign runs ({campaigns.length})</p>
          <InfoHint label="Runs vs reruns">
            A run = one contact list + schedule; several can run in parallel.{" "}
            <em>Rerun</em> keeps the config, swaps the CSV.
          </InfoHint>
        </div>
        {showNewRun && (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={startNew} disabled={editing === "new"}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> New run
          </Button>
        )}
      </header>

      {/* Roll-up — the state of every run in one line, without opening any of
          them. The row a user needs is usually the one that "needs input", so
          that count is the only thing allowed to shout. */}
      {campaigns.length > 0 && (
        <div id="wz-5-runs-rollup" className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border py-2.5">
          <p className="min-w-0 flex-1 text-xs text-muted-foreground">
            {[
              roll.running && `${roll.running} dialing`,
              roll.scheduled && `${roll.scheduled} scheduled`,
              roll.draft && `${roll.draft} draft`,
              roll.completed && `${roll.completed} completed`,
            ].filter(Boolean).join(" · ")}
            {roll.queuedContacts > 0 && ` · ${roll.queuedContacts.toLocaleString()} contacts still to dial`}
            {roll.dialedContacts > 0 && ` · ${roll.dialedContacts.toLocaleString()} dialed`}
          </p>
          {roll.needsAttention > 0 && (
            <span className="flex shrink-0 items-center gap-1 text-xs text-warning">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              {roll.needsAttention} run{roll.needsAttention > 1 ? "s" : ""} need
              {roll.needsAttention === 1 ? "s" : ""} input before deploy
            </span>
          )}
        </div>
      )}

      {/* Status filter — only once the list is long enough to hide a row. */}
      {showFilter && (
        <div id="wz-5-runs-filter" className="flex flex-wrap items-center gap-1 border-b border-border py-2" role="group" aria-label="Filter runs by status">
          {(["all", "running", "scheduled", "draft", "completed"] as RunFilter[])
            .filter((f) => f === "all" || filterCount(f) > 0)
            .map((f) => (
              <Button
                key={f}
                type="button"
                variant="ghost"
                size="sm"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-7 px-2.5 text-xs font-normal text-muted-foreground",
                  filter === f && "bg-accent/60 font-medium text-foreground",
                )}
              >
                {f === "all" ? "All" : STATUS_META[f as CampaignStatus].label}
                <span className="ml-1 tabular-nums opacity-60">{filterCount(f)}</span>
              </Button>
            ))}
        </div>
      )}

      {campaigns.length === 0 && editing !== "new" ? null : (
        <ul className="divide-y divide-border">
          {editing === "new" && newDraft && (
            <li className="p-4">
              <CampaignEditor
                draft={draft}
                campaign={newDraft}
                isNew
                onChange={(p) => setNewDraft((c) => (c ? { ...c, ...p } : c))}
                onCancel={() => { setEditing(null); setNewDraft(null) }}
                onSave={() => {
                  setCampaigns([...campaigns, newDraft])
                  setEditing(null)
                  setNewDraft(null)
                  toast(`${newDraft.name} saved`, {
                    description: newDraft.launch?.mode === "scheduled"
                      ? "Scheduled. It arms when you deploy."
                      : "Starts dialing when you deploy.",
                  })
                }}
              />
            </li>
          )}
          {visible.map((c) => {
            const meta = STATUS_META[c.status]
            const missing = c.status !== "completed"
              ? [!c.numberId && "phone number", !c.csvName && "contacts CSV"].filter(Boolean)
              : []
            const total = c.contacts ?? (c.csvName ? MOCK_CSV_ROWS : 0)
            const dialed = campaignDialed(c)
            return (
              <li key={c.id}>
                <div className="flex flex-wrap items-center gap-3 py-3">
                  <span className={cn("inline-flex w-20 shrink-0 items-center gap-1.5 text-xs font-medium", meta.cls)}>
                    {meta.dot && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" aria-hidden />}
                    {meta.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {c.name}
                      {c.language && <span className="text-xs font-normal text-muted-foreground">{c.language}</span>}
                      {c.locked && (
                        <Badge variant="outline" className="h-5 gap-1 border-warning/50 px-1.5 text-xs font-normal text-foreground">
                          <Lock className="h-3 w-3 text-warning" aria-hidden /> rerun · config locked
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.csvName
                        ? c.status === "running"
                          ? `${dialed.toLocaleString()} of ${total.toLocaleString()} dialed · ${c.csvName}`
                          : `${total.toLocaleString()} contacts · ${c.csvName}`
                        : "No contacts yet"}
                      {c.status === "scheduled" && c.launch?.startDate && (
                        <> · starts {c.launch.startDate} {c.launch.startTime} {c.launch.timezone ? `(${c.launch.timezone})` : ""}</>
                      )}
                    </p>
                    {/* Progress belongs to a RUNNING run only — a bar on a
                        draft would imply dialing that hasn't started. */}
                    {c.status === "running" && total > 0 && (
                      <div
                        className="mt-1.5 h-1 w-full max-w-64 overflow-hidden rounded-full bg-muted"
                        role="progressbar"
                        aria-valuenow={Math.round((dialed / total) * 100)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${c.name} dial progress`}
                      >
                        <span
                          className="block h-full rounded-full bg-success"
                          style={{ width: `${Math.round((dialed / total) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {missing.length > 0 && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-warning">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> needs {missing.join(" + ")}
                    </span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label={`Actions for ${c.name}`}>
                        <EllipsisVertical className="h-4 w-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(editing === c.id ? null : c.id)}>
                        <Pencil className="size-4" aria-hidden /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(c)}>
                        <Copy className="size-4" aria-hidden /> Duplicate (editable copy)
                      </DropdownMenuItem>
                      {c.status === "completed" && (
                        <DropdownMenuItem onClick={() => rerun(c)}>
                          <RotateCcw className="size-4" aria-hidden /> Rerun with a new CSV
                        </DropdownMenuItem>
                      )}
                      {c.status === "draft" && (
                        <DropdownMenuItem variant="destructive" onClick={() => remove(c)}>
                          <Trash2 className="size-4" aria-hidden /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {editing === c.id && (
                  <div className="border-t border-border py-4">
                    <CampaignEditor
                      draft={draft}
                      campaign={c}
                      onChange={(p) => patchCampaign(c.id, p)}
                      onCancel={() => setEditing(null)}
                      onSave={() => { setEditing(null); toast(`${c.name} updated`) }}
                    />
                  </div>
                )}
              </li>
            )
          })}
          {/* A filter that hides everything must offer its own way out. */}
          {visible.length === 0 && editing !== "new" && (
            <li className="flex flex-col items-start gap-2 py-6">
              <p className="text-sm text-muted-foreground">
                No {filter === "all" ? "" : STATUS_META[filter as CampaignStatus].label.toLowerCase()} runs.
              </p>
              <Button variant="outline" size="sm" onClick={() => setFilter("all")}>
                Show all {roll.total} runs
              </Button>
            </li>
          )}
        </ul>
      )}

      {roll.running > 0 && (
        <p className="pt-2.5 text-xs text-muted-foreground/80">
          Wireframe: dial progress is simulated.
        </p>
      )}
    </section>
  )
}

// ─── Inline editor — form on the left half, contacts CSV on the right half ────

function CampaignEditor({
  draft, campaign, onChange, onSave, onCancel, isNew,
}: {
  draft: AgentDraft
  campaign: CampaignDraft
  onChange: (patch: Partial<CampaignDraft>) => void
  onSave: () => void
  onCancel: () => void
  isNew?: boolean
}) {
  // Caller-ID candidates: unassigned numbers, the current pick, and numbers
  // already carrying outbound traffic (a shared pool takes more batches).
  const available = PHONE_NUMBERS.filter(
    (n) =>
      n.status === "unassigned" ||
      n.id === campaign.numberId ||
      n.assignedTo.some((d) => d.startsWith("dp_ob")),
  )
  // Busy inbound lines SHOW, disabled, with the reason — hiding the number the
  // status line names read as the product hiding something (user-tests #9/#10).
  const answering = PHONE_NUMBERS.filter(
    (n) => !available.includes(n) && (n.assignedTo.length > 0 || n.assignedAgent),
  )

  // Zero-number accounts must not dead-end at the dropdown (user-test
  // 2026-07-29 P1) — a footer door mirrors the Inbound block's Add phone
  // number accelerator. Numbers added THIS session are local state
  // (PHONE_NUMBERS is a static mock), merged into the list + selected.
  const ADD_NUMBER = "__add_number__"
  const [addOpen, setAddOpen] = React.useState(false)
  const [sessionNumbers, setSessionNumbers] = React.useState<{ id: string; number: string; label: string }[]>([])
  const addedNumber = (n: { number: string; label: string }) => {
    const id = `pn_new_${Date.now().toString(36)}`
    setSessionNumbers((s) => [...s, { id, ...n }])
    onChange({ numberId: id })
    toast.success(`${n.number} set as the number to dial from`, {
      description: "This run dials from it once you deploy.",
    })
  }

  const locked = !!campaign.locked

  return (
    <div className="@container space-y-4 rounded-lg border border-border bg-card p-4">
      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        {isNew ? "New run" : `Edit ${campaign.name}`}
        {locked && (
          <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <Lock className="h-3 w-3 text-warning" aria-hidden /> rerun
          </span>
        )}
      </p>

      {/* Rerun lock (owner 2026-07-28): same agent, same config — only the
          list and timing change, so aggregated analytics stay comparable. */}
      {locked && (
        <p className="rounded-md border border-warning/50 bg-warning/10 px-3 py-2 text-xs text-foreground">
          Config is locked to the original run: upload the new contact list and set the timing.
          Phone number, language, and dialing stay identical so analytics aggregate across runs.
          Need changes? Use <span className="font-medium">Duplicate</span> instead.
        </p>
      )}

      {/* ONE top-to-bottom flow (owner 2026-07-29: the 50/50 editor read as
          "super complex") — essentials, then the contacts CSV front and
          center, then schedule & dialing. Stacked = a sequence to follow. */}
      <div className="grid grid-cols-1 gap-3 @lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`cmp-name-${campaign.id}`} className="text-sm font-medium">Run name</Label>
          <Input
            id={`cmp-name-${campaign.id}`}
            value={campaign.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Q3 Renewals. EN West"
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Language / region</Label>
          <Select disabled={locked} value={campaign.language ?? ""} onValueChange={(language) => onChange({ language })}>
            <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Tag this list" /></SelectTrigger>
            <SelectContent>
              {CAMPAIGN_LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Phone number</Label>
          <Select
            disabled={locked}
            value={campaign.numberId ?? ""}
            onValueChange={(numberId) => {
              // The footer door is a sentinel, not a pick — open the sheet.
              if (numberId === ADD_NUMBER) { setAddOpen(true); return }
              onChange({ numberId })
            }}
          >
            <SelectTrigger className="w-full text-sm">
              <SelectValue placeholder="Number to dial from" />
            </SelectTrigger>
            <SelectContent>
              {available.map((n) => (
                <SelectItem key={n.id} value={n.id}>{n.number} · {n.label}{n.id === campaign.numberId ? " · current" : ""}</SelectItem>
              ))}
              {sessionNumbers.map((n) => (
                <SelectItem key={n.id} value={n.id}>{n.number} · {n.label}{n.id === campaign.numberId ? " · current" : ""}</SelectItem>
              ))}
              {answering.map((n) => (
                <SelectItem key={n.id} value={n.id} disabled>
                  {n.number} · {n.assignedTo.length > 0
                    ? `answering ${n.label}`
                    : `assigned to ${n.assignedAgent?.name ?? n.label}`} · a line can&apos;t answer and dial at once
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={ADD_NUMBER} className="text-muted-foreground">
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add phone number (SIP)
              </SelectItem>
            </SelectContent>
          </Select>
          {campaign.numberId && campaign.numberId === draft.config.batch?.callerId && (
            <p className="text-xs text-muted-foreground">Default from agent.</p>
          )}
          <AddPhoneNumberSheet open={addOpen} onOpenChange={setAddOpen} onAdded={addedNumber} />
        </div>
      </div>

      <CampaignContacts draft={draft} campaign={campaign} onChange={onChange} />

      <CampaignLaunchFields campaign={campaign} onChange={onChange} />
      <CampaignDialingFields campaign={campaign} onChange={onChange} disabled={locked} />

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!campaign.name.trim() || (locked && !campaign.csvName)} onClick={onSave}>
          {locked ? "Save Rerun" : isNew ? "Save Run" : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}

// ─── Contacts — the campaign's CSV (upload · coverage · scrolling preview) ────

export function CampaignContacts({
  draft, campaign, onChange, defaultPreviewOpen = false,
}: {
  draft: AgentDraft
  campaign: CampaignDraft
  onChange: (patch: Partial<CampaignDraft>) => void
  /** Deployment shows the table straight away — the list IS the decision
   *  there, not a detail behind a toggle (owner 2026-09-15). */
  defaultPreviewOpen?: boolean
}) {
  const hasCsv = !!campaign.csvName
  const required = promptVars(draft)
  const missing = campaignMissingVars(draft, campaign)
  const [previewOpen, setPreviewOpen] = React.useState(defaultPreviewOpen)
  const fileRef = React.useRef<HTMLInputElement>(null)
  // The rows the panel and the Opening both read — one parsed list per run, so
  // the preview here and the sentence three sections up cannot disagree.
  const agentId = draft.agentId ?? "new"
  const held = useContactList(agentId, campaign.id)
  const checks = campaign.listChecks
  // Coverage AHA: the moment every {{variable}} finds its column, the green
  // check pops. Keyed so the one-shot replays.
  const varsCovered = hasCsv && missing.length === 0 && required.length > 0
  const prevCovered = React.useRef(varsCovered)
  const [coveredFlash, setCoveredFlash] = React.useState(0)
  React.useEffect(() => {
    if (varsCovered && !prevCovered.current) setCoveredFlash((k) => k + 1)
    prevCovered.current = varsCovered
  }, [varsCovered])

  /** One place a list becomes a run's contacts: the file the builder chose. */
  const adopt = (list: ParsedContactList) => {
    saveList(agentId, campaign.id, list)
    onChange({
      csvName: list.fileName,
      contacts: list.rowCount,
      columns: list.columns,
      listChecks: {
        repeats: list.checks.repeats,
        notE164: list.checks.notE164,
        overCap: list.checks.overCap,
        hasKey: list.checks.hasKey,
        hasOverride: list.checks.hasOverride,
      },
    })
    toast.success(`${list.fileName} attached`, {
      description: `${list.rowCount} contacts · columns: ${list.columns.join(", ")}`,
    })
  }

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset first: choosing the same file twice must fire onChange again.
    e.target.value = ""
    if (file) adopt(await parseContactCsv(file))
  }

  /** The file input lives on both states, so Replace file reaches it too. */
  const picker = (
    <input
      ref={fileRef}
      type="file"
      accept=".csv,text/csv"
      className="sr-only"
      onChange={onPick}
      aria-hidden
      tabIndex={-1}
    />
  )

  if (!hasCsv) {
    // The house empty-state row (Knowledge base · MCP server · tests): the
    // name, one sentence saying what the thing is, and the ONE door that ends
    // the emptiness. The two links beside it are gone (owner 2026-09-17): a
    // ready-made list is two dozen people this run never chose to call, and the
    // template link downloaded nothing.
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
        {picker}
        <div className="min-w-0">
          <p className="text-sm font-medium">No contact list yet</p>
          <p className="text-xs text-muted-foreground">
            A contact list is one row per person this run calls: upload a CSV with a phone_number
            column, plus a column for every {"{{variable}}"} your prompt reads.
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0 gap-1.5" onClick={() => fileRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" aria-hidden /> Upload contacts CSV
        </Button>
      </div>
    )
  }

  // Facts about the file the builder chose — each one a count of rows in it,
  // printed only when there is something to count.
  const blanks = Object.entries(held?.checks.blanksByColumn ?? {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
  const notes: string[] = []
  if (checks?.repeats) notes.push(`${checks.repeats} number${checks.repeats > 1 ? "s appear" : " appears"} twice`)
  if (checks?.notE164) notes.push(`${checks.notE164} number${checks.notE164 > 1 ? "s are" : " is"} not in E.164 format`)
  for (const [col, n] of blanks) notes.push(`${n} blank cell${n > 1 ? "s" : ""} in ${col}`)

  // The file's own header, with the required column first when it carries one.
  const own = campaign.columns?.length ? campaign.columns : MOCK_CSV_COLUMNS
  const columns = own.includes(REQUIRED_COLUMN)
    ? [REQUIRED_COLUMN, ...own.filter((c) => c !== REQUIRED_COLUMN)]
    : own
  const rows = held?.rows ?? []

  return (
    <div className="space-y-2.5">
      {picker}
      {/* One summary bar — file · count · what the file turned out to be. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">{campaign.contacts ?? 0} contacts</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{campaign.csvName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {rows.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setPreviewOpen((v) => !v)}>
              {previewOpen ? "Hide preview" : `Preview ${rows.length} rows`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Replace file</Button>
        </div>
      </div>

      {notes.length > 0 && <p className="text-xs text-muted-foreground">{notes.join(" · ")}</p>}
      {checks?.hasOverride && (
        <p className="text-xs text-muted-foreground">prompt_override replaces the prompt for that row.</p>
      )}

      {checks?.hasKey === false && (
        <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs leading-relaxed text-foreground">
            This file has no phone_number column, so there is nothing to dial.
          </p>
        </div>
      )}
      {checks?.overCap && (
        <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs leading-relaxed text-foreground">
            {MAX_ROWS.toLocaleString("en-US")} rows is the limit. This file has{" "}
            {(campaign.contacts ?? 0).toLocaleString("en-US")}.
          </p>
        </div>
      )}

      {/* Prompt-variable coverage — it's about THIS list, so it lives here. */}
      {missing.length === 0 ? (
        <p
          key={coveredFlash}
          className={cn(
            "flex items-start gap-1.5 text-xs",
            varsCovered ? "text-foreground" : "text-muted-foreground",
            varsCovered && coveredFlash > 0 && "wz-anchor-flash",
          )}
        >
          {varsCovered && <Check className={cn("mt-0.5 h-3.5 w-3.5 shrink-0 text-success", coveredFlash > 0 && "sx-tick-pop")} />}
          {required.length > 0
            ? `${required.length} of ${required.length} variables have a column.`
            : "No {{variables}} in your prompt yet. Add them in Prompt & knowledge to personalize each call."}
        </p>
      ) : (
        <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs leading-relaxed text-foreground">
            Missing {missing.length} column{missing.length > 1 ? "s" : ""}:{" "}
            {missing.map((v) => `{{${v}}}`).join(", ")}. Add {missing.length > 1 ? "them" : "it"} to
            the file, or remove {missing.length > 1 ? "them" : "it"} from the prompt. Deploy stays
            blocked until they match.
          </p>
        </div>
      )}

      {/* Preview collapsed by default (owner 2026-07-29: cut the visual mass —
          the table scrolls inside its panel when opened). The header is the
          file's own, phone_number first, so a list with five columns is not
          drawn as if it had the five we imagined. */}
      {previewOpen && rows.length > 0 && (
        <div className="max-h-[300px] overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                {columns.map((col) => <TableHead key={col} className="font-mono text-xs">{col}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`${r[REQUIRED_COLUMN] ?? ""}-${i}`}>
                  {columns.map((col) => (
                    <TableCell
                      key={col}
                      className={cn(
                        "font-mono text-xs",
                        col === REQUIRED_COLUMN ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {r[col] ?? ""}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
