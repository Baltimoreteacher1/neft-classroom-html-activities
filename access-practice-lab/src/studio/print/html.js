// Escaping and math typesetting for the printed worksheet. Everything a teacher typed goes through esc() or
// mathHtml(); nothing is ever inserted as raw HTML.

import { mathRuns, spokenMath } from "../core/math.js";

const ENT = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ENT[c]);

/** Text with the studio's math markup as HTML: stacked fractions, superscripts, subscripts and **bold**. */
export function mathHtml(text) {
  const html = mathRuns(text)
    .map((r) => {
      if (r.t === "text") return esc(r.v);
      if (r.t === "frac")
        return `<span class="frac" role="math" aria-label="${esc(spokenMath(`{${r.n}/${r.d}}`))}"><span class="fn">${esc(r.n)}</span><span class="fd">${esc(r.d)}</span></span>`;
      if (r.t === "sup") return `<sup>${esc(r.v)}</sup>`;
      return `<sub>${esc(r.v)}</sub>`;
    })
    .join("");
  return html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

/** Paragraphs from text: blank line = new paragraph, single newline = line break. */
export function paragraphsHtml(text, cls = "") {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p${cls ? ` class="${cls}"` : ""}>${mathHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

/** A string safe inside a CSS "..." literal (for the running header). */
export const cssString = (s) =>
  String(s ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[\\"]/g, (c) => `\\${c}`)
    .replace(/[<>&]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `);

/** A same-origin base for relative image paths. Only plain http(s) origins are accepted. */
export function safeBase(baseUrl) {
  try {
    const u = new URL(String(baseUrl || ""));
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin + "/" : "";
  } catch {
    return "";
  }
}
