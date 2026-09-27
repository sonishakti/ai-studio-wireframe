# P0.11 Connect the team's software to the agent · Research

## Rule 0, data first

(a) A brand-new logged-in Agora account already has what this flow needs to render: an agent with `type: "code"`
and its `agent_id`, App ID and RESTful API key. Nothing about the snippet itself requires seeded data. What a new
account does *not* have is a first session, so every rainy state that depends on session history (b, c, d, h) is
earned by acting, not by seeding.

(b) Outside our own accounts: vendor public docs (Vapi, Retell, ElevenLabs, LiveKit) show the shape of the
snippet a competitor gives a developer; none of the four show a dashboard-visible "it worked" or "still waiting"
state, so that half of the job step has no vendor precedent and was covered from Refero and adjacent developer
tooling instead (Resend, Cohere, Stripe).

(c) What the prototype's own fixtures still need: `agent_tutor` (type `code`, status `Live`) already renders the
curl snippet for both `rtc` and `telephony` on the Code sub-tabs (confirmed below), but the fixture set has no
"not seen yet" state, no first-session-detected state, no 401/403/422 error state, no RTC-channel-check field,
and no ephemeral/account-level secondary tab — all six are currently absent from the running prototype.

## Vendor status

| Vendor | Status | Sources |
|---|---|---|
| Vapi | Partial | Reused `vapi-01-quickstart-docs.png`, `vapi-02-dashboard-quickstart-tabs.png` (existing research); confirmed current with WebFetch of `docs.vapi.ai/quickstart/web` |
| Retell | Partial | Reused `retell-01-phone-quickstart.png`, `retell-02-call-detail-panel.png` (existing research); confirmed with WebSearch + WebFetch of `docs.retellai.com/deploy/web-call` |
| ElevenLabs | Partial | Reused `elevenlabs-01-widget-embed-code.png`, `elevenlabs-02-conversation-events-docs.png` (existing research) |
| LiveKit (indirect, build/infra) | Partial | Reused `livekit-01-agent-builder-code-tab-closed.png` (existing research); confirmed/extended with WebFetch of `docs.livekit.io/agents/start/voice-ai/` (Voice AI quickstart, captured fresh as `livekit-02-starter-apps-docs.png`) |
| Stripe (indirect, added this run) | Done | WebSearch + WebFetch of `docs.stripe.com/keys` and Stripe test/live mode docs — no product screenshot taken (public docs text only) |

Vapi, Retell and ElevenLabs stay Partial: their docs answer the snippet-shape question but none show first-session
detection or dev/production separation, which is exactly the gap the row's `research_brief` flagged before this run.

## Shots

| # | File | Source | Path | Finding | Region (x,y,w,h) |
|---|---|---|---|---|---|
| 1 | `before-01-deploy-code-tab.png` | browser (our prototype, `agent_tutor`, tab=deploy, "In your app") | happy P0.11.a | Today's Code tab shows only a curl snippet with `agent_id`/`transport`; no SDK tab next to curl, no App ID or token note inline (only a plain "API keys" text link, top right), no first-session or error state anywhere on the tab | 432,472,2048,520 |
| 2 | `before-02-deploy-telephony-tab.png` | browser (our prototype, "One phone call") | happy P0.11.a | Switching sub-tabs only swaps `transport.type` to `telephony` with `from`/`to`; same missing App ID/key/token note, no channel field, no confirmation state | 432,472,2048,520 |
| 3 | `vapi-01-quickstart-docs.png` | existing (public docs) | happy P0.11.a (contrast) | Vapi's own quickstart never shows an in-product session-start snippet — it sends the developer to a CLI (`vapi assistant create`) or the Dashboard UI first; "copy a snippet and run it" is not Vapi's model | 720,1280,1760,690 |
| 4 | `vapi-02-dashboard-quickstart-tabs.png` | existing (marked, public docs) | happy P0.11.a | The one code moment on Vapi's site is tabbed Dashboard / TypeScript (Server SDK) / Python (Server SDK) / cURL — four paths to the same action, not the "curl or one SDK" pairing this row scopes to | 712,1517,1776,180 |
| 5 | `retell-01-phone-quickstart.png` | existing (public docs) | happy P0.11.a (contrast) | Retell's phone quickstart is entirely numbered prose end to end (create account → pick template → deploy → call) with zero code blocks on the page | 792,800,1528,880 |
| 6 | `retell-02-call-detail-panel.png` | existing (public docs) | rainy P0.11.d / h | A session only becomes visible as a row in Call History after it happens; Retell has no dedicated waiting/"no session yet" screen, the row simply doesn't exist until a call completes | 808,624,1504,864 |
| 7 | `elevenlabs-01-widget-embed-code.png` | existing (product) | happy P0.11.a (contrast) | ElevenLabs' one code box is a `<elevenlabs-convai agent-id="...">` embed tag for the chat-widget channel, not a `POST /sessions`-style call — a different shape from a server-side session create | 1016,328,1048,240 |
| 8 | `elevenlabs-02-conversation-events-docs.png` | existing (public docs) | rainy P0.11.d / h | "First message" awareness lives in a `conversation_initiation_metadata` WebSocket client event the SDK handles automatically — never a dashboard-visible state a developer checks | 500,175,1000,150 |
| 9 | `livekit-01-agent-builder-code-tab-closed.png` | existing (product) | happy P0.11.a | LiveKit's Builder puts **Code** as an unopened tab beside **Live preview**; the default landing view is a Start call button, not code — code is one click away, never the first thing shown | 2720,240,210,60 |
| 10 | `livekit-02-starter-apps-docs.png` | browser, fetched fresh this run (`docs.livekit.io/agents/start/voice-ai/`) | rainy P0.11.e (data-first gap) | The quickstart names `console`/`dev`/`start` server run modes for the agent process, but that dev/production distinction lives in how the agent is started, never in anything the client's session-create call marks — matches the row's brief exactly | 2426,632,422,96 |
| 11 | `refero-resend-01-webhook-no-events-yet.png` | Refero (screen) | rainy P0.11.d / h | Resend's empty state names the exact trigger in one sentence — "Once you start sending emails, you'll be able to see all the webhook events" — instead of a generic "no data yet" | 168,220,462,140 |
| 12 | `refero-cohere-02-api-keys-prod-trial.png` | Refero (screen) | rainy P0.11.e | Cohere separates **Production keys** from **Trial keys** as two distinctly labeled tables, each with its own rule sentence ("free of charge, rate-limited, cannot be used for commercial purposes"), rather than one list with a tag | 184,130,586,140 |
| 13 | `refero-resend-03-first-email-quickstart.png` | Refero (screen) | happy P0.11.a | Resend's "Send your first email" numbers exactly two steps — Add an API Key, then Send an email — with a language-tabbed code block (incl. cURL) directly under step 2; the closest vendor pattern to a minimal, in-product "get the code" screen | 184,170,680,200 |

## Per-vendor copy / avoid

**Vapi** — Copy: nothing in the in-product snippet UX itself (there isn't one); the one idea worth carrying is keeping the Dashboard action and its matching code tab in permanent sync so the UI and the code never drift. Avoid: routing the entire "connect your software" job through an external CLI install step — Sam should never have to leave Studio to get the first snippet.

**Retell** — Copy: treating the session as a first-class list row with everything (recording, analysis, transcript) reachable from one detail panel, the same instinct behind Agora's own session view (a P1 concern, not this row's). Avoid: shipping a public key whose only safeguard is domain allow-listing — it is still a key meant to sit in browser code, with no server-side-only mark anywhere near it.

**ElevenLabs** — Copy: the embed snippet names exactly one thing, `agent-id`, and nothing else — the same minimalism this row's snippet should keep. Avoid: making session-start visibility a WebSocket client event buried in SDK internals; a developer who isn't reading source has no dashboard signal a session ever began.

**LiveKit** — Copy: putting **Code** as a real, adjacent tab next to the live/interactive view, so "try it" and "wire it up" sit one click apart, never a separate journey. Avoid: leaving the dev/console/production distinction as a CLI flag with nothing in any UI naming which mode is currently live.

**Stripe (indirect)** — Copy: prefixing the key string itself (`pk_test_`/`sk_test_` vs `pk_live_`/`sk_live_`) so the key is self-describing wherever it gets pasted — the strongest version of "never let dev traffic pass as production" this pass found. Avoid: a single account-wide test/live toggle that silently changes what every other settings page means while it's set to test.

## Gaps

- No vendor (Vapi, Retell, ElevenLabs, LiveKit) shows a dashboard-visible "first session detected" confirmation.
  All four treat "it worked" as something found later in a call log, or leave it invisible entirely (Vapi,
  LiveKit) — P0.11.a's step-4 tick is genuinely new ground, not a porting job.
- None of the four mark a server-side-only key inside the same code sample the way P0.11.g asks for: Retell's
  public key is domain-restricted but still meant for the browser; Stripe solves it at the key-prefix level, not
  inside a snippet. The nearest available pattern (Stripe) is ported in spirit only, not as a direct screen.
- No RTC-channel-check field and no ephemeral/account-level secondary-tab pattern turned up anywhere across the
  four vendors or the Refero searches — this stays fully novel for the design phase.
- Refero returned no strong hit for a voice-AI product's own "waiting for first session" screen; the finding is
  ported from adjacent developer tooling (Resend's webhook empty state), not from a direct competitor.
- No vendor product was signed into this run (per the safety rule); anything gated behind an authenticated
  dashboard session — for example an actual completed "Test web calling" run in Vapi — is undocumented beyond
  what public docs, WebFetch/WebSearch summaries and Refero's already-captured screens show.

## Footnote (agent use only)

Status legend: Done = enough evidence to design from; Partial = docs/product shape confirmed, no
first-session/dev-vs-prod evidence found (expected, per the row's own `research_brief`); Not started = no source
checked yet. Scope: Research phase only for job step P0.11 (this run did not touch Design, Build or Figma).
Rule 0 answer is above. Source order followed: existing research reused first (all `research[].note` paths
verified present), then Refero MCP for the gaps, then vendor public docs via WebFetch/WebSearch, then the
built-in browser only for our own prototype's before-shots. No sign-in, no purchase, no credential entry
anywhere in this run.
