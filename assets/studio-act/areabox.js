/**
 * Practice Studio activity: areabox (window.StudioAct kind "areabox").
 * mode "decimal": shade a 10 x 10 grid of hundredths to model a decimal product, then type it.
 * mode "distribute": split a rectangle in two to model a(b + c) = ab + ac, then fill the areas (or write the terms).
 * State: decimal { c, r, p } (c and r are tenths across and down, p is the typed product);
 *        distribute numbers { s, p1, p2, t }; distribute with a variable { t1, t2, t }.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const fm = (/** @type {number} */ n) => G.fmt(n, 4);
  const val = (/** @type {any} */ s) => G.value(String(s ?? ""));
  const same = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 1e-9;
  const blank = (/** @type {any} */ s) => String(s ?? "").trim() === "";
  const dec = (/** @type {number} */ tenths) => fm(tenths / 10);

  const THINGS = [
    ["A quilt block", "Un bloque de colcha"],
    ["A floor tile", "Una baldosa"],
    ["A garden plot", "Un terreno de jardín"],
    ["A poster", "Un cartel"],
    ["A sheet of stickers", "Una hoja de calcomanías"],
    ["A baking tray", "Una bandeja de hornear"],
  ];
  const OBJ = [
    ["rug", "alfombra", "A"],
    ["banner", "pancarta", "A"],
    ["garden bed", "cantero", "A"],
    ["poster", "cartel", "A"],
    ["stage floor", "piso del escenario", "A"],
    ["mat", "tapete", "A"],
  ];
  const VARS = ["x", "n", "y"];

  /* ---- the tasks ------------------------------------------------------------------------------ */
  function makeDecimal(/** @type {any} */ rng, /** @type {number} */ level) {
    const tenth = (/** @type {number} */ lo, /** @type {number} */ hi) => rng.int(lo, hi);
    let c = 0;
    let r = 0;
    let gx = 1;
    let gy = 1;
    for (let t = 0; t < 99 && (c === 0 || (c === 1 && r === 1)); t++) {
      if (level === 1) {
        c = tenth(1, 5);
        r = tenth(1, 5);
      } else if (level === 2) {
        c = tenth(2, 9);
        r = tenth(2, 9);
      } else if (level === 3) {
        c = tenth(11, 19);
        r = tenth(2, 9);
        gx = 2;
      } else {
        c = tenth(11, 19);
        r = tenth(11, 19);
        gx = 2;
        gy = 2;
      }
    }
    const swap = level === 3 && rng.chance(0.5);
    const first = swap ? r : c;
    const second = swap ? c : r;
    const th = rng.pick(THINGS);
    const prod = (c * r) / 100;
    const expr = `${dec(first)} × ${dec(second)}`;
    const many = gx * gy > 1;
    const q = `${many ? "Each 10 × 10 grid is one whole." : `${th[0]} is one whole, drawn as 100 equal squares.`} Shade the grid to model ${expr}, then type the product.`;
    const qEs = `${many ? "Cada cuadrícula de 10 × 10 es un entero." : `${th[1]} es un entero, dibujado como 100 cuadros iguales.`} Sombrea la cuadrícula para representar ${expr} y luego escribe el producto.`;
    const hund = c * r;
    return {
      q,
      qEs,
      x: `${expr} = ${fm(prod)}. ${c} ${c === 1 ? "tenth" : "tenths"} × ${r} ${r === 1 ? "tenth" : "tenths"} = ${hund} ${hund === 1 ? "hundredth" : "hundredths"}, and ${hund} hundredths is written ${fm(prod)}. Tenths times tenths give hundredths.`,
      xEs: `${expr} = ${fm(prod)}. ${c} ${c === 1 ? "décimo" : "décimos"} × ${r} ${r === 1 ? "décimo" : "décimos"} = ${hund} ${hund === 1 ? "centésimo" : "centésimos"}, y ${hund} centésimos se escribe ${fm(prod)}. Décimos por décimos dan centésimos.`,
      h: [
        "Each small square is one hundredth. Shade tenths across and tenths down.",
        "The product is the part where the two shaded bands overlap. Count the small squares in the overlap.",
        "Write that many hundredths as a decimal. Hundredths sit in the second place after the decimal point.",
      ],
      hEs: [
        "Cada cuadro pequeño es un centésimo. Sombrea décimos a lo ancho y décimos a lo alto.",
        "El producto es la parte donde se cruzan las dos franjas sombreadas. Cuenta los cuadros pequeños de esa parte.",
        "Escribe esa cantidad de centésimos como decimal. Los centésimos van en el segundo lugar después del punto decimal.",
      ],
      model: { mode: "decimal", c, r, gx, gy, expr, hund, prod: fm(prod), th: th[0] },
    };
  }

  function makeDistribute(/** @type {any} */ rng, /** @type {number} */ level) {
    const o = rng.pick(OBJ);
    const v = rng.pick(VARS);
    if (level <= 2) {
      let a = rng.int(2, 9);
      let b = rng.int(2, 9);
      let c = rng.int(2, 9);
      let friendly = 0;
      if (level === 2) {
        b = 10;
        c = rng.int(2, 9);
        a = rng.int(3, 9);
        friendly = 10;
      } else {
        if (b + c > 12) c = Math.max(2, 12 - b);
        if (c === b) c = b === 2 ? 3 : b - 1;
      }
      const n = b + c;
      const flip = rng.chance(0.5);
      const left = flip && !friendly ? c : b;
      const right = flip && !friendly ? b : c;
      const q = friendly
        ? `A ${o[0]} is ${a} units tall and ${n} units wide. Split the width so one part is exactly ${friendly}, then find each area and the whole area.`
        : `A ${o[0]} is ${a} units tall and ${n} units wide. Split the width into ${left} and ${right}, then find each area and the whole area.`;
      const qEs = friendly
        ? `Una ${o[1]} mide ${a} unidades de alto y ${n} de ancho. Divide el ancho para que una parte mida exactamente ${friendly} y halla cada área y el área total.`
        : `Una ${o[1]} mide ${a} unidades de alto y ${n} de ancho. Divide el ancho en ${left} y ${right} y halla cada área y el área total.`;
      return {
        q,
        qEs,
        x: `${a}(${left} + ${right}) = ${a} × ${left} + ${a} × ${right} = ${a * left} + ${a * right} = ${a * n}. Two smaller rectangles fit together to make the whole one, so their areas add.`,
        xEs: `${a}(${left} + ${right}) = ${a} × ${left} + ${a} × ${right} = ${a * left} + ${a * right} = ${a * n}. Dos rectángulos más pequeños forman el grande, así que sus áreas se suman.`,
        h: [
          "Each part is a rectangle. Its area is height × its own width.",
          "Find the area of the left part, then the right part. Use the same height for both.",
          "The whole rectangle is the two parts put together. Add the two part areas.",
        ],
        hEs: [
          "Cada parte es un rectángulo. Su área es la altura × su propio ancho.",
          "Halla el área de la parte izquierda y luego la de la derecha. Usa la misma altura en las dos.",
          "El rectángulo completo es la unión de las dos partes. Suma las áreas de las dos partes.",
        ],
        model: { mode: "distribute", form: "num", a, b: left, c: right, n, friendly },
      };
    }
    const a = rng.int(2, 9);
    const p = level === 3 ? 1 : rng.int(2, 3);
    const k = rng.int(2, 9);
    const wd = `${p === 1 ? "" : p}${v}`;
    return {
      q: `A ${o[0]} is ${a} units tall and (${wd} + ${k}) units wide. Write the area of each part, then the whole area.`,
      qEs: `Una ${o[1]} mide ${a} unidades de alto y (${wd} + ${k}) de ancho. Escribe el área de cada parte y luego el área total.`,
      x: `${a}(${wd} + ${k}) = ${a * p === 1 ? "" : a * p}${v} + ${a * k}. The ${a} multiplies each part of the width, then the two areas are added.`,
      xEs: `${a}(${wd} + ${k}) = ${a * p === 1 ? "" : a * p}${v} + ${a * k}. El ${a} multiplica cada parte del ancho y luego se suman las dos áreas.`,
      h: [
        "Each part is a rectangle with the same height. Its area is height × its width.",
        `The left part is ${wd} wide, so its area still has ${v} in it. The right part is a plain number.`,
        "The whole area is the two part areas added. Do not add them to the height.",
      ],
      hEs: [
        "Cada parte es un rectángulo con la misma altura. Su área es la altura × su ancho.",
        `La parte izquierda mide ${wd} de ancho, así que su área todavía lleva ${v}. La parte derecha es un número.`,
        "El área total es la suma de las dos áreas. No las sumes con la altura.",
      ],
      model: { mode: "distribute", form: "var", a, p, k, v },
    };
  }

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode =
      params.mode === "decimal" || params.mode === "distribute"
        ? params.mode
        : rng.pick(["decimal", "distribute"]);
    return mode === "decimal" ? makeDecimal(rng, level) : makeDistribute(rng, level);
  }

  /* ---- grading -------------------------------------------------------------------------------- */
  /** A typed term like 4x, 4*x, x*4 or 12 -> { v: coefficient of the variable, k: constant } or null. */
  function term(/** @type {any} */ raw, /** @type {string} */ v) {
    const t = String(raw ?? "")
      .replace(/\s+/g, "")
      .replace(/[×·*]/g, "*")
      .toLowerCase();
    if (!t) return null;
    let m = t.match(/^(\d+(?:\.\d+)?)$/);
    if (m) return { v: 0, k: Number(m[1]) };
    m = t.match(new RegExp(`^(\\d+(?:\\.\\d+)?)?\\*?${v}$`));
    if (m) return { v: m[1] ? Number(m[1]) : 1, k: 0 };
    m = t.match(new RegExp(`^${v}\\*(\\d+(?:\\.\\d+)?)$`));
    if (m) return { v: Number(m[1]), k: 0 };
    return null;
  }
  function sumOf(/** @type {any} */ raw, /** @type {string} */ v) {
    const parts = String(raw ?? "").split("+");
    let out = { v: 0, k: 0 };
    for (const p of parts) {
      const t = term(p, v);
      if (!t) return null;
      out = { v: out.v + t.v, k: out.k + t.k };
    }
    return out;
  }
  const bad = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });

  function gradeDecimal(/** @type {any} */ m, /** @type {any} */ st) {
    const modelOk = (st.c === m.c && st.r === m.r) || (st.c === m.r && st.r === m.c);
    if (!modelOk) {
      const moved = !(st.c === 1 && st.r === 1);
      return moved
        ? bad(
            "model",
            `The grid does not show ${m.expr} yet. Set the width and the height to the two factors.`,
            `La cuadrícula todavía no muestra ${m.expr}. Pon el ancho y el alto en los dos factores.`,
          )
        : bad(
            "untouched",
            `Shade the grid first. Drag the corner or use the buttons to set ${m.expr}.`,
            `Primero sombrea la cuadrícula. Arrastra la esquina o usa los botones para representar ${m.expr}.`,
          );
    }
    if (blank(st.p))
      return bad("empty", "Type the product in the box.", "Escribe el producto en el casillero.");
    const typed = val(st.p);
    const want = m.hund / 100;
    if (same(typed, want)) return { ok: true };
    if (Number.isNaN(typed))
      return bad(
        "format",
        "Type the product as a number, like 0.35.",
        "Escribe el producto como un número, como 0.35.",
      );
    if (same(typed, m.hund))
      return bad(
        "count-only",
        `${st.p} is the number of shaded squares. Each square is one hundredth, so write that count as a part of one whole.`,
        `${st.p} es la cantidad de cuadros sombreados. Cada cuadro es un centésimo, así que escribe esa cantidad como parte de un entero.`,
      );
    if (same(typed, want * 10))
      return bad(
        "tenths-slip",
        `${st.p} means tenths, but a tenth is a whole column of ten squares. Your count is in hundredths, which sit one place farther right.`,
        `${st.p} significa décimos, pero un décimo es una columna entera de diez cuadros. Tu conteo es en centésimos, que van un lugar más a la derecha.`,
      );
    if (same(typed, want / 10))
      return bad(
        "too-small",
        `${st.p} is thousandths, which is too small. Look again at how many hundredths are in the overlap.`,
        `${st.p} son milésimos, es demasiado pequeño. Mira otra vez cuántos centésimos hay en la parte de cruce.`,
      );
    if (same(typed, (m.c + m.r) / 10))
      return bad(
        "added",
        "You added the two factors. The product is the overlap of the two bands, not their total.",
        "Sumaste los dos factores. El producto es la parte de cruce de las dos franjas, no su total.",
      );
    return bad(
      "miscount",
      "Count the squares in the overlap again, then write that many hundredths as a decimal.",
      "Cuenta otra vez los cuadros de la parte de cruce y escribe esa cantidad de centésimos como decimal.",
    );
  }

  function gradeNum(/** @type {any} */ m, /** @type {any} */ st) {
    const s = Number(st.s);
    const goodSplit = m.friendly
      ? s === m.friendly || m.n - s === m.friendly
      : s === m.b || s === m.c;
    if (!goodSplit)
      return bad(
        "split",
        m.friendly
          ? `Move the divider so one part is exactly ${m.friendly} wide.`
          : `Move the divider so the two parts match the numbers in the problem.`,
        m.friendly
          ? `Mueve la línea para que una parte mida exactamente ${m.friendly} de ancho.`
          : "Mueve la línea para que las dos partes coincidan con los números del problema.",
      );
    if (blank(st.p1) || blank(st.p2) || blank(st.t))
      return bad(
        "empty",
        "Fill in both part areas and the whole area.",
        "Completa las dos áreas de las partes y el área total.",
      );
    const w1 = s;
    const w2 = m.n - s;
    const partCheck = (
      /** @type {string} */ raw,
      /** @type {number} */ w,
      /** @type {number} */ other,
      /** @type {string} */ side,
      /** @type {string} */ sideEs,
    ) => {
      const t = val(raw);
      if (same(t, m.a * w)) return null;
      if (same(t, m.a + w))
        return bad(
          "added",
          `The ${side} part: you added. The area of a rectangle is its height × its width.`,
          `En la parte ${sideEs}: sumaste. El área de un rectángulo es su altura × su ancho.`,
        );
      if (same(t, w))
        return bad(
          "width-only",
          `The ${side} part: that is only the width. Multiply by the height too.`,
          `En la parte ${sideEs}: eso es solo el ancho. Multiplica también por la altura.`,
        );
      if (same(t, m.a * other))
        return bad(
          "swapped",
          `The ${side} part has the wrong area. Check which width belongs to this part.`,
          `La parte ${sideEs} tiene un área incorrecta. Revisa qué ancho le toca a esta parte.`,
        );
      return bad(
        "part",
        `Check the ${side} part: its area is the height times its own width.`,
        `Revisa la parte ${sideEs}: su área es la altura por su propio ancho.`,
      );
    };
    const e1 = partCheck(st.p1, w1, w2, "left", "izquierda");
    if (e1) return e1;
    const e2 = partCheck(st.p2, w2, w1, "right", "derecha");
    if (e2) return e2;
    const t = val(st.t);
    if (same(t, m.a * m.n)) return { ok: true };
    if (same(t, m.a * w1 + w2))
      return bad(
        "forgot-second",
        "The whole is both parts together. Add the two part areas.",
        "El total son las dos partes juntas. Suma las áreas de las dos partes.",
      );
    if (same(t, m.a * w1 * (m.a * w2)))
      return bad(
        "multiplied",
        "Add the two part areas; do not multiply them.",
        "Suma las áreas de las dos partes; no las multipliques.",
      );
    return bad(
      "total",
      "The whole area is the left area plus the right area. Add them again.",
      "El área total es el área izquierda más la derecha. Súmalas otra vez.",
    );
  }

  function gradeVar(/** @type {any} */ m, /** @type {any} */ st) {
    const t1 = term(st.t1, m.v);
    const t2 = term(st.t2, m.v);
    const tot = sumOf(st.t, m.v);
    const c1 = m.a * m.p;
    const c2 = m.a * m.k;
    if (blank(st.t1) || blank(st.t2) || blank(st.t))
      return bad(
        "empty",
        `Write both part areas and the whole area. Use terms like 3${m.v} or 12.`,
        `Escribe las dos áreas de las partes y el área total. Usa términos como 3${m.v} o 12.`,
      );
    if (!t1 || t1.k !== 0 || t1.v === 0)
      return bad(
        "left-form",
        `The left part is ${m.p === 1 ? "" : m.p}${m.v} wide, so its area still has ${m.v} in it. Write it like 3${m.v}.`,
        `La parte izquierda mide ${m.p === 1 ? "" : m.p}${m.v} de ancho, así que su área todavía lleva ${m.v}. Escríbela como 3${m.v}.`,
      );
    if (t1.v !== c1) {
      const side = t1.v === m.p ? "forgot-height" : t1.v === m.a + m.p ? "added" : "left";
      return bad(
        side,
        side === "added"
          ? "Left part: you added. Area is height × width, so multiply."
          : `Left part: the ${m.a} multiplies the width of this part too.`,
        side === "added"
          ? "Parte izquierda: sumaste. El área es altura × ancho, así que multiplica."
          : `Parte izquierda: el ${m.a} también multiplica el ancho de esta parte.`,
      );
    }
    if (!t2 || t2.v !== 0)
      return bad(
        "right-form",
        "The right part is a plain number, so its area has no letter in it.",
        "La parte derecha es un número, así que su área no lleva letra.",
      );
    if (t2.k !== c2) {
      const side = t2.k === m.k ? "forgot-second" : t2.k === m.a + m.k ? "added" : "right";
      return bad(
        side,
        side === "added"
          ? "Right part: you added. Area is height × width, so multiply."
          : `The ${m.a} multiplies BOTH parts of the width. Check the right part.`,
        side === "added"
          ? "Parte derecha: sumaste. El área es altura × ancho, así que multiplica."
          : `El ${m.a} multiplica LAS DOS partes del ancho. Revisa la parte derecha.`,
      );
    }
    if (String(st.t).includes("("))
      return bad(
        "factored",
        "That is still the factored form. Write the whole area as the sum of the two part areas.",
        "Eso sigue en forma factorizada. Escribe el área total como la suma de las dos áreas.",
      );
    if (!tot || tot.v !== c1 || tot.k !== c2)
      return bad(
        "total",
        "The whole area is the left area plus the right area. Write them joined with a plus sign.",
        "El área total es el área izquierda más la derecha. Escríbelas unidas con un signo más.",
      );
    return { ok: true };
  }

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    st = st || {};
    if (m.mode === "decimal")
      return gradeDecimal(m, { c: Number(st.c ?? 1), r: Number(st.r ?? 1), p: st.p });
    return m.form === "num" ? gradeNum(m, { ...st, s: Number(st.s ?? 0) }) : gradeVar(m, st);
  }
  function solution(/** @type {any} */ spec) {
    const m = spec.model;
    if (m.mode === "decimal") return { c: m.c, r: m.r, p: m.prod };
    if (m.form === "var") {
      const c1 = m.a * m.p;
      const lead = c1 === 1 ? "" : String(c1);
      return { t1: `${lead}${m.v}`, t2: String(m.a * m.k), t: `${lead}${m.v} + ${m.a * m.k}` };
    }
    return { s: m.b, p1: String(m.a * m.b), p2: String(m.a * m.c), t: String(m.a * m.n) };
  }
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    const sol = solution(spec);
    /** @type {any[]} */
    let c;
    if (m.mode === "decimal")
      c = [
        { ...sol, p: String(m.hund) },
        { ...sol, p: fm(m.hund / 10) },
        { c: 1, r: 1, p: "" },
        { ...sol, c: m.c + 1, r: m.r },
        { ...sol, p: fm((m.c + m.r) / 10) },
      ];
    else if (m.form === "var") {
      const lead = m.a * m.p === 1 ? "" : String(m.a * m.p);
      c = [
        { ...sol, t1: `${m.p === 1 ? "" : m.p}${m.v}` },
        { ...sol, t2: String(m.k) },
        { t1: "", t2: "", t: "" },
        { ...sol, t: `${m.a}(${m.p === 1 ? "" : m.p}${m.v} + ${m.k})` },
        { ...sol, t: `${lead}${m.v} + ${m.k}` },
      ];
    } else
      c = [
        { ...sol, p1: String(m.a + m.b) },
        { ...sol, p1: String(m.b) },
        { ...sol, t: String(m.a * m.b + m.c) },
        { ...sol, s: 1 },
        { s: m.b, p1: "", p2: "", t: "" },
      ];
    return c.filter((st) => !grade(spec, st).ok);
  }

  /* ---- the widget ----------------------------------------------------------------------------- */
  const CSS = `
.ab{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;max-width:640px;color:var(--ink,#1B2733)}
.ab>*{min-width:0}
.ab-stage{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:8px}
.ab-stage svg{display:block;margin:0 auto;width:100%;height:auto;touch-action:none;user-select:none;-webkit-user-select:none}
.ab-cell{stroke:var(--border,#D5DCE5);stroke-width:1;fill:none}
.ab-edge{fill:var(--surface,#fff);stroke:var(--ink,#1B2733);stroke-width:2.5}
.ab-bc{fill:url(#ab-v)}
.ab-br{fill:url(#ab-h)}
.ab-ov{fill:color-mix(in srgb,var(--brand,#2C4A68) 70%,transparent);stroke:var(--ink,#1B2733);stroke-width:1.2}
.ab-done .ab-ov{fill:color-mix(in srgb,var(--ok,#0A7D4B) 70%,transparent)}
.ab-pa{stroke:var(--brand,#2C4A68);stroke-width:2;fill:none}
.ab-pb{stroke:var(--ink,#1B2733);stroke-width:2;fill:none}
.ab-handle{fill:var(--sun,#F0BD4F);stroke:var(--ink,#1B2733);stroke-width:3;cursor:grab}
.ab-hit{fill:transparent;cursor:grab}
.ab-t{fill:var(--ink,#1B2733);font:800 14px system-ui,sans-serif;text-anchor:middle;paint-order:stroke;stroke:var(--surface,#fff);stroke-width:4px}
.ab-l{fill:color-mix(in srgb,var(--brand,#2C4A68) 24%,transparent);stroke:var(--brand,#2C4A68);stroke-width:2}
.ab-r{fill:color-mix(in srgb,var(--sun,#F0BD4F) 45%,transparent);stroke:var(--ink,#1B2733);stroke-width:2}
.ab-un{fill:color-mix(in srgb,var(--brand,#2C4A68) 24%,transparent);stroke:var(--brand,#2C4A68);stroke-width:2;stroke-dasharray:7 4}
.ab-div{stroke:var(--ink,#1B2733);stroke-width:4}
.ab-ctl{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px}
.ab-row{display:grid;gap:4px;background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:8px 10px}
.ab-nm{font-weight:800;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.ab-nm .es-text{margin:0;font-size:.85em;font-weight:600}
.ab-st{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center}
.ab-v{text-align:center;font-size:1.5rem;font-weight:800;font-variant-numeric:tabular-nums;color:var(--brand,#2C4A68)}
.ab-btn{appearance:none;font:inherit;font-weight:800;min-height:48px;min-width:48px;padding:6px 16px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--brand,#2C4A68);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2}
.ab-btn:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.ab-btn.go{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.ab-btn[disabled]{opacity:.5;cursor:not-allowed}
.ab-btn[hidden]{display:none}
.ab-btn .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.ab-btn:focus-visible,.ab input:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.ab-read{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px 12px;display:grid;gap:4px;font-size:1.02rem}
.ab-read b{font-variant-numeric:tabular-nums}
.ab-big{font-size:1.25rem;font-weight:800;color:var(--brand,#2C4A68)}
.ab-eq{display:flex;flex-wrap:wrap;gap:8px 10px;align-items:center;font-size:1.15rem;font-weight:800}
.ab-eq .es-text{margin:0;font-size:.75em;font-weight:600}
.ab-blk{display:flex;flex-wrap:wrap;gap:6px;align-items:center;background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:8px 10px}
.ab-blk.l{border-left:10px solid var(--brand,#2C4A68)}
.ab-blk.r{border-left:10px solid var(--sun,#F0BD4F)}
.ab-in{font:inherit;font-size:1.3rem;font-weight:800;text-align:center;width:6.5em;min-height:48px;padding:4px 8px;border:3px solid var(--brand,#2C4A68);border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.ab-in[readonly]{border-color:var(--ok,#0A7D4B);background:color-mix(in srgb,var(--ok,#0A7D4B) 12%,var(--surface,#fff))}
.ab-bar{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.ab-fb{flex:1 1 220px;margin:0;padding:8px 12px 8px 44px;border-radius:var(--radius-md,14px);font-weight:700;position:relative;border:2px solid var(--bad,#B42318);background:color-mix(in srgb,var(--bad,#B42318) 12%,var(--surface,#fff))}
.ab-fb::before{content:"!";position:absolute;left:10px;top:8px;width:26px;height:26px;border-radius:50%;background:var(--bad,#B42318);color:#fff;font-weight:800;text-align:center;line-height:26px}
.ab-fb.ok{border-color:var(--ok,#0A7D4B);background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff))}
.ab-fb.ok::before{content:"\\2713";background:var(--ok,#0A7D4B)}
.ab-fb[hidden]{display:none}
.ab-fb .es-text{color:inherit;font-weight:600;margin-top:2px}
@media (prefers-reduced-motion:no-preference){.ab-fb{animation:ab-pop .2s ease-out}@keyframes ab-pop{from{transform:scale(.97);opacity:.3}to{transform:none;opacity:1}}}
@media (forced-colors:active){.ab-cell,.ab-edge,.ab-ov,.ab-pa,.ab-pb,.ab-div,.ab-l,.ab-r,.ab-un{stroke:CanvasText}.ab-edge{fill:Canvas}.ab-t{fill:CanvasText}.ab-btn{border-color:ButtonText}.ab-handle{fill:Highlight}}
`;

  /** @type {number} */
  let uid = 0;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("areabox", CSS);
    const m = spec.model;
    const T = A.t;
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const solved = !!api.solved;
    const base = solved ? solution(spec) : api.restore || {};
    let ended = solved;
    const uniq = `ab${++uid}`;
    /** @type {any} */
    let st;
    if (m.mode === "decimal")
      st = { c: Number(base.c ?? 1), r: Number(base.r ?? 1), p: String(base.p ?? "") };
    else if (m.form === "num") {
      const okS = (/** @type {number} */ v) =>
        m.friendly ? v === m.friendly || m.n - v === m.friendly : v === m.b || v === m.c;
      let s0 = Math.round(m.n / 2);
      while (okS(s0) && s0 < m.n - 1) s0++;
      while (okS(s0) && s0 > 1) s0--;
      st = {
        s: Number(base.s ?? s0),
        p1: String(base.p1 ?? ""),
        p2: String(base.p2 ?? ""),
        t: String(base.t ?? ""),
      };
    } else st = { t1: String(base.t1 ?? ""), t2: String(base.t2 ?? ""), t: String(base.t ?? "") };

    host.textContent = "";
    const root = A.el("div", `ab${solved ? " ab-done" : ""}`);
    const stage = A.el("div", "ab-stage");
    const ctl = A.el("div", "ab-ctl");
    const read = A.el("div", "ab-read");
    const ans = A.el("div", "ab-ans");
    const bar = A.el("div", "ab-bar");
    const fb = A.el("p", "ab-fb");
    fb.hidden = true;
    if (!api.say) fb.setAttribute("role", "status");
    const check = A.el("button", "ab-btn go", T("Check", "Comprobar"), { type: "button" });
    bar.append(check, fb);

    const emit = () => {
      fb.hidden = true;
      if (api.change) api.change({ ...st });
    };
    /** a number stepper row: [-] value [+] */
    const stepper = (
      /** @type {string} */ en,
      /** @type {string} */ esT,
      /** @type {string} */ key,
      /** @type {number} */ lo,
      /** @type {number} */ hi,
      /** @type {(n:number)=>string} */ show,
    ) => {
      const row = A.el("div", "ab-row");
      row.append(A.el("div", "ab-nm", T(en, esT)));
      const box = A.el("div", "ab-st");
      const out = A.el("output", "ab-v", show(st[key]));
      const mk = (/** @type {string} */ g, /** @type {number} */ d) => {
        const b = /** @type {any} */ (
          A.el("button", "ab-btn", g, {
            type: "button",
            "aria-label": `${d < 0 ? L("Make smaller", "Hacer más pequeño") : L("Make bigger", "Hacer más grande")}: ${L(en, esT)}`,
          })
        );
        b.disabled = ended;
        b.addEventListener("click", () => {
          st[key] = Math.min(hi, Math.max(lo, st[key] + d));
          out.textContent = show(st[key]);
          emit();
          draw();
        });
        return b;
      };
      box.append(mk("−", -1), out, mk("+", 1));
      row.append(box);
      ctl.append(row);
      return out;
    };
    const field = (
      /** @type {string} */ key,
      /** @type {string} */ label,
      /** @type {string} */ inputmode,
    ) => {
      const inp = /** @type {any} */ (
        A.el("input", "ab-in", "", {
          type: "text",
          inputmode,
          autocomplete: "off",
          autocapitalize: "off",
          spellcheck: "false",
          "aria-label": label,
        })
      );
      inp.value = st[key];
      inp.readOnly = ended;
      inp.addEventListener("input", () => {
        st[key] = inp.value;
        emit();
      });
      return inp;
    };
    /** @type {() => void} */
    let draw = () => {};

    if (m.mode === "decimal") {
      const cols = 10 * m.gx;
      const rows = 10 * m.gy;
      const cs = 12;
      const gw = 120;
      const gap = 10;
      const mg = 14;
      const VW = m.gx * gw + (m.gx - 1) * gap + 2 * mg;
      const VH = m.gy * gw + (m.gy - 1) * gap + 2 * mg;
      const gX = (/** @type {number} */ i) => mg + i * (gw + gap);
      const gY = (/** @type {number} */ j) => mg + j * (gw + gap);
      stage.style.maxWidth = m.gx > 1 ? "460px" : "360px";
      stage.style.margin = "0 auto";
      stage.style.width = "100%";
      const sizeCols = stepper("Width across (tenths)", "Ancho (décimos)", "c", 1, cols, dec);
      const sizeRows = stepper("Height down (tenths)", "Alto (décimos)", "r", 1, rows, dec);
      const f1 = (/** @type {number} */ n) => n.toFixed(1);
      draw = () => {
        let o = `<defs><pattern id="${uniq}v" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" style="fill:color-mix(in srgb,var(--brand,#2C4A68) 16%,transparent)"/><path d="M3 0V6" style="stroke:var(--brand,#2C4A68);stroke-width:1.2"/></pattern><pattern id="${uniq}h" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" style="fill:color-mix(in srgb,var(--sun,#F0BD4F) 30%,transparent)"/><path d="M0 3H6" style="stroke:var(--ink,#1B2733);stroke-width:1"/></pattern></defs>`;
        for (let j = 0; j < m.gy; j++)
          for (let i = 0; i < m.gx; i++) {
            const cw = Math.max(0, Math.min(10, st.c - 10 * i));
            const rh = Math.max(0, Math.min(10, st.r - 10 * j));
            const x = gX(i);
            const y = gY(j);
            o += `<rect class="ab-edge" x="${x}" y="${y}" width="${gw}" height="${gw}"/>`;
            if (cw)
              o += `<rect style="fill:url(#${uniq}v)" x="${x}" y="${y}" width="${cw * cs}" height="${gw}"/>`;
            if (rh)
              o += `<rect style="fill:url(#${uniq}h)" x="${x}" y="${y}" width="${gw}" height="${rh * cs}"/>`;
            if (cw && rh)
              o += `<rect class="ab-ov" x="${x}" y="${y}" width="${cw * cs}" height="${rh * cs}"/>`;
            for (let k = 1; k < 10; k++)
              o += `<path class="ab-cell" d="M${x + k * cs} ${y}V${y + gw}M${x} ${y + k * cs}H${x + gw}"/>`;
            o += `<rect class="ab-pb" x="${x}" y="${y}" width="${gw}" height="${gw}"/>`;
          }
        const hi = Math.min(m.gx - 1, Math.ceil(st.c / 10) - 1);
        const hj = Math.min(m.gy - 1, Math.ceil(st.r / 10) - 1);
        const hx = gX(hi) + (st.c - 10 * hi) * cs;
        const hy = gY(hj) + (st.r - 10 * hj) * cs;
        if (!ended)
          o += `<circle class="ab-hit" cx="${f1(hx)}" cy="${f1(hy)}" r="22" data-h="1"/><circle class="ab-handle" cx="${f1(hx)}" cy="${f1(hy)}" r="9" data-h="1"/>`;
        stage.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${L(`Grid of hundredths: ${dec(st.c)} wide and ${dec(st.r)} tall`, `Cuadrícula de centésimos: ${dec(st.c)} de ancho y ${dec(st.r)} de alto`)}">${o}</svg>`;
        sizeCols.textContent = dec(st.c);
        sizeRows.textContent = dec(st.r);
        read.innerHTML = `<div>${T("Shaded across", "Sombreado a lo ancho")}: <b>${dec(st.c)}</b> · ${T("down", "a lo alto")}: <b>${dec(st.r)}</b></div><div class="ab-big">${st.c} ${st.c === 1 ? T("tenth", "décimo") : T("tenths", "décimos")} × ${st.r} ${st.r === 1 ? T("tenth", "décimo") : T("tenths", "décimos")} = ${st.c * st.r} ${st.c * st.r === 1 ? T("hundredth", "centésimo") : T("hundredths", "centésimos")}</div>`;
        eqLabel.textContent = `${dec(st.c)} × ${dec(st.r)} =`;
        wire();
      };
      const toCell = (/** @type {any} */ svg, /** @type {PointerEvent} */ e) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        const pick = (
          /** @type {number} */ v,
          /** @type {number} */ n,
          /** @type {(i:number)=>number} */ g,
        ) => {
          for (let i = 0; i < n; i++)
            if (v < g(i) + gw + gap / 2 || i === n - 1)
              return Math.max(1, Math.min(10 * n, 10 * i + Math.round((v - g(i)) / cs)));
          return 1;
        };
        return [pick(p.x, m.gx, gX), pick(p.y, m.gy, gY)];
      };
      let dragging = false;
      const wire = () => {
        const svg = /** @type {any} */ (stage.querySelector("svg"));
        for (const h of /** @type {any[]} */ ([...stage.querySelectorAll("[data-h]")])) {
          h.addEventListener("pointerdown", (/** @type {PointerEvent} */ e) => {
            dragging = true;
            h.setPointerCapture?.(e.pointerId);
            e.preventDefault();
          });
        }
        svg.addEventListener("pointermove", (/** @type {PointerEvent} */ e) => {
          if (!dragging || ended) return;
          const [c, r] = toCell(svg, e);
          if (c !== st.c || r !== st.r) {
            st.c = c;
            st.r = r;
            emit();
            draw();
          }
        });
        const stop = () => {
          dragging = false;
        };
        svg.addEventListener("pointerup", stop);
        svg.addEventListener("pointercancel", stop);
        svg.addEventListener("lostpointercapture", stop);
      };
      const eqLabel = A.el("span", "");
      const inp = field("p", L("Product", "Producto"), "decimal");
      ans.className = "ab-eq";
      ans.append(eqLabel, inp);
    } else if (m.form === "num") {
      const n = m.n;
      const cs = Math.min(34, Math.floor(300 / n));
      const mg = 30;
      const VW = n * cs + 2 * mg;
      const VH = m.a * cs + 2 * mg;
      const sOut = stepper(
        "Split after column",
        "Dividir después de la columna",
        "s",
        1,
        n - 1,
        String,
      );
      /** @type {any} */
      const inps = {};
      draw = () => {
        const sx = mg + st.s * cs;
        let o = `<rect class="ab-l" x="${mg}" y="${mg}" width="${st.s * cs}" height="${m.a * cs}"/><rect class="ab-r" x="${sx}" y="${mg}" width="${(n - st.s) * cs}" height="${m.a * cs}"/>`;
        if (cs >= 12)
          for (let i = 1; i < n; i++)
            o += `<path class="ab-cell" d="M${mg + i * cs} ${mg}V${mg + m.a * cs}"/>`;
        if (cs >= 12)
          for (let j = 1; j < m.a; j++)
            o += `<path class="ab-cell" d="M${mg} ${mg + j * cs}H${mg + n * cs}"/>`;
        o += `<rect class="ab-pb" x="${mg}" y="${mg}" width="${n * cs}" height="${m.a * cs}"/><path class="ab-div" d="M${sx} ${mg - 8}V${mg + m.a * cs + 8}"/>`;
        o += `<text class="ab-t" x="${mg + (st.s * cs) / 2}" y="${mg - 10}">${st.s}</text><text class="ab-t" x="${sx + ((n - st.s) * cs) / 2}" y="${mg - 10}">${n - st.s}</text><text class="ab-t" x="${mg - 14}" y="${mg + (m.a * cs) / 2 + 5}">${m.a}</text>`;
        if (!ended)
          o += `<circle class="ab-hit" cx="${sx}" cy="${mg + m.a * cs + 8}" r="22" data-h="1"/><circle class="ab-handle" cx="${sx}" cy="${mg + m.a * cs + 8}" r="9" data-h="1"/>`;
        stage.innerHTML = `<svg viewBox="0 0 ${VW} ${VH + 12}" role="img" aria-label="${L(`Rectangle ${m.a} tall and ${n} wide split into ${st.s} and ${n - st.s}`, `Rectángulo de ${m.a} de alto y ${n} de ancho dividido en ${st.s} y ${n - st.s}`)}">${o}</svg>`;
        sOut.textContent = String(st.s);
        read.innerHTML = `<div class="ab-big">${m.a}(${st.s} + ${n - st.s}) = ${m.a} × ${st.s} + ${m.a} × ${n - st.s}</div>`;
        lab1.textContent = `${m.a} × ${st.s} =`;
        lab2.textContent = `${m.a} × ${n - st.s} =`;
        wire();
      };
      const wire = () => {
        const svg = /** @type {any} */ (stage.querySelector("svg"));
        let dragging = false;
        for (const h of /** @type {any[]} */ ([...stage.querySelectorAll("[data-h]")])) {
          h.addEventListener("pointerdown", (/** @type {PointerEvent} */ e) => {
            dragging = true;
            h.setPointerCapture?.(e.pointerId);
            e.preventDefault();
          });
        }
        svg.addEventListener("pointermove", (/** @type {PointerEvent} */ e) => {
          if (!dragging || ended) return;
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const p = pt.matrixTransform(svg.getScreenCTM().inverse());
          const s = Math.max(1, Math.min(n - 1, Math.round((p.x - mg) / cs)));
          if (s !== st.s) {
            st.s = s;
            emit();
            draw();
          }
        });
        const stop = () => {
          dragging = false;
        };
        svg.addEventListener("pointerup", stop);
        svg.addEventListener("pointercancel", stop);
        svg.addEventListener("lostpointercapture", stop);
      };
      const lab1 = A.el("span", "");
      const lab2 = A.el("span", "");
      inps.p1 = field("p1", L("Area of the left part", "Área de la parte izquierda"), "numeric");
      inps.p2 = field("p2", L("Area of the right part", "Área de la parte derecha"), "numeric");
      inps.t = field(
        "t",
        L("Area of the whole rectangle", "Área del rectángulo completo"),
        "numeric",
      );
      const b1 = A.el("div", "ab-blk l");
      b1.append(A.el("span", "ab-eq", T("Left part", "Parte izquierda")), lab1, inps.p1);
      const b2 = A.el("div", "ab-blk r");
      b2.append(A.el("span", "ab-eq", T("Right part", "Parte derecha")), lab2, inps.p2);
      const b3 = A.el("div", "ab-blk");
      b3.append(A.el("span", "ab-eq", T("Whole rectangle", "Rectángulo completo")), inps.t);
      ans.className = "ab-ctl";
      ans.append(b1, b2, b3);
    } else {
      const cs = 24;
      const mg = 30;
      const xw = 3 * cs;
      const VW = m.p * xw + m.k * cs + 2 * mg;
      const VH = m.a * cs + 2 * mg;
      const vlab = `${m.p === 1 ? "" : m.p}${m.v}`;
      let o = "";
      for (let i = 0; i < m.p; i++)
        o += `<rect class="ab-un" x="${mg + i * xw}" y="${mg}" width="${xw}" height="${m.a * cs}"/><text class="ab-t" x="${mg + i * xw + xw / 2}" y="${mg + (m.a * cs) / 2 + 5}">${m.v}</text>`;
      const rx = mg + m.p * xw;
      o += `<rect class="ab-r" x="${rx}" y="${mg}" width="${m.k * cs}" height="${m.a * cs}"/>`;
      for (let i = 1; i < m.k; i++)
        o += `<path class="ab-cell" d="M${rx + i * cs} ${mg}V${mg + m.a * cs}"/>`;
      for (let j = 1; j < m.a; j++)
        o += `<path class="ab-cell" d="M${rx} ${mg + j * cs}H${rx + m.k * cs}"/>`;
      o += `<rect class="ab-pb" x="${rx}" y="${mg}" width="${m.k * cs}" height="${m.a * cs}"/>`;
      o += `<text class="ab-t" x="${mg + (m.p * xw) / 2}" y="${mg - 10}">${vlab}</text><text class="ab-t" x="${rx + (m.k * cs) / 2}" y="${mg - 10}">${m.k}</text><text class="ab-t" x="${mg - 14}" y="${mg + (m.a * cs) / 2 + 5}">${m.a}</text>`;
      stage.innerHTML = `<svg viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${L(`Rectangle ${m.a} tall. The left part is ${vlab} wide and the right part is ${m.k} wide.`, `Rectángulo de ${m.a} de alto. La parte izquierda mide ${vlab} de ancho y la derecha ${m.k}.`)}">${o}</svg>`;
      read.innerHTML = `<div class="ab-big">${m.a}(${vlab} + ${m.k})</div><div>${T("Each part has the same height.", "Cada parte tiene la misma altura.")}</div>`;
      draw = () => {};
      const mk = (
        /** @type {string} */ cls,
        /** @type {string} */ en,
        /** @type {string} */ esT,
        /** @type {string} */ key,
      ) => {
        const blk = A.el("div", `ab-blk ${cls}`);
        blk.append(A.el("span", "ab-eq", T(en, esT)), field(key, L(en, esT), "text"));
        return blk;
      };
      ans.className = "ab-ctl";
      ans.append(
        mk("l", "Left part area", "Área de la parte izquierda", "t1"),
        mk("r", "Right part area", "Área de la parte derecha", "t2"),
        mk("", "Whole area (two terms)", "Área total (dos términos)", "t"),
      );
    }

    const show = (/** @type {any} */ r) => {
      fb.hidden = false;
      fb.className = `ab-fb${r.ok ? " ok" : ""}`;
      fb.innerHTML = r.ok
        ? T("You modeled it.", "Lo representaste.")
        : T(r.say || "Not yet.", r.sayEs || "Todavía no.");
      if (api.say)
        api.say(
          r.ok ? L("Correct", "Correcto") : L(r.say || "Not yet", r.sayEs || r.say || "Todavía no"),
        );
    };
    const lock = () => {
      ended = true;
      root.classList.add("ab-done");
      check.hidden = true;
      for (const b of /** @type {any[]} */ ([
        ...root.querySelectorAll("button.ab-btn:not(.go), input"),
      ])) {
        if (b.tagName === "INPUT") b.readOnly = true;
        else b.disabled = true;
      }
    };
    check.addEventListener("click", () => {
      if (ended) return;
      const local = def.grade(spec, st);
      const skip = local.tag === "untouched" || local.tag === "empty";
      const out = skip ? null : api.submit && api.submit({ ...st });
      const res = out && typeof out === "object" && typeof out.ok === "boolean" ? out : local;
      if (res.ok) lock();
      show(res);
      if (res.ok) draw();
    });
    root.append(
      stage,
      m.mode === "distribute" && m.form === "var" ? read : ctl,
      ...(m.mode === "distribute" && m.form === "var" ? [] : [read]),
      ans,
      bar,
    );
    host.append(root);
    draw();
    if (solved) {
      lock();
      show({ ok: true });
    }
  }

  const def = {
    title: "Area box",
    titleEs: "Caja de área",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("areabox", def);
})();
