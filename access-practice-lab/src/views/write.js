// Writing Growth Studio: source-based academic writing from guided to independent, with draft history,
// targeted feedback, revision, evidence collection and a portfolio. Feedback describes what is on the
// page (see lang/analyze.js); it never scores, and it is withheld from "on my own" attempts until the
// learner submits a draft. The learner's first draft is always kept so growth is visible.
import { crumbsHTML } from "../components.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { loadExemplars, loadMission, loadStudioIndex, loadWritingTasks } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { analyzeResponse, compareDrafts } from "../lang/analyze.js";
import { appendEntry, buildProfile, loadLedger, saveLedger, suggestStage } from "../lang/ledger.js";
import { addVersion, choiceEffects, loadStudio, missionState, saveStudio, writingState } from "../lang/studio.js";
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
import { ART, BASE, announce, html, icon, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
let S = null;
let I = makeI18n("en"); // set at the top of render(); helpers and handlers below read it
const bandEs = (band) => `Grados ${band.replace("-", "–")}`;
const chosen = new Map(); // task id → stage picked before the first attempt
const save = () => saveStudio(S.studio);
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

async function findTask(id, from) {
  if (from?.startsWith("mission:")) {
    const mission = await loadMission(from.slice(8)).catch(() => null);
    const t = mission?.phases.flatMap((p) => p.tasks || []).find((x) => x.task?.id === id)?.task;
    if (t)
      return {
        task: {
          band: "6-8",
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
  const card = (t, why) =>
    taskCardHTML({
      href: `${BASE}/write/${t.id}?grades=${ctx.band}`,
      title: t.title,
      ico: formIcon(t.form),
      kind: formName(t.form),
      time: t.time,
      desc: full.get(t.id)?.scenario,
      meta: [t.keyUse, t.contentArea],
      why,
    });
  const next = recs[0];
  return html`${crumbsHTML([
      [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`],
      [I.S("Writing Studio", "Estudio de escritura"), null],
    ])}
    <div class="d-writing">
    ${chooserHeroHTML({
      domain: "d-writing",
      eyebrow: I.T(`Grades ${ctx.band.replace("-", "–")} · ${tasks.length} writing tasks`, `${bandEs(ctx.band)} · ${tasks.length} tareas de escritura`),
      title: I.T("Writing Studio", "Estudio de escritura"),
      lead: I.T("Read sources, collect evidence, write, get specific feedback, and revise. Your first draft is kept so you can see how you grew.", "Lee las fuentes, reúne evidencia, escribe, recibe comentarios específicos y revisa. Se guarda tu primer borrador para que veas cómo creciste."),
      art: `${ART}/domain-writing.svg`,
      loop: [I.T("Read", "Leer"), I.T("Plan", "Planear"), I.T("Write", "Escribir"), I.T("Feedback", "Comentarios"), I.T("Revise", "Revisar")],
      cta: html`<div class="hero-actions">${next ? html`<a class="btn btn-primary btn-big btn-next" href="${BASE}/write/${next.task.id}?grades=${ctx.band}"><span class="btn-kicker">${I.T("Try next", "Prueba la siguiente")}</span><span class="next-title">${next.task.title}</span>${icon("arrow-right")}</a>` : ""}<a class="btn" href="${BASE}/write?tab=portfolio&grades=${ctx.band}">${icon("bookmark")} ${I.T("My writing portfolio", "Mi portafolio de escritura")}</a></div>`,
    })}
    ${
      tasks.length
        ? html`${jumpNavHTML(forms.map((f) => [`wrt-${f}`, formName(f)]), I.S("Jump to a kind of writing task", "Ir a un tipo de tarea de escritura"))}
          ${
            recs.length
              ? html`<section class="task-group is-next" aria-labelledby="wrt-next-h">
                  <header><h2 id="wrt-next-h">${icon("sparkle")} ${I.T("Try next", "Prueba la siguiente")}</h2><p class="fine">${I.T("Picked from the evidence you have saved on this device.", "Elegida según la evidencia que guardaste en este dispositivo.")}</p></header>
                  <div class="task-grid">${recs.map((r) => card(r.task, r.why))}</div>
                </section>`
              : ""
          }
          ${forms.map(
            (f) =>
              html`<section class="task-group" id="wrt-${f}" aria-labelledby="wrt-${f}-h">
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
          ? rows.map(({ id, w, task }) => {
              const first = w.versions[0];
              const last = w.versions.at(-1);
              const growth = first.id !== last.id ? compareDrafts(first.text, last.text, { ...optsFor(task), stage: "supported" }) : null;
              return html`<article class="portfolio-entry card">
                <header class="entry-head">
                  <div><h2>${task.title}</h2>
                    <p class="entry-meta"><span class="tag">${formName(task.form)}</span><span class="tag">${task.keyUse}</span><span class="tag">${I.T(`${w.versions.length} version${w.versions.length === 1 ? "" : "s"}`, `${w.versions.length} ${w.versions.length === 1 ? "versión" : "versiones"}`)}</span>${w.stage ? html`<span class="tag">${I.T("Started", "Empezado")} ${startedWith(w)}</span>` : ""}</p></div>
                  <label class="pick-toggle no-print"><input type="checkbox" data-pick="${id}" ${picks.has(id) ? raw("checked") : ""} ${IGN} /> ${I.T("Show in my best-work list", "Mostrar en mi lista de mejores trabajos")}</label>
                </header>
                <div class="entry-drafts ${growth ? "has-two" : ""}">
                  <section><h3>${I.T("First draft", "Primer borrador")}</h3><p class="portfolio-response">${first.text}</p></section>
                  ${growth ? html`<section><h3>${I.T("Latest version", "Última versión")}</h3><p class="portfolio-response">${last.text}</p></section>` : ""}
                </div>
                ${growth && (growth.changes.length || growth.gainedMoves.length) ? html`<section class="entry-changes"><h3>${icon("growth")} ${I.T("What changed", "Qué cambió")}</h3><ul>${growth.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to}</li>`)}${growth.gainedMoves.map((m) => html`<li>${I.T(`Now ${m.toLowerCase()}`, `Ahora: ${m.toLowerCase()}`)}</li>`)}</ul></section>` : ""}
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
    ${sources.map((src, i) =>
      src.kind === "passage" || src.kind === "text"
        ? html`<section class="source">
            <h4 class="source-title">${icon("reading")} ${src.title}</h4>
            <div class="source-text">${(src.text || []).map((p, pi) => html`<p>${splitSentences(p).map((s, si) => html`<button type="button" class="ev-sent ${ev.some((e) => e.text === s.text) ? "is-picked" : ""}" data-pick-evidence="${i}:${pi}:${si}" aria-pressed="${ev.some((e) => e.text === s.text)}">${s.text}</button>${" "}`)}</p>`)}</div>
            <button type="button" class="ghost small" data-read-source="${i}">${icon("volume")} ${I.T("Read aloud", "Leer en voz alta")}</button>
          </section>`
        : sourceHTML(src, { id: String(i) }),
    )}
    <p class="fine tip">${icon("pin")}<span>${I.T("Press Enter or tap a sentence to add it to your evidence notebook.", "Presiona Enter o toca una oración para agregarla a tu cuaderno de evidencia.")}</span></p>
    ${
      ev.length
        ? html`<div class="evidence-notebook"><h4>${icon("evidence")} ${I.T("My evidence notebook", "Mi cuaderno de evidencia")}</h4>
            <ul>${ev.map((e, i) => html`<li><span>“${e.text}”</span><button type="button" class="ghost small" data-drop-evidence="${i}" aria-label="${I.S("Remove from notebook", "Quitar del cuaderno")}">${icon("x")}</button></li>`)}</ul></div>`
        : ""
    }
  </section>`;
}

function supportsHTML(task) {
  if (S.stage === "independent")
    return html`<p class="own-note">${icon("user")}<span>${I.T("You chose to write on your own. Sources and your notes are available; frames, word bank and model are closed.", "Elegiste escribir por tu cuenta. Las fuentes y tus notas están disponibles; los marcos de oraciones, el banco de palabras y el modelo están cerrados.")}</span></p>`;
  return supportsPanelHTML(task, S.stage, {
    title: I.S("Writing starters", "Para empezar a escribir"),
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
  return [
    { label: I.T("Read", "Leer"), done: (state.evidence || []).length > 0 },
    { label: I.T("Plan", "Planear"), done: Object.values(state.organizer).some(Boolean) },
    { label: I.T("Write", "Escribir"), done: wordCount(text) >= 4 },
    { label: I.T("Feedback", "Comentarios"), done: Boolean(analyzed) },
    { label: I.T("Finish", "Terminar"), done: Boolean(state.finishedAt) },
  ];
}

export async function render(ctx) {
  I = i18nFor(ctx);
  const index = await loadStudioIndex();
  S = { ...(S || {}), band: ctx.band, studio: loadStudio(), ledger: loadLedger() };
  const q = new URLSearchParams(location.search);
  const id = ctx.route.id;
  if (!id && q.get("tab") === "portfolio")
    return {
      title: I.S("Writing portfolio", "Portafolio de escritura"),
      html: portfolioHTML(ctx, (await loadWritingTasks()).tasks),
    };
  if (!id) return { title: I.S("Writing Studio", "Estudio de escritura"), html: await chooserHTML(ctx, index, S.ledger.entries) };
  const found = await findTask(id, q.get("from"));
  if (!found)
    return {
      title: I.S("Not found", "No se encontró"),
      html: html`<section class="panel empty-state"><img src="${ART}/empty.svg" alt="" width="480" height="300" /><h1 tabindex="-1">${I.T("We could not find that task.", "No pudimos encontrar esa tarea.")}</h1><a class="btn" href="${BASE}/write?grades=${ctx.band}">${I.T("Writing Studio", "Estudio de escritura")}</a></section>`,
    };
  const { task, mission } = found;
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
  const sug = missionStage
    ? {
        stage: missionStage,
        reason: I.S(
          "Your mission suggested this starting support from your earlier practice. You can choose a different setting.",
          "Tu misión sugirió este apoyo inicial a partir de tu práctica anterior. Puedes elegir otra opción.",
        ),
      }
    : baseSuggestion;
  S.stage = S.state.stage || chosen.get(task.id) || sug.stage;
  const text = S.state.draft ?? S.state.versions.at(-1)?.text ?? "";
  S.state.notes ||= "";
  const analyzed = S.state.analyzedText === text && text;
  const a = analyzed ? analyzeResponse(text, optsFor(task)) : null;
  const goalMin = task.expected.minWords;
  return {
    title: task.title,
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${ctx.band}`], mission ? [mission.title, `${BASE}/missions/${mission.id}?grades=${ctx.band}`] : [I.S("Writing Studio", "Estudio de escritura"), `${BASE}/write?grades=${ctx.band}`], [task.title, null]])}
      <article class="activity studio-view write-studio d-writing">
        <header class="act-head">
          <div class="act-bar">
            <p class="act-context">${icon("writing")} ${I.T("Writing Studio", "Estudio de escritura")} · ${formName(task.form)} · ${task.keyUse}</p>
            <p class="act-step">${icon("clock")} ${task.time} · ${task.contentArea}</p>
          </div>
          <h1 tabindex="-1">${task.title}</h1>
          ${purposeBadgeHTML(S.stage)}
          <div class="task-brief">
            <div><span class="brief-label">${icon("info")} ${I.T("Situation", "Situación")}</span><p>${task.scenario}</p></div>
            <div class="brief-task"><span class="brief-label">${icon("flag")} ${I.T("Your task", "Tu tarea")}</span><p>${task.prompt}${S.fx.promptAdd.map((x) => html` <span class="path-add">${x}</span>`)}</p>
              <button type="button" class="ghost small" data-say="${task.prompt}">${icon("volume")} ${I.T("Hear the task", "Escuchar la tarea")}</button></div>
          </div>
        </header>
        ${stepperHTML(stepsFor(S.state, text, analyzed), { label: I.S("Writing steps", "Pasos de escritura") })}
        ${S.state.versions.length ? stageLockedHTML(S.stage) : stagePickerHTML(S.stage, sug)}
        <div class="studio-cols is-write">
          <div class="studio-col">${sourcesHTML(task, S.state)}
            <section class="panel organizer" id="wrt-plan">
              <h3><span class="step-badge">2</span> ${I.T("Plan", "Planear")}</h3>
              <div class="slot-grid">
                ${task.organizer.map((slot, i) => html`<label class="field slot"><span><b class="slot-n">${i + 1}</b>${slot.label}</span><textarea rows="2" data-org="${slot.id}" ${S.stage === "independent" ? "" : html`placeholder="${S.fx.hints[slot.id] || slot.hint}"`} ${IGN}>${S.state.organizer[slot.id] || ""}</textarea></label>`)}
              </div>
            </section>
          </div>
          <div class="studio-col">

            <section class="panel editor-panel" id="wrt-write">
              <h3><span class="step-badge">3</span> ${I.T("Write", "Escribir")}</h3>
              <label class="field paper"><span class="paper-head">${I.T("Your writing", "Tu escritura")} <span class="fine">${I.T("Saved on this device as you type", "Se guarda en este dispositivo mientras escribes")}</span></span><textarea id="wrt-draft" rows="${task.expected.paragraphs > 1 ? 16 : 11}" spellcheck="false" data-draft ${IGN}>
${text}</textarea></label>
              <p class="meter"><span class="meter-bar"><span style="width:${Math.min(100, Math.round((wordCount(text) / goalMin) * 100))}%"></span></span><span data-meter>${meterText(wordCount(text), goalMin, task.expected.maxWords)}</span></p>
              <div class="row-actions">
                <button type="button" class="btn btn-primary" data-feedback ${wordCount(text) < 4 ? raw("disabled") : ""}>${icon("sparkle")} ${I.T("Get feedback", "Obtener comentarios")}</button>
                <button type="button" class="ghost" data-read-draft>${icon("volume")} ${I.T("Read my writing to me", "Leer mi escritura en voz alta")}</button>
              </div>
            </section>
            ${supportsHTML(task)}
          </div>
        </div>
        ${
          a
            ? html`<section class="panel" id="wrt-feedback">
                  <h3><span class="step-badge">4</span> ${I.T("What your writing shows", "Lo que muestra tu escritura")}</h3>
                  ${feedbackHTML(a, text, { patternHref: (pid) => `${BASE}/detective/${pid}?grades=${ctx.band}` })}${revisionPromptsHTML(task, a)}${S.fx.revise.length ? html`<div class="revise-prompts"><h4>${icon("mission")} ${I.T("From your mission choice", "De tu elección en la misión")}</h4><ul>${S.fx.revise.map((q) => html`<li>${q}</li>`)}</ul></div>` : ""}${versionsHTML(S.state)}
                  <p class="fine revise-line">${icon("retry")}<span>${I.mode === "en" ? html`Now revise: change your draft, then press <strong>Get feedback</strong> again to see what changed.` : I.T("Now revise: change your draft, then press Get feedback again to see what changed.", "Ahora revisa: cambia tu borrador y luego presiona Obtener comentarios otra vez para ver qué cambió.")}</span><button type="button" class="btn small" data-revise>${I.T("Back to my draft", "Volver a mi borrador")}</button></p>
                </section>
                <section class="panel" id="wrt-finish">
                  <h3><span class="step-badge">5</span> ${I.T("Finish", "Terminar")}</h3>
                  <label class="field"><span>${I.T("What did you improve, and why?", "¿Qué mejoraste y por qué?")}</span><textarea rows="3" data-reflection ${IGN}>${S.state.reflection}</textarea></label>
                  <div class="row-actions"><button type="button" class="btn btn-primary" data-finish ${wordCount(S.state.reflection) >= 5 ? "" : raw("disabled")}>${icon("bookmark")} ${I.T("Save to my portfolio", "Guardar en mi portafolio")}</button></div>
                  ${S.state.finishedAt ? html`<p class="saved-note">${icon("check")} <span>${I.T("Saved to your portfolio.", "Guardado en tu portafolio.")} <a href="${BASE}/write?tab=portfolio&grades=${ctx.band}">${I.T("See my portfolio", "Ver mi portafolio")}</a></span></p>` : ""}
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
  S.state.used = { frames: S.stage === "guided", bank: S.stage !== "independent" };
}

function feedback(ctx) {
  const text = S.state.draft ?? S.state.versions.at(-1)?.text ?? "";
  if (S.state.analyzedText === text && text) {
    announce(I.S("Nothing has changed since your last feedback. Revise your writing, then ask again.", "No ha cambiado nada desde tus últimos comentarios. Revisa tu escritura y vuelve a pedirlos."));
    return;
  }
  lockStage();
  S.state.attemptId ||= `a${Date.now().toString(36)}`;
  const first = !S.ledger.entries.some(
    (x) => x.task === S.task.id && x.src === "writing" && x.kind === "first" && x.attempt === S.state.attemptId,
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
  };
  appendEntry(S.ledger, {
    src: "writing",
    task: S.task.id,
    band: S.band,
    domain: "Writing",
    use: S.task.keyUse,
    stage: S.stage,
    kind: first ? "first" : "revision",
    attempt: S.state.attemptId,
    supports,
    m: a.ledger,
  });
  saveLedger(S.ledger);
  save();
  announce(I.S("Feedback ready. Read your next moves, then revise.", "Comentarios listos. Lee tus próximos pasos y luego revisa."));
  ctx.rerender();
}

export function onInput(e) {
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
  } else if (t.matches("[data-org]")) {
    S.state.organizer[t.dataset.org] = t.value;
    save();
  } else if (t.matches("[data-reflection]")) {
    S.state.reflection = t.value;
    const b = document.querySelector("[data-finish]");
    if (b) b.disabled = wordCount(t.value) < 5;
    save();
  }
}

export function onChange(e, ctx) {
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-stage]")) {
    chosen.set(S.task.id, t.value);
    S.stage = t.value;
    ctx.rerender();
  } else if (t.matches("[data-pick]")) {
    const picks = S.studio.portfolio.picks;
    const i = picks.findIndex((p) => p.id === t.dataset.pick);
    if (t.checked && i < 0) picks.push({ id: t.dataset.pick, t: new Date().toISOString() });
    if (!t.checked && i >= 0) picks.splice(i, 1);
    save();
  }
}

export function onClick(e, ctx) {
  if (!S) return false;
  I = i18nFor(ctx);
  const t = e.target;
  if (t.closest("[data-print]")) {
    window.print();
    return true;
  }
  if (!S.task) return false;
  if (t.closest("[data-feedback]")) {
    feedback(ctx);
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
  if (t.closest("[data-revise]")) {
    const d = document.querySelector("[data-draft]");
    d?.scrollIntoView({ block: "center" });
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
    addVersion(S.state, S.state.draft ?? "", "final");
    S.state.finishedAt = new Date().toISOString();
    if (S.mission) {
      const ms = missionState(S.studio, S.mission.id);
      ms.tasks[S.task.id] = { done: true, t: S.state.finishedAt };
    }
    save();
    announce(I.S("Saved to your portfolio.", "Guardado en tu portafolio."));
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

export function mount(root) {
  trackDisclosures(root);
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
}
