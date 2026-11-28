#!/usr/bin/env node
// Math Literacy Studio content gate (docs/math-literacy/architecture.md).
//   node tools/validate-mls.mjs              all grades present on disk
//   node tools/validate-mls.mjs --grade 3    one grade's skill file
//   node tools/validate-mls.mjs --coverage   require every grade, and write content/mls/coverage.json
// Checks the inventory lock (the denominator cannot shrink), the schema of every authored skill, and the claims we refuse to make.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = path.join(ROOT, "access-practice-lab/content/mls");
const LOCK = { skills: 85, roles: 30, engines: 12, manipulatives: 30, games: 12, formats: 4, materials: 22, sequences: 7, collections: 10, concerns: 10, progressions: 10, visualKinds: 30 };
const args = process.argv.slice(2);
const only = args.includes("--grade") ? Number(args[args.indexOf("--grade") + 1]) : 0;
const needAll = args.includes("--coverage");

const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warns.push(`${where}: ${msg}`);

const inv = JSON.parse(fs.readFileSync(path.join(CONTENT, "inventory.json"), "utf8"));
for (const [k, n] of Object.entries(LOCK)) {
  const have = k === "visualKinds" ? inv.visualKinds.length : inv[k].length;
  if (have < n) err("inventory", `${k} shrank: ${have} < locked ${n}. The denominator may not be reduced.`);
  if (inv.counts?.[k] !== have) err("inventory", `counts.${k} (${inv.counts?.[k]}) disagrees with the list (${have})`);
}
const invSkills = new Map(inv.skills.map((s) => [s.id, s]));
for (const s of inv.skills) {
  for (const p of s.prereq) if (!invSkills.has(p)) err(s.id, `prerequisite ${p} is not in the inventory`);
  if (s.prereq.some((p) => invSkills.get(p)?.grade > s.grade)) err(s.id, "prerequisite from a later grade");
}
// no prerequisite cycles
{
  const state = new Map();
  const visit = (id, trail) => {
    if (state.get(id) === 2) return;
    if (state.get(id) === 1) return err("inventory", `prerequisite cycle: ${[...trail, id].join(" > ")}`);
    state.set(id, 1);
    for (const p of invSkills.get(id).prereq) visit(p, [...trail, id]);
    state.set(id, 2);
  };
  for (const id of invSkills.keys()) visit(id, []);
}

const { CONTEXTS } = await import(pathToFileURL(path.join(ROOT, "access-practice-lab/src/mls/kit.js")).href);
const CONTEXT_IDS = new Set(Object.keys(CONTEXTS));
const VIS = new Set(inv.visualKinds);
let FAMILY_IDS = null;
try {
  const fam = await import(pathToFileURL(path.join(ROOT, "access-practice-lab/src/mls/families.js")).href);
  FAMILY_IDS = new Set(Object.keys(fam.FAMILIES));
} catch {
  /* families.js lands later; the family-presence check turns on when it exists */
}

const words = (t) => String(t || "").trim().split(/\s+/).filter(Boolean);
const nWords = (t) => words(t).length;
const str = (v) => typeof v === "string" && v.trim().length > 0;
const arr = (v, lo, hi) => Array.isArray(v) && v.length >= lo && v.length <= hi;
const numerals = (t) => new Set((String(t).replace(/−/g, "-").match(/-?\d[\d,]*(?:\.\d+)?(?:\/\d+)?/g) || []).map((x) => x.replace(/,/g, "")));
const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

// Claims and shortcuts we refuse (architecture.md "Honest limits"; directive sections 6, 9, 17).
const BANNED = [
  [/\bkey ?words?\b/i, "keyword-trick language (the studio teaches structure, not cue words)"],
  [/\bwida level\b|\blevel [1-6] (student|learner|ell|el)\b/i, "assigns or names a proficiency level for a learner"],
  [/\b(special ed|sped|disabled student|low[- ]level|slow learner|low kids|high kids|ell kids)\b/i, "labels learners"],
  [/\bofficial(ly)? (wida|common core|ccss)\b|\bendorsed by\b|\bcertified by\b|\bwriting revolution (certified|approved|official)/i, "implies endorsement or certification"],
  [/\bpurple\b|\bviolet\b/i, "colour outside the palette"],
  [/\bsmart kids\b|\bdumb\b|\bstupid\b|\beasy math\b/i, "belittling language"],
];
const ES_BAD = [
  [/\busted\b/i, "usted form (register: ustedes for grown-ups, tú for students)"],
  [/\b\d+ %/, "spaced percent (write 60%)"],
  [/\b(the|and|your|with|this|that|have|what)\b/i, "English words left in Spanish text"],
  [/\bel entero\b|\bel todo\b/i, 'the whole is "el total"'],
];

function checkText(where, text) {
  for (const [re, why] of BANNED) if (re.test(text)) err(where, `${why}: "${(text.match(re) || [""])[0]}"`);
}

function checkSkill(sk, inv0, grade) {
  const w = sk.id;
  const need = (field, ok, msg) => {
    if (!ok) err(w, `${field}: ${msg}`);
  };
  for (const f of ["objective", "studentObjective", "languageObjective", "bigIdea"]) need(f, str(sk[f]), "required text");
  need("studentObjective", /^I can /.test(sk.studentObjective || ""), 'starts with "I can"');
  need("languageObjective", /^I will /.test(sk.languageObjective || ""), 'starts with "I will"');
  need("successCriteria", arr(sk.successCriteria, 3, 4) && sk.successCriteria.every(str), "3-4 observable strings");
  need("keyLanguageUses", arr(sk.keyLanguageUses, 1, 4) && sk.keyLanguageUses.every((k) => ["Narrate", "Inform", "Explain", "Argue"].includes(k)), "from Narrate/Inform/Explain/Argue");
  const ld = sk.languageDemands || {};
  need("languageDemands", arr(ld.vocabulary, 2, 3) && arr(ld.syntax, 1, 3) && arr(ld.discourse, 1, 2), "vocabulary 2-3, syntax 1-3, discourse 1-2");
  const dm = sk.domains || {};
  for (const d of ["listening", "speaking", "reading", "writing"]) need(`domains.${d}`, str(dm[d]), "one sentence required");

  need("vocab", arr(sk.vocab, 4, 6), "4-6 terms");
  const seenTerms = new Set();
  for (const v of sk.vocab || []) {
    const vw = `${w} vocab "${v.term}"`;
    for (const f of ["term", "def", "example", "nonExample", "sentence"]) if (!str(v[f])) err(vw, `${f} required`);
    if (!["content", "academic", "symbol", "multiple-meaning", "comparison", "spatial"].includes(v.kind)) err(vw, "bad kind");
    if (nWords(v.def) > 18) err(vw, `definition is ${nWords(v.def)} words (max 18)`);
    if (v.kind === "multiple-meaning" && !str(v.everyday)) err(vw, "multiple-meaning needs everyday");
    if (seenTerms.has(String(v.term).toLowerCase())) err(vw, "duplicate term");
    seenTerms.add(String(v.term).toLowerCase());
    if (v.visual && !VIS.has(v.visual.kind)) err(vw, `unknown visual kind ${v.visual?.kind}`);
    if (v.cognateEs != null && !str(v.cognateEs)) err(vw, "cognateEs must be text or null");
    if (str(v.sentence) && !new RegExp(String(v.term).replace(/[^\w\s-]/g, "").split(" ")[0], "i").test(v.sentence) && v.kind !== "symbol") warn(vw, "sentence may not contain the term");
  }
  if (!(sk.vocab || []).some((v) => v.kind === "multiple-meaning" || v.kind === "academic" || v.kind === "comparison")) warn(w, "no multiple-meaning, academic or comparison term (the framework asks for precise vs everyday language)");

  need("misconceptions", arr(sk.misconceptions, 3, 4), "3-4 misconceptions");
  let withCase = 0;
  for (const m of sk.misconceptions || []) {
    const mw = `${w} misconception ${m.id}`;
    for (const f of ["id", "belief", "why", "fix"]) if (!str(m[f])) err(mw, `${f} required`);
    if (!["conceptual", "procedural", "reading", "language"].includes(m.root)) err(mw, "root must be conceptual, procedural, reading or language");
    if (m.errorCase) {
      withCase++;
      const e = m.errorCase;
      if (!str(e.story) || !arr(e.steps, 2, 4) || !e.steps.every(str) || !str(e.explain)) err(mw, "errorCase needs story, 2-4 steps, explain");
      if (!Number.isInteger(e.firstWrong) || e.firstWrong < 0 || e.firstWrong >= (e.steps || []).length) err(mw, "errorCase.firstWrong must index a step");
    }
  }
  if (withCase < 2) err(w, "at least 2 misconceptions need an errorCase");
  if (new Set((sk.misconceptions || []).map((m) => m.id)).size !== (sk.misconceptions || []).length) err(w, "duplicate misconception ids");
  if (!(sk.misconceptions || []).some((m) => ["reading", "language"].includes(m.root)) && grade >= 3) warn(w, "no reading or language misconception (teachers need to tell language barriers from math barriers)");

  const r = sk.reading || {};
  need("reading.title", str(r.title), "required");
  need("reading.text", nWords(r.text) >= 85 && nWords(r.text) <= 150, `85-150 words (got ${nWords(r.text)})`);
  need("reading.simple", nWords(r.simple) >= 55 && nWords(r.simple) <= 95 && nWords(r.simple) < nWords(r.text), `55-95 words and shorter than text (got ${nWords(r.simple)})`);
  if (str(r.text) && str(r.simple) && !sameSet(numerals(r.text), numerals(r.simple))) err(w, `reading.simple changes the numbers: [${[...numerals(r.simple)]}] vs [${[...numerals(r.text)]}]`);
  need("reading.questions", arr(r.questions, 3, 3) && r.questions.every((q) => str(q.q) && str(q.a) && ["literal", "inference", "math"].includes(q.kind)), "3 questions with kind");
  const termsUsed = (sk.vocab || []).filter((v) => new RegExp(`\\b${String(v.term).split(" ")[0].replace(/[^\w-]/g, "")}`, "i").test(r.text || "")).length;
  if (termsUsed < 3) err(w, `reading.text uses only ${termsUsed} vocabulary terms (needs 3+)`);

  const d = sk.discourse || {};
  need("discourse.wdntb", arr(d.wdntb?.items, 4, 4) && Number.isInteger(d.wdntb?.odd) && d.wdntb.odd >= 0 && d.wdntb.odd < 4 && str(d.wdntb?.why), "4 items, odd index, why");
  need("discourse.noticeWonder", str(d.noticeWonder?.prompt), "prompt");
  need("discourse.asn", arr(d.asn, 2, 2) && d.asn.every((a) => str(a.claim) && ["always", "sometimes", "never"].includes(a.verdict) && str(a.why)), "2 claims with verdict and why");
  need("discourse.wyr", str(d.wyr?.q) && str(d.wyr?.a) && str(d.wyr?.b), "q, a, b");
  need("discourse.compare", str(d.compare?.a) && str(d.compare?.b) && str(d.compare?.prompt), "a, b, prompt");
  need("discourse.debate", str(d.debate?.claim) && str(d.debate?.forEvidence) && str(d.debate?.againstEvidence), "claim, forEvidence, againstEvidence");

  const l = sk.listening || {};
  need("listening.script", nWords(l.script) >= 55 && nWords(l.script) <= 120, `55-120 words (got ${nWords(l.script)})`);
  need("listening.tasks", arr(l.tasks, 2, 2) && l.tasks.every((t) => ["identify", "match", "error", "build"].includes(t.type) && str(t.q) && arr(t.options, 3, 4) && Number.isInteger(t.answer) && t.answer >= 0 && t.answer < t.options.length && str(t.why)), "2 tasks with type, options (3-4), answer index, why");

  const s = sk.story || {};
  need("story", ["title", "character", "setting", "goal", "intro", "ending"].every((f) => str(s[f])) && arr(s.beats, 3, 3) && s.beats.every((b) => str(b.lead) && str(b.success) && str(b.redirect)), "title, character, setting, goal, intro, ending, 3 beats {lead, success, redirect}");
  const c = sk.comic || {};
  need("comic", arr(c.cast, 2, 2) && arr(c.panels, 4, 5) && c.panels.every((p) => c.cast.includes(p.who) && str(p.says)) && str(c.predict?.q) && arr(c.predict?.options, 3, 3) && Number.isInteger(c.predict?.answer) && c.predict.answer >= 0 && c.predict.answer < 3 && str(c.predict?.why), "cast of 2, 4-5 panels spoken by the cast, predict {q, 3 options, answer, why}");
  const t = sk.transfer || {};
  need("transfer", str(t.relationship) && arr(t.phrasings, 4, 4) && t.phrasings.every(str) && arr(t.decoys, 2, 2) && t.decoys.every((x) => str(x.text) && str(x.why)), "relationship, 4 phrasings, 2 decoys {text, why}");
  if (arr(t.phrasings, 4, 4) && new Set(t.phrasings.map((x) => x.toLowerCase())).size < 4) err(w, "transfer phrasings repeat");
  const mo = sk.modeling || {};
  need("modeling", str(mo.title) && str(mo.scenario) && arr(mo.given, 1, 8) && mo.given.every((g) => str(g.label) && g.value != null) && arr(mo.assumptions, 3, 3) && arr(mo.prompts, 3, 3) && arr(mo.limits, 2, 2), "title, scenario, given[], 3 assumptions, 3 prompts, 2 limits");
  const se = sk.sentence || {};
  need("sentence", ["base", "because", "but", "so"].every((f) => str(se[f])) && arr(se.targets, 2, 2), "base, because, but, so, 2 targets");
  if (str(se.because) && !/\bbecause\b/i.test(se.because)) err(w, 'sentence.because must contain "because"');
  if (str(se.but) && !/\bbut\b/i.test(se.but)) err(w, 'sentence.but must contain "but"');
  if (str(se.so) && !/\bso\b/i.test(se.so)) err(w, 'sentence.so must contain "so"');
  const dg = sk.diagnostic || {};
  need("diagnostic", str(dg.prompt) && arr(dg.lookFor, 2, 3) && str(dg.language), "prompt, 2-3 lookFor, language check");
  need("extension", str(sk.extension?.task) && str(sk.extension?.reasoning), "task and reasoning");
  const fam = sk.family || {};
  for (const lang of ["en", "es"]) {
    const f = fam[lang] || {};
    for (const k of ["learning", "say", "ask", "activity"]) {
      if (!str(f[k])) err(w, `family.${lang}.${k} required`);
      else if (lang === "en" && /\b[1-8]\.[A-Z]{2,3}\.[A-Z]\.\d\b|\bCCSS\b|\bWIDA\b/.test(f[k])) err(w, `family.en.${k} mentions standards codes or WIDA (families should not need them)`);
    }
  }
  for (const k of ["learning", "say", "ask", "activity"]) {
    const es = fam.es?.[k];
    if (!str(es)) continue;
    for (const [re, why] of ES_BAD) if (re.test(es)) err(w, `family.es.${k}: ${why}`);
    if (fam.en?.[k] && es.trim() === fam.en[k].trim()) err(w, `family.es.${k} is a copy of the English`);
  }
  need("contexts", arr(sk.contexts, 3, 6) && sk.contexts.every((x) => CONTEXT_IDS.has(x)), `3-6 ids from ${[...CONTEXT_IDS].join(", ")}`);
  if (FAMILY_IDS && needAll && !FAMILY_IDS.has(inv0.family)) err(w, `inventory family "${inv0.family}" has no generator in src/mls/families.js`);

  checkText(w, JSON.stringify(sk).replace(/"[A-Za-z]+":/g, " "));
}

// ---- load grade files
const files = fs.existsSync(path.join(CONTENT, "skills")) ? fs.readdirSync(path.join(CONTENT, "skills")).filter((f) => /^g[1-8]\.json$/.test(f)) : [];
const loaded = new Map();
for (const f of files) {
  const g = Number(f[1]);
  if (only && g !== only) continue;
  let data;
  try {
    data = JSON.parse(fs.readFileSync(path.join(CONTENT, "skills", f), "utf8"));
  } catch (e) {
    err(f, `invalid JSON: ${e.message}`);
    continue;
  }
  if (data.grade !== g) err(f, `grade field is ${data.grade}`);
  loaded.set(g, data);
}
const wantGrades = only ? [only] : needAll ? [1, 2, 3, 4, 5, 6, 7, 8] : [...loaded.keys()];
for (const g of wantGrades) {
  const data = loaded.get(g);
  if (!data) {
    err(`g${g}.json`, "missing grade file");
    continue;
  }
  const expected = inv.skills.filter((s) => s.grade === g).map((s) => s.id);
  const got = (data.skills || []).map((s) => s.id);
  for (const id of expected) if (!got.includes(id)) err(`g${g}.json`, `missing skill ${id}`);
  for (const id of got) if (!expected.includes(id)) err(`g${g}.json`, `skill ${id} is not in the inventory for grade ${g}`);
  if (new Set(got).size !== got.length) err(`g${g}.json`, "duplicate skill id");
  for (const sk of data.skills || []) if (invSkills.has(sk.id)) checkSkill(sk, invSkills.get(sk.id), g);
}

// ---- originality: no long sentence may appear in two different skills (templated filler is the failure this catches)
{
  const seen = new Map();
  for (const data of loaded.values())
    for (const sk of data.skills || []) {
      const bag = [sk.reading?.text, sk.listening?.script, sk.story?.intro, sk.modeling?.scenario, ...(sk.comic?.panels || []).map((p) => p.says), sk.diagnostic?.prompt, sk.extension?.task, sk.family?.en?.learning, sk.family?.en?.activity].filter(Boolean);
      for (const sentence of bag.join(" ").split(/(?<=[.!?])\s+/)) {
        const key = sentence.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
        if (key.split(" ").length < 9) continue;
        if (seen.has(key) && seen.get(key) !== sk.id) err(sk.id, `sentence repeated from ${seen.get(key)}: "${sentence.slice(0, 70)}..."`);
        else seen.set(key, sk.id);
      }
    }
}

// ---- coverage report
if (needAll && !errors.length) {
  const roles = inv.roles.map((r) => r.id);
  const authored = [...loaded.values()].flatMap((d) => d.skills).length;
  const rep = {
    generatedBy: "tools/validate-mls.mjs --coverage",
    inventory: inv.counts,
    skillsAuthored: authored,
    skillsTarget: inv.skills.length,
    perGrade: Object.fromEntries([...loaded].map(([g, d]) => [g, `${d.skills.length}/${inv.skills.filter((s) => s.grade === g).length}`])),
    roles,
    warnings: warns.length,
  };
  fs.writeFileSync(path.join(CONTENT, "coverage-content.json"), `${JSON.stringify(rep, null, 1)}\n`);
}

for (const w of warns.slice(0, 40)) console.log(`warn  ${w}`);
if (warns.length > 40) console.log(`warn  ... ${warns.length - 40} more warnings`);
if (errors.length) {
  for (const e of errors.slice(0, 80)) console.error(`FAIL  ${e}`);
  if (errors.length > 80) console.error(`FAIL  ... ${errors.length - 80} more`);
  console.error(`validate-mls: ${errors.length} problem(s)`);
  process.exit(1);
}
const n = [...loaded.values()].reduce((a, d) => a + (d.skills?.length || 0), 0);
console.log(`validate-mls: OK (inventory locked at ${inv.skills.length} skills; ${n} authored skills validated across ${loaded.size} grade file(s); ${warns.length} warning(s))`);
