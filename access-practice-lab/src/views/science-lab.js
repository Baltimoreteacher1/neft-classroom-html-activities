// Science Investigation Lab (/worlds/science-lab and /worlds/science-lab/<stage>), reached through views/worlds.js.
// One calm screen per stage: notice, question, hypothesis, plan, collect, represent, claim, evidence, reasoning,
// revise, present, reflect, then an independent transfer attempt with all help closed.
// State is one key (SCIENCE_LAB_KEY) and reload resumes exactly; the ledger gets numbers and ids, never learner text.
// Feedback is the learner's own quoted words followed by a question. No timer, no score, no randomness.
import { STAGE_META, STAGES, TRANSFER_STAGE } from "../content/science-lab.js";
import { i18nFor } from "../i18n.js";
import { announce, html } from "../util.js";
import {
  barChange,
  barInput,
  liveMirror,
  refreshPlanPreview,
  sceneClick,
} from "./science-lab-actions.js";
import { collectHTML } from "./science-lab-collect.js";
import { evidenceHTML, representHTML } from "./science-lab-data.js";
import { hubHTML } from "./science-lab-hub.js";
import {
  chooseSupport,
  csOf,
  dataRows,
  hasChosen,
  inputOf,
  patchStage,
  recOf,
  recordHelp,
  recordLedger,
  runCheck,
  runTransfer,
  targetOf,
  workKind,
} from "./science-lab-model.js";
import {
  claimHTML,
  hypothesisHTML,
  noticeHTML,
  questionHTML,
  reasoningHTML,
} from "./science-lab-text.js";
import {
  closedRailHTML,
  crumbs,
  doneButtonHTML,
  helpRailHTML,
  labHref,
  openSetFor,
  resetOpenHelp,
  stageShellHTML,
  stageTitle,
} from "./science-lab-ui.js";
import { planHTML } from "./science-lab-plan.js";
import { presentHTML, reflectHTML, reviseHTML, transferHTML } from "./science-lab-work.js";


const STAGE_VIEWS = {
  notice: noticeHTML,
  question: questionHTML,
  hypothesis: hypothesisHTML,
  plan: planHTML,
  collect: collectHTML,
  represent: representHTML,
  claim: claimHTML,
  evidence: evidenceHTML,
  reasoning: reasoningHTML,
  revise: reviseHTML,
  present: presentHTML,
  reflect: reflectHTML,
  [TRANSFER_STAGE]: transferHTML,
};
const CHECKED = ["question", "hypothesis", "plan", "claim", "reasoning", "revise", TRANSFER_STAGE];
const NO_NOTES = { ok: true, notes: [] };

/** Where the learner is now, so unmount and the debounce know what to save. */
let current = null;
let draftTimer = 0;

const isStage = (id) => STAGES.includes(id) || id === TRANSFER_STAGE;

export async function render(ctx) {
  const I = i18nFor(ctx);
  const t = targetOf(ctx);
  const stage = isStage(ctx.route.missionId) ? ctx.route.missionId : "";
  current = { t, stage };
  // No gate: a learner who never picked a help level works at "Some" (B), saved so the engine labels it the same.
  if (!hasChosen(csOf(t))) chooseSupport(t, "B");
  const cs = csOf(t);
  const title = I.S("Science Investigation Lab", "Laboratorio de investigación científica");
  if (!stage) return { title, html: html`<div class="sl-hub">${hubHTML(I, t, cs)}</div>` };
  const main = STAGE_VIEWS[stage](I, t, cs);
  const rail =
    stage === TRANSFER_STAGE
      ? closedRailHTML(I)
      : helpRailHTML(I, t, stage, openSetFor(t, stage, cs.support));
  const meta = STAGE_META[stage];
  const name = stage === TRANSFER_STAGE ? stageTitle(I, stage) : I.S(meta.title.en, meta.title.es);
  return {
    title: `${name} · ${title}`,
    html: html`${crumbs(I, t, name)}${stageShellHTML(I, t, cs, stage, { main, rail, foot: doneButtonHTML(I, stage) })}`,
  };
}

// ── saving ───────────────────────────────────────────────────────────────────
/** Write every on-screen field that differs from what is saved. Untouched empty fields never mark a stage started. */
function flush() {
  clearTimeout(draftTimer);
  if (!current) return;
  const { t } = current;
  const patches = new Map();
  for (const el of document.querySelectorAll("[data-sl-field]")) {
    const [stage, name] = el.dataset.slField.split(":");
    const sub = el.dataset.slSub;
    const saved = sub ? recOf(t, stage)[name]?.[sub] : recOf(t, stage)[name];
    const value = el.value.slice(0, 4000);
    if (value === (saved ?? "")) continue;
    const patch = patches.get(stage) || {};
    patch[name] = sub ? { ...(patch[name] || recOf(t, stage)[name] || {}), [sub]: value } : value;
    patches.set(stage, patch);
  }
  for (const [stage, patch] of patches) patchStage(t, stage, patch);
}

export function onInput(e, ctx) {
  const I = i18nFor(ctx);
  if (barInput(e.target, I, targetOf(ctx))) return;
  if (!e.target.matches?.("[data-sl-field]")) return;
  liveMirror(e.target, I, targetOf(ctx));
  if (e.target.id === "slf-plan-trials") refreshPlanPreview(I, targetOf(ctx));
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    flush();
    const note = document.querySelector("[data-sl-saved]");
    if (note) note.textContent = I.S("Saved on this device.", "Guardado en este dispositivo.");
  }, 400);
}

export function unmount() {
  flush();
  current = null;
}

// ── actions ──────────────────────────────────────────────────────────────────
const say = (I, en, es) => {
  const live = document.getElementById("slMsg");
  if (live) live.textContent = I.S(en, es);
};
const focusEl = (selector) => document.querySelector(selector)?.focus();
const emptyField = () =>
  [...document.querySelectorAll("[data-sl-required]")].find((el) => !el.value.trim());

function hasWords(stage, input) {
  switch (stage) {
    case "plan":
      return Boolean(
        input.changed.length ||
        input.held.length ||
        input.measure.trim() ||
        input.steps.trim() ||
        String(input.trials).trim(),
      );
    case "revise":
      return Boolean(input.after.text.trim());
    case TRANSFER_STAGE:
      return Boolean(input.question.trim() || input.claim.trim() || input.reasoning.trim());
    default:
      return Boolean(input.text.trim());
  }
}

function runChecked(ctx, stage) {
  const I = i18nFor(ctx);
  flush();
  const t = targetOf(ctx);
  const cs = csOf(t);
  const input = inputOf(stage, cs.stages[stage] || {}, cs);
  if (!hasWords(stage, input)) {
    say(I, "Write something first, then check it.", "Escribe algo primero y luego revísalo.");
    emptyField()?.focus();
    return;
  }
  const result =
    stage === TRANSFER_STAGE
      ? runTransfer(input, t.caseDef).merged
      : runCheck(stage, input, t.caseDef).en;
  patchStage(t, stage, { chk: input });
  recordLedger(t, stage, result);
  ctx.rerender().then(() => focusEl("#slFbTitle"));
}

/** What is still missing before a stage can be finished, or "" when it can. Waiting is never required. */
function missing(stage, cs, t) {
  const rec = cs.stages[stage] || {};
  const blank = (v) => !String(v ?? "").trim();
  if (stage === "notice" && blank(rec.notice))
    return ["Write what you notice first.", "Primero escribe lo que observas."];
  if (CHECKED.includes(stage) && !rec.chk)
    return [
      "Write your words, then press the check button. You can keep going after you read the questions.",
      "Escribe tus palabras y luego pulsa el botón de revisar. Puedes seguir después de leer las preguntas.",
    ];
  if (stage === "collect" && (rec.rows || []).length < dataRows(t.caseDef).length)
    return ["Run every test first.", "Primero haz todas las pruebas."];
  if (stage === "represent" && (rec.rows || []).length < 2)
    return [
      "Choose at least two results for your table or chart.",
      "Elige al menos dos resultados para tu tabla o gráfica.",
    ];
  if (stage === "represent" && blank(rec.sentence))
    return ["Write one sentence about it.", "Escribe una oración al respecto."];
  if (stage === "evidence" && !(rec.ids || []).length)
    return ["Choose at least one test.", "Elige al menos una prueba."];
  if (stage === "present" && blank(rec.transcript))
    return ["Type what you said first.", "Primero escribe lo que dijiste."];
  if (stage === "reflect" && !Object.values(rec.answers || {}).some((a) => !blank(a)))
    return ["Answer at least one question.", "Responde al menos una pregunta."];
  return null;
}

function finish(ctx, stage) {
  const I = i18nFor(ctx);
  flush();
  const t = targetOf(ctx);
  const gap = missing(stage, csOf(t), t);
  if (gap) {
    say(I, ...gap);
    emptyField()?.focus();
    return;
  }
  if (!CHECKED.includes(stage)) recordLedger(t, stage, NO_NOTES);
  patchStage(t, stage, { done: true });
  const next =
    stage === TRANSFER_STAGE ? "" : (STAGES[STAGES.indexOf(stage) + 1] ?? TRANSFER_STAGE);
  ctx.navigate(labHref(t, next));
}

function toggleHelp(ctx, id) {
  const I = i18nFor(ctx);
  const t = targetOf(ctx);
  const stage = current?.stage;
  if (!stage) return;
  flush();
  const cs = csOf(t);
  const open = openSetFor(t, stage, cs.support);
  if (open.has(id)) open.delete(id);
  else {
    const wasAlone = workKind(cs, stage) === "independent";
    open.add(id);
    recordHelp(t, stage, id);
    if (wasAlone)
      announce(
        I.S(
          "Help opened. This step is now marked as working with help.",
          "Ayuda abierta. Este paso ahora está marcado como trabajo con ayuda.",
        ),
      );
  }
  ctx.rerender();
}

export function onClick(e, ctx) {
  const el = e.target.closest?.("button");
  if (!el) return false;
  const t = targetOf(ctx);
  if (el.dataset.slSupport) {
    const level = el.dataset.slSupport;
    flush();
    chooseSupport(t, level);
    resetOpenHelp(t);
    const I = i18nFor(ctx);
    ctx.rerender().then(() => {
      focusEl(`[data-sl-support="${level}"]`);
      say(I, "Help setting saved.", "Ajuste de ayuda guardado.");
    });
    return true;
  }
  if (sceneClick(el, ctx, i18nFor(ctx), t, flush)) return true;
  if (el.dataset.slHelp) return (toggleHelp(ctx, el.dataset.slHelp), true);
  if (el.dataset.slRun) {
    flush();
    const rows = recOf(t, "collect").rows || [];
    patchStage(t, "collect", { rows: [...new Set([...rows, el.dataset.slRun])], last: el.dataset.slRun });
    ctx.rerender().then(() => focusEl(`[data-sl-result="${el.dataset.slRun}"]`));
    return true;
  }
  if (el.dataset.slCheck) return (runChecked(ctx, el.dataset.slCheck), true);
  if (el.dataset.slDone) return (finish(ctx, el.dataset.slDone), true);
  return false;
}

export function onChange(e, ctx) {
  const el = e.target;
  const t = targetOf(ctx);
  if (el.matches?.("[data-sl-var]")) {
    const picked = [...document.querySelectorAll("[data-sl-var]:checked")];
    const ids = (kind) => picked.filter((r) => r.value === kind).map((r) => r.dataset.slVar);
    flush();
    patchStage(t, "plan", { changed: ids("change"), held: ids("held") });
    refreshPlanPreview(i18nFor(ctx), t, { announce: true });
    return true;
  }
  if (barChange(el, i18nFor(ctx), t)) {
    if (current?.stage === "represent") flush();
    return true;
  }
  if (el.matches?.("[data-sl-format]")) {
    flush();
    patchStage(t, "represent", { format: el.value });
    ctx.rerender();
    return true;
  }
  if (el.matches?.("[data-sl-target]")) {
    patchStage(t, "revise", { target: el.value, after: null, chk: null });
    ctx.rerender();
    return true;
  }
  if (el.dataset?.slEvid) {
    const [stage, key, id] = el.dataset.slEvid.split(":");
    flush();
    const list = recOf(t, stage)[key] || [];
    patchStage(t, stage, {
      [key]: el.checked ? [...new Set([...list, id])] : list.filter((x) => x !== id),
    });
    ctx.rerender();
    return true;
  }
  return false;
}
