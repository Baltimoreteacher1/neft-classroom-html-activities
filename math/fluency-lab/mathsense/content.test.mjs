// MathSense content, marking, evidence and Spanish, proved against an independent oracle (scripts/lib/rational.mjs).
// Missions are brute-forced: every candidate answer is judged by the oracle, and the page's checker must agree on
// every one, so a wrong answer cannot pass and a right one cannot be refused. A mutation block proves the tests bite.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { Rat, parseAnswerValue } from "../../../scripts/lib/rational.mjs";
import { ES } from "../i18n.js";
import { evidence, findSkill, sanitizeTutor } from "../tutor-engine.js";
import * as X from "./exact.js";
import { checkMission } from "./missions-check.js";
import { BANDS, MISSIONS, SCENARIOS, TOPICS } from "./missions.js";
import { PART_CHOICES, stateFrom } from "./model.js";
import { NAMED_WORDS, emptyRecord, noticeSentence, sanitize, status, withAttempt, withHint, withSentence } from "./progress.js";
import { load, recordEvidence, save } from "./store.js";
import { MATHSENSE_I18N_KEYS } from "./i18n-keys.js";

const dir = new URL("./", import.meta.url);
const read = (name) => readFileSync(new URL(name, dir), "utf8");
const rat = (key) => {
  const [n, d] = key.split("/").map(BigInt);
  return new Rat(n, d);
};
const eqRat = (q, r) => q.n === r.n && q.d === r.d;
const gcd = (a, b) => (b === 0n ? a : gcd(b, a % b));

// ---------------------------------------------------------------------------------------------------------------
// Shape of the content
test("each grade band has at least 8 missions, and every mission is complete", () => {
  for (const band of BANDS) assert.ok(MISSIONS.filter((m) => m.band === band.id).length >= 8, band.id);
  const ids = new Set();
  const topicsSeen = new Set();
  for (const m of MISSIONS) {
    assert.ok(!ids.has(m.id), `duplicate id ${m.id}`);
    ids.add(m.id);
    topicsSeen.add(m.topic);
    assert.ok(TOPICS[m.topic], m.topic);
    assert.ok(findSkill(m.skill), `${m.id}: skill ${m.skill} is a real Fluency Lab skill`);
    assert.ok(["set", "between", "type", "choose"].includes(m.kind), m.id);
    assert.equal(m.hints.length, 3, `${m.id}: three graduated hints`);
    assert.ok(m.prompt && m.done, m.id);
    assert.ok(m.kind === "choose" || Array.isArray(m.slips), m.id);
  }
  for (const topic of Object.keys(TOPICS)) assert.ok(topicsSeen.has(topic), `a mission teaches ${topic}`);
  assert.ok(SCENARIOS.length >= 6, "at least six free-exploration starting points");
  assert.ok(new Set(MISSIONS.filter((m) => m.kind === "choose").map((m) => m.answer)).size >= 3, "correct answers sit at varied positions");
});

test("grades 4-8 coverage: each named idea has a mission in the band that teaches it", () => {
  const has = (band, topic, pred = () => true) => MISSIONS.some((m) => m.band === band && m.topic === topic && pred(m));
  assert.ok(has("4-5", "equivalence") && has("4-5", "benchmark") && has("4-5", "improper") && has("4-5", "ordering") && has("4-5", "conversion"));
  assert.ok(has("6", "percent-over-100") && has("6", "repeating") && has("6", "conversion") && has("6", "improper"));
  assert.ok(has("7-8", "repeating") && has("7-8", "percent-over-100") && has("7-8", "conversion") && has("7-8", "ordering"));
});

test("no mission starts already solved", () => {
  for (const m of MISSIONS.filter((x) => x.kind === "set" || x.kind === "between")) {
    const s = stateFrom(m.setup);
    assert.equal(checkMission(m, { value: s.a, parts: s.parts.a }).ok, false, m.id);
  }
});

// ---------------------------------------------------------------------------------------------------------------
// Marking: the page's checker against the oracle, over every candidate
const setCandidates = () => {
  const out = [];
  for (let d = 1n; d <= 24n; d += 1n) for (let n = 0n; n <= 5n * d; n += 1n) out.push(X.make(n, d));
  return [...new Map(out.map((q) => [X.key(q), q])).values()];
};
const FRACTIONS = setCandidates();

test("set missions accept exactly the oracle's answer and no other model", () => {
  for (const m of MISSIONS.filter((x) => x.kind === "set")) {
    const want = rat(m.target.value);
    for (const q of FRACTIONS) {
      for (const parts of PART_CHOICES) {
        const expected = eqRat(q, want) && (m.target.parts === undefined || parts === m.target.parts);
        assert.equal(checkMission(m, { value: q, parts }).ok, expected, `${m.id}: ${X.key(q)} on ${parts}`);
      }
    }
  }
});

test("between missions accept exactly the amounts strictly between the ends", () => {
  for (const m of MISSIONS.filter((x) => x.kind === "between")) {
    const lo = rat(m.target.lo);
    const hi = rat(m.target.hi);
    for (const q of FRACTIONS) {
      const r = new Rat(q.n, q.d);
      const inside = r.sub(lo).n > 0n && hi.sub(r).n > 0n;
      assert.equal(checkMission(m, { value: q, parts: 4 }).ok, inside, `${m.id}: ${X.key(q)}`);
    }
    assert.equal(checkMission(m, { value: X.fromKey(m.target.lo), parts: 4 }).id, "endpoint");
  }
});

const formOf = (text) => (text.endsWith("%") ? "percent" : /^\d+\s+\d+\/\d+$/.test(text) ? "mixed" : text.includes("/") ? "fraction" : /[.,]/.test(text) ? "decimal" : "integer");
function candidates() {
  const out = [];
  for (const q of FRACTIONS) {
    if (q.d <= 24n) out.push({ text: `${q.n}/${q.d}`, truth: new Rat(q.n, q.d), lowest: true });
    if (q.d > 1n && q.n > q.d) {
      const whole = q.n / q.d;
      out.push({ text: `${whole} ${q.n - whole * q.d}/${q.d}`, truth: new Rat(q.n, q.d), lowest: gcd(q.n - whole * q.d, q.d) === 1n });
    }
  }
  for (let d = 2n; d <= 24n; d += 1n) for (let n = 1n; n <= 5n * d; n += 1n) if (gcd(n, d) !== 1n) out.push({ text: `${n}/${d}`, truth: new Rat(n, d), lowest: false });
  for (let k = 0; k <= 5000; k += 1) out.push({ text: `${Math.floor(k / 1000)}.${String(k % 1000).padStart(3, "0")}`, truth: new Rat(BigInt(k), 1000n), lowest: true });
  for (let k = 0; k <= 500; k += 1) out.push({ text: `${k}%`, truth: new Rat(BigInt(k), 100n), lowest: true });
  for (let k = 0; k < 500; k += 1) out.push({ text: `${k}.5%`, truth: new Rat(BigInt(2 * k + 1), 200n), lowest: true });
  for (const q of FRACTIONS) {
    const info = X.decimalText(q);
    if (info.repeats && !info.text.includes("…")) out.push({ text: info.text, truth: new Rat(q.n, q.d), lowest: true });
  }
  return out.filter((c) => !c.text.includes("…"));
}
const CANDIDATES = candidates();

test("typed missions accept exactly what the oracle says is right, in the asked form", () => {
  const typed = MISSIONS.filter((m) => m.kind === "type");
  assert.ok(typed.length >= 10);
  for (const m of typed) {
    const want = rat(m.target.value);
    let accepted = 0;
    for (const c of CANDIDATES) {
      const form = formOf(c.text);
      const formOk = form === m.target.form || (form === "integer" && m.target.form !== "percent");
      const expected = eqRat(c.truth, want) && formOk && (!m.target.lowest || c.lowest);
      const result = checkMission(m, { raw: c.text });
      assert.equal(result.ok, expected, `${m.id}: "${c.text}"`);
      if (result.ok) accepted += 1;
    }
    assert.ok(accepted >= 1, `${m.id} has at least one accepted spelling among the candidates`);
  }
});

test("choose missions accept only the keyed option, and every wrong option names its slip", () => {
  for (const m of MISSIONS.filter((x) => x.kind === "choose")) {
    m.options.forEach((option, index) => {
      assert.equal(checkMission(m, { index }).ok, index === m.answer, `${m.id}: option ${index}`);
      if (index !== m.answer) assert.ok(option.say && option.say.length > 30, `${m.id}: option ${index} names the slip`);
    });
    assert.equal(new Set(m.options.map((o) => o.text)).size, m.options.length, `${m.id}: options differ`);
  }
});

test("each named slip is recognised by its own mission and not marked correct", () => {
  const text = { decimal: (q) => X.decimalText(q).text, percent: (q) => X.percentText(q).text, fraction: X.fractionText, mixed: X.mixedText };
  let slips = 0;
  for (const m of MISSIONS) {
    for (const slip of m.slips ?? []) {
      slips += 1;
      const value = X.fromKey(slip.when.value);
      assert.ok(!X.eq(value, X.fromKey(m.target.value ?? "0/1")) || m.kind === "between", `${m.id}: a slip cannot be the answer`);
      const result =
        m.kind === "set"
          ? checkMission(m, { value, parts: m.target.parts ?? 4 })
          : checkMission(m, { raw: text[m.target.form](value) });
      assert.equal(result.ok, false, `${m.id}: ${slip.when.value}`);
      assert.equal(result.id, "slip", `${m.id}: ${slip.when.value} should name its slip, got ${result.id}`);
      assert.ok(result.message.length > 40);
    }
  }
  assert.ok(slips >= 25, `${slips} named slips`);
});

test("generic slips: wrong form, not lowest terms, rounded repeating, unreadable, direction", () => {
  const byId = (id) => MISSIONS.find((m) => m.id === id);
  assert.equal(checkMission(byId("g45-percent-three-fifths"), { raw: "0.6" }).id, "wrong-form");
  assert.equal(checkMission(byId("g6-mixed-seventeen-fifths"), { raw: "17/5" }).id, "wrong-form");
  assert.equal(checkMission(byId("g6-mixed-seventeen-fifths"), { raw: "3.4" }).id, "wrong-form");
  assert.equal(checkMission(byId("g78-repeating-to-fraction"), { raw: "45/99" }).id, "not-lowest");
  assert.equal(checkMission(byId("g45-fraction-thirty-five-hundredths"), { raw: "35/100" }).id, "not-lowest");
  for (const raw of ["0.67", "0.66", "0.666", "0.6666667", "0.7"]) assert.equal(checkMission(byId("g6-repeating-two-thirds"), { raw }).id, "rounded", raw);
  assert.equal(checkMission(byId("g6-repeating-two-thirds"), { raw: "0.333..." }).id, "unreadable");
  assert.equal(checkMission(byId("g6-repeating-two-thirds"), { raw: "" }).id, "unreadable");
  assert.equal(checkMission(byId("g45-decimal-five-eighths"), { raw: "0.2" }).id, "too-small");
  assert.equal(checkMission(byId("g45-decimal-five-eighths"), { raw: "0.9" }).id, "too-large");
  assert.equal(checkMission(byId("g45-equiv-sixths"), { value: X.make(1n, 2n), parts: 2 }).id, "partition");
  assert.equal(checkMission(byId("g45-equiv-sixths"), { value: X.make(2n, 3n), parts: 6 }).id, "too-large");
  // the three spellings of a repeating answer are all exactly right
  for (const raw of ["0.(6)", "0.6̅", "0.(66)", "0.6(6)"]) assert.equal(checkMission(byId("g6-repeating-two-thirds"), { raw }).ok, true, raw);
});

// ---------------------------------------------------------------------------------------------------------------
// Hints and feedback never state the answer (a detector built on the oracle, then proved to fire)
const TOKENS = /\d+\s+\d+\s*\/\s*\d+|\d+\s*\/\s*\d+|\d*\.(?:\d+(?:\(\d+\))?|\(\d+\))%?|\d+%/g;
const valueOfToken = (token) => {
  const clean = token.trim();
  if (/\(/.test(clean)) return X.parse(clean).value ?? null;
  const v = parseAnswerValue(clean.startsWith(".") ? `0${clean}` : clean);
  return v ? X.make(v.n, v.d) : null;
};
const tokensOf = (text) => [...String(text).matchAll(TOKENS)].map((m) => ({ text: m[0].replace(/\s+/g, ""), value: valueOfToken(m[0]) }));
const norm = (text) => String(text).toLowerCase().replace(/\s+/g, "");

function leaks(mission, text) {
  const inPrompt = new Set(tokensOf(mission.prompt).map((t) => t.text));
  const found = [];
  const answer = mission.target?.value ? X.fromKey(mission.target.value) : null;
  for (const token of tokensOf(text)) {
    if (inPrompt.has(token.text) || !token.value) continue;
    if (answer && X.eq(token.value, answer)) found.push(token.text);
    if (mission.kind === "between" && X.cmp(token.value, X.fromKey(mission.target.lo)) > 0 && X.cmp(token.value, X.fromKey(mission.target.hi)) < 0) found.push(token.text);
  }
  if (mission.kind === "choose" && norm(text).includes(norm(mission.options[mission.answer].text)) && norm(mission.options[mission.answer].text).length >= 3) found.push(mission.options[mission.answer].text);
  return found;
}

test("no hint, slip message or generic feedback contains the answer", () => {
  for (const m of MISSIONS) {
    for (const hint of m.hints) assert.deepEqual(leaks(m, hint), [], `${m.id} hint: ${hint}`);
    for (const slip of m.slips ?? []) assert.deepEqual(leaks(m, slip.say), [], `${m.id} slip: ${slip.say}`);
    for (const option of m.options ?? []) if (option.say) assert.deepEqual(leaks(m, option.say), [], `${m.id} option: ${option.say}`);
    const wrongs = [];
    if (m.kind === "set") for (const q of [X.make(0n), X.make(5n), X.make(1n, 7n)]) wrongs.push({ value: q, parts: 7 });
    if (m.kind === "type") for (const raw of ["0.2", "4.9", "0.67", "1/9", "7%", "abc", "0.333...", ""]) wrongs.push({ raw });
    for (const sub of wrongs) {
      const result = checkMission(m, sub);
      if (!result.ok) assert.deepEqual(leaks(m, result.message), [], `${m.id} feedback: ${result.message}`);
    }
  }
});

test("mutation: the leak detector fires on a hint that states the answer, and the marker refuses a corrupted key", () => {
  const sixths = MISSIONS.find((m) => m.id === "g45-equiv-sixths");
  assert.deepEqual(leaks(sixths, "Shade 3/6 of the bar."), ["3/6"]);
  const percent = MISSIONS.find((m) => m.id === "g45-percent-three-fifths");
  assert.deepEqual(leaks(percent, "It is 60% of the whole."), ["60%"]);
  const thirds = MISSIONS.find((m) => m.id === "g6-repeating-two-thirds");
  assert.deepEqual(leaks(thirds, "The decimal is 0.(6)."), ["0.(6)"]);
  const benchmark = MISSIONS.find((m) => m.id === "g45-benchmark-half");
  assert.deepEqual(leaks(benchmark, "Pick 5/9 because it is close."), ["5/9"]);
  const between = MISSIONS.find((m) => m.kind === "between");
  assert.ok(leaks(between, "Try 5/8.").length === 1);
  // a corrupted key must refuse what used to be right
  const corrupted = { ...percent, target: { ...percent.target, value: "7/10" } };
  assert.equal(checkMission(corrupted, { raw: "60%" }).ok, false);
  assert.equal(checkMission(corrupted, { raw: "70%" }).ok, true);
  const rekeyed = { ...benchmark, answer: 0 };
  assert.equal(checkMission(rekeyed, { index: 2 }).ok, false);
  // and a wrong answer is refused on every mission
  for (const m of MISSIONS) {
    const wrong = m.kind === "choose" ? { index: (m.answer + 1) % m.options.length } : m.kind === "type" ? { raw: "0.123" } : { value: X.make(0n), parts: 7 };
    assert.equal(checkMission(m, wrong).ok, false, m.id);
  }
});

// ---------------------------------------------------------------------------------------------------------------
// Independent versus supported
test("a mission's first hint-free check is the only independent one", () => {
  const id = MISSIONS[0].id;
  let r = emptyRecord();
  let a = withAttempt(r, id, true);
  assert.equal(a.independent, true);
  assert.equal(status(a.record.progress[id]), "independent");
  a = withAttempt(a.record, id, true);
  assert.equal(a.independent, false, "a repeat of a finished mission is supported");
  assert.equal(status(a.record.progress[id]), "independent", "it keeps its first status");

  r = withHint(emptyRecord(), id);
  a = withAttempt(r, id, true);
  assert.equal(a.independent, false, "a hint makes it supported");
  assert.equal(status(a.record.progress[id]), "supported");

  a = withAttempt(emptyRecord(), id, false);
  assert.equal(a.independent, true, "an independent miss is still an independent attempt");
  const retry = withAttempt(a.record, id, true);
  assert.equal(retry.independent, false, "the retry after a miss is supported");
  assert.equal(status(retry.record.progress[id]), "supported");

  assert.equal(withHint(withHint(withHint(withHint(emptyRecord(), id), id), id), id).progress[id].hints, 3, "hints cap at 3");
});

test("saved records are repaired, and sentences are kept as written", () => {
  assert.deepEqual(sanitize(null), emptyRecord());
  assert.deepEqual(sanitize({ version: 2 }), emptyRecord());
  const messy = sanitize({ version: 1, open: "nope", progress: { nope: { done: true }, [MISSIONS[0].id]: { attempts: -4, hints: 99, done: "yes", independent: true } }, sentences: [{ text: "  hi there  ", at: 1, topic: "x" }, { text: 4 }, null] });
  assert.equal(messy.open, null);
  assert.deepEqual(Object.keys(messy.progress), [MISSIONS[0].id]);
  assert.deepEqual(messy.progress[MISSIONS[0].id], { attempts: 0, hints: 3, done: false, independent: false });
  assert.equal(messy.sentences.length, 1);
  assert.equal(messy.sentences[0].text, "hi there");
  const kept = withSentence(emptyRecord(), "The bar and the decimal show the same amount.", "conversion", 5);
  assert.equal(kept.sentences[0].text, "The bar and the decimal show the same amount.");
  assert.equal(withSentence(kept, "   ", "x").sentences.length, 1);
  assert.deepEqual(noticeSentence("The bar and the fraction are equal because the pieces match").names, ["fraction", "bar", "pieces"].sort((a, b) => NAMED_WORDS.findIndex((w) => w.id === a) - NAMED_WORDS.findIndex((w) => w.id === b)));
  assert.equal(noticeSentence("Las partes de la barra son iguales porque el entero no cambia").connector, true);
});

const memory = () => {
  const map = new Map();
  return { map, getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) };
};

test("evidence reaches the Fluency Lab engine as independent or supported", () => {
  const storage = memory();
  const mission = MISSIONS.find((m) => m.skill === "4:fraction-equiv");
  const skill = findSkill(mission.skill);
  const day = 1_700_000_000_000;
  assert.equal(recordEvidence({ mission, correct: true, independent: true, attempt: 1 }, 0, storage, day), true);
  let tutor = sanitizeTutor(JSON.parse(storage.getItem("ewl-fluency-tutor-v2")));
  let e = evidence(tutor, skill, day);
  assert.equal(e.independent, 1);
  assert.equal(e.successes, 1);
  recordEvidence({ mission, correct: true, independent: false, attempt: 2 }, 0, storage, day + 1000);
  tutor = sanitizeTutor(JSON.parse(storage.getItem("ewl-fluency-tutor-v2")));
  e = evidence(tutor, skill, day + 1000);
  assert.equal(e.independent, 1, "supported work does not add independent evidence");
  assert.equal(e.supportedTotal, 1);
  assert.equal(e.recent.at(-1).independent, false);
  assert.match(e.recent.at(-1).sig, /^mathsense:/);
  recordEvidence({ mission, correct: true, independent: true, attempt: 1 }, 3, storage, day);
  assert.ok(storage.getItem("ewl-fluency-tutor-v2:profile-3"), "another learner slot keeps its own record");
  assert.equal(recordEvidence({ mission: { ...mission, skill: "9:none" }, correct: true, independent: true, attempt: 1 }, 0, storage), false);
});

test("the device record round-trips per learner and survives a blocked store", () => {
  const storage = memory();
  const record = withSentence(withHint(emptyRecord(), MISSIONS[0].id), "My sentence has enough words in it.", "conversion", 9);
  assert.equal(save(record, 2, storage), true);
  assert.ok(storage.getItem("fluencyMathSense:v1:profile-2"));
  assert.deepEqual(load(2, storage), record);
  assert.deepEqual(load(0, storage), emptyRecord());
  assert.equal(save(record, 0, { setItem() { throw new Error("full"); } }), false);
  assert.deepEqual(load(0, { getItem() { throw new Error("blocked"); } }), emptyRecord());
});

// ---------------------------------------------------------------------------------------------------------------
// Spanish
const SOURCES = ["readouts.js", "draw.js", "missions-check.js", "ui-workspace.js", "ui-missions.js", "ui-notice.js", "main.js"];
function allStrings() {
  const out = new Set();
  for (const file of SOURCES) for (const m of read(file).matchAll(/\bt\(\s*("(?:[^"\\]|\\.)*")/g)) out.add(JSON.parse(m[1]));
  const html = read("index.html");
  for (const m of html.matchAll(/data-i18n[^>]*>([\s\S]*?)</g)) out.add(m[1].replace(/\s+/g, " ").trim());
  for (const key of MATHSENSE_I18N_KEYS) out.add(key);
  out.delete("");
  return [...out].filter((s) => s !== "MathSense");
}
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const MAY_MATCH = new Set(["Decimal", "decimal"]);

test("every English string has a Spanish twin with the same placeholders", () => {
  const strings = allStrings();
  assert.ok(strings.length > 350, `${strings.length} strings`);
  for (const key of strings) {
    if (/^[^A-Za-z]*$/.test(key.replace(/\{\w+\}/g, ""))) continue; // numbers and symbols read the same in both languages
    const es = ES[key];
    assert.ok(typeof es === "string" && es.trim(), `Spanish missing: ${key}`);
    assert.equal(placeholders(es), placeholders(key), `placeholders: ${key}`);
    const wordless = key.replace(/\{\w+\}/g, "").replace(/[^A-Za-z]/g, "") === "";
    if (!wordless && !MAY_MATCH.has(key)) assert.notEqual(es, key, `Spanish is a copy of the English: ${key}`);
    assert.ok(!/\busted(es)?\b|\bvosotros\b/i.test(es), `register: ${es}`);
    assert.ok(!/\d \s?%/.test(es), `spaced percent: ${es}`);
  }
});

test("Spanish tables of other screens are not overwritten by MathSense", async () => {
  const mine = (await import("../i18n-es-mathsense.js")).ES_MATHSENSE;
  const others = ["i18n-es.js", "i18n-es-studio.js", "i18n-es-lab4-graphics.js", "i18n-es-lab4-educator.js", "i18n-es-lab4-lessons.js"].map((f) => readFileSync(new URL(`../${f}`, import.meta.url), "utf8")).join("\n");
  for (const key of Object.keys(mine)) assert.ok(!others.includes(`${JSON.stringify(key)}: `) || others.includes(`${JSON.stringify(key)}: ${JSON.stringify(mine[key])}`), `would change an existing translation: ${key}`);
});

// ---------------------------------------------------------------------------------------------------------------
// Accessibility contract in the source
test("one polite live region, and nothing else announces", () => {
  const html = read("index.html");
  assert.equal((html.match(/aria-live=/g) ?? []).length, 1);
  assert.match(html, /id="ms-live"[^>]*role="status"[^>]*aria-live="polite"|id="ms-live"[^>]*aria-live="polite"/);
  assert.ok(!/role="alert"|aria-live="assertive"|role="log"/.test(html));
  for (const file of [...SOURCES, "announce.js"]) assert.ok(!/aria-live|role="(alert|status|log)"/.test(read(file)), `${file} adds a second live region`);
});

function hue([r, g, b]) {
  const [R, G, B] = [r, g, b].map((v) => v / 255);
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const delta = max - min;
  const light = (max + min) / 2;
  const sat = delta === 0 ? 0 : delta / (1 - Math.abs(2 * light - 1));
  let h = 0;
  if (delta) h = max === R ? ((G - B) / delta) % 6 : max === G ? (B - R) / delta + 2 : (R - G) / delta + 4;
  return { h: (h * 60 + 360) % 360, sat };
}

test("no violet, purple or magenta colour anywhere in the module", () => {
  let seen = 0;
  for (const file of ["mathsense.css", "index.html", ...SOURCES, "missions.js"]) {
    for (const m of read(file).matchAll(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi)) {
      const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join("") : m[1];
      const { h, sat } = hue([0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)));
      seen += 1;
      assert.ok(!(h >= 255 && h <= 335 && sat > 0.15), `${file}: #${hex}`);
    }
    assert.ok(!/\b(violet|purple|indigo|magenta)\b/i.test(read(file).replace(/\/\*[\s\S]*?\*\//g, "")), file);
  }
  assert.ok(seen > 15, "the sweep looked at real colours");
});
