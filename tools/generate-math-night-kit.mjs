#!/usr/bin/env node
/**
 * generate-math-night-kit.mjs — builds the data behind /curriculum/family-connections/math-night/.
 *
 *   node tools/generate-math-night-kit.mjs           write kit/unit-N.json for units 1-9
 *   node tools/generate-math-night-kit.mjs --check   fail if any file is stale (writes nothing)
 *
 * A Family Math Night has six stations per unit, and every station is an
 * EXISTING page on the site, found where the site already records it:
 *   - games      the cards on math/games/index.html, whose kicker names the unit
 *   - labs       data/learning-labs.json
 *   - studios    each lesson's Family Math Studio (lessons/<id>/homework.html?route=full)
 *                from data/curriculum-launch-manifest.json
 * No title, link or unit assignment is typed in here. Each station carries a QR
 * code made by the engine's own qr-mini.js, stored as one compact SVG path
 * (the engine folder is not served, so the browser cannot run it).
 *
 * Unit 10 is not taught and is skipped.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { qrSvg } from "@eduwonderlab/engine/core/qr-mini.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const KIT_DIR = join(ROOT, "curriculum/family-connections/math-night/kit");
export const SITE = "https://eduwonderlab.com";
export const UNITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

/** A site path that exists on disk as a page or a folder with an index. */
export function pageExists(href) {
  const path = href.split(/[?#]/)[0].replace(/^\//, "");
  const abs = join(ROOT, path);
  return existsSync(abs.endsWith("/") || !path.includes(".") ? join(abs, "index.html") : abs);
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

/** Every game card on the games hub that names a unit in its kicker. */
export function gamesByUnit() {
  const html = readFileSync(join(ROOT, "math/games/index.html"), "utf8");
  const byUnit = new Map();
  const card = /<a class="activity-card"([^>]*?)href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const m of html.matchAll(card)) {
    const [, attrs, href, body] = m;
    const category = /data-category="([^"]+)"/.exec(attrs)?.[1];
    if (category !== "unit-games" && category !== "flagship") continue;
    const unit = Number(/>\s*Unit (\d+) ·/.exec(body)?.[1]);
    const h3 = /<h3[^>]*>([\s\S]*?)<\/h3>/.exec(body)?.[1] || "";
    // "<span>Wildlife Signal</span><span>📊</span> Data Dash": the game's own name is
    // the text outside the spans (the world label and the icon are spans).
    const title = decodeEntities(h3.replace(/<span[^>]*>[\s\S]*?<\/span>/g, " "))
      .replace(/[^\p{L}\p{N}&':!?\- ]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!unit || !title || !pageExists(href)) continue;
    if (!byUnit.has(unit)) byUnit.set(unit, []);
    byUnit.get(unit).push({ href, title, category });
  }
  // Skill games first, then adventure games; the hub's own order within each.
  for (const list of byUnit.values()) {
    list.sort((a, b) => (a.category === b.category ? 0 : a.category === "unit-games" ? -1 : 1));
  }
  return byUnit;
}

/** One QR as a single SVG path on a 1-unit-per-module grid (quiet zone included). */
export function qrPath(text) {
  const margin = 4;
  const probe = qrSvg(text, { size: 100, margin: 0 });
  const cell = Number(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)"/.exec(probe)?.[1]);
  const modules = Math.round(100 / cell);
  const size = modules + margin * 2;
  const svg = qrSvg(text, { size, margin });
  const rows = new Map();
  for (const m of svg.matchAll(/<rect x="([\d.]+)" y="([\d.]+)" width="1" height="1"/g)) {
    const y = Math.round(Number(m[2]));
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y).push(Math.round(Number(m[1])));
  }
  let d = "";
  for (const y of [...rows.keys()].sort((a, b) => a - b)) {
    const xs = rows.get(y).sort((a, b) => a - b);
    for (let i = 0; i < xs.length; ) {
      let j = i;
      while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1) j += 1;
      d += `M${xs[i]} ${y}h${j - i + 1}v1h-${j - i + 1}z`;
      i = j + 1;
    }
  }
  return { size, d };
}

function station(role, kind, title, href, lessons) {
  return { role, kind, title, href, qr: qrPath(`${SITE}${href}`), lessons };
}

export function buildUnit(unit, ctx) {
  const lessons = ctx.lessons.filter((l) => l.unit === unit);
  const labs = ctx.labs.filter((l) => l.unit === unit && pageExists(l.href));
  const arcade = { href: `/math/games/practice-arcade/?unit=${unit}`, title: "Practice Arcade" };
  const games = [...(ctx.games.get(unit) || [])];
  const gameSlots = [...games, arcade];
  const studios = lessons.filter((l) => l.resources.homework && pageExists(l.resources.homework));
  if (gameSlots.length < 1 || labs.length < 2 || studios.length < 2) {
    throw new Error(`Unit ${unit}: not enough existing pages for six stations`);
  }
  const studioA = studios[0];
  const studioB = studios[Math.floor(studios.length / 2)];
  const studioHref = (l) => `${l.resources.homework}?route=full`;
  const second = gameSlots[1]
    ? { kind: "game", title: gameSlots[1].title, href: gameSlots[1].href, lessons: [] }
    : { kind: "tool", title: "Math Workbench", href: "/curriculum/math-workbench/", lessons: [] };

  const stations = [
    station("game", "game", gameSlots[0].title, gameSlots[0].href, []),
    station(
      "lab",
      "lab",
      labs[0].title,
      labs[0].href,
      labs[0].lessons.filter((id) => lessons.some((l) => l.id === id)),
    ),
    station("studio", "studio", studioA.title, studioHref(studioA), [studioA.id]),
    station(second.kind === "game" ? "game" : "build", second.kind, second.title, second.href, []),
    station(
      "lab",
      "lab",
      labs[1].title,
      labs[1].href,
      labs[1].lessons.filter((id) => lessons.some((l) => l.id === id)),
    ),
    station("studio", "studio", studioB.title, studioHref(studioB), [studioB.id]),
  ];
  for (const s of stations) {
    if (!pageExists(s.href)) throw new Error(`Unit ${unit}: ${s.href} does not exist`);
  }
  const used = new Set(stations.flatMap((s) => s.lessons));
  const lessonTitles = Object.fromEntries(
    lessons
      .filter((l) => used.has(l.id))
      .map((l) => [l.id, { en: l.title, es: ctx.titlesEs[l.id] || "" }]),
  );
  return {
    schema: 1,
    unit,
    unitName: labs[0].unitName,
    lessonTitles,
    stations,
  };
}

export function buildAll() {
  const ctx = {
    lessons: readJson("data/curriculum-launch-manifest.json").lessons,
    labs: readJson("data/learning-labs.json").labs,
    titlesEs: readJson("data/family-homework-titles-es.json"),
    games: gamesByUnit(),
  };
  return UNITS.map((unit) => buildUnit(unit, ctx));
}

export function serialize(kit) {
  return `${JSON.stringify(kit)}\n`;
}

function main() {
  const check = process.argv.includes("--check");
  mkdirSync(KIT_DIR, { recursive: true });
  const stale = [];
  for (const kit of buildAll()) {
    const file = join(KIT_DIR, `unit-${kit.unit}.json`);
    const next = serialize(kit);
    const have = existsSync(file) ? readFileSync(file, "utf8") : "";
    if (have === next) continue;
    stale.push(file);
    if (!check) writeFileSync(file, next);
  }
  if (check && stale.length) {
    console.error(
      `math-night kit is stale (${stale.length} file(s)); run node tools/generate-math-night-kit.mjs`,
    );
    process.exit(1);
  }
  console.log(check ? "math-night kit is fresh" : `math-night kit: wrote ${stale.length} file(s)`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
