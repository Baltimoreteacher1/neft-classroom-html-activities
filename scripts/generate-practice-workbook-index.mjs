#!/usr/bin/env node
/** All lesson practice workbooks, including Apply Day and small-group paths. */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  lessonPath,
  listLessonDirs,
  loadLessonConfig,
  REPO_ROOT,
} from "../tools/lib/curriculum-source.mjs";

const root = REPO_ROOT;
const out = join(root, "curriculum", "practice-workbooks", "index.html");
const esc = (x) =>
  String(x ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const files = listLessonDirs().filter((id) => existsSync(lessonPath(id, "worksheet.html")));
const units = new Map();
for (const id of files) {
  const docx = lessonPath(id, "downloads", `${id}-practice-workbook.docx`);
  const pdf = lessonPath(id, "downloads", `${id}-practice-workbook.pdf`);
  if (!existsSync(docx) || !existsSync(pdf)) throw new Error(`Missing practice workbook: ${id}`);
  const cfg = loadLessonConfig(id);
  const unit = Number(id.split("-")[0]);
  if (!units.has(unit)) units.set(unit, []);
  units.get(unit).push({
    id,
    title: cfg.title || id,
    standard: cfg.standard || "",
    objective: cfg.contentObjective || "",
  });
}
const kind = (id) =>
  id.endsWith("-group1")
    ? "Small group · support"
    : id.endsWith("-group2")
      ? "Small group · challenge"
      : id.endsWith("-catchup")
        ? "Catch-up"
        : /-part[23]$/.test(id)
          ? "Apply Day"
          : id.endsWith("-review")
            ? "Review"
            : id.endsWith("-practice")
              ? "Practice"
              : "Core lesson";
const unitNames = {
  1: "Math Is…",
  2: "Statistics",
  3: "Ratios & Rates",
  4: "Percents",
  5: "Area, Surface Area & Volume",
  6: "Expressions",
  7: "Integers & the Coordinate Plane",
  8: "Equations & Inequalities",
  9: "Two-Variable Relationships",
  10: "Math Is…",
};
const cards = [...units]
  .sort((a, b) => a[0] - b[0])
  .map(
    ([unit, entries]) => `
<details class="unit" ${unit === 1 ? "open" : ""}>
  <summary>Unit ${unit} · ${esc(unitNames[unit] || "Mathematics")} <span>${entries.length} sheets</span></summary>
  <div class="unit-body">${entries
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
    .map(
      ({ id, title, standard, objective }) => `
    <article class="sheet" data-search="${esc(`${id} ${title} ${standard} ${objective} ${kind(id)}`.toLowerCase())}">
      <div class="sheet-info"><p class="eyebrow">${esc(kind(id))} · Lesson ${esc(id)}${standard ? ` · ${esc(standard)}` : ""}</p><h3>${esc(title)}</h3>${objective ? `<p>${esc(objective)}</p>` : ""}</div>
      <div class="sheet-actions"><a href="/lessons/${esc(id)}/downloads/${esc(id)}-practice-workbook.docx" download aria-label="Download Lesson ${esc(id)} editable Word practice sheet">Word .docx</a><a href="/lessons/${esc(id)}/downloads/${esc(id)}-practice-workbook.pdf" download aria-label="Download Lesson ${esc(id)} PDF practice sheet">PDF</a><a class="source" href="/lessons/${esc(id)}/worksheet.html">Original worksheet</a></div>
    </article>`,
    )
    .join("")}</div>
</details>`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Practice Workbook Library · EduWonderLab</title><meta name="description" content="Download editable Word and print-ready PDF practice sheets for every Grade 6 math lesson and pathway."><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><style>
:root{color-scheme:light;--ink:#20252a;--navy:#17324d;--line:#cbd1d6;--paper:#fbfaf7}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Arial,Helvetica,sans-serif}a{color:var(--navy)}a:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #176b91;outline-offset:3px}
header{background:#fff;border-bottom:1px solid var(--line)}.wrap{max-width:1120px;margin:auto;padding:24px 20px}nav{display:flex;gap:20px;flex-wrap:wrap;font-size:14px;font-weight:700}h1{font-size:clamp(30px,4vw,46px);line-height:1.15;margin:24px 0 8px;letter-spacing:-.025em}header p{max-width:70ch;margin:0 0 20px;color:#4f5962}.finder{display:block;font-weight:700;margin:0 0 20px}.finder input{display:block;width:100%;max-width:560px;margin:7px 0 0;padding:12px 14px;border:1px solid #8b969f;border-radius:5px;font:inherit;background:#fff;color:var(--ink)}
.unit{background:#fff;border:1px solid var(--line);margin:0 0 14px}.unit[hidden],.sheet[hidden]{display:none}.unit summary{cursor:pointer;padding:16px 18px;color:var(--navy);font-weight:800;font-size:20px;list-style-position:inside}.unit summary span{float:right;font-size:13px;font-weight:600;color:#58636d}.unit-body{border-top:1px solid var(--line)}.sheet{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 20px;border-bottom:1px solid #e2e6e9}.sheet:last-child{border-bottom:0}.sheet-info{min-width:0}.eyebrow{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#51616c;margin:0 0 3px}.sheet h3{font-size:18px;line-height:1.25;margin:0 0 4px}.sheet-info>p:last-child{font-size:14px;margin:0;color:#4b555d;max-width:65ch}.sheet-actions{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0}.sheet-actions a{border:1px solid var(--navy);padding:8px 11px;text-decoration:none;font-weight:700;font-size:13px;white-space:nowrap}.sheet-actions a:hover{background:#eaf1f5}.sheet-actions .source{border-color:var(--line);font-weight:500}
#empty{display:none;padding:18px;background:#fff;border:1px solid var(--line)}footer{padding:30px 20px;color:#56616a;text-align:center;font-size:13px}@media(max-width:700px){.sheet{display:block}.sheet-actions{margin-top:12px}.unit summary span{float:none;display:block}.wrap{padding:18px 14px}}
</style></head><body><header><div class="wrap"><nav aria-label="Breadcrumb"><a href="/curriculum/">Curriculum Hub</a><a href="/curriculum/units/">Units & Lessons</a></nav><h1>Practice Workbook Library</h1><p>Editable Word and print-ready PDF practice sheets for every lesson and pathway. Exercises and available worked models come from each lesson’s authored worksheet.</p><label class="finder" for="search">Find a lesson, topic, or standard<input id="search" type="search" placeholder="Try 3-2, unit rates, or 6.RP" autocomplete="off"></label><p id="count" role="status" aria-live="polite">${files.length} practice sheets</p></div></header><main class="wrap" id="library"><p id="empty">No practice sheets match your search.</p>${cards}</main><footer>EduWonderLab · Grade 6 Mathematics</footer><script>
const search=document.getElementById('search'),count=document.getElementById('count'),empty=document.getElementById('empty');search.addEventListener('input',()=>{const query=search.value.toLowerCase().trim();let visible=0;for(const unit of document.querySelectorAll('.unit')){let unitCount=0;for(const sheet of unit.querySelectorAll('.sheet')){const show=!query||sheet.dataset.search.includes(query);sheet.hidden=!show;if(show){visible++;unitCount++}}unit.hidden=unitCount===0;if(query&&unitCount)unit.open=true}count.textContent=visible+' practice '+(visible===1?'sheet':'sheets');empty.style.display=visible?'none':'block'});
</script></body></html>`;
mkdirSync(join(root, "curriculum", "practice-workbooks"), { recursive: true });
writeFileSync(out, html);
console.log(`Indexed ${files.length} practice workbooks at ${out}`);
