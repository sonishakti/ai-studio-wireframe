# How the design loop runs

Process notes for whoever runs or reviews the design pipeline. Nothing here is product scope.

## The loop, from Sam to a KPI read

| # | Stop | What | Where |
| --- | --- | --- | --- |
| 1 | Job | JTBD for Sam: job, situation, want, outcome; happy path and every rainy path | sheet, ClickUp |
| 2 | Goal | One KPI per row with target, formula, counter-metric and the assumption it tests | sheet |
| 3 | Telemetry | Events named and typed before design; a tracking plan FE can implement | event-spec.json, PostHog |
| 4 | Blueprint | Journey and API map: what the spec can and cannot save | journeys, v3 spec |
| 5 | Research | 3 direct + 1 indirect competitors, existing shots first | references, Refero, Figma |
| 6 | Design | Before and after, 3 to 5 directions, one pick with rationale | references/v3/features/id |
| 7 | Prototype | design/v3, link opens at the journey start, every rainy state by URL | Vercel preview |
| 8 | Figma flow | Dark, text-light: one story frame per step with Sam's photo and 'Sam clicks on …', research findings, rationale | Figma section id · title |
| 9 | Review | The owner approves, asks for changes, or parks | ClickUp, Slack |
| 10 | Lock | Figma section frozen, commit recorded, card Delivered | design/v3 commit |
| 11 | FE build | FE pulls the commit and the Figma section; Code Connect maps components | ng-console |
| 12 | Ship and verify | Events fire in production; data checks stay green for 7 days | PostHog |
| 13 | KPI read | Cohort read 14 days after the week; the assumption is kept or killed | sheet, KPIs |

## Gates

| Gate | Passes when | When | Who |
| --- | --- | --- | --- |
| **G0 Clarified** | Team agrees the row is in v3 and the API can save it | before To-do | Vineet, Samyak |
| **G1 Job written** | Job, happy and rainy paths, goal and events on the row | before the agent takes it | Shakti |
| **G2 Telemetry plan** | Every event on the row has an owner and a status | before Pending Review | FE, API team |
| **G3 Build gate** | typecheck, tests, biome, a11y, copy rules, locked words, no locked route changed | every run | agent |
| **G4 Drift gate** | Code Connect coverage, token diff, screenshot baselines on locked routes | every run | agent |
| **G5 Review** | Prototype opens at the journey start; every rainy state reachable; rationale traces to research | after each run | Shakti |
| **G6 Lock** | Figma frozen, commit on design/v3, card Delivered | on approve | Shakti |
| **G7 FE parity** | Built screens match the Figma section; events fire as specified | before ship | FE |
| **G8 KPI live** | The KPI reads from real events, data checks green | 7 days after ship | Shakti, Vineet |

## The four runs

The design agent runs at 08:00, 11:59, 16:00 and 20:00. Each run applies verdicts from the board and Slack, takes the next card that is not done, builds only its JTBD (prototype, story flow in Figma, rationale), moves the card to Pending Review and posts once: "JTBD n of 42 · id title is done and pending your review". Contract: references/automation/v3-design-agent.md.

## Research rules

0. Rule 0, data first: does a new logged-in account have the data this flow shows? If not, where does it exist outside our accounts, and what must be created in ours?
1. Existing research first (the row, references/ screenshots, the Figma research sections).
2. Then MCP tools: Refero screens and flows, vendor docs, our Figma boards.
3. Then the built-in browser for public pages.
4. Claude in Chrome last, only when context is missing or a vendor shipped something new.
5. Always 3 direct (Vapi, Retell, ElevenLabs) + 1 indirect competitor (LiveKit, Datadog or Sentry, Twilio, Bland by topic).
6. Research runs on Sonnet or Opus; Fable only for the design pick and the build.

| Phase | A new account has | Outside our accounts | Create in ours |
| --- | --- | --- | --- |
| P0 | A new account has no agent and no session; the flow creates them. Presets, voices and provider lists exist without data. | Retell and ElevenLabs signed-in accounts (competitor profile) already hold configured agents; LiveKit and Vapi docs for create and test flows; Refero for create sheets and test panels. | 1 agent per deployment type (inbound, batch, code), 1 secret set with one wrong key to reach the failure state, 2 test sessions (one heard, one failed). |
| P1 | A new account has no production sessions, no errors and no runs: every monitoring view opens empty. The empty state is a rainy scenario, never the research. | LiveKit and Retell signed-in accounts hold sessions and call history; Datadog, Sentry and Honeycomb docs for error groups and traces (shots in v3/02-research/monitoring); Twilio docs for call logs; Bland for batch lifecycle. | 2 agents, 10 test sessions of which 3 forced failures (invalid BYOK key, unreachable number, idle timeout), 1 batch run with 5 contacts, 1 number pointed at an agent, then wait for the sessions to land in history. Note the app id and the session ids for the screenshots. |
| P2 | A new account has no sessions to open and nothing to filter. Session detail, turns and logs also depend on server gaps G2, G4, G11, G13. | Retell call history and LiveKit sessions (signed-in), Langfuse and LangSmith docs for trace timelines and filters, Twilio event streams; the 61 monitoring shots already captured. | the same 10 test sessions as P1 plus 1 session with zero retention and 1 with a long silence, so history shows a failed, a zero-retention and a slow session side by side. |
| P3 | A new account has one project, no numbers, no secrets and no integrations. Lists open empty; reuse and replace flows need at least two items. | Vapi and Retell signed-in accounts for numbers and keys pages; ElevenLabs for tools and MCP; the v3 API spec for every field. | 2 secret sets (one referenced by an agent), 3 numbers (one unassigned for 7 days), 2 MCP servers shared by 2 agents, 1 API-created agent to test code and hand edits. |

## Drift control

| Drift | Caught by | When |
| --- | --- | --- |
| Figma vs code: a frame uses a component the console does not have | Figma Code Connect (get_code_connect_map, add_code_connect_map); a frame using an unmapped component fails the Figma gate | every run |
| Tokens: a colour, radius or spacing in Figma differs from DESIGN.md and the CSS variables | Token diff: get_variable_defs vs src/styles.css, fails on any mismatch (Tokens Studio or Style Dictionary if the Figma side should be generated from code) | before every Figma publish and in the build gate |
| Prototype vs locked design: a later feature changed a locked route | Playwright screenshot baselines per locked route, stored at lock time | build gate of every run |
| Copy and words: a banned word or an old term ships | The vocabulary as a lint list; grep on changed files | build gate |
| Spec vs console: an API field with no home, or a control the API cannot save | The parity script (P3.5) | every spec bump |
| Figma hygiene: detached instances, unbound colours | Design Lint on hero frames before lock; a named Figma version at lock | before lock |

## Design system: change once, update every committed design

- Tokens live in one place: DESIGN.md maps the live design system; the CSS variables in src/styles.css are the source; Figma variables mirror them. A token change re-renders every prototype route and every native frame bound to the variable.
- Frames are built from the kit, never detached; a component change in the kit updates every locked section on publish without a re-approval.
- Token and component changes propagate silently; a structural change to a locked flow goes through the loop again as its own row.
- A design-system change is one commit on design/v3 plus one kit publish, named in the change log, so FE can pull it separately.

## Practices borrowed

| Practice | From | How we use it |
| --- | --- | --- |
| Checks written from real failures, 20 to 50 to start | [Anthropic, evals for agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | Every 'change:' comment you write becomes a check in the build gate. The gate list starts small and grows from real review comments, never from a rubric. |
| Layered checks: automated, then a human spot read, then a deeper pass | [Anthropic](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | Gate G3 and G4 run in the agent, you read every post (G5), and one row a week gets a full walk with FE (G7). |
| Review on the artifact: a preview link with comments on by default | [Vercel, preview comments](https://vercel.com/blog/introducing-commenting-on-preview-deployments) | Every run ends in a Vercel preview that opens where Sam starts. Comment there or in ClickUp; no review meeting. |
| Validate the agent's change before a human sees it | [Vercel Agent](https://vercel.com/docs/agent/pr-review/usage) | typecheck, tests, biome, copy lint, token diff and screenshot baselines run before the Slack post exists. |
| Separate shipping code from releasing a feature | [Vercel Flags](https://vercel.com/blog/vercel-flags-platform-native-feature-flags) | Locked commits live on design/v3 behind the design-preview build flag, so FE pulls them on its own cadence. |
| Design engineering: the same person sketches, gets feedback and ships | [Vercel](https://vercel.com/blog/design-engineering-at-vercel) | The agent designs in code and in Figma in the same run; the prototype is the handoff, Figma is the record. |
| Quality is the named metric, defended by small teams and a one-week fix promise | [Linear](https://linear.app/now/why-is-quality-so-rare) | No count of deliveries is a KPI here. A 'change:' comment jumps the queue at the next run, within hours not weeks. |
| Short one-owner briefs, issues not user stories | [Linear Method](https://linear.app/method/write-issues-not-user-stories) | The ClickUp task is the brief: job, goal, telemetry, deliverables, agent brief. Nothing else. |
| The tracker is the only source of truth for status | [Linear](https://www.lennysnewsletter.com/p/how-linear-builds-product) | ClickUp status is the queue. A row is WIP only when its task says in progress; the sheet reads it, never the other way round. |
| Named crit formats, including an FYI lane that asks for nothing | [Figma design critiques](https://www.figma.com/blog/design-critiques-at-figma/) | Three post kinds: 'Review ready' needs a verdict, 'FYI' is a rainy-state add or a token change, 'Question' blocks a row until you answer. |
| Catch drift where the source changes | [Figma Code Connect](https://www.figma.com/blog/introducing-code-connect/) | Every kit component maps to its console component; a frame using an unmapped component fails the Figma gate. |
| Three-section spec: problem, solution with alternatives, rollout with success criteria | [Notion](https://www.notion.com/use-case/engineering-tech-spec) | Each row reads the same way: job (problem), directions and pick (solution), goal and telemetry (success). |
| The same named phases every time, with a visible sign-off | [Shopify GSD](https://shopify.engineering/running-engineering-program-guide) | 13 stops and 8 gates above; 'where is this' is always a status in ClickUp and a gate in the sheet. |
| Job stories over personas: situation, motivation, outcome | [Intercom and NN/g](https://www.nngroup.com/articles/personas-jobs-be-done/) | Sam appears only in job text: Job, Situation, Sam wants to, So that. Rainy paths are the emotional and social criteria. |
| One north star plus a few movable inputs; no vanity or lagging counts | [Amplitude](https://amplitude.com/blog/good-bad-north-star-metric) | FPR is the north star, TTFA and TTFDA are the inputs. Designs delivered per day is never reported as a KPI. |
| The tracking plan is a reviewable artifact with its own sign-off | [Avo](https://www.avo.app/blog/our-definitive-guide-to-tracking-plans) | Gate G2: every event on the row has an owner and a status before the row goes to review. |
| Ship, show, ask: not every change needs the same gate | [Martin Fowler](https://martinfowler.com/articles/ship-show-ask.html) | Ship: copy and token fixes inside a row's scope. Show: extra rainy states, posted FYI. Ask: anything touching a locked design or new scope. |
| A fixed betting moment with an appetite instead of an estimate | [Basecamp Shape Up](https://basecamp.com/shapeup/2.2-chapter-08) | The four runs are the cadence; the days budget on the row is the appetite; your pick in ClickUp is the bet. |
| Never auto-merge agent output; make it easy to validate, attribute and reject | [GitHub](https://github.blog/ai-and-ml/generative-ai/agent-pull-requests-are-everywhere-heres-how-to-review-them/) | The agent never sets Done. One row, one commit, one Figma section, so a rejection costs one row. |
| Status posts state the outcome, not the activity, and name what unblocks | [Async standup research](https://amux.io/use-cases/ai-agent-daily-standup/) | The post format above: done and pending your review, links first, rainy states covered, open questions with who answers them. |