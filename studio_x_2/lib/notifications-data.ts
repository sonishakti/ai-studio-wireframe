/** Notification mock shared by the Notifications page and the header bell —
 *  one source, so the badge count and the list never disagree. */
export const NOTIFICATIONS = [
  {
    id: "n_01",
    title: "Campaign Q2 Win-Back reached 50% completion",
    body: "3,421 of 6,842 contacts have been reached. Estimated completion: May 28, 2026.",
    type: "campaign",
    read: false,
    time: "2 min ago",
  },
  {
    id: "n_02",
    title: "Agent 'Support Bot v2' encountered 12 errors",
    body: "Repeated timeouts on OpenAI API. Check your vendor credentials and rate limits.",
    type: "error",
    read: false,
    time: "18 min ago",
  },
  {
    id: "n_03",
    title: "You've used 80% of your free minute allowance",
    body: "You have 40 minutes remaining this month. Upgrade to Pro for unlimited minutes.",
    type: "usage",
    read: false,
    time: "1 hour ago",
  },
  {
    id: "n_04",
    title: "New extension available: Sentiment Analysis",
    body: "DeepAffects Sentiment Analysis is now available in the Extensions Marketplace.",
    type: "product",
    read: true,
    time: "Yesterday",
  },
  {
    id: "n_05",
    title: "Campaign Renewal Reminder completed",
    body: "2,800 contacts reached. Success rate: 31%. View the full report in Monitor.",
    type: "campaign",
    read: true,
    time: "May 22, 2026",
  },
]

export type Notification = (typeof NOTIFICATIONS)[number]

export function unreadCount(items: readonly Notification[] = NOTIFICATIONS) {
  return items.filter((n) => !n.read).length
}

// ─── Delivery preferences — the table on Project › Notifications ─────────────
//
// The defaults live here, not on the page, because two surfaces read them: the
// page, which owns the channels, and the Monitor watch sheet, whose "Sent to"
// line reads back the watches row rather than offering a second set of
// channels beside it. One door per action. (A Next page may only export the
// fields the framework knows, so a shared constant cannot live on one.)

export type NotificationChannel = "email" | "inApp" | "slack" | "webhook"

export interface NotificationCategory {
  id: string
  label: string
  desc: string
  email: boolean
  inApp: boolean
  slack: boolean
  webhook: boolean
}

export const CATEGORIES: NotificationCategory[] = [
  { id: "campaigns", label: "Campaign events",     desc: "Start, complete, paused, failed", email: true,  inApp: true,  slack: false, webhook: false },
  { id: "calls",     label: "Call events",          desc: "Per-call outcomes and transcripts (high-volume)", email: false, inApp: false, slack: false, webhook: true  },
  { id: "agents",    label: "Agent errors",         desc: "Vendor key issues, timeouts, runtime failures",   email: true,  inApp: true,  slack: true,  webhook: true  },
  { id: "watches",   label: "Monitor watches",      desc: "A number you watch crosses the line you set",     email: true,  inApp: true,  slack: false, webhook: false },
  { id: "billing",   label: "Billing & usage",      desc: "Threshold alerts, invoice receipts",              email: true,  inApp: true,  slack: false, webhook: false },
  { id: "security",  label: "Security",             desc: "New API keys, credential rotation, audit events", email: true,  inApp: true,  slack: true,  webhook: false },
  { id: "product",   label: "Product announcements",desc: "Release notes, new features, deprecations",       email: false, inApp: true,  slack: false, webhook: false },
]
