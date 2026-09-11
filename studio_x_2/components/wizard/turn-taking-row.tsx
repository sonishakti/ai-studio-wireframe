"use client"

import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { DEFAULT_ADVANCED, type AdvancedConfig } from "@/lib/wizard-draft"
import {
  applyTurnPreset, turnTakingRecap, TURN_PRESET_LABELS, TURN_PRESET_ORDER, type TurnPreset,
} from "@/lib/turn-taking"

/** The raw rows' anchor — `Custom` points down to them. */
const RAW_ROWS_ID = "wz-4-turntaking"

/**
 * Turn-taking row (Design Tracker 02, verdict A): one row above the raw rows.
 * Presets in the words that already exist; the recap says what they do in
 * numbers; Custom folds to the raw rows, which own the state.
 */
export function TurnTakingRow({
  value,
  onChange,
}: {
  value: AdvancedConfig | undefined
  onChange: (next: AdvancedConfig) => void
}) {
  const adv = value ?? DEFAULT_ADVANCED

  const apply = (next: string) => {
    if (!next) return // Radix clears on re-click; a preset is never "none".
    const preset = next as TurnPreset
    onChange(applyTurnPreset(adv, preset))
    if (preset === "custom") {
      document.getElementById(RAW_ROWS_ID)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <SectionRow
      id="wz-4-turn-taking"
      focusId="turn-taking"
      label="Turn-taking"
      hint={
        <InfoHint label="How the agent listens and takes its turn">
          Interrupts = speech needed while the agent talks. Waits = silence before it answers.
        </InfoHint>
      }
    >
      <div className="space-y-2">
        <ToggleGroup
          type="single"
          variant="outline"
          value={adv.turnDetection.preset}
          onValueChange={apply}
          aria-label="Turn-taking preset"
          className="flex-wrap"
        >
          {TURN_PRESET_ORDER.map((p) => (
            <ToggleGroupItem
              key={p}
              value={p}
              className="border-stroke data-[state=on]:border-primary data-[state=on]:bg-primary/5"
            >
              {TURN_PRESET_LABELS[p]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
          {turnTakingRecap(adv).join(" · ")}
        </p>
      </div>
    </SectionRow>
  )
}
