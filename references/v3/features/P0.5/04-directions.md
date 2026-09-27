# P0.5 Connect other systems to the agent · Directions

Track: **v3**. Constraints: extend `ContextInventory` and its sheet, do not redraw; existing design system only; one list with an icon and a tooltip per kind (team ask 10, requirement 10); tooltips over helper text (requirement 11); one door per action; empty first, quiet chrome; locked words (integration, MCP server, tool, knowledge base, test, session; never function, connect, connector, KB, call); the v3 API's fields, patterns and limits; a knowledge base that cannot save never ships; this agent's integrations only, reuse across agents is P3.4.

## Three directions

### 1. One list, two sheets, grown to the API and given a state (the extension)
Keep the row as one list and one Add menu. Rename it **Integrations**; the menu offers MCP server and Tool as an icon and a name (Knowledge base only behind the flag). The MCP sheet grows to the API: Name, Endpoint, Headers (P0.3's write-only control), Timeout, Allowed tools with **Load tools** that asks the server and, when it returns nothing, says so and lets Sam type names or leave it empty. The tool sheet grows the same way: Name, Description, Method and URL, Parameters, Body (POST), Headers, Timeout. Name rules and the 32-tool limit become inline errors. Both footers gain **Save and test**. Every row carries a state badge, Not checked until a test uses it, then Worked or Failed in last test with the time, fed by the test panel, whose transcript gains one line per tool used with the code and duration. Edit opens the sheet pre-filled; Remove asks once. Realtime dims tools with a reason; legacy items are named in one line.
Research: today's list, menu and sheets (`shots/before-01-context-row-populated.png`, `shots/before-02-add-menu.png`, `shots/before-03-mcp-sheet.png`, `shots/before-05-tool-sheet.png`), Zapier's failure on the object (`shots/refero-zapier-01-step-error-troubleshoot.png`), Vapi's failure names (`shots/vapi-docs-01-troubleshoot-tools.png`).

### 2. A workspace library and an attach picker (the Vapi and Retell pattern)
Tools and MCP servers become project-level objects on a Tools page (Vapi's Tools tab, Retell's Integrations page), and the agent's row becomes a picker that attaches existing ones. Reuse across agents comes for free and the sheets live on one page. But it is a second surface with no sibling in DESIGN.md and no v3 API object behind it (`mcp_servers[]` and `tools[]` live on the agent, nothing is shared), the KPI's sheet-opened-to-added time gains a page hop, the empty account gets two empty states instead of one, and reuse is P3.4 by decision.
Research: Vapi's Tools tab (`shots/vapi-assistant-model.png`), Retell's Integrations page and its three rows (`shots/retell-19-integrations-available.png`, `shots/retell-agent-editor.png`).

### 3. Three Add doors and a test before you may save (the ElevenLabs pattern)
Split Add into Add MCP server, Add tool and Add knowledge base, and gate the MCP Save behind a trust checkbox and a **Test connection** that must pass. The proof comes before the row exists, so nothing unproven is ever saved. But the team asked for one list and one Add (ask 10), a server that cannot be reached from the browser (CORS, 401 until the header is right) would block a save the API would accept, ElevenLabs itself applies the door to MCP only and leaves webhook tools untested, and .b says the opposite: save as Not checked, a test is the only proof.
Research: `shots/elevenlabs-19-tools-list.png`, `shots/elevenlabs-19-custom-mcp-server-form.png`, `shots/elevenlabs-19-webhook-tool-form.png`.

## Audit

Scored 1 to 5 (5 best).

| Criterion | 1 One list, grown | 2 Library and picker | 3 Three doors, test first |
|---|---|---|---|
| Extend, do not redraw | 5 | 2 | 3 |
| One list, one Add (ask 10) | 5 | 3 | 1 |
| Sheet opened to added, 3 min or less (KPI) | 5 | 3 | 3 |
| Saved is not tested, the test is the proof (.b, KPI) | 5 | 4 | 1 |
| Empty first, quiet chrome | 5 | 2 | 3 |
| Rainy .b to .j in one place | 5 | 3 | 3 |
| API fit (agent-level arrays, write-only headers, no health field) | 5 | 2 | 3 |
| Touches P0.1 to P0.4 (in review) | 4 (row rename, test panel line) | 2 | 4 |
| **Total / 40** | **39** | **21** | **21** |

Cut: 2 builds a shared object the API does not have and moves reuse ahead of P3.4; 3 reverses ask 10 and blocks a save the API allows on a check the browser may not be able to make.

## Pick: direction 1, one list, two sheets, grown to the API and given a state

1. **The list is already right; it lacked the API and a state.** Today's row holds every kind with an icon and a tooltip (`shots/before-01-context-row-populated.png`, `shots/before-02-add-menu.png`), which is ask 10; adding the API's fields, rules and a Not checked, Worked, Failed badge gives the KPI its two ends, `integration_added` and a test with no `integration_error_seen`, with no new surface.
2. **Saved is not tested, for every kind.** ElevenLabs asks for trust and a Test Connection on MCP but nothing on webhook tools (`shots/elevenlabs-19-custom-mcp-server-form.png`, `shots/elevenlabs-19-webhook-tool-form.png`); our Connect always succeeds (`shots/before-04-mcp-connected-tools.png`). The row says Not checked until a test uses it, and **Save and test** makes that test one press away.
3. **The failure is named on the object with a way out.** Zapier prints the failure, the reason and two recoveries on the step that failed (`shots/refero-zapier-01-step-error-troubleshoot.png`); ElevenLabs shows a red dot with no label (`shots/elevenlabs-20-agent-knowledge-base-sources.png`). The transcript line carries the code, the row carries Failed in last test with the time, and the doors are Edit (Replace the header, raise Timeout) and Remove.
4. **Write-only stays write-only and looks like P0.3.** Headers use the control the Advanced sheet already set (textarea, "n headers set · Replace") instead of the bespoke key field in `shots/before-03-mcp-sheet.png`, so .e and .i are one door and the sheet says `$secrets` is not supported in headers yet.
5. **Honest about what the spec lacks.** The knowledge base sits behind a flag and cannot save, with its file states drawn from the only documented vendor failure (`shots/retell-docs-01-kb-source-fails-to-process.png`); items from the current Console are named in one line (`shots/before-08-old-console-integrations-gated.png`) instead of vanishing.

## Questions for the owner (max 3)

1. **Load tools.** The v3 API has no endpoint that lists an MCP server's tools, so Studio asks the server itself from the browser (`tools/list` over streamable HTTP), which some servers refuse. The sheet treats that like .b (one line, type names or leave empty, save as Not checked). Log a tools-list proxy as an API ask, or accept the browser path for launch?
2. **Legacy line placement.** Knowledge bases and HubSpot from the current Console are named in one muted line under the list of the agent they were attached to, with a link to Integrations. Keep it per agent, or move the notice to the Integrations page only?
3. **The success state.** After a test uses an integration without an error the row reads **Worked in last test · 14:02** as a plain outline badge (gray, never green). Keep that wording, or show only Not checked and Failed and let a clean test clear the badge?
