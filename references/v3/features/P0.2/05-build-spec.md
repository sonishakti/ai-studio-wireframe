# P0.2 Change the default voice · Build spec

Track: **v3**. Pick: **direction 1, preset cards with a logo strip, Custom as the third card**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.2): change the default voice`.

Scope rule: P0.2 only, the **Voice & models** row of concept A and its data. P0.1 is in review, not locked; its create sheet and header are not touched. Concepts B to E keep compiling.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=<id>&tab=agent&section=voice-models`, written below as `…&agent=<id>`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&agent=agent_survey` | Voice & models row: three cards, **Lowest latency** selected with its line and a Listen, Think, Speak logo strip (Deepgram, Gemma on SuperNode, Cartesia); Balanced and Custom unselected; voice Aria; region line "Runs in US East" | Sam opens Voice & models on the default preset |
| 2 | `…&agent=agent_survey&panel=voice` | Voice `Select` open, grouped by language, play button on each item, one playing (waveform icon) | Sam plays a sample and picks Marcus |
| 3 | `…&agent=agent_survey&preset=balanced` | Balanced selected; its strip swaps the language model to GPT-5.1 mini; line names the trade-off; no price anywhere | Sam picks Balanced for smarter answers |
| 4 | `…&agent=agent_survey&preset=custom` | Custom selected; three module rows appear under the cards, Listen, Think, Speak, each with vendor, model and language `Select`s pre-filled from Balanced | Sam opens Custom and changes the language model |
| 5 | `…&agent=agent_survey&preset=custom&save=done` | Row saved, toast "Voice and models saved.", region line and SuperNode note still visible on Lowest latency | Sam saves the agent |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&agent=agent_survey&vm=down` | Balanced card disabled, reason line "GPT-5.1 mini is unavailable right now. Your saved setup is unchanged." | Saved pipeline untouched; Sam stays on Lowest latency or uses Custom |
| .b saved preset down | `…&agent=agent_frontdesk&vm=down` | Balanced still selected (saved), disabled for new picks, same reason line, no data change | Agent keeps its saved pipeline; open question 2 |
| .c | `…&agent=agent_survey&preset=custom&vm=custom-dirty&panel=discard-custom` | `AlertDialog` "Discard your Custom setup?" with **Discard** and **Keep editing** | Keep editing returns to Custom with values; Discard selects the preset |
| .d | `…&agent=agent_api_custom` | Opens with Custom selected and its own values (Deepgram Nova 3, Claude Sonnet 4.6, ElevenLabs Flash v2.5); one muted line "Set through the API. It matches no preset." | Sam can keep it or pick a preset (confirm as .c) |
| .e | `…&agent=agent_survey&panel=voice&vm=sample-error` | Voice item shows "Sample did not play" and a **Retry** icon button inline | Retry plays again; picking the voice still works and saves |
| .f | `…&agent=agent_survey&vm=far` | On Lowest latency a muted note "Calls from far outside US East add network delay." | No region picker; note only |
| .g list | `…&agent=agent_frontdesk&panel=voice` | Voice list shows only voices that speak Spanish; a footer line "Showing voices for Spanish." | Sam picks a matching voice |
| .g saved | `…&agent=agent_frontdesk` | Voice row line "Aria does not speak Spanish. Pick a Spanish voice." with the destructive text tone, no banner | Sam opens the list and picks Sofia |
| .h | `…&agent=agent_survey` (always) | Row footer link "See pricing" (opens in a new tab, `external_link_opened {surface: pricing}`); no price slot rendered (flag off) | Price slot shows only behind the pricing flag |

New search keys, validated in `store.tsx`: `preset` (`lowest_latency` \| `balanced` \| `custom`, review only), `vm` (`down` \| `custom-dirty` \| `sample-error` \| `far`), `save` (`done`). `panel` gains `voice` and `discard-custom`.

## 2. Data

- `TierId` becomes `PresetId = "lowest_latency" | "balanced" | "custom"`; ids match `labels.studio_preset`. `TIERS` renamed `PRESETS`, `Most capable` removed; `agent_tutor` becomes Custom with its old pipeline.
- `PIPELINES[preset] = { asr, llm, tts }` with vendor, model, language; Custom holds its own `pipeline` on the agent.
- `VOICES` 8 items with `languages[]`, `trait`, `sample`. `agent.language` added (default `en`).
- Seeds per `00-data.md`: `agent_api_custom`, `agent_frontdesk` Spanish with Aria.
- Save writes `PATCH /agents/{id}` with the full pipeline and `labels.studio_preset`; no region, price or SuperNode field is sent (API Missing).

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Row | `AgentBuilderRow id="voice-models"` | `src/components/console/agent-builder/agent-builder-row.tsx` |
| Preset cards | `TierCards` renamed `PresetCards` on `RadioGroup`; `Meter` removed | `src/prototypes/agent-builder-v3/parts/model.tsx`, `src/components/ui/radio-group.tsx` |
| Logo strip | three small monogram `Avatar`s with labels Listen, Think, Speak | `src/components/ui/avatar.tsx` |
| Custom module rows | `Field` + `Select` per module, inside the same row | `src/components/ui/field.tsx`, `select.tsx` |
| Voice | `VoiceSelect` with a ghost icon `Button` (play, retry) per item | `parts/model.tsx`, `src/components/ui/button.tsx` |
| Disabled reason, API line, far note | `FieldDescription` muted text | `src/components/ui/field.tsx` |
| Discard confirm | `AlertDialog` | `src/components/ui/alert-dialog.tsx` |
| Details of a stack | `InfoTip` | `parts/common.tsx` |
| Saved | `sonner` toast | `src/components/ui/sonner.tsx` |

No new token, component, radius or font size. Cards stay flat; the selected card uses `border-foreground/60 bg-muted/30` as in P0.1.

## 4. Behaviour

- Changing preset or voice marks the agent dirty; the builder's existing Save commits it. Fires `preset_changed {from, to}` on each pick.
- Custom opens pre-filled from the preset selected before it; fires `manual_config_opened` once per open. Opening a module `Select` fires `model_slot_sheet_opened {slot}`; a change fires `model_slot_configured {slot}`; closing unchanged fires `model_slot_abandoned {slot}`.
- Leaving Custom for a preset asks (.c) only when a Custom value differs from its pre-fill.
- Voice play: one sample at a time; opening another stops the first; `voice_previewed {voice, ok}`; picking fires `voice_selected`.
- The voice list is filtered by `agent.language`; mismatch check runs on load.
- Keyboard: cards are one tab stop with arrows; play buttons reachable inside the list without closing it.

## 5. Copy

Sentence case, no arrows, no em dashes, no price.

| Key | Text |
|---|---|
| Row label | Voice & models |
| Lowest latency line | Replies fastest. Runs on SuperNode. Best for short, scripted calls. |
| Balanced line | Smarter answers, a beat slower. |
| Custom line | Pick the vendor and model for each part. |
| Strip labels | Listen / Think / Speak |
| Module labels | Speech recognition / Language model / Voice |
| Region line | Runs in US East. |
| Far note | Calls from far outside US East add network delay. |
| Preset down | {model} is unavailable right now. Your saved setup is unchanged. |
| API agent line | Set through the API. It matches no preset. |
| Discard title | Discard your Custom setup? |
| Discard body | Switching to {preset} replaces the models you picked in Custom. |
| Discard buttons | Discard / Keep editing |
| Voice label | Voice |
| Sample error | Sample did not play. |
| Retry | Retry |
| Language filter line | Showing voices for {language}. |
| Mismatch line | {voice} does not speak {language}. Pick a {language} voice. |
| Pricing link | See pricing |
| Toast | Voice and models saved. |

Never: tier, plan, cost, price figures, SDK, publish, deploy (verb), template.

## 6. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, locked word grep (tier, price), no P0.1 route changed. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png`.
