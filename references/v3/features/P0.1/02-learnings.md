# P0.1 Choose how people reach it · Learnings

Research order (owner rule, 26 Sep): Refero MCP first, then earlier research on disk, then the browser only where context was missing or docs had changed. All shots are in `shots/`, each tagged with its source in the run log.

| Vendor | Status | Refero | Earlier research reused | Browser |
|---|---|---|---|---|
| Vapi | Done | no Vapi screens indexed | vapi-01 to 04 | vapi-05 to 08 (public docs, rainy states) |
| Retell | Done | no Retell coverage | retell-01 (copied from public-docs, unchanged) | retell-02 to 09; the concurrency page moved, so the 17 Sep shot was stale |
| ElevenLabs | Done | not needed | elevenlabs-* (14 shots, docs and product) | none |
| LiveKit | Done | no LiveKit screens | livekit-01 to 07 | none, shots 2 to 9 days old |
| Synthflow | Done (desk only) | no hits | builder-models-secrets.md §B | synthflowdeskonly-02 to 07, public docs, no sign-in |

Not done tonight, and why: the Retell Create an Agent menu and a logged-in Vapi create both need a signed-in profile; research never signs in. Rainy shots of a vendor create error and of a type change after a number is attached do not exist in any public doc (see 4).

## 1. The three-way split is real, and only one vendor asks it at create

- Vapi organises its docs as Phone calls, Web calls and Outbound Campaigns (vapi-01, 02, 03). LiveKit splits telephony into Accepting calls, Making calls and Agent dispatch (livekit-01 to 04). Both match inbound, batch and code one to one. **Keep three cards, not a matrix.**
- Synthflow is the only vendor that asks at create: a modal of three radio cards with one line each ("For incoming calls", "For outgoing calls", "Embeddable widget"), committed only on Next (synthflowdeskonly-03). That validates one line per card and "nothing saved until Create" (.g, .h).
- Synthflow gets there through two gates (agent kind, then sub-type, synthflowdeskonly-02). **One gate only.**
- Retell asks for the prompt engine at create (single prompt or conversational flow, retell-02, 03), and ElevenLabs offers use-case templates (elevenlabs-templates). Reach is decided later and scattered across Settings, numbers, widgets and APIs. Today's Console copies this template model; it is what P0.1 replaces.

## 2. Keep the type visible after create

- Synthflow's editor shows the type as a badge next to the agent name (synthflowdeskonly-06). Concept A already has `TypeBadge` in the agent header. **Reuse it; it is also the one door for changing the type (.b).**
- Synthflow keeps deployment (numbers, channels) out of create and in a separate settings screen (synthflowdeskonly-07). Matches the v3 API: deployment lives on Number, Campaign and Session, not on the agent.

## 3. Bindings imply the agent, so they can suggest the type (.c)

- Retell's batch form infers the agent from the From number bound to it (retell-06). The same logic, reversed, gives P0.1.c its suggestion: a number pointing at an untyped agent suggests inbound, a run suggests batch, neither suggests code.
- Synthflow's FAQ confirms agents can be created through the API with no limit (synthflowdeskonly-05). API-made, untyped agents are normal, not an edge case.

## 4. Rainy states: every vendor leaves them to us

- No vendor documents changing the type after a number is attached, a create error (400, 429) or a dropped save. P0.1.b, .d and .f copy is original work.
- Good wording models: LiveKit field errors name the field in plain words (livekit-06); Vapi pairs what happened with what to do (vapi-08); Retell anchors a limit to one concrete example (retell-07); Vapi's free-number gate states a plan limit without blame (vapi-07). **Error copy: what happened, the code, what to do, one sentence each.**
- LiveKit's phone numbers empty state is one icon, one sentence, one button (livekit-05). **The empty Agents list does the same, nothing seeded.**
- ElevenLabs' empty batch list names no agent and has no way back (elevenlabs-18m-batch-list-empty). **Every empty or blocking state names the object and links to it**, which is exactly the .b dialog.

## 5. What we do not copy

- A broad channel menu (ElevenLabs lists WhatsApp, widget, Zendesk, Slack, Telegram, elevenlabs-18-agent-channels). WhatsApp is reserved; web and app go through code over rtc (.e). No disabled "coming soon" card either: quiet chrome.
- Vendor jargon: trunks, dispatch rules, SIP participants, assistants, campaigns as a type, widget, SDK. Locked words only: inbound, batch, code, deployment type, number, run, session.
- LiveKit's beta banner, breadcrumb density and "Upgrade plan" on every row; Vapi's three-level nested sidebar; dark-only theming read as evidence.
- A BYO Twilio account or region gate on any path (Synthflow chat agents).

## 6. Learnings that change the design

1. Card order follows the PRD: inbound, batch, code (Concept A had batch first).
2. Rename in Concept A: "Code / SDK" becomes **Code**, "Batch calls" and any "Outbound batch" become **Batch**, "Inbound calls" becomes **Inbound**. Preset "Fastest" becomes **Lowest latency**.
3. The type can change before the first deployment, so the sheet helper must not say "You pick it once" (today's Concept A copy is wrong against .b).
4. The name field starts empty and never falls back to "My Agent" (today's Console does).
5. The code card carries the rtc line, so no one looks for a web card.
