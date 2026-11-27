#!/usr/bin/env node
// tools/curriculum-find-plan.test.mjs — "Plan a set", "My practice path" and collections on /curriculum/find/.
//
// The engine (curriculum/find/plan-engine.js) is checked against the REAL index for every lesson and purpose: each
// assertion is something that must be true of any set (a pick fits its slot, sits in the ring it claims, no resource
// twice, a student step opens online) rather than one ranking. collections.js is checked with an in-memory Storage,
// including hostile share links.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as C from "../curriculum/find/collections.js";
import { search } from "../curriculum/find/find-engine.js";
import {
  applySwaps,
  buildSet,
  lessons,
  nextLesson,
  PATH_SLOTS,
  PURPOSES,
  resolveTarget,
  TOPICS,
} from "../curriculum/find/plan-engine.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const index = JSON.parse(readFileSync(join(root, "data/curriculum-find-index.json"), "utf8"));
const byPath = new Map(index.docs.map((d) => [d.p, d]));
let passed = 0;
const test = (name, fn) => {
  try {
    fn();
    passed++;
  } catch (e) {
    console.error(`✗ ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
};
const memory = () => {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    dump: m,
  };
};
const ALL = lessons(index);

/* ---------- targets ---------- */
test("84 course lessons, in course order, each resolvable", () => {
  assert.equal(ALL.length, 84);
  assert.equal(ALL[0].id, "1-1");
  for (let i = 1; i < ALL.length; i++) {
    const [au, an] = ALL[i - 1].id.split("-").map(Number);
    const [bu, bn] = ALL[i].id.split("-").map(Number);
    assert.ok(au < bu || (au === bu && an < bn), `${ALL[i - 1].id} before ${ALL[i].id}`);
  }
  for (const l of ALL) assert.equal(resolveTarget(index, l.id)?.lesson, l.id);
  assert.equal(nextLesson(index, "3-4").id, "3-5");
  assert.equal(nextLesson(index, ALL.at(-1).id), null);
});
test("targets: lessons, standards and topics resolve; anything else is null", () => {
  assert.equal(resolveTarget(index, "s:6.AT.4").kind, "standard");
  assert.equal(resolveTarget(index, "t:ratios").kind, "topic");
  for (const t of Object.keys(TOPICS)) assert.ok(resolveTarget(index, `t:${t}`), t);
  for (const bad of ["", "99-99", "s:NOPE", "t:alchemy", "<script>", null])
    assert.equal(resolveTarget(index, bad), null, String(bad));
  assert.equal(buildSet(index, "6-6", "teleport"), null);
});

/* ---------- every set, every lesson ---------- */
const sets = [];
for (const l of ALL) {
  for (const p of Object.keys(PURPOSES)) sets.push([l.id, p, buildSet(index, l.id, p)]);
  sets.push([l.id, "path", buildSet(index, l.id, "path")]);
}
for (const t of Object.keys(TOPICS))
  for (const p of Object.keys(PURPOSES)) sets.push([`t:${t}`, p, buildSet(index, `t:${t}`, p)]);

test("every set has its purpose's slots, in order, and never uses a resource twice", () => {
  for (const [t, p, set] of sets) {
    const want = p === "path" ? PATH_SLOTS : PURPOSES[p].slots;
    assert.deepEqual(
      set.slots.map((s) => s.id),
      want,
      `${t}/${p}`,
    );
    const picked = set.slots.filter((s) => s.pick).map((s) => s.pick.doc.p);
    assert.equal(new Set(picked).size, picked.length, `${t}/${p} repeats a resource`);
    for (const s of set.slots)
      for (const a of s.alts)
        assert.ok(
          !picked.includes(a.doc.p) || a.doc.p === s.pick?.doc.p,
          `${t}/${p}/${s.id} offers a used resource as a swap`,
        );
  }
});
test("every pick is a real index resource that sits in the ring its explanation names", () => {
  for (const [t, p, set] of sets) {
    const target = set.target;
    for (const s of set.slots) {
      for (const c of [s.pick, ...s.alts].filter(Boolean)) {
        assert.equal(byPath.get(c.doc.p), c.doc, `${t}/${p}/${s.id} invented ${c.doc.p}`);
        if (c.ring === 0) {
          assert.equal(c.doc.l, target.lesson);
          assert.match(c.where, new RegExp(`^From Lesson ${target.lesson}$`));
        }
        if (c.ring === 1) {
          assert.equal(c.doc.s, target.standard);
          assert.ok(c.where.includes(target.standard), c.where);
        }
        if (c.ring === 2) {
          assert.equal(c.doc.u, target.unit);
          assert.match(c.where, /^Same unit \(Unit \d+/);
        }
        if (c.ring === 3) assert.match(c.where, /^(Same topic: |About )/);
        // An honest "where": a pick outside the lesson says so.
        if (target.kind === "lesson" && c.ring > 0)
          assert.ok(!c.where.startsWith("From Lesson"), c.where);
      }
    }
  }
});
test("picks fit their slot", () => {
  const fits = {
    ready: (d) => d.k === "readiness",
    smallSupport: (d) => d.k === "small-group" && d.v === "support",
    smallOn: (d) => d.k === "small-group" && !d.v,
    catchup: (d) => d.k === "catch-up",
    game: (d) => d.k === "game",
    check: (d) => d.k === "review",
    family: (d) => d.k === "family",
    enrich: (d) => d.k === "enrichment",
    project: (d) => d.k === "project",
    challenge: (d) => d.v === "challenge",
    supportSheet: (d) => d.k === "printable" && d.v === "support",
    worksheet: (d) => d.k === "printable" && !d.v,
    notes: (d) => d.k === "printable" && /Notes$/.test(d.t),
    practice: (d) => /practice-studio/.test(d.p) && !d.v,
  };
  for (const [t, p, set] of sets)
    for (const s of set.slots)
      if (s.pick && fits[s.id])
        assert.ok(fits[s.id](s.pick.doc), `${t}/${p}/${s.id}: ${s.pick.doc.p}`);
});
test("a lesson's own resources come first: every lesson set uses the lesson where the lesson has the kind", () => {
  for (const [t, p, set] of sets) {
    if (set.target.kind !== "lesson") continue;
    for (const s of set.slots) {
      if (!s.pick || s.pick.ring === 0) continue;
      assert.ok(
        !s.alts.some((a) => a.ring === 0),
        `${t}/${p}/${s.id} picked ring ${s.pick.ring} over the lesson's own`,
      );
    }
  }
});
test("the lesson's own folder beats its variants (6-6 workbook is 6-6's, not a catch-up's)", () => {
  const set = buildSet(index, "8-3", "review");
  assert.ok(set.slots.find((s) => s.id === "workbook").pick.doc.p.startsWith("/lessons/8-3/"));
});
test("lesson sets are mostly the lesson itself: a teach-the-lesson set finds its core parts in every lesson 2-1 to 9-x", () => {
  for (const l of ALL.filter((x) => x.unit >= 2 && x.unit <= 9)) {
    const set = buildSet(index, l.id, "introduce");
    for (const id of ["ready", "notes", "check", "family"]) {
      const s = set.slots.find((x) => x.id === id);
      assert.equal(s.pick?.ring, 0, `${l.id}/${id} is not from the lesson`);
    }
  }
});
test("a student path offers only what opens online for a student", () => {
  for (const [t, p, set] of sets) {
    if (p !== "path") continue;
    for (const s of set.slots)
      for (const c of [s.pick, ...s.alts].filter(Boolean)) {
        assert.ok(!c.doc.pr, `${t}/${s.id} offers a printable`);
        assert.ok(
          String(c.doc.a || "s").includes("s"),
          `${t}/${s.id} offers a non-student resource`,
        );
      }
    assert.ok(
      set.slots[0].label === "Warm up" &&
        set.slots.every((s) => !/teacher|small group/i.test(s.label)),
    );
  }
});
test("every lesson 2-1 to 9-x gets a warm-up and a practice step on its path", () => {
  for (const l of ALL.filter((x) => x.unit >= 2 && x.unit <= 9)) {
    const set = buildSet(index, l.id, "path");
    assert.ok(set.slots.find((s) => s.id === "ready").pick, `${l.id} has no warm-up`);
    assert.ok(set.slots.find((s) => s.id === "practice").pick, `${l.id} has no practice`);
  }
});
test("legacy unit numbers do not pull in another topic's game", () => {
  // Games under /math/unit-2/ were decimal games before the renumber; Unit 2 is now Statistics.
  const set = buildSet(index, "2-4", "family");
  const game = set.slots.find((s) => s.id === "game").pick.doc;
  assert.match(`${game.t} ${game.s || ""}`, /stat|data|DS\./i, game.t);
});
test("the language slot links to The Language Page and only there", () => {
  for (const [t, p, set] of sets)
    for (const s of set.slots.filter((x) => x.external)) {
      const u = new URL(s.external.href);
      assert.equal(u.origin, "https://thelanguagepage.com", `${t}/${p}`);
      assert.equal(u.searchParams.get("grades"), "6-8");
    }
});
test("an empty slot is empty, not padded", () => {
  const set = buildSet(index, "1-1", "extend");
  for (const s of set.slots) if (!s.pick) assert.equal(s.alts.length, 0);
});
test("the same request gives the same set (deterministic)", () => {
  assert.deepEqual(
    JSON.stringify(buildSet(index, "4-2", "practice")),
    JSON.stringify(buildSet(index, "4-2", "practice")),
  );
});
test("swap: the chosen alternative becomes the pick; bad swaps change nothing", () => {
  const set = buildSet(index, "6-6", "intervene");
  const game = set.slots.find((s) => s.id === "game");
  const swapped = applySwaps(set, { game: 1 }).slots.find((s) => s.id === "game");
  assert.equal(swapped.pick.doc.p, game.alts[0].doc.p);
  assert.ok(swapped.alts.some((a) => a.doc.p === game.pick.doc.p));
  for (const bad of [{ game: 9 }, { game: -1 }, { game: "x" }, { nope: 1 }])
    assert.deepEqual(applySwaps(set, bad), set);
});

/* ---------- search fix that came with this work ---------- */
test("topic words match inflections, not look-alike words: “ratios” does not find “rational numbers”", () => {
  const r = search(index, "ratio game", { limit: 40 }).results;
  assert.ok(r.length > 0);
  for (const x of r)
    assert.ok(!/rational/i.test(x.doc.t) || /ratio\b|ratios/i.test(x.doc.t), x.doc.t);
});

/* ---------- collections ---------- */
const doc = (p) => byPath.get(p);
test("collections: the old single list is folded in, and a fresh device has one empty list", () => {
  const s = memory();
  s.setItem(C.KEYS.legacy, JSON.stringify([{ t: "Lesson 6-6", p: "/lessons/6-6/", k: "lesson" }]));
  const st = C.loadSets(s);
  assert.equal(st.sets.length, 1);
  assert.equal(C.activeSet(st).items[0].p, "/lessons/6-6/");
  assert.deepEqual(C.loadSets(memory()).sets[0].items, []);
});
test("collections: add, toggle, move, note, rename, delete; survives a reload", () => {
  const s = memory();
  let st = C.loadSets(s);
  st = C.toggleItem(st, doc("/lessons/6-6/"));
  st = C.toggleItem(st, doc("/lessons/3-4/"));
  st = C.moveItem(st, "/lessons/3-4/", -1);
  assert.deepEqual(
    C.activeSet(st).items.map((x) => x.p),
    ["/lessons/3-4/", "/lessons/6-6/"],
  );
  st = C.moveItem(st, "/lessons/3-4/", -1);
  assert.equal(C.activeSet(st).items[0].p, "/lessons/3-4/", "moving the first item up is a no-op");
  st = C.setNote(st, "/lessons/6-6/", "  Group 2,   Tuesday ");
  assert.equal(C.activeSet(st).items[1].n, "Group 2, Tuesday");
  st = C.addSet(st, "Ratios intervention", [doc("/lessons/3-1/")], "ratios1");
  assert.equal(st.active, "ratios1");
  st = C.renameSet(st, "Ratios — Group 1");
  assert.ok(C.saveSets(s, st));
  const back = C.loadSets(s);
  assert.equal(C.activeSet(back).name, "Ratios — Group 1");
  assert.equal(back.sets.length, 2);
  const after = C.deleteSet(back);
  assert.equal(after.sets.length, 1);
  assert.equal(
    C.deleteSet(after).sets.length,
    1,
    "deleting the last collection leaves an empty one",
  );
  st = C.toggleItem(st, doc("/lessons/3-1/"));
  assert.ok(!C.inActive(st, "/lessons/3-1/"), "toggle removes");
});
test("collections: corrupt or hostile storage never breaks the page", () => {
  for (const raw of [
    "{",
    "null",
    "[]",
    '{"sets":"x"}',
    JSON.stringify({ sets: [{ id: "a b", items: [] }] }),
    JSON.stringify({
      sets: [
        {
          id: "x",
          name: "n",
          items: [
            { p: "javascript:alert(1)", t: "x" },
            { p: "//evil.example/", t: "x" },
            { p: "/ok/", t: "ok" },
          ],
        },
      ],
    }),
  ]) {
    const s = memory();
    s.setItem(C.KEYS.sets, raw);
    const st = C.loadSets(s);
    assert.ok(st.sets.length >= 1);
    for (const set of st.sets)
      for (const x of set.items) assert.ok(x.p.startsWith("/") && !x.p.startsWith("//"), x.p);
  }
  assert.equal(
    C.saveSets(
      {
        setItem() {
          throw new Error("quota");
        },
      },
      C.loadSets(null),
    ),
    false,
  );
});
test("collections: limits hold (60 items, 20 collections, note and name length)", () => {
  let st = C.loadSets(null);
  for (const d of index.docs.slice(0, 80)) st = C.toggleItem(st, d);
  assert.equal(C.activeSet(st).items.length, 60);
  for (let i = 0; i < 30; i++) st = C.addSet(st, `c${i}`, [], `id${i}`);
  assert.equal(st.sets.length, 20);
  st = C.setNote(st, "/nope/", "x");
  st = C.renameSet(st, "x".repeat(500));
  assert.equal(C.activeSet(st).name.length, 80);
});
test("share: a round trip keeps paths, notes and name; titles come from the index", () => {
  const set = {
    name: "Weekend practice",
    items: [
      { ...doc("/lessons/6-6/"), n: "Start here" },
      {
        p: "https://thelanguagepage.com/access-practice-lab/search?q=ratio",
        t: "LP",
        k: "language",
      },
    ],
  };
  const code = C.encodeShare(set);
  assert.match(code, /^[\w-]+$/);
  const back = C.decodeShare(code, index);
  assert.equal(back.name, "Weekend practice");
  assert.equal(back.items[0].t, doc("/lessons/6-6/").t);
  assert.equal(back.items[0].n, "Start here");
  assert.equal(back.items[1].k, "language");
  assert.equal(back.dropped, 0);
});
test("share: hostile links are refused or cleaned (outside URLs, scripts, forged titles, junk)", () => {
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const back = C.decodeShare(
    enc({
      n: "<img src=x onerror=alert(1)>",
      i: [
        ["javascript:alert(1)"],
        ["https://evil.example/"],
        ["//evil.example/x"],
        ["/not/in/index/"],
        ["/lessons/6-6/", "x".repeat(900)],
      ],
    }),
    index,
  );
  assert.equal(back.items.length, 1);
  assert.equal(back.items[0].p, "/lessons/6-6/");
  assert.equal(back.items[0].n.length, 240);
  assert.equal(back.dropped, 4);
  assert.equal(
    back.name,
    "<img src=x onerror=alert(1)>",
    "kept as plain text; the UI renders text, never HTML",
  );
  for (const junk of ["", "!!!", "e30", enc({ i: "nope" }), "a".repeat(20000)])
    assert.equal(C.decodeShare(junk, index), null, junk.slice(0, 20));
});
test("recent and practice-path marks: kept small, cleared by Clear everything", () => {
  const s = memory();
  for (const d of index.docs.slice(0, 15)) C.pushRecent(s, d);
  assert.equal(C.loadRecent(s).length, 10);
  C.pushRecent(s, index.docs[3]);
  assert.equal(C.loadRecent(s)[0].p, index.docs[3].p);
  C.savePath(s, "4-2", ["ready", "practice", "ready"]);
  assert.deepEqual(C.loadPath(s), { lesson: "4-2", done: ["ready", "practice"] });
  s.setItem(C.KEYS.path, JSON.stringify({ lesson: "../x", done: [] }));
  assert.equal(C.loadPath(s), null);
  C.savePath(s, "4-2", ["ready"]);
  C.saveSets(s, C.toggleItem(C.loadSets(s), index.docs[0]));
  C.clearAll(s);
  assert.equal(s.dump.size, 0);
});
test("nothing Find stores can name a student: stored values are titles, paths, kinds, notes and step ids only", () => {
  const s = memory();
  C.saveSets(
    s,
    C.toggleItem(C.loadSets(s), { ...index.docs[0], name: "Ana", student: "x", score: 9 }),
  );
  C.pushRecent(s, { ...index.docs[1], email: "a@b.c" });
  for (const v of s.dump.values()) assert.ok(!/Ana|student|score|email|a@b/.test(v), v);
});

console.log(
  process.exitCode
    ? `curriculum-find-plan: FAILED (${passed} passed)`
    : `✓ curriculum-find-plan: ${passed} checks passed`,
);
