// Connected Pathways (/pathways, /pathways/<id>, /pathways/c?o=…&s=…, /pathways/build): System E of Part 2
// (docs/part2-integration-map.md). One language objective from the skill graph (src/pathways/graph.js) is carried
// through features that already exist: an ACCESS activity, Speaking Studio, the simulation, Book Studio, an
// independent transfer task done here with the feedback loop panel (src/intel/ui.js), and an optional family
// conversation. Rules this view keeps:
//  * a step is done only when its own feature saved the work after the pathway was started (src/pathways/progress.js);
//    this view writes context (where I am, helps opened, the family conversation), never a completion;
//  * work with any help opened is "with help"; only work with no help is "on my own";
//  * nothing leaves the device unless the learner presses Share (one packet to the class review queue);
//  * the builder is a "For teachers" mode: it only produces a link and, on request, ONE class assignment.
import { classInfo } from "../../../shared/class-platform/client.js";
import { createBookFromContent } from "../book/handoff.js";
import { loadLink } from "../class/link.js";
import { crumbsHTML } from "../components.js";
import { loadIndex } from "../content.js";
import { i18nFor } from "../i18n.js";
import { transferFor } from "../intel/engine.js";
import { inClass, shareWithClass } from "../intel/share.js";
import { onLoopClick, onLoopInput, startTextLoop } from "../intel/ui.js";
import { buildChange, buildClick, buildInput, buildReset, builderModel } from "../pathways/build-controller.js";
import { objectiveById, resolveKey } from "../pathways/graph.js";
import {
  BASE as LAB,
  BUILT_IN_IDS,
  builtIn,
  decodeCustom,
  pathwayPath,
} from "../pathways/pathways.js";
import {
  collectSnapshot,
  listPathwayBooks,
  loadRuns,
  noteBook,
  noteLoop,
  noteSupport,
  pathwayDigest,
  pathwayState,
  priorWork,
  recordTalk,
  resumeRun,
  saveRuns,
  startRun,
} from "../pathways/progress.js";
import { priorityObjective, recommend } from "../pathways/recommend.js";
import { builderHTML } from "../pathways/ui-build.js";
import { hubHTML, notFoundHTML, runnerHTML } from "../pathways/ui.js";
import { announce, html } from "../util.js";

const fresh = () => ({
  at: "",
  note: "",
  bookNote: "",
  shareNote: "",
  talk: null,
});
let ui = fresh();
let assigned = null; // class assignments, fetched once per visit when this device joined a class
let model = null; // the last view model (event handlers read the pathway and run from it)

const bandOf = (ctx) => (ctx.band === "3-5" ? "3-5" : "6-8");
const queryOf = (path) =>
  Object.fromEntries(new URLSearchParams(String(path || "").split("?")[1] || ""));

async function loadAssigned(ctx) {
  const link = loadLink();
  if (!link || assigned) return;
  assigned = [];
  const info = await classInfo(link.code).catch(() => null);
  if (info?.ok && Array.isArray(info.assignments)) {
    assigned = info.assignments.filter((a) => /\/pathways\//.test(String(a.path || "")));
    if (assigned.length && ctx.route.view === "pathways") ctx.rerender();
  }
}

/** A pathway from where it lives: a built-in id, or a custom definition in a query string. */
function openPathway(id, q, band, data) {
  if (id === "c") return decodeCustom(q, band, data);
  const pathway = builtIn(id, band, data);
  return { pathway, def: null, notes: [] };
}

async function runnerModel(ctx, I) {
  const band = bandOf(ctx);
  const data = { index: await loadIndex() };
  const { pathway, def, notes } = openPathway(ctx.route.id, ctx.route.q || {}, band, data);
  if (!pathway) return { missing: true, notes };
  const objective = objectiveById(pathway.objective);
  const preview = ctx.route.q?.preview === "1";
  const runs = loadRuns();
  const books = await listPathwayBooks();
  let snap = collectSnapshot({ books });
  let run = null;
  if (!preview) {
    run = startRun(runs, pathway, { back: pathwayPath(pathway, def, band), band, sim: snap.sim });
    saveRuns(runs);
    snap = collectSnapshot({ books });
  }
  const state = pathwayState(pathway, run, snap);
  for (const s of state.stages) s.prior = !s.evidence && priorWork(s.stage, run, snap);
  return {
    band,
    data,
    pathway,
    def,
    objective,
    preview,
    runs,
    run,
    snap,
    state,
    reco: preview
      ? null
      : recommend(objective.id, snap, {
          state,
          rejected: pathway.rejected,
          followUp: pathway.followUp,
          band,
          data,
        }),
    // The goal's own new tasks first, then one from the feedback engine's bank for the same Key Language Use.
    tasks: [...objective.transfer, (({ id, prompt }) => ({ id, prompt }))(transferFor({ keyUse: objective.keyUse, taskId: `pw:${pathway.runKey}` }))],
    followUp: pathway.followUp ? resolveKey(pathway.followUp, data) : null,
    joined: inClass(),
    digest: pathwayDigest(pathway, state, objective),
    ui,
    I,
  };
}

async function hubModel(ctx) {
  const band = bandOf(ctx);
  const data = { index: await loadIndex() };
  const runs = loadRuns();
  const snap = collectSnapshot({ books: await listPathwayBooks() });
  void loadAssigned(ctx);
  const row = (pathway, def, extra = {}) => {
    const run = runs.runs[pathway.runKey] || null;
    return {
      pathway,
      objective: objectiveById(pathway.objective),
      state: pathwayState(pathway, run, snap),
      href: pathwayPath(pathway, def, band),
      started: Boolean(run),
      ...extra,
    };
  };
  const fromTeacher = (assigned || [])
    .map((a) => {
      const id = /\/pathways\/([a-z0-9-]+)/.exec(a.path)?.[1];
      const { pathway, def } = openPathway(id, queryOf(a.path), band, data);
      return pathway ? row(pathway, def, { assigned: true }) : null;
    })
    .filter(Boolean);
  const taken = new Set(fromTeacher.map((r) => r.pathway.runKey));
  const rows = [
    ...fromTeacher,
    ...BUILT_IN_IDS.map((id) => row(builtIn(id, band, data), null)).filter(
      (r) => !taken.has(r.pathway.runKey),
    ),
  ];
  const last = resumeRun(runs);
  let resume = null;
  if (last) {
    const { pathway, def } = openPathway(last.id, queryOf(last.back), band, data);
    if (pathway)
      resume = {
        pathway,
        state: pathwayState(pathway, last, snap),
        href: last.back || pathwayPath(pathway, def, band),
      };
  }
  const prio = priorityObjective({ assignments: assigned || [], runs });
  const reco =
    prio && resume
      ? recommend(prio.objective, snap, {
          state: resume.pathway.objective === prio.objective ? resume.state : null,
          rejected: resume.pathway.rejected,
          band,
          data,
        })
      : null;
  return { band, rows, resume, reco };
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const here = `${location.pathname}${location.search}`;
  if (ui.at !== here) ui = { ...fresh(), at: here };
  const home = [I.S("Lab", "Laboratorio"), `${LAB}/`];
  const hub = [I.S("Connected Pathways", "Rutas conectadas"), `${LAB}/pathways`];
  if (ctx.route.id === "build") {
    model = { kind: "build", ...(await builderModel(ctx)) };
    return {
      title: I.S("Build a pathway", "Crear una ruta"),
      html: html`${crumbsHTML([home, hub, [I.S("For teachers: build", "Para docentes: crear"), null]])}${builderHTML(I, model)}`,
    };
  }
  if (!ctx.route.id) {
    model = { kind: "hub", ...(await hubModel(ctx)) };
    return { title: hub[0], html: html`${crumbsHTML([home, [hub[0], null]])}${hubHTML(I, model)}` };
  }
  const m = await runnerModel(ctx, I);
  if (m.missing) {
    model = null;
    return { title: hub[0], html: html`${crumbsHTML([home, hub])}${notFoundHTML(I, m.notes)}` };
  }
  model = { kind: "run", ...m };
  const title = I.S(...m.pathway.title);
  return {
    title,
    html: html`${crumbsHTML([home, hub, [title, null]])}${runnerHTML(ctx, I, model)}`,
  };
}

// ── runner events ────────────────────────────────────────────────────────────────────────────────────────────
const stageOf = (kind) => model?.state?.stages.find((s) => s.stage.kind === kind)?.stage || null;
const say = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
  announce(text, { toast: false });
};

function saveTransfer(ctx, I) {
  const stage = stageOf("transfer");
  const text = String(document.querySelector("[data-pw-draft]")?.value || "").trim();
  if (!stage || !model.run) return true;
  if (!text) {
    ui.note = I.S("Write your explanation first.", "Primero escribe tu explicación.");
    say("pwTransferNote", ui.note);
    document.querySelector("[data-pw-draft]")?.focus();
    return true;
  }
  const { objective, pathway, runs } = model;
  const meta = runs.runs[pathway.runKey].meta[stage.id] || {};
  const tasks = model.tasks;
  const task = tasks[(meta.task || 0) % tasks.length];
  const loopId = startTextLoop(ctx, {
    src: "pathway",
    objective: objective.id,
    task: {
      id: `pw:${pathway.runKey}:${task.id}`,
      title: `Pathway: ${pathway.title[0]}`,
      prompt: task.prompt[0],
      keyUse: objective.keyUse,
      domain: "Writing",
    },
    text,
    supports: meta.supports || {},
  });
  if (!loopId) return true;
  noteLoop(runs, pathway.runKey, stage.id, loopId);
  runs.runs[pathway.runKey].meta[stage.id].draft = "";
  saveRuns(runs);
  ui.note = "";
  ctx.rerender();
  requestAnimationFrame(() =>
    document
      .querySelector("#pwTransfer .intel-title, #pwTransfer")
      ?.scrollIntoView({ block: "nearest" }),
  );
  return true;
}

async function startBook(ctx, I, stageId) {
  const { pathway, objective, runs, band, snap } = model;
  const stage = pathway.stages.find((s) => s.id === stageId);
  if (!stage) return;
  const said = snap.loops
    .filter((l) => l.objective === objective.id && l.stages?.response?.text)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
  try {
    const id = await createBookFromContent({
      source: { kind: "pathway", id: `${pathway.runKey}:${stage.key}`, label: pathway.title[0] },
      title: objective.title[0],
      templateId: stage.key.slice(1),
      band,
      pages: [
        {
          heading: objective.title[0],
          text: `My goal: ${objective.student[0]}\n\n${said ? `What I said before: "${String(said.stages.response.text).slice(0, 400)}"\n\n` : ""}Write your explanation on this page. Point to your evidence.`,
        },
      ],
    });
    noteBook(runs, pathway.runKey, stage.id, id);
    saveRuns(runs);
    ctx.navigate(
      `${LAB}/book-studio/edit/${id}?pw=${encodeURIComponent(pathway.runKey)}&st=${encodeURIComponent(stage.id)}`,
    );
  } catch {
    ui.bookNote = I.S(
      "This device could not save a book right now. Try again, or ask your teacher.",
      "Este dispositivo no pudo guardar un libro ahora. Intenta de nuevo o pregunta a tu docente.",
    );
    ctx.rerender();
  }
}

async function share(ctx, I) {
  const { pathway, runs, digest } = model;
  ui.shareNote = I.S("Sending…", "Enviando…");
  say("pwShareNote", ui.shareNote);
  const res = await shareWithClass({ label: `Pathway: ${pathway.title[0]}`, text: digest });
  if (res.ok) {
    runs.runs[pathway.runKey].sharedAt = new Date().toISOString();
    saveRuns(runs);
    ui.shareNote = I.S(
      "Sent. Your teacher can read the whole pathway in the class review queue.",
      "Enviado. Tu docente puede leer toda la ruta en la cola de revisión de la clase.",
    );
  } else
    ui.shareNote =
      res.reason === "no-class"
        ? I.S("Join your class first, then share.", "Primero únete a tu clase y luego comparte.")
        : I.S(
            "It did not send (no connection to the class). Your work is still saved on this device. Try again later.",
            "No se envió (sin conexión con la clase). Tu trabajo sigue guardado en este dispositivo. Intenta más tarde.",
          );
  ctx.rerender();
}

function runnerClick(e, ctx, I) {
  const t = e.target;
  if (t.closest("[data-intel]")) return onLoopClick(e, ctx);
  if (model.preview) return false;
  const { pathway, runs } = model;
  const help = t.closest("[data-pw-help]");
  if (help) {
    const stage = stageOf("transfer");
    noteSupport(runs, pathway.runKey, stage.id, help.dataset.pwHelp);
    const meta = runs.runs[pathway.runKey].meta[stage.id];
    meta.draft = String(document.querySelector("[data-pw-draft]")?.value ?? meta.draft ?? "").slice(
      0,
      4000,
    );
    saveRuns(runs);
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-pw-transfer-save]")) return saveTransfer(ctx, I);
  if (t.closest("[data-pw-transfer-new]")) {
    const stage = stageOf("transfer");
    const meta = (runs.runs[pathway.runKey].meta[stage.id] ||= {});
    meta.task = ((meta.task || 0) + 1) % model.tasks.length;
    meta.supports = {};
    meta.draft = "";
    // The saved loop stays in the loop store and still counts; only the box is opened for a new try.
    delete meta.loopId;
    saveRuns(runs);
    ctx.rerender();
    requestAnimationFrame(() => document.querySelector("[data-pw-draft]")?.focus());
    return true;
  }
  const book = t.closest("[data-pw-book]");
  if (book) {
    void startBook(ctx, I, book.dataset.pwBook);
    return true;
  }
  if (t.closest("[data-pw-talk-save]")) {
    const stage = stageOf("family");
    const used = [...document.querySelectorAll("[data-pw-talk]:checked")].map((b) =>
      Number(b.dataset.pwTalk),
    );
    if (!used.length) {
      say(
        "pwTalkNote",
        I.S("Tick the questions you used first.", "Primero marca las preguntas que usaron."),
      );
      return true;
    }
    recordTalk(runs, pathway.runKey, stage.id, used);
    saveRuns(runs);
    ui.talk = null;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-pw-share]")) {
    void share(ctx, I);
    return true;
  }
  return false;
}

export function onClick(e, ctx) {
  if (!model) return false;
  const I = i18nFor(ctx);
  if (model.kind === "run") return runnerClick(e, ctx, I);
  if (model.kind === "build") return buildClick(e, ctx, I);
  return false;
}

export function onChange(e, ctx) {
  const t = e.target;
  if (!model || !t.matches) return;
  if (model.kind === "run" && t.matches("[data-pw-talk]")) {
    ui.talk = [...document.querySelectorAll("[data-pw-talk]:checked")].map((b) =>
      Number(b.dataset.pwTalk),
    );
    return;
  }
  if (model.kind === "build") buildChange(e, ctx);
}

export function onInput(e, ctx) {
  const t = e.target;
  if (!model || !t.matches) return;
  if (onLoopInput(e, ctx)) return;
  if (model.kind === "run" && t.matches("[data-pw-draft]") && model.run) {
    const stage = stageOf("transfer");
    const runs = model.runs;
    (runs.runs[model.pathway.runKey].meta[stage.id] ||= {}).draft = t.value.slice(0, 4000);
    saveRuns(runs);
  } else if (model.kind === "build") buildInput(e, ctx);
}

export function unmount() {
  ui = fresh();
  buildReset();
  assigned = null;
  model = null;
}
