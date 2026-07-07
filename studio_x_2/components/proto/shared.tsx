"use client"

/**
 * Shared data contract for the builder-arrangement prototypes (/agents/proto).
 * THROWAWAY judging harness — same content inventory for every variant so the
 * comparison isolates ARRANGEMENT (reading order, grouping, hierarchy), which
 * is the complaint under test: "complexity in comprehension and digestion."
 * Deleted after a winner is applied to the real AgentWizard.
 */

import { AgentSphere } from "@/components/agent-test-panel"

export const AGENT = {
  name: "Aria",
  status: "Live",
  role: "General assistant",
  id: "agt_default",
  stack: "gpt-4o-mini · nova-2 · turbo",
  language: "English",
  preset: "Balanced",
  channelLabel: "Inbound",
  channelTarget: "+1 (628) 555-0188",
  cost: "$0.10/min",
  latency: "800 ms",
  prompt: "Helpful, friendly, and clear — answers questions and gets things done.",
  greeting: "Hi, thanks for calling — how can I help you today?",
  knowledge: 0,
  connectors: 0,
} as const

export type StepInfo = {
  n: number
  title: string
  /** The real configured values (recognition data). */
  value: string
  /** What lives inside the drawer (the content map). */
  manifest: string
  done: boolean
}

export const STEPS: StepInfo[] = [
  { n: 1, title: "Voice & models", value: "Aria · Balanced · gpt-4o-mini · nova-2 · turbo · English", manifest: "Persona · STT / LLM / TTS · Voice · Language", done: true },
  { n: 2, title: "Agent type", value: "Inbound", manifest: "Batch calls · Inbound · Code / SDK", done: true },
  { n: 3, title: "Prompt & tools", value: "Prompt · 70 chars · Greeting set · 0 knowledge · 0 connectors", manifest: "Prompt · Greeting · Knowledge · Connectors · Quick test", done: true },
  { n: 4, title: "Phone number", value: "Inbound · +1 (628) 555-0188", manifest: "Phone number · Web widget option", done: true },
  { n: 5, title: "Deploy", value: "Deployed · live on +1 (628) 555-0188", manifest: "Review everything · Go live", done: true },
]

/** Per-step configuration fields — the RIGHT card renders these upfront so
 *  the selected step's config is always visible (master-detail direction). */
export const STEP_FIELDS: Record<number, { label: string; value: string }[]> = {
  1: [
    { label: "Persona", value: "Aria (preset)" },
    { label: "Pipeline", value: "STT · LLM · TTS" },
    { label: "Preset", value: "Balanced" },
    { label: "STT", value: "Deepgram Nova-2" },
    { label: "LLM", value: "OpenAI GPT-4o mini" },
    { label: "TTS · Voice", value: "ElevenLabs · turbo" },
    { label: "Language", value: "English" },
  ],
  2: [
    { label: "Type", value: "Inbound" },
    { label: "Options", value: "Batch calls · Inbound · Code / SDK" },
  ],
  3: [
    { label: "System prompt", value: "Helpful, friendly, and clear — answers questions and gets things done." },
    { label: "Greeting", value: "Hi, thanks for calling — how can I help you today?" },
    { label: "Knowledge", value: "0 attached" },
    { label: "Connectors", value: "0 attached" },
  ],
  4: [
    { label: "Mode", value: "Phone number" },
    { label: "Number", value: "+1 (628) 555-0188" },
  ],
  5: [
    { label: "Status", value: "Deployed · live on +1 (628) 555-0188" },
    { label: "Checklist", value: "Everything's set — redeploy to push changes" },
  ],
}

export const DEPLOY_STATE = {
  headline: "Live on +1 (628) 555-0188",
  sub: "Edit any step — changes go out when you redeploy.",
  cta: "Redeploy",
} as const

/** Small orb for compact headers. */
export function Orb({ size = 56 }: { size?: number }) {
  return <AgentSphere size={size} active={false} />
}
