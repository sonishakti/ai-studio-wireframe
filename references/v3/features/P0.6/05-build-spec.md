# P0.6 Run the agent on the team's own accounts · Build spec

Track: **v3**. Pick: **direction 1, the key is a field of the module row, committed by the sheet's Save**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.5's commit; if P0.5's commit is absent at build time, the transcript line pattern (kind icon, name, code, error tone) is made here and P0.5 takes it over; if P0.3's commit is absent, the control is grown inside `parts/model.tsx` and P0.3's `ModelRow` picks it up when it lands. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.6): paste a provider key on a module, see it saved, rejected or removed`.

Scope rule: P0.6 only, the key control of concept A's Advanced settings model rows (`ProviderKeyControl` and `SecretKeyField` in `parts/model.tsx`, rendered by `ModelRow` for `asr`, `llm`, `tts`, `mllm` and by the Avatar row in `parts/advanced.tsx`), its data, and the two places its data is read back: the collapsed row's value line and the test panel (`parts/list-and-create.tsx` `TestPanel`). Touches outside the control, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.5 are in review): the Advanced sheet's draft gains `keyDrafts` and its Save runs `credentialPatch` before `advancedPatch` (P0.3's sheet, in review); the test panel gains one line kind, one link and `agent_test_started` (P0.3, P0.4 and P0.5 own its buttons, values body and tool lines, unchanged); `ProtoAgent.keys` changes shape (concepts B to E read it for truth only and keep compiling); two seeds gain a key and one gains a reference. No new URL search key is written to the store.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=<id>&tab=agent&section=voice-models&panel=advanced&row=llm`, written below as `…&agent=<id>`. States that show the test panel drop `panel=advanced&row=llm`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&agent=agent_tutor` | Advanced settings open on Think, **Language model** expanded: OpenAI · GPT-5.1 in the two selects, then **Use my key** (outline, sm); Endpoint and Headers below; the footer Cancel · Save · Save and test with both saves off | Sam opens Language model in Advanced settings and finds Use my key |
| 2 | `…&agent=agent_tutor&key=paste` | The button replaced by a password `Input` "Paste the key" with focus, an (i) after it, and **Cancel** (ghost, xs); both saves still off | Sam presses Use my key |
| 3 | `…&agent=agent_tutor&key=entered` | The field holds a masked value; the (i) open reads "Stored as a secret for this agent and never shown again. Usage goes to your OpenAI account."; both saves on | Sam pastes the team's OpenAI key and the footer turns on |
| 4 | `…&agent=agent_tutor&key=saved` | Toast "Advanced settings saved."; the row reopened reads a key icon, **Key saved**, an (i), **Replace**, **Remove**; the (i) open reads "Stored as $secrets.studio-agent_tutor-llm.api_key. The value is never shown again."; collapsed, the row's value line reads "OpenAI GPT-5.1 · Your key" | Sam presses Save and the row reads Key saved, hidden |
| 5 | `…&agent=agent_tutor&key=saved-test` | Sheet closed, toast, the test panel open on the right: "Kenji · 0:09", the greeting bubble, the answer bubble *"Sure. Which lesson are you on?"*, no key line, Listening, **End test** | Sam presses Save and test and hears the answer on the team's own account |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&agent=agent_tutor&key=taken` | The saved row as step 4, the (i) open reads "Stored as $secrets.studio-agent_tutor-llm-2.api_key. The value is never shown again."; the header menu's **View last save** dialog open behind it shows `POST /secrets studio-agent_tutor-llm · 409`, then `POST /secrets studio-agent_tutor-llm-2 · 201` with `"api_key": "••••"`, then the PATCH body | None needed; Studio never overwrites another set |
| .c test | `…&agent=agent_tutor&key=rejected` | The test panel: greeting bubble, then `Language model · key rejected · 401` in the destructive tone with the key icon, then the failure message bubble *"Sorry, I lost track there. Could you say that again?"*, then a link **Replace key**, Listening, **End test** | Replace key opens the row on the field (.d state); Sam pastes the right key and presses Save and test |
| .c row | `…&agent=agent_tutor&panel=advanced&row=llm&key=rejected` | The row's key control reads a `Badge` outline in the danger tint **Key rejected in last test** and `14:02`, then Replace, Remove; collapsed, the value line reads "OpenAI GPT-5.1 · Your key, rejected in last test" | Replace, or Remove |
| .c vendor | `…&agent=agent_frontdesk&key=vendor` | Language model with the vendor select changed to Anthropic · Claude Sonnet 4.6 in the draft; under the selects the key control still reads **Key saved** and one line "The saved key is for OpenAI. Replace it with an Anthropic key, or remove it to go back to managed."; P0.3's Custom line under it | Replace opens the field; Remove returns to Use my key; Cancel restores OpenAI |
| .d | `…&agent=agent_frontdesk&key=replace` | Replace pressed: the password field with focus, the (i), **Cancel**, and the line "Enter the new key; the saved value cannot be shown."; both saves off until a character is typed | Save sends PUT on `studio-agent_frontdesk-llm`; Cancel restores Key saved |
| .e remove | `…&agent=agent_frontdesk&key=remove` | Remove pressed: the control reads **Use my key** again and one muted line "Saving deletes the stored key unless another agent uses it."; both saves on | Cancel restores Key saved; Save sends managed then DELETE |
| .e 409 | `…&agent=agent_frontdesk&key=remove-409` | After the save: toast, the row reopened reads **Use my key** and one muted line "The stored key stays: Order status still uses it."; collapsed, "OpenAI GPT-5.1 mini · Managed by Agora" | Nothing to fix here; the module runs managed. P3.1's page removes the other reference |
| .f | `…&agent=agent_frontdesk&key=fixed` | Sheet closed, toast, the test panel with the greeting *"Hola, soy Aria de Bayview Dental. ¿En qué puedo ayudarle?"* and the answer, no key line | None; the entry from the session view (P2.3.l **Replace key**) targets `…&agent=agent_frontdesk&key=replace` |
| .g | `…&agent=agent_tutor&key=paste&sets=on` | The paste field as step 2 and under it a `Field` "Or use a saved secret" with a `Select` listing `team-prod · anthropic`, `team-prod · elevenlabs`, `studio-agent_frontdesk-llm · api_key`; picking one closes the field and the control reads **Key saved** with the picked reference in the (i), Save on | Flag off hides the field; an empty `GET /secrets` hides it too |
| reference | `…&agent=agent_tutor&key=reference` | The field holds `$secrets.team-prod.openai` (masked) and one line under it "A $secrets reference. Nothing new is stored; the key must already exist in that set."; both saves on | Save sends the credential only, no POST |
| no key | `…&agent=agent_survey` | Language model on Lowest latency: Google · Gemma 4 on SuperNode, and in place of the control one muted line "Gemma 4 runs on Agora's SuperNode and needs no key." | Nothing to fix; picking another model brings Use my key back |
| realtime | `…&agent=agent_realtime&key=paste` | The Realtime model row (P0.3's Think group) with the same field open beside OpenAI · gpt-realtime; the (i) names OpenAI | Same control, same save |
| leave | `…&agent=agent_tutor&key=entered&adv=leave` | P0.3's `AlertDialog` "Save your changes?" body "Advanced settings has unsaved changes." buttons **Discard** · **Keep editing** · **Save** | Discard drops the pasted value from memory; Save runs the save |

New search keys, validated in `store.tsx`: `key` (`paste` \| `entered` \| `saved` \| `saved-test` \| `taken` \| `rejected` \| `vendor` \| `replace` \| `remove` \| `remove-409` \| `fixed` \| `reference`, review only, never written to the store); `sets` (`on`, the saved-secret flag, kept across `openAgent`). `openAgent`, `toList` and `openPanel(undefined)` clear `key`. `panel=advanced` and `row=<slot>` are P0.3's; `row=avatar` shows the same control on the Avatar row when the avatar is on.

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `ProtoAgent.keys: Record<KeySlot, ProviderKey | null>` with `ProviderKey = { ref, set?, savedAt, lastTest? }`; `null` is managed.
- `secretSetName`, `nextSetName`, `isSecretRef`, `keyNeedsNoVendor`, `keyValueLine`, `moduleForProvider`, `credentialPatch(agent, keyDrafts)` (calls in order; the value never enters `lastSave`).
- Design-mode `SECRET_SETS` store (names, key names, dates; never values) seeded with `studio-agent_frontdesk-llm` and `team-prod`; 409 on a name in the store; a pasted value containing `taken` seeds the collision; a value containing `rejected` fails the next test on that module; DELETE 409 when another agent's `keys` references the set.
- Seeds: `agent_frontdesk` gains `keys.llm` (set `studio-agent_frontdesk-llm`) and the label; `agent_api_untyped` references that set (the .e 409); `agent_api_custom` gains `keys.llm` and `keys.tts` as `team-prod` references with no `set`; every other seed and `newAgent` have `null` keys.
- `parts/events.ts` gains `credential_mode_changed`, `secret_saved`, `byok_key_failed`, `agent_test_started`, `operation_failed` (if absent). `byok_enabled` is a server event and is not logged by the prototype.
- Tests as listed in `00-data.md` item 9.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Row | `AdvancedRow` (P0.3) with `ModelRow` for `asr`, `llm`, `tts`, `mllm`; the Avatar row | `src/prototypes/agent-builder-v3/parts/advanced.tsx` |
| Mode switch | `ProviderKeyControl`: **Use my key** `Button variant="outline" size="sm"` (unchanged) | `parts/model.tsx`, `src/components/ui/button.tsx` |
| Paste field | `SecretKeyField`: `Input type="password" autoComplete="off"` `h-8 w-64`, placeholder "Paste the key"; the **Save key** button is removed | `parts/model.tsx`, `src/components/ui/input.tsx` |
| Field (i) | `InfoTip` after the input (P0.3's `LabelTip` pattern for inline text) | `parts/common.tsx` |
| Cancel while pasting | `Button variant="ghost" size="xs"` | `button.tsx` |
| Saved | `KeyRound` icon, "Key saved" `text-sm`, `InfoTip` with the reference, **Replace** and **Remove** `Button variant="ghost" size="xs"` (as today) | `parts/model.tsx` |
| Rejected | `Badge variant="outline"` in the danger tint (P0.5's Failed in last test) with a `text-xs text-muted-foreground tabular-nums` time after it | `src/components/ui/badge.tsx`, `parts/common.tsx` `StatusBadge` as the sibling |
| Re-enter line, remove line, 409 line, vendor line, reference line, no-key line | `FieldDescription` muted text | `src/components/ui/field.tsx` |
| Saved-secret picker (flag) | `Field` + `FieldLabel` "Or use a saved secret" + `Select` of `{set} · {key}` | `field.tsx`, `src/components/ui/select.tsx` |
| Value line | the `AdvancedRow` `value` prop, from `keyValueLine` | `parts/advanced.tsx` |
| Last save | P0.3's **View last save** `CodeBlock` dialog listing each call with its status | `src/components/ui/code-block.tsx` |
| Leave guard | P0.3's `AlertDialog` | `src/components/ui/alert-dialog.tsx` |
| Saved | `sonner` toast "Advanced settings saved." (P0.3) | `src/components/ui/sonner.tsx` |
| Transcript key line | P0.5's tool line `<p className="text-xs text-muted-foreground tabular-nums">` with `KeyRound`, `text-destructive` | `parts/list-and-create.tsx` `TestPanel` |
| Failure bubble | P0.4's answer bubble with the agent's failure message | `parts/list-and-create.tsx` |
| Replace key link | `Button variant="link" size="sm"` under the line | `button.tsx` |

No new token, component, radius or font size. No dialog on Remove (the sheet's Save is the commit, Cancel restores). No reveal control anywhere.

## 4. The control, piece by piece

### Managed

```
[OpenAI ▾] [GPT-5.1 ▾]   [Use my key]
```

Value line "OpenAI GPT-5.1 · Managed by Agora". On a model Agora runs (`keyNeedsNoVendor`): no button, one line "Gemma 4 runs on Agora's SuperNode and needs no key.", value line "Google Gemma 4 on SuperNode · Managed by Agora".

### Pasting (draft)

```
[OpenAI ▾] [GPT-5.1 ▾]   [•••••••••••••••••••••] (i)  Cancel
                          Or use a saved secret  [team-prod · anthropic ▾]      (flag only)
```

The value lives in `keyDrafts[slot] = { value }` (or `{ ref }` for a `$secrets` value or a picked set) until Save. The (i): "Stored as a secret for this agent and never shown again. Usage goes to your {Vendor} account." A `$secrets` value adds the reference line. Cancel drops the draft for that slot and returns to the previous state. Save and Save and test turn on when the trimmed value is not empty.

### Saved

```
[OpenAI ▾] [GPT-5.1 ▾]   🔑 Key saved (i)   Replace   Remove
```

Value line "OpenAI GPT-5.1 · Your key". The (i): "Stored as {ref}. The value is never shown again." Replace opens the field with the re-enter line (`keyDrafts[slot] = { replace }`); Remove returns to Use my key with the delete-on-save line (`keyDrafts[slot] = { remove: true }`). A draft vendor different from the saved vendor shows the vendor line under the control.

### Rejected

```
[OpenAI ▾] [GPT-5.1 ▾]   [Key rejected in last test] 14:02   Replace   Remove
```

Value line "OpenAI GPT-5.1 · Your key, rejected in last test". Replace and Remove as Saved; a save of either clears `lastTest`.

### After a refused delete

```
[OpenAI ▾] [GPT-5.1 mini ▾]   [Use my key]
The stored key stays: Order status still uses it.
```

Shown once after the save that met the 409; the line goes away on the next open of the sheet.

### Test panel

After the greeting bubble, when the vendor rejects a key: one line `🔑 {Module} · key rejected · {code}` in `text-destructive`; for the language model, the failure message bubble (P0.4) after it; for speech recognition or voice, no bubble; then a link **Replace key** that closes the panel and opens `panel=advanced&row=<slot>&key=replace`. A clean test shows the greeting and the answer with no key line. The panel's buttons, timer, values body and tool lines stay as P0.3, P0.4 and P0.5 set them.

## 5. Behaviour

- **Use my key.** Sets `keyDrafts[slot] = { value: "" }`, shows the field with focus. Fires nothing. Cancel deletes the draft entry.
- **Draft.** The Advanced sheet's draft gains `keyDrafts`; the sheet is dirty when any entry exists with a non-empty value, a `ref`, a `replace` value or `remove`. A store change while open replaces the draft (P0.2 pattern). The value is kept in component state only, never in sessionStorage.
- **Save.** Before `advancedPatch`, run `credentialPatch` per slot in order: `POST /secrets` (`{ name: secretSetName, secrets: { api_key } }`; on 409 retry with `nextSetName`, at most three times, then the sheet shows P0.1's `Alert` "The key was not saved (409). Try again." above the footer and keeps the draft); then the PATCH carries `pipeline.<slot>.credential` (`byok` with the reference, or `managed`) and `labels.studio_secret_<slot>`; a replace sends `PUT /secrets/{set}` only; a remove sends the PATCH then `DELETE /secrets/{set}` when `set` is present (never for a reference Sam pasted or picked). Fires `secret_saved {entryPoint: "builder", action, module}`, `operation_succeeded {operation: "secret_set_create"}` on a 201, `credential_mode_changed {module, entryPoint: "advanced", from, to}` on each mode change, `operation_failed {operation: "secret_set_delete", code: 409}` on a refused delete; then P0.3's `operation_succeeded {operation: agent_update}`, `agent_updated {surface: "advanced"}`, toast, close. **Save and test** does the same, then opens the test panel (`setTestOpen(true)` in `AgentA`, the P0.3 hook). `lastSave` records every call with its status and `"api_key": "••••"`.
- **After a refused delete.** The 409's text is kept on the agent as `keys[slot] = null` plus a one-shot `keyNotice[slot]` in component state; the row shows the line on the next open in the same session, then clears it.
- **Vendor change.** When `draft.pipeline[slot].vendor` differs from the saved vendor and `keys[slot]` is set with no draft entry, the vendor line shows; it disappears when the draft holds a replace or a remove, or when the vendor returns.
- **Reference.** `isSecretRef(value)` switches the draft entry to `{ ref }` and shows the reference line; Save skips the POST and stores no `set`.
- **Saved-secret picker (.g).** With `sets=on` and at least one set in `SECRET_SETS`, the picker renders under the field; picking writes `{ ref }` and shows the saved state with the reference in the (i) and Save on. Fires `credential_mode_changed {…, source: "reference"}` on save.
- **Test.** In design mode, Start test fires `agent_test_started {agentId}` (port 1.0.0, new), plays the greeting at 2 s; on an agent whose key draft or saved key was marked `rejected`, the key line at 4 s and the failure bubble at 5 s, and `byok_key_failed {module, code: 401}` once per test; otherwise the answer bubble at 5 s (P0.5's timing). End test writes `lastTest { at: HH:mm, ok, code? }` to `keys[slot]`. The review states `key=rejected` and `key=fixed` render the transcript without writing. In the port, the line comes from `POST /sessions` `Problem.provider` and `pipeline_type` or from `Session.message`, mapped through `moduleForProvider`; two modules on one vendor both get the flag.
- **Replace key link.** Closes the panel and calls `nav.go({ panel: "advanced", row: slot, key: "replace" }, { replace: true })`; the sheet opens with focus in the field. Focus returns to the header **Test** button on close.
- **No key.** `keyNeedsNoVendor(slot, part)` hides the control and shows the line; a saved key on such a module (set through the API) still shows Key saved with Remove only.
- **Leave guard.** P0.3's; Discard drops `keyDrafts`.
- **Keyboard.** Row: vendor select, model select, Use my key (or the field, its (i), Cancel, the picker), Replace, Remove, then Endpoint, Headers. Test panel: the link after the failure bubble. `key=paste` and `key=replace` move focus into the field.
- **Events per action.** `secret_saved`, `operation_succeeded`, `operation_failed`, `credential_mode_changed`, `agent_test_started`, `byok_key_failed`, `agent_audio_heard`, `agent_updated`; each logs once through `trackProto`. `credential_page_exited` is never fired by the prototype (no link to a credentials page).

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: credential, vault, API key (alone), token, own keys, custom keys, Agora keys, byo, call, conversation, preview, reveal, show.

| Key | Text |
|---|---|
| Mode button | Use my key |
| Field placeholder | Paste the key |
| Field aria-label | {Module} key |
| Field (i) | Stored as a secret for this agent and never shown again. Usage goes to your {Vendor} account. |
| Cancel | Cancel |
| Saved | Key saved |
| Saved (i) | Stored as {ref}. The value is never shown again. |
| Saved actions | Replace / Remove |
| Re-enter line | Enter the new key; the saved value cannot be shown. |
| Remove line | Saving deletes the stored key unless another agent uses it. |
| Refused delete line | The stored key stays: {agent} still uses it. |
| Rejected badge | Key rejected in last test |
| Badge time | {HH:mm} |
| Value line | {Vendor} {model} · Managed by Agora / · Your key / · Your key, rejected in last test |
| No-key line | {Model} runs on Agora's SuperNode and needs no key. |
| Vendor line | The saved key is for {old vendor}. Replace it with a {new vendor} key, or remove it to go back to managed. |
| Reference line | A $secrets reference. Nothing new is stored; the key must already exist in that set. |
| Picker label | Or use a saved secret |
| Picker item | {set} · {key} |
| Save error (409 three times) | The key was not saved (409). Try again. |
| Transcript key line | {Module} · key rejected · {code} |
| Replace key link | Replace key |
| Answer, In-app tutor | *"Sure. Which lesson are you on?"* |
| Failure bubble | the agent's failure message, default *"Sorry, I lost track there. Could you say that again?"* |
| Toast | Advanced settings saved. |
| Guard | Save your changes? / Advanced settings has unsaved changes. / Discard / Keep editing / Save |
| Last save entries | POST /secrets {set} · 409 / POST /secrets {set} · 201 / PUT /secrets/{set} · 200 / DELETE /secrets/{set} · 409 / PATCH /agents/{id} |
| Last save value | "api_key": "••••" |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (credential, vault, token, own keys, Agora keys, call, conversation, chat, preview, reveal, prototype, simulated, mock, wireframe, arrows, em dashes). A grep of the changed files for a pasted value in `sessionStorage` or `lastSave` must find none. P0.1, P0.2, P0.4 and P0.5 routes unchanged; P0.3's sheet touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 row-use-my-key, 02 field-open, 03 pasted, 04 key-saved, 05 saved-test-answer, then rainy 06 b-name-taken, 07 c-test-rejected, 08 c-row-rejected, 09 c-vendor-changed, 10 d-replace, 11 e-remove, 12 e-remove-409, 13 f-fixed, 14 g-saved-secret, 15 reference, 16 no-key-supernode, 17 realtime, 18 leave-guard.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.6 · Run the agent on the team's own accounts` after P0.5's, child sections 1 JTBD, 2 Research (the 7 shots in `02-research.md` with their regions), 3 Flow (18 story frames), 4 Hero (the Language model row with Key saved and the reference (i); the test panel with the rejected line, the failure bubble and Replace key; the row after a refused delete), 5 Rationale with the three links. Owner ask of 26 Sep: add a child section **UI Explorations** with 3 to 5 native variations of the first hero screen (the module row with the key control), each meticulously built from the kit on page 31:2 with the vendor logos (Deepgram, OpenAI, Cartesia) in the logo strip, grounded in Refero screens (`refero_search_screens` for secret and key fields), hero screens only, nothing interactive. Load `figma:figma-use` first.
