// One practice activity (also the playlist player at /play?ids=…).
import {
  crumbsHTML,
  listenPlayerHTML,
  listeningStrategyHTML,
  listeningTrapHTML,
  playCount,
  modelLadderHTML,
  readingToolbarHTML,
  recorderHTML,
  renderPassageSentences,
  speakingChecksHTML,
  transcriptHTML,
  vocabHTML,
} from "../components.js";
import { findActivity, loadDomain, loadEsGuide, loadFamilyCoach, loadGlossary, loadShared, ordered } from "../content.js";
import { buildCoaching } from "../family/coach.js";
import { copilotHTML } from "../family/copilot.js";
import { getFamily } from "../family/state.js";
import { award, getEngagement, saveEngagement } from "../engagement.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { glossInline, glossList, glossListHTML, openGloss } from "../glossary.js";
import {
  SPEAKING_CHECKS,
  band,
  correctAnswerText,
  isAnswered,
  isCorrect,
  practiceBand,
  practiceCopy,
  writingPracticeScore,
  wordGoal,
} from "../grade.js";
import {
  clearListenNotes,
  diagnoseListening,
  evidenceLabel,
  listeningPurpose,
  listeningSegments,
  loadListenNotes,
  purposeOf,
  saveListenNotes,
  strategyFor,
  taskCriteria,
  wordBank,
} from "../learning.js";
import { choiceTarget, inputHTML, reduceAnswer, seedAnswer, setItemsI18n } from "../items.js";
import { visualsHTML } from "../media.js";
import { isRecording, takesFor } from "../recorder.js";
import { answerOf, loadRecord, saveRecord } from "../store.js";
import { invalidateActivity, startIndependentAttempt, updateActivityAnswer } from "../attempts.js";
import { analyzeResponse, bankKey, bankWordsUsed, compareDrafts } from "../lang/analyze.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { feedbackHTML as coachCardHTML } from "../studio-ui.js";
import { dataPoints, itemsFrom, loadNotebook, passageSentences, pinItem, pinnedIndex, tagLabel } from "../lang/evidence-notebook.js";
import { dataPickHTML, organizerHTML, tagBarHTML } from "../evidence-ui.js";
import { canSpeak, speak, stop as stopSpeech } from "../speech.js";
import {
  ART,
  BASE,
  DOMAIN_META,
  TIERS,
  announce,
  asList,
  bandLabel,
  html,
  icon,
  raw,
  wordCount,
  storage,
} from "../util.js";
import { activityHref, roomHref } from "./room.js";
import { COUNTRIES, stopSlices } from "../journey.js";

const IGN = raw("data-nsr-ignore");
// Transient per-visit check state: id → { ok, attempt, reveal }
const checked = new Map();
const writingChecks = new Map();
const tries = new Map(); // id → checks this visit (2nd miss reveals the answer)
const helpUsed = new Set();
let glossary = null; // tap-a-word help; only offered in supported mode
let mode = "supported";
let validation = "";
let renderGeneration = 0;
let loading = false;
let cur = null; // { band, domain, level, activity, list, index, record, playlist }
let showCognates = false;
// Evidence Notebook on a Reading passage: pin mode turns sentences into select buttons; `picked` is the
// selected sentence index or data-point key. Gist notes are Learn-with-help scaffolds kept for this visit only.
let pinMode = false;
let picked = null;
const gists = new Map(); // activity id → string[]
let coachFeedback = null;
// Listening Strategy Lab (Learn with help only): signal-word tags are UI state for this attempt.
const listenTags = new Map(); // id → Set("part:index")
/** A diagnosed listening miss holds the answer back until the learner replays the targeted part. */
const revealHeld = (c) => Boolean(c && !c.ok && c.reveal === "full" && c.diag && !c.replayed && canSpeak());

async function resolve(ctx) {
  const r = ctx.route;
  if (r.view === "play") {
    const ids = r.ids;
    const index = Math.min(Math.max(0, r.index), Math.max(0, ids.length - 1));
    const found = ids.length ? await findActivity(ids[index]) : null;
    if (!found) return null;
    return {
      ...found,
      index: found.list.indexOf(found.activity),
      playlist: { ids, index, title: r.title, sessionId: r.sessionId },
    };
  }
  const data = await loadDomain(ctx.band, r.domain).catch(() => null);
  const L = data?.levels?.[r.level];
  if (!L) {
    const found = await findActivity(r.id, { domain: r.domain });
    return found ? { ...found, index: found.list.indexOf(found.activity) } : null;
  }
  const list = ordered(L);
  // Numeric links (/Listening/A/3) predate strand ordering and counted in file order.
  const wanted = /^\d+$/.test(r.id)
    ? L.activities[Math.min(Number(r.id), L.activities.length - 1)]?.id
    : r.id;
  let index = list.findIndex((a) => a.id === wanted);
  if (index < 0) {
    const found = await findActivity(r.id, { domain: r.domain });
    if (found) return { ...found, index: found.list.indexOf(found.activity) };
    index = 0;
  }
  return {
    band: ctx.band,
    domain: r.domain,
    level: r.level,
    data,
    list,
    index,
    activity: list[index],
  };
}

const KLU = { inform: "Inform", narrate: "Narrate", explain: "Explain", argue: "Argue" };
const keyUseOf = (a) => KLU[purposeOf(a)] || "Inform";
const coachOptions = (a) => ({ keyUse: keyUseOf(a), modality: cur.domain === "Speaking" ? "speaking" : "writing", wordBank: wordBank(a), stage: mode === "independent" ? "independent" : "supported", expected: { minWords: Math.round(wordGoal(cur.level) * 0.6), maxWords: wordGoal(cur.level) * 2 } });

// learning.js returns these learner-facing sentences in English; the Spanish is looked up here by the
// English text and falls back to English for anything not listed.
const ES_LEARNING = {
  "Correct without opened help": "Correcto sin abrir la ayuda",
  "Correct after help or a retry": "Correcto después de ayuda o de un reintento",
  "Answer attempted · revisit": "Respuesta intentada · vuelve a verla",
  "Draft changed · review needed": "Borrador cambiado · falta revisar",
  "Written response · self-reviewed": "Respuesta escrita · revisada por ti",
  "Writing revised · improvement described": "Escritura corregida · mejora descrita",
  "Speaking practiced · self-reported": "Habla practicada · lo indicaste tú",
  "Speaking practiced · recording made in this tab": "Habla practicada · grabación hecha en esta pestaña",
  "Paper practice · self-reported": "Práctica en papel · lo indicaste tú",
  "Earlier practice · support use not recorded": "Práctica anterior · no se registró el uso de ayuda",
  "Listen for the main message first. Then listen again for the detail the question asks about.": "Escucha primero el mensaje principal. Luego escucha otra vez el detalle que pregunta la pregunta.",
  "Read the question, then find the part of the text that helps you answer. Check your choice against it.": "Lee la pregunta y busca la parte del texto que te ayuda a responder. Comprueba tu elección con ella.",
  "Plan your main idea. Say it aloud, add one useful detail, and listen to your explanation.": "Planea tu idea principal. Dila en voz alta, agrega un detalle útil y escucha tu explicación.",
  "Say your idea first. Write it, then reread it with the question beside you.": "Di tu idea primero. Escríbela y vuelve a leerla con la pregunta al lado.",
  "Read the directions, try one step, then check your work.": "Lee las instrucciones, prueba un paso y revisa tu trabajo.",
  "Name the person, object, or idea you are describing.": "Nombra la persona, el objeto o la idea que describes.",
  "Add a specific action, fact, or detail from the task.": "Agrega una acción, un dato o un detalle específico de la tarea.",
  "Tell the important events in an order the reader can follow.": "Cuenta los sucesos importantes en un orden que el lector pueda seguir.",
  "Add a detail that helps the reader understand what happened.": "Agrega un detalle que ayude al lector a entender lo que pasó.",
  "Describe what happened or how something works.": "Describe lo que pasó o cómo funciona algo.",
  "Explain why, using a detail or result from the task.": "Explica por qué, con un detalle o resultado de la tarea.",
  "State your claim or choice clearly.": "Di con claridad tu afirmación o tu elección.",
  "Support it with a reason and specific evidence from the task.": "Apóyala con una razón y evidencia específica de la tarea.",
};
/** Markup-safe text: English from learning.js, plus Spanish in Español and bilingual modes. */
const learnCopy = (en) => I.T(en, ES_LEARNING[en]);
const TAG_ES = { Claim: "Afirmación", Evidence: "Evidencia", Example: "Ejemplo" };

const isListening = (domain, a) => domain === "Listening" || a.listening;
/** Tap-a-word help is a support, so "on my own" never gets it. */
const wordHelp = () => (mode === "supported" ? glossary : null);
/** Opening any help counts as help used, so an independent result can never be contaminated. */
function noteHelp(id) {
  helpUsed.add(id);
  cur.record.supportUsed ||= {};
  cur.record.supportUsed[id] = true;
  save();
}
const save = () => saveRecord(cur.band, cur.domain, cur.level, cur.record);

function stimulusHTML(a, ctx) {
  const listening = isListening(cur.domain, a);
  const c = checked.get(a.id);
  const answeredOnce = Boolean(c) || cur.record.complete.includes(a.id);
  const hasPassage = !listening && asList(a.passage).length > 0;
  // Learn with help adds the Listening Strategy Lab and an interactive transcript; "on my own" keeps
  // only the player (play, stop, speed) and, after an answer, the plain transcript.
  const lab = listening && a.script && mode === "supported";
  return html`${lab ? listeningStrategyHTML(a.id, { purpose: listeningPurpose(a), parts: listeningSegments(a.script), played: playCount(a.id) > 0 || answeredOnce, notes: loadListenNotes(storage, a.id), open: helpUsed.has(a.id) }) : ""}
  ${listening && a.script ? listenPlayerHTML(a.id, a.script, { rate: ctx.prefs.rate }) : ""}
  ${listening && a.script && answeredOnce ? transcriptHTML(a.id, a.script, lab ? { interactive: true, tags: listenTags.get(a.id), target: c?.diag && !c.ok ? c.diag.segment : null } : {}) : ""} ${visualsHTML(a)}
  ${
    hasPassage
      ? html`
        ${readingToolbarHTML(a.id, asList(a.passage), {
          rate: ctx.prefs.rate,
          voiceURI: ctx.prefs.readingVoice,
          showCognates: mode === "supported" && showCognates,
          cognates: mode === "supported",
        })}
        ${evidencePinHTML(a)}
        <article class="passage" data-reading-passage="${a.id}">
          ${a.passageTitle ? html`<h3>${a.passageTitle}</h3>` : ""}
          ${renderPassageSentences(asList(a.passage), {
            showCognates: mode === "supported" && showCognates,
            glossary: pinMode ? null : wordHelp(),
            tagMode: pinMode,
            pickKey: a.id,
            picked: typeof picked === "number" ? picked : -1,
            pinned: pinnedIndex(loadNotebook(storage), a.id, passageSentences(a.passage).map((x) => x.text)),
            gist: mode === "supported" ? gists.get(a.id) || [] : null,
          })}
        </article>
        ${pinMode && points(a).length ? html`<section aria-labelledby="nbData-${a.id}"><h3 id="nbData-${a.id}" class="helper-title">${I.T("Pin a data point", "Fija un dato")}</h3><ul class="chips" role="list">${points(a).map((t, i) => dataPickHTML(`${a.id}|d${i}`, t, { picked: picked === `d${i}`, tag: itemsFrom(loadNotebook(storage), a.id).find((x) => x.text === t)?.tag }))}</ul></section>` : ""}
        ${mode === "supported" ? html`<details class="helpers nb-organizer-wrap"><summary>${icon("grid")} ${I.T("Graphic organizer: Claim · Evidence · Example", "Organizador gráfico: Afirmación · Evidencia · Ejemplo")}</summary><div class="helper-body">${organizerHTML(itemsFrom(loadNotebook(storage), a.id))}<p class="fine">${I.T("Turn on “Pin evidence” and tag sentences to fill it.", "Activa “Fijar evidencia” y etiqueta oraciones para llenarlo.")} <a href="${BASE}/evidence?grades=${cur.band}#notebook">${I.T("Open my Evidence Notebook", "Abrir mi Cuaderno de evidencia")}</a></p></div></details>` : ""}`
      : ""
  }
  ${
    a.prompt && !hasPassage
      ? html`<div class="prompt">
          <p class="prompt-text">${wordHelp() ? glossInline(a.prompt, wordHelp()) : a.prompt}</p>
          ${cur.domain !== "Reading" ? html`<button type="button" class="ghost small" data-say="${a.prompt}" aria-label="${I.S("Read the question aloud", "Escuchar la pregunta en inglés")}">${icon("volume")} ${I.T("Hear question", "Escuchar la pregunta")}</button>` : ""}
        </div>`
      : ""
  }
  ${wordHelp() ? glossListHTML(glossList([...asList(a.passage), a.prompt || ""], wordHelp())) : ""}`;
}

/** Data points of a Reading activity's chart or table, as pinnable text. */
const points = (a) => dataPoints(a.chart, a.table);
/** Text for the current selection (a sentence index or a data-point key "d<n>"). */
function pickedText(a) {
  if (typeof picked === "number") return passageSentences(a.passage)[picked]?.text || "";
  if (typeof picked === "string") return points(a)[Number(picked.slice(1))] || "";
  return "";
}

/** Pin-evidence toggle and, while it is on, the tag bar for the selected sentence or data point. */
function evidencePinHTML(a) {
  const text = pinMode ? pickedText(a) : "";
  return html`<div class="nb-pin-tools">
    <button type="button" class="btn small" data-nb-pin-mode aria-pressed="${String(pinMode)}">${icon("pin")} ${pinMode ? I.T("Done pinning", "Terminar de fijar") : I.T("Pin evidence", "Fijar evidencia")}</button>
    ${pinMode ? tagBarHTML(text ? { text } : null) : ""}
  </div>`;
}

const lookBack = () => I.T("Look back at the sentence, table, or chart that supports your answer.", "Vuelve a la oración, la tabla o la gráfica que apoya tu respuesta.");

function feedbackHTML(a) {
  const c = checked.get(a.id);
  if (!c) return "";
  if (c.ok)
    return html`<div class="feedback is-right" role="status">
      <p class="fb-title">${icon("check")} ${c.attempt === 1 ? I.T("Correct!", "¡Correcto!") : I.T("You got it!", "¡Lo lograste!")}</p>
      ${a.correct ? html`<p>${a.correct}</p>` : ""}
      ${cur.domain === "Reading" ? html`<p class="fb-extra">${lookBack()}</p>` : ""}
      ${a.extension ? html`<p class="fb-extra"><strong>${I.T("Go further:", "Ve más allá:")}</strong> ${a.extension}</p>` : ""}
      ${cur.domain === "Speaking" ? html`<p class="fb-extra"><strong>${I.T("Now say it:", "Ahora dilo:")}</strong> ${I.T("record yourself saying the best answer.", "graba tu voz diciendo la mejor respuesta.")}</p>` : ""}
    </div>`;
  if (c.diag && mode === "supported" && (c.reveal !== "full" || revealHeld(c)))
    return listeningTrapHTML(c.diag, { held: revealHeld(c), hint: a.hint });
  if (c.reveal === "full" && mode === "supported")
    return html`<div class="feedback is-shown" role="status">
      <p class="fb-title">${icon("info")} ${I.T("Here is the answer", "Aquí está la respuesta")}</p>
      <p><strong>${correctAnswerText(a)}</strong></p>
      ${a.support ? html`<p>${a.support}</p>` : ""}
      ${cur.domain === "Reading" ? html`<p>${lookBack()}</p>` : ""}
      <button type="button" class="btn" data-retry>${I.T("Try it again", "Inténtalo otra vez")}</button>
    </div>`;
  return html`<div class="feedback is-hint" role="status">
    <p class="fb-title">${icon("retry")} ${I.T("Not yet — try again", "Todavía no — inténtalo otra vez")}</p>
    ${a.hint && mode === "supported" ? html`<p>${a.hint}</p>` : html`<p>${I.T("Review the task, then try again. Switch to Learn with help for a clue.", "Revisa la tarea y vuelve a intentarlo. Cambia a Aprender con ayuda para ver una pista.")}</p>`}
    ${cur.domain === "Reading" ? html`<p>${lookBack()}</p>` : ""}
    <button type="button" class="btn" data-retry>${I.T("Try again", "Intentar de nuevo")}</button>
  </div>`;
}

function interactiveHTML(a) {
  const c = checked.get(a.id);
  const answer = answerOf(cur.record, a.id);
  const reveal = c ? (c.ok || revealHeld(c) ? "mark" : c.reveal || "mark") : "none";
  return html`${cur.domain === "Speaking" ? html`<p class="fine warmup-note">${icon("speaking")} <strong>${I.T("Warm-up.", "Calentamiento.")}</strong> ${I.T("This builds ideas and words. Speaking ability is shown by speaking — when you are ready,", "Esto te ayuda a reunir ideas y palabras. Hablar se demuestra hablando — cuando estés listo o lista,")} <a href="${BASE}/speak?grades=${cur.band}">${I.T("open the Speaking Studio", "abre el Estudio de habla")}</a>.</p>` : ""}${inputHTML(a, answer, { reveal })}
  ${!c ? html`<button type="button" class="btn btn-primary btn-check" data-check ${isAnswered(a, answer ?? seedAnswer(a)) ? "" : raw("disabled")}>${I.T("Check my answer", "Revisar mi respuesta")}</button>` : ""}
  ${feedbackHTML(a)}
  ${cur.domain === "Speaking" && c?.ok ? recorderHTML(a.id, { level: cur.level, recording: isRecording(a.id) }) : ""}`;
}

function speakingHTML(a) {
  const notes = cur.record.notes[a.id] || "";
  const hasTake = takesFor(a.id).length > 0 || cur.record.practiced[a.id];
  const savedChecks = cur.record.selfChecks[a.id] || {};
  const checks = {
    ...savedChecks,
    topic: savedChecks.topic ?? savedChecks.answered,
    details: savedChecks.details ?? savedChecks.words,
    thinking: savedChecks.thinking ?? savedChecks.connected,
  };
  return html`${recorderHTML(a.id, { prompt: a.prompt, level: cur.level, recording: isRecording(a.id), models: hasTake && mode === "supported" ? a.models : null, activity: a })}
    ${!hasTake && a.models ? html`<p class="fine">${I.T("Record or practice aloud with a partner, then hear sample answers in Learn with help mode.", "Graba o practica en voz alta con un compañero y luego escucha respuestas de ejemplo en el modo Aprender con ayuda.")}</p>` : ""}
    <label class="field">
      <span>${a.responseLabel || I.T("Planning notes (optional)", "Notas para planear (opcional)")}</span>
      <textarea
        rows="3"
        data-note
        placeholder="${a.responsePlaceholder || I.S("Words or ideas I will say…", "Palabras o ideas que voy a decir…")}"
        ${IGN}
      >
${notes}</textarea>
    </label>
    <section class="task-criteria"><h2>${I.T("What to include", "Qué incluir")}</h2><ul>${taskCriteria(a).map((c) => html`<li>${learnCopy(c)}</li>`)}</ul></section>
    ${speakingChecksHTML(checks)}
    <label class="practiced"
      ><input
        type="checkbox"
        data-practiced
        ${cur.record.practiced[a.id] ? raw("checked") : ""}
        ${IGN}
      />
      ${I.T("I practiced out loud (with a partner or my teacher).", "Practiqué en voz alta (con un compañero o con mi docente).")}</label
    >
    <button type="button" class="btn btn-primary" data-save-speaking>
      ${I.T("Save my speaking practice", "Guardar mi práctica de habla")}
    </button>
    ${cur.record.complete.includes(a.id) ? html`<p class="saved-note">${icon("check")} ${I.T("Practice evidence saved. The audio itself is not saved. Try again to add a useful detail.", "Evidencia de práctica guardada. El audio no se guarda. Inténtalo otra vez para agregar un detalle útil.")}</p>` : ""}
    ${cur.record.results[a.id]?.total && cur.record.results[a.id]?.meaningful !== false ? html`<section class="practice-score" role="status" aria-label="${I.S("Speaking practice score", "Puntos de práctica de habla")}">
      <p class="eyebrow">${I.T(`Practice score · ${cur.record.results[a.id].score} of ${cur.record.results[a.id].total}`, `Puntos de práctica · ${cur.record.results[a.id].score} de ${cur.record.results[a.id].total}`)}</p>
      <h3>${practiceCopy(cur.record.results[a.id].band, I)}</h3>
      <p>${I.T("Use your self-check and teacher feedback to reflect. This is not an official ACCESS score.", "Usa tu autoevaluación y los comentarios de tu docente para reflexionar. Esta no es una puntuación oficial de ACCESS.")}</p>
    </section>` : ""}`;
}

function writingHTML(a) {
  const text = cur.record.notes[a.id] || "";
  const goal = wordGoal(cur.level);
  const bank = mode === "supported" ? wordBank(a).slice(0, 12) : [];
  const result = writingChecks.get(a.id);
  const savedResult = cur.record.results[a.id];
  const savedScore = result?.practice || (savedResult?.meaningful !== false ? savedResult?.practice : null);
  const usedWords = new Set(bankWordsUsed(text, wordBank(a)).map(bankKey));
  return html`${mode === "supported" && (bank.length || (a.frames || []).length) ? html`<details class="writing-starters"><summary>${I.T("Writing starters", "Ayudas para escribir")}</summary>` : ""}${
      bank.length
        ? html`<ul class="wordbank" aria-label="${I.S("Word bank", "Banco de palabras")}">
            ${bank.map((w) => html`<li class="${usedWords.has(String(w).split("/")[0].trim().toLowerCase()) ? "is-used" : ""}">${w}</li>`)}
          </ul>`
        : ""
    }
    ${
      mode === "supported" && (a.frames || []).length
        ? html`<ul class="frames inline">
            ${a.frames.map((f) => html`<li>${f}</li>`)}
          </ul>`
        : ""
    }
    ${mode === "supported" && (bank.length || (a.frames || []).length) ? raw("</details>") : ""}
    <label class="field">
      <span>${a.responseLabel || I.T("Your writing", "Tu escritura")}</span>
      <textarea
        rows="${cur.level === "C" ? 10 : 6}"
        data-note
        spellcheck="false"
        placeholder="${a.responsePlaceholder || I.S("Write your answer here.", "Escribe tu respuesta aquí.")}"
        ${IGN}
      >
${text}</textarea>
    </label>
    <p class="fine">${I.T("Answer the question first. The word target is optional; useful details matter more than length.", "Primero responde la pregunta. La meta de palabras es opcional; los detalles útiles importan más que la longitud.")}</p>
    <p class="meter">
      <span class="meter-bar"
        ><span
          style="width:${Math.min(100, Math.round((wordCount(text) / goal) * 100))}%"
        ></span></span
      ><span data-meter>${I.T(`${wordCount(text)} / about ${goal} words`, `${wordCount(text)} / unas ${goal} palabras`)}</span>
    </p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-check-writing>${I.T("Check my writing", "Revisar mi escritura")}</button>
      <button type="button" class="btn btn-secondary" data-ask-coach>
        ${icon("detective")} ${I.T("Language Coach", "Entrenador de lenguaje")}
      </button>
      <button type="button" class="ghost" data-read-writing data-say="${text || "Write something first."}">
        ${icon("volume")} ${I.T("Read my writing to me", "Leer mi escritura en voz alta")}
      </button>
    </div>
    ${coachFeedback ? coachCardHTML(coachFeedback, text, { patternHref: (id) => `${BASE}/detective/${id}?grades=${cur.band}` }) : ""}
    ${savedScore ? html`<section class="practice-score" aria-label="${I.S("Writing practice score", "Puntos de práctica de escritura")}" role="status">
      <p class="eyebrow">${I.T(`Practice score · ${savedScore.score} of ${savedScore.total}`, `Puntos de práctica · ${savedScore.score} de ${savedScore.total}`)}</p>
      <h3>${practiceCopy(savedScore.band, I)}</h3>
      <p>${I.T("These checks notice visible writing signals. They do not judge meaning or language proficiency.", "Estas revisiones notan señales visibles de la escritura. No juzgan el significado ni el dominio del idioma.")}</p>
      <ul>${savedScore.checks.map((check) => html`<li class="${check.ok ? "is-met" : "is-next"}"><span aria-hidden="true">${icon(check.ok ? "check" : "x")}</span>${practiceCopy(check.label, I)}</li>`)}</ul>
      <p><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${practiceCopy(savedScore.nextStep, I)}</p>
    </section>` : ""}
    ${
      result
        ? html`<div class="feedback is-hint" role="status">
              <p class="fb-title">${I.T("Review your meaning first", "Primero revisa si tu mensaje se entiende")}</p>
              <ul>${taskCriteria(a).map((c) => html`<li>${learnCopy(c)}</li>`)}</ul>
              <p><strong>${I.T("One next step:", "Un siguiente paso:")}</strong> ${result.nextMoves[0] ? `${result.nextMoves[0].title}. ${result.nextMoves[0].ask}` : I.T("Read your answer aloud. Keep only details that help answer the question.", "Lee tu respuesta en voz alta. Deja solo los detalles que ayudan a responder la pregunta.")}</p>
              ${result.strengths.length ? html`<details><summary>${I.T("What the checker noticed", "Lo que notó el revisor")}</summary>
              <ul class="checks">${result.strengths.slice(0, 4).map((x) => html`<li class="ok">${icon("check")} ${x.text}</li>`)}</ul></details>` : ""}
              ${mode === "supported" && result.word.bankUsed.length ? html`<p class="fine">${I.T("Word-bank words you used:", "Palabras del banco que usaste:")} ${result.word.bankUsed.join(", ")}</p>` : ""}
              <p class="fine">
                ${I.T("These checks notice surface features, not meaning or a score. Did you answer every part and include a specific detail? Ask your teacher for feedback.", "Estas revisiones notan rasgos de la superficie, no el significado ni un puntaje. ¿Respondiste cada parte e incluiste un detalle específico? Pide comentarios a tu docente.")}
              </p>
            </div>
            <label class="field"><span>${I.T("What did you improve, or what did you check?", "¿Qué mejoraste o qué revisaste?")}</span><textarea data-reflection rows="2" data-nsr-ignore>${cur.record.reflections[a.id] || ""}</textarea></label>
            <button type="button" class="btn btn-primary" data-finish-writing>${I.T("Save my reviewed writing", "Guardar mi escritura revisada")}</button>
            <details class="draft-history"><summary>${I.T("Compare my first and current draft", "Comparar mi primer borrador con el actual")}</summary>
              <h3>${I.T("First draft", "Primer borrador")}</h3><p>${cur.record.drafts[a.id]?.first || text}</p>
              <h3>${I.T("Current draft", "Borrador actual")}</h3><p>${text}</p>
              ${
                cur.record.drafts[a.id]?.first && cur.record.drafts[a.id]?.first !== text
                  ? html`<div class="revision-coach-card card">
                      <h4>${icon("growth")} ${I.T("Revision Growth Summary", "Resumen del avance en la revisión")}</h4>
                      <ul>
                        ${compareDrafts(cur.record.drafts[a.id].first, text, coachOptions(a)).changes.map((c) => html`<li>${icon("star")} ${c.label}: ${c.from} → ${c.to}</li>`)}
                      </ul>
                    </div>`
                  : ""
              }
            </details>
            ${a.models && mode === "supported" ? modelLadderHTML(a.models, cur.level, a) : ""}`
        : ""
    }`;
}

function worksheetHTML(a) {
  return html`<div class="worksheet">
      ${(a.sheet || []).map(
        (s) =>
          html`<section>
            <h4>${s.heading}</h4>
            <ol class="ws-lines">
              ${(s.items || []).map((i) => html`<li>${i}<span class="ws-line" aria-hidden="true"></span></li>`)}
            </ol>
          </section>`,
      )}
      <p class="ws-name">${I.T("Name: ______________________ Date: ____________", "Nombre: ______________________ Fecha: ____________")}</p>
    </div>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print this page", "Imprimir esta página")}</button>
      <button type="button" class="ghost" data-mark-done>
        ${cur.record.complete.includes(a.id) ? html`${icon("check")} ${I.T("Done", "Hecho")}` : I.T("Mark as done", "Marcar como hecho")}
      </button>
    </div>`;
}

function answerZone(a) {
  if (a.type === "worksheet") return worksheetHTML(a);
  if (a.type === "constructed") return cur.domain === "Speaking" ? speakingHTML(a) : writingHTML(a);
  return interactiveHTML(a);
}

const familyOf = (ctx) => getFamily(ctx.prefs);

/** English directions, plus the Spanish translation in Español and bilingual modes (Spanish first in Español). */
function directionsBlocks(a, es) {
  const english = html`<div class="directions">
    ${icon("info", "directions-icon")}
    <p lang="en">${a.directions}</p>
    <button type="button" class="ghost small" data-say="${a.directions}" aria-label="${I.S("Read the directions aloud", "Escuchar las instrucciones en inglés")}">
      ${icon("volume")} ${I.T("Hear directions", "Escuchar en inglés")}
    </button>
  </div>`;
  if (!(I.spanish || I.bilingual) || !es.directions) return english;
  const spanish = html`<div class="directions directions-es">
    ${icon("info", "directions-icon")}
    <p lang="es">${es.directions}</p>
    <button type="button" class="ghost small" data-say-es="${es.directions}" aria-label="Escuchar las instrucciones en español">
      ${icon("volume")} Escuchar en español
    </button>
  </div>`;
  return I.spanish ? html`${spanish}${english}` : html`${english}${spanish}`;
}

function navHTML() {
  if (cur.playlist) {
    const { ids, index, title } = cur.playlist;
    const at = (i) =>
      `${BASE}/play?ids=${ids.join(",")}&i=${i}&grades=${cur.band}&mode=${mode}${title ? `&t=${encodeURIComponent(title)}` : ""}${cur.playlist.sessionId ? `&sid=${encodeURIComponent(cur.playlist.sessionId)}` : ""}`;
    return html`<nav class="act-nav" aria-label="${I.S("Playlist", "Lista de actividades")}">
      ${index > 0 ? html`<a class="btn" href="${at(index - 1)}">${icon("arrow-left")} ${I.T("Previous", "Anterior")}</a>` : html`<span></span>`}
      <span class="act-count">${I.T(`${index + 1} of ${ids.length}`, `${index + 1} de ${ids.length}`)}</span>
      ${index < ids.length - 1 ? html`<a class="btn btn-primary" href="${at(index + 1)}">${I.T("Next", "Siguiente")} ${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${cur.playlist.sessionId ? `${BASE}/session-done/${encodeURIComponent(cur.playlist.sessionId)}?grades=${cur.band}` : `${BASE}/family/progress?done=1&grades=${cur.band}`}">${I.T("Finish", "Terminar")} ${icon("check")}</a>`}
    </nav>`;
  }
  const prev = cur.list[cur.index - 1];
  const next = cur.list[cur.index + 1];
  return html`<nav class="act-nav" aria-label="${I.S("Activities", "Actividades")}">
    ${prev ? html`<a class="btn" href="${activityHref(cur.domain, cur.level, prev.id)}">${icon("arrow-left")} ${I.T("Previous", "Anterior")}</a>` : html`<span></span>`}
    <span class="act-count">${I.T(`${cur.index + 1} of ${cur.list.length}`, `${cur.index + 1} de ${cur.list.length}`)}</span>
    ${next ? html`<a class="btn btn-primary" href="${activityHref(cur.domain, cur.level, next.id)}">${I.T("Next", "Siguiente")} ${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${roomHref(cur.domain, cur.level)}">${I.T("Back to the room", "Volver a la sala")} ${icon("check")}</a>`}
  </nav>`;
}

let I = makeI18n("en");

export async function render(ctx) {
  const generation = ++renderGeneration;
  I = i18nFor(ctx);
  setItemsI18n(I);
  loading = true;
  const snapshot = { band: ctx.band, route: { ...ctx.route }, prefs: { ...ctx.prefs } };
  const requestedMode = new URLSearchParams(location.search).get("mode");
  const found = await resolve(snapshot);
  const shared = await loadShared().catch(() => null);
  glossary = await loadGlossary();
  const [coachData, esGuide] = await Promise.all([loadFamilyCoach(), loadEsGuide()]);
  if (generation !== renderGeneration) return { title: "", html: "" };
  loading = false;
  if (!found?.activity)
    return {
      title: I.S("Not found", "No se encontró"),
      html: html`<section class="panel empty-state">
        <img src="${ART}/empty.svg" width="480" height="300" alt="" />
        <h1 tabindex="-1">${I.T("We could not find that activity.", "No pudimos encontrar esa actividad.")}</h1>
        <p>${I.T("It may have moved. Choose a skill from the lab home.", "Puede que se haya movido. Elige una destreza en la página principal del laboratorio.")}</p>
        <a class="btn btn-primary" href="${BASE}/">${I.T("Go to the lab home", "Ir a la página principal del laboratorio")}</a>
      </section>`,
    };
  if (snapshot.route.sessionId) {
    const engagement = getEngagement(ctx.prefs);
    if (engagement.activeSession?.id === snapshot.route.sessionId && engagement.activeSession.index !== snapshot.route.index)
      saveEngagement(ctx, { activeSession: { ...engagement.activeSession, index: snapshot.route.index } });
  }
  const sameActivity = cur?.activity?.id === found.activity.id;
  cur = { ...found, record: loadRecord(found.band, found.domain, found.level) };
  if (!sameActivity) {
    checked.clear();
    writingChecks.clear();
    tries.clear();
    helpUsed.clear();
    listenTags.clear();
    validation = "";
    coachFeedback = null;
    pinMode = false;
    picked = null;
  }
  const a = cur.activity;
  const es = esGuide[a.id] || {};
  mode = requestedMode === "independent" ? "independent" : "supported";
  const meta = DOMAIN_META[cur.domain] || DOMAIN_META.Listening;
  const tier = TIERS[cur.level];
  const done = cur.record.complete.includes(a.id);
  const listening = isListening(cur.domain, a);
  const hasPassage = !listening && asList(a.passage).length > 0;
  const step = cur.playlist ? { n: cur.playlist.index + 1, total: cur.playlist.ids.length } : { n: cur.index + 1, total: cur.list.length };
  const journeyStops = stopSlices(cur.list.length);
  const journeyStop = Math.max(1, journeyStops.findIndex(([from, to]) => cur.index >= from && cur.index < to) + 1);
  const country = COUNTRIES[cur.domain]?.[cur.level];
  return {
    title: a.title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [meta.room, roomHref(cur.domain, cur.level)],
        [a.title, null],
      ])}
      <article class="activity d-${cur.domain.toLowerCase()}">
        <header class="act-head">
          <div class="act-bar">
            <p class="act-context">
              ${icon(meta.icon)}<span>${meta.name} · ${tier?.name || cur.level} · ${bandLabel(cur.band)}${cur.playlist?.title ? ` · ${cur.playlist.title}` : ""}</span>
            </p>
            ${country ? html`<p class="act-journey-label">${I.T(`${country[0]} · stop ${journeyStop} of ${journeyStops.length}`, `${country[1]} · parada ${journeyStop} de ${journeyStops.length}`)}</p>` : ""}
            <p class="act-step"><span>${I.T(`Activity ${step.n} of ${step.total}`, `Actividad ${step.n} de ${step.total}`)}</span><span class="bar" aria-hidden="true"><i style="width:${Math.round((step.n / step.total) * 100)}%"></i></span></p>
          </div>
          <h1 tabindex="-1">
            ${a.title}${done ? html` <span class="done-badge">${icon("check")} ${I.T("Done", "Hecho")}</span>` : ""}
          </h1>
          <nav class="act-return" aria-label="${I.S("Return to practice", "Volver a la práctica")}">
            <a class="btn small" href="${roomHref(cur.domain, cur.level)}">${I.T("Back to activity list", "Volver a la lista de actividades")}</a>
            <a class="btn small" href="${BASE}/passport?grades=${cur.band}">${I.T("My Passport", "Mi Pasaporte")}</a>
          </nav>
          ${directionsBlocks(a, es)}
        </header>
        ${familyOf(ctx).who === "independent" ? "" : copilotHTML(I, buildCoaching(a, cur.domain, coachData, es))}
        <div class="activity-workspace">
        <section class="stimulus ${hasPassage ? "has-passage" : ""}" aria-labelledby="sourceHeading"><h2 id="sourceHeading" class="workbook-heading"><span aria-hidden="true">1</span> ${listening ? I.T("Listen and notice", "Escucha y observa") : cur.domain === "Reading" ? I.T("Read and notice", "Lee y observa") : I.T("Look and plan", "Mira y planifica")}</h2>${stimulusHTML(a, ctx)}</section>
        <div class="response-workspace"><h2 class="workbook-heading"><span aria-hidden="true">2</span> ${cur.domain === "Speaking" ? I.T("Speak and review", "Habla y revisa") : a.type === "worksheet" ? I.T("Work on paper", "Trabaja en papel") : I.T("Respond and review", "Responde y revisa")}</h2>
        ${
          hasPassage && a.prompt
            ? html`<div class="prompt response-prompt">
                <p class="prompt-text">${wordHelp() ? glossInline(a.prompt, wordHelp()) : a.prompt}</p>
                ${cur.domain !== "Reading" ? html`<button type="button" class="ghost small" data-say="${a.prompt}" aria-label="${I.S("Read the question aloud", "Escuchar la pregunta en inglés")}">${icon("volume")} ${I.T("Hear question", "Escuchar la pregunta")}</button>` : ""}
              </div>`
            : ""
        }
        <fieldset class="practice-mode"><legend>${I.T("Practice mode", "Modo de práctica")}</legend>
          <label><input type="radio" name="practiceMode" value="supported" data-mode ${mode === "supported" ? raw("checked") : ""} data-nsr-ignore /> ${I.T("Learn with help", "Aprender con ayuda")}</label>
          <label><input type="radio" name="practiceMode" value="independent" data-mode ${mode === "independent" ? raw("checked") : ""} data-nsr-ignore /> ${I.T("Try independently", "Intentar solo o sola")}</label>
          <p class="fine">${mode === "independent" ? I.T("Vocabulary, models and hints stay closed until you review. Replay and directions remain available. This is classroom practice, not a test simulation.", "El vocabulario, los modelos y las pistas permanecen cerrados hasta que revises. Puedes volver a escuchar y ver las instrucciones. Es práctica de clase, no una simulación de examen.") : I.T("Strategies and examples are available below. Help and retries are saved as supported practice.", "Abajo hay estrategias y ejemplos. La ayuda y los reintentos se guardan como práctica con apoyo.")}</p></fieldset>
        ${mode === "supported" ? html`<details class="strategy" data-help><summary>${I.T("First: try a strategy", "Primero: prueba una estrategia")}</summary><p>${learnCopy(strategyFor(cur.domain))}</p></details>${vocabHTML(a, shared, { focused: Boolean(checked.get(a.id) || writingChecks.get(a.id)) })}` : ""}
        ${!["constructed", "worksheet"].includes(a.type) && cur.record.results[a.id] ? html`<div class="fresh-attempt"><button type="button" class="btn" data-fresh-attempt>${I.T("Start a fresh independent attempt", "Empezar un intento nuevo e independiente")}</button><p class="fine">${I.T("Save a summary of this attempt and clear its selected answers. Earlier help stays in your history; this is another try at the same task.", "Guarda un resumen de este intento y borra las respuestas elegidas. La ayuda anterior queda en tu historial; es otro intento de la misma tarea.")}</p></div>` : ""}
        <p id="answerValidation" role="alert" ${validation ? "" : raw("hidden")}>${validation}</p>
        <section class="answer-zone" aria-label="${I.S("Your answer", "Tu respuesta")}">${answerZone(a)}</section>
        </div></div>
        <p class="save-explainer">${I.T("Writing and checklists save on this browser. Audio does not.", "La escritura y las listas se guardan en este navegador. El audio no.")} <a href="${BASE}/family/save">${I.T("Save & continue later", "Guardar y continuar después")}</a></p>
      </article>
      ${cur.record.results[a.id] ? html`<p class="practice-evidence"><strong>${I.T("Practice evidence:", "Evidencia de práctica:")}</strong> ${learnCopy(evidenceLabel(cur.record.results[a.id]))}. ${I.T("This is not a proficiency score.", "Esto no es una calificación del dominio del inglés.")}</p>` : ""}
      ${navHTML()}`,
  };
}

// ── interactions ──────────────────────────────────────────────────────────────
function setAnswer(a, next, ctx) {
  updateActivityAnswer(cur.record, a.id, next);
  save();
  ctx.rerender();
}

function check(a, ctx) {
  const I = i18nFor(ctx);
  const answer = answerOf(cur.record, a.id) ?? seedAnswer(a);
  if (!isAnswered(a, answer)) return;
  if (answer !== undefined && answerOf(cur.record, a.id) === undefined)
    cur.record.answers[a.id] = answer;
  const attempt = (cur.record.attempts[a.id] || 0) + 1;
  cur.record.attempts[a.id] = attempt;
  const ok = isCorrect(a, answer);
  const n = (tries.get(a.id) || 0) + 1;
  tries.set(a.id, n);
  // Learn with help: a wrong listening answer gets a rule-based trap diagnosis when one clearly applies.
  const diag = !ok && mode === "supported" && isListening(cur.domain, a) ? diagnoseListening(a, answer) : null;
  checked.set(a.id, { ok, attempt: n, reveal: ok ? "mark" : n >= 2 && mode === "supported" ? "full" : "mark", diag });
  cur.record.results[a.id] = {
    ok,
    skill: a.skill || "",
    meaningful: true,
    evidence: ok ? ((helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])) || attempt > 1 ? "supported" : "independent") : "attempted",
    supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])),
    mode,
    score: ok ? 1 : 0,
    total: 1,
    band: band(ok ? 1 : 0, 1),
    date: new Date().toISOString(),
    tries: n,
  };
  cur.record.complete = cur.record.complete.filter((id) => id !== a.id);
  if (ok) {
    cur.record.complete.push(a.id);
    award(ctx, `skill-${cur.domain.toLowerCase()}:${cur.band}:${a.id}`, 0, cur.domain);
    award(ctx, `activity:${cur.band}:${cur.domain}:${cur.level}:${a.id}`, 4, "First meaningful practice");
    const activeSession = getEngagement(ctx.prefs).activeSession;
    if (cur.playlist?.title?.toLowerCase().includes("review") || activeSession?.reviewIds?.includes(a.id)) award(ctx, `review:${cur.band}:${a.id}`, 2, "Reviewed previous work");
  }
  save();
  announce(
    ok
      ? I.S("Correct!", "¡Correcto!")
      : revealHeld(checked.get(a.id))
        ? I.S("Not yet. Replay one part before you see the answer.", "Todavía no. Vuelve a escuchar una parte antes de ver la respuesta.")
        : n >= 2 && mode === "supported"
          ? I.S("Here is the answer.", "Aquí está la respuesta.")
          : diag
            ? I.S("Not yet. Check the listening trap.", "Todavía no. Revisa la trampa de escucha.")
            : I.S("Not yet. Try again.", "Todavía no. Inténtalo otra vez."),
  );
  ctx.rerender();
}

/** Listening Strategy Lab controls (Learn with help only). Returns true when it handled the click. */
function onListeningLabClick(t, a, ctx) {
  const I = i18nFor(ctx);
  const replay = t.closest("[data-replay-seg]");
  if (replay) {
    const i = Number(String(replay.dataset.replaySeg).split(":").pop());
    const part = listeningSegments(a.script)[i];
    if (!part) return true;
    noteHelp(a.id);
    const owner = cur;
    announce(I.S(`Replaying part ${i + 1}.`, `Reproduciendo la parte ${i + 1}.`));
    speak(part.text, { rate: ctx.prefs.rate || 0.9 }).then((done) => {
      const c = checked.get(a.id);
      if (cur !== owner || !done || !c?.diag || c.diag.segment !== i || c.replayed) return;
      c.replayed = true;
      if (c.reveal === "full") announce(I.S("You replayed the key part. Here is the answer.", "Escuchaste otra vez la parte clave. Aquí está la respuesta."));
      ctx.rerender({ keepFocus: true });
    });
    return true;
  }
  const tag = t.closest("[data-tag-signal]");
  if (tag) {
    const set = listenTags.get(a.id) || new Set();
    const key = tag.dataset.tagSignal;
    set.has(key) ? set.delete(key) : set.add(key);
    listenTags.set(a.id, set);
    const word = tag.textContent.trim();
    announce(set.has(key) ? I.S(`Tagged ${word}.`, `Etiqueta puesta: ${word}.`) : I.S(`Untagged ${word}.`, `Etiqueta quitada: ${word}.`));
    ctx.rerender({ keepFocus: true });
    return true;
  }
  if (t.closest("[data-clear-listen-notes]")) {
    clearListenNotes(storage, a.id);
    for (const box of document.querySelectorAll("[data-listen-note]")) box.value = "";
    announce(I.S("Listening notes cleared.", "Notas de escucha borradas."));
    return true;
  }
  return false;
}

export function onClick(e, ctx) {
  if (!cur || loading) return;
  const I = i18nFor(ctx);
  const a = cur.activity;
  const t = e.target;

  // Tap-a-word help (passage and question words, or the Word help list)
  const gloss = t.closest("[data-gloss]");
  if (gloss && wordHelp()) {
    if (openGloss(gloss.dataset.gloss, glossary, gloss)) noteHelp(a.id);
    return true;
  }

  // Reading Audio Toolbar - Read Passage
  const readPassage = t.closest("[data-read-passage]");
  if (readPassage) {
    const passageKey = readPassage.dataset.readPassage;
    const sentences = [...document.querySelectorAll(`[data-reading-passage="${CSS.escape(passageKey)}"] .reading-sentence`)];
    if (sentences.length) {
      const texts = sentences.map((el) => el.textContent.trim());
      readPassage.classList.add("is-playing");
      speak(texts, {
        rate: ctx.prefs.rate || 0.9,
        voiceURI: ctx.prefs.readingVoice || "default",
        onSegment: (idx) => {
          sentences.forEach((el, i) => {
            el.classList.toggle("is-active-reading-sentence", i === idx);
            if (i === idx) el.setAttribute("aria-current", "true");
            else el.removeAttribute("aria-current");
          });
        },
      }).then(() => {
        readPassage.classList.remove("is-playing");
        sentences.forEach((el) => {
          el.classList.remove("is-active-reading-sentence");
          el.removeAttribute("aria-current");
        });
      });
      return true;
    }
  }

  // Reading - Evidence Notebook: pin mode, select a sentence or data point, tag it
  if (t.closest("[data-nb-pin-mode]")) {
    pinMode = !pinMode;
    picked = null;
    announce(pinMode ? I.S("Pin evidence on. Select a sentence or data point to tag it.", "Fijar evidencia activado. Elige una oración o un dato para etiquetarlo.") : I.S("Pin evidence off.", "Fijar evidencia desactivado."));
    ctx.rerender({ keepFocus: true });
    return true;
  }
  const pick = t.closest("[data-nb-pick]");
  if (pick && pinMode) {
    const key = pick.dataset.nbPick.slice(a.id.length + 1);
    const next = /^d\d+$/.test(key) ? key : Number(key);
    picked = picked === next ? null : next;
    if (picked !== null) announce(I.S("Selected. Choose Claim, Evidence, or Example.", "Elegido. Elige Afirmación, Evidencia o Ejemplo."));
    Promise.resolve(ctx.rerender({ keepFocus: true })).then(() => {
      if (picked !== null) document.querySelector("[data-nb-tag]")?.focus();
    });
    return true;
  }
  if (t.closest("[data-nb-unpick]")) {
    picked = null;
    announce(I.S("Selection cleared.", "Selección borrada."));
    ctx.rerender({ keepFocus: true });
    return true;
  }
  const tagBtn = t.closest("[data-nb-tag]");
  if (tagBtn) {
    const text = pickedText(a);
    if (!text) return true;
    const isData = typeof picked === "string";
    const { status } = pinItem(storage, { tag: tagBtn.dataset.nbTag, text, source: { id: a.id, kind: isData ? "data" : "activity", title: a.passageTitle || a.title } });
    const label = tagLabel(tagBtn.dataset.nbTag);
    const labelEs = TAG_ES[label] || label;
    const back = `[data-nb-pick="${CSS.escape(`${a.id}|${picked}`)}"]`;
    picked = null;
    announce(
      status === "full"
        ? I.S("Your notebook is full. Remove a pin in the Evidence Notebook first.", "Tu cuaderno está lleno. Primero quita un dato fijado del Cuaderno de evidencia.")
        : status === "unchanged"
          ? I.S(`Already pinned as ${label}.`, `Ya está fijado como ${labelEs}.`)
          : I.S(
              `Pinned as ${label}${storage.isVolatile ? " for this tab only" : " in your Evidence Notebook"}.`,
              `Fijado como ${labelEs}${storage.isVolatile ? " solo en esta pestaña" : " en tu Cuaderno de evidencia"}.`,
            ),
    );
    Promise.resolve(ctx.rerender({ keepFocus: true })).then(() => document.querySelector(back)?.focus());
    return true;
  }

  // Reading - Toggle Spanish Cognates (Learn with help only)
  if (t.closest("[data-toggle-cognates]") && mode === "supported") {
    showCognates = !showCognates;
    announce(showCognates ? I.S("Cognate highlighting active.", "Resaltado de cognados activado.") : I.S("Cognate highlighting off.", "Resaltado de cognados desactivado."));
    ctx.rerender({ keepFocus: true });
    return true;
  }

  // Writing - Ask AI Language Coach
  if (t.closest("[data-ask-coach]")) {
    const text = cur.record.notes[a.id] || "";
    if (!wordCount(text)) {
      validation = I.S("Write your answer or a complete draft first before asking the Language Coach.", "Primero escribe tu respuesta o un borrador completo antes de pedir ayuda al Entrenador de lenguaje.");
      ctx.rerender();
      return true;
    }
    validation = "";
    coachFeedback = analyzeResponse(text, coachOptions(a));
    const ledger = loadLedger();
    const first = !ledger.entries.some((x) => x.task === a.id && x.src === "writing");
    const used = Boolean(helpUsed.has(a.id) || cur.record.supportUsed?.[a.id]);
    appendEntry(ledger, { src: "writing", task: a.id, band: cur.band, domain: cur.domain, use: keyUseOf(a), stage: mode === "independent" && !used ? "independent" : "supported", kind: first ? "first" : "revision", supports: { bank: mode !== "independent", help: used, coach: !first }, m: coachFeedback.ledger });
    saveLedger(ledger);
    ctx.rerender({ keepFocus: true });
    announce(I.S("The Language Coach looked at your draft.", "El Entrenador de lenguaje revisó tu borrador."));
    return true;
  }

  if (isListening(cur.domain, a) && mode === "supported" && onListeningLabClick(t, a, ctx)) return true;

  const choice = !checked.get(a.id) && choiceTarget(e);
  if (choice) {
    setAnswer(a, reduceAnswer(a, answerOf(cur.record, a.id), choice), ctx);
    return true;
  }
  if (["sort", "order", "hotText"].includes(a.type) && !checked.get(a.id)) {
    const next = reduceAnswer(a, answerOf(cur.record, a.id), t);
    if (next !== undefined && !t.matches("[data-ans-choice]")) return setAnswer(a, next, ctx);
  }
  if (t.closest("[data-fresh-attempt]")) {
    if (["constructed", "worksheet"].includes(a.type)) return;
    startIndependentAttempt(cur.record, a.id);
    checked.delete(a.id); tries.delete(a.id); helpUsed.delete(a.id); listenTags.delete(a.id);
    validation = "";
    save();
    const url = new URL(location.href);
    url.searchParams.set("mode", "independent");
    url.searchParams.set("grades", cur.band);
    ctx.navigate(url.pathname + url.search, { replace: true });
    announce(I.S("Fresh attempt started. Your previous attempt summary is in your Passport portfolio.", "Empezó un intento nuevo. El resumen de tu intento anterior está en tu portafolio del Pasaporte."));
    return;
  }
  if (t.closest("[data-check]")) return check(a, ctx);
  if (t.closest("[data-retry]")) {
    checked.delete(a.id);
    ctx.rerender();
    return;
  }
  if (t.closest("[data-finish-writing]")) {
    const text = cur.record.notes[a.id] || "";
    const reflection = cur.record.reflections[a.id] || "";
    if (!wordCount(text) || !wordCount(reflection)) {
      validation = I.S("Write your answer and tell what you improved or checked first.", "Primero escribe tu respuesta y cuenta qué mejoraste o qué revisaste.");
      ctx.rerender(); return;
    }
    const revised = cur.record.drafts[a.id]?.first?.trim() !== text.trim();
    const analysis = analyzeResponse(text, coachOptions(a));
    analysis.practice = writingPracticeScore(analysis, { level: cur.level, bankAvailable: wordBank(a).length > 0 });
    writingChecks.set(a.id, analysis);
    cur.record.results[a.id] = { words: wordCount(text), meaningful: true, evidence: revised ? "revised" : "writing", mode, supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])), practice: analysis.practice, practiceBand: analysis.practice.band, date: new Date().toISOString() };
    if (!cur.record.complete.includes(a.id)) cur.record.complete.push(a.id);
    validation = ""; save(); announce(storage.isVolatile ? I.S("Reviewed writing kept in this tab. Export a Passport code before leaving.", "La escritura revisada se guardó solo en esta pestaña. Exporta un código del Pasaporte antes de salir.") : I.S("Reviewed writing saved. This is practice evidence, not a score.", "Escritura revisada guardada. Es evidencia de práctica, no un puntaje.")); ctx.rerender(); return;
  }
  if (t.closest("[data-check-writing]")) {
    const text = cur.record.notes[a.id] || "";
    if (!wordCount(text)) {
      validation = I.S("Write a word, phrase, or sentence before checking your writing.", "Escribe una palabra, una frase o una oración antes de revisar tu escritura.");
      writingChecks.delete(a.id);
      Promise.resolve(ctx.rerender()).then(() => document.querySelector("[data-note]")?.focus());
      return;
    }
    validation = "";
    cur.record.drafts[a.id] ||= { first: text };
    const result = analyzeResponse(text, coachOptions(a));
    result.practice = writingPracticeScore(result, { level: cur.level, bankAvailable: wordBank(a).length > 0 });
    writingChecks.set(a.id, result);
    cur.record.results[a.id] = {
      meaningful: true,
      evidence: "attempted",
      mode,
      supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])),
      words: result.words,
      practice: result.practice,
      practiceBand: result.practice.band,
      date: new Date().toISOString(),
    };
    // Completion is a deliberate meaning review, never a surface-feature score.
    cur.record.complete = cur.record.complete.filter((id) => id !== a.id);
    save();
    ctx.rerender();
    return;
  }
  if (t.closest("[data-save-speaking]")) {
    const checks = cur.record.selfChecks[a.id] || {};
    const n = SPEAKING_CHECKS.filter((c) => checks[c.id]).length;
    const practiced = takesFor(a.id).length > 0 || cur.record.practiced[a.id];
    if (!practiced) { validation = I.S("Record your answer or practice aloud with a partner first.", "Primero graba tu respuesta o practica en voz alta con un compañero."); ctx.rerender(); return; }
    validation = "";
    cur.record.results[a.id] = {
      meaningful: true,
      evidence: takesFor(a.id).length ? "recorded" : "speaking",
      mode,
      supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])),
      score: n,
      total: SPEAKING_CHECKS.length,
      band: practiceBand(n, SPEAKING_CHECKS.length),
      practiceBand: practiceBand(n, SPEAKING_CHECKS.length),
      practiced: Boolean(practiced),
      date: new Date().toISOString(),
    };
    cur.record.complete = cur.record.complete.filter((id) => id !== a.id);
    if (practiced && n >= 2) {
      if (!cur.record.complete.includes(a.id)) cur.record.complete.push(a.id);
      announce(storage.isVolatile ? I.S("Speaking practice kept in this tab. Export a Passport code before leaving.", "La práctica de habla se guardó solo en esta pestaña. Exporta un código del Pasaporte antes de salir.") : I.S("Speaking practice saved.", "Práctica de habla guardada."));
    } else
      announce(
        practiced
          ? I.S("Check at least two boxes on the checklist.", "Marca al menos dos casillas de la lista.")
          : I.S("Record your answer (or practice aloud) first.", "Primero graba tu respuesta (o practica en voz alta)."),
      );
    save();
    ctx.rerender();
    return;
  }
  if (t.closest("[data-mark-done]")) {
    const i = cur.record.complete.indexOf(a.id);
    i >= 0 ? cur.record.complete.splice(i, 1) : cur.record.complete.push(a.id);
    if (i < 0) cur.record.results[a.id] = { meaningful: true, evidence: "worksheet", date: new Date().toISOString() };
    else delete cur.record.results[a.id];
    save();
    ctx.rerender();
  }
}

export function onChange(e, ctx) {
  if (!cur || loading) return;
  const I = i18nFor(ctx);
  const a = cur.activity;
  const t = e.target;
  if (t.matches("[data-select-voice]")) {
    ctx.setPrefs({ readingVoice: t.value });
    announce(I.S("Reading voice updated.", "Voz de lectura actualizada."));
    ctx.rerender({ keepFocus: true });
    return;
  }
  if (t.matches("[data-mode]")) {
    const url = new URL(location.href); url.searchParams.set("mode", t.value); url.searchParams.set("grades", cur.band);
    ctx.navigate(url.pathname + url.search, { replace: true }); return;
  }
  if ((t.matches("[data-ans-choice]") || t.matches("[data-ans-cloze]")) && !checked.get(a.id)) {
    const next = reduceAnswer(a, answerOf(cur.record, a.id), t);
    if (next !== undefined) return setAnswer(a, next, ctx);
  }
  if (t.matches("[data-selfcheck]")) {
    invalidateActivity(cur.record, a.id);
    cur.record.selfChecks[a.id] = {
      ...(cur.record.selfChecks[a.id] || {}),
      [t.dataset.selfcheck]: t.checked,
    };
    save();
    ctx.rerender();
  }
  if (t.matches("[data-practiced]")) {
    invalidateActivity(cur.record, a.id);
    cur.record.practiced[a.id] = t.checked;
    save();
    ctx.rerender();
  }
}

export function onInput(e) {
  if (!cur || loading) return;
  if (e.target.matches("[data-gist]")) {
    const list = [...(gists.get(cur.activity.id) || [])];
    list[Number(e.target.dataset.gist)] = e.target.value.slice(0, 200);
    gists.set(cur.activity.id, list);
    return;
  }
  if (e.target.matches("[data-listen-note]")) {
    const notes = { ...loadListenNotes(storage, cur.activity.id), [e.target.dataset.listenNote]: e.target.value };
    saveListenNotes(storage, cur.activity.id, notes);
    return;
  }
  if (e.target.matches("[data-reflection]")) {
    if (cur.record.reflections[cur.activity.id] !== e.target.value) {
      invalidateActivity(cur.record, cur.activity.id);
      document.querySelector(".done-badge")?.remove();
      const evidence = document.querySelector(".practice-evidence");
      if (evidence) evidence.textContent = I.S("Reflection changed — review this version before marking it complete.", "La reflexión cambió — revisa esta versión antes de marcarla como completa.");
    }
    cur.record.reflections[cur.activity.id] = e.target.value; save(); return;
  }
  if (!e.target.matches("[data-note]")) return;
  const a = cur.activity;
  if (cur.domain !== "Speaking" && cur.record.notes[a.id] !== e.target.value) {
    invalidateActivity(cur.record, a.id);
    document.querySelector(".done-badge")?.remove();
    writingChecks.delete(a.id);
    const evidence = document.querySelector(".practice-evidence");
    if (evidence) evidence.textContent = I.S("Draft changed — review this version before marking it complete.", "El borrador cambió — revisa esta versión antes de marcarlo como completo.");
    const feedback = document.querySelector(".feedback");
    if (feedback) feedback.hidden = true;
  }
  cur.record.notes[a.id] = e.target.value;
  save();
  const readButton = document.querySelector("[data-read-writing]");
  if (readButton) readButton.dataset.say = e.target.value || "Write something first.";
  const meter = document.querySelector("[data-meter]");
  if (meter) {
    const goal = wordGoal(cur.level);
    const n = wordCount(e.target.value);
    meter.textContent = I.S(`${n} / about ${goal} words`, `${n} / unas ${goal} palabras`);
    const bar = document.querySelector(".meter-bar > span");
    if (bar) bar.style.width = `${Math.min(100, Math.round((n / goal) * 100))}%`;
    const usedWords = new Set(bankWordsUsed(e.target.value, wordBank(a)).map(bankKey));
    for (const li of document.querySelectorAll(".wordbank li"))
      li.classList.toggle("is-used", usedWords.has(li.textContent.split("/")[0].trim().toLowerCase()));
  }
}

/** Sentences in read-aloud mode are role=button spans: Enter and Space must work like a click. */
export function onKey(e) {
  if ((e.key === "Enter" || e.key === " ") && e.target?.matches?.(".reading-sentence[role='button']")) {
    e.preventDefault();
    e.target.click();
  }
}

export function mount(root) {
  const owner = cur;
  for (const details of root.querySelectorAll(".helpers, .strategy, .ladder, .transcript, .writing-starters")) {
    details.addEventListener("toggle", () => {
      if (details.open && details.isConnected && cur === owner) {
        helpUsed.add(cur.activity.id);
        cur.record.supportUsed ||= {};
        cur.record.supportUsed[cur.activity.id] = true;
        save();
      }
    });
  }
}

export function unmount() {
  renderGeneration++;
  loading = true;
  coachFeedback = null;
  stopSpeech();
}
