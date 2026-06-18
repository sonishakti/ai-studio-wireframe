/**
 * Studio_X — Diagnostics engine
 * ──────────────────────────────
 *
 * A rule-based diagnosis that turns a call's raw signals into severity-rated
 * Issues, each with a plain-language root cause and a **suggested fix that
 * deep-links to where you fix it** (the agent's stack/turn-taking or the
 * deployment's prompt/channel). The same rules power:
 *
 *   • per-call  →  the "Diagnosis" tab in the Call detail sheet (the atom)
 *   • per-deployment / cross-deployment  →  the Observe › Diagnostics queue
 *     (aggregateIssues), where remediation is triaged and routed to its fix.
 *
 * Pure functions over deterministic mock signals — no React, no I/O. Signals
 * are seeded by a stable key (the call id) with the SAME FNV-1a PRNG style the
 * Call detail sheet uses, so a given call always renders the same diagnosis.
 *
 * Learned (features, not UI) from a competitor's session debugger. Per the
 * 2026-06-11 model the diagnosis is computed at the call atom; remediation
 * closes in OBSERVE.
 */

import {
  CURRENT_CONFIG_VERSION,
  deploymentHref,
  getAgent,
  getDeployment,
  listDeployments,
  type Agent,
  type Deployment,
} from "./campaign-data"

// ─── Types ────────────────────────────────────────────────────────────────────

export type Severity = "critical" | "warning" | "info"
export type Health = "healthy" | "degraded" | "unhealthy"
export type CallOutcome = "Successful" | "Failed" | "Cannot Predict"

/** Where a fix lives — becomes a deep-link in the UI (agent editor / deployment). */
export interface FixTarget {
  level: "agent" | "deployment"
  /** Agent id or deployment id. */
  id: string
  /** Section anchor on the target page (e.g. "stack", "turn-taking", "prompt"). */
  section: string
}

export interface Issue {
  /** Stable id: `${seed}:${ruleId}:${turn}` so React keys + dedupe are stable. */
  id: string
  ruleId: string
  title: string
  severity: Severity
  /** 1-based turn the issue occurred on (omitted for whole-call issues like drift). */
  turn?: number
  /** Pseudo timestamp "m:ss" derived from the turn. */
  timestamp?: string
  rootCause: string
  suggestedFix: string
  fixTarget: FixTarget
}

/** Deterministic per-call signal bundle the rules read. */
export interface CallSignals {
  seed: string
  turns: number
  asrConfidence: number[]
  llmLatencyMs: number[]
  network: { loss: number; jitter: number; rtt: number; droppedMidCall: boolean }
  bargeInAttempts: { turn: number; honored: boolean }[]
  toolCalls: { turn: number; name: string; status: "ok" | "timeout" | "error"; ms: number }[]
  deadAirMs: { turn: number; ms: number }[]
  offScript: { turn: number; reason: string }[]
  escalation?: { requested: boolean; connected: boolean; turn: number }
  configVersionAtRun: number
}

export interface DiagnoseCtx {
  agent?: Agent
  deployment?: Deployment
}

/** Deep-link to where an issue is fixed: the agent editor or the deployment page. */
export function fixHref(target: FixTarget): string {
  if (target.level === "agent") return `/agents/${target.id}/edit#${target.section}`
  const dep = getDeployment(target.id)
  return dep ? `${deploymentHref(dep)}#${target.section}` : "/deploy"
}

// ─── Deterministic PRNG (same FNV-1a style as call-detail-sheet) ──────────────

function seeded(id: string): () => number {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619) }
  let s = h >>> 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function stamp(turn: number): string {
  const sec = turn * 8 + 3
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`
}

// ─── Signal synthesis ─────────────────────────────────────────────────────────

export interface BuildSignalsCtx {
  outcome?: CallOutcome
  durationSec?: number
}

/** Build a deterministic signal bundle for a call/session, keyed by `seed`. */
export function buildSignals(seed: string, ctx: BuildSignalsCtx = {}): CallSignals {
  const rnd = seeded(seed + "sig")
  const turns = 6 + Math.floor(rnd() * 8) // 6–13
  const failBias = ctx.outcome === "Failed" ? 0.6 : ctx.outcome === "Cannot Predict" ? 0.3 : 0.12

  const asrConfidence = Array.from({ length: turns }, () =>
    rnd() < 0.18 ? +(0.45 + rnd() * 0.14).toFixed(2) : +(0.72 + rnd() * 0.26).toFixed(2),
  )

  const llmLatencyMs = Array.from({ length: turns }, () =>
    rnd() < 0.15 ? 1300 + Math.round(rnd() * 900) : 200 + Math.round(rnd() * 460),
  )

  const bargeInAttempts: CallSignals["bargeInAttempts"] = []
  const nBarge = rnd() < 0.5 ? 0 : 1 + Math.floor(rnd() * 2)
  for (let i = 0; i < nBarge; i++) {
    bargeInAttempts.push({ turn: 1 + Math.floor(rnd() * turns), honored: rnd() > 0.45 })
  }

  const toolCalls: CallSignals["toolCalls"] = []
  if (rnd() < 0.6) {
    const r = rnd()
    const status: CallSignals["toolCalls"][number]["status"] =
      r < failBias ? "timeout" : r < failBias + 0.08 ? "error" : "ok"
    toolCalls.push({
      turn: 2 + Math.floor(rnd() * Math.max(1, turns - 2)),
      name: "lookup_order",
      status,
      ms: status === "timeout" ? 4000 + Math.round(rnd() * 1500) : 200 + Math.round(rnd() * 600),
    })
  }

  const deadAirMs: CallSignals["deadAirMs"] = []
  const timeout = toolCalls.find((t) => t.status === "timeout")
  if (timeout) deadAirMs.push({ turn: timeout.turn, ms: timeout.ms })
  else if (rnd() < 0.18) deadAirMs.push({ turn: 1 + Math.floor(rnd() * turns), ms: 4000 + Math.round(rnd() * 2000) })

  const loss = +(rnd() * (failBias > 0.4 ? 2.2 : 1.0)).toFixed(2)
  const network = {
    loss,
    jitter: 8 + Math.round(rnd() * 44),
    rtt: 40 + Math.round(rnd() * 140),
    droppedMidCall: loss > 1.2 || rnd() < 0.12,
  }

  const offScript: CallSignals["offScript"] = []
  if (rnd() < (ctx.outcome === "Failed" ? 0.5 : 0.22)) {
    offScript.push({ turn: 1 + Math.floor(rnd() * turns), reason: "answered a different question than the caller asked" })
  }

  let escalation: CallSignals["escalation"]
  if (ctx.outcome === "Failed" && rnd() < 0.7) {
    escalation = { requested: true, connected: rnd() > 0.5, turn: turns }
  }

  const versions = [
    CURRENT_CONFIG_VERSION, CURRENT_CONFIG_VERSION, CURRENT_CONFIG_VERSION,
    CURRENT_CONFIG_VERSION - 1, CURRENT_CONFIG_VERSION - 2, CURRENT_CONFIG_VERSION - 3,
  ]
  const configVersionAtRun = versions[Math.floor(rnd() * versions.length)]

  return { seed, turns, asrConfidence, llmLatencyMs, network, bargeInAttempts, toolCalls, deadAirMs, offScript, escalation, configVersionAtRun }
}

// ─── Fix-target + Issue helpers ───────────────────────────────────────────────

function agentTarget(ctx: DiagnoseCtx, section: string): FixTarget {
  return { level: "agent", id: ctx.agent?.id ?? ctx.deployment?.agentId ?? "", section }
}
function deploymentTarget(ctx: DiagnoseCtx, section: string): FixTarget {
  return { level: "deployment", id: ctx.deployment?.id ?? "", section }
}
function mk(s: CallSignals, ruleId: string, p: Omit<Issue, "id" | "ruleId" | "timestamp">): Issue {
  return { id: `${s.seed}:${ruleId}:${p.turn ?? 0}`, ruleId, timestamp: p.turn ? stamp(p.turn) : undefined, ...p }
}

// ─── Rules (pure: signals + ctx → Issue[]) ────────────────────────────────────

type Rule = (s: CallSignals, ctx: DiagnoseCtx) => Issue[]

const ruleBargeIn: Rule = (s, ctx) => {
  const miss = s.bargeInAttempts.find((b) => !b.honored)
  if (!miss) return []
  return [mk(s, "barge_in_not_honored", {
    title: "Barge-in not honored",
    severity: "critical",
    turn: miss.turn,
    rootCause: "The caller spoke over the agent but it kept talking — the voice couldn't be cancelled mid-sentence.",
    suggestedFix: "Switch to an interruptible voice, or enable provider-side stream cancellation.",
    fixTarget: agentTarget(ctx, "stack"),
  })]
}

const ruleToolTimeout: Rule = (s, ctx) => {
  const bad = s.toolCalls.find((t) => t.status === "timeout" || t.status === "error")
  if (!bad) return []
  return [mk(s, "tool_call_failed", {
    title: "Tool call failed",
    severity: "critical",
    turn: bad.turn,
    rootCause: `\`${bad.name}\` ${bad.status === "timeout" ? `timed out after ${(bad.ms / 1000).toFixed(1)}s` : "returned an error"} — the agent had no data to answer with.`,
    suggestedFix: "Raise the tool timeout or add a fallback so the agent can recover gracefully.",
    fixTarget: deploymentTarget(ctx, "prompt"),
  })]
}

const ruleEscalation: Rule = (s, ctx) => {
  if (!s.escalation?.requested || s.escalation.connected) return []
  return [mk(s, "escalation_failed", {
    title: "Escalation didn't connect",
    severity: "critical",
    turn: s.escalation.turn,
    rootCause: "The agent tried to transfer to a human, but the queue returned no one — the call dropped.",
    suggestedFix: "Set a transfer fallback in the failure message, or check the escalation routing.",
    fixTarget: deploymentTarget(ctx, "prompt"),
  })]
}

const ruleOffScript: Rule = (s, ctx) => {
  const off = s.offScript[0]
  if (!off) return []
  return [mk(s, "off_script", {
    title: "Off-script response",
    severity: "warning",
    turn: off.turn,
    rootCause: `The agent ${off.reason}.`,
    suggestedFix: "Tighten the system prompt to keep the agent on the caller's intent.",
    fixTarget: deploymentTarget(ctx, "prompt"),
  })]
}

const ruleLowAsr: Rule = (s, ctx) => {
  const lows = s.asrConfidence.filter((c) => c < 0.6).length
  if (lows < 1) return []
  const turn = s.asrConfidence.findIndex((c) => c < 0.6) + 1
  return [mk(s, "low_asr_confidence", {
    title: "Low ASR confidence",
    severity: "warning",
    turn,
    rootCause: `Speech recognition was unsure on ${lows} turn${lows > 1 ? "s" : ""} (confidence < 0.60) — the agent may have misheard.`,
    suggestedFix: "Try a higher-accuracy ASR model for noisy phone audio.",
    fixTarget: agentTarget(ctx, "stack"),
  })]
}

const ruleLlmSpike: Rule = (s, ctx) => {
  const max = Math.max(...s.llmLatencyMs)
  if (max <= 1200) return []
  const turn = s.llmLatencyMs.indexOf(max) + 1
  return [mk(s, "llm_latency_spike", {
    title: "LLM latency spike",
    severity: "warning",
    turn,
    rootCause: `Time-to-first-token hit ${(max / 1000).toFixed(1)}s — well above the sub-second target, leaving the caller waiting.`,
    suggestedFix: "Use a faster model, or enable streaming so tokens start sooner.",
    fixTarget: agentTarget(ctx, "stack"),
  })]
}

const ruleNetwork: Rule = (s, ctx) => {
  if (!s.network.droppedMidCall && s.network.loss <= 0.8) return []
  return [mk(s, "network_quality_dropped", {
    title: "Network quality dropped",
    severity: "warning",
    rootCause: `Packet loss ${s.network.loss}% · jitter ${s.network.jitter}ms degraded the audio mid-call.`,
    suggestedFix: "Pin the deployment to a region closer to your callers to cut loss and jitter.",
    fixTarget: deploymentTarget(ctx, "channel"),
  })]
}

const ruleDeadAir: Rule = (s, ctx) => {
  const gap = s.deadAirMs.find((d) => d.ms > 4000)
  if (!gap) return []
  return [mk(s, "dead_air", {
    title: "Dead air",
    severity: "warning",
    turn: gap.turn,
    rootCause: `${(gap.ms / 1000).toFixed(1)}s of silence — the agent went quiet while waiting on a tool.`,
    suggestedFix: "Add a filler line while tools run, or shorten the endpointing window.",
    fixTarget: agentTarget(ctx, "stack"),
  })]
}

const ruleConfigDrift: Rule = (s, ctx) => {
  const current = ctx.agent?.version ?? CURRENT_CONFIG_VERSION
  if (s.configVersionAtRun >= current) return []
  return [mk(s, "config_drift", {
    title: "Config drift",
    severity: "warning",
    rootCause: `This call ran config v${s.configVersionAtRun}, but the agent is now v${current} — the diagnosis may reflect an older setup.`,
    suggestedFix: `Re-publish the deployment so it ships the current v${current} config.`,
    fixTarget: agentTarget(ctx, "stack"),
  })]
}

export const RULES: Rule[] = [
  ruleBargeIn, ruleToolTimeout, ruleEscalation, ruleOffScript,
  ruleLowAsr, ruleLlmSpike, ruleNetwork, ruleDeadAir, ruleConfigDrift,
]

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 }
const SEVERITY_WEIGHT: Record<Severity, number> = { critical: 100, warning: 10, info: 1 }

/** Diagnose a single call/session from its signals. Sorted severity → turn. */
export function diagnoseCall(s: CallSignals, ctx: DiagnoseCtx): Issue[] {
  return RULES.flatMap((r) => r(s, ctx)).sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || (a.turn ?? 99) - (b.turn ?? 99),
  )
}

/** Roll a set of issues up to a health verdict. */
export function healthOf(issues: Issue[]): { status: Health; criticals: number; warnings: number } {
  const criticals = issues.filter((i) => i.severity === "critical").length
  const warnings = issues.filter((i) => i.severity === "warning").length
  return { status: criticals > 0 ? "unhealthy" : warnings > 0 ? "degraded" : "healthy", criticals, warnings }
}

// ─── Aggregation (for the Observe › Diagnostics queue) ────────────────────────

export interface AggregatedIssue {
  issue: Issue
  count: number
  deployment: Deployment
}

function pickOutcome(d: Deployment, i: number, n: number): CallOutcome {
  const failRate = 1 - d.metrics.successRate / 100
  return (i % n) / n < failRate ? "Failed" : "Successful"
}

/** Diagnose a deployment's (synthetic) calls and group by rule, ranked by
 *  severity × frequency. Deployments with no traffic yet return []. */
export function aggregateIssues(deploymentId: string): AggregatedIssue[] {
  const d = getDeployment(deploymentId)
  if (!d || d.metrics.calls === 0) return []
  const agent = getAgent(d.agentId)
  const n = Math.min(8, Math.max(2, Math.round(d.metrics.calls / 400)))
  const byRule = new Map<string, { issue: Issue; count: number }>()
  for (let i = 0; i < n; i++) {
    const signals = buildSignals(`${deploymentId}-c${i}`, { outcome: pickOutcome(d, i, n) })
    for (const issue of diagnoseCall(signals, { agent, deployment: d })) {
      const cur = byRule.get(issue.ruleId)
      if (cur) cur.count++
      else byRule.set(issue.ruleId, { issue, count: 1 })
    }
  }
  return [...byRule.values()]
    .map((v) => ({ ...v, deployment: d }))
    .sort((a, b) => SEVERITY_WEIGHT[b.issue.severity] * b.count - SEVERITY_WEIGHT[a.issue.severity] * a.count)
}

/** Cross-deployment remediation feed for the Diagnostics queue — every open
 *  issue across deployments that have carried traffic, ranked severity × count. */
export function allOpenIssues(): AggregatedIssue[] {
  return listDeployments()
    .flatMap((d) => aggregateIssues(d.id))
    .sort((a, b) => SEVERITY_WEIGHT[b.issue.severity] * b.count - SEVERITY_WEIGHT[a.issue.severity] * a.count)
}

/** Health roll-up for one deployment (used for header dots + the queue summary). */
export function deploymentHealth(deploymentId: string): { status: Health; criticals: number; warnings: number } {
  const agg = aggregateIssues(deploymentId)
  return healthOf(agg.map((a) => a.issue))
}
