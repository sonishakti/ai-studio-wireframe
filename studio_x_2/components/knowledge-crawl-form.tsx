"use client"

import * as React from "react"
import { Copy, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InfoHint } from "@/components/wizard/info-hint"
import { ENGINE_TOOLTIP } from "@/components/wizard/engine-row"
import {
  mockCrawl, findSourceByAddress, CRAWLER_UA, CRAWL_PAGE_CAP, SKIP_REASON_LABEL,
  type CrawlLedger,
} from "@/lib/knowledge-sources"

/**
 * Crawl a site, and the page ledger it owes back (design 20, direction B).
 *
 * Built once and mounted twice — inside the create form's site body, where no
 * base exists yet, and inside the base sheet's "Crawl a site" door. One door
 * per action means one component, not two that drift.
 *
 * Three things are on the surface BEFORE the crawl, because each of them is a
 * silent failure otherwise (learning 5): who is knocking (`CRAWLER_UA`, copied
 * the way the egress IP is copied at external-retrieval-form.tsx:223-236),
 * that pages behind a login are skipped, and where the crawl stops. The
 * duplicate check names the base that already reads the address rather than
 * letting the same site land in two. Nothing here is built yet, so the caption
 * and `ENGINE_TOOLTIP` on Start crawl mark the whole block as stated intent.
 */
export function CrawlSourceForm({
  kbId,
  onCrawled,
}: {
  /** Absent in the create form: the crawl runs before a base exists. The
   *  duplicate check spans every base either way. */
  kbId?: string
  onCrawled: (address: string, ledger: CrawlLedger) => void
}) {
  const [address, setAddress] = React.useState("")
  const [crawling, setCrawling] = React.useState(false)
  const [ledger, setLedger] = React.useState<CrawlLedger | null>(null)

  // Two mounts can sit on one page (the row's sheet and the Resources sheet),
  // so the field's id is per-base rather than a constant.
  const fieldId = kbId ? `crawl-address-${kbId}` : "crawl-address"

  const valid = /^(https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(address.trim())
  const duplicate = React.useMemo(
    () => (valid ? findSourceByAddress(address) : undefined),
    [address, valid],
  )

  const start = () => {
    setCrawling(true)
    setLedger(null)
    window.setTimeout(() => {
      const result = mockCrawl(address)
      setLedger(result)
      setCrawling(false)
      onCrawled(address.trim(), result)
      // A crawl that read nothing reports that on the surface; a success toast
      // over it would be the second voice saying the opposite.
      if (result.found > 0) {
        toast.success("Crawl finished", {
          description: `${result.kept} ${result.kept === 1 ? "page" : "pages"} kept, ${result.skipped.length} skipped.`,
        })
      }
    }, 900)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor={fieldId} className="text-sm font-medium">Website address</Label>
        <Input
          id={fieldId}
          value={address}
          onChange={(e) => { setAddress(e.target.value); setLedger(null) }}
          placeholder="https://docs.example.com"
          className="font-mono text-sm"
          onKeyDown={(e) => { if (e.key === "Enter" && valid && !crawling) start() }}
        />
        <p className="text-xs text-muted-foreground">
          Public pages only: pages behind a login are skipped.
        </p>
      </div>

      {duplicate && (
        <p className="text-xs text-warning">{duplicate.kbName} already reads this address.</p>
      )}

      {/* Who is knocking — the egress-IP row's shape, because it answers the
          same question: what do I allowlist? */}
      <div className="space-y-1.5 rounded border border-border bg-card p-2.5">
        <p className="text-xs text-muted-foreground">
          Our crawler reads as this user agent and follows robots.txt. Add it to your
          allowlist if the site blocks unknown crawlers.
        </p>
        <div className="flex items-center gap-2">
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{CRAWLER_UA}</code>
          <Button
            variant="ghost" size="sm" className="h-6 gap-1 px-1.5 text-xs"
            onClick={() => { navigator.clipboard?.writeText(CRAWLER_UA); toast.success("User agent copied") }}
          >
            <Copy className="h-3 w-3" /> Copy
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <InfoHint label="What a crawl covers">
          A crawl stops at {CRAWL_PAGE_CAP} pages. Split a bigger site across two bases.
        </InfoHint>
        <p className="text-xs text-muted-foreground">Requires Engine · planned</p>
      </div>

      {/* Outline: the fold's one primary belongs to the form that hosts this. */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" onClick={start} disabled={!valid || crawling} className="gap-1.5">
            {crawling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Start crawl
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-72" side="top">{ENGINE_TOOLTIP}</TooltipContent>
      </Tooltip>

      {ledger && (ledger.found === 0 ? (
        <div className="rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm">
          No readable text on any page. Check that the site renders without JavaScript.
        </div>
      ) : (
        <div className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">
              Pages found <span className="tabular-nums">{ledger.found}</span> in {durationLabel(ledger.ms)}
            </p>
            <span className="text-xs text-muted-foreground">Requires Engine · planned</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <LedgerCell label="Kept" value={ledger.kept} />
            <LedgerCell label="Skipped" value={ledger.skipped.length} />
            <LedgerCell label="Failed" value={ledger.failed} />
          </div>

          {ledger.cappedAt !== undefined && (
            <p className="text-xs text-muted-foreground">
              Stopped at the {ledger.cappedAt} page cap.
            </p>
          )}

          {ledger.skipped.length > 0 && (
            <ul className="divide-y divide-border border-t border-border">
              {ledger.skipped.map((s) => (
                <li key={s.path} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="truncate font-mono text-xs text-muted-foreground">{s.path}</span>
                  <span className="shrink-0 text-xs">{SKIP_REASON_LABEL[s.reason]}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}

function LedgerCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-border px-2.5 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium tabular-nums">{value}</p>
    </div>
  )
}

/** "1 min 40 s" — a crawl is measured in minutes, and a bare millisecond count
 *  reads as a latency number, which this is not. */
function durationLabel(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const min = Math.floor(total / 60)
  const sec = total % 60
  if (min === 0) return `${sec} s`
  return sec === 0 ? `${min} min` : `${min} min ${sec} s`
}
