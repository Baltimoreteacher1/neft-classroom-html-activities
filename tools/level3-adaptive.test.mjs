/* Level 3 · Adaptive Small Group — engine, checker, and config contracts.
 *
 * These are the acceptance criteria for the adaptive runtime, written as
 * executable checks so a future edit that quietly breaks "one wrong answer is
 * not a label" or "no answer keys ship to students" fails loudly.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { checkAnswer, digest, normalizeResponse } from "../assets/level3/checker.js";
import {
  adapt,
  applyDecision,
  CLASSIFICATION,
  CORROBORATION,
  createSession,
  hintAt,
  infer,
  MAX_HINT,
  markVerified,
  observe,
  overrideSupport,
  pinSupport,
  primaryFinding,
  teacherSummary,
  verify,
} from "../assets/level3/engine.js";
import { LESSONS as SOURCE } from "./level3-source.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG = JSON.parse(readFileSync(path.join(ROOT, "data", "level3-adaptive.json"), "utf8"));

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

let passed = 0;
const ok = (n) => {
  console.log(`  ✓ ${n}`);
  passed += 1;
};

const L31 = CONFIG.lessons["3-1"];
const L32 = CONFIG.lessons["3-2"];
const L41 = CONFIG.lessons["4-1"];

// ── Shipped config must not contain an answer key ────────────────────────────
{
  const raw = readFileSync(path.join(ROOT, "data", "level3-adaptive.json"), "utf8");
  const offenders = [];
  // Fields a compiled item is ALLOWED to carry. Anything else is a leak vector.
  const ALLOWED = new Set([
    "id",
    "salt",
    "prompt",
    "kind",
    "representation",
    "targets",
    "hints",
    "prerequisite",
    "frames",
    "vocab",
    "answer",
    "distractors",
  ]);
  // Student-visible prose (prompt/hints/frames) legitimately restates the
  // scenario's numbers, so the leak check runs over the STRUCTURED fields only.
  const structuralOf = (item) => {
    const { prompt, hints, frames, ...rest } = item;
    return rest;
  };

  let checkedAnswers = 0;
  for (const lesson of SOURCE) {
    const groups = [
      ...(lesson.diagnostic || []),
      ...(lesson.bank || []),
      ...(lesson.transfer || []),
      ...(lesson.prerequisites || []).flatMap((p) => p.bridge || []),
    ];
    for (const item of groups) {
      const compiled = findCompiled(item.id);
      assert.ok(compiled, `${item.id} was not compiled into the shipped config`);
      for (const key of Object.keys(compiled)) {
        if (!ALLOWED.has(key)) offenders.push(`${item.id} carries unexpected field "${key}"`);
      }
      // Every stored digest must be a 64-char hex SHA-256 …
      for (const h of (compiled.answer && compiled.answer.hashes) || []) {
        if (!/^[0-9a-f]{64}$/.test(h))
          offenders.push(`${item.id} answer hash is not a SHA-256 digest`);
      }
      for (const d of compiled.distractors || []) {
        if (!/^[0-9a-f]{64}$/.test(d.hash))
          offenders.push(`${item.id} distractor hash is not a SHA-256 digest`);
      }
      // … and must actually be the digest of the authored answer, which proves
      // the stored value is a one-way hash rather than the answer itself.
      for (const a of item.answers || []) {
        const expected = await digest(compiled.salt, a);
        if (!((compiled.answer && compiled.answer.hashes) || []).includes(expected)) {
          offenders.push(`${item.id} accepted answer "${a}" has no matching digest`);
        }
        checkedAnswers += 1;
        // The plaintext answer must not survive anywhere in the structured
        // fields. Matched on word boundaries: a bare "8" or "b" would otherwise
        // "match" inside an item id, a hex digest, or the word "table".
        const structural = JSON.stringify(structuralOf(compiled)).replace(/[0-9a-f]{64}/g, "");
        const needle = new RegExp(`(?<![\\w.])${escapeRe(String(a).toLowerCase())}(?![\\w.])`);
        if (needle.test(structural.toLowerCase())) offenders.push(`${item.id} leaks "${a}"`);
      }
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `answer key leaked into shipped config:\n${offenders.join("\n")}`,
  );
  assert.ok(!/"answers"\s*:/.test(raw), "shipped config must not carry an `answers` array");
  assert.ok(checkedAnswers > 20, `expected the whole item bank, checked ${checkedAnswers}`);
  ok(
    `shipped config carries hashed digests only — no plaintext answer key (${checkedAnswers} answers verified)`,
  );
}

function findCompiled(id) {
  for (const lesson of Object.values(CONFIG.lessons)) {
    for (const group of [lesson.diagnostic, lesson.bank, lesson.transfer]) {
      const hit = (group || []).find((i) => i.id === id);
      if (hit) return hit;
    }
    for (const p of lesson.prerequisites || []) {
      const hit = (p.bridge || []).find((i) => i.id === id);
      if (hit) return hit;
    }
  }
  return null;
}

// ── Rigor is pinned to the lesson, never authored ────────────────────────────
{
  for (const [id, lesson] of Object.entries(CONFIG.lessons)) {
    const doc = JSON.parse(readFileSync(path.join(ROOT, "lessons", id, "config.json"), "utf8"));
    assert.equal(lesson.standard, doc.standard, `${id}: standard drifted from the lesson`);
    assert.equal(
      lesson.learningTarget,
      doc.contentObjective || "",
      `${id}: learning target drifted from the lesson`,
    );
    assert.ok(lesson.learningTarget.length > 10, `${id}: learning target is empty`);
  }
  ok(
    `every Level 3 lesson pins the lesson's own target and standard (${Object.keys(CONFIG.lessons).length} lessons)`,
  );
}

// ── Hint ladders: 5 rungs, and the last rung never states an answer ──────────
{
  const offenders = [];
  for (const lesson of SOURCE) {
    const items = [
      ...(lesson.diagnostic || []),
      ...(lesson.bank || []),
      ...(lesson.transfer || []),
      ...(lesson.prerequisites || []).flatMap((p) => p.bridge || []),
    ];
    for (const item of items) {
      if ((item.hints || []).length !== MAX_HINT) {
        offenders.push(`${item.id} has ${(item.hints || []).length} hints, expected ${MAX_HINT}`);
        continue;
      }
      const last = item.hints[MAX_HINT - 1];
      // Rung 5 shows a partial structure: it must leave a blank for the student.
      if (!last.includes("___"))
        offenders.push(`${item.id} rung 5 completes the reasoning: "${last}"`);
      // and must not simply state an accepted answer.
      for (const a of item.answers || []) {
        const bare = String(a).replace(/^\$/, "");
        if (bare.length > 1 && new RegExp(`=\\s*${escapeRe(bare)}\\b`).test(last)) {
          offenders.push(`${item.id} rung 5 states the answer "${a}"`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], `hint ladder problems:\n${offenders.join("\n")}`);
  ok("every item has a 5-rung ladder whose top rung shows structure, not an answer");
}

// ── Checker: right, wrong, and diagnosed-wrong ───────────────────────────────
{
  const item = L31.diagnostic[0]; // ratio of apple juice to sparkling water
  assert.equal((await checkAnswer(item, "3:5")).correct, true);
  assert.equal(
    (await checkAnswer(item, "3 to 5")).correct,
    true,
    "accepts an authored alternate form",
  );
  const reversed = await checkAnswer(item, "5:3");
  assert.equal(reversed.correct, false);
  assert.equal(
    reversed.misconception,
    "reversed-ratio-order",
    "reversal is diagnosed, not just wrong",
  );
  // A label or a unit the student adds must not cost them the item: the
  // digests are built from the same canonical form the runtime hashes.
  // A decimal, though, is NOT a ratio — the checker deliberately stops short
  // of full numeric equivalence so "0.6" cannot answer "3:5".
  assert.equal((await checkAnswer(item, "r = 3:5")).correct, true, "a variable label is optional");
  assert.equal((await checkAnswer(item, "0.6")).correct, false, "a decimal is not a ratio");

  const nonsense = await checkAnswer(item, "banana");
  assert.equal(nonsense.correct, false);
  assert.equal(
    nonsense.misconception,
    null,
    "an unrecognized wrong answer must not be given a label",
  );
  ok("checker validates by salted digest and diagnoses only KNOWN wrong answers");
}

// ── Salting: identical answers on different items hash differently ───────────
{
  const a = await digest("3-1:x", "8");
  const b = await digest("3-2:y", "8");
  assert.notEqual(a, b, "digests must be salted per item");
  assert.equal(normalizeResponse(" 3 TO 5. "), "3:5");
  assert.equal(normalizeResponse("$0.60"), "0.60");
  ok("digests are per-item salted and responses normalize before hashing");
}

// ── One wrong answer is NEVER a label ────────────────────────────────────────
{
  let s = createSession(L32);
  s = observe(s, {
    itemId: "3-2-d1",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  const findings = infer(s, L32);
  const mis = findings.find((f) => f.type === CLASSIFICATION.MISCONCEPTION);
  assert.equal(mis, undefined, "a single sighting must not produce a misconception finding");
  const watch = findings.find((f) => f.id === "additive-reasoning");
  assert.equal(watch.type, CLASSIFICATION.INSUFFICIENT);
  assert.equal(watch.confidence, "watch");
  ok(`one wrong answer stays "insufficient evidence" (needs ${CORROBORATION} sightings)`);
}

// ── A corroborated, RELEVANT mistake changes the next task and representation ─
{
  let s = createSession(L32);
  s = { ...s, phase: "core" }; // diagnostic already complete
  const before = adapt(s, L32);
  s = observe(s, {
    itemId: "3-2-d1",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  s = observe(s, {
    itemId: "3-2-d2",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  const after = adapt(s, L32);
  assert.equal(after.action, "target-misconception");
  assert.equal(after.misconception, "additive-reasoning");
  assert.equal(
    after.supports.representation,
    "double-number-line",
    "representation changed to the one that targets it",
  );
  assert.notEqual(after.item.id, before.item.id, "the next task changed");
  assert.ok(after.reason.length > 10, "the decision carries a student-facing reason");
  ok("a corroborated relevant mistake changes the next task AND the representation");
}

// ── An IRRELEVANT mistake does not trigger an unrelated intervention ─────────
{
  let s = createSession(L32);
  s = { ...s, phase: "core" };
  s = observe(s, {
    itemId: "3-2-d1",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  s = observe(s, {
    itemId: "3-2-d2",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  // Now a single, different slip on an unrelated idea.
  s = observe(s, {
    itemId: "3-2-c1",
    kind: "attempt",
    correct: false,
    misconception: "reversed-ratio-order",
  });
  const d = adapt(s, L32);
  assert.equal(
    d.misconception,
    "additive-reasoning",
    "the corroborated issue still drives instruction",
  );
  assert.notEqual(
    d.misconception,
    "reversed-ratio-order",
    "a one-off unrelated slip must not redirect the session",
  );
  ok("an uncorroborated unrelated mistake does not hijack the adaptive path");
}

// ── Two students, different evidence, different support — SAME target ────────
{
  let a = createSession(L32, { studentRef: "a" });
  a = { ...a, phase: "core" };
  a = observe(a, {
    itemId: "3-2-d1",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  a = observe(a, {
    itemId: "3-2-d2",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });

  let b = createSession(L32, { studentRef: "b" });
  b = { ...b, phase: "core" };
  b = observe(b, { itemId: "3-2-d1", kind: "attempt", correct: true });
  b = observe(b, { itemId: "3-2-d2", kind: "attempt", correct: true });
  b = observe(b, { itemId: "3-2-t1", kind: "attempt", correct: true, transfer: true });

  const da = adapt(a, L32);
  const db = adapt(b, L32);
  assert.notDeepEqual(
    da.supports,
    db.supports,
    "different evidence must produce different support",
  );
  assert.notEqual(da.action, db.action);
  assert.equal(a.learningTarget, b.learningTarget, "the learning target must be identical");
  assert.equal(a.standard, b.standard, "the standard must be identical");
  assert.ok(a.learningTarget.length > 0);
  ok("two students with different evidence get different supports and the SAME learning target");
}

// ── Success + transfer fades scaffolding instead of repeating practice ───────
{
  let s = createSession(L32, { supports: { chunking: 1, sentenceFrame: true, hintCeiling: 2 } });
  s = { ...s, phase: "core" };
  s = observe(s, { itemId: "3-2-c1", kind: "attempt", correct: true });
  s = observe(s, { itemId: "3-2-c2", kind: "attempt", correct: true });
  const d = adapt(s, L32);
  assert.ok(["fade-support", "transfer"].includes(d.action), `expected fading, got ${d.action}`);
  assert.ok(
    d.supports.chunking < 1 || d.supports.sentenceFrame === false || d.supports.hintCeiling < 2,
    "at least one scaffold must come off",
  );
  ok("two unaided successes fade a scaffold rather than serving more of the same");
}

// ── Secure students get transfer, not repetition ─────────────────────────────
{
  let s = createSession(L41);
  s = { ...s, phase: "core" };
  s = observe(s, { itemId: "4-1-c1", kind: "attempt", correct: true, hintRung: 0 });
  s = observe(s, { itemId: "4-1-c2", kind: "attempt", correct: true, hintRung: 0 });
  s = observe(s, { itemId: "4-1-c3", kind: "attempt", correct: true, hintRung: 0, transfer: true });
  const f = primaryFinding(infer(s, L41));
  assert.equal(f.type, CLASSIFICATION.SECURE);
  const d = adapt(s, L41);
  assert.equal(d.action, "transfer");
  assert.equal(d.item.id, "4-1-t1");
  ok("a secure student is routed to a transfer task, not more practice");
}

// ── Prerequisite gap: short bridge that RETURNS to grade level ───────────────
{
  let s = createSession(L41);
  s = { ...s, phase: "core" };
  s = observe(s, {
    itemId: "4-1-c1",
    kind: "attempt",
    correct: false,
    prerequisite: "divide-to-share",
  });
  s = observe(s, {
    itemId: "4-1-c2",
    kind: "attempt",
    correct: false,
    prerequisite: "divide-to-share",
  });
  const bridge = adapt(s, L41);
  assert.equal(bridge.action, "prerequisite-bridge");
  assert.equal(bridge.item.id, "4-1-b1");
  assert.ok(bridge.bridgeReturnTo, "the bridge must record where to return to");
  s = applyDecision(s, bridge);
  assert.equal(s.phase, "bridge");
  s = observe(s, { itemId: "4-1-b1", kind: "attempt", correct: true });
  const back = adapt(s, L41);
  assert.equal(
    back.action,
    "return-to-grade-level",
    "the bridge must return to the grade-level task",
  );
  s = applyDecision(s, back);
  assert.equal(s.phase, "core");
  assert.equal(s.learningTarget, L41.learningTarget, "the target never changed during the detour");
  ok("a prerequisite gap gets a short bridge that returns to the grade-level target");
}

// ── Language access is treated as access, not a math deficit ─────────────────
{
  let s = createSession(L31);
  s = { ...s, phase: "core" };
  s = observe(s, { itemId: "3-1-c1", kind: "attempt", correct: true, signal: "read-aloud" });
  s = observe(s, { itemId: "3-1-c1", kind: "access", signal: "translate" });
  s = observe(s, { itemId: "3-1-c2", kind: "access", signal: "read-aloud" });
  const findings = infer(s, L31);
  const lang = findings.find((f) => f.type === CLASSIFICATION.LANGUAGE_ACCESS);
  assert.ok(lang, "repeated access requests must register as a language-access need");
  const gap = findings.find((f) => f.type === CLASSIFICATION.PREREQUISITE_GAP);
  assert.equal(gap, undefined, "a language need must never be recorded as a prerequisite gap");
  const d = adapt(s, L31);
  assert.equal(d.action, "language-support");
  assert.equal(d.supports.sentenceFrame, true);
  assert.equal(d.supports.vocabSupport, true);
  ok("a language-access need adds language support and is never read as a math gap");
}

// ── Student can restore a support that faded too soon ────────────────────────
{
  let s = createSession(L32, { supports: { sentenceFrame: false } });
  s = { ...s, phase: "core" };
  s = pinSupport(s, "sentenceFrame", true);
  s = observe(s, { itemId: "3-2-c1", kind: "attempt", correct: true });
  s = observe(s, { itemId: "3-2-c2", kind: "attempt", correct: true });
  const d = adapt(s, L32);
  assert.equal(d.supports.sentenceFrame, true, "a pinned support must survive fading");
  ok("a student-pinned support is never faded away");
}

// ── Teacher override wins, and is reversible ────────────────────────────────
{
  let s = createSession(L32);
  s = { ...s, phase: "core" };
  s = overrideSupport(s, "representation", "tape-diagram");
  let d = adapt(s, L32);
  assert.equal(d.supports.representation, "tape-diagram", "teacher override must win");
  s = overrideSupport(s, "representation", null);
  d = adapt(s, L32);
  assert.notEqual(
    d.supports.representation,
    "tape-diagram",
    "clearing the override must restore automatic choice",
  );
  ok("teacher overrides win and can be cleared");
}

// ── Verification closes a misconception out ─────────────────────────────────
{
  let s = createSession(L32);
  s = observe(s, {
    itemId: "3-2-d1",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  s = observe(s, {
    itemId: "3-2-d2",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  assert.equal(verify(s, L32, "additive-reasoning"), false, "not verified before any success");
  s = observe(s, { itemId: "3-2-t1", kind: "attempt", correct: true, hintRung: 0, transfer: true });
  assert.equal(verify(s, L32, "additive-reasoning"), true, "success in a new context verifies it");
  s = markVerified(s, "additive-reasoning");
  const still = infer(s, L32).find((f) => f.type === CLASSIFICATION.MISCONCEPTION);
  assert.equal(still, undefined, "a verified misconception stops driving instruction");
  ok("a misconception is only cleared by success in a NEW context, then stops driving instruction");
}

// ── Teacher summary shows evidence, never a ranking or a fixed label ─────────
{
  let s = createSession(L32);
  s = observe(s, {
    itemId: "3-2-d1",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  s = observe(s, {
    itemId: "3-2-d2",
    kind: "attempt",
    correct: false,
    misconception: "additive-reasoning",
  });
  const sum = teacherSummary(s, L32);
  assert.ok(
    sum.suggestion.toLowerCase().includes("current evidence suggests"),
    "must be hedged, not a label",
  );
  assert.ok(sum.evidence.includes("sightings"), "must show the evidence behind the suggestion");
  assert.equal(sum.learningTarget, L32.learningTarget);
  assert.equal(sum.supportDirection, "increasing");
  for (const banned of ["low", "below", "struggling", "weak", "level 1", "tier"]) {
    assert.ok(
      !sum.suggestion.toLowerCase().includes(banned),
      `stigmatizing word "${banned}" in teacher summary`,
    );
  }
  ok("the teacher summary is hedged, evidence-backed, and free of stigmatizing labels");
}

// ── Hint ladder access is bounded and never returns an answer ───────────────
{
  const item = L41.diagnostic[0];
  assert.equal(hintAt(item, 1), item.hints[0]);
  assert.equal(
    hintAt(item, 99),
    item.hints[MAX_HINT - 1],
    "rung is clamped to the top of the ladder",
  );
  assert.ok(
    hintAt(item, MAX_HINT).includes("___"),
    "the top rung still leaves work for the student",
  );
  ok("hint access is clamped and the top rung still leaves the reasoning to the student");
}

// ── Diagnostic is short by contract ─────────────────────────────────────────
{
  for (const [id, lesson] of Object.entries(CONFIG.lessons)) {
    assert.ok(
      lesson.diagnostic.length <= 3,
      `${id}: diagnostic has ${lesson.diagnostic.length} tasks, max 3`,
    );
    assert.ok(lesson.diagnostic.length >= 1, `${id}: no diagnostic`);
    assert.ok(lesson.bank.length >= 3, `${id}: bank too thin to adapt`);
    assert.ok(lesson.transfer.length >= 1, `${id}: no transfer task`);
    assert.ok(
      lesson.representations.length >= 2,
      `${id}: needs at least two representations to switch between`,
    );
  }
  ok(
    "every configured lesson has a <=3-task diagnostic, a real bank, a transfer task, and switchable representations",
  );
}

// ── The six required ratio-cluster misconceptions are all covered ───────────
{
  const required = [
    "additive-reasoning",
    "scaling-one-quantity",
    "reversed-ratio-order",
    "part-to-part-vs-part-to-whole",
    "unit-rate-calculation",
  ];
  const covered = new Set();
  for (const lesson of Object.values(CONFIG.lessons)) {
    for (const m of lesson.misconceptions || []) covered.add(m.id);
    for (const group of [lesson.diagnostic, lesson.bank, lesson.transfer]) {
      for (const item of group || [])
        for (const d of item.distractors || []) covered.add(d.misconception);
    }
  }
  const missing = required.filter((r) => !covered.has(r));
  assert.deepEqual(missing, [], `ratio cluster misses: ${missing.join(", ")}`);
  ok("the ratio cluster detects all five mathematical misconceptions, plus language access");
}

console.log(`\nlevel3 adaptive small group: ${passed} checks passed`);
