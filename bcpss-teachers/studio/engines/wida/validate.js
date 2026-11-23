// Pure validator for wida-studio collections. Returns a list of error strings (empty = valid). Mirrors wida-studio.schema.md.
import {
  BANDS,
  DOMAINS,
  GRADES,
  KLUS,
  SUBJECT_IDS,
  TIER_IDS,
  bandOf,
  widaClusterOf,
} from "../../data/taxonomy.js";
import { DOMAIN_OF_TYPE } from "./check.js";

const DATA_VISUALS = new Set(["table", "bars", "coord", "timeline", "numberline"]);
const PLACEHOLDER = /\b(lorem|ipsum|todo|tbd|placeholder|coming soon|xxx)\b/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const isStr = (s) => typeof s === "string" && s.trim().length > 0;
const words = (s) =>
  (
    String(s || "")
      .trim()
      .match(/\S+/g) || []
  ).length;
const arr = (a) => (Array.isArray(a) ? a : []);

export function collectStrings(v, out = []) {
  if (typeof v === "string") out.push(v);
  else if (Array.isArray(v)) for (const x of v) collectStrings(x, out);
  else if (v && typeof v === "object") for (const x of Object.values(v)) collectStrings(x, out);
  return out;
}

function checkVisual(v, where, errs, renderVisual) {
  if (!v || typeof v !== "object") return errs.push(`${where}: visual must be an object`);
  if (!isStr(v.kind)) errs.push(`${where}: visual needs kind`);
  if (!isStr(v.alt)) errs.push(`${where}: visual needs alt text`);
  if (DATA_VISUALS.has(v.kind) && !isStr(v.longDesc))
    errs.push(`${where}: ${v.kind} visual carries data and needs longDesc`);
  if (renderVisual) {
    try {
      const svg = renderVisual(v);
      if (typeof svg !== "string" || !svg.includes("<svg"))
        errs.push(`${where}: visual did not render an SVG`);
    } catch (e) {
      errs.push(`${where}: visual failed to render (${e.message})`);
    }
  }
}

function checkSupports(sup, where, errs, { needFrames = false } = {}) {
  if (!sup || typeof sup !== "object") return errs.push(`${where}: supports required`);
  for (const t of TIER_IDS)
    if (!(t in sup) || typeof sup[t] !== "object" || sup[t] === null)
      errs.push(`${where}: supports.${t} missing`);
  if (needFrames)
    for (const t of ["ee", "dev"]) {
      const s = sup[t] || {};
      if (!arr(s.frames).length && !arr(s.wordBank).length)
        errs.push(`${where}: supports.${t} needs frames or wordBank`);
    }
}

function checkOptions(task, where, errs, { key = "options" } = {}) {
  const opts = arr(task[key]);
  if (opts.length < 3 || opts.length > 4) errs.push(`${where}: ${key} must have 3-4 entries`);
  const ids = opts.map((o) => o?.id);
  if (new Set(ids).size !== ids.length || ids.some((i) => !isStr(i)))
    errs.push(`${where}: ${key} ids must be unique strings`);
  const texts = opts.map((o) =>
    String(o?.text || "")
      .trim()
      .toLowerCase(),
  );
  if (new Set(texts).size !== texts.length || texts.some((t) => !t))
    errs.push(`${where}: ${key} texts must be unique and non-empty`);
  if (task.multi) {
    const a = arr(task.answers);
    if (a.length < 2 || a.length > opts.length - 1 || a.some((x) => !ids.includes(x)))
      errs.push(`${where}: multi needs 2..options-1 valid answers`);
  } else if (!ids.includes(task.answer)) errs.push(`${where}: answer must be an option id`);
  return ids;
}

function checkMisconceptions(task, ids, where, errs) {
  for (const m of arr(task.misconceptions)) {
    if (!ids.includes(m.pick))
      errs.push(`${where}: misconception pick "${m.pick}" is not an option`);
    if (!isStr(m.tag) || !kebab.test(m.tag))
      errs.push(`${where}: misconception tag must be kebab-case`);
    if (!isStr(m.hint)) errs.push(`${where}: misconception needs a hint`);
  }
}

function checkAudio(task, where, errs, tasksBefore) {
  const a = task.audio;
  if (!a || typeof a !== "object") return errs.push(`${where}: audio required`);
  if (a.ref) {
    if (!tasksBefore.includes(a.ref)) errs.push(`${where}: audio.ref must name an earlier task`);
    return;
  }
  const n = words(a.transcript);
  if (n < 25 || n > 400) errs.push(`${where}: transcript must be 25-400 words (has ${n})`);
  if (a.voiceHint && !["adult", "child", "teen"].includes(a.voiceHint))
    errs.push(`${where}: voiceHint must be adult, child or teen`);
  for (const s of arr(a.segments))
    if (!String(a.transcript).includes(s.text))
      errs.push(`${where}: segment text must occur in transcript`);
}

const strs = (a) => arr(a).every(isStr);

const TASK_CHECKS = {
  "listen-select": (t, w, e) => {
    const ids = checkOptions(t, w, e);
    if (!isStr(t.question)) e.push(`${w}: question required`);
    checkMisconceptions(t, ids, w, e);
  },
  "listen-sequence": (t, w, e) => {
    const items = arr(t.items);
    if (items.length < 3 || items.length > 6) e.push(`${w}: items must have 3-6 entries`);
    const ids = items.map((i) => i?.id);
    if (new Set(ids).size !== ids.length) e.push(`${w}: item ids must be unique`);
    if (
      arr(t.answer).length !== ids.length ||
      [...arr(t.answer)].sort().join() !== [...ids].sort().join()
    )
      e.push(`${w}: answer must be a permutation of item ids`);
  },
  "listen-label": (t, w, e) => {
    if (!t.visual) e.push(`${w}: visual required`);
    const slots = arr(t.slots);
    const bank = arr(t.bank);
    if (slots.length < 2 || slots.length > 6) e.push(`${w}: slots must have 2-6 entries`);
    if (bank.length < slots.length)
      e.push(`${w}: bank must have at least as many entries as slots`);
    const bids = bank.map((b) => b?.id);
    if (new Set(bids).size !== bids.length) e.push(`${w}: bank ids must be unique`);
    for (const s of slots) {
      if (!isStr(s.marker)) e.push(`${w}: slot ${s.id} needs a marker`);
      if (!bids.includes(s.answer)) e.push(`${w}: slot ${s.id} answer must be a bank id`);
    }
    if (new Set(slots.map((s) => s.answer)).size !== slots.length)
      e.push(`${w}: slot answers must be distinct`);
  },
  "listen-notes": (t, w, e) => {
    const rows = arr(t.organizer?.rows);
    if (rows.length < 2 || rows.length > 6) e.push(`${w}: organizer needs 2-6 rows`);
    if (new Set(rows.map((r) => r?.id)).size !== rows.length)
      e.push(`${w}: row ids must be unique`);
    for (const r of rows)
      if (r.accept && (!strs(r.accept) || !r.accept.length))
        e.push(`${w}: row ${r.id} accept must be non-empty strings`);
  },
  "speak-describe": (t, w, e) => {
    if (!t.visual) e.push(`${w}: visual required`);
  },
  "speak-explain": (t, w, e) => {
    if (!t.visual && arr(t.steps).length < 2) e.push(`${w}: needs a visual or 2+ steps`);
    if (t.steps && (t.steps.length < 2 || t.steps.length > 6))
      e.push(`${w}: steps must have 2-6 entries`);
  },
  "speak-compare": (t, w, e, o) => {
    const items = arr(t.items);
    if (items.length !== 2) e.push(`${w}: items must have exactly 2 entries`);
    items.forEach((it, i) => {
      if (!isStr(it?.label)) e.push(`${w}: item ${i} needs a label`);
      checkVisual(it?.visual, `${w} item ${i}`, e, o.renderVisual);
    });
    if (arr(t.compareOn).length < 2 || arr(t.compareOn).length > 4)
      e.push(`${w}: compareOn must have 2-4 entries`);
  },
  "speak-argue": (t, w, e) => {
    if (!isStr(t.question)) e.push(`${w}: question required`);
    if (arr(t.positions).length < 2 || arr(t.positions).length > 3)
      e.push(`${w}: positions must have 2-3 entries`);
    if (arr(t.evidence).length < 2 || arr(t.evidence).length > 5)
      e.push(`${w}: evidence must have 2-5 entries`);
  },
  "read-select": (t, w, e) => {
    const ids = checkOptions(t, w, e);
    if (!isStr(t.question)) e.push(`${w}: question required`);
    checkMisconceptions(t, ids, w, e);
  },
  "read-evidence": (t, w, e, o) => {
    const ids = checkOptions(t, w, e);
    checkMisconceptions(t, ids, w, e);
    const ev = t.evidence || {};
    const ch = arr(ev.choices);
    if (ch.length < 3 || ch.length > 5) e.push(`${w}: evidence.choices must have 3-5 entries`);
    const cids = ch.map((c) => c?.id);
    if (
      arr(ev.answers).length < 1 ||
      arr(ev.answers).length > 2 ||
      arr(ev.answers).some((a) => !cids.includes(a))
    )
      e.push(`${w}: evidence.answers must be 1-2 valid choice ids`);
    const text = o.textBody?.(t.text) ?? null;
    if (text != null)
      for (const c of ch)
        if (!text.includes(c.text))
          e.push(`${w}: evidence choice "${c.id}" must be copied verbatim from the text`);
  },
  "read-sort": (t, w, e) => {
    const cats = arr(t.categories);
    const items = arr(t.items);
    if (cats.length < 2 || cats.length > 4) e.push(`${w}: categories must have 2-4 entries`);
    if (items.length < 4 || items.length > 8) e.push(`${w}: items must have 4-8 entries`);
    const cids = cats.map((c) => c?.id);
    for (const i of items)
      if (!cids.includes(i.category)) e.push(`${w}: item ${i.id} category must be a category id`);
    for (const c of cids)
      if (!items.some((i) => i.category === c)) e.push(`${w}: category ${c} has no items`);
  },
  "read-multitext": (t, w, e, o) => {
    const ts = arr(t.texts);
    if (ts.length !== 2 || ts[0] === ts[1]) e.push(`${w}: texts must name two different text ids`);
    if (o.textIds)
      for (const id of ts) if (!o.textIds.includes(id)) e.push(`${w}: unknown text "${id}"`);
    const st = arr(t.statements);
    if (st.length < 3 || st.length > 6) e.push(`${w}: statements must have 3-6 entries`);
    for (const s of st)
      if (!["A", "B", "both"].includes(s.answer))
        e.push(`${w}: statement ${s.id} answer must be A, B or both`);
  },
  "write-expand": (t, w, e) => {
    if (!isStr(t.base)) e.push(`${w}: base required`);
    const ex = arr(t.expansions);
    if (ex.length < 2 || ex.length > 4) e.push(`${w}: expansions must have 2-4 entries`);
    for (const x of ex) if (!isStr(x.ask)) e.push(`${w}: expansion ${x.id} needs ask`);
  },
  "write-explain": (t, w, e) => {
    const p = arr(t.parts);
    if (p.length < 2 || p.length > 5) e.push(`${w}: parts must have 2-5 entries`);
    for (const x of p) {
      if (!isStr(x.label) || !isStr(x.prompt)) e.push(`${w}: part ${x.id} needs label and prompt`);
      if (x.frames)
        for (const tr of TIER_IDS)
          if (!Array.isArray(x.frames[tr]))
            e.push(`${w}: part ${x.id} frames.${tr} must be an array`);
    }
  },
  "write-paragraph": (t, w, e) => {
    const r = arr(t.organizer?.rows);
    if (r.length < 3 || r.length > 6) e.push(`${w}: organizer needs 3-6 rows`);
    for (const x of r)
      if (!isStr(x.label) || !isStr(x.prompt)) e.push(`${w}: row ${x.id} needs label and prompt`);
  },
  "write-revise": (t, w, e, o) => {
    if (!["sample", "previous"].includes(t.source))
      e.push(`${w}: source must be sample or previous`);
    if (!isStr(t.draft)) e.push(`${w}: draft required`);
    if (t.source === "previous" && !o.taskIdsBefore?.includes(t.from))
      e.push(`${w}: from must name an earlier task`);
    const c = arr(t.checks);
    if (c.length < 3 || c.length > 5) e.push(`${w}: checks must have 3-5 entries`);
    for (const x of c)
      if (!isStr(x.question) || !isStr(x.tip)) e.push(`${w}: check ${x.id} needs question and tip`);
    if (!isStr(t.revisePrompt)) e.push(`${w}: revisePrompt required`);
  },
};

const SPEAK_BASE = (t, w, e) => {
  const m = t.modelResponse || {};
  for (const tr of TIER_IDS) if (!isStr(m[tr])) e.push(`${w}: modelResponse.${tr} required`);
  const sc = arr(t.selfCheck);
  if (sc.length < 2 || sc.length > 5 || sc.some((x) => !isStr(x.id) || !isStr(x.text)))
    e.push(`${w}: selfCheck must have 2-5 {id,text}`);
  if (
    t.planning?.organizer &&
    (arr(t.planning.organizer.rows).length < 2 || arr(t.planning.organizer.rows).length > 5)
  )
    e.push(`${w}: planning organizer needs 2-5 rows`);
  if (arr(t.wordsToUse).length > 6) e.push(`${w}: wordsToUse is limited to 6`);
};
const WRITE_BASE = (t, w, e) => {
  const tg = arr(t.targets);
  if (tg.length < 2 || tg.length > 5 || tg.some((x) => !isStr(x.id) || !isStr(x.label)))
    e.push(`${w}: targets must have 2-5 {id,label}`);
  const ex = t.exemplars || {};
  for (const tr of TIER_IDS) if (!isStr(ex[tr])) e.push(`${w}: exemplars.${tr} required`);
};

/** validateTask(task, opts) -> string[]  opts: {domain, tasksBefore:[ids], textIds, textBody(id), renderVisual} */
export function validateTask(task, opts = {}) {
  const errs = [];
  const w = `task ${task?.id || "?"}`;
  if (!task || typeof task !== "object") return [`${w}: not an object`];
  if (!isStr(task.id) || !kebab.test(task.id)) errs.push(`${w}: id must be kebab-case`);
  const domain = DOMAIN_OF_TYPE[task.type];
  if (!domain) return [...errs, `${w}: unknown type "${task.type}"`];
  if (opts.domain && domain !== opts.domain)
    errs.push(`${w}: type ${task.type} does not belong to domain ${opts.domain}`);
  if (!isStr(task.title)) errs.push(`${w}: title required`);
  if (!isStr(task.prompt)) errs.push(`${w}: prompt required`);
  if (task.klu && !KLUS.includes(task.klu)) errs.push(`${w}: klu invalid`);
  if (task.visual) checkVisual(task.visual, w, errs, opts.renderVisual);
  if (arr(task.hints).length > 3) errs.push(`${w}: at most 3 hints`);
  checkSupports(task.supports, w, errs, {
    needFrames: domain === "Speaking" || domain === "Writing",
  });
  if (domain === "Listening" || domain === "Reading")
    if (!isStr(task.explain)) errs.push(`${w}: explain required`);
  const o = { ...opts, taskIdsBefore: opts.tasksBefore || [] };
  if (domain === "Listening") {
    checkAudio(task, w, errs, o.taskIdsBefore);
    if (task.listenFor && (task.listenFor.length < 1 || task.listenFor.length > 4))
      errs.push(`${w}: listenFor must have 1-4 entries`);
  }
  if (domain === "Reading") {
    if (task.type === "read-multitext") TASK_CHECKS[task.type](task, w, errs, o);
    else {
      if (!isStr(task.text)) errs.push(`${w}: text id required`);
      else if (o.textIds && !o.textIds.includes(task.text))
        errs.push(`${w}: unknown text "${task.text}"`);
      TASK_CHECKS[task.type](task, w, errs, o);
    }
    return errs;
  }
  if (domain === "Speaking") SPEAK_BASE(task, w, errs);
  if (domain === "Writing") WRITE_BASE(task, w, errs);
  TASK_CHECKS[task.type](task, w, errs, o);
  return errs;
}

function checkText(t, errs) {
  const w = `text ${t?.id || "?"}`;
  if (!isStr(t.id) || !isStr(t.title)) errs.push(`${w}: id and title required`);
  const secs = arr(t.sections);
  if (secs.length < 1 || secs.length > 6) errs.push(`${w}: 1-6 sections`);
  const body = secs.flatMap((s) => arr(s.paras)).join(" ");
  const n = words(body);
  if (n < 40 || n > 450) errs.push(`${w}: text must be 40-450 words (has ${n})`);
  for (const s of secs)
    if (arr(s.paras).length < 1 || arr(s.paras).length > 4)
      errs.push(`${w}: each section needs 1-4 paragraphs`);
  for (const g of arr(t.glossary)) {
    if (![1, 2, 3].includes(g.level))
      errs.push(`${w}: glossary "${g.term}" level must be 1, 2 or 3`);
    if (!isStr(g.def)) errs.push(`${w}: glossary "${g.term}" needs def`);
    if (!new RegExp(`\\b${String(g.term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i").test(body))
      errs.push(`${w}: glossary term "${g.term}" does not occur in the text`);
  }
  return body;
}

/** validateCollection(c, opts) -> string[]  opts: {standards:Set<string>|null, renderVisual?} */
export function validateCollection(c, opts = {}) {
  const errs = [];
  const E = (m) => errs.push(m);
  if (!c || typeof c !== "object") return ["collection is not an object"];
  if (!isStr(c.id) || !kebab.test(c.id) || !c.id.startsWith("wida-"))
    E('id must be kebab-case and start with "wida-"');
  if (c.kind !== "wida") E('kind must be "wida"');
  if (c.engine !== "wida-studio") E('engine must be "wida-studio"');
  if (!DOMAINS.includes(c.domain)) E("domain invalid");
  if (!GRADES.includes(String(c.grade))) E("grade invalid (K-8 only)");
  if (c.band !== bandOf(c.grade) || !BANDS.some((b) => b.id === c.band))
    E(`band must be ${bandOf(c.grade)}`);
  if (c.cluster !== widaClusterOf(c.grade)) E(`cluster must be ${widaClusterOf(c.grade)}`);
  if (!SUBJECT_IDS.includes(c.subject)) E("subject invalid");
  if (!arr(c.klus).length || arr(c.klus).length > 4 || arr(c.klus).some((k) => !KLUS.includes(k)))
    E("klus must be 1-4 Key Language Uses");
  if (!isStr(c.title) || !isStr(c.intro)) E("title and intro required");
  if (!Number.isFinite(c.minutes) || c.minutes < 5) E("minutes required");
  const st = arr(c.standards);
  if (!st.length) E("standards required");
  if (!st.some((s) => /^ELD-/.test(s))) E("standards must include an ELD-* code");
  if (opts.standards)
    for (const s of st) if (!opts.standards.has(s)) E(`standard "${s}" is not in the registry`);
  if (!["standards-aligned", "district-referenced"].includes(c.curriculum?.status))
    E("curriculum.status invalid");
  if (
    !arr(c.successCriteria).length ||
    arr(c.successCriteria).length > 5 ||
    !strs(c.successCriteria)
  )
    E("successCriteria needs 2-5 strings");
  if (arr(c.successCriteria).length < 2) E("successCriteria needs 2-5 strings");
  checkSupports(c.supports, "collection", errs);
  const g = c.teacherGuide || {};
  for (const k of ["purpose", "independentPractice"])
    if (!isStr(g[k])) E(`teacherGuide.${k} required`);
  for (const [k, lo, hi] of [
    ["languageFocus", 2, 5],
    ["before", 1, 4],
    ["during", 1, 4],
    ["after", 1, 4],
  ]) {
    if (arr(g[k]).length < lo || arr(g[k]).length > hi || !strs(g[k]))
      E(`teacherGuide.${k} needs ${lo}-${hi} strings`);
  }
  if (arr(g.commonChallenges).length < 1) E("teacherGuide.commonChallenges needs 1-4 entries");
  for (const tr of TIER_IDS)
    if (!isStr(g.differentiation?.[tr])) E(`teacherGuide.differentiation.${tr} required`);
  if (c.domain === "Speaking" || c.domain === "Writing") {
    const cr = arr(g.feedbackRubric?.criteria);
    if (
      cr.length < 3 ||
      cr.length > 6 ||
      cr.some((x) => !isStr(x.id) || !isStr(x.label) || !isStr(x.lookFor))
    )
      E("teacherGuide.feedbackRubric needs 3-6 criteria");
  }
  const sc = c.scoring || {};
  const expectObj = c.domain === "Listening" || c.domain === "Reading" ? "auto" : "none";
  if (sc.objective !== expectObj) E(`scoring.objective must be "${expectObj}" for ${c.domain}`);
  if (!/not a wida score/i.test(sc.note || "")) E('scoring.note must say "not a WIDA score"');
  if (c.review?.status !== "authored") E('review.status must be "authored"');
  // texts
  const textIds = [];
  const bodies = {};
  if (c.domain === "Reading") {
    if (!arr(c.texts).length) E("Reading collections need texts");
    for (const t of arr(c.texts)) {
      bodies[t.id] = checkText(t, errs);
      textIds.push(t.id);
      for (const s of arr(t.sections))
        if (s.figure) checkVisual(s.figure.visual, `text ${t.id} figure`, errs, opts.renderVisual);
    }
  }
  // tasks
  const tasks = arr(c.tasks);
  if (tasks.length < 3 || tasks.length > 8) E("tasks must have 3-8 entries");
  const before = [];
  for (const t of tasks) {
    errs.push(
      ...validateTask(t, {
        domain: c.domain,
        tasksBefore: [...before],
        textIds: c.domain === "Reading" ? textIds : null,
        textBody: (id) => (id && bodies[id] !== undefined ? bodies[id] : null),
        renderVisual: opts.renderVisual,
      }),
    );
    if (before.includes(t.id)) E(`duplicate task id ${t.id}`);
    before.push(t.id);
  }
  // hygiene
  for (const s of collectStrings(c)) {
    if (PLACEHOLDER.test(s)) E(`placeholder text: "${s.slice(0, 40)}"`);
    if (EMOJI.test(s)) E(`emoji in text: "${s.slice(0, 40)}"`);
  }
  return errs;
}
