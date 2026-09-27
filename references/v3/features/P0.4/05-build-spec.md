# P0.4 Tell the agent its job · Build spec

Track: **v3**. Pick: **direction 1, one row, one door, grown to the API**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.3's commit; if P0.3's commit is absent at build time, the realtime line and the test panel labels are done here and P0.3 takes them over. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.4): write the prompt, set the greeting and the failure message, hear it`.

Scope rule: P0.4 only, the **System prompt** row of concept A (`AgentBuilderRow id="prompt"`, `parts/prompt.tsx`), its sheet, its data, and the two places its data is read: the test panel (`parts/list-and-create.tsx` `TestPanel`) and the New run variable mapping (`parts/deploy.tsx` `NewRunSheet`). Touches outside the row, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.3 are in review): the header **Test** button in `AgentA` saves a dirty prompt draft first; P0.3's Think footer link targets `panel=greeting` (already its target); `agent_payments`'s prompt gains one variable. Concepts B to E keep compiling: `PromptEditor` keeps `{agent, onChange, size, className}` and `GreetingSheet` keeps `{agent, open, onOpenChange, onSave}`; the reshaped `greeting` is read through `readVariables` and the new fields have defaults.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=<id>&tab=agent&section=prompt`, written below as `…&agent=<id>`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&agent=agent_draft` | System prompt is the first block after Voice & models: an empty editor with its placeholder; under it, left, a link **Use the starter prompt**; right, the ghost door **Greeting and failure message** with no tick; no footer | Sam opens System prompt on the new agent |
| 2 | `…&agent=agent_draft&pr=written` | The written prompt in the editor; the Variables line reads `customer_name` `appointment_time` `office_hours · Monday to Friday, 8 to 6` with the batch (i); the starter link is gone; the footer shows **Cancel** · **Save** · **Save and test** | Sam writes the prompt and sees its three variables as chips |
| 3 | `…&agent=agent_draft&pr=default` | Same, with the `office_hours` chip pressed: a `Popover` under it with one field **Default** holding "Monday to Friday, 8 to 6" | Sam opens office_hours and gives it a default |
| 4 | `…&agent=agent_draft&pr=written&panel=greeting` | Sheet **Greeting and failure message**: Who speaks first The agent; Greeting *"Hi, this is Aria from Bayview Dental. Is this {{customer_name}}?"*; Delay 0 ms with its (i); Failure message holding the suggested line; footer **Cancel** · **Save** · **Save and test** | Sam opens Greeting and failure message and writes the first line |
| 5 | `…&agent=agent_draft&pr=saved-test` | Row shown as saved (no footer, door ticked), toast "Prompt saved.", the test panel open on the right: the two values Sam typed, the greeting bubble *"Hi, this is Aria from Bayview Dental. Is this Alex?"*, Listening, **End test** | Sam presses Save and test, types the two values once and hears the greeting |
| 6 | `…&agent=agent_draft&section=analysis` | The Analysis row as it is today, with **Set up analysis** (P1.9 owns it; no change in this row) | Sam scrolls to Analysis to say what a good session looks like |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&agent=agent_survey&pr=cleared` | The editor empty on a saved agent; the footer shows **Cancel** on, **Save** and **Save and test** off, and the muted line "Write the system prompt to save it."; **Use the starter prompt** is back beside the door | The starter puts the batch starter in the editor and Save turns on; typing does the same; Cancel restores the saved text |
| .c test | `…&agent=agent_draft&pr=ask-values` | Test panel: title line **Values for this test**, one `Input` per variable (`customer_name` empty, `appointment_time` empty, `office_hours` pre-filled), the line "Asked once. Each run fills them from the contact list.", then **Start test** | Sam types the two values; they are kept for later tests in this session, so the panel never asks twice |
| .c batch | `…&agent=agent_payments&tab=deploy&panel=new-run&pr=list` | New run sheet with a list chosen; the mapping table reads `customer_name` column, `amount_due` column, `due_date` column, `callback_number` "Default: +1 415 555 0100" in muted text; no warning line | Nothing to fix; a variable with neither a column nor a default keeps today's "Not in this list" warning |
| .d | `…&agent=agent_survey&panel=greeting` | The sheet on an agent with no failure message: the Failure message field empty; its (i) reads "Spoken when the language model fails. Empty means the agent stays silent."; under the field one link **Use a suggested line** | One click fills *"Sorry, I lost track there. Could you say that again?"* and the link disappears; Save |
| .e | `…&agent=agent_survey&panel=greeting&pr=speaks-first-empty` | Who speaks first The agent, Greeting empty, Save pressed: `FieldError` under Greeting "Write the greeting, or let the caller speak first."; Save and Save and test off | Typing a line clears it; picking The caller hides Greeting, Delay and When it plays and shows one line "No greeting. The agent waits for the caller." |
| .f | `…&agent=agent_survey&pr=unsaved-test` | The row had an edited draft and Sam pressed the header **Test**: toast "Prompt saved.", the footer gone, the test panel open on **Start test** | None needed; a draft that cannot save opens the panel on its existing line "Write the system prompt to talk to the agent." with Start test off |
| code | `…&agent=agent_tutor&panel=greeting` | No Who speaks first; Greeting with its (i) "Plays when your software starts a session. Empty means the agent waits for the person to speak."; Delay; **When it plays** Only the first time; Failure message empty with the link | Nothing to fix |
| realtime | `…&agent=agent_realtime&panel=greeting` | Who speaks first hidden (code agent), Greeting, Delay, When it plays; in place of Failure message one line "A realtime model has no failure message. The greeting still plays." | Nothing to fix |
| leave | `…&agent=agent_survey&panel=greeting&pr=leave` | `AlertDialog` "Save your changes?" body "Greeting and failure message has unsaved changes." buttons **Discard** · **Keep editing** · **Save** | Save closes with the toast; Discard drops the draft; Keep editing returns |

New search keys, validated in `store.tsx`: `panel` gains `greeting`; `pr` (`written` \| `default` \| `saved-test` \| `ask-values` \| `cleared` \| `unsaved-test` \| `speaks-first-empty` \| `leave` \| `list`, review only, never written to the store). `openAgent` and `toList` clear `pr`. `section=prompt` already scrolls to the row.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `ProtoAgent.greeting: { speaksFirst: "agent" | "caller"; text: string; on: "each_join" | "first_join"; delayMs: number; audioUrl?: string }`. `ProtoAgent.variables: Record<string, string>`. `failureMessage` unchanged (maps to `pipeline.llm.failure_message`).
- `readVariables(source: { prompt: string; greeting: { text: string } })`: names in the prompt then the greeting, first appearance order, deduplicated; `readPromptVariables` becomes an alias for callers that pass only a prompt.
- `STARTER_PROMPTS: Record<DeploymentType, string>`:
  - inbound: "You are the front desk for the business. Answer questions about opening hours, location and services. Take a message when you cannot help, and read it back before you end. Keep every reply under two sentences."
  - batch: "You are a polite assistant. You are on the phone with {{customer_name}} to confirm an appointment. Confirm you are speaking to the right person before you mention it. Offer to move the appointment if the time no longer works. Keep every reply under two sentences."
  - code: "You are a helpful assistant inside the app. Answer the person's question, ask one question at a time, and say when you do not know. Keep every reply under two sentences."
- `SUGGESTED_FAILURE_LINE`, `validateGreeting(draft, type)`, `promptPatch(saved, draft)`, `greetingPatch(saved, draft, type)`, `greetingConfigured(agent)` (tick rule: text set, or caller first, or delay above 0, or failure message set).
- `newAgent`: `greeting` per type (agent first for inbound and batch, caller first for code), `variables: {}`.
- Seeds: new `agent_draft` (empty); `WRITTEN_DRAFT` constant for review states; `agent_payments`'s callback sentence becomes "If they dispute the bill, apologise and offer a callback from the billing team on {{callback_number}}." with `variables: { callback_number: "+1 415 555 0100" }`; `agent_frontdesk` `delayMs: 500`; `agent_tutor` `speaksFirst: "agent"`, `on: "first_join"`; the rest reshaped with `speaksFirst: "agent"`, `delayMs: 0`.
- Tests as listed in `00-data.md` item 11.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Row | `AgentBuilderRow id="prompt" label="System prompt"` (unchanged) | `src/components/console/agent-builder/agent-builder-row.tsx` |
| Editor | `Textarea` with the existing placeholder | `src/components/ui/textarea.tsx` |
| Chip | the existing `code` chip on the Variables line; a chip is a `PopoverTrigger` button | `parts/prompt.tsx` |
| Default field | `Popover` + `PopoverContent` holding `Field`, `FieldLabel` "Default", `Input`; no buttons, applies on blur or Enter | `src/components/ui/popover.tsx`, `field.tsx`, `input.tsx` |
| Variables (i) | `InfoTip` (text per type, section 6) | `parts/common.tsx` |
| Starter link, suggested line link | `Button variant="link" size="sm"` | `src/components/ui/button.tsx` |
| Row footer | the Voice & models footer: `Cancel` outline, `Save` default, plus `Save and test` (`size="sm"`), shown only when dirty | `parts/voice-models.tsx` lines 288 to 302 as the sibling |
| Reason line | P0.1's muted footer line (`FieldDescription` tone) | `src/components/ui/field.tsx` |
| Door | existing ghost `Button` with `MessageSquareQuote` and `Tick` | `parts/prompt.tsx`, `parts/common.tsx` |
| Sheet | `FormSheet size="compact"` (unchanged) | `src/components/console/form-sheet.tsx` |
| Who speaks first, When it plays | `Select` | `src/components/ui/select.tsx` |
| Greeting, Failure message | `Textarea` italic (unchanged) | `textarea.tsx` |
| Delay | `InputGroup` with `Input type="number"` and a trailing unit addon (ms), `min` 0, `max` 5000, `step` 100, the P0.3 number control | `src/components/ui/input-group.tsx`, `input.tsx` |
| Label with default | `FieldLabel` + `InfoTip` | `field.tsx`, `parts/common.tsx` |
| Greeting error | `FieldError` | `field.tsx` |
| Caller-first line, realtime line, code line | `FieldDescription` muted text | `field.tsx` |
| Leave guard | `AlertDialog` (P0.3's) | `src/components/ui/alert-dialog.tsx` |
| Saved | `sonner` toast | `src/components/ui/sonner.tsx` |
| Test panel values | `Field` + `Input` per variable inside the existing `TestPanel` body | `parts/list-and-create.tsx` |
| New run mapping | the existing two-column table; a third reading per row | `parts/deploy.tsx` lines 556 to 586 |

No new token, component, radius or font size. No icon on chips. No rich editor: the prompt stays a plain `Textarea` (chips read the text; nothing is inserted for Sam).

## 4. The row and the sheet, piece by piece

### System prompt row

```
[ textarea, placeholder "Describe who the agent is, what it does and how it should sound." ]
Variables  customer_name  appointment_time  office_hours · Monday to Friday, 8 to 6  (i)     ✓ Greeting and failure message
Use the starter prompt   (only while the draft is empty)
                                          Write the system prompt to save it.   [Cancel] [Save] [Save and test]   (footer, only when dirty)
```

- The Variables line shows only when the draft has a variable. A chip with a default reads `name · value`, the value in `text-muted-foreground`, truncated at 32 characters with the full value in `title`. Order is first appearance in the prompt, then the greeting.
- The (i) sits at the end of the line and speaks for the type (section 6). It replaces today's batch-only tip.
- **Use the starter prompt** shows while the draft prompt is empty (new agent or cleared). It puts `STARTER_PROMPTS[type]` in the editor, focuses the end, marks the row dirty.
- The footer appears when the draft differs from the saved agent (prompt or variables). Save and Save and test are off while the trimmed prompt is empty, and the reason line shows.

### Greeting and failure message sheet

| Field | Shown for | Control | API |
|---|---|---|---|
| Who speaks first | inbound, batch | `Select`: The agent / The caller | greeting present or `null` |
| Greeting | agent first; always for code | `Textarea` italic | `greeting.text` |
| Delay (ms) | with Greeting | `InputGroup` number, 0 to 5000, default 0 | `greeting.delay_ms` |
| When it plays | code, with Greeting | `Select`: Every time someone joins / Only the first time | `greeting.on` |
| caller-first line | caller first (inbound, batch) | `FieldDescription` | greeting `null` |
| Failure message | cascaded pipeline | `Textarea` italic with (i); **Use a suggested line** under it while empty | `pipeline.llm.failure_message` |
| realtime line | `pipelineMode === "realtime"` | `FieldDescription` in place of Failure message | none on `mllm` |
| audio line | `greeting.audioUrl` set | `FieldDescription` "Plays an audio file set through the API. Saving keeps it." above a read-only Greeting; described only, not built this row | audio mode |

Footer **Cancel** · **Save** · **Save and test**; both saves off while the draft equals the saved values or has an error.

## 5. Behaviour

- **Draft (row).** `PromptEditor` holds `{ prompt, variables }` as a draft with a baseline from the agent (the Voice & models pattern: a store change replaces the draft). `onChange` is no longer called per keystroke; it is called on Save with `promptPatch`. Cancel restores the baseline. Fires `prompt_edited {length}` on blur when the text changed since the last blur.
- **Chips.** Reading the draft prompt and the saved greeting text through `readVariables`. Pressing a chip opens its `Popover`; the Default field writes `draft.variables[name]` on blur or Enter; an empty field removes the key. Esc closes. A name that leaves the text keeps its default in the draft until Save, where `promptPatch` sends `null` for it.
- **Save (row).** Validates (trimmed prompt not empty), calls `onChange(promptPatch)`, sets the baseline, fires `operation_succeeded {operation: agent_update}` and `agent_updated {surface: "prompt", fields}`, toast "Prompt saved.". **Save and test** saves, then opens the test panel (`setTestOpen(true)` in `AgentA`, the P0.3 hook).
- **Starter.** The link shows only while the draft prompt is empty; it never runs on its own. Fires `prompt_edited {source: "starter"}`.
- **Door.** Opens the sheet (`panel=greeting`, `replace`). Focus returns to the door on close. Tick per `greetingConfigured`.
- **Draft (sheet).** Holds `{ speaksFirst, text, on, delayMs, failureMessage }`. Switching to The caller keeps `text` in the draft and hides the greeting fields; switching back restores it. Delay validates on blur and on Save with `FieldError` "Enter 0 to 5000 ms.".
- **Save (sheet).** Runs `validateGreeting`; on .e shows the error and keeps the sheet open; otherwise writes `greetingPatch` through `onSave`, fires `greeting_configured {speaksFirst, delayMs, hasFailureMessage, source}`, `operation_succeeded`, `agent_updated {surface: "greeting", fields}`, toast "Greeting and failure message saved.", closes. **Save and test** does the same, then opens the test panel.
- **Suggested line.** The link shows while the failure message draft is empty; pressing it fills `SUGGESTED_FAILURE_LINE`, marks the draft dirty, and the link disappears. `source: "suggested"` on the next `greeting_configured`.
- **Leave guard.** Close (X, Esc, overlay) with a dirty sheet draft opens the `AlertDialog`; Discard, Keep editing, Save as P0.3 .h. A draft with an error offers Discard and Keep editing only.
- **Test asks once (.c).** `TestPanel` reads `readVariables(agent)`; when any name lacks a default and no value was given this session, the body shows **Values for this test** with one `Input` per name (defaults pre-filled), the line for the type, and Start test is off until every field has a value. Values live in `sessionStorage` under `ng.v3-concepts.test-values:<agentId>`; the panel asks again only for a new name. The greeting bubble fills `{{name}}` from those values (replaces today's hard-coded "Sam"). Labels **Start test** and **End test**.
- **Test saves first (.f).** The header **Test** in `AgentA` calls the row's `saveIfDirty()` (exposed through a ref) before opening the panel: a valid dirty draft saves with the toast and `agent_updated {surface: "prompt", trigger: "test"}`; an invalid one (empty prompt) opens the panel on its existing "Write the system prompt to talk to the agent." line. The panel then plays the saved prompt's greeting.
- **New run mapping (.c batch).** Per variable: a list column of the same name shows the column; no column with a default shows "Default: {value}" muted; neither keeps "Not in this list" in the warning tone. The warning paragraph shows only when a variable has neither.
- **Blockers.** `readBlockers` keeps "Write the system prompt." on the saved agent; the row's reason line is the same rule on the draft.
- **Keyboard.** Row: textarea, chips (each a button, Enter opens the popover), (i), starter link, door, Cancel, Save, Save and test. Sheet: Who speaks first, Greeting, Delay, When it plays, Failure message, suggested link, Cancel, Save, Save and test; Esc closes or opens the guard. `pr=default` moves focus into the popover's field.
- **Events per action.** `builder_opened`, `prompt_edited`, `greeting_configured`, `operation_succeeded`, `agent_updated`, `agent_audio_heard`; `parts/events.ts` gains `prompt_edited`, `greeting_configured` and (if P0.3 has not) `agent_audio_heard`. Each logs once through `trackProto`.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: call, conversation, chat, template, preview, SDK, assistant (as the agent), bot.

| Key | Text |
|---|---|
| Row label | System prompt |
| Placeholder | Describe who the agent is, what it does and how it should sound. |
| Variables label | Variables |
| Chip with default | {name} · {value} |
| Variables (i), batch | Each run fills these from the contact list columns of the same name. A default covers a missing column. |
| Variables (i), code | Your software sends these when it starts a session. A default covers a missing one. |
| Variables (i), inbound | The number sends no data, so inbound sessions use the defaults. |
| Popover label | Default |
| Starter link | Use the starter prompt |
| Reason line | Write the system prompt to save it. |
| Row footer | Cancel / Save / Save and test |
| Row toast | Prompt saved. |
| Door, sheet title | Greeting and failure message |
| Who speaks first label | Who speaks first |
| Who speaks first options | The agent / The caller |
| Greeting label | Greeting |
| Greeting (i), code | Plays when your software starts a session. Empty means the agent waits for the person to speak. |
| Caller-first line | No greeting. The agent waits for the caller. |
| Greeting error (.e) | Write the greeting, or let the caller speak first. |
| Delay label | Delay (ms) |
| Delay (i) | Default 0 ms, 0 to 5000. Quiet time after the session starts before the greeting. |
| Delay error | Enter 0 to 5000 ms. |
| When it plays label | When it plays |
| When it plays options | Every time someone joins / Only the first time |
| When it plays (i) | Every time someone joins greets each join. Only the first time greets once per session, even when people rejoin. |
| Failure message label | Failure message |
| Failure message (i) | Spoken when the language model fails. Empty means the agent stays silent. |
| Suggested link | Use a suggested line |
| Suggested line | *"Sorry, I lost track there. Could you say that again?"* |
| Realtime line | A realtime model has no failure message. The greeting still plays. |
| Audio line (described only) | Plays an audio file set through the API. Saving keeps it. |
| Sheet footer | Cancel / Save / Save and test |
| Sheet toast | Greeting and failure message saved. |
| Guard title | Save your changes? |
| Guard body | Greeting and failure message has unsaved changes. |
| Guard buttons | Discard / Keep editing / Save |
| Test panel title | Test |
| Values title | Values for this test |
| Values line, batch | Asked once. Each run fills them from the contact list. |
| Values line, code | Asked once. Your software sends them when it starts a session. |
| Values line, inbound | Asked once. Inbound sessions use the defaults. |
| Test buttons | Start test / End test |
| Test, no prompt | Write the system prompt to talk to the agent. |
| Mapping header | Prompt variable / List column |
| Mapping, default | Default: {value} |
| Mapping, missing | Not in this list |
| Mapping warning | Contacts without a value hear the line with a gap. Add the column, set a default, or remove the variable from the prompt. |
| Starter, inbound | You are the front desk for the business. Answer questions about opening hours, location and services. Take a message when you cannot help, and read it back before you end. Keep every reply under two sentences. |
| Starter, batch | You are a polite assistant. You are on the phone with {{customer_name}} to confirm an appointment. Confirm you are speaking to the right person before you mention it. Offer to move the appointment if the time no longer works. Keep every reply under two sentences. |
| Starter, code | You are a helpful assistant inside the app. Answer the person's question, ask one question at a time, and say when you do not know. Keep every reply under two sentences. |
| Header menu | View last save (P0.3) shows the prompt or greeting PATCH body |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (call, conversation, chat, tier, template, plan, SDK, preview, prototype, simulated, mock, wireframe, arrows, em dashes). P0.1 and P0.2 routes unchanged; P0.3's Advanced sheet unchanged. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 empty-prompt, 02 written-chips, 03 default-popover, 04 greeting-sheet, 05 saved-test-heard, 06 analysis, then rainy 07 b-cleared, 08 c-ask-values, 09 c-new-run-mapping, 10 d-no-failure, 11 e-agent-first-empty, 12 f-unsaved-test, 13 code-sheet, 14 realtime-sheet, 15 leave-guard.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.4 · Tell the agent its job` after P0.3's, child sections 1 JTBD, 2 Research (the 11 shots in `shots/` with their regions from `02-research.md`), 3 Flow (15 story frames), 4 Hero (the row written with chips and the footer; the sheet on the agent-first greeting with the suggested line; the test panel asking for values), 5 Rationale with the three links. Load `figma:figma-use` first.
