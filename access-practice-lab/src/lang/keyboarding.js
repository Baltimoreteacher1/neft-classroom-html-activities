// Keyboarding warm-ups: type an academic sentence frame exactly. Accuracy only — there is no clock, no speed and
// no words-per-minute anywhere. Accuracy is the characters typed right, from the edit distance to the target.

/** Levenshtein distance (insert, delete, substitute = 1). */
export function editDistance(a, b) {
  const s = String(a);
  const t = String(b);
  let prev = Array.from({ length: t.length + 1 }, (_, j) => j);
  for (let i = 1; i <= s.length; i++) {
    const cur = [i];
    for (let j = 1; j <= t.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[t.length];
}

/**
 * How closely `typed` matches `target`. Spaces at the ends are ignored; capitals and punctuation count, because
 * test-day writing needs them.
 * @returns {{ right: number, total: number, exact: boolean, firstDiff: number }}
 */
export function checkTyping(target, typed) {
  const goal = String(target || "");
  const got = String(typed || "").trim();
  const total = goal.length;
  const right = Math.max(0, total - editDistance(goal, got));
  let firstDiff = -1;
  for (let i = 0; i < Math.max(goal.length, got.length); i++)
    if (goal[i] !== got[i]) {
      firstDiff = i;
      break;
    }
  return { right, total, exact: got === goal, firstDiff };
}
