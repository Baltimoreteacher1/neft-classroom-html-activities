// Science Investigation Lab: saved-state helpers shared by every screen. No markup here.
// All state lives under SCIENCE_LAB_KEY (the Passport carries it); the ledger gets numbers and ids, never text.
import { CASES, findCase, STAGES, TRANSFER_STAGE } from "../content/science-lab.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import {
  caseFor,
  caseState,
  checkClaim,
  checkHypothesis,
  checkPlan,
  checkQuestion,
  checkReasoning,
  checkRevision,
  noteHelp,
  parseState,
  SCIENCE_LAB_KEY,
  setSupport,
  stageStatus,
  toLedgerEntries,
  updateStage,
  workKind,
} from "../lang/science-lab.js";
import { storage } from "../util.js";

export { STAGES, TRANSFER_STAGE, caseFor, workKind };

export const loadLab = () => parseState(storage.get(SCIENCE_LAB_KEY));
const saveLab = (state) => storage.set(SCIENCE_LAB_KEY, JSON.stringify(state));

/** The band, case and ids this screen works on. `?case=<id>` picks a case; the band's first case is the default. */
export function targetOf(ctx) {
  const band = CASES[ctx.band] ? ctx.band : "6-8";
  const wanted = new URLSearchParams(location.search).get("case");
  const caseDef = findCase(band, wanted) || CASES[band][0];
  return { band, caseDef, caseId: caseDef.id };
}

export const csOf = (t, state = loadLab()) => caseState(state, t.band, t.caseId);
export const recOf = (t, stage) => csOf(t).stages[stage] || {};

export function patchStage(t, stage, patch) {
  saveLab(updateStage(loadLab(), t.band, t.caseId, stage, patch));
}

/** Merge one key of a map-valued field (for example a reflection answer) without touching its siblings. */
export function patchMap(t, stage, name, sub, value) {
  patchStage(t, stage, { [name]: { ...(recOf(t, stage)[name] || {}), [sub]: value } });
}

/** The engine keeps no "has chosen" flag, so the choice is recorded as a marker on the first stage. */
export const hasChosen = (cs) => cs.stages.notice?.chosen === true;

export function chooseSupport(t, level) {
  let next = setSupport(loadLab(), t.band, t.caseId, level);
  next = updateStage(next, t.band, t.caseId, "notice", { chosen: true });
  saveLab(next);
}

/** Opening any help is recorded; the stage is then supported for good. */
export function recordHelp(t, stage, helpId) {
  saveLab(noteHelp(loadLab(), t.band, t.caseId, stage, helpId));
}

/** Like stageStatus, but choosing a help setting alone does not make "Notice" started. */
export function statusOf(cs, stage) {
  const rec = cs.stages[stage];
  if (stage === "notice" && rec && Object.keys(rec).every((k) => k === "chosen")) return "new";
  return stageStatus(cs, stage);
}

export const nextStageOf = (cs) =>
  STAGES.find((s) => statusOf(cs, s) !== "done") ||
  (statusOf(cs, TRANSFER_STAGE) === "done" ? "" : TRANSFER_STAGE);

/** Learner-visible work saved for a stage, as one string; used only to run the engine, never stored in the ledger. */
export function ledgerText(stage, rec) {
  const join = (...parts) => parts.filter((p) => typeof p === "string" && p.trim()).join(". ");
  switch (stage) {
    case "notice":
      return join(rec.notice, rec.wonder);
    case "plan":
      return join(rec.measure, rec.steps);
    case "represent":
      return rec.sentence || "";
    case "present":
      return rec.transcript || "";
    case "reflect":
      return join(...Object.values(rec.answers || {}));
    case "revise":
      return rec.chk?.after?.text || "";
    case TRANSFER_STAGE:
      return join(rec.question, rec.claim, rec.reasoning);
    default:
      return rec.text || "";
  }
}

/** Write the stage's first-attempt ledger entry once; ids and numbers only. */
export function recordLedger(t, stage, result) {
  const cs = csOf(t);
  const rec = cs.stages[stage] || {};
  if (rec.ledgered) return;
  const entries = toLedgerEntries(stage, result, {
    band: t.band,
    caseId: t.caseId,
    text: ledgerText(stage, rec),
    caseState: cs,
  });
  if (!entries.length) return;
  const ledger = loadLedger();
  for (const entry of entries) appendEntry(ledger, entry);
  saveLedger(ledger);
  patchStage(t, stage, { ledgered: true });
}

const NO_NOTES = { ok: true, notes: [] };

/** Run the stage's check in both languages so any language mode can show the question. */
export function runCheck(stage, input, caseDef) {
  const both = (fn) => ({ en: fn("en"), es: fn("es") });
  switch (stage) {
    case "question":
      return both((l) => checkQuestion(input.text, caseDef, l));
    case "hypothesis":
      return both((l) => checkHypothesis(input.text, caseDef, l));
    case "plan":
      return both((l) => checkPlan(input, caseDef, l));
    case "claim":
      return both((l) => checkClaim(input.text, caseDef, l));
    case "reasoning":
      return both((l) => checkReasoning(input, caseDef, l));
    case "revise":
      return both((l) =>
        checkRevision(
          { stage: input.target, ...input.before },
          { stage: input.target, ...input.after },
          caseDef,
          l,
        ),
      );
    default:
      return { en: NO_NOTES, es: NO_NOTES };
  }
}

/** The transfer attempt is checked against the transfer case, section by section. */
export function runTransfer(input, caseDef) {
  const tc = caseFor(caseDef, TRANSFER_STAGE);
  const both = (fn) => ({ en: fn("en"), es: fn("es") });
  const sections = {
    question: both((l) => checkQuestion(input.question, tc, l)),
    claim: both((l) => checkClaim(input.claim, tc, l)),
    reasoning: both((l) =>
      checkReasoning(
        { claim: input.claim, evidenceIds: input.evidenceIds, text: input.reasoning },
        tc,
        l,
      ),
    ),
  };
  const all = Object.values(sections).flatMap((r) => r.en.notes);
  return { sections, merged: { ok: all.length === 0, notes: all } };
}

/** Notes as { quote, en, es } so a view can show the ask in the learner's language mode. */
export const pairNotes = (res) =>
  res.en.notes.map((n, i) => ({
    id: n.id,
    quote: n.quote,
    en: n.ask,
    es: res.es.notes[i]?.ask || n.ask,
  }));

/** What the learner earlier wrote for a stage that can be revised, in the shape the checks read. */
export function workOf(cs, stage) {
  const rec = cs.stages[stage] || {};
  const claim = cs.stages.claim?.text || "";
  if (stage === "reasoning")
    return { text: rec.text || "", claim, evidenceIds: cs.stages.evidence?.ids || [] };
  return { text: rec.text || "" };
}

export const dataRows = (caseDef) => caseDef.dataset.rows;
export const rowLabel = (caseDef, row, pick) =>
  caseDef.variables
    .map(
      (v) =>
        pick(v.values.find((x) => x.id === row.conditions[v.id])?.label) ?? row.conditions[v.id],
    )
    .join(", ");

/** The exact input a stage's check reads, built from saved work. A saved `chk` is a snapshot of this. */
export function inputOf(stage, rec, cs) {
  switch (stage) {
    case "plan":
      return {
        changed: rec.changed || [],
        held: rec.held || [],
        measure: rec.measure || "",
        trials: rec.trials || "",
        steps: rec.steps || "",
      };
    case "reasoning":
      return {
        claim: cs.stages.claim?.text || "",
        evidenceIds: cs.stages.evidence?.ids || [],
        text: rec.text || "",
      };
    case "revise": {
      const target = rec.target || "claim";
      const before = workOf(cs, target);
      const text = typeof rec.after === "string" ? rec.after : before.text;
      return { target, before, after: { ...before, text } };
    }
    case TRANSFER_STAGE:
      return {
        question: rec.question || "",
        claim: rec.claim || "",
        evidenceIds: rec.evidenceIds || [],
        reasoning: rec.reasoning || "",
      };
    default:
      return { text: rec.text || "" };
  }
}
