"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SectionRow } from "@/components/wizard/section-row"
import { InfoHint } from "@/components/wizard/info-hint"
import { EngineRow, FlatRow } from "@/components/wizard/engine-row"
import { useStoredState } from "@/hooks/use-stored-state"
import { DEFAULT_ADVANCED, type AdvancedConfig } from "@/lib/wizard-draft"

type ListeningIntent = { backchannels?: boolean; preemptive?: boolean }

const TOGGLE_ITEM = "border-stroke"

/**
 * Listening group (Design Tracker 02, verdict C): three flat rows named by
 * what the agent does. "Lock onto one speaker" RE-PRESENTS attentionLocking
 * (same state the old SAL card wrote — that card is gone, nothing is
 * duplicated); Backchannels and Preemptive replies are visible, inert, and
 * captioned — intent stays in this browser under `sx:listening_intent:*`.
 */
export function ListeningRows({
  value,
  onChange,
  agentId,
}: {
  value: AdvancedConfig | undefined
  onChange: (next: AdvancedConfig) => void
  agentId?: string
}) {
  const adv = value ?? DEFAULT_ADVANCED
  const sal = adv.attentionLocking
  const patchSal = (p: Partial<AdvancedConfig["attentionLocking"]>) =>
    onChange({ ...adv, attentionLocking: { ...sal, ...p } })

  const [intent, setIntent] = useStoredState<ListeningIntent>(`sx:listening_intent:${agentId ?? "new"}`, {})
  const uid = React.useId()

  return (
    <SectionRow id="wz-4-listening" focusId="listening" label="Listening">
      <div className="divide-y divide-border">
        <FlatRow
          title="Lock onto one speaker"
          description="Follows one voice and ignores the rest"
          hint={
            <InfoHint label="Selective Attention Locking (SAL)">
              Locks onto the first speaker, or a voiceprint you supply, and ignores other voices and background talk.
            </InfoHint>
          }
          control={
            <Switch
              checked={sal.enabled}
              onCheckedChange={(enabled) => patchSal({ enabled })}
              aria-label="Lock onto one speaker"
            />
          }
        >
          {sal.enabled && (
            <div className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mode</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  value={sal.mode}
                  onValueChange={(m) => m && patchSal({ mode: m as "speaker" | "voiceprint" })}
                  aria-label="Mode"
                >
                  <ToggleGroupItem value="speaker" className={TOGGLE_ITEM}>Speaker lock</ToggleGroupItem>
                  <ToggleGroupItem value="voiceprint" className={TOGGLE_ITEM}>Voiceprint</ToggleGroupItem>
                </ToggleGroup>
              </div>
              {sal.mode === "voiceprint" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`${uid}-vp-name`} className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        id={`${uid}-vp-name`}
                        value={sal.voiceprint?.name ?? ""}
                        onChange={(e) => patchSal({ voiceprint: { name: e.target.value, url: sal.voiceprint?.url ?? "" } })}
                        placeholder="Speaker 1"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${uid}-vp-url`} className="text-xs text-muted-foreground">Voiceprint URL</Label>
                      <Input
                        id={`${uid}-vp-url`}
                        value={sal.voiceprint?.url ?? ""}
                        onChange={(e) => patchSal({ voiceprint: { name: sal.voiceprint?.name ?? "", url: e.target.value } })}
                        placeholder="https://"
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">16kHz, 16-bit, mono PCM. Max 2MB.</p>
                </div>
              )}
            </div>
          )}
        </FlatRow>

        <EngineRow
          title="Backchannels"
          description="Says “mm-hm” while the caller talks"
          caption="Requires Engine · planned"
          checked={intent.backchannels === true}
          onCheckedChange={(on) => setIntent({ ...intent, backchannels: on })}
        >
          {/* Inert read-outs — what the Engine will honour once it ships. */}
          <dl className="space-y-0.5 pt-2 font-mono text-xs text-muted-foreground">
            <div className="flex gap-2"><dt>Words:</dt><dd>mm-hm · right · I see</dd></div>
            <div className="flex gap-2"><dt>How often:</dt><dd>Sometimes</dd></div>
          </dl>
        </EngineRow>

        <EngineRow
          title="Preemptive replies"
          description="Starts thinking before the caller finishes"
          caption="Requires Engine · Sep"
          checked={intent.preemptive === true}
          onCheckedChange={(on) => setIntent({ ...intent, preemptive: on })}
        />
      </div>
    </SectionRow>
  )
}
