import { crumbsHTML, setComponentsI18n } from "../components.js";
import { BASE, esc, html, icon, raw, safeJson, storage } from "../util.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { VOCABULARY_ITEMS } from "../content/vocabulary-items.js";

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
  const item = taskFor(items, state);
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
              <div class="vm-actions">${checked ? html`<button class="btn btn-primary btn-domain" type="button" data-vm-next>${correct ? I.T("Next word", "Siguiente palabra") : I.T("Try this word again", "Intenta esta palabra otra vez")} ${icon("arrow-right")}</button>` : html`<button class="btn btn-primary btn-domain" type="button" data-vm-check>${I.T("Check my word", "Revisar mi palabra")}</button><button class="btn" type="button" data-vm-clear>${I.T("Clear", "Borrar")}</button>`}</div>
            </div>
          </div>
          ${
            checked
              ? correct
                ? html`<div class="feedback is-right" role="status"><p class="fb-title">${icon("check")} ${I.T("That combination works.", "Esa combinación funciona.")}</p><p>${TH(`${esc(item.parts.join(" + "))} builds <strong>${esc(item.word)}</strong>. ${esc(meansEn)}. In this sentence, the word helps the reader understand the idea precisely.`, `${esc(item.parts.join(" + "))} forma <strong>${esc(item.word)}</strong>. ${esc(meansEs)}. En esta oración, la palabra ayuda al lector a entender la idea con precisión.`)}</p><p><b>${I.T(`Use it in ${item.domain}:`, `Úsala ${DOM_AL[item.domain]}:`)}</b> ${transferPrompt(item)}</p></div>`
                : html`<div class="feedback is-hint" role="status"><p class="fb-title">${icon("bulb")} ${I.T("Check how each part changes the meaning.", "Observa cómo cada parte cambia el significado.")}</p><p>${I.T(`${quotedEn}. Try again by choosing only parts that create the target meaning. One mistake is useful information; it does not define your language ability.`, `${quotedEs}. Inténtalo de nuevo eligiendo solo las partes que crean el significado meta. Un error es información útil; no define tu capacidad con el idioma.`)}</p></div>`
              : ""
          }
        </section>

        <section class="vm-bottom-grid" aria-label="${I.S("Vocabulary connections", "Conexiones de vocabulario")}"><article class="vm-card"><span class="vm-card-icon">${icon("retry")}</span><h2>${I.T("Remember and reuse", "Recuerda y reutiliza")}</h2><p>${I.T("Words you miss return soon. Words you build correctly return after a longer interval. Your review history stays on this device.", "Las palabras que fallas vuelven pronto. Las palabras que formas bien vuelven después de más tiempo. Tu historial de repaso se queda en este dispositivo.")}</p>${reviewTrack(record, day())}</article>
          <article class="vm-card vm-link-card"><span class="vm-card-icon">${icon(item.domain.toLowerCase())}</span><h2>${I.T("Use the word in a domain", "Usa la palabra en un área")}</h2><p>${I.T("Move from word parts to communication. Practice the domain connected to this example.", "Pasa de las partes de la palabra a la comunicación. Practica el área relacionada con este ejemplo.")}</p><a class="btn vm-domain-link" href="${BASE}/${domainPath(item.domain)}?grades=${band}">${I.T(`Open ${item.domain} practice`, `Abrir práctica de ${DOM_NOUN[item.domain]}`)} ${icon("arrow-right")}</a></article></section>
        <p class="vm-note">${I.T("This activity gives feedback on a specific word-building task. It does not estimate an ACCESS result or a WIDA proficiency level.", "Esta actividad da comentarios sobre una tarea específica de formar palabras. No estima un resultado de ACCESS ni un nivel de dominio de WIDA.")}</p>
      </div>`
  };
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
  const state = saved[band] || { cursor: 0, items: {} };
  state.items ||= {};
  const item = taskFor(items, state);
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
  } else if (button.hasAttribute("data-vm-next")) {
    // Leave the word ready for its next retrieval, then move on (a miss is offered again right away).
    const retry = rec.correct !== true;
    state.items[item.id] = { ...rec, selected: [], checked: false, correct: false };
    if (retry) state.current = item.id;
    else {
      delete state.current;
      state.cursor = ((state.cursor || 0) + 1) % items.length;
    }
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
