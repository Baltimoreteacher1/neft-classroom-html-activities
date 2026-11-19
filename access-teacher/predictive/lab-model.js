// The six Deeper tools as plain objects. Each model takes the studio's own data and returns what a view prints:
// numbers, and four short sentences a teacher can read in ten seconds:
//   headline  what we found      plain  what it means      act  what to try      sure  how sure to be, and why
// Scores are the official proficiency levels the studio already holds, compared only inside one assessment and one
// level scale (cohort / adjacent-year pairs from analysis.js). Nothing here claims why a score moved.
import { adjacentYearPairs, nextSchoolYear } from "./analysis.js";
import {
  bestGrouping,
  median,
  permutationTest,
  projectionLine,
  robustZ,
  round,
  spearman,
  spearmanInterval,
} from "./lab-stats.js";
import { recordsOf } from "./records.js";
import { ASSESSMENTS, DOMAINS } from "./rules.js";

export const nameOf = (st) => st.name || st.alias || st.id;
const level = (rec, d) => rec.domains[d].level;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const lvl = (n) => round(n, 1).toFixed(1);
const list = (a) =>
  a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")}, and ${a.at(-1)}`;

/** One row per student in a same-scale cohort who has all four domain levels: { id, name, v: [L, S, R, W] }. */
export function cohortRows(cohort) {
  return cohort.records
    .map(({ student, record }) => ({
      id: student.id,
      name: nameOf(student),
      v: DOMAINS.map((d) => level(record, d)),
    }))
    .filter((r) => r.v.every(Number.isFinite));
}

const tooFew = (need, have, what) => ({
  ok: false,
  need,
  have,
  why: `This tool needs at least ${need} students with ${what}. You have ${have}.`,
});

// 1. Groups that look alike --------------------------------------------------------------------------------------
function profileLabel(means) {
  const hi = Math.max(...means);
  const lo = Math.min(...means);
  const avg = means.reduce((a, b) => a + b, 0) / means.length;
  if (hi - lo < 0.7)
    return {
      label: `Similar in all four skills, around ${lvl(avg)}`,
      low: DOMAINS[means.indexOf(lo)],
      even: true,
    };
  return {
    label: `Strongest in ${DOMAINS[means.indexOf(hi)]}, lowest in ${DOMAINS[means.indexOf(lo)]}`,
    low: DOMAINS[means.indexOf(lo)],
    even: false,
  };
}

export function groupsModel(rows, total = rows.length) {
  if (rows.length < 6) return tooFew(6, rows.length, "all four skills reported");
  const fit = bestGrouping(rows.map((r) => r.v));
  const clarity = !fit || fit.silhouette < 0.25 ? "none" : fit.silhouette < 0.5 ? "some" : "clear";
  const sure = {
    clear: "Fairly sure: the groups are clearly apart from each other.",
    some: "Somewhat sure: the groups overlap a little, so a few students could belong to either.",
    none: "The class does not split cleanly, so there is nothing to group.",
  }[clarity];
  if (clarity === "none")
    return {
      ok: true,
      clarity,
      n: rows.length,
      groups: [],
      headline: "Your students do not fall into clear groups.",
      plain:
        "Their four skills are spread out evenly. No set of students looks alike enough to teach as a group.",
      act: "Plan by skill instead: pick the skill with the lowest class middle and teach it to everyone.",
      sure,
    };
  const groups = [...Array(fit.k).keys()]
    .map((c) => {
      const members = rows.filter((_, i) => fit.assign[i] === c);
      const means = DOMAINS.map((_, j) => members.reduce((s, m) => s + m.v[j], 0) / members.length);
      const p = profileLabel(means);
      return {
        size: members.length,
        means: means.map((m) => round(m, 1)),
        label: p.label,
        focus: p.low,
        even: p.even,
        students: members.map((m) => m.name).sort(),
      };
    })
    .sort((a, b) => a.means.reduce((s, v) => s + v, 0) - b.means.reduce((s, v) => s + v, 0));
  return {
    ok: true,
    clarity,
    n: rows.length,
    groups,
    headline: `Your ${rows.length} students fall into ${fit.k} groups.`,
    plain: `Students in a group have a similar mix of Listening, Speaking, Reading and Writing. The groups are a handy way to plan, not labels for a child.${total > rows.length ? ` ${plural(total - rows.length, "student")} left out because a skill score is missing.` : ""}`,
    act: "Use each group's focus skill for a short small-group lesson this week. Students can move groups as they grow.",
    sure,
  };
}

// 2. Skills that move together -----------------------------------------------------------------------------------
const strengthWord = (r) =>
  Math.abs(r) >= 0.7 ? "a strong" : Math.abs(r) >= 0.4 ? "a moderate" : "a weak";

export function togetherModel(rows) {
  if (rows.length < 8) return tooFew(8, rows.length, "all four skills reported");
  const pairs = [];
  for (let a = 0; a < DOMAINS.length; a++)
    for (let b = a + 1; b < DOMAINS.length; b++) {
      const x = rows.map((r) => r.v[a]);
      const y = rows.map((r) => r.v[b]);
      const rho = spearman(x, y);
      const ci = rho == null ? null : spearmanInterval(x, y, { seed: 7 + a * 4 + b });
      const clear = rho != null && ci && (ci.lo > 0 || ci.hi < 0);
      pairs.push({
        a: DOMAINS[a],
        b: DOMAINS[b],
        rho: round(rho, 2),
        lo: round(ci?.lo, 2),
        hi: round(ci?.hi, 2),
        clear,
        words:
          rho == null
            ? "Cannot be told (scores are all the same)."
            : clear
              ? `${strengthWord(rho)} connection: students higher in ${DOMAINS[a]} tend to be ${rho > 0 ? "higher" : "lower"} in ${DOMAINS[b]}.`
              : "No clear connection in this class (too few students to tell).",
      });
    }
  const clearPairs = pairs.filter((p) => p.clear && p.rho > 0).sort((p, q) => q.rho - p.rho);
  const top = clearPairs[0];
  return {
    ok: true,
    n: rows.length,
    pairs,
    headline: top
      ? `${top.a} and ${top.b} move together most.`
      : "No two skills clearly move together in this class.",
    plain: top
      ? `Students who are higher in ${top.a} are usually higher in ${top.b} too. This does not mean one causes the other.`
      : "Each skill looks fairly separate. A student strong in one skill is not reliably strong in another.",
    act: top
      ? `When you plan ${top.a} lessons, add a ${top.b} task. Skills that travel together often grow together.`
      : "Check each skill on its own; do not assume one skill tells you about another.",
    sure: `${rows.length < 15 ? "Be careful: a small class can show patterns by accident." : "Reasonably sure, with this many students."} The range next to each pair shows how much it could move.`,
  };
}

// 3. Unusual profiles --------------------------------------------------------------------------------------------
export function unusualModel(rows) {
  if (rows.length < 6) return tooFew(6, rows.length, "all four skills reported");
  const devs = rows.flatMap((r) => {
    const mid = median(r.v);
    return DOMAINS.map((d, j) => ({ name: r.name, domain: d, gap: r.v[j] - mid }));
  });
  const { z } = robustZ(devs.map((d) => d.gap));
  const flags = devs
    .map((d, i) => ({ ...d, z: z[i] }))
    .filter((d) => Math.abs(d.z) >= 2 && Math.abs(d.gap) >= 1)
    .sort((a, b) => Math.abs(b.z) - Math.abs(a.z))
    .map((d) => ({
      name: d.name,
      domain: d.domain,
      gap: round(d.gap, 1),
      words: `${d.domain} is ${lvl(Math.abs(d.gap))} ${d.gap < 0 ? "below" : "above"} the middle of their own four skills.`,
    }));
  return {
    ok: true,
    n: rows.length,
    flags,
    headline: flags.length
      ? `${plural(new Set(flags.map((f) => f.name)).size, "student")} ${new Set(flags.map((f) => f.name)).size === 1 ? "has" : "have"} one skill far from the rest.`
      : "No student has a skill far out of line with their others.",
    plain: flags.length
      ? "A skill that sits far from a student's own other skills is worth a second look. It can be real, or one off test day."
      : "Every student's four skills sit close together, compared with how spread out this class usually is.",
    act: flags.length
      ? "Have a short check-in on the flagged skill. If it holds up in class work, plan support there; if not, wait for the next test."
      : "Nothing to do here. Check again after the next results.",
    sure: "Treat each flag as a question, not an answer: one score can be off by the measurement error the report prints.",
  };
}

// 4. Faster or slower growth -------------------------------------------------------------------------------------
const GROWTH_BANDS = [
  [1.5, "Much faster than usual"],
  [0.5, "A bit faster than usual"],
  [-0.5, "About usual"],
  [-1.5, "A bit slower than usual"],
  [-Infinity, "Much slower than usual"],
];

export function speedModel(pair, domain) {
  const changes = pair.rows
    .map(({ student, from, to }) => ({
      name: nameOf(student),
      change: level(to, domain) - level(from, domain),
    }))
    .filter((r) => Number.isFinite(r.change));
  if (changes.length < 6) return tooFew(6, changes.length, "scores in both years");
  const { center, scale, z } = robustZ(changes.map((c) => c.change));
  const rows = changes
    .map((c, i) => ({
      ...c,
      change: round(c.change, 1),
      band: GROWTH_BANDS.find(([cut]) => z[i] >= cut)[1],
      z: round(z[i], 1),
    }))
    .sort((a, b) => b.change - a.change || a.name.localeCompare(b.name));
  const slower = rows.filter((r) => r.band.includes("slower"));
  const faster = rows.filter((r) => r.band.includes("faster"));
  return {
    ok: true,
    n: rows.length,
    typical: round(center, 1),
    spread: round(scale, 1),
    rows,
    slower,
    faster,
    headline: `The usual ${domain} change was ${center >= 0 ? "+" : ""}${lvl(center)} levels from ${pair.from} to ${pair.to}.`,
    plain: scale
      ? `${plural(faster.length, "student")} grew faster than usual and ${plural(slower.length, "student")} grew slower. "Usual" means the middle of this class, not a state or national target.`
      : "Everyone changed by about the same amount, so no one stands out.",
    act: slower.length
      ? `Look first at ${list(slower.slice(0, 4).map((r) => r.name))}${slower.length > 4 ? ` and ${slower.length - 4} more` : ""}: what changed for them this year?`
      : "No one is falling behind the class pace. Keep going.",
    sure: "A student can look slow for many reasons, including one off test day. Pair this with what you see in class.",
  };
}

// 5. Next-year projection ----------------------------------------------------------------------------------------
export function projectionModel(students, domain) {
  const pairs = adjacentYearPairs(students);
  const xs = [];
  const ys = [];
  for (const p of pairs)
    for (const { from, to } of p.rows) {
      const a = level(from, domain);
      const b = level(to, domain);
      if (Number.isFinite(a) && Number.isFinite(b)) (xs.push(a), ys.push(b));
    }
  const line = projectionLine(xs, ys);
  if (!line) return tooFew(6, xs.length, "scores in two school years in a row");
  const clamp = (v) => Math.min(6, Math.max(1, v));
  const rows = [];
  for (const st of students) {
    const annual = recordsOf(st).filter((r) => ASSESSMENTS[r.assessmentType]?.kind === "annual");
    const last = annual.at(-1);
    if (!last || !Number.isFinite(level(last, domain))) continue;
    if (
      annual.some(
        (r) =>
          r.assessmentType === last.assessmentType &&
          r.academicYear === nextSchoolYear(last.academicYear),
      )
    )
      continue;
    const now = level(last, domain);
    const guess = line.predict(now);
    rows.push({
      name: nameOf(st),
      year: nextSchoolYear(last.academicYear),
      now: round(now, 1),
      predicted: round(clamp(guess), 1),
      lo: round(clamp(guess - line.half), 1),
      hi: round(clamp(guess + line.half), 1),
    });
  }
  rows.sort((a, b) => a.predicted - b.predicted || a.name.localeCompare(b.name));
  const better = line.typicalMiss < line.naiveMiss * 0.9;
  return {
    ok: true,
    n: line.n,
    half: round(line.half, 1),
    typicalMiss: round(line.typicalMiss, 2),
    naiveMiss: round(line.naiveMiss, 2),
    better,
    rows,
    headline: rows.length
      ? `${plural(rows.length, "student")} ${rows.length === 1 ? "has" : "have"} a ${domain} projection for next year.`
      : "Everyone with a result already has the next year's result too.",
    plain: `This looks at how ${line.n} past year-to-year steps in your class turned out, then projects forward. About 8 in 10 students should land inside the range shown. Typical miss: ${lvl(line.typicalMiss)} levels.`,
    act: "Use the low end of the range to spot students who may need support early, and the range as a conversation starter, never as a promise.",
    sure: better
      ? "Reasonably sure of the range: it beat simply assuming no change when we tested it on your own students."
      : "Be cautious: it did not beat simply assuming no change, so treat it as a rough guide.",
  };
}

// 6. Did this group grow more? -----------------------------------------------------------------------------------
export function compareModel(pair, domain, picked) {
  const all = pair.rows
    .map(({ student, from, to }) => ({
      name: nameOf(student),
      change: level(to, domain) - level(from, domain),
    }))
    .filter((r) => Number.isFinite(r.change));
  const chosen = new Set(picked);
  const group = all.filter((r) => chosen.has(r.name)).map((r) => r.change);
  const rest = all.filter((r) => !chosen.has(r.name)).map((r) => r.change);
  if (group.length < 2 || rest.length < 2)
    return {
      ok: false,
      need: 2,
      have: Math.min(group.length, rest.length),
      why: "Pick a group of at least 2 students, with at least 2 students left out.",
    };
  const t = permutationTest(group, rest);
  const per100 = t.p < 0.01 ? "fewer than 1" : `about ${Math.round(t.p * 100)}`;
  const more = t.diff > 0;
  const clear = t.p < 0.05;
  return {
    ok: true,
    n: all.length,
    groupSize: group.length,
    restSize: rest.length,
    diff: round(t.diff, 2),
    p: t.p,
    exact: t.exact,
    delta: round(t.delta, 2),
    clear,
    headline: `The group grew ${lvl(Math.abs(t.diff))} levels ${more ? "more" : "less"} than the others, on average.`,
    plain: clear
      ? `A gap this big showed up in ${per100} of 100 random shuffles of the class, so it is probably not luck.`
      : `A gap this big showed up in ${per100} of 100 random shuffles of the class, so it could easily be luck.`,
    act:
      clear && more
        ? "Keep doing what this group did, and watch whether the gap holds next year."
        : clear
          ? "This group may need a different approach. Look at what the others had that they did not."
          : "Do not read much into this gap. Collect another year of results before deciding.",
    sure: "This shows a pattern, not a cause: the group was not picked by chance, so other things could explain it.",
  };
}
