/**
 * Capstone "Which tool?" (RT.kinds.capstone, window.StudioCapstone). Contract: docs/audits/studio-v4/brief-x-pedagogy.md, item 10.
 *
 * A unit's closing sort: 4-8 problem stems, each drawn from a different skill the unit taught, matched to the name of the skill that
 * solves it. Nothing is computed. The stems are fresh generated problems (typed-answer, no figure), so the item never repeats one
 * the student has already seen, and the skill names are the generators' own titles. It reuses the match kind's rules: the first miss
 * only counts, later misses lock the good pairs and send the wrong ones back, and no miss prints the answer.
 *
 * Spec: { k: "capstone", id, unit, skills: ["<generator id>", ...] }. Offered at the end of each unit's last Challenge and from
 * the Daily Boost page (initBoost), which picks one skill per lesson from the Boost catalog.
 */
(() => {
  const W = /** @type {any} */ (window);
  const RT = (W.StudioRT = W.StudioRT || {});
  const K = (RT.kinds = RT.kinds || {});
  const G = () => W.StudioGen;
  const MAX = 8;
  const MIN = 4;
  const hash = (/** @type {string} */ s) => {
    let h = 7;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
    return h;
  };

  /** One skill per lesson (the lesson's first), lesson order, then the rest, up to n. catalog = [{ g, lesson, unit }] */
  function pickSkills(/** @type {any[]} */ catalog, /** @type {number} */ unit, n = MAX) {
    const mine = catalog.filter((c) => Number(c.unit) === unit && G().registry[c.g]);
    const byLesson = new Map();
    for (const c of mine.sort(
      (a, b) => a.lesson.localeCompare(b.lesson, "en", { numeric: true }) || a.g.localeCompare(b.g),
    ))
      if (!byLesson.has(c.lesson)) byLesson.set(c.lesson, c.g);
    const out = [...byLesson.values()];
    for (const c of mine) if (out.length < n && !out.includes(c.g)) out.push(c.g);
    return [...new Set(out)].slice(0, n);
  }

  /**
   * The match item for a capstone spec, or null when fewer than MIN skills yield a stand-alone stem.
   * @param {{id: string, unit?: number, skills: string[]}} spec
   */
  function build(spec) {
    const P = W.StudioPedagogy;
    const pairs = [];
    const titles = new Set();
    for (const g of spec.skills) {
      const def = G().registry[g];
      if (!def || titles.has(def.title.toLowerCase())) continue;
      let s = null;
      for (const lv of [2, 3, 1, 4]) {
        s = P.stemFor(g, lv, 9000 + (hash(`${spec.id}|${g}`) % 4000));
        if (s) break;
      }
      if (!s) continue;
      titles.add(def.title.toLowerCase());
      pairs.push({ l: s.q, lEs: s.qEs, r: def.title, rEs: def.titleEs || "" });
    }
    if (pairs.length < MIN) return null;
    return {
      k: "match",
      id: spec.id,
      q: "Which tool solves each problem? You do not need to solve them. Match each problem to the skill that fits.",
      qEs: "¿Qué herramienta resuelve cada problema? No tienes que resolverlos. Une cada problema con la habilidad que le corresponde.",
      pairs,
      h: [
        "Do not solve them. Ask: what is each problem asking me to find?",
        "Match the problems you are sure about first. Then the rest are easier to see.",
      ],
      hEs: [
        "No los resuelvas. Pregunta: ¿qué me pide encontrar cada problema?",
        "Une primero los que sabes con seguridad. Los demás se ven más fácil.",
      ],
      x: "Choosing the right tool before you calculate is a big part of solving a problem.",
      xEs: "Elegir la herramienta correcta antes de calcular es una parte importante de resolver un problema.",
    };
  }

  K.capstone = {
    mount(/** @type {any} */ ctx) {
      const item = build(ctx.it);
      if (!item) return RT.kinds.broken.mount(ctx);
      // the hint ladder reads ctx.it: a capstone without authored hints gets the match item's own
      if (!(ctx.it.h || []).length) {
        ctx.it.h = item.h;
        ctx.it.hEs = item.hEs;
      }
      K.match.mount({ ...ctx, it: item });
    },
  };

  /** The Daily Boost page: a card to pick a unit and sort its skills. */
  function initBoost(/** @type {any} */ rt) {
    const catNode = document.getElementById("boost-catalog");
    const banner = document.getElementById("complete-banner");
    if (!catNode || !banner || document.getElementById("capstone-card")) return;
    /** @type {any[]} */
    let catalog = [];
    try {
      catalog = JSON.parse(catNode.textContent || "[]");
    } catch (_e) {
      return;
    }
    const units = [...new Set(catalog.map((c) => Number(c.unit)))]
      .filter((u) => pickSkills(catalog, u).length >= MIN)
      .sort((a, b) => a - b);
    if (!units.length) return;
    const { es } = RT.util;
    const card = document.createElement("section");
    card.id = "capstone-card";
    card.className = "ped-card stage-card";
    card.setAttribute("aria-label", "Which tool?");
    card.innerHTML = `<h3>Which tool? <span class="conf-opt">(optional)</span>${es("¿Qué herramienta? (opcional)")}</h3><p class="ped-note">Pick a unit. Match its problems to the skills that solve them. Nothing to calculate.${es("Elige una unidad. Une sus problemas con las habilidades que los resuelven. No hay que calcular.")}</p><div class="ped-row" role="group" aria-label="Unit">${units
      .map(
        (u) =>
          `<button type="button" class="btn btn-sm" data-cap-unit="${u}">Unit ${u}${es(`Unidad ${u}`)}</button>`,
      )
      .join("")}</div><div class="capstone-body"></div>`;
    banner.after(card);
    card.addEventListener("click", (e) => {
      const b = /** @type {HTMLElement|null} */ (
        /** @type {HTMLElement} */ (e.target).closest("[data-cap-unit]")
      );
      if (!b) return;
      const unit = Number(b.dataset.capUnit);
      const body = /** @type {HTMLElement} */ (card.querySelector(".capstone-body"));
      body.innerHTML = "";
      rt.api.mountItem({
        tab: 1,
        it: {
          k: "capstone",
          id: `cap-u${unit}`,
          unit,
          skills: pickSkills(catalog, unit),
          h: [],
          reroll: false,
        },
        host: body,
        redeem: true,
      });
    });
  }

  W.StudioCapstone = { pickSkills, build, initBoost, MIN, MAX };
})();
