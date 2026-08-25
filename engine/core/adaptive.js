//
// Tiers map to lesson framing:
//   "level1" -> support / scaffolded (extra hints, simpler items)
//   "core"   -> on-level
//   "level2" -> enrichment / extension

export const TIERS = ["level1", "core", "level2"];

// Map an internal tier to the config.practice bucket key.
export const TIER_TO_BUCKET = {
  level1: "approaching",
  core: "onLevel",
  level2: "extending",
};

const DEFAULTS = {
  minAttempts: 3, // don't branch until we have a little signal
  struggleBelow: 0.5, // accuracy below this -> step down toward level1
  excelAtOrAbove: 0.85, // accuracy at/above this -> step up toward level2
};

// Pull a normalized performance snapshot from a state-like object.
// Accepts either the live state API (has .get()) or a raw state object.
export function readPerformance(state) {
  const s = typeof state?.get === "function" ? state.get() : state || {};
  const attempts = Number(s.totalAttempts) || 0;
  const correct = Number(s.totalCorrect) || 0;
  const streak = Number(s.streak) || 0;
  const accuracy = attempts > 0 ? correct / attempts : 0;
  return { attempts, correct, streak, accuracy };
}

// Step a tier name by an integer offset along TIERS (clamped).
function shiftTier(tier, by) {
  const i = TIERS.indexOf(tier);
  const base = i === -1 ? 1 : i;
  return TIERS[Math.max(0, Math.min(TIERS.length - 1, base + by))];
}

// Pure decision: given a performance snapshot, return a tier.
// Honors an explicit manual override ("level1" | "core" | "level2").
// A negative `remediationBias` (set by the remediation flow after repeated
// misses) nudges the chosen tier down toward Level 1 (support); a positive
// bias nudges up toward Level 2 (enrichment) after a recovery.
/**
 * @param {{ override?: string, minAttempts?: number, struggleBelow?: number,
 *   excelAtOrAbove?: number, remediationBias?: number }} [opts]
 */
export function decideTier(perf, opts = {}) {
  const cfg = { ...DEFAULTS, ...opts };
  if (cfg.override && TIERS.includes(cfg.override)) return cfg.override;

  const { attempts, accuracy, streak } = perf;
  const bias = Number(perf.remediationBias) || 0;

  let tier;
  // Not enough evidence yet — stay on core.
  if (attempts < cfg.minAttempts) tier = "core";
  // A cold streak of misses is a strong struggle signal even if early.
  else if (accuracy < cfg.struggleBelow) tier = "level1";
  // Sustained success -> enrichment.
  else if (accuracy >= cfg.excelAtOrAbove && streak >= 2) tier = "level2";
  else tier = "core";

  // Bias < 0 steps down toward level1; bias > 0 steps up toward level2.
  if (bias < 0) tier = shiftTier(tier, -1);
  else if (bias > 0) tier = shiftTier(tier, 1);

  return tier;
}

// Convenience: read live state and decide. Pure-ish (reads, never writes).
export function selectTier(state, opts = {}) {
  const perf = readPerformance(state);
  const s = typeof state?.get === "function" ? state.get() : state || {};
  perf.remediationBias = Number(s.remediationBias) || 0;
  return decideTier(perf, opts);
}

// Hook used by the remediation flow to push the adaptive tier toward Level 1
// (direction "down") after repeated misses, or back up ("up") after a
// recovery. Persists a clamped `remediationBias` on the shared state.
export function adjustTier(state, direction) {
  if (!state || typeof state.set !== "function") return;
  const s = typeof state.get === "function" ? state.get() : {};
  const cur = Number(s.remediationBias) || 0;
  const step = direction === "down" ? -1 : 1;
  const next = Math.max(-3, Math.min(3, cur + step));
  state.set({ remediationBias: next });
}

// Build the adaptive problem queue for the Practice phase.
// Starts at the tier chosen from current performance, then re-evaluates the
// tier after each answered item so the sequence tracks the student live.
export function createAdaptiveSequence(config, state, opts = {}) {
  const practice = config.practice || {};
  const buckets = {
    level1: practice.approaching || [],
    core: practice.onLevel || [],
    level2: practice.extending || [],
  };

  const cursors = { level1: 0, core: 0, level2: 0 };
  // Cap total served items so a struggling student isn't trapped forever.
  // An assigned "Adjusted workload" accommodation (Learning Supports layer,
  // window.EWLAdapt.reducedWorkload) shortens the set further — never below 3 —
  // without changing the problems themselves.
  const fullCount = buckets.level1.length + buckets.core.length + buckets.level2.length;
  const reduced =
    typeof window !== "undefined" && window.EWLAdapt && window.EWLAdapt.reducedWorkload;
  const maxItems = opts.maxItems || (reduced ? Math.max(3, Math.ceil(fullCount * 0.6)) : fullCount);
  let served = 0;

  // Items already handed out, tracked by identity so a targeted pull cannot
  // serve the same problem twice. The plain cursors cannot express this on
  // their own: a targeted pick takes an item from the MIDDLE of a bucket, and
  // advancing the cursor past it would silently skip everything before it.
  const servedItems = new WeakSet();

  function take(tier, index) {
    const prob = buckets[tier][index];
    servedItems.add(prob);
    // Keep the cursor honest: slide it past anything already served so the
    // sequential path never re-offers a targeted pull.
    while (cursors[tier] < buckets[tier].length && servedItems.has(buckets[tier][cursors[tier]])) {
      cursors[tier]++;
    }
    return { ...prob, tier };
  }

  // Does this item's authoring trap the given misconception? Only authored tags
  // count. The inference engine can name an error from a wrong ANSWER, but it
  // cannot know in advance which item will elicit which error, so predicting
  // that here would be guessing — and a "targeted" item that does not actually
  // target anything is worse than the ordinary next item, because it displaces
  // it for no reason.
  function trapsTag(prob, tag) {
    if (!prob || !tag) return false;
    if (prob.misconceptionTag === tag) return true;
    return Array.isArray(prob.misconceptionTags) && prob.misconceptionTags.includes(tag);
  }

  // Prefer an unserved item that traps `tag`, searching the requested tier first
  // and then its neighbours in the same order the ordinary path would. Returns
  // null when there is none, and the caller falls straight through to sequential
  // order — this only ever CHANGES which item comes next, never whether one does.
  function pickTargeted(order, tag) {
    for (const t of order) {
      const bucket = buckets[t];
      for (let i = cursors[t]; i < bucket.length; i++) {
        if (servedItems.has(bucket[i])) continue;
        if (trapsTag(bucket[i], tag)) return take(t, i);
      }
    }
    return null;
  }

  function tierOrder(tier) {
    // Try requested tier, then gracefully fall back through neighbors.
    return tier === "level1"
      ? ["level1", "core", "level2"]
      : tier === "level2"
        ? ["level2", "core", "level1"]
        : ["core", "level1", "level2"];
  }

  function pickFrom(tier) {
    for (const t of tierOrder(tier)) {
      while (cursors[t] < buckets[t].length && servedItems.has(buckets[t][cursors[t]])) {
        cursors[t]++;
      }
      if (cursors[t] < buckets[t].length) return take(t, cursors[t]);
    }
    return null;
  }

  return {
    buckets,
    /**
     * @param {string} [overrideTier]
     * @param {{ targetTag?: string|null }} [pickOpts] `targetTag` names the
     *   misconception this student just showed (or keeps showing across
     *   lessons). When an unserved item traps that error, it is served next so
     *   the student meets the trap while the correction is fresh and clearing it
     *   counts as evidence. Purely a preference — never a filter.
     */
    nextProblem(overrideTier, pickOpts = {}) {
      if (served >= maxItems) return null;
      const tier = overrideTier || selectTier(state, opts);
      const targetTag = pickOpts.targetTag;
      let prob = targetTag ? pickTargeted(tierOrder(tier), targetTag) : null;
      if (prob) prob.targetedFor = targetTag;
      else prob = pickFrom(tier);
      if (prob) served++;
      return prob;
    },
    get servedCount() {
      return served;
    },
    get total() {
      return maxItems;
    },
  };
}
