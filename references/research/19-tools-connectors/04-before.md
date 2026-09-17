# 19 · Tools & connectors: the Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-19-integrations.png` and
`before-19-extensions.png`, light mode, 2026-09-17.
**Live:** <https://ai-studio-console-redesign.vercel.app/integrations> ·
<https://ai-studio-console-redesign.vercel.app/extensions>
**Source:**
`studio_x_2/app/(dashboard)/integrations/page.tsx`, the five-tab Resources page, last changed
2026-09-12 (`0ac8422`) ·
`studio_x_2/components/wizard/step-build.tsx` :48–169 `SectionKnowledgeTools` and :194–448
`ResourceField`, last changed 2026-09-15 (`ffea129`) ·
`studio_x_2/components/catalog-card.tsx`, the connector card, last changed 2026-06-24 (`89dbe05`) ·
`studio_x_2/app/(dashboard)/extensions/page.tsx` and
`studio_x_2/app/(dashboard)/extensions/[name]/extension-client.tsx`, last changed 2026-09-12
(`0ac8422`) ·
data at `studio_x_2/lib/campaign-data.ts` :1724–1779 and `studio_x_2/lib/agent-resources.ts`.

Three of the five roadmap tasks have no design at all here: no custom HTTP tool exists anywhere in
`studio_x_2` ([868kyjfp1](https://app.clickup.com/t/868kyjfp1),
[868ka25w5](https://app.clickup.com/t/868ka25w5)), a structured output is a field on one agent
rather than a resource ([868khqaqj](https://app.clickup.com/t/868khqaqj)), and there is no hosted
code tool ([868kykbfa](https://app.clickup.com/t/868kykbfa)).

What is on screen today: a Resources page with five tabs, whose Connectors tab is a six-card grid
over a hard-coded list and whose MCP tab is a list of four sample servers plus a create form; a
second, separate marketplace at `/extensions` with six cards under the account sidebar; and, in the
agent builder's third section, three rows called Knowledge base · MCP servers · Tools & connectors.
The real Console already ships the Custom Tools tab, the no-code HTTP tool form and a per-tool test
endpoint (`00-brief.md` §A). None of that is here.

## What is wrong

1. **The row that names this feature contains none of it.** `SectionRow id="wz-5-connectors"` is
   labelled "Tools & connectors" and holds a count line, a Name/Status header and a switch per
   connector: no tool, no way to make one, no door to one
   (`studio_x_2/components/wizard/step-build.tsx` :117–163). The label promises the object the
   feature is about and the row cannot produce it.
   → [868kyjfp1](https://app.clickup.com/t/868kyjfp1), JTBD rainy 1.

2. **That row is the only one in its section that is not a `ResourceField`.** Knowledge base
   (:68–91) and MCP servers (:93–113) are chips plus a search-and-stage sheet with a Save footer and
   a Create New door; the connector row beside them is a hand-rolled table with no chips, no search,
   no sheet and no create (:118–162). Three rows, two idioms, one screen. The sibling to extend is
   already on the same page. → owner rule "reuse, don't redesign", 2026-09-12; JTBD rainy 1.

3. **Nothing on any tools surface can say whether a tool works.** There is no test anywhere in
   `studio_x_2`, and `McpServer` carries `id · name · url · tools` with no status field at all
   (`studio_x_2/lib/campaign-data.ts` :1743–1748), while the shipped Console's
   `GET /mcp/{id}/status` already returns `{ status, lastDetectedAt, connectivityTest }`
   (`ng-console/src/server/studio-v2/integrations-handlers.ts` :228–244). A server that stopped
   answering three days ago looks exactly like one that answered a second ago.
   → JTBD rainy 3, rainy 13.

4. **Tool discovery is fiction, and the button says otherwise.** `discoverTools()` takes no
   arguments and returns `search · create_record · update_record` for every URL
   (`studio_x_2/lib/agent-resources.ts` :197–203), and `createMcpServer` calls it unconditionally
   (:205); the button that triggers it reads "Create and discover tools"
   (`components/wizard/step-build.tsx` :604). Type any hostname and the product reports the same
   three tools. → JTBD rainy 12.

5. **The four sample MCP rows claim a tool count and cannot name one tool.** `MCP_SERVERS` hard-codes
   `Deepwiki · 8 tools`, `Shopify MCP · 12 tools`, `Notion MCP · 6 tools`, `Test MCP · 2 tools`
   (`lib/campaign-data.ts` :1751–1756); the same rows render a "12 tools" badge beside a Configure
   button that is disabled, titled "Sample server · create your own to configure its tools"
   (`app/(dashboard)/integrations/page.tsx` :250–259). The count and the disabled button contradict
   each other on one line. → JTBD rainy 12.

6. **Four of the six connectors offer a connection the server refuses.** Salesforce, Google Calendar,
   Zendesk and Slack all open the mock authorize dialog and flip to Connected
   (`app/(dashboard)/integrations/page.tsx` :304–341, `lib/agent-resources.ts` :238–249), while the
   Studio server throws `INVALID_BODY "provider must be hubspot"` for every provider but HubSpot
   (`ng-console/src/server/studio-v2/integrations-handlers.ts` :921–928). The dialog says "You'll be
   sent to Slack to authorize access, then returned here." and nothing is sent anywhere
   (:331). → [868kbyqdm](https://app.clickup.com/t/868kbyqdm), JTBD rainy 2.

7. **Disconnecting a live connector is one click on the card body, with no confirmation.**
   `CatalogCard` wraps the whole card in a button (`components/catalog-card.tsx` :141–143), and a
   connected card passes `onAction` straight to `disconnect`
   (`app/(dashboard)/integrations/page.tsx` :313–318, :99–103), which writes localStorage and shows
   a toast with no undo. Clicking the HubSpot title to read it detaches HubSpot from every agent
   using it. → JTBD rainy 15, rainy 16.

8. **Every card in the Extensions marketplace opens the same page, for a product that is not in the
   catalog.** All six ids map to one fixture (`app/(dashboard)/extensions/[name]/extension-client.tsx`
   :82–90), so "ActiveFence Content Moderation" opens a page titled "Face AR Effects by Deepar.ai"
   listing face masks and background removal (:38–58), and its install step reads
   `npm install agora-extension-face-ar agora-rtc-sdk-ng` (:68), a package name belonging to neither
   the card clicked nor anything in this product. → CLAUDE.md open IA tension 3,
   [868kbyqdm](https://app.clickup.com/t/868kbyqdm).

9. **The Extensions fold is four primary fills, an outbound icon on an inbound link, and four
   invented prices.** Four black Install buttons sit in one fold
   (`app/(dashboard)/extensions/page.tsx` :94–104); each carries an external-link icon (:102) on a
   `Link` to the internal route `/extensions/{id}` (:100); and each card prints one of
   "Pay-per-use" · "Free tier available" · "Contact sales" · "Free trial" from a hard-coded string
   (:22, :31, :40, :49, :58, :67) with nothing behind it. → one primary CTA per fold; honesty floor.

10. **The MCP create form throws away the headers you typed.** The form collects repeatable header
    rows with the placeholder "Authorization / Bearer …"
    (`components/wizard/step-build.tsx` :546, :577–598) and then saves with
    `createMcpServer({ name, url, transport })` (:602), whose signature has no `headers` parameter
    (`lib/agent-resources.ts` :204). An authenticated server saves as an anonymous one and the user
    is told "MCP server created". → JTBD rainy 9.

11. **The transport the form defaults to, and the URL it accepts, are both ones the Engine refuses.**
    Transport defaults to `sse` (`components/wizard/step-build.tsx` :545) while
    `llm.mcp_servers[].transport` takes only `"streamable_http"`
    (https://docs.agora.io/en/api-reference/api-ref/conversational-ai/join); and the validator
    `/^https?:\/\/.+/` (:549) accepts `http://` under an error line that reads "Enter a valid https
    URL." (:559). The form saves servers the runtime cannot run and states a rule it does not
    enforce. → JTBD rainy 5, [868ka25w5](https://app.clickup.com/t/868ka25w5).

12. **One destination has five names, and the link that points at it lands somewhere else.** The
    Resources page links to "Knowledge & Tools section" (`app/(dashboard)/integrations/page.tsx`
    :144, :215), its own toast says "Prompt & tools" (:96), the command palette says "Knowledge, MCP
    & connectors" (`components/command-palette.tsx` :86), the row says "Tools & connectors"
    (`components/wizard/step-build.tsx` :117), and the section is actually titled "Prompt &
    knowledge" (`components/wizard/types.ts` :22). The link target `/agents?step=3` opens a fresh
    builder rather than the agent the user came from
    (`app/(dashboard)/agents/page.tsx` :570–576). → JTBD rainy 22.

13. **Three search fields on this feature do nothing.** The knowledge, MCP and connector search
    inputs are rendered with a placeholder and no `value` and no `onChange`
    (`app/(dashboard)/integrations/page.tsx` :149, :220, :290), and the connector grid maps the full
    catalog unfiltered (:304). The Before shot shows the Connectors search box above six cards it
    cannot narrow. → JTBD rainy 1.

14. **The builder rail counts attachments and calls them tools.** The section summary is
    `draft.mcp.length + draft.connectors.length` printed as "N tools"
    (`components/wizard/agent-wizard.tsx` :985–986), so an MCP server exposing twelve tools counts
    as one and the number on the rail is never the number of tools the agent has. The 32-tool
    ceiling the Engine enforces after filtering has no expression at all. → JTBD rainy 7, honesty
    floor.

15. **The power-user escape hatch cannot express a tool or the switch that runs one.**
    `CUSTOM_CONFIG_SECTIONS` is `asr · llm · tts · avatar · turn_detection · interruption ·
    conversation · sal` (`lib/wizard-draft.ts` :106–108), so `advanced_features.enable_tools` typed
    into the drawer is reported as overriding nothing (:123–129) and the skeleton offered on open
    never mentions it (:110–119). `advanced_features.enable_tools` defaults to `false`, and the
    contract says tools are then validated but not invoked, which is the difference between an agent
    that acts and one that invents an answer. → JTBD rainy 4,
    [868ka25w5](https://app.clickup.com/t/868ka25w5).

16. **A realtime agent is offered connectors it cannot run.** The builder has an `mllm` pipeline
    (`components/wizard/stack-config.tsx` :255, :292) and `step-build.tsx` contains no reference to
    it, so the Tools & connectors row renders identically for a realtime agent, while the shipped
    Console hides Custom Tools and Connectors on that path behind "Realtime and Default LLM agents
    only support MCP servers." (`ng-console/src/components/console/agent-detail-page.tsx` :266–267,
    `src/lib/i18n/resources/en/common.ts` :1967–1968). The honesty floor exists in the live product
    and is missing from the sandbox. → JTBD rainy 11.

17. **The region disclosure names three endpoints and a tool is a fourth.** "LLM, TTS and ASR vendors
    process data at their own endpoints" (`components/wizard/hosting-region.tsx` :71–80) is the whole
    statement, and a custom tool, an MCP server and a connector each send caller data to a host the
    customer picked, outside the pinned region, unnamed. → JTBD rainy 19.

18. **Structured outputs are a field on one agent, written from two doors into one hard-coded key.**
    `DataPoint` lives inside `AnalysisConfig` on the agent draft (`lib/wizard-draft.ts` :151–169),
    edited in the builder's "Post-Call Data Extraction" block
    (`components/wizard/step-analysis.tsx` :106–127) and again from Monitor through the same
    component writing `sx:call_capture:agt_default` (`components/call-capture-sheet.tsx` :20, :55),
    a key that names one agent and a sheet subtitled "Applies to Aria." (:52). Nothing here is
    attachable, shareable or reusable. → [868khqaqj](https://app.clickup.com/t/868khqaqj), JTBD
    rainy 23.

19. **Hosted code tools have no state on screen, not even a refusal.** Nothing in `studio_x_2` names
    them, and `llm.tools[].function.execution.mode` has the single value `"sync"` with `server`
    required, so there is nothing to run customer code on. Retell and ElevenLabs both ship one
    (`03-learnings.md` learning 5), so a user arriving from either finds silence where the live
    Console would have shown a reason. → [868kykbfa](https://app.clickup.com/t/868kykbfa), JTBD
    rainy 21.

20. **The connector status enum has no word for a connection that has stopped working, or one a
    teammate made.** `status: "connected" | "available" | "coming-soon"`
    (`lib/campaign-data.ts` :1762–1770) and `effectiveConnectorStatus` collapses everything to those
    three (`lib/agent-resources.ts` :246–249). There is no account name, no connected-by, no
    last-checked and no failing state, so "the token expired" and "working perfectly" render the
    same green Connected badge. → JTBD rainy 13, rainy 14.

## What is right, and must survive any redesign

- **`ResourceField` is the idiom**: chips for what is attached, a sheet with search, a staged switch
  per row and a Save footer so a dismissed sheet ships nothing, and a Create New door under the
  roster (`components/wizard/step-build.tsx` :194–448).
- **An attached item that has gone unavailable is flagged, not shown as healthy** (:279–295). That is
  the only place in this feature where a broken attachment is visible.
- **`coming-soon` is truly inert**: no anchor, no tab stop (`components/catalog-card.tsx` :133–135).
- **Knowledge, MCP and connectors sit upfront in one section, unnested** (owner 2026-07-29;
  `components/wizard/agent-wizard.tsx` :1367–1369).
- **Resources and the builder write one store**, so a server created in either shows up in both
  (`app/(dashboard)/integrations/page.tsx` :192, :269).
- **The empty state is the row itself**: a copy card with the door on its right, not a separate
  screen (`components/wizard/step-build.tsx` :301–313).
