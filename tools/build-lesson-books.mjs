#!/usr/bin/env node
/**
 * Build the one-lesson graphic novels of the eight shows (Clip Squad, Drift League, ... Mars Colony Alpha).
 *
 * Source of truth, per book: graphic-novels/axiom-city/_engine/books/<lesson>.json (story, gates, answer key, art
 * prompts) and its show: _engine/worlds/<world>.json (brand, companion, palette, character art fragments).
 * Contract: docs/lesson-book-spec.md. Series plan: docs/lesson-book-series-bible.md.
 *
 * Writes, per book:
 *   episodes/<world>-l<lesson>-<slug>.html      the book (shell: the illustrated Power Ring episode, re-branded)
 *   _engine/art/<world>-l<lesson>/panels.json   the art spec read by tools/gn-art.py and tools/inject-gn-art.mjs
 *   lessons/<lesson>/config.json graphicNovel   so the hub, Learning Lab and downloads link the book
 * Then run: python3 tools/gn-art.py generate|pack <panels.json> --engine gemini, node tools/inject-gn-art.mjs,
 * node tools/inject-gn-layer.mjs.
 *
 *   node tools/build-lesson-books.mjs [6-1 6-2 ...]   build (all specs when no ids)
 *   node tools/build-lesson-books.mjs --check          exit 1 if a spec fails its audit or an output is stale
 *   node tools/build-lesson-books.mjs --audit <spec>   audit one or more spec JSON files without building
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { lessonPath } from "./lib/curriculum-source.mjs";
import { auditSpec, compileContent, panelsJson } from "./lib/lesson-book.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const AC = join(ROOT, "graphic-novels/axiom-city");
const ENGINE = join(AC, "_engine");
const SHELL = join(AC, "episodes/axiom-city-u6-e2-the-power-ring.html");
const HREF = "/graphic-novels/axiom-city/episodes/";

const readJson = (f) => JSON.parse(readFileSync(f, "utf8"));
export const worlds = () =>
  Object.fromEntries(
    readdirSync(join(ENGINE, "worlds"))
      .filter((f) => f.endsWith(".json"))
      .map((f) => [f.replace(/\.json$/, ""), readJson(join(ENGINE, "worlds", f))]),
  );
export const specs = () =>
  readdirSync(join(ENGINE, "books"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => readJson(join(ENGINE, "books", f)))
    .sort((a, b) => a.lesson.localeCompare(b.lesson, "en", { numeric: true }));

export const bookName = (s) => `${s.world}-l${s.lesson}-${s.slug}`;
export const artDir = (s) => join(ENGINE, "art", `${s.world}-l${s.lesson}`);

function swap(html, re, to, what) {
  const hits = html.match(new RegExp(re.source, re.flags.replace("g", "") + "g"));
  if (!hits || hits.length !== 1)
    throw new Error(`shell has ${hits ? hits.length : 0} match(es) for ${what}, expected 1`);
  return html.replace(re, () => to);
}

const CONTENT_START = /\/\* =+\n\s+===== CONTENT START[^\n]*\n\s+=+ \*\/\n/;
const CONTENT_END = /\/\* =+\n\s+===== CONTENT END/;

function themeCss(w) {
  const t = w.theme;
  return `<style id="world-theme">/* ${w.brand}: palette for every book of the show (tools/build-lesson-books.mjs) */
:root{--navy:${t.navy};--teal:${t.teal};--amber:${t.amber};--coral:${t.coral};--accent:${t.accent}}
body{background:${t.background}}
.balloon .who{color:${t.who}}
.gatebox header,.gatebox header .gicon,#coverTitle .vol{color:${t.accentText}}
.journal .jrow{flex-wrap:wrap}.journal .jrow b{flex:0 0 auto;max-width:100%;overflow-wrap:normal;word-break:normal;hyphens:manual}.journal .jrow span{flex:1 1 12rem;min-width:0}
</style>
`;
}

export function buildHtml(spec, world, shell) {
  const brand = world.brand;
  const comp = world.companion.name;
  const label = `LESSON ${spec.lesson}`;
  let h = shell.replace(
    /<!-- ac-holopad-injected:begin -->[\s\S]*?<!-- ac-holopad-injected:end -->\n?/,
    "",
  );
  h = swap(
    h,
    /<title>[\s\S]*?<\/title>/,
    `<title>${world.title} Lesson ${spec.lesson} — ${spec.title} | Interactive Graphic Novel | ${spec.pageTitle}</title>`,
    "title",
  );
  h = swap(
    h,
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="Interactive Grade 6 math graphic novel for lesson ${spec.lesson} (${world.title}): ${spec.covers}. Free-read, gates coach but never block. EduWonderLab.">`,
    "meta description",
  );
  h = swap(
    h,
    /aria-label="Cover of Axiom City[^"]*"/,
    `aria-label="Cover of ${world.title}, Lesson ${spec.lesson}: ${spec.title}. ${spec.cover.alt.replace(/"/g, "&quot;")}"`,
    "cover label",
  );
  h = swap(h, /<h1>[\s\S]*?<\/h1>/, `<h1>${spec.coverTitle}</h1>`, "cover h1");
  h = swap(
    h,
    /<span class="vol">[\s\S]*?<\/span>/,
    `<span class="vol">${label} · ${spec.topic}</span>`,
    "cover vol",
  );
  h = swap(
    h,
    /<div id="coverBottom">[\s\S]*?<\/div>/,
    `<div id="coverBottom"><span>AN INTERACTIVE<br>GRAPHIC NOVEL</span><span>GRADE 6 · LESSON ${spec.lesson}<br>EDUWONDERLAB</span></div>`,
    "cover bottom",
  );
  h = swap(
    h,
    /<div class="brand">AXIOM CITY<small>[\s\S]*?<\/small><\/div>/,
    `<div class="brand">${brand}<small>L${spec.lesson} · ${spec.title.toUpperCase()}</small></div>`,
    "hud brand",
  );
  h = swap(
    h,
    /<h2 id="tmTitle">[\s\S]*?<\/h2>/,
    `<h2 id="tmTitle">Teacher Guide — Lesson ${spec.lesson}</h2>`,
    "teacher title",
  );
  h = swap(
    h,
    /<span>AXIOM CITY · EDUWONDERLAB<\/span>/,
    `<span>${brand} · EDUWONDERLAB</span>`,
    "spine",
  );
  h = swap(
    h,
    /<div class="series">AXIOM CITY<\/div>/,
    `<div class="series">${brand}</div>`,
    "series",
  );
  h = swap(
    h,
    /<div class="kicker" style="opacity:\.4">AXIOM CITY<\/div>/,
    `<div class="kicker" style="opacity:.4">${brand}</div>`,
    "page footer",
  );
  h = h.replace(/\bVEX\b/g, comp);
  h = swap(h, /<\/head>/, `${themeCss(world)}</head>`, "head end");
  const a = h.match(CONTENT_START);
  const b = h.match(CONTENT_END);
  if (!a || !b || b.index < a.index) throw new Error("shell has no CONTENT START/END markers");
  return `${h.slice(0, a.index + a[0].length)}${compileContent(spec, world)}\n${h.slice(b.index)}`;
}

/** The lesson config's graphicNovel entry for a spec. */
export function configEntry(spec, world, standard) {
  return {
    href: `${HREF}${bookName(spec)}.html`,
    title: `${world.title}: ${spec.title}`,
    menuTitle: spec.title,
    standard,
    desc: `Interactive ${world.title} episode written for this lesson — read straight through; gates coach but never block. Not graded.`,
  };
}

/** The book's current html with its injected blocks (art, shared layer) kept, so a rebuild is idempotent. */
function keepInjected(fresh, old) {
  if (!old) return fresh;
  let out = fresh;
  const layer = /<!-- gn-layer:begin[\s\S]*?<!-- gn-layer:end -->\n?/;
  const was = old.match(layer);
  if (was && layer.test(out)) out = out.replace(layer, () => was[0]);
  // the art stylesheet block sits immediately before </head> (tools/inject-gn-art.mjs puts it there)
  const head = old.match(/<!-- gn-art:begin[\s\S]*?<!-- gn-art:end -->\n?/);
  if (head)
    out = out
      .replace(/<!-- gn-art:begin[\s\S]*?<!-- gn-art:end -->\n?/, "")
      .replace("</head>", () => `${head[0]}</head>`);
  // the art script lives inside the content region, just before `const PAGES` (tools/inject-gn-art.mjs puts it there)
  const art = old.match(/\/\* gn-art:begin[\s\S]*?\/\* gn-art:end \*\/\n?/);
  if (art)
    out = out
      .replace(/\/\* gn-art:begin[\s\S]*?\/\* gn-art:end \*\/\n?/, "")
      .replace(/^const PAGES = /m, () => `${art[0]}const PAGES = `);
  return out;
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");
  const audit = args.includes("--audit");
  const only = args.filter((a) => !a.startsWith("--"));
  const W = worlds();
  if (audit) {
    if (!only.length) {
      console.error("usage: node tools/build-lesson-books.mjs --audit <spec.json> [...]");
      process.exit(1);
    }
    const problems = [];
    for (const f of only) {
      const s = readJson(f);
      if (!W[s.world]) problems.push(`${s.lesson}: unknown world ${s.world}`);
      else problems.push(...auditSpec(s));
    }
    if (problems.length) {
      console.error(problems.map((p) => `✗ ${p}`).join("\n"));
      process.exit(1);
    }
    console.log(`audit clean (${only.length})`);
    return;
  }
  const shell = readFileSync(SHELL, "utf8");
  const all = specs();
  const problems = [];
  // the next episode of the same show, so each certificate page links onward
  all.forEach((s, i) => {
    const n = all.slice(i + 1).find((x) => x.world === s.world);
    s.next = n ? { lesson: n.lesson, title: n.title, href: `${HREF}${bookName(n)}.html` } : null;
  });
  for (const s of all.filter((x) => !only.length || only.includes(x.lesson))) {
    const world = W[s.world];
    if (!world) {
      problems.push(`${s.lesson}: unknown world ${s.world}`);
      continue;
    }
    problems.push(...auditSpec(s));
    const file = join(AC, "episodes", `${bookName(s)}.html`);
    const old = existsSync(file) ? readFileSync(file, "utf8") : null;
    const html = keepInjected(buildHtml(s, world, shell), old);
    const pj = `${JSON.stringify(panelsJson(s, world), null, 2)}\n`;
    const pjFile = join(artDir(s), "panels.json");
    const cfgFile = lessonPath(s.lesson, "config.json");
    const cfg = readJson(cfgFile);
    const entry = configEntry(s, world, cfg.standard);
    if (check) {
      if (html !== old) problems.push(`${s.lesson}: ${bookName(s)}.html is stale`);
      if (!existsSync(pjFile) || readFileSync(pjFile, "utf8") !== pj)
        problems.push(`${s.lesson}: panels.json is stale`);
      if (JSON.stringify(cfg.graphicNovel) !== JSON.stringify(entry))
        problems.push(`${s.lesson}: config graphicNovel is stale`);
      continue;
    }
    writeFileSync(file, html);
    mkdirSync(artDir(s), { recursive: true });
    writeFileSync(pjFile, pj);
    cfg.graphicNovel = entry;
    writeFileSync(cfgFile, `${JSON.stringify(cfg, null, 2)}\n`);
    console.log(`✓ ${bookName(s)}.html  (${s.gates.length} gates, ${s.panels.length + 1} panels)`);
  }
  if (problems.length) {
    console.error(problems.map((p) => `✗ ${p}`).join("\n"));
    process.exit(1);
  }
  if (check) console.log(`lesson books current (${all.length})`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
