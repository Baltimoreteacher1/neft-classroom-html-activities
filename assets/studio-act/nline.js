/**
 * Practice Studio activity: nline (window.StudioAct kind "nline").
 * Place, order, mirror and measure numbers on a number line. Modes: place, order, opposite, abs.
 * State is { pts: [value, ...] } (place, opposite, abs) or { seq: [itemIndex, ...] } (order).
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /* ---- helpers ------------------------------------------------------------------------------ */
  const bi = (/** @type {string} */ s) => s.split("¦").map((t) => t.trim());
  const r4 = (/** @type {number} */ n) => Math.round(n * 1e4) / 1e4;
  const mn = (/** @type {number} */ n) => G.fmt(n, 4).replace("-", "−");
  /** Values come from rounded ticks, and ticks are never closer than 0.05, so 0.001 is exact enough. */
  const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-3;
  const has = (/** @type {number[]} */ l, /** @type {number} */ v) => l.some((q) => near(q, v));
  const sameSet = (/** @type {number[]} */ a, /** @type {number[]} */ b) =>
    a.length === b.length && a.every((v) => has(b, v)) && b.every((v) => has(a, v));
  const MODES = ["place", "order", "opposite", "abs"];
  const pack = (/** @type {any} */ o) => {
    const [q, qEs] = bi(o.q);
    const [x, xEs] = bi(o.x);
    const hh = o.h.map(bi);
    return { q, qEs, x, xEs, h: hh.map((t) => t[0]), hEs: hh.map((t) => t[1]) };
  };
  /** Text for value v on a line: integer, decimal, or fraction with denominator den. */
  function show(/** @type {number} */ v, /** @type {any} */ ln) {
    if (ln.fmt !== "frac") return mn(v);
    const n = Math.round(Math.abs(v) * ln.den);
    const w = Math.floor(n / ln.den);
    const rem = n - w * ln.den;
    const d = G.gcd(rem, ln.den) || 1;
    const part = rem ? `${rem / d}/${ln.den / d}` : "";
    const body = w && part ? `${w} ${part}` : part || String(w);
    return `${v < 0 && n ? "−" : ""}${body}`;
  }
  const valAt = (/** @type {any} */ ln, /** @type {number} */ k) => r4(ln.min + k * ln.step);
  const ticks = (/** @type {any} */ ln) => Math.round((ln.max - ln.min) / ln.step);
  const onLab = (/** @type {any} */ ln, /** @type {number} */ v) =>
    Math.abs(v / ln.lab - Math.round(v / ln.lab)) < 1e-3;
  const line = (min, max, step, lab, fmt, den = 1) => ({ min, max, step, lab, fmt, den });
  function lineFor(rng, lv) {
    if (lv === 1) return line(-10, 10, 1, 5, "int");
    if (lv === 2) return line(-5, 5, 0.5, 1, rng.pick(["dec", "frac"]), 2);
    if (lv === 3) return line(-3, 3, 0.25, 1, rng.pick(["dec", "frac", "frac"]), 4);
    return rng.pick([
      line(-1, 1, 0.1, 0.5, "dec"),
      line(-0.5, 0.5, 0.05, 0.25, "dec"),
      line(-40, 40, 5, 20, "int"),
      line(-3, 3, 1 / 3, 1, "frac", 3),
      line(-2, 2, 0.2, 1, rng.pick(["dec", "frac"]), 5),
    ]);
  }
  /** A tick value off the labelled ticks (so it takes reasoning), never 0. */
  function pickVal(rng, ln, o = {}) {
    const n = ticks(ln);
    for (let i = 0; i < 200; i++) {
      const v = valAt(ln, rng.int(0, n));
      if (near(v, 0)) continue;
      if (o.lim && Math.abs(v) > o.lim) continue;
      if (onLab(ln, v) && rng.chance(0.85)) continue;
      return v;
    }
    return valAt(ln, n - 1);
  }

  /* ---- place -------------------------------------------------------------------------------- */
  const NONE =
    "Tap the number line to place a point first. ¦ Toca la recta numérica para poner primero un punto.";
  function oneTickAlts(ln, v) {
    const mk = (/** @type {number} */ x) => ({
      tag: "one-tick",
      pts: [x],
      say: "You are very close. Count the ticks again from the nearest labeled number. ",
      sayEs: "Estás muy cerca. Cuenta otra vez las marcas desde el número rotulado más cercano. ",
    });
    return [r4(v + ln.step), r4(v - ln.step)].filter((x) => x >= ln.min && x <= ln.max).map(mk);
  }
  function mkPlace(rng, lv, p) {
    const ln = lineFor(rng, lv);
    const v = pickVal(rng, ln);
    const t = show(v, ln);
    const alts = [
      {
        tag: "wrong-side",
        pts: [-v],
        say: "Check which side of 0 the number is on. A negative number is to the left of 0. ",
        sayEs:
          "Revisa de qué lado del 0 está el número. Un número negativo está a la izquierda del 0. ",
      },
    ];
    if (ln.step < 1 && Math.abs(v / ln.step) <= ln.max) {
      alts.push({
        tag: "tick-as-whole",
        pts: [v / ln.step],
        say: "Each tick is not a whole number. See how far apart the labels are, then count how many ticks make one unit. ",
        sayEs:
          "Cada marca no es un número entero. Mira qué tan separados están los números rotulados y cuenta cuántas marcas forman una unidad. ",
      });
    }
    alts.push(...oneTickAlts(ln, v));
    return {
      ...pack({
        q: `Place a point at ${t}. Tap or drag on the number line. ¦ Pon un punto en ${t}. Toca o arrastra en la recta numérica.`,
        x: `${t} is ${v < 0 ? `${show(-v, ln)} units left of 0` : `${t} units right of 0`}. Count the ticks from the nearest labeled number. ¦ ${t} está ${v < 0 ? `${show(-v, ln)} unidades a la izquierda del 0` : `${t} unidades a la derecha del 0`}. Cuenta las marcas desde el número rotulado más cercano.`,
        h: [
          "Find 0 first. Negative numbers are left of 0 and positive numbers are right. ¦ Primero busca el 0. Los números negativos están a la izquierda del 0 y los positivos a la derecha.",
          ln.step < 1
            ? "Not every tick has a label. Work out how much one tick is worth. ¦ No todas las marcas tienen número. Calcula cuánto vale una marca."
            : "Not every tick has a label. Count the ticks from the nearest labeled number. ¦ No todas las marcas tienen número. Cuenta las marcas desde el número rotulado más cercano.",
          "Count from the closest labeled number toward your number, one tick at a time. ¦ Cuenta desde el número rotulado más cercano hacia tu número, una marca a la vez.",
        ],
      }),
      line: ln,
      want: [v],
      given: [],
      far: bi(
        "Check where your number is compared to the labeled numbers. Which two labels is it between? ¦ Revisa dónde está tu número respecto a los números rotulados. ¿Entre cuáles dos números rotulados está?",
      ),
      alts,
    };
  }

  /* ---- order -------------------------------------------------------------------------------- */
  function itemPool(rng, lv) {
    const mk = (v, t) => ({ v: r4(v), t });
    const out = [];
    const int = (/** @type {number} */ lo, /** @type {number} */ hi) => {
      for (let i = lo; i <= hi; i++) if (i) out.push(mk(i, mn(i)));
    };
    if (lv === 1) {
      int(-9, 9);
      return { items: out, min: -10, max: 10, k: 4, gap: 1 };
    }
    const fr = (n, d) => {
      const ln = { fmt: "frac", den: d };
      return mk(n / d, show(n / d, ln));
    };
    if (lv === 2) {
      for (let h = -9; h <= 9; h++)
        if (h)
          out.push(
            h % 2 ? (rng.chance(0.5) ? mk(h / 2, mn(h / 2)) : fr(h, 2)) : mk(h / 2, mn(h / 2)),
          );
      return { items: out, min: -5, max: 5, k: rng.pick([4, 5]), gap: 0.5 };
    }
    for (let q = -11; q <= 11; q++)
      if (q) out.push(q % 4 === 0 || rng.chance(0.5) ? fr(q, 4) : mk(q / 4, mn(q / 4)));
    if (lv === 3) return { items: out, min: -3, max: 3, k: 5, gap: 0.25 };
    for (let t = -8; t <= 8; t++)
      if (t) out.push(rng.chance(0.5) ? fr(t, 3) : mk(t / 3, mn(r4(t / 3))));
    for (let f = -10; f <= 10; f++)
      if (f) out.push(rng.chance(0.5) ? fr(f, 5) : mk(f / 5, mn(f / 5)));
    return { items: out, min: -3, max: 3, k: rng.pick([5, 6]), gap: 0.15 };
  }
  function mkOrder(rng, lv, p) {
    const pool = itemPool(rng, lv);
    let items = [];
    for (let i = 0; i < 300; i++) {
      const pick = rng.shuffle(pool.items).slice(0, pool.k);
      const vs = pick.map((q) => q.v).sort((a, b) => a - b);
      const okGap = vs.every((v, j) => !j || v - vs[j - 1] >= pool.gap - 1e-9);
      const negs = vs.filter((v) => v < 0).length;
      if (okGap && negs >= 2 && negs <= pool.k - 1) {
        items = pick;
        break;
      }
    }
    if (!items.length) items = pool.items.slice(0, pool.k);
    const desc = lv >= 3 && rng.chance(0.3);
    const idx = items.map((_, i) => i).sort((a, b) => (items[a].v - items[b].v) * (desc ? -1 : 1));
    const ln = line(
      pool.min,
      pool.max,
      lv === 1 ? 1 : lv === 2 ? 0.5 : lv === 3 ? 0.25 : 0.5,
      lv === 1 ? 5 : 1,
      "int",
    );
    const dirEn = desc ? "greatest to least" : "least to greatest";
    const dirEs = desc ? "de mayor a menor" : "de menor a mayor";
    const sorted = idx.map((i) => items[i].t).join(desc ? " > " : " < ");
    const absSeq = items
      .map((_, i) => i)
      .sort((a, b) => Math.abs(items[a].v) - Math.abs(items[b].v) || items[a].v - items[b].v);
    return {
      ...pack({
        q: `Tap the numbers in order from ${dirEn}. Each one drops onto the number line. ¦ Toca los números en orden ${dirEs}. Cada uno cae sobre la recta numérica.`,
        x: `On a number line, numbers farther ${desc ? "right" : "left"} come first when you go from ${dirEn}: ${sorted}. ¦ En una recta numérica, los números más a la ${desc ? "derecha" : "izquierda"} van primero si ordenas ${dirEs}: ${sorted}.`,
        h: [
          "A number line lists numbers in order. Numbers farther to the right are greater. ¦ Una recta numérica ordena los números. Los números más a la derecha son mayores.",
          "Sort the negative numbers first. A negative number farther from 0 is less. ¦ Primero ordena los números negativos. Un número negativo más lejos del 0 es menor.",
          `Tap the ${desc ? "greatest" : "least"} number first. Look at where each one lands on the line. ¦ Toca primero el número ${desc ? "mayor" : "menor"}. Mira dónde cae cada uno en la recta.`,
        ],
      }),
      line: ln,
      items,
      desc,
      absSeq,
      cap: items.length,
      want: idx,
    };
  }

  /* ---- opposite ----------------------------------------------------------------------------- */
  function mkOpposite(rng, lv, p) {
    const ln = lineFor(rng, lv);
    const g = pickVal(rng, ln, { lim: ln.max - ln.step });
    const a = -g;
    const gT = show(g, ln);
    const aT = show(a, ln);
    const alts = [
      {
        tag: "same-number",
        pts: [g],
        say: "That is the number itself. The opposite is on the other side of 0. ",
        sayEs: "Ese es el mismo número. El opuesto está al otro lado del 0. ",
      },
      ...oneTickAlts(ln, a),
    ];
    return {
      ...pack({
        q: `Place the opposite of ${gT}. ¦ Pon el opuesto de ${gT}.`,
        x: `Opposites are the same distance from 0 on opposite sides. The opposite of ${gT} is ${aT}. ¦ Los opuestos están a la misma distancia del 0, en lados distintos. El opuesto de ${gT} es ${aT}.`,
        h: [
          "Opposites are the same distance from 0, but on opposite sides of it. ¦ Los opuestos están a la misma distancia del 0, pero en lados opuestos.",
          "Count how many ticks the shown number is from 0. ¦ Cuenta cuántas marcas hay del número mostrado al 0.",
          "Count the same number of ticks from 0 in the other direction. ¦ Cuenta el mismo número de marcas desde el 0 en la otra dirección.",
        ],
      }),
      line: ln,
      want: [a],
      given: [{ v: g, t: gT }],
      far: bi(
        "Opposites are the same distance from 0. Count how far the shown number is from 0, then go that far the other way. ¦ Los opuestos están a la misma distancia del 0. Cuenta qué tan lejos del 0 está el número mostrado y ve igual de lejos hacia el otro lado.",
      ),
      alts,
    };
  }

  /* ---- abs ---------------------------------------------------------------------------------- */
  function mkAbs(rng, lv, p) {
    const ln = lineFor(rng, lv);
    const n = ticks(ln);
    const kind =
      lv <= 2
        ? rng.pick(["zero", "one", "zero"])
        : lv === 3
          ? rng.pick(["both", "one", "both"])
          : "both";
    for (let i = 0; i < 300; i++) {
      const dK = rng.int(2, Math.max(2, Math.floor(n / 2) - 1));
      const d = r4(dK * ln.step);
      const a = kind === "zero" ? 0 : valAt(ln, rng.int(1, n - 1));
      if (kind !== "zero" && near(a, 0)) continue;
      const dir = rng.pick([1, -1]);
      const hi = r4(a + d);
      const lo = r4(a - d);
      const okRange =
        kind === "one"
          ? a + dir * d >= ln.min - 1e-9 && a + dir * d <= ln.max + 1e-9
          : hi <= ln.max + 1e-9 && lo >= ln.min - 1e-9;
      if (!okRange || d > Math.abs(ln.max) * 0.9) continue;
      if (kind !== "zero" && lv >= 3 && Math.abs(a) > ln.max * 0.7 && rng.chance(0.5)) continue;
      const dT = show(d, ln);
      const aT = show(a, ln);
      let want;
      let q;
      let x;
      const alts = [];
      if (kind === "zero") {
        want = [d, -d];
        q = `Mark both numbers x where |x| = ${dT}. ¦ Marca los dos números x donde |x| = ${dT}.`;
        x = `|x| = ${dT} means x is ${dT} units from 0. That is true at ${dT} and at ${show(-d, ln)}. ¦ |x| = ${dT} significa que x está a ${dT} unidades del 0. Eso pasa en ${dT} y en ${show(-d, ln)}.`;
      } else if (kind === "both") {
        want = [hi, lo];
        q = `Mark both numbers that are ${dT} units from ${aT}. ¦ Marca los dos números que están a ${dT} unidades de ${aT}.`;
        x = `Go ${dT} units right and ${dT} units left of ${aT}: ${show(hi, ln)} and ${show(lo, ln)}. ¦ Ve ${dT} unidades a la derecha y ${dT} unidades a la izquierda de ${aT}: ${show(hi, ln)} y ${show(lo, ln)}.`;
        alts.push({
          tag: "from-zero",
          pts: [d, -d],
          say: "It looks like you measured from 0. Measure the distance from the given number. ",
          sayEs: "Parece que mediste desde el 0. Mide la distancia desde el número dado. ",
        });
      } else {
        const b = r4(a + dir * d);
        want = [b];
        const w = dir > 0 ? ["right", "derecha"] : ["left", "izquierda"];
        q = `Mark the number that is ${dT} units to the ${w[0]} of ${aT}. ¦ Marca el número que está a ${dT} unidades a la ${w[1]} de ${aT}.`;
        x = `Start at ${aT} and move ${dT} units ${w[0]}: ${aT} ${dir > 0 ? "+" : "−"} ${dT} = ${show(b, ln)}. ¦ Empieza en ${aT} y muévete ${dT} unidades a la ${w[1]}: ${aT} ${dir > 0 ? "+" : "−"} ${dT} = ${show(b, ln)}.`;
        alts.push({
          tag: "wrong-direction",
          pts: [r4(a - dir * d)],
          say: "Your point is the right distance away, but on the other side. Check the direction word. ",
          sayEs:
            "Tu punto está a la distancia correcta, pero del otro lado. Revisa la palabra de dirección. ",
        });
        if (a !== 0)
          alts.push({
            tag: "from-zero",
            pts: [dir * d],
            say: "It looks like you measured from 0. Measure from the given number. ",
            sayEs: "Parece que mediste desde el 0. Mide desde el número dado. ",
          });
      }
      return {
        ...pack({
          q,
          x,
          h: [
            "Absolute value is distance from 0. Distance can go left or right. ¦ El valor absoluto es la distancia al 0. La distancia puede ir a la izquierda o a la derecha.",
            kind === "zero"
              ? "Count how many ticks make that distance, going right from 0 and then left from 0. ¦ Cuenta cuántas marcas forman esa distancia, hacia la derecha del 0 y luego hacia la izquierda del 0."
              : "Start at the given number. Count that many units, one direction at a time. ¦ Empieza en el número dado. Cuenta esas unidades, una dirección a la vez.",
            "Use the ticks: work out how much one tick is worth before you count. ¦ Usa las marcas: calcula cuánto vale una marca antes de contar.",
          ],
        }),
        line: ln,
        want,
        given: kind === "zero" ? [] : [{ v: a, t: aT }],
        center: a,
        dist: d,
        distT: dT,
        far: bi(
          "Count the distance from the starting number, one tick at a time. Check both directions if the question asks for both. ¦ Cuenta la distancia desde el número inicial, una marca a la vez. Revisa las dos direcciones si la pregunta pide las dos.",
        ),
        alts: alts.filter((x2) => !sameSet(x2.pts, want)),
      };
    }
    return { ...mkPlace(rng, lv, p), mode: "place" };
  }

  /* ---- grading ------------------------------------------------------------------------------ */
  const miss = (/** @type {string} */ tag, /** @type {string[]} */ s) => ({
    ok: false,
    tag,
    say: s[0],
    sayEs: s[1],
  });
  function gradeOrder(/** @type {any} */ spec, /** @type {any} */ state) {
    const n = spec.items.length;
    /** @type {number[]} */
    const seq = [];
    for (const i of (state && state.seq) || [])
      if (Number.isInteger(i) && i >= 0 && i < n && !seq.includes(i)) seq.push(i);
    if (!seq.length)
      return miss(
        "no-point",
        bi("Tap a number to drop it on the line. ¦ Toca un número para soltarlo en la recta."),
      );
    if (seq.length < n)
      return miss(
        "too-few",
        bi(
          `Tap all ${n} numbers. You have placed ${seq.length}. ¦ Toca los ${n} números. Has puesto ${seq.length}.`,
        ),
      );
    const want = spec.want;
    if (seq.every((v, i) => v === want[i])) return { ok: true };
    if (seq.every((v, i) => v === want[n - 1 - i])) {
      return miss(
        "reversed",
        bi(
          `Your order goes the other way. The question asks for ${spec.desc ? "greatest to least" : "least to greatest"}. ¦ Tu orden va al revés. La pregunta pide ${spec.desc ? "de mayor a menor" : "de menor a mayor"}.`,
        ),
      );
    }
    if (seq.every((v, i) => v === spec.absSeq[i]) && spec.items.some((q) => q.v < 0)) {
      return miss(
        "ignored-sign",
        bi(
          "It looks like you ordered by size and ignored the signs. A negative number farther from 0 is less, not greater. ¦ Parece que ordenaste por tamaño sin fijarte en los signos. Un número negativo más lejos del 0 es menor, no mayor.",
        ),
      );
    }
    const i = seq.findIndex((v, k) => v !== want[k]);
    const nth = ["1st", "2nd", "3rd", "4th", "5th", "6th"][i];
    const nthEs = ["1.º", "2.º", "3.º", "4.º", "5.º", "6.º"][i];
    return miss(
      "misplaced",
      bi(
        `Look again at your ${nth} tap. On the line, is there a number ${spec.desc ? "farther right" : "farther left"} that should come first? ¦ Mira otra vez tu toque ${nthEs}. En la recta, ¿hay un número más a la ${spec.desc ? "derecha" : "izquierda"} que debería ir primero?`,
      ),
    );
  }
  function gradeNl(/** @type {any} */ spec, /** @type {any} */ state) {
    if (spec.mode === "order") return gradeOrder(spec, state);
    /** @type {number[]} */
    const pts = [];
    for (const v of (state && state.pts) || [])
      if (Number.isFinite(Number(v)) && !has(pts, Number(v))) pts.push(Number(v));
    const want = spec.want;
    if (!pts.length) return miss("no-point", bi(NONE));
    if (sameSet(pts, want)) return { ok: true };
    const alt = (spec.alts || []).find((a) => sameSet(pts, a.pts));
    if (alt) return miss(alt.tag, [alt.say.trim(), alt.sayEs.trim()]);
    if (pts.length < want.length) {
      if (pts.length === 1 && has(want, pts[0]))
        return miss(
          "one-solution",
          bi(
            "That point works, but distance can go left or right. Look for a second point. ¦ Ese punto sirve, pero la distancia puede ir a la izquierda o a la derecha. Busca un segundo punto.",
          ),
        );
      return miss(
        "too-few",
        bi(
          `You need ${want.length} points and have placed ${pts.length}. ¦ Necesitas ${want.length} puntos y has puesto ${pts.length}.`,
        ),
      );
    }
    if (pts.length > want.length)
      return miss(
        "too-many",
        bi(
          "That is too many points. Tap a point to take it off. ¦ Son demasiados puntos. Toca un punto para quitarlo.",
        ),
      );
    const k = pts.filter((v) => has(want, v)).length;
    if (k > 0)
      return miss(
        "partial",
        bi(
          `${k} of your ${want.length} points is in the right place. Look again at the other. ¦ ${k} de tus ${want.length} puntos está en el lugar correcto. Mira otra vez el otro.`,
        ),
      );
    return miss("far", spec.far);
  }
  function wrongNl(/** @type {any} */ spec, /** @type {any} */ rng) {
    const out = [];
    if (spec.mode === "order") {
      const w = spec.want;
      const swap = w.slice();
      [swap[0], swap[1]] = [swap[1], swap[0]];
      const cands = [w.slice().reverse(), spec.absSeq, swap, w.slice(0, -1)];
      for (const s of cands)
        if (
          s.length &&
          !s.every((v, i) => v === w[i]) &&
          !out.some((o) => o.seq.join() === s.join())
        )
          out.push({ seq: s });
      return rng.shuffle(out).slice(0, 4);
    }
    const want = spec.want;
    const add = (/** @type {number[]} */ pts) => {
      if (!sameSet(pts, want) && !out.some((o) => sameSet(o.pts, pts))) out.push({ pts });
    };
    for (const a of spec.alts || []) add(a.pts);
    add(want.map((v) => -v));
    add(want.map((v) => r4(v + spec.line.step * 3)));
    add([]);
    return rng.shuffle(out).slice(0, 4);
  }

  /* ---- widget ------------------------------------------------------------------------------- */
  const CSS = `
.sn{display:grid;gap:12px;max-width:640px;color:var(--ink,#1B2733)}
.sn-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}
.sn-line{touch-action:pan-y;background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);cursor:crosshair;line-height:0;overflow:hidden;user-select:none;-webkit-user-select:none}
.sn-solved .sn-line{cursor:default}
.sn-line:focus-visible,.sn-btn:focus-visible,.sn-tile:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.sn-line svg{display:block;width:100%;height:auto}
.sn-base,.sn-tick{stroke:var(--ink,#1B2733);stroke-width:2.2}
.sn-tick{stroke-width:1.6}
.sn-tick.sub{stroke:var(--brand-line,#BBCADA)}
.sn-arrow{fill:var(--ink,#1B2733)}
.sn-lab{fill:var(--ink,#1B2733);font:700 12px system-ui,sans-serif;text-anchor:middle;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:3px}
.sn-lab.big{font-size:14px;fill:var(--brand,#2C4A68)}
.sn-pt{fill:var(--brand,#2C4A68);stroke:var(--surface,#fff);stroke-width:2.5}
.sn-pt.ok{fill:var(--ok,#0A7D4B)}
.sn-pt.bad{fill:var(--bad,#B42318)}
.sn-given{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733);stroke-width:2}
.sn-glyph{fill:var(--surface,#fff);font:800 11px system-ui,sans-serif;text-anchor:middle;dominant-baseline:central}
.sn-ghost{fill:none;stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:3 3}
.sn-cur{fill:none;stroke:var(--ink,#1B2733);stroke-width:3}
.sn-curh{fill:none;stroke:var(--sun,#F0BD4F);stroke-width:7}
.sn-mirror{stroke:var(--sun,#F0BD4F);stroke-width:4;stroke-dasharray:5 4;opacity:.95}
.sn-arc{fill:none;stroke:var(--ok,#0A7D4B);stroke-width:2.5;stroke-dasharray:6 5}
.sn-stem{stroke:var(--brand-line,#BBCADA);stroke-width:1.5}
.sn-bank{display:flex;flex-wrap:wrap;gap:8px}
.sn-tile{appearance:none;font:inherit;font-weight:800;font-size:1.1rem;min-width:64px;min-height:52px;padding:6px 14px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--ink,#1B2733);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}
.sn-tile:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.sn-tile.on{background:var(--brand-tint,#E5ECF3);border-style:dashed;color:var(--brand,#2C4A68)}
.sn-tile b{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;border-radius:50%;background:var(--brand,#2C4A68);color:var(--surface,#fff);font-size:.8rem}
.sn-bar,.sn-pad{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
.sn-pad[hidden]{display:none}
.sn-btn{appearance:none;font:inherit;font-weight:800;min-height:48px;min-width:48px;padding:8px 18px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--brand,#2C4A68);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}
.sn-btn:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.sn-btn.go,.sn-btn.go:hover:not([disabled]){background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.sn-btn.go:hover:not([disabled]){filter:brightness(.88)}
.sn-btn[disabled]{opacity:.5;cursor:not-allowed}
.sn-btn .es-text,.sn-tile .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.sn-note:empty{display:none}
.sn-note{margin:0;font-weight:700}
.sn-ok{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;border:2px solid var(--ok,#0A7D4B);color:color-mix(in srgb,var(--ok,#0A7D4B) 55%,var(--ink,#1B2733));background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff));font-weight:800}
@media (prefers-reduced-motion:no-preference){
.sn-anim .sn-arc{stroke-dasharray:700;animation:sn-draw .9s ease-out both}
.sn-anim .sn-pt.fin{transform-box:fill-box;transform-origin:center;animation:sn-pop .35s .7s ease-out both}
.sn-anim .sn-mirror{animation:sn-flash .9s ease-out both}
.sn-pt.new{transform-box:fill-box;transform-origin:center;animation:sn-pop .2s ease-out}
@keyframes sn-draw{from{stroke-dashoffset:700}to{stroke-dashoffset:0}}
@keyframes sn-pop{from{transform:scale(.3);opacity:.2}to{transform:scale(1);opacity:1}}
@keyframes sn-flash{0%,100%{opacity:.95}50%{opacity:.3}}}
@media (forced-colors:active){.sn-pt{fill:Highlight;stroke:Canvas}.sn-given{fill:Canvas;stroke:CanvasText}.sn-base,.sn-tick,.sn-arc,.sn-mirror,.sn-cur{stroke:CanvasText}.sn-lab,.sn-arrow{fill:CanvasText}.sn-glyph{fill:Canvas}.sn-btn,.sn-tile{border-color:ButtonText}}
`;
  const r1 = (/** @type {number} */ n) => Math.round(n * 10) / 10;
  /** @type {{key: string, t: number}} */
  let lastSolved = { key: "", t: 0 };

  function mountNline(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("nline", CSS);
    const ln = spec.line;
    const mode = spec.mode;
    const isOrder = mode === "order";
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const T = (/** @type {string} */ en, /** @type {string} */ esT) => A.t(en, esT);
    const key = `${spec.kind}|${spec.level}|${spec.seed}|${mode}|${spec.q}`;
    const reduced = !!(
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
    let solved = !!api.solved;
    let animate =
      solved &&
      mode === "opposite" &&
      lastSolved.key === key &&
      Date.now() - lastSolved.t < 4000 &&
      !reduced;
    const saved = api.restore || {};
    /** @type {number[]} */
    let pts = isOrder ? [] : (saved.pts || []).map(Number);
    /** @type {number[]} */
    let seq = isOrder ? (saved.seq || []).map(Number) : [];
    let cur = 0;
    /** @type {number|null} */
    let ghost = null;
    /** @type {boolean[]|null} */
    let marks = null;
    let showCur = false;
    let fresh = -1;
    /** @type {any} */
    let down = null;
    let geo = { W: 0, ML: 0, pw: 1, ts: 1 };
    const n = ticks(ln);

    host.textContent = "";
    const root = A.el("div", `sn${solved ? " sn-solved" : ""}${animate ? " sn-anim" : ""}`);
    const helpId = `sn-help-${Math.random().toString(36).slice(2, 8)}`;
    const bank = A.el("div", "sn-bank", "", { role: "group" });
    const lineEl = A.el("div", "sn-line", "", { tabindex: solved || isOrder ? "-1" : "0" });
    const help = A.el("p", "sn-sr", "", { id: helpId });
    const pad = A.el("div", "sn-pad");
    const note = A.el("p", "sn-note");
    const bar = A.el("div", "sn-bar");
    const checkBtn = A.el("button", "sn-btn go", T("Check", "Comprobar"), { type: "button" });
    const clearBtn = A.el(
      "button",
      "sn-btn",
      T(isOrder ? "Start over" : "Clear points", isOrder ? "Empezar de nuevo" : "Borrar puntos"),
      { type: "button" },
    );
    const badge = A.el("span", "sn-ok", `✓ ${T("Solved", "Resuelto")}`);
    const mkPad = (
      /** @type {string} */ k,
      /** @type {string} */ g,
      /** @type {string} */ en,
      /** @type {string} */ esT,
    ) => {
      const b = A.el("button", "sn-btn", g, { type: "button", "data-k": k });
      b.dataset.en = en;
      b.dataset.es = esT;
      return b;
    };
    const pads = [
      mkPad("left", "←", "Move cursor left one tick", "Mover el cursor una marca a la izquierda"),
      mkPad("right", "→", "Move cursor right one tick", "Mover el cursor una marca a la derecha"),
    ];
    const placeBtn = A.el("button", "sn-btn", T("Place or remove", "Poner o quitar"), {
      type: "button",
      "data-k": "place",
    });
    pad.append(...pads, placeBtn);
    bar.append(solved ? badge : checkBtn, ...(solved ? [] : [clearBtn]));
    if (isOrder) root.append(bank);
    root.append(lineEl, help, ...(solved || isOrder ? [] : [pad]), ...(solved ? [] : [note]), bar);
    host.append(root);

    const itemText = (/** @type {number} */ i) => spec.items[i].t;
    function buildBank() {
      bank.textContent = "";
      spec.items.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
        const pos = seq.indexOf(i);
        const b = A.el("button", `sn-tile${pos >= 0 ? " on" : ""}`, "", {
          type: "button",
          "data-i": String(i),
        });
        if (pos >= 0) b.append(A.el("b", "", String(pos + 1)));
        b.append(document.createTextNode(it.t));
        b.disabled = solved;
        b.setAttribute("aria-pressed", String(pos >= 0));
        b.setAttribute(
          "aria-label",
          pos >= 0
            ? L(
                `${it.t}, number ${pos + 1}. Tap to take it and the later numbers back.`,
                `${it.t}, número ${pos + 1}. Toca para quitarlo a él y a los siguientes.`,
              )
            : L(
                `${it.t}. Tap to drop it on the number line.`,
                `${it.t}. Toca para soltarlo en la recta numérica.`,
              ),
        );
        bank.append(b);
      });
    }
    const labels = () => {
      lineEl.setAttribute("role", solved || isOrder ? "img" : "application");
      lineEl.setAttribute(
        "aria-label",
        isOrder
          ? L(
              `Number line from ${mn(ln.min)} to ${mn(ln.max)}. Tapped numbers drop onto it.`,
              `Recta numérica de ${mn(ln.min)} a ${mn(ln.max)}. Los números que toques caen sobre ella.`,
            )
          : solved
            ? L(
                `Number line with the answer ${pts.map((v) => show(v, ln)).join(" and ")}.`,
                `Recta numérica con la respuesta ${pts.map((v) => show(v, ln)).join(" y ")}.`,
              )
            : L(
                "Number line. Use the left and right arrow keys to move the cursor one tick. Press Enter or Space to place or remove a point.",
                "Recta numérica. Usa las flechas izquierda y derecha para mover el cursor una marca. Presiona Enter o Espacio para poner o quitar un punto.",
              ),
      );
      lineEl.setAttribute("aria-describedby", helpId);
      help.textContent = L(
        `The line runs from ${mn(ln.min)} to ${mn(ln.max)}. Each tick is ${show(ln.step, ln)}. Only some ticks have labels. ${spec.given && spec.given.length ? `The shown number is ${spec.given[0].t}.` : ""}`,
        `La recta va de ${mn(ln.min)} a ${mn(ln.max)}. Cada marca vale ${show(ln.step, ln)}. Solo algunas marcas tienen número. ${spec.given && spec.given.length ? `El número mostrado es ${spec.given[0].t}.` : ""}`,
      );
      for (const b of pads) b.setAttribute("aria-label", L(b.dataset.en, b.dataset.es));
      placeBtn.setAttribute(
        "aria-label",
        L("Place or remove a point at the cursor", "Poner o quitar un punto en el cursor"),
      );
      if (isOrder) buildBank();
    };

    function draw() {
      const Wd = Math.max(
        260,
        Math.min(620, Math.round(lineEl.clientWidth || host.clientWidth || 340)),
      );
      const ML = 26;
      const pw = Wd - 2 * ML;
      const tall = mode === "opposite" || mode === "abs";
      const by = isOrder ? 92 : tall ? 70 : 46;
      const H = by + 44;
      geo = { W: Wd, ML, pw, ts: pw / n };
      const X = (/** @type {number} */ v) => r1(ML + ((v - ln.min) / (ln.max - ln.min)) * pw);
      const s = [];
      const rows = [];
      const zeroLine = mode === "opposite" || (mode === "abs" && spec.center === 0);
      if (zeroLine)
        s.push(
          `<line class="sn-mirror" x1="${X(0)}" y1="${by - 56}" x2="${X(0)}" y2="${by + 12}"/>`,
        );
      s.push(
        `<line class="sn-base" x1="${ML - 14}" y1="${by}" x2="${Wd - ML + 14}" y2="${by}"/><path class="sn-arrow" d="M${ML - 20} ${by} l10 -5 v10z M${Wd - ML + 20} ${by} l-10 -5 v10z"/>`,
      );
      for (let k = 0; k <= n; k++) {
        const v = valAt(ln, k);
        const lab = onLab(ln, v);
        const h = lab ? 9 : ln.fmt === "int" && ln.step === 1 ? 6 : 5;
        s.push(
          `<line class="sn-tick${lab ? "" : " sub"}" x1="${X(v)}" y1="${by - h}" x2="${X(v)}" y2="${by + h}"/>`,
        );
        if (lab) s.push(`<text class="sn-lab" x="${X(v)}" y="${by + 28}">${show(v, ln)}</text>`);
      }
      const mark = (/** @type {number} */ i) =>
        solved ? "ok" : marks ? (marks[i] ? "ok" : "bad") : "";
      const glyph = (/** @type {number} */ x, /** @type {string} */ m) =>
        m ? `<text class="sn-glyph" x="${x}" y="${by}">${m === "ok" ? "✓" : "✕"}</text>` : "";
      if (isOrder) {
        const placed = seq.map((i) => ({ i, v: spec.items[i].v }));
        placed.forEach((q, pos) => {
          const x = X(q.v);
          let row = 0;
          while (rows[row] && rows[row].some((/** @type {number} */ px) => Math.abs(px - x) < 40))
            row++;
          (rows[row] = rows[row] || []).push(x);
          const ly = by - 26 - row * 20;
          const m = mark(pos);
          s.push(
            `<line class="sn-stem" x1="${x}" y1="${by}" x2="${x}" y2="${ly + 4}"/><text class="sn-lab big" x="${x}" y="${ly}">${itemText(q.i)}</text>`,
          );
          s.push(
            `<circle class="sn-pt ${m}${pos === fresh ? " new" : ""}" cx="${x}" cy="${by}" r="11"/>${m ? glyph(x, m) : `<text class="sn-glyph" x="${x}" y="${by}">${pos + 1}</text>`}`,
          );
        });
      } else {
        const g0 = (spec.given || [])[0];
        if (solved && mode === "opposite" && g0) {
          const x1 = X(g0.v);
          const x2 = X(spec.want[0]);
          s.push(
            `<path class="sn-arc" d="M${x1} ${by - 12} Q${X(0)} ${by - 78} ${x2} ${by - 12}"/>`,
          );
        }
        if (solved && mode === "abs") {
          for (const w of spec.want) {
            const x1 = X(spec.center);
            const x2 = X(w);
            s.push(
              `<path class="sn-arc" d="M${x1} ${by - 12} Q${r1((x1 + x2) / 2)} ${by - 54} ${x2} ${by - 12}"/><text class="sn-lab" x="${r1((x1 + x2) / 2)}" y="${by - 40}">${spec.distT}</text>`,
            );
          }
        }
        for (const q of spec.given || []) {
          const x = X(q.v);
          s.push(
            `<path class="sn-given" d="M${x} ${by - 11} L${x + 11} ${by} L${x} ${by + 11} L${x - 11} ${by}Z"/><text class="sn-lab big" x="${x}" y="${by - 20}">${q.t}</text>`,
          );
        }
        pts.forEach((v, i) => {
          const x = X(v);
          const m = mark(i);
          s.push(
            `<circle class="sn-pt ${m}${i === fresh ? " new" : ""}${solved ? " fin" : ""}" cx="${x}" cy="${by}" r="10"/>${glyph(x, m)}`,
          );
          if (solved && mode !== "abs" && mode !== "opposite")
            s.push(`<text class="sn-lab big" x="${x}" y="${by - 20}">${show(v, ln)}</text>`);
          if (solved && mode === "opposite")
            s.push(`<text class="sn-lab big" x="${x}" y="${by - 20}">${show(v, ln)}</text>`);
        });
        if (!solved && ghost !== null)
          s.push(`<circle class="sn-ghost" cx="${X(ghost)}" cy="${by}" r="10"/>`);
        if (!solved && showCur)
          s.push(
            `<circle class="sn-curh" cx="${X(valAt(ln, cur))}" cy="${by}" r="16"/><circle class="sn-cur" cx="${X(valAt(ln, cur))}" cy="${by}" r="16"/>`,
          );
      }
      lineEl.innerHTML = `<svg viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}" aria-hidden="true" focusable="false">${s.join("")}</svg>`;
      pad.hidden = !(
        geo.ts < 28 ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches)
      );
      const have = isOrder ? seq.length : pts.length;
      checkBtn.disabled = !have;
      clearBtn.disabled = !have;
      fresh = -1;
    }

    const kOf = (/** @type {any} */ ev) => {
      const r = lineEl.getBoundingClientRect();
      const px = ((ev.clientX - r.left - lineEl.clientLeft) * geo.W) / lineEl.clientWidth;
      return Math.max(0, Math.min(n, Math.round(((px - geo.ML) / geo.pw) * n)));
    };
    const say = (/** @type {string} */ en, /** @type {string} */ esT) =>
      api.say && api.say(L(en, esT));
    const emit = () =>
      api.change && api.change(isOrder ? { seq: seq.slice() } : { pts: pts.slice() });
    function toggle(/** @type {number} */ k) {
      const v = valAt(ln, k);
      marks = null;
      note.textContent = "";
      const i = pts.findIndex((q) => near(q, v));
      if (i >= 0) {
        pts.splice(i, 1);
        say(`Point removed at ${show(v, ln)}`, `Punto quitado en ${show(v, ln)}`);
      } else if (spec.cap === 1) {
        pts = [v];
        fresh = 0;
        say(`Point placed at ${show(v, ln)}`, `Punto puesto en ${show(v, ln)}`);
      } else if (pts.length >= spec.cap) {
        note.append(
          A.el(
            "span",
            "",
            T(
              `You have all ${spec.cap} points. Tap a point to take it off.`,
              `Ya tienes los ${spec.cap} puntos. Toca un punto para quitarlo.`,
            ),
          ),
        );
        say(
          `You have all ${spec.cap} points. Remove one first.`,
          `Ya tienes los ${spec.cap} puntos. Quita uno primero.`,
        );
        return;
      } else {
        pts.push(v);
        fresh = pts.length - 1;
        say(`Point placed at ${show(v, ln)}`, `Punto puesto en ${show(v, ln)}`);
      }
      emit();
      draw();
    }
    function tap(/** @type {number} */ i) {
      marks = null;
      const pos = seq.indexOf(i);
      if (pos >= 0) {
        seq = seq.slice(0, pos);
        say(`${itemText(i)} taken back`, `${itemText(i)} devuelto`);
      } else {
        seq.push(i);
        fresh = seq.length - 1;
        say(
          `${itemText(i)} dropped on the line as number ${seq.length}`,
          `${itemText(i)} cae en la recta como número ${seq.length}`,
        );
      }
      emit();
      buildBank();
      draw();
    }

    function check() {
      const have = isOrder ? seq.length : pts.length;
      if (solved || !have) return;
      const state = isOrder ? { seq: seq.slice() } : { pts: pts.slice() };
      const local = A.registry.nline.grade(spec, state);
      if (local.ok) lastSolved = { key, t: Date.now() };
      const out = api.submit && api.submit(state);
      if (!root.isConnected) return;
      const res = out && typeof out === "object" && typeof out.ok === "boolean" ? out : local;
      if (res.ok) {
        solved = true;
        animate = !reduced && mode === "opposite";
        marks = null;
        root.classList.add("sn-solved");
        if (animate) root.classList.add("sn-anim");
        bar.textContent = "";
        bar.append(badge);
        pad.remove();
        note.remove();
        lineEl.setAttribute("tabindex", "-1");
        labels();
        say("Correct", "Correcto");
      } else {
        marks = isOrder ? seq.map((v, i) => v === spec.want[i]) : pts.map((v) => has(spec.want, v));
        say(res.say || "Not yet", res.sayEs || res.say || "Todavía no");
      }
      draw();
    }

    const move = (/** @type {number} */ dk) => {
      cur = Math.max(0, Math.min(n, cur + dk));
      showCur = true;
      ghost = null;
      say(show(valAt(ln, cur), ln), show(valAt(ln, cur), ln));
      draw();
    };

    if (!solved) {
      if (isOrder) {
        bank.addEventListener("click", (e) => {
          const b = /** @type {any} */ (e.target).closest("[data-i]");
          if (b) tap(Number(b.dataset.i));
        });
        clearBtn.addEventListener("click", () => {
          seq = [];
          marks = null;
          emit();
          say("Started over", "Empezar de nuevo");
          buildBank();
          draw();
        });
      } else {
        cur = Math.round(-ln.min / ln.step);
        const labStep = Math.max(1, Math.round(ln.lab / ln.step));
        lineEl.addEventListener("keydown", (e) => {
          const d = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowDown: -1,
            ArrowUp: 1,
            PageDown: -labStep,
            PageUp: labStep,
          }[e.key];
          if (d) {
            e.preventDefault();
            move(d);
          } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            cur = e.key === "Home" ? 0 : n;
            move(0);
          } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle(cur);
          }
        });
        lineEl.addEventListener("focus", () => {
          showCur = true;
          draw();
        });
        lineEl.addEventListener("pointerdown", (e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          lineEl.focus({ preventScroll: true });
          down = e.pointerId;
          cur = kOf(e);
          ghost = valAt(ln, cur);
          showCur = true;
          draw();
        });
        lineEl.addEventListener("pointermove", (e) => {
          if (down === null && e.pointerType !== "mouse") return;
          const k = kOf(e);
          if (ghost === null || !near(ghost, valAt(ln, k))) {
            ghost = valAt(ln, k);
            if (down !== null) cur = k;
            draw();
          }
        });
        lineEl.addEventListener("pointerup", (e) => {
          if (down === null) return;
          down = null;
          cur = kOf(e);
          ghost = e.pointerType === "mouse" ? valAt(ln, cur) : null;
          toggle(cur);
        });
        const drop = () => {
          down = null;
          if (ghost !== null) {
            ghost = null;
            draw();
          }
        };
        lineEl.addEventListener("pointercancel", drop);
        lineEl.addEventListener("pointerleave", drop);
        pad.addEventListener("click", (e) => {
          const k = /** @type {any} */ (e.target).closest("[data-k]");
          if (!k) return;
          if (k.dataset.k === "place") toggle(cur);
          else move(k.dataset.k === "left" ? -1 : 1);
        });
        clearBtn.addEventListener("click", () => {
          pts = [];
          marks = null;
          note.textContent = "";
          emit();
          say("Points cleared", "Puntos borrados");
          draw();
          lineEl.focus({ preventScroll: true });
        });
        root.addEventListener("focusout", (e) => {
          if (!root.contains(e.relatedTarget)) {
            showCur = false;
            draw();
          }
        });
      }
      checkBtn.addEventListener("click", check);
    }

    labels();
    draw();
    if (typeof ResizeObserver !== "undefined") {
      let last = lineEl.clientWidth;
      const ro = new ResizeObserver(() => {
        if (!root.isConnected) return ro.disconnect();
        if (Math.abs(lineEl.clientWidth - last) > 3) {
          last = lineEl.clientWidth;
          draw();
        }
      });
      ro.observe(lineEl);
    }
    if (typeof MutationObserver !== "undefined") {
      const mo = new MutationObserver(() => {
        if (!root.isConnected) return mo.disconnect();
        labels();
        draw();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
  }

  A.register("nline", {
    title: "Number line",
    titleEs: "Recta numérica",
    levels: 4,
    make(rng, level, params) {
      const mode = MODES.includes(params.mode) ? params.mode : rng.pick(MODES);
      const s = { place: mkPlace, order: mkOrder, opposite: mkOpposite, abs: mkAbs }[mode](
        rng,
        level,
        params,
      );
      const cap = s.cap || s.want.length;
      const model =
        (s.mode || mode) === "order"
          ? { mode, items: s.items.map((/** @type {any} */ q) => q.t), desc: s.desc }
          : { mode, want: s.want, given: s.given, line: s.line };
      return { ...s, mode: s.mode || mode, cap, model };
    },
    solution: (spec) =>
      spec.mode === "order" ? { seq: spec.want.slice() } : { pts: spec.want.slice() },
    wrong: wrongNl,
    grade: gradeNl,
    mount: mountNline,
  });
})();
