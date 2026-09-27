# P0.5 Connect other systems to the agent · Before and after

Track: **v3**, in the existing Console design system. Before shots captured 26 Sep 2026 at 1600 x 1000, scale 2, dark, from the latest preview of concept A (`/v3?concept=a`), agents Payment reminders and Renewal survey, plus the current Console's Integrations page.

| Shot | Route | What it shows |
|---|---|---|
| `shots/before-01-context-row-populated.png` | `…&agent=agent_payments&section=context` | "Knowledge and tools": Billing FAQ (knowledge, 4 files) and `send_payment_link` (tool), each with an icon, a name, one fact and a `…` menu; **Add** bottom right |
| `shots/before-02-add-menu.png` | same, Add pressed | Menu with Knowledge base, MCP server, Function tool, each with an icon and a hint line |
| `shots/before-03-mcp-sheet.png` | same, MCP server picked | "Add an MCP server": Name (placeholder "Billing FAQ"), Endpoint, Authorization header with **Save key**, **Connect** |
| `shots/before-04-mcp-connected-tools.png` | same, Connect pressed | "Tools the agent may call" with four fixed names, all ticked, whatever the endpoint |
| `shots/before-05-tool-sheet.png` | same, Function tool picked | Name, Description, Endpoint (POST and URL), Parameters JSON, Authorization header |
| `shots/before-06-knowledge-sheet.png` | same, Knowledge base picked | Name and a drop zone, nothing else |
| `shots/before-07-context-row-empty.png` | `…&agent=agent_survey&section=context` | The empty row: "The agent answers from its prompt alone." and **Add** |
| `shots/before-08-old-console-integrations-gated.png` | `/integrations` | The current Console's Integrations page, gated behind sign-in in design mode |

## Before · Concept A after P0.2 (87f05b3f)

`ContextInventory`, `AddContextMenu` and `AddContextSheet` in `src/prototypes/agent-builder-v3/parts/context.tsx`; `ContextItem` and `CONTEXT_KINDS` in `data.ts`. The row is already the right shape: one list, an icon per kind with a tooltip, one Add, an empty state that follows the rule. What is wrong against the JTBD and the v3 spec:

1. **Connect always succeeds.** Pressing Connect lists the same four tool names for any endpoint, all ticked, and the row saves as if proven. There is no "no tool list" branch (.b) and nothing that says a test is the proof. (red, .b, KPI)
2. **No state on the row.** A saved integration looks the same before and after a test; nothing reads Not checked, Worked or Failed, and no time is shown (.a step 3 and 4, .d, .i). (red)
3. **The test never shows a tool.** The test panel plays the greeting and listens; a tool call, its code and its duration never appear in the transcript, so .d and .i have nowhere to show. (red)
4. **Missing API fields.** No timeout on either kind, no body on a tool, no allowed tools without Connect, and the MCP `transport` and tool `execution.mode` constants are not sent. (amber, .a step 2, .j)
5. **Names are not validated.** The API's patterns (MCP letters and digits 1 to 48; tool starting with a letter, up to 64, never `mcp`) and the 32-tool limit are unenforced; the seed `send_payment_link` itself breaks the tool pattern. (red, .c)
6. **Headers are a bespoke control.** One Authorization header through `SecretKeyField` with **Save key**, while P0.3 set the Console's write-only Headers pattern (textarea, "n headers set · Replace"). A saved header cannot be replaced from the row (.e, .i). (amber)
7. **Edit opens a blank sheet.** The row menu's Edit calls the add sheet for the kind with empty fields, so a saved item cannot be changed. (red, .e, .i, .j)
8. **Never-words.** The menu item reads "Function tool" (tool never "function"), the sheet button reads "Connect" (never "connect"), the tool list reads "Tools the agent may call". (amber, vocabulary)
9. **The MCP Name placeholder reads "Billing FAQ".** A knowledge base example on the MCP sheet. (amber)
10. **A knowledge base that cannot save.** The kind is offered unconditionally, the sheet has no upload, indexing or failure state, and two seeds carry a knowledge item the v3 API cannot store (.g). (red)
11. **Legacy items vanish.** An agent that had Billing FAQ or HubSpot attached in the current Console shows nothing about them (.h). (amber)
12. **Realtime is half done.** Add offers MCP server only on a realtime agent (P0.3), but a saved tool on that agent would render as usable with no reason (.f). (amber)

## After

The same row, the same list and the same two sheets, grown to the API and given a state. The row is **Integrations**; Add offers **MCP server** and **Tool** as an icon and a name (Knowledge base only behind the flag). The MCP sheet holds Name, Endpoint, Headers (P0.3's write-only control), Timeout with its range in the (i), and Allowed tools with **Load tools**: the server's list as checkboxes, or one line saying it returned none and a textarea to type names, Save on either way. The tool sheet holds Name, Description, Method and URL, Parameters, Body (POST only), Headers and Timeout, with the API's rules as `FieldError`s. Both footers are **Cancel** · **Save** · **Save and test**. Every row carries an outline badge: **Not checked** after save, **Worked in last test** or **Failed in last test** with the time after a test; the test panel's transcript gains one line per tool used, name, code and duration, in the error tone when it failed, and the agent's fallback answer after it. The row menu's Edit opens the sheet pre-filled with "1 header set · Replace"; Remove asks once because header values cannot be recovered. A realtime agent dims its tool rows with one line; an agent with legacy knowledge bases or HubSpot gets one muted line naming them with a link to Integrations; the 32nd tool closes the Tool item with one line under the list.

```
Integrations       ┌──────────────────────────────────────────────────────────────────┐
                   │ [srv] Orders                   mcp.acme-outfitters.com · 3 tools │
                   │                                      Worked in last test · 14:02 … │
                   │ [tool] sendTrackingLink   POST api.acme-outfitters.com/tracking-links │
                   │                                                     Not checked  … │
                   ├──────────────────────────────────────────────────────────────────┤
                   │                                                          + Add   │
                   └──────────────────────────────────────────────────────────────────┘

Add an MCP server                                                        ×
--------------------------------------------------------------------------
Name (i)              [Orders                                              ]
Endpoint (i)          [https://mcp.acme-outfitters.com/mcp                 ]
Headers (i)           [Authorization: Bearer ****                          ]
Timeout (ms) (i)      [10000     ] ms
Allowed tools (i)                                              [Load tools]
  [x] search_orders   [x] get_order_status   [x] create_ticket   [ ] refund_order
--------------------------------------------------------------------------
                                          [Cancel]  [Save]  [Save and test]

Test                                                               Close
Mia · 0:07
“Hi, this is Mia at Acme Outfitters. Do you have your order number?”
[srv] search_orders · 200 · 0.4 s
“Order 4471 left the warehouse yesterday and should arrive on Tuesday.”
Listening
```

| Before | After | Why |
|---|---|---|
| Connect always lists four tools | **Load tools** asks the server; none returned shows one line, a textarea, and Save stays on | .b, learning 2 |
| No row state | Outline badge Not checked / Worked in last test / Failed in last test with the time | .a step 3 and 4, .d, .i, KPI |
| Transcript shows the greeting only | One line per tool used: name, code, duration; error tone on failure; the fallback answer after it | .d, .i, learning 3 |
| No timeout, body, allowed tools without Connect | Every API field with its default and range in the (i) | .a step 2, .j, learning 5 |
| Names unvalidated, no limit | `FieldError`s naming the rule; at 32 tools the Tool item leaves Add with one line | .c |
| `SecretKeyField` for one header | P0.3's Headers control, "n headers set · Replace" | .e, .i, learning 4 |
| Edit opens blank | Edit sheet pre-filled; Remove asks once | .e, .i, .j |
| Function tool, Connect, call | Tool, Load tools, use | locked vocabulary |
| Knowledge base offered always | Behind a flag, cannot save, seven file states | .g, learning 6 |
| Legacy items vanish | One muted line naming them, link to Integrations | .h |
| Realtime shows tools as usable | Tool rows dimmed with one line; Add offers MCP server only | .f |

Nothing new enters the design system: `AgentBuilderRow`, `DropdownMenu`, `Tooltip`, `Badge`, `FormSheet`, `FormSheetSection`, `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `Input`, `InputGroup`, `Textarea`, `Select`, `Checkbox`, `Button`, `Alert`, `AlertDialog`, `Progress`, `Spinner`, `sonner` all ship today; the Headers control and the number control are P0.3's; the footer is P0.4's; the badge is the agents list's status chip.
