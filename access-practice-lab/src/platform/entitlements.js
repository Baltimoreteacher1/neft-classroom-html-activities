// Feature entitlements: the one place that answers "may this person use this feature?". Today the answer is always yes.
// Nothing is gated, there is no payment code, no account, no tracking: `enforced` is false and every feature is free.
// It exists so that a future school licence or teacher plan changes ONE file and one flag instead of touching every
// view. Feature ids are the sitemap ids (src/sitemap.js), so the list of features has a single source of truth.
//
// To restrict a feature later: add `overrides: { "<sitemap id>": "<tier>" }`, set `enforced: true`, and give `canUse`
// the person's plan. tools/entitlements.test.mjs fails if an override names a feature that does not exist, if any
// tier other than "free" appears while `enforced` is false, or if payment or ad code is introduced here.

export const TIERS = Object.freeze(["free", "school", "teacher-plus"]);

export const ENTITLEMENTS = Object.freeze({
  version: 1,
  enforced: false,
  defaultTier: "free",
  overrides: Object.freeze({}),
});

/** The tier a feature belongs to. Unknown ids belong to the default tier: a typo never locks anyone out. */
export const tierOf = (featureId, config = ENTITLEMENTS) =>
  config.overrides[featureId] || config.defaultTier;

/** May the person use the feature? Always true while nothing is enforced. `plan` is a tier name from TIERS. */
export function canUse(featureId, plan = "free", config = ENTITLEMENTS) {
  if (!config.enforced) return true;
  const need = tierOf(featureId, config);
  return need === "free" || TIERS.indexOf(plan) >= TIERS.indexOf(need);
}
