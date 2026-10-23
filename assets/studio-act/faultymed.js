/**
 * Practice Studio activity: faultymed, "Faulty build" (lesson 2-3).
 *
 * A student's median is shown with the data cards still in the order they were written, so the middle card is not the
 * middle value. The student first DIAGNOSES what is wrong (one of four statements), then fixes it: tap the cards from
 * least to greatest, then tap the median card. A diagnosis is not a guess: the statements are the real mix-ups
 * (not ordered, mean, mode, greatest). Needs assets/studio-act/u2kit.js (read lazily).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const kit = () => A.kit;
  const LEVELS = [
    null,
    { n: 7, dup: false },
    { n: 9, dup: false },
    { n: 9, dup: true },
    { n: 11, dup: true },
  ];
  const CTX = [
    "the number of minutes seven students spent on a quiz|el número de minutos que estudiantes dedicaron a una prueba|minutes|minutos",
    "the heights of plants in a garden, in centimeters|las alturas de plantas de un jardín, en centímetros|cm|cm",
    "the points scored in a set of games|los puntos anotados en una serie de juegos|points|puntos",
    "the number of books read in a month|el número de libros leídos en un mes|books|libros",
  ];
  /** [text, textEs, role]. The right statement is "order"; lengths are kept close so length is no clue. */
  const DIAG = [
    "The numbers are not in order, so the middle card is not the middle value.|Los números no están en orden, así que la tarjeta del medio no es el valor del medio.|order",
    "The median must be found by adding all the numbers and dividing by how many.|La mediana se halla sumando todos los números y dividiendo entre cuántos son.|mean",
    "The median should be the number that appears most often in the list.|La mediana debe ser el número que aparece más veces en la lista.|mode",
    "The median should be the greatest number, because it is the biggest value.|La mediana debe ser el número mayor, porque es el valor más grande.|max",
  ];
  const FB = {
    mean: "That describes the mean. The median is the middle value of the data after it is put in order.|Eso describe la media. La mediana es el valor del medio de los datos después de ponerlos en orden.",
    mode: "That describes the mode. The median is about position in the ordered list, not about repeats.|Eso describe la moda. La mediana depende de la posición en la lista ordenada, no de las repeticiones.",
    max: "That describes the maximum. The median sits in the middle of the ordered data.|Eso describe el máximo. La mediana está en el medio de los datos ordenados.",
  };

  const sortedCards = (/** @type {number[]} */ v) => v.slice().sort((a, b) => a - b);
  const medianOf = (/** @type {number[]} */ v) => sortedCards(v)[(v.length - 1) / 2];

  const grade = (/** @type {any} */ spec, /** @type {any} */ state) => {
    const K = kit();
    const M = spec.model;
    const s = state || {};
    const vals = M.cards;
    const order = Array.isArray(s.order) ? s.order : [];
    const okPerm =
      order.length === vals.length &&
      new Set(order).size === vals.length &&
      order.every((i) => Number.isInteger(i) && i >= 0 && i < vals.length);
    const ascending = okPerm && order.every((i, k) => k === 0 || vals[order[k - 1]] <= vals[i]);
    const midOk = okPerm && ascending && Number.isInteger(s.mid) && vals[s.mid] === medianOf(vals);
    const dRole = Number.isInteger(s.diag) ? M.diag[s.diag]?.role : null;
    const marks = [dRole === "order", ascending, !!midOk];
    const score = K.score(marks);
    if (dRole == null)
      return K.no(
        "stat-data-not-ordered",
        "First decide what is wrong with the claim. Choose one statement.|Primero decide qué está mal en la afirmación. Elige un enunciado.",
        score,
      );
    if (dRole !== "order") return K.no("stat-median-middle-wrong", FB[dRole], score);
    if (!ascending)
      return K.no(
        "stat-data-not-ordered",
        "Tap every card in order from the least value to the greatest. Each tap sends one card to the ordered row.|Toca cada tarjeta en orden, del valor menor al mayor. Cada toque envía una tarjeta a la fila ordenada.",
        score,
      );
    if (!midOk)
      return K.no(
        "stat-median-middle-wrong",
        `The cards are in order now. Count in from both ends: the median is the card with the same number of cards on each side.|Las tarjetas ya están en orden. Cuenta desde los dos extremos: la mediana es la tarjeta que tiene la misma cantidad de tarjetas a cada lado.`,
        score,
      );
    return { ok: true, ...score };
  };

  A.register("faultymed", {
    title: "Faulty build",
    titleEs: "Construcción con error",
    levels: 4,
    make(/** @type {any} */ rng, /** @type {number} */ level) {
      const P = LEVELS[level];
      const [thing, thingEs, unit, unitEs] = rng.pick(CTX).split("|");
      let cards = /** @type {number[]} */ ([]);
      for (let t = 0; t < 400; t++) {
        const pool = P.dup
          ? Array.from({ length: P.n }, () => rng.int(2, 20))
          : rng.distinct(P.n, 2, 30);
        if (P.dup && new Set(pool).size === P.n) continue;
        const mid = (P.n - 1) / 2;
        // the written middle card must differ from the true median, or the claim would happen to be right
        if (pool[mid] !== medianOf(pool)) {
          cards = pool;
          break;
        }
      }
      if (!cards.length) cards = [9, 3, 14, 6, 11, 2, 8].slice(0, P.n);
      if (level === 4) cards[cards.indexOf(Math.max(...cards))] += 25;
      const claim = cards[(P.n - 1) / 2];
      const diag = rng.shuffle(
        DIAG.map((d) => d.split("|")).map(([t, tEs, role]) => ({ t, tEs, role })),
      );
      return {
        q: `Sam found the median of ${thing}. Sam wrote the cards in the order they were collected and said, "The median is ${claim}, the card in the middle." Decide what is wrong. Then fix it: tap the cards from least to greatest, and tap the median card.`,
        qEs: `Sam halló la mediana de ${thingEs}. Sam escribió las tarjetas en el orden en que se reunieron y dijo: "La mediana es ${claim}, la tarjeta del medio". Decide qué está mal. Luego arréglalo: toca las tarjetas de menor a mayor y toca la tarjeta de la mediana.`,
        x: "The median is the middle value of the data in order. Sam took the middle card of the unordered list, which is only the middle by position in the list. After the cards are put in order, the median is the card with the same number of cards on each side.",
        xEs: "La mediana es el valor del medio de los datos en orden. Sam tomó la tarjeta del medio de la lista sin ordenar, que solo es la del medio por su lugar en la lista. Con las tarjetas en orden, la mediana es la tarjeta que tiene la misma cantidad de tarjetas a cada lado.",
        h: [
          "Read the cards from left to right. Is each card at least as big as the card before it?",
          "A median is only the middle value when the values are lined up from least to greatest.",
          "After you put the cards in order, count how many cards are on each side of the one you pick.",
        ],
        hEs: [
          "Lee las tarjetas de izquierda a derecha. ¿Cada tarjeta es al menos tan grande como la anterior?",
          "Una mediana solo es el valor del medio cuando los valores están alineados de menor a mayor.",
          "Cuando pongas las tarjetas en orden, cuenta cuántas tarjetas hay a cada lado de la que elijas.",
        ],
        model: { cards, claim, unit, unitEs, diag },
      };
    },
    solution(/** @type {any} */ spec) {
      const M = spec.model;
      const idx = M.cards.map((_v, i) => i).sort((a, b) => M.cards[a] - M.cards[b] || a - b);
      return {
        diag: M.diag.findIndex((/** @type {any} */ d) => d.role === "order"),
        order: idx,
        mid: idx[(idx.length - 1) / 2],
      };
    },
    wrong(/** @type {any} */ spec) {
      const M = spec.model;
      const sol = A.registry.faultymed.solution(spec);
      const bad = M.diag.findIndex((/** @type {any} */ d) => d.role === "mean");
      const written = M.cards.map((_v, i) => i);
      const midWritten = (M.cards.length - 1) / 2;
      const nearMid = sol.order[(sol.order.length - 1) / 2 + 1];
      return [
        { ...sol, diag: bad },
        { ...sol, diag: null },
        { ...sol, order: written },
        { ...sol, order: sol.order.slice(0, -1) },
        { ...sol, mid: midWritten },
        { ...sol, mid: nearMid },
      ].filter((s) => !grade(spec, s).ok);
    },
    grade,
    mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
      const K = kit();
      const M = spec.model;
      const n = M.cards.length;
      const { root, L, B, live, ro } = K.shell(host, api);
      const saved = api.restore && Array.isArray(api.restore.order) ? api.restore : null;
      const st = {
        diag: saved && Number.isInteger(saved.diag) ? saved.diag : null,
        order: saved ? saved.order.slice() : [],
        mid: saved && Number.isInteger(saved.mid) ? saved.mid : null,
      };
      const emit = () => api.change?.({ diag: st.diag, order: st.order.slice(), mid: st.mid });
      root.append(
        A.el(
          "p",
          "u2-note",
          `<b>${B("1. What is wrong with Sam's claim?", "1. ¿Qué está mal en la afirmación de Sam?")}</b>`,
        ),
      );
      K.choices(
        root,
        M.diag.map((/** @type {any} */ d) => ({ en: d.t, es: d.tEs })),
        st.diag,
        ro,
        (i) => {
          st.diag = i;
          emit();
        },
        L("What is wrong", "Qué está mal"),
        B,
      );
      root.append(
        A.el(
          "p",
          "u2-note",
          `<b>${B("2. The cards as Sam wrote them", "2. Las tarjetas como las escribió Sam")}</b>`,
        ),
      );
      const written = A.el("div", "u2-row");
      const ordered = A.el("div", "u2-row");
      const undo = A.el("button", "u2-btn", B("Undo last card", "Deshacer la última tarjeta"), {
        type: "button",
      });
      const cardCss = "min-width:48px;text-align:center;font-weight:800";
      const cards = M.cards.map((/** @type {number} */ v, /** @type {number} */ i) => {
        const b = A.el("button", "u2-opt", String(v), { type: "button" });
        b.style.cssText = cardCss;
        b.disabled = ro;
        b.addEventListener("click", () => {
          if (st.order.includes(i)) return;
          st.order.push(i);
          st.mid = null;
          paint();
          emit();
        });
        written.append(b);
        return b;
      });
      const hint = A.el("p", "u2-note");
      root.append(written);
      root.append(
        A.el(
          "p",
          "u2-note",
          `<b>${B("3. The cards in order. Then tap the median card.", "3. Las tarjetas en orden. Luego toca la tarjeta de la mediana.")}</b>`,
        ),
        ordered,
        hint,
        undo,
        live,
      );
      undo.disabled = ro;
      undo.addEventListener("click", () => {
        st.order.pop();
        st.mid = null;
        paint();
        emit();
      });
      const paint = () => {
        cards.forEach((b, i) => {
          const used = st.order.includes(i);
          b.setAttribute(
            "aria-label",
            L(
              `Card ${M.cards[i]}${used ? ", already placed" : ", tap to place next"}`,
              `Tarjeta ${M.cards[i]}${used ? ", ya colocada" : ", toca para colocarla"}`,
            ),
          );
          b.style.opacity = used ? ".4" : "";
        });
        ordered.textContent = "";
        const full = st.order.length === n;
        st.order.forEach((i, k) => {
          const b = A.el("button", "u2-opt", String(M.cards[i]), { type: "button" });
          b.style.cssText = cardCss;
          b.setAttribute("aria-pressed", String(st.mid === i));
          b.setAttribute(
            "aria-label",
            L(
              `Place ${k + 1}: ${M.cards[i]}${full ? ". Tap to choose as the median." : ""}`,
              `Lugar ${k + 1}: ${M.cards[i]}${full ? ". Toca para elegirla como la mediana." : ""}`,
            ),
          );
          b.disabled = ro || !full;
          if (st.mid === i) b.style.background = "var(--sun,#F0BD4F)";
          b.addEventListener("click", () => {
            st.mid = i;
            paint();
            emit();
          });
          ordered.append(b);
        });
        hint.innerHTML = full
          ? B(
              "All cards are placed. Tap the card you think is the median.",
              "Todas las tarjetas están colocadas. Toca la tarjeta que crees que es la mediana.",
            )
          : B(
              `Tap the cards in the top row from the least value to the greatest. Placed: ${st.order.length} of ${n}.`,
              `Toca las tarjetas de la fila de arriba, del valor menor al mayor. Colocadas: ${st.order.length} de ${n}.`,
            );
        undo.disabled = ro || !st.order.length;
      };
      paint();
      if (!ro)
        K.actions(
          root,
          api,
          B,
          () => ({ diag: st.diag, order: st.order.slice(), mid: st.mid }),
          () => {
            st.diag = null;
            st.order = [];
            st.mid = null;
            root
              .querySelectorAll('[role="radio"]')
              .forEach((b) => b.setAttribute("aria-checked", "false"));
            paint();
            emit();
          },
        );
    },
  });
})();
