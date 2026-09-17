/**
 * Studio_X — Analytics scaffolding
 * ─────────────────────────────────
 *
 * Event taxonomy + tracking helpers. Wire to your real provider (Segment,
 * Amplitude, PostHog, etc.) in `dispatch()`. Right now this just logs to the
 * console + the `__SX_EVENTS__` window buffer so the wireframe can demo the
 * full instrumentation surface.
 *
 * Naming convention: `object_verb_past_tense` (Segment style)
 *   ✓ agent_published, project_switched, quota_warning_clicked
 *   ✗ click_button, page_view, button_clicked (too generic)
 *
 * What we are NOT tracking (CLAUDE.md "Don't re-litigate"):
 *   ✗ time-on-page · session length · DAU as primary KPIs
 *   These are session-hygiene metrics, not product success metrics.
 */

// ─── Event names — single source of truth ────────────────────────────────────

export const Events = {
  // ── Activation funnel ──────────────────────────────────────────────────────
  // 2026-06-17 revenue realignment (LEARNINGS §20): the north star moved OFF
  // agent_published — publishing an agent earns Agora $0 — and ONTO traffic on a
  // live deployment. Revenue = minutes consumed → free tier exhausted → paid.
  signup_completed:           "signup_completed",
  project_created:            "project_created",
  default_agent_provisioned:  "default_agent_provisioned",  // auto-agent live on signup
  agent_template_browsed:     "agent_template_browsed",
  agent_template_selected:    "agent_template_selected",
  agent_created:              "agent_created",
  // Import as a way to START, not a tool beside the list (design 09). The
  // counts are the honesty of the promise: what carried, and what did not.
  agent_import_reviewed:      "agent_import_reviewed",       // { source, mapped, dropped, entry }
  agent_imported:             "agent_imported",              // { source, mapped, dropped }
  legacy_config_updated:      "legacy_config_updated",       // { keys } — retired settings rewritten
  agent_switched:             "agent_switched",              // { to_id, status } — change deploy target
  stack_preset_changed:       "stack_preset_changed",        // { agent_id, preset } — cost-vs-speed dimension picked
  test_outcome_selected:      "test_outcome_selected",        // { outcome, agent_id } the test→deploy hinge
  agent_published:            "agent_published",              // mid-funnel signal (no longer north star)
  put_to_work_selected:       "put_to_work_selected",         // { channel: inbound|campaign|web }
  deployment_went_live:       "deployment_went_live",         // ★ NORTH STAR — traffic on a live deployment
  time_to_live_ms:            "time_to_live_ms",              // ★ <3-min deploy — ms from build start → went live
  first_minutes_consumed:     "first_minutes_consumed",       // first billable conversation
  free_tier_exhausted:        "free_tier_exhausted",          // ★ revenue gate — crossed 300 free min
  agent_test_started:         "agent_test_started",          // ★ moment of belief — { channel, agent_id, intent?, direction? }
  agent_test_ended:           "agent_test_ended",            // { channel, agent_id, duration_sec, direction? }

  // ── TTFA — the builder's own clock (KPI plan 2026-09-15) ───────────────────
  // docs/strategy/agent-builder-kpis.md §3. TTFA is ACTIVE time from
  // builder_opened to agent_audio_heard, winsorised at 900 s. Three legs decide
  // whether a test counts: it was not the demo auto-start, the agent actually
  // took a turn, and the builder had changed a default before it ran.
  builder_opened:             "builder_opened",              // ★ TTFA start — { agent_id, is_edit, is_live }
  builder_section_opened:     "builder_section_opened",      // { agent_id, section, source }
  agent_audio_heard:          "agent_audio_heard",           // ★ TTFA stop — the agent spoke
  test_refused:               "test_refused",                // { agent_id, code } — a refusal is not an error
  deploy_blocked:             "deploy_blocked",              // { agent_id, code, block_count } — CODES ONLY, never the reason text

  // ── Half-tier card nudge (2026-06-22) ──────────────────────────────────────
  // Agora bills per minute and doesn't sell/port numbers, so the card sits on
  // USAGE: the free tier is split 150 (no card) + 150 (card unlocks). At 150 min
  // used we nudge for a card; adding it unlocks the next 150 free AND puts a card
  // on file BEFORE exhaustion, so usage rolls into PAYG instead of a suspension.
  free_minutes_halfway:       "free_minutes_halfway",        // ★ the nudge moment — { used, ungated }
  card_captured:              "card_captured",               // ★ activation — card added at the nudge — { agent_id, at_minute }
  free_minutes_unlocked:      "free_minutes_unlocked",       // +150 free unlocked by the card — { unlocked, included }
  first_paid_minute:          "first_paid_minute",           // ★ replaces the deleted suspend→reactivate CAC loop — { agent_id }

  // ── Spend controls (X1, 2026-07-09) — the bill-shock counter-metric set.
  // spend_alert_fired MUST precede spend_cap_hit for the same cap: a cap hit
  // with no prior alert is the failure these events exist to catch.
  spend_cap_set:              "spend_cap_set",               // { cap_usd, alert_pct, pre_card } — user set/changed their cap
  spend_cap_raised:           "spend_cap_raised",            // { from_usd, to_usd, at_spend_usd } — raised at/near the wall
  spend_cap_hit:              "spend_cap_hit",               // { cap_usd, projected_usd } — new calls paused by the user's cap
  spend_alert_fired:          "spend_alert_fired",           // { pct_of_cap, cap_usd } — threshold warning before the wall
  projected_bill_viewed:      "projected_bill_viewed",       // { projected_usd, spend_state } — estimate seen on Billing

  // ── Concurrent lines (A6, 2026-07-09) — the wall is a conversion moment.
  concurrency_wall_viewed:    "concurrency_wall_viewed",     // { lines, queued } — user saw the at-capacity state
  lines_added:                "lines_added",                 // { qty, prorated_charge_usd } — negative qty = reduction
  keep_queuing_clicked:       "keep_queuing_clicked",        // { lines } — declined the upsell; queueing as designed

  // ── ITSP quick-connect (A3, 2026-07-09) — key → auto-configured SIP trunk.
  // The whole point is a REAL test call closes it: test_call_connected is the
  // success line, not "trunk_created" (provisioning success ≠ call success).
  sip_quick_connect_started:  "sip_quick_connect_started",   // { provider, credential: token|scoped_key }
  credentials_validated:      "credentials_validated",       // { provider }
  numbers_enumerated:         "numbers_enumerated",          // { count }
  number_picked:              "number_picked",               // { mode: auto|manual }
  trunk_created:              "trunk_created",               // { provider }
  test_call_placed:           "test_call_placed",            // {} — user pressed Place test call
  test_call_connected:        "test_call_connected",         // {} ★ the real success line
  trunk_disconnected:         "trunk_disconnected",          // { provider } — Agora stops using the credential
  manual_fallback_opened:     "manual_fallback_opened",      // {} — escaped to the manual SIP form

  // ── Batch pacing / throttling (D1, 2026-07-09) — "paced ≠ failed".
  batch_detail_viewed:        "batch_detail_viewed",         // { pacing }
  batch_banner_shown:         "batch_banner_shown",          // { tone } — the one-sentence verdict
  batch_fix_trunk_clicked:    "batch_fix_trunk_clicked",     // {} — degraded → fix the trunk
  batch_resume_anyway_clicked:"batch_resume_anyway_clicked", // {} — informed resume of a degraded batch
  batch_add_lines_clicked:    "batch_add_lines_clicked",     // { cap_headroom_usd } — the A6 unlock at the wall
  disposition_breakdown_expanded: "disposition_breakdown_expanded", // {}

  // ── Evals / simulation (F-Eval, 2026-07-09) — prove it works before it ships.
  test_authored:              "test_authored",               // {} — a new eval case
  test_run_started:           "test_run_started",            // {} — a simulated caller run began
  test_run_completed:         "test_run_completed",          // { verdict }
  suite_run_all:              "suite_run_all",               // {} — batch run
  assertion_failed_viewed:    "assertion_failed_viewed",     // {} — inspected a failing check
  save_call_as_test:          "save_call_as_test",           // {} ★ whitespace — a real call → regression case

  // ── Defector — radical paste-to-live experiment (/defect, 2026-06-22) ───────
  defect_paste_submitted:     "defect_paste_submitted",      // { source } — a switcher pasted a rival config on the standalone surface
  defect_cloned_live:         "defect_cloned_live",          // { source, agent_id } — their agent is cloned + talking on Agora

  // ── Telephony deployment ───────────────────────────────────────────────────
  phone_number_imported:      "phone_number_imported",
  phone_number_assigned:      "phone_number_assigned",
  campaign_created:           "campaign_created",
  campaign_launched:          "campaign_launched",

  // ── Insights (wayfinding the Insights group solves) ────────────────────────
  monitor_viewed:             "monitor_viewed",
  calls_viewed:               "calls_viewed",
  sessions_viewed:            "sessions_viewed",
  // Q3 roadmap: session detail beyond telephony + payload/trace inspection.
  // `session_span_fix_clicked` is the one that matters — it measures whether
  // the trace actually routes a slow hop to the control that fixes it.
  session_detail_viewed:      "session_detail_viewed",     // { session_id, channel, turns, p95_ms }
  session_transcript_seek:    "session_transcript_seek",   // { session_id, turn }
  session_payload_opened:     "session_payload_opened",    // { session_id, turn }
  session_trace_exported:     "session_trace_exported",    // { session_id }
  session_span_fix_clicked:   "session_span_fix_clicked",  // ★ { session_id, span }
  session_jump_to_slowest:    "session_jump_to_slowest",   // { session_id, turn }
  usage_viewed:               "usage_viewed",
  insights_cross_link_clicked:"insights_cross_link_clicked",  // Monitor → Usage etc.

  // ── Diagnostics (Observe → remediation loop) ───────────────────────────────
  call_diagnosis_viewed:      "call_diagnosis_viewed",     // { call_id, criticals, warnings }
  diagnostics_queue_viewed:   "diagnostics_queue_viewed",  // { unhealthy, degraded }
  remediation_link_clicked:   "remediation_link_clicked",  // ★ did remediation route to a fix?
  remediation_resolved:       "remediation_resolved",      // ★ user marked a fix done → re-running checks
  config_drift_detected:      "config_drift_detected",     // { level, id, ran_version, current_version }

  // ── Monitor watches (13, 2026-09-17) — the alert loop's own counter-metric set.
  // watch_fired MUST precede alert_fix_opened for the same watch: a config edit
  // after a degradation with no watch_fired before it is the miss this set
  // exists to catch, and page views cannot see it.
  monitor_watch_set:          "monitor_watch_set",         // { metric, deployment_id, comparison, basis, frequency }
  monitor_watch_removed:      "monitor_watch_removed",     // { metric, deployment_id }
  watch_fired:                "watch_fired",               // ★ { metric, deployment_id, comparison, value } — the number crossed the line
  watch_resolved:             "watch_resolved",            // { metric, deployment_id, value } — the all-clear
  alert_fix_opened:           "alert_fix_opened",          // ★ { metric, deployment_id, rule_id } — the breach routed to a fix

  // ── Project switching ──────────────────────────────────────────────────────
  project_switcher_opened:    "project_switcher_opened",
  project_switched:           "project_switched",
  all_projects_viewed:        "all_projects_viewed",

  // ── Account & billing ──────────────────────────────────────────────────────
  account_menu_opened:        "account_menu_opened",
  billing_overview_viewed:    "billing_overview_viewed",
  plan_compared:              "plan_compared",
  plan_upgraded:              "plan_upgraded",
  quota_warning_clicked:      "quota_warning_clicked",   // Usage → Plans CTA

  // ── Wayfinding & power-user signals ────────────────────────────────────────
  command_palette_opened:     "command_palette_opened",  // ⌘K
  command_executed:           "command_executed",
  search_zero_results:        "search_zero_results",
  destructive_action_canceled:"destructive_action_canceled",   // AlertDialog dismissed
  destructive_action_confirmed:"destructive_action_confirmed",

  // ── Security / certificate rotation ────────────────────────────────────────
  cert_swap_confirmed:              "cert_swap_confirmed",
  cert_secondary_enabled:           "cert_secondary_enabled",
  cert_secondary_disable_requested: "cert_secondary_disable_requested",

  // ── Campaign creation ──────────────────────────────────────────────────────
  // (deploy_chooser_* removed 2026-06-23 — the chooser sheet was deleted; the
  //  in-editor deploy surface is now the breadcrumb's Deployment section.)
  campaign_wizard_step_completed:   "campaign_wizard_step_completed",
  campaign_channel_added:           "campaign_channel_added",
  campaign_channel_removed:         "campaign_channel_removed",

  // ── Composer voice call ────────────────────────────────────────────────────
  composer_voice_started:           "composer_voice_started",
  composer_voice_ended:             "composer_voice_ended",      // { duration_sec, turns }
  composer_voice_muted:             "composer_voice_muted",      // { muted }
  composer_voice_debug_toggled:     "composer_voice_debug_toggled",   // { open }
  composer_voice_captions_toggled:  "composer_voice_captions_toggled", // { on }
  composer_voice_talk_turn:         "composer_voice_talk_turn",       // { turn }
  composer_doc_attached:            "composer_doc_attached",          // { name, during_call }

  // ── Errors & resilience ────────────────────────────────────────────────────
  page_error_rendered:        "page_error_rendered",
  not_found_rendered:         "not_found_rendered",
  form_validation_failed:     "form_validation_failed",
  toast_dismissed:            "toast_dismissed",
} as const

export type EventName = (typeof Events)[keyof typeof Events]

// ─── Event payloads — typed per event for safety ──────────────────────────────

export type EventPayloads = {
  agent_published:             { agent_id: string; template_id?: string; time_to_first_agent_ms?: number }
  project_switched:            { from_project_id: string; to_project_id: string }
  insights_cross_link_clicked: { from: "monitor" | "calls" | "usage"; to: "monitor" | "calls" | "usage" }
  quota_warning_clicked:       { meter: string; pct_used: number }
  test_outcome_selected:       { outcome: "tweak" | "deploy"; agent_id: string }
  agent_switched:              { to_id: string; status: "live" | "draft" | "paused" }
  agent_import_reviewed:       { source: string; mapped: number; dropped: number; entry: "create" | "list" }
  agent_imported:              { source: string; mapped: number; dropped: number }
  legacy_config_updated:       { keys: string[] }
  stack_preset_changed:        { agent_id: string; preset: "fastest" | "balanced" | "cheapest" }
  free_minutes_halfway:        { used: number; ungated: number }
  card_captured:               { agent_id: string; at_minute: number }
  free_minutes_unlocked:       { unlocked: number; included: number }
  first_paid_minute:           { agent_id: string }
  spend_cap_set:               { cap_usd: number; alert_pct: number; pre_card: boolean }
  spend_cap_raised:            { from_usd: number; to_usd: number; at_spend_usd: number }
  spend_cap_hit:               { cap_usd: number; projected_usd: number }
  spend_alert_fired:           { pct_of_cap: number; cap_usd: number }
  projected_bill_viewed:       { projected_usd: number; spend_state: string }
  concurrency_wall_viewed:     { lines: number; queued: number }
  lines_added:                 { qty: number; prorated_charge_usd: number }
  keep_queuing_clicked:        { lines: number }
  sip_quick_connect_started:   { provider: string; credential: "token" | "scoped_key" }
  credentials_validated:       { provider: string }
  numbers_enumerated:          { count: number }
  number_picked:               { mode: "auto" | "manual" }
  trunk_created:               { provider: string }
  test_call_placed:            Record<string, never>
  test_call_connected:         Record<string, never>
  trunk_disconnected:          { provider: string }
  manual_fallback_opened:      Record<string, never>
  batch_detail_viewed:         { pacing: string }
  batch_banner_shown:          { tone: string }
  batch_fix_trunk_clicked:     Record<string, never>
  batch_resume_anyway_clicked: Record<string, never>
  batch_add_lines_clicked:     { cap_headroom_usd: number | null }
  disposition_breakdown_expanded: Record<string, never>
  test_authored:               Record<string, never>
  test_run_started:            Record<string, never>
  test_run_completed:          { verdict: string }
  suite_run_all:               Record<string, never>
  assertion_failed_viewed:     Record<string, never>
  save_call_as_test:           Record<string, never>
  call_diagnosis_viewed:       { call_id: string; criticals: number; warnings: number }
  session_detail_viewed:       { session_id: string; channel: string; turns: number; p95_ms: number }
  session_transcript_seek:     { session_id: string; turn: number }
  session_payload_opened:      { session_id: string; turn: number }
  session_trace_exported:      { session_id: string }
  session_span_fix_clicked:    { session_id: string; span: string }
  session_jump_to_slowest:     { session_id: string; turn: number }
  diagnostics_queue_viewed:    { unhealthy: number; degraded: number }
  remediation_link_clicked:    { rule_id: string; severity: string; level: "agent" | "deployment" | "credential"; target_id: string; section: string; surface: "call_sheet" | "queue" | "monitor" }
  remediation_resolved:        { rule_id: string; level: "agent" | "deployment" | "credential"; target_id: string; deployment_id?: string }
  time_to_live_ms:             { ms: number; agent_id?: string }
  builder_opened:              { agent_id: string; is_edit: boolean; is_live: boolean }
  builder_section_opened:      { agent_id: string; section: number; source: "rail" | "header" | "link" | "fix" }
  agent_audio_heard:           { agent_id: string; trigger: TestTrigger; turn_count: number; configured_by_user: boolean; counts_toward_ttfa: boolean; ttfa_active_ms?: number; over_ceiling: boolean }
  test_refused:                { agent_id: string; code: TestRefusedCode }
  deploy_blocked:              { agent_id: string; code: DeployBlockedCode; block_count: number }
  config_drift_detected:       { level: "agent" | "deployment" | "credential"; id: string; ran_version: number; current_version: number }
  command_executed:            { command: string; surface: "palette" | "shortcut" }
  destructive_action_confirmed:{ resource: string; resource_id: string }
  destructive_action_canceled: { resource: string; resource_id: string }
  page_error_rendered:         { path: string; digest?: string }
  form_validation_failed:      { form: string; field: string; error: string }
  [k: string]: Record<string, unknown> | undefined
}

// ─── Core tracking ─────────────────────────────────────────────────────────────

declare global {
  interface Window {
    __SX_EVENTS__?: Array<{ ts: number; name: string; props?: Record<string, unknown> }>
  }
}

/**
 * Track an event. Replace `dispatch` with your provider integration.
 *
 * Usage:
 *   track(Events.agent_published, { agent_id: "agt_01", time_to_first_agent_ms: 8214 })
 */
export function track<K extends EventName>(name: K, props?: EventPayloads[K]) {
  const event = { ts: Date.now(), name, props }

  // Buffer in window so the wireframe can show "what got tracked"
  if (typeof window !== "undefined") {
    window.__SX_EVENTS__ ??= []
    window.__SX_EVENTS__.push(event)
    // Keep last 100 only
    if (window.__SX_EVENTS__.length > 100) window.__SX_EVENTS__.shift()
  }

  dispatch(event)
}

function dispatch(event: { ts: number; name: string; props?: Record<string, unknown> }) {
  // TODO: replace with provider — Segment/Amplitude/PostHog
  // Example: window.analytics?.track(event.name, event.props)
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug("[track]", event.name, event.props ?? "")
  }
}

// ─── Activation timing — time-to-first-agent helpers ──────────────────────────
//
// Persist signup_completed timestamp so agent_published can compute TTFA.

const SIGNUP_KEY = "sx:signup_ts"

export function markSignup(ts = Date.now()) {
  if (typeof window === "undefined") return
  if (!window.localStorage.getItem(SIGNUP_KEY)) {
    window.localStorage.setItem(SIGNUP_KEY, String(ts))
  }
}

export function timeSinceSignup(): number | undefined {
  if (typeof window === "undefined") return undefined
  const raw = window.localStorage.getItem(SIGNUP_KEY)
  if (!raw) return undefined
  return Date.now() - parseInt(raw, 10)
}

// ─── Time-to-live — the <3-min deploy spine ───────────────────────────────────
//
// Stamp when the user starts building (agent editor mount) so deployment_went_live
// can report ms-to-live. Reset after a deploy so the next build is measured fresh.

const BUILD_START_KEY = "sx:build_start_ts"

/** Mark the start of a build attempt (set once until a deploy clears it). */
export function markBuildStart(ts = Date.now()) {
  if (typeof window === "undefined") return
  if (!window.localStorage.getItem(BUILD_START_KEY)) {
    window.localStorage.setItem(BUILD_START_KEY, String(ts))
  }
}

/** ms since the build started, then clear the stamp so the next build is fresh. */
export function timeToLiveMs(): number | undefined {
  if (typeof window === "undefined") return undefined
  const raw = window.localStorage.getItem(BUILD_START_KEY)
  if (!raw) return undefined
  window.localStorage.removeItem(BUILD_START_KEY)
  return Date.now() - parseInt(raw, 10)
}

// ─── Remediation confirm — persist "marked fixed" so the queue can re-check ────
//
// When a user clicks a Fix link we persist {ruleId, deploymentId} so that on
// return to the Diagnostics queue the row shows "re-running checks" and then
// fires remediation_resolved — closing the detect→explain→route→confirm loop.

const REMEDIATION_KEY = "sx:remediations"

/** Stable key for a remediation: which rule, on which target/deployment. */
export function remediationKey(ruleId: string, deploymentId: string): string {
  return `${ruleId}::${deploymentId}`
}

export function recordRemediation(key: string) {
  if (typeof window === "undefined") return
  const list = listRemediations()
  if (!list.includes(key)) {
    window.localStorage.setItem(REMEDIATION_KEY, JSON.stringify([...list, key]))
  }
}

export function listRemediations(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(REMEDIATION_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function clearRemediation(key: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(
    REMEDIATION_KEY,
    JSON.stringify(listRemediations().filter((k) => k !== key)),
  )
}


// ─── TTFA — the builder clock (KPI plan, docs/strategy/agent-builder-kpis.md) ──
//
// Wall-clock counts the tab somebody left open over lunch, so the number that
// matters is ACTIVE time: accumulated from visibilitychange deltas, never from
// a tick counter, with any single visible stretch longer than the idle gap
// thrown away. It is winsorised at the ceiling three ways — qualification,
// winsorisation, failure classification — so nobody can compute two different
// numbers from the same session.

/** Past this a session is a failure, not a slow success. The smallest natural
 *  working block a developer has (Parnin & Rugaber, ICPC 2009). */
export const TTFA_CEILING_MS = 900_000
/** A gap longer than this is idle, not work. */
const TTFA_IDLE_GAP_MS = 120_000

/** How a test was started. `auto` is the demo agent's 150 ms auto-start and is
 *  excluded from every metric — left in, the headline speed number would be
 *  generated by a setTimeout. */
export type TestTrigger = "auto" | "header" | "opening" | "rail" | "mobile_strip"

/** Why a test could not start. Quota and payment are refusals, not errors. */
export type TestRefusedCode =
  | "mic_denied" | "quota_exhausted" | "payment_required"
  | "no_voice" | "runtime_unavailable" | "user_cancelled"

/** Closed list. `publishBlocks()` interpolates campaign names the user typed,
 *  so the reason STRING may never reach an analytics property — only a code. */
export type DeployBlockedCode =
  | "no_voice" | "no_channel" | "no_surface" | "no_number" | "no_prompt"
  | "batch_no_run" | "batch_no_number" | "batch_no_csv" | "batch_no_schedule"
  | "batch_uncovered_vars" | "other"

interface ActiveClock { active: number; since: number | null }
const ttfaClocks = new Map<string, ActiveClock>()
let ttfaListening = false

const clockNow = () => (typeof performance !== "undefined" ? performance.now() : Date.now())

function settleClock(c: ActiveClock) {
  if (c.since === null) return
  const delta = clockNow() - c.since
  if (delta < TTFA_IDLE_GAP_MS) c.active += delta
  c.since = null
}

/** Start or resume the active clock for a key (normally the agent id). */
export function startActiveClock(key: string) {
  if (!ttfaListening && typeof document !== "undefined") {
    ttfaListening = true
    document.addEventListener("visibilitychange", () => {
      for (const c of ttfaClocks.values()) {
        if (document.visibilityState === "hidden") settleClock(c)
        else if (c.since === null) c.since = clockNow()
      }
    })
  }
  const c = ttfaClocks.get(key)
  if (c) { if (c.since === null) c.since = clockNow() ; return }
  ttfaClocks.set(key, { active: 0, since: clockNow() })
}

function rawActiveMs(key: string): number | null {
  const c = ttfaClocks.get(key)
  if (!c) return null
  const live = c.since === null ? 0 : Math.min(clockNow() - c.since, TTFA_IDLE_GAP_MS)
  return c.active + live
}

/** Active ms so far, winsorised at the ceiling. null if never started. */
export function readActiveClock(key: string): number | null {
  const raw = rawActiveMs(key)
  return raw === null ? null : Math.min(raw, TTFA_CEILING_MS)
}

/** Did this session blow the ceiling? Counted as a failure, not a slow win. */
export function overTtfaCeiling(key: string): boolean {
  const raw = rawActiveMs(key)
  return raw !== null && raw > TTFA_CEILING_MS
}

/** Call once when the builder mounts: starts the TTFA clock for this agent. */
export function builderOpened(agentId: string, p: { isEdit: boolean; isLive: boolean }) {
  startActiveClock(agentId)
  track(Events.builder_opened, { agent_id: agentId, is_edit: p.isEdit, is_live: p.isLive })
}

/**
 * The agent spoke — the TTFA stop, and the only event the north star counts.
 *
 * `configured_by_user` is the anti-gaming leg: picking a voice fills the name,
 * prompt and greeting in one click, so a voice pick is not evidence anybody
 * configured anything. A changed prompt, an edited greeting or a bound channel is.
 */
export function agentAudioHeard(agentId: string, p: {
  trigger: TestTrigger
  turnCount: number
  configuredByUser: boolean
}) {
  track(Events.agent_audio_heard, {
    agent_id: agentId,
    trigger: p.trigger,
    turn_count: p.turnCount,
    configured_by_user: p.configuredByUser,
    // Recorded, not filtered here — the exclusion has to be auditable downstream.
    counts_toward_ttfa: p.trigger !== "auto" && p.turnCount >= 1 && p.configuredByUser,
    ttfa_active_ms: readActiveClock(agentId) ?? undefined,
    over_ceiling: overTtfaCeiling(agentId),
  })
}
