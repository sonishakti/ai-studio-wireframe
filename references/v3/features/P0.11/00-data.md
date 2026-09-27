# P0.11 Connect the team's software to the agent · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.11], `02-research.md` rule 0 (13 shots), the v3 API snapshot `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (schemas `SessionCreate`, `EphemeralSessionCreate`, `AgentInput`, `TransportInput`, `RtcTransportInput`, `TelephonyTransportInput`, `Lifecycle`, `DataPolicy`, `SessionStartResponse`, `SessionListItem`, `SessionListResponse`, `ErrorResponse`; paths `POST /sessions`, `POST /sessions/ephemeral`, `GET /sessions`). ClickUp task 868m9wg61 has no comments, so there are no change notes. Requirements 6 (Deployment and Go live as one area) and 36 (UI and API parity for Start a session). Funnel stages 9 `channel_connected {code}` (needs G1) and 10 `agent_answered_production` (needs G2). Depends on P0.8 (the Deployment tab, the **Code** row, `sessionSnippet`, the `dep=` states, the code line copy), P0.7 (the test panel, `lastTestHeard`), P0.3 (`SESSION_LIFECYCLE_DEFAULTS`, the Advanced session door **Set them in the code snippet**), P0.1 (the code type). P1.8's strip on Overview later reads the first-session fact this row records.

## What the flow shows

| Screen | Data it needs |
|---|---|
| The Code row on a draft code agent (.a step 1) | A code agent with a prompt, tested on its current version, no session yet (`agent_assist`); the project's App ID and auth mode; whether the account holds a RESTful API key; the agent's retention choice (P0.8) |
| The snippet by transport and language (.a step 2) | `agent_id`; rtc: `channel`, `uid`, `subscribe_uids`, `token` in secured mode; telephony: `from` (a project number id), `to`; `variables` when the prompt has any; `lifecycle` (P0.3 defaults); `data_policy` when Zero retention (P0.8) |
| The copy recorded (.a step 3) | When the snippet was copied, which transport and language; Studio-held until a server anchor exists |
| The first session confirmed (.a step 4) | The first row of `GET /sessions` for this agent that Studio did not start, its `start_ts` and `status`; the agent's status turning Live |
| .b the first request fails (401, 403, 422) | The failed request's code, `reason`, `detail` and the field at fault: **not readable** (no gateway emitter, G1); rendered by URL only |
| .c the session ends at the idle timeout | A first session whose row went from `running` to `stopped` within a minute of `start_ts`; `GET /sessions?channel=` for the name Sam types |
| .d no session 24 h after the copy | `copiedAt` older than 24 h and no first session |
| .e developer sessions look like production | Nothing to read: `client_reference` is never returned and the API has no purpose field, so every non-Studio session counts as production |
| .f no saved agent | The agent's saved config rendered inline as `AgentInput` for `POST /sessions/ephemeral` |
| .g the key in browser code | The project's auth mode (secured or testing) for the RTC token note; the RESTful API key named as server side only |
| .h the failed request never reaches Studio | The three common refusals with their fixes, static; the account's RESTful API key count for the 401 root cause |

## What a new account lacks

A code agent (P0.1 creates one), a heard test (P0.7), a copy of the snippet (this row records it), a first session (only the customer's software makes one), and a RESTful API key (Customer ID and secret are created once per account on `/restful-api`; a brand-new account has none, which is the most common 401). The App ID exists on every project from the start. No failed request ever reaches Studio: the gateway has no emitter (G1), so `session_create_failed` and `channel_connected {code}` are server events without an owner and every state that depends on them renders by URL in the prototype and by the .h list in production. There is no purpose field, so Studio cannot tell Sam's own sessions from the app's users' (.e). Presets, voices and provider lists exist without data (P0.2).

API truth per field (checked against the snapshot):

| Field | In spec | Default | Notes |
|---|---|---|---|
| `SessionCreate.agent_id` | yes, required | | Pattern `^agent_`. The snippet carries the agent's id |
| `SessionCreate.transport` | yes, required | | `oneOf` rtc, telephony, discriminated on `type` |
| `RtcTransportInput.channel`, `uid`, `subscribe_uids` | yes, required | | `subscribe_uids` holds exactly one uid. The snippet ships example values `room-42`, `agent`, `["user-7"]` |
| `RtcTransportInput.token` | yes, write-only | | The agent's RTC token in a secured-mode project; the snippet carries a placeholder there and omits it in testing mode |
| `RtcTransportInput.encryption`, `audio_scenario` | yes | `aiserver` | Not in the snippet (no control for what the API does by default) |
| `TelephonyTransportInput.from` | yes, required | | A project number id `num_…` or E.164. The snippet fills the project's first number id; with no numbers it reads `num_…` and the line under it says to add one (P0.9) |
| `TelephonyTransportInput.to` | yes, required | | E.164, the person's number; the snippet ships an example |
| `TelephonyTransportInput.call_policy` | yes | | Not in the snippet; P0.9 owns call policy |
| `SessionCreate.variables` | yes | | `TemplateVariables`; the snippet carries one key per `{{variable}}` in the prompt (P0.4's `readPromptVariables`) with the stored test value or the name in braces |
| `Lifecycle` | yes | 30 s, 72 h, off | P0.3's defaults, carried so the Advanced session door lands on something |
| `DataPolicy.retention` | yes | `30_days` | Carried only when the agent's label is `none` (P0.8's rule) |
| `SessionCreate.client_reference` | yes, max 256 | | **Never returned** by any read, so Studio never writes it into the customer's snippet and cannot use it to separate developer sessions (.e) |
| `SessionStartResponse` | yes | | `agent_session_id`, `status` starting or running, `created_at`. Transport details are never returned |
| `GET /sessions` rows (`SessionListItem`) | yes | | `start_ts`, `status`, `agent_id` only. No `agent_session_id`, no channel, no `client_reference`, no end time, no duration. Studio can count a first session and read its status; it cannot open it, time it, or match it to a test by id (G16) |
| `GET /sessions?channel=` | yes | | Exact, case-sensitive match on `transport.channel`; telephony sessions never match. The .c check |
| `GET /sessions?status=` | yes | `running` | Studio passes all six statuses so a stopped first session still counts |
| `GET /sessions?started_after=` | yes | now minus 2 h | Studio passes `copiedAt` so the watch covers the whole wait |
| `POST /sessions/ephemeral` | yes | | `agent` (`AgentInput`: `instructions`, `messages`, `structured_output`, `greeting`, `variables`, `pipeline`, `filler_words`, `labels`), `transport`, `lifecycle`, `data_policy`. No `agent_id`. Listed; never in agent aggregates (.f) |
| `ErrorResponse` | yes | | `detail` and `reason` (enum). The spec lists 401, 403 and 422 on `POST /sessions` but gives no example body per code, so Studio shows `reason` as sent and maps the fix by code |
| Failed request seen by Studio | **no** (G1) | | `.b` renders by URL; production shows the .h list until the emitter ships |
| Purpose field (developer or production) | **no** | | `.e` is a note, not a control |
| Session SDK | **no** | | The snapshot ships no SDK. The second language is a plain Node.js `fetch`; the toggle takes an SDK's name when one ships (open question 1) |
| App ID | project field | | Filled into the URL; not a secret |
| RESTful API key | account, `/restful-api` | | Customer ID and secret, Basic auth (`-u`). Never printed; the snippet reads them from the environment and the strip links the page. Count read from the existing keys panel |
| Project auth mode | project field | secured | Secured (App ID and RTC token) or testing (App ID only); drives the RTC token note |
| Copied at, first session at | **no** | | Studio state: `sessionStorage` `ng.v3-concepts.code:<agentId>` until a server anchor ships; the KPI is measured from the client events |

## Where it exists outside our accounts

- Two steps, key then code with language tabs in the box header: Resend, `shots/refero-resend-03-first-email-quickstart.png`.
- A waiting line that names the trigger in one sentence: Resend's webhook empty state, `shots/refero-resend-01-webhook-no-events-yet.png`.
- Four language tabs on one action: Vapi, `shots/vapi-02-dashboard-quickstart-tabs.png`; **Code** as a tab beside the live view: LiveKit, `shots/livekit-01-agent-builder-code-tab-closed.png`.
- Keys separated by purpose, each with its rule sentence: Cohere, `shots/refero-cohere-02-api-keys-prod-trial.png`; the key string itself saying which it is: Stripe docs (text only, no shot).
- Dev and production told apart only by how the process is started, never in the client call: LiveKit, `shots/livekit-02-starter-apps-docs.png`.
- A session that exists only as a list row after it happened: Retell, `shots/retell-02-call-detail-panel.png`.
- Not captured anywhere (research gaps): a first-session confirmation in a product, a server-side mark inside a snippet, an RTC channel check, an ephemeral snippet. The prototype fakes these by URL and fixtures; no capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Names below are the contract for the build; the build may place them where the file's order wants. Every change is additive: no seed loses a field. P0.8's names are kept and grown, never replaced.

1. Types:

   ```ts
   type SnippetKind = "rtc" | "phone" | "ephemeral"      // P0.8's kind, grown by ephemeral
   type SnippetLanguage = "curl" | "node"
   type CodeFailure = { at: string; code: 401 | 403 | 422; reason: string; field?: string; detail: string }  // G1, review only
   type FirstSessionOutcome = "running" | "stopped" | "stopped_early"   // stopped_early: stopped within a minute of start_ts
   type CodeDeployment = {
     copiedAt?: string; copiedAtIso?: string; kind?: SnippetKind; language?: SnippetLanguage
     firstSessionAt?: string; firstSessionAtIso?: string; firstSessionOutcome?: FirstSessionOutcome
     failure?: CodeFailure
   }
   type Project = { appId: string; authMode: "secured" | "testing"; restfulKeys: number }
   type ChannelCheck = { channel: string; found: { startedAt: string; status: SessionStatus }[] }
   type CommonError = { code: 401 | 403 | 422; reasons: string[]; text: string; fix: { label: string; href?: string; action?: "copy" } }
   ```

2. `ProtoAgent.codeDeployment?: CodeDeployment`. In the port, `copiedAt`, `kind` and `language` are Studio state (`sessionStorage` `ng.v3-concepts.code:<agentId>`) written on copy; `firstSessionAt` and `firstSessionOutcome` come from the first non-Studio row of `GET /sessions`; `failure` is never set in production until G1 ships. The prototype keeps all of it on the agent so review links can set it.
3. `Session` gains optional `channel?: string`, `transport?: "rtc" | "telephony"`, `source?: "studio_test" | "software"`; existing rows default to `software` on a code agent.
4. `PROJECT: Project = { appId: "4c1e0b7d2a9f4e8b8c6d1f2a3b4c5d6e", authMode: "secured", restfulKeys: 1 }`. `account=empty` and the review state `code=no-key` render `restfulKeys: 0`; `code=testing` renders `authMode: "testing"`.
5. `sessionSnippet(agent, kind, language = "curl")`: P0.8's function grown. curl: the URL with `PROJECT.appId` filled (`https://preview.ai.agora.io/conversational-ai/v3/projects/<appId>/sessions`, or `/sessions/ephemeral`), the auth line `-u "$CUSTOMER_ID:$CUSTOMER_SECRET" # server side only`, the body with `agent_id` (rtc, phone) or `agent` (ephemeral, from `agentInputFrom`), `transport`, `variables` when the prompt has any, `lifecycle` from `SESSION_LIFECYCLE_DEFAULTS`, `data_policy` only when the label is `none`. rtc transport: `type`, `channel: "room-42"`, `uid: "agent"`, `subscribe_uids: ["user-7"]`, and `token: "AGENT_RTC_TOKEN"` only in secured mode. phone transport: `type`, `from: PROJECT_NUMBERS[0].id` (or `"num_…"` when the project has none), `to: "+12065550134"`. Node.js: the same body as a `fetch` with `Authorization: "Basic " + Buffer.from(process.env.CUSTOMER_ID + ":" + process.env.CUSTOMER_SECRET).toString("base64")` and `// server side only` on that line, `AGENT_RTC_TOKEN` read from `process.env`. Never a real key, never `client_reference`, never a tag (.e).
6. `agentInputFrom(agent)`: the `agent` body of the ephemeral snippet from the saved config, fields as `AgentInput` names them: `instructions` (the prompt), `greeting` (P0.4's text and `on`), `pipeline` with `asr { vendor, model, language }`, `llm { vendor, model, failure_message }`, `tts { vendor, params }` (a realtime agent sends `mllm` instead, P0.3), `filler_words` when on (P0.3), `labels` (the studio ones). Never a credential value (P0.6); a BYOK module carries `credential: { mode: "byok", secret: "$secrets.<set>.<key>" }` as the reference only.
7. `snippetFacts(kind)`: `{ appId, keys: { count: PROJECT.restfulKeys, href: "/restful-api" }, tokenNote?: "secured" | "testing" }`; `tokenNote` only for `rtc` and `ephemeral`.
8. `codeLine(agent, nowIso)`: `{ state: "draft" | "waiting" | "stale" | "first" | "idle" | "failed"; text: string; tick: boolean }` from `codeDeployment`: `draft` with no `copiedAt` (P0.8's draft line); `waiting` when copied, no first session, under 24 h; `stale` from 24 h; `first` when `firstSessionAt` (tick true) with `firstSessionOutcome` running or stopped; `idle` when `stopped_early`; `failed` when `failure` is set. P0.8's `codeLine` strings for draft and live are kept and the new states are added.
9. `COMMON_ERRORS: CommonError[]`, three entries in code order (401 `InvalidPermission`; 403 `ServiceNotEnabled`, `AccountSuspended`; 422 `InvalidFieldValue`, `MissingRequiredField`, `InvalidRequestBody`) with the copy table's text and fix.
10. `checkRtcChannel(channel, sessions)`: exact, case-sensitive match on `Session.channel` among rtc rows started in the last two hours; returns `ChannelCheck`. Port: `GET /sessions?channel=<name>&status=idle,starting,running,stopping,stopped,failed&started_after=<copiedAtIso or now minus 2 h>`.
11. `isOwnTest(row, tests)`: true when `row.start_ts` is within 5 s of a Studio test start (P0.7's stored session), since rows lack `agent_session_id` (G16). `firstSoftwareSession(rows, tests)` returns the earliest row that is not an own test.
12. Seeds:
    - New `agent_assist` "Shopping assistant": code, draft, Lowest latency, voice Aria, language `en`, prompt "You are Aria, the in-app helper for Acme Outfitters. Help people find the right size and fabric, answer questions about returns, and hand over to a person when asked. Keep every reply under two sentences.", greeting *"Hi, I'm Aria. What are you looking for today?"* (agent first, delay 0, P0.4's shape), no failure message, no integrations, `numbers: []`, `runs: []`, `sessions: []`, `stats: null`, `updatedAt: "Today, 13:55"`, `updatedAtIso: "2026-09-26T13:55:00.000Z"`, `lastTestHeard: { at: "14:01", agentVersion: "2026-09-26T13:55:00.000Z" }` (Readiness reads two ticks, so the snippet is the only thing left), labels from `studioLabels("code")`, no `codeDeployment`. The journey start.
    - `agent_tutor` gains `codeDeployment: { copiedAt: "Sep 18, 11:40", copiedAtIso: "2026-09-18T11:40:00.000Z", kind: "rtc", language: "curl", firstSessionAt: "Sep 18, 11:52", firstSessionAtIso: "2026-09-18T11:52:00.000Z", firstSessionOutcome: "stopped" }`; its five `sessions` gain `channel: "lumen-<party>"`, `transport: "rtc"`, `source: "software"`. Matches P0.8's line "First session from your software on Sep 18."
    - `agent_api_custom`, `agent_realtime`, `agent_clinic`, `agent_frontdesk`, `agent_payments`, `agent_survey`, `agent_orders`, `agent_draft`, `agent_api_untyped` unchanged.
    - `PROJECT_NUMBERS` unchanged from P0.8 (ids `num_0142` first).
    - `newAgent` gains nothing.
13. Review states by URL, none writes the store: `code` (`copied` | `waiting` | `first` | `failed-401` | `failed-403` | `failed-422` | `idle` | `idle-found` | `idle-none` | `stale` | `errors` | `no-key` | `testing`); `snippet` (`rtc` | `phone` | `ephemeral`, the transport tab); `lang` (`curl` | `node`, the language toggle). Each renders `agent_assist` with the `codeDeployment` the state needs (`copied`: copied 14:02, toast on mount; `waiting`: copied 14:02, now 14:14; `first`: first session 14:09, toast on mount, status live; `failed-*`: `failure` set at 14:05; `idle`: first session 14:05 `stopped_early`; `idle-found`: the check answered with one row; `idle-none`: the check answered with none; `stale`: copied yesterday 14:02, list expanded; `errors`: copied 14:02, **Nothing arrived?** expanded; `no-key`: `restfulKeys: 0`; `testing`: `authMode: "testing"`).
14. `parts/events.ts` gains `first_session_detected`, `go_live_error_shown`, `rtc_channel_checked`; `code_snippet_copied` (P0.8) gains the props `language` and `kind`; `cta_viewed` gains `cta: nothing_arrived | create_key`; `external_link_opened` gains `surface: restful_api_keys | token_docs | project_settings`. `channel_connected {code}` and `session_create_failed` are server events and are not logged.
15. Tests: `sessionSnippet(agent_assist, "rtc")` contains the App ID in the URL, `"agent_id": "agent_assist"`, `"token": "AGENT_RTC_TOKEN"`, `# server side only`, no `client_reference`, no `data_policy`; with `PROJECT.authMode` testing it has no `token`; `sessionSnippet(agent_assist, "phone")` has `"from": "num_0142"` and no token; `sessionSnippet(agent_assist, "ephemeral")` has `"agent": {` with `"instructions"` and no `"agent_id"`; `sessionSnippet(agent_assist, "rtc", "node")` contains `process.env.CUSTOMER_SECRET` and `// server side only`; `sessionSnippet(agent_tutor, "rtc")` with the label `none` carries `"retention": "none"`; `codeLine(agent_assist)` is `draft`, with `copiedAt` 20 min ago `waiting`, 25 h ago `stale`, with `firstSessionAt` `first` and tick true, with `stopped_early` `idle`, with `failure` `failed`; `checkRtcChannel("lumen-user_8812", agent_tutor.sessions)` finds one row and `checkRtcChannel("Lumen-user_8812", …)` finds none; `isOwnTest` matches a row 3 s from a test start and not one 9 s away; `COMMON_ERRORS` has three entries in code order.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run, which captures the prototype): one console-made code agent with a prompt, tested once by the owner; one RESTful API key on the account; the snippet copied and run once from the owner's own software with rtc, so a first session exists; the same run once more with a channel name the client never joins, so the idle-timeout state exists; a project in testing mode for the other token note. A 401 is made by running the snippet with a wrong secret and reading the response in the terminal: it never shows in Studio (G1). Never sign in or enter credentials for this: the owner does it in the staging account.
