// Exact-value tests for the decimals motion figures (receipt, decimal columns, shipments long division).
// Expected numbers are written by hand or reached by a different route (integer cross-multiplication), and every headline is
// compared with the lab's own evaluate() over the whole control range.
import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import decimals from "../shared/motion/figures/decimals.mjs";
import { digitsOf } from "../shared/motion/figures/decimals-columns.mjs";
import columnsFigure, { columnsModel } from "../shared/motion/figures/decimals-columns-figure.mjs";
import divisionFigure, { divisionModel } from "../shared/motion/figures/decimals-division.mjs";
import receiptFigure, { receiptModel } from "../shared/motion/figures/decimals-receipt.mjs";
import { figureSvg } from "../shared/motion/figures/mount.mjs";

/** @param {string} kind @param {string} mode @param {number[]} values */
const lab = (kind, mode, values) => evaluate({ kind, mode, values }, values);

test("the decimals module registers the three figures and their keys", () => {
  assert.deepEqual(decimals.flatMap((f) => f.keys).sort(), [
    "decimal:columns",
    "decimal:receipt",
    "division:shipments",
  ]);
});

// ---- receipt -------------------------------------------------------------------------------------------------------

test("receipt $2.75 x 6: partial products $12.00 and $4.50, total $16.50, change $33.50", () => {
  const m = receiptModel([2.75, 6]);
  assert.equal(m.w, 2);
  assert.equal(m.c, 75);
  assert.equal(m.p1, 1200);
  assert.equal(m.p2, 450);
  assert.equal(m.total, 1650);
  assert.equal(m.equation, "$2.75 × 6 = $16.50");
  assert.equal(m.changeC, 3350);
  assert.equal(m.over, false);
  assert.equal(m.noPoint?.text, "275 × 6 = 1,650");
  assert.deepEqual(
    m.addWork?.marks.every((x) => x === null),
    true,
    "12.00 + 4.50 needs no regrouping",
  );
  // 50.00 - 16.50: tenths borrow across the zero in the ones place
  assert.deepEqual(m.subWork.marks, [4, 9, 10, null]);
  assert.deepEqual(m.subWork.out, [3, 3, 5, 0]);
  assert.equal(m.mistake?.sum, "1.2 + 4.5 = 5.7");
});

test("receipt $9.75 x 8: the partial products carry into the tens, and the total is over $50", () => {
  const m = receiptModel([9.75, 8]);
  assert.equal(m.p1, 7200);
  assert.equal(m.p2, 600);
  assert.equal(m.total, 7800);
  assert.equal(m.over, true);
  assert.equal(m.changeC, 2800);
  assert.deepEqual(m.addWork?.out, [7, 8, 0, 0]);
});

test("receipt with a carry: $6.50 x 7 = 42.00 + 3.50", () => {
  const m = receiptModel([6.5, 7]);
  assert.equal(m.p1, 4200);
  assert.equal(m.p2, 350);
  assert.equal(m.total, 4550);
  assert.equal(
    m.mistake?.sum,
    "4.2 + 3.5 = 7.7",
    "both written with one place: 42 vs 3.5 -> 42 has 0 places, slides to 4.2",
  );
});

test("receipt: a whole price or a price under $1 has one partial product and no misalignment cue", () => {
  const whole = receiptModel([5, 4]);
  assert.equal(whole.both, false);
  assert.equal(whole.addWork, null);
  assert.equal(whole.noPoint, null);
  assert.equal(whole.total, 2000);
  const cents = receiptModel([0.5, 3]);
  assert.equal(cents.both, false);
  assert.equal(cents.p1, 0);
  assert.equal(cents.total, 150);
  assert.equal(cents.mistake, null);
});

test("receipt: the same places written both ways is not a misalignment", () => {
  // 1.50 x 4 -> $4.00 + $2.00: 4 and 2 both whole
  const m = receiptModel([1.5, 4]);
  assert.equal(m.p1, 400);
  assert.equal(m.p2, 200);
  assert.equal(m.mistake, null);
});

test("receipt headline, equation and change agree with the lab at every setting", () => {
  let n = 0;
  for (let q = 1; q <= 40; q++) {
    for (let items = 1; items <= 12; items++) {
      const price = q * 0.25;
      const m = receiptModel([price, items]);
      const r = lab("decimal", "receipt", [price, items]);
      assert.equal(m.equation, r.equation, `${price} x ${items}`);
      assert.equal(m.value.toFixed(2), r.value.toFixed(2));
      assert.ok(Math.abs(m.value - r.value) < 1e-9);
      assert.ok(r.note.includes(`$${(50 - r.value).toFixed(2)}`));
      // independent route: dollars and cents summed as integers
      assert.equal(m.p1 + m.p2, Math.round(price * items * 100));
      assert.equal(m.subWork.out.join("").replace(/^0+(?=\d)/, ""), String(m.changeC));
      if (m.addWork) assert.equal(m.addWork.out.join("").replace(/^0+(?=\d)/, ""), String(m.total));
      n++;
    }
  }
  assert.equal(n, 480);
});

test("receipt refuses what the lab refuses", () => {
  assert.throws(() => receiptModel([2.8, 6]), RangeError);
  assert.throws(() => receiptModel([0, 6]), RangeError);
  assert.throws(() => receiptModel([2.75, 0]), RangeError);
  assert.throws(() => receiptModel([2.75, 13]), RangeError);
  assert.throws(() => receiptModel([2.75, 2.5]), RangeError);
});

// ---- decimal columns -----------------------------------------------------------------------------------------------

test("columns 46.8 + 3.75: annexed zero, one carry, 50.55", () => {
  const m = columnsModel([46.8, 3.75, 1]);
  assert.equal(m.equation, "46.80 + 3.75 = 50.55");
  assert.equal(m.dp, 2);
  assert.equal(m.topPlaces, 1);
  assert.equal(m.botPlaces, 2);
  assert.deepEqual(m.work.out, [5, 0, 5, 5]); // tens, ones, tenths, hundredths
  assert.equal(m.work.regroups, 2, "tenths carry into the ones, and the ones carry into the tens");
  assert.equal(m.work.notes[0].sum, 15, "8 tenths + 7 tenths = 15 tenths");
  assert.equal(m.checkText, "50.55 − 3.75 = 46.80");
  assert.equal(m.mistake?.sum, "4.68 + 3.75 = 8.43");
});

test("columns 46.8 - 3.75: the hundredths regroup from the tenths, result 43.05", () => {
  const m = columnsModel([46.8, 3.75, 2]);
  assert.equal(m.equation, "46.80 − 3.75 = 43.05");
  assert.equal(m.work.regroups, 2);
  assert.deepEqual(
    m.work.notes.map((n) => [n.j, n.mark, n.b, n.out]),
    [
      [m.work.out.length - 1, 10, 5, 5],
      [m.work.out.length - 2, 7, 7, 0],
    ],
  );
  assert.equal(m.checkText, "43.05 + 3.75 = 46.80");
  assert.equal(m.mistake?.sum, "4.68 − 3.75 = 0.93");
});

test("columns: both numbers with the same places show no mistake cue", () => {
  const m = columnsModel([46.85, 3.75, 1]);
  assert.equal(m.mistake, null);
  assert.equal(m.equation, "46.85 + 3.75 = 50.60");
  const whole = columnsModel([46, 3.5, 2]);
  assert.equal(whole.dp, 1);
  assert.equal(whole.mistake?.sum, "4.6 − 3.5 = 1.1");
});

test("columns 200 + 9.95 uses a hundreds column", () => {
  const m = columnsModel([200, 9.95, 1]);
  assert.equal(m.nInt, 3);
  assert.equal(m.equation, "200.00 + 9.95 = 209.95");
  assert.deepEqual(digitsOf(20995, 3), [2, 0, 9, 9, 5]);
});

test("columns headline and equation agree with the lab at every setting", () => {
  let n = 0;
  for (let a = 1000; a <= 20000; a += 35) {
    for (let b = 5; b <= 995; b += 45) {
      for (const op of [1, 2]) {
        const values = [a / 100, b / 100, op];
        const m = columnsModel(values);
        const r = lab("decimal", "columns", values);
        assert.equal(m.equation, r.equation, JSON.stringify(values));
        assert.ok(Math.abs(m.value - r.value) < 1e-9);
        assert.equal(m.work.out.join("").replace(/^0+(?=\d)/, ""), String(m.cr));
        n++;
      }
    }
  }
  assert.ok(n > 5000);
});

test("columns refuse what the lab refuses", () => {
  assert.throws(() => columnsModel([9.95, 3, 1]), RangeError);
  assert.throws(() => columnsModel([46.8, 10, 1]), RangeError);
  assert.throws(() => columnsModel([46.8, 3.75, 3]), RangeError);
  assert.throws(() => columnsModel([46.801, 3.75, 1]), RangeError);
});

// ---- shipments -----------------------------------------------------------------------------------------------------

/** The quotient digits the layout shows, as text: integer part, then a point and the decimals. @param {ReturnType<typeof divisionModel>["ld"]} ld */
function shownQuotient(ld) {
  const int =
    ld.steps
      .filter((s) => s.col <= ld.lastInt)
      .map((s) => s.q)
      .join("") || "0";
  const dec = ld.steps
    .filter((s) => s.col > ld.lastInt)
    .map((s) => s.q)
    .join("");
  return dec ? `${int}.${dec}` : int;
}

test("shipments 144 / 12: no slide, two steps, quotient 12", () => {
  const m = divisionModel([144, 12]);
  assert.equal(m.ld.p, 0);
  assert.equal(m.ld.D, 12n);
  assert.deepEqual(
    m.ld.steps.map((s) => [s.col, s.cur, s.q, s.prod, s.rem]),
    [
      [1, 14n, 1n, 12n, 2n],
      [2, 24n, 2n, 24n, 0n],
    ],
  );
  assert.equal(m.quotientText, "12");
  assert.equal(m.ld.terminates, true);
  assert.equal(shownQuotient(m.ld), "12");
  assert.deepEqual(m.ld.whole, { q: 12n, r: 0n });
});

test("shipments 14.4 / 1.2: slide both by 10 to 144 / 12", () => {
  const m = divisionModel([14.4, 1.2]);
  assert.equal(m.ld.p, 1);
  assert.equal(m.ld.A, 144n);
  assert.equal(m.ld.D, 12n);
  assert.equal(m.quotientText, "12");
  assert.equal(m.wrongText, "1.2", "sliding only the divisor gives 14.4 / 12 = 1.2");
});

test("shipments 7.2 / 4.2: does not terminate; rounded to 1.7143 after four decimal places", () => {
  const m = divisionModel([7.2, 4.2]);
  assert.equal(m.ld.D, 42n);
  assert.equal(m.ld.terminates, false);
  assert.equal(m.ld.finalRemainder, 36n);
  assert.equal(shownQuotient(m.ld), "1.7142");
  assert.equal(m.quotientText, "1.7143");
  assert.equal(m.checkProduct, "7.20006");
  assert.equal(m.wrongText, "≈ 0.1714");
});

test("shipments 1.2 / 1.8: quotient below one, annexed zeros, leading zero", () => {
  const m = divisionModel([1.2, 1.8]);
  assert.equal(m.ld.lead, m.ld.lastInt + 1);
  assert.equal(m.ld.annexed, 4);
  assert.equal(shownQuotient(m.ld), "0.6666");
  assert.equal(m.quotientText, "0.6667");
});

test("shipments 1.2 / 12.6: zeros after the point before the first quotient digit are shown", () => {
  const m = divisionModel([1.2, 12.6]);
  assert.equal(shownQuotient(m.ld), "0.0952");
  assert.equal(m.ld.steps[0].q, 0n);
  assert.equal(m.quotientText, "0.0952");
});

test("shipments with a decimal dividend and whole divisor: no slide, point goes straight up", () => {
  const m = divisionModel([14.4, 3]);
  assert.equal(m.ld.p, 0);
  assert.equal(m.ld.f, 1);
  assert.equal(m.ld.D, 3n);
  assert.equal(shownQuotient(m.ld), "4.8");
  assert.equal(m.wrongText, null);
});

test("shipments whole numbers with a remainder: 6 / 9 reads 0 remainder 6, then goes on", () => {
  const m = divisionModel([6, 9]);
  assert.deepEqual(m.ld.whole, { q: 0n, r: 6n });
  assert.equal(m.quotientText, "0.6667");
});

test("shipments: a zero in the quotient brings the next digit down without a product row", () => {
  // 180 / 0.6 slides to 1,800 / 6 = 300
  const m = divisionModel([180, 0.6]);
  assert.equal(m.ld.A, 1800n);
  assert.equal(m.ld.D, 6n);
  assert.equal(shownQuotient(m.ld), "300");
  assert.deepEqual(
    m.ld.steps.map((s) => s.q),
    [3n, 0n, 0n],
  );
  assert.equal(m.quotientText, "300");
});

test("shipments: shown digits and headline agree with the lab at every setting", () => {
  let n = 0;
  for (let k = 1; k <= 150; k++) {
    for (let j = 1; j <= 30; j++) {
      const values = [Math.round(k * 12) / 10, Math.round(j * 6) / 10];
      const m = divisionModel(values);
      const r = lab("division", "shipments", values);
      assert.equal(
        `${m.aText} ÷ ${m.bText} = ${m.quotientText}`,
        r.equation,
        JSON.stringify(values),
      );
      assert.ok(Math.abs(m.value - r.value) < 1e-9);
      // independent route: the shown decimals are the truncated quotient, by integer cross-multiplication
      const A = BigInt(k * 12);
      const B = BigInt(j * 6);
      const decimals = m.ld.total - m.ld.typed + m.ld.f;
      const scaledQ = (A * 10n ** BigInt(decimals)) / B;
      const s = String(scaledQ).padStart(decimals + 1, "0");
      const expected = decimals ? `${s.slice(0, -decimals)}.${s.slice(-decimals)}` : s;
      assert.equal(shownQuotient(m.ld), expected, JSON.stringify(values));
      assert.equal(m.ld.terminates, (A * 10n ** BigInt(decimals)) % B === 0n);
      assert.ok(decimals <= 4, "never more than four decimal places");
      n++;
    }
  }
  assert.equal(n, 4500);
});

test("shipments refuses what the lab refuses", () => {
  assert.throws(() => divisionModel([14.7, 0.6]), RangeError);
  assert.throws(() => divisionModel([14.4, 0.5]), RangeError);
  assert.throws(() => divisionModel([0, 0.6]), RangeError);
  assert.throws(() => divisionModel([181.2, 0.6]), RangeError);
});

// ---- all three: the figures' text and static pictures -----------------------------------------------------------------

test("each figure's description and picture mention the headline number in both languages", () => {
  const cases = [
    [receiptFigure, "decimal:receipt", [2.75, 6], "16.50"],
    [columnsFigure, "decimal:columns", [46.8, 3.75, 1], "50.55"],
    [divisionFigure, "division:shipments", [14.4, 1.2], "12"],
  ];
  for (const [fig, key, values, headline] of cases) {
    for (const lang of ["en", "es"]) {
      const r = figureSvg(fig, key, values, { lang, width: 400 });
      assert.ok(r.svg.includes(headline), `${key} ${lang}: picture shows ${headline}`);
      assert.ok(
        fig.describe(r.model, lang).includes(headline),
        `${key} ${lang}: description has ${headline}`,
      );
    }
    assert.notEqual(
      fig.describe(fig.build(key, values), "en"),
      fig.describe(fig.build(key, values), "es"),
    );
  }
});
