/* Shai School reward rules — the single source of truth for workout payments. */
(function (root) {
  "use strict";

  const PUSHUP_ITEM_ID = "pushups";
  const PUSHUP_TARGETS = Object.freeze([
    Object.freeze({ days: 4, total: 5 }),
    Object.freeze({ days: 2, total: 2 }),
    Object.freeze({ days: 1, total: 0.5 }),
  ]);

  function pushupWeeklyTarget(completedDays) {
    const days = Math.max(0, Math.floor(Number(completedDays) || 0));
    return PUSHUP_TARGETS.find((tier) => days >= tier.days)?.total || 0;
  }

  function pushupRewardIncrement(completedDays, alreadyPaid) {
    const target = pushupWeeklyTarget(completedDays);
    return Math.max(0, Math.round((target - (Number(alreadyPaid) || 0)) * 100) / 100);
  }

  root.ShaiRewardRules = Object.freeze({
    PUSHUP_ITEM_ID,
    PUSHUP_TARGETS,
    pushupRewardIncrement,
    pushupWeeklyTarget,
  });
})(globalThis);
