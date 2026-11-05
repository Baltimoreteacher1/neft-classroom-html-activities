// Synthetic cohorts for the demonstration mode and the statistical tests. Every record is marked
// `synthetic: true` and keyed "SYN-…", and the generating process is written down, so a validation run on
// this data proves the machinery works, never that the models predict real students.
import { clamp, rng } from "./stats.js";

export const SYNTHETIC_PROCESS = Object.freeze({
  description:
    "next = last + growth + pull * (last - 3.5) + formativeEffect * (formative - 0.5) + noise, clamped to 1.0-6.0 and reported to one decimal",
  defaults: {
    growth: 0.45,
    pull: -0.12,
    formativeEffect: 0,
    noise: 0.45,
    start: 2.8,
    startSd: 0.9,
  },
});

export function syntheticCohort({
  seed = 7,
  students = 1500,
  years = ["2021-22", "2022-23", "2023-24", "2024-25"],
  domain = "Writing",
  ...params
} = {}) {
  const p = { ...SYNTHETIC_PROCESS.defaults, ...params };
  const r = rng(seed);
  const round = (x) => Math.round(clamp(x, 1, 6) * 10) / 10;
  return Array.from({ length: students }, (_, i) => {
    const id = `SYN-${String(i + 1).padStart(4, "0")}`;
    const series = [];
    const formativeByYear = {};
    let level = round(p.start + p.startSd * r.normal());
    series.push({ year: years[0], level });
    for (const year of years.slice(1)) {
      const formative = r.uniform();
      formativeByYear[year] = Math.round(formative * 100) / 100;
      level = round(
        level +
          p.growth +
          p.pull * (level - 3.5) +
          p.formativeEffect * (formative - 0.5) +
          p.noise * r.normal(),
      );
      series.push({ year, level });
    }
    return { student: id, domain, synthetic: true, series, formativeByYear };
  });
}
