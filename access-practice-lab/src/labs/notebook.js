// Lab Notebook for the Language Labs hub: discovery stamps and a "Next up" card, derived only from records that already
// exist (the language-labs progress record `accessPracticeLab:v1:language-labs` and the ledger). No new storage key,
// no score. A stamp means the learner did the thing (practice), never a grade and never an ACCESS prediction.
import * as C from "../content/language-labs.js";
import { html } from "../util.js";
import { labScene } from "./art.js";
import { labHref, labName } from "./parts.js";
import { stampSVG } from "./stamp-art.js";

const STEP_NAMES = [
  ["See it", "Míralo"],
  ["Explore", "Explora"],
  ["Example", "Ejemplo"],
  ["Practice", "Practica"],
  ["New task", "Tarea nueva"],
];

/** Stamp catalogue. `step` is the lab step that earns it; `bonus` stamps do not gate "lab complete". */
export const HERE_STAMPS = [
  {
    id: "see",
    step: 1,
    name: STEP_NAMES[0],
    done: ["You read the pattern and moved on.", "Leíste el patrón y seguiste adelante."],
    todo: [
      "Read the pattern in Step 1, then move on.",
      "Lee el patrón del Paso 1 y sigue adelante.",
    ],
  },
  {
    id: "explore",
    step: 2,
    name: STEP_NAMES[1],
    done: ["You worked through the Explore step.", "Trabajaste el paso Explora."],
    todo: ["Try the controls in Step 2.", "Prueba los controles del Paso 2."],
  },
  {
    id: "example",
    step: 3,
    name: STEP_NAMES[2],
    done: [
      "You stepped through the whole worked example.",
      "Recorriste todo el ejemplo paso a paso.",
    ],
    todo: [
      "Show every step of the worked example in Step 3.",
      "Muestra todos los pasos del ejemplo en el Paso 3.",
    ],
  },
  {
    id: "practice",
    step: 4,
    name: STEP_NAMES[3],
    done: ["You solved every practice item.", "Resolviste todos los ítems de práctica."],
    todo: [
      "Solve every practice item in Step 4.",
      "Resuelve todos los ítems de práctica del Paso 4.",
    ],
  },
  {
    id: "task",
    step: 5,
    name: STEP_NAMES[4],
    done: [
      "Your own writing met the lab checklist.",
      "Tu propia escritura cumplió la lista del laboratorio.",
    ],
    todo: [
      "Write on the new task and check it in Step 5.",
      "Escribe la tarea nueva y revísala en el Paso 5.",
    ],
  },
  {
    id: "solo",
    step: 5,
    bonus: true,
    name: ["On my own", "Por mi cuenta"],
    done: [
      "Your new-task writing met the checklist without a hint.",
      "Tu escritura cumplió la lista sin abrir una pista.",
    ],
    todo: [
      "Meet the checklist on the new task without opening a hint.",
      "Cumple la lista de la tarea nueva sin abrir una pista.",
    ],
  },
];
export const BUILDER_STAMPS = [
  {
    id: "first",
    name: ["First build", "Primera construcción"],
    done: ["You finished one build.", "Terminaste una construcción."],
    todo: ["Finish one build in this builder.", "Termina una construcción en este constructor."],
  },
  {
    id: "again",
    name: ["Second build", "Segunda construcción"],
    done: ["You finished a second, different task.", "Terminaste una segunda tarea distinta."],
    todo: ["Finish a second, different task.", "Termina una segunda tarea distinta."],
  },
  {
    id: "solo",
    name: ["On my own", "Por mi cuenta"],
    done: [
      "You finished a build with no support open.",
      "Terminaste una construcción sin apoyos abiertos.",
    ],
    todo: ["Finish a build with no support open.", "Termina una construcción sin apoyos abiertos."],
  },
];

const arr = (x) => (Array.isArray(x) ? x : []);
const solvedIn = (items, ls) => items.filter((it) => ls.practice?.[it.id]?.ok).length;

/** How many guided steps must be shown before the Example stamp is earned (matches the lab's own step list). */
export function guidedLength(labId, band) {
  if (labId === "verb-time-machine") return C.VERB_GUIDED?.[band]?.steps?.length || 4;
  if (labId === "connector-bridge") return C.BRIDGE_GUIDED?.steps?.length || 4;
  return C.XRAY_MODEL?.[band]?.sentences?.length || 4;
}

function practiceCount(labId, ls, band) {
  if (labId === "verb-time-machine") {
    const items = C.VERB_ITEMS.filter((x) => x.band === band);
    return { solved: solvedIn(items, ls), total: items.length };
  }
  if (labId === "connector-bridge") {
    const items = C.BRIDGE_ITEMS.filter((x) => x.band === band);
    return { solved: solvedIn(items, ls), total: items.length };
  }
  const pr = ls.practice || {};
  return { solved: (pr.labels?.result?.ok ? 1 : 0) + (pr.order?.result?.ok ? 1 : 0), total: 2 };
}

const finish = (lab, kind, stamps, extra) => {
  const core = stamps.filter((s) => !s.bonus);
  const coreEarned = core.filter((s) => s.earned).length;
  const nextStamp = core.find((s) => !s.earned) || null;
  return {
    lab,
    kind,
    stamps,
    earned: stamps.filter((s) => s.earned).length,
    total: stamps.length,
    coreEarned,
    coreTotal: core.length,
    complete: coreEarned === core.length,
    nextStamp,
    ...extra,
  };
};

function hereProgress(lab, st, band, entries) {
  const ls = st?.[lab.id]?.[band] || {};
  const seen = arr(ls.seen);
  const ex = ls.explore || {};
  const moved = (n) => seen.includes(n) && seen.some((s) => s > n);
  const practice = practiceCount(lab.id, ls, band);
  const labsEntries = entries.filter(
    (e) => e.src === "labs" && e.band === band && e.m?.lab === lab.id,
  );
  const transferOk = !!ls.transfer?.ok || labsEntries.some((e) => e.m?.transfer && e.m?.ok === 1);
  const transferEntries = labsEntries.filter((e) => e.m?.transfer);
  // The ledger is the record of what support was open when a check passed. With no transfer entries (ledger cleared
  // or trimmed) the lab's own state is the evidence: a passed check with a hint never opened.
  const solo = transferEntries.length
    ? transferEntries.some((e) => e.m?.ok === 1 && e.stage === "independent")
    : !!ls.transfer?.ok && !ls.transfer?.hint && (ls.transfer?.checks || 0) > 0;
  const earned = {
    see: moved(1),
    // A recorded control change is the real action. Labs that keep Explore state only in memory fall back to
    // "opened Explore and moved on".
    explore: Object.keys(ex).length > 0 || moved(2),
    example: (ls.guided || 0) >= guidedLength(lab.id, band),
    practice: practice.total > 0 && practice.solved >= practice.total,
    task: transferOk,
    solo,
  };
  const stamps = HERE_STAMPS.map((s) => ({ ...s, earned: !!earned[s.id] }));
  return finish(lab, "here", stamps, {
    started: seen.length > 0,
    stepsSeen: seen.length,
    practice,
    transferOk,
  });
}

function builderProgress(lab, band, entries) {
  const mine = entries.filter(
    (e) => e.src === "scaffold" && e.m?.tool === lab.toolId && e.band === band,
  );
  const finished = mine.filter((e) => e.m?.ok);
  const tasks = new Set(finished.map((e) => e.task)).size;
  const earned = {
    first: tasks >= 1,
    again: tasks >= 2,
    solo: finished.some((e) => e.stage === "independent"),
  };
  const stamps = BUILDER_STAMPS.map((s) => ({ ...s, earned: !!earned[s.id] }));
  return finish(lab, "builder", stamps, { started: mine.length > 0, finishedTasks: tasks });
}

/** The notebook for one band: per-lab progress, totals and the single "next up" suggestion. */
export function notebookFor(st, band, entries = []) {
  const ents = arr(entries);
  const labs = C.LABS.map((l) =>
    l.here ? hereProgress(l, st, band, ents) : builderProgress(l, band, ents),
  );
  const open =
    labs.find((p) => p.kind === "here" && p.started && !p.complete) ||
    labs.find((p) => p.kind === "builder" && p.started && !p.complete);
  const fresh = labs.find((p) => !p.started && !p.complete);
  const pick = open || fresh;
  const pickProgress = pick || labs[0];
  const step = pickProgress.kind === "here" ? pickProgress.nextStamp?.step || 1 : 1;
  const state = open ? "resume" : fresh ? "start" : "done";
  return {
    labs,
    totals: {
      earned: labs.reduce((n, p) => n + p.earned, 0),
      total: labs.reduce((n, p) => n + p.total, 0),
      complete: labs.filter((p) => p.complete).length,
      started: labs.filter((p) => p.started).length,
    },
    next: {
      state,
      progress: pickProgress,
      step,
      stamp: state === "done" ? null : pickProgress.nextStamp,
    },
  };
}

// ── markup ───────────────────────────────────────────────────────────────────
const TILT = [-4, 2.5, -2, 3.5, -3, 2];

function stampHTML(I, s, i) {
  return html`<li
    class="llp-stamp ${s.earned ? "is-earned" : "is-todo"}"
    style="--tilt:${TILT[i % 6]}deg"
  >
    ${stampSVG(s.id, s.earned)}
    <span class="llp-stamp-name">${I.T(...s.name)}</span>
    <span class="visually-hidden"
      >${s.earned ? I.T("Earned. ", "Ganado. ") : I.T("Not yet. ", "Todavía no. ")}${I.T(...(s.earned ? s.done : s.todo))}</span
    >
  </li>`;
}

function rowHTML(I, p) {
  return html`<li class="llp-row ${p.complete ? "is-complete" : ""}">
    <div class="llp-row-head">
      <h4 class="llp-row-name">${labName(I, p.lab)}</h4>
      <span class="llp-row-count"
        >${I.T(`${p.earned} of ${p.total} stamps`, `${p.earned} de ${p.total} sellos`)}</span
      >
    </div>
    <ol class="llp-stamps">
      ${p.stamps.map((s, i) => stampHTML(I, s, i))}
    </ol>
    ${
      p.complete
        ? html`<p class="llp-done">
            <span class="llp-sparkles" aria-hidden="true"><i></i><i></i><i></i></span>
            ${I.T("Lab complete. Come back any time and write about a new topic.", "Laboratorio completo. Vuelve cuando quieras y escribe sobre un tema nuevo.")}
          </p>`
        : p.kind === "here" && p.practice.solved > 0 && !p.stamps[3].earned
          ? html`<p class="llp-row-note">
              ${I.T(`Practice so far: ${p.practice.solved} of ${p.practice.total} solved.`, `Práctica hasta ahora: ${p.practice.solved} de ${p.practice.total} resueltas.`)}
            </p>`
          : ""
    }
  </li>`;
}

export function stampSheetHTML(I, nb) {
  const t = nb.totals;
  return html`<section class="llp-sheet" aria-labelledby="llpSheetH">
    <header class="llp-sheet-head">
      <div>
        <p class="llp-eyebrow">${I.T("Lab Notebook", "Cuaderno de laboratorio")}</p>
        <h3 id="llpSheetH">${I.T("Your discovery stamps", "Tus sellos de descubrimiento")}</h3>
      </div>
      <p class="llp-sheet-total" role="status">
        ${I.T(`${t.earned} of ${t.total} stamps`, `${t.earned} de ${t.total} sellos`)}
      </p>
    </header>
    <ul class="llp-rows">
      ${nb.labs.map((p) => rowHTML(I, p))}
    </ul>
    <p class="llp-honest">
      ${I.T(
        "A stamp means you did the practice on this device. It is not a grade and does not predict ACCESS results. A writing stamp means your text met the lab's checklist, not that every sentence is certified correct.",
        "Un sello significa que hiciste la práctica en este dispositivo. No es una nota y no predice los resultados de ACCESS. El sello de escritura significa que tu texto cumplió la lista del laboratorio, no que cada oración esté certificada como correcta.",
      )}
    </p>
  </section>`;
}

export function nextUpHTML(I, nb, band) {
  const { state, progress: p, step, stamp } = nb.next;
  const lab = p.lab;
  const here = p.kind === "here";
  const eyebrow =
    state === "resume"
      ? I.T("Next up · pick up where you stopped", "Sigue · retoma donde lo dejaste")
      : state === "start"
        ? I.T("Next up · a good place to begin", "Sigue · un buen lugar para empezar")
        : I.T("Every lab is stamped", "Todos los laboratorios tienen sello");
  const go =
    state === "done"
      ? I.T("Open a lab again", "Abrir un laboratorio otra vez")
      : here
        ? I.T(
            `Go to Step ${step} · ${STEP_NAMES[step - 1][0]}`,
            `Ir al Paso ${step} · ${STEP_NAMES[step - 1][1]}`,
          )
        : I.T("Open the builder", "Abrir el constructor");
  return html`<article class="llp-next" aria-labelledby="llpNextH">
    <div class="llp-next-art" aria-hidden="true">${labScene(lab.id, band, "n")}</div>
    <div class="llp-next-body">
      <p class="llp-eyebrow">${eyebrow}</p>
      <h3 id="llpNextH">${labName(I, lab)}</h3>
      ${
        stamp
          ? html`<p class="llp-next-goal">
              ${I.T(`Next stamp: ${stamp.name[0]}.`, `Siguiente sello: ${stamp.name[1]}.`)}
              ${I.T(...stamp.todo)}
            </p>`
          : html`<p class="llp-next-goal">
              ${I.T("Revisit a lab and write about a different topic.", "Vuelve a un laboratorio y escribe sobre otro tema.")}
            </p>`
      }
      ${
        here
          ? html`<ol
              class="llp-track"
              aria-label="${I.S("Steps stamped in this lab", "Pasos con sello en este laboratorio")}"
            >
              ${p.stamps
                .filter((s) => !s.bonus)
                .map(
                  (s) =>
                    html`<li
                      class="${s.earned ? "is-earned" : ""} ${stamp && s.id === stamp.id ? "is-here" : ""}"
                    >
                      <span class="llp-track-dot" aria-hidden="true"></span>
                      <span class="llp-track-name">${I.T(...s.name)}</span>
                      <span class="visually-hidden"
                        >${s.earned ? I.T("(stamped)", "(con sello)") : I.T("(not yet)", "(todavía no)")}</span
                      >
                    </li>`,
                )}
            </ol>`
          : ""
      }
      <a class="btn btn-primary btn-big llp-go" href="${labHref(lab, band, step)}">${go}</a>
    </div>
  </article>`;
}
