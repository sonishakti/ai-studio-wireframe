"use client"

import * as React from "react"
import { ChevronDown, RotateCcw, SlidersHorizontal, Plus, X, ShieldCheck, Gauge, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { VoiceBrowser } from "@/components/wizard/voice-browser"
import { allVendorCredentials, createVendorCredential } from "@/lib/agent-resources"
import type { VoiceArtifact } from "@/lib/voice-artifacts"
import type { HostingConfig } from "@/lib/hosting-regions"
import {
  BACKUP_CANDIDATES, backupManaged, backupOf, candidateById, planBackups,
  type BackupConfig, type BackupEntry, type BackupSlotPlan,
} from "@/lib/backup-providers"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RadioCard, RadioCardGroup } from "@/components/wizard/radio-cards"
import {
  STACK_PRESETS, STACK_CATALOG, stackFor, stackEstimateFor, stackNonStreaming,
  stackCost, slotMode, MANAGED_PROVIDERS, AGORA_RATE_PER_MIN,
  type StackPreset, type AgentStack, type CredentialMode, type VendorCredential,
} from "@/lib/campaign-data"

/**
 * Stack config — the model stack (speed/cost preset + pipeline + STT/LLM/TTS)
 * behind an agent. SPLIT IN TWO (Figma direction 2026-07-14) so builder Step 1
 * can run the screenshot's order — presets first, then Voice + Language, then
 * "Configure Models":
 *   • StackPresetCards — the speed/cost priority (the ONE decision most make)
 *   • StackModelsDetail — pipeline shape + the vendor disclosure
 * `StackConfig` composes both for the standalone Playground.
 *
 * It owns the TTS vendor AND the voice within it (kept coherent — a vendor
 * change resets to that vendor's first voice); the spoken language is a builder
 * trait, so no language control here. Both pipeline shapes are supported by
 * Agora's Conversational AI Engine (bring-your-own vendors):
 * https://docs.agora.io/en/conversational-ai/overview/product-overview
 *
 * Estimates are PRESET-based (no per-model tables at wireframe altitude):
 * overriding a slot un-highlights the preset cards and the estimate reads as
 * approximate. Options come from STACK_CATALOG (colocated with STACK_PRESETS)
 * so a preset can never write a value the dropdowns don't list.
 */

type Pipeline = NonNullable<AgentStack["pipeline"]>

/**
 * Who supplies the key for one slot — the control Agora's own API already has
 * (`credential_mode`, scoped per asr/llm/tts block) and the console never
 * surfaced. Per component, never global: the common real-world config is
 * managed LLM plus your own cloned ElevenLabs voice.
 *
 * The copy leads with the economics because Agora's are the inverse of every
 * competitor's: the platform rate is the same either way, and managed absorbs
 * the vendor bill. Everywhere else BYO saves you money; here it costs more.
 */
function SlotMode({
  slot, vendor, mode, onChange,
}: {
  slot: "asr" | "llm" | "tts"
  vendor: string
  mode: CredentialMode
  onChange: (m: CredentialMode) => void
}) {
  const resellable = vendor in MANAGED_PROVIDERS
  const rate = MANAGED_PROVIDERS[vendor]

  // A provider Agora can't resell must not offer a mode it can't honour.
  if (!resellable) {
    return (
      <p className="text-xs text-muted-foreground">
        {vendor} is bring-your-own-key only. Agora doesn&apos;t resell it.
      </p>
    )
  }

  return (
    <div className="space-y-1">
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(v) => v && onChange(v as CredentialMode)}
        aria-label={`${slot.toUpperCase()} credentials`}
        className="grid grid-cols-2 gap-1"
      >
        <ToggleGroupItem
          value="managed"
          className="h-7 rounded-md border border-border px-2 text-xs"
        >
          Agora managed
        </ToggleGroupItem>
        <ToggleGroupItem
          value="byo"
          className="h-7 rounded-md border border-border px-2 text-xs"
        >
          Your own key
        </ToggleGroupItem>
      </ToggleGroup>
      <p className="text-xs text-muted-foreground">
        {mode === "managed"
          ? "Included. No key to add, no vendor bill."
          : `You add a ${vendor} key and they bill you directly (~$${rate.toFixed(3)}/min on top of Agora's rate).`}
      </p>
    </div>
  )
}

/** A model row in a picker — name plus what it costs you in latency and money.
 *  Competitor scan 2026-07-29: only Vapi shows the tradeoff at the point of
 *  choice; ElevenLabs, Synthflow, LiveKit and Cartesia all leave it in docs, so
 *  the user picks a model and discovers the cost later. */
function ModelOption({
  label, latencyMs, costPerMin, note,
}: {
  label: string
  latencyMs: number
  costPerMin: number
  note?: string
}) {
  return (
    <span className="flex w-full min-w-0 items-baseline justify-between gap-3">
      <span className="truncate">{label}</span>
      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
        {note ? `${note} · ` : ""}~{latencyMs} ms · ${costPerMin.toFixed(3)}/min
      </span>
    </span>
  )
}

interface StackPieceProps {
  stack: AgentStack
  onChange: (next: AgentStack) => void
  className?: string
}

const isMllmModel = (llm: AgentStack["llm"]) =>
  STACK_CATALOG.mllm.some((o) => o.vendor === llm.vendor && o.model === llm.model)

/** Slots (voice + language excluded — the Playground owns those) differ from
 *  the preset's writes → no card highlights and estimates read as approximate. */
const divergedFromPreset = (s: AgentStack) => {
  const p = STACK_PRESETS[s.preset]
  return (
    s.llm.vendor !== p.llm.vendor || s.llm.model !== p.llm.model ||
    s.asr.vendor !== p.asr.vendor || s.asr.model !== p.asr.model ||
    s.tts.vendor !== p.tts.vendor
  )
}

// ─── Piece 1: the speed/cost priority ─────────────────────────────────────────

export function StackPresetCards({ stack, onChange, className }: StackPieceProps) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const diverged = pipeline === "stt-llm-tts" && divergedFromPreset(stack)
  const active = pipeline === "stt-llm-tts" && !diverged ? stack.preset : ""

  // Chained Model (MLLM): the speed/cost presets write CASCADE vendor stacks —
  // they serve no purpose on a realtime pipeline, so the whole block hides
  // (owner 2026-07-15: "why is it still shown if it serves no purpose").
  // The realtime model itself is picked in "Choose the realtime model".
  if (pipeline === "mllm") return null

  // A preset pick also returns a realtime pipeline to the standard cascade —
  // that is what the cards promise ("we suggest the vendors"). Keep the chosen
  // language, and keep the current voice ONLY if the preset's TTS vendor still
  // offers it (else fall back to the preset's own voice) — a vendor never
  // presents a voice it doesn't provide (stack-move review).
  const setPreset = (preset: StackPreset) => {
    const base = stackFor(preset, stack.modality)
    const vendorVoices = (STACK_CATALOG.tts.find((v) => v.vendor === base.tts.vendor)?.voices ?? []) as readonly string[]
    const voice = vendorVoices.includes(stack.tts.voice) ? stack.tts.voice : base.tts.voice
    onChange({
      ...base,
      pipeline: "stt-llm-tts",
      language: stack.language,
      tts: { vendor: base.tts.vendor, voice },
    })
  }

  return (
    // @container: cards reflow by the component's real width (builder center
    // column vs Playground page), not viewport breakpoints.
    <section className={cn("@container space-y-3", className)}>
      {/* "Configure Models" = the speed/cost preset (Figma "Shell Exploration"
          heading, 2026-07-15). */}
      <h4 className="text-base font-medium">Configure Models</h4>
      <RadioCardGroup
        value={active}
        onValueChange={(v) => v && setPreset(v as StackPreset)}
        aria-label="Model preset"
        className="@xl:grid-cols-3"
      >
      {(Object.keys(STACK_PRESETS) as StackPreset[]).map((p) => {
        const preset = STACK_PRESETS[p]
        const pEst = stackEstimateFor(stackFor(p, stack.modality))
        return (
          <RadioCard
            key={p}
            value={p}
            title={preset.label}
            // The numbers ARE the description; the prose rides the tooltip.
            // The tooltip now carries the DOWNSIDE too — every hint used to be
            // one-sided upside, so no preset ever looked like a compromise.
            description={`~${pEst.latencyMs} ms · ~$${pEst.costPerMin.toFixed(2)}/min`}
            hint={`${preset.hint}. ${preset.tradeoff}`}
          />
        )
      })}
      </RadioCardGroup>
    </section>
  )
}

// ─── Piece 2: pipeline shape + vendor-level control ───────────────────────────

export function StackModelsDetail({
  stack,
  onChange,
  className,
  showPicker = true,
  hideTitle,
}: StackPieceProps & {
  showPicker?: boolean
  /** [label | content] hosting (builder 2026-07-21): the row label already
   *  says "Pipeline" — suppress the inner h4. Playground keeps it. */
  hideTitle?: boolean
}) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"

  const patch = (s: Partial<AgentStack>) => onChange({ ...stack, ...s })

  // Switching shape must keep the LLM slot coherent: entering MLLM writes a
  // realtime model (never a display-only fallback), leaving it restores the
  // preset's cascade model — otherwise summary/JSON contradict the UI.
  const setPipeline = (p: Pipeline) => {
    if (p === pipeline) return
    if (p === "mllm") {
      patch({
        pipeline: p,
        llm: isMllmModel(stack.llm)
          ? stack.llm
          : { vendor: STACK_CATALOG.mllm[0].vendor, model: STACK_CATALOG.mllm[0].model },
      })
    } else {
      patch({
        pipeline: p,
        llm: isMllmModel(stack.llm) ? STACK_PRESETS[stack.preset].llm : stack.llm,
      })
    }
  }

  return (
    <section className={cn("@container space-y-4", className)}>
      {/* "Pipeline" — this section already lives inside the agent's Models
          page, so "Agent Architecture" double-qualified it (owner 2026-07-17).
          No estimate/summary paragraphs here: variable-length text above the
          cards moved them under the cursor on every switch (the model-switch
          jump); the live numbers live in the right panel's summary instead. */}
      {!hideTitle && <h4 className="text-base font-medium">Model Architecture</h4>}
      <RadioCardGroup
        value={pipeline}
        onValueChange={(v) => v && setPipeline(v as Pipeline)}
        aria-label="Pipeline"
        // Two cards, two tracks — a 4-col track squeezed them (2026-07-21).
        className="gap-3 sm:grid-cols-2"
      >
        {/* Proposal 2639-102124 card copy. */}
        <RadioCard
          value="stt-llm-tts"
          title="Cascading Model"
          description="Chains multiple AI models together, best for high efficiency and lower costs"
        />
        <RadioCard
          value="mllm"
          title="Multimodal Large Language Model"
          description="Single, unified AI model. Best for deep, holistic understanding across multiple data types"
        />
      </RadioCardGroup>

      {/* The vendor picker renders here by default; the builder (Figma order)
          renders it separately via showPicker={false} + a standalone
          <StackModelPicker>. */}
      {showPicker && <StackModelPicker stack={stack} onChange={onChange} />}
    </section>
  )
}

/** The STT/LLM/TTS (or realtime) vendor pickers — ALWAYS VISIBLE (owner
 *  2026-07-17: "if user has selected cascading, show the asr-tts-llm
 *  selection, don't hide it"). Formerly a collapsed disclosure. */
export function StackModelPicker({
  stack,
  onChange,
  className,
  personaName,
  hideTitle,
  stacked,
}: StackPieceProps & {
  /** Selected voice persona (e.g. "Luna") — named under the TTS voice so the
   *  two voice concepts reconcile on screen: persona "Luna" speaking with the
   *  "rachel" TTS voice read as a bug (user-test 2026-07-21 D2). */
  personaName?: string
  /** [label | content] hosting: the row label carries "Models". */
  hideTitle?: boolean
  /** Force ONE column — the Advanced sheet stacks STT → LLM → TTS top to
   *  bottom (owner 2026-07-29: it's a sequence to read, not parallel picks). */
  stacked?: boolean
}) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const patch = (s: Partial<AgentStack>) => onChange({ ...stack, ...s })
  const modes = {
    asr: slotMode(stack, "asr"), llm: slotMode(stack, "llm"), tts: slotMode(stack, "tts"),
  }

  const ttsVendor = STACK_CATALOG.tts.find((v) => v.vendor === stack.tts.vendor) ?? STACK_CATALOG.tts[0]
  const vendorVoices = ttsVendor.voices as readonly string[]
  const voiceOptions = vendorVoices.includes(stack.tts.voice)
    ? [...vendorVoices]
    : [stack.tts.voice, ...vendorVoices]

  return (
    <div className={cn("@container", className)}>
      <div className="space-y-4">
        {!hideTitle && (
          <h4 className="text-base font-medium">
            {pipeline === "mllm" ? "Realtime model" : "Models"}
          </h4>
        )}
          {pipeline === "stt-llm-tts" ? (
            <div className={cn("grid grid-cols-1 gap-4", !stacked && "@lg:grid-cols-2")}>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Speech-to-Text (STT)</Label>
                <Select
                  value={`${stack.asr.vendor}/${stack.asr.model}`}
                  onValueChange={(id) => {
                    const o = STACK_CATALOG.stt.find((x) => `${x.vendor}/${x.model}` === id)
                    if (o) patch({ asr: { vendor: o.vendor, model: o.model } })
                  }}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STACK_CATALOG.stt.map((o) => (
                      <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>
                        <ModelOption
                          label={o.label}
                          latencyMs={o.latencyMs}
                          costPerMin={o.costPerMin}
                          note={o.streaming ? undefined : "no streaming"}
                        />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SlotMode
                  slot="asr" vendor={stack.asr.vendor} mode={slotMode(stack, "asr")}
                  onChange={(m) => patch({ credentialMode: { ...modes, asr: m } })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Large Language Model (LLM)</Label>
                <Select
                  value={`${stack.llm.vendor}/${stack.llm.model}`}
                  onValueChange={(id) => {
                    const o = STACK_CATALOG.llm.find((x) => `${x.vendor}/${x.model}` === id)
                    if (o) patch({ llm: { vendor: o.vendor, model: o.model } })
                  }}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STACK_CATALOG.llm.map((o) => (
                      <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>
                        <ModelOption label={o.label} latencyMs={o.latencyMs} costPerMin={o.costPerMin} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SlotMode
                  slot="llm" vendor={stack.llm.vendor} mode={slotMode(stack, "llm")}
                  onChange={(m) => patch({ credentialMode: { ...modes, llm: m } })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <Label className="text-sm font-medium">Text-to-Speech (TTS)</Label>
                <Select
                  value={stack.tts.vendor}
                  onValueChange={(vendor) => {
                    const v = STACK_CATALOG.tts.find((x) => x.vendor === vendor)
                    // Reset the voice to the new vendor's first — a vendor never
                    // presents a voice it doesn't provide (stack-move review).
                    if (v) patch({ tts: { vendor: v.vendor, voice: v.voices[0] } })
                  }}
                >
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STACK_CATALOG.tts.map((v) => (
                      <SelectItem key={v.vendor} value={v.vendor}>
                        <ModelOption label={v.label} latencyMs={v.latencyMs} costPerMin={v.costPerMin} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SlotMode
                  slot="tts" vendor={stack.tts.vendor} mode={slotMode(stack, "tts")}
                  onChange={(m) => patch({ credentialMode: { ...modes, tts: m } })}
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                {/* "TTS voice", not "Voice" — the persona picker sits directly
                    above this on Step 1; two controls named Voice read as a bug. */}
                <Label className="text-sm font-medium">TTS voice</Label>
                <Select value={stack.tts.voice} onValueChange={(voice) => patch({ tts: { ...stack.tts, voice } })}>
                  <SelectTrigger className="text-sm capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {voiceOptions.map((v) => <SelectItem key={v} value={v} className="capitalize">{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                {personaName && (
                  <p className="text-xs text-muted-foreground">
                    The vendor sound {personaName} speaks with. Picking a new voice in Voice &amp; speech resets this to that voice&apos;s default sound.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-sm font-medium">Realtime model</Label>
              <Select
                value={`${stack.llm.vendor}/${stack.llm.model}`}
                onValueChange={(id) => {
                  const o = STACK_CATALOG.mllm.find((x) => `${x.vendor}/${x.model}` === id)
                  if (o) patch({ llm: { vendor: o.vendor, model: o.model } })
                }}
              >
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STACK_CATALOG.mllm.map((o) => (
                    <SelectItem key={`${o.vendor}/${o.model}`} value={`${o.vendor}/${o.model}`}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          )}
      </div>
    </div>
  )
}

// ─── Configure a slot (Figma 2962-91425): vendor · credential · model ─────────

const SLOT_LABEL = { asr: "STT", llm: "LLM", tts: "TTS" } as const

/** "Configure LLM" — the per-slot sheet behind each model row's ⚙ button:
 *  Vendor, Credential (managed vs your own key — Agora's `credential_mode`,
 *  per slot), Model (or a Custom id), Save changes. */
/** What the TTS sheet needs to open the Select voice dialog (design 01) from
 *  its Voice field, the way the live NG console's TTS drawer does. */
export interface VoicePickProps {
  voices?: VoiceArtifact[]
  selectedVoiceId?: string
  onPickVoice?: (v: VoiceArtifact) => void
  useCaseHint?: React.ComponentProps<typeof VoiceBrowser>["useCaseHint"]
  language?: string
}

type Slot = "asr" | "llm" | "tts"

/** The slot written back into the stack: vendor, model (or voice), credential mode and pick. */
function applySlot(stack: AgentStack, slot: Slot, p: { vendor: string; model: string; mode: CredentialMode; credentialId?: string }): AgentStack {
  const modes = { asr: slotMode(stack, "asr"), llm: slotMode(stack, "llm"), tts: slotMode(stack, "tts") }
  const credentials = { ...(stack.credentials ?? {}) }
  if (p.credentialId) credentials[slot] = p.credentialId; else delete credentials[slot]
  return {
    ...stack,
    credentials,
    credentialMode: { ...modes, [slot]: p.mode },
    ...(slot === "tts"
      ? { tts: { vendor: p.vendor, voice: p.model } }
      : slot === "asr"
      ? { asr: { vendor: p.vendor, model: p.model } }
      : { llm: { vendor: p.vendor, model: p.model } }),
  }
}

/** The credential control, the way the live NG console does it (owner
 *  2026-09-12): Agora Managed Key by default; a switch brings your own key,
 *  then a select of saved credentials with Create credential at the end.
 *  ONE component for a primary vendor and for its backup: the same thing
 *  gets the same control (owner IA rule, 2026-09-12). */
function CredentialField({
  id, vendor, resellable, mode, onMode, credentialId, onCredential, label = "Use my own credentials",
}: {
  id: string
  vendor: string
  /** Agora holds a key for this vendor, so nothing needs adding. */
  resellable: boolean
  mode: CredentialMode
  onMode: (m: CredentialMode) => void
  credentialId?: string
  onCredential: (id?: string) => void
  label?: string
}) {
  const byo = !resellable || mode === "byo"
  // Catalog keys plus anything made in this browser. Read after mount so the
  // server and the first client render agree.
  const [all, setAll] = React.useState<VendorCredential[]>([])
  React.useEffect(() => { setAll(allVendorCredentials()) }, [])
  const [createOpen, setCreateOpen] = React.useState(false)
  const saved = all.filter((c) => c.vendor.toLowerCase() === vendor.toLowerCase() && c.mode === "byo")

  return (
    <div className="space-y-2" id={`${id}-field`}>
      {/* A checkbox, not a switch: the sheet already carries one switch per
          backup, and a column of toggles that mean different things reads as
          noise (owner 2026-09-15). */}
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox
          id={id}
          checked={byo}
          disabled={!resellable}
          onCheckedChange={(v) => onMode(v ? "byo" : "managed")}
        />
        {label}
      </label>
      {byo ? (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground" htmlFor={`${id}-pick`}>Credential</Label>
          <Select
            value={credentialId ?? "__none__"}
            onValueChange={(v) => {
              // Making a key never leaves the builder (owner 2026-09-15).
              if (v === "__create__") { setCreateOpen(true); return }
              onCredential(v === "__none__" ? undefined : v)
            }}
          >
            <SelectTrigger id={`${id}-pick`} className="w-full text-sm" aria-label="Credential">
              <SelectValue placeholder="Select credential" />
            </SelectTrigger>
            <SelectContent>
              {saved.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} <span className="ml-1 font-mono text-xs text-muted-foreground">{c.keyHint}</span>
                </SelectItem>
              ))}
              <SelectItem value="__none__">No credential selected</SelectItem>
              <SelectItem value="__create__">
                <span className="flex items-center gap-1.5"><Plus className="size-3.5" aria-hidden /> Create credential</span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {!resellable
              ? `${vendor} is bring-your-own-key only. Agora doesn't resell it.`
              : `${vendor} bills you directly.`}
          </p>
        </div>
      ) : (
        <div className="flex h-9 items-center gap-2 rounded-md border border-stroke bg-muted/40 px-3 text-sm" aria-label="Credential: Agora Managed Key">
          <ShieldCheck className="size-4 text-success" aria-hidden />
          Agora Managed Key
        </div>
      )}
      <CreateCredentialDialog
        vendor={vendor}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(c) => { setAll(allVendorCredentials()); onCredential(c.id) }}
      />
    </div>
  )
}

/** Make a key without leaving the builder. The key itself is never stored —
 *  only its last four characters, which is all the picker ever shows. */
function CreateCredentialDialog({
  vendor, open, onOpenChange, onCreated,
}: {
  vendor: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreated: (c: VendorCredential) => void
}) {
  const [name, setName] = React.useState("")
  const [key, setKey] = React.useState("")
  React.useEffect(() => { if (open) { setName(""); setKey("") } }, [open])
  const save = () => {
    const c = createVendorCredential({ vendor, name: name || `${vendor} key`, key })
    onCreated(c)
    onOpenChange(false)
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a {vendor} key</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cred-name" className="text-sm font-medium">Name</Label>
            <Input id="cred-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={`${vendor} production`} className="text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cred-key" className="text-sm font-medium">API key</Label>
            <Input id="cred-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste the key" className="font-mono text-sm" />
            <p className="text-xs text-muted-foreground">Only the last four characters are stored.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!key.trim()}>Save key</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** What the sheet needs to own a slot's backup (design 07, owner IA 2026-09-12). */
/** What the sheet needs to own a slot's backup chain (design 07, owner IA
 *  2026-09-12, chain 2026-09-15). */
interface BackupOwnerProps {
  backup?: BackupConfig
  onBackupChange?: (b: BackupConfig) => void
  hosting?: HostingConfig
  /** Jumps to the hosting region control in Deployment. */
  onUnpinRegion?: () => void
}

/** Vendor + model on one row — the pair a person names together ("Deepgram
 *  Nova-2"), so they read as one decision (owner IA 2026-09-15). */
function VendorModelRow({
  idBase, label, vendors, vendor, onVendor, models, model, onModel, modelLabel = "Model", modelSlot,
}: {
  idBase: string
  label?: string
  vendors: string[]
  vendor: string
  onVendor: (v: string) => void
  models: string[]
  model: string
  onModel: (m: string) => void
  modelLabel?: string
  /** TTS replaces the model select with the voice door. */
  modelSlot?: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="min-w-0 space-y-1.5">
        <Label className="text-xs text-muted-foreground" htmlFor={`${idBase}-vendor`}>{label ? `${label} vendor` : "Vendor"}</Label>
        <Select value={vendor} onValueChange={onVendor}>
          <SelectTrigger id={`${idBase}-vendor`} className="w-full text-sm" aria-label={label ? `${label} vendor` : "Vendor"}>
            <SelectValue placeholder="Select a vendor" />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label className="text-xs text-muted-foreground" htmlFor={`${idBase}-model`}>{modelLabel}</Label>
        {modelSlot ?? (
          <Select value={models.includes(model) ? model : (models[0] ?? "")} onValueChange={onModel}>
            <SelectTrigger id={`${idBase}-model`} className="w-full text-sm capitalize" aria-label={modelLabel}>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}

function ConfigureSlotSheet({
  slot, stack, onChange, open, onOpenChange, voices, selectedVoiceId, onPickVoice, useCaseHint, language,
  backup, onBackupChange, hosting, onUnpinRegion,
}: {
  slot: Slot
  stack: AgentStack
  onChange: (next: AgentStack) => void
  open: boolean
  onOpenChange: (o: boolean) => void
} & VoicePickProps & BackupOwnerProps) {
  const current = stack[slot]
  const vendors = React.useMemo(() => {
    const list = slot === "tts" ? STACK_CATALOG.tts : slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm
    return [...new Set(list.map((o) => o.vendor))]
  }, [slot])
  const b = backupOf(backup)

  const [vendor, setVendor] = React.useState(current.vendor)
  const [model, setModel] = React.useState(slot === "tts" ? stack.tts.voice : (current as { model: string }).model)
  const [mode, setMode] = React.useState<CredentialMode>(slotMode(stack, slot))
  const [custom, setCustom] = React.useState(false)
  const [credentialId, setCredentialId] = React.useState<string | undefined>(stack.credentials?.[slot])
  const [voiceOpen, setVoiceOpen] = React.useState(false)
  /** The slot's backup chain, local until Save. */
  const [chain, setChain] = React.useState<BackupEntry[]>([])
  /** Which backups are typing a model id by hand. */
  const [customBackup, setCustomBackup] = React.useState<Record<number, boolean>>({})

  React.useEffect(() => {
    if (!open) return
    setVendor(current.vendor)
    setModel(slot === "tts" ? stack.tts.voice : (current as { model: string }).model)
    setMode(slotMode(stack, slot))
    setCustom(false)
    setCredentialId(stack.credentials?.[slot])
    // Untouched slot: seed the chain from Agora's own default so the switch
    // shows what is actually running, rather than an empty panel.
    const saved = b.entries[slot]
    if (saved) { setChain(saved); return }
    const auto = planBackups({ stack, hosting, backup: b }).slots.find((s) => s.slot === slot)
    const first = auto?.links[0]?.candidate
    setChain(first ? [{ id: first.id, enabled: true }] : [])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const models: string[] = React.useMemo(() => {
    if (slot === "tts") return [...(STACK_CATALOG.tts.find((v) => v.vendor === vendor)?.voices ?? [])]
    const list = slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm
    return list.filter((o) => o.vendor === vendor).map((o) => o.model)
  }, [slot, vendor])

  const resellable = vendor in MANAGED_PROVIDERS
  const byo = !resellable || mode === "byo"
  const pickedVoice = slot === "tts" ? voices?.find((v) => v.ttsVoice === model && (v.provider ?? "ElevenLabs") === vendor) : undefined

  // The plan for THIS sheet's draft: the chain follows the vendor being
  // edited, not the saved one, so eligibility never lags.
  const localStack = React.useMemo(
    () => applySlot(stack, slot, { vendor, model, mode: resellable ? mode : "byo", credentialId: byo ? credentialId : undefined }),
    [stack, slot, vendor, model, mode, resellable, byo, credentialId],
  )
  const localBackup = React.useMemo<BackupConfig>(
    () => ({ ...b, enabled: true, entries: { ...b.entries, [slot]: chain } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backup, slot, chain],
  )
  const localPlan = React.useMemo(() => planBackups({ stack: localStack, hosting, backup: localBackup }), [localStack, hosting, localBackup])
  const slotPlan = localPlan.slots.find((p) => p.slot === slot) as BackupSlotPlan

  /** Vendors this slot can fall back to, primary excluded. */
  const backupVendors = React.useMemo(() => {
    const pool = BACKUP_CANDIDATES.filter((c) => c.slot === slot && c.vendor !== vendor)
    return [...new Set(pool.map((c) => c.vendor))]
  }, [slot, vendor])
  const backupModels = (v: string) => BACKUP_CANDIDATES.filter((c) => c.slot === slot && c.vendor === v).map((c) => c.model)
  const candidateFor = (v: string, m: string) =>
    BACKUP_CANDIDATES.find((c) => c.slot === slot && c.vendor === v && c.model === m)
    ?? BACKUP_CANDIDATES.find((c) => c.slot === slot && c.vendor === v)

  const patchLink = (i: number, patch: Partial<BackupEntry>) =>
    setChain((cs) => cs.map((c, n) => (n === i ? { ...c, ...patch } : c)))
  const addBackup = () => {
    const used = new Set(chain.map((c) => candidateById(c.id)?.vendor))
    used.add(vendor)
    const next = BACKUP_CANDIDATES.find((c) => c.slot === slot && !used.has(c.vendor))
    if (!next) return
    setChain((cs) => [...cs, { id: next.id, enabled: true }])
  }
  const removeBackup = (i: number) => setChain((cs) => cs.filter((_, n) => n !== i))

  const save = () => {
    onChange(localStack)
    onBackupChange?.(localBackup)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
        <SheetHeader className="shrink-0 border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-base">Configure {SLOT_LABEL[slot]}</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* PRIMARY — vendor + model on one row, then its key. */}
          <section className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Primary</p>
            <VendorModelRow
              idBase={`wz-slot-${slot}`}
              vendors={vendors}
              vendor={vendor}
              onVendor={(v) => {
                setVendor(v)
                const first = slot === "tts"
                  ? STACK_CATALOG.tts.find((x) => x.vendor === v)?.voices[0]
                  : (slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm).find((x) => x.vendor === v)?.model
                if (first) setModel(first)
              }}
              models={models}
              model={model}
              onModel={setModel}
              modelLabel={slot === "tts" ? "Voice" : "Model"}
              modelSlot={
                slot === "tts" && voices && !custom ? (
                  /* The voice is chosen in the Select voice dialog (design 01):
                     the field is the door, the same control as Voice & Models. */
                  <button
                    type="button"
                    onClick={() => setVoiceOpen(true)}
                    aria-label="Select voice"
                    className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-stroke bg-transparent px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {pickedVoice ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
                        <span className="truncate font-medium">{pickedVoice.name}</span>
                      </span>
                    ) : (
                      <span className="truncate font-mono text-xs">{model}</span>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </button>
                ) : custom ? (
                  <Input
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={slot === "tts" ? "custom-voice-id" : "custom-model-id"}
                    className="font-mono text-sm"
                  />
                ) : undefined
              }
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={custom} onCheckedChange={(c) => setCustom(!!c)} aria-label="Custom model ID" />
              Custom model ID
            </label>
            <CredentialField
              id={`wz-cred-${slot}`}
              vendor={vendor}
              resellable={resellable}
              mode={mode}
              onMode={setMode}
              credentialId={credentialId}
              onCredential={setCredentialId}
            />
          </section>

          {/* BACKUP CHAIN — the same anatomy, once per backup, each with its
              own switch and its own key (owner IA 2026-09-15). */}
          {onBackupChange && (
            <section className="mt-6 space-y-3 border-t border-border pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Backup</p>
                <p className="text-xs text-muted-foreground">Tried in order if {vendor} fails.</p>
              </div>

              {chain.length === 0 && (
                <p className="rounded-md border border-dashed border-stroke px-3 py-2.5 text-xs text-muted-foreground">
                  No backup. The call ends if {vendor} fails.
                </p>
              )}

              {chain.map((entry, i) => {
                const cand = candidateById(entry.id)
                const link = slotPlan.links[i]
                const v = cand?.vendor ?? backupVendors[0] ?? ""
                const managed = cand ? backupManaged(cand) : false
                return (
                  <div key={`${entry.id}-${i}`} className={cn("space-y-3 rounded-md border border-stroke p-3", !entry.enabled && "opacity-60")}>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor={`wz-backup-${slot}${i === 0 ? "" : `-${i}`}-vendor`} className="text-sm font-medium">
                        Backup {String(i + 1).padStart(2, "0")}
                      </Label>
                      <div className="flex items-center gap-1">
                        <Switch
                          checked={entry.enabled}
                          onCheckedChange={(on) => patchLink(i, { enabled: on })}
                          aria-label={`Backup ${i + 1} on`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground"
                          aria-label={`Remove backup ${i + 1}`}
                          onClick={() => removeBackup(i)}
                        >
                          <X className="size-3.5" aria-hidden />
                        </Button>
                      </div>
                    </div>
                    <VendorModelRow
                      idBase={`wz-backup-${slot}${i === 0 ? "" : `-${i}`}`}
                      label="Backup"
                      vendors={backupVendors}
                      vendor={v}
                      onVendor={(nv) => {
                        const next = candidateFor(nv, backupModels(nv)[0] ?? "")
                        if (next) patchLink(i, { id: next.id, model: undefined, credentialMode: backupManaged(next) ? "managed" : "byo", credentialId: undefined })
                      }}
                      models={backupModels(v)}
                      model={entry.model ?? cand?.model ?? ""}
                      onModel={(m) => {
                        const next = candidateFor(v, m)
                        if (next) patchLink(i, { id: next.id, model: undefined })
                      }}
                      modelLabel={slot === "tts" ? "Voice model" : "Model"}
                      modelSlot={customBackup[i] ? (
                        <Input
                          value={entry.model ?? ""}
                          onChange={(e) => patchLink(i, { model: e.target.value })}
                          placeholder={slot === "tts" ? "custom-voice-id" : "custom-model-id"}
                          className="font-mono text-sm"
                        />
                      ) : undefined}
                    />
                    {/* A backup can take a model id by hand too — it was on the
                        primary and missing here (owner 2026-09-15). */}
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={!!customBackup[i]}
                        onCheckedChange={(c) => {
                          setCustomBackup((m) => ({ ...m, [i]: !!c }))
                          if (!c) patchLink(i, { model: undefined })
                        }}
                        aria-label={`Custom model ID for backup ${i + 1}`}
                      />
                      Custom model ID
                    </label>
                    {entry.enabled && cand && (
                      <CredentialField
                        id={`wz-bcred-${slot}${i === 0 ? "" : `-${i}`}`}
                        vendor={cand.vendor}
                        resellable={managed}
                        mode={entry.credentialMode ?? (managed ? "managed" : "byo")}
                        onMode={(m) => patchLink(i, { credentialMode: m })}
                        credentialId={entry.credentialId}
                        onCredential={(id) => patchLink(i, { credentialId: id })}
                        label="Use my own credentials"
                      />
                    )}
                    {entry.enabled && link?.problem && (
                      <p className="text-xs text-warning">
                        {link.problem.startsWith("needs your")
                          ? `This backup ${link.problem}. Pick one above, or it will be skipped.`
                          : `Skipped: ${link.problem}.`}
                      </p>
                    )}
                    {entry.enabled && slot === "tts" && cand && !link?.problem && (
                      <p className="text-xs text-muted-foreground">
                        {cand.voiceMapped
                          ? `Backup voice: the closest match to ${pickedVoice?.name ?? model} on ${cand.vendor}.`
                          : `No mapped voice on ${cand.vendor}: the backup speaks in its default voice.`}
                      </p>
                    )}
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addBackup}
                disabled={chain.length >= backupVendors.length}
              >
                <Plus className="size-3.5" aria-hidden /> Add backup
              </Button>

              {localPlan.pinnedArea && (
                <p className="text-xs text-muted-foreground">
                  Backups are limited to vendors serving {localPlan.pinnedArea} because the hosting region is pinned.{" "}
                  {onUnpinRegion && (
                    <button type="button" onClick={() => { onOpenChange(false); onUnpinRegion() }} className="text-foreground underline underline-offset-4">
                      Unpin region
                    </button>
                  )}
                </p>
              )}
            </section>
          )}
        </div>
        <div className="shrink-0 border-t border-border px-5 py-3">
          <Button className="w-full" onClick={save}>Save changes</Button>
        </div>
        {slot === "tts" && voices && (
          <VoiceBrowser
            open={voiceOpen}
            onOpenChange={setVoiceOpen}
            voices={voices}
            selectedId={selectedVoiceId}
            useCaseHint={useCaseHint}
            language={language}
            onSelect={(v) => {
              onPickVoice?.(v)
              setVendor(v.provider ?? "ElevenLabs")
              setModel(v.ttsVoice)
              setVoiceOpen(false)
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}


/** "Or Configure models manually" (Figma 2998-93809) — the inline expander:
 *  Custom Stack recap + Reset, the architecture cards, then one row per model
 *  slot with a ⚙ door to its Configure sheet. */
export function ManualStackConfig({
  stack, onChange, className, backup, onBackupChange, hosting, onUnpinRegion, voices, selectedVoiceId, onPickVoice, useCaseHint, language,
}: StackPieceProps & VoicePickProps & BackupOwnerProps) {
  const [openSlot, setOpenSlot] = React.useState<Slot | null>(null)
  const plan = React.useMemo(() => planBackups({ stack, hosting, backup: backupOf(backup) }), [stack, hosting, backup])
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const diverged = pipeline === "stt-llm-tts" && divergedFromPreset(stack)

  const slotValue = (slot: Slot) => {
    if (slot === "tts") {
      const v = STACK_CATALOG.tts.find((x) => x.vendor === stack.tts.vendor)
      return `${v?.label ?? stack.tts.vendor} ${stack.tts.voice}`
    }
    const list = slot === "asr" ? STACK_CATALOG.stt : STACK_CATALOG.llm
    const cur = stack[slot] as { vendor: string; model: string }
    return list.find((o) => o.vendor === cur.vendor && o.model === cur.model)?.label ?? `${cur.vendor} ${cur.model}`
  }

  // One line under each model: its backup and whose key it runs on. Read-only
  // here; the sheet behind the row is the only place it is set.
  /** One line, and only what it is: "Backup: Deepgram, Nova-3". Whose key it
   *  runs on belongs in the sheet, not under every row (owner 2026-09-15). */
  const recap = (slot: Slot) => {
    const s = plan.slots.find((p) => p.slot === slot)
    if (!s) return null
    const live = s.links.filter((l) => l.enabled)
    const first = live.find((l) => !l.problem) ?? live[0]
    const gap = s.state === "needs-key" || s.state === "no-match"
    return (
      <button
        type="button"
        onClick={() => setOpenSlot(slot)}
        aria-label={`Configure ${SLOT_LABEL[slot]} backup`}
        className={cn(
          "rounded text-left text-xs transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          gap ? "text-warning" : "text-muted-foreground",
        )}
      >
        <span className="font-medium">Backup:</span>{" "}
        {first ? `${first.candidate.vendor}, ${first.model}` : (s.note ?? "none")}
      </button>
    )
  }

  const reset = () => {
    const base = stackFor(stack.preset, stack.modality)
    onChange({ ...base, pipeline: "stt-llm-tts", language: stack.language })
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm">
          <span className="font-medium">Custom Stack</span>{" "}
          <span className="font-mono text-xs text-muted-foreground">
            {stack.asr.vendor} + {stack.llm.model} + {stack.tts.vendor}
          </span>
        </p>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset
        </Button>
      </div>

      <StackModelsDetail stack={stack} onChange={onChange} showPicker={false} />

      {pipeline === "stt-llm-tts" ? (
        <div className="space-y-4">
          {(["asr", "llm", "tts"] as const).map((slot) => (
            <div key={slot} className="min-w-0 space-y-1.5">
              <Label className="text-sm font-medium">
                {slot === "asr" ? "Speech-to-Text (STT)" : slot === "llm" ? "Large Language Model (LLM)" : "Text-to-Speech (TTS)"}
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenSlot(slot)}
                  className="flex h-9 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-stroke bg-transparent px-3 text-left text-sm shadow-xs transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Configure ${SLOT_LABEL[slot]}`}
                >
                  <span className="truncate capitalize">{slotValue(slot)}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9 shrink-0"
                  aria-label={`Configure ${SLOT_LABEL[slot]} vendor and credential`}
                  onClick={() => setOpenSlot(slot)}
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden />
                </Button>
              </div>
              {backup && onBackupChange && recap(slot)}
            </div>
          ))}
        </div>
      ) : (
        <StackModelPicker stack={stack} onChange={onChange} hideTitle stacked />
      )}

      {openSlot && (
        <ConfigureSlotSheet
          slot={openSlot}
          stack={stack}
          onChange={onChange}
          open={!!openSlot}
          onOpenChange={(o) => !o && setOpenSlot(null)}
          voices={voices}
          selectedVoiceId={selectedVoiceId}
          onPickVoice={onPickVoice}
          useCaseHint={useCaseHint}
          language={language}
          backup={backup}
          onBackupChange={onBackupChange}
          hosting={hosting}
          onUnpinRegion={onUnpinRegion}
        />
      )}
    </div>
  )
}

// ─── Choosing a model stack ───────────────────────────────────────────────────

/** Three bundles, named for what they are good at.
 *
 *  This was a Lowest-Cost-to-Fastest slider until 2026-09-15. Agora's rate card
 *  is a flat $0.10 per agent-minute and its docs say the price is the same under
 *  bring-your-own-key, so one end of that axis could never move the bill — and a
 *  slider with one real axis is a dial with nothing to dial. Three options that
 *  say what they are for is the honest shape, and each one can carry its own
 *  answer time. Hidden on a realtime model, which owns the whole pipeline. */
const STACK_STOPS: { preset: StackPreset; title: string; description: string }[] = [
  { preset: "fastest", title: "Fastest", description: "Answers quickest. Best for routing and short questions." },
  { preset: "balanced", title: "Balanced", description: "Good speed, and handles most conversations." },
  { preset: "cheapest", title: "Most capable", description: "Follows longer instructions and multi-step tasks." },
]

/** "Balanced — Deepgram STT · gpt-4o-mini · ElevenLabs voice": the preset name
 *  plus the vendors it bundles, from the CURRENT stack so per-slot overrides
 *  stay truthful ("Custom mix" once diverged). */
const bundleLine = (s: AgentStack, diverged: boolean) =>
  `${diverged ? "Custom mix" : STACK_PRESETS[s.preset].label}: ${s.asr.vendor} STT · ${s.llm.model} · ${s.tts.vendor} voice`

export function StackTradeoffSlider({
  stack, onChange, className, lean, afterRecap,
}: StackPieceProps & {
  /** Builder hot-path mode (Plain Form winner, 2026-07-29): no card chrome,
   *  no mono label, one estimate line. The Playground default is unchanged. */
  lean?: boolean
  /** Rendered directly under the line that names the chosen stack, so the
   *  manual door sits beside the preset it replaces (owner 2026-09-15). */
  afterRecap?: React.ReactNode
}) {
  const pipeline: Pipeline = stack.pipeline ?? "stt-llm-tts"
  const diverged = divergedFromPreset(stack)
  const cost = stackCost(stack)
  const nonStreaming = stackNonStreaming(stack)

  const setPreset = (preset: StackPreset) => {
    const base = stackFor(preset, stack.modality)
    const vendorVoices = (STACK_CATALOG.tts.find((v) => v.vendor === base.tts.vendor)?.voices ?? []) as readonly string[]
    const voice = vendorVoices.includes(stack.tts.voice) ? stack.tts.voice : base.tts.voice
    onChange({
      ...base,
      pipeline: "stt-llm-tts",
      language: stack.language,
      tts: { vendor: base.tts.vendor, voice },
    })
  }

  if (pipeline === "mllm") return null

  return (
    <section className={cn("@container space-y-4", !lean && "rounded-lg border border-border bg-card p-5", className)}>
      {!lean && <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Model stack</p>}

      <RadioCardGroup
        value={diverged ? "" : stack.preset}
        onValueChange={(v) => v && setPreset(v as StackPreset)}
        aria-label="Model stack"
        className="gap-3 @2xl:grid-cols-3"
      >
        {STACK_STOPS.map((s) => {
          const ms = stackEstimateFor(stackFor(s.preset, stack.modality)).latencyMs
          return (
            <RadioCard
              key={s.preset}
              value={s.preset}
              title={s.title}
              description={
                <>
                  <span className="block">{s.description}</span>
                  <span className="mt-1.5 flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                    <Gauge className="size-3.5" aria-hidden /> ~{ms} ms to answer
                  </span>
                </>
              }
            />
          )
        })}
      </RadioCardGroup>

      {/* The vendors behind the choice, and the one price that covers them. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="font-mono text-xs tabular-nums text-muted-foreground">
          {lean ? `${stack.asr.vendor} + ${stack.llm.model} + ${stack.tts.vendor}` : bundleLine(stack, diverged)}
        </p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "inline-flex cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs tabular-nums",
                cost.allManaged ? "border-stroke text-muted-foreground" : "border-warning/50 text-warning",
              )}
            >
              <Wallet className="size-3.5" aria-hidden />
              {cost.allManaged ? `$${AGORA_RATE_PER_MIN.toFixed(2)}/min included` : `~$${cost.totalPerMin.toFixed(2)}/min`}
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-80 text-xs leading-relaxed">
            {cost.allManaged ? (
              <>
                Agora charges ${AGORA_RATE_PER_MIN.toFixed(2)} a minute for the agent. On an Agora Managed Key the
                speech, language and voice models are included in that price. Audio minutes are billed separately.
                Your first 300 agent minutes are free.
              </>
            ) : (
              <>
                Agora charges ${AGORA_RATE_PER_MIN.toFixed(2)}/min. Your own {cost.byoSlots.join(" and ")} key adds
                about ${cost.vendorPerMin.toFixed(2)}/min on top, and that vendor bills you directly.
              </>
            )}
          </TooltipContent>
        </Tooltip>
      </div>

      {afterRecap}

      {nonStreaming.length > 0 && (
        <p className="text-xs text-warning">
          {nonStreaming.join(", ")} doesn&apos;t stream. It transcribes only after the caller
          stops speaking, which adds to the wait.
        </p>
      )}
    </section>
  )
}

// ─── Composition — the standalone Playground consumes the whole stack ─────────

export function StackConfig({ stack, onChange, className }: StackPieceProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <StackPresetCards stack={stack} onChange={onChange} />
      <StackModelsDetail stack={stack} onChange={onChange} />
    </div>
  )
}
