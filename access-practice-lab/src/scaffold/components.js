// Scaffold Studio components. Each builder returns an HTML string with the states documented in the style guide
// (/access-practice-lab/styleguide). Builders are pure: they read the data they are given and touch no storage.
// Every control is a real button or input with a text label; colour is never the only signal; targets are 44px (CSS).
import { esc } from "../util.js";
import { STEPS, STEP_LABEL } from "./fading.js";
import { GROW_PARTS, growProgress, growSentence } from "./grow.js";
import { mayShow, statusLabel } from "./review.js";

const bi = (v, lang) => (lang === "es" && v?.es ? v.es : v?.en || "");
const T = (en, es, lang) => esc(lang === "es" ? es : en);
const ROLE_LABEL = {
  who: { en: "Who", es: "Quién" },
  did: { en: "Did what", es: "Qué hizo" },
  where: { en: "Where", es: "Dónde" },
  when: { en: "When", es: "Cuándo" },
  how: { en: "How", es: "Cómo" },
  why: { en: "Why", es: "Por qué" },
  what: { en: "What", es: "Qué" },
};

const reviewBadge = (review, lang) => {
  if (!review || review.status === "approved") return "";
  const l = statusLabel(review.status, review.machineDrafted);
  return `<span class="ss-review">${esc(bi(l, lang))}</span>`;
};

/** A tappable word inside a passage. Keyboard and screen-reader users get the same button. */
export const wordButtonHTML = (term, id) =>
  `<button type="button" class="ss-word" data-ss-word="${esc(id)}" aria-haspopup="dialog">${esc(term)}</button>`;

/**
 * The word popover body. `opts.audience` is "student" or "teacher"; `opts.production` follows the build.
 * A home-language gloss that is not approved is hidden from students and shown, labelled, to teachers.
 * `opts.home` is the student's chosen home language ("es", "ar", "ht") or "".
 */
export function wordPopoverHTML(word, { lang = "en", home = "", audience = "student", production = true, strict = false, showImage = true } = {}) {
  const gate = { audience, production, strict };
  const rows = [];
  const gloss = home && word.glosses?.[home];
  if (gloss && mayShow(gloss.review, gate))
    rows.push(`<div><dt>${T("In your language", "En tu idioma", lang)}</dt><dd lang="${esc(home)}"${home === "ar" ? ' dir="rtl"' : ""}>${esc(gloss.text)} ${audience === "teacher" ? reviewBadge(gloss.review, lang) : ""}</dd></div>`);
  rows.push(`<div><dt>${T("What it means", "Qué significa", lang)}</dt><dd>${esc(bi(word.definition, lang))}</dd></div>`);
  rows.push(`<div><dt>${T("Example", "Ejemplo", lang)}</dt><dd>${esc(word.example)}</dd></div>`);
  const img = showImage && word.image && mayShow(word.review, gate) ? `<figure><img src="${esc(word.image.src)}" alt="${esc(word.image.alt)}" loading="lazy" /></figure>` : "";
  const audio = word.audio
    ? `<button type="button" class="ss-btn" data-ss-audio="${esc(word.audio.src)}" aria-label="${T("Listen to the word", "Escuchar la palabra", lang)}">${T("Listen", "Escuchar", lang)}</button>`
    : `<button type="button" class="ss-btn" data-ss-speak="${esc(word.term)}" aria-label="${T("Listen to the word", "Escuchar la palabra", lang)}">${T("Listen", "Escuchar", lang)}</button>`;
  return `<div class="ss-pop" role="dialog" aria-labelledby="ss-pop-t-${esc(word.id)}">
    <h4 id="ss-pop-t-${esc(word.id)}">${esc(word.term)}</h4>${audience === "teacher" ? reviewBadge(word.review, lang) : ""}
    ${img}<dl>${rows.join("")}</dl>
    <p>${audio} <button type="button" class="ss-btn" data-ss-close>${T("Close", "Cerrar", lang)}</button></p></div>`;
}

/** Color-coded who / did what / where-when chunking with a plain-language explanation. */
export function chunkOverlayHTML(support, { lang = "en" } = {}) {
  const items = support.chunks
    .map((c) => `<li class="ss-chunk" data-role="${esc(c.role)}"><small>${esc(bi(ROLE_LABEL[c.role] || ROLE_LABEL.what, lang))}</small><span>${esc(c.text)}</span></li>`)
    .join("");
  return `<div class="ss-card"><ul class="ss-chunks" aria-label="${T("The sentence in parts", "La oración en partes", lang)}">${items}</ul>
    <p class="ss-text">${esc(bi(support.explain, lang))}</p></div>`;
}

/** The frame tray shows the frame at the student's current fading step. Blanks are marked, never answered. */
export function frameTrayHTML(frame, step, { lang = "en" } = {}) {
  const text = frame.steps.find((s) => s.step === step)?.text ?? "";
  const body = esc(text).replace(/_{2,}/g, '<span class="ss-blank" role="img" aria-label="blank"></span>');
  return `<div class="ss-card ss-frame" data-step="${esc(step)}"><p class="ss-meta">${esc(bi(STEP_LABEL[step], lang))}</p>
    <p class="ss-text">${body || `<em>${T("Write it on your own.", "Escríbelo por tu cuenta.", lang)}</em>`}</p></div>`;
}

/** Grow-a-sentence with a live view. `parts` are the words chosen so far; the live region announces each addition. */
export function growSentenceHTML(base, parts = {}, { lang = "en" } = {}) {
  const { text, segments } = growSentence(base, parts);
  const live = esc(text);
  const buttons = GROW_PARTS.map((p) => {
    const on = String(parts[p] || "").trim();
    return `<button type="button" class="ss-btn" data-ss-grow="${p}" aria-pressed="${on ? "true" : "false"}">${on ? "✓ " : "+ "}${esc(bi(ROLE_LABEL[p], lang))}</button>`;
  }).join("");
  return `<div class="ss-card"><p class="ss-meta">${T("Add where, when, how and why.", "Agrega dónde, cuándo, cómo y por qué.", lang)} (${growProgress(parts)}/4)</p>
    <p class="ss-grow-live" role="status" aria-live="polite" data-new="${segments.length}">${live}</p>
    <div class="ss-grow-add">${buttons}</div></div>`;
}

/** The one support dial. Four steps, plus "I need more help", which is always available and carries no penalty. */
export function supportDialHTML(step, { lang = "en", name = "ss-dial" } = {}) {
  const radios = STEPS.map(
    (s) => `<label><input type="radio" name="${esc(name)}" value="${s}"${s === step ? " checked" : ""} /><span>${esc(bi(STEP_LABEL[s], lang))}</span></label>`,
  ).join("");
  return `<fieldset class="ss-dial"><legend>${T("How much help do you want?", "¿Cuánta ayuda quieres?", lang)}</legend>
    <div class="ss-dial-steps">${radios}</div>
    <p class="ss-meta">${T("You choose. The lab may suggest a step, but it never changes it for you.", "Tú eliges. El laboratorio puede sugerir un paso, pero nunca lo cambia por ti.", lang)}</p>
    <button type="button" class="ss-btn" data-ss-more-help>${T("I need more help", "Necesito más ayuda", lang)}</button></fieldset>`;
}

/** Progress ring. The number is a count in words ("3 of 5"), never a percentage or score. */
export function progressRingHTML(done, total, label, { lang = "en" } = {}) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, Math.max(0, done / total)) : 0;
  return `<span class="ss-ring"><svg viewBox="0 0 56 56" aria-hidden="true" focusable="false"><circle class="ss-ring-track" cx="28" cy="28" r="${r}"/><circle class="ss-ring-fill" cx="28" cy="28" r="${r}" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - frac)).toFixed(2)}"/></svg>
    <span><strong>${esc(label)}</strong><br /><span class="ss-meta">${esc(done)} ${T("of", "de", lang)} ${esc(total)}</span></span></span>`;
}

/** Say-it-first rehearsal: model, repeat, then my own version. Feedback is intelligibility and pacing only. */
export function rehearsalHTML(stage, { lang = "en", recording = false, privateMode = false } = {}) {
  const names = [
    ["model", "Listen to the model", "Escucha el modelo"],
    ["repeat", "Say it again", "Dilo otra vez"],
    ["own", "Say it your way", "Dilo a tu manera"],
  ];
  const steps = names.map(([k, en, es]) => `<li${k === stage ? ' aria-current="step"' : ""}>${T(en, es, lang)}</li>`).join("");
  const rec = recording
    ? `<button type="button" class="ss-btn is-primary" data-ss-rec-stop>${T("Stop", "Detener", lang)}</button>`
    : `<button type="button" class="ss-btn" data-ss-rec-start>${T("Record", "Grabar", lang)}</button>`;
  const note = privateMode
    ? T("Private try: nothing is scored and nothing is kept. You can use the keyboard instead of the microphone.", "Intento privado: nada se califica y nada se guarda. Puedes usar el teclado en lugar del micrófono.", lang)
    : T("Your recording stays on this page. It is not saved or sent anywhere.", "Tu grabación se queda en esta página. No se guarda ni se envía a ningún lugar.", lang);
  return `<div class="ss-card"><ol class="ss-steps">${steps}</ol><p>${rec} <button type="button" class="ss-btn" data-ss-speak-model>${T("Hear the model", "Escuchar el modelo", lang)}</button></p><p class="ss-private">${note}</p></div>`;
}

/** Teacher export dialog body: what is exported, in plain words, then the buttons. */
export function exportDialogHTML({ lang = "en", hasData = true } = {}) {
  return `<div class="ss-card ss-export" role="group" aria-labelledby="ss-export-t"><h3 id="ss-export-t">${T("Independence evidence", "Evidencia de independencia", lang)}</h3>
    <p>${T("A file saved to this device with, for each unit and domain: how many activities were done at each support step, how many on their own, and which supports were used recently.", "Un archivo guardado en este dispositivo con, por cada unidad y dominio: cuántas actividades se hicieron en cada paso de apoyo, cuántas por cuenta propia y qué apoyos se usaron hace poco.", lang)}</p>
    <ul><li>${T("Counts only. No score, level or percentage.", "Solo conteos. Sin puntaje, nivel ni porcentaje.", lang)}</li><li>${T("Nothing is uploaded.", "No se sube nada.", lang)}</li></ul>
    <p><button type="button" class="ss-btn is-primary" data-ss-export="csv"${hasData ? "" : " disabled"}>CSV</button> <button type="button" class="ss-btn" data-ss-export="json"${hasData ? "" : " disabled"}>JSON</button> <button type="button" class="ss-btn" data-ss-export="print"${hasData ? "" : " disabled"}>${T("Print one-page summary", "Imprimir resumen de una página", lang)}</button></p>
    ${hasData ? "" : `<p class="ss-meta">${T("No activities recorded yet on this device.", "Aún no hay actividades registradas en este dispositivo.", lang)}</p>`}</div>`;
}
