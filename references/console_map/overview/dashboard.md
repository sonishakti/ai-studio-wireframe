# Overview — Dashboard
**URL**: https://console.agora.io/
**Section**: Overview
**Accessed**: 2026-05-21T00:00:00Z
**Access Restricted**: false

## Purpose
The main landing page after login. Provides a summary dashboard showing the user's projects, billing status, current subscription, quick-start SDK guides, recent notifications, featured extensions, and a usage chart for the current billing cycle.

## Content Hierarchy

- **Welcome heading**: "Welcome Hermes 🎉"
- **Projects widget** (1 project)
  - "View All" link → /project-management
  - "New Project" button ⚠️
  - Project table row:
    - Project name: "Default Project" (updated about 1 hour ago)
    - Security mode badge: "Secure"
    - App ID field (value present but not fully visible)
    - "Configure" button → navigates into project configuration
- **Billing widget**
  - "View Details" link → /billing
  - Alert text: "Add a card to ensure zero downtime once your free minutes are up."
  - Sub-text: "You will only be charged for usage beyond the free limit"
  - "Add Card" button ⚠️
- **Current Subscription widget**
  - "Top-Up Minutes" button ⚠️
  - "View All Subscriptions" button → /billing (subscriptions tab)
- **Get Started widget**
  - "SDK Guides" tab button
  - "App Builder" tab button
  - Platform selector dropdown (currently: "Web")
  - "Select an Agora product to get started with the SDK quickstart." helper text
  - Product SDK links (external docs):
    - Conversational AI (NEW) → https://docs.agora.io/en/conversational-ai/overview/product-overview?platform=web
    - Voice Calling → https://docs.agora.io/en/voice-calling/get-started/get-started-sdk?platform=web
    - Video Calling → https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web
    - Chat → https://docs.agora.io/en/agora-chat/get-started/get-started-sdk?platform=web
    - Interactive Live Streaming → https://docs.agora.io/en/interactive-live-streaming/get-started/get-started-sdk?platform=web
    - Signaling → https://docs.agora.io/en/signaling/develop/get-started-sdk?platform=web
    - Interactive Whiteboard → https://docs.agora.io/en/interactive-whiteboard/get-started/get-started-sdk?platform=web
- **Notifications widget** (2 unread)
  - "View All" link → /notifications/3003512
  - Notification 1 (about 1 hour ago): "Your RTC Free Package has been activated successfully" → /notifications/3003512
  - Notification 2 (about 1 hour ago): "Welcome!" → /notifications/3003511
- **Extensions Marketplace widget**
  - "View All" link → /extensions-marketplace
  - ActiveFence Video Content Moderation (Beta) → /extensions-marketplace/activefence-video-moderation
  - DeepAR → /extensions-marketplace/deepar
  - Banuba AR Face Filter → /extensions-marketplace/banuba
- **Usage widget** (Current Billing Cycle)
  - "View Details" link → /usage
  - Product selector dropdown (currently: "Interactive Live Streaming")
  - Tabs: All | Host | Audience (currently: All)
  - Metrics shown: Audio (MIN), Video HD (MIN), Video FHD (MIN), Video 2K (MIN), Video 2K+  (MIN)
  - Time-series chart (x-axis: dates 05-01 through 05-21, y-axis: usage minutes)
  - Tooltip showing "30 Apr, 2026"

## Interactive Elements (observed, not activated)

- "New Project" button ⚠️ — creates a new project
- "Configure" button (Default Project) — navigates to project configuration view
- "Add Card" button ⚠️ — opens billing card entry flow
- "Top-Up Minutes" button ⚠️ — initiates minute top-up purchase
- "View All Subscriptions" button — navigates to subscriptions list
- "SDK Guides" / "App Builder" tab buttons — switches Get Started widget content
- Platform selector dropdown (Web) — changes platform for SDK quickstart links
- All product links in Get Started — external docs links (open in new tab)
- "View All" (Notifications) link — navigates to notifications list
- "View All" (Extensions Marketplace) link — navigates to extensions list
- Extension card links — navigate to individual extension detail pages
- "View Details" (Usage) link — navigates to usage analytics
- Product selector dropdown (Usage) — changes product shown in usage chart
- All | Host | Audience tabs — filters usage chart data

## Notes

- App ID value in the Projects table is visible in the UI but was not captured (redacted per spec).
- The "Notifications" badge shows "2" unread items.
- Promo banner in sidebar: "Conversational AI Agents are here!" with "Build Agents" link → /studio.
- "Subscriptions" in the sidebar is a button (not a direct link) — likely a collapsible submenu; to be explored.
- "Developer Toolkit" in the sidebar is also a button — likely a collapsible submenu; to be explored.
- "Analytics" in the sidebar is an external link → https://analytics-lab.agora.io/?locale=en.
