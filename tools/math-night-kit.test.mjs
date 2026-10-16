/* Family Math Night kit — the generated stations are real, current, bilingual and calm.
 *
 *   node --test tools/math-night-kit.test.mjs
 *
 * The kit is built by tools/generate-math-night-kit.mjs from pages that already
 * exist on the site, so these tests hold three things no other gate sees:
 * a station never points at a page that is not there, the QR on a printed sign
 * encodes exactly that page, and no sentence on a sign or in the script asks a
 * family for a timer, a score, a ranking or a winner.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import * as copy from "../curriculum/family-connections/math-night/math-night-copy.js";
import {
  buildAll,
  KIT_DIR,
  pageExists,
  qrPath,
  SITE,
  serialize,
  UNITS,
} from "./generate-math-night-kit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NIGHT_DIR = join(ROOT, "curriculum/family-connections/math-night");
const kits = buildAll();

/** Every { en, es } pair reachable from the copy module, with a path for messages. */
function pairs(value, path, out = []) {
  if (value && typeof value === "object") {
    if (typeof value.en !== "undefined" && typeof value.es !== "undefined") {
      out.push([path, value]);
      return out;
    }
    for (const [key, child] of Object.entries(value)) pairs(child, `${path}.${key}`, out);
  }
  return out;
}

const allPairs = Object.entries(copy)
  .filter(([name]) => name !== "UNIT_NAMES_ES")
  .flatMap(([name, value]) => pairs(value, name));

const text = (value) => (typeof value === "function" ? value(3, 6) : value);

test("the committed kit files are exactly what the generator writes", () => {
  for (const kit of kits) {
    const file = join(KIT_DIR, `unit-${kit.unit}.json`);
    assert.ok(
      existsSync(file),
      `unit-${kit.unit}.json is missing: run tools/generate-math-night-kit.mjs`,
    );
    assert.equal(readFileSync(file, "utf8"), serialize(kit), `unit-${kit.unit}.json is stale`);
  }
});

test("units 1-9 have a kit and the untaught Unit 10 does not", () => {
  assert.deepEqual(UNITS, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
  assert.equal(existsSync(join(KIT_DIR, "unit-10.json")), false);
});

test("every unit has six distinct stations, each on a page that exists", () => {
  for (const kit of kits) {
    assert.equal(kit.stations.length, 6, `unit ${kit.unit}`);
    assert.equal(
      new Set(kit.stations.map((s) => s.href)).size,
      6,
      `unit ${kit.unit} repeats a page`,
    );
    for (const s of kit.stations) {
      assert.ok(pageExists(s.href), `unit ${kit.unit}: ${s.href} is not a page on disk`);
      assert.ok(s.title.trim().length > 2, `unit ${kit.unit}: untitled station`);
      assert.ok(copy.ROLES[s.role], `unit ${kit.unit}: no copy for role ${s.role}`);
    }
  }
});

test("a unit's lab and studio stations teach that unit's own lessons", () => {
  const manifest = JSON.parse(
    readFileSync(join(ROOT, "data/curriculum-launch-manifest.json"), "utf8"),
  );
  const unitOf = new Map(manifest.lessons.map((l) => [l.id, l.unit]));
  for (const kit of kits) {
    for (const s of kit.stations) {
      for (const id of s.lessons)
        assert.equal(unitOf.get(id), kit.unit, `${s.title}: lesson ${id}`);
      if (s.kind === "studio") {
        assert.equal(s.lessons.length, 1);
        assert.equal(s.href, `/lessons/${s.lessons[0]}/homework.html?route=full`);
      }
    }
    for (const id of Object.keys(kit.lessonTitles)) {
      const t = kit.lessonTitles[id];
      assert.ok(t.en && t.es, `lesson ${id} needs English and Spanish titles`);
      assert.notEqual(t.en, t.es, `lesson ${id}: Spanish title is the English title`);
    }
  }
});

test("every printed QR encodes the absolute address of its own station", () => {
  for (const kit of kits) {
    for (const s of kit.stations) {
      assert.deepEqual(s.qr, qrPath(`${SITE}${s.href}`), `unit ${kit.unit}: ${s.href}`);
      const rows = [...s.qr.d.matchAll(/M(\d+) (\d+)h(\d+)v1/g)];
      // A QR symbol has a 7-module finder square in three corners; the top-left
      // one starts after the 4-module quiet zone and is dark along its first row.
      const top = rows.filter((m) => Number(m[2]) === 4);
      assert.ok(
        top.some((m) => Number(m[1]) === 4 && Number(m[3]) >= 7),
        "no finder pattern",
      );
      assert.ok(s.qr.size >= 25 + 8, "QR is too small to be a real symbol");
    }
  }
});

test("every sentence exists in English and Spanish, and Spanish is not the English", () => {
  assert.ok(allPairs.length > 60, "the copy sweep found almost nothing");
  for (const [path, pair] of allPairs) {
    const en = text(pair.en);
    const es = text(pair.es);
    assert.equal(typeof en, "string", path);
    assert.ok(en.trim().length > 0 && es.trim().length > 0, `${path} is empty`);
    assert.notEqual(en.trim(), es.trim(), `${path}: Spanish equals English`);
  }
  for (const unit of UNITS) assert.ok(copy.UNIT_NAMES_ES[unit], `no Spanish name for unit ${unit}`);
});

test("calm and untimed: nothing asks for a timer, a score, a ranking or a winner", () => {
  const ban =
    /\b(timer|timers|timed|countdown|stopwatch|leaderboard|leaderboards|rank|ranking|winner|winners|race|points|score|scores|puntaje|puntajes|cron[óo]metro|cron[óo]metros|ganador|ganadores|clasificaci[óo]n|posiciones|carrera)\b/i;
  const negated = /\b(no|not|nobody|never|without|sin|nadie|ni)\b/i;
  for (const [path, pair] of allPairs) {
    for (const lang of ["en", "es"]) {
      const s = text(pair[lang]);
      if (ban.test(s))
        assert.ok(
          negated.test(s),
          `${path}.${lang} mentions a banned idea without refusing it: "${s}"`,
        );
    }
  }
  for (const s of copy.RUN_OF_SHOW) assert.ok(s.minutes > 0);
  assert.equal(
    copy.RUN_OF_SHOW.reduce((sum, s) => sum + s.minutes, 0),
    60,
    "the run of show must add up to 60 minutes",
  );
  assert.equal(copy.RUN_OF_SHOW.at(-1).start + copy.RUN_OF_SHOW.at(-1).minutes, 60);
});

test("the page prints sheets, inserts nothing as HTML, and has no third-party code", () => {
  const html = readFileSync(join(NIGHT_DIR, "index.html"), "utf8");
  const js = readFileSync(join(NIGHT_DIR, "math-night.js"), "utf8");
  const css = readFileSync(join(NIGHT_DIR, "math-night.css"), "utf8");
  assert.match(html, /<html lang="en">/);
  assert.match(html, /class="skip-link"/);
  assert.doesNotMatch(html, /<script[^>]+src="https?:/i);
  assert.doesNotMatch(js, /innerHTML|insertAdjacentHTML|document\.write/);
  assert.match(css, /@media print/);
  assert.match(css, /break-after:\s*page/);
  assert.match(css, /@page\s*\{[^}]*letter/i);
});
