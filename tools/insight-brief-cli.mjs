#!/usr/bin/env node
/**
 * Insight Brief CLI — generates the same one-click class brief as
 * /teacher-tools/insight-brief/, headlessly, and writes it to an HTML file.
 * Powers the Monday-morning auto-brief launchd job, and works ad-hoc too.
 *
 * Usage:  node tools/insight-brief-cli.mjs [--days N] [--section S] [--open]
 * Key:    env NEFT_TEACHER_KEY, or one line in ~/.config/neft/teacher-key
 *         (chmod 600). With no key the script prints a note and exits 0 so a
 *         scheduled run never fails loudly on a machine without the key.
 * Output: ~/Desktop/Insight-Brief-YYYY-MM-DD.html  (--open opens it)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function argVal(name, dflt) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
}
const days = Number(argVal("--days", "7")) || 7;
const section = argVal("--section", "");
const BASE = process.env.NEFT_BASE || "https://eduwonderlab.com";

function readKey() {
  if (process.env.NEFT_TEACHER_KEY) return process.env.NEFT_TEACHER_KEY.trim();
  try {
    return fs.readFileSync(path.join(os.homedir(), ".config/neft/teacher-key"), "utf8").trim();
  } catch {
    return "";
  }
}
const key = readKey();
if (!key) {
  console.log(
    "insight-brief-cli: no teacher key (set NEFT_TEACHER_KEY or ~/.config/neft/teacher-key) — skipping.",
  );
  process.exit(0);
}

// Engine + lesson registry (browser globals shimmed for node).
await import("../teacher-tools/insight-brief/insight-engine.js");
const engine = globalThis.NTInsightEngine;
const registrySrc = fs.readFileSync(path.join(here, "../assets/reveal-math-data.js"), "utf8");
const w = {};
new Function("window", registrySrc)(w);
const lessons = w.REVEAL_MATH_LESSONS || [];

async function api(p) {
  const r = await fetch(BASE + p, { headers: { "x-teacher-key": key } });
  if (!r.ok) throw new Error(`${p} -> HTTP ${r.status}`);
  return r.json();
}

const since = new Date(Date.now() - days * 86400000).toISOString();
const q = section ? `&section=${encodeURIComponent(section)}` : "";
let digest;
let rollup;
let struggles;
let grades;
try {
  [digest, rollup, struggles, grades] = await Promise.all([
    api(`/api/progress/digest?since=${encodeURIComponent(since)}${q}`),
    api(`/api/progress/mastery-rollup?${q.slice(1)}`),
    api(`/api/progress/struggles?minutes=${Math.min(days * 1440, 1440)}${q}`),
    api("/api/progress/grades"),
  ]);
} catch (err) {
  console.error(
    `insight-brief-cli: could not read the class data (${err.message}). ` +
      "Check the teacher key and network, then re-run.",
  );
  process.exit(1);
}

const brief = engine.buildBrief({
  digest,
  rollup,
  struggles,
  grades,
  lessons,
  windowDays: days,
  section,
  now: new Date().toLocaleString(),
});

function esc(v) {
  return String(v == null ? "" : v).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}
const h = brief.headline;
const rowsHtml = brief.students
  .map(
    (s) =>
      `<tr><td>${esc(s.name)}</td><td>${esc(s.section)}</td><td>${esc(s.tier)}</td><td>${
        s.avgScore == null ? "—" : `${Math.round(s.avgScore)}%`
      }</td><td>${s.struggles}</td><td>${s.misconceptions}</td><td>${esc(
        s.weakStandards[0] || "",
      )}</td></tr>`,
  )
  .join("");
const stdHtml = brief.standards
  .map(
    (s) =>
      `<tr><td>${esc(s.standard)}</td><td>${esc(s.lessonTitle || "—")}</td><td>${esc(
        s.section || "all",
      )}</td><td>${s.correctRate == null ? "—" : `${Math.round(s.correctRate * 100)}%`}</td><td>${
        s.struggles
      }</td><td>${s.misconceptions}</td><td>${esc(s.idea)}</td></tr>`,
  )
  .join("");
const prHtml = brief.priorities
  .map((p) => `<li><b>[${esc(p.kind)}]</b> ${esc(p.title)} — ${esc(p.why)}</li>`)
  .join("");
const grpHtml = brief.groups
  .map(
    (g) =>
      `<li><b>${esc(g.section || "all")} · ${esc(g.standard)}</b>: ${esc(
        g.students.join(", "),
      )} — ${esc(g.move)}</li>`,
  )
  .join("");
const planHtml = brief.planning
  .map((p) => `<li><b>Class ${esc(p.section)}</b><ul>${p.ideas.map((i) => `<li>${esc(i)}</li>`).join("")}</ul></li>`)
  .join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Insight Brief ${esc(
  brief.generatedAt,
)}</title><style>
body{font:15px/1.5 -apple-system,sans-serif;color:#292522;background:#faf7f2;max-width:960px;margin:2rem auto;padding:0 1rem}
h1,h2{font-family:Georgia,serif}table{border-collapse:collapse;width:100%;background:#fff;font-size:.9rem}
th,td{border:1px solid #e6ded2;padding:.4rem .6rem;text-align:left}li{margin-bottom:.4rem}
.meta{color:#6f665e}</style></head><body>
<h1>Insight Brief</h1>
<p class="meta">Generated ${esc(brief.generatedAt)} · window last ${brief.windowDays} day(s)${
  section ? ` · class ${esc(section)}` : " · all classes"
} · <a href="${BASE}/teacher-tools/insight-brief/">open the live tool</a></p>
<p><b>${h.activeStudents}</b> active students · <b>${h.activitiesTouched}</b> activities · avg <b>${
  h.avgScore == null ? "—" : `${h.avgScore}%`
}</b> · <b>${h.masteryEvents}</b> mastery · <b>${h.struggleSignals}</b> struggles · <b>${
  h.misconceptions
}</b> misconceptions</p>
<h2>Priority actions</h2><ol>${prHtml || "<li>None surfaced.</li>"}</ol>
<h2>Small groups</h2><ul>${grpHtml || "<li>None needed.</li>"}</ul>
<h2>Planning ideas</h2><ul>${planHtml}</ul>
<h2>Students</h2><table><tr><th>Student</th><th>Class</th><th>Tier</th><th>Avg</th><th>Struggles</th><th>Misc.</th><th>Focus</th></tr>${rowsHtml}</table>
<h2>Standards</h2><table><tr><th>Standard</th><th>Lesson</th><th>Class</th><th>Correct</th><th>Struggles</th><th>Misc.</th><th>Next move</th></tr>${stdHtml}</table>
</body></html>`;

const stamp = new Date().toISOString().slice(0, 10);
const out = path.join(os.homedir(), "Desktop", `Insight-Brief-${stamp}.html`);
fs.writeFileSync(out, html);
console.log(`insight-brief-cli: wrote ${out} (${brief.students.length} students)`);

if (process.platform === "darwin") {
  try {
    execFileSync("osascript", [
      "-e",
      `display notification "Your Monday class brief is on the Desktop." with title "Insight Brief ready"`,
    ]);
  } catch {
    /* notification is a nicety */
  }
  if (args.includes("--open")) {
    try {
      execFileSync("open", [out]);
    } catch {
      /* headless session */
    }
  }
}
