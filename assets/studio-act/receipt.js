/**
 * Practice Studio activity: receipt, "Size zone and receipt check" (lessons 2-11 and 2-12).
 *
 * p.op "add" (2-11, decimals added and subtracted) or "mul" (2-12, decimals multiplied). Step 1: before any amount is
 * shown, the student taps the size zone the result must land in (less than 1, 1 to 10, 10 to 100, and at higher levels
 * more than 100), using the rounded numbers. Step 2: a receipt of lines, each already "calculated". Some lines hide a
 * misaligned addition (13.39 for 7.4 + 12.65) or a decimal point that slipped by a factor of 10. The student marks each
 * line "looks right" or "has a mistake" by comparing it with the size the rounded numbers give.
 * Amounts use whole-number arithmetic on the digits, so nothing depends on floating point. Needs assets/studio-act/u2kit.js.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  const P10 = (/** @type {number} */ k) => 10 ** k;
  /** A decimal as whole digits and a count of decimal places: { n: 1265, dp: 2 } is 12.65. */
  const val = (/** @type {any} */ x) => x.n / P10(x.dp);
  const show = (/** @type {any} */ x) => {
    const v = val(x);
    return v
      .toFixed(x.dp)
      .replace(/\.0+$/, "")
      .replace(/(\.\d*?)0+$/, "$1");
  };
  const money = (/** @type {any} */ x) => `$${val(x).toFixed(Math.max(2, x.dp))}`;
  const sf1 = (/** @type {number} */ v) => {
    if (v === 0) return 0;
    const p = P10(Math.floor(Math.log10(Math.abs(v))));
    return Math.round(v / p) * p;
  };
  const zoneOf = (/** @type {number} */ v) => (v < 1 ? 0 : v < 10 ? 1 : v < 100 ? 2 : 3);
  const ZONES = [
    ["Less than $1", "Menos de $1"],
    ["$1 to $10", "De $1 a $10"],
    ["$10 to $100", "De $10 a $100"],
    ["More than $100", "Más de $100"],
  ];
  const round6 = (/** @type {number} */ v) => Math.round(v * 1e6) / 1e6;

  /** Estimate from the rounded numbers: nearest whole numbers to add, one significant figure to multiply. */
  const estimate = (/** @type {any} */ l) => {
    const a = val(l.a);
    const b = val(l.b);
    if (l.op === "mul") return { ra: sf1(a), rb: sf1(b), est: round6(sf1(a) * sf1(b)) };
    const ra = Math.round(a);
    const rb = Math.round(b);
    return { ra, rb, est: l.op === "add" ? ra + rb : ra - rb };
  };
  const fits = (/** @type {any} */ l, /** @type {number} */ v) => {
    const { est } = estimate(l);
    if (l.op === "mul") return est !== 0 && v / est >= 0.5 && v / est <= 2.2;
    return Math.abs(v - est) <= 1.5;
  };
  const fitsLoosely = (/** @type {any} */ l, /** @type {number} */ v) => {
    const { est } = estimate(l);
    if (l.op === "mul") return est !== 0 && v / est >= 0.6 && v / est <= 1.7;
    return Math.abs(v - est) <= 1;
  };

  /** The exact result of a line as { n, dp }. */
  const exact = (/** @type {any} */ l) => {
    const { a, b } = l;
    if (l.op === "mul") return { n: a.n * b.n, dp: a.dp + b.dp };
    const m = Math.max(a.dp, b.dp);
    const x = a.n * P10(m - a.dp);
    const y = b.n * P10(m - b.dp);
    return { n: l.op === "add" ? x + y : x - y, dp: m };
  };
  /** The tempting wrong result. misaligned: the digits are added as if they were whole numbers lined up on the right. */
  const wrongOf = (/** @type {any} */ l, /** @type {"misaligned"|"up"|"down"} */ kind) => {
    const t = exact(l);
    if (kind === "up") return { n: t.n * 10, dp: t.dp };
    if (kind === "down") return { n: t.n, dp: t.dp + 1 };
    const m = Math.max(l.a.dp, l.b.dp);
    return { n: l.op === "add" ? l.a.n + l.b.n : l.a.n - l.b.n, dp: m };
  };
  const kindText = /** @type {any} */ ({
    misaligned: ["Check how the digits were lined up.", "Revisa cómo se alinearon los dígitos."],
    up: ["Check where the decimal point went.", "Revisa dónde quedó el punto decimal."],
    down: ["Check where the decimal point went.", "Revisa dónde quedó el punto decimal."],
  });

  const pickNum = (
    /** @type {any} */ rng,
    /** @type {number} */ lo,
    /** @type {number} */ hi,
    /** @type {number} */ dp,
  ) => {
    let n = rng.int(lo * P10(dp), hi * P10(dp));
    if (dp > 0 && n % 10 === 0) n += rng.int(1, 9); // keep the last digit non-zero so the decimal places are real
    return { n, dp };
  };
  const rawLine = (
    /** @type {any} */ rng,
    /** @type {"add"|"sub"|"mul"} */ op,
    /** @type {number} */ level,
    /** @type {number} */ big,
  ) => {
    if (op === "mul") {
      const f2 = level >= 2 && rng.chance(0.4);
      const b = f2
        ? { n: rng.pick([25, 75, 5, 15]), dp: 2 }
        : { n: rng.pick(level === 1 ? [5, 2, 4, 8, 15] : [5, 2, 4, 6, 8, 15, 25]), dp: 1 };
      const a = f2 ? { n: rng.int(2, big), dp: 0 } : pickNum(rng, 1.2, big, 1);
      return { op, a, b };
    }
    const dpa = level === 1 ? 1 : rng.pick([1, 2]);
    const dpb = level === 1 ? 1 : dpa === 1 ? 2 : 1;
    let a = pickNum(rng, 2, big, dpa);
    let b = pickNum(rng, 2, big, dpb);
    if (op === "sub" && val(a) < val(b)) [a, b] = [b, a];
    return { op, a, b };
  };

  const textOf = (/** @type {any} */ l) =>
    `${show(l.a)} ${l.op === "add" ? "+" : l.op === "sub" ? "−" : "×"} ${show(l.b)}`;

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const s = state || {};
    const flags = Array.isArray(s.flags) ? s.flags : [];
    const zoneOk = s.zone === M.zone;
    const marks = [
      zoneOk,
      ...M.lines.map((/** @type {any} */ l, /** @type {number} */ i) => flags[i] === l.bad),
    ];
    const score = K.score(marks);
    if (!Number.isInteger(s.zone))
      return K.no(
        "receipt-zone",
        "Tap a size zone first. Round the numbers and think about how big the result must be.|Toca primero una zona de tamaño. Redondea los números y piensa qué tan grande debe ser el resultado.",
        score,
      );
    if (!zoneOk) {
      const [d, dEs] = s.zone < M.zone ? ["bigger", "mayor"] : ["smaller", "menor"];
      return K.no(
        "decimal-place-value",
        `The result is ${d} than that zone. Round each number, then add, subtract or multiply the rounded numbers in your head.|El resultado es ${dEs} que esa zona. Redondea cada número y luego suma, resta o multiplica los números redondeados mentalmente.`,
        score,
      );
    }
    const open = M.lines.findIndex((_l, i) => typeof flags[i] !== "boolean");
    if (open >= 0)
      return K.no(
        "receipt-open",
        "Mark every line of the receipt as looks right or has a mistake.|Marca cada línea del recibo como parece correcta o tiene un error.",
        score,
      );
    const bi = M.lines.findIndex(
      (/** @type {any} */ l, /** @type {number} */ i) => flags[i] !== l.bad,
    );
    if (bi >= 0) {
      const l = M.lines[bi];
      const n = bi + 1;
      if (l.bad) {
        const [t, tEs] = kindText[l.kind];
        const tag = l.kind === "misaligned" ? "decimal-not-lined-up" : "decimal-place-value";
        return K.no(
          tag,
          `Line ${n} (${l.text}): its amount does not fit the size you get from the rounded numbers. ${t}|Línea ${n} (${l.text}): su monto no coincide con el tamaño que dan los números redondeados. ${tEs}`,
          score,
        );
      }
      return K.no(
        "estimate-rounded-poorly",
        `Line ${n} (${l.text}) fits the size you get from the rounded numbers. Look again before you call it a mistake.|La línea ${n} (${l.text}) coincide con el tamaño que dan los números redondeados. Mira otra vez antes de decir que tiene un error.`,
        score,
      );
    }
    return { ok: true, ...score };
  };

  A.register("receipt", {
    title: "Size zone and receipt check",
    titleEs: "Zona de tamaño y revisión del recibo",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
      const op = params.op === "mul" ? "mul" : "add";
      const zones = level >= 3 ? 4 : 3;
      const showRound = level <= 2;
      const big = level === 1 ? 40 : level === 2 ? 60 : 90;
      const mkMain = () => {
        for (let t = 0; t < 800; t++) {
          const l = rawLine(rng, op, level, big);
          const v = val(exact(l));
          const z = zoneOf(v);
          if (z < zones && zoneOf(estimate(l).est) === z && fitsLoosely(l, v) && v > 0)
            return { ...l, text: textOf(l) };
        }
        return { op, a: { n: 74, dp: 1 }, b: { n: 1265, dp: 2 }, text: "7.4 + 12.65" };
      };
      const mkLine = (/** @type {boolean} */ bad, /** @type {string[]} */ kinds) => {
        for (let t = 0; t < 1200; t++) {
          const lop = op === "mul" ? "mul" : level >= 3 && rng.chance(0.4) ? "sub" : "add";
          const base = rawLine(rng, lop, level, big);
          const tv = exact(base);
          const v = val(tv);
          const e = estimate(base).est;
          if (!fitsLoosely(base, v) || v < (lop === "mul" ? 0.3 : 4) || e === 0) continue;
          if (!bad) return { ...base, text: textOf(base), shown: tv, bad: false, kind: null };
          for (const kind of rng.shuffle(kinds)) {
            if (kind === "misaligned" && (base.a.dp === base.b.dp || lop === "mul")) continue;
            const w = wrongOf(base, /** @type {any} */ (kind));
            if (val(w) <= 0 || Math.abs(val(w) - v) < 1e-9 || fits(base, val(w))) continue;
            return { ...base, text: textOf(base), shown: w, bad: true, kind };
          }
        }
        throw new Error("receipt: no line");
      };
      const main = mkMain();
      const nLines = level <= 2 ? 4 : 5;
      const nBad = level === 1 ? 1 : 2;
      const lines = /** @type {any[]} */ ([]);
      for (let i = 0; i < nBad; i++) {
        const kinds = op === "add" && level >= 2 && i === 0 ? ["misaligned"] : ["up", "down"];
        lines.push(mkLine(true, kinds));
      }
      while (lines.length < nLines) lines.push(mkLine(false, []));
      const order = rng.shuffle(lines);
      // keep the order from placing every bad line first or last
      const shownLines = order.map((l) => ({
        text: l.text,
        claim: money(l.shown),
        rounded: estimateLabel(l),
        bad: l.bad,
        kind: l.kind,
      }));
      const zone = zoneOf(val(exact(main)));
      const mainEst = estimate(main);
      const sym = op === "mul" ? "×" : "+";
      return {
        q: `A store receipt shows amounts in dollars. First, look at ${main.text}. Round the numbers and tap the size zone the result must land in. Then check each line of the receipt: mark it "looks right" or "has a mistake".`,
        qEs: `Un recibo de una tienda muestra montos en dólares. Primero mira ${main.text}. Redondea los números y toca la zona de tamaño en la que debe caer el resultado. Luego revisa cada línea del recibo: márcala como "parece correcta" o "tiene un error".`,
        x: `Rounding first gives a size to expect: about ${mainEst.ra} ${sym} ${mainEst.rb} = ${W.StudioGen.fmt(mainEst.est, 4)}. A result that lands far from that size has a misplaced decimal point or digits that were not lined up by place value.`,
        xEs: `Redondear primero da un tamaño esperado: alrededor de ${mainEst.ra} ${sym} ${mainEst.rb} = ${W.StudioGen.fmt(mainEst.est, 4)}. Un resultado que cae lejos de ese tamaño tiene un punto decimal mal puesto o dígitos que no se alinearon por valor posicional.`,
        h: [
          "Round each number to a whole number (or one digit for multiplying), then do the easy math.",
          "A decimal point that moves one place makes the result 10 times as big or one tenth as big. That changes the size zone.",
          "Compare each receipt amount with the size from the rounded numbers. Far from it means a mistake.",
        ],
        hEs: [
          "Redondea cada número a un entero (o a un dígito al multiplicar) y luego haz la cuenta fácil.",
          "Un punto decimal que se mueve un lugar hace el resultado 10 veces más grande o una décima parte. Eso cambia la zona de tamaño.",
          "Compara cada monto del recibo con el tamaño de los números redondeados. Si está lejos, hay un error.",
        ],
        model: {
          op,
          zones,
          showRound,
          main: { text: main.text, rounded: estimateLabel(main) },
          zone,
          lines: shownLines,
        },
      };
      function estimateLabel(/** @type {any} */ l) {
        const e = estimate(l);
        const s = l.op === "add" ? "+" : l.op === "sub" ? "−" : "×";
        return `${e.ra} ${s} ${e.rb} = ${W.StudioGen.fmt(e.est, 4)}`;
      }
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      return { zone: M.zone, flags: M.lines.map((/** @type {any} */ l) => l.bad) };
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.receipt.solution(spec);
      const out = [
        { ...sol, zone: M.zone === 0 ? 1 : M.zone - 1 },
        { ...sol, zone: null },
        { ...sol, flags: sol.flags.map((/** @type {boolean} */ f) => !f) },
        { ...sol, flags: sol.flags.map(() => false) },
        {
          ...sol,
          flags: sol.flags.map((/** @type {boolean} */ f, /** @type {number} */ i) =>
            i === 0 ? null : f,
          ),
        },
      ];
      return out.filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const { root, L, B, live, ro } = K.shell(host, api);
      const saved = api.restore && "zone" in api.restore ? api.restore : null;
      const st = {
        zone: saved && Number.isInteger(saved.zone) ? saved.zone : null,
        flags: saved && Array.isArray(saved.flags) ? saved.flags.slice() : M.lines.map(() => null),
      };
      const emit = () => api.change?.({ zone: st.zone, flags: st.flags.slice() });
      const s1 = A.el("div", "u2-box");
      const aid = A.el("p", "u2-note");
      const showAid = () => {
        aid.innerHTML = B(
          `Rounded numbers: ${M.main.rounded}`,
          `Números redondeados: ${M.main.rounded}`,
        );
      };
      s1.append(
        A.el(
          "p",
          "u2-note",
          `<b>${B("1. Size zone for", "1. Zona de tamaño para")} ${M.main.text}</b>`,
        ),
      );
      if (M.showRound) {
        showAid();
        s1.append(aid);
      } else {
        const rb = A.el("button", "u2-btn", B("Round the numbers", "Redondear los números"), {
          type: "button",
        });
        rb.disabled = ro;
        rb.addEventListener("click", () => {
          showAid();
          rb.hidden = true;
          s1.append(aid);
        });
        s1.append(rb);
      }
      K.choices(
        s1,
        ZONES.slice(0, M.zones).map(([en, es]) => ({ en, es })),
        st.zone,
        ro,
        (i) => {
          st.zone = i;
          emit();
        },
        L("Size zone", "Zona de tamaño"),
        B,
      );
      root.append(s1);
      const s2 = A.el("div", "u2-box");
      s2.append(A.el("p", "u2-note", `<b>${B("2. Check the receipt", "2. Revisa el recibo")}</b>`));
      const groups = /** @type {any[]} */ ([]);
      M.lines.forEach((/** @type {any} */ l, /** @type {number} */ i) => {
        const row = A.el("div", "u2-box");
        const roundTxt = M.showRound
          ? ` <small>(${B(`rounded: ${l.rounded}`, `redondeado: ${l.rounded}`)})</small>`
          : "";
        row.append(
          A.el(
            "p",
            "u2-note",
            `<b>${B("Line", "Línea")} ${i + 1}:</b> ${l.text} = <b>${l.claim}</b>${roundTxt}`,
          ),
        );
        const g = K.choices(
          row,
          [
            { en: "Looks right", es: "Parece correcta" },
            { en: "Has a mistake", es: "Tiene un error" },
          ],
          st.flags[i] === false ? 0 : st.flags[i] === true ? 1 : null,
          ro,
          (j) => {
            st.flags[i] = j === 1;
            emit();
          },
          L(`Line ${i + 1}`, `Línea ${i + 1}`),
          B,
        );
        groups.push(g);
        s2.append(row);
      });
      root.append(s2, live);
      if (!ro)
        K.actions(
          root,
          api,
          B,
          () => ({ zone: st.zone, flags: st.flags.slice() }),
          () => {
            st.zone = null;
            st.flags = M.lines.map(() => null);
            for (const b of root.querySelectorAll('[role="radio"]'))
              b.setAttribute("aria-checked", "false");
            emit();
          },
        );
    },
  });
})();
