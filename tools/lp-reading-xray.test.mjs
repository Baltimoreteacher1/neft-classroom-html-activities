#!/usr/bin/env node
// Reading X-Ray (Language Page Reading Room): authored lens data and the pure lens module.
//
// 1. Every entry in content/reading-room/xray.json validates against its lesson: anchors exist in the text, every
//    pronoun points back to an earlier noun phrase in the same or previous paragraph, connections join ideas that sit
//    together, evidence sentences exist and stay inside the paragraphs the lesson's own answer key names, and every
//    structure gist is bilingual (the Reading Room chrome is EN/ES).
// 2. Negative controls: corrupted copies of real entries must be rejected, one rule at a time.
// 3. The evidence lens never exposes a question's evidence before an attempt, or after an unsupported miss.
// 4. Rendering keeps the sentence text byte-for-byte and nests marks correctly.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  availableLenses,
  evidenceRows,
  evidenceUnlocked,
  KINDS,
  lensLinks,
  lensMarks,
  ROLES,
  renderSentence,
  sentenceIndex,
  validateXray,
} from "../access-practice-lab/src/lang/reading-xray.js";

const lessons = JSON.parse(
  readFileSync("access-practice-lab/content/reading-room/lessons.json", "utf8"),
).lessons;
const xray = JSON.parse(readFileSync("access-practice-lab/content/reading-room/xray.json", "utf8"));
const byId = new Map(lessons.map((l) => [l.id, l]));
const clone = (x) => JSON.parse(JSON.stringify(x));
let checks = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  checks++;
};

// ---------- 1. authored data ----------
const entries = Object.entries(xray.lessons);
ok(entries.length >= 6, `at least 6 annotated lessons (found ${entries.length})`);
const bands = new Set(
  entries.map(([id]) => byId.get(id)?.gradeCluster || byId.get(id)?.localGradeBand),
);
ok(bands.size >= 5, `annotations span at least 5 grade bands (found ${[...bands].join(", ")})`);
for (const [id, entry] of entries) {
  const lesson = byId.get(id);
  ok(lesson, `${id} is a Reading Room lesson`);
  const errors = validateXray(lesson, entry);
  assert.deepEqual(errors, [], `${id} validates:\n  ${errors.join("\n  ")}`);
  checks++;
  ok(availableLenses(entry).length === 4, `${id} has data for all four lenses`);
  // Every link resolves, so the lens shows exactly what was authored.
  ok(
    lensLinks(lesson, entry, "pronoun").length === entry.pronouns.length,
    `${id}: every pronoun link resolves`,
  );
  ok(
    lensLinks(lesson, entry, "connection").length === entry.connections.length,
    `${id}: every connection resolves`,
  );
}
for (const [key, [en, es]] of Object.entries(ROLES))
  ok(en && es && en !== es, `role ${key} bilingual`);
for (const [key, k] of Object.entries(KINDS))
  ok(k.label[1] && k.from[1] && k.to[1], `kind ${key} bilingual`);

// ---------- 2. negative controls ----------
const L = byId.get("rr1-night-library");
const base = xray.lessons["rr1-night-library"];
const rejects = (mutate, pattern, label) => {
  const e = clone(base);
  mutate(e);
  const errors = validateXray(L, e);
  ok(
    errors.some((x) => pattern.test(x)),
    `rejects ${label}: got ${JSON.stringify(errors)}`,
  );
};
rejects((e) => (e.revision = "0.9.0"), /revision/, "a stale lesson revision");
rejects(
  (e) => (e.pronouns[0].ref = { s: "p3:1", t: "Anna" }),
  /does not exist/,
  "a referent that is not in the text",
);
rejects(
  (e) => (e.pronouns[0].ref = { s: "p9:0", t: "Ana" }),
  /does not exist/,
  "a sentence id that does not exist",
);
rejects(
  (e) => (e.pronouns[0].at = { s: "p3:2", t: "blue" }),
  /not a reference word/,
  "a non-pronoun annotated as a pronoun",
);
rejects(
  (e) => (e.pronouns[0].ref = { s: "p4:4", t: "Ana" }),
  /must come before/,
  "a referent after its pronoun",
);
rejects(
  (e) => (e.pronouns[4].ref = { s: "p1:2", t: "Reyes" }),
  /same or the previous paragraph/,
  "a referent two paragraphs back",
);
rejects((e) => e.pronouns.push({ ...e.pronouns[0] }), /duplicate id/, "duplicate ids");
rejects((e) => (e.connections[0].kind = "because"), /unknown kind/, "an unknown connection kind");
rejects(
  (e) => (e.connections[0].from = { s: "p4:4" }),
  /neighbours/,
  "a connection spanning distant paragraphs",
);
rejects(
  (e) => (e.connections[0].signal = { s: "p2:0", t: "Then Pablo" }),
  /overlap|tappable|same words/,
  "a span that cuts through the signal word",
);
rejects(
  (e) => (e.evidence.evidence = ["p1:0"]),
  /outside the paragraphs the answer key names/,
  "evidence outside the key's paragraph",
);
rejects(
  (e) => (e.evidence.inference = ["p3:9"]),
  /does not exist/,
  "an evidence sentence that does not exist",
);
rejects(
  (e) => (e.evidence["no-such-question"] = ["p1:0"]),
  /unknown question/,
  "evidence for a missing question",
);
rejects((e) => (e.evidence.vocab = []), /empty/, "empty evidence");
rejects((e) => (e.structure[0].gist.es = ""), /English and Spanish/, "a gist with no Spanish");
rejects(
  (e) => (e.structure[0].gist.es = e.structure[0].gist.en),
  /copy of the English/,
  "a Spanish gist copied from English",
);
rejects((e) => e.structure.pop(), /every paragraph once/, "structure missing a paragraph");
rejects((e) => (e.structure[1].role = "climax"), /unknown role/, "an unknown structure role");

// ---------- 3. evidence gate ----------
const choice = L.activities.find((a) => a.id === "inference");
const short = L.activities.find((a) => a.id === "transfer");
ok(!evidenceUnlocked(choice, undefined), "no attempt: locked");
ok(!evidenceUnlocked(choice, { value: "a" }), "chosen but not checked: locked");
ok(
  !evidenceUnlocked(choice, { checked: true, correct: false, attempts: 1 }),
  "first miss: locked (no answer on a first miss)",
);
ok(evidenceUnlocked(choice, { checked: true, correct: true }), "supported answer: open");
ok(
  evidenceUnlocked(choice, { checked: true, correct: false, revealed: true }),
  "explanation opened by the learner: open",
);
ok(!evidenceUnlocked(short, { text: "I ask first." }), "written but not self-checked: locked");
ok(!evidenceUnlocked(short, { selfChecked: true, text: "   " }), "self-checked but empty: locked");
ok(
  evidenceUnlocked(short, { selfChecked: true, text: "I ask first." }),
  "self-checked response: open",
);

const locked = lensMarks(L, base, "evidence", {});
ok(locked.size === 0, "no evidence marks reach the page before any attempt");
const rows = evidenceRows(L, base, {});
ok(
  rows.every((r) => !r.open && r.sentences.length === 0),
  "locked rows carry no sentence text",
);
const opened = lensMarks(L, base, "evidence", { inference: { checked: true, correct: true } });
ok(
  [...opened.keys()].sort().join() === "p3:3,p4:2",
  "only the answered question's sentences are marked",
);

// ---------- 4. rendering ----------
const strip = (h) =>
  h
    .replace(/<[^>]+>/g, "")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
for (const [id, entry] of entries) {
  const lesson = byId.get(id);
  const index = sentenceIndex(lesson);
  for (const lens of ["pronoun", "connection"]) {
    const marks = lensMarks(lesson, entry, lens);
    for (const [key, list] of marks) {
      const html = renderSentence(index.get(key).text, list, "rxHint");
      ok(
        strip(html) === index.get(key).text,
        `${id} ${lens} ${key}: text survives rendering unchanged`,
      );
      ok(
        !/<button[^>]*>[^<]*<(span|button)/.test(html),
        `${id} ${lens} ${key}: nothing nested inside a tappable word`,
      );
    }
  }
}
const storm = byId.get("rr23-storm-log");
const stormMarks = lensMarks(storm, xray.lessons["rr23-storm-log"], "connection").get("p2:2");
const stormHtml = renderSentence(sentenceIndex(storm).get("p2:2").text, stormMarks, "rxHint");
ok(
  /^<span class="rx-span" data-rx-from="so-1"><span class="rx-span" data-rx-to="after-1">The thunder came<\/span> <button[^>]*data-rx-sig="after-1"/.test(
    stormHtml,
  ),
  `nested idea spans render inside the whole-sentence cause: ${stormHtml}`,
);
const line = lensLinks(L, base, "pronoun").find((x) => x.id === "she-1").line;
ok(
  line[0] === "“She” refers to “Ana”." && line[1] === "“She” se refiere a “Ana”.",
  "screen-reader line names both words",
);

console.log(
  `lp-reading-xray: PASS (${checks} checks, ${entries.length} lessons: ${entries.map(([id]) => id).join(", ")})`,
);
