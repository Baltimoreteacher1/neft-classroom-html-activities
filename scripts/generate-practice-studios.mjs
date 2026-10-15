#!/usr/bin/env node
/**
 * Generate Practice Studio v2 for every core lesson in Units 2-9 (Unit 4 has its own hand-built set):
 *
 *   /math/practice-studio/<lesson>/index.html             the Practice studio
 *   /math/practice-studio/<lesson>/challenge/index.html   the Challenge studio
 *   /math/practice-studio/index.html                      the finder, with the student's passport
 *   assets/studio-worlds.css                              one daylight + one night palette per world
 *   curriculum/units/index.html                           "HTML practice" and "HTML practice (Challenge)" links on each lesson row
 *
 * Sources (nothing is composed here): the lesson's config.json (warm-up, practice tiers, connect check, exit ticket),
 * data/practice-studio/<lesson>.json (the authored studio content, validated against docs/specs/practice-studio-v2.md),
 * and data/practice-studio/worlds.json (look, voice and section names). `--check` fails if any generated file is stale.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import { typographizeItems } from "./lib/math-typography.mjs";
import { buildSections } from "./lib/practice-studio-config.mjs";
import { validateLessonData } from "./lib/practice-studio-data.mjs";
import { boostPage, indexPage, pageFor } from "./lib/practice-studio-pages.mjs";
import { worldsCss } from "./lib/practice-studio-worlds.mjs";

/** Units that get a generated studio. Unit 4's studios are hand-built; Units 1 and 10 are not in scope. */
export const STUDIO_UNITS = [2, 3, 5, 6, 7, 8, 9];
const MIN_ITEMS = 2;
const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const jsFiles = (/** @type {string} */ dir) =>
  existsSync(join(REPO_ROOT, dir))
    ? readdirSync(join(REPO_ROOT, dir))
        .filter((f) => f.endsWith(".js"))
        .sort()
    : [];
const coreFirst = (/** @type {string[]} */ fs) => [
  ...fs.filter((f) => f === "core.js"),
  ...fs.filter((f) => f !== "core.js"),
];

/** Unit 4 keeps its hand-built pages; the finder links to them. */
const UNIT4 = [
  ["4-1", "percent-practice-studio", "percent-practice-studio-challenging"],
  ["4-2", "4-2-practice-studio", "4-2-practice-studio-challenging"],
  ["4-3", "4-3-practice-studio", "4-3-practice-studio-challenging"],
  ["4-4", "4-4-practice-studio", "4-4-practice-studio-challenging"],
  ["4-5", "4-5-practice-studio", "4-5-practice-studio-challenging"],
];

/** Script and stylesheet URLs in load order, each stamped with a hash of everything the studios load. */
function assetPlan(/** @type {string} */ worlds) {
  const gen = coreFirst(jsFiles("assets/studio-gen")).map((f) => `assets/studio-gen/${f}`);
  const act = coreFirst(jsFiles("assets/studio-act")).map((f) => `assets/studio-act/${f}`);
  const vizAll = jsFiles("assets").filter((f) => /^studio-viz.*\.js$/.test(f));
  const viz = [
    ...vizAll.filter((f) => f === "studio-viz.js"),
    ...vizAll.filter((f) => f !== "studio-viz.js"),
  ].map((f) => `assets/${f}`);
  const runtime = ["store", "kinds-basic", "kinds-hands", "insight", "runtime"].map(
    (f) => `assets/studio/${f}.js`,
  );
  const scripts = [
    "assets/u4-studio.js",
    "assets/studio-comfort.js",
    "assets/studio/store.js",
    ...viz,
    ...gen,
    ...act,
    "assets/studio/boost-core.js",
    "assets/studio/boost.js",
    "assets/studio/chrome.js",
    ...runtime.slice(1),
    "assets/studio/quest-model.js",
    "assets/studio/quest.js",
  ];
  const styles = [
    "assets/u4-studio.css",
    "assets/studio-v2.css",
    "assets/studio-worlds.css",
    "assets/studio-comfort.css",
  ];
  const h = createHash("sha1");
  for (const f of [...styles, ...scripts, "assets/studio/finder.js"])
    h.update(
      f === "assets/studio-worlds.css" ? worlds : existsSync(join(REPO_ROOT, f)) ? read(f) : "",
    );
  const v = h.digest("hex").slice(0, 10);
  const url = (/** @type {string} */ f) => `/${f}?v=${v}`;
  return { styles: styles.map(url), scripts: scripts.map(url), stamp: v };
}

const HUB = "curriculum/units/index.html";
const MARK = /\s*<!-- practice-studio:[\w-]+ -->[\s\S]*?<!-- \/practice-studio -->/g;
/** Unit 4 has hand-built studios, so only the Lesson Path link is spliced for its rows. */
const MARK_PATH = /\s*<!-- lesson-path:[\w-]+ -->[\s\S]*?<!-- \/lesson-path -->/g;
const PATH_LINK = (/** @type {string} */ id) =>
  `<a class="res" href="/math/lesson-path/${id}/">Lesson path (one page)</a>`;

/** Every file this generator owns, as path → content. */
/** @param {{only?: string[]}} [opts] `only` builds a subset of lessons (smoke tests); the real build never passes it. */
export function outputs(opts = {}) {
  const worlds = JSON.parse(read("data/practice-studio/worlds.json"));
  const css = worldsCss(worlds);
  const assets = assetPlan(css);
  const ids = listLessonDirs({ filter: /^\d+-\d+$/ })
    .filter((id) => STUDIO_UNITS.includes(Number(id.split("-")[0])))
    .filter((id) => !opts.only || opts.only.includes(id))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const files = new Map();
  files.set("assets/studio-worlds.css", css);
  const entries = [];
  const report = [];
  /** every generated skill, with the first lesson that uses it: what the Daily Boost draws from */
  const boostCatalog = new Map();
  for (const id of ids) {
    const cfg = loadLessonConfig(id);
    const dataFile = `data/practice-studio/${id}.json`;
    if (!existsSync(join(REPO_ROOT, dataFile))) throw new Error(`${id}: missing ${dataFile}`);
    const ld = JSON.parse(read(dataFile));
    const problems = validateLessonData(id, ld, worlds);
    if (problems.length)
      throw new Error(`${dataFile} is invalid:\n  ${problems.slice(0, 8).join("\n  ")}`);
    const worldId = worlds.lessons[id];
    const world = { id: worldId, ...worlds.worlds[worldId] };
    const built = buildSections(cfg, ld, worlds, id);
    for (const mode of /** @type {const} */ (["practice", "challenge"])) {
      const sections = built.sections[mode];
      for (const s of sections)
        if (s.items.length < MIN_ITEMS)
          throw new Error(
            `${id} ${mode}: section "${s.name}" has ${s.items.length} items (need ${MIN_ITEMS})`,
          );
      files.set(
        `math/practice-studio/${id}/${mode === "practice" ? "" : "challenge/"}index.html`,
        pageFor({ id, mode, cfg, ld, world, sections: typographizeItems(sections), assets }),
      );
    }
    entries.push({ id, title: cfg.title || id, emoji: world.emoji, world: worldId });
    for (const sec of built.sections.practice)
      for (const spec of sec.items)
        if (spec.k === "gen" && !boostCatalog.has(spec.g))
          boostCatalog.set(spec.g, {
            g: spec.g,
            lesson: id,
            unit: Number(id.split("-")[0]),
            title: spec.lab || "",
          });
    report.push({
      id,
      left: built.left,
      items: ["practice", "challenge"].map((m) =>
        built.sections[m].reduce((a, s) => a + s.items.length, 0),
      ),
    });
  }
  const unit4 = UNIT4.map(([id, p, c]) => ({
    id,
    title: loadLessonConfig(id).title || id,
    practice: `/math/unit-4/${p}/`,
    challenge: `/math/unit-4/${c}/`,
  }));
  files.set("math/practice-studio/index.html", indexPage(entries, unit4, assets));
  if (!opts.only)
    files.set(
      "math/practice-studio/boost/index.html",
      boostPage({
        world: { id: "arcade", ...worlds.worlds.arcade },
        catalog: [...boostCatalog.values()].sort((a, b) => a.g.localeCompare(b.g)),
        assets,
      }),
    );

  let hub = read(HUB).replace(MARK, "");
  for (const { id } of entries) {
    const pattern = new RegExp(`(<a\\b[^>]*href="/lessons/${id}/"[^>]*>[\\s\\S]*?</a\\s*>)`);
    if (!pattern.test(hub)) throw new Error(`Missing curriculum lesson anchor: ${id}`);
    hub = hub.replace(
      pattern,
      `$1\n                <!-- practice-studio:${id} -->${PATH_LINK(id)}<a class="res" href="/math/practice-studio/${id}/">HTML practice</a><a class="res" href="/math/practice-studio/${id}/challenge/">HTML practice (Challenge)</a><!-- /practice-studio -->`,
    );
  }
  hub = hub.replace(MARK_PATH, "");
  for (const { id } of unit4) {
    const pattern = new RegExp(`(<a\\b[^>]*href="/lessons/${id}/"[^>]*>[\\s\\S]*?</a\\s*>)`);
    if (!pattern.test(hub)) throw new Error(`Missing curriculum lesson anchor: ${id}`);
    hub = hub.replace(
      pattern,
      `$1\n                <!-- lesson-path:${id} -->${PATH_LINK(id)}<!-- /lesson-path -->`,
    );
  }
  files.set(HUB, hub);
  return { files, report, stamp: assets.stamp };
}

function main() {
  const check = process.argv.includes("--check");
  const { files, report } = outputs();
  let stale = 0;
  for (const [rel, content] of files) {
    const path = join(REPO_ROOT, rel);
    const current = existsSync(path) ? readFileSync(path, "utf8") : null;
    if (check) {
      if (current !== content) {
        console.error(`Stale: ${rel}`);
        stale++;
      }
    } else if (current !== content) {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
    }
  }
  const items = report.reduce((a, r) => a + r.items[0] + r.items[1], 0);
  const left = report.reduce((a, r) => a + Object.values(r.left).reduce((x, y) => x + y, 0), 0);
  if (check) {
    if (stale) {
      console.error("Run: node scripts/generate-practice-studios.mjs");
      process.exitCode = 1;
    } else
      console.log(
        `Practice studios are current: ${report.length} lessons x 2 versions, ${items} items.`,
      );
  } else
    console.log(
      `Generated ${report.length} lessons x 2 studios with ${items} items; ${left} authored config items stay in their lessons (needs a manipulative or free text).`,
    );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
