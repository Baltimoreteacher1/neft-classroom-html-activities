// Misconception Detective (access-practice-lab/src/claimcheck). Pins the rules a learner and a teacher rely on: the case
// bank is whole and correct, every number is recomputed here independently of the data, hints and nudges never give the
// flawed line or the fix, right answers are spread across positions, every quote is a verbatim slice of what the
// learner typed, nothing goes over the network, and there is no score, level, streak, timer or points wording.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CASE_BANDS, CASES, SUBJECTS } from "../access-practice-lab/src/claimcheck/cases.js";
import {
  BUCKETS,
  caseById,
  casesForBand,
  checkSentence,
  chooseFix,
  finish,
  hintFor,
  KINDS,
  MIN_WORDS,
  newState,
  STEPS,
  sanitizeState,
  sortCard,
  sortDone,
  summarize,
  tapLine,
  wrongSortNudge,
} from "../access-practice-lab/src/claimcheck/engine.js";

const LAB = fileURLToPath(new URL("../access-practice-lab/", import.meta.url));
const read = (p) => readFileSync(LAB + p, "utf8");
const words = (t) =>
  String(t)
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) || [];
const shingles = (t, n) => {
  const w = words(t);
  const k = Math.min(n, w.length);
  const out = new Set();
  for (let i = 0; i + k <= w.length; i++) out.add(w.slice(i, i + k).join(" "));
  return out;
};
/** True when `text` repeats a run of `n` consecutive words of `source` (or all of `source` when it is shorter). */
const copies = (text, source, n = 5) => {
  const have = shingles(text, n);
  const k = Math.min(n, words(source).length);
  return (
    [...shingles(source, n)].some((s) => s.split(" ").length === k && have.has(s)) &&
    words(text).length >= k &&
    [...shingles(source, n)].some((s) => words(text).join(" ").includes(s))
  );
};
const correct = (c) => c.fix.find((f) => f.correct);
const allText = (c) =>
  [
    c.title,
    ...c.lines,
    ...c.fix,
    c.why,
    c.transfer,
    ...c.cards.map((k) => ({ en: k.en, es: k.es })),
  ]
    .map((x) => `${x.en} ${x.es}`)
    .join(" ");
const KNOWN_FIGURES =
  /^(lincoln|washington|jefferson|obama|trump|biden|einstein|newton|curie|messi|beyonce|oprah|gates|musk|ronaldo|lebron|taylor|elon|mike)$/i;

test("the bank has at least 30 cases: 15 per band, unique ids, across the required subjects", () => {
  assert.ok(CASES.length >= 30);
  for (const b of CASE_BANDS) assert.equal(casesForBand(b).length, 15, b);
  assert.equal(new Set(CASES.map((c) => c.id)).size, CASES.length);
  const subjects = new Set(CASES.map((c) => c.subject));
  for (const [s] of SUBJECTS) assert.ok(subjects.has(s), `subject ${s}`);
  for (const b of CASE_BANDS)
    assert.ok(new Set(casesForBand(b).map((c) => c.subject)).size >= 4, `${b} spans subjects`);
  const concepts = CASES.map((c) => c.concept);
  assert.equal(new Set(concepts).size, concepts.length, "no two cases teach the same concept");
});

test("every case is complete: 3-6 lines, exactly one flawed, nudges for the rest, cards of every kind, three fixes with one right", () => {
  for (const c of CASES) {
    assert.match(c.id, /^[a-z0-9-]+$/);
    assert.ok(
      c.speaker && /^\p{Lu}\p{L}+$/u.test(c.speaker) && !KNOWN_FIGURES.test(c.speaker),
      `${c.id} speaker is one fictional first name`,
    );
    assert.ok(c.lines.length >= 3 && c.lines.length <= 6, `${c.id} lines`);
    assert.ok(
      Number.isInteger(c.flawed) && c.flawed >= 0 && c.flawed < c.lines.length,
      `${c.id} flawed index`,
    );
    assert.equal(c.whyFine.filter((x) => x === null).length, 1, `${c.id}: exactly one flawed line`);
    assert.equal(c.whyFine[c.flawed], null);
    c.whyFine.forEach(
      (n, i) =>
        i !== c.flawed &&
        assert.ok(n?.en?.length > 20 && n?.es?.length > 20, `${c.id} nudge for line ${i + 1}`),
    );
    assert.ok(c.cards.length >= 3 && c.cards.length <= 4, `${c.id} cards`);
    const kinds = new Set(c.cards.map((k) => k.kind));
    for (const k of ["evidence", "assumption", "offtopic"])
      assert.ok(kinds.has(k), `${c.id} has a ${k} card`);
    assert.equal(new Set(c.cards.map((k) => k.id)).size, c.cards.length);
    c.cards.forEach((k) =>
      assert.ok(k.note.en.length > 15 && k.note.es.length > 15, `${c.id} card note`),
    );
    assert.equal(c.fix.length, 3);
    assert.equal(c.fix.filter((f) => f.correct).length, 1, `${c.id} one correct fix`);
    assert.equal(new Set(c.fix.map((f) => f.en)).size, 3);
    assert.ok(c.accept.length >= 3, `${c.id} accept words`);
    assert.ok(c.terms.length >= 2 && c.terms.every((t) => t.w && t.es && t.gloss), `${c.id} terms`);
    assert.ok(c.flaw in KINDS, `${c.id} flaw kind`);
    assert.ok(c.why.en.length > 80 && c.transfer.en.length > 30, `${c.id} reveal text`);
  }
  for (const k of Object.keys(KINDS))
    assert.ok(CASES.filter((c) => c.flaw === k).length >= 2, `flaw kind ${k} used at least twice`);
});

test("Spanish is present and different from the English everywhere a learner can see it", () => {
  const pairs = (c) => [
    c.title,
    c.why,
    c.focus,
    c.transfer,
    ...c.lines,
    ...c.fix,
    ...c.cards.map((k) => ({ en: k.en, es: k.es })),
    ...c.cards.map((k) => k.note),
    ...c.whyFine.filter(Boolean),
  ];
  for (const c of CASES) {
    for (const p of pairs(c)) {
      assert.ok(
        p.en && p.es && p.es.length > 3,
        `${c.id}: Spanish missing for "${String(p.en).slice(0, 40)}"`,
      );
      assert.notEqual(p.es, p.en, `${c.id}: Spanish copied from English: ${p.en.slice(0, 40)}`);
    }
    for (const t of c.terms) assert.ok(t.es.length > 1);
    assert.ok(!/\busted(es)?\b/i.test(JSON.stringify(c)), `${c.id} uses tú, not usted`);
  }
  for (const k of Object.values(KINDS)) assert.ok(k.es && k.explain.es);
  for (const b of Object.values(BUCKETS)) assert.ok(b.es);
});

// Independent recomputation: nothing below reads a number from the data except to compare it with what the arithmetic gives.
const evalSafe = (expr) => {
  assert.match(expr, /^[0-9+\-*/().\s]+$/, `unsafe expression ${expr}`);
  return Function(`"use strict"; return (${expr});`)();
};
const flat = (c) => allText(c).replace(/(\d),(\d)/g, "$1$2");
const has = (text, n) =>
  new RegExp(`(?<![\\d.])${String(n).replace(".", "\\.")}(?![\\d])`).test(
    text.replace(/(\d),(\d)/g, "$1$2"),
  );

test("every recorded calculation is recomputed and the case text states the same numbers", () => {
  let n = 0;
  for (const c of CASES) {
    for (const [expr, value] of c.calc) {
      n++;
      assert.ok(
        Math.abs(evalSafe(expr) - value) < 1e-9,
        `${c.id}: ${expr} is ${evalSafe(expr)}, not ${value}`,
      );
      assert.ok(
        has(flat(c), value),
        `${c.id}: the number ${value} from ${expr} appears nowhere in the case`,
      );
    }
  }
  assert.ok(n >= 20, `only ${n} calculations are recorded`);
});

test("arithmetic cases agree with an independent computation in this file", () => {
  const T = (id) => {
    const c = caseById(id);
    return {
      c,
      line: (i) => c.lines[i].en,
      flawed: c.lines[c.flawed].en,
      right: correct(c).en,
      text: flat(c),
    };
  };
  const perimeter = (l, w) => 2 * (l + w);
  const area = (l, w) => l * w;
  let t = T("m35-perimeter");
  assert.ok(
    t.flawed.includes(String(area(6, 4))) && !t.flawed.includes(String(perimeter(6, 4))),
    "flawed line gives the area as the perimeter",
  );
  assert.ok(
    t.right.includes(String(perimeter(6, 4))) && t.line(2).includes(`= ${perimeter(6, 4)}`),
  );
  t = T("m35-order-ops");
  assert.ok(
    t.flawed.includes("20") && t.right.includes("14") && 2 + 3 * 4 === 14 && (2 + 3) * 4 === 20,
  );
  t = T("m35-place-value");
  assert.ok(
    t.flawed.includes("worth 40.") &&
      t.right.includes("worth 400") &&
      3000 + 400 + 80 + 2 === 3482 &&
      t.text.includes("3482"),
  );
  t = T("ss35-map-scale");
  assert.ok(
    t.flawed.includes("13 kilometers") && t.right.includes("30 kilometers") && 3 * 10 === 30,
  );
  t = T("m68-mean-median");
  const data = [1, 2, 2, 3, 12];
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  assert.equal(mean(data), 4);
  assert.equal(median(data), 2);
  assert.equal(mean(data.slice(0, 4)), 2);
  assert.ok(
    t.line(1).includes("= 4") &&
      t.line(2).includes("which is 2") &&
      t.right.includes("from 2 to 4"),
  );
  t = T("m68-percent");
  const sale = 50 * 0.8 * 0.8;
  assert.equal(sale, 32);
  assert.equal(Math.round(((50 - sale) / 50) * 100), 36);
  assert.ok(
    t.flawed.includes("$30") &&
      t.right.includes("$32") &&
      t.right.includes("36%") &&
      t.line(1).includes("$40") &&
      t.line(2).includes("$32"),
  );
  t = T("m68-exponent");
  assert.ok((-3) ** 2 === 9 && 4 ** 3 === 64 && 5 ** 2 === 25);
  assert.ok(
    t.flawed.includes("−9") &&
      t.right.includes("9") &&
      t.line(1).includes("64") &&
      t.line(3).includes("25"),
  );
  t = T("m68-ratio");
  assert.ok(6 / 3 === 2 && 9 * 2 === 18 && 6 * 2 === 12 && 6 + 6 * 2 === 18);
  assert.ok(t.flawed.includes("$12") && t.right.includes("$18"));
  t = T("m68-negatives");
  assert.ok(
    -3 > -8 &&
      t.right.startsWith("−3 is greater than −8") &&
      t.flawed.includes("−8 is greater than −3"),
  );
  t = T("h35-sleep");
  assert.equal((24 - 0 + 5.5) % 24, 5.5);
  assert.ok(t.line(2).includes("five and a half") && t.line(1).includes("9 to 12"));
});

test("the right answer is spread across the three positions in both bands and overall", () => {
  const spread = (list) => {
    const n = [0, 0, 0];
    for (const c of list) n[c.fix.findIndex((f) => f.correct)]++;
    return n;
  };
  for (const b of CASE_BANDS) {
    const n = spread(casesForBand(b));
    n.forEach((x, p) =>
      assert.ok(x >= 3 && x <= 7, `${b}: position ${p + 1} holds the answer ${x} times (${n})`),
    );
  }
  const all = spread(CASES);
  assert.ok(
    all.every((x) => x >= 6 && x <= 14),
    `overall ${all}`,
  );
  for (let i = 3; i < CASES.length; i++) {
    const p = (j) => CASES[j].fix.findIndex((f) => f.correct);
    assert.ok(
      !(p(i) === p(i - 1) && p(i - 1) === p(i - 2) && p(i - 2) === p(i - 3)),
      `four in a row at ${CASES[i].id}`,
    );
  }
});

const NO_INDEX =
  /\b(line|línea)s?\s*#?\d|\b(first|second|third|fourth|fifth|last|primera|segunda|tercera|cuarta|quinta|última)\s+(line|línea)\b|\b(line|línea)\s+(one|two|three|four|five|six|uno|dos|tres|cuatro|cinco|seis)\b/i;

test("hints never state the flawed line or its number, and never state the correct statement", () => {
  for (const c of CASES) {
    const flawed = c.lines[c.flawed];
    const fix = correct(c);
    for (const lvl of [1, 2, 3]) {
      const h = hintFor(c, lvl);
      for (const lang of ["en", "es"]) {
        assert.ok(h[lang].length > 20, `${c.id} hint ${lvl} ${lang}`);
        assert.ok(
          !copies(h[lang], flawed[lang]),
          `${c.id} hint ${lvl} (${lang}) repeats the flawed line`,
        );
        assert.ok(
          !copies(h[lang], fix[lang]),
          `${c.id} hint ${lvl} (${lang}) repeats the correct statement`,
        );
        assert.ok(!NO_INDEX.test(h[lang]), `${c.id} hint ${lvl} (${lang}) names a line number`);
        assert.ok(!h[lang].includes(flawed[lang]) && !h[lang].includes(fix[lang]));
      }
    }
    assert.notEqual(hintFor(c, 1).en, hintFor(c, 2).en);
    assert.ok(hintFor(c, 3).en.includes(KINDS[c.flaw].en), "hint 3 names the kind");
  }
});

test("the nudge for a line that is fine never points to the flawed line, and no feedback gives away the fix", () => {
  for (const c of CASES) {
    const fix = correct(c);
    const flawed = c.lines[c.flawed];
    c.lines.forEach((_l, i) => {
      if (i === c.flawed) return;
      for (const lang of ["en", "es"]) {
        const n = c.whyFine[i][lang];
        assert.ok(!NO_INDEX.test(n), `${c.id} nudge ${i} names a line`);
        assert.ok(
          !/\b(mistake|error|wrong|incorrect|equivocad|erró|incorrect)/i.test(
            n.replace(/never wrong/gi, ""),
          ),
          `${c.id} nudge ${i} (${lang}) talks about the mistake: ${n}`,
        );
        assert.ok(!copies(n, flawed[lang]), `${c.id} nudge ${i} repeats the flawed line`);
        assert.ok(!copies(n, fix[lang]), `${c.id} nudge ${i} repeats the fix`);
      }
    });
    // a wrong tap must answer about THAT line only and must not mark the flawed line as found
    const wrong = c.lines.findIndex((_, i) => i !== c.flawed);
    const r = tapLine(newState(c.id), c, wrong);
    assert.equal(r.correct, false);
    assert.equal(r.state.found, false);
    assert.deepEqual(r.nudge, c.whyFine[wrong]);
    assert.equal(tapLine(newState(c.id), c, c.flawed).state.found, true);
    // a wrong fix choice sends the learner back to their own evidence, not to the answer
    const bad = c.fix.findIndex((f) => !f.correct);
    const fb = chooseFix(newState(c.id), c, bad);
    assert.equal(fb.ok, false);
    assert.equal(fb.state.fixed, false);
    assert.equal(fb.feedback.kind, "evidence");
    assert.ok(
      !copies(fb.feedback.en, fix.en) && !copies(fb.feedback.es, fix.es),
      `${c.id}: the evidence card quoted after a wrong choice repeats the answer`,
    );
    for (const k of c.cards)
      for (const lang of ["en", "es"])
        assert.ok(!copies(k.note[lang], fix[lang]), `${c.id} card note repeats the fix`);
  }
  for (const a of ["evidence", "assumption", "offtopic"])
    for (const b of ["evidence", "assumption", "offtopic"])
      if (a !== b) {
        const n = wrongSortNudge(a, b);
        assert.ok(n?.en && n?.es, `${a}>${b}`);
        assert.ok(
          !/\b(is|are) (an? )?(evidence|assumption|opinion)\b/i.test(n.en) ||
            /ask|if so|may be/i.test(n.en),
          "the sort nudge asks a question",
        );
      }
});

test("sorting is immediate and specific: right gives the card's own note, wrong gives a question and the pile can be changed", () => {
  const c = caseById("m35-perimeter");
  let s = newState(c.id);
  const card = c.cards.find((k) => k.kind === "assumption");
  let r = sortCard(s, c, card.id, "evidence");
  assert.equal(r.ok, false);
  assert.ok(r.feedback.en.includes("?") || /Ask/.test(r.feedback.en));
  r = sortCard(r.state, c, card.id, "assumption");
  assert.equal(r.ok, true);
  assert.deepEqual(r.feedback, card.note);
  for (const k of c.cards) s = sortCard(s, c, k.id, k.kind).state;
  assert.equal(sortDone(s, c), true);
  assert.equal(sortCard(s, c, "nope", "evidence").ok, false);
  assert.equal(sortCard(s, c, card.id, "nope").ok, false);
});

const REASON_SAMPLES = ["because", "since", "so", "therefore", "which means", "porque"];
test("every quote shown back to a learner is a verbatim substring of what they typed", () => {
  const seeds = [
    "x",
    "Á",
    "perímetro",
    "“quoted”",
    "  ",
    "it's",
    "6+6+4+4",
    "—",
    "SLICES",
    "Slice",
    "ya que",
  ];
  let rng = 12345;
  const rand = (n) => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng % n;
  };
  let quotes = 0;
  for (const c of CASES) {
    for (let t = 0; t < 40; t++) {
      const parts = [];
      for (let i = 0; i < 4 + rand(8); i++) {
        const pick = rand(4);
        parts.push(
          pick === 0
            ? c.accept[rand(c.accept.length)]
            : pick === 1
              ? REASON_SAMPLES[rand(REASON_SAMPLES.length)]
              : pick === 2
                ? seeds[rand(seeds.length)]
                : `word${rand(99)}`,
        );
      }
      let text = parts.join(rand(2) ? " " : ", ");
      if (rand(3) === 0) text = text.toUpperCase();
      if (rand(4) === 0) text = `  ${text}.  `;
      const res = checkSentence(c, text);
      for (const lang of ["en", "es"]) {
        for (const m of res[lang].matchAll(/“([^”]*)”/g)) {
          quotes++;
          assert.ok(
            text.includes(m[1]),
            `${c.id}: quote “${m[1]}” is not in the typed text "${text}"`,
          );
        }
      }
      for (const q of [res.idea, res.reason]) q && assert.ok(text.includes(q));
      assert.equal(res.en.includes("“"), Boolean(res.idea || res.reason) && !res.tooShort);
    }
  }
  assert.ok(quotes > 200, "the property was exercised");
});

test("the sentence check finds the flawed idea and a reason, never grades, and tells the learner what is missing", () => {
  const c = caseById("m35-fraction-size");
  const full = checkSentence(c, "The mistake is the fraction size because 1/8 slices are smaller.");
  assert.equal(full.ok, true);
  assert.equal(full.reason, "because");
  assert.ok(c.accept.some((w) => full.idea.toLowerCase().startsWith(w.toLowerCase())) || full.idea);
  const ideaOnly = checkSentence(c, "The fraction is wrong here");
  assert.equal(ideaOnly.ok, false);
  assert.ok(ideaOnly.idea && !ideaOnly.reason && /because/.test(ideaOnly.en));
  const reasonOnly = checkSentence(c, "It is wrong because I said so");
  assert.ok(!reasonOnly.idea && reasonOnly.reason);
  const none = checkSentence(c, "this seems off to me");
  assert.ok(!none.idea && !none.reason && none.en.includes("___"));
  assert.equal(checkSentence(c, "too short").tooShort, true);
  assert.equal(
    checkSentence(c, "The mistake is ___ because ___.").tooShort,
    true,
    "an untouched frame is not a sentence",
  );
  assert.equal(checkSentence(c, "").words, 0);
  assert.equal(MIN_WORDS, 4);
  for (const x of CASES)
    assert.equal(
      checkSentence(x, "a b c d e").ok,
      false,
      "random words are never accepted as the idea",
    );
});

test("resume: a saved state is repaired against its case and no step is reachable without its work", () => {
  const c = caseById("s35-seasons");
  const empty = sanitizeState(
    { step: "reveal", done: true, found: true, fixed: true, checked: true, sentence: "x" },
    c,
  );
  assert.equal(empty.done, false, "done needs a real sentence and every step");
  assert.ok(STEPS.indexOf(empty.step) <= 3);
  assert.equal(sanitizeState(null, c).step, "read");
  assert.equal(sanitizeState({ step: "sort" }, c).step, "find", "cannot skip Find");
  const found = sanitizeState({ step: "sort", found: true }, c);
  assert.equal(found.step, "sort");
  assert.equal(sanitizeState({ step: "fix", found: true }, c).step, "sort", "cannot skip Sort");
  const junk = sanitizeState(
    {
      tried: [c.flawed, 99, -1, 0, 0],
      sort: { nope: "evidence", [c.cards[0].id]: "bad" },
      hints: 9,
      fixTried: [7],
      sentence: 5,
    },
    c,
  );
  assert.deepEqual(
    junk.tried,
    [0],
    "the flawed line is never in tried; duplicates and out-of-range are dropped",
  );
  assert.deepEqual(junk.sort, {});
  assert.equal(junk.hints, 0);
  assert.deepEqual(junk.fixTried, []);
  assert.equal(junk.sentence, "");
  // a full walk saves and restores exactly
  let s = newState(c.id);
  s = tapLine(s, c, c.flawed).state;
  for (const k of c.cards) s = sortCard(s, c, k.id, k.kind).state;
  s = chooseFix(
    s,
    c,
    c.fix.findIndex((f) => f.correct),
  ).state;
  s = {
    ...s,
    sentence: "The mistake is the tilt because it is not distance.",
    checked: true,
    step: "fix",
  };
  assert.deepEqual(sanitizeState(JSON.parse(JSON.stringify(s)), c), s);
});

test("supported versus independent: any opened hint marks the case supported, and they are counted apart", () => {
  const c = caseById("m35-perimeter");
  const ok = {
    ...newState(c.id),
    found: true,
    fixed: true,
    checked: true,
    sentence: "The mistake is the perimeter because it adds to 20.",
  };
  assert.equal(finish({ ...ok, hints: 0 }).independent, true);
  for (const h of [1, 2, 3])
    assert.equal(finish({ ...ok, hints: h }).independent, false, `hint ${h}`);
  const sum = summarize(
    {
      "m35-perimeter": { independent: true },
      "m35-order-ops": { independent: false },
      "m68-percent": { independent: true },
    },
    "3-5",
  );
  assert.deepEqual(sum, { total: 15, finished: 2, independent: 1, supported: 1 });
});

const strings = (src) =>
  [
    ...src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
      .matchAll(/(["'`])((?:\\.|(?!\1)[^\\])*)\1/g),
  ].map((m) => m[2]);
const SOURCES = [
  "src/views/claim-check.js",
  "src/claimcheck/cases.js",
  "src/claimcheck/cases-35.js",
  "src/claimcheck/cases-68.js",
  "src/claimcheck/engine.js",
  "src/claimcheck/parts.js",
  "src/claimcheck/store.js",
  "claim-check.css",
];

test("no network, no external AI, no beacon, no remote import in any claim-check file", () => {
  for (const f of SOURCES) {
    const src = read(f);
    assert.ok(
      !/\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon|importScripts|navigator\.(?:serviceWorker|mediaDevices))\b/.test(
        src.replace(/\/\/.*$/gm, ""),
      ),
      `${f} reaches for the network`,
    );
    assert.ok(!/https?:\/\//i.test(src.replace(/\/\/.*$/gm, "")), `${f} contains a URL`);
    assert.ok(
      !/\b(openai|anthropic|gemini|gpt-|api[_-]?key|llm)\b/i.test(src),
      `${f} mentions an AI service`,
    );
    assert.ok(
      !/^\s*(?:import|export)\b[^;]*?\bfrom\s*["'](?!\.\.?\/)|\bimport\(\s*["'](?!\.\.?\/)/m.test(
        src,
      ),
      `${f} imports from outside the lab`,
    );
  }
  assert.ok(!/\bfetch\s*\(|apiBase|\/api\//.test(read("src/claimcheck/store.js")));
});

test("one storage key, and the ledger entry carries ids and counts, never the learner's text", () => {
  const store = read("src/claimcheck/store.js");
  assert.match(store, /KEY = "accessPracticeLab:v1:claim-check"/);
  assert.equal([...store.matchAll(/accessPracticeLab:/g)].length, 1);
  const view = read("src/views/claim-check.js");
  assert.ok(
    !/localStorage|sessionStorage|indexedDB/.test(view + read("src/claimcheck/parts.js")),
    "storage only through store.js",
  );
  const rec = view.slice(view.indexOf("function record"), view.indexOf("export function onInput"));
  assert.ok(
    /src: "claim-check"/.test(rec) && !/sentence|\.value|text/.test(rec),
    "the ledger entry holds no learner text",
  );
});

const SCORE_WORDS =
  /\b(scores?|scoring|streaks?|timers?|timed|countdown|ranks?|ranking|leaderboard|points?|stars?|levels?|grades? you|percent(?:age)?|badge|trophy|puntos?|puntaje|calificaci[oó]n|racha|estrellas?|nivel(?:es)?|cron[oó]metro|porcentaje)\b/i;
test("no score, level, percent, rank, streak, timer, points or stars wording in anything a learner reads", () => {
  const chrome = [
    "src/views/claim-check.js",
    "src/claimcheck/parts.js",
    "src/claimcheck/engine.js",
  ].flatMap((f) => strings(read(f)));
  // the one place that names the absence of a score on purpose
  const allowed = [/Nothing here is a score\./, /Nada aquí es una calificación\./];
  for (const s of chrome) {
    let t = s;
    for (const a of allowed) t = t.replace(a, "");
    assert.ok(!SCORE_WORDS.test(t), `score-like wording in UI text: "${s.slice(0, 80)}"`);
  }
  for (const c of CASES)
    assert.ok(
      !/\b(timer|streak|leaderboard|stars?|badge|trophy)\b/i.test(allText(c)),
      `${c.id} content`,
    );
  assert.ok(
    !/\d+\s*%\s*(correct|right)|\bcorrect\s*:\s*\d/i.test(read("src/claimcheck/parts.js")),
    "no percent-correct display",
  );
});

test("no emoji, and every icon the view names exists in the lab's icon sprite", () => {
  const files = [
    "src/views/claim-check.js",
    "src/claimcheck/parts.js",
    "src/claimcheck/engine.js",
    "src/claimcheck/cases-35.js",
    "src/claimcheck/cases-68.js",
  ];
  const sprite = read("pictures/ui-icons.svg");
  for (const f of files) {
    const src = read(f);
    assert.ok(
      !/\p{Extended_Pictographic}/u.test(src.replace(/[✓]/g, "")),
      `${f} contains an emoji`,
    );
    for (const m of src.matchAll(/icon\("([a-z-]+)"/g))
      assert.ok(sprite.includes(`id="${m[1]}"`), `${f}: icon ${m[1]} is not in ui-icons.svg`);
  }
});

test("claim-check.css uses design tokens only: no raw color, no gradient, no purple or violet, every var exists in ds.css", () => {
  const css = read("claim-check.css");
  const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(code), "raw hex color");
  assert.ok(!/\b(rgb|rgba|hsl|hsla|oklch|lab)\(/i.test(code), "raw color function");
  assert.ok(!/gradient/i.test(code) && !/\b(purple|violet|magenta|fuchsia)\b/i.test(code));
  assert.ok(!/@import|url\(/.test(code), "no external or image resource");
  const ds = read("ds.css");
  const used = new Set([...code.matchAll(/var\((--[a-z0-9-]+)/g)].map((m) => m[1]));
  assert.ok(used.size >= 15);
  for (const v of used)
    assert.ok(new RegExp(`${v}\\s*:`).test(ds), `${v} is not defined in ds.css`);
  assert.ok(
    /min-height:\s*var\(--target-min\)/.test(code),
    "44px targets come from the shared token",
  );
  assert.ok(/prefers-reduced-motion/.test(code));
});

test("the view keeps its accessibility contract in the source: one h1, live status, labelled controls, focus on the step heading", () => {
  const view = read("src/views/claim-check.js");
  const parts = read("src/claimcheck/parts.js");
  assert.equal(
    [...(view + parts).matchAll(/<h1\b/g)].length,
    1,
    "exactly one h1 in the whole view",
  );
  assert.ok(/role="status"/.test(parts) && /announce\(/.test(view));
  assert.ok(
    /<legend/.test(parts) &&
      /<label for="ccSentence"/.test(parts) &&
      /aria-label="\$\{I\.S\("Steps"/.test(parts),
  );
  assert.ok(/aria-current="step"/.test(parts));
  assert.ok(/tabindex="-1"/.test(parts) && /getElementById\("ccStep"\)/.test(view));
  assert.ok(!/draggable|ondrag|dragstart/.test(view + parts), "no drag-only interaction");
});

test("CLAIM-CHECK.md exists, is at most 40 lines, and names the files and the rules", () => {
  const p = LAB + "CLAIM-CHECK.md";
  assert.ok(existsSync(p), "CLAIM-CHECK.md");
  const text = readFileSync(p, "utf8");
  assert.ok(text.trimEnd().split("\n").length <= 40);
  for (const needle of [
    "claim-check.js",
    "cases-35.js",
    "engine.js",
    "accessPracticeLab:v1:claim-check",
    "add a case",
  ])
    assert.ok(text.toLowerCase().includes(needle.toLowerCase()), needle);
});
