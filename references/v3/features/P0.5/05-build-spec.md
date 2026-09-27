# P0.5 Connect other systems to the agent · Build spec

Track: **v3**. Pick: **direction 1, one list, two sheets, grown to the API and given a state**. Branch `design/v3`, worktree `ng-console/.worktrees/v3`, route `/v3?concept=a` in design mode. Builds land in id order, so this row starts on P0.4's commit; if P0.4's commit is absent at build time, the test panel changes here are made against P0.3's panel and P0.4 takes over the values-first body. Local commit only: never push, never `--prod`, never `ng-console.agora.io`. Commit `design(v3/P0.5): attach an MCP server or a tool, save it as not checked, see it work or fail in a test`.

Scope rule: P0.5 only, the **Integrations** row of concept A (today `AgentBuilderRow id="context" label="Knowledge and tools"` in `concepts/a-tabs.tsx`, rendering `ContextInventory` from `parts/context.tsx`), its two sheets, its data, and the one place its data is read back: the test panel (`parts/list-and-create.tsx` `TestPanel`). Touches outside the row, each the smallest honest change (declare under `touches_locked`; nothing is locked, P0.1 to P0.4 are in review): the row's label and `section` id change (P0.1 named the row "Knowledge and tools"); the test panel's transcript gains tool lines (P0.3 and P0.4 own its buttons and values body, unchanged); `agent_realtime` gains one tool and its Integrations row gets the realtime line (P0.3 .d already said "Add offers MCP server only", kept); two seeds lose their knowledge items and gain `legacy`. Concepts B to E keep compiling: `ContextInventory` keeps `{agent, onChange, layout}`, `AddContextMenu` keeps `{onPick, label, variant, kinds}`, `CONTEXT_ICON` and `contextKindsFor` stay exported, and `integrationDetail(item)` replaces every read of `item.detail`.

## 1. The flow

Base URL for every state: `/v3?concept=a&view=agent&agent=<id>&tab=agent&section=integrations`, written below as `…&agent=<id>`. The prototype link opens at step 1.

### Happy path

| Step | URL state | What Sam sees | Caption |
|---|---|---|---|
| 1 | `…&agent=agent_orders` | The Integrations row under System prompt on the Order status agent: one sentence, "The agent answers from its prompt alone.", and **Add**; no badge, no legacy line | Sam opens Integrations on the Order status agent |
| 2 | `…&agent=agent_orders&it=add` | The Add menu open: **MCP server** and **Tool**, each an icon and a name, no hint line | Sam opens Add and picks MCP server |
| 3 | `…&agent=agent_orders&panel=mcp` | Sheet **Add an MCP server**: Name, Endpoint, Headers (textarea), Timeout (ms) empty with its (i), Allowed tools with **Load tools** and the line "Empty allows every tool the server offers."; footer **Cancel** · **Save** · **Save and test**, both saves off | Sam names the server Orders and pastes the endpoint and the header |
| 4 | `…&agent=agent_orders&panel=mcp&it=tools` | Name Orders, Endpoint filled, Headers one line, Timeout 10000; under Allowed tools four checkboxes from the server, `search_orders`, `get_order_status`, `create_ticket` ticked and `refund_order` unticked; both saves on | Sam loads the server's tools and allows three |
| 5 | `…&agent=agent_orders&it=saved` | The list: Orders (server icon, `mcp.acme-outfitters.com · 3 tools`, badge **Not checked**) and sendTrackingLink (tool icon, `POST api.acme-outfitters.com/tracking-links`, badge **Not checked**); **Add** in the footer; toast "MCP server added." | Sam saves and the row reads Not checked |
| 6 | `…&agent=agent_orders&panel=tool` | Sheet **Add a tool**: Name, Description, Method (POST) and URL, Parameters with the empty schema, Body (POST only), Headers, Timeout (ms) 10000 with its (i); footer as the MCP sheet | Sam adds the tool that texts a tracking link |
| 7 | `…&agent=agent_orders&it=tested` | The test panel open on the right: "Mia · 0:07", the greeting bubble, one meta line `search_orders · 200 · 0.4 s` with the server icon, the answer bubble *"Order 4471 left the warehouse yesterday and should arrive on Tuesday."*, Listening, **End test**; behind it the Orders row reads **Worked in last test · 14:02** and sendTrackingLink still **Not checked** | Sam tests, the transcript marks the tool and the row shows the result |

### Rainy paths

| Id | URL state | What Sam sees | Recovery |
|---|---|---|---|
| .b | `…&agent=agent_orders&panel=mcp&it=no-tools` | The filled MCP sheet after Load tools: under Allowed tools one line "The server returned no tools. Save it anyway; a test is the only proof it works." and an empty textarea "One tool name per line, or leave it empty to allow every tool."; both saves on | Save writes the server with no `allowed_tools`; the row reads Not checked |
| .c name, MCP | `…&agent=agent_orders&panel=mcp&it=name` | Name reads `orders-prod`, Save pressed: `FieldError` "Use letters and digits only, 1 to 48."; both saves off | Typing a valid name clears it |
| .c name, tool | `…&agent=agent_orders&panel=tool&it=name` | Name reads `mcp_lookup`: `FieldError` "Start with a letter, then letters and digits only, up to 64. Names cannot start with mcp."; both saves off | Same |
| .c limit | `…&agent=agent_orders&it=limit` | The list holds 32 tools; under it one muted line "32 tools, the most an agent can have. Remove one to add another."; Add offers **MCP server** only | Remove from a row menu brings Tool back |
| .d | `…&agent=agent_orders&it=tool-error` | Test panel: greeting, then `sendTrackingLink · 502` in the destructive tone with the tool icon, then the bubble *"I can't send the link just now. Can I take your number and text it after we hang up?"*; the sendTrackingLink row reads **Failed in last test · 14:02** in the danger tint | Sam opens the tool from its row menu, raises Timeout, or removes it |
| .e | `…&agent=agent_orders&it=saved&panel=integration&item=ctx_orders` | Sheet **Edit MCP server** pre-filled: Name Orders, Endpoint, Headers reads "1 header set" with **Replace**, Timeout 10000, Allowed tools three ticked; the Headers (i) ends with "$secrets references are not supported in headers yet." | Replace shows the empty textarea; Cancel restores "1 header set" |
| .f | `…&agent=agent_realtime` | Above the list one muted line "A realtime model uses MCP servers only. Tools stay saved for a cascaded pipeline."; Bookings normal; checkAvailability dimmed (`opacity-60`), its menu offers Remove only; Add offers **MCP server** only | Nothing to fix; picking a preset in Voice & models (P0.2) makes the tools usable again |
| .g flag | `…&agent=agent_orders&kb=on&it=add` | The Add menu with a third item **Knowledge base** (book icon) | Flag off hides it |
| .g sheet | `…&agent=agent_orders&kb=on&panel=knowledge` | Sheet **Add a knowledge base**: an info `Alert` "The v3 API has no knowledge base yet, so this cannot save."; Name; Files drop zone "Drop PDF, DOCX, TXT or MD files, or browse"; footer Cancel · Save, Save off | None: the row cannot ship |
| .g rejected | `…&kb=on&panel=knowledge&it=kb-rejected` | The file list: `handbook.pdf` with `FieldError` "The upload was rejected (403). Check that the project can store files, then try again." and **Try again** | Try again restarts the upload |
| .g too large | `…&kb=on&panel=knowledge&it=kb-large` | `catalogue.pdf · 32 MB` with "catalogue.pdf is 32 MB. The limit is 20 MB a file." and **Remove** | Remove drops the file |
| .g unsupported | `…&kb=on&panel=knowledge&it=kb-type` | `notes.pages` with "notes.pages is not a supported type. Use PDF, DOCX, TXT or MD." and **Remove** | Same |
| .g indexing failed | `…&kb=on&panel=knowledge&it=kb-failed` | Three files: two **Ready**, `prices.docx` with "Indexing failed for prices.docx. Check the file opens, then add it again." and **Remove**; the line above the list "2 of 3 files are ready." | The ready files stay (Retell's partial rule) |
| .h | `…&agent=agent_payments` | The list with sendPaymentLink (**Not checked**); under the list one muted line "Billing FAQ and HubSpot were attached in the current Console and cannot attach to v3 agents yet." with a link **Open Integrations** | The link opens `/integrations` in a new tab; `external_link_opened {surface: integrations}` |
| .i test | `…&agent=agent_orders&it=mcp-401` | Test panel: greeting, then `Orders · MCP server 401` in the destructive tone with the server icon, then the fallback bubble; the Orders row reads **Failed in last test · 14:02** | Sam opens Orders from its row menu |
| .i fix | `…&agent=agent_orders&it=mcp-401&panel=integration&item=ctx_orders` | The edit sheet with Headers on the empty textarea (Replace pressed) and the line "Enter the header again; the saved value cannot be shown." | Save writes the new header; the row returns to **Not checked** |
| .j | `…&agent=agent_orders&it=saved&panel=integration&item=ctx_tracking` | Sheet **Edit tool** pre-filled, Timeout 10000 with its (i) "Default 10000 ms, 1000 to 100000. The agent gives up after this and answers without the tool." | No signal in this row (no execution log; P1.4's error group is blocked on RTM). Sam raises Timeout, or Remove from the row menu |
| leave | `…&agent=agent_orders&panel=mcp&it=leave` | `AlertDialog` "Save your changes?" body "Add an MCP server has unsaved changes." buttons **Discard** · **Keep editing** · **Save** | Save closes with the toast; Discard drops the draft; Keep editing returns |
| remove | `…&agent=agent_orders&it=remove` | `AlertDialog` "Remove Orders?" body "Its header values cannot be recovered. The agent stops using it from the next session." buttons **Cancel** · **Remove** | Remove drops the row, toast "Orders removed.", `integration_removed` |

New search keys, validated in `store.tsx`: `panel` gains `mcp`, `tool`, `knowledge` (an add sheet) and `integration` (the edit sheet); `item` (a context item id, edit only); `it` (`add` \| `tools` \| `no-tools` \| `name` \| `limit` \| `saved` \| `tested` \| `tool-error` \| `mcp-401` \| `leave` \| `remove` \| `kb-rejected` \| `kb-large` \| `kb-type` \| `kb-failed`, review only, never written to the store); `kb` (`on`, the knowledge base flag, kept across `openAgent`). `openAgent` and `toList` clear `item` and `it`; `openPanel(undefined)` clears `item` and `it`. `section=integrations` scrolls to the row (today's `context`).

## 2. Data

File `src/prototypes/agent-builder-v3/data.ts` (tests in `data.test.ts`). Full detail in `00-data.md` section "What the prototype fixtures must contain".

- `ContextItem` becomes the union `McpItem | ToolItem | KnowledgeItem` with `lastTest?: { at, ok, code? }` on the first two; `integrationDetail(item)` derives the fact line.
- `ProtoAgent.legacy?: string[]`.
- `INTEGRATION_LIMITS`, `validateIntegration(kind, draft)`, `toolLimitReached(agent)`, `integrationsFor(agent)`, `integrationPatch(saved, draft)` (each MCP with `transport: "streamable_http"`, each tool with `type: "function"` and `execution: { mode: "sync" }`; `headers` only for an item entered or replaced in this save; realtime writes `pipeline.mllm.mcp_servers`).
- Seeds: new `agent_orders`; `ORDERS_INTEGRATIONS`, `ORDERS_TOOL_LIST`, `LIMIT_TOOLS` for review states; `agent_payments` loses Billing FAQ to `legacy: ["Billing FAQ", "HubSpot"]` and its tool becomes `sendPaymentLink`; `agent_frontdesk` loses Clinic handbook to `legacy`, Calendar gains its fields and a passed `lastTest`; `agent_tutor`'s and `agent_realtime`'s servers gain their fields; `agent_realtime` gains the tool `checkAvailability`.
- Tests as listed in `00-data.md` item 11.
- `parts/events.ts` gains `integration_sheet_opened`, `integration_added`, `integration_removed`, `integration_error_seen`. `app_connected` and `agent_updated` are server events and are not logged by the prototype beyond the existing `agent_updated`.

## 3. Components to reuse

| Need | Component | File |
|---|---|---|
| Row | `AgentBuilderRow id="integrations" label="Integrations"` | `src/components/console/agent-builder/agent-builder-row.tsx` |
| List, empty state, footer Add | `ContextInventory` (list layout), `EmptyRow` | `parts/context.tsx`, `parts/common.tsx` |
| Kind icon with tooltip | `KindIcon` (`Tooltip`) with `CONTEXT_ICON` (`Server`, `Wrench`, `BookOpen`) | `parts/context.tsx`, `src/components/ui/tooltip.tsx` |
| Add menu | `AddContextMenu` on `DropdownMenu`, items icon and name only | `parts/context.tsx`, `src/components/ui/dropdown-menu.tsx` |
| Row state | `Badge variant="outline"`, danger tint for Failed (the agents list's status chip) | `src/components/ui/badge.tsx`, `parts/common.tsx` `StatusBadge` as the sibling |
| Row menu | existing `…` `DropdownMenu`, items **Edit** and **Remove** | `src/components/ui/dropdown-menu.tsx` |
| Sheets | `FormSheet size="compact"` (one per kind; edit reuses the add sheet with a draft) | `src/components/console/form-sheet.tsx` |
| Fields | `Field`, `FieldLabel` + `InfoTip`, `FieldDescription`, `FieldError`, `Input` | `src/components/ui/field.tsx`, `input.tsx`, `parts/common.tsx` |
| Timeout | `InputGroup` with `Input type="number"` and a trailing ms addon, `min`, `max`, `step` 500 (P0.3's number control) | `src/components/ui/input-group.tsx` |
| Headers | P0.3's Headers control: `Textarea` one `Name: value` per line; saved reads "{n} headers set" with **Replace** (`Button variant="ghost" size="xs"`) | `parts/advanced.tsx` (P0.3) or ported into `parts/context.tsx` if P0.3's file is absent |
| Method | `Select` GET, POST | `src/components/ui/select.tsx` |
| Parameters, Body, allowed tool names | `Textarea` with `font-mono text-xs` (as today's Parameters) | `src/components/ui/textarea.tsx` |
| Allowed tools | `FormSheetSection` with `Checkbox` list (as today) and a **Load tools** `Button variant="outline" size="sm"` in its action slot | `src/components/console/form-sheet.tsx`, `src/components/ui/checkbox.tsx` |
| Loading tools | `Spinner data-icon="inline-start"` in the button | `src/components/ui/spinner.tsx` |
| Cannot save, kb | `Alert` (info tint) with `AlertDescription` | `src/components/ui/alert.tsx` |
| Upload progress | `Progress` under the file row | `src/components/ui/progress.tsx` |
| Realtime line, limit line, legacy line, no-tools line | `FieldDescription` muted text; the legacy link is `Button variant="link" size="sm"` with `ExternalLink` | `src/components/ui/field.tsx`, `button.tsx` |
| Guards | `AlertDialog` (P0.3's leave guard; a second for Remove) | `src/components/ui/alert-dialog.tsx` |
| Saved | `sonner` toast | `src/components/ui/sonner.tsx` |
| Footer | **Cancel** · **Save** · **Save and test** (P0.4's sheet footer) | `parts/prompt.tsx` `GreetingSheet` as the sibling |
| Transcript tool line | a `<p className="text-xs text-muted-foreground tabular-nums">` like the panel's timer line, with the kind icon; `text-destructive` on failure | `parts/list-and-create.tsx` `TestPanel` |

No new token, component, radius or font size. No icon per field. The `SecretKeyField` leaves this row (it stays in `parts/model.tsx` for provider keys).

## 4. The row and the sheets, piece by piece

### Integrations row

```
Integrations   ┌────────────────────────────────────────────────────────────────┐
               │ [srv]  Orders                                                   │
               │        mcp.acme-outfitters.com · 3 tools     Not checked      … │
               │ [tool] sendTrackingLink                                          │
               │        POST api.acme-outfitters.com/tracking-links  Not checked … │
               ├────────────────────────────────────────────────────────────────┤
               │                                                        + Add   │
               └────────────────────────────────────────────────────────────────┘
               Billing FAQ and HubSpot were attached in the current Console and cannot attach to v3 agents yet.  Open Integrations
```

- Each row: `KindIcon`, name (`text-sm`), fact line (`text-xs text-muted-foreground`, from `integrationDetail`), then the badge, then the `…` menu. The badge reads **Not checked** (plain outline) when `lastTest` is absent, **Worked in last test** (plain outline) when `lastTest.ok`, **Failed in last test** (outline, danger tint) otherwise; a `text-xs text-muted-foreground tabular-nums` span after the badge shows `lastTest.at` (`HH:mm`).
- Empty list: `EmptyRow` "The agent answers from its prompt alone." and `AddContextMenu`, nothing else. The legacy line renders only when `agent.legacy` has items, always under the box, never inside the empty state.
- The realtime line renders above the list when `pipelineMode === "realtime"`; tool rows get `opacity-60`, `aria-disabled`, and a menu with Remove only.
- The limit line renders under the list when `toolLimitReached`; `AddContextMenu` receives `kinds` without `tool`.
- `AddContextMenu` items: `<Icon />` and the kind name; the `hint` string stays in `CONTEXT_KINDS` for the tooltip on `KindIcon` only. `knowledge` is offered only when `kb=on`.

### MCP server sheet

| Field | Control | API | Default, range (in the (i)) |
|---|---|---|---|
| Name | `Input` | `name` | none; letters and digits only, 1 to 48 |
| Endpoint | `Input` | `endpoint` | none; a URL |
| Headers | P0.3's Headers control | `headers` (write-only) | none; saved reads "{n} headers set · Replace" |
| Timeout (ms) | `InputGroup` number, 1000 to 100000, step 500 | `timeout_ms` | empty; Studio suggests 10000 |
| Allowed tools | `FormSheetSection` with **Load tools**; after a load: `Checkbox` per name (all ticked); after an empty or failed load: the no-tools line and a `Textarea`; before any load: the line "Empty allows every tool the server offers." | `allowed_tools` | empty (every tool) |

`transport` is always `streamable_http` and is never shown. Save enabled when Name and Endpoint pass validation and no field has an error.

### Tool sheet

| Field | Control | API | Default, range |
|---|---|---|---|
| Name | `Input` | `name` | none; starts with a letter, letters and digits, up to 64, never `mcp` |
| Description | `Textarea min-h-16` | `description` | none; 1 to 1024 |
| Method, URL | `Select` (GET, POST) beside `Input` | `server.method`, `server.url` | POST; https only |
| Parameters | `Textarea font-mono` | `parameters` | `{"type": "object", "properties": {}}` |
| Body | `Textarea font-mono`, shown for POST only | `server.body` | empty |
| Headers | P0.3's Headers control | `server.headers` (write-only) | none |
| Timeout (ms) | `InputGroup` number | `server.timeout_ms` | 10000; 1000 to 100000 |

`type: "function"` and `execution: { mode: "sync" }` are always sent and never shown. Save enabled when Name, Description and URL pass, Parameters and Body parse as JSON, Timeout is in range.

### Knowledge base sheet (flag only)

Info `Alert` first; Name; Files drop zone; a file list where each row shows the name, size, and one of: `Progress` with "Uploading {n} %", `Spinner` with "Indexing", **Ready**, or a `FieldError` with the reason and one action (**Try again** for rejected, **Remove** for the rest). Save is always off; the footer reason line reads "The v3 API has no knowledge base yet." No file limit is an API value: 20 MB and the four types are Studio placeholders until the API ships, stated in `00-data.md`.

### Test panel transcript

After the greeting bubble, for each tool the test used, one meta line: `{icon} {name} · {code} · {seconds} s` (`text-xs text-muted-foreground tabular-nums`), then the agent's answer bubble in quotes and italics. A failed tool: `{icon} {name} · {code}` or `{icon} {name} · timed out after {n} s` in `text-destructive`, then the fallback bubble; an MCP failure: `{icon} {server} · MCP server {code}`. The panel's buttons, timer, values body and `agent_audio_heard` stay as P0.3 and P0.4 set them.

## 5. Behaviour

- **Row rename.** `AgentBuilderRow id="integrations" label="Integrations"`; concept A's `section` values and its rail entry follow; the P0.3 realtime behaviour (`contextKindsFor`) is kept.
- **Add.** Picking a kind opens its sheet (`panel=mcp` \| `tool` \| `knowledge`, `replace`), fires `integration_sheet_opened {integrationType, mode: "add"}`. Focus in Name. Focus returns to **Add** on close.
- **Edit.** The row menu's **Edit** opens the same sheet pre-filled (`panel=integration&item=<id>`), title **Edit MCP server** or **Edit tool**, fires `integration_sheet_opened {integrationType, mode: "edit"}`. Headers show "{n} headers set" and **Replace**; Replace switches to the empty textarea with the line "Enter the header again; the saved value cannot be shown." and marks the draft dirty; Cancel restores the count.
- **Draft.** Each sheet holds a draft; nothing writes the store until Save. A store change while open replaces the draft (P0.2 pattern).
- **Validation.** On blur and on Save with `validateIntegration`; `FieldError` under the field, `aria-invalid`; any error keeps Save and Save and test off. Name errors name the rule (.c). Parameters and Body validate as JSON on blur.
- **Load tools.** Sends `tools/list` to the endpoint over streamable HTTP with the draft headers (design mode: `ORDERS_TOOL_LIST` for the Orders endpoint after 800 ms, an empty list for any endpoint containing `empty`, a rejection for any containing `deny`). Success: checkboxes, all ticked; empty or rejected: the no-tools line and the textarea (.b). Changing Endpoint or Headers clears the loaded list. Load tools never blocks Save.
- **Save (add).** Validates, appends the item through `onChange`, fires `integration_added {integrationType, integrationCount}`, `operation_succeeded {operation: integration_attach}`, `agent_updated {surface: "integrations", fields}`, toast "MCP server added." or "Tool added.", closes. The new item has no `lastTest`, so the badge reads **Not checked**. **Save and test** does the same, then opens the test panel (`setTestOpen(true)` in `AgentA`, the P0.3 hook).
- **Save (edit).** Writes `integrationPatch` for that item; headers only when replaced. A replaced header clears `lastTest` (the failure was about the old header), so the row returns to **Not checked** (.i). Toast "MCP server saved." or "Tool saved.".
- **Remove.** `AlertDialog` (the remove state); Remove drops the item, fires `integration_removed {integrationType, ageH}` and `agent_updated`, toast "{name} removed.". No dialog for a knowledge item behind the flag (nothing saved).
- **Limit.** At 32 tools `AddContextMenu` gets `kinds` without `tool` and the limit line shows; MCP servers never count.
- **Realtime (.f).** `integrationsFor(agent)` marks tools unavailable; the line shows; Add offers MCP server only; `integrationPatch` writes `pipeline.mllm.mcp_servers` and never `tools`.
- **Legacy (.h).** `agent.legacy` renders the line and the link; the link opens `/integrations` in a new tab and fires `external_link_opened {surface: "integrations"}`.
- **Test.** In design mode a test on an agent with at least one usable integration plays the greeting at 2 s, the tool line at 4 s (`200`, `0.4 s`, the first usable integration in the list) and the answer bubble at 5 s, and writes `lastTest: { at: HH:mm, ok: true }` to that item on `End test`. A test on an agent with no integration plays the greeting only, as today. The review states `it=tested`, `it=tool-error` and `it=mcp-401` render the transcript and the badges from `ORDERS_INTEGRATIONS` without writing. A failure line fires `integration_error_seen {integrationType, errorCode}` once per test.
- **Leave guard.** Close (X, Esc, overlay) with a dirty draft opens the `AlertDialog`; Discard, Keep editing, Save as P0.3 .h. A draft with an error offers Discard and Keep editing only.
- **Keyboard.** Row: list rows are not focusable; each `…` button, then **Add**, then the legacy link. Sheet (MCP): Name, Endpoint, Headers, Timeout, Load tools, checkboxes or the textarea, Cancel, Save, Save and test. Sheet (tool): Name, Description, Method, URL, Parameters, Body, Headers, Timeout, Cancel, Save, Save and test. Esc closes or opens the guard. `panel=integration` moves focus to Name.
- **Events per action.** `integration_sheet_opened`, `integration_added`, `integration_removed`, `integration_error_seen`, `operation_succeeded`, `agent_updated`, `agent_audio_heard`, `external_link_opened`; each logs once through `trackProto`.

## 6. Copy

Sentence case, no arrows, no em dashes, no ellipsis, no price, spoken lines in quotes and italics. Never: function, connect, connection, connector, plugin, KB, call, conversation, chat, preview, template, SDK, publish, deploy (verb).

| Key | Text |
|---|---|
| Row label | Integrations |
| Empty line | The agent answers from its prompt alone. |
| Add | Add |
| Menu items | MCP server / Tool / Knowledge base |
| Kind tooltip, MCP | MCP server. A server whose tools the agent can use. |
| Kind tooltip, tool | Tool. One HTTPS endpoint the agent can use. |
| Kind tooltip, knowledge | Knowledge base. Files the agent searches before it answers. |
| Fact line, MCP | {host} · {n} tools / {host} · all tools |
| Fact line, tool | {METHOD} {host}{path} |
| Fact line, knowledge | {n} files |
| Badges | Not checked / Worked in last test / Failed in last test |
| Badge time | {HH:mm} |
| Row menu | Edit / Remove |
| Limit line | 32 tools, the most an agent can have. Remove one to add another. |
| Realtime line | A realtime model uses MCP servers only. Tools stay saved for a cascaded pipeline. |
| Legacy line | {names} were attached in the current Console and cannot attach to v3 agents yet. |
| Legacy link | Open Integrations |
| Sheet titles | Add an MCP server / Edit MCP server / Add a tool / Edit tool / Add a knowledge base |
| Footer | Cancel / Save / Save and test |
| Name label | Name |
| Name (i), MCP | Letters and digits only, 1 to 48. The model sees this name. |
| Name (i), tool | Starts with a letter, then letters and digits only, up to 64, never starting with mcp. The model sees this name. |
| Name error, MCP | Use letters and digits only, 1 to 48. |
| Name error, tool | Start with a letter, then letters and digits only, up to 64. Names cannot start with mcp. |
| Endpoint label | Endpoint |
| Endpoint (i) | The server's streamable HTTP URL. |
| Endpoint error | Enter the server URL. |
| Headers label | Headers |
| Headers (i) | One header per line as Name: value. Sent with every request, never shown again after saving. $secrets references are not supported in headers yet. |
| Headers saved | {n} headers set · Replace / 1 header set · Replace |
| Headers re-enter line | Enter the header again; the saved value cannot be shown. |
| Timeout label | Timeout (ms) |
| Timeout (i), MCP | 1000 to 100000. Empty leaves it to the runtime. Studio suggests 10000. |
| Timeout (i), tool | Default 10000 ms, 1000 to 100000. The agent gives up after this and answers without the tool. |
| Timeout error | Enter 1000 to 100000 ms. |
| Allowed tools label | Allowed tools |
| Allowed tools (i) | Empty allows every tool the server offers. |
| Load tools | Load tools |
| Loading | Loading |
| No tools line | The server returned no tools. Save it anyway; a test is the only proof it works. |
| Tool names placeholder | One tool name per line, or leave it empty to allow every tool. |
| Description label | Description |
| Description (i) | What the tool does and when to use it, up to 1024 characters. The model reads it. |
| Description error | Describe the tool so the model knows when to use it. |
| Method label | Method |
| URL label | URL |
| URL (i) | HTTPS only. |
| URL error | Enter an https URL. |
| Parameters label | Parameters |
| Parameters (i) | A JSON schema for the arguments the model fills in. |
| Body label | Body |
| Body (i) | JSON sent with every POST request. |
| JSON error | Enter valid JSON. |
| Toast, added | MCP server added. / Tool added. |
| Toast, saved | MCP server saved. / Tool saved. |
| Toast, removed | {name} removed. |
| Remove title | Remove {name}? |
| Remove body | Its header values cannot be recovered. The agent stops using it from the next session. |
| Remove buttons | Cancel / Remove |
| Guard title | Save your changes? |
| Guard body | {Sheet title} has unsaved changes. |
| Guard buttons | Discard / Keep editing / Save |
| Transcript tool line | {name} · {code} · {n} s |
| Transcript tool error | {name} · {code} / {name} · timed out after {n} s |
| Transcript MCP error | {server} · MCP server {code} |
| Answer after search_orders | *"Order 4471 left the warehouse yesterday and should arrive on Tuesday."* |
| Fallback after a failure | *"I can't send the link just now. Can I take your number and text it after we hang up?"* |
| Fallback after an MCP failure | *"I can't reach the order system right now. Can I take your number and get back to you?"* |
| Knowledge alert | The v3 API has no knowledge base yet, so this cannot save. |
| Files label | Files |
| Drop zone | Drop PDF, DOCX, TXT or MD files, or browse |
| File states | Uploading {n} % / Indexing / Ready |
| File error, rejected | The upload was rejected (403). Check that the project can store files, then try again. |
| File error, too large | {file} is {n} MB. The limit is 20 MB a file. |
| File error, unsupported | {file} is not a supported type. Use PDF, DOCX, TXT or MD. |
| File error, indexing | Indexing failed for {file}. Check the file opens, then add it again. |
| Files summary | {n} of {m} files are ready. |
| File actions | Try again / Remove |
| Knowledge footer reason | The v3 API has no knowledge base yet. |
| Header menu | View last save (P0.3) shows the integrations PATCH body |

## 7. Gate before the commit

`bun run typecheck`, `bunx vitest run src/prototypes/agent-builder-v3`, `bunx biome check --write` on changed files, `git diff --check`, locked word grep on changed UI strings (function, connect, connection, connector, plugin, KB, call, conversation, chat, preview, template, SDK, prototype, simulated, mock, wireframe, arrows, em dashes). P0.1 and P0.2 routes unchanged; P0.3's Advanced sheet unchanged; P0.4's prompt row and greeting sheet unchanged; the test panel touched only as declared. Every URL in section 1 renders at 1600 px and 375 px, light and dark; captures into `flow/NN-<slug>.png` in flow order: 01 empty-row, 02 add-menu, 03 mcp-sheet, 04 tools-loaded, 05 saved-not-checked, 06 tool-sheet, 07 tested-worked, then rainy 08 b-no-tools, 09 c-name-mcp, 10 c-name-tool, 11 c-limit, 12 d-tool-error, 13 e-header-write-only, 14 f-realtime, 15 g-flag-menu, 16 g-sheet, 17 g-rejected, 18 g-too-large, 19 g-unsupported, 20 g-index-failed, 21 h-legacy, 22 i-mcp-401, 23 i-replace-header, 24 j-timeout, 25 leave-guard, 26 remove.

## 8. Figma (after the build)

File `OIKZExT265nOJotBlmv2Ah`, page `v3 · P0 Agent config`, section `P0.5 · Connect other systems to the agent` after P0.4's, child sections 1 JTBD, 2 Research (the 21 shots in `02-research.md` with their regions), 3 Flow (26 story frames), 4 Hero (the row with Orders Worked in last test and sendTrackingLink Not checked; the MCP sheet with tools loaded; the test panel with the tool line and a failed line), 5 Rationale with the three links. Load `figma:figma-use` first.
