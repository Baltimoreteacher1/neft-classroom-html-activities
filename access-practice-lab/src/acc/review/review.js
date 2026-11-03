// Teacher review of speaking and writing practice. Pure logic shared by the Hub panel and the student's feedback view.
// A review is a teacher's judgement against a classroom rubric. It is NOT a WIDA score or level and is never presented as one.
export const REVIEW_PREFIX = "review.";
export const MAX_NOTE = 600;
export const rubricFor = (item) => item?.meta?.rubric || (item?.type === "speaking-response" ? "speaking-practice" : "writing-practice");
export const reviewKey = (row) => `${row.learner}|${row.sessionId}|${row.itemId}`;
export const storageKey = (row) => REVIEW_PREFIX + reviewKey(row);

/** A review is complete when every dimension has a rating from the rubric's own scale. */
export function validateReview(review, rubric) {
  const ratings = review?.ratings || {};
  const missing = rubric.dimensions.filter((d) => !Number.isInteger(ratings[d.id]) || ratings[d.id] < 0 || ratings[d.id] >= rubric.ratings.length).map((d) => d.id);
  const note = String(review?.note || "");
  return { ok: !missing.length && note.length <= MAX_NOTE, missing, noteTooLong: note.length > MAX_NOTE };
}

/** The stored record: ratings are indexes into the rubric's scale; the rubric id and version travel with them. */
export function makeReview({ rubric, ratings, note = "", shared = false, now = Date.now() }) {
  return { kind: "teacher-reviewed", rubric: rubric.id, rubricVersion: rubric.version, ratings: { ...ratings }, note: String(note).slice(0, MAX_NOTE), shared: Boolean(shared), reviewedAt: now };
}

/** Plain-language lines for the student. Strengths first, then one next step. No score, no level. */
export function studentFeedback(review, rubric) {
  if (!review?.shared) return null;
  const rated = rubric.dimensions.map((d) => ({ d, r: review.ratings[d.id] })).filter((x) => Number.isInteger(x.r));
  const strengths = rated.filter((x) => x.r >= 2).map((x) => ({ label: x.d.label, text: x.d.descriptors[x.r] }));
  const next = rated.filter((x) => x.r < 2).sort((a, b) => a.r - b.r)[0];
  return { kind: "teacher-reviewed", strengths, nextStep: next ? { label: next.d.label, text: next.d.descriptors[Math.min(next.r + 1, 3)] } : null, note: review.note || "", reviewedAt: review.reviewedAt };
}

export const reviewedKeySet = (settingsRows) => new Set(settingsRows.filter((s) => s.key.startsWith(REVIEW_PREFIX)).map((s) => s.key.slice(REVIEW_PREFIX.length)));
