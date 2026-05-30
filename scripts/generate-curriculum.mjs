import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");
const outDir = join(root, "curriculum");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Matches core lessons ("3-2") and flagship lessons ("3-2-flagship").
const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

// Friendly unit themes / titles. Pulled from each unit's lesson config "theme"
// plus the standard cluster the lessons share.
const UNIT_THEMES = {
  1: { name: "Number System Launch", blurb: "Factors, multiples & decimal operations" },
  2: { name: "Fraction Detective Agency", blurb: "Dividing fractions & mixed numbers" },
  3: { name: "Culinary Academy", blurb: "Ratios & ratio reasoning" },
  4: { name: "Arcade Builder", blurb: "Rates, unit rates & percents" },
  5: { name: "Architecture Firm", blurb: "Area of polygons & composite figures" },
  6: { name: "Music Studio", blurb: "Expressions, exponents & properties" },
  7: { name: "Equation Detective Agency", blurb: "Equations & inequalities" },
  8: { name: "Sports Analytics Lab", blurb: "Statistics & data displays" },
  9: { name: "Treasure Map Navigator", blurb: "Integers & the coordinate plane" },
  10: { name: "Time Capsule Engineers", blurb: "Volume & surface area" },
};

function lessonConfigs() {
  return readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "config.json")))
    .map((id) => {
      const cfg = JSON.parse(
        readFileSync(join(lessonsDir, id, "config.json"), "utf8")
      );
      const isFlagship = id.endsWith("-flagship") || cfg.flagship != null;
      return { id, cfg, isFlagship };
    })
    .sort((a, b) => {
      const ma = a.id.match(LESSON_DIR_RE);
      const mb = b.id.match(LESSON_DIR_RE);
      return (
        Number(ma[1]) - Number(mb[1]) ||
        Number(ma[2]) - Number(mb[2]) ||
        (a.id.endsWith("-flagship") ? 1 : 0) - (b.id.endsWith("-flagship") ? 1 : 0)
      );
    });
}

// True if a path exists relative to repo root.
const has = (...parts) => existsSync(join(root, ...parts));

// Find the post-test "base" file for a unit (e.g. unit1-space-mission-control.html),
// skipping the -level-0/-1/-2 variants. Returns the filename or null.
function findPostTestBase(unit) {
  const dir = join(root, "post-test");
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(
    (f) =>
      f.startsWith(`unit${unit}-`) &&
      f.endsWith(".html") &&
      !/-level-\d+\.html$/.test(f)
  );
  return files[0] || null;
}

/* ---------- resource link builders ---------- */

// One resource pill: an <a> when the file exists, otherwise a greyed em-dash chip.
function resLink(label, href, exists, sub = "") {
  if (!exists) {
    return `<span class="res res-missing" title="Not available yet">${esc(label)} <span class="res-dash">—</span></span>`;
  }
  return `<a class="res" href="${esc(href)}">${esc(label)}${
    sub ? ` <span class="res-sub">${esc(sub)}</span>` : ""
  }</a>`;
}

// Build the "Unit resources" row (graphic novels, game, tests, study guide).
function unitResources(unit) {
  const pills = [];

  // Graphic novels (Level 1 support + Level 2 enrichment)
  if (has("graphic-novels", `unit${unit}`, "graphic-novel-1.html")) {
    pills.push(
      resLink(
        "Graphic Novel 1",
        `/graphic-novels/unit${unit}/graphic-novel-1.html`,
        true,
        "Level 1"
      )
    );
  }
  if (has("graphic-novels", `unit${unit}`, "graphic-novel-2.html")) {
    pills.push(
      resLink(
        "Graphic Novel 2",
        `/graphic-novels/unit${unit}/graphic-novel-2.html`,
        true,
        "Level 2"
      )
    );
  }

  // 3D game
  if (has("games", "3d", `unit-${unit}`, "index.html")) {
    pills.push(resLink("3D Game", `/games/3d/unit-${unit}/`, true));
  }

  // Pre-test (base + note Level 1 / Level 2 variants)
  if (has("pre-test", `unit${unit}-review.html`)) {
    const l1 = has("pre-test", `unit${unit}-review-level-1.html`);
    const l2 = has("pre-test", `unit${unit}-review-level-2.html`);
    const variants = [l1 ? "L1" : "", l2 ? "L2" : ""].filter(Boolean).join("/");
    pills.push(
      resLink(
        "Pre-Test",
        `/pre-test/unit${unit}-review.html`,
        true,
        variants ? `+ ${variants}` : ""
      )
    );
  }

  // Post-test (base, non-level file)
  const postBase = findPostTestBase(unit);
  if (postBase) {
    pills.push(resLink("Post-Test", `/post-test/${postBase}`, true));
  }

  // Study guide
  if (has("math", `unit-${unit}`, "study-guide", "index.html")) {
    pills.push(resLink("Study Guide", `/math/unit-${unit}/study-guide/`, true));
  }

  if (!pills.length) return "";
  return `<div class="unit-res">
        <span class="unit-res-label">Unit resources</span>
        <div class="res-row">${pills.join("")}</div>
      </div>`;
}

// Build the resource pills for a single lesson, stat-checking each file.
function lessonResources(id) {
  const pills = [];

  if (has("lessons", id, "index.html")) {
    pills.push(resLink("Interactive Lesson", `/lessons/${id}/`, true));
  }
  if (has("lessons", id, "notes.html")) {
    pills.push(resLink("Guided Notes", `/lessons/${id}/notes.html`, true));
  }
  if (has("lessons", id, "downloads", `${id}-notes.pdf`)) {
    pills.push(
      resLink("Notes PDF", `/lessons/${id}/downloads/${id}-notes.pdf`, true)
    );
  }
  if (has("lessons", id, "downloads", `${id}-notes.docx`)) {
    pills.push(
      resLink("Notes DOCX", `/lessons/${id}/downloads/${id}-notes.docx`, true)
    );
  }
  if (has("lessons", id, "homework.docx")) {
    pills.push(resLink("Homework", `/lessons/${id}/homework.docx`, true));
  }

  return pills;
}

/* ---------- page assembly ---------- */

function lessonNode(item) {
  const { id, cfg, isFlagship } = item;
  const pills = lessonResources(id);
  const title = cfg.title || id;
  const flag = isFlagship
    ? ` <span class="badge badge-flagship">Flagship</span>`
    : "";
  const std = cfg.standard
    ? ` <span class="badge badge-std">${esc(cfg.standard)}</span>`
    : "";
  const obj = cfg.contentObjective
    ? `<p class="lesson-obj">${esc(cfg.contentObjective)}</p>`
    : "";
  const resHtml = pills.length
    ? `<div class="res-row">${pills.join("")}</div>`
    : `<p class="res-none">No resources published yet.</p>`;
  // data-search holds the searchable haystack (title + standard + id + objective).
  const haystack = `${id} ${title} ${cfg.standard || ""} ${cfg.contentObjective || ""}`.toLowerCase();
  return `<details class="lesson" data-search="${esc(haystack)}">
          <summary class="lesson-sum">
            <span class="lesson-head">Lesson ${esc(id)} · ${esc(title)}${flag}${std}</span>
          </summary>
          <div class="lesson-body">
            ${obj}
            ${resHtml}
          </div>
        </details>`;
}

function unitNode(unit, items) {
  const theme = UNIT_THEMES[unit] || { name: "", blurb: "" };
  const std = items.find((i) => i.cfg.standard)?.cfg.standard || "";
  const cluster = std ? std.split(".").slice(0, 2).join(".") : "";
  const lessonCount = items.length;
  const lessonsHtml = items.map(lessonNode).join("\n");
  return `<details class="unit" open>
      <summary class="unit-sum">
        <span class="unit-title">
          <span class="unit-num">Unit ${esc(unit)}</span>
          <span class="unit-name">${esc(theme.name)}</span>
        </span>
        <span class="unit-meta">
          ${theme.blurb ? `<span class="unit-blurb">${esc(theme.blurb)}</span>` : ""}
          ${cluster ? `<span class="badge badge-cluster">${esc(cluster)}</span>` : ""}
          <span class="unit-count">${lessonCount} lesson${lessonCount === 1 ? "" : "s"}</span>
        </span>
      </summary>
      <div class="unit-body">
        ${unitResources(unit)}
        ${lessonsHtml}
      </div>
    </details>`;
}

function styles() {
  return `<style>
:root{
  --navy:#12355b;--teal:#1fa6a2;--teal-light:#dff2ee;--amber:#f2c15b;
  --amber-light:#fef0d8;--cream:#f7f4ec;--ink:#21313f;--muted:#5f6f80;
  --line:#d7e2ed;--card:#fff;
}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.5;}
a{color:var(--navy);}
.wrap{max-width:960px;margin:0 auto;padding:24px 16px 64px;}
header.hub{margin:0 0 20px;}
header.hub .eyebrow{color:var(--teal);font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;font-size:13px;margin:0;}
header.hub h1{font-family:Outfit,system-ui,sans-serif;color:var(--navy);
  margin:6px 0 6px;font-size:30px;}
header.hub p.lede{color:var(--muted);margin:0;font-size:15px;max-width:62ch;}
.controls{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:18px 0 8px;}
.search{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;
  background:#fff;border:1px solid var(--line);border-radius:10px;padding:0 12px;min-height:44px;}
.search input{border:0;outline:0;flex:1;font-size:15px;background:transparent;color:var(--ink);
  min-height:44px;}
.search label{color:var(--muted);font-size:14px;}
.btn{min-height:44px;padding:0 16px;border:1px solid var(--line);background:#fff;color:var(--navy);
  border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;}
.btn:hover,.btn:focus-visible{background:var(--teal-light);border-color:var(--teal);}
.no-results{display:none;color:var(--muted);font-size:15px;padding:18px;text-align:center;
  background:#fff;border:1px dashed var(--line);border-radius:12px;}
.no-results.show{display:block;}
/* Units */
details.unit{background:#fff;border:1px solid var(--line);border-radius:14px;margin:0 0 16px;
  overflow:hidden;}
details.unit>summary.unit-sum{list-style:none;cursor:pointer;display:flex;justify-content:space-between;
  align-items:center;gap:12px;flex-wrap:wrap;padding:16px 18px;background:var(--navy);color:#fff;
  min-height:44px;}
details.unit>summary::-webkit-details-marker{display:none;}
.unit-title{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}
.unit-num{font-family:Outfit,system-ui,sans-serif;font-weight:700;font-size:20px;}
.unit-name{font-size:15px;color:var(--amber);font-weight:600;}
.unit-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.unit-blurb{font-size:13px;color:#cfe0ee;}
.unit-count{font-size:12.5px;color:#cfe0ee;}
.unit-sum::after{content:"▸";margin-left:6px;color:var(--amber);font-size:14px;transition:transform .15s;}
details.unit[open]>summary.unit-sum::after{transform:rotate(90deg);}
.unit-body{padding:14px 16px 18px;}
/* Unit resources strip */
.unit-res{background:var(--teal-light);border:1px solid var(--teal);border-radius:10px;
  padding:10px 12px;margin:0 0 14px;}
.unit-res-label{display:block;font-weight:700;color:var(--teal);font-size:12.5px;
  text-transform:uppercase;letter-spacing:.03em;margin:0 0 8px;}
/* Lessons */
details.lesson{border:1px solid var(--line);border-radius:10px;margin:0 0 10px;background:#fff;}
details.lesson>summary.lesson-sum{list-style:none;cursor:pointer;padding:11px 14px;min-height:44px;
  display:flex;align-items:center;}
details.lesson>summary::-webkit-details-marker{display:none;}
.lesson-sum::before{content:"▸";color:var(--teal);margin-right:8px;font-size:13px;transition:transform .15s;}
details.lesson[open]>summary.lesson-sum::before{transform:rotate(90deg);}
.lesson-head{font-weight:600;color:var(--navy);font-size:15px;}
.lesson-body{padding:0 14px 14px 30px;}
.lesson-obj{margin:0 0 10px;color:var(--muted);font-size:13.5px;font-style:italic;}
.res-none{margin:0;color:var(--muted);font-size:13px;}
/* Resource pills */
.res-row{display:flex;flex-wrap:wrap;gap:8px;}
.res{display:inline-flex;align-items:center;gap:6px;text-decoration:none;font-size:13.5px;font-weight:600;
  color:var(--navy);background:#fff;border:1px solid var(--line);border-radius:999px;
  padding:8px 14px;min-height:36px;line-height:1.2;}
.res:hover,.res:focus-visible{background:var(--teal-light);border-color:var(--teal);outline:none;}
.res-sub{font-weight:400;color:var(--muted);font-size:12px;}
.res-missing{color:var(--muted);background:#f3f6f9;border-style:dashed;cursor:default;}
.res-dash{color:#b6c3d0;}
/* Badges */
.badge{display:inline-block;font-size:11px;font-weight:700;border-radius:999px;padding:2px 9px;
  vertical-align:middle;margin-left:6px;}
.badge-flagship{background:var(--amber-light);color:#9a6b12;border:1px solid var(--amber);}
.badge-std{background:var(--teal-light);color:var(--teal);border:1px solid var(--teal);font-weight:600;}
.badge-cluster{background:var(--amber);color:var(--navy);}
footer.hub{margin-top:28px;color:var(--muted);font-size:13px;text-align:center;}
@media (max-width:480px){
  .wrap{padding:18px 12px 48px;}
  header.hub h1{font-size:24px;}
  .unit-meta{width:100%;}
}
@media (prefers-reduced-motion:reduce){
  .unit-sum::after,.lesson-sum::before{transition:none;}
}
</style>`;
}

function searchScript() {
  return `<script>
(function(){
  var box=document.getElementById('curr-search');
  var expandBtn=document.getElementById('expand-all');
  var collapseBtn=document.getElementById('collapse-all');
  var noResults=document.getElementById('no-results');
  var units=Array.prototype.slice.call(document.querySelectorAll('details.unit'));
  var lessons=Array.prototype.slice.call(document.querySelectorAll('details.lesson'));
  function filter(){
    var q=(box.value||'').trim().toLowerCase();
    var anyVisible=false;
    units.forEach(function(u){
      var unitLessons=Array.prototype.slice.call(u.querySelectorAll('details.lesson'));
      var unitHasMatch=false;
      unitLessons.forEach(function(l){
        var match=!q||(l.getAttribute('data-search')||'').indexOf(q)>-1;
        l.style.display=match?'':'none';
        if(match){unitHasMatch=true;anyVisible=true;}
        if(q&&match){l.open=true;}
      });
      u.style.display=unitHasMatch||!q?'':'none';
      if(q&&unitHasMatch){u.open=true;}
    });
    noResults.classList.toggle('show',q&&!anyVisible);
  }
  if(box)box.addEventListener('input',filter);
  if(expandBtn)expandBtn.addEventListener('click',function(){units.forEach(function(u){u.open=true;});lessons.forEach(function(l){l.open=true;});});
  if(collapseBtn)collapseBtn.addEventListener('click',function(){units.forEach(function(u){u.open=false;});lessons.forEach(function(l){l.open=false;});});
})();
</script>`;
}

function buildHub(lessons) {
  const byUnit = new Map();
  for (const item of lessons) {
    const u = item.cfg.unit ?? Number(item.id.split("-")[0]);
    if (!byUnit.has(u)) byUnit.set(u, []);
    byUnit.get(u).push(item);
  }
  const units = [...byUnit.keys()].sort((a, b) => Number(a) - Number(b));
  const unitsHtml = units.map((u) => unitNode(u, byUnit.get(u))).join("\n");

  const flagshipTotal = lessons.filter((l) => l.isFlagship).length;
  const coreTotal = lessons.length - flagshipTotal;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="description" content="Neft Teacher Grade 6 math curriculum hub — every lesson, notes packet, graphic novel, 3D game, and test organized by unit." />
<title>Curriculum Hub — Neft Teacher Grade 6 Math</title>
${styles()}
</head>
<body>
<div class="wrap">
  <header class="hub">
    <p class="eyebrow">Neft Teacher · Grade 6 Math</p>
    <h1>Curriculum Hub</h1>
    <p class="lede">Every resource organized by Unit → Lesson. Expand a unit to see its graphic novels, 3D game, pre/post-tests and study guide, then open each lesson to find its interactive activity, guided notes, downloads, and homework — all in one place.</p>
  </header>
  <div class="controls">
    <div class="search">
      <label for="curr-search">Search</label>
      <input id="curr-search" type="search" placeholder="Filter by lesson, standard, or topic…" aria-label="Filter lessons by title, standard, or topic" autocomplete="off" />
    </div>
    <button class="btn" type="button" id="expand-all">Expand all</button>
    <button class="btn" type="button" id="collapse-all">Collapse all</button>
  </div>
  <p class="no-results" id="no-results" role="status">No lessons match your search.</p>
  ${unitsHtml}
  <footer class="hub">Neft Teacher · Grade 6 Math · ${units.length} units · ${lessons.length} lessons (${coreTotal} core + ${flagshipTotal} flagship)</footer>
</div>
${searchScript()}
</body>
</html>`;
}

/* ---------- run ---------- */

function main() {
  const lessons = lessonConfigs();
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const html = buildHub(lessons);
  writeFileSync(join(outDir, "index.html"), html);

  // Tally resource links for the run log.
  const units = new Set(lessons.map((l) => l.cfg.unit ?? Number(l.id.split("-")[0])));
  let linkCount = 0;
  for (const u of units) {
    linkCount += (unitResources(u).match(/class="res"/g) || []).length;
  }
  for (const { id } of lessons) {
    linkCount += lessonResources(id).filter((p) => p.includes('class="res"')).length;
  }
  console.log(
    `Generated curriculum/index.html — ${units.size} units, ${lessons.length} lessons, ~${linkCount} live resource links.`
  );
}

main();
