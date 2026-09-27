# P0.1 Choose how people reach it · Build spec

Track: **v3**. Pick: **direction 1, type cards in the create sheet** (Concept A, corrected). Branch `design/v3`, worktree `ng-console/.worktrees/v3`, prototype route `/v3?concept=a` in design mode. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit message `design(agent): P0.1 choose how people reach it`.

Scope rule: P0.1 only. Touch Concept A's list, create sheet, header and the untyped state; do not restyle other concepts. B to E keep compiling after the shared renames.

## 1. Routes and URL states

All states are shareable links on `/v3` (search params validated in `store.tsx`). The prototype link opens at the journey start: `/v3?concept=a`.

| State | URL | Screen |
|---|---|---|
| Journey start (demo account) | `/v3?concept=a` | Agents list with four seeded agents, **Create agent** in the toolbar |
| Empty first screen | `/v3?concept=a&account=empty` | `ConsoleEmptyState`, one **Create agent** button, nothing seeded |
| .a sheet open, empty | `/v3?concept=a&panel=create` | Name empty, no card selected, Create off, reason line |
| .a type picked (review) | `/v3?concept=a&panel=create&type=inbound` (`batch`, `code`) | Card selected; name still empty, so the reason line shows |
| .g empty name | `/v3?concept=a&panel=create&type=batch` | Create off; "Name the agent to create it." |
| .e code card | `/v3?concept=a&panel=create&type=code` | Code card selected, rtc line visible |
| .d error 400 | `/v3?concept=a&panel=create&type=inbound&create=error-400` | Name and type kept, `Alert` with code, **Try again** |
| .d error 429 | `/v3?concept=a&panel=create&type=batch&create=error-429` | Same, 429 copy |
| .f saving | `/v3?concept=a&panel=create&type=inbound&create=saving` | Spinner in the button, fields and close inert |
| .f dropped, not saved | `/v3?concept=a&panel=create&type=inbound&create=dropped` | `Alert` after the re-read: not created, **Try again** |
| .f dropped, it landed | `/v3?concept=a&panel=create&type=inbound&create=dropped-landed` | Re-read finds the agent; sheet closes, toast, builder opens on it |
| .h closed partway | close or Esc on any sheet state | `panel` removed, list unchanged, next open is empty |
| .a landing | `/v3?concept=a&view=agent&agent=<new id>&tab=agent&section=voice-models` | Builder, Agent tab, scrolled to **Voice & models**, third tab named for the type |
| .b before first deployment | `/v3?concept=a&view=agent&agent=agent_survey&panel=change-type` | `Dialog` with the three cards, current one selected, **Change type** |
| .b after first deployment, inbound | `/v3?concept=a&view=agent&agent=agent_frontdesk&panel=change-type` | `AlertDialog` naming number +1 415 555 0142, **Open number** |
| .b after first deployment, batch | `/v3?concept=a&view=agent&agent=agent_payments&panel=change-type` | `AlertDialog` naming the run that holds the agent, **Open run** |
| .c untyped API agent | `/v3?concept=a&view=agent&agent=agent_api_untyped` | `Alert` at the top of the Agent tab with a suggested type |

New search keys: `type` (`inbound` \| `batch` \| `code`, sheet only), `create` (`error-400` \| `error-429` \| `saving` \| `dropped` \| `dropped-landed`), `section`. Name is never carried in the URL; review states that need a name type "Front desk" into the field on load in the prototype only.

## 2. Data and API

- Rename the id `sdk` to `code` in `DeploymentType`, and in every concept that switches on it. Order `DEPLOYMENT_TYPES` inbound, batch, code.
- Rename preset `fastest` display name to **Lowest latency** (id may stay; label changes).
- Create writes `POST /agents` with `labels: { studio_deployment: "inbound" | "batch" | "code", studio_preset: "lowest_latency", studio_source: "console" }`. The prototype stores these on `ProtoAgent.labels` so reviewers can read them in the header's `…` menu under **View labels** (existing `CodeBlock`).
- Add seed `agent_api_untyped` ("Order status", `labels: { studio_source: "api" }`, no `studio_deployment`, number `+1 415 555 0199` pointing at it). Suggested type = inbound when a number points at it, batch when a run does, otherwise code.
- .f re-read: before any retry, `GET /agents` and look for an agent with the same name, `studio_source: console` and created after the sheet opened. Found: open it. Not found: POST again. Open question 2 in `04-directions.md` (a `studio_create_ref` label).
- "Batch never inbound" is enforced in Studio only: the batch agent's Runs tab offers no inbound number, and the number picker hides batch agents. The API does not enforce it (PRD: Partial).

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Sheet | `FormSheet`, `size="compact"` | `src/components/console/form-sheet.tsx` |
| Name | `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Input` | `src/components/ui/field.tsx`, `input.tsx` |
| Type cards | `TypeRadioCards` on `RadioGroup` | `src/prototypes/agent-builder-v3/parts/list-and-create.tsx`, `src/components/ui/radio-group.tsx` |
| Error in sheet | `Alert variant="destructive"` + `AlertDescription` | `src/components/ui/alert.tsx` |
| Saving | `Spinner data-icon="inline-start"` in the button | `src/components/ui/spinner.tsx` |
| Type after create | `TypeBadge` in `AgentHeader` | `parts/common.tsx` |
| Change type door | existing header `…` `DropdownMenu`, item **Change type** | `src/components/ui/dropdown-menu.tsx` |
| Change before deployment | `Dialog` with `TypeRadioCards` | `src/components/ui/dialog.tsx` |
| Change blocked | `AlertDialog` | `src/components/ui/alert-dialog.tsx` |
| Untyped API agent | `Alert` (info tint) with two buttons | `src/components/ui/alert.tsx` |
| Empty list | `ConsoleEmptyState` | `src/components/console/primitives.tsx` |
| Success | `sonner` toast | `src/components/ui/sonner.tsx` |
| Builder rows | `AgentBuilderRow` | `src/components/console/agent-builder/agent-builder-row.tsx` |

No new token, component, radius or font size. Cards stay flat (no shadow); selected card uses the existing `border-foreground/60 bg-muted/30`.

## 4. Behaviour

- **Open.** Sheet opens empty every time (.h), focus in Name. Fires `create_sheet_opened`.
- **Select.** Clicking a card fires `deployment_type_selected {type}`. Cards are one tab stop, arrows move (Radix radio).
- **Create enabled** only when the trimmed name is not empty and a type is picked. Enter in Name submits when enabled.
- **Saving.** Button reads "Creating" with a spinner; name, cards, Cancel and close are inert; Esc does nothing until the request settles (.f).
- **Success.** Toast "Agent created." Fires `operation_succeeded {operation: agent_create}` (client) and `agent_created` (server). Navigate to the builder landing; `builder_opened {section: voice-models}`.
- **Builder by type.** Agent tab rows are the same for all types: Voice & models (preset and voice), System prompt, Knowledge and tools, Analysis, Advanced settings. Differences: the third tab is **Numbers** (inbound), **Runs** (batch) or **Code** (code); the `{{variable}}` hint in the prompt shows for batch only; the greeting line "Who speaks first" defaults to the agent for inbound and batch, and is hidden for code (the app decides).
- **Error.** Name and type kept, Create enabled again, error `Alert` above the footer. **Try again** resubmits (after the .f re-read). Fires `operation_failed {operation: agent_create, code}`.
- **Close partway.** Nothing saved, no confirm dialog (two fields are cheap to redo), no draft row.
- **Change type (.b).** From the header `…` menu. No deployment yet: `Dialog`, pick, **Change type**, toast "Deployment type changed to batch.", third tab renames, fires `deployment_type_changed {from, to, hasDeployment: false}`. Configured values the new type does not use stay hidden, not deleted (open question 1). A number or run holds the agent: `AlertDialog` naming it, fires `deployment_type_changed` only on success, never here.
- **Untyped API agent (.c).** Agents list Type cell reads "Not set". Builder shows the `Alert` once per agent; **Use inbound** writes the label and fires `deployment_type_selected {source: api_backfill}`; **Pick another** opens the change type `Dialog`. Dismissing writes nothing and the alert returns next visit until a type is set (reads as "ask once" per agent pending question 3).

## 5. Copy

All strings in `src/lib/i18n/resources/en/common.ts` when ported; literals are allowed in `src/prototypes/` only. Sentence case, no arrows, no em dashes, no ellipsis.

| Key | Text |
|---|---|
| Toolbar button, sheet title, submit | Create agent |
| Submit while saving | Creating |
| Cancel | Cancel |
| Name label | Name |
| Name placeholder | none (empty field, no example that reads as a value) |
| Empty name reason (footer, muted) | Name the agent to create it. |
| No type reason (footer, muted) | Pick a deployment type to create it. |
| Type field label | Deployment type |
| Type helper | How people reach the agent. You can change it until its first deployment. |
| Inbound card | **Inbound** · People dial its number and the agent answers. |
| Batch card | **Batch** · The agent dials a list of contacts, one run at a time. |
| Code card | **Code** · Your software starts each session through the API. |
| Code card second line | Web and app sessions use code over rtc. |
| Error 400 | The agent was not created (400). Check the name and try again. |
| Error 429 | Too many requests right now (429). Wait a minute, then try again. |
| Error, connection dropped | The connection dropped while saving. The agent was not created, so trying again is safe. |
| Retry button | Try again |
| Toast, created | Agent created. |
| Toast, found after drop | The agent was saved before the connection dropped. |
| Empty list title | No agents yet |
| Empty list line | An agent answers its number, dials a list of contacts, or joins sessions your software starts. |
| Header menu item | Change type |
| Change dialog title | Change deployment type |
| Change dialog helper | Nothing is deployed yet, so the change is safe. |
| Change dialog submit | Change type |
| Toast, changed | Deployment type changed to {type}. |
| Blocked title | Remove the deployment first |
| Blocked body, inbound | Number {number} answers with this agent. Remove the agent from that number, then change its type. |
| Blocked body, batch | Run {run} uses this agent. Cancel or finish the run, then change its type. |
| Blocked action | Open number / Open run |
| Blocked close | Close |
| Untyped alert | This agent was made through the API and has no deployment type. Number {number} points at it, so inbound fits. |
| Untyped alert, no binding | This agent was made through the API and has no deployment type. Nothing points at it yet. |
| Untyped buttons | Use inbound / Pick another |
| List Type cell, untyped | Not set |
| Tabs by type | Numbers / Runs / Code |
| Preset name | Lowest latency |

Never: SDK, widget, embed, channel type, agent type, outbound (as a type), campaign (as a type), template, publish, deploy (verb), My Agent.

## 6. Gate before the commit

- `bun run typecheck`, `bun run lint`, and the existing `agents-page.test.tsx` still pass.
- `node scripts/copy-lint.mjs` over the changed strings (no em dash, arrow, title case, never words).
- Every URL state in section 1 renders in design mode at 1600 px and 375 px, light and dark; capture with `annotate-shots.mjs` (green works, amber friction, red defect) into `shots/after-*`.
- Keyboard: Tab order Name, cards, Cancel, Create agent; Esc closes except while saving; focus returns to **Create agent** on close.
- Events: each event in section 4 logs once per action in the prototype console.

## 7. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, section `P0.1 · Choose how people reach it`, child sections 1 to 8: JTBD, research (red-marked shots), learnings, before and after, directions, prototype link, hero frames (sheet empty, sheet filled, error, saving, change blocked, untyped alert, builder landing), tracker. Load `figma:figma-use` first.
