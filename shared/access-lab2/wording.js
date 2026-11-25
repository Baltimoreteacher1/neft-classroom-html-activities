// Kind-wording guard for the Road plan. A regenerated plan must never shame or rush a student, so no plan string may
// contain any phrase below (English or Spanish). Tests run a known-shaming plan through this guard as a negative control.
const L = "(?<![\\p{L}])";
const R = "(?![\\p{L}])";
const word = (alt) => new RegExp(`${L}(?:${alt})${R}`, "iu");

export const BANNED_EN = Object.freeze([
  word("behind"),
  word("late"),
  word("miss(?:ed|es|ing)?"),
  word("fail(?:ed|s|ing|ure)?"),
  word("overdue"),
  word("lazy"),
  word("slack\\w*"),
  word("catch(?:ing)?[ -]up"),
  word("should (?:have|had)"),
  word("didn't|haven't|hasn't|wasn't able"),
  word("not enough"),
  word("poor\\w*|bad\\w*"),
  word("punish\\w*|penalt\\w*|deadline"),
  word("only"),
]);

export const BANNED_ES = Object.freeze([
  word("atrasad[oa]s?|atraso"),
  word("tarde"),
  word("falt(?:ó|aste|aron|as|a)"),
  word("fall(?:ó|aste|aron)|fracas\\w+"),
  word("perdiste|perdió"),
  word("debiste|debió|debías"),
  word("rezagad[oa]s?"),
  word("castigo\\w*|plazo vencido"),
]);

/** Phrases found in `text`, or []. */
export function findBanned(text) {
  if (typeof text !== "string") return [];
  return [...BANNED_EN, ...BANNED_ES].map((re) => text.match(re)?.[0]).filter(Boolean);
}
