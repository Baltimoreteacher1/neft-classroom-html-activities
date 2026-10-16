// Per-choice feedback for the Session 2 (Apply Day) practice, in English and Spanish,
// and the native-review queue that records how much of the new Spanish a person has read.
//
// Run: node --test tools/spanish-feedback-additions.test.mjs
//
// What this proves:
//   * Every Unit 4 and Unit 6 multiple-choice item in data/part-two-session2-practice.json has
//     feedback for each wrong choice, in both languages, and a reinforcing note for the right one.
//   * The feedback obeys the repo's own distractor audit (no quoting the answer, no letters, no
//     duplicates, <= 220 chars, nothing on the correct slot), in English AND in Spanish.
//   * The feedback is bound to the item it was written for: edit the answer and applying it throws.
//   * The Spanish uses tú and the site's math words.
//   * data/spanish-review-queue.json lists every new Spanish string, nothing stale, nothing blank,
//     and the printable sheet and CSV round-trip a reviewer's decisions.
//   It does NOT prove the Spanish is natural: that needs a native reader (the queue's whole point).

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { spanishChoiceFeedback } from "../scripts/lib/homework-problems.mjs";
import {
  applyFeedbackAdditions,
  loadFeedbackAdditions,
  sessionTwoChoiceItems,
} from "../scripts/lib/part-two-feedback-additions.mjs";
import {
  collectNewSpanishStrings,
  loadQueue,
  NEW_STATUS,
  STATUSES,
  syncQueue,
} from "../scripts/lib/spanish-review-queue.mjs";
import {
  applyDecisions,
  groupOf,
  parseCsv,
  renderSheetCsv,
  renderSheetHtml,
} from "../scripts/spanish-review-sheet.mjs";
import { auditItem } from "./audit-distractor-feedback.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fresh = () =>
  JSON.parse(readFileSync(join(ROOT, "data/part-two-session2-practice.json"), "utf8")).lessons;
const ADDITIONS = loadFeedbackAdditions(ROOT);
const IN_SCOPE = /^(4|6)-/;
const scopeItems = () =>
  [...sessionTwoChoiceItems(fresh())].filter(({ lessonId }) => IN_SCOPE.test(lessonId));

test("every Unit 4 and Unit 6 Session 2 multiple-choice item has authored feedback", () => {
  const items = scopeItems();
  assert.ok(items.length >= 100, `only ${items.length} in-scope items found`);
  const missing = items.filter(({ item }) => !ADDITIONS[item.id]).map(({ item }) => item.id);
  assert.deepEqual(missing, [], "items with no feedback in data/part-two-feedback-additions.json");
  const extra = Object.keys(ADDITIONS).filter((id) => !items.some(({ item }) => item.id === id));
  assert.deepEqual(
    extra,
    [],
    "feedback for items outside Unit 4 / Unit 6 (or items that do not exist)",
  );
});

test("each item's feedback passes the repo's distractor audit in English and Spanish", () => {
  const lessons = applyFeedbackAdditions(fresh(), ADDITIONS);
  for (const { item } of sessionTwoChoiceItems(lessons)) {
    if (!ADDITIONS[item.id]) continue;
    const correct = item.correctIndex ?? 0;
    assert.deepEqual(
      auditItem({ item, correct }),
      [],
      `${item.id}: English feedback fails the audit`,
    );
    assert.deepEqual(
      auditItem({ item: { ...item, choiceFeedback: item.choiceFeedbackEs }, correct }),
      [],
      `${item.id}: Spanish feedback fails the audit`,
    );
  }
});

test("both languages: same shape, Spanish is its own sentence, tú form, no answer words", () => {
  for (const [id, entry] of Object.entries(ADDITIONS)) {
    const n = entry.choiceFeedback.length;
    assert.equal(entry.choiceFeedbackEs.length, n, `${id}: Spanish length`);
    entry.choiceFeedback.forEach((en, i) => {
      const es = entry.choiceFeedbackEs[i];
      assert.equal(Boolean(en), Boolean(es), `${id}[${i}]: one language is empty`);
      if (!en) return;
      assert.notEqual(en.trim(), es.trim(), `${id}[${i}]: Spanish is a copy of the English`);
      assert.doesNotMatch(es, /\b(usted|ustedes)\b/i, `${id}[${i}]: use the tú form`);
      assert.doesNotMatch(en, /\b(the answer is|correct answer|right answer)\b/i, `${id}[${i}]`);
      assert.doesNotMatch(es, /\b(la respuesta es|respuesta correcta)\b/i, `${id}[${i}]`);
      assert.doesNotMatch(
        en,
        /\b(wrong answer|incorrect|stupid|silly)\b/i,
        `${id}[${i}]: say what happened, kindly`,
      );
    });
    for (const lang of ["en", "es"]) {
      const note = entry.correctNote[lang];
      assert.ok(note && note.length <= 160, `${id}: correctNote.${lang}`);
    }
  }
});

test("the Spanish keeps the math words the glossary uses", () => {
  const TERMS = [
    [/\bunit rate/i, /tasa unitaria/i, /raz[oó]n unitaria|tarifa unitaria/i],
    [/\bequivalent ratio/i, /raz[oó]n(es)? equivalente/i, /proporci[oó]n equivalente/i],
    [/\bnumber line/i, /recta num[eé]rica/i, /l[ií]nea num[eé]rica/i],
    [/\bmedian/i, /medianas?/i, null],
    [/\bnumerator/i, /numeradore?s?/i, null],
    [/\bdenominator/i, /denominadore?s?/i, null],
    [/\breciprocal/i, /rec[ií]procos?/i, null],
    [/\bmixed number/i, /n[uú]meros? mixtos?/i, null],
    [/\bflip/i, /invert|inviert|inversa|rec[ií]proco/i, /volt[eéi]/i],
    [/\binequalit/i, /desigualdad(es)?/i, null],
    [/\bequation/i, /ecuaci[oó]n/i, null],
    [/\bdecimal point/i, /puntos? decimal(es)?/i, /coma decimal/i],
    [/\blike terms/i, /t[eé]rminos? semejantes?/i, /t[eé]rminos? similares?/i],
    [/\bdistributive/i, /distributivas?/i, null],
    [/\bleast common multiple|\bLCM\b/, /m[ií]nimo com[uú]n m[uú]ltiplo|\bmcm\b|\bMCM\b/, null],
    [/\bgreatest common factor|\bGCF\b/, /m[aá]ximo com[uú]n divisor|\bMCD\b|\bmcd\b/, null],
    [/\bexponent/i, /exponentes?/i, null],
    [/\bpercent\b/i, /porcentaje|por ciento|%/i, null],
  ];
  for (const [id, entry] of Object.entries(ADDITIONS)) {
    const pairs = [
      ...entry.choiceFeedback.map((en, i) => [en, entry.choiceFeedbackEs[i]]),
      [entry.correctNote.en, entry.correctNote.es],
    ];
    for (const [en, es] of pairs) {
      if (!en) continue;
      for (const [enRe, wantRe, banRe] of TERMS) {
        if (enRe.test(en)) assert.match(es, wantRe, `${id}: "${en}" -> "${es}" misses the term`);
        if (banRe) assert.doesNotMatch(es, banRe, `${id}: uses a replaced word in "${es}"`);
      }
    }
  }
});

test("feedback is bound to its item: a changed answer makes applying it throw", () => {
  const lessons = fresh();
  const [{ item }] = [...sessionTwoChoiceItems(lessons)].filter(({ lessonId }) =>
    IN_SCOPE.test(lessonId),
  );
  item.choices = [...item.choices];
  item.choices[item.correctIndex ?? 0] = "a different answer";
  assert.throws(() => applyFeedbackAdditions(lessons, ADDITIONS), /re-author its feedback/);
  assert.throws(
    () => applyFeedbackAdditions(fresh(), { "9-9-part2-s2-99": ADDITIONS[item.id] }),
    /no Session 2 item/,
  );
});

test("applying the feedback gives the generator both languages, and keeps existing feedback", () => {
  const lessons = applyFeedbackAdditions(fresh(), ADDITIONS);
  const [{ item }] = scopeItems().map(({ item: it }) => ({
    item: lessons[it.id.replace(/-s2-\d+$/, "")] && it,
  }));
  const live = [...sessionTwoChoiceItems(lessons)].find(({ item: it }) => it.id === item.id).item;
  const correct = live.correctIndex ?? 0;
  const es = spanishChoiceFeedback(live);
  live.choices.forEach((_, i) => {
    if (i === correct) return;
    assert.equal(
      es[i],
      ADDITIONS[live.id].choiceFeedbackEs[i],
      "the Spanish line reaches the page",
    );
    assert.ok(live.choiceFeedback[i], "the English line reaches the page");
  });
  const kept = fresh();
  const target = [...sessionTwoChoiceItems(kept)].find(({ item: it }) => ADDITIONS[it.id]).item;
  const own = target.choices.map((_, i) => (i === (target.correctIndex ?? 0) ? "" : `own ${i}`));
  target.choiceFeedback = own;
  applyFeedbackAdditions(kept, ADDITIONS);
  assert.deepEqual(target.choiceFeedback, own, "an item's own feedback wins");
});

test("the review queue lists every new Spanish string, with nothing stale or blank", () => {
  const queue = loadQueue(ROOT);
  const expected = collectNewSpanishStrings(ROOT);
  assert.ok(expected.length > 300, `only ${expected.length} new strings collected`);
  const id = (e) => `${e.file}|${e.key}`;
  assert.deepEqual(
    queue.map(id).sort(),
    expected.map(id).sort(),
    "queue and sources disagree: run `node scripts/spanish-review-sheet.mjs --sync`",
  );
  const bySource = new Map(expected.map((e) => [id(e), e]));
  for (const entry of queue) {
    const src = bySource.get(id(entry));
    assert.equal(entry.en, src.en, `${id(entry)}: English drifted from its source`);
    assert.equal(entry.es, src.es, `${id(entry)}: Spanish drifted from its source`);
    assert.ok(entry.en.trim() && entry.es.trim(), `${id(entry)}: blank`);
    assert.ok(STATUSES.includes(entry.status), `${id(entry)}: status "${entry.status}"`);
  }
  assert.deepEqual(syncQueue(ROOT, queue), queue, "queue is not what --sync would write");
  const files = new Set(queue.map((e) => e.file));
  assert.ok(files.has("engine/components/lab-strings-es.js"));
  assert.ok(files.has("data/part-two-feedback-additions.json"));
});

test("nothing is marked approved by an agent: a new string starts at needs-native-review", () => {
  const queue = loadQueue(ROOT);
  const approved = queue.filter((e) => e.status === "approved" && !e.reviewer);
  assert.deepEqual(approved, [], "approved entries must name the reviewer");
  const [one] = collectNewSpanishStrings(ROOT);
  const synced = syncQueue(ROOT, [{ ...one, status: "approved", reviewer: "A. Reviewer" }]);
  assert.equal(
    synced.find((e) => e.key === one.key).status,
    "approved",
    "unchanged text keeps its decision",
  );
  const edited = syncQueue(ROOT, [
    { ...one, es: `${one.es} (edited)`, status: "approved", reviewer: "A" },
  ]);
  assert.equal(
    edited.find((e) => e.key === one.key).status,
    NEW_STATUS,
    "edited text is reviewed again",
  );
});

test("sheet: HTML carries the provenance notice and escapes text; CSV round-trips decisions", () => {
  const entries = syncQueue(ROOT).slice(0, 3);
  entries[0] = { ...entries[0], en: 'a "quote" <b>& more', es: 'una "cita", con coma\ny salto' };
  const html = renderSheetHtml(entries, { generated: "2026-01-01" });
  assert.match(html, /A native Spanish speaker has not read it yet/);
  assert.match(html, /&lt;b&gt;&amp; more/);
  assert.doesNotMatch(html, /<b>& more/);
  assert.match(html, /<td lang="es">/);

  const csv = renderSheetCsv(entries);
  const rows = parseCsv(csv);
  assert.equal(rows.length, entries.length + 1);
  assert.equal(rows[1][3], entries[0].es, "quotes, commas and newlines survive");

  rows[1][5] = "approve";
  rows[1][7] = "Reviewer One";
  rows[2][5] = "change";
  rows[2][6] = "mejor texto";
  const text = rows.map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\r\n");
  const result = applyDecisions(
    entries.map((e) => ({ ...e })),
    text,
  );
  assert.equal(result.applied, 2);
  assert.equal(result.skipped, 1);
  assert.equal(result.entries[0].status, "approved");
  assert.equal(result.entries[0].reviewer, "Reviewer One");
  assert.equal(result.entries[1].status, "changes-requested");
  assert.equal(result.entries[1].suggestedEs, "mejor texto");
  assert.equal(
    result.entries[1].es,
    entries[1].es,
    "the Spanish itself is never edited by the import",
  );

  const stale = applyDecisions(
    entries.map((e) => ({ ...e, es: "cambió" })),
    text,
  );
  assert.equal(stale.applied, 0, "a decision about old wording cannot land on new wording");
  assert.equal(stale.stale, 2);
  assert.throws(() => {
    rows[2][6] = "";
    applyDecisions(
      entries.map((e) => ({ ...e })),
      rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n"),
    );
  }, /needs corrected_spanish/);
  assert.match(
    groupOf({ file: "engine/components/lab-strings-es.js", key: "unit-rate-builder.go" }),
    /unit-rate-builder/,
  );
});
