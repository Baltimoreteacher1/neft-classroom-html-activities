#!/usr/bin/env node
/* =============================================================================
 * build-graphic-novel-teacher-launcher.mjs
 *
 * Generates graphic-novels/teacher/index.html — a TEACHER-ONLY launcher that
 * lists every Axiom City novel with three actions each:
 *   • Open Teacher version  (adds ?teacher=1 → shows the Teaching Guide button)
 *   • Open Student version  (plain link → no teacher content)
 *   • Copy student link      (copies the absolute student URL to share)
 *
 * The novel pages themselves default to the STUDENT view (the Teacher button is
 * hidden unless ?teacher=1, via tools/gate-graphic-novel-teacher.mjs), so the
 * link a teacher copies here is safe to hand to students.
 *
 * Re-run after adding/removing novels:  node tools/build-graphic-novel-teacher-launcher.mjs
 * ========================================================================== */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, basename, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOVELS_DIR = join(ROOT, "graphic-novels");
const OUT_DIR = join(NOVELS_DIR, "teacher");
const OUT_FILE = join(OUT_DIR, "index.html");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

function titleOf(html, fallback) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  if (!m) return fallback;
  // Trim only the site/section suffix after " | " (keep the em-dash subtitle,
  // e.g. "Axiom City Vol. 1 — The Pattern Engine").
  return m[1].split(" | ")[0].trim() || fallback;
}

// Only novels that actually have a teacher guide button are relevant here.
const files = walk(NOVELS_DIR).filter((f) =>
  /id="teacherBtn"/.test(readFileSync(f, "utf8")),
);

// Dedupe shared stories that exist at two paths: prefer unitN/ for volumes and
// axiom-city/episodes/ for episodes; drop the axiom-city/ vol mirror and the
// unit2/ episode copies.
function priority(relPath) {
  const isEpisode = /axiom-city-u\d+-e\d+/.test(relPath);
  if (isEpisode) return relPath.includes("/episodes/") ? 0 : 1;
  // volume — prefer the unitN/ path over the axiom-city/ mirror
  return /(^|\/)unit\d+\//.test(relPath) ? 0 : 1;
}

const byBase = new Map();
for (const f of files) {
  const rel = relative(NOVELS_DIR, f).split("\\").join("/");
  const base = basename(f);
  const existing = byBase.get(base);
  if (!existing || priority(rel) < priority(existing.rel)) {
    byBase.set(base, { rel, file: f });
  }
}

const entries = [...byBase.values()].map(({ rel, file }) => {
  const html = readFileSync(file, "utf8");
  const base = basename(file);
  let unit = 99;
  let ep = 0;
  let kind = "Story";
  let vm = base.match(/axiom-city-vol-(\d+)/);
  let em = base.match(/axiom-city-u(\d+)-e(\d+)/);
  if (vm) {
    unit = Number(vm[1]);
    kind = "Volume";
  } else if (em) {
    unit = Number(em[1]);
    ep = Number(em[2]);
    kind = `Episode ${ep}`;
  }
  return { rel, title: titleOf(html, base), unit, ep, kind, isVol: !!vm };
});

entries.sort((a, b) =>
  a.unit !== b.unit
    ? a.unit - b.unit
    : a.isVol !== b.isVol
      ? a.isVol
        ? -1
        : 1
      : a.ep - b.ep,
);

// Group by unit
const units = new Map();
for (const e of entries) {
  if (!units.has(e.unit)) units.set(e.unit, []);
  units.get(e.unit).push(e);
}

const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const sections = [...units.keys()]
  .sort((a, b) => a - b)
  .map((u) => {
    const cards = units
      .get(u)
      .map((e) => {
        // Links are relative to graphic-novels/teacher/index.html
        const href = `../${e.rel}`;
        return `      <li class="gn-card">
        <div class="gn-meta"><span class="gn-kind">${esc(e.kind)}</span><span class="gn-title">${esc(e.title)}</span></div>
        <div class="gn-actions">
          <a class="gn-btn gn-teacher" href="${esc(href)}?teacher=1" target="_blank" rel="noopener">🍎 Open Teacher</a>
          <a class="gn-btn gn-student" href="${esc(href)}" target="_blank" rel="noopener">📖 Open Student</a>
          <button type="button" class="gn-btn gn-copy" data-href="${esc(href)}">🔗 Copy student link</button>
        </div>
      </li>`;
      })
      .join("\n");
    const label = u === 99 ? "Other" : `Unit ${u}`;
    return `    <section class="gn-unit"><h2>${label}</h2><ul class="gn-list">\n${cards}\n    </ul></section>`;
  })
  .join("\n");

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Graphic Novels — Teacher Launcher | Neft Teacher</title>
<style>
  :root{--navy:#12355b;--teal:#1fa6a2;--gold:#f2c15b;--ink:#21313f;--line:#dfe6ee;--soft:#f5f8fb}
  *{box-sizing:border-box}
  body{margin:0;font-family:'Segoe UI',system-ui,sans-serif;color:var(--ink);background:var(--soft);line-height:1.5}
  header{background:linear-gradient(160deg,#0f2030,#1c3a52);color:#fff;padding:28px 20px}
  header .wrap{max-width:900px;margin:0 auto}
  header h1{margin:0 0 6px;font-size:1.5rem}
  header p{margin:0;opacity:.85}
  main{max-width:900px;margin:0 auto;padding:20px}
  .gn-note{background:#fff;border:1px solid var(--line);border-left:4px solid var(--teal);border-radius:10px;padding:12px 16px;margin:0 0 20px;font-size:.92rem}
  .gn-unit{margin:0 0 26px}
  .gn-unit h2{font-size:1.1rem;color:var(--navy);border-bottom:2px solid var(--line);padding-bottom:6px}
  .gn-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px}
  .gn-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between}
  .gn-meta{display:flex;flex-direction:column;min-width:200px;flex:1 1 240px}
  .gn-kind{font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--teal)}
  .gn-title{font-weight:700;color:var(--navy)}
  .gn-actions{display:flex;flex-wrap:wrap;gap:8px}
  .gn-btn{font:700 .85rem/1 'Segoe UI',system-ui,sans-serif;padding:10px 14px;border-radius:9px;border:2px solid transparent;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center}
  .gn-teacher{background:var(--teal);color:#fff}
  .gn-student{background:var(--gold);color:var(--navy)}
  .gn-copy{background:#fff;border-color:var(--line);color:var(--navy)}
  .gn-copy.copied{background:#e6f7ef;border-color:#0f7c4a;color:#0f7c4a}
  .gn-btn:focus-visible{outline:3px solid var(--navy);outline-offset:2px}
</style>
</head>
<body>
<header><div class="wrap">
  <h1>📚 Graphic Novels — Teacher Launcher</h1>
  <p>Bookmark this page. It is for teachers only — don't share this link with students.</p>
</div></header>
<main>
  <p class="gn-note"><strong>How to use:</strong> Open the <strong>Teacher</strong> version to see the Teaching Guide. Use <strong>Copy student link</strong> to grab a clean link to give your students — the student version never shows teacher content.</p>
${sections}
</main>
<script>
  document.querySelectorAll(".gn-copy").forEach(function(btn){
    btn.addEventListener("click", function(){
      var abs = new URL(btn.dataset.href, location.href).href;
      var done = function(){
        var old = btn.textContent;
        btn.textContent = "✓ Copied!";
        btn.classList.add("copied");
        setTimeout(function(){ btn.textContent = old; btn.classList.remove("copied"); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(abs).then(done, function(){ window.prompt("Copy this student link:", abs); });
      } else {
        window.prompt("Copy this student link:", abs);
      }
    });
  });
</script>
</body>
</html>
`;

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, page);
console.log(
  `Wrote ${relative(ROOT, OUT_FILE)} — ${entries.length} novels across ${units.size} unit group(s).`,
);
