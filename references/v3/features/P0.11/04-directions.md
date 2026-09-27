# P0.11 Connect the team's software to the agent · Directions

Track: **v3**. Constraints: Concept A is chosen; P0.8's Deployment tab and Code row are the base; existing design system only; reuse, do not redesign; empty first, quiet chrome; locked words; no gateway emitter (G1), no purpose field, no SDK in the v3 snapshot.

## Four directions

### 1. Grow the Code row
Keep P0.8's row. Three facts above the snippet (App ID with copy, the RESTful API key line with its link, the RTC token note), the language toggle in the code box header, a third tab for the ephemeral snippet, and the line under the snippet grows into a state line: draft, waiting, first session with a tick, failed (by URL until G1), idle timeout with an RTC channel check field, stale at 24 h, and a **Nothing arrived?** disclosure with the three common refusals. Every state is where Sam copied from.
Research: Resend's key-then-code with tabs in the box header (`refero-resend-03`), Resend's waiting line naming the trigger (`refero-resend-01`), LiveKit's Code beside the live view (`livekit-01`).

### 2. A Go live sheet for code
Mirror the inbound Go live sheet (P0.8, P0.9): the row keeps one line and a **Go live** button that opens a `FormSheet` with the transport rows, the language, the facts, the snippet and a footer that waits for the first session.
Research: our own Go live sheet (P0.8 `flow/04`), Polar and Dock side sheets (P0.9's brief). No vendor puts a snippet in a sheet.

### 3. Quickstart steps
The row as Resend's two steps: 1 Get your keys (App ID, RESTful API key), 2 Start a session (the snippet), 3 First session (waiting, then the tick), laid out as a vertical list with numbers.
Research: Resend (`refero-resend-03`), Vapi's numbered quickstart (`vapi-01`).

### 4. Paste the response
Direction 1 plus a paste field under **Nothing arrived?**: Sam pastes the failed response body, Studio reads `reason` and `detail`, names the field and the fix. Gives .b a real path today without G1.
Research: none of the four vendors; Stripe's docs only.

## Audit

Scored 1 to 5 (5 best). Criteria from the owner rules and the PRD row.

| Criterion | 1 Grow the row | 2 Go live sheet | 3 Quickstart steps | 4 Paste the response |
|---|---|---|---|---|
| Fits the JTBD (snippet filled, first session confirmed where Sam copied) | 5 | 3 (the confirmation is behind a door once the sheet closes) | 5 | 5 |
| Median 30 min or less (fewest doors between copy and proof) | 5 | 3 | 4 | 5 |
| Reuse, one door (P0.8's row, no new control shape) | 5 | 3 (a second Go live door beside the copy) | 2 (a stepper the Console does not ship, P0.8 refused one) | 3 (a new paste control) |
| Empty first, quiet chrome | 5 | 4 | 3 (three numbered blocks before anything happened) | 4 |
| Locked words, honest states (G1, purpose field, no SDK) | 5 | 5 | 5 | 4 (invites pasting a body that may hold the secret) |
| Rainy coverage .b to .h in one place | 5 | 4 | 4 | 5 |
| API fit (POST /sessions, ephemeral, GET /sessions?channel=) | 5 | 5 | 5 | 5 |
| Continuity with P0.8 and P0.9 | 5 | 4 | 2 | 5 |
| **Total / 40** | **40** | **31** | **30** | **36** |

Cut: 2 adds a door between the snippet and the proof, and the snippet is reference material Sam returns to, not a form to submit. 3 brings a stepper and three blocks of chrome to a row that P0.8 kept to one line. 4 is the best idea outside the pick and stays the documented fallback: if the counter metric (copies with no first session in 7 days) passes 40 %, add the paste field under **Nothing arrived?** and read `reason` from it; the risk is a pasted body carrying the secret, so it would strip `-u` lines before reading.

## Pick: direction 1, grow the Code row

1. **Where Sam copied is where Sam is told.** The waiting line and the first-session tick sit under the snippet in the same row, so the copy-to-proof path is one row and one toast; that is how the 30 min median is reachable, and no vendor does it (`retell-02`, `elevenlabs-02`).
2. **Reuse, not redesign.** P0.8's row, tabs, `CodeBlock`, line and copy Go live stay; the facts use P0.10's `<dl>`, the toggle is `ToggleGroup`, the check field is P0.6's key row shape, the failure is P0.1's `Alert`. No new token, component or control shape.
3. **Filled means filled.** The App ID goes into the URL and the facts strip; the Customer ID and secret stay environment names with the page linked (`refero-resend-03`); the auth line says `# server side only` and the RTC token note gives the client path (`refero-cohere-02`, Stripe), which is .g without a warning banner.
4. **Honest about the gaps.** The failed-request line is built and reachable by URL, but the spec says G1 blocks it in production and the .h list carries the same three fixes until then; the first-session (i) says every session counts as production until a purpose field exists (`livekit-02`); Node.js is a `fetch` because the snapshot has no SDK.
5. **Measurable.** `code_snippet_copied` and `first_session_detected` fire from this one row; `rtc_channel_checked {found}` and `cta_viewed {cta: nothing_arrived}` show which rainy path Sam met, so the counter metric can point at the paste field (direction 4) if it is needed.

## Questions for the owner (max 3)

1. The v3 snapshot ships no SDK. Is **Node.js** (a plain `fetch`) the right second language for launch, or Python? The toggle takes an SDK's name when one ships.
2. For .b, may Studio treat any session that reaches `failed` within a minute of `start_ts` as a failed first session and show its `message`, until the gateway emitter (G1) gives the real 401, 403 and 422?
3. For .d, may the Overview's empty row (P0.8's Go live row) carry the 24 h line and **Open the snippet** until P1.8's strip ships, or should nothing outside the Code row change?
