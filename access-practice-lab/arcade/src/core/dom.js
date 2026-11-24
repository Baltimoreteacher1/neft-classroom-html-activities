// Small DOM helpers. The arcade is plain ES modules, the same convention the
// practice lab uses in production (no bundler, no framework).

export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/** Escape text that goes into an HTML template. */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Build elements from an HTML string (single root) or return a fragment. */
export function html(markup) {
  const tpl = document.createElement("template");
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild;
}

export function on(root, type, selector, handler, options) {
  if (!root) return () => {};
  const fn = (event) => {
    const target = event.target.closest(selector);
    if (target && root.contains(target)) handler(event, target);
  };
  root.addEventListener(type, fn, options);
  return () => root.removeEventListener(type, fn, options);
}

export function debounce(fn, ms = 160) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export const reducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function announce(message) {
  let live = qs("#sr-live");
  if (!live) {
    live = document.createElement("p");
    live.id = "sr-live";
    live.className = "sr-only";
    live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);
  }
  live.textContent = "";
  window.setTimeout(() => {
    live.textContent = message;
  }, 40);
}

export function shuffle(list, rnd = Math.random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/** Small inline glyphs used inside buttons (an emoji-free, dependable set). */
export const glyph = {
  speaker:
    '<svg class="glyph" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3l4-3.5v12l-4-3.5H4z"/><path d="M15.5 8.5a6 6 0 010 7"/></svg>',
  mic: '<svg class="glyph" viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 17.5V21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

export function formatNumber(n) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(n);
}
