# P0.3 Make the conversation feel natural · Build spec

Track: **v3**. Pick: **direction 1, one sheet, three groups (the port)**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, start at commit `87f05b3f`, route `/v3?concept=a` in design mode. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.3): tune turn-taking, silence and filler words in Advanced`.

Scope rule: P0.3 only, the **Advanced settings** sheet of concept A and its data. Touches outside the sheet, each the smallest honest change (declare under `touches_locked`): the Advanced door moves into the Voice & models footer (P0.2 row, in review) and hides while that row has an unsaved draft; Voice & models gets one realtime state; concept A's lone "Advanced settings" row under Analysis is removed; Knowledge and tools hides **Function tool** from Add on a realtime agent and says why; the test panel fires `agent_audio_heard` and drops the word call, and inside the header's Test sheet it has one close (the sheet's X); the New run sheet (P0.1) gains a collapsed **Session limits** fold and the code snippet carries `lifecycle`, so the session line lands somewhere; landing on the first builder row keeps the header in view. Concepts B to E keep compiling: `AdvancedSheet` keeps its props `{agent, open, onOpenChange, onChange}` and they receive the new sheet.

Review round 1 (26 Sep): the sheet title is the verb **Tune the agent** (door and toast keep "Advanced settings"); labels with the ms addon drop "(ms)"; the silence_config row is **Silence reminder**; the tick means configured (a model away from the preset, or tuning away from the defaults) while Reset covers tuning only; the session door follows `labels.studio_deployment`, never the fallback `type`.

Review round 2 (26 Sep): `lifecycle.idle_timeout_ms` counts from the moment the last remote user leaves, never silence (the inbound line and the New run tooltip say so); the realtime `server_vad.idle_timeout_ms` is **Reply after silence**, so only the session keeps the words Idle timeout; a realtime agent's prompt door is **Greeting** with no failure field; `saved-heard` plays the turn that carries the change; `adv=model-saved` shows Custom after the save; the session door opens New run on its Session limits fold (`fold=limits`); the code snippet sends `agent_id`; "the person" replaces "the caller" in the sheet; the guard orders Keep editing, Discard, Save like P0.2's; the realtime seed is **Harbor View concierge** and lists "Realtime voice"; the (i) on a field label opens to the right and the Reset tooltip below; captures blur the focus first.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=<id>&tab=agent&section=voice-models`, written below as `…&agent=<id>`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&agent=agent_survey` | Voice & models on Lowest latency; the footer line "Runs in US East. See pricing" now ends with a ghost **Advanced settings** button on the right (the lone row under Analysis is gone) | Sam opens Voice & models and finds Advanced settings |
| 2 | `…&agent=agent_survey&panel=advanced` | Sheet **Tune the agent**: groups Listen, Think, Speak; every row collapsed with its value line; all values at spec defaults; no tick, no Reset; footer Cancel · Save · Save and test, both saves off | Sam opens Advanced settings and reads the defaults |
| 3 | `…&agent=agent_survey&panel=advanced&row=end-of-speech` (capture with the "About Silence" (i) focused) | End of speech expanded: Type Semantic, Silence 320 ms, Max wait 3000 ms, Pause state on; the (i) on Silence open reads "Default 320 ms, 120 to 2000. Quiet time that ends a turn." | Sam opens End of speech and reads the default on the (i) |
| 4 | `…&agent=agent_survey&panel=advanced&adv=edited&row=end-of-speech` | Silence reads 480; Listen header carries the gray tick and **Reset**; Save and Save and test on | Sam raises Silence to 480 ms |
| 4b | `…&agent=agent_survey&adv=saved` | Sheet closed after Save, toast "Advanced settings saved.", Voice & models still on Lowest latency with no Cancel or Save in its footer | Sam saves and the agent stays on Lowest latency |
| 5 | `…&agent=agent_survey&panel=advanced&adv=edited&row=filler-words` | Filler words on: After 1500 ms, Source Phrases, two phrases in the textarea, Order Shuffle; Speak header ticked with Reset | Sam turns on filler words and adds two phrases |
| 6 | `…&agent=agent_survey&adv=saved-heard` | Sheet closed, toast "Advanced settings saved.", the Test sheet open on the right already running: "Aria · 0:0x", then the turn that carries the change, each line in italics and quotes: the person *"Yes, this is Sam."*, the new filler *"One moment."*, the answer *"Thanks, Sam. First question: how has your energy supply been this year?"*; **End test**; `agent_audio_heard {agentVersion: updated_at}` logged. An agent with no greeting never invents an opening line: outside this review state it waits for the person to speak | Sam presses Save and test and hears the change |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&agent=agent_survey&panel=advanced&adv=range&row=end-of-speech` | Silence reads 60; `FieldError` "Enter 120 to 2000 ms."; Save and Save and test off | The error clears on the next value in range; Cancel drops it |
| .c | `…&agent=agent_survey&panel=advanced&adv=model&row=llm` | Language model expanded; the model select reads Anthropic Claude Sonnet 4.6; one line under the selects "This makes the agent Custom. Presets pick the models for you.". 08b, `…&agent=agent_survey&adv=model-saved`: the sheet closed after Save, toast "Advanced settings saved.", Voice & models on **Custom** with its module rows (the one review state that writes the store, so the row can read the saved agent) | Picking the preset's model back removes the line and keeps the preset |
| .d | `…&agent=agent_realtime&panel=advanced&row=turn-detection` | Listen: one line "A realtime model hears speech itself, so speech recognition, interruptions and the silence reminder have no settings here." then **Turn detection** expanded (Server VAD; Threshold and **Reply after silence** labelled "OpenAI Realtime only", Prefix padding, Silence; Reply after silence is `server_vad.idle_timeout_ms`, the model's own nudge, never the session's idle timeout). Think: **Realtime model** OpenAI gpt-realtime, then "History and the failure message are not on a realtime model." Speak: "The realtime model speaks with its own voice." then **Avatar** and **Filler words**. 09b, `…&agent=agent_realtime&section=context` with Add open: Knowledge and tools lists the MCP server, Add offers MCP server only, and the line under the list reads "A realtime model calls MCP servers only. Tools need a cascaded pipeline."; the prompt row's door reads **Greeting** and its sheet has no Failure message field, one line "A realtime model has no failure message." (the v3 Mllm has none) | Nothing to fix; Sam tunes the model's own detection |
| .e | `…&agent=agent_payments&panel=advanced&row=session` | Last line of the sheet: "Idle timeout, maximum duration and graceful stop belong to the session, not the agent." then, by `labels.studio_deployment`: batch **Set them in New run** (10b: the link lands on the New run sheet, `tab=deploy&panel=new-run&fold=limits`, with its **Session limits** fold already expanded and scrolled into view: Idle timeout 30 s, Maximum duration 72 h, Graceful stop off on its own row); code (`agent_tutor`, 10c) **Set them in the code snippet** (10d: lands on the Code tab, whose curl bodies carry `lifecycle`); inbound (`agent_frontdesk`, 10e) "Inbound sessions use the session defaults: they end 30 s after the caller leaves, and after 72 h at most. The API has no per-number setting yet."; an API agent with no type (`agent_api_custom`, 10f) "Set them per session in the API." with no door | The link closes the sheet and opens the Runs tab with New run on Session limits, or the Code tab |
| .f | `…&agent=agent_frontdesk&panel=advanced` | Listen ticked with **Reset** (Front desk saved silence 480 ms and a reminder). 11b, `…&agent=agent_frontdesk&panel=advanced&adv=reset`: after Reset the draft reads Silence 320 ms and Silence reminder Off, the tick and Reset are gone, Save is on | Cancel restores the saved values |
| .g | `…&agent=agent_api_custom&panel=advanced&row=llm` | Language model expanded shows two read-only rows under the selects: `style` concise, `params` `{"temperature": 0.4}` in a `CodeBlock`, one line "Set through the API. Saving keeps it."; Voice shows `params` `{"speed": 1.1}` the same way, without the vendor's model key (section 4, Speak) | Nothing to fix; save sends only edited fields |
| .h | `…&agent=agent_survey&panel=advanced&adv=leave` | `AlertDialog` "Save your changes?" body "Advanced settings has unsaved changes." buttons **Keep editing** · **Discard** · **Save** (Keep editing first, as in P0.2's guard) | Save closes with the toast; Discard closes and drops the draft; Keep editing returns to the sheet |

New search keys, validated in `store.tsx`: `panel` gains `advanced`; `row` (`asr` \| `start-of-speech` \| `end-of-speech` \| `interruptions` \| `silence` \| `llm` \| `history` \| `tts` \| `skip-patterns` \| `filler-words` \| `avatar` \| `turn-detection` \| `session`, expands that row on open and scrolls it to the top, the port of the live `anchor`); `adv` (`edited` \| `range` \| `model` \| `leave` \| `reset` \| `saved` \| `saved-test` \| `saved-heard` \| `model-saved`, review only; `reset` opens the draft with Listen already reset, `saved-heard` opens the Test sheet with the changed turn heard, `model-saved` is the one state that writes the store: the Anthropic model saved, preset Custom, so Voice & models shows the result); `fold` (`limits`, with `panel=new-run`: the New run sheet opens on its Session limits fold, the session door's target). In concept A `panel=new-run` holds the run sheet open (`useDeployActions` derives `open` from the URL, so the sheet outlives the route re-render the link causes, which reset a state-held sheet in review round 2); closing the sheet clears `panel` and `fold`. `openAgent`, `toList` and closing a panel clear `row`, `adv` and `fold`.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`).

- `ProtoAgent.pipelineMode: "cascaded" | "realtime"` (default cascaded) and `mllm?: { vendor: string; model: string }`. `ModuleSlot` gains `"mllm"`; `MODULE_OPTIONS.mllm = [{ vendor: "openai", models: ["gpt-realtime"] }, { vendor: "google", models: ["Gemini Live 2.5"] }]`. `matchPreset` returns `custom` for any realtime pipeline.
- `ProtoAgent.advanced` reshaped to the API (old `turnEnd`, `interruption`, `silenceReminder`, `fillerWords` removed; concepts B to E read through the new sheet):

```ts
type Advanced = {
  turn: {
    speechThreshold: number                       // 0.5, above 0 below 1
    start:
      | { type: "semantic"; speakingInterruptMs: number }              // 160
      | { type: "vad"; interruptMs: number; speakingInterruptMs: number; prefixPaddingMs: number } // 160, 160, 800
      | { type: "manual" }
    end:
      | { type: "semantic"; silenceMs: number; maxWaitMs: number; pauseState: boolean } // 320, 3000, true
      | { type: "vad"; silenceMs: number }                              // 640
      | { type: "manual" }
    interruption:
      | { mode: "start_of_speech" }
      | { mode: "keywords"; keywords: string[] }                        // 1 to 128
      | { mode: "off"; whenOff: "append" | "ignore" }                   // append
  }
  silence: { enabled: boolean; timeoutMs: number; action: "speak" | "think"; content: string } // off; Studio 6000 when turned on
  history: number                                                       // 32, 1 to 1024
  skipPatterns: SkipPattern[]                                           // []
  filler: {
    enable: boolean; responseWaitMs: number                              // off; 1500, 100 to 10000
    content:
      | { mode: "static"; phrases: string[]; selectionRule: "shuffle" | "round_robin" } // 1 to 100; shuffle
      | { mode: "generated"; instructions: string }
  }
  avatar: { enabled: boolean; vendor?: "akool" | "liveavatar" | "anam" | "generic" } // off
  modules: Partial<Record<ModuleSlot, { url?: string; headers?: Record<string, string>; api?: Record<string, unknown> }>>
  realtimeTurn?:
    | { type: "server_vad"; threshold?: number; prefixPaddingMs?: number; silenceMs?: number; idleTimeoutMs?: number; startSensitivity?: "high" | "low"; endSensitivity?: "high" | "low" }
    | { type: "semantic_vad"; eagerness: "auto" | "low" | "medium" | "high" }
    | { type: "agora_vad"; interruptMs?: number; prefixPaddingMs?: number; silenceMs?: number; threshold?: number }
}
```

- `modules[slot].api` holds fields the panel lacks, keyed by API name (`style`, `params`, `input_modalities`, `output_modalities`); rendered read-only, never edited, never dropped.
- `ADVANCED_DEFAULTS: Advanced` with the spec values above; `newAgent` uses it. `REALTIME_TURN_DEFAULTS(vendor, type)` ports the live `MLLM_MODE_DEFAULTS` and `getMllmModeDefaults` from `src/components/console/agent-advanced-page.tsx` (server_vad 800, 640, 0.5; agora_vad 160, 800, 640, 0.5; semantic_vad auto; Gemini sensitivities high). Realtime modes offered per vendor as the live code does: OpenAI all three, Google server_vad and agora_vad, others server_vad.
- `RANGES` table, one entry per bounded field (`speechThreshold` open 0 to 1; `end.silenceMs` 120 to 2000; `end.maxWaitMs` 500 to 10000; `history` 1 to 1024; `filler.responseWaitMs` 100 to 10000; `keywords` 1 to 128 lines; `phrases` 1 to 100 lines; `silence.timeoutMs` 1 to 60000 marked `studio: true`; realtime ms fields at least 0; realtime `threshold` 0 to 1). `validateAdvanced(draft): Record<fieldId, string>` returns the error copy from section 5.
- `ADVANCED_GROUPS = ["listen", "think", "speak"]` and `groupFields(group, mode)`; `groupDiffers(advanced, group, mode)` compares tuning fields only (turn, silence, history, skip patterns, filler, avatar, realtime turn), never models, endpoints, headers, keys or `api`; `resetGroup(advanced, group, mode)` returns those fields to `ADVANCED_DEFAULTS`.
- `advancedPatch(saved, draft)` returns only the fields that differ, mapped to API paths (`pipeline.turn_detection`, `pipeline.silence_config`, `pipeline.llm.max_history`, `filler_words`, `pipeline.tts.skip_patterns`, `pipeline.avatar`, `pipeline.<slot>.url` and `.headers`, realtime `pipeline.turn_detection`); a cleared endpoint or header set is sent as `null` (the PATCH is a JSON merge patch and `url` is format uri, so `""` would be refused). `advancedFieldPath(field)` maps a draft field to its API path for `advanced_setting_changed.field`. The `…` header menu's **View labels** `CodeBlock` gains a **View last save** entry showing that PATCH body so a reviewer can see nothing else was sent.
- The v3 `Tts` has no `model` (credential, url, headers, vendor, params, skip_patterns only). Studio keeps the voice model in `tts.params` under the vendor's key, `ttsModelKey(vendor)` (`model_id` for ElevenLabs and Cartesia, `model` otherwise, as the live Console writes it), and the read-only params row hides that key so the Voice select and the params never disagree.
- Session limits: `SessionLifecycle` and `SESSION_LIFECYCLE_DEFAULTS` (30 s idle, 72 h maximum, graceful stop off) with `apiLifecycle()`; `Run.lifecycle` holds what a New run sent. Never on the agent.
- `ProtoAgent.updatedAtIso` is the API's `updated_at`; `updateAgent` refreshes it on every save and `agent_audio_heard.agentVersion` carries it.
- Seeds per `00-data.md`: `agent_survey` untouched; `agent_frontdesk` end silence 480 ms and silence reminder on (6000 ms, speak, *"Are you still there?"*); `agent_payments` filler on (1500 ms, "One moment.", "Let me check that."); `agent_api_custom` `modules.llm.api = { style: "concise", params: { temperature: 0.4 } }`, `modules.tts.api = { params: { speed: 1.1 } }`, no `studio_deployment` (the untyped session line); new `agent_realtime` "Harbor View concierge" (not "Concierge", the shell's own button; code, `labels: { studio_source: "api", studio_deployment: "code" }`, `pipelineMode: realtime`, `mllm: { vendor: "openai", model: "gpt-realtime" }`, `realtimeTurn: { type: "server_vad", threshold: 0.5, prefixPaddingMs: 300, silenceMs: 500, idleTimeoutMs: 8000 }`, context one MCP server "Bookings", prompt set, `voiceId` and `language` empty strings).
- Tests: defaults equal the spec table; `validateAdvanced` flags 60 and passes 480 for `end.silenceMs`; `groupDiffers` is false on `agent_survey` and true for Listen on `agent_frontdesk`; `resetGroup("listen")` leaves `modules` untouched; `advancedPatch` of an untouched draft is `{}` and never contains `api` fields; `agent_realtime` matches no preset and `groupFields("listen", "realtime")` is only `realtimeTurn`.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Sheet | `FormSheet` (standard) with `FormSheetSection` per group | `src/components/console/form-sheet.tsx` |
| Row fold | `AdvancedRow` ported one to one (chevron `Button size="icon-xs"`, title button, `Switch size="sm"` when the API has a boolean, `Separator` above) into `src/prototypes/agent-builder-v3/parts/advanced.tsx` | port of `src/components/console/agent-config-drawer.tsx` `AdvancedRow` |
| Value line | the row's description slot, filled with the current value (never helper text) | same |
| Group tick | `Tick` (gray, `AgentBuilderTickGlyph`) in the section's action slot | `parts/common.tsx`, `src/components/console/agent-builder/agent-builder-tick.tsx` |
| Reset | `Button variant="ghost" size="xs"` in the same action slot, shown only when `groupDiffers` | `src/components/ui/button.tsx` |
| Label with default | `Field`, `FieldLabel` + `InfoTip` | `src/components/ui/field.tsx`, `parts/common.tsx` |
| Numbers | `InputGroup` with `Input type="number"` and a trailing unit addon (ms) carrying `min`, `max`, `step` | `src/components/ui/input-group.tsx`, `input.tsx` |
| Range error | `FieldError` | `src/components/ui/field.tsx` |
| Type and mode | `Select` | `src/components/ui/select.tsx` |
| Keywords, phrases, silence line, headers | `Textarea` (one entry per line) | `src/components/ui/textarea.tsx` |
| Skip patterns | `Checkbox` list | `src/components/ui/checkbox.tsx` |
| Model row selects | `ModuleSelects`, exported from `parts/voice-models.tsx` (today's `CustomModules` body), rendered in Custom and in the sheet | `src/prototypes/agent-builder-v3/parts/voice-models.tsx` |
| Key | existing `ProviderKeyControl` next to the module's selects | `parts/model.tsx` |
| Read-only API field | `CodeBlock` with the field name as its label | `src/components/ui/code-block.tsx` |
| Session line, reason lines, Custom line | `FieldDescription` muted text with an inline link `Button variant="link"` | `src/components/ui/field.tsx`, `button.tsx` |
| Leave guard | `AlertDialog` | `src/components/ui/alert-dialog.tsx` |
| Saved | `sonner` toast | `src/components/ui/sonner.tsx` |
| Door | `Button variant="ghost" size="sm"` with `SlidersHorizontal` in the Voice & models footer | P0.2 row |

No new token, component, radius or font size. No slider (the Console ships none). No icon per row.

## 4. The sheet, row by row

Order inside every group is fixed. A collapsed row shows its value line; `row=` expands one. Each label has an (i) whose text is "Default X, A to B. One line of meaning."; the value is pre-filled.

### Listen (cascaded)

| Row | Fields (API path) | Default | Range | Control |
|---|---|---|---|---|
| Speech recognition | vendor, model (`asr.vendor`, `asr.model`); key (`asr.credential`); Endpoint (`asr.url`) | preset's; managed; empty | uri | `ModuleSelects`, `ProviderKeyControl`, `Input` |
| Start of speech | Type (`start_of_speech.type`): Semantic, Voice activity, Manual; Threshold (`turn_detection.speech_threshold`); Speaking interrupt (`speaking_interrupt_duration_ms`); Voice activity adds Interrupt (`interrupt_duration_ms`) and Prefix padding (`prefix_padding_ms`); Manual shows one line | semantic; 0.5; 160; 160; 800 | threshold above 0 below 1 | `Select`, numbers |
| End of speech | Type (`end_of_speech.type`); Silence (`silence_duration_ms`); Semantic adds Max wait (`max_wait_ms`) and Pause state (`pause_state_enabled`) | semantic; 320 (640 for voice activity); 3000; on | 120 to 2000; 500 to 10000 | `Select`, numbers, `Switch` |
| Interruptions | Mode (`interruption.mode`): When the caller speaks, On keywords, Never; Keywords (`keywords`); Never adds "Speech while the agent talks" (`when_off`): Answer it next, Ignore it | start_of_speech; none; append | 1 to 128 lines | `Select`, `Textarea`, `Select` |
| Silence reminder | row switch (`silence_config.enabled`); After (`timeout_ms`); Then (`action`): Say a line, Send a prompt; Line or Prompt (`content`) | off; 6000 when turned on (Studio); speak; empty, required | 1 to 60000 (Studio) | `Switch`, number, `Select`, `Textarea` |

### Think (cascaded)

| Row | Fields | Default | Range | Control |
|---|---|---|---|---|
| Language model | vendor, model; key; Endpoint (`llm.url`); Headers (`llm.headers`, write-only: a `Textarea` "Name: value" per line; once saved the row reads "2 headers set" with **Replace**); read-only rows for `style`, `params`, `input_modalities`, `output_modalities` when present | preset's | | `ModuleSelects`, `Input`, `Textarea`, `CodeBlock` |
| History | Messages kept (`llm.max_history`) | 32 | 1 to 1024 | number |
| footer line | "What the agent says when the model fails is set in **Greeting and failure message**." The link closes the sheet and opens that sheet (P0.4 gives it `panel=greeting`; until then it sets the prompt row's local state). On a realtime agent the prompt row's door and sheet are **Greeting** only: no Failure message field, one line "A realtime model has no failure message.", and `failureMessage` is never written | | | `FieldDescription` |

### Speak (cascaded)

| Row | Fields | Default | Range | Control |
|---|---|---|---|---|
| Voice | vendor, model (`tts`; the API has no `tts.model`, the model is `tts.params.<ttsModelKey>`); key; Endpoint (`tts.url`); Headers (`tts.headers`); read-only `params` without the model key | preset's | | as Language model |
| Skip patterns | `tts.skip_patterns`: (parentheses), [square brackets], {curly braces}, （fullwidth parentheses）, 【lenticular brackets】 | none | | `Checkbox` list |
| Filler words | row switch (`filler_words.enable`); After (`trigger.response_wait_ms`); Source (`content.mode`): Phrases, Generated; Phrases (`phrases`) with Order (`selection_rule`): Shuffle, In order; Generated shows Instructions | off; 1500; static; none, required; shuffle | 100 to 10000; 1 to 100 lines | `Switch`, number, `Select`, `Textarea`, `Select` |
| Avatar | row switch (`avatar.enabled`); Vendor (`avatar.vendor`); key (`avatar.credential`); read-only `params` | off; none | | `Switch`, `Select`, `ProviderKeyControl` |

Voice and language themselves stay in Voice & models (P0.2); the Voice row here is the model behind them.

### Realtime (`pipelineMode: realtime`)

| Group | Content |
|---|---|
| Listen | Reason line, then **Turn detection**: Type (`turn_detection.type`) Server VAD, Semantic VAD, Agora VAD as the vendor allows. Server VAD: Threshold (OpenAI Realtime only), Prefix padding, Silence, Reply after silence (OpenAI Realtime only; `server_vad.idle_timeout_ms`, the model speaking up after silence, never the session's idle timeout), Start and End sensitivity High or Low (Gemini Live only; shown only for Google). Semantic VAD: Eagerness Auto, Low, Medium, High. Agora VAD: Interrupt, Prefix padding, Silence, Threshold. The (i) on every realtime number says "The API has no default. Studio suggests X." |
| Think | **Realtime model** (`mllm` vendor, model; key; Endpoint; Headers; read-only `params`, modalities), then the reason line. No History |
| Speak | Reason line, then **Avatar** and **Filler words** (open question 3) |

Session line and footer as cascaded. Interruptions are on the model (LiveKit: disabling them is a hard error), so no Interruptions row and no way to turn them off.

### Session line

Always the last line of the sheet body. The door follows `hasDeploymentType(agent) ? agent.type : null`, the same read the page banner makes, never the fallback `type`: batch **Set them in New run** (closes the sheet, `tab=deploy&panel=new-run&fold=limits`, the P0.1 run sheet opened on its **Session limits** fold, expanded and scrolled into view: Idle timeout, Maximum duration, then Graceful stop on its own row, sent as the run's `lifecycle`); code **Set them in the code snippet** (`tab=deploy`, whose curl bodies carry `lifecycle` at the spec defaults); inbound one sentence, no link; an API agent with no type one sentence, no door.

## 5. Behaviour

- **Door.** `Advanced settings` in the Voice & models footer opens the sheet (`panel=advanced`, `replace`). Fires `advanced_panel_opened {pipeline, from: "voice-models"}`. Focus returns to the door on close (port of `returnFocusRef`). The door hides while Voice & models has an unsaved draft (its Cancel · Save footer showing), so one draft of the models exists at a time.
- **Draft.** The sheet holds a copy of `agent.advanced`, `pipeline`, `mllm` and `keys`; nothing writes the store until Save. Cancel restores the saved values and closes. A store change while open replaces the draft (P0.2 pattern).
- **Value lines.** Each collapsed row prints its current draft value (section 6). Rows open with `row=`; the chevron and the title toggle; a row switch turns the feature on and opens the row.
- **Tick and Reset.** They are separate. The gray tick means configured, the locked meaning: the group's model differs from the saved preset (`groupModelDiffers`, read against `baseline.preset`; a Custom or realtime agent has no preset to differ from) or its tuning differs from the defaults (`groupDiffers`). **Reset** shows only when `groupDiffers` is true, applies `resetGroup` to the draft, fires `advanced_group_reset {group}`, and its tooltip names what that group's Reset covers. Models, endpoints, headers and keys never reset.
- **Ranges.** Validate on blur and on Save; `FieldError` under the field, `aria-invalid` on the input, the value kept as typed. Any error keeps Save and Save and test off; the row stays open while it has an error. Whole-number fields round nothing: 480.5 is an error "Enter a whole number of ms."
- **Type switches.** Changing Start or End type swaps in that type's defaults (semantic 320, voice activity 640) as the live `setDetectionMode` does; Manual shows the line "Your software sends the turn events." and no numbers. Turning Silence or Filler words on pre-fills their defaults (Silence 6000 ms, Studio); turning off keeps the values in the draft so turning back on restores them, and saves `enabled: false`.
- **Model change (.c).** `ModuleSelects` inside the sheet behaves exactly as in Custom: fires `model_slot_sheet_opened`, `model_slot_configured {slot, surface: "advanced"}` or `model_slot_abandoned`. When the draft pipeline stops matching the saved preset, `preset` becomes `custom`, the line shows, and `preset_changed {from, to: "custom", surface: "advanced"}` fires once; matching a preset again restores it and fires `preset_changed` back. Save writes `labels.studio_preset` with the pipeline, the same patch P0.2 writes.
- **Realtime (.d).** `pipelineMode === "realtime"` picks the realtime rows; the Type select offers only the vendor's modes. Voice & models for this agent: Custom card selected, the module box shows one row "Realtime model · OpenAI · gpt-realtime" with P0.2's line "Set through the API. It matches no preset.", Language and Voice are hidden with one sentence "A realtime model listens and speaks on its own. Set its voice and language through the API." Picking a preset writes a cascaded pipeline after P0.2's discard dialog. Knowledge and tools: Add offers MCP server only; existing items unchanged.
- **API-only rows (.g).** Any key in `modules[slot].api` renders a read-only `CodeBlock` row under that module's selects with the line once per module. `advancedPatch` never includes them. Realtime `mllm.params` the same.
- **Save.** Validates, writes `advancedPatch` through `update`, fires `advanced_setting_changed {group, field, from, to}` per changed field (never on edit; `field` is the API path from `advancedFieldPath`, such as `pipeline.turn_detection.end_of_speech.silence_duration_ms`), `operation_succeeded {operation: agent_update}`, `agent_updated {surface: "advanced"}`, toast, closes. `View last save` shows the body.
- **Save and test.** Save, then opens the Test sheet (`setTestOpen(true)` in `AgentA`); the sheet has one close, its own X, and the panel inside carries no Close. **Start test** plays the greeting or a first answer after two seconds in design mode and fires `agent_audio_heard {surface: "test_panel", agentVersion: updatedAtIso}` once per test. Labels "Start test" and "End test" (call is a never word).
- **Realtime tools.** Knowledge and tools on a realtime agent offers MCP server only and prints the reason under the list: "A realtime model calls MCP servers only. Tools need a cascaded pipeline."
- **Leave guard (.h).** Close (X, Esc, overlay, or a link in the sheet) with a dirty draft opens the `AlertDialog`, buttons in the order Keep editing (outline, first as in P0.2's guard), Discard (outline), Save (primary); Keep editing returns; Discard drops the draft and continues the close; Save runs Save then continues. A draft with a range error offers Keep editing and Discard only (Save off).
- **Keyboard.** Tab order: group Reset, row chevron, row title, row switch, then the open row's fields; Enter on a title toggles; Esc closes (or opens the guard). `row=` moves focus to that row's chevron.
- **Events per action.** `advanced_panel_opened`, `advanced_setting_changed`, `advanced_group_reset`, `model_slot_configured`, `preset_changed`, `agent_audio_heard`, `operation_succeeded`, `agent_updated`; each logs once through `trackProto` (`parts/events.ts` gains the four new names and `test_started` is not added).

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: call, conversation, chat, tier, template, plan, SDK, VAD or MLLM as a label (they appear only as option names and API paths).

| Key | Text |
|---|---|
| Door | Advanced settings |
| Sheet title | Tune the agent |
| Groups | Listen / Think / Speak |
| Reset | Reset |
| Reset tooltip, Listen | Returns turn-taking and silence to the defaults. Models, endpoints and keys stay. |
| Reset tooltip, Think | Returns History to 32 messages. Models, endpoints and keys stay. |
| Reset tooltip, Speak | Returns skip patterns, filler words and avatar to the defaults. Models, endpoints and keys stay. |
| Footer | Cancel / Save / Save and test |
| Toast | Advanced settings saved. |
| Row, Speech recognition | Speech recognition |
| Row, Start of speech | Start of speech |
| Row, End of speech | End of speech |
| Row, Interruptions | Interruptions |
| Row, Silence reminder | Silence reminder |
| Row, Language model | Language model |
| Row, History | History |
| Row, Voice | Voice |
| Row, Skip patterns | Skip patterns |
| Row, Filler words | Filler words |
| Row, Avatar | Avatar |
| Row, Turn detection (realtime) | Turn detection |
| Row, Realtime model | Realtime model |
| Value line, model rows | {Vendor} {model} · Managed by Agora / · Your key |
| Value line, Start of speech | {Type} · threshold {n} |
| Value line, End of speech | {Type} · {n} ms silence |
| Value line, Interruptions | When the person speaks / On {n} keywords / Never |
| Value line, Silence reminder | Off / After {n} s, says a line / After {n} s, sends a prompt |
| Value line, History | {n} messages |
| Value line, Skip patterns | None / {n} kinds skipped |
| Value line, Filler words | Off / On · after {n} ms · {n} phrases / On · generated |
| Value line, Avatar | Off / {Vendor} |
| Value line, Turn detection | {Type} · {n} ms silence |
| Type options | Semantic / Voice activity / Manual |
| Manual line | Your software sends the turn events. |
| Field labels, Start of speech | Type / Threshold / Speaking interrupt / Interrupt / Prefix padding (the ms addon carries the unit) |
| Field labels, End of speech | Type / Silence / Max wait / Pause state |
| Interruption modes | When the person speaks / On keywords / Never (the sheet serves code and rtc agents too, where nobody is calling) |
| Keywords label | Keywords |
| Keywords tooltip | One word or phrase per line, 1 to 128. The agent stops only when it hears one. |
| When off label | Speech while the agent talks |
| When off options | Answer it next / Ignore it |
| Silence reminder fields | After / Then / Line / Prompt |
| Then options | Say a line / Send a prompt |
| Silence tooltip | Default off. The API has no default wait; Studio suggests 6 s. |
| Silence content tooltip | Say a line speaks this text. Send a prompt hands it to the model, which answers in its own words. |
| Endpoint label | Endpoint |
| Endpoint tooltip | Only for a self-hosted or proxied vendor endpoint. Empty uses the vendor's own. |
| Headers label | Headers |
| Headers tooltip | One header per line as Name: value. Sent with every request, never shown again after saving. |
| Headers saved | {n} headers set · Replace |
| History label | Messages kept |
| History tooltip | Default 32, 1 to 1024. Recent messages the model sees each turn. Instructions always count. |
| Threshold tooltip | Default 0.5, above 0 and below 1. Higher ignores quieter sound. |
| Speaking interrupt tooltip | Default 160 ms. How long the person must speak over the agent before it stops. |
| Interrupt tooltip | Default 160 ms. Sound needed before a turn starts. |
| Prefix padding tooltip | Default 800 ms. Audio kept from just before speech was detected. |
| Start type tooltip | Default Semantic: a turn starts on meaning. Voice activity starts it on sound. Manual waits for your software. |
| End type tooltip | Default Semantic: waits for a finished thought. Voice activity ends the turn after a pause. Manual waits for your software. |
| Silence tooltip (End of speech) | Default 320 ms, 120 to 2000. Quiet time that ends a turn. |
| Silence tooltip, voice activity | Default 640 ms, 120 to 2000. Quiet time that ends a turn. |
| Max wait tooltip | Default 3000 ms, 500 to 10000. The longest the agent waits for the thought to finish. |
| Pause state tooltip | Default on. A short pause counts as thinking, not the end of the turn. |
| Interruptions tooltip | Default: when the person speaks. On keywords stops the agent only on the words you list. Never lets it finish. |
| Silence prompt placeholder | The person has gone quiet. Check in briefly. |
| Filler instructions placeholder | A short, warm acknowledgement in the person's language. |
| Skip patterns label | Do not read aloud text inside |
| Skip pattern options | (parentheses) / [square brackets] / {curly braces} / （fullwidth parentheses） / 【lenticular brackets】 |
| Filler fields | After / Source / Phrases / Order / Instructions |
| Filler source options | Phrases / Generated |
| Filler order options | Shuffle / In order |
| Filler after tooltip | Default 1500 ms, 100 to 10000. Wait before a filler plays while the model thinks. |
| Filler phrases tooltip | One phrase per line, 1 to 100. |
| Filler instructions tooltip | The model writes a short filler from these instructions. |
| Avatar fields | Vendor |
| Avatar vendor options | Akool / LiveAvatar / Anam / Generic |
| Avatar tooltip | Default off. A video face driven by the voice, for rtc sessions. |
| Custom line (.c) | This makes the agent Custom. Presets pick the models for you. |
| API row line (.g) | Set through the API. Saving keeps it. |
| Failure pointer | What the agent says when the model fails is set in Greeting and failure message. |
| Range error, ms | Enter {min} to {max} ms. |
| Range error, count | Enter {min} to {max}. |
| Range error, threshold | Enter a number above 0 and below 1. |
| Range error, whole number | Enter a whole number of ms. |
| Range error, lines | Enter {min} to {max} lines. |
| Required line | Write the line the agent says. / Write the prompt the model gets. / Add at least one phrase. |
| Session line | Idle timeout, maximum duration and graceful stop belong to the session, not the agent. |
| Session door, batch | Set them in New run |
| Session door, code | Set them in the code snippet |
| Session line, inbound | Inbound sessions use the session defaults: they end 30 s after the caller leaves, and after 72 h at most. The API has no per-number setting yet. (idle_timeout_ms counts from the last remote user leaving, research/05-call-behavior/00-brief.md lines 84 and 96) |
| Session line, no type | Set them per session in the API. |
| Realtime Listen line | A realtime model hears speech itself, so speech recognition, interruptions and the silence reminder have no settings here. |
| Knowledge and tools, realtime line | A realtime model calls MCP servers only. Tools need a cascaded pipeline. |
| New run, Session limits fold | Session limits |
| New run, Session limits fields | Idle timeout (s) / Maximum duration (h) / Graceful stop |
| New run, Session limits tooltips | Default 30 s. How long the session stays open after everyone has left. / Default 72 h, the longest any session in this run lasts. / Default off. The agent finishes its sentence before a limit ends the session. |
| New run, wording outside P0.3 (owning rows P0.1) | Dial from / Dialing rotates across the numbers you pick. / Dial within a calling window; Code tab: One phone session; agent badge: Production (gray) or Draft |
| Realtime Think line | History and the failure message are not on a realtime model. |
| Realtime Speak line | The realtime model speaks with its own voice. |
| Realtime types | Server VAD / Semantic VAD / Agora VAD |
| Realtime fields | Type / Threshold / Prefix padding / Silence / Reply after silence / Start sensitivity / End sensitivity / Eagerness / Interrupt |
| Reply after silence tooltip | The model speaks up after this much silence. The API has no default. Studio suggests 8000 ms. |
| Greeting door, realtime | Greeting (sheet title the same; no Failure message field) |
| Greeting sheet, realtime line | A realtime model has no failure message. |
| Realtime vendor note (label suffix) | OpenAI Realtime only / Gemini Live only |
| Realtime number tooltip | The API has no default. Studio suggests {n}. |
| Eagerness options | Auto / Low / Medium / High |
| Sensitivity options | High / Low |
| Voice & models, realtime line | A realtime model listens and speaks on its own. Set its voice and language through the API. |
| Voice & models, realtime module row | Realtime model · {Vendor} · {model} |
| Guard title | Save your changes? |
| Guard body | Advanced settings has unsaved changes. |
| Guard buttons | Keep editing / Discard / Save |
| Test panel | Start test / End test |
| Test panel, heard turn (`saved-heard`) | *"Yes, this is Sam."* (the person) / *"One moment."* / *"Thanks, Sam. First question: how has your energy supply been this year?"* |
| Voice, realtime (list and test header) | Realtime voice |
| Header menu | View last save |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (call, conversation, chat, tier, template, plan, SDK, prototype, simulated, mock, wireframe, arrows, em dashes). P0.1 routes unchanged; P0.2 touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order, the review chrome hidden, the first shot scrolled to the top, and the focused element blurred and the selection cleared before every capture except where the focus is the point (03 the Silence (i), 09b the open Add menu, 11 the Reset tooltip, 13 Keep editing): 01 door, 02 defaults, 03 end-of-speech default (tooltip open, to the right), 04 edited on preset, 04b saved on preset, 05 filler on, 06 saved and heard, then rainy 07 b range, 08 c custom line, 08b c custom saved, 09 d realtime (Turn detection open), 09b d tools reason (page at the top, Add open; this one shot is 1600 x 1200 because the realtime Voice & models row is taller and the header and the menu fit together only at that height), 10 e session line (batch), 10b e new run limits (from `fold=limits`), 10c e code door, 10d e code snippet, 10e e inbound, 10f e no type, 11 f reset trigger, 11b f reset done, 12 g api rows, 13 h guard.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.3 · Make the conversation feel natural` after P0.2's, child sections 1 JTBD, 2 Research (the 21 shots with their regions from `02-research.md`), 3 Flow (13 story frames), 4 Hero (sheet at defaults; End of speech edited with tick and Reset; realtime sheet), 5 Rationale with the three links. Load `figma:figma-use` first.
