// Adaptive practice, conservative by design. The lab never labels a learner with a level. It looks at independent first-try
// work on DIFFERENT items across DIFFERENT days, and proposes one next practice step. Everything here is a suggestion a teacher
// can override, and the thresholds are teacher-configurable. Supported success never counts as mastery.
export const DEFAULT_THRESHOLDS = Object.freeze({ minItems: 3, minDays: 2, strongPct: 80, lowPct: 50 });
export const THRESHOLD_KEY = "adapt.thresholds";

export function normalizeThresholds(t = {}) {
  const num = (v, d, lo, hi) => (Number.isFinite(Number(v)) ? Math.min(hi, Math.max(lo, Math.round(Number(v)))) : d);
  const out = { minItems: num(t.minItems, DEFAULT_THRESHOLDS.minItems, 2, 10), minDays: num(t.minDays, DEFAULT_THRESHOLDS.minDays, 1, 7), strongPct: num(t.strongPct, DEFAULT_THRESHOLDS.strongPct, 50, 100), lowPct: num(t.lowPct, DEFAULT_THRESHOLDS.lowPct, 10, 90) };
  if (out.lowPct >= out.strongPct) out.lowPct = Math.max(10, out.strongPct - 10);
  return out;
}

const dayOf = (t) => new Date(t).toISOString().slice(0, 10);
const objective = (rows) => rows.filter((r) => r.correct !== null && r.status !== "unanswered");

/** Status of one skill (a set of evidence rows). `secure` needs enough DIFFERENT items right on the first try, unsupported, on enough DIFFERENT days. */
export function skillStatus(rows, th = DEFAULT_THRESHOLDS) {
  const obj = objective(rows);
  if (!obj.length) return { status: "not-started", items: 0, days: 0, independentPct: null };
  const wins = obj.filter((r) => r.correct === true && r.independent);
  const winItems = new Set(wins.map((r) => r.itemId));
  const winDays = new Set(wins.map((r) => dayOf(r.t)));
  const pct = Math.round((wins.length / obj.length) * 100);
  let status = "building";
  if (winItems.size >= th.minItems && winDays.size >= th.minDays && pct >= th.strongPct) status = "secure";
  else if (obj.length >= th.minItems && pct < th.lowPct) status = "needs-support";
  return { status, items: winItems.size, days: winDays.size, independentPct: obj.length >= th.minItems ? pct : null, attempted: obj.length };
}

/** Whether supports can start to fade, stay, or return, from the most recent responses on a skill. */
export function fadeAdvice(rows) {
  const recent = objective(rows).sort((a, b) => b.t - a.t).slice(0, 3);
  if (recent.length < 2) return { advice: "keep", reason: "Not enough recent work to decide." };
  const supportedWins = recent.filter((r) => r.correct && !r.independent);
  const independentWins = recent.filter((r) => r.correct && r.independent);
  const independentMisses = recent.filter((r) => !r.correct && r.independent !== false && r.supportTier === 0);
  if (independentWins.length >= 2) return { advice: "fade", reason: "Two recent independent successes. Offer the next task with supports closed." };
  if (supportedWins.length >= 2 && !independentWins.length) return { advice: "try-independent", reason: "Recent successes used supports. Offer one task on their own." };
  if (independentMisses.length >= 2) return { advice: "return-supports", reason: "Two recent unsupported misses. Keep supports available and try a similar task." };
  return { advice: "keep", reason: "Mixed recent work. Keep the current level of support." };
}

const skillKey = (r) => `${r.domain}|${r.klu}|${r.context || "Social and Instructional"}`;

/**
 * One next-step suggestion. Chooses the skill that most needs practice (needs-support first, then building with the fewest
 * independent wins), then picks bank items in the same skill the learner has NOT answered, preferring a different `parallel`
 * group member so the skill is practiced on new content rather than a repeat.
 */
export function nextStep(rows, bankItems, th = DEFAULT_THRESHOLDS, { grade = null } = {}) {
  const bySkill = new Map();
  for (const r of rows) {
    const k = skillKey(r);
    (bySkill.get(k) || bySkill.set(k, []).get(k)).push(r);
  }
  const ranked = [...bySkill.entries()].map(([k, rs]) => ({ key: k, rows: rs, ...skillStatus(rs, th) })).filter((s) => s.status !== "secure" && s.status !== "not-started").sort((a, b) => (a.status === b.status ? a.items - b.items : a.status === "needs-support" ? -1 : 1));
  if (!ranked.length) {
    return { kind: "explore", reason: rows.length ? "Every skill with evidence is secure. Try a new combination." : "No practice yet. Start with any set.", items: [], skill: null };
  }
  const target = ranked[0];
  const [domain, klu, context] = target.key.split("|");
  const seen = new Set(rows.map((r) => r.itemId));
  const doneGroups = new Set(rows.filter((r) => r.parallel).map((r) => r.parallel));
  const pool = bankItems.filter((i) => i.domain === domain && i.klu === klu && (i.context || "Social and Instructional") === context && !seen.has(i.id) && (!grade || i.grade === grade));
  const fresh = pool.filter((i) => !i.parallel || !doneGroups.has(i.parallel));
  const pick = (fresh.length ? fresh : pool).slice(0, 3);
  const fade = fadeAdvice(target.rows);
  return { kind: target.status === "needs-support" ? "reteach" : "practice", skill: { domain, klu, context }, status: target.status, evidence: { independentItems: target.items, days: target.days, attempted: target.attempted }, fade, items: pick.map((i) => ({ setId: i.setId, itemId: i.id })), reason: `${domain} · ${klu} · ${context}: ${target.items} independent success${target.items === 1 ? "" : "es"} on ${target.days} day${target.days === 1 ? "" : "s"} so far.` };
}

/**
 * Build a custom practice set from chosen bank items. Stimulus ids are namespaced by source set so two sets that both use "p1"
 * cannot collide, and every item keeps its own id, meta and supports unchanged.
 */
export function assembleSet(sets, picks, { id = "custom", title = "Custom practice", minutes } = {}) {
  const byId = new Map(sets.map((s) => [s.id, s]));
  const stimuli = [];
  const have = new Set();
  const items = [];
  for (const { setId, itemId } of picks) {
    const src = byId.get(setId);
    const item = src?.items.find((i) => i.id === itemId);
    if (!item) continue;
    const sid = item.stimulus ? `${setId}__${item.stimulus}` : undefined;
    if (sid && !have.has(sid)) {
      const stim = src.stimuli.find((s) => s.id === item.stimulus);
      if (stim) {
        stimuli.push({ ...structuredClone(stim), id: sid });
        have.add(sid);
      }
    }
    items.push({ ...structuredClone(item), ...(sid ? { stimulus: sid } : {}) });
  }
  if (!items.length) return null;
  const grades = new Set(picks.map((p) => byId.get(p.setId)?.grade).filter(Boolean));
  return { id, title, grade: grades.size === 1 ? [...grades][0] : "3-5", domain: "Mixed", minutes: minutes || Math.max(10, items.length * 3), description: "A custom practice set assembled from the item bank.", bank: { version: 1, provenance: { source: "original", author: "EduWonderLab, AI-assisted draft", created: new Date().toISOString().slice(0, 10) }, reviewStatus: "automated-checks-only", custom: true }, stimuli, items };
}
