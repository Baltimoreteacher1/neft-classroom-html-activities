// Vocabulary Academy art: emoji-scene cards, small labelled diagrams and the word card. Every picture carries a real
// text alternative (visual.alt), decorative glyphs are hidden from screen readers, and a word with no picture gets a
// calm text card instead of a gap. Returns `raw` markup (safe to interpolate with util.js `html`).
import { esc, html, raw } from "../util.js";
import { makeI18n } from "../i18n.js";

const SIZES = new Set(["sm", "md", "lg"]);
const sizeOf = (s) => (SIZES.has(s) ? s : "md");
const POS = {
  n: ["noun", "sustantivo"], v: ["verb", "verbo"], adj: ["adjective", "adjetivo"], adv: ["adverb", "adverbio"],
  prep: ["preposition", "preposición"], conj: ["conjunction", "conjunción"], pron: ["pronoun", "pronombre"], phr: ["phrase", "frase"],
};
const clip = (s, n = 13) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

// ── diagrams: labels are the word's own data (synonyms, opposite, family, parts), never invented ──────
const boxW = (t) => Math.max(46, Math.min(104, 12 + clip(t).length * 6.4));
const label = (x, y, text, cls = "", whole = false) =>
  `<text x="${x}" y="${y}" text-anchor="middle" class="vaa-d-text ${cls}">${esc(whole ? text : clip(text))}</text>`;
const node = (cx, cy, text, hot = false) => {
  const w = boxW(text);
  return `<rect x="${cx - w / 2}" y="${cy - 14}" width="${w}" height="28" rx="14" class="vaa-d-node${hot ? " vaa-d-hot" : ""}"/>${label(cx, cy + 4, text, hot ? "vaa-d-strong" : "")}`;
};
const arrowDef = `<defs><marker id="vaa-arr" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L8 4L0 8z" class="vaa-d-arrow"/></marker></defs>`;

function diagramSVG(word, I) {
  const kind = word.visual?.diagram || "spectrum";
  const hw = word.hw;
  const syn = word.syn || [];
  const ant = word.ant || [];
  const fam = (word.family || []).map((f) => f.w);
  let body = "";
  if (kind === "contrast") {
    const right = ant[0];
    body = `<rect x="8" y="30" width="108" height="88" rx="10" class="vaa-d-panel"/><rect x="124" y="30" width="108" height="88" rx="10" class="vaa-d-panel vaa-d-alt"/>
      ${label(62, 58, I.S("is", "es"), "vaa-d-small")}${label(62, 86, hw, "vaa-d-strong")}${label(62, 108, "✓", "vaa-d-mark")}
      ${label(178, 58, right ? I.S("opposite", "opuesto") : I.S("is not", "no es"), "vaa-d-small")}${label(178, 86, right || hw, "vaa-d-strong")}${label(178, 108, "✗", "vaa-d-mark")}
      ${label(120, 18, I.S("compare", "compara"), "vaa-d-small")}`;
  } else if (kind === "cycle" || kind === "web") {
    const others = (kind === "web" ? [...syn, ...fam, ...ant] : [...fam, ...syn]).filter((x, i, a) => x && a.indexOf(x) === i && x !== hw).slice(0, kind === "web" ? 6 : 3);
    const R = kind === "web" ? 50 : 46;
    const pts = others.map((t, i) => {
      const a = (-Math.PI / 2) + (i * 2 * Math.PI) / Math.max(others.length, 1);
      return [120 + Math.cos(a) * R * 1.55, 75 + Math.sin(a) * R, t];
    });
    if (kind === "web") body = pts.map(([x, y]) => `<line x1="120" y1="75" x2="${x}" y2="${y}" class="vaa-d-line"/>`).join("") + node(120, 75, hw, true) + pts.map(([x, y, t]) => node(x, y, t)).join("");
    else {
      const ring = [[120, 75 - R, hw], ...pts.map(([x, y, t], i) => [x, y, t])];
      const ordered = ring.length > 1 ? ring : [[120, 75, hw]];
      body = ordered.map(([x, y], i) => { const [nx, ny] = ordered[(i + 1) % ordered.length]; return ordered.length > 1 ? `<line x1="${x}" y1="${y}" x2="${(x + nx) / 2}" y2="${(y + ny) / 2}" class="vaa-d-line" marker-end="url(#vaa-arr)"/><line x1="${(x + nx) / 2}" y1="${(y + ny) / 2}" x2="${nx}" y2="${ny}" class="vaa-d-line"/>` : ""; }).join("") + ordered.map(([x, y, t], i) => node(x, y, t, i === 0)).join("");
    }
  } else if (kind === "flow") {
    const segs = (word.morph?.segs || []).map((g) => g.s).filter(Boolean);
    const steps = segs.length > 1 ? [...segs, hw] : [...fam.slice(0, 2), hw];
    const widths = steps.map(boxW);
    const total = widths.reduce((a, b) => a + b, 0) + (steps.length - 1) * 22;
    let x = 120 - total / 2;
    body = steps.map((t, i) => { const w = widths[i]; const cx = x + w / 2; const out = node(cx, 75, t, i === steps.length - 1) + (i < steps.length - 1 ? `<line x1="${x + w + 2}" y1="75" x2="${x + w + 20}" y2="75" class="vaa-d-line" marker-end="url(#vaa-arr)"/>` : ""); x += w + 22; return out; }).join("");
  } else {
    // spectrum: less ... more, with the word (and a near-synonym) placed on the bar
    const left = ant[0] || I.S("less", "menos");
    body = `<rect x="14" y="62" width="212" height="12" rx="6" class="vaa-d-bar"/>
      <circle cx="214" cy="68" r="9" class="vaa-d-dot"/>${syn[0] ? `<circle cx="150" cy="68" r="7" class="vaa-d-dot vaa-d-soft"/>${label(150, 100, syn[0])}` : ""}
      ${label(46, 100, left)}${label(196, 40, hw, "vaa-d-strong")}${label(120, 132, `${I.S("less", "menos")}  ←   →  ${I.S("more", "más")}`, "vaa-d-small", true)}`;
  }
  return `<svg class="vaa-diagram-svg" viewBox="0 0 240 150" aria-hidden="true" focusable="false">${arrowDef}${body}</svg>`;
}

/** Picture for a word: emoji scene, labelled diagram, or a calm text card. */
export function visualHTML(word, { size = "md", I = makeI18n("en"), caption = false } = {}) {
  const v = word?.visual;
  const sz = sizeOf(size);
  if (!v || v.kind === "none")
    return html`<figure class="vaa-pic vaa-pic-${sz} vaa-pic-none"><p class="vaa-pic-none-hw" lang="en">${word?.hw || ""}</p><p>${I.T("No picture for this word. Use its meaning and examples.", "No hay imagen para esta palabra. Usa su significado y ejemplos.")}</p></figure>`;
  const alt = v.alt || "";
  if (v.kind === "diagram")
    return html`<figure class="vaa-pic vaa-pic-${sz} vaa-pic-diagram" role="img" aria-label="${alt}">${raw(diagramSVG(word, I))}${caption ? html`<figcaption aria-hidden="true">${alt}</figcaption>` : ""}</figure>`;
  const glyphs = (v.glyphs || []).filter(Boolean).slice(0, 3);
  return html`<figure class="vaa-pic vaa-pic-${sz} vaa-pic-scene vaa-g${glyphs.length || 1}" role="img" aria-label="${alt}"><span class="vaa-glyphs" aria-hidden="true">${glyphs.map((g, i) => html`<span class="vaa-glyph vaa-glyph-${i + 1}">${g}</span>`)}</span>${caption ? html`<figcaption aria-hidden="true">${alt}</figcaption>` : ""}</figure>`;
}

let sayWired = false;
/** One document-level listener so any [data-vaa-say] button works wherever a card or item is rendered. */
export function ensureSayListener() {
  if (sayWired || typeof document === "undefined") return;
  sayWired = true;
  document.addEventListener("click", async (e) => {
    const b = e.target.closest?.("[data-vaa-say]");
    if (!b) return;
    e.preventDefault();
    b.dispatchEvent(new CustomEvent("vaa:say", { bubbles: true, detail: { text: b.dataset.vaaSay } }));
    try {
      const sp = await import("../speech.js");
      sp.stop();
      await sp.speak(b.dataset.vaaSay, { rate: 0.85, lang: b.dataset.vaaLang || "en-US" });
    } catch {
      /* no speech available: the text is on the page */
    }
  });
}

export const sayButton = (I, text, label, cls = "") => {
  ensureSayListener();
  return html`<button type="button" class="vaa-say ${cls}" data-vaa-say="${text}" aria-label="${I.S("Listen", "Escuchar")}${label ? `: ${label}` : ""}"><span aria-hidden="true">🔊</span><span class="vaa-say-t">${I.T("Listen", "Escuchar")}</span></button>`;
};

/** The word card: picture, word, say-it, meaning, example, optional parts and Spanish. `supports` are SPEC §5 flags. */
export function wordCardHTML(word, { I = makeI18n("en"), supports = {}, band = "", size = "md", showMorph = false } = {}) {
  const early = band === "early";
  const picture = supports.picture !== false || early;
  const es = (supports.glossaryEs || I.mode !== "en") && word.es?.gloss;
  const pos = POS[word.pos] || [word.pos, word.pos];
  const segs = word.morph?.segs || [];
  const audio = supports.audio || supports.readAloud || early;
  return html`<article class="vaa-card vaa-card-${sizeOf(size)}${early ? " vaa-card-early" : ""}" aria-label="${word.hw}">
    ${picture ? visualHTML(word, { size: early ? "lg" : size, I }) : ""}
    <header class="vaa-card-head"><h3 class="vaa-card-hw" lang="en">${word.hw}</h3>
      <p class="vaa-card-meta">${word.pron ? html`<span class="vaa-pron" lang="en">${word.pron}</span> ` : ""}<span class="vaa-pos">${I.T(pos[0], pos[1])}</span>${audio ? sayButton(I, `${word.hw}. ${word.def}`, word.hw) : ""}</p></header>
    <p class="vaa-card-def"><strong>${I.T("Meaning", "Significado")}:</strong> <span lang="en">${word.def}</span></p>
    ${word.ex ? html`<p class="vaa-card-ex"><strong>${I.T("Example", "Ejemplo")}:</strong> <span lang="en">${word.ex}</span></p>` : ""}
    ${word.nonExample && !early ? html`<p class="vaa-card-non"><strong>${I.T("Not an example", "No es un ejemplo")}:</strong> <span lang="en">${word.nonExample}</span></p>` : ""}
    ${es ? html`<p class="vaa-card-es"><strong>Español:</strong> <span lang="es">${word.es.gloss}</span></p>` : ""}
    ${(word.syn || []).length && !early ? html`<p class="vaa-card-syn"><strong>${I.T("Similar words", "Palabras parecidas")}:</strong> <span lang="en">${word.syn.join(", ")}</span></p>` : ""}
    ${showMorph && segs.length > 1 ? html`<p class="vaa-card-morph"><strong>${I.T("Word parts", "Partes")}:</strong> <span lang="en">${segs.map((g) => `${g.s}${g.m ? ` (${g.m})` : ""}`).join(" + ")}</span></p>` : ""}
  </article>`;
}
