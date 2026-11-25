// Language Demand Analyzer (access-practice-lab/src/demand). Pins the rules a teacher relies on: every flag quotes the
// teacher's own words, the task is never rewritten, chunking only splits, the tool never claims a student level, and
// nothing leaves the page.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  analyzeDemand,
  BANDS,
  chunkDirections,
  LONG_SENTENCE,
  MAX_CHARS,
} from "../access-practice-lab/src/demand/analyze.js";
import {
  CHECKS,
  FRAMES,
  IDIOMS,
  MULTI_MEANING,
  PRACTICE,
  PURPOSES,
  WORDS_PRACTICE,
} from "../access-practice-lab/src/demand/patterns.js";
import { tokenize } from "../access-practice-lab/src/lang/text.js";

const TASK =
  "Read the passage about erosion, underline the evidence that supports the claim, and then explain why the riverbank was changed by the flood. " +
  "In the long run, the production of sediment and the reduction of vegetation lead to the deterioration of the bank. " +
  "This shows that the table of data is a drop in the bucket unless you compare the two graphs. " +
  "Although the river, which carries sediment from the mountains, slows down when it reaches the flat plain because the slope decreases, the sediment settles and forms a delta where farmers plant crops.";

const SRC = fileURLToPath(new URL("../access-practice-lab/src/demand/", import.meta.url));

test("every finding quotes a verbatim span of the teacher's text, at the stated offsets", () => {
  for (const band of BANDS) {
    const r = analyzeDemand(TASK, { band, subject: "sci" });
    assert.ok(r.findings.length >= 5, `${band}: expected several findings`);
    for (const f of r.findings) {
      assert.equal(TASK.slice(f.start, f.end), f.quote, `${band} ${f.kind}`);
      assert.ok(f.why.length > 20 && f.tip.length > 10, `${f.kind} explains itself`);
    }
  }
});

test("the main barrier kinds are each found on a task that has them", () => {
  const kinds = new Set(
    analyzeDemand(TASK, { band: "6-8", subject: "sci" }).findings.map((f) => f.kind),
  );
  for (const k of [
    "stacked-directions",
    "long-sentence",
    "idiom",
    "multiple-meaning",
    "passive",
    "noun-heavy",
    "reference",
  ])
    assert.ok(kinds.has(k), `missing ${k}`);
});

test("a shorter limit for younger bands flags the same sentence that an older band lets pass", () => {
  const s = "Describe how the plant gets water from the soil and sunlight from the sky.";
  const flagged = (band) =>
    analyzeDemand(s, { band }).findings.some((f) => f.kind === "long-sentence");
  assert.equal(flagged("K-2"), true);
  assert.equal(flagged("6-8"), false);
  assert.ok(
    LONG_SENTENCE["K-2"] < LONG_SENTENCE["3-5"] && LONG_SENTENCE["3-5"] < LONG_SENTENCE["6-8"],
  );
});

test("chunking only splits: every step is made of the teacher's own words, in order, and nothing is added", () => {
  const steps = chunkDirections(
    "Read the passage, underline the evidence, and then explain why it matters.",
  );
  assert.deepEqual(steps, [
    "Read the passage.",
    "Underline the evidence.",
    "Explain why it matters.",
  ]);
  const original = tokenize(TASK).map((t) => t.lower);
  let cursor = 0;
  for (const word of chunkDirections(TASK).flatMap((s) => tokenize(s).map((t) => t.lower))) {
    const at = original.indexOf(word, cursor);
    assert.ok(at >= 0, `"${word}" is not in the original, in order`);
    cursor = at;
  }
});

test("a task with one action is returned as written, not chunked", () => {
  assert.deepEqual(chunkDirections("Solve the equation."), ["Solve the equation."]);
});

test("priority vocabulary comes with a Word Lab gloss, a Spanish equivalent and an honest cognate warning", () => {
  const r = analyzeDemand("Find the absolute value, then compare the ratio to the actual amount.", {
    band: "6-8",
    subject: "math",
  });
  const abs = r.vocabulary.find((v) => v.word === "absolute");
  assert.ok(abs?.gloss && abs.es, "absolute has a gloss and a Spanish word");
  assert.ok(r.vocabulary.length <= 10);
  for (const v of r.vocabulary.filter((x) => x.cognate === "false"))
    assert.ok(v.warn, `${v.word} is a false friend and must carry its warning`);
});

test("purposes, frames, checks and visuals are chosen from the task's own verbs", () => {
  const r = analyzeDemand("Compare the two climates and argue which city is better for a garden.", {
    band: "6-8",
  });
  const ids = r.purposes.map((p) => p.id);
  assert.ok(ids.includes("compare") && ids.includes("argue"));
  for (const p of r.purposes) {
    assert.ok(
      p.frames.guided.length >= 2 && p.frames.supported.length && p.frames.independent,
      `${p.id} fades to independent`,
    );
    assert.ok(p.check.ticket && p.check.oral);
  }
  assert.ok(r.visuals.some((v) => /Venn/.test(v)));
});

test("every purpose has frames that fade and a formative check; every idiom and word has a plain meaning", () => {
  for (const p of PURPOSES) {
    assert.ok(FRAMES[p.id] && CHECKS[p.id], p.id);
    assert.ok(
      FRAMES[p.id].guided.every((f) => f.includes("___")),
      `${p.id} frames have a blank to fill`,
    );
  }
  assert.ok(IDIOMS.length >= 45 && IDIOMS.every(([p, m]) => p && m));
  assert.ok(
    Object.keys(MULTI_MEANING).length >= 40 &&
      Object.values(MULTI_MEANING).every((v) => v.length === 2 && v[0] && v[1]),
  );
});

test("empty and oversize input are handled; analysis is deterministic", () => {
  assert.equal(analyzeDemand("").empty, true);
  assert.equal(analyzeDemand("   \n ").empty, true);
  assert.equal(analyzeDemand(null).empty, true);
  const long = "Explain the cycle. ".repeat(2000);
  assert.ok(analyzeDemand(long).stats.words <= MAX_CHARS / 5);
  assert.deepEqual(analyzeDemand(TASK, { band: "3-5" }), analyzeDemand(TASK, { band: "3-5" }));
});

test("the tool states its limits and never names a student level, score or proficiency", () => {
  const r = analyzeDemand(TASK);
  assert.ok(r.limits.some((l) => /not a reading level/i.test(l)));
  assert.ok(r.limits.some((l) => /district/i.test(l)));
  const wording = JSON.stringify([r.limits, r.findings.map((f) => [f.why, f.tip]), r.purposes]);
  assert.doesNotMatch(wording, /\b(proficiency level|WIDA level|your students are|score of)\b/i);
});

test("the module is local: no network, no storage, no AI call", () => {
  for (const f of readdirSync(SRC).filter((n) => n.endsWith(".js"))) {
    const code = readFileSync(`${SRC}${f}`, "utf8");
    assert.doesNotMatch(
      code,
      /\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|WebSocket|api\//,
      f,
    );
  }
});

test("a word inside an idiom is reported once, as the idiom, not again as a multiple-meaning word", () => {
  const r = analyzeDemand("In the long run, the plan will work.", { band: "6-8" });
  assert.ok(r.findings.some((f) => f.kind === "idiom"));
  assert.ok(
    !r.findings.some((f) => f.kind === "multiple-meaning" && f.quote.toLowerCase() === "run"),
  );
});

test("every practice link points at a tool that exists in the lab's sitemap", () => {
  const sitemap = readFileSync(
    fileURLToPath(new URL("../access-practice-lab/src/sitemap.js", import.meta.url)),
    "utf8",
  );
  const ids = new Set([...sitemap.matchAll(/\bid:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]));
  for (const p of PURPOSES) {
    assert.ok(PRACTICE[p.id]?.length >= 2, `${p.id} has practice links`);
    for (const [id, en, es] of PRACTICE[p.id])
      assert.ok(ids.has(id) && en && es, `${p.id} -> ${id}`);
  }
  assert.ok(ids.has(WORDS_PRACTICE[0]));
});
