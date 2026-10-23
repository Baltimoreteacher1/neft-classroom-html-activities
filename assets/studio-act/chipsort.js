/**
 * Practice Studio activity: chipsort, "One division, four questions" (lesson 2-6).
 *
 * One division fact (for example 150 ÷ 12 = 12 R 6) answers four different questions. The student puts each number chip
 * on the question it answers: full boxes, boxes needed to hold everything, items left over, and the amount if part of
 * a box counts. At levels 3 and 4 there is a fifth chip: the items inside the full boxes. A wrong placement says what
 * that number counts and never which chip belongs where. All chip values are computed by code.
 * Needs assets/studio-act/u2kit.js (read lazily).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  /** [items, itemsEs, container, containers, containerEs, containersEs] ; every Spanish container is feminine. */
  const CTX = [
    "markers|marcadores|box|boxes|caja|cajas",
    "oranges|naranjas|bag|bags|bolsa|bolsas",
    "seeds|semillas|tray|trays|bandeja|bandejas",
    "books|libros|crate|crates|caja|cajas",
  ];
  /** Divisors and remainders whose decimal quotient ends within two decimal places. */
  const PAIRS = (() => {
    const out = /** @type {number[][]} */ ([]);
    for (const d of [4, 5, 8, 10, 12, 15, 20, 25])
      for (let r = 1; r < d; r++) if ((r * 100) % d === 0) out.push([d, r]);
    return out;
  })();
  const KEYS = ["full", "need", "left", "part", "inFull"];

  const cap = (/** @type {string} */ s) => s.charAt(0).toUpperCase() + s.slice(1);

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const place = Array.isArray(state?.place) ? state.place : [];
    const want = M.chips.map((/** @type {any} */ c) =>
      M.bins.findIndex((/** @type {any} */ b) => b.key === c.key),
    );
    const marks = M.chips.map((_c, i) => place[i] === want[i]);
    const score = K.score(marks);
    if (marks.every(Boolean)) return { ok: true, ...score };
    const open = M.chips.findIndex((_c, i) => !Number.isInteger(place[i]));
    if (open >= 0)
      return K.no(
        "chipsort-open",
        "Every number chip needs a question. Put each chip on one question before you check.|Cada ficha con un número necesita una pregunta. Pon cada ficha en una pregunta antes de revisar.",
        score,
      );
    const bad = marks.findIndex((m) => !m);
    const chip = M.chips[bad];
    const bin = M.bins[place[bad]];
    const [t, tEs] = M.says[chip.key];
    const tag =
      chip.key === "left" || bin?.key === "left" ? "remainder-misused" : "division-parts-misnamed";
    return K.no(
      tag,
      `${chip.v} does not answer "${bin?.l}". ${t}|${chip.v} no responde "${bin?.lEs}". ${tEs}`,
      score,
    );
  };

  A.register("chipsort", {
    title: "One division, four questions",
    titleEs: "Una división, cuatro preguntas",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const K = kit();
      const [it, itEs, c, cp, cEs, cpEs] = rng.pick(CTX).split("|");
      const [d, r] = rng.pick(PAIRS);
      const qLo = level === 1 ? 8 : level === 2 ? 12 : level === 3 ? 15 : 24;
      const qHi = level === 1 ? 14 : level === 2 ? 40 : level === 3 ? 40 : 60;
      let q = rng.int(qLo, qHi);
      while (r === q || r === q + 1) q += 2;
      const D = q * d + r;
      const dec = K.f(q + r / d);
      const five = level >= 3;
      const keys = five ? KEYS : KEYS.slice(0, 4);
      const val = /** @type {any} */ ({
        full: String(q),
        need: String(q + 1),
        left: String(r),
        part: dec,
        inFull: String(q * d),
      });
      const says = /** @type {any} */ ({
        full: [
          `${q} is how many ${cp} you can fill all the way. Each one holds exactly ${d} ${it}.`,
          `${q} es cuántas ${cpEs} puedes llenar por completo. Cada una tiene exactamente ${d} ${itEs}.`,
        ],
        need: [
          `${q + 1} counts ${cp}: the ${q} full ones plus one more ${c} for the ${r} ${it} that do not fill a ${c}.`,
          `${q + 1} cuenta ${cpEs}: las ${q} llenas más una ${cEs} más para los ${r} ${itEs} que no llenan una ${cEs}.`,
        ],
        left: [
          `${r} counts ${it}, not ${cp}. They are the ${it} that do not fill another ${c}.`,
          `${r} cuenta ${itEs}, no ${cpEs}. Son los ${itEs} que no llenan otra ${cEs}.`,
        ],
        part: [
          `${dec} counts ${cp} too, but it lets the last ${c} be only partly full. The ${r} extra ${it} are a part of a ${c}.`,
          `${dec} también cuenta ${cpEs}, pero deja que la última ${cEs} esté llena solo en parte. Los ${r} ${itEs} extra son una parte de una ${cEs}.`,
        ],
        inFull: [
          `${q * d} counts ${it}, not ${cp}. It is how many ${it} went into the full ${cp}.`,
          `${q * d} cuenta ${itEs}, no ${cpEs}. Es cuántos ${itEs} entraron en las ${cpEs} llenas.`,
        ],
      });
      const labels = /** @type {any} */ ({
        full: [`Full ${cp}`, `${cap(cpEs)} llenas`],
        need: [
          `${cap(cp)} needed to pack all the ${it}`,
          `${cap(cpEs)} que se necesitan para guardar todos los ${itEs}`,
        ],
        left: [`${cap(it)} left over`, `${cap(itEs)} que sobran`],
        part: [
          `${cap(cp)} if a part of a ${c} can count`,
          `${cap(cpEs)} si cuenta una parte de una ${cEs}`,
        ],
        inFull: [`${cap(it)} in the full ${cp}`, `${cap(itEs)} en las ${cpEs} llenas`],
      });
      const bins = keys.map((key) => ({ key, l: labels[key][0], lEs: labels[key][1] }));
      const chips = rng.shuffle(keys.map((key) => ({ key, v: val[key] })));
      return {
        q: `${D} ${it} are packed ${d} to a ${c}. ${D} ÷ ${d} = ${q} R ${r}. This one division answers ${keys.length} different questions. Put each number chip on the question it answers.`,
        qEs: `Se guardan ${D} ${itEs}, ${d} en cada ${cEs}. ${D} ÷ ${d} = ${q} R ${r}. Esta división responde ${keys.length} preguntas distintas. Pon cada ficha con un número en la pregunta que responde.`,
        x: `The quotient ${q} and the remainder ${r} mean different things. ${q} is the number of full ${cp}. ${r} is the ${it} left over. One more ${c} is needed to hold them, so ${q + 1} ${cp} hold everything. If a ${c} can be partly full, the answer is ${dec}.`,
        xEs: `El cociente ${q} y el residuo ${r} significan cosas distintas. ${q} es el número de ${cpEs} llenas. ${r} son los ${itEs} que sobran. Se necesita una ${cEs} más para guardarlos, así que ${q + 1} ${cpEs} guardan todo. Si una ${cEs} puede estar llena solo en parte, la respuesta es ${dec}.`,
        h: [
          "Ask what each number counts: whole boxes, items, or boxes that may be only partly full.",
          "The remainder counts items. The quotient counts whole groups of the divisor.",
          "Think about what happens to the items that do not fill another box.",
        ],
        hEs: [
          "Pregunta qué cuenta cada número: cajas enteras, objetos o cajas que pueden estar llenas solo en parte.",
          "El residuo cuenta objetos. El cociente cuenta grupos completos del divisor.",
          "Piensa qué pasa con los objetos que no llenan otra caja.",
        ],
        model: { D, d, q, r, it, itEs, bins, chips, says },
      };
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      return {
        place: M.chips.map((/** @type {any} */ c) =>
          M.bins.findIndex((/** @type {any} */ b) => b.key === c.key),
        ),
      };
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.chipsort.solution(spec);
      const sw = sol.place.slice();
      [sw[0], sw[1]] = [sw[1], sw[0]];
      const rot = sol.place.map((_p, i) => sol.place[(i + 1) % sol.place.length]);
      return [
        { place: sw },
        { place: rot },
        { place: sol.place.map((p, i) => (i === 0 ? null : p)) },
        { place: M.chips.map(() => null) },
      ].filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const { root, L, B, live, ro } = K.shell(host, api);
      const saved = api.restore && Array.isArray(api.restore.place) ? api.restore : null;
      const st = { place: saved ? saved.place.slice() : M.chips.map(() => null) };
      let sel = /** @type {number|null} */ (null);
      const emit = () => api.change?.({ place: st.place.slice() });
      const tray = A.el("div", "u2-row", "", {
        role: "group",
        "aria-label": L("Number chips", "Fichas con números"),
      });
      const binsEl = A.el("div", "", "", {});
      binsEl.style.cssText = "display:grid;gap:8px";
      const chipBtns = M.chips.map((/** @type {any} */ c, /** @type {number} */ i) => {
        const b = A.el("button", "u2-opt", c.v, { type: "button" });
        b.style.cssText = "min-width:64px;text-align:center;font-weight:800;font-size:1.15rem";
        b.disabled = ro;
        b.addEventListener("click", () => {
          if (st.place[i] != null) return;
          sel = sel === i ? null : i;
          paint();
        });
        tray.append(b);
        return b;
      });
      const binBtns = M.bins.map((/** @type {any} */ bn, /** @type {number} */ j) => {
        const b = A.el("button", "u2-opt", "", { type: "button" });
        b.style.cssText =
          "display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%";
        b.disabled = ro;
        b.addEventListener("click", () => {
          const here = st.place.indexOf(j);
          if (sel != null) {
            if (here >= 0) st.place[here] = null;
            st.place[sel] = j;
            sel = null;
          } else if (here >= 0) {
            st.place[here] = null;
            sel = here;
          } else {
            const m = L(
              "Tap a number chip first, then tap a question.",
              "Toca primero una ficha con un número y luego una pregunta.",
            );
            live.textContent = m;
            return api.say?.(m);
          }
          paint();
          emit();
        });
        binsEl.append(b);
        return b;
      });
      const paint = () => {
        chipBtns.forEach((b, i) => {
          const placed = st.place[i] != null;
          b.hidden = placed;
          b.setAttribute("aria-pressed", String(sel === i));
          b.setAttribute(
            "aria-label",
            L(
              `Number chip ${M.chips[i].v}${sel === i ? ", selected" : ""}`,
              `Ficha ${M.chips[i].v}${sel === i ? ", seleccionada" : ""}`,
            ),
          );
        });
        binBtns.forEach((b, j) => {
          const here = st.place.indexOf(j);
          const bn = M.bins[j];
          const v = here >= 0 ? M.chips[here].v : null;
          b.innerHTML = `<span>${B(bn.l, bn.lEs)}</span><b style="min-width:3.2em;text-align:center;border:2px dashed var(--border,#D5DCE5);border-radius:8px;padding:4px 8px">${v ?? "—"}</b>`;
          b.setAttribute(
            "aria-label",
            L(
              `${bn.l}: ${v == null ? "empty" : `chip ${v}. Tap to take it back.`}`,
              `${bn.lEs}: ${v == null ? "vacía" : `ficha ${v}. Toca para quitarla.`}`,
            ),
          );
        });
      };
      root.append(
        A.el("p", "u2-note", `<b>${B("Number chips", "Fichas con números")}</b>`),
        tray,
        A.el("p", "u2-note", `<b>${B("Questions", "Preguntas")}</b>`),
        binsEl,
        live,
      );
      paint();
      if (!ro)
        K.actions(
          root,
          api,
          B,
          () => ({ place: st.place.slice() }),
          () => {
            st.place = M.chips.map(() => null);
            sel = null;
            paint();
            emit();
          },
        );
    },
  });
})();
