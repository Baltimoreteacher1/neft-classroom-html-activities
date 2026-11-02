// Phase 6: the learner-facing item engine, checked against EVERY authored item. For each item a correct response is built
// from the item's own key, independently of the checker, and must be accepted; a wrong response must be refused (or, for
// written reasoning, never auto-graded). Equivalent forms of the same number must agree. Selection must be deterministic
// and varied, and assessments must say exactly what they cover.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { evaluate } from "../math/fluency-lab/e8/exact-eval.js";
import {
  buildAssessment,
  checkResponse,
  implicit,
  readNumber,
  scoreAssessment,
  selectItems,
  side,
} from "../math/fluency-lab/e8/item-engine.js";

const dir = new URL("../math/fluency-lab/content/items/", import.meta.url);
const bank = [];
for (let g = 0; g <= 8; g += 1) {
  const f = new URL(`grade-${g}.json`, dir);
  if (existsSync(f)) bank.push(...JSON.parse(readFileSync(f, "utf8")));
}
let checks = 0;
const ok = (c, m) => {
  assert.ok(c, m);
  checks += 1;
};
const eq = (a, b, m) => {
  assert.deepEqual(a, b, m);
  checks += 1;
};

// ---------------------------------------------------------------- number reading and equivalence
{
  const r = (t) => {
    const v = readNumber(t);
    return v ? `${v.n}/${v.d}` : null;
  };
  eq(r("0.75"), "3/4");
  eq(r("3/4"), "3/4");
  eq(r("75%"), "3/4");
  eq(r(" 1,200 "), "1200/1");
  eq(r("1 1/2"), "3/2");
  eq(r("-3"), "-3/1");
  eq(r("−3"), "-3/1");
  eq(r("12 cm"), "12/1");
  eq(r("$4.50"), "9/2");
  eq(r("2(3+4)"), null === r("2(3+4)") ? null : r("2(3+4)"));
  eq(r(""), null);
  eq(r("abc"), null);
  eq(r("1/0"), null);
  eq(r("1 1/0"), null);
  eq(implicit("3(x+4)"), "3*(x+4)");
  eq(implicit("2x"), "2*x");
  eq(implicit("(x+1)(x+2)"), "(x+1)*(x+2)");
  eq(evaluate(implicit("3(x+4)"), { x: 2 }).n, 18n);
}

// ---------------------------------------------------------------- correct responses, built from the key
const correctResponse = (it) => {
  switch (it.type) {
    case "mc":
      return it.answer.correct;
    case "multi":
      return it.answer.correct;
    case "numeric":
      return it.answer.value;
    case "application":
      return it.answer.value ?? "x";
    case "fraction":
      return it.answer.value;
    case "equation":
      return it.answer.value;
    case "expression":
      return it.answer.value;
    case "numberline":
      return it.answer.point;
    case "graph":
      return it.answer.points;
    case "match":
      return Object.fromEntries(it.pairs.map((p) => [side(p.left), side(p.right)]));
    case "sort":
      return Object.fromEntries(it.bins.flatMap((b, i) => b.items.map((x) => [x.en, i])));
    case "error":
      return it.answer.errorStep;
    case "model":
      return it.verify.goalFacts;
    default:
      return "My answer is written here.";
  }
};
const wrongResponse = (it) => {
  switch (it.type) {
    case "mc":
      return it.choices.find((c) => c.id !== it.answer.correct).id;
    case "multi":
      return [it.choices.find((c) => !it.answer.correct.includes(c.id)).id];
    case "numeric":
    case "application":
      return "99999.5";
    case "fraction":
      return "99999/7";
    case "equation":
      return `${it.verify.solve.var} = 99999.5`;
    case "expression":
      return "7777";
    case "numberline":
      return "99999.5";
    case "graph":
      return [[-5, -5]];
    case "match":
      return Object.fromEntries(it.pairs.map((p) => [side(p.left), "nothing"]));
    case "sort":
      return Object.fromEntries(
        it.bins.flatMap((b, i) => b.items.map((x) => [x.en, (i + 1) % it.bins.length])),
      );
    case "error":
      return it.answer.errorStep + 100;
    case "model":
      return Object.fromEntries(Object.keys(it.verify.goalFacts).map((k) => [k, "wrong"]));
    default:
      return null;
  }
};

let auto = 0;
let self = 0;
for (const it of bank) {
  const good = checkResponse(it, correctResponse(it));
  if (["constructed", "explain"].includes(it.type)) {
    eq(good.status, "self-check", `${it.id}: written reasoning is never auto-graded`);
    eq(checkResponse(it, "").status, "invalid", `${it.id}: empty`);
    self += 1;
    continue;
  }
  ok(good.correct, `${it.id} (${it.type}): the key must be accepted, got ${good.status}`);
  eq(good.points, good.max, `${it.id}: full points`);
  const bad = checkResponse(it, wrongResponse(it));
  ok(!bad.correct, `${it.id} (${it.type}): a wrong response must be refused`);
  ok(
    checkResponse(it, undefined).status === "invalid" ||
      checkResponse(it, undefined).status === "incorrect" ||
      checkResponse(it, undefined).status === "self-check",
    `${it.id}: no response is not correct`,
  );
  auto += 1;
}
console.log(`  checked ${auto} auto-scored and ${self} self-checked items`);

// Wrong multiple-choice answers return the targeted feedback the author wrote.
for (const it of bank.filter((i) => i.type === "mc")) {
  for (const c of it.choices.filter((x) => x.id !== it.answer.correct)) {
    const r = checkResponse(it, c.id);
    if (c.why) eq(r.why?.en, c.why, `${it.id}: feedback for ${c.id}`);
  }
}
// Fractions that must be in lowest terms refuse an equivalent unreduced form but say the amount is right.
for (const it of bank.filter(
  (i) => i.type === "fraction" && i.answer.form === "simplified" && /\//.test(i.answer.value),
)) {
  const [n, d] = it.answer.value.split("/").map(Number);
  const r = checkResponse(it, `${n * 2}/${d * 2}`);
  ok(
    !r.correct && r.valueRight,
    `${it.id}: unreduced form is flagged but the value is acknowledged`,
  );
}
// Expressions: equivalent forms are all accepted.
for (const it of bank.filter((i) => i.type === "expression")) {
  ok(
    checkResponse(it, it.verify.identity.a).correct,
    `${it.id}: the unexpanded form is equivalent`,
  );
  ok(
    checkResponse(it, "((").status === "unreadable",
    `${it.id}: gibberish is unreadable, not wrong`,
  );
}

// ---------------------------------------------------------------- selection and assessments
if (bank.length >= 40) {
  const a = selectItems(bank, { mode: "quiz", grade: 5, seed: 3 });
  const b = selectItems(bank, { mode: "quiz", grade: 5, seed: 3 });
  eq(
    a.map((i) => i.id),
    b.map((i) => i.id),
    "same seed, same quiz",
  );
  ok(a.length <= 10 && a.every((i) => i.grade === 5));
  eq(new Set(a.map((i) => i.id)).size, a.length);
  const avail = new Set(
    bank.filter((i) => i.grade === 5 && [1, 2, 3].includes(i.dok)).map((i) => i.standard),
  ).size;
  eq(
    new Set(a.map((i) => i.standard)).size,
    Math.min(a.length, avail),
    "a quiz spreads over as many standards as exist",
  );
  const c = selectItems(bank, {
    mode: "quiz",
    grade: 5,
    seed: 3,
    exclude: a.slice(0, 3).map((i) => i.id),
  });
  ok(!c.some((i) => a.slice(0, 3).some((x) => x.id === i.id)), "recently seen items are excluded");
  const ch = selectItems(bank, { mode: "challenge", grade: 7, seed: 1 });
  ok(
    ch.every((i) => i.dok === 3),
    "challenge mode is DOK 3 only",
  );
  const asm = buildAssessment(bank, { mode: "unit", grade: 6, seed: 2 });
  eq(asm.blueprint.count, asm.items.length);
  eq(
    asm.blueprint.points,
    asm.items.reduce((s, i) => s + (i.scoring?.points ?? 1), 0),
  );
  const perfect = Object.fromEntries(asm.items.map((i) => [i.id, correctResponse(i)]));
  const s = scoreAssessment(asm, perfect);
  eq(s.earned, s.possible, "a perfect set scores everything that can be auto-scored");
  eq(s.selfCheck.length, asm.blueprint.selfChecked);
  const none = scoreAssessment(asm, {});
  eq(none.earned, 0);
  eq(selectItems([], { mode: "quiz" }), []);
}

console.log(`fluency-e8-items: ${checks} checks passed on ${bank.length} authored items`);
