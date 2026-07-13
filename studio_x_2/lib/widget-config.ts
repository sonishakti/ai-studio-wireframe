/**
 * Widget config — the web widget's behaviour/styling, shared by the builder's
 * INLINE studio (Step 4 · web mode) and the standalone Deploy › Web Widget page.
 *
 * Persisted PER AGENT (`sx:widget_cfg:<id>`, "new" while a draft is unpublished),
 * deliberately NOT on the AgentDraft: widget styling ships via the embed snippet
 * the user re-copies, not via redeploy — on the draft it would feed the builder's
 * "Edits are not live yet. Redeploy to apply." line, which is false for the
 * widget. One store also means the builder and the standalone studio can never
 * show the same agent two different widgets.
 */

export interface WidgetConfig {
  interactionMode: "voice-chat" | "voice" | "chat"
  theme: "dark" | "light"
  blobStyle: "aura" | "orb" | "pulse"
  buttonLabel: string
  greeting: string
  listeningStatus: string
  connectingStatus: string
  errorMessage: string
  brandColor: string
  brandTextColor: string
  fontColor: string
  secondaryColor: string
  bgColor: string
  // Semantic colors
  successColor: string
  warningColor: string
  errorColor: string
  // Input fields
  inputBg: string
  inputPlaceholder: string
  inputRadius: number
  // UI elements
  showMic: boolean
  showChat: boolean
  showClose: boolean
  poweredBy: boolean
}

export const WIDGET_DEFAULTS: WidgetConfig = {
  interactionMode: "voice-chat",
  theme: "dark",
  blobStyle: "aura",
  buttonLabel: "Try our Voice AI Agent",
  greeting: "Hi there, I'm Agora Agent. How can I help you today?",
  listeningStatus: "Agent Listening…",
  connectingStatus: "Connecting…",
  errorMessage: "An error occurred",
  brandColor: "#099DFD",
  brandTextColor: "#FFFFFF",
  fontColor: "#333333",
  secondaryColor: "#19394D",
  bgColor: "#111111",
  successColor: "#22C55E",
  warningColor: "#F59E0B",
  errorColor: "#EF4444",
  inputBg: "#1D1F23",
  inputPlaceholder: "Type a message…",
  inputRadius: 8,
  showMic: true,
  showChat: true,
  showClose: true,
  poweredBy: true,
}

/** The `<script>` embed snippet for an agent + config. ONE source: the studio's
 *  copy actions and the visible code block must always copy the same bytes. */
export function widgetSnippet(agentId: string, cfg: WidgetConfig): string {
  return `<script
  src="https://cdn.agora.io/agent-widget.js"
  data-agent-id="${agentId}"
  data-mode="${cfg.interactionMode}"
  data-theme="${cfg.theme}"
  data-blob="${cfg.blobStyle}"
  data-label="${cfg.buttonLabel}"
  data-brand-color="${cfg.brandColor}"
  async
></script>`
}

/** Snapshot for embed-state truth — what the last-copied snippet contained. */
export function widgetSnapshot(agentId: string, cfg: WidgetConfig): string {
  return JSON.stringify({ agentId, cfg })
}

export interface WidgetState {
  cfg: WidgetConfig
  /** Snapshot inside the user's last-copied snippet; null = never copied. */
  copiedSnapshot: string | null
}

// Same `sx:` localStorage guard idiom as lib/wizard-draft.ts (wireframe only).

const KEY = "sx:widget_cfg"
const keyFor = (agentId: string) => `${KEY}:${agentId || "new"}`

export function loadWidgetState(agentId: string): WidgetState {
  const fallback: WidgetState = { cfg: WIDGET_DEFAULTS, copiedSnapshot: null }
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(keyFor(agentId))
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<WidgetState>
    // Merge over defaults so older stores gain any new fields.
    return {
      cfg: { ...WIDGET_DEFAULTS, ...(parsed.cfg ?? {}) },
      copiedSnapshot: parsed.copiedSnapshot ?? null,
    }
  } catch {
    return fallback
  }
}

export function saveWidgetState(agentId: string, state: WidgetState) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(keyFor(agentId), JSON.stringify(state))
  } catch {
    /* ignore quota / serialization errors — wireframe only */
  }
}

export function clearWidgetState(agentId: string) {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(keyFor(agentId))
}
