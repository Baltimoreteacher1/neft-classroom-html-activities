#!/usr/bin/env node
/**
 * Lab bench for the five hand-built Unit 4 lessons (4-1 .. 4-5), both pages each. The generated studios (Units 2, 3, 5-9) get their
 * bench from scripts/generate-practice-studios.mjs; these ten pages are hand-written HTML, so the same items are injected into them
 * between sentinel comments (idempotent: a second run changes nothing, and --check fails if a page is stale).
 *
 *   node scripts/inject-u4-lab-bench.mjs [--check]
 *
 * Source: data/practice-studio-u4/<lesson>.json  { v, lesson, bench }  — the same `bench` contract (docs/specs/practice-studio-v2.md
 * section 10), validated by scripts/lib/practice-studio-bench.mjs. The card is appended to the page's fourth section and runs
 * assets/studio/lab-embed.js, which gives the shared item kinds a small ctx of their own: no stars, no change to the page's state.
 *
 * The same run also keeps the pages on the studios' shared clarity layer (assets/studio/clarity.{css,js}: the header Menu, the
 * context chips), injected into <head> between their own sentinels, and the lesson's "I can…" target chip at the top of <main>
 * (English from lessons/<id>/config.json, Spanish `targetEs` from the same data file), so the ten hand-built pages and the
 * generated studios share one implementation.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import { UNIT4 } from "./generate-practice-studios.mjs";
import { withPlainDefinitions } from "./lib/family-plain-definitions.mjs";
import { benchItems, benchProblems } from "./lib/practice-studio-bench.mjs";
import { targetEsProblems } from "./lib/practice-studio-data.mjs";
import { glossaryBlock, targetChip } from "./lib/practice-studio-pages.mjs";
import { usedTraps } from "./lib/u4-traps.mjs";

const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const BEGIN = "<!-- u4-lab-bench:begin (scripts/inject-u4-lab-bench.mjs) -->";
const END = "<!-- u4-lab-bench:end -->";
const BLOCK = /\n?<!-- u4-lab-bench:begin[\s\S]*?<!-- u4-lab-bench:end -->\n?/g;
const json = (/** @type {any} */ v) => JSON.stringify(v).replace(/</g, "\\u003c");
const esc = (/** @type {string} */ s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
  `<span>${esc(en)}</span><span class="es-text" lang="es">${esc(es)}</span>`;

const SCRIPTS = ["typeset", "kinds-basic", "kinds-lab", "lab-embed"].map(
  (f) => `assets/studio/${f}.js`,
);
const STYLE = "assets/studio/lab-embed.css";
const CLARITY = ["assets/studio/clarity.css", "assets/studio/clarity.js"];
const THINKING = "assets/u4-studio-thinking.js";
const TYPE = "assets/u4-studio-type.js";
const HEAD_BEGIN = "<!-- u4-clarity:begin (scripts/inject-u4-lab-bench.mjs) -->";
const HEAD_BLOCK = /\n?[ \t]*<!-- u4-clarity:begin[\s\S]*?<!-- u4-clarity:end -->/g;
const TARGET_BLOCK = /\n?[ \t]*<!-- u4-target:begin[\s\S]*?<!-- u4-target:end -->/g;
const MAIN = '<main class="main-container">';

/** The context row with the lesson's target, placed first in <main>. */
function targetBlock(/** @type {string} */ id, /** @type {any} */ ld) {
  const problems = targetEsProblems(id, ld.targetEs);
  if (problems.length) throw new Error(problems.join("; "));
  const cfg = JSON.parse(read(`lessons/${id}/config.json`));
  if (!/^I can\b/.test(cfg.contentObjective || ""))
    throw new Error(`lessons/${id}/config.json: contentObjective is not an "I can" statement`);
  // The Word bank is the lesson's own vocabulary with its plain EN/ES definitions; the entry named for the lesson itself is
  // the title, not a word.
  const terms = withPlainDefinitions(cfg.vocabulary || [], id)
    .filter((v) => String(v.term).toLowerCase() !== String(cfg.title).toLowerCase())
    .map((v) => ({ t: v.term, tEs: v.termEs, d: v.definition, dEs: v.definitionEs }));
  return `\n    <!-- u4-target:begin (scripts/inject-u4-lab-bench.mjs) -->\n    <div class="studio-context">${targetChip(cfg.contentObjective, ld.targetEs)}${glossaryBlock(terms)}</div>\n    <!-- u4-target:end -->`;
}

/**
 * Sets body[data-theme] before first paint (the body does not exist yet, so a MutationObserver waits for it). Same rule as
 * resolveTheme() in assets/u4-studio.js: a saved Light/Dark wins, "auto" or nothing saved follows the device, and the
 * Challenge pages are night until the student chooses.
 */
const THEME_BOOT =
  '<script>(function(){try{var t=localStorage.getItem("neft_u4_theme_v1"),m=matchMedia("(prefers-color-scheme: dark)").matches,c=/-challenging/.test(location.pathname),d=t==="light"||t==="dark"?t:t==="auto"||!c?(m?"dark":"light"):"dark";new MutationObserver(function(_,o){if(document.body){document.body.dataset.theme=d;o.disconnect()}}).observe(document.documentElement,{childList:true})}catch(e){}})()</script>';

/** The shared clarity layer and the "My thinking" panel for <head>, stamped with a hash of their own files. */
function headBlock(/** @type {string} */ slug) {
  const h = createHash("sha1");
  for (const f of [...CLARITY, THINKING, TYPE]) h.update(read(f));
  const v = h.digest("hex").slice(0, 10);
  return `\n  ${HEAD_BEGIN}\n  ${THEME_BOOT}\n  <link rel="stylesheet" href="/${CLARITY[0]}?v=${v}">\n  <script src="/${CLARITY[1]}?v=${v}" defer></script>\n  <script type="application/json" id="u4-traps">${json(usedTraps(slug))}</script>\n  <script src="/${THINKING}?v=${v}" defer></script>\n  <script src="/${TYPE}?v=${v}" defer></script>\n  <!-- u4-clarity:end -->`;
}

function stamps() {
  const h = createHash("sha1");
  for (const f of [...SCRIPTS, STYLE]) h.update(read(f));
  const lh = createHash("sha1");
  for (const dir of ["curriculum/learning-labs/shared", "curriculum/learning-labs/shared/models"])
    for (const f of readdirSync(join(REPO_ROOT, dir)).sort())
      if (/\.(mjs|css)$/.test(f)) lh.update(read(`${dir}/${f}`));
  return { v: h.digest("hex").slice(0, 10), labV: lh.digest("hex").slice(0, 10) };
}

/** The injected block for one page. `mode` is "practice" or "challenge". */
function blockFor(
  /** @type {string} */ id,
  /** @type {"practice"|"challenge"} */ mode,
  /** @type {any} */ bench,
  /** @type {any} */ st,
) {
  const items = benchItems(bench)[mode];
  const all = [...items.before, ...items.after];
  const data = { items: all, key: `neft_u4lab_${id}_${mode}_v1`, labV: st.labV };
  const intro =
    mode === "practice"
      ? bi(
          "Test the idea with a live model, write what you notice, then take the mission. Nothing here is timed.",
          "Prueba la idea con un modelo en vivo, escribe lo que notes y luego haz la misión. Nada tiene tiempo.",
        )
      : bi(
          "A harder model task, a design to explain, and the mission at a stretch level. Nothing here is timed.",
          "Una tarea más difícil con el modelo, un diseño para explicar y la misión en nivel de desafío. Nada tiene tiempo.",
        );
  return `${BEGIN}
<link rel="stylesheet" href="/${STYLE}?v=${st.v}">
<section class="lab-embed" id="u4-lab-bench" aria-labelledby="u4-lab-title">
  <h2 id="u4-lab-title">🧪 ${bi("Lab bench", "Banco de laboratorio")} <span data-lab-count></span></h2>
  <p>${intro}</p>
  <div id="u4-lab-host"></div>
</section>
<script type="application/json" id="u4-lab-data">${json(data)}</script>
${SCRIPTS.map((f) => `<script src="/${f}?v=${st.v}"></script>`).join("\n")}
<script>
(function () {
  var panel = document.getElementById("panel-4");
  var card = document.getElementById("u4-lab-bench");
  if (panel && card) panel.appendChild(card);
  var data = JSON.parse(document.getElementById("u4-lab-data").textContent);
  window.StudioLabEmbed.mount(document.getElementById("u4-lab-host"), data);
})();
</script>
${END}
`;
}

/** Every page this injector owns, as path -> content. */
export function outputs() {
  const labs = JSON.parse(read("data/learning-labs.json"));
  const st = stamps();
  const files = new Map();
  for (const [id, practice, challenge] of UNIT4) {
    const file = `data/practice-studio-u4/${id}.json`;
    if (!existsSync(join(REPO_ROOT, file))) continue;
    const ld = JSON.parse(read(file));
    const problems = benchProblems(id, ld.bench, labs);
    if (problems.length)
      throw new Error(`${file} is invalid:\n  ${problems.slice(0, 8).join("\n  ")}`);
    for (const [mode, slug] of /** @type {const} */ ([
      ["practice", practice],
      ["challenge", challenge],
    ])) {
      const rel = `math/unit-4/${slug}/index.html`;
      let page = read(rel).replace(BLOCK, "\n").replace(HEAD_BLOCK, "").replace(TARGET_BLOCK, "");
      const main = page.indexOf(MAIN);
      if (main < 0) throw new Error(`${rel} has no ${MAIN}`);
      page = `${page.slice(0, main + MAIN.length)}${targetBlock(id, ld)}${page.slice(main + MAIN.length)}`;
      const head = page.indexOf("</head>");
      if (head < 0) throw new Error(`${rel} has no </head>`);
      page = `${page.slice(0, head).trimEnd()}${headBlock(slug)}\n${page.slice(head)}`;
      const at = page.lastIndexOf("</body>");
      if (at < 0) throw new Error(`${rel} has no </body>`);
      files.set(rel, `${page.slice(0, at)}${blockFor(id, mode, ld.bench, st)}${page.slice(at)}`);
    }
  }
  return files;
}

function main() {
  const check = process.argv.includes("--check");
  const files = outputs();
  let stale = 0;
  for (const [rel, content] of files) {
    if (read(rel) === content) continue;
    if (check) {
      console.error(`Stale: ${rel}`);
      stale++;
    } else writeFileSync(join(REPO_ROOT, rel), content);
  }
  if (check && stale) {
    console.error("Run: node scripts/inject-u4-lab-bench.mjs");
    process.exitCode = 1;
  } else console.log(`Unit 4 lab bench: ${files.size} pages ${check ? "are current" : "written"}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
