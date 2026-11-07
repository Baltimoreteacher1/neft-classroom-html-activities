// Grades 4-5 depth pass: the added 3-5 activities are built from specs, current on disk, and keep the lab's rules.
import assert from "node:assert/strict";
import test from "node:test";
import { mergeDomain, STRAND_SUFFIX, staleG45Files } from "./build-access-g45-content.mjs";
import { allActivities, CORE_DOMAINS, LEVEL_KEYS, loadBand } from "./lib/access-lab-content.mjs";

const specs = {};
for (const d of CORE_DOMAINS)
  specs[d] = (await import(`./access-early-content/g45-${d.toLowerCase()}.mjs`)).default;
const added = (d) => specs[d].map((s) => `g35-${s.id}`);
const bank = new Map(
  allActivities()
    .filter((x) => x.band === "3-5")
    .map((x) => [x.activity.id, x]),
);

test("the built 3-5 files match the specs and the build is idempotent", async () => {
  assert.deepEqual(await staleG45Files(), []);
  for (const d of CORE_DOMAINS) {
    const data = loadBand("3-5").find((f) => f.domain === d).data;
    assert.deepEqual(mergeDomain(data, d, specs[d]), data, `${d} merge is a no-op on built data`);
  }
});

test("every domain gained activities at every level, and every added id lives in the bank once", () => {
  for (const d of CORE_DOMAINS) {
    for (const lk of LEVEL_KEYS)
      assert.ok(specs[d].filter((s) => s.level === lk).length >= 4, `${d} ${lk} has added specs`);
    assert.equal(new Set(added(d)).size, specs[d].length, `${d} spec ids are unique`);
    for (const id of added(d)) assert.ok(bank.has(id), id);
  }
  const perDomain = CORE_DOMAINS.map(
    (d) => [...bank.values()].filter((x) => x.domain === d).length,
  );
  for (const n of perDomain) assert.ok(n >= 50, `3-5 domain has ${n} activities`);
});

test("added activities carry the contract fields and sit in a -g45 strand", () => {
  for (const d of CORE_DOMAINS)
    for (const id of added(d)) {
      const { activity: a, level } = bank.get(id);
      for (const f of [
        "title",
        "skill",
        "directions",
        "prompt",
        "hint",
        "correct",
        "support",
        "extension",
        "teacher",
        "wida",
      ])
        assert.ok(a[f], `${id} ${f}`);
      assert.ok(
        a.vocabulary.length >= 2 && a.vocabulary.every((v) => v[2]),
        `${id} Spanish glosses`,
      );
      const data = loadBand("3-5").find((f) => f.domain === d).data;
      const strand = data.levels[level].categories.find((c) => c.activityIds.includes(id));
      assert.ok(strand?.id.endsWith(STRAND_SUFFIX), `${id} has a strand`);
    }
});

test("added activities follow the house rules: no timers and no WIDA-level labels", () => {
  const clock = /\b(timer|countdown|stopwatch|seconds? left|race the clock|beat the clock)\b/i;
  for (const d of CORE_DOMAINS)
    for (const id of added(d)) {
      const a = bank.get(id).activity;
      const text = JSON.stringify([
        a.directions,
        a.prompt,
        a.hint,
        a.support,
        a.extension,
        a.passage,
      ]);
      assert.doesNotMatch(text, clock, id);
      assert.ok(
        !(a.wida || []).some((w) =>
          /\b(Entering|Emerging|Developing|Expanding|Bridging|Reaching)\b/.test(w),
        ),
        id,
      );
    }
});

test("selected-response answer keys are spread over the positions", () => {
  const pos = {};
  for (const d of CORE_DOMAINS)
    for (const id of added(d)) {
      const a = bank.get(id).activity;
      if (a.type !== "multipleChoice") continue;
      const i = a.options.findIndex((o) => o.id === a.answer);
      pos[i] = (pos[i] || 0) + 1;
      assert.equal(a.options.map((o) => o.id).join(""), "abcd".slice(0, a.options.length));
    }
  const total = Object.values(pos).reduce((x, y) => x + y, 0);
  assert.ok(total >= 12);
  for (const n of Object.values(pos))
    assert.ok(n / total < 0.5, `position skew ${JSON.stringify(pos)}`);
});

test("constructed tasks have three models with notes and at least three success criteria", () => {
  for (const d of ["Speaking", "Writing"])
    for (const id of added(d)) {
      const a = bank.get(id).activity;
      if (a.type !== "constructed") continue;
      assert.ok(a.successCriteria.length >= 3, id);
      for (const k of ["A", "B", "C"]) assert.ok(a.models[k] && a.modelNotes[k], `${id} ${k}`);
      assert.ok(a.models.A.length < a.models.C.length, `${id} models grow`);
    }
});

test("every added activity has Spanish in es-guide.json, with numbers and blanks kept", async () => {
  const guide = JSON.parse(
    (await import("node:fs")).readFileSync(
      new URL("../access-practice-lab/content/es-guide.json", import.meta.url),
      "utf8",
    ),
  ).activities;
  for (const d of CORE_DOMAINS)
    for (const id of added(d)) {
      const es = guide[id];
      assert.ok(es?.skill && es?.directions, id);
      const { directions } = bank.get(id).activity;
      for (const n of directions.match(/\d+/g) || [])
        assert.ok(es.directions.includes(n), `${id} ${n}`);
      assert.notEqual(es.directions, directions);
    }
});
