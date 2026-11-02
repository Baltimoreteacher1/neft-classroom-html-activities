// Practice-test modes: what Guided Practice and Independent Rehearsal each allow, plus the language
// helpers the practice-test views share. The mode choice itself renders in views/test-report.js.
import { html, raw, toHtml } from "../util.js";

/** What each mode allows. Guided supports are never rendered in Independent Rehearsal. */
export const MODES = Object.freeze({
  guided: Object.freeze({ id: "guided", label: "Guided Practice Mode", results: "Supported Practice", timer: false, singlePassAudio: false, frames: true, wordBank: true, lookback: true, rationales: true, retry: true, flagging: true, sectionReview: true }),
  independent: Object.freeze({ id: "independent", label: "Independent Rehearsal Mode", results: "Independent Rehearsal", timer: true, singlePassAudio: true, frames: false, wordBank: false, lookback: false, rationales: false, retry: false, flagging: true, sectionReview: true }),
});
/** Mode names as [English, Español] pairs: `label` (long), `name` (short), `results`, `tag`. */
export const MODE_TEXT = Object.freeze({
  guided: {
    label: ["Guided Practice Mode", "Modo de práctica guiada"],
    name: ["Guided Practice", "Práctica guiada"],
    results: ["Supported Practice", "Práctica con apoyos"],
    tag: ["Supports on", "Con apoyos"],
  },
  independent: {
    label: ["Independent Rehearsal Mode", "Modo de ensayo independiente"],
    name: ["Independent Rehearsal", "Ensayo independiente"],
    results: ["Independent Rehearsal", "Ensayo independiente"],
    tag: ["Test-day conditions", "Como el día de la prueba"],
  },
});
/** A mode name for a text node. */
export const modeText = (I, id, key) => I.T(...MODE_TEXT[id][key]);

/** A phrase around a mode name, written with an {m} slot: "Restart in {m}". Text-node and plain-string forms. */
export const modePhrase = (I, id, key, en, es) =>
  I.T(en.replace("{m}", MODE_TEXT[id][key][0]), es.replace("{m}", MODE_TEXT[id][key][1]));
export const modePhraseS = (I, id, key, en, es) =>
  I.S(en.replace("{m}", MODE_TEXT[id][key][0]), es.replace("{m}", MODE_TEXT[id][key][1]));

/**
 * Like I.T, but for a sentence that contains markup (<strong>, <a>). `en` and `es` are html`` fragments;
 * build each from the matching side of MODE_TEXT and plain strings, never from T output.
 */
export const rich = (I, en, es) => {
  if (I.bilingual) return raw(`<span class="bi-pair">${toHtml(en)}<span class="bi-es" lang="es">${toHtml(es)}</span></span>`);
  if (I.spanish) return I.pageLang === "es" ? es : raw(`<span lang="es">${toHtml(es)}</span>`);
  return en;
};

/** "Grades 6–8" in each language. */
export const gradesText = (I, band) => {
  const range = String(band).replace("-", "–");
  return I.T(`Grades ${range}`, `Grados ${range}`);
};

/** Saved records keep the original `conditions` flag, so older tests resume in the right mode. */
export const modeOf = (rec) => (rec?.conditions ? "independent" : "guided");
export const otherMode = (m) => (m === "independent" ? "guided" : "independent");

export function modeBannerHTML(I, want, rec) {
  if (!want || want === modeOf(rec)) return "";
  const have = modeOf(rec);
  const state = rec.phase === "results" ? ["finished", "terminada"] : ["started", "empezada"];
  const [wantEn, wantEs] = MODE_TEXT[want].label;
  const [haveEn, haveEs] = MODE_TEXT[have].label;
  return html`<div class="mode-banner" role="status">
    <p>
      ${rich(
        I,
        html`You chose <strong>${wantEn}</strong>, but this test is already ${state[0]} in ${haveEn}. Changing mode restarts the test.`,
        html`Elegiste <strong>${wantEs}</strong>, pero esta prueba ya está ${state[1]} en ${haveEs}. Si cambias de modo, la prueba empieza de nuevo.`,
      )}
    </p>
    <button type="button" class="btn" data-switch-mode="${want}">${modePhrase(I, want, "label", "Restart in {m}", "Reiniciar en {m}")}</button>
  </div>`;
}

/**
 * Princeton Review & CertFellow inspired test-taking strategies:
 * Process of Elimination (POE), Distractor Traps, Audio Anticipation, and Pacing.
 */
export function testStrategiesHTML(I) {
  return html`<div class="test-strategies-block">
    <div class="strategy-grid">
      <article class="strategy-card">
        <h3><span class="strat-num" aria-hidden="true">1</span> ${I.T("Process of Elimination (POE)", "Proceso de descarte (POE)")}</h3>
        <p class="fine">${I.T("Don't search for the right answer first — find what is definitely wrong and cross it off.", "No busques la respuesta correcta primero: encuentra lo que seguro está mal y táchalo.")}</p>
        <ul class="strat-list">
          <li><strong>${I.T("Absolute words trap:", "Trampa de palabras absolutas:")}</strong> ${I.T("Options with words like 'always', 'never', 'all', or 'completely' are usually incorrect traps.", "Opciones con 'siempre', 'nunca', 'todos' o 'completamente' suelen ser trampas.")}</li>
          <li><strong>${I.T("Verbatim word match trap:", "Trampa de palabras idénticas:")}</strong> ${I.T("Distractors often copy exact words from the audio or passage, but change the true cause or meaning.", "Los distractores suelen copiar palabras exactas del texto o audio, pero alteran el sentido real.")}</li>
          <li><strong>${I.T("Boost your odds:", "Mejora tus probabilidades:")}</strong> ${I.T("Eliminating just two wrong choices turns a 25% guess into a 50/50 decision.", "Descartar solo dos opciones incorrectas convierte una adivinanza del 25% en una decisión 50/50.")}</li>
        </ul>
      </article>

      <article class="strategy-card">
        <h3><span class="strat-num" aria-hidden="true">2</span> ${I.T("Audio Anticipation (Listening)", "Anticipación del audio (Escuchar)")}</h3>
        <p class="fine">${I.T("In computer-based ACCESS, you cannot pause the audio. Prepare before you click play.", "En la prueba por computadora no puedes pausar el audio. Prepárate antes de escuchar.")}</p>
        <ul class="strat-list">
          <li><strong>${I.T("Read question stems first:", "Lee la pregunta primero:")}</strong> ${I.T("Look at the pictures and read what is asked before starting the audio clip.", "Mira las imágenes y lee lo que te piden antes de reproducir el audio.")}</li>
          <li><strong>${I.T("Predict keywords:", "Predice palabras clave:")}</strong> ${I.T("Guess 2–3 words you expect to hear (e.g. 'experiment', 'temperature', 'results').", "Imagina 2–3 palabras que esperas oír (ej. 'experimento', 'temperatura', 'resultados').")}</li>
          <li><strong>${I.T("Listen for signal transitions:", "Atiende a conectores clave:")}</strong> ${I.T("Words like 'however', 'because', 'therefore', and 'instead' signal the real answer.", "Palabras como 'sin embargo', 'porque', 'por lo tanto' señalan la respuesta real.")}</li>
        </ul>
      </article>

      <article class="strategy-card">
        <h3><span class="strat-num" aria-hidden="true">3</span> ${I.T("Pacing & Time Budgeting", "Control del tiempo y ritmo")}</h3>
        <p class="fine">${I.T("Never get stuck on one single question. Keep a steady momentum.", "Nunca te estanques en una sola pregunta. Mantén un ritmo constante.")}</p>
        <ul class="strat-list">
          <li><strong>${I.T("Listening & Reading:", "Escuchar y leer:")}</strong> ${I.T("Spend about 1.5 to 2 minutes per item. If unsure, eliminate 2 choices, pick your best choice, and flag it.", "Dedica entre 1.5 y 2 minutos por pregunta. Si dudas, descarta 2 opciones, elige y márcala.")}</li>
          <li><strong>${I.T("Speaking tasks:", "Tareas de hablar:")}</strong> ${I.T("Use all 30–45 planning seconds to organize 2 key details. Speak clearly at an even pace.", "Aprovecha los 30–45 segundos de preparación para planear 2 detalles. Habla con calma y claridad.")}</li>
          <li><strong>${I.T("Writing tasks:", "Tareas de escribir:")}</strong> ${I.T("Budget: 3 minutes planning/outline, 10 minutes drafting with transition words, 2 minutes checking.", "Distribuye: 3 min de plan, 10 min redactando con conectores, 2 min para revisar.")}</li>
        </ul>
      </article>
    </div>
  </div>`;
}
