export const meta = {
  name: 'v3-night',
  description: 'Nightly v3 design run in one command: queue, research, directions, prototype, Figma, tracker, review post, sleep. No idle waits.',
  whenToUse: 'Started by the v3-night-design scheduled task every evening at 20:00 (owner request, 26 Sep 2026).',
  phases: [
    { title: 'Plan', detail: 'queue from ClickUp' },
    { title: 'Research', detail: '4+ vendors per feature, screenshots', model: 'sonnet' },
    { title: 'Design', detail: 'JTBD, learnings, before/after, directions, pick' },
    { title: 'Build', detail: 'prototype on design/v3, preview deploy (one at a time)' },
    { title: 'Figma', detail: 'hero screens and rationale (one at a time)' },
    { title: 'Track', detail: 'ClickUp and tracker rows' },
    { title: 'Report', detail: 'review post, run log, sleep' },
  ],
}

// Contract: references/automation/v3-night-agent.md (owner rules win). args: { date: 'YYYY-MM-DD' }
const A = args || {}
const ROOT = '/Users/shaktisoni/Documents/Agora Design & FE/ai-studio-console-redesign'
const WT = '/Users/shaktisoni/Documents/Agora Design & FE/ng-console/.worktrees/v3'
const PRD = ROOT + '/references/v3/03-strategy/prd-v3.json'
const TRACKER = 'https://claude.ai/artifact/6YZCRsJvpoBthj4fnm9XAb'
const LIST = '901115448379'
const SLACK = 'C0C0D403FNF'
const OWNER = 'U03A67AMB5M'
const FIGMA = 'OIKZExT265nOJotBlmv2Ah'
const RULES = `Owner rules: follow ${ROOT}/references/automation/v3-night-agent.md. Persona is Sam, a developer. Existing Console design system only (${WT}/docs/design/DESIGN.md); reuse, do not redesign; empty first, quiet chrome; locked words from the PRD vocabulary; no arrows or em dashes in prose; sentence case. Never email, never push, never --prod, never sign in or enter credentials, never touch ng-console.agora.io.`

// Owner rule 26 Sep 2026: Refero and earlier research first, the browser only for gaps or news
const RESEARCH_ORDER = `Research order (owner rule, mandatory):
1. Refero MCP first: load its tools via ToolSearch "refero" (refero_search_screens, refero_search_flows, refero_get_screen, refero_get_screen_image, refero_get_flow) and pull this vendor's screens and flows for the feature, happy and rainy.
2. Then earlier research already on disk or in Figma: ${ROOT}/references/v3/features/*/shots/, ${ROOT}/references/competitors/, ${ROOT}/references/research/, other *-shots folders under ${ROOT}/references/, and the Figma research boards (file ${FIGMA}; the research section 3122-40583 on Sandbox New) read with get_metadata / get_screenshot. Reuse those images; copy the useful ones into this feature's shots folder with the same naming.
3. Only then the browser (scripts/drive.mjs), and only when context is missing for this feature, or the vendor's docs or changelog show something released or changed after the earlier research. Say in the result which source each shot came from (refero, earlier, browser) and why the browser was needed.`

phase('Plan')
const plan = await agent(`${RULES}\n\nRead ClickUp list ${LIST} (load ClickUp tools via ToolSearch). Queue = tasks in status "in progress": first those with a "Changes for tonight" comment newer than their last "in review" move, then by feature id (P0.1 < P0.2 < … < P1.1). If none: take the next "Open" task in phase order and move it to "in progress". For each queued task read its PRD row in ${PRD} (features[] by id) and any change notes. Also list LOCKED features: tasks in status "completed", each with its id and the routes/components its latest comment names. Return the queue (max 8 tonight, the rest stays queued) and the locked list.`, {
  label: 'plan', phase: 'Plan',
  schema: { type: 'object', properties: { queue: { type: 'array', items: { type: 'object', properties: {
    id: { type: 'string' }, task_id: { type: 'string' }, title: { type: 'string' }, p: { type: 'string' },
    change_notes: { type: 'string' }, vendors: { type: 'array', items: { type: 'string' } } }, required: ['id', 'task_id', 'title', 'p', 'change_notes', 'vendors'] } },
    locked: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, routes: { type: 'string' } }, required: ['id', 'routes'] } },
    note: { type: 'string' } }, required: ['queue', 'locked', 'note'] },
})
// args.only: ['P0.1'] runs just those ids (step-by-step daytime runs)
const queue = ((plan && plan.queue) || []).filter(q => !A.only || A.only.includes(q.id))
const locked = (plan && plan.locked) || []
const LOCKRULE = `LOCKED designs (Done, frozen): ${JSON.stringify(locked)}. Never change a locked feature's Figma section or its routes and components unless the change is inside this feature's own scope or improves the locked design; then leave the locked commit untouched, build the change inside this feature, and list the touched locked ids under "touches_locked".`
log(`Tonight: ${queue.map(q => q.id).join(', ') || 'nothing queued'}`)

// one prototype and one Figma build at a time (same worktree, same file); research and design run ahead
const locks = { build: Promise.resolve(), figma: Promise.resolve() }
const serial = (k, fn) => { const run = locks[k].then(fn, fn); locks[k] = run.catch(() => null); return run }
let checkinDone = false

const results = await pipeline(queue,
  // Research: one Sonnet agent per vendor, in parallel
  (q) => parallel((q.vendors && q.vendors.length ? q.vendors : ['Vapi', 'Retell', 'ElevenLabs', 'LiveKit']).map(v => () => agent(
    `${RULES}\n\n${RESEARCH_ORDER}\n\nResearch ${v} for feature ${q.id} "${q.title}" (PRD row in ${PRD}). Cover the happy path and the rainy states (empty, error, limits) with screenshots; when step 3 needs the browser, use ${ROOT}/scripts/drive.mjs (start it with "node scripts/drive.mjs serve" from ${ROOT} if it is not running; use --tab ${v.toLowerCase().replace(/\W/g, '')}-${q.id.replace('.', '')}) into ${ROOT}/references/v3/features/${q.id}/shots/${v.toLowerCase().replace(/\W/g, '')}-NN-<slug>.png. Public docs and product pages only. Return what to copy, what to avoid, and the files.`,
    { label: `research:${q.id}:${v}`, phase: 'Research', model: 'sonnet',
      schema: { type: 'object', properties: { vendor: { type: 'string' }, status: { type: 'string', enum: ['Done', 'Partial', 'Not started'] }, copy: { type: 'string' }, avoid: { type: 'string' }, shots: { type: 'array', items: { type: 'string' } } }, required: ['vendor', 'status', 'copy', 'avoid', 'shots'] } }))),
  // Design: JTBD refine, learnings, before/after, 3-5 directions, pick; the first one triggers the check-in post
  async (research, q, i) => {
    const d = await agent(`${RULES}\n\nFeature ${q.id} "${q.title}". Change notes from the owner: ${q.change_notes || 'none'}.\nResearch: ${JSON.stringify(research)}\nWrite into ${ROOT}/references/v3/features/${q.id}/: 01-jtbd.md (Sam's job step, happy .a, rainy .b+), 02-learnings.md, 03-before-after.md (screenshot today's Console at the matching route), 04-directions.md (3–5 directions, audit, one pick with 5 rationale bullets), 05-build-spec.md (routes and URL states for the happy path and every rainy state, components to reuse, copy). Return the pick.`,
      { label: `design:${q.id}`, phase: 'Design',
        schema: { type: 'object', properties: { directions: { type: 'array', items: { type: 'string' } }, pick: { type: 'string' }, why: { type: 'string' }, questions: { type: 'array', items: { type: 'string' } } }, required: ['directions', 'pick', 'why', 'questions'] } })
    if (!checkinDone && d) {
      checkinDone = true
      await agent(`Post ONE Slack message to channel ${SLACK} (load Slack tools via ToolSearch) and send a PushNotification if that tool exists. Text:\n"Tonight · ${queue.map(x => x.id).join(', ')}"\nFirst: ${q.id} ${q.title}\nDirections: ${JSON.stringify(d.directions)}\nBuilding: ${d.pick} because ${d.why}\nQuestions: ${JSON.stringify(d.questions.slice(0, 3))}\n"Reply any time to steer: a direction letter, a new queue (ids), or skip <id>. I apply replies at the next feature and never wait."\nReturn the message ts.`,
        { label: 'checkin', phase: 'Design', model: 'sonnet' })
    }
    return { research, design: d }
  },
  // Build: read steer replies, prototype, gate, commit, preview deploy (serialized)
  (prev, q) => serial('build', () => agent(`${RULES}\n\nFirst read replies in Slack channel ${SLACK} from user ${OWNER} only, since tonight's check-in: apply a direction letter or "skip ${q.id}" (then return skipped). Then build feature ${q.id} from ${ROOT}/references/v3/features/${q.id}/05-build-spec.md in ${WT} (branch design/v3): happy path and every rainy state reachable by URL, the link opens at the journey start. Gate: bun run typecheck, bunx vitest run <affected>, bunx biome check --write <changed>. Commit locally "design(v3/${q.id}): …" (no push). Deploy a git-free preview: git archive HEAD | tar -x -C <scratch>/export-${q.id}; cd there; vercel link --yes --project ng-console --scope agoraio; rm -f .env.local; vercel deploy --scope agoraio --yes --build-env VITE_NG_CONSOLE_DESIGN_PREVIEW=true. Never --prod. If the gate cannot pass, commit nothing and say why. Design pick: ${JSON.stringify(prev && prev.design)}.\n${LOCKRULE}`,
    { label: `build:${q.id}`, phase: 'Build',
      schema: { type: 'object', properties: { skipped: { type: 'boolean' }, web: { type: 'string', description: 'preview URL opening at the journey start, or empty' }, commit: { type: 'string' }, rainy_urls: { type: 'array', items: { type: 'string' } }, touches_locked: { type: 'array', items: { type: 'string' } }, problems: { type: 'string' } }, required: ['skipped', 'web', 'commit', 'rainy_urls', 'touches_locked', 'problems'] } })
    .then(b => ({ ...prev, build: b }))),
  // Figma: hero screens + rationale + research shots with red marks (serialized)
  (prev, q) => (prev && prev.build && prev.build.skipped) ? prev : serial('figma', () => agent(`${RULES}\n\nLoad skill figma:figma-use before any use_figma. In Figma file ${FIGMA}, page "v3 · ${q.p === 'P0' ? 'P0 Agent config' : q.p === 'P1' ? 'P1 Monitoring · Agents' : q.p === 'P2' ? 'P2 Monitoring · Sessions' : 'P3 v3 mapping'}" (create if missing), build section "${q.id} · ${q.title}" with child sections 1 JTBD, 2 Research, 3 Learnings, 4 Before → after, 5 Directions, 6 Prototype, 7 Hero screens, 8 Tracker. Native editable frames for the happy path and the key rainy states from ${prev && prev.build && prev.build.web} and ${ROOT}/references/v3/features/${q.id}/, rationale under each, research screenshots with thin red outlines on the region to look at. ${LOCKRULE} Never edit a locked section. Return the section URL.`,
    { label: `figma:${q.id}`, phase: 'Figma', schema: { type: 'object', properties: { figma: { type: 'string' }, problems: { type: 'string' } }, required: ['figma', 'problems'] } })
    .then(f => ({ ...prev, figma: f }))),
  // Track: ClickUp comment + status, tracker row via ArtifactData
  (prev, q) => (prev && prev.build && prev.build.skipped) ? { id: q.id, skipped: true } : agent(`${RULES}\n\n1. ClickUp task ${q.task_id}: add a comment with the prototype ${prev.build && prev.build.web}, Figma ${prev.figma && prev.figma.figma}, research folder references/v3/features/${q.id}/, commit ${prev.build && prev.build.commit}; set status "in review".\n2. Load ArtifactData via ToolSearch; "get" document features/${q.id} on artifact ${TRACKER}, then "update" it (or "set" if missing) with {"id":"${q.id}","status":"Review","web":<prototype url>,"figma":<figma url>,"commit":"${prev.build && prev.build.commit}","research":{<vendor>:<status>...},"updated":"${A.date || ''}"}; keep design_eta and lock_eta as they are. Never write status Done or locked_at. Using research ${JSON.stringify((prev.research || []).filter(Boolean).map(r => ({ vendor: r.vendor, status: r.status })))}.\nReturn a one-line summary.`,
    { label: `track:${q.id}`, phase: 'Track', model: 'sonnet' }).then(s => ({ id: q.id, title: q.title, web: prev.build && prev.build.web, figma: prev.figma && prev.figma.figma, pick: prev.design && prev.design.pick, touches_locked: (prev.build && prev.build.touches_locked) || [], problems: [prev.build && prev.build.problems, prev.figma && prev.figma.problems].filter(Boolean).join('; '), summary: s })),
)

phase('Report')
const done = results.filter(Boolean)
await agent(`${RULES}\n\nMorning review post. Load Slack and ClickUp tools via ToolSearch.\nTonight's results: ${JSON.stringify(done)}\n1. Read ClickUp list ${LIST}: every task in "in review". If more than one, start with a digest: one line per task in id order, prototype link first, then Figma.\n2. Then the newest feature in full: "Review ready · <id> <title>", prototype link first, Figma, ClickUp, 3 rationale bullets, rainy states covered, KPI, max 3 open questions, anything unfinished and why. If any result has touches_locked, add a line "Touches locked: <ids>, your call."\n   Then: "Approve = reply approve or move the task to completed; the design locks. Redo = move it to in progress and comment the changes.""\n3. Close with "Next: reply with a feature id, or move a task to in progress. Default: <next Open or in-progress id>."\nPost ONE message to ${SLACK}, then PushNotification if available. Write ${ROOT}/references/automation/runs/${A.date || 'latest'}.md (queue, results, problems, links).\n4. Release the Mac: kill $(cat /tmp/v3-night-caffeinate.pid) 2>/dev/null; ${A.daytime ? 'daytime run: never sleep the Mac.' : "then if ioreg -c IOHIDSystem | awk '/HIDIdleTime/ {print int($NF/1000000000); exit}' is ≥ 900, run pmset sleepnow."} Never shut down.`,
  { label: 'report', phase: 'Report', model: 'sonnet' })
return { queue: queue.map(q => q.id), results: done }
