#!/usr/bin/env python3
"""make-figma-plan.py <id> — builds references/v3/features/<id>/figma-plan.json

Reads row.md (+ 01-jtbd.md, 03-before-after.md if present) and the row's
flow/ and shots/ directories, and emits a single JSON "plan" consumed by
v3-figma-runner.js (via use_figma). Never opens prd-v3.json. Reads files by
section, not whole-file dumps, per references/automation/lean/rules.md.

Usage: python3 make-figma-plan.py P0.4
Output: references/v3/features/P0.4/figma-plan.json

Convention (matches scripts/build-figma-sections.mjs): every image entry
carries a local `path` and a `hash: null` slot. Images are uploaded to the
Figma file separately (upload_assets -> POST bytes -> hash), and the hash is
filled into this JSON before v3-figma-runner.js runs. A shot whose hash is
still null renders as a "pending upload" placeholder, never a broken node.
"""
import json
import re
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parents[3]
FEATURES = ROOT / "references" / "v3" / "features"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def section(text: str, heading_prefix: str) -> str:
    """Return the body of the first `## <heading_prefix...>` section (up to the next `## `)."""
    lines = text.splitlines()
    start = None
    for i, ln in enumerate(lines):
        if ln.startswith("## ") and ln[3:].strip().lower().startswith(heading_prefix.lower()):
            start = i + 1
            break
    if start is None:
        return ""
    end = len(lines)
    for i in range(start, len(lines)):
        if lines[i].startswith("## "):
            end = i
            break
    return "\n".join(lines[start:end]).strip()


def row_title(row_md: str) -> str:
    m = re.search(r"^#\s+(P[\d.]+)\s*·\s*(.+?)\s*(\(|$)", row_md, re.M)
    if m:
        return m.group(2).strip()
    m = re.search(r"^#\s+(.+)$", row_md, re.M)
    return m.group(1).strip() if m else ""


def parse_happy_steps(row_md: str) -> list:
    body = ""
    for ln in row_md.splitlines():
        if ln.startswith("## Happy path"):
            body = section(row_md, "Happy path")
            break
    steps = []
    for ln in body.splitlines():
        m = re.match(r"\s*(\d+)\.\s+(.*)", ln)
        if m:
            steps.append(m.group(2).strip())
    return steps


def parse_rainy(row_md: str) -> list:
    body = section(row_md, "Rainy paths")
    out = []
    for ln in body.splitlines():
        m = re.match(r"\s*-\s*\*\*P[\d.]+\.(\w)\*\*\s*(.+)", ln)
        if not m:
            continue
        letter, rest = m.group(1), m.group(2)
        title = rest.split(":", 1)[0].strip()
        out.append({"id": "." + letter, "title": title})
    return out


def parse_jtbd(jtbd_md: str) -> dict:
    body = section(jtbd_md, "Job step")
    fields = {"job": "", "situation": "", "wantsTo": "", "soThat": ""}
    patterns = [
        (r"\*\*Job\.\*\*\s*(.+)", "job"),
        (r"\*\*Situation\.\*\*\s*(.+)", "situation"),
        (r"\*\*Sam wants to\*\*\s*(.+)", "wantsTo"),
        (r"\*\*So that\*\*\s*(.+)", "soThat"),
    ]
    for ln in body.splitlines():
        for pat, key in patterns:
            m = re.search(pat, ln)
            if m:
                fields[key] = m.group(1).strip().rstrip(".")
    return fields


def parse_research_finding(row_md: str):
    body = section(row_md, "Research already done")
    bullets = [ln.strip("- ").strip() for ln in body.splitlines() if ln.strip().startswith("-")]
    owed = [b for b in bullets if b.lower().startswith("owed")]
    finding = owed[0] if owed else (bullets[0] if bullets else "")
    vendors = []
    for b in bullets:
        m = re.match(r"\*\*(\w[\w &]*)\*\*", b) or re.match(r"(\w[\w]*):", b)
        if m:
            vendors.append(m.group(1))
    return finding, bullets


def parse_rationale(before_after_md: str) -> list:
    lines = before_after_md.splitlines()
    rows = []
    in_table = False
    for ln in lines:
        if ln.strip().startswith("| Before | After | Why |"):
            in_table = True
            continue
        if in_table:
            if not ln.strip().startswith("|"):
                break
            if set(ln.strip()) <= set("|-: "):
                continue
            cells = [c.strip() for c in ln.strip().strip("|").split("|")]
            if len(cells) >= 3 and cells[1] and cells[2]:
                after = re.sub(r"\*\*", "", cells[1])
                why = re.sub(r"\*\*", "", cells[2])
                rows.append(f"{after} — {why}")
    # cap at 5 lines; authored (ClickUp/table) order is kept as-is
    return rows[:5] if rows else []


def slugify_caption(stem: str) -> str:
    # "07-rainy-b-cleared" -> "cleared" ; "01-empty-prompt" -> "empty-prompt"
    parts = stem.split("-")
    if parts and parts[0].isdigit():
        parts = parts[1:]
    if parts and parts[0] == "rainy" and len(parts) > 1 and len(parts[1]) == 1:
        parts = parts[2:]
    words = " ".join(parts).strip()
    if not words:
        return "Sam continues"
    return "Sam " + words if not words.lower().startswith("sam") else words


def build_flow(flow_dir: Path, happy_steps: list, rainy: list) -> list:
    if not flow_dir.exists():
        return []
    files = sorted(p for p in flow_dir.iterdir() if p.suffix.lower() == ".png")
    rainy_by_letter = {r["id"]: r["title"] for r in rainy}
    happy_out, rainy_out = [], []
    happy_idx = 0
    for f in files:
        stem = f.stem
        m = re.match(r"\d+[a-z]?-rainy-(\w)-", stem)
        if m:
            letter = "." + m.group(1)
            caption = rainy_by_letter.get(letter, slugify_caption(stem))
            rainy_out.append({"path": str(f.relative_to(ROOT)), "hash": None, "caption": caption, "rainyId": letter})
        else:
            if happy_idx < len(happy_steps):
                caption = happy_steps[happy_idx]
                happy_idx += 1
            else:
                caption = slugify_caption(stem)
            happy_out.append({"path": str(f.relative_to(ROOT)), "hash": None, "caption": caption})
    return happy_out + rainy_out  # happy before rainy, each already in filename order


def build_research(shots_dir: Path, limit: int = 6) -> list:
    if not shots_dir.exists():
        return []
    files = sorted(p for p in shots_dir.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
    return [{"path": str(f.relative_to(ROOT)), "hash": None, "label": f.stem} for f in files[:limit]]


def main():
    if len(sys.argv) != 2:
        print("usage: make-figma-plan.py <id>  e.g. P0.4", file=sys.stderr)
        sys.exit(1)
    row_id = sys.argv[1]
    feature_dir = FEATURES / row_id
    row_md = read(feature_dir / "row.md")
    if not row_md:
        print(f"no row.md for {row_id} at {feature_dir}", file=sys.stderr)
        sys.exit(1)
    jtbd_md = read(feature_dir / "01-jtbd.md")
    before_after_md = read(feature_dir / "03-before-after.md")
    summary_md = read(feature_dir / "summary.md")

    title = row_title(row_md)
    happy_steps = parse_happy_steps(row_md)
    rainy = parse_rainy(row_md)
    jtbd = parse_jtbd(jtbd_md) if jtbd_md else {"job": "", "situation": "", "wantsTo": "", "soThat": ""}
    finding, _bullets = parse_research_finding(row_md)
    rationale = parse_rationale(before_after_md) if before_after_md else []

    flow = build_flow(feature_dir / "flow", happy_steps, rainy)
    happy_flow = [f for f in flow if "rainyId" not in f]
    hero = []
    if happy_flow:
        first = happy_flow[0]
        last = happy_flow[-1]
        hero = [first] if first is last else [first, last]

    research_images = build_research(feature_dir / "shots")

    # links: only ever taken from row.md / summary.md text; never guessed.
    def find_link(text: str, *keywords: str):
        for ln in text.splitlines():
            if any(k.lower() in ln.lower() for k in keywords):
                m = re.search(r"https?://\S+", ln)
                if m:
                    return m.group(0).rstrip(").,")
        return None

    combined = row_md + "\n" + summary_md
    clickup = find_link(combined, "clickup", "app.clickup.com")
    tracker = find_link(combined, "tracker", "artifact", "sheet")
    prototype = find_link(combined, "prototype", "vercel.app", "/v3?")

    plan = {
        "id": row_id,
        "title": title,
        "name": f"{row_id} · {title}",
        "jtbd": {
            "job": jtbd.get("job", ""),
            "situation": jtbd.get("situation", ""),
            "wantsTo": jtbd.get("wantsTo", ""),
            "soThat": jtbd.get("soThat", ""),
            "happySteps": happy_steps,
            "rainyTitles": rainy,
        },
        "research": {
            "images": research_images,
            "finding": finding,
        },
        "flow": flow,
        "hero": hero,
        "rationale": rationale,
        "links": {
            "clickup": clickup,
            "tracker": tracker,
            "prototype": prototype,
        },
    }

    out_path = feature_dir / "figma-plan.json"
    out_path.write_text(json.dumps(plan, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
