"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { stackEstimateFor } from "@/lib/campaign-data"
import { draftHosting, type AgentDraft } from "@/lib/wizard-draft"
import {
  HOSTING_OPTIONS, EXCLUDABLE_AREAS, HOSTING_AUTO, HOSTING_DOCS_URL,
  areaLabel, hostingOption, isPinned, normalizeHosting,
  type HostingArea, type HostingSelection,
} from "@/lib/hosting-regions"
import { type StepProps } from "@/components/wizard/types"

/**
 * Agent hosting region — the FIRST row of section 2 (Deployment).
 *
 * It sits above "How does your agent take calls?" on purpose: hosting is a
 * property of the agent PROCESS, so it applies identically to Inbound, Batch
 * calls, and Code / SDK. Nesting it under one channel would imply the other two
 * run somewhere else.
 *
 * Backed by Agora's `properties.geofence` (area + exclude_area). Unset =
 * Automatic, which is the engine's own documented default — the nearest region
 * by LLM-endpoint IP, with failover. Pinning trades that failover and some
 * out-of-region latency for data residency, so the row says both out loud
 * instead of presenting a bare dropdown.
 *
 * Docs: docs.agora.io/en/conversational-ai/best-practices/regional-restrictions
 */
export function HostingRegionRow({ draft, update }: StepProps) {
  const hosting = draftHosting(draft)
  const opt = hostingOption(hosting.area)
  const pinned = isPinned(hosting)
  const base = stackEstimateFor(draft.stack).latencyMs
  // Figma 2919-59124: exclusions hide behind "+ Add Exclusions" until asked for.
  const [exclusionsOpen, setExclusionsOpen] = React.useState(!!hosting.excludeArea)

  const setArea = (area: HostingSelection) => {
    if (area === hosting.area) return
    // Switching off GLOBAL drops the exclusion — the API rejects that pair, so
    // the UI must not quietly carry a value it can never send.
    const next = normalizeHosting({ area, excludeArea: hosting.excludeArea })
    update({ hosting: next })
    if (hosting.area === "GLOBAL" && hosting.excludeArea && area !== "GLOBAL") {
      toast(`Exclusion cleared`, {
        description: `"Never route to ${areaLabel(hosting.excludeArea)}" only applies to Global. ${areaLabel(area)} already excludes everywhere else.`,
      })
    }
  }

  const setExclude = (v: string) => {
    const excludeArea = v === "__none__" ? undefined : (v as HostingArea)
    update({ hosting: { area: "GLOBAL", ...(excludeArea ? { excludeArea } : {}) } })
  }

  return (
    <SectionRow
      id="wz-2-hosting"
      label="Hosting Region"
      hint={
        /* ONE disclosure holds everything (owner 2026-08-10: the inline
           consequences list + vendor paragraph read as "super complex"). */
        <InfoHint label="What pinning changes">
          Pin a region when a contract or regulation says conversation data must stay inside it
          (GDPR, DPDP, APPI). Automatic runs the agent nearest your model endpoint with failover;
          pinning turns failover off. This pins Agora&apos;s engine only — LLM/TTS/ASR vendors
          process data at their own endpoints (set regional URLs in{" "}
          <a href="/project/vendor-credentials" className="underline underline-offset-2">Vendor Credentials</a>).{" "}
          <a href={HOSTING_DOCS_URL} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
            Agora region docs
          </a>
        </InfoHint>
      }
    >
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground" htmlFor="wz-hosting-area">Region</Label>
        <Select value={hosting.area} onValueChange={(v) => setArea(v as HostingSelection)}>
          <SelectTrigger id="wz-hosting-area" className="w-full text-sm" aria-label="Agent hosting region">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOSTING_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                <span className="flex min-w-0 flex-col gap-0.5 py-0.5">
                  <span>{o.label}</span>
                  <span className="text-xs text-muted-foreground">{o.desc}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Global is the ONLY area that accepts a blocklist (Agora API rule) —
          the "+ Add Exclusions" door (Figma) appears only there, never dead. */}
      {hosting.area === "GLOBAL" && !exclusionsOpen && (
        <div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setExclusionsOpen(true)}>
            <Plus className="h-3.5 w-3.5" aria-hidden /> Add Exclusions
          </Button>
        </div>
      )}
      {hosting.area === "GLOBAL" && exclusionsOpen && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground" htmlFor="wz-hosting-exclude">
            Never route to
          </Label>
          <Select value={hosting.excludeArea ?? "__none__"} onValueChange={setExclude}>
            <SelectTrigger id="wz-hosting-exclude" className="w-full text-sm" aria-label="Excluded region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">No exclusion</SelectItem>
              {EXCLUDABLE_AREAS.map((a) => (
                <SelectItem key={a} value={a}>{areaLabel(a)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            One region only — Agora&apos;s geofence takes a single exclusion, and only under Global.
          </p>
        </div>
      )}

      {/* One line, only when the choice has a consequence worth stating. */}
      {pinned && (
        <p className="text-xs text-muted-foreground">
          Failover off — the agent runs only in {areaLabel(hosting.area)} (~{base} ms in region).
        </p>
      )}
    </SectionRow>
  )
}

/** Exported for the Deployment recap line — kept here so the row and the recap
 *  read from one place. */
export { HOSTING_AUTO }
