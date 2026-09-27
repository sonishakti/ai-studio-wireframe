# P0.6 Run the agent on the team's own accounts · Learnings

Research phase done 26 Sep (`02-research.md`, 7 shots). Order followed: existing product shots for LiveKit (reused), Refero for the rainy gaps (Doppler's validation banner, OpenAI's revoke dialog), vendor docs for Vapi, Retell and ElevenLabs; no sign-in. Every vendor Partial except the two indirect Refero captures; the wrong-key error, the 409 and a "used by" list have no visual precedent anywhere.

## 1. The key lives with the module, inside the builder, and that door already exists

- Our own row lists every module with **Use my key** beside its vendor and model (`shots/before-01-advanced-provider-keys.png`); LiveKit keeps a Secrets group inside the Builder's Advanced tab next to Agent name and Telephony rather than on a separate page (`shots/livekit-18-agent-builder-advanced-telephony.png`); Vapi's provider keys sit a page away under Integrations (desk notes). The KPI's counter is exactly that page exit.
- **Change:** keep the one door, the module's row in Advanced settings (P0.3), and grow it to the API. No keys group, no keys row, no page. Unlike LiveKit, the key sits beside the model it belongs to, so a vendor change and its key are seen together.

## 2. Write-only is a trust signal every vendor converged on, and we already have the sibling control

- After save our row reads **Key saved** with Replace and Remove and never echoes the value (`shots/before-03-key-saved.png`); Doppler masks per row and reveals only config-type values (`shots/refero-doppler-01-validation-error.png`); ElevenLabs never reveals a workspace secret to the agent (desk notes). P0.3 set the Console pattern for a write-only field two lines below the key: the Headers textarea that reads "1 header set · Replace" once saved.
- **Change:** the key is a field of the row like Headers, committed by the sheet's **Save**, not by a second button inside the sheet. After save it reads **Key saved** with the reference in the (i) and Replace as the only way to change it; the value never comes back through any GET.

## 3. Saved is not proven; no vendor shows the wrong-key error, so the test must

- Vapi's docs say a key is validated at save, but no screenshot of the failure exists; Retell has no key UI at all; ElevenLabs' docs show no error shape; Doppler's one visible error is a banner above the whole table that cannot say which row failed (`shots/refero-doppler-01-validation-error.png`). Our paste field saves anything non-empty with no way to know it worked (`shots/before-02-key-paste-field.png`), and the API has no check call.
- **Change:** the proof is the test, as P0.5 did for tools: the transcript line names the module and the code (`Language model · key rejected · 401`) with **Replace key** under it, and the row carries **Key rejected in last test** with the time in the danger tint, never a banner. **Save and test** puts the proof one press after the paste.

## 4. Deleting a shared secret needs a "used by", and the API gives one name in text

- OpenAI's revoke dialog names the consequence in prose and lists no dependents (`shots/refero-openai-01-revoke-confirm.png`); Doppler's External References panel is the closest precedent for showing where a secret is used (`shots/refero-doppler-01-validation-error.png`, desk notes); ElevenLabs documents delete protection "if it's not in use" without an error shape. The v3 API refuses `DELETE /secrets/{name}` with 409 while referenced and names one agent in text.
- **Change:** Remove is honest before and after: the line before save says the stored key is deleted unless another agent uses it; a 409 after save keeps the set and prints the agent the API named. No dialog: the sheet's Save is the commit and Cancel restores. The structured `used_by` stays an API ask.

## 5. Empty first means one button, not an empty table

- LiveKit's fresh agent shows a Secrets table with four columns and "No results." (`shots/livekit-19-agent-configuration-secrets.png`); our older sheet showed a Provider keys group listing all three modules even when every one was managed (`shots/before-01-advanced-provider-keys.png`).
- **Change:** a managed module shows **Use my key** and its value line "Managed by Agora", nothing else; a module Agora runs itself (Gemma 4 on SuperNode) shows one line and no control; the saved-secret picker appears only when `GET /secrets` returns a set and only behind the flag until P3.1.

## 6. Studio names the set; the developer still gets to see the name

- The API needs a set name and Studio invents `studio-<agent_id>-<module>` (requirement 45); a 409 on that name is Studio's problem, not Sam's (`02-research.md`, .b gap). Doppler surfaces naming errors to the user because the user names things there (`shots/refero-doppler-01-validation-error.png`).
- **Change:** the collision resolves itself with a suffix and never overwrites; the (i) beside **Key saved** shows the real reference so a developer can find the set through the API or on P3.1's page, and View last save (P0.3) shows both calls. Nothing asks Sam to name anything.
