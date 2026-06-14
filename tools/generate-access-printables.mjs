#!/usr/bin/env node
/**
 * Generate printable ACCESS Practice Lab packets per domain-level, in two real
 * formats teachers can use beyond the interactive site:
 *   - <Domain>-<Level>.docx  (editable Word; also opens directly in Google Docs)
 *   - <Domain>-<Level>.html  (print-optimized; Print → PDF)
 * Each packet lists every activity (directions, prompt, choices/items, key
 * vocabulary) plus a teacher answer key. Content is derived from the live
 * access-data*.js modules, so packets stay in lock-step with the app.
 *
 * Runs at the END of `npm run build`, writing into dist/access-practice-lab/printables/
 * (not committed; regenerated every build so they never drift).
 *
 * Usage: node tools/generate-access-printables.mjs [outDir]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// docx is optional at build time: if it can't load, we still emit the HTML
// packets and the build continues (never let a content generator break deploy).
let Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle;
let docxAvailable = false;
try {
  ({ Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } = await import("docx"));
  docxAvailable = true;
} catch (e) {
  console.warn("generate-access-printables: docx unavailable, skipping .docx packets —", e.message);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const labDir = join(root, "access-practice-lab");
const outDir = process.argv[2] || join(root, "dist", "access-practice-lab", "printables");

// ── load + merge data (mirror app.js) ──
const window = {};
for (const f of ["access-data.js", "access-data-v3.js", "access-data-v4.js",
  "access-data-v5.js", "access-data-v6.js", "access-data-v7.js",
  "access-data-v8.js", "access-data-v9.js"]) {
  // eslint-disable-next-line no-eval
  eval(readFileSync(join(labDir, f), "utf8"));
}
const DATA = window.ACCESS_LAB_DATA;
for (const V of ["ACCESS_LAB_V3", "ACCESS_LAB_V4", "ACCESS_LAB_V5", "ACCESS_LAB_V6", "ACCESS_LAB_V7"]) {
  const v = window[V]; if (!v) continue;
  for (const [dn, lv] of Object.entries(v.appendActivities || {})) {
    const d = DATA.domains[dn]; if (!d) continue;
    for (const [lk, list] of Object.entries(lv)) {
      const L = d.levels[lk]; if (!L) continue;
      const ex = new Set((L.activities || []).map((a) => a.id));
      L.activities = (L.activities || []).concat(list.filter((a) => a && a.id && !ex.has(a.id)));
    }
  }
}
const v8 = window.ACCESS_LAB_V8;
const v9 = window.ACCESS_LAB_V9;
for (const d of Object.values(DATA.domains))
  for (const L of Object.values(d.levels))
    for (const a of L.activities || []) {
      if (v8?.scenes?.[a.id] && !a.scene) a.scene = v8.scenes[a.id];
      if (v9?.patches?.[a.id]) Object.assign(a, v9.patches[a.id]);
    }

// ── answer-key text per activity ──
function answerKey(a) {
  const opt = (id) => (a.options || []).find((o) => o.id === id)?.text || id;
  switch (a.type) {
    case "multipleChoice": return `Answer: ${opt(a.answer)}`;
    case "multiSelect": return `Answers: ${(a.answers || []).map(opt).join("; ")}`;
    case "order": return `Order: ${(a.answer || []).map((id) => (a.items || []).find((i) => i.id === id)?.text || id).join(" → ")}`;
    case "sort": return `Sort: ${(a.items || []).map((i) => `${i.text} → ${i.answer}`).join("; ")}`;
    case "cloze": return `Blanks: ${(a.segments || []).filter((s) => s.blank).map((s) => s.blank.answer).join(", ")}`;
    case "hotText": return `Evidence: ${(a.answers || []).map((id) => (a.sentences || []).find((s) => s.id === id)?.text || id).join(" / ")}`;
    case "constructed": return "Open response — see model in 'correct'/support.";
    case "worksheet": return "Printable worksheet.";
    default: return "";
  }
}
function choicesText(a) {
  if (a.options) return a.options.map((o, i) => `   ${String.fromCharCode(97 + i)}) ${o.text}`);
  if (a.items && a.type === "order") return a.items.map((i) => `   • ${i.text}`);
  if (a.items && a.type === "sort") return [`   Categories: ${(a.categories || []).join(", ")}`, ...a.items.map((i) => `   • ${i.text}`)];
  if (a.segments) return [`   ${a.segments.map((s) => (s.blank ? "_____" : s.text)).join("")}`];
  if (a.sentences) return a.sentences.map((s) => `   • ${s.text}`);
  return [];
}
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ── HTML packet ──
function buildHTML(domain, levelKey, level) {
  const acts = level.activities || [];
  const rows = acts.map((a, n) => `
    <article class="act">
      <h3>${n + 1}. ${esc(a.title)} <span class="type">${esc(a.type)}</span></h3>
      <p class="dir"><strong>Directions:</strong> ${esc(a.directions)}</p>
      ${a.scene ? `<p class="scene">${esc(a.scene)}</p>` : ""}
      ${a.prompt ? `<p class="prompt">${esc(a.prompt)}</p>` : ""}
      ${a.adminScript ? `<p class="script"><strong>Read aloud:</strong> ${esc(a.adminScript)}</p>` : ""}
      ${choicesText(a).map((c) => `<div class="choice">${esc(c.trim())}</div>`).join("")}
      ${(a.vocabulary || []).length ? `<p class="vocab"><strong>Vocabulary:</strong> ${a.vocabulary.map((v) => esc(v[0])).join(", ")}</p>` : ""}
      <p class="key"><strong>Teacher key:</strong> ${esc(answerKey(a))}</p>
    </article>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ACCESS Practice Packet — ${esc(domain)} ${esc(levelKey)}</title>
<style>
  body{font-family:"Atkinson Hyperlegible",Georgia,serif;max-width:8.2in;margin:0 auto;padding:0.6in;color:#14223a;line-height:1.5}
  h1{font-family:"Nunito",sans-serif;color:#15487f;margin:0 0 2px}
  .sub{color:#56627a;margin:0 0 18px}
  .act{border:1px solid #d6e0ec;border-radius:10px;padding:12px 14px;margin:0 0 14px;break-inside:avoid}
  .act h3{font-family:"Nunito",sans-serif;color:#205fa6;margin:0 0 6px;font-size:1.05rem}
  .type{font-size:.7rem;color:#56627a;font-weight:600;text-transform:uppercase}
  .scene{font-size:2rem;text-align:center;margin:6px 0}
  .prompt{font-weight:700}
  .choice{margin:2px 0 2px 8px}
  .key{background:#fff8e7;border-left:4px solid #a96f16;padding:6px 10px;margin-top:8px;font-size:.92rem}
  .script{font-style:italic;color:#334}
  .toolbar{margin:0 0 16px}
  button{font:inherit;padding:8px 16px;border-radius:8px;border:1px solid #205fa6;background:#205fa6;color:#fff;cursor:pointer}
  @media print{.toolbar{display:none}.act{border-color:#bbb}}
</style></head><body>
  <div class="toolbar"><button onclick="window.print()">🖨️ Print / Save as PDF</button></div>
  <h1>ACCESS Practice Packet</h1>
  <p class="sub">${esc(domain)} · ${esc(level.range || levelKey)} · ${acts.length} activities · Grades 6–8 · Teacher copy (with answer key)</p>
  ${rows}
</body></html>`;
}

// ── DOCX packet ──
function buildDocx(domain, levelKey, level) {
  const acts = level.activities || [];
  const NAVY = "15487F", BLUE = "205FA6", GOLD = "A96F16", SLATE = "56627A";
  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: "ACCESS Practice Packet", color: NAVY, bold: true })] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: `${domain} · ${level.range || levelKey} · ${acts.length} activities · Grades 6–8 · Teacher copy (with answer key)`, color: SLATE, italics: true })] }),
  ];
  acts.forEach((a, n) => {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 200 }, children: [new TextRun({ text: `${n + 1}. ${a.title}`, color: BLUE, bold: true }), new TextRun({ text: `   [${a.type}]`, color: SLATE, size: 16 })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Directions: ", bold: true }), new TextRun(a.directions || "")] }));
    if (a.scene) children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: a.scene, size: 40 })] }));
    if (a.prompt) children.push(new Paragraph({ children: [new TextRun({ text: a.prompt, bold: true })] }));
    if (a.adminScript) children.push(new Paragraph({ children: [new TextRun({ text: "Read aloud: ", bold: true }), new TextRun({ text: a.adminScript, italics: true })] }));
    for (const c of choicesText(a)) children.push(new Paragraph({ children: [new TextRun(c.trim())] }));
    if ((a.vocabulary || []).length) children.push(new Paragraph({ children: [new TextRun({ text: "Vocabulary: ", bold: true }), new TextRun(a.vocabulary.map((v) => v[0]).join(", "))] }));
    children.push(new Paragraph({ border: { left: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 8 } }, shading: { fill: "FFF8E7" }, children: [new TextRun({ text: "Teacher key: ", bold: true, color: GOLD }), new TextRun(answerKey(a))] }));
  });
  return new Document({ sections: [{ properties: { page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } }, children }] });
}

// ── generate ──
try {
  mkdirSync(outDir, { recursive: true });
  const manifest = [];
  let html = 0, docx = 0;
  const jobs = [];
  for (const [domain, d] of Object.entries(DATA.domains)) {
    for (const [levelKey, level] of Object.entries(d.levels)) {
      if (!(level.activities || []).length) continue;
      const base = `${domain}-${levelKey}`.replace(/\s+/g, "");
      writeFileSync(join(outDir, `${base}.html`), buildHTML(domain, levelKey, level)); html++;
      if (docxAvailable) {
        jobs.push(
          Packer.toBuffer(buildDocx(domain, levelKey, level)).then((buf) => { writeFileSync(join(outDir, `${base}.docx`), buf); docx++; }),
        );
      }
      manifest.push({ domain, levelKey, base, count: (level.activities || []).length });
    }
  }
  await Promise.all(jobs);
  writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 1));
  console.log(`generate-access-printables: ${html} HTML + ${docx} DOCX packets → ${outDir.replace(root + "/", "")}`);
} catch (e) {
  console.warn("generate-access-printables: non-fatal error, continuing build —", e.message);
  process.exit(0);
}
