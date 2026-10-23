/**
 * Practice Studio activity: tagtape (lesson 3-1, "Understand Ratios").
 *
 * A tape shows two groups, for example 3 red cells and 5 blue cells. Four ratio cards (3 : 5, 5 : 3, 3 : 8, 8 : 3) are placed on the
 * four sentences they could match (red to blue, blue to red, red to all, all to red). Each time a card is placed, the tape marks what
 * THAT card really compares ("your 3 : 8 spans the whole tape"), so the student sees the part-to-part and part-to-whole difference
 * before any check. A miss names what the card compares and never says which sentence it belongs to. The cells are told apart by
 * pattern (solid and striped), never by colour alone. Contract: docs/specs/practice-studio-v2.md section 5.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const G = W.StudioGen;

  /** [group a, group b, the whole] each as [English, Spanish] */
  const CTX = [
    [
      ["red tiles", "fichas rojas"],
      ["blue tiles", "fichas azules"],
      ["all the tiles", "todas las fichas"],
    ],
    [
      ["cats", "gatos"],
      ["dogs", "perros"],
      ["all the animals", "todos los animales"],
    ],
    [
      ["guitars", "guitarras"],
      ["drums", "tambores"],
      ["all the instruments", "todos los instrumentos"],
    ],
    [
      ["apples", "manzanas"],
      ["pears", "peras"],
      ["all the fruit", "toda la fruta"],
    ],
    [
      ["tulips", "tulipanes"],
      ["roses", "rosas"],
      ["all the flowers", "todas las flores"],
    ],
    [
      ["red cars", "carros rojos"],
      ["white cars", "carros blancos"],
      ["all the cars", "todos los carros"],
    ],
  ];
  /** slot kinds: which two spans the sentence compares, first then second */
  const KINDS = { ab: ["a", "b"], ba: ["b", "a"], aw: ["a", "w"], wa: ["w", "a"] };
  const ORDER = ["ab", "ba", "aw", "wa"];

  const say = {
    incomplete:
      "Place all four ratio cards on the sentences first.|Primero coloca las cuatro tarjetas de razón en las oraciones.",
    miss: "Your {x} : {y} compares {p} with {q}. That is not what this sentence says. Look at the marks on the tape.|Tu {x} : {y} compara {p} con {q}. Eso no es lo que dice esta oración. Mira las marcas en la cinta.",
  };
  const HINTS = [
    "Count the cells in each group, then count all the cells on the tape.|Cuenta las celdas de cada grupo y luego todas las celdas de la cinta.",
    "A ratio says the first group first. Part to part uses two groups. Part to whole uses one group and all the cells.|Una razón dice primero el primer grupo. Parte a parte usa dos grupos. Parte a todo usa un grupo y todas las celdas.",
    "Place one card and read the marks on the tape. They show which cells each number counts.|Coloca una tarjeta y lee las marcas en la cinta. Muestran qué celdas cuenta cada número.",
  ];
  const EXPLAIN =
    "Part to part compares one group with the other group. Part to whole compares one group with all the cells. The order of the words is the order of the numbers.|Parte a parte compara un grupo con el otro grupo. Parte a todo compara un grupo con todas las celdas. El orden de las palabras es el orden de los números.";

  const spanName = (/** @type {any[]} */ ctx, /** @type {string} */ s, /** @type {boolean} */ es) =>
    (s === "a" ? ctx[0] : s === "b" ? ctx[1] : ctx[2])[es ? 1 : 0];
  const sentence = (
    /** @type {any[]} */ ctx,
    /** @type {string} */ kind,
    /** @type {boolean} */ es,
  ) => {
    const [p, q] = KINDS[/** @type {"ab"} */ (kind)];
    return `${spanName(ctx, p, es)} ${es ? "a" : "to"} ${spanName(ctx, q, es)}`;
  };
  const count = (/** @type {any} */ M, /** @type {string} */ s) =>
    s === "a" ? M.r : s === "b" ? M.b : M.r + M.b;

  A.register("tagtape", {
    title: "Tag the tape",
    titleEs: "Etiqueta la cinta",
    levels: 4,
    make(rng, level) {
      const hi = [5, 7, 9, 12][level - 1];
      let r;
      let b;
      do {
        r = rng.int(2, hi);
        b = rng.int(2, hi);
      } while (r === b || r + b > 20 || G.gcd(r, b) !== 1);
      const ctxIdx = rng.int(0, CTX.length - 1);
      const ctx = CTX[ctxIdx];
      const nums = { ab: [r, b], ba: [b, r], aw: [r, r + b], wa: [r + b, r] };
      const cards = rng.shuffle(ORDER.slice()).map((k, i) => ({
        id: `c${i}`,
        kind: k,
        x: nums[/** @type {"ab"} */ (k)][0],
        y: nums[/** @type {"ab"} */ (k)][1],
      }));
      const slots = ORDER.map((k, i) => ({ id: `s${i}`, kind: k }));
      const q = `A tape has ${r} cells of ${ctx[0][0]} and ${b} cells of ${ctx[1][0]}. Place each ratio card on the sentence it matches.`;
      const qEs = `Una cinta tiene ${r} celdas de ${ctx[0][1]} y ${b} celdas de ${ctx[1][1]}. Coloca cada tarjeta de razón en la oración que le corresponde.`;
      const [x, xEs] = EXPLAIN.split("|");
      const hs = HINTS.map((s) => s.split("|"));
      return {
        q,
        qEs,
        x,
        xEs,
        h: hs.map((s) => s[0]),
        hEs: hs.map((s) => s[1]),
        model: { r, b, ctx: ctxIdx, cards, slots },
      };
    },
    solution(spec) {
      const M = spec.model;
      /** @type {Record<string, string>} */
      const place = {};
      for (const s of M.slots)
        place[s.id] = M.cards.find((/** @type {any} */ c) => c.kind === s.kind).id;
      return { place };
    },
    wrong(spec) {
      const M = spec.model;
      const sol = /** @type {any} */ (A.registry.tagtape.solution(spec)).place;
      const swap = (/** @type {number} */ i, /** @type {number} */ j) => {
        const p = { ...sol };
        [p[`s${i}`], p[`s${j}`]] = [p[`s${j}`], p[`s${i}`]];
        return { place: p };
      };
      // slots are in ORDER: ab, ba, aw, wa
      void M;
      return [{ place: {} }, swap(0, 1), swap(0, 2), swap(2, 3)];
    },
    grade(spec, st) {
      const M = spec.model;
      const ctx = CTX[M.ctx];
      const place = st?.place || {};
      const marks = M.slots.map((/** @type {any} */ s) => {
        const c = M.cards.find((/** @type {any} */ k) => k.id === place[s.id]);
        return c ? c.kind === s.kind : null;
      });
      const right = marks.filter((/** @type {any} */ m) => m === true).length;
      const base = { right, of: M.slots.length, marks };
      if (marks.some((/** @type {any} */ m) => m === null)) {
        const [en, es] = say.incomplete.split("|");
        return { ok: false, tag: "incomplete", say: en, sayEs: es, ...base };
      }
      if (right === M.slots.length) return { ok: true, ...base };
      const i = marks.indexOf(false);
      const slot = M.slots[i];
      const card = M.cards.find((/** @type {any} */ k) => k.id === place[slot.id]);
      const [p, q] = KINDS[/** @type {"ab"} */ (card.kind)];
      const phrase = (/** @type {string} */ s, /** @type {boolean} */ es) =>
        s === "w"
          ? `${es ? "toda la cinta" : "the whole tape"} (${count(M, s)})`
          : `${spanName(ctx, s, es)} (${count(M, s)})`;
      const fill = (/** @type {string} */ t, /** @type {boolean} */ es) =>
        t
          .replace("{x}", card.x)
          .replace("{y}", card.y)
          .replace("{p}", phrase(p, es))
          .replace("{q}", phrase(q, es));
      const [en, es] = say.miss.split("|");
      const hasW = (/** @type {string} */ k) => k.includes("w");
      const tag = hasW(card.kind) !== hasW(slot.kind) ? "part-whole-mixup" : "ratio-inverted";
      return { ok: false, tag, say: fill(en, false), sayEs: fill(es, true), ...base };
    },
    mount: (host, spec, api) => mountTag(host, spec, api),
  });

  const CSS = `
.tt-root{display:grid;gap:12px;color:var(--ink,#1B2733);font:inherit}
.tt-btn{appearance:none;font:inherit;font-weight:800;cursor:pointer;min-height:44px;min-width:44px;padding:4px 14px;border-radius:var(--radius-md,14px);border:2px solid var(--brand,#2C4A68);border-bottom-width:4px;background:var(--surface,#fff);color:var(--ink,#1B2733)}
.tt-btn:hover:not(:disabled){background:var(--brand-tint,#E5ECF3)}
.tt-btn:disabled{opacity:.45;cursor:not-allowed}
.tt-btn[aria-pressed="true"]{background:var(--brand-tint,#E5ECF3);box-shadow:inset 0 0 0 3px var(--brand,#2C4A68)}
.tt-btn:focus-visible{outline:4px solid var(--sun,#F0BD4F);outline-offset:2px}
.tt-go{background:var(--brand,#2C4A68);color:var(--surface,#fff)}
.tt-h{margin:0;font-weight:800}
.tt-tape{display:flex;flex-wrap:wrap;gap:3px}
.tt-c{width:26px;height:34px;border:2px solid var(--brand,#2C4A68);border-radius:4px;box-sizing:border-box}
.tt-c.a{background:var(--brand,#2C4A68)}
.tt-c.b{background:repeating-linear-gradient(45deg,var(--brand,#2C4A68) 0 3px,var(--surface,#fff) 3px 7px)}
.tt-c.on{outline:3px solid var(--sun,#F0BD4F);outline-offset:1px}
.tt-legend{display:flex;flex-wrap:wrap;gap:12px;font-weight:700}
.tt-sw{display:inline-block;width:22px;height:16px;border:2px solid var(--brand,#2C4A68);border-radius:3px;vertical-align:middle;margin-right:6px}
.tt-sw.a{background:var(--brand,#2C4A68)}
.tt-sw.b{background:repeating-linear-gradient(45deg,var(--brand,#2C4A68) 0 3px,var(--surface,#fff) 3px 7px)}
.tt-cards,.tt-slots{display:flex;flex-wrap:wrap;gap:10px}
.tt-card{font-size:1.25rem;min-width:84px}
.tt-slot{border:2px solid var(--border,#D5DCE5);border-radius:var(--radius-md,14px);padding:8px 10px;display:grid;gap:6px;min-width:150px;background:var(--surface,#fff)}
.tt-slot.drop{border-style:dashed;border-color:var(--brand,#2C4A68)}
.tt-slot .put{font-weight:800;font-size:1.2rem}
.tt-say{padding:8px 12px;border-radius:12px;background:var(--brand-tint,#E5ECF3);font-weight:700;min-height:1.5em}
.tt-act{display:flex;flex-wrap:wrap;gap:10px}
@media (forced-colors:active){.tt-btn,.tt-slot,.tt-c{border-color:ButtonText}}
`;

  function mountTag(
    /** @type {HTMLElement} */ host,
    /** @type {any} */ spec,
    /** @type {any} */ api,
  ) {
    A.css("tagtape", CSS);
    const M = spec.model;
    const ctx = CTX[M.ctx];
    const ro = !!api.solved;
    const es = () => !!api.es?.();
    const L = (/** @type {string} */ en, /** @type {string} */ e) => (es() ? e : en);
    const B = (/** @type {string} */ en, /** @type {string} */ e) => A.t(en, e);
    const h = (/** @type {string} */ tg, cls = "", html = "", at = {}) =>
      /** @type {any} */ (A.el(tg, cls, html, at));
    /** @type {{place: Record<string, string>}} */
    let st = api.restore ? JSON.parse(JSON.stringify(api.restore)) : { place: {} };
    /** @type {string|null} */
    let pick = null;
    /** @type {string|null} */
    let shown = null;
    const cardOf = (/** @type {string} */ id) =>
      M.cards.find((/** @type {any} */ c) => c.id === id);
    const save = (/** @type {string=} */ msg) => {
      api.change?.(JSON.parse(JSON.stringify(st)));
      if (msg) api.say?.(msg);
      draw();
    };
    host.textContent = "";
    const root = h("div", "tt-root");
    const body = h("div", "tt-root");
    root.append(body);
    host.append(root);
    const btn = (
      /** @type {string} */ html,
      /** @type {() => void} */ fn,
      cls = "",
      label = "",
      dis = ro,
    ) => {
      const b = h("button", `tt-btn ${cls}`, html, { type: "button" });
      if (label) b.setAttribute("aria-label", label);
      b.disabled = dis;
      b.addEventListener("click", fn);
      return b;
    };
    const place = (/** @type {string} */ slotId, /** @type {string} */ cardId) => {
      for (const k of Object.keys(st.place)) if (st.place[k] === cardId) delete st.place[k];
      st.place[slotId] = cardId;
      pick = null;
      shown = cardId;
      save();
    };
    /** the tape cells a card's numbers count: first number cells and second number cells */
    const marks = (/** @type {any} */ card) => {
      if (!card) return { first: [], second: [] };
      const [p, q] = KINDS[/** @type {"ab"} */ (card.kind)];
      const cells = (/** @type {string} */ s) =>
        s === "a"
          ? Array.from({ length: M.r }, (_, i) => i)
          : s === "b"
            ? Array.from({ length: M.b }, (_, i) => M.r + i)
            : Array.from({ length: M.r + M.b }, (_, i) => i);
      return { first: cells(p), second: cells(q), p, q };
    };

    function draw() {
      const focus = document.activeElement?.getAttribute?.("aria-label");
      body.textContent = "";
      const card = shown ? cardOf(shown) : null;
      const mk = marks(card);
      const tape = h("div", "tt-tape", "", {
        role: "img",
        "aria-label": L(
          `Tape with ${M.r} cells of ${ctx[0][0]} and ${M.b} cells of ${ctx[1][0]}`,
          `Cinta con ${M.r} celdas de ${ctx[0][1]} y ${M.b} celdas de ${ctx[1][1]}`,
        ),
      });
      for (let i = 0; i < M.r + M.b; i++)
        tape.append(
          h(
            "div",
            `tt-c ${i < M.r ? "a" : "b"}${mk.first.includes(i) || mk.second.includes(i) ? " on" : ""}`,
          ),
        );
      body.append(tape);
      const lg = h("div", "tt-legend");
      lg.innerHTML = `<span><span class="tt-sw a"></span>${B(ctx[0][0], ctx[0][1])}</span><span><span class="tt-sw b"></span>${B(ctx[1][0], ctx[1][1])}</span>`;
      body.append(lg);
      const msg = h("p", "tt-say", "", { role: "status" });
      if (card) {
        const nameOf = (/** @type {string} */ s, /** @type {boolean} */ e) =>
          s === "w" ? (e ? "toda la cinta" : "the whole tape") : spanName(ctx, s, e);
        msg.innerHTML = B(
          `Your ${card.x} : ${card.y} counts ${count(M, mk.p)} cells of ${nameOf(mk.p, false)}, then ${count(M, mk.q)} cells of ${nameOf(mk.q, false)}. The marked cells show it.`,
          `Tu ${card.x} : ${card.y} cuenta ${count(M, mk.p)} celdas de ${nameOf(mk.p, true)} y luego ${count(M, mk.q)} celdas de ${nameOf(mk.q, true)}. Las celdas marcadas lo muestran.`,
        );
      } else
        msg.innerHTML = B(
          "Pick a card, then pick a sentence. The tape shows what your card counts.",
          "Elige una tarjeta y luego una oración. La cinta muestra lo que cuenta tu tarjeta.",
        );
      body.append(msg);
      body.append(h("p", "tt-h", B("Ratio cards", "Tarjetas de razón")));
      const cards = h("div", "tt-cards", "", {
        role: "group",
        "aria-label": L("Ratio cards", "Tarjetas de razón"),
      });
      for (const c of M.cards) {
        const used = Object.values(st.place).includes(c.id);
        const b = btn(
          `${c.x} : ${c.y}`,
          () => ((pick = pick === c.id ? null : c.id), (shown = pick || shown), draw()),
          "tt-card",
          `${c.x} : ${c.y}`,
          ro || used,
        );
        b.setAttribute("aria-pressed", String(pick === c.id));
        b.draggable = !ro && !used;
        b.addEventListener("dragstart", (/** @type {any} */ e) =>
          e.dataTransfer?.setData("text/plain", c.id),
        );
        cards.append(b);
      }
      body.append(cards);
      body.append(h("p", "tt-h", B("Sentences", "Oraciones")));
      const slots = h("div", "tt-slots");
      for (const s of M.slots) {
        const placed = cardOf(st.place[s.id]);
        const box = h("div", "tt-slot");
        const name = L(sentence(ctx, s.kind, false), sentence(ctx, s.kind, true));
        box.append(
          h("span", "", `${B(sentence(ctx, s.kind, false), sentence(ctx, s.kind, true))}`),
        );
        box.append(h("span", "put", placed ? `${placed.x} : ${placed.y}` : "—"));
        if (!ro) {
          box.append(
            btn(
              B("Put card here", "Poner la tarjeta aquí"),
              () => pick && place(s.id, pick),
              "",
              L(`Put the picked card on: ${name}`, `Poner la tarjeta elegida en: ${name}`),
              !pick,
            ),
          );
          if (placed)
            box.append(
              btn(
                B("Take back", "Quitar"),
                () => (delete st.place[s.id], save()),
                "",
                L(`Take back the card from: ${name}`, `Quitar la tarjeta de: ${name}`),
              ),
            );
          box.addEventListener(
            "dragover",
            (/** @type {any} */ e) => (e.preventDefault(), box.classList.add("drop")),
          );
          box.addEventListener("dragleave", () => box.classList.remove("drop"));
          box.addEventListener("drop", (/** @type {any} */ e) => {
            e.preventDefault();
            const id = e.dataTransfer?.getData("text/plain");
            if (id && cardOf(id)) place(s.id, id);
          });
        }
        slots.append(box);
      }
      body.append(slots);
      if (focus)
        for (const e of body.querySelectorAll("[aria-label]"))
          if (e.getAttribute("aria-label") === focus)
            return void (/** @type {any} */ (e).focus?.());
    }
    draw();
    if (!ro) {
      const act = h("div", "tt-act");
      act.append(
        btn(B("Check", "Revisar"), () => api.submit?.(JSON.parse(JSON.stringify(st))), "tt-go"),
        btn(B("Hint", "Pista"), () => api.hint?.()),
        btn(
          B("Start over", "Empezar de nuevo"),
          () => (
            (st = { place: {} }),
            (pick = null),
            (shown = null),
            save(L("Started over.", "Empezaste de nuevo."))
          ),
        ),
      );
      root.append(act);
    }
  }
})();
