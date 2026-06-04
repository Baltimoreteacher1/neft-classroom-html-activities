#!/usr/bin/env python3
"""
Graphic-Novel build: inline the shared engine (gn-engine.css + gn-engine.js) and
one STORY file into a single offline HTML, plus the unchanged Neft results
tracker tail. Same engine bytes in every file → no drift across 20 novels.

Usage:
  build.py <story.js> <out.html> [--artbase PATH] [--home PATH] [--demo]

--artbase / --home override meta paths (used when the output lives at a
different depth than production unit folders). --demo banner marks preview files.
"""

import sys, re, pathlib, argparse

HERE = pathlib.Path(__file__).resolve().parent

TRACKER = """
  <script src="/teacher-tools/nt-results.js"></script>
  <script>
  /* Graphic-novel completion tracking -> NTResults (Neft Teacher). Unchanged. */
  (function () {
    "use strict";
    var FIRED = false;
    var complete = document.getElementById("scene-complete");
    if (!complete || typeof NTResults === "undefined") return;
    function studentName() {
      try {
        var k = "nt_gn_student";
        var n = localStorage.getItem(k);
        if (n && n.trim()) return n.trim();
        n = window.prompt("Type your name so your teacher can see you finished:", "");
        n = (n || "").trim();
        if (n) { try { localStorage.setItem(k, n); } catch (e) {} }
        return n || "Student";
      } catch (e) { return "Student"; }
    }
    function score() {
      var groups = Array.prototype.slice
        .call(document.querySelectorAll(".choices"))
        .filter(function (g) { return g.id !== "choicesComplete"; });
      function tally(list) {
        var total = list.length;
        var correct = list.filter(function (g) { return g.querySelector(".choice.correct"); }).length;
        return { correct: correct, total: total };
      }
      var reading = groups.filter(function (g) { return g.getAttribute("data-score-group") === "reading"; });
      var math = groups.filter(function (g) { return g.getAttribute("data-score-group") !== "reading"; });
      return { math: tally(math), reading: tally(reading) };
    }
    function savedNote() {
      if (document.getElementById("nt-saved-note")) return;
      var p = document.createElement("p");
      p.id = "nt-saved-note";
      p.setAttribute("role", "status");
      p.style.cssText = "margin-top:14px;font-size:0.9rem;color:#7bdcb5;font-weight:600;";
      p.textContent = "✓ Results saved for your teacher.";
      complete.insertBefore(p, complete.querySelector(".restart") || null);
    }
    function record() {
      if (FIRED) return; FIRED = true;
      var s = score();
      var sections = [{ name: "Math", correct: s.math.correct, total: s.math.total }];
      var readingStd = window.GN_STORY.meta.readingStandard || null;
      if (s.reading.total > 0)
        sections.push({ name: "Reading Comprehension", correct: s.reading.correct, total: s.reading.total, standard: readingStd });
      try {
        NTResults.finish({
          student: studentName(),
          assessment: window.GN_STORY.meta.assessment,
          standard: window.GN_STORY.meta.standard,
          level: String(window.GN_STORY.meta.version),
          sections: sections,
          correct: s.math.correct + s.reading.correct,
          total: s.math.total + s.reading.total,
          download: false,
        });
      } catch (e) {}
      savedNote();
    }
    function visible() {
      return complete.classList.contains("show") || complete.classList.contains("active");
    }
    if (visible()) record();
    var mo = new MutationObserver(function () { if (visible()) record(); });
    mo.observe(complete, { attributes: true, attributeFilter: ["class"] });
  })();
  </script>
  <script src="/assets/nt-page-enhance.js" defer></script>
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("out")
    ap.add_argument("--artbase")
    ap.add_argument("--home")
    ap.add_argument("--demo", action="store_true")
    a = ap.parse_args()

    css = (HERE / "gn-engine.css").read_text(encoding="utf-8")
    js = (HERE / "gn-engine.js").read_text(encoding="utf-8")
    story = pathlib.Path(a.story).read_text(encoding="utf-8")

    if a.artbase:
        story = re.sub(
            r'artBase:\s*"[^"]*"', 'artBase: "%s"' % a.artbase, story, count=1
        )
    if a.home:
        story = re.sub(r'home:\s*"[^"]*"', 'home: "%s"' % a.home, story, count=1)

    import html as _html

    title = (re.search(r'title:\s*"([^"]+)"', story) or [None, "Graphic Novel"])[1]
    title = _html.unescape(re.sub(r"<[^>]+>", "", title))
    ver = (re.search(r"version:\s*(\d+)", story) or [None, "1"])[1]
    banner = ""
    if a.demo:
        banner = (
            '<div style="background:#ffd166;color:#1a1200;text-align:center;'
            'font-weight:800;padding:6px;font-size:0.8rem">PHASE-1 PREVIEW — '
            "engine demo (Unit 1, Act 1)</div>"
        )

    html = f"""<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Graphic Novel #{ver} · {title}</title>
    <style>
{css}
    </style>
  </head>
  <body>
{banner}
    <script>
{story}
    </script>
    <script>
{js}
    </script>
{TRACKER}
  </body>
</html>
"""
    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print("wrote", out, f"({len(html) // 1024}KB)")


if __name__ == "__main__":
    main()
