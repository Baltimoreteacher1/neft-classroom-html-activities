// Pure mapping of Language Studio activities onto the unit's lesson companions, and of Grade 6 math lessons onto
// the Reveal Math lessons this repo carries. No I/O: the build tool feeds it loaded data, tests feed it fixtures.
//
// A link is always one of three things, and says which:
//   uses   the lesson's own arc already runs this exact activity (same kind and title)
//   terms  the activity's text uses vocabulary the lesson teaches (3 points per NEW term, 1 per review term)
//   topic  nothing above matched, so the closest lesson by shared content words (idf-weighted)
// Nothing here invents a lesson, a number or a title: every link points at a lesson that exists in the unit.

const STOP = new Set(
  "about after again also because before being could does each from have into just like make many more most much only other over same some such than that their them then there these they this those very what when where which while with would your you are and the for was were will can its not but out how why who".split(
    " ",
  ),
);

/** Lowercase, drop punctuation, fold common inflections so "faces" matches "face" and "decomposes" matches "decompose". */
export function stem(word) {
  let w = String(word)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
  else if (w.length > 4 && /(?:[sxz]|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
  if (w.length > 4 && w.endsWith("e")) w = w.slice(0, -1);
  return w;
}

const termKey = (term) => String(term).split(/\s+/).map(stem).filter(Boolean).join(" ");

/** Every string in a payload, depth-first, in a stable order. */
function strings(value, out = []) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) strings(v, out);
  else if (value && typeof value === "object")
    for (const k of Object.keys(value)) strings(value[k], out);
  return out;
}

const tokens = (text) =>
  String(text)
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(Boolean);

const stemmedTokens = (text) => tokens(text).map(stem).filter(Boolean);

/** The lesson activities that are the same activity as a studio one. */
const lessonActivities = (lesson) =>
  [
    ...(lesson.arc || []).map((s) => s.activity),
    ...(lesson.newcomer_path || []),
    lesson.extension,
    lesson.exit_check,
  ].filter(Boolean);

/** Which unit vocabulary terms (by stem) the activity's text mentions, with counts. */
export function mentionedTerms(activity, vocabTerms) {
  const text = [activity.title, activity.mission, ...strings(activity.payload)].join(" ");
  const grams = stemmedTokens(text);
  const seen = new Map();
  for (const term of vocabTerms) {
    const key = termKey(term);
    const n = key.split(" ").length;
    let count = 0;
    for (let i = 0; i + n <= grams.length; i++)
      if (grams.slice(i, i + n).join(" ") === key) count++;
    if (count) seen.set(term, count);
  }
  return seen;
}

function topicScore(activity, lesson, idf) {
  const a = new Set(
    stemmedTokens(
      [activity.title, activity.mission, ...strings(activity.payload)].join(" "),
    ).filter((w) => w.length > 3 && !STOP.has(w)),
  );
  const l = new Set(
    stemmedTokens(
      [
        lesson.title,
        lesson.content_objective,
        lesson.mentor_sentence?.text,
        ...(lesson.vocab || []).map((v) => v.term),
      ].join(" "),
    ).filter((w) => w.length > 3 && !STOP.has(w)),
  );
  let score = 0;
  for (const w of a) if (l.has(w)) score += idf.get(w) ?? 1;
  return score;
}

const SECOND_LINK_RATIO = 0.75; // a second lesson is listed only when it fits nearly as well as the best one
const EXACT_USE = 5; // the lesson's own arc already runs this exact activity

/**
 * studio: the unit's studio content ({ activities, vocab }); lessons: the unit's lesson companions.
 * Each activity gets its best-fit lesson, plus a second one only when it scores within SECOND_LINK_RATIO of the best.
 * Links are listed best fit first. A lesson no activity picked is given the activity that fits it best when there is a
 * real signal behind it. Returns
 *   { activities: [{ n, kind, title, lessons: [{ id, sequence, title, how, terms? }] }],
 *     lessons:    [{ id, sequence, title, activities: [{ n, kind, title, how }] }] }.
 */
export function linkUnit({ studio, lessons }) {
  const vocabTerms = [...new Set(lessons.flatMap((l) => (l.vocab || []).map((v) => v.term)))];
  const df = new Map();
  for (const l of lessons)
    for (const w of new Set(stemmedTokens([l.title, l.content_objective].join(" "))))
      df.set(w, (df.get(w) || 0) + 1);
  const idf = new Map([...df].map(([w, n]) => [w, Math.log(1 + lessons.length / n)]));

  // score[a][l]: how well lesson l fits activity a, with the reason behind it
  const score = studio.activities.map((activity) => {
    const mentioned = mentionedTerms(activity, vocabTerms);
    return lessons.map((lesson) => {
      const used = lessonActivities(lesson).some(
        (a) => a.kind === activity.kind && a.title === activity.title,
      );
      const hits = [];
      let points = used ? EXACT_USE : 0;
      for (const v of lesson.vocab || []) {
        if (!mentioned.has(v.term)) continue;
        hits.push(v.term);
        points += v.new_or_review === "new" ? 3 : 1;
      }
      const topic = topicScore(activity, lesson, idf);
      const how = used ? "uses" : hits.length ? "terms" : "topic";
      return { lesson, points, topic, hits, how };
    });
  });

  const rank = (row) =>
    [...row].sort(
      (x, y) => y.points - x.points || y.topic - x.topic || x.lesson.sequence - y.lesson.sequence,
    );
  const link = (cell) => ({
    id: cell.lesson.id,
    sequence: cell.lesson.sequence,
    title: cell.lesson.title,
    how: cell.how,
    ...(cell.hits.length ? { terms: cell.hits } : {}),
  });

  const picked = studio.activities.map((_, i) => {
    const [best, next] = rank(score[i]);
    const out = [best];
    if (next && best.points > 0 && next.points >= SECOND_LINK_RATIO * best.points) out.push(next);
    return out;
  });
  // A lesson no activity picked is offered the activity that fits it best, but only on a real signal (its own
  // activity or shared words); a link with nothing behind it would only dilute the real ones.
  for (const [li, lesson] of lessons.entries()) {
    if (picked.some((cells) => cells.some((c) => c.lesson.id === lesson.id))) continue;
    const best = studio.activities
      .map((_, i) => ({ i, cell: score[i][li] }))
      .sort((x, y) => y.cell.points - x.cell.points || y.cell.topic - x.cell.topic || x.i - y.i)[0];
    if (best && best.cell.points > 0) picked[best.i].push(best.cell);
  }

  const activities = studio.activities.map((activity, i) => ({
    n: i + 1,
    kind: activity.kind,
    title: activity.title,
    lessons: picked[i].map(link), // best fit first
  }));
  const byLesson = lessons.map((lesson) => ({
    id: lesson.id,
    sequence: lesson.sequence,
    title: lesson.title,
    activities: activities
      .filter((a) => a.lessons.some((l) => l.id === lesson.id))
      .map((a) => ({
        n: a.n,
        kind: a.kind,
        title: a.title,
        how: a.lessons.find((l) => l.id === lesson.id).how,
      })),
  }));
  return { activities, lessons: byLesson };
}

/**
 * Grade 6 math only: Reveal Math lessons (this repo's own catalog) that teach the same words as a lesson companion.
 * reveal: [{ id, title, unit, terms: [vocabulary term] }].
 * 1. Find the Reveal unit(s) whose vocabulary best matches the whole BCPSS unit (up to three, each at least 20% of the
 *    best), so a generic word cannot pull in a lesson from an unrelated unit.
 * 2. Inside them, rank Reveal lessons by shared terms, each weighted by tier (domain terms count three times an
 *    academic word) and by rarity (a term in many Reveal lessons says less about any one of them).
 * 3. A match needs a shared domain term or two shared words; the best three within 40% of the top are kept.
 */
export function revealFor({ lessons, reveal }) {
  const df = new Map();
  for (const r of reveal)
    for (const k of new Set(r.terms.map(termKey))) df.set(k, (df.get(k) || 0) + 1);
  const weight = (v) => (v.tier === 3 ? 3 : 1) * (v.new_or_review === "new" ? 1.5 : 1);
  const termsOfUnit = new Map();
  for (const l of lessons)
    for (const v of l.vocab || [])
      termsOfUnit.set(termKey(v.term), Math.max(termsOfUnit.get(termKey(v.term)) || 0, weight(v)));
  const unitScore = new Map();
  for (const r of reveal)
    for (const t of r.terms) {
      const w = termsOfUnit.get(termKey(t));
      if (w) unitScore.set(r.unit, (unitScore.get(r.unit) || 0) + w / (df.get(termKey(t)) || 1));
    }
  const top = Math.max(0, ...unitScore.values());
  const units = new Set(
    [...unitScore]
      .filter(([, v]) => v >= 0.2 * top)
      .sort((x, y) => y[1] - x[1])
      .slice(0, 3)
      .map(([u]) => u),
  );

  return lessons.map((lesson) => {
    const mine = new Map();
    for (const v of lesson.vocab || []) mine.set(termKey(v.term), { v, w: weight(v) });
    const scored = reveal
      .filter((r) => units.has(r.unit))
      .map((r) => {
        const shared = r.terms.filter((t) => mine.has(termKey(t)));
        const score = shared.reduce(
          (n, t) => n + mine.get(termKey(t)).w / (df.get(termKey(t)) || 1),
          0,
        );
        const domain = shared.some((t) => mine.get(termKey(t)).v.tier === 3);
        return { r, shared, score, ok: shared.length && (domain || shared.length >= 2) };
      })
      .filter((h) => h.ok)
      .sort(
        (a, b) => b.score - a.score || a.r.id.localeCompare(b.r.id, undefined, { numeric: true }),
      );
    const best = scored[0]?.score || 0;
    const hits = scored.filter((h) => h.score >= 0.4 * best).slice(0, 3);
    return {
      id: lesson.id,
      reveal: hits.map((h) => ({ id: h.r.id, title: h.r.title, unit: h.r.unit, terms: h.shared })),
    };
  });
}
