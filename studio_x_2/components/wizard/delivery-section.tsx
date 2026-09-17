"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { InfoHint } from "@/components/wizard/info-hint"
import {
  deliveryOf, paceLabel, paceRange, pronunciationSupport, toneField, vendorHandles,
  type DeliveryConfig,
} from "@/lib/tts-expression"
import type { AgentStack } from "@/lib/campaign-data"

/**
 * Delivery (design 06) — inside Configure TTS, under the voice it shapes.
 *
 * Two vendors taught this section its grammar. ElevenLabs writes its handles as
 * the two ends of the scale ("More expressive" against "More consistent") with
 * no number anywhere; Vapi writes Speed as "Slower" against "Faster". Neither
 * shows a figure, because the figure is not the decision. So the ends carry the
 * label and the vendor's own number sits beside it for anyone who needs it.
 *
 * What never appears is a control the vendor cannot honour. A Pace slider on a
 * voice with no speed field would be a dial wired to nothing.
 */
export function DeliverySection({
  stack, value, onChange,
}: {
  stack: AgentStack
  value?: DeliveryConfig
  onChange: (d: DeliveryConfig) => void
}) {
  const d = deliveryOf(value)
  const vendor = stack.tts.vendor
  const range = paceRange(vendor)
  const handles = vendorHandles(vendor)
  const tone = toneField(vendor)
  const pron = pronunciationSupport(vendor)
  const rules = d.pronunciation ?? []

  const patch = (p: Partial<DeliveryConfig>) => onChange({ ...d, ...p })
  const setHandle = (key: string, n: number) => patch({ handles: { ...d.handles, [key]: n } })
  const setRule = (i: number, p: Partial<{ word: string; sayAs: string }>) =>
    patch({ pronunciation: rules.map((r, n) => (n === i ? { ...r, ...p } : r)) })

  return (
    <section data-design-focus="delivery" className="mt-6 space-y-5 border-t border-border pt-5">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Delivery</p>

      {/* Pace — one handle that means the same thing on every vendor that has
          a speed field, because twelve vendor scales is not a thing to learn. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="dl-pace" className="text-sm font-medium">Pace</Label>
          {range && <span className="font-mono text-xs text-muted-foreground">{paceLabel(d.pace ?? 50, vendor)}</span>}
        </div>
        {range ? (
          <>
            <Slider
              id="dl-pace"
              value={[d.pace ?? 50]}
              min={0}
              max={100}
              step={1}
              onValueChange={([pace]) => patch({ pace })}
              aria-label="Pace"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slower</span><span>Faster</span>
            </div>
          </>
        ) : (
          <p className="rounded-md border border-dashed border-stroke px-3 py-2.5 text-xs text-muted-foreground">
            {vendor} voices speak at a fixed pace.
          </p>
        )}
      </div>

      {/* Vendor-native handles. Only the ones this vendor really has, in its
          own range, named the way it names them. */}
      {handles.map((h) => {
        const n = d.handles?.[h.key] ?? h.default
        return (
          <div key={h.key} className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor={`dl-${h.key}`} className="text-sm font-medium">{h.label}</Label>
              <span className="font-mono text-xs text-muted-foreground">{n}</span>
            </div>
            <Slider
              id={`dl-${h.key}`}
              value={[n]}
              min={h.min}
              max={h.max}
              step={h.step}
              onValueChange={([v]) => setHandle(h.key, v)}
              aria-label={h.label}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{h.low}</span><span>{h.high}</span>
            </div>
          </div>
        )
      })}

      {/* Tone is a prompt, and only some vendors take one. Writing it into the
          system prompt instead would change what the agent SAYS to change how
          it sounds, which is a different thing wearing the same label. */}
      <div className="space-y-1.5">
        <Label htmlFor="dl-tone" className="text-sm font-medium">
          Tone{" "}
          <InfoHint label="What this does">
            A line of direction for the voice, like notes to a narrator: &quot;warm, unhurried,
            slight smile&quot;.
          </InfoHint>
        </Label>
        {tone ? (
          <Textarea
            id="dl-tone"
            value={d.tone ?? ""}
            onChange={(e) => patch({ tone: e.target.value })}
            placeholder="Warm and unhurried, with a slight smile"
            className="min-h-[56px] text-sm"
          />
        ) : (
          <p className="rounded-md border border-dashed border-stroke px-3 py-2.5 text-xs text-muted-foreground">
            {vendor} takes no direction for the voice. The handles above are the way to shape it.
          </p>
        )}
      </div>

      {/* Pronunciation works on every vendor, by one of two mechanisms. The row
          names which one you are getting, because the limits differ. */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <Label className="text-sm font-medium">Pronunciation</Label>
          <span className="font-mono text-xs text-muted-foreground">{rules.length} / {pron.limit}</span>
        </div>
        {rules.length > 0 && (
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2">
                <Input
                  value={r.word}
                  onChange={(e) => setRule(i, { word: e.target.value })}
                  placeholder="Nyquist"
                  aria-label={`Word ${i + 1}`}
                  className="text-sm"
                />
                <Input
                  value={r.sayAs}
                  onChange={(e) => setRule(i, { sayAs: e.target.value })}
                  placeholder="nye-kwist"
                  aria-label={`Say it as, ${i + 1}`}
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground"
                  aria-label={`Remove pronunciation ${i + 1}`}
                  onClick={() => patch({ pronunciation: rules.filter((_, n) => n !== i) })}
                >
                  <X className="size-3.5" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={rules.length >= pron.limit}
          onClick={() => patch({ pronunciation: [...rules, { word: "", sayAs: "" }] })}
        >
          <Plus className="size-3.5" aria-hidden /> Add a word
        </Button>
        <p className="text-xs text-muted-foreground">{pron.note}</p>
      </div>
    </section>
  )
}
