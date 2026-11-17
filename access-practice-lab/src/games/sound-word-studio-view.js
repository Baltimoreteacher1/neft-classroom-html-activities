// Sound & Word Studio: the three mixer screens (build the syllables, find the beat, read it aloud).
// Pure markup from the round state; the game logic lives in sound-word-studio.js.
import { audioBtn, feedbackHTML, glossHTML, hintHTML, html, icon, settled } from "./engine.js";

export const TYPES = {
  closed: ["closed", "cerrada"],
  open: ["open", "abierta"],
  "vowel-team": ["vowel team", "equipo de vocales"],
  "r-controlled": ["r-controlled", "controlada por r"],
  "silent-e": ["silent e", "e muda"],
  "consonant-le": ["consonant + le", "consonante + le"],
};

const stressed = (c) => c.syl.map((x, k) => (k === c.stress ? x.toUpperCase() : x)).join("-");

const resultLine = (rs, right, shown) =>
  html`<p class="sw-result is-${rs.status === "right" ? "right" : "shown"}" role="status">
    ${icon(rs.status === "right" ? "check" : "sparkle")}${rs.status === "right" ? right : shown}
  </p>`;

const meter = (on, big) =>
  html`<span class="sw-meter${on ? " is-on" : ""}${big ? " is-big" : ""}" aria-hidden="true"
    >${[1, 2, 3, 4, 5].map((n) => html`<i style="--h:${n}"></i>`)}</span
  >`;

export function buildHTML(c, row, env) {
  const I = env.I;
  const tracks = row.tracks.map((t, k) => {
    const has = t !== null;
    const lit = row.lit[k];
    const state =
      lit === true
        ? I.S("lit", "encendida")
        : lit === false
          ? I.S("not lit, revise", "apagada, revisa")
          : "";
    const label = has
      ? I.S(
          `Track ${k + 1}: ${row.pads[t]}${state ? `, ${state}` : ""}. Tap to clear.`,
          `Pista ${k + 1}: ${row.pads[t]}${state ? `, ${state}` : ""}. Toca para vaciarla.`,
        )
      : I.S(
          `Track ${k + 1}: empty. Drop a syllable here.`,
          `Pista ${k + 1}: vacía. Suelta una sílaba aquí.`,
        );
    return html`<li class="sw-track${lit === true ? " is-lit" : lit === false ? " is-off" : ""}">
      <span class="sw-trk" aria-hidden="true">TRK ${k + 1}</span>
      <button
        type="button"
        class="sw-slot${has ? " is-filled" : ""}"
        data-drop="${k}"
        data-sw-track="${k}"
        aria-label="${label}"
      >
        <span aria-hidden="true">${has ? row.pads[t] : "· · ·"}</span>
      </button>
      ${meter(lit === true)}
      <span class="sw-led" aria-hidden="true"
        >${lit === true ? "✓" : lit === false ? "✗" : ""}</span
      >
    </li>`;
  });
  const pads = row.pads.map((x, i) => {
    const used = row.tracks.includes(i);
    return html`<li>
      <button
        type="button"
        class="sw-pad${used ? " is-used" : ""}"
        data-sw-pad="${i}"
        data-drag="${i}"
        aria-pressed="false"
        ${used ? "disabled" : ""}
        aria-label="${used ? I.S(`${x}, on a track`, `${x}, en una pista`) : I.S(`Syllable pad ${x}`, `Pad de sílaba ${x}`)}"
      >
        ${x}
      </button>
    </li>`;
  });
  const full = row.tracks.every((x) => x !== null);
  const any = row.tracks.some((x) => x !== null);
  const lit = row.lit.filter((x) => x === true).length;
  return html`<div class="sw-deck">
    <p class="gs-prompt">
      ${I.T("Listen, then build the word one syllable per track. Tap a pad, or drag it onto a track.", "Escucha y luego forma la palabra con una sílaba por pista. Toca un pad o arrástralo a una pista.")}
    </p>
    <ol
      class="sw-tracks"
      aria-label="${I.S(`Mixer: ${row.n} tracks`, `Mezclador: ${row.n} pistas`)}"
    >
      ${tracks}
    </ol>
    <ul class="sw-pads" aria-label="${I.S("Syllable pads", "Pads de sílabas")}">
      ${pads}
    </ul>
    <div class="se-tools sw-tools">
      <button type="button" class="btn btn-primary" data-g-check ${full ? "" : "disabled"}>
        ${icon("play")}${I.T("Play the mix", "Reproducir la mezcla")}
      </button>
      <button type="button" class="btn small" data-sw-clear ${any ? "" : "disabled"}>
        ${icon("retry")}${I.T("Clear tracks", "Vaciar pistas")}
      </button>
    </div>
    ${hintHTML(row.rs, buildHints(c, I), env)}
    ${feedbackHTML(row.rs, {
      I,
      right: I.T(
        `Every track is lit: ${c.syl.join("-")}.`,
        `Todas las pistas están encendidas: ${c.syl.join("-")}.`,
      ),
      retry: I.T(
        `${lit} of ${row.n} tracks lit. Keep the lit ones and change the tracks marked ✗.`,
        `${lit} de ${row.n} pistas encendidas. Deja las encendidas y cambia las marcadas con ✗.`,
      ),
      answer: I.T(
        `The syllables are ${c.syl.join("-")}. The producer set the tracks for you.`,
        `Las sílabas son ${c.syl.join("-")}. La productora acomodó las pistas por ti.`,
      ),
    })}
  </div>`;
}

function buildHints(c, I) {
  const first = c.syl[0];
  return [
    I.T(c.hint.en, c.hint.es),
    I.T(
      "Clap the word slowly. Each clap is one syllable, and every syllable has one vowel sound.",
      "Aplaude la palabra despacio. Cada aplauso es una sílaba y cada sílaba tiene un sonido vocal.",
    ),
    I.T(
      `The first syllable has ${first.length} letter${first.length > 1 ? "s" : ""}.`,
      `La primera sílaba tiene ${first.length} letra${first.length > 1 ? "s" : ""}.`,
    ),
  ];
}

export function beatHTML(c, row, env) {
  const I = env.I;
  const done = settled(row.beat);
  const beats = c.syl.map(
    (x, k) =>
      html`<li class="sw-track is-lit${row.pick === k ? " is-picked" : ""}">
        <span class="sw-trk" aria-hidden="true">TRK ${k + 1}</span>
        <button type="button" class="sw-beat" data-sw-beat="${k}" aria-pressed="${row.pick === k}">
          ${x}
        </button>
        ${meter(true, row.pick === k)}
      </li>`,
  );
  return html`<div class="sw-deck">
    ${resultLine(row.rs, I.T(`Every track lit: ${c.syl.join("-")}.`, `Todas las pistas encendidas: ${c.syl.join("-")}.`), I.T(`Tracks set by the producer: ${c.syl.join("-")}.`, `Pistas acomodadas por la productora: ${c.syl.join("-")}.`))}
    <p class="gs-prompt">
      ${I.T("Find the strong beat. Play the word again: which syllable is longest and loudest? Tap its track.", "Busca el golpe fuerte. Escucha la palabra otra vez: ¿qué sílaba es la más larga y fuerte? Toca su pista.")}
    </p>
    <ol
      class="sw-tracks"
      aria-label="${I.S("Choose the stressed syllable", "Elige la sílaba acentuada")}"
    >
      ${beats}
    </ol>
    <div class="se-tools sw-tools">
      <button
        type="button"
        class="btn btn-primary"
        data-g-check
        ${row.pick === null || done ? "disabled" : ""}
      >
        ${icon("check")}${I.T("Lock the beat", "Fijar el ritmo")}
      </button>
    </div>
    ${hintHTML(row.beat, beatHints(I), env)}
    ${feedbackHTML(row.beat, {
      I,
      retry: I.T(
        "That syllable is a quick, light beat. Play the word again and try another track.",
        "Esa sílaba es un golpe rápido y suave. Escucha la palabra otra vez y prueba otra pista.",
      ),
      answer: I.T(
        `The strong beat is on ${c.syl[c.stress]}.`,
        `El golpe fuerte está en ${c.syl[c.stress]}.`,
      ),
    })}
  </div>`;
}

const beatHints = (I) => [
  I.T(
    "Say the word out loud. The strong syllable sounds a little longer and louder than the others.",
    "Di la palabra en voz alta. La sílaba fuerte suena un poco más larga y más fuerte que las demás.",
  ),
  I.T(
    "Put your hand under your chin and say the word. Your jaw drops lowest on the strong syllable.",
    "Pon la mano debajo de la barbilla y di la palabra. La mandíbula baja más en la sílaba fuerte.",
  ),
  I.T(
    "Say the word with the beat on each syllable in turn. Only one way sounds like the recording.",
    "Di la palabra con el golpe en cada sílaba, una por una. Solo una forma suena como la grabación.",
  ),
];

export function readHTML(c, row, env, s) {
  const I = env.I;
  return html`<div class="sw-deck">
    ${resultLine(row.beat, I.T(`Beat locked on ${c.syl[c.stress].toUpperCase()}.`, `Ritmo fijado en ${c.syl[c.stress].toUpperCase()}.`), I.T(`The strong beat is on ${c.syl[c.stress].toUpperCase()}.`, `El golpe fuerte está en ${c.syl[c.stress].toUpperCase()}.`))}
    <div class="sw-read" aria-labelledby="sw-read-h">
      <p class="sw-read-k">${icon("speaking")}${I.T("Read it aloud", "Léela en voz alta")}</p>
      <h3 id="sw-read-h" class="sw-read-word" aria-label="${c.word}: ${stressed(c)}">
        ${c.syl.map((x, k) => html`${k ? html`<span class="sw-dot" aria-hidden="true">·</span>` : ""}${k === c.stress ? html`<strong class="sw-stress">${x.toUpperCase()}</strong>` : html`<span>${x}</span>`}`)}
      </h3>
      <div class="sw-read-say">
        ${audioBtn(c.word, I, I.S("Hear it once more", "Escúchala otra vez"))}${glossHTML(c.es, env)}
      </div>
      ${
        c.types
          ? html`<ul class="sw-types" aria-label="${I.S("Syllable types", "Tipos de sílabas")}">
              ${c.syl.map((x, k) => html`<li><strong>${x}</strong> ${I.T(TYPES[c.types[k]][0], TYPES[c.types[k]][1])}</li>`)}
            </ul>`
          : ""
      }
      <p class="sw-notes">
        <span class="sw-notes-k">${I.T("Studio notes", "Notas del estudio")}</span>
        ${I.T(c.explain.en, c.explain.es)}
      </p>
      <button
        type="button"
        class="btn sw-said${row.said ? " is-on" : ""}"
        data-sw-said
        aria-pressed="${row.said}"
      >
        ${icon(row.said ? "check" : "speaking")}${row.said ? I.T("I read it aloud. Nice!", "La leí en voz alta. ¡Bien!") : I.T("I read it aloud", "La leí en voz alta")}
      </button>
    </div>
    <div class="gs-actions">
      <button type="button" class="btn btn-primary btn-big" data-g-next>
        ${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Finish the session", "Terminar la sesión") : I.T("Next track", "Siguiente pista")}
      </button>
    </div>
  </div>`;
}
