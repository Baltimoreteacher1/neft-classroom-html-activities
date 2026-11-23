// Vocabulary Academy lessons — shared markup helpers for the step kinds (cards, passage text, chips, save chip).
import { esc, html, raw, toHtml } from "../../util.js";
import { bandOfGrade } from "../contract.js";
import { speak, speakSpanish, stop } from "../../speech.js";

export const tx = (I, pair) => (Array.isArray(pair) ? I.T(pair[0], pair[1]) : pair);
export const txS = (I, pair) => (Array.isArray(pair) ? I.S(pair[0], pair[1]) : pair);
export const isEarly = (unit) => bandOfGrade(String(unit.grade)) === "early";
export const wc = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;
export const asRaw = (x) => (x && typeof x === "object" ? x : raw(String(x ?? "")));

/** Speak helpers shared by every kind. `data-val-say` buttons are wired in the controller. */
export const sayButton = (I, text, label, cls = "") =>
  html`<button type="button" class="btn val-btn-ghost ${cls}" data-val-say="${text}"><span aria-hidden="true">🔊</span> ${label}</button>`;
export function say(text, opts = {}) {
  stop();
  return speak(text, { rate: 0.85, ...opts });
}
export { speakSpanish, stop as stopSpeech };

/** Emoji-scene fallback used when art.js is not published; always carries a real text alternative. */
export function visualFallback(word) {
  const v = word.visual;
  if (!v || v.kind === "none") return "";
  if (v.kind === "diagram") return html`<figure class="val-visual"><div class="val-diagram" role="img" aria-label="${v.alt}">${v.diagram || "spectrum"}</div><figcaption class="val-sr">${v.alt}</figcaption></figure>`;
  return html`<figure class="val-visual"><div class="val-scene" role="img" aria-label="${v.alt}">${(v.glyphs || []).map((g) => html`<span aria-hidden="true">${g}</span>`)}</div></figure>`;
}

/** Word card: art.js's wordCardHTML when published, otherwise a plain card from the same fields. */
export function cardHTML(S, word) {
  const { I, deps } = S;
  try {
    const out = deps.art?.wordCardHTML?.(word, { I, supports: S.sup, band: S.band, size: S.early ? "lg" : "md" });
    if (out) return asRaw(out);
  } catch (error) {
    console.warn("[vocab-academy] wordCardHTML failed; using the built-in card", error);
  }
  const es = S.sup.glossaryEs || I.mode !== "en";
  return html`<article class="val-card" aria-label="${word.hw}">
    ${S.sup.picture === false ? "" : visualFallback(word)}
    <h3 class="val-card-hw" lang="en">${word.hw}</h3>
    <p class="val-card-meta"><span class="val-pron" lang="en">${word.pron || ""}</span> <span class="val-pos">${word.pos}</span></p>
    <p class="val-card-def"><strong>${I.T("Meaning", "Significado")}:</strong> <span lang="en">${word.def}</span></p>
    <p class="val-card-ex"><strong>${I.T("Example", "Ejemplo")}:</strong> <span lang="en">${word.ex}</span></p>
    ${word.nonExample ? html`<p class="val-card-non"><strong>${I.T("Not an example", "No es un ejemplo")}:</strong> <span lang="en">${word.nonExample}</span></p>` : ""}
    ${es && word.es?.gloss ? html`<p class="val-card-es"><strong>Español:</strong> <span lang="es">${word.es.gloss}</span></p>` : ""}
  </article>`;
}

/** Mini card for a tapped word in the reader. */
export const miniCardHTML = (I, word) => html`<div class="val-mini" role="region" aria-labelledby="val-mini-title" data-val-mini="${word.id}">
  <h4 id="val-mini-title" tabindex="-1" lang="en">${word.hw} <span class="val-pron">${word.pron || ""}</span></h4>
  <p lang="en">${word.def}</p><p lang="en"><em>${word.ex}</em></p>
  <div class="val-actions">${sayButton(I, word.hw, I.T("Hear it", "Escúchala"))}<button type="button" class="btn" data-val-mini-close>${I.T("Close", "Cerrar")}</button></div></div>`;

/** Passage paragraphs with target words as buttons; text pieces are escaped. */
export function passageHTML(unit, { tappable = true } = {}) {
  const p = unit.passage || {};
  const stems = unit.words.map((w) => {
    const hw = w.hw.toLowerCase();
    return { id: w.id, stem: hw.length > 6 ? hw.slice(0, -2) : hw };
  });
  const re = new RegExp(`\\b(${stems.map((s) => s.stem.replace(/[-.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[a-z]*`, "gi");
  const idOf = (token) => stems.find((s) => token.toLowerCase().startsWith(s.stem))?.id;
  return (p.paras || []).map((para, i) => {
    let out = "";
    let last = 0;
    for (const m of para.matchAll(re)) {
      const id = idOf(m[0]);
      out += esc(para.slice(last, m.index));
      out += tappable && id ? `<button type="button" class="val-word" data-val-word="${esc(id)}" aria-label="${esc(m[0])}, word from this unit. Open its card.">${esc(m[0])}</button>` : `<mark class="val-hl">${esc(m[0])}</mark>`;
      last = m.index + m[0].length;
    }
    out += esc(para.slice(last));
    return `<p class="val-para" data-val-para="${i}" lang="en">${out}</p>`;
  }).join("");
}

export const wordChip = (text, attrs = "") => raw(`<button type="button" class="btn val-chip" ${attrs}>${esc(text)}</button>`);

export const hasToHtml = toHtml;

/** Load the lessons stylesheet once (the routed shell may also load it); resolves when applied or after a short wait. */
let cssReady = null;
export function ensureLessonCss(base = "/access-practice-lab") {
  if (cssReady || typeof document === "undefined") return cssReady || Promise.resolve();
  const href = `${base}/vocab-academy-lessons.css`;
  if (document.querySelector(`link[rel="stylesheet"][href^="${href}"]`)) return (cssReady = Promise.resolve());
  cssReady = new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
    setTimeout(resolve, 3000);
    document.head.append(link);
  });
  return cssReady;
}
