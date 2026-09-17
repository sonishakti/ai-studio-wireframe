# 18 · Channels · Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-17-18-channels.png` (the inventory) ·
`before-18-widget.png` (the widget studio) · `before-deploy-hub.png` (byte-identical to the inventory shot,
because `/deploy` redirects onto it).
**Live:** <https://ai-studio-console-redesign.vercel.app/integrations?tab=channels> ·
the builder's Deployment section at `/agents/agt_default/edit?step=2` · the widget at `/deploy/web-widget`.

**Source:**

| Surface | File | Last touched |
|---|---|---|
| The inventory table and its rows | `studio_x_2/components/channels-panel.tsx`, mounted at `app/(dashboard)/integrations/page.tsx`:351 | 2026-09-12 (`0ac8422`) |
| The builder's Deployment section | `studio_x_2/components/wizard/channel-section.tsx` | 2026-09-15 (`302245f`) |
| The widget studio, four mounts, one store | `studio_x_2/components/widget-studio.tsx` · `studio_x_2/lib/widget-config.ts` | 2026-09-15 (`bb75f3b`) · 2026-07-13 (`4c8d7f7`) |
| The go-live action every entry point calls | `studio_x_2/components/wizard/channel-configs.tsx`:64-109 | 2026-09-12 (`0ac8422`) |
| The channel doors | `app/(dashboard)/deploy/{whatsapp,sms,slack,telephony,code,batch-calls}/page.tsx` | 2026-06-24 (`89dbe05`) |

A design exists for phone, web widget, batch and code. **For SMS and for a text-only agent no design exists
at all**: there is no surface, no row and no state, only the type member `sms` in `lib/campaign-data.ts`:21
and the word `chat` in `lib/session-trace.ts`:19. WhatsApp has data and a row and no surface behind them.

## The lock holds

⚠ "One agent ↔ one channel" (2026-06-11, re-affirmed 2026-07-29) survives this research, and the After is
designed inside it. Three pieces of evidence. Nothing in five competitor environments argues for a channel
matrix in the builder: ElevenLabs and Fin both run one agent across many channels and both pay for it with a
per-channel override layer rather than a matrix (`03-learnings.md` §What this does not change). The Engine
contract already enforces the lock for the only channel that exists: `UpdatePhoneNumbersRequest` binds one
`pipeline_id` for inbound and one for outbound, and the Console form is `agentId: string`, singular
(`00-brief.md` §Number-to-agent binding). And two of the three channels a matrix would display have no API at
any version, so a matrix could not be drawn honestly (`00-brief.md` §Summary of Requires Engine).

What moves inside the lock is the **surface** list under Inbound, which already prints
"WhatsApp · Telegram · soon" and already has the door. What does not move is the intent radio.

## What is wrong

1. **Manage is a loop on four of the seven rows.** Click the row menu on Acme WhatsApp and it returns you to
   the page you clicked it from: `channels-panel.tsx`:51 points at `/deploy/whatsapp`, and
   `app/(dashboard)/deploy/whatsapp/page.tsx`:5 redirects to `/integrations?tab=channels`. The same for SMS,
   Slack and telephony. Two more are wrong rather than circular: Manage on "SDK embed", a channel that backs
   Aria, opens the **new agent** wizard (`deploy/code/page.tsx`:7 redirects to `/agents/new/edit?dc=code`),
   and Manage on "Q2 Collections" lands on the whole Monitor with the campaign lost
   (`deploy/batch-calls/page.tsx`:6). Fails JTBD rainy 1.

2. **The list shows a WhatsApp channel that cannot exist, and two records of it disagree.** The row reads
   "Acme WhatsApp · +1 (415) 555-0142 · Survey Bot · Active" (`channels-panel.tsx`:51). The deployment record
   for the same name reads sender +1 (628) 555-0220, agent Support Bot v2, 220 calls, plus a channel prompt
   suffix (`lib/campaign-data.ts`:1399-1411). Both are invented: `grep -ril "whatsapp"` over
   `agora-agents@2.4.0` returns nothing, and there is no WhatsApp page or release note at any version
   (`00-brief.md` §Agora fact-check). A reviewer opening the page concludes someone already built this.
   Fails JTBD rainy 2 and 3, [868ka6ajk](https://app.clickup.com/t/868ka6ajk).

3. **The status enum has three words and this feature is made of the states it is missing.**
   `channels-panel.tsx`:44 is `"active" | "scheduled" | "unassigned"`. There is no word for "Not supported by
   Agora yet", none for "Pending carrier review, submitted 3 Sep", none for "Rejected, reason attached", none
   for "Connected, no agent behind it", none for "Live, no traffic yet". Retell's A2P flow is three approvals
   over two to three weeks with a rejection that cascades downward, and no vendor states a channel's
   readiness on the surface where you pick it (`03-learnings.md` learning 3, `02-research/_docs.md` §What
   nobody does). Fails JTBD rainy 3, 14, 15, 28.

4. **The empty Agent cell renders as a bare comma, and the same literal is what the north-star event sends.**
   Toll-Free carries `backs: ", "` (`channels-panel.tsx`:55), printed unguarded at :154, which is the comma
   visible in the Before shot. The identical string is the publish fallback:
   `components/wizard/agent-wizard.tsx`:838 sends `channel: d.channels.map(channelLabel).join(" · ") || ", "`
   into `deployment_went_live`, into the Monitor query string, and into the toast sentence "is now answering
   on". One missing binding produces a comma on screen and a comma in the funnel. Fails JTBD rainy 6.

5. **The north-star event cannot tell one surface from another, before WhatsApp even arrives.**
   `publishDeployment` takes `channel` as a free-form string (`channel-configs.tsx`:64-109) filled from
   `channelLabel` (`lib/wizard-draft.ts`:487-489), which returns Inbound calls · Batch calls · Code / SDK.
   An agent live on a phone number and an agent live on the web widget both emit `channel: "Inbound calls"`.
   `channel_selected`'s enum is `inbound | batch | code` with no `surfaces` property
   (`references/telemetry/event-spec.json`). Fails the success event in `01-jtbd.md` §Success event.

6. **The install command names a package that is not on npm.** `npm install @agora/agent-sdk`
   (`channel-section.tsx`:495) and `import { AgentClient } from "@agora/agent-sdk"` (:457) both 404 from the
   registry. The package that exists and is documented is `agora-agent-client-toolkit@2.10.0`, with
   `agora-agent-client-toolkit-react` beside it. Every competitor's install line resolves; ours is the only
   one that does not. Fails JTBD rainy 21, [868kykbf8](https://app.clickup.com/t/868kykbf8).

7. **The embed snippet points at a script that 404s.** `widgetSnippet` emits
   `https://cdn.agora.io/agent-widget.js` (`lib/widget-config.ts`:72), repeated in
   `channel-configs.tsx`:339. There is no embeddable widget in the Agora documentation: no page, no bundle,
   no script tag. Studio's own answer to "put this agent somewhere" is a copyable REST call
   (`00-brief.md` §Browser SDK and widget). A user who pastes what we print gets a broken page.
   Fails JTBD rainy 21, [868kykbf8](https://app.clickup.com/t/868kykbf8).

8. **Copying the snippet makes the page claim the widget is embedded.** `copySnippet` calls `markCopied`
   (`widget-studio.tsx`:104-107), so the truth line flips from "Not embedded yet" to "Embed up to date"
   (:131-136) on a clipboard write. Nothing has been embedded, and with no origin, no token exchange and no
   server side we cannot compute whether anything ever is. This is a control whose value we do not have.
   Fails the honesty floor and JTBD rainy 21.

9. **Two buttons in the widget header do the same thing, and the primary fill is on the vaguer verb.**
   `widget-studio.tsx`:173-176: ghost "Get Code" and filled "Embed" both call `studio.copySnippet`. The
   filled button promises to embed and copies. Visible in `before-18-widget.png`. Breaks one door per action
   and one primary CTA per fold.

10. **The widget has no origin, and the inventory shows a domain nothing stores.** `WidgetConfig`
    (`lib/widget-config.ts`:13-40) has no origin, domain or allowlist field, while the row prints
    "Help widget · acme.com/help" (`channels-panel.tsx`:52) as if the widget were bound to that site.
    LiveKit refuses the enable toggle until one origin exists and off-list "the widget receives no token and
    doesn't load"; ElevenLabs puts an Allowlist in the agent's Security tab (`03-learnings.md` §The two
    corrections). Fails JTBD rainy 22.

11. **The builder is never given the lighter widget setup the owner asked for.** `WidgetStyleConfig` takes a
    `lean` prop for builder hot-path mode (`widget-studio.tsx`:328-337), and the only live call site passes
    `agentId` alone (`channel-section.tsx`:185). `lean` is therefore `undefined`, the `{!lean && ...}` branch
    at `widget-studio.tsx`:456 renders the entire styling stack inside the builder, and the lean branch at
    :364-372, which is the door out to the Widget studio, is unreachable code. The owner's 2026-07-28
    decision, "much lighter, simpler setup", does not exist in the running app.

12. **Four channel vocabularies are on screen at once, and one of them is a random number.** The inventory
    filters on Phone numbers · WhatsApp · Web · Batch · Code (`channels-panel.tsx`:28); the builder radio
    offers Batch Calls · Inbound · Code / SDK (`channel-section.tsx`:46-50); Sessions filters on
    Phone · Web · Chat · SIP (`lib/session-trace.ts`:19-26); campaign data names
    Telephony · WhatsApp · SMS · Web (`lib/campaign-data.ts`:21). Two exported constants are both called
    `CHANNEL_LABEL` with different key sets (`campaign-data.ts`:1788, `session-trace.ts`:21). A session's
    channel is drawn from a seeded random over the four words (`session-trace.ts`:195-197), so a run on Acme
    WhatsApp can never say WhatsApp and the Chat filter matches nothing any channel produces. Fails JTBD
    rainy 27, owner question 6.

13. **The page that calls itself "everywhere your agents answer" can add one of the five types it lists.**
    The header line is at `channels-panel.tsx`:76-78 and the only action is "Connect a number (SIP)" at
    :80-83. WhatsApp, web widget, batch and code channels can be created only elsewhere, and the row for each
    of them leads back here. Fails JTBD rainy 1.

14. **The only WhatsApp in the builder is a muted caption with no date and no door.**
    `channel-section.tsx`:175 renders "WhatsApp · Telegram · soon" as a grey line under the two surface
    cards. "Soon" carries no Engine ticket, no date and no way to register that you wanted it, so the demand
    signal `channel_blocked` exists to capture is thrown away at the exact moment the user asks. Fails JTBD
    rainy 3, [868ka6ajk](https://app.clickup.com/t/868ka6ajk).

15. **"Active" is drawn with the primary fill.** `channels-panel.tsx`:157 maps `active` to
    `variant="default"`, so six of seven rows carry a solid black pill. In the Before shot the heaviest ink
    in the table is a status, not the action. Breaks the selected-state and primary-fill rule.

16. **The Deploy breadcrumb parent is a redirect back to this page.** The widget shot reads
    "Deploy › Web Widget", and `/deploy` is in the linkable set (`components/dashboard-header.tsx`:117) while
    `app/(dashboard)/deploy/page.tsx`:7 redirects to `/integrations?tab=channels`. There is no Deploy item in
    the sidebar. The header also keeps crumb labels for `whatsapp`, `sms` and `slack`
    (`dashboard-header.tsx`:50-53), pages that are pure redirects and can never render a crumb.

17. **The retry control is fiction, and Batch dials phone numbers only.** "Retry unanswered" defaults to
    Once (`components/wizard/step-call-settings.tsx`:241-251) with an interval select under it (:258-267).
    Neither `retries` nor `retryIntervalMin` exists in the Console campaign contract or in the published
    docs; the real answer is `/redial/export`, a file you take away
    (`ng-console/src/lib/telephony/telephony-api.ts`:592). No vendor has this control either
    (`03-learnings.md` learning 4). Meanwhile every batch deployment in the data is
    `channel: { kind: "telephony" }` (`lib/campaign-data.ts`:1417 onward), so the outbound half of "put one
    agent on WhatsApp, SMS, web and text" has nowhere to live. Fails JTBD rainy 29 and 31,
    [868kykbf1](https://app.clickup.com/t/868kykbf1).

## What is right, and must survive any redesign

- **One inventory, in one place**, with the agent in a column: a user can read an agent's whole reach
  without opening five pages. No competitor ships this. LiveKit splits it between an Advanced tab and
  dispatch rules; Retell splits voice and chat into two histories that never meet.
- **The intent radio with the surface multi-select inside Inbound.** Five competitor environments produce no
  argument against it (`03-learnings.md` §What this does not change).
- **The channel prompt suffix on the WhatsApp deployment** (`campaign-data.ts`:1410): a per-channel override
  on one agent is exactly what ElevenLabs and Fin both ship, and it is the shape the After needs.
- **The embed truth line's question.** "Is my edit live?" deserves an answer on this surface. The question is
  right; the value we compute for it is not.
- **`publishDeployment` as the single go-live action** from every entry point
  (`channel-configs.tsx`:64-109), so the funnel is measured identically. It needs a channel argument it can
  trust, not a replacement.
- **Switching a channel keeps the departing setup, with an Undo** (`channel-section.tsx`:80-91). Nothing is
  deleted by a change of mind.
