// Rounds for kindergarten to grade 2: number bonds, "same number" balance, the equal sign as a balance, and
// missing numbers in an equation. Every round here has exactly one solution unless it says "any" in its prompt.
// @fm2 FM-017 FM-051 FM-060
import {
  cmpRule,
  given,
  int,
  makePool,
  numberPool,
  openCell,
  pick,
  placeRound,
  shuffle,
  T,
} from "./gen-kit.js";

const sum = (list) => list.reduce((a, b) => a + b, 0);

// A balance round: the scales are the display; the rules are exactly what the scales compare.
export function balanceRound(rng, base, scales, ref) {
  return placeRound(rng, {
    layout: "balance",
    scales,
    ref,
    rules: scales.map((s) => cmpRule(s.l, s.r, s.rel || "=")),
    ...base,
  });
}

// ---- number bonds ---------------------------------------------------------------------------------------------
export function bondParts(level, rng, grade) {
  const young = grade === 0;
  const mode = level === 3 ? "two" : level === 2 && rng() < 0.3 ? "whole" : "part";
  const whole =
    level === 1
      ? young
        ? int(rng, 3, 5)
        : int(rng, 6, 10)
      : level === 2
        ? young
          ? rng() < 0.7
            ? 10
            : int(rng, 6, 9)
          : int(rng, 11, 20)
        : young
          ? int(rng, 6, 10)
          : int(rng, 11, 20);
  const base = { level, layout: "bond", reuse: true };
  if (mode === "two") {
    const a = int(rng, 1, whole - 1);
    const values = [
      ...new Set([
        a,
        whole - a,
        ...shuffle(
          rng,
          Array.from({ length: whole - 1 }, (_, i) => i + 1),
        ),
      ]),
    ].slice(0, 8);
    return placeRound(rng, {
      ...base,
      prompt: T(
        `The whole is ${whole}. Place two parts that make ${whole}.`,
        `El total es ${whole}. Coloca dos partes que formen ${whole}.`,
      ),
      cells: [given(whole), openCell(), openCell()],
      pool: makePool(values.sort((x, y) => x - y).map((v) => ({ v }))),
      rules: [cmpRule([{ c: 1 }, { c: 2 }], [{ c: 0 }])],
    });
  }
  if (mode === "whole") {
    const a = int(rng, 1, Math.floor(whole / 2));
    const b = whole - a;
    const named = [
      [whole + 1, "off-one"],
      [whole - 1, "off-one"],
      [a, "copied-part"],
      [b, "copied-part"],
      [Math.abs(b - a), "subtracted"],
    ];
    return placeRound(rng, {
      ...base,
      prompt: T(
        `The two parts are ${a} and ${b}. Place the whole.`,
        `Las dos partes son ${a} y ${b}. Coloca el total.`,
      ),
      cells: [openCell(), given(a), given(b)],
      pool: numberPool(rng, {
        include: [whole],
        exclude: [whole],
        named,
        lo: 1,
        hi: Math.min(whole + 2, young ? 12 : 20),
        size: 8,
      }),
      rules: [cmpRule([{ c: 1 }, { c: 2 }], [{ c: 0 }])],
    });
  }
  const known = int(rng, 1, whole - 1);
  const answer = whole - known;
  const openFirst = rng() < 0.5;
  const named = [
    [whole, "copied-whole"],
    [known, "copied-part"],
    [answer + 1, "off-one"],
    [answer - 1, "off-one"],
  ];
  return placeRound(rng, {
    ...base,
    prompt: T(
      `This number bond makes ${whole}. One part is ${known}. Place the missing part.`,
      `Este enlace numérico forma ${whole}. Una parte es ${known}. Coloca la parte que falta.`,
    ),
    cells: [
      given(whole),
      openFirst ? openCell() : given(known),
      openFirst ? given(known) : openCell(),
    ],
    pool: numberPool(rng, {
      include: [answer],
      exclude: [answer],
      named,
      lo: 1,
      hi: whole,
      size: 8,
    }),
    rules: [cmpRule([{ c: 1 }, { c: 2 }], [{ c: 0 }])],
  });
}

// ---- balance: the same number on both pans ---------------------------------------------------------------------
export function balanceSame(level, rng, grade) {
  const young = grade === 0;
  const mirror = rng() < 0.5;
  const put = (l, r) => (mirror ? { l: r, r: l } : { l, r });
  if (level === 1) {
    const n = young ? int(rng, 2, 5) : int(rng, 5, 10);
    const named = [
      [n + 1, "off-one"],
      [n - 1, "off-one"],
    ];
    return balanceRound(
      rng,
      {
        level,
        reuse: true,
        prompt: T(
          "Place a number on the empty pan spot so the scale balances.",
          "Coloca un número en el lugar vacío para que la balanza quede equilibrada.",
        ),
        cells: [openCell()],
        pool: numberPool(rng, {
          include: [n],
          exclude: [n],
          named,
          lo: 1,
          hi: young ? 10 : 12,
          size: 5,
        }),
      },
      [{ ...put([{ v: n, dots: n <= 10 }], [{ c: 0 }]), rel: "=" }],
      n,
    );
  }
  if (level === 2) {
    const n = young ? int(rng, 4, 10) : int(rng, 8, 20);
    const m = int(rng, 1, n - 1);
    const answer = n - m;
    const named = [
      [n, "copied-total"],
      [m, "copied-fixed"],
      [answer + 1, "off-one"],
      [answer - 1, "off-one"],
    ];
    return balanceRound(
      rng,
      {
        level,
        reuse: true,
        prompt: T(
          `One pan weighs ${n}. The other pan already has ${m}. Place a number so both pans weigh the same.`,
          `Un platillo pesa ${n}. El otro ya tiene ${m}. Coloca un número para que los dos platillos pesen lo mismo.`,
        ),
        cells: [openCell()],
        pool: numberPool(rng, {
          include: [answer],
          exclude: [answer],
          named,
          lo: 1,
          hi: young ? 10 : 20,
          size: 6,
        }),
      },
      [{ ...put([{ v: n, dots: n <= 10 }], [{ v: m, dots: m <= 10 }, { c: 0 }]), rel: "=" }],
      n,
    );
  }
  const n = young ? int(rng, 5, 10) : int(rng, 10, 20);
  const first = int(rng, 1, n - 1);
  const values = [
    ...new Set([
      first,
      n - first,
      ...shuffle(
        rng,
        Array.from({ length: n - 1 }, (_, i) => i + 1),
      ),
    ]),
  ].slice(0, 8);
  return balanceRound(
    rng,
    {
      level,
      reuse: true,
      prompt: T(
        `One pan weighs ${n}. Place two numbers on the other pan so both pans weigh the same.`,
        `Un platillo pesa ${n}. Coloca dos números en el otro platillo para que los dos pesen lo mismo.`,
      ),
      cells: [openCell(), openCell()],
      pool: makePool(values.sort((x, y) => x - y).map((v) => ({ v }))),
    },
    [{ ...put([{ v: n, dots: n <= 10 }], [{ c: 0 }, { c: 1 }]), rel: "=" }],
    n,
  );
}

// ---- the equal sign means "the same amount" ---------------------------------------------------------------------
export function equalSign(level, rng, grade) {
  const hi = grade === 1 ? 20 : [50, 100, 100][level - 1];
  const mirror = rng() < 0.4;
  const put = (l, r) => (mirror ? { l: r, r: l } : { l, r });
  let left;
  let right;
  let total;
  let answer;
  let fixedRight;
  let named;
  if (level === 1) {
    const a = int(rng, 1, Math.floor(hi / 2) - 1);
    const b = int(rng, 1, Math.floor(hi / 2) - 1);
    total = a + b;
    const c = int(rng, 1, total - 1);
    answer = total - c;
    left = [{ v: a }, { v: b }];
    right = [{ v: c }, { c: 0 }];
    fixedRight = c;
  } else if (level === 2) {
    const form = pick2(rng);
    if (form === 0) {
      const a = int(rng, 2, Math.floor(hi / 2));
      const b = int(rng, 1, Math.floor(hi / 2));
      total = a + b;
      const c = int(rng, 1, total - 1);
      answer = total - c;
      left = [{ v: a }, { v: b }];
      right = [{ c: 0 }, { v: c }];
      fixedRight = c;
    } else if (form === 1) {
      total = int(rng, 6, hi);
      const c = int(rng, 1, total - 1);
      answer = total - c;
      left = [{ v: total }];
      right = [{ c: 0 }, { v: c }];
      fixedRight = c;
    } else {
      const a = int(rng, 2, Math.floor(hi / 2));
      const b = int(rng, 1, Math.floor(hi / 2));
      total = a + b;
      const c = int(rng, 1, total - 1);
      answer = total - c;
      left = [{ c: 0 }, { v: c }];
      right = [{ v: a }, { v: b }];
      fixedRight = c;
    }
  } else {
    const third = Math.floor(hi / 3);
    const a = int(rng, 2, third);
    const b = int(rng, 2, third);
    const c = int(rng, 2, third);
    total = a + b + c;
    if (rng() < 0.5) {
      const d = int(rng, 1, total - 1);
      answer = total - d;
      left = [{ v: a }, { v: b }, { v: c }];
      right = [{ v: d }, { c: 0 }];
      fixedRight = d;
    } else {
      const d = int(rng, 1, Math.floor(total / 2));
      const e = int(rng, 1, total - d - 1);
      answer = total - d - e;
      left = [{ v: a }, { v: b }, { v: c }];
      right = [{ v: d }, { c: 0 }, { v: e }];
      fixedRight = d;
    }
  }
  const multi = left.length > 1;
  named = [
    [multi ? total : -1, "added-all"],
    [fixedRight, "copied-fixed"],
    [!multi ? total : -1, "copied-total"],
    [answer + 1, "off-one"],
    [answer - 1, "off-one"],
  ];
  if (grade === 2) named.push([answer + 10, "off-ten"], [answer - 10, "off-ten"]);
  return balanceRound(
    rng,
    {
      level,
      reuse: true,
      prompt: T(
        "The equal sign means both sides are the same amount. Place the number that balances the scale.",
        "El signo igual significa que los dos lados son la misma cantidad. Coloca el número que equilibra la balanza.",
      ),
      cells: [openCell()],
      pool: numberPool(rng, {
        include: [answer],
        exclude: [answer],
        named: named.filter(([v]) => v > 0),
        lo: 1,
        hi,
        size: 6,
      }),
    },
    [{ ...put(left, right), rel: "=" }],
    Math.max(total, 1),
  );
}

const pick2 = (rng) => int(rng, 0, 2);

// ---- missing number in an equation -------------------------------------------------------------------------------
export function missingAddend(level, rng, grade) {
  const hi = grade === 1 ? (level === 1 ? 10 : 20) : [20, 50, 100][level - 1];
  const forms =
    level === 1
      ? ["addR", "addL"]
      : level === 2
        ? ["addR", "addL", "sub1"]
        : ["sub1", "sub2", "three"];
  const form = pick(rng, forms);
  let tokens;
  let rule;
  let answer;
  let others;
  let wrongSub = null;
  if (form === "addR" || form === "addL") {
    const c = int(rng, 3, hi);
    const a = int(rng, 1, c - 1);
    answer = c - a;
    others = [a, c];
    tokens = form === "addR" ? [a, "+", { slot: 0 }, "=", c] : [{ slot: 0 }, "+", a, "=", c];
    rule = cmpRule([{ v: a }, { c: 0 }], [{ v: c }]);
  } else if (form === "sub1") {
    const c = int(rng, 3, hi);
    const b = int(rng, 1, c - 1);
    answer = c - b;
    others = [b, c];
    tokens = [c, "−", { slot: 0 }, "=", b];
    rule = cmpRule([{ c: 0 }, { v: b }], [{ v: c }]);
  } else if (form === "sub2") {
    const a = int(rng, 1, Math.floor(hi / 2));
    const b = int(rng, 1, hi - a);
    answer = a + b;
    others = [a, b];
    wrongSub = Math.abs(a - b);
    tokens = [{ slot: 0 }, "−", a, "=", b];
    rule = cmpRule([{ c: 0 }], [{ v: a }, { v: b }]);
  } else {
    const a = int(rng, 1, Math.floor(hi / 3));
    const b = int(rng, 1, Math.floor(hi / 3));
    answer = int(rng, 1, hi - a - b);
    const c = a + answer + b;
    others = [a, b, c];
    tokens = [a, "+", { slot: 0 }, "+", b, "=", c];
    rule = cmpRule([{ v: a }, { c: 0 }, { v: b }], [{ v: c }]);
  }
  const total = form === "sub2" ? answer : Math.max(...others);
  const named = [
    [total, "copied-total"],
    [sum(others), "added-all"],
    [answer + 1, "off-one"],
    [answer - 1, "off-one"],
  ];
  if (wrongSub !== null) named.push([wrongSub, "subtracted-wrong"]);
  if (grade === 2) named.push([answer + 10, "off-ten"], [answer - 10, "off-ten"]);
  return placeRound(rng, {
    level,
    layout: "eq",
    reuse: true,
    eq: tokens,
    prompt: T(
      "Place the number that makes the equation true.",
      "Coloca el número que hace verdadera la ecuación.",
    ),
    cells: [openCell()],
    pool: numberPool(rng, {
      include: [answer],
      exclude: [answer],
      named,
      lo: 1,
      hi,
      size: 6,
    }),
    rules: [rule],
  });
}
