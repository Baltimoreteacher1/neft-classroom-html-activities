// Reading-mode vocabulary highlighting (pure string work; no DOM, no imports).
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

/** Wrap vocabulary words in reading-mode HTML (text nodes only, whole words, never inside links or buttons). */
export function markVocab(html, words) {
  const list = [...new Set((words || []).map((w) => String(w || "").trim()).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!list.length || !html) return html;
  const re = new RegExp(
    `(?<![\\p{L}\\p{N}])(${list.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}])`,
    "giu",
  );
  let depth = 0;
  return html
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith("<")) {
        if (/^<(a|button)\b/i.test(part)) depth++;
        else if (/^<\/(a|button)>/i.test(part)) depth = Math.max(0, depth - 1);
        return part;
      }
      return depth
        ? part
        : part.replace(
            re,
            (m) =>
              `<button type="button" class="bk-vw" data-vw="${esc(m.toLowerCase())}">${m}</button>`,
          );
    })
    .join("");
}

