// Data-quality checks over official results. Each finding names the student, what was found and why it
// matters. Nothing is corrected automatically: the teacher fixes the source.
import { SCALE_RESET_YEAR } from "../../access-practice-lab/src/lang/dna.js";
import { OFFICIAL_DOMAINS } from "../../access-practice-lab/src/lang/official-scores.js";
import { eraOf, nextYear, prevYear, schoolYearOf, SERIES_KEYS, seriesFor } from "./forecast.js";

export const QUALITY_CONFIG = Object.freeze({ maxJump: 1.5, staleYears: 2 });

const plausible = (x) =>
  typeof x === "number" && x >= 1 && x <= 6 && Math.abs(x * 10 - Math.round(x * 10)) < 1e-9;

export function qualityReport(students, { today = new Date() } = {}) {
  const findings = [];
  const add = (kind, student, detail) =>
    findings.push({ kind, student: student.name, studentId: student.id, detail });
  const current = schoolYearOf(today);
  let staleCutoff = current;
  for (let i = 0; i < QUALITY_CONFIG.staleYears; i++) staleCutoff = prevYear(staleCutoff);
  const names = new Map();
  for (const st of students) {
    const n = st.name.trim().toLowerCase();
    names.set(n, (names.get(n) || 0) + 1);
    const list = st.official || [];
    if (!list.length) {
      add("missing", st, "No official ACCESS results on file.");
      continue;
    }
    const years = new Map();
    for (const r of list) {
      years.set(r.year, (years.get(r.year) || 0) + 1);
      const missing = OFFICIAL_DOMAINS.filter((d) => r.levels?.[d] == null);
      if (missing.length) add("missing", st, `${r.year}: no ${missing.join(", ")} level.`);
      if (r.overall == null) add("missing", st, `${r.year}: no reported overall level.`);
      for (const k of SERIES_KEYS) {
        const v = k === "Overall" ? r.overall : r.levels?.[k];
        if (v != null && !plausible(v))
          add(
            "implausible",
            st,
            `${r.year} ${k}: ${v} is not a level from 1.0 to 6.0 with one decimal.`,
          );
        const sc = r.scale?.[k];
        if (sc != null && !(Number.isInteger(sc) && sc >= 100 && sc <= 600))
          add("implausible", st, `${r.year} ${k}: scale score ${sc} is outside 100-600.`);
      }
    }
    for (const [y, c] of years) if (c > 1) add("duplicate", st, `${c} results recorded for ${y}.`);
    for (const k of SERIES_KEYS) {
      const s = seriesFor(st, k);
      for (let i = 1; i < s.length; i++) {
        const a = s[i - 1];
        const b = s[i];
        if (nextYear(a.year) !== b.year || eraOf(a.year) !== eraOf(b.year)) continue;
        const jump = Math.round((b.level - a.level) * 10) / 10;
        if (Math.abs(jump) > QUALITY_CONFIG.maxJump)
          add(
            "jump",
            st,
            `${k} changed ${jump > 0 ? "+" : ""}${jump.toFixed(1)} from ${a.year} to ${b.year} (more than ${QUALITY_CONFIG.maxJump} in one year). Check the score report.`,
          );
      }
    }
    const latest = list
      .map((r) => r.year)
      .sort()
      .at(-1);
    if (latest < staleCutoff)
      add("stale", st, `Latest official result is from ${latest}; nothing newer is on file.`);
    const eras = new Set(list.map((r) => eraOf(r.year)));
    if (eras.size === 2)
      add(
        "cross-reset",
        st,
        `Results on both sides of the ${SCALE_RESET_YEAR} scale reset. Do not compare levels across it.`,
      );
  }
  for (const st of students)
    if (names.get(st.name.trim().toLowerCase()) > 1)
      add(
        "duplicate",
        st,
        "Another student has the same name; results may be split between two records.",
      );
  const counts = Object.fromEntries(
    ["missing", "implausible", "jump", "duplicate", "stale", "cross-reset"].map((k) => [
      k,
      findings.filter((f) => f.kind === k).length,
    ]),
  );
  return { findings, counts };
}

export const QUALITY_WORDS = Object.freeze({
  missing: "Missing data",
  implausible: "Implausible value",
  jump: "Unexpected jump",
  duplicate: "Possible duplicate",
  stale: "Stale data",
  "cross-reset": "Cross-reset comparison",
});
