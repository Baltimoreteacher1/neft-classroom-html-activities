/**
 * Practice Studio activity: powers (an exponent counts equal factors, 6.EE.1).
 * Modes: expand (add factors of the base until the repeated multiplication matches the power), value (build the
 * factors, work out the value yourself, tap it), factors (read a product of equal factors, set base and exponent),
 * open (set a base and exponent whose power equals a target; several answers are right).
 * State: { n: factors placed, pick: number | null, b: base, e: exponent }. No timers.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const clone = (/** @type {any} */ o) => JSON.parse(JSON.stringify(o));
  const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
  const sup = (/** @type {number} */ n) =>
    String(n)
      .split("")
      .map((d) => SUP[Number(d)])
      .join("");
  const pw = (/** @type {number} */ b, /** @type {number} */ e) => b ** e;
  const OPEN = [16, 64, 81, 256, 512, 625, 729, 1024, 1296, 4096];
  const VERBS = [
    ["Build", "Construye"],
    ["Show", "Muestra"],
    ["Model", "Modela"],
    ["Stack up", "Arma"],
    ["Make", "Haz"],
    ["Set up", "Prepara"],
  ];
  const reps = (/** @type {number} */ N) => {
    const out = [];
    for (let e = 2; e <= 12; e++) {
      const b = Math.round(N ** (1 / e));
      if (b >= 2 && pw(b, e) === N) out.push([b, e]);
    }
    return out;
  };
  const times = (/** @type {number} */ b, /** @type {number} */ n) =>
    n < 1 ? "" : Array.from({ length: n }, () => b).join(" × ");

  function make(/** @type {any} */ rng, /** @type {number} */ level, /** @type {any} */ params) {
    const mode =
      params.mode ||
      (level === 1 ? "expand" : level === 2 ? "value" : level === 3 ? "value" : "write");
    const [vEn, vEs] = rng.pick(VERBS);
    const spec = /** @type {any} */ ({ mode });
    if (mode === "expand" || mode === "value") {
      const b = level === 1 ? rng.int(2, 9) : level === 2 ? rng.int(2, 9) : rng.int(2, 10);
      const e = level === 1 ? rng.int(2, 3) : level === 2 ? rng.int(3, 4) : rng.int(2, 5);
      const v = pw(b, e);
      spec.model = { b, e, v };
      if (mode === "expand") {
        spec.q = `${vEn} ${b}${sup(e)} as repeated multiplication. Add factors until it matches the power.`;
        spec.qEs = `${vEs} ${b}${sup(e)} como multiplicación repetida. Agrega factores hasta que coincida con la potencia.`;
        spec.x = `${b}${sup(e)} means ${b} used as a factor ${e} times: ${times(b, e)} = ${v}. The exponent counts the factors; the base is the factor.`;
        spec.xEs = `${b}${sup(e)} significa ${b} usado como factor ${e} veces: ${times(b, e)} = ${v}. El exponente cuenta los factores; la base es el factor.`;
        spec.h = [
          "The small raised number is the exponent. It tells how many copies of the base to multiply.",
          "The big number is the base. Each tile you add is one copy of it.",
          "Compare your tiles with the exponent. Do you have the same count?",
        ];
        spec.hEs = [
          "El número pequeño elevado es el exponente. Dice cuántas copias de la base se multiplican.",
          "El número grande es la base. Cada ficha que agregas es una copia.",
          "Compara tus fichas con el exponente. ¿Tienes la misma cantidad?",
        ];
        return spec;
      }
      const chips = [...new Set([v, b * e, pw(b, e - 1), pw(e, b)])].sort((x, y) => x - y);
      if (chips.length < 4) chips.push(v + b);
      spec.model.chips = [...new Set(chips)].sort((x, y) => x - y);
      spec.q = `${vEn} the factors for ${b}${sup(e)}, work out its value, then tap the value.`;
      spec.qEs = `${vEs} los factores de ${b}${sup(e)}, calcula su valor y luego toca el valor.`;
      spec.x = `${b}${sup(e)} = ${times(b, e)} = ${v}. It is NOT ${b} × ${e}: the exponent says how many times ${b} is a factor.`;
      spec.xEs = `${b}${sup(e)} = ${times(b, e)} = ${v}. NO es ${b} × ${e}: el exponente dice cuántas veces ${b} es factor.`;
      spec.h = [
        "Place the factors first. The exponent tells you how many.",
        "Multiply the factors two at a time, left to right.",
        "Check that you multiplied the base by itself, not by the exponent.",
      ];
      spec.hEs = [
        "Primero coloca los factores. El exponente dice cuántos.",
        "Multiplica los factores de dos en dos, de izquierda a derecha.",
        "Verifica que multiplicaste la base por sí misma, no por el exponente.",
      ];
      return spec;
    }
    const open = rng.chance(0.35);
    if (open) {
      const N = rng.pick(OPEN);
      spec.model = { open: true, v: N, reps: reps(N) };
      spec.q = `Make ${N} as a power. Set a base and an exponent (at least 2) so the power equals ${N}. More than one answer works.`;
      spec.qEs = `Forma ${N} como potencia. Elige una base y un exponente (al menos 2) para que la potencia sea ${N}. Sirve más de una respuesta.`;
      spec.x = `${spec.model.reps.map((/** @type {number[]} */ r) => `${r[0]}${sup(r[1])}`).join(" and ")} all equal ${N}. A number can be written as a power in more than one way.`;
      spec.xEs = `${spec.model.reps.map((/** @type {number[]} */ r) => `${r[0]}${sup(r[1])}`).join(" y ")} son iguales a ${N}. Un número se puede escribir como potencia de más de una manera.`;
      spec.h = [
        "Try a small base. How many times must you multiply it to reach the target?",
        "If the value is too small, add a factor. If it is too big, remove one or change the base.",
        "Some bases never land exactly. Try a different base.",
      ];
      spec.hEs = [
        "Prueba una base pequeña. ¿Cuántas veces la multiplicas para llegar a la meta?",
        "Si el valor es muy chico, agrega un factor. Si es muy grande, quita uno o cambia la base.",
        "Algunas bases nunca llegan exacto. Prueba otra base.",
      ];
      return spec;
    }
    let b = rng.int(2, 15);
    let e = rng.int(2, 7);
    if (b === e) e = e === 7 ? 6 : e + 1;
    spec.model = { b, e, v: pw(b, e) };
    spec.q = `Write ${times(b, e)} as a power. Set the base and the exponent.`;
    spec.qEs = `Escribe ${times(b, e)} como potencia. Elige la base y el exponente.`;
    spec.x = `${times(b, e)} has ${e} equal factors of ${b}, so it is ${b}${sup(e)}. The base is the repeated factor; the exponent counts them.`;
    spec.xEs = `${times(b, e)} tiene ${e} factores iguales de ${b}, así que es ${b}${sup(e)}. La base es el factor repetido; el exponente los cuenta.`;
    spec.h = [
      "Which number is being multiplied by itself? That is the base.",
      "Count how many times that number appears. That is the exponent.",
      "Read your power back as repeated multiplication and compare.",
    ];
    spec.hEs = [
      "¿Qué número se multiplica por sí mismo? Esa es la base.",
      "Cuenta cuántas veces aparece ese número. Ese es el exponente.",
      "Lee tu potencia como multiplicación repetida y compara.",
    ];
    return spec;
  }

  function solution(/** @type {any} */ spec) {
    const m = spec.model;
    if (spec.mode === "expand") return { n: m.e, pick: null, b: 2, e: 2 };
    if (spec.mode === "value") return { n: m.e, pick: m.v, b: 2, e: 2 };
    if (m.open) return { n: 0, pick: null, b: m.reps[0][0], e: m.reps[0][1] };
    return { n: 0, pick: null, b: m.b, e: m.e };
  }

  const miss = (
    /** @type {string} */ tag,
    /** @type {string} */ say,
    /** @type {string} */ sayEs,
  ) => ({ ok: false, tag, say, sayEs });

  function grade(/** @type {any} */ spec, /** @type {any} */ st) {
    const m = spec.model;
    st = st || {};
    if (spec.mode === "expand") {
      const n = st.n || 0;
      if (n < 1) return miss("none", "Add a factor first.", "Primero agrega un factor.");
      if (n === m.b && n !== m.e)
        return miss(
          "swap-base-exp",
          `You used ${n} factors. The base ${m.b} is the factor; the exponent is how many factors to use.`,
          `Usaste ${n} factores. La base ${m.b} es el factor; el exponente dice cuántos factores usar.`,
        );
      if (n < m.e)
        return miss(
          "too-few",
          "Not enough factors yet. Compare your tiles with the exponent.",
          "Todavía faltan factores. Compara tus fichas con el exponente.",
        );
      if (n > m.e)
        return miss(
          "too-many",
          "That is more factors than the exponent asks for. Compare your tiles with the exponent.",
          "Son más factores de los que pide el exponente. Compara tus fichas con el exponente.",
        );
      return { ok: true };
    }
    if (spec.mode === "value") {
      const p = st.pick;
      if (typeof p !== "number")
        return miss("none", "Work out the value, then tap it.", "Calcula el valor y luego tócalo.");
      if (p === m.v) return { ok: true };
      if (p === m.b * m.e)
        return miss(
          "multiplied-base-exp",
          `That is ${m.b} × ${m.e}. The exponent does not multiply; it counts how many times ${m.b} is a factor.`,
          `Eso es ${m.b} × ${m.e}. El exponente no multiplica; cuenta cuántas veces ${m.b} es factor.`,
        );
      if (p === pw(m.e, m.b))
        return miss(
          "swap-base-exp",
          "It looks like the base and the exponent traded places. Which number is the repeated factor?",
          "Parece que la base y el exponente se cambiaron. ¿Qué número es el factor que se repite?",
        );
      if (p === pw(m.b, m.e - 1))
        return miss(
          "one-short",
          "That is one factor short. Count your factors against the exponent.",
          "Falta un factor. Cuenta tus factores y compáralos con el exponente.",
        );
      return miss(
        "arithmetic",
        "Multiply the factors two at a time and check each step.",
        "Multiplica los factores de dos en dos y revisa cada paso.",
      );
    }
    const b = st.b;
    const e = st.e;
    if (!Number.isInteger(b) || !Number.isInteger(e))
      return miss("none", "Set a base and an exponent.", "Elige una base y un exponente.");
    if (m.open) {
      if (e < 2)
        return miss(
          "exp-one",
          "An exponent of 1 only gives the base back. Use an exponent of 2 or more.",
          "Un exponente de 1 solo devuelve la base. Usa un exponente de 2 o más.",
        );
      if (pw(b, e) === m.v) return { ok: true };
      return miss(
        "not-equal",
        `${b}${sup(e)} is ${pw(b, e)}, which is not the target. Change the base or the number of factors.`,
        `${b}${sup(e)} es ${pw(b, e)}, que no es la meta. Cambia la base o la cantidad de factores.`,
      );
    }
    if (b === m.b && e === m.e) return { ok: true };
    if (b === m.e && e === m.b)
      return miss(
        "swap-base-exp",
        "The base and the exponent traded places. The base is the repeated factor.",
        "La base y el exponente se cambiaron. La base es el factor que se repite.",
      );
    if (b !== m.b)
      return miss(
        "wrong-base",
        "Look at the repeated factor in the product. That number is the base.",
        "Mira el factor que se repite en el producto. Ese número es la base.",
      );
    return miss(
      "wrong-exp",
      "Count how many equal factors the product has. That count is the exponent.",
      "Cuenta cuántos factores iguales tiene el producto. Esa cantidad es el exponente.",
    );
  }

  function wrong(/** @type {any} */ spec) {
    const m = spec.model;
    const cands = [];
    if (spec.mode === "expand") cands.push({ n: 0 }, { n: m.e - 1 }, { n: m.e + 1 }, { n: m.b });
    else if (spec.mode === "value")
      cands.push(
        { n: m.e, pick: m.b * m.e },
        { n: m.e, pick: pw(m.e, m.b) },
        { n: m.e, pick: pw(m.b, m.e - 1) },
        { n: m.e, pick: null },
      );
    else if (m.open)
      cands.push(
        { b: m.v, e: 1 },
        { b: 2, e: 1 },
        { b: m.reps[0][0] + 1, e: m.reps[0][1] },
        {
          b: m.reps[0][0],
          e: 1,
        },
      );
    else
      cands.push(
        { b: m.e, e: m.b },
        { b: m.b, e: m.e + 1 },
        { b: m.b + 1, e: m.e },
        { b: m.b, e: m.e - 1 },
      );
    const base = { n: 0, pick: null, b: 2, e: 2 };
    return cands
      .map((c) => ({ ...base, ...c }))
      .filter((s) => !grade(spec, s).ok)
      .filter((s, i, a) => a.findIndex((t) => JSON.stringify(t) === JSON.stringify(s)) === i);
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
.pw-target{font-size:2.2rem;font-weight:900;text-align:center;margin:4px 0;color:var(--sa-dk)}
.pw-line{font-size:1.15rem;font-weight:800;text-align:center;min-height:1.6em;margin:2px 0 6px;overflow-wrap:anywhere}
.pw-tiles{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:60px;padding:10px;border:2px dashed var(--sa-bl);border-radius:var(--sa-r);background:var(--sa-bt)}
.pw-tile{min-width:48px;height:48px;padding:0 8px;display:inline-flex;align-items:center;justify-content:center;border-radius:12px;border:2px solid var(--sa-dk);background:var(--sa-sun);color:var(--sa-dk);font-weight:900;font-size:1.2rem}
.pw-step{display:flex;align-items:center;gap:8px;font-weight:800}
.pw-step output{min-width:2.2em;text-align:center;font-size:1.5rem;font-weight:900}
.pw-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:8px 0}
.pw-chips .sa-btn{font-size:1.15rem;min-width:64px}
@media (prefers-reduced-motion:no-preference){.pw-tile{animation:pw-pop .18s ease-out}@keyframes pw-pop{from{transform:scale(.6)}to{transform:scale(1)}}}
@media (forced-colors:active){.sa-btn{border-color:ButtonText}.sa-btn[aria-pressed="true"]{outline:3px solid Highlight}.pw-tile{border-color:CanvasText}}
`;

  function mount(/** @type {HTMLElement} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    A.css("powers", CSS);
    const m = spec.model;
    const ro = !!api.solved;
    const L = (/** @type {string} */ en, /** @type {string} */ es) =>
      api.es && api.es() ? es : en;
    const T = (/** @type {string} */ en, /** @type {string} */ es) =>
      `${en}<span class="sa-es" lang="es">${es}</span>`;
    const root = A.el("div", "sa-root");
    if (api.es?.()) root.setAttribute("data-es", "1");
    host.replaceChildren(root);
    const st = /** @type {any} */ ({ n: 0, pick: null, b: 2, e: 2 });
    if (api.restore) Object.assign(st, clone(api.restore));
    const emit = () => api.change?.(clone(st));
    const status = A.el("p", "sa-status");
    status.setAttribute("aria-live", "polite");
    const say = (/** @type {string} */ en, /** @type {string} */ es) => {
      status.innerHTML = T(en, es);
      api.say?.(L(en, es));
    };
    const builds = spec.mode === "expand" || spec.mode === "value";
    const target = A.el("div", "pw-target");
    const line = A.el("div", "pw-line");
    const tiles = A.el("div", "pw-tiles", "", { role: "group" });
    const ctrl = A.el("div", "sa-row");
    const chipBox = A.el("div", "pw-chips", "", { role: "group" });
    if (builds) {
      target.textContent = `${m.b}${sup(m.e)}`;
      target.setAttribute("aria-label", `${m.b} to the power ${m.e}`);
      root.append(target, tiles, line, ctrl);
    } else {
      if (!m.open) {
        target.textContent = times(m.b, m.e);
        target.style.fontSize = "1.5rem";
        target.style.overflowWrap = "anywhere";
        root.append(target);
      } else {
        target.textContent = String(m.v);
        root.append(target);
      }
      root.append(line, ctrl);
    }
    const stepper = (
      /** @type {string} */ key,
      /** @type {string} */ en,
      /** @type {string} */ es,
      /** @type {number} */ lo,
      /** @type {number} */ hi,
    ) => {
      const wrap = A.el("div", "pw-step");
      const out = A.el("output", "", "", { "aria-live": "polite" });
      const mk = (/** @type {number} */ d, /** @type {string} */ sym) => {
        const b = A.el("button", "sa-btn", sym, {
          type: "button",
          "aria-label": L(
            `${d > 0 ? "More" : "Less"} ${en.toLowerCase()}`,
            `${d > 0 ? "Más" : "Menos"} ${es.toLowerCase()}`,
          ),
        });
        b.disabled = ro;
        b.addEventListener("click", () => {
          st[key] = Math.max(lo, Math.min(hi, st[key] + d));
          paint();
          emit();
        });
        return b;
      };
      const lab = A.el("span", "", T(en, es));
      wrap.append(lab, mk(-1, "−"), out, mk(1, "+"));
      wrap._out = out;
      wrap._key = key;
      return wrap;
    };
    let steppers = /** @type {any[]} */ ([]);
    if (builds) {
      const add = A.el("button", "sa-btn", T(`+ × ${m.b}`, `+ × ${m.b}`), {
        type: "button",
        "aria-label": L(`Add a factor of ${m.b}`, `Agregar un factor de ${m.b}`),
      });
      const del = A.el("button", "sa-btn", T("− Remove", "− Quitar"), { type: "button" });
      const reset = A.el("button", "sa-btn", T("Start over", "Empezar de nuevo"), {
        type: "button",
      });
      add.disabled = del.disabled = reset.disabled = ro;
      add.addEventListener("click", () => {
        st.n = Math.min(8, st.n + 1);
        paint();
        emit();
        say(
          `${st.n} factor${st.n === 1 ? "" : "s"} of ${m.b}.`,
          `${st.n} factor${st.n === 1 ? "" : "es"} de ${m.b}.`,
        );
      });
      del.addEventListener("click", () => {
        st.n = Math.max(0, st.n - 1);
        paint();
        emit();
      });
      reset.addEventListener("click", () => {
        st.n = 0;
        st.pick = null;
        paint();
        emit();
        say("Started over.", "Empezamos de nuevo.");
      });
      ctrl.append(add, del, reset);
      if (spec.mode === "value") {
        for (const c of m.chips) {
          const b = A.el("button", "sa-btn", String(c), {
            type: "button",
            "aria-pressed": "false",
          });
          b.dataset.v = String(c);
          b.disabled = ro;
          b.addEventListener("click", () => {
            st.pick = c;
            paint();
            emit();
          });
          chipBox.append(b);
        }
        root.append(chipBox);
      }
    } else {
      steppers = [
        stepper("b", "Base", "Base", 2, 64),
        stepper("e", "Exponent", "Exponente", 1, 12),
      ];
      for (const s of steppers) ctrl.append(s);
    }
    root.append(status);
    function paint() {
      if (builds) {
        tiles.replaceChildren(
          ...Array.from({ length: st.n }, () => A.el("span", "pw-tile", String(m.b))),
        );
        const f = times(m.b, st.n);
        line.textContent = spec.mode === "expand" && st.n ? `${f} = ${m.b ** st.n}` : f || "";
        if (spec.mode === "value")
          chipBox.querySelectorAll("button").forEach((b) => {
            b.setAttribute("aria-pressed", String(Number(b.dataset.v) === st.pick));
          });
      } else {
        for (const s of steppers) s._out.textContent = String(st[s._key]);
        const p = `${st.b}${sup(st.e)}`;
        line.textContent = m.open
          ? `${p} = ${times(st.b, Math.min(st.e, 6))}${st.e > 6 ? " × …" : ""} = ${pw(st.b, st.e)}`
          : p;
      }
    }
    if (!ro) {
      const chk = A.el("button", "sa-btn sa-go", T("Check", "Comprobar"), {
        type: "button",
        "aria-label": L("Check my answer", "Comprobar mi respuesta"),
      });
      chk.addEventListener("click", () => api.submit?.(clone(st)));
      const r = A.el("div", "sa-row");
      r.append(chk);
      root.append(r);
    }
    paint();
    if (ro) say("Solved.", "Resuelto.");
  }

  A.register("powers", {
    title: "Powers",
    titleEs: "Potencias",
    levels: 4,
    make,
    solution,
    wrong,
    grade,
    mount,
  });
})();
