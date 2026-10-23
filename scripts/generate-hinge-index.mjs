#!/usr/bin/env node
/**
 * Generate teacher-tools/class-pulse/hinge-index.json: what the Class Pulse teacher page needs to read a pasted code.
 *
 *   traps     24-bit trap hash (6 hex digits) -> misconception id, and each trap's plain name and quick fix
 *   lessons   per generated studio lesson: its title, how many problems each section holds, where each named misconception
 *             shows up (so a pull list can link to ?s=<section>&i=<problem>), and up to three hinge-question candidates
 *             (a tagged multiple-choice item whose wrong choices each name a trap, with no picture to draw)
 *   u4        the hand-built Unit 4 pages, which have no item index (the pull list links to the page)
 *
 * Sources are read, never composed: data/practice-studio/<id>.json and the lesson configs through the same buildSections()
 * the studio generator uses, data/practice-studio/misconceptions.json, and the generators themselves (a "New numbers" item
 * names its trap by running the generator). Writes only the one JSON file. `--check` fails if it is stale.
 *
 *   node scripts/generate-hinge-index.mjs [--check]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { listLessonDirs, loadLessonConfig, REPO_ROOT } from "../tools/lib/curriculum-source.mjs";
import { loadStudio } from "../tools/lib/studio-vm.mjs";
import { STUDIO_UNITS, UNIT4 } from "./generate-practice-studios.mjs";
import { typographizeItems } from "./lib/math-typography.mjs";
import { buildSections } from "./lib/practice-studio-config.mjs";

export const INDEX_PATH = "teacher-tools/class-pulse/hinge-index.json";
const read = (/** @type {string} */ rel) => readFileSync(join(REPO_ROOT, rel), "utf8");
const MODES = /** @type {const} */ (["practice", "challenge"]);
/** how many places per trap, per mode, a pull list can point at */
const REFS_PER_MODE = 2;
const HINGE_PER_LESSON = 3;
const GEN_SEEDS = 40;
const PICTURE_WORDS =
  /\b(diagram|graph|figure|picture|table|chart|plot|number line|shown|image|map)\b/i;
const KIND_RANK = { move: 0, mc: 1, gen: 2, pool: 3 };

const core = (() => {
  const ctx = /** @type {any} */ ({});
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read("assets/studio/pulse-core.js"), ctx);
  return ctx.StudioPulseCore;
})();
const hex = (/** @type {number} */ h) => h.toString(16).padStart(6, "0");

/** Every taxonomy id a tag array / typed-answer list names, as a Set. */
function tagsOf(/** @type {any} */ it, /** @type {Record<string, any>} */ traps) {
  const out = new Set();
  const add = (/** @type {unknown} */ t) => {
    if (typeof t === "string" && traps[t]) out.add(t);
  };
  for (const t of Array.isArray(it?.tag) ? it.tag : [it?.tag]) add(t);
  for (const w of Array.isArray(it?.fw) ? it.fw : []) add(w?.tag);
  return out;
}

/** The traps a generator can produce, found by running it: levels x seeds x shapes. Cached per generator. */
function generatorTraps(
  /** @type {any} */ G,
  /** @type {string} */ g,
  /** @type {Record<string, any>} */ traps,
) {
  const def = G.registry[g];
  const found = new Set();
  if (!def) return found;
  const shapes = Array.isArray(def.shapes) && def.shapes.length ? def.shapes : ["forward"];
  for (let level = 1; level <= def.levels; level++)
    for (const shape of shapes)
      for (let seed = 1; seed <= GEN_SEEDS; seed++) {
        let item;
        try {
          item = G.make(g, level, seed, shape);
        } catch (_e) {
          continue;
        }
        for (const t of tagsOf(item, traps)) found.add(t);
      }
  return found;
}

/** @param {any} it @param {Record<string, any>} traps */
function hingeScore(it, traps) {
  if (it.k !== "mc" || it.viz || !Array.isArray(it.c) || !Array.isArray(it.tag)) return -1;
  if (it.c.length < 3 || it.c.length > 5 || it.tag.length !== it.c.length) return -1;
  if (PICTURE_WORDS.test([it.q, it.ctx, ...(it.work || [])].filter(Boolean).join(" "))) return -1;
  if (String(it.q).length > 220 || it.c.some((/** @type {any} */ c) => String(c).length > 70))
    return -1;
  const wrong = it.tag.filter(
    (/** @type {any} */ t, /** @type {number} */ i) => i !== it.a && t && traps[t],
  );
  const distinct = new Set(wrong).size;
  if (distinct < 2 || wrong.length !== it.c.length - 1) return -1;
  return distinct * 10 + (it.c.length === 4 ? 5 : 0) - String(it.q).length / 100;
}

/** The whole index as an object (pure: no file is written). */
export function buildIndex() {
  const worlds = JSON.parse(read("data/practice-studio/worlds.json"));
  const { traps } = JSON.parse(read("data/practice-studio/misconceptions.json"));
  const G = loadStudio({ gen: true }).StudioGen;
  /** @type {Map<string, Set<string>>} */
  const genCache = new Map();
  const genTraps = (/** @type {string} */ g) => {
    if (!genCache.has(g)) genCache.set(g, generatorTraps(G, g, traps));
    return /** @type {Set<string>} */ (genCache.get(g));
  };

  const hashes = /** @type {Record<string, string>} */ ({});
  const trapInfo = /** @type {Record<string, {n: string, fix: string}>} */ ({});
  for (const id of Object.keys(traps).sort()) {
    const h = hex(core.trapHash(id));
    if (hashes[h]) throw new Error(`trap hash collision: ${id} and ${hashes[h]} (${h})`);
    hashes[h] = id;
    trapInfo[id] = { n: traps[id].name, fix: traps[id].fix };
  }

  const ids = listLessonDirs({ filter: /^\d+-\d+$/ })
    .filter((id) => STUDIO_UNITS.includes(Number(id.split("-")[0])))
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
  const lessons = /** @type {Record<string, any>} */ ({});
  for (const id of ids) {
    const cfg = loadLessonConfig(id);
    const ld = JSON.parse(read(`data/practice-studio/${id}.json`));
    const built = buildSections(cfg, ld, worlds, id);
    const sizes = /** @type {Record<string, number[]>} */ ({});
    const refs = /** @type {Record<string, Record<string, any[]>>} */ ({});
    const hinge = /** @type {any[]} */ ([]);
    for (const mode of MODES) {
      const sections = typographizeItems(built.sections[mode]);
      sizes[mode] = sections.map((/** @type {any} */ s) => s.items.length);
      sections.forEach((/** @type {any} */ sec, /** @type {number} */ s) => {
        sec.items.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
          const where = it.id?.startsWith("mv-")
            ? "move"
            : it.k === "gen"
              ? "gen"
              : it.k === "pool"
                ? "pool"
                : "mc";
          /** @type {Set<string>} */
          let named = new Set();
          if (it.k === "gen") named = genTraps(it.g);
          else if (it.k === "pool")
            for (const p of sec.pool || []) for (const t of tagsOf(p, traps)) named.add(t);
          else named = tagsOf(it, traps);
          for (const t of named) {
            const list = ((refs[t] ||= {})[mode] ||= []);
            list.push([mode, s + 1, i + 1, where]);
          }
          const score = hingeScore(it, traps);
          if (score >= 0)
            hinge.push({
              score,
              mode,
              tab: s + 1,
              i: i + 1,
              id: it.id,
              q: it.q,
              ...(it.ctx ? { ctx: it.ctx } : {}),
              ...(Array.isArray(it.work) ? { work: it.work } : {}),
              c: it.c,
              a: it.a,
              tag: it.tag,
            });
        });
      });
    }
    /** @type {Record<string, any[]>} */
    const items = {};
    for (const t of Object.keys(refs).sort())
      items[t] = MODES.flatMap((m) =>
        (refs[t][m] || [])
          .sort(
            (a, b) =>
              KIND_RANK[/** @type {keyof typeof KIND_RANK} */ (a[3])] -
                KIND_RANK[/** @type {keyof typeof KIND_RANK} */ (b[3])] ||
              a[1] - b[1] ||
              a[2] - b[2],
          )
          .slice(0, REFS_PER_MODE),
      );
    lessons[id] = {
      title: cfg.title || id,
      sizes,
      items,
      hinge: hinge
        .sort((a, b) => b.score - a.score || a.tab - b.tab || a.i - b.i)
        .slice(0, HINGE_PER_LESSON)
        .map(({ score: _score, ...h }) => h),
    };
  }
  const u4 = Object.fromEntries(
    UNIT4.map(([id, p, c]) => [
      id,
      {
        title: loadLessonConfig(id).title || id,
        practice: `/math/unit-4/${p}/`,
        challenge: `/math/unit-4/${c}/`,
      },
    ]),
  );
  return { v: 1, traps: hashes, trapInfo, lessons, u4 };
}

/** One line per lesson and per trap, so a change reads in a diff. */
export function serialize(/** @type {any} */ index) {
  const lines = (/** @type {Record<string, any>} */ o) =>
    `{\n${Object.entries(o)
      .map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`)
      .join(",\n")}\n}`;
  return `{
${Object.entries(index)
  .map(
    ([k, v]) => `${JSON.stringify(k)}:${v && typeof v === "object" ? lines(v) : JSON.stringify(v)}`,
  )
  .join(",\n")}
}\n`;
}

function main() {
  const out = serialize(buildIndex());
  const path = join(REPO_ROOT, INDEX_PATH);
  if (process.argv.includes("--check")) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== out) {
      console.error(`Stale: ${INDEX_PATH}\nRun: node scripts/generate-hinge-index.mjs`);
      process.exitCode = 1;
    } else console.log(`${INDEX_PATH} is current.`);
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  if (!existsSync(path) || readFileSync(path, "utf8") !== out) writeFileSync(path, out);
  const index = JSON.parse(out);
  console.log(
    `Wrote ${INDEX_PATH}: ${Object.keys(index.traps).length} traps, ${Object.keys(index.lessons).length} lessons, ${
      Object.values(index.lessons).filter((/** @type {any} */ l) => l.hinge.length).length
    } with a hinge question, ${Math.round(out.length / 1024)} KB.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
