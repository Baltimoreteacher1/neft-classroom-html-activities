// Class Pulse teacher page: reading pasted codes, the pull list, the heat table, the three groups, hinge cards, and the generated
// index that ties a trap hash to a name and a place in a studio.
//   node teacher-tools/class-pulse/class-pulse.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import { buildIndex, INDEX_PATH, serialize } from "../../scripts/generate-hinge-index.mjs";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import {
  analyze,
  cardLessons,
  hingeCard,
  MAX_CODES,
  parseCodes,
  practiceLinks,
  studioHref,
} from "./analysis.mjs";

const ctx = {};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(readFileSync(join(REPO_ROOT, "assets/studio/pulse-core.js"), "utf8"), ctx);
const raw = ctx.StudioPulseCore;
const plain = (x) => JSON.parse(JSON.stringify(x));
const core = { ...raw, decode: (s) => plain(raw.decode(s)) };

const read = (rel) => readFileSync(join(REPO_ROOT, rel), "utf8");

/* ---- the generated index is current and sound ------------------------------------------------------------------ */
const built = buildIndex();
assert.equal(read(INDEX_PATH), serialize(built), `${INDEX_PATH} is stale: run node scripts/generate-hinge-index.mjs`);
const index = JSON.parse(read(INDEX_PATH));
const { traps } = JSON.parse(read("data/practice-studio/misconceptions.json"));
assert.equal(Object.keys(index.traps).length, Object.keys(traps).length, "every trap has a hash entry");
for (const [hex, id] of Object.entries(index.traps)) {
  assert.equal(raw.trapHash(id), Number.parseInt(hex, 16), `${id}: the hash in the index is the one the code carries`);
  assert.ok(index.trapInfo[id].n && index.trapInfo[id].fix, `${id}: name and quick fix`);
}
const lessonIds = Object.keys(index.lessons);
assert.ok(lessonIds.length >= 60, `index covers the generated studios (${lessonIds.length})`);
let placed = 0;
for (const id of lessonIds) {
  const L = index.lessons[id];
  for (const mode of ["practice", "challenge"]) assert.equal(L.sizes[mode].length, 5, `${id} ${mode}: five sections`);
  for (const [trap, refs] of Object.entries(L.items)) {
    assert.ok(traps[trap], `${id}: ${trap} is a real trap`);
    for (const [mode, tab, i] of refs) {
      assert.ok(L.sizes[mode], `${id}: mode ${mode}`);
      assert.ok(tab >= 1 && tab <= 5 && i >= 1 && i <= L.sizes[mode][tab - 1], `${id} ${trap}: ${mode} section ${tab} problem ${i} exists`);
      placed++;
    }
  }
  assert.ok(L.hinge.length >= 1 && L.hinge.length <= 3, `${id}: has a hinge question`);
  for (const h of L.hinge) {
    assert.ok(h.c.length >= 3 && h.c.length <= 5);
    assert.equal(h.tag.length, h.c.length);
    assert.ok(!h.tag[h.a], `${id}: the right choice names no trap`);
    h.c.forEach((_c, k) => k !== h.a && assert.ok(traps[h.tag[k]], `${id}: choice ${k} names a real trap`));
    assert.ok(new Set(h.tag.filter(Boolean)).size >= 2, `${id}: at least two different traps among the wrong choices`);
    assert.ok(L.sizes[h.mode][h.tab - 1] >= h.i, `${id}: hinge source exists`);
  }
}
assert.ok(placed > 500, `trap placements (${placed})`);
for (const [id, u] of Object.entries(index.u4)) assert.ok(u.practice.startsWith("/math/unit-4/") && u.challenge.includes("challenging"), id);
assert.deepEqual(Object.keys(index.u4), ["4-1", "4-2", "4-3", "4-4", "4-5"]);

/* ---- a small class ---------------------------------------------------------------------------------------------- */
const L1 = "2-1";
const L2 = "6-4";
const trapsOf = (l) => Object.keys(index.lessons[l].items);
const [a, b, c] = trapsOf(L1);
const [x] = trapsOf(L2);
const mk = (lesson, extra) => raw.encode({ lesson, mode: "practice", done: [3, 3, 3, 3, 3], clean: 10, assisted: 4, guessed: 0, ...extra });
const codes = [
  mk(L1, { traps: [{ id: a, n: 3 }, { id: b, n: 1 }] }),
  mk(L1, { traps: [{ id: a, n: 2 }], certain: 2, focus: [{ kind: "certain", tab: 2, i: 2 }] }),
  mk(L1, { traps: [{ id: c, n: 4 }], guessed: 2, fTeacher: 1, focus: [{ kind: "teacher", tab: 3, i: 1 }, { kind: "guessed", tab: 2, i: 1 }] }),
  mk(L2, { traps: [{ id: x, n: 5 }], seals: [1, 0, 0] }),
  mk(L2, {}),
];
const text = [
  codes[0],
  "  ",
  `Class code: ${codes[1].toLowerCase()}`,
  "Ask at home: Can you explain this idea to me in your own words?",
  codes[2],
  codes[3],
  codes[4],
  codes[0], // pasted twice
  `${codes[1].slice(0, 20)}Z${codes[1].slice(21)}`, // a typo
].join("\n");
const parsed = parseCodes(text, core.decode);
assert.equal(parsed.entries.length, 5, "five students read");
assert.deepEqual(parsed.entries.map((e) => e.n), [1, 2, 3, 4, 5], "students are numbered by paste order");
assert.equal(parsed.ignored, 1, "prose is skipped, not reported as a bad code");
assert.deepEqual(parsed.problems.map((p) => [p.line, p.error]), [[8, "duplicate"], [9, "checksum"]], "a duplicate and a typo are named by line");
assert.ok(parsed.problems.every((p) => p.message.length > 10));

const r = analyze(parsed.entries, index);
assert.equal(r.students.length, 5);
assert.deepEqual(r.lessons, [L2, L1].sort((p, q) => p.localeCompare(q, "en", { numeric: true })));
const top = r.pull[0];
assert.equal(top.id, a, "the trap two students share leads the pull list");
assert.deepEqual(top.students.map((s) => s.n), [1, 2]);
assert.equal(top.misses, 5);
assert.ok(top.fix && top.name);
assert.ok(top.links.length >= 1 && top.links.every((l) => l.href.startsWith(`/math/practice-studio/${L1}/`) && /[?&]s=\d&i=\d+/.test(l.href)), "a pull list item links to ?s=<section>&i=<problem>");
assert.equal(r.pull.filter((g) => g.students.length === 1).length, r.pull.length - 1);
assert.deepEqual(r.groups.certain.map((g) => [g.n, g.count]), [[2, 2]]);
assert.deepEqual(r.groups.eliminated.map((g) => [g.n, g.count]), [[3, 2]]);
assert.deepEqual(r.groups.teacher.map((g) => [g.n, g.count]), [[3, 1]]);
assert.equal(r.groups.teacher[0].places[0].href, `/math/practice-studio/${L1}/?s=3&i=1`);
assert.equal(r.groups.certain[0].places[0].kind, "certain");
assert.deepEqual(r.quiet, [5], "a student with nothing to flag is quiet");
const heat1 = r.heat.find((h) => h.lesson === L1);
assert.equal(heat1.students, 3);
assert.equal(heat1.rows[0].id, a);
assert.equal(heat1.rows[0].students, 2);
assert.equal(heat1.max, 5);
assert.equal(r.students[0].total, index.lessons[L1].sizes.practice.reduce((p, q) => p + q, 0));

// an unknown trap hash is counted, never invented
const stray = analyze(parseCodes(mk(L1, { traps: [{ h: 0xabcdef, n: 2 }] }), core.decode).entries, index);
assert.equal(stray.unknownTraps, 1);
assert.equal(stray.pull.length, 0);
// no index at all still reads the codes
const bare = analyze(parsed.entries, null);
assert.equal(bare.students.length, 5);
assert.equal(bare.pull.length, 0);

// a Unit 4 student links to the page, and has no clean/assisted/guessed to report
const u4 = analyze(parseCodes(raw.encode({ lesson: "4-2", mode: "challenge", u4: true, done: [2, 2, 2, 2, 2], traps: [{ id: a, n: 1 }] }), core.decode).entries, index);
assert.equal(u4.students[0].u4, true);
assert.equal(u4.pull[0].links[0].href, index.u4["4-2"].challenge);

// links
assert.equal(studioHref("2-1", "practice", 3, 2, index), "/math/practice-studio/2-1/?s=3&i=2");
assert.equal(studioHref("2-1", "challenge", 4, 1, index), "/math/practice-studio/2-1/challenge/?s=4&i=1");
assert.equal(studioHref("4-1", "practice", 0, 0, index), "/math/unit-4/percent-practice-studio/");
assert.equal(practiceLinks(index, "9-9", "practice", a).length, 0);

// the cap
const many = Array.from({ length: MAX_CODES + 5 }, (_, k) => mk(L1, { clean: k % 100 })).join("\n");
const capped = parseCodes(many, core.decode);
assert.equal(capped.entries.length, MAX_CODES);
assert.equal(capped.over, true);

/* ---- hinge cards ------------------------------------------------------------------------------------------------ */
assert.ok(cardLessons(index).length >= 60);
for (const id of cardLessons(index)) {
  const card = hingeCard(index, id);
  assert.ok(card.options.length >= 3, id);
  assert.equal(card.options.filter((o) => o.correct).length, 1, `${id}: one correct option`);
  for (const o of card.options) {
    assert.ok(o.correct ? o.trap === null : o.trap?.name && o.trap.fix, `${id} ${o.letter}: a wrong option names its trap`);
  }
  assert.deepEqual(card.options.map((o) => o.letter), ["A", "B", "C", "D", "E"].slice(0, card.options.length));
  assert.equal(hingeCard(index, id, card.of).which, 0, `${id}: "another question" wraps`);
}
assert.equal(hingeCard(index, "1-1"), null);
console.log(`class pulse: OK (${lessonIds.length} lessons, ${placed} trap placements, ${cardLessons(index).length} hinge cards)`);
