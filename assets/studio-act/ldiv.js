/**
 * Practice Studio activity: ldiv (window.StudioAct kind "ldiv").
 * Long division one step at a time in the standard layout. Per cycle the student enters the quotient digit, the
 * product and the difference; the next digit comes down by itself. With decimal: true the student first shifts both
 * numbers, then taps where the decimal point goes. An estimate chip is graded with the final result.
 * State: { est: chip index, steps: [typed values in order] }. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  const num = (/** @type {any} */ s) => Number(String(s ?? "").replace(/[,\s$]/g, ""));
  const blank = (/** @type {any} */ s) => String(s ?? "").trim() === "";
  const CTX = [
    [
      "A school packs {A} pencils into boxes of {B}.",
      "Una escuela empaca {A} lápices en cajas de {B}.",
    ],
    [
      "A library puts {A} books on shelves of {B}.",
      "Una biblioteca pone {A} libros en estantes de {B}.",
    ],
    [
      "A club seats {A} guests at tables of {B}.",
      "Un club sienta a {A} invitados en mesas de {B}.",
    ],
    [
      "A shop sorts {A} stickers onto sheets of {B}.",
      "Una tienda ordena {A} calcomanías en hojas de {B}.",
    ],
    ["A team packs {A} cans into cartons of {B}.", "Un equipo empaca {A} latas en cajas de {B}."],
  ];
  const DCTX = [
    [
      "A ribbon {A} meters long is cut into pieces {B} meters long.",
      "Una cinta de {A} metros se corta en trozos de {B} metros.",
    ],
    [
      "A bag holds {A} pounds of rice for portions of {B} pounds.",
      "Una bolsa tiene {A} libras de arroz para porciones de {B} libras.",
    ],
    [
      "A path {A} miles long has posts every {B} miles.",
      "Un sendero de {A} millas tiene postes cada {B} millas.",
    ],
    [
      "A tank has {A} liters to fill bottles of {B} liters.",
      "Un tanque tiene {A} litros para llenar botellas de {B} litros.",
    ],
  ];
  const MONEY = [
    ["A club spends ${A} on {B} equal prizes.", "Un club gasta ${A} en {B} premios iguales."],
    ["{B} friends share ${A} equally.", "{B} amigos reparten ${A} en partes iguales."],
    [
      "A class raises ${A} and splits it among {B} teams.",
      "Una clase junta ${A} y lo divide entre {B} equipos.",
    ],
  ];

  /** the digit cycles of D into digits, or null when the quotient would start after the first fractional digit */
  function cycles(
    /** @type {number} */ D,
    /** @type {number[]} */ digits,
    /** @type {number} */ pt,
  ) {
    let cur = 0;
    let i = 0;
    for (; i < digits.length; i++) {
      cur = cur * 10 + digits[i];
      if (cur >= D) break;
    }
    if (i === digits.length || (pt < digits.length && i > pt)) return null;
    /** @type {any[]} */
    const cyc = [];
    for (let idx = i; ; idx++) {
      const q = Math.floor(cur / D);
      const bd = idx + 1 < digits.length ? digits[idx + 1] : null;
      cyc.push({ idx, work: cur, q, p: q * D, r: cur - q * D, bd });
      if (bd === null) break;
      cur = (cur - q * D) * 10 + bd;
    }
    return cyc;
  }
  /** move the point of a plain decimal string k places right */
  function shiftStr(/** @type {string} */ s, /** @type {number} */ k) {
    const [a, b = ""] = s.split(".");
    const f = b.padEnd(k, "0");
    const out = `${a}${f.slice(0, k)}`.replace(/^0+(?=\d)/, "");
    return f.length > k ? `${out}.${f.slice(k)}` : out;
  }
  const fixed = (/** @type {number} */ n, /** @type {number} */ dp) => (n / 10 ** dp).toFixed(dp);

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const decimal = typeof params.decimal === "boolean" ? params.decimal : level === 4;
    for (let t = 0; t < 900; t++) {
      let D = 0;
      let dvd = "";
      let dvs = "";
      let shift = 0;
      let money = false;
      let rem = 0;
      if (!decimal) {
        let q = 0;
        if (level === 1) {
          D = rng.int(3, 9);
          q = rng.int(12, Math.floor(99 / D));
        } else if (level === 2) {
          D = rng.int(11, 29);
          q = rng.int(15, Math.floor(999 / D));
        } else {
          D = rng.int(level === 3 ? 11 : 12, level === 3 ? 24 : 49);
          q = rng.int(2, 8) * 100 + rng.int(1, 9);
        }
        rem =
          level === 3 || level === 4
            ? level === 4
              ? rng.int(1, D - 1)
              : 0
            : rng.chance(0.5)
              ? rng.int(1, D - 1)
              : 0;
        const N = D * q + rem;
        if (
          N > 9999 ||
          (level === 1 && N > 99) ||
          (level === 2 && N > 999) ||
          (level >= 3 && N < 1000)
        )
          continue;
        dvd = String(N);
        dvs = String(D);
      } else if (level === 1) {
        D = rng.int(3, 9);
        const q = rng.int(12, 49);
        dvd = fixed(D * q, 1);
        dvs = String(D);
      } else if (level === 2) {
        D = rng.int(3, 29);
        const q = rng.int(2, 9);
        dvd = fixed(D * q, 1);
        dvs = fixed(D, 1);
        shift = 1;
      } else if (level === 3) {
        if (rng.chance(0.5)) {
          D = rng.int(4, 36);
          dvs = fixed(D, 2);
          dvd = fixed(D * rng.int(2, 9), 2);
          shift = 2;
        } else {
          D = rng.int(3, 9);
          dvs = String(D);
          dvd = fixed(D * rng.int(120, 480), 2);
        }
      } else {
        money = true;
        D = rng.int(2, 24);
        dvs = String(D);
        dvd = fixed(D * rng.int(150, 850), 2);
      }
      if (level <= 2 && decimal && (D % 10 === 0 || dvd.endsWith("0"))) continue;
      const sd = shift ? shiftStr(dvd, shift) : dvd;
      const digits = sd.replace(".", "").split("").map(Number);
      const pt = sd.includes(".") ? sd.indexOf(".") : digits.length;
      if (digits.length > 6 || /^0\d/.test(sd)) continue;
      const cyc = cycles(D, digits, pt);
      if (!cyc || (!decimal && cyc.length < (level <= 2 ? 2 : 3))) continue;
      const qd = cyc.map((c) => c.q);
      const quoNum = decimal ? num(dvd) / (num(dvs) || 1) : Math.floor(num(dvd) / D);
      const mant = quoNum / 10 ** Math.floor(Math.log10(quoNum));
      if (mant > 8.5) continue;
      if (level === 3 && !decimal && !qd.slice(1).includes(0)) continue;
      /** @type {any[]} */
      const E = [];
      if (shift) E.push({ k: "dvs", v: String(D) }, { k: "dvd", v: sd });
      if (pt < digits.length) E.push({ k: "pt", v: pt });
      cyc.forEach((c, i) =>
        E.push({ k: "q", v: c.q, c: i }, { k: "p", v: c.p, c: i }, { k: "r", v: c.r, c: i }),
      );
      const qs = decimal
        ? fixed(Math.round(quoNum * 100), 2)
            .replace(/0+$/, "")
            .replace(/\.$/, "")
        : String(Math.floor(quoNum));
      const decs = (dvd.split(".")[1] || "").length - shift;
      const quoStr = decimal ? (decs > 0 ? quoNum.toFixed(decs) : String(Math.round(quoNum))) : qs;
      return pack(rng, {
        decimal,
        money,
        dvd,
        dvs,
        D,
        shift,
        sd,
        digits,
        pt,
        cyc,
        E,
        quo: quoStr,
        rem,
        quoNum,
      });
    }
    throw new Error(`ldiv: no task for L${level}`);
  }

  function pack(/** @type {any} */ rng, /** @type {any} */ m) {
    const c = rng.pick(m.money ? MONEY : m.decimal ? DCTX : CTX);
    const fmtA = m.decimal ? m.dvd : G.commas(num(m.dvd));
    const sub = (/** @type {string} */ s) => s.replace("{A}", fmtA).replace("{B}", m.dvs);
    const expr = `${fmtA} ÷ ${m.dvs}`;
    const q = `${sub(c[0])} Use long division to find ${expr}.`;
    const qEs = `${sub(c[1])} Usa la división larga para hallar ${expr}.`;
    const exp = Math.floor(Math.log10(m.quoNum));
    const win = rng.pick(
      [Math.max(-1, exp - 2), Math.max(-1, exp - 1), exp].filter((v, i, a) => a.indexOf(v) === i),
    );
    const lo = (/** @type {number} */ j) => 10 ** j;
    const lab = (/** @type {number} */ j) => (j < 0 ? "0.1" : G.commas(lo(j)));
    const chips = [0, 1, 2].map((i) => [
      win + i,
      win + i + 1,
      `${lab(win + i)} to ${lab(win + i + 1)}`,
      `${lab(win + i)} a ${lab(win + i + 1)}`,
    ]);
    const answer = exp - win;
    const ans = m.decimal ? m.quo : m.rem ? `${m.quo} R ${m.rem}` : m.quo;
    return {
      q,
      qEs,
      x: `${expr} = ${ans}. Each step is divide, multiply, subtract, bring down.${m.rem ? ` The remainder ${m.rem} is what is left over.` : ""}`,
      xEs: `${expr} = ${ans}. Cada paso es dividir, multiplicar, restar y bajar el dígito.${m.rem ? ` El residuo ${m.rem} es lo que sobra.` : ""}`,
      h: [
        "Work one step at a time: divide, multiply, subtract, bring down.",
        m.shift
          ? "First slide the decimal point the same number of places in both numbers so the divisor is a whole number."
          : "If the divisor does not fit in the first digit, use the first two digits.",
        "Round both numbers to friendly numbers to estimate how big the answer will be.",
      ],
      hEs: [
        "Trabaja un paso a la vez: dividir, multiplicar, restar y bajar el dígito.",
        m.shift
          ? "Primero mueve el punto decimal la misma cantidad de lugares en los dos números para que el divisor sea entero."
          : "Si el divisor no cabe en el primer dígito, usa los dos primeros dígitos.",
        "Redondea los dos números a números fáciles para estimar qué tan grande será la respuesta.",
      ],
      model: { ...m, expr, est: { chips, answer } },
    };
  }

  /* ---- grading -------------------------------------------------------------------------------- */
  const bad = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  /** null when typed is right for entry i, else the miss */
  function checkEntry(/** @type {any} */ m, /** @type {number} */ i, /** @type {any} */ typed) {
    const e = m.E[i];
    const t = num(typed);
    if (blank(typed) || Number.isNaN(t))
      return bad("empty", "Type a number first.", "Escribe un número primero.");
    if (e.k === "pt")
      return Number(typed) === e.v
        ? null
        : bad(
            "point",
            "The decimal point goes straight up from the point in the dividend.",
            "El punto decimal va justo arriba del punto del dividendo.",
          );
    if (e.k === "dvs" || e.k === "dvd") {
      if (t === num(e.v)) return null;
      return bad(
        "shift",
        e.k === "dvs"
          ? "Slide the decimal point right until the divisor is a whole number."
          : "Slide the point in the dividend the same number of places as in the divisor.",
        e.k === "dvs"
          ? "Mueve el punto a la derecha hasta que el divisor sea un número entero."
          : "Mueve el punto del dividendo la misma cantidad de lugares que en el divisor.",
      );
    }
    if (t === e.v) return null;
    const c = m.cyc[e.c];
    if (e.k === "q") {
      if (t > 9 || t < 0 || String(typed).trim().length > 1)
        return bad(
          "digit",
          "Write just one digit above the bar.",
          "Escribe solo un dígito arriba de la barra.",
        );
      return t * m.D > c.work
        ? bad(
            "too-big",
            "That digit is too big. Its product with the divisor would be more than the number you are dividing into.",
            "Ese dígito es demasiado grande. Su producto con el divisor sería mayor que el número que estás dividiendo.",
          )
        : bad(
            "too-small",
            "That digit is too small. The leftover would still hold another divisor.",
            "Ese dígito es demasiado pequeño. Lo que sobra todavía contendría otro divisor.",
          );
    }
    if (e.k === "p") {
      if (t === c.q + m.D)
        return bad(
          "added",
          "You added. The product is the divisor times your quotient digit.",
          "Sumaste. El producto es el divisor por tu dígito del cociente.",
        );
      if (t === m.D || t === c.q)
        return bad(
          "no-times",
          "The product should be the divisor times your quotient digit.",
          "El producto debe ser el divisor por tu dígito del cociente.",
        );
      return bad(
        "product",
        "The product should be the divisor times your quotient digit. Multiply again.",
        "El producto debe ser el divisor por tu dígito del cociente. Multiplica otra vez.",
      );
    }
    if (t === c.work + c.p || t === c.p - c.work)
      return bad(
        "sub-way",
        "Subtract: take the product away from the number above it.",
        "Resta: quita el producto del número de arriba.",
      );
    return bad(
      "difference",
      "Check the subtraction: the number above minus the product.",
      "Revisa la resta: el número de arriba menos el producto.",
    );
  }
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const steps = (st && st.steps) || [];
    for (let i = 0; i < steps.length && i < m.E.length; i++) {
      const miss = checkEntry(m, i, steps[i]);
      if (miss) return miss;
    }
    if (steps.length < m.E.length)
      return bad(
        "incomplete",
        "Keep going: there are more steps to finish.",
        "Sigue: todavía faltan pasos.",
      );
    if (!st || st.est !== m.est.answer)
      return bad(
        "estimate",
        "Your steps are all right. Now check your estimate: round both numbers to friendly numbers and see how big the answer should be.",
        "Todos tus pasos están bien. Ahora revisa tu estimación: redondea los dos números a números fáciles y mira qué tan grande debe ser la respuesta.",
      );
    return { ok: true };
  }
  const solution = (/** @type {any} */ spec) => ({
    est: spec.model.est.answer,
    steps: spec.model.E.map((/** @type {any} */ e) => String(e.v)),
  });
  function wrong(/** @type {any} */ spec, /** @type {any} */ _rng) {
    const m = spec.model;
    const s = solution(spec);
    const off = (/** @type {number} */ i) => {
      const e = m.E[i];
      if (e.k === "pt") return String((e.v + 1) % (m.digits.length + 1) || 1);
      if (e.k === "dvs" || e.k === "dvd") return `${e.v}0`;
      return String(e.k === "q" ? (e.v + 1) % 10 : e.v + 1);
    };
    const at = (/** @type {string} */ k) => m.E.findIndex((/** @type {any} */ e) => e.k === k);
    /** @type {any[]} */
    const c = [{ est: s.est, steps: [off(0)] }];
    for (const k of ["p", "r"]) {
      const i = at(k);
      c.push({ est: s.est, steps: [...s.steps.slice(0, i), off(i)] });
    }
    c.push({ est: (s.est + 1) % 3, steps: s.steps });
    return c.filter((st) => !grade(spec, st).ok);
  }

  /* ---- the widget ----------------------------------------------------------------------------- */
  const CSS = `
.ld{display:grid;grid-template-columns:minmax(0,1fr);gap:12px;max-width:560px;color:var(--ink,#1B2733);--cw:2.3rem}
.ld>*{min-width:0}
.ld-box{background:var(--surface,#fff);border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px 12px;display:grid;gap:8px}
.ld-lab{font-weight:800}
.ld-lab .es-text{margin:0;font-size:.85em;font-weight:600}
.ld-chips{display:flex;flex-wrap:wrap;gap:8px}
.ld-btn{appearance:none;font:inherit;font-weight:800;min-height:48px;min-width:48px;padding:6px 14px;border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;border-radius:var(--radius-md,14px);background:var(--surface,#fff);color:var(--brand,#2C4A68);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.2;text-align:center}
.ld-btn:hover:not([disabled]){background:var(--brand-tint,#E5ECF3)}
.ld-btn[aria-pressed=true]{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--ink,#1B2733)}
.ld-btn.go{background:var(--brand,#2C4A68);color:var(--surface,#fff);border-color:var(--brand-dark,#1B2C3F)}
.ld-btn[disabled]{opacity:.55;cursor:not-allowed}
.ld-btn[hidden]{display:none}
.ld-btn .es-text{color:inherit;font-size:.75em;margin:0;font-weight:600}
.ld-btn:focus-visible,.ld input:focus-visible{outline:3px solid var(--ink,#1B2733);outline-offset:2px;box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.ld-dmsb{display:flex;gap:6px;flex-wrap:wrap}
.ld-dmsb span{padding:2px 10px;border-radius:999px;border:2px solid var(--border,#D5DCE5);font-weight:800;font-size:.85rem}
.ld-dmsb span.on{background:var(--sun,#F0BD4F);color:var(--brand-dark,#1B2C3F);border-color:var(--ink,#1B2733)}
.ld-coach{margin:0;font-weight:700;min-height:2.6em}
.ld-work{overflow-x:auto;padding:6px 4px 10px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.5rem;font-weight:700}
.ld-row{display:grid;grid-template-columns:3.6rem repeat(var(--n),var(--cw));min-height:2.9rem;align-items:center;position:relative;width:max-content}
.ld-c{text-align:right;position:relative;line-height:2.9rem;padding-right:.35rem}
.ld-dv{text-align:right;padding-right:.5rem;color:var(--brand,#2C4A68);line-height:2.9rem}
.ld-bar .ld-c{border-top:3px solid var(--ink,#1B2733)}
.ld-bar .ld-c.f{border-left:3px solid var(--ink,#1B2733);border-top-left-radius:16px}
.ld-sub{border-bottom:3px solid var(--ink,#1B2733)}
.ld-sub::before{content:"\\2212";position:absolute;left:-.9rem}
.ld-bd{background:var(--sun,#F0BD4F);color:var(--brand-dark,#1B2C3F);border-radius:6px}
.ld-pt::after{content:"";position:absolute;right:-.1rem;bottom:.7rem;width:.45rem;height:.45rem;border-radius:50%;background:var(--ink,#1B2733)}
.ld-q{color:var(--brand,#2C4A68)}
.ld-in{font:inherit;text-align:right;width:100%;min-height:46px;padding:0 .3rem;border:3px solid var(--brand,#2C4A68);border-radius:10px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.ld-gap{position:absolute;top:0;height:2.9rem;width:2rem;margin-left:-1rem;border:0;background:transparent;cursor:pointer;display:grid;place-items:center}
.ld-gap i{width:1.4rem;height:1.4rem;border-radius:50%;border:3px dashed var(--brand,#2C4A68);background:var(--surface,#fff)}
.ld-gap:hover i{background:var(--sun,#F0BD4F)}
.ld-gap:focus-visible{outline:3px solid var(--ink,#1B2733);box-shadow:0 0 0 7px var(--sun,#F0BD4F)}
.ld-shift{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:1.3rem;font-weight:700}
.ld-shift .ld-in{width:6.5rem}
.ld-shift>*{margin-right:.2rem}
.ld-shift b{margin-right:1rem}
.ld-final{font-size:1.3rem;font-weight:800;color:var(--ok,#0A7D4B)}
.ld-bar2{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.ld-fb{flex:1 1 220px;margin:0;padding:8px 12px 8px 44px;border-radius:var(--radius-md,14px);font-weight:700;position:relative;border:2px solid var(--bad,#B42318);background:color-mix(in srgb,var(--bad,#B42318) 12%,var(--surface,#fff))}
.ld-fb::before{content:"!";position:absolute;left:10px;top:8px;width:26px;height:26px;border-radius:50%;background:var(--bad,#B42318);color:#fff;font-weight:800;text-align:center;line-height:26px}
.ld-fb.ok{border-color:var(--ok,#0A7D4B);background:color-mix(in srgb,var(--ok,#0A7D4B) 14%,var(--surface,#fff))}
.ld-fb.ok::before{content:"\\2713";background:var(--ok,#0A7D4B)}
.ld-fb[hidden]{display:none}
.ld-fb .es-text{color:inherit;font-weight:600;margin-top:2px}
@media (prefers-reduced-motion:no-preference){.ld-fb{animation:ld-pop .2s ease-out}.ld-bd{animation:ld-pop .35s ease-out}@keyframes ld-pop{from{transform:scale(.9);opacity:.3}to{transform:none;opacity:1}}}
@media (forced-colors:active){.ld-bar .ld-c,.ld-sub,.ld-in{border-color:CanvasText}.ld-btn{border-color:ButtonText}.ld-bd{background:Highlight;color:HighlightText}}
`;

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("ldiv", CSS);
    const m = spec.model;
    const T = A.t;
    const es = () => !!(api.es && api.es());
    const L = (/** @type {string} */ en, /** @type {string} */ esT) => (es() && esT ? esT : en);
    const solved = !!api.solved;
    const base = solved ? solution(spec) : api.restore || {};
    let ended = solved;
    const st = {
      est: typeof base.est === "number" ? base.est : null,
      steps: /** @type {string[]} */ ([]),
    };
    for (const v of base.steps || []) {
      if (st.steps.length < m.E.length && !checkEntry(m, st.steps.length, v))
        st.steps.push(String(v));
      else break;
    }
    host.textContent = "";
    const root = A.el("div", "ld");
    root.style.setProperty("--n", String(m.digits.length));
    const estBox = A.el("div", "ld-box");
    const chips = A.el("div", "ld-chips", "", { role: "group" });
    const stepBox = A.el("div", "ld-box");
    const dmsb = A.el(
      "div",
      "ld-dmsb",
      ["D|Divide|Dividir", "M|Multiply|Multiplicar", "S|Subtract|Restar", "B|Bring down|Bajar"]
        .map(
          (s) =>
            `<span>${T(
              .../** @type {[string,string]} */ (
                s
                  .split("|")
                  .slice(1)
                  .map((x, i) => (i ? x : `${s[0]} ${x}`))
              ),
            )}</span>`,
        )
        .join(""),
    );
    const coach = A.el("p", "ld-coach");
    const work = A.el("div", "ld-work");
    const bar2 = A.el("div", "ld-bar2");
    const fb = A.el("p", "ld-fb");
    fb.hidden = true;
    if (!api.say) fb.setAttribute("role", "status");
    const ok = /** @type {any} */ (A.el("button", "ld-btn go", "OK", { type: "button" }));
    const check = /** @type {any} */ (
      A.el("button", "ld-btn go", T("Check", "Comprobar"), { type: "button" })
    );
    const again = /** @type {any} */ (
      A.el("button", "ld-btn", T("Start over", "Empezar de nuevo"), { type: "button" })
    );
    bar2.append(ok, check, again, fb);
    estBox.append(
      A.el(
        "span",
        "ld-lab",
        T(
          "About how big will the quotient be?",
          "¿Qué tan grande será el cociente, aproximadamente?",
        ),
      ),
      chips,
    );
    m.est.chips.forEach((/** @type {any} */ c, /** @type {number} */ i) => {
      const b = /** @type {any} */ (
        A.el("button", "ld-btn", T(c[2], c[3]), {
          type: "button",
          "aria-pressed": String(st.est === i),
        })
      );
      b.disabled = ended;
      b.addEventListener("click", () => {
        st.est = i;
        for (const x of /** @type {any[]} */ ([...chips.children]))
          x.setAttribute("aria-pressed", String(x === b));
        emit();
      });
      chips.append(b);
    });
    stepBox.append(dmsb, coach, work);
    root.append(estBox, stepBox, bar2);
    host.append(root);

    const emit = () => {
      fb.hidden = true;
      if (api.change) api.change({ est: st.est, steps: st.steps.slice() });
    };
    const say = (/** @type {any} */ r) => {
      fb.hidden = false;
      fb.className = `ld-fb${r.ok ? " ok" : ""}`;
      fb.innerHTML = r.ok
        ? T("Every step is right.", "Todos los pasos están bien.")
        : T(r.say || "Not yet.", r.sayEs || "Todavía no.");
      if (api.say)
        api.say(
          r.ok ? L("Correct", "Correcto") : L(r.say || "Not yet", r.sayEs || r.say || "Todavía no"),
        );
    };
    /** @type {any} */
    let input = null;
    const dn = (/** @type {string} */ s) => String(s).length;
    function row(/** @type {string} */ cls = "") {
      const r = A.el("div", `ld-row ${cls}`);
      work.append(r);
      return r;
    }
    /** a cell spanning columns a..b (0-based digit columns) */
    function cell(
      /** @type {any} */ r,
      /** @type {number} */ a,
      /** @type {number} */ b,
      /** @type {string} */ html,
      /** @type {string} */ cls = "ld-c",
    ) {
      const c = A.el("span", cls, html);
      c.style.gridColumn = `${a + 2} / ${b + 3}`;
      r.append(c);
      return c;
    }
    function render() {
      const i = st.steps.length;
      const e = m.E[i];
      work.textContent = "";
      const lead = m.shift
        ? m.E.findIndex((/** @type {any} */ x) => x.k === "pt" || x.k === "q")
        : 0;
      if (m.shift) {
        const sh = A.el("div", "ld-shift");
        const done = i >= 2;
        sh.append(A.el("span", "", `${m.dvs} → `));
        if (i === 0 && !ended)
          sh.append(
            (input = mkIn("", L("New divisor, a whole number", "Nuevo divisor, un número entero"))),
          );
        else sh.append(A.el("b", "", st.steps[0] || m.E[0].v));
        sh.append(A.el("span", "", `${m.dvd} → `));
        if (i === 1 && !ended) sh.append((input = mkIn("", L("New dividend", "Nuevo dividendo"))));
        else if (done) sh.append(A.el("b", "", st.steps[1]));
        work.append(sh);
      }
      void lead;
      const started = i >= (m.shift ? 2 : 0);
      if (!started) return finish(e);
      const qrow = row();
      const ptDone = m.E.findIndex((/** @type {any} */ x) => x.k === "pt");
      const ptSet = ptDone < 0 || i > ptDone;
      const nq = m.digits.length;
      cell(qrow, 0, -1, "");
      const qd = /** @type {Record<number,string>} */ ({});
      m.E.forEach((/** @type {any} */ x, /** @type {number} */ k) => {
        if (x.k === "q" && k < i) qd[m.cyc[x.c].idx] = st.steps[k];
      });
      for (let c = 0; c < nq; c++) {
        const lz =
          ptSet && m.pt < nq && c === m.pt - 1 && m.cyc[0].idx >= m.pt && qd[c] === undefined;
        const cl = cell(
          qrow,
          c,
          c,
          qd[c] ?? (lz ? "0" : ""),
          `ld-c ld-q${ptSet && m.pt < nq && c === m.pt - 1 ? " ld-pt" : ""}`,
        );
        void cl;
      }
      if (e && e.k === "pt" && !ended) {
        for (let g = 1; g <= nq; g++) {
          const b = /** @type {any} */ (
            A.el("button", "ld-gap", "<i></i>", {
              type: "button",
              "aria-label": `${L("Decimal point after digit", "Punto decimal después del dígito")} ${g}`,
            })
          );
          b.style.left = `calc(3.6rem + ${g} * var(--cw))`;
          b.addEventListener("click", () => attempt(String(g)));
          qrow.append(b);
        }
      }
      const drow = row("ld-bar");
      cell(drow, -1, -1, m.shift ? st.steps[0] || "" : m.dvs, "ld-dv").style.gridColumn = "1";
      for (let c = 0; c < nq; c++) {
        const bd = m.cyc.some(
          (/** @type {any} */ y, /** @type {number} */ yi) => y.idx === c && yi > 0,
        );
        cell(
          drow,
          c,
          c,
          String(m.digits[c]),
          `ld-c${c === 0 ? " f" : ""}${m.pt < nq && c === m.pt - 1 ? " ld-pt" : ""}${bd ? "" : ""}`,
        );
      }
      const nc = e && (e.k === "q" || e.k === "p" || e.k === "r") ? e.c : m.cyc.length;
      for (let c = 0; c <= Math.min(nc, m.cyc.length - 1); c++) {
        const cy = m.cyc[c];
        const iq = m.E.findIndex((/** @type {any} */ x) => x.k === "q" && x.c === c);
        const wl = Math.min(cy.idx + 1, Math.max(dn(cy.work), c ? dn(m.cyc[c - 1].r) + 1 : 1));
        if (i === iq && e && !ended) {
          const qr = /** @type {any} */ (qrow.children[cy.idx + 1]);
          qr.textContent = "";
          qr.append(
            (input = mkIn(
              "",
              L(
                `Quotient digit above column ${cy.idx + 1}`,
                `Dígito del cociente sobre la columna ${cy.idx + 1}`,
              ),
              1,
            )),
          );
        }
        if (i > iq) {
          const ip = iq + 1;
          const r1 = row();
          cell(r1, cy.idx - wl + 1, cy.idx, "", "ld-c").remove();
          if (i === ip && !ended) {
            const sp = cell(r1, cy.idx - wl + 1, cy.idx, "", "ld-c");
            sp.append((input = mkIn("", L("Product", "Producto"), wl)));
          } else if (i > ip) cell(r1, cy.idx - dn(cy.p) + 1, cy.idx, String(cy.p), "ld-c ld-sub");
          const ir = iq + 2;
          if (i >= ir) {
            const r2 = row();
            if (i === ir && !ended)
              cell(r2, cy.idx - wl + 1, cy.idx, "", "ld-c").append(
                (input = mkIn("", L("Difference", "Diferencia"), wl)),
              );
            else {
              cell(r2, cy.idx - dn(cy.r) + 1, cy.idx, String(cy.r), "ld-c");
              if (cy.bd !== null) cell(r2, cy.idx + 1, cy.idx + 1, String(cy.bd), "ld-c ld-bd");
            }
          }
        }
      }
      finish(e);
    }
    function finish(/** @type {any} */ e) {
      const i = st.steps.length;
      const labels = {
        dvs: [
          "Slide the decimal point right until the divisor is a whole number. What is the new divisor?",
          "Mueve el punto a la derecha hasta que el divisor sea entero. ¿Cuál es el nuevo divisor?",
        ],
        dvd: [
          "Slide the point in the dividend the same number of places. What is the new dividend?",
          "Mueve el punto del dividendo la misma cantidad de lugares. ¿Cuál es el nuevo dividendo?",
        ],
        pt: [
          "Tap where the decimal point goes in the answer: straight above the point in the dividend.",
          "Toca dónde va el punto decimal en la respuesta: justo arriba del punto del dividendo.",
        ],
        q: [
          "Divide: how many times does the divisor go into the number? Write the digit above the bar.",
          "Divide: ¿cuántas veces cabe el divisor en el número? Escribe el dígito arriba de la barra.",
        ],
        p: [
          "Multiply. Write the product under the number you divided into.",
          "Multiplica. Escribe el producto debajo del número que dividiste.",
        ],
        r: ["Subtract. Write the difference.", "Resta. Escribe la diferencia."],
      };
      const on = e ? { q: 0, p: 1, r: 2 }[/** @type {"q"|"p"|"r"} */ (e.k)] : -1;
      [...dmsb.children].forEach((s, k) => s.classList.toggle("on", k === on));
      const done = i >= m.E.length;
      coach.innerHTML = done
        ? `<span class="ld-final">${m.expr} = ${m.decimal ? m.quo : m.rem ? `${m.quo} R ${m.rem}` : m.quo}</span>`
        : T(/** @type {any} */ (labels)[e.k][0], /** @type {any} */ (labels)[e.k][1]);
      ok.hidden = ended || done || !e || e.k === "pt";
      check.hidden = ended || !done;
      again.hidden = ended || i === 0;
      if (input && !ended) input.focus();
    }
    function mkIn(
      /** @type {string} */ v,
      /** @type {string} */ label,
      /** @type {number} */ max = 8,
    ) {
      const inp = /** @type {any} */ (
        A.el("input", "ld-in", "", {
          type: "text",
          inputmode: "decimal",
          autocomplete: "off",
          "aria-label": label,
          maxlength: String(max + (m.shift && st.steps.length < 2 ? 4 : 0)),
        })
      );
      inp.value = v;
      inp.addEventListener("keydown", (/** @type {KeyboardEvent} */ ev) => {
        if (ev.key === "Enter") attempt(inp.value);
      });
      return inp;
    }
    function attempt(/** @type {string} */ v) {
      if (ended || st.steps.length >= m.E.length) return;
      const miss = checkEntry(m, st.steps.length, v);
      if (miss) {
        say(miss);
        if (miss.tag !== "empty" && api.submit)
          api.submit({ est: st.est, steps: [...st.steps, v] });
        if (input) input.setAttribute("aria-invalid", "true");
        return;
      }
      st.steps.push(String(v).trim());
      emit();
      render();
    }
    ok.addEventListener("click", () => attempt(input ? input.value : ""));
    again.addEventListener("click", () => {
      st.steps = [];
      emit();
      render();
    });
    check.addEventListener("click", () => {
      if (ended) return;
      const state = { est: st.est, steps: st.steps.slice() };
      const local = def.grade(spec, state);
      const out = api.submit && api.submit(state);
      const res = out && typeof out === "object" && typeof out.ok === "boolean" ? out : local;
      if (res.ok) {
        ended = true;
        for (const b of /** @type {any[]} */ ([...chips.children])) b.disabled = true;
      }
      say(res);
      render();
    });
    render();
    if (solved) say({ ok: true });
  }

  const def = {
    title: "Long division",
    titleEs: "División larga",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  };
  A.register("ldiv", def);
})();
