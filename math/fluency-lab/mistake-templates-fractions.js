// Fraction, decimal and probability worked solutions with one flawed step.
import { int, gcd, round, near, fraction } from "./mistake-kit.js";

const lcm = (a, b) => (a / gcd(a, b)) * b;

function fracAdd(rng, { config }) {
  const maxD = Math.max(8, config.maxDenominator ?? 12);
  for (let tries = 0; tries < 500; tries += 1) {
    const [d1, d2] = [int(rng, 2, maxD), int(rng, 2, maxD)];
    const L = lcm(d1, d2);
    if (d1 === d2 || L === d1 || L === d2) continue;
    const [n1, n2] = [int(rng, 1, d1 - 1), int(rng, 1, d2 - 1)];
    const [m1, m2] = [L / d1, L / d2];
    const [N1, N2] = [n1 * m1, n2 * m2];
    const op = config.op === "add" || (config.op !== "sub" && rng() < 0.6) ? "+" : "−";
    if (op === "−" && N1 <= N2) continue;
    const sign = op === "+" ? 1 : -1;
    const top = N1 + sign * N2;
    const value = fraction(top, L);
    const tops = `(${n1} × ${m1})/(${d1} × ${m1}) ${op} (${n2} × ${m2})/(${d2} × ${m2})`;
    const same = `${N1}/${L} ${op} ${N2}/${L}`;
    const early = rng() < 0.45;
    const steps = early
      ? [tops, `${n1}/${L} ${op} ${N2}/${L}`, `${n1 + sign * N2}/${L}`]
      : [tops, same, `${top}/${L + L}`];
    const fixed = early ? same : `${top}/${L}`;
    const slipValue = early ? fraction(n1 + sign * N2, L) : fraction(top, 2 * L);
    return {
      start: `${n1}/${d1} ${op} ${n2}/${d2}`,
      mode: "expr",
      steps,
      bad: early ? 1 : 2,
      slip: early ? "cd-top" : "add-across",
      decoys: early ? ["add-across", "mul-bottom"] : ["cd-top", "diff-factor"],
      fix: fixed,
      near: early
        ? near(
            [
              [`${N1}/${L + 1} ${op} ${N2}/${L}`, fraction(N1, L + 1) + sign * fraction(N2, L)],
              [`${n1}/${L} ${op} ${n2}/${L}`, fraction(n1 + sign * n2, L)],
              [`${N1}/${L} ${op} ${n2}/${L}`, fraction(N1 + sign * n2, L)],
              [`${N1}/${L} ${op} ${N2}/${L + L}`, fraction(N1, L) + sign * fraction(N2, 2 * L)],
            ],
            value,
            slipValue,
          )
        : near(
            [
              [`${top}/${L + 1}`, fraction(top, L + 1)],
              [`${top + 1}/${L}`, fraction(top + 1, L)],
              [`${top}/${d1 + d2}`, fraction(top, d1 + d2)],
              [`${top - 1}/${L}`, fraction(top - 1, L)],
            ],
            value,
            slipValue,
          ),
      answer: `${top / gcd(top, L)}/${L / gcd(top, L)}`,
      answerAlt: `${top}/${L}`,
    };
  }
  throw new Error("fracAdd: no numbers");
}

function fracMul(rng, { config }) {
  const maxD = Math.max(6, config.maxDenominator ?? 12);
  for (let tries = 0; tries < 800; tries += 1) {
    const [d1, d2] = [int(rng, 2, maxD), int(rng, 2, maxD)];
    const [n1, n2] = [int(rng, 1, d1 - 1), int(rng, 1, d2 - 1)];
    const [top, bottom] = [n1 * n2, d1 * d2];
    const g = gcd(top, d1);
    if (g < 2 || top === d1) continue;
    const value = fraction(top, bottom);
    const slipValue = fraction(top, d1);
    return {
      start: `${n1}/${d1} × ${n2}/${d2}`,
      mode: "expr",
      steps: [`(${n1} × ${n2})/(${d1} × ${d2})`, `${top}/${d1}`, `${top / g}/${d1 / g}`],
      bad: 1,
      slip: "mul-bottom",
      decoys: ["add-across", "diff-factor"],
      fix: `${top}/${bottom}`,
      near: near(
        [
          [`${top}/${d1 + d2}`, fraction(top, d1 + d2)],
          [`${n1 + n2}/${bottom}`, fraction(n1 + n2, bottom)],
          [`${top + 1}/${bottom}`, fraction(top + 1, bottom)],
          [`${top}/${d2}`, fraction(top, d2)],
        ],
        value,
        slipValue,
      ),
      answer: `${top / gcd(top, bottom)}/${bottom / gcd(top, bottom)}`,
      answerAlt: `${top}/${bottom}`,
    };
  }
  throw new Error("fracMul: no numbers");
}

function fracDiv(rng, { config }) {
  const maxD = Math.max(6, config.maxDenominator ?? 10);
  for (let tries = 0; tries < 500; tries += 1) {
    const [d1, d2] = [int(rng, 2, maxD), int(rng, 2, maxD)];
    const [n1, n2] = [int(rng, 1, d1 - 1), int(rng, 1, d2 - 1)];
    if (n1 * d2 === n2 * d1 || n1 === d1 || n2 === d2) continue;
    const value = fraction(n1 * d2, d1 * n2);
    const firstFlip = rng() < 0.5;
    const [wrongTop, wrongBottom] = firstFlip ? [d1 * n2, n1 * d2] : [n1 * n2, d1 * d2];
    return {
      start: `${n1}/${d1} ÷ ${n2}/${d2}`,
      mode: "expr",
      steps: [
        firstFlip ? `${d1}/${n1} × ${n2}/${d2}` : `${n1}/${d1} × ${n2}/${d2}`,
        firstFlip ? `(${d1} × ${n2})/(${n1} × ${d2})` : `(${n1} × ${n2})/(${d1} × ${d2})`,
        `${wrongTop}/${wrongBottom}`,
      ],
      bad: 0,
      slip: firstFlip ? "flip-first" : "no-flip",
      decoys: firstFlip ? ["no-flip", "mul-bottom"] : ["flip-first", "add-across"],
      fix: `${n1}/${d1} × ${d2}/${n2}`,
      near: near(
        [
          [
            firstFlip ? `${n1}/${d1} × ${n2}/${d2}` : `${d1}/${n1} × ${n2}/${d2}`,
            firstFlip ? fraction(n1 * n2, d1 * d2) : fraction(d1 * n2, n1 * d2),
          ],
          [`${d1}/${n1} × ${d2}/${n2}`, fraction(d1 * d2, n1 * n2)],
          [`${n1}/${d1} × ${d2}/${d2}`, fraction(n1, d1)],
          [`${n1}/${d1} × ${n2}/${d2 + 1}`, fraction(n1 * n2, d1 * (d2 + 1))],
        ],
        value,
        fraction(wrongTop, wrongBottom),
      ),
      answer: `${(n1 * d2) / gcd(n1 * d2, d1 * n2)}/${(d1 * n2) / gcd(n1 * d2, d1 * n2)}`,
      answerAlt: `${n1 * d2}/${d1 * n2}`,
    };
  }
  throw new Error("fracDiv: no numbers");
}

function fracEquiv(rng, { config }) {
  const d = int(rng, 2, Math.min(12, config.maxDenominator ?? 10));
  const n = int(rng, 1, d - 1);
  const f = int(rng, 2, Math.min(8, config.maxFactor ?? 6));
  const value = fraction(n, d);
  return {
    start: `${n}/${d}`,
    mode: "expr",
    steps: [`${n}/${d} × ${f}/${f}`, `${n + f}/${d * f}`, `${n + f}/${d * f}`],
    bad: 1,
    slip: "add-not-mult",
    decoys: ["cd-top", "diff-factor"],
    fix: `${n * f}/${d * f}`,
    near: near(
      [
        [`${n * f}/${d + f}`, fraction(n * f, d + f)],
        [`${n}/${d * f}`, fraction(n, d * f)],
        [`${n * f}/${d * f + 1}`, fraction(n * f, d * f + 1)],
        [`${n + 1}/${d * f}`, fraction(n + 1, d * f)],
      ],
      value,
      fraction(n + f, d * f),
    ),
    answer: `${n * f}/${d * f}`,
    meta: { kind: "equalFrac", n, d, f },
  };
}

function fracSimplify(rng, { config }) {
  for (let tries = 0; tries < 500; tries += 1) {
    const [a, b] = [int(rng, 1, 7), int(rng, 2, 9)];
    const g = int(rng, 2, Math.max(3, Math.floor((config.max ?? 60) / 12)));
    if (a >= b || gcd(a, b) !== 1) continue;
    const [A, B] = [a * g, b * g];
    return {
      start: `${A}/${B}`,
      mode: "expr",
      steps: [`(${g} × ${a})/(${g} × ${b})`, `${a}/${B}`, `${a}/${B}`],
      bad: 1,
      slip: "diff-factor",
      decoys: ["add-across", "add-not-mult"],
      fix: `${a}/${b}`,
      near: near(
        [
          [`${a}/${b + 1}`, fraction(a, b + 1)],
          [`${a + 1}/${b}`, fraction(a + 1, b)],
          [`${a}/${g * b + 1}`, fraction(a, g * b + 1)],
          [`${g}/${b}`, fraction(g, b)],
        ],
        fraction(a, b),
        fraction(a, B),
      ),
      answer: `${a}/${b}`,
      meta: { kind: "simplify", A, B },
    };
  }
  throw new Error("fracSimplify: no numbers");
}

function fracOf(rng, { config }) {
  const d = int(rng, 2, Math.min(10, config.maxDenominator ?? 8));
  const n = int(rng, 1, d - 1);
  const m = d * int(rng, 3, 9);
  return {
    start: `${n}/${d} of ${m}`,
    mode: "expr",
    steps: [`${m} × ${d} × ${n}`, `${m * d} × ${n}`, String(m * d * n)],
    bad: 0,
    slip: "wrong-way",
    decoys: ["mul-bottom", "diff-factor"],
    fix: `${m} ÷ ${d} × ${n}`,
    near: near(
      [
        [`${m} ÷ ${n} × ${d}`, (m / n) * d],
        [`${m} ÷ ${d} + ${n}`, m / d + n],
        [`${m} × ${n} × ${d}`, m * n * d],
        [`${m} ÷ ${d}`, m / d],
      ],
      (m / d) * n,
      m * d * n,
    ),
    answer: String((m / d) * n),
    meta: { kind: "fracOf", n, d, m },
  };
}

function decMul(rng) {
  const [A, B] = [int(rng, 2, 29), int(rng, 2, 9)];
  if (A % 10 === 0) return decMul(rng);
  return {
    start: `${A / 10} × ${B / 10}`,
    mode: "expr",
    steps: [`${A}/10 × ${B}/10`, `${A * B}/10`, String(round((A * B) / 10))],
    bad: 1,
    slip: "point-count",
    decoys: ["place-value", "pct-shift"],
    fix: `${A * B}/100`,
    near: near(
      [
        [`${A * B}/1000`, (A * B) / 1000],
        [`${A + B}/100`, (A + B) / 100],
        [`${A * B}/20`, (A * B) / 20],
        [`${A * B + 1}/100`, (A * B + 1) / 100],
      ],
      (A * B) / 100,
      (A * B) / 10,
    ),
    answer: String(round((A * B) / 100)),
  };
}

const cents = (c) => (c / 100).toFixed(2);
function decAdd(rng) {
  for (let tries = 0; tries < 300; tries += 1) {
    const [w1, w2, t1, c2] = [int(rng, 1, 9), int(rng, 0, 5), int(rng, 5, 9), int(rng, 11, 99)];
    const [c1] = [t1 * 10];
    if (c1 + c2 < 100 || c2 % 10 === 0) continue;
    const whole = w1 + w2;
    const sum = c1 + c2;
    return {
      start: `${w1}.${t1} + ${w2}.${String(c2).padStart(2, "0")}`,
      mode: "expr",
      steps: [
        `${w1}.${t1}0 + ${w2}.${String(c2).padStart(2, "0")}`,
        `${whole} + (0.${t1}0 + 0.${String(c2).padStart(2, "0")})`,
        `${whole} + ${cents(sum - 100)}`,
        String(round(whole + (sum - 100) / 100)),
      ],
      bad: 2,
      slip: "no-regroup",
      decoys: ["place-value", "pct-shift"],
      fix: `${whole} + ${cents(sum)}`,
      near: near(
        [
          [`${whole + 1} + ${cents(sum)}`, whole + 1 + sum / 100],
          [`${whole} + ${cents(sum + 10)}`, whole + (sum + 10) / 100],
          [`${whole} + ${cents(sum - 10)}`, whole + (sum - 10) / 100],
          [`${whole} + ${cents(c1)}`, whole + c1 / 100],
        ],
        whole + sum / 100,
        whole + (sum - 100) / 100,
      ),
      answer: String(round(whole + sum / 100)),
    };
  }
  throw new Error("decAdd: no numbers");
}


function probability(rng, { config }) {
  const d = int(rng, 6, Math.max(8, Math.min(24, config.maxTotal ?? 12)));
  const [n1, n2] = [int(rng, 1, Math.floor(d / 2) - 1), int(rng, 1, Math.floor(d / 2) - 1)];
  const top = n1 + n2;
  return {
    start: `${n1}/${d} + ${n2}/${d}`,
    mode: "expr",
    steps: [`(${n1} + ${n2})/${d}`, `${top}/${d + d}`, `${top}/${d + d}`],
    bad: 1,
    slip: "add-across",
    decoys: ["cd-top", "mul-bottom"],
    fix: `${top}/${d}`,
    near: near(
      [
        [`${top}/${d + 1}`, fraction(top, d + 1)],
        [`${top + 1}/${d}`, fraction(top + 1, d)],
        [`${top}/${d - 1}`, fraction(top, d - 1)],
        [`${top - 1}/${d}`, fraction(top - 1, d)],
      ],
      fraction(top, d),
      fraction(top, 2 * d),
    ),
    answer: `${top / gcd(top, d)}/${d / gcd(top, d)}`,
    answerAlt: `${top}/${d}`,
    meta: { kind: "chance", n1, n2, d },
  };
}

export const FRACTIONS = {
  fracAdd: { family: "fractions", run: fracAdd },
  fracMul: { family: "fractions", run: fracMul },
  fracDiv: { family: "fractions", run: fracDiv },
  fracEquiv: { family: "fractions", run: fracEquiv },
  fracSimplify: { family: "fractions", run: fracSimplify },
  fracOf: { family: "fractions", run: fracOf },
  probability: { family: "fractions", run: probability },
  decMul: { family: "decimals", run: decMul },
  decAdd: { family: "decimals", run: decAdd },
};
