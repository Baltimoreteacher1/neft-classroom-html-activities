// Speaking and writing task blocks (used by lesson steps and by the performance task) and the performance-task page.
// Supports (frames, word bank, model) sit in disclosures; nothing here scores the learner's work.
import { recorderHTML } from "../components.js";
import { isRecording } from "../recorder.js";
import { speak } from "../speech.js";
import { disclosure } from "../studio-ui.js";
import { announce, html, icon, todayISO, wordCount } from "../util.js";
import { setTaskStep } from "../lang/units.js";
import { barHTML, progressFor, recOf, unitCrumbs, unitsHref } from "./units-common.js";

const PURPOSE_ES = {
  Inform: "Informar",
  Explain: "Explicar",
  Argue: "Argumentar",
  Narrate: "Narrar",
};
const BAND_NAMES = [
  ["Getting started", "Empezando"],
  ["Building", "En desarrollo"],
  ["Strong", "Sólido"],
];

const purposeChip = (I, t) =>
  html`<span class="un-chip">${icon("sparkle")} ${I.T(t.purpose, PURPOSE_ES[t.purpose])}</span>`;

function checksHTML(I, rec, t) {
  const ticked = new Set(rec.checks[t.id] || []);
  return html`<fieldset class="un-checks">
    <legend>${I.T("Check my work", "Revisar mi trabajo")}</legend>
    ${t.checks.map((c, i) => html`<label class="un-check"><input type="checkbox" data-u-check="${t.id}|${i}" ${ticked.has(i) ? "checked" : ""} /> <span>${I.TO(c)}</span></label>`)}
  </fieldset>`;
}

function supportsHTML(I, unit, t, { bank = false } = {}) {
  const id = `un-${unit.id}-${t.id}`;
  return html`${disclosure(
    `${id}-frames`,
    I.T("Sentence starters", "Inicios de oración"),
    html`<ul class="un-frames">
      ${t.frames.map((f) => html`<li>${I.TO(f)}</li>`)}
    </ul>`,
    { open: true },
  )}
  ${
    bank
      ? disclosure(
          `${id}-bank`,
          I.T(
            "Word bank (tap a word to add it)",
            "Banco de palabras (toca una palabra para agregarla)",
          ),
          html`<ul class="un-bank">
            ${t.bank.map((w) => html`<li><button type="button" class="gloss-chip" data-u-insert="${t.id}|${w.en}">${I.T(w.en, w.es)}</button></li>`)}
          </ul>`,
        )
      : ""
  }
  ${disclosure(
    `${id}-model`,
    I.T("See a sample after you try", "Mira un ejemplo después de intentar"),
    html`<p class="un-model" lang="en">${t.model.en}</p>
      ${I.mode !== "en" ? html`<p class="un-model" lang="es">${t.model.es}</p>` : ""}
      <p>
        <button type="button" class="ghost small" data-say="${t.model.en}">
          ${icon("volume")} ${I.T("Hear the sample", "Escuchar el ejemplo")}
        </button>
      </p>
      <p class="fine">
        ${I.T("A sample is one way to do it, not the only way.", "Un ejemplo es una manera de hacerlo, no la única.")}
      </p>`,
  )}`;
}

export function writeBlock(I, session, unit, rec, t) {
  const text = rec.text[t.id] || "";
  const n = wordCount(text);
  return html`<div class="un-task-block" data-kind="write">
    <p>${purposeChip(I, t)} <strong>${I.TO(t.title)}</strong></p>
    <p class="un-prompt">${I.TO(t.prompt)}</p>
    ${supportsHTML(I, unit, t, { bank: true })}
    <label class="un-label" for="draft-${t.id}">${I.T("My writing", "Mi escritura")}</label>
    <textarea
      id="draft-${t.id}"
      class="un-textarea"
      rows="8"
      data-u-draft="${t.id}"
      lang="en"
      spellcheck="true"
    >
${text}</textarea>
    <p class="fine" id="count-${t.id}" data-u-count="${t.id}|${t.goalWords}" aria-live="off">
      ${I.T(`${n} words. Aim for about ${t.goalWords}. This is a guide, not a score.`, `${n} palabras. Intenta escribir unas ${t.goalWords}. Es una guía, no una calificación.`)}
    </p>
    <p class="row-actions">
      <button type="button" class="ghost" data-u-readback="${t.id}">
        ${icon("volume")} ${I.T("Hear my writing", "Escuchar mi escritura")}
      </button>
    </p>
    ${checksHTML(I, rec, t)}
  </div>`;
}

export function speakBlock(I, session, unit, rec, t) {
  const key = `unit:${unit.id}:${t.id}`;
  return html`<div class="un-task-block" data-kind="speak">
    <p>${purposeChip(I, t)} <strong>${I.TO(t.title)}</strong></p>
    <p class="un-prompt">${I.TO(t.prompt)}</p>
    ${supportsHTML(I, unit, t)}
    ${recorderHTML(key, { prompt: t.prompt.en, recording: isRecording(key), i18n: I })}
    ${checksHTML(I, rec, t)}
  </div>`;
}

/** Can the learner mark this speaking or writing step finished? (A self-check, a few words: never a quality judgment.) */
export const taskReady = (rec, t, kind) =>
  kind === "write" ? wordCount(rec.text[t.id]) >= 8 : (rec.checks[t.id] || []).length > 0;

function rubricHTML(I, unit, rec) {
  return html`<fieldset class="un-rubric">
    <legend>${I.T("Where is my work now?", "¿En qué punto está mi trabajo?")}</legend>
    <p class="fine">
      ${I.T("Read each row. Pick the sentence that describes your work today. This is your own reflection, not a grade.", "Lee cada fila. Elige la oración que describe tu trabajo hoy. Es tu propia reflexión, no una nota.")}
    </p>
    ${unit.task.rubric.map(
      (r, c) =>
        html`<div class="un-rubric-row" role="radiogroup" aria-label="${I.pick(r.name)}">
          <p class="un-rubric-name">${I.TO(r.name)}</p>
          ${r.levels.map((l, i) => html`<label class="un-rubric-opt ${rec.task.rubric[c] === i ? "is-picked" : ""}"><input type="radio" name="rub-${c}" data-u-rubric="${c}|${i}" ${rec.task.rubric[c] === i ? "checked" : ""} /><span class="un-rubric-band">${I.T(...BAND_NAMES[i])}</span><span>${I.TO(l)}</span></label>`)}
        </div>`,
    )}
  </fieldset>`;
}

export function taskPageHTML(I, session, unit) {
  const { band } = session;
  const rec = recOf(session, unit.id);
  const T = unit.task;
  const p = progressFor(session, unit);
  const ready =
    rec.task.steps.length === T.steps.length &&
    Object.keys(rec.task.rubric).length === T.rubric.length;
  return html`${unitCrumbs(I, band, unit, I.S("Project", "Proyecto"))}
    <article class="un un-accent-${unit.accent} un-lesson">
      <header class="un-hero">
        <div class="un-hero-copy">
          <p class="eyebrow">
            ${icon("flag")} ${I.T("Performance task", "Tarea de desempeño")} · ${I.TO(unit.title)}
          </p>
          <h1 tabindex="-1">${I.TO(T.title)}</h1>
          <p class="lead">${I.TO(T.prompt)}</p>
          <dl class="un-dl">
            <div>
              <dt>${I.T("You make", "Tú creas")}</dt>
              <dd>${I.TO(T.product)}</dd>
            </div>
            <div>
              <dt>${I.T("Who it is for", "Para quién es")}</dt>
              <dd>${I.TO(T.audience)}</dd>
            </div>
            <div>
              <dt>${I.T("How you share it", "Cómo lo compartes")}</dt>
              <dd>${I.TO(T.share)}</dd>
            </div>
          </dl>
        </div>
      </header>
      <section class="panel un-step" aria-labelledby="tPlan">
        <h2 id="tPlan">${I.T("1. My plan", "1. Mi plan")}</h2>
        <ul class="un-checks">
          ${T.steps.map(
            (s, i) =>
              html`<li>
                <label class="un-check"
                  ><input
                    type="checkbox"
                    data-u-taskstep="${i}"
                    ${rec.task.steps.includes(i) ? "checked" : ""}
                  />
                  <span>${I.TO(s)}</span></label
                >
              </li>`,
          )}
        </ul>
        ${barHTML(I, rec.task.steps.length, T.steps.length, I.S("Plan", "Plan"))}
      </section>
      <section class="panel un-step" aria-labelledby="tWrite">
        <h2 id="tWrite">${I.T("2. Write it", "2. Escríbelo")}</h2>
        ${writeBlock(I, session, unit, rec, T.write)}
      </section>
      <section class="panel un-step" aria-labelledby="tSpeak">
        <h2 id="tSpeak">${I.T("3. Say it to your audience", "3. Díselo a tu público")}</h2>
        ${speakBlock(I, session, unit, rec, T.speak)}
      </section>
      <section class="panel un-step" aria-labelledby="tRubric">
        <h2 id="tRubric">${I.T("4. Check it against the rubric", "4. Revísalo con la rúbrica")}</h2>
        ${rubricHTML(I, unit, rec)}
      </section>
      <section class="panel un-finish" aria-labelledby="tFinish">
        <h2 id="tFinish">${I.T("5. Share and finish", "5. Comparte y termina")}</h2>
        ${rec.task.done ? html`<p class="un-done">${icon("check")} ${I.T("Project finished. Well done.", "Proyecto terminado. Bien hecho.")}</p>` : html`<p>${ready ? I.T("Ready? Share your project with your audience, then press the button.", "¿Listo? Comparte tu proyecto con tu público y luego pulsa el botón.") : I.T("Tick every plan step and pick a sentence in every rubric row to finish.", "Marca cada paso del plan y elige una oración en cada fila de la rúbrica para terminar.")}</p>`}
        <p class="row-actions">
          ${rec.task.done ? html`<button type="button" class="btn" data-u-finish="undo">${I.T("Reopen the project", "Reabrir el proyecto")}</button>` : html`<button type="button" class="btn btn-primary" data-u-finish="done" ${ready ? "" : "disabled"}>${icon("check")} ${I.T("I shared my project", "Compartí mi proyecto")}</button>`}
          ${p.complete ? html`<button type="button" class="btn btn-primary" data-u-claim>${icon("medal")} ${I.T(rec.cert ? "See my certificate" : "Get my certificate", rec.cert ? "Ver mi certificado" : "Recibir mi certificado")}</button>` : ""}
          <a class="btn" href="${unitsHref(band, unit.id)}"
            >${I.T("Back to the unit", "Volver a la unidad")}</a
          >
        </p>
      </section>
    </article>`;
}

// ── handlers ────────────────────────────────────────────────────────────────────────────────────
const find = (unit, id) =>
  [...unit.speaking, ...unit.writing, unit.task.speak, unit.task.write].find((t) => t.id === id);

export function taskClick(e, ctx, cur) {
  const { session, unit, I } = cur;
  const rec = recOf(session, unit.id);
  const ins = e.target.closest("[data-u-insert]");
  if (ins) {
    const [id, word] = ins.dataset.uInsert.split("|");
    const box = document.getElementById(`draft-${id}`);
    if (box) {
      box.value = `${box.value}${box.value && !/\s$/.test(box.value) ? " " : ""}${word} `;
      rec.text[id] = box.value.slice(0, 4000);
      session.save();
      box.dispatchEvent(new Event("input", { bubbles: true }));
      box.focus();
    }
    return true;
  }
  const read = e.target.closest("[data-u-readback]");
  if (read) {
    const text =
      rec.text[read.dataset.uReadback] ||
      document.getElementById(`draft-${read.dataset.uReadback}`)?.value ||
      "";
    if (text.trim()) speak(text, { rate: ctx.prefs.rate });
    else
      announce(
        I.S(
          "Write a little first, then listen to it.",
          "Escribe un poco primero y luego escúchalo.",
        ),
      );
    return true;
  }
  const fin = e.target.closest("[data-u-finish]");
  if (fin) {
    rec.task.done = fin.dataset.uFinish === "done";
    session.save();
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-u-claim]")) {
    rec.cert ||= { name: "", at: todayISO() };
    session.save();
    ctx.navigate(unitsHref(session.band, unit.id, "certificate"));
    return true;
  }
  return false;
}

export function taskChange(e, ctx, cur) {
  const { session, unit } = cur;
  const rec = recOf(session, unit.id);
  const chk = e.target.closest("[data-u-check]");
  if (chk) {
    const [id, i] = chk.dataset.uCheck.split("|");
    if (!find(unit, id)) return;
    const set = new Set(rec.checks[id] || []);
    if (chk.checked) set.add(Number(i));
    else set.delete(Number(i));
    rec.checks[id] = [...set].sort((a, b) => a - b);
    session.save();
    ctx.rerender();
    return;
  }
  const ts = e.target.closest("[data-u-taskstep]");
  if (ts) {
    setTaskStep(rec, Number(ts.dataset.uTaskstep), ts.checked);
    session.save();
    ctx.rerender();
    return;
  }
  const rub = e.target.closest("[data-u-rubric]");
  if (rub) {
    const [c, l] = rub.dataset.uRubric.split("|").map(Number);
    rec.task.rubric[c] = l;
    session.save();
    ctx.rerender();
  }
}

export function taskInput(e, _ctx, cur) {
  const { session, unit, I } = cur;
  const box = e.target.closest("[data-u-draft]");
  if (!box) return false;
  const id = box.dataset.uDraft;
  recOf(session, unit.id).text[id] = box.value.slice(0, 4000);
  session.save();
  const count = document.querySelector(`[data-u-count^="${id}|"]`);
  if (count) {
    const goal = count.dataset.uCount.split("|")[1];
    const n = wordCount(box.value);
    count.textContent = I.S(
      `${n} words. Aim for about ${goal}. This is a guide, not a score.`,
      `${n} palabras. Intenta escribir unas ${goal}. Es una guía, no una calificación.`,
    );
  }
  return true;
}
