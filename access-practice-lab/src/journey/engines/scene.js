// Living Language World engine (the `scene` engine behind the DISCOVER step). Pure functions: no DOM, no storage.
// The UI (ui/scene.js) keeps this state in env.data; tools/access-journey-scene.test.mjs drives it directly.
//
// State: { examined: [objectId, ...] (in examine order), controls: { controlId: optionId },
//          changes: ["controlId=optionId", ...] (distinct), exchange: null | { text, reply, variablesNamed },
//          followup: null | { text } }
//
// Nothing here is a score. The partner recognises ANY cause listed in task.variables, asks the evidence
// question for THAT cause, and never states what an observation says or which cause is right.
import { analyzeResponse } from "../../lang/analyze.js";
import { isStop, stem, wordCount } from "../../lang/text.js";

const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
};
const SUFFIXES = new Set(["s", "es", "ed", "d", "ing", "y", "ly", "er", "ers"]);
const MIN_SEND_WORDS = 3;

// ── tokens ────────────────────────────────────────────────────────────────────────────────────────
// Own tokenizer: 2.5 and 1,200 stay one token, and number words ("seven") normalise to digits ("7")
// so "seven hours" and "7 hours" are the same evidence.
function toks(text) {
  const out = [];
  const re = /\d[\d,]*(?:\.\d+)?|\p{L}+(?:['’-]\p{L}+)*/gu;
  for (const m of String(text || "").matchAll(re)) {
    const lower = m[0].toLowerCase().replace(/’/g, "'");
    const digits = /^\d/.test(lower);
    const word = !digits && Object.hasOwn(NUMBER_WORDS, lower);
    out.push({
      text: m[0],
      lower,
      norm: digits ? lower.replace(/,/g, "") : word ? String(NUMBER_WORDS[lower]) : lower,
      isNum: digits || word,
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return out;
}

/** Does the learner's word match a data word? shade ~ shaded ~ shading ~ shades; never substring guesses. */
function sameWord(word, term) {
  if (word === term) return true;
  const s = stem(word);
  if (s === stem(term) || s === term.replace(/e$/, "")) return true;
  const [a, b] = word.length >= term.length ? [word, term] : [term, word];
  return b.length >= 3 && a.startsWith(b) && SUFFIXES.has(a.slice(b.length));
}

const tokEq = (a, b) => (a.isNum || b.isNum ? a.norm === b.norm : sameWord(a.lower, b.lower));
const spanOf = (text, a, b) => ({ start: a.start, end: b.end, text: text.slice(a.start, b.end) });

/** Every place a (possibly multi-word) data phrase occurs in the learner's tokens. */
function phraseSpans(text, tokens, phrase) {
  const want = toks(phrase);
  if (!want.length) return [];
  const out = [];
  for (let i = 0; i + want.length <= tokens.length; i++)
    if (want.every((w, k) => tokEq(tokens[i + k], w)))
      out.push(spanOf(text, tokens[i], tokens[i + want.length - 1]));
  return out;
}

const overlaps = (a, b) => a.start < b.end && b.start < a.end;

// ── state ─────────────────────────────────────────────────────────────────────────────────────────
export function init(task) {
  return {
    examined: [],
    controls: Object.fromEntries(
      (task.controls || []).map((c) => [c.id, c.initial ?? c.options?.[0]?.id]),
    ),
    changes: [],
    exchange: null,
    followup: null,
  };
}

/** Records one observation in the notebook, in examine order. Unknown ids are ignored when `task` is given. */
export function examine(state, id, task) {
  if (!id || state.examined.includes(id)) return state;
  if (task && !(task.objects || []).some((o) => o.id === id)) return state;
  return { ...state, examined: [...state.examined, id] };
}

/** Sets one control. Moving to the value it already has changes nothing. */
export function setControl(state, controlId, optionId, task) {
  if (state.controls[controlId] === optionId) return state;
  if (task) {
    const control = (task.controls || []).find((c) => c.id === controlId);
    if (!control?.options.some((o) => o.id === optionId)) return state;
  }
  const key = `${controlId}=${optionId}`;
  return {
    ...state,
    controls: { ...state.controls, [controlId]: optionId },
    changes: state.changes.includes(key) ? state.changes : [...state.changes, key],
  };
}

export const manipulations = (state) => state.changes.length;

/** The notebook: examined objects in examine order. */
export function notebook(task, state) {
  return state.examined
    .map((id) => (task.objects || []).find((o) => o.id === id))
    .filter(Boolean)
    .map(({ id, label, glyph, note }) => ({ id, label, glyph, note }));
}

export const NEUTRAL_OUTCOME = Object.freeze({
  key: "none",
  mood: "neutral",
  neutral: true,
  when: {},
  state: "Nothing has changed yet. Try a control to see what happens.",
});

/** Most specific outcome first; the first whose every `when` entry equals the current controls wins. */
export function currentOutcome(task, state) {
  const ranked = [...(task.outcomes || [])].sort(
    (a, b) => Object.keys(b.when || {}).length - Object.keys(a.when || {}).length,
  );
  return (
    ranked.find((o) => Object.entries(o.when || {}).every(([id, v]) => state.controls[id] === v)) ||
    NEUTRAL_OUTCOME
  );
}

export const collectMet = (task, state) => state.examined.length >= (task.collect || 0);
export const canExplain = (task, state) => collectMet(task, state) && manipulations(state) >= 1;

export function recordExchange(state, text, evaluation) {
  return {
    ...state,
    exchange: {
      text,
      reply: evaluation.reply,
      variablesNamed: evaluation.variablesNamed,
      hint: evaluation.hint,
    },
  };
}
export const recordFollowup = (state, text) => ({ ...state, followup: { text } });

export function doneCriteria(task, state) {
  const examined = state.examined.length;
  const collect = collectMet(task, state);
  const manipulated = manipulations(state) >= 1;
  const explained = Boolean(state.exchange?.text);
  const replied = Boolean(state.exchange?.reply?.text);
  return {
    examined,
    collect,
    manipulated,
    explained,
    replied,
    done: collect && manipulated && explained && replied,
  };
}

/** Smallest explanation worth sending; fewer words than respond.minWords only raises `needsMore`, never blocks. */
export const canSend = (text) => wordCount(text) >= MIN_SEND_WORDS;

// ── explanation ───────────────────────────────────────────────────────────────────────────────────
const labelTokens = (task) =>
  new Set((task.objects || []).flatMap((o) => toks(o.label).map((t) => stem(t.lower))));

/** Objects whose note speaks about a variable (its terms or evidence terms). Order = task order. */
export function supportObjects(task, variable) {
  const words = [...(variable.terms || []), ...(variable.evidenceTerms || [])];
  return (task.objects || []).filter((o) => {
    const noteToks = toks(o.note);
    return words.some((w) => {
      const want = toks(w);
      return (
        want.length &&
        noteToks.some((_, i) => want.every((x, k) => noteToks[i + k] && tokEq(noteToks[i + k], x)))
      );
    });
  });
}

/** Maximal runs of tokens the learner's text shares with a note: [{ i, j, len }]. */
function commonRuns(a, b) {
  const runs = [];
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) {
      if (!tokEq(a[i], b[j])) continue;
      if (i > 0 && j > 0 && tokEq(a[i - 1], b[j - 1])) continue; // not the start of the run
      let len = 1;
      while (i + len < a.length && j + len < b.length && tokEq(a[i + len], b[j + len])) len++;
      runs.push({ i, j, len });
    }
  return runs;
}

/** Evidence the learner copied from one examined note: a number with its unit, or a longer run around a data word. */
function copiedItems(text, tokens, object, variable, labels) {
  const noteToks = toks(object.note);
  const dataStems = new Set(
    [...(variable.terms || []), ...(variable.evidenceTerms || [])].flatMap((w) =>
      toks(w)
        .filter((t) => !t.isNum)
        .map((t) => stem(t.lower)),
    ),
  );
  const items = [];
  for (const { i, len } of commonRuns(tokens, noteToks)) {
    let from = i;
    let to = i + len - 1;
    while (from < to && !tokens[from].isNum && isStop(tokens[from].lower)) from++;
    while (to > from && !tokens[to].isNum && isStop(tokens[to].lower)) to--;
    const run = tokens.slice(from, to + 1);
    const content = run.filter((t) => !t.isNum && !isStop(t.lower));
    // a number named by an object label ("Bed 2") is a name, not a measurement
    const number = run.some(
      (t, k) => t.isNum && !labels.has(stem((tokens[from + k - 1] || {}).lower || "")),
    );
    const fromLabel = run.every((t) => t.isNum || labels.has(stem(t.lower)));
    const onData = run.some((t) => !t.isNum && dataStems.has(stem(t.lower)));
    const ok =
      (number && content.length >= 1 && !fromLabel && run.length >= 2) ||
      (run.length >= 3 && content.length >= 2 && (onData || number));
    if (ok) items.push({ kind: "copied", ...spanOf(text, run[0], run.at(-1)), from: object.id });
  }
  return items;
}

function variableReport(task, state, variable, text, tokens, labels) {
  const termHits = (variable.terms || []).flatMap((t) =>
    phraseSpans(text, tokens, t).map((s) => ({ ...s, term: t })),
  );
  const support = supportObjects(task, variable);
  const seen = support.filter((o) => state.examined.includes(o.id));
  const termItems = (variable.evidenceTerms || []).flatMap((t) =>
    phraseSpans(text, tokens, t).map((s) => ({ kind: "term", term: t, ...s })),
  );
  const copied = seen.flatMap((o) => copiedItems(text, tokens, o, variable, labels));
  // each place in the text counts once; a copied run absorbs the data terms inside it
  const items = [...copied];
  for (const it of termItems) if (!items.some((x) => overlaps(x, it))) items.push(it);
  items.sort((a, b) => a.start - b.start);
  const distinct = items.reduce(
    (list, it) => (list.some((x) => overlaps(x, it)) ? list : [...list, it]),
    [],
  );
  return {
    variable: variable.id,
    def: variable,
    named: termHits.length > 0,
    termHits,
    first: termHits.length ? Math.min(...termHits.map((h) => h.start)) : Infinity,
    support,
    supportSeen: seen,
    items: distinct,
    sufficient: distinct.some((it) => it.kind === "copied") || distinct.length >= 2,
  };
}

const withLabels = (task, items) =>
  items
    .slice(0, 2)
    .map((it) => {
      const o = it.from && (task.objects || []).find((x) => x.id === it.from);
      return `“${it.text}”${o ? ` from the ${o.label}` : ""}`;
    })
    .join(" and ");

/** The object whose note is richest in this variable's evidence terms (task order breaks ties). */
function bestToLookAt(report) {
  const score = (o) =>
    (report.def.evidenceTerms || []).filter(
      (w) => supportObjects({ objects: [o] }, { terms: [w] }).length,
    ).length;
  return (
    [...report.support]
      .filter((o) => o.relevant !== false)
      .sort((a, b) => score(b) - score(a))[0] || report.support[0]
  );
}

function pickReport(reports) {
  const named = reports.filter((r) => r.named);
  if (!named.length) return null;
  const rank = (r) => (r.supportSeen.length ? (r.sufficient ? 3 : 2) : 1);
  return named.sort(
    (a, b) => rank(b) - rank(a) || b.termHits.length - a.termHits.length || a.first - b.first,
  )[0];
}

/**
 * The partner's answer to the learner's explanation, chosen from what the learner actually wrote.
 * @returns {{ variablesNamed: string[], evidence: object[], examinedUseful: string[], words: number,
 *   reply: { speaker: string, text: string, tag: "no-cause"|"probe"|"ack"|"unexamined" },
 *   hint: null | { variable: string, text: string }, needsMore: boolean }}
 */
export function evaluateExplanation(task, text, state, { independent = false } = {}) {
  const src = String(text || "");
  const tokens = toks(src);
  const labels = labelTokens(task);
  const partner = task.partner || {};
  const reports = (task.variables || []).map((v) =>
    variableReport(task, state, v, src, tokens, labels),
  );
  const named = reports.filter((r) => r.named).sort((a, b) => a.first - b.first);
  const chosen = pickReport(reports);
  const words = wordCount(src);
  const say = (tag, line) => ({ speaker: partner.name || "", text: line, tag });

  let reply;
  let hint = null;
  if (!chosen) {
    reply = say("no-cause", partner.noCause || "");
  } else if (!chosen.supportSeen.length) {
    const target = bestToLookAt(chosen);
    reply = say(
      "unexamined",
      target
        ? `You are thinking about ${chosen.def.label}. Have you looked at the ${target.label} yet? Tap it in the scene, then tell me what it shows about ${chosen.def.label}.`
        : chosen.def.probe || partner.noEvidence || "",
    );
  } else if (!chosen.sufficient) {
    reply = say("probe", chosen.def.probe || partner.noEvidence || "");
    if (!independent && chosen.def.good)
      hint = { variable: chosen.variable, text: chosen.def.good };
  } else {
    const used = chosen.items;
    reply = say(
      "ack",
      `You backed up your idea about ${chosen.def.label} with ${withLabels(task, used)}. ${partner.thanks || ""}`.trim(),
    );
  }

  const examinedUseful = [...new Set(named.flatMap((r) => r.supportSeen.map((o) => o.id)))];
  return {
    variablesNamed: named.map((r) => r.variable),
    evidence: named.map((r) => ({
      variable: r.variable,
      terms: [...new Set(r.items.map((it) => it.term || it.text))],
      quotes: r.items.map(({ start, end, text: t }) => ({ start, end, text: t })),
      from: [...new Set(r.items.map((it) => it.from).filter(Boolean))],
      sufficient: r.sufficient,
    })),
    examinedUseful,
    words,
    reply,
    hint,
    needsMore: words < (task.respond?.minWords || 0),
  };
}

// ── ledger ────────────────────────────────────────────────────────────────────────────────────────
/** Whole-response analysis for the ledger and the feedback strip (source = what the learner examined). */
export function analysis(
  task,
  text,
  keyUse = "Explain",
  band = "6-8",
  stage = "supported",
  state = null,
) {
  const notes = state
    ? notebook(task, state).map((o) => o.note)
    : (task.objects || []).filter((o) => o.relevant).map((o) => o.note);
  const minWords = task.respond?.minWords || 12;
  return analyzeResponse(text, {
    keyUse,
    modality: "writing",
    stage,
    band,
    sourceText: notes,
    sourceTerms: [...new Set((task.variables || []).flatMap((v) => v.terms || []))],
    expected: { minWords, maxWords: minWords * 3 },
  });
}

const HELP_TO_SUPPORT = { frames: ["frames"], vocab: ["bank", "l1"], hint: ["hint"] };

/** Partial entry for appendEntry. Stage is independent only when no help was opened. */
export function ledgerEntry({
  task,
  text,
  missionId,
  band,
  keyUse = "Explain",
  domain = "Writing",
  help = [],
  kind = "first",
  state = null,
}) {
  const supports = {};
  for (const id of help) for (const key of HELP_TO_SUPPORT[id] || []) supports[key] = true;
  const stage = help.length ? "supported" : "independent";
  return {
    src: "mission",
    task: `${missionId}.discover`,
    band,
    domain,
    use: keyUse,
    stage,
    kind,
    supports,
    m: analysis(task, text, keyUse, band, stage, state).ledger,
  };
}
