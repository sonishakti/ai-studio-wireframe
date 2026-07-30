# Ship Protocol — the default loop for every request

> **Standing, user-directed (2026-07-30). Applies to every new chat and every request in it.**
> Referenced from `CLAUDE.md` so it loads automatically. This is the default, not a suggestion —
> follow it unless the user says otherwise *in that request*.

## The loop

Every request that changes something a user can see runs this, end to end, without being asked:

```
research (when the ask is new)  →  build  →  typecheck + build gate
   →  commit + push  →  vercel deploy --prod  →  annotated screenshots  →  log
```

Skip a step **only** when the user says so for that request ("don't deploy", "no screenshots",
"just tell me"). Never skip silently — if a step is skipped, say which and why.

## 1. Commit + push — always

```bash
git add -A && git commit -m "<type>: <what changed and why>" && git push origin main
```

- Never wait to be asked. The user reviews the live site, not the working tree.
- Commit messages state the *why*, not just the *what*. If research or a user test drove the
  change, name the finding.
- Branch first if the change is genuinely speculative; otherwise `main` is correct here.

## 2. Deploy — always

```bash
vercel deploy --prod --yes
```

⚠️ **Vercel git auto-deploy is BROKEN on this project.** A push alone does nothing; the live
site goes stale silently. Run the deploy from the **repo root** (the prod project's Root
Directory points at `studio_x_2/`).

Then verify — a green CLI is not proof the page renders:

```bash
node -e "fetch('https://ai-studio-console-redesign.vercel.app/<route>').then(r=>console.log(r.status))"
```

## 3. Annotated screenshots — always

Every user-facing change ships with screenshots of the **live production build**, red-marked.
Each marker carries two things:

| | |
|---|---|
| **name** | what the thing is — "p95 on the row" |
| **why** | the design rationale — "Triage happens in the list. Without it you must open a session to learn it was fine." |

A red box with no rationale tells a reviewer where to look but not what decision they're
reviewing. Both fields are required; the tool has no default for `why`.

### Running it

```bash
node scripts/annotate-shots.mjs <config.json> references/<feature>-shots
```

Config is an array of shots. Full field reference is in the header of
[`scripts/annotate-shots.mjs`](../scripts/annotate-shots.mjs). Minimum viable:

```json
[{
  "name": "01-sessions-list",
  "url": "https://ai-studio-console-redesign.vercel.app/sessions",
  "wait": 4500,
  "marks": [
    { "text": "p95 response", "tags": "th",
      "name": "p95 on the row",
      "why": "Triage happens in the list, so the number that decides what to open is on the row." }
  ]
}]
```

To capture a state behind interaction (a sheet open, a dropdown expanded, a test in its success
state), add `pre` — arbitrary async JS run before the markers are drawn:

```json
"pre": "(async()=>{const s=ms=>new Promise(r=>setTimeout(r,ms));const b=t=>[...document.querySelectorAll('button')].find(x=>x.textContent.includes(t));b('Add KB').click();await s(1200);b('Connect an existing vector index').click();return 'ok'})()"
```

React-controlled inputs ignore `el.value = x`. Use the native setter:

```js
const setVal=(el,v)=>{const d=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value');
  d.set.call(el,v); el.dispatchEvent(new Event('input',{bubbles:true}))}
```

### Why a script and not the browser tools

- The **in-app browser pane caps at ~616 CSS px**, so it renders the console in its narrow
  layout. Useless for reviewing a desktop console. `resize_window` does not change the inner width.
- **`chrome --headless --screenshot` cannot inject script**, so it can't draw markers or drive
  the UI into the state worth capturing.

The script launches headless Chrome at 1600×1200 @2x and drives it over the DevTools Protocol
using Node's built-in `WebSocket` (Node 22+). Override with `SHOT_WIDTH`, `SHOT_HEIGHT`,
`CHROME_PATH`, `CDP_PORT`.

### It fails loudly

Any marker that doesn't match exits non-zero and names the miss. A stale selector is a build
failure, not a silently unmarked screenshot. Fix the selector, don't ship the shot.

### After capturing

```bash
# Retina PNGs are ~700KB each; halve them before committing.
for f in references/<feature>-shots/*.png; do sips -Z 1600 "$f" --out "$f"; done
```

## 4. The log

Every shipped slice gets a log at `references/<feature>-implementation-log-<date>.html` —
self-contained styled HTML (Instrument Sans, `--brand` cyan `#00658d` / `#00c2ff`), never a
markdown dump. Structure that works:

1. **What research found** — especially anything that changed the plan
2. **Defects fixed** — with why each mattered, before the new features
3. **Each feature** — screenshot, then a "Test it" block naming the exact clicks
4. **What was deliberately NOT built** — and which evidence argued against it
5. **What's left**

Publish it as an Artifact too. The Artifact CSP blocks external files, so build a second copy
with images inlined as data URIs and the font `<link>` stripped:

```bash
node -e "
const fs=require('fs'); let h=fs.readFileSync(SRC,'utf8');
h=h.replace(/<link[^>]*fonts[^>]*>\n?/g,'').replace(/<link rel=\"preconnect\"[^>]*>\n?/g,'');
h=h.replace(/\"Instrument Sans\",/g,'');
h=h.replace(/src=\"([^\"]+\.png)\"/g,(m,p)=>'src=\"data:image/png;base64,'+fs.readFileSync(DIR+p).toString('base64')+'\"');
fs.writeFileSync(OUT,h)"
```

## 5. What still applies

- **User-test every user-facing commit** — `.claude/workflows/user-test.js`, or the closed-loop
  `graph-loop.js`. See `references/user-testing-protocol.md`.
- **A user test's "P0 fixes" are recommendations, not authorization.** Report them or spawn a
  task chip; never auto-build new UI from them.
- **Verify sources before proposing.** Check the repo, `references/console_map/`, and
  `docs.agora.io` first. If a feature doesn't exist, skip it.
- **Design tokens only** — no hardcoded colors, no arbitrary `text-[Npx]`.
- **Mock data only.** No backend, ever.

## Quick reference

```bash
# the whole loop, after edits
cd studio_x_2 && pnpm tsc --noEmit && pnpm next build && cd ..
git add -A && git commit -m "..." && git push origin main
vercel deploy --prod --yes
node scripts/annotate-shots.mjs shots.json references/<feature>-shots
```
