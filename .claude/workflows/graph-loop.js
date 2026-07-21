export const meta = {
  name: 'graph-loop',
  description: 'Ship→Test→Fix cycle as a graph with a loop edge: user-test the live build → triage P0/quick-P1 → fix → gate → deploy → re-test, until clean, stalled, or max iterations',
  whenToUse: 'After a user-facing change is committed + deployed (the standing per-commit protocol, now closed-loop). args: {date: "YYYY-MM-DD" (required — scripts cannot read the clock), focus: "what shipped", slug?: "kebab-slug", commit?: "sha + one-liner", url?: string, maxIterations?: number (fix rounds, default 2)}',
  phases: [
    { title: 'Test', detail: '3-persona think-aloud via user-test.js' },
    { title: 'Fix', detail: 'apply P0 + quick-P1 fixes in studio_x_2' },
    { title: 'Gate', detail: 'pnpm tsc --noEmit (+ drift check if available)' },
    { title: 'Deploy', detail: 'commit · push · vercel deploy --prod --yes' },
    { title: 'Report', detail: 'write references/user-tests/<date>-<slug>.md' },
  ],
}

// ── The graph ────────────────────────────────────────────────────────────────
//
//            ┌──────────────────────────────────────────────┐
//            ▼                                              │ loop edge
//   [TEST: user-test.js] ──► (TRIAGE: pure code) ──► [FIX] ─► [GATE] ─► [DEPLOY]
//            │                       │                 │ gate fails once →
//            │                       ├─ no P0/quickP1 ─┤ [FIX-BUILD] → re-GATE,
//            │                       ├─ stalled ───────┤ then hard-abort
//            │                       └─ max iterations ┘
//            ▼
//        [REPORT] ─► return {exitReason, iterations, backlog}
//
// Exit conditions (checked at TRIAGE, in order):
//   clean   — synthesis has zero P0 and zero quick-effort P1 fixes
//   stalled — S1 count did not drop AND SUS-lite mean did not rise vs last round
//   max     — maxIterations fix rounds already ran
// ─────────────────────────────────────────────────────────────────────────────

const DATE = args && args.date
if (!DATE) throw new Error('args.date ("YYYY-MM-DD") is required — workflow scripts cannot call Date')
const FOCUS = (args && args.focus) || 'the latest commit'
const SLUG = (args && args.slug) || 'graph-loop'
const URL = (args && args.url) || 'https://ai-studio-console-redesign.vercel.app'
const MAX_ITER = (args && args.maxIterations) || 2
const REPO = '/Users/shaktisoni/Documents/Agora Design & FE/ai-studio-console-redesign'
const APP = REPO + '/studio_x_2'
const USER_TEST = '.claude/workflows/user-test.js'

const GATE_SCHEMA = {
  type: 'object', required: ['pass', 'summary'],
  properties: { pass: { type: 'boolean' }, summary: { type: 'string' }, errors: { type: 'array', items: { type: 'string' } } },
}
const FIX_SCHEMA = {
  type: 'object', required: ['applied', 'skipped'],
  properties: {
    applied: { type: 'array', items: { type: 'object', required: ['fix', 'files'], properties: { fix: { type: 'string' }, files: { type: 'array', items: { type: 'string' } } } } },
    skipped: { type: 'array', items: { type: 'object', required: ['fix', 'why'], properties: { fix: { type: 'string' }, why: { type: 'string' } } } },
  },
}
const DEPLOY_SCHEMA = {
  type: 'object', required: ['sha', 'deployed'],
  properties: { sha: { type: 'string' }, deployed: { type: 'boolean' }, note: { type: 'string' } },
}

const runGate = (round) => agent(
  [
    'You are the QUALITY GATE for Studio_X. Work non-interactively; do not fix anything — only report.',
    `1. In "${APP}" run: pnpm tsc --noEmit`,
    `2. Best-effort: from "${REPO}" run "buoy drift check" IF the buoy CLI exists (it may not be installed — that is not a failure).`,
    'pass = tsc exited 0. List every tsc error verbatim in errors[].',
  ].join('\n'),
  { label: 'gate r' + round, phase: 'Gate', schema: GATE_SCHEMA, effort: 'low' },
)

const triage = (synthesis) => (synthesis && synthesis.fixes ? synthesis.fixes : [])
  .filter((f) => f.priority === 'P0' || (f.priority === 'P1' && f.effort === 'quick'))

const stalled = (prev, cur) => {
  if (!prev || !cur) return false
  return cur.s1 >= prev.s1 && cur.susLiteMean <= prev.susLiteMean
}

const iterations = []
let commitLabel = (args && args.commit) || 'HEAD'
let exitReason = 'max'

for (let round = 1; round <= MAX_ITER + 1; round++) {
  // ── TEST node — reuse the existing 3-persona workflow as a subgraph ──
  log(`Round ${round}: testing ${commitLabel} against focus "${FOCUS}"`)
  const test = await workflow({ scriptPath: USER_TEST }, { date: DATE, commit: commitLabel, focus: FOCUS, url: URL })
  const synth = test && test.synthesis
  const metrics = synth && synth.metricsTable
  iterations.push({ round, commit: commitLabel, metrics, fixes: synth ? synth.fixes : [], focusVerdict: synth ? synth.focusVerdict : 'n/a' })

  // ── TRIAGE node — pure code, decides which edge to follow ──
  const todo = triage(synth)
  if (!todo.length) { exitReason = 'clean'; break }
  const prevMetrics = iterations.length > 1 ? iterations[iterations.length - 2].metrics : null
  if (stalled(prevMetrics, metrics)) { exitReason = 'stalled'; break }
  if (round > MAX_ITER) { exitReason = 'max'; break }
  log(`Round ${round}: ${todo.length} P0/quick-P1 fixes → fix edge`)

  // ── FIX node — one sequential agent applies the whole batch (fixes share files) ──
  const fixResult = await agent(
    [
      `You are the FIX agent for Studio_X (repo: ${REPO}, app: ${APP} — studio_x_2 is the live canonical app; do NOT touch studio-x/).`,
      'Apply EXACTLY these fixes from a simulated 3-persona usability synthesis — no scope creep, nothing else:',
      JSON.stringify(todo, null, 1),
      '',
      'Rules: design tokens only (no hardcoded colors, no arbitrary text-[Npx]); match surrounding code idiom; if a fix is ambiguous, too large for "quick", or conflicts with locked IA decisions in CLAUDE.md, SKIP it with a reason rather than improvising.',
      'Return applied[] (fix + files touched) and skipped[] (fix + why).',
    ].join('\n'),
    { label: 'fix r' + round, phase: 'Fix', schema: FIX_SCHEMA },
  )
  if (!fixResult || !fixResult.applied || !fixResult.applied.length) { exitReason = 'nothing-applicable'; break }

  // ── GATE node — with one self-heal bounce, then hard abort ──
  let gate = await runGate(round)
  if (gate && !gate.pass) {
    log('Gate failed — one repair attempt')
    await agent(
      `The FIX round broke the build in "${APP}". Repair ONLY these tsc errors, minimally, without reverting the intent of the fixes:\n` + (gate.errors || []).join('\n'),
      { label: 'fix-build r' + round, phase: 'Gate', schema: FIX_SCHEMA },
    )
    gate = await runGate(round)
    if (gate && !gate.pass) { exitReason = 'gate-failed'; break }
  }

  // ── DEPLOY node — commit, push, manual prod deploy (git auto-deploy is broken) ──
  const applied = fixResult.applied.map((a) => a.fix).join('; ')
  const deploy = await agent(
    [
      `You are the DEPLOY agent. From the REPO ROOT "${REPO}" (never studio_x_2/):`,
      `1. git add -A && git commit -m "graph-loop(r${round}): ${SLUG} — P0/quick-P1 fixes" -m "${applied.slice(0, 300)}" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"`,
      '2. git push origin main',
      '3. vercel deploy --prod --yes   (MANDATORY — Vercel git auto-deploy is broken; push alone leaves the site stale)',
      'Never use --no-verify, --force, or amend. Return the short sha and whether the prod deploy succeeded.',
    ].join('\n'),
    { label: 'deploy r' + round, phase: 'Deploy', schema: DEPLOY_SCHEMA, effort: 'low' },
  )
  if (!deploy || !deploy.deployed) { exitReason = 'deploy-failed'; break }
  commitLabel = deploy.sha + ' graph-loop r' + round
  // loop edge → back to TEST with the new live build
}

// ── REPORT node ──
phase('Report')
const backlog = (iterations.length ? (iterations[iterations.length - 1].fixes || []) : [])
  .filter((f) => !(f.priority === 'P0' || (f.priority === 'P1' && f.effort === 'quick')))
const reportPath = `references/user-tests/${DATE}-${SLUG}.md`
await agent(
  [
    `Write the user-test report for a ${iterations.length}-round graph-loop session to "${REPO}/${reportPath}" following references/user-testing-protocol.md.`,
    'Structure: metrics table PER ROUND (task success %, TTFA medians, S1/S2/S3, sentiment, SUS-lite) so improvement across rounds is visible · what we learnt · what changed each round · exit reason: ' + exitReason + ' · remaining backlog (P1/P2).',
    'Data (JSON):',
    JSON.stringify({ focus: FOCUS, exitReason, iterations, backlog }, null, 1),
    `Then from "${REPO}": git add ${reportPath} && git commit -m "graph-loop: ${SLUG} report (${exitReason})" -m "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>" && git push origin main. No deploy needed (doc-only).`,
  ].join('\n'),
  { label: 'report', phase: 'Report', effort: 'low' },
)

return {
  exitReason,
  rounds: iterations.map((i) => ({ round: i.round, commit: i.commit, metrics: i.metrics, focusVerdict: i.focusVerdict })),
  backlog,
  report: reportPath,
  live: URL,
}
