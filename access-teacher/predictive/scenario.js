// Scenario Studio arithmetic. A scenario is a set of HYPOTHETICAL changes the teacher chooses for each domain;
// it is never a prediction and never says that instruction will cause a change. Levels are moved and clamped
// to 1.0-6.0; scale scores move only when a scale score is on file. The composite is illustrated only where
// rules.js holds verified weights for that scale (a scale score, never a level).
import { compositeRuleFor, COMPOSITES, DOMAINS } from "./rules.js";

export const SCENARIO_LIMITS = Object.freeze({ level: 1.5, scale: 60 });
const clampLevel = (x) => Math.round(Math.min(6, Math.max(1, x)) * 10) / 10;

/** `record` is a ScoreRecord; `changes` { Listening: { level: +0.3, scale: +12 } … }. */
export function applyScenario(record, changes = {}) {
  const domains = {};
  for (const d of DOMAINS) {
    const base = record.domains[d];
    const c = changes[d] || {};
    const dl = Math.max(-SCENARIO_LIMITS.level, Math.min(SCENARIO_LIMITS.level, Number(c.level) || 0));
    const ds = Math.max(-SCENARIO_LIMITS.scale, Math.min(SCENARIO_LIMITS.scale, Math.round(Number(c.scale) || 0)));
    domains[d] = {
      baseLevel: base.level,
      level: base.level == null ? null : clampLevel(base.level + dl),
      levelChange: base.level == null ? null : Math.round((clampLevel(base.level + dl) - base.level) * 10) / 10,
      baseScale: base.scale,
      scale: base.scale == null ? null : base.scale + ds,
      scaleChange: base.scale == null ? null : ds,
    };
  }
  const rule = compositeRuleFor(record.scaleVersion);
  const composites = {};
  for (const c of COMPOSITES) {
    if (!rule) {
      composites[c] = { status: "no-rule" };
      continue;
    }
    const w = rule.weights[c];
    const keys = Object.keys(w);
    if (keys.some((d) => domains[d].baseScale == null)) {
      composites[c] = { status: "missing-scale" };
      continue;
    }
    const base = keys.reduce((s, d) => s + w[d] * domains[d].baseScale, 0);
    const next = keys.reduce((s, d) => s + w[d] * domains[d].scale, 0);
    composites[c] = { status: "illustrative", base: Math.round(base), scale: Math.round(next), change: Math.round(next - base), weights: w };
  }
  const priorities = DOMAINS.filter((d) => domains[d].level != null)
    .sort((a, b) => domains[a].level - domains[b].level)
    .slice(0, 2);
  return { domains, composites, priorities, rule: rule?.id || null };
}
