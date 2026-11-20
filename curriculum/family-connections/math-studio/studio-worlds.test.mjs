import assert from 'node:assert/strict';
import test from 'node:test';
import { outcome, worldForLesson, worlds } from './worlds.js';

// Independent oracle: exact rationals on BigInt, never the world's own result()/formula().
const gcd = (a, b) => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const frac = (n, d = 1n) => {
  const g = gcd(n, d) || 1n;
  const s = d < 0n ? -1n : 1n;
  return { n: (s * n) / g, d: (s * d) / g };
};
const mul = (a, b) => frac(a.n * b.n, a.d * b.d);
const add = (a, b) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const div = (a, b) => frac(a.n * b.d, a.d * b.n);
const F = (n, d = 1) => frac(BigInt(n), BigInt(d));
const minus = (s) => s.replace('-', '−');
const dec = (f) => {
  // exact decimal text of a fraction with a power-of-ten-friendly denominator
  let d = f.d;
  let k = 0;
  while (d % 10n === 0n) { d /= 10n; k++; }
  while (d % 2n === 0n) { d /= 2n; k++; }
  while (d % 5n === 0n) { d /= 5n; k++; }
  assert.equal(d, 1n, 'not a terminating decimal');
  return f;
};
const toStr = (f, places) => {
  dec(f);
  const scaled = (f.n * 10n ** BigInt(places)) / f.d;
  assert.equal(scaled * f.d, f.n * 10n ** BigInt(places), 'needs more places');
  const neg = scaled < 0n;
  const digits = (neg ? -scaled : scaled).toString().padStart(places + 1, '0');
  const body = places ? `${digits.slice(0, -places)}.${digits.slice(-places)}` : digits;
  return (neg ? '-' : '') + body;
};

// Per world: exact result for n, text the displayed value must have, text the formula must contain.
const oracle = {
  recipe: { r: (n) => mul(F(n), F(3)), val: (f) => toStr(f, 0) },
  market: { r: (n) => mul(F(n), F(4)), val: (f) => `$${toStr(f, 0)}` },
  garden: { r: (n) => mul(F(n), F(4)), val: (f) => toStr(f, 0) },
  sale: { r: (n) => mul(F(n), F(1, 4)), val: (f) => `$${Number(f.n) / Number(f.d)}` },
  game: { r: (n) => mul(F(n), F(6)), val: (f) => toStr(f, 0) },
  receipt: { r: (n) => mul(F(n), F(235, 100)), val: (f) => `$${toStr(f, 2)}` },
  trail: { r: (n) => div(F(n), F(1, 2)), val: (f) => toStr(f, 0) },
  cold: { r: (n) => add(F(n), F(-7)), val: (f) => minus(toStr(f, 0)) },
  savings: { r: (n) => add(mul(F(4), F(n)), F(3)), val: (f) => `$${toStr(f, 0)}` },
  bike: { r: (n) => mul(F(n), F(8)), val: (f) => toStr(f, 0) },
};
// The instance each world's mistake/fix talks about, and the correct value the fix must state.
const fixValue = { recipe: '12', market: '$20', garden: '20', sale: '$10', game: '24', receipt: '$9.40', trail: '8', cold: '−10', savings: '$23', bike: '24' };

const keys = ['en', 'es', 'icon', 'unit', 'min', 'max', 'initial', 'base', 'result', 'resultUnit', 'story', 'formula', 'reason', 'mistake', 'fix'];
const pairs = ['unit', 'resultUnit', 'story', 'reason', 'mistake', 'fix'];
const banned = /\b(timers?|scores?|scoring|scored|grades?|graded|points|ranks?|ranking|penalt\w+|wrong|incorrect|puntaje|calificaci\w+|temporizador|cron[oó]metro|penalizaci\w+|incorrecto|equivocad\w+)\b/i;
const englishInSpanish = /\b(the|and|each|how|many|cost|costs|learner|says|because|batch(?:es)?|bottles?|weeks?|hours?|miles)\b/i;

// Every "a op b = c" chain printed in a string must be true arithmetic.
function chainsOf(str) {
  const re = /(?<![\d/.])(?:[−$]?\d[\d.]*\s*[+×÷−=]\s*)+[−$]?\d[\d.]*(?![\d/.])/g;
  return str.match(re) ?? [];
}
const evalChain = (chain) => {
  const parts = chain.replace(/\$/g, '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').split('=');
  const vals = parts.map((p) => {
    assert.match(p, /^[\d.+\-*/\s]+$/);
    return Function(`return (${p})`)();
  });
  return vals.every((v) => Math.abs(v - vals[0]) < 1e-9);
};

test('worlds table covers the four originals and the six new units', () => {
  assert.deepEqual(Object.keys(worlds).sort(), Object.keys(oracle).sort());
});

for (const [id, w] of Object.entries(worlds)) {
  test(`world ${id}: shape, bilingual copy, banned words`, () => {
    for (const k of keys) assert.ok(k in w, `${id}.${k}`);
    assert.ok(w.min < w.max && w.initial >= w.min && w.initial <= w.max);
    const step = w.step || 1;
    assert.equal((w.initial - w.min) % step, 0, 'initial on the slider grid');
    for (const k of pairs) {
      assert.equal(w[k].length, 2, `${id}.${k} has en and es`);
      assert.ok(w[k][0].trim() && w[k][1].trim());
      assert.notEqual(w[k][0], w[k][1], `${id}.${k} es differs from en`);
    }
    assert.notEqual(w.en, w.es);
    const all = [w.en, w.es, ...pairs.flatMap((k) => w[k])];
    for (const str of all) assert.ok(!banned.test(str), `${id}: banned word in "${str}"`);
    for (const str of [w.es, ...pairs.map((k) => w[k][1])]) {
      assert.ok(!/\d\s+%/.test(str), `spaced percent: ${str}`);
      assert.ok(!/el entero/i.test(str), `el entero: ${str}`);
      assert.ok(!englishInSpanish.test(str), `English left in Spanish: ${str}`);
    }
    for (const lang of [0, 1]) assert.ok(w.story[lang].length > 10);
  });

  test(`world ${id}: every value ${w.min}..${w.max}: result and formula match exact arithmetic`, () => {
    const o = oracle[id];
    const step = w.step || 1;
    let seen = 0;
    for (let n = w.min; n <= w.max; n += step) {
      const exact = o.r(n);
      const got = w.result(n);
      assert.ok(Math.abs(got - Number(exact.n) / Number(exact.d)) < 1e-9, `${id} result(${n}) = ${got}`);
      const text = o.val(exact);
      const formula = w.formula(n);
      assert.ok(formula.endsWith(`= ${text}`) || formula.endsWith(`= ${text} m²`) || formula.endsWith(`= ${text} mi`), `${id} formula(${n}) "${formula}" ends with the value`);
      assert.ok(formula.includes(id === 'cold' ? minus(String(n)) : String(n)), `formula shows the input ${n}`);
      if (w.show) assert.equal(w.show(got), text,`${id} show(${n})`);
      seen++;
    }
    assert.ok(seen >= 5);
  });

  test(`world ${id}: mistake and fix state true arithmetic and the correct value`, () => {
    for (const lang of [0, 1]) {
      for (const str of [w.mistake[lang], w.fix[lang]]) {
        for (const chain of chainsOf(str)) assert.ok(evalChain(chain), `${id}: false arithmetic "${chain}" in "${str}"`);
      }
      assert.ok(w.fix[lang].includes(fixValue[id]), `${id} fix[${lang}] states ${fixValue[id]}`);
    }
  });
}

test('outcome() reports the real direction, including same', () => {
  for (const [id, w] of Object.entries(worlds)) {
    const step = w.step || 1;
    for (let a = w.min; a <= w.max; a += step) {
      for (let b = w.min; b <= w.max; b += step) {
        const ra = oracle[id].r(a);
        const rb = oracle[id].r(b);
        const cmp = rb.n * ra.d - ra.n * rb.d;
        assert.equal(outcome(w, a, b), cmp > 0n ? 'more' : cmp < 0n ? 'less' : 'same', `${id} ${a}->${b}`);
      }
    }
  }
});

test('receipt never shows float artefacts', () => {
  const w = worlds.receipt;
  for (let n = w.min; n <= w.max; n++) assert.match(w.show(w.result(n)), /^\$\d+\.\d{2}$/);
  assert.equal(worlds.receipt.formula(3), '3 × $2.35 = $7.05');
});

test('worldForLesson maps every unit, part ids, and falls back to recipe', () => {
  const sample = { '1-1': 'game', '2-11': 'receipt', '2-12-part2': 'receipt', '3-2-part3': 'recipe', '4-3': 'sale', '5-6': 'garden', '6-9-part2': 'trail', '6-15': 'trail', '7-4': 'cold', '8-4': 'savings', '8-4-part2': 'savings', '9-2': 'bike', '10-3': 'market' };
  for (const [id, world] of Object.entries(sample)) {
    assert.equal(worldForLesson(id), world, id);
    assert.ok(worlds[world]);
  }
  for (const bad of [undefined, null, '', 'abc', '11-1', '0-1', '08-4', '-4', 42, {}]) assert.equal(worldForLesson(bad), 'recipe', String(bad));
});
