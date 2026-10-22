// Teacher-side analysis of imported learner evidence. Pure functions over normalised students
// (see share.js). Everything a teacher sees traces to ledger entries; recommendations come from
// stated rules, not a model, and say what evidence produced them.
import { FEATURES, buildProfile, focusAreas, firstAttempts, featureValue, MIN_POINTS } from "./ledger.js";

const lastN = (a, n) => a.slice(Math.max(0, a.length - n));

/** One row per student for the class table. */
export function classSummary(students) {
  return students.map((s) => {
    const p = buildProfile(s.ledger.entries, { band: s.band });
    const focus = focusAreas(p);
    const dependent = Object.entries(p.features).filter(([, f]) => f.dependence.status === "ok" && f.dependence.dependent).map(([k, f]) => f.label);
    const enough = p.firstAttempts >= MIN_POINTS;
    const lastWords = lastN(firstAttempts(s.ledger.entries), 1)[0]?.m?.words ?? null;
    return {
      alias: s.alias,
      band: s.band,
      firstAttempts: p.firstAttempts,
      independentShare: p.independenceShare,
      revisions: p.revisions,
      topPattern: p.errors.find((e) => !e.mastered)?.id || null,
      focus,
      dependent,
      enoughEvidence: enough,
      lastWords,
      lastActive: p.lastActive,
      speakingTakes: p.speaking.n,
      profile: p,
    };
  });
}

/** Small-group suggestions: students who share a pattern, a support-dependent feature, or a comprehension trap. */
export function groupSuggestions(students, patterns = {}, { minSize = 2, maxSize = 6 } = {}) {
  const rows = classSummary(students);
  const buckets = new Map();
  const add = (key, kind, label, alias, why) => {
    if (!buckets.has(key)) buckets.set(key, { key, kind, label, members: [], why });
    const b = buckets.get(key);
    if (!b.members.includes(alias)) b.members.push(alias);
  };
  for (const r of rows) {
    for (const e of r.profile.errors.filter((x) => !x.mastered && x.drafts >= 2).slice(0, 2)) add(`pattern:${e.id}`, "pattern", patterns[e.id]?.name || e.id, r.alias, `Showed up in 2+ recent pieces of work.`);
    for (const [k, f] of Object.entries(r.profile.features)) if (f.dependence.status === "ok" && f.dependence.dependent) add(`fade:${k}`, "fade", `Fade supports: ${f.label}`, r.alias, "Lower when working without supports.");
    const trap = r.profile.comprehension.topTrap;
    if (trap && trap.count >= 2) add(`trap:${trap.type}`, "trap", `Question trap: ${trap.type}`, r.alias, "Chose this kind of wrong answer 2+ times.");
    if (r.enoughEvidence && r.profile.features.cites.all.status === "ok" && r.profile.features.cites.latest === 0) add("evidence:none", "evidence", "Using the source as evidence", r.alias, "Recent writing cites the source 0 times.");
  }
  return [...buckets.values()]
    .filter((b) => b.members.length >= minSize)
    .map((b) => ({ ...b, members: b.members.slice(0, maxSize), overflow: Math.max(0, b.members.length - maxSize), suggestion: suggestionFor(b, patterns) }))
    .sort((a, b) => b.members.length - a.members.length);
}

export function suggestionFor(b, patterns = {}) {
  if (b.kind === "pattern") {
    const p = patterns[b.key.slice(8)];
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
    if (f.kind === "pattern") out.push({ what: `Detective case: ${patterns[f.id]?.name || f.id}`, why: f.reason, link: `/access-practice-lab/detective/${f.id}` });
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

const csvCell = (v) => {
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
