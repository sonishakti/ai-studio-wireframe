# P0.2 Change the default voice · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.2]. The row has no `data` or `rule0` field yet, so the needs below are derived from the happy steps .a and the rainy paths .b to .h.

## What the flow shows

| Screen | Data it needs |
|---|---|
| Voice & models, Lowest latency | A saved agent on `studio_preset: lowest_latency` with its full pipeline (asr Deepgram Nova 3, llm Gemma 4 on SuperNode, tts Cartesia Sonic 3.5), vendor logos for Listen, Think, Speak |
| Voice dropdown | A bounded voice list (6 to 8) with name, language, one trait and a playable sample per voice |
| Balanced | The second preset's pipeline (Deepgram Nova 3, GPT-5.1 mini, Cartesia Sonic 3.5) and its logos |
| Custom | Per module vendor, model and language options, pre-filled from the current preset |
| Region line | The agent's region (US East) and the SuperNode name |
| .b preset down | A model outage or SuperNode capacity flag with a reason line |
| .d API pipeline | An agent created through the API whose pipeline matches no preset (for example Deepgram Nova 3, Claude Sonnet 4.6, ElevenLabs Flash v2.5) |
| .e sample fails | A sample URL that returns an error |
| .g language mismatch | An agent saved with language Spanish and an English only voice |
| .h price | A pricing page URL; no price field |

## What a new account lacks

A brand new account has none of this except the preset pipelines. It has no agent, no API made agent, no outage, and the API has **no region, price or SuperNode field** (PRD api: Missing). Preset identity lives only in `labels.studio_preset` (Partial). Voice sample URLs and vendor logos are not in the v3 spec.

## Where it exists outside our accounts

- Vendor logo strips and per module pickers: Vapi `competitors/product/vapi/vapi-assistant-model.png`, `vapi-03-transcriber-panel.png`, `vapi-06-voice-panel.png`.
- Voice list with sample play and language: Retell `retell-agent-voice-picker.png`, ElevenLabs `elevenlabs-voice-library.png`, `elevenlabs-03-language-additional.png`, LiveKit `livekit-voices.png`.
- Latency range copy: Retell `retell-agent-editor.png`.
- Still not captured anywhere (research brief): a failing sample, a voice that does not match the language, a disabled model, the LiveKit Models & Voice tab. The prototype fakes these states by URL; no research capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts`.

1. `TIERS` trimmed to two presets, **Lowest latency** and **Balanced**, plus a `custom` value; `Most capable` removed from concept A (other concepts keep compiling; `agent_tutor` moves to Custom with the old capable pipeline so it stays meaningful).
2. A `PIPELINES` table per preset: `{ asr: {vendor, model, language}, llm: {vendor, model}, tts: {vendor, voice} }` and a `VENDORS` table with a logo (local SVG monogram, no brand files fetched) per vendor.
3. `VOICES` grows to 8 with `sample` (a short local audio file, or a timer fake in design mode), `languages[]` and one `failing` voice for .e.
4. `region: "US East"` on every agent; `supernode: true` on Lowest latency.
5. New seed `agent_api_custom` "Claims intake", `labels: { studio_source: "api" }`, pipeline Deepgram Nova 3, Claude Sonnet 4.6, ElevenLabs Flash v2.5, no `studio_preset` (for .d).
6. `agent_frontdesk` gets `language: "es"` with voice Aria (English only) as the saved mismatch fixture (.g).
7. A `presetHealth` map, default healthy; `vm=down` marks Balanced's language model unavailable with a vendor reason (.b).
8. Journey start agent: `agent_survey` "Renewal survey", created in the console on Lowest latency with voice Aria, untouched.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run, which captures the prototype):

- One console made agent on the Lowest latency preset, one saved on Balanced, one made with `POST /agents` with a non preset pipeline.
- One agent saved with a Spanish language and an English voice.
- Never sign in or enter credentials for this: the owner creates these in the staging account.
