/* Neon Grid — pure percent math for the Percent Power expedition (no Phaser).
 *
 * Problem generators, answer judges and misconception classifiers live here so they can
 * be tested in Node with a seeded rng. The builders (expedition-missions.js,
 * expedition-flow.js) only draw the city and route the student's numbers through these.
 * Every judge returns {ok:true} or {ok:false, misconception, feedback:{en,es}} or
 * {ok:false, incomplete:true, feedback}. Feedback names the error; it never states the answer.
 */
(function (root) {
  "use strict";
  const L = (en, es) => ({ en, es });
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;
  /** Numbers for display: whole numbers stay whole, others get at most 2 decimals. */
  const fmt = (x) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100));
  /** Smallest whole-number percent chunk that splits 100 evenly and builds p (e.g. 35 → 5). */
  const chunkOf = (p) => gcd(p, 100);
  /** Smallest whole for which p% is a whole number. */
  const stepOf = (p) => 100 / gcd(p, 100);
  const decStr = (p) => fmt(p / 100);

  /* ── grid: light p% of a 100-window block ─────────────────────────────── */
  const FRACTIONS = [];
  [2, 4, 5, 10, 20, 25, 50].forEach((den) => {
    for (let num = 1; num < den; num++) {
      const p = (num * 100) / den;
      if (gcd(num, den) === 1 && p !== 50 && num !== p && den !== p && 100 - p !== num)
        FRACTIONS.push({ num, den, p });
    }
  });
  const DECIMAL_PS = [3, 4, 6, 7, 8, 9, 20, 30, 40, 60, 70, 80, 15, 35, 45, 65, 85, 12, 48, 72];

  function genGrid(rng, tier) {
    if (tier <= 1) {
      let p;
      do p = rng.int(12, 88);
      while (p % 10 === 0 || p === 50);
      return { form: "percent", p, label: p + "%" };
    }
    if (rng.next() < 0.5) {
      const f = rng.pick(FRACTIONS.filter((x) => x.den <= 25));
      return { form: "fraction", ...f, label: f.num + "/" + f.den };
    }
    const p = rng.pick(DECIMAL_PS);
    return { form: "decimal", p, dec: decStr(p), label: decStr(p) };
  }
  function judgeGrid(prob, lit) {
    const p = prob.p;
    if (!lit)
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "No windows are lit yet. Click a window or press → to light windows.",
          "Todavía no hay ventanas encendidas. Haz clic en una ventana o pulsa → para encenderlas.",
        ),
      };
    if (lit === p) return { ok: true };
    if (prob.form === "fraction" && (lit === prob.num || lit === prob.den))
      return {
        ok: false,
        misconception: "fractionParts",
        feedback: L(
          `You lit ${lit} ${lit === 1 ? "window" : "windows"}, a number from the fraction ${prob.label}. Percent means out of 100: the block has 100 windows, not ${prob.den}.`,
          `Encendiste ${lit} ${lit === 1 ? "ventana" : "ventanas"}, un número de la fracción ${prob.label}. Porcentaje significa de cada 100: el bloque tiene 100 ventanas, no ${prob.den}.`,
        ),
      };
    if (prob.form === "decimal" && (lit * 10 === p || lit === p * 10))
      return {
        ok: false,
        misconception: "decimalShift",
        feedback: L(
          `${lit} windows is ${lit}%, but ${prob.dec} is not ${lit} hundredths. Check the place of each digit: tenths, then hundredths.`,
          `${lit} ventanas es ${lit}%, pero ${prob.dec} no son ${lit} centésimos. Revisa el lugar de cada dígito: décimos y luego centésimos.`,
        ),
      };
    if (lit === 100 - p)
      return {
        ok: false,
        misconception: "complement",
        feedback: L(
          `You lit the windows that should stay dark. Count the lit part, not the rest.`,
          `Encendiste las ventanas que deben quedar apagadas. Cuenta la parte encendida, no el resto.`,
        ),
      };
    return lit > p
      ? {
          ok: false,
          misconception: "tooMuch",
          feedback: L(
            `Overload! ${lit} lit ${lit === 1 ? "window is" : "windows are"} more than ${prob.label} of the block. The fuse sparks.`,
            `¡Sobrecarga! ${lit} ${lit === 1 ? "ventana encendida es" : "ventanas encendidas son"} más que ${prob.label} del bloque. El fusible chispea.`,
          ),
        }
      : {
          ok: false,
          misconception: "tooLittle",
          feedback: L(
            `Brownout: ${lit} lit ${lit === 1 ? "window is" : "windows are"} less than ${prob.label} of the block.`,
            `Apagón parcial: ${lit} ${lit === 1 ? "ventana encendida es" : "ventanas encendidas son"} menos que ${prob.label} del bloque.`,
          ),
        };
  }

  /* ── breakers: fraction = decimal = percent on each breaker ───────────── */
  function genBreakers(rng, tier) {
    const rows = [];
    const used = new Set();
    const take = (row) => {
      if (used.has(row.p)) return false;
      used.add(row.p);
      rows.push(row);
      return true;
    };
    if (tier <= 1) {
      const dens = rng.shuffle([2, 4, 5, 10, 100]).slice(0, 3);
      dens.forEach((den) => {
        let ok = false;
        while (!ok) {
          let num;
          if (den === 100)
            do num = rng.int(11, 99);
            while (num % 10 === 0);
          else
            do num = rng.int(1, den - 1);
            while (gcd(num, den) !== 1);
          ok = take({ given: "fraction", num, den, p: (num * 100) / den });
        }
      });
      return rows;
    }
    const pool = FRACTIONS.filter((f) => f.den >= 4);
    while (rows.length < 2) take({ given: "fraction", ...rng.pick(pool) });
    while (rows.length < 3)
      take({ given: "decimal", p: rng.pick([4, 5, 6, 8, 30, 70, 90, 15, 85]) });
    while (rows.length < 4) take({ given: "percent", p: rng.pick([2, 7, 9, 40, 60, 25, 55, 95]) });
    return rng.shuffle(rows);
  }
  const blanksOf = (row) =>
    row.given === "fraction" ? ["dec", "pct"] : row.given === "decimal" ? ["pct"] : ["dec"];
  const givenLabel = (row) =>
    row.given === "fraction"
      ? row.num + "/" + row.den
      : row.given === "decimal"
        ? decStr(row.p)
        : row.p + "%";
  /** Parse a typed plate ("", ".45", "0.45", "45"). null = empty, NaN = not a number. */
  function parsePlate(s) {
    if (s == null || s === "") return null;
    if (s === ".") return Number.NaN;
    return Number(s);
  }
  function judgeBox(row, kind, v) {
    const p = row.p;
    if (kind === "pct" ? near(v, p) : near(v, p / 100)) return null;
    const frac = row.given === "fraction";
    if (kind === "pct") {
      if (frac && (v === row.num || v === row.den || v === Number(`${row.num}${row.den}`)))
        return "fractionParts";
      if (near(v, p / 100) || near(v, p / 10) || near(v, p * 10)) return "decimalShift";
      return "notEquivalent";
    }
    if (
      frac &&
      (near(v, Number(`0.${row.num}${row.den}`)) ||
        near(v, row.num / 10) ||
        near(v, Number(`${row.num}.${row.den}`)))
    )
      return "fractionParts";
    if (near(v, p) || near(v, p / 10) || near(v, p / 1000)) return "decimalShift";
    return "notEquivalent";
  }
  /** entries[i] = {dec: string, pct: string}. Returns the first broken breaker, top to bottom. */
  function judgeBreakers(rows, entries) {
    const empty = rows.some((row, i) =>
      blanksOf(row).some((k) => parsePlate(entries[i][k]) == null),
    );
    if (empty)
      return {
        ok: false,
        incomplete: true,
        feedback: L("Fill every empty plate first.", "Primero completa todas las placas vacías."),
      };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const kind of blanksOf(row)) {
        const raw = entries[i][kind];
        const v = parsePlate(raw);
        const tag = Number.isNaN(v) ? "notEquivalent" : judgeBox(row, kind, v);
        if (!tag) continue;
        const shown = kind === "pct" ? raw + "%" : raw;
        const g = givenLabel(row);
        const n = i + 1;
        const feedback = {
          fractionParts: L(
            `Breaker ${n} tripped: ${shown} just reuses the digits of ${g}. Percent means out of 100, so first make the bottom number 100.`,
            `El interruptor ${n} saltó: ${shown} solo repite los dígitos de ${g}. Porcentaje significa de cada 100: primero haz que el número de abajo sea 100.`,
          ),
          decimalShift: L(
            `Breaker ${n} tripped: ${shown} and ${g} are not the same amount. Check the decimal point: percent means hundredths, so it moves two places.`,
            `El interruptor ${n} saltó: ${shown} y ${g} no son la misma cantidad. Revisa el punto decimal: porcentaje son centésimos, así que se mueve dos lugares.`,
          ),
          notEquivalent: L(
            `Breaker ${n} tripped: ${shown} is not the same amount as ${g}.`,
            `El interruptor ${n} saltó: ${shown} no es la misma cantidad que ${g}.`,
          ),
        }[tag];
        return { ok: false, misconception: tag, row: i, kind, feedback };
      }
    }
    return { ok: true };
  }

  /* ── find: p% of a plant's output N ───────────────────────────────────── */
  const FIND_PS = {
    1: [10, 20, 25, 50, 75],
    2: [15, 30, 40, 60, 70, 80, 90, 25, 75],
    3: [5, 15, 35, 45, 55, 65, 85, 95, 30, 70],
  };
  function genFind(rng, tier, opts = {}) {
    const ps = opts.ps || FIND_PS[Math.min(3, Math.max(1, tier))];
    const maxN = opts.maxN || (tier >= 3 ? 300 : 200);
    for (;;) {
      const p = rng.pick(ps);
      const step = stepOf(p);
      const lo = Math.ceil(20 / step);
      const hi = Math.floor(maxN / step);
      const N = step * rng.int(lo, hi);
      const a = (p * N) / 100;
      if (N === 100 || N % 5 !== 0 || a === p || a < 2 || N - a === p) continue;
      return { p, N, a };
    }
  }
  function judgeAmount(prob, v, prefix) {
    const { p, N, a } = prob;
    const pre = prefix || L("", "");
    const w = (en, es) => L(pre.en + en, pre.es + es);
    if (!v)
      return {
        ok: false,
        incomplete: true,
        feedback: w("Set how many MW to send first.", "Primero ajusta cuántos MW enviar."),
      };
    if (v === a) return { ok: true };
    if (v === p)
      return {
        ok: false,
        misconception: "percentAsNumber",
        feedback: w(
          `You sent ${v} MW, the same number as the percent. ${p}% is a part of ${N} MW, not ${p} MW.`,
          `Enviaste ${v} MW, el mismo número que el porcentaje. El ${p}% es una parte de ${N} MW, no ${p} MW.`,
        ),
      };
    if (Math.abs(v - N / p) < 1)
      return {
        ok: false,
        misconception: "divideByPercent",
        feedback: w(
          `You divided ${N} by ${p}. Percent means out of 100: split ${N} into 100 parts (or 10 parts), then take ${p}% of them.`,
          `Dividiste ${N} entre ${p}. Porcentaje significa de cada 100: divide ${N} en 100 partes (o en 10), y luego toma el ${p}% de ellas.`,
        ),
      };
    if (v === a * 10 || v * 10 === a)
      return {
        ok: false,
        misconception: "decimalShift",
        feedback: w(
          `${v} MW is 10 times too ${v > a ? "big" : "small"}. Check the decimal point: ${p}% = ${decStr(p)}.`,
          `${v} MW es 10 veces ${v > a ? "más grande" : "más pequeño"} de lo necesario. Revisa el punto decimal: ${p}% = ${decStr(p)}.`,
        ),
      };
    if (v === N - a)
      return {
        ok: false,
        misconception: "complement",
        feedback: w(
          `${v} MW is the part the station does NOT need (${100 - p}% of ${N}). Send the ${p}% part.`,
          `${v} MW es la parte que la estación NO necesita (${100 - p}% de ${N}). Envía la parte del ${p}%.`,
        ),
      };
    if (v === N)
      return {
        ok: false,
        misconception: "wholeAsPart",
        feedback: w(
          `${v} MW is the whole output, 100%. The station needs only ${p}% of it.`,
          `${v} MW es toda la producción, el 100%. La estación necesita solo el ${p}%.`,
        ),
      };
    return v > a
      ? {
          ok: false,
          misconception: "tooMuch",
          feedback: w(
            `Overload! ${v} MW is more than ${p}% of ${N} MW. Sparks fly at the station.`,
            `¡Sobrecarga! ${v} MW es más que el ${p}% de ${N} MW. Saltan chispas en la estación.`,
          ),
        }
      : {
          ok: false,
          misconception: "tooLittle",
          feedback: w(
            `Brownout: ${v} MW is less than ${p}% of ${N} MW. The station stays dim.`,
            `Apagón parcial: ${v} MW es menos que el ${p}% de ${N} MW. La estación sigue oscura.`,
          ),
        };
  }

  /* ── estimate: benchmark percents with awkward numbers ────────────────── */
  function genEstimate(rng) {
    for (;;) {
      const b = rng.pick([10, 20, 25, 50, 75]);
      const p = b + (b === 10 ? rng.pick([-1, 1]) : rng.pick([-2, -1, 1, 2]));
      const step = Math.max(10, stepOf(b));
      const Nn = step * rng.int(Math.ceil(40 / step), Math.floor(200 / step));
      if (Nn >= 90 && Nn <= 110) continue;
      const N = Nn + rng.pick([-2, -1, 1, 2]);
      const exact = (p * N) / 100;
      const est = (b * Nn) / 100;
      const tol = Math.max(2, Math.round(exact * 0.15));
      const far = (x) => Math.abs(x - exact) > tol + 1;
      if (Math.abs(est - exact) > tol - 0.5) continue;
      if (!far(p) || !far(N / p) || !far(N - exact) || !far(N) || !far(exact * 10)) continue;
      if (exact / 10 > 1 && !far(exact / 10)) continue;
      return { b, p, N, Nn, exact, est, tol };
    }
  }
  const estimateOk = (prob, v) => Math.abs(v - prob.exact) <= prob.tol;
  function judgeEstimate(prob, v) {
    const { p, N, exact, tol } = prob;
    if (!v)
      return {
        ok: false,
        incomplete: true,
        feedback: L("Set your estimate in MW first.", "Primero ajusta tu estimación en MW."),
      };
    if (estimateOk(prob, v)) return { ok: true };
    if (Math.abs(v - p) <= 1)
      return {
        ok: false,
        misconception: "percentAsNumber",
        feedback: L(
          `${v} MW is about the percent itself. ${p}% is a part of ${N} MW, so think: what part of ${N}?`,
          `${v} MW es casi el porcentaje mismo. El ${p}% es una parte de ${N} MW: ¿qué parte de ${N}?`,
        ),
      };
    if (Math.abs(v - N / p) <= 1)
      return {
        ok: false,
        misconception: "divideByPercent",
        feedback: L(
          `You divided ${N} by ${p}. Use a benchmark instead: 10% is one tenth, 25% is one fourth, 50% is one half.`,
          `Dividiste ${N} entre ${p}. Usa un porcentaje de referencia: 10% es un décimo, 25% es un cuarto, 50% es la mitad.`,
        ),
      };
    if (Math.abs(v - exact * 10) <= tol * 10 || (exact >= 10 && Math.abs(v - exact / 10) <= 1))
      return {
        ok: false,
        misconception: "decimalShift",
        feedback: L(
          `${v} MW is about 10 times too ${v > exact ? "big" : "small"}. Check the place value of your benchmark.`,
          `${v} MW es unas 10 veces ${v > exact ? "más grande" : "más pequeño"}. Revisa el valor posicional de tu referencia.`,
        ),
      };
    if (Math.abs(v - (N - exact)) <= tol)
      return {
        ok: false,
        misconception: "complement",
        feedback: L(
          `${v} MW is close to the part the line does NOT need (about ${100 - p}%).`,
          `${v} MW se acerca a la parte que la línea NO necesita (cerca del ${100 - p}%).`,
        ),
      };
    return v > exact
      ? {
          ok: false,
          misconception: "estimateOff",
          feedback: L(
            `Overload! ${v} MW is too far above ${p}% of ${N} MW. Pick a benchmark percent close to ${p}%.`,
            `¡Sobrecarga! ${v} MW está muy por encima del ${p}% de ${N} MW. Elige un porcentaje de referencia cerca del ${p}%.`,
          ),
        }
      : {
          ok: false,
          misconception: "estimateOff",
          feedback: L(
            `Brownout: ${v} MW is too far below ${p}% of ${N} MW. Pick a benchmark percent close to ${p}%.`,
            `Apagón parcial: ${v} MW está muy por debajo del ${p}% de ${N} MW. Elige un porcentaje de referencia cerca del ${p}%.`,
          ),
        };
  }

  /* ── compare: the bigger percent is NOT the bigger amount ─────────────── */
  function genCompare(rng, tier) {
    const ps = tier >= 3 ? FIND_PS[3].concat([20, 40, 60, 80]) : [10, 20, 25, 30, 40, 50, 75];
    for (;;) {
      const A = genFind(rng, tier, { ps, maxN: tier >= 3 ? 300 : 200 });
      const B = genFind(rng, tier, { ps, maxN: tier >= 3 ? 300 : 200 });
      if (A.p === B.p || A.a === B.a) continue;
      const big = A.p > B.p ? A : B;
      const small = big === A ? B : A;
      if (big.a >= small.a || small.a - big.a < 2) continue;
      if (A.a === B.p || B.a === A.p) continue;
      const lines = rng.shuffle([big, small]);
      return { lines, better: lines.indexOf(small) };
    }
  }
  const NAMES = ["A", "B"];
  function judgeCompare(prob, vals, choice) {
    if (!vals[0] || !vals[1])
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "Set both meters to the MW each line sends.",
          "Ajusta los dos medidores a los MW que envía cada línea.",
        ),
      };
    for (let i = 0; i < 2; i++) {
      const r = judgeAmount(prob.lines[i], vals[i], L(`Line ${NAMES[i]}: `, `Línea ${NAMES[i]}: `));
      if (!r.ok) return { ...r, line: i };
    }
    if (choice !== 0 && choice !== 1)
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "Both meters work. Now switch the station to the line that sends MORE power (A or B).",
          "Los dos medidores funcionan. Ahora conecta la estación a la línea que envía MÁS energía (A o B).",
        ),
      };
    if (choice === prob.better) return { ok: true };
    const c = prob.lines[choice];
    return {
      ok: false,
      misconception: "biggerPercent",
      feedback: L(
        `Line ${NAMES[choice]} has the bigger percent (${c.p}%), but look at your meters: which line sends more MW?`,
        `La línea ${NAMES[choice]} tiene el porcentaje mayor (${c.p}%), pero mira tus medidores: ¿qué línea envía más MW?`,
      ),
    };
  }

  /* ── whole: the part and its percent are known; find the plant total ──── */
  const WHOLE_PS = {
    1: [10, 20, 25, 50],
    2: [20, 25, 30, 40, 60, 75, 80],
    3: [15, 30, 35, 45, 60, 65, 70, 5],
  };
  function genWhole(rng, tier) {
    const ps = WHOLE_PS[Math.min(3, Math.max(1, tier))];
    const maxT = tier >= 3 ? 500 : tier >= 2 ? 400 : 300;
    for (;;) {
      const p = rng.pick(ps);
      const step = (stepOf(p) * 10) / gcd(stepOf(p), 10); // whole number for p% and for 10%
      const T = step * rng.int(Math.ceil(40 / step), Math.floor(maxT / step));
      const P = (p * T) / 100;
      if (T % 10 !== 0 || P === T || T === p || P < 2 || P === p) continue;
      if (Math.abs(T - (P * p) / 100) < 2 || Math.abs(T - P / p) < 2 || T === P + p) continue;
      return { p, T, P };
    }
  }
  const delivered = (prob, v) => (prob.p * v) / 100;
  function judgeWhole(prob, v) {
    const { p, T, P } = prob;
    if (!v)
      return {
        ok: false,
        incomplete: true,
        feedback: L(
          "Set the plant's total output first.",
          "Primero ajusta la producción total de la planta.",
        ),
      };
    if (v === T) return { ok: true };
    // The delivered amount is shown so the world explains the result, but never when it
    // happens to equal the hidden total.
    const sent = delivered(prob, v);
    const got = fmt(sent);
    if (v === P)
      return {
        ok: false,
        misconception: "partAsWhole",
        feedback: L(
          `${P} MW is only the ${p}% part. The plant total is 100%, and 100% is more than ${p}%.`,
          `${P} MW es solo la parte del ${p}%. El total de la planta es el 100%, y 100% es más que ${p}%.`,
        ),
      };
    if (Math.abs(v - (P * p) / 100) < 1 || v === P * p)
      return {
        ok: false,
        misconception: "reversed",
        feedback: L(
          `You took ${p}% of the part. ${P} MW is the part; the plant total is the whole. At ${v} MW the plant sends only ${got} MW.`,
          `Sacaste el ${p}% de la parte. ${P} MW es la parte; el total de la planta es el todo. Con ${v} MW la planta envía solo ${got} MW.`,
        ),
      };
    if (Math.abs(v - P / p) < 1)
      return {
        ok: false,
        misconception: "divideByPercent",
        feedback: L(
          `${P} ÷ ${p} finds 1% of the plant, not 100%. At ${v} MW the plant sends only ${got} MW.`,
          `${P} ÷ ${p} da el 1% de la planta, no el 100%. Con ${v} MW la planta envía solo ${got} MW.`,
        ),
      };
    if (v === P + p || v === p)
      return {
        ok: false,
        misconception: "percentAsNumber",
        feedback: L(
          `You used ${p} as if it were megawatts. ${p}% tells what part ${P} MW is, out of 100 parts.`,
          `Usaste ${p} como si fueran megavatios. El ${p}% dice qué parte es ${P} MW de 100 partes.`,
        ),
      };
    if (sent === T)
      return {
        ok: false,
        misconception: v === T * 10 ? "decimalShift" : "tooMuch",
        feedback: L(
          `Overload! At ${v} MW, ${p}% of the plant is far more than the ${P} MW the district gets.`,
          `¡Sobrecarga! Con ${v} MW, el ${p}% de la planta es mucho más que los ${P} MW del distrito.`,
        ),
      };
    if (v === T * 10 || v * 10 === T)
      return {
        ok: false,
        misconception: "decimalShift",
        feedback: L(
          `At ${v} MW the plant sends ${got} MW, 10 times ${v > T ? "too much" : "too little"}. Check the place value.`,
          `Con ${v} MW la planta envía ${got} MW, 10 veces ${v > T ? "demasiado" : "muy poco"}. Revisa el valor posicional.`,
        ),
      };
    return v > T
      ? {
          ok: false,
          misconception: "tooMuch",
          feedback: L(
            `Overload! At ${v} MW, ${p}% of the plant is ${got} MW, more than the ${P} MW the district gets.`,
            `¡Sobrecarga! Con ${v} MW, el ${p}% de la planta es ${got} MW, más que los ${P} MW del distrito.`,
          ),
        }
      : {
          ok: false,
          misconception: "tooLittle",
          feedback: L(
            `Brownout: at ${v} MW, ${p}% of the plant is only ${got} MW, less than ${P} MW.`,
            `Apagón parcial: con ${v} MW, el ${p}% de la planta es solo ${got} MW, menos que ${P} MW.`,
          ),
        };
  }

  const api = {
    L,
    gcd,
    fmt,
    chunkOf,
    stepOf,
    decStr,
    genGrid,
    judgeGrid,
    genBreakers,
    blanksOf,
    givenLabel,
    parsePlate,
    judgeBreakers,
    genFind,
    judgeAmount,
    genEstimate,
    judgeEstimate,
    estimateOk,
    genCompare,
    judgeCompare,
    genWhole,
    judgeWhole,
    delivered,
    FRACTIONS,
  };
  root.PP_MISSIONS = Object.assign(root.PP_MISSIONS || {}, api);
})(typeof window !== "undefined" ? window : globalThis);
