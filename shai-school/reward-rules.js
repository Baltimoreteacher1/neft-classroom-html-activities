/* Shai School reward rules — the single source of truth for workout payments.
 *
 * The tier amounts are DATA, not constants: a parent edits them in the app's
 * Parent settings and they persist in `state.rewards.pushupTiers`. The frozen
 * PUSHUP_TARGETS below is only the factory default, used when a device has no
 * saved schedule yet. Callers pass the live tiers in; omitting them keeps the
 * original behavior.
 */
(function (root) {
  "use strict";

  const PUSHUP_ITEM_ID = "pushups";
  const READING_ITEM_ID = "reading";
  const READING_RATE_DEFAULT = 0.25;
  const PUSHUP_TARGETS = Object.freeze([
    Object.freeze({ days: 4, total: 5 }),
    Object.freeze({ days: 2, total: 2 }),
    Object.freeze({ days: 1, total: 0.5 }),
  ]);

  // Coerce whatever is stored into a usable ladder: positive whole day counts,
  // non-negative amounts, highest day requirement first (pushupWeeklyTarget
  // takes the first tier the kid has reached, so order is load-bearing).
  function normalizePushupTiers(tiers) {
    const list = (Array.isArray(tiers) ? tiers : [])
      .map((t) => ({
        days: Math.max(1, Math.floor(Number(t?.days) || 0)),
        total: Math.max(0, Math.round((Number(t?.total) || 0) * 100) / 100),
      }))
      .filter((t) => Number.isFinite(t.days) && t.days >= 1)
      .sort((a, b) => b.days - a.days);
    return list.length ? list : PUSHUP_TARGETS.map((t) => ({ days: t.days, total: t.total }));
  }

  function pushupWeeklyTarget(completedDays, tiers) {
    const days = Math.max(0, Math.floor(Number(completedDays) || 0));
    return normalizePushupTiers(tiers).find((tier) => days >= tier.days)?.total || 0;
  }

  function pushupRewardIncrement(completedDays, alreadyPaid, tiers) {
    const target = pushupWeeklyTarget(completedDays, tiers);
    return Math.max(0, Math.round((target - (Number(alreadyPaid) || 0)) * 100) / 100);
  }

  root.ShaiRewardRules = Object.freeze({
    PUSHUP_ITEM_ID,
    READING_ITEM_ID,
    READING_RATE_DEFAULT,
    PUSHUP_TARGETS,
    normalizePushupTiers,
    pushupRewardIncrement,
    pushupWeeklyTarget,
  });
})(globalThis);
