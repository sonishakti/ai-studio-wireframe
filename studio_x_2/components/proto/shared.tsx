"use client"

/**
 * Shared data contract for the composition-concept prototypes (/agents/proto).
 * THROWAWAY judging harness (round 3, 2026-07-07): five compositions of the
 * SAME builder content, judged on the user's 9 directives (compact, sticky
 * steps, fluid width to 4K, voice dropdown, preset-first stack, honest
 * microcopy with no em dashes, better agent presentation, icon+text Undo,
 * minimum clicks / fast time to first action).
 * Deleted after a winner is applied to the real AgentWizard.
 */

import { AgentSphere } from "@/components/agent-test-panel"

export type ProtoMode = "live" | "draft"

export const AGENT = {
  name: "Aria",
  status: "Live",
  role: "General assistant",
  id: "agt_default",
  language: "English",
  channelLabel: "Inbound",
  channelTarget: "+1 (628) 555-0188",
  cost: "$0.10/min",
  latency: "800 ms",
  prompt: "Helpful, friendly, and clear. Answers questions and gets things done.",
  greeting: "Hi, thanks for calling. How can I help you today?",
} as const

export const DRAFT_AGENT = {
  ...AGENT,
  name: "",
  status: "Draft",
  role: "Pick a voice to start",
} as const

export type StepInfo = {
  n: number
  title: string
  /** Configured values (recognition data); empty while pending. */
  value: string
  /** Contents hint while nothing is set. NO em dashes. */
  manifest: string
  done: boolean
}

export const STEPS: StepInfo[] = [
  { n: 1, title: "Voice & models", value: "Aria · Balanced · gpt-4o-mini · nova-2 · English", manifest: "Voice · Preset · Models · Language", done: true },
  { n: 2, title: "Agent type", value: "Inbound", manifest: "Batch calls · Inbound · Code / SDK", done: true },
  { n: 3, title: "Prompt & tools", value: "Prompt set · Greeting set · 0 knowledge · 0 connectors", manifest: "Prompt · Greeting · Knowledge · Connectors", done: true },
  { n: 4, title: "Phone number", value: "Inbound · +1 (628) 555-0188", manifest: "Phone number · Web widget", done: true },
  { n: 5, title: "Deploy", value: "Live on +1 (628) 555-0188", manifest: "Review · Go live", done: true },
]

export const DRAFT_STEPS: StepInfo[] = STEPS.map((s) => ({
  ...s,
  value: "",
  done: false,
  title: s.n === 4 ? "Connect a channel" : s.title,
  manifest: s.n === 4 ? "Pick a type first" : s.manifest,
}))

/** Voice personas: the differentiator is the tagline (why you'd pick each). */
export const VOICES = [
  { id: "aria", name: "Aria", tagline: "Warm support voice", sample: "Hi, thanks for calling. How can I help you today?" },
  { id: "nova", name: "Nova", tagline: "Crisp sales voice", sample: "Hi! This is a quick call about your account. Do you have a moment?" },
  { id: "sage", name: "Sage", tagline: "Calm and patient", sample: "Hello, you've reached support. Take your time. What can I help with?" },
  { id: "max", name: "Max", tagline: "Upbeat qualifier", sample: "Hey there! Thanks for reaching out. What brings you in today?" },
] as const

/** Preset-first stack config: pick speed vs balance vs cost FIRST, vendors are
 *  suggested automatically. Vendor dropdowns live behind a disclosure. */
export const PRESETS = [
  { id: "fastest", label: "Fastest", hint: "Lowest latency", stack: "gpt-4o-mini · nova-2 · turbo", est: "~620 ms · ~$0.14/min" },
  { id: "balanced", label: "Balanced", hint: "Speed and cost in check", stack: "gpt-4o-mini · nova-2 · turbo", est: "~800 ms · ~$0.10/min" },
  { id: "cheapest", label: "Cheapest", hint: "Lowest cost per minute", stack: "gemini-flash · nova-2 · standard", est: "~1100 ms · ~$0.06/min" },
] as const

export const DEPLOY = {
  live: {
    headline: "Live on +1 (628) 555-0188",
    sub: "Changes apply on your next redeploy.",
    cta: "Redeploy",
  },
  draft: {
    headline: "0 of 4 steps done",
    sub: "Pick a voice to get started.",
    cta: "Deploy",
  },
} as const

export function dataFor(mode: ProtoMode) {
  return mode === "draft"
    ? { agent: DRAFT_AGENT, steps: DRAFT_STEPS, live: false, deploy: DEPLOY.draft }
    : { agent: AGENT, steps: STEPS, live: true, deploy: DEPLOY.live }
}

export function Orb({ size = 40, active = false }: { size?: number; active?: boolean }) {
  return <AgentSphere size={size} active={active} />
}
