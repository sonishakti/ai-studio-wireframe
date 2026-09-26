# P0.1 Choose how people reach it · JTBD

Track: **v3**. Persona: **Sam, a developer**. Source: `references/v3/03-strategy/prd-v3.json` features[P0.1]. No ClickUp comments on the task, so there are no change notes. Concept A is already chosen (req 3, 4).

## Job step

Sam decides how people will reach the agent: they dial its number, it dials a list of people, or the team's own software starts the session.

**Job statement.** When I create an agent, I want to say once how people will reach it, so the builder only asks me for what that deployment type needs and I reach a first test quickly.

**Why now.** Today's create sheet asks for a template, not a deployment type, so Sam meets batch variables on an inbound agent and phone settings on a code agent. The type is the first fork in every later journey (IN, BA, CO, API).

## Happy path · P0.1.a

Story: Sam wants to create a new agent that fits how people will reach it, so no setup time goes on things that do not apply.

1. On the Agents list Sam presses **Create agent**. The create sheet opens empty. `create_sheet_opened`
2. Sam types a name and picks one of three type cards: **Inbound**, **Batch** or **Code**. Each card has one line of copy. `deployment_type_selected`
3. Sam presses **Create agent**. The agent saves on the **Lowest latency** preset with the labels `studio_deployment`, `studio_preset` and `studio_source`. `operation_succeeded {operation: agent_create}`, `agent_created` (server)
4. The builder opens on **Voice & models** and shows only what that type needs. `builder_opened`

Done when: one agent exists, carries the three labels, and the builder is open on Voice & models within 30 s of the sheet opening (median).

## Rainy paths

| Id | What goes wrong | Recovery Sam sees | Event |
|---|---|---|---|
| P0.1.b | Sam picked the wrong type | Before the first deployment, the type changes in place from the agent header. After it, a dialog names the number or run that holds the agent and links to it | `deployment_type_changed {from, to, hasDeployment}` |
| P0.1.c | The agent was made through the API and has no type | The builder asks once, with a suggested type taken from the number or run pointing at the agent | `deployment_type_selected {source: api_backfill}` |
| P0.1.d | Create fails with 400 or 429 | The sheet keeps the name and type, shows the error code in one line, and offers **Try again** | `operation_failed {operation: agent_create, code}` |
| P0.1.e | Sam wants WhatsApp or a web page | WhatsApp is reserved and not offered, with no disabled card. The code card says web and app sessions use code over rtc | none |
| P0.1.f | The connection drops while saving | Create is inert while saving. Before a retry, Studio re-reads the agents list, so a second agent is never made. If the first save landed, the builder opens on it | `operation_failed {code: network}` |
| P0.1.g | Sam leaves the name empty | **Create agent** stays off, with one line saying why. Studio never invents a name | none |
| P0.1.h | Sam closes the sheet partway | Nothing is saved, no draft agent appears in the list, and the sheet opens empty next time | `create_sheet_closed {completed: false}` (optional) |

Empty first screen (a brand-new account) is part of .a: the Agents list shows the empty state with one **Create agent** button and nothing seeded.

## Measures

- KPI: 9 in 10 create sheet opens end in a saved agent within 10 minutes; median open to saved 30 s or less (provisional).
- Counter metric: `deployment_type_changed` before the first deployment on 10 % of agents or fewer. Above 20 %, the PRD moves the type to Go live.
- API: Partial. `POST /agents` exists; type, preset and source live only in labels; nothing enforces "batch never inbound".
