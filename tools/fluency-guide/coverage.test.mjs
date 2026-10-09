// Every taught lesson in the curriculum manifest has Fluency Studio coverage.
// Unit 10 is not taught (Joel, 2026-10-07), so it is the only exclusion.
// Run: node --test tools/fluency-guide/coverage.test.mjs
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { workshops } from "./workshop-bank.mjs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const manifest = JSON.parse(read("../../data/curriculum-manifest.json"));
const taught = manifest.lessons.filter((l) => Number(l.unit) !== 10).map((l) => l.id);
const core = JSON.parse(read("./src/data/curriculum.core.json"));
const practice = JSON.parse(read("./src/data/practice.json"));
const enrich = Object.assign(
  {},
  ...core.units.map((u) => JSON.parse(read(`./src/data/enrich-unit-${u.number}.json`))),
);

export function missingCoverage(ids, sources) {
  return ids.flatMap((id) =>
    Object.entries(sources)
      .filter(([, has]) => !has(id))
      .map(([name]) => `${id}: no ${name}`),
  );
}

const lessonIds = new Set(core.units.flatMap((u) => u.lessons.map((l) => l.id)));
const sources = {
  "core lesson": (id) => lessonIds.has(id),
  "prerequisite practice": (id) => Array.isArray(practice[id]) && practice[id].length === 4,
  enrichment: (id) => Boolean(enrich[id]),
  workshop: (id) => Boolean(workshops[id]),
};

test("the detector reports a lesson with no studio entry", () => {
  assert.deepEqual(missingCoverage(["99-1"], sources), [
    "99-1: no core lesson",
    "99-1: no prerequisite practice",
    "99-1: no enrichment",
    "99-1: no workshop",
  ]);
});

test("every taught manifest lesson has studio coverage, and nothing else does", () => {
  assert.ok(taught.length >= 78, `manifest lists ${taught.length} taught lessons`);
  assert.deepEqual(missingCoverage(taught, sources), []);
  assert.deepEqual(
    [...lessonIds].filter((id) => !taught.includes(id)),
    [],
    "studio lessons must be taught manifest lessons (no Unit 10)",
  );
});

test("the published student index renders a card for every taught lesson", () => {
  const html = read("../../curriculum/fluency/index.html");
  const cards = new Set(
    [...html.matchAll(/class="fluency-lesson-card" id="lesson-([\d-]+)"/g)].map((m) => m[1]),
  );
  assert.deepEqual(
    taught.filter((id) => !cards.has(id)),
    [],
    "regenerate with node tools/fluency-guide/build.mjs",
  );
});

test("the studio build validates its data", () => {
  execFileSync(process.execPath, [new URL("./build.mjs", import.meta.url).pathname, "--check"], {
    stdio: "pipe",
  });
});
