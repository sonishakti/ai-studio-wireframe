# P0.13 Try the agent without counting the tries · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 px, scale 2, dark, from the design/v3 preview with design-mode fixtures, no sign-in.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-agent-overview.png` | `/v3?concept=a&view=agent&agent=agent_payments&tab=overview` | Payment reminders (batch, Live): the header **Test** beside **New run**, the Sessions tile 1,284, Sessions per day, Recent sessions |
| `shots/before-02-test-panel.png` | the same with the Test sheet open | The panel idle: "Talk to the agent with your microphone." and **Start test call** |

## Before · concept A today (dfdbb2fa, P0.3's commit)

1. **Nothing says where a test lands.** The Test button sits beside a tile that counts 1,284 sessions and a table of production rows, and neither says whether the next test joins them (`before-01`, region 2792,131,152,50). Red: the JTBD's whole question is unanswered on the page.
2. **The idle panel says nothing about counting.** One sentence about the microphone, then the button (`before-02`, region 2472,48,704,144). Amber.
3. **No registry.** The panel keeps a running session id in `sessionStorage` for the stop only (P0.7's port); nothing durable records that a session was a test, so after a reload or in another browser the test is indistinguishable from production. Red for rainy f.
4. **No tag anywhere.** `SessionsTable` has no way to mark a row; the Sessions tile has no hint; there is no Your tests door. Red.
5. **The events cannot compute the KPI.** `trackProto` prints raw props to the console; in production the sanitiser (`src/lib/observability/sanitize.ts`) would drop `agentId`, `turnCount`, `configuredByUser`, `deploymentType` and every array, so a test could not be joined to its agent or told apart from a preset test. Red for rainy c.
6. **Preview traffic reads as external.** The identity gate does not pass `classifyNonProductionAsTest`, so a developer testing on a preview deploy is external traffic in every KPI (`identity.ts`). Red for rainy b.
7. **View last save shows calls only.** P0.7 lists `POST /sessions`; nothing shows what Studio kept or what it sent to analytics, so a developer cannot verify the tag or the events. Amber.

## After

The same surfaces, extended in place. The panel's idle line gains one sentence, "Tests stay out of the agent's numbers.", so Sam reads it where he decides to test. On Start test, Studio sends the reference it already sends and, at the 201, writes the session id into a registry that lives with the account (the Console backend's Studio objects; the browser until that object ships), before the channel join. On Overview the Sessions tile carries an (i), "Production sessions in the period. Tests from Studio are left out. Their minutes still count in Usage.", the tile, the chart and Recent sessions never include a registry id, and once a test exists the title row offers **Your tests (n)**: pressed, the same table lists the registry's tests for this agent, each row reading You with a gray **Test** tag, and the link reads **Production sessions** to go back. View last save gains two kinds of entry under the calls: `studio_tests · kept`, the entry Studio wrote and where, and `posthog · <event>`, each event with exactly the props that pass the allowlist, so a developer can read the id, the tag and the events for the last test. The events port from event-spec 1.0.0 with 15 new allowlist keys and pipe-joined arrays, the identity gate classifies preview and local traffic as test, and each rainy state (b to g) is a review state of the same dialog or the same Overview, honest about what today's code would do and what the fix does.

| Before | After | Why |
|---|---|---|
| "Talk to the agent with your microphone." | The same, then "Tests stay out of the agent's numbers." | Learning 4; `before-02` |
| Sessions tile with no hint | `InfoTip`: production only, tests left out, minutes still count | Learning 4; funnel stage 16 (test minutes billed) |
| A session id in `sessionStorage` for the stop | `StudioTest` written at the 201 into the account-level registry (browser until the backend object) | Learning 5; rainy f |
| Rows unmarked, tests mixed with production | `productionSessions` drops registry ids; the tile subtracts them | Learning 2 (Sentry's cosmetic exclusion); the KPI |
| No door to the tests | **Your tests (n)** beside Open in session history; rows read You and the gray **Test** `Badge` | Learning 3 (Vapi, Retell, ElevenLabs); P1.2's shape |
| Console log of raw props | `trackProto` sanitises through the real allowlist and shows sent and dropped; View last save lists `posthog · <event>` | Learning 6; rainy c |
| Preview traffic external | `classifyNonProductionAsTest: true` in the gate; `tries=preview` shows before and after | Rainy b |
| Nothing readable | `studio_tests · kept` and the analytics entries in View last save | Learning 6; rainy b, c, d, e, g |

Nothing new enters the design system: `Badge` outline in the muted tone (the status chip's own classes), `Button` ghost xs (the sibling link in the same title row), `InfoTip`, `CodeBlock` in P0.3's dialog, and one more sentence in P0.7's panel. One record per test is data, not a token.
