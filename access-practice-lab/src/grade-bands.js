// The grade picker on the lab home: the grade groups a learner or teacher chooses from, and how each one maps onto
// the content bands that content/index.json actually ships ("3-5", "6-8", and any band a later content set adds).
//
// One list, read by the home picker and by availableBands() in content.js. A new band goes live by adding its
// content to content/index.json under the band key named in `content` below; nothing else changes. Until then the
// pick is remembered (prefs.gradePick) and the learner is shown the closest band that has practice, with a line
// that says so, never a silent substitute.

/** Every content band the lab knows, youngest first. availableBands() keeps the ones index.json ships, in this order. */
export const CONTENT_BAND_ORDER = ["K", "1", "2-3", "3-5", "4-5", "6-8"];

/**
 * The picker, youngest first. `content` lists the index.json bands that serve this pick, best first (Grades 4–5 is
 * served by the 3–5 band until a 4–5 band ships). `span` is how many grades the pick covers: the ruler sizes each
 * segment by it.
 */
export const GRADE_PICKS = [
  { id: "K", span: 1, content: ["K"], short: ["K", "K"], name: ["Kindergarten", "Kínder"] },
  { id: "1", span: 1, content: ["1"], short: ["1", "1"], name: ["Grade 1", "1.º grado"] },
  {
    id: "2-3",
    span: 2,
    content: ["2-3"],
    short: ["2–3", "2–3"],
    name: ["Grades 2–3", "2.º a 3.º grado"],
  },
  {
    id: "4-5",
    span: 2,
    content: ["4-5", "3-5"],
    short: ["4–5", "4–5"],
    name: ["Grades 4–5", "4.º a 5.º grado"],
  },
  {
    id: "6-8",
    span: 3,
    content: ["6-8"],
    short: ["6–8", "6–8"],
    name: ["Grades 6–8", "6.º a 8.º grado"],
  },
];

export const bandName = (band) => {
  const g = band.replace("-", "–");
  if (band === "K") return ["Kindergarten", "Kínder"];
  return /–/.test(g) ? [`Grades ${g}`, `Grados ${g}`] : [`Grade ${g}`, `Grado ${g}`];
};

const pickById = (id) => GRADE_PICKS.find((p) => p.id === id) || null;

/** The content band that serves a pick: its own band when shipped, otherwise the closest shipped band. */
export function resolvePick(pickId, available) {
  const pick = pickById(pickId);
  if (!pick || !available.length) return { band: available[0] || "", exact: false };
  const own = pick.content.find((b) => available.includes(b));
  if (own) return { band: own, exact: true };
  // Closest shipped band by position in the ordered list: the next older band first, then the next younger.
  const at = CONTENT_BAND_ORDER.indexOf(pick.content[0]);
  const older = CONTENT_BAND_ORDER.slice(at + 1).find((b) => available.includes(b));
  const younger = [...CONTENT_BAND_ORDER.slice(0, at)].reverse().find((b) => available.includes(b));
  return { band: older || younger || available[0], exact: false };
}

/**
 * Which pick the picker shows as chosen. The remembered pick wins while it still resolves to the band on screen
 * (a learner who chose Grade 1 keeps seeing Grade 1 chosen); after a band change elsewhere (a ?grades= link, the
 * band switch in the library) it is the youngest pick whose own content is that band.
 */
export function currentPick(band, remembered, available) {
  if (remembered && pickById(remembered) && resolvePick(remembered, available).band === band)
    return remembered;
  return (
    GRADE_PICKS.find((p) => p.content.includes(band) && resolvePick(p.id, available).band === band)
      ?.id ||
    GRADE_PICKS.find((p) => p.content.includes(band))?.id ||
    ""
  );
}

/** The picker as data: one entry per pick with whether it has its own practice yet. */
export function pickerState(band, remembered, available) {
  const chosen = currentPick(band, remembered, available);
  return GRADE_PICKS.map((p) => {
    const { band: serves, exact } = resolvePick(p.id, available);
    return { ...p, serves, ready: exact, chosen: p.id === chosen };
  });
}
