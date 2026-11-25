// Reveal Math numbers for a lesson card. Source: lessons[].reveal = [{ id: "3-1", title, unit: 3, terms }], generated
// per unit by tools/build-bcpss-activity-lessons.mjs. The match is by shared vocabulary, not a pacing crosswalk,
// so the text says "same words". Browser and server safe. Returns null when the lesson has no Reveal match: a card
// never shows a number the data does not carry.

const ID = /^\d{1,2}-\d{1,2}$/;

/** [{ unit: "3", lessons: ["3-1", "3-2"] }] in first-seen unit order, lessons in data order. */
export function revealGroups(reveal) {
  const groups = new Map();
  for (const r of Array.isArray(reveal) ? reveal : []) {
    if (!ID.test(String(r?.id ?? ""))) continue;
    const unit = String(r.unit ?? r.id.split("-")[0]);
    if (!groups.has(unit)) groups.set(unit, []);
    if (!groups.get(unit).includes(r.id)) groups.get(unit).push(r.id);
  }
  return [...groups].map(([unit, lessons]) => ({ unit, lessons }));
}

/** "Reveal Math, same words: Unit 3, lessons 3-1, 3-2, 3-9" or null. */
export function revealText(reveal) {
  const groups = revealGroups(reveal);
  if (!groups.length) return null;
  const parts = groups.map(
    (g) => `Unit ${g.unit}, lesson${g.lessons.length > 1 ? "s" : ""} ${g.lessons.join(", ")}`,
  );
  return `Reveal Math, same words: ${parts.join("; ")}`;
}
