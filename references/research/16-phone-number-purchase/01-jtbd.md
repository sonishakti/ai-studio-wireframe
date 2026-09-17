# 16 · Phone number purchase — JTBD, all types

ClickUp: [16 · Phone number purchase](https://app.clickup.com/t/868m0mf09) (Design Tracker, P0-Sep, XXL, ⚠ lock)
Roadmap parent: [Let developers purchase and assign phone numbers in Studio](https://app.clickup.com/t/868ka68u4)
Evidence: `00-brief.md` (scope · what exists · Agora fact-check) · `02-research/_docs.md` (five vendors, public docs) · `03-learnings.md`

## Headline JTBD

**When my agent already answers me in the browser and the only thing between it and a real customer is a
number they can dial, I want to get one and hear it ring on my own phone in the same sitting, so I can put
this in front of the customer tomorrow instead of opening a carrier account tonight.**

The ⚠ lock does not move this sentence. It moves *when* the sentence starts: owner question 1 decides
whether the number is offered during first run, after it, or granted free
(`00-brief.md` §Open questions). Scenarios that change with that answer are marked **[Q1]** below;
scenarios marked **[Q4]** change with the country slice, **[Q5]** with where KYC sits.

## Success event

The tempting count is numbers sold. It is rejected for the same reason published agents were: a number
that never rings earns Agora $0, and the north star is "first live deployment carrying traffic, then first
paid usage" (CLAUDE.md · LEARNINGS.md:509). Nobody in the teardown ends a purchase on a call
(`02-research/_docs.md` §What nobody does), which is exactly where our number leaks.

**The success event is `first_live_call_received`**, already in
`references/telemetry/event-spec.json` (P0, server-anchored on Agora notification events 201/202, not the
client), with one property added:

- `numberProvenance (purchased | imported | sandbox)`
- `msSincePurchase` on the purchased branch

**The metric:** share of purchased numbers whose first non-test call lands within 24 hours of purchase,
sliced by `numberProvenance`. `answered` and `endReason` already ride on the event, so a call that rang and
died still counts as traffic and not as success.

Two new events, in the spec's shape (`object_verb`, past tense, camelCase properties, stable codes and
buckets per its own rules):

```json
{
  "name": "number_purchase_completed",
  "when": "The commit button in the buy branch of AddPhoneNumberSheet returns an owned number. Once per number, after money moves. Never on search, never on a reservation.",
  "properties": ["builderSessionId", "agentId", "country", "numberType (local|toll_free|mobile)",
                 "areaCode", "monthlyPriceBucket", "kycState (none|cleared|pending)",
                 "searchToCommitMs", "resultRank", "isFirstNumber"],
  "feeds": ["First-ring rate denominator", "Where the first money moment sits relative to the 150-minute nudge"],
  "priority": "P0",
  "hookPoint": "components/add-phone-number-sheet.tsx (buy branch); the Select footer in components/wizard/channel-section.tsx:341 is the entry"
}
{
  "name": "number_purchase_blocked",
  "when": "The buy branch refuses at any step: search, checkout or provisioning. One event carrying the full reason set, the way deploy_blocked already does.",
  "properties": ["builderSessionId", "country", "step (search|identity|payment|provisioning)",
                 "code (country_unavailable|kyc_required|kyc_pending|number_taken|payment_required|payment_declined|cap_reached|no_permission|provider_error)",
                 "recoverable (boolean)"],
  "feeds": ["The actionable-failure list 868kyjfny asks for", "Which rainy scenario below is real and which is theatre"],
  "priority": "P0",
  "hookPoint": "same sheet; codes only, never the provider's free-text description"
}
```

`phone_number_linked` already exists and needs a fourth `source` value, `purchased`, beside
`existing_unassigned | quick_connect | manual_sip`.

**Fact-check carried forward** (full version in `00-brief.md` §Agora fact-check, read 2026-09-17). The
Engine bills $0.10 per agent minute, first 300 free, "the same price even if you bring your own key"
(https://docs.agora.io/en/conversational-ai/overview/pricing), and telephony itself is Beta and "provided
free of charge" (https://docs.agora.io/en/conversational-ai/overview/release-notes). A rented number is the
platform's first recurring per-resource fee, and no meter, plan card or spend cap models one. The
phone-number API is import-only, account-scoped, and its `provider` enum is `byo | twilio`
(`AddPhoneNumbersRequest.d.ts`), so **a number bought from Agora has nothing to identify itself with.**
That third enum value is an Engine dependency to file now, not a design choice.

## Happy scenario

1. "Aria answers me in the browser and she is good, so now I want a number a customer can actually dial."
2. "I open the number field in Deployment and the footer offers to get me one, right beside the option to add my own."
3. "I type my area code and see five real numbers, each with what it costs a month and whether it can dial out as well as answer."
4. "Before I choose, it tells me what the US will want from me, so checkout is not going to ambush me." **[Q5]**
5. "I pick one, the button says buy this exact number for this exact amount, and I press it."
6. "It is mine in seconds, and it says the line is still being turned up, so I know not to test it yet."
7. "The moment it goes active I press call it now, my own phone rings, and Aria says hello."
8. "I hang up and the row shows the number, the agent answering on it, and what it costs me a month."

Step 7 is the end of the flow, not step 6. Provisioning success is not call success (A3 durable rule,
LEARNINGS.md:518), and no vendor in the teardown does this.

## Rainy scenarios

1. **Nothing here yet.** "I have no numbers at all and the page only tells me to bring one from my carrier." (Prototype empty state, `studio_x_2/app/(dashboard)/deploy/phone-numbers/page.tsx:69`; Console's is "Seems like you haven't added any numbers yet", `ng-console/src/lib/i18n/resources/en/common.ts:3507`.)
2. **My country is not in the slice.** "I am in Madrid and the search only knows the US." (Phase-1 lists disagree across tickets, US/Canada/Peru/Brazil vs US/Chile, `00-brief.md` §Scope; no vendor sells outside North America, `02-research/_docs.md` §What nobody does.) **[Q4]**
3. **The country forbids me specifically.** "I found a Brazilian number and then it asked for a local address I do not have." (Twilio's holder address "must be within locality or region covered by the phone numbers prefix" and "a PO Box is not acceptable", https://www.twilio.com/docs/phone-numbers/regulatory/faq.) **[Q4]**
4. **Identity is the checkout step.** "I picked a number and now it wants a government ID before it will sell it to me." (Retell's KYC "unlock[s] outbound calling, phone number purchases, and SMS", https://docs.retellai.com/accounts/kyc; 868keb672 says most countries require KYC for outbound.) **[Q5]**
5. **Identity is still pending after the money moved.** "I paid, and the number sits under review while my calls fail." (Retell's manual review "takes longer"; placement (c) in `00-brief.md` open question 5 needs a pending state on six surfaces.) **[Q5]**
6. **The number went while I was looking at it.** "The one I picked was gone by the time I pressed buy." (Search and purchase are two calls in every product that shows digits, `lk number search` then `lk number purchase`, https://docs.livekit.io/sip/cloud/phone-numbers/; Vapi avoids the whole state by never showing candidates, https://docs.vapi.ai/free-telephony.)
7. **The provider is down and says so badly.** "The search came back with a provider error and there is nothing in it I can act on." (Telephony errors are `{ error_type?, description? }` free text, explicitly "not the Agent Management detail/reason shape", `TelephonyErrorResponse.d.ts`, while 868kyjfny asks for "actionable failures".)
8. **I own it and it does not work yet.** "It says the number is mine but calls do not connect, and nothing tells me whether that is normal." (Vapi: "It can take a few minutes for the phone number to become active. Calls will not work until activation is complete"; LiveKit's status is `active | pending | released | offline`, while our badge is only Active or Unassigned, `deploy/phone-numbers/page.tsx:176-180`.)
9. **There is no card on the account.** "I am the developer, the company card belongs to someone else, and the number is the first thing that has ever asked for one." (`PLAN_USAGE` has no card on file and the 150-minute nudge is the only card capture in the product, `campaign-data.ts:1184-1196` · `free-minutes-nudge.tsx:110-112`.) **[Q1]**
10. **The card declined at the last step.** "It failed at payment and I cannot tell whether I now own a number or not." (No purchase failure taxonomy exists anywhere in the contract, `00-brief.md` §Agora fact-check; `number_purchase_blocked.code` above is the proposal.)
11. **Billing is not mine to touch.** "Buying leads me to a billing page my account cannot open." (`hasBillingAccess` requires the `FinanceCenter` permission, `ng-console/src/lib/billing/billing-access.ts:21-26`, and gates the nav at `src/components/console/console-shell.tsx:863`.)
12. **I hit my spend cap.** "My cap stopped my minutes this month and I need to know the number I rent is not about to disappear with them." (The cap governs per-minute usage only and line fees sit explicitly outside it, `concurrency-card.tsx:34`; no vendor documents this, `02-research/_docs.md` §What nobody does.)
13. **The plan already promised me one.** "The plans page says Free includes one phone number, so why am I being charged for this?" (`app/(dashboard)/billing/plans/page.tsx:48-49` lists "1 phone number" on Free and "10 phone numbers" on Pro, and nothing in the product grants either.) **[Q1]**
14. **Aria already claims a number.** "My sample agent says she is live on a number, so do I already have one or not?" (First run sells "no number to buy", `provisioning-ceremony.tsx:131-132`, then the landing says "Aria, your sample agent, is live on +1 (628) 555-0188", `agents/page.tsx:866` from the seed at :84.) **[Q1]**
15. **It only answers, it cannot dial.** "I bought it for my outbound batch and it turns out it can only take calls." (LiveKit rentals are inbound only with outbound "coming soon", https://docs.livekit.io/sip/cloud/phone-numbers/; Vapi's free number cannot dial out and cannot run a campaign, https://docs.vapi.ai/free-telephony.)
16. **The trunk refuses the call.** "The number is active, the agent is assigned, and the test call drops the second it connects." (Inbound is gated by `allowed_addresses`, whose Console fallback is hardcoded to `["1.1.1.1"]`, `ng-console/src/lib/telephony/phone-number-contracts.ts:88`, so a real carrier IP is not on the list it checks.)
17. **I hang up first.** "It rang, I panicked and hung up before Aria spoke, and the flow congratulated me anyway." (Provisioning success is not call success, LEARNINGS.md:518; `first_live_call_received` already carries `answered` and `endReason`.)
18. **Someone else moved it.** "My colleague pointed this number at a different agent while I had the page open." (`TelephonyPhoneNumberEditStatus` carries `editable · hasInbound · hasOutbound · campaignName · scheduledFor`, `ng-console/src/lib/telephony/telephony-api.ts:270-277`; the prototype hard-locks a number a deployment owns, `number-client.tsx:54-58, 84-97`.)
19. **I released it and the money did not stop.** "I gave the number back to stop the fee and I am still billed for the month." (LiveKit: "If you release a phone number before the end of the month, you are still billed for the entirety of the month", https://livekit.com/pricing; Retell stops the fee at release, https://docs.retellai.com/deploy/purchase-number.)
20. **Release and delete are the same word.** "I removed it from Agora and assumed that ended the rental." (The SDK's own comment on `delete`: "This operation only removes the number configuration from the Agora system; the number stored with the phone service provider is not deleted", while the prototype's Release copy already claims it "returns it to the vendor pool", `deploy/phone-numbers/page.tsx:200`.)
21. **I want those exact digits back.** "I released it by mistake and I had already printed it." (Our own copy is the warning: "You cannot reclaim this exact number", `deploy/phone-numbers/page.tsx:200`.)
22. **I cannot tell which ones I rent.** "Nine numbers in the list and nothing says which are mine from Agora and which I brought." (`provider` is `byo | twilio` with no third value, `AddPhoneNumbersRequest.d.ts`; Retell stamps every row `phone_number_type: retell-twilio | retell-telnyx | custom`, https://docs.retellai.com/api-references/create-phone-number.)
23. **My batch crawls.** "Five hundred rows queued at a trickle and nothing told me my calls per second was the reason." (868keb6t2: "Customer will have a maximum CPS they can configured based on the bundle", and there is no CPS field anywhere in the SDK, `00-brief.md` §Agora fact-check.)
24. **The carrier calls me spam.** "A week of outbound and my number now shows as Spam Likely." (Retell states it plainly: carriers "can sometimes lead telephony providers to ban your number or account", and third-party checks "aren't exact", https://docs.retellai.com/build/telephony/call_efficiency_overview.)
25. **My brand does not show.** "I enrolled the number for branded calling and half my customers still see digits." (868kykk8y's own clause: "Do not promise that every carrier will display a brand or that verification guarantees pickup"; Retell cuts brand names per carrier, 32 characters on T-Mobile and AT&T, 15 on Verizon, US only, 1 to 2 weeks, https://docs.retellai.com/build/telephony/branded-call.)

## What this is not

- **Verified and branded calling.** A business calling profile with per-country enrollment, rejection reasons and brand-display state is a second object with its own lifecycle. Owned by [868kykk8y](https://app.clickup.com/t/868kykk8y), P1, and open question 6 decides whether it joins this design or gets its own JTBD. Scenario 25 above is the seam, not the feature.
- **Porting a number in.** Nobody in the teardown ports, the contract has no port state, and "I already have a number" is already answered by the SIP quick connect and manual SIP branches of `AddPhoneNumberSheet` (`components/sip-quick-connect.tsx`, A3, LEARNINGS.md:518). Open question 2 decides whether that path leads or follows; it does not move here either way.
- **Buying capacity.** CPS as a purchasable ceiling hangs off the capacity parent [868ka690p](https://app.clickup.com/t/868ka690p), not the resell parent, and 22 · capacity SKUs is its own ⚠ lock. A number's monthly fee is a line fee. Scenario 23 is where a user meets the ceiling, and all this feature owes it is a named reason.
- **The invoice.** How a rental appears beside the $0.10 minutes belongs to [868kj8u4v](https://app.clickup.com/t/868kj8u4v) Console billing APIs, and open question 3 is unanswered. This design commits to an exact amount on the commit button and to the cap never taking a rented number away, and stops there.
- **The internal compliance desk.** 868keb672 asks for an "internal operation dashboard to manage all KYC and number". That is an Agora-staff surface. This feature owns only what the customer sees of it: the requirement stated before the price, and a pending state that suppresses the controls it would break.
- **Assigning a number to an agent.** That control already exists and works, at `PhoneNumberSelect` (`components/wizard/channel-section.tsx:298-355`) and on the Console edit route. A purchase is a third branch of the sheet that footer already opens, not a new page (`03-learnings.md`, learning 2).
