// BCPSS Language Studio v2 — authored content schema + validator (single source of truth).
//
// One file per grade+subject in this folder: `<subject-slug>-<grade>.mjs`, `export default { [unitId]: studio }`.
// Subject slugs: ela, math, science, social-studies. Grades: k,1..8.
//
// Design rules (Joel): student-facing, exciting, clear. Teacher text is ONE short `tip` per activity.
// No timed games. Real games with scaffolds that never give the answer away. Plain language, no jargon.

export const DOMAINS = ["Listening", "Speaking", "Reading", "Writing", "Vocabulary", "Game"];
export const KINDS = [
  "word_sort",
  "match",
  "cloze",
  "unscramble",
  "dictogloss",
  "info_gap",
  "error_analysis",
  "sentence_combine",
  "quiz",
  "talk_cards",
  "write_scaffold",
  "sequence",
  "clue_game",
  "read_annotate",
];
export const TONES = ["concept", "connector", "evidence", "precision"];
export const LEVELS = ["l1_2", "l3_4", "l5_6"];

export const MIN_ACTIVITIES = 10;
export const MAX_ACTIVITIES = 14;
export const MIN_DISTINCT_KINDS = 8;
export const VOCAB_COUNT = [8, 10];

// Phrases from the generated 1.0 content that must never come back.
export const BANNED_PHRASES = [
  "analyze the syntax",
  "academic term",
  "quantitative model",
  "warrant",
  "substantiate",
  "synthesize your argument",
  "implication is",
  "wida desk strip",
  "tier 2/tier 3",
  "tier 2 vs",
  "look-fors",
  "language dive",
  "in this unit",
  "this unit's",
];

// Max average words per sentence in student-facing text, by grade.
const AVG_SENTENCE_WORDS = { K: 8, 1: 10, 2: 11, 3: 13, 4: 15, 5: 17, 6: 18, 7: 20, 8: 22 };

const words = (s) => String(s || "").trim().split(/\s+/).filter(Boolean);
const isStr = (v, min = 1) => typeof v === "string" && v.trim().length >= min;
const isArr = (v, min = 0, max = Infinity) => Array.isArray(v) && v.length >= min && v.length <= max;

function sentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.split(/\s+/).length > 1);
}

function stem(term) {
  const t = String(term).toLowerCase().replace(/[^a-z\s'-]/g, "");
  return t.length > 5 ? t.slice(0, t.length - 2) : t;
}

function textIncludesTerm(text, term) {
  const low = String(text).toLowerCase();
  return term
    .toLowerCase()
    .split(/\s+/)
    .every((part) => low.includes(stem(part)));
}

// Every student-facing string in a unit (used for banned phrases + readability).
export function studentText(studio) {
  const out = [];
  const push = (v) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(push);
    else if (v && typeof v === "object") Object.values(v).forEach(push);
  };
  push(studio);
  return out;
}

function checkPayload(kind, p, add, ctx) {
  const need = (cond, msg) => {
    if (!cond) add(`${ctx} [${kind}] ${msg}`);
  };
  need(p && typeof p === "object", "payload missing");
  if (!p || typeof p !== "object") return;
  switch (kind) {
    case "word_sort": {
      need(isArr(p.categories, 2, 3) && p.categories.every((c) => isStr(c.name)), "2-3 categories with name");
      need(isArr(p.items, 8, 14), "8-14 items");
      for (const it of p.items || []) {
        need(isStr(it.text) && Number.isInteger(it.cat) && it.cat >= 0 && it.cat < (p.categories || []).length, `item "${it?.text}" needs text + valid cat index`);
      }
      const used = new Set((p.items || []).map((i) => i.cat));
      need(used.size === (p.categories || []).length, "every category must receive items");
      break;
    }
    case "match": {
      need(isStr(p.left_label) && isStr(p.right_label), "left_label/right_label");
      need(isArr(p.pairs, 6, 10) && p.pairs.every((x) => isStr(x.l) && isStr(x.r)), "6-10 pairs {l,r}");
      const ls = (p.pairs || []).map((x) => x.l);
      need(new Set(ls).size === ls.length, "duplicate left items");
      break;
    }
    case "cloze": {
      need(isStr(p.text, 30), "text");
      need(isArr(p.answers, 4, 8) && p.answers.every((a) => isStr(a)), "4-8 answers");
      need(isArr(p.bank, 5, 12), "bank (answers + 1-3 extra words)");
      (p.answers || []).forEach((a, i) => {
        need(String(p.text).includes(`{${i + 1}}`), `blank {${i + 1}} missing in text`);
        need((p.bank || []).includes(a), `answer "${a}" missing from bank`);
      });
      need(!/\{\d+\}/.test(String(p.text).replace(/\{\d+\}/g, (m) => (Number(m.slice(1, -1)) <= (p.answers || []).length ? "" : m))), "blank number beyond answers");
      break;
    }
    case "unscramble": {
      need(isArr(p.items, 4, 6), "4-6 items");
      for (const it of p.items || []) {
        need(isArr(it.parts, 3, 9) && it.parts.every((x) => isStr(x)), "each item needs 3-9 parts in correct order");
        need(it.parts?.[0] && /^[A-Z0-9]/.test(it.parts[0]), "first part must start capitalized");
        need(it.parts && /[.?!]$/.test(it.parts[it.parts.length - 1]), "last part must end with . ? or !");
      }
      break;
    }
    case "dictogloss": {
      need(isStr(p.text, 60), "text (read aloud)");
      need(isArr(p.key_words, 4, 8), "4-8 key_words");
      need(isStr(p.frame), "reconstruct frame");
      need(isArr(p.checks, 3, 5), "3-5 checks (ideas the retelling must include)");
      for (const k of p.key_words || []) need(String(p.text).toLowerCase().includes(String(k).toLowerCase().slice(0, 4)), `key word "${k}" not in text`);
      break;
    }
    case "info_gap": {
      need(isStr(p.goal), "goal");
      for (const side of ["a", "b"]) {
        const s = p[side];
        need(s && isStr(s.title) && isArr(s.has, 2, 6) && isArr(s.needs, 2, 6), `${side}: title, has[2-6], needs[2-6]`);
      }
      if (p.a && p.b) {
        const aHas = new Set((p.a.has || []).map((x) => x.k));
        const bHas = new Set((p.b.has || []).map((x) => x.k));
        for (const n of p.a.needs || []) need(bHas.has(n), `A needs "${n}" but B does not have it`);
        for (const n of p.b.needs || []) need(aHas.has(n), `B needs "${n}" but A does not have it`);
        for (const n of p.a.needs || []) need(!aHas.has(n), `A already has "${n}"`);
        for (const n of p.b.needs || []) need(!bHas.has(n), `B already has "${n}"`);
      }
      need(isArr(p.ask_frames, 2, 4) && isArr(p.tell_frames, 2, 4), "2-4 ask_frames and tell_frames");
      break;
    }
    case "error_analysis": {
      need(isArr(p.items, 4, 6), "4-6 items");
      for (const it of p.items || []) {
        need(isStr(it.wrong) && isArr(it.options, 3, 4) && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < (it.options || []).length && isStr(it.why), "item: wrong, options[3-4], answer idx, why");
        need(it.options && new Set(it.options).size === it.options.length, "duplicate options");
      }
      break;
    }
    case "sentence_combine": {
      need(isArr(p.items, 3, 5), "3-5 items");
      for (const it of p.items || []) {
        need(isArr(it.sentences, 2, 3) && isStr(it.connector) && isStr(it.model), "item: sentences[2-3], connector, model");
        need(String(it.model || "").toLowerCase().includes(String(it.connector || "").toLowerCase()), "model must use the connector");
      }
      break;
    }
    case "quiz": {
      need(isArr(p.items, 5, 8), "5-8 items");
      for (const it of p.items || []) {
        need(isStr(it.q) && isArr(it.options, 3, 4) && Number.isInteger(it.answer) && it.answer >= 0 && it.answer < (it.options || []).length && isStr(it.why), "item: q, options[3-4], answer idx, why");
        need(it.options && new Set(it.options).size === it.options.length, "duplicate options");
      }
      const idx = (p.items || []).map((i) => i.answer);
      need(new Set(idx).size > 1, "correct answer is always the same position");
      break;
    }
    case "talk_cards": {
      need(p.roles && isStr(p.roles.a) && isStr(p.roles.b), "roles {a,b}");
      need(isArr(p.cards, 5, 8) && p.cards.every((c) => isStr(c.prompt) && isStr(c.starter) && isStr(c.follow_up)), "5-8 cards {prompt, starter, follow_up}");
      need(isArr(p.moves, 3, 4) && p.moves.every((m) => isStr(m.label) && isStr(m.stem)), "3-4 moves {label, stem}");
      break;
    }
    case "write_scaffold": {
      need(isStr(p.prompt), "prompt");
      need(isArr(p.structure, 3, 5) && p.structure.every((s) => isStr(s.part) && isStr(s.frame)), "3-5 structure {part, frame}");
      need(isArr(p.word_bank, 6, 14), "6-14 word_bank");
      need(isArr(p.checklist, 3, 5), "3-5 checklist");
      need(isStr(p.model, 40), "model response");
      break;
    }
    case "sequence": {
      need(isStr(p.title), "title");
      need(isArr(p.steps, 4, 7) && p.steps.every((s) => isStr(s)), "4-7 steps in correct order");
      need(isArr(p.signals, 3, 7), "3-7 signal words");
      break;
    }
    case "clue_game": {
      need(isArr(p.cards, 6, 10), "6-10 cards");
      for (const c of p.cards || []) {
        need(isStr(c.term) && isArr(c.clues, 3, 3) && c.clues.every((x) => isStr(x)), `card "${c?.term}" needs term + exactly 3 clues`);
        for (const clue of c.clues || []) need(!String(clue).toLowerCase().includes(String(c.term).toLowerCase()), `clue gives away "${c.term}"`);
      }
      break;
    }
    case "read_annotate": {
      need(isStr(p.text, 60), "text");
      need(isArr(p.marks, 2, 4) && p.marks.every((m) => isStr(m.label) && isStr(m.instruction) && isArr(m.targets, 2, 8)), "2-4 marks {label, instruction, targets[2-8 exact phrases in text]}");
      for (const m of p.marks || []) for (const t of m.targets || []) need(String(p.text).includes(t), `mark target "${t}" not found in text`);
      need(isArr(p.questions, 2, 4), "2-4 questions");
      for (const it of p.questions || []) need(isStr(it.q) && isArr(it.options, 3, 4) && Number.isInteger(it.answer) && isStr(it.why), "question: q, options, answer, why");
      break;
    }
    default:
      add(`${ctx} unknown kind "${kind}"`);
  }
}

// Returns an array of human-readable problems (empty = valid).
export function validateStudio(unit, studio) {
  const problems = [];
  const add = (m) => problems.push(`${unit.id}: ${m}`);
  if (!studio || typeof studio !== "object") return [`${unit.id}: missing studio content`];

  if (!isStr(studio.essential_question, 25) || !/\?$/.test(studio.essential_question.trim())) add("essential_question must be a real question");
  if (studio.essential_question && unit.unit_title && studio.essential_question.toLowerCase().includes(unit.unit_title.toLowerCase())) add("essential_question must not just paste the unit title");
  if (!(studio.can_do && isStr(studio.can_do.content, 12) && isStr(studio.can_do.language, 12))) add("can_do {content, language} required ('I can ...')");

  const m = studio.mentor;
  if (!(m && isStr(m.text, 30) && isArr(m.chunks, 3, 5))) add("mentor {text, chunks[3-5]} required");
  else {
    if (m.chunks.map((c) => c.text).join(" ").replace(/\s+/g, " ").trim() !== m.text.replace(/\s+/g, " ").trim()) add("mentor chunks must join to exactly mentor.text");
    for (const c of m.chunks) if (!(isStr(c.role) && TONES.includes(c.tone) && isStr(c.ask, 10))) add(`mentor chunk "${c.text}" needs role, tone (${TONES.join("|")}), ask`);
    if (!isStr(m.gist, 15)) add("mentor.gist required (plain-language meaning)");
    if (!m.chunks.some((c) => c.tone === "connector")) add("mentor needs a connector chunk");
  }

  if (!(studio.frames && LEVELS.every((l) => isArr(studio.frames[l], 3, 4) && studio.frames[l].every((f) => isStr(f) && /\[[^\]]+\]/.test(f))))) add("frames {l1_2,l3_4,l5_6} each 3-4 sentence frames containing [blanks]");
  if (!isArr(studio.connectors, 4, 8)) add("connectors: 4-8 words/phrases");

  const v = studio.vocab;
  if (!(isArr(v, VOCAB_COUNT[0], VOCAB_COUNT[1]))) add(`vocab must have ${VOCAB_COUNT[0]}-${VOCAB_COUNT[1]} terms`);
  else {
    const seen = new Set();
    for (const t of v) {
      if (!(isStr(t.term) && [2, 3].includes(t.tier) && isStr(t.pos) && isStr(t.def, 8) && isStr(t.example, 12) && isStr(t.nonexample, 8) && isArr(t.family, 0, 6) && isStr(t.cue, 8))) {
        add(`vocab "${t.term}" needs term, tier(2|3), pos, def, example, nonexample, family[], cue`);
        continue;
      }
      if (seen.has(t.term.toLowerCase())) add(`duplicate vocab "${t.term}"`);
      seen.add(t.term.toLowerCase());
      if (!textIncludesTerm(t.example, t.term)) add(`vocab "${t.term}" example must use the word`);
      if (t.def.toLowerCase().includes(t.term.toLowerCase())) add(`vocab "${t.term}" definition uses the word itself`);
      if (!("es" in t)) add(`vocab "${t.term}" needs es (Spanish word or null)`);
      if (["K", "1", "2"].includes(String(unit.grade)) && !isStr(t.icon)) add(`vocab "${t.term}" needs icon (emoji) for grades K-2`);
    }
  }

  const acts = studio.activities;
  if (!isArr(acts, MIN_ACTIVITIES, MAX_ACTIVITIES)) add(`activities must number ${MIN_ACTIVITIES}-${MAX_ACTIVITIES} (found ${Array.isArray(acts) ? acts.length : 0})`);
  else {
    const kinds = new Set(acts.map((a) => a.kind));
    if (kinds.size < MIN_DISTINCT_KINDS) add(`need ${MIN_DISTINCT_KINDS}+ distinct activity kinds (found ${kinds.size})`);
    const domainCount = (d) => acts.filter((a) => a.domain === d).length;
    const minDomains = { Listening: 1, Speaking: 2, Reading: 2, Writing: 2, Vocabulary: 2, Game: 2 };
    for (const [d, n] of Object.entries(minDomains)) if (domainCount(d) < n) add(`need ${n}+ "${d}" activities (found ${domainCount(d)})`);
    const titles = new Set();
    acts.forEach((a, i) => {
      const ctx = `activity ${i + 1} "${a.title}"`;
      if (!(isStr(a.title, 6) && KINDS.includes(a.kind) && DOMAINS.includes(a.domain))) add(`${ctx}: title, kind, domain required`);
      if (titles.has(a.title)) add(`${ctx}: duplicate title`);
      titles.add(a.title);
      if (!(isStr(a.mission, 15) && words(a.mission).length <= 28)) add(`${ctx}: mission = one student-facing sentence (15 chars - 28 words)`);
      if (!(Number.isInteger(a.minutes) && a.minutes >= 5 && a.minutes <= 25)) add(`${ctx}: minutes 5-25`);
      if (!["Solo", "Partners", "Small Group", "Whole Class"].includes(a.grouping)) add(`${ctx}: grouping Solo|Partners|Small Group|Whole Class`);
      if (!(isStr(a.tip, 10) && words(a.tip).length <= 30)) add(`${ctx}: tip = ONE short teacher sentence (max 30 words)`);
      if (!(a.support && LEVELS.every((l) => isStr(a.support[l], 8)))) add(`${ctx}: support {l1_2,l3_4,l5_6} required`);
      if (!isArr(a.materials, 0, 4)) add(`${ctx}: materials max 4`);
      checkPayload(a.kind, a.payload, add, ctx);
    });
  }

  const e = studio.exit_ticket;
  if (!(e && isStr(e.prompt, 20) && isStr(e.frame) && isStr(e.model, 30) && e.rubric && ["emerging", "developing", "proficient"].every((k) => isStr(e.rubric[k], 12)))) add("exit_ticket {prompt, frame, model, rubric{emerging,developing,proficient}} required");
  if (!isArr(studio.watchouts, 2, 3) || !studio.watchouts.every((w) => isStr(w.group) && isStr(w.issue, 15) && isStr(w.fix, 15))) add("watchouts: 2-3 {group, issue, fix}");
  if (!(studio.misconception && isStr(studio.misconception.pattern, 15) && isStr(studio.misconception.redirect, 15))) add("misconception {pattern, redirect} required");

  const blob = studentText(studio).join("\n").toLowerCase();
  for (const phrase of BANNED_PHRASES) if (blob.includes(phrase)) add(`contains banned template phrase "${phrase}"`);
  const titleCount = unit.unit_title ? blob.split(unit.unit_title.toLowerCase()).length - 1 : 0;
  if (titleCount > 6) add(`unit title pasted ${titleCount} times (template stuffing)`);

  const limit = AVG_SENTENCE_WORDS[String(unit.grade)] ?? 18;
  const readable = [];
  for (const a of studio.activities || []) {
    readable.push(a.mission);
    const p = a.payload || {};
    if (p.text) readable.push(p.text);
    if (p.model) readable.push(p.model);
  }
  const ss = sentences(readable.join(" "));
  if (ss.length) {
    const avg = ss.reduce((n, s) => n + words(s).length, 0) / ss.length;
    if (avg > limit) add(`student text averages ${avg.toFixed(1)} words/sentence; grade ${unit.grade} max is ${limit}`);
  }
  return problems;
}

// ---------------------------------------------------------------------------------------------
// Family guide (bilingual EN/ES) — one file per unit: db/seeds/bcpss/v2/family/<unitId>.mjs
//   export default { summary, goals?, vocab, talk, try_at_home, say_it, help, home_language, celebrate }
// Audience: caregivers who may not read English well or know the school content. Warm, plain, specific.
// Adults are addressed with "ustedes"/neutral phrasing in Spanish; child lines use "tú". No jargon, no grades/scores.
// ---------------------------------------------------------------------------------------------
const isBi = (v, min = 8) => v && typeof v === "object" && isStr(v.en, min) && isStr(v.es, min) && v.en.trim() !== v.es.trim();

export function validateFamily(unit, studio, family) {
  const problems = [];
  const add = (m) => problems.push(`${unit.id} (family): ${m}`);
  if (!family || typeof family !== "object") return [`${unit.id} (family): missing family content`];
  if (!isBi(family.summary, 40)) add("summary {en, es} (2-3 plain sentences: what your child is learning and why it matters)");
  const terms = (studio?.vocab || []).map((t) => t.term);
  if (!isArr(family.vocab, terms.length, terms.length) || family.vocab.some((v, i) => v.term !== terms[i] || !isStr(v.def_es, 8) || !isStr(v.example_es, 8))) add("vocab must list every studio term in the same order with def_es and example_es (Spanish)");
  if (!isArr(family.talk, 4, 5) || !family.talk.every((t) => isBi(t, 10))) add("talk: 4-5 {en, es} questions to ask at home in any language");
  const t = family.try_at_home;
  if (!isArr(t, 3, 4)) add("try_at_home: 3-4 activities");
  else for (const a of t) if (!(isBi(a.title, 4) && Number.isInteger(a.minutes) && a.minutes >= 3 && a.minutes <= 20 && isBi(a.materials, 3) && a.steps && isArr(a.steps.en, 3, 5) && isArr(a.steps.es, 3, 5) && a.steps.en.length === a.steps.es.length)) add(`try_at_home "${a?.title?.en}": title{en,es}, minutes 3-20, materials{en,es}, steps{en[3-5],es[same length]}`);
  if (!isArr(family.say_it, 3, 4) || !family.say_it.every((s) => isBi(s, 8) && /\[[^\]]+\]|___/.test(s.en))) add("say_it: 3-4 {en, es} sentence starters with a blank ([word] or ___)");
  if (!(family.help && isArr(family.help.en, 3, 4) && isArr(family.help.es, 3, 4) && family.help.en.length === family.help.es.length)) add("help {en[3-4], es[same length]}");
  const g = family.goals; // optional: 2-3 "I can" goals in both languages, same length
  if (g !== undefined && !(g && isArr(g.en, 2, 3) && isArr(g.es, 2, 3) && g.en.length === g.es.length && g.en.every((x) => isStr(x, 10)) && g.es.every((x) => isStr(x, 10)))) add("goals (optional) {en[2-3], es[same length]}: 'I can' goals for the family");
  if (!isBi(family.home_language, 30)) add("home_language {en, es}: a specific suggestion for using the home language for THIS unit");
  if (!isBi(family.celebrate, 15)) add("celebrate {en, es}: what progress looks like at home");
  const blob = JSON.stringify(family).toLowerCase();
  for (const phrase of BANNED_PHRASES) if (blob.includes(phrase)) add(`contains banned phrase "${phrase}"`);
  // Whole-word checks: "esol" must not match inside Spanish "resolver".
  for (const re of [/\besol\b/, /\bwida\b/, /\btier [23]\b/, /\brubric\b/, /\busted\b/]) if (re.test(blob)) add(`contains banned word ${re}`);
  return problems;
}
