# P0.7 Check the agent answers as intended · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.7], `02-research.md` rule 0 (11 shots), the v3 API snapshot `references/api/v3/openapi-3.0.0-2026-09-24.json` (paths `/sessions`, `/sessions/{agent_session_id}`, `/sessions/{agent_session_id}/stop`; schemas `SessionCreate`, `SessionStartResponse`, `SessionErrorResponse`, `Problem`, `RtcTransportInput`, `Lifecycle`, `AgentInput`). ClickUp task 868m9wg4c has no comments, so there are no change notes. Depends on P0.3 (Save and test in the Advanced footer, the labels Start test and End test, `agent_audio_heard`), P0.4 (Save and test in the prompt row and the greeting sheet, the values-first body, the header Test that saves a dirty draft), P0.5 (transcript tool lines, `lastTest` on an integration) and P0.6 (the key line, Replace key, `agent_test_started`). Requirement 40: the builder order is model, prompt, test, then deploy and go live. Requirement 52: the test and simulations section stays. Funnel stages 4 `agent_tested_baseline` and 8 `agent_tested_configured`.

## What the flow shows

| Screen | Data it needs |
|---|---|
| A row with edits and Save and test on (.a step 1) | A saved agent (Order status, `agent_orders`) whose prompt row holds one new sentence in its draft, so the footer Cancel, Save, Save and test is on |
| The panel opening on Talk while the session starts (.a step 2) | The save landing (toast), a `POST /sessions` in flight with `agent: agent_orders`, an rtc transport and `client_reference: studio_test:agent_orders:<builderSessionId>`, then a `201 { agent_session_id, status: starting }` stored by Studio |
| The first answer with the transcript (.a step 3) | The greeting line, one person turn, one tool line with its code and time (P0.5), the answer line; the status line Listening; the timer |
| The test ended, the row editable, Simulations as it is (.a step 4) | The transcript kept, the status line Ended with the length, Start test back; the Simulations tab with its empty state (no scenarios on any seed) |
| The untouched preset answers (Aha 1, inside .a) | A saved agent with no prompt on Lowest latency (`agent_draft`, P0.4); `AgentInput` requires only `agent_name`, so `POST /sessions` accepts it |
| .b unsaved edits | A dirty prompt draft when Save and test or the header Test is pressed; the save lands first, then the session starts from `agent_id` |
| .c mic denied | `getUserMedia` rejected with `NotAllowedError` before any `POST /sessions`; the Simulations tab as the text fallback |
| .d suspended, free minutes used up | `POST /sessions` refused: `SessionErrorResponse.reason: AccountSuspended` (403) or `Problem.code: quota_exceeded` (429) with `quota` naming free minutes |
| .e too many sessions | `POST /sessions` refused: `SessionErrorResponse.reason: ConcurrencyLimitExceeded` (429), with `Problem.limit` and `Problem.current` when the server sends them |
| .f start failure | `Problem.code: validation_failed` (400) with `errors[].field`; `provider_error` (502) with `provider`, `provider_code`, `pipeline_type`; `capacity_unavailable` (503); a dropped connection |
| .g tool or MCP failure mid-test | P0.5's transcript error line on `agent_orders` (`it=tool-error`, `it=mcp-401`); the test keeps running after it |
| .h nothing heard | A session whose `GET /sessions/{id}` reads `running` while the agent's remote audio track has produced no frames for 10 s; a tone Studio can play; a retry that keeps the transcript and starts a second session |

## What a new account lacks

An agent, and that is all. After P0.1's create the account holds one agent with no prompt on Lowest latency, and the API accepts a session on it, so the untouched preset can answer (Aha 1) with nothing else set. No test session exists until Sam starts one; the id Studio stores is the only record that a session was a test, because `client_reference` is writable but never returned. Everything else this row shows is a state the fixtures fake by URL: a suspended account, exhausted free minutes, a concurrency limit hit, a 400, 502 or 503 on start, a tool failure mid-test, a session that runs in silence.

API truth per field (checked against the snapshot):

| Field | In spec | Default | Notes |
|---|---|---|---|
| `POST /sessions` body | yes, `SessionCreate` | | `agent` (an `agent_` id), `transport` (exactly one), `client_reference` (string, at most 256), `overrides` (`AgentPatch`), `lifecycle`, `data_policy`. Studio sends `agent: <agent_id>` and never an inline agent, so a test is always the saved version (.b) |
| `transport.rtc` | yes, `RtcTransportInput` | `audio_scenario: aiserver` | `channel`, `uid` (the agent's), `subscribe_uids` (exactly one: the browser's uid), `token` (write-only). Studio makes the channel `studio-test-<agent_id>-<ts>`, mints the token the way the current Console's live preview does, and joins with the browser uid |
| `client_reference` | yes | | Written as `studio_test:<agent_id>:<builderSessionId>`; **never returned by any GET**, so Studio keeps `agent_session_id` in sessionStorage under `ng.v3-concepts.test-session:<agent_id>` and the port keeps it in the builder's state. A purpose field is missing; until it ships every other session on the agent counts as production |
| `201 SessionStartResponse` | yes | | `agent_session_id` (`^[a-z0-9]{32}$`), `status: starting \| running`, `created_at`. Transport details are never returned |
| Errors on start | yes | | 400, 401, 403, 404, 409, 422, 429, 500, 502, 503, 504. Two shapes: `Problem` (`code`, `detail`, `errors[] { field, message }`, `provider`, `provider_code`, `pipeline_type`, `quota`, `limit`, `current`, `request_id`) and `SessionErrorResponse` (`detail`, `reason` enum: `ServiceNotEnabled`, `AccountSuspended`, `InvalidRequestBody`, `MissingRequiredField`, `InvalidFieldValue`, `InvalidModuleParameter`, `ResourceQuotaLimitExceeded`, `ConcurrencyLimitExceeded`, `ServiceUnavailable`, `ResourceAllocationFailed`, `TaskConflict`, `TaskOperationTimeout`, `NotImplemented`, `InternalError`). Studio reads both: `reason` first, then `code` |
| `POST /sessions/{id}/stop` | yes | | 201, 400, 404, 409 (`session_not_active`), 429. Called on End test, on Close, and on leaving the builder |
| `GET /sessions/{id}` | yes | | `status: idle \| starting \| running \| stopping \| stopped \| failed`, `message` (status detail). Polled once at 5 s after start and once more at 10 s for .h; `failed` with `message` feeds the .f copy when the start answered 201 and the session died |
| `lifecycle.idle_timeout_ms` | yes | 30000 | A test that hears nothing ends itself after 30 s of idle; Studio stops it earlier on Try again |
| `AgentInput.instructions` | yes, optional | | Only `agent_name` is required, so an untouched preset agent starts a session (Aha 1). The agent answers from the model with no instructions |
| transcript, turns, events (SSE) | no, deferred past launch | | The panel builds its lines from the RTC data stream messages the agent publishes while the session runs, as the current Console's live preview does; nothing is fetched after the test. The lines are Studio state, never re-readable from the API |
| tool call marks | no | | P0.5's gap: no tool execution event in the spec. Design-mode lines only until the stream carries a tool event (open question 3) |
| audio level, silence | no | | Client-side: the browser watches the agent's remote audio track; no frames for 10 s after `running` is .h |
| free minutes | no field on the Problem | | `AccountSuspended` and `quota_exceeded` say sessions are refused, not why. Studio reads the billing state P1.7 keeps (minutes left, suspended, reason) for the wording; until P1.7 ships, both read Add card (PRD) |
| concurrency | partly | | `ConcurrencyLimitExceeded`; `limit` and `current` are optional on `Problem`, so the copy has a version without numbers |
| server anchor for Aha 1 and 2 (notif 112) | no, unbuilt (G3) | | `agent_tested_baseline` and `agent_tested_configured` are client-only, derived once per agent from the first `agent_audio_heard` and a sessionStorage flag |

## Where it exists outside our accounts

- The always-reachable Talk door beside Publish: Vapi's header, `shots/vapi-07-talk-button-header.png`. Our header Test button (`shots/before-01-test-panel-closed-state.png`) is the same door.
- One line that says why, then one button: LiveKit's Live preview empty state, `shots/livekit-12-start-call-live-preview.png`; our idle line is one sentence and Start test.
- Connection state as a persistent label: LiveKit Console's status chip, `shots/livekit-13-console-idle-no-agent.png`.
- Failures inside the transcript column: Vapi's stacked toasts with no retry, `shots/vapi-08-web-call-room-deleted-error.png`; ElevenLabs' bare red "Permission denied", `shots/elevenlabs-11-mic-permission-denied.png`. Both are what not to copy.
- A limit stated before it bites: Retell's "call transfer is not supported in Webcall", `shots/retell-09-test-audio-test-llm-run-test.png`.
- Voice and text on one pane: ElevenLabs' preview, `shots/elevenlabs-10-preview-pane-call-chat-door.png`.
- A refusal that names the blocker and gives one action: Rox, `shots/refero-rox-06-no-payment-method-modal.png`. A confirm dialog for unsaved edits we refuse: Acctual, `shots/refero-acctual-05-unsaved-changes-modal.png`.
- Not captured anywhere (research gaps): a concurrency refusal in a voice product, a test on unsaved edits, a tool failing mid-test, a session running in silence. The prototype fakes these by URL; no capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Names below are the contract for the build; the build may place them where the file's order wants. Every change is additive: no seed loses a field.

1. Types:

   ```ts
   type TestPhase =
     | "idle" | "values" | "saving" | "starting" | "live" | "ended"
     | "mic" | "refused" | "failed" | "silent"
   type TestRefusal =
     | { reason: "suspended" }
     | { reason: "resource_limit"; quota: "free_minutes" }
     | { reason: "concurrency_limit"; limit?: number; current?: number }
   type TestFailure =
     | { code: 400; field: string; message: string }
     | { code: 502; provider: string; providerCode: string; slot: KeySlot; byok: boolean }
     | { code: 500 | 503 | 504 }
     | { code: "network" }
   type TranscriptLine =
     | { kind: "agent"; text: string; at: number }          // quotes and italics
     | { kind: "person"; text: string; at: number }
     | { kind: "tool"; name: string; icon: "mcp" | "tool"; code: number | "timeout"; seconds?: number; ok: boolean; at: number } // P0.5
     | { kind: "key"; slot: KeySlot; code: number; at: number }  // P0.6
     | { kind: "divider"; label: string; at: number }       // "Test 2 · 14:07"
   type TestSession = {
     sessionId: string          // agent_session_id
     clientReference: string    // studio_test:<agent_id>:<builderSessionId>
     startedAt: number
     status: "starting" | "running" | "stopped" | "failed"
   }
   ```

2. `TEST_SESSION_KEY(agentId)` returns `ng.v3-concepts.test-session:<agentId>`; the stored value is `TestSession`. `builderSessionId` is one id per builder mount kept in component state (the port's `builderSessionId` from `builder_opened`).
3. `clientReferenceFor(agentId, builderSessionId)` returns `studio_test:<agentId>:<builderSessionId>` and never exceeds 256 characters (ids are trimmed to fit).
4. `configuredByUser(agent)` is true when the agent differs from its preset in instructions, greeting or a model: `agent.prompt.trim() !== ""`, or `agent.greeting.text.trim() !== ""`, or `matchPreset(agent.pipeline) !== agent.labels.studio_preset`. False on `agent_draft`, true on `agent_orders`.
5. `startTestSession(agent, outcome?)` in design mode answers after 800 ms: `outcome` undefined gives `201 { agent_session_id, status: "starting" }` with a random 32-character id; `"mic"` rejects before any request; `"minutes"`, `"suspended"`, `"busy"` return the matching `TestRefusal`; `"failed-400"`, `"failed-key"`, `"failed-503"` return the matching `TestFailure`; `"silent"` returns 201 and never plays audio. `stopTestSession(sessionId)` answers 201 after 200 ms. `lastSave` on the agent (P0.3's View last save) records `POST /sessions · 201` with the body Studio sent (token printed as `"token": "••••"`) and the `agent_session_id`, then `POST /sessions/{id}/stop · 201`.
6. `TEST_PROBLEMS`: the bodies behind each outcome, kept true to the spec: 400 `validation_failed` with `errors: [{ field: "pipeline.llm.model", message: "is not a known model" }]`; 403 `{ reason: "AccountSuspended" }`; 429 `quota_exceeded` with `quota: "free_minutes"`; 429 `{ reason: "ConcurrencyLimitExceeded" }` with `limit: 10, current: 10`; 502 `provider_error` with `provider: "openai"`, `provider_code: "401"`, `pipeline_type: "cascaded"`; 503 `capacity_unavailable`.
7. `testCopyFor(problem, agent)` maps a `Problem` or `SessionErrorResponse` to `{ line, action }` per the copy table in `05-build-spec.md`; the 502 branch uses P0.6's `moduleForProvider(agent, provider)` and the module's `keys[slot]` to choose the key wording and the Replace key action; a concurrency refusal without `limit` uses the version without numbers.
8. `transcriptFixture(agent, key)` returns the lines for `live` (greeting at 2 s, person turn "Where is order 4471?" at 3.5 s, tool line `search_orders · 200 · 0.4 s` at 4 s, answer at 5 s), `ended` (the same, then nothing), `silent-retry` (the greeting from test 1, the divider `Test 2 · 14:07`, then the greeting again), and reuses P0.5's `ORDERS_INTEGRATIONS` lines for `it=tool-error` and `it=mcp-401`. `turnCount(lines)` counts agent lines only; dividers, tool and key lines never count.
9. `SIMULATIONS`: empty for every seed (empty first). In design mode **Generate scenarios** writes three scenarios from the prompt after 900 ms, the Studio X 2 behaviour ported as it is (`studio_x_2/components/wizard/test-panel.tsx`, the `simulations` tab), into sessionStorage `ng.v3-concepts.simulations:<agentId>`. Their results never fire `agent_audio_heard`.
10. Seeds: none change. `agent_orders` (P0.5, Order status, code, Custom pipeline, Orders MCP server and sendTrackingLink) is the journey start; `TEST_EDIT = "Offer to text the tracking link once the order has left the warehouse."` is the sentence `test=edit` appends to its prompt draft. `agent_draft` (P0.4, empty prompt, Lowest latency untouched) is the Aha 1 agent. `agent_frontdesk` (P0.6, `keys.llm` set) is the failed-key agent. `agent_payments` (batch, `callback_number` with a default) is the silent agent. `newAgent` gains nothing.
11. Review states by URL, none writes the store: `test=edit` (the prompt row on `agent_orders` with `TEST_EDIT` in the draft, footer on, panel closed), `test=starting` (toast "Prompt saved.", the panel open on Talk, status Starting, footer button inert with a spinner), `test=live` (the transcript from `transcriptFixture(live)`, Listening, End test), `test=ended` (the transcript kept, status "Ended · 0:42", Start test), `test=sims` (the Simulations tab with its empty state), `test=baseline` (on `agent_draft`: the untouched preset line, Start test on; with `&heard` the fallback greeting bubble and Listening), `test=unsaved` (the header Test pressed on a dirty draft: toast, footer gone, the panel on Start test; P0.4 .f), `test=mic`, `test=minutes`, `test=suspended`, `test=busy`, `test=failed-400`, `test=failed-key` (on `agent_frontdesk`), `test=failed-503`, `test=silent` (on `agent_payments`), `test=silent-retry`. P0.5's `it=tool-error` and `it=mcp-401` stay the .g states.
12. `parts/events.ts` gains `test_panel_opened`, `agent_test_started` (if P0.6 has not), `agent_test_ended`, `test_refused`, `agent_tested_baseline`, `agent_tested_configured`, `cta_viewed`, `integration_error_seen` (if P0.5 has not), `byok_key_failed` (if P0.6 has not). `builder_resumed` is listed and never fired by the prototype: the port fires it when the builder restores a stored draft on mount, and the prototype has no stored drafts.
13. Tests: `clientReferenceFor` starts with `studio_test:` and is at most 256 characters for a 64-character builder id; `startTestSession` without an outcome answers an id matching `^[a-z0-9]{32}$` and `status: starting`; each outcome maps through `testCopyFor` to the expected line and action, and a `ConcurrencyLimitExceeded` body without `limit` falls back to the version without numbers; `configuredByUser` is false on `agent_draft` and true on `agent_orders`; `turnCount(transcriptFixture(agent_orders, "silent-retry"))` is 2 and ignores the divider; `lastSave` after a start and a stop lists both calls and never the token; `SIMULATIONS` is empty for every seed.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run): one console-made agent tested once by the owner (the heard answer, the transcript); the same agent with a wrong OpenAI key pasted by the owner for the failed-key capture. A suspended account, exhausted free minutes and a concurrency refusal cannot be produced on purpose in staging; they stay design-mode captures. Never sign in or enter credentials for this: the owner creates these in the staging account.
