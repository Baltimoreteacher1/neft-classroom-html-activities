// Deterministic practice-evidence fixtures for browser checks. They are made-up rows (no real student, no real names);
// the ids are real item ids from the starter sets so the alignment table can look the tasks up.
export const FIXTURE_LEARNERS = { a: "L-fixture1", b: "L-fixture2" };

const row = (o) => ({
  grade: "3-5",
  setId: "starter-3-5",
  mode: "summative",
  status: "correct",
  correct: true,
  independent: true,
  supportTier: 0,
  attempts: 1,
  type: "multiple-choice",
  ...o,
});

export function fixtureRows(t0 = Date.parse("2026-10-05T15:00:00Z")) {
  const day = 864e5;
  const a = FIXTURE_LEARNERS.a;
  const rows = [];
  // Reading · Explain · Science: strong (first try, no support)
  ["g35-r1", "g35-r2", "g35-r3", "g35-r6"].forEach((itemId, i) =>
    rows.push(
      row({
        learner: a,
        sessionId: "s1",
        itemId,
        domain: "Reading",
        klu: "Explain",
        context: "Science",
        t: t0 + i,
      }),
    ),
  );
  // Reading · Argue · Social Studies (grade 6-8): wrong on the first try
  ["g68-r3", "g68-r6", "g68-r1"].forEach((itemId, i) =>
    rows.push(
      row({
        learner: a,
        sessionId: "s2",
        itemId,
        grade: "6-8",
        setId: "starter-6-8",
        domain: "Reading",
        klu: "Argue",
        context: "Social Studies",
        status: "incorrect",
        correct: false,
        independent: false,
        t: t0 + day + i,
      }),
    ),
  );
  // Listening · Narrate · Science: right only with support
  ["g35-l1", "g35-r4", "g35-r5"].forEach((itemId, i) =>
    rows.push(
      row({
        learner: a,
        sessionId: "s3",
        mode: "formative",
        itemId,
        domain: "Listening",
        klu: "Narrate",
        context: "Science",
        independent: false,
        supportTier: 2,
        attempts: 2,
        t: t0 + 2 * day + i,
      }),
    ),
  );
  // Writing and Speaking: saved for teacher review, never scored
  rows.push(
    row({
      learner: a,
      sessionId: "s3",
      itemId: "g35-w1",
      type: "constructed-response",
      domain: "Writing",
      klu: "Explain",
      context: "Science",
      status: "needs-review",
      correct: null,
      independent: false,
      t: t0 + 2 * day + 10,
    }),
  );
  rows.push(
    row({
      learner: a,
      sessionId: "s3",
      itemId: "g35-s1",
      type: "speaking-response",
      domain: "Speaking",
      klu: "Explain",
      context: "Science",
      status: "needs-review",
      correct: null,
      independent: false,
      t: t0 + 2 * day + 11,
    }),
  );
  // A second learner with two items only (not enough evidence)
  ["g35-r1", "g35-r2"].forEach((itemId, i) =>
    rows.push(
      row({
        learner: FIXTURE_LEARNERS.b,
        sessionId: "s4",
        itemId,
        domain: "Reading",
        klu: "Inform",
        context: "Science",
        t: t0 + 3 * day + i,
      }),
    ),
  );
  return rows.map((r) => ({ ...r, id: `${r.learner}:${r.itemId}:${r.t}` }));
}

/** Runs inside a page on the lab origin: writes the fixtures through the real storage module. */
export async function seedEvidence(page, rows = fixtureRows()) {
  await page.evaluate(async (rows) => {
    const { openStorage } = await import("/access-practice-lab/src/acc/storage/access-db.js");
    const store = await openStorage({ force: true });
    await store._batch(rows.map((value) => ({ store: "passport_progress", op: "put", value })));
  }, rows);
}
