// Math Literacy Studio: search in ordinary teacher language, with no paid model. A query like "sixth-grade ratio word problems for
// English learners" is parsed for a grade, a resource type, a support need, a duration and skill words, then every (skill, resource type)
// pair is scored against structured metadata. When nothing matches exactly, the filters are relaxed one at a time and the answer says so.
import { TYPE_LABEL, TYPE_META } from "./roles.js";

const ORD = { first: 1, "1st": 1, second: 2, "2nd": 2, third: 3, "3rd": 3, fourth: 4, "4th": 4, fifth: 5, "5th": 5, sixth: 6, "6th": 6, seventh: 7, "7th": 7, eighth: 8, "8th": 8 };
const STOP = new Set(["a", "an", "the", "for", "with", "and", "of", "to", "in", "on", "my", "me", "i", "need", "want", "some", "activity", "activities", "resource", "resources", "lesson", "lessons", "grade", "graders", "students", "student", "kids", "class", "math", "mathematics", "mathematical", "about", "that", "help", "find", "make", "give", "something"]);
const TYPE_WORDS = {
  worksheet: ["worksheet", "worksheets", "practice sheet"],
  "vocab-cards": ["vocabulary cards", "word cards", "word wall", "vocab cards"],
  "vocab-practice": ["vocabulary", "vocab", "words", "multiple meaning", "multiple-meaning"],
  "word-problems": ["word problem", "word problems", "story problem", "story problems"],
  "reading-passage": ["reading", "passage", "read"],
  "speaking-task": ["speaking", "oral", "speak", "talk"],
  "discussion-cards": ["discussion", "discourse", "notice and wonder", "debate", "math talk"],
  "listening-task": ["listening", "listen"],
  "writing-task": ["writing", "write", "sentence", "sentences", "explain in writing"],
  "error-analysis": ["error", "mistake", "detective", "error analysis"],
  "exit-ticket": ["exit ticket", "exit tickets"],
  "mini-assessment": ["assessment", "quiz", "formative", "check for understanding", "test"],
  "intervention-packet": ["intervention", "reteach", "struggling", "remediation", "reteaching"],
  "task-cards": ["task cards", "extension", "enrichment", "challenge"],
  "family-practice": ["family", "home", "parent", "parents", "homework"],
  poster: ["poster", "anchor chart"],
  "game-sheet": ["game", "games"],
  "collab-activity": ["group", "collaborative", "cooperative"],
  "lesson-guide": ["teacher guide", "lesson plan", "guide"],
  "guided-notes": ["guided notes", "notes"],
  notebook: ["notebook"],
  organizer: ["organizer", "graphic organizer", "anatomy"],
};
const SYN = {
  ratio: ["ratios", "rate", "rates", "proportion", "proportional", "unit rate"],
  fraction: ["fractions", "numerator", "denominator", "unit fraction"],
  multiplication: ["multiply", "times", "product", "arrays", "groups", "factor", "factors"],
  division: ["divide", "quotient", "share"],
  addition: ["add", "sum", "plus", "adding"],
  subtraction: ["subtract", "difference", "minus", "subtracting"],
  slope: ["rate of change", "linear", "line", "functions"],
  percent: ["percents", "percentage", "discount", "tax"],
  area: ["perimeter", "square units"],
  geometry: ["shape", "shapes", "angle", "angles", "triangle", "volume"],
  data: ["graph", "graphs", "plot", "statistics", "mean", "median", "distribution", "scatter"],
  algebra: ["equation", "equations", "expression", "expressions", "variable", "inequality"],
  measurement: ["length", "time", "money", "units", "measure", "convert"],
  decimal: ["decimals", "tenths", "hundredths"],
  place: ["place value", "tens", "ones", "hundreds"],
  probability: ["chance", "likely", "random"],
  exponent: ["exponents", "powers", "scientific notation"],
};
const stem = (w) => w.toLowerCase().replace(/[^a-z0-9/-]/g, "").replace(/(ing|es|s)$/, (m, a, off, s) => (s.length - m.length >= 3 ? "" : m));

/** Parse a query into structured filters and leftover skill words. */
export function parseQuery(q) {
  const text = ` ${String(q || "").toLowerCase().replace(/[.,!?]/g, " ")} `;
  const out = { grade: 0, types: [], support: "", minutes: 0, purpose: "", words: [], used: [] };
  const g = text.match(/\b(?:grade|gr\.?|g)\s?([1-8])\b/) || text.match(/\b([1-8])(?:st|nd|rd|th)[- ]grade\b/) || text.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth|[1-8](?:st|nd|rd|th))[- ]grade(?:rs?)?\b/) || text.match(/\b(first|second|third|fourth|fifth|sixth|seventh|eighth)\b/);
  if (g) {
    out.grade = Number(g[1]) || ORD[g[1]] || 0;
    out.used.push(g[0].trim());
  }
  const min = text.match(/\b(five|ten|fifteen|twenty|\d{1,2})[- ]?(?:minutes?|mins?)\b/);
  if (min) {
    const w = { five: 5, ten: 10, fifteen: 15, twenty: 20 };
    out.minutes = w[min[1]] || Number(min[1]);
    out.used.push(min[0].trim());
  }
  for (const [type, words] of Object.entries(TYPE_WORDS))
    for (const w of words)
      if (text.includes(` ${w} `) || text.includes(` ${w}s `)) {
        if (!out.types.includes(type)) out.types.push(type);
        out.used.push(w);
      }
  if (/\b(english learners?|ell|ells|el|esol|multilingual|newcomers?|emergent bilinguals?|language support|language learners?)\b/.test(text)) {
    out.support = "more-language";
    out.used.push("english learners");
  }
  if (/\b(visual|visuals|picture|pictures|diagram)\b/.test(text)) out.visual = true;
  if (/\b(warm[- ]?up|warm-up|warmup)\b/.test(text)) out.sequence = "warmup5";
  if (/\b(routine)\b/.test(text)) out.sequence = out.sequence || "routine10";
  if (/\b(struggl|reteach|intervention|remediat|behind)\w*/.test(text)) out.purpose = "intervene";
  else if (/\b(extension|enrichment|challenge|advanced)\b/.test(text)) out.purpose = "extend";
  const used = out.used.join(" ");
  out.words = text
    .split(/[\s-]+/)
    .map((w) => w.trim())
    .filter((w) => w && !STOP.has(w) && !/^[1-8](st|nd|rd|th)?$/.test(w) && !ORD[w] && !used.includes(w) && !/^(minutes?|mins?|five|ten|fifteen|twenty|english|learners?|ell|esol)$/.test(w));
  return out;
}

const synKey = (w) => Object.keys(SYN).find((k) => k === w || SYN[k].includes(w) || stem(k) === stem(w));
/** Score a skill summary against skill words (0..). Title and vocabulary count most. */
function skillScore(s, words) {
  if (!words.length) return 0;
  const title = ` ${s.title.toLowerCase()} `;
  const bag = ` ${[s.domain, ...(s.terms || []), ...(s.keywords || [])].join(" ").toLowerCase()} `;
  let sc = 0;
  let hit = 0;
  for (const w of words) {
    const st = stem(w);
    const alts = [w, st, ...(SYN[synKey(w)] || [])];
    let best = 0;
    for (const a of alts) {
      const aa = String(a).toLowerCase();
      if (title.includes(aa) || title.includes(stem(aa))) best = Math.max(best, 3);
      else if (bag.includes(aa) || bag.includes(stem(aa))) best = Math.max(best, 1.5);
    }
    if (best) hit += 1;
    sc += best;
  }
  return hit === 0 ? 0 : sc + (hit === words.length ? 2 : 0);
}

/** Skill summaries -> ranked skills. `index` is content/mls/index.json's `skills`. */
export function searchSkills(index, q, { grade = 0 } = {}) {
  const p = parseQuery(q);
  const g = grade || p.grade;
  return index
    .map((s) => ({ s, score: skillScore(s, p.words) + (g && s.grade === g ? 0.5 : 0) }))
    .filter((x) => x.score > 0 && (!g || x.s.grade === g))
    .sort((a, b) => b.score - a.score || a.s.grade - b.s.grade)
    .map((x) => x.s);
}

/**
 * Resources for a query: [{ skill, type, variant, score, why }]. With filters: { grade, type, domain, purpose, support, minutes, format }.
 * Returns { results, parsed, note }. `note` explains any relaxed filter so the teacher is never shown a silent near-miss.
 */
export function searchResources(index, q, filters = {}, limit = 24) {
  const parsed = parseQuery(q);
  const f = { grade: filters.grade || parsed.grade, types: filters.type ? [filters.type] : parsed.types, domain: filters.domain || "", purpose: filters.purpose || (parsed.purpose === "intervene" ? "intervene" : parsed.purpose === "extend" ? "extend" : ""), minutes: filters.minutes || parsed.minutes, format: filters.format || "", support: filters.support || parsed.support };
  const make = (ff, relaxedNote = "") => {
    const skills = ff.words === false ? index.filter((s) => !ff.grade || s.grade === ff.grade) : parsed.words.length ? index.filter((s) => (!ff.grade || s.grade === ff.grade) && skillScore(s, parsed.words) > 0) : index.filter((s) => !ff.grade || s.grade === ff.grade);
    const types = (ff.types.length ? ff.types : parsed.purpose === "intervene" ? ["intervention-packet", "worksheet", "word-problems"] : parsed.purpose === "extend" ? ["task-cards", "discussion-cards", "collab-activity"] : Object.keys(TYPE_META)).filter((t) => {
      const m = TYPE_META[t];
      return (!ff.domain || m.domain === ff.domain) && (!ff.purpose || m.purpose === ff.purpose || (ff.purpose === "extend" && t === "task-cards")) && (!ff.format || m.format === ff.format);
    });
    const out = [];
    for (const s of skills) {
      const ss = skillScore(s, parsed.words);
      for (const t of types) {
        const m = TYPE_META[t];
        let sc = ss + (ff.types.includes(t) ? 4 : 0);
        if (ff.minutes) sc += Math.max(0, 2 - Math.abs(m.minutes - ff.minutes) / 8);
        out.push({ skill: s, type: t, variant: t === "task-cards" && (ff.purpose === "extend" || parsed.purpose === "extend") ? "extension" : "", score: sc, why: [ss ? "matches the skill" : "", ff.types.includes(t) ? `is a ${TYPE_LABEL[t].toLowerCase()}` : "", f.support ? "language support is on" : ""].filter(Boolean) });
      }
    }
    out.sort((a, b) => b.score - a.score || a.skill.grade - b.skill.grade);
    return { results: out.slice(0, limit), note: relaxedNote };
  };
  let r = make(f);
  const typed = f.types.length;
  if (!r.results.length && typed) r = make({ ...f, types: [] }, `No ${f.types.map((t) => TYPE_LABEL[t].toLowerCase()).join(" or ")} matched exactly, so these are other resources for the same skill.`);
  if (!r.results.length && f.grade) r = make({ ...f, grade: 0 }, `Nothing matched in grade ${f.grade}, so these are from other grades.`);
  if (!r.results.length) r = make({ ...f, grade: f.grade, types: [], words: false }, "I could not match those words to a skill. Here is every skill in the grade you named; try a topic like fractions, ratios or word problems.");
  if (!r.results.length) r = make({ grade: 0, types: [], domain: "", purpose: "", minutes: 0, format: "", support: "", words: false }, "I could not match that search. Try a grade and a topic, for example: sixth-grade ratio word problems.");
  return { results: r.results, parsed, filters: f, note: r.note };
}

/** Support presets the search implies, so a result opens with the right dials set. */
export function optsFromParsed(parsed) {
  const o = {};
  if (parsed.support === "more-language") {
    o.support = "more";
    o.band = "1-2";
  }
  if (parsed.visual) o.visuals = "more";
  if (parsed.purpose === "extend") o.support = "extension";
  return o;
}
