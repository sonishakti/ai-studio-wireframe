#!/usr/bin/env python3
"""Row packet: everything an agent needs about ONE v3 job step, small enough to read
in full (about 3k tokens), so no agent ever opens prd-v3.json (115k tokens).

  python3 references/automation/lean/make-packet.py P0.5 P0.6 …   # or: all P0 / all P1
Writes references/v3/features/<id>/row.md
"""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
PRD = os.path.join(ROOT, "references/v3/03-strategy/prd-v3.json")
d = json.load(open(PRD))
feats = {f["id"]: f for f in d["features"]}
order = [f["id"] for f in d["features"]]

args = sys.argv[1:]
if args[:1] == ["all"]:
    ids = [i for i in order if i.startswith(args[1] + ".")]
else:
    ids = args

vocab = d.get("funnel", {}).get("vocabulary", [])
vocab_lines = [f"- use **{v['use']}**, never: {v['never']}" for v in vocab]

for fid in ids:
    f = feats[fid]
    m = f.get("more", {})
    k = f.get("kpi", {})
    prev = order[order.index(fid) - 1] if order.index(fid) > 0 else None
    L = [f"# {fid} · {f['title']}  (phase {f['p']}, budget {f['d']} d, sheet row #{fid})", ""]
    L += ["## Job", f"- Situation: {f['step']}", f"- Story: {f['happy'].get('story', '')}", ""]
    L += [f"## Happy path {f['happy']['id']}"] + [f"{i}. {s}" for i, s in enumerate(f["happy"]["steps"], 1)] + [""]
    L += ["## Rainy paths"] + [f"- **{r['id']}** {r['title']}: {r['recovery']}" for r in f["rainy"]] + [""]
    L += ["## Goal", f"- {f.get('kpi_simple', '')}", f"- Target: {k.get('target', '')}", f"- Counter: {k.get('counter', '')}",
          "- Events: " + ", ".join(e["name"] for e in k.get("events", [])), ""]
    L += ["## Scope (subtasks)"] + [f"- {s}" for s in m.get("subtasks", [])] + [""]
    L += ["## API", f"- {m.get('api', '')}", f"- Register: {m.get('req', '')} · Journeys: {', '.join(m.get('journeys', []))}", ""]
    L += ["## Research already done (reuse, do not re-capture; paths relative to references/)"]
    L += [f"- {r['vendor']}: {r['status']}. {r['note']}" for r in f.get("research", [])]
    if m.get("research_brief"):
        L += [f"- Owed (only if a rainy path has no evidence at all): {m['research_brief']}"]
    L += [""]
    if fid.startswith("P1") or fid.startswith("P2"):
        L += ["## Monitoring research index (references/v3/02-research/monitoring/, 61 shots; pick from here, no browsing)"]
        L += [f"- {s['vendor']}: {s['img']} · {s['what'][:110]}" for s in d["monitoring"].get("shots", [])]
        L += [""]
    L += ["## Previous row", f"- {prev}: read only its `features/{prev}/summary.md` if it exists (never its full spec)." if prev else "- none", ""]
    L += ["## Locked vocabulary"] + vocab_lines
    out = os.path.join(ROOT, "references/v3/features", fid, "row.md")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write("\n".join(L) + "\n")
    print(out, len("\n".join(L)) // 4, "tokens approx")
