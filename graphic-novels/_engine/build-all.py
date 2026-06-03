#!/usr/bin/env python3
"""
Rebuild every graphic novel from the shared engine + its STORY source.

Each story already carries the correct meta.artBase / meta.home, so no path
overrides are needed. Mapping is derived from the story filename:

  u<N>-<V>.story.js   -> ../unit<N>/graphic-novel-<V>.html
  l5l6-<V>.story.js   -> ../lessons/u1-l5l6/graphic-novel-<V>.html
  l7-<V>.story.js     -> ../lessons/u1-l7/graphic-novel-<V>.html

Run from anywhere:  python3 graphic-novels/_engine/build-all.py
"""

import re
import pathlib
import subprocess
import sys

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent  # graphic-novels/
STORIES = HERE / "stories"
BUILD = HERE / "build.py"


def out_for(name: str) -> pathlib.Path:
    """Map a story filename stem to its deployed HTML path."""
    m = re.match(r"u(\d+)-(\d+)$", name)
    if m:
        unit, ver = m.group(1), m.group(2)
        return ROOT / f"unit{unit}" / f"graphic-novel-{ver}.html"
    m = re.match(r"l5l6-(\d+)$", name)
    if m:
        return ROOT / "lessons" / "u1-l5l6" / f"graphic-novel-{m.group(1)}.html"
    m = re.match(r"l7-(\d+)$", name)
    if m:
        return ROOT / "lessons" / "u1-l7" / f"graphic-novel-{m.group(1)}.html"
    return None


def main():
    stories = sorted(STORIES.glob("*.story.js"))
    if not stories:
        print("No stories found in", STORIES)
        sys.exit(1)
    built, skipped = 0, []
    for story in stories:
        stem = story.name.replace(".story.js", "")
        out = out_for(stem)
        if out is None:
            skipped.append(story.name)
            continue
        subprocess.run(
            [sys.executable, str(BUILD), str(story), str(out)],
            check=True,
        )
        built += 1
    print(f"\nBuilt {built} novels.")
    if skipped:
        print("Skipped (no mapping):", ", ".join(skipped))


if __name__ == "__main__":
    main()
