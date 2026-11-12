// Connector Climb: the illustrated cliff, connector cards and the bilingual relationship copy.
// The game logic lives in connector-climb.js; this file only turns state into markup.
import { glossHTML, html, raw } from "./engine.js";
import { C, svg } from "./art.js";

/** The six logical relationships, in the order the grouped (Starting) card rack shows them. */
export const RELS = {
  cause: {
    name: ["Cause", "Causa"],
    hint: [
      "Does the second idea tell why the first idea happened?",
      "¿La segunda idea dice por qué pasó la primera?",
    ],
  },
  result: {
    name: ["Result", "Resultado"],
    hint: [
      "Is the second idea an effect that comes from the first idea?",
      "¿La segunda idea es un efecto que viene de la primera?",
    ],
  },
  contrast: {
    name: ["Contrast", "Contraste"],
    hint: [
      "Do the two ideas surprise you together? Look for a difference.",
      "¿Las dos ideas juntas te sorprenden? Busca una diferencia.",
    ],
  },
  sequence: {
    name: ["Sequence", "Secuencia"],
    hint: [
      "Do the ideas tell steps in time order?",
      "¿Las ideas cuentan pasos en orden de tiempo?",
    ],
  },
  example: {
    name: ["Example", "Ejemplo"],
    hint: [
      "Is the second idea one specific case that shows the first idea is true?",
      "¿La segunda idea es un caso específico que muestra que la primera es verdad?",
    ],
  },
  addition: {
    name: ["Addition", "Adición"],
    hint: [
      "Does the second idea add one more fact of the same kind?",
      "¿La segunda idea añade otro dato del mismo tipo?",
    ],
  },
};
export const REL_ORDER = Object.keys(RELS);

const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

/** Why the connector fits (shown after the connector step settles). */
export function relExplain(rel, c, es) {
  const q = `“${c}”`;
  return {
    cause: [
      `${q} tells why: the second idea is the reason for the first.`,
      `${q} (${es}) dice por qué: la segunda idea es la razón de la primera.`,
    ],
    result: [
      `${q} shows a result: the second idea happens because of the first.`,
      `${q} (${es}) muestra un resultado: la segunda idea pasa a causa de la primera.`,
    ],
    contrast: [
      `${q} shows a contrast: the second idea is different from what you expect.`,
      `${q} (${es}) muestra un contraste: la segunda idea es diferente de lo que esperas.`,
    ],
    sequence: [
      `${q} shows time order: one step happens, then the next.`,
      `${q} (${es}) muestra el orden en el tiempo: un paso pasa y luego el siguiente.`,
    ],
    example: [
      `${q} introduces an example that shows the first idea is true.`,
      `${q} (${es}) presenta un ejemplo que muestra que la primera idea es verdad.`,
    ],
    addition: [
      `${q} adds another idea of the same kind.`,
      `${q} (${es}) añade otra idea del mismo tipo.`,
    ],
  }[rel];
}

/** The punctuation rule for each kind of connector. */
export function punctRule(type, c) {
  const q = `“${c}”`;
  const Q = `“${cap(c)}”`;
  return {
    sub: [
      `When ${q} comes in the middle, no comma or period goes before it.`,
      `Cuando ${q} va en el medio, no lleva coma ni punto antes.`,
    ],
    coord: [
      `Put a comma before ${q} when it joins two complete sentences, and no comma after it.`,
      `Pon una coma antes de ${q} cuando une dos oraciones completas, y ninguna coma después.`,
    ],
    adverb: [
      `Use a semicolon before ${q} and a comma after it.`,
      `Usa punto y coma antes de ${q} y una coma después.`,
    ],
    starter: [
      `Start a new sentence with ${Q} and put a comma after it.`,
      `Empieza una oración nueva con ${Q} y pon una coma después.`,
    ],
    lead: [
      `When a sentence starts with ${Q}, put a comma after the opening part.`,
      `Cuando una oración empieza con ${Q}, pon una coma después de la parte inicial.`,
    ],
  }[type];
}

/** The two clauses with the connector gap (or the picked connector) in place. */
export function clauseHTML(r, word) {
  const gap = word
    ? html`<span class="cc-gap is-filled">${r.pos === "start" ? cap(word) : word}</span>`
    : html`<span class="cc-gap" aria-label="blank">?</span>`;
  if (r.pos === "start")
    return html`<p class="cc-clauses">
      ${gap} <span class="cc-clause">${r.a}</span>, <span class="cc-clause">${r.b}</span>.
    </p>`;
  return html`<p class="cc-clauses">
    <span class="cc-clause">${cap(r.a)}</span> ${gap} <span class="cc-clause">${r.b}</span>.
  </p>`;
}

/** One connector card. `grouped` shows the relationship color and the Spanish gloss outright. */
function card(o, i, r, env, grouped) {
  const locked = r.rs.status === "right" || r.rs.status === "revealed";
  const cls = [
    "gs-choice",
    "cc-card",
    grouped ? `cc-rel-${o.rel}` : "",
    r.pick === i ? "is-sel" : "",
    locked && i === r.ans ? "is-right" : "",
    r.rs.picks.includes(i) && i !== r.ans ? "is-miss" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const gloss = grouped
    ? html`<span class="gs-gloss cc-gloss" lang="es">${o.es}</span>`
    : glossHTML(o.es, env);
  return html`<span class="cc-card-wrap"
    ><button
      type="button"
      class="${cls}"
      data-g-conn="${i}"
      aria-pressed="${r.pick === i}"
      ${locked ? "disabled" : ""}
    >
      <span class="cc-card-w">${o.id}</span></button
    >${gloss}</span
  >`;
}

/** The connector rack: grouped by relationship (Starting, or after opening the guide) or one flat row. */
export function rackHTML(r, env, grouped) {
  const I = env.I;
  if (!grouped)
    return html`<div
      class="cc-rack"
      role="group"
      aria-label="${I.S("Connector cards", "Tarjetas de conectores")}"
    >
      ${r.opts.map((o, i) => card(o, i, r, env, false))}
    </div>`;
  const groups = REL_ORDER.filter((rel) => r.opts.some((o) => o.rel === rel));
  return html`<div
    class="cc-rack is-grouped"
    role="group"
    aria-label="${I.S("Connector cards grouped by relationship", "Tarjetas de conectores agrupadas por relación")}"
  >
    ${groups.map(
      (rel) =>
        html`<div class="cc-group cc-rel-${rel}">
          <p class="cc-group-h">${I.T(...RELS[rel].name)}</p>
          ${r.opts.map((o, i) => (o.rel === rel ? card(o, i, r, env, true) : ""))}
        </div>`,
    )}
  </div>`;
}

/** A paragraph line with its connector marked (color-coded when grouped help is on). */
export function lineHTML(line, grouped) {
  if (!line.conn) return html`<span>${line.text}</span>`;
  const at = line.text.indexOf(line.conn);
  if (at < 0) return html`<span>${line.text}</span>`;
  const cls = grouped && line.rel ? `cc-mark cc-rel-${line.rel}` : "cc-mark";
  return html`<span
    >${line.text.slice(0, at)}<mark class="${cls}">${line.conn}</mark
    >${line.text.slice(at + line.conn.length)}</span
  >`;
}

/** The cliff: one hold per round, the climber standing on the last finished hold. */
export function cliffSVG(states, band, label) {
  const total = states.length;
  const done = states.filter((st) => st !== "open").length;
  const story = band !== "6-8";
  const line = story
    ? `stroke="${C.navy}" stroke-width="2.5" stroke-linejoin="round"`
    : 'stroke="none"';
  const holdAt = (i) => ({ x: i % 2 ? 128 : 78, y: 232 - ((i + 1) * 196) / total });
  const holds = states
    .map((st, i) => {
      const { x, y } = holdAt(i);
      const fill = st === "right" ? C.gold : st === "revealed" ? C.skyLt : "#ffffff";
      const ring =
        i === done
          ? `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${C.coralDk}" stroke-width="2.5" stroke-dasharray="4 4"/>`
          : "";
      return `${ring}<path d="M${x - 9} ${y + 4}Q${x} ${y - 10} ${x + 9} ${y + 4}Z" fill="${fill}" ${story ? `stroke="${C.navy}" stroke-width="2"` : `stroke="${C.stoneDk}" stroke-width="1.5"`}/>`;
    })
    .join("");
  const at = done ? holdAt(done - 1) : { x: 100, y: 250 };
  const cx = at.x;
  const cy = at.y - 6;
  const climber = `<g class="cc-climber" transform="translate(${cx} ${cy})"><line x1="0" y1="-30" x2="${100 - cx}" y2="${10 - cy}" stroke="${C.coralDk}" stroke-width="2" stroke-dasharray="3 3"/><circle cx="0" cy="-26" r="7" fill="${C.sand}" ${line}/><path d="M-7 -30q7 -9 14 0z" fill="${C.coral}"/><rect x="-7" y="-19" width="14" height="16" rx="5" fill="${C.teal}" ${line}/><rect x="-11" y="-18" width="6" height="12" rx="2" fill="${C.goldDk}"/><path d="M-5 -3l-4 10M5 -3l4 10" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/><path d="M7 -15l8 -9" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/></g>`;
  const body = `<rect width="200" height="260" fill="${C.skyLt}"/><circle cx="168" cy="34" r="16" fill="${C.gold}"/>
    <path d="M40 260L52 120L70 60L96 14L132 30L150 90L164 170L176 260Z" fill="${C.stone}" ${line}/>
    <path d="M96 14L88 40L104 34L114 50L132 30Z" fill="#fff"/><path d="M60 150l14 6M140 120l-12 8M150 200l-14 4M66 210l12 -4" stroke="${C.stoneDk}" stroke-width="2" stroke-linecap="round"/>
    <g transform="translate(100 12)"><path d="M0 0v-12" stroke="${C.navy}" stroke-width="2"/><path d="M0 -12l14 4l-14 5Z" fill="${C.coral}"/></g>
    <path d="M0 252h200v8H0Z" fill="${C.leaf}"/>${holds}${climber}`;
  return svg("0 0 200 260", body, { cls: "cc-cliff-svg", label });
}

export { raw };
