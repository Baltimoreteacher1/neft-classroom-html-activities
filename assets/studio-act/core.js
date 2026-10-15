/**
 * Practice Studio activity core (window.StudioAct).
 *
 * An activity is a pure model (make / solution / wrong / grade) plus a DOM widget (mount). The pure half is what
 * tools/studio-act.test.mjs exercises for hundreds of seeds; the widget is exercised in a real browser.
 * Contract: docs/specs/practice-studio-v2.md section 5. Needs assets/studio-gen/core.js loaded first (shared rng).
 */
(() => {
  const W = /** @type {any} */ (window);
  const A = (W.StudioAct = W.StudioAct || {});
  A.registry = A.registry || {};

  A.register = (/** @type {string} */ kind, /** @type {any} */ def) => {
    if (A.registry[kind]) throw new Error(`StudioAct: duplicate activity ${kind}`);
    for (const fn of ["make", "solution", "wrong", "grade", "mount"])
      if (typeof def[fn] !== "function") throw new Error(`StudioAct: ${kind} needs ${fn}()`);
    A.registry[kind] = { levels: 4, ...def, kind };
  };
  A.has = (/** @type {string} */ kind) => !!A.registry[kind];
  A.kinds = () => Object.keys(A.registry).sort();

  /** Same (kind, level, seed, params) -> same activity. */
  A.make = (
    /** @type {string} */ kind,
    /** @type {number} */ level,
    /** @type {number|string} */ seed,
    /** @type {any} */ params,
  ) => {
    const def = A.registry[kind];
    if (!def) throw new Error(`StudioAct: unknown activity "${kind}"`);
    const lv = Math.max(1, Math.min(def.levels, Number(level) || 1));
    const rng = W.StudioGen.rng(`${kind}|${lv}|${seed}|${JSON.stringify(params || {})}`);
    const spec = def.make(rng, lv, params || {});
    spec.kind = kind;
    spec.level = lv;
    spec.seed = seed;
    return spec;
  };
  A.grade = (/** @type {any} */ spec, /** @type {any} */ state) =>
    A.registry[spec.kind].grade(spec, state);

  /** Inject a widget's stylesheet once. Use studio tokens (var(--brand) etc.) so every world recolours it. */
  A.css = (/** @type {string} */ kind, /** @type {string} */ text) => {
    if (
      typeof document === "undefined" ||
      document.querySelector(`style[data-studio-act="${kind}"]`)
    )
      return;
    const s = document.createElement("style");
    s.setAttribute("data-studio-act", kind);
    s.textContent = text;
    document.head.append(s);
  };
  /** Tiny DOM helper for widgets: el("button", "sa-btn", "Check", {type:"button"}). */
  A.el = (
    /** @type {string} */ tag,
    /** @type {string} */ cls = "",
    /** @type {string} */ html = "",
    /** @type {Record<string,string>} */ attrs = {},
  ) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html) n.innerHTML = html;
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  /** Bilingual text: English plus a lang="es" span the page shows only in Spanish mode. */
  A.t = (/** @type {string} */ en, /** @type {string} */ es) =>
    es ? `${en}<span class="es-text" lang="es">${es}</span>` : en;
})();
