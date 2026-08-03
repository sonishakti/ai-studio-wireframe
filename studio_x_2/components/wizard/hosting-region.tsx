"use client"

import * as React from "react"
import { ExternalLink, Globe, Gauge, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
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
      label="Agent hosting region"
      hint={
        <>
          <p>Where the agent process runs — the same for every deployment type below.</p>
          <InfoHint label="When you need to pin this">
            Pin a region when a contract or regulation says conversation data must stay inside it
            (GDPR, India&apos;s DPDP, Japan&apos;s APPI). Otherwise leave it automatic — Agora places the
            agent nearest your model endpoint and fails over when a region degrades.
          </InfoHint>
        </>
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
          so the second control appears only there, never as a dead field. */}
      {hosting.area === "GLOBAL" && (
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

      {/* The consequence of the choice, stated where the choice is made. */}
      <dl id="wz-hosting-consequences" className="divide-y divide-border rounded-md border border-border bg-muted/30 px-3.5">
        <Consequence
          icon={ShieldCheck}
          term="Data residency"
          desc={opt.residency}
        />
        <Consequence
          icon={Gauge}
          term="Latency"
          desc={
            pinned
              ? `~${base} ms to first word in region · about +${opt.outOfRegionMs} ms for callers outside ${areaLabel(hosting.area)}. Wireframe estimate.`
              : `~${base} ms to first word — the engine keeps the agent near your model endpoint. Wireframe estimate.`
          }
        />
        <Consequence
          icon={Globe}
          term="Failover"
          desc={
            pinned
              ? `Disabled. If ${areaLabel(hosting.area)} is unavailable the agent will not start elsewhere — that is the point of a pin.`
              : "Enabled. If a region degrades, the agent moves to the nearest available one."
          }
        />
      </dl>

      {/* The doc's own caveat — pinning the engine does NOT pin your vendors. */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        This pins Agora&apos;s engine only. Your LLM, TTS, and ASR vendors process data wherever their
        endpoint lives — set their regional URLs on the key in{" "}
        <a href="/project/vendor-credentials" className="underline underline-offset-2 hover:text-foreground">
          Vendor Credentials
        </a>
        .{" "}
        <a
          href={HOSTING_DOCS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
        >
          Agora region docs <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </p>
    </SectionRow>
  )
}

function Consequence({
  icon: Icon, term, desc,
}: {
  icon: React.ComponentType<{ className?: string }>
  term: string
  desc: string
}) {
  return (
    <div className="flex items-start gap-2.5 py-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs font-medium">{term}</dt>
        <dd className="text-xs leading-relaxed text-muted-foreground">{desc}</dd>
      </div>
    </div>
  )
}

/** Exported for the Deployment recap line — kept here so the row and the recap
 *  read from one place. */
export { HOSTING_AUTO }
