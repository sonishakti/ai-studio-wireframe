"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import {
  backupOf, planBackups, SLOT_LABEL, type BackupConfig, type BackupSlot, type BackupSlotPlan,
} from "@/lib/backup-providers"
import { draftHosting, type AgentDraft } from "@/lib/wizard-draft"

/**
 * Backup providers — Design Tracker 07 (verdict A + B + C, 2026-09-11).
 * One row under the model stack: a switch (on by default), a status chip, the
 * per-component recap in mono, a "Change backups" fold with the ordered pool
 * and its eligibility, and one disabled "Test failover" button that names the
 * Engine dependency. Nothing here pretends to be wired: the pool is a draft
 * field until the Engine failover contract (P1 · Nov) ships.
 */
export function BackupProvidersRow({
  draft,
  update,
  onUnpinRegion,
}: {
  draft: AgentDraft
  update: (patch: Partial<AgentDraft>) => void
  /** Jumps to the hosting region control in Deployment. */
  onUnpinRegion?: () => void
}) {
  const backup = backupOf(draft.backup)
  const plan = React.useMemo(
    () => planBackups({ stack: draft.stack, hosting: draftHosting(draft), backup }),
    [draft, backup],
  )
  const [open, setOpen] = React.useState(false)
  const patch = (p: Partial<BackupConfig>) => update({ backup: { ...backup, ...p } })
  const pick = (slot: BackupSlot, id: string) => patch({ picks: { ...backup.picks, [slot]: id } })
  const mllm = draft.stack.pipeline === "mllm"

  if (mllm) return null

  return (
    <SectionRow
      id="wz-1-backup"
      label="Backup providers"
      hint={
        <InfoHint label="Agora keeps a backup ready">
          If a vendor is slow, down or blocked in your region, the call continues on the backup.
          Managed components are covered by Agora at no extra cost; a component on your own key needs a second key.
          Switching is never silent. Every switch shows in the session log.
        </InfoHint>
      }
    >
      <div data-design-focus="backup-providers" className="space-y-3">
        {/* Header line: switch · status · the one button. */}
        <div className="flex flex-wrap items-center gap-3">
          <Switch
            checked={backup.enabled}
            onCheckedChange={(enabled) => patch({ enabled })}
            aria-label="Backup providers"
          />
          <Badge
            variant={plan.enabled && plan.covered < plan.slots.length ? "warning" : "secondary"}
            className="font-normal"
          >
            {plan.status}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              {/* A disabled button inside a tooltip needs a focusable wrapper. */}
              <span className="ml-auto inline-flex" tabIndex={0}>
                <Button variant="outline" size="sm" className="gap-1.5" disabled aria-label="Test failover">
                  <Play className="h-3.5 w-3.5" aria-hidden /> Test failover
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Requires Engine failover · Nov</TooltipContent>
          </Tooltip>
        </div>

        {plan.enabled && (
          <>
            {/* Recap — primary → backup per component, in the caller's words. */}
            <ul className="space-y-1 font-mono text-xs" aria-label="Backups per component">
              {plan.slots.map((s) => (
                <li key={s.slot} className="flex flex-wrap items-center gap-x-1.5">
                  <span className="w-8 shrink-0 text-muted-foreground">{SLOT_LABEL[s.slot]}</span>
                  <span className="text-foreground">{s.primary.label}</span>
                  {s.primary.byo && <span className="text-muted-foreground">· your key</span>}
                  <span className="text-muted-foreground" aria-hidden>→</span>
                  {s.state === "covered" && s.backup ? (
                    <span className="text-foreground">
                      {s.backup.label}
                      {s.slot === "tts" && s.backup.voiceMapped && <span className="text-muted-foreground"> · voice mapped</span>}
                    </span>
                  ) : (
                    <>
                      <span className="text-warning">no backup</span>
                      {s.state === "needs-key" && (
                        <Link href="/project/vendor-credentials" className="text-foreground underline underline-offset-4 hover:text-foreground/80">
                          Add a key
                        </Link>
                      )}
                      {s.state === "no-match" && onUnpinRegion && (
                        <button type="button" onClick={onUnpinRegion} className="text-foreground underline underline-offset-4">
                          Unpin region
                        </button>
                      )}
                      {s.note && <span className="text-muted-foreground">· {s.note}</span>}
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* The fold: the ordered pool per component, with eligibility. */}
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="wz-1-backup-fold"
              className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Change backups
              <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} aria-hidden />
            </button>
            {open && (
              <div id="wz-1-backup-fold" className="divide-y divide-border rounded-md border border-stroke">
                <div className="grid grid-cols-[3rem_1fr_1fr] gap-3 px-3 py-2 text-xs text-muted-foreground">
                  <span />
                  <span>Primary</span>
                  <span>Backup</span>
                </div>
                {plan.slots.map((s) => (
                  <BackupSlotRow key={s.slot} plan={s} pickedId={backup.picks[s.slot]} onPick={(id) => pick(s.slot, id)} />
                ))}
                {plan.pinnedArea && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Backups are limited to vendors serving {plan.pinnedArea} because the hosting region is pinned.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </SectionRow>
  )
}

function BackupSlotRow({
  plan, pickedId, onPick,
}: {
  plan: BackupSlotPlan
  pickedId?: string
  onPick: (id: string) => void
}) {
  const value = plan.backup?.id ?? pickedId ?? ""
  return (
    <div className="grid grid-cols-[3rem_1fr_1fr] items-center gap-3 px-3 py-2">
      <span className="font-mono text-xs text-muted-foreground">{SLOT_LABEL[plan.slot]}</span>
      <span className="min-w-0 truncate text-sm">
        {plan.primary.label}
        <span className="ml-1.5 text-xs text-muted-foreground">{plan.primary.byo ? "your key" : "managed"}</span>
      </span>
      {plan.state === "needs-key" ? (
        <span className="text-xs text-muted-foreground">
          Needs a second key ·{" "}
          <Link href="/project/vendor-credentials" className="text-foreground underline underline-offset-4">Add a key</Link>
        </span>
      ) : (
        <Select value={value} onValueChange={onPick}>
          <SelectTrigger className="h-8 w-full text-sm" aria-label={`Backup for ${SLOT_LABEL[plan.slot]}`}>
            <SelectValue placeholder="No eligible backup" />
          </SelectTrigger>
          <SelectContent>
            {plan.eligible.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
            {/* Ineligible backups are shown but dead — never silently hidden. */}
            {plan.ineligible.map(({ candidate, why }) => (
              <SelectItem key={candidate.id} value={candidate.id} disabled>
                {candidate.label} · {why}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
