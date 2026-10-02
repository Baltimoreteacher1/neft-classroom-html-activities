#!/usr/bin/env node
/**
 * Printable packets for the ACCESS Practice Lab, generated at build time from
 * access-practice-lab/content/ (never committed):
 *
 *   dist/access-practice-lab/printables/<file>.html|.docx  STUDENT packets — no
 *       answer keys, no listening scripts (the teacher reads those aloud).
 *   dist/access-teacher/packets/<file>.html|.docx          TEACHER packets — answer
 *       keys, listening scripts, sample answers. /access-teacher/ is a teacher
 *       surface (password-gated by functions/_middleware.js).
 *
 * <file> is `<Domain>-<Level>` for grades 6–8 (the URLs the old lab linked) and
 * `g3-5-<Domain>-<Level>` for grades 3–5. Before 2026-10 the public packets
 * carried the answer key; they no longer do.
 *
 * Never fails the build: a content generator must not block a deploy.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BANDS, loadBand, orderedActivities, REPO_ROOT } from "./lib/access-lab-content.mjs";

let docx = null;
try {
  docx = await import("docx");
} catch (e) {
  console.warn("generate-access-printables: docx unavailable, skipping .docx packets —", e.message);
}

const studentDir = process.argv[2] || join(REPO_ROOT, "dist", "access-practice-lab", "printables");
const teacherDir = process.argv[3] || join(REPO_ROOT, "dist", "access-teacher", "packets");
const TIER = { A: "Starting", B: "Growing", C: "Expanding" };
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const list = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const fileBase = (band, domain, level) =>
  (band === "6-8" ? `${domain}-${level}` : `g3-5-${domain}-${level}`).replace(/\s+/g, "");

export function answerKey(a) {
  const opt = (id) => (a.options || []).find((o) => o.id === id)?.text || id;
  switch (a.type) {
    case "multipleChoice":
      return `Answer: ${opt(a.answer)}`;
    case "multiSelect":
      return `Answers: ${(a.answers || []).map(opt).join("; ")}`;
    case "order":
      return `Order: ${(a.answer || []).map((id) => (a.items || []).find((i) => i.id === id)?.text || id).join(" → ")}`;
    case "sort":
      return `Sort: ${(a.items || []).map((i) => `${i.text} → ${i.answer}`).join("; ")}`;
    case "cloze":
      return `Blanks: ${(a.segments || [])
        .filter((s) => s.blank)
        .map((s) => s.blank.answer)
        .join(", ")}`;
    case "hotText":
      return `Evidence: ${(a.answers || []).map((id) => (a.sentences || []).find((s) => s.id === id)?.text || id).join(" / ")}`;
    case "constructed":
      return a.models
        ? `Sample answers — Starting: ${a.models.A || "—"} | Growing: ${a.models.B || "—"} | Expanding: ${a.models.C || "—"}`
        : "Open response — teacher scores.";
    default:
      return "";
  }
}

function choiceLines(a) {
  if (a.options) return a.options.map((o, i) => `${String.fromCharCode(97 + i)}) ${o.text}`);
  if (a.type === "order") return (a.items || []).map((i) => `___ ${i.text}`);
  if (a.type === "sort")
    return [
      `Groups: ${(a.categories || []).join(" · ")}`,
      ...(a.items || []).map((i) => `• ${i.text}  → ________`),
    ];
  if (a.segments)
    return [
      a.segments
        .map((s) => (s.blank ? `______ (${(s.blank.options || []).join(" / ")})` : s.text))
        .join(""),
    ];
  if (a.sentences) return a.sentences.map((s) => `◯ ${s.text}`);
  return [];
}

function visualsHTML(a) {
  const pics = list(a.picture).map(
    (p) => `<img class="pic" src="/access-practice-lab/${esc(p.src)}" alt="${esc(p.alt)}">`,
  );
  const charts = list(a.chart).map(
    (c) =>
      `<table class="data"><caption>${esc(c.title || "Chart")}</caption><tr>${c.data.map((d) => `<th>${esc(d.label)}</th>`).join("")}</tr><tr>${c.data.map((d) => `<td>${esc(d.value)}</td>`).join("")}</tr></table>`,
  );
  const table = a.table
    ? `<table class="data"><caption>${esc(a.table.caption || "")}</caption><tr>${a.table.headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr>${a.table.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</table>`
    : "";
  return [...pics, ...charts, table].join("");
}

function itemHTML(a, n, { teacher, listening }) {
  const lines = choiceLines(a);
  const writeLines =
    a.type === "constructed"
      ? `<div class="lines">${"<div></div>".repeat(a.models ? 6 : 4)}</div>`
      : "";
  const sheet = (a.sheet || [])
    .map(
      (s) =>
        `<h4>${esc(s.heading)}</h4><ol>${(s.items || []).map((i) => `<li>${esc(i)}<div class="line"></div></li>`).join("")}</ol>`,
    )
    .join("");
  const script = listening && a.script ? list(a.script).join(" ") : "";
  return `<article class="act">
    <h3>${n}. ${esc(a.title)}</h3>
    <p class="dir">${esc(a.directions)}</p>
    ${visualsHTML(a)}
    ${listening ? (teacher && script ? `<p class="script"><strong>Read aloud:</strong> ${esc(script)}</p>` : `<p class="listen">🎧 Listen to your teacher. Then answer.</p>`) : ""}
    ${
      list(a.passage).length && !listening
        ? `<div class="passage">${a.passageTitle ? `<h4>${esc(a.passageTitle)}</h4>` : ""}${list(
            a.passage,
          )
            .map((p) => `<p>${esc(p)}</p>`)
            .join("")}</div>`
        : ""
    }
    ${a.prompt ? `<p class="prompt">${esc(a.prompt)}</p>` : ""}
    ${lines.map((l) => `<div class="choice">${esc(l)}</div>`).join("")}
    ${sheet}${writeLines}
    ${teacher && answerKey(a) ? `<p class="key"><strong>Key:</strong> ${esc(answerKey(a))}</p>` : ""}
  </article>`;
}

function packetHTML({ band, domain, level, L, teacher }) {
  const acts = orderedActivities(L);
  const listening = domain === "Listening";
  const tier = TIER[level] ? `${TIER[level]} (${L.tier?.range || ""})` : L.displayLabel || level;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ACCESS Practice — ${esc(domain)} · ${esc(tier)} · Grades ${esc(band)}${teacher ? " (teacher)" : ""}</title>
<style>
body{font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;max-width:8in;margin:0 auto;padding:.5in;color:#1d2730}
h1{margin:0;font-size:1.5rem}.sub{color:#4a5864;margin:.2rem 0 1rem}.name{margin:0 0 1rem;font-weight:700}
.act{border:1px solid #cfd6dc;border-radius:10px;padding:.7rem .9rem;margin:0 0 .9rem;break-inside:avoid}
.act h3{margin:0 0 .3rem;font-size:1.05rem}.dir{color:#4a5864;margin:.2rem 0}.prompt{font-weight:700}
.pic{display:block;max-width:4.5in;width:100%;margin:.4rem auto;border:1px solid #ddd;border-radius:8px}
.passage{background:#f4f2ed;border-radius:8px;padding:.4rem .8rem;margin:.4rem 0}.choice{margin:.15rem 0 .15rem .6rem}
.data{border-collapse:collapse;margin:.4rem 0}.data caption{text-align:left;font-weight:700}.data th,.data td{border:1px solid #999;padding:.2rem .6rem}
.lines div,.line{border-bottom:1px solid #888;height:1.7rem}.listen{font-weight:700}.script{background:#eef6f5;padding:.4rem .6rem;border-radius:6px}
.key{background:#fff4dc;border-left:4px solid #a96f16;padding:.35rem .6rem;margin-top:.5rem;font-size:.92rem}
.toolbar{margin:0 0 1rem}button{font:inherit;padding:.5rem 1rem;border-radius:8px;border:0;background:#1f766f;color:#fff;cursor:pointer}
@media print{.toolbar{display:none}}
</style></head><body>
<div class="toolbar"><button onclick="window.print()">🖨️ Print / Save as PDF</button></div>
<h1>ACCESS Practice Packet${teacher ? " — Teacher copy" : ""}</h1>
<p class="sub">${esc(domain)} · ${esc(tier)} · Grades ${esc(band)} · ${acts.length} activities</p>
${teacher ? "" : '<p class="name">Name: ______________________ Date: ____________</p>'}
${acts.map((a, i) => itemHTML(a, i + 1, { teacher, listening: listening || a.listening })).join("")}
<p class="sub">Original classroom practice inspired by WIDA ACCESS — not an official WIDA test.</p>
</body></html>`;
}

function packetDocx({ band, domain, level, L, teacher }) {
  const { Document, Paragraph, TextRun, HeadingLevel, BorderStyle } = docx;
  const acts = orderedActivities(L);
  const listening = domain === "Listening";
  const P = (runs, opts = {}) =>
    new Paragraph({
      ...opts,
      children: runs.map((r) => (typeof r === "string" ? new TextRun(r) : new TextRun(r))),
    });
  const children = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [
        new TextRun({
          text: `ACCESS Practice Packet${teacher ? " — Teacher copy" : ""}`,
          bold: true,
        }),
      ],
    }),
    P(
      [
        {
          text: `${domain} · ${TIER[level] || level} · Grades ${band} · ${acts.length} activities`,
          italics: true,
        },
      ],
      { spacing: { after: 200 } },
    ),
  ];
  if (!teacher) children.push(P(["Name: ______________________   Date: ____________"]));
  acts.forEach((a, i) => {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200 },
        children: [new TextRun({ text: `${i + 1}. ${a.title}`, bold: true })],
      }),
    );
    children.push(P([a.directions || ""]));
    for (const p of list(a.picture))
      children.push(P([{ text: `[Picture: ${p.alt}]`, italics: true }]));
    for (const c of list(a.chart))
      children.push(
        P([
          {
            text: `${c.title || "Chart"}: ${c.data.map((d) => `${d.label} ${d.value}`).join(", ")}`,
            italics: true,
          },
        ]),
      );
    if (a.table)
      children.push(
        P([
          {
            text: `${a.table.caption || "Table"}: ${a.table.rows.map((r) => r.join(" ")).join("; ")}`,
            italics: true,
          },
        ]),
      );
    if ((listening || a.listening) && a.script && teacher)
      children.push(
        P([
          { text: "Read aloud: ", bold: true },
          { text: list(a.script).join(" "), italics: true },
        ]),
      );
    if ((listening || a.listening) && !teacher)
      children.push(P([{ text: "Listen to your teacher. Then answer.", bold: true }]));
    if (list(a.passage).length && !(listening || a.listening))
      for (const para of list(a.passage)) children.push(P([para]));
    if (a.prompt) children.push(P([{ text: a.prompt, bold: true }]));
    for (const l of choiceLines(a)) children.push(P([l]));
    for (const s of a.sheet || []) {
      children.push(P([{ text: s.heading, bold: true }]));
      for (const it of s.items || [])
        children.push(P([it]), P(["______________________________________________"]));
    }
    if (a.type === "constructed")
      for (let k = 0; k < 4; k++)
        children.push(P(["______________________________________________"]));
    if (teacher && answerKey(a))
      children.push(
        new Paragraph({
          border: { left: { style: BorderStyle.SINGLE, size: 18, color: "A96F16", space: 8 } },
          shading: { fill: "FFF4DC" },
          children: [new TextRun({ text: "Key: ", bold: true }), new TextRun(answerKey(a))],
        }),
      );
  });
  return new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
        children,
      },
    ],
  });
}

try {
  mkdirSync(studentDir, { recursive: true });
  mkdirSync(teacherDir, { recursive: true });
  const manifest = [];
  const jobs = [];
  let html = 0;
  for (const band of BANDS)
    for (const { domain, data } of loadBand(band))
      for (const [level, L] of Object.entries(data.levels || {})) {
        if (!(L.activities || []).length) continue;
        const base = fileBase(band, domain, level);
        const job = { band, domain, level, L };
        writeFileSync(join(studentDir, `${base}.html`), packetHTML({ ...job, teacher: false }));
        writeFileSync(join(teacherDir, `${base}.html`), packetHTML({ ...job, teacher: true }));
        html += 2;
        if (docx) {
          for (const [dir, teacher] of [
            [studentDir, false],
            [teacherDir, true],
          ])
            jobs.push(
              docx.Packer.toBuffer(packetDocx({ ...job, teacher })).then((buf) =>
                writeFileSync(join(dir, `${base}.docx`), buf),
              ),
            );
        }
        manifest.push({ band, domain, level, base, count: L.activities.length });
      }
  await Promise.all(jobs);
  writeFileSync(join(studentDir, "manifest.json"), JSON.stringify(manifest, null, 1));
  writeFileSync(join(teacherDir, "manifest.json"), JSON.stringify(manifest, null, 1));
  console.log(
    `generate-access-printables: ${html} HTML + ${jobs.length} DOCX packets (${manifest.length} student + ${manifest.length} teacher)`,
  );
} catch (e) {
  console.warn("generate-access-printables: non-fatal error, continuing build —", e.message);
  process.exit(0);
}
