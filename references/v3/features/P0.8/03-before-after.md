# P0.8 Confirm the agent is ready · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the latest preview of concept A (`ng-console-2lwgznvzi-agoraio.vercel.app/v3?concept=a`). They show the third tab as P0.3's commit (`4bf260c7`) left it; P0.4 to P0.7 (in review, builds not yet landed) change the Agent tab and the test panel and leave this tab alone.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-numbers-tab-frontdesk-live.png` | `…&agent=agent_frontdesk&tab=deploy` | Front desk, inbound, Live: the Numbers tab with `+1 415 555 0142 · Support line`, **Disconnect**, **Connect another number**; header **Connect a number** |
| `shots/before-02-runs-tab-survey-draft.png` | `…&agent=agent_survey&tab=deploy` | Renewal survey, batch, Draft: the Runs tab with "No runs yet. A run calls one contact list with this agent." and **New run**; header **New run** |
| `shots/before-03-runs-tab-payments-live.png` | `…&agent=agent_payments&tab=deploy` | Payment reminders, batch, Live: the runs table (status, progress, success, started) with the row menu |

## Before · Concept A at P0.3 (4bf260c7)

`DeployArea` in `src/prototypes/agent-builder-v3/parts/deploy.tsx`, rendered by the third tab in `AgentA` (`concepts/a-tabs.tsx`), named Numbers, Runs or Code by `DEPLOYMENT_TYPES.deployTab`; the header's primary action from `DEPLOYMENT_TYPES.primaryAction` (Connect a number, New run, Get the code). The deployment itself is right: one list of numbers, one table of runs, one snippet with two transports. What is wrong against the JTBD and the v3 spec:

1. **No readiness.** Nothing lists a heard test on this version, the prompt, or a number or list; `readBlockers` in `store.tsx` computes two blockers and nothing renders them. A Draft batch agent starts a real run from the empty state with no check (`before-02`). (red, .a step 2, KPI)
2. **No retention.** Nowhere says how long what people say is kept; `DataPolicy` is not read or written, and the snippet omits `data_policy`. (red, .a step 3, .d)
3. **No Go live.** The action is Connect a number, New run or Get the code; "connect" and "deploy" are never words, and nothing records that a Go live moment happened, so `go_live_clicked` and `channel_connected` have no door. (red, .a step 4, vocabulary)
4. **The area has no name.** The tab is Numbers, Runs or Code; the PRD and requirement 6 name the area Deployment, and an untyped agent has no tab at all, so .f has nowhere to fire. (amber, .a step 1, .f)
5. **No test on this version.** `agent_audio_heard` (P0.3, P0.7) carries `agentVersion` but nothing compares it with the agent's `updated_at`, so .b cannot be shown. (red, .b)
6. **No numbers, no state.** With no number in the project the sheet's Select is simply empty; nothing says the project has none or offers the SIP trunk form first. (amber, .c)
7. **Already deployed, no readiness.** A live agent shows its deployment (right) and nothing about the version callers hear, so an edit after Go live is silent. (amber, .e, .h)
8. **Suspended is invisible.** No banner, and a refused run has no copy. (red, .g)
9. **Saves are silent on a live agent.** "Prompt saved." says nothing about the number or run that is answering with the old version a moment ago. (amber, .h)
10. **Copy.** "Disconnect", "Connect another number", "A run calls one contact list", "Calls from", "calls at once": call and connect are never words. (amber)
11. **Snippet key.** The snippet sends `"agent"`; the spec's key is `agent_id`. (amber, API truth)

## After

The same tab, named **Deployment** for every type, grown into three rows in the Agent tab's own row style: **Readiness**, **Retention**, then the type row, **Numbers**, **Runs** or **Code**, that holds the deployment and the one Go live door. Readiness lists a heard test on this version, the system prompt and a number or a contact list; a done item carries the gray tick and its fact, an open item the amber triangle, one sentence and one link (Test, Write the prompt, Add a number), a pending item neither. It names gaps and never blocks: Go live stays on for a missing test (.b) and a missing number (.c, the link opens the same sheet on the SIP trunk form); only a missing deployment type replaces the rows with P0.1.c's ask (.f). Retention offers 30 days or Zero retention in one radio group; on inbound and batch Zero retention is disabled with the reason under it, because Number and Campaign carry no `data_policy` (.d); on code the pick writes at once and the snippet carries it. The type row on a draft agent is one sentence and **Go live**; on a live agent it is the deployment and its status (.e): the numbers with Remove and Add another number, the runs table with New run in the header, the snippet with the first session from software. Go live for inbound opens the sheet titled Go live (today's number sheet, P0.9 grows it); for batch it opens New run (P0.10); for code it is the snippet's copy (P0.11). The header's primary reads Go live on a draft agent and lands on this tab at the top. A suspended account shows the minutes banner at the top of the tab with Add card in place (.g). A save on a live agent gains one line in its toast naming the number or run and a Test action (.h).

```
Deployment                                         (tab, after Agent)

Readiness      ⚠  Not heard in a test yet.                              Test
               ✓  System prompt written.
                  A number is picked at Go live. 5 in the project.

Retention      (•) 30 days
                   What people say is kept for 30 days, then expires. The
                   session row, its count and its cost stay.
               ( ) Zero retention                                     (off)
                   Nothing people say is stored. The row, count and cost stay.
                   The API has no retention setting on a number yet, so
                   inbound sessions are kept for 30 days.

Numbers        ┌──────────────────────────────────────────────────────────┐
               │ No number answers with this agent yet.        [Go live] │
               └──────────────────────────────────────────────────────────┘
```

```
Numbers        ┌──────────────────────────────────────────────────────────┐
               │ +1 628 555 0110                                  Remove  │
               │ Spare                                                    │
               ├──────────────────────────────────────────────────────────┤
               │                                     Add another number   │
               └──────────────────────────────────────────────────────────┘
```

| Before | After | Why |
|---|---|---|
| No readiness | A Readiness row: three items, tick or triangle, one link each; gaps named, never blocking | .a step 2, .b, .c, KPI, learning 2 |
| No retention | A Retention row: 30 days or Zero retention; disabled with the reason on inbound and batch; written into the snippet on code | .a step 3, .d, requirement 46, learning 3 |
| Connect a number, New run, Get the code | **Go live** in the header on a draft agent (lands on the tab); Go live in the type row's empty state; the sheet titled Go live; New run as the batch Go live; the snippet's copy as the code Go live | .a step 4, vocabulary, learning 1 |
| Tab named by type, none for an untyped agent | Tab named Deployment for every agent; the type name on the row; P0.1.c's ask in place for an untyped agent | .a step 1, .f, requirement 6 |
| `agentVersion` unread | The test item compares `agent_audio_heard.agentVersion` with `updated_at` | .b, .h, KPI |
| Empty Select with no numbers | The readiness item says so with Add a number; the sheet opens on the SIP trunk form with one sentence | .c, learning 5 |
| Deployment only, when live | Deployment and status in the type row, Readiness and Retention above it | .e, learning 4 |
| Nothing when suspended | The minutes banner at the top of the tab with Add card; a refused Start run reads the same line | .g, P0.7's copy |
| "Prompt saved." on a live agent | The toast gains the deployment line and a Test action | .h, P0.14 |
| Disconnect, Connect another number, calls | Remove, Add another number, dials, sessions | locked words |
| `"agent"` in the snippet | `"agent_id"`, `lifecycle`, and `data_policy` when set | API truth |

Nothing new enters the design system: `AgentBuilderRow`, the tick glyph, `TriangleAlert` with the warning tone and a link button (the live Go live section's issue list), `RadioGroup` rows (New run's When), `FieldDescription`, `EmptyRow`, `FormSheet`, `Select`, `Alert`, `CodeBlock`, `Tabs` and `sonner` with a description and an action all ship today; P0.1.c's `UntypedAlert` is reused as it is.
