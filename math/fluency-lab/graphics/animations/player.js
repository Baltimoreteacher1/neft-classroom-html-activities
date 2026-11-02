// Player shell shared by every animation: stage, aria-live caption, Play/Pause, Back/Next, Restart, step counter,
// scrubber and keyboard shortcuts. Reduced motion never autoplays, shows the finished frame and snaps between steps.
import { getLang, t } from "../../i18n.js";
import { ES_LAB4_ANIMATIONS } from "../../i18n-es-lab4-animations.js";
import { fill } from "./anim-kit.js";
import { createScene } from "./scene.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const TWEEN_MS = 650;
export const PLAYER_KEYS = [
  "Restart",
  "Previous step",
  "Play",
  "Pause",
  "Next step",
  "Step",
  "Step {n} of {m}",
  "Space plays or pauses. Left and right arrow keys change the step.",
];
let players = 0;

// Load animations.css once per page, so a screen that mounts an animation needs no extra <link>.
function ensureStyles() {
  if (document.head.querySelector("link[data-animations-css]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = new URL("./animations.css", import.meta.url).href;
  link.dataset.animationsCss = "";
  document.head.append(link);
}

// Shared fills for place-value blocks, defined per player so ids stay unique on a page.
function definitions(uid) {
  const defs = document.createElementNS(SVG_NS, "defs");
  defs.innerHTML =
    `<pattern id="${uid}-rod" patternContentUnits="objectBoundingBox" width="0.1" height="1">` +
    `<rect x="0.088" y="0" width="0.012" height="1" fill="#fff" fill-opacity="0.85"/></pattern>` +
    `<pattern id="${uid}-flat" patternContentUnits="objectBoundingBox" width="0.1" height="0.1">` +
    `<rect x="0.082" y="0" width="0.018" height="0.1" fill="#fff" fill-opacity="0.85"/>` +
    `<rect x="0" y="0.082" width="0.1" height="0.018" fill="#fff" fill-opacity="0.85"/></pattern>`;
  return defs;
}
const words = (text) => text.split(/\s+/).filter(Boolean).length;

// Translate through t() (the page language) or, when the config asks for the other language, the table directly.
function translator(lang) {
  return (key, vars) => {
    if (!lang || lang === getLang()) return t(key, vars);
    return fill(lang === "es" ? (ES_LAB4_ANIMATIONS[key] ?? key) : key, vars);
  };
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  return node;
}

export function createPlayer(container, model, config = {}) {
  const lang = config.lang === "es" || config.lang === "en" ? config.lang : undefined;
  const tr = translator(lang);
  const query = typeof matchMedia === "function" ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  let reduced = typeof config.reducedMotion === "boolean" ? config.reducedMotion : Boolean(query?.matches);
  const last = model.steps.length - 1;
  let index = reduced ? last : 0;
  let playing = false;
  let timer = 0;
  let destroyed = false;
  let observer = null;

  ensureStyles();
  const root = el("section", "an", {
    "data-kind": model.kind,
    role: "group",
    tabindex: "0",
    "aria-keyshortcuts": "Space ArrowLeft ArrowRight",
  });
  const title = tr(model.title.key, model.title.vars);
  root.setAttribute("aria-label", title);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "an-stage");
  svg.setAttribute("viewBox", `0 0 ${model.view[0]} ${model.view[1]}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", title);
  const uid = `an${(players += 1)}`;
  svg.append(definitions(uid));
  const caption = el("p", "an-caption", { "aria-live": "polite", "aria-atomic": "true" });
  const controls = el("div", "an-controls");
  const button = (name, label) => {
    const b = el("button", `an-btn an-${name}`, { type: "button" });
    b.textContent = label;
    return b;
  };
  const restartBtn = button("restart", tr("Restart"));
  const backBtn = button("back", tr("Previous step"));
  const playBtn = button("play", tr("Play"));
  const nextBtn = button("next", tr("Next step"));
  const count = el("span", "an-count");
  controls.append(restartBtn, backBtn, playBtn, nextBtn, count);
  const scrubWrap = el("label", "an-scrub");
  const scrubName = el("span", "an-sr");
  scrubName.textContent = tr("Step");
  const scrub = el("input", "an-range", { type: "range", min: "0", max: String(last), step: "1" });
  scrubWrap.append(scrubName, scrub);
  const hint = el("p", "an-hint");
  hint.textContent = tr("Space plays or pauses. Left and right arrow keys change the step.");
  root.append(svg, caption, controls, scrubWrap, hint);
  container.replaceChildren(root);

  const scene = createScene(svg, tr, uid);

  function paint(animate) {
    const step = model.steps[index];
    scene.set(step.scene, { animate: animate && !reduced, duration: TWEEN_MS });
    caption.textContent = tr(step.caption.key, step.caption.vars);
    count.textContent = tr("Step {n} of {m}", { n: index + 1, m: last + 1 });
    scrub.value = String(index);
    scrub.setAttribute("aria-valuetext", count.textContent);
    backBtn.disabled = index === 0;
    nextBtn.disabled = index === last;
    root.dataset.step = String(index);
  }
  function syncMode() {
    root.dataset.reduced = String(reduced);
    root.dataset.state = playing ? "playing" : "paused";
    playBtn.hidden = reduced;
    playBtn.textContent = playing ? tr("Pause") : tr("Play");
  }
  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = 0;
  }
  function schedule() {
    clearTimer();
    if (!playing) return;
    const hold = Math.min(7000, 1500 + words(caption.textContent) * 240) + TWEEN_MS;
    timer = setTimeout(() => {
      if (index >= last) pause();
      else {
        index += 1;
        paint(true);
        if (index >= last) pause();
        else schedule();
      }
    }, config.stepMs ?? hold);
  }
  function play() {
    if (destroyed || reduced) return;
    if (index >= last) {
      index = 0;
      paint(false);
    }
    playing = true;
    syncMode();
    schedule();
  }
  function pause() {
    playing = false;
    clearTimer();
    syncMode();
  }
  function step(delta) {
    if (destroyed) return;
    pause();
    index = Math.max(0, Math.min(last, index + delta));
    paint(true);
  }
  function restart() {
    if (destroyed) return;
    pause();
    index = 0;
    paint(false);
    play();
  }
  function toggle() {
    if (reduced) step(index >= last ? -last : 1);
    else if (playing) pause();
    else play();
  }

  restartBtn.addEventListener("click", restart);
  backBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  playBtn.addEventListener("click", toggle);
  scrub.addEventListener("input", () => {
    pause();
    scene.flush();
    index = Number(scrub.value);
    paint(true);
  });
  root.addEventListener("keydown", (event) => {
    if (event.target !== root || event.altKey || event.ctrlKey || event.metaKey) return;
    const keys = {
      " ": toggle,
      ArrowRight: () => step(1),
      ArrowLeft: () => step(-1),
      Home: () => step(-last),
      End: () => step(last),
    };
    if (!keys[event.key]) return;
    event.preventDefault();
    keys[event.key]();
  });
  const onMotion = () => {
    reduced = Boolean(query?.matches);
    if (reduced) {
      pause();
      index = last;
      paint(false);
    }
    syncMode();
  };
  query?.addEventListener?.("change", onMotion);

  paint(false);
  syncMode();
  if (!reduced && config.autoplay !== false) {
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        observer = null;
        play();
      }, { threshold: 0.4 });
      observer.observe(root);
    } else play();
  }

  return {
    kind: model.kind,
    model,
    get index() {
      return index;
    },
    get steps() {
      return model.steps.length;
    },
    play,
    pause,
    step,
    restart,
    goTo(i) {
      step(Number(i) - index);
    },
    destroy() {
      destroyed = true;
      clearTimer();
      observer?.disconnect();
      query?.removeEventListener?.("change", onMotion);
      scene.destroy();
      root.remove();
    },
  };
}
