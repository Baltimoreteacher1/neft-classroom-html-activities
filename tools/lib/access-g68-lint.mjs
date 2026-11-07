// Lint for the grades 6-8 publisher specs (tools/access-g68-content/*.mjs). Returns plain-sentence problems.
// These are authoring rules; the lab's own gates (validate-access-lab, validate-access-quality,
// validate-reading-room) still run on the built output.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { GRADE_REASONS } from "../../access-practice-lab/src/grade-focus.js";
import { fleschKincaid } from "../../access-practice-lab/src/lang/text.js";
import { LAB_DIR } from "./access-lab-content.mjs";

const LEVELS = ["A", "B", "C"];
const TIMER =
  /\b(timer|countdown|stopwatch|seconds? left|race the clock|beat the clock|speed run|as fast as you can)\b/i;
const EMOJI = /\p{Extended_Pictographic}/u;
const WIDA_LEVEL = /\b(Entering|Emerging|Developing|Expanding|Bridging|Reaching)\s*:/i;
const KEBAB = /^[a-z0-9][a-z0-9-]*$/;
const GLOSS = /^[^:]+:\s*\S/;
const words = (t) => String(t).trim().split(/\s+/).filter(Boolean).length;
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const blanks = (s) => (String(s).match(/___/g) || []).length;

/** The correct option may not be conspicuously the longest (the quality gate's cue, applied per item). */
function longestCue(opts, nRight) {
  if (nRight !== 1) return false;
  const lens = opts.map((o) => o.length);
  const max = Math.max(...lens);
  const rest = lens.slice(1);
  return (
    lens[0] === max &&
    rest.every((l) => l < max) &&
    lens[0] >= 1.25 * (rest.reduce((a, b) => a + b, 0) / rest.length)
  );
}

function choiceProblems(w, s, minOpts, maxOpts, nRight, p) {
  if (!Array.isArray(s.opts) || s.opts.length < minOpts || s.opts.length > maxOpts)
    return p(`${w}: opts needs ${minOpts}-${maxOpts} entries (right answer(s) first)`);
  const texts = s.opts.map((o) => String(o).trim().toLowerCase());
  if (new Set(texts).size !== texts.length) p(`${w}: duplicate options`);
  if (s.opts.some((o) => EMOJI.test(o) || String(o).includes("|")))
    p(`${w}: options are plain text (no emoji, no "|")`);
  const wrong = s.opts.length - nRight;
  if (!Array.isArray(s.why) || s.why.length !== wrong)
    return p(`${w}: why needs one note per wrong option (${wrong}), in order`);
  s.why.forEach((x, i) => {
    if (words(x) < 5)
      p(`${w}: why[${i}] must say in a full sentence what is wrong with that option`);
  });
  if (longestCue(s.opts, nRight))
    p(`${w}: the right option is conspicuously the longest; lengthen the wrong ones`);
}

function vocabProblems(w, vocab, min, p) {
  if (!Array.isArray(vocab) || vocab.length < min)
    return p(`${w}: vocab needs at least ${min} entries`);
  for (const v of vocab) {
    if (!Array.isArray(v) || v.length < 3 || !v[0] || !v[1] || !GLOSS.test(String(v[2] || "")))
      p(`${w}: vocab "${v?.[0]}" needs [term, definition, "término: definición en español"]`);
  }
}

function textProblems(w, strings, p) {
  const t = strings.filter(Boolean).join(" ");
  if (TIMER.test(t)) p(`${w}: no timers, countdowns or speed language`);
}

export function lintSpecs(specs) {
  const out = [];
  const seen = new Set();
  for (const s of specs) {
    const w = `${s.domain || "?"}:${s.id}`;
    const p = (m) => out.push(m);
    if (!KEBAB.test(s.id || "")) p(`${w}: id must be kebab-case`);
    if (seen.has(s.id)) p(`${w}: duplicate spec id`);
    seen.add(s.id);
    if (!LEVELS.includes(s.level)) p(`${w}: level must be A, B or C`);
    for (const f of ["strand", "title", "skill", "dir", "q", "correct", "hint"])
      if (!s[f] || typeof s[f] !== "string") p(`${w}: missing ${f}`);
    if (!Array.isArray(s.wida) || !s.wida.length || s.wida.some((x) => WIDA_LEVEL.test(x)))
      p(`${w}: wida needs task-focus tags and no proficiency-level labels`);
    if (!Array.isArray(s.frames) || s.frames.length < 2)
      p(`${w}: needs at least 2 sentence frames`);
    if (!Array.isArray(s.focus) || s.focus.length < 3) p(`${w}: focus needs at least 3 entries`);
    vocabProblems(w, s.vocab, 2, p);
    if (s.gw && !GRADE_REASONS[s.gw]) p(`${w}: unknown gw code ${s.gw}`);
    if (s.gw && s.level === "A") p(`${w}: Level A activities carry no grade tag`);
    if (!Array.isArray(s.es) || !s.es[0] || !s.es[1]) p(`${w}: es needs [goal, directions]`);
    else {
      if (blanks(s.dir) !== blanks(s.es[1])) p(`${w}: es directions must keep the same blanks`);
      for (const n of new Set(String(s.dir).match(/\d+/g) || []))
        if (!s.es[1].includes(n)) p(`${w}: es directions dropped the number ${n}`);
      if (s.es[1] === s.dir) p(`${w}: es directions are not translated`);
    }
    textProblems(w, [s.dir, s.q, s.hint, s.correct, s.support, s.extension, s.script], p);
    const type = s.type || (s.domain === "Listening" ? "multipleChoice" : "constructed");
    if (s.domain === "Listening") {
      const script = String(s.script || "");
      const n = words(script);
      if (n < 55 || n > 330) p(`${w}: script needs 55-330 words (has ${n})`);
      const fk = n ? fleschKincaid(script) : 0;
      if (fk > 12.5) p(`${w}: script reads at FK ${fk.toFixed(1)}; keep it at or under 12`);
      const shown = norm(`${s.q} ${s.dir}`);
      const sw = norm(script).split(" ");
      for (let i = 0; i + 8 <= sw.length; i += 4)
        if (shown.includes(sw.slice(i, i + 8).join(" "))) {
          p(`${w}: the heard script is printed in the prompt or directions`);
          break;
        }
    }
    if (type === "multipleChoice") choiceProblems(w, s, 3, 4, 1, p);
    else if (type === "multiSelect") {
      if (!(s.ans >= 2 && s.ans <= 3)) p(`${w}: ans must be 2 or 3`);
      else choiceProblems(w, s, 4, 6, s.ans, p);
    } else if (type === "order") {
      if (!Array.isArray(s.items) || s.items.length < 3 || s.items.length > 6)
        p(`${w}: order needs 3-6 items`);
    } else if (type === "cloze") {
      if (!Array.isArray(s.cloze) || !s.cloze.some(Array.isArray))
        p(`${w}: cloze needs blanks as [answer, ...wrong]`);
      else if (s.cloze.filter(Array.isArray).some((b) => b.length < 3))
        p(`${w}: each blank needs 2+ wrong choices`);
    } else if (type === "sort") {
      if (!Array.isArray(s.cats) || s.cats.length < 2) p(`${w}: sort needs categories`);
      else if (!Array.isArray(s.sortItems) || s.sortItems.length < 5)
        p(`${w}: sort needs at least 5 items`);
      else if (s.sortItems.some(([, c]) => !(c >= 0 && c < s.cats.length)))
        p(`${w}: sortItems point at a missing category`);
    } else if (type === "hotText") {
      if (!Array.isArray(s.sentences) || !Array.isArray(s.answerIdx))
        p(`${w}: hotText needs sentences and answerIdx`);
    } else if (type === "constructed") {
      for (const k of ["A", "B", "C"])
        if (!s.models?.[k] || words(s.models[k]) < 8) p(`${w}: models.${k} missing or too short`);
      if (!Array.isArray(s.criteria) || s.criteria.length < 3)
        p(`${w}: criteria needs 3+ "I" checks`);
      else if (s.criteria.some((c) => !/^(I|My) /.test(c)))
        p(`${w}: criteria start with "I " or "My " (student self-check voice)`);
      if (s.domain === "Writing") {
        if (!Array.isArray(s.bank) || s.bank.length < 6)
          p(`${w}: bank needs at least 6 words or phrases`);
        if (!Array.isArray(s.plan) || s.plan.length < 3)
          p(`${w}: plan (the organizer boxes) needs at least 3 entries`);
        if (words(s.models.C) < 40) p(`${w}: model C should be a developed piece (40+ words)`);
      }
    } else p(`${w}: unsupported type ${type}`);
    if (s.domain !== "Listening" && type !== "constructed" && s.domain === "Writing")
      p(`${w}: Writing items are constructed`);
    if (s.picture && !existsSync(join(LAB_DIR, s.picture.src)))
      p(`${w}: picture file missing ${s.picture.src}`);
    if (s.picture && !s.picture.alt) p(`${w}: picture needs alt`);
    if (
      s.domain === "Speaking" &&
      type === "constructed" &&
      !(
        s.chart ||
        s.table ||
        s.picture ||
        /role|partner|your (teacher|friend|classmate)/i.test(`${s.q}`)
      )
    )
      p(`${w}: Speaking prompts need a stimulus (chart, table, picture) or a role-play partner`);
    if (s.table) {
      if (!Array.isArray(s.table.headers) || !Array.isArray(s.table.rows))
        p(`${w}: table needs headers and rows`);
      else if (s.table.rows.some((r) => r.length !== s.table.headers.length))
        p(`${w}: table row width differs from headers`);
    }
    if (s.chart && (!Array.isArray(s.chart.data) || s.chart.data.length < 2))
      p(`${w}: chart needs 2+ data points`);
  }
  return out;
}

const Q_TYPES = ["choice", "connector", "multi", "cloze", "order", "sort", "evidence", "short"];
const KINDS = [
  "literal",
  "inference",
  "vocab",
  "structure",
  "craft",
  "data",
  "summary",
  "evidence",
  "purpose",
  "constructed",
];

export function lintLessons(specs) {
  const out = [];
  const seen = new Set();
  for (const s of specs) {
    const w = `Reading:${s.id}`;
    const p = (m) => out.push(m);
    if (!KEBAB.test(s.id || "")) p(`${w}: id must be kebab-case`);
    if (seen.has(s.id)) p(`${w}: duplicate spec id`);
    seen.add(s.id);
    if (!LEVELS.includes(s.level)) p(`${w}: level must be A, B or C`);
    for (const f of [
      "title",
      "summary",
      "genre",
      "subject",
      "languageFunction",
      "content",
      "language",
      "essential",
      "background",
      "hook",
      "purpose",
    ])
      if (!s[f] || typeof s[f] !== "string") p(`${w}: missing ${f}`);
    if (!["Narrate", "Inform", "Explain", "Argue"].includes(s.keyUse))
      p(`${w}: keyUse must be Narrate, Inform, Explain or Argue`);
    if (!["ELD-LA", "ELD-MA", "ELD-SC", "ELD-SS"].includes(s.eldStandard))
      p(`${w}: eldStandard must be ELD-LA, ELD-MA, ELD-SC or ELD-SS`);
    if (!Array.isArray(s.topics) || !s.topics.length) p(`${w}: topics needs entries`);
    if (!Array.isArray(s.languageFeatures) || s.languageFeatures.length < 2)
      p(`${w}: languageFeatures needs 2+ entries`);
    if (!(s.minutes >= 8 && s.minutes <= 30)) p(`${w}: minutes must be 8-30`);
    if (!Array.isArray(s.paras) || s.paras.length < 3 || s.paras.length > 8) {
      p(`${w}: paras needs 3-8 paragraphs`);
      continue;
    }
    const text = s.paras.map((x) => (typeof x === "string" ? x : x.text)).join(" ");
    const n = words(text);
    const [lo, hi] = { A: [110, 230], B: [150, 330], C: [190, 430] }[s.level] || [110, 430];
    if (n < lo || n > hi) p(`${w}: passage has ${n} words; level ${s.level} wants ${lo}-${hi}`);
    const fk = fleschKincaid(text);
    if (fk < 2.5 || fk > 11.5)
      p(
        `${w}: passage reads at FK ${fk.toFixed(1)}; keep 2.5-11.5 (numbers and notation lower the estimate; level A ~3-7, B ~5-9, C ~8-11)`,
      );
    if (
      s.vocab?.length < 3 ||
      s.vocab?.length > 6 ||
      s.vocab.some((v) => v.length < 4 || v.some((x) => !x))
    )
      p(
        `${w}: vocab needs 3-6 entries of [term, definition, example sentence from this topic, Spanish term]`,
      );
    if (s.table && !(s.table.headers?.length && s.table.rows?.length && s.table.description))
      p(`${w}: table needs headers, rows, description`);
    if (s.table?.rows?.some((r) => r.length !== s.table.headers.length))
      p(`${w}: table row width differs from headers`);
    textProblems(w, [text, s.hook, s.purpose], p);
    if (!Array.isArray(s.qs) || s.qs.length < 5 || s.qs.length > 7) {
      p(`${w}: qs needs 5-7 questions (the builder adds the transfer task)`);
      continue;
    }
    const kinds = new Set(s.qs.map((q) => q.kind));
    for (const must of ["vocab", "inference", "literal"])
      if (!kinds.has(must)) p(`${w}: needs a ${must} question`);
    if (!s.qs.some((q) => q.kind === "structure" || q.kind === "craft"))
      p(`${w}: needs a structure or craft question`);
    if (!s.qs.some((q) => q.type === "short"))
      p(`${w}: needs a short constructed-response question`);
    const qids = new Set();
    s.qs.forEach((q, i) => {
      const qw = `${w}/q${i + 1}`;
      if (!Q_TYPES.includes(q.type)) return p(`${qw}: unsupported type ${q.type}`);
      if (!KINDS.includes(q.kind)) p(`${qw}: kind must be one of ${KINDS.join(", ")}`);
      if (!["first", "second", "third"].includes(q.phase))
        p(`${qw}: phase must be first, second or third`);
      if (!q.skill || !q.prompt) p(`${qw}: needs skill and prompt`);
      const id = q.id || `q${i + 1}`;
      if (qids.has(id)) p(`${qw}: duplicate question id`);
      qids.add(id);
      if (q.type !== "short" && !q.rat)
        p(`${qw}: rat (why the answer is right, citing the text) is required`);
      if (q.type === "choice" || q.type === "connector") choiceProblems(qw, q, 3, 4, 1, p);
      else if (q.type === "multi") {
        if (!(q.ans >= 2 && q.ans <= 3)) p(`${qw}: ans must be 2 or 3`);
        else choiceProblems(qw, q, 4, 6, q.ans, p);
      } else if (q.type === "cloze") {
        if (!Array.isArray(q.cloze) || !q.cloze.some(Array.isArray)) p(`${qw}: cloze needs blanks`);
      } else if (q.type === "order") {
        if (!Array.isArray(q.items) || q.items.length < 3) p(`${qw}: order needs 3+ items`);
      } else if (q.type === "sort") {
        if (
          !Array.isArray(q.cats) ||
          q.cats.length < 2 ||
          !Array.isArray(q.sortItems) ||
          q.sortItems.length < 4
        )
          p(`${qw}: sort needs 2+ categories and 4+ items`);
        else if (q.sortItems.some(([, c]) => !(c >= 0 && c < q.cats.length)))
          p(`${qw}: sortItems point at a missing category`);
      } else if (q.type === "evidence") {
        if (
          !Array.isArray(q.evidence) ||
          !q.evidence.length ||
          q.evidence.some((e) => !/^p\d+$/.test(e) || Number(e.slice(1)) > s.paras.length)
        )
          p(`${qw}: evidence lists paragraph ids like "p2"`);
      } else if (q.type === "short") {
        if (!Array.isArray(q.lookFor) || q.lookFor.length < 3) p(`${qw}: lookFor needs 3+ entries`);
        if (!Array.isArray(q.rubric) || q.rubric.length < 3) p(`${qw}: rubric needs 3+ entries`);
        if (!q.frame || !q.model || words(q.model) < 20)
          p(`${qw}: frame and a model answer (20+ words) are required`);
      }
    });
    const t = s.transfer;
    if (!t?.prompt || !Array.isArray(t.lookFor) || t.lookFor.length < 3 || !t.frame)
      p(`${w}: transfer needs prompt, lookFor (3+), frame`);
    const g = s.guide;
    if (
      !g?.mini ||
      !Array.isArray(g.discussion) ||
      g.discussion.length < 3 ||
      !g.misconception ||
      !Array.isArray(g.answerNotes) ||
      g.answerNotes.length < 2 ||
      !g.model
    )
      p(`${w}: guide needs mini, discussion (3+), misconception, answerNotes (2+), model`);
    const f = s.family;
    if (!f?.en || !f?.es || f.en === f.es || !Array.isArray(f.questions) || f.questions.length < 2)
      p(`${w}: family needs en, es (translated) and 2+ questions`);
  }
  return out;
}
