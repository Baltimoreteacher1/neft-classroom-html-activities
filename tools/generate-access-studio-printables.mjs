#!/usr/bin/env node
/**
 * Printable task cards for the Speaking and Writing Studios (no-device option), generated at build time:
 *   dist/access-practice-lab/printables/studio-speaking.html | studio-writing.html   STUDENT cards — task, source,
 *       planner and lined space. No models, no exemplars, no teacher notes.
 *   dist/access-teacher/packets/studio-speaking.html | studio-writing.html           TEACHER cards — add what to
 *       listen/look for, common issues, three practice-anchor exemplars with annotations, and the scoring guide.
 *   dist/access-teacher/packets/station-cards.html   One-page STATION sheets (link, ELD standard, Key Language Use,
 *       look-fors, oral probes, early/building/strong exemplars, teacher notes) — built by the same
 *       stationCard()/stationCardHTML() the Launch Studio print view uses, so the two cannot drift.
 *       Default: every Language World and studio task for grades 6–8. `--only=world:<id>,studio:<id>,activity:<id>`
 *       selects items; `--band=3-5` switches band.
 * Practice materials only: nothing here is an ACCESS score sheet.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CRITERIA, DISCLAIMER, PRACTICE_BANDS } from "../access-practice-lab/src/lang/rubrics.js";
import {
  stationCard,
  stationCardHTML,
  stationOptions,
} from "../access-practice-lab/src/lang/teacher.js";
import { asList, esc } from "../access-practice-lab/src/util.js";
import { CONTENT_DIR, REPO_ROOT } from "./lib/access-lab-content.mjs";

const positional = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flag = (name) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3) || "";
const studentDir = positional[0] || join(REPO_ROOT, "dist", "access-practice-lab", "printables");
const teacherDir = positional[1] || join(REPO_ROOT, "dist", "access-teacher", "packets");
const SITE_ORIGIN = "https://eduwonderlab.com";
const read = (rel) => JSON.parse(readFileSync(join(CONTENT_DIR, rel), "utf8"));
const allSpeaking = read("studio/speaking.json").tasks;
const allWriting = read("studio/writing.json").tasks;
const speaking = allSpeaking.filter((t) => t.band === "6-8");
const writing = allWriting.filter((t) => t.band === "6-8");
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
  "body{font:11.5pt/1.5 Arial,Helvetica,sans-serif;color:#182735;margin:1.2cm;-webkit-print-color-adjust:exact;print-color-adjust:exact}h1{font:700 22pt/1.15 Georgia,serif;margin:0 0 .25em;border-top:8px solid #215f77;padding-top:.4em}h2{font:700 16pt/1.2 Georgia,serif;margin:0;color:#182735}h4{margin:1em 0 .3em;font-size:10pt;text-transform:uppercase;letter-spacing:.06em;color:#215f77}.card{page-break-after:always;padding-bottom:.5cm}.meta,.note,small{color:#465563;font-size:10pt}.meta{margin:.2em 0 .8em;padding-bottom:.5em;border-bottom:2px solid #c1cbd1}.line{border-bottom:1px solid #8fa1ad;height:1.9em}.slot{margin:.3em 0}table{border-collapse:collapse;width:100%;margin:.5em 0;break-inside:avoid}th,td{border:1px solid #9eafb9;padding:.3em .5em;text-align:left;vertical-align:top;font-size:10pt}th{background:#f2f5f6}.teacher{border-left:4px solid #14263d;background:#eef1f6;border-radius:0 6px 6px 0;padding:.4em .7em;margin:.7em 0;break-inside:avoid}.teacher h4{color:#14263d;margin-top:.4em}.resp{background:#f2f5f6;border-radius:5px;padding:.5em;white-space:pre-wrap}";
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
// ── Station cards: same builder and renderer as the Launch Studio print view ──
const stationBand = flag("band") === "3-5" ? "3-5" : "6-8";
const stationData = {
  band: stationBand,
  worlds: read("worlds.json").worlds,
  speaking: allSpeaking,
  writing: allWriting,
  exemplars,
  standards: read("blueprints.json").standards || [],
};
/** Bank activity by id, searched across the band's domain files. */
function findActivity(id) {
  for (const domain of ["Listening", "Reading", "Speaking", "Writing", "Model-Test"]) {
    let data;
    try {
      data = read(`g${stationBand}/${domain}.json`);
    } catch {
      continue;
    }
    for (const [level, L] of Object.entries(data.levels || {})) {
      const activity = asList(L.activities).find((a) => a.id === id);
      if (activity) return { domain, level, activity };
    }
  }
  return null;
}
const only = flag("only")
  .split(",")
  .filter(Boolean)
  .map((x) => ({ kind: x.slice(0, x.indexOf(":")), id: x.slice(x.indexOf(":") + 1) }));
const selections = only.length
  ? only
  : stationOptions(stationData).map(({ kind, id }) => ({ kind, id }));
const stationCards = selections.map((sel) => {
  const card = stationCard(sel, {
    ...stationData,
    activity: sel.kind === "activity" ? findActivity(sel.id) : null,
  });
  if (!card)
    throw new Error(`generate-access-studio-printables: no station item ${sel.kind}:${sel.id}`);
  return stationCardHTML(card, SITE_ORIGIN);
});
const stationCss =
  "body{font:9pt/1.25 Arial,Helvetica,sans-serif;color:#182735;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}@page{size:letter;margin:.45in}.station-card{break-after:page;page-break-after:always;border-top:6px solid #215f77;padding-top:.15in}.station-card h2{font:700 14pt/1.2 Georgia,serif;margin:0}.station-card h3{font-size:10pt;margin:.3em 0 .1em;color:#215f77}.station-card h4{font-size:9.5pt;margin:.2em 0}.station-card ul{margin:.1em 0 .3em;padding-left:1.2em}.station-card p{margin:.15em 0}.station-kicker,.station-sub,.station-fine{font-size:8.5pt;color:#465563}.station-kicker{font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#215f77}.station-url{font:700 11pt/1.3 ui-monospace,Menlo,monospace;word-break:break-all;border:2px solid #14263d;border-radius:6px;background:#eef1f6;padding:.3em .5em;margin:.4em 0 .1em}.station-exemplars{columns:2;column-gap:.25in}.station-exemplars h3{column-span:all}.station-ex h4{break-after:avoid}.station-resp{background:#f2f5f6;border-radius:4px;padding:.25em;font-size:8pt;line-height:1.2;white-space:pre-line}.station-doc-title{font:700 16pt/1.2 Georgia,serif}@media print{.station-doc-title{display:none}}";
writeFileSync(
  join(teacherDir, "station-cards.html"),
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Station cards — teacher copy</title><style>${stationCss}</style></head><body><main><h1 class="station-doc-title">Station cards — teacher copy</h1>${stationCards.join("")}</main></body></html>`,
);
n += 1;

console.log(
  `generate-access-studio-printables: ${n} files (${speaking.length} speaking + ${writing.length} writing cards, student and teacher; ${stationCards.length} station cards)`,
);
