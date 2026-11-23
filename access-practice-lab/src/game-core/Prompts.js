// Prompts.js — the canonical academic prompt and the adapter from the existing content bank.
//
// The prompt engine is independent of any game theme: Tower Defense, Syntax Odyssey and Arena Blitz all
// ask the same prompt object and read the same evaluation. Prompts come from two places only:
//   1. the lab's activity bank (content/g3-5|g6-8/<Domain>.json), normalized here, source ids preserved;
//   2. original authored sets (content/arcade/prompts-<band>.json) that already use this canonical shape.
// Nothing is invented to fill a game: a source activity that cannot be rendered, answered, evaluated and
// scaffolded is dropped by validatePrompt() and counted in the pool report.
import { groupOfLevel, levelProfile, clampLevel } from "./WidaLevels.js";

export const FORMATS = Object.freeze(["choice", "multi", "order", "construct"]);
export const DOMAIN_LIST = Object.freeze(["Listening", "Reading", "Speaking", "Writing"]);
export const SOURCE_VERSION = 1;
export const SLOW_RATE = 0.85;

const str = (v) => (typeof v === "string" ? v.trim() : "");
const words = (t) => str(t).split(/\s+/).filter(Boolean).length;
const slug = (t) =>
  str(t)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

/** Broad skill families the adaptive engine groups by (a miss in one is practiced again later in the same family). */
export function skillFamily(text, domain = "") {
  const t = str(text).toLowerCase();
  if (/context|clue/.test(t)) return "context-clues";
  if (/main idea|central|summar/.test(t)) return "main-idea";
  if (/infer|conclu|predict/.test(t)) return "inference";
  if (/evidence|support|detail|cite/.test(t)) return "text-evidence";
  if (/sequenc|order|first|next|step|direction|process/.test(t)) return "sequencing";
  if (/prefix|suffix|root|cognate|morpholog|word part|word famil/.test(t)) return "word-parts";
  if (/vocab|word|meaning|term|definition/.test(t)) return "vocabulary";
  if (/transition|connect|cohes|conjunct|because|however/.test(t)) return "connectives";
  if (/agree|tense|verb|grammar|punctuat|clause|sentence|syntax|pronoun/.test(t)) return "syntax";
  if (/compare|contrast|opinion|persuad|argu|claim/.test(t)) return "argument";
  return (
    {
      Listening: "listening-comprehension",
      Reading: "reading-comprehension",
      Speaking: "oral-explanation",
      Writing: "written-explanation",
    }[domain] || "language-use"
  );
}

// ── difficulty: a heuristic over the item itself, never over a learner ────────────────────────
function difficultyOf(a, level, format) {
  const base = { A: 1.4, B: 2.6, C: 3.8 }[level] || 2.5;
  const passage = Array.isArray(a.passage) ? a.passage.join(" ") : str(a.script || "");
  let d = base;
  const w = words(passage);
  d += w > 130 ? 0.7 : w > 70 ? 0.35 : 0;
  const opts = (a.options || []).map((o) => words(o.text));
  if (opts.length && opts.reduce((x, y) => x + y, 0) / opts.length > 9) d += 0.3;
  if (format === "order" || format === "multi") d += 0.4;
  if (format === "construct") d += 0.3;
  return Math.min(5, Math.max(1, Math.round(d)));
}

/** The one practice level (1-6) an item is aimed at: its support group, split by its own difficulty. */
function levelFor(level, difficulty) {
  const [lo, hi] = { A: [1, 2], B: [3, 4], C: [5, 6] }[level] || [3, 4];
  const cut = { A: 1.6, B: 2.8, C: 4 }[level] || 2.8;
  return difficulty <= cut ? lo : hi;
}

const gloss = (vocab, hideTexts) =>
  (Array.isArray(vocab) ? vocab : [])
    .filter((v) => Array.isArray(v) && str(v[0]))
    .map(([term, def, es]) => ({ term: str(term), def: str(def), es: str(es) }))
    // A gloss may clarify the task but must never print the answer: drop a term that IS the correct text.
    .filter((g) => !hideTexts.some((x) => x && g.term.toLowerCase() === x.toLowerCase()));

function scaffoldsFor(a, format, hideTexts) {
  const out = [];
  if (str(a.hint)) out.push({ kind: "hint", text: str(a.hint) });
  const frames = (a.frames || []).filter((f) => str(f));
  const g = gloss(a.vocabulary, hideTexts);
  if (frames.length || g.length)
    out.push({ kind: "language", frame: frames[0] || "", gloss: g.slice(0, 4) });
  if (format === "choice" || format === "multi") out.push({ kind: "eliminate" });
  else if (format === "order") out.push({ kind: "anchor" });
  return out;
}

function baseOf(a, { band, domain, level, index = 0, suffix = "" }) {
  const sourceId = str(a.id);
  const skill = str(a.skill) || str(a.title);
  return {
    id: `${sourceId}${suffix}`,
    sourceId,
    sourceVersion: SOURCE_VERSION,
    gradeBand: band,
    domain,
    languageObjective: skill,
    // Grades 6-8 items may name the grades they are written for (a grade focus prefers them; none = every grade).
    grades: Array.isArray(a.grades) ? a.grades.map(String) : [],
    instructions: str(a.directions),
    rationale: str(a.correct) || str(a.explanation),
    distractorFeedback: {},
    audioSettings: { speak: "", slowRate: SLOW_RATE, replays: Infinity },
    estimatedDuration: 45 + index * 0,
    accessibilityMetadata: {
      keyboard: true,
      screenReaderText: "",
      picture: str(a.picture?.alt || a.picture?.src ? a.picture.alt || "" : ""),
    },
    analyticsMetadata: {
      skillFamily: skillFamily(`${skill} ${a.title || ""} ${(a.wida || []).join(" ")}`, domain),
      skillTag: slug(skill),
      wida: (a.wida || []).map(str).filter(Boolean),
      activityType: a.type,
      supportMode: level,
      source: "bank",
    },
    scaffoldLevels: [],
    es: { directions: "", gloss: [] },
  };
}

function stimulusOf(a, domain) {
  const paragraphs = Array.isArray(a.passage) ? a.passage.map(str).filter(Boolean) : [];
  const s = { title: str(a.passageTitle), paragraphs, text: "", audio: "", picture: null };
  if (domain === "Listening" && str(a.script)) s.audio = str(a.script);
  else if (str(a.script)) s.text = str(a.script);
  if (a.picture && (a.picture.src || a.picture.alt))
    s.picture = { src: str(a.picture.src), alt: str(a.picture.alt) };
  return s;
}

function finish(p, a, domain, level, format, hideTexts) {
  p.format = format;
  p.difficulty = difficultyOf(a, level, format);
  p.proficiencyLevel = levelFor(level, p.difficulty);
  p.languageMode = domain === "Speaking" || domain === "Writing" ? "productive" : "receptive";
  p.scaffoldLevels = scaffoldsFor(a, format, hideTexts);
  if (p.stimulus?.audio) p.audioSettings = { ...p.audioSettings, speak: p.stimulus.audio };
  p.estimatedDuration =
    format === "construct"
      ? 120
      : format === "order"
        ? 70
        : Math.min(120, 30 + Math.round(words(JSON.stringify(p.stimulus)) / 3));
  p.accessibilityMetadata.screenReaderText = [p.instructions, p.promptText, p.stimulus?.title]
    .filter(Boolean)
    .join(". ");
  return p;
}

const optionList = (opts) =>
  Array.isArray(opts)
    ? opts
        .map((o) => ({ id: str(String(o.id)), text: str(o.text), visual: o.visual || null }))
        .filter((o) => o.id && o.text)
    : [];

/** Normalize one bank activity into zero or more canonical prompts. */
export function normalizeActivity(a, { band, domain, level, esGuide = {} } = {}) {
  if (!a || typeof a !== "object" || !str(a.id)) return [];
  const out = [];
  const es = { directions: str(esGuide[a.id]?.directions) };
  if (a.type === "multipleChoice" || a.type === "multiSelect") {
    const options = optionList(a.options);
    const multi = a.type === "multiSelect";
    const correct = multi ? (a.answers || []).map(String) : [String(a.answer)];
    const hide = options.filter((o) => correct.includes(o.id)).map((o) => o.text);
    const p = baseOf(a, { band, domain, level });
    p.promptText = str(a.prompt);
    p.stimulus = stimulusOf(a, domain);
    p.answerOptions = options;
    p.correctAnswer = multi ? correct : correct[0];
    for (const o of options)
      if (!correct.includes(o.id) && a.distractorFeedback?.[o.id])
        p.distractorFeedback[o.id] = str(a.distractorFeedback[o.id]);
    p.es = { directions: es.directions, gloss: [] };
    out.push(finish(p, a, domain, level, multi ? "multi" : "choice", hide));
  } else if (a.type === "hotText") {
    const options = optionList(a.sentences);
    const correct = (a.answers || []).map(String);
    const p = baseOf(a, { band, domain, level });
    p.promptText = str(a.prompt);
    p.stimulus = { ...stimulusOf(a, domain), paragraphs: [] };
    p.answerOptions = options;
    p.correctAnswer = correct.length === 1 ? correct[0] : correct;
    p.es = { directions: es.directions, gloss: [] };
    out.push(
      finish(
        p,
        a,
        domain,
        level,
        correct.length > 1 ? "multi" : "choice",
        options.filter((o) => correct.includes(o.id)).map((o) => o.text),
      ),
    );
  } else if (a.type === "order") {
    const options = optionList(a.items);
    const correct = (a.answer || a.answers || []).map(String);
    if (correct.length < 2) return [];
    const p = baseOf(a, { band, domain, level });
    p.promptText = str(a.prompt);
    p.stimulus = stimulusOf(a, domain);
    p.answerOptions = options;
    p.correctAnswer = correct;
    p.es = { directions: es.directions, gloss: [] };
    out.push(finish(p, a, domain, level, "order", []));
  } else if (a.type === "cloze") {
    const segs = Array.isArray(a.segments) ? a.segments : [];
    const blanks = segs.map((s, i) => ({ s, i })).filter((x) => x.s.blank);
    blanks.forEach(({ s, i }, k) => {
      const b = s.blank;
      const opts = (b.options || []).map(str).filter(Boolean);
      if (!opts.length || !str(b.answer) || !opts.includes(str(b.answer))) return;
      const text = segs
        .map((x, j) => (x.blank ? (j === i ? "_____" : x.blank.answer) : x.text))
        .join("");
      const p = baseOf(a, { band, domain, level, suffix: `#${b.id || k + 1}` });
      p.promptText = str(a.prompt);
      p.stimulus = { ...stimulusOf(a, domain), title: "", paragraphs: [text.trim()] };
      p.answerOptions = opts.map((t, n) => ({ id: String(n), text: t }));
      p.correctAnswer = String(opts.indexOf(str(b.answer)));
      p.es = { directions: es.directions, gloss: [] };
      out.push(finish(p, a, domain, level, "choice", [str(b.answer)]));
    });
  } else if (a.type === "constructed" && (domain === "Speaking" || domain === "Writing")) {
    const criteria = (a.successCriteria || []).map(str).filter(Boolean);
    const targets = (a.vocabulary || []).map((v) => str(v?.[0])).filter(Boolean);
    const p = baseOf(a, { band, domain, level });
    p.promptText = str(a.prompt);
    p.stimulus = stimulusOf(a, domain);
    p.answerOptions = [];
    p.correctAnswer = null;
    p.evaluationRule = {
      kind: "self-check",
      minWords: { A: 4, B: 9, C: 16 }[level] || 6,
      targets,
      criteria: criteria.length
        ? criteria
        : ["I answered the question.", "I used a complete sentence."],
      model: str(a.models?.[level] || ""),
    };
    p.es = { directions: es.directions, gloss: [] };
    out.push(finish(p, a, domain, level, "construct", []));
  }
  return out;
}

/** Fill any missing canonical fields on an authored prompt (content/arcade/prompts-<band>.json). */
export function fromCanonical(raw, { band } = {}) {
  const p = { ...raw };
  p.sourceId ||= p.id;
  p.sourceVersion ||= SOURCE_VERSION;
  p.gradeBand ||= band;
  p.grades = Array.isArray(p.grades) ? p.grades.map(String) : [];
  p.stimulus = {
    title: "",
    paragraphs: [],
    text: "",
    audio: "",
    picture: null,
    ...(p.stimulus || {}),
  };
  p.answerOptions = optionList(p.answerOptions);
  p.distractorFeedback ||= {};
  p.scaffoldLevels ||= [];
  p.audioSettings = {
    speak: p.stimulus.audio || "",
    slowRate: SLOW_RATE,
    replays: Infinity,
    ...(p.audioSettings || {}),
  };
  p.accessibilityMetadata = {
    keyboard: true,
    screenReaderText: "",
    ...(p.accessibilityMetadata || {}),
  };
  p.analyticsMetadata = {
    skillFamily: skillFamily(p.languageObjective, p.domain),
    skillTag: slug(p.languageObjective),
    wida: [],
    source: "authored",
    ...(p.analyticsMetadata || {}),
  };
  p.es ||= { directions: "", gloss: [] };
  p.estimatedDuration ||= 45;
  p.languageMode ||= p.domain === "Speaking" || p.domain === "Writing" ? "productive" : "receptive";
  return p;
}

/** Problems that stop a prompt from being rendered, answered, evaluated, scaffolded or reported. Empty = valid. */
export function validatePrompt(p) {
  const bad = [];
  if (!p || typeof p !== "object") return ["not an object"];
  for (const k of ["id", "sourceId", "gradeBand", "domain", "languageObjective", "promptText"])
    if (!str(p[k])) bad.push(`missing ${k}`);
  if (!FORMATS.includes(p.format)) bad.push(`bad format ${p.format}`);
  if (!DOMAIN_LIST.includes(p.domain)) bad.push(`bad domain ${p.domain}`);
  if (!BANDS.includes(p.gradeBand)) bad.push(`bad band ${p.gradeBand}`);
  if (!(p.difficulty >= 1 && p.difficulty <= 5)) bad.push("difficulty out of range");
  if (!(p.proficiencyLevel >= 1 && p.proficiencyLevel <= 6))
    bad.push("proficiencyLevel out of range");
  if (!str(p.rationale)) bad.push("missing rationale");
  const ids = (p.answerOptions || []).map((o) => o.id);
  if (new Set(ids).size !== ids.length) bad.push("duplicate option ids");
  if (p.format === "choice") {
    if (ids.length < 2) bad.push("choice needs 2+ options");
    if (!ids.includes(String(p.correctAnswer))) bad.push("correct answer not among options");
  } else if (p.format === "multi") {
    const c = Array.isArray(p.correctAnswer) ? p.correctAnswer : [];
    if (ids.length < 3) bad.push("multi needs 3+ options");
    if (c.length < 2 || !c.every((x) => ids.includes(String(x)))) bad.push("multi answers invalid");
  } else if (p.format === "order") {
    const c = Array.isArray(p.correctAnswer) ? p.correctAnswer : [];
    if (
      c.length < 2 ||
      c.length !== ids.length ||
      !c.every((x) => ids.includes(String(x))) ||
      new Set(c).size !== c.length
    )
      bad.push("order answer must list every item once");
  } else if (p.format === "construct") {
    if (
      !p.evaluationRule ||
      !(p.evaluationRule.minWords >= 1) ||
      !(p.evaluationRule.criteria || []).length
    )
      bad.push("construct needs an evaluation rule with criteria");
  }
  if (p.domain === "Listening" && !str(p.stimulus?.audio))
    bad.push("listening prompt has no audio text");
  if (!Array.isArray(p.scaffoldLevels)) bad.push("scaffoldLevels not an array");
  return bad;
}

// ── evaluation ──────────────────────────────────────────────────────────────────────────────
const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

/**
 * Evaluate a response. choice: option id. multi: array of ids. order: array of ids in the chosen order.
 * construct: { text, checks: [bool per criterion] }.
 * Returns { correct, partial (0..1), misconception } where misconception names the distractor chosen.
 */
export function evaluate(p, response) {
  if (p.format === "choice") {
    const picked = String(response ?? "");
    const correct = picked === String(p.correctAnswer);
    const note = !correct && p.distractorFeedback?.[picked] ? p.distractorFeedback[picked] : "";
    return {
      correct,
      partial: correct ? 1 : 0,
      misconception: note ? { optionId: picked, note } : null,
      picked: [picked],
    };
  }
  if (p.format === "multi") {
    const picked = (Array.isArray(response) ? response : []).map(String);
    const want = p.correctAnswer.map(String);
    const hit = picked.filter((x) => want.includes(x)).length;
    const wrong = picked.filter((x) => !want.includes(x));
    const correct = sameSet(picked, want);
    const note =
      !correct && wrong.length && p.distractorFeedback?.[wrong[0]]
        ? p.distractorFeedback[wrong[0]]
        : "";
    return {
      correct,
      partial: Math.max(0, (hit - wrong.length) / want.length),
      misconception: note ? { optionId: wrong[0], note } : null,
      picked,
    };
  }
  if (p.format === "order") {
    const picked = (Array.isArray(response) ? response : []).map(String);
    const want = p.correctAnswer.map(String);
    const right = picked.filter((x, i) => x === want[i]).length;
    return {
      correct: picked.length === want.length && right === want.length,
      partial: right / want.length,
      misconception: null,
      picked,
    };
  }
  if (p.format === "construct") {
    const text = str(response?.text);
    const r = p.evaluationRule;
    const long = words(text) >= r.minWords;
    const checks = Array.isArray(response?.checks) ? response.checks : [];
    const checked = r.criteria.every((_, i) => checks[i] === true);
    const usesTarget =
      !r.targets.length ||
      r.targets.some((t) =>
        new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(text),
      );
    const correct = long && checked && usesTarget && /[.!?]$/.test(text);
    return {
      correct,
      partial: [long, checked, usesTarget].filter(Boolean).length / 3,
      misconception: null,
      picked: [text],
      shortfall: { long, checked, usesTarget },
    };
  }
  return { correct: false, partial: 0, misconception: null, picked: [] };
}

/**
 * Option ids to hide for the Context Decoder / eliminate scaffold: up to two wrong options, keeping the
 * correct answer plus at least one distractor, so the item is easier but still a real choice.
 */
export function eliminable(p, random = Math.random) {
  if (p.format !== "choice" && p.format !== "multi") return [];
  const correct = new Set([].concat(p.correctAnswer).map(String));
  const wrong = p.answerOptions.filter((o) => !correct.has(o.id)).map((o) => o.id);
  const keep = 1;
  const n = Math.min(2, Math.max(0, wrong.length - keep));
  const pool = [...wrong];
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
}

/** What one scaffold layer shows. It clarifies the task or the language; it never states the answer. */
export function scaffoldView(p, layer, { spanish = false } = {}) {
  const s = p.scaffoldLevels[layer];
  if (!s) return null;
  if (s.kind === "hint") return { kind: "hint", text: s.text };
  if (s.kind === "language")
    return {
      kind: "language",
      frame: s.frame,
      gloss: s.gloss.map((g) => ({ term: g.term, def: g.def, es: spanish ? g.es : "" })),
    };
  if (s.kind === "anchor") return { kind: "anchor", text: p.format === "order" ? "first" : "" };
  return { kind: s.kind };
}

/** The clue the Context Decoder upgrade gives. Tied to the prompt: its own hint, then its first language support. */
export function decoderClue(p) {
  const hint = p.scaffoldLevels.find((s) => s.kind === "hint");
  const lang = p.scaffoldLevels.find((s) => s.kind === "language");
  return {
    text: hint?.text || "",
    frame: lang?.frame || "",
    gloss: (lang?.gloss || []).slice(0, 2),
  };
}

/** How many scaffold layers this practice level may open (the rest stay closed, so help fades as level rises). */
export const layersFor = (p, level) =>
  Math.min(p.scaffoldLevels.length, levelProfile(level).hintLayers);

// ── the pool ────────────────────────────────────────────────────────────────────────────────
export const BANDS = Object.freeze(["K", "1", "2-3", "3-5", "6-8"]);
const BAND_DIR = { K: "gK", 1: "g1", "2-3": "g2-3", "3-5": "g3-5", "6-8": "g6-8" };
const poolCache = new Map();

async function defaultFetchJson(path) {
  const r = await fetch(`/access-practice-lab/content/${path}`, { cache: "no-cache" });
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

/**
 * Load, normalize and validate every prompt for a band. `fetchJson(path)` resolves a path under content/ (the
 * browser fetch by default; tests pass a file reader). Result: { prompts, report: { sources, dropped } }.
 */
export async function loadPromptPool({ band, fetchJson = defaultFetchJson, cache = true } = {}) {
  if (cache && poolCache.has(band)) return poolCache.get(band);
  const job = (async () => {
    const dir = BAND_DIR[band];
    if (!dir) throw new Error(`unknown band ${band}`);
    const esGuide = await fetchJson("es-guide.json")
      .then((d) => d.activities || {})
      .catch(() => ({}));
    const prompts = [];
    const dropped = [];
    for (const domain of DOMAIN_LIST) {
      const doc = await fetchJson(`${dir}/${domain}.json`).catch(() => null);
      if (!doc?.levels) continue;
      for (const [level, L] of Object.entries(doc.levels)) {
        for (const a of L.activities || []) {
          for (const p of normalizeActivity(a, { band, domain, level, esGuide })) {
            const bad = validatePrompt(p);
            if (bad.length) dropped.push({ id: p.id, bad });
            else prompts.push(p);
          }
        }
      }
    }
    const authored = await fetchJson(`arcade/prompts-${band}.json`).catch(() => null);
    for (const raw of authored?.prompts || []) {
      const p = fromCanonical(raw, { band });
      const bad = validatePrompt(p);
      if (bad.length) dropped.push({ id: p.id, bad });
      else prompts.push(p);
    }
    const seen = new Set();
    const unique = prompts.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
    return {
      prompts: unique,
      report: { band, total: unique.length, dropped, authored: authored?.prompts?.length || 0 },
    };
  })();
  if (cache) {
    poolCache.set(band, job);
    job.catch(() => poolCache.delete(band));
  }
  return job;
}

/** Prompts a practice level may use: its support group's items, optionally within one level of the target. */
export function forLevel(prompts, level, { domains, formats } = {}) {
  const g = groupOfLevel(clampLevel(level));
  return prompts.filter(
    (p) =>
      groupOfLevel(p.proficiencyLevel).id === g.id &&
      (!domains || domains.includes(p.domain)) &&
      (!formats || formats.includes(p.format)),
  );
}
