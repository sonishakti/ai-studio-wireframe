# P0.6 research: Run the agent on the team's own accounts (BYOK provider keys)

## Rule 0, data first

a. **Does a new logged-in account show the data this flow needs?** Yes, in our own prototype fixtures. `agent_frontdesk` (Front desk, Aria) ships with every module on `Managed by Agora` (Deepgram ASR, OpenAI LLM, Cartesia TTS), so the "before" state (empty, no key) renders honestly for a first-run account with no BYOK set up yet. The paste-and-save round trip is exercised live in the fixture (see `before-02`, `before-03`), so no seeded key data is needed to show the happy path.

b. **Where does it exist outside our accounts?** Signed-in Vapi/Retell/ElevenLabs dashboards would show the real Integrations/Secrets UI, but reaching them needs an account and a sign-in, which research never does. Desk notes (`v3/02-research/builder-models-secrets.md` §C) already cover Vapi's Provider Keys tier and ElevenLabs' workspace Secrets store from public docs. LiveKit's product screenshots already exist from earlier secondary research (`competitors/product/livekit/`) and show the entry point without opening it. Refero indexes Doppler and OpenAI's own key-management screens (not Vapi/Retell/ElevenLabs dashboards — confirmed absent from its index, same gap the desk notes already flagged).

c. **What must exist in our own prototype fixtures?** Nothing new: `PROVIDER_ROWS` (asr/llm/tts) and `agent.keys` already model one key per module, `SecretKeyField` already renders the three states (unset → paste → saved) needed for the happy path screenshots. What is still missing from the fixture, for a later Build phase: a 409 name-collision response, a failed-test state that names the module (P0.6.c/f), and a "used by N agents" count for the delete-refused state (P0.6.e) — none of these need new seed data, they need new response branches in `update`/`deploy`.

## Vendor status

| Vendor | Status | Source |
|---|---|---|
| Vapi | Partial | Docs only (`docs.vapi.ai/customization/provider-keys`, `.../api-keys`). No shot — Provider Keys tab lives under a signed-in dashboard's Integrations page, not reachable without an account. **New this pass:** the docs explicitly say a key is validated at save ("Once your API key is validated, you won't be charged...") — Vapi validates on save, unlike Agora's current no-validation spec. |
| Retell | Partial | Docs + repo (`docs.retellai.com/api-references/overview`, RetellAI's own Custom-LLM demo repo). No first-party secret-set UI exists at all; BYO-LLM keys go in a local `.env` outside the product. No shot possible — there is nothing to shoot. |
| ElevenLabs | Partial | Docs (`elevenlabs.io/docs/api-reference/workspace/secrets/{create,delete}`, `.../tools/webhook-tools`). No shot of the workspace Secrets store (signed-in only). **New this pass:** the DELETE endpoint's own description reads "Delete a workspace secret if it's not in use" — ElevenLabs is the one vendor of six researched that documents delete-protection tied to usage, though the exact in-use error response isn't spelled out in the reference. |
| LiveKit (indirect, build/infra) | Partial | Product screenshots, existing (`competitors/product/livekit/livekit-18-agent-builder-advanced-telephony.png`, `livekit-19-agent-configuration-secrets.png`), reused into this row's `shots/`. Shows the inline "Add secret" entry point inside the Builder's Advanced tab and the Agent configuration → Secrets table, both empty, neither opened. CLI docs (`lk agent update-secrets`) confirm secrets are otherwise set headlessly, not through this UI. |
| Doppler (indirect, secrets-as-a-service — this row's pick per the brief) | Done | Refero screen `8b37395d…` (`dashboard.doppler.com/.../configs/dev`), captured into `shots/`. Shows an inline validation error on the secrets table itself, per-row reveal/mask, an "Add Secret" split button, and an "External References" panel ("no secrets being referenced by another config") — the closest existing UI to a reference-tracking concept, though it tracks cross-config references, not cross-agent usage. |
| OpenAI (adjacent, for the delete-warning pattern) | Done | Refero screen `45bbb3bc…` (`platform.openai.com/api-keys`), captured into `shots/`. Revoke-key confirmation names the consequence in prose ("could cause any systems still depending on it to break") but lists no dependents — confirms the "used by" gap the desk notes already flagged is real even in a mature, widely-used product. |

## Shots

| File | Source | Path | Finding | Region (x,y,w,h) |
|---|---|---|---|---|
| `before-01-advanced-provider-keys.png` | before (prototype) | happy (P0.6.a step 1) | Today's Studio: Advanced settings → Provider keys lists all three modules on "Managed by Agora" with a single "Use my key" action each — the BYOK entry point already exists and matches the row's spec exactly. | 1768,632,1413,349 |
| `before-02-key-paste-field.png` | before (prototype) | happy (P0.6.a step 2) | Clicking "Use my key" swaps the row for a password-type paste field plus "Save key" (disabled until non-empty) — no separate dialog, no validation call before save, matching P0.6.c's "no validation call" spec. | 1768,656,1413,72 |
| `before-03-key-saved.png` | before (prototype) | happy (P0.6.a steps 3–4) | After save the row reads "Key saved" (icon + label), hidden, with Replace/Remove actions — the value is never echoed back, matching the write-only pattern every vendor researched (Vercel, Doppler, ElevenLabs) also converged on. | 1768,656,1413,72 |
| `livekit-18-agent-builder-advanced-telephony.png` | existing (product) | happy, entry point | LiveKit's Builder → Advanced tab has its own "Secrets" group with a one-line description and a ghost "+ Add secret" button, positioned beside Agent name and Telephony — an inline, in-context entry point like Agora's, not a separate settings page. | 499,832,1312,176 |
| `livekit-19-agent-configuration-secrets.png` | existing (product) | rainy (empty) | The Agent → Configuration → Secrets table (Key name / Kind / Created / Updated) renders "No results." for a fresh agent — confirms empty-first is the vendor default too, but the table is a dead end with no copy explaining why an agent would need one. | 499,336,2650,288 |
| `refero-doppler-01-validation-error.png` | refero | rainy (name/value error) | Doppler surfaces "Secret name must be at least one character long" as a full-width red banner pinned above the secrets table, not inline per-row and not a toast — an error tied to the list, not the field, worth avoiding since it can't point at which of several rows failed. | 285,238,960,60 |
| `refero-openai-01-revoke-confirm.png` | refero | rainy (delete / P0.6.e) | OpenAI's revoke-key modal states the blast radius in one sentence ("could cause any systems still depending on it to break") but names zero dependents — the delete-refused state Agora already specs (409 naming one agent) goes further than any vendor found here. | 375,203,370,225 |

7 shots total: 3 before/happy from our own prototype, 2 existing LiveKit product shots reused, 2 new Refero captures (Doppler, OpenAI). Every rainy id in the row except P0.6.b (409 name-collision) and P0.6.g (saved-secret picker, depends on P3.1) has at least indirect visual evidence; those two have no vendor UI to point at (b is Agora-internal naming, g depends on an unbuilt Agora surface) and are called out under Gaps.

## Copy and avoid, per vendor

**Vapi**
- Copy: two-tier framing (API keys to Vapi vs. Provider Keys to vendors) makes the billing consequence explicit at the point of entry.
- Avoid: no UI evidence of what the validation error looks like when it fails — don't assume "validated at save" is safe to promise in copy without our own error state designed first.

**Retell**
- Copy: nothing to copy — the total absence of a first-party UI is itself the finding (a real gap vs. Vapi/ElevenLabs worth naming to the team, per the desk notes).
- Avoid: pushing BYO-LLM credentials into a `.env` outside the product, which is what Retell's own demo repos do — the opposite of Agora's in-builder, write-only pattern.

**ElevenLabs**
- Copy: delete-protection tied to usage ("if it's not in use") is the one vendor precedent for Agora's own 409-on-delete spec — cite it when justifying that behavior to the team.
- Avoid: the docs don't say what a caller sees when deletion is blocked (no error shape shown) — don't copy silence here, Agora's own copy should name the blocking agent as spec'd.

**LiveKit**
- Copy: keeping "Secrets" as a named group beside "Agent name" and "Telephony" (not a separate page) matches Agora's own in-builder placement inside Advanced settings.
- Avoid: the empty Secrets table has zero explanatory copy for why an agent might need one — Agora's own empty-first rule still wants the one-sentence "why" the row/JTBD promises, not a bare "No results."

**Doppler (indirect)**
- Copy: the "External References" pattern — surfacing where else a secret is used — is the closest existing precedent for the kind of visibility Agora's delete-refused state (P0.6.e) wants, even though Doppler's version tracks configs, not agents.
- Avoid: the banner-style validation error sits above the whole table with no pointer to the offending row; Agora's inline field-level error (vendor rejects on next test, named on that module) is the better pattern already spec'd.

## Gaps

- No vendor in this pass (or the six from the desk-notes pass) shows an actual "used by" list before deleting a shared secret — OpenAI's prose warning is the closest and still names nothing concrete. Agora's 409-naming-one-agent spec has no UI precedent to borrow pixels from; it will need to be designed from scratch.
- No screenshot of a genuine wrong-key runtime error (a rejected test call, a 401 surfaced to the end user) turned up in Refero or docs for any of the six vendors researched across both passes — this remains an open gap, consistent with the desk notes' own open questions.
- Vapi, Retell and ElevenLabs dashboards remain unreachable without signing in (against research rules) and are not in Refero's index — P0.6.b (409 name-collision) and the exact shape of a blocked-delete error stay desk-only until a logged-in walkthrough is authorized.
- P0.6.g (pick a saved `$secrets` reference instead of pasting again) depends on P3.1's own Secrets page, which does not exist yet in the prototype or in any vendor shot gathered — nothing to capture until that row ships.
