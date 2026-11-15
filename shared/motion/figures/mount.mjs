// Generic figure plumbing: wraps a figure's SVG body, mounts it with a "Watch it move" control, a screen-reader description
// and (for the family page) labelled number controls. Figures never touch the DOM themselves; this file does.
import { CSS_VARS, FONT } from "../tokens.mjs";
import { playScene } from "../motion.mjs";

/**
 * @typedef {object} Control
 * @property {string} label
 * @property {string} labelEs
 * @property {number} min
 * @property {number} max
 * @property {number} step
 */

/**
 * @typedef {object} Figure
 * @property {string} id family id, e.g. "fraction-partition-count"
 * @property {string[]} keys lab model keys it accompanies, "kind:mode"
 * @property {{ en: string, es: string }} title
 * @property {(key: string) => Control[]} controls same count, order and bounds as the lab's own controls for that key
 * @property {(key: string, values: number[]) => any} build pure, exact, deterministic; throws RangeError for an invalid setting
 * @property {(model: any, o: { lang: "en" | "es", width: number }) => { body: string, width: number, height: number }} render SVG body; hex colours from tokens.mjs
 * @property {(root: ParentNode, model: any) => { durationMs: number, tracks: Array<import("../motion.mjs").Track & { els: Element[] }> }} scene
 * @property {(model: any, lang: "en" | "es") => string} describe full text equivalent
 */

const esc = (/** @type {unknown} */ s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] || c);

/**
 * The complete figure as one SVG string.
 * @param {Figure} fig @param {string} key @param {number[]} values
 * @param {{ lang?: "en" | "es", width?: number, tokens?: "hex" | "css" }} [o]
 */
export function figureSvg(fig, key, values, o = {}) {
  const lang = o.lang === "es" ? "es" : "en";
  const model = fig.build(key, values);
  const r = fig.render(model, { lang, width: o.width || 400 });
  let body = `<g class="mc-root">${r.body}</g>`;
  if (o.tokens === "css") body = body.replace(/#[0-9a-fA-F]{6}\b/g, (h) => /** @type {Record<string, string>} */ (CSS_VARS)[h.toLowerCase()] || h);
  const title = fig.title[lang];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" class="mc-figure-svg" viewBox="0 0 ${r.width} ${r.height}" role="img" aria-label="${esc(title)}" font-family='${FONT}'><title>${esc(title)}</title><desc>${esc(fig.describe(model, lang))}</desc>${body}</svg>`;
  return { svg, model, width: r.width, height: r.height };
}

const STR = {
  watch: { en: "Watch it move", es: "Míralo moverse" },
  stop: { en: "Show the end", es: "Mostrar el final" },
  open: { en: "Show the picture", es: "Mostrar el dibujo" },
  close: { en: "Hide the picture", es: "Ocultar el dibujo" },
  invalid: { en: (/** @type {Control} */ c) => `Use ${c.min} to ${c.max}, in steps of ${c.step}.`, es: (/** @type {Control} */ c) => `Usa de ${c.min} a ${c.max}, de ${c.step} en ${c.step}.` },
};

/** The stylesheet goes where the figure lives: the document head, or the lab's shadow root (document styles do not reach into it). */
function ensureStyles(/** @type {HTMLElement} */ host) {
  const doc = host.ownerDocument;
  const root = host.getRootNode();
  const inShadow = typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot;
  const scope = inShadow ? /** @type {ShadowRoot} */ (root) : doc;
  if (scope.querySelector('link[href*="shared/motion/motion.css"]')) return;
  const link = doc.createElement("link");
  link.id = "mc-styles";
  link.rel = "stylesheet";
  link.href = "/shared/motion/motion.css";
  (inShadow ? /** @type {ShadowRoot} */ (root) : doc.head).append(link);
}

let uid = 0;

/**
 * @param {HTMLElement} host @param {Figure} fig @param {string} key
 * @param {{ values: number[], lang?: "en" | "es", controls?: boolean, onValues?: (v: number[]) => void }} opts
 */
export function mountFigure(host, fig, key, opts) {
  const doc = host.ownerDocument;
  const id = `mf${++uid}`;
  let lang = opts.lang === "es" ? "es" : "en";
  let values = [...opts.values];
  /** @type {ReturnType<typeof playScene> | null} */
  let anim = null;
  let drawn = 0;
  host.classList.add("mc-figure");
  ensureStyles(host);
  host.textContent = "";
  const stage = doc.createElement("div");
  stage.className = "mc-stage";
  stage.id = `${id}-stage`;
  const sr = doc.createElement("p");
  sr.className = "mc-sr";
  sr.id = `${id}-desc`;
  const status = doc.createElement("p");
  status.className = "mc-sr";
  status.setAttribute("role", "status");
  const tools = doc.createElement("div");
  tools.className = "mc-tools";
  const play = doc.createElement("button");
  play.type = "button";
  play.className = "mc-btn";
  const showEnd = doc.createElement("button");
  showEnd.type = "button";
  showEnd.className = "mc-btn";
  showEnd.setAttribute("data-quiet", "");
  /* A tall figure on a phone starts folded behind one button, so the page stays short; the text description stays available. */
  const fold = doc.createElement("button");
  fold.type = "button";
  fold.className = "mc-btn";
  fold.setAttribute("data-quiet", "");
  fold.setAttribute("aria-controls", `${id}-stage`);
  let collapsed = false;
  let userChose = false;
  const setCollapsed = (/** @type {boolean} */ c) => {
    collapsed = c;
    stage.hidden = c;
    fold.setAttribute("aria-expanded", String(!c));
    fold.textContent = STR[c ? "open" : "close"][lang];
  };
  fold.addEventListener("click", () => {
    userChose = true;
    stop();
    setCollapsed(!collapsed);
  });
  tools.append(play, showEnd, fold);

  /** @type {HTMLInputElement[]} */
  const inputs = [];
  const controlsBox = doc.createElement("div");
  controlsBox.className = "mc-controls";
  const msg = doc.createElement("p");
  msg.className = "mc-msg";
  msg.setAttribute("role", "status");
  if (opts.controls) {
    fig.controls(key).forEach((c, i) => {
      const label = doc.createElement("label");
      label.className = "mc-field";
      const text = doc.createElement("span");
      text.dataset.i = String(i);
      const input = doc.createElement("input");
      input.type = "number";
      input.min = String(c.min);
      input.max = String(c.max);
      input.step = String(c.step);
      input.value = String(values[i]);
      input.id = `${id}-c${i}`;
      input.addEventListener("input", () => {
        const n = Number(input.value);
        const ok = input.value.trim() !== "" && Number.isFinite(n) && n >= c.min && n <= c.max && Math.abs((n - c.min) / c.step - Math.round((n - c.min) / c.step)) < 1e-7;
        input.toggleAttribute("aria-invalid", !ok);
        msg.textContent = ok ? "" : STR.invalid[lang](c);
        if (!ok) return;
        values[i] = n;
        opts.onValues?.([...values]);
        draw();
      });
      label.append(text, input);
      controlsBox.append(label);
      inputs.push(input);
    });
  }
  host.append(stage, sr, status);
  if (opts.controls) host.append(controlsBox, msg);
  host.append(tools);

  const stop = () => {
    anim?.cancel();
    anim = null;
  };
  const drawWidth = () => Math.max(300, Math.min(600, Math.round(host.clientWidth || 400)));

  function draw() {
    stop();
    const width = drawWidth();
    drawn = width;
    let r;
    try {
      r = figureSvg(fig, key, values, { lang, width, tokens: "css" });
    } catch (e) {
      if (e instanceof RangeError) return void (msg.textContent = e.message);
      throw e;
    }
    stage.innerHTML = r.svg;
    if (!userChose) setCollapsed(width < 480 && r.height > 600);
    else setCollapsed(collapsed);
    stage.style.setProperty("--mc-min-height", `${Math.round((r.height / r.width) * Math.min(host.clientWidth || width, 640))}px`);
    stage.querySelector("svg")?.setAttribute("aria-describedby", sr.id);
    sr.textContent = fig.describe(r.model, lang);
    play.textContent = STR.watch[lang];
    showEnd.textContent = STR.stop[lang];
    status.textContent = fig.title[lang];
    fig.controls(key).forEach((c, i) => {
      const t = controlsBox.querySelector(`[data-i="${i}"]`);
      if (t) t.textContent = lang === "es" ? c.labelEs : c.label;
      if (inputs[i] && doc.activeElement !== inputs[i]) inputs[i].value = String(values[i]);
    });
  }

  function watch() {
    stop();
    if (collapsed) {
      userChose = true;
      setCollapsed(false);
    }
    const svg = stage.querySelector("svg");
    if (!svg) return;
    let model;
    try {
      model = fig.build(key, values);
    } catch {
      return;
    }
    anim = playScene(fig.scene(svg, model));
    anim.finished.then(() => {
      anim = null;
    });
  }
  play.addEventListener("click", watch);
  showEnd.addEventListener("click", stop);
  /** @type {ResizeObserver | null} */
  let ro = null;
  if (typeof ResizeObserver === "function") {
    ro = new ResizeObserver(() => {
      if (Math.abs(drawWidth() - drawn) > 8) draw();
    });
    ro.observe(host);
  }
  draw();
  return {
    /** @param {{ values?: number[], lang?: "en" | "es" }} next */
    update(next) {
      if (next.lang) lang = next.lang === "es" ? "es" : "en";
      if (next.values) values = [...next.values];
      draw();
    },
    watch,
    stop,
    destroy() {
      stop();
      ro?.disconnect();
      host.textContent = "";
      host.classList.remove("mc-figure");
    },
  };
}
