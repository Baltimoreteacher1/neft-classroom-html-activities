// Teacher-side analysis of imported learner evidence. Pure functions over normalised students
// (see share.js). Everything a teacher sees traces to ledger entries; recommendations come from
// stated rules, not a model, and say what evidence produced them.
import { FEATURES, buildProfile, focusAreas, firstAttempts, featureValue, MIN_POINTS } from "./ledger.js";
import { WORLD_MISSIONS } from "../content/world-missions.js";
import { BASE, asList, html, toHtml } from "../util.js";
import { PRACTICE_BANDS } from "./rubrics.js";

const chunk = (list, size) => {
  const n = Math.max(1, Math.ceil(list.length / size));
  const per = Math.ceil(list.length / n); // even groups, e.g. 7 → 4 + 3
  return Array.from({ length: n }, (_, i) => list.slice(i * per, (i + 1) * per));
};
const lastN = (a, n) => a.slice(Math.max(0, a.length - n));

/** One row per student for the class table. One malformed file never takes the whole class down. */
export function classSummary(students) {
  return students.map((s) => {
    try {
      return summarizeStudent(s);
    } catch {
      return { id: s.id || s.alias, alias: s.alias || "Student", section: s.section || "", band: s.band || "6-8", firstAttempts: 0, independentShare: null, revisions: 0, topPattern: null, focus: [], dependent: [], enoughEvidence: false, lastWords: null, lastActive: null, speakingTakes: 0, broken: true, profile: buildProfile([]) };
    }
  });
}

function summarizeStudent(s) {
  const p = buildProfile(s.ledger.entries, { band: s.band });
  const focus = focusAreas(p);
  const dependent = Object.entries(p.features)
    .filter(([, f]) => f.dependence.status === "ok" && f.dependence.dependent)
    .map(([, f]) => f.label);
  const lastWords = lastN(firstAttempts(s.ledger.entries), 1)[0]?.m?.words ?? null;
  return {
    id: s.id || s.alias,
    alias: s.alias,
    section: s.section || "",
    band: s.band,
    firstAttempts: p.firstAttempts,
    independentShare: p.independenceShare,
    revisions: p.revisions,
    topPattern: p.errors.find((e) => !e.mastered)?.id || null,
    focus,
    dependent,
    enoughEvidence: p.firstAttempts >= MIN_POINTS,
    lastWords,
    lastActive: p.lastActive,
    speakingTakes: p.speaking.n,
    profile: p,
  };
}

/** Students a teacher should look at first, with the reason (evidence-based, no ranking by "level"). */
export function triage(rows, { now = Date.now(), staleDays = 14 } = {}) {
  const stale = rows.filter((r) => !r.broken && r.lastActive && now - Date.parse(r.lastActive) > staleDays * 864e5);
  return {
    stale,
    lowerAlone: rows.filter((r) => r.dependent.length),
    thin: rows.filter((r) => !r.broken && !r.enoughEvidence),
    broken: rows.filter((r) => r.broken),
  };
}

/** Small-group suggestions: students who share a pattern, a support-dependent feature, or a comprehension trap. */
export function groupSuggestions(students, patterns = {}, { minSize = 2, maxSize = 6 } = {}) {
  const pat = (id) => (Object.hasOwn(patterns, id) ? patterns[id] : undefined);
  const rows = classSummary(students);
  const buckets = new Map();
  const add = (key, kind, label, alias, why) => {
    if (!buckets.has(key)) buckets.set(key, { key, kind, label, members: [], why });
    const b = buckets.get(key);
    if (!b.members.includes(alias)) b.members.push(alias);
  };
  for (const r of rows) {
    for (const e of r.profile.errors.filter((x) => !x.mastered && x.drafts >= 2).slice(0, 2)) add(`pattern:${e.id}`, "pattern", pat(e.id)?.name || e.id, r.alias, `Showed up in 2+ recent pieces of work.`);
    for (const [k, f] of Object.entries(r.profile.features)) if (f.dependence.status === "ok" && f.dependence.dependent) add(`fade:${k}`, "fade", `Fade supports: ${f.label}`, r.alias, "Lower when working without supports.");
    const trap = r.profile.comprehension.topTrap;
    if (trap && trap.count >= 2) add(`trap:${trap.type}`, "trap", `Question trap: ${trap.type}`, r.alias, "Chose this kind of wrong answer 2+ times.");
    if (r.enoughEvidence && r.profile.features.cites.all.status === "ok" && r.profile.features.cites.latest === 0) add("evidence:none", "evidence", "Using the source as evidence", r.alias, "Recent writing cites the source 0 times.");
  }
  return [...buckets.values()]
    .filter((b) => b.members.length >= minSize)
    .map((b) => ({ ...b, chunks: chunk(b.members, maxSize), suggestion: suggestionFor(b, patterns) }))
    .sort((a, b) => b.members.length - a.members.length);
}

export function suggestionFor(b, patterns = {}) {
  if (b.kind === "pattern") {
    const p = Object.hasOwn(patterns, b.key.slice(8)) ? patterns[b.key.slice(8)] : undefined;
    return { minutes: 10, plan: p ? `Mini-lesson (5 min): “${p.lesson.rule}” Show “${p.lesson.wrong}” → “${p.lesson.right}”. Then students open the Language Error Detective case file “${p.name}” (5 min).` : "Open the matching Language Error Detective case file.", link: `/access-practice-lab/detective/${b.key.slice(8)}` };
  }
  if (b.kind === "fade") return { minutes: 15, plan: "Students redo a short Writing Studio task at “with a word bank” and then “on my own”. Compare the two drafts together: what moved from the frame into their own words?", link: "/access-practice-lab/write" };
  if (b.kind === "trap") return { minutes: 10, plan: `Model the check: point to the exact sentence that proves the answer. Students sort the options of one mission question by why each wrong answer is tempting (“${b.key.slice(5)}”).`, link: "/access-practice-lab/missions" };
  return { minutes: 15, plan: "Students mark two sentences in a source that prove their claim, then write one sentence that quotes or paraphrases each.", link: "/access-practice-lab/write" };
}

/** Per-student intervention suggestions with the evidence that produced each. */
export function interventionsFor(row, patterns = {}) {
  const out = [];
  for (const f of row.focus) {
    if (f.kind === "pattern") out.push({ what: `Detective case: ${(Object.hasOwn(patterns, f.id) ? patterns[f.id]?.name : "") || f.id}`, why: f.reason, link: `/access-practice-lab/detective/${f.id}` });
    else if (f.kind === "independence") out.push({ what: "Practice the same kind of task one stage down: word bank → on my own", why: f.reason, link: "/access-practice-lab/write" });
    else if (f.kind === "trap") out.push({ what: "Evidence check for questions: find the proof sentence before choosing", why: f.reason, link: "/access-practice-lab/missions" });
    else out.push({ what: "Conference on a recent draft: choose one feature to push", why: f.reason, link: "/access-practice-lab/write" });
  }
  if (!row.enoughEvidence) out.push({ what: "Collect more evidence: 3 first attempts at studio tasks", why: `Only ${row.firstAttempts} first attempt${row.firstAttempts === 1 ? "" : "s"} so far.`, link: "/access-practice-lab/write" });
  return out;
}

/** Latest response samples a teacher can read: writing first vs latest, speaking transcripts. */
export function samplesFor(student) {
  const out = [];
  for (const [task, w] of Object.entries(student.studio.writing || {})) {
    const v = w.versions || [];
    if (v.length) out.push({ modality: "writing", task, stage: w.stage || "", first: v[0].text, latest: v.at(-1).text, versions: v.length, reflection: w.reflection || "", used: w.used || {} });
  }
  for (const [task, s] of Object.entries(student.studio.speaking || {})) {
    const t = (s.takes || []).filter((x) => x.transcript);
    if (t.length) out.push({ modality: "speaking", task, stage: s.stage || "", first: t[0].transcript, latest: t.at(-1).transcript, versions: t.length, audio: t.at(-1).audio || null, selfReview: t.at(-1).selfReview || null, teacherReview: t.at(-1).teacherReview || [] });
  }
  return out;
}

export const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export function toCSV(rows) {
  const head = ["Student", "Grades", "First attempts", "On own (%)", "Revisions", "Top pattern", "Support-dependent features", "Speaking takes", "Last active"];
  const lines = [head.map(csvCell).join(",")];
  for (const r of rows) lines.push([r.alias, r.band, r.firstAttempts, r.independentShare == null ? "" : Math.round(r.independentShare * 100), r.revisions, r.topPattern || "", r.dependent.join("; "), r.speakingTakes, (r.lastActive || "").slice(0, 10)].map(csvCell).join(","));
  return `${lines.join("\n")}\n`;
}

export const FEATURE_LABELS = Object.fromEntries(Object.entries(FEATURES).map(([k, f]) => [k, f.label]));
export { featureValue };

// ── Conference plans and supported-vs-independent gaps ──────────────────────────────────────────────
// Every rule below reads only first attempts from a learner's imported ledger (stage, Key Language Use
// and the measured features). A need is observable in the learner's own work; nothing is a level.

const TENSE_PATTERNS = ["past-marker", "irregular-ed"];
const num = (v) => typeof v === "number" && Number.isFinite(v);
const studioPath = (t, band) => `${BASE}/${t.modality === "speaking" ? "speak" : "write"}/${encodeURIComponent(t.id)}?grades=${band}`;

/** Observable needs, one per Key Language Use. `applies` = the entry measured it; `met` = target reached. */
export const CONFERENCE_NEEDS = [
  {
    id: "cohesion-explain",
    use: "Explain",
    dimension: "Discourse",
    label: "Discourse cohesion in Explain",
    target: "link ideas in at least two different ways (cause, sequence, contrast …)",
    applies: (e) => num(e.m?.link),
    met: (e) => e.m.link >= 2,
    script: [
      { minutes: 2, step: "Notice", say: "Read a two-sentence explanation with no linking words. Ask: how does sentence one lead to sentence two?" },
      { minutes: 3, step: "Model", say: "Think aloud while adding “because”, “as a result” and “however”. Name the job each word does: cause, effect, contrast." },
      { minutes: 3, step: "Try together", say: "Partners rewrite one of their own Explain sentences with two different linking words. Share one aloud." },
      { minutes: 2, step: "On my own", say: "Open the linked Explain task and choose “On my own”. Check: did I link ideas two different ways?" },
    ],
  },
  {
    id: "tense-narrate",
    use: "Narrate",
    dimension: "Sentence",
    label: "Verb tense consistency in Narrate",
    target: "keep completed events in the past tense",
    applies: (e) => e.m && typeof e.m.errs === "object" && e.m.errs !== null,
    met: (e) => !TENSE_PATTERNS.some((id) => (e.m.errs[id] || 0) > 0),
    script: [
      { minutes: 2, step: "Notice", say: "Show a retell that switches “we planted … we measure”. Ask: when did this happen? Which verb does not match?" },
      { minutes: 3, step: "Model", say: "Underline time words (yesterday, on day seven, first). Change each verb to match: measure → measured, take → took." },
      { minutes: 3, step: "Try together", say: "Partners retell three steps of a recent event aloud; the listener taps the table at each past-tense verb." },
      { minutes: 2, step: "On my own", say: "Open the linked Narrate task and choose “On my own”. Check every verb after a time word." },
    ],
  },
  {
    id: "evidence-argue",
    use: "Argue",
    dimension: "Discourse",
    label: "Evidence citation in Argue",
    target: "cite at least one detail or number from the source",
    applies: (e) => num(e.m?.cites),
    met: (e) => e.m.cites >= 1,
    script: [
      { minutes: 2, step: "Notice", say: "Show a claim with no support. Ask: why should a reader believe this? What in the source proves it?" },
      { minutes: 3, step: "Model", say: "Highlight one number in the source and say: “According to the survey, 14 of 20 riders … This shows …”." },
      { minutes: 3, step: "Try together", say: "Partners find one source detail for their own claim and say it with “According to …” or “The data shows …”." },
      { minutes: 2, step: "On my own", say: "Open the linked Argue task and choose “On my own”. Check: did I name where my evidence comes from?" },
    ],
  },
  {
    id: "precision-inform",
    use: "Inform",
    dimension: "Word/Phrase",
    label: "Precise subject words in Inform",
    target: "use at least two precise subject words",
    applies: (e) => num(e.m?.academic),
    met: (e) => e.m.academic >= 2,
    script: [
      { minutes: 2, step: "Notice", say: "Show a description using “thing”, “stuff” and “a lot”. Ask: which words could be more exact?" },
      { minutes: 3, step: "Model", say: "Swap each general word for a source term (rainfall, average, habitat) and say why the reader learns more." },
      { minutes: 3, step: "Try together", say: "Partners list three subject words from the task source and use two of them in one sentence." },
      { minutes: 2, step: "On my own", say: "Open the linked Inform task and choose “On my own”. Check: two subject words from the source?" },
    ],
  },
];

/** A learner's first attempts for one need, split by supported (frames or word bank) and independent. */
export function needEvidence(student, need) {
  const fa = firstAttempts(student?.ledger?.entries || [], (e) => e.use === need.use && need.applies(e));
  const split = (list) => ({ n: list.length, met: list.filter((e) => need.met(e)).length });
  return {
    supported: split(fa.filter((e) => e.stage !== "independent")),
    independent: split(fa.filter((e) => e.stage === "independent")),
    notMet: fa.filter((e) => !need.met(e)).length,
    total: fa.length,
  };
}

/** Matching studio tasks, alternating writing and speaking so a group can practise both. */
function tasksFor(need, tasks, band, limit = 3) {
  const match = tasks.filter((t) => t.keyUse === need.use && (t.band || "6-8") === band);
  const w = match.filter((t) => t.modality !== "speaking");
  const sp = match.filter((t) => t.modality === "speaking");
  const mixed = [];
  for (let i = 0; mixed.length < match.length; i++) mixed.push(...[w[i], sp[i]].filter(Boolean));
  return mixed.slice(0, limit).map((t) => ({ id: t.id, title: t.title, modality: t.modality, url: studioPath(t, band) }));
}

/**
 * Small-group conference plans: students whose first attempts missed the same observable target at
 * least `minMissed` times. `tasks` = studio tasks ({id,title,keyUse,band,modality}) for launch links.
 * Launch links carry only a task id and grade band — never learner data.
 */
export function conferencePlans(students, tasks = [], { minSize = 2, maxSize = 6, minMissed = 2 } = {}) {
  const plans = [];
  for (const need of CONFERENCE_NEEDS) {
    const byBand = new Map();
    for (const s of students) {
      let ev;
      try {
        ev = needEvidence(s, need);
      } catch {
        continue;
      }
      if (ev.notMet < minMissed) continue;
      const band = s.band === "3-5" ? "3-5" : "6-8";
      if (!byBand.has(band)) byBand.set(band, []);
      byBand.get(band).push({ alias: s.alias, section: s.section || "", why: `${ev.notMet} of ${ev.total} ${need.use} first attempts did not yet ${need.target}.` });
    }
    for (const [band, members] of byBand) {
      if (members.length < minSize) continue;
      plans.push({
        key: `${need.id}:${band}`,
        need: need.id,
        label: need.label,
        use: need.use,
        dimension: need.dimension,
        band,
        members,
        chunks: chunk(members.map((m) => m.alias), maxSize),
        minutes: need.script.reduce((a, s) => a + s.minutes, 0),
        script: need.script,
        launches: tasksFor(need, tasks, band),
      });
    }
  }
  return plans.sort((a, b) => b.members.length - a.members.length || a.key.localeCompare(b.key));
}

/**
 * Supported-vs-independent gaps: the learner meets a target with frames or a word bank (at least two
 * supported first attempts, two-thirds or more met) but has no independent evidence yet ("untested"),
 * or meets it at least one-third less often on their own ("gap"). Counts are always shown, never a score.
 */
export function supportGaps(students, tasks = []) {
  const out = [];
  for (const s of students)
    for (const need of CONFERENCE_NEEDS) {
      let ev;
      try {
        ev = needEvidence(s, need);
      } catch {
        continue;
      }
      const { supported: sup, independent: ind } = ev;
      if (sup.n < 2 || sup.met / sup.n < 2 / 3) continue;
      const supRate = sup.met / sup.n;
      let status = "";
      if (ind.n === 0) status = "untested";
      else if (ind.met / ind.n <= supRate - 1 / 3) status = "gap";
      if (!status) continue;
      const band = s.band === "3-5" ? "3-5" : "6-8";
      out.push({
        alias: s.alias,
        section: s.section || "",
        need: need.id,
        label: need.label,
        use: need.use,
        supported: sup,
        independent: ind,
        status,
        why:
          status === "untested"
            ? `Met the target with supports in ${sup.met} of ${sup.n} first attempts; no independent ${need.use} attempts yet.`
            : `Met the target with supports in ${sup.met} of ${sup.n}; on their own in ${ind.met} of ${ind.n}.`,
        next: `Transfer practice: assign the next ${need.use} task and ask the learner to choose “On my own” (Independent Mode).`,
        launch: tasksFor(need, tasks, band, 1)[0] || null,
      });
    }
  return out;
}

/**
 * SYNTHETIC DEMO class for exploring the panel with no real codes. Every alias and section says so, and
 * the dashboard keeps it in memory only (never saved with the roster).
 */
export const DEMO_LABEL = "SYNTHETIC DEMO";
export function demoClass() {
  const day = (i) => `2026-01-${String(5 + i).padStart(2, "0")}T14:00:00.000Z`;
  const entry = (i, use, stage, m) => ({
    id: `demo-${use}-${i}-${stage}`,
    t: day(i),
    src: "writing",
    task: `demo-${use.toLowerCase()}-${i}`,
    band: "6-8",
    domain: "Writing",
    use,
    stage,
    kind: "first",
    supports: stage === "independent" ? {} : stage === "guided" ? { frames: true, bank: true } : { bank: true },
    m: { words: 60, link: 2, cites: 1, complex: 1, academic: 2, errs: {}, moves: {}, ...m },
  });
  const student = (letter, entries) => ({
    alias: `${DEMO_LABEL} Student ${letter}`,
    section: DEMO_LABEL,
    band: "6-8",
    created: day(0),
    demo: true,
    id: `${DEMO_LABEL}|${letter}`,
    ledger: { entries: entries.map((e, i) => ({ ...e, t: day(i) })) },
    records: {},
    studio: { writing: {}, speaking: {}, missions: {}, detective: {} },
  });
  return [
    student("A", [entry(0, "Explain", "supported", { link: 1 }), entry(1, "Explain", "independent", { link: 0 }), entry(2, "Narrate", "supported", { errs: { "past-marker": 1 } }), entry(3, "Narrate", "independent", { errs: { "past-marker": 2 } })]),
    student("B", [entry(0, "Explain", "supported", { link: 1 }), entry(1, "Explain", "supported", { link: 1 }), entry(2, "Argue", "guided"), entry(3, "Argue", "supported")]),
    student("C", [entry(0, "Explain", "independent", { link: 1 }), entry(1, "Explain", "independent", { link: 0 }), entry(2, "Argue", "independent", { cites: 0 }), entry(3, "Argue", "independent", { cites: 0 })]),
    student("D", [entry(0, "Narrate", "guided", { errs: { "irregular-ed": 1 } }), entry(1, "Narrate", "independent", { errs: { "past-marker": 1 } }), entry(2, "Argue", "supported", { cites: 0 }), entry(3, "Argue", "independent", { cites: 0 })]),
    student("E", [entry(0, "Inform", "supported"), entry(1, "Inform", "supported"), entry(2, "Inform", "independent", { academic: 0 }), entry(3, "Inform", "independent", { academic: 1 })]),
  ];
}

// ── Station cards (Launch Studio print view and tools/generate-access-studio-printables.mjs) ────────────
// One builder, one renderer: the page and the generated printable call the same two functions over the same
// content files, so they cannot drift. Practice materials only — never an ACCESS score sheet.

export const QR_NOTE =
  "No QR code: this lab has no verified QR encoder, so the direct link is printed in full instead.";
const bandOf = (b) => (b === "3-5" ? "3-5" : "6-8");
const activityPath = (domain, level, id) =>
  domain === "Model-Test"
    ? `${BASE}/Model-Test/${level.split("-").slice(0, 2).join("-")}/${level.split("-")[2]}/${id}`
    : `${BASE}/${domain}/${level}/${id}`;

/** Selectable station items for a band: worlds, studio tasks, and (when passed) bank activity rows. */
export function stationOptions({ band = "6-8", worlds = [], speaking = [], writing = [], activities = [] } = {}) {
  const b = bandOf(band);
  return [
    ...worlds.map((w) => ({ kind: "world", id: w.id, label: `World · ${w.name}` })),
    ...speaking.filter((t) => bandOf(t.band) === b).map((t) => ({ kind: "studio", id: t.id, label: `Speaking Studio · ${t.title}` })),
    ...writing.filter((t) => bandOf(t.band) === b).map((t) => ({ kind: "studio", id: t.id, label: `Writing Studio · ${t.title}` })),
    ...activities.filter((r) => bandOf(r.band) === b).map((r) => ({ kind: "activity", id: r.id, label: `Activity · ${r.title} · ${r.domain}` })),
  ];
}

/**
 * Content of one printable station sheet.
 * @param {{kind:"world"|"studio"|"activity", id:string}} sel
 * @param {{band?:string, worlds?:any[], speaking?:any[], writing?:any[], exemplars?:any[], standards?:{code:string,name:string}[], activity?:{domain:string, level:string, activity:any}}} data
 */
export function stationCard(sel, data = {}) {
  const band = bandOf(data.band);
  const stdName = (code) => (data.standards || []).find((x) => x.code === code)?.name || "";
  if (sel?.kind === "world") {
    const w = (data.worlds || []).find((x) => x.id === sel.id);
    if (!w) return null;
    const missions = WORLD_MISSIONS[w.id]?.bands?.[band] || [];
    return {
      kind: "world",
      id: w.id,
      title: `${w.name} — Language World`,
      subtitle: `${w.domain} · ${missions.length} missions`,
      path: `${BASE}/worlds/${encodeURIComponent(w.id)}?grades=${band}`,
      standards: [],
      standardNote: "No single WIDA ELD standard is tagged for this world; each mission sets its own content context.",
      keyUses: asList(w.keyUses),
      lookFors: [w.focus, ...missions.flatMap((m) => asList(m.successCriteria)).slice(0, 3)].filter(Boolean),
      probes: missions.slice(0, 3).map((m) => m.prompt).filter(Boolean),
      exemplars: [],
      exemplarNote: "No early / building / strong exemplars are authored for Language World missions. Print a Speaking or Writing Studio station card for practice anchors.",
      notes: [w.description, missions.length ? `Missions: ${missions.map((m) => m.title).join("; ")}.` : ""].filter(Boolean),
    };
  }
  if (sel?.kind === "studio") {
    const speak = (data.speaking || []).find((x) => x.id === sel.id);
    const t = speak || (data.writing || []).find((x) => x.id === sel.id);
    if (!t) return null;
    const exemplars = PRACTICE_BANDS.map((b) => (data.exemplars || []).find((x) => x.taskId === t.id && x.practiceBand === b.id))
      .filter(Boolean)
      .map((x) => ({ band: x.practiceBand, response: x.response, why: x.whyThisBand, next: x.nextStep }));
    return {
      kind: "studio",
      id: t.id,
      title: t.title,
      subtitle: `${speak ? "Speaking" : "Writing"} Studio · ${t.contentArea} · ${t.time}`,
      path: `${BASE}/${speak ? "speak" : "write"}/${encodeURIComponent(t.id)}?grades=${band}`,
      standards: asList(t.standards).map((code) => ({ code, name: stdName(code) })),
      standardNote: "",
      keyUses: asList(t.keyUse),
      lookFors: asList(speak ? t.teacher?.listenFor : t.teacher?.lookFor),
      probes: speak
        ? [t.teacher?.followUp, ...asList(t.planner).slice(0, 2).map((p) => p.hint)].filter(Boolean)
        : asList(t.revisionPrompts).slice(0, 3).map((p) => p.prompt),
      exemplars,
      exemplarNote: exemplars.length ? "" : "No practice-band exemplars are authored for this task yet.",
      notes: [`Task: ${t.prompt}`, ...asList(t.teacher?.commonIssues).slice(0, 2).map((x) => `Common issue: ${x}`)],
    };
  }
  if (sel?.kind === "activity") {
    const row = data.activity;
    const a = row?.activity;
    if (!a || a.id !== sel.id) return null;
    const tch = a.teacher || {};
    return {
      kind: "activity",
      id: a.id,
      title: a.title,
      subtitle: `${row.domain} · ${a.skill || "Language practice"} · ${a.time || "Flexible time"}`,
      path: `${activityPath(row.domain, row.level, a.id)}?grades=${band}${sel.mode === "independent" ? "&mode=independent" : ""}`,
      standards: [],
      standardNote: asList(a.wida).length ? `WIDA focus (activity tags): ${asList(a.wida).join("; ")}.` : "No WIDA ELD standard is tagged for this activity.",
      keyUses: [],
      keyUseNote: tch.function ? `Not tagged. Language function: ${tch.function}` : "Not tagged for this activity.",
      lookFors: [...asList(a.listenFor), tch.onLevel].filter(Boolean),
      probes: [tch.prompt, typeof a.extension === "string" ? a.extension : ""].filter(Boolean),
      exemplars: [],
      exemplarNote: "Activity-bank items have no early / building / strong exemplars. Print a Speaking or Writing Studio station card for practice anchors.",
      notes: [tch.use && `Use: ${tch.use}`, tch.lower && `Lower support: ${tch.lower}`, tch.challenge && `Challenge: ${tch.challenge}`, tch.noTech && `No-tech option: ${tch.noTech}`].filter(Boolean),
    };
  }
  return null;
}

const titleCase = (s) => `${s[0].toUpperCase()}${s.slice(1)}`;
/** The station sheet as an HTML string. `origin` makes the printed link absolute. */
export function stationCardHTML(card, origin = "") {
  if (!card) return "";
  const url = `${origin}${card.path}`;
  const list = (items) => html`<ul>${items.map((x) => html`<li>${x}</li>`)}</ul>`;
  return toHtml(html`<article class="station-card" data-station="${card.kind}:${card.id}">
    <header class="station-head">
      <p class="station-kicker">ACCESS Practice Lab · Station card · Teacher notes</p>
      <h2>${card.title}</h2>
      <p class="station-sub">${card.subtitle}</p>
    </header>
    <section class="station-link" aria-label="Direct link">
      <p class="station-url">${url}</p>
      <p class="station-fine">${QR_NOTE} The link holds the activity and grade band only — no student information.</p>
    </section>
    <section class="station-meta">
      <p><strong>WIDA ELD standard:</strong> ${card.standards.length ? card.standards.map((s) => `${s.code}${s.name ? ` — ${s.name}` : ""}`).join("; ") : card.standardNote}</p>
      <p><strong>Key Language Use:</strong> ${card.keyUses.length ? card.keyUses.join(", ") : card.keyUseNote || "Not tagged."}</p>
    </section>
    <section><h3>Look-fors</h3>${card.lookFors.length ? list(card.lookFors) : html`<p>None authored.</p>`}</section>
    <section><h3>Oral probing questions</h3>${card.probes.length ? list(card.probes) : html`<p>None authored.</p>`}</section>
    <section class="station-exemplars"><h3>Answer key · exemplar responses (practice bands)</h3>
      ${card.exemplars.length ? card.exemplars.map((x) => html`<div class="station-ex"><h4>${titleCase(x.band)}</h4><p class="station-resp">${x.response}</p><p class="station-fine">${x.why} <strong>Next:</strong> ${x.next}</p></div>`) : html`<p>${card.exemplarNote}</p>`}
    </section>
    ${card.notes.length ? html`<section><h3>Teacher notes</h3>${list(card.notes)}</section>` : ""}
    <p class="station-fine">Classroom practice, not an official WIDA test, score, level or placement. Practice bands are early / building / strong.</p>
  </article>`);
}
