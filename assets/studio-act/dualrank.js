/**
 * Practice Studio activity: dualrank (window.StudioAct kind "dualrank"), lesson 7-4, "Dual ranking".
 * The student ranks the same balances in two mirrored lanes: who OWES THE MOST first, and who HAS THE MOST MONEY first.
 * The lanes must mirror each other. A pair the two lanes disagree about is flagged with "which is farther right?", the
 * question that separates position on the number line from distance from zero. State: { a: [item, ...], b: [item, ...] }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = W.StudioAct;
  const K = (A.u7 = A.u7 || {});
  const dl = (/** @type {number} */ v) => `${v < 0 ? "−" : ""}$${Math.abs(v)}`;

  function mkDual(/** @type {any} */ rng, /** @type {number} */ lv) {
    const count = lv === 1 ? 4 : lv === 2 ? 4 : 5;
    const lim = [40, 60, 80, 99][lv - 1];
    for (let t = 0; t < 400; t++) {
      /** @type {number[]} */
      const vals = [];
      const negs = rng.int(2, count - 1);
      while (vals.length < count) {
        const v =
          vals.length < negs ? -rng.int(4, lim) : rng.int(lv === 4 ? 0 : 3, Math.floor(lim / 2));
        if (!vals.includes(v)) vals.push(v);
      }
      if (lv >= 3 && !vals.some((v) => v > 0 && vals.includes(-v))) {
        const k = rng.int(5, 30);
        if (!vals.includes(k) && !vals.includes(-k)) {
          vals[vals.length - 1] = k;
          vals[0] = -k;
        }
      }
      const asc = vals.map((_, i) => i).sort((a, b) => vals[a] - vals[b]);
      const byAbs = vals
        .map((_, i) => i)
        .sort((a, b) => Math.abs(vals[b]) - Math.abs(vals[a]) || vals[a] - vals[b]);
      // the order by size must differ from the true order, or the item cannot tell the two ideas apart
      if (asc.join() === byAbs.join() || new Set(vals).size < count) continue;
      const items = vals.map((v) => ({ v, t: dl(v) }));
      const desc = asc.slice().reverse();
      const pack = K.pack({
        q: `These balances belong to ${count} people: ${items.map((i) => i.t).join(", ")}. Lane 1: tap them from the person who owes the most to the person who owes the least or has the most. Lane 2: tap them from the person who has the most money to the person who has the least. ¦ Estos saldos son de ${count} personas: ${items.map((i) => i.t).join(", ")}. Carril 1: tócalos desde quien debe más hasta quien debe menos o tiene más. Carril 2: tócalos desde quien tiene más dinero hasta quien tiene menos.`,
        x: `A balance farther left on the number line is less money, so it is owed more. Lane 1 goes left to right: ${asc.map((i) => items[i].t).join(", ")}. Lane 2 is the same list in the opposite order: ${desc.map((i) => items[i].t).join(", ")}. ¦ Un saldo más a la izquierda en la recta numérica es menos dinero, así que se debe más. El carril 1 va de izquierda a derecha: ${asc.map((i) => items[i].t).join(", ")}. El carril 2 es la misma lista en el orden contrario: ${desc.map((i) => items[i].t).join(", ")}.`,
        h: [
          "Place each balance on a number line. A negative balance means money is owed. ¦ Ubica cada saldo en una recta numérica. Un saldo negativo significa que se debe dinero.",
          "Farther left means less money. Farther right means more money. ¦ Más a la izquierda es menos dinero. Más a la derecha es más dinero.",
          "The two lanes should be mirrors of each other. Check any pair they disagree about. ¦ Los dos carriles deben ser espejo uno del otro. Revisa cualquier par en el que no coincidan.",
        ],
      });
      return { ...pack, items, asc, desc, byAbs, model: { vals } };
    }
    throw new Error("dualrank: no set");
  }

  const pos = (/** @type {number[]} */ lane, /** @type {number} */ i) => lane.indexOf(i);
  function gradeDual(/** @type {any} */ spec, /** @type {any} */ state) {
    const n = spec.items.length;
    const clean = (/** @type {any} */ l) => {
      /** @type {number[]} */
      const out = [];
      for (const i of l || [])
        if (Number.isInteger(i) && i >= 0 && i < n && !out.includes(i)) out.push(i);
      return out;
    };
    const a = clean(state && state.a);
    const b = clean(state && state.b);
    const same = (/** @type {number[]} */ x, /** @type {number[]} */ y) =>
      x.length === y.length && x.every((v, i) => v === y[i]);
    const markA = a.map((v, i) => v === spec.asc[i]);
    const markB = b.map((v, i) => v === spec.desc[i]);
    const marks = [...markA, ...markB];
    const parts = { right: marks.filter(Boolean).length, of: 2 * n, marks };
    if (!a.length && !b.length)
      return K.miss(
        "no-point",
        "Tap the balances to fill lane 1 and lane 2. ¦ Toca los saldos para llenar el carril 1 y el carril 2.",
        parts,
      );
    if (a.length < n || b.length < n)
      return K.miss(
        "too-few",
        `Fill both lanes with all ${n} balances. Lane 1 has ${a.length} and lane 2 has ${b.length}. ¦ Llena los dos carriles con los ${n} saldos. El carril 1 tiene ${a.length} y el carril 2 tiene ${b.length}.`,
        parts,
      );
    if (same(a, spec.asc) && same(b, spec.desc)) return { ok: true, ...parts };
    // mirrored lanes keep every pair in opposite order
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const inA = pos(a, i) < pos(a, j);
        const inB = pos(b, i) < pos(b, j);
        if (inA === inB)
          return K.miss(
            "absolute-value-vs-order",
            `Your two lanes disagree about ${spec.items[i].t} and ${spec.items[j].t}. Which one is farther right on a number line? ¦ Tus dos carriles no coinciden sobre ${spec.items[i].t} y ${spec.items[j].t}. ¿Cuál queda más a la derecha en una recta numérica?`,
            parts,
          );
      }
    if (same(a, spec.byAbs) || same(b, spec.byAbs.slice().reverse()))
      return K.miss(
        "absolute-value-vs-order",
        "It looks like you ranked by the size of the number. Owing more is farther LEFT, so look at the position on the number line, not the size alone. ¦ Parece que ordenaste por el tamaño del número. Deber más queda más a la IZQUIERDA, así que mira la posición en la recta numérica, no solo el tamaño.",
        parts,
      );
    const k = a.findIndex((v, i) => v !== spec.asc[i]);
    const x = a[k >= 0 ? k : 0];
    const y = a[k >= 0 ? Math.min(n - 1, k + 1) : 1];
    return K.miss(
      "compare-direction-reversed",
      `Look at ${spec.items[x].t} and ${spec.items[y].t} in your lanes. Which one is farther right on a number line? ¦ Mira ${spec.items[x].t} y ${spec.items[y].t} en tus carriles. ¿Cuál queda más a la derecha en una recta numérica?`,
      parts,
    );
  }

  function mount(/** @type {any} */ host, /** @type {any} */ spec, /** @type {any} */ api) {
    const c = K.start(host, spec, api, "dualrank");
    const { L, T } = c;
    /** @type {number[][]} */
    let lanes = c.saved ? [(c.saved.a || []).slice(), (c.saved.b || []).slice()] : [[], []];
    if (c.solved) lanes = [spec.asc.slice(), spec.desc.slice()];
    let active = lanes[0].length < spec.items.length ? 0 : 1;
    const names = [
      ["Lane 1: owes the most first", "Carril 1: primero quien debe más"],
      ["Lane 2: has the most money first", "Carril 2: primero quien tiene más dinero"],
    ];
    const sel = A.el("div", "ak-row", "", { role: "group" });
    c.label(sel, "Which lane to fill", "Cuál carril llenar");
    const chips = names.map((nm, i) => {
      const b = A.el("button", "ak-chip", T(nm[0], nm[1]), { type: "button" });
      b.addEventListener("click", () => {
        active = i;
        sync();
      });
      sel.append(b);
      return b;
    });
    const laneEls = names.map((nm) =>
      A.el("div", "ak-card", `<p class="ak-cap">${T(nm[0], nm[1])}</p>`),
    );
    const slots = laneEls.map(() => A.el("div", "ak-row"));
    laneEls.forEach((e, i) => e.append(slots[i]));
    const bank = A.el("div", "ak-row", "", { role: "group" });
    c.label(
      bank,
      "Balances. Tap one to add it to the lane you are filling.",
      "Saldos. Toca uno para agregarlo al carril que estás llenando.",
    );
    function sync() {
      const mk = c.marks();
      chips.forEach((b, i) => b.setAttribute("aria-pressed", String(active === i)));
      slots.forEach((box, li) => {
        box.textContent = "";
        lanes[li].forEach((it, pos) => {
          const b = A.el(
            "button",
            `ak-chip${mk ? (mk[li * spec.items.length + pos] ? " ak-mark-ok" : " ak-mark-bad") : ""}`,
            `<span>${pos + 1}.</span> ${spec.items[it].t}`,
            { type: "button" },
          );
          c.label(
            b,
            `Lane ${li + 1}, place ${pos + 1}: ${spec.items[it].t}. Tap to take it and the later ones off.`,
            `Carril ${li + 1}, lugar ${pos + 1}: ${spec.items[it].t}. Toca para quitarlo a él y a los siguientes.`,
          );
          b.disabled = c.solved;
          b.addEventListener("click", () => {
            lanes[li] = lanes[li].slice(0, pos);
            c.emit({ a: lanes[0], b: lanes[1] });
            sync();
          });
          box.append(b);
        });
        if (!lanes[li].length) box.append(A.el("span", "ak-text", L("Empty", "Vacío")));
      });
      bank.textContent = "";
      spec.items.forEach((/** @type {any} */ it, /** @type {number} */ i) => {
        const used = lanes[active].includes(i);
        const b = A.el("button", "ak-chip", it.t, { type: "button" });
        b.disabled = used || c.solved;
        c.label(
          b,
          `${it.t}. Tap to add it to lane ${active + 1}.`,
          `${it.t}. Toca para agregarlo al carril ${active + 1}.`,
        );
        b.addEventListener("click", () => {
          lanes[active].push(i);
          c.say(`${it.t} added to lane ${active + 1}`, `${it.t} agregado al carril ${active + 1}`);
          c.emit({ a: lanes[0], b: lanes[1] });
          sync();
        });
        bank.append(b);
      });
      c.checkBtn.disabled = !(lanes[0].length || lanes[1].length);
    }
    c.body.append(...(c.solved ? [] : [sel, bank]), ...laneEls);
    c.redraws.push(sync);
    c.wire(
      () => ({ a: lanes[0], b: lanes[1] }),
      () => {
        lanes = [[], []];
        active = 0;
        c.emit({ a: [], b: [] });
      },
    );
    sync();
  }

  A.register("dualrank", {
    title: "Dual ranking",
    titleEs: "Doble clasificación",
    levels: 4,
    make: mkDual,
    solution: (spec) => ({ a: spec.asc.slice(), b: spec.desc.slice() }),
    wrong(spec) {
      return [
        { a: spec.byAbs.slice(), b: spec.byAbs.slice().reverse() },
        { a: spec.asc.slice(), b: spec.asc.slice() },
        { a: spec.desc.slice(), b: spec.asc.slice() },
        { a: spec.asc.slice(0, 2), b: [] },
      ];
    },
    grade: gradeDual,
    mount,
  });
})();
