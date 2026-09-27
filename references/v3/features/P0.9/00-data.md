# P0.9 Let callers reach the agent · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.9], `02-research.md` rule 0 (16 shots, 8 files in `shots/`, 8 reused from `competitors/product/*`), the v3 API snapshots `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (schemas `Number`, `NumberCreate`, `NumberPatch`, `SipTrunkInput`, `SipAuth`, `InboundInput`, `InboundCallPolicy`, `EndCallPolicy`, `TransferPolicy`; paths `/numbers`, `/numbers/{id}`) and `openapi-3.0.0-2026-09-24.json` (the same file without `call_policy` on `InboundInput`; see the API table). ClickUp task 868m9wg59 has no comments, so there are no change notes. Requirements 48 (inbound call policy, end rules and transfer at Go live) and 33 (the add-number sheet; the Numbers page itself is P3.2). Funnel stage 9 `channel_connected {inbound}`; stages 10 and 11 are derived and blocked on G2. Depends on P0.8 (the Deployment tab, `GoLiveNumberSheet`, `panel=go-live`, the `dep=` review states, `agent_clinic`, `PROJECT_NUMBERS` with ids), P0.3 (the fold row and the inbound session line), P0.6 (`SecretKeyField` without its Save key button), P0.5 (the row `…` menu). P3.2 and P3.3 reuse this sheet for every number in the project.

## What the flow shows

| Screen | Data it needs |
|---|---|
| The Deployment tab on the tested draft agent (.a step 1) | `agent_clinic` (inbound, draft, prompt written) with a heard test on its current version (P0.8's `dep=ready`), five numbers in the project, one of them spare |
| The Go live sheet with a number picked (.a step 1) | The project's numbers with the agent each answers with and, for a number that already has one, its call policy so the folds pre-fill |
| Call policy (.a step 2) | `InboundCallPolicy`: `max_call_duration_seconds`, `max_silence_duration_ms`, `end_call` with four booleans, all off by default |
| Transfer (.a step 3) | `TransferPolicy`: `phone_number` in E.164 and `description` (1 to 1000 characters) |
| The agent after Go live (.a step 4) | The number pointing at the agent with its policy, the time Studio recorded Go live, and whether a production session has reached the number |
| The number after Sam dials (.a step 4) | The first inbound session on that number (`GET /sessions` filtered to telephony sessions whose `to` is the number, direction inbound) |
| .b no numbers | A project with no numbers (a brand-new account) and the carrier docs link |
| .c import fails | A 409 on `POST /numbers` (the number exists) and a 400 on `sip_trunk.hostname` (the pattern `^[^:/\s]+$`) |
| .d already points at another agent | A number whose `inbound.agent` is another agent (`num_0142` answers with Front desk) |
| .e transfer not E.164 | The pattern `^\+[1-9][0-9]{1,14}$` |
| .f callers never arrive | A live number with no inbound session; there is no health field, so the row reads what Studio knows |
| .g idle timeout | The absence of `lifecycle` on a number (it lives on `SessionCreate` and `Campaign`) and the presence of `max_silence_duration_ms` on the call policy |
| .h stalled | Days since Studio recorded Go live with no inbound session (ST); "only Sam by day 14" (SC) needs the caller against the creator and is P1.8's, blocked on G2 |
| Edit after Go live | A live number's policy, reopened from the row |

## What a new account lacks

Numbers, above all. Agora sells none and the API has no purchase endpoint, so a brand-new project has an empty `GET /numbers` and the first inbound agent meets .b on its first Go live: the sheet opens on the SIP trunk form, and the carrier does the rest. After P0.8 the account has one tested draft agent with a prompt (`agent_clinic`); nothing this row shows exists until Go live makes it. No session exists on a number until a real caller dials it; Studio is the only holder of "Go live happened at {time}" (it records the PATCH), so the reach line reads Studio state plus the sessions list until session summaries ship (G2). No call policy exists anywhere in the current Console.

## API truth per field (checked against both snapshots)

| Field | In spec | Default | Notes |
|---|---|---|---|
| `InboundInput.agent` | yes, both | | Required on POST and PATCH; `null` rejects inbound. The PATCH that points the number is the inbound Go live (P0.8) |
| `InboundInput.call_policy` | **ih7axj9zx only** | omitted | `InboundCallPolicy`. The 3.0.0 snapshot (byte-identical to the live docs on 24 Sep) has `agent` alone. The PRD row and requirement 48 say Ready, so this row designs against ih7axj9zx; if October ships the 3.0.0 shape, both folds render one line each, "Not on a number yet.", and the Numbers row shows no policy summary (open question 1) |
| `call_policy.max_call_duration_seconds` | yes | none (no deadline) | Integer, minimum 1. Studio shows whole minutes and sends seconds |
| `call_policy.max_silence_duration_ms` | yes | none (no silence hangup) | Integer, minimum 1. Studio shows whole seconds and sends milliseconds. The nearest thing to an idle timeout on a number (.g) |
| `call_policy.end_call.*` | yes | all `false` | `on_conversation_complete`, `on_user_request`, `on_fax`, `on_ai_assistant`. Four checkboxes, none ticked until Sam ticks one |
| `call_policy.transfer` | yes | none | `phone_number` E.164 (`^\+[1-9][0-9]{1,14}$`), `description` 1 to 1000. Both required together; omit the object for no transfer; a JSON merge patch clears it with `null` |
| `NumberCreate.number` | yes | | E.164. 409 when it exists in the project |
| `NumberCreate.description` | yes | | The label the picker and the row show. Not asked in this row's sheet; the row's second line reads the host until P3.2 adds it |
| `sip_trunk.hostname` | yes | | Required; `^[^:/\s]+$`, so `sip:`, a port or a path is a 400 (.c) |
| `sip_trunk.transport` | yes | `tls` | udp, tcp, tls. Labelled SIP protocol (locked word) |
| `sip_trunk.port` | yes | 5061 for TLS, 5060 otherwise | Not shown; the protocol (i) names the default (no control for what Agora does by default) |
| `sip_trunk.auth` | yes | none | `username` and `password` (raw write-only or `$secrets.<set>.<key>`), never in responses. Optional in the spec: a trunk can be trusted by IP instead |
| `sip_trunk.allowed_ips` | yes | none (any address) | CIDR ranges. Optional; the field the current sheet lacks and every vendor names |
| `Number.inbound` | yes | | Reads back `agent` and (ih7axj9zx) `call_policy`, so the row summary and the edit sheet read the API, not Studio state |
| A health or reach field | no | | Nothing says whether the trunk delivers. The row reads the sessions list (.f) |
| Lifecycle on a number | no | | `idle_timeout_ms`, `max_duration_ms` and `graceful_stop` live on `SessionCreate` and `Campaign` only (.g) |
| Number purchase | no | | No endpoint; the carrier docs are linked (.b) |
| `data_policy` on a number | no | | P0.8.d, unchanged |
| Go live time | no | | Studio records the PATCH time per number for the reach line and the stalled state (.h) |
| First inbound session on a number | derived | | `GET /sessions` with `transport.type = telephony`, direction inbound, `to = number`; the first row's `created_at`. Until session summaries ship, "reached" means a session started, not that the agent answered (G2) |

## Where it exists outside our accounts

- Both doors in one sheet, a project number or a new SIP number: our own sheet today, `shots/before-02-connect-number-sheet.png`; Retell's two-item menu, `competitors/product/retell/retell-16-add-number-menu.png` and `retell-17-sip-trunk-form.png`.
- The full SIP field set with a named allowlist and an honest default: ElevenLabs, `competitors/product/elevenlabs/elevenlabs-17-sip-trunk-form.png` ("Allowed Source IP Addresses (Optional)"); LiveKit's "Numbers" and "Allowed addresses", `competitors/product/livekit/livekit-17-inbound-trunk-form.png`.
- The error on the field at fault: LiveKit's field-level SIP validation, `competitors/product/livekit/livekit-17-trunk-json-editor-validation.png`; ElevenLabs' form error, `competitors/product/elevenlabs/sip-trunk-form-validation-error.png`.
- A per-number state after save: Vapi's "Unprovisioned" badge, `competitors/product/vapi/sip-phone-number-unprovisioned.png` (a provisioning flag, not a reach signal).
- Setup that ends on a real inbound call: Zendesk Talk's number setup, `shots/refero-zendesk-02-call-test-offline.png`, `refero-zendesk-03-incoming-call-demo.png`, `refero-zendesk-04-in-call-ticket.png` (Refero flows 1358 and 1396).
- The names of every control, from the carrier's own docs: `shots/twilio-01-sip-trunking-docs.png`.
- Not captured anywhere: a call policy on a number (no vendor has one; Retell's limits are workspace-level), an agent-initiated transfer set at Go live, a "not reached yet" row line. The prototype fakes these by fixtures and URL; no capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Names below are the contract for the build; the build may place them where the file's order wants. Every change is additive: no seed loses a field. Builds land in id order, so this row starts on P0.8's commit; if P0.8's commit is absent at build time, `ProjectNumber` with ids, `agent_clinic`, `lastTestHeard` and the `dep=` states are added here exactly as P0.8's `00-data.md` names them, and P0.8 takes them over.

1. Types:

   ```ts
   type EndCall = { onConversationComplete: boolean; onUserRequest: boolean; onFax: boolean; onAiAssistant: boolean }
   type Transfer = { phoneNumber: string; description: string }
   type InboundCallPolicy = { maxDurationS?: number; maxSilenceMs?: number; endCall: EndCall; transfer?: Transfer }
   type SipProtocol = "tls" | "tcp" | "udp"
   type ProjectNumber = {
     id: string; number: string; label: string                       // P0.8's shape
     sip?: { host: string; protocol: SipProtocol; allowedIps: string[] }
     inboundAgent?: string                                            // Number.inbound.agent, the join P0.8 keeps in agent.numbers
     callPolicy?: InboundCallPolicy                                   // Number.inbound.call_policy
     wentLiveAt?: string                                              // Studio's record of the PATCH, ISO
     reachedAt?: string                                               // first inbound session on the number, ISO, from GET /sessions
   }
   type NumberDraft = {
     source: "project" | "sip"; numberId?: string
     number: string; host: string; protocol: SipProtocol; username: string; password: string; allowedIps: string
     policy: { maxDurationMin: string; maxSilenceS: string; endCall: EndCall; transferTo: string; transferWhen: string }
   }
   ```

2. `EMPTY_END_CALL`, `EMPTY_POLICY_DRAFT`, `SUGGESTED_TRANSFER_LINE` ("The caller asks for a person, or the agent cannot help after two tries."), `CARRIER_DOCS_URL` (the v3 docs' Numbers page until a carrier checklist exists; open question 2).
3. `isE164(value)` (`^\+[1-9][0-9]{1,14}$`), `isSipHost(value)` (`^[^:/\s]+$`), `validateNumberDraft(draft, numbers): Record<fieldId, string>` returning the copy-table errors: number (empty, E.164, exists in the project), host (empty, pattern), auth (neither a username and password nor allowed IPs), allowed IPs (a line that is not an IP or CIDR), max duration and max silence (whole number of 1 or more), transfer (a number without a line, a line without a number, E.164, over 1000 characters).
4. `callPolicyFromDraft(draft): InboundCallPolicy | undefined` (minutes to seconds, seconds to milliseconds; `undefined` when nothing is set) and `draftFromPolicy(policy)` (the reverse, for the edit sheet and a picked number that already has a policy).
5. `callPolicyConfigured(policy)` (any limit, rule or transfer set), `transferConfigured(policy)`, `callPolicyLine(policy)` ("Ends when the caller hangs up." / "Ends after 10 min." / "Ends after 30 s of silence." / "Ends after 10 min or 30 s of silence." plus " · 2 end rules" when any rule is on), `transferLine(policy)` ("None" / "+1 415 555 0100"), `numberSummary(number)` (the row's second line: `{label}`, then ` · {callPolicyLine}` when configured, then ` · Transfers to {number}` when set; a SIP number with no label reads `{host} · {PROTOCOL}`).
6. `reachLine(number, nowIso)`: `reachedAt` set gives "First session {date}, {time}."; otherwise "Not reached yet. Dial it to hear the agent." and, from 3 days after `wentLiveAt`, "Not reached yet, {n} days after Go live. Dial it to hear the agent." (the .h ST state). `dialHref(number)` gives `tel:+16285550110` (digits only).
7. `numberCreateBody(draft, agentId)` for `POST /numbers` ({ number, sip_trunk: { hostname, transport, auth?, allowed_ips? }, inbound: { agent, call_policy? } }; the password as typed, shown as `"••••"` in View last save) and `numberBindBody(agentId, policy)` for `PATCH /numbers/{id}` ({ inbound: { agent, call_policy } }; a cleared transfer as `transfer: null`). `agent` is required on every inbound patch, so the edit sheet sends it back unchanged.
8. `PROJECT_NUMBERS` gains the new fields:
   - `num_0142` "Support line": `inboundAgent: "agent_frontdesk"`, `callPolicy: { maxDurationS: 600, maxSilenceMs: 30000, endCall: { onConversationComplete: true, onUserRequest: true, onFax: false, onAiAssistant: false }, transfer: { phoneNumber: "+14155550100", description: "The caller asks for a person, or wants to change a booking the agent cannot find." } }`, `wentLiveAt: "2026-09-19T15:12:00.000Z"`, `reachedAt: "2026-09-19T15:40:00.000Z"`.
   - `num_0199` "Order line": `inboundAgent: "agent_api_untyped"`, no policy (set through the API with `agent` alone), `reachedAt: "2026-09-25T09:02:00.000Z"`, no `wentLiveAt` (Studio never recorded it; P1.8.f).
   - `num_0187`, `num_0188` (the Collections numbers a run dials from): no inbound fields.
   - `num_0110` "Spare": nothing; the journey's number.
9. Seeds: `agent_clinic` (P0.8) is the journey start, unchanged. `agent_frontdesk` keeps `numbers: ["+1 415 555 0142"]`. `agent_api_untyped` unchanged. No seed gains a number.
10. Review states by URL (`num=`, never written to the store; each renders `agent_clinic` on the Deployment tab unless it names another agent): `picked` (the sheet with `num_0110` picked, both folds collapsed), `policy` (Call policy expanded with 10, 30 and the first two rules ticked), `transfer` (Transfer expanded with `+1 415 555 0100` and the suggested line; Call policy collapsed with its summary and tick), `sip` (the SIP form filled: `+1 415 555 0177`, `sip.carrier.com`, TLS, `clinic-trunk`, a password, one CIDR line), `live-policy` (P0.8's `dep=live` plus the policy on `num_0110`, `wentLiveAt` now, the toast on mount), `not-reached` (the same an hour later, no toast), `reached` (`num_0110` with `reachedAt` today 14:12), `stalled` (`wentLiveAt` three days ago, no `reachedAt`), `dup-409` (the SIP form with `+1 415 555 0142` typed and the 409 shown), `bad-host` (`sip:sip.carrier.com:5061` typed and the host error shown), `move` (`num_0142` picked, the warning line and the confirm open), `e164` (Transfer expanded with `415 555 0100` and the error), `idle` (Call policy expanded with the Max silence (i) open), `edit` (`agent_frontdesk` with `panel=number&item=num_0142`, the folds pre-filled). `fold=call-policy | transfer` expands that fold on open.
11. `parts/events.ts` gains `phone_number_linked`, `number_reassigned`, `call_policy_opened`, and `cta_viewed` where P0.7 or P0.8 have not added it. `channel_connected` and `agent_answered_production` are server-side and are not logged; the Console fallback `operation_succeeded {operation: telephony_phone_number_bind}` (P0.8) is.
12. Tests: `isE164` accepts `+14155550100` and rejects `415 555 0100`, `+0…` and 16 digits; `isSipHost` rejects `sip:host`, `host:5061`, `host/path`; `validateNumberDraft` on the empty SIP draft names number, host and auth, and passes with number, host and allowed IPs only; `callPolicyFromDraft` of an empty policy is `undefined` and of `{ 10, 30, two rules }` is `{ maxDurationS: 600, maxSilenceMs: 30000, … }`; `callPolicyLine` covers the four shapes; `reachLine(num_0142)` names the first session, `reachLine(num_0110 live now)` reads Not reached yet, and three days on reads the day count; `numberCreateBody` carries `inbound.agent` and omits `call_policy` and `auth` when unset; `numberBindBody` always carries `agent`; the edit draft of `num_0142` round-trips through `draftFromPolicy` and `callPolicyFromDraft`.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run, which captures the prototype): one project with a real SIP trunk from the team's carrier (Twilio or Telnyx), one number added through this sheet with a call policy and a transfer to the owner's own phone, one inbound session placed by the owner from a phone so the reach line fills, and one second inbound agent so .d can be shown on a real move. A project with no numbers is the natural state of a fresh project. A trunk that saves but never delivers (.f) is produced by a wrong host at the carrier, never by Studio. Never sign in or enter credentials for this: the owner creates these in the staging account.
