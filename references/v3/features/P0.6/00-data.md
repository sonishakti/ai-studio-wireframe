# P0.6 Run the agent on the team's own accounts · Rule 0, data first

Track: **v3**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.6], `02-research.md` rule 0 (7 shots), the v3 API snapshot `references/api/v3/openapi-2026-09-24-ih7axj9zx.json` (paths `/secrets`, `/secrets/{name}`; schemas `ModelCredential`, `ResolvedModelCredential`, `SecretSet`, `SecretsCreate`, `SecretsReplace`, `SecretsList`). ClickUp task 868m9wg3x has no comments, so there are no change notes. Depends on P0.2 (the module vendors behind a preset and Custom), P0.3 (the Advanced settings sheet, its model rows and the `ProviderKeyControl` beside each module's selects, the write-only Headers control as the sibling, the leave guard, View last save) and P0.5 (the test panel's transcript lines with a kind icon, a code and a duration, and the `lastTest` state on a row). Requirement 12: credentials without secret-set mechanics. Requirement 45: a secret set auto-created per agent, "created by agent X", write-only. Funnel stage 6 `byok_enabled`.

## What the flow shows

| Screen | Data it needs |
|---|---|
| A module row on a managed agent (.a step 1) | An agent whose every module runs `credential.mode: managed`; the row's key control reads **Use my key** and its value line "Managed by Agora" |
| The paste field (.a step 2) | A password field, empty; nothing exists yet |
| The pasted key (.a step 3) | A value in the draft only; the footer Save and Save and test on |
| The saved key (.a step 4) | A secret set `studio-<agent_id>-<module>` with one key `api_key`, the module's credential `{ mode: byok, api_key: "$secrets.studio-<agent_id>-<module>.api_key" }`, and the reference shown in the (i) beside **Key saved** |
| The test (.a step 5) | A test session whose transcript shows the greeting and the agent's first answer with no key line; the key control keeps **Key saved** |
| .b name taken | A set named `studio-<agent_id>-<module>` that already exists (made by hand through the API) so `POST /secrets` answers 409 and Studio retries with `-2` |
| .c wrong key | A test in which the vendor rejects the key: the transcript line names the module and the code; the row reads **Key rejected in last test** with the time |
| .c vendor changed | A saved key on a module whose vendor Sam then changes in the draft |
| .d replace | A saved key opened for replacing: the field and the re-enter line; `PUT /secrets/{name}` on Save |
| .e remove | A saved key removed in the draft (the line saying the stored key is deleted on save), then a save whose `DELETE /secrets/{name}` answers 409 because another agent references the set |
| .f revoked after go live | The same row after a production failure (the entry is P2.3.l's session view; nothing in the row changes) and the test after Replace that proves the fix |
| .g saved secret | At least one set in `GET /secrets` (name and key names, never values) so the field can offer a reference instead of a paste; behind a flag until P3.1 |
| reference pasted | A value starting with `$secrets.` typed into the field: Studio stores nothing and writes the reference |
| no key | A module whose model runs on Agora's SuperNode (Gemma 4 on Lowest latency): no vendor account, no key control |
| realtime, avatar | A realtime agent (Realtime model row) and an agent with the avatar on: the same control on those rows |

## What a new account lacks

Nothing. A brand-new agent from P0.1 answers `GET /agents/{id}` with every module's `credential` resolved to `{ mode: "managed" }`, and `GET /secrets` returns an empty list, so every module row shows the one button and no picker, no table, no group. Every happy state is reachable from that agent plus a key Sam pastes. The fixtures fake what a fresh account cannot show at once: a set whose name is taken, a vendor that rejects a key in a test, a set another agent references, sets to pick from, and a key set through the API as a reference.

API truth per field (checked against the snapshot):

| Field | In spec | Default | Notes |
|---|---|---|---|
| `pipeline.<asr\|llm\|tts\|mllm\|avatar>.credential` | yes, `ModelCredential` oneOf by `mode` | `{ mode: managed }` | `byok` requires `api_key` (writeOnly, minLength 1): a raw provider key or a `$secrets.<set>.<key>` reference. The API accepts a raw key inline; Studio never sends one (requirement 45: one set per module key, so P3.1 can rotate and the Secrets page can say who made it) |
| `ResolvedModelCredential` (every GET) | yes | | `{ mode }` only. The API never returns the reference, so Studio cannot learn from the agent which set a module uses. Studio records it at save in `labels.studio_secret_<module>` = `<set>.<key>` (PRD decision, "until then Studio records set and key per module at save") |
| `POST /secrets` | yes, `SecretsCreate` | | `name` `^[A-Za-z0-9_-]{1,64}$`; `secrets` a map with at least one key, key names same pattern, writeOnly. 201; 400; **409 name taken (.b)**; 429. `studio-agent_k3d9f2-llm` (23 characters, letters, digits, `-` and `_`) passes |
| `PUT /secrets/{name}` | yes, `SecretsReplace` | | Replaces the whole set atomically without changing agent references, so each Studio set holds one key and a replace touches one module (.d). 200; 409; 412 stale ETag (P3.1.e) |
| `DELETE /secrets/{name}` | yes | | "Delete an unreferenced set and all of its values." 204; **409 while referenced (.e)**; 412 |
| `GET /secrets`, `GET /secrets/{name}` | yes, `SecretsList`, `SecretSet` | | `name`, `keys[]` (names), `created_at`, `updated_at`; never values. Feeds the saved-secret picker (.g) and the tooltip's date |
| a key check or validate call | no | | The PRD defers it: the test is the check (.c). Vapi validates at save (docs); the KPI's fallback adds a check step below 80 % |
| a per-key PATCH on a set | no | | One key per Studio set makes PUT the replace |
| `SecretSet.used_by` | no | | The 409 body names one agent in text (`Problem.errors[]`); Studio shows that text (.e). PRD decision asks for a structured `used_by` by 1 Oct |
| `SecretSet.created_by` | no | | Studio derives "Created by {agent} for its {module}" from the name `studio-<agent_id>-<module>` (P3.1's page) |
| which module rejected a key in a session | no | | `Problem` carries `provider` and `pipeline_type` on `POST /sessions`; `Session.message` carries status detail after start. Studio maps the vendor to the module that uses it; when two modules share a vendor both rows are flagged (open question 3) |
| `credential_page_exited` | client, port 1.0.0 | | The counter metric. The row has no link to a credentials page, so the prototype never fires it; the port fires it when Sam leaves the builder for Model Credentials |

## Where it exists outside our accounts

- The entry point inside the builder, per module, beside the model: our own row today, `shots/before-01-advanced-provider-keys.png`, and LiveKit's Secrets group in the Advanced tab, `shots/livekit-18-agent-builder-advanced-telephony.png`.
- The paste and the saved state, value never echoed: `shots/before-02-key-paste-field.png`, `shots/before-03-key-saved.png`; Doppler masks values per row, `shots/refero-doppler-01-validation-error.png`.
- Empty first: LiveKit's empty Secrets table reads "No results.", `shots/livekit-19-agent-configuration-secrets.png`; we show one button and no table.
- A delete that names the blast radius but no dependents: OpenAI's revoke dialog, `shots/refero-openai-01-revoke-confirm.png`.
- Not captured anywhere (research gaps): a vendor rejecting a key in a session, a 409 on a taken name, a set the API refuses to delete. The prototype fakes these by URL; no capture blocks the build.

## What the prototype fixtures must contain

Branch `design/v3`, file `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Names below are the contract for the build; the build may place them where the file's order wants.

1. `ProtoAgent.keys` changes from `Record<KeySlot, boolean>` to `Record<KeySlot, ProviderKey | null>`; `null` is managed. Concepts B to E read `keys[slot]` for truth only, so they keep compiling.

   ```ts
   type KeyTest = { at: string; ok: boolean; code?: string }          // Studio state from the test panel, no API field
   type ProviderKey = {
     ref: string          // "$secrets.<set>.<key>", what the PATCH sends as api_key
     set?: string         // the set Studio made for this module; absent for a reference Sam pasted or picked
     savedAt: string      // "HH:mm" or "26 Sep"; from SecretSet.updated_at once the API answers it
     lastTest?: KeyTest
   }
   ```

2. `secretSetName(agentId, slot)` returns `studio-<agentId>-<slot>`; `nextSetName(name)` returns `name-2`, `name-3` (never overwrites). `isSecretRef(value)` is true for `^\$secrets\.[A-Za-z0-9_-]{1,64}\.[A-Za-z0-9_-]{1,64}$`. `keyNeedsNoVendor(slot, vendor, model)` is true for Gemma 4 on SuperNode (vendor `google`, model containing `SuperNode`): Agora runs it, so no key control.
3. `KeyDraft = { value: string } | { replace: string } | { remove: true } | { ref: string }` per slot inside the Advanced sheet's draft (`keyDrafts: Partial<Record<KeySlot, KeyDraft>>`). `credentialPatch(agent, keyDrafts)` returns the calls in order: for `value` and `ref`, `POST /secrets` (`{ name, secrets: { api_key } }`, skipped for `ref`) then `pipeline.<slot>.credential = { mode: "byok", api_key: ref }` and `labels.studio_secret_<slot>`; for `replace`, `PUT /secrets/{set}` only; for `remove`, `pipeline.<slot>.credential = { mode: "managed" }`, `labels.studio_secret_<slot>` removed, then `DELETE /secrets/{set}` when the set is Studio-made. The value never enters `lastSave`: View last save prints `"api_key": "••••"`.
4. `keyValueLine(slot, part, key)` for the collapsed row: `{Vendor} {model} · Managed by Agora`, `· Your key`, or `· Your key, rejected in last test`.
5. `moduleForProvider(agent, provider)` returns the slots whose vendor matches a `Problem.provider` or `Session.message` vendor name, for the test panel's line.
6. Design-mode secret sets: `SECRET_SETS` in sessionStorage under `ng.v3-concepts.secrets` (names, key names, `updated_at`, never values), seeded with `studio-agent_frontdesk-llm` (`api_key`, updated 09:41) and `team-prod` (`anthropic`, `elevenlabs`, made through the API). Design-mode `POST /secrets` answers 409 when the name is in the store; a pasted value containing `taken` seeds a colliding name first (P0.5's `empty` and `deny` convention); a value containing `rejected` makes the next test fail on that module with 401. `DELETE` answers 409 when another agent's `keys` references the set.
7. Seeds:
   - `agent_tutor` "In-app tutor" (code, Custom: Deepgram Nova 3, OpenAI GPT-5.1, Cartesia Sonic 3.5): every key `null`. Journey start.
   - `agent_frontdesk` "Front desk" (inbound, Balanced: OpenAI GPT-5.1 mini): `keys.llm = { ref: "$secrets.studio-agent_frontdesk-llm.api_key", set: "studio-agent_frontdesk-llm", savedAt: "09:41" }`, `labels.studio_secret_llm = "studio-agent_frontdesk-llm.api_key"`. The .d, .e and .f agent.
   - `agent_payments` "Payment reminders" (batch, Lowest latency): `keys.llm` absent (Gemma on SuperNode). For .e, `agent_api_untyped` "Order status" (made through the API) references `$secrets.studio-agent_frontdesk-llm.api_key` on its language model, so Front desk's Remove meets a 409 that names Order status.
   - `agent_api_custom` "Claims intake" (code, Custom: Anthropic, ElevenLabs, made through the API): `keys.llm = { ref: "$secrets.team-prod.anthropic", savedAt: "24 Sep" }` and `keys.tts = { ref: "$secrets.team-prod.elevenlabs", savedAt: "24 Sep" }`, no `set` (P3.1.d, a set Sam never made by hand, reads its reference here).
   - `agent_survey` "Renewal survey" (batch, Lowest latency): unchanged; its Language model row shows the no-key line.
   - `agent_realtime` "Concierge": `keys.mllm = null`; the Realtime model row carries the same control.
   - `agent_draft`, `agent_orders` (P0.4, P0.5): every key `null`.
   - `newAgent`: every key `null`.
8. Review states by URL, none writes the store: `key=paste` (the field open, empty), `key=entered` (a masked value, Save on), `key=saved` (the row after a save: Key saved, the (i), toast), `key=saved-test` (sheet closed, toast, the test panel with the greeting and the answer), `key=taken` (saved under `studio-agent_tutor-llm-2`, the (i) open, View last save with both calls), `key=rejected` (the test panel line and the failure bubble; with `panel=advanced&row=llm` the row's danger badge), `key=vendor` (the vendor select changed on a row with a saved key, the line), `key=replace` (the field open on a saved key, the re-enter line), `key=remove` (Use my key back, the delete-on-save line), `key=remove-409` (after save, Managed by Agora and the 409 line), `key=fixed` (agent_frontdesk after Replace and Save and test: toast, the test panel with the answer, no key line), `key=reference` (a `$secrets.` value in the field, the reference line). `sets=on` turns the saved-secret picker on (.g). `panel=advanced&row=<slot>` is P0.3's.
9. Tests: `secretSetName("agent_tutor", "llm")` is `studio-agent_tutor-llm` and matches `^[A-Za-z0-9_-]{1,64}$`; `nextSetName` never returns an existing name; `isSecretRef` accepts `$secrets.team-prod.anthropic` and rejects `sk-proj-abc`; `credentialPatch` of an untouched draft is `[]`, sends `POST` then the credential for a pasted value, `PUT` only for a replace, `managed` then `DELETE` for a remove, never a `POST` for a reference, and never contains the value; `keyNeedsNoVendor` is true for Gemma 4 on SuperNode and false for GPT-5.1 mini; `moduleForProvider(agent_tutor, "openai")` is `["llm"]`; every seed key's `ref` matches the reference pattern.

## What our own account must contain for real screenshots

Only if the owner wants live captures later (not needed for this run):

- One console-made agent on Custom with an OpenAI language model and no key; the team's real OpenAI key pasted once by the owner (never by the agent) for the saved and the test captures; a second paste of a wrong value for the rejected capture; a set named by hand through the API as `studio-<that agent id>-llm` before the paste for the 409 capture; a second agent pointed at the first set through the API for the delete-refused capture.
- Never sign in or enter credentials for this: the owner creates these in the staging account.
