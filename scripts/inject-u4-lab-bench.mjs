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
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import { UNIT4 } from "./generate-practice-studios.mjs";
import { benchItems, benchProblems } from "./lib/practice-studio-bench.mjs";

const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const BEGIN = "<!-- u4-lab-bench:begin (scripts/inject-u4-lab-bench.mjs) -->";
const END = "<!-- u4-lab-bench:end -->";
const BLOCK = /\n?<!-- u4-lab-bench:begin[\s\S]*?<!-- u4-lab-bench:end -->\n?/g;
const json = (/** @type {any} */ v) => JSON.stringify(v).replace(/</g, "\\u003c");
const esc = (/** @type {string} */ s) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);
const bi = (/** @type {string} */ en, /** @type {string} */ es) =>
  `<span>${esc(en)}</span><span class="es-text" lang="es">${esc(es)}</span>`;

const SCRIPTS = ["kinds-basic", "kinds-lab", "lab-embed"].map((f) => `assets/studio/${f}.js`);
const STYLE = "assets/studio/lab-embed.css";

function stamps() {
  const h = createHash("sha1");
  for (const f of [...SCRIPTS, STYLE]) h.update(read(f));
  const lh = createHash("sha1");
  const dir = "curriculum/learning-labs/shared";
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
      const page = read(rel).replace(BLOCK, "\n");
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
