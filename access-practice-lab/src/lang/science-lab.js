// Science Investigation Lab engine: pure functions over the saved state and the learner's own words.
// No DOM, no storage, no network, no clock, no timers. tools/access-science-lab.test.mjs drives these directly.
//
// State (one key, SCIENCE_LAB_KEY, so Passport export/import carries it):
//   { v: 1, bands: { [band]: { cases: { [caseId]: { support, stages: { [stage]: {...} }, helpUsed: [...] } } } } }
// `helpUsed` holds "<stage>:<helpId>". A stage is "supported" when any of its help was opened or the learner
// chose support A or B; "independent" otherwise. The transfer attempt is independent whenever no help was opened.
//
// Checks are deterministic rules. Every note is { id, quote, ask }: `quote` is a character-accurate span of the
// learner's own text, `ask` is a question (English or Spanish) that names the part to work on. Nothing here
// returns a score, a level, a percentage or a prediction, and no learner text reaches the ledger.
import { CASES, findCase, STAGE_META, STAGES, TRANSFER_STAGE } from "../content/science-lab.js";
import { analyzeResponse } from "./analyze.js";
import { blank, clean, isPlain } from "./science-lab-checks.js";

export {
  checkClaim,
  checkHypothesis,
  checkPlan,
  checkQuestion,
  checkReasoning,
  checkRevision,
} from "./science-lab-checks.js";

export const SCIENCE_LAB_KEY = "accessPracticeLab:v1:science-lab";
export const SUPPORT_LEVELS = ["A", "B", "C"];
export const emptyState = () => ({ v: 1, bands: {} });

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const WORK_STAGES = [...STAGES, TRANSFER_STAGE];

// ── state ────────────────────────────────────────────────────────────────────

/** Keep only JSON-safe, bounded values (strings, finite numbers, booleans, null, arrays, plain objects). */
function cleanValue(v, depth = 0) {
  if (typeof v === "string") return v.slice(0, 6000);
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "boolean" || v === null) return v;
  if (depth >= 5) return null;
  if (Array.isArray(v)) return v.slice(0, 100).map((x) => cleanValue(x, depth + 1));
  if (!isPlain(v)) return null;
  const out = {};
  for (const key of Object.keys(v).slice(0, 60)) {
    if (BAD_KEYS.has(key) || key.length > 64) continue;
    out[key] = cleanValue(v[key], depth + 1);
  }
  return out;
}

function cleanCase(c) {
  const src = isPlain(c) ? c : {};
  const stages = {};
  for (const stage of WORK_STAGES)
    if (isPlain(src.stages?.[stage])) stages[stage] = cleanValue(src.stages[stage]);
  const help = Array.isArray(src.helpUsed) ? src.helpUsed : [];
  const helpUsed = [
    ...new Set(help.filter((h) => typeof h === "string" && /^[a-z]+:[\w-]{1,40}$/.test(h))),
  ].slice(0, 200);
  return { support: SUPPORT_LEVELS.includes(src.support) ? src.support : "A", stages, helpUsed };
}

/** Defensive: strings, objects, nulls and older shapes all come back as a valid v1 state. Never throws. */
export function parseState(raw) {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!isPlain(data) || data.v !== 1 || !isPlain(data.bands)) return emptyState();
    const bands = {};
    for (const band of Object.keys(CASES)) {
      const src = data.bands[band];
      if (!isPlain(src)) continue;
      const cases = {};
      if (isPlain(src.cases))
        for (const id of Object.keys(src.cases))
          if (SAFE_ID.test(id) && !BAD_KEYS.has(id)) cases[id] = cleanCase(src.cases[id]);
      bands[band] = { cases };
    }
    return { v: 1, bands };
  } catch {
    return emptyState();
  }
}

const isState = (s) => isPlain(s) && s.v === 1 && isPlain(s.bands);
const validTarget = (band, caseId) =>
  Object.hasOwn(CASES, band) && typeof caseId === "string" && SAFE_ID.test(caseId);

/** One case's saved work, normalized (a new object each call). */
export function caseState(state, band, caseId) {
  return cleanCase(isState(state) ? state.bands[band]?.cases?.[caseId] : null);
}

function withCase(state, band, caseId, next) {
  const s = isState(state) ? state : emptyState();
  const cases = { ...s.bands[band]?.cases, [caseId]: next };
  return { ...s, bands: { ...s.bands, [band]: { ...s.bands[band], cases } } };
}

/** Returns a new state with one stage's saved work merged (never drops fields it was not given). */
export function updateStage(state, band, caseId, stage, patch) {
  if (!validTarget(band, caseId) || !WORK_STAGES.includes(stage) || !isPlain(patch)) return state;
  const c = caseState(state, band, caseId);
  const merged = { ...c.stages[stage], ...cleanValue(patch) };
  return withCase(state, band, caseId, { ...c, stages: { ...c.stages, [stage]: merged } });
}

export function setSupport(state, band, caseId, level) {
  if (!validTarget(band, caseId) || !SUPPORT_LEVELS.includes(level)) return state;
  return withCase(state, band, caseId, { ...caseState(state, band, caseId), support: level });
}

/** Record that a help item was opened on a stage; supported work is never relabelled independent. */
export function noteHelp(state, band, caseId, stage, helpId) {
  if (
    !validTarget(band, caseId) ||
    !WORK_STAGES.includes(stage) ||
    !/^[\w-]{1,40}$/.test(String(helpId))
  )
    return state;
  const c = caseState(state, band, caseId);
  return withCase(state, band, caseId, {
    ...c,
    helpUsed: [...new Set([...c.helpUsed, `${stage}:${helpId}`])],
  });
}

const helpOpened = (cs, stage) =>
  Array.isArray(cs?.helpUsed) &&
  cs.helpUsed.some((h) => typeof h === "string" && h.startsWith(`${stage}:`));

/** "supported" if any help was opened on the stage; the transfer attempt is otherwise independent; else by support level. */
export function workKind(cs, stage) {
  if (helpOpened(cs, stage)) return "supported";
  if (stage === TRANSFER_STAGE) return "independent";
  return cs?.support === "C" ? "independent" : "supported";
}

/** "new" | "started" | "done" from saved work; a stage is done when its patch carried `done: true`. */
export function stageStatus(cs, stage) {
  const s = cs?.stages?.[stage];
  if (!isPlain(s)) return "new";
  if (s.done === true) return "done";
  return Object.keys(s).length ? "started" : "new";
}

export function progress(cs) {
  const steps = STAGES.map((stage) => ({ stage, status: stageStatus(cs, stage) }));
  const done = steps.filter((s) => s.status === "done").length;
  return {
    steps,
    done,
    next: steps.find((s) => s.status !== "done")?.stage || null,
    transfer: stageStatus(cs, TRANSFER_STAGE),
  };
}

/** The case a check runs against: the transfer attempt has its own variables and data. */
export const caseFor = (caseDef, stage) =>
  stage === TRANSFER_STAGE && caseDef?.transfer ? caseDef.transfer : caseDef;

/** Questions for the reflect stage, chosen from what the learner actually did. Never about right or wrong. */
export function reflectionPrompts(cs) {
  const stages = isPlain(cs?.stages) ? cs.stages : {};
  const has = (s) => isPlain(stages[s]) && Object.keys(stages[s]).length > 0;
  const out = [
    {
      id: "hard",
      text: {
        en: "Which part of the investigation was hardest to put into words? What helped you?",
        es: "¿Qué parte de la investigación fue más difícil de poner en palabras? ¿Qué te ayudó?",
      },
    },
  ];
  if (Array.isArray(cs?.helpUsed) && cs.helpUsed.length)
    out.push({
      id: "help",
      text: {
        en: "You opened some help. Which help changed what you wrote, and what would you try without it?",
        es: "Abriste algo de ayuda. ¿Qué ayuda cambió lo que escribiste, y qué intentarías sin ella?",
      },
    });
  if (has("revise"))
    out.push({
      id: "revise",
      text: {
        en: "What did you change when you revised, and which question made you change it?",
        es: "¿Qué cambiaste al revisar, y qué pregunta te hizo cambiarlo?",
      },
    });
  if (has(TRANSFER_STAGE))
    out.push({
      id: "transfer",
      text: {
        en: "How was the new situation different from the first one? What did you do the same way?",
        es: "¿En qué fue diferente la situación nueva de la primera? ¿Qué hiciste de la misma manera?",
      },
    });
  out.push({
    id: "next",
    text: {
      en: "What question would you test next if you could?",
      es: "¿Qué pregunta probarías después si pudieras?",
    },
  });
  return out;
}

// ── ledger ───────────────────────────────────────────────────────────────────

/** guided = support A with no help opened; independent and supported follow workKind. */
function ledgerStage(cs, stage) {
  if (workKind(cs, stage) === "independent") return "independent";
  return cs?.support === "A" && !helpOpened(cs, stage) && stage !== TRANSFER_STAGE
    ? "guided"
    : "supported";
}

/**
 * Partial entries for appendEntry (src "science-lab"). ctx = { band, caseId, text, caseState, attempt?, kind? }.
 * `text` is read only to compute numbers; the entry holds ids and numbers, never the learner's words.
 */
export function toLedgerEntries(stage, result, ctx = {}) {
  if (!WORK_STAGES.includes(stage)) return [];
  const text = clean(ctx.text);
  if (blank(text)) return [];
  const cs = isPlain(ctx.caseState) ? ctx.caseState : {};
  const meta = stage === TRANSFER_STAGE ? { domain: "Writing", klu: "Argue" } : STAGE_META[stage];
  const caseDef = findCase(ctx.band, ctx.caseId);
  const supportStage = ledgerStage(cs, stage);
  const a = analyzeResponse(text, {
    keyUse: meta.klu,
    modality: meta.domain === "Speaking" ? "speaking" : "writing",
    stage: supportStage,
    sourceText: [caseDef?.phenomenon?.en, caseDef?.dataset?.setup?.en].filter(Boolean),
    sourceTerms: (caseDef?.vocab || []).map((v) => v.term.en),
  });
  const m = Object.fromEntries(Object.entries(a.ledger).filter(([, v]) => v !== null));
  const kind =
    ctx.kind || (stage === "revise" ? "revision" : stage === TRANSFER_STAGE ? "transfer" : "first");
  return [
    {
      src: "science-lab",
      task: `${ctx.caseId}/${stage}`,
      band: ctx.band,
      domain: meta.domain,
      use: meta.klu,
      stage: supportStage,
      kind,
      attempt: typeof ctx.attempt === "string" ? ctx.attempt : "",
      supports: { hint: helpOpened(cs, stage) },
      m: {
        ...m,
        ok: result?.ok ? 1 : 0,
        flags: Array.isArray(result?.notes) ? result.notes.length : 0,
        tool: "science-lab",
        stageId: stage,
      },
    },
  ];
}
