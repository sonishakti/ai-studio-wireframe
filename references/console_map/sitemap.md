# Agora Console — Site Map
**Base URL**: https://console.agora.io  
**Mapped**: 2026-05-21  
**Account tier**: Free (RTC Free Package active)

---

## Global Navigation

```
console.agora.io/
├── Overview                          /
├── Projects                          /project-management
├── Usage                             /usage
├── Billing                           /billing
├── Extension Marketplace             /extensions-marketplace
├── Subscriptions                     (dropdown)
│   ├── All Subscriptions             /subscriptions
│   ├── RTC Plans                     /subscriptions/rtc-plans
│   ├── Chat Plans                    /subscriptions/chat-plans
│   └── Signaling Plans               /subscriptions/signaling-plans
├── Analytics (external)              https://analytics-lab.agora.io/
├── Developer Toolkit                 (dropdown)
│   ├── Credentials                   /credentials
│   └── RESTful API                   /restful-api
├── Build Agents (Studio)             /studio  →  /studio/agents
└── Notifications                     /notifications
```

---

## Overview

```
/                                     Dashboard
```

---

## Projects

```
/project-management                   Project list

/project-management/H8WeBsJsU/        Default Project configure root
├── Chat
│   └── Basic Info                    /project-management/H8WeBsJsU/chat/basic-info
├── Conversational AI Engine          /project-management/H8WeBsJsU/conv-ai
├── Signaling
│   ├── Basic Information             /project-management/H8WeBsJsU/signaling/basic
│   ├── Presence Configuration        /project-management/H8WeBsJsU/signaling/presence-configuration
│   ├── Storage Configuration         /project-management/H8WeBsJsU/signaling/storage-configuration
│   └── Stream Channel Configuration  /project-management/H8WeBsJsU/signaling/stream-channel-configuration
├── Whiteboard                        /project-management/H8WeBsJsU/whiteboard-basic
├── Interactive Whiteboard Services   /project-management/H8WeBsJsU/whiteboard-services
├── Cloud Recording                   /project-management/H8WeBsJsU/cloud-recording
├── Media Push                        /project-management/H8WeBsJsU/media-push
├── Notifications                     /project-management/H8WeBsJsU/notifications
├── Media Pull                        /project-management/H8WeBsJsU/media-pull
├── Media Gateway                     /project-management/H8WeBsJsU/media-gateway
├── Flexible Classroom                /project-management/H8WeBsJsU/flexible-classroom
├── Cloud Proxy                       /project-management/H8WeBsJsU/cloud-proxy
├── Co-Host Authentication            /project-management/H8WeBsJsU/cohost-authentication
├── Real-Time Speech-to-Text          /project-management/H8WeBsJsU/real-time-stt
└── Video Screenshot Upload           /project-management/H8WeBsJsU/video-screenshot-upload
```

---

## Usage

```
/usage                                Usage Analytics (product usage charts)
```

---

## Billing

```
/billing                              Main billing page (balance, cards, invoices, transactions)
├── /billing/invoices                 Invoice history
├── /billing/transactions             Transaction history
├── /billing/manage-cards             Add / manage payment cards
├── /billing/withdraw-transactions    Withdrawal / refund transaction history
└── /billing/all-designs              ⚠ Internal UI design preview (not in navigation)
```

---

## Extension Marketplace

```
/extensions-marketplace               Marketplace listing
├── /extensions-marketplace/agora-noise-suppression
├── /extensions-marketplace/agora-spatial-audio
├── /extensions-marketplace/byteplus-effects
├── /extensions-marketplace/conversation-intelligence
├── /extensions-marketplace/activefence-video-moderation
├── /extensions-marketplace/synervoz-voice-fx
├── /extensions-marketplace/deepar
├── /extensions-marketplace/faceunity-ar-filter
├── /extensions-marketplace/banuba-face-ar
└── /extensions-marketplace/my-submissions
```

---

## Subscriptions

```
/subscriptions                        All active subscriptions overview
├── /subscriptions/rtc-plans          RTC (Voice/Video) plan tiers + top-ups
├── /subscriptions/chat-plans         Chat plan tiers
└── /subscriptions/signaling-plans    Signaling plan tiers
```

---

## Developer Toolkit

```
/credentials                          Agora Analytics Embedded credentials
/restful-api                          RESTful API key management
```

---

## Settings

```
/settings/profile                     Profile (name, phone, email, password, login methods)
/settings/teams-members               Teams & Members (team roles, member invites)
/settings/notification-preferences   Notification channel preferences
/settings/sso-management             SSO / SAML setup  ⚠ requires Premium/Enterprise support plan
```

---

## Notifications

```
/notifications                        Notification center (→ /notifications/:id)
```

---

## Studio (Build Agents)

```
/studio                               → /studio/agents
/studio/agents                        Agent list
/studio/integration/credentials       Integration: Credentials tab
/studio/integration/knowledge-bases   Integration: Knowledge Bases tab  (public alpha)
/studio/integration/mcps              Integration: MCPs tab  → redirects to /studio/agents
/studio/campaign                      Campaign management
/studio/analytics                     Agent analytics

Not yet accessible (all redirect to /studio/agents):
  /studio/mobile-numbers
  /studio/call-history
  /studio/session-history
```

---

## Finance

```
/finance/packages                     Analytics package subscriptions
```

---

## License Management

```
/license-management                   ✗ Plan-gated — redirects to / for this account
  /license-management/pre-authorization
  /license-management/purchase-history
  /license-management/quota-management
  /license-management/usages-query
```

---

## Other Routes

```
/play                                 Stub route — no content (Next.js static export)
```

---

## Key Modals & Dialogs

| Trigger | Location | Type | Fields |
|---------|----------|------|--------|
| Add Card / Add Billing Information / Add New Card | `/billing`, `/billing/manage-cards` | Modal | Card Number, Name on Card, Expiration Date, CVC, Set as default checkbox |
| Add Credential | `/credentials` | Confirmation dialog | No fields — "Create & Download" button auto-downloads secret |
| Add a Secret | `/restful-api` | ⚠ No dialog — immediate | Generates Customer ID + Secret immediately on click |
| Add a Certificate | Project configure sidebar | ⚠ No dialog — immediate | Generates Primary + Secondary certificates immediately on click |
| Update Phone Number | `/settings/profile` | Modal | Country code selector, phone number input |
| Change Password | `/settings/profile` | Modal | Old Password, New Password, Confirm New Password |
| Update Email ID | `/settings/profile` | No dialog | Likely sends verification email — no visible UI change |
| Add New Member | `/settings/teams-members` | Inline form | Email input, Team combobox |

---

## Buttons Not Tested (state-changing, no modal)

| Button | Location | Reason not tested |
|--------|----------|-------------------|
| Generate Temp Token | Project configure sidebar | Generates immediately |
| Enable [feature] toggles | All configure pages | State-changing |
| Buy and Activate | `/extensions-marketplace/synervoz-voice-fx` | Purchase |
| Select Plan | Subscription plan pages | Purchase |
| Disconnect (Google) | `/settings/profile` | Removes login method |
| Connect (Github / WeChat) | `/settings/profile` | Initiates OAuth |
| Create Agent / Create Campaign | Studio pages | Creates objects |
| Create Knowledge Base | `/studio/integration/knowledge-bases` | Creates objects |
