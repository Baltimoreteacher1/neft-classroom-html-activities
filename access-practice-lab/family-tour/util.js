export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** English words inside a Spanish page: marked so a screen reader switches voice. */
export const en = (s) => `<span lang="en">${esc(s)}</span>`;

export const BASE = "/access-practice-lab";
export const pictureSrc = (p) => (p?.picture?.src ? `${BASE}/${p.picture.src}` : "");

/** Words in `b` that are not in `a`, wrapped in <mark>, so a family can see what an improved answer added. */
export function markAdded(a, b) {
  const seen = new Set((a.toLowerCase().match(/[a-z']+/g) || []));
  return String(b)
    .split(/(\s+)/)
    .map((tok) => {
      const w = tok.toLowerCase().replace(/[^a-z']/g, "");
      return w && !seen.has(w) ? `<mark>${esc(tok)}</mark>` : esc(tok);
    })
    .join("");
}

export const icon = (name) =>
  ({
    speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 9a6 6 0 0 0 12 0M12 18v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    write: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4-1 11-11-3-3L5 16l-1 4Zm10-13 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    grow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V9m0 0c0-3 2-5 6-5 0 4-2 6-6 5Zm0 4c0-3-2-5-6-5 0 4 2 6 6 5Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    listen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Zm12 0a4 4 0 0 1 0 6m2-9a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  })[name] || "";
