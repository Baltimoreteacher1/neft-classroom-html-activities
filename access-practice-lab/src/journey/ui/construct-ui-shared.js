// Language Construction UI: markup helpers shared by the shell and the module views.
// Authored task content (sentences, words, labels) is English and rendered lang="en"; chrome is a bilingual pair.
import { html, icon, raw, toHtml } from "../../util.js";

/** Make an html`` fragment also work where a plain string is expected (String(frag), `${frag}`). */
export const finalize = (frag) => {
  Object.defineProperty(frag, "toString", { value: () => toHtml(frag), enumerable: false });
  return frag;
};

/** A [en, es] pair as markup (bilingual mode shows both) and as a plain string. */
export const tt = (env, p) => env.I.T(p[0], p[1]);
export const ts = (env, p) => env.I.S(p[0], p[1]);
export const quote = (text) => html`<q class="cn-quote" lang="en">${text}</q>`;
export const chev = (dir) =>
  raw(
    `<svg class="cn-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="${dir === "up" ? "M3 10l5-5 5 5" : "M3 6l5 5 5-5"}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  );

export const MODULE_LABEL = {
  expand: ["Expand", "Ampliar"],
  combine: ["Combine", "Combinar"],
  connector: ["Connect", "Conectar"],
  morphology: ["Word parts", "Partes de palabras"],
  pronoun: ["Pronouns", "Pronombres"],
  discourse: ["Order", "Orden"],
};
export const PHASE_LABEL = {
  explore: ["Explore", "Explora"],
  try: ["Try", "Practica"],
  accepted: ["Accepted", "Aceptado"],
  transfer: ["Transfer", "Transferencia"],
};
export const INTRO = {
  expand: [
    "Make a short sentence richer. Add how, why and a detail, then see exactly what you changed.",
    "Haz más rica una oración corta. Agrega cómo, por qué y un detalle, y mira exactamente qué cambiaste.",
  ],
  combine: [
    "Join two sentences into one idea and show how they are connected. Many structures work.",
    "Une dos oraciones en una sola idea y muestra cómo se conectan. Sirven muchas estructuras.",
  ],
  connector: [
    "Choose the link word that fits each gap. Ask yourself: how are the two parts related?",
    "Elige la palabra de enlace que encaja en cada espacio. Pregúntate: ¿cómo se relacionan las dos partes?",
  ],
  morphology: [
    "Build words from their parts, then tell what a part means.",
    "Arma palabras con sus partes y di qué significa una parte.",
  ],
  pronoun: [
    "Find out who or what each pronoun points back to.",
    "Descubre a quién o a qué se refiere cada pronombre.",
  ],
  discourse: [
    "Put the sentences in an order that makes sense, then choose the link words.",
    "Pon las oraciones en un orden que tenga sentido y luego elige las palabras de enlace.",
  ],
};
export const TAG_LABEL = {
  how: ["how", "cómo"],
  cause: ["why (cause)", "por qué (causa)"],
  detail: ["detail", "detalle"],
};

/** Feedback box: tone "right" | "hint", with an optional list of lines. */
export function feedbackBox(env, fb, { id = "", extra = "" } = {}) {
  if (!fb) return "";
  const right = fb.tone === "right";
  return html`<div
    class="feedback ${right ? "is-right" : "is-hint"} cn-fb"
    ${id ? raw(`id="${id}" data-k="${id}" tabindex="-1"`) : ""}
    role="status"
  >
    <p class="fb-title">${icon(right ? "check" : "bulb")} ${tt(env, fb.t)}</p>
    ${extra}
  </div>`;
}

/** Evidence chips: the learner's own words, quoted. */
export const evidenceList = (spans) =>
  spans?.length
    ? html`<span class="cn-ev">${spans.slice(0, 3).map((s) => quote(s.text))}</span>`
    : "";

/** The cause -> effect arrow: cause and effect boxes joined by the connector the learner used. */
export function causeArrow(env, rel) {
  if (!rel?.complete) return "";
  const order = {
    "effect-first": [
      "In your sentence the result comes first and the reason follows.",
      "En tu oración va primero el resultado y después la razón.",
    ],
    "cause-first": [
      "In your sentence the reason comes first and the result follows.",
      "En tu oración va primero la razón y después el resultado.",
    ],
    "two-sentences": [
      "Your reason and your result are in two sentences.",
      "Tu razón y tu resultado están en dos oraciones.",
    ],
  }[rel.order];
  return html`<figure
    class="cn-arrow"
    aria-label="${env.I.S("Cause leads to effect", "La causa lleva al efecto")}"
  >
    <div class="cn-arrow-box cn-arrow-cause">
      <span class="cn-arrow-tag">${tt(env, ["Cause", "Causa"])}</span>${quote(rel.cause.text)}
    </div>
    <div class="cn-arrow-link" aria-hidden="true">
      <span class="cn-arrow-word" lang="en">${rel.connector.text}</span>
      <svg viewBox="0 0 120 24" focusable="false">
        <path class="cn-arrow-line" d="M2 12h104" />
        <path class="cn-arrow-head" d="M96 4l16 8-16 8" />
      </svg>
    </div>
    <div class="cn-arrow-box cn-arrow-effect">
      <span class="cn-arrow-tag">${tt(env, ["Effect", "Efecto"])}</span>${quote(rel.effect.text)}
    </div>
    ${order ? html`<figcaption>${tt(env, order)}</figcaption>` : ""}
  </figure>`;
}

/** Text with the given spans wrapped in <mark>; spans must not overlap. `cls(span)` and `label(span)` shape each mark. */
export function markText(text, spans, cls, label) {
  const sorted = [...spans].sort((a, b) => a.start - b.start);
  let at = 0;
  const parts = [];
  for (const s of sorted) {
    if (s.start < at) continue;
    parts.push(html`${text.slice(at, s.start)}`);
    parts.push(
      html`<mark class="${cls(s)}"
        >${label ? html`<span class="cn-tag">${label(s)}</span>` : ""}${text.slice(s.start, s.end)}</mark
      >`,
    );
    at = s.end;
  }
  parts.push(html`${text.slice(at)}`);
  return parts;
}

/** Spoken-word tiles for the sentence tray preview: new words (not in the starting sentence) are tinted. */
export const wordTiles = (text, starting) => {
  const base = new Set(
    String(starting || "")
      .toLowerCase()
      .match(/[\p{L}\p{N}'’-]+/gu) || [],
  );
  return (String(text).match(/\S+/g) || []).map(
    (w) =>
      html`<span
        class="cn-tile ${base.has(w.toLowerCase().replace(/[^\p{L}\p{N}'’-]/gu, "")) ? "" : "is-new"}"
        >${w}</span
      >`,
  );
};

/** Accessible name of a morphology slot: its part type and what it holds. */
export const typeLabel = (env, type, t) => {
  const n = { prefix: ["prefix", "prefijo"], root: ["root", "raíz"], suffix: ["suffix", "sufijo"] }[type];
  return env.I.S(`${n[0]} slot: ${t || "empty"}`, `espacio de ${n[1]}: ${t || "vacío"}`);
};
