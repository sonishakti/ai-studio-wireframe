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
import { PHONE_NUMBERS, extractVars } from "@/lib/campaign-data"
import {
  MOCK_CSV_COLUMNS, MOCK_CSV_ROWS, campaignMissingVars, makeCampaign, newCampaignId,
  type AgentDraft, type CampaignDraft, type CampaignStatus,
} from "@/lib/wizard-draft"
import { type StepProps } from "@/components/wizard/types"

/**
 * CampaignsCard — batch calling as MANAGED CAMPAIGNS (v4 IA, 2026-07-28):
 * an agent runs several — different CSVs, regions/languages, in parallel
 * (e.g. one Spanish + two English by region). Completed campaigns re-run as a
 * fresh draft. Editing is INLINE (owner: the contacts CSV lays out
 * half-and-half inside the Go Live panel, never bleeding under the Test
 * panel) — the editor expands in place, contacts on the right half.
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

export function CampaignsCard({ draft, update }: StepProps) {
  const campaigns = draft.campaigns
  // null = closed · "new" = creating · id = editing that row.
  const [editing, setEditing] = React.useState<string | null>(null)
  const [newDraft, setNewDraft] = React.useState<CampaignDraft | null>(null)

  const setCampaigns = (next: CampaignDraft[]) => update({ campaigns: next })
  const patchCampaign = (id: string, patch: Partial<CampaignDraft>) =>
    setCampaigns(campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const startNew = () => {
    setNewDraft(makeCampaign(`Run ${campaigns.length + 1}`))
    setEditing("new")
  }
  const duplicate = (c: CampaignDraft) => {
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
    toast(`${c.name} duplicated`, { description: "A fully editable copy — change anything." })
  }
  /** RERUN (owner 2026-07-28, distinct from Duplicate): SAME agent, SAME
   *  config — only the contact list (and timing) change, so aggregated
   *  analytics stay comparable across runs. Everything else locks. */
  const rerun = (c: CampaignDraft) => {
    const next: CampaignDraft = {
      ...c,
      id: newCampaignId(),
      name: `${c.name} — rerun`,
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
      description: "Config is locked to the original run — upload the new contact list and launch.",
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
            <span className="font-medium text-foreground">Rerun</span> keeps the config, swaps the CSV.
          </InfoHint>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={startNew} disabled={editing === "new"}>
          <Plus className="h-3.5 w-3.5" aria-hidden /> New run
        </Button>
      </header>

      {campaigns.length === 0 && editing !== "new" ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <p className="text-sm font-medium">No runs yet</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            A run is one batch pass — a contact list, a caller ID, and a schedule.
            Create one to start batch calling.
          </p>
          <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={startNew}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> New run
          </Button>
        </div>
      ) : (
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
                      ? "Scheduled — it arms when you deploy."
                      : "Starts dialing when you deploy.",
                  })
                }}
              />
            </li>
          )}
          {campaigns.map((c) => {
            const meta = STATUS_META[c.status]
            const missing = c.status !== "completed"
              ? [!c.numberId && "caller ID", !c.csvName && "contacts CSV"].filter(Boolean)
              : []
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
                          <Lock className="h-3 w-3 text-warning" aria-hidden /> rerun — config locked
                        </Badge>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.csvName
                        ? `${c.contacts ?? MOCK_CSV_ROWS} contacts · ${c.csvName}`
                        : "No contacts yet"}
                      {c.status === "scheduled" && c.launch?.startDate && (
                        <> · starts {c.launch.startDate} {c.launch.startTime} {c.launch.timezone ? `(${c.launch.timezone})` : ""}</>
                      )}
                    </p>
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
        </ul>
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
    toast.success(`${n.number} set as caller ID`, {
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
          Config is locked to the original run — upload the new contact list and set the timing.
          Caller ID, language, and dialing stay identical so analytics aggregate across runs.
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
            placeholder="e.g. Q3 Renewals — EN West"
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
          <Label className="text-sm font-medium">Caller-ID number</Label>
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
                    : `assigned to ${n.assignedAgent?.name ?? n.label}`} — a line can&apos;t answer and dial at once
                </SelectItem>
              ))}
              <SelectSeparator />
              <SelectItem value={ADD_NUMBER} className="text-muted-foreground">
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add phone number (SIP)
              </SelectItem>
            </SelectContent>
          </Select>
          <AddPhoneNumberSheet open={addOpen} onOpenChange={setAddOpen} onAdded={addedNumber} />
        </div>
      </div>

      <CampaignContacts draft={draft} campaign={campaign} onChange={onChange} />

      <CampaignLaunchFields campaign={campaign} onChange={onChange} />
      <CampaignDialingFields campaign={campaign} onChange={onChange} disabled={locked} />

      <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!campaign.name.trim() || (locked && !campaign.csvName)} onClick={onSave}>
          {locked ? "Save rerun" : isNew ? "Save run" : "Save changes"}
        </Button>
      </div>
    </div>
  )
}

// ─── Contacts — the campaign's CSV (upload · coverage · scrolling preview) ────

// Deterministic preview rows (wireframe): enough to show real shape + internal
// scrolling without ever growing the page.
const PREVIEW_NAMES = [
  "Ava Chen", "Liam Patel", "Maya Ortiz", "Noah Kim", "Zoe Ahmed", "Eli Novak",
  "Ivy Santos", "Owen Brooks", "Lea Fischer", "Max Rivera", "Nia Kowalski", "Theo Lang",
  "Ana Costa", "Ben Haddad", "Mia Johansson", "Raj Mehta", "Sara Lind", "Tom Baker",
  "Uma Rao", "Vik Sharma", "Wes Cole", "Ines Duarte", "Yara Aziz", "Zack Moore",
]
const PREVIEW_ROWS = PREVIEW_NAMES.map((name, i) => ({
  phone: `+1 (415) 555-${String(1204 + i * 7).slice(-4)}`,
  name,
  account: `AC-${2400 + i * 13}`,
  balance: `$${(140 + i * 37) % 900}.${String(20 + (i * 7) % 80).padStart(2, "0")}`,
  dueDate: `2026-08-${String(1 + (i % 28)).padStart(2, "0")}`,
}))

function CampaignContacts({
  draft, campaign, onChange,
}: {
  draft: AgentDraft
  campaign: CampaignDraft
  onChange: (patch: Partial<CampaignDraft>) => void
}) {
  const hasCsv = !!campaign.csvName
  const missing = campaignMissingVars(draft, campaign)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  // Coverage AHA: the moment every {{variable}} finds its column, the green
  // check pops. Keyed so the one-shot replays.
  const varsCovered = hasCsv && missing.length === 0 && extractVars(`${draft.systemPrompt} ${draft.greeting}`).length > 0
  const prevCovered = React.useRef(varsCovered)
  const [coveredFlash, setCoveredFlash] = React.useState(0)
  React.useEffect(() => {
    if (varsCovered && !prevCovered.current) setCoveredFlash((k) => k + 1)
    prevCovered.current = varsCovered
  }, [varsCovered])

  const attachCsv = () => {
    onChange({ csvName: "contacts.csv", contacts: MOCK_CSV_ROWS })
    toast.success("contacts.csv attached", {
      description: `${MOCK_CSV_ROWS} contacts · columns: ${MOCK_CSV_COLUMNS.join(", ")}`,
    })
  }

  if (!hasCsv) {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Contacts CSV</Label>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={attachCsv}>
            <Upload className="h-3.5 w-3.5" aria-hidden /> Upload contacts CSV
          </Button>
          <button
            type="button"
            onClick={() => toast("Template downloaded", { description: `Columns: ${MOCK_CSV_COLUMNS.join(", ")}` })}
            className="rounded text-xs text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Download template
          </button>
        </div>
        <p className="text-xs text-muted-foreground">One row per contact — columns become {"{{variables}}"}.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {/* One summary bar — file · count · coverage · actions. */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-medium">{campaign.contacts ?? MOCK_CSV_ROWS} contacts</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{campaign.csvName}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setPreviewOpen((v) => !v)}>
            {previewOpen ? "Hide preview" : `Preview ${PREVIEW_ROWS.length} rows`}
          </Button>
          <Button variant="outline" size="sm" onClick={attachCsv}>Replace file</Button>
        </div>
      </div>

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
          {extractVars(`${draft.systemPrompt} ${draft.greeting}`).length > 0
            ? `${extractVars(`${draft.systemPrompt} ${draft.greeting}`).length}/${extractVars(`${draft.systemPrompt} ${draft.greeting}`).length} {{variables}} covered.`
            : "No {{variables}} in your prompt yet — add them in Context to personalize each call."}
        </p>
      ) : (
        <div className="flex items-start gap-2.5 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-xs leading-relaxed text-foreground">
            Missing {missing.length} prompt variable{missing.length > 1 ? "s" : ""}:{" "}
            {missing.map((v) => `{{${v}}}`).join(", ")} — add the columns, or remove them from
            the prompt. Deploy stays blocked until they match.
          </p>
        </div>
      )}

      {/* Preview collapsed by default (owner 2026-07-29: cut the visual mass —
          the table scrolls inside its panel when opened). */}
      {previewOpen && (
        <div className="max-h-[300px] overflow-y-auto rounded-md border border-border">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow>
                <TableHead>Phone number</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Due date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PREVIEW_ROWS.map((r) => (
                <TableRow key={r.phone}>
                  <TableCell className="font-mono text-xs">{r.phone}</TableCell>
                  <TableCell className="text-sm">{r.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.account}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.balance}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{r.dueDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
