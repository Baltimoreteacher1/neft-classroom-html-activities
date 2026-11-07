// K–3 bands: the early home, Story Time, Sound Builder, picture word cards, family time and the K/1/2–3 content
// (access-practice-lab/src/views/early-hub.js, src/early/*.js, content/g{K,1,2-3}/). JSDOM mounts each page the way
// the router does; content checks run on the built files and on the specs they come from.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM(
  "<!doctype html><body><main id='app'></main><div id='labLive'></div></body>",
  { url: "https://thelanguagepage.com/access-practice-lab/early?grades=K" },
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.localStorage = dom.window.localStorage;
globalThis.location = dom.window.location;
const spoken = [];
dom.window.speechSynthesis = {
  speak: (u) => (spoken.push(u.text), setTimeout(() => u.onend?.(), 0)),
  cancel() {},
  getVoices: () => [],
};
globalThis.speechSynthesis = dom.window.speechSynthesis;
globalThis.SpeechSynthesisUtterance = dom.window.SpeechSynthesisUtterance = class {
  constructor(t) {
    this.text = t;
  }
};
const contentRoot = new URL("../access-practice-lab/content/", import.meta.url);
globalThis.fetch = async (url) => {
  const rel = String(url).replace(/^.*\/access-practice-lab\/content\//, "");
  return {
    ok: true,
    json: async () => JSON.parse(readFileSync(new URL(rel, contentRoot), "utf8")),
  };
};

const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const hub = await import("../access-practice-lab/src/views/early-hub.js");
const phonics = await import("../access-practice-lab/src/early/phonics.js");
const story = await import("../access-practice-lab/src/early/story.js");
const words = await import("../access-practice-lab/src/early/words.js");
const family = await import("../access-practice-lab/src/early/family.js");
const { CONTENT_BANDS } = await import("../access-practice-lab/src/bands.js");
const { buildIndex, loadBand } = await import("./lib/access-lab-content.mjs");
const { earlyProblems } = await import("./lib/access-early-rules.mjs");

function ctxFor(band, view = "home", id = "", mode = "en") {
  const ctx = {
    band,
    bands: CONTENT_BANDS,
    prefs: {},
    route: { view, id },
    setPrefs(p) {
      Object.assign(ctx.prefs, p);
    },
    rerender: async () => draw(),
  };
  const I = makeI18n(mode, "en");
  let out = null;
  const root = document.getElementById("app");
  async function draw() {
    out = await (view === "home" ? hub.render(ctx) : hub.render(ctx));
    root.innerHTML = toHtml(out.html);
    return out;
  }
  return {
    ctx,
    I,
    root,
    draw,
    click: (sel) => hub.onClick({ target: root.querySelector(sel) }, ctx),
  };
}

test("index: K, 1 and 2-3 ship content and the picker lists exactly K, 1, 2-3, 4-5, 6-8", () => {
  const index = buildIndex();
  for (const b of ["K", "1", "2-3"]) assert.ok(index.bands[b], `band ${b} in index`);
  assert.deepEqual(
    index.gradeBands.map((g) => g.id),
    ["K", "1", "2-3", "4-5", "6-8"],
  );
  for (const g of index.gradeBands.filter((x) => ["K", "1", "2-3"].includes(x.id)))
    assert.match(g.entry, /\/access-practice-lab\/early\?grades=/);
  const committed = JSON.parse(readFileSync(new URL("index.json", contentRoot), "utf8"));
  assert.deepEqual(committed.gradeBands, index.gradeBands, "content/index.json is current");
});

test("grades 2–3 band: every domain, near the grades 3–5 shape (A/B/C), talk tasks 1 and 3, paper writing", () => {
  const files = Object.fromEntries(loadBand("2-3").map((d) => [d.domain, d.data]));
  for (const d of ["Listening", "Reading", "Speaking", "Writing"])
    for (const lk of ["A", "B", "C"])
      assert.ok(files[d].levels[lk].activities.length >= 4, `${d} ${lk}`);
  const talk = Object.values(files.Speaking.levels).flatMap((l) => l.activities);
  assert.ok(
    talk.some((a) => a.taskLevel === 1) && talk.some((a) => a.taskLevel === 3),
    "talk tasks 1 and 3",
  );
  assert.ok(
    talk.every((a) => a.modelStudent?.name && a.modelStudent?.text),
    "model student on every speaking task",
  );
  assert.ok(
    talk.every((a) => /age [78]/.test(a.modelStudent.name)),
    "grades 2–3 model students are 7 or 8",
  );
  const writing = Object.values(files.Writing.levels).flatMap((l) => l.activities);
  assert.ok(
    writing.every((a) => a.wordBank?.length && a.paperLines >= 2),
    "paper writing with a word bank and lines",
  );
});

test("grade 1 band: age-matched model students, picture answers, printable writing", () => {
  const files = Object.fromEntries(loadBand("1").map((d) => [d.domain, d.data]));
  const all = Object.values(files).flatMap((f) =>
    Object.values(f.levels).flatMap((l) => l.activities),
  );
  assert.ok(all.length >= 24);
  for (const a of all.filter((x) => x.modelStudent)) assert.match(a.modelStudent.name, /age 6/);
  for (const a of all.filter((x) => x.options))
    assert.ok(
      a.options.every((o) => o.visual || o.scene),
      a.id,
    );
});

test("every K–3 activity passes the early-band rules and has spoken Spanish directions", () => {
  for (const band of ["K", "1", "2-3"])
    for (const { domain, data } of loadBand(band))
      for (const L of Object.values(data.levels))
        for (const a of L.activities) {
          assert.ok(a.directionsEs && a.promptEs, a.id);
          if (earlyProblems) assert.deepEqual(earlyProblems(a, domain), [], a.id);
        }
});

test("early home: band switch with five bands, audio-first setting, skills and extras", async () => {
  const { root, draw, click, ctx } = ctxFor("K");
  await draw();
  assert.equal(root.querySelectorAll("[data-set-band]").length, 5);
  assert.ok(
    root.querySelector('a[href*="/early/story"]'),
    "Kindergarten home leads with Story Time",
  );
  for (const p of ["phonics", "words", "family"])
    assert.ok(root.querySelector(`a[href*="/early/${p}"]`), p);
  assert.ok(root.querySelectorAll(".early-skill").length >= 4);
  const btn = root.querySelector("[data-early-audio]");
  assert.equal(btn.getAttribute("aria-pressed"), "true");
  click("[data-early-audio]");
  assert.equal(ctx.prefs.audioFirst.K, false, "the switch stores the band's choice");
  const g23 = ctxFor("2-3");
  await g23.draw();
  assert.ok(
    !g23.root.querySelector('a[href*="/early/story"]'),
    "Story Time is listed for Kindergarten only",
  );
  assert.ok(g23.root.querySelector('a[href*="/Listening/A/g23-"]'));
});

test("Story Time: adult-read pages, spoken questions, no score, class mode, retell page", async () => {
  const s = ctxFor("K", "early", "story");
  await s.draw();
  assert.ok(s.root.querySelector(".early-scene svg"));
  assert.ok(s.root.querySelector("[data-story-say='ask']"));
  assert.ok(/not a test/i.test(s.root.textContent));
  assert.ok(!/score:|correct!|wrong/i.test(s.root.textContent));
  for (let i = 0; i < story.STORY.pages.length; i++) {
    s.click("[data-story-go]:not([disabled]).btn-primary");
    await s.draw();
  }
  assert.ok(/Retell the story/.test(s.root.textContent));
  assert.equal(s.root.querySelectorAll(".early-retell svg").length, 4);
  s.click("[data-story-mode]");
  await s.draw();
  assert.ok(s.root.querySelector(".early-story.is-class"));
  for (const p of story.STORY.pages)
    for (const k of ["text", "ask", "listen"])
      assert.ok(p[k][0] && p[k][1], `${p.scene} ${k} EN/ES`);
});

test("Sound Builder: a real game; wrong tiles keep every tile, the word is never filled in, a full garden wins", async () => {
  for (const [band, set] of Object.entries(phonics.SETS))
    for (const [word, sounds] of set) {
      assert.equal(sounds.join(""), word, `${band} ${word} tiles spell the word`);
      for (const s of sounds) assert.ok(phonics.SOUNDS[s], `sound ${s}`);
      const tiles = phonics.tilesFor(word, sounds);
      assert.ok(tiles.length > sounds.length, "distractor tiles exist");
      assert.notEqual(
        tiles
          .slice(0, sounds.length)
          .map((t) => t.s)
          .join(""),
        word,
        "tiles never start in order",
      );
    }
  assert.deepEqual(phonics.place(["c", "a", "t"], [], { id: "x", s: "a" }), {
    ok: false,
    placed: [],
  });
  assert.deepEqual(phonics.place(["c", "a", "t"], [], { id: "w0", s: "c" }), {
    ok: true,
    placed: ["w0"],
  });
  localStorage.clear();
  const s = ctxFor("K", "early", "phonics");
  await s.draw();
  const set = phonics.SETS.K;
  for (const [word, sounds] of set) {
    const before = s.root.querySelectorAll("[data-ph-tile]").length;
    const wrong = [...s.root.querySelectorAll("[data-ph-tile]")].find(
      (b) => b.textContent.trim() !== sounds[0],
    );
    s.click(`[data-ph-tile="${wrong.dataset.phTile}"]`);
    await s.draw();
    assert.equal(
      s.root.querySelectorAll("[data-ph-tile]").length,
      before,
      "no tile is removed after a miss",
    );
    assert.equal(
      s.root.querySelectorAll(".early-ph-letter").length,
      0,
      "nothing is filled in for the child",
    );
    for (const snd of sounds) {
      const tile = [...s.root.querySelectorAll("[data-ph-tile]:not([disabled])")].find(
        (b) => b.textContent.trim() === snd,
      );
      s.click(`[data-ph-tile="${tile.dataset.phTile}"]`);
      await s.draw();
    }
    assert.ok(new RegExp(`You built ${word}`).test(s.root.textContent));
    s.click("[data-ph-next]");
    await s.draw();
  }
  assert.ok(/You grew the whole garden/.test(s.root.textContent), "win state");
  const src = readFileSync(
    new URL("../access-practice-lab/src/early/phonics.js", import.meta.url),
    "utf8",
  );
  assert.ok(
    !/setTimeout|setInterval|Math\.random|countdown|seconds left/i.test(src),
    "no timer and no luck",
  );
});

test("picture word cards: Spanish word optional and off by default; family activities EN/ES", async () => {
  localStorage.clear();
  const w = ctxFor("1", "early", "words");
  await w.draw();
  assert.equal(w.root.querySelectorAll(".early-card-es").length, 0);
  w.click("[data-words-es]");
  await w.draw();
  assert.equal(w.root.querySelectorAll(".early-card-es").length, words.DECKS[0].cards.length);
  for (const d of words.DECKS)
    for (const [en, es, pic] of d.cards)
      assert.ok((en && es && pic && en !== es) || ["bus"].includes(en), `${d.id} ${en}`);
  const f = ctxFor("1", "early", "family");
  await f.draw();
  assert.equal(f.root.querySelectorAll(".early-fam").length, family.FAMILY_ACTIVITIES.length);
  for (const a of family.FAMILY_ACTIVITIES) assert.equal(a.steps.length, a.stepsEs.length, a.id);
  const es = ctxFor("1", "early", "family", "es");
  es.ctx.prefs.lang = "es";
});
