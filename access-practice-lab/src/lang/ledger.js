// Evidence ledger + learner profile.
//
// The ledger is the one place the lab records *what a learner did, under which supports*. Everything
// the Growth Map, adaptive missions and the teacher dashboard say is derived from it, so nothing can
// claim more than was observed. Entries hold numbers and ids, not student text (the text already lives
// in the activity records the student exports).
//
// Honesty rules, enforced here:
//  * trends need ≥ MIN_POINTS first attempts; fewer → "not enough evidence yet", never a guess.
//  * a first attempt made WITHOUT supports ("independent") is never mixed with supported ones.
//  * a revision after feedback is "supported by feedback" even if the stage was independent.
//  * there is no composite score and no proficiency label anywhere in the output.
import { safeJson, storage } from "../util.js";

export const LEDGER_KEY = "accessPracticeLab:v1:ledger";
export const MAX_ENTRIES = 600;
export const MIN_POINTS = 3;
export const STAGES = ["guided", "supported", "independent"];

/** Features tracked per attempt: key → { label, dimension, better }. */
export const FEATURES = {
  words: { label: "Amount written or said", dimension: "Discourse", better: "higher" },
  link: { label: "Ways of linking ideas", dimension: "Discourse", better: "higher" },
  cites: { label: "Evidence from the source", dimension: "Discourse", better: "higher" },
  moves: { label: "Moves of the genre made", dimension: "Discourse", better: "higher" },
  complex: { label: "Sentences with more than one idea", dimension: "Sentence", better: "higher" },
  errs: { label: "Pattern errors per 100 words", dimension: "Sentence", better: "lower" },
  academic: { label: "Precise subject words", dimension: "Word/Phrase", better: "higher" },
};

const nowISO = () => new Date().toISOString();
const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function loadLedger(read = (k) => storage.get(k)) {
  const raw = safeJson(read(LEDGER_KEY), null);
  return {
    v: 1,
    entries: Array.isArray(raw?.entries) ? raw.entries.filter((e) => e && e.t && e.src) : [],
  };
}
export function saveLedger(ledger, write = (k, v) => storage.set(k, v)) {
  const entries = ledger.entries.slice(-MAX_ENTRIES);
  return write(LEDGER_KEY, JSON.stringify({ v: 1, entries }));
}

/**
 * Shape of one entry:
 * { id, t, src: "writing"|"speaking"|"mission"|"detective"|"item", task, band, domain, use,
 *   stage: "guided"|"supported"|"independent", kind: "first"|"revision"|"retry"|"transfer",
 *   supports: {frames,bank,model,coach,l1,hint}, m: {…features…} }
 */
export function makeEntry(partial) {
  const supports = partial.supports || {};
  const used = Object.values(supports).some(Boolean);
  return {
    id: partial.id || uid(),
    t: partial.t || nowISO(),
    src: partial.src,
    task: partial.task || "",
    band: partial.band || "6-8",
    domain: partial.domain || "",
    use: partial.use || "",
    // A stage claims "independent" only when no support was actually opened.
    stage:
      partial.stage === "independent" && used
        ? "supported"
        : partial.stage || (used ? "supported" : "independent"),
    kind: partial.kind || "first",
    attempt: partial.attempt || "",
    supports,
    m: partial.m || {},
  };
}

export function appendEntry(ledger, partial) {
  const e = makeEntry(partial);
  ledger.entries.push(e);
  if (ledger.entries.length > MAX_ENTRIES + 50)
    ledger.entries.splice(0, ledger.entries.length - MAX_ENTRIES);
  return e;
}

/** Union of two ledgers by entry id (used when importing a backup). Local entries win. */
export function mergeLedgers(local, incoming) {
  const seen = new Set(local.entries.map((e) => e.id));
  const merged = [...local.entries, ...incoming.entries.filter((e) => e?.id && !seen.has(e.id))];
  merged.sort((a, b) => String(a.t).localeCompare(String(b.t)));
  return { v: 1, entries: merged.slice(-MAX_ENTRIES) };
}

/** The numeric value of one tracked feature for an entry (null = not applicable to that entry). */
export function featureValue(entry, key) {
  const m = entry.m || {};
  if (entry.src !== "writing" && entry.src !== "speaking" && entry.src !== "mission") return null;
  if (!m.words) return null;
  switch (key) {
    case "words":
      return m.words;
    case "link":
      return m.link ?? null;
    case "cites":
      return m.cites ?? null;
    case "complex":
      return m.complex ?? null;
    case "academic":
      return m.academic ?? null;
    case "moves": {
      const v = Object.values(m.moves || {});
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    }
    case "errs":
      return (Object.values(m.errs || {}).reduce((a, b) => a + b, 0) / m.words) * 100;
    default:
      return null;
  }
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

/**
 * Direction of change in a feature across a learner's FIRST attempts, in order. Compares the earlier
 * half to the later half; "steady" when the difference is under 10% of the earlier mean.
 */
export function trend(values, better = "higher") {
  if (values.length < MIN_POINTS)
    return { status: "insufficient", n: values.length, needed: MIN_POINTS };
  const half = Math.floor(values.length / 2);
  const early = avg(values.slice(0, half || 1));
  const late = avg(values.slice(values.length - Math.max(half, 1)));
  const scale = Math.max(Math.abs(early), 0.5);
  const rel = (late - early) / scale;
  const dir = Math.abs(rel) < 0.1 ? "flat" : rel > 0 === (better === "higher") ? "up" : "down";
  return {
    status: "ok",
    n: values.length,
    early,
    late,
    change: late - early,
    direction: dir === "up" ? "improving" : dir === "down" ? "slipping" : "steady",
  };
}

/** First attempts only, optionally filtered. */
export const firstAttempts = (entries, f = () => true) =>
  entries.filter(
    (e) =>
      e.kind === "first" &&
      ["writing", "speaking", "mission"].includes(e.src) &&
      e.m?.words &&
      f(e),
  );

/**
 * Support dependence for one feature: do independent first attempts look like supported ones?
 * Needs ≥ MIN_POINTS of each, otherwise says so.
 */
export function supportDependence(entries, key, better = "higher") {
  const fa = firstAttempts(entries);
  const ind = fa
    .filter((e) => e.stage === "independent")
    .map((e) => featureValue(e, key))
    .filter((v) => v != null);
  const sup = fa
    .filter((e) => e.stage !== "independent")
    .map((e) => featureValue(e, key))
    .filter((v) => v != null);
  if (ind.length < MIN_POINTS || sup.length < MIN_POINTS)
    return { status: "insufficient", independentN: ind.length, supportedN: sup.length };
  const a = avg(ind);
  const b = avg(sup);
  const gap = better === "higher" ? (b - a) / Math.max(b, 0.5) : (a - b) / Math.max(a, 0.5);
  return {
    status: "ok",
    independent: a,
    supported: b,
    independentN: ind.length,
    supportedN: sup.length,
    dependent: gap > 0.3,
    gap,
  };
}

/** Pattern errors: how often each shows up in the learner's recent work, and which are fixed on transfer. */
export function errorPatterns(entries, { recent = 12 } = {}) {
  // One piece of work counts once, in its latest state: a pattern fixed in the final version is no longer
  // "recurring", and revising a draft three times is not three drafts with the error.
  const latest = new Map();
  for (const e of entries.filter((x) => ["writing", "speaking", "mission"].includes(x.src) && x.m?.errs)) {
    const key = `${e.src}:${e.task}`;
    latest.delete(key);
    latest.set(key, e);
  }
  const writing = [...latest.values()].slice(-recent);
  const counts = {};
  const seenIn = {};
  writing.forEach((e, i) => {
    for (const [id, n] of Object.entries(e.m.errs)) {
      counts[id] = (counts[id] || 0) + n;
      (seenIn[id] = seenIn[id] || new Set()).add(i);
    }
  });
  const transfer = {};
  for (const e of entries.filter((x) => x.src === "detective")) {
    const id = e.m?.pattern;
    if (!id) continue;
    const t = (transfer[id] = transfer[id] || {
      practiced: 0,
      transferTried: 0,
      transferIndependent: 0,
      transferWithHelp: 0,
      days: 0,
      _days: new Set(),
      _prompts: new Set(),
    });
    if (e.kind === "transfer") {
      t.transferTried++;
      if (e.m.ok) {
        if (e.stage === "independent") {
          // credit independent passes only when they are on different days and different prompts
          const day = String(e.t).slice(0, 10);
          if (!t._days.has(day) || !t._prompts.has(e.m.prompt || "")) t.transferIndependent++;
          t._days.add(day);
          t._prompts.add(e.m.prompt || "");
          t.days = t._days.size;
        } else t.transferWithHelp++;
      }
    } else t.practiced++;
  }
  return Object.entries(counts)
    .map(([id, n]) => ({
      id,
      count: n,
      drafts: seenIn[id].size,
      transfer: transfer[id] || null,
      mastered: (transfer[id]?.transferIndependent || 0) >= 2 && (transfer[id]?.days || 0) >= 2 && n < 2,
    }))
    .sort((a, b) => b.drafts - a.drafts || b.count - a.count);
}

/** Comprehension (listening/reading questions): accuracy by skill and the distractor the learner reaches for. */
export function comprehension(entries) {
  const qs = entries
    .filter((e) => e.src === "mission" || e.src === "item")
    .flatMap((e) => (e.m?.questions || []).map((q) => ({ ...q, stage: e.stage })));
  const by = {};
  const traps = {};
  for (const q of qs) {
    const s = (by[q.skill] = by[q.skill] || { n: 0, ok: 0, independentN: 0, independentOk: 0 });
    s.n++;
    if (q.ok) s.ok++;
    if (q.stage === "independent") {
      s.independentN++;
      if (q.ok) s.independentOk++;
    }
    if (!q.ok && q.distractor) traps[q.distractor] = (traps[q.distractor] || 0) + 1;
  }
  const topTrap = Object.entries(traps).sort((a, b) => b[1] - a[1])[0];
  return {
    bySkill: by,
    total: qs.length,
    topTrap: topTrap ? { type: topTrap[0], count: topTrap[1] } : null,
  };
}

export function speakingTrend(entries) {
  const sp = entries.filter((e) => e.src === "speaking" && e.kind === "first" && e.m?.spk);
  const series = (k) => sp.map((e) => e.m.spk[k]).filter((v) => typeof v === "number");
  return {
    n: sp.length,
    speechSeconds: trend(series("speech"), "higher"),
    longestRun: trend(series("run"), "higher"),
    pausesPer30: trend(series("pauses30"), "lower"),
  };
}

/** The full profile. Pure: pass any entries (a student's, or a teacher-imported set). */
export function buildProfile(entries, { band = null } = {}) {
  const e = entries.filter((x) => !band || x.band === band);
  const fa = firstAttempts(e);
  const features = {};
  for (const [key, meta] of Object.entries(FEATURES)) {
    const independentSeries = fa
      .filter((x) => x.stage === "independent")
      .map((x) => featureValue(x, key))
      .filter((v) => v != null);
    const allSeries = fa.map((x) => featureValue(x, key)).filter((v) => v != null);
    features[key] = {
      ...meta,
      all: trend(allSeries, meta.better),
      independent: trend(independentSeries, meta.better),
      dependence: supportDependence(e, key, meta.better),
      latest: allSeries.at(-1) ?? null,
    };
  }
  const total = fa.length;
  const independent = fa.filter((x) => x.stage === "independent").length;
  const byUse = {};
  for (const x of fa) {
    const u = (byUse[x.use || "Other"] = byUse[x.use || "Other"] || { n: 0, independent: 0 });
    u.n++;
    if (x.stage === "independent") u.independent++;
  }
  return {
    attempts: e.length,
    firstAttempts: total,
    independentFirstAttempts: independent,
    independenceShare: total ? independent / total : null,
    revisions: e.filter((x) => x.kind === "revision").length,
    byUse,
    features,
    errors: errorPatterns(e),
    comprehension: comprehension(e),
    speaking: speakingTrend(e),
    detective: e.filter((x) => x.src === "detective").length,
    lastActive: e.at(-1)?.t || null,
  };
}

/**
 * Which stage to offer for the next task of this Key Language Use, from demonstrated performance.
 *  - "independent" when ≥ 3 first attempts of this use exist, ≥ 2 were independent, and no pattern error persists;
 *  - "guided" when there is no evidence yet;
 *  - "supported" otherwise.
 * The learner can always override; this is a default with a reason, not a gate.
 */
export function suggestStage(profile, use) {
  const u = profile.byUse[use] || { n: 0, independent: 0 };
  const persistent = profile.errors.filter((p) => p.drafts >= 3 && !p.mastered).length;
  if (u.n === 0)
    return {
      stage: "guided",
      reason: "No attempts at this kind of task yet — start with all the supports.",
    };
  if (u.n >= 3 && u.independent >= 2 && persistent === 0)
    return {
      stage: "independent",
      reason: `You made ${u.independent} independent attempts at this kind of task. Show it again with no supports.`,
    };
  if (u.independent === 0 && u.n >= 2)
    return {
      stage: "supported",
      reason: "You have practiced this with help — try with only a word bank.",
    };
  return { stage: "supported", reason: "Keep building: use the word bank, then try without it." };
}

/** Ranked focus areas with the evidence behind each one. Max 3. */
export function focusAreas(profile) {
  const out = [];
  for (const p of profile.errors.slice(0, 2))
    if (p.drafts >= 2 && !p.mastered)
      out.push({
        kind: "pattern",
        id: p.id,
        reason: `Showed up in ${p.drafts} recent pieces of work.`,
        weight: 3 + p.drafts,
      });
  for (const [key, f] of Object.entries(profile.features)) {
    if (f.all.status === "ok" && f.all.direction === "slipping")
      out.push({
        kind: "feature",
        id: key,
        reason: `${f.label} has gone down across your recent work.`,
        weight: 3,
      });
    if (f.dependence.status === "ok" && f.dependence.dependent)
      out.push({
        kind: "independence",
        id: key,
        reason: `${f.label} is lower when you work without supports.`,
        weight: 4,
      });
  }
  const c = profile.comprehension;
  if (c.topTrap && c.topTrap.count >= 2)
    out.push({
      kind: "trap",
      id: c.topTrap.type,
      reason: `You chose the “${c.topTrap.type}” kind of wrong answer ${c.topTrap.count} times.`,
      weight: 3,
    });
  return out.sort((a, b) => b.weight - a.weight).slice(0, 3);
}
