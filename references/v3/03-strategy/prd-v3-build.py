#!/usr/bin/env python3
"""Build the Studio v3 sheet (artifact page) and the ClickUp task descriptions from prd-v3.json.

Usage: python3 prd-v3-build.py [--db <dir with features/*.json>] [--v31 <v31-tasks.json>] [--out <dir>]

Outputs (in --out, default this folder):
  prd-v3.html            the sheet (publish as the artifact, with sam.webp beside it)
  clickup/<id>.md        one markdown description per v3 feature (42), human first, agent footnote last
  clickup/v31-badge.md   the badge line to prepend to each v3.1 task (28)
  clickup/list.md        the Design Tracker list description
  build-manifest.json    feature id -> ClickUp task id, name, description path
"""
import json, os, re, sys, glob, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
args = dict(zip(sys.argv[1::2], sys.argv[2::2]))
DB = args.get('--db')
V31 = args.get('--v31')
OUT = args.get('--out', HERE)
os.makedirs(os.path.join(OUT, 'clickup'), exist_ok=True)

D = json.load(open(os.path.join(HERE, 'prd-v3.json')))
TODAY = datetime.date.today().isoformat()
SHEET = 'https://claude.ai/artifact/6YZCRsJvpoBthj4fnm9XAb'
FIGMA_FILE = 'https://www.figma.com/design/OIKZExT265nOJotBlmv2Ah/'
LIST_HOME = '901115453665'  # Product › Design Tracker › 1. V3
LIST_TRACKER = '901115453666'  # Product › Design Tracker › 2. Future Sprints
SLACK = '#design-agent-reviews'
RUNS = ['08:00', '11:59', '16:00', '20:00']
# ClickUp status name -> board column label (the folder keeps the space names until the owner renames them)
COLUMN = {'open': 'To-do', 'to-do': 'To-do', 'todo': 'To-do', 'added': 'To-do', 'clarified': 'To-do', 'planning': 'To-do', 'pending': 'To-do',
          'in progress': 'In progress', 'in review': 'Pending Review', 'pending review': 'Pending Review',
          'completed': 'Delivered', 'closed': 'Delivered', 'delivered': 'Delivered', 'in version': 'Delivered'}

# NN/g job map stage per job step (Ulwick: define, locate, prepare, confirm, execute, monitor, modify, conclude)
JOBMAP = {
 'P0.1': 'Define', 'P0.2': 'Prepare', 'P0.3': 'Prepare', 'P0.4': 'Define', 'P0.5': 'Prepare', 'P0.6': 'Prepare',
 'P0.7': 'Confirm', 'P0.8': 'Confirm', 'P0.9': 'Execute', 'P0.10': 'Execute', 'P0.11': 'Execute', 'P0.12': 'Confirm',
 'P0.13': 'Prepare', 'P0.14': 'Modify', 'P0.15': 'Conclude',
 'P1.1': 'Monitor', 'P1.2': 'Locate', 'P1.3': 'Monitor', 'P1.4': 'Locate', 'P1.5': 'Monitor', 'P1.6': 'Modify',
 'P1.7': 'Monitor', 'P1.8': 'Confirm', 'P1.9': 'Define', 'P1.10': 'Cross-cutting', 'P1.11': 'Monitor',
 'P2.1': 'Locate', 'P2.2': 'Locate', 'P2.3': 'Execute', 'P2.4': 'Conclude', 'P2.5': 'Monitor', 'P2.6': 'Confirm',
 'P2.7': 'Locate', 'P2.8': 'Locate', 'P2.9': 'Locate', 'P2.10': 'Locate',
 'P3.1': 'Modify', 'P3.2': 'Monitor', 'P3.3': 'Define', 'P3.4': 'Prepare', 'P3.5': 'Modify', 'P3.6': 'Cross-cutting',
}
JOBMAP_WHY = {
 'Define': 'Sam decides what the job needs before doing it',
 'Locate': 'Sam finds the inputs, the session or the cause',
 'Prepare': 'Sam sets things up so the job can run',
 'Confirm': 'Sam checks it is right before going on',
 'Execute': 'Sam does the core job',
 'Monitor': 'Sam watches whether it keeps working',
 'Modify': 'Sam adjusts without breaking what runs',
 'Conclude': 'Sam wraps up or hands on',
 'Cross-cutting': 'A requirement that every step shares, not a step of its own',
}
# ClickUp task per feature (home list 901115448379, mirrored in the Design Tracker list)
CLICKUP = {
 'P0.1': ('868m9wg1c', 'APP-9358'), 'P0.2': ('868m9wg1x', 'APP-9359'), 'P0.3': ('868m9wg2e', 'APP-9360'), 'P0.4': ('868m9wg2w', 'APP-9361'),
 'P0.5': ('868m9wg37', 'APP-9362'), 'P0.6': ('868m9wg3x', 'APP-9363'), 'P0.7': ('868m9wg4c', 'APP-9364'), 'P0.8': ('868m9wg4y', 'APP-9365'),
 'P0.9': ('868m9wg59', 'APP-9366'), 'P0.10': ('868m9wg5q', 'APP-9367'), 'P0.11': ('868m9wg61', 'APP-9368'), 'P0.12': ('868m9x4bm', 'APP-9385'),
 'P0.13': ('868m9x4cc', 'APP-9386'), 'P0.14': ('868ma8q59', 'APP-9397'), 'P0.15': ('868ma8q5n', 'APP-9398'),
 'P1.1': ('868m9wg6k', 'APP-9369'), 'P1.2': ('868m9wg7e', 'APP-9370'), 'P1.3': ('868m9wg8u', 'APP-9371'), 'P1.4': ('868m9wga0', 'APP-9372'),
 'P1.5': ('868m9wgbc', 'APP-9373'), 'P1.6': ('868m9wgcj', 'APP-9374'), 'P1.7': ('868m9wge4', 'APP-9375'), 'P1.8': ('868m9x4ed', 'APP-9387'),
 'P1.9': ('868m9x4f1', 'APP-9388'), 'P1.10': ('868ma8ev9', 'APP-9393'), 'P1.11': ('868ma8qbq', 'APP-9399'),
 'P2.1': ('868m9wgfk', 'APP-9376'), 'P2.2': ('868m9wggy', 'APP-9377'), 'P2.3': ('868m9wgj8', 'APP-9378'), 'P2.4': ('868m9wgkf', 'APP-9379'),
 'P2.5': ('868m9wgmk', 'APP-9380'), 'P2.6': ('868m9x4fe', 'APP-9389'), 'P2.7': ('868m9x4fq', 'APP-9390'), 'P2.8': ('868ma8evd', 'APP-9394'),
 'P2.9': ('868ma8evh', 'APP-9395'), 'P2.10': ('868ma8evm', 'APP-9396'),
 'P3.1': ('868m9wgne', 'APP-9381'), 'P3.2': ('868m9wgpc', 'APP-9382'), 'P3.3': ('868m9wgq5', 'APP-9383'), 'P3.4': ('868m9wgqx', 'APP-9384'),
 'P3.5': ('868m9x4gm', 'APP-9391'), 'P3.6': ('868m9x4hy', 'APP-9392'),
}
# Rule 0 (owner, 26 Sep): before researching or designing, ask whether a new logged-in account has the data the flow shows,
# where to get it from outside our accounts, and what to create in our own account.
DATA_KW = [
 ('production sessions', r'\bsession'), ('turns, transcript, recording', r'\bturn\b|transcript|recording'),
 ('error groups and log lines', r'\berror|log line|\blogs?\b'), ('phone numbers', r'\bnumber'),
 ('batch runs and contact lists', r'\brun\b|campaign|contact list'), ('secrets and provider keys', r'\bsecret|byok|credential|api key'),
 ('integrations (MCP servers, tools)', r'\bmcp\b|integration|\btools?\b'), ('billing, free minutes, a card', r'\bminute|billing|\bcard\b|suspend'),
 ('analysis results', r'\banalysis|structured_output'), ('several agents', r'\bagents\b|second agent|team\'s agents'),
]
RULE0 = {
 'P0': {'new': 'A new account has no agent and no session; the flow creates them. Presets, voices and provider lists exist without data.',
        'external': 'Retell and ElevenLabs signed-in accounts (competitor profile) already hold configured agents; LiveKit and Vapi docs for create and test flows; Refero for create sheets and test panels.',
        'create': '1 agent per deployment type (inbound, batch, code), 1 secret set with one wrong key to reach the failure state, 2 test sessions (one heard, one failed).'},
 'P1': {'new': 'A new account has no production sessions, no errors and no runs: every monitoring view opens empty. The empty state is a rainy scenario, never the research.',
        'external': 'LiveKit and Retell signed-in accounts hold sessions and call history; Datadog, Sentry and Honeycomb docs for error groups and traces (shots in v3/02-research/monitoring); Twilio docs for call logs; Bland for batch lifecycle.',
        'create': '2 agents, 10 test sessions of which 3 forced failures (invalid BYOK key, unreachable number, idle timeout), 1 batch run with 5 contacts, 1 number pointed at an agent, then wait for the sessions to land in history. Note the app id and the session ids for the screenshots.'},
 'P2': {'new': 'A new account has no sessions to open and nothing to filter. Session detail, turns and logs also depend on server gaps G2, G4, G11, G13.',
        'external': 'Retell call history and LiveKit sessions (signed-in), Langfuse and LangSmith docs for trace timelines and filters, Twilio event streams; the 61 monitoring shots already captured.',
        'create': 'the same 10 test sessions as P1 plus 1 session with zero retention and 1 with a long silence, so history shows a failed, a zero-retention and a slow session side by side.'},
 'P3': {'new': 'A new account has one project, no numbers, no secrets and no integrations. Lists open empty; reuse and replace flows need at least two items.',
        'external': 'Vapi and Retell signed-in accounts for numbers and keys pages; ElevenLabs for tools and MCP; the v3 API spec for every field.',
        'create': '2 secret sets (one referenced by an agent), 3 numbers (one unassigned for 7 days), 2 MCP servers shared by 2 agents, 1 API-created agent to test code and hand edits.'},
}

def fmt(s):
    if not s: return ''
    try:
        d = datetime.date.fromisoformat(s[:10]); return d.strftime('%a %-d %b')
    except Exception: return s

def story_parts(story):
    m = re.match(r'^Sam wants (?:to )?(.*?), so (?:that )?(.*)$', story)
    if m: return m.group(1).strip(), m.group(2).strip().rstrip('.')
    return None, None

def sentences(text):
    return [s.strip() for s in re.split(r'(?<=[.%\)])\s+(?=[A-Z])', text) if s.strip()]

# live rows from the tracker db (snapshot); the page also reads them live
live = {}
if DB:
    for p in glob.glob(os.path.join(DB, 'features', '*.json')):
        try:
            r = json.load(open(p)); live[r.get('id') or os.path.basename(p)[:-5]] = r
        except Exception: pass
sched = D.get('schedule', {})
for f in D['features']:
    s = dict(sched.get(f['id'], {}))
    s.update({k: v for k, v in live.get(f['id'], {}).items() if v not in (None, '')})
    sched[f['id']] = s
D['schedule'] = sched

# per-feature derived fields
for f in D['features']:
    f['jobmap'] = JOBMAP.get(f['id'], '')
    f['jobmap_why'] = JOBMAP_WHY.get(f['jobmap'], '')
    t, c = CLICKUP.get(f['id'], ('', ''))
    f['clickup'] = {'task': t, 'custom': c, 'url': f'https://app.clickup.com/t/{t}' if t else ''}
    want, so = story_parts(f['happy']['story'])
    f['story'] = {'want': want, 'so': so}
    blob = ' '.join([f['step'], ' '.join(f['happy']['steps']), ' '.join(r['title'] + ' ' + r['recovery'] for r in f['rainy']), f['more'].get('api', ''), f['kpi'].get('formula', '')]).lower()
    f['data'] = [name for name, rx in DATA_KW if re.search(rx, blob)]
    f['rule0'] = RULE0.get(f['p'], {})
    gaps = sorted(set(re.findall(r'\bG\d{1,2}\b', ' '.join([f['kpi'].get('formula', ''), f['kpi'].get('counter', ''), f['more'].get('api', ''), ' '.join(f['kpi'].get('events') and [e['name'] for e in f['kpi']['events']] or [])]))), key=lambda g: int(g[1:]))
    f['gaps'] = gaps

# umbrellas: split the KPI detail into scannable lines
for u in D['umbrellas']:
    u['kpi_lines'] = [{'lead': (s.split(':', 1)[0] if ':' in s and len(s.split(':', 1)[0]) < 60 else ''), 'text': (s.split(':', 1)[1].strip() if ':' in s and len(s.split(':', 1)[0]) < 60 else s)} for s in sentences(u.get('kpi_detail', ''))]
    u['rule0'] = RULE0.get(u['id'], {})

# v3.1 (new features) from ClickUp
v31 = []
if V31 and os.path.exists(V31):
    for t in json.load(open(V31)):
        md = t.get('markdown_description') or ''
        g = lambda k: (re.search(r'\*\*' + k + r':\*\*\s*(.*)', md) or [None, ''])[1].strip()
        num = (re.match(r'^(\d\d)', t['name']) or [None, ''])[1]
        rl = re.search(r'\*\*Research:\*\*\s*(.*?)\s*·\s*\*\*UI:\*\*\s*(.*?)\s*·\s*\*\*Final:\*\*\s*(.*)', md)
        v31.append({
            'num': num, 'id': t['id'], 'name': t['name'], 'url': t.get('url', ''), 'status': COLUMN.get(str(t.get('status', '')).lower(), 'To-do'), 'priority': t.get('priority') if isinstance(t.get('priority'), str) else (t.get('priority') or {}).get('priority', '') if t.get('priority') else '',
            'due': datetime.datetime.utcfromtimestamp(int(t['due_date']) / 1000).date().isoformat() if t.get('due_date') else '',
            'tags': g('Tags'), 'jtbd': g('JTBD'), 'what': g('What it does'), 'locks': g('Locks'), 'folder': g('Research folder'),
            'research': rl.group(1) if rl else '', 'ui': rl.group(2) if rl else '', 'final': rl.group(3) if rl else '',
            'roadmap': re.findall(r'\*\s+\[(.*?)\]\((https://app\.clickup\.com/t/\w+)\)', md),
        })
    v31.sort(key=lambda x: x['num'])
D['v31'] = v31

D['meta'] = {'built': TODAY, 'runs': RUNS, 'sheet': SHEET, 'list_home': LIST_HOME, 'list_tracker': LIST_TRACKER, 'slack': SLACK, 'figma_file': FIGMA_FILE}
D['rule0'] = RULE0
D['practices'] = D.get('practices') or []
if os.path.exists(os.path.join(HERE, 'prd-v3-practices.json')):
    D['practices'] = json.load(open(os.path.join(HERE, 'prd-v3-practices.json')))

# ---------- the page ----------
tpl = open(os.path.join(HERE, 'prd-v3-template.html'), encoding='utf-8').read()
html = tpl.replace('__DATA__', json.dumps(D, ensure_ascii=False).replace('</', '<\\/'))
open(os.path.join(OUT, 'prd-v3.html'), 'w', encoding='utf-8').write(html)

# ---------- ClickUp descriptions: human first, one footnote for the agent at the end ----------
UMB = {u['id']: u for u in D['umbrellas']}

def fired(s):
    return 'server' if s == 'server' else 'derived' if s == 'derived' else 'client (PostHog)'

def desc(f):
    u = UMB[f['p']]; s = D['schedule'].get(f['id'], {}); k = f['kpi']; r0 = f['rule0']
    L = []
    L.append(f"🏷 **V3 · launch Fri 16 Oct 2026** · {f['p']} {u['name']} · design ETA **{fmt(s.get('design_eta')) or 'after sign-off'}** · lock ETA **{fmt(s.get('lock_eta')) or 'after sign-off'}**")
    L.append('')
    L.append('## Job to be done (Sam, a developer)')
    L.append(f"**Job:** {f['title']} · job map: {f['jobmap']}")
    L.append(f"**Umbrella job ({f['p']}):** {u['job']}")
    L.append(f"**Situation:** {f['step']}")
    if f['story']['want']:
        L.append(f"**Sam wants to:** {f['story']['want']}")
        L.append(f"**So that:** {f['story']['so']}")
    else:
        L.append(f"**Story:** {f['happy']['story']}")
    L.append('')
    L.append(f"### {f['happy']['id']} Happy path: what Sam does")
    for i, stp in enumerate(f['happy']['steps'], 1): L.append(f"{i}. {stp}")
    L.append('')
    L.append('### Rainy paths: when it goes wrong')
    for r in f['rainy']: L.append(f"*   **{r['id']}** {r['title']}: {r['recovery']}")
    L.append('')
    L.append('## Goal (KPI)')
    L.append(f"**{f['kpi_simple']}**")
    L.append(f"*   Metric: {k['metric']}")
    L.append(f"*   Target: {k['target']}")
    L.append(f"*   How we measure: {k['formula']}")
    L.append(f"*   Counter-metric: {k['counter']}")
    L.append(f"*   Assumption: {k['assumption']}")
    L.append('')
    L.append('## Telemetry')
    L.append('| Event | Fired by | Status |')
    L.append('| --- | --- | --- |')
    for e in k['events']: L.append(f"| `{e['name']}` | {fired(e['status'])} | {e['status']} |")
    if f['more'].get('funnel'): L.append(f"\nFunnel stages this moves: {' · '.join(f['more']['funnel'])}")
    if f['gaps']: L.append(f"Server gaps that block the read: {', '.join(f['gaps'])}")
    L.append('')
    L.append('## Research')
    L.append('| Competitor | Status | Note |')
    L.append('| --- | --- | --- |')
    for r in f['research']: L.append(f"| {r['vendor']} | {r['status']} | {r['note']} |")
    if f['more'].get('research_brief'): L.append(f"\nStill owed: {f['more']['research_brief']}")
    L.append('')
    L.append('## Deliverables')
    L.append(f"*   Prototype: {s.get('web') or 'not yet'}")
    L.append(f"*   Figma flow: {s.get('figma') or 'not yet'} (page v3 · {f['p']} {u['name']}, section {f['id']} · {f['title']})")
    L.append(f"*   Commit: {('`' + s['commit'] + '` on design/v3, locked ' + fmt(s.get('locked_at'))) if s.get('commit') else 'not yet'}")
    L.append(f"*   Sheet row: {SHEET}#{f['id']}")
    L.append('')
    L.append('---')
    L.append('')
    L.append('###### Footnote for the design agent')
    L.append(f"Scope: {'; '.join(f['more'].get('subtasks', []))}.")
    L.append(f"API: {f['more'].get('api','')} Register: {f['more'].get('req','')} Journeys: {' · '.join(f['more'].get('journeys', []))}. Days: {f['d'] or 'none, proposed'}.")
    L.append(f"Rule 0, data first. This flow shows: {', '.join(f['data']) or 'no stored data'}. New account: {r0.get('new','')} Outside our accounts: {r0.get('external','')} Create in our account: {r0.get('create','')}")
    L.append(f"Files: references/v3/features/{f['id']}/ (jtbd, directions, build spec, flow/ screenshots, shots/ research).")
    L.append('Columns: To-do = planned, in the order it gets done · In progress = taken at a run (08:00, 11:59, 16:00, 20:00) · Pending Review = delivered, pending Shakti · Delivered = approved and locked (Figma frozen, commit). Changes: drag back to In progress + comment `change: …`.')
    L.append('Rules: existing Console design system only (docs/design/DESIGN.md, design/v3); reuse, do not redesign; empty first, quiet chrome; sentence case, no arrows or em dashes; locked words; Sam only in job text; never change a locked feature unless in scope, then say so. One run delivers: prototype for the happy path and every rainy state, one screenshot per step, the Figma flow with "Sam does …" captions and rationale, this task in review with a comment, the sheet row, one Slack post.')
    return '\n'.join(L)

manifest = {}
for f in D['features']:
    p = os.path.join(OUT, 'clickup', f"{f['id']}.md")
    open(p, 'w', encoding='utf-8').write(desc(f))
    manifest[f['id']] = {'task': f['clickup']['task'], 'custom': f['clickup']['custom'], 'name': f"{f['id']} · {f['title']}", 'desc': p,
                         'start': D['schedule'].get(f['id'], {}).get('design_eta', ''), 'due': D['schedule'].get(f['id'], {}).get('lock_eta', '')}

V31_BADGE = '🏷 **NEW FEATURES · v3.1** · after the 16 Oct v3 launch · sheet: ' + SHEET + '\n\n'
open(os.path.join(OUT, 'clickup', 'v31-badge.md'), 'w', encoding='utf-8').write(V31_BADGE)
open(os.path.join(OUT, 'clickup', 'list.md'), 'w', encoding='utf-8').write('Folder Design Tracker: 1. V3 (42 job steps, P0.1 to P3.6, in the order they get done) and 2. Future Sprints (28 roadmap features, 01 to 28). Four columns each: To-do, In progress, Pending Review, Delivered. Live sheet: ' + SHEET)
json.dump(manifest, open(os.path.join(OUT, 'build-manifest.json'), 'w'), indent=1)
print('built', os.path.join(OUT, 'prd-v3.html'), len(html), 'bytes;', len(manifest), 'v3 descriptions;', len(v31), 'v3.1 rows; live rows', len(live))
