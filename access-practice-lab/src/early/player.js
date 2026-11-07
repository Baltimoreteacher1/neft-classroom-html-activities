// The audio-first player: how a child who may not read yet does a lab activity. It is a band setting
// (src/bands.js audioFirstOn): on by default for Kindergarten, Grade 1 and Grades 2–3, available for Grades 3–5.
//
// Rules it keeps:
//   - Every direction is spoken when the activity opens (English, then Spanish in bilingual mode; Spanish first in
//     Español mode). Browsers that block speech until a tap still show the big "Hear it" button.
//   - Answer choices are pictures (emoji pictures or drawn scenes) with a speaker button that says each choice.
//   - Replay is the only help. Nothing removes a choice, and a wrong answer never reveals the right one: the child
//     hears the question again and tries again.
//   - Large targets (64px and up) and a character guide, Pepita, who "says" each direction.
//   - Speaking: an age-matched model student speaks a sample answer first, then the child records (audio stays in
//     memory, as everywhere in the lab). Writing happens on paper (grades 1–3 write on paper): the player prints a
//     handwriting sheet with the picture, the sentence frame and lines.
// It reads and writes the same practice record as the classic activity page, so Passport and the room lists count
// audio-first work too. Results are practice evidence, never a level or score.
import { audioFirstOn, BAND_INFO } from "../bands.js";
import { isCorrect } from "../grade.js";
import { isRecording } from "../recorder.js";
import { canSpeak, speak, stop as stopSpeech } from "../speech.js";
import { recorderHTML } from "../components.js";
import { asList, BASE, announce, html, icon, raw } from "../util.js";
import { GUIDE_NAME, guideSVG, sceneSVG } from "./scenes.js";

/** Activity types the audio-first player can present. Anything else opens in the classic page. */
export const EARLY_TYPES = new Set([
  "multipleChoice",
  "multiSelect",
  "order",
  "constructed",
  "worksheet",
]);

/** Should this activity open in the audio-first player? `?view=classic` always opens the classic page. */
export function usesAudioFirst(prefs, band, activity, search = "") {
  if (new URLSearchParams(search).get("view") === "classic") return false;
  return audioFirstOn(prefs, band) && EARLY_TYPES.has(activity?.type);
}

const isListening = (domain, a) => domain === "Listening" || Boolean(a.listening);
const isPaper = (domain, a) => domain === "Writing" || a.type === "worksheet";

/**
 * What the guide says when the activity opens, as language groups in speaking order:
 * [{ lang: "en-US" | "es-US", lines: [] }]. The heard Listening text is part of the English group.
 */
export function spokenPlan(a, domain, mode = "en") {
  const en = [a.directions, ...(isListening(domain, a) ? asList(a.script) : []), a.prompt].filter(
    Boolean,
  );
  const es = [a.directionsEs, a.promptEs].filter(Boolean);
  const EN = { lang: "en-US", lines: en };
  const ES = { lang: "es-US", lines: es };
  if (mode === "es" && es.length) return [ES, EN];
  if (mode === "bi" && es.length) return [EN, ES];
  return [EN];
}

// ── per-activity state (memory only; the record holds what is saved) ──────────
let st = { id: "", picks: [], checked: null, tries: 0, spokenFor: "", talking: false, said: false };
const reset = (id) => {
  st = {
    id,
    picks: [],
    checked: null,
    tries: 0,
    spokenFor: st.spokenFor,
    talking: false,
    said: false,
  };
};

async function playPlan(a, domain, prefs, I) {
  const plan = spokenPlan(a, domain, I.mode);
  st.talking = true;
  document.querySelector(".early-guide-art")?.classList.add("is-talking");
  for (const group of plan) {
    const done = await speak(group.lines, {
      lang: group.lang,
      rate: prefs.rate || 0.85,
      persona: "guide",
    });
    if (!done) break;
  }
  st.talking = false;
  document.querySelector(".early-guide-art")?.classList.remove("is-talking");
}

const sayLine = (text, prefs, lang = "en-US", extra = {}) =>
  speak(text, { lang, rate: prefs.rate || 0.85, ...extra });

// ── rendering ─────────────────────────────────────────────────────────────────
function choicesHTML(a, I) {
  const multi = a.type === "multiSelect";
  const ordered = a.type === "order";
  const list = ordered ? a.items || [] : a.options || [];
  const label = ordered
    ? I.S("Pictures to put in order", "Dibujos para poner en orden")
    : I.S("Answer choices", "Opciones de respuesta");
  return html`<div
    class="early-choices ${list.some((o) => o.scene) ? "has-scenes" : ""}"
    role="group"
    aria-label="${label}"
  >
    ${list.map((o) => {
      const at = st.picks.indexOf(o.id);
      const on = at >= 0;
      const pic = o.scene
        ? raw(sceneSVG(o.scene, I.mode === "es" ? "es" : "en"))
        : o.visual
          ? html`<span class="early-emoji" aria-hidden="true">${o.visual}</span>`
          : "";
      return html`<div class="early-choice${on ? " is-on" : ""}">
        <button
          type="button"
          class="early-pick"
          data-early-pick="${o.id}"
          aria-pressed="${on}"
          ${raw("data-nsr-ignore")}
        >
          ${ordered && on ? html`<span class="early-order-n" aria-hidden="true">${at + 1}</span>` : ""}
          ${pic}<span class="early-choice-text" lang="en">${o.text}</span>
          ${ordered && on ? html`<span class="visually-hidden">${I.S(`, number ${at + 1}`, `, número ${at + 1}`)}</span>` : ""}
        </button>
        <button
          type="button"
          class="early-hear"
          data-early-say-opt="${o.id}"
          aria-label="${I.S(`Hear: ${o.text}`, `Escuchar: ${o.text}`)}"
        >
          ${icon("volume")}
        </button>
      </div>`;
    })}
    ${multi ? html`<p class="early-note">${I.T("Choose all that fit.", "Elige todas las que sirven.")}</p>` : ""}
    ${ordered ? html`<p class="early-note">${I.T("Tap the pictures in order: first, next, last.", "Toca los dibujos en orden: primero, después, al final.")} <button type="button" class="btn small" data-early-reset>${I.T("Start over", "Empezar de nuevo")}</button></p>` : ""}
  </div>`;
}

function feedbackHTML(a, I) {
  const c = st.checked;
  if (!c) return "";
  if (c.ok)
    return html`<div class="early-feedback is-right" role="status">
      ${icon("check")}
      <p>
        <strong>${I.T("Yes! You did it.", "¡Sí! Lo lograste.")}</strong>
        <span lang="en">${a.correct || ""}</span>
      </p>
    </div>`;
  return html`<div class="early-feedback is-again" role="status">
    ${icon("volume")}
    <p>
      <strong>${I.T("Not yet.", "Todavía no.")}</strong>
      ${I.T("Listen again, then try once more. All the choices are still here.", "Escucha otra vez y vuelve a intentarlo. Todas las opciones siguen aquí.")}
    </p>
  </div>`;
}

function speakingHTML(a, cur, I) {
  const model = a.modelStudent;
  return html`<section class="early-talk" aria-labelledby="earlyTalkTitle">
    <h2 id="earlyTalkTitle">${I.T("Your turn to talk", "Tu turno para hablar")}</h2>
    ${a.taskLevel ? html`<p class="early-chip">${a.taskLevel === 1 ? I.T("Talk task 1 · name it", "Tarea oral 1 · nómbralo") : I.T("Talk task 3 · tell more", "Tarea oral 3 · cuenta más")} <span class="fine">${I.T("(practice task, not a test level)", "(tarea de práctica, no es un nivel de examen)")}</span></p>` : ""}
    ${
      model
        ? html`<div class="early-model">
            <button type="button" class="btn early-big" data-early-model>
              ${icon("speaking")}
              ${I.T(`Hear ${model.name} answer first`, `Escucha primero la respuesta de ${model.name}`)}
            </button>
            <p class="fine">
              ${I.T(`${model.name} is a student your age. Say it your own way.`, `${model.name} es un estudiante de tu edad. Dilo a tu manera.`)}
            </p>
          </div>`
        : ""
    }
    ${(a.frames || []).length ? html`<p class="early-frame"><button type="button" class="early-hear" data-early-say-text="${a.frames[0]}" aria-label="${I.S("Hear the sentence starter", "Escuchar el inicio de la oración")}">${icon("volume")}</button> <span lang="en">${a.frames[0]}</span></p>` : ""}
    ${recorderHTML(a.id, { recording: isRecording(a.id), level: cur.level })}
    <button
      type="button"
      class="btn btn-primary early-big"
      data-early-done
      aria-pressed="${st.said}"
    >
      ${icon("check")} ${I.T("I said my answer", "Dije mi respuesta")}
    </button>
  </section>`;
}

function paperHTML(a, cur, I) {
  const lines = a.paperLines || (cur.band === "K" ? 2 : cur.band === "1" ? 3 : 5);
  const bank = a.wordBank || [];
  return html`<section class="early-talk" aria-labelledby="earlyPaperTitle">
      <h2 id="earlyPaperTitle">${I.T("Write on paper", "Escribe en papel")}</h2>
      <p>
        ${I.T("Print your page, write with a pencil, then show a grown-up.", "Imprime tu página, escribe con lápiz y muéstrasela a un adulto.")}
      </p>
      ${(a.frames || []).length ? html`<p class="early-frame"><button type="button" class="early-hear" data-early-say-text="${a.frames[0]}" aria-label="${I.S("Hear the sentence starter", "Escuchar el inicio de la oración")}">${icon("volume")}</button> <span lang="en">${a.frames[0]}</span></p>` : ""}
      <p class="early-actions">
        <button type="button" class="btn early-big" data-early-print>
          ${icon("print")} ${I.T("Print my writing page", "Imprimir mi página de escritura")}
        </button>
        <button
          type="button"
          class="btn btn-primary early-big"
          data-early-done
          aria-pressed="${st.said}"
        >
          ${icon("check")} ${I.T("I wrote it on paper", "Lo escribí en papel")}
        </button>
      </p>
    </section>
    <section class="early-paper" aria-hidden="true">
      <p class="early-paper-name">Name: ____________________ &nbsp; Date: __________</p>
      <h2 lang="en">${a.title}</h2>
      ${a.scene ? raw(sceneSVG(a.scene)) : ""}
      <p lang="en">${a.prompt || ""}</p>
      ${bank.length ? html`<p class="early-paper-bank" lang="en">Word bank: ${bank.join(" · ")}</p>` : ""}
      ${(a.frames || []).length ? html`<p class="early-paper-frame" lang="en">${a.frames[0]}</p>` : ""}
      ${Array.from({ length: lines }, () => html`<div class="early-paper-line"></div>`)}
    </section>`;
}

function stageHTML(a, cur, I) {
  const listening = isListening(cur.domain, a);
  const passage = asList(a.passage);
  return html`${a.scene ? html`<figure class="early-scene">${raw(sceneSVG(a.scene, I.mode === "es" ? "es" : "en"))}</figure>` : ""}
  ${listening ? html`<p class="early-actions"><button type="button" class="btn early-big" data-early-story>${icon("listening")} ${I.T("Hear the story again", "Escuchar el cuento otra vez")}</button></p>` : ""}
  ${
    !listening && passage.length
      ? html`<div class="early-passage" lang="en">
          ${passage.map((p) => html`<button type="button" class="early-sentence" data-early-say-text="${p}">${p}</button>`)}
          <p class="fine">
            ${I.T("Tap a sentence to hear it.", "Toca una oración para escucharla.")}
          </p>
        </div>`
      : ""
  }`;
}

export function render(ctx, I, cur, { nav = "" } = {}) {
  const a = cur.activity;
  if (st.id !== a.id) reset(a.id);
  const info = BAND_INFO[cur.band] || {};
  const done = cur.record.complete.includes(a.id);
  const speaking =
    cur.domain === "Speaking" || (a.type === "constructed" && !isPaper(cur.domain, a));
  const paper = isPaper(cur.domain, a);
  const answerable = !speaking && !paper;
  const bubble = I.mode === "es" && a.directionsEs ? a.directionsEs : a.directions;
  return {
    title: a.title,
    html: html`<article
        class="early-player d-${cur.domain.toLowerCase()}"
        data-early-player="${a.id}"
      >
        <header class="early-head">
          <p class="early-context">
            ${icon(cur.domain.toLowerCase())}
            <span
              >${I.T(info.label || cur.band, info.labelEs || cur.band)} ·
              ${I.T(cur.domain, { Listening: "Escuchar", Reading: "Leer", Speaking: "Hablar", Writing: "Escribir" }[cur.domain] || cur.domain)}</span
            >
          </p>
          <h1 tabindex="-1">
            ${a.title}${done ? html` <span class="done-badge">${icon("check")} ${I.T("Done", "Hecho")}</span>` : ""}
          </h1>
          <p class="early-switch">
            <a class="btn small" href="${BASE}/early?grades=${info.picker || cur.band}"
              >${I.T("My practice home", "Mi página de práctica")}</a
            >
            <button type="button" class="btn small" data-early-toggle aria-pressed="true">
              ${I.T("Audio-first mode: on", "Modo de audio primero: activado")}
            </button>
          </p>
        </header>
        <div class="early-guide">
          ${raw(guideSVG({ talking: st.talking }))}
          <div class="early-bubble">
            <p class="early-guide-name">${GUIDE_NAME}</p>
            <p lang="${I.mode === "es" && a.directionsEs ? "es" : "en"}">${bubble}</p>
          </div>
          <button type="button" class="btn btn-primary early-big early-replay" data-early-replay>
            ${icon("volume")}
            ${canSpeak() ? I.T("Hear it again", "Escuchar otra vez") : I.T("Ask a grown-up to read", "Pide a un adulto que lea")}
          </button>
        </div>
        ${stageHTML(a, cur, I)}
        ${a.prompt && !paper ? html`<p class="early-prompt"><span lang="en">${a.prompt}</span></p>` : ""}
        ${
          answerable
            ? html`${choicesHTML(a, I)}
                <p class="early-actions">
                  <button
                    type="button"
                    class="btn btn-primary early-big"
                    data-early-check
                    ${st.picks.length ? "" : raw("disabled")}
                  >
                    ${icon("check")} ${I.T("Check", "Revisar")}
                  </button>
                </p>
                ${feedbackHTML(a, I)}`
            : ""
        }
        ${speaking ? speakingHTML(a, cur, I) : ""} ${paper ? paperHTML(a, cur, I) : ""}
        <p class="fine early-honest">
          ${I.T("Practice only. Replay is the only help, and it never removes a choice. This is not a test score or level.", "Solo práctica. Volver a escuchar es la única ayuda y nunca quita una opción. No es una calificación ni un nivel de examen.")}
        </p>
      </article>
    ${nav}`,
  };
}

// ── interactions ──────────────────────────────────────────────────────────────
function record(cur, save, result) {
  cur.record.results[cur.activity.id] = {
    ...result,
    mode: "audio-first",
    date: new Date().toISOString(),
    skill: cur.activity.skill || "",
  };
  cur.record.complete = cur.record.complete.filter((id) => id !== cur.activity.id);
  if (result.ok || result.practiced) cur.record.complete.push(cur.activity.id);
  save();
}

function answerFor(a) {
  if (a.type === "multipleChoice") return st.picks[0];
  return [...st.picks];
}

/** Returns true when it handled the click. */
export function onClick(e, ctx, I, cur, save) {
  const t = e.target;
  const a = cur.activity;
  const prefs = ctx.prefs;
  if (t.closest("[data-early-replay]")) {
    playPlan(a, cur.domain, prefs, I);
    return true;
  }
  if (t.closest("[data-early-story]")) {
    sayLine(asList(a.script), prefs);
    return true;
  }
  const opt = t.closest("[data-early-say-opt]");
  if (opt) {
    const o = [...(a.options || []), ...(a.items || [])].find(
      (x) => x.id === opt.dataset.earlySayOpt,
    );
    if (o) sayLine(o.text, prefs);
    return true;
  }
  const line = t.closest("[data-early-say-text]");
  if (line) {
    sayLine(line.dataset.earlySayText, prefs);
    return true;
  }
  if (t.closest("[data-early-model]")) {
    const m = a.modelStudent;
    if (m) sayLine(m.text, prefs, "en-US", { persona: "student", pitch: m.pitch || 1.3 });
    return true;
  }
  const pick = t.closest("[data-early-pick]");
  if (pick) {
    const id = pick.dataset.earlyPick;
    if (a.type === "multipleChoice") st.picks = [id];
    else if (a.type === "order") st.picks = st.picks.includes(id) ? st.picks : [...st.picks, id];
    else st.picks = st.picks.includes(id) ? st.picks.filter((x) => x !== id) : [...st.picks, id];
    st.checked = null;
    const o = [...(a.options || []), ...(a.items || [])].find((x) => x.id === id);
    if (o && canSpeak()) sayLine(o.text, prefs);
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-early-reset]")) {
    st.picks = [];
    st.checked = null;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-early-check]")) {
    if (!st.picks.length) return true;
    if (a.type === "order" && st.picks.length < (a.items || []).length) {
      announce(I.S("Tap every picture first.", "Primero toca todos los dibujos."));
      sayLine(
        I.mode === "es" ? "Primero toca todos los dibujos." : "Tap every picture first.",
        prefs,
        I.mode === "es" ? "es-US" : "en-US",
      );
      return true;
    }
    const ok = isCorrect(a, answerFor(a));
    st.tries += 1;
    st.checked = { ok };
    record(cur, save, {
      ok,
      meaningful: true,
      evidence: ok ? (st.tries > 1 ? "supported" : "independent") : "attempted",
      supportUsed: st.tries > 1,
      score: ok ? 1 : 0,
      total: 1,
      tries: st.tries,
    });
    const en = ok
      ? `Yes! ${a.correct || "You did it."}`
      : "Not yet. Listen again, then try once more.";
    const es = ok ? "¡Sí! Lo lograste." : "Todavía no. Escucha otra vez y vuelve a intentarlo.";
    announce(
      I.S(
        ok ? "Correct!" : "Not yet. Try again.",
        ok ? "¡Correcto!" : "Todavía no. Inténtalo otra vez.",
      ),
    );
    ctx.rerender();
    if (I.mode === "es") sayLine(es, prefs, "es-US");
    else sayLine(en, prefs);
    return true;
  }
  if (t.closest("[data-early-done]")) {
    st.said = true;
    record(cur, save, {
      ok: false,
      practiced: true,
      meaningful: true,
      evidence: "practiced",
      score: 0,
      total: 0,
    });
    announce(I.S("Saved. Great work!", "Guardado. ¡Buen trabajo!"));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-early-print]")) {
    document.documentElement.classList.add("early-printing");
    try {
      window.print();
    } finally {
      setTimeout(() => document.documentElement.classList.remove("early-printing"), 500);
    }
    return true;
  }
  if (t.closest("[data-early-toggle]")) {
    stopSpeech();
    ctx.setPrefs({ audioFirst: { ...(prefs.audioFirst || {}), [cur.band]: false } });
    announce(I.S("Audio-first mode is off.", "El modo de audio primero está desactivado."));
    ctx.rerender();
    return true;
  }
  return false;
}

/** Speak the directions once when an activity opens (the replay button repeats them). */
export function mount(root, ctx, I, cur) {
  const a = cur.activity;
  if (st.spokenFor === a.id || !canSpeak()) return;
  st.spokenFor = a.id;
  setTimeout(() => {
    if (document.querySelector(`[data-early-player="${CSS.escape(a.id)}"]`))
      playPlan(a, cur.domain, ctx.prefs, I);
  }, 250);
}

export function unmount() {
  st.spokenFor = "";
  stopSpeech();
}
