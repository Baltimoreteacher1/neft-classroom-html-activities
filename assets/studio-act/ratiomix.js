/**
 * Practice Studio activity: ratiomix (lessons 3-1 .. 3-3, 3-5, 3-8, 3-9).
 *
 * A mixing station. Counters have a colour, a shape AND a letter, so colour is never the only cue.
 * mode "recipe":     add or remove whole batches to hit a target amount (level 4: build the recipe from the final mix).
 * mode "equivalent": build batches until one term matches, then type the other term (levels 3-4: test a claimed ratio).
 * mode "unitrate":   drag a divider to split a bundle into equal groups, one per item (level 4: two bundles, maybe a tie).
 * mode "compare":    build two mixtures at the same amount of the first ingredient, then say which has more of the second.
 * A live ratio table and a proportion bar show structure, never the answer. Text is "English|Spanish" pairs.
 * Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;
  const f = (n) => G.fmt(n, 2);
  const gcd = G.gcd;
  const same = (a, b) => Math.abs(a - b) < 1e-6;
  const fill = (s, o = {}) => s.replace(/\{(\w+)\}/g, (_, k) => o[k]).split("|");
  const no = (tag, o) => {
    const [say, sayEs] = fill(MSG[tag], o);
    return { ok: false, tag, say, sayEs };
  };
  /** a, aEs, b, bEs, letters (en a, en b, es a, es b), colour token of the first ingredient */
  const CTX = [
    "red paint|pintura roja|blue paint|pintura azul|R|B|R|A|bad",
    "mango|mango|yogurt|yogur|M|Y|M|Y|sun",
    "lemon juice|jugo de limón|water|agua|L|W|L|A|sun",
    "orange juice|jugo de naranja|seltzer|agua con gas|O|S|N|G|bad",
    "flour|harina|sugar|azúcar|F|S|H|A|sun",
    "green dye|colorante verde|clear gel|gel transparente|G|C|V|T|ok",
  ];
  const ITEMS = [
    "notebooks|cuadernos|dollars|dólares",
    "markers|marcadores|dollars|dólares",
    "tickets|boletos|dollars|dólares",
    "granola bars|barras de granola|dollars|dólares",
  ];
  const MSG = {
    short:
      "The mix is not big enough yet: it has {v} and the goal is {t}. Whole batches are added at a time, so add another batch.|La mezcla todavía no es lo bastante grande: tiene {v} y la meta es {t}. Se añaden tandas completas, así que añade otra tanda.",
    over: "The mix has {v}, which is past the goal of {t}. Each batch adds the same amounts, so take a batch away.|La mezcla tiene {v}, que pasa la meta de {t}. Cada tanda añade las mismas cantidades, así que quita una tanda.",
    "not-simplest":
      "Those batches make the right mix, but the recipe can be written with smaller numbers. Divide both amounts by their greatest common factor.|Esas tandas hacen la mezcla correcta, pero la receta se puede escribir con números menores. Divide ambas cantidades entre su máximo común divisor.",
    "wrong-mix":
      "{k} batches of that recipe make {v}, which is not the final mix. Both amounts have to be multiplied by the same number of batches.|{k} tandas de esa receta hacen {v}, que no es la mezcla final. Ambas cantidades se multiplican por el mismo número de tandas.",
    "not-built":
      "Build with the batch buttons until the table shows the term you were given, then read the other term.|Construye con los botones de tanda hasta que la tabla muestre el término dado, y luego lee el otro término.",
    additive:
      "Adding the same amount to both terms does not keep the ratio. Each batch multiplies both terms by the same number.|Sumar la misma cantidad a ambos términos no mantiene la razón. Cada tanda multiplica ambos términos por el mismo número.",
    "wrong-term":
      "That term does not match the table. Multiply the other term of the recipe by the number of batches.|Ese término no coincide con la tabla. Multiplica el otro término de la receta por el número de tandas.",
    "need-answer": "Choose Yes or No after you build.|Elige Sí o No después de construir.",
    "wrong-test":
      "Compare your built row with the ratio in the question: do both terms match, or only one?|Compara tu fila construida con la razón de la pregunta: ¿coinciden ambos términos o solo uno?",
    "not-even":
      "Your groups make {v}, but there are {t} items. Every item gets the same amount, with none left over.|Tus grupos hacen {v}, pero hay {t} artículos. Cada artículo recibe la misma cantidad, sin sobrantes.",
    "better-buy":
      "Compare the cost of ONE item for each bundle. The better buy costs less for one item.|Compara el costo de UN artículo en cada paquete. La mejor compra cuesta menos por un artículo.",
    "tie-missed":
      "Check the cost of one item for both bundles again: if they are equal, neither bundle is the better buy.|Revisa otra vez el costo de un artículo en ambos paquetes: si son iguales, ningún paquete es la mejor compra.",
    "no-pick":
      "Tap the answer after you split the bundles.|Toca la respuesta después de dividir los paquetes.",
    "no-common":
      "The mixes have different amounts of the first ingredient. Build both with the same amount of it so the second ingredient can be compared fairly.|Las mezclas tienen distinta cantidad del primer ingrediente. Construye ambas con la misma cantidad para comparar con justicia el segundo.",
    "no-pick2":
      "Now tap the mix that has more of the second ingredient for the same amount of the first.|Ahora toca la mezcla que tiene más del segundo ingrediente para la misma cantidad del primero.",
    "wrong-pick":
      "At the same amount of the first ingredient, compare the second ingredient. The mix with more of it is the stronger one; if the amounts match, the mixes are the same.|Con la misma cantidad del primer ingrediente, compara el segundo. La mezcla con más cantidad es la más fuerte; si coinciden, las mezclas son iguales.",
  };
  const HINTS = {
    recipe: [
      "One batch always has the same amounts. Two batches have twice as much of each.|Una tanda siempre tiene las mismas cantidades. Dos tandas tienen el doble de cada una.",
      "Look at the table: each column is one more batch. Which row does your goal talk about?|Mira la tabla: cada columna es una tanda más. ¿De qué fila habla tu meta?",
      "Divide the goal by the amount one batch adds to that row.|Divide la meta entre la cantidad que una tanda añade a esa fila.",
    ],
    equivalent: [
      "Equivalent ratios come from multiplying both terms by the same number, the number of batches.|Las razones equivalentes salen de multiplicar ambos términos por el mismo número, la cantidad de tandas.",
      "Build batches until the term you know matches the table, then read the other row.|Construye tandas hasta que el término que conoces coincida con la tabla, y luego lee la otra fila.",
      "Do not add the same number to both terms. Multiply both.|No sumes el mismo número a ambos términos. Multiplica ambos.",
    ],
    unitrate: [
      "A unit rate is the amount for ONE item. Split the bundle into one equal group for each item.|Una tasa unitaria es la cantidad para UN artículo. Divide el paquete en un grupo igual por cada artículo.",
      "Move the divider until the number of groups matches the number of items, with nothing left over.|Mueve el divisor hasta que la cantidad de grupos coincida con la de artículos, sin sobrantes.",
      "Dividing the total by the number of items gives the size of one group.|Dividir el total entre la cantidad de artículos da el tamaño de un grupo.",
    ],
    compare: [
      "To compare fairly, both mixes need the same amount of the first ingredient.|Para comparar con justicia, ambas mezclas necesitan la misma cantidad del primer ingrediente.",
      "Use the batch buttons on each mix until the first row of both tables matches.|Usa los botones de tanda de cada mezcla hasta que la primera fila de ambas tablas coincida.",
      "Now look at the second row. Which mix has more for the same first amount?|Ahora mira la segunda fila. ¿Qué mezcla tiene más para la misma cantidad del primero?",
    ],
  };
  const EXPLAIN = {
    recipe:
      "Each batch has the same amounts, so batches multiply both terms of the ratio by the same number and the mixture keeps its taste.|Cada tanda tiene las mismas cantidades, así que las tandas multiplican ambos términos de la razón por el mismo número y la mezcla conserva su sabor.",
    equivalent:
      "Equivalent ratios are made by multiplying both terms by the same number. Adding the same amount to both terms changes the ratio.|Las razones equivalentes se forman multiplicando ambos términos por el mismo número. Sumar la misma cantidad a ambos términos cambia la razón.",
    unitrate:
      "A unit rate is the amount for one item: the total divided by the number of items. Equal groups, one per item, show it.|Una tasa unitaria es la cantidad para un artículo: el total dividido entre la cantidad de artículos. Los grupos iguales, uno por artículo, la muestran.",
    compare:
      "Two ratios are easy to compare once the first term matches: the mix with more of the second ingredient is stronger. Equal amounts mean the ratios are equivalent.|Dos razones son fáciles de comparar cuando el primer término coincide: la mezcla con más del segundo ingrediente es más fuerte. Cantidades iguales significan razones equivalentes.",
  };

  /* ---- model ----------------------------------------------------------------------------------------- */
  const coprime = (rng, lo, hi) => {
    for (;;) {
      const r = rng.int(lo, hi);
      const b = rng.int(lo, hi);
      if (r !== b && gcd(r, b) === 1) return [r, b];
    }
  };
  const mk = {
    recipe(rng, lv) {
      const [r, b] =
        lv === 3 ? coprime(rng, 2, 7) : lv === 4 ? coprime(rng, 2, 6) : coprime(rng, 1, 4);
      const k = lv === 3 ? rng.int(6, 9) : lv === 4 ? rng.int(2, 5) : rng.int(2, 5);
      const kind = lv === 1 ? "t" : lv === 4 ? "rev" : rng.pick(["a", "b", "t"]);
      const per = { a: r, b, t: r + b, rev: 0 }[kind];
      return { r, b, k, kind, per, goal: per * k };
    },
    equivalent(rng, lv) {
      const [r, b] = coprime(rng, 2, lv === 4 ? 7 : 5);
      const k = rng.int(3, lv === 4 ? 9 : 8);
      if (lv <= 2)
        return { r, b, k, kind: lv === 1 ? "first" : "second", T: k * (lv === 1 ? r : b) };
      const yes = rng.chance(0.4);
      const add = rng.chance(0.5);
      const S = yes ? k * b : add ? b + k * r - r : k * b + rng.pick([-2, -1, 1, 2]);
      return { r, b, k, kind: "test", R: k * r, S, yes: S === k * b };
    },
    unitrate(rng, lv) {
      const bundle = (g, n) => ({ n, T: n * g, g });
      const half = lv >= 3 ? 0.5 : 1;
      const one = () => {
        const n = lv >= 3 ? 2 * rng.int(2, 4) : rng.int(2, lv === 1 ? 6 : 8);
        return bundle(rng.int(2, lv === 1 ? 8 : 12) + (lv >= 3 && rng.chance(0.5) ? 0.5 : 0), n);
      };
      const a = one();
      if (lv < 4) return { bundles: [a], step: half };
      const tie = rng.chance(0.35);
      const b = tie ? bundle(a.g, a.n * 2) : bundle(a.g + rng.pick([-1, -0.5, 0.5, 1]), a.n * 2);
      return { bundles: [a, b], step: half, best: same(a.g, b.g) ? "same" : a.g < b.g ? "A" : "B" };
    },
    compare(rng, lv) {
      for (;;) {
        const r1 = rng.int(2, lv === 1 ? 4 : 6);
        const r2 = rng.int(2, lv === 1 ? 4 : 6);
        const b1 = rng.int(1, lv === 1 ? 5 : 8);
        const b2 = rng.int(1, lv === 1 ? 5 : 8);
        const eq = b1 * r2 === b2 * r1;
        if (r1 === r2 || (eq && lv < 4) || (!eq && lv === 4 && rng.chance(0.4))) continue;
        const l = (r1 * r2) / gcd(r1, r2);
        if (l > 24 || (lv < 3 && l > 12)) continue;
        const best = eq ? "same" : b1 * r2 > b2 * r1 ? "A" : "B";
        return {
          mixes: [
            [r1, b1],
            [r2, b2],
          ],
          best,
          ks: [l / r1, l / r2],
        };
      }
    },
  };

  const need = (M) => (M.kind === "rev" ? { r: M.r, b: M.b, k: M.k } : null);
  const grade = (spec, st) => {
    const M = spec.model;
    const mode = spec.mode;
    if (!st || typeof st !== "object") return no("not-built");
    if (mode === "recipe") {
      if (M.kind === "rev") {
        const [r, b, k] = [st.r, st.b, st.k];
        const R = M.r * M.k;
        const B = M.b * M.k;
        if (r * k !== R || b * k !== B) return no("wrong-mix", { k, v: `${r * k} + ${b * k}` });
        return gcd(r, b) === 1 ? { ok: true } : no("not-simplest");
      }
      const v = st.k * M.per;
      return v === M.goal ? { ok: true } : no(v < M.goal ? "short" : "over", { v, t: M.goal });
    }
    if (mode === "equivalent") {
      const k = st.k;
      if (M.kind === "test") {
        if (k * M.r !== M.R) return no("not-built");
        if (st.ans !== "yes" && st.ans !== "no") return no("need-answer");
        return (st.ans === "yes") === M.yes ? { ok: true } : no("wrong-test");
      }
      const known = M.kind === "first" ? M.r : M.b;
      if (k * known !== M.T) return no("not-built");
      const v = G.value(st.ans);
      const right = k * (M.kind === "first" ? M.b : M.r);
      if (same(v, right)) return { ok: true };
      const d = M.T - known;
      return same(v, (M.kind === "first" ? M.b : M.r) + d) ? no("additive") : no("wrong-term");
    }
    if (mode === "unitrate") {
      const bad = M.bundles.findIndex((b, i) => !(st.g?.[i] > 0) || !same(st.g[i], b.T / b.n));
      if (bad >= 0) {
        const b = M.bundles[bad];
        const g = st.g?.[bad] > 0 ? st.g[bad] : 1;
        return no("not-even", { v: f(b.T / g), t: b.n });
      }
      if (M.bundles.length < 2) return { ok: true };
      if (!st.pick) return no("no-pick");
      if (st.pick === M.best) return { ok: true };
      return no(M.best === "same" ? "tie-missed" : "better-buy");
    }
    const [ka, kb] = st.k || [0, 0];
    const [[r1], [r2]] = M.mixes;
    if (!(ka > 0) || !(kb > 0) || ka * r1 !== kb * r2) return no("no-common");
    if (!st.pick) return no("no-pick2");
    return st.pick === M.best ? { ok: true } : no("wrong-pick");
  };

  const QTXT = {
    recipe: (M, c) =>
      M.kind === "rev"
        ? [
            `The final mix has ${M.r * M.k} cups of ${c[0]} and ${M.b * M.k} cups of ${c[2]}. Set the recipe for ONE batch in simplest form, then set how many batches were made.`,
            `La mezcla final tiene ${M.r * M.k} tazas de ${c[1]} y ${M.b * M.k} tazas de ${c[3]}. Escribe la receta de UNA tanda en su forma más simple y luego cuántas tandas se hicieron.`,
          ]
        : [
            `One batch uses ${M.r} cups of ${c[0]} and ${M.b} cups of ${c[2]}. Add batches so the mix has exactly ${M.goal} cups ${{ t: "in all", a: `of ${c[0]}`, b: `of ${c[2]}` }[M.kind]}.`,
            `Una tanda usa ${M.r} tazas de ${c[1]} y ${M.b} tazas de ${c[3]}. Añade tandas para que la mezcla tenga exactamente ${M.goal} tazas ${{ t: "en total", a: `de ${c[1]}`, b: `de ${c[3]}` }[M.kind]}.`,
          ],
    equivalent: (M, c) =>
      M.kind === "test"
        ? [
            `A recipe uses ${c[0]} and ${c[2]} in the ratio ${M.r}:${M.b}. Is a mix of ${M.R}:${M.S} the same taste? Build batches to test it, then choose Yes or No.`,
            `Una receta usa ${c[1]} y ${c[3]} en la razón ${M.r}:${M.b}. ¿Una mezcla de ${M.R}:${M.S} sabe igual? Construye tandas para comprobarlo y elige Sí o No.`,
          ]
        : [
            `A recipe uses ${c[0]} and ${c[2]} in the ratio ${M.r}:${M.b}. Build batches until the ${M.kind} term is ${M.T}, then type the missing term.`,
            `Una receta usa ${c[1]} y ${c[3]} en la razón ${M.r}:${M.b}. Construye tandas hasta que el ${M.kind === "first" ? "primer" : "segundo"} término sea ${M.T} y escribe el término que falta.`,
          ],
    unitrate: (M, c) => {
      const [it, itEs] = c;
      const [a, b] = M.bundles;
      return b
        ? [
            `Bundle A: ${a.n} ${it} for $${f(a.T)}. Bundle B: ${b.n} ${it} for $${f(b.T)}. Split each bundle into equal groups, one per item, then pick the better buy.`,
            `Paquete A: ${a.n} ${itEs} por $${f(a.T)}. Paquete B: ${b.n} ${itEs} por $${f(b.T)}. Divide cada paquete en grupos iguales, uno por artículo, y elige la mejor compra.`,
          ]
        : [
            `${a.n} ${it} cost $${f(a.T)} in all. Drag the divider to split the money into equal groups, one for each item.`,
            `${a.n} ${itEs} cuestan $${f(a.T)} en total. Arrastra el divisor para dividir el dinero en grupos iguales, uno por cada artículo.`,
          ];
    },
    compare: (M, c) => {
      const [[r1, b1], [r2, b2]] = M.mixes;
      return [
        `Mix A uses ${r1} cups of ${c[0]} to ${b1} of ${c[2]}. Mix B uses ${r2} to ${b2}. Build both with the same amount of ${c[0]}, then tap the mix with more ${c[2]} for it.`,
        `La mezcla A usa ${r1} tazas de ${c[1]} por ${b1} de ${c[3]}. La mezcla B usa ${r2} por ${b2}. Construye ambas con la misma cantidad de ${c[1]} y toca la que tiene más ${c[3]}.`,
      ];
    },
  };

  A.register("ratiomix", {
    title: "Mixing station",
    titleEs: "Estación de mezclas",
    levels: 4,
    make(rng, level, params) {
      const mode = params.mode || rng.pick(["recipe", "equivalent", "unitrate", "compare"]);
      const M = mk[mode](rng, level);
      const ctx = rng.pick(CTX).split("|");
      const item = rng.pick(ITEMS).split("|");
      const [q, qEs] = QTXT[mode](M, mode === "unitrate" ? item : ctx);
      const [x, xEs] = EXPLAIN[mode].split("|");
      const hs = HINTS[mode].map((s) => s.split("|"));
      return {
        mode,
        q,
        qEs,
        x,
        xEs,
        h: hs.map((s) => s[0]),
        hEs: hs.map((s) => s[1]),
        model: { ...M, ctx, item },
      };
    },
    solution(spec) {
      const M = spec.model;
      if (spec.mode === "recipe") return M.kind === "rev" ? need(M) : { k: M.k };
      if (spec.mode === "equivalent")
        return M.kind === "test"
          ? { k: M.k, ans: M.yes ? "yes" : "no" }
          : { k: M.k, ans: String(M.k * (M.kind === "first" ? M.b : M.r)) };
      if (spec.mode === "unitrate")
        return { g: M.bundles.map((b) => b.T / b.n), pick: M.best || null };
      return { k: M.ks.slice(), pick: M.best };
    },
    wrong(spec, rng) {
      const M = spec.model;
      const s = /** @type {any} */ (this.solution(spec));
      const out = [];
      const add = (x) => grade(spec, x).ok || out.push(x);
      if (spec.mode === "recipe") {
        if (M.kind === "rev")
          [
            { r: M.r * M.k, b: M.b * M.k, k: 1 },
            { r: M.r, b: M.b, k: M.k + 1 },
            { r: M.b, b: M.r, k: M.k },
          ].forEach(add);
        else [{ k: 0 }, { k: M.k - 1 }, { k: M.k + 1 }].forEach(add);
      } else if (spec.mode === "equivalent") {
        add({ k: 0, ans: "" });
        add({ k: M.k, ans: M.kind === "test" ? (M.yes ? "no" : "yes") : String(+s.ans + 1) });
        add({ k: M.k + 1, ans: s.ans });
        add({ k: M.k, ans: null });
      } else if (spec.mode === "unitrate") {
        add({ g: M.bundles.map((b) => b.T / b.n + M.step), pick: s.pick });
        add({
          g: M.bundles.map((b) => b.T / b.n),
          pick: M.bundles.length > 1 ? (M.best === "A" ? "B" : "A") : null,
        });
        add({ g: M.bundles.map(() => 1), pick: s.pick });
      } else {
        add({ k: [0, 0], pick: null });
        add({ k: [s.k[0] + 1, s.k[1]], pick: s.pick });
        add({ k: s.k, pick: M.best === "A" ? "B" : "A" });
        add({ k: s.k, pick: null });
      }
      void rng;
      return out;
    },
    grade,
    mount: (host, spec, api) => mountMix(host, spec, api),
  });

  /* ---- widget ---------------------------------------------------------------------------------------- */
  const CSS = `
.rm-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.rm-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:44px;min-width:44px;padding:4px 14px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.rm-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.rm-btn:disabled{opacity:.45;cursor:not-allowed}
.rm-btn[aria-checked="true"]{background:var(--brand-tint,#E5ECF3);box-shadow:inset 0 0 0 2px var(--brand,#2C4A68)}
.rm-go .es-text{color:inherit}
.rm-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.rm-go:hover:not(:disabled){background:var(--brand,#2C4A68);filter:brightness(1.12)}
.rm-btn:focus-visible,.rm-in:focus-visible,.rm-slide:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.rm-mix{border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:10px;display:grid;gap:8px;background:var(--surface,#fff)}
.rm-h{margin:0;font-weight:800}
.rm-recipe{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
.rm-bowl{display:flex;flex-wrap:wrap;gap:8px;min-height:36px}
.rm-batch{display:flex;flex-wrap:wrap;gap:2px;padding:3px;border:2px dashed var(--brand-line,#BBCADA);border-radius:10px;max-width:7.5em}
.rm-c{width:20px;height:20px;display:inline-grid;place-items:center;font:800 11px system-ui,sans-serif;border:2px solid var(--ink,#1B2733);color:var(--ink,#1B2733);flex:none}
.rm-c.a{border-radius:50%}
.rm-c.b{border-radius:5px;background:var(--brand-tint,#E5ECF3)}
.rm-c.a.bad{background:var(--bad,#B42318);color:#fff}.rm-c.a.sun{background:var(--sun,#F0BD4F);color:#1B2C3F}.rm-c.a.ok{background:var(--ok,#0A7D4B);color:#fff}
.rm-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.rm-n{min-width:2.4em;text-align:center;font-weight:800;font-size:1.2rem}
.rm-tw{overflow-x:auto}
.rm-t{border-collapse:collapse;font-size:.9rem}
.rm-t th,.rm-t td{border:2px solid var(--border,#D5DCE5);padding:3px 9px;text-align:center}
.rm-t th{text-align:left;background:var(--brand-tint,#E5ECF3)}
.rm-bar{display:flex;height:26px;border:2px solid var(--ink,#1B2733);border-radius:8px;overflow:hidden;font:700 12px system-ui,sans-serif}
.rm-bar span{display:grid;place-items:center;min-width:0}
.rm-bar .a.bad{background:var(--bad,#B42318);color:#fff}.rm-bar .a.sun{background:var(--sun,#F0BD4F);color:#1B2C3F}.rm-bar .a.ok{background:var(--ok,#0A7D4B);color:#fff}
.rm-bar .b{background:var(--brand-tint,#E5ECF3)}
.rm-in{font:inherit;font-weight:800;min-height:44px;width:6em;padding:4px 10px;border-radius:12px;border:2px solid var(--brand,#2C4A68);background:var(--surface,#fff);color:var(--ink,#1B2733)}
.rm-svg{width:100%;height:auto}
.rm-slide{width:100%;height:44px;accent-color:var(--brand,#2C4A68)}
.rm-svg .g{fill:var(--brand-tint,#E5ECF3);stroke:var(--brand,#2C4A68);stroke-width:2}
.rm-svg .g.alt{fill:var(--sun,#F0BD4F)}
.rm-svg .x{fill:none;stroke:var(--bad,#B42318);stroke-width:2;stroke-dasharray:4 3}
.rm-svg text{fill:var(--ink,#1B2733);font:700 11px system-ui,sans-serif;text-anchor:middle}
.rm-act{display:flex;flex-wrap:wrap;gap:10px}
@media (forced-colors:active){.rm-btn,.rm-mix,.rm-c{border-color:ButtonText}}
`;

  function mountMix(host, spec, api) {
    A.css("ratiomix", CSS);
    const M = spec.model;
    const mode = spec.mode;
    const ro = !!api.solved;
    const es = () => !!api.es?.();
    const L = (en, e) => (es() ? e : en);
    const B = (en, e) => A.t(en, e);
    const h = (tg, cls = "", html = "", at = {}) => /** @type {any} */ (A.el(tg, cls, html, at));
    const sol = /** @type {any} */ (A.registry.ratiomix.solution(spec));
    const init = () => {
      if (mode === "recipe") return M.kind === "rev" ? { r: 1, b: 1, k: 1 } : { k: 0 };
      if (mode === "equivalent") return { k: 0, ans: M.kind === "test" ? null : "" };
      if (mode === "unitrate") return { g: M.bundles.map(() => M.step), pick: null };
      return { k: [0, 0], pick: null };
    };
    let st = api.restore ? JSON.parse(JSON.stringify(api.restore)) : init();
    const [an, anEs, bn, bnEs, la, lb, laEs, lbEs, col] = M.ctx;
    const save = (say) => {
      api.change?.(JSON.parse(JSON.stringify(st)));
      if (say) api.say?.(say);
      draw();
    };
    host.textContent = "";
    const root = h("div", `rm-root${ro ? " is-ro" : ""}`);
    const body = h("div", "rm-root");
    host.append(root);
    root.append(body);
    const btn = (html, fn, cls = "", label = "") => {
      const b = h("button", `rm-btn ${cls}`, html, { type: "button" });
      if (label) b.setAttribute("aria-label", label);
      b.addEventListener("click", fn);
      b.disabled = ro;
      return b;
    };
    const counter = (kind) =>
      h(
        "i",
        `rm-c ${kind}${kind === "a" ? ` ${col}` : ""}`,
        kind === "a" ? L(la, laEs) : L(lb, lbEs),
      );
    const counters = (r, b) => {
      const w = h("span", "rm-batch");
      for (let i = 0; i < r; i++) w.append(counter("a"));
      for (let i = 0; i < b; i++) w.append(counter("b"));
      return w;
    };
    /** One mixture: recipe card, bowl of batches, ratio table, proportion bar. */
    const mixView = (title, r, b, k, setK, third = true) => {
      const box = h("div", "rm-mix");
      box.append(h("p", "rm-h", title));
      const rec = h("div", "rm-recipe", B("One batch:", "Una tanda:"));
      rec.append(counters(r, b));
      box.append(rec);
      const bowl = h("div", "rm-bowl", "", {
        role: "img",
        "aria-label": L(
          `${k} batches: ${k * r} ${an} and ${k * b} ${bn}`,
          `${k} tandas: ${k * r} de ${anEs} y ${k * b} de ${bnEs}`,
        ),
      });
      if (k * (r + b) <= 60) for (let i = 0; i < k; i++) bowl.append(counters(r, b));
      else bowl.append(h("span", "", B(`${k} batches`, `${k} tandas`)));
      box.append(bowl);
      const shown = Array.from({ length: Math.min(k, 6) }, (_, i) => k - Math.min(k, 6) + i + 1);
      const row = (name, f2) =>
        `<tr><th scope="row">${name}</th>${shown.map((n) => `<td>${f2(n)}</td>`).join("")}</tr>`;
      const tb =
        row(B("Batches", "Tandas"), (n) => n) +
        row(B(an, anEs), (n) => n * r) +
        row(B(bn, bnEs), (n) => n * b) +
        (third ? row(B("Total", "Total"), (n) => n * (r + b)) : "");
      box.append(h("div", "rm-tw", k ? `<table class="rm-t"><tbody>${tb}</tbody></table>` : ""));
      const bar = h(
        "div",
        "rm-bar",
        k
          ? `<span class="a ${col}" style="flex:${r}">${r * k}</span><span class="b" style="flex:${b}">${b * k}</span>`
          : "",
      );
      bar.setAttribute("aria-hidden", "true");
      box.append(bar);
      const ctl = h("div", "rm-row");
      ctl.append(
        btn("−", () => setK(k - 1), "", L("Remove a batch", "Quitar una tanda")),
        h("span", "rm-n", String(k)),
        btn("+", () => setK(k + 1), "", L("Add a batch", "Añadir una tanda")),
        h("span", "", B("batches", "tandas")),
      );
      ctl.children[0].disabled = ro || k <= 0;
      ctl.children[2].disabled = ro || k >= 20;
      box.append(ctl);
      return box;
    };
    const stepRow = (name, key) => {
      const row = h("div", "rm-row");
      row.append(
        h("span", "rm-h", name),
        btn(
          "−",
          () => ((st[key] = Math.max(1, st[key] - 1)), save()),
          "",
          L(`Less ${name}`, `Menos ${name}`),
        ),
        h("span", "rm-n", String(st[key])),
        btn(
          "+",
          () => ((st[key] = Math.min(20, st[key] + 1)), save()),
          "",
          L(`More ${name}`, `Más ${name}`),
        ),
      );
      return row;
    };
    const choice = (opts, key, label) => {
      const row = h("div", "rm-row", "", { role: "radiogroup", "aria-label": label });
      for (const [v, text] of opts) {
        const b = btn(text, () => ((st[key] = v), save()));
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(st[key] === v));
        row.append(b);
      }
      return row;
    };
    const typed = (label, key) => {
      const lab = h("label", "rm-row", `<b>${label}</b>`);
      const inp = h("input", "rm-in", "", {
        type: "text",
        inputmode: "decimal",
        autocomplete: "off",
        value: st[key] ?? "",
      });
      inp.disabled = ro;
      inp.addEventListener("input", () => {
        st[key] = inp.value;
        api.change?.(JSON.parse(JSON.stringify(st)));
      });
      lab.append(inp);
      return lab;
    };

    const drawUnit = () => {
      M.bundles.forEach((bd, i) => {
        const box = h("div", "rm-mix");
        const g = st.g[i];
        const cells = bd.T;
        const Wd = 320;
        const u = Wd / cells;
        const groups = Math.floor(cells / g + 1e-9);
        const left = cells - groups * g;
        let svg = `<svg class="rm-svg" viewBox="0 0 ${Wd + 4} 66" role="img" aria-label="${L(`${f(cells)} dollars split into groups of ${f(g)}`, `${f(cells)} dólares divididos en grupos de ${f(g)}`)}">`;
        for (let k = 0; k < groups; k++)
          svg += `<rect class="g${k % 2 ? " alt" : ""}" x="${2 + k * g * u}" y="8" width="${g * u}" height="30"/>`;
        if (left > 1e-9)
          svg += `<rect class="x" x="${2 + groups * g * u}" y="8" width="${left * u}" height="30"/>`;
        svg += `<text x="${2 + Wd / 2}" y="58">${L(`${groups} groups of ${f(g)}${left > 1e-9 ? `, ${f(left)} left over` : ""}`, `${groups} grupos de ${f(g)}${left > 1e-9 ? `, sobran ${f(left)}` : ""}`)}</text></svg>`;
        box.append(
          h(
            "p",
            "rm-h",
            M.bundles.length > 1
              ? `${"AB"[i]}: ${L(`${bd.n} ${M.item[0]} for $${f(bd.T)}`, `${bd.n} ${M.item[1]} por $${f(bd.T)}`)}`
              : L(
                  `${bd.n} ${M.item[0]}, $${f(bd.T)} in all`,
                  `${bd.n} ${M.item[1]}, $${f(bd.T)} en total`,
                ),
          ),
          h("div", "", svg),
        );
        const sl = h("input", "rm-slide", "", {
          type: "range",
          min: String(M.step),
          max: String(cells / 2),
          step: String(M.step),
          value: String(g),
        });
        sl.setAttribute(
          "aria-label",
          L(
            `Divider: dollars in each group, bundle ${"AB"[i]}`,
            `Divisor: dólares en cada grupo, paquete ${"AB"[i]}`,
          ),
        );
        sl.setAttribute(
          "aria-valuetext",
          L(`${f(g)} dollars in each group`, `${f(g)} dólares en cada grupo`),
        );
        sl.disabled = ro;
        sl.addEventListener("input", () => {
          st.g[i] = Number(sl.value);
          draw();
        });
        sl.addEventListener("change", () =>
          save(L(`${groups} groups of ${f(g)}.`, `${groups} grupos de ${f(g)}.`)),
        );
        box.append(
          sl,
          h("p", "", B(`Dollars in each group: ${f(g)}`, `Dólares en cada grupo: ${f(g)}`)),
        );
        body.append(box);
      });
      if (M.bundles.length > 1)
        body.append(
          h("p", "rm-h", B("Which is the better buy?", "¿Cuál es la mejor compra?")),
          choice(
            [
              ["A", L("Bundle A", "Paquete A")],
              ["B", L("Bundle B", "Paquete B")],
              ["same", L("Same", "Igual")],
            ],
            "pick",
            L("Better buy", "Mejor compra"),
          ),
        );
    };

    function draw() {
      const focus = document.activeElement?.getAttribute?.("aria-label");
      body.textContent = "";
      if (mode === "recipe") {
        if (M.kind === "rev") {
          body.append(
            stepRow(L(an, anEs), "r"),
            stepRow(L(bn, bnEs), "b"),
            mixView(
              L("Your batches", "Tus tandas"),
              st.r,
              st.b,
              st.k,
              (k) => ((st.k = Math.max(1, k)), save()),
              false,
            ),
          );
          body.lastChild.querySelector(".rm-recipe").firstChild.textContent = es()
            ? "Tu receta: "
            : "Your recipe: ";
        } else
          body.append(
            mixView(
              L("Mixing bowl", "Tazón de mezcla"),
              M.r,
              M.b,
              st.k,
              (k) => ((st.k = k), save(L(`${k} batches.`, `${k} tandas.`))),
            ),
          );
      } else if (mode === "equivalent") {
        body.append(
          mixView(
            `${M.r}:${M.b}`,
            M.r,
            M.b,
            st.k,
            (k) => ((st.k = k), save(L(`${k} batches.`, `${k} tandas.`))),
          ),
        );
        if (M.kind === "test")
          body.append(
            h(
              "p",
              "rm-h",
              B(
                `Is ${M.R}:${M.S} equivalent to ${M.r}:${M.b}?`,
                `¿Es ${M.R}:${M.S} equivalente a ${M.r}:${M.b}?`,
              ),
            ),
            choice(
              [
                ["yes", L("Yes", "Sí")],
                ["no", L("No", "No")],
              ],
              "ans",
              L("Equivalent?", "¿Equivalente?"),
            ),
          );
        else
          body.append(
            typed(
              L(
                `Missing ${M.kind === "first" ? "second" : "first"} term:`,
                `Término ${M.kind === "first" ? "segundo" : "primero"} que falta:`,
              ),
              "ans",
            ),
          );
      } else if (mode === "unitrate") drawUnit();
      else {
        M.mixes.forEach(([r, b], i) =>
          body.append(
            mixView(
              L(`Mix ${"AB"[i]}: ${r}:${b}`, `Mezcla ${"AB"[i]}: ${r}:${b}`),
              r,
              b,
              st.k[i],
              (k) => ((st.k[i] = k), save()),
              false,
            ),
          ),
        );
        const opts = [
          ["A", L("Mix A", "Mezcla A")],
          ["B", L("Mix B", "Mezcla B")],
        ];
        if (spec.level === 4) opts.push(["same", L("Same", "Igual")]);
        body.append(
          h("p", "rm-h", B(`Which mix has more ${bn}?`, `¿Qué mezcla tiene más ${bnEs}?`)),
          choice(opts, "pick", L("Stronger mix", "Mezcla más fuerte")),
        );
      }
      if (focus)
        for (const e of body.querySelectorAll("[aria-label]"))
          if (e.getAttribute("aria-label") === focus) return void e.focus?.();
    }
    draw();
    void sol;
    if (!ro) {
      const act = h("div", "rm-act");
      const reset = btn(B("Start over", "Empezar de nuevo"), () => {
        st = init();
        save(L("Started over.", "Empezaste de nuevo."));
      });
      act.append(
        btn(B("Check", "Revisar"), () => api.submit?.(JSON.parse(JSON.stringify(st))), "rm-go"),
        btn(B("Hint", "Pista"), () => api.hint?.()),
        reset,
      );
      for (const b of act.children) b.disabled = false;
      root.append(act);
    }
  }
})();
