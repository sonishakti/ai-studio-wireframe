# Merger v3 research — agent x campaign relationship (Vapi, ElevenLabs)
Status: DONE (partial — time-boxed to 20 min, Vapi product access blocked)

## ElevenLabs
- Batch Calling lives under its own "Outbound" nav item, separate from Agents.
- List is empty for this workspace (rainy shot, marked). No agent name, no link back
  to the agent that would run a batch — you'd have to already know which agent to reuse.
- "Create a batch call" is gated behind a channel picker (Telephony / WhatsApp) before
  the actual form appears — an extra decision before agent selection.
- Docs (batch-calls) describe the create call as flat: agent_id + agent_phone_number_id +
  recipients[] (phone_number, dynamic vars per row). The agent is a foreign key, not a
  first-class part of the run UI as documented.
- Stop/cancel: not reached — list was empty, no in-progress or finished batch existed to
  open a detail page from.

## Vapi — BLOCKED
- The persistent Chrome profile's Vapi session had expired; every dashboard URL
  (dashboard.vapi.ai/campaigns, dashboard.vapi.ai/) redirected to /login. Per hard rules,
  credentials were not entered — this needs the user to re-authenticate the profile.
- docs.vapi.ai/campaigns and two guessed follow-on slugs (api-reference/campaigns/create,
  campaigns/outbound-campaigns) all 404'd; ran out of time budget to search for the
  correct docs slug, so no Vapi docs shot was captured either.
- No Vapi shots were saved to the repo as a result — research-vapi.json is an empty array.

## Environment note
The drive.mjs serve process on :9333 crashed repeatedly mid-session ("Chrome websocket
closed — exiting"), most likely profile/singleton-lock contention. It was restarted three
times from this session; each restart loses in-page state (open dropdowns, tab position)
but keeps cookies, so ElevenLabs stayed signed in across restarts while Vapi's expired
session was constant throughout.

## Shots on disk
- references/competitors/product/elevenlabs/elevenlabs-18m-batch-list-empty.png (rainy)
- references/competitors/public-docs/elevenlabs-18m-batch-calling-docs.png (docs/happy)

## Not captured (out of time / blocked)
- ElevenLabs happy1 populated list, happy2 create form, happy3 detail page, rainy2
  stop/validation — list was empty and the create-form modal did not render on the one
  attempt made before time ran out.
- Vapi happy1/2/3, rainy1/2, docs1 — product blocked by expired login; docs blocked by
  wrong guessed URLs.
