// SYNTHETIC demonstration data. A 1,200-student synthetic cohort per series (pre-reset school years
// 2020-21..2024-25) trains and validates the engine; a separate 12-student synthetic class (reports through
// 2023-24) is what the teacher explores, so its forecasts are for 2024-25, inside the same scale era.
// Nothing here is a real student, nothing is ever written to the real roster or official-results store.
import { rng } from "../../access-practice-lab/src/predict/stats.js";
import { syntheticCohort } from "../../access-practice-lab/src/predict/synthetic.js";
import { SERIES_KEYS } from "./forecast.js";

export const DEMO_LABEL = "SYNTHETIC DEMO";
const TRAIN_YEARS = ["2020-21", "2021-22", "2022-23", "2023-24", "2024-25"];
const CLASS_YEARS = TRAIN_YEARS.slice(0, 4);
const SEEDS = { Listening: 11, Speaking: 13, Reading: 17, Writing: 19, Overall: 23 };
const GROWTH = { Listening: 0.5, Speaking: 0.35, Reading: 0.45, Writing: 0.35, Overall: 0.42 };

/** Students shaped like the workspace's real students: { id, name, official: [{year, levels, overall}] }. */
function studentsFrom(cohorts, prefix, count, namer) {
  return Array.from({ length: count }, (_, i) => {
    const byYear = new Map();
    for (const k of SERIES_KEYS)
      for (const p of cohorts[k][i].series) {
        const r = byYear.get(p.year) || {
          year: p.year,
          levels: {},
          overall: null,
          synthetic: true,
        };
        if (k === "Overall") r.overall = p.level;
        else r.levels[k] = p.level;
        byYear.set(p.year, r);
      }
    return {
      id: `${prefix}${String(i + 1).padStart(4, "0")}`,
      name: namer(i),
      synthetic: true,
      official: [...byYear.values()],
    };
  });
}

/** The synthetic training cohort (validation only; never displayed as students). */
export function demoTrainingCohort({ students = 1200 } = {}) {
  const cohorts = Object.fromEntries(
    SERIES_KEYS.map((k) => [
      k,
      syntheticCohort({
        seed: SEEDS[k],
        students,
        years: TRAIN_YEARS,
        domain: k,
        growth: GROWTH[k],
      }),
    ]),
  );
  return studentsFrom(cohorts, "SYN-T", students, (i) => `Synthetic training ${i + 1}`);
}

const LETTERS = "ABCDEFGHIJKL";
const LISTEN_SKILLS = [
  "main idea",
  "detail",
  "sequence",
  "cause and effect",
  "directions",
  "vocabulary",
];
const READ_SKILLS = [
  "main idea",
  "evidence",
  "sequence",
  "cause and effect",
  "compare",
  "vocabulary",
];
const USES = ["Narrate", "Inform", "Explain", "Argue"];

/** Synthetic practice-ledger entries in the shape evidenceFromLedger reads, with built-in contrasts. */
function demoEntries(i, r) {
  const profile = {
    receptive: 0.3 + 0.7 * r.uniform(),
    productive: 0.25 + 0.75 * r.uniform(),
    supportGap: i % 3 === 0 ? 0.35 : 0.05,
  };
  const entries = [];
  const day = (n) => new Date(Date.UTC(2024, 0, 8 + n * 9, 14)).toISOString();
  let n = 0;
  for (const domain of ["Listening", "Reading"]) {
    const skills = domain === "Listening" ? LISTEN_SKILLS : READ_SKILLS;
    for (let a = 0; a < 4; a++) {
      const stage = a === 1 ? "supported" : "independent";
      const p = profile.receptive + (stage === "supported" ? profile.supportGap : 0);
      entries.push({
        id: `demo-${i}-${domain}-${a}`,
        t: day(n++),
        task: `demo-${domain.toLowerCase()}-${a}`,
        domain,
        kind: "first",
        stage,
        supports: stage === "independent" ? {} : { frames: true },
        use: USES[(i + a) % 4],
        m: { questions: skills.map((skill) => ({ skill, ok: r.uniform() < p })) },
      });
    }
  }
  for (const domain of ["Speaking", "Writing"]) {
    for (let a = 0; a < 5; a++) {
      const stage = a === 1 ? "supported" : "independent";
      const q = Math.min(1, profile.productive + (stage === "supported" ? profile.supportGap : 0));
      const k = (x) => Math.round(x * q * (0.8 + 0.4 * r.uniform()));
      entries.push({
        id: `demo-${i}-${domain}-${a}`,
        t: day(n++),
        task: `demo-${domain.toLowerCase()}-${a}`,
        domain,
        kind: "first",
        stage,
        supports: stage === "independent" ? {} : { frames: true, bank: true },
        use: USES[(i + a) % 4],
        m: {
          words: 40 + k(60),
          link: k(3),
          cites: k(2),
          complex: k(2),
          academic: k(3),
          errs: {},
          moves: { claim: q > 0.4 ? 1 : 0, reason: q > 0.6 ? 1 : 0 },
        },
      });
    }
  }
  return entries;
}

/** The synthetic class the teacher explores. */
export function demoClass({ count = 12 } = {}) {
  const cohorts = Object.fromEntries(
    SERIES_KEYS.map((k) => [
      k,
      syntheticCohort({
        seed: SEEDS[k] + 100,
        students: count,
        years: CLASS_YEARS,
        domain: k,
        growth: GROWTH[k],
      }),
    ]),
  );
  const r = rng(4242);
  return studentsFrom(cohorts, "DEMO-", count, (i) => `${DEMO_LABEL} Student ${LETTERS[i]}`).map(
    (st, i) => ({
      ...st,
      section: DEMO_LABEL,
      entries: demoEntries(i, r),
      records: {},
    }),
  );
}
