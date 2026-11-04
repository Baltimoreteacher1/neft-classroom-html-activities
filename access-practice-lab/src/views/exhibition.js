// Language World · The Science Exhibition (/exhibition). One scenario, four linked tasks, adjustable
// supports, saved progress, revision and a new independent attempt. An optional pathway: every existing
// activity, world and studio stays where it was.
//
//   /exhibition                 the hub (scenario, support choice, four-step path)
//   /exhibition/<listen|read|speak|write>
//   /exhibition/teacher         teacher-facing instructional context
import { crumbsHTML } from "../components.js";
import { EXHIBITIONS, STEP_ORDER } from "../content/exhibition.js";
import { i18nFor } from "../i18n.js";
import {
  bandState,
  evaluateWriting,
  isRight,
  noteHelp,
  parseState,
  progress,
  setSupport,
  stepStatus,
  suggestion,
  updateTask,
} from "../lang/exhibition.js";
import { PREFIX } from "../store.js";
import { ART, BASE, DOMAIN_META, TIERS, html, icon, raw, storage, wordCount } from "../util.js";
import {
  HELP,
  helpOpenByDefault,
  listenHTML,
  readHTML,
  speakHTML,
  writeHTML,
} from "./exhibition-steps.js";

export const STATE_KEY = `${PREFIX}:exhibition`;
const STEP_META = {
  listen: { domain: "Listening", en: "Listen", es: "Escuchar", studio: "The Sound Studio" },
  read: { domain: "Reading", en: "Read", es: "Leer", studio: "The Reading Atelier" },
  speak: { domain: "Speaking", en: "Speak", es: "Hablar", studio: "The Expression Studio" },
  write: { domain: "Writing", en: "Write", es: "Escribir", studio: "The Composition Studio" },
};
const SUPPORT_TEXT = {
  A: [
    "Pictures, word help and sentence starters are open. You can close any of them.",
    "Las imágenes, la ayuda con palabras y los inicios de oración están abiertos. Puedes cerrar cualquiera.",
  ],
  B: [
    "Some help is open, such as a visual example and starters. More help is one tap away.",
    "Hay algo de ayuda abierta, como un ejemplo visual y los inicios. Más ayuda está a un toque.",
  ],
  C: [
    "Help starts closed so you can work on your own. You can still open any help you need.",
    "La ayuda empieza cerrada para que trabajes por tu cuenta. Aún puedes abrir la ayuda que necesites.",
  ],
};

export const loadExhibition = () => parseState(storage.get(STATE_KEY));
const save = (state) => storage.set(STATE_KEY, JSON.stringify(state));
/** Help toggled open on screen this visit, per band+step. Opening is recorded; closing only hides. */
const openHelp = new Map();
let draftTimer = 0;

function openSet(band, step, level, attemptNo = 0, transfer = false) {
  // A new attempt on your own starts with every help closed, whatever the support setting.
  const key = `${band}:${step}:${level}:${step === "write" ? attemptNo : 0}`;
  if (!openHelp.has(key)) openHelp.set(key, new Set(transfer ? [] : helpOpenByDefault(step, level)));
  return openHelp.get(key);
}
const statusLabel = (I, status) =>
  status === "done"
    ? I.T("Done", "Hecho")
    : status === "started"
      ? I.T("In progress", "En progreso")
      : I.T("Not started", "Sin empezar");

export function supportControlHTML(I, level) {
  return html`<fieldset class="ex-support">
    <legend>${I.T("How much help do you want?", "¿Cuánta ayuda quieres?")}</legend>
    <div class="ex-support-options">
      ${["A", "B", "C"].map(
        (l) =>
          html`<button
            type="button"
            class="ex-support-btn"
            data-ex-support="${l}"
            aria-pressed="${l === level}"
          >
            <strong>${I.T(TIERS[l].name, TIERS[l].es)}</strong
            ><span
              >${I.T(TIERS[l].range, l === "A" ? "Más apoyo" : l === "B" ? "Algo de apoyo" : "Más independencia")}</span
            >
          </button>`,
      )}
    </div>
    <p class="fine" role="status">
      ${I.T(...SUPPORT_TEXT[level])}
      ${I.T("This is a help setting, not a WIDA level or score.", "Es un ajuste de ayuda, no un nivel ni un puntaje de WIDA.")}
    </p>
  </fieldset>`;
}

function pathHTML(I, scenario, band, bandKey, current = "") {
  const p = progress(scenario, band);
  return html`<ol class="ex-path" aria-label="${I.S("The four steps", "Los cuatro pasos")}">
    ${p.steps.map(({ step, status }, i) => {
      const meta = STEP_META[step];
      return html`<li
        class="ex-path-step d-${meta.domain.toLowerCase()} is-${status} ${step === current ? "is-current" : ""}"
      >
        <a
          href="${BASE}/exhibition/${step}?grades=${bandKey}"
          ${step === current ? raw('aria-current="step"') : ""}
        >
          <span class="ex-path-n" aria-hidden="true"
            >${status === "done" ? icon("check") : i + 1}</span
          >
          <span class="ex-path-text"
            ><strong>${I.T(meta.en, meta.es)}</strong><span>${statusLabel(I, status)}</span></span
          >
        </a>
      </li>`;
    })}
  </ol>`;
}

function hubHTML(I, ctx, scenario, band) {
  const p = progress(scenario, band);
  const next = p.next || "write";
  const tip = suggestion(scenario, band);
  return html`<section class="ex-hero" aria-labelledby="exTitle">
      <img
        class="ex-hero-art"
        src="${ART}/hall-${scenario.band === "3-5" ? "35" : "68"}.svg"
        width="1200"
        height="760"
        alt=""
        decoding="async"
        fetchpriority="high"
      />
      <div class="ex-hero-copy">
        <p class="ex-eyebrow">
          ${I.T("Language World · optional pathway", "Mundo del lenguaje · recorrido opcional")}
        </p>
        <h1 id="exTitle" tabindex="-1" lang="en">${scenario.title}</h1>
        <p class="ex-setting" lang="en">${scenario.setting}</p>
        <p class="ex-summary" lang="en">${scenario.summary}</p>
        <div class="row-actions">
          <a
            class="btn btn-primary btn-big"
            href="${BASE}/exhibition/${next}?grades=${scenario.band}"
            >${p.done ? I.T(`Continue: ${STEP_META[next].en}`, `Continuar: ${STEP_META[next].es}`) : I.T("Begin with Listening", "Empezar con Escuchar")}${icon("arrow-right")}</a
          >
          <a class="btn ex-ghost-light" href="${BASE}/exhibition/teacher?grades=${scenario.band}"
            >${icon("teacher")} ${I.T("For teachers", "Para docentes")}</a
          >
        </div>
      </div>
    </section>
    ${pathHTML(I, scenario, band, scenario.band)}
    <div class="ex-hub-grid">
      <section class="panel ex-hub-tasks" aria-labelledby="exTasksTitle">
        <h2 id="exTasksTitle">
          ${I.T("One exhibition, four ways to use language", "Una exposición, cuatro formas de usar el lenguaje")}
        </h2>
        <ol class="ex-task-list">
          ${STEP_ORDER.map((step) => {
            const spec = scenario.tasks[step];
            const meta = STEP_META[step];
            return html`<li class="d-${meta.domain.toLowerCase()}">
              <span class="ex-task-dot" aria-hidden="true"
                >${icon(DOMAIN_META[meta.domain].icon)}</span
              >
              <div>
                <a href="${BASE}/exhibition/${step}?grades=${scenario.band}"
                  ><strong>${I.T(meta.en, meta.es)} · ${spec.klu}</strong></a
                >
                <p class="fine" lang="en">${spec.objective}</p>
                <span class="ex-pill"
                  >${statusLabel(I, stepStatus(scenario, band.tasks[step], step))}</span
                >
              </div>
            </li>`;
          })}
        </ol>
      </section>
      <div class="ex-hub-side">
        ${supportControlHTML(I, band.support)}
        ${tip ? html`<p class="ex-tip">${icon("flag")} ${tip.reason === "transfer" ? I.T("Next: try the writing task once more on your own. Your earlier drafts stay saved.", "Siguiente: intenta la escritura otra vez por tu cuenta. Tus borradores anteriores siguen guardados.") : I.T(`Next: ${STEP_META[tip.step].en}. It is the first step you have not finished.`, `Siguiente: ${STEP_META[tip.step].es}. Es el primer paso que no has terminado.`)}</p>` : html`<p class="ex-tip">${icon("check")} ${I.T("You finished every step, including a new attempt on your own. See it in your Passport.", "Terminaste todos los pasos, incluido un nuevo intento por tu cuenta. Míralo en tu Pasaporte.")}</p>`}
        <p class="fine">
          ${I.T("Your work is saved in this browser and is included when you export your Passport. Recordings are never saved.", "Tu trabajo se guarda en este navegador y se incluye cuando exportas tu Pasaporte. Las grabaciones nunca se guardan.")}
        </p>
      </div>
    </div>`;
}

function teacherHTML(I, scenario) {
  return html`<section class="panel ex-teacher" aria-labelledby="exTeachTitle">
    <p class="eyebrow">${I.T("Teacher notes", "Notas para docentes")}</p>
    <h1 id="exTeachTitle" tabindex="-1">
      ${I.T("Language World: instructional context", "Mundo del lenguaje: contexto de enseñanza")} ·
      <span lang="en">${scenario.title}</span>
    </h1>
    <p>
      ${I.T("One original science scenario carries four linked tasks, so students build and reuse language around a shared context. Evidence selected in Reading becomes the evidence bank for Writing.", "Un escenario original de ciencias une cuatro tareas, para que el alumnado construya y reutilice lenguaje en un contexto común. La evidencia elegida en Lectura pasa a ser el banco de evidencia para Escritura.")}
    </p>
    <p>
      <strong>${I.T("Framework:", "Marco:")}</strong>
      <span lang="en"
        >WIDA English Language Development Standards Framework, 2020 Edition —
        ${scenario.standard}.</span
      >
      ${I.T("Expectations are paraphrased in the lab's own words; no WIDA item, audio or test interface is reproduced.", "Las expectativas se parafrasean con las palabras del laboratorio; no se reproduce ningún ítem, audio ni interfaz de WIDA.")}
    </p>
    <div class="table-wrap">
      <table class="ex-teacher-table">
        <thead>
          <tr>
            <th scope="col">${I.T("Step", "Paso")}</th>
            <th scope="col">${I.T("Key Language Use", "Uso clave del lenguaje")}</th>
            <th scope="col">${I.T("Language objective", "Objetivo de lenguaje")}</th>
            <th scope="col">${I.T("What is saved", "Qué se guarda")}</th>
          </tr>
        </thead>
        <tbody>
          ${STEP_ORDER.map((step) => {
            const spec = scenario.tasks[step];
            const saved = {
              listen: ["Answers and tries", "Respuestas e intentos"],
              read: ["Answers, selected evidence", "Respuestas, evidencia elegida"],
              speak: [
                "Plan notes, self-check, “said aloud” (never audio)",
                "Notas, autoevaluación, “lo dije” (nunca audio)",
              ],
              write: [
                "Every draft, organizer, which feedback rules each draft showed",
                "Cada borrador, organizador, qué reglas mostró cada borrador",
              ],
            }[step];
            return html`<tr>
              <th scope="row">${I.T(STEP_META[step].en, STEP_META[step].es)}</th>
              <td lang="en">${spec.klu}</td>
              <td lang="en">${spec.objective}</td>
              <td>${I.T(...saved)}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    </div>
    <h2>${I.T("Supports and honest evidence", "Apoyos y evidencia honesta")}</h2>
    <ul>
      <li>
        ${I.T("Starting, Growing and Expanding change which help is open at the start. Cognitive demand stays the same: every student answers the same questions and writes the same task.", "Comenzando, Creciendo y Ampliando cambian qué ayuda está abierta al inicio. La exigencia cognitiva es la misma: todos responden las mismas preguntas y escriben la misma tarea.")}
      </li>
      <li>
        ${I.T("Opening any help is recorded, so work is labelled supported or on my own. Supported work is never relabelled independent.", "Abrir cualquier ayuda queda registrado, así el trabajo se marca con apoyo o por mi cuenta. El trabajo con apoyo nunca se marca como independiente.")}
      </li>
      <li>
        ${I.T("Writing feedback is a small set of visible rules (claim, reason, evidence, concern, linking words, copying). It never scores and cannot judge accuracy of ideas.", "Los comentarios de escritura son pocas reglas visibles (afirmación, razón, evidencia, preocupación, conectores, copia). Nunca califican ni juzgan si las ideas son correctas.")}
      </li>
      <li>
        ${I.T("Speaking is self-checked. The lab does not assess pronunciation or proficiency; recordings stay in the tab.", "Hablar se autoevalúa. El laboratorio no evalúa la pronunciación ni la competencia; las grabaciones quedan en la pestaña.")}
      </li>
      <li>
        ${I.T("Non-audio and non-drag routes: a transcript is always available, and every selection is a button.", "Rutas sin audio y sin arrastrar: siempre hay una transcripción y cada selección es un botón.")}
      </li>
    </ul>
    <h2>${I.T("Using it in class", "Cómo usarlo en clase")}</h2>
    <ol>
      <li>
        ${I.T("Project the hub and read the scenario together.", "Proyecta la página principal y lean juntos el escenario.")}
      </li>
      <li>
        ${I.T("Students complete Listening and Reading on their own devices.", "El alumnado hace Escuchar y Leer en sus dispositivos.")}
      </li>
      <li>
        ${I.T("Pair students for Speaking: one explains, one checks the list, then switch.", "Formen parejas para Hablar: uno explica, otro revisa la lista y luego cambian.")}
      </li>
      <li>
        ${I.T("Writing: one draft, feedback, one revision, then a new attempt on their own.", "Escritura: un borrador, comentarios, una revisión y luego un nuevo intento por su cuenta.")}
      </li>
    </ol>
    <p class="fine">
      ${I.T("Practice material, not an ACCESS for ELLs assessment, placement or proficiency result. Not affiliated with or endorsed by WIDA.", "Material de práctica, no una evaluación ACCESS for ELLs, una ubicación ni un resultado de competencia. Sin afiliación ni respaldo de WIDA.")}
    </p>
    <p>
      <a class="btn" href="${BASE}/exhibition?grades=${scenario.band}"
        >${icon("arrow-right")} ${I.T("Back to the exhibition", "Volver a la exposición")}</a
      >
    </p>
  </section>`;
}

function writingSources(scenario, band) {
  const read = scenario.tasks.read;
  const picked = read.questions
    .filter((q) => q.kind === "evidence" && isRight(read, q.id, band.tasks.read.answers?.[q.id]))
    .map((q) => read.sentences[q.answer]);
  return { sentences: [...read.sentences, ...scenario.tasks.listen.script], picked };
}

function currentAttempt(task) {
  const attempts = task.attempts?.length
    ? task.attempts
    : [{ prompt: "main", kind: "supported", text: "", drafts: [], organizer: {} }];
  return { attempts, attempt: attempts.at(-1) };
}

function stepHTML(I, ctx, scenario, band, step) {
  const level = band.support;
  const { attempts, attempt } = currentAttempt(band.tasks.write);
  const effective = openSet(scenario.band, step, level, attempts.length - 1, attempt.prompt === "transfer");
  const parts =
    step === "listen"
      ? listenHTML(I, ctx, scenario, band, effective)
      : step === "read"
        ? readHTML(I, ctx, scenario, band, effective)
        : step === "speak"
          ? speakHTML(I, ctx, scenario, band, effective)
          : writeHTML(I, ctx, scenario, band, effective, attempt, writingSources(scenario, band));
  const meta = STEP_META[step];
  const spec = scenario.tasks[step];
  const i = STEP_ORDER.indexOf(step);
  const nextStep = STEP_ORDER[i + 1];
  const done = stepStatus(scenario, band.tasks[step], step) === "done";
  return html`<div class="ex-step d-${meta.domain.toLowerCase()} ex-step-${step}">
    <header class="ex-step-head">
      <div>
        <p class="ex-eyebrow">
          ${I.T(`Language World · Step ${i + 1} of 4 · ${meta.studio}`, `Mundo del lenguaje · Paso ${i + 1} de 4`)}
        </p>
        <h1 id="exTaskTitle" tabindex="-1">
          ${I.T(meta.en, meta.es)} <span class="ex-klu" lang="en">${spec.klu}</span>
        </h1>
        <p class="ex-objective">
          <strong>${I.T("Language goal:", "Meta de lenguaje:")}</strong>
          <span lang="en">${spec.objective}</span>
        </p>
      </div>
      ${supportControlHTML(I, level)}
    </header>
    ${pathHTML(I, scenario, band, scenario.band, step)}
    <div class="ex-step-grid">
      <div class="ex-step-main">${parts.main}</div>
      ${parts.rail}
    </div>
    <nav class="ex-step-foot" aria-label="${I.S("Steps", "Pasos")}">
      <a class="btn" href="${BASE}/exhibition?grades=${scenario.band}"
        >${I.T("Exhibition overview", "Resumen de la exposición")}</a
      >
      ${nextStep ? html`<a class="btn ${done ? "btn-primary" : ""}" href="${BASE}/exhibition/${nextStep}?grades=${scenario.band}">${I.T(`Next: ${STEP_META[nextStep].en}`, `Siguiente: ${STEP_META[nextStep].es}`)}${icon("arrow-right")}</a>` : html`<a class="btn ${done ? "btn-primary" : ""}" href="${BASE}/passport?grades=${scenario.band}#exhibitionWork">${I.T("See it in my Passport", "Verlo en mi Pasaporte")}${icon("arrow-right")}</a>`}
    </nav>
  </div>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const scenario = EXHIBITIONS[ctx.band] || EXHIBITIONS["6-8"];
  const band = bandState(loadExhibition(), scenario.band);
  const id = ctx.route.id || "";
  const crumbs = (last) =>
    crumbsHTML(
      [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${scenario.band}`],
        [
          I.S("Language World", "Mundo del lenguaje"),
          last ? `${BASE}/exhibition?grades=${scenario.band}` : null,
        ],
        ...(last ? [[last, null]] : []),
      ],
      { i18n: I },
    );
  if (id === "teacher")
    return {
      title: I.S("Language World · teacher notes", "Mundo del lenguaje · notas docentes"),
      html: html`${crumbs(I.S("Teacher notes", "Notas docentes"))}${teacherHTML(I, scenario)}`,
    };
  if (STEP_ORDER.includes(id))
    return {
      title: `${I.S(STEP_META[id].en, STEP_META[id].es)} · ${scenario.title}`,
      html: html`${crumbs(I.S(STEP_META[id].en, STEP_META[id].es))}${stepHTML(I, ctx, scenario, band, id)}`,
    };
  return {
    title: scenario.title,
    html: html`<div class="ex-hub">${crumbs("")}${hubHTML(I, ctx, scenario, band)}</div>`,
  };
}

// ── interactions ─────────────────────────────────────────────────────────────
function context(ctx) {
  const scenario = EXHIBITIONS[ctx.band] || EXHIBITIONS["6-8"];
  return { scenario, bandKey: scenario.band, step: ctx.route.id, state: loadExhibition() };
}

function patchWrite(state, bandKey, fn) {
  const task = bandState(state, bandKey).tasks.write;
  const { attempts } = currentAttempt(task);
  const list = attempts.map((a, i) => (i === attempts.length - 1 ? fn({ ...a }) : a));
  return updateTask(state, bandKey, "write", { attempts: list });
}

export function onClick(e, ctx) {
  const t = e.target;
  const { scenario, bandKey, step, state } = context(ctx);
  const band = bandState(state, bandKey);
  const commit = (next) => {
    save(next);
    ctx.rerender();
    return true;
  };
  const support = t.closest("[data-ex-support]");
  if (support) return commit(setSupport(state, bandKey, support.dataset.exSupport));
  const help = t.closest("[data-ex-help]");
  if (help && STEP_ORDER.includes(step)) {
    const item = help.dataset.exHelp;
    const { attempt, attempts } = currentAttempt(band.tasks.write);
    const open = openSet(bandKey, step, band.support, attempts.length - 1, attempt.prompt === "transfer");
    if (open.has(item)) {
      open.delete(item);
      ctx.rerender();
      return true;
    }
    open.add(item);
    let next = noteHelp(state, bandKey, step, item);
    // Help opened during a writing attempt makes that attempt supported; it is never relabelled later.
    if (step === "write") next = patchWrite(next, bandKey, (a) => ({ ...a, kind: "supported", helpUsed: [...new Set([...(a.helpUsed || []), item])] }));
    return commit(next);
  }
  const answer = t.closest("[data-ex-answer]");
  if (answer) {
    const [s, qid, value] = answer.dataset.exAnswer.split(":");
    const task = band.tasks[s];
    const tries = { ...(task.tries || {}), [qid]: (task.tries?.[qid] || 0) + 1 };
    return commit(
      updateTask(state, bandKey, s, {
        answers: { ...(task.answers || {}), [qid]: value },
        tries,
        support: band.support,
        at: new Date().toISOString(),
      }),
    );
  }
  if (t.closest("[data-ex-said]"))
    return commit(
      updateTask(state, bandKey, "speak", {
        said: !band.tasks.speak.said,
        support: band.support,
        at: new Date().toISOString(),
      }),
    );
  const improve = t.closest("[data-ex-improve]");
  if (improve)
    return commit(
      updateTask(state, bandKey, "speak", {
        improve: Number(improve.dataset.exImprove),
        revised: true,
      }),
    );
  if (t.closest("[data-ex-feedback]")) {
    clearTimeout(draftTimer);
    const text = document.getElementById("exDraft")?.value ?? "";
    if (!text.trim()) return true;
    const sources = writingSources(scenario, band);
    const result = evaluateWriting(text, scenario.tasks.write, sources.sentences);
    const next = patchWrite(state, bandKey, (a) => {
      const drafts = a.drafts || [];
      const fresh = drafts.at(-1)?.text !== text;
      return {
        ...a,
        text,
        checked: true,
        support: band.support,
        drafts: fresh
          ? [
              ...drafts,
              { text, at: new Date().toISOString(), shows: result.shows.map((x) => x.id) },
            ]
          : drafts,
      };
    });
    save(next);
    ctx
      .rerender()
      .then(() => document.getElementById("exNotesTitle")?.focus({ preventScroll: false }));
    return true;
  }
  if (t.closest("[data-ex-new-attempt]")) {
    const task = band.tasks.write;
    const { attempts } = currentAttempt(task);
    const fresh = {
      id: attempts.length,
      prompt: "transfer",
      kind: "independent",
      text: "",
      drafts: [],
      organizer: {},
    };
    save(updateTask(state, bandKey, "write", { attempts: [...attempts, fresh] }));
    ctx.rerender().then(() => document.getElementById("exDraft")?.focus());
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  const check = e.target.closest?.("[data-ex-check]");
  if (!check) return;
  const { bandKey, state } = context(ctx);
  const task = bandState(state, bandKey).tasks.speak;
  save(
    updateTask(state, bandKey, "speak", {
      checks: { ...(task.checks || {}), [check.dataset.exCheck]: check.checked },
    }),
  );
  ctx.rerender();
}

export function onInput(e, ctx) {
  const t = e.target;
  const { bandKey } = context(ctx);
  if (t.matches("[data-ex-plan]")) {
    const state = loadExhibition();
    const task = bandState(state, bandKey).tasks.speak;
    save(
      updateTask(state, bandKey, "speak", {
        plan: { ...(task.plan || {}), [t.dataset.exPlan]: t.value.slice(0, 140) },
      }),
    );
    return;
  }
  if (t.matches("[data-ex-org]")) {
    save(
      patchWrite(loadExhibition(), bandKey, (a) => ({
        ...a,
        organizer: { ...(a.organizer || {}), [t.dataset.exOrg]: t.value.slice(0, 400) },
      })),
    );
    return;
  }
  if (t.matches("[data-ex-draft]")) {
    const I = i18nFor(ctx);
    const count = document.querySelector("[data-ex-count]");
    if (count)
      count.textContent = I.S(`${wordCount(t.value)} words`, `${wordCount(t.value)} palabras`);
    const button = document.querySelector("[data-ex-feedback]");
    if (button) button.disabled = !t.value.trim();
    clearTimeout(draftTimer);
    const value = t.value.slice(0, 4000);
    draftTimer = setTimeout(() => {
      save(patchWrite(loadExhibition(), bandKey, (a) => ({ ...a, text: value })));
      const note = document.querySelector("[data-ex-saved]");
      if (note) note.textContent = I.S("Saved on this device.", "Guardado en este dispositivo.");
    }, 400);
  }
}

/** A finished recording counts as "said aloud"; the audio itself is never stored. */
export function onRecorded(_key, ctx) {
  const { bandKey, state } = context(ctx);
  save(
    updateTask(state, bandKey, "speak", {
      said: true,
      recorded: (bandState(state, bandKey).tasks.speak.recorded || 0) + 1,
      at: new Date().toISOString(),
    }),
  );
}

export function unmount() {
  clearTimeout(draftTimer);
  const area = document.getElementById("exDraft");
  if (area && document.body.dataset.labView === "exhibition") {
    const band = document.body.dataset.labBand;
    save(patchWrite(loadExhibition(), band, (a) => ({ ...a, text: area.value.slice(0, 4000) })));
  }
}

export { HELP };
