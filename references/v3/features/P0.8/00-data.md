# P0.8 Confirm the agent is ready · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.8], `02-research.md` rule 0 (9 shots), the v3 API snapshot `references/api/v3/openapi-3.0.0-2026-09-24.json` (schemas `DataPolicy`, `SessionCreate`, `Number`, `NumberCreate`, `NumberPatch`, `InboundInput`, `Campaign`, `CampaignCreate`, `Lifecycle`; paths `/numbers`, `/numbers/{id}`, `/campaigns`, `/sessions`). ClickUp task 868m9wg4y has no comments, so there are no change notes. Requirements 6 (Deployment and Go live as one area, tabs per type) and 46 (data policy collected at Go live for inbound and batch; API gap on Number and Campaign). Funnel stage 9 `channel_connected`. Depends on P0.1 (the third tab and the header primary action, `tab=deploy`), P0.3 (the session door `tab=deploy&panel=new-run`), P0.4 (the prompt row and `section=prompt`), P0.7 (the test panel, `openTest`, `agent_audio_heard {agentVersion}`). P0.9, P0.10 and P0.11 grow the three Go live doors this row names (the number sheet, New run, the snippet); this row builds the area they land in.

## What the flow shows

| Screen | Data it needs |
|---|---|
| The Deployment tab on a draft agent (.a step 1) | An inbound draft agent with a prompt and no number (`agent_clinic`), the project's numbers with the agent each answers with, no test heard yet on its version |
| Readiness with three items (.a step 2) | Per agent: whether a test was heard on the agent's current version (`agent_audio_heard.agentVersion` equals the agent's `updated_at`), whether the prompt is written, and for inbound the numbers in the project, for batch the contact list Studio stored from the last run; one fix door each |
| Retention, 30 days or Zero retention (.a step 3) | `DataPolicy.retention` (`30_days` default, `none`); which endpoint carries it for this type (only `SessionCreate`, so only code can write it); the agent's stored choice for the snippet |
| Go live inside the area (.a step 4) | inbound: `PATCH /numbers/{id}` with `inbound.agent`; batch: `POST /campaigns {agent_id, contacts, …}` (New run, P0.10); code: the `POST /sessions` snippet with `agent_id`, `transport`, `lifecycle`, `data_policy` |
| The agent after Go live (.a step 5) | The number pointing at the agent, `status` Live, the toast, Readiness with every item done |
| The code agent's snippet carrying Zero retention (.a step 6) | A code agent with `labels.studio_data_policy: none` and the snippet body |
| .b no test since the last change | A live agent whose `updated_at` is newer than its last heard test's `agentVersion` |
| .c no number, no list | A project with no numbers (a brand-new account); a batch draft with no list stored |
| .d zero retention on inbound or batch | The absence of `data_policy` on `Number` and `Campaign` (API truth), stated as a reason |
| .e already deployed | A live inbound agent with its number, a live batch agent with runs, a live code agent with sessions from software |
| .f no deployment type | An agent made through the API with no `labels.studio_deployment` (`agent_api_untyped`) |
| .g suspended at Go live | The billing state suspended (outside the v3 API, G9); `AccountSuspended` on `POST /sessions` and on `POST /campaigns` |
| .h edits an agent with a deployment | Which number or run uses the agent right now, so a save can name it |

## What a new account lacks

An agent, a number, a run, a test. After P0.1's create the account has one agent with no prompt and no deployment; after P0.4 and P0.7 it has a prompt and a heard test; nothing else this row shows exists until Go live makes it. A brand-new project has **no numbers** (there is no purchase endpoint; P0.9.b adds one by SIP trunk), so a new inbound agent meets .c on its first Deployment open. No test record exists on the server: Studio is the only holder of "a test was heard on this version" (P0.7 stores the session id and `agent_audio_heard {agentVersion}`), so readiness reads Studio state until the server anchor (notif 112) ships. There is no readiness, preflight or publish object in the API; a v3 agent has no deployment state. Retention lives only on `SessionCreate`.

API truth per field (checked against the snapshot):

| Field | In spec | Default | Notes |
|---|---|---|---|
| `DataPolicy.retention` | yes | `30_days` | `30_days` or `none`. Present on `SessionCreate` only. **Missing on `Number.inbound` and on `Campaign`**, so inbound and batch cannot carry it (.d, requirement 46, PRD decision open with Vineet, by 28 Sep). Code writes it into the snippet |
| `Number.inbound.agent` | yes, `InboundInput` | | `PATCH /numbers/{id}` points the number at the agent; the inbound Go live. `call_policy` and transfer are P0.9's |
| `Number.id` | yes | | `num_…`; the fixtures gain ids |
| `Campaign` create | yes, `POST /campaigns` | | `agent_id`, contacts, schedule, pacing, `lifecycle`; the batch Go live (New run, P0.10). Refused with `AccountSuspended` while suspended |
| `Session` create | yes | | `agent_id`, `transport`, `lifecycle`, `data_policy`; the code Go live is the snippet. Refused with `AccountSuspended` (P0.7 .d) |
| Agent version | yes, `Agent.updated_at` | | The version a test was heard on: `agent_audio_heard.agentVersion = updated_at` (P0.7). Compared with the agent's current `updated_at` for the test item |
| Heard test on a version | no | | Studio state: P0.7's `ng.v3-concepts.tested:<agentId>` grows to `{ at, agentVersion }` until notif 112 ships |
| Readiness, preflight, publish | no | | Nothing to read; the list is computed in Studio from the agent, the project's numbers and the stored test |
| Deployment status on the agent | no | | `status` Live or Draft is Studio's reading of the deployment (a number points at it, a run exists, software started a session), never an API field |
| Deployment type | labels only | | `labels.studio_deployment` (P0.1). Missing on an API-made agent (.f) |
| Retention choice for the snippet | labels only | | `labels.studio_data_policy: 30_days \| none`, written by Studio on code agents so the snippet remembers it; never read by the runtime |
| Billing state | no (G9) | | Suspended, free minutes; only the refusals are visible to the Console. The banner reads P1.7's billing state; until it ships the fixtures fake it by URL |
| Project numbers | yes, `GET /numbers` | | Each with `inbound.agent`; the picker lists them with the agent each answers with |
| Stored contact list | no | | `Campaign.contacts` is write-only; Studio keeps the last list per agent for Run again (P0.10) and the readiness item reads that |

## Where it exists outside our accounts

- The readiness list shape, one flagged card with one fix action and no colour on a clean one: Stripe's review step, `shots/refero-stripe-01-activation-review.png`.
- A go live with no check at all, the gap this row closes: our own Runs tab today, `shots/before-02-runs-tab-survey-draft.png`; ElevenLabs' single Publish beside its Channels area, `competitors/product/elevenlabs/elevenlabs-18-agent-channels.png`.
- Retention as a standing setting, never at Go live: ElevenLabs' three privacy controls, `shots/elevenlabs-01-zero-retention-privacy.png`; Retell's three storage tiers, `v3/02-research/monitoring/shots/retell-05-data-storage-settings.png`; LiveKit's project-wide toggles, `competitors/product/livekit/livekit-13-observability-settings-pii-redaction.png`.
- One sentence and one button for the empty case: LiveKit, `competitors/product/livekit/livekit-agents.png`.
- The deployment shown as the deployment, not a form, once it exists: our own Numbers and Runs tabs today, `shots/before-01-numbers-tab-frontdesk-live.png`, `shots/before-03-runs-tab-payments-live.png`.
- Not captured anywhere (research gaps 1, 4, 5): a readiness list that names a gap and still allows Go live, a partial-readiness agent, a per-number or per-run retention control. The prototype fakes these by URL and fixtures; no capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Names below are the contract for the build; the build may place them where the file's order wants. Every change is additive: no seed loses a field.

1. Types:

   ```ts
   type Retention = "30_days" | "none"
   type ReadinessItem =
     | { id: "test"; state: "done" | "open"; at?: string; changedAt?: string }
     | { id: "prompt"; state: "done" | "open" }
     | { id: "number"; state: "done" | "pending" | "open"; number?: string; available?: number }
     | { id: "list"; state: "done" | "pending"; listName?: string; contacts?: number; runName?: string }
   type ReadinessCode = "no_test" | "no_number" | "no_list" | "no_deployment_type"
   type ProjectNumber = { id: string; number: string; label: string }   // id `num_…`
   type LastTestHeard = { at: string; agentVersion: string }            // P0.7's stored flag, grown
   ```

2. `ProtoAgent.lastTestHeard?: LastTestHeard`. In the port this is P0.7's sessionStorage value `ng.v3-concepts.tested:<agentId>`, which grows from a boolean to `{ at, agentVersion }`; the prototype keeps it on the agent so review links can set it. `ProtoAgent.labels` gains the optional `studio_data_policy`.
3. `readReadiness(agent, numbers: ProjectNumber[]): ReadinessItem[]`: `test` done when `lastTestHeard?.agentVersion === agent.updatedAtIso` (P0.4's field), else open with `changedAt = agent.updatedAt` when a test was ever heard; `prompt` done when `agent.prompt.trim()` is not empty; inbound `number` done with the first number when `agent.numbers.length > 0`, open when `numbers.length === 0`, else pending with `available = numbers.length`; batch `list` done with the last run's list when `agent.runs.length > 0`, else pending; code has no third item. Order test, prompt, number or list.
4. `readinessCodes(items): ReadinessCode[]` returns `no_test` for an open test, `no_number` for an open number, `no_list` never in this row (reserved for P0.10's New run), in that order. `readinessAllGo(items)` is true when no item is open (pending counts as fine).
5. `retentionFor(agent): { value: Retention; writable: boolean; reason?: string }`: `value` from `labels.studio_data_policy` else `30_days`; `writable` true for code only; `reason` per type from the copy table (inbound and batch).
6. `deploymentLine(agent): string | null` for .h: inbound with a number "{number} answers with this agent, so the change reaches callers on their next session."; batch with a running, scheduled or paused run "{run} dials with this agent, so the change reaches its next session."; batch with only finished runs "The next run dials with this change."; code with sessions "Your software starts sessions with this agent, so the change reaches the next one."; otherwise `null` (a draft agent gets no line).
7. `sessionSnippet(agent, kind: "rtc" | "phone")` moves out of `SdkCode` into data so a test can read it: `agent_id` (the spec's key, not `agent`), `transport`, `lifecycle` from `SESSION_LIFECYCLE_DEFAULTS` (P0.3's diff), and `data_policy: { retention: "none" }` only when the agent's retention is `none` (the default is omitted, no control for what the API does by default).
8. `PROJECT_NUMBERS` becomes `ProjectNumber[]` with ids `num_0142`, `num_0187`, `num_0188`, `num_0110`, `num_0199`; `account=empty` and the review state `dep=no-number` render with an empty list.
9. `deriveStatus(agent)` is not introduced; `status` stays a stored field. Go live sets `status: "live"` (as today); **Remove** of the last number sets `status: "draft"`.
10. Seeds:
    - New `agent_clinic` "Clinic reception": inbound, draft, Lowest latency, voice Aria, language `en`, prompt "You are the front desk for Northside Clinic. Answer questions about opening hours, location and services. Take a message when you cannot help, and read it back before you end. Keep every reply under two sentences.", greeting *"Hi, this is Aria at Northside Clinic. How can I help?"* (agent first, delay 0, P0.4's shape), no failure message, no integrations, `numbers: []`, `runs: []`, `sessions: []`, `stats: null`, `updatedAt: "Today, 13:40"`, `updatedAtIso: "2026-09-26T13:40:00.000Z"`, no `lastTestHeard`, labels from `studioLabels("inbound")`. The journey start and the partial-readiness fixture research gap 4 asked for.
    - `agent_frontdesk` gains `lastTestHeard: { at: "Sep 19, 15:10", agentVersion: "2026-09-19T15:02:00.000Z" }` (its `updatedAtIso`).
    - `agent_payments` gains `lastTestHeard: { at: "Sep 22, 09:20", agentVersion: "2026-09-22T09:14:00.000Z" }`.
    - `agent_tutor` gains `updatedAtIso: "2026-09-18T11:30:00.000Z"` (if P0.4's diff has not) and `lastTestHeard: { at: "Sep 18, 11:36", agentVersion: "2026-09-18T11:30:00.000Z" }`; `sessions` keeps what it has; the code row reads the first session's date from `stats` or the first `sessions` row.
    - `agent_survey` (batch, draft, prompt written) stays without `lastTestHeard` and without runs: readiness reads test open, prompt done, list pending.
    - `agent_api_untyped` unchanged (the .f fixture, number `+1 415 555 0199` points at it).
    - `agent_draft` (P0.4) unchanged: no prompt, no test, so Readiness shows two open items and the third pending; listed as an extra state.
    - `newAgent` gains nothing.
11. Review states by URL, none writes the store: `dep=ready` (the agent rendered with `lastTestHeard` at its current version, `at: "14:02"`), `dep=live` (`agent_clinic` rendered with `+1 628 555 0110`, status live, the toast on mount), `dep=no-test` (`agent_payments` rendered with `updatedAt: "Sep 24, 16:30"` and `updatedAtIso` newer than its `lastTestHeard.agentVersion`), `dep=no-number` (`PROJECT_NUMBERS` rendered empty), `dep=suspended` (the billing banner shown; New run's Start run answers the `AccountSuspended` refusal), `dep=saved-live` (the save toast with the deployment line fired on mount for the row named by `section=`), `dep=zero-retention` (`labels.studio_data_policy` rendered as `none`, the snippet carries it). `panel=go-live` opens the number sheet (real, URL-held; replaces the local `connectOpen`).
12. `parts/events.ts` gains `readiness_opened`, `go_live_clicked`, `go_live_blocked`, `data_policy_selected`, `code_snippet_copied`, `cta_viewed` (if P0.7 has not). `channel_connected` is a server event and is not logged by the prototype; its Console fallback `operation_succeeded {operation: telephony_phone_number_bind | telephony_campaign_create}` is.
13. Tests: `readReadiness(agent_clinic, PROJECT_NUMBERS)` is `[test open (no changedAt), prompt done, number pending available 5]`; with an empty numbers list the number item is open and `readinessCodes` is `["no_test", "no_number"]`; `readReadiness(agent_frontdesk, …)` has no open item and `readinessAllGo` is true; an agent whose `updatedAtIso` is newer than `lastTestHeard.agentVersion` reads test open with `changedAt`; `readReadiness(agent_tutor, …)` has two items; `retentionFor(agent_clinic)` is `{ value: "30_days", writable: false, reason }` and `retentionFor(agent_tutor)` is writable with no reason; `sessionSnippet` omits `data_policy` on the default and includes `{ retention: "none" }` when the label is `none`; `deploymentLine(agent_clinic)` is `null`, `deploymentLine(agent_frontdesk)` names `+1 415 555 0142`, `deploymentLine(agent_payments)` names the running run.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run, which captures the prototype): one console-made inbound agent with a prompt, tested once by the owner, in a project with at least one number (added by SIP trunk, P0.9); the same agent after Go live; one batch agent with one finished run; one code agent whose snippet was run once from the owner's software. A project with no numbers is the natural state of a fresh project. A suspended account cannot be produced on purpose in staging; it stays a design-mode capture. Never sign in or enter credentials for this: the owner creates these in the staging account.
