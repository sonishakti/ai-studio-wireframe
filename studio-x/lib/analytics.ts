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
  agent_intent_selected:      "agent_intent_selected",       // 1-tap "what should it do?" re-skin
  web_test_call_started:      "web_test_call_started",        // ★ moment of belief (in-browser)
  web_test_call_ended:        "web_test_call_ended",          // { duration_sec }
  phone_test_call_started:    "phone_test_call_started",      // { direction } agent↔your real phone
  phone_test_call_connected:  "phone_test_call_connected",    // { direction }
  phone_test_call_ended:      "phone_test_call_ended",        // { direction, duration_sec }
  test_number_copied:         "test_number_copied",           // dial-in sandbox number copied
  test_outcome_selected:      "test_outcome_selected",        // { outcome } the test→tweak→deploy hinge
  agent_published:            "agent_published",              // mid-funnel signal (no longer north star)
  put_to_work_selected:       "put_to_work_selected",         // { channel: inbound|campaign|web }
  deployment_went_live:       "deployment_went_live",         // ★ NORTH STAR — traffic on a live deployment
  first_minutes_consumed:     "first_minutes_consumed",       // first billable conversation
  free_tier_exhausted:        "free_tier_exhausted",          // ★ revenue gate — crossed 300 free min
  agent_test_started:         "agent_test_started",

  // ── Telephony deployment ───────────────────────────────────────────────────
  phone_number_imported:      "phone_number_imported",
  phone_number_assigned:      "phone_number_assigned",
  campaign_created:           "campaign_created",
  campaign_launched:          "campaign_launched",

  // ── Insights (wayfinding the Insights group solves) ────────────────────────
  monitor_viewed:             "monitor_viewed",
  calls_viewed:               "calls_viewed",
  sessions_viewed:            "sessions_viewed",
  usage_viewed:               "usage_viewed",
  insights_cross_link_clicked:"insights_cross_link_clicked",  // Monitor → Usage etc.

  // ── Diagnostics (Observe → remediation loop) ───────────────────────────────
  call_diagnosis_viewed:      "call_diagnosis_viewed",     // { call_id, criticals, warnings }
  diagnostics_queue_viewed:   "diagnostics_queue_viewed",  // { unhealthy, degraded }
  remediation_link_clicked:   "remediation_link_clicked",  // ★ did remediation route to a fix?
  config_drift_detected:      "config_drift_detected",     // { level, id, ran_version, current_version }

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

  // ── Deploy chooser & campaign creation ────────────────────────────────────
  deploy_chooser_viewed:            "deploy_chooser_viewed",
  deploy_chooser_option_selected:   "deploy_chooser_option_selected",
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
  phone_test_call_started:     { direction: "outbound" | "inbound" }
  phone_test_call_connected:   { direction: "outbound" | "inbound" }
  phone_test_call_ended:       { direction: "outbound" | "inbound"; duration_sec: number }
  test_outcome_selected:       { outcome: "tweak" | "deploy" }
  call_diagnosis_viewed:       { call_id: string; criticals: number; warnings: number }
  diagnostics_queue_viewed:    { unhealthy: number; degraded: number }
  remediation_link_clicked:    { rule_id: string; severity: string; level: "agent" | "deployment"; target_id: string; section: string; surface: "call_sheet" | "queue" }
  config_drift_detected:       { level: "agent" | "deployment"; id: string; ran_version: number; current_version: number }
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
