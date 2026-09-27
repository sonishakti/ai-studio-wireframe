# P0.13 Try the agent without counting the tries · Directions

Track: **v3**. Constraints: concept A; existing design system only, no new token; reuse, do not redesign; empty first, quiet chrome; locked words (test, production, session, run, Usage); the API has no test flag and never returns `client_reference`, so every direction rests on a Studio-held registry of session ids and differs only in where Sam sees the tag and how the exclusion is shown.

## Three directions

### 1. The tag where the count is, one door beside the list
The registry is written at the 201. The panel's idle line gains one sentence. On Overview the Sessions tile gets an (i), the tile, the chart and Recent sessions exclude registry ids, and **Your tests (n)** appears beside Open in session history once a test exists, listing the tests with a gray **Test** tag on each row. View last save gains what Studio kept and what it sent. No new surface, no new control, no mode.
Research: Vapi's type facet and Retell's type column beside the list (`vapi-01`, `retell-01`); ElevenLabs' structural separation (`elevenlabs-02`); Sentry's cosmetic exclusion as the anti-pattern (`sentry-01`); Resend's log inspector for the developer door (Refero `380e1f12`, `cf561511`).

### 2. A test view for the whole account
A shell-level switch, "Viewing your tests", that flips every tile, chart and list on every page to the registry's tests, the way Stripe's test mode and Enode's sandbox client flip a dashboard; production is the default and the switch is the door.
Research: Stripe test-mode chrome (Refero `131eb3a0`), Enode sandbox (Refero `d0757985`). Loses: a new shell control outside this row's scope, a mode Sam can forget (LiveKit's dropdown, `livekit-01`), and tests are not a second world here: same agent, same numbers, same bill.

### 3. Tell it in the panel, leave Overview alone
After End test the status line reads "Ended · 0:42 · Not counted"; the header badge gains "3 tests"; the registry is written; Overview never changes and the tests are listed nowhere until P1.2.
Research: none of the vendors; the shape is the panel's own status line (P0.7). Loses: the proof lives away from the numbers it protects; nothing shows the tests themselves, so P1.2's "Your tests (n)" would be a second door for the same thing; "Not counted" on every ended test is chrome for what Agora does by default.

Cut before scoring: a manual "Mark as test" on a production row (a typed label is not a flag, `retell-01`, and the PRD's rainy f says the test counts as production); an environment or deployment picker in the panel (`livekit-01`); a test flag written into agent labels (a PATCH per test would bump `updated_at`, reopen P0.8's Readiness item and fire `agent_updated`); a chart series for tests (the tests never enter the count, so nothing to chart).

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 Tag where the count is | 2 Test view | 3 In the panel |
|---|---|---|---|
| Fits the PRD steps (stored id, Test tag, out of the numbers) and the KPI (registry join) | 5 | 4 | 3 (no tag shown) |
| Reuse, one door, no new surface | 5 | 2 (shell switch) | 4 |
| Empty first, quiet chrome | 5 (door only once a test exists) | 3 | 3 ("Not counted" every time) |
| Rainy f shown honestly (a lost id counts as production) | 5 | 4 | 2 (nothing to see) |
| Continues into P1.2 and P2.1 without a second door | 5 | 3 | 2 |
| No mode to forget (learning 2) | 5 | 2 | 5 |
| Counter metric (untagged Studio tests = 0, verifiable by a developer) | 5 (View last save) | 3 | 3 |
| Fits inbound, batch and code alike | 5 | 5 | 5 |
| **Total / 40** | **40** | **26** | **27** |

## Pick: direction 1, the tag where the count is

1. **A fact, not a mode.** LiveKit's forgotten dropdown (`livekit-01`) and Retell's typed label (`retell-01`) both fail the same way; a session Studio starts is a test by construction, the id is stored at the 201, and there is no control to get wrong. The counter metric, untagged Studio tests = 0, follows from the write, not from Sam.
2. **The tag lives where the count is.** Vapi and Retell put the type beside the list (`vapi-01`, `retell-01`); the (i) sits on the Sessions tile and the door on the Recent sessions title row, the surfaces P1.2 grows, so P1.2 and P2.1 extend this row rather than replace it.
3. **The exclusion is real, not cosmetic.** Sentry hides and still counts (`sentry-01`); here the tile subtracts the registry, the list drops its ids, and the KPI formula counts only registry-matched tests, so the number Sam reads and the number the team reports are the same number.
4. **Empty first, one sentence.** The panel says tests stay out of the numbers at the moment Sam decides (`before-02` said nothing); the door and the tag appear only once a test exists; nothing says free, because test minutes are billed (funnel stage 16).
5. **Honest about the store and readable by a developer.** View last save shows the reference, the registry entry and where it lives, and the events with exactly the props that reached PostHog (Resend's inspector as the sibling, Refero `380e1f12`); rainy b, c, d, e and g are each one entry in that dialog, and rainy f is shown as the production count it becomes.

## Questions for the owner (max 3)

1. The registry's account-level home: a `studio_tests` object per app in the Console backend, beside the Studio agents, credentials and knowledge bases the Console already keeps there, built by the Console team. Until it ships the browser holds it and a cleared browser turns a test into production (rainy f). Confirm the home, or name another.
2. The event keys `app_connected` (UI: integration) and `channel_connected` (UI: deployment) differ from the words Sam reads. The renames ship once in the next schema bump with no aliases: rename both keys with it (`integration_attached`, `deployment_connected`), or keep the keys and let the words differ?
3. On a draft agent (no production sessions) the Overview keeps its empty row after a test and the panel's transcript is the only record; the Your tests door appears only once the Recent sessions block exists. Accept until P1.8's strip owns the draft Overview, or give the empty row a second line now?
