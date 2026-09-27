# P0.6 Run the agent on the team's own accounts · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.6]. No ClickUp comments on the task, so there are no change notes. Concept A is the surface: the model rows of the **Advanced settings** sheet (P0.3, `parts/advanced.tsx` `ModelRow`, opened from the Voice & models footer), where each module already shows **Use my key** beside its vendor and model (`ProviderKeyControl` in `parts/model.tsx`). Scope is this agent's keys; keys shared across agents are P3.1.

## Job step

Sam runs this agent on the team's own provider accounts, so usage lands on contracts the team already has.

**Job statement.** When a module should bill the team's own vendor account, I want to paste that key once where the module is set and know it works, so usage counts against a contract the team already pays for and nothing I pasted can leak.

**Why now.** The funnel counts `byok_enabled` as stage 6, and the KPI assumes keys pasted in place work the first time. Today's control drops the value on Save key, claims **Key saved** before anything is stored, gives a wrong key the same face as a right one, and offers a key on a model Agora runs itself.

## Happy path · P0.6.a

Story: Sam wants the agent billed to the team's own vendor account, so usage counts against a contract the team already pays for.

1. In **Advanced settings** Sam opens the module's row (Speech recognition, Language model, Voice, Realtime model or Avatar) and presses **Use my key**. The value line read "Managed by Agora". `none`
2. Sam pastes the key into the password field. The (i) beside it says the key is stored as a secret for this agent, never shown again, and that usage goes to the team's own account. The footer's **Save** and **Save and test** turn on. `none`
3. Sam presses **Save**. Studio writes one secret set per module key, `studio-<agent_id>-<module>` with the key `api_key`, then sends the module's credential as `{ mode: byok, api_key: "$secrets.studio-<agent_id>-<module>.api_key" }` and records the set in `labels.studio_secret_<module>`. Reopened, the row reads **Key saved** with Replace and Remove; the (i) shows the reference; the value is never shown again. `secret_saved {entryPoint: builder, action: create, module}`, `operation_succeeded {operation: secret_set_create}`, `credential_mode_changed {module, entryPoint: advanced, from: managed, to: byok}`, `agent_updated`, `byok_enabled` (server)
4. Sam presses **Save and test**. The transcript shows the greeting and the agent's first answer with no key line, so the key works. `agent_test_started`, `agent_audio_heard {surface: test_panel, agentVersion}`

Done when: one module carries `credential.mode: byok` with a `$secrets` reference Studio made, and a test heard an answer with no `byok_key_failed` for that module within 24 h (median Use my key to saved 1 min or less).

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.6.b | `POST /secrets` answers 409: a set named `studio-<agent_id>-<module>` already exists | Studio retries as `studio-<agent_id>-<module>-2` and never overwrites another set. The row reads **Key saved**; the (i) shows the real reference with the suffix; **View last save** in the header menu shows the 409 and the second call | `secret_saved {action: create}` after the retry |
| P0.6.c | Sam pasted a wrong key, or pasted it on the wrong module | The spec has no check call, so the next test tells: the transcript line reads `Language model · key rejected · 401` in the error tone, the failure message plays, and **Replace key** under the line opens that row. The row reads **Key rejected in last test · 14:02** in the danger tint with Replace and Remove. A vendor change on a row with a saved key shows one line saying the saved key is for the old vendor | `byok_key_failed {module, code}` |
| P0.6.d | Sam needs to replace a key | **Replace** opens the field with the line "Enter the new key; the saved value cannot be shown." Save sends `PUT /secrets/{set}` with the one key; other modules and the agent's references are untouched; the rejected flag clears | `secret_saved {action: replace, module}` |
| P0.6.e | Sam goes back to managed and wants the key gone | **Remove** returns the row to **Use my key** with one line: the stored key is deleted on save unless another agent uses it. Save sends the module as managed, then `DELETE /secrets/{set}`. A 409 keeps the set and the row shows "The stored key stays: Order status still uses it." (the API names one agent in text). The module runs managed either way | `credential_mode_changed {to: managed}`, `operation_failed {operation: secret_set_delete, code: 409}` |
| P0.6.f | The key is revoked after the agent went live | Nothing in this row changes: production failures show on the session (P2.3.l, "key rejected" on that module) and its **Replace key** link opens this row on **Replace**. Sam pastes the new key, presses **Save and test**, and the transcript's answer confirms the fix | `secret_saved {action: replace}`, `agent_audio_heard` |
| P0.6.g | Sam already stored the key as a secret set | Behind the flag until P3.1: under the paste field, "Or use a saved secret" lists the sets `GET /secrets` returns (`team-prod · anthropic`); picking one writes the reference and creates nothing. Today, pasting a `$secrets.<set>.<key>` reference does the same without the list | `credential_mode_changed {to: byok, source: reference}` |

Design details inside .a: a module whose model Agora runs (Gemma 4 on SuperNode) shows one line instead of the control, "Gemma 4 runs on Agora's SuperNode and needs no key."; a realtime agent shows the control on its Realtime model row and an agent with the avatar on shows it on the Avatar row. Empty first: a brand-new agent's rows show **Use my key** and nothing else, no table, no group, no picker.

## Measures

- KPI: at least 90 % of tested keys work: `secret_saved {entryPoint: builder}` followed by `agent_test_started` on that agent within 24 h; of those, the share with `agent_audio_heard` and no `byok_key_failed` for that module. Reported beside it: the share of `secret_saved` with no `agent_test_started` within 24 h.
- Counter metric: `credential_page_exited` per new agent 0.2 or fewer (the port fires it when Sam leaves the builder for Model Credentials; the row has no link there).
- Assumption to read after P0.13: pasting in place removes the page exit and keys work the first time. Below 80 %, add a key check step (the API has no check call today).
- API: Partial. `POST /secrets` (409 on a taken name), `PUT` replaces the whole set, `DELETE` refused while referenced (409), `GET` lists names and key names; `credential.mode: byok` accepts `$secrets` references. Missing: a check call, a per-key PATCH, a structured `used_by`, the reference on resolved credentials, and a module name on a session failure.
