#!/usr/bin/env node
/**
 * Printable task cards for the Speaking and Writing Studios (no-device option), generated at build time:
 *   dist/access-practice-lab/printables/studio-speaking.html | studio-writing.html   STUDENT cards — task, source,
 *       planner and lined space. No models, no exemplars, no teacher notes.
 *   dist/access-teacher/packets/studio-speaking.html | studio-writing.html           TEACHER cards — add what to
 *       listen/look for, common issues, three practice-anchor exemplars with annotations, and the scoring guide.
 * Practice materials only: nothing here is an ACCESS score sheet.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "../access-practice-lab/src/lang/rubrics.js";
import { asList, esc } from "../access-practice-lab/src/util.js";
import { CONTENT_DIR, REPO_ROOT } from "./lib/access-lab-content.mjs";

const studentDir = process.argv[2] || join(REPO_ROOT, "dist", "access-practice-lab", "printables");
const teacherDir = process.argv[3] || join(REPO_ROOT, "dist", "access-teacher", "packets");
const read = (rel) => JSON.parse(readFileSync(join(CONTENT_DIR, rel), "utf8"));
const speaking = read("studio/speaking.json").tasks.filter((t) => t.band === "6-8");
const writing = read("studio/writing.json").tasks.filter((t) => t.band === "6-8");
const exemplars = [
  ...read("studio/exemplars-speaking.json").exemplars,
  ...read("studio/exemplars-writing.json").exemplars,
];

const li = (items) =>
  `<ul>${asList(items)
    .map((x) => `<li>${esc(x)}</li>`)
    .join("")}</ul>`;
const lines = (n) => Array.from({ length: n }, () => '<div class="line"></div>').join("");
const table = (t) =>
  `<table><caption>${esc(t.caption)}</caption><thead><tr>${t.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
const chart = (c) =>
  `<table><caption>${esc(c.title)}</caption><thead><tr><th>Item</th><th>${esc(c.unit || "Value")}</th></tr></thead><tbody>${c.data.map((d) => `<tr><td>${esc(d.label)}</td><td>${esc(d.value)}</td></tr>`).join("")}</tbody></table>`;

function source(s) {
  if (!s) return "";
  if (s.kind === "chart" || s.chart) return chart(s.chart);
  if (s.kind === "table" || s.table) return table(s.table);
  if (s.text)
    return `<h4>${esc(s.title || "")}</h4>${asList(s.text)
      .map((p) => `<p>${esc(p)}</p>`)
      .join("")}`;
  return "";
}
const stimulus = (t) => {
  const st = t.stimulus;
  if (!st || st.kind === "none") return "";
  if (st.kind === "audio")
    return `<p class="note">Your teacher will read this aloud (or play it). Listen, then plan.</p>`;
  return source(st);
};
const rubric = (teacher) =>
  `<section class="rubric"><h4>${teacher ? "Scoring guide (practice bands)" : "Review my work"}</h4><p class="note">${esc(DISCLAIMER)}</p><table><thead><tr><th>Criterion</th>${PRACTICE_BANDS.map((b) => `<th>${b.label}</th>`).join("")}</tr></thead><tbody>${CRITERIA.map((c) => `<tr><th>${esc(c.name)}<br><small>${esc(c.dimension)}</small></th>${PRACTICE_BANDS.map((b) => `<td>${esc(c.student[b.id])}</td>`).join("")}</tr>`).join("")}</tbody></table>${teacher ? `<h5>Look for</h5>${CRITERIA.map((c) => `<p><strong>${esc(c.name)}:</strong> ${esc(c.teacher.lookFor.join("; "))}</p>`).join("")}` : ""}</section>`;

function exemplarBlock(t) {
  const ex = PRACTICE_BANDS.map((b) =>
    exemplars.find((x) => x.taskId === t.id && x.practiceBand === b.id),
  ).filter(Boolean);
  if (!ex.length) return "";
  return `<section class="teacher"><h4>Practice anchors</h4>${ex.map((x) => `<article><h5>${esc(x.practiceBand)}</h5><p class="resp">${esc(x.response)}</p><ul>${x.annotations.map((a) => `<li>“${esc(a.quote)}” — ${esc(a.dimension)}: ${esc(a.note)}</li>`).join("")}</ul><p>${esc(x.whyThisBand)} <strong>Next:</strong> ${esc(x.nextStep)}</p></article>`).join("")}</section>`;
}

function card(t, kind, teacher) {
  const plan = (kind === "speak" ? t.planner : t.organizer)
    .map((s) => `<div class="slot"><strong>${esc(s.label)}</strong><div class="line"></div></div>`)
    .join("");
  const body =
    kind === "speak"
      ? `${stimulus(t)}<h4>Plan</h4>${plan}<p class="note">Say it aloud to a partner or record it. Aim for ${t.targetSeconds[0]}–${t.targetSeconds[1]} seconds.</p><h4>What I said (notes or transcript)</h4>${lines(6)}`
      : `${asList(t.sources).map(source).join("")}<h4>Plan</h4>${plan}<h4>My writing</h4>${lines(t.expected.paragraphs > 1 ? 16 : 10)}<p class="note">About ${t.expected.minWords}–${t.expected.maxWords} words.</p>`;
  const tchr = teacher
    ? `<section class="teacher"><h4>${kind === "speak" ? "Listen for" : "Look for"}</h4>${li(kind === "speak" ? t.teacher.listenFor : t.teacher.lookFor)}${t.teacher.commonIssues ? `<h4>Common issues</h4>${li(t.teacher.commonIssues)}` : ""}${t.teacher.followUp ? `<p><strong>Follow-up:</strong> ${esc(t.teacher.followUp)}</p>` : ""}</section>${exemplarBlock(t)}${kind === "speak" && t.stimulus?.kind === "audio" ? `<section class="teacher"><h4>Read-aloud script</h4>${t.stimulus.turns.map((u) => `<p><strong>${esc(u.speaker)}:</strong> ${esc(u.text)}</p>`).join("")}</section>` : ""}`
    : "";
  return `<article class="card"><h2>${esc(t.title)}</h2><p class="meta">${esc(t.keyUse)} · ${esc(t.contentArea)} · ${esc(t.time)}</p><p><strong>Situation:</strong> ${esc(t.scenario)}</p><p><strong>Your task:</strong> ${esc(t.prompt)}</p>${body}${teacher ? tchr : ""}${rubric(teacher)}</article>`;
}

const css =
  "body{font:12pt/1.45 system-ui,Arial,sans-serif;color:#111;margin:1.2cm}h1{font-size:20pt}h2{font-size:15pt;margin:0}h4{margin:.8em 0 .3em}.card{page-break-after:always;padding-bottom:.5cm}.meta,.note,small{color:#444;font-size:10pt}.line{border-bottom:1px solid #777;height:1.6em}.slot{margin:.3em 0}table{border-collapse:collapse;width:100%;margin:.4em 0}th,td{border:1px solid #999;padding:.25em .4em;text-align:left;vertical-align:top;font-size:10pt}.teacher{border-left:4px solid #6a4c93;padding-left:.6em;margin:.6em 0}.resp{background:#f2f2f2;padding:.4em;white-space:pre-wrap}";
const page = (title, cards, teacher) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>${teacher ? '<meta name="robots" content="noindex">' : ""}<style>${css}</style></head><body><h1>${esc(title)}</h1><p class="note">ACCESS Practice Lab · classroom practice, not an official WIDA test or score. Name: ______________ Date: ________</p>${cards}</body></html>`;

mkdirSync(studentDir, { recursive: true });
mkdirSync(teacherDir, { recursive: true });
let n = 0;
for (const [dir, teacher] of [
  [studentDir, false],
  [teacherDir, true],
]) {
  writeFileSync(
    join(dir, "studio-speaking.html"),
    page(
      `Speaking Studio task cards${teacher ? " — teacher copy" : ""}`,
      speaking.map((t) => card(t, "speak", teacher)).join(""),
      teacher,
    ),
  );
  writeFileSync(
    join(dir, "studio-writing.html"),
    page(
      `Writing Studio task cards${teacher ? " — teacher copy" : ""}`,
      writing.map((t) => card(t, "write", teacher)).join(""),
      teacher,
    ),
  );
  n += 2;
}
console.log(
  `generate-access-studio-printables: ${n} files (${speaking.length} speaking + ${writing.length} writing cards, student and teacher)`,
);
