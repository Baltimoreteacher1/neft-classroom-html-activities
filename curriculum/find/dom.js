/* dom.js — the small DOM helpers the /curriculum/find/ modules share. Text is always set as text, never as HTML. */

export const $ = (id) => document.getElementById(id);

export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) n.append(kid);
  return n;
}

/** localStorage, or null when the browser refuses it (private mode, blocked storage). */
export const store = (() => {
  try {
    const s = window.localStorage;
    s.getItem("ewl-find-probe");
    return s;
  } catch {
    return null;
  }
})();

/** Print one part of the page: the body class picks it in find.css, and comes off again after printing. */
export function printOnly(which) {
  const cls = `find-print-${which}`;
  document.body.classList.add(cls);
  const off = () => {
    document.body.classList.remove(cls);
    removeEventListener("afterprint", off);
  };
  addEventListener("afterprint", off);
  window.print();
  setTimeout(off, 1000);
}

export async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** The facts line every resource card shows: who it is for, how it opens, supports. */
export function facts(doc, audienceLabel) {
  const f = [`For ${audienceLabel(doc.a)}`];
  f.push(
    doc.pr
      ? (doc.f || []).map((x) => (x === "docx" ? "Word" : x.toUpperCase())).join(" + ")
      : "Opens online",
  );
  if (doc.es) f.push("Spanish available");
  if (doc.v === "support") f.push("Extra support level");
  if (doc.v === "challenge") f.push("Challenge level");
  return f;
}
