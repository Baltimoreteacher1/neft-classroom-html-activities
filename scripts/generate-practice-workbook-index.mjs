#!/usr/bin/env node
/** All lesson practice workbooks, including Apply Day and small-group paths. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { withCurriculumShell } from "../tools/lib/curriculum-shell.mjs";
import {
  lessonPath,
  listLessonDirs,
  loadCurriculumManifest,
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
/* Unit names come from the authored units page, paired with the manifest's
 * unit order — the same source tools/sync-curriculum-shell.mjs uses for the
 * dashboard's course cards. This used to be a hand-kept table here, and it
 * had drifted: Units 1 and 10 read "Math Is…" on this page while every other
 * surface said "Math Is Discovery" and "Math Is Synthesis". */
const decode = (x) =>
  x
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
const authoredNames = [
  ...readFileSync(join(root, "curriculum", "units", "index.html"), "utf8").matchAll(
    /<span class="unit-name">([^<]+)<\/span>/g,
  ),
].map((match) => decode(match[1].trim()));
const courseUnits = loadCurriculumManifest().units;
if (authoredNames.length !== courseUnits.length)
  throw new Error(
    `units page names ${authoredNames.length} units, manifest has ${courseUnits.length}`,
  );
const unitNames = Object.fromEntries(courseUnits.map((unit, i) => [unit, authoredNames[i]]));
const sheetHtml = ({ id, title, standard, objective }) => `
    <article class="sheet" data-search="${esc(`${id} ${title} ${standard} ${objective} ${kind(id)}`.toLowerCase())}" data-kind="${esc(kind(id).toLowerCase())}">
      <div class="sheet-info"><p class="eyebrow">${esc(kind(id))} · Lesson ${esc(id)}${standard ? ` · ${esc(standard)}` : ""}</p><h3>${esc(title)}</h3>${objective ? `<p>${esc(objective)}</p>` : ""}</div>
      <div class="sheet-actions"><button type="button" class="preview-btn" data-preview-url="/lessons/${esc(id)}/worksheet.html" data-preview-title="${esc(title)} (${esc(id)})">👁️ Preview</button><a href="/lessons/${esc(id)}/downloads/${esc(id)}-practice-workbook.docx" download aria-label="Download Lesson ${esc(id)} editable Word practice sheet">Word .docx</a><a href="/lessons/${esc(id)}/downloads/${esc(id)}-practice-workbook.pdf" download aria-label="Download Lesson ${esc(id)} PDF practice sheet">PDF</a><a class="source" href="/lessons/${esc(id)}/worksheet.html">Original worksheet</a></div>
    </article>`;
/* One row per lesson. Small-group, catch-up and Apply Day sheets for that lesson fold into a
 * "More versions" dropdown under it, so a unit lists its lessons, not every variant. */
const groupKey = (id) => id.replace(/-(group1|group2|catchup|part\d+)$/, "");
const lessonGroups = (entries) => {
  const groups = new Map();
  for (const entry of entries) {
    const key = groupKey(entry.id);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  return [...groups.values()]
    .map((list) => {
      const key = groupKey(list[0].id);
      const main = list.find((x) => x.id === key) || list[0];
      return { main, more: list.filter((x) => x !== main) };
    })
    .sort((a, b) => a.main.id.localeCompare(b.main.id, undefined, { numeric: true }));
};
const groupHtml = ({ main, more }) =>
  `<div class="lesson-group">${sheetHtml(main)}${
    more.length
      ? `<details class="variants"><summary>More versions for this lesson <span>${more.length}</span></summary>${more.map(sheetHtml).join("")}</details>`
      : ""
  }</div>`;
const cards = [...units]
  .sort((a, b) => a[0] - b[0])
  .map(
    ([unit, entries]) => `
<details class="unit" ${unit === 1 ? "open" : ""}>
  <summary>Unit ${unit} · ${esc(unitNames[unit] || "Mathematics")} <span>${entries.length} sheets</span></summary>
  <div class="unit-body">${lessonGroups(entries).map(groupHtml).join("")}</div>
</details>`,
  )
  .join("");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Practice Workbook Library · EduWonderLab</title><meta name="description" content="Download editable Word and print-ready PDF practice sheets for every Grade 6 math lesson and pathway."><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"><style>
:root{color-scheme:light;--ink:#20252a;--navy:#17324d;--line:#cbd1d6;--paper:#fbfaf7}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.5 Arial,Helvetica,sans-serif}a{color:var(--navy)}a:focus-visible,input:focus-visible,summary:focus-visible{outline:3px solid #176b91;outline-offset:3px}
header{background:#fff;border-bottom:1px solid var(--line)}.wrap{max-width:1120px;margin:auto;padding:24px 20px}nav{display:flex;gap:20px;flex-wrap:wrap;font-size:14px;font-weight:700}h1{font-size:clamp(30px,4vw,46px);line-height:1.15;margin:24px 0 8px;letter-spacing:-.025em}header p{max-width:70ch;margin:0 0 20px;color:#4f5962}.finder{display:block;font-weight:700;margin:0 0 12px}.finder input{display:block;width:100%;max-width:560px;margin:7px 0 0;padding:12px 14px;border:1px solid #8b969f;border-radius:6px;font:inherit;background:#fff;color:var(--ink);min-height:44px}
.finder-chips{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 16px}
.chip{min-height:44px;padding:8px 14px;border:1px solid #c4d1db;background:#fff;color:var(--navy);border-radius:22px;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;transition:background .15s,border-color .15s}
.chip:hover,.chip:focus-visible{background:#eaf2fb;border-color:#175da0}
.chip.is-active{background:#17324d;color:#fff;border-color:#17324d}
.library-toolbar{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin:10px 0 16px}
.toggle-units-btn{min-height:44px;padding:8px 14px;background:#fff;border:1px solid var(--navy);color:var(--navy);border-radius:6px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.toggle-units-btn:hover,.toggle-units-btn:focus-visible{background:#eaf1f5}
.unit{background:#fff;border:1px solid var(--line);margin:0 0 14px}.unit[hidden],.sheet[hidden]{display:none}.unit summary{cursor:pointer;padding:16px 18px;color:var(--navy);font-weight:800;font-size:20px;list-style-position:inside}.unit summary span{float:right;font-size:13px;font-weight:600;color:#58636d}.unit-body{border-top:1px solid var(--line)}.sheet{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 20px;border-bottom:1px solid #e2e6e9}.lesson-group{border-bottom:1px solid #e2e6e9}.lesson-group:last-child{border-bottom:0}.lesson-group .sheet{border-bottom:0}.variants{margin:0 20px 14px;border:1px solid var(--line);background:#f6f9fb}.variants summary{cursor:pointer;min-height:44px;padding:10px 14px;font-weight:700;color:var(--navy);list-style-position:inside}.variants summary span{float:right;font-size:13px;font-weight:600;color:#58636d}.variants .sheet{background:#fff;border-top:1px solid #e2e6e9}.lesson-group[hidden]{display:none}.sheet-info{min-width:0}.eyebrow{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#51616c;margin:0 0 3px}.sheet h3{font-size:18px;line-height:1.25;margin:0 0 4px}.sheet-info>p:last-child{font-size:14px;margin:0;color:#4b555d;max-width:65ch}.sheet-actions{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0}
.sheet-actions .preview-btn{border:1px solid var(--navy);background:#fff;color:var(--navy);padding:8px 12px;font:inherit;font-weight:700;font-size:13px;white-space:nowrap;cursor:pointer;border-radius:4px;min-height:44px;display:inline-flex;align-items:center}
.sheet-actions .preview-btn:hover{background:#eaf1f5}
.sheet-actions a{border:1px solid var(--navy);padding:8px 11px;text-decoration:none;font-weight:700;font-size:13px;white-space:nowrap;min-height:44px;display:inline-flex;align-items:center;border-radius:4px}.sheet-actions a:hover{background:#eaf1f5}.sheet-actions .source{border-color:var(--line);font-weight:500}
.preview-dialog{width:92vw;max-width:1100px;height:88vh;padding:0;border:1px solid #17324d;border-radius:12px;box-shadow:0 12px 48px rgba(0,0,0,.28);background:#fff}
.preview-dialog::backdrop{background:rgba(15,25,40,.6);backdrop-filter:blur(2px)}
.preview-header{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:#17324d;color:#fff;border-top-left-radius:10px;border-top-right-radius:10px}
.preview-header h2{font-size:16px;margin:0;font-weight:700;letter-spacing:-.01em}
.preview-header-actions{display:flex;gap:10px;align-items:center}
.preview-action-btn{min-height:36px;padding:6px 14px;background:#fff;color:#17324d;border:0;border-radius:6px;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.preview-close-btn{min-height:36px;min-width:36px;background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:6px;font-size:18px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.preview-close-btn:hover{background:rgba(255,255,255,.3)}
.preview-body{height:calc(88vh - 58px);overflow:hidden}
.preview-frame{width:100%;height:100%;border:0}
#empty{display:none;padding:18px;background:#fff;border:1px solid var(--line)}footer{padding:30px 20px;color:#56616a;text-align:center;font-size:13px}@media(max-width:700px){.sheet{display:block}.sheet-actions{margin-top:12px}.unit summary span{float:none;display:block}.wrap{padding:18px 14px}}
</style><link rel="stylesheet" href="/assets/family-paper.css"></head><body class="fp-surface"><header><div class="wrap"><nav aria-label="Breadcrumb"><a href="/curriculum/">Curriculum Hub</a><a href="/curriculum/units/">Units & Lessons</a></nav><h1>Practice Workbook Library</h1><p>Editable Word and print-ready PDF practice sheets for every lesson and pathway. Exercises and available worked models come from each lesson’s authored worksheet.</p><label class="finder" for="search">Find a lesson, topic, or standard<input id="search" type="search" placeholder="Try 3-2, unit rates, or 6.RP" autocomplete="off"></label><div class="finder-chips" role="group" aria-label="Filter by sheet pathway"><button type="button" class="chip is-active" data-kind="">All sheets (${files.length})</button><button type="button" class="chip" data-kind="core lesson">Core lessons</button><button type="button" class="chip" data-kind="small group · support">Group 1 · Support</button><button type="button" class="chip" data-kind="small group · challenge">Group 2 · Challenge</button><button type="button" class="chip" data-kind="catch-up">Catch-up</button><button type="button" class="chip" data-kind="apply day">Apply Day</button></div><div class="library-toolbar"><p id="count" role="status" aria-live="polite">${files.length} practice sheets</p><button id="toggle-units" type="button" class="toggle-units-btn">Expand all units</button></div></div></header><main class="wrap" id="library"><p id="empty">No practice sheets match your search.</p>${cards}</main><dialog id="preview-dialog" class="preview-dialog" aria-labelledby="preview-title"><div class="preview-header"><h2 id="preview-title">Sheet Preview</h2><div class="preview-header-actions"><button type="button" id="preview-print-btn" class="preview-action-btn">🖨️ Print Sheet</button><button type="button" id="preview-close-btn" class="preview-close-btn" aria-label="Close preview">✕</button></div></div><div class="preview-body"><iframe id="preview-frame" class="preview-frame" title="Worksheet preview" loading="lazy"></iframe></div></dialog><footer>EduWonderLab · Grade 6 Mathematics</footer><script>
const search=document.getElementById('search'),count=document.getElementById('count'),empty=document.getElementById('empty');
const chips=document.querySelectorAll('.chip');
const toggleBtn=document.getElementById('toggle-units');
const dialog=document.getElementById('preview-dialog');
const frame=document.getElementById('preview-frame');
const previewTitle=document.getElementById('preview-title');
const printBtn=document.getElementById('preview-print-btn');
const closeBtn=document.getElementById('preview-close-btn');
let activeKind='';
function filterSheets(){
  const query=search.value.toLowerCase().trim();
  let visible=0;
  for(const unit of document.querySelectorAll('.unit')){
    let unitCount=0;
    for(const sheet of unit.querySelectorAll('.sheet')){
      const matchQuery=!query||sheet.dataset.search.includes(query);
      const matchKind=!activeKind||sheet.dataset.kind.includes(activeKind);
      const show=matchQuery&&matchKind;
      sheet.hidden=!show;
      if(show){visible++;unitCount++}
    }
    for(const group of unit.querySelectorAll('.lesson-group')){
      const any=[...group.querySelectorAll('.sheet')].some(x=>!x.hidden);
      group.hidden=!any;
      const more=group.querySelector('.variants');
      if(more)more.open=!!(query||activeKind)&&[...more.querySelectorAll('.sheet')].some(x=>!x.hidden);
    }
    unit.hidden=unitCount===0;
    if((query||activeKind)&&unitCount)unit.open=true;
  }
  count.textContent=visible+' practice '+(visible===1?'sheet':'sheets');
  empty.style.display=visible?'none':'block';
}
search.addEventListener('input',filterSheets);
for(const chip of chips){
  chip.addEventListener('click',()=>{
    chips.forEach(c=>c.classList.remove('is-active'));
    chip.classList.add('is-active');
    activeKind=chip.dataset.kind||'';
    filterSheets();
  });
}
if(toggleBtn){
  toggleBtn.addEventListener('click',()=>{
    const units=[...document.querySelectorAll('.unit:not([hidden])')];
    const anyClosed=units.some(u=>!u.open);
    units.forEach(u=>u.open=anyClosed);
    toggleBtn.textContent=anyClosed?'Collapse all units':'Expand all units';
  });
}
document.addEventListener('click',(e)=>{
  const btn=e.target.closest('.preview-btn');
  if(btn){
    const url=btn.dataset.previewUrl;
    const title=btn.dataset.previewTitle;
    if(url&&dialog&&frame){
      previewTitle.textContent=title||'Worksheet Preview';
      frame.src=url;
      if(typeof dialog.showModal==='function')dialog.showModal();
      else dialog.setAttribute('open','');
    }
  }
});
if(closeBtn&&dialog){
  closeBtn.addEventListener('click',()=>{
    if(typeof dialog.close==='function')dialog.close();
    else dialog.removeAttribute('open');
    if(frame)frame.removeAttribute('src');
  });
  dialog.addEventListener('click',(e)=>{
    if(e.target===dialog){
      if(typeof dialog.close==='function')dialog.close();
      else dialog.removeAttribute('open');
      if(frame)frame.removeAttribute('src');
    }
  });
}
if(printBtn&&frame){
  printBtn.addEventListener('click',()=>{
    try{frame.contentWindow.print()}catch(_){window.open(frame.src,'_blank')?.print()}
  });
}
</script></body></html>`;
mkdirSync(join(root, "curriculum", "practice-workbooks"), { recursive: true });
writeFileSync(out, withCurriculumShell(html, "practice"));
console.log(`Indexed ${files.length} practice workbooks at ${out}`);
