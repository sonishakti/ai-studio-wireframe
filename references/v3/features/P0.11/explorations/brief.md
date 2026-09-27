# P0.11 Connect the team's software to the agent · UI Explorations brief

Track: **v3**. Scope: this folder only (`references/v3/features/P0.11/explorations/`). Static Figma frames, no interaction, in a child section named **UI Explorations** under `P0.11 · Connect the team's software to the agent` on page `v3 · P0 Agent config` of file `OIKZExT265nOJotBlmv2Ah`. Owner ask of 26 Sep: 3 to 5 variations of one hero screen, meticulously built from the kit on page 31:2 with variables bound, never detached; Refero-grounded, every reference tagged with its source; icons and logos where a vendor or a language is named. Written by the Design phase so the Figma pass has the grounding; the Figma pass owns the frames.

## The hero screen

**Flow file (after the build):** `flow/04-first-session.png`, the Code row at happy step 4. URL `/v3?concept=a&view=agent&agent=agent_assist&tab=deploy&code=first`. It is the one screen where the whole job step is visible at once: the facts Sam needed, the snippet that was copied, and the proof that the first session arrived.

**Content the hero must show (real copy and data only, from `05-build-spec.md` §6 and the fixtures):**

| Element | Content |
|---|---|
| Row label | Code |
| Transport tabs | In your app (active) · By phone · Without a saved agent |
| Fact 1 | App ID · `4c1e…5d6e` · copy icon |
| Fact 2 | RESTful API key · Customer ID and secret, server side only. · Open API keys |
| Fact 3 | RTC token · Your server mints one for the agent's uid and one for the person. Clients join with the App ID and their token, never with the RESTful API key. · How tokens work |
| Code box header | POST /sessions · curl (on) · Node.js · copy icon |
| Code body | `curl -X POST "https://preview.ai.agora.io/conversational-ai/v3/projects/4c1e0b7d2a9f4e8b8c6d1f2a3b4c5d6e/sessions" \` / `-u "$CUSTOMER_ID:$CUSTOMER_SECRET" # server side only` / `-H "Content-Type: application/json" \` / `-d '{ "agent_id": "agent_assist", "transport": { "type": "rtc", "channel": "room-42", "uid": "agent", "subscribe_uids": ["user-7"], "token": "AGENT_RTC_TOKEN" }, "lifecycle": { "idle_timeout_ms": 30000, "max_duration_ms": 259200000, "graceful_stop": { "enabled": false } } }'` |
| State line | gray tick · First session from your software at 14:09. · (i) |
| Toast (bottom right) | First session started. Your software reached the agent. |
| Above the row | Readiness two ticks (Heard in a test at 14:01, after the last change. / System prompt written.) and Retention on 30 days, P0.8 |
| Header | Shopping assistant · Code badge · Live badge · Test · menu (no Go live) |

Dark theme, Console tokens only (`WT/src/styles.css`), MiSans for the UI and the browser mono stack for the code, `max-w-5xl` row, flat surfaces, no shadow, no green, no red.

## Refero grounding (tag each frame with the source it leans on)

Refero has no indexed screen for any voice-AI vendor's session snippet or first-session state (checked this session; the row's research says the same of Vapi, Retell, ElevenLabs and LiveKit). What it has:

| Source | Refero id | What to take | What to leave |
|---|---|---|---|
| Resend, Send your first email | `f4520259-91e7-491f-b818-f3eb587ea553`, `a3dcdd3e-3033-4c25-8beb-1fefe00d439d`; shot `shots/refero-resend-03-first-email-quickstart.png` | the key step above the code, language tabs and cURL inside the code box header, one copy | the green highlight, the stepper rail, the three follow-up cards |
| Resend, webhook events | shot `shots/refero-resend-01-webhook-no-events-yet.png` | a waiting line that names the trigger | the illustration and the centred card |
| Gladia, live transcription console | `732d6811-4e23-497d-97b8-59776850d9e7` | a dark console with the code in the centre and a narrow settings column on the right, for a variation that puts the three facts in a side column | the purple accent, the full-width CTA |
| TwelveLabs, API key page | `fa79eeed-93fb-4e11-934f-eda8d2a5dd6d` | one key card above two code cards side by side, for a curl-and-Node.js-together variation | the light theme, the regenerate and revoke controls |
| Hume, API keys | `2637a519-a1bf-4218-914f-234c1ad199bb` | masked key rows with an inline copy, for the App ID row | the regenerate button |
| Enode, client credentials | `bec2cb25-c7b5-4c57-bd66-c2c4fec8431b` | a dark credentials form with copy buttons and the API URL beside the secret, for the facts strip as a form-like block | the success banner, the regenerate action |
| Cohere, API keys | `4c260c58-e6c2-45b4-8de2-0fb6afde4893`; shot `shots/refero-cohere-02-api-keys-prod-trial.png` | a rule sentence under a key group, for "server side only" as the key's own sentence | the two tables, the trial tag |
| Anthropic, API keys | `66b461a6-76cd-49f2-a4dd-eb32b7071a74` | a dark keys card with one line and one button, for the no-key state | the tabs bar |
| Meiro, share and embed | `b2b2df2d-cdd2-4dfa-b471-024afef6af59` | a dark stacked-sections page with an embed code block and its own copy, for the row rhythm | the neon accent, the domain restriction block |
| Mailchimp and Anam, API keys empty | `17947f86-248c-4343-9791-32e031987e5c`, `005b4da1-51a6-40de-aafa-e1275b14e028` | one sentence and one button for the no-key fact | the egg illustration, the table headers |

Our own before shots `shots/before-01-deploy-code-tab.png` and `shots/before-02-deploy-telephony-tab.png` and P0.8's Code row are the baseline every variation is diffed against.

## Variations to try (3 to 5)

1. **The spec as drawn.** The facts strip as a three-column `<dl>` above the code box, the toggle in the box header, the tick line under (baseline for the diff). Resend.
2. **Facts as a side column.** The code box takes two thirds; the three facts stack in a right column with their links, so the snippet reads first and the keys sit beside it. Gladia.
3. **Both languages at once.** curl and Node.js as two code cards side by side under one facts strip, no toggle; the tick line spans both. TwelveLabs.
4. **Credentials block.** The three facts as masked rows in one inset block (`InsetBlock`), App ID with its copy, the key row reading `CUSTOMER_ID · CUSTOMER_SECRET` as environment names with the page link, the RTC token row; the code box under it. Hume, Enode.
5. **Proof in the header.** The first-session fact moves into the code box header as a gray tick and "First session 14:09" beside the title, and the line under the box holds only the (i) sentence; shows the row after the job is done at its quietest. Meiro for the rhythm.

## Icons and logos

- Glyphs: lucide `Copy` (App ID and the code box), `Code` (the code type badge, P0.1's `TYPE_ICON`), `Info` (the (i)), `ExternalLink` on the three fact links if the kit has it, the kit's gray tick. No new icon.
- Logos: the curl and Node.js marks may sit on the language toggle in **one** variation only, tagged `logo:curl`, `logo:nodejs` in the frame name; the spec's toggle is text only. No vendor module (Deepgram, OpenAI, Cartesia) is named on the rtc curl hero, so no vendor logo; a variation that shows the **Without a saved agent** tab may place the three vendor monograms beside the inline pipeline, tagged as logos. No Agora wordmark inside the row (the shell owns it).

## Rules that still apply

Existing Console design system only; tokens from `src/styles.css`; sentence case, no arrows, no em dashes; every string from the copy table, nothing invented; empty first (nothing that Sam did not do; the first session is real in this state); the tick is gray and means "your software reached the agent", never green validation; no red anywhere on the hero; the secret never appears, only `$CUSTOMER_ID` and `$CUSTOMER_SECRET`; frames named `UI Exploration 0n · <idea> · refero:<id>`.
