"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, AlertCircle, Check, Minus, ArrowRight } from "lucide-react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
  SheetFooter, SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/code-block"
import { track } from "@/lib/analytics"
import {
  IMPORT_SOURCES, parseImport, VENDOR_EXAMPLES, VENDOR_FIELD_HINTS,
  type ImportSource, type ImportParseResult,
} from "@/lib/import-agent"
import type { ImportedAgentConfig } from "@/lib/campaign-data"

// ─── component ───────────────────────────────────────────────────────────────

export function ImportAgentSheet({
  children,
  onImported,
}: {
  children: React.ReactNode
  /** Receives the parsed config on "Import as draft". The CALLER owns landing
   *  feedback (destination dialog / landing toast) — the sheet stays silent so
   *  no toast can promise an outcome before the destination is chosen. */
  onImported?: (config: ImportedAgentConfig) => void
}) {
  const [pasted, setPasted] = React.useState("")
  const [source, setSource] = React.useState<ImportSource>("Vapi")
  const [validation, setValidation] = React.useState<ImportParseResult | null>(null)

  const handleValidate = () => {
    // Per-vendor parsers keyed off the chip — the JSON's shape wins when the
    // chip is wrong. Returns the field-mapping report rendered below.
    setValidation(parseImport(pasted, source))
  }

  const handleImport = () => {
    const config = validation?.config
    if (!config) return
    track("agent_imported" as never, {
      source: config.source,
      mapped: validation?.mapped?.length ?? 0,
      dropped: validation?.dropped?.length ?? 0,
    } as never)
    onImported?.(config)
  }

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Import an Agent</SheetTitle>
          <SheetDescription>
            Migrating from another platform? Paste your Vapi, Retell, ElevenLabs, or Bland export —
            or any JSON. We map name, voice, model, prompt, and greeting, and show you exactly what
            didn&apos;t carry. (YAML soon.)
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 space-y-5">
          {/* Coming from — where the user is migrating from */}
          <div className="space-y-2">
            <Label>Coming from</Label>
            <div className="flex flex-wrap gap-2">
              {IMPORT_SOURCES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSource(s); setValidation(null) }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    source === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {source === "Generic JSON"
                ? "Paste any agent config as JSON below."
                : `Copy the full agent object from the ${source} dashboard or API and paste it below.`}
            </p>
            {/* The standalone paste-to-live flow was an orphan route — built
                for switchers, reachable by nobody (user-test #7 P0). This is
                its one door in the product. */}
            <p className="text-xs text-muted-foreground">
              Starting fresh on Agora?{" "}
              <Link
                href="/defect"
                className="inline-flex items-center gap-0.5 rounded font-medium text-foreground underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Try the paste-to-live migration flow <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </p>
          </div>

          {/* Paste is the ONE way in today. The Upload/URL tabs used to sit
              here disabled — dead tabs made testers squint at the working
              parts (user-test #7 P0), so the futures are one honest line. */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="agent-json">Agent config</Label>
              <Textarea
                id="agent-json"
                rows={10}
                value={pasted}
                onChange={(e) => { setPasted(e.target.value); setValidation(null) }}
                placeholder={VENDOR_EXAMPLES[source]}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">{VENDOR_FIELD_HINTS[source]}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={handleValidate} disabled={!pasted.trim()}>
                Validate
              </Button>
              <p className="text-xs text-muted-foreground">File upload and URL import are coming soon.</p>
            </div>
          </div>

          {/* Example — a REAL export shape for the chosen vendor, so the
              "configs map" promise is demonstrable: paste this, see the report. */}
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Example {source === "Generic JSON" ? "config" : `${source} export`}
            </p>
            <CodeBlock language="json" filename={`${source.toLowerCase().replace(/\s+/g, "-")}-agent.json`}>
              {VENDOR_EXAMPLES[source]}
            </CodeBlock>
          </div>

          {/* Validation feedback — the field-mapping report */}
          {validation && <MappingReport result={validation} />}
        </div>

        <SheetFooter className="px-6">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <SheetClose asChild>
            <Button onClick={handleImport} disabled={!validation?.ok}>
              Import as draft
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─── field-mapping report ─────────────────────────────────────────────────────
//
// The user-test S1 wasn't just "parsing failed" — it was a PROMISE failing
// silently. The report makes the promise inspectable: every field that carried
// (and where it landed in the builder), every field that didn't (and why).

function MappingReport({ result }: { result: ImportParseResult }) {
  const [showAllDropped, setShowAllDropped] = React.useState(false)
  if (!result.ok) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 text-sm">
          <p className="font-medium">Couldn&apos;t read that config</p>
          <p className="text-xs text-muted-foreground mt-0.5">{result.error}</p>
        </div>
      </div>
    )
  }

  const mapped = result.mapped ?? []
  const dropped = result.dropped ?? []
  const visibleDropped = showAllDropped ? dropped : dropped.slice(0, 5)

  return (
    <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm space-y-2.5">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium">
            Ready to import — {mapped.length} field{mapped.length === 1 ? "" : "s"} mapped
            {dropped.length > 0 && `, ${dropped.length} didn't carry`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="font-medium text-foreground">{result.config?.name}</span> lands on
            Agora&apos;s bundled stack. Talk to it right after import, free.
          </p>
          {result.detected && (
            <p className="text-xs text-muted-foreground mt-1">
              Parsed as <span className="font-medium text-foreground">{result.detected}</span> —
              that&apos;s what the JSON&apos;s shape says it is.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 border-t border-emerald-500/20 pt-2.5">
        {mapped.map((m) => (
          <div key={m.theirs} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
            <Check className="h-3.5 w-3.5 shrink-0 self-center text-emerald-500" aria-hidden />
            <code className="font-mono text-foreground">{m.theirs}</code>
            <span className="text-muted-foreground">→ {m.ours}</span>
            <span className="min-w-0 text-muted-foreground/80">{m.value}</span>
          </div>
        ))}
        {visibleDropped.map((d) => (
          <div key={d.theirs} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
            <Minus className="h-3.5 w-3.5 shrink-0 self-center text-muted-foreground/70" aria-hidden />
            <code className="font-mono text-muted-foreground">{d.theirs}</code>
            <span className="min-w-0 text-muted-foreground/80">{d.reason}</span>
          </div>
        ))}
        {dropped.length > visibleDropped.length && (
          <button
            type="button"
            onClick={() => setShowAllDropped(true)}
            className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Show {dropped.length - visibleDropped.length} more that didn&apos;t carry
          </button>
        )}
      </div>

      {result.warnings?.map((w) => (
        <Badge key={w} variant="outline" className="text-xs font-normal whitespace-normal text-left h-auto">
          ⚠ {w}
        </Badge>
      ))}
    </div>
  )
}
