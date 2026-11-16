// Family Mission "decimal" model: add/subtract chains and multiplying decimals. Expected values are
// worked out by hand here (and by plain integer arithmetic in the sweeps), independently of the code.
import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { JSDOM } from "jsdom";
import * as fam from "../assets/family-mission/models/decimal.mjs";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
globalThis.matchMedia = () => ({ matches: true });
const uncaught = [];
dom.window.addEventListener("error", (e) => uncaught.push(String(e.error?.stack ?? e.message)));
afterEach(() => assert.deepEqual(uncaught.splice(0), []));

const click = (node) =>
  node.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));
const nextBtn = (root) => root.querySelector(".fm-dec-move");
const tap = (root, n = 1) => {
  for (let i = 0; i < n; i += 1) click(nextBtn(root));
};
const mountIn = (cfg, opts) => {
  const root = document.createElement("div");
  document.body.append(root);
  const model = fam.create(cfg);
  return { root, model, view: fam.mount(root, model, opts) };
};
const clean = (s) => s.replaceAll("\u00a0", "").replaceAll("?", "").trim();
const rowText = (root, i) =>
  [...root.querySelectorAll(".fm-dec-chart tbody tr")[i].querySelectorAll("td")]
    .map((c) => clean(c.textContent))
    .join("");
const run = (m, n) => {
  for (let i = 0; i < n; i += 1) assert.equal(m.setState({ step: m.getState().step + 1 }), true);
};
const MINUS = "−";
const ADD3 = { mode: "addsub", terms: ["128.75", "+46.8", "-19.35"] };
const MUL = { mode: "multiply", a: "12.60", b: "4.5", trimTo: 2 };

test("128.75 + 46.8 − 19.35 = 156.20, worked column by column", () => {
  const m = fam.create(ADD3);
  const d = m.getState();
  // estimate, then op 1 (align, annex, 5 columns + the point) and op 2 (align, 5 columns + the point)
  assert.equal(d.moves.length, 1 + 8 + 7);
  assert.equal(d.expression, `128.75 + 46.8 ${MINUS} 19.35`);
  assert.equal(d.est.total, 157, "129 + 47 - 19");
  const [one, two] = d.ops;
  assert.equal(one.annex, true, "46.8 needs an annexed zero");
  assert.equal(two.annex, false);
  // Hand-worked columns for 128.75 + 46.80, right to left: [digit, carry out]
  assert.deepEqual(
    one.cols.map((c) => [c.digit, c.out]),
    [
      [5, 0],
      [5, 1],
      [5, 1],
      [7, 0],
      [1, 0],
    ],
  );
  assert.equal(one.result, "175.55");
  // 175.55 - 19.35: only the ones column regroups (5 < 9)
  assert.deepEqual(
    two.cols.map((c) => [c.digit, c.out]),
    [
      [0, 0],
      [2, 0],
      [6, 1],
      [5, 0],
      [1, 0],
    ],
  );
  assert.equal(two.result, "156.20");
  run(m, 16);
  assert.equal(m.getState().finished, true);
  assert.equal(m.getState().result, "156.20");
  assert.deepEqual(m.getState().trail, [`128.75 + 46.80 = 175.55`]);
  assert.match(m.getMathematicalExplanation("en"), /128\.75 \+ 46\.8 − 19\.35 = 156\.20\./);
  assert.match(m.getMathematicalExplanation("en"), /The estimate was about 157\. 156\.20 is close/);
  assert.match(m.getMathematicalExplanation("es"), /La estimación era de unos 157/);
});

test("2.75 + 2.75 round trip (lesson 1-3): 5.50, two terms, no annex", () => {
  const m = fam.create({ mode: "addsub", terms: ["2.75", "+2.75"] });
  const d = m.getState();
  assert.equal(d.moves.length, 1 + 1 + 4, "estimate, align, 3 columns, the point");
  assert.equal(d.est.total, 6);
  assert.deepEqual(
    d.ops[0].cols.map((c) => [c.digit, c.out]),
    [
      [0, 1],
      [5, 1],
      [5, 0],
    ],
  );
  run(m, 6);
  assert.equal(m.getState().result, "5.50");
});

test("342.6 − 128.75 + 56.4 = 270.25 (lesson 2-11 part 2): borrowing across the point", () => {
  const m = fam.create({ mode: "addsub", terms: ["342.6", "-128.75", "+56.4"] });
  const d = m.getState();
  assert.equal(d.est.total, 270, "343 - 129 + 56");
  assert.equal(d.ops[0].result, "213.85");
  // 342.60 - 128.75: hundredths, tenths and ones each regroup; tens and hundreds do not
  assert.deepEqual(
    d.ops[0].cols.map((c) => [c.digit, c.cin, c.out]),
    [
      [5, 0, 1],
      [8, 1, 1],
      [3, 1, 1],
      [1, 1, 0],
      [2, 0, 0],
    ],
  );
  assert.equal(d.ops[1].result, "270.25");
  run(m, d.moves.length);
  assert.equal(m.getState().result, "270.25");
});

test("a whole number is annexed with a point and zeros: 5 + 2.75 = 7.75", () => {
  const m = fam.create({ mode: "addsub", terms: ["5", "+2.75"] });
  const [op] = m.getState().ops;
  assert.equal(op.annex, true);
  assert.equal(op.P, 2);
  run(m, m.getState().moves.length);
  assert.equal(m.getState().result, "7.75");
});

test("sweep: every chain agrees with plain integer arithmetic, bad ones are refused", () => {
  const vals = [
    "0.5",
    "3.25",
    "46.8",
    "128.75",
    "19.35",
    "7",
    "100.125",
    "0.05",
    "999.9",
    "12",
    "2.5",
    "56.4",
  ];
  const thou = (s) => {
    const [i, f = ""] = s.split(".");
    return Number(i) * 1000 + Number(f.padEnd(3, "0"));
  };
  const places = (s) => (s.split(".")[1] || "").length;
  const intDigits = (n) => String(Math.floor(n / 1000)).length;
  let ran = 0;
  let refused = 0;
  for (const a of vals)
    for (const b of vals)
      for (const c of [null, ...vals]) {
        const terms = [a, `+${b}`, ...(c ? [`-${c}`] : [])];
        const s1 = thou(a) + thou(b);
        const s2 = c ? s1 - thou(c) : s1;
        const P1 = Math.max(places(a), places(b));
        const P2 = c ? Math.max(P1, places(c)) : P1;
        const tooWide = (P, ...xs) => P + Math.max(...xs.map(intDigits)) > 6;
        const bad =
          P1 < 1 ||
          tooWide(P1, thou(a), thou(b), s1) ||
          (c && (s2 < 0 || tooWide(P2, s1, thou(c), s2)));
        if (bad) {
          assert.throws(() => fam.create({ mode: "addsub", terms }), TypeError, terms.join(" "));
          refused += 1;
          continue;
        }
        const m = fam.create({ mode: "addsub", terms });
        run(m, m.getState().moves.length);
        const text = `${Math.floor(s2 / 1000)}.${String(s2 % 1000)
          .padStart(3, "0")
          .slice(0, P2)}`;
        assert.equal(m.getState().result, text, terms.join(" "));
        ran += 1;
      }
  assert.ok(ran > 300 && refused > 50, `ran ${ran}, refused ${refused}`);
});

test("12.60 × 4.5: ignore the points, 1260 × 45 = 56,700, three places, 56.70", () => {
  const m = fam.create(MUL);
  const d = m.getState();
  assert.deepEqual(
    d.moves.map((x) => x.k),
    ["mEstimate", "ignore", "multiply", "count", "place", "check"],
  );
  assert.equal(d.m.A, 1260);
  assert.equal(d.m.B, 45);
  assert.equal(d.m.prod, 56700);
  assert.deepEqual(
    d.m.partials.map((p) => [p.digit, p.factor, p.value]),
    [
      [5, 5, 6300],
      [4, 40, 50400],
    ],
  );
  assert.equal(d.m.total, 3, "2 places + 1 place");
  assert.equal(d.m.estimate, 65, "13 x 5");
  assert.equal(d.m.placed, "56.700");
  assert.equal(d.m.answer, "56.70");
  assert.deepEqual(
    d.m.cands.map((c) => c.text),
    ["5.67", "56.70", "567.00"],
  );
  assert.equal(d.m.nearest, 1, "56.70 is the one nearest 65");
  run(m, 4);
  assert.equal(
    m.setState({ step: 5 }),
    false,
    "the point is placed by choosing the number of places",
  );
  assert.equal(m.setState({ place: 2 }), false);
  assert.equal(m.setState({ place: 4 }), false);
  assert.equal(m.getState().step, 4, "wrong choices change nothing");
  assert.equal(m.setState({ place: 3 }), true);
  run(m, 1);
  assert.equal(m.getState().finished, true);
  assert.match(
    m.getMathematicalExplanation("en"),
    /12\.60 × 4\.5 = 56\.70\. The estimate was about 65\./,
  );
  assert.match(m.getMathematicalExplanation("es"), /La estimación era de unos 65/);
});

test("3.40 × 2.5 = 8.50 (lesson 2-12 part 2) and the untrimmed form", () => {
  const m = fam.create({ mode: "multiply", a: "3.40", b: "2.5", trimTo: 2 });
  const d = m.getState().m;
  assert.equal(d.prod, 8500);
  assert.deepEqual(
    d.partials.map((p) => p.value),
    [1700, 6800],
  );
  assert.equal(d.estimate, 9, "3 x 3: 2.5 rounds up");
  assert.deepEqual(
    d.cands.map((c) => c.text),
    ["0.85", "8.50", "85.00"],
  );
  assert.equal(
    fam.create({ mode: "multiply", a: "12.60", b: "4.5" }).getState().m.answer,
    "56.700",
    "no trimTo keeps every place",
  );
  const small = fam.create({ mode: "multiply", a: "3.2", b: "1.5" }).getState().m;
  assert.equal(small.prod, 480);
  assert.equal(small.answer, "4.80");
  assert.equal(small.digits, "480");
});

test("sweep: every product matches integer arithmetic and the estimate picks the right place", () => {
  const tenth = (n) => (n / 10).toFixed(1);
  let count = 0;
  for (let x = 10; x <= 129; x += 1) {
    for (let y = 10; y <= 129; y += 1) {
      const m = fam.create({ mode: "multiply", a: tenth(x), b: tenth(y) }).getState().m;
      const p = x * y; // hundredths
      assert.equal(
        m.placed,
        `${Math.floor(p / 100)}.${String(p % 100).padStart(2, "0")}`,
        `${x} x ${y}`,
      );
      assert.equal(
        m.nearest,
        1,
        `${tenth(x)} x ${tenth(y)}: the estimate ${m.estimate} must point at ${m.placed}`,
      );
      count += 1;
    }
  }
  assert.ok(count > 10000);
  const hundredths = fam.create({ mode: "multiply", a: "1.25", b: "3.125" }).getState().m;
  assert.equal(hundredths.prod, 125 * 3125);
  assert.equal(hundredths.total, 5);
  assert.equal(hundredths.placed, "3.90625");
});

test("bad config is refused with TypeError", () => {
  const bad = [
    undefined,
    {},
    { mode: "divide", a: "1.5", b: "2.5" },
    { mode: "addsub" },
    { mode: "addsub", terms: ["1.5"] },
    { mode: "addsub", terms: ["1.5", "+2", "+3", "+4"] },
    { mode: "addsub", terms: ["-1.5", "+2.5"] },
    { mode: "addsub", terms: ["1.5", "2.5"] },
    { mode: "addsub", terms: ["1.5", "+x"] },
    { mode: "addsub", terms: ["1.5", "+1.2.3"] },
    { mode: "addsub", terms: ["1.5", "+1.2345"] },
    { mode: "addsub", terms: ["1.5", "+12345.5"] },
    { mode: "addsub", terms: [1.5, "+2.5"] },
    { mode: "addsub", terms: ["1.5", "-2.5"] },
    { mode: "addsub", terms: ["9999.999", "+1"] },
    { mode: "addsub", terms: ["5", "+3"] },
    { mode: "addsub", terms: ["1.5", "+2.5"], presets: [{ terms: ["1.5", "-9.5"] }] },
    { mode: "addsub", terms: ["1.5", "+2.5"], presets: Array(5).fill({ terms: ["1.5", "+2.5"] }) },
    { mode: "multiply", a: "0.5", b: "2.5" },
    { mode: "multiply", a: "12", b: "4" },
    { mode: "multiply", a: "12.60" },
    { mode: "multiply", a: 12.6, b: "4.5" },
    { mode: "multiply", a: "12.60", b: "4.5", trimTo: 0 },
    { mode: "multiply", a: "12.60", b: "4.5", trimTo: "2" },
    { mode: "multiply", a: "12.60", b: "4.5", presets: [{ a: "1", b: "x" }] },
  ];
  for (const cfg of bad) assert.throws(() => fam.create(cfg), TypeError, JSON.stringify(cfg));
});

test("moves go in order; looking at a column is not an undoable move", () => {
  const m = fam.create(ADD3);
  assert.equal(m.setState({ step: 2 }), false, "cannot skip the estimate");
  assert.equal(m.setState({ step: 0 }), false);
  assert.equal(m.setState({ nope: 1 }), false);
  assert.equal(m.setState({ step: 1, look: 0 }), false, "one change at a time");
  assert.equal(m.setState({ place: 3 }), false, "only multiply places a point by choosing");
  assert.equal(m.setState({ look: 9 }), false);
  assert.equal(m.setState({ look: -1 }), true);
  assert.equal(m.getState().look, -1);
  assert.equal(m.canUndo(), false, "looking is not a move");
  run(m, 3);
  assert.equal(m.undo(), true);
  assert.equal(m.getState().step, 2);
  assert.equal(m.getState().look, -1);
  m.reset();
  assert.equal(m.getState().step, 0);
  const mul = fam.create(MUL);
  assert.equal(mul.setState({ look: 1 }), false, "multiply has no chart columns");
});

test("a new problem starts over, and presets must match the mode", () => {
  const presets = [{ terms: ["128.75", "+46.8", "-19.35"] }, { terms: ["2.75", "+2.75"] }];
  const m = fam.create({ ...ADD3, presets });
  run(m, 5);
  assert.equal(m.setState(presets[1]), true);
  assert.equal(m.getState().step, 0);
  assert.equal(m.getState().expression, "2.75 + 2.75");
  assert.equal(m.setState({ a: "1.5", b: "2.5" }), false, "wrong fields for add/subtract");
  assert.equal(m.setState({ terms: ["1.5", "-2.5"] }), false, "negative result");
  m.reset();
  assert.equal(m.getState().expression, `128.75 + 46.8 ${MINUS} 19.35`);
  assert.deepEqual(m.describeConfig().terms, ADD3.terms);
  assert.equal(
    fam.create(m.describeConfig()).getState().expression,
    m.getState().expression,
    "describeConfig is a valid config",
  );
});

test("serialize and restore round-trip, tampered state is refused", () => {
  const m = fam.create(ADD3);
  run(m, 5);
  const json = m.serialize();
  const m2 = fam.create(ADD3);
  assert.equal(m2.restore(json), true);
  assert.equal(m2.getState().step, 5);
  assert.equal(m2.restore(json.replace('"step":5', '"step":99')), false);
  assert.equal(m2.restore(json.replace('"-19.35"', '"-9.35"')), true, "still a valid chain");
  assert.equal(m2.restore(json.replace('"-19.35"', '"-1999.35"')), false, "negative result");
  assert.equal(m2.restore(json.replace('"look":null', '"look":42')), false);
  assert.equal(
    m2.restore(json.replace('"addsub"', '"multiply"')),
    false,
    "a mode with no matching fields",
  );
  const mul = fam.create(MUL);
  mul.setState({ step: 1 });
  assert.equal(fam.create(MUL).restore(mul.serialize()), true);
});

test("validate: the task answer is compared exactly", () => {
  const m = fam.create({ ...ADD3, task: { answer: "156.2" } });
  assert.equal(m.validate().reason, "not-finished");
  run(m, 16);
  assert.deepEqual(m.validate(), { ok: true, reason: "correct", misconception: null });
  assert.equal(m.validate({ answer: "156.3" }).ok, false);
  const p = fam.create({ ...MUL, task: { answer: "56.7" } });
  run(p, 4);
  p.setState({ place: 3 });
  run(p, 1);
  assert.equal(p.validate().ok, true);
  assert.equal(p.validate({ answer: "567" }).reason, "incorrect");
  assert.equal(fam.create(MUL).validate().reason, "no-task");
});

test("mounted add/subtract: line up, annex, regroup column by column, read the answer", () => {
  const { root, model, view } = mountIn({
    ...ADD3,
    presets: [{ terms: ADD3.terms }, { terms: ["2.75", "+2.75"] }],
  });
  assert.equal(
    root.querySelector(".fm-dec-expr").getAttribute("aria-label"),
    `128.75 + 46.8 ${MINUS} 19.35`,
  );
  assert.ok(root.querySelector(".fm-dec-raw"), "before lining up, the points do not line up");
  assert.equal(root.querySelector(".fm-dec-chart"), null);
  assert.match(nextBtn(root).textContent, /Round each number/);
  tap(root);
  assert.match(root.querySelector(".fm-dec-est").textContent, /129 \+ 47 − 19 = 157/);
  assert.match(nextBtn(root).textContent, /Line up the decimal points/);
  tap(root);
  assert.ok(root.querySelector(".fm-dec-chart"));
  assert.equal(root.querySelector(".fm-dec-raw"), null);
  assert.equal(
    root.querySelectorAll(".fm-dec-colhead button").length,
    5,
    "tens/ones/tenths/hundredths columns are buttons",
  );
  assert.equal(rowText(root, 1), "128.75");
  assert.equal(rowText(root, 2), "46.8", "46.8 has not been annexed yet");
  assert.match(nextBtn(root).textContent, /Annex zeros/);
  tap(root);
  assert.equal(rowText(root, 2), "46.80");
  assert.equal(root.querySelectorAll(".fm-dec-cell.is-annexed").length, 1);
  assert.match(nextBtn(root).textContent, /Add the hundredths/);
  assert.match(root.querySelector(".fm-dec-hint").textContent, /Hundredths: 5 \+ 0\. Tap to add\./);
  assert.doesNotMatch(
    root.querySelector(".fm-dec-hint").textContent,
    /= 5/,
    "the hint never gives the digit away",
  );
  tap(root);
  assert.equal(rowText(root, 3), "5");
  tap(root); // tenths
  assert.match(
    root.querySelector(".fm-dec-last").textContent,
    /Tenths: 7 \+ 8 = 15\. Write 5 and carry 1 to the ones\./,
  );
  assert.ok(
    [...root.querySelectorAll(".fm-dec-mark")].some((c) => clean(c.textContent) === "1"),
    "the carry is shown",
  );
  assert.match(nextBtn(root).textContent, /Drop the decimal point/);
  tap(root);
  assert.equal(rowText(root, 3), ".55");
  tap(root, 3); // ones, tens, hundreds
  assert.match(root.querySelector(".fm-dec-last").textContent, /Hundreds: 1 \+ 0 = 1\. Write 1\./);
  // Next operation: 175.55 − 19.35
  assert.match(root.querySelector(".fm-dec-trail").textContent, /128\.75 \+ 46\.80 = 175\.55/);
  assert.equal(root.querySelector(".fm-dec-raw").textContent, `175.55${MINUS} 19.35`);
  tap(root, 4); // line up, hundredths, tenths, point
  tap(root); // ones
  assert.match(
    root.querySelector(".fm-dec-last").textContent,
    /Ones: 5 is less than 9\. Regroup 1 ten as 10 ones: 15 − 9 = 6\./,
  );
  assert.ok([...root.querySelectorAll(".fm-dec-mark")].some((c) => clean(c.textContent) === "+10"));
  assert.ok(
    [...root.querySelectorAll(".fm-dec-mark")].some((c) => clean(c.textContent) === `${MINUS}1`),
  );
  tap(root);
  assert.match(
    root.querySelector(".fm-dec-last").textContent,
    /Tens: 7 − 1 \(regrouped\) − 1 = 5\./,
  );
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
  tap(root);
  assert.equal(nextBtn(root), null, "all moves done");
  assert.equal(model.getState().finished, true);
  assert.equal(root.querySelector(".fm-dec-result").hidden, false);
  assert.equal(
    root.querySelector(".fm-dec-eq").textContent,
    `128.75 + 46.8 ${MINUS} 19.35 = 156.20`,
  );
  assert.equal(rowText(root, 3), "156.20");
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
  view.destroy();
});

test("mounted: tap a place-value column to read its name, tap again to close it", () => {
  const { root } = mountIn(ADD3);
  tap(root, 2);
  const col = (e) => root.querySelector(`[data-look="${e}"]`);
  assert.equal(col(-1).getAttribute("aria-pressed"), "false");
  assert.equal(col(-1).getAttribute("aria-label"), "Tenths");
  click(col(-1));
  assert.equal(col(-1).getAttribute("aria-pressed"), "true");
  assert.equal(
    root.querySelector(".fm-dec-look").textContent,
    "Tenths: one tenth is worth 0.1. Ten tenths make 1 one.",
  );
  assert.ok(root.querySelector(".fm-dec-cell.is-look"));
  click(col(2));
  assert.equal(
    root.querySelector(".fm-dec-look").textContent,
    "Hundreds: one hundred is worth 100. Ten hundreds make 1 thousand.",
  );
  click(col(2));
  assert.equal(root.querySelector(".fm-dec-look"), null);
  assert.equal(col(2).getAttribute("aria-pressed"), "false");
});

test("mounted multiply: every step, a wrong place is 'try another look', then the answer", () => {
  const presets = [
    { a: "12.60", b: "4.5" },
    { a: "3.40", b: "2.5" },
  ];
  const { root, model, view } = mountIn({ ...MUL, presets });
  assert.match(nextBtn(root).textContent, /Round each factor/);
  tap(root);
  assert.match(
    root.querySelector(".fm-dec-steps").textContent,
    /12\.60 is about 13, and 4\.5 is about 5\. 13 × 5 = 65/,
  );
  tap(root);
  assert.match(
    root.querySelector(".fm-dec-steps").textContent,
    /12\.60 becomes 1260, and 4\.5 becomes 45/,
  );
  tap(root);
  const steps = root.querySelector(".fm-dec-steps").textContent;
  assert.match(steps, /1260 × 45 = 56,700/);
  assert.match(steps, /1260 × 5 = 6,300/);
  assert.match(steps, /1260 × 40 = 50,400/);
  assert.match(steps, /Add: 6,300 \+ 50,400 = 56,700/);
  tap(root);
  assert.match(
    root.querySelector(".fm-dec-steps").textContent,
    /12\.60 has 2 decimal places\. 4\.5 has 1 decimal place\. 2 \+ 1 = 3\./,
  );
  const choices = [...root.querySelectorAll(".fm-dec-choice")];
  assert.deepEqual(
    choices.map((b) => b.textContent),
    ["1", "2", "3", "4"],
  );
  assert.equal(choices[2].getAttribute("aria-label"), "3 decimal places");
  assert.equal(choices[0].getAttribute("aria-label"), "1 decimal place");
  assert.equal(
    root.querySelector(".fm-dec-digits").getAttribute("aria-label"),
    "56700",
    "no point yet",
  );
  click(choices[1]);
  assert.equal(model.getState().step, 4, "a wrong choice moves nothing");
  assert.match(
    root.querySelector(".fm-msg").textContent,
    /Try another look\. With 2 decimal places the answer would read 567\.00\./,
  );
  click(root.querySelector('[data-place="3"]'));
  assert.equal(root.querySelector(".fm-msg").textContent, "");
  assert.equal(root.querySelector(".fm-dec-digits").getAttribute("aria-label"), "56.700");
  assert.match(
    root.querySelector(".fm-dec-steps").textContent,
    /Zeros at the end can be dropped: 56\.70\./,
  );
  assert.match(nextBtn(root).textContent, /Check with the estimate/);
  assert.equal(root.querySelector(".fm-dec-result").hidden, true);
  tap(root);
  const check = root.querySelector(".fm-dec-steps").textContent;
  assert.match(check, /5\.67\. That is much smaller than 65/);
  assert.match(check, /56\.70\. That is close to 65/);
  assert.match(check, /567\.00\. That is much bigger than 65/);
  assert.equal(root.querySelector(".fm-dec-eq").textContent, "12.60 × 4.5 = 56.70");
  assert.equal(nextBtn(root), null);
  assert.doesNotMatch(root.textContent, /\bnull\b|undefined|NaN/);
  click(root.querySelector('[data-pick="1"]'));
  assert.equal(root.querySelector(".fm-dec-expr").textContent, "3.40 × 2.5");
  assert.equal(model.getState().step, 0);
  assert.equal(root.querySelector(".fm-dec-card"), null);
  view.destroy();
  assert.equal(root.children.length, 0);
});

test("Spanish for every visible string, decimal points kept", () => {
  const { root, view } = mountIn(
    { ...ADD3, presets: [{ terms: ADD3.terms }, { terms: ["2.75", "+2.75"] }] },
    { lang: "es" },
  );
  assert.equal(root.getAttribute("lang"), "es");
  assert.match(nextBtn(root).textContent, /Redondear cada número/);
  assert.match(root.querySelector(".fm-dec-hint").textContent, /Primero estima/);
  assert.match(root.textContent, /Deshacer/);
  tap(root, 3); // estimate, line up, annex
  assert.match(
    root.querySelector(".fm-dec-last").textContent,
    /Ahora todos los números tienen 2 lugares decimales: 128\.75 y 46\.80\./,
  );
  assert.equal(root.querySelector('[data-look="-1"]').getAttribute("aria-label"), "Décimas");
  click(root.querySelector('[data-look="-2"]'));
  assert.equal(
    root.querySelector(".fm-dec-look").textContent,
    "Centésimas: una centésima vale 0.01. Diez centésimas forman 1 décima.",
  );
  tap(root, 2);
  assert.match(
    root.querySelector(".fm-dec-last").textContent,
    /Décimas: 7 \+ 8 = 15\. Escribe 5 y lleva 1 a las unidades\./,
  );
  view.setLang("en");
  assert.match(nextBtn(root).textContent, /Drop the decimal point/);
  view.setLang("es");
  tap(root, 4);
  assert.match(root.querySelector(".fm-dec-last").textContent, /Centenas: 1 \+ 0 = 1\./);
  tap(root, 5);
  assert.match(
    root.querySelector(".fm-dec-last").textContent,
    /Unidades: 5 es menos que 9\. Reagrupa 1 decena como 10 unidades: 15 − 9 = 6\./,
  );
  tap(root, 2);
  assert.match(root.querySelector(".fm-dec-eq").textContent, /= 156\.20$/);
  assert.match(root.querySelector(".fm-dec-result").textContent, /La estimación era de unos 157/);
  assert.match(root.querySelector("p.fm-sr").textContent, /Modelo de suma y resta de decimales/);
  const mul = mountIn(MUL, { lang: "es" });
  assert.match(nextBtn(mul.root).textContent, /Redondear cada factor/);
  tap(mul.root, 4);
  assert.match(
    mul.root.querySelector(".fm-cap").textContent,
    /¿Cuántos lugares desde la derecha\?/,
  );
  click(mul.root.querySelector('[data-place="1"]'));
  assert.match(
    mul.root.querySelector(".fm-msg").textContent,
    /Mira otra vez\. Con 1 lugar decimal la respuesta diría 5670\.0\./,
  );
  assert.match(
    mul.root.querySelector(".fm-dec-steps").textContent,
    /12\.60 tiene 2 lugares decimales\. 4\.5 tiene 1 lugar decimal\./,
  );
  click(mul.root.querySelector('[data-place="3"]'));
  tap(mul.root);
  assert.match(mul.root.querySelector(".fm-dec-result").textContent, /12\.60 × 4\.5 = 56\.70/);
  assert.doesNotMatch(`${root.textContent}${mul.root.textContent}`, /\bnull\b|undefined|NaN/);
  view.destroy();
});
test("accessible description and explanation follow the step, in both languages", () => {
  const m = fam.create(ADD3);
  assert.match(
    m.getAccessibleDescription("en"),
    /^Add and subtract decimals model\. The problem is 128\.75 \+ 46\.8 − 19\.35\. Estimate first\./,
  );
  run(m, 16);
  assert.match(m.getAccessibleDescription("en"), /All steps done\./);
  assert.match(m.getAccessibleDescription("en"), /So far: 128\.75 \+ 46\.80 = 175\.55\./);
  const mul = fam.create(MUL);
  assert.match(
    mul.getAccessibleDescription("es"),
    /^Modelo de multiplicación de decimales\. El problema es 12\.60 × 4\.5\./,
  );
  assert.match(mul.getMathematicalExplanation("en"), /Estimate first\. Round each factor/);
});

test("readonly: the same picture with no live controls", () => {
  const m = fam.create(ADD3);
  const root = document.createElement("div");
  document.body.append(root);
  fam.mount(root, m, { readonly: true });
  assert.equal(root.querySelectorAll("button").length, 0, "no buttons at the start");
  assert.equal(root.querySelector(".fm-actions"), null);
  run(m, 5);
  assert.ok(root.querySelector(".fm-dec-chart"), "the model still draws as it changes");
  assert.equal(root.querySelectorAll("button, input").length, 0, "no handles on the chart either");
  assert.equal(
    root.querySelectorAll(".fm-dec-colhead span").length,
    5,
    "column names stay as text",
  );
  const mulRoot = document.createElement("div");
  document.body.append(mulRoot);
  const mul = fam.create(MUL);
  fam.mount(mulRoot, mul, { readonly: true });
  run(mul, 4);
  assert.equal(mulRoot.querySelectorAll("button").length, 0, "no place picker");
  assert.equal(mulRoot.querySelectorAll(".fm-dec-card").length, 5);
});

test("no inline handlers, controls are real buttons, onChange fires on a tap", () => {
  const seen = [];
  const { root, view } = mountIn(ADD3, { onChange: (st) => seen.push(st.step) });
  tap(root, 2);
  assert.deepEqual(seen, [1, 2]);
  for (const el of root.querySelectorAll("*"))
    for (const a of el.attributes) assert.ok(!/^on/i.test(a.name), `${el.tagName} has ${a.name}`);
  for (const b of root.querySelectorAll("button")) assert.equal(b.getAttribute("type"), "button");
  assert.ok(root.querySelector(".fm-dec-colhead button").getAttribute("aria-pressed"));
  view.destroy();
});
