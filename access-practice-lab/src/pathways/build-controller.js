// Connected Pathways — the builder's view model and events (/pathways/build), used by src/views/pathways.js.
// The draft is kept in the pathways store (`draft`) so a reload keeps the teacher's work. Every change re-encodes
// the draft into the assignable URL and decodes it again, so what the teacher sees is exactly what will open.
import { MAX_BYTES, qrSvg } from "../../../shared/qr/qr-code.mjs";
import { loadIndex } from "../content.js";
import { i18nFor } from "../i18n.js";
import { announce, toHtml } from "../util.js";
import {
  addStage,
  applySupportLevel,
  blankDraft,
  draftFromBuiltIn,
  moveStage,
  removeStage,
  saveToClass,
  searchResources,
  setFollowUp,
  setObjective,
  setRejected,
  setTitle,
  teacherClasses,
  toggleOptional,
  toggleSupport,
} from "./builder.js";
import { objectiveById } from "./graph.js";
import { REFERENCE_ID, assignmentFor, builtIn, cleanTitle, decodeCustom, encodeCustom, matchBuiltIn } from "./pathways.js";
import { loadRuns, saveRuns } from "./progress.js";
import { resultsHTML } from "./ui-build.js";

let st = { query: "", note: "" };
let model = null;
export const buildReset = () => {
  st = { query: "", note: "" };
  model = null;
};

const say = (text) => {
  const el = document.getElementById("pwAssignNote");
  if (el) el.textContent = text;
  announce(text, { toast: false });
};

export async function builderModel(ctx) {
  const band = ctx.band === "3-5" ? "3-5" : "6-8";
  const data = { index: await loadIndex() };
  const draft = loadRuns().draft || draftFromBuiltIn(REFERENCE_ID, band);
  const decoded = decodeCustom(Object.fromEntries(new URLSearchParams(encodeCustom(draft))), band, data);
  const objective = objectiveById(draft.objective);
  // A draft that is still exactly a built-in pathway is assigned by that pathway's own short route.
  const same = matchBuiltIn(draft, band);
  const shown = (same && builtIn(same, band, data)) ||
    decoded.pathway || {
      runKey: "c-draft",
      title: [draft.title || objective.title[0], draft.title || objective.title[1]],
      custom: true,
      stages: [],
    };
  const assign = assignmentFor(shown, decoded.def || draft, band);
  const link = `${location.origin}${assign.assignment.path}`;
  const bytes = new TextEncoder().encode(link).length;
  let qr = "";
  try {
    if (assign.ok && bytes <= MAX_BYTES)
      qr = String(qrSvg(link, { px: 168, label: i18nFor(ctx).S("QR code that opens this pathway", "Código QR que abre esta ruta") }));
  } catch {}
  model = {
    band,
    data,
    draft,
    pathway: decoded.pathway,
    objective,
    query: st.query,
    results: searchResources(st.query, draft.objective, band, data),
    dropped: decoded.notes.filter((n) => n.kind === "unknown").map((n) => n.key),
    titleNote: cleanTitle(draft.title) !== String(draft.title || "").trim(),
    assign,
    link,
    qr,
    qrTooLong: assign.ok && !qr ? { bytes, max: MAX_BYTES } : null,
    classes: teacherClasses(),
    note: st.note,
  };
  return model;
}

function setDraft(ctx, draft, note = "") {
  const runs = loadRuns();
  runs.draft = draft;
  saveRuns(runs);
  st.note = note;
  ctx.rerender();
  return true;
}

async function assignToClass(ctx, I, code) {
  const cls = model.classes.find((c) => c.code === code);
  if (!cls || !model.assign.ok) return;
  say(I.S("Saving to the class…", "Guardando en la clase…"));
  const res = await saveToClass(cls, model.assign.assignment);
  st.note = res.ok
    ? res.already
      ? I.S("This pathway is already assigned to that class.", "Esta ruta ya está asignada a esa clase.")
      : I.S(`Assigned to ${cls.title || cls.code}. Students see it under Assigned practice.`, `Asignada a ${cls.title || cls.code}. Los estudiantes la ven en Práctica asignada.`)
    : res.reason === "passcode"
      ? I.S("The class passcode was not accepted. Open the class again in the class teacher view.", "No se aceptó el código de acceso de la clase. Abran la clase otra vez en la vista del maestro.")
      : res.reason === "full"
        ? I.S("That class already has the most assignments it can hold. Remove one in the class teacher view.", "Esa clase ya tiene el máximo de tareas. Quiten una en la vista del maestro.")
        : I.S("It was not saved (no connection to the class). Copy the link instead, or try again.", "No se guardó (sin conexión con la clase). Copien el enlace o intenten de nuevo.");
  ctx.rerender();
}

export function buildClick(e, ctx, I) {
  const t = e.target;
  if (!model) return false;
  const { draft, data, band } = model;
  const move = t.closest("[data-pw-move]");
  if (move) return setDraft(ctx, moveStage(draft, Number(move.dataset.pwMove), Number(move.dataset.dir)));
  const remove = t.closest("[data-pw-remove]");
  if (remove) return setDraft(ctx, removeStage(draft, Number(remove.dataset.pwRemove)));
  const add = t.closest("[data-pw-add]");
  if (add) return setDraft(ctx, addStage(draft, add.dataset.pwAdd, data));
  const need = t.closest("[data-pw-need]");
  if (need) return setDraft(ctx, setRejected(draft, need.dataset.pwNeed, need.dataset.reject === "1"));
  const levelBtn = t.closest("[data-pw-support-level]");
  if (levelBtn) {
    const domain = (model.objective?.domains?.[0] || "writing").toLowerCase();
    return setDraft(ctx, applySupportLevel(draft, Number(levelBtn.dataset.pwSupportLevel), domain));
  }
  if (t.closest("[data-pw-start-go]")) {
    const id = document.querySelector("[data-pw-start]")?.value || "";
    const next = id ? draftFromBuiltIn(id, band) : blankDraft(draft.objective);
    return setDraft(ctx, { ...next, title: id ? next.title : draft.title });
  }
  if (t.closest("[data-pw-copy]")) {
    const done = (ok) =>
      say(ok ? I.S("Link copied.", "Enlace copiado.") : I.S("Copy did not work here. Select the link above and copy it.", "No se pudo copiar aquí. Seleccionen el enlace de arriba y cópienlo."));
    document.getElementById("pwLink")?.select();
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(model.link).then(
        () => done(true),
        () => done(false),
      );
    else done(false);
    return true;
  }
  const cls = t.closest("[data-pw-class]");
  if (cls) {
    void assignToClass(ctx, I, cls.dataset.pwClass);
    return true;
  }
  return false;
}

export function buildChange(e, ctx) {
  const t = e.target;
  if (!model) return;
  const { draft } = model;
  if (t.matches("[data-pw-optional]")) setDraft(ctx, toggleOptional(draft, Number(t.dataset.pwOptional)));
  else if (t.matches("[data-pw-support]")) setDraft(ctx, toggleSupport(draft, t.dataset.pwSupport));
  else if (t.matches("[data-pw-objective]")) setDraft(ctx, setObjective(draft, t.value));
  else if (t.matches("[data-pw-follow]")) setDraft(ctx, setFollowUp(draft, t.value));
  else if (t.matches("[data-pw-title]")) setDraft(ctx, setTitle(draft, t.value));
}

export function buildInput(e, ctx) {
  const t = e.target;
  if (!model || !t.matches("[data-pw-search]")) return;
  // The list is redrawn in place so the caret stays where the teacher is typing.
  st.query = t.value.slice(0, 60);
  model.query = st.query;
  model.results = searchResources(st.query, model.draft.objective, model.band, model.data);
  const list = document.querySelector(".pw-results");
  if (list) list.innerHTML = toHtml(resultsHTML(i18nFor(ctx), model));
}
