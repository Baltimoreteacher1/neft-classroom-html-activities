// Connected Pathways — the student screens: the hub (/pathways) and the runner (/pathways/<id>).
// Markup only; events and saving live in src/views/pathways.js. Every string is English and Spanish. The ladder
// shows what each stage's own feature recorded (never a click), independent and supported work apart, and no
// points, levels, timers or percentages anywhere.
import { loopPanelHTML } from "../intel/ui.js";
import { SUPPORT_NOTE, levelForTier, suggest } from "../support-engine/engine.js";
import { BASE, html, icon } from "../util.js";
import { familyCardHTML } from "./family-card.js";
import { SUPPORTS, kluFor, widaEntries } from "./graph.js";
import { stageHref } from "./pathways.js";

const DOMAIN_ES = {
  Reading: "Lectura",
  Listening: "Escucha",
  Speaking: "Habla",
  Writing: "Escritura",
};
const SUPPORT_ES = {
  frames: "comienzos de oración",
  words: "banco de palabras",
  plan: "plan",
  spanish: "tarea en español",
  help: "ayuda",
  coach: "comentarios",
  bank: "banco de palabras",
  model: "modelo",
  l1: "español",
  hint: "pista",
};
const SUPPORT_EN = {
  frames: "sentence starters",
  words: "word bank",
  plan: "plan",
  spanish: "task in Spanish",
  help: "help",
  coach: "feedback",
  bank: "word bank",
  model: "model",
  l1: "Spanish",
  hint: "hint",
};
const day = (t) => (t ? String(t).slice(0, 10) : "");

const stateChip = (I, s) =>
  s.state === "done"
    ? html`<span class="pw-chip is-done">${icon("check")} ${I.T("Done", "Hecho")}</span>`
    : s.state === "next"
      ? html`<span class="pw-chip is-next">${I.T("Next", "Sigue")}</span>`
      : s.stage.optional
        ? html`<span class="pw-chip">${I.T("Optional", "Opcional")}</span>`
        : html`<span class="pw-chip">${I.T("Not yet", "Todavía no")}</span>`;

/** What the stage's own feature recorded, in words: when, on my own or with which helps, and the learner's words. */
function evidenceHTML(I, s) {
  const e = s.evidence;
  if (!e) return "";
  const names = (list, map) => list.map((x) => map[x] || x).join(", ");
  const how =
    e.independent === null
      ? ""
      : e.independent
        ? I.S(" · on my own", " · por mi cuenta")
        : I.S(
            ` · with help${e.supports.length ? `: ${names(e.supports, SUPPORT_EN)}` : ""}`,
            ` · con ayuda${e.supports.length ? `: ${names(e.supports, SUPPORT_ES)}` : ""}`,
          );
  const when = day(e.t);
  return html`<div class="pw-evidence">
    <p class="pw-evidence-line">
      <strong>${I.T("What I did:", "Lo que hice:")}</strong>
      ${when ? I.S(`finished ${when}`, `terminado el ${when}`) : I.S("finished", "terminado")}${how}${e.revised ? I.S(" · revised after feedback", " · revisado después de los comentarios") : ""}${e.outcome ? I.S(" · I reached an ending", " · llegué a un final") : ""}${e.title ? ` · ${e.title}` : ""}
    </p>
    ${e.quote ? html`<blockquote class="pw-quote" lang="en">${e.quote}</blockquote>` : ""}
  </div>`;
}

const stageMeta = (I, s) =>
  `${I.S(...s.stage.feature)}${s.stage.domain && s.stage.kind === "access" ? ` · ${I.S(s.stage.domain, DOMAIN_ES[s.stage.domain])}` : ""}`;

function helpHTML(I, objective, band, pathway, task, open) {
  const klu = kluFor(objective, band);
  const body = {
    frames: () =>
      html`<ul class="pw-help-list" lang="en">
        ${objective.frames.map((f) => html`<li>${f[0]}</li>`)}
      </ul>`,
    words: () => html`<p class="pw-help-words" lang="en">${klu.signals.join(" · ")}</p>`,
    plan: () =>
      html`<ol class="pw-help-list" lang="en">
        ${klu.moves.map((m) => html`<li>${m}</li>`)}
      </ol>`,
    spanish: () => html`<p lang="es">${task.prompt[1]}</p>`,
  };
  const offered = pathway.supports.filter((id) => SUPPORTS[id]);
  if (!offered.length)
    return html`<p class="fine">
      ${I.T("Your teacher set this task with no helps.", "Tu docente puso esta tarea sin ayudas.")}
    </p>`;
  const domain = (objective?.domains?.[0] || "writing").toLowerCase();
  const tier = offered.length >= 3 ? "A" : offered.length >= 1 ? "B" : "C";
  const engineHint = suggest({ level: levelForTier(tier), domain });
  return html`<div class="pw-helps">
    <p class="fine">
      ${I.T("Helps are closed. If you open one, this work is saved as “with help”. That is fine: it is just kept apart from work on your own.", "Las ayudas están cerradas. Si abres una, este trabajo se guarda como “con ayuda”. Está bien: solo se guarda aparte del trabajo por tu cuenta.")}
    </p>
    ${engineHint.scaffolds.length ? html`<p class="fine">${I.T(...SUPPORT_NOTE)}</p>` : ""}
    <div class="pw-help-row">
      ${offered.map((id) => html`<button type="button" class="btn small" data-pw-help="${id}" aria-expanded="${Boolean(open[id])}">${I.T(...SUPPORTS[id].title)}</button>`)}
    </div>
    ${offered
      .filter((id) => open[id])
      .map(
        (id) =>
          html`<div class="pw-help-open">
            <p class="pw-help-title">${I.T(...SUPPORTS[id].title)}</p>
            ${body[id]()}
          </div>`,
      )}
  </div>`;
}

/** The independent transfer stage, done in place: the new task, closed helps, the learner's box, then the loop panel. */
export function transferHTML(ctx, I, v, s) {
  const { objective, pathway, band, preview } = v;
  const meta = v.run?.meta?.[s.stage.id] || {};
  const task = v.tasks[(meta.task || 0) % v.tasks.length];
  if (preview)
    return html`<div class="pw-transfer">
      <p class="pw-task" lang="en">${task.prompt[0]}</p>
      <p class="fine">
        ${I.T("Preview: students write here, with the helps you chose closed.", "Vista previa: los estudiantes escriben aquí, con las ayudas que eligieron cerradas.")}
      </p>
    </div>`;
  if (meta.loopId) {
    return html`<div class="pw-transfer" id="pwTransfer">
      <p class="pw-task" lang="en">${task.prompt[0]}</p>
      ${loopPanelHTML(ctx, meta.loopId, { compact: true }) || html`<p class="fine">${I.T("Your words are saved.", "Tus palabras están guardadas.")}</p>`}
      ${v.tasks.length > 1 ? html`<p class="row-actions"><button type="button" class="btn small" data-pw-transfer-new>${I.T("Try a different new task", "Probar otra tarea nueva")}</button></p>` : ""}
    </div>`;
  }
  return html`<div class="pw-transfer" id="pwTransfer">
    <p class="pw-task" lang="en">${task.prompt[0]}</p>
    ${helpHTML(I, objective, band, pathway, task, meta.supports || {})}
    <label class="pw-label" for="pwDraft"
      >${I.T("My explanation (in English)", "Mi explicación (en inglés)")}</label
    >
    <textarea
      id="pwDraft"
      class="pw-box"
      rows="6"
      maxlength="4000"
      data-pw-draft
      lang="en"
      spellcheck="true"
    >
${meta.draft || ""}</textarea>
    <p class="row-actions">
      <button type="button" class="btn btn-primary" data-pw-transfer-save>
        ${I.T("Save my work and see feedback", "Guardar mi trabajo y ver comentarios")}
      </button>
    </p>
    <p class="pw-note" id="pwTransferNote" role="status">${v.ui.note || ""}</p>
  </div>`;
}

function bookHTML(I, v, s) {
  const { pathway, preview } = v;
  const mine = v.snap.books.find((b) => b.source?.id === `${pathway.runKey}:${s.stage.key}`);
  if (preview)
    return html`<p class="fine">
      ${I.T("Preview: students start a book here with the goal on its first page.", "Vista previa: aquí los estudiantes empiezan un libro con la meta en la primera página.")}
    </p>`;
  if (mine)
    return html`<p class="row-actions">
        <a
          class="btn ${s.state === "done" ? "" : "btn-primary"}"
          href="${BASE}/book-studio/edit/${mine.id}?pw=${encodeURIComponent(pathway.runKey)}&st=${encodeURIComponent(s.stage.id)}"
          >${I.T("Open my book", "Abrir mi libro")}</a
        >
      </p>
      ${s.state === "done" ? "" : html`<p class="fine">${I.T("Your book is started. This step is done when you write your own words in it and it saves.", "Tu libro ya empezó. Este paso queda hecho cuando escribes tus propias palabras y se guarda.")}</p>`}`;
  return html`<p class="row-actions">
      <button
        type="button"
        class="btn ${s.state === "next" ? "btn-primary" : ""}"
        data-pw-book="${s.stage.id}"
      >
        ${I.T("Start my book in Book Studio", "Empezar mi libro en Book Studio")}
      </button>
    </p>
    <p class="pw-note" role="status">${v.ui.bookNote || ""}</p>`;
}

function stageBody(ctx, I, v, s) {
  const { stage } = s;
  if (stage.kind === "transfer") return transferHTML(ctx, I, v, s);
  if (stage.kind === "book") return bookHTML(I, v, s);
  if (stage.kind === "family") {
    const talk = v.run?.meta?.[stage.id]?.talk || null;
    return familyCardHTML(
      I,
      v.objective,
      v.preview ? {} : { tick: { used: v.ui.talk ?? talk?.prompts ?? [], done: talk } },
    );
  }
  const href = stageHref(v.pathway, stage);
  return html`<p class="row-actions">
      <a class="btn ${s.state === "next" ? "btn-primary" : ""}" href="${href}"
        >${s.state === "done" ? I.T("Open it again", "Abrirlo otra vez") : I.T(`Go to ${stage.feature[0]}`, `Ir a ${stage.feature[1]}`)}</a
      >
    </p>
    ${s.prior ? html`<p class="pw-note">${I.T("You finished this before you started the pathway. Do it again here so it counts for this goal.", "Terminaste esto antes de empezar la ruta. Hazlo otra vez aquí para que cuente para esta meta.")}</p>` : ""}
    ${stage.evidence.type === "none" ? html`<p class="fine">${I.T("An extra to explore. It is not checked off.", "Un extra para explorar. No se marca como hecho.")}</p>` : ""}`;
}

const stageHTML = (ctx, I, v, s) =>
  html`<li
    class="pw-stage is-${s.state}${s.stage.optional ? " is-optional" : ""}"
    id="pwStage${s.n}"
  >
    <span class="pw-stage-n" aria-hidden="true">${s.n}</span>
    <div class="pw-stage-body">
      <p class="pw-stage-meta"><span>${stageMeta(I, s)}</span> ${stateChip(I, s)}</p>
      <h3 class="pw-stage-title">
        <span class="visually-hidden">${I.S(`Step ${s.n}:`, `Paso ${s.n}:`)}</span>
        ${I.S(...s.stage.title)}
      </h3>
      <p class="pw-why">${I.T(...s.stage.why)}</p>
      ${!s.stage.linked ? html`<p class="fine">${I.T("Chosen by your teacher.", "Elegido por tu docente.")}</p>` : ""}
      ${evidenceHTML(I, s)} ${stageBody(ctx, I, v, s)}
    </div>
  </li>`;

function recommendHTML(I, v) {
  const r = v.reco;
  if (!r?.activity) return "";
  const stage = r.activity.stageId
    ? v.state.stages.find((s) => s.stage.id === r.activity.stageId)
    : null;
  const href =
    r.activity.key === "t" || stage?.stage.kind === "transfer"
      ? "#pwTransfer"
      : stage && stage.stage.route
        ? stageHref(v.pathway, stage.stage)
        : stage
          ? `#pwStage${stage.n}`
          : `${BASE}${r.activity.route}`;
  return html`<section class="pw-reco" aria-labelledby="pwRecoH">
    <h2 id="pwRecoH">
      ${r.enough ? I.T("A suggestion from your own work", "Una sugerencia a partir de tu propio trabajo") : I.T("What to do next", "Qué hacer después")}
    </h2>
    <p class="pw-reco-why">${I.T(...r.reason)}</p>
    <p class="row-actions"><a class="btn" href="${href}">${I.S(...r.activity.title)}</a></p>
    <p class="fine">
      ${I.T("This suggestion stays on the same goal. It comes only from work saved on this device.", "Esta sugerencia sigue en la misma meta. Sale solo del trabajo guardado en este dispositivo.")}
    </p>
  </section>`;
}

function shareHTML(I, v) {
  if (v.preview) return "";
  const any = v.state.done > 0;
  return html`<section class="pw-share" aria-labelledby="pwShareH">
    <h2 id="pwShareH">${I.T("Show my teacher", "Mostrarle a mi docente")}</h2>
    <p>
      ${I.T("One packet with every step: what you did, when, on your own or with help, and your own words.", "Un solo paquete con cada paso: qué hiciste, cuándo, por tu cuenta o con ayuda, y tus propias palabras.")}
    </p>
    ${
      v.joined
        ? html`<p class="row-actions">
            <button type="button" class="btn" data-pw-share ${any ? "" : "disabled"}>
              ${I.T("Share my pathway evidence with my teacher", "Compartir la evidencia de mi ruta con mi docente")}
            </button>
          </p>`
        : html`<p class="row-actions">
            <a class="btn" href="${BASE}/class"
              >${I.T("Join my class to share", "Unirme a mi clase para compartir")}</a
            >
          </p>`
    }
    <p class="pw-note" id="pwShareNote" role="status">
      ${v.ui.shareNote || (v.run?.sharedAt ? I.S(`Shared on ${day(v.run.sharedAt)}.`, `Compartido el ${day(v.run.sharedAt)}.`) : !any && v.joined ? I.S("Finish one step first.", "Primero termina un paso.") : "")}
    </p>
    <details class="pw-details">
      <summary>${I.T("See what will be sent", "Ver lo que se enviará")}</summary>
      <pre class="pw-digest" lang="en">${v.digest}</pre>
    </details>
  </section>`;
}

/** The runner: the goal, the ladder, the suggestion, the share packet. */
export function runnerHTML(ctx, I, v) {
  const { objective, pathway, state, band } = v;
  const wida = widaEntries(objective, band);
  return html`<article class="pw-run">
    ${v.preview ? html`<p class="pw-preview" role="status">${I.T("Preview as a student. Nothing is saved from this page.", "Vista previa como estudiante. Nada se guarda desde esta página.")} <a href="${BASE}/pathways/build">${I.T("Back to the builder", "Volver al creador")}</a></p>` : ""}
    <header class="pw-head">
      <p class="eyebrow">
        ${icon("road")} ${I.T("Connected pathway", "Ruta conectada")} ·
        ${I.S(objective.keyUse, { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" }[objective.keyUse])}
      </p>
      <h1 tabindex="-1">${I.S(...pathway.title)}</h1>
      <p class="pw-goal">
        <strong>${I.T("My goal:", "Mi meta:")}</strong> ${I.T(...objective.student)}
      </p>
      <p class="pw-count" role="status">
        ${I.T(`${state.requiredDone} of ${state.requiredTotal} steps done`, `${state.requiredDone} de ${state.requiredTotal} pasos hechos`)}${state.complete ? I.S(" · pathway complete", " · ruta completa") : ""}
      </p>
      <ul class="pw-features">
        ${["discourse", "sentence", "word"].map((d) => html`<li>${I.T(...objective.features[d])}</li>`)}
      </ul>
      ${pathway.notes.length ? html`<p class="pw-note is-warn" role="status">${I.T(`${pathway.notes.length} step${pathway.notes.length === 1 ? "" : "s"} in this link could not be found and ${pathway.notes.length === 1 ? "was" : "were"} left out: ${pathway.notes.map((n) => n.key).join(", ")}.`, `No se ${pathway.notes.length === 1 ? "encontró 1 paso" : `encontraron ${pathway.notes.length} pasos`} de este enlace y se ${pathway.notes.length === 1 ? "omitió" : "omitieron"}: ${pathway.notes.map((n) => n.key).join(", ")}.`)}</p>` : ""}
    </header>
    <h2 class="visually-hidden">${I.S("The steps", "Los pasos")}</h2>
    <ol class="pw-ladder">
      ${state.stages.map((s) => stageHTML(ctx, I, v, s))}
    </ol>
    ${v.preview ? "" : recommendHTML(I, v)} ${shareHTML(I, v)}
    <details class="pw-details pw-noprint">
      <summary>
        ${I.T("For teachers: what this goal is linked to", "Para docentes: con qué se relaciona esta meta")}
      </summary>
      <p>
        ${I.T(`Key Language Use: ${objective.keyUse}. Framework entries this goal sits beside (references from the lab's catalog): ${wida.map((w) => w.id).join(", ")}.`, `Uso clave del lenguaje: ${objective.keyUse}. Entradas del marco junto a las que se ubica esta meta (referencias del catálogo del laboratorio): ${wida.map((w) => w.id).join(", ")}.`)}
      </p>
      <p class="fine">
        ${I.T("These are locally developed practice tasks. They are not official WIDA items and they do not estimate an ACCESS score or a proficiency level. A step is checked off only when the activity itself saved the work after this pathway was started.", "Estas son tareas de práctica creadas en este laboratorio. No son ítems oficiales de WIDA y no estiman una puntuación de ACCESS ni un nivel de dominio. Un paso se marca solo cuando la actividad misma guardó el trabajo después de empezar esta ruta.")}
      </p>
      ${pathway.followUp && v.followUp ? html`<p>${I.T(`Follow-up work chosen by the teacher: ${v.followUp.title[0]}.`, `Trabajo de seguimiento elegido por el docente: ${v.followUp.title[1]}.`)}</p>` : ""}
    </details>
  </article>`;
}

/** The hub: where I am (resume), every built-in pathway with its real progress, and the teacher entry. */
export function hubHTML(I, v) {
  const card = (row) => {
    const { pathway, objective, state, href, started } = row;
    return html`<li class="pw-card${started ? " is-started" : ""}">
      <p class="pw-stage-meta">
        <span
          >${I.S(objective.keyUse, { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" }[objective.keyUse])}</span
        >${row.assigned ? html` <span class="pw-chip is-next">${I.T("From my teacher", "De mi docente")}</span>` : ""}
      </p>
      <h3 class="pw-stage-title">${I.S(...pathway.title)}</h3>
      <p class="pw-why">${I.T(...objective.student)}</p>
      <p class="pw-count">
        ${started ? I.T(`${state.requiredDone} of ${state.requiredTotal} steps done`, `${state.requiredDone} de ${state.requiredTotal} pasos hechos`) : I.T(`${pathway.stages.length} steps: ${pathway.stages.map((s) => s.feature[0]).join(" → ")}`, `${pathway.stages.length} pasos: ${pathway.stages.map((s) => s.feature[1]).join(" → ")}`)}
      </p>
      <p class="row-actions">
        <a class="btn ${started ? "btn-primary" : ""}" href="${href}"
          >${started ? (state.complete ? I.T("See my pathway", "Ver mi ruta") : I.T("Keep going", "Seguir")) : I.T("Start this pathway", "Empezar esta ruta")}</a
        >
      </p>
    </li>`;
  };
  const r = v.resume;
  return html`<section class="pw-hub">
    <header class="pw-head">
      <p class="eyebrow">${icon("road")} ${I.T("My progress", "Mi progreso")}</p>
      <h1 tabindex="-1">${I.T("Connected Pathways", "Rutas conectadas")}</h1>
      <p class="pw-goal">
        ${I.T("One language goal, carried through reading, speaking, a simulation, a book and a new task on your own. Each step is checked off by the activity itself.", "Una meta de lenguaje que pasa por la lectura, el habla, una simulación, un libro y una tarea nueva por tu cuenta. Cada paso lo marca la actividad misma.")}
      </p>
    </header>
    ${
      r
        ? html`<section class="pw-resume" aria-labelledby="pwResumeH">
            <h2 id="pwResumeH">${I.T("Pick up where I stopped", "Seguir donde me quedé")}</h2>
            <p>
              <strong>${I.S(...r.pathway.title)}</strong> ·
              ${I.T(`${r.state.requiredDone} of ${r.state.requiredTotal} steps done`, `${r.state.requiredDone} de ${r.state.requiredTotal} pasos hechos`)}
            </p>
            ${r.state.next ? html`<p>${I.T(`Next: step ${r.state.next.n}, ${r.state.next.stage.title[0]} (${r.state.next.stage.feature[0]}).`, `Sigue: paso ${r.state.next.n}, ${r.state.next.stage.title[1]} (${r.state.next.stage.feature[1]}).`)}</p>` : html`<p>${I.T("Every required step is done. You can share it with your teacher.", "Todos los pasos necesarios están hechos. Puedes compartirlo con tu docente.")}</p>`}
            <p class="row-actions">
              <a class="btn btn-primary" href="${r.href}"
                >${I.T("Open my pathway", "Abrir mi ruta")}</a
              >
            </p>
            ${v.reco?.activity ? html`<p class="pw-reco-why">${I.T(...v.reco.reason)}</p>` : ""}
          </section>`
        : ""
    }
    <h2>${I.T("Choose a pathway", "Elige una ruta")}</h2>
    <ul class="pw-cards">
      ${v.rows.map(card)}
    </ul>
    <section class="pw-teach pw-noprint" aria-labelledby="pwTeachH">
      <h2 id="pwTeachH">${I.T("For teachers", "Para docentes")}</h2>
      <p>
        ${I.T("Build a pathway for one goal from activities already on the site, then assign it as one link.", "Armen una ruta para una meta con actividades que ya están en el sitio y asígnenla como un solo enlace.")}
      </p>
      <p class="row-actions">
        <a class="btn" href="${BASE}/pathways/build"
          >${I.T("Build and assign a pathway", "Crear y asignar una ruta")}</a
        >
      </p>
    </section>
  </section>`;
}

export const notFoundHTML = (I, notes) =>
  html`<section class="panel pw-missing">
    <h1 tabindex="-1">${I.T("We could not open that pathway", "No pudimos abrir esa ruta")}</h1>
    <p>
      ${notes?.length ? I.T(`The link is missing something we need: ${notes.map((n) => `${n.kind}${n.key ? ` (${n.key})` : ""}`).join(", ")}.`, `Al enlace le falta algo que necesitamos: ${notes.map((n) => `${n.kind}${n.key ? ` (${n.key})` : ""}`).join(", ")}.`) : I.T("It may have been typed with a mistake.", "Puede que tenga un error al escribirse.")}
    </p>
    <p class="row-actions">
      <a class="btn btn-primary" href="${BASE}/pathways"
        >${I.T("See all pathways", "Ver todas las rutas")}</a
      >
    </p>
  </section>`;

