// Language Bottleneck Detector. Deterministic rules over the practice skill graph (and, for one rule, the
// latest official level). Each finding is a HYPOTHESIS for the teacher to confirm or reject, laid out as
// Observed evidence -> Hypothesis -> Recommended instruction -> New assessment opportunity. Practice
// evidence is never converted into a level or score.
import { buildSkillGraph } from "../../access-practice-lab/src/lang/skill-graph.js";
import { seriesFor } from "./forecast.js";

export const RULES = Object.freeze({
  minEvidence: 3,
  strong: 0.7,
  weak: 0.5,
  minGap: 0.25,
  officialHigh: 4.0,
  officialLow: 2.5,
  practiceHigh: 0.8,
});
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const pctText = (x) => `${Math.round(x * 100)}%`;

/** Per-domain practice summary: plain unweighted means so the arithmetic is easy to check. */
export function domainEvidence(student, { now = Date.now() } = {}) {
  const graph = buildSkillGraph(student.entries || [], student.records || {}, { now });
  return Object.fromEntries(
    DOMAINS.map((d) => {
      const skills = graph.filter((s) => s.domain === d);
      const ev = skills.flatMap((s) => s.evidence);
      const ind = ev.filter((e) => e.independenceLevel === "independent");
      const sup = ev.filter((e) => e.independenceLevel !== "independent");
      const perf = (rows) => mean(rows.map((e) => e.normalizedPerformance));
      return [
        d,
        {
          n: ev.length,
          activities: new Set(ev.map((e) => e.activityId)).size,
          mean: perf(ev),
          independent: { n: ind.length, mean: perf(ind) },
          supported: { n: sup.length, mean: perf(sup) },
          skills,
          last:
            ev
              .map((e) => e.createdAt)
              .sort()
              .at(-1) || null,
        },
      ];
    }),
  );
}

function kluFor(student, domain, fallback) {
  const counts = new Map();
  for (const e of student.entries || [])
    if (e.domain === domain && e.use) counts.set(e.use, (counts.get(e.use) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

const finding = (student, rule, domain, parts) => ({
  id: `${student.id}|${rule}|${domain}`,
  studentId: student.id,
  student: student.name,
  rule,
  domain,
  ...parts,
});

/** All findings for one student. */
export function detectBottlenecks(
  student,
  { now = Date.now(), evidence = domainEvidence(student, { now }) } = {},
) {
  const out = [];
  const R = RULES;
  for (const [input, output] of [
    ["Listening", "Speaking"],
    ["Reading", "Writing"],
  ]) {
    const a = evidence[input];
    const b = evidence[output];
    if (
      a.n >= R.minEvidence &&
      b.n >= R.minEvidence &&
      a.mean >= R.strong &&
      b.mean <= R.weak &&
      a.mean - b.mean >= R.minGap
    )
      out.push(
        finding(student, "receptive-productive", output, {
          title: `Strong ${input.toLowerCase()} evidence, weaker ${output.toLowerCase()} evidence`,
          observed: `${input}: ${pctText(a.mean)} of ${a.n} practice checks met; ${output}: ${pctText(b.mean)} across ${b.n} analysed features.`,
          hypothesis: `The student may understand more than they can yet produce. ${output} output may be lagging ${input.toLowerCase()} comprehension.`,
          recommendation: `Use content the student already understands for ${output.toLowerCase()} practice: rehearse orally or in a quick plan first, model the language move, then fade the frame.`,
          assessment: `A short independent ${output.toLowerCase()} task on a topic the student has just ${input === "Listening" ? "heard" : "read"} successfully; record whether supports were used.`,
          klu: kluFor(student, output, "Explain"),
        }),
      );
  }
  for (const d of DOMAINS) {
    const e = evidence[d];
    if (
      e.independent.n >= 2 &&
      e.supported.n >= 2 &&
      e.supported.mean - e.independent.mean >= R.minGap
    )
      out.push(
        finding(student, "support-dependence", d, {
          title: `${d}: success depends on supports`,
          observed: `With supports ${pctText(e.supported.mean)} (${e.supported.n} items); on their own ${pctText(e.independent.mean)} (${e.independent.n} items).`,
          hypothesis:
            "The supports may be carrying part of the language demand the student cannot yet meet independently.",
          recommendation:
            "Keep the task, remove one support at a time (frame first, then word bank), and give feedback on the move the support was doing.",
          assessment: `One independent ${d.toLowerCase()} attempt after a supported one on the same topic; compare the two.`,
          klu: kluFor(student, d, "Explain"),
        }),
      );
    if (e.supported.n >= R.minEvidence && e.independent.n === 0)
      out.push(
        finding(student, "no-independent", d, {
          title: `${d}: no independent evidence yet`,
          observed: `${e.supported.n} supported practice items and none completed on their own.`,
          hypothesis: "We do not yet know what the student can do in this domain without supports.",
          recommendation:
            "Plan one low-stakes independent attempt with a familiar topic before adding new content.",
          assessment: `A brief independent ${d.toLowerCase()} check (no frames or word bank), recorded as independent.`,
          klu: kluFor(student, d, "Inform"),
        }),
      );
    const official = seriesFor(student, d).at(-1);
    if (official && e.n >= R.minEvidence) {
      const high = official.level >= R.officialHigh && e.mean < R.weak;
      const low = official.level <= R.officialLow && e.mean >= R.practiceHigh;
      if (high || low)
        out.push(
          finding(student, "official-practice-mismatch", d, {
            title: `${d}: official result and recent practice disagree`,
            observed: `Latest official ${d} level ${official.level.toFixed(1)} (${official.year}); recent practice ${pctText(e.mean)} across ${e.n} items.`,
            hypothesis: high
              ? "Practice tasks may be harder or less familiar than the test, or a recent difficulty is emerging."
              : "The student may have grown since the official result, or practice tasks may be easier than the test.",
            recommendation: high
              ? "Check task difficulty and directions; confer with the student about what made the tasks hard."
              : "Offer more demanding tasks in this domain to see whether the gain holds.",
            assessment: `A task matched to the official level's expectations in ${d.toLowerCase()}, scored with the same rubric as before.`,
            klu: kluFor(student, d, "Explain"),
          }),
        );
    }
    const strongSkills = e.skills.filter(
      (s) => s.status === "demonstrated" || s.status === "supported",
    );
    // Only the weakest lagging skill per domain, so one student's card list stays readable.
    const lagging = e.skills
      .filter(
        (s) =>
          s.status === "developing" && s.evidenceCount >= R.minEvidence && strongSkills.length >= 2,
      )
      .sort((a, b) => (a.masteryEstimate ?? 0) - (b.masteryEstimate ?? 0))
      .slice(0, 1);
    for (const s of lagging)
      out.push(
        finding(student, "skill-gap", d, {
          id: `${student.id}|skill-gap|${s.id}`,
          title: `${d}: "${s.name}" lags other ${d.toLowerCase()} skills`,
          observed: `"${s.name}" is developing across ${s.evidenceCount} evidence points while ${strongSkills.length} other ${d.toLowerCase()} skills show success.`,
          hypothesis: `This specific language move, not ${d.toLowerCase()} in general, may be the bottleneck.`,
          recommendation: `A short targeted mini-lesson on "${s.name.toLowerCase()}" with a model, guided practice and one independent try.`,
          assessment: `Two new items that require "${s.name.toLowerCase()}", one supported and one independent.`,
          klu: kluFor(student, d, "Explain"),
        }),
      );
  }
  return out;
}

/** A learning plan pre-filled from a finding; every field stays editable by the teacher. */
export function planFromFinding(f, { today = new Date() } = {}) {
  const day = (n) => new Date(new Date(today).getTime() + n * 864e5).toISOString().slice(0, 10);
  return {
    objective: `${f.student} will ${f.rule === "receptive-productive" ? `produce ${f.domain.toLowerCase()} about familiar content` : `show this ${f.domain.toLowerCase()} move independently`} (${f.klu}).`,
    domain: f.domain,
    klu: f.klu,
    practice: f.recommendation,
    initialSupport: "Sentence frame and word bank available; teacher model first.",
    fading:
      "Remove the frame after two successful supported attempts; keep the word bank one more time, then remove it.",
    checkpoint: day(14),
    reassessment: f.assessment,
  };
}
