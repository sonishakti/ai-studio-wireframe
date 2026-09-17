# 16 · Phone number purchase: Before, and what is wrong with it

**Before:** `references/research/_before10-2026-09-17/before-16-phone-numbers.png` and
`references/research/_before10-2026-09-17/before-17-18-channels.png` (light mode, 2026-09-17).
Live: <https://ai-studio-console-redesign.vercel.app/deploy/phone-numbers>
Source: `studio_x_2/app/(dashboard)/deploy/phone-numbers/page.tsx` (the list, last touched 2026-06-24,
`89dbe05`), `studio_x_2/app/(dashboard)/deploy/phone-numbers/[id]/number-client.tsx` (the detail),
`studio_x_2/components/add-phone-number-sheet.tsx` (the only add door),
`studio_x_2/components/wizard/channel-section.tsx` (`PhoneNumberSelect`, where a number is chosen), and
`studio_x_2/components/channels-panel.tsx` (Resources › Deployment Channels, the second list of the same
object), all last touched 2026-09-12 (`0ac8422`). Data: `studio_x_2/lib/campaign-data.ts` (2026-09-15,
`302245f`). The live Console equivalent is `ng-console/src/features/telephony/phone-numbers/`.

A design already exists for **holding** a number, so this is a Before → After for the list, the row, the
sheet and the select. **No design exists for any part of getting one**: nothing in either codebase
searches, prices, names a country, states an identity requirement, shows a provisioning state, records an
owner, or treats release as a money event.

What is on screen today: one table of nine rows (Number · Label · Vendor · Assigned to · Status), one
primary action, "Add Phone Number", one row menu (Edit configuration · Assign to batch · Release), and a
sheet whose subtitle says the feature being designed is impossible.

## What is wrong

Each item ties to a JTBD rainy scenario (`01-jtbd.md`) or to the roadmap ticket it fails.

1. **The row has no word for a number that is owned and not yet working.** The model carries
   `status: "active" | "unassigned"` (`lib/campaign-data.ts:402`) and the list renders exactly two badges
   from it (`deploy/phone-numbers/page.tsx:176-180`). A number mid-turn-up has to pick one of two lies.
   Worse, `PhoneNumberSelect` offers only `status === "unassigned"`
   (`components/wizard/channel-section.tsx:311`), so a just-bought number is either offered as ready to
   answer calls or disappears from the only place it can be assigned. LiveKit ships four states,
   `active · pending · released · offline` (`03-learnings.md`, learning 3). → rainy 8.

2. **Status and Assigned to answer the same question twice, in two words, and neither answers whether the
   number works.** The badge says "Unassigned" (`page.tsx:179`) on the same row where the Assigned-to cell
   says "Available" in italics (`page.tsx:151`). Check row 6 and row 8 of `before-16-phone-numbers.png`.
   → rainy 8.

3. **Provenance is a "Vendor" column, and vendor cannot say "bought here".** The column
   (`page.tsx:131`) prints Twilio, Vonage, Bandwidth and Meta straight from the seed
   (`lib/campaign-data.ts:1612-1688`). Bandwidth is also the carrier Agora resells through
   ([868keb672](https://app.clickup.com/t/868keb672)), so on launch day the word "Bandwidth" means two
   opposite things on the same list. The contract cannot break the tie either: `provider` is a closed
   `byo | twilio` (`AddPhoneNumbersRequest.d.ts`). Retell stamps every row
   `retell-twilio | retell-telnyx | custom` in the same response as the agent binding. → rainy 22,
   `03-learnings.md` learning 1.

4. **The first-run home claims a phone number the account never acquired, and three surfaces disagree
   about which number it is.** `app/(dashboard)/agents/page.tsx:84` seeds Aria with
   `channelLabel: "+1 (628) 555-0188"` and the banner at `:866` reads "Aria, your sample agent, is live on
   +1 (628) 555-0188", with an InfoHint at `:868-871` calling it "an Agora sandbox line". The inventory
   says those digits are `pn_02` "Sales Inbound", vendor Twilio, assigned to deployment `dp_ib_02`
   (`lib/campaign-data.ts:1618-1625`), and the Before shot shows them under the agent "Sales Front Desk".
   The actual sandbox seed is `pn_06`, +1 (628) 555-0260 (`:1654-1662`), whose own comment claims it
   matches `TEST_INBOUND_NUMBER`, which is +1 (415) 555-0100 (`:1142`). Deployment Channels shows the same
   0188 backing "Aria" (`components/channels-panel.tsx:50`). Four values, one number. → rainy 14, and the
   evidence the owner needs for question 1.

5. **Two inventories of one object disagree on how many exist.** Deployment Channels counts
   "Phone numbers 3" from a hand-written seed (`components/channels-panel.tsx:48-55`,
   `before-17-18-channels.png`); the Phone numbers page counts "9 total · 7 assigned · 2 available"
   (`page.tsx:99-109`, `before-16-phone-numbers.png`). A purchase would have to land in both and can
   reconcile neither. → rainy 18 · [868kyjfny](https://app.clickup.com/t/868kyjfny), which asks Studio to
   show "the current owner and assigned agent for each number".

6. **A channel row prints a bare comma where the agent name goes.** `components/channels-panel.tsx:54`
   sets `backs: ", "` on the Toll-Free row, and the Agent cell renders it. Last row of
   `before-17-18-channels.png`. → rainy 22.

7. **A prop passed as `null` deletes the one honest money sentence in the product, in two of the three
   places it is mounted.** `AddLinesSheet` is the purchase pattern this feature must port. Mounted from
   the builder (`components/wizard/step-call-settings.tsx:484`) and from live monitoring
   (`app/(dashboard)/monitor/live/page.tsx:214`) it receives `capHeadroomUsd={null}`, so
   `components/concurrency-card.tsx:262` computes `capMinutes` as null and the entire paragraph at
   `:340-348` never renders: no "your $X headroom lasts ≈N min", no warning that the cap would pause calls
   before the purchase pays off. Only the Monitor mount (`concurrency-card.tsx:212`) still says it.
   → rainy 12.

8. **Nothing on any number surface carries a price, and the money model has no line-item axis.** No cost
   column on the list (`page.tsx:128-133`), no cost field on the detail page
   (`number-client.tsx:114-146`), and `PLAN_USAGE` holds minutes plus one dollar cap and nothing else
   (`lib/campaign-data.ts:1184-1196`). A rented number is the platform's first recurring per-resource fee
   and there is no row for it. → [868kj8u4v](https://app.clickup.com/t/868kj8u4v) · rainy 12.

9. **The plans page already sells numbers the product does not grant.**
   `app/(dashboard)/billing/plans/page.tsx:48` lists "1 phone number" under Free and `:49` lists
   "10 phone numbers" under Pro. Nothing in either codebase grants either. Today it is a bug; the day
   numbers are real it is a promise. → rainy 13, and it becomes the spec if owner question 1 answers (c).

10. **There is no card door on the way to a number, and no permission state at all.**
    `PLAN_USAGE.cardOnFile` is `false` (`lib/campaign-data.ts:1188`) and the only card capture in the
    product is `FreeMinutesNudge`, mounted once on `app/(dashboard)/monitor/page.tsx:126` at the
    150-minute mark. A grep for `permission` across `studio_x_2/lib`, `components` and `app` returns
    nothing, while the live Console gates billing behind the `FinanceCenter` permission
    (`ng-console/src/lib/billing/billing-access.ts:21-26`, used at
    `ng-console/src/components/console/console-shell.tsx:863`). → rainy 9 · rainy 11.

11. **Release is one word doing three jobs and the sentence under it is false today.** The row menu's only
    destructive action is Release, described as "Releasing this number returns it to the vendor pool. You
    cannot reclaim this exact number." (`page.tsx:196-208`). The SDK's own comment on `delete` says it
    "only removes the number configuration from the Agora system; the number stored with the phone service
    provider is not deleted", so for a brought number the copy overclaims; for a rented one it says
    nothing about the fee stopping, which is the only question that matters. There is no Delete in the
    menu to carry the other meaning. → rainy 19 · 20 · 21, `03-learnings.md` learning 5.

12. **"Assign to batch" is a dead control.** `page.tsx:193` renders the item with no `onSelect` and no
    link. Click it and the menu closes. → [868kyjfny](https://app.clickup.com/t/868kyjfny), "assign or
    reassign it to an agent".

13. **The help link at the point of confusion 404s, and the sheet's own link goes to the docs front
    door.** `app/(dashboard)/help/page.tsx:46` offers "Setting up Twilio as a telephony vendor" pointing at
    `https://docs.agora.io/en/conversational-ai/voice-call/sip-twilio`, which returns 404 (checked
    2026-09-17); the page that exists is `/conversational-ai/studio/deploy/sip-trunk`. In the add sheet the
    link is labelled "Learn how to add an outbound SIP number." and its href is `https://docs.agora.io/en`
    (`components/add-phone-number-sheet.tsx:193-194`). → rainy 7, which is the same failure mode
    868kyjfny calls "actionable failures".

14. **The install line names a package that does not exist.** `npm install @agora/agent-sdk` is printed in
    the builder's Code step (`components/wizard/channel-section.tsx:495`) and again in the embed config
    (`components/wizard/channel-configs.tsx:306`). The shipped SDK is `agora-agents` 2.4.0
    (`ng-console/node_modules/agora-agents/package.json`) and there is no `@agora` scope. This sits in the
    same component as `PhoneNumberSelect` (`:298-355`) and three lines under the "No phone number
    needed." pitch (`:490-492`), which is the copy a purchase has to argue with. → honesty floor ·
    [868kyjfny](https://app.clickup.com/t/868kyjfny).

15. **The inbound allow-list ships a fabricated IP.** `buildPhoneNumberBody` falls back to
    `allowed_addresses: ["1.1.1.1"]` when none is supplied
    (`ng-console/src/lib/telephony/phone-number-contracts.ts:88`). That is a public DNS resolver, not a
    carrier, so a number saved through the default path answers nothing and the UI reports success.
    → rainy 16.

16. **The live Console's add door is frozen to one vendor that is not the one Agora is integrating.** The
    Vendor select is `disabled` with `value="twilio"` and exactly one option
    (`ng-console/src/features/telephony/phone-numbers/phone-number-quick-import-sheet.tsx:217-229`) and the
    submit hardcodes `source: "twilio"` (`phone-number-contracts.ts:108`). Bandwidth is the vendor in
    flight. → [868keb672](https://app.clickup.com/t/868keb672) ·
    [868kj8qyh](https://app.clickup.com/t/868kj8qyh).

17. **The page a purchase lands on has no home in the navigation.** Neither Before shot shows a Deploy item
    in the sidebar, and the breadcrumb's parent resolves through
    `app/(dashboard)/deploy/page.tsx:7`, a redirect to `/integrations?tab=channels`. The route is reachable
    by deep link and by the sheet, and otherwise only through the other, shorter list. → rainy 1.

18. **The detail page cannot save, and has no field for anything a bought number knows.**
    `number-client.tsx:76` fires `toast.success("Phone number saved (mock)")`, the four sections are SIP
    wiring and call behaviour (`:114`, `:150`, `:188`, `:206`), and the SIP Trunk Address placeholder is
    an invented host, `agora-us-swym-us.pstn…` (`:119`). No country, no price, no owner, no order, no
    provisioning state, no identity record. The header even names the assumption: "Configure your
    imported SIP number." (`:70`).
    → [868kyjfny](https://app.clickup.com/t/868kyjfny).

19. **The taxonomy has no purchase in it.** `lib/analytics.ts:118-119` carries `phone_number_imported` and
    `phone_number_assigned`, and the quick-connect chain at `:87-93` ends at `test_call_connected`. There
    is no event for a search, a commit, a block or a refund, so the first-ring metric this feature is
    measured by has no denominator. → `01-jtbd.md` §Success event.

20. **One action wears five names.** "Add Phone Number" (`page.tsx:59`, `:90`,
    `add-phone-number-sheet.tsx:201`), "Add your first number" (`page.tsx:74`), "Add a phone number"
    (`add-phone-number-sheet.tsx:92`), "Add phone number" (`channel-section.tsx:341`), "Connect a number
    (SIP)" (`channels-panel.tsx:81`). Title case, sentence case and a parenthetical protocol in one
    product. A Buy branch adds a sixth unless this is settled first. → house copy rules ·
    [868kyjfny](https://app.clickup.com/t/868kyjfny).

21. **The word "Purchased" is already taken, and it points the wrong way.** The quick-connect enumeration
    labels two of its three mock numbers "Purchased" and the third "Verified caller ID"
    (`components/sip-quick-connect.tsx:46-50`), meaning bought from the customer's own carrier. Reusing it
    for bought from Agora puts two provenances under one badge in the same product. → rainy 22.

## What is right, and must survive any redesign

- **One door.** Every entry point opens the same `AddPhoneNumberSheet`: the list header, the empty state,
  the select footer (`channel-section.tsx:341`), the channels panel (`channels-panel.tsx:80-84`) and the
  channel hero. A purchase is a third branch of that sheet, never a fourth door.
- **The Quick connect | Manual SIP toggle** (`add-phone-number-sheet.tsx:103-118`) is already the shape a
  third branch fits into, and every entry point inherits it for free.
- **`SipQuickConnect` ends on a placed test call**, not a saved checkmark, with a timestamped fact log in
  place of a spinner and capability badges on the enumerated numbers
  (`components/sip-quick-connect.tsx:52`, `:88-92`, `:127-139`, badges seeded at `:46-50`). No vendor in
  the teardown does this.
- **`ConcurrencyCard` keeps included and purchased as separate numbers**, prorates from
  `PLAN_USAGE.periodDays*`, puts an exact amount on the commit button, and makes declining first class with
  "Keep queuing" (`components/concurrency-card.tsx:34`, `:108-110`, `:136-142`). It is the purchase
  pattern, and it is already in the product.
- **Two lock levels on the detail page**: a deployment hard-locks and points at itself, an agent binding
  unlocks in place by detaching (`number-client.tsx:54-58, 84-111`).
- **The select footer's "Add phone number"** is the one correct home for "Get a number", because it is the
  only place a user is already asking the question.
