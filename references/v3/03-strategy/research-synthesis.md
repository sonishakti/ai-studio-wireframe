# What the research changes · v3 synthesis (24 Sep)

Sources: the four files in `02-research/`. Each line names the decision it drives and the requirement number.

## Open squares Agora can own

| Finding | Evidence | Decision | Req |
|---|---|---|---|
| No vendor lists sessions from every modality in one filterable place | competitor-monitoring §3 | Session history is the product's differentiator; design for direction × modality from day one | 22, 24, 25 |
| No vendor documents what a zero-retention row renders | competitor-monitoring §3, batch-retention §2 | Row stays (time, duration, cost); detail says what is not kept; muted label in the list, not a loud badge | 32 |
| No vendor has an ephemeral/unsaved-agent session state | competitor-monitoring §3 | "Ephemeral" in the agent column, excluded from agent aggregates, filterable | 41 |
| No vendor shows "used by" before deleting a secret | builder-models-secrets C, open question 1 | Secrets page lists referencing agents; delete blocked while referenced | 45 |
| No vendor re-runs the same batch object | batch-retention §1 | Run as a first-class re-run is a differentiator; say so in launch copy | 7, 47 |

## Patterns to adopt

| Pattern | From | Where in Agora | Req |
|---|---|---|---|
| One filter + time state drives tiles and list together; every tile drills to rows | Datadog, Amplitude, PostHog | Agent › Analytics | 30 |
| Search with `field:value` + a facet panel that mirrors it | Datadog Log Explorer | Session history | 22, 31 |
| Golden-signals header + rolled-up badge | Datadog service page | Agent header ("2 errors · 3 warnings") | 29 |
| Errors grouped into issues with count, first/last seen, affected sessions | Datadog Error Tracking, Sentry | Agent › Logs & diagnostics | 28 |
| List → preview drawer → full page, breadcrumb back | Sentry, Langfuse | Session detail + full screen | 43 |
| Turn timeline with ASR → LLM → TTS latency legs beside transcript and scores | Langfuse traces, Hume session detail (Refero 1ad5409a), Vapi | Session detail common block | 24 |
| Scores as filterable, sortable columns | Langfuse | Analysis values as facets | 26 (later), 30 |
| State in the URL; copy link | Datadog saved views, Fingerprint (Refero e4ccb081) | Agent, run, session, and filtered views | 42 |
| Preset radio cards with an ASR→LLM→TTS logo strip; Custom opens pre-filled from the default preset | Vapi tabs with logos, ElevenLabs grouping | Voice & models | 37, 39 |
| One Advanced panel as a completeness checklist, sections not tabs | ElevenLabs agent settings | Advanced panel | 38 |
| Type gate at creation prunes irrelevant settings | Synthflow two-gate flow | Create agent | 3 |
| Write-only secret: key immutable, rotate = overwrite, no reveal | Vercel Secret type | Secrets, inline key fields | 34, 45 |
| Environment as a property of the set, not the key name | Doppler, GitHub envs | Secret sets | 34 |
| Variant/version logged on every session so "do not aggregate" is a join, not a filter | Vapi traffic splitting, Statsig, Braintrust | Session data model (ask engineering now) | 20, 21 |

## Anti-patterns to refuse

- Vanity tiles; tiles that ignore the filter bar; dead-end charts (observability §Anti-patterns).
- Aggregation inside session history (owner rule, and Datadog separates Explorer from Service page).
- A flat error stream instead of grouped issues.
- Filters that live only in component state (breaks share links).
- Hiding zero-retention sessions from totals.
- Showing cost as the model trade-off (pricing is flat; competitors that show $ per model are solving a different problem).

## Decisions the research forces on the team

1. **Zero retention on batch runs**: allow (more permissive than ElevenLabs) or forbid? Default proposal: allow, with the
   run page stating that its sessions keep no content.
2. **Retention level**: agent default (set at Go live) with per-session override from the API, mirroring Retell + Vapi.
3. **Naming** (batch-retention recommendation + object-model §5): API `campaign` = one execution. Two options:
   - **A.** UI calls it **Run**, groups runs by agent; ask the API to rename to `run` or add a grouping later. Clean UI,
     breaks parity until the API moves.
   - **B.** UI calls it **Campaign** (= API), shows several campaigns of one agent side by side as "runs" only in the
     comparison view. Parity holds; the owner's Campaign › Run hierarchy flattens.
   Recommendation: **B for launch** (parity is the stated priority), revisit when the API adds a grouping.
4. **Variant pointer on sessions** (agent version / override / ephemeral) should be in the session record before launch,
   even if the UI to dice by it ships later.
5. **Latency claims**: no competitor puts numbers inside the model picker; ours must come from SuperNode benchmarks, not
   borrowed figures.

## Research still owed

- Logged-in screenshots of Vapi, Retell, ElevenLabs model pickers and call detail (memory rule: 4 vendors as screenshots).
  Refero has no pages for these dashboards; use the persistent Chrome profile and `scripts/drive.mjs`.
- The old Agora benchmarking site URL (Vineet asked for it; Shakti to find it in Slack from Jolene).
