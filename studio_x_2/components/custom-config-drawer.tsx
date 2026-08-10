"use client"

import * as React from "react"
import { Code2, Check, AlertTriangle, Import, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import {
  CUSTOM_CONFIG_SKELETON, customConfigSections, type AgentDraft,
} from "@/lib/wizard-draft"

/**
 * CustomConfigDrawer — "Custom Config" (Figma 2919-56980): per-section JSON
 * OVERRIDES on top of the visual editor, using the engine's own property
 * blocks (asr · llm · tts · avatar · turn_detection · interruption ·
 * conversation · sal). Empty objects do nothing; a section with properties
 * takes over its visual controls, which then flag "Overridden by Custom
 * Config" and lock until the section is emptied here.
 *
 * Replaces the earlier whole-agent-as-JSON drawer (2026-07-28) — that concept
 * exported the draft; this one is the power-user OVERRIDE door the design
 * specifies. Get-code snippets live in Deployment › Code/SDK.
 */
export function CustomConfigDrawer({
  draft,
  onApply,
  iconOnly,
}: {
  draft: AgentDraft
  /** Persist the raw JSON + the section names it overrides. */
  onApply?: (raw: string, sections: string[]) => void
  /** Header renders this as an icon-only </> button. */
  iconOnly?: boolean
  /** Kept for call-site compatibility; the new drawer has no jump chips. */
  onEditStep?: (step: number) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [text, setText] = React.useState(draft.customConfig ?? CUSTOM_CONFIG_SKELETON)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const onOpen = (e: Event) => { e.preventDefault(); setOpen(true) }
    window.addEventListener("sx:open-config-drawer", onOpen)
    return () => window.removeEventListener("sx:open-config-drawer", onOpen)
  }, [])

  // Reopen fresh from the draft — an unapplied edit doesn't survive a close.
  React.useEffect(() => {
    if (open) { setText(draft.customConfig ?? CUSTOM_CONFIG_SKELETON); setError(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onText = (v: string) => {
    setText(v)
    try { JSON.parse(v); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : "Invalid JSON") }
  }

  /** Import Existing — the current visual-editor settings, as override JSON. */
  const importExisting = () => {
    const adv = draft.advanced
    const filled = {
      asr: { vendor: draft.stack.asr.vendor, model: draft.stack.asr.model },
      llm: { vendor: draft.stack.llm.vendor, model: draft.stack.llm.model },
      tts: { vendor: draft.stack.tts.vendor, voice: draft.stack.tts.voice },
      avatar: {},
      turn_detection: adv
        ? { enabled: adv.turnDetection.enabled, preset: adv.turnDetection.preset, threshold: adv.turnDetection.threshold }
        : {},
      interruption: adv
        ? { speaking_interrupt_duration_ms: adv.startOfSpeech.interruptMs, prefix_padding_ms: adv.startOfSpeech.prefixPaddingMs }
        : {},
      conversation: adv ? { max_history_messages: adv.history.maxMessages } : {},
      sal: adv?.attentionLocking.enabled ? { mode: adv.attentionLocking.mode } : {},
    }
    onText(JSON.stringify(filled, null, 2))
  }

  const reset = () => onText(CUSTOM_CONFIG_SKELETON)

  const apply = () => {
    let sections: string[]
    try { sections = customConfigSections(text) }
    catch { setError("Invalid JSON"); return }
    onApply?.(text, sections)
    setOpen(false)
  }

  const lines = text.split("\n")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {iconOnly ? (
          <Button variant="ghost" size="icon" className="size-8" aria-label="Custom config (JSON)">
            <Code2 className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className="gap-1.5">
            <Code2 className="h-4 w-4" aria-hidden /> Custom Config
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Custom Config</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Add custom properties to override the corresponding visual editor settings.
            Empty objects ({"{}"}) have no effect. Only sections with properties will be overridden.
          </p>
        </SheetHeader>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-2.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{lines.length} lines</span>
            {error ? (
              <Badge variant="destructive" className="gap-1 text-xs">
                <AlertTriangle className="h-3 w-3" aria-hidden /> Invalid JSON
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1 bg-success/15 text-xs text-success">
                <Check className="h-3 w-3" aria-hidden /> Valid JSON
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={importExisting}>
              <Import className="h-3.5 w-3.5" aria-hidden /> Import Existing
            </Button>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
            </Button>
          </div>
        </div>

        {/* Line-numbered editor — a gutter beside a bare textarea. */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex min-h-full font-mono text-xs leading-6">
            <div aria-hidden className="select-none border-r border-border bg-muted/30 px-2.5 py-3 text-right tabular-nums text-muted-foreground/60">
              {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <textarea
              value={text}
              onChange={(e) => onText(e.target.value)}
              spellCheck={false}
              aria-label="Custom config JSON"
              className="min-h-full w-full resize-none bg-transparent px-3 py-3 leading-6 outline-none"
              rows={Math.max(lines.length + 2, 24)}
            />
          </div>
        </div>

        {error && (
          <p className="shrink-0 border-t border-border px-5 py-2 text-xs text-destructive">{error}</p>
        )}
        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button className="w-full" disabled={!!error} onClick={apply}>
            Apply Config
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
