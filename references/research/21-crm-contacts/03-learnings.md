# 21 · CRM & contacts — learnings from four vendors' docs

Evidence: `02-research/_docs.md`, which carries every URL. Question asked of all four: where does the
agent get the caller's record, what may it change, and does anything survive the hang-up?

1. **Inbound context is a webhook the customer hosts, in three products out of four, each with a
   published latency budget**, so the P0 read half is a declared variable list plus a webhook contract
   with its budget printed on the row, not a CRM record picker: Vapi's `assistant-request` must answer
   "within 7.5 seconds end-to-end" and the limit is non-configurable
   (https://docs.vapi.ai/assistants/personalization), Retell's Inbound Call Webhook allows 10 seconds
   per attempt and three attempts before the call disconnects
   (https://docs.retellai.com/features/inbound-call-webhook), and ElevenLabs splits the same thing
   across a workspace URL and a per-agent Security switch
   (https://elevenlabs.io/docs/eleven-agents/customization/personalization/twilio-personalization).

2. **The one vendor with a real contact makes the phone number the identity of the row, not one of its
   variables** (one number is exactly one contact, a duplicate fails outright, and there is no CSV
   import at all, https://docs.retellai.com/features/contacts), so `MOCK_CSV_COLUMNS`
   (`studio_x_2/lib/wizard-draft.ts`:773) drops `phone` for Agora's documented `phone_number` in this
   slice rather than a later correction, and the preview table's first column stops being a variable
   chip and becomes the row's key.

3. **Nobody shows the builder what the agent will actually know before the call**, and Vapi actively
   hides it (on the campaign Contacts step "additional columns do not appear in the preview",
   https://docs.vapi.ai/outbound-campaigns/quickstart, while ElevenLabs' only builder-visible values are
   `dynamic_variable_placeholders` the builder typed himself), so `campaignMissingVars`
   (`wizard-draft.ts`:781–785) is the thing we keep and extend into a resolved-row preview, not the
   thing we replace.

4. **Cross-session memory ships as a visible mapping table, not a store**: Retell's Contact Memory is
   Post Call Extraction fields mapped into named contact fields with a per-row update mode of Overwrite,
   Fill if empty or Merge, string-only merges capped near 512 tokens, org-wide so every agent
   contributes (https://docs.retellai.com/integrations/crm-mappings,
   https://docs.retellai.com/integrations/build-contact-memory), which means our answer to 868kykbf7 is
   rows of existing `DataPoint` (`wizard-draft.ts`:151–158) into contact field with those three modes,
   and nothing that needs an Engine store.

5. **No vendor puts a person between the agent and the CRM write**, and the only boundary any of them
   ships is a field allowlist plus an update mode (Retell's outbound sync fires automatically, never
   writes the phone number back, never deletes, and hides record creation behind a toggle;
   ElevenLabs' webhook tools take GET, POST, PUT and PATCH with no confirmation step,
   https://elevenlabs.io/docs/eleven-agents/customization/tools/webhook-tools), so "controlled" in
   868kykbfx means the mapping table we can build against the Custom Tool form today, and the
   draft-and-approve queue from owner question 3B is a differentiator we argue for on GDPR grounds, not
   a table stake we are behind on.
