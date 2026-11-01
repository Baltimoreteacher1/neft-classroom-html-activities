import { crumbsHTML, setComponentsI18n } from "../components.js";
import { BASE, esc, html, icon, raw, safeJson, storage } from "../util.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { VOCABULARY_ITEMS } from "../content/vocabulary-items.js";
import { clearWeeklyGoal, GOAL_CHOICES, recordWeeklyCorrect, setWeeklyGoal, weeklyProgress } from "../word-goal.js";
import {
  advanceSprint,
  clockText,
  closeSprint,
  recordSprintAnswer,
  sprintStatus,
  sprintWordId,
  startSprint,
} from "../word-sprint.js";

const KEY = "accessPracticeLab:v1:vocabulary-morphology";
const day = () => Math.floor(Date.now() / 86400000);
const readState = () => {
  const raw = safeJson(storage.get(KEY), {});
  return raw && typeof raw === "object" ? raw : {};
};
const bandKey = (band) => band === "3-5" ? "3-5" : "6-8";
const taskFor = (items, state) => {
  // A word that was just checked stays on screen (with its feedback) until the learner moves on.
  const shown = items.find((item) => item.id === state.current);
  if (shown) return shown;
  const due = items.filter((item) => (state.items?.[item.id]?.due ?? 0) <= day());
  const pool = due.length ? due : items;
  const idx = Math.max(0, Number(state.cursor || 0)) % pool.length;
  return pool[idx];
};
// While a Word Sprint runs, its word is the one on screen; otherwise the normal review order applies.
const currentItem = (items, state, now) => {
  if (sprintStatus(state.sprint, now) === "running") return items.find((row) => row.id === sprintWordId(state.sprint));
  return taskFor(items, state);
};
let sprintTick = null;
// Redraws only the clock each quarter second and re-renders once when time runs out. Stops when the clock leaves the page.
function watchSprint(ctx, sprint) {
  clearInterval(sprintTick);
  if (sprintStatus(sprint, Date.now()) !== "running") return;
  sprintTick = setInterval(() => {
    const clock = document.querySelector("[data-vm-clock]");
    if (!clock) return clearInterval(sprintTick);
    const left = sprint.deadline - Date.now();
    if (left <= 0) {
      clearInterval(sprintTick);
      ctx.rerender();
      return;
    }
    clock.textContent = clockText(left);
  }, 250);
}

// Chrome strings are localized through I (set at the top of render); words, meanings and contexts stay English.
let I = makeI18n("en");
const DOM_ES = { Listening: "Escuchar", Reading: "Leer", Speaking: "Hablar", Writing: "Escribir" };
const DOM_AL = { Listening: "al escuchar", Reading: "al leer", Speaking: "al hablar", Writing: "al escribir" };
const DOM_NOUN = { Listening: "escucha", Reading: "lectura", Speaking: "expresión oral", Writing: "escritura" };
// Like I.T, for a sentence that carries its own markup. Both sides are HTML strings already escaped by the caller.
const TH = (en, es) =>
  I.bilingual
    ? raw(`<span class="bi-pair">${en}<span class="bi-es" lang="es">${es}</span></span>`)
    : I.spanish
      ? raw(I.pageLang !== "es" ? `<span lang="es">${es}</span>` : es)
      : raw(en);

function reviewTrack(record, today) {
  const steps = [
    [I.T("Tomorrow", "Mañana"), I.T("after a miss", "después de un error")],
    [I.T("In 3 days", "En 3 días"), I.T("first correct build", "primera construcción correcta")],
    [I.T("In 7 days", "En 7 días"), I.T("correct again", "correcta otra vez")],
  ];
  const level = record.checked ? (record.correct ? Math.min(record.streak || 1, 2) : 0) : -1;
  const when = record.due != null && record.checked ? record.due - today : null;
  return html`<ol class="vm-review-track" aria-label="${I.S("Review spacing", "Espaciado del repaso")}">
      ${steps.map(([label, note], i) => html`<li class="${i === level ? "is-here" : ""}"><span class="vm-review-dot" aria-hidden="true"></span><strong>${label}</strong><small>${note}</small></li>`)}
    </ol>
    <p class="fine">${when == null ? I.T("Your review history stays on this device.", "Tu historial de repaso se queda en este dispositivo.") : I.T(`This word returns in ${when} ${when === 1 ? "day" : "days"}.`, `Esta palabra vuelve en ${when} ${when === 1 ? "día" : "días"}.`)}</p>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  const band = bandKey(ctx.band);
  const items = VOCABULARY_ITEMS[band];
  const saved = readState();
  const state = saved[band] || {};
  const now = Date.now();
  const sprint = state.sprint;
  const sprintRunning = sprintStatus(sprint, now) === "running";
  const item = currentItem(items, state, now);
  watchSprint(ctx, sprint);
  const weekly = weeklyProgress(state, new Date(now));
  const record = state.items?.[item.id] || {};
  const selected = Array.isArray(record.selected) ? record.selected : [];
  const checked = record.checked === true;
  const correct = record.correct === true;
  const dueCount = items.filter((row) => (state.items?.[row.id]?.due ?? 0) <= day()).length;
  const contextLine = raw(esc(item.context).replace(new RegExp(`\\b${item.word}\\b`, "i"), `<strong>${item.word}</strong>`));
  const selectedParts = selected.map((part, i) => html`${i ? html`<span class="vm-join" aria-hidden="true">+</span>` : ""}<span class="vm-chip">${part}</span>`);
  const lettered = item.choices.map((part, i) => {
    const order = selected.indexOf(part);
    return html`<button type="button" class="vm-part ${order >= 0 ? "is-selected" : ""}" data-vm-part="${part}" aria-pressed="${order >= 0}">
      <span class="vm-part-letter">${order >= 0 ? order + 1 : String.fromCharCode(65 + i)}</span>
      <span class="vm-part-text">${part}</span>
      <small>${item.meanings[part]}</small>
    </button>`;
  });
  const domEs = DOM_ES[item.domain];
  const meansEn = item.parts.map((part) => `${part} means “${item.meanings[part]}”`).join("; ");
  const meansEs = item.parts.map((part) => `${part} significa “${item.meanings[part]}”`).join("; ");
  const quotedEn = item.parts.map((part) => `“${part}” means ${item.meanings[part]}`).join("; ");
  const quotedEs = item.parts.map((part) => `“${part}” significa ${item.meanings[part]}`).join("; ");

  return {
    title: I.S("Word Builder · Vocabulary & Morphology", "Constructor de palabras · Vocabulario y morfología"),
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`], [I.S("Vocabulary & Morphology", "Vocabulario y morfología"), null]])}
      <div class="vm-studio d-reading">
        <header class="vm-hero">
          <div class="vm-hero-copy"><p class="vm-kicker">${icon("words")} ${I.T(`Word study · ${band === "3-5" ? "Grades 3–5" : "Grades 6–8"}`, `Estudio de palabras · ${band === "3-5" ? "Grados 3–5" : "Grados 6–8"}`)}</p>
            <h1 tabindex="-1">${I.T("Word Builder", "Constructor de palabras")}</h1>
            <p>${I.T("Investigate how meaningful word parts work together. Build an attested academic word, use its context, and return to it later for retrieval practice.", "Investiga cómo trabajan juntas las partes de las palabras con significado. Forma una palabra académica real, usa su contexto y vuelve a ella más tarde para practicar recordarla.")}</p>
            <div class="vm-hero-meta"><span>${icon("calendar")} ${I.T("Today:", "Hoy:")} <b>${I.T(`${dueCount} ${dueCount === 1 ? "word" : "words"} ready to review`, `${dueCount} ${dueCount === 1 ? "palabra lista" : "palabras listas"} para repasar`)}</b></span><span>${icon("save")} ${I.T("Saved on this device", "Guardado en este dispositivo")}</span></div>
          </div>
          <div class="vm-word-art" aria-hidden="true"><span class="vm-tile">${I.S("prefix", "prefijo")}</span><span class="vm-word-plus">+</span><span class="vm-tile tile-b">${I.S("root", "raíz")}</span><span class="vm-word-plus">+</span><span class="vm-tile tile-c">${I.S("suffix", "sufijo")}</span><span class="vm-art-caption">${I.S("parts → meaning → use", "partes → significado → uso")}</span></div>
        </header>
        ${sprintBlock(sprint, now, state.sprintBest)}
        ${goalBlock(weekly)}

        <section class="vm-workbench d-${item.domain.toLowerCase()}" aria-labelledby="vm-title">
          <div class="vm-progress-row"><span class="lx-pill">${icon(item.domain.toLowerCase())} ${I.T("Word investigation", "Investigación de palabras")}</span><span class="vm-step-detail">${item.focus} · ${item.keyUse} · ${I.T(item.domain, domEs)}</span></div>
          <h2 id="vm-title">${item.prompt}</h2>
          <div class="vm-grid">
            <div class="vm-left">
              <p class="vm-label">${I.T("In context", "En contexto")}</p>
              <p class="vm-context">${contextLine}</p>
              <div class="vm-hint-wrap"><button class="btn vm-hint" type="button" data-vm-hint aria-expanded="false">${icon("bulb")} ${I.T("Show word-part clues", "Mostrar pistas de las partes")}</button>
                <div class="vm-hint-panel" data-vm-hint-panel hidden><b>${I.T("Look closely at the context.", "Observa bien el contexto.")}</b> ${item.parts.map((part) => html`<span class="vm-hint-chip">${part}: ${item.meanings[part]}</span>`)}</div></div>
            </div>
            <div class="vm-right">
              <div class="vm-build-area"><div class="vm-build-label">${I.T("Your word", "Tu palabra")}</div><div class="vm-build-slots" aria-live="polite">${selectedParts.length ? selectedParts : html`<span class="vm-empty">${I.T("Choose the parts that build the target word.", "Elige las partes que forman la palabra meta.")}</span>`}</div>
                <div class="vm-target">${I.T("Meaning goal", "Meta de significado")} <span>${item.word.replace(/[a-z]/g, "•")}</span></div>
              </div>
              <fieldset class="vm-parts-field" ${checked ? "disabled" : ""}><legend>${I.T("Choose and arrange the word parts", "Elige y ordena las partes de la palabra")}</legend><div class="vm-parts-grid">${lettered}</div></fieldset>
              <div class="vm-actions">${checked ? html`<button class="btn btn-primary btn-domain" type="button" data-vm-next>${correct || sprintRunning ? I.T("Next word", "Siguiente palabra") : I.T("Try this word again", "Intenta esta palabra otra vez")} ${icon("arrow-right")}</button>` : html`<button class="btn btn-primary btn-domain" type="button" data-vm-check>${I.T("Check my word", "Revisar mi palabra")}</button><button class="btn" type="button" data-vm-clear>${I.T("Clear", "Borrar")}</button>`}</div>
            </div>
          </div>
          ${
            checked
              ? correct
                ? html`<div class="feedback is-right" role="status"><p class="fb-title">${icon("check")} ${I.T("That combination works.", "Esa combinación funciona.")}</p><p>${TH(`${esc(item.parts.join(" + "))} builds <strong>${esc(item.word)}</strong>. ${esc(meansEn)}. In this sentence, the word helps the reader understand the idea precisely.`, `${esc(item.parts.join(" + "))} forma <strong>${esc(item.word)}</strong>. ${esc(meansEs)}. En esta oración, la palabra ayuda al lector a entender la idea con precisión.`)}</p><p><b>${I.T(`Use it in ${item.domain}:`, `Úsala ${DOM_AL[item.domain]}:`)}</b> ${transferPrompt(item)}</p></div>`
                : sprintRunning ? sprintMissFeedback(item, quotedEn, quotedEs) : html`<div class="feedback is-hint" role="status"><p class="fb-title">${icon("bulb")} ${I.T("Check how each part changes the meaning.", "Observa cómo cada parte cambia el significado.")}</p><p>${I.T(`${quotedEn}. Try again by choosing only parts that create the target meaning. One mistake is useful information; it does not define your language ability.`, `${quotedEs}. Inténtalo de nuevo eligiendo solo las partes que crean el significado meta. Un error es información útil; no define tu capacidad con el idioma.`)}</p></div>`
              : ""
          }
        </section>

        <section class="vm-bottom-grid" aria-label="${I.S("Vocabulary connections", "Conexiones de vocabulario")}"><article class="vm-card"><span class="vm-card-icon">${icon("retry")}</span><h2>${I.T("Remember and reuse", "Recuerda y reutiliza")}</h2><p>${I.T("Words you miss return soon. Words you build correctly return after a longer interval. Your review history stays on this device.", "Las palabras que fallas vuelven pronto. Las palabras que formas bien vuelven después de más tiempo. Tu historial de repaso se queda en este dispositivo.")}</p>${reviewTrack(record, day())}</article>
          <article class="vm-card vm-link-card"><span class="vm-card-icon">${icon(item.domain.toLowerCase())}</span><h2>${I.T("Use the word in a domain", "Usa la palabra en un área")}</h2><p>${I.T("Move from word parts to communication. Practice the domain connected to this example.", "Pasa de las partes de la palabra a la comunicación. Practica el área relacionada con este ejemplo.")}</p><a class="btn vm-domain-link" href="${BASE}/${domainPath(item.domain)}?grades=${band}">${I.T(`Open ${item.domain} practice`, `Abrir práctica de ${DOM_NOUN[item.domain]}`)} ${icon("arrow-right")}</a></article></section>
        <p class="vm-note">${I.T("This activity gives feedback on a specific word-building task. It does not estimate an ACCESS result or a WIDA proficiency level.", "Esta actividad da comentarios sobre una tarea específica de formar palabras. No estima un resultado de ACCESS ni un nivel de dominio de WIDA.")}</p>
      </div>`
  };
}

function sprintBlock(sprint, now, savedBest) {
  const status = sprintStatus(sprint, now);
  if (status === "running") {
    return html`<section class="vm-sprint is-running" aria-label="${I.S("Word Sprint in progress", "Sprint de palabras en curso")}">
      <p class="vm-sprint-line"><span class="vm-sprint-clock" data-vm-clock>${clockText(sprint.deadline - now)}</span> <b>${sprint.correct}</b> ${I.T("correct", "correctas")} · ${I.T(`${sprint.answered} answered`, `${sprint.answered} respondidas`)}</p>
    </section>`;
  }
  const best = Math.max(savedBest || 0, status === "over" ? sprint.correct : 0);
  const bestLine = best
    ? I.T(`Your best on this device: ${best} correct in one sprint.`, `Tu mejor resultado en este dispositivo: ${best} correctas en un sprint.`)
    : I.T("Your best score stays on this device.", "Tu mejor resultado se queda en este dispositivo.");
  if (status === "over") {
    return html`<section class="vm-sprint is-over" role="status" aria-labelledby="vm-sprint-title">
      <h2 id="vm-sprint-title">${I.T("Time is up", "Se acabó el tiempo")}</h2>
      <p>${I.T(`You built ${sprint.correct} of ${sprint.answered} words correctly in 60 seconds.`, `Formaste ${sprint.correct} de ${sprint.answered} palabras correctamente en 60 segundos.`)}</p>
      <p class="fine">${bestLine}</p>
      <div class="vm-actions"><button class="btn btn-primary btn-domain" type="button" data-vm-sprint-start>${I.T("Play again", "Jugar otra vez")} ${icon("arrow-right")}</button><button class="btn" type="button" data-vm-sprint-finish>${I.T("Done", "Listo")}</button></div>
    </section>`;
  }
  return html`<section class="vm-sprint" aria-labelledby="vm-sprint-title">
    <div>
      <h2 id="vm-sprint-title">${I.T("Word Sprint", "Sprint de palabras")}</h2>
      <p>${I.T("Build as many words as you can in 60 seconds. One try per word; a miss returns tomorrow. The timer keeps running if you leave this page.", "Forma tantas palabras como puedas en 60 segundos. Una oportunidad por palabra; un error vuelve mañana. El cronómetro sigue si sales de esta página.")}</p>
      <p class="fine">${bestLine}</p>
    </div>
    <button class="btn btn-primary btn-domain" type="button" data-vm-sprint-start>${I.T("Start Word Sprint", "Empezar el sprint")} ${icon("arrow-right")}</button>
  </section>`;
}

function goalBlock(weekly) {
  if (weekly.goal == null) {
    return html`<section class="vm-goal" aria-labelledby="vm-goal-title">
      <h2 id="vm-goal-title">${I.T("This week's word goal", "Meta de palabras de esta semana")}</h2>
      <p>${I.T("Pick how many words you want to build correctly this week. Your progress stays on this device.", "Elige cuántas palabras quieres formar correctamente esta semana. Tu progreso se queda en este dispositivo.")}</p>
      <div class="vm-goal-choices">${GOAL_CHOICES.map((n) => html`<button class="btn" type="button" data-vm-goal="${n}">${n} ${I.T("words", "palabras")}</button>`)}</div>
    </section>`;
  }
  const count = Math.min(weekly.count, weekly.goal);
  const done = weekly.count >= weekly.goal;
  return html`<section class="vm-goal" aria-labelledby="vm-goal-title">
    <div>
      <h2 id="vm-goal-title">${I.T("This week's word goal", "Meta de palabras de esta semana")}</h2>
      <p><b>${count}</b> ${I.T(`of ${weekly.goal} correct words`, `de ${weekly.goal} palabras correctas`)}${done ? html` · <span>${I.T("Goal reached this week.", "Meta cumplida esta semana.")}</span>` : ""}</p>
      <progress max="${weekly.goal}" value="${count}" aria-label="${I.S("Words built this week", "Palabras formadas esta semana")}"></progress>
    </div>
    <button class="btn" type="button" data-vm-goal-change>${I.T("Change goal", "Cambiar meta")}</button>
  </section>`;
}

function sprintMissFeedback(item, quotedEn, quotedEs) {
  return html`<div class="feedback is-hint" role="status"><p class="fb-title">${icon("bulb")} ${I.T("Not this one. Here is the answer.", "Esta no. Aquí está la respuesta.")}</p><p>${I.T(`The word is “${item.word}”. ${quotedEn}.`, `La palabra es “${item.word}”. ${quotedEs}.`)}</p></div>`;
}

function transferPrompt(item) {
  const w = item.word;
  const prompts = {
    Listening: I.T(`Listen for the word “${w}” in directions or an explanation. What does it help you understand?`, `Escucha la palabra “${w}” en instrucciones o en una explicación. ¿Qué te ayuda a entender?`),
    Reading: I.T(`Find or imagine another sentence with “${w}.” What context clue would help a reader infer its meaning?`, `Busca o imagina otra oración con “${w}.” ¿Qué pista del contexto ayudaría a un lector a deducir su significado?`),
    Speaking: I.T(`Say a sentence with “${w}” that explains or supports an idea.`, `Di una oración con “${w}” que explique o apoye una idea.`),
    Writing: I.T(`Write one sentence with “${w}” that explains the context above.`, `Escribe una oración con “${w}” que explique el contexto de arriba.`)
  };
  return prompts[item.domain];
}
function domainPath(domain) { return ({ Listening:"listen", Reading:"read", Speaking:"speak", Writing:"write" })[domain]; }

export function onClick(event, ctx) {
  const button = event.target.closest("button");
  if (!button) return false;
  const band = bandKey(ctx.band);
  const items = VOCABULARY_ITEMS[band];
  const saved = readState();
  let state = saved[band] || { cursor: 0, items: {} };
  state.items ||= {};
  const now = Date.now();
  const sprintRunning = sprintStatus(state.sprint, now) === "running";
  const item = currentItem(items, state, now);
  const rec = state.items[item.id] || { selected: [] };
  if (button.hasAttribute("data-vm-part") && !rec.checked) {
    const part = button.dataset.vmPart;
    rec.selected = rec.selected.includes(part) ? rec.selected.filter((p) => p !== part) : [...rec.selected, part];
    state.items[item.id] = rec;
  } else if (button.hasAttribute("data-vm-clear")) {
    rec.selected = [];
    state.items[item.id] = rec;
  } else if (button.hasAttribute("data-vm-check")) {
    const answer = item.parts;
    const selected = rec.selected || [];
    const correct = selected.length === answer.length && selected.every((part, idx) => part === answer[idx]);
    rec.checked = true;
    rec.correct = correct;
    rec.attempts = (rec.attempts || 0) + 1;
    rec.lastSeen = day();
    // Simple, inspectable retrieval spacing: a miss returns tomorrow; successful
    // retrievals expand to 3, then 7 days. Not a proficiency score.
    rec.streak = correct ? (rec.streak || 0) + 1 : 0;
    rec.due = day() + (correct ? (rec.streak === 1 ? 3 : 7) : 1);
    state.items[item.id] = rec;
    state.current = item.id;
    if (sprintRunning) state.sprint = recordSprintAnswer(state.sprint, correct);
    if (correct) state = recordWeeklyCorrect(state, new Date(now));
  } else if (button.hasAttribute("data-vm-next")) {
    // Leave the word ready for its next retrieval, then move on (a miss is offered again right away).
    const retry = rec.correct !== true;
    state.items[item.id] = { ...rec, selected: [], checked: false, correct: false };
    if (sprintRunning) {
      delete state.current;
      state.sprint = advanceSprint(state.sprint);
    } else if (retry) state.current = item.id;
    else {
      delete state.current;
      state.cursor = ((state.cursor || 0) + 1) % items.length;
    }
  } else if (button.hasAttribute("data-vm-goal")) {
    state = setWeeklyGoal(state, Number(button.dataset.vmGoal), new Date(now));
  } else if (button.hasAttribute("data-vm-goal-change")) {
    state = clearWeeklyGoal(state);
  } else if (button.hasAttribute("data-vm-sprint-start")) {
    state = closeSprint(state);
    delete state.current;
    state.sprint = startSprint(items, now);
  } else if (button.hasAttribute("data-vm-sprint-finish")) {
    state = closeSprint(state);
  } else if (button.hasAttribute("data-vm-hint")) {
    const panel = document.querySelector("[data-vm-hint-panel]");
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    if (panel) panel.hidden = !open;
    return true;
  } else return false;
  saved[band] = state;
  storage.set(KEY, JSON.stringify(saved));
  ctx.rerender();
  return true;
}
