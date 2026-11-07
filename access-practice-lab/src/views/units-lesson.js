// One unit lesson page: warm-up, then the lesson's steps in order (unit texts, key words, existing activities, a speaking
// or writing task, a reflection), each finishing on its own evidence. `lessonParts` returns the pieces; `composeLesson`
// lays them out, so a shared lesson frame can wrap the same parts without changing the steps.
import { BASE, announce, html, icon } from "../util.js";
import {
  highlightTerms,
  recordAnswer,
  setStep,
  stepDone,
  textDone,
  vocabCloze,
  lessonProgress,
  TEXT_LEVELS,
} from "../lang/units.js";
import { disclosure } from "../studio-ui.js";
import {
  DOMAIN_ICON,
  LEVEL_NAME,
  barHTML,
  domainChip,
  paragraphs,
  progressFor,
  recOf,
  unitCrumbs,
  unitsHref,
} from "./units-common.js";
import {
  speakBlock,
  taskChange,
  taskClick,
  taskInput,
  taskPageHTML,
  taskReady,
  writeBlock,
} from "./units-task.js";

const KIND = {
  read: ["Read", "Leer", "reading"],
  listen: ["Listen", "Escuchar", "listening"],
  vocab: ["Key words", "Palabras clave", "words"],
  activity: ["Practice", "Practicar", "mission"],
  speak: ["Speak", "Hablar", "speaking"],
  write: ["Write", "Escribir", "writing"],
  reflect: ["Reflect", "Reflexionar", "bulb"],
};
const HINT = {
  detail: ["Look for the exact words in the text.", "Busca las palabras exactas en el texto."],
  inference: [
    "The text gives clues; the answer is not written word for word.",
    "El texto da pistas; la respuesta no está escrita palabra por palabra.",
  ],
  "main-idea": [
    "Think about what the whole text is mostly about.",
    "Piensa de qué trata casi todo el texto.",
  ],
  word: ["Read the sentences around the word.", "Lee las oraciones que rodean la palabra."],
  evidence: ["Find the sentence that proves it.", "Busca la oración que lo demuestra."],
  sequence: [
    "Look for order words such as first, next and then.",
    "Busca palabras de orden como primero, luego y después.",
  ],
  cause: ["Ask what happened and why it happened.", "Pregunta qué pasó y por qué pasó."],
};
const LEVEL_TEXT = {
  easier: ["Easier", "Más fácil"],
  on: ["On level", "Al nivel"],
  richer: ["More detail", "Más detalle"],
};

let openTerm = null; // { unit, i } the key word whose card is open, for this visit
const revealed = new Set(); // listen texts whose words the learner chose to see

function questionsHTML(I, unit, rec, key) {
  const qs = unit.texts[key].questions;
  return html`<ol class="un-qs">
    ${qs.map((q, qi) => {
      const a = rec.ans[`${key}:${qi}`];
      const hint = HINT[q.kind] || HINT.detail;
      return html`<li class="un-q">
        <p class="un-q-stem">${I.TO(q.q)}</p>
        <div
          class="un-choices"
          role="group"
          aria-label="${I.S(`Question ${qi + 1}`, `Pregunta ${qi + 1}`)}"
        >
          ${q.choices.map((c, ci) => {
            const state =
              a?.ok && a.pick === ci ? "is-right" : a?.miss.includes(ci) ? "is-missed" : "";
            return html`<button
              type="button"
              class="un-choice ${state}"
              data-u-ans="${key}:${qi}|${ci}"
              aria-pressed="${String(a?.pick === ci)}"
              ${a?.ok || a?.miss.includes(ci) ? "disabled" : ""}
            >
              ${I.TO(c)}
            </button>`;
          })}
        </div>
        <p class="un-fb" role="status">
          ${a?.ok ? html`<strong>${icon("check")} ${I.T("Right.", "Correcto.")}</strong> ${I.TO(q.why)}` : a ? html`${I.T("Not that one. Look back at the text and try another choice.", "Esa no. Vuelve al texto e intenta con otra opción.")} ${I.T(...hint)}${a.tries >= 2 ? html` ${I.TO(q.why)}` : ""}` : ""}
        </p>
      </li>`;
    })}
  </ol>`;
}

function termCard(I, unit) {
  if (!openTerm || openTerm.unit !== unit.id)
    return html`<div id="unTermCard" class="un-termcard" aria-live="polite"></div>`;
  const v = unit.vocab[openTerm.i];
  return html`<div id="unTermCard" class="un-termcard panel" aria-live="polite">
    <p>
      <strong lang="en">${v.term}</strong> · <span lang="es">${v.es}</span>
      <button
        type="button"
        class="ghost small"
        data-say="${v.term}"
        aria-label="${I.S(`Hear ${v.term}`, `Escuchar ${v.term}`)}"
      >
        ${icon("volume")}
      </button>
      <button type="button" class="ghost small" data-u-term="close">
        ${I.T("Close", "Cerrar")}
      </button>
    </p>
    <p>${I.TO(v.def)}</p>
    <p class="fine">${v.ex.en}</p>
  </div>`;
}

function textBody(I, unit, rec, key, { hide = false } = {}) {
  const t = unit.texts[key];
  const en = key === "anchor" ? t[rec.level] : t.en;
  const es = key === "anchor" ? t.es : t.es;
  const lines = paragraphs(en);
  const body = hide
    ? ""
    : html`<div class="un-text" lang="en">
        ${lines.map((p) => html`<p>${highlightTerms(p, unit.vocab).map((s) => (s.term === undefined ? s.text : html`<button type="button" class="un-term" data-u-term="${s.term}">${s.text}</button>`))}</p>`)}
      </div>`;
  const spanishOpen = I.mode !== "en";
  return html`<h3 class="un-text-title">
      ${I.TO(t.title)}${t.kind ? html` <span class="un-chip">${t.kind}</span>` : ""}
    </h3>
    ${key === "anchor" && !hide ? html`<div class="un-levels" role="group" aria-label="${I.S("Version of this text", "Versión de este texto")}">${TEXT_LEVELS.map((l) => html`<button type="button" class="cat-chip ${l === rec.level ? "is-active" : ""}" data-u-level="${l}" aria-pressed="${String(l === rec.level)}">${I.T(...LEVEL_TEXT[l])}</button>`)}</div>` : ""}
    <p class="row-actions">
      <button type="button" class="ghost" data-say="${key === "anchor" ? t.on : t.en}">
        ${icon("volume")} ${I.T("Listen", "Escuchar")}
      </button>
      <button type="button" class="ghost" data-say-es="${es}">
        ${icon("language")} ${I.T("Listen in Spanish", "Escuchar en español")}
      </button>
    </p>
    ${body}${hide ? "" : termCard(I, unit)}
    ${hide ? "" : disclosure(`un-es-${unit.id}-${key}`, I.T("Spanish version", "Versión en español"), html`<div class="un-text" lang="es">${paragraphs(es).map((p) => html`<p>${p}</p>`)}</div>`, { open: spanishOpen })}`;
}

function vocabBody(I, unit, rec, step) {
  return html`<ul class="un-words">
    ${step.terms.map((i) => {
      const v = unit.vocab[i];
      const cz = vocabCloze(v);
      const a = rec.ans[`v:${i}`];
      return html`<li class="un-word">
        <p class="un-term-row">
          <strong lang="en">${v.term}</strong> <span class="un-es" lang="es">${v.es}</span>
          <button
            type="button"
            class="ghost small"
            data-say="${v.term}"
            aria-label="${I.S(`Hear ${v.term}`, `Escuchar ${v.term}`)}"
          >
            ${icon("volume")}
          </button>
          <button
            type="button"
            class="ghost small"
            data-say-es="${v.es}"
            aria-label="${I.S(`Hear ${v.es} in Spanish`, `Escuchar ${v.es} en español`)}"
          >
            ${icon("language")}
          </button>
        </p>
        <p>${I.TO(v.def)}</p>
        ${
          cz
            ? html`<p class="un-cloze" lang="en">
                  ${cz.before}<span class="un-blank">${a?.ok ? v.term : "_____"}</span>${cz.after}
                </p>
                <div
                  class="un-choices"
                  role="group"
                  aria-label="${I.S(`Which word fits: ${v.term} sentence`, `Qué palabra encaja en la oración`)}"
                >
                  ${step.terms.map((j) => html`<button type="button" class="un-choice ${a?.ok && a.pick === j ? "is-right" : a?.miss.includes(j) ? "is-missed" : ""}" data-u-vocab="${i}|${j}" ${a?.ok || a?.miss.includes(j) ? "disabled" : ""}>${unit.vocab[j].term}</button>`)}
                </div>
                <p class="un-fb" role="status">
                  ${a?.ok ? html`<strong>${icon("check")} ${I.T("Yes, that word fits.", "Sí, esa palabra encaja.")}</strong>` : a ? I.T("Not that one. Read the sentence again and think about what it needs.", "Esa no. Vuelve a leer la oración y piensa qué necesita.") : ""}
                </p>`
            : html`<p class="fine" lang="en">${v.ex.en}</p>`
        }
      </li>`;
    })}
  </ul>`;
}

function activityBody(I, session, step, done) {
  const loc = session.locator.get(step.id);
  const link = (id, label) => {
    const l = session.locator.get(id);
    return l
      ? html`<a href="${BASE}/${l.domain}/${l.level}/${id}?grades=${session.band}"
          >${label}: ${l.title}</a
        >`
      : "";
  };
  return html`<div class="un-act">
    <p class="un-act-top">
      ${domainChip(I, loc.domain)}
      <span class="fine"
        >${I.T(...LEVEL_NAME[loc.level])}${loc.minutes ? ` · ${loc.minutes}` : ""}</span
      >
      ${done ? html`<span class="un-done">${icon("check")} ${I.T("Done", "Hecho")}</span>` : ""}
    </p>
    <p><strong>${loc.title}</strong></p>
    <p>${I.TO(step.why)}</p>
    <p class="row-actions">
      <a
        class="btn btn-primary"
        href="${BASE}/${loc.domain}/${loc.level}/${step.id}?grades=${session.band}"
        >${I.T(done ? "Do it again" : "Open the activity", done ? "Hacerla otra vez" : "Abrir la actividad")}
        ${icon("arrow-right")}</a
      >
    </p>
    ${
      step.easier || step.stretch
        ? html`<ul class="un-alts">
            ${step.easier ? html`<li>${link(step.easier, I.S("Need more support", "Necesito más apoyo"))}</li>` : ""}${step.stretch ? html`<li>${link(step.stretch, I.S("Want a stretch", "Quiero un reto"))}</li>` : ""}
          </ul>`
        : ""
    }
  </div>`;
}

function stepBody(I, session, unit, rec, lesson, i) {
  const s = lesson.steps[i];
  if (s.t === "read")
    return html`${s.why ? html`<p class="un-why">${I.TO(s.why)}</p>` : ""}${textBody(I, unit, rec, s.text)}${questionsHTML(I, unit, rec, s.text)}`;
  if (s.t === "listen") {
    const answered = textDone(unit, rec, s.text);
    const show = answered || revealed.has(`${unit.id}:${s.text}`);
    return html`${s.why ? html`<p class="un-why">${I.TO(s.why)}</p>` : ""}${textBody(I, unit, rec, s.text, { hide: !show })}
      <p class="fine">
        ${I.T("Listen first. Play it as many times as you need, then answer. The words appear when you are ready.", "Escucha primero. Reprodúcelo las veces que necesites y luego responde. Las palabras aparecen cuando estés listo.")}
      </p>
      ${show ? "" : html`<p><button type="button" class="ghost" data-u-show="${s.text}">${I.T("Show the words", "Mostrar las palabras")}</button></p>`}${questionsHTML(I, unit, rec, s.text)}`;
  }
  if (s.t === "vocab") return vocabBody(I, unit, rec, s);
  if (s.t === "activity") return activityBody(I, session, s, session.activityDone(s.id));
  if (s.t === "speak")
    return speakBlock(
      I,
      session,
      unit,
      rec,
      unit.speaking.find((t) => t.id === s.task),
    );
  if (s.t === "write")
    return writeBlock(
      I,
      session,
      unit,
      rec,
      unit.writing.find((t) => t.id === s.task),
    );
  return html`<p class="un-prompt">${I.TO(s.q)}</p>
    <label class="un-label" for="reflect-${lesson.id}-${i}"
      >${I.T("My answer", "Mi respuesta")}</label
    >
    <textarea
      id="reflect-${lesson.id}-${i}"
      class="un-textarea"
      rows="3"
      data-u-draft="reflect:${lesson.id}:${i}"
    >
${rec.text[`reflect:${lesson.id}:${i}`] || ""}</textarea>`;
}

/** Can a manual step be marked finished? Auto steps never show the button. */
function manualState(unit, rec, lesson, i) {
  const s = lesson.steps[i];
  if (s.t === "speak")
    return {
      can: taskReady(
        rec,
        unit.speaking.find((t) => t.id === s.task),
        "speak",
      ),
      why: ["Tick at least one check first.", "Marca al menos una revisión primero."],
    };
  if (s.t === "write")
    return {
      can: taskReady(
        rec,
        unit.writing.find((t) => t.id === s.task),
        "write",
      ),
      why: ["Write at least a few words first.", "Escribe al menos unas palabras primero."],
    };
  if (s.t === "reflect")
    return {
      can:
        (rec.text[`reflect:${lesson.id}:${i}`] || "").trim().split(/\s+/).filter(Boolean).length >=
        3,
      why: ["Write a short answer first.", "Escribe una respuesta corta primero."],
    };
  return { can: true };
}

/** The lesson as parts: head, warmup, ordered steps ({ id, kind, title, done, html }), foot. */
export function lessonParts(I, session, unit, lesson) {
  const rec = recOf(session, unit.id);
  const p = lessonProgress(unit, rec, lesson, session.activityDone);
  const steps = lesson.steps.map((s, i) => {
    const done = stepDone(unit, rec, lesson, i, session.activityDone);
    const manual = ["activity", "speak", "write", "reflect"].includes(s.t);
    const m = manualState(unit, rec, lesson, i);
    const kind = KIND[s.t];
    const title =
      s.t === "read" || s.t === "listen"
        ? unit.texts[s.text].title
        : s.t === "activity"
          ? {
              en: session.locator.get(s.id)?.title || s.id,
              es: session.locator.get(s.id)?.title || s.id,
            }
          : s.t === "speak"
            ? unit.speaking.find((t) => t.id === s.task).title
            : s.t === "write"
              ? unit.writing.find((t) => t.id === s.task).title
              : s.t === "vocab"
                ? { en: "Learn the words", es: "Aprende las palabras" }
                : { en: "Think back", es: "Piensa en lo que hiciste" };
    return {
      id: `step-${i}`,
      index: i,
      kind: s.t,
      title,
      done,
      html: html`${stepBody(I, session, unit, rec, lesson, i)}
      ${manual ? html`<p class="un-markrow"><button type="button" class="btn ${done ? "" : "btn-primary"}" data-u-done="${lesson.id}|${i}" aria-pressed="${String(done)}" ${!done && !m.can ? "disabled" : ""}>${icon("check")} ${done ? I.T("Finished (tap to undo)", "Terminado (toca para deshacer)") : I.T("Mark this step finished", "Marcar este paso como terminado")}</button>${!done && !m.can ? html` <span class="fine">${I.T(...m.why)}</span>` : ""}</p>` : ""}`,
      kindLabel: I.T(kind[0], kind[1]),
      icon: kind[2],
    };
  });
  const idx = unit.lessons.findIndex((l) => l.id === lesson.id);
  const prev = unit.lessons[idx - 1];
  const next = unit.lessons[idx + 1];
  return {
    unit,
    lesson,
    progress: p,
    steps,
    prev,
    next,
    accent: unit.accent,
    complete: p.complete,
    band: session.band,
    rec,
  };
}

export function composeLesson(I, parts) {
  const { unit, lesson, progress: p, steps, prev, next, band } = parts;
  const here = I.S(`Lesson ${lesson.id}`, `Lección ${lesson.id}`);
  return html`${unitCrumbs(I, band, unit, here)}
    <article
      class="un un-accent-${parts.accent} un-lesson"
      data-unit="${unit.id}"
      data-lesson="${lesson.id}"
    >
      <header class="un-hero">
        <div class="un-hero-copy">
          <p class="eyebrow">
            ${icon(unit.icon)} ${I.TO(unit.title)} ·
            ${I.T(`Lesson ${lesson.id} of 5`, `Lección ${lesson.id} de 5`)}
          </p>
          <h1 tabindex="-1">${I.TO(lesson.title)}</h1>
          <p class="un-goal"><strong>${I.TO(lesson.goal)}</strong></p>
          <p class="un-lesson-meta">
            ${lesson.focus.map((d) => domainChip(I, d))}<span class="fine"
              >${I.T(`About ${lesson.minutes} minutes`, `Unos ${lesson.minutes} minutos`)}</span
            >
          </p>
        </div>
        <div class="un-hero-progress">
          ${barHTML(I, p.done, p.total, I.S("Lesson progress", "Progreso de la lección"))}<span
            class="fine"
            >${I.T(`${p.done} of ${p.total} steps finished`, `${p.done} de ${p.total} pasos terminados`)}</span
          >
        </div>
      </header>
      <nav class="un-stepnav" aria-label="${I.S("Steps in this lesson", "Pasos de esta lección")}">
        <ol>
          ${steps.map((s) => html`<li><button type="button" class="un-stepchip ${s.done ? "is-done" : ""}" data-u-jump="${s.id}" aria-label="${I.S(`Go to step ${s.index + 1}`, `Ir al paso ${s.index + 1}`)}${s.done ? I.S(", finished", ", terminado") : ""}">${s.done ? icon("check") : s.index + 1}</button></li>`)}
        </ol>
      </nav>
      <section class="panel un-warm" aria-labelledby="unWarm">
        <h2 id="unWarm">
          ${icon("conversation")} ${I.T("Warm up: talk first", "Para empezar: conversa primero")}
        </h2>
        <p class="un-prompt">${I.TO(lesson.warmup)}</p>
      </section>
      ${steps.map(
        (s) =>
          html`<section
            class="panel un-step ${s.done ? "is-done" : ""}"
            id="${s.id}"
            data-kind="${s.kind}"
            aria-labelledby="${s.id}-h"
          >
            <header class="un-step-head">
              <span class="un-step-n">${s.done ? icon("check") : s.index + 1}</span>
              <div>
                <p class="eyebrow">${icon(s.icon)} ${s.kindLabel}</p>
                <h2 id="${s.id}-h">${I.TO(s.title)}</h2>
              </div>
            </header>
            ${s.html}
          </section>`,
      )}
      <section class="panel un-foot" aria-live="polite">
        ${parts.complete ? html`<p class="un-done"><strong>${icon("check")} ${I.T("Lesson finished. Nice work.", "Lección terminada. Buen trabajo.")}</strong></p>` : html`<p>${I.T("Finish every step to complete the lesson. You can come back any time.", "Termina cada paso para completar la lección. Puedes volver cuando quieras.")}</p>`}
        <p class="row-actions">
          ${prev ? html`<a class="btn" href="${unitsHref(band, unit.id, prev.id)}">${icon("arrow-left")} ${I.T(`Lesson ${prev.id}`, `Lección ${prev.id}`)}</a>` : ""}<a
            class="btn"
            href="${unitsHref(band, unit.id)}"
            >${I.T("Back to the unit", "Volver a la unidad")}</a
          >
          ${next ? html`<a class="btn ${parts.complete ? "btn-primary" : ""}" href="${unitsHref(band, unit.id, next.id)}">${I.T(`Lesson ${next.id}`, `Lección ${next.id}`)} ${icon("arrow-right")}</a>` : html`<a class="btn ${parts.complete ? "btn-primary" : ""}" href="${unitsHref(band, unit.id, "task")}">${icon("flag")} ${I.T("The project", "El proyecto")}</a>`}
        </p>
      </section>
    </article>`;
}

export function render(_ctx, I, session, unit, sub) {
  if (sub === "task")
    return {
      title: `${I.pick(unit.task.title)} · ${I.pick(unit.title)}`,
      html: taskPageHTML(I, session, unit),
    };
  const lesson = unit.lessons.find((l) => l.id === sub);
  return {
    title: `${I.pick(lesson.title)} · ${I.pick(unit.title)}`,
    html: composeLesson(I, lessonParts(I, session, unit, lesson)),
  };
}

// ── handlers ────────────────────────────────────────────────────────────────────────────────────
export function onClick(e, ctx, cur) {
  const { session, unit, I } = cur;
  const rec = recOf(session, unit.id);
  const ans = e.target.closest("[data-u-ans]");
  if (ans) {
    const [id, ci] = ans.dataset.uAns.split("|");
    const [key, qi] = id.split(":");
    const q = unit.texts[key].questions[Number(qi)];
    const a = recordAnswer(rec, id, Number(ci), Number(ci) === q.answer);
    session.save();
    announce(
      a.ok
        ? I.S("Right.", "Correcto.")
        : I.S("Not that one. Try another choice.", "Esa no. Prueba con otra opción."),
    );
    ctx.rerender();
    return true;
  }
  const voc = e.target.closest("[data-u-vocab]");
  if (voc) {
    const [i, j] = voc.dataset.uVocab.split("|").map(Number);
    recordAnswer(rec, `v:${i}`, j, i === j);
    session.save();
    ctx.rerender();
    return true;
  }
  const done = e.target.closest("[data-u-done]");
  if (done) {
    const [lid, i] = done.dataset.uDone.split("|");
    setStep(rec, lid, Number(i), done.getAttribute("aria-pressed") !== "true");
    session.save();
    ctx.rerender();
    return true;
  }
  const lvl = e.target.closest("[data-u-level]");
  if (lvl) {
    rec.level = lvl.dataset.uLevel;
    session.save();
    ctx.rerender();
    return true;
  }
  const term = e.target.closest("[data-u-term]");
  if (term) {
    const v = term.dataset.uTerm;
    openTerm = v === "close" ? null : { unit: unit.id, i: Number(v) };
    ctx.rerender();
    return true;
  }
  const show = e.target.closest("[data-u-show]");
  if (show) {
    revealed.add(`${unit.id}:${show.dataset.uShow}`);
    ctx.rerender();
    return true;
  }
  const jump = e.target.closest("[data-u-jump]");
  if (jump) {
    const el = document.getElementById(jump.dataset.uJump);
    el?.scrollIntoView({ block: "start" });
    el?.querySelector("h2")?.setAttribute("tabindex", "-1");
    el?.querySelector("h2")?.focus({ preventScroll: true });
    return true;
  }
  return taskClick(e, ctx, cur);
}

export function onChange(e, ctx, cur) {
  taskChange(e, ctx, cur);
}

export function onInput(e, ctx, cur) {
  if (taskInput(e, ctx, cur)) return;
  const name = e.target.closest("[data-u-cert-name]");
  if (!name) return;
  const rec = recOf(cur.session, cur.unit.id);
  if (rec.cert) rec.cert.name = name.value.trim().slice(0, 40);
  cur.session.save();
  const shown = document.querySelector(".un-cert-name");
  if (shown) shown.textContent = rec.cert?.name || cur.I.S("A language learner", "Una persona que aprende idiomas");
}
