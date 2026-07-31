/* =============================================================================
 * forge-validate.js — the Forge's quality gate, extracted so it can be shared.
 * -----------------------------------------------------------------------------
 * Lives in functions/_lib/ (underscore-prefixed directories are never routed by
 * Cloudflare Pages — same convention as functions/_lib/google.js) so both the
 * Pages Function and tools/validate-forge.mjs import ONE implementation. A
 * second copy would drift, and the whole point of this gate is that a forged
 * lesson cannot exist unless it passes exactly these rules.
 *
 * What it enforces, and why each rule earns its place:
 *   - distractor feedback must NAME the student's specific error, never restate
 *     the answer and never be vague ("Try again" teaches nothing);
 *   - hints must scaffold without containing the correct choice;
 *   - Notice & Wonder must not leak a vocabulary term (it is a curiosity hook,
 *     not a definition);
 *   - Spanish fields must be real Spanish, not the English string copied over;
 *   - when a misconception tag is requested, enough practice items must actually
 *     carry it, or the "fix" does not target the thing it was built for.
 * ========================================================================== */

const PRACTICE_COUNT = 6;
const EXPLORE_TYPES = new Set([
  "drag-sort",
  "multiple-choice",
  "open-response",
  "error-analysis",
  "fill-table",
  "matching",
]);

// Vague distractor feedback the gate rejects outright — feedback must NAME the
// error the student made, not shrug at it.
const VAGUE_FEEDBACK_RE = /^(try again|not quite|incorrect|nope|wrong)/i;
// Phrases that hand over the answer regardless of what the choice text is.
const ANSWER_LEAK_RE = /\b(the answer is|the correct answer|answer:)/i;
const MIN_FEEDBACK_CHARS = 25;

export function isStr(v, min = 1) {
  return typeof v === "string" && v.trim().length >= min;
}

export function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Case-insensitive whole-term containment (falls back to substring when the
// term starts/ends with punctuation, where \b would never match).
export function containsTerm(haystack, term) {
  const t = String(term || "").trim();
  if (!t) return false;
  const lead = /^\w/.test(t) ? "\\b" : "";
  const tail = /\w$/.test(t) ? "\\b" : "";
  return new RegExp(lead + escapeRe(t) + tail, "i").test(String(haystack || ""));
}

export function collectStrings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}

/* ── The quality gate ──────────────────────────────────────────────────────── */

// Shared rules for any 4-choice item that carries choiceFeedback + hints:
// practice items and the exit ticket. Pushes human-readable errors onto `errs`.
function validateChoiceItem(item, where, errs) {
  const choices = item.choices;
  if (!Array.isArray(choices) || choices.length !== 4 || !choices.every((c) => isStr(c))) {
    errs.push(`${where}: choices must be an array of 4 non-empty strings`);
  }
  const idxKey = "correctIndex" in item ? "correctIndex" : "answer";
  const idx = item[idxKey];
  if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
    errs.push(`${where}: ${idxKey} must be an integer 0-3`);
    return;
  }
  if (!Array.isArray(choices) || choices.length !== 4) return;
  if (new Set(choices.map((c) => String(c).trim().toLowerCase())).size !== 4) {
    errs.push(`${where}: the 4 choices must be distinct`);
  }
  if (!isStr(item.stem, 10)) errs.push(`${where}: stem is missing or too short`);
  if (!isStr(item.explanation, 15)) errs.push(`${where}: explanation is missing or too short`);

  const correct = String(choices[idx] ?? "").trim();
  const stem = String(item.stem || "");
  // A short correct choice that already appears verbatim in the stem is a given
  // quantity, not a giveaway, so leak-checking it would only produce noise.
  const leakable = correct.length >= 2 && !containsTerm(stem, correct);
  const leaks = (text) => ANSWER_LEAK_RE.test(text) || (leakable && containsTerm(text, correct));

  const fb = item.choiceFeedback;
  if (!Array.isArray(fb) || fb.length !== 4) {
    errs.push(`${where}: choiceFeedback must be an array of 4 strings`);
  } else {
    if (String(fb[idx] ?? "") !== "") {
      errs.push(`${where}: choiceFeedback[${idx}] (the correct choice) must be an empty string`);
    }
    fb.forEach((text, i) => {
      if (i === idx) return;
      const t = String(text ?? "").trim();
      if (t.length < MIN_FEEDBACK_CHARS) {
        errs.push(
          `${where}: choiceFeedback[${i}] must name the specific error (at least ${MIN_FEEDBACK_CHARS} characters)`,
        );
        return;
      }
      if (VAGUE_FEEDBACK_RE.test(t)) {
        errs.push(
          `${where}: choiceFeedback[${i}] is vague ("${t.slice(0, 24)}…") — name the error the student made`,
        );
      }
      if (leaks(t)) errs.push(`${where}: choiceFeedback[${i}] gives away the correct answer`);
    });
  }

  const hints = item.hints;
  if (!Array.isArray(hints) || hints.length !== 3 || !hints.every((h) => isStr(h, 10))) {
    errs.push(`${where}: hints must be a 3-step ladder of non-empty strings`);
  } else {
    hints.forEach((h, i) => {
      if (leaks(h))
        errs.push(`${where}: hints[${i}] contains the answer — hints scaffold, they do not tell`);
    });
  }
}

function validatePracticeItem(item, where, errs) {
  if (!item || typeof item !== "object") {
    errs.push(`${where}: must be an object`);
    return;
  }
  if (item.type !== "multiple-choice") errs.push(`${where}: type must be "multiple-choice"`);
  validateChoiceItem(item, where, errs);

  if (!isStr(item.stemEs, 10)) errs.push(`${where}: stemEs (Spanish stem) is missing`);
  else if (item.stemEs.trim() === String(item.stem || "").trim()) {
    errs.push(`${where}: stemEs is identical to stem — it must be real Spanish`);
  }
  if (!isStr(item.explanationEs, 10)) errs.push(`${where}: explanationEs is missing`);
  else if (item.explanationEs.trim() === String(item.explanation || "").trim()) {
    errs.push(`${where}: explanationEs is identical to explanation — it must be real Spanish`);
  }
  const hintsEs = item.hintsEs;
  if (!Array.isArray(hintsEs) || hintsEs.length !== 3 || !hintsEs.every((h) => isStr(h, 10))) {
    errs.push(`${where}: hintsEs must be 3 Spanish hints`);
  } else if (Array.isArray(item.hints)) {
    hintsEs.forEach((h, i) => {
      if (String(h).trim() === String(item.hints[i] || "").trim()) {
        errs.push(`${where}: hintsEs[${i}] is identical to hints[${i}] — it must be real Spanish`);
      }
    });
  }
  if (item.misconceptionTag != null && !isStr(item.misconceptionTag)) {
    errs.push(`${where}: misconceptionTag must be a string when present`);
  }
}

/**
 * Validate a forged lesson config against the engine contract AND the content
 * rules that make a generated lesson worth putting in front of children.
 *
 * @param {unknown} config          the parsed config the model returned
 * @param {{standard?: string, tag?: string}} [opts]
 * @returns {string[]} human-readable errors; empty array means valid.
 */
export function validateForgeConfig(config, opts = {}) {
  const errs = [];
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return ["config must be a JSON object"];
  }

  // ── identity ──
  if (!isStr(config.lessonId) || !config.lessonId.startsWith("forge-")) {
    errs.push('lessonId must be a string starting with "forge-"');
  }
  if (!isStr(config.standard)) errs.push("standard is required");
  else if (opts.standard && config.standard !== opts.standard) {
    errs.push(`standard must echo the requested standard (${opts.standard})`);
  }
  for (const key of [
    "title",
    "theme",
    "themeEmoji",
    "contentObjective",
    "languageObjective",
    "timeEstimate",
  ]) {
    if (!isStr(config[key])) errs.push(`${key} is required`);
  }

  // ── vocabulary (needed before notice & wonder, which must not leak a term) ──
  const vocab = config.vocabulary;
  if (!Array.isArray(vocab) || vocab.length < 3 || vocab.length > 5) {
    errs.push("vocabulary must be an array of 3-5 terms");
  } else {
    vocab.forEach((v, i) => {
      const w = `vocabulary[${i}]`;
      if (!v || typeof v !== "object") {
        errs.push(`${w}: must be an object`);
        return;
      }
      for (const key of ["term", "termEs", "definition", "definitionEs"]) {
        if (!isStr(v[key])) errs.push(`${w}.${key} is required`);
      }
      if (isStr(v.term) && isStr(v.termEs) && v.term.trim() === v.termEs.trim()) {
        errs.push(`${w}.termEs is identical to term — it must be real Spanish`);
      }
      if (
        isStr(v.definition) &&
        isStr(v.definitionEs) &&
        v.definition.trim() === v.definitionEs.trim()
      ) {
        errs.push(`${w}.definitionEs is identical to definition — it must be real Spanish`);
      }
    });
  }

  // ── notice & wonder: a curiosity hook, never the answer or the vocabulary ──
  const nw = config.noticeAndWonder;
  if (!nw || typeof nw !== "object") {
    errs.push("noticeAndWonder is required");
  } else {
    if (!isStr(nw.context, 20)) errs.push("noticeAndWonder.context is missing or too short");
    for (const key of ["noticeStarters", "wonderStarters"]) {
      const arr = nw[key];
      if (!Array.isArray(arr) || arr.length !== 3 || !arr.every((s) => isStr(s, 5))) {
        errs.push(`noticeAndWonder.${key} must be 3 non-empty starters`);
      }
    }
    const nwText = collectStrings(nw);
    const terms = Array.isArray(vocab)
      ? vocab.map((v) => (v && typeof v === "object" ? v.term : "")).filter((t) => isStr(t))
      : [];
    for (const term of terms) {
      if (nwText.some((s) => containsTerm(s, term))) {
        errs.push(
          `noticeAndWonder leaks the vocabulary term "${term}" — it is a curiosity hook, not the teaching`,
        );
      }
    }
  }

  // ── launch ──
  const launch = config.launch;
  if (!launch || typeof launch !== "object") {
    errs.push("launch is required");
  } else {
    if (!isStr(launch.narrative, 20)) errs.push("launch.narrative is missing or too short");
    const ci = launch.conceptIntro;
    if (!ci || typeof ci !== "object") {
      errs.push("launch.conceptIntro is required");
    } else {
      for (const key of ["heading", "intro", "keyIdea"]) {
        if (!isStr(ci[key])) errs.push(`launch.conceptIntro.${key} is required`);
      }
      for (const key of ["iDo", "weDo", "youDo"]) {
        const block = ci[key];
        if (!block || typeof block !== "object" || !isStr(block.title)) {
          errs.push(`launch.conceptIntro.${key} must be an object with a title`);
          continue;
        }
        if (
          !Array.isArray(block.lines) ||
          block.lines.length < 2 ||
          !block.lines.every((l) => isStr(l))
        ) {
          errs.push(`launch.conceptIntro.${key}.lines must be at least 2 non-empty lines`);
        }
      }
    }
  }

  // ── explore ──
  const explore = config.explore;
  if (!explore || typeof explore !== "object") {
    errs.push("explore is required");
  } else {
    if (!EXPLORE_TYPES.has(explore.type)) {
      errs.push(`explore.type must be one of: ${[...EXPLORE_TYPES].join(", ")}`);
    }
    if (!isStr(explore.instructions, 15)) errs.push("explore.instructions is missing or too short");
    const d = explore.discourse;
    if (!d || typeof d !== "object") {
      errs.push("explore.discourse is required");
    } else {
      if (!isStr(d.prompt, 10)) errs.push("explore.discourse.prompt is required");
      if (!isStr(d.sentenceFrame, 10)) errs.push("explore.discourse.sentenceFrame is required");
      if (
        !Array.isArray(d.keywords) ||
        d.keywords.length < 3 ||
        !d.keywords.every((k) => isStr(k))
      ) {
        errs.push("explore.discourse.keywords must be at least 3 non-empty strings");
      }
    }
    // drag-sort actually renders cards + bins, so its shape has to be right or
    // the Explore phase mounts empty.
    if (explore.type === "drag-sort") {
      const cats = explore.categories;
      const items = explore.items;
      const ids = new Set();
      if (!Array.isArray(cats) || cats.length < 2) {
        errs.push("explore.categories must have at least 2 categories for drag-sort");
      } else {
        cats.forEach((c, i) => {
          if (!c || typeof c !== "object" || !isStr(c.id) || !isStr(c.label)) {
            errs.push(`explore.categories[${i}] must be { id, label }`);
          } else ids.add(c.id);
        });
      }
      if (!Array.isArray(items) || items.length < 4) {
        errs.push("explore.items must have at least 4 cards for drag-sort");
      } else {
        items.forEach((it, i) => {
          if (!it || typeof it !== "object" || !isStr(it.text) || !isStr(it.category)) {
            errs.push(`explore.items[${i}] must be { text, category }`);
          } else if (ids.size && !ids.has(it.category)) {
            errs.push(
              `explore.items[${i}].category "${it.category}" is not one of explore.categories`,
            );
          }
        });
      }
    }
  }

  // ── practice ──
  const practice = config.practice;
  const items = practice && typeof practice === "object" ? practice.optional : null;
  if (!Array.isArray(items) || items.length !== PRACTICE_COUNT) {
    errs.push(`practice.optional must be an array of exactly ${PRACTICE_COUNT} items`);
  } else {
    items.forEach((item, i) => validatePracticeItem(item, `practice.optional[${i}]`, errs));
    if (opts.tag) {
      const tagged = items.filter((it) => it && it.misconceptionTag === opts.tag).length;
      if (tagged < 2) {
        errs.push(
          `at least 2 practice items must carry misconceptionTag "${opts.tag}" (found ${tagged})`,
        );
      }
    }
  }

  // ── connect ──
  const connect = config.connect;
  if (!connect || typeof connect !== "object") {
    errs.push("connect is required");
  } else {
    if (!isStr(connect.scenario, 20)) errs.push("connect.scenario is missing or too short");
    if (!isStr(connect.prompt, 10)) errs.push("connect.prompt is required");
    if (!Array.isArray(connect.keywords) || connect.keywords.length < 3) {
      errs.push("connect.keywords must be at least 3 strings");
    }
    if (!Array.isArray(connect.check) || connect.check.length < 1) {
      errs.push("connect.check must have at least 1 question");
    } else {
      connect.check.forEach((q, i) => {
        const w = `connect.check[${i}]`;
        if (!q || typeof q !== "object") {
          errs.push(`${w}: must be an object`);
          return;
        }
        if (!isStr(q.stem, 10)) errs.push(`${w}: stem is missing or too short`);
        if (
          !Array.isArray(q.choices) ||
          q.choices.length !== 4 ||
          !q.choices.every((c) => isStr(c))
        ) {
          errs.push(`${w}: choices must be an array of 4 non-empty strings`);
        }
        if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) {
          errs.push(`${w}: answer must be an integer 0-3`);
        }
        if (!isStr(q.explanation, 15)) errs.push(`${w}: explanation is missing or too short`);
      });
    }
  }

  // ── reflect / exit ticket ──
  const ticket =
    config.reflect && typeof config.reflect === "object" ? config.reflect.exitTicket : null;
  if (!ticket || typeof ticket !== "object") {
    errs.push("reflect.exitTicket is required");
  } else {
    validateChoiceItem(ticket, "reflect.exitTicket", errs);
  }

  // ── global content rules ──
  for (const s of collectStrings(config)) {
    if (/\besol\b/i.test(s)) {
      errs.push('the word "ESOL" must never appear in generated content');
      break;
    }
  }

  return errs;
}

