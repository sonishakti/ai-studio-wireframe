export const meta = {
  name: 'user-test',
  description: 'Simulated think-aloud usability session: 3 developer personas walk the live build, then a moderator synthesizes',
  whenToUse: 'After every commit that ships user-facing change (see references/user-testing-protocol.md). args: {date, commit, focus, url}',
  phases: [
    { title: 'Sessions', detail: '3 persona think-alouds in parallel' },
    { title: 'Synthesis', detail: 'moderator aggregates + ranks fixes' },
  ],
}

// args: { date: "YYYY-MM-DD", commit: "sha + one-line", focus: "what just shipped", url?: string }
const URL = (args && args.url) || 'https://ai-studio-console-redesign.vercel.app'
const FOCUS = (args && args.focus) || 'the latest commit'
const COMMIT = (args && args.commit) || 'HEAD'
const REPO = 'studio_x_2'

const SESSION_SCHEMA = {
  type: 'object',
  required: ['persona', 'thinkAloud', 'frustrations', 'needs', 'latentNeeds', 'ahaMoments', 'trustFlags', 'metrics', 'susLite', 'focusVerdict'],
  properties: {
    persona: { type: 'string' },
    thinkAloud: { type: 'array', items: { type: 'object', required: ['step', 'narration', 'sentiment'], properties: {
      step: { type: 'string' }, narration: { type: 'string' }, sentiment: { type: 'number' } } } },
    frustrations: { type: 'array', items: { type: 'object', required: ['severity', 'where', 'quote'], properties: {
      severity: { type: 'string', enum: ['S1', 'S2', 'S3'] }, where: { type: 'string' }, quote: { type: 'string' } } } },
    needs: { type: 'array', items: { type: 'string' } },
    latentNeeds: { type: 'array', items: { type: 'string' } },
    ahaMoments: { type: 'array', items: { type: 'string' } },
    trustFlags: { type: 'array', items: { type: 'string' } },
    metrics: { type: 'object', required: ['ttfaInteraction', 'ttfaLive', 'taskResults'], properties: {
      ttfaInteraction: { type: 'number' }, ttfaLive: { type: 'number' },
      taskResults: { type: 'array', items: { type: 'object', required: ['task', 'result', 'why'], properties: {
        task: { type: 'string' }, result: { type: 'string', enum: ['pass', 'partial', 'fail'] }, why: { type: 'string' } } } } } },
    susLite: { type: 'object', required: ['ease', 'confidence', 'coherence', 'recovery', 'recommend'], properties: {
      ease: { type: 'number' }, confidence: { type: 'number' }, coherence: { type: 'number' },
      recovery: { type: 'number' }, recommend: { type: 'number' } } },
    focusVerdict: { type: 'string' },
  },
}

const COMMON = [
  `You are an LLM agent acting as a TEST PARTICIPANT in a moderated usability session (think-aloud protocol) for Studio_X, Agora's voice-AI agent console. Live build: ${URL} (start at ${URL}/agents). This session especially probes: ${FOCUS} (commit ${COMMIT}).`,
  '',
  'HOW TO "USE" THE APP: WebFetch the live routes (/agents, /agents?step=N, /integrations?tab=..., etc.) and read their SSR HTML for what is actually on screen. Resolve what interactions DO by reading the source in ' + REPO + '/components/wizard/, ' + REPO + '/components/, ' + REPO + '/app/(dashboard)/ (that is your click). NEVER invent UI that is not in the HTML or source. If you cannot find something, that IS the finding.',
  '',
  'THINK ALOUD: first person, present tense, at every step: what you see, what you expect, what you do, what surprises you. Stay ruthlessly in persona: your patience, your mental model, your vocabulary. Score sentiment per step (-2 frustrated .. +2 delighted).',
  '',
  'CONVERSATIONAL-AI CHECKS (every session): (1) prompt understanding - is it clear what the system prompt controls vs the greeting vs the voice persona? (2) response-quality expectations - does the test/talk surface set honest expectations? (3) conversation-flow config - can you find and understand turn-taking/interruption settings? (4) TTFA - count your actions from landing to first agent interaction, and to a live deployment.',
  '',
  'LOG: frustrations (S1 = would abandon, S2 = major detour, S3 = annoyance) with a verbatim think-aloud quote and where it happened; explicit needs; LATENT needs (things you did not ask for but clearly needed); aha moments; trust/explainability flags ("why did it do that?" with no on-screen answer). Finish with task results (pass/partial/fail + why), SUS-lite 1-5 each (ease, confidence, coherence, recovery, recommend), and a 2-3 sentence verdict specifically on: ' + FOCUS + '.',
].join('\n')

const PERSONAS = [
  {
    key: 'D1-hustler',
    brief: `PERSONA D1 - "The Hustler" (LEARNINGS P1, primary). You are a solo developer building a voice agent for a client TONIGHT. You have never used Agora. You skim, you click the biggest affordance, you abandon products at the second confusion. Success = an agent LIVE and calling people, fast.
TASKS: (1) Land on /agents - what is this page, what is Aria, do you trust the "Live" badge? (2) Talk to the agent - how many actions did that take? (3) Change its prompt and greeting. (4) Set up BATCH CALLS end-to-end: pick the type, caller ID, upload contacts, understand the {{variable}} mapping, find Deploy. (5) Deploy. Count every action.`,
  },
  {
    key: 'D2-switcher',
    brief: `PERSONA D2 - "The Switcher" (LEARNINGS P1 breadth). You run 40 concurrent lines on Retell today and have shipped on Vapi and ElevenLabs. You compare EVERYTHING to those consoles: assistants, dynamic variables, voice lab, batch campaigns. You are evaluating whether to migrate.
TASKS: (1) Find and judge the IMPORT path ("import an existing agent") - does it claim Retell parity and do you believe it? (2) Verify where the prompt and dynamic variables live vs Retell's model. (3) Voice: can you control the STT/LLM/TTS stack per agent? Browse voices - table stakes vs ElevenLabs? (4) Batch calls: CSV upload, variable coverage validation, concurrency/retries - parity with your Retell campaigns? (5) Trust: at any moment can you tell exactly WHAT is live and what is not?`,
  },
  {
    key: 'D3-rte-veteran',
    brief: `PERSONA D3 - "The RTE Veteran" (LEARNINGS Legacy persona). You have run Agora RTC video in production for 4 years. You think in App IDs, channels, tokens, and docs.agora.io. Wizards make you suspicious; you want the SDK path and to keep your existing app untouched.
TASKS: (1) On /agents, find the CODE/SDK path for adding the agent to YOUR existing RTC app. (2) Judge the join/leave snippets - do they map to your channel mental model? Where do credentials/App ID come from? (3) What is this "voice"/persona stuff - do you need it if you only want the pipeline? (4) Find turn-taking/interruption tuning (you care about barge-in). (5) How do you STOP the agent and what does it cost? Note every place the new IA fights your Console muscle memory.`,
  },
]

phase('Sessions')
const sessions = (await parallel(PERSONAS.map((p) => () =>
  agent(COMMON + '\n\n' + p.brief, { label: 'session:' + p.key, phase: 'Sessions', schema: SESSION_SCHEMA })
))).filter(Boolean)

phase('Synthesis')
const SYNTH_SCHEMA = {
  type: 'object',
  required: ['metricsTable', 'rankedFrustrations', 'latentNeeds', 'ahaMoments', 'trustFlags', 'fixes', 'focusVerdict', 'openQuestionsForRealUsers'],
  properties: {
    metricsTable: { type: 'object', required: ['taskSuccessPct', 'ttfaInteractionMedian', 'ttfaLiveMedian', 's1', 's2', 's3', 'sentimentMean', 'susLiteMean'], properties: {
      taskSuccessPct: { type: 'number' }, ttfaInteractionMedian: { type: 'number' }, ttfaLiveMedian: { type: 'number' },
      s1: { type: 'number' }, s2: { type: 'number' }, s3: { type: 'number' }, sentimentMean: { type: 'number' }, susLiteMean: { type: 'number' } } },
    rankedFrustrations: { type: 'array', items: { type: 'object', required: ['rank', 'severity', 'what', 'personas', 'evidence', 'suggestedFix'], properties: {
      rank: { type: 'number' }, severity: { type: 'string' }, what: { type: 'string' },
      personas: { type: 'array', items: { type: 'string' } }, evidence: { type: 'string' }, suggestedFix: { type: 'string' } } } },
    latentNeeds: { type: 'array', items: { type: 'string' } },
    ahaMoments: { type: 'array', items: { type: 'string' } },
    trustFlags: { type: 'array', items: { type: 'string' } },
    fixes: { type: 'array', items: { type: 'object', required: ['priority', 'fix', 'effort'], properties: {
      priority: { type: 'string', enum: ['P0', 'P1', 'P2'] }, fix: { type: 'string' }, effort: { type: 'string', enum: ['quick', 'medium', 'large'] } } } },
    focusVerdict: { type: 'string' },
    openQuestionsForRealUsers: { type: 'array', items: { type: 'string' } },
  },
}

const synthesis = await agent(
  [
    'You are the MODERATOR synthesizing a 3-persona simulated usability session (think-aloud) for Studio_X. Focus of this session: ' + FOCUS + ' (commit ' + COMMIT + ').',
    'Raw session logs (JSON):',
    JSON.stringify(sessions, null, 1),
    '',
    'Synthesize per references/user-testing-protocol.md: compute the metrics table (task success % across all persona-tasks; MEDIAN ttfa values; friction counts by severity; mean sentiment; SUS-lite mean scaled 0-100). Dedupe and RANK frustrations by (severity, persona overlap). Separate explicit needs from LATENT needs. Keep the best verbatim quotes as evidence. Propose fixes as P0 (must fix now) / P1 / P2 with effort quick/medium/large - fixes must be concrete and grounded in the actual UI. Give a verdict specifically on the session focus, and list open questions that only REAL users can answer.',
  ].join('\n'),
  { label: 'synthesis', phase: 'Synthesis', schema: SYNTH_SCHEMA, effort: 'high' },
)

return { sessions, synthesis }
