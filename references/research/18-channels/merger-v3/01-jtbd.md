# 18 · Agent × Campaign merger · v3 · JTBD

Track: **v3** (redesign of the existing Console, no new capability). Parent task: [18 · Channels](https://app.clickup.com/t/868m0mf2u), roadmap row "Build the complete outbound campaign lifecycle" (868kykbf1). Audit that set the verdict: https://claude.ai/artifact/AXsVwv7VsfyXL8tMaoPKPE (2026-09-21).

**Headline JTBD.** "I run outbound calls with an agent I already built. I want the campaign to read as a run of that agent, from both sides, without learning a second product."

## Happy scenario

1. **From the agent.** I open Support Voice Agent, its Deploy rail lists the campaigns it has run and is running, each row opens the run, View all campaigns opens the runs index already filtered to this agent.
2. **From the runs index.** On Outbound Campaigns every row names its agent, and the name is a link that opens the agent with the Deploy rail already open, so I land on the agent's campaigns, not on its prompt.
3. **On the run.** The campaign banner starts with the agent that speaks it, then start, timezone and concurrency, beside Stop. Configuration names the agent, the uuid is meta under it.
4. **While configuring a run.** Make outbound calls from the agent opens the form with the agent preselected and an Open agent link beside the picker, so a mid-form doubt about the prompt is one click away and back.
5. **Across agents.** The agents list says which agents have campaigns and how many are running; the count opens the runs index filtered to that agent.

## Rainy scenarios

- **The telephony record lags the publish.** The agent reads Live but the deployed-agents index has no uuid yet: the Deploy rail says "still syncing", never "publish first" beside a LIVE badge (fixed 2026-09-23, b695f33c).
- **The agent behind a run was deleted or unpublished.** The runs index still shows the run; the agent cell is plain text (no door) because there is no deployed agent to resolve to.
- **The deployed-agents lookup fails.** Links degrade to plain names everywhere; the runs index shows the lookup error it already shows today.
- **A draft campaign has no agent yet.** The form shows the picker without Open agent; the row shows "-".
- **The agent has campaigns but none running.** The count reads "3 campaigns" with no running suffix; the Deploy rail lists them with their status chips.
- **More than five runs on one agent.** The Deploy rail shows five and View all campaigns opens the filtered index.
- **A run is scheduled, not started.** The starting-soon banner carries the same agent link and the countdown.
- **Narrow window.** Below 48 rem the Campaigns column hides with Status and Agent ID; the agent's Deploy rail becomes a sheet; nothing is lost, only folded.

## Out of scope for v3 (v3.1)

Pause and resume on a run · pin the prompt version to the run and say it · cost estimate before launch · variable-vs-column check at upload · one agent holding inbound plus batch runs (lock 2026-06-11) · export across agents.
