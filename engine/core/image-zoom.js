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

  _lessonLightbox = {
    isOpen: () => open,
    open(src, alt, opener) {
      if (!src) return; // a broken image has nothing to enlarge
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
