# 16 · Phone number purchase — learnings

Evidence: `02-research/_docs.md` (public docs, read 2026-09-17) against `00-brief.md` §Agora fact-check.
Five sentences. Each one moves a control.

1. **Provenance belongs on the row, not on a second page**: Retell stamps every number
   `phone_number_type: retell-twilio | retell-telnyx | custom` in the same response that carries the
   agent binding (https://docs.retellai.com/api-references/create-phone-number), so bought and brought
   numbers live in one list and tell each other apart there, which is exactly the third value our closed
   `provider: byo | twilio` enum cannot express
   (`AddPhoneNumbersRequest.d.ts`, `00-brief.md` §Agora fact-check) and the first Engine dependency to file.

2. **The purchase control is one field, so Phase 1 is a search box inside the existing add sheet and
   not a new page**: Vapi asks only for an "Area Code", Retell's `area_code` is a "3 digit integer.
   Currently only supports US area code", and LiveKit searches on country code plus area code
   (https://docs.vapi.ai/free-telephony · https://docs.retellai.com/api-references/create-phone-number ·
   https://docs.livekit.io/sip/cloud/phone-numbers/), which means the third branch of
   `AddPhoneNumberSheet` is a field and a result list, and a country picker only appears the day the
   second country does.

3. **A bought number is not yet a working number, and the list needs a word for the gap**: LiveKit's
   number status is `active | pending | released | offline` and Vapi warns that "It can take a few
   minutes for the phone number to become active. Calls will not work until activation is complete."
   (https://docs.livekit.io/sip/cloud/phone-numbers/ · https://docs.vapi.ai/free-telephony), so our
   status badge, today `Active | Unassigned` (`deploy/phone-numbers/page.tsx:176-180`), has to carry a
   provisioning state that suppresses the assign control instead of offering it.

4. **Identity gates money everywhere it exists, and every vendor makes the user find it by accident**:
   Retell's KYC "unlock[s] outbound calling, phone number purchases, and SMS" but is reached by
   "click[ing] on any of your numbers" (https://docs.retellai.com/accounts/kyc), and Twilio's Regulatory
   Bundle must exist per country and number type before Buy a Number will sell you one
   (https://www.twilio.com/docs/phone-numbers/regulatory/getting-started), which answers open question 5
   in favour of "before purchase, named on the checkout step" and makes stating the requirement above
   the price the cheapest differentiator in this feature.

5. **Release is a money event and delete is not, so they cannot share a word**: LiveKit states "If you
   release a phone number before the end of the month, you are still billed for the entirety of the
   month" and Retell stops the monthly fee at release (https://livekit.com/pricing ·
   https://docs.retellai.com/deploy/purchase-number), while our own delete "only removes the number
   configuration from the Agora system" (SDK comment, `00-brief.md`), so the row menu needs two actions
   with two sentences and the prototype's current "returns it to the vendor pool"
   (`deploy/phone-numbers/page.tsx:200`) is wrong for both.
