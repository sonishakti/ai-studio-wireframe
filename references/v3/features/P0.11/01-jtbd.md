# P0.11 Connect the team's software to the agent · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.11]. No ClickUp comments on the task, so there are no change notes. Concept A is chosen; the row extends P0.8's **Code** row on the Deployment tab.

## Job step

**Job:** Connect the team's software to the agent. Job map: Execute.

**Situation:** If the team's own software will start sessions, Sam connects that software to the agent and knows the first session worked.

**Sam wants to:** the team's app to talk to the agent.

**So that:** the app's users get answers inside the app.

**Job statement.** When my software has to start sessions with a saved agent, I want one snippet that already holds everything Studio knows (the agent, the project, the transport, the limits) and a place that tells me the first session arrived, so the first working session takes minutes, not an afternoon of reading docs and guessing which key goes where.

**Why now.** Today's Code row shows a curl body with placeholders (`$APP_ID`, `$CUSTOMER_ID`) and nothing else: no App ID, no way to the RESTful API key, no second language, no mark on which key stays on the server, and nothing after the copy. Sam copies, runs, and reads the terminal alone; Studio never says whether it worked. Every code journey (CO, CO-R, API, EP, ST) starts here.

## Happy path · P0.11.a

Story: Sam wants the team's app to talk to the agent, so the app's users get answers inside the app.

1. On Deployment, the **Code** row shows the snippet for **In your app** (rtc) in **curl**, filled with the agent's id and the project's App ID, and above it the App ID with a copy, the RESTful API key link marked server side only, and the RTC token note. `readiness_opened` (P0.8)
2. Sam picks **By phone** and **Node.js**. The body switches to a telephony transport with the project's number id, the RTC token note goes, the language toggle rewrites the same body as a `fetch`. No event (a view, not a commitment)
3. Sam copies the snippet and runs it from the team's server. Toast "Snippet copied. The first session your software starts is Go live." The line under the snippet reads "Copied at 14:02. Waiting for the first session from your software." `code_snippet_copied {transport, language, kind}`, `go_live_clicked {deploymentType: code}` (P0.8)
4. The tab confirms the first session: the line gets the gray tick, "First session from your software at 14:09.", the toast "First session started. Your software reached the agent.", the header badge reads Live. `first_session_detected {transport, minutesSinceCopy}`; server `channel_connected {code}` once G1 ships

Done when: a session Studio did not start exists for the agent within 30 minutes of the copy (median), and Sam saw it in the tab without opening a terminal or a session list.

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.11.b | The first request fails with 401, 403 or 422 | Under the snippet, one line with the code and the API's `reason`, the field at fault, and one fix link (**Open API keys**, **Open the project**, **Copy the snippet again**). Not readable until the gateway emitter ships (G1): the prototype renders it by URL, production shows .h | `go_live_error_shown {errorCode, reason}`; server `session_create_failed` (G1, G16) |
| P0.11.c | The session started but stopped within a minute: nobody joined the RTC channel before the idle timeout | The line says so; under it an **RTC channel** field and **Check**. Studio asks `GET /sessions?channel=` and answers with the session it found and its status, or that nothing with that exact name ran in the last two hours (the match is case-sensitive) | `rtc_channel_checked {found}` |
| P0.11.d | No session 24 h after the copy | The line reads "Copied yesterday at 14:02. No session from your software in 25 h." with the three common refusals already listed; the Overview's empty row names it and opens the snippet. P1.8's strip takes this over when it ships | `cta_viewed {cta: nothing_arrived}` |
| P0.11.e | Sam's own dev sessions look like production | Studio never writes a tag or a `client_reference` into the snippet. The first-session line carries an (i): every session the software starts counts as production, Sam's own included, until the API has a purpose field | none |
| P0.11.f | Sam does not want a saved agent | A third snippet tab, **Without a saved agent**: `POST /sessions/ephemeral` with the agent's config inline, one line "Account level only." Its copy is not this agent's Go live | `code_snippet_copied {kind: ephemeral}` |
| P0.11.g | Sam is about to put the RESTful API key in browser code | The auth line in the snippet carries `# server side only`; the key line above reads "Customer ID and secret, server side only."; the RTC token note gives the client path: the browser joins with the App ID and a token the server mints, never with the RESTful API key | `external_link_opened {surface: token_docs}` |
| P0.11.h | The failed request never reaches Studio (no gateway emitter, G1) | After the copy the line offers **Nothing arrived?**; it opens one sentence ("A failed request never reaches Studio, so the reason is in your software's response.") and the three common refusals, 401, 403, 422, each with its fix. With no RESTful API key on the account, the key line already says to create one | `cta_viewed {cta: nothing_arrived}` |

Extra states inside .a: a brand-new account has no RESTful API key, so the key line reads "No RESTful API key yet. Create one to run the snippet." with **Create a key**; a project in testing mode gets the other RTC token note. Empty first: nothing in the Code row is seeded; the first session appears only when software makes one.

## Measures

- KPI: median time from `code_snippet_copied` to `first_session_detected` 30 minutes or less (client, from polling `GET /sessions` for the agent while the tab is open and on each Deployment open); replace the end with `channel_connected {code}` once G1 ships.
- Counter metric: snippet copies with no `first_session_detected` in 7 days, 40 % or fewer. Above that, add a quickstart repo link under the snippet (the PRD's kill rule at a 2 h median).
- API: Partial. `POST /sessions`, `POST /sessions/ephemeral` and `GET /sessions?channel=` are ready. Missing: a purpose field (.e), a gateway emitter for failed requests (.b, .h, G1), `agent_session_id` on list rows (own-test exclusion by `start_ts`, G16), `client_reference` on any read, and a session SDK (the second language is plain Node.js).
