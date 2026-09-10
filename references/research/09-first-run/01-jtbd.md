# 09 · JTBD + success metric

**JTBD.** When I sign up — or land here with an agent I already trust on Vapi or Retell *(situation)* — I want a working agent I can talk to in minutes, carried over rather than rebuilt *(motivation)*, so I can put it on real traffic today *(outcome)*.

Two sub-jobs share the surface: *"give me a good agent I didn't have to configure"* (first run) and *"take the one I already have"* (import). The migration job is the same shape in reverse: *"my old agent stopped saving — make it valid without me learning the new contract."*

**Personas.**
- **P1 hustler switching from Vapi/Retell.** Has one or two assistants and a system prompt they've iterated for weeks. Wants: paste → hear it → put it on a number. Will abandon at the first field they must look up. Judges the import by whether the prompt, greeting and voice sound right on the first test call; tolerates dropped plumbing if it's *listed with a reason*.
- **P2 platform engineer migrating a fleet.** 20–200 agents, exported by script. Wants: the same mapper from the API/CLI, a machine-readable mapped/changed/dropped report per agent, deterministic results, and a way to review credential gaps in bulk. Also the persona hit by 868kxc3wr: opens an agent, sees "Configuration needs updating", and needs the fix to be a diff they can approve, not a JSON hunt.

**Success event (activation-linked).**
- Primary: **`agent_import_reviewed`** with `mappedRatio` (= mapped ÷ populated source fields) followed within the session by **`first_agent_test_call`** (existing preview session start, `isFirst: true`). The pair proves the import produced something the user believed enough to talk to.
- Funnel (868kbyqdq stages, one event, four values): **`onboarding_stage_reached`** `{ stage: signup_completed | project_created | first_agent_usable | first_call_completed, elapsedMsFromSignup, elapsedMsFromPrevious, entryPoint, failureReason? }`. "First agent usable" = saved and can place a test call (no validation issues); "first call completed" = the preview session ended with a session record.
- Migration: **`legacy_config_detected { retiredKeys[] }`** → **`agent_config_migrate` succeeded** → `agent_publish` (the "must republish" close).
- North-star link (LEARNINGS §17): `agent_import_reviewed` → `first_agent_test_call` → `deployment_went_live` → `first_minutes_consumed`. Import and defaults move the Believe stage; a shorter signup→first_call_completed elapsed time is the headline number for 868kbyun1's "competitive benchmark".
- Counter-metrics: `agent_import_abandoned_at_report` (a high rate means the honesty list scares rather than informs — fix the reasons, not the list); `droppedPaths[]` distribution (which Engine gaps hurt most: voicemail, max duration, ambience). Rejected: time on page, DAU, template views.

**Agora primitives.** Join contract `properties.*` (asr · llm · tts · turn_detection.mode+config · interruption · filler_words · parameters.silence_config · idle_timeout) · `credential_mode` managed|byok per block + managed presets · `pipeline_id` (published agent as base config → imported agent usable from code by id) · `llm.template_variables` + `{{var}}` (variables port verbatim) · retired-shape validator `getStudioTurnContractErrors` (the migration trigger) · release notes v2.4 / v2.5 / v2.7 / v2.9 (the migration rules) · Concierge `agents_create` + task-proposal card (direction B) · `ProductOperation` `agent_create` already instrumented (extend, don't fork).
