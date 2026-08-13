// Shared click-to-enlarge lightbox for lesson content images.
//
// Every picture a student can see — Notice & Wonder scenes, Reveal Math slides,
// word-problem art, and (the reason this module exists) VOCABULARY illustrations
// — opens full-screen on click / Enter / Space. This used to live privately
// inside lesson-renderer.js, which meant the vocabulary surfaces that do NOT go
// through that file (the small-group word wall, its <dialog> pop-up, and the
// generated vocab.html page) had no way to reach it. It is a module now so there
// is exactly one implementation of the affordance.
//
// STACKING — the part that has bitten this repo before. The small-group
// vocabulary pop-up is a real `<dialog>` opened with `showModal()`, which the
// browser promotes to the TOP LAYER: it paints above every z-index, so a plain
// `<div style="z-index:10000">` overlay would open *behind* it and look dead.
// The lightbox is therefore itself a `<dialog>` opened with `showModal()`.
// Top-layer elements stack in promotion order, so the lightbox — promoted last —
// always wins. Where `showModal` is unavailable (jsdom, very old engines) it
// falls back to a plain `[open]` overlay at z-index 10000, which still clears the
// z-index 1100 glossary backdrop in the interactive lesson.
//
// The stylesheet is injected once per document rather than living in
// design-system.css, because the small-group and generated static pages do not
// load that stylesheet.

const STYLE_ID = "nt-image-zoom-styles";

const ZOOM_CSS = `
.is-zoomable { cursor: zoom-in; }
.is-zoomable:focus-visible { outline: 3px solid var(--teal, #1c8c8c); outline-offset: 2px; }
.lesson-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 24px;
  border: 0;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.86);
  color: #fff;
  overflow: hidden;
}
.lesson-lightbox[open] { display: flex; align-items: center; justify-content: center; }
.lesson-lightbox:not([open]) { display: none; }
.lesson-lightbox[hidden] { display: none; }
.lesson-lightbox::backdrop { background: rgba(15, 23, 42, 0.86); }
.lesson-lightbox-img {
  max-width: 96%;
  max-height: 92%;
  width: auto;
  height: auto;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
  cursor: zoom-out;
}
.lesson-lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}
.lesson-lightbox-close:hover { background: rgba(255, 255, 255, 0.34); }
body.lesson-lightbox-open { overflow: hidden; }
`;

function ensureZoomStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = ZOOM_CSS;
  (document.head || document.documentElement).append(style);
}

let _lessonLightbox = null;

export function ensureLessonLightbox() {
  if (_lessonLightbox) return _lessonLightbox;
  ensureZoomStyles();

  const lb = document.createElement("dialog");
  lb.className = "lesson-lightbox";
  lb.setAttribute("aria-label", "Enlarged image");

  const big = document.createElement("img");
  big.className = "lesson-lightbox-img";
  big.alt = "";

  const close = document.createElement("button");
  close.type = "button";
  close.className = "lesson-lightbox-close";
  close.setAttribute("aria-label", "Close enlarged image");
  close.textContent = "✕";

  lb.append(big, close);
  document.body.append(lb);

  const modalCapable = typeof lb.showModal === "function" && typeof lb.close === "function";
  let lastFocus = null;
  let open = false;

  const finish = () => {
    open = false;
    document.body.classList.remove("lesson-lightbox-open");
    big.removeAttribute("src");
    clearNode();
    // Return focus to the image the student clicked, so keyboard users land
    // back where they were instead of at the top of the document.
    if (lastFocus?.focus) {
      try {
        lastFocus.focus();
      } catch {}
    }
    lastFocus = null;
  };

  const hide = () => {
    if (!open) return;
    if (modalCapable) {
      lb.close(); // the "close" listener below runs finish()
      return;
    }
    lb.removeAttribute("open");
    lb.hidden = true;
    finish();
  };

  close.addEventListener("click", hide);
  big.addEventListener("click", hide); // clicking the enlarged image closes it
  lb.addEventListener("click", (e) => {
    if (e.target === lb) hide(); // backdrop click
  });
  if (modalCapable) {
    lb.addEventListener("close", finish);
  } else {
    // No <dialog> semantics here, so Escape has to be wired by hand.
    document.addEventListener("keydown", (e) => {
      if (open && e.key === "Escape") hide();
    });
  }

  /* A figure drawn as inline SVG — the tape diagrams, number lines and area
     models — has no `src` to hand the <img>, so it is shown by cloning the node
     into the dialog at full size. The clone is inert: no ids are carried over
     that could collide, and any interactive lab is excluded before we get here. */
  const nodeHost = document.createElement("div");
  nodeHost.className = "lesson-lightbox-node";
  nodeHost.hidden = true;
  lb.append(nodeHost);
  nodeHost.addEventListener("click", hide);

  const clearNode = () => {
    nodeHost.replaceChildren();
    nodeHost.hidden = true;
  };

  _lessonLightbox = {
    isOpen: () => open,
    openNode(node, label, opener) {
      if (!node || typeof node.cloneNode !== "function") return;
      const clone = node.cloneNode(true);
      clone.removeAttribute?.("id");
      clone.removeAttribute?.("tabindex");
      clone.classList?.remove?.("is-zoomable");
      clone.style.width = "min(92vw, 1400px)";
      clone.style.height = "auto";
      clone.style.maxHeight = "88vh";
      nodeHost.replaceChildren(clone);
      nodeHost.hidden = false;
      big.hidden = true;
      lb.setAttribute("aria-label", label || "Enlarged figure");
      lastFocus = opener || null;
      open = true;
      document.body.classList.add("lesson-lightbox-open");
      if (modalCapable) {
        if (!lb.open) lb.showModal();
      } else {
        lb.hidden = false;
        lb.setAttribute("open", "");
      }
      setTimeout(() => {
        try {
          close.focus();
        } catch {}
      }, 0);
    },
    open(src, alt, opener) {
      if (!src) return; // a broken image has nothing to enlarge
      clearNode();
      big.hidden = false;
      lb.setAttribute("aria-label", "Enlarged image");
      lastFocus = opener || null;
      big.src = src;
      big.alt = alt || "";
      open = true;
      document.body.classList.add("lesson-lightbox-open");
      if (modalCapable) {
        if (!lb.open) lb.showModal();
      } else {
        lb.hidden = false;
        lb.setAttribute("open", "");
      }
      setTimeout(() => {
        try {
          close.focus();
        } catch {}
      }, 0);
    },
    close: hide,
  };
  return _lessonLightbox;
}

// True while the shared lightbox is showing. Callers that own their own Escape
// handler (the glossary pop-up) use this so one Escape keypress closes only the
// lightbox and leaves the pop-up underneath it open.
export function isLightboxOpen() {
  return !!_lessonLightbox && _lessonLightbox.isOpen();
}

// Make one <img> tap-to-enlarge. Idempotent: an image that is re-shown with a
// new src (the singleton glossary picture) keeps a single set of listeners, and
// the src is read at click time so the lightbox always shows what is on screen.
export function attachImageZoom(img) {
  if (!img || img.dataset.zoomable === "1") return;
  img.dataset.zoomable = "1";
  img.classList.add("is-zoomable");
  // Keep the implicit img role: overriding it with role="button" hid the
  // picture from assistive tech as an image (and its alt became a button
  // label), which is exactly backwards for a vocabulary illustration.
  img.setAttribute("tabindex", "0");
  if (!img.getAttribute("title")) img.setAttribute("title", "Click to enlarge");
  const open = () => ensureLessonLightbox().open(img.currentSrc || img.src, img.alt, img);
  img.addEventListener("click", (e) => {
    // The vocabulary picture can sit inside a button/label (small-group cards);
    // enlarging must not also toggle whatever control encloses it.
    e.preventDefault();
    e.stopPropagation();
    open();
  });
  img.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      open();
    }
  });
}

// Attach the affordance to every image matching `selector` inside `root` that
// does not already have it. Returns the number newly wired.
export function attachImageZoomAll(root, selector) {
  if (!root || typeof root.querySelectorAll !== "function") return 0;
  let n = 0;
  for (const img of root.querySelectorAll(selector)) {
    if (img.dataset.zoomable === "1") continue;
    attachImageZoom(img);
    n++;
  }
  return n;
}

/* Every picture a student meets should enlarge — not only the five the renderer
   happened to wire by hand.
 *
 * The affordance was attached at five call sites in lesson-renderer.js (reveal
 * slides, Notice & Wonder, the word-problem art, the vocab pop-up, the objective
 * visual-model card) and at exactly ZERO sites in the small-group renderer. So a
 * tape-diagram or scene image outside those five paths looked identical to one
 * inside them and simply did nothing when tapped — and the whole small-group
 * fleet had no zoom at all.
 *
 * Wiring per call site is what created that gap, so this watches the document
 * instead: images already present are wired now, and anything a lazily-rendered
 * phase mounts later is wired when it appears. It mirrors
 * observeWordProblemAnnotation, which solved the same "phases render late"
 * problem for markup tools.
 *
 * What is deliberately NOT zoomable:
 *   • anything inside the lightbox itself (it would reopen over itself)
 *   • icons and avatars — an image under 64px in either authored dimension is
 *     chrome, not content
 *   • opt-outs: [data-no-zoom], and images inside [data-no-zoom] containers
 *   • interactive SVG manipulatives, which are not <img> at all and must keep
 *     their own pointer handling
 */
const ZOOM_SKIP = ".lesson-lightbox, [data-no-zoom]";
const ICON_MAX = 64;

/* An inline-SVG figure is zoomable only when it is a PICTURE. Anything a
   student drags, types into or drops onto keeps its own pointer handling —
   stealing the click there would break the manipulative. Interactive visuals
   mark their host with data-iv-mounted (see interactive-visual.js), which is the
   reliable signal; the rest are structural. */
const SVG_SKIP = "[data-iv-mounted], button, a, label, .iv-lab, .annotator, [data-no-zoom]";
const SVG_MIN = 120;

/**
 * A figure the page has declared decorative is not content, and must never be
 * made a keyboard stop.
 *
 * axe reports this as `aria-hidden-focus` on every small-group lesson: the
 * themed hero banner ships as `<svg role="img" aria-hidden="true">`, this file
 * measured it as a large picture and gave it `tabindex="0"`, and a screen-reader
 * user then tabbed onto an element their reader is required to skip — a stop
 * that announces nothing and has no way out but to keep tabbing.
 *
 * Zoom is dropped entirely rather than merely un-focused. Keeping the click and
 * removing the tab stop would leave an affordance a mouse can reach and a
 * keyboard cannot, which trades one accessibility defect for another.
 *
 * `aria-hidden` is inherited, so an ancestor hiding the subtree counts. The
 * presentation roles are included because they make the same claim in different
 * words, and `inert` because it removes the node from the tab order anyway.
 */
const DECORATIVE = '[aria-hidden="true"], [role="presentation"], [role="none"], [inert]';

function isDecorative(node) {
  if (!node || typeof node.closest !== "function") return false;
  return !!node.closest(DECORATIVE);
}

function isContentFigure(svg) {
  if (!svg || svg.dataset?.zoomable === "1") return false;
  if (typeof svg.closest !== "function" || svg.closest(SVG_SKIP)) return false;
  if (isDecorative(svg)) return false;
  if (svg.closest(ZOOM_SKIP)) return false;
  if (svg.querySelector("input, textarea, foreignObject")) return false;
  const box = typeof svg.getBoundingClientRect === "function" ? svg.getBoundingClientRect() : null;
  if (box && box.width && box.width < SVG_MIN) return false;
  const view = svg.getAttribute?.("viewBox");
  if (!box?.width && view) {
    const w = Number(String(view).trim().split(/\s+/)[2]);
    if (Number.isFinite(w) && w < SVG_MIN) return false;
  }
  return true;
}

/** Make one inline-SVG figure tap-to-enlarge. */
export function attachFigureZoom(svg) {
  if (!svg || svg.dataset?.zoomable === "1") return;
  // Exported, so a direct caller can reach here without isContentFigure().
  if (isDecorative(svg)) return;
  svg.dataset.zoomable = "1";
  svg.classList.add("is-zoomable");
  svg.setAttribute("tabindex", "0");
  if (!svg.getAttribute("role")) svg.setAttribute("role", "img");
  if (!svg.getAttribute("title")) svg.setAttribute("title", "Click to enlarge");
  const label =
    svg.querySelector("title")?.textContent || svg.getAttribute("aria-label") || "Enlarged figure";
  const open = () => ensureLessonLightbox().openNode(svg, label, svg);
  svg.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    open();
  });
  svg.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      open();
    }
  });
}

function isContentImage(img) {
  if (!img || img.dataset.zoomable === "1") return false;
  if (img.closest(ZOOM_SKIP)) return false;
  if (isDecorative(img)) return false;
  const w = Number(img.getAttribute("width"));
  const h = Number(img.getAttribute("height"));
  if (Number.isFinite(w) && w > 0 && w < ICON_MAX) return false;
  if (Number.isFinite(h) && h > 0 && h < ICON_MAX) return false;
  return true;
}

/**
 * Wire every content image under `root`, now and as more arrive.
 * Safe to call more than once per document; attachImageZoom is idempotent.
 *
 * @returns {() => void} stop observing
 */
export function observeContentImageZoom(root) {
  const host = root || document.body;
  if (!host || typeof host.querySelectorAll !== "function") return () => {};

  const wireWithin = (node) => {
    if (node.nodeType !== 1) return;
    if (node.tagName === "IMG") {
      if (isContentImage(node)) attachImageZoom(node);
      return;
    }
    if (node.tagName === "svg" || node.namespaceURI === "http://www.w3.org/2000/svg") {
      if (isContentFigure(node)) attachFigureZoom(node);
      return;
    }
    if (typeof node.querySelectorAll !== "function") return;
    for (const img of node.querySelectorAll("img")) {
      if (isContentImage(img)) attachImageZoom(img);
    }
    for (const svg of node.querySelectorAll("svg")) {
      if (isContentFigure(svg)) attachFigureZoom(svg);
    }
  };

  wireWithin(host);

  if (typeof MutationObserver !== "function") return () => {};
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) wireWithin(node);
    }
  });
  observer.observe(host, { childList: true, subtree: true });
  return () => observer.disconnect();
}
