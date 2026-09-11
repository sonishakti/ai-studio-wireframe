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
