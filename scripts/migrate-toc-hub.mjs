#!/usr/bin/env node
// Rebuild the curriculum hub's unit sections for the book numbering.
//
//   node scripts/migrate-toc-hub.mjs --dry-run
//   node scripts/migrate-toc-hub.mjs
//
// curriculum/index.html is hand-augmented — generate-curriculum.mjs refuses to
// write it — so this edits it surgically rather than regenerating it. Only the
// ten <details class="unit"> blocks and the unit jump bar are touched; the hero,
// search, teacher tools, mailbox and every other augmentation are left byte for
// byte alone.
//
// What has to change:
//   * Lesson blocks carry their OLD number as the visible label while linking
//     the NEW path (the renumbering rewrote hrefs, not labels).
//   * Blocks sit under the unit they used to belong to.
//   * 20 lessons have no block at all (18 promoted + the newly authored 2-8, 7-1).
//   * Unit names/blurbs are the old scope-and-sequence.
//
// Unit-level resources (unit game, post-test project, study guide, band game)
// follow their CONTENT: each old unit's resource row moves to the unit where the
// majority of that unit's lessons now live. Units 1, 9 and 10 are new content and
// legitimately have none yet, so they render without a resource row rather than
// with someone else's.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry-run");
const FILE = join(ROOT, "curriculum", "index.html");

const toc = JSON.parse(readFileSync(join(ROOT, "data/reveal-toc-2025.json"), "utf8"));

const UNIT_META = {
  1: { name: "Math Is...", blurb: "Who we are as mathematicians" },
  2: { name: "Statistics", blurb: "Statistical questions, data displays &amp; measures" },
  3: { name: "Ratios &amp; Rates", blurb: "Ratios, rates &amp; ratio reasoning" },
  4: { name: "Percents", blurb: "Understand &amp; use percentages" },
  5: { name: "Area, Surface Area &amp; Volume", blurb: "Area, surface area &amp; volume problems" },
  6: { name: "Expressions", blurb: "Numerical &amp; algebraic expressions, fraction division" },
  7: {
    name: "Integers &amp; the Coordinate Plane",
    blurb: "Integers, rational numbers &amp; the coordinate plane",
  },
  8: { name: "Equations &amp; Inequalities", blurb: "Equations &amp; inequalities" },
  9: { name: "Two-Variable Relationships", blurb: "Relationships between two variables" },
  10: { name: "Math Is...", blurb: "Where math takes us next" },
};

// old unit -> new unit, by where the majority of that unit's lessons landed.
const RES_MOVE = { 1: 2, 2: 6, 3: 3, 4: 4, 5: 5, 6: 6, 7: 8, 8: 2, 9: 7, 10: 5 };

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Find the matching close for the <details> that starts at `open`. Nesting-aware. */
function matchDetails(html, open) {
  const re = /<\/?details\b/gi;
  re.lastIndex = open;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    if (m[0][1] === "/") {
      depth--;
      if (depth === 0) return html.indexOf(">", m.index) + 1;
    } else depth++;
  }
  throw new Error(`unbalanced <details> starting at ${open}`);
}

/** Every top-level <details class="unit"> block, in document order. */
function unitBlocks(html) {
  const out = [];
  const re = /<details class="unit"[^>]*>/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const end = matchDetails(html, m.index);
    out.push({ start: m.index, end, text: html.slice(m.index, end) });
    re.lastIndex = end;
  }
  return out;
}

/** Lesson <details> inside a unit block, keyed by the lesson id they link to. */
function lessonBlocks(unitText) {
  const map = new Map();
  const re = /<details\s+class="lesson"/g;
  for (let m = re.exec(unitText); m; m = re.exec(unitText)) {
    const end = matchDetails(unitText, m.index);
    const text = unitText.slice(m.index, end);
    const id = (text.match(/href="\/lessons\/([\w-]+)\//) || [])[1];
    if (id) map.set(id, text);
    re.lastIndex = end;
  }
  return map;
}

/** The unit-resources row, if this unit block has one. */
function resourceRow(unitText) {
  const i = unitText.indexOf('<div class="unit-res">');
  if (i === -1) return "";
  // Resource rows are flat divs; find their close by counting <div>.
  const re = /<\/?div\b/gi;
  re.lastIndex = i;
  let depth = 0;
  for (let m = re.exec(unitText); m; m = re.exec(unitText)) {
    if (m[0][1] === "/") {
      depth--;
      if (depth === 0) return unitText.slice(i, unitText.indexOf(">", m.index) + 1);
    } else depth++;
  }
  return "";
}

/* ---------------------------------------------------------------- new blocks */

const cfgOf = (id) => JSON.parse(readFileSync(join(ROOT, "lessons", id, "config.json"), "utf8"));

/** Resource pills for a lesson, existence-checked so no dead link ships. */
function resPills(id) {
  const has = (...p) => existsSync(join(ROOT, "lessons", id, ...p));
  const pills = [`<a class="res" href="/lessons/${id}/">Interactive Lesson</a>`];
  if (has("slides.html"))
    pills.push(`<a class="res" href="/lessons/${id}/slides.html">Google Slides</a>`);
  if (has("editable-slides.html"))
    pills.push(
      `<a class="res" href="/lessons/${id}/editable-slides.html">📊 Reveal Math — Editable Slides + Lesson</a>`,
    );
  if (has("notes.html"))
    pills.push(`<a class="res" href="/lessons/${id}/notes.html">Guided Notes</a>`);
  if (has("downloads", `${id}-notes.pdf`))
    pills.push(`<a class="res" href="/lessons/${id}/downloads/${id}-notes.pdf">Notes PDF</a>`);
  if (has("downloads", `${id}-notes.docx`))
    pills.push(`<a class="res" href="/lessons/${id}/downloads/${id}-notes.docx">Notes DOCX</a>`);
  if (has("homework.docx"))
    pills.push(`<a class="res" href="/lessons/${id}/homework.docx">Homework</a>`);
  pills.push(`<a class="res" href="/teacher-tools/post-forms/?lesson=${id}">Google Forms</a>`);
  return pills.join("\n                ");
}

function lessonBlock(id) {
  const cfg = cfgOf(id);
  const obj = cfg.contentObjective || "";
  const search = `${id} ${cfg.title} ${cfg.standard} ${obj}`
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
  return `<details
            class="lesson"
            data-search="${esc(search)}"
          >
            <summary class="lesson-sum">
              <span class="lesson-head"
                >Lesson ${id} · ${esc(cfg.title)} <span class="badge badge-std">${esc(cfg.standard)}</span></span
              >
            </summary>
            <div class="lesson-body">
              <p class="lesson-obj">
                ${esc(obj)}
              </p>
              <div class="res-row">
                ${resPills(id)}
              </div>
            </div>
          </details>`;
}

/** Small-group companion block — the shape validate-small-group-lessons.mjs pins. */
function groupBlock(baseId, group) {
  const id = `${baseId}-group${group}`;
  const cfg = cfgOf(id);
  const dotted = baseId.replace("-", ".");
  const label = group === 1 ? "Extra Support" : "Challenge";
  const obj = cfg.contentObjective || "";
  return `<details
            class="lesson lesson-sg"
            data-search="${esc(`${id} ${dotted} small group group ${group} ${label} ${obj}`.toLowerCase())}"
          >
            <summary class="lesson-sum">
              <span class="lesson-head"
                >${dotted} Small Group: Group ${group} <span class="badge badge-sg">${label}</span></span
              >
            </summary>
            <div class="lesson-body">
              <p class="lesson-obj">
                ${esc(obj)}
              </p>
              <div class="res-row">
                <a class="res" href="/lessons/${id}/">Small-Group Lesson</a
                ><a class="res" href="/lessons/${id}/worksheet.html">Worksheet</a>
              </div>
            </div>
          </details>`;
}

/* -------------------------------------------------------------------- rebuild */

let html = readFileSync(FILE, "utf8");
const blocks = unitBlocks(html);
if (blocks.length !== 10) throw new Error(`expected 10 unit blocks, found ${blocks.length}`);

// Harvest the existing lesson markup and resource rows before rewriting.
const existingLessons = new Map();
const resourcesByOldUnit = new Map();
blocks.forEach((b, i) => {
  for (const [id, text] of lessonBlocks(b.text)) existingLessons.set(id, text);
  const row = resourceRow(b.text);
  if (row) resourcesByOldUnit.set(i + 1, row);
});

// Which lessons belong to each unit now — read off disk, the real source of truth.
const byUnit = new Map();
for (const d of readdirSync(join(ROOT, "lessons"))) {
  if (!/^\d+-\d+$/.test(d)) continue;
  const u = Number(d.split("-")[0]);
  if (!byUnit.has(u)) byUnit.set(u, []);
  byUnit.get(u).push(d);
}
for (const list of byUnit.values())
  list.sort((a, b) => Number(a.split("-")[1]) - Number(b.split("-")[1]));

const bookCluster = {};
for (const u of toc.units) {
  const ids = byUnit.get(u.unit) || [];
  // The DOMAIN, not a specific standard: "6.DS.4" -> "6.DS", "MPP.3" -> "MPP".
  // Units 1 and 10 are the book's practice-standard "Math Is..." units, so their
  // domain is MPP rather than a Grade 6 content cluster.
  const doms = ids.map((id) => {
    const std = cfgOf(id).standard || "";
    const parts = std.split(".");
    return /^\d/.test(parts[0]) ? parts.slice(0, 2).join(".") : parts[0];
  });
  bookCluster[u.unit] =
    doms.sort(
      (a, b) => doms.filter((x) => x === b).length - doms.filter((x) => x === a).length,
    )[0] || "";
}

const resourcesByNewUnit = new Map();
for (const [oldU, row] of resourcesByOldUnit) {
  const target = RES_MOVE[oldU];
  if (!resourcesByNewUnit.has(target)) resourcesByNewUnit.set(target, []);
  resourcesByNewUnit.get(target).push(row);
}

let rebuilt = 0;
let created = 0;
const out = [];
let cursor = 0;
for (let u = 1; u <= 10; u++) {
  const b = blocks[u - 1];
  const ids = byUnit.get(u) || [];
  const meta = UNIT_META[u];

  const lessonsHtml = ids
    .map((id) => {
      let block = existingLessons.get(id);
      if (block) {
        // Relabel: the visible number and title must match the book.
        const cfg = cfgOf(id);
        block = block
          .replace(/>Lesson [\d-]+ · [^<]*/, `>Lesson ${id} · ${esc(cfg.title)} `)
          .replace(
            /data-search="[^"]*"/,
            `data-search="${esc(`${id} ${cfg.title} ${cfg.standard}`.toLowerCase())}"`,
          )
          .replace(
            /<span class="badge badge-std">[^<]*<\/span>/,
            `<span class="badge badge-std">${esc(cfg.standard)}</span>`,
          );
        rebuilt++;
      } else {
        block = lessonBlock(id);
        created++;
      }
      return [block, groupBlock(id, 1), groupBlock(id, 2)].join("\n          ");
    })
    .join("\n          ");

  const rows = (resourcesByNewUnit.get(u) || []).join("\n          ");

  const unitHtml = `<details class="unit"${u === 1 ? " open" : ""}>
        <summary class="unit-sum">
          <span class="unit-title">
            <span class="unit-num">Unit ${u}</span>
            <span class="unit-name">${meta.name}</span>
          </span>
          <span class="unit-meta">
            <span class="unit-blurb">${meta.blurb}</span>
            <span class="badge badge-cluster">${esc(bookCluster[u])}</span>
            <span class="unit-count">${ids.length} lessons</span>
          </span>
        </summary>
        <div class="unit-body">
          ${rows}
          ${lessonsHtml}
        </div>
      </details>`;

  out.push(html.slice(cursor, b.start), unitHtml);
  cursor = b.end;
}
out.push(html.slice(cursor));
let next = out.join("");

// Jump bar labels follow the unit names.
for (let u = 1; u <= 10; u++) {
  next = next.replace(
    new RegExp(`(<a href="#unit-${u}" class="unit-jump-pill">)[^<]*(</a>)`),
    `$1Unit ${u} ${UNIT_META[u].name}$2`,
  );
}

console.log(`unit blocks rebuilt : 10`);
console.log(`lesson blocks kept  : ${rebuilt} (relabelled to the book number + title)`);
console.log(`lesson blocks created: ${created} (had no hub entry)`);
console.log(`small-group blocks  : ${[...byUnit.values()].flat().length * 2}`);
console.log(`unit resource rows moved: ${[...resourcesByOldUnit.keys()].length}`);
if (!DRY) writeFileSync(FILE, next);
console.log(DRY ? "[dry] not written" : "wrote curriculum/index.html");
