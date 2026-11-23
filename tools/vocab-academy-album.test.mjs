// Vocabulary Academy — Word Album model tests. Run: node tools/vocab-academy-album.test.mjs
// Card frames follow the DERIVED word state (model.js wordState), set-complete counts, filters and today's missions are
// computed from the learner's record over the real lesson files, and nothing here ever writes storage or mutates progress.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// A localStorage that counts writes: the album must make none.
const mem = new Map();
const writes = { n: 0 };
globalThis.localStorage = new Proxy(
  {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => {
      writes.n += 1;
      mem.set(k, String(v));
    },
    removeItem: () => {
      writes.n += 1;
    },
  },
  {
    get: (t, k) => (k in t ? t[k] : mem.get(k)),
    ownKeys: () => [...mem.keys()],
    getOwnPropertyDescriptor: (t, k) =>
      mem.has(k) ? { value: mem.get(k), enumerable: true, configurable: true } : undefined,
    has: (t, k) => k in t || mem.has(k),
  },
);

const ROOT = new URL("../", import.meta.url);
const LAB = new URL("access-practice-lab/src/", ROOT);
const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const data = await import(new URL("vocab-academy/data.js", LAB));
const model = await import(new URL("vocab-academy/model.js", LAB));
const cards = await import(new URL("vocab-academy/album/cards.js", LAB));
const contract = await import(new URL("vocab-academy/contract.js", LAB));
const router = await import(new URL("vocab-academy/router.js", LAB));
const { makeI18n } = await import(new URL("i18n.js", LAB));
const { toHtml } = await import(new URL("util.js", LAB));

// Serve the committed content from disk.
data.configureData({
  fetchImpl: async (url) => {
    const rel = String(url).replace("/access-practice-lab/content/vocab-academy/", "");
    try {
      const body = readFileSync(new URL(rel, CONTENT), "utf8");
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => JSON.parse(body),
      };
    } catch {
      return { ok: false };
    }
  },
});
const index = await data.getIndex();
assert.ok(!index.missing, "the committed index must load from disk");

const NOW = new Date(2026, 10, 20, 12);
const TODAY = "2026-11-20";
const ev = (cw, r = "1", q = 0) => ({ c: 1, n: 1, last: null, cw, r, q });
const ENTRY = {
  learning: () => ({ seen: 1, ev: {}, rn: false }),
  developing: () => ({ seen: 2, ev: { mean: ev(1) }, rn: false }),
  applying: () => ({ seen: 4, ev: { mean: ev(1), ctx: ev(1), prod: ev(1) }, rn: false }),
  secure: () => ({
    seen: 6,
    ev: { mean: ev(1), ctx: ev(1), prod: ev(1), delay: ev(1, "1", 1) },
    rn: false,
  }),
  "review-needed": () => ({
    seen: 6,
    ev: { mean: ev(1), ctx: ev(1), prod: ev(1), delay: ev(1, "1", 1) },
    rn: true,
  }),
};
const rowsOf = async (grade) => (await data.getGradeUnits(grade)).units;
const gradeUnits = async (grades) =>
  Promise.all(grades.map(async (grade) => ({ grade, units: await rowsOf(grade) })));
const firstLessonRow = async (grade) => (await rowsOf(grade))[0].lessons.find((r) => r.published);

test("every state gets its own frame, taken from wordState and never stored", async () => {
  const row = await firstLessonRow("6");
  const progress = model.blankProgress();
  const states = Object.keys(ENTRY);
  states.forEach((s, i) => {
    progress.words[row.wordIds[i]] = ENTRY[s]();
  });
  const before = JSON.stringify(progress);
  const lesson = cards.buildLesson(progress, row);
  states.forEach((s, i) => {
    const card = lesson.cards[i];
    assert.equal(
      card.state,
      model.wordState(progress.words[row.wordIds[i]]),
      `card ${i} follows wordState`,
    );
    assert.equal(card.state, s);
    assert.equal(card.locked, false);
    assert.ok(card.hw.length > 0, "an unlocked card names its word");
  });
  assert.deepEqual(
    lesson.cards.slice(0, 5).map((c) => c.rarity),
    ["common", "uncommon", "rare", "legendary", "visit"],
  );
  const locked = lesson.cards[5];
  assert.equal(locked.state, "new");
  assert.equal(locked.rarity, "locked");
  assert.equal(locked.hw, "", "a locked card does not reveal its word");
  assert.equal(locked.word, null);
  assert.equal(JSON.stringify(progress), before, "building a lesson never mutates progress");
});

test("a card's frame always has a label and a distinct rarity per state", () => {
  const rarities = new Set(Object.values(cards.RARITY));
  assert.equal(rarities.size, contract.STATES.length, "six states, six looks");
  for (const r of rarities)
    assert.ok(
      cards.RARITY_LABEL[r]?.[0] && cards.RARITY_LABEL[r][1],
      `${r} is named in both languages`,
    );
  for (const s of contract.STATES) assert.ok(contract.STATE_LABEL[s], `${s} has a text label`);
});

test("set-complete counts: 6 of 10 unlocked, then complete", async () => {
  const row = await firstLessonRow("6");
  const progress = model.blankProgress();
  for (const id of row.wordIds.slice(0, 6)) progress.words[id] = ENTRY.learning();
  let lesson = cards.buildLesson(progress, row);
  assert.equal(lesson.total, row.wordIds.length);
  assert.equal(lesson.unlocked, 6);
  assert.equal(lesson.started, true);
  assert.equal(cards.meterOf(lesson).complete, false);
  for (const id of row.wordIds) progress.words[id] = ENTRY.developing();
  lesson = cards.buildLesson(progress, row);
  assert.equal(lesson.unlocked, lesson.total);
  assert.equal(cards.meterOf(lesson).complete, true);
  const none = cards.buildLesson(model.blankProgress(), row);
  assert.equal(none.unlocked, 0);
  assert.equal(none.started, false);
});

test("the whole album over every published lesson: totals add up, nothing is unlocked by default", async () => {
  const all = await gradeUnits(contract.SHIPPED_GRADES);
  const album = cards.buildAlbum(model.blankProgress(), all, new Map(), index);
  let expected = 0;
  for (const g of contract.SHIPPED_GRADES)
    for (const u of index.grades[g]?.units || []) expected += u.wordIds.length;
  assert.equal(album.totals.cards, expected, "one card per indexed word of grades K to 8");
  assert.equal(album.totals.unlocked, 0);
  assert.equal(album.totals.byState.new, expected);
  assert.ok(
    album.grades.every((g) =>
      g.units.every((u) => u.lessons.every((l) => l.cards.every((c) => c.locked))),
    ),
  );
  const ids = album.grades.flatMap((g) =>
    g.units.flatMap((u) => u.lessons.flatMap((l) => l.cards.map((c) => c.id))),
  );
  assert.equal(new Set(ids).size, ids.length, "no word sits on two cards");
});

test("earlier-grade words are listed beside the learner's own grade; grades 9 to 12 never are", async () => {
  const g3 = await firstLessonRow("3");
  const g6 = await firstLessonRow("6");
  const progress = model.blankProgress();
  progress.grade = "6";
  progress.words[g3.wordIds[0]] = ENTRY.secure();
  progress.words["va.fake.n"] = { ...ENTRY.learning(), g: "11" };
  assert.deepEqual(cards.gradesToShow(progress, index), ["3", "6"]);
  assert.deepEqual(cards.gradesToShow(progress, index, { grade: "8" }), ["3", "6", "8"]);
  assert.deepEqual(cards.gradesToShow(progress, index, { grade: "11" }), ["3", "6"]);
  assert.deepEqual(cards.gradesToShow(model.blankProgress(), index), []);
  const all = await gradeUnits(["3", "6"]);
  assert.deepEqual(cards.metWordIds(progress, all), [g3.wordIds[0]]);
  assert.ok(g6.wordIds.length > 0);
});

test("filters: state, search, and a locked card never matches a search", () => {
  const unlocked = { state: "developing", locked: false, hw: "Cautious" };
  const locked = { state: "new", locked: true, hw: "" };
  assert.equal(cards.cardMatches(unlocked, { state: "developing" }), true);
  assert.equal(cards.cardMatches(unlocked, { state: "secure" }), false);
  assert.equal(cards.cardMatches(unlocked, { search: "caut" }), true);
  assert.equal(cards.cardMatches(unlocked, { search: "  CAUT  " }), true);
  assert.equal(cards.cardMatches(unlocked, { search: "zzz" }), false);
  assert.equal(cards.cardMatches(locked, { search: "a" }), false);
  assert.equal(cards.cardMatches(locked, { state: "new" }), true);
  assert.equal(cards.cardMatches(locked, {}), true);
});

const albumFor = async (progress, grades) =>
  cards.buildAlbum(progress, await gradeUnits(grades), new Map(), index);

test("missions: a new learner is pointed at a first lesson", async () => {
  const progress = model.blankProgress();
  const empty = await albumFor(progress, ["6"]);
  let m = cards.missionsFor(progress, empty, { index, now: NOW });
  assert.deepEqual(
    m.map((x) => x.kind),
    ["start"],
  );
  assert.equal(m[0].href, data.vaHref("grades"));
  progress.grade = "6";
  m = cards.missionsFor(progress, empty, { index, now: NOW });
  assert.equal(m[0].href, data.lessonHref("6", 1));
  assert.equal(m[0].done, false);
});

test("missions: review, vault and game come from the record, at most three, done only from real activity today", async () => {
  const row = await firstLessonRow("6");
  const progress = model.blankProgress();
  progress.grade = "6";
  const [a, b, c, d, e, f] = row.wordIds;
  for (const id of [a, b, c, d, e, f])
    progress.words[id] = { ...ENTRY.developing(), due: "2026-11-10", step: 1 };
  progress.last = { unit: row.id, lesson: "a", at: NOW.toISOString() };
  const album = await albumFor(progress, ["6"]);
  let m = cards.missionsFor(progress, album, { index, now: NOW });
  assert.deepEqual(
    m.map((x) => x.kind),
    ["review", "vault", "game"],
  );
  assert.ok(m.length <= 3);
  assert.equal(m[0].n, 6, "six words are due");
  assert.equal(m[0].href, data.vaHref("review"));
  assert.ok(
    m.every((x) => x.done === false),
    "nothing is done before any activity today",
  );
  const { u } = cards.findLesson(album, row.id);
  assert.equal(m[1].href, data.unitHref("6", u, "vault"));
  assert.equal(m[1].unit, u);
  assert.equal(m[2].lesson, row.n);
  assert.match(m[2].href, new RegExp(`games\\?grade=6&unit=${row.id}$`));

  // The daily cap: a due list longer than reviewPerDay is offered as reviewPerDay words.
  progress.prefs = { reviewPerDay: 3 };
  assert.equal(cards.missionsFor(progress, album, { index, now: NOW })[0].n, 3);
  progress.prefs = {};

  // Review done today (progress.daily), vault finished today, a word practised today.
  progress.daily = { day: TODAY, words: [a, b] };
  for (const id of [a, b, c, d, e, f]) progress.words[id].due = "2026-12-20";
  progress.unitWork = {
    [data.groupId("6", u)]: { vault: { done: true, at: new Date(2026, 10, 20, 9).toISOString() } },
  };
  progress.words[a].lastDay = TODAY;
  m = cards.missionsFor(progress, album, { index, now: NOW });
  assert.deepEqual(
    m.map((x) => [x.kind, x.done]),
    [
      ["review", true],
      ["vault", true],
      ["game", true],
    ],
  );
  assert.equal(m[0].n, 2);

  // A vault finished on another day does not count for today; yesterday's review does not either.
  progress.unitWork[data.groupId("6", u)].vault.at = new Date(2026, 10, 18, 9).toISOString();
  progress.daily = { day: "2026-11-19", words: [a] };
  progress.words[a].lastDay = "2026-11-19";
  m = cards.missionsFor(progress, album, { index, now: NOW });
  assert.deepEqual(
    m.map((x) => x.kind),
    ["vault", "game"],
    "nothing due and nothing reviewed today: no review mission",
  );
  assert.ok(m.every((x) => x.done === false));
});

test("the album is read-only: no storage writes, no mutation, no streak or loss language", async () => {
  const row = await firstLessonRow("4");
  const progress = model.blankProgress();
  progress.grade = "4";
  progress.words[row.wordIds[0]] = ENTRY.secure();
  progress.words[row.wordIds[1]] = ENTRY["review-needed"]();
  const before = JSON.stringify(progress);
  const w0 = writes.n;
  const album = await albumFor(progress, cards.gradesToShow(progress, index));
  cards.missionsFor(progress, album, { index, now: NOW });
  cards.cardMatches(album.grades[0].units[0].lessons[0].cards[0], { search: "x" });
  assert.equal(writes.n, w0, "no storage writes");
  assert.equal(JSON.stringify(progress), before, "progress untouched");
  for (const file of ["album/cards.js", "views/album.js"]) {
    const src = readFileSync(new URL(`vocab-academy/${file}`, LAB), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    assert.doesNotMatch(
      src,
      /streak|you lost|lost your|setInterval|countdown|storage\.set|localStorage|setItem/i,
      `${file} stays calm and read-only`,
    );
  }
});

test("the album route is wired and every other route still answers as before", () => {
  assert.deepEqual(router.resolve(["album"]), { name: "album", params: {}, teacherOnly: false });
  assert.equal(router.resolve(["album", "x"]).name, "notfound");
  assert.equal(router.resolve([]).name, "dashboard");
  assert.equal(router.resolve(["review"]).name, "review");
  assert.equal(router.resolve(["grade", "6", "unit", "2", "vault"]).name, "unit-activity");
  assert.ok(router.SUBVIEW_LOADERS.album);
  assert.ok(!router.TEACHER_VIEWS.has("album"), "the album is a student page");
});

test("the album page renders locked silhouettes, framed cards and bilingual text", async () => {
  const row = await firstLessonRow("6");
  const progress = model.blankProgress();
  progress.grade = "6";
  row.wordIds.slice(0, 4).forEach((id, i) => {
    progress.words[id] = ENTRY[["learning", "developing", "applying", "secure"][i]]();
  });
  progress.words[row.wordIds[4]] = ENTRY["review-needed"]();
  const view = await import(new URL("vocab-academy/views/album.js", LAB));
  const render = async (mode, flags = {}) =>
    toHtml(
      (
        await view.render(
          {},
          {
            I: makeI18n(mode),
            progress,
            route: { path: ["album"], q: { grade: "6" } },
            params: {},
            supports: () => ({ glossaryEs: false, ...flags }),
          },
        )
      ).html,
    );
  const en = await render("en");
  assert.match(en, /Word Album/);
  assert.match(en, /Today('|&#39;)s missions/);
  assert.match(en, /5 of 10 cards unlocked/);
  for (const r of ["common", "uncommon", "rare", "legendary", "visit"])
    assert.match(en, new RegExp(`data-rarity="${r}"`));
  assert.match(en, /alb-card-locked/);
  assert.match(en, /Visit me again/);
  assert.doesNotMatch(en, /undefined|\[object/);
  assert.doesNotMatch(en, /Español:/, "no Spanish gloss without the support");
  const es = await render("es");
  assert.match(es, /Álbum de palabras/);
  assert.match(es, /Misiones de hoy/);
  assert.match(es, /5 de 10 tarjetas desbloqueadas/);
  const withGloss = await render("en", { glossaryEs: true });
  assert.match(withGloss, /Español:/);
  const lockedTags = en.match(/<a\s[^>]*alb-locked[^>]*>/g) || [];
  assert.equal(lockedTags.length, row.wordIds.length - 5, "every unmet word of the lesson is a locked card");
  for (const a of lockedTags) assert.doesNotMatch(a, /va\./, "a locked card never carries its word id");
});
