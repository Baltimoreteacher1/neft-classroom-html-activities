// Book Studio 2.0 logic: schema-3 migration keeps old books, support resolution by profile/intensity/fading/required,
// library search, the rule-based designer, scene compilation, story validators and the bounded director.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  interpretCommand,
  LIBRARY,
  parseQuery,
  planToSupports,
  proposeForContent,
  searchLibrary,
} from "../access-practice-lab/src/book/lang/library.js";
import { expectationsFor, planForLevel } from "../access-practice-lab/src/book/lang/profiles.js";
import {
  makeSupport,
  normalizeSupport,
  recommendAdjustment,
  resolveSupports,
} from "../access-practice-lab/src/book/lang/supports.js";
import {
  addRevision,
  emptyWork,
  logAttempt,
  normalizeWork,
  record,
} from "../access-practice-lab/src/book/lang/work.js";
import {
  makeElement,
  makePage,
  migrate,
  normalizeBook,
} from "../access-practice-lab/src/book/model.js";
import {
  applyOps,
  choicesFor,
  collect,
  compileScene,
  initState,
  interpretDirection,
  normalizeAction,
  takeChoice,
  validateOps,
  validateStory,
} from "../access-practice-lab/src/book/story.js";

const bookWith = (extra = {}) =>
  normalizeBook({
    title: "T",
    gradeCluster: "4-5",
    pages: [
      makePage({ id: "pageaaaa" }),
      makePage({ id: "pagebbbb" }),
      makePage({ id: "pagecccc" }),
    ],
    ...extra,
  });

test("a schema-2 book migrates to schema 3 with every old field intact", () => {
  const old = {
    schema: 2,
    id: "oldbook1",
    title: "Old",
    format: "landscape",
    lang: "es",
    pages: [
      {
        id: "p000001",
        bg: "#fffaf0",
        elements: [{ type: "text", id: "e000001", html: "<p>Hola</p>", x: 5, y: 5, w: 50, h: 20 }],
      },
    ],
  };
  const b = migrate(old);
  assert.equal(b.schema, 3);
  assert.equal(b.title, "Old");
  assert.equal(b.format, "landscape");
  assert.equal(b.pages[0].elements[0].html, "<p>Hola</p>");
  assert.deepEqual(b.supports, []);
  assert.equal(b.publish.audience, "private"); // never public by default
});

test("normalizeSupport drops unknown fields and clamps enums", () => {
  const s = normalizeSupport({
    type: "nope",
    intensity: "extreme",
    levels: [0, 3, 3, 9],
    evil: "<script>",
    content: { frames: ["a", 1] },
  });
  assert.equal(s.type, "frame");
  assert.equal(s.intensity, "moderate");
  assert.deepEqual(s.levels, [3]);
  assert.equal(s.evil, undefined);
  assert.equal(s.content.frames[1], "1");
});

test("resolution: same page, different profiles see different supports; required always shows", () => {
  const heavy = makeSupport("frame", "descriptive", {
    levels: [1],
    intensity: "heavy",
    title: "L1",
  });
  const mid = makeSupport("frame", "causeEffect", {
    levels: [3],
    intensity: "moderate",
    title: "L3",
  });
  const req = makeSupport("vocab", "bank", { levels: [], required: true, title: "REQ" });
  const b = bookWith({ supports: [heavy, mid, req] });
  const titles = (n) =>
    resolveSupports(b, { profile: n, plan: planForLevel(n) })
      .filter((r) => r.tier === "assigned")
      .map((r) => r.support.title)
      .sort();
  assert.deepEqual(titles(1), ["L1", "REQ"]);
  assert.deepEqual(titles(3), ["L3", "REQ"]);
  assert.deepEqual(titles(5), ["REQ"]);
  assert.deepEqual(
    resolveSupports(b, { profile: 0, plan: { profile: 0, intensity: "none" } }).map(
      (r) => r.support.title,
    ),
    ["REQ"],
  );
});

test("a heavy-tagged support is not assigned under a minimal plan; it waits behind Help", () => {
  const s = makeSupport("frame", "starter", { levels: [3], intensity: "heavy" });
  const b = bookWith({ supports: [s] });
  const r = resolveSupports(b, { profile: 3, plan: { profile: 3, intensity: "minimal" } });
  assert.equal(r[0].tier, "help");
});

test("domain intensity is separate from level: heavy speaking, minimal reading", () => {
  const speak = makeSupport("rehearsal", "oral", {
    levels: [3],
    intensity: "heavy",
    domain: "speaking",
  });
  const read = makeSupport("reading", "readAloud", {
    levels: [3],
    intensity: "heavy",
    domain: "reading",
  });
  const b = bookWith({ supports: [speak, read] });
  const plan = {
    profile: 3,
    intensity: "moderate",
    domains: { speaking: "heavy", reading: "minimal", listening: "moderate", writing: "moderate" },
  };
  const tiers = Object.fromEntries(
    resolveSupports(b, { profile: 3, plan }).map((r) => [r.support.domain, r.tier]),
  );
  assert.equal(tiers.speaking, "assigned");
  assert.equal(tiers.reading, "help");
});

test("fading moves a support to Help after the teacher's threshold; required never fades; the move is not automatic without fade on", () => {
  const s = makeSupport("frame", "starter", {
    levels: [2],
    intensity: "heavy",
    fade: { enabled: true, after: 2 },
  });
  const b = bookWith({ supports: [s] });
  let w = emptyWork();
  w = record(record(w, s.id, "independent"), s.id, "independent");
  const aud = { profile: 2, plan: planForLevel(2), records: w.records };
  assert.equal(resolveSupports(b, aud)[0].tier, "help");
  assert.equal(resolveSupports(b, aud)[0].faded, true);
  const keep = makeSupport("frame", "starter", { levels: [2], intensity: "heavy" });
  const b2 = bookWith({ supports: [keep] });
  assert.equal(
    resolveSupports(b2, {
      ...aud,
      records: [
        { supportId: keep.id, action: "independent" },
        { supportId: keep.id, action: "independent" },
      ],
    })[0].tier,
    "assigned",
  );
});

test("recommendations carry evidence and never change a level", () => {
  const s = makeSupport("frame", "starter", { levels: [2] });
  const records = Array.from({ length: 3 }, () => ({ supportId: s.id, action: "independent" }));
  const r = recommendAdjustment(records, s);
  assert.equal(r.kind, "reduce");
  assert.ok(r.evidence.length >= 2);
  assert.equal(r.level, undefined);
});

test("publish mode includes only supports the teacher allowed", () => {
  const a = makeSupport("vocab", "bank", { inPublished: true, levels: [] });
  const c = makeSupport("frame", "starter", { inPublished: false, levels: [] });
  const b = bookWith({ supports: [a, c] });
  assert.deepEqual(
    resolveSupports(b, {
      mode: "publish",
      profile: 0,
      plan: { profile: 0, intensity: "heavy" },
    }).map((r) => r.support.id),
    [a.id],
  );
});

test("library search understands 'cause and effect, grade 6, WIDA Level 2'", () => {
  const q = parseQuery("Cause and effect, grade 6, WIDA Level 2");
  assert.equal(q.level, 2);
  assert.equal(q.cluster, "6-8");
  const hits = searchLibrary("Cause and effect, grade 6, WIDA Level 2");
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => !h.levels.length || h.levels.includes(2)));
  assert.ok(hits.some((h) => h.kind === "causeEffect"));
  assert.ok(LIBRARY.length > 40);
});

test("expectation ids come only from the catalog; unlisted clusters return none", () => {
  assert.ok(
    expectationsFor({ standard: "ELD-LA", cluster: "4-5", keyUse: "Narrate", mode: "Expressive" })
      .length > 0,
  );
  assert.deepEqual(expectationsFor({ standard: "ELD-LA", cluster: "K", keyUse: "Narrate" }), []);
});

test("designer turns one sentence into a reviewable plan; unknown requests say so", () => {
  const b = bookWith();
  const plan = interpretCommand("Add Level 1 and 2 sentence starters to the first two pages", b);
  assert.equal(plan.ok, true);
  assert.deepEqual(plan.ops[0].levels, [1, 2]);
  const list = planToSupports(plan, b);
  assert.equal(list.length, 2);
  assert.ok(list.every((s) => s.source === "designer" && s.reviewed === false));
  assert.equal(interpretCommand("hello", b).ok, false);
  const per = interpretCommand(
    "Create different versions of these dialogue supports for Levels 1 through 3",
    b,
  );
  assert.equal(per.ok, true);
});

test("suggestions from content respect the task and the level", () => {
  const out = proposeForContent({
    type: "bubble",
    text: '"I disagree," said Mia.',
    pageId: "pageaaaa",
    elementId: "ex",
    levels: [1, 3, 5],
  });
  assert.equal(out.length, 3);
  assert.ok(out.every((s) => s.kind === "dialogue" && s.reviewed === false));
  assert.notEqual(out[0].content.frames[0], out[2].content.frames[0]);
});

test("revision keeps original and revised text separate and labelled", () => {
  let w = emptyWork();
  w = addRevision(w, {
    elementId: "e1",
    pageId: "p1",
    before: "The animal was scared.",
    after: "The fox froze at the footsteps.",
    by: "student",
  });
  w = addRevision(w, { elementId: "e1", pageId: "p1", before: "x", after: "x" });
  assert.equal(w.revisions.length, 1);
  assert.equal(normalizeWork(w).revisions[0].before, "The animal was scared.");
  const s = makeSupport("frame", "starter");
  const a = logAttempt(emptyWork(), { elementId: "e1", text: "Hello there", supports: [s] });
  assert.equal(a.records.at(-1).action, "independent");
  const opened = logAttempt(record(emptyWork(), s.id, "opened"), {
    elementId: "e1",
    text: "Hi",
    supports: [s],
  });
  assert.ok(!opened.records.some((r) => r.action === "independent"));
});

test("scene compile is deterministic and drops actions for missing elements", () => {
  const fox = makeElement("art", { id: "foxel01", x: 10, y: 50, w: 20, h: 30, art: "char-cat" });
  const scene = {
    actions: [
      normalizeAction({
        type: "walk",
        target: "foxel01",
        t: 0,
        dur: 1000,
        params: { x: 60, y: 50 },
      }),
      normalizeAction({ type: "jump", target: "gone0001", t: 1000 }),
      normalizeAction({ type: "zoom", t: 500, params: { zoom: 2 } }),
    ],
  };
  const a = JSON.stringify(compileScene(scene, [fox]));
  const b = JSON.stringify(compileScene(scene, [fox]));
  assert.equal(a, b);
  const c = compileScene(scene, [fox]);
  assert.equal(c.tracks.length, 1);
  assert.equal(c.camera.length, 1);
  assert.equal(c.tracks[0].keyframes[1].left, "60%");
});

test("story validators find unreachable pages, broken branches, missing endings, bad items and unexplained clues", () => {
  const clue = makeElement("art", {
    id: "clue0001",
    art: "obj-key",
    alt: "key",
    hotspot: { label: "Key", give: "itemkey1", reveal: "" },
  });
  const b = normalizeBook({
    title: "Adv",
    story: {
      startPageId: "page0001",
      items: [
        { id: "itemkey1", name: "Key" },
        { id: "itemunus", name: "Unused" },
      ],
      vars: [],
    },
    pages: [
      {
        id: "page0001",
        elements: [clue],
        choices: [
          { id: "ch000001", label: "Go", to: "page0002" },
          { id: "ch000002", label: "Broken", to: "nowhere01" },
          { id: "ch000003", label: "Locked", to: "page0002", requires: [{ item: "itemmiss" }] },
        ],
      },
      { id: "page0002", ending: "open", elements: [] },
      { id: "page0003", elements: [] },
    ],
  });
  const codes = validateStory(b).map((v) => v.code);
  for (const c of ["unreachable", "broken-branch", "bad-item", "no-explanation", "unused-item"])
    assert.ok(codes.includes(c), c);
  assert.ok(
    validateStory(
      normalizeBook({
        pages: [
          {
            id: "page0001",
            choices: [
              { id: "ch000001", label: "Again", to: "page0001" },
              { id: "ch000002", label: "Again 2", to: "page0001" },
            ],
          },
        ],
      }),
    ).some((v) => v.code === "no-ending"),
  );
  assert.equal(validateStory(bookWith()).length, 0); // a plain book has no adventure rules
});

test("play state: items unlock choices; states are immutable", () => {
  const b = normalizeBook({
    story: { startPageId: "page0001", items: [{ id: "itemkey1", name: "Key" }], vars: [] },
    pages: [
      {
        id: "page0001",
        elements: [
          makeElement("art", {
            id: "clue0001",
            art: "obj-key",
            alt: "k",
            hotspot: { label: "Key", give: "itemkey1", reveal: "It fits the lock." },
          }),
        ],
        choices: [
          { id: "ch000001", label: "Open", to: "page0002", requires: [{ item: "itemkey1" }] },
        ],
      },
      { id: "page0002", ending: "good", elements: [] },
    ],
  });
  const s0 = initState(b);
  assert.equal(choicesFor(b.pages[0], s0)[0].open, false);
  assert.equal(takeChoice(b, s0, "ch000001"), s0);
  const s1 = collect(b, s0, "clue0001");
  assert.notEqual(s1, s0);
  assert.deepEqual(s0.items, []);
  assert.equal(takeChoice(b, s1, "ch000001").page, "page0002");
  assert.equal(validateStory(b).filter((v) => v.level === "error").length, 0);
});

test("Direct this scene: commands become validated ops; nothing unknown passes", () => {
  const b = normalizeBook({
    characters: [{ id: "chfox001", name: "Fox", art: "char-cat" }],
    pages: [
      {
        id: "page0001",
        elements: [
          {
            type: "art",
            id: "foxel001",
            art: "char-cat",
            charId: "chfox001",
            x: 10,
            y: 40,
            w: 20,
            h: 30,
          },
          {
            type: "art",
            id: "cavel001",
            art: "bg-forest",
            alt: "cave",
            x: 70,
            y: 30,
            w: 25,
            h: 40,
          },
        ],
      },
    ],
  });
  const page = b.pages[0];
  const r = interpretDirection("Make the fox walk toward the cave", {
    page,
    characters: b.characters,
  });
  assert.equal(r.ok, true);
  assert.equal(r.ops[0].action.type, "walk");
  assert.equal(r.ops[0].action.target, "foxel001");
  applyOps(page, r.ops);
  assert.equal(page.scene.actions.length, 1);
  assert.equal(
    interpretDirection("Change the sky to sunset", { page, characters: b.characters }).ops[0].op,
    "page",
  );
  assert.equal(
    interpretDirection("Make the fox look worried", { page, characters: b.characters }).ops[0]
      .action.params.expression,
    "worried",
  );
  assert.equal(interpretDirection("dance wildly", { page, characters: b.characters }).ok, false);
  assert.deepEqual(
    validateOps(
      [
        { op: "exec", code: "alert(1)" },
        { op: "action", action: { type: "walk", target: "ghost0001" } },
      ],
      page,
    ),
    [],
  );
});

test("copying a book keeps every reference working (choices, scenes, supports, story start, work)", async () => {
  const { cloneWithNewIds } = await import("../access-practice-lab/src/book/model.js");
  const clue = makeElement("art", { id: "clue0001", art: "obj-key", alt: "key" });
  const fox = makeElement("art", { id: "foxel001", art: "char-cat", alt: "fox" });
  const src = normalizeBook({
    story: { startPageId: "page0001", items: [], vars: [] },
    supports: [
      makeSupport("frame", "starter", {
        target: { scope: "element", pageId: "page0001", elementId: "foxel001" },
      }),
    ],
    work: { revisions: [{ elementId: "foxel001", pageId: "page0001", before: "a", after: "b" }] },
    pages: [
      {
        id: "page0001",
        elements: [fox, clue],
        choices: [{ id: "ch000001", label: "Go", to: "page0002" }],
        scene: {
          actions: [
            normalizeAction({ type: "walk", target: "foxel001", params: { x: 60, y: 40 } }),
          ],
        },
      },
      { id: "page0002", ending: "good", elements: [] },
    ],
  });
  const c = cloneWithNewIds(src);
  assert.notEqual(c.pages[0].id, "page0001");
  assert.equal(c.pages[0].choices[0].to, c.pages[1].id);
  assert.equal(c.story.startPageId, c.pages[0].id);
  assert.equal(c.pages[0].scene.actions[0].target, c.pages[0].elements[0].id);
  assert.equal(c.supports[0].target.elementId, c.pages[0].elements[0].id);
  assert.equal(c.supports[0].target.pageId, c.pages[0].id);
  assert.equal(c.work.revisions[0].elementId, c.pages[0].elements[0].id);
  assert.equal(compileScene(c.pages[0].scene, c.pages[0].elements).tracks.length, 1);
});
