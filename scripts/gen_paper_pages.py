#!/usr/bin/env python3
"""Generate one page stub per paper in _papers/ from _data/papers.yml.

GitHub Pages does not run custom Jekyll plugins, so each paper page needs a
file on disk. The stub holds only the key, title, and description; the paper
layout reads everything else from _data/papers.yml.

A paper gets a page only if it has a `summary`. Stale stubs are removed.

Run from the repository root after editing _data/papers.yml:
    python3 scripts/gen_paper_pages.py
"""
import json
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "_data" / "papers.yml"
OUT = ROOT / "_papers"


def main() -> None:
    papers = yaml.safe_load(DATA.read_text())
    OUT.mkdir(exist_ok=True)
    wanted = set()
    for p in papers:
        if not p.get("summary"):
            continue
        wanted.add(f"{p['key']}.md")
        # json.dumps gives a double-quoted string that is also valid YAML.
        stub = (
            "---\n"
            f"key: {json.dumps(p['key'])}\n"
            f"title: {json.dumps(p['title'])}\n"
            f"description: {json.dumps(p['summary'])}\n"
            "---\n"
        )
        (OUT / f"{p['key']}.md").write_text(stub)
    for f in OUT.glob("*.md"):
        if f.name not in wanted:
            f.unlink()
    print(f"wrote {len(wanted)} paper pages to {OUT.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
