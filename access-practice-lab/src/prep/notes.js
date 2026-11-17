// Listen & Take Notes: hear a short academic talk, build notes in a frame (main idea + three details), answer
// questions from the notes alone, then see the talk with its signal words marked. Teaches the listening move the
// longer ACCESS Listening tasks reward: keep the key ideas, in short form, and use them.
import { PREP_SKILLS } from "./registry.js";
import { canSpeak, speak, stop as stopSpeech } from "../speech.js";
import { esc, html, icon, raw } from "../util.js";
import { cardRole, checkChoice, checkNotes, seededOrder } from "./model.js";
import { checkBtn, choicesHTML, hearBtn, resultHTML } from "./ui.js";

export const skill = PREP_SKILLS["notes"];
export const finishesOnLastStep = true;

const SLOTS = [
  ["main", "Main idea", "Idea principal"],
  ["d0", "Detail 1", "Detalle 1"],
  ["d1", "Detail 2", "Detalle 2"],
  ["d2", "Detail 3", "Detalle 3"],
];

const rate = (st) => (st.answers?.speed === "slow" ? 0.72 : 0.92);

function listenControls(I, set, st) {
  if (!canSpeak())
    return html`<p class="prep-note">
        ${icon("info")}
        ${I.T("This device cannot read aloud. Ask a partner or your teacher to read the talk to you, or read it below.", "Este dispositivo no puede leer en voz alta. Pide a un compañero o a tu maestro que te lea la charla, o léela abajo.")}
      </p>
      <div class="prep-transcript">${set.talk.map((p) => html`<p>${p}</p>`)}</div>`;
  const slow = st.answers?.speed === "slow";
  return html`<div class="prep-listen">
    <button type="button" class="btn btn-primary prep-play" data-prep-act="play">
      ${icon("play")}
      ${st.plays || 0 ? I.T("Play again", "Escuchar otra vez") : I.T("Play the talk", "Escuchar la charla")}
    </button>
    <button type="button" class="btn" data-prep-act="stop">
      ${icon("stop")} ${I.T("Stop", "Detener")}
    </button>
    <fieldset class="prep-speed">
      <legend>${I.T("Speed", "Velocidad")}</legend>
      <label
        ><input
          type="radio"
          name="speed"
          value="normal"
          data-prep-pick="speed"
          ${slow ? "" : raw("checked")}
          data-nsr-ignore
        />
        ${I.T("Normal", "Normal")}</label
      >
      <label
        ><input
          type="radio"
          name="speed"
          value="slow"
          data-prep-pick="speed"
          ${slow ? raw("checked") : ""}
          data-nsr-ignore
        />
        ${I.T("Slower", "Más lento")}</label
      >
    </fieldset>
    <p class="fine" aria-live="polite">
      ${st.plays || 0 ? I.T(`Played ${st.plays} ${st.plays === 1 ? "time" : "times"}.`, `Escuchada ${st.plays} ${st.plays === 1 ? "vez" : "veces"}.`) : ""}
    </p>
  </div>`;
}

const cardsInOrder = (set) => seededOrder(set.cards, set.id);
const cardText = (set, id) => set.cards.find((c) => c.id === id)?.text || "";

function notesFrameHTML(I, set, st) {
  const picks = st.answers?.notes || {};
  const res = st.checked?.notes;
  const reveal = st.reveal?.notes;
  return html`<div class="prep-notes-frame">
    <p class="prep-frame-topic"><strong>${I.T("Topic:", "Tema:")}</strong> ${set.title}</p>
    ${SLOTS.map(([k, en, es]) => {
      const ok = res?.slots?.[k];
      return html`<label
        class="prep-slot ${k === "main" ? "is-main" : ""} ${res ? (ok ? "is-right" : "is-wrong") : ""}"
      >
        <span class="prep-slot-label">${res ? icon(ok ? "check" : "x") : ""} ${I.T(en, es)}</span>
        <select
          data-prep-blank="notes:${k}"
          ${res?.ok || reveal ? raw("disabled") : ""}
          data-nsr-ignore
        >
          <option value="">${I.T("Choose a note…", "Elige una nota…")}</option>
          ${cardsInOrder(set).map((c) => html`<option value="${c.id}" ${(reveal ? revealPick(set, k) : picks[k]) === c.id ? raw("selected") : ""}>${c.text}</option>`)}
        </select>
      </label>`;
    })}
  </div>`;
}

const revealPick = (set, k) =>
  k === "main" ? set.notes.main : set.notes.details[Number(k.slice(1))];

function notesFeedback(I, set, st) {
  const res = st.checked?.notes;
  if (st.reveal?.notes)
    return resultHTML(I, {
      ok: false,
      lead: I.T(
        "Here are strong notes for this talk. Read them, then go to the next step.",
        "Estas son buenas notas para esta charla. Léelas y ve al siguiente paso.",
      ),
      action: "",
    });
  if (!res) return "";
  if (res.ok)
    return resultHTML(I, {
      ok: true,
      lead: I.T(
        "Your notes hold the main idea and three key details, in short form.",
        "Tus notas tienen la idea principal y tres detalles clave, en forma corta.",
      ),
    });
  const picks = st.answers?.notes || {};
  const tips = [];
  if (!res.slots.main) {
    const role = cardRole(set, picks.main);
    tips.push(
      role === "detail"
        ? I.T(
            "Your main idea note is one detail. The main idea is what the whole talk is about.",
            "Tu idea principal es un detalle. La idea principal es de lo que trata toda la charla.",
          )
        : I.T(
            "Check the main idea: what is the whole talk about?",
            "Revisa la idea principal: ¿de qué trata toda la charla?",
          ),
    );
  }
  for (const k of ["d0", "d1", "d2"]) {
    if (res.slots[k] || !picks[k]) continue;
    const role = cardRole(set, picks[k]);
    tips.push(
      role === "main"
        ? I.T(
            `"${cardText(set, picks[k])}" is the main idea, not a detail.`,
            `"${cardText(set, picks[k])}" es la idea principal, no un detalle.`,
          )
        : I.T(
            `"${cardText(set, picks[k])}" is not a key idea from the talk. Was it said? Was it important?`,
            `"${cardText(set, picks[k])}" no es una idea clave de la charla. ¿Se dijo? ¿Era importante?`,
          ),
    );
  }
  const tries = st.tries?.notes || 0;
  return resultHTML(I, {
    ok: false,
    lead: I.T(
      `${res.right} of 4 notes are right. Listen again for the signal words, then fix the others.`,
      `${res.right} de 4 notas están bien. Escucha otra vez las palabras señal y corrige las demás.`,
    ),
    more: html`<ul class="prep-tips">
      ${tips.map((t) => html`<li>${t}</li>`)}
    </ul>`,
    action:
      tries >= 2
        ? html`<button type="button" class="btn small" data-prep-act="reveal-notes">
            ${I.T("Show strong notes", "Mostrar buenas notas")}
          </button>`
        : "",
  });
}

function questionsHTML(I, set, st) {
  const res = st.checked?.questions;
  return html`<aside class="prep-mynotes" aria-label="${I.S("Your notes", "Tus notas")}">
      <h3>${icon("list")} ${I.T("Your notes", "Tus notas")}</h3>
      <p>
        <strong>${I.T("Main idea:", "Idea principal:")}</strong> ${cardText(set, set.notes.main)}
      </p>
      <ul>
        ${set.notes.details.map((id) => html`<li>${cardText(set, id)}</li>`)}
      </ul>
    </aside>
    ${set.questions.map((q, i) => {
      const r = res?.[i];
      return html`<div class="prep-qwrap">
        ${choicesHTML(I, { name: `q${i}`, label: html`<span class="prep-qn">${i + 1}.</span> ${q.q}`, options: q.options, picked: st.answers?.[`q${i}`], answer: q.answer, checked: r ? "mark" : null })}
        ${r ? html`<p class="prep-qres ${r.ok ? "is-right" : "is-wrong"}">${icon(r.ok ? "check" : "retry")} ${r.ok ? I.T("Right.", "Correcto.") : I.T("Not yet. Look at your notes and choose again.", "Todavía no. Mira tus notas y elige otra vez.")} ${r.ok && r.why ? r.why : ""}</p>` : ""}
      </div>`;
    })}
    ${checkBtn(
      I,
      "check-questions",
      set.questions.every((_, i) => st.answers?.[`q${i}`]),
      I.T("Check my answers", "Revisar mis respuestas"),
    )}`;
}

function markSignals(text, signal) {
  let out = esc(text);
  for (const w of signal)
    out = out.replace(
      new RegExp(`\\b(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`),
      "<mark>$1</mark>",
    );
  return raw(out);
}

export function body(I, set, st, step) {
  if (step === 0)
    return html`<p class="prep-lede">
        ${I.T(`You will hear ${set.speaker}. First, learn these words.`, `Vas a escuchar a ${set.speaker}. Primero aprende estas palabras.`)}
      </p>
      <ul class="prep-words">
        ${set.keyWords.map((k) => html`<li><button type="button" class="ghost small" data-say="${k.w}" aria-label="${I.S(`Hear ${k.w}`, `Escuchar ${k.w}`)}">${icon("volume")}</button> <strong>${k.w}</strong>: ${k.def} <span class="prep-es" lang="es">(${k.es})</span></li>`)}
      </ul>
      <h3 class="prep-sub">${I.T("Signal words", "Palabras señal")}</h3>
      <p>
        ${I.T("When you hear these words, a new idea is coming. Get ready to write a note.", "Cuando escuches estas palabras, viene una idea nueva. Prepárate para escribir una nota.")}
      </p>
      <p class="prep-signal">${set.signal.map((w) => html`<span class="sticker">${w}</span>`)}</p>
      <h3 class="prep-sub">${I.T("Good notes are short", "Las buenas notas son cortas")}</h3>
      <p>
        ${I.T("Write a few key words, not whole sentences. Keep ideas the speaker says are important. Skip small side comments.", "Escribe pocas palabras clave, no oraciones completas. Guarda las ideas que el hablante dice que son importantes. Omite los comentarios pequeños.")}
      </p>`;
  if (step === 1)
    return html`<p class="prep-lede">
        ${I.T("Listen to the whole talk. Notice the signal words. You can take notes on paper too.", "Escucha toda la charla. Fíjate en las palabras señal. También puedes tomar notas en papel.")}
      </p>
      ${listenControls(I, set, st)}`;
  if (step === 2)
    return html`<p class="prep-lede">
        ${I.T("Build your notes. Choose one main idea and three details. Some cards were not said or are not important.", "Arma tus notas. Elige una idea principal y tres detalles. Algunas tarjetas no se dijeron o no son importantes.")}
      </p>
      ${canSpeak() ? html`<p><button type="button" class="btn small" data-prep-act="play">${icon("replay")} ${I.T("Hear the talk again", "Escuchar la charla otra vez")}</button></p>` : ""}
      ${notesFrameHTML(I, set, st)}
      ${st.checked?.notes?.ok || st.reveal?.notes ? "" : checkBtn(I, "check-notes", Object.keys(st.answers?.notes || {}).filter((k) => st.answers.notes[k]).length === 4, I.T("Check my notes", "Revisar mis notas"))}
      ${notesFeedback(I, set, st)}`;
  if (step === 3)
    return html`<p class="prep-lede">
        ${I.T("The talk is over. Answer with your notes only.", "La charla terminó. Responde solo con tus notas.")}
      </p>
      ${questionsHTML(I, set, st)}`;
  const right = (st.checked?.questions || []).filter((r) => r?.ok).length;
  return html`<div class="feedback is-right" role="status">
      <p class="fb-title">${icon("check")} ${I.T("Set complete", "Conjunto completo")}</p>
      <p class="fb-lead">
        ${I.T(`You built notes and used them to answer ${right} of ${set.questions.length} questions.`, `Armaste notas y las usaste para responder ${right} de ${set.questions.length} preguntas.`)}
      </p>
    </div>
    <h3 class="prep-sub">${I.T("Say the main idea", "Di la idea principal")}</h3>
    <p class="prep-frame-line">${set.say || html`<strong>${I.T("Main idea:", "Idea principal:")}</strong> ${cardText(set, set.notes.main)}`}</p>
    <p>${hearBtn(I, set.say || cardText(set, set.notes.main), I.T("Hear it", "Escuchar"))} ${I.T("Now say it in your own words to a partner.", "Ahora dilo con tus propias palabras a un compañero.")}</p>
    <h3 class="prep-sub">
      ${I.T("The talk, with signal words marked", "La charla, con las palabras señal marcadas")}
    </h3>
    <div class="prep-transcript">
      ${set.talk.map((p) => html`<p>${markSignals(p, set.signal)}</p>`)}
    </div>
    <p>
      <button type="button" class="btn" data-prep-act="restart">
        ${icon("replay")} ${I.T("Do this set again", "Hacer este conjunto otra vez")}
      </button>
    </p>`;
}

export function ready(set, st, step) {
  if (step === 1) return !canSpeak() || (st.plays || 0) > 0;
  if (step === 2) return Boolean(st.checked?.notes?.ok || st.reveal?.notes);
  if (step === 3) return Boolean(st.checked?.questions?.every((r) => r?.ok));
  return true;
}

export function notReady(I, set, st, step) {
  if (step === 1) return I.S("Play the talk first.", "Primero escucha la charla.");
  if (step === 2) return I.S("Check your notes first.", "Primero revisa tus notas.");
  if (step === 3)
    return I.S(
      "Get every question right first. Your notes have the answers.",
      "Primero responde bien todas las preguntas. Tus notas tienen las respuestas.",
    );
  return "";
}

export function act(name, el, set, st) {
  if (name === "play") {
    st.plays = (st.plays || 0) + 1;
    speak(set.talk, { rate: rate(st) });
    return { focus: "[data-prep-act=play]" };
  }
  if (name === "stop") {
    stopSpeech();
    return { rerender: false };
  }
  if (name === "check-notes") {
    st.checked ||= {};
    st.tries = { ...(st.tries || {}), notes: (st.tries?.notes || 0) + 1 };
    const r = checkNotes(set, st.answers?.notes || {});
    st.checked.notes = r;
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-notes") {
    st.reveal = { ...(st.reveal || {}), notes: true };
    delete st.checked?.notes;
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-questions") {
    st.checked ||= {};
    st.checked.questions = set.questions.map((q, i) => checkChoice(q, st.answers?.[`q${i}`]));
    const wrong = st.checked.questions.findIndex((r) => !r?.ok);
    return { focus: wrong >= 0 ? `input[name=q${wrong}]` : "[data-prep-act=next]" };
  }
  return false;
}
