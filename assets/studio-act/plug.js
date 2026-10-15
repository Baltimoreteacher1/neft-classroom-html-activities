/**
 * Practice Studio activity: plug (evaluate an expression by replacing each letter with its value, 6.EE.2c).
 * The student taps every letter to swap in its value, then taps the value of the whole expression.
 * State: { rep: letters replaced, pick: number | null }. No timers.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const cat = (/** @type {number} */ a, /** @type {number} */ b) => Number(`${a}${b}`);
  /** Each template: tokens (var = a letter, imp = multiplication written by sitting next to it), value, traps. */
  const TEMPLATES = /** @type {Record<string, any>} */ ({
    "ax+b": {
      lv: [1, 2],
      tokens: (/** @type {any} */ p) => [
        { s: String(p.a) },
        { s: "x", v: "x", imp: 1 },
        { s: "+" },
        { s: String(p.b) },
      ],
      value: (/** @type {any} */ p) => p.a * p.x + p.b,
      traps: (/** @type {any} */ p) => [
        [
          cat(p.a, p.x) + p.b,
          "digits-side-by-side",
          "A number next to a letter means multiply, not write the digits side by side.",
          "Un número junto a una letra significa multiplicar, no escribir los dígitos juntos.",
        ],
        [
          p.a * (p.x + p.b),
          "order-of-operations",
          "There are no parentheses, so multiply before you add.",
          "No hay paréntesis, así que multiplica antes de sumar.",
        ],
        [
          p.a + p.x + p.b,
          "added-not-multiplied",
          "A number next to a letter is multiplied, not added.",
          "Un número junto a una letra se multiplica, no se suma.",
        ],
      ],
    },
    "ax-b": {
      lv: [2, 3],
      tokens: (/** @type {any} */ p) => [
        { s: String(p.a) },
        { s: "x", v: "x", imp: 1 },
        { s: "−" },
        { s: String(p.b) },
      ],
      value: (/** @type {any} */ p) => p.a * p.x - p.b,
      traps: (/** @type {any} */ p) => [
        [
          cat(p.a, p.x) - p.b,
          "digits-side-by-side",
          "A number next to a letter means multiply, not write the digits side by side.",
          "Un número junto a una letra significa multiplicar, no escribir los dígitos juntos.",
        ],
        [
          p.a * p.x + p.b,
          "sign-flipped",
          "The expression subtracts. Check the sign before the last number.",
          "La expresión resta. Revisa el signo antes del último número.",
        ],
        [
          p.a * (p.x - p.b),
          "order-of-operations",
          "There are no parentheses, so multiply before you subtract.",
          "No hay paréntesis, así que multiplica antes de restar.",
        ],
      ],
    },
    "a(x+b)": {
      lv: [2, 3],
      tokens: (/** @type {any} */ p) => [
        { s: String(p.a) },
        { s: "(", imp: 1 },
        { s: "x", v: "x" },
        { s: "+" },
        { s: String(p.b) },
        { s: ")" },
      ],
      value: (/** @type {any} */ p) => p.a * (p.x + p.b),
      traps: (/** @type {any} */ p) => [
        [
          p.a * p.x + p.b,
          "parentheses-ignored",
          "The parentheses group x + b. The number outside multiplies the whole group.",
          "Los paréntesis agrupan x + b. El número de afuera multiplica todo el grupo.",
        ],
        [
          p.a + p.x + p.b,
          "added-not-multiplied",
          "A number next to parentheses means multiply.",
          "Un número junto a paréntesis significa multiplicar.",
        ],
        [
          p.x + p.b,
          "coefficient-dropped",
          "Do not forget the number outside the parentheses.",
          "No olvides el número de afuera de los paréntesis.",
        ],
      ],
    },
    "x2+b": {
      lv: [3, 4],
      tokens: (/** @type {any} */ p) => [
        { s: "x", v: "x" },
        { s: "²" },
        { s: "+" },
        { s: String(p.b) },
      ],
      value: (/** @type {any} */ p) => p.x ** 2 + p.b,
      traps: (/** @type {any} */ p) => [
        [
          p.x * 2 + p.b,
          "doubled-not-squared",
          "x² means x × x, not x × 2.",
          "x² significa x × x, no x × 2.",
        ],
        [
          (p.x + p.b) ** 2,
          "order-of-operations",
          "The power applies to x only. Add the last number after squaring.",
          "La potencia es solo de x. Suma el último número después de elevar.",
        ],
        [
          p.x ** 2 - p.b,
          "sign-flipped",
          "The expression adds. Check the sign.",
          "La expresión suma. Revisa el signo.",
        ],
      ],
    },
    "ax+by": {
      lv: [3, 4],
      tokens: (/** @type {any} */ p) => [
        { s: String(p.a) },
        { s: "x", v: "x", imp: 1 },
        { s: "+" },
        { s: String(p.b) },
        { s: "y", v: "y", imp: 1 },
      ],
      value: (/** @type {any} */ p) => p.a * p.x + p.b * p.y,
      traps: (/** @type {any} */ p) => [
        [
          cat(p.a, p.x) + cat(p.b, p.y),
          "digits-side-by-side",
          "A number next to a letter means multiply, not write the digits side by side.",
          "Un número junto a una letra significa multiplicar, no escribir los dígitos juntos.",
        ],
        [
          p.a + p.x + p.b + p.y,
          "added-not-multiplied",
          "Each number next to a letter is multiplied by it.",
          "Cada número junto a una letra se multiplica por ella.",
        ],
        [
          p.a * p.y + p.b * p.x,
          "values-swapped",
          "Check which letter goes with which number.",
          "Revisa qué letra va con qué número.",
        ],
      ],
    },
    "(x+y)2": {
      lv: [4, 4],
      tokens: () => [
        { s: "(" },
        { s: "x", v: "x" },
        { s: "+" },
        { s: "y", v: "y" },
        { s: ")" },
        { s: "²" },
      ],
      value: (/** @type {any} */ p) => (p.x + p.y) ** 2,
      traps: (/** @type {any} */ p) => [
        [
          p.x ** 2 + p.y ** 2,
          "power-shared-out",
          "The power applies to the whole sum in the parentheses, not to each term.",
          "La potencia es de toda la suma entre paréntesis, no de cada término.",
        ],
        [
          (p.x + p.y) * 2,
          "doubled-not-squared",
          "² means multiply the sum by itself, not by 2.",
          "² significa multiplicar la suma por sí misma, no por 2.",
        ],
        [
          p.x + p.y ** 2,
          "power-on-one-term",
          "The power covers everything inside the parentheses.",
          "La potencia cubre todo lo que está dentro de los paréntesis.",
        ],
      ],
    },
    "ax2-b": {
      lv: [4, 4],
      tokens: (/** @type {any} */ p) => [
        { s: String(p.a) },
        { s: "x", v: "x", imp: 1 },
        { s: "²" },
        { s: "−" },
        { s: String(p.b) },
      ],
      value: (/** @type {any} */ p) => p.a * p.x ** 2 - p.b,
      traps: (/** @type {any} */ p) => [
        [
          (p.a * p.x) ** 2 - p.b,
          "power-on-coefficient",
          "The power applies only to x, not to the number in front of it.",
          "La potencia es solo de x, no del número que está delante.",
        ],
        [
          p.a * p.x * 2 - p.b,
          "doubled-not-squared",
          "x² means x × x, not x × 2.",
          "x² significa x × x, no x × 2.",
        ],
        [
          p.a * p.x ** 2 + p.b,
          "sign-flipped",
          "The expression subtracts. Check the sign.",
          "La expresión resta. Revisa el signo.",
        ],
      ],
    },
  });
  const exprText = (/** @type {any[]} */ toks) =>
    toks
      .reduce((out, t) => out + (t.imp || out === "" ? "" : " ") + t.s, "")
      .replace(/(\S)([+−])(\S)/g, "$1 $2 $3")
      .replace(/\( /g, "(")
      .replace(/ \)/g, ")")
      .replace(/ ²/g, "²");

  function make(/** @type {any} */ rng, /** @type {number} */ level) {
    const ids = Object.keys(TEMPLATES).filter(
      (k) => level >= TEMPLATES[k].lv[0] && level <= TEMPLATES[k].lv[1],
    );
    for (let t = 0; t < 200; t++) {
      const id = rng.pick(ids);
      const T = TEMPLATES[id];
      const p = {
        a: rng.int(2, 9),
        b: rng.int(1, 12),
        x: rng.int(2, level === 4 ? 8 : 9),
        y: rng.int(1, 6),
      };
      const v = T.value(p);
      if (v < 1) continue;
      const traps = T.traps(p).filter((/** @type {any} */ r) => r[0] !== v && r[0] >= 0);
      const vals = [...new Set([v, ...traps.map((/** @type {any} */ r) => r[0])])];
      if (vals.length < 4) continue;
      const tokens = T.tokens(p);
      const letters = [
        ...new Set(tokens.filter((/** @type {any} */ k) => k.v).map((/** @type {any} */ k) => k.v)),
      ];
      const given = letters.map((/** @type {string} */ l) => `${l} = ${p[l]}`).join(" and ");
      const givenEs = given.replace(" and ", " y ");
      const ex = exprText(tokens);
      return {
        model: {
          id,
          p,
          tokens,
          letters,
          vals: Object.fromEntries(letters.map((/** @type {string} */ l) => [l, p[l]])),
          v,
          traps: traps.map((/** @type {any} */ r) => ({
            v: r[0],
            tag: r[1],
            say: r[2],
            sayEs: r[3],
          })),
          chips: vals.sort((m, n) => m - n),
        },
        q: `Replace each letter in ${ex} with its value (${given}), then tap the value of the expression.`,
        qEs: `Reemplaza cada letra en ${ex} por su valor (${givenEs}), y luego toca el valor de la expresión.`,
        x: `Replace the letters (${given}), then follow the order of operations: ${ex} = ${v}.`,
        xEs: `Reemplaza las letras (${givenEs}) y sigue el orden de las operaciones: ${ex} = ${v}.`,
        h: [
          "Tap each letter to swap in its value. A number touching a letter or parentheses means multiply.",
          "Do powers and parentheses first, then multiply, then add or subtract.",
          "Check each step against the order of operations before you tap a value.",
        ],
        hEs: [
          "Toca cada letra para poner su valor. Un número junto a una letra o paréntesis significa multiplicar.",
          "Haz primero potencias y paréntesis, luego multiplica, luego suma o resta.",
          "Revisa cada paso con el orden de las operaciones antes de tocar un valor.",
        ],
      };
    }
    throw new Error("plug: no model");
  }

  const solution = (/** @type {any} */ spec) => ({
    rep: [...spec.model.letters],
    pick: spec.model.v,
  });
  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    return [
      ...m.traps.map((/** @type {any} */ r) => ({
        rep: [...m.letters],
        pick: r.v,
      })),
      { rep: [...m.letters], pick: null },
      { rep: [], pick: m.v },
    ];
  }
  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });
  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    const rep = (st && st.rep) || [];
    if (m.letters.some((/** @type {string} */ l) => !rep.includes(l)))
      return miss(
        "replace-first",
        "Swap in a value for every letter first. Tap each letter.",
        "Primero pon un valor en cada letra. Toca cada letra.",
      );
    const pick = st.pick;
    if (typeof pick !== "number")
      return miss(
        "none",
        "Now tap the value of the expression.",
        "Ahora toca el valor de la expresión.",
      );
    if (pick === m.v) return { ok: true };
    const trap = m.traps.find((/** @type {any} */ r) => r.v === pick);
    if (trap) return miss(trap.tag, trap.say, trap.sayEs);
    return miss(
      "arithmetic",
      "Check your arithmetic one step at a time, following the order of operations.",
      "Revisa tu aritmética paso a paso, siguiendo el orden de las operaciones.",
    );
  }

  // biome-ignore format: compact stylesheet
  const CSS = `
.sa-root{--sa-i:var(--ink,#1B2733);--sa-s:var(--surface,#fff);--sa-b:var(--brand,#2C4A68);--sa-bt:var(--brand-tint,#E5ECF3);--sa-bl:var(--brand-line,#BBCADA);--sa-sun:var(--sun,#F0BD4F);--sa-ok:var(--ok,#0A7D4B);--sa-bad:var(--bad,#B42318);--sa-bd:var(--border,#D5DCE5);--sa-dk:var(--brand-dark,#1B2C3F);--sa-r:var(--radius-md,14px);--sa-mute:#566475;--sa-okt:#E4F7EC;--sa-badt:#FDECEA;--sa-sunt:#FAF2DC;color:var(--sa-i);max-width:640px;margin:0 auto;font-family:inherit}
@supports (color:color-mix(in srgb,red,blue)){.sa-root{--sa-mute:color-mix(in srgb,var(--sa-i) 72%,var(--sa-s));--sa-okt:color-mix(in srgb,var(--sa-ok) 16%,var(--sa-s));--sa-badt:color-mix(in srgb,var(--sa-bad) 14%,var(--sa-s));--sa-sunt:color-mix(in srgb,var(--sa-sun) 32%,var(--sa-s))}}
.sa-root *{box-sizing:border-box}
.sa-root [hidden]{display:none!important}
.sa-root :focus-visible{outline:3px solid var(--sa-i);outline-offset:1px;box-shadow:0 0 0 5px var(--sa-sun)}
.sa-es{display:none;font-size:.82em;font-weight:600;color:var(--sa-b);line-height:1.25}
body.show-es .sa-es,.sa-root[data-es="1"] .sa-es{display:block}
.sa-btn{appearance:none;font:inherit;font-weight:800;min-height:44px;min-width:44px;padding:8px 14px;border-radius:var(--sa-r);border:2px solid var(--sa-bl);border-bottom-width:4px;background:var(--sa-s);color:var(--sa-b);cursor:pointer;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;text-align:center}
.sa-btn:hover:not([disabled]){background:var(--sa-bt);border-color:var(--sa-b)}
.sa-btn:active:not([disabled]){transform:translateY(2px);border-bottom-width:2px}
.sa-btn[disabled]{opacity:.5;cursor:not-allowed}
.sa-btn[aria-pressed="true"]{background:var(--sa-sunt);border-color:var(--sa-dk);box-shadow:inset 0 0 0 2px var(--sa-dk)}
.sa-btn.sa-go{background:var(--sa-b);color:var(--sa-s);border-color:var(--sa-dk)}
.sa-status{min-height:1.5em;margin:8px 0 0;font-weight:700;color:var(--sa-mute)}
.sa-status.sa-bad{color:var(--sa-bad)}
.sa-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0}
.pg-expr{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;font-size:1.7rem;font-weight:900;margin:8px 0;color:var(--sa-dk)}
.pg-expr .sa-btn{font-size:1.5rem;min-width:52px;border-style:dashed;background:var(--sa-sunt)}
.pg-val{display:inline-flex;min-width:48px;height:48px;padding:0 8px;align-items:center;justify-content:center;border-radius:12px;border:2px solid var(--sa-dk);background:var(--sa-sun)}
.pg-vals{text-align:center;font-weight:800;color:var(--sa-mute)}
.pg-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:10px 0}
.pg-chips .sa-btn{font-size:1.15rem;min-width:64px}
@media (forced-colors:active){.sa-btn{border-color:ButtonText}.sa-btn[aria-pressed="true"]{outline:3px solid Highlight}.pg-val{border-color:CanvasText}}
`;

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("plug", CSS);
    const m = spec.model;
    const ro = !!api.solved;
    const L = (/** @type {string} */ en, /** @type {string} */ es) =>
      api.es && api.es() ? es : en;
    const T = (/** @type {string} */ en, /** @type {string} */ es) =>
      `${en}<span class="sa-es" lang="es">${es}</span>`;
    const root = A.el("div", "sa-root");
    if (api.es?.()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({ rep: [], pick: null });
    if (api.restore) Object.assign(st, clone(api.restore));
    const emit = () => api.change?.(clone(st));
    const status = A.el("p", "sa-status");
    status.setAttribute("aria-live", "polite");
    const say = (/** @type {string} */ en, /** @type {string} */ es) => {
      status.innerHTML = T(en, es);
      api.say?.(L(en, es));
    };
    const expr = A.el("div", "pg-expr", "", {
      role: "group",
      "aria-label": L("Expression", "Expresión"),
    });
    const vals = A.el(
      "div",
      "pg-vals",
      m.letters.map((/** @type {string} */ l) => `${l} = ${m.vals[l]}`).join("  ·  "),
    );
    const chips = A.el("div", "pg-chips", "", { role: "group" });
    root.append(vals, expr, chips, status);
    for (const c of m.chips) {
      const b = A.el("button", "sa-btn", String(c), { type: "button", "aria-pressed": "false" });
      b.dataset.v = String(c);
      b.disabled = ro;
      b.addEventListener("click", () => {
        st.pick = c;
        paint();
        emit();
      });
      chips.append(b);
    }
    function paint() {
      const any = st.rep.length > 0;
      expr.replaceChildren(
        ...m.tokens.flatMap((/** @type {any} */ k) => {
          const out = [];
          const done = k.v && st.rep.includes(k.v);
          if (k.imp && (k.v ? done : any)) out.push(A.el("span", "", "×"));
          if (k.v && !done) {
            const b = A.el("button", "sa-btn", k.s, {
              type: "button",
              "aria-label": L(
                `Replace ${k.s} with ${m.vals[k.v]}`,
                `Reemplazar ${k.s} por ${m.vals[k.v]}`,
              ),
            });
            b.disabled = ro;
            b.addEventListener("click", () => {
              st.rep.push(k.v);
              paint();
              emit();
              say(`${k.s} is now ${m.vals[k.v]}.`, `${k.s} ahora es ${m.vals[k.v]}.`);
            });
            out.push(b);
          } else out.push(A.el("span", k.v ? "pg-val" : "", k.v ? String(m.vals[k.v]) : k.s));
          return out;
        }),
      );
      chips
        .querySelectorAll("button")
        .forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.v) === st.pick)));
    }
    if (!ro) {
      const chk = A.el("button", "sa-btn sa-go", T("Check", "Comprobar"), {
        type: "button",
        "aria-label": L("Check my answer", "Comprobar mi respuesta"),
      });
      chk.addEventListener("click", () => api.submit?.(clone(st)));
      const reset = A.el("button", "sa-btn", T("Start over", "Empezar de nuevo"), {
        type: "button",
      });
      reset.addEventListener("click", () => {
        st.rep = [];
        st.pick = null;
        paint();
        emit();
      });
      const r = A.el("div", "sa-row");
      r.append(chk, reset);
      root.append(r);
    }
    paint();
    if (ro) say("Solved.", "Resuelto.");
  }

  A.register("plug", {
    title: "Plug in",
    titleEs: "Sustituye",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();
