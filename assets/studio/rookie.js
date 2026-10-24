/**
 * Teach the Rookie (RT.kinds.rookie, window.StudioRookie). Contract: docs/audits/studio-v4/brief-x-pedagogy.md, item 8.
 *
 * A simulated classmate, Rookie, gets a fresh problem wrong in a NAMED way: the wrong answer is one of the generator's own
 * trap-tagged distractors (assets/studio-gen/traps.js, data/practice-studio/generator-traps.json), never an invented number.
 * The student works in three short stages and types nothing:
 *   1. taps the first step of Rookie's work that went wrong,
 *   2. names the trap Rookie fell into (3 choices: the real one and two others),
 *   3. picks a tip that coaches Rookie without giving the answer (the trap's own quick fix, another trap's fix, or "tell Rookie the answer").
 * A wrong pick says what to look at again and never prints the right answer. Only the finished item shows the explanation.
 *
 * Spec (authored per lesson in pedagogy-layer.json): { k: "rookie", id, g: "<generator id>", level: 2 }.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const K = (RT.kinds = RT.kinds || {});
  const G = () => W.StudioGen;
  const hash = (/** @type {string} */ s) => {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const SAMPLE = 120;

  /** Every named trap a generator's wrong answers can show, from a sample of seeds: { traps: Set<id> } */
  function trapsOf(
    /** @type {string} */ g,
    /** @type {number} */ level,
    /** @type {Record<string, any>} */ names,
  ) {
    const found = new Set();
    for (let s = 1; s <= SAMPLE; s++) {
      const it = G().make(g, level, s);
      for (const t of Array.isArray(it.tag) ? it.tag : []) if (t && names[t]) found.add(t);
      for (const w of it.fw || []) if (w.tag && names[w.tag]) found.add(w.tag);
    }
    return [...found].sort();
  }

  /** The wrong answers of one generated item that carry a named trap: [{ tag, v (display text) }] */
  function wrongOf(/** @type {any} */ it, /** @type {Record<string, any>} */ names) {
    const out = [];
    if (it.k === "mc")
      it.c.forEach((/** @type {string} */ c, /** @type {number} */ i) => {
        const t = (it.tag || [])[i];
        if (i !== it.a && t && names[t]) out.push({ tag: t, v: c });
      });
    else if (it.k === "num")
      for (const w of it.fw || [])
        if (w.tag && names[w.tag] && String(w.v) !== String(it.a))
          out.push({ tag: w.tag, v: String(w.v) });
    return out;
  }

  /**
   * @param {string} g generator id  @param {number} level  @param {number} base first seed to try  @param {Record<string, any>} names trap id -> { n, nEs, fix, fixEs }
   * @param {string} key a stable string that picks among the item's traps
   * @returns {{ item: any, trap: string, v: string, traps: any[], tips: any[] } | null}
   */
  function scenario(g, level, base, names, key = g) {
    const all = trapsOf(g, level, names);
    if (all.length < 2) return null;
    for (let s = base; s < base + 400; s++) {
      const item = G().make(g, level, s);
      if (item.viz || (item.k !== "mc" && item.k !== "num")) continue;
      const wrong = wrongOf(item, names);
      if (!wrong.length) continue;
      const pick = wrong.sort((a, b) => hash(key + a.tag) - hash(key + b.tag))[0];
      const decoys = all
        .filter((t) => t !== pick.tag)
        .sort((a, b) => hash(key + a) - hash(key + b));
      const traps = [pick.tag, ...decoys.slice(0, 2)].sort(
        (a, b) => hash(`${key}|o|${a}`) - hash(`${key}|o|${b}`),
      );
      const other = decoys[0];
      const tips = [
        { id: "fix", en: names[pick.tag].fix, es: names[pick.tag].fixEs || "", ok: true },
        {
          id: "other",
          en: names[other].fix,
          es: names[other].fixEs || "",
          ok: false,
          why: "other",
        },
        {
          id: "tell",
          en: "Tell Rookie the right answer so Rookie can copy it.",
          es: "Dile a Rookie la respuesta correcta para que la copie.",
          ok: false,
          why: "tell",
        },
      ].sort((a, b) => hash(`${key}|t|${a.id}`) - hash(`${key}|t|${b.id}`));
      return {
        item,
        trap: pick.tag,
        v: pick.v,
        traps: traps.map((t) => ({ id: t, ...names[t] })),
        tips,
      };
    }
    return null;
  }

  const STEPS = [
    {
      en: "Rookie reads the problem and picks out the numbers.",
      es: "Rookie lee el problema y saca los números.",
    },
    {
      en: "Rookie works it out and writes an answer.",
      es: "Rookie lo resuelve y escribe una respuesta.",
    },
    {
      en: "Rookie checks the answer and says, “Looks right!”",
      es: "Rookie revisa la respuesta y dice: “¡Se ve bien!”",
    },
  ];
  /** The step where the answer is made: the first step that went wrong. */
  const WRONG_STEP = 1;

  K.rookie = {
    mount(/** @type {any} */ ctx) {
      const it = ctx.it;
      const { esc, es, tx, txEs, stem, viz } = RT.util;
      const names = { ...(G().traps?.names || {}), ...(RT.api?.data?.traps || {}) };
      const sc = scenario(
        it.g,
        it.level || 2,
        4000 + (hash(`${RT.api?.data?.lesson}|${it.id}`) % 5000),
        names,
        `${it.id}|${it.g}`,
      );
      if (!sc) {
        ctx.host.innerHTML = `<p class="item-q">This activity could not load.</p><div class="item-fb feedback-box" role="status"></div>`;
        return;
      }
      const rec = (ctx.state.picks[it.id] = ctx.solved
        ? { stage: 4 }
        : ctx.state.picks[it.id] || { stage: 1 });
      const q = sc.item;
      const name = (/** @type {any} */ t) => `<strong>${esc(t.n)}</strong>${es(t.nEs)}`;
      const done = () =>
        `<strong>You taught the Rookie.${es("Le enseñaste al Rookie.")}</strong> ${tx(q.x)}${txEs(q.xEs)}`;
      const draw = () => {
        const steps = STEPS.map(
          (s, i) =>
            `<li><button type="button" class="choice-btn err-step${rec.stage > 1 && i === WRONG_STEP ? " correct" : ""}" data-rk-step="${i}"${rec.stage > 1 ? " disabled" : ""}><span class="choice-letter" aria-hidden="true">${i + 1}</span><span>${esc(s.en)}${es(s.es)}</span></button></li>`,
        ).join("");
        const traps =
          rec.stage === 2
            ? `<div class="ped-row" role="group" aria-label="Which trap did Rookie fall into?"><span class="ped-q">Which trap did Rookie fall into?${es("¿En qué trampa cayó Rookie?")}</span>${sc.traps
                .map(
                  (/** @type {any} */ t) =>
                    `<button type="button" class="btn btn-sm" data-rk-trap="${esc(t.id)}">${esc(t.n)}${es(t.nEs)}</button>`,
                )
                .join("")}</div>`
            : rec.stage > 2
              ? `<p class="item-sub">Rookie's trap: ${name(names[sc.trap])}</p>`
              : "";
        const tips =
          rec.stage === 3
            ? `<div class="ped-row" role="group" aria-label="Pick a tip for Rookie"><span class="ped-q">Pick a tip that helps Rookie fix it without being given the answer.${es("Elige un consejo que ayude a Rookie a corregirlo sin darle la respuesta.")}</span>${sc.tips
                .map(
                  (/** @type {any} */ t) =>
                    `<button type="button" class="btn btn-sm" data-rk-tip="${t.id}" style="text-align:left;white-space:normal;height:auto;min-height:44px">${esc(t.en)}${es(t.es)}</button>`,
                )
                .join("")}</div>`
            : "";
        ctx.host.innerHTML = `${viz(q)}<p class="item-q">${stem(q.q, q.qEs)}</p>
          <p class="item-sub"><strong>Teach the Rookie.${es("Enseña al Rookie.")}</strong> Rookie is a new classmate. Rookie answered <strong>${tx(String(sc.v))}</strong>, and that is not right. Help Rookie find the mistake.${es(`Rookie es un compañero nuevo. Rookie respondió ${sc.v}, y no es correcto. Ayuda a Rookie a encontrar el error.`)}</p>
          <div class="answer-zone"><p class="item-sub">${rec.stage === 1 ? "Tap the first step that went wrong." : "The first step that went wrong:"}${es(rec.stage === 1 ? "Toca el primer paso que salió mal." : "El primer paso que salió mal:")}</p><ol class="err-steps">${steps}</ol>${traps}${tips}</div>
          ${ctx.hintBlock()}<div class="item-fb feedback-box" role="status"></div>`;
        if (ctx.solved) return ctx.showSolved(done());
        if (rec.stage > 3) return;
        wire();
      };
      const miss = (
        /** @type {string} */ say,
        /** @type {string} */ sayEs,
        /** @type {string} */ tag,
      ) => {
        ctx.miss({ tag, say, sayEs, kind: "warn", noLead: true });
      };
      const wire = () => {
        for (const b of /** @type {HTMLElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-rk-step]"),
        ]))
          b.addEventListener("click", () => {
            const i = Number(b.dataset.rkStep);
            if (i === WRONG_STEP) {
              rec.stage = 2;
              ctx.save();
              draw();
              ctx.fb(
                "ok",
                `<strong>Yes, that is where the answer was made.</strong> Now find out which trap Rookie fell into.${es("Sí, ahí se hizo la respuesta. Ahora descubre en qué trampa cayó Rookie.")}`,
              );
              return;
            }
            b.classList.add("wrong");
            miss(
              i < WRONG_STEP
                ? "Reading the problem is not where the mistake is. Look at where Rookie's number came from."
                : "Rookie checked badly, but that comes after the mistake. Find the first step that went wrong.",
              i < WRONG_STEP
                ? "Leer el problema no es donde está el error. Mira de dónde salió el número de Rookie."
                : "Rookie revisó mal, pero eso viene después del error. Busca el primer paso que salió mal.",
              undefined,
            );
          });
        for (const b of /** @type {HTMLElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-rk-trap]"),
        ]))
          b.addEventListener("click", () => {
            if (b.dataset.rkTrap === sc.trap) {
              rec.stage = 3;
              ctx.save();
              draw();
              ctx.fb(
                "ok",
                `<strong>That is the trap.</strong> Now help Rookie.${es("Esa es la trampa. Ahora ayuda a Rookie.")}`,
              );
              return;
            }
            b.classList.add("wrong");
            miss(
              "That trap does not fit. Compare Rookie's answer with the problem: what did Rookie do to the numbers?",
              "Esa trampa no encaja. Compara la respuesta de Rookie con el problema: ¿qué le hizo Rookie a los números?",
              b.dataset.rkTrap,
            );
          });
        for (const b of /** @type {HTMLElement[]} */ ([
          ...ctx.host.querySelectorAll("[data-rk-tip]"),
        ]))
          b.addEventListener("click", () => {
            const t = sc.tips.find((/** @type {any} */ x) => x.id === b.dataset.rkTip);
            if (t?.ok) {
              rec.stage = 4;
              ctx.save();
              draw();
              ctx.solve(done());
              return;
            }
            b.classList.add("wrong");
            miss(
              t?.why === "tell"
                ? "Giving the answer teaches Rookie nothing. Pick a tip that points at the mistake."
                : "That tip is about a different mistake. Pick the tip that fits what Rookie did.",
              t?.why === "tell"
                ? "Dar la respuesta no le enseña nada a Rookie. Elige un consejo que señale el error."
                : "Ese consejo es sobre otro error. Elige el que encaja con lo que hizo Rookie.",
              undefined,
            );
          });
      };
      draw();
    },
  };

  W.StudioRookie = { scenario, trapsOf, wrongOf };
})();
