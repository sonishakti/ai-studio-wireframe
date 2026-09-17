# 17 · SIP trunk setup — JTBD, all types

ClickUp: [17 · SIP trunk setup](https://app.clickup.com/t/868m0mf18) (Design Tracker, telephony · P0-Sep, L, 16 days)
Roadmap parent: **Connect telephony, numbers, and SIP providers** (module SIP, `references/clickup-q3-roadmap-export-2026-09-03.tsv:237`); the eight child tasks are in `00-brief.md` §Scope
Evidence: `00-brief.md` (scope · what exists · Agora fact-check) · `02-research/_docs.md` (five vendors, public docs, 2026-09-17) · `03-learnings.md`

## Headline JTBD

**When my agent already talks and the only thing left between it and my customers is the carrier my company
has paid for years, I want to wire that carrier in once and hear my own phone ring, so telephony stops being
the part of this project I dread.**

The tracker's sentence is "connect their own carrier once and never touch it again". Both halves are the job.
"Once" is what stops 17 from being eight separate control groups. "Never touch it again" is what makes a
rotated password, a silent limit and a dead fix link failures of this feature rather than somebody else's
problem.

Six of the eight tasks have no acceptance criteria, so `00-brief.md` §Open questions sets the scope rather than
clarifying it. Scenarios below that change with an answer are tagged **[Q2]** auto versus guided, **[Q3]**
Direct Connect, **[Q4]** the allowlist, **[Q5]** gateway region, **[Q6]** who sets the ceiling, **[Q7]** headers
now or later, **[Q8]** where 11's fix links land.

## Success event

The tempting count is trunks configured. It is rejected for the reason published agents were: a trunk that
never carries a call earns Agora $0, and the north star is first live deployment carrying traffic, then first
paid usage (CLAUDE.md:42).

`phone_number_linked` (`references/telemetry/event-spec.json`, P0) is the nearest existing event and it is the
wrong one on purpose: it fires when a number is bound, and provisioning success is not call success (A3 durable
rule 1, LEARNINGS §20). The prototype already names the right moment, `test_call_connected`, annotated "★ the
real success line" (`studio_x_2/lib/analytics.ts:87-95`), but none of its nine quick-connect events is in the
spec, and `connected` is not one of the spec's allowed verbs.

**The success event is `trunk_test_call_succeeded`**, proposed in the spec's shape:

```json
{
  "name": "trunk_test_call_succeeded",
  "when": "A user-placed test call over a just-configured trunk reaches the agent and the agent speaks. Server-anchored on the Agora notification path first_live_call_received already uses (events 201/202 plus 112), with the client event kept as secondary. Once per trunk per setup session. Never on save, never on a validated credential.",
  "properties": ["builderSessionId", "numberId", "carrier (twilio|telnyx|exotel|other_itsp|unknown)",
                 "setupPath (guided|manual)", "authMode (digest|allowlist|both)",
                 "gatewayRegion (us_west|sa_east|ap_south|unknown)", "transport (tcp|udp|tls)",
                 "attemptIndex", "wallMs", "activeMs", "answered (boolean)", "endReason", "e2eLatencyBucket"],
  "feeds": ["TTFD's channel-connect sub-span, stopped on a call that worked rather than a form that saved",
            "How many attempts a first trunk takes, sliced by carrier and setupPath, which is the evidence that settles open question 2"],
  "priority": "P0",
  "hookPoint": "components/sip-quick-connect.tsx placeTestCall() (:127) and the Manual SIP branch of components/add-phone-number-sheet.tsx; the server anchor sits where first_live_call_received already listens"
}
```

```json
{
  "name": "trunk_setup_blocked",
  "when": "Setup refuses at any step. One event carrying the full code set, the way deploy_blocked already collapses N attempts into one.",
  "properties": ["builderSessionId", "numberId", "carrier", "setupPath",
                 "step (credentials|address|allowlist|test_call)",
                 "code (invalid_credentials|address_unreachable|not_allowlisted|carrier_rejected_invite|no_media|region_mismatch|number_in_use|capacity_reached|no_permission|carrier_unsupported|engine_unsupported)",
                 "allCodes (pipe-joined)", "recoverable (boolean)", "attemptIndex"],
  "feeds": ["Which rainy scenario below is real and which is theatre",
            "The taxonomy 11's three dead fix links need before they get a destination"],
  "priority": "P0",
  "hookPoint": "the same sheet; stable codes only, never the carrier's free-text description"
}
```

`phone_number_linked` needs two properties it cannot honestly source today. Its `vendor` has nowhere to come
from, because the contract's enum is `byo | twilio` with no Telnyx and no Exotel value
(`AddPhoneNumbersRequest.d.ts`, `00-brief.md` §Agora fact-check). Add `carrier` as a stored label beside it,
plus `gatewayRegion`. Learning 2 is that this is a naming problem our own UI closes, not an Engine wait.

**The metric:** share of first trunks that reach `trunk_test_call_succeeded` in the same sitting, denominator
the distinct trunks that reached the credentials step, sliced by `setupPath` and `carrier`. Two windows, never
one: 60 minutes for the number quoted against the target, seven days for the number that feeds activation, and
the gap between them is the finding (event-spec.json §conventions). Speed is reported as p75 of `activeMs` from
the credentials step to the successful call, read from a Trends percentile aggregation, never from the funnel's
time-to-convert view.

The second half of "never touch it again" needs nothing new. `first_live_call_received` already carries
`endReason`, and 11's contract already specifies the quota object Engine must emit on a ceiling
(`limit_type · limit · observed · window_seconds · rejected_count · occurred_at`, `00-brief.md` §Throttle and
capacity). A trunk that connected once and then stopped is those two events read together.

**Fact-check carried forward** (full version in `00-brief.md` §Agora fact-check, read 2026-09-17). Conversational
AI Engine is a flat $0.10 per agent-minute, charged the same on a BYO key, and audio RTC bills separately at about
$0.00099 per participant-minute. Choosing Telnyx over Twilio, choosing a gateway region, or raising a CPS target
does not move what Agora charges. No control in 17 may be framed as a cost lever; throughput, reach and
reliability are the honest axes. Four of the eight tasks need Engine fields that do not exist: the gateway
location (no region field on any phone-number request), SIP headers (`CallTelephonyRequest.Sip` is four fields),
transfer method (no REFER or conference field anywhere in the SDK) and the capacity ceiling (no CPS, concurrency,
queue or retry field). Those are dependencies to file, not things to design around.

## Happy scenario

1. "Aria answers me in the browser, and the only number my customers know is the one my company already rents from Telnyx."
2. "I open the number field on the deployment, and right beside it there is one way to bring my own carrier."
3. "It asks which carrier I am on and Telnyx is there by name, so I am not guessing whether I count as other."
4. "It tells me exactly what to paste into Telnyx, in Telnyx's own words, with the address for my region and the IP ranges to allow."
5. "I do that in the Telnyx tab, come back, and say which of the three addresses I used, so it is not a thing only I know."
6. "I paste the trunk address, the username and password Telnyx gave me, and the IP ranges Telnyx will call from."
7. "I press call my number, my desk phone rings, and Aria says hello."
8. "The row afterwards says the number, Telnyx, which agent answers it, and when a call last got through."

Step 7 is the end, not step 6. Nobody in the teardown ends setup on a call: Vapi has no validation action at
all, ElevenLabs has none after save, and Retell and LiveKit test the agent rather than the trunk
(`02-research/_docs.md` §Verification, in one line). Steps 3 to 5 are a guided path rather than an auto one
because learning 1 settles it: no vendor provisions a trunk from a carrier API key, so
`sip-quick-connect.tsx`'s `setTimeout` provisioning stage is modelling a thing nobody ships.

## Rainy scenarios

1. **Nothing here yet.** "There are no numbers at all and the page only tells me to bring one from my carrier." (`studio_x_2/app/(dashboard)/deploy/phone-numbers/page.tsx:67` is "No phone numbers yet"; the Console's is "Seems like you haven't added any numbers yet", `ng-console/src/lib/i18n/resources/en/common.ts:3507`.)
2. **My carrier is not sayable.** "I am on Telnyx and the only thing this form will let me be is Twilio." (`phone-number-details-section.tsx:109` is a disabled Select with one item; the create path hardcodes `source: "twilio"` at `phone-number-quick-import-sheet.tsx:130`; carrier is not even a column in the list, `phone-numbers-route-module.tsx:471-483`.)
3. **My carrier is nowhere at all.** "I am a regional ITSP and no list in this product has ever heard of me." (868ka68vw widens the job past the two named carriers; the SDK enum is `byo | twilio` while the docs claim support for "Twilio, Exotel, and Telnyx"; all four vendors name carriers in prose and none as a field, `03-learnings.md` learning 2.)
4. **There is no key to paste.** "It asked for my carrier API key and my carrier does not have one." (Vapi's Telnyx guide walks the Telnyx portal and never calls a Telnyx API, Retell's does the same, and ElevenLabs' Twilio SID and Token only rewrite an existing number's webhook, `03-learnings.md` learning 1.) **[Q2]**
5. **It said saved and the first real caller got a 403.** "Green, done, and then my customer heard nothing." (`lib/sip-trace.ts:91-97` is the 403 verdict, "Check the trunk credentials and confirm our signaling IP is allowlisted with your carrier"; Vapi publishes the same consequence, unauthorized 401 on inbound when the gateway list is incomplete, `02-research/_docs.md` §Vapi.)
6. **I saved it and there is no way to find out whether it works.** "The only test available to me is waiting for a real customer to fail." (Vapi has no validation action, no test call and no dashboard form; ElevenLabs offers nothing after save; "Not one of the five ends trunk setup on a call", `02-research/_docs.md` §Verification, in one line.)
7. **The allowlist is what is blocking me and nobody ever showed it to me.** "Every number I have ever created here allows exactly one IP address and it is not my carrier's." (`phone-number-contracts.ts:85-94` falls back to `["1.1.1.1"]`, the create path passes no options at all, `phone-numbers-route-module.tsx:232`, and no screen reads or writes the value.) **[Q4]**
8. **It connects and there is no sound.** "The call answers, everything reads green, and neither of us can hear anything." (ElevenLabs' troubleshooting has "no audio or one-way audio" as one of three headings, answered with "Verify that your firewall allows UDP traffic for the RTP media stream"; Vapi calls US RTP media dynamic with no static IPs while the EU needs UDP 40000 to 60000 fully open; our single allowlist field sits under `inbound_config`, which the SDK calls "SIP inbound call configuration", so it is signalling.) **[Q4]**
9. **I pasted the wrong one of the three.** "My callers are in Mumbai and I gave my carrier the US address because it was first on the page." (Three Origination URIs, `sbc-us-west-1` · `sbc-sa-east-1` · `sbc-ap-south`, https://docs.agora.io/en/conversational-ai/studio/deploy/sip-trunk, and Agora stores no record of which one was used; Vapi states the failure mode as a rule, "Keep the API region and SIP host in the same region".) **[Q5]**
10. **My contract says the audio must stay in Europe.** "Legal will not sign this off until I can point at where the call lands, and the only region control I can find sits on the agent." (`properties.geofence.area` is agent-scoped with six values, `GLOBAL · NORTH_AMERICA · EUROPE · ASIA · INDIA · JAPAN`, restricts which Engine servers are reachable rather than the SIP gateway, and its values do not map onto the three SBCs, `00-brief.md` §Gateway location.) **[Q5]**
11. **The number is already taken, by me.** "It says the number is in use and it is in use on the deployment I set up last month." (`unbind_agent_uuid` sits in the write body, `telephony-api.ts:261-268`; `TelephonyPhoneNumberEditStatus` carries `editable · hasInbound · hasOutbound · campaignName · scheduledFor`, `:270-277`; the prototype hard-locks a number a deployment owns, `number-client.tsx:53-59`.)
12. **Someone moved it while I had the page open.** "I saved my trunk change and a colleague had already pointed the same number somewhere else." (The Console's edit path only preserves what is already stored, `phone-number-edit-session.ts:256-261`, so a concurrent write leaves nothing on screen; the same `TelephonyPhoneNumberEditStatus` is the only concurrency signal that exists.)
13. **The carrier had a bad morning and the record cannot say so.** "Every call failed for an hour and the history just says failed." (`GetTelephonyResponse.d.ts`'s `reason` is limited to `request | hangup | failed`, with no SIP response code, no `Call-ID` and no post-dial delay, `00-brief.md` §Throttle and capacity.)
14. **I hung up before it spoke.** "It rang, I panicked and hung up, and it congratulated me on a working trunk." (Provisioning success is not call success, A3 durable rule 1, LEARNINGS §20; `trunk_test_call_succeeded` above carries `answered` and `endReason` so a ring that died is not a pass.)
15. **My batch crawls and nothing says what set the pace.** "Five hundred rows dialling at a trickle, and the screen shows me the dial rate but never where it came from." (`BatchRuntime` seeds `cps: { target: 3 }` and `retry: { max: 3 }` as literals, `lib/campaign-data.ts:1446, 1480, 1515, 1554`, rendered as two read-only tiles in `components/batch-detail.tsx:167-168`; no control in either codebase sets a CPS target, a trunk capacity or a retry policy.) **[Q6]**
16. **The limit is hit and the fix link goes nowhere.** "It told me to raise the CPS limit, I clicked, and I am looking at a table with no CPS on it." (`lib/sip-trace.ts:188-196` offers "Raise the CPS limit" at `/deploy/telephony`, which is six lines of `redirect("/integrations?tab=channels")`; the 403's "Check the trunk credentials" link and `batch-detail.tsx:122-124`'s "Check the trunk" button land in the same dead place.) **[Q8]**
17. **Raising the limit is not mine to do.** "The only way to get more capacity is a billing page my account cannot open." (The roadmap carries "Self-service phone number CPS", P0 2026-09, backlog note "Calls-per-second purchase", which puts the ceiling in Billing; `hasBillingAccess` requires the `FinanceCenter` permission, `ng-console/src/lib/billing/billing-access.ts:20-26`, and gates the nav at `console-shell.tsx:863`.) **[Q6]**
18. **There is no card on the account anyway.** "I need more lines to stop the queue and the company card is not mine to add." (Concurrent lines are $8 per line per month, `lib/campaign-data.ts:1226-1232`; `components/concurrency-card.tsx:37-38` already makes "Keep queuing" a first-class choice, so paying is one branch and not the only one.)
19. **Throttled reads as broken.** "My batch says it is throttled and my manager has decided it failed." (D1's own rule, "a batch dialing at its concurrency/CPS ceiling is working as designed, NOT failing", `lib/campaign-data.ts:87-90`; `PACING_META` already makes Paced primary and only degraded destructive, `:356-364`; Retell is the only vendor that queues outbound excess rather than rejecting it, `03-learnings.md` learning 5.)
20. **Transfer drops the caller.** "The agent hands the call to a human and the customer hears silence." (LiveKit states the precondition plainly, "you must configure your provider trunks to allow call transfers", and Twilio makes it a labelled toggle, Call Transfer (SIP REFER); our whole transfer surface is one destination box beside an "Enforce E.164 format" checkbox, `phone-number-transfer-section.tsx:58-83`, with no REFER-versus-conference choice, no fallback, and nothing naming SIP.)
21. **My carrier will not carry what I need on the call.** "My CRM needs an X- header on every call and there is nowhere to put one." (`CallTelephonyRequest.Sip` carries exactly four fields, `to_number · from_number · rtc_uid · rtc_token`, and `properties.labels` is returned in webhooks rather than put on the wire; Retell, ElevenLabs and LiveKit all ship an ordinary header control, `02-research/_docs.md`.) **[Q7]**
22. **Disconnect did not disconnect anything.** "I removed the credential here and assumed that stopped Telnyx." (`sip-quick-connect.tsx:314` already says it: "Disconnect stops Agora using this credential. It doesn't revoke or rotate it at Telnyx"; A3 durable rule 4.)
23. **Six months later it breaks itself.** "Security rotated the SIP password in January and the first I heard was customers complaining in March." (Nothing in either codebase surfaces credential age, rotation or last successful call; the only feedback is the 403 in `lib/sip-trace.ts:91-97`, and "never touch it again" is the headline JTBD.)
24. **Direct Connect is a word I keep being sold and cannot find.** "My account team keeps saying Direct Connect and the product only offers me a SIP trunk." (868khj9wx is P0 Sep while its metering and audio-quality siblings are already DELIVERED, TSV rows 257 and 258, and nothing in `references/` says what the Studio integration exposes.) **[Q3]**

## What this is not

- **Getting a number in the first place.** Searching, buying, KYC and the monthly rental fee belong to [16 · Phone number purchase](https://app.clickup.com/t/868m0mf09), which is a ⚠ lock with its own JTBD. 17 starts from a number the customer already owns at a carrier they already pay, and Agora sells none (LEARNINGS §20, 2026-07-09 fact-check F2; the copy is already written at `sip-quick-connect.tsx:206-207`).
- **Working out whose fault a call was.** The ladder, the verdict, the attribution and the per-leg timings shipped with **11 · SIP & latency diagnostics** (`components/sip-ladder.tsx`, `sip-verdict.tsx`, `lib/sip-trace.ts`, contract at `ng-console` commit `94c2d573`). 17 owes 11 exactly one thing: a real destination for the three fix links it already ships, all of them the same one. Scenario 16 is that seam.
- **Selling capacity.** A CPS ceiling as a purchasable SKU sits with the capacity parent and with **22 · Usage, credits & concurrency**, which is its own ⚠ lock, and it lands in Billing rather than Deploy. 17 owns the trunk's ceiling as a property of the trunk and the honest reason shown when a batch meets it. Open question 6 decides whether even that is ours.
- **Channels that are not telephony.** WhatsApp, SMS, Slack and the web widget are **18 · Channels**, a ⚠ lock. Nothing in 17 may add a second door for them; the existing `AddPhoneNumberSheet` has six mount points and gets no sibling (`00-brief.md` §It folds into the existing sheet).
- **Warm transfer with a spoken summary.** "[SIP] Warm Transfer w/ LLM-based in-call summary" is its own P1 roadmap row (TSV row 212). 17 owns only 868kubh2w's narrower promise, that a REFER or a conference does not degrade or drop the caller. Scenario 20 is where the two meet.
- **Binding a number to an agent.** That control exists and works, at `PhoneNumberSelect` (`components/wizard/channel-section.tsx:298-355`) and on the Console edit route. Connecting a carrier is a branch of the sheet that footer already opens, not a new page (owner rule, reuse don't redesign, 2026-09-12).
- **The carrier's own console.** 17 tells the customer precisely which values to paste where, in the carrier's words, with Agora's three Origination URIs and its per-country signalling IPs inline. It does not log into Telnyx for them, and no vendor in the teardown does either.
