// Research Analyst: a deterministic question answerer. No language model and no network: a question is
// matched by keywords to one of a fixed set of intents, and each intent is answered by computation over the
// same local data the other views use. Every answer states how the question was read, the data used, the
// time range, the computation, its uncertainty and a suggested action.
import { recommendInstructionalGroups } from "../../access-practice-lab/src/lang/skill-graph.js";
import { meetsCriterion, policyFor } from "../../access-practice-lab/src/predict/policy.js";
import { RULES } from "./bottleneck.js";
import { eraOf, nextYear, SERIES_KEYS, seriesFor } from "./forecast.js";

const DOMAIN_WORDS = ["listening", "speaking", "reading", "writing", "overall"];
const cap = (w) => w[0].toUpperCase() + w.slice(1);
const domainsIn = (q) => DOMAIN_WORDS.filter((d) => new RegExp(`\\b${d}\\b`).test(q)).map(cap);
const pct = (x) => (x == null ? "—" : `${Math.round(x * 100)}%`);
const f1 = (x) => (x == null ? "—" : x.toFixed(1));

export const INTENTS = Object.freeze([
  {
    id: "growth-leaders",
    example: "Who shows the strongest speaking growth evidence?",
    words: [/strong|most|best|top|largest|biggest/, /growth|grow|progress|improv|gain/],
  },
  {
    id: "independent-struggle",
    example: "Who is struggling with independent writing?",
    words: [
      /struggl|difficult|weak|behind|need.*help|low/,
      /independen|on (their|his|her) own|alone|without support/,
    ],
  },
  {
    id: "approaching-target",
    example: "Who is approaching a target in reading?",
    words: [/approach|close to|near|almost|nearly/, /target|goal/],
  },
  {
    id: "teach-next",
    example: "What should I teach next?",
    words: [/teach|lesson|group|focus/, /next|now|first|should/],
  },
  {
    id: "forecast-change",
    example: "Why did a forecast change?",
    words: [/why|what/, /forecast|prediction|estimate/, /chang|differ|move|shift/],
  },
  {
    id: "receptive-productive",
    example: "Who has strong listening but weaker speaking?",
    words: [/strong|good|high/, /weak|low|less|lower/, /listening|reading/, /speaking|writing/],
  },
  {
    id: "missing-data",
    example: "Which students are missing data?",
    words: [/missing|no data|no results|gap|coverage|lack/],
  },
  {
    id: "exit-criterion",
    example: "Who meets the exit criterion?",
    words: [/exit|criterion|reclassif|4\.5/],
  },
]);

/** Pick the intent whose keyword groups all match; ties go to the first listed. */
export function matchIntent(question) {
  const q = String(question || "").toLowerCase();
  let best = null;
  for (const intent of INTENTS) {
    const hits = intent.words.filter((re) => re.test(q)).length;
    if (hits === intent.words.length && (!best || hits > best.hits)) best = { intent, hits };
  }
  return best ? { id: best.intent.id, domains: domainsIn(q) } : null;
}

function yearsRange(students, key) {
  const ys = students.flatMap((s) => seriesFor(s, key).map((p) => p.year)).sort();
  return ys.length ? `${ys[0]} to ${ys.at(-1)} (official results)` : "no official results on file";
}
function evidenceRange(ctx) {
  const ds = ctx.students
    .flatMap((s) => (s.entries || []).map((e) => e.t))
    .filter(Boolean)
    .sort();
  return ds.length
    ? `${ds[0].slice(0, 10)} to ${ds.at(-1).slice(0, 10)} (practice evidence)`
    : "no practice evidence on file";
}

const ANSWERS = {
  "growth-leaders": (ctx, [d = "Speaking"]) => {
    const rows = ctx.students
      .map((s) => {
        const ser = seriesFor(s, d);
        const a = ser.at(-2);
        const b = ser.at(-1);
        const official =
          a && b && nextYear(a.year) === b.year && eraOf(a.year) === eraOf(b.year)
            ? Math.round((b.level - a.level) * 10) / 10
            : null;
        const e = ctx.evidence(s)[d] || null;
        return { s, official, period: official == null ? "" : `${a.year} to ${b.year}`, e };
      })
      .filter((r) => r.official != null)
      .sort((x, y) => y.official - x.official)
      .slice(0, 5);
    return {
      title: `Strongest ${d.toLowerCase()} growth evidence`,
      interpretation: `Rank students by the change in their reported ${d} level between their two most recent consecutive school years in the same scale era.`,
      dataUsed: `Official ${d} levels; practice evidence counts shown for context.`,
      timeRange: yearsRange(ctx.students, d),
      computation:
        "Latest level minus previous level, consecutive same-era years only; top five shown.",
      uncertainty:
        "One year of change on a single test is noisy (often several tenths of a level). Practice evidence is not converted into levels.",
      action:
        "Look at these students' recent speaking work before drawing conclusions; consider them as peer models.",
      columns: ["Student", "Change", "Years", "Practice items"],
      rows: rows.map((r) => [
        r.s.name,
        `${r.official > 0 ? "+" : ""}${f1(r.official)}`,
        r.period,
        String(r.e?.n ?? 0),
      ]),
    };
  },
  "independent-struggle": (ctx, [d = "Writing"]) => {
    const rows = ctx.students
      .map((s) => ({ s, e: ctx.evidence(s)[d] }))
      .filter(
        ({ e }) =>
          e &&
          ((e.independent.n >= 2 && e.independent.mean < RULES.weak) ||
            (e.supported.n >= RULES.minEvidence && e.independent.n === 0)),
      )
      .sort((a, b) => (a.e.independent.mean ?? -1) - (b.e.independent.mean ?? -1));
    return {
      title: `Struggling with independent ${d.toLowerCase()}`,
      interpretation: `Find students whose ${d.toLowerCase()} practice done on their own falls below ${pct(RULES.weak)}, or who have only supported ${d.toLowerCase()} practice.`,
      dataUsed: "Practice skill-graph evidence, split by independent and supported work.",
      timeRange: evidenceRange(ctx),
      computation: `Unweighted mean of independent ${d.toLowerCase()} evidence (needs 2+ items), or 3+ supported items with no independent ones.`,
      uncertainty: "Small numbers of items; local practice analysis, not an official measure.",
      action:
        "Plan a supported-then-independent pair on the same topic and fade one support at a time.",
      columns: ["Student", "Independent", "Supported", "Items"],
      rows: rows.map(({ s, e }) => [
        s.name,
        e.independent.n ? pct(e.independent.mean) : "none",
        e.supported.n ? pct(e.supported.mean) : "none",
        String(e.n),
      ]),
    };
  },
  "approaching-target": (ctx, domains) => {
    const keys = (domains.length ? domains : SERIES_KEYS).filter((k) => ctx.targets[k] != null);
    const rows = [];
    for (const s of ctx.students)
      for (const k of keys) {
        const last = seriesFor(s, k).at(-1);
        const t = ctx.targets[k];
        if (!last || !(t - last.level > 0 && t - last.level <= 0.5)) continue;
        const f = ctx.forecast(s, k, t);
        rows.push([
          s.name,
          k,
          `${f1(last.level)} (${last.year})`,
          f1(t),
          f.numbers ? pct(f.numbers.probabilityAtLeastTarget) : "not validated",
        ]);
      }
    return {
      title: "Approaching a teacher target",
      interpretation:
        "Find students whose latest reported level is below a teacher-set target by 0.5 or less.",
      dataUsed: keys.length
        ? `Teacher targets for ${keys.join(", ")}; latest official levels.`
        : "No teacher targets are set yet.",
      timeRange: yearsRange(ctx.students, keys[0] || "Overall"),
      computation:
        "Target minus latest reported level, between 0 and 0.5. A probability appears only from a validated model.",
      uncertainty:
        "Distance to a target is arithmetic on one reported level; it is not a forecast.",
      action: keys.length
        ? "Review these students' recent work in the named domain."
        : "Set domain targets in the ACCESS Probability Center first.",
      columns: ["Student", "Series", "Latest", "Target", "Probability"],
      rows,
    };
  },
  "teach-next": (ctx) => {
    const groups = recommendInstructionalGroups(
      ctx.students.map((s) => ({
        alias: s.name,
        ledger: { entries: s.entries || [] },
        records: s.records || {},
      })),
    )
      .sort((a, b) => b.members.length - a.members.length)
      .slice(0, 5);
    return {
      title: "What to teach next",
      interpretation:
        "Find practice skills that several students are still developing, largest group first.",
      dataUsed: "Practice skill-graph evidence for every student.",
      timeRange: evidenceRange(ctx),
      computation:
        "A skill is listed when 2+ students are 'developing' or 'supported' on it (3+ items over 2+ activities each).",
      uncertainty: "Groups come from local practice evidence only and change as new work arrives.",
      action:
        "Build a short mini-lesson for the largest group; use the Classroom Intelligence tab to plan it.",
      columns: ["Skill", "Domain", "Students", "Members"],
      rows: groups.map((g) => [g.label, g.domain, String(g.members.length), g.members.join(", ")]),
    };
  },
  "forecast-change": (ctx) => {
    const rows = [];
    for (const s of ctx.students)
      for (const k of SERIES_KEYS) {
        const prev = ctx.snapshots?.[`${s.id}|${k}`];
        if (!prev) continue;
        const now = ctx.forecast(s, k, null);
        const why = [];
        if (now.series.length !== prev.reports)
          why.push(`official reports on file changed from ${prev.reports} to ${now.series.length}`);
        if (now.status !== prev.status)
          why.push(`status changed from ${prev.status} to ${now.status}`);
        if ((now.model?.id || null) !== (prev.model || null))
          why.push(`model changed from ${prev.model || "none"} to ${now.model?.id || "none"}`);
        if ((now.numbers?.expected ?? null) !== (prev.expected ?? null) && !why.length)
          why.push("the validation data or model version changed");
        if (why.length)
          rows.push([
            s.name,
            k,
            `${prev.status}${prev.expected != null ? ` ${f1(prev.expected)}` : ""} -> ${now.status}${now.numbers ? ` ${f1(now.numbers.expected)}` : ""}`,
            why.join("; "),
          ]);
      }
    const has = ctx.snapshots && Object.keys(ctx.snapshots).length;
    return {
      title: "Why forecasts changed",
      interpretation:
        "Compare each current forecast with the snapshot saved earlier on this device and name what changed.",
      dataUsed: has
        ? `Saved snapshot from ${Object.values(ctx.snapshots)[0].at}.`
        : "No snapshot is saved yet.",
      timeRange: "Snapshot date to today",
      computation:
        "Checks, in order: number of official reports, validation status, selected model, then the estimate itself.",
      uncertainty:
        "A forecast only changes when its inputs change; small moves in the estimate are within the 80% interval.",
      action: has
        ? "Review students whose status changed."
        : "Save a forecast snapshot from the Forecast Overview so later changes can be explained.",
      columns: ["Student", "Series", "Before -> now", "Reason"],
      rows,
    };
  },
  "receptive-productive": (ctx, domains) => {
    const input = domains.includes("Reading") ? "Reading" : "Listening";
    const output = domains.includes("Writing") || input === "Reading" ? "Writing" : "Speaking";
    const rows = ctx.students
      .map((s) => ({ s, a: ctx.evidence(s)[input], b: ctx.evidence(s)[output] }))
      .filter(
        ({ a, b }) =>
          a.n >= RULES.minEvidence &&
          b.n >= RULES.minEvidence &&
          a.mean >= RULES.strong &&
          b.mean <= RULES.weak,
      )
      .sort((x, y) => y.a.mean - y.b.mean - (x.a.mean - x.b.mean));
    return {
      title: `Strong ${input.toLowerCase()}, weaker ${output.toLowerCase()}`,
      interpretation: `Find students whose ${input.toLowerCase()} practice is at least ${pct(RULES.strong)} and ${output.toLowerCase()} practice at most ${pct(RULES.weak)}.`,
      dataUsed: "Practice skill-graph evidence by domain (3+ items each).",
      timeRange: evidenceRange(ctx),
      computation: "Unweighted mean of normalized practice performance per domain.",
      uncertainty:
        "Receptive checks are right/wrong items; productive features come from local text analysis. They are different measures, so the gap is a hypothesis.",
      action: `Use content these students understood for structured ${output.toLowerCase()} rehearsal (see Language Bottleneck Detector).`,
      columns: ["Student", input, output, "Gap"],
      rows: rows.map(({ s, a, b }) => [s.name, pct(a.mean), pct(b.mean), pct(a.mean - b.mean)]),
    };
  },
  "missing-data": (ctx) => {
    const rows = ctx.students
      .map((s) => {
        const noOfficial = SERIES_KEYS.filter((k) => !seriesFor(s, k).length);
        const noPractice = ["Listening", "Reading", "Speaking", "Writing"].filter(
          (d) => !(ctx.evidence(s)[d]?.n > 0),
        );
        return [s.name, noOfficial.join(", ") || "none", noPractice.join(", ") || "none"];
      })
      .filter((r) => r[1] !== "none" || r[2] !== "none");
    return {
      title: "Missing data",
      interpretation: "List students with no official result or no practice evidence in a domain.",
      dataUsed: "Official results and practice skill-graph evidence.",
      timeRange: "All records on this device",
      computation: "A domain counts as missing when it has zero records.",
      uncertainty: "None: this is a count of records.",
      action:
        "Import historical results on the Data tab; assign practice in the domains with no evidence.",
      columns: ["Student", "No official result", "No practice evidence"],
      rows,
    };
  },
  "exit-criterion": (ctx) => {
    const policy = policyFor({ jurisdiction: "Maryland" });
    const rows = ctx.students
      .map((s) => ({ s, last: seriesFor(s, "Overall").at(-1) }))
      .filter((r) => r.last)
      .map(({ s, last }) => [
        s.name,
        `${f1(last.level)} (${last.year})`,
        meetsCriterion(policy, last.level)
          ? "Meets the recorded level"
          : "Below the recorded level",
      ]);
    return {
      title: "Recorded exit criterion",
      interpretation: `Compare each student's latest REPORTED overall level with the recorded ${policy.jurisdiction} criterion (overall ${policy.threshold}).`,
      dataUsed: `Reported overall levels; policy ${policy.id}, verified ${policy.verifiedOn}.`,
      timeRange: yearsRange(ctx.students, "Overall"),
      computation:
        "Reported overall level >= threshold. Domain levels are never averaged into an overall.",
      uncertainty:
        "The criterion entry has open questions (see the Probability Center); district practice may add steps.",
      action: "Confirm with your district before any exit decision.",
      columns: ["Student", "Latest overall", "Comparison"],
      rows,
    };
  },
};

/**
 * Answer a question. `ctx` = { students, evidence(student), forecast(student, key, threshold), targets,
 * snapshots }. Returns { supported: true, intent, ...answer } or { supported: false, examples }.
 */
export function answer(question, ctx) {
  const m = matchIntent(question);
  if (!m) return { supported: false, examples: INTENTS.map((i) => i.example) };
  return { supported: true, intent: m.id, ...ANSWERS[m.id](ctx, m.domains) };
}
