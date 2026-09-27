# P0.11 Connect the team's software to the agent · Learnings

Research order (owner rule, 26 Sep): existing shots reused first, Refero MCP for the gaps, vendor docs by fetch, the built-in browser only for our own before shots. All 13 shots are in `shots/`; sources per shot in `02-research.md`.

| Vendor | Status | Reused | New this run |
|---|---|---|---|
| Vapi | Partial | vapi-01, vapi-02 (docs) | docs confirmed by fetch |
| Retell | Partial | retell-01, retell-02 (docs) | web-call docs confirmed by fetch |
| ElevenLabs | Partial | elevenlabs-01 (product), elevenlabs-02 (docs) | none |
| LiveKit (indirect) | Partial | livekit-01 (product) | livekit-02 (docs) |
| Stripe (indirect, added) | Done | none | docs text only, no shot |
| Refero | Done | none | refero-resend-01, refero-resend-03, refero-cohere-02 |

Partial means the snippet shape is confirmed and no vendor shows a first-session state or a dev-versus-production mark, which is what the row's brief expected.

## 1. Nobody in the product says "it worked", so the first-session line is new ground

- Retell shows a session only as a row in its history after it happened (`shots/retell-02-call-detail-panel.png`); ElevenLabs puts "first message" awareness in a WebSocket client event the SDK swallows (`shots/elevenlabs-02-conversation-events-docs.png`); Vapi and LiveKit show nothing at all. **Our tab confirms the first session in the row Sam copied from**, with one line and a gray tick, and a toast because Sam is usually looking at a terminal when it lands.
- Resend's webhook page names the trigger in one sentence instead of "no data yet" (`shots/refero-resend-01-webhook-no-events-yet.png`). **Every waiting line names the trigger:** "Waiting for the first session from your software."

## 2. Keys first, code second, and the code box carries its own language switch

- Resend's "Send your first email" is two steps, Add an API key then Send an email, with language tabs inside the code box header and cURL among them (`shots/refero-resend-03-first-email-quickstart.png`). **The App ID, the RESTful API key link and the RTC token note sit above the snippet as three facts; the language toggle lives in the code box header**, so the transport tabs stay the row's only tab bar.
- Vapi offers four paths to one action, Dashboard, TypeScript, Python, cURL (`shots/vapi-02-dashboard-quickstart-tabs.png`). **Two is enough here: curl and one language**, and the v3 snapshot has no SDK, so the second is a plain Node.js `fetch` until one ships.

## 3. Code sits beside the live thing, never on its own page

- LiveKit puts **Code** as an unopened tab beside **Live preview**, one click from the test (`shots/livekit-01-agent-builder-code-tab-closed.png`). Concept A already has the test panel docked beside the Deployment tab (P0.7, P0.8). **The Code row stays on the Deployment tab under Readiness and Retention;** no sheet, no separate page, and the snippet is the code Go live (P0.8).
- Vapi's quickstart sends the developer to a CLI install before any code (`shots/vapi-01-quickstart-docs.png`). **Sam never leaves Studio to get the first snippet.**

## 4. A key should say where it may live

- Cohere separates Production keys from Trial keys as two tables, each with its rule sentence (`shots/refero-cohere-02-api-keys-prod-trial.png`); Stripe puts it in the string (`sk_live_`, `pk_test_`); Retell's public key is domain-restricted but still meant for the browser. The v3 API has one key kind, the RESTful API key, and it must never reach a client. **The snippet marks the auth line `# server side only`, the key line above repeats it, and the RTC token note is the client path** (.g).

## 5. Dev versus production is invisible everywhere, so Studio does not pretend

- LiveKit's `console`, `dev` and `start` modes live in how the agent process is started, never in the session call (`shots/livekit-02-starter-apps-docs.png`). The v3 API has no purpose field and never returns `client_reference`. **Studio writes no tag into the customer's snippet; the first-session line says every session counts as production until a purpose field ships** (.e).

## 6. What today's row lacks, against the JTBD

- The before shots (`shots/before-01-deploy-code-tab.png`, `shots/before-02-deploy-telephony-tab.png`): placeholders instead of the App ID, an "API keys" link floating top right, one language, no server-side mark, toy values (`"agent": "agent_tutor"` where the spec says `agent_id`, fixed by P0.3 and P0.8), and nothing after the copy: no waiting, no first session, no error, no channel check, no ephemeral snippet. **Six states are missing and one fact strip;** the design adds them inside the same row.

## 7. Learnings that change the design

1. The facts strip (App ID with copy, RESTful API key link, RTC token note) goes above the snippet, not beside the tabs.
2. The language toggle (curl, Node.js) sits in the code box header; the transport tabs stay the row's tabs; the ephemeral snippet is a third tab, not a language.
3. The line under the snippet becomes a state line with six states and one disclosure (**Nothing arrived?**), which is where .b, .c, .d and .h live.
4. The RTC channel check is a field inside the idle state, never a standing control.
5. The App ID is filled into the URL; the Customer ID and secret never appear, only their environment names.
