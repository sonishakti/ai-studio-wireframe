# Prompt & workflow library — what to rerun, and how

> Companion to [`ship-protocol.md`](ship-protocol.md). Everything here is copy-paste-able into a
> fresh chat. Placeholders are `{{LIKE_THIS}}`.

---

## A. The workflows ("graphs") already in the repo

| What | Command | When |
|---|---|---|
| **graph-loop** — ship → test → triage → fix → gate → deploy → re-test, looping until clean/stalled/max | Workflow tool: `{scriptPath: ".claude/workflows/graph-loop.js", args: {date: "YYYY-MM-DD", focus: "...", commit: "sha + one-liner", maxIterations: 2}}` | After a user-facing commit, when you want the fix cycle automated rather than hand-run |
| **user-test** — 3 developer personas think-aloud on the live build, then a moderator synthesis | Workflow tool: `{scriptPath: ".claude/workflows/user-test.js", args: {date, commit, focus, url}}` | The standing per-commit protocol; report-only |

**`args.date` is required** — workflow scripts can't read the clock (`Date.now()` throws inside
them, because it would break resume). Pass today's date explicitly.

**The args param stringifies.** `graph-loop.js` already tolerates a stringified object; if you
write a new workflow, parse `args` defensively:

```js
const a = typeof args === "string" ? JSON.parse(args) : (args ?? {})
```

**Resuming a workflow** after an edit or a kill:
`Workflow({scriptPath, resumeFromRunId: "wf_…"})` — the unchanged prefix of `agent()` calls
returns cached instantly; the first edited call and everything after runs live. Read
`<transcriptDir>/journal.jsonl` before diagnosing an odd result; it records each agent's real
return value.

---

## B. Competitor UX scan (one topic per agent, run them in parallel)

Ran three of these for Wave 1; the template/model one and the observability one both changed
the build. Launch as background `general-purpose` agents.

```
You are doing competitive UX research for a voice-AI agent platform console (Agora Convo AI
Studio). Research how competitor products design {{TOPIC}}, and report concrete UX patterns we
can borrow or reject.

Sub-topics to cover:
{{A / B / C — be specific; vague sub-topics produce vague reports}}

Competitors to study (use WebSearch + WebFetch on their docs and product pages):
- Vapi (docs.vapi.ai) · Retell AI (docs.retellai.com) · Bland AI (docs.bland.ai)
- ElevenLabs Agents (elevenlabs.io/docs) · Synthflow · LiveKit Agents · Cartesia · Deepgram
- Adjacent-domain gold standards where the strongest patterns actually live: {{e.g. Datadog APM,
  Chrome DevTools, Langfuse/Braintrust for traces; Grafana/Zapier/Vercel for connectors;
  Gong/Rev/Descript for transcript sync; n8n/Zapier/Make for galleries}}

For EACH product capture concretely: the actual layout (list→detail? modal? tabs? which tabs?),
the exact fields/controls, what the defaults are, what happens on first run, and any notable
copy or friction.

Cite URLs for every claim. Where you cannot verify something, say "unverified" rather than
guessing — do NOT fabricate product details.

Return: 1) per-competitor findings with URLs, 2) cross-cutting patterns, 3) divergences (these
are the real design decisions we have to make), 4) 6-10 concrete actionable recommendations for
our surface, each with the evidence behind it, 5) anti-patterns to avoid.

Be rigorous and specific. Your final text is the deliverable.
```

**Two things that made these reports good:** naming adjacent domains (the strongest observability
patterns came from Datadog and Chrome DevTools, not from any voice vendor), and demanding
"unverified" over guesses — one agent caught its own earlier thread being wrong about Vapi.

---

## C. Internal focus group (pre-build concept + gap session)

The highest-value research of Wave 1 — it found all three S1 defects. Run as one
`general-purpose` agent.

```
You are moderating a simulated internal focus group / usability session for Studio_X, a voice-AI
agent console wireframe. Protocol is at `references/user-testing-protocol.md` — READ IT FIRST
for the persona definitions and metrics rubric.

The three personas: D1 The Hustler (first-time voice-AI builder, zero patience), D2 The Switcher
(Vapi/Retell/ElevenLabs veteran, hunts for parity), D3 The RTE Veteran (Agora SDK dev, thinks in
App IDs/channels/tokens, distrusts wizards).

This is a PRE-BUILD concept + gap session on {{N}} features. The LIVE app is at
https://ai-studio-console-redesign.vercel.app — fetch routes to see current state. The live app
is the `studio_x_2/` folder, NOT `studio-x/`. Ground every observation in either the live HTML
or the actual source files.

Source files that matter (read them):
{{list the exact files + a one-line statement of what each currently does}}

The features to probe:
{{1..N, each with the design question at stake}}

For EACH persona run a think-aloud covering: reaction to the CURRENT state, what they expected
instead, what they'd do first, where they'd get stuck, and what would make them trust it. Quote
them in first person. Personas must DISAGREE where their mental models genuinely differ.

Then a moderator synthesis: ranked frustrations (S1/S2/S3) with which personas hit each; latent
needs nobody asked for directly; trust/explainability flags; design directives per feature
(P0/P1/P2, with persona evidence); explicit disagreements + your recommended resolution; and
what to NOT build (things that sound good but no persona needed).

Be rigorous and honest — including where a proposed feature seems weak. Do NOT write any files.
Your final text is the deliverable.
```

**Why it works:** it grounds personas in the *real source* rather than letting them imagine a
product, and it explicitly asks for disagreement and for a "don't build this" list. The
"don't build" section is what stopped a template gallery from being built on 2026-07-29.

---

## D. Annotated screenshots

See [`ship-protocol.md` §3](ship-protocol.md). One-liner:

```bash
node scripts/annotate-shots.mjs shots.json references/<feature>-shots
```

Prompt to generate the config from a diff:

```
Read the diff for {{COMMIT_OR_BRANCH}}. For every user-facing change, write one entry for
`scripts/annotate-shots.mjs` — see its header for the field reference. Each marker needs a
`name` (what it is) and a `why` (the design rationale — the decision a reviewer is being asked
to judge, not a restatement of the label). Prefer `sel` over `text` where a stable selector
exists. Where the change is only visible after interaction, write a `pre` script to drive the UI
there. Output valid JSON only.
```

---

## E. Reconciling research that disagrees

Happened on 2026-07-29: the competitor scan recommended a template gallery; the focus group said
no. The tiebreak that held:

1. **Evidence grounded in our users beats evidence grounded in competitors.** The focus group
   reacted to *our* build; the scan described other people's.
2. **A recent explicit owner decision beats both** unless there's new evidence. The static
   template grid had been deleted 11 days earlier.
3. **Say which you followed and why, in the log.** Don't silently pick one.

---

## F. Handy one-liners

```bash
# verify live routes after a deploy
node -e "['/sessions','/agents','/calls'].forEach(async r=>{const x=await fetch('https://ai-studio-console-redesign.vercel.app'+r);console.log(r,x.status)})"

# pull a real session id out of the live list (detail routes need one)
node -e "fetch('https://ai-studio-console-redesign.vercel.app/sessions').then(r=>r.text()).then(h=>console.log([...new Set(h.match(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{5}/g))].slice(0,3)))"

# token drift check on new files
grep -nE '#[0-9a-fA-F]{3,6}|text-\[[0-9]+px\]|rgba\(' studio_x_2/components/<new>.tsx

# gate before commit
cd studio_x_2 && pnpm tsc --noEmit && pnpm next build
```

**Preview MCP can't serve the fork** — verify via `node -e` fetch instead. A Next `redirect()`
renders as a meta-refresh, not a 307, so don't assert on status codes for redirects.
