# P0.3 Make the conversation feel natural · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.3], `02-research.md` rule 0, the v3 API snapshot `references/api/v3/openapi-2026-09-24-ih7axj9zx.json`. The row has no `data` field; the needs below come from the happy steps .a and the rainy paths .b to .h.

## What the flow shows

| Screen | Data it needs |
|---|---|
| Voice & models with the Advanced door | A saved agent on a preset (Lowest latency) with its cascaded pipeline; the door sits in the row footer next to "Runs in US East" |
| Advanced sheet at spec defaults (.a step 2) | Every cascaded field at the value the spec gives: `speech_threshold` 0.5, start of speech semantic (speaking interrupt 160 ms), end of speech semantic (silence 320 ms, max wait 3000 ms, pause state on), interruption `start_of_speech`, `silence_config.enabled` false, `filler_words.enable` false, `max_history` 32, `skip_patterns` empty, `avatar.enabled` false, no `url`, no `headers` |
| One tuning change kept on a preset (.a step 3) | The same agent with silence 480 ms and filler words on; `labels.studio_preset` still `lowest_latency` |
| Save and test (.a step 4) | The test panel able to play a first answer so `agent_audio_heard` can fire |
| .b range error | A typed value below the range (silence 60 ms) |
| .c model change | A second language model in `MODULE_OPTIONS.llm` (Anthropic Claude Sonnet 4.6) and P0.2's Custom state |
| .d realtime | An agent whose `pipeline.mode` is `realtime` with an `mllm` module (OpenAI gpt-realtime), a `server_vad` turn detection with `idle_timeout_ms`, and one MCP server in Knowledge and tools |
| .e session settings | The agent's deployment type, so the line can point to New run (batch), the code snippet (code) or say inbound has no setting |
| .f reset | A saved agent whose Listen group differs from the spec defaults (silence 480 ms, a silence reminder on) |
| .g API-only fields | An agent made through the API with `llm.style`, `llm.params` and `tts.params` set |
| .h leave guard | Any edited draft plus a close |

## What a new account lacks

A brand-new account has no agent, so Advanced cannot open until P0.1 creates one. The moment it exists, the agent already carries every value this flow shows: the v3 spec gives a default for each cascaded turn-taking, history and filler field, and `POST /agents` returns them (README "Agent (AgentInput)"). So the happy path needs no seeding: a just-created agent opens Advanced at spec defaults with no tick and no Reset.

What a new account cannot show and the fixtures must fake: a realtime pipeline (no preset is realtime), an API-made agent with fields the panel lacks, and a saved agent that already differs from the defaults.

API truth per field (checked against the snapshot):

| Field | In spec | Default | Range |
|---|---|---|---|
| `turn_detection.speech_threshold` | yes | 0.5 | above 0, below 1 |
| `start_of_speech` semantic `speaking_interrupt_duration_ms` | yes | 160 | none |
| `start_of_speech` vad `interrupt_duration_ms`, `speaking_interrupt_duration_ms`, `prefix_padding_ms` | yes | 160, 160, 800 | none |
| `end_of_speech` semantic `silence_duration_ms`, `max_wait_ms`, `pause_state_enabled` | yes | 320, 3000, true | 120 to 2000, 500 to 10000 |
| `end_of_speech` vad `silence_duration_ms` | yes | 640 | 120 to 2000 |
| `interruption.mode` | yes | `start_of_speech` | `keywords` needs 1 to 128 keywords; `off` has `when_off` append (default) or ignore |
| `silence_config` | yes | none; all four fields required when sent | none in spec |
| `filler_words.trigger.response_wait_ms` | yes | 1500 | 100 to 10000 |
| `filler_words.content` static `phrases` | yes | none | 1 to 100; `selection_rule` shuffle (default) or round_robin |
| `llm.max_history` | yes | 32 | 1 to 1024 |
| `llm.failure_message` | yes | none | belongs to the Greeting and failure message door (P0.4) |
| `asr.url`, `llm.url`, `tts.url`, `mllm.url` | yes | unset | uri |
| `llm.headers`, `tts.headers`, `mllm.headers` | yes, write-only | unset | |
| `tts.skip_patterns` | yes | unset | five bracket kinds |
| `tts.model` | no: `Tts` has credential, url, headers, vendor, params and skip_patterns only | | Studio writes the voice model to `tts.params.<vendor key>` (`model_id` for ElevenLabs and Cartesia, `model` otherwise, as the live Console does) and hides that key from the read-only params row |
| `avatar.enabled`, `avatar.vendor` | yes | false | akool, liveavatar, anam, generic |
| realtime `turn_detection` agora_vad, server_vad, semantic_vad | yes | none in spec | server_vad `threshold` and `idle_timeout_ms` are OpenAI Realtime only; sensitivities are Gemini Live only |
| `mllm.max_history`, `mllm.failure_message`, `mllm.tools`, realtime `silence_config`, realtime `asr`, realtime `tts` | no | | the realtime pipeline lacks them |
| `lifecycle` (idle timeout, max duration, graceful stop) | not on the agent | 30 s idle, 72 h max, graceful stop off | on `SessionCreate` and `POST /campaigns` only; the prototype shows it in the New run sheet's Session limits fold and in both code snippets, where the session line's doors land |
| an agent version for `agent_audio_heard.agentVersion` | no | | `Agent` carries `updated_at`; the prototype keeps it as `updatedAtIso` and logs that |

## Where it exists outside our accounts

- Grouped advanced panels: Retell's right rail accordions `shots/retell-agent-editor.png`, Vapi's Advanced tab `shots/vapi-assistant-advanced.png`, LiveKit's turn detection nav `shots/livekit-01-turns-overview-docs.png`.
- Range stated on the control: Vapi `shots/vapi-05-call-timeouts.png`, `shots/vapi-05-idle-messages.png`; bound in the label: ElevenLabs `shots/elevenlabs-05-agent-settings.png`.
- Default named on the option: Retell `shots/retell-03-background-noise.png`.
- Realtime hides cascaded settings with a stated reason: LiveKit `shots/livekit-03-realtime-interruption-ignored-docs.png`.
- Still not captured anywhere: a numeric out-of-range error, a reset to defaults, a realtime agent's settings panel in a product (research gaps 1 to 3). The prototype fakes these by URL; no research capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts`.

1. `ProtoAgent.advanced` reshaped to the API: `turn` (threshold, start, end, interruption), `silence`, `history`, `filler`, `skipPatterns`, `avatar`, plus per-module `url`, `headers` and API-only `style`, `params`, `modalities`. `ADVANCED_DEFAULTS` holds the spec defaults above; `newAgent` uses it, so every agent starts at spec defaults.
2. `pipelineMode: "cascaded" | "realtime"` on the agent and an `mllm` module slot. `MODULE_OPTIONS.mllm` gains OpenAI `gpt-realtime` and Google `Gemini Live 2.5`. `VENDORS` already has both.
3. `RANGES`, `validateAdvanced(draft)` and `groupDiffers(advanced, group)` so the range error, the tick and Reset read from one table.
4. Seeds:
   - `agent_survey` "Renewal survey" (batch, Lowest latency): untouched, every field at spec default. Journey start.
   - `agent_frontdesk` "Front desk" (inbound, Balanced): end of speech silence 480 ms, silence reminder on after 6000 ms, action speak, *"Are you still there?"* (.f).
   - `agent_payments` "Payment reminders" (batch, Lowest latency): filler words on after 1500 ms, phrases "One moment." and "Let me check that." (a Speak tick, and the batch case for .e).
   - `agent_api_custom` "Claims intake" (Custom, `studio_source: api`, no `studio_deployment`, so its session line has no door): `llm.style: "concise"`, `llm.params: {"temperature": 0.4}`, `tts.params: {"speed": 1.1}` (.g).
   - New `agent_realtime` "Harbor View concierge" (`studio_source: api`, `studio_deployment: code`, `studio_preset` absent): `pipelineMode: realtime`, `mllm` OpenAI `gpt-realtime`, turn detection `server_vad` with threshold 0.5, prefix padding 300 ms, silence 500 ms, reply after silence (server_vad idle_timeout_ms) 8000 ms; context has one MCP server "Bookings · mcp.hotel.example · 4 tools" and no function tool; voice and language unset (.d).
   - `agent_tutor` "In-app tutor" (code, from P0.1) is the code case of .e.
5. Review states by URL: `adv=edited` (silence 480, filler on), `adv=range` (silence 60), `adv=model` (language model Claude Sonnet 4.6), `adv=leave` (edited plus the guard open), `adv=reset` (Listen already reset in the draft), `adv=saved`, `adv=saved-test`, `adv=saved-heard` (the Test sheet running with the first answer heard); `row=<row id>` expands one row on open. None writes the store.
6. The New run sheet keeps every run's `lifecycle` (`Run.lifecycle`, spec defaults when the fold was never opened) and the code snippets print `lifecycle` at the defaults, so rainy .e has a place to land.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run, which captures the prototype):

- One console-made agent left at defaults; one saved with silence 480 ms and a reminder line; one made with `POST /agents` carrying `llm.style` and `llm.params`; one made with a `realtime` pipeline and an MCP server.
- Never sign in or enter credentials for this: the owner creates these in the staging account.
