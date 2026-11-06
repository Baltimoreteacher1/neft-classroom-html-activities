// Build Journey localStorage seeds with the real state.js reducers, so a scenario can start at a given point
// (steps done, support level, old completion dates) without replaying every earlier step in the browser.
import * as St from "../../access-practice-lab/src/journey/state.js";

const ISO = (d) => new Date(d).toISOString();
export const daysAgo = (n) => ISO(Date.now() - n * 86400000);

/**
 * steps: [{ m, s, independent, help, results: { engineKey: result }, at }]. Returns { [St.KEY]: json }.
 * A communicate result is what the Growth Mirror reads as `env.prior.communicate`.
 */
export function seedJourney({ band, steps = [], support = "A", cursor = null, assigned = null }) {
  let st = St.emptyState();
  for (const step of steps) {
    const at = step.at || daysAgo(0);
    for (const [key, result] of Object.entries(step.results || {}))
      st = St.updateStepData(st, band, step.m, step.s, key, { result }, at);
    for (const [key, patch] of Object.entries(step.data || {}))
      st = St.updateStepData(st, band, step.m, step.s, key, patch, at);
    for (const h of step.help || []) st = St.noteHelp(st, band, step.m, step.s, h, at);
    if (step.partial) continue; // started, with engine data, but not finished
    st = St.completeStep(st, band, step.m, step.s, {
      independent: Boolean(step.independent),
      summary: step.summary,
      now: at,
    });
  }
  st = St.setSupport(st, band, support);
  if (cursor) st = St.setCursor(st, band, cursor.mission, cursor.step);
  if (assigned) st = St.assign(st, band, assigned);
  return { [St.KEY]: JSON.stringify(st) };
}

/** Steps 1..n of a mission finished with support, plausible results included. */
export function missionSteps(m, _band, upTo, { at, commKind = "converse", commText } = {}) {
  const order = ["discover", "understand", "build", "communicate", "improve", "show"];
  const text =
    commText ||
    "Because the soil was compacted, water pooled, and as a result the roots had less air. The probe showed 45 minutes of pooling, so the yield fell.";
  return order.slice(0, upTo).map((s) => ({
    m,
    s,
    at,
    results:
      s === "communicate"
        ? {
            [commKind]: {
              text,
              mode: commKind === "converse" ? "speak" : "write",
              supportsUsed: [],
              words: text.split(/\s+/).length,
            },
          }
        : s === "discover"
          ? { scene: { text: "sun matters", supportsUsed: [], words: 12 } }
          : s === "understand"
            ? {
                read: { supportsUsed: [] },
                listen: { correct: 5, total: 5, tries: 5, supportsUsed: [] },
              }
            : s === "build"
              ? { build: { modules: [], supportsUsed: [] } }
              : undefined,
  }));
}
