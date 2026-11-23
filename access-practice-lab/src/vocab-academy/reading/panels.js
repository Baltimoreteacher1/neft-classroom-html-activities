// Vocabulary Academy reader — the markup of the three moves (Before, During, After). Builds strings only; every learner
// string is bilingual [en, es] and escaped. Events and state changes are in player.js (data-var-* attributes).
import { esc, toHtml } from "../../util.js";
import { wordHref } from "../data.js";
import { MISS_TEXT, playableClues } from "./clues.js";
import {
  MISS_CHOICE,
  MISS_EVIDENCE,
  RIGHT_TEXT,
  allAnswered,
  isTapEvidence,
  spotSummary,
} from "./flow.js";
import { MARKS, markOf, noteOf } from "./marks.js";
import { clueText, markText, textHTML } from "./render.js";
import { SPEEDS } from "./tts.js";
import { sentenceSpans, wordsMet } from "./text.js";

const t = (I, en, es) => toHtml(I.T(en, es));
const s = (I, en, es) => esc(I.S(en, es));
const pressed = (on) => `aria-pressed="${on ? "true" : "false"}"`;
const LETTERS = "ABCDEFGH";

export const STEPS = [
  { id: "before", n: 1, label: ["Before you read", "Antes de leer"] },
  { id: "during", n: 2, label: ["Read", "Leer"] },
  { id: "after", n: 3, label: ["After you read", "Después de leer"] },
];

export function stepperHTML(R) {
  const { I, ui } = R;
  const steps = R.lessonMode ? STEPS.slice(0, 2) : STEPS;
  return `<nav class="var-steps" aria-label="${s(I, "Reading steps", "Pasos de la lectura")}"><ol>${steps
    .map(
      (x) =>
        `<li><button type="button" class="var-step" data-var-step="${x.id}"${ui.step === x.id ? ' aria-current="step"' : ""}><span class="var-step-n" aria-hidden="true">${x.n}</span> ${t(I, ...x.label)}</button></li>`,
    )
    .join("")}</ol></nav>`;
}

const genreName = (g) => String(g || "").replace(/^./, (c) => c.toUpperCase());

export function headerHTML(R) {
  const { I, reading } = R;
  return `<header class="var-head"><p class="eyebrow">${R.label ? t(I, ...R.label) : ""} · <span lang="en">${esc(genreName(reading.genre))}</span></p><h1 id="varTitle" tabindex="-1" lang="en">${esc(reading.title)}</h1>${reading.purpose ? `<p class="va-lead" lang="en">${esc(reading.purpose)}</p>` : ""}</header>`;
}

// ── Before ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function beforeHTML(R) {
  const { I, words, state, reading } = R;
  const picked = new Set(state.spot);
  return `<section class="var-card" aria-labelledby="varSpotH">
      <h2 id="varSpotH" tabindex="-1">${t(I, "Spot the words", "Encuentra las palabras")}</h2>
      <p>${t(I, "Tap the lesson words you think you will meet in this reading. There is no wrong answer. You will see how many you spotted at the end.", "Toca las palabras de la lección que crees que vas a encontrar en esta lectura. No hay respuestas incorrectas. Al final verás cuántas encontraste.")}</p>
      <ul class="var-chips" role="group" aria-label="${s(I, "Lesson words", "Palabras de la lección")}">${words
        .map(
          (w) =>
            `<li><button type="button" class="var-chip" data-var-spot="${esc(w.id)}" ${pressed(picked.has(w.id))}><span lang="en">${esc(w.hw)}</span>${picked.has(w.id) ? ' <span aria-hidden="true">✓</span>' : ""}</button></li>`,
        )
        .join("")}</ul>
      <p class="fine" role="status" aria-live="polite" data-var-spot-live>${spotLive(R)}</p>
    </section>
    <section class="var-card" aria-labelledby="varPredH">
      <h2 id="varPredH">${t(I, "Make a prediction (optional)", "Haz una predicción (opcional)")}</h2>
      <label for="varPred">${t(I, `The title is “${reading.title}”. What do you think this reading will be about?`, `El título es “${reading.title}”. ¿De qué crees que trata esta lectura?`)}</label>
      <textarea id="varPred" class="var-text-in" rows="2" maxlength="300" data-var-pred>${esc(state.pred)}</textarea>
      <p class="fine">${t(I, "Only on this device. It is not graded.", "Solo en este dispositivo. No se califica.")}</p>
    </section>
    <p class="va-actions"><button type="button" class="btn btn-primary va-btn" data-var-step="during">${t(I, "Start reading", "Empezar a leer")}</button></p>`;
}
export const spotLive = (R) =>
  R.state.spot.length
    ? R.I.S(
        `You picked ${R.state.spot.length} ${R.state.spot.length === 1 ? "word" : "words"}.`,
        `Elegiste ${R.state.spot.length} ${R.state.spot.length === 1 ? "palabra" : "palabras"}.`,
      )
    : "";

// ── During ──────────────────────────────────────────────────────────────────────────────────────────────────────
function readAlongHTML(R) {
  const { I, ui } = R;
  if (!R.ra?.supported)
    return `<p class="fine var-nospeech">${t(I, "This device cannot read aloud. The text is below.", "Este dispositivo no puede leer en voz alta. El texto está abajo.")}</p>`;
  const st = ui.speak.state;
  const speedName = (v) =>
    v < 1
      ? I.S("Slower", "Más lento")
      : v > 1
        ? I.S("Faster", "Más rápido")
        : I.S("Normal", "Normal");
  return `<div class="var-bar" role="group" aria-label="${s(I, "Read aloud", "Lectura en voz alta")}">
      ${
        st === "playing"
          ? `<button type="button" class="btn va-btn" data-var-ra="pause"><span aria-hidden="true">⏸</span> ${t(I, "Pause", "Pausar")}</button>`
          : `<button type="button" class="btn btn-primary va-btn" data-var-ra="play"><span aria-hidden="true">🔊</span> ${st === "paused" ? t(I, "Keep listening", "Seguir escuchando") : t(I, "Listen", "Escuchar")}</button>`
      }
      <button type="button" class="btn va-btn" data-var-ra="stop" ${st === "idle" ? 'aria-disabled="true"' : ""}><span aria-hidden="true">⏹</span> ${t(I, "Stop", "Detener")}</button>
      <span class="var-speed" role="group" aria-label="${s(I, "Reading speed", "Velocidad de lectura")}">${SPEEDS.map(
        (v) =>
          `<button type="button" class="btn va-btn var-speed-b" data-var-speed="${v}" ${pressed(ui.speak.rate === v)}>${esc(speedName(v))} <span class="fine">${v}×</span></button>`,
      ).join("")}</span>
    </div>`;
}

function modesHTML(R) {
  const { I, ui } = R;
  const mode = (id, en, es) =>
    `<button type="button" class="btn va-btn var-mode" data-var-mode="${id}" ${pressed(ui.view === id)}>${t(I, en, es)}</button>`;
  return `<div class="var-modes" role="group" aria-label="${s(I, "How do you want to read?", "¿Cómo quieres leer?")}">
      ${mode("read", "Read", "Leer")}${mode("clue", "Find the clue", "Busca la pista")}${mode("marks", "Highlight and notes", "Resaltar y notas")}
      <span class="var-opts"><button type="button" class="btn va-btn" data-var-opt="chunk" ${pressed(ui.chunk)}>${t(I, "One paragraph at a time", "Un párrafo a la vez")}</button>
      <button type="button" class="btn va-btn" data-var-opt="large" ${pressed(ui.large)}>${t(I, "Large text", "Texto grande")}</button></span>
    </div>`;
}

export function clueMsgHTML(R) {
  const { I, ui, words } = R;
  const m = ui.clueMsg || { k: "pick" };
  const hw = (id) => words.find((w) => w.id === id)?.hw || "";
  switch (m.k) {
    case "selected":
      return t(
        I,
        `Step 2: tap a word in the part of the text that helps you understand “${hw(m.word)}”.`,
        `Paso 2: toca una palabra de la parte del texto que te ayuda a entender “${hw(m.word)}”.`,
      );
    case "found": {
      const c = clueText(I, m.type);
      return `${t(I, `You found it: a clue for “${hw(m.word)}”.`, `La encontraste: una pista para “${hw(m.word)}”.`)} <strong>${esc(c.glyph)} ${esc(c.label)}.</strong> ${esc(c.hint)}`;
    }
    case "again":
      return t(
        I,
        "You already found that clue. Pick another word.",
        "Ya encontraste esa pista. Elige otra palabra.",
      );
    case "miss":
      return t(I, ...MISS_TEXT);
    case "no-clue":
      return t(
        I,
        "That word has no clue to find in this reading. Try a word marked ◇.",
        "Esa palabra no tiene una pista que encontrar en esta lectura. Prueba con una palabra marcada con ◇.",
      );
    case "the-word":
      return t(
        I,
        "That is the word itself. Tap the part of the text that explains it.",
        "Esa es la palabra misma. Toca la parte del texto que la explica.",
      );
    case "all":
      return t(
        I,
        "You found every clue in this reading.",
        "Encontraste todas las pistas de esta lectura.",
      );
    default:
      return t(
        I,
        "Step 1: tap a lesson word marked ◇. Then find the part of the text that explains it.",
        "Paso 1: toca una palabra de la lección marcada con ◇. Luego busca la parte del texto que la explica.",
      );
  }
}

function clueTrayHTML(R) {
  const { I, reading, ui } = R;
  const playable = playableClues(reading.paras, reading.clues);
  if (!playable.length)
    return `<section class="var-tray"><p>${t(I, "This reading has no clues to find. Use Read or Highlight and notes.", "Esta lectura no tiene pistas que encontrar. Usa Leer o Resaltar y notas.")}</p></section>`;
  const found = ui.clue.found;
  const list = found
    .map((i) => reading.clues[i])
    .filter(Boolean)
    .map((c) => {
      const w = R.words.find((x) => x.id === c.word);
      const l = clueText(I, c.type);
      return `<li><span class="var-cbadge" data-ct="${esc(c.type)}"><span aria-hidden="true">${esc(l.glyph)}</span> ${esc(l.label)}</span> <strong lang="en">${esc(w?.hw || "")}</strong>: <q lang="en">${esc(c.text)}</q></li>`;
    })
    .join("");
  return `<section class="var-tray" aria-labelledby="varClueH">
      <h2 id="varClueH" class="var-h3">${t(I, "Find the clue", "Busca la pista")}</h2>
      <p class="var-hint" role="status" aria-live="polite" data-var-live>${clueMsgHTML(R)}</p>
      <p class="fine">${t(I, `Clues found: ${found.length} of ${playable.length}`, `Pistas encontradas: ${found.length} de ${playable.length}`)}${ui.clue.target ? ` · <button type="button" class="btn var-link" data-var-clue-clear>${t(I, "Choose a different word", "Elegir otra palabra")}</button>` : ""}</p>
      <p class="fine var-keys">${t(I, "With a keyboard: use the arrow keys to move between words, and Enter to tap.", "Con teclado: usa las flechas para moverte entre palabras y Enter para tocar.")}</p>
      ${list ? `<ul class="var-found">${list}</ul>` : ""}
    </section>`;
}

const excerpt = (text, n = 70) => {
  const x = String(text).replace(/\s+/g, " ").trim();
  return x.length > n ? `${x.slice(0, n - 1)}…` : x;
};
export const sentenceText = (reading, p, si) =>
  sentenceSpans(reading.paras[p] || "")[si]?.text || "";

export function marksListHTML(R) {
  const { I, reading, state } = R;
  const all = [
    ...state.hl.map((h) => ({ p: h.p, s: h.s })),
    ...state.notes.map((n) => ({ p: n.p, s: n.s })),
  ];
  const keys = [...new Set(all.map((x) => `${x.p}:${x.s}`))]
    .map((k) => k.split(":").map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const list = keys
    .map(([p, si]) => {
      const m = markOf(state, p, si);
      const n = noteOf(state, p, si);
      const label = m
        ? `<span class="var-mk" data-k="${m}"><span aria-hidden="true">${esc(markText(I, m)[1])}</span> ${esc(markText(I, m)[0])}</span>`
        : `<span class="var-nk"><span aria-hidden="true">✎</span> ${t(I, "Note", "Nota")}</span>`;
      return `<li>${label} <span class="fine">${t(I, "Paragraph", "Párrafo")} ${p + 1}</span> <q lang="en">${esc(excerpt(sentenceText(reading, p, si)))}</q>${n ? `<br><span class="var-note-t">${esc(n)}</span>` : ""} <button type="button" class="btn var-link" data-var-unmark="${p}:${si}">${t(I, "Remove", "Quitar")}</button></li>`;
    })
    .join("");
  return list ? `<h3 class="var-h3">${t(I, "My marks and notes", "Mis marcas y notas")}</h3><ul class="var-found">${list}</ul>` : "";
}

function sentenceToolsHTML(R) {
  const { I, reading, ui, state } = R;
  const sel = ui.sel;
  const mk = sel ? markOf(state, sel.p, sel.s) : "";
  const note = sel ? noteOf(state, sel.p, sel.s) : "";
  const marksB = MARKS.map((k) => {
    const [label, glyph] = markText(I, k);
    return `<button type="button" class="btn va-btn var-markb" data-var-mark="${k}" data-k="${k}" ${pressed(mk === k)} ${sel ? "" : 'aria-disabled="true"'}><span aria-hidden="true">${esc(glyph)}</span> ${esc(label)}</button>`;
  }).join("");
  return `<section class="var-tray" aria-labelledby="varMarkH">
      <h2 id="varMarkH" class="var-h3">${t(I, "Highlight and notes", "Resaltar y notas")}</h2>
      <p class="var-hint" role="status" aria-live="polite" data-var-live>${sel ? `${t(I, "Sentence", "Oración")} <q lang="en">${esc(excerpt(sentenceText(reading, sel.p, sel.s), 90))}</q>` : t(I, "Tap a sentence in the text, or use Next sentence, to choose one to mark.", "Toca una oración del texto, o usa Oración siguiente, para elegir una y marcarla.")}</p>
      <div class="var-stools" role="group" aria-label="${s(I, "Sentence tools", "Herramientas de oración")}">
        <button type="button" class="btn va-btn" data-var-sent="prev">${t(I, "Previous sentence", "Oración anterior")}</button>
        <button type="button" class="btn va-btn" data-var-sent="next">${t(I, "Next sentence", "Oración siguiente")}</button>
        <button type="button" class="btn va-btn" data-var-hear ${sel && R.ra?.supported ? "" : 'aria-disabled="true"'}><span aria-hidden="true">🔊</span> ${t(I, "Hear from here", "Escuchar desde aquí")}</button>
      </div>
      <div class="var-stools" role="group" aria-label="${s(I, "Mark this sentence", "Marcar esta oración")}">${marksB}</div>
      <label for="varNote">${t(I, "My note about this sentence (optional)", "Mi nota sobre esta oración (opcional)")}</label>
      <textarea id="varNote" class="var-text-in" rows="2" maxlength="240" data-var-note ${sel ? "" : "disabled"}>${esc(note)}</textarea>
      <p class="fine">${t(I, "Marks and notes stay on this device.", "Las marcas y notas se quedan en este dispositivo.")}</p>
      <div data-var-marklist>${marksListHTML(R)}</div>
    </section>`;
}

export function duringHTML(R) {
  const { I, ui, reading } = R;
  const view = ui.view === "clue" ? "clue" : "read";
  const tray =
    ui.view === "clue" ? clueTrayHTML(R) : ui.view === "marks" ? sentenceToolsHTML(R) : "";
  const only = ui.chunk ? ui.para : null;
  const total = reading.paras.length;
  const nav = ui.chunk
    ? `<nav class="var-pnav" aria-label="${s(I, "Paragraphs", "Párrafos")}"><button type="button" class="btn va-btn" data-var-para="prev" ${ui.para === 0 ? 'aria-disabled="true"' : ""}>${t(I, "Back", "Atrás")}</button><span aria-live="polite">${t(I, `Paragraph ${ui.para + 1} of ${total}`, `Párrafo ${ui.para + 1} de ${total}`)}</span><button type="button" class="btn va-btn" data-var-para="next" ${ui.para >= total - 1 ? 'aria-disabled="true"' : ""}>${t(I, "Next", "Siguiente")}</button></nav>`
    : "";
  const early = R.early
    ? `<p class="var-hint">${t(I, "Listen first. Tap Listen, then read along with the words.", "Escucha primero. Toca Escuchar y lee junto con las palabras.")}</p>`
    : "";
  const foot = R.lessonMode
    ? `<p class="va-actions"><button type="button" class="btn btn-primary va-btn" data-var-lesson-done aria-pressed="${R.lessonDone ? "true" : "false"}">${R.lessonDone ? "✓ " : ""}${t(I, "I finished reading", "Terminé de leer")}</button>${R.fullHref ? ` <a class="btn va-btn" href="${esc(R.fullHref)}">${t(I, "Open in the Reading Library (notes and questions)", "Abrir en la Biblioteca de lecturas (notas y preguntas)")}</a>` : ""}</p>`
    : `<p class="va-actions"><button type="button" class="btn btn-primary va-btn" data-var-step="after">${t(I, "Go to the questions", "Ir a las preguntas")}</button></p>`;
  return `${readAlongHTML(R)}${modesHTML(R)}${early}${tray}
    <div class="var-text${ui.large ? " is-large" : ""}${ui.view === "clue" ? " is-clue" : ""}" data-var-text aria-label="${s(I, "The reading", "La lectura")}" role="region">${textHTML(R, view, only)}</div>
    ${nav}${foot}`;
}

// ── After ───────────────────────────────────────────────────────────────────────────────────────────────────────
function choiceHTML(R, q) {
  const { I, ui } = R;
  const right = ui.q.right;
  return `<div class="var-choices" role="group" aria-labelledby="varQ">${q.choices
    .map((c, k) => {
      const tried = ui.q.tried.includes(k);
      const isRight = right && k === q.a;
      return `<button type="button" class="var-choice" data-var-choice="${k}" data-state="${isRight ? "right" : tried ? "tried" : ""}" ${right ? 'aria-disabled="true"' : ""}><span class="var-cl" aria-hidden="true">${LETTERS[k]}</span><span lang="en">${esc(c)}</span>${isRight ? ` <span class="var-ct">✓ ${t(I, "Right", "Correcto")}</span>` : tried ? ` <span class="var-ct">✕ ${t(I, "Not this one", "Esta no")}</span>` : ""}</button>`;
    })
    .join("")}</div>`;
}

export function questionHTML(R) {
  const { I, reading, ui } = R;
  const i = ui.q.i;
  const q = reading.qs[i];
  const tap = isTapEvidence(q, reading.paras);
  const fb = ui.q.right
    ? `<p class="var-fb is-right"><strong>${t(I, ...RIGHT_TEXT)}</strong> ${q.why ? `<span lang="en">${esc(q.why)}</span>` : ""}</p>`
    : ui.q.tried.length || ui.q.tapped.length
      ? `<p class="var-fb is-retry">${t(I, ...(tap ? MISS_EVIDENCE : MISS_CHOICE))}</p>`
      : "";
  const last = i >= reading.qs.length - 1;
  const text = tap ? textHTML(R, "tap") : null;
  return `<section class="var-card var-q" aria-labelledby="varQ">
      <p class="fine">${t(I, `Question ${i + 1} of ${reading.qs.length}`, `Pregunta ${i + 1} de ${reading.qs.length}`)}</p>
      <h2 id="varQ" tabindex="-1" lang="en">${esc(q.q)}</h2>
      ${tap ? `<p>${t(I, "Tap the sentence in the text that proves it.", "Toca la oración del texto que lo demuestra.")}</p>` : choiceHTML(R, q)}
      <div role="status" aria-live="polite" data-var-fb>${fb}</div>
      ${text ? `<div class="var-text${ui.large ? " is-large" : ""}" data-var-text role="group" aria-label="${s(I, "Tap a sentence", "Toca una oración")}">${text}</div>` : ""}
      <p class="va-actions">
        <button type="button" class="btn va-btn" data-var-where="${q.para ?? 0}">${t(I, "Show me where in the text", "Muéstrame dónde en el texto")}</button>
        ${ui.q.right ? `<button type="button" class="btn btn-primary va-btn" data-var-qnext>${last ? t(I, "Go on", "Continuar") : t(I, "Next question", "Siguiente pregunta")}</button>` : ""}
      </p>
    </section>`;
}

export function retellHTML(R) {
  const { I, reading, state } = R;
  const start = state.retell || reading.retellFrame || "";
  return `<section class="var-card" aria-labelledby="varRetellH">
      <h2 id="varRetellH" tabindex="-1">${t(I, "Retell in your own words", "Cuenta con tus propias palabras")}</h2>
      <label for="varRetell">${reading.retellFrame ? t(I, "Finish the sentence, then say more. Use your own words.", "Termina la oración y di más. Usa tus propias palabras.") : t(I, "What happened or what did you learn? Use your own words.", "¿Qué pasó o qué aprendiste? Usa tus propias palabras.")}</label>
      <textarea id="varRetell" class="var-text-in" rows="4" maxlength="1200" data-var-retell>${esc(start)}</textarea>
      <p class="fine">${t(I, "Only on this device. It is not graded. You can say it out loud to a partner instead.", "Solo en este dispositivo. No se califica. Puedes decirlo en voz alta a un compañero.")}</p>
    </section>`;
}

export function metHTML(R) {
  const { I, reading, words, state } = R;
  const ids = wordsMet(reading.paras, words);
  const sp = spotSummary(ids, state.spot);
  const spot = state.spot.length
    ? t(
        I,
        `You spotted ${sp.hit} of the ${sp.total} lesson words in this reading.${sp.extra ? ` ${sp.extra} you picked did not show up this time. That is fine.` : ""}`,
        `Encontraste ${sp.hit} de las ${sp.total} palabras de la lección en esta lectura.${sp.extra ? ` ${sp.extra} de las que elegiste no aparecieron esta vez. Está bien.` : ""}`,
      )
    : t(
        I,
        `This reading uses ${ids.length} of the lesson words.`,
        `Esta lectura usa ${ids.length} de las palabras de la lección.`,
      );
  return `<section class="var-card" aria-labelledby="varMetH">
      <h2 id="varMetH">${t(I, "Words I met", "Palabras que encontré")}</h2>
      <p>${spot}</p>
      <ul class="var-chips">${ids
        .map((id) => words.find((w) => w.id === id))
        .filter(Boolean)
        .map(
          (w) =>
            `<li><a class="var-chip" href="${esc(wordHref(w.id))}" lang="en">${esc(w.hw)}</a></li>`,
        )
        .join("")}</ul>
    </section>`;
}

export function afterHTML(R) {
  const { I, reading, ui } = R;
  if (ui.finished) return doneHTML(R);
  if (!reading.qs.length || ui.q.i >= reading.qs.length)
    return `${retellHTML(R)}${metHTML(R)}<p class="va-actions"><button type="button" class="btn btn-primary va-btn" data-var-finish>${t(I, "Finish reading", "Terminar la lectura")}</button></p>`;
  return `${questionHTML(R)}
    <details class="var-textref" data-var-textref ${ui.where !== null ? "open" : ""}><summary>${t(I, "Read the text again", "Leer el texto otra vez")}</summary><div class="var-text${ui.large ? " is-large" : ""}" data-var-text>${textHTML(R, "read")}</div></details>`;
}

export function doneHTML(R) {
  const { I, reading } = R;
  const link = (href, en, es, primary = false) =>
    href
      ? `<a class="btn ${primary ? "btn-primary " : ""}va-btn" href="${esc(href)}">${t(I, en, es)}</a>`
      : "";
  return `<section class="var-card var-done" aria-labelledby="varDoneH">
      <h2 id="varDoneH" tabindex="-1">${t(I, "You finished this reading", "Terminaste esta lectura")}</h2>
      <p lang="en"><strong>${esc(reading.title)}</strong></p>
      <p role="status">${t(I, "Saved on this device. You can read it again any time.", "Guardado en este dispositivo. Puedes leerla otra vez cuando quieras.")}</p>
      ${metHTML(R)}
      <p class="va-actions">
        <button type="button" class="btn va-btn" data-var-again>${t(I, "Read it again", "Leerla otra vez")}</button>
        ${link(R.links?.sibling, "Read the other reading for this lesson", "Leer la otra lectura de esta lección", true)}
        ${link(R.links?.lesson, "Back to the lesson", "Volver a la lección")}
        ${link(R.links?.library, "All readings", "Todas las lecturas")}
      </p>
    </section>`;
}

