// Teacher evidence analytics. Pure functions over `passport_progress` rows (one per item, written when a sitting is
// submitted). Everything is a COUNT of observed practice on this device: no proficiency level, scale score or
// prediction is computed anywhere. A cell with fewer than MIN_EVIDENCE items reports "not enough evidence" instead
// of a percentage, matching the lab's ledger rule.
export const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
export const KLUS = ["Narrate", "Inform", "Explain", "Argue"];
export const CONTEXTS = ["Mathematics", "Science", "Social Studies", "Language Arts"];
export const MIN_EVIDENCE = 3;

const pct = (n, d) => (d ? Math.round((n / d) * 100) : null);
const key = (d, k, c) => `${d}|${k}|${c}`;

/** Newest row per learner+item+mode: a re-sit replaces the earlier answer in the matrix (history stays in `trend`). */
export function latestPerItem(rows) {
  const map = new Map();
  for (const r of [...rows].sort((a, b) => a.t - b.t)) map.set(`${r.learner}|${r.itemId}|${r.mode}`, r);
  return [...map.values()];
}

export function cellStats(rows) {
  const objective = rows.filter((r) => r.correct !== null && r.status !== "unanswered");
  const answered = rows.filter((r) => r.status !== "unanswered");
  const correct = objective.filter((r) => r.correct === true);
  const independent = correct.filter((r) => r.independent);
  const supported = answered.filter((r) => r.supportTier > 0 || r.attempts > 1);
  const n = answered.length;
  return {
    items: new Set(rows.map((r) => r.itemId)).size,
    attempted: n,
    objective: objective.length,
    correct: correct.length,
    independentCorrect: independent.length,
    supportedCorrect: correct.length - independent.length,
    needsReview: rows.filter((r) => r.status === "needs-review").length,
    scaffoldUse: supported.length,
    enough: n >= MIN_EVIDENCE,
    independentPct: objective.length >= MIN_EVIDENCE ? pct(independent.length, objective.length) : null,
    scaffoldPct: n >= MIN_EVIDENCE ? pct(supported.length, n) : null,
  };
}

/** Domain x Key Language Use x Academic Context. Missing cells are returned as `no-evidence`, never as zero performance. */
export function buildMatrix(rows) {
  const cells = {};
  const base = latestPerItem(rows);
  for (const d of DOMAINS)
    for (const k of KLUS)
      for (const c of CONTEXTS) {
        const subset = base.filter((r) => r.domain === d && r.klu === k && r.context === c);
        cells[key(d, k, c)] = { domain: d, klu: k, context: c, ...cellStats(subset), state: subset.length === 0 ? "no-evidence" : subset.length < MIN_EVIDENCE ? "not-enough" : "shown" };
      }
  return cells;
}

export function rollup(cells, by) {
  const out = {};
  for (const c of Object.values(cells)) {
    const k = c[by];
    out[k] ||= { attempted: 0, objective: 0, correct: 0, independentCorrect: 0, scaffoldUse: 0, needsReview: 0 };
    for (const f of Object.keys(out[k])) out[k][f] += c[f] || 0;
  }
  for (const v of Object.values(out)) {
    v.enough = v.attempted >= MIN_EVIDENCE;
    v.independentPct = v.objective >= MIN_EVIDENCE ? pct(v.independentCorrect, v.objective) : null;
    v.scaffoldPct = v.attempted >= MIN_EVIDENCE ? pct(v.scaffoldUse, v.attempted) : null;
  }
  return out;
}

/** Independent accuracy per sitting, oldest first. Needs MIN_EVIDENCE sittings before a trend is stated. */
export function independentTrend(rows) {
  const bySession = new Map();
  for (const r of rows) {
    const s = bySession.get(r.sessionId) || { sessionId: r.sessionId, t: r.t, objective: 0, independent: 0 };
    if (r.correct !== null && r.status !== "unanswered") {
      s.objective += 1;
      if (r.independent) s.independent += 1;
    }
    bySession.set(r.sessionId, s);
  }
  const points = [...bySession.values()].filter((s) => s.objective > 0).sort((a, b) => a.t - b.t).map((s) => ({ ...s, pct: pct(s.independent, s.objective) }));
  const enough = points.length >= MIN_EVIDENCE;
  const dir = !enough ? null : points.at(-1).pct - points[0].pct >= 10 ? "up" : points[0].pct - points.at(-1).pct >= 10 ? "down" : "steady";
  return { points, enough, direction: dir };
}

/** Items students most often miss on the first try. Needs MIN_EVIDENCE attempts per item. */
export function itemDifficulty(rows) {
  const by = new Map();
  for (const r of rows) {
    if (r.correct === null || r.status === "unanswered") continue;
    const e = by.get(r.itemId) || { itemId: r.itemId, domain: r.domain, klu: r.klu, attempts: 0, firstTryRight: 0 };
    e.attempts += 1;
    if (r.independent) e.firstTryRight += 1;
    by.set(r.itemId, e);
  }
  return [...by.values()].filter((e) => e.attempts >= MIN_EVIDENCE).map((e) => ({ ...e, firstTryPct: pct(e.firstTryRight, e.attempts) })).sort((a, b) => a.firstTryPct - b.firstTryPct);
}

/** Recommendations are rules over the counts above and always carry the evidence that triggered them. */
const MOVES = {
  Explain: { Listening: "Listen for cause-and-effect signal words (because, so, as a result), then retell the cause and the effect.", Reading: "Practice explaining causal relationships using diagrams and short science or social studies texts.", Speaking: "Use partner oral rehearsal with a cause-and-effect frame before explaining on their own.", Writing: "Use sentence-combining tasks to strengthen elaboration, then write a short explanation with a reason." },
  Argue: { Listening: "Listen to short claims and name the reason that supports each claim.", Reading: "Compare claims with their supporting reasons, then decide which reason is strongest.", Speaking: "Rehearse a claim, a reason and an example out loud with a partner before recording.", Writing: "Compare claims and supporting reasons before writing an argument; check each reason against the text." },
  Inform: { Listening: "Listen for the main idea and two details, then say them back in order.", Reading: "Revisit identifying the main idea and the evidence for it in informational texts.", Speaking: "Describe with specific details; practice topic sentence then two supporting details.", Writing: "Write an informational paragraph with a topic sentence and details drawn from the text." },
  Narrate: { Listening: "Listen for sequence words (first, next, then, finally) and retell the events in order.", Reading: "Sequence events from a narrative and note how time words connect them.", Speaking: "Retell a story with sequence words, using a picture or timeline as a prompt.", Writing: "Write a narrative retell that connects events with time words and a closing sentence." },
};
export const moveFor = (klu, domain) => MOVES[klu]?.[domain] || "";

export function recommend(cells, rows) {
  const recs = [];
  const byDomain = rollup(cells, "domain");
  const byKlu = rollup(cells, "klu");
  for (const d of DOMAINS) {
    const s = byDomain[d];
    if (!s) continue;
    if (!s.attempted) recs.push({ id: `missing-${d}`, priority: 3, type: "missing-evidence", text: `No ${d} evidence yet. Assign one ${d} practice set to start the record.`, evidence: { domain: d, attempted: 0 } });
    else if (s.enough && s.scaffoldPct >= 60) recs.push({ id: `scaffold-${d}`, priority: 1, type: "scaffold-reliance", text: `Supports were used on ${s.scaffoldPct}% of ${d} items (${s.scaffoldUse} of ${s.attempted}). Plan to fade supports: assign ${d} in test simulation after a learning-mode set.`, evidence: { domain: d, scaffoldUse: s.scaffoldUse, attempted: s.attempted } });
    if (s?.needsReview) recs.push({ id: `review-${d}`, priority: 1, type: "teacher-review", text: `${s.needsReview} ${d} ${s.needsReview === 1 ? "response needs" : "responses need"} your review. The lab does not score ${d.toLowerCase()} responses.`, evidence: { domain: d, needsReview: s.needsReview } });
  }
  for (const k of KLUS) {
    const s = byKlu[k];
    if (!s?.attempted) continue;
    if (s.independentPct !== null && s.independentPct < 50) {
      // aim the move at the domain where this use is weakest
      const weakest = DOMAINS.map((d) => ({ d, c: Object.values(cells).filter((c) => c.klu === k && c.domain === d && c.objective) })).map((x) => ({ d: x.d, obj: x.c.reduce((n, c) => n + c.objective, 0), ind: x.c.reduce((n, c) => n + c.independentCorrect, 0) })).filter((x) => x.obj >= MIN_EVIDENCE).sort((a, b) => a.ind / a.obj - b.ind / b.obj)[0];
      const d = weakest?.d || "Reading";
      recs.push({ id: `klu-${k}`, priority: 2, type: "key-language-use", text: `${k}: ${s.independentCorrect} of ${s.objective} objective items were right on the first try without support. ${moveFor(k, d)}`, evidence: { klu: k, independentCorrect: s.independentCorrect, objective: s.objective, domain: d } });
    }
  }
  const fns = functionStrengths(rows).filter((f) => f.enough);
  const weakFn = fns.filter((f) => f.independentPct < 50).sort((a, b) => a.independentPct - b.independentPct)[0];
  if (weakFn) recs.push({ id: `fn-${weakFn.fn}`, priority: 2, type: "language-function", text: `${weakFn.fn}: ${weakFn.independent} of ${weakFn.objective} objective items were right on the first try without support. Practice this language function in a short learning-mode set, then try a parallel task on your own.`, evidence: { fn: weakFn.fn, independent: weakFn.independent, objective: weakFn.objective } });
  const top = misconceptionCounts(rows)[0];
  if (top && top.n >= MIN_EVIDENCE) recs.push({ id: "misconception", priority: 2, type: "misconception", text: `The most common first-try error pattern was “${top.tag}” (${top.n} times). Revisit it with a short example and a sentence frame.`, evidence: { tag: top.tag, n: top.n } });
  const rev = revisionPatterns(rows);
  if (rev.enough && rev.recoveredPct < 50) recs.push({ id: "revision", priority: 2, type: "revision", text: `Revisions ended correct on ${rev.recovered} of ${rev.revised} items. Before revising, read the feedback aloud with a partner and name the one thing to change.`, evidence: { revised: rev.revised, recovered: rev.recovered } });
  const trend = independentTrend(rows);
  if (trend.enough && trend.direction === "down") recs.push({ id: "trend-down", priority: 2, type: "trend", text: "Independent accuracy has dropped across the last sittings. Re-check supports and consider a short learning-mode set before the next simulation.", evidence: { points: trend.points.map((p) => p.pct) } });
  return recs.sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}

/** Language-function strengths: independent accuracy per function, only where there are enough objective items. */
export function functionStrengths(rows) {
  const by = new Map();
  for (const r of latestPerItem(rows)) {
    if (r.correct === null || r.status === "unanswered") continue;
    for (const f of r.functions || []) {
      const e = by.get(f) || { fn: f, objective: 0, independent: 0 };
      e.objective += 1;
      if (r.independent) e.independent += 1;
      by.set(f, e);
    }
  }
  return [...by.values()].map((e) => ({ ...e, enough: e.objective >= MIN_EVIDENCE, independentPct: e.objective >= MIN_EVIDENCE ? pct(e.independent, e.objective) : null })).sort((a, b) => (b.independentPct ?? -1) - (a.independentPct ?? -1) || a.fn.localeCompare(b.fn));
}

/** How completely sittings were finished, by domain (a pattern in effort, not in ability). */
export function completionPatterns(rows) {
  const out = {};
  for (const r of rows) {
    const d = (out[r.domain] ||= { total: 0, unanswered: 0 });
    d.total += 1;
    if (r.status === "unanswered") d.unanswered += 1;
  }
  for (const d of Object.values(out)) d.unansweredPct = d.total >= MIN_EVIDENCE ? pct(d.unanswered, d.total) : null;
  return out;
}

/** Revision patterns in learning mode: how often a learner revised, and how often a revision ended correct. */
export function revisionPatterns(rows) {
  const learning = rows.filter((r) => r.mode === "formative" && r.status !== "unanswered" && r.correct !== null);
  const revised = learning.filter((r) => r.attempts > 1);
  const recovered = revised.filter((r) => r.correct === true);
  return { learningItems: learning.length, revised: revised.length, recovered: recovered.length, enough: revised.length >= MIN_EVIDENCE, recoveredPct: revised.length >= MIN_EVIDENCE ? pct(recovered.length, revised.length) : null };
}

/** Most common first-choice misconceptions (author-written tags on the wrong options), counted not interpreted. */
export function misconceptionCounts(rows) {
  const by = new Map();
  for (const r of rows) if (r.misconception) by.set(r.misconception, (by.get(r.misconception) || 0) + 1);
  return [...by.entries()].map(([tag, n]) => ({ tag, n })).sort((a, b) => b.n - a.n || a.tag.localeCompare(b.tag));
}

/** Speaking and writing responses waiting for a teacher, newest first. */
export const reviewQueue = (rows, reviewedKeys = new Set()) => rows.filter((r) => r.status === "needs-review" && !reviewedKeys.has(`${r.learner}|${r.sessionId}|${r.itemId}`)).sort((a, b) => b.t - a.t);

/** Data for the one-page student learning brief. Evidence dates and limits are part of the data, not decoration. */
export function learningBrief(rows, { learnerLabel = "Student", now = Date.now() } = {}) {
  const cells = buildMatrix(rows);
  const domains = rollup(cells, "domain");
  const times = rows.map((r) => r.t).sort((a, b) => a - b);
  const strengths = [];
  const priorities = [];
  for (const d of DOMAINS) {
    const s = domains[d];
    if (!s?.enough || s.independentPct === null) continue;
    (s.independentPct >= 70 ? strengths : s.independentPct < 50 ? priorities : []).push({ domain: d, independentPct: s.independentPct, objective: s.objective });
  }
  return {
    learnerLabel,
    generatedAt: now,
    firstEvidence: times[0] ?? null,
    lastEvidence: times.at(-1) ?? null,
    sittings: new Set(rows.map((r) => r.sessionId)).size,
    domains,
    strengths,
    priorities,
    trend: independentTrend(rows),
    functions: functionStrengths(rows).filter((f) => f.enough),
    misconceptions: misconceptionCounts(rows).slice(0, 3),
    revisions: revisionPatterns(rows),
    missing: DOMAINS.filter((d) => !domains[d]?.attempted),
    recommendations: recommend(cells, rows).slice(0, 5),
    limitations: ["Practice evidence from this device only. It is not a WIDA or ACCESS score and not a proficiency level.", "Speaking and writing are not scored by the lab; they need teacher review.", "A few items per language use is not enough to draw conclusions. Counts under three are not reported as percentages.", "Practice data alone is not evidence for reclassification, special education, Section 504 or IEP decisions."],
  };
}
