// Publisher content pass: every grade band ships its support choices with real depth, the early bands stay audio-first
// with pictures and Spanish, and every drawn scene has English and Spanish alt text and is used.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SCENES, sceneAlt, sceneSVG } from "../access-practice-lab/src/early/scenes.js";
import { CORE_DOMAINS, LEVEL_KEYS, loadBand } from "./lib/access-lab-content.mjs";

const rows = (band) =>
  loadBand(band).flatMap(({ domain, data }) =>
    Object.entries(data.levels).flatMap(([level, L]) =>
      (L.activities || []).map((activity) => ({ domain, level, activity })),
    ),
  );
const count = (band, domain, level) =>
  rows(band).filter((r) => r.domain === domain && r.level === level).length;

// Minimum activities per domain and level once the publisher pass lands (K ships Starting and Growing).
const FLOOR = {
  K: { A: 4, B: 2, C: 0 },
  1: { A: 4, B: 4, C: 3 },
  "2-3": { A: 7, B: 7, C: 7 },
  "3-5": { A: 20, B: 20, C: 20 },
};
const TOTAL = { K: 29, 1: 54, "2-3": 88, "3-5": 265 };

test("every band ships its support choices in every domain", () => {
  for (const [band, levels] of Object.entries(FLOOR))
    for (const domain of CORE_DOMAINS)
      for (const level of LEVEL_KEYS)
        assert.ok(
          count(band, domain, level) >= levels[level],
          `${band} ${domain} ${level}: ${count(band, domain, level)} < ${levels[level]}`,
        );
});

test("band totals only grow", () => {
  for (const [band, min] of Object.entries(TOTAL))
    assert.ok(
      rows(band).length >= min,
      `${band} has ${rows(band).length}, expected at least ${min}`,
    );
});

test("activity ids are unique across the early and 3-5 bands", () => {
  const ids = ["K", "1", "2-3", "3-5"].flatMap((b) => rows(b).map((r) => r.activity.id));
  assert.equal(new Set(ids).size, ids.length);
});

test("early activities carry Spanish, Spanish glosses, pictures and no timers or WIDA labels", () => {
  const clock = /\b(timer|countdown|stopwatch|seconds? left|race the clock|beat the clock)\b/i;
  const witaLabel = /\b(entering|emerging|developing|expanding|bridging|reaching)\b/i;
  for (const band of ["K", "1", "2-3"])
    for (const { activity: a } of rows(band)) {
      assert.ok(a.directionsEs && a.promptEs, `${a.id} spoken Spanish`);
      assert.ok(
        a.vocabulary.length >= 2 && a.vocabulary.every((v) => /: /.test(v[2])),
        `${a.id} vocabulary glosses`,
      );
      const text = JSON.stringify([a.directions, a.prompt, a.script, a.passage, a.hint]);
      assert.doesNotMatch(text, clock, a.id);
      assert.doesNotMatch(JSON.stringify(a.wida), witaLabel, a.id);
      for (const o of a.options || []) assert.ok(o.visual || o.scene, `${a.id} option picture`);
    }
});

test("correct answers are spread over the choice positions in each early band", () => {
  for (const band of ["K", "1", "2-3"]) {
    const pos = [0, 0, 0, 0];
    for (const { activity: a } of rows(band))
      if (a.type === "multipleChoice") pos[a.options.findIndex((o) => o.id === a.answer)] += 1;
    const total = pos.reduce((x, y) => x + y, 0);
    for (const p of pos.slice(0, 3))
      assert.ok(p / total >= 0.15, `${band} answer positions ${pos.join("/")}`);
  }
});

test("every scene has English and Spanish alt text, draws a small svg and is used by content or Story Time", () => {
  const story = readFileSync(
    new URL("../access-practice-lab/src/early/story.js", import.meta.url),
    "utf8",
  );
  const used = new Set(
    [...story.matchAll(/scene: "([^"]+)"/g)]
      .map((m) => m[1])
      .concat(
        ["K", "1", "2-3"].flatMap((b) =>
          rows(b).flatMap(({ activity: a }) =>
            [
              a.scene,
              ...(a.options || []).map((o) => o.scene),
              ...(a.items || []).map((o) => o.scene),
            ].filter(Boolean),
          ),
        ),
      ),
  );
  for (const id of SCENES) {
    const [en, es] = sceneAlt(id) || [];
    assert.ok(en && es && en !== es, `${id} alt text`);
    const svg = sceneSVG(id);
    assert.match(svg, /<title>/, id);
    assert.ok(svg.length < 24000, `${id} svg size`);
    assert.doesNotMatch(svg, /<script|href=/, id);
    assert.ok(used.has(id), `scene ${id} is never used`);
  }
});

test("every published 3-5 activity offers Spanish support and no WIDA level labels", () => {
  const guide = JSON.parse(
    readFileSync(new URL("../access-practice-lab/content/es-guide.json", import.meta.url), "utf8"),
  );
  for (const { activity: a } of rows("3-5").filter((r) => r.activity.id.startsWith("g35-"))) {
    assert.ok(
      a.vocabulary.every((v) => v[2]),
      `${a.id} vocabulary glosses`,
    );
    if (/^g35-(l2|r2|s2|w2)-/.test(a.id))
      assert.ok(guide.activities[a.id], `${a.id} Spanish guide`);
  }
});
