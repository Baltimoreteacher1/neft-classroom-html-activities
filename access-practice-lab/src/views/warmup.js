// Daily Language Warm-Up (/warmup): a five-minute routine, new every day, with no timers.
//   1 Word of the day (picture, audio, Spanish)  2 Listening mini-clip  3 Quick-write with a frame  4 Speaking rehearsal
// Each step saves by itself. A calm week of seven pips shows where work happened; nothing is a streak to protect.
// Practice only: no score, no level, no prediction. State lives in prefs.warmup (src/lang/warmup.js).
import { crumbsHTML } from "../components.js";
import { award } from "../engagement.js";
import { loadWarmup } from "../content.js";
import { i18nFor } from "../i18n.js";
import {
  SPEAK_CHECKS,
  addDays,
  doneCount,
  getWarmup,
  isComplete,
  isISODate,
  stepsDone,
  tierOf,
  fileOf,
  updateDay,
  usesWord,
  warmupFor,
  weekRhythm,
  weeksInARow,
  dayKey,
  cleanDay,
} from "../lang/warmup.js";
import { practiceDays } from "../store.js";
import { THEME_NAMES, themeSVG } from "../warmup-art.js";
import { BASE, announce, formatDate, html, icon, raw, todayISO } from "../util.js";

// Interface state that must survive a re-render but is not worth saving: the chosen answer and the draft sentence.
const ui = { key: "", picked: -1, feedback: "", draft: null };
const STEP_LABEL = {
  word: ["Word of the day", "Palabra del día", "reading"],
  listen: ["Listen", "Escuchar", "listening"],
  write: ["Quick-write", "Escritura rápida", "writing"],
  speak: ["Say it", "Dilo en voz alta", "speaking"],
};

export const dateFor = (ctx) => (isISODate(ctx.route?.date) ? ctx.route.date : todayISO());

/** The week of seven pips. Shared by the warm-up page and the Collection Book. */
export function rhythmHTML(I, state, practice = practiceDays()) {
  const week = weekRhythm(state, practice);
  const n = week.count;
  const names = [
    ["Mon", "lun"],
    ["Tue", "mar"],
    ["Wed", "mié"],
    ["Thu", "jue"],
    ["Fri", "vie"],
    ["Sat", "sáb"],
    ["Sun", "dom"],
  ];
  const label = {
    full: ["all four steps", "los cuatro pasos"],
    some: ["some steps", "algunos pasos"],
    none: ["no warm-up", "sin calentamiento"],
    other: ["other practice", "otra práctica"],
  };
  const weeks = weeksInARow(state, practice);
  return html`<section class="panel wu-rhythm" aria-labelledby="wuRhythmTitle">
    <h2 id="wuRhythmTitle">${I.T("My week", "Mi semana")}</h2>
    <ol class="wu-pips">
      ${week.days.map((d, i) => {
        const kind = d.status === "none" && d.other ? "other" : d.status;
        return html`<li class="wu-pip is-${kind}${d.today ? " is-today" : ""}">
          <span class="wu-pip-dot" aria-hidden="true"
            >${d.status === "full" ? icon("check") : ""}</span
          >
          <span class="wu-pip-day" aria-hidden="true">${I.S(names[i][0], names[i][1])}</span>
          <span class="visually-hidden"
            >${I.S(`${names[i][0]}: ${label[kind][0]}${d.today ? ", today" : ""}`, `${names[i][1]}: ${label[kind][1]}${d.today ? ", hoy" : ""}`)}</span
          >
        </li>`;
      })}
    </ol>
    <p>
      ${n ? I.T(`You showed up on ${n} ${n === 1 ? "day" : "days"} this week.`, `Practicaste ${n} ${n === 1 ? "día" : "días"} esta semana.`) : I.T("A new week starts fresh. Begin whenever you like.", "Una semana nueva empieza desde cero. Empieza cuando quieras.")}
    </p>
    <p class="fine">
      ${weeks > 1 ? I.T(`${weeks} weeks in a row with some practice. `, `${weeks} semanas seguidas con algo de práctica. `) : ""}${I.T("Any number of days is a good number. Rest days count too, and a week off never takes anything away.", "Cualquier cantidad de días está bien. Los días de descanso también cuentan y una semana sin practicar nunca quita nada.")}
    </p>
  </section>`;
}

const stepHead = (I, step, done, n) => {
  const [en, es, skill] = STEP_LABEL[step];
  return html`<header class="wu-step-head">
    <span class="wu-step-n" aria-hidden="true">${n}</span>
    <h2 id="wuStep-${step}">${I.T(en, es)}</h2>
    ${done ? html`<span class="wu-done">${icon("check")} ${I.T("Done", "Hecho")}</span>` : ""}
    <span class="visually-hidden" data-skill="${skill}"></span>
  </header>`;
};

function wordStep(ctx, I, w, day, done) {
  const e = w.entry;
  const [tn, tes] = THEME_NAMES[e.th] || THEME_NAMES.story;
  return html`<section
    class="panel wu-step d-reading ${done ? "is-done" : ""}"
    aria-labelledby="wuStep-word"
  >
    ${stepHead(I, "word", done, 1)}
    <div class="wu-word">
      <figure class="wu-figure">
        ${raw(themeSVG(e.th))}
        <figcaption class="fine">
          ${I.T(`Picture theme: ${tn}`, `Tema del dibujo: ${tes}`)}
        </figcaption>
      </figure>
      <div class="wu-word-body">
        <p class="wu-the-word" lang="en">${e.w}</p>
        <p class="wu-es" lang="es">${icon("language")} <strong>${e.es}</strong></p>
        <p lang="en" class="wu-def">${e.def}.</p>
        <p class="wu-ex" lang="en">${I.T("Example:", "Ejemplo:")} <em>${e.ex}</em></p>
        <div class="row-actions">
          <button type="button" class="btn" data-say="${e.w}">
            ${icon("volume")} ${I.T("Hear the word", "Escuchar la palabra")}
          </button>
          <button type="button" class="btn" data-say="${e.ex}">
            ${icon("volume")} ${I.T("Hear the sentence", "Escuchar la oración")}
          </button>
          <button type="button" class="btn ghost wu-es-audio" data-say-es="${e.es}">
            ${icon("volume")} ${I.T("Hear it in Spanish", "Escucharla en español")}
          </button>
        </div>
      </div>
    </div>
    ${done ? "" : html`<button type="button" class="btn btn-primary" data-wu="word">${icon("check")} ${I.T("I met this word", "Conocí esta palabra")}</button>`}
  </section>`;
}

function listenStep(ctx, I, w, day, done) {
  const e = w.entry;
  const picked = ui.key === `${w.tier}|${w.iso}` ? ui.picked : -1;
  const shown = done ? w.correct : picked;
  return html`<section
    class="panel wu-step d-listening ${done ? "is-done" : ""}"
    aria-labelledby="wuStep-listen"
  >
    ${stepHead(I, "listen", done, 2)}
    <p>
      ${I.T("Play the clip as many times as you like. Then answer one question.", "Escucha el audio las veces que quieras. Luego responde una pregunta.")}
    </p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-say="${e.clip}">
        ${icon("play")} ${I.T("Play the clip", "Reproducir el audio")}
      </button>
      <button type="button" class="btn ghost" data-stop-audio>
        ${icon("stop")} ${I.T("Stop", "Detener")}
      </button>
    </div>
    <fieldset class="wu-q">
      <legend lang="en">${e.q}</legend>
      ${w.options.map(
        (opt, i) =>
          html`<label
            class="wu-opt${shown === i ? " is-picked" : ""}${done && i === w.correct ? " is-right" : ""}"
          >
            <input
              type="radio"
              name="wuListen"
              value="${i}"
              ${shown === i ? "checked" : ""}
              ${done ? "disabled" : ""}
            />
            <span lang="en">${opt}</span>
          </label>`,
      )}
    </fieldset>
    ${done ? "" : html`<div class="row-actions"><button type="button" class="btn btn-primary" data-wu="check">${icon("check")} ${I.T("Check my answer", "Revisar mi respuesta")}</button></div>`}
    <p class="feedback-line" role="status" aria-live="polite">
      ${done ? I.T("Yes. The clip says that. Well listened.", "Sí. El audio lo dice. Muy bien escuchado.") : ui.key === `${w.tier}|${w.iso}` ? ui.feedback : ""}
    </p>
    <details class="wu-support" data-wu-read>
      <summary data-wu-read>
        ${I.T("Need help? Read the words", "¿Necesitas ayuda? Lee las palabras")}
      </summary>
      <p lang="en">${e.clip}</p>
      <p lang="es" class="fine">${e.clipEs}</p>
      <p class="fine">
        ${I.T("Using the words counts as support. It stays in your record as supported practice.", "Usar las palabras cuenta como apoyo. Queda en tu registro como práctica con apoyo.")}
      </p>
    </details>
  </section>`;
}

function writeStep(ctx, I, w, day, done) {
  const key = `${w.tier}|${w.iso}`;
  const text = ui.key === key && ui.draft !== null ? ui.draft : day.q.text;
  const saved = day.q.text.trim() && text === day.q.text;
  const used = usesWord(day.q.text, w.entry.w);
  return html`<section
    class="panel wu-step d-writing ${done ? "is-done" : ""}"
    aria-labelledby="wuStep-write"
  >
    ${stepHead(I, "write", done, 3)}
    <p>
      ${I.T("Finish the sentence with your own idea. Use at least three words.", "Termina la oración con tu propia idea. Usa al menos tres palabras.")}
    </p>
    <p class="wu-frame" lang="en">${w.frame}</p>
    <label class="field" for="wuText"
      ><span class="visually-hidden">${I.S("My sentence", "Mi oración")}</span></label
    >
    <textarea
      id="wuText"
      class="wu-text"
      lang="en"
      rows="3"
      maxlength="400"
      data-wu-text
      placeholder="${I.S("Write here", "Escribe aquí")}"
    >
${text}</textarea>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-wu="save">
        ${icon("save")} ${I.T("Save my sentence", "Guardar mi oración")}
      </button>
      ${saved ? html`<span class="wu-saved" role="status">${icon("check")} ${I.T("Saved on this device", "Guardada en este dispositivo")}</span>` : ""}
    </div>
    ${saved ? html`<p class="fine" role="status">${used ? I.T(`You used the word "${w.entry.w}". Read your sentence aloud in the next step.`, `Usaste la palabra "${w.entry.w}". Lee tu oración en voz alta en el siguiente paso.`) : I.T(`Try to use "${w.entry.w}" in your sentence. You can change it and save again.`, `Intenta usar "${w.entry.w}" en tu oración. Puedes cambiarla y guardar otra vez.`)}</p>` : ""}
  </section>`;
}

function speakStep(ctx, I, w, day, done) {
  const young = w.tier === "K-1";
  const r = w.say;
  const line = day.q.text.trim() || w.entry.ex;
  return html`<section
    class="panel wu-step d-speaking ${done ? "is-done" : ""}"
    aria-labelledby="wuStep-speak"
  >
    ${stepHead(I, "speak", done, 4)}
    <p>${young ? I.T(r.kidEn, r.kidEs) : I.T(r.en, r.es)}</p>
    <p class="wu-frame" lang="en">${r.id === "model" ? w.entry.ex : line}</p>
    <div class="row-actions">
      <button type="button" class="btn" data-say="${r.id === "model" ? w.entry.ex : line}">
        ${icon("volume")} ${I.T("Hear the sentence", "Escuchar la oración")}
      </button>
    </div>
    <fieldset class="wu-checks">
      <legend>
        ${I.T("When you have said it, check what you did", "Cuando lo hayas dicho, marca lo que hiciste")}
      </legend>
      ${SPEAK_CHECKS.map((c, i) => html`<label class="wu-check"><input type="checkbox" data-wu-check="${i}" ${day.s.checks.includes(i) ? "checked" : ""} /> <span>${I.T(c.en, c.es)}</span></label>`)}
    </fieldset>
    ${done ? "" : html`<button type="button" class="btn btn-primary" data-wu="speak">${icon("check")} ${I.T("I practiced saying it", "Practiqué decirlo")}</button>`}
    <p class="fine">
      ${I.T("This is a rehearsal for you. Nothing is recorded or scored.", "Este es un ensayo para ti. No se graba ni se califica nada.")}
    </p>
  </section>`;
}

function finishPanel(ctx, I, band) {
  const q = `?grades=${band}`;
  return html`<section class="panel wu-finish" role="status" aria-labelledby="wuDone">
    <h2 id="wuDone">
      ${icon("sparkle")} ${I.T("Your warm-up is complete.", "Tu calentamiento está completo.")}
    </h2>
    <p>
      ${I.T("Nice work. A new warm-up is ready tomorrow, and the days you skip never count against you.", "Buen trabajo. Mañana hay un calentamiento nuevo y los días que no practiques nunca cuentan en tu contra.")}
    </p>
    <div class="row-actions">
      <a class="btn btn-primary" href="${BASE}/library${q}"
        >${icon("reading")} ${I.T("Keep practicing", "Seguir practicando")}</a
      >
      <a class="btn" href="${BASE}/collection${q}"
        >${icon("medal")} ${I.T("My collection book", "Mi libro de colección")}</a
      >
      <a class="btn" href="${BASE}/portfolio${q}"
        >${icon("passport")} ${I.T("My portfolio", "Mi portafolio")}</a
      >
    </div>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = ctx.band;
  const iso = dateFor(ctx);
  const tier = tierOf(band);
  const title = I.S("Daily Language Warm-Up", "Calentamiento diario de lenguaje");
  let data;
  try {
    data = await loadWarmup(fileOf(tier));
  } catch {
    return {
      title,
      html: html`<section class="panel empty-state" role="alert">
        <h1 tabindex="-1">${I.T("The warm-up did not load.", "El calentamiento no se cargó.")}</h1>
        <p>
          ${I.T("Check your internet connection, then try again.", "Revisa tu conexión a internet y vuelve a intentarlo.")}
        </p>
        <a class="btn btn-primary" href="${BASE}/warmup?grades=${band}"
          >${I.T("Try again", "Intentar de nuevo")}</a
        >
      </section>`,
    };
  }
  const w = warmupFor(data, band, iso);
  const state = getWarmup(ctx.prefs);
  const day = cleanDay(state.days[dayKey(band, iso)]);
  const steps = stepsDone(day);
  const n = doneCount(day);
  const today = todayISO();
  const complete = isComplete(day);
  const q = `?grades=${band}`;
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/${q}`],
        [title, null],
      ])}
      <article class="wu-page" aria-labelledby="wuTitle">
        <header class="wu-head">
          <p class="eyebrow">
            ${I.T("About five minutes · no timer", "Unos cinco minutos · sin cronómetro")}
          </p>
          <h1 id="wuTitle" tabindex="-1">
            ${I.T("Daily Language Warm-Up", "Calentamiento diario de lenguaje")}
          </h1>
          <p class="lead">
            ${I.T("A new word, a short listen, one sentence and one rehearsal. Work in any order, and stop whenever you need to.", "Una palabra nueva, una escucha corta, una oración y un ensayo. Trabaja en cualquier orden y para cuando lo necesites.")}
          </p>
          <p class="fine" aria-live="polite">
            ${formatDate(iso, { weekday: "long", month: "long", day: "numeric" })} ·
            ${I.T(`${n} of 4 steps`, `${n} de 4 pasos`)}${iso !== today ? " · " + I.S("a past or future day", "otro día") : ""}
          </p>
          <p class="wu-nav fine">
            <a href="${BASE}/warmup?date=${addDays(iso, -1)}&grades=${band}"
              >${icon("arrow-left")} ${I.T("Yesterday's warm-up", "El calentamiento de ayer")}</a
            >
            ${iso !== today ? html` · <a href="${BASE}/warmup?grades=${band}">${I.T("Back to today", "Volver a hoy")}</a>` : ""}
          </p>
        </header>
        ${rhythmHTML(I, state)}
        <ol class="wu-steps">
          <li>${wordStep(ctx, I, w, day, steps.word)}</li>
          <li>${listenStep(ctx, I, w, day, steps.listen)}</li>
          <li>${writeStep(ctx, I, w, day, steps.write)}</li>
          <li>${speakStep(ctx, I, w, day, steps.speak)}</li>
        </ol>
        ${complete ? finishPanel(ctx, I, band) : ""}
        <p class="fine wu-note">
          ${I.T("The warm-up is practice. It is not a test, and it does not estimate an ACCESS result. Your sentences stay on this device.", "El calentamiento es práctica. No es una prueba ni estima un resultado de ACCESS. Tus oraciones se quedan en este dispositivo.")}
        </p>
      </article>`,
  };
}

function save(ctx, patch) {
  const iso = dateFor(ctx);
  const warmup = updateDay(ctx.prefs, ctx.band, iso, patch);
  ctx.setPrefs({ warmup });
  return { warmup, day: cleanDay(warmup.days[dayKey(ctx.band, iso)]), iso };
}

/** A finished warm-up can add a collection-book badge; the book loads only then. A failure here never blocks the warm-up. */
async function checkBadges(ctx, I) {
  try {
    const [{ loadExperience }, { recordNewBadges }] = await Promise.all([import("../experience-data.js"), import("./collection.js")]);
    recordNewBadges(ctx, await loadExperience(ctx), I);
  } catch {}
}

/** After a step, give the day's idempotent practice credit once all four steps are done. */
function finishIfComplete(ctx, day, iso, I) {
  if (!isComplete(day)) return;
  award(ctx, `warmup:${tierOf(ctx.band)}:${iso}`, 4, "Daily warm-up");
  announce(I.S("Warm-up complete. Nice work.", "Calentamiento completo. Buen trabajo."), { tone: "success" });
  checkBadges(ctx, I);
}

export async function onClick(e, ctx) {
  const I = i18nFor(ctx);
  const t = e.target;
  const iso = dateFor(ctx);
  const tier = tierOf(ctx.band);
  const key = `${tier}|${iso}`;
  const step = t.closest("[data-wu]")?.dataset.wu;
  if (t.closest("summary[data-wu-read]")) {
    const day = cleanDay(getWarmup(ctx.prefs).days[dayKey(ctx.band, iso)]);
    if (!day.l.read) save(ctx, { l: { ...day.l, read: 1 } });
    return false;
  }
  if (!step) return false;
  const data = await loadWarmup(fileOf(tier));
  const w = warmupFor(data, ctx.band, iso);
  if (step === "word") {
    const r = save(ctx, { w: 1 });
    announce(I.S("Word saved. Next: listen.", "Palabra guardada. Siguiente: escuchar."));
    finishIfComplete(ctx, r.day, iso, I);
  } else if (step === "check") {
    if (ui.key !== key || ui.picked < 0) {
      announce(I.S("Choose an answer first.", "Elige una respuesta primero."));
      return true;
    }
    const day = cleanDay(getWarmup(ctx.prefs).days[dayKey(ctx.band, iso)]);
    const right = ui.picked === w.correct;
    const r = save(ctx, { l: { ...day.l, ok: right ? 1 : day.l.ok, tries: day.l.tries + 1 } });
    if (right) {
      ui.feedback = "";
      finishIfComplete(ctx, r.day, iso, I);
    } else {
      ui.feedback = I.S(
        "Not yet. Play the clip again and listen for the detail in the question.",
        "Todavía no. Escucha el audio otra vez y busca el detalle de la pregunta.",
      );
      announce(ui.feedback);
    }
  } else if (step === "save") {
    const text = String(
      ui.key === key && ui.draft !== null
        ? ui.draft
        : document.getElementById("wuText")?.value || "",
    )
      .trim()
      .slice(0, 400);
    const r = save(ctx, { q: { text } });
    ui.draft = null;
    const enough = stepsDone(r.day).write;
    announce(
      enough
        ? I.S("Sentence saved.", "Oración guardada.")
        : I.S("Add at least three words, then save.", "Añade al menos tres palabras y guarda."),
    );
    if (enough) finishIfComplete(ctx, r.day, iso, I);
  } else if (step === "speak") {
    const day = cleanDay(getWarmup(ctx.prefs).days[dayKey(ctx.band, iso)]);
    if (!day.s.checks.length) {
      announce(
        I.S(
          "Check at least one box when you have said it.",
          "Marca al menos una casilla cuando lo hayas dicho.",
        ),
      );
      return true;
    }
    const r = save(ctx, { s: { ...day.s, done: 1 } });
    announce(I.S("Speaking rehearsal saved.", "Ensayo de expresión oral guardado."));
    finishIfComplete(ctx, r.day, iso, I);
  }
  ctx.rerender();
  return true;
}

export function onChange(e, ctx) {
  const t = e.target;
  const key = `${tierOf(ctx.band)}|${dateFor(ctx)}`;
  if (t.name === "wuListen") {
    ui.key = key;
    ui.picked = Number(t.value);
    ui.feedback = "";
    return;
  }
  if (t.matches?.("[data-wu-check]")) {
    const day = cleanDay(getWarmup(ctx.prefs).days[dayKey(ctx.band, dateFor(ctx))]);
    const i = Number(t.dataset.wuCheck);
    const checks = t.checked ? [...day.s.checks, i] : day.s.checks.filter((n) => n !== i);
    save(ctx, { s: { ...day.s, checks } });
  }
}

export function onInput(e, ctx) {
  if (e.target?.matches?.("[data-wu-text]")) {
    ui.key = `${tierOf(ctx.band)}|${dateFor(ctx)}`;
    ui.draft = e.target.value;
  }
}

export const unmount = () => {
  ui.draft = null;
};
