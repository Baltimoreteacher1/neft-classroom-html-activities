// Writing Growth Studio: source-based academic writing from guided to independent, with draft history,
// targeted feedback, revision, evidence collection and a portfolio. Feedback describes what is on the
// page (see lang/analyze.js); it never scores, and it is withheld from "on my own" attempts until the
// learner submits a draft. The learner's first draft is always kept so growth is visible.
import { keepInView } from "../keep-in-view.js";
import { downloadMenuHTML, onDownloadClick } from "../download/menu.js";
import { pathwayBannerHTML, pathwayContext } from "../pathways/banner.js";
import { crumbsHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { loadExemplars, loadMission, loadStudioIndex, loadWritingTasks } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { analyzeResponse, compareDrafts } from "../lang/analyze.js";
import { askSecondLook } from "../class/ai-feedback.js";
import { loopPanelHTML, onLoopClick, onLoopInput, startTextLoop } from "../intel/ui.js";
import { appendEntry, buildProfile, loadLedger, saveLedger, suggestStage } from "../lang/ledger.js";
import { addVersion, choiceEffects, loadStudio, missionState, saveStudio, writingState } from "../lang/studio.js";
import { evidenceSentencesHTML, onEvidenceClick } from "./evidence-sentences.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { diffWords, sentences as splitSentences } from "../lang/text.js";
import {
  chooserHeroHTML,
  disclosure,
  feedbackHTML,
  jumpNavHTML,
  purposeBadgeHTML,
  sourceHTML,
  stageLockedHTML,
  stagePickerHTML,
  stepperHTML,
  supportsPanelHTML,
  taskCardHTML,
  trackDisclosures,
} from "../studio-ui.js";
import { ART, BASE, announce, esc, formatDate, html, icon, raw, storage, toHtml, todayISO, wordCount } from "../util.js";
import { readAudience } from "../audience.js";
import { revealFoldsFor } from "../fold.js";
import { cancelDictation, dictationControlsHTML, toggleDictation } from "../dictation-ui.js";

/**
 * write-studio.css loads here, on /write only, so the lab shell does not carry it on every other page. The version is
 * the first 12 hex of the file's sha256 (tools/access-writing-plus.test.mjs fails when it is stale), so a returning
 * learner never gets new markup with an old cached sheet.
 */
export const WRITE_STYLES_VERSION = "fada9e8400e6";
let sheet = null;
function ensureStyles() {
  if (typeof document === "undefined") return Promise.resolve();
  const base = `${BASE}/write-studio.css`;
  const href = `${base}?v=${WRITE_STYLES_VERSION}`;
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return Promise.resolve();
  sheet ||= new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.addEventListener("load", resolve, { once: true });
    link.addEventListener("error", resolve, { once: true });
    setTimeout(resolve, 3000);
    document.head.append(link);
  });
  return sheet;
}

// Present only after a learner joins a class (class/link.js): a finished piece can go to the teacher's scoring queue.
const CLASS_LINK_KEY = "accessPracticeLabClass:v1:link";
import { award } from "../engagement.js";

const IGN = raw("data-nsr-ignore");
let S = null;
let I = makeI18n("en"); // set at the top of render(); helpers and handlers below read it
const bandEs = (band) => `Grados ${band.replace("-", "–")}`;
const focusedTasks = new Set();
const chosen = new Map(); // task id → stage picked before the first attempt
const save = () => {
  if (S?.state) S.state.updatedAt = new Date().toISOString();
  return saveStudio(S.studio);
};
const FOCUS_OF = {
  "use-source": "evidence",
  "check-number": "evidence",
  develop: "reasoning",
  "link-ideas": "cohesion",
  "vary-openers": "cohesion",
  "precise-words": "precision",
  combine: "sentence",
};
const FORM = {
  cer: "Claim–evidence–reasoning",
  paragraph: "Paragraph",
  essay: "Essay",
  letter: "Letter",
  report: "Report",
  summary: "Summary",
  narrative: "Narrative",
  email: "Email",
};
const FORM_ES = {
  cer: "Afirmación–evidencia–razonamiento",
  paragraph: "Párrafo",
  essay: "Ensayo",
  letter: "Carta",
  report: "Informe",
  summary: "Resumen",
  narrative: "Narración",
  email: "Correo electrónico",
};
const formName = (f) => (FORM[f] ? I.T(FORM[f], FORM_ES[f]) : "");

/** Choose a fresh prompt that practices the same language use in another topic. */
export function nextWritingTransfer(tasks, current, studio, band) {
  const available = tasks.filter((t) =>
    t.id !== current.id && t.band === band && t.keyUse === current.keyUse &&
    !studio.writing[t.id]?.versions?.length,
  );
  return available.find((t) => t.contentArea !== current.contentArea) || available[0] || null;
}

async function findTask(id, from) {
  if (from?.startsWith("mission:")) {
    const mission = await loadMission(from.slice(8)).catch(() => null);
    const t = mission?.phases.flatMap((p) => p.tasks || []).find((x) => x.task?.id === id)?.task;
    if (t)
      return {
        task: {
          band: mission.band || t.band || "6-8",
          sources: mission.sources
            ? Object.values(mission.sources).filter((s) => s.kind !== "audio")
            : [],
          ...t,
        },
        mission,
      };
  }
  const t = (await loadWritingTasks()).tasks.find((x) => x.id === id);
  return t ? { task: t, mission: null } : null;
}
/**
 * "Revise and try a new task": the Language Intelligence loop (src/intel) for the draft that just got feedback.
 * It continues after the Language Coach, never replaces it; the loop id is kept in the task's saved state so a
 * reload returns to the same stage.
 */
function coachLoopHTML(ctx) {
  if (S.state.intelLoop) {
    const panel = loopPanelHTML(ctx, S.state.intelLoop, {});
    if (panel) return html`<div id="wrt-intel">${panel}</div>`;
  }
  return html`<p class="intel-entry" id="wrt-intel">
    <button type="button" class="btn btn-primary" data-intel-coach>${icon("growth")} ${I.T("Revise and try a new task", "Revisar y probar una tarea nueva")}</button>
    <span class="fine">${I.T("One strength, one next step, a revision and a new task.", "Una fortaleza, un siguiente paso, una revisión y una tarea nueva.")}</span>
  </p>`;
}

const optsFor = (task) => ({
  keyUse: task.keyUse,
  modality: "writing",
  sourceText: (task.sources || []).flatMap((s) => [
    ...(s.text || []),
    s.table ? JSON.stringify(s.table.rows) : "",
    s.chart ? JSON.stringify(s.chart.data) : "",
  ]),
  sourceTerms: task.sourceTerms,
  wordBank: task.stages.supported.bank,
  expected: task.expected,
  stage: S.stage,
});

const FORM_META = {
  cer: ["evidence", "Make a claim, support it with evidence, and explain your reasoning.", "Haz una afirmación, apóyala con evidencia y explica tu razonamiento."],
  paragraph: ["list", "Build one well-organized paragraph with a clear main idea.", "Construye un párrafo bien organizado con una idea principal clara."],
  essay: ["writing", "Develop your ideas across several paragraphs.", "Desarrolla tus ideas en varios párrafos."],
  letter: ["mail", "Write to a real reader with a clear purpose.", "Escribe para un lector real con un propósito claro."],
  report: ["library", "Organize facts from sources for a reader.", "Organiza datos de las fuentes para un lector."],
  summary: ["bookmark", "Say the main ideas of a text in your own words.", "Di las ideas principales de un texto con tus propias palabras."],
  narrative: ["star", "Tell a story with a beginning, a middle and an end.", "Cuenta una historia con inicio, desarrollo y final."],
  email: ["mail", "Write a clear message that gets something done.", "Escribe un mensaje claro que logre algo."],
};
const formIcon = (f) => FORM_META[f]?.[0] || "writing";

async function chooserHTML(ctx, index, entries) {
  const tasks = index.writing.filter((t) => t.band === ctx.band || !t.band);
  const full = new Map((await loadWritingTasks()).tasks.map((t) => [t.id, t]));
  const recs = recommendTasks(tasks, entries, { band: ctx.band, n: 3 });
  const forms = [...new Set(tasks.map((t) => t.form))];
  const card = (t, why) => {
    const st = taskStatus(S.studio.writing[t.id]);
    return taskCardHTML({
      badge: statusBadgeHTML(I, st),
      data: cardData({ ...t, scenario: full.get(t.id)?.scenario }, st),
      href: `${BASE}/write/${t.id}?grades=${ctx.band}`,
      title: t.title,
      ico: formIcon(t.form),
      kind: formName(t.form),
      time: t.time,
      desc: full.get(t.id)?.scenario,
      meta: [t.keyUse, t.contentArea],
      why,
    });
  };
  const next = recs[0];
  const anyStarted = studioStats(S.studio, tasks.map((t) => t.id)).started > 0;
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
      [I.S("Writing Studio", "Estudio de escritura"), null],
    ])}
    <div class="d-writing">
    ${chooserHeroHTML({
      domain: "d-writing",
      eyebrow: I.T(`Grades ${ctx.band.replace("-", "–")} · ${tasks.length} writing tasks`, `${bandEs(ctx.band)} · ${tasks.length} tareas de escritura`),
      title: I.T("Writing Studio", "Estudio de escritura"),
      lead: I.T("Read, plan and write. Get feedback that helps, then make your writing even better. We keep your first draft so you can see how much you grow.", "Lee, planea y escribe. Recibe comentarios que ayudan y mejora tu escritura. Guardamos tu primer borrador para que veas cuánto creces."),
      art: `${ART}/domain-writing.svg`,
      loop: [I.T("Read", "Leer"), I.T("Plan", "Planear"), I.T("Write", "Escribir"), I.T("Feedback", "Comentarios"), I.T("Revise", "Revisar")],
      cta: html`<div class="hero-actions">${next ? html`<a class="btn btn-primary btn-big btn-next" href="${BASE}/write/${next.task.id}?grades=${ctx.band}"><span class="btn-kicker">${I.T("Try next", "Prueba la siguiente")}</span><span class="next-title">${next.task.title}</span>${icon("arrow-right")}</a>` : ""}<a class="btn" href="${BASE}/write?tab=portfolio&grades=${ctx.band}">${icon("bookmark")} ${I.T("My writing portfolio", "Mi portafolio de escritura")}</a></div>`,
    })}
    ${
      tasks.length
        ? html`${teacherChooserHTML(I, ctx, tasks)}${myWritingHTML(I, ctx, tasks, S.studio)}${extrasRowHTML(I, ctx, tasks, S.studio)}${badgesHTML(I, S.studio, [...full.values()])}${filterBarHTML(I, tasks, anyStarted)}${jumpNavHTML(forms.map((f) => [`wrt-${f}`, formName(f)]), I.S("Jump to a kind of writing task", "Ir a un tipo de tarea de escritura"))}
          ${
            recs.length
              ? html`<section class="task-group is-next" aria-labelledby="wrt-next-h">
                  <header><h2 id="wrt-next-h">${icon("sparkle")} ${I.T("Try next", "Prueba la siguiente")}</h2><p class="fine">${I.T("Picked from the evidence you have saved on this device.", "Elegida según la evidencia que guardaste en este dispositivo.")}</p></header>
                  <div class="task-grid">${recs.map((r) => card(r.task, I.T(...r.why)))}</div>
                </section>`
              : ""
          }
          ${forms.map(
            (f) =>
              html`<section class="task-group" id="wrt-${f}" data-fold aria-labelledby="wrt-${f}-h">
                <header><h2 id="wrt-${f}-h">${icon(formIcon(f))} ${formName(f)}</h2><p class="fine">${FORM_META[f] ? I.T(FORM_META[f][1], FORM_META[f][2]) : ""}</p></header>
                <div class="task-grid">${tasks.filter((t) => t.form === f).map((t) => card(t))}</div>
              </section>`,
          )}`
        : html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h2>${I.T("No writing tasks for this grade band yet", "Aún no hay tareas de escritura para este grupo de grados")}</h2><p>${I.T("Switch grade band from the menu, or open the quick Writing practice room.", "Cambia el grupo de grados desde el menú, o abre la sala rápida de práctica de escribir.")}</p><a class="btn" href="${BASE}/Writing/A?grades=${ctx.band}">${I.T("Writing practice room", "Sala de práctica de escribir")}</a></section>`
    }
    <p class="no-print"><a class="btn" href="${BASE}/printables/studio-writing" target="_blank" rel="noopener">${icon("print")} ${I.T("Print writing task cards", "Imprimir tarjetas de tareas de escritura")}</a></p>
    </div>
    <p class="disclaimer">
      ${I.T("Classroom writing practice. The Language Coach describes what is on the page — it does not judge whether ideas are correct, and it is not a WIDA score.", "Práctica de escritura en el aula. El Entrenador de lenguaje describe lo que hay en la página; no juzga si las ideas son correctas y no es una puntuación de WIDA.")}
    </p>`;
}

function portfolioHTML(ctx, tasks) {
  const rows = Object.entries(S.studio.writing)
    .filter(([, w]) => w.versions.length)
    .map(([id, w]) => ({ id, w, task: tasks.find((t) => t.id === id) }))
    .filter((r) => r.task);
  const picks = new Set(S.studio.portfolio.picks.map((p) => p.id));
  const stats = studioStats(S.studio, rows.map((r) => r.id));
  const startedWith = (w) => (w.stage === "independent" ? I.T("on my own", "por mi cuenta") : w.stage === "supported" ? I.T("with a word bank", "con un banco de palabras") : I.T("with frames", "con marcos de oraciones"));
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
      [I.S("Writing Studio", "Estudio de escritura"), `${BASE}/write?grades=${ctx.band}`],
      [I.S("Portfolio", "Portafolio"), null],
    ])}
    <section class="practice-portfolio studio-view d-writing">
      <header class="portfolio-head">
        <div>
          <p class="eyebrow">${icon("bookmark")} ${I.T("Writing Studio", "Estudio de escritura")}</p>
          <h1 tabindex="-1">${I.T("My writing portfolio", "Mi portafolio de escritura")}</h1>
          <p class="lead">${I.T("Practice work and how it changed. This is a record of practice, not a proficiency score. Audio is not included.", "Trabajo de práctica y cómo cambió. Esto es un registro de práctica, no una puntuación de dominio. No incluye audio.")}</p>
        </div>
        <div class="row-actions no-print"><button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print my portfolio", "Imprimir mi portafolio")}</button><a class="btn" href="${BASE}/write?grades=${ctx.band}">${icon("writing")} ${I.T("Write something new", "Escribir algo nuevo")}</a></div>
      </header>
      ${
        rows.length
          ? html`<ul class="writer-stats portfolio-stats" aria-label="${I.S("What is in this portfolio", "Lo que hay en este portafolio")}">
              <li><strong>${rows.length}</strong><span>${I.T(rows.length === 1 ? "piece" : "pieces", rows.length === 1 ? "texto" : "textos")}</span></li>
              <li><strong>${stats.finished}</strong><span>${I.T("finished", "terminados")}</span></li>
              <li><strong>${stats.words}</strong><span>${I.T("words written", "palabras escritas")}</span></li>
              <li><strong>${stats.revisions}</strong><span>${I.T(stats.revisions === 1 ? "revision" : "revisions", stats.revisions === 1 ? "revisión" : "revisiones")}</span></li>
            </ul>`
          : ""
      }
      ${
        rows.length
          ? rows.map(({ id, w, task }) => {
              const first = w.versions[0];
              const last = w.versions.at(-1);
              const growth = first.id !== last.id ? compareDrafts(first.text, last.text, { ...optsFor(task), stage: "supported" }) : null;
              return html`<article class="portfolio-entry card">
                <header class="entry-head">
                  <div><h2>${task.title}</h2>
                    <p class="entry-meta"><span class="tag">${formName(task.form)}</span><span class="tag">${task.keyUse}</span><span class="tag">${I.T(`${w.versions.length} version${w.versions.length === 1 ? "" : "s"}`, `${w.versions.length} ${w.versions.length === 1 ? "versión" : "versiones"}`)}</span>${w.stage ? html`<span class="tag">${I.T("Started", "Empezado")} ${startedWith(w)}</span>` : ""}<span class="tag">${wordCount(first.text) === wordCount(last.text) ? I.T(`${wordCount(last.text)} words`, `${wordCount(last.text)} palabras`) : I.T(`${wordCount(first.text)} → ${wordCount(last.text)} words`, `${wordCount(first.text)} → ${wordCount(last.text)} palabras`)}</span>${last.t ? html`<span class="tag">${formatDate(todayISO(new Date(last.t)))}</span>` : ""}</p></div>
                  <label class="pick-toggle no-print"><input type="checkbox" data-pick="${id}" ${picks.has(id) ? raw("checked") : ""} ${IGN} /> ${I.T("Show in my best-work list", "Mostrar en mi lista de mejores trabajos")}</label>
                </header>
                <div class="entry-drafts ${growth ? "has-two" : ""}">
                  <section><h3>${I.T("First draft", "Primer borrador")}</h3><p class="portfolio-response">${first.text}</p></section>
                  ${growth ? html`<section><h3>${I.T("Latest version", "Última versión")}</h3><p class="portfolio-response">${last.text}</p></section>` : ""}
                </div>
                ${growth && (growth.changes.length || growth.gainedMoves.length) ? html`<section class="entry-changes"><h3>${icon("growth")} ${I.T("What changed", "Qué cambió")}</h3><ul>${growth.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to}</li>`)}${growth.gainedMoves.map((m) => html`<li>${I.T(`Now ${m.toLowerCase()}`, `Ahora: ${m.toLowerCase()}`)}</li>`)}</ul></section>` : ""}
                <p class="row-actions no-print"><a class="btn small" href="${BASE}/write/${id}?grades=${ctx.band}">${icon("writing")} ${w.finishedAt ? I.T("Open this piece", "Abrir este texto") : I.T("Keep working on it", "Seguir trabajando")}</a><button type="button" class="btn small" data-copy-piece="${id}">${icon("copy")} ${I.T("Copy the latest version", "Copiar la última versión")}</button></p>
                ${goalTagHTML(I, w)}
                ${notesForPortfolioHTML(I, w)}
                ${w.reflection ? html`<section class="entry-reflection"><h3>${I.T("What I improved and why", "Qué mejoré y por qué")}</h3><p class="portfolio-response">${w.reflection}</p></section>` : ""}
              </article>`;
            })
          : html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h2>${I.T("Nothing in your portfolio yet", "Aún no hay nada en tu portafolio")}</h2><p>${I.T("Your writing will appear here after you save a draft in the Writing Studio.", "Tu escritura aparecerá aquí después de que guardes un borrador en el Estudio de escritura.")}</p><a class="btn btn-primary" href="${BASE}/write?grades=${ctx.band}">${I.T("Choose a writing task", "Elige una tarea de escritura")}</a></section>`
      }
    </section>`;
}

function sourcesHTML(task, state) {
  const sources = task.sources || [];
  const ev = state.evidence || [];
  return html`<section class="panel sources" id="wrt-sources" aria-label="${I.S("Sources", "Fuentes")}">
    <div class="panel-head"><h3>${icon("reading")} ${I.T("Sources", "Fuentes")}</h3><a class="ghost small jump" href="#wrt-write">${I.T("Jump to my writing", "Ir a mi escritura")} ${icon("arrow-right")}</a></div>
    <p class="step-how">${I.T("Read each source. Tap a sentence to save it for later.", "Lee cada fuente. Toca una oración para guardarla para después.")}</p>
    ${sources.map((src, i) =>
      src.kind === "passage" || src.kind === "text"
        ? html`<section class="source">
            <h4 class="source-title">${icon("reading")} ${src.title}</h4>
            <div class="source-text">${(src.text || []).map((p, pi) => html`<p>${splitSentences(p).map((s, si) => html`<button type="button" class="ev-sent ${ev.some((e) => e.text === s.text) ? "is-picked" : ""}" data-pick-evidence="${i}:${pi}:${si}" aria-pressed="${ev.some((e) => e.text === s.text)}">${s.text}</button>${" "}`)}</p>`)}</div>
            <button type="button" class="ghost small" data-read-source="${i}">${icon("volume")} ${I.T("Read aloud", "Leer en voz alta")}</button>
          </section>`
        : html`${sourceHTML(src, { id: String(i) })}${src.table ? tablePictureHTML(I, src.table) : ""}`,
    )}
    <p class="fine tip">${icon("pin")}<span>${I.T("Press Enter or tap a sentence to add it to your evidence notebook.", "Presiona Enter o toca una oración para agregarla a tu cuaderno de evidencia.")}</span></p>
    ${
      ev.length
        ? html`<div class="evidence-notebook"><h4>${icon("evidence")} ${I.T("My evidence notebook", "Mi cuaderno de evidencia")}</h4>
            <ul>${ev.map((e, i) => html`<li><span>“${e.text}”</span><button type="button" class="ghost small" data-use-evidence="${i}">${icon("writing")} ${I.T("Use", "Usar")}<span class="visually-hidden"> ${I.T("this sentence in my writing, in quotation marks", "esta oración en mi escritura, entre comillas")}</span></button><button type="button" class="ghost small" data-drop-evidence="${i}" aria-label="${I.S("Remove from notebook", "Quitar del cuaderno")}">${icon("x")}</button></li>`)}</ul></div>`
        : ""
    }
  </section>`;
}

function supportsHTML(task) {
  if (S.stage === "independent")
    return html`<p class="own-note">${icon("user")}<span>${I.T("You chose to write on your own. Sources and your notes are available; frames, word bank and model are closed.", "Elegiste escribir por tu cuenta. Las fuentes y tus notas están disponibles; los marcos de oraciones, el banco de palabras y el modelo están cerrados.")}</span></p>`;
  return supportsPanelHTML(task, S.stage, {
    title: I.S("Writing starters", "Para empezar a escribir"),
    insert: true,
    modelBody: { summary: I.S("See a model response", "Ver una respuesta modelo"), body: html`<p class="portfolio-response">${task.stages.guided.model}</p>` },
  });
}

function versionsHTML(state) {
  if (state.versions.length < 2) return "";
  const first = state.versions[0];
  const last = state.versions.at(-1);
  const d = diffWords(first.text, last.text);
  return disclosure(
    "wrt-history",
    html`${icon("replay")} ${I.T("Compare my first draft and now", "Comparar mi primer borrador con el actual")}`,
    html`<p class="diff" aria-label="${I.S("Changes from first draft to now", "Cambios desde el primer borrador hasta ahora")}">${d.map((x) => (x.op === "same" ? html`${x.text} ` : x.op === "add" ? html`<ins>${x.text}</ins> ` : html`<del>${x.text}</del> `))}</p>
      <p class="fine"><ins>${I.T("Added", "Agregado")}</ins> · <del>${I.T("Removed", "Quitado")}</del> · ${I.T(`${state.versions.length} versions saved`, `${state.versions.length} versiones guardadas`)}</p>`,
    { open: true, cls: "draft-history" },
  );
}

function revisionPromptsHTML(task, a) {
  const top = a.nextMoves[0];
  const focus = top ? FOCUS_OF[top.id] || (top.patternId ? "sentence" : "reasoning") : null;
  const picks = (task.revisionPrompts || []).filter((p) => p.focus === focus).slice(0, 2);
  return picks.length
    ? html`<div class="revise-prompts"><h4>${icon("retry")} ${I.T("Revise with this question", "Revisa con esta pregunta")}</h4><ul>${picks.map((p) => html`<li>${p.prompt}</li>`)}</ul></div>`
    : "";
}

async function exemplarsHTML(task) {
  const all = (await loadExemplars().catch(() => [])).filter((x) => x.taskId === task.id);
  if (!all.length) return "";
  const order = ["early", "building", "strong"];
  return disclosure(
    "wrt-exemplars",
    html`${icon("library")} ${I.T("Compare with sample responses (practice anchors)", "Comparar con respuestas de ejemplo (referencias de práctica)")}`,
    html`<p class="fine">${I.T("Three sample responses written for practice. They are not WIDA levels. Notice what each one does; then reread your own.", "Tres respuestas de ejemplo escritas para practicar. No son niveles de WIDA. Fíjate en lo que hace cada una; luego vuelve a leer la tuya.")}</p>
      <div class="exemplar-grid">${order
        .map((b) => all.find((x) => x.practiceBand === b))
        .filter(Boolean)
        .map(
          (x) => html`<article class="card"><h4><span class="mode-pill">${I.T(x.practiceBand[0].toUpperCase() + x.practiceBand.slice(1), EXEMPLAR_BAND_ES[x.practiceBand])}</span></h4>
            <p class="portfolio-response">${x.response}</p>
            <ul>${x.annotations.map((a) => html`<li>“${a.quote}” — <em>${a.dimension}</em>: ${a.note}</li>`)}</ul>
            <p class="fine">${x.whyThisBand} <strong>${I.T("Next step:", "Próximo paso:")}</strong> ${x.nextStep}</p></article>`,
        )}</div>`,
    { cls: "panel" },
  );
}

const EXEMPLAR_BAND_ES = { early: "Inicial", building: "En construcción", strong: "Sólida" };

function stepsFor(state, text, analyzed) {
  // A step links to its section once that section is on the page.
  return [
    { label: I.T("Read", "Leer"), done: (state.evidence || []).length > 0, href: "#wrt-sources" },
    { label: I.T("Plan", "Planear"), done: Object.values(state.organizer).some(Boolean), href: "#wrt-plan" },
    { label: I.T("Write", "Escribir"), done: wordCount(text) >= 4, href: "#wrt-write" },
    { label: I.T("Feedback", "Comentarios"), done: Boolean(analyzed), href: analyzed ? "#wrt-feedback" : "" },
    { label: I.T("Finish", "Terminar"), done: Boolean(state.finishedAt), href: analyzed ? "#wrt-finish" : "" },
  ];
}

export async function render(ctx) {
  I = i18nFor(ctx);
  await ensureStyles();
  const index = await loadStudioIndex();
  S = { ...(S || {}), band: ctx.band, studio: loadStudio(), ledger: loadLedger() };
  S.allTasks = (await loadWritingTasks()).tasks;
  const q = new URLSearchParams(location.search);
  const id = ctx.route.id;
  if (!id && q.get("tab") === "portfolio")
    return {
      title: I.S("Writing portfolio", "Portafolio de escritura"),
      html: portfolioHTML(ctx, (await loadWritingTasks()).tasks),
    };
  if (!id && q.get("tab") === "quick") {
    S.task = null;
    const prompt = QUICK.find((x) => x.id === q.get("p"));
    const crumbs = crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
      [I.S("Writing Studio", "Estudio de escritura"), `${BASE}/write?grades=${ctx.band}`],
      [I.S("Quick write", "Escritura rápida"), prompt ? `${BASE}/write?tab=quick&grades=${ctx.band}` : null],
    ]);
    return {
      title: I.S("Quick write", "Escritura rápida"),
      html: html`${crumbs}${prompt ? quickWriteHTML(I, ctx, S.studio, prompt) : quickChooserHTML(I, ctx, S.studio)}`,
    };
  }
  if (!id) {
    S.task = null;
    return { title: I.S("Writing Studio", "Estudio de escritura"), html: await chooserHTML(ctx, index, S.ledger.entries) };
  }
  const found = await findTask(id, q.get("from"));
  if (!found)
    return {
      title: I.S("Not found", "No se encontró"),
      html: html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h1 tabindex="-1">${I.T("We could not find that task.", "No pudimos encontrar esa tarea.")}</h1><a class="btn" href="${BASE}/write?grades=${ctx.band}">${I.T("Writing Studio", "Estudio de escritura")}</a></section>`,
    };
  const { task, mission } = found;
  if (q.get("sheet") === "conference") {
    S.task = null;
    return { title: task.title, html: conferenceSheetHTML(I, ctx, task) };
  }
  if (q.get("sheet") === "week") {
    S.task = null;
    return { title: task.title, html: weekPlanHTML(I, ctx, task) };
  }
  if (q.get("sheet") === "compare") {
    S.task = null;
    return { title: task.title, html: compareLessonHTML(I, ctx, task, await loadExemplars().catch(() => [])) };
  }
  S.task = task;
  S.mission = mission;
  S.fx = choiceEffects(task, mission, S.studio);
  S.state = writingState(S.studio, task.id);
  S.state.evidence ||= [];
  S.profile = buildProfile(S.ledger.entries, { band: ctx.band });
  const requestedStage = q.get("suggestedStage");
  const missionStage =
    mission &&
    q.get("from")?.startsWith("mission:") &&
    ["guided", "supported", "independent"].includes(requestedStage)
      ? requestedStage
      : "";
  const baseSuggestion = suggestStage(S.profile, task.keyUse);
  const sourceId = q.get("fromWriting");
  const source = sourceId && (await loadWritingTasks()).tasks.find((t) => t.id === sourceId);
  const sourceWork = source && S.studio.writing[source.id];
  const linkedTransfer = Boolean(
    q.get("transfer") === "1" && source && source.id !== task.id &&
    source.keyUse === task.keyUse && sourceWork?.finishedAt &&
    sourceWork.versions?.length >= 2,
  );
  const transferStage = Boolean(task.transfer || linkedTransfer);
  S.transferFrom = linkedTransfer ? source.id : "";
  S.isTransfer = transferStage;
  const sug = missionStage
    ? {
        stage: missionStage,
        reason: I.S(
          "Your mission suggested this starting support from your earlier practice. You can choose a different setting.",
          "Tu misión sugirió este apoyo inicial a partir de tu práctica anterior. Puedes elegir otra opción.",
        ),
      }
    : transferStage
      ? {
          stage: "independent",
          reason: I.S(
            "This is a fresh context to show what you can do on your own. You can still choose more help.",
            "Este es un contexto nuevo para mostrar lo que puedes hacer por tu cuenta. Aún puedes elegir más ayuda.",
          ),
        }
      : baseSuggestion;
  S.stage = S.state.stage || chosen.get(task.id) || sug.stage;
  const text = S.state.draft ?? S.state.versions.at(-1)?.text ?? "";
  S.state.notes ||= "";
  const analyzed = S.state.analyzedText === text && text;
  const a = analyzed ? analyzeResponse(text, optsFor(task)) : null;
  const goalMin = task.expected.minWords;
  primeGoal(task, text);
  const nextTransfer = S.state.finishedAt && S.state.versions.length >= 2
    ? nextWritingTransfer((await loadWritingTasks()).tasks, task, S.studio, ctx.band)
    : null;
  return {
    title: task.title,
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], mission ? [mission.title, `${BASE}/missions/${mission.id}?grades=${ctx.band}`] : [I.S("Writing Studio", "Estudio de escritura"), `${BASE}/write?grades=${ctx.band}`], [task.title, null]])}${pathwayBannerHTML(ctx)}
      <article class="activity studio-view write-studio d-writing ${focusedTasks.has(task.id) ? "is-focused" : ""}">
        <header class="act-head">
          <div class="act-bar">
            <p class="act-context">${icon("writing")} ${I.T("Writing Studio", "Estudio de escritura")} · ${formName(task.form)} · ${task.keyUse}</p>
            <p class="act-step">${icon("clock")} ${task.time} · ${task.contentArea}</p>
          </div>
          <h1 tabindex="-1">${task.title}</h1>
          ${downloadMenuHTML(ctx, "writing-task", task)}
          ${purposeBadgeHTML(S.stage)}
          <div class="task-brief">
            <div><span class="brief-label">${icon("info")} ${I.T("Situation", "Situación")}</span><p>${task.scenario}</p></div>
            <div class="brief-task"><span class="brief-label">${icon("flag")} ${I.T("Your task", "Tu tarea")}</span><p>${task.prompt}${S.fx.promptAdd.map((x) => html` <span class="path-add">${x}</span>`)}</p>
              <button type="button" class="ghost small" data-say="${task.prompt}">${icon("volume")} ${I.T("Hear the task", "Escuchar la tarea")}</button></div>
          </div>
        </header>
        ${teacherTaskHTML(I, ctx, task, teacherAssignHTML(I, ctx, task))}
        ${focusBannerHTML(I, task, focusFrom(location.search))}
        ${nextStepHTML(I, ctx, task, S.state, text, analyzed)}
        ${stepperHTML(stepsFor(S.state, text, analyzed), { label: I.S("Writing steps", "Pasos de escritura") })}
        ${S.state.versions.length ? stageLockedHTML(S.stage) : stagePickerHTML(S.stage, sug)}
        <div class="studio-cols is-write">
          <div class="studio-col">${sourcesHTML(task, S.state)}
            <section class="panel organizer" id="wrt-plan">
              <h3><span class="step-badge">2</span> ${I.T("Plan", "Planear")}</h3>
              <p class="step-how">${I.T("Write short notes in each box. They do not need to be full sentences. You can plan in any language you know.", "Escribe notas cortas en cada casilla. No tienen que ser oraciones completas. Puedes planear en cualquier idioma que sepas.")}</p>
              ${planMapHTML(I, task, S.state)}
              <div class="slot-grid">
                ${task.organizer.map((slot, i) => html`<label class="field slot"><span><b class="slot-n">${i + 1}</b>${slot.label}</span><textarea rows="2" data-org="${slot.id}" ${S.stage === "independent" ? "" : html`placeholder="${S.fx.hints[slot.id] || slot.hint}"`} ${IGN}>${S.state.organizer[slot.id] || ""}</textarea></label>`)}
              </div>
            </section>
            ${await evidenceSentencesHTML(I, task, { independent: S.stage === "independent" })}
          </div>
          <div class="studio-col">

            <section class="panel editor-panel" id="wrt-write">
              <div class="writing-workspace-head"><h3><span class="step-badge">3</span> ${I.T("Write", "Escribir")}</h3><button type="button" class="btn small" data-writing-focus aria-pressed="${focusedTasks.has(task.id)}">${focusedTasks.has(task.id) ? I.T("Show sources & plan", "Mostrar fuentes y plan") : I.T("Focus on writing", "Enfocarme en escribir")}</button></div>
              <label class="field paper"><span class="paper-head">${I.T("Your writing", "Tu escritura")} <span class="fine">${I.T("Saved on this device as you type", "Se guarda en este dispositivo mientras escribes")}<span class="saved-stamp" data-saved-stamp role="status"></span></span></span><textarea id="wrt-draft" rows="${task.expected.paragraphs > 1 ? 16 : 11}" spellcheck="false" placeholder="${I.S("Write here. You can change it as many times as you like.", "Escribe aquí. Puedes cambiarlo todas las veces que quieras.")}" data-draft ${IGN}>
${text}</textarea></label>
              <p class="meter ${wordCount(text) >= goalMin ? "is-met" : ""}"><span class="meter-bar"><span style="width:${Math.min(100, Math.round((wordCount(text) / goalMin) * 100))}%"></span></span><span class="meter-line"><span data-meter>${meterText(wordCount(text), goalMin, task.expected.maxWords)}</span>${statsLineHTML(I, text)}${cheerHTML(I, wordCount(text), goalMin)}</span></p>
              ${goalRowHTML(I, task, S.state, S.stage, text)}
              ${topicWordsHTML(I, task, text, S.stage)}
              ${helpToolsHTML(I, task, S.state, S.stage, text, analyzed)}
              ${checklistHTML(I, task, S.state, S.stage)}
              <div class="row-actions">
                <button type="button" class="btn btn-primary" data-feedback ${wordCount(text) < 4 ? raw("disabled") : ""}>${icon("sparkle")} ${I.T("Get feedback", "Obtener comentarios")}</button>
                <button type="button" class="ghost" data-read-draft>${icon("volume")} ${I.T("Read my writing to me", "Leer mi escritura en voz alta")}</button>
              </div>
            </section>
            ${conferenceHTML(I, S.state, Boolean(text.trim()))}
            ${supportsHTML(task)}
            ${disclosure(
              "wrt-tools",
              html`${icon("tools")} ${I.T("More language tools", "Más herramientas de lenguaje")}`,
              html`<p class="fine">${I.T("Extra practice for everyday and academic words, and for linking sentences. Open them when you want them.", "Práctica extra con palabras cotidianas y académicas, y para enlazar oraciones. Ábrelas cuando quieras.")}</p>
                ${(await import("../lang/register-dial.js")).registerDialHTML(ctx)}
                ${(await import("../lang/cohesion-xray.js")).cohesionXrayHTML(ctx)}
                ${(await import("../lang/echo-self.js")).echoSelfHTML(ctx, task.id)}`,
              { cls: "panel language-tools" },
            )}
          </div>
        </div>
        ${
          a
            ? html`<section class="panel" id="wrt-feedback">
                  <h3><span class="step-badge">4</span> ${I.T("What your writing shows", "Lo que muestra tu escritura")}</h3>
                  ${feedbackHTML(a, text, { patternHref: (pid) => `${BASE}/detective/${pid}?grades=${ctx.band}` })}<div class="second-look" data-second-look-box><button type="button" class="btn small" data-second-look>${icon("sparkle")} ${I.T("Ask for a second look", "Pedir una segunda revisión")}</button><p class="fine">${I.T("Optional. An AI helper sorts your writing into the same coach categories. It only picks from the coach's own notes and does not write for you. Your draft is sent to it only when you press the button.", "Opcional. Un asistente de IA clasifica tu escritura en las mismas categorías del coach. Solo elige entre las notas del propio coach y no escribe por ti. Tu borrador solo se le envía cuando presionas el botón.")}</p><div data-second-look-out aria-live="polite"></div></div>${revisionPromptsHTML(task, a)}${S.fx.revise.length ? html`<div class="revise-prompts"><h4>${icon("mission")} ${I.T("From your mission choice", "De tu elección en la misión")}</h4><ul>${S.fx.revise.map((q) => html`<li>${q}</li>`)}</ul></div>` : ""}${versionsHTML(S.state)}
                  <p class="fine revise-line">${icon("retry")}<span>${I.mode === "en" ? html`Now revise: change your draft, then press <strong>Get feedback</strong> again to see what changed.` : I.T("Now revise: change your draft, then press Get feedback again to see what changed.", "Ahora revisa: cambia tu borrador y luego presiona Obtener comentarios otra vez para ver qué cambió.")}</span><button type="button" class="btn small" data-revise>${I.T("Back to my draft", "Volver a mi borrador")}</button></p>
                  ${coachLoopHTML(ctx)}
                </section>
                <section class="panel" id="wrt-finish">
                  <h3><span class="step-badge">5</span> ${I.T("Finish", "Terminar")}</h3>
                  ${partnerHTML(I, S.state)}
                  <label class="field"><span>${I.T("What did you improve, and why?", "¿Qué mejoraste y por qué?")}</span><textarea rows="3" data-reflection ${IGN}>${S.state.reflection}</textarea></label>
                  ${reflectStartersHTML(I)}
                  <div class="row-actions"><button type="button" class="btn btn-primary" data-finish ${wordCount(S.state.reflection) >= 5 ? "" : raw("disabled")}>${icon("bookmark")} ${I.T("Save to my portfolio", "Guardar en mi portafolio")}</button></div>
                  ${S.state.finishedAt ? html`<p class="saved-note">${icon("check")} <span>${I.T("Saved to your portfolio.", "Guardado en tu portafolio.")} <a href="${BASE}/write?tab=portfolio&grades=${ctx.band}">${I.T("See my portfolio", "Ver mi portafolio")}</a></span></p>` : ""}
                  ${S.state.finishedAt ? journeyHTML(I, S.state) : ""}
                  ${S.state.finishedAt ? html`<p class="row-actions"><button type="button" class="btn small" data-add-to-book>${icon("bookmark")} ${I.T("Add to my book", "Agregar a mi libro")}</button> <span class="fine">${I.T("Opens Book Studio with your writing on a page, ready for pictures and your voice.", "Abre Book Studio con tu escritura en una página, lista para imágenes y tu voz.")}</span></p>` : ""}
                  ${S.state.finishedAt && storage.get(CLASS_LINK_KEY) ? html`<p><button type="button" class="btn small" data-send-writing>${I.T("Send to my teacher", "Enviar a mi docente")}</button></p>` : ""}
                  ${S.state.finishedAt && S.state.versions.length < 2 ? html`<p class="fine">${I.T("Next, change one part of your draft and request feedback again. Compare your versions before trying a new topic.", "Después, cambia una parte de tu borrador y pide comentarios otra vez. Compara tus versiones antes de probar un tema nuevo.")}</p>` : ""}
                  ${nextTransfer ? html`<div class="next-application"><h4>${I.T("Apply it in a new context", "Aplícalo en un nuevo contexto")}</h4><p>${I.T("Use the same language move with new sources. Your first response there will be recorded as a transfer attempt, with your chosen supports noted separately.", "Usa la misma estrategia de lenguaje con nuevas fuentes. Tu primera respuesta allí se guardará como un intento de transferencia, con los apoyos elegidos registrados por separado.")}</p><a class="btn btn-primary" href="${BASE}/write/${nextTransfer.id}?grades=${ctx.band}&transfer=1&fromWriting=${task.id}">${I.T(`Try: ${nextTransfer.title}`, `Prueba: ${nextTransfer.title}`)} ${icon("arrow-right")}</a></div>` : ""}
                </section>
                ${S.state.finishedAt ? await exemplarsHTML(task) : ""}`
            : ""
        }
      </article>
      ${mission ? html`<p><a class="btn" href="${BASE}/missions/${mission.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the mission", "Volver a la misión")}</a></p>` : ""}`,
  };
}


const meterText = (n, min, max) => I.S(`${n} words · usually about ${min}–${max}`, `${n} palabras · normalmente entre ${min} y ${max}`);

function lockStage() {
  if (S.state.stage) return;
  S.state.stage = S.stage;
  // Keep what was opened before the first feedback (the model, speech to text); set what the stage provides.
  S.state.used = { ...S.state.used, frames: S.stage === "guided", bank: S.stage !== "independent" };
}

function feedback(ctx) {
  const text = S.state.draft ?? S.state.versions.at(-1)?.text ?? "";
  if (S.state.analyzedText === text && text) {
    announce(I.S("Nothing has changed since your last feedback. Revise your writing, then ask again.", "No ha cambiado nada desde tus últimos comentarios. Revisa tu escritura y vuelve a pedirlos."));
    return;
  }
  const badgesBefore = badgeFacts(S.studio, S.allTasks || []);
  lockStage();
  S.state.attemptId ||= `a${Date.now().toString(36)}`;
  const first = !S.ledger.entries.some(
    (x) => x.task === S.task.id && x.src === "writing" && ["first", "transfer"].includes(x.kind) && x.attempt === S.state.attemptId,
  );
  addVersion(S.state, text, first ? "draft" : "revision");
  S.state.analyzedText = text;
  S.state.finishedAt = "";
  const a = analyzeResponse(text, optsFor(S.task));
  const supports = {
    frames: S.state.used.frames,
    bank: S.state.used.bank,
    model: Boolean(S.state.used.model),
    coach: !first,
    ...(S.state.used.dictation ? { dictation: true } : {}),
  };
  appendEntry(S.ledger, {
    src: "writing",
    task: S.task.id,
    band: S.band,
    domain: "Writing",
    use: S.task.keyUse,
    stage: S.stage,
    kind: first ? (S.isTransfer ? "transfer" : "first") : "revision",
    attempt: S.state.attemptId,
    supports,
    m: { ...a.ledger, ...(S.isTransfer ? { transferAttempt: true, newContext: true, ...(S.transferFrom ? { transferFrom: S.transferFrom } : {}) } : {}) },
  });
  if (!first) award(ctx, `revision:${S.band}:${S.task.id}`, 3, "Thoughtful revision");
  if ((a.ledger?.cites || 0) >= 2) award(ctx, `evidence:${S.band}:${S.task.id}`, 3, "Evidence finder");
  saveLedger(S.ledger);
  save();
  announce(I.S("Feedback ready. Read your next moves, then revise.", "Comentarios listos. Lee tus próximos pasos y luego revisa."));
  celebrateBadges(I, badgesBefore, badgeFacts(S.studio, S.allTasks || []));
  ctx.rerender();
}

export function onInput(e, ctx) {
  if (onPlusFilter(e, I)) return;
  if (S?.studio && onMoreInput(e, I, S.studio, S.task ? S.state : null, S.task ? save : () => saveStudio(S.studio))) return;
  if (onLoopInput(e)) return;
  import("../lang/echo-self.js").then((m) => m.onEchoSelfInput(e, ctx));
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-draft]")) {
    S.state.draft = t.value;
    const n = wordCount(t.value);
    const meter = document.querySelector("[data-meter]");
    if (meter)
      meter.textContent = meterText(n, S.task.expected.minWords, S.task.expected.maxWords);
    const bar = document.querySelector(".meter-bar > span");
    if (bar)
      bar.style.width = `${Math.min(100, Math.round((n / S.task.expected.minWords) * 100))}%`;
    const b = document.querySelector("[data-feedback]");
    if (b) b.disabled = n < 4;
    save();
    onDraftTyped(I, S.task, t.value);
  } else if (t.matches("[data-org]")) {
    S.state.organizer[t.dataset.org] = t.value;
    onPlanTyped(t.dataset.org, t.value);
    save();
  } else if (t.matches("[data-reflection]")) {
    S.state.reflection = t.value;
    const b = document.querySelector("[data-finish]");
    if (b) b.disabled = wordCount(t.value) < 5;
    save();
  }
}

export function onChange(e, ctx) {
  if (onPlusFilter(e, I)) return;
  const t = e.target;
  if (t.matches("[data-goal]") && S?.task) {
    S.state.goal = t.value;
    goalCheered.delete(S.task.id);
    save();
    refreshGoal(I, S.task, S.state, S.stage, S.state.draft ?? S.state.versions.at(-1)?.text ?? "");
    return;
  }
  if (t.matches("[data-pick]") && S?.studio) {
    const picks = S.studio.portfolio.picks;
    const i = picks.findIndex((p) => p.id === t.dataset.pick);
    if (t.checked && i < 0) picks.push({ id: t.dataset.pick, t: new Date().toISOString() });
    if (!t.checked && i >= 0) picks.splice(i, 1);
    saveStudio(S.studio);
    return;
  }
  if (!S?.task) return;
  if (t.matches("[data-self-check-item]")) {
    S.state.checks ||= {};
    S.state.checks[t.dataset.selfCheckItem] = t.checked;
    const items = checksFor(S.task, S.stage);
    const n = items.filter(([id]) => S.state.checks[id]).length;
    const count = document.querySelector("[data-check-count]");
    if (count) count.textContent = I.S(`${n} of ${items.length}`, `${n} de ${items.length}`);
    save();
    return;
  }
  if (t.matches("[data-stage]")) {
    chosen.set(S.task.id, t.value);
    S.stage = t.value;
    ctx.rerender();
  }
}

export async function onClick(e, ctx) {
  const [{ onRegisterDialClick }, { onCohesionXrayClick }, { onEchoSelfClick }] = await Promise.all([
    import("../lang/register-dial.js"),
    import("../lang/cohesion-xray.js"),
    import("../lang/echo-self.js"),
  ]);
  if (onRegisterDialClick(e, ctx) || onCohesionXrayClick(e, ctx) || onEchoSelfClick(e, ctx)) return true;
  if (onDownloadClick(e, ctx)) return true;
  if (!S) return false;
  I = i18nFor(ctx);
  const t = e.target;
  if (t.closest("[data-print]")) {
    window.print();
    return true;
  }
  if (onPlusClick(e, I)) return true;
  const more = onMoreClick(e, I, S.studio, () => saveStudio(S.studio), S.allTasks || []);
  if (more === "rerender") ctx.rerender();
  if (more) return true;
  const piece = t.closest("[data-copy-piece]");
  if (piece) {
    copyOut(S.studio.writing[piece.dataset.copyPiece]?.versions.at(-1)?.text || "");
    return true;
  }
  if (onLoopClick(e, ctx)) return true;
  if (!S.task) return false;
  if (onHelpClick(e, ctx, I, S.task, S.state)) return true;
  const ins = t.closest("[data-insert]");
  if (ins) {
    insertIntoDraft(ins.dataset.insert, I);
    return true;
  }
  const useEv = t.closest("[data-use-evidence]");
  if (useEv) {
    const ev = S.state.evidence[Number(useEv.dataset.useEvidence)];
    if (ev) insertIntoDraft(`“${ev.text}”`, I);
    return true;
  }
  const reflectStart = t.closest("[data-reflect-start]");
  if (reflectStart) {
    startReflection(reflectStart.dataset.reflectStart);
    return true;
  }
  if (t.closest("[data-copy-writing]")) {
    copyOut(S.state.versions.at(-1)?.text || "");
    return true;
  }
  if (t.closest("[data-writing-focus]")) {
    if (focusedTasks.has(S.task.id)) focusedTasks.delete(S.task.id);
    else focusedTasks.add(S.task.id);
    ctx.rerender();
    return true;
  }

  if (t.closest("[data-intel-coach]")) {
    const text = S.state.analyzedText || S.state.versions.at(-1)?.text || "";
    if (!text.trim()) return true;
    const o = optsFor(S.task);
    S.state.intelLoop = startTextLoop(ctx, {
      src: "write",
      objective: pathwayContext()?.run?.objective || "",
      task: { id: S.task.id, title: S.task.title, prompt: S.task.prompt, keyUse: S.task.keyUse, domain: "Writing", sourceText: o.sourceText.join(" "), sourceTerms: o.sourceTerms },
      text,
      source: "typed",
      supports: { frames: S.state.used.frames, bank: S.state.used.bank, model: Boolean(S.state.used.model), coach: S.state.versions.length > 1 },
    });
    save();
    ctx.rerender();
    requestAnimationFrame(() => document.querySelector("#wrt-intel h3")?.focus?.());
    return true;
  }
  if (onEvidenceClick(e, S.task)) {
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-feedback]")) {
    feedback(ctx);
    return true;
  }
  if (t.closest("[data-second-look]")) {
    secondLook(ctx, t.closest("[data-second-look-box]"));
    return true;
  }
  const pickEv = t.closest("[data-pick-evidence]");
  if (pickEv) {
    const [si, pi, sj] = pickEv.dataset.pickEvidence.split(":").map(Number);
    const sent = splitSentences(S.task.sources[si].text[pi])[sj];
    const i = S.state.evidence.findIndex((x) => x.text === sent.text);
    if (i >= 0) S.state.evidence.splice(i, 1);
    else S.state.evidence.push({ src: S.task.sources[si].title, text: sent.text });
    announce(i >= 0 ? I.S("Removed from your evidence notebook.", "Quitado de tu cuaderno de evidencia.") : I.S("Added to your evidence notebook.", "Agregado a tu cuaderno de evidencia."));
    save();
    ctx.rerender();
    return true;
  }
  const drop = t.closest("[data-drop-evidence]");
  if (drop) {
    S.state.evidence.splice(Number(drop.dataset.dropEvidence), 1);
    save();
    ctx.rerender();
    return true;
  }
  const read = t.closest("[data-read-source]");
  if (read) {
    speak(S.task.sources[Number(read.dataset.readSource)].text, { rate: ctx.prefs.rate });
    return true;
  }
  const toBook = t.closest("[data-add-to-book]");
  if (toBook) {
    const versions = S.state.versions;
    const last = versions.at(-1);
    if (!last?.text) return true;
    toBook.disabled = true;
    // One shared contract (src/book/handoff.js): the final draft becomes a real, editable book page.
    const template = { narrative: "personal-narrative", cer: "science-investigation", essay: "evidence-argument", report: "informational-report", summary: "reading-response", letter: "persuasive-book" }[S.task.form];
    import("../book/handoff.js")
      .then(({ openInBookStudio }) =>
        openInBookStudio(
          {
            source: { kind: "writing", id: S.task.id, label: S.task.title },
            title: S.task.title,
            templateId: template,
            band: ctx.band,
            pages: [{ heading: S.task.title, text: last.text, prompt: { en: "This is your writing from the Writing Studio. Add a picture, record yourself reading it, and keep revising.", es: "Esta es tu escritura del Estudio de escritura. Agrega una imagen, grábate leyéndola y sigue revisando." } }],
          },
          (url) => ctx.navigate(url),
        ),
      )
      .catch(() => {
        toBook.disabled = false;
        announce(I.S("Could not open Book Studio. Your writing is still saved here.", "No se pudo abrir Book Studio. Tu escritura sigue guardada aquí."));
      });
    return true;
  }
  const sendWriting = t.closest("[data-send-writing]");
  if (sendWriting) {
    const text = S.state.versions.at(-1)?.text || "";
    sendWriting.disabled = true;
    import("../class/link.js")
      .then(async ({ api, loadLink }) => {
        const link = loadLink();
        const res = link && text ? await api.reviewShare(link, { label: S.task.title, text }) : { ok: false };
        announce(res.ok ? I.S("Sent to your teacher. Look in My class for their feedback.", "Enviado a tu docente. Busca sus comentarios en Mi clase.") : I.S("Could not send your writing. It is still on this device. Try again later.", "No se pudo enviar tu escritura. Sigue en este dispositivo. Inténtalo de nuevo más tarde."));
      })
      .catch(() => announce(I.S("Could not send your writing.", "No se pudo enviar tu escritura.")))
      .finally(() => {
        sendWriting.disabled = false;
      });
    return true;
  }
  if (t.closest("[data-revise]")) {
    const d = document.querySelector("[data-draft]");
    keepInView(d);
    d?.focus();
    return true;
  }
  if (t.closest("[data-read-draft]")) {
    speak(S.state.draft || S.state.versions.at(-1)?.text || "Write something first.", {
      rate: ctx.prefs.rate,
    });
    return true;
  }
  if (t.closest("[data-finish]")) {
    const badgesBefore = badgeFacts(S.studio, S.allTasks || []);
    addVersion(S.state, S.state.draft ?? "", "final");
    const goalNow = S.state.goal ? goalProgress(S.state.goal, S.task, S.state, S.stage, S.state.draft ?? "") : null;
    S.state.goalMet = Boolean(goalNow?.done);
    S.state.finishedAt = new Date().toISOString();
    if (S.mission) {
      const ms = missionState(S.studio, S.mission.id);
      ms.tasks[S.task.id] = { done: true, t: S.state.finishedAt };
    }
    save();
    announce(I.S("Saved to your portfolio.", "Guardado en tu portafolio."));
    celebrateBadges(I, badgesBefore, badgeFacts(S.studio, S.allTasks || []));
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-new-attempt]")) {
    Object.assign(S.state, {
      stage: "",
      organizer: {},
      draft: "",
      analyzedText: "",
      attemptId: "",
      reflection: "",
      finishedAt: "",
      used: {},
    });
    S.state.versions = S.state.versions.length ? [{ ...S.state.versions[0] }] : [];
    S.state.versions = [];
    save();
    ctx.rerender();
    return true;
  }
  return false;
}

function copyOut(text) {
  if (!text) return;
  navigator.clipboard
    ?.writeText(text)
    .then(() => announce(I.S("Copied. Paste it where you need it.", "Copiado. Pégalo donde lo necesites.")))
    .catch(() => announce(I.S("Could not copy. Select your writing and copy it.", "No se pudo copiar. Selecciona tu escritura y cópiala.")));
}

export function mount(root) {
  trackDisclosures(root);
  applyFilter(root, I);
  for (const d of root.querySelectorAll("details[data-model]"))
    d.addEventListener("toggle", () => {
      if (d.open && S?.state) {
        S.state.used.model = true;
        save();
      }
    });
}
export function unmount() {
  stopSpeech();
  stopDraftDictation();
}

// The optional AI second look: authored coach categories chosen by a model, shown in the lab's own words.
async function secondLook(ctx, box) {
  const out = box?.querySelector("[data-second-look-out]");
  const button = box?.querySelector("[data-second-look]");
  if (!out || !button) return;
  const draft = S.state.analyzedText || "";
  button.disabled = true;
  out.textContent = I.S("Looking…", "Revisando…");
  const res = await askSecondLook(draft, S.task.keyUse);
  button.disabled = false;
  if (!res.ok) {
    out.textContent = res.offline
      ? I.S("The AI helper is not available right now. The coach notes above are still your feedback.", "El asistente de IA no está disponible ahora. Las notas del coach de arriba siguen siendo tu comentario.")
      : I.S("Write a little more, then try again.", "Escribe un poco más y vuelve a intentarlo.");
    return;
  }
  const items = [];
  if (res.move) items.push(`<li><strong>${esc(res.move.label)}</strong> <span class="fine">${esc(res.move.ask)}</span></li>`);
  for (const p of res.patterns)
    items.push(`<li>${esc(I.S("Check this pattern:", "Revisa este patrón:"))} <a href="${BASE}/detective/${esc(p.id)}?grades=${esc(ctx.band)}">${esc(p.name)}</a></li>`);
  out.innerHTML = `<h4>${esc(I.S("A second look suggests", "Una segunda revisión sugiere"))}</h4><ul>${items.join("")}</ul>`;
  announce(I.S("Second look ready.", "Segunda revisión lista."));
}

// ═════════════════════════════════════════════════════════════════════════════════════════════
// Writing Studio, the parts around the draft: where a writer left off, finding a task, a self-check before feedback,
// live counts while typing, frames / words / evidence that drop into the draft, and the planning notes a teacher sees.
// Nothing here scores writing. Counts describe the page (words, sentences, versions); the self-check is the writer's
// own. "On my own" gets a proofreading check only, never the structure of the response, so an independent attempt
// stays independent. Teacher notes render only in Teacher view and reuse what the task already carries.

export const isTeacherView = () => readAudience() === "teacher";

// ── what a writer has done ───────────────────────────────────────────────────────────────────
/** "new" | "draft" (words or a plan, no feedback yet) | "feedback" (asked for feedback, not finished) | "done". */
export function taskStatus(w) {
  if (!w) return { id: "new", words: 0 };
  const text = w.draft ?? w.versions?.at(-1)?.text ?? "";
  const words = wordCount(text);
  if (w.finishedAt) return { id: "done", words };
  if (w.versions?.length) return { id: "feedback", words };
  const planned = Object.values(w.organizer || {}).some(Boolean) || (w.evidence || []).length > 0;
  return { id: words || planned ? "draft" : "new", words };
}

/** Totals over the given task ids: counts of what is on this device, never a judgment of it. */
export function studioStats(studio, ids) {
  const out = { started: 0, finished: 0, words: 0, revisions: 0 };
  for (const id of ids) {
    const w = studio.writing?.[id];
    const st = taskStatus(w);
    if (st.id === "new") continue;
    out.started += 1;
    out.words += st.words;
    if (st.id === "done") out.finished += 1;
    out.revisions += (w.versions || []).filter((v) => v.kind === "revision").length;
  }
  return out;
}

/** The unfinished piece touched most recently, or null. */
export function resumeTask(studio, tasks) {
  return (
    tasks
      .map((t) => ({ task: t, w: studio.writing?.[t.id], st: taskStatus(studio.writing?.[t.id]) }))
      .filter((r) => r.st.id === "draft" || r.st.id === "feedback")
      .sort((a, b) => String(b.w.updatedAt || "").localeCompare(String(a.w.updatedAt || "")))[0] || null
  );
}

/** Words, sentences and paragraphs in a draft. */
export function draftStats(text) {
  const t = String(text || "");
  return {
    words: wordCount(t),
    sentences: t.trim() ? splitSentences(t).length : 0,
    paragraphs: t.split(/\n\s*\n|\n/).filter((p) => p.trim()).length,
  };
}

const STATUS = {
  draft: ["writing", "In progress", "En progreso"],
  feedback: ["retry", "Ready to revise", "Listo para revisar"],
  done: ["check", "In my portfolio", "En mi portafolio"],
};
export function statusBadgeHTML(I, st) {
  const s = STATUS[st.id];
  if (!s) return "";
  return html`<span class="task-status is-${st.id}">${icon(s[0])} ${I.T(s[1], s[2])}${st.id !== "done" && st.words ? html` · ${I.T(`${st.words} words`, `${st.words} palabras`)}` : ""}</span>`;
}

// ── chooser: my writing, find a task ─────────────────────────────────────────────────────────
export function myWritingHTML(I, ctx, tasks, studio) {
  const stats = studioStats(studio, tasks.map((t) => t.id));
  if (!stats.started) return "";
  const r = resumeTask(studio, tasks);
  const stat = (n, en, es) => html`<li><strong>${n}</strong><span>${I.T(en, es)}</span></li>`;
  return html`<section class="my-writing panel" aria-labelledby="wrt-mine-h">
    <div class="my-writing-main">
      <h2 id="wrt-mine-h">${icon("bookmark")} ${I.T("My writing", "Mi escritura")}</h2>
      ${
        r
          ? html`<a class="resume-card" href="${BASE}/write/${r.task.id}?grades=${ctx.band}">
              <span class="resume-kicker">${r.st.id === "feedback" ? I.T("Keep revising", "Sigue revisando") : I.T("Keep writing", "Sigue escribiendo")}</span>
              <strong>${r.task.title}</strong>
              <span class="fine">${r.st.words ? I.T(`${r.st.words} words so far`, `${r.st.words} palabras hasta ahora`) : I.T("Your plan is saved", "Tu plan está guardado")}${r.w.updatedAt ? html` · ${formatDate(todayISO(new Date(r.w.updatedAt)))}` : ""}</span>
              ${icon("arrow-right")}
            </a>`
          : html`<p class="fine">${I.T("You finished everything you started. Great work! Pick a new task below.", "Terminaste todo lo que empezaste. ¡Muy buen trabajo! Elige una tarea nueva abajo.")}</p>`
      }
    </div>
    <ul class="writer-stats" aria-label="${I.S("What you have written on this device", "Lo que has escrito en este dispositivo")}">
      ${stat(stats.started, stats.started === 1 ? "piece started" : "pieces started", stats.started === 1 ? "texto empezado" : "textos empezados")}
      ${stat(stats.finished, "in my portfolio", "en mi portafolio")}
      ${stat(stats.words, "words written", "palabras escritas")}
      ${stat(stats.revisions, stats.revisions === 1 ? "revision" : "revisions", stats.revisions === 1 ? "revisión" : "revisiones")}
    </ul>
    <p class="fine my-writing-note">${I.T("This shows how much you have practiced here. It is not a score.", "Esto muestra cuánto has practicado aquí. No es una puntuación.")}</p>
  </section>`;
}

const filter = { q: "", subject: "", use: "", status: "" };
const uniq = (xs) => [...new Set(xs.filter(Boolean))].sort();

export function filterBarHTML(I, tasks, anyStarted) {
  const select = (key, label, labelEs, options) =>
    html`<label class="field find-field"><span>${I.T(label, labelEs)}</span>
      <select data-wrt-filter="${key}" ${IGN}>
        <option value="">${I.S("All", "Todos")}</option>
        ${options.map(([v, text]) => html`<option value="${v}" ${filter[key] === v ? raw("selected") : ""}>${text}</option>`)}
      </select></label>`;
  return html`<div class="find-task panel no-print" role="search" aria-label="${I.S("Find a writing task", "Buscar una tarea de escritura")}" data-wrt-find>
    <label class="field find-field find-q"><span>${icon("search")} ${I.T("Find a task", "Buscar una tarea")}</span>
      <input type="search" data-wrt-filter="q" value="${filter.q}" placeholder="${I.S("Try: garden, letter, science", "Prueba: jardín, carta, ciencias")}" autocomplete="off" ${IGN} /></label>
    ${select("subject", "Subject", "Materia", uniq(tasks.map((t) => t.contentArea)).map((v) => [v, v]))}
    ${select("use", "Purpose", "Propósito", uniq(tasks.map((t) => t.keyUse)).map((v) => [v, v]))}
    ${
      anyStarted
        ? select("status", "My progress", "Mi progreso", [
            ["new", I.S("Not started", "Sin empezar")],
            ["draft", I.S("In progress", "En progreso")],
            ["feedback", I.S("Ready to revise", "Listo para revisar")],
            ["done", I.S("In my portfolio", "En mi portafolio")],
          ])
        : ""
    }
    <button type="button" class="btn small" data-wrt-clear hidden>${icon("x")} ${I.T("Clear", "Borrar")}</button>
    <p class="find-count fine" data-wrt-count role="status"></p>
  </div>`;
}

/** Card attributes the filter reads. */
export const cardData = (task, st) => ({
  wrt: task.id,
  subject: task.contentArea || "",
  use: task.keyUse || "",
  status: st.id,
  text: `${task.title} ${task.form} ${task.contentArea} ${task.keyUse} ${task.scenario || ""}`.toLowerCase(),
});

export function matches(d, f) {
  return (
    (!f.subject || d.subject === f.subject) &&
    (!f.use || d.use === f.use) &&
    (!f.status || d.status === f.status) &&
    (!f.q.trim() || f.q.toLowerCase().trim().split(/\s+/).every((w) => d.text.includes(w)))
  );
}

/** Show the cards that match; fold open the groups that hold them; say how many. */
export function applyFilter(root, I) {
  const form = root.querySelector("[data-wrt-find]");
  if (!form) return;
  const active = Boolean(filter.q.trim() || filter.subject || filter.use || filter.status);
  let shown = 0;
  let total = 0;
  for (const group of root.querySelectorAll(".task-group")) {
    const isNext = group.classList.contains("is-next");
    let inGroup = 0;
    for (const card of group.querySelectorAll(".task-card[data-wrt]")) {
      const ok = !active || matches(card.dataset, filter);
      card.hidden = !ok;
      if (isNext) continue;
      total += 1;
      if (ok) {
        shown += 1;
        inGroup += 1;
      }
    }
    group.hidden = active && (isNext || !inGroup);
    if (active && inGroup) revealFoldsFor(group.querySelector(".task-card:not([hidden])"));
  }
  form.querySelector("[data-wrt-clear]").hidden = !active;
  form.querySelector("[data-wrt-count]").textContent = active
    ? shown
      ? I.S(`Showing ${shown} of ${total} tasks`, `Mostrando ${shown} de ${total} tareas`)
      : I.S("No task matches. Try fewer words or clear the filters.", "Ninguna tarea coincide. Prueba con menos palabras o borra los filtros.")
    : "";
}

// ── the draft: self-check, counts, inserting ─────────────────────────────────────────────────
const CHECKS = {
  cer: [
    ["claim", "My first sentence answers the question.", "Mi primera oración responde la pregunta."],
    ["evidence", "I used a fact or a number from the sources.", "Usé un dato o un número de las fuentes."],
    ["reason", "I explained why my evidence supports my claim.", "Expliqué por qué mi evidencia apoya mi afirmación."],
    ["reader", "A reader who did not see the sources would understand.", "Un lector que no vio las fuentes lo entendería."],
  ],
  paragraph: [
    ["main", "My first sentence tells my main idea.", "Mi primera oración dice mi idea principal."],
    ["details", "Each sentence after it supports that idea.", "Cada oración que sigue apoya esa idea."],
    ["link", "I used words that connect my ideas.", "Usé palabras que conectan mis ideas."],
    ["end", "My last sentence closes the paragraph.", "Mi última oración cierra el párrafo."],
  ],
  essay: [
    ["intro", "My introduction tells what the essay is about.", "Mi introducción dice de qué trata el ensayo."],
    ["body", "Each paragraph has one main idea.", "Cada párrafo tiene una idea principal."],
    ["evidence", "I used facts or details from the sources.", "Usé datos o detalles de las fuentes."],
    ["end", "My conclusion returns to my main point.", "Mi conclusión regresa a mi punto principal."],
  ],
  letter: [
    ["greet", "I greeted my reader and I signed my name.", "Saludé a mi lector y firmé con mi nombre."],
    ["purpose", "I said why I am writing near the start.", "Dije por qué escribo cerca del inicio."],
    ["reasons", "I gave reasons or details my reader needs.", "Di razones o detalles que mi lector necesita."],
    ["tone", "My words are polite for this reader.", "Mis palabras son amables para este lector."],
  ],
  report: [
    ["topic", "I named my topic at the start.", "Nombré mi tema al inicio."],
    ["facts", "My facts come from the sources.", "Mis datos vienen de las fuentes."],
    ["order", "My facts are in an order that makes sense.", "Mis datos están en un orden que tiene sentido."],
    ["own", "I used my own words, not copied sentences.", "Usé mis propias palabras, no oraciones copiadas."],
  ],
  summary: [
    ["main", "I told the main idea of the text.", "Dije la idea principal del texto."],
    ["key", "I kept only the most important details.", "Dejé solo los detalles más importantes."],
    ["own", "I used my own words.", "Usé mis propias palabras."],
    ["opinion", "I left out my opinion.", "No incluí mi opinión."],
  ],
  narrative: [
    ["order", "My story has a beginning, a middle and an end.", "Mi historia tiene inicio, desarrollo y final."],
    ["time", "I used words that show time order.", "Usé palabras que muestran el orden del tiempo."],
    ["detail", "I added a detail the reader can see, hear or feel.", "Agregué un detalle que el lector puede ver, oír o sentir."],
    ["tense", "My verbs stay in the same tense.", "Mis verbos se mantienen en el mismo tiempo."],
  ],
};
CHECKS.email = CHECKS.letter;
// "On my own": proofreading only. It names no part of the response.
const OWN_CHECKS = [
  ["task", "I reread the task and my writing answers it.", "Volví a leer la tarea y mi escritura la responde."],
  ["aloud", "I read my writing aloud and it sounds right.", "Leí mi escritura en voz alta y suena bien."],
  ["marks", "My sentences start with capital letters and end with punctuation.", "Mis oraciones empiezan con mayúscula y terminan con puntuación."],
];
export const checksFor = (task, stage) => (stage === "independent" ? OWN_CHECKS : CHECKS[task.form] || CHECKS.paragraph);

export function checklistHTML(I, task, state, stage) {
  const items = checksFor(task, stage);
  const on = state.checks || {};
  const n = items.filter(([id]) => on[id]).length;
  return html`<fieldset class="self-check" data-self-check>
    <legend>${icon("check")} ${I.T("Check your writing", "Revisa tu escritura")} <span class="fine" data-check-count>${I.T(`${n} of ${items.length}`, `${n} de ${items.length}`)}</span></legend>
    <ul>
      ${items.map(([id, en, es]) => html`<li><label><input type="checkbox" data-self-check-item="${id}" ${on[id] ? raw("checked") : ""} ${IGN} /> <span>${I.T(en, es)}</span></label></li>`)}
    </ul>
    <p class="fine">${I.T("Tick what you did. Then press Get feedback.", "Marca lo que hiciste. Después presiona Obtener comentarios.")}</p>
  </fieldset>`;
}

export function statsLineHTML(I, text) {
  const s = draftStats(text);
  return html`<span class="draft-stats" data-draft-stats>${statsText(I, s)}</span>`;
}
export const statsText = (I, s) =>
  I.S(
    `${s.sentences} ${s.sentences === 1 ? "sentence" : "sentences"} · ${s.paragraphs} ${s.paragraphs === 1 ? "paragraph" : "paragraphs"}`,
    `${s.sentences} ${s.sentences === 1 ? "oración" : "oraciones"} · ${s.paragraphs} ${s.paragraphs === 1 ? "párrafo" : "párrafos"}`,
  );

/** Text to add at the caret, with the spaces a writer would type. Pure, so it is tested without a browser. */
export function insertion(value, start, end, text) {
  const before = value.slice(0, start);
  const after = value.slice(end);
  const lead = before && !/\s$/.test(before) ? " " : "";
  const trail = after && !/^[\s.,;:!?]/.test(after) ? " " : "";
  const next = before + lead + text + trail + after;
  const at = before.length + lead.length;
  const blank = text.indexOf("___");
  return blank >= 0
    ? { value: next, selStart: at + blank, selEnd: at + blank + 3 }
    : { value: next, selStart: at + text.length + trail.length, selEnd: at + text.length + trail.length };
}

/** Put a frame, a word or a quotation into the draft at the caret; a frame's first blank is selected to type over. */
export function insertIntoDraft(text, I) {
  const box = document.querySelector("[data-draft]");
  if (!box) return false;
  const atEnd = document.activeElement !== box && box.selectionStart === 0 && box.selectionEnd === 0;
  const start = atEnd ? box.value.length : box.selectionStart;
  const end = atEnd ? box.value.length : box.selectionEnd;
  const r = insertion(box.value, start, end, text);
  box.value = r.value;
  box.focus();
  box.setSelectionRange(r.selStart, r.selEnd);
  box.dispatchEvent(new Event("input", { bubbles: true }));
  announce(I.S("Added to your writing.", "Agregado a tu escritura."), { toast: false });
  return true;
}

/** One short, kind line about how far the draft has come. It describes length only. */
export function cheer(words, min) {
  if (!words) return ["", ""];
  const part = words / min;
  if (part >= 1) return ["You have enough words. Read it again.", "Ya tienes suficientes palabras. Léelo otra vez."];
  if (part >= 0.6) return ["Almost there. Keep going.", "Ya casi. Sigue así."];
  if (part >= 0.25) return ["You are on your way.", "Vas por buen camino."];
  return ["Good start.", "Buen comienzo."];
}
export const cheerHTML = (I, words, min) =>
  html`<span class="goal-met" data-cheer>${words ? html`${icon(words >= min ? "check" : "sparkle")} ${I.T(...cheer(words, min))}` : ""}</span>`;

const goalAnnounced = new Set();
/** Called on every keystroke in the draft: sentence and paragraph counts, the saved stamp and the goal mark. */
export function onDraftTyped(I, task, text) {
  const s = draftStats(text);
  refreshTopicWords(I, task, text);
  if (S?.state) refreshGoal(I, task, S.state, S.stage, text);
  const line = document.querySelector("[data-draft-stats]");
  if (line) line.textContent = statsText(I, s);
  const stamp = document.querySelector("[data-saved-stamp]");
  if (stamp) stamp.textContent = I.S("Saved", "Guardado");
  const meter = document.querySelector(".editor-panel .meter");
  const met = s.words >= task.expected.minWords;
  meter?.classList.toggle("is-met", met);
  const cheerEl = document.querySelector("[data-cheer]");
  // Same words as the first render; the icon comes back on the next render.
  if (cheerEl && cheerEl.dataset.words !== cheer(s.words, task.expected.minWords)[0]) {
    cheerEl.dataset.words = cheer(s.words, task.expected.minWords)[0];
    cheerEl.textContent = I.S(...cheer(s.words, task.expected.minWords));
  }
  if (met && !goalAnnounced.has(task.id)) {
    goalAnnounced.add(task.id);
    announce(I.S("You have enough words. Read it again, then press Get feedback.", "Ya tienes suficientes palabras. Léelo otra vez y presiona Obtener comentarios."));
  }
  if (!met) goalAnnounced.delete(task.id);
}
/** A writer who opens a draft that is already long enough is not told again. */
export const primeGoal = (task, text) => {
  if (wordCount(text) >= task.expected.minWords) goalAnnounced.add(task.id);
};

/**
 * "What do I do now?" in one sentence, with one button. It follows what is saved (evidence, plan, words, feedback,
 * finish) and points at a place on the page; it never says anything about the writing itself.
 */
export function nextStepHTML(I, ctx, task, state, text, analyzed) {
  const words = wordCount(text);
  const read = (state.evidence || []).length > 0;
  const planned = Object.values(state.organizer || {}).some(Boolean);
  const step = (n, en, es, href, btnEn, btnEs) => ({ n, en, es, href, btnEn, btnEs });
  let s;
  if (state.finishedAt)
    s = step(5, "You finished this piece. Great work! It is in your portfolio.", "Terminaste este texto. ¡Muy buen trabajo! Está en tu portafolio.", `${BASE}/write?tab=portfolio&grades=${ctx.band}`, "See my portfolio", "Ver mi portafolio");
  else if (analyzed && state.versions.length >= 2)
    s = step(5, "Nice revising! Tell what you made better. Then save your writing.", "¡Buena revisión! Di qué mejoraste. Después guarda tu escritura.", "#wrt-finish", "Go to Finish", "Ir a Terminar");
  else if (analyzed)
    s = step(4, "Read your feedback. Change one thing in your writing. Then ask again.", "Lee tus comentarios. Cambia una cosa en tu escritura. Después vuelve a pedirlos.", "#wrt-feedback", "Read my feedback", "Leer mis comentarios");
  else if (words >= task.expected.minWords)
    s = step(3, "You have enough words. Check your writing. Then press Get feedback.", "Ya tienes suficientes palabras. Revisa tu escritura. Después presiona Obtener comentarios.", "#wrt-write", "Go to my writing", "Ir a mi escritura");
  else if (words >= 4)
    s = step(3, "Keep writing. Use your plan to help you.", "Sigue escribiendo. Usa tu plan para ayudarte.", "#wrt-write", "Go to my writing", "Ir a mi escritura");
  else if (planned)
    s = step(3, "Your plan is ready. Now write your sentences.", "Tu plan está listo. Ahora escribe tus oraciones.", "#wrt-write", "Start writing", "Empezar a escribir");
  else if (read)
    s = step(2, "Good reading! Now make a plan. Short notes are fine.", "¡Buena lectura! Ahora haz un plan. Las notas cortas están bien.", "#wrt-plan", "Go to my plan", "Ir a mi plan");
  else
    s = step(1, "Start here: read the sources. Tap a sentence you want to use.", "Empieza aquí: lee las fuentes. Toca una oración que quieras usar.", "#wrt-sources", "Start reading", "Empezar a leer");
  return html`<aside class="next-step ${state.finishedAt ? "is-done" : ""}" aria-label="${I.S("What to do now", "Qué hacer ahora")}">
    <span class="next-step-n">${state.finishedAt ? icon("star") : html`<span class="visually-hidden">${I.T("Step", "Paso")} </span>${s.n}`}</span>
    <p><strong>${I.T("What to do now", "Qué hacer ahora")}</strong> ${I.T(s.en, s.es)}</p>
    <a class="btn btn-primary" href="${s.href}">${I.T(s.btnEn, s.btnEs)} ${icon("arrow-right")}</a>
  </aside>`;
}

const REFLECT = [
  ["I added ", "Agregué "],
  ["I changed ___ because ", "Cambié ___ porque "],
  ["My writing is clearer now because ", "Mi escritura es más clara ahora porque "],
  ["Next time I will ", "La próxima vez voy a "],
];
/** Ways to begin the reflection. A tap puts the words in the box; the writer finishes the thought. */
export const reflectStartersHTML = (I) =>
  html`<p class="reflect-starters"><span class="fine">${I.T("Need a way to start? Tap one:", "¿Necesitas cómo empezar? Toca una:")}</span>
    ${REFLECT.map(([en, es]) => html`<button type="button" class="insert-chip" data-reflect-start="${I.S(en, es)}">${I.T(`${en.trim()}…`, `${es.trim()}…`)}</button>`)}</p>`;

export function startReflection(start) {
  const box = document.querySelector("[data-reflection]");
  if (!box) return false;
  const r = insertion(box.value, box.value.length, box.value.length, start);
  box.value = r.value;
  box.focus();
  box.setSelectionRange(r.selStart, r.selEnd);
  box.dispatchEvent(new Event("input", { bubbles: true }));
  return true;
}

// ── pictures: the plan as a map, a table as bars ─────────────────────────────────────────────
/** The task's own planning boxes as a path. A stop fills in when its box has a note. */
export function planMapHTML(I, task, state) {
  const slots = task.organizer || [];
  if (slots.length < 2) return "";
  return html`<ol class="plan-map" aria-label="${I.S("Map of your writing", "Mapa de tu escritura")}" data-plan-map>
    ${slots.map((slot, i) => html`<li class="${state.organizer?.[slot.id] ? "is-filled" : ""}" data-map-slot="${slot.id}"><span class="map-n">${i + 1}</span><span class="map-l">${slot.label}</span><span class="map-check">${icon("check")}<span class="visually-hidden"> ${I.T("(planned)", "(planeado)")}</span></span></li>`)}
  </ol>`;
}
export function onPlanTyped(slotId, value) {
  document.querySelector(`[data-map-slot="${CSS.escape(slotId)}"]`)?.classList.toggle("is-filled", Boolean(value.trim()));
}

/**
 * Numbers in a source table as { unit, max, cols, rows:[{label, values}] }, or null when the table is not plain
 * numbers in one unit ("410 grams", "95 grams"). Nothing is computed beyond reading the cells.
 */
export function tableSeries(table) {
  const headers = table?.headers || [];
  const rows = table?.rows || [];
  if (headers.length < 2 || headers.length > 4 || !rows.length || rows.length > 8) return null;
  const units = new Set();
  const out = [];
  for (const row of rows) {
    if (row.length !== headers.length) return null;
    const values = [];
    for (const cell of row.slice(1)) {
      const m = /^\$?(-?\d[\d,]*(?:\.\d+)?)\s*(%|[A-Za-z°][A-Za-z° ]*)?$/.exec(String(cell).trim());
      if (!m) return null;
      const n = Number(m[1].replace(/,/g, ""));
      if (!Number.isFinite(n) || n < 0) return null;
      units.add(String(cell).trim().startsWith("$") ? "$" : (m[2] || "").trim().toLowerCase().replace(/s$/, ""));
      values.push({ n, text: String(cell).trim() });
    }
    out.push({ label: String(row[0]), values });
  }
  if (units.size !== 1) return null;
  const max = Math.max(...out.flatMap((r) => r.values.map((v) => v.n)));
  return max > 0 ? { max, cols: headers.slice(1), rows: out } : null;
}

/** A source table drawn as bars, under the table it comes from. Every bar shows its number, and series differ by pattern as well as colour. */
export function tablePictureHTML(I, table) {
  const d = tableSeries(table);
  if (!d) return "";
  return html`<figure class="data-picture">
    <figcaption>${icon("growth")} ${I.T("The same numbers as a picture", "Los mismos números en una imagen")}</figcaption>
    ${d.cols.length > 1 ? html`<ul class="data-key">${d.cols.map((c, i) => html`<li><span class="bar-swatch s${i}"></span>${c}</li>`)}</ul>` : ""}
    <div class="data-bars">
      ${d.rows.map((r) => html`<div class="data-row"><span class="data-label">${r.label}</span><div class="data-set">${r.values.map((v, i) => html`<div class="data-bar"><span class="bar s${i}" style="width:${Math.max(2, Math.round((v.n / d.max) * 62))}%"></span><span class="bar-val">${v.text}</span></div>`)}</div></div>`)}
    </div>
  </figure>`;
}

// ── topic words ───────────────────────────────────────────────────────────────────────────────
const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** A term counts as used when each of its words appears, allowing common endings (erosion, runoffs, trials). */
function termPattern(term) {
  const words = String(term).toLowerCase().split(/\s+/).filter(Boolean);
  const stem = (w) => (w.length > 4 ? w.replace(/(e|s|es|ed|ing)$/, "") : w);
  return new RegExp(`\\b${words.map((w) => `${escRe(stem(w))}[a-z]*`).join("\\s+")}\\b`, "i");
}
/** The task's vocabulary terms that appear in the draft. */
export function topicWordsUsed(vocab = [], text = "") {
  return vocab.map((v) => v.term).filter((term) => term && termPattern(term).test(text));
}

/** Chips for the task's own vocabulary that fill in as the writer uses them. A word bank, so never "on my own". */
export function topicWordsHTML(I, task, text, stage) {
  if (stage === "independent" || !task.vocab?.length) return "";
  const used = new Set(topicWordsUsed(task.vocab, text));
  return html`<div class="topic-words" data-topic-words>
    <p class="topic-words-label">${icon("words")} ${I.T("Topic words", "Palabras del tema")} <span class="fine" data-topic-count>${I.T(`${used.size} of ${task.vocab.length} used`, `${used.size} de ${task.vocab.length} usadas`)}</span></p>
    <ul>${task.vocab.map((v) => html`<li class="${used.has(v.term) ? "is-used" : ""}" data-topic-term="${v.term}" title="${v.def}"><span class="tw-check">${icon("check")}</span>${v.term}<span class="visually-hidden" data-tw-state>${used.has(v.term) ? I.T(" (used)", " (usada)") : ""}</span></li>`)}</ul>
  </div>`;
}
function refreshTopicWords(I, task, text) {
  const box = document.querySelector("[data-topic-words]");
  if (!box) return;
  const used = new Set(topicWordsUsed(task.vocab, text));
  for (const li of box.querySelectorAll("[data-topic-term]")) {
    const on = used.has(li.dataset.topicTerm);
    if (li.classList.contains("is-used") !== on) {
      li.classList.toggle("is-used", on);
      li.querySelector("[data-tw-state]").textContent = on ? I.S(" (used)", " (usada)") : "";
    }
  }
  const count = box.querySelector("[data-topic-count]");
  if (count) count.textContent = I.S(`${used.size} of ${task.vocab.length} used`, `${used.size} de ${task.vocab.length} usadas`);
}

// ── help tools beside the draft ──────────────────────────────────────────────────────────────
// Four tools a writer opens when they want them. "I'm stuck" gives ways of working, never words for the response.
// "Use my plan" and "Listen" work on the writer's own words, so they stay open "on my own". Connecting words are a
// word bank: they are offered with frames or a word bank only, where bank use is already recorded.
const STUCK = {
  read: [
    ["Read one part. Stop. Say what it is about.", "Lee una parte. Detente. Di de qué trata."],
    ["Press Read aloud and listen while you read.", "Presiona Leer en voz alta y escucha mientras lees."],
    ["Tap a sentence to save it. You can use it later.", "Toca una oración para guardarla. Puedes usarla después."],
  ],
  plan: [
    ["You can plan in any language you know.", "Puedes planear en cualquier idioma que sepas."],
    ["One or two words in each box is enough.", "Una o dos palabras en cada casilla es suficiente."],
    ["Look at the sentences you saved. They can help.", "Mira las oraciones que guardaste. Te pueden ayudar."],
  ],
  write: [
    ["Read the task again. What does it ask you to do?", "Vuelve a leer la tarea. ¿Qué te pide hacer?"],
    ["Say your sentence out loud. Then type what you said.", "Di tu oración en voz alta. Después escribe lo que dijiste."],
    ["Write a short sentence first. You can make it longer later.", "Primero escribe una oración corta. Después puedes alargarla."],
    ["Look at your plan. Turn one note into a sentence.", "Mira tu plan. Convierte una nota en una oración."],
  ],
  revise: [
    ["Change one thing only. Small changes count.", "Cambia solo una cosa. Los cambios pequeños cuentan."],
    ["Listen to your writing one sentence at a time.", "Escucha tu escritura una oración a la vez."],
    ["Ask a partner: which part is not clear?", "Pregunta a un compañero: ¿qué parte no está clara?"],
  ],
};
export function stuckStep(state, text, analyzed) {
  if (analyzed) return "revise";
  if (wordCount(text) >= 4 || Object.values(state.organizer || {}).some(Boolean)) return "write";
  return (state.evidence || []).length ? "plan" : "read";
}

export const CONNECTORS = [
  ["Add an idea", "Agregar una idea", [["also", "también"], ["in addition", "además"], ["another reason is", "otra razón es"]]],
  ["Give an example", "Dar un ejemplo", [["for example", "por ejemplo"], ["such as", "como"], ["the source says", "la fuente dice"]]],
  ["Tell why", "Decir por qué", [["because", "porque"], ["so", "así que"], ["as a result", "como resultado"], ["therefore", "por lo tanto"]]],
  ["Show a difference", "Mostrar una diferencia", [["but", "pero"], ["however", "sin embargo"], ["on the other hand", "por otro lado"]]],
  ["Show the order", "Mostrar el orden", [["first", "primero"], ["next", "después"], ["then", "luego"], ["finally", "por último"]]],
  ["Finish", "Terminar", [["in conclusion", "en conclusión"], ["this shows that", "esto muestra que"]]],
];

/** Plan notes as text to start a draft from: the writer's own words, in plan order. */
export function planText(task, state) {
  return (task.organizer || [])
    .map((slot) => String(state.organizer?.[slot.id] || "").trim())
    .filter(Boolean)
    .join(" ");
}

export function helpToolsHTML(I, task, state, stage, text, analyzed) {
  const own = stage === "independent";
  const now = stuckStep(state, text, analyzed);
  const tool = (id, ico, en, es) =>
    html`<button type="button" class="btn small" data-help-tool="${id}" aria-expanded="false" aria-controls="wrt-help-${id}">${icon(ico)} ${I.T(en, es)}</button>`;
  return html`<div class="help-tools" data-help-tools>
    <p class="help-tools-label">${icon("help")} ${I.T("Help tools", "Herramientas de ayuda")}</p>
    <div class="help-tools-row">
      ${tool("stuck", "bulb", "I'm stuck", "Estoy atascado")}
      ${tool("plan", "list", "Use my plan", "Usar mi plan")}
      ${own ? "" : tool("link", "words", "Connecting words", "Palabras para conectar")}
      ${tool("listen", "volume", "Listen to each sentence", "Escuchar cada oración")}
      ${own ? "" : tool("say", "speaking", "Say it, see it", "Dilo y míralo")}
    </div>
    <div class="help-panel" id="wrt-help-stuck" hidden>
      <p class="help-title">${I.T("Try one of these:", "Prueba una de estas ideas:")}</p>
      ${Object.entries(STUCK).map(([step, tips]) => html`<ul data-stuck="${step}" ${step === now ? "" : raw("hidden")}>${tips.map(([en, es]) => html`<li>${I.T(en, es)}</li>`)}</ul>`)}
      <p class="fine">${I.T("Still stuck? Ask a partner or your teacher. Asking is what good writers do.", "¿Sigues atascado? Pregunta a un compañero o a tu docente. Preguntar es lo que hacen los buenos escritores.")}</p>
    </div>
    <div class="help-panel" id="wrt-help-plan" hidden>
      <p class="help-title">${I.T("Start from your plan", "Empieza desde tu plan")}</p>
      <p>${I.T("This puts your plan notes into your writing. Then turn each note into a full sentence.", "Esto pone las notas de tu plan en tu escritura. Después convierte cada nota en una oración completa.")}</p>
      <button type="button" class="btn btn-primary small" data-use-plan>${icon("arrow-right")} ${I.T("Put my plan in my writing", "Poner mi plan en mi escritura")}</button>
    </div>
    ${
      own
        ? ""
        : html`<div class="help-panel" id="wrt-help-link" hidden>
            <p class="help-title">${I.T("Tap a word to add it to your writing", "Toca una palabra para agregarla a tu escritura")}</p>
            <dl class="connectors">${CONNECTORS.map(([en, es, words]) => html`<div><dt>${I.T(en, es)}</dt><dd>${words.map(([w, g]) => html`<button type="button" class="insert-chip" data-insert="${w}">${w}${I.mode === "en" ? "" : html` <span class="gloss" lang="es">${g}</span>`}</button>`)}</dd></div>`)}</dl>
          </div>`
    }
    ${
      own
        ? ""
        : html`<div class="help-panel" id="wrt-help-say" hidden>
            <p class="help-title">${I.T("Say your sentence out loud", "Di tu oración en voz alta")}</p>
            <p>${I.T("Your words appear here. When you stop, they go into your writing so you can check and fix them.", "Tus palabras aparecen aquí. Cuando te detienes, pasan a tu escritura para que las revises y corrijas.")}</p>
            <div data-say-controls>${dictationControlsHTML(DICT_ID, I, { label: I.T("Start talking", "Empezar a hablar") })}</div>
            <p class="listen-sentence" data-say-preview aria-live="polite"></p>
          </div>`
    }
    <div class="help-panel" id="wrt-help-listen" hidden>
      <p class="help-title">${I.T("Listen for what sounds wrong", "Escucha lo que suena mal")}</p>
      <p class="listen-sentence" data-listen-text aria-live="polite"></p>
      <p class="row-actions">
        <button type="button" class="btn small" data-listen="prev">${icon("arrow-left")} ${I.T("Back", "Atrás")}</button>
        <button type="button" class="btn small" data-listen="again">${icon("replay")} ${I.T("Hear it again", "Escuchar otra vez")}</button>
        <button type="button" class="btn btn-primary small" data-listen="next">${I.T("Next sentence", "Siguiente oración")} ${icon("arrow-right")}</button>
        <span class="fine" data-listen-count></span>
      </p>
    </div>
  </div>`;
}

const DICT_ID = "wrt-draft";
let listenAt = 0;
function showSentence(I, ctx, move) {
  const box = document.querySelector("[data-draft]");
  const out = document.querySelector("[data-listen-text]");
  const count = document.querySelector("[data-listen-count]");
  if (!box || !out) return;
  const list = box.value.trim() ? splitSentences(box.value).map((x) => x.text.trim()).filter(Boolean) : [];
  if (!list.length) {
    out.textContent = I.S("Write a sentence first. Then you can listen to it.", "Primero escribe una oración. Después puedes escucharla.");
    if (count) count.textContent = "";
    return;
  }
  listenAt = Math.max(0, Math.min(list.length - 1, move === "start" ? 0 : listenAt + (move === "next" ? 1 : move === "prev" ? -1 : 0)));
  out.textContent = list[listenAt];
  if (count) count.textContent = I.S(`Sentence ${listenAt + 1} of ${list.length}`, `Oración ${listenAt + 1} de ${list.length}`);
  speak(list[listenAt], { rate: ctx.prefs?.rate });
}

/** Clicks inside the help tools. Returns true when it handled the click. */
export const stopDraftDictation = cancelDictation;
export function onHelpClick(e, ctx, I, task, state) {
  const t = e.target;
  const open = t.closest("[data-help-tool]");
  if (open) {
    const root = open.closest("[data-help-tools]");
    const id = open.dataset.helpTool;
    const was = open.getAttribute("aria-expanded") === "true";
    for (const b of root.querySelectorAll("[data-help-tool]")) b.setAttribute("aria-expanded", "false");
    for (const p of root.querySelectorAll(".help-panel")) p.hidden = true;
    if (!was) {
      open.setAttribute("aria-expanded", "true");
      root.querySelector(`#wrt-help-${id}`).hidden = false;
      if (id === "listen") showSentence(I, ctx, "start");
      if (id === "stuck") {
        // Tips follow where the writer is now, not where they were when the page was drawn.
        const live = stuckStep(state, document.querySelector("[data-draft]")?.value || "", Boolean(document.querySelector("#wrt-feedback")));
        for (const ul of root.querySelectorAll("[data-stuck]")) ul.hidden = ul.dataset.stuck !== live;
      }
    }
    return true;
  }
  if (t.closest("[data-use-plan]")) {
    const plan = planText(task, state);
    if (plan) insertIntoDraft(plan, I);
    else announce(I.S("Your plan is empty. Write a note in a plan box first.", "Tu plan está vacío. Primero escribe una nota en una casilla del plan."));
    return true;
  }
  const dict = t.closest(`[data-dictate="${DICT_ID}"]`);
  if (dict) {
    const preview = document.querySelector("[data-say-preview]");
    const controls = document.querySelector("[data-say-controls]");
    const redraw = () => {
      if (controls) controls.innerHTML = toHtml(dictationControlsHTML(DICT_ID, I, { label: I.T("Start talking", "Empezar a hablar") }));
    };
    toggleDictation(DICT_ID, {
      I,
      onText: (words) => {
        if (preview) preview.textContent = words;
      },
      onDone: (words) => {
        let said = String(words || "").trim();
        const before = document.querySelector("[data-draft]")?.value.trim() || "";
        // Recognizers return lowercase without a final mark; start a new sentence with a capital.
        if (said && (!before || /[.!?]["”']?$/.test(before))) said = said[0].toUpperCase() + said.slice(1);
        if (said) {
          state.used ||= {};
          state.used.dictation = true;
          insertIntoDraft(said, I);
        }
        if (preview) preview.textContent = "";
        redraw();
      },
    }).then(redraw);
    return true;
  }
  const listen = t.closest("[data-listen]");
  if (listen) {
    showSentence(I, ctx, listen.dataset.listen);
    return true;
  }
  return false;
}

/** After "Save to my portfolio": how the piece changed, in counts. */
export function journeyHTML(I, state) {
  const first = state.versions[0];
  const last = state.versions.at(-1);
  if (!first || !last) return "";
  const goal = GOALS.find((g) => g.id === state.goal);
  const goalLine = goal
    ? html`<p class="journey-goal ${state.goalMet ? "is-met" : ""}">${icon(state.goalMet ? "check" : "flag")} ${I.T("My goal", "Mi meta")}: ${I.T(goal.en, goal.es)} — ${state.goalMet ? I.T("met!", "¡cumplida!") : I.T("not yet. Keep it for next time.", "todavía no. Guárdala para la próxima vez.")}</p>`
    : "";
  const a = wordCount(first.text);
  const b = wordCount(last.text);
  const revs = state.versions.filter((v) => v.kind === "revision").length;
  const item = (n, en, es) => html`<li><strong>${n}</strong><span>${I.T(en, es)}</span></li>`;
  return html`<div class="journey" aria-label="${I.S("How this piece changed", "Cómo cambió este texto")}">
    <p class="journey-title">${icon("star")} ${I.T("You did it! Look how your writing grew.", "¡Lo lograste! Mira cómo creció tu escritura.")}</p>
    ${goalLine}
    <div class="growth-bars" role="img" aria-label="${I.S(`First draft: ${a} words. Now: ${b} words.`, `Primer borrador: ${a} palabras. Ahora: ${b} palabras.`)}">
      <div class="data-bar"><span class="data-label">${I.T("First draft", "Primer borrador")}</span><span class="bar s1" style="width:${Math.max(4, Math.round((a / Math.max(a, b, 1)) * 70))}%"></span><span class="bar-val">${a}</span></div>
      <div class="data-bar"><span class="data-label">${I.T("Now", "Ahora")}</span><span class="bar s0" style="width:${Math.max(4, Math.round((b / Math.max(a, b, 1)) * 70))}%"></span><span class="bar-val">${b}</span></div>
    </div>
    <ul class="writer-stats">
      ${item(a, "words in my first draft", "palabras en mi primer borrador")}
      ${item(b, "words now", "palabras ahora")}
      ${item(revs, revs === 1 ? "revision" : "revisions", revs === 1 ? "revisión" : "revisiones")}
      ${item((state.evidence || []).length, "evidence notes", "notas de evidencia")}
    </ul>
    <p class="row-actions no-print"><button type="button" class="btn small" data-copy-writing>${icon("copy")} ${I.T("Copy my writing", "Copiar mi escritura")}</button></p>
  </div>`;
}

// ── teacher view ─────────────────────────────────────────────────────────────────────────────
const studentLink = (ctx, id = "") => `${location.origin}${BASE}/write${id ? `/${id}` : ""}?grades=${ctx.band}`;

const ROUTINE = [
  ["Read together", "Leer juntos", "Read the situation and the sources aloud. Students tap the sentences they may use as evidence.", "Lean en voz alta la situación y las fuentes. Los estudiantes tocan las oraciones que pueden usar como evidencia."],
  ["Plan out loud", "Planear en voz alta", "Partners say each planning box to each other before they type it.", "En parejas, digan cada casilla del plan antes de escribirla."],
  ["Write", "Escribir", "Students choose their own level of help. The choice is saved with the draft, so you can see what was independent.", "Cada estudiante elige su nivel de ayuda. La elección se guarda con el borrador, para que vea qué fue independiente."],
  ["Feedback and revise", "Comentarios y revisión", "Students ask for feedback, change one thing, and ask again. The first draft is always kept.", "Los estudiantes piden comentarios, cambian una cosa y vuelven a pedir. El primer borrador siempre se guarda."],
  ["Share", "Compartir", "Finished pieces go to the portfolio. Students in a class can send a piece to your review queue.", "Los textos terminados van al portafolio. Los estudiantes de una clase pueden enviar un texto a su lista de revisión."],
];

export function teacherChooserHTML(I, ctx, tasks) {
  if (!isTeacherView()) return "";
  return html`<section class="teacher-notes panel no-print" aria-labelledby="wrt-teach-h" data-fold="open" id="wrt-teach">
    <header><h2 id="wrt-teach-h">${icon("teacher")} ${I.T("Teach with the Writing Studio", "Enseñar con el Estudio de escritura")}</h2>
      <p class="fine">${I.T("Shown in Teacher view only. Students do not see this panel.", "Se muestra solo en la vista docente. Los estudiantes no ven este panel.")}</p></header>
    <div class="teacher-grid">
      <div>
        <h3>${I.T("A lesson routine that needs no prep", "Una rutina de clase sin preparación")}</h3>
        <ol class="teach-routine">${ROUTINE.map(([en, es, den, des]) => html`<li><strong>${I.T(en, es)}.</strong> ${I.T(den, des)}</li>`)}</ol>
        <p class="row-actions">
          <button type="button" class="btn small" data-copy-link="${studentLink(ctx)}">${icon("copy")} ${I.T("Copy the student link", "Copiar el enlace para estudiantes")}</button>
          <a class="btn small" href="${BASE}/printables/studio-writing" target="_blank" rel="noopener">${icon("print")} ${I.T("Print task cards", "Imprimir tarjetas")}</a>
        </p>
        <h3>${I.T("A five-minute warm-up", "Un calentamiento de cinco minutos")}</h3>
        <p>${I.T("Quick writes are picture and question prompts with no feedback and no record of supports: a low-pressure start, a bell-ringer or an early-finisher choice.", "Las escrituras rápidas son imágenes y preguntas sin comentarios ni registro de apoyos: un inicio sin presión, una actividad de entrada o una opción para quien termina antes.")}</p>
        <p class="row-actions"><button type="button" class="btn small" data-copy-link="${location.origin}${BASE}/write?tab=quick&grades=${ctx.band}">${icon("copy")} ${I.T("Copy the quick-write link", "Copiar el enlace de escritura rápida")}</button></p>
        <h3>${I.T("On each task, in Teacher view", "En cada tarea, en la vista docente")}</h3>
        <ul class="teach-routine"><li>${I.T("Assign with a focus: the link shows students one goal for the day.", "Asignar con un enfoque: el enlace muestra a los estudiantes una meta para el día.")}</li><li>${I.T("Print a conference sheet with look-fors and questions.", "Imprimir una hoja de conferencia con qué observar y preguntas.")}</li><li>${I.T("Leave a conference note on the writer's device. They see it with the piece and in their portfolio.", "Dejar una nota de conferencia en el dispositivo del escritor. La ve con el texto y en su portafolio.")}</li></ul>
      </div>
      <div class="table-scroll" tabindex="0" role="region" aria-label="${I.S("Every writing task for this grade band", "Todas las tareas de escritura de este grupo de grados")}">
        <table class="data-table teach-table">
          <caption>${I.T(`${tasks.length} tasks for grades ${ctx.band.replace("-", "–")}`, `${tasks.length} tareas para los grados ${ctx.band.replace("-", "–")}`)}</caption>
          <thead><tr><th scope="col">${I.T("Task", "Tarea")}</th><th scope="col">${I.T("Purpose", "Propósito")}</th><th scope="col">${I.T("Subject", "Materia")}</th><th scope="col">${I.T("Time", "Tiempo")}</th><th scope="col"><span class="visually-hidden">${I.T("Link", "Enlace")}</span></th></tr></thead>
          <tbody>${tasks.map((t) => html`<tr><th scope="row"><a href="${BASE}/write/${t.id}?grades=${ctx.band}">${t.title}</a></th><td>${t.keyUse}</td><td>${t.contentArea}</td><td>${t.time}</td><td><button type="button" class="ghost small" data-copy-link="${studentLink(ctx, t.id)}" aria-label="${I.S(`Copy the link to ${t.title}`, `Copiar el enlace a ${t.title}`)}">${icon("copy")}</button></td></tr>`)}</tbody>
        </table>
      </div>
    </div>
  </section>`;
}


export function teacherTaskHTML(I, ctx, task, extra = "") {
  if (!isTeacherView()) return "";
  const e = task.expected || {};
  const g = task.stages?.guided || {};
  return disclosure(
    "wrt-teacher",
    html`${icon("teacher")} ${I.T("Teacher notes for this task", "Notas docentes para esta tarea")}`,
    html`<p class="fine">${I.T("Shown in Teacher view only. Everything here comes from the task itself.", "Se muestra solo en la vista docente. Todo lo que aparece aquí viene de la tarea misma.")}</p>
      <div class="teacher-grid">
        <div>
          <h4>${I.T("Language focus", "Enfoque de lenguaje")}</h4>
          <p class="entry-meta"><span class="tag">${task.keyUse}</span>${(task.dimensions || []).map((d) => html`<span class="tag">${d}</span>`)}${(task.standards || []).map((s) => html`<span class="tag">${s}</span>`)}</p>
          <h4>${I.T("What a complete response includes", "Qué incluye una respuesta completa")}</h4>
          <ul>${(task.organizer || []).map((o) => html`<li><strong>${o.label}.</strong> ${o.hint}</li>`)}</ul>
          ${e.minWords ? html`<p class="fine">${I.T(`Usual length: ${e.minWords}–${e.maxWords} words, ${e.paragraphs || 1} paragraph${(e.paragraphs || 1) === 1 ? "" : "s"}.`, `Extensión habitual: ${e.minWords}–${e.maxWords} palabras, ${e.paragraphs || 1} ${(e.paragraphs || 1) === 1 ? "párrafo" : "párrafos"}.`)}</p>` : ""}
          <p class="row-actions"><button type="button" class="btn small" data-copy-link="${studentLink(ctx, task.id)}">${icon("copy")} ${I.T("Copy the student link", "Copiar el enlace para estudiantes")}</button></p>
          ${extra}
        </div>
        <div>
          ${
            task.revisionPrompts?.length
              ? html`<h4>${I.T("Conference questions", "Preguntas para la conferencia")}</h4>
                  <ul>${task.revisionPrompts.map((p) => html`<li><em>${FOCUS[p.focus] ? I.T(FOCUS[p.focus][0], FOCUS[p.focus][1]) : p.focus}:</em> ${p.prompt}</li>`)}</ul>`
              : ""
          }
          ${g.model ? html`<h4>${I.T("Model response", "Respuesta modelo")}</h4><p class="portfolio-response">${g.model}</p>` : ""}
        </div>
      </div>`,
    { cls: "panel teacher-notes no-print" },
  );
}

// ── events ───────────────────────────────────────────────────────────────────────────────────
/** Chooser and shared buttons. Returns true when it handled the click. */
export function onPlusClick(e, I) {
  const t = e.target;
  const link = t.closest("[data-copy-link]");
  if (link) {
    navigator.clipboard
      ?.writeText(link.dataset.copyLink)
      .then(() => announce(I.S("Link copied. Paste it where your students will find it.", "Enlace copiado. Pégalo donde tus estudiantes lo encuentren.")))
      .catch(() => announce(link.dataset.copyLink));
    return true;
  }
  if (t.closest("[data-wrt-clear]")) {
    Object.assign(filter, { q: "", subject: "", use: "", status: "" });
    const root = t.closest("[data-wrt-find]");
    for (const el of root.querySelectorAll("[data-wrt-filter]")) el.value = "";
    applyFilter(document, I);
    root.querySelector('[data-wrt-filter="q"]')?.focus();
    return true;
  }
  return false;
}

/** Search box and selects on the chooser. */
export function onPlusFilter(e, I) {
  const el = e.target.closest?.("[data-wrt-filter]");
  if (!el) return false;
  filter[el.dataset.wrtFilter] = el.value;
  applyFilter(document, I);
  return true;
}

// ═════════════════════════════════════════════════════════════════════════════════════════════
// Engagement and teaching extras (kept in this module so the lab shell lists one Writing Studio helper, not two):
//   students  quick writes from a picture or a question (no feedback, no record of supports: a place to write freely),
//             badges for what a writer has tried, a partner share with "glow" and "wonder", and a surprise task
//   teachers  a focus for the day carried in the task link, a printable conference sheet, and a conference note that
//             stays with the piece on the device and shows in the writer's portfolio
// Nothing here scores writing or adds to the language ledger. Badges count what a writer has done, not how well.
// Quick writes are kept in the studio document under "quick-<prompt id>", in the same shape as a task's writing,
// so backup, import and the teacher's samples read them without a special case.
const PIC = `${BASE}/pictures`;

// ── quick writes ─────────────────────────────────────────────────────────────────────────────
const STARTERS = {
  story: [["First, ", "Primero, "], ["Then ", "Luego "], ["After that, ", "Después de eso, "], ["In the end, ", "Al final, "]],
  howto: [["First, ", "Primero, "], ["Next, ", "Después, "], ["Last, ", "Por último, "]],
  opinion: [["I think ___ because ", "Pienso que ___ porque "], ["Another reason is ", "Otra razón es "], ["That is why ", "Por eso "]],
  describe: [["I see ", "Veo "], ["One difference is ", "Una diferencia es "], ["I think this happens because ", "Creo que esto pasa porque "]],
  memory: [["One day, ", "Un día, "], ["I felt ___ because ", "Me sentí ___ porque "], ["I learned that ", "Aprendí que "]],
};

/** id, kind, picture file (or ""), prompt EN/ES, picture description EN/ES. Pictures are the lab's own drawings. */
export const QUICK = [
  ["kite", "story", "35t-kite-seq.svg", "Tell the story of the kite. What happens first, next and last?", "Cuenta la historia de la cometa. ¿Qué pasa primero, después y al final?", "Three pictures: a girl flies a red kite, the kite gets stuck in a tall tree, and her grandfather pulls it down with a rake.", "Tres imágenes: una niña vuela una cometa roja, la cometa se atora en un árbol alto y su abuelo la baja con un rastrillo."],
  ["lost-dog", "story", "35-speaking-lost-dog.svg", "Tell the story of the lost dog. How does it end?", "Cuenta la historia del perro perdido. ¿Cómo termina?", "Three pictures: a dog runs out of an open gate, a girl and her father put up a Lost Dog poster, and a neighbor brings the dog back.", "Tres imágenes: un perro sale por una puerta abierta, una niña y su papá ponen un cartel de perro perdido y un vecino devuelve al perro."],
  ["picnic", "story", "35-speaking-rainy-picnic.svg", "Tell what happens to the picnic. How does the family fix the problem?", "Cuenta qué pasa con el pícnic. ¿Cómo resuelve el problema la familia?", "Three pictures: a family carries a picnic basket to the park, rain falls on their blanket, and they eat the picnic at home on the floor.", "Tres imágenes: una familia lleva una canasta de pícnic al parque, llueve sobre su manta y comen el pícnic en casa, en el piso."],
  ["backpack", "story", "35-writing-lost-backpack.svg", "Tell the story of the green backpack. How do you think the boy feels at the end?", "Cuenta la historia de la mochila verde. ¿Cómo crees que se siente el niño al final?", "Three pictures: a boy leaves his green backpack on the bus, a girl finds it, and she gives it back to him at school.", "Tres imágenes: un niño deja su mochila verde en el autobús, una niña la encuentra y se la devuelve en la escuela."],
  ["umbrella", "story", "35t-rain-seq.svg", "Tell the story of the rainy walk to school. What does a good friend do?", "Cuenta la historia de la caminata bajo la lluvia. ¿Qué hace un buen amigo?", "Four pictures: a girl walks to school in the sun, rain pours down, a friend comes with a red umbrella, and they share it.", "Cuatro imágenes: una niña camina a la escuela con sol, empieza a llover, llega un amigo con un paraguas rojo y lo comparten."],
  ["tortillas", "howto", "35t-tortilla-seq.svg", "Tell how they make the food, step by step. Then tell about a food your family makes.", "Di cómo preparan la comida, paso a paso. Después cuenta sobre una comida que hace tu familia.", "Three pictures: a girl and her grandmother mix dough, they roll and flatten it into circles, and the family shares the food at the table.", "Tres imágenes: una niña y su abuela mezclan la masa, la aplanan en círculos y la familia comparte la comida en la mesa."],
  ["bird-feeder", "howto", "35-writing-bird-feeder.svg", "Teach a friend how to make this bird feeder. Write the steps in order.", "Enseña a un amigo a hacer este comedero para pájaros. Escribe los pasos en orden.", "Three steps: spread sunflower butter on a pinecone, roll it in birdseed, and hang it on a branch where a bird eats.", "Tres pasos: untar crema de girasol en una piña de pino, rodarla en semillas y colgarla en una rama donde come un pájaro."],
  ["class-pet", "opinion", "35-writing-class-pet.svg", "Which class pet is better: the fish or the hamster? Give two reasons.", "¿Qué mascota de clase es mejor: el pez o el hámster? Da dos razones.", "Two choices for a class pet: a goldfish in a tank and a hamster in a cage with a wheel.", "Dos opciones de mascota para la clase: un pez dorado en una pecera y un hámster en una jaula con una rueda."],
  ["classrooms", "opinion", "68-two-classrooms.svg", "Which classroom would you choose? Tell why.", "¿Qué salón escogerías? Di por qué.", "Two classrooms side by side. Both have desks and a board. One has computers. The other has paint and art supplies.", "Dos salones, uno junto al otro. Los dos tienen pupitres y un pizarrón. Uno tiene computadoras. El otro tiene pintura y materiales de arte."],
  ["park-cleanup", "describe", "35t-park-cleanup.svg", "What are the neighbors doing? Why does their work matter?", "¿Qué hacen los vecinos? ¿Por qué es importante su trabajo?", "Neighbors clean up a park: a girl picks up a can, a boy carries a recycling bin, two children plant a tree and a man waters flowers.", "Unos vecinos limpian un parque: una niña recoge una lata, un niño lleva un bote de reciclaje, dos niños plantan un árbol y un señor riega las flores."],
  ["hillsides", "describe", "68c-hillside-erosion.svg", "How are the two hillsides different after the rain? Why do you think so?", "¿En qué son diferentes las dos laderas después de la lluvia? ¿Por qué crees que es así?", "Two hillsides by a river after a storm. One has trees and grass and clear water. The other has bare soil, stumps and muddy water.", "Dos laderas junto a un río después de una tormenta. Una tiene árboles, pasto y agua clara. La otra tiene tierra sin plantas, troncos cortados y agua con lodo."],
  ["helped", "memory", "", "Tell about a time you helped someone, or someone helped you.", "Cuenta sobre una vez que ayudaste a alguien, o que alguien te ayudó.", "", ""],
  ["rather", "opinion", "", "Would you rather live near the ocean or near the mountains? Tell why.", "¿Preferirías vivir cerca del mar o cerca de las montañas? Di por qué.", "", ""],
  ["teach", "howto", "", "Teach someone how to do something you are good at.", "Enseña a alguien a hacer algo que tú haces bien.", "", ""],
  ["place", "describe", "", "Describe a place you love. What do you see and hear there?", "Describe un lugar que te encanta. ¿Qué ves y qué oyes allí?", "", ""],
].map(([id, kind, pic, en, es, alt, altEs]) => ({ id, kind, pic, en, es, alt, altEs }));

export const quickKey = (id) => `quick-${id}`;
export const isQuickKey = (key) => String(key).startsWith("quick-");
/** Saved quick writes, newest first: [{prompt, w, text}]. */
export function quickWrites(studio) {
  return QUICK.map((prompt) => ({ prompt, w: studio.writing?.[quickKey(prompt.id)] }))
    .filter((r) => r.w?.versions?.length)
    .map((r) => ({ ...r, text: r.w.versions.at(-1).text }))
    .sort((a, b) => String(b.w.updatedAt || "").localeCompare(String(a.w.updatedAt || "")));
}

const KIND = {
  story: ["Tell a story", "Cuenta una historia"],
  howto: ["Explain the steps", "Explica los pasos"],
  opinion: ["Share your opinion", "Da tu opinión"],
  describe: ["Describe it", "Descríbelo"],
  memory: ["Tell about you", "Cuenta sobre ti"],
};

export function quickChooserHTML(I, ctx, studio) {
  const saved = quickWrites(studio);
  const done = new Set(saved.map((s) => s.prompt.id));
  return html`<div class="d-writing quick-write" data-no-studio-video>
    <header class="quick-head">
      <p class="eyebrow">${icon("sparkle")} ${I.T("Writing Studio", "Estudio de escritura")}</p>
      <h1 tabindex="-1">${I.T("Quick write", "Escritura rápida")}</h1>
      <p class="lead">${I.T("Pick a picture or a question. Write what you think. There is no wrong answer here, and nobody checks it.", "Elige una imagen o una pregunta. Escribe lo que piensas. Aquí no hay respuesta incorrecta y nadie lo revisa.")}</p>
    </header>
    <ul class="quick-grid">
      ${QUICK.map((p) => html`<li><a class="card quick-card ${p.pic ? "" : "is-text"}" href="${BASE}/write?tab=quick&p=${p.id}&grades=${ctx.band}">
        ${p.pic ? html`<img src="${PIC}/${p.pic}" alt="" width="640" height="400" loading="lazy" decoding="async" />` : html`<span class="quick-q" aria-hidden="true">?</span>`}
        <span class="quick-kind">${I.T(...KIND[p.kind])}${done.has(p.id) ? html` <span class="task-status is-done">${icon("check")} ${I.T("Written", "Escrito")}</span>` : ""}</span>
        <strong>${I.T(p.en, p.es)}</strong>
      </a></li>`)}
    </ul>
    ${
      saved.length
        ? html`<section class="panel quick-saved" aria-labelledby="qw-saved-h"><h2 id="qw-saved-h">${icon("bookmark")} ${I.T("My quick writes", "Mis escrituras rápidas")}</h2>
            <ul>${saved.map((s) => html`<li><p class="quick-saved-meta"><strong>${I.T(s.prompt.en, s.prompt.es)}</strong> <span class="fine">${I.T(`${wordCount(s.text)} words`, `${wordCount(s.text)} palabras`)}${s.w.updatedAt ? html` · ${formatDate(todayISO(new Date(s.w.updatedAt)))}` : ""}</span></p><p class="portfolio-response">${s.text}</p><p class="row-actions no-print"><a class="btn small" href="${BASE}/write?tab=quick&p=${s.prompt.id}&grades=${ctx.band}">${icon("writing")} ${I.T("Add more", "Agregar más")}</a></p></li>`)}</ul>
          </section>`
        : ""
    }
    <p><a class="btn" href="${BASE}/write?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to Writing Studio", "Volver al Estudio de escritura")}</a></p>
  </div>`;
}

export function quickWriteHTML(I, ctx, studio, prompt) {
  const w = writingState(studio, quickKey(prompt.id));
  const text = w.draft ?? w.versions.at(-1)?.text ?? "";
  const starters = STARTERS[prompt.kind] || STARTERS.story;
  return html`<article class="d-writing quick-write quick-one" data-quick="${prompt.id}" data-no-studio-video>
    <header class="quick-head">
      <p class="eyebrow">${icon("sparkle")} ${I.T("Quick write", "Escritura rápida")} · ${I.T(...KIND[prompt.kind])}</p>
      <h1 tabindex="-1">${I.T(prompt.en, prompt.es)}</h1>
      <p><button type="button" class="ghost small" data-say="${I.S(prompt.en, prompt.es)}">${icon("volume")} ${I.T("Hear the question", "Escuchar la pregunta")}</button></p>
    </header>
    <div class="quick-cols ${prompt.pic ? "" : "is-text"}">
      ${prompt.pic ? html`<figure class="quick-pic"><img src="${PIC}/${prompt.pic}" alt="${I.S(prompt.alt, prompt.altEs)}" width="640" height="400" decoding="async" /></figure>` : ""}
      <section class="panel editor-panel">
        <label class="field paper"><span class="paper-head">${I.T("Your writing", "Tu escritura")} <span class="fine">${I.T("Saved on this device as you type", "Se guarda en este dispositivo mientras escribes")}</span></span>
          <textarea rows="9" spellcheck="false" placeholder="${I.S("Write here. Any length is fine.", "Escribe aquí. Cualquier extensión está bien.")}" data-quick-draft ${IGN}>
${text}</textarea></label>
        <p class="meter-line"><span data-quick-count>${I.S(`${wordCount(text)} words`, `${wordCount(text)} palabras`)}</span></p>
        <p class="reflect-starters"><span class="fine">${I.T("Need a way to start? Tap one:", "¿Necesitas cómo empezar? Toca una:")}</span>
          ${starters.map(([en, es]) => html`<button type="button" class="insert-chip" data-quick-start="${I.S(en, es)}">${I.T(`${en.trim()}…`, `${es.trim()}…`)}</button>`)}</p>
        <div class="row-actions">
          <button type="button" class="btn btn-primary" data-quick-save ${wordCount(text) ? "" : raw("disabled")}>${icon("bookmark")} ${I.T("Save my quick write", "Guardar mi escritura rápida")}</button>
          <a class="btn" href="${BASE}/write?tab=quick&grades=${ctx.band}">${I.T("Pick another one", "Elegir otra")}</a>
        </div>
        ${w.finishedAt && w.versions.at(-1)?.text === text ? html`<p class="saved-note">${icon("check")} <span>${I.T("Saved. Nice writing!", "Guardado. ¡Buena escritura!")}</span></p>` : ""}
      </section>
    </div>
  </article>`;
}

// ── badges ───────────────────────────────────────────────────────────────────────────────────
/** What a writer has done on this device, as booleans. Reads the studio document; judges nothing. */
export function badgeFacts(studio, tasks) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const entries = Object.entries(studio.writing || {}).filter(([id]) => byId.has(id));
  const finished = entries.filter(([, w]) => w.finishedAt);
  return {
    draft: entries.some(([, w]) => w.versions?.length),
    reviser: entries.some(([, w]) => (w.versions || []).some((v) => v.kind === "revision")),
    evidence: entries.some(([, w]) => (w.evidence || []).length >= 2),
    planner: entries.some(([id, w]) => (byId.get(id).organizer || []).length > 0 && byId.get(id).organizer.every((s) => String(w.organizer?.[s.id] || "").trim())),
    published: finished.length >= 1,
    three: finished.length >= 3,
    explorer: new Set(finished.map(([id]) => byId.get(id).form)).size >= 3,
    own: finished.some(([, w]) => w.stage === "independent"),
    partner: entries.some(([, w]) => String(w.partner?.glow || "").trim() && String(w.partner?.wonder || "").trim()),
    quick: quickWrites(studio).length >= 3,
    goal: finished.some(([, w]) => w.goalMet),
  };
}

export const BADGES = [
  ["draft", "writing", "First draft", "Primer borrador", "Ask for feedback on a draft.", "Pide comentarios sobre un borrador."],
  ["planner", "list", "Planner", "Planificador", "Fill every box of a plan.", "Llena todas las casillas de un plan."],
  ["evidence", "evidence", "Evidence collector", "Coleccionista de evidencia", "Save two sentences from the sources.", "Guarda dos oraciones de las fuentes."],
  ["reviser", "retry", "Reviser", "Revisor", "Change a draft and ask for feedback again.", "Cambia un borrador y pide comentarios otra vez."],
  ["partner", "conversation", "Good partner", "Buen compañero", "Share a piece and write what your partner said.", "Comparte un texto y escribe lo que dijo tu compañero."],
  ["published", "bookmark", "In my portfolio", "En mi portafolio", "Finish one piece.", "Termina un texto."],
  ["three", "medal", "Three pieces", "Tres textos", "Finish three pieces.", "Termina tres textos."],
  ["explorer", "worlds", "Explorer", "Explorador", "Finish three different kinds of writing.", "Termina tres tipos de escritura diferentes."],
  ["own", "user", "On my own", "Por mi cuenta", "Finish a piece you wrote on your own.", "Termina un texto que escribiste por tu cuenta."],
  ["quick", "sparkle", "Quick writer", "Escritor veloz", "Save three quick writes.", "Guarda tres escrituras rápidas."],
  ["goal", "flag", "Goal getter", "Logra metas", "Finish a piece that meets a goal you chose.", "Termina un texto que cumple una meta que elegiste."],
];

export function badgesHTML(I, studio, tasks) {
  const facts = badgeFacts(studio, tasks);
  const n = BADGES.filter(([id]) => facts[id]).length;
  return html`<section class="panel writer-badges" aria-labelledby="wrt-badges-h" id="wrt-badges">
    <header><h2 id="wrt-badges-h">${icon("medal")} ${I.T("My writer badges", "Mis insignias de escritor")}</h2>
      <p class="fine">${I.T(`${n} of ${BADGES.length} collected. Badges show what you have tried. They are not a score.`, `${n} de ${BADGES.length} conseguidas. Las insignias muestran lo que has probado. No son una puntuación.`)}</p></header>
    <ul class="badge-grid">
      ${BADGES.map(([id, ico, en, es, how, howEs]) => html`<li class="${facts[id] ? "is-earned" : ""}"><span class="badge-ico">${icon(facts[id] ? ico : "lock")}</span><strong>${I.T(en, es)}</strong><span class="fine">${facts[id] ? html`<span class="visually-hidden">${I.T("Collected.", "Conseguida.")} </span>` : html`<span class="visually-hidden">${I.T("Not yet.", "Todavía no.")} </span>`}${I.T(how, howEs)}</span></li>`)}
    </ul>
  </section>`;
}

/** Badges collected between two readings of the facts, as [en, es] names. */
export function newBadges(before, after) {
  return BADGES.filter(([id]) => after[id] && !before[id]).map(([, , en, es]) => [en, es]);
}
/** Say which badge was just collected. Call with the facts read before and after a save. */
export function celebrateBadges(I, before, after) {
  for (const [en, es] of newBadges(before, after))
    announce(I.S(`New badge: ${en}! See it in the Writing Studio.`, `¡Nueva insignia: ${es}! Mírala en el Estudio de escritura.`));
}

/** A task the writer has not started, for "Surprise me". `pick` is injectable so the choice can be tested. */
export function surpriseTask(tasks, studio, pick = Math.random) {
  const fresh = tasks.filter((t) => !studio.writing?.[t.id]);
  const pool = fresh.length ? fresh : tasks;
  return pool.length ? pool[Math.min(pool.length - 1, Math.floor(pick() * pool.length))] : null;
}

/** Doors from the chooser: quick write and surprise. */
export function extrasRowHTML(I, ctx, tasks, studio) {
  const s = surpriseTask(tasks, studio);
  return html`<div class="wrt-doors no-print">
    <a class="card wrt-door" href="${BASE}/write?tab=quick&grades=${ctx.band}"><span class="task-ico">${icon("sparkle")}</span><span><strong>${I.T("Quick write", "Escritura rápida")}</strong><span class="fine">${I.T("A picture or a question. Write freely. Nobody checks it.", "Una imagen o una pregunta. Escribe con libertad. Nadie lo revisa.")}</span></span>${icon("arrow-right")}</a>
    ${s ? html`<a class="card wrt-door" href="${BASE}/write/${s.id}?grades=${ctx.band}"><span class="task-ico">${icon("replay")}</span><span><strong>${I.T("Surprise me", "Sorpréndeme")}</strong><span class="fine">${I.T("Open a task you have not tried yet.", "Abre una tarea que aún no has probado.")}</span></span>${icon("arrow-right")}</a>` : ""}
  </div>`;
}

// ── partner share ────────────────────────────────────────────────────────────────────────────
export function partnerHTML(I, state) {
  const p = state.partner || {};
  return html`<div class="partner-share" data-partner>
    <h4>${icon("conversation")} ${I.T("Share with a partner", "Comparte con un compañero")}</h4>
    <ol class="partner-steps">
      <li>${I.T("Read your writing aloud to a partner.", "Lee tu escritura en voz alta a un compañero.")}</li>
      <li>${I.T("Your partner tells you one thing they liked and one thing they wonder.", "Tu compañero te dice una cosa que le gustó y una cosa que se pregunta.")}
        <span class="partner-stems"><span class="tag">${I.T("I like how you…", "Me gusta cómo…")}</span><span class="tag">${I.T("I wonder…", "Me pregunto…")}</span></span></li>
      <li>${I.T("Write what your partner said.", "Escribe lo que dijo tu compañero.")}</li>
    </ol>
    <div class="partner-fields">
      <label class="field"><span>${I.T("My partner liked…", "A mi compañero le gustó…")}</span><textarea rows="2" data-partner-field="glow" ${IGN}>${p.glow || ""}</textarea></label>
      <label class="field"><span>${I.T("My partner wondered…", "Mi compañero se preguntó…")}</span><textarea rows="2" data-partner-field="wonder" ${IGN}>${p.wonder || ""}</textarea></label>
    </div>
  </div>`;
}

/** Partner and conference notes as they appear in the portfolio. */
export function notesForPortfolioHTML(I, w) {
  const p = w.partner || {};
  const c = w.conference || {};
  const has = (x) => String(x || "").trim();
  if (!has(p.glow) && !has(p.wonder) && !has(c.glow) && !has(c.next)) return "";
  return html`<section class="entry-notes">
    ${has(p.glow) || has(p.wonder) ? html`<div><h3>${icon("conversation")} ${I.T("What my partner said", "Lo que dijo mi compañero")}</h3>${has(p.glow) ? html`<p><strong>${I.T("Liked:", "Le gustó:")}</strong> ${p.glow}</p>` : ""}${has(p.wonder) ? html`<p><strong>${I.T("Wondered:", "Se preguntó:")}</strong> ${p.wonder}</p>` : ""}</div>` : ""}
    ${has(c.glow) || has(c.next) ? html`<div><h3>${icon("teacher")} ${I.T("From my writing conference", "De mi conferencia de escritura")}</h3>${has(c.glow) ? html`<p><strong>${I.T("Working well:", "Va bien:")}</strong> ${c.glow}</p>` : ""}${has(c.next) ? html`<p><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${c.next}</p>` : ""}</div>` : ""}
  </section>`;
}

// ── teacher: compare two samples (a projectable mini-lesson) ──────────────────────────────────
/** The early and strong practice samples for a task, side by side; what each writer did stays hidden until revealed. */
export function compareLessonHTML(I, ctx, task, exemplars) {
  const back = html`<p class="row-actions no-print"><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a></p>`;
  if (!isTeacherView())
    return html`<article class="compare-lesson d-writing" data-no-studio-video>${back}<h1 tabindex="-1">${task.title}</h1><p>${I.T("This mini-lesson opens in Teacher view.", "Esta minilección se abre en la vista docente.")}</p></article>`;
  const pick = (b) => exemplars.find((x) => x.taskId === task.id && x.practiceBand === b);
  const a = pick("early");
  const b = pick("strong");
  if (!a || !b)
    return html`<article class="compare-lesson d-writing" data-no-studio-video>${back}<h1 tabindex="-1">${task.title}</h1><p>${I.T("This task has no sample responses yet.", "Esta tarea aún no tiene respuestas de ejemplo.")}</p></article>`;
  const sample = (label, x) => html`<section class="compare-sample"><h2>${label}</h2><p class="portfolio-response">${x.response}</p>
    <details class="studio-disc"><summary>${icon("search")} ${I.T("Show what this writer did", "Mostrar lo que hizo este escritor")}</summary><div class="disc-body"><ul>${x.annotations.map((n) => html`<li>“${n.quote}” — <em>${n.dimension}</em>: ${n.note}</li>`)}</ul><p class="fine"><strong>${I.T("Next step:", "Próximo paso:")}</strong> ${x.nextStep}</p></div></details></section>`;
  return html`<article class="compare-lesson d-writing" data-no-studio-video>
    ${back}
    <header>
      <p class="eyebrow">${icon("teacher")} ${I.T("Mini-lesson · compare two samples", "Minilección · comparar dos ejemplos")} · ${task.keyUse}</p>
      <h1 tabindex="-1">${task.title}</h1>
      <p class="lead">${task.prompt}</p>
      <p class="fine no-print">${I.T("Press Present to project it. Use it before students draft, or after their first draft to plan a revision. These are practice samples, not WIDA levels.", "Presione Presentar para proyectarla. Úsela antes de que escriban o después del primer borrador para planear una revisión. Son ejemplos de práctica, no niveles de WIDA.")}</p>
    </header>
    <div class="compare-grid">${sample(I.T("Sample A", "Ejemplo A"), a)}${sample(I.T("Sample B", "Ejemplo B"), b)}</div>
    <section class="compare-talk panel">
      <h2>${icon("conversation")} ${I.T("Talk with a partner", "Habla con un compañero")}</h2>
      <ol>
        <li>${I.T("Which sample would help the reader more? Why?", "¿Qué ejemplo ayudaría más al lector? ¿Por qué?")} <span class="tag">${I.T("Sample ___ helps more because…", "El ejemplo ___ ayuda más porque…")}</span></li>
        <li>${I.T("Find one sentence in Sample B that does something Sample A does not.", "Encuentra una oración del ejemplo B que hace algo que el ejemplo A no hace.")} <span class="tag">${I.T("In Sample B, the writer…", "En el ejemplo B, el escritor…")}</span></li>
        <li>${I.T("Choose one move you will try in your own writing.", "Elige una estrategia que vas a probar en tu propia escritura.")} <span class="tag">${I.T("I will try…", "Voy a intentar…")}</span></li>
      </ol>
    </section>
  </article>`;
}

// ── teacher: focus for the day, conference note, conference sheet ───────────────────────────
export const FOCUS = {
  evidence: ["Evidence", "Evidencia", "Use facts or numbers from the sources.", "Usa datos o números de las fuentes."],
  reasoning: ["Reasoning", "Razonamiento", "Explain why your evidence matters.", "Explica por qué importa tu evidencia."],
  cohesion: ["Connecting ideas", "Conectar ideas", "Use words that link your sentences.", "Usa palabras que enlacen tus oraciones."],
  precision: ["Precise words", "Palabras precisas", "Choose exact words from the topic.", "Elige palabras exactas del tema."],
  sentence: ["Sentences", "Oraciones", "Write complete sentences. Try joining two short ones.", "Escribe oraciones completas. Intenta unir dos cortas."],
};
export const focusFrom = (search) => {
  const f = new URLSearchParams(search).get("focus") || "";
  return Object.hasOwn(FOCUS, f) ? f : "";
};

/** The focus a teacher put in the link, shown to the writer above the steps. The values are a fixed list, never free text. */
export function focusBannerHTML(I, task, focus) {
  if (!focus) return "";
  const f = FOCUS[focus];
  const ask = (task.revisionPrompts || []).find((p) => p.focus === focus)?.prompt;
  return html`<aside class="focus-banner" aria-label="${I.S("Focus from your teacher", "Enfoque de tu docente")}">
    <span class="focus-ico">${icon("flag")}</span>
    <p><strong>${I.T("Today's focus from your teacher", "El enfoque de hoy de tu docente")}: ${I.T(f[0], f[1])}</strong> ${I.T(f[2], f[3])}${ask ? html` <span class="focus-ask">${ask}</span>` : ""}</p>
  </aside>`;
}

const link = (ctx, id, extra = "") => `${location.origin}${BASE}/write/${id}?grades=${ctx.band}${extra}`;

/** Teacher view, inside the task's teacher notes: assign with a focus, print a conference sheet. */
export function teacherAssignHTML(I, ctx, task) {
  const offered = Object.keys(FOCUS).filter((k) => (task.revisionPrompts || []).some((p) => p.focus === k));
  const list = offered.length ? offered : Object.keys(FOCUS);
  return html`<div class="teacher-assign">
    <h4>${I.T("Assign with a focus", "Asignar con un enfoque")}</h4>
    <p class="fine">${I.T("Pick one focus. Students who open the link see it above the steps. The link carries no student information.", "Elija un enfoque. Los estudiantes que abren el enlace lo ven sobre los pasos. El enlace no lleva información de estudiantes.")}</p>
    <p class="focus-links">${list.map((k) => html`<button type="button" class="btn small" data-copy-link="${link(ctx, task.id, `&focus=${k}`)}">${icon("copy")} ${I.T(FOCUS[k][0], FOCUS[k][1])}</button>`)}</p>
    <p class="row-actions"><a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=conference" target="_blank" rel="noopener">${icon("print")} ${I.T("Conference sheet to print", "Hoja de conferencia para imprimir")}</a><a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=compare">${icon("library")} ${I.T("Mini-lesson: compare two samples", "Minilección: comparar dos ejemplos")}</a><a class="btn small" href="${BASE}/write/${task.id}?grades=${ctx.band}&sheet=week">${icon("calendar")} ${I.T("Five-day plan", "Plan de cinco días")}</a></p>
  </div>`;
}

/** Teacher view, beside a draft: a note that stays with this piece on this device and shows in the writer's portfolio. */
export function conferenceHTML(I, state, hasDraft) {
  const c = state.conference || {};
  if (!isTeacherView()) {
    if (!String(c.glow || "").trim() && !String(c.next || "").trim()) return "";
    return html`<aside class="conference-card" aria-label="${I.S("From your writing conference", "De tu conferencia de escritura")}">
      <h4>${icon("teacher")} ${I.T("From your writing conference", "De tu conferencia de escritura")}</h4>
      ${String(c.glow || "").trim() ? html`<p><strong>${I.T("Working well:", "Va bien:")}</strong> ${c.glow}</p>` : ""}
      ${String(c.next || "").trim() ? html`<p><strong>${I.T("Next step:", "Siguiente paso:")}</strong> ${c.next}</p>` : ""}
    </aside>`;
  }
  return html`<section class="panel teacher-notes conference-note no-print" aria-labelledby="wrt-conf-h">
    <h3 id="wrt-conf-h">${icon("teacher")} ${I.T("Conference with this writer", "Conferencia con este escritor")}</h3>
    <p class="fine">${hasDraft ? I.T("Teacher view only. Your note is saved with this piece on this device. The writer sees it here and in their portfolio.", "Solo en la vista docente. Su nota se guarda con este texto en este dispositivo. El escritor la ve aquí y en su portafolio.") : I.T("Teacher view only. Open this on the writer's device after they have a draft, then leave a note here.", "Solo en la vista docente. Abra esto en el dispositivo del escritor cuando tenga un borrador y deje una nota aquí.")}</p>
    <div class="partner-fields">
      <label class="field"><span>${I.T("One thing that is working", "Una cosa que va bien")}</span><textarea rows="2" maxlength="400" data-conference-field="glow" ${IGN}>${c.glow || ""}</textarea></label>
      <label class="field"><span>${I.T("One next step", "Un siguiente paso")}</span><textarea rows="2" maxlength="400" data-conference-field="next" ${IGN}>${c.next || ""}</textarea></label>
    </div>
  </section>`;
}

/** A one-page sheet for conferring on a task: look-fors, questions and room for notes. Carries no student data. */
export function conferenceSheetHTML(I, ctx, task) {
  const lines = (n) => Array.from({ length: n }, () => html`<span class="sheet-line"></span>`);
  return html`<article class="conference-sheet d-writing">
    <p class="row-actions no-print"><button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print this sheet", "Imprimir esta hoja")}</button><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a></p>
    <header>
      <p class="eyebrow">${I.T("Writing conference", "Conferencia de escritura")} · ${task.keyUse} · ${task.contentArea}</p>
      <h1 tabindex="-1">${task.title}</h1>
      <p class="sheet-names"><span>${I.T("Writer", "Escritor")}: <span class="sheet-line"></span></span><span>${I.T("Date", "Fecha")}: <span class="sheet-line"></span></span></p>
      <p class="sheet-task"><strong>${I.T("Task", "Tarea")}:</strong> ${task.prompt}</p>
    </header>
    <section><h2>${I.T("Look for", "Observe")}</h2>
      <ul class="sheet-checks">${(task.organizer || []).map((o) => html`<li><span class="sheet-box"></span><span><strong>${o.label}.</strong> ${o.hint}</span></li>`)}</ul></section>
    ${task.revisionPrompts?.length ? html`<section><h2>${I.T("Questions to ask", "Preguntas para hacer")}</h2><ul>${task.revisionPrompts.map((p) => html`<li><em>${FOCUS[p.focus] ? I.T(FOCUS[p.focus][0], FOCUS[p.focus][1]) : p.focus}:</em> ${p.prompt}</li>`)}</ul></section>` : ""}
    <section class="sheet-notes">
      <div><h2>${I.T("Working well", "Va bien")}</h2>${lines(3)}</div>
      <div><h2>${I.T("One next step", "Un siguiente paso")}</h2>${lines(3)}</div>
    </section>
    <section><h2>${I.T("Help the writer used", "Ayuda que usó el escritor")}</h2>
      <p class="sheet-help"><span><span class="sheet-box"></span> ${I.T("Frames and words", "Marcos y palabras")}</span><span><span class="sheet-box"></span> ${I.T("Word bank", "Banco de palabras")}</span><span><span class="sheet-box"></span> ${I.T("On their own", "Por su cuenta")}</span></p></section>
    <p class="fine">${I.T("Classroom practice notes. Not a WIDA score or a proficiency level.", "Notas de práctica en el aula. No son una puntuación de WIDA ni un nivel de dominio.")}</p>
  </article>`;
}

// ── events ───────────────────────────────────────────────────────────────────────────────────
/** Typing in a quick write, a partner field or a conference field. `save` persists the studio document. */
export function onMoreInput(e, I, studio, state, save) {
  const t = e.target;
  if (t.matches?.("[data-quick-draft]")) {
    const id = t.closest("[data-quick]")?.dataset.quick;
    if (!id) return true;
    const w = writingState(studio, quickKey(id));
    w.draft = t.value;
    w.quick = true;
    w.updatedAt = new Date().toISOString();
    const n = wordCount(t.value);
    const count = document.querySelector("[data-quick-count]");
    if (count) count.textContent = I.S(`${n} words`, `${n} palabras`);
    const b = document.querySelector("[data-quick-save]");
    if (b) b.disabled = !n;
    save();
    return true;
  }
  if (!state) return false;
  if (t.matches?.("[data-partner-field]")) {
    state.partner ||= {};
    state.partner[t.dataset.partnerField] = t.value;
    save();
    return true;
  }
  if (t.matches?.("[data-conference-field]")) {
    state.conference ||= {};
    state.conference[t.dataset.conferenceField] = t.value;
    state.conference.t = new Date().toISOString();
    save();
    return true;
  }
  return false;
}

/** Clicks on the quick-write page. Returns "rerender" when the page should be drawn again, true when handled. */
export function onMoreClick(e, I, studio, save, tasks = []) {
  const t = e.target;
  const start = t.closest("[data-quick-start]");
  if (start) {
    const box = document.querySelector("[data-quick-draft]");
    if (!box) return true;
    const r = insertion(box.value, box.value.length, box.value.length, start.dataset.quickStart);
    box.value = r.value;
    box.focus();
    box.setSelectionRange(r.selStart, r.selEnd);
    box.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }
  if (t.closest("[data-quick-save]")) {
    const id = t.closest("[data-quick]")?.dataset.quick;
    const box = document.querySelector("[data-quick-draft]");
    if (!id || !box?.value.trim()) return true;
    const before = badgeFacts(studio, tasks);
    const w = writingState(studio, quickKey(id));
    addVersion(w, box.value, "final");
    w.draft = box.value;
    w.quick = true;
    w.finishedAt = new Date().toISOString();
    w.updatedAt = w.finishedAt;
    save();
    announce(I.S("Saved. Nice writing!", "Guardado. ¡Buena escritura!"));
    celebrateBadges(I, before, badgeFacts(studio, tasks));
    return "rerender";
  }
  return false;
}

// ── a goal the writer chooses ─────────────────────────────────────────────────────────────────
// One goal, picked by the writer, checked from the draft as they type. It describes the page (sentences, words,
// a number, a reason); it is never a score. "On my own" offers no goal that names a word list or the task's words.
export const GOALS = [
  { id: "sentences", en: "Write 5 sentences", es: "Escribir 5 oraciones" },
  { id: "length", en: "Reach the usual length", es: "Llegar a la extensión habitual" },
  { id: "topic", en: "Use 3 topic words", es: "Usar 3 palabras del tema", supported: true },
  { id: "number", en: "Include a number or a quotation from the sources", es: "Incluir un número o una cita de las fuentes" },
  { id: "reasons", en: "Give 2 reasons (because, so, since)", es: "Dar 2 razones (porque, así que, ya que)", own: { en: "Give 2 reasons", es: "Dar 2 razones" } },
  { id: "revise", en: "Change my draft after feedback", es: "Cambiar mi borrador después de los comentarios" },
];
const REASON_RE = /\b(because|so|since|therefore|as a result|that is why|porque|ya que|por eso)\b/gi;

/** Progress toward a goal from the draft and the saved versions: { done, now, need }. */
export function goalProgress(id, task, state, stage, text) {
  const t = String(text || "");
  const s = draftStats(t);
  switch (id) {
    case "sentences":
      return { now: s.sentences, need: 5, done: s.sentences >= 5 };
    case "length": {
      const need = task.expected?.minWords || 50;
      return { now: s.words, need, done: s.words >= need };
    }
    case "topic": {
      const need = Math.min(3, task.vocab?.length || 0);
      const now = topicWordsUsed(task.vocab, t).length;
      return { now, need, done: need > 0 && now >= need };
    }
    case "number": {
      const done = /\d/.test(t) || /["“”]/.test(t);
      return { now: done ? 1 : 0, need: 1, done };
    }
    case "reasons": {
      const now = (t.match(REASON_RE) || []).length;
      return { now, need: 2, done: now >= 2 };
    }
    case "revise": {
      const now = (state.versions || []).filter((v) => v.kind === "revision").length;
      return { now, need: 1, done: now >= 1 };
    }
    default:
      return { now: 0, need: 0, done: false };
  }
}
export const goalsFor = (stage) => GOALS.filter((g) => !(stage === "independent" && g.supported));
const goalLabel = (I, g, stage) => (stage === "independent" && g.own ? I.T(g.own.en, g.own.es) : I.T(g.en, g.es));
const goalLabelS = (I, g, stage) => (stage === "independent" && g.own ? I.S(g.own.en, g.own.es) : I.S(g.en, g.es));

function goalStatusText(I, task, state, stage, text) {
  const g = goalsFor(stage).find((x) => x.id === state.goal);
  if (!g) return I.S("Pick a goal if you want one.", "Elige una meta si quieres.");
  const p = goalProgress(g.id, task, state, stage, text);
  if (p.done) return I.S("Goal met! Nice work.", "¡Meta cumplida! Buen trabajo.");
  return p.need > 1 ? I.S(`${p.now} of ${p.need} so far`, `${p.now} de ${p.need} hasta ahora`) : I.S("Not yet", "Todavía no");
}

export function goalRowHTML(I, task, state, stage, text) {
  const goals = goalsFor(stage);
  const chosen = goals.some((g) => g.id === state.goal) ? state.goal : "";
  const p = chosen ? goalProgress(chosen, task, state, stage, text) : null;
  return html`<div class="goal-row ${p?.done ? "is-met" : ""}" data-goal-row>
    <label class="field goal-field"><span>${icon("flag")} ${I.T("My goal today", "Mi meta de hoy")}</span>
      <select data-goal ${IGN}>
        <option value="">${I.S("No goal (optional)", "Sin meta (opcional)")}</option>
        ${goals.map((g) => html`<option value="${g.id}" ${chosen === g.id ? raw("selected") : ""}>${goalLabelS(I, g, stage)}</option>`)}
      </select></label>
    <p class="goal-status" data-goal-status role="status">${goalStatusText(I, task, state, stage, text)}</p>
  </div>`;
}

const goalCheered = new Set();
function refreshGoal(I, task, state, stage, text) {
  const row = document.querySelector("[data-goal-row]");
  if (!row) return;
  const status = row.querySelector("[data-goal-status]");
  const p = state.goal ? goalProgress(state.goal, task, state, stage, text) : null;
  row.classList.toggle("is-met", Boolean(p?.done));
  const next = goalStatusText(I, task, state, stage, text);
  if (status && status.textContent !== next) status.textContent = next;
  if (p?.done && !goalCheered.has(task.id)) {
    goalCheered.add(task.id);
    announce(I.S("You met your goal!", "¡Cumpliste tu meta!"));
  }
  if (!p?.done) goalCheered.delete(task.id);
}

/** The goal a writer chose for a piece, as a portfolio tag. */
export function goalTagHTML(I, w) {
  const g = GOALS.find((x) => x.id === w.goal);
  if (!g) return "";
  return html`<p class="entry-meta"><span class="tag ${w.goalMet ? "is-met" : ""}">${icon(w.goalMet ? "check" : "flag")} ${I.T("Goal", "Meta")}: ${goalLabel(I, g, w.stage)}${w.goalMet ? I.T(" — met", " — cumplida") : ""}</span></p>`;
}

// ── teacher: a five-day plan for one task ─────────────────────────────────────────────────────
const QUICK_FOR_FORM = { narrative: "story", cer: "describe", essay: "describe", report: "describe", summary: "describe", letter: "opinion", email: "opinion", paragraph: "opinion" };

/** A week with one writing task, built from the studio's own tools. Teacher view only; nothing about students. */
export function weekPlanHTML(I, ctx, task) {
  const back = html`<p class="row-actions no-print"><a class="btn" href="${BASE}/write/${task.id}?grades=${ctx.band}">${icon("arrow-left")} ${I.T("Back to the task", "Volver a la tarea")}</a><button type="button" class="btn btn-primary" data-print>${icon("print")} ${I.T("Print this plan", "Imprimir este plan")}</button></p>`;
  if (!isTeacherView())
    return html`<article class="week-plan d-writing" data-no-studio-video>${back}<h1 tabindex="-1">${task.title}</h1><p>${I.T("This plan opens in Teacher view.", "Este plan se abre en la vista docente.")}</p></article>`;
  const q = QUICK.find((p) => p.kind === (QUICK_FOR_FORM[task.form] || "describe"));
  const link = (href, en, es) => html`<a href="${href}">${I.T(en, es)}</a>`;
  const u = (extra = "") => `${BASE}/write/${task.id}?grades=${ctx.band}${extra}`;
  const days = [
    {
      en: "Read and notice", es: "Leer y observar",
      do: [
        [`Warm up with a quick write${q ? `: “${q.en}”` : ""} (5 minutes).`, `Calentamiento con una escritura rápida${q ? `: “${q.es}”` : ""} (5 minutos).`],
        ["Read the situation and the sources aloud. Students save two sentences as evidence.", "Lean en voz alta la situación y las fuentes. Los estudiantes guardan dos oraciones como evidencia."],
      ],
      tools: [link(q ? `${BASE}/write?tab=quick&p=${q.id}&grades=${ctx.band}` : `${BASE}/write?tab=quick&grades=${ctx.band}`, "Quick write", "Escritura rápida"), link(u(), "The task", "La tarea")],
      look: ["Students can say what the task asks in their own words.", "Los estudiantes pueden decir con sus palabras qué pide la tarea."],
    },
    {
      en: "Study two samples", es: "Estudiar dos ejemplos",
      do: [
        ["Project the two samples. Partners decide which helps the reader more and why.", "Proyecte los dos ejemplos. En parejas deciden cuál ayuda más al lector y por qué."],
        ["Reveal what each writer did. Students name one move to try.", "Muestre lo que hizo cada escritor. Los estudiantes nombran una estrategia para probar."],
      ],
      tools: [link(u("&sheet=compare"), "Compare two samples", "Comparar dos ejemplos")],
      look: ["Students point to a sentence and say what it does.", "Los estudiantes señalan una oración y dicen qué hace."],
    },
    {
      en: "Plan and draft", es: "Planear y escribir",
      do: [
        ["Students choose their level of help, fill the plan, then write. Speech to text and the help tools are there for those who need them.", "Cada estudiante elige su nivel de ayuda, llena el plan y escribe. La voz a texto y las herramientas de ayuda están para quien las necesite."],
        ["Each writer picks one goal for the day.", "Cada escritor elige una meta para el día."],
      ],
      tools: [link(u(), "The task", "La tarea"), ...(task.revisionPrompts?.length ? [link(u(`&focus=${task.revisionPrompts[0].focus}`), "The task with a focus", "La tarea con un enfoque")] : [])],
      look: ["Every writer has a draft and pressed Get feedback once.", "Cada escritor tiene un borrador y presionó Obtener comentarios una vez."],
    },
    {
      en: "Feedback and revise", es: "Comentarios y revisión",
      do: [
        ["Partners read aloud and give one thing they liked and one thing they wonder.", "En parejas leen en voz alta y dicen una cosa que les gustó y una que se preguntan."],
        ["Writers change one thing and ask for feedback again. Confer with a few writers.", "Los escritores cambian una cosa y vuelven a pedir comentarios. Converse con algunos escritores."],
      ],
      tools: [link(u("&sheet=conference"), "Conference sheet", "Hoja de conferencia")],
      look: ["The draft changed: compare first draft and now.", "El borrador cambió: compare el primer borrador con el actual."],
    },
    {
      en: "Finish and share", es: "Terminar y compartir",
      do: [
        ["Writers say what they improved and why, then save to the portfolio.", "Los escritores dicen qué mejoraron y por qué, y guardan en el portafolio."],
        ["A few writers read aloud. Writers who are done can try the same move in a new task.", "Algunos escritores leen en voz alta. Quien termina puede probar la misma estrategia en una tarea nueva."],
      ],
      tools: [link(`${BASE}/write?tab=portfolio&grades=${ctx.band}`, "Portfolio", "Portafolio")],
      look: ["The reflection names a change and a reason.", "La reflexión nombra un cambio y una razón."],
    },
  ];
  return html`<article class="week-plan d-writing" data-no-studio-video>
    ${back}
    <header>
      <p class="eyebrow">${icon("calendar")} ${I.T("Five-day plan", "Plan de cinco días")} · ${task.keyUse} · ${task.contentArea} · ${task.time}</p>
      <h1 tabindex="-1">${task.title}</h1>
      <p class="lead">${task.prompt}</p>
      <p class="fine">${I.T("About 30–40 minutes a day. Change the order to fit your class; every link opens the tool for this task.", "Unos 30–40 minutos al día. Cambie el orden según su clase; cada enlace abre la herramienta para esta tarea.")}</p>
    </header>
    <ol class="week-days">
      ${days.map((d, i) => html`<li class="week-day"><h2><span class="week-n">${I.T(`Day ${i + 1}`, `Día ${i + 1}`)}</span> ${I.T(d.en, d.es)}</h2>
        <ul>${d.do.map(([en, es]) => html`<li>${I.T(en, es)}</li>`)}</ul>
        <p class="week-tools no-print"><strong>${I.T("Open:", "Abrir:")}</strong> ${d.tools.map((x, j) => html`${j ? " · " : ""}${x}`)}</p>
        <p class="week-look"><strong>${I.T("Look for:", "Observe:")}</strong> ${I.T(d.look[0], d.look[1])}</p></li>`)}
    </ol>
  </article>`;
}
