// DOM mount for the exponent-copies picture: the SVG, a "watch it build" control, a screen-reader description and a polite
// status line. The model, the notation and the explanation are all redrawn from ONE state ({ base, exponent }) so they cannot
// drift apart. Reloading restores the static final picture; animation state is never saved, so nothing can restore wrongly.
import { describe, exponentModel } from "./exponent-copies.mjs";
import { exponentScene } from "./exponent-copies-motion.mjs";
import { playScene } from "./motion.mjs";
import { renderExponent } from "./exponent-copies-render.mjs";

const STR = {
  watch: { en: "Watch it build", es: "Míralo construirse" },
  stop: { en: "Show all steps", es: "Mostrar todos los pasos" },
  showing: { en: (/** @type {string} */ a) => `Showing ${a}`, es: (/** @type {string} */ a) => `Mostrando ${a}` },
};

let uid = 0;

/** The figure's stylesheet, added once per document; pages that already link it (or whose bundle includes it) are left alone. */
function ensureStyles(/** @type {Document} */ doc) {
  if (doc.getElementById("mc-styles") || doc.querySelector('link[href*="shared/motion/motion.css"]')) return;
  const link = doc.createElement("link");
  link.id = "mc-styles";
  link.rel = "stylesheet";
  link.href = "/shared/motion/motion.css";
  doc.head.append(link);
}

/**
 * @param {HTMLElement} host
 * @param {{ base?: unknown, exponent?: unknown, lang?: "en" | "es", compact?: boolean, controls?: boolean, onNarrow?: () => void }} [opts]
 */
export function mountExponentPicture(host, opts = {}) {
  const doc = host.ownerDocument;
  const id = `mc${++uid}`;
  let lang = opts.lang === "es" ? "es" : "en";
  let model = exponentModel(opts.base, opts.exponent);
  /** @type {ReturnType<typeof playScene> | null} */
  let anim = null;

  ensureStyles(doc);
  host.classList.add("mc-figure");
  host.textContent = "";
  const stage = doc.createElement("div");
  stage.className = "mc-stage";
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
  const showAll = doc.createElement("button");
  showAll.type = "button";
  showAll.className = "mc-btn";
  showAll.setAttribute("data-quiet", "");
  tools.append(play, showAll);
  host.append(stage, sr, status);
  if (opts.controls !== false) host.append(tools);

  const T = (/** @type {"watch" | "stop"} */ k) => STR[k][lang];

  function stop() {
    anim?.cancel();
    anim = null;
  }

  /** Draw at the container's own width (300-600), so one viewBox unit is one pixel and 13px text stays 13px. */
  const drawWidth = () => Math.max(300, Math.min(600, Math.round(host.clientWidth || 600)));
  let drawn = 0;

  function draw() {
    stop();
    const width = drawWidth();
    const r = renderExponent(model, { lang, compact: !!opts.compact, width, tokens: "css" });
    drawn = width;
    stage.innerHTML = r.svg;
    stage.style.setProperty("--mc-min-height", `${Math.round((r.height / r.width) * Math.min(host.clientWidth || width, 640))}px`);
    stage.querySelector("svg")?.setAttribute("aria-describedby", sr.id);
    sr.textContent = describe(model, lang);
    play.textContent = T("watch");
    showAll.textContent = T("stop");
    status.textContent = STR.showing[lang](`${model.notation} = ${model.valueText}`);
  }

  function watch() {
    stop();
    const svg = stage.querySelector("svg");
    if (!svg) return;
    anim = playScene(exponentScene(svg, model.steps.length));
    anim.finished.then(() => {
      anim = null;
    });
  }

  play.addEventListener("click", watch);
  showAll.addEventListener("click", stop);

  /** @type {ResizeObserver | null} */
  let ro = null;
  const measure = () => {
    if (Math.abs(drawWidth() - drawn) > 8) draw();
  };
  if (typeof ResizeObserver === "function") {
    ro = new ResizeObserver(measure);
    ro.observe(host);
  }
  draw();

  return {
    get model() {
      return model;
    },
    /** @param {{ base?: unknown, exponent?: unknown, lang?: "en" | "es" }} next */
    update(next) {
      if (next.lang) lang = next.lang === "es" ? "es" : "en";
      model = exponentModel(next.base ?? model.base, next.exponent ?? model.exponent);
      draw();
      return model;
    },
    watch,
    stop,
    destroy() {
      stop();
      ro?.disconnect();
      play.removeEventListener("click", watch);
      showAll.removeEventListener("click", stop);
      host.textContent = "";
      host.classList.remove("mc-figure");
    },
  };
}
