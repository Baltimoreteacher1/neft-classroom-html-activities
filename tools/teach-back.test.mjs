// Teach It Back (access-practice-lab/src/teachback). Pins the rules a learner and a teacher rely on: enough accurate
// content with Spanish, a model answer that is not in the idea card, quotes that are verbatim, no score or level
// wording, no network, short-text honesty, and supported and independent tries kept apart.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  analyze,
  compare,
  key,
  quoted,
  SHORT_WORDS,
} from "../access-practice-lab/src/teachback/check.js";
import {
  BANDS,
  bySubject,
  CONCEPTS,
  conceptById,
  ownChoices,
  SUBJECTS,
} from "../access-practice-lab/src/teachback/concepts.js";
import {
  blankState,
  currentId,
  endSession,
  isSupported,
  markExplained,
  modelVisible,
  normalizeState,
  recordAttempt,
  startOwn,
  startRevision,
} from "../access-practice-lab/src/teachback/session.js";
import { hasVisual } from "../access-practice-lab/src/teachback/visuals.js";

const LAB = fileURLToPath(new URL("../access-practice-lab/", import.meta.url));
const read = (p) => readFileSync(LAB + p, "utf8");
const MINE = [
  ...readdirSync(`${LAB}src/teachback`).map((f) => `src/teachback/${f}`),
  "src/views/teach-back.js",
];
const CODE = MINE.filter((f) => !/concepts-/.test(f));
const sentences = (t) =>
  t
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
const norm = (t) =>
  t
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

test("content: 24+ concepts, 12 per band, all five subjects, unique ids, a different idea to try on your own", () => {
  assert.ok(CONCEPTS.length >= 24);
  assert.equal(new Set(CONCEPTS.map((c) => c.id)).size, CONCEPTS.length);
  for (const band of BANDS) {
    assert.equal(CONCEPTS.filter((c) => c.band === band).length, 12, `${band} has 12`);
    assert.deepEqual(
      bySubject(band).map((g) => g.subject),
      SUBJECTS,
      `${band} covers every subject`,
    );
    for (const g of bySubject(band))
      assert.ok(g.items.length >= 2, `${band} ${g.subject} needs two ideas for "on my own"`);
  }
  for (const c of CONCEPTS) {
    const own = ownChoices(c);
    assert.ok(own.length >= 1, `${c.id} has an on-my-own choice`);
    assert.ok(own.every((o) => o.id !== c.id && o.band === c.band && o.subject === c.subject));
  }
});

test("content: every concept is complete, in English and Spanish, with three points that each have words and a frame", () => {
  for (const c of CONCEPTS) {
    for (const [name, o] of [
      ["title", c.title],
      ["idea", c.idea],
      ["audience", c.audience],
    ]) {
      assert.ok(o.en?.length > 8 && o.es?.length > 8, `${c.id} ${name} en+es`);
      assert.notEqual(o.en, o.es, `${c.id} ${name} Spanish is not a copy`);
    }
    assert.ok(
      sentences(c.idea.en).length >= 2 && sentences(c.idea.en).length <= 4,
      `${c.id} idea is 2-4 sentences`,
    );
    assert.ok(
      /[áéíóúñ¿¡]|\b(el|la|los|las|de|que|un|una|es)\b/i.test(c.idea.es),
      `${c.id} idea.es reads as Spanish`,
    );
    assert.ok(c.terms.length >= 3 && c.terms.length <= 4, `${c.id} 3-4 terms`);
    for (const t of c.terms) assert.ok(t.w && t.es && t.gloss, `${c.id} term ${t.w}`);
    assert.equal(c.points.length, 3, `${c.id} has 3 points`);
    assert.equal(new Set(c.points.map((p) => p.id)).size, 3);
    for (const p of c.points) {
      assert.ok(p.en && p.es && p.es !== p.en, `${c.id}.${p.id} en+es`);
      assert.ok(p.accept.length >= 5, `${c.id}.${p.id} has accepted words`);
      const fold = (t) =>
        t
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const spanishOnly = p.accept.some((a) => {
        const w = fold(a.split("+")[0].replace(/\*/g, "").trim());
        return w.length > 2 && fold(p.es).includes(w) && !fold(p.en).includes(w);
      });
      assert.ok(
        spanishOnly,
        `${c.id}.${p.id} accepts at least one Spanish word from its own Spanish text`,
      );
      assert.match(p.frame, /_{2,}/, `${c.id}.${p.id} frame has a blank`);
    }
    assert.ok(sentences(c.modelAnswer.en).length >= 3, `${c.id} model answer is substantial`);
    if (c.visual) assert.ok(hasVisual(c.visual), `${c.id} visual exists`);
  }
});

test("content: no concept states its own model answer in the idea card, and no frame hands over the model", () => {
  for (const c of CONCEPTS) {
    const idea = norm(c.idea.en);
    assert.ok(!idea.includes(norm(c.modelAnswer.en)), `${c.id} idea contains the model`);
    for (const s of sentences(c.modelAnswer.en))
      assert.ok(!idea.includes(norm(s)), `${c.id}: model sentence repeated in idea: ${s}`);
    for (const p of c.points)
      assert.ok(
        !norm(c.modelAnswer.en).includes(norm(p.frame.replace(/_+/g, " "))),
        `${c.id}.${p.id} frame is a model sentence`,
      );
  }
});

test("engine: each model answer finds all three key points, and an off-topic text finds none", () => {
  const off =
    "My dog likes to run in the park on sunny days with my friends and we eat lunch together.";
  for (const c of CONCEPTS) {
    const r = analyze(c, c.modelAnswer.en);
    assert.deepEqual(
      r.covered,
      c.points.map((p) => p.id),
      `${c.id} model covers all points`,
    );
    assert.equal(
      analyze(c, off).covered.length,
      0,
      `${c.id} accept words are not so loose that off-topic text matches`,
    );
    assert.equal(analyze(c, c.idea.en).words > 0, true);
  }
});

test("engine: every quote is a verbatim part of the learner's text; an observation without a quote is dropped", () => {
  const messy = (t) =>
    `  ${t.replace(/\. /g, ".   ")}\n\nI also think it is cool because I like it!  `;
  for (const c of CONCEPTS) {
    const texts = [
      c.modelAnswer.en,
      messy(c.modelAnswer.en),
      sentences(c.modelAnswer.en)[0],
      c.idea.es,
      `${sentences(c.modelAnswer.en).slice(1).join(" ")} ${"extra words ".repeat(40)}`,
    ];
    for (const text of texts) {
      const r = analyze(c, text);
      const quotes = [
        ...r.points.map((p) => p.quote).filter(Boolean),
        r.strength?.quote,
        r.nextStep?.quote,
      ].filter(Boolean);
      for (const q of quotes) assert.ok(text.includes(q), `${c.id}: quote not verbatim: ${q}`);
      assert.ok(r.strength === null || r.strength.quote.length > 0);
    }
  }
  assert.equal(quoted("hello world", { quote: "hello" })?.quote, "hello");
  assert.equal(quoted("hello world", { quote: "goodbye" }), null);
  assert.equal(quoted("hello world", { quote: "" }), null);
  assert.equal(quoted("hello world", null), null);
  assert.equal(analyze(CONCEPTS[0], "").strength, null);
});

test("engine: a long sentence is quoted as a window of the learner's own words, not the whole run", () => {
  const c = conceptById("area-vs-perimeter");
  const long = `${"I really want to say that ".repeat(8)}perimeter goes around the outside of the shape ${"and then I keep on talking about other things ".repeat(6)}.`;
  const r = analyze(c, long);
  const q = r.points[0].quote;
  assert.ok(long.includes(q) && q.length < long.length && /around/.test(q));
});

test("engine: under 12 words it says so and makes no sentence-variety claims", () => {
  const c = conceptById("water-cycle");
  const short = "Water evaporates because the Sun is hot, for example.";
  const r = analyze(c, short);
  assert.ok(r.words < SHORT_WORDS && r.short);
  assert.ok(
    !["example", "link"].includes(r.strength?.kind),
    "no example or linking claim on a short text",
  );
  assert.notEqual(r.nextStep?.kind, "add-example");
  assert.equal(analyze(c, `${short} ${short}`).short, false);
});

test("engine: matches inflections, accents and Spanish words", () => {
  const c = conceptById("three-branches");
  assert.ok(analyze(c, "Congress makes the laws for everyone.").covered.includes("p1"));
  assert.ok(analyze(c, "El presidente hace cumplir las leyes.").covered.includes("p2"));
  assert.ok(analyze(c, "Los TRIBUNALES decidieron.").covered.includes("p3"));
  assert.equal(key("makes"), key("make"));
  assert.equal(key("Evaporación") === key("evaporacion"), true);
  const m = conceptById("mean-vs-median");
  assert.ok(analyze(m, "Un valor atípico mueve la media.").covered.includes("p3"));
});

test("engine: it gives no score, level, percent or rank, and never judges delivery or grammar", () => {
  const r = analyze(CONCEPTS[0], CONCEPTS[0].modelAnswer.en);
  assert.deepEqual(Object.keys(r).sort(), [
    "covered",
    "empty",
    "missing",
    "nextStep",
    "points",
    "short",
    "strength",
    "words",
  ]);
  const c = compare(
    CONCEPTS[0],
    "short try",
    "a different and longer try about the perimeter around a shape",
  );
  assert.ok(!Object.keys(c).some((k) => /better|worse|score|level|improv|rank/i.test(k)));
  const banned =
    /\b(scores?|streaks?|ranks?|ranking|leaderboards?|timers?|countdown|percent(age)?|levels?|accent|dialect|fluency|pronunciation|grammar)\b|\d\s?%/i;
  for (const f of CODE) {
    const strings = read(f)
      .replace(/^\s*\/\/.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");
    const ui = strings.match(/(["'`])(?:(?!\1)[^\\\n]|\\.){12,}\1/g) || [];
    for (const s of ui)
      if (!/fine|tb-|data-|accent|dialect|grammar/.test(s) || /"[A-Z].*\s.*"/.test(s))
        assert.ok(
          !/\b(scores?|streaks?|leaderboards?|timers?|percent(age)?|levels?)\b|\d\s?%/i.test(s),
          `${f}: banned wording in ${s.slice(0, 60)}`,
        );
    assert.ok(
      !/\bscore\b|\bstreak\b|leaderboard/i.test(strings),
      `${f}: no score or streak anywhere`,
    );
  }
  assert.ok(banned.test("your score"), "the detector fires");
});

test("compare: lists what changed, counts words both ways, and never calls longer better", () => {
  const c = conceptById("mean-vs-median");
  const a = "You add all the numbers and divide to get the average of the data.";
  const b = `${a} The middle number after you put them in order is the median.`;
  const up = compare(c, a, b);
  assert.ok(up.addedCount >= 8 && up.removedCount === 0);
  assert.deepEqual(
    up.newPoints.map((n) => n.id),
    ["p2"],
  );
  for (const n of up.newPoints) assert.ok(b.includes(n.quote));
  const down = compare(c, b, a);
  assert.ok(down.removedCount >= 8 && down.lostPoints.includes("p2"));
  assert.equal(compare(c, a, a).same, true);
});

test("session: supported and independent tries are stored separately, and the summary can tell them apart", () => {
  const s = blankState();
  s.session = { ...normalizeState({ session: { id: "mean-vs-median" } }).session };
  const sess = s.session;
  assert.equal(isSupported(sess), false);
  const first = recordAttempt(s, {
    text: "no frames used here",
    analysis: analyze(CONCEPTS[0], "x"),
  });
  assert.equal(first.supported, false);
  assert.equal(s.records.independent.length, 1);
  assert.equal(s.records.supported.length, 0);

  sess.framesUsed = true;
  assert.equal(isSupported(sess), true, "opening frames marks the try supported");
  recordAttempt(s, { text: "frames were open" });
  assert.equal(s.records.supported.length, 1);

  startRevision(sess, "frames were open");
  assert.equal(sess.phase, "revise");
  assert.equal(isSupported(sess), true, "a revision after feedback is supported");
  recordAttempt(s, { text: "revised" });
  assert.equal(s.records.supported.length, 2);

  assert.equal(startOwn(sess, "mean-vs-median"), false, "on my own must be a different idea");
  assert.equal(startOwn(sess, "photosynthesis"), false, "and from the same subject");
  assert.equal(startOwn(sess, "ratios"), true);
  assert.equal(currentId(sess), "ratios");
  assert.equal(isSupported(sess), false, "on my own starts with no frames");
  const own = recordAttempt(s, { text: "independent again" });
  assert.equal(own.supported, false);
  assert.equal(s.records.independent.length, 2);
  assert.equal(own.conceptId, "ratios");
  assert.deepEqual(
    s.records.independent.map((r) => r.phase),
    ["first", "own"],
  );

  markExplained(s);
  assert.equal(s.explained.ratios.independent, true);
  endSession(s);
  assert.equal(s.session, null);
  assert.ok(
    s.records.independent.length === 2 && s.records.supported.length === 2,
    "records outlive the session",
  );
});

test("session: the model answer is withheld until the learner has made a first try at that idea", () => {
  const s = blankState();
  s.session = normalizeState({ session: { id: "water-cycle" } }).session;
  assert.equal(modelVisible(s.session, "water-cycle"), false);
  recordAttempt(s, { text: "water goes up and down" });
  assert.equal(modelVisible(s.session, "water-cycle"), true);
  assert.equal(
    modelVisible(s.session, "food-web"),
    false,
    "a try at one idea does not unlock another",
  );
  const view = read("src/teachback/ui-teach.js");
  assert.match(view, /modelVisible\(sess, concept\.id\)/);
  assert.equal(
    view.match(/modelAnswer/g).length,
    1,
    "modelAnswer is rendered in exactly one place, behind modelVisible",
  );
  assert.ok(
    !/modelAnswer/.test(read("src/teachback/ui.js")) &&
      !/modelAnswer/.test(read("src/views/teach-back.js")),
  );
});

test("session: stored state is normalised, drafts survive, recordings are never in the key", () => {
  const n = normalizeState({
    session: {
      id: "ratios",
      step: "teach",
      draft: "typed so far",
      mode: "record",
      audioId: "t1abc",
      plan: ["p1", 7],
    },
    records: { supported: "bad" },
  });
  assert.equal(n.session.step, "teach");
  assert.equal(n.session.draft, "typed so far");
  assert.deepEqual(n.session.plan, ["p1"]);
  assert.deepEqual(n.records.supported, []);
  assert.equal(normalizeState(null).session, null);
  assert.equal(normalizeState({ session: { id: "x", step: "nope" } }).session.step, "learn");
  const json = JSON.stringify(n);
  assert.ok(!/blob|ArrayBuffer|data:audio/.test(json));
  assert.match(read("src/teachback/store.js"), /accessPracticeLab:v1:teach-back/);
});

test("no network: no fetch, XHR, beacon, socket, external script or external URL in any Teach It Back file", () => {
  const net =
    /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket|EventSource|importScripts)\b|https?:\/\/(?!www\.w3\.org)|new Image\(/;
  for (const f of MINE)
    assert.ok(!net.test(read(f).replace(/^\s*\/\/.*$/gm, "")), `${f} touches the network`);
  assert.ok(!/https?:\/\//.test(read("teach-back.css")));
});

test("accessibility and design source rules: one h1, labelled controls, tokens only, real icons, no emoji", () => {
  const view = read("src/views/teach-back.js");
  assert.equal(view.match(/<h1\b/g).length, 1);
  for (const f of MINE.filter((x) => /ui/.test(x)))
    assert.ok(!/<h1\b/.test(read(f)), `${f} has no second h1`);
  const teach = read("src/teachback/ui-teach.js");
  assert.match(teach, /<label class="tb-label" for="tbText">/);
  assert.match(teach, /aria-live="polite"/);
  assert.match(teach, /aria-expanded=/);
  assert.match(teach, /aria-pressed=/);
  const css = read("teach-back.css");
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(css.replace(/\/\*[\s\S]*?\*\//g, "")), "no raw hex colour");
  assert.ok(
    !/gradient|purple|violet|magenta|rgb\(|hsl\(/i.test(css),
    "no gradient, purple, rgb or hsl",
  );
  const ds = read("ds.css");
  for (const m of css.matchAll(/var\((--[a-z0-9-]+)/g))
    assert.ok(ds.includes(`${m[1]}:`), `${m[1]} is a ds.css token`);
  assert.match(css, /prefers-reduced-motion/);
  const sprite = readFileSync(`${LAB}pictures/ui-icons.svg`, "utf8");
  for (const f of MINE)
    for (const m of read(f).matchAll(/icon\("([a-z-]+)"\)/g))
      assert.ok(sprite.includes(`id="${m[1]}"`), `${f}: icon ${m[1]} exists`);
  for (const f of [...MINE, "teach-back.css"])
    assert.ok(!/\p{Extended_Pictographic}/u.test(read(f).replace(/[÷]/g, "")), `${f} has no emoji`);
});

test("wiring: the doc exists, is short, and names the files", () => {
  assert.ok(existsSync(`${LAB}TEACH-BACK.md`));
  const doc = read("TEACH-BACK.md");
  assert.ok(doc.split("\n").length <= 40);
  for (const f of ["concepts", "check.js", "session.js", "store.js"])
    assert.ok(doc.includes(f), `doc mentions ${f}`);
});
