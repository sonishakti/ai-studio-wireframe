# P0.4 Tell the agent its job · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.4], `02-research.md` rule 0 (11 shots), the v3 API snapshot `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (schemas `Agent`, `AgentCreateInput`, `AgentPatch`, `Greeting`, `TemplateVariables`, `Llm`, `Mllm`, `ContactInput`, `SessionCreate`, `InboundInput`). No ClickUp comments on the task, so there are no change notes. Depends on P0.1 (the agent exists with a deployment type), P0.2 (Voice & models) and P0.3 (the Advanced sheet points at this door for the failure message; `agent_realtime` exists).

## What the flow shows

| Screen | Data it needs |
|---|---|
| System prompt row on a brand-new agent (.a step 1) | An agent with `instructions` empty, no `greeting`, no `variables`, no `llm.failure_message`; the row shows the empty editor, the starter prompt link and the door without a tick |
| The prompt written, variables as chips (.a step 2 and 3) | A prompt with `{{customer_name}}`, `{{appointment_time}}` and `{{office_hours}}`; one of them (`office_hours`) with a default in `variables`, the other two without |
| Greeting and failure message sheet (.a step 3) | `greeting` text with `{{customer_name}}`, who speaks first, `delay_ms`, and `llm.failure_message` set from the suggested line |
| Save and test (.a step 4) | The test panel able to ask for the two variables without a default, then play the greeting with them filled, so `agent_audio_heard` fires |
| .b cleared prompt | A saved agent with a prompt Sam can clear (`agent_survey`) |
| .c value asked once | The same written agent with two variables without a default; for batch, a New run with a contact list whose columns cover some variables and not others |
| .d no failure message | A saved agent with `llm.failure_message` absent (`agent_survey`) |
| .e agent first, greeting empty | An inbound or batch agent with who speaks first on the agent and an empty greeting (`agent_survey`, batch) |
| .f test with unsaved edits | Any saved agent with an edited, unsaved prompt draft and the header Test pressed |
| Type variants | A code agent (`agent_tutor`, greeting on first join) and a realtime agent (`agent_realtime`, from P0.3) |

## What a new account lacks

Nothing this flow needs. A brand-new agent from P0.1 already is the journey start: `POST /agents` requires only `agent_name`, so the agent comes back with `instructions` empty, no `greeting`, no `variables` and no `failure_message`. Every state in this row is reachable from that agent and Sam's own typing; no session, run, number or secret is needed. The fixtures fake only three things a fresh account cannot show at once: a saved prompt to clear (.b), a batch agent with runs for the New run mapping (.c), and the code and realtime variants.

API truth per field (checked against the snapshot):

| Field | In spec | Default | Notes |
|---|---|---|---|
| `instructions` | yes, string, runtime mutable | none, optional on create | No minimum length: the empty-prompt block (.b) is Studio's rule, not the API's. Studio blocks because an agent with no instructions answers as a bare model |
| `greeting` (text mode) | yes: `mode: "text"`, `on`, `delay_ms`, `text` | `delay_ms` 0; `on` has no default named; `text` required | Absent `greeting` means no first line: the agent waits. There is no "who speaks first" field; Studio derives it (agent = a greeting with text, caller = no greeting) and sends `greeting: null` on PATCH for caller first |
| `greeting.on` | `each_join` \| `first_join` | none | Only matters when people can rejoin, so rtc (code). Telephony has one join; Studio omits `on` for inbound and batch |
| `greeting.delay_ms` | integer 0 to 5000 | 0 | The Delay field |
| `greeting` (audio mode) | yes: `url`, `text`, `download_timeout_ms`, `pcm_sample_rate` | | API-only. An agent saved with an audio greeting shows a read-only line; not built this row |
| `greeting.interruptible` | PATCH only, null-only | | Not on create, so not offered. The live Console's "Callers can interrupt the greeting" switch has no v3 field |
| `variables` | yes, `TemplateVariables`: flat map, string \| number \| boolean, runtime mutable | none | The agent-level defaults. PATCH accepts `null` per key to delete one. Overridden per session by `contacts[].variables` (batch, `ContactInput`) and `SessionCreate.variables` (code). `InboundInput` has no variables, so inbound sessions use the defaults only |
| `pipeline.llm.failure_message` | yes, string | none | "Message spoken through TTS when the LLM fails. No fallback message is implied when omitted." So an empty field means silence (.d) |
| `pipeline.mllm.failure_message` | no | | A realtime agent hides the field with a line (P0.3 .d already says it) |
| AI disclosure sentence | no field | | The live Console composes it into `greeting.text`. Out of this row; open question 3 |
| an agent version for `agent_audio_heard.agentVersion` | no | | `updated_at`, as P0.3 |

## Where it exists outside our accounts

- Prompt with the first message beside it: Vapi `shots/vapi-assistant-model.png`, Retell `shots/retell-agent-editor.png`, ElevenLabs `shots/elevenlabs-agent-agent.png`, LiveKit `shots/livekit-19-agent-builder-conversation.png`.
- Empty-field behaviour stated inline: ElevenLabs `shots/elevenlabs-agent-agent.png` ("If empty, the agent will wait for the user").
- Variable insertion while writing: LiveKit `shots/livekit-19-agent-builder-conversation.png`, ElevenLabs `shots/elevenlabs-agent-agent.png` ("Type {{ to add variables").
- The only vendor failure line, three clicks deep: ElevenLabs `shots/elevenlabs-docs-01-soft-timeout-failure-message.png`.
- Our own earlier "Failure message" and "Hear the opening" states: `shots/05-silence-recap.png`, `shots/07-hear-disabled.png`.
- Not captured anywhere: an empty-prompt save block, a variable default editor, a test that asks for a value (research gaps). The prototype fakes these by URL; no capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`).

1. `ProtoAgent.greeting` reshaped to the API: `{ speaksFirst: "agent" | "caller"; text: string; on: "each_join" | "first_join"; delayMs: number }`. `speaksFirst` is Studio's reading of "greeting present"; the text is kept in the draft when Sam switches to caller so switching back restores it (P0.3's switch pattern). `mode` is always `text` in Studio; an API agent with an audio greeting carries `greeting.audioUrl?: string`.
2. `ProtoAgent.variables: Record<string, string>`: the defaults. Chips are read from the text, defaults from this map.
3. `readVariables(agent | { prompt, greeting })`: names in the prompt and the greeting text, in order of first appearance, deduplicated (replaces `readPromptVariables` for the row; the New run sheet keeps reading the same function).
4. `STARTER_PROMPTS: Record<DeploymentType, string>`: one starter per type, three to four sentences, role, job, one rule; the batch starter carries `{{customer_name}}` so the chip mechanism shows once. No company name, no "call".
5. `SUGGESTED_FAILURE_LINE = "Sorry, I lost track there. Could you say that again?"` (already the `agent_payments` value).
6. `validateGreeting(draft, type): Record<fieldId, string>`: `speaksFirst === "agent"` with empty trimmed text on inbound or batch gives the .e error; `delayMs` outside 0 to 5000 gives the range error.
7. `promptPatch(saved, draft)`: `{ instructions }` when changed, `variables` with only the changed keys and `null` for a name no longer in the prompt or greeting. `greetingPatch(saved, draft, type)`: `greeting: { mode: "text", text, delay_ms, on? }` (`on` only for code) or `greeting: null` for caller first; `pipeline: { llm: { failure_message } }` when changed. Both feed P0.3's **View last save**.
8. `newAgent` keeps `prompt: ""`, sets `greeting: { speaksFirst: "agent", text: "", on: "each_join", delayMs: 0 }` for inbound and batch and `speaksFirst: "caller"` for code (P0.1: hidden for code, the app decides), `variables: {}`, `failureMessage: ""`.
9. Seeds:
   - New `agent_draft` "Appointment reminders" (batch, draft, `studioLabels("batch")`): everything empty. Journey start.
   - `WRITTEN_DRAFT` (review only, never seeded): prompt "You are Aria from Bayview Dental. You are on the phone with {{customer_name}} to confirm their appointment on {{appointment_time}}. Confirm you are speaking to the right person before you mention it. If the time no longer works, offer to move it and say the office is open {{office_hours}}. Keep every reply under two sentences.", `variables: { office_hours: "Monday to Friday, 8 to 6" }`, greeting *"Hi, this is Aria from Bayview Dental. Is this {{customer_name}}?"* on the agent, delay 0, failure message the suggested line.
   - `agent_survey` "Renewal survey" (batch): untouched. Prompt with `{{customer_name}}`, greeting empty on the agent, no failure message: the .b, .d, .e and .f fixture.
   - `agent_payments` "Payment reminders" (batch, live): prompt gains "on {{callback_number}}" at the end of the callback sentence; `variables: { callback_number: "+1 415 555 0100" }`; greeting `speaksFirst: "agent"`, `delayMs: 0`. The New run mapping then shows all three readings: a column, a default, and not in this list.
   - `agent_frontdesk` "Front desk" (inbound): greeting as today, `delayMs: 500` (one non-default Delay to see).
   - `agent_tutor` "In-app tutor" (code): greeting on `first_join` as today, `speaksFirst: "agent"`, no failure message: the code variant.
   - `agent_realtime` "Concierge" (P0.3): unchanged; the sheet hides Failure message with a line.
   - `agent_api_custom`: unchanged (an audio greeting fixture is not built this row).
10. Review states by URL, none writes the store: `pr=written` (the row draft is `WRITTEN_DRAFT`), `pr=default` (written plus the `appointment_time` chip popover open), `pr=saved-test` (written shown as saved, toast, test panel open with the two values given and the greeting playing), `pr=ask-values` (written, test panel asking for the two values), `pr=cleared` (draft prompt empty on a saved agent), `pr=unsaved-test` (edited draft plus the header Test pressed: toast and panel), `pr=speaks-first-empty` (sheet, agent first, empty greeting, Save pressed), `pr=leave` (sheet dirty plus the guard), `pr=list` (New run sheet with a contact list chosen so the mapping table shows). `panel=greeting` opens the sheet.
11. Tests: `readVariables` finds a name used only in the greeting and keeps order; `validateGreeting` flags agent first with empty text on batch and passes it on code; `greetingPatch` sends `greeting: null` for caller first and omits `on` for inbound and batch; `promptPatch` sends `null` for a removed variable and never a default for a name still absent from the text; `STARTER_PROMPTS` contain no never word.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run):

- One console-made agent left with an empty prompt; one saved with a prompt, two variables without a default and one with; one saved with a greeting and the suggested failure line; one batch agent with a run whose list lacks a variable column.
- Never sign in or enter credentials for this: the owner creates these in the staging account.
