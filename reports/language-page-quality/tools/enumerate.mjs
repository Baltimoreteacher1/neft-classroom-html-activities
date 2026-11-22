#!/usr/bin/env node
/**
 * Language Page inventory builder (read-only over the product; writes only under reports/language-page-quality/).
 *
 *   node reports/language-page-quality/tools/enumerate.mjs [--crawl <crawl-baseline.json>]
 *
 * Sources of truth read: src/main.js (router + VIEW_LOADERS), src/sitemap.js (DESTINATIONS),
 * src/home-registry.js, src/studio-app.js, content/**.json, src/content/*.js, src/book/templates*.js,
 * the static sibling sites (language-adventures, language-studio, esol, wida-access, vocab-hub,
 * esol-reading-writing, access-teacher, family tour/expedition).
 *
 * Output: inventory.json (families + activities + routes + untestable) and inventory.md (summary).
 * Content-quality flags are MEASURED from the content files (counts, word lengths, option shapes), never guessed.
 * When a crawl file is supplied (or crawl-baseline.json exists) its measured a11y / mobile / console results are merged in.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const HERE = import.meta.dirname;
const OUT = path.resolve(HERE, "..");
const ROOT = path.resolve(OUT, "../..");
const LAB = path.join(ROOT, "access-practice-lab");
const CONTENT = path.join(LAB, "content");
const BASE = "/access-practice-lab";
const args = process.argv.slice(2);
const crawlPath = args.includes("--crawl") ? args[args.indexOf("--crawl") + 1] : path.join(OUT, "crawl-baseline.json");

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const exists = (p) => fs.existsSync(p);
const safe = (fn, dflt) => { try { return fn(); } catch { return dflt; } };
const L = (v) => (Array.isArray(v) ? v[0] : v && typeof v === "object" ? v.en ?? "" : v ?? "");
const words = (s) => (typeof s === "string" ? (s.match(/[\p{L}\p{N}'’-]+/gu) || []).length : 0);
const plain = (v) => (typeof v === "string" ? v : Array.isArray(v) ? v.map(plain).join(" ") : v && typeof v === "object" ? Object.values(v).map(plain).join(" ") : "");
const walkFiles = (dir, pred = () => true, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "_next") walkFiles(p, pred, out); }
    else if (pred(p)) out.push(p);
  }
  return out;
};
const git = (c) => safe(() => execSync(`git -C "${ROOT}" ${c}`, { encoding: "utf8" }).trim(), "");

// ---------------------------------------------------------------- router (parsed from source)
const mainSrc = fs.readFileSync(path.join(LAB, "src/main.js"), "utf8");
const VIEW_LOADERS = {};
for (const m of mainSrc.matchAll(/^\s*"?([\w-]+)"?:\s*\(\)\s*=>\s*import\("([^"]+)"\)/gm)) VIEW_LOADERS[m[1]] = m[2];
const VIEW_ALIASES = {};
const aliasBlock = mainSrc.match(/const VIEW_ALIASES = \{([\s\S]*?)\};/)?.[1] || "";
for (const m of aliasBlock.matchAll(/"?([\w-]+)"?:\s*"([\w-]+)"/g)) VIEW_ALIASES[m[1]] = m[2];
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"];
// first path segment -> loader key (mirrors parseRoute for the segments that differ from their view name)
const SEG_VIEW = { reading: "reading", "reading-room": "reading", print: "book-studio", "print-studio": "book-studio", strategies: "program", live: "program",
  "science-of-reading": "science-of-reading", subject: "subject-reading", "vocab-curriculum": "vocab-curriculum", "access-prep": "access-prep", class: "class", play: "activity", mission: "missions" };
const viewFileFor = (seg) => {
  if (DOMAINS.includes(seg)) return `${BASE.slice(1)}/src/views/room.js + views/activity.js`;
  const key = SEG_VIEW[seg] || VIEW_ALIASES[seg] || seg;
  const file = VIEW_LOADERS[key] || VIEW_LOADERS[VIEW_ALIASES[key]];
  return file ? `access-practice-lab/src/${file.replace("./", "")}` : null;
};

// ---------------------------------------------------------------- registries
const sitemap = await import(pathToFileURL(path.join(LAB, "src/sitemap.js")));
const { DESTINATIONS, SECTIONS } = sitemap;
const sectionTitle = Object.fromEntries(SECTIONS.map((s) => [s.id, L(s.title)]));
const homeReg = safe(() => readJson, null); // home-registry is checked via its HOME_CARDS export below
const home = await import(pathToFileURL(path.join(LAB, "src/home-registry.js"))).catch(() => ({}));
const studioApp = await import(pathToFileURL(path.join(LAB, "src/studio-app.js"))).catch(() => ({}));

// ---------------------------------------------------------------- core activity bank (measured)
const BANDS = ["gK", "g1", "g2-3", "g3-5", "g6-8"];
const BAND_LABEL = { gK: "K", g1: "1", "g2-3": "2-3", "g3-5": "3-5", "g6-8": "6-8" };
const BAND_QUERY = { gK: "K", g1: "1", "g2-3": "2-3", "g3-5": "3-5", "g6-8": "6-8" };
const GENERIC_CORRECT = /^(correct|yes|right|great|good|nice|well done|good job|that'?s right|you got it)[!. ]*$/i;
const TYPE_TEMPLATE = {
  multipleChoice: "views/activity.js (choice card)", multiSelect: "views/activity.js (multi-select)", order: "views/activity.js (order list)",
  cloze: "views/activity.js (cloze)", sort: "views/activity.js (sort)", hotText: "views/activity.js (hot text)",
  constructed: "views/activity.js (constructed response + recorder)", worksheet: "views/activity.js (printable worksheet)",
};

const ES_GUIDE = safe(() => readJson(path.join(CONTENT, "es-guide.json")).activities, {});
const ES_STR = safe(() => readJson(path.join(CONTENT, "es-strings.json")).strings, {});
function activityMetrics(a) {
  const opts = a.options || [];
  const optTexts = opts.map((o) => String(o.text ?? "").trim().toLowerCase());
  const answerIds = a.type === "multiSelect" ? a.answers || [] : a.answer != null ? [a.answer] : [];
  const lens = opts.map((o) => words(o.text));
  const correctIdx = opts.map((o, i) => (answerIds.includes(o.id) ? i : -1)).filter((i) => i >= 0);
  const maxLen = Math.max(0, ...lens);
  const wrongFb = a.distractorFeedback ? Object.keys(a.distractorFeedback).length : 0;
  const wrongCount = opts.length - answerIds.length;
  const itemFb = a.itemFeedback ? Object.keys(a.itemFeedback).length : 0;
  const m = {
    dirWords: words(a.directions), promptWords: words(a.prompt), correctWords: words(a.correct),
    genericCorrect: typeof a.correct === "string" && (GENERIC_CORRECT.test(a.correct.trim()) || words(a.correct) < 4),
    hasHint: !!a.hint, hasSupport: !!a.support, hintEqSupport: !!a.hint && a.hint === a.support,
    vocab: (a.vocabulary || []).length, vocabNoEs: (a.vocabulary || []).filter((v) => !v?.[2]).length,
    frames: (a.frames || []).length, wida: (a.wida || []).length, hasEsDir: !!a.directionsEs || !!ES_GUIDE[a.id]?.directions || !!ES_GUIDE[a.id]?.goal,
    esFeedbackShare: (() => { const ss = [a.correct, a.hint, a.support].filter((x) => typeof x === "string" && x); return ss.length ? ss.filter((x) => ES_STR[x]).length / ss.length : 1; })(),
    passageWords: words(plain(a.passage)), scriptWords: words(a.script),
    nOptions: opts.length,
    dupOptions: optTexts.length !== new Set(optTexts).size,
    correctLongest: opts.length >= 3 && correctIdx.length === 1 && lens[correctIdx[0]] === maxLen && lens.filter((l) => l === maxLen).length === 1 && maxLen - Math.max(...lens.filter((_, i) => i !== correctIdx[0])) >= 3,
    correctPos: correctIdx.length === 1 ? correctIdx[0] : null,
    wrongFeedbackShare: ["multipleChoice", "multiSelect", "hotText"].includes(a.type) ? (wrongCount > 0 ? Math.min(1, wrongFb / wrongCount) : 1) : null,
    itemFeedback: ["order", "cloze", "sort"].includes(a.type) ? itemFb > 0 : null,
    hasCriteria: a.type === "constructed" ? !!(a.successCriteria || a.selfCheck || a.sayFor || a.writeFor) : null,
    hasModel: a.type === "constructed" ? !!(a.models || a.modelStudent || a.model) : null,
    hasTeacher: !!a.teacher,
  };
  return m;
}
function activityIssues(a, m) {
  const out = [];
  if (m.dirWords > 28) out.push("directions-long");
  if (m.genericCorrect) out.push("generic-correct-feedback");
  if (m.hintEqSupport) out.push("hint-equals-support");
  if (!m.hasHint) out.push("no-hint");
  if (m.wrongFeedbackShare !== null && m.wrongFeedbackShare < 1) out.push("missing-distractor-feedback");
  if (m.itemFeedback === false) out.push("no-item-feedback");
  if (m.dupOptions) out.push("duplicate-options");
  if (m.correctLongest) out.push("answer-is-longest-clue");
  if (m.vocab < 2) out.push("thin-vocabulary");
  if (m.vocabNoEs > 0) out.push("vocab-missing-es");
  if (!m.wida) out.push("no-wida-tag");
  if (!m.hasEsDir) out.push("no-es-directions");
  if (m.esFeedbackShare < 1) out.push("feedback-missing-es");
  if (a.type === "constructed" && !m.hasCriteria) out.push("constructed-no-success-criteria");
  return out;
}
const CORE_ISSUE_P1 = new Set(["generic-correct-feedback", "missing-distractor-feedback", "no-item-feedback", "duplicate-options", "answer-is-longest-clue", "constructed-no-success-criteria"]);

const coreActivities = [];
const coreByFamily = {};
for (const band of BANDS) {
  const dir = path.join(CONTENT, band);
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
    const j = readJson(path.join(dir, f));
    for (const [lvl, lv] of Object.entries(j.levels || {})) {
      for (const a of lv.activities || []) {
        const m = activityMetrics(a);
        const issues = activityIssues(a, m);
        const fam = `core-${band}-${j.domain}`;
        const rec = {
          id: a.id, family: fam, url: `${BASE}/${j.domain}/${lvl}/${a.id}?grades=${BAND_QUERY[band]}`,
          program: "Core practice bank", type: a.type, gradeBand: BAND_LABEL[band], level: lvl, domain: j.domain,
          wida: a.wida || [], objective: a.skill || a.title, title: a.title,
          contentSource: `access-practice-lab/content/${band}/${j.domain}.json`, template: TYPE_TEMPLATE[a.type] || "views/activity.js",
          feedback: m.wrongFeedbackShare !== null ? (m.wrongFeedbackShare >= 1 ? "per-distractor" : "partial") : m.itemFeedback ? "per-item" : a.type === "constructed" ? "criteria/model" : "generic",
          issues, action: issues.length ? "content-fix" : "none",
          priority: issues.some((i) => CORE_ISSUE_P1.has(i)) ? "P1" : issues.length ? "P2" : "P3",
          verification: "content metrics (static); template rendered by crawler probe core-" + a.type,
        };
        coreActivities.push(rec);
        (coreByFamily[fam] ||= []).push({ rec, m, a });
      }
    }
  }
}
const pct = (arr, f) => (arr.length ? Math.round((arr.filter(f).length / arr.length) * 100) : 0);
const avg = (arr, f) => (arr.length ? Math.round((arr.reduce((s, x) => s + f(x), 0) / arr.length) * 10) / 10 : 0);
function aggregate(rows) {
  const mcish = rows.filter((r) => r.m.wrongFeedbackShare !== null);
  const typed = {};
  for (const r of rows) typed[r.a.type] = (typed[r.a.type] || 0) + 1;
  const posCounts = [0, 0, 0, 0];
  for (const r of rows) if (r.m.correctPos !== null && r.m.correctPos < 4) posCounts[r.m.correctPos]++;
  return {
    n: rows.length, types: typed,
    avgDirectionsWords: avg(rows, (r) => r.m.dirWords), directionsOver28Pct: pct(rows, (r) => r.m.dirWords > 28),
    avgCorrectFeedbackWords: avg(rows, (r) => r.m.correctWords), genericCorrectPct: pct(rows, (r) => r.m.genericCorrect),
    hintPct: pct(rows, (r) => r.m.hasHint), hintEqualsSupportPct: pct(rows, (r) => r.m.hintEqSupport),
    distractorFeedbackFullPct: mcish.length ? pct(mcish, (r) => r.m.wrongFeedbackShare >= 1) : null,
    itemFeedbackPct: pct(rows.filter((r) => r.m.itemFeedback !== null), (r) => r.m.itemFeedback),
    constructedWithCriteriaPct: pct(rows.filter((r) => r.a.type === "constructed"), (r) => r.m.hasCriteria),
    answerLongestCluePct: pct(mcish, (r) => r.m.correctLongest), dupOptionsPct: pct(mcish, (r) => r.m.dupOptions),
    correctPositionCounts: posCounts,
    vocabGE2Pct: pct(rows, (r) => r.m.vocab >= 2), widaTagPct: pct(rows, (r) => r.m.wida > 0), esDirectionsPct: pct(rows, (r) => r.m.hasEsDir), esFeedbackPct: Math.round(avg(rows, (r) => r.m.esFeedbackShare * 100)),
    avgFrames: avg(rows, (r) => r.m.frames), avgPassageWords: avg(rows.filter((r) => r.m.passageWords), (r) => r.m.passageWords),
    withPassage: rows.filter((r) => r.m.passageWords > 0).length,
  };
}

// ---------------------------------------------------------------- other enumerable content
const people = (v) => String(L(v) || "").replace(/\s+/g, " ").trim();
const glob = (rel, pred) => walkFiles(path.join(CONTENT, rel), pred || ((p) => p.endsWith(".json"))).sort();
const J = (rel) => readJson(path.join(CONTENT, rel));

const acts = []; // non-core activity records
const push = (r) => acts.push({ gradeBand: "", wida: [], feedback: "unknown", issues: [], action: "review", priority: "P2", verification: "static enumeration", ...r });

// practice tests
for (const f of glob("tests")) {
  const j = readJson(f); const id = j.id || path.basename(f, ".json");
  const items = (j.sections || []).reduce((n, s) => n + (s.items || []).length, 0);
  push({ id, family: "tests", url: `${BASE}/test/${id}`, program: "Road to ACCESS", type: "practice-test", gradeBand: j.gradeCluster || j.band || "",
    objective: people(j.title), contentSource: `content/tests/${path.basename(f)}`, template: "views/test.js + test-modes/test-report", feedback: "report", itemCount: items, domain: j.domain || "all" });
}
// assess + bank sets
for (const f of glob("assess").filter((p) => /starter/.test(p))) {
  const j = readJson(f);
  push({ id: j.id, family: "assess", url: `${BASE}/assess/${j.id}`, program: "Road to ACCESS", type: "skill-check-in", gradeBand: j.grade, objective: people(j.title),
    contentSource: `content/assess/${path.basename(f)}`, template: "views/assess.js", feedback: "answer-level", itemCount: (j.items || []).length });
}
const bankIndex = safe(() => J("bank/index.json"), { sets: [] });
for (const s of bankIndex.sets || []) push({ id: s.id, family: "assess-bank", url: `${BASE}/assess/${s.id}`, program: "ACC bank", type: "item-bank-set", gradeBand: s.grade || "", objective: people(s.title || s.id),
  contentSource: `content/bank/${s.id}.json`, template: "views/assess.js (bank set)", feedback: "explanation", itemCount: s.items || s.itemCount || null });
// studio tasks
for (const t of safe(() => J("studio/speaking.json").tasks, [])) push({ id: t.id, family: "speak", url: `${BASE}/speak/${t.id}`, program: "Speaking Studio", type: t.taskType || "speaking-task", gradeBand: t.band, wida: [t.keyUse].filter(Boolean), objective: people(t.title), contentSource: "content/studio/speaking.json", template: "views/speak.js", feedback: "rubric-criteria (rule-based on transcript)" });
for (const t of safe(() => J("studio/writing.json").tasks, [])) push({ id: t.id, family: "write", url: `${BASE}/write/${t.id}`, program: "Writing Studio", type: t.form || "writing-task", gradeBand: t.band, wida: [t.keyUse].filter(Boolean), objective: people(t.title), contentSource: "content/studio/writing.json", template: "views/write.js", feedback: "rule-based on learner's own sentences" });
for (const [id, p] of Object.entries(safe(() => J("detective/patterns.json").patterns, {}))) push({ id, family: "detective", url: `${BASE}/detective/${id}`, program: "Error Detective", type: "error-pattern case", objective: people(p.title || p.name || id), contentSource: "content/detective/patterns.json", template: "views/detective.js", feedback: "explainable-pattern" });
for (const f of glob("missions")) { const j = readJson(f); push({ id: j.id, family: "missions", url: `${BASE}/missions/${j.id}`, program: "Academic missions", type: "mission", gradeBand: j.band, objective: people(j.title), contentSource: `content/missions/${path.basename(f)}`, template: "views/missions.js", feedback: "stage-by-stage + ledger" }); }
for (const l of safe(() => J("reading-room/lessons.json").lessons, [])) push({ id: l.id, family: "reading-room", url: `${BASE}/reading-room/${l.id}`, program: "Reading Room", type: "reading-lesson", gradeBand: l.gradeCluster, wida: [l.keyUse].filter(Boolean), objective: people(l.title), contentSource: "content/reading-room/lessons.json", template: "views/reading-room.js", feedback: "per-activity" });
for (const l of safe(() => J("reading-room/strategy-lessons.json").lessons, [])) push({ id: l.id, family: "reading-room-strategy", url: `${BASE}/reading-room/${l.id}`, program: "Reading Room", type: "strategy-lesson", gradeBand: l.gradeCluster || "", objective: people(l.title), contentSource: "content/reading-room/strategy-lessons.json", template: "views/reading-room.js", feedback: "per-activity" });
for (const l of safe(() => J("reading-room/adventures.json").stories, [])) push({ id: l.id, family: "reading-room-adventures", url: `${BASE}/reading-room/${l.id}`, program: "Reading Room", type: "illustrated adventure story", objective: people(l.title), contentSource: "content/reading-room/adventures.json", template: "views/reading-room.js", feedback: "checkpoints" });
for (const p of safe(() => J("ladder/passages.json").passages, [])) push({ id: p.id, family: "ladder", url: `${BASE}/ladder/${p.id}`, program: "Reading Ladder", type: "leveled passage", objective: people(p.title), contentSource: "content/ladder/passages.json + leveled.json", template: "views/ladder.js", feedback: "question-level" });
for (const p of safe(() => J("grammar/packs.json").packs, [])) push({ id: p.id, family: "grammar", url: `${BASE}/grammar/${p.id}`, program: "Grammar", type: "grammar-pack", objective: people(p.title || p.id), contentSource: "content/grammar/packs.json", template: "views/grammar.js", feedback: "item-level" });
for (const p of safe(() => J("puzzles/puzzles.json").puzzles, [])) push({ id: p.id, family: "puzzles", url: `${BASE}/puzzles`, program: "Puzzles", type: p.type, gradeBand: p.band, objective: people(p.title), contentSource: "content/puzzles/puzzles.json", template: "views/puzzles.js", feedback: "hints[] then reveal" });
for (const f of glob("games")) { const j = readJson(f); push({ id: j.id, family: "games", url: `${BASE}/games/${j.id}`, program: "Games hub", type: j.mechanic || "game", objective: j.id, contentSource: `content/games/${path.basename(f)}`, template: `src/games/${j.id}.js`, feedback: "game-specific" }); }
for (const m of safe(() => J("quest/index.json").missions, [])) push({ id: m.id, family: "quest", url: `${BASE}/quest/${m.id}`, program: "Quest", type: "mission", objective: people(m.title || m.id), contentSource: "content/quest/index.json", template: "views/quest.js + src/quest/*", feedback: "step-level" });
for (const u of [["g3-5", "3-5"], ["g6-8", "6-8"]]) for (const un of safe(() => J(`units/${u[0]}.json`).units, [])) push({ id: `${u[0]}-${un.id}`, family: "units", url: `${BASE}/units/${un.id}?grades=${u[1]}`, program: "Units", type: "unit", gradeBand: u[1], objective: people(un.title), contentSource: `content/units/${u[0]}.json`, template: "views/units*.js", feedback: "lesson-level" });
for (const p of safe(() => J("program/strategies.json").strategies, [])) push({ id: p.id, family: "el-program", url: `${BASE}/program/${p.id}`, program: "EL Program", type: "strategy", objective: people(p.title || p.name || p.id), contentSource: "content/program/strategies.json", template: "views/program.js", feedback: "teacher-guide" });
for (const [file, key] of [["twr", null]]) for (const f of glob("twr", (p) => p.endsWith(".json"))) { const j = readJson(f); const strat = path.basename(f, ".json"); const grade = path.basename(path.dirname(f)); if (!j.sets) continue; push({ id: `twr-${grade}-${strat}`, family: "twr", url: `${BASE}/twr/${strat}?grades=${grade}`, program: "Teach with Rigor (TWR)", type: "sentence strategy", gradeBand: grade, objective: strat, contentSource: `content/twr/${grade}/${strat}.json (${j.sets.length} sets)`, template: "views/twr.js + src/twr/*", feedback: "item-level", itemCount: j.sets.length }); }
for (const f of safe(() => fs.readdirSync(path.join(CONTENT, "prep")), [])) { const j = J(`prep/${f}`); const id = f.replace(".json", ""); push({ id, family: "access-prep", url: `${BASE}/access-prep/${id}`, program: "Access Prep", type: "skill builder", objective: id, contentSource: `content/prep/${f}`, template: "views/access-prep.js + src/prep/view.js", feedback: "set-level" }); }
for (const f of safe(() => fs.readdirSync(path.join(CONTENT, "reading-path")).filter((x) => x.endsWith(".json") && x !== "phonics-scope.json"), [])) { const j = J(`reading-path/${f}`); push({ id: j.id || f, family: "reading-path", url: `${BASE}/reading-path/${j.id || f.replace(".json", "")}`, program: "Reading Path", type: "decodable unit", objective: people(j.title || j.unit || f), contentSource: `content/reading-path/${f}`, template: "reading-path/view.js", feedback: "per-page", itemCount: (j.pages || []).length }); }
for (const f of safe(() => fs.readdirSync(path.join(CONTENT, "packs")), [])) { const j = J(`packs/${f}`); push({ id: j.id || f, family: "newcomer-packs", url: `${BASE}/packs/${j.id || f.replace(".json", "")}`, program: "Newcomer packs", type: "printable pack", objective: people(j.title || f), contentSource: `content/packs/${f}`, template: "views/packs.js", feedback: "print/none" }); }
const mod = async (rel) => safe(() => null, null);
const imp = async (rel) => import(pathToFileURL(path.join(LAB, "src", rel))).catch(() => ({}));
const city = await imp("content/city.js"); for (const m of city.MISSIONS || []) push({ id: m.id, family: "city", url: `${BASE}/city/${m.place}/${m.id}`, program: "Language City", type: "branching mission", objective: people(m.title || m.id), contentSource: "src/content/city*.js", template: "views/city.js + city-mission.js", feedback: "say-it + repair" });
const scen = await imp("content/scenarios.js"); for (const m of scen.SCENES || []) push({ id: m.id, family: "scenarios", url: `${BASE}/scenarios/${m.id}`, program: "Real-Life Scenarios", type: "branching conversation", objective: people(m.title || m.id), contentSource: "src/content/scenarios.js", template: "views/scenarios.js", feedback: "consequence + say-it" });
const arena = await imp("content/craft-arena.js"); for (const m of arena.TOPICS || []) push({ id: m.id, family: "arena", url: `${BASE}/arena/${m.id}`, program: "Argument Arena", type: "debate topic", objective: people(m.title || m.q || m.id), contentSource: "src/content/craft-arena.js", template: "views/arena.js", feedback: "rubric self-check" });
const mentor = await imp("content/craft-mentor.js"); for (const m of mentor.TEXTS || []) push({ id: m.id, family: "mentor", url: `${BASE}/mentor/${m.id}`, program: "Mentor Text Explorer", type: "mentor text", objective: people(m.title || m.id), contentSource: "src/content/craft-mentor.js", template: "views/mentor.js", feedback: "try-it checks" });
const news = await imp("content/newsroom.js"); for (const m of news.NEWS_PROMPTS || []) push({ id: m.id, family: "newsroom", url: `${BASE}/newsroom/${m.id}`, program: "Newsroom", type: "story prompt", objective: people(m.title || m.headline || m.id), contentSource: "src/content/newsroom.js", template: "views/newsroom.js", feedback: "5W1H checklist" });
const comm = await imp("content/communication.js"); for (const m of comm.SCENARIOS || []) push({ id: m.id, family: "communication", url: `${BASE}/communication/${m.id}`, program: "Communication Lab", type: "register scenario", objective: people(m.title || m.id), contentSource: "src/content/communication*.js", template: "views/communication.js", feedback: "dial + register check" });
const labs = await imp("content/language-labs.js"); for (const m of labs.BRIDGE_ITEMS || []) push({ id: m.id, family: "language-labs", url: `${BASE}/language-labs`, program: "Language Labs", type: "bridge item", objective: people(m.title || m.id), contentSource: "src/content/language-labs.js", template: "views/language-labs.js", feedback: "compare/explore" });
const vl = await imp("content/voice-lab.js");
for (const [k, key] of [["LADDERS", "ladder"], ["READ_ALOUD", "read"], ["RETELLS", "retell"], ["SHADOW_SETS", "shadow"], ["SOUND_SETS", "sound"]]) for (const m of vl[k] || []) push({ id: `voice-${key}-${m.id}`, family: "voice", url: `${BASE}/voice/${key}`, program: "Voice Lab", type: `voice ${key}`, objective: people(m.title || m.id), contentSource: "src/content/voice-lab.js", template: "views/voice*.js", feedback: "self-check + recording playback" });
const sci = await imp("content/science-lab.js"); for (const k of Object.keys(sci.CASES || {})) push({ id: `science-lab-${k}`, family: "science-lab", url: `${BASE}/worlds/science-lab`, program: "Science Investigation Lab", type: "investigation case", objective: k, contentSource: "src/content/science-lab*.js", template: "views/science-lab*.js", feedback: "claim-evidence checks" });
const ex = await imp("content/exhibition.js"); for (const k of Object.keys(ex.EXHIBITIONS || {})) push({ id: `exhibition-${k}`, family: "exhibition", url: `${BASE}/exhibition?grades=${k}`, program: "Language World (Exhibition)", type: "4-task scenario", gradeBand: k, objective: k, contentSource: "src/content/exhibition.js", template: "views/exhibition*.js", feedback: "rule-based on learner's sentences" });
const tpl = await imp("book/templates.js"); for (const t of tpl.TEMPLATES || []) push({ id: `book-template-${t.id}`, family: "book-studio", url: `${BASE}/book-studio/new?template=${t.id}`, program: "Book Studio", type: "book template", objective: people(t.title || t.name || t.id), contentSource: "src/book/templates-a.js / templates-b.js", template: "views/book-studio.js + src/book/*", feedback: "finish checklist + coach" });
const cw = readJson(path.join(CONTENT, "road.json")); for (const [b, v] of Object.entries(cw)) for (let w = 1; w <= (v.weeks?.length || Object.keys(v)[0] && 12); w++) push({ id: `road-${b}-w${w}`, family: "road", url: `${BASE}/road/${w}?grades=${b}`, program: "Road to ACCESS", type: "weekly playlist", gradeBand: b, objective: `Week ${w} playlist`, contentSource: "content/road.json", template: "views/road.js", feedback: "playlist completion" });

// ---------------------------------------------------------------- static sibling sub-sites (enumerated from built HTML)
const title = (html) => (html.match(/<title>([^<]*)<\/title>/i)?.[1] || "").replace(/\s+/g, " ").trim();
const staticSites = {
  "language-adventures": { program: "Language Adventures (Next static export)", note: "Next.js static export; interactive client JS in _next/" },
  "language-studio": { program: "Language Studio (Next static export)", note: "Next.js static export" },
  "esol": { program: "ESOL math guides", note: "static pages" },
  "wida-access": { program: "WIDA ACCESS practice (static)", note: "static pages" },
  "vocab-hub": { program: "Vocab Hub", note: "static app.js + vocab-bank.json" },
  "esol-reading-writing": { program: "ESOL reading/writing (static)", note: "static pages" },
};
const siteDetails = {};
for (const [site, meta] of Object.entries(staticSites)) {
  const dir = path.join(ROOT, site);
  if (!exists(dir)) continue;
  const pages = walkFiles(dir, (p) => p.endsWith(".html") && !/\/404\//.test(p) && !/\/404\.html$/.test(p));
  siteDetails[site] = { pages: pages.length };
  for (const p of pages.sort()) {
    const rel = path.relative(dir, p).replace(/(^|\/)index\.html$/, "");
    const url = `/${site}/${rel}${rel && !rel.endsWith(".html") ? "/" : ""}`.replace(/\/+$/, rel ? "/" : "/");
    const html = fs.readFileSync(p, "utf8");
    const seg = rel.split("/")[0] || "home";
    const group = site.startsWith("language-") ? `${site}:${["adventures", "studios", "practice", "notes", "print"].includes(seg) ? seg : seg === "home" ? "hub" : "other"}` : `${site}:${seg === "reveal-math-guides" ? "reveal-math-guides" : seg === "home" ? "hub" : "page"}`;
    push({ id: `${site}/${rel || "index"}`, family: group, url, program: meta.program, type: seg === "print" ? "printable" : seg === "notes" ? "teacher note" : seg === "adventures" ? "adventure mission" : seg === "studios" ? "studio" : seg === "practice" ? "practice" : "page",
      objective: title(html), contentSource: `${site}/${rel || "index.html"}`, template: meta.note, feedback: "unknown (static page / client JS)", htmlBytes: html.length });
  }
}
const vocabBank = safe(() => readJson(path.join(ROOT, "vocab-hub/vocab-bank.json")), null);
const vocabCount = vocabBank ? (Array.isArray(vocabBank) ? vocabBank.length : Object.values(vocabBank).reduce((n, v) => n + (Array.isArray(v) ? v.length : 0), 0)) : null;
for (const f of ["access-teacher/index.html", "access-family-tour/index.html", "access-family-expedition/index.html", "access-expedition/index.html", "access-guide/index.html"]) {
  const p = path.join(ROOT, f); if (!exists(p)) continue;
  const html = fs.readFileSync(p, "utf8");
  push({ id: f.replace("/index.html", ""), family: "teacher-family-static", url: `/${f.replace("index.html", "")}`, program: f.includes("teacher") ? "Teacher tools" : "Family/guide", type: "static page", objective: title(html), contentSource: f, template: "static page + client JS", feedback: "n/a" });
}

// ---------------------------------------------------------------- families (one per destination + core bank + static)
const PROBE_OVERRIDE = { "newcomer-packs": ["packs"], "survival-vocabulary": ["packs/survival-vocabulary"], "live-speaking": ["live"], "el-program": ["program"], "partner-talk": ["partner"], "speaking-task-packs": ["task-packs"], "print-studio": ["print-studio"],
  voice: ["voice"], "reading-room": ["reading-room"], "reading-practice": ["Reading/A?grades=6-8"], listening: ["Listening/A?grades=6-8"], speaking: ["Speaking/A?grades=6-8"], writing: ["Writing/A?grades=6-8"] };
const UNTESTABLE = [
  { match: (h) => /^\/studios\//.test(h), reason: "Served by the separate Learning Studios Worker through functions/_lib/studios-proxy.js; its pages are not files in this repo and cannot be loaded from a static or vite server." },
  { match: (h) => /\/access-teacher\/predictive/.test(h), reason: "WIDA Data Studio (teacher predictive tool) needs roster data entered by the teacher and is outside the student-facing audit surface; shell checked via /access-teacher/." },
];
const DEST_SOURCE = {
  listening: "content/g*/Listening.json", speaking: "content/g*/Speaking.json", "reading-practice": "content/g*/Reading.json", writing: "content/g*/Writing.json",
  voice: "src/content/voice-lab.js", speak: "content/studio/speaking.json (+exemplars)", write: "content/studio/writing.json (+exemplars)", detective: "content/detective/patterns.json",
  arena: "src/content/craft-arena.js", mentor: "src/content/craft-mentor.js", sentences: "src/content/craft-sentences*.js", wordlab: "src/content/wordlab-words.js + wordlab-lab.js",
  scenarios: "src/content/scenarios.js", city: "src/content/city*.js", newsroom: "src/content/newsroom.js", communication: "src/content/communication*.js", "language-labs": "src/content/language-labs.js",
  vocabulary: "src/content/vocabulary-items.js", flashcards: "src/lang/flashcards.js + glossary", grammar: "content/grammar/packs.json", puzzles: "content/puzzles/puzzles.json", games: "content/games/*.json + src/games/*",
  "reading-room": "content/reading-room/*.json", ladder: "content/ladder/*.json", "reading-path": "content/reading-path/*.json", "science-of-reading": "src/sor/*", reader: "src/content/reader-samples.js",
  tests: "content/tests/*.json", assess: "content/assess/*.json + content/bank/*.json", road: "content/road.json", "access-prep": "content/prep/*.json", missions: "content/missions/*.json", worlds: "content/worlds.json + content/world-missions.js",
  exhibition: "src/content/exhibition.js", quest: "content/quest/**", "adventure-worlds": "src/adventures/worlds/*.js", units: "content/units/*.json", twr: "content/twr/**", goals: "content/goal-bank.json + goals/*.json",
  "book-studio": "src/book/templates*.js (user-authored books are runtime data)", "book-templates": "src/book/templates*.js", early: "src/content/early.js + src/early/*", "choice-boards": "content/choice-boards.json", "talk-table": "content/talk-table.json",
  "newcomer-packs": "content/packs/*.json", "el-program": "content/program/*.json", "family-corner": "content/family*.json", "family-today": "content/family*.json", "practice-together": "src/intro/family*.js", "family-start": "src/intro/family-start.js",
  warmup: "content/warmup-*.json", scaffold: "src/content/scaffold-*.js", evidence: "content/studio/evidence-sentences.json", construction: "src/journey/engines/construct*.js", simulations: "src/sim/missions/*", "experience-builder": "src/compiler/* (teacher text -> lp-sim/1)",
  "time-machine": "src/timemachine/*", pathways: "src/pathways/*", journey: "src/journey/*", "journey-map": "src/journey/*", "language-games": "src/flagship/*", library: "content/index.json (all activities)", "language-studios": "src/studios/*",
};
const famCount = {
  listening: () => coreActivities.filter((a) => a.domain === "Listening").length, speaking: () => coreActivities.filter((a) => a.domain === "Speaking").length,
  "reading-practice": () => coreActivities.filter((a) => a.domain === "Reading").length, writing: () => coreActivities.filter((a) => a.domain === "Writing").length,
  speak: () => acts.filter((a) => a.family === "speak").length, write: () => acts.filter((a) => a.family === "write").length, detective: () => acts.filter((a) => a.family === "detective").length,
  arena: () => (arena.TOPICS || []).length, mentor: () => (mentor.TEXTS || []).length, scenarios: () => (scen.SCENES || []).length, city: () => (city.MISSIONS || []).length, newsroom: () => (news.NEWS_PROMPTS || []).length,
  communication: () => (comm.SCENARIOS || []).length, wordlab: () => 755, "reading-room": () => acts.filter((a) => /^reading-room/.test(a.family)).length, ladder: () => acts.filter((a) => a.family === "ladder").length,
  puzzles: () => acts.filter((a) => a.family === "puzzles").length, games: () => acts.filter((a) => a.family === "games").length, grammar: () => acts.filter((a) => a.family === "grammar").length, tests: () => acts.filter((a) => a.family === "tests").length,
  units: () => acts.filter((a) => a.family === "units").length, twr: () => acts.filter((a) => a.family === "twr").length, "book-studio": () => (tpl.TEMPLATES || []).length, "book-templates": () => (tpl.TEMPLATES || []).length,
  missions: () => acts.filter((a) => a.family === "missions").length, quest: () => acts.filter((a) => a.family === "quest").length, "access-prep": () => acts.filter((a) => a.family === "access-prep").length, "reading-path": () => acts.filter((a) => a.family === "reading-path").length,
  "newcomer-packs": () => acts.filter((a) => a.family === "newcomer-packs").length, "el-program": () => acts.filter((a) => a.family === "el-program").length, voice: () => acts.filter((a) => a.family === "voice").length,
};
const crawl = safe(() => readJson(crawlPath), null);
const crawlByFam = {};
for (const r of crawl?.results || []) (crawlByFam[r.family] ||= []).push(r);
function crawlSummary(famId) {
  const rs = crawlByFam[famId];
  if (!rs?.length) return null;
  const at = (r, w) => r.widths?.[w] || {};
  return {
    probes: rs.length,
    consoleErrors: rs.reduce((n, r) => n + (r.consoleErrors?.length || 0) + (r.pageErrors?.length || 0), 0),
    failedRequests: rs.reduce((n, r) => n + (r.failedRequests?.length || 0), 0),
    loadErrors: rs.filter((r) => Object.values(r.widths || {}).some((w) => w.error)).length,
    overflow: ["390", "768", "1280"].map((w) => ({ w, probes: rs.filter((r) => at(r, w).overflowX).length })),
    axeSerious: rs.reduce((n, r) => n + (at(r, "1280").axe?.serious ?? 0) + (at(r, "390").axe?.serious ?? 0), 0),
    axeAny: rs.reduce((n, r) => n + (at(r, "1280").axe?.violations ?? 0) + (at(r, "390").axe?.violations ?? 0), 0),
    axeRules: [...new Set(rs.flatMap((r) => ["390", "1280"].flatMap((w) => at(r, w).axe?.rules || [])))],
    smallTargets390: rs.reduce((n, r) => n + (at(r, "390").under44 ?? 0), 0),
    under24at390: rs.reduce((n, r) => n + (at(r, "390").under24 ?? 0), 0),
    focusNotVisible: rs.filter((r) => r.interaction?.focusVisible === false).length,
    interactionStates: [...new Set(rs.map((r) => r.interaction?.state).filter(Boolean))],
  };
}

const families = [];
const baseUrl = (h) => (h.startsWith("/") ? h : `${BASE}/${h}`);
for (const d of DESTINATIONS) {
  const href = d.href;
  const seg = href.replace(/^\/+/, "").split(/[/?#]/)[0];
  const abs = baseUrl(href);
  const isLabRoute = !href.startsWith("/");
  const untest = UNTESTABLE.find((u) => u.match(abs));
  const staticFile = !isLabRoute && !untest ? exists(path.join(ROOT, abs.split("?")[0].replace(/^\//, ""), "index.html")) || exists(path.join(ROOT, abs.split("?")[0].replace(/^\//, ""))) : null;
  const tmpl = isLabRoute ? viewFileFor(seg) : staticFile ? `static: ${abs}` : null;
  const probe = untest ? [] : PROBE_OVERRIDE[d.id] ? PROBE_OVERRIDE[d.id].map(baseUrl) : [abs];
  const count = famCount[d.id]?.() ?? null;
  families.push({
    id: d.id, kind: "destination", url: abs, program: sectionTitle[d.section] || d.section, section: d.section, skill: d.skill, type: d.kind,
    audience: d.for, gradeBand: d.bands ? d.bands.join(", ") : "all bands", wida: d.skill && d.skill !== "Mixed" ? [d.skill] : [], objective: L(d.text), title: L(d.title),
    contentSource: DEST_SOURCE[d.id] || (isLabRoute ? "view code (no external content file)" : abs), template: tmpl || (isLabRoute ? "unresolved loader" : "external/untestable"), count,
    probe, testable: !untest && (isLabRoute || !!staticFile), untestableReason: untest?.reason || (!isLabRoute && !staticFile ? "Path is not a file in this repo (served by a Worker/Function)." : undefined),
  });
}
// core bank families
const WIDA_NOTE = "WIDA language-function tags per activity; A/B/C = support choices, not WIDA levels";
for (const [fam, rows] of Object.entries(coreByFamily)) {
  const [, band, domain] = fam.match(/^core-(.+?)-(\w[\w-]*)$/);
  const domainName = rows[0].rec.domain;
  families.push({
    id: fam, kind: "content-family", url: `${BASE}/${domainName}/A?grades=${BAND_QUERY[band]}`, program: "Core practice bank", section: "practice", skill: domainName, type: "practice-bank",
    audience: ["student", "teacher", "family"], gradeBand: BAND_LABEL[band], wida: [WIDA_NOTE], objective: `${domainName} activities, grades ${BAND_LABEL[band]}, support levels A/B/C`,
    title: `Core ${domainName} (grades ${BAND_LABEL[band]})`, contentSource: `access-practice-lab/content/${band}/${domainName}.json`, template: "views/room.js (room) + views/activity.js (8 item templates)", count: rows.length,
    probe: [], testable: true, metrics: aggregate(rows), activityTypes: aggregate(rows).types,
  });
}
// static sibling sub-site families
const staticFamilies = {};
for (const a of acts.filter((x) => /:/.test(x.family) || x.family === "teacher-family-static")) (staticFamilies[a.family] ||= []).push(a);
for (const [fam, rows] of Object.entries(staticFamilies)) {
  const first = rows[0];
  const tops = rows.filter((r) => /\/$/.test(r.url));
  families.push({
    id: fam, kind: "static-site-family", url: first.url, program: first.program, section: "sibling-site", skill: "Mixed", type: first.type, audience: ["student", "teacher", "family"], gradeBand: "see pages",
    wida: [], objective: `${rows.length} static page(s): ${[...new Set(rows.map((r) => r.type))].join(", ")}`, title: fam, contentSource: first.contentSource.split("/")[0] + "/**", template: first.template,
    count: rows.length, probe: rows.slice(0, 1).map((r) => r.url), testable: true,
  });
}
families.push({ id: "vocab-hub:bank", kind: "static-site-family", url: "/vocab-hub/", program: "Vocab Hub", section: "sibling-site", skill: "Words", type: "vocabulary bank app", audience: ["student", "teacher"], gradeBand: "see app", wida: [], objective: "Searchable vocabulary bank app.", title: "Vocab Hub",
  contentSource: "vocab-hub/vocab-bank.json", template: "vocab-hub/app.js", count: vocabCount, probe: ["/vocab-hub/"], testable: true });
// remaining view routes not covered by any destination (kept so every router entry has an owner)
const covered = new Set(families.filter((f) => f.kind === "destination").map((f) => viewFileFor(f.url.replace(BASE + "/", "").split(/[/?#]/)[0])).filter(Boolean));
const routes = Object.entries(VIEW_LOADERS).map(([key, file]) => ({ route: key, view: `access-practice-lab/src/${file.replace("./", "")}`, covered: covered.has(`access-practice-lab/src/${file.replace("./", "")}`) }));
const uncovered = routes.filter((r) => !r.covered);

// attach crawl summary + derived fields
for (const f of families) {
  const cs = crawlSummary(f.id);
  f.crawl = cs;
  const ci = [];
  if (cs) {
    if (cs.consoleErrors) ci.push(`${cs.consoleErrors} console/page error(s)`);
    if (cs.failedRequests) ci.push(`${cs.failedRequests} failed request(s)`);
    if (cs.loadErrors) ci.push(`${cs.loadErrors} probe(s) failed to load`);
    if (cs.focusNotVisible) ci.push(`focus indicator not visible on ${cs.focusNotVisible} probe(s)`);
    if (cs.under24at390) ci.push(`${cs.under24at390} targets under 24px at 390px (WCAG 2.2 minimum)`);
    for (const o of cs.overflow) if (o.probes) ci.push(`horizontal overflow at ${o.w}px`);
    if (cs.axeSerious) ci.push(`${cs.axeSerious} serious/critical axe violation(s): ${cs.axeRules.join(", ")}`);
    if (cs.smallTargets390) ci.push(`${cs.smallTargets390} touch targets < 44px at 390px`);
  }
  f.designIssues = ci;
  f.a11y = cs ? (cs.axeSerious ? `axe: ${cs.axeSerious} serious/critical (${cs.axeRules.join(", ")})` : "axe: no serious/critical on probe pages") : f.testable ? "not crawled" : "untestable";
  f.mobile = cs ? (cs.overflow.find((o) => o.w === "390").probes ? "overflow at 390" : "no horizontal overflow at 390") : f.testable ? "not crawled" : "untestable";
  f.contentIssues = f.metrics ? coreFamilyIssues(f.metrics) : [];
  f.status = f.testable ? "baseline" : "untestable";
  f.priority = f.metrics ? (f.contentIssues.length > 2 ? "P1" : f.contentIssues.length ? "P2" : "P3") : cs && (cs.consoleErrors || cs.axeSerious || cs.loadErrors) ? "P1" : "P2";
  f.action = f.testable ? (f.priority === "P3" ? "monitor" : "audit + upgrade") : "document only";
  f.verification = f.testable ? (cs ? "Playwright crawl (390/768/1280, console, axe) + content metrics" : "static enumeration; crawl pending") : "untestable: " + f.untestableReason;
  f.feedback = f.metrics ? `generic correct: ${f.metrics.genericCorrectPct}%; full distractor feedback: ${f.metrics.distractorFeedbackFullPct ?? "n/a"}%; item feedback: ${f.metrics.itemFeedbackPct}%` : f.feedback || "see activity records";
}
function coreFamilyIssues(m) {
  const out = [];
  if (m.directionsOver28Pct > 10) out.push(`${m.directionsOver28Pct}% of directions exceed 28 words`);
  if (m.genericCorrectPct > 5) out.push(`${m.genericCorrectPct}% of correct-answer feedback is generic or under 4 words`);
  if (m.distractorFeedbackFullPct !== null && m.distractorFeedbackFullPct < 90) out.push(`only ${m.distractorFeedbackFullPct}% of choice items explain every wrong option`);
  if (m.itemFeedbackPct < 90) out.push(`only ${m.itemFeedbackPct}% of order/cloze/sort items have per-item feedback`);
  if (m.constructedWithCriteriaPct < 90) out.push(`only ${m.constructedWithCriteriaPct}% of constructed items carry success criteria`);
  if (m.hintEqualsSupportPct > 15) out.push(`${m.hintEqualsSupportPct}% of items repeat the hint verbatim as support`);
  if (m.answerLongestCluePct > 15) out.push(`${m.answerLongestCluePct}% of choice items have the correct option as the clearly longest (accidental clue)`);
  if (m.dupOptionsPct > 0) out.push(`${m.dupOptionsPct}% of choice items have duplicate options`);
  if (m.widaTagPct < 100) out.push(`${100 - m.widaTagPct}% of items have no WIDA language-function tag`);
  if (m.esDirectionsPct < 95) out.push(`only ${m.esDirectionsPct}% of items have Spanish directions in es-guide.json`);
  if (m.esFeedbackPct < 95) out.push(`only ${m.esFeedbackPct}% of correct/hint/support strings have a Spanish translation in es-strings.json`);
  return out;
}

// per-activity merge (fix up family-level crawl info + issue lists for non-core records)
const activities = [...coreActivities, ...acts].map((a) => {
  const fam = families.find((f) => f.id === a.family);
  const inherited = !a.issues?.length && a.family && !/^core-/.test(a.family) ? (fam?.priority || a.priority) : a.priority;
  return { ...a, priority: /^core-/.test(a.family) ? a.priority : inherited, a11y: fam?.a11y || "see family", mobile: fam?.mobile || "see family", verification: a.verification || fam?.verification || "static enumeration",
    testable: fam ? fam.testable : true, untestable: fam && !fam.testable ? fam.untestableReason : undefined };
});

// ---------------------------------------------------------------- write outputs
const counts = {
  families: families.length, destinations: families.filter((f) => f.kind === "destination").length, activityRecords: activities.length,
  coreBankActivities: coreActivities.length, coreByBand: Object.fromEntries(BANDS.map((b) => [BAND_LABEL[b], coreActivities.filter((a) => a.gradeBand === BAND_LABEL[b]).length])),
  coreByType: aggregate(Object.values(coreByFamily).flat()).types, viewRoutes: routes.length, untestableFamilies: families.filter((f) => !f.testable).length,
  wordLabWords: 755, vocabHubEntries: vocabCount, staticPagesBySite: siteDetails,
  coreIssueCounts: Object.fromEntries([...new Set(coreActivities.flatMap((a) => a.issues))].map((i) => [i, coreActivities.filter((a) => a.issues.includes(i)).length])),
  priority: { P0: 0, P1: activities.filter((a) => a.priority === "P1").length, P2: activities.filter((a) => a.priority === "P2").length, P3: activities.filter((a) => a.priority === "P3").length },
};
const inventory = {
  schema: 1, site: "https://thelanguagepage.com/ (-> /access-practice-lab/)", baseline: { branch: git("rev-parse --abbrev-ref HEAD"), commit: git("rev-parse --short HEAD"), originMain: git("rev-parse --short origin/main") },
  generatedBy: "reports/language-page-quality/tools/enumerate.mjs", crawlMerged: !!crawl, counts, families, activities, routes, routesWithoutOwnDestination: uncovered.map((r) => r.route),
  routeNote: "These loaders are reached from other destinations: room/activity (core bank rooms and items), test (tests), ready-plan, publisher-demo, subject-reading, vocab-curriculum (sub-routes of reading/vocabulary), class-quiz/class-teacher (class), students, session-done.",
  untestable: families.filter((f) => !f.testable).map((f) => ({ id: f.id, url: f.url, reason: f.untestableReason })).concat(
    [{ id: "book-studio:user-books", url: `${BASE}/book-studio/edit|read|play|review/<id>`, reason: "User-created books live in each browser's IndexedDB (accessPracticeLab-books); no authored books exist to enumerate. Only the 26 templates are enumerable." },
     { id: "wordlab:words", url: `${BASE}/wordlab`, reason: "755 words / 116 morphemes / 40 detective items enumerated as counts only, not individual records." },
     { id: "sentences:rows", url: `${BASE}/sentences`, reason: "316 sentence-lab rows + 10 boss paragraphs enumerated as counts only." }]),
};
fs.writeFileSync(path.join(OUT, "inventory.json"), JSON.stringify(inventory, null, 1) + "\n");

const md = [];
md.push("# Language Page inventory (baseline = origin/main)\n");
md.push(`Generated by \`tools/enumerate.mjs\` at commit ${inventory.baseline.commit}. Crawl data merged: ${crawl ? "yes" : "no"}.\n`);
md.push("## Counts\n");
md.push(`- Families: ${counts.families} (${counts.destinations} site-map destinations, ${families.filter((f) => f.kind === "content-family").length} core-bank band x skill families, ${families.filter((f) => f.kind === "static-site-family").length} static sibling-site families)`);
md.push(`- Distinct activity/route records: ${counts.activityRecords} (core bank ${counts.coreBankActivities}; other ${activities.length - counts.coreBankActivities})`);
md.push(`- Core bank by band: ${Object.entries(counts.coreByBand).map(([b, n]) => `${b}: ${n}`).join(", ")}`);
md.push(`- Core bank by item template: ${Object.entries(counts.coreByType).map(([t, n]) => `${t}: ${n}`).join(", ")}`);
md.push(`- Static pages: ${Object.entries(siteDetails).map(([s, v]) => `${s}: ${v.pages}`).join(", ")}`);
md.push(`- Router views: ${routes.length} loaders, ${Object.keys(VIEW_ALIASES).length} aliases; untestable families: ${counts.untestableFamilies}`);
md.push(`- Core-bank flags (measured): ${Object.entries(counts.coreIssueCounts).sort((a, b) => b[1] - a[1]).map(([i, n]) => `${i} ${n}`).join("; ")}\n`);
md.push("## Families\n");
md.push("| id | program | type | grade | count | testable | priority |\n|---|---|---|---|---|---|---|");
for (const f of families) md.push(`| ${f.id} | ${f.program} | ${f.type} | ${f.gradeBand} | ${f.count ?? ""} | ${f.testable ? "yes" : "NO"} | ${f.priority} |`);
md.push("\n## Untestable / count-only\n");
for (const u of inventory.untestable) md.push(`- \`${u.id}\` (${u.url}): ${u.reason}`);
fs.writeFileSync(path.join(OUT, "inventory.md"), md.join("\n") + "\n");
console.log(JSON.stringify({ families: counts.families, activities: counts.activityRecords, core: counts.coreBankActivities, untestable: counts.untestableFamilies, crawlMerged: !!crawl, priority: counts.priority }));
