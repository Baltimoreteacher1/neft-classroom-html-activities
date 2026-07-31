// Hand-drawn "chalk" annotations — rough SVG circles / underlines / arrows that
// sketch themselves in around key answers, echoing the self-writing feel of the
// step-solver typewriter.
//
// SAFETY CONTRACT: every mark is an absolutely-positioned SVG with
// pointer-events:none and aria-hidden="true". It never mutates the target's own
// content, never sits in the tab/focus order, and cannot shift layout, block a
// click, change grading, or touch save/resume. Under prefers-reduced-motion the
// final mark is shown with no draw animation. Activation is gated to the
// warm-deck skin, so the small-group storyboard skin is untouched.
//
// Public API (window.NTChalk): circle(el) / underline(el) / arrow(el) decorate a
// specific element on demand — used by components (e.g. step-solver on a win) to
// mark an element they own at exactly the right moment.

const SVG_NS = "http://www.w3.org/2000/svg";
const STYLE_ID = "chalk-annotate-styles";
const DRAWN_FLAG = "chalkDrawn"; // dataset guard: decorate each element once

// Warm chalk-pen palette (reads on the warm-deck cream canvas).
const INK_CIRCLE = "#d9795d";
const INK_UNDERLINE = "#1f8a84";
const INK_ARROW = "#d9795d";

function reducedMotion() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function isWarmDeck() {
  return document.body.classList.contains("skin-warm-deck");
}

function jitter(amp) {
  return (Math.random() - 0.5) * amp;
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
  .chalk-mark{position:absolute;overflow:visible;pointer-events:none;z-index:2;}
  .chalk-mark path{
    fill:none;stroke-linecap:round;stroke-linejoin:round;
    filter:drop-shadow(0 1px 0 rgba(255,255,255,.35));
  }
  .chalk-mark.chalk-anim path{
    stroke-dasharray:var(--len);stroke-dashoffset:var(--len);
    animation:chalkDraw .72s cubic-bezier(.6,.05,.3,1) forwards;
  }
  @keyframes chalkDraw{to{stroke-dashoffset:0;}}
  @media (prefers-reduced-motion: reduce){
    .chalk-mark.chalk-anim path{animation:none;stroke-dashoffset:0;}
  }`;
  document.head.appendChild(style);
}

// A rough, slightly-overshooting closed loop around a w×h box — the classic
// hand-circled answer that doesn't quite close.
function circlePath(w, h) {
  const pad = Math.max(8, Math.min(w, h) * 0.16);
  const cx = w / 2 + pad;
  const cy = h / 2 + pad;
  const rx = w / 2 + pad * 0.7;
  const ry = h / 2 + pad * 0.7;
  const steps = 32;
  const turns = 1.08; // overshoot past the start point
  const start = -Math.PI * 0.32;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const t = start + Math.PI * 2 * turns * (i / steps);
    const x = cx + Math.cos(t) * (rx + jitter(rx * 0.05));
    const y = cy + Math.sin(t) * (ry + jitter(ry * 0.05));
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
  }
  return { d, w: w + pad * 2, h: h + pad * 2, offX: -pad, offY: -pad, sw: 3 };
}

// A wobbly left-to-right underline sitting just under the box.
function underlinePath(w, h) {
  const pad = 6;
  const y = h + pad;
  const steps = 16;
  let d = "M0 " + y.toFixed(1);
  for (let i = 1; i <= steps; i++) {
    const x = (w * i) / steps;
    d += "L" + x.toFixed(1) + " " + (y + jitter(3)).toFixed(1);
  }
  return { d, w, h: h + pad * 2, offX: 0, offY: 0, sw: 3 };
}

// A short hand-drawn arrow in the left margin pointing at the box.
function arrowPath(_w, h) {
  const len = 34;
  const y = h / 2;
  const tipX = -6;
  const tailX = -6 - len;
  const shaft = `M${tailX} ${(y + jitter(2)).toFixed(1)}Q${(tailX + len / 2).toFixed(1)} ${(y - 6).toFixed(1)} ${tipX} ${y.toFixed(1)}`;
  const head = `M${tipX} ${y.toFixed(1)}L${(tipX - 9).toFixed(1)} ${(y - 6).toFixed(1)}M${tipX} ${y.toFixed(1)}L${(tipX - 9).toFixed(1)} ${(y + 6).toFixed(1)}`;
  return { d: shaft + head, w: len + 20, h, offX: tailX - 4, offY: 0, sw: 3, extra: true };
}

const BUILDERS = { circle: circlePath, underline: underlinePath, arrow: arrowPath };
const INKS = { circle: INK_CIRCLE, underline: INK_UNDERLINE, arrow: INK_ARROW };

// Give the target a positioning context without shifting it: position:relative
// on a static element does not move it. Inline targets get inline-block so the
// overlay can size to them.
function prepareHost(el) {
  const cs = getComputedStyle(el);
  if (cs.position === "static") el.style.position = "relative";
  if (cs.display === "inline") el.style.display = "inline-block";
}

function buildMark(el, kind) {
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  if (!w || !h) return null;
  const spec = (BUILDERS[kind] || circlePath)(w, h);
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "chalk-mark chalk-mark--" + kind);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", spec.w);
  svg.setAttribute("height", spec.h);
  svg.setAttribute("viewBox", `${spec.offX} ${spec.offY} ${spec.w} ${spec.h}`);
  svg.style.left = spec.offX + "px";
  svg.style.top = spec.offY + "px";
  const path = document.createElementNS(SVG_NS, "path");
  path.setAttribute("d", spec.d);
  path.setAttribute("stroke", INKS[kind] || INK_CIRCLE);
  path.setAttribute("stroke-width", spec.sw);
  svg.appendChild(path);
  return { svg, path };
}

// IntersectionObserver: start the draw only when the mark scrolls into view, so
// the sketch reads as "drawn just now" rather than pre-drawn off-screen.
let io = null;
function observer() {
  if (io) return io;
  if (typeof IntersectionObserver !== "function") return null;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("chalk-anim");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.4 },
  );
  return io;
}

function decorate(el, kind) {
  if (!el || el.dataset[DRAWN_FLAG]) return;
  el.dataset[DRAWN_FLAG] = "1";
  ensureStyles();
  prepareHost(el);
  const mark = buildMark(el, kind);
  if (!mark) {
    delete el.dataset[DRAWN_FLAG];
    return;
  }
  el.appendChild(mark.svg);
  // Set the dash length so the stroke draws in from zero.
  const len = Math.ceil(mark.path.getTotalLength());
  mark.svg.style.setProperty("--len", String(len));
  const ob = observer();
  if (ob && !reducedMotion()) ob.observe(mark.svg);
  else mark.svg.classList.add("chalk-anim"); // reduced-motion / no IO: show final
}

// Auto-decorate the one universally-safe target: the worked-example answer box.
function scan(root) {
  root.querySelectorAll(".worked-example-answer").forEach((el) => decorate(el, "circle"));
  root
    .querySelectorAll("[data-chalk]")
    .forEach((el) => decorate(el, el.getAttribute("data-chalk") || "circle"));
}

let mounted = false;
export function mountChalkAnnotations(root = document) {
  if (mounted || !isWarmDeck()) return;
  mounted = true;

  // Public API for components that own their answer DOM (e.g. step-solver).
  window.NTChalk = {
    circle: (el) => isWarmDeck() && decorate(el, "circle"),
    underline: (el) => isWarmDeck() && decorate(el, "underline"),
    arrow: (el) => isWarmDeck() && decorate(el, "arrow"),
  };

  scan(root);

  // New answer boxes appear as phases render — decorate them as they arrive.
  if (typeof MutationObserver === "function") {
    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan(root);
      });
    });
    mo.observe(root.body || root, { childList: true, subtree: true });
  }
}
