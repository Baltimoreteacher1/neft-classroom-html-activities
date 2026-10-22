// "A student solved this" rounds (Spot the Mistake): every skill family gets a worked solution with one flawed step.
// The generator is NOT trusted. A small exact-arithmetic checker (BigInt fractions, linear expressions in one
// variable, equations and inequalities) walks each item and proves: the steps before the flaw equal the step
// before them, the flawed step does not, the steps after it follow from it, exactly one of the three offered
// repairs puts the flaw right, and the right result never appears on screen before the error is found.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const lab = "../math/fluency-lab/";
const { ALL_SKILLS, getGrade, seededRandom } = await import(`${lab}problem-bank.js`);
const { buildWorkItem, describeAsk, FAMILIES, skillFamily, workRounds } = await import(
  `${lab}mistake-bank.js`
);
const { TEMPLATES } = await import(`${lab}mistake-templates.js`);
const { SLIP_IDS, slipInfo } = await import(`${lab}mistake-notes.js`);

import {
  equivalent,
  isNumber,
  konst,
  ONE,
  parse,
  polyEq,
  Q,
  solution,
  value,
  ZERO,
} from "./lib/exact-math.mjs";

// ---------- the checker's own self-test: it must say no to wrong claims ----------
assert.ok(equivalent("1/3 + 1/4", "4/12 + 3/12"));
assert.ok(!equivalent("1/3 + 1/4", "7/24"));
assert.ok(equivalent("2(x + 3) = 14", "2x + 6 = 14"));
assert.ok(!equivalent("2(x + 3) = 14", "2x + 3 = 14"));
assert.ok(equivalent("−2x + 9 ≥ −7", "x ≤ 8"));
assert.ok(!equivalent("−2x + 9 ≥ −7", "x ≥ 8"));
assert.ok(equivalent("3 : 4", "15/20"));
assert.ok(!equivalent("3 : 4", "(3 + 5)/(4 + 5)"));
assert.ok(equivalent("25% of 80", "0.25 × 80"));
assert.ok(equivalent("π × 3^2", "9π"));
assert.ok(!equivalent("π × 3^2", "π × 6"));
assert.ok(equivalent("6 ÷ 3/4", "8"));

// ---------- independent facts about the meta problems ----------
const UNIT_SIZE = {
  "in>ft": 12,
  "ft>yd": 3,
  "min>h": 60,
  "cm>m": 100,
  "oz>lb": 16,
  "qt>gal": 4,
  "mm>cm": 10,
};
function expectedFromMeta(m) {
  const r = (n, d = 1) => konst(new Q(BigInt(n), BigInt(d)));
  switch (m.kind) {
    case "area":
      return r(m.k * m.n);
    case "perimeter":
      return r(2 * (m.l + m.w));
    case "volume":
      return r(m.l * m.w * m.h);
    case "circle":
      return { a: new Q(BigInt(m.r * m.r)), b: ZERO, v: "π" };
    case "rate":
      return r(m.c, m.q);
    case "slope":
      return r(m.y2 - m.y1, m.x2 - m.x1);
    case "percent":
      return r(m.p * m.n, 100);
    case "pctChange":
      return r(m.up ? m.n * 100 + m.p * m.n : m.n * 100 - m.p * m.n, 100);
    case "fracOf":
      return r(m.n * m.m, m.d);
    case "function":
      return r(m.a - m.b * (m.c + m.d));
    case "pyth":
      return r(m.a * m.a + m.b * m.b);
    case "chance":
      return r(m.n1 + m.n2, m.d);
    case "ratio":
      return r(m.a, m.b);
    case "equalFrac":
      return r(m.n, m.d);
    case "simplify":
      return r(m.A, m.B);
    case "convert": {
      const down = !(`${m.from}>${m.to}` in UNIT_SIZE);
      const size = UNIT_SIZE[`${m.small}>${m.big}`];
      assert.ok(size, `known unit pair ${m.small}/${m.big}`);
      return down ? r(m.q * size) : r(m.q, size);
    }
    default:
      throw new Error(`No independent rule for ${m.kind}`);
  }
}

// Mechanism checks: the flawed step differs from the right repair in the way the named slip says it should.
function mechanismHolds(item) {
  const flawed = item.steps[item.bad];
  if (item.slip === "no-flip-ineq")
    return (
      solution(parse(flawed)).split(" ")[1] === solution(parse(item.fix)).split(" ")[1] &&
      solution(parse(flawed)) !== solution(parse(item.fix))
    );
  if (item.mode === "eq") return true;
  const [bad, good] = [value(flawed), value(item.fix)];
  if (!isNumber(bad) || !isNumber(good)) return true;
  const diff = bad.a.sub(good.a).add(bad.b.sub(good.b)).str();
  switch (item.slip) {
    case "neg-neg":
      return bad.b.eq(good.b.neg());
    case "flip-ratio":
      return bad.b.mul(good.b).eq(ONE);
    case "add-across":
      return bad.b.mul(new Q(2n)).eq(good.b);
    case "no-regroup":
      return ["-10", "-1"].includes(diff);
    case "pct-shift":
      return bad.b.mul(new Q(10n)).eq(good.b);
    case "no-hundred":
      return bad.b.eq(good.b.mul(new Q(100n)));
    case "point-count":
      return bad.b.eq(good.b.mul(new Q(10n)));
    default:
      return true;
  }
}

// ---------- the sweep: every skill, many seeds ----------
const SEEDS = 80;
const leaks = (item, text) =>
  [item.answer, item.answerAlt].some(
    (form) =>
      form &&
      form.length > 1 &&
      !text.includes(form) &&
      item.steps.some((step) =>
        new RegExp(
          `(?<![\\w./−-])${form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w/]|\\.\\d)`,
        ).test(step),
      ),
  );
const families = new Set();
const templatesSeen = new Set();
let items = 0;
let earlyFlaw = 0;
const problems = new Map();
for (const skill of ALL_SKILLS) {
  const starts = new Set();
  for (let seed = 1; seed <= SEEDS; seed += 1) {
    const item = buildWorkItem(skill, seed);
    const tag = `${skill.grade}:${skill.id} seed ${seed} [${item.template}]`;
    items += 1;
    families.add(item.family);
    templatesSeen.add(item.template);
    starts.add(item.start);
    try {
      assert.deepEqual(item, buildWorkItem(skill, seed), `${tag}: same seed, same item`);
      assert.ok(item.steps.length >= 3 && item.steps.length <= 4, `${tag}: 3 or 4 steps`);
      assert.ok(
        Number.isInteger(item.bad) && item.bad >= 0 && item.bad < item.steps.length,
        `${tag}: bad index`,
      );
      if (item.bad >= 1) earlyFlaw += 1;
      const rel = /[=<>≤≥]/.test(item.start);
      assert.equal(item.mode === "eq", rel, `${tag}: mode matches the problem`);
      for (const text of [item.start, ...item.steps, item.fix, ...item.fixes]) {
        assert.ok(!text.includes("-"), `${tag}: "${text}" uses a hyphen, not the minus sign`);
        assert.equal(/[=<>≤≥]/.test(text), rel, `${tag}: "${text}" is the wrong kind of line`);
      }

      // The chain: each step equals the one before; the flawed one does not; later ones follow from the flawed one.
      let previous = item.start;
      item.steps.forEach((step, i) => {
        const ok = equivalent(previous, step);
        if (i === item.bad)
          assert.ok(!ok, `${tag}: step ${i + 1} "${step}" should differ from "${previous}"`);
        else assert.ok(ok, `${tag}: step ${i + 1} "${step}" should equal "${previous}"`);
        previous = step;
      });

      // Repairs: exactly one of the three equals what came before the flawed step.
      const before = item.bad === 0 ? item.start : item.steps[item.bad - 1];
      assert.equal(new Set(item.fixes).size, 3, `${tag}: three different repairs`);
      assert.ok(item.fixes.includes(item.fix), `${tag}: the right repair is offered`);
      assert.ok(
        !item.fixes.includes(item.steps[item.bad]),
        `${tag}: the flawed step is not offered as a repair`,
      );
      const good = item.fixes.filter((text) => equivalent(before, text));
      assert.deepEqual(
        good,
        [item.fix],
        `${tag}: only the stated repair equals "${before}" (found ${good.join(" | ")})`,
      );
      assert.ok(
        mechanismHolds(item),
        `${tag}: "${item.steps[item.bad]}" does not look like the slip "${item.slip}" of "${item.fix}"`,
      );

      // Slips: three distinct named causes, one true.
      assert.equal(new Set(item.slips).size, 3, `${tag}: three different slips`);
      assert.ok(item.slips.includes(item.slip), `${tag}: the true slip is offered`);
      for (const id of item.slips) assert.ok(SLIP_IDS.includes(id), `${tag}: unknown slip ${id}`);

      // The problem and the right result, recomputed without the generator.
      const [startRel, answerRel] = [parse(item.start), parse(item.answer)];
      if (item.meta) {
        const expected = expectedFromMeta(item.meta);
        assert.ok(
          polyEq(startRel.left, expected),
          `${tag}: start "${item.start}" does not match its problem ${JSON.stringify(item.meta)}`,
        );
      }
      if (startRel.rel) {
        const sol = solution(startRel);
        assert.ok(
          answerRel.rel ? solution(answerRel) === sol : sol === `= ${answerRel.left.b.str()}`,
          `${tag}: answer "${item.answer}" is not the solution of ${item.start} (${sol})`,
        );
      } else {
        assert.ok(
          polyEq(startRel.left, answerRel.left),
          `${tag}: answer "${item.answer}" does not equal ${item.start}`,
        );
        if (item.answerAlt)
          assert.ok(polyEq(startRel.left, parse(item.answerAlt).left), `${tag}: answerAlt`);
      }
      // The slip carries to the end: the student's last line is not the right result.
      const lastRight = startRel.rel
        ? solution(parse(item.steps.at(-1))) === solution(startRel)
        : polyEq(value(item.steps.at(-1)), startRel.left);
      assert.ok(!lastRight, `${tag}: the last line should be wrong`);
      assert.ok(
        !leaks(item, describeAsk(item) + item.start),
        `${tag}: a step shows the right result "${item.answer}": ${item.steps.join(" | ")}`,
      );
      assert.ok(
        describeAsk(item).length > 3 && !/\{\w+\}|undefined|NaN/.test(describeAsk(item)),
        `${tag}: the problem reads cleanly`,
      );
    } catch (error) {
      const key = `${item.template}: ${String(error.message).replace(/\d+/g, "#").slice(0, 70)}`;
      if (!problems.has(key)) problems.set(key, `${tag}: ${error.message}`);
    }
  }
  assert.ok(
    starts.size >= 6,
    `${skill.grade}:${skill.id}: only ${starts.size} different problems in ${SEEDS} seeds`,
  );
}
assert.deepEqual(
  [...problems.values()],
  [],
  `${problems.size} kinds of problem in the worked solutions`,
);
assert.deepEqual([...families].sort(), [...FAMILIES].sort(), "every skill family is covered");
assert.deepEqual(
  Object.keys(TEMPLATES).filter((id) => !templatesSeen.has(id)),
  [],
  "every template is used by some skill",
);
assert.ok(earlyFlaw / items >= 0.7, `most flaws come after a correct step (${earlyFlaw}/${items})`);
for (const id of SLIP_IDS) {
  const info = slipInfo(id);
  assert.ok(info.label && info.note, `${id}: label and note`);
  assert.ok(
    !/\{/.test(info.note),
    `${id}: the note is fixed text, never filled with a problem's numbers`,
  );
}
assert.ok(
  new Set(ALL_SKILLS.map((s) => skillFamily(s))).size === FAMILIES.length,
  "skills spread over all seven families",
);

// ---------- rounds for the Game Room ----------
for (let grade = 1; grade <= 8; grade += 1) {
  const rounds = workRounds(grade, "all", 5, seededRandom(grade));
  assert.equal(rounds.length, 5, `grade ${grade}: five rounds`);
  assert.ok(
    rounds.every((r) => r.skill.startsWith(`${grade}:`)),
    `grade ${grade}: the grade's own skills`,
  );
  const available = new Set(getGrade(grade).skills.map(skillFamily)).size;
  assert.ok(
    new Set(rounds.map((r) => r.family)).size >= Math.min(3, available),
    `grade ${grade}: rounds spread over the families the grade has`,
  );
}
const fractionRounds = workRounds(5, "skill:fraction-add", 4, seededRandom(3));
assert.ok(
  fractionRounds.every((r) => r.skill === "5:fraction-add" && r.family === "fractions"),
  "a chosen skill stays on that skill",
);

// ---------- the screen: nothing is shown before the error is found ----------
const realSetTimeout = globalThis.setTimeout;
globalThis.setTimeout = (fn, ms, ...rest) => realSetTimeout(fn, Math.min(ms ?? 0, 3), ...rest);
const wait = (ms = 12) => new Promise((resolve) => realSetTimeout(resolve, ms));
const dom = new JSDOM("<!doctype html><body><div id='host'></div></body>", {
  pretendToBeVisual: true,
});
for (const [key, val] of Object.entries({
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
}))
  Object.defineProperty(globalThis, key, { value: val, configurable: true, writable: true });
const { playMistake } = await import(`${lab}mistake-game.js`);
const host = dom.window.document.getElementById("host");
const $ = (selector) => host.querySelector(selector);
const $$ = (selector) => [...host.querySelectorAll(selector)];
const seedStream = () => seededRandom(20261022);
const realRandom = Math.random;
for (const [grade, stop] of [
  [5, "skill:fraction-add"],
  [7, "skill:equations"],
  [6, "skill:percent"],
]) {
  Math.random = seedStream();
  const expected = workRounds(grade, stop, 5, seedStream());
  let result = null;
  const stop2 = playMistake(host, {
    grade,
    stop,
    calm: false,
    finish: (r) => {
      result = r;
    },
    onFact: () => assert.fail("work rounds are not trail facts"),
  });
  Math.random = realRandom;
  for (const [index, item] of expected.entries()) {
    const label = `${stop} round ${index + 1}`;
    assert.equal($$(".gm-step").length, item.steps.length, `${label}: every step is a button`);
    assert.ok(
      /student solved this/.test($(".gm-ask").textContent),
      `${label}: the prompt says a student solved it`,
    );
    assert.ok(!/Sam|Maya|Harper/.test(host.textContent), `${label}: no names`);
    const everything = () => host.innerHTML;
    for (const text of item.fixes.filter((f) => !item.steps.includes(f) && f !== item.start))
      assert.ok(
        !new RegExp(`(?<![\\d.])${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d])`).test(
          everything(),
        ),
        `${label}: repair "${text}" is shown before the error is found`,
      );
    for (const id of item.slips)
      assert.ok(
        !host.textContent.includes(slipInfo(id).label),
        `${label}: slips are not listed before the error is found`,
      );
    assert.ok(!$("[data-slip]") && !$("[data-fix]"), `${label}: no cause or repair buttons yet`);
    // a wrong step first
    const wrongIndex = item.steps.findIndex((_, i) => i !== item.bad);
    $(`[data-pick="${wrongIndex}"]`).click();
    assert.ok(
      $(".gm-note").textContent.length > 5 && !$("[data-slip]"),
      `${label}: a wrong step gives a note and no hint of the answer`,
    );
    $(`[data-pick="${item.bad}"]`).click();
    assert.equal($$("[data-slip]").length, 3, `${label}: three named slips`);
    assert.ok(
      $$(".gm-step").every((b) => b.disabled),
      `${label}: steps lock once the error is found`,
    );
    const wrongSlip = item.slips.find((id) => id !== item.slip);
    $(`[data-slip="${wrongSlip}"]`).click();
    assert.ok(!$("[data-fix]"), `${label}: a wrong cause does not open the repairs`);
    $(`[data-slip="${item.slip}"]`).click();
    assert.equal(
      $(".gm-note").textContent,
      slipInfo(item.slip).note,
      `${label}: the named slip gets its kind note`,
    );
    assert.equal($$("[data-fix]").length, 3, `${label}: three repairs`);
    const wrongFix = item.fixes.findIndex((f) => f !== item.fix);
    $(`[data-fix="${wrongFix}"]`).click();
    $(`[data-fix="${item.fixes.indexOf(item.fix)}"]`).click();
    await wait(25);
  }
  await wait(40);
  assert.ok(result, `${stop}: the game finishes`);
  assert.equal(result.game, "mistake");
  assert.deepEqual(result.missed, [], `${stop}: no trail facts are marked missed`);
  assert.ok(result.stars >= 1 && result.stars <= 3, `${stop}: stars`);
  stop2();
}
Math.random = realRandom;

console.log(
  `fluency-mistakes: ${items} worked solutions over ${ALL_SKILLS.length} skills x ${SEEDS} seeds, ${templatesSeen.size} templates, ${families.size} families; all steps, flaws, repairs and results re-derived exactly; the screen holds the answer back`,
);
