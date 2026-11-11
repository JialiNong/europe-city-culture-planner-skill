#!/usr/bin/env python3
"""Render a city itinerary JSON file into one standalone HTML page (styles and script inlined, works offline).
把城市行程 JSON 渲染成一个独立的 HTML 文件（样式和脚本都内联，离线也能打开）。

Usage / 用法: python3 render.py <plan.json> [output.html]
Standard library only, so it also runs in sandboxes without Node (e.g. ChatGPT's code interpreter).
"""
import html
import json
import re
import sys
from pathlib import Path

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "template"


def is_loc(v):
    return isinstance(v, dict) and len(v) > 0 and all(k in ("zh", "en") for k in v)


def is_text(v):
    """A text field is a non-empty string or a localized object such as {"zh": "…", "en": "…"}."""
    return (isinstance(v, str) and v != "") or (is_loc(v) and any(isinstance(x, str) and x for x in v.values()))


def text(v, lang=None):
    if isinstance(v, str):
        return v
    if is_loc(v):
        return v.get("en" if lang == "en" else "zh") or v.get("zh") or v.get("en") or ""
    return ""


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def validate(d):
    """Only checks what rendering needs; see schema/city.schema.json for the full format."""
    p = []
    if not isinstance(d, dict):
        return ["the top level must be an object"]
    for k in ("title", "city", "queriedAt"):
        if not is_text(d.get(k)):
            p.append(f'missing text field "{k}"')
    if d.get("lang") is not None and d["lang"] not in ("zh", "en"):
        p.append('"lang" must be "zh" or "en"')
    langs = d.get("languages")
    if langs is not None and (not isinstance(langs, list) or any(x not in ("zh", "en") for x in langs)):
        p.append('"languages" must be an array of "zh" / "en"')
    cats = ("market", "arch", "art", "artclassic", "alt", "view", "ride", "tour", "history", "nature", "event", "food", "other")
    days = d.get("days")
    if not isinstance(days, list):
        p.append('"days" must be an array')
        return p
    for i, day in enumerate(days):
        did = f"day {i + 1}"
        if not isinstance(day, dict):
            p.append(f"days[{i}] must be an object")
            continue
        stops = day.get("stops")
        if not isinstance(stops, list):
            p.append(f'{did}: "stops" must be an array')
            continue
        for j, s in enumerate(stops):
            if not is_text(s.get("name")):
                p.append(f"{did}, stop {j + 1}: missing name")
            if s.get("cat") and s["cat"] not in cats:
                p.append(f'{did}, stop {j + 1}: unknown cat "{s["cat"]}"')
            if (s.get("lat") is not None or s.get("lng") is not None) and not (is_num(s.get("lat")) and is_num(s.get("lng"))):
                p.append(f"{did}, stop {j + 1}: lat and lng must both be numbers")
    for i, b in enumerate(d.get("bookAhead") or []):
        if b.get("status") and b["status"] not in ("urgent", "soon", "ok", "done"):
            p.append(f"bookAhead[{i}]: status must be urgent / soon / ok / done")
    for i, x in enumerate(d.get("shows") or []):
        if x.get("kind") and x["kind"] not in ("concert", "comedy", "theatre", "festival"):
            p.append(f"shows[{i}]: kind must be concert / comedy / theatre / festival")
        if x.get("status") and x["status"] not in ("onsale", "few", "soldout", "resale", "soon"):
            p.append(f"shows[{i}]: status must be onsale / few / soldout / resale / soon")
    for i, x in enumerate(d.get("media") or []):
        if not is_text(x.get("title")):
            p.append(f"media[{i}] is missing title")
        if x.get("kind") and x["kind"] not in ("film", "doc", "series", "book", "podcast"):
            p.append(f"media[{i}]: kind must be film / doc / series / book / podcast")
    return p


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python3 render.py <plan.json> [output.html]")
    src = Path(sys.argv[1])
    try:
        data = json.loads(src.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"Could not parse JSON: {e}")
    problems = validate(data)
    if problems:
        sys.exit("The JSON does not match the expected format:\n- " + "\n- ".join(problems))

    shell = (TEMPLATE_DIR / "shell.html").read_text(encoding="utf-8")
    style = (TEMPLATE_DIR / "style.css").read_text(encoding="utf-8")
    script = (TEMPLATE_DIR / "render.js").read_text(encoding="utf-8")
    # Escape "</" so text inside the JSON can never close the <script> tag early.
    payload = json.dumps(data, ensure_ascii=False, indent=2).replace("</", "<\\/")
    lang = data.get("lang")
    title = text(data.get("title"), lang) or text(data.get('city'), lang)
    parts = {"TITLE": html.escape(title), "STYLE": style, "DATA": payload, "SCRIPT": script}
    # One pass over the shell, so placeholder-like text inside the data is never replaced.
    out = re.sub(r"\{\{(TITLE|STYLE|DATA|SCRIPT)\}\}", lambda m: parts[m.group(1)], shell)
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_suffix(".html")
    dst.write_text(out, encoding="utf-8")
    print(f"Wrote {dst} ({len(data['days'])} days, {sum(len(x.get('stops') or []) for x in data['days'])} stops, {len(out.encode('utf-8'))} bytes)")


if __name__ == "__main__":
    main()
