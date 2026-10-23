/**
 * Practice Studio activity: barcompare (lesson 3-5, "Compare Ratios").
 *
 * Two mixtures are drawn as rows of unit bars: SOLID cells for the first ingredient and STRIPED cells for the second (pattern, never
 * colour, tells them apart). To say which mixture is stronger, the student first picks an amount of the second ingredient that both
 * mixtures reach by adding whole copies; the bars then show each mixture at that amount, and the student chooses the stronger one or
 * "the same". A miss names the missing step (the comparison used different amounts of the second ingredient) and never says which mix
 * wins. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /** first ingredient, second ingredient, "stronger" word, each [English, Spanish]; cell names are cups */
  const CTX = [
    {
      a: ["juice", "jugo"],
      b: ["water", "agua"],
      adj: ["tastes more like juice", "sabe más a jugo"],
    },
    {
      a: ["blue paint", "pintura azul"],
      b: ["white paint", "pintura blanca"],
      adj: ["is the darker blue", "es el azul más oscuro"],
    },
    {
      a: ["plant food", "alimento para plantas"],
      b: ["water", "agua"],
      adj: ["is stronger", "es más fuerte"],
    },
  ];
  const SAY = {
    basis:
      "The two mixes do not have the same amount of {b} yet. Pick an amount of {b} that both mixes reach by adding whole copies, then compare.|Las dos mezclas todavía no tienen la misma cantidad de {b}. Elige una cantidad de {b} que ambas mezclas alcanzan agregando copias completas y luego compara.",
    pick: "Now choose which mix {adj}, or the same.|Ahora elige qué mezcla {adj}, o igual.",
    raw: "That mix has more {a} in its small bars, but the mixes did not have the same amount of {b} there. Compare the {a} at the matched amount of {b}.|Esa mezcla tiene más {a} en sus barras pequeñas, pero allí las mezclas no tenían la misma cantidad de {b}. Compara el {a} con la cantidad igualada de {b}.",
    same: "Count the {a} cells in each mix at the matched amount of {b}. Are the counts really equal?|Cuenta las celdas de {a} en cada mezcla con la cantidad igualada de {b}. ¿De verdad son iguales los conteos?",
    other:
      "Look at the {a} cells in each mix at the matched amount of {b}. Which count is bigger?|Mira las celdas de {a} en cada mezcla con la cantidad igualada de {b}. ¿Qué conteo es mayor?",
  };
  const HINTS = [
    "Compare the first ingredient only when both mixes have the same amount of the second ingredient.|Compara el primer ingrediente solo cuando ambas mezclas tienen la misma cantidad del segundo ingrediente.",
    "Copy each mix again and again until its striped cells reach the same total as the other mix.|Copia cada mezcla una y otra vez hasta que sus celdas rayadas lleguen al mismo total que la otra mezcla.",
    "At the matched amount, the mix with more solid cells is the stronger one. Equal solid cells mean the same mix.|Con la cantidad igualada, la mezcla con más celdas sólidas es la más fuerte. Si las celdas sólidas son iguales, las mezclas son iguales.",
  ];
  const EXPLAIN =
    "To compare two ratios, give both the same second term. Then the mix with more of the first ingredient is stronger, and equal amounts mean the same ratio.|Para comparar dos razones, dales el mismo segundo término. Entonces la mezcla con más del primer ingrediente es más fuerte, y cantidades iguales significan la misma razón.";

  const fillT = (/** @type {string} */ t, /** @type {any} */ c, /** @type {boolean} */ es) =>
    t
      .replace(/\{a\}/g, c.a[es ? 1 : 0])
      .replace(/\{b\}/g, c.b[es ? 1 : 0])
      .replace(/\{adj\}/g, c.adj[es ? 1 : 0]);
  const truthOf = (/** @type {any} */ M) => {
    const l = M.c1 * M.w2;
    const r = M.c2 * M.w1;
    return l > r ? "A" : l < r ? "B" : "same";
  };
  const isCommon = (/** @type {any} */ M, /** @type {number} */ n) =>
    Number.isInteger(n) && n > 0 && n % M.w1 === 0 && n % M.w2 === 0;

  A.register("barcompare", {
    title: "Stack the bars",
    titleEs: "Apila las barras",
    levels: 4,
    make(rng, level) {
      const ctxIdx = rng.int(0, CTX.length - 1);
      let w1;
      let w2;
      let c1;
      let c2;
      for (;;) {
        if (level === 1) w1 = w2 = rng.int(3, 8);
        else if (level === 2) {
          w1 = rng.int(2, 4);
          w2 = w1 * rng.int(2, 3);
          if (rng.chance(0.5)) [w1, w2] = [w2, w1];
        } else {
          w1 = rng.int(2, 6);
          w2 = rng.int(2, 6);
        }
        if (level >= 3 && w1 === w2) continue;
        c1 = rng.int(2, 3 + w1 + level);
        c2 = rng.int(2, 3 + w2 + level);
        const l = G.lcm(w1, w2);
        if (l > 30) continue;
        const same = c1 * w2 === c2 * w1;
        if (same && !(level === 4 && rng.chance(0.5))) continue;
        // from level 2 on, the mix with more first-ingredient cells in the small bars should often be the weaker one
        if (level >= 2 && !same && c1 !== c2 && c1 > c2 === c1 * w2 > c2 * w1 && rng.chance(0.6))
          continue;
        break;
      }
      const M = { c1, w1, c2, w2, ctx: ctxIdx, lcm: G.lcm(w1, w2) };
      const c = CTX[ctxIdx];
      const q = `Mix A has ${c1} cups of ${c.a[0]} and ${w1} cups of ${c.b[0]}. Mix B has ${c2} cups of ${c.a[0]} and ${w2} cups of ${c.b[0]}. Which mix ${c.adj[0]}? Match the ${c.b[0]} first, then compare.`;
      const qEs = `La mezcla A tiene ${c1} tazas de ${c.a[1]} y ${w1} tazas de ${c.b[1]}. La mezcla B tiene ${c2} tazas de ${c.a[1]} y ${w2} tazas de ${c.b[1]}. ¿Qué mezcla ${c.adj[1]}? Primero iguala el ${c.b[1]} y luego compara.`;
      const [x, xEs] = EXPLAIN.split("|");
      const hs = HINTS.map((t) => t.split("|"));
      // amounts of the second ingredient to try: a common one, a bigger common one, and two that one mix cannot reach
      const tiles = new Set([M.lcm]);
      if (M.lcm * 2 <= 36) tiles.add(M.lcm * 2);
      for (let n = Math.max(w1, w2) + 1; tiles.size < 4 && n < 40; n++)
        if (!isCommon(M, n)) tiles.add(n);
      return {
        q,
        qEs,
        x,
        xEs,
        h: hs.map((t) => t[0]),
        hEs: hs.map((t) => t[1]),
        model: { ...M, tiles: rng.shuffle([...tiles]).sort((p, r) => p - r) },
      };
    },
    solution: (spec) => ({ n: spec.model.lcm, pick: truthOf(spec.model) }),
    wrong(spec) {
      const M = spec.model;
      const t = truthOf(M);
      const bad = M.tiles.find((/** @type {number} */ n) => !isCommon(M, n));
      const wrongPick = ["A", "B", "same"].find((p) => p !== t);
      return [
        { n: null, pick: t },
        { n: bad ?? 1, pick: t },
        { n: M.lcm, pick: null },
        { n: M.lcm, pick: wrongPick },
      ];
    },
    grade(spec, st) {
      const M = spec.model;
      const c = CTX[M.ctx];
      const truth = truthOf(M);
      const no = (/** @type {string} */ key, /** @type {string} */ tag) => {
        const [en, es] = SAY[/** @type {"basis"} */ (key)].split("|");
        return {
          ok: false,
          tag,
          say: fillT(en, c, false),
          sayEs: fillT(es, c, true),
          right: 0,
          of: 2,
          marks: [false, false],
        };
      };
      if (!isCommon(M, st?.n)) return no("basis", "ratio-compared-without-common-basis");
      if (!["A", "B", "same"].includes(st.pick))
        return { ...no("pick", "incomplete"), right: 1, marks: [true, false] };
      if (st.pick === truth) return { ok: true, right: 2, of: 2, marks: [true, true] };
      const rawBigger = M.c1 > M.c2 ? "A" : M.c1 < M.c2 ? "B" : "same";
      const key =
        st.pick !== "same" && st.pick === rawBigger ? "raw" : st.pick === "same" ? "same" : "other";
      return {
        ...no(
          key,
          key === "raw"
            ? "ratio-compared-without-common-basis"
            : key === "same"
              ? "compare-assumed-equal"
              : "compare-direction-reversed",
        ),
        right: 1,
        marks: [true, false],
      };
    },
    mount: (host, spec, api) => mountBars(host, spec, api),
  });

  const CSS = `
.bc-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.bc-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:44px;min-width:44px;padding:4px 14px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.bc-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.bc-btn:disabled{opacity:.45;cursor:not-allowed}
.bc-btn[aria-checked="true"]{background:var(--brand-tint,#E5ECF3);box-shadow:inset 0 0 0 3px var(--brand,#2C4A68)}
.bc-btn:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.bc-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.bc-h{margin:0;font-weight:800}
.bc-mix{border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px;display:grid;gap:6px;background:var(--surface,#fff)}
.bc-row{display:flex;flex-wrap:wrap;gap:3px}
.bc-c{width:20px;height:24px;border:2px solid var(--brand,#2C4A68);border-radius:3px;box-sizing:border-box}
.bc-c.a{background:var(--brand,#2C4A68)}
.bc-c.b{background:repeating-linear-gradient(45deg,var(--brand,#2C4A68) 0 3px,var(--surface,#fff) 3px 7px)}
.bc-legend{display:flex;flex-wrap:wrap;gap:12px;font-weight:700}
.bc-sw{display:inline-block;width:22px;height:16px;border:2px solid var(--brand,#2C4A68);border-radius:3px;vertical-align:middle;margin-right:6px}
.bc-sw.a{background:var(--brand,#2C4A68)}
.bc-sw.b{background:repeating-linear-gradient(45deg,var(--brand,#2C4A68) 0 3px,var(--surface,#fff) 3px 7px)}
.bc-group{display:flex;flex-wrap:wrap;gap:10px}
.bc-note{padding:8px 12px;border-radius:12px;background:var(--brand-tint,#E5ECF3);font-weight:700}
.bc-act{display:flex;flex-wrap:wrap;gap:10px}
@media (forced-colors:active){.bc-btn,.bc-mix,.bc-c{border-color:ButtonText}}
`;

  function mountBars(
    /** @type {HTMLElement} */ host,
    /** @type {any} */ spec,
    /** @type {any} */ api,
  ) {
    A.css("barcompare", CSS);
    const M = spec.model;
    const C = CTX[M.ctx];
    const ro = !!api.solved;
    const es = () => !!api.es?.();
    const L = (/** @type {string} */ en, /** @type {string} */ e) => (es() ? e : en);
    const B = (/** @type {string} */ en, /** @type {string} */ e) => A.t(en, e);
    const h = (/** @type {string} */ tg, cls = "", html = "", at = {}) =>
      /** @type {any} */ (A.el(tg, cls, html, at));
    const nm = (/** @type {any[]} */ pair) => pair[es() ? 1 : 0];
    /** @type {{n: number|null, pick: string|null}} */
    let st = api.restore ? JSON.parse(JSON.stringify(api.restore)) : { n: null, pick: null };
    const save = (/** @type {string=} */ msg) => {
      api.change?.(JSON.parse(JSON.stringify(st)));
      if (msg) api.say?.(msg);
      draw();
    };
    host.textContent = "";
    const root = h("div", "bc-root");
    const body = h("div", "bc-root");
    root.append(body);
    host.append(root);
    const btn = (
      /** @type {string} */ html,
      /** @type {() => void} */ fn,
      cls = "",
      label = "",
      dis = ro,
    ) => {
      const b = h("button", `bc-btn ${cls}`, html, { type: "button" });
      if (label) b.setAttribute("aria-label", label);
      b.disabled = dis;
      b.addEventListener("click", fn);
      return b;
    };
    const cells = (/** @type {number} */ n, /** @type {string} */ kind) =>
      Array.from({ length: n }, () => `<span class="bc-c ${kind}"></span>`).join("");
    const mixCard = (
      /** @type {string} */ name,
      /** @type {number} */ c,
      /** @type {number} */ w,
      /** @type {number|null} */ at,
    ) => {
      const box = h("div", "bc-mix");
      box.append(
        h(
          "p",
          "bc-h",
          B(
            `Mix ${name}: ${c} ${C.a[0]}, ${w} ${C.b[0]}`,
            `Mezcla ${name}: ${c} ${C.a[1]}, ${w} ${C.b[1]}`,
          ),
        ),
      );
      box.append(
        h("div", "bc-row", cells(c, "a"), {
          role: "img",
          "aria-label": L(`${c} cells of ${C.a[0]}`, `${c} celdas de ${C.a[1]}`),
        }),
      );
      box.append(
        h("div", "bc-row", cells(w, "b"), {
          role: "img",
          "aria-label": L(`${w} cells of ${C.b[0]}`, `${w} celdas de ${C.b[1]}`),
        }),
      );
      if (at && isCommon(M, at)) {
        const k = at / w;
        box.append(
          h(
            "p",
            "bc-note",
            B(
              `Copied ${k} ${k === 1 ? "time" : "times"}: ${c * k} ${C.a[0]} with ${at} ${C.b[0]}`,
              `Copiada ${k} ${k === 1 ? "vez" : "veces"}: ${c * k} de ${C.a[1]} con ${at} de ${C.b[1]}`,
            ),
          ),
        );
        box.append(
          h("div", "bc-row", cells(c * k, "a"), {
            role: "img",
            "aria-label": L(`${c * k} cells of ${C.a[0]}`, `${c * k} celdas de ${C.a[1]}`),
          }),
        );
        box.append(
          h("div", "bc-row", cells(at, "b"), {
            role: "img",
            "aria-label": L(`${at} cells of ${C.b[0]}`, `${at} celdas de ${C.b[1]}`),
          }),
        );
      } else if (at)
        box.append(
          h(
            "p",
            "bc-note",
            B(
              `Whole copies of this mix cannot make exactly ${at} ${C.b[0]}.`,
              `Copias completas de esta mezcla no pueden formar exactamente ${at} de ${C.b[1]}.`,
            ),
          ),
        );
      return box;
    };
    const radio = (
      /** @type {string} */ label,
      /** @type {[string, string, string][]} */ opts,
      /** @type {string} */ key,
    ) => {
      const g = h("div", "bc-group", "", { role: "radiogroup", "aria-label": label });
      for (const [val, en, e] of opts) {
        const b = btn(
          B(en, e),
          () => {
            /** @type {any} */ (st)[key] = val;
            save();
          },
          "",
          L(en, e),
        );
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(/** @type {any} */ (st)[key] === val));
        g.append(b);
      }
      return g;
    };

    function draw() {
      const focus = document.activeElement?.getAttribute?.("aria-label");
      body.textContent = "";
      const lg = h("div", "bc-legend");
      lg.innerHTML = `<span><span class="bc-sw a"></span>${B(`solid = ${C.a[0]}`, `sólido = ${C.a[1]}`)}</span><span><span class="bc-sw b"></span>${B(`striped = ${C.b[0]}`, `rayado = ${C.b[1]}`)}</span>`;
      body.append(lg);
      body.append(mixCard("A", M.c1, M.w1, st.n), mixCard("B", M.c2, M.w2, st.n));
      body.append(
        h(
          "p",
          "bc-h",
          B(`1. Match the ${C.b[0]}: pick an amount`, `1. Iguala el ${C.b[1]}: elige una cantidad`),
        ),
      );
      const g = h("div", "bc-group", "", {
        role: "radiogroup",
        "aria-label": L("Amount to match", "Cantidad para igualar"),
      });
      for (const n of M.tiles) {
        const b = btn(
          String(n),
          () => ((st.n = n), save()),
          "",
          L(`${n} cups of ${nm(C.b)}`, `${n} tazas de ${nm(C.b)}`),
        );
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(st.n === n));
        g.append(b);
      }
      body.append(g);
      body.append(h("p", "bc-h", B(`2. Which mix ${C.adj[0]}?`, `2. ¿Qué mezcla ${C.adj[1]}?`)));
      body.append(
        radio(
          L("Stronger mix", "Mezcla más fuerte"),
          [
            ["A", "Mix A", "Mezcla A"],
            ["B", "Mix B", "Mezcla B"],
            ["same", "The same", "Igual"],
          ],
          "pick",
        ),
      );
      if (focus)
        for (const e of body.querySelectorAll("[aria-label]"))
          if (e.getAttribute("aria-label") === focus)
            return void (/** @type {any} */ (e).focus?.());
    }
    draw();
    if (!ro) {
      const act = h("div", "bc-act");
      act.append(
        btn(B("Check", "Revisar"), () => api.submit?.(JSON.parse(JSON.stringify(st))), "bc-go"),
        btn(B("Hint", "Pista"), () => api.hint?.()),
        btn(
          B("Start over", "Empezar de nuevo"),
          () => ((st = { n: null, pick: null }), save(L("Started over.", "Empezaste de nuevo."))),
        ),
      );
      root.append(act);
    }
  }
})();
