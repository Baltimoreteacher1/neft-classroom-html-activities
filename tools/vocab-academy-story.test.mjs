// Vocabulary Academy — Story Restore (unit/story.js). Pure: no DOM, no network. The engine is swept over EVERY real lesson
// that has a passage, with and without other lessons' words to draw wrong words from. The view is rendered with a stub env
// to prove no sentence prints the word its blank asks for. Run: node tools/vocab-academy-story.test.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const VA = new URL("access-practice-lab/src/vocab-academy/", ROOT);
const load = (f) => import(new URL(f, VA));
const STORY = await load("unit/story.js");
const { EXTRAS, extraOf } = await load("unit/extras.js");
const { normalize } = await load("games/data.js");
const { findForm, norm } = await load("games/text.js");
const { rngFor } = await load("rng.js");
const { makeI18n } = await import(new URL("access-practice-lab/src/i18n.js", ROOT));
const { toHtml } = await import(new URL("access-practice-lab/src/util.js", ROOT));
const render = (s, env) => toHtml(STORY.storySpec.view(s, env));

const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const lessons = [];
for (const g of readdirSync(CONTENT).filter((d) => /^g(K|\d+)$/.test(d)))
  for (const f of readdirSync(new URL(`${g}/`, CONTENT)).filter((x) => /^u\d+\.json$/.test(x)))
    lessons.push(JSON.parse(readFileSync(new URL(`${g}/${f}`, CONTENT), "utf8")));
const withPassage = lessons.filter(STORY.hasPassage);
const byGrade = new Map();
for (const l of lessons) byGrade.set(l.grade, [...(byGrade.get(l.grade) || []), l]);
/** Wrong-word candidates the way the unit page supplies them: the words of the neighbouring lessons. */
const neighbours = (l) => {
  const list = byGrade.get(l.grade);
  const i = list.indexOf(l);
  return list.filter((_, k) => k !== i && Math.abs(k - i) <= 2).flatMap((x) => x.words);
};
const poolOf = (l, { review = true } = {}) =>
  normalize({ unit: l, review: review ? neighbours(l) : [] });
const build = (pool, seed = `story:${pool.id}`) => STORY.buildStory(pool, rngFor(seed));
const authored = (l) => l.passage.paras.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
const printed = (page) =>
  page.blocks
    .flatMap((b) => b.segs)
    .filter((s) => s[0] === "t")
    .map((s) => s[1])
    .join(" ");
const strip = (h) =>
  String(h)
    .replace(/<[^>]+>/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
/** Restore every blank the right way (a bank word that fits). */
const solve = (s) => {
  s.pages.forEach((page, n) => {
    page.blanks.forEach((_, k) => {
      if (s.st[n].placed[k] != null) return;
      const j = STORY.fitting(page, k).find((x) => !Object.values(s.st[n].placed).includes(x));
      assert.ok(j != null, "a free fitting word for every blank");
      assert.equal(STORY.place(page, s.st[n], k, j).ok, true);
    });
  });
  return s;
};

test("the real data has passages to restore", () => {
  assert.ok(withPassage.length >= 150, `lessons with a passage: ${withPassage.length}`);
});

test("every real lesson builds a valid story with sound pages", () => {
  for (const l of withPassage) {
    for (const review of [true, false]) {
      const pool = poolOf(l, { review });
      const s = build(pool);
      assert.ok(s.pages.length >= 1, `${l.id}: at least one page`);
      assert.equal(s.st.length, s.pages.length, `${l.id}: a progress record per page`);
      assert.ok(STORY.storySpec.valid(s), `${l.id}: the spec accepts its own state`);
      const lim = { early: 3, "upper-elem": 4, middle: 5, high: 6 }[pool.band];
      const ids = new Set(pool.words.map((w) => w.id));
      for (const page of s.pages) {
        assert.ok(page.blanks.length >= 1, `${l.id}: every page has a blank`);
        assert.ok(
          page.bank.length <= STORY.BANK_MAX,
          `${l.id}: the number keys reach the whole bank`,
        );
        // A page holds at most `lim` blanks unless one sentence alone has more.
        const perSentence = Math.max(
          ...page.blocks.map((b) => b.segs.filter((x) => x[0] === "b").length),
        );
        assert.ok(
          page.blanks.length <= Math.max(lim, perSentence),
          `${l.id}: ${page.blanks.length} blanks on a page (limit ${lim})`,
        );
        for (const b of page.blanks)
          assert.ok(ids.has(b.wordId), `${l.id}: a blank asks for a unit word`);
        const extras = page.bank.filter((c) => c.extra);
        assert.ok(
          extras.length <= { early: 1, "upper-elem": 2, middle: 2, high: 2 }[pool.band],
          `${l.id}: a short band bank`,
        );
        assert.equal(
          page.bank.length,
          page.blanks.length + extras.length,
          `${l.id}: a chip per blank, plus wrong words`,
        );
      }
    }
  }
});

test("every blank has exactly one word of the bank that fits; wrong words fit nowhere", () => {
  for (const l of withPassage) {
    for (const review of [true, false]) {
      const s = build(poolOf(l, { review }));
      for (const page of s.pages) {
        page.blanks.forEach((_, k) => {
          const fit = STORY.fitting(page, k);
          assert.ok(fit.length >= 1, `${l.id}: blank ${k} has a fitting word`);
          const forms = new Set(
            fit.map((j) => `${page.bank[j].wordId}|${norm(page.bank[j].form)}`),
          );
          assert.equal(forms.size, 1, `${l.id}: exactly one word fits blank ${k}`);
          assert.ok(
            fit.every((j) => !page.bank[j].extra),
            `${l.id}: a wrong word never fits`,
          );
        });
        page.bank.forEach((c, j) => {
          const fitsSome = page.blanks.some((_, k) => STORY.fits(page, k, j));
          assert.equal(
            fitsSome,
            !c.extra,
            `${l.id}: chip ${c.form} ${c.extra ? "is" : "is not"} a wrong word`,
          );
        });
        // Wrong words are not close to any answer: not a synonym, an antonym or the same word.
        const answers = page.blanks.map((b) => pool(l, b.wordId));
        for (const c of page.bank.filter((x) => x.extra)) {
          const w = lessons.flatMap((x) => x.words).find((x) => x.id === c.wordId);
          for (const a of answers) {
            if (!a || !w) continue;
            const near = new Set([...(a.syn || []), ...(a.ant || [])].map(norm));
            assert.ok(
              !near.has(norm(w.hw)) && norm(a.hw) !== norm(w.hw),
              `${l.id}: ${w.hw} is not close to ${a.hw}`,
            );
          }
        }
      }
    }
  }
  function pool(l, id) {
    return l.words.find((w) => w.id === id);
  }
});

test("no page prints an answer: every form of every target word is a blank", () => {
  for (const l of withPassage) {
    const pool = poolOf(l);
    const s = build(pool);
    const targets = STORY.targetsOf(pool);
    for (const page of s.pages) {
      const text = printed(page);
      for (const w of targets)
        assert.ok(!findForm(text, w), `${l.id}: the page prints "${w.hw}" in a sentence`);
      // And no wrong word printed there either: nothing on the page can be copied into a blank.
      for (const c of page.bank.filter((x) => x.extra)) {
        const w = lessons.flatMap((x) => x.words).find((x) => x.id === c.wordId);
        assert.ok(!findForm(text, w), `${l.id}: a wrong word is printed on the page`);
      }
      for (const t of STORY.maskedBlocks(page))
        for (const w of targets)
          assert.ok(!findForm(t, w), `${l.id}: masked text carries no answer`);
    }
  }
});

test("restored text equals the authored passage exactly, in order", () => {
  for (const l of withPassage) {
    const s = solve(build(poolOf(l)));
    assert.deepEqual(STORY.restoredParas(s), authored(l), `${l.id}: restored passage`);
    assert.ok(STORY.allRestored(s), `${l.id}: all restored`);
    const { done, total } = STORY.progressOf(s);
    assert.equal(done, total);
    assert.ok(total >= 1);
    // The page-by-page text with every blank filled is the same text, not a re-wording.
    assert.equal(
      STORY.restoredParas(s, { all: true }).join(" "),
      authored(l).join(" "),
      `${l.id}: the pages add up to the passage`,
    );
  }
});

test("the engine is deterministic by seed", () => {
  let differs = 0;
  for (const l of withPassage) {
    const pool = poolOf(l);
    const a = JSON.stringify(build(pool, "s1"));
    assert.equal(a, JSON.stringify(build(pool, "s1")), `${l.id}: same seed, same story`);
    assert.equal(JSON.stringify(JSON.parse(a)), a, `${l.id}: the state survives a save and reload`);
    if (a !== JSON.stringify(build(pool, "s2"))) differs += 1;
  }
  assert.ok(differs >= withPassage.length * 0.8, `a new seed reshuffles the banks (${differs})`);
});

test("placing: a wrong word is not accepted and never shown; a right one is, with first-try credit once", () => {
  for (const l of withPassage.slice(0, 40)) {
    const s = build(poolOf(l));
    const page = s.pages[0];
    const pg = s.st[0];
    const wrong = page.bank.findIndex((_, j) => !STORY.fits(page, 0, j));
    if (wrong >= 0) {
      const before = JSON.stringify(pg.placed);
      const r = STORY.place(page, pg, 0, wrong);
      assert.deepEqual([r.changed, r.ok, r.first], [true, false, false], `${l.id}: a miss`);
      assert.equal(JSON.stringify(pg.placed), before, `${l.id}: a miss fills nothing`);
      assert.equal(pg.last.ok, false);
      const again = STORY.place(page, pg, 0, STORY.fitting(page, 0)[0]);
      assert.deepEqual(
        [again.ok, again.first],
        [true, false],
        `${l.id}: right after a miss is not first try`,
      );
    } else {
      const r = STORY.place(page, pg, 0, STORY.fitting(page, 0)[0]);
      assert.deepEqual([r.ok, r.first], [true, true], `${l.id}: first try`);
    }
    // A filled blank and a used word are not reusable; an unknown blank or word changes nothing.
    assert.equal(STORY.place(page, pg, 0, 0).changed, false);
    assert.equal(STORY.place(page, pg, 99, 0).changed, false);
    assert.equal(STORY.place(page, pg, 1, 99).changed, false);
  }
});

test("hints: a ladder of three that never prints the word, and only ever removes a wrong word", () => {
  for (const l of withPassage) {
    const pool = poolOf(l);
    const s = build(pool);
    const page = s.pages[0];
    const pg = s.st[0];
    const k = STORY.hintTarget(page, pg, null);
    assert.equal(k, 0);
    const word = pool.byId.get(page.blanks[0].wordId);
    for (let n = 1; n <= 3; n++) {
      assert.equal(STORY.hint(page, pg, 0), true);
      const text = STORY.hintText(word, n, { kind: "It is a", starts: "it starts with" });
      assert.ok(text.length > 3, `${l.id}: hint ${n} says something`);
      assert.ok(!findForm(text, word), `${l.id}: hint ${n} never prints "${word.hw}"`);
    }
    assert.equal(STORY.hint(page, pg, 0), false, `${l.id}: three hints, then no more`);
    for (const j of pg.hidden)
      assert.equal(page.bank[j].extra, true, `${l.id}: a hint removes only a wrong word`);
    assert.ok(pg.hidden.length <= 1);
  }
});

// ── the view, with a stub env ───────────────────────────────────────────────────────────────────────────────────
const envFor = (pool, mode = "en") => {
  const I = makeI18n(mode, "en");
  return {
    I,
    uid: "t",
    pool,
    band: pool.band,
    ctx: {},
    sup: { glossaryEs: false },
    pic: () => "",
    speakBtn: () => "",
    gloss: () => "",
    say() {},
    use() {},
    report() {},
    save() {},
  };
};
const textRegion = (h) => {
  const m =
    /<div\s+class="va-st-text[\s\S]*?(?=<h3 class="va-st-h"|<div\s+class="vag-actions")/.exec(h);
  return m ? strip(m[0]) : "";
};

test("the page view prints no answer in the story text, after a miss, or in a hint", () => {
  for (const l of withPassage) {
    const pool = poolOf(l);
    const env = envFor(pool);
    const s = build(pool);
    const targets = STORY.targetsOf(pool);
    const page = s.pages[0];
    const noAnswer = (htmlText, what) => {
      for (const w of targets)
        assert.ok(!findForm(htmlText, w), `${l.id}: ${what} prints "${w.hw}"`);
    };
    let h = render(s, env);
    noAnswer(textRegion(h), "the blank page");
    assert.ok(/va-st-blank/.test(h) && /va-st-chip/.test(h), `${l.id}: blanks and a bank`);
    // A miss.
    const wrong = page.bank.findIndex((_, j) => !STORY.fits(page, 0, j));
    if (wrong >= 0) STORY.place(page, s.st[0], 0, wrong);
    h = render(s, env);
    if (wrong >= 0) {
      assert.match(strip(h), /That word does not fit here, try another\./);
      const fb = /vag-fb-retry[\s\S]*?<\/p>/.exec(h)?.[0] || "";
      noAnswer(strip(fb), "the miss message");
      noAnswer(textRegion(h), "the text after a miss");
    }
    // Two hints.
    STORY.hint(page, s.st[0], 0);
    STORY.hint(page, s.st[0], 0);
    h = render(s, env);
    const hintFb = /vag-fb-hint[\s\S]*?<\/p>/.exec(h)?.[0] || "";
    assert.ok(hintFb, `${l.id}: a hint is shown`);
    noAnswer(strip(hintFb), "the hint");
  }
});

test("a restored page comes alive with a scene and tappable words; the story view returns the whole text", () => {
  for (const l of withPassage.slice(0, 60)) {
    const pool = poolOf(l);
    const env = envFor(pool, "bi");
    const s = build(pool);
    solve({ pages: [s.pages[0]], st: [s.st[0]] });
    const h = render(s, env);
    assert.match(h, /is-alive/, `${l.id}: the page is alive`);
    assert.match(h, /va-st-scene/);
    assert.equal(
      (h.match(/data-st-word=/g) || []).length,
      s.pages[0].blanks.length,
      `${l.id}: every restored word opens its meaning`,
    );
    assert.ok(!/class="va-st-chip"/.test(h), `${l.id}: the bank gives way to the story`);
    solve(s);
    s.stage = "story";
    const whole = render(s, env);
    const region =
      /class="va-st-text va-st-whole"[^>]*>([\s\S]*?)<div class="va-st-listen"/.exec(whole)?.[1] ||
      "";
    const bare = (t) => t.replace(/\s+/g, "");
    assert.equal(
      bare(strip(region)),
      bare(authored(l).join(" ")),
      `${l.id}: the whole restored story is the authored passage`,
    );
    assert.match(whole, /va-st-retell/, `${l.id}: the retell box`);
  }
});

test("early grades: short pages and a word bank with pictures", () => {
  const early = withPassage.filter((l) => ["K", "1", "2"].includes(l.grade));
  assert.ok(early.length >= 30);
  for (const l of early) {
    const pool = poolOf(l);
    const s = build(pool);
    assert.equal(pool.band, "early");
    for (const page of s.pages) assert.ok(page.blanks.length <= 3, `${l.id}: at most 3 blanks`);
    const pics = [];
    const env = {
      ...envFor(pool),
      pic: (w) => (pics.push(w.id), `<span class="vag-pic">${w.visual.glyphs.join("")}</span>`),
    };
    const h = render(s, env);
    assert.ok(
      /va-st-chip-pic/.test(h) || !s.pages[0].bank.some((c) => pool.byId.get(c.wordId)?.visual),
      `${l.id}: pictures in the bank`,
    );
    // Fewer sentences per page than the older grades (blank-free text can ride along on a page).
    const sents = s.pages.map((p) =>
      p.blocks.reduce((n, b) => n + b.segs.filter((x) => x[0] === "b").length, 0),
    );
    assert.ok(Math.max(...sents) <= 3);
  }
});

test("the retell frame has both languages for every kind of passage", () => {
  for (const genre of [
    "narrative",
    "dialogue",
    "biography",
    "history",
    "description",
    "informational",
    "science",
    "argument",
    "",
  ])
    for (const band of ["early", "upper-elem", "middle", "high"]) {
      const [en, es] = STORY.retellFrame(genre, band);
      assert.ok(en.includes("___") && es.includes("___") && en !== es, `${genre}/${band}`);
    }
});

test("Story Restore is a registered unit activity with both languages", () => {
  const e = extraOf("story");
  assert.ok(e, "registered under the id story");
  assert.equal(EXTRAS.filter((x) => x.id === "story").length, 1);
  for (const key of ["title", "short", "blurb", "lead", "assign", "doneLabel"]) {
    assert.ok(Array.isArray(e[key]) && e[key].length === 2 && e[key][0] && e[key][1], key);
    assert.notEqual(e[key][0], e[key][1], `${key} differs by language`);
  }
  assert.equal(typeof e.load, "function");
  assert.ok(e.icon);
  for (const [, [en, es]] of Object.entries(STORY.storySpec.keys)) assert.ok(en || es);
  for (const [en, es] of STORY.storySpec.howTo) assert.ok(en && es && en !== es);
});

test("Story Restore keeps Joel's game rules: no timers, no links out, no answer on a miss, no purple", () => {
  const src = readFileSync(new URL("unit/story.js", VA), "utf8");
  assert.ok(
    !/setInterval|setTimeout|requestAnimationFrame|countdown|timeLeft|seconds left|timer/i.test(
      src,
    ),
    "nothing counts down",
  );
  assert.ok(!/href="[^"]*(games|curriculum)\/?"/.test(src), "no link back to a hub");
  assert.ok(
    !/fetch\(|XMLHttpRequest|sendBeacon|localStorage/.test(src),
    "the retell stays on the device: no network, no direct storage",
  );
  const css = readFileSync(new URL("access-practice-lab/vocab-academy-story.css", ROOT), "utf8");
  assert.ok(!/#(?:[0-9a-f]{0,2})?(?:7c3aed|8b5cf6|6d28d9|a78bfa|5b21b6)/i.test(css), "no purple");
  assert.ok(/prefers-reduced-motion/.test(css), "reduced motion is handled");
  assert.ok(!/(\d+(?:\.\d+)?)s\s+infinite|infinite/.test(css), "no endless animation");
  const index = readFileSync(new URL("index.js", VA), "utf8");
  assert.ok(
    /"unit-activity":[^\n]*vocab-academy-story\.css/.test(index),
    "the stylesheet loads on the unit activity page",
  );
});
