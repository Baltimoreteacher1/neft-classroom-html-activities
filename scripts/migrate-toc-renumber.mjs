#!/usr/bin/env node
// One-shot migration: renumber every lesson to the publisher's TOC.
//
//   node scripts/migrate-toc-renumber.mjs --dry-run
//   node scripts/migrate-toc-renumber.mjs
//
// Map lives in data/toc-migration.json. Moves go through a temp namespace
// because the map contains swaps (5-2 <-> 5-3): renaming in place would have
// the first move clobber the second's source.
//
// Companions (-group1/-group2/-catchup) travel with their base lesson, and
// their configs carry the base id inside their own lessonId, so both the
// directory name and the id field are rewritten.

import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");
const DRY = process.argv.includes("--dry-run");

const map = JSON.parse(readFileSync(join(ROOT, "data/toc-migration.json"), "utf8"));

const SUFFIXES = ["", "-group1", "-group2", "-catchup"];
const TEMP = "__mig__";

function git(...args) {
  if (DRY) return "";
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" });
}

function log(...a) {
  console.log(DRY ? "[dry]" : "[run]", ...a);
}

/** Rewrite the identity fields inside a lesson (or companion) config. */
function rewriteConfig(dir, newId, newUnit, newLesson) {
  const p = join(dir, "config.json");
  if (!existsSync(p)) return false;
  const cfg = JSON.parse(readFileSync(p, "utf8"));
  cfg.lessonId = newId;
  cfg.unit = newUnit;
  cfg.lesson = newLesson;
  if (DRY) return true;
  writeFileSync(p, `${JSON.stringify(cfg, null, 2)}\n`);
  return true;
}

const moves = map.moves.filter((m) => m.from !== m.to);
const [unitOf, lessonOf] = [(id) => Number(id.split("-")[0]), (id) => Number(id.split("-")[1])];

// Occupancy has to be tracked, not probed: a --dry-run performs no renames, so
// every source dir is still on disk and existsSync() would report a collision
// for each lesson whose slot is vacated later in the same run.
const occupied = new Set(readdirSync(LESSONS));
const vacate = (name) => occupied.delete(name);
const claim = (name) => {
  if (occupied.has(name)) {
    console.error(`FATAL: target lessons/${name} is occupied — map is not collision-free`);
    process.exit(1);
  }
  occupied.add(name);
};

// ---- phase 1: everything that moves goes to a temp name ----
const parked = [];
for (const mv of moves) {
  for (const sfx of SUFFIXES) {
    const src = join(LESSONS, mv.from + sfx);
    if (!existsSync(src)) continue;
    const tmp = join(LESSONS, TEMP + mv.to + sfx);
    log(`park ${mv.from}${sfx} -> ${TEMP}${mv.to}${sfx}`);
    git("mv", src, tmp);
    vacate(mv.from + sfx);
    parked.push({ tmp, final: join(LESSONS, mv.to + sfx), id: mv.to + sfx, to: mv.to });
  }
}

// ---- phase 2: temp -> final, and rewrite identity ----
for (const p of parked) {
  claim(p.id);
  log(`place ${p.id}`);
  git("mv", p.tmp, p.final);
  rewriteConfig(DRY ? p.tmp : p.final, p.id, unitOf(p.to), lessonOf(p.to));
}

// ---- phase 3: promote parked incoming configs into their book slots ----
for (const promo of map.promotions) {
  const dest = join(LESSONS, promo.to);
  claim(promo.to);
  log(`promote ${promo.source} -> lessons/${promo.to}/config.json`);
  if (DRY) continue;
  const cfg = JSON.parse(readFileSync(join(ROOT, promo.source), "utf8"));
  cfg.lessonId = promo.to;
  cfg.unit = unitOf(promo.to);
  cfg.lesson = lessonOf(promo.to);
  execFileSync("mkdir", ["-p", dest]);
  writeFileSync(join(dest, "config.json"), `${JSON.stringify(cfg, null, 2)}\n`);
  git("rm", "-q", promo.source);
}

// ---- report ----
const dirs = readdirSync(LESSONS).filter((d) => /^\d+-\d+$/.test(d));
log(`done. ${moves.length} lessons renumbered, ${map.promotions.length} promoted.`);
log(`lessons/ now holds ${dirs.length} canonical lesson dirs.`);
const leftover = readdirSync(LESSONS).filter((d) => d.startsWith(TEMP));
if (leftover.length) {
  console.error(`FATAL: ${leftover.length} temp dirs left behind:`, leftover.join(", "));
  process.exit(1);
}
