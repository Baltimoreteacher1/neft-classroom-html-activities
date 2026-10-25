/**
 * Practice Studio activity: cancelit (lesson 3-10, "Convert Measurement Units").
 *
 * Build a conversion chain out of fraction tiles so the units CANCEL, for example
 *   2.5 yd x (3 ft / 1 yd) x (12 in / 1 ft)  ->  only "in" is left.
 * The tray holds each needed tile in both orientations plus one tile about other units. A live line shows the units left after every
 * tile; a flipped tile leaves visible leftovers such as "yd squared over ft". A miss names what is left over and never prints the
 * number the chain makes. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /** unit -> [English name, Spanish name, English tile text, Spanish tile text] */
  const UNIT = {
    yd: ["yards", "yardas", "yd", "yd"],
    ft: ["feet", "pies", "ft", "pie"],
    in: ["inches", "pulgadas", "in", "pulg"],
    km: ["kilometers", "kilómetros", "km", "km"],
    m: ["meters", "metros", "m", "m"],
    cm: ["centimeters", "centímetros", "cm", "cm"],
    mm: ["millimeters", "milímetros", "mm", "mm"],
    gal: ["gallons", "galones", "gal", "gal"],
    qt: ["quarts", "cuartos de galón", "qt", "qt"],
    pt: ["pints", "pintas", "pt", "pt"],
    cup: ["cups", "tazas", "cup", "taza"],
    kg: ["kilograms", "kilogramos", "kg", "kg"],
    g: ["grams", "gramos", "g", "g"],
    mg: ["milligrams", "miligramos", "mg", "mg"],
    lb: ["pounds", "libras", "lb", "lb"],
    oz: ["ounces", "onzas", "oz", "oz"],
    L: ["liters", "litros", "L", "L"],
    mL: ["milliliters", "mililitros", "mL", "mL"],
  };
  /** Unit ladders, biggest first; n[i] of the next unit make 1 of this one. */
  const LADDERS = [
    { u: ["yd", "ft", "in"], n: [3, 12] },
    { u: ["km", "m", "cm"], n: [1000, 100] },
    { u: ["m", "cm", "mm"], n: [100, 10] },
    { u: ["gal", "qt", "pt", "cup"], n: [4, 2, 2] },
    { u: ["kg", "g", "mg"], n: [1000, 1000] },
    { u: ["lb", "oz"], n: [16] },
    { u: ["L", "mL"], n: [1000] },
  ];
  const nm = (/** @type {string} */ u, /** @type {boolean} */ es) =>
    UNIT[/** @type {"yd"} */ (u)][es ? 1 : 0];
  const tx = (/** @type {string} */ u, /** @type {boolean} */ es) =>
    UNIT[/** @type {"yd"} */ (u)][es ? 3 : 2];
  const num = (/** @type {number} */ n) => G.commas(Number(G.fmt(n, 4)));
  const SING = /** @type {Record<string, string>} */ ({
    yards: "yard",
    feet: "foot",
    inches: "inch",
    kilometers: "kilometer",
    meters: "meter",
    centimeters: "centimeter",
    millimeters: "millimeter",
    gallons: "gallon",
    quarts: "quart",
    pints: "pint",
    cups: "cup",
    kilograms: "kilogram",
    grams: "gram",
    milligrams: "milligram",
    pounds: "pound",
    ounces: "ounce",
    liters: "liter",
    milliliters: "milliliter",
    yardas: "yarda",
    pies: "pie",
    pulgadas: "pulgada",
    kilómetros: "kilómetro",
    metros: "metro",
    centímetros: "centímetro",
    milímetros: "milímetro",
    galones: "galón",
    "cuartos de galón": "cuarto de galón",
    pintas: "pinta",
    tazas: "taza",
    kilogramos: "kilogramo",
    gramos: "gramo",
    miligramos: "miligramo",
    libras: "libra",
    onzas: "onza",
    litros: "litro",
    mililitros: "mililitro",
  });
  /** the unit's name for a count: "1 yard", "3 feet" */
  const nmN = (/** @type {string} */ u, /** @type {number} */ n, /** @type {boolean} */ es) =>
    n === 1 ? SING[nm(u, es)] : nm(u, es);

  const SAY = {
    incomplete:
      "Fill every place in the chain with a tile. Each tile changes one unit into the next.|Llena cada lugar de la cadena con un mosaico. Cada mosaico cambia una unidad en la siguiente.",
    other:
      "One tile is about units that are not in this problem. Choose tiles that use the units you start with and want.|Un mosaico trata de unidades que no están en este problema. Elige mosaicos con las unidades con que empiezas y las que quieres.",
    left: "Your chain leaves {left}. A unit cancels only when it is on the top of one fraction and the bottom of another.|Tu cadena deja {left}. Una unidad se cancela solo cuando está arriba en una fracción y abajo en otra.",
    wrong:
      "The units do not cancel to the unit you want. Check where each tile leaves you before the next tile.|Las unidades no se cancelan hasta la unidad que quieres. Revisa dónde te deja cada mosaico antes del siguiente.",
  };
  const HINTS = [
    "Write the unit you start with. A tile cancels it only if that unit is on the bottom of the fraction.|Escribe la unidad con que empiezas. Un mosaico la cancela solo si esa unidad está abajo en la fracción.",
    "The unit on top of one tile must be the unit on the bottom of the next tile.|La unidad de arriba de un mosaico debe ser la unidad de abajo del siguiente.",
    "Watch the line that shows the units left. The goal is that only the unit you want is left.|Mira la línea que muestra las unidades que quedan. La meta es que solo quede la unidad que quieres.",
  ];
  const EXPLAIN =
    "A conversion factor is a fraction equal to 1, such as 3 ft / 1 yd. Put the unit you want to remove on the bottom so it cancels, and the unit you want on top.|Un factor de conversión es una fracción igual a 1, como 3 ft / 1 yd. Pon abajo la unidad que quieres quitar para que se cancele, y arriba la unidad que quieres.";

  /** Exponents of every unit after a start unit and some tiles; units at exponent 0 are gone. */
  const units = (/** @type {string} */ from, /** @type {any[]} */ tiles) => {
    /** @type {Record<string, number>} */
    const e = { [from]: 1 };
    for (const t of tiles) {
      e[t.top.u] = (e[t.top.u] || 0) + 1;
      e[t.bottom.u] = (e[t.bottom.u] || 0) - 1;
    }
    return Object.entries(e).filter(([, n]) => n !== 0);
  };
  /** "ft squared over in" style text for the leftovers. */
  const leftText = (/** @type {[string, number][]} */ left, /** @type {boolean} */ es) => {
    if (!left.length) return es ? "ninguna unidad" : "no units";
    const top = left.filter(([, n]) => n > 0);
    const bottom = left.filter(([, n]) => n < 0);
    const part = (/** @type {[string, number][]} */ list) =>
      list
        .map(([u, n]) => `${tx(u, es)}${Math.abs(n) === 2 ? "²" : Math.abs(n) === 3 ? "³" : ""}`)
        .join("·");
    return `${top.length ? part(top) : "1"}${bottom.length ? `/${part(bottom)}` : ""}`;
  };
  const tileText = (/** @type {any} */ t, /** @type {boolean} */ es) =>
    `${num(t.top.n)} ${tx(t.top.u, es)} / ${num(t.bottom.n)} ${tx(t.bottom.u, es)}`;

  const model = (/** @type {any} */ rng, /** @type {number} */ lv) => {
    const L = rng.pick(LADDERS.filter((l) => l.u.length >= (lv >= 3 ? 3 : lv === 2 ? 3 : 2)));
    const maxSteps = Math.min(L.n.length, lv === 1 ? 1 : lv === 2 ? 2 : 3);
    const steps = lv === 1 ? 1 : rng.int(Math.min(2, maxSteps), maxSteps);
    const i = rng.int(0, L.u.length - 1 - steps);
    const path = L.u.slice(i, i + steps + 1);
    const ns = L.n.slice(i, i + steps);
    const down = lv === 4 ? rng.chance(0.3) : true;
    const prod = ns.reduce((a, b) => a * b, 1);
    const from = down ? path[0] : path[steps];
    const to = down ? path[steps] : path[0];
    const v = down
      ? lv >= 2 && rng.chance(0.4)
        ? rng.int(1, 9) + 0.5
        : rng.int(2, 9)
      : rng.int(2, 9) * prod;
    const right = [];
    for (let s = 0; s < steps; s++) {
      const a = down ? s : steps - 1 - s;
      const big = path[a];
      const small = path[a + 1];
      right.push(
        down
          ? { top: { n: ns[a], u: small }, bottom: { n: 1, u: big }, kind: "right" }
          : { top: { n: 1, u: big }, bottom: { n: ns[a], u: small }, kind: "right" },
      );
    }
    const flip = right.map((t) => ({ top: t.bottom, bottom: t.top, kind: "flip" }));
    const other = rng.pick(
      LADDERS.filter((l) => l.u[0] !== L.u[0] && !l.u.some((u) => path.includes(u))),
    );
    const oi = rng.int(0, other.n.length - 1);
    const odd = {
      top: { n: other.n[oi], u: other.u[oi + 1] },
      bottom: { n: 1, u: other.u[oi] },
      kind: "other",
    };
    const tiles = rng.shuffle([...right, ...flip, odd]).map((t, k) => ({ ...t, id: `t${k}` }));
    // the right tiles in the order a chain reads
    const need = right.map(
      (r) => tiles.find((t) => t.kind === "right" && tileText(t, false) === tileText(r, false)).id,
    );
    return { v, from, to, steps, down, tiles, need };
  };

  A.register("cancelit", {
    title: "Cancel it",
    titleEs: "Cancélalo",
    levels: 4,
    make(rng, level) {
      const M = model(rng, level);
      const q = `Change ${num(M.v)} ${nm(M.from, false)} to ${nm(M.to, false)}. Build a chain of fraction tiles so that every unit cancels except ${nm(M.to, false)}.`;
      const qEs = `Cambia ${num(M.v)} ${nm(M.from, true)} a ${nm(M.to, true)}. Construye una cadena de mosaicos de fracciones para que se cancelen todas las unidades menos ${nm(M.to, true)}.`;
      const [x, xEs] = EXPLAIN.split("|");
      const hs = HINTS.map((s) => s.split("|"));
      return { q, qEs, x, xEs, h: hs.map((s) => s[0]), hEs: hs.map((s) => s[1]), model: M };
    },
    solution: (spec) => ({ chain: spec.model.need.slice() }),
    wrong(spec) {
      const M = spec.model;
      const byKind = (/** @type {string} */ k) =>
        M.tiles.filter((/** @type {any} */ t) => t.kind === k);
      const flips = byKind("flip");
      const rights = M.need.map((/** @type {string} */ id) =>
        M.tiles.find((/** @type {any} */ t) => t.id === id),
      );
      const out = [{ chain: [] }, { chain: flips.map((/** @type {any} */ t) => t.id) }];
      out.push({
        chain: [byKind("other")[0].id, ...rights.slice(1).map((/** @type {any} */ t) => t.id)],
      });
      if (M.steps > 1) out.push({ chain: [rights[0].id, flips[flips.length - 1].id] });
      return out.filter((s) => !A.grade(spec, s).ok);
    },
    grade(spec, st) {
      const M = spec.model;
      const ids = Array.isArray(st?.chain) ? st.chain : [];
      const tiles = ids
        .map((/** @type {string} */ id) => M.tiles.find((/** @type {any} */ t) => t.id === id))
        .filter(Boolean);
      const marks = Array.from({ length: M.steps }, (_, i) => tiles[i]?.kind === "right");
      const right = marks.filter(Boolean).length;
      const no = (
        /** @type {string} */ tag,
        /** @type {string} */ key,
        /** @type {Record<string, string>} */ v = {},
      ) => {
        const [en, es] = SAY[/** @type {"left"} */ (key)].split("|");
        const fill = (/** @type {string} */ s, /** @type {string} */ k) =>
          s.replace(/\{left\}/g, v[k] ?? "");
        return {
          ok: false,
          tag,
          say: fill(en, "en"),
          sayEs: fill(es, "es"),
          right,
          of: M.steps,
          marks,
        };
      };
      if (tiles.length !== M.steps) return no("incomplete", "incomplete");
      if (tiles.some((/** @type {any} */ t) => t.kind === "other"))
        return no("other-units", "other");
      const left = units(M.from, tiles);
      if (left.length === 1 && left[0][0] === M.to && left[0][1] === 1)
        return { ok: true, right, of: M.steps, marks };
      const flipped = tiles.some((/** @type {any} */ t) => t.kind === "flip");
      return no(flipped ? "flipped-factor" : "units-left", flipped ? "left" : "wrong", {
        en: leftText(left, false),
        es: leftText(left, true),
      });
    },
    mount: (host, spec, api) => mountCancel(host, spec, api),
  });

  const CSS = `
.ci-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.ci-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:44px;min-width:44px;padding:4px 14px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.ci-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.ci-btn:disabled{opacity:.45;cursor:not-allowed}
.ci-btn:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.ci-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.ci-h{margin:0;font-weight:800}
.ci-tray{display:flex;flex-wrap:wrap;gap:10px}
.ci-tile{display:inline-flex;align-items:center;justify-content:center;padding:6px 12px}
.ci-fr{display:inline-grid;text-align:center;line-height:1.25}
.ci-fr span:first-child{border-bottom:3px solid currentColor;padding:0 6px 2px}
.ci-fr span:last-child{padding:2px 6px 0}
.ci-chain{display:flex;flex-wrap:wrap;gap:8px;align-items:center;list-style:none;margin:0;padding:10px;border:2px dashed var(--brand-line,#BBCADA);border-radius:var(--radius-md,14px);font-weight:800;font-size:1.1rem}
.ci-slot{display:inline-flex;gap:6px;align-items:center;min-width:92px;min-height:56px;padding:4px 8px;border:2px solid var(--border,#D5DCE5);border-radius:12px;background:var(--surface,#fff)}
.ci-slot.empty{color:var(--ink,#1B2733);opacity:.7;font-weight:600}
.ci-left{padding:8px 12px;border-radius:12px;background:var(--brand-tint,#E5ECF3);font-weight:800}
.ci-act{display:flex;flex-wrap:wrap;gap:10px}
@media (forced-colors:active){.ci-btn,.ci-slot,.ci-chain{border-color:ButtonText}}
`;

  function mountCancel(
    /** @type {HTMLElement} */ host,
    /** @type {any} */ spec,
    /** @type {any} */ api,
  ) {
    A.css("cancelit", CSS);
    const M = spec.model;
    const ro = !!api.solved;
    const es = () => !!api.es?.();
    const L = (/** @type {string} */ en, /** @type {string} */ e) => (es() ? e : en);
    const B = (/** @type {string} */ en, /** @type {string} */ e) => A.t(en, e);
    const h = (/** @type {string} */ tg, cls = "", html = "", at = {}) =>
      /** @type {any} */ (A.el(tg, cls, html, at));
    /** @type {{chain: string[]}} */
    let st = api.restore ? JSON.parse(JSON.stringify(api.restore)) : { chain: [] };
    const tileOf = (/** @type {string} */ id) =>
      M.tiles.find((/** @type {any} */ t) => t.id === id);
    const frHtml = (/** @type {any} */ t) =>
      `<span class="ci-fr"><span>${num(t.top.n)} ${tx(t.top.u, es())}</span><span>${num(t.bottom.n)} ${tx(t.bottom.u, es())}</span></span>`;
    const plain = (/** @type {any} */ t) =>
      L(
        `${num(t.top.n)} ${nmN(t.top.u, t.top.n, false)} over ${num(t.bottom.n)} ${nmN(t.bottom.u, t.bottom.n, false)}`,
        `${num(t.top.n)} ${nmN(t.top.u, t.top.n, true)} sobre ${num(t.bottom.n)} ${nmN(t.bottom.u, t.bottom.n, true)}`,
      );
    const save = (say) => {
      api.change?.(JSON.parse(JSON.stringify(st)));
      if (say) api.say?.(say);
      draw();
    };
    host.textContent = "";
    const root = h("div", "ci-root");
    const body = h("div", "ci-root");
    root.append(body);
    host.append(root);
    const btn = (
      /** @type {string} */ html,
      /** @type {() => void} */ fn,
      cls = "",
      label = "",
      dis = ro,
    ) => {
      const b = h("button", `ci-btn ${cls}`, html, { type: "button" });
      if (label) b.setAttribute("aria-label", label);
      b.disabled = dis;
      b.addEventListener("click", fn);
      return b;
    };

    function draw() {
      const focus = document.activeElement?.getAttribute?.("aria-label");
      body.textContent = "";
      const placed = st.chain.map(tileOf).filter(Boolean);
      body.append(
        h(
          "p",
          "ci-h",
          B(`Start: ${num(M.v)} ${tx(M.from, false)}`, `Inicio: ${num(M.v)} ${tx(M.from, true)}`),
        ),
      );
      const chain = h("ol", "ci-chain", "", { "aria-label": L("Your chain", "Tu cadena") });
      for (let i = 0; i < M.steps; i++) {
        const t = placed[i];
        const slot = h("li", `ci-slot${t ? "" : " empty"}`);
        if (t) {
          slot.innerHTML = `<span aria-hidden="true">×</span> ${frHtml(t)}`;
          slot.setAttribute("aria-label", `${L("Tile", "Mosaico")} ${i + 1}: ${plain(t)}`);
          if (!ro)
            slot.append(
              btn(
                "✕",
                () => ((st.chain = st.chain.filter((_, k) => k !== i)), save()),
                "",
                L(`Remove tile ${i + 1}`, `Quitar el mosaico ${i + 1}`),
              ),
            );
        } else slot.innerHTML = B(`Tile ${i + 1}`, `Mosaico ${i + 1}`);
        chain.append(slot);
      }
      body.append(chain);
      const left = units(M.from, placed);
      const value = placed.reduce((v, t) => (v * t.top.n) / t.bottom.n, M.v);
      const leftEl = h("p", "ci-left", "", { role: "status" });
      leftEl.innerHTML = `${B("Units left:", "Unidades que quedan:")} <span lang="${es() ? "es" : "en"}">${leftText(left, es())}</span>`;
      body.append(leftEl);
      if (ro) {
        const value = placed.reduce((v, t) => (v * t.top.n) / t.bottom.n, M.v);
        body.append(
          h(
            "p",
            "ci-left",
            B(
              `The chain makes ${num(value)} ${tx(M.to, false)}.`,
              `La cadena da ${num(value)} ${tx(M.to, true)}.`,
            ),
          ),
        );
      }
      body.append(h("p", "ci-h", B("Tiles", "Mosaicos")));
      const tray = h("div", "ci-tray", "", {
        role: "group",
        "aria-label": L("Tile tray", "Bandeja de mosaicos"),
      });
      for (const t of M.tiles) {
        const used = st.chain.includes(t.id);
        const b = btn(
          frHtml(t),
          () => {
            if (st.chain.length < M.steps && !used) {
              st.chain.push(t.id);
              save(L(`Added ${plain(t)}.`, `Añadiste ${plain(t)}.`));
            }
          },
          "ci-tile",
          plain(t),
          ro || used || st.chain.length >= M.steps,
        );
        tray.append(b);
      }
      body.append(tray);
      body.append(
        A.linkedUnitConversion({
          startValue: num(M.v),
          startUnit: tx(M.from, false),
          endValue: num(value),
          endUnit: leftText(left, false),
          factors: placed.map((t) => ({
            n: t.top.n,
            top: tx(t.top.u, false),
            d: t.bottom.n,
            bottom: tx(t.bottom.u, false),
          })),
        }),
      );
      if (focus)
        for (const e of body.querySelectorAll("[aria-label]"))
          if (e.getAttribute("aria-label") === focus)
            return void (/** @type {any} */ (e).focus?.());
    }
    draw();
    if (!ro) {
      const act = h("div", "ci-act");
      act.append(
        btn(B("Check", "Revisar"), () => api.submit?.(JSON.parse(JSON.stringify(st))), "ci-go"),
        btn(B("Hint", "Pista"), () => api.hint?.()),
        btn(
          B("Start over", "Empezar de nuevo"),
          () => ((st = { chain: [] }), save(L("Started over.", "Empezaste de nuevo."))),
        ),
      );
      root.append(act);
    }
  }
})();
