"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { InfoHint } from "@/components/wizard/info-hint"
import {
  ASR_LANGUAGES, recognitionOf, vocabularyCarry, vocabularyProblems, vocabularySupport,
  type RecognitionConfig,
} from "@/lib/asr-vocabulary"
import type { BackupConfig } from "@/lib/backup-providers"
import type { AgentStack } from "@/lib/campaign-data"

/**
 * Recognition (design 03) — inside Configure STT, under the vendor that has to
 * do the recognising.
 *
 * It lives here rather than on a page of its own because the answer to "will
 * these words be heard" depends entirely on which recogniser is selected two
 * rows above, and on which backups take over when it fails. Splitting them
 * would put the question and its answer on different screens.
 */
export function RecognitionSection({
  stack, backup, value, onChange,
}: {
  stack: AgentStack
  backup?: BackupConfig
  value?: RecognitionConfig
  onChange: (r: RecognitionConfig) => void
}) {
  const r = recognitionOf(value, stack.language)
  const support = vocabularySupport(stack.asr.vendor, stack.asr.model)
  const carry = vocabularyCarry({ stack, backup, words: r.vocabulary })
  const problems = vocabularyProblems(r.vocabulary, support)
  const [draft, setDraft] = React.useState("")

  const add = () => {
    const words = draft.split(",").map((w) => w.trim()).filter(Boolean)
    if (!words.length) return
    onChange({ ...r, vocabulary: [...new Set([...r.vocabulary, ...words])] })
    setDraft("")
  }
  const remove = (w: string) => onChange({ ...r, vocabulary: r.vocabulary.filter((x) => x !== w) })

  return (
    <section data-design-focus="recognition" className="mt-6 space-y-4 border-t border-border pt-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Recognition</p>

      {/* One language, deliberately. Retell's own guidance is that a
          single-language agent is the most accurate one, and the join contract
          takes one tag. All 32 are here: the ten the console used to list made
          the other 22 look unsupported. */}
      <div className="space-y-1.5">
        <Label htmlFor="rec-language" className="text-sm font-medium">Language</Label>
        <Select value={r.language} onValueChange={(language) => onChange({ ...r, language })}>
          <SelectTrigger id="rec-language" className="w-full text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            {ASR_LANGUAGES.map((l) => (
              <SelectItem key={l.tag} value={l.tag}>
                <span className="flex w-full items-baseline justify-between gap-3">
                  <span>{l.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">{l.tag}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* The vocabulary. One list, mapped to whichever field this vendor has. */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Label htmlFor="rec-word" className="text-sm font-medium">
            Vocabulary{" "}
            <InfoHint label="What this does">
              Brand names, product names and jargon the agent has to get right. Common words
              belong in the prompt, not here.
            </InfoHint>
          </Label>
          {support.field && (
            <span className={cn("font-mono text-xs", problems.length ? "text-warning" : "text-muted-foreground")}>
              {r.vocabulary.length}{support.limit ? ` / ${support.limit}` : ""} words
            </span>
          )}
        </div>

        {support.field ? (
          <>
            {r.vocabulary.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {r.vocabulary.map((w) => (
                  <li key={w}>
                    <span className="inline-flex items-center gap-1 rounded-full border border-stroke bg-muted/40 py-0.5 pl-2.5 pr-1 text-xs">
                      {w}
                      <button
                        type="button"
                        onClick={() => remove(w)}
                        aria-label={`Remove ${w}`}
                        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3" aria-hidden />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                id="rec-word"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
                placeholder="Nyquist, SmartFlow Pro, EBITDA"
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" onClick={add} disabled={!draft.trim()}>
                <Plus className="size-3.5" aria-hidden /> Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{support.note}</p>
            {problems.map((p) => <p key={p} className="text-xs text-warning">{p}</p>)}
          </>
        ) : (
          // Never a blank control that accepts words and drops them. The vendor
          // has no field, so the row says which one does.
          <p className="rounded-md border border-dashed border-stroke px-3 py-2.5 text-xs text-muted-foreground">
            {support.note || `${stack.asr.vendor} has no word list.`} Switch to Deepgram Nova-3 to use one.
          </p>
        )}
      </div>

      {/* The rainy path nobody shows: the backup takes over and the names
          start coming back wrong. Say it before the call, not after. */}
      {support.field && r.vocabulary.length > 0 && carry.backups.length > 0 && (
        <div className="space-y-1 rounded-md border border-stroke px-3 py-2.5">
          <p className="text-xs font-medium">If {stack.asr.vendor} fails</p>
          <ul className="space-y-0.5">
            {carry.backups.map((b, i) => (
              <li key={`${b.vendor}-${i}`} className={cn("text-xs", b.carries === 0 ? "text-warning" : "text-muted-foreground")}>
                {b.vendor} {b.carries === 0
                  ? "cannot be given these words, so names may come back wrong."
                  : b.carries < r.vocabulary.length
                    ? `takes ${b.carries} of ${r.vocabulary.length}.`
                    : "takes all of them."}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* A real roadmap item, shown as one: the engine holds a single language
          tag, so switching mid-call is not something we can honour yet. */}
      <div className="space-y-1.5 opacity-60">
        <Label className="text-sm font-medium">Also understands</Label>
        <div className="flex h-9 items-center rounded-md border border-dashed border-stroke px-3 text-xs text-muted-foreground">
          Needs engine support
        </div>
        <p className="text-xs text-muted-foreground">
          A caller who switches language mid-call is transcribed in {ASR_LANGUAGES.find((l) => l.tag === r.language)?.label ?? r.language} until this lands.
        </p>
      </div>
    </section>
  )
}

/** "English (United States) · 5 words" — the recap under the STT row, so the
 *  settings are legible without opening the sheet. */
export function recognitionRecap(value: RecognitionConfig | undefined, spoken?: string): string {
  const r = recognitionOf(value, spoken)
  const lang = ASR_LANGUAGES.find((l) => l.tag === r.language)?.label ?? r.language
  return r.vocabulary.length ? `${lang} · ${r.vocabulary.length} words` : lang
}
