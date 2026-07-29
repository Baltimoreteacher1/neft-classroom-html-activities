import { expect, test } from "@playwright/test";

/**
 * Regression guard for the score bridge's destination and contract.
 *
 * assets/edupulse-bridge.js used to POST to a separate Cloudflare Worker with an
 * x-ingest-key. That Worker's secret and the key shipped in the site had drifted
 * apart, so every write 401'd and 37 graded activities recorded nothing for
 * weeks — invisible, because a silent write failure and an unused feature look
 * identical from the outside. The bridge now writes to the same-origin
 * /api/scores (the classroom D1 `game_scores`).
 *
 * These tests pin the three things that made the failure possible or costly:
 * WHERE it posts, WHAT SHAPE it posts, and that a resubmit does not duplicate.
 */

const SILENT_GAME = "/math/games/u1-factor-frenzy/";

type Post = { url: string; body: Record<string, unknown> };

async function captureScorePosts(page: import("@playwright/test").Page, posts: Post[]) {
  await page.route("**/api/scores", async (route) => {
    posts.push({ url: route.request().url(), body: route.request().postDataJSON() });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"ok":true}',
    });
  });
}

const SCORE = {
  activityId: "u1-factor-frenzy",
  activityTitle: "Factor Frenzy",
  standard: "6.NS.B.4",
  score: 8,
  maxScore: 10,
  problemsCorrect: 6,
  problemsAttempted: 10,
  misconceptions: ["gcf-vs-lcm"],
  durationSec: 42,
};

test("posts a classroom-shaped score to same-origin /api/scores", async ({ page }) => {
  const posts: Post[] = [];
  await captureScorePosts(page, posts);

  await page.goto(SILENT_GAME);
  await page.waitForFunction(
    () => Boolean((window as never as { EduPulse?: unknown }).EduPulse),
    null,
    {
      timeout: 15_000,
    },
  );
  await page.evaluate(
    (s) => (window as never as { EduPulse: { record: (x: unknown) => void } }).EduPulse.record(s),
    SCORE,
  );
  await page.waitForTimeout(1500);

  expect(posts).toHaveLength(1);
  const body = posts[0].body;

  // Destination: same-origin, no cross-origin Worker, no key header.
  expect(posts[0].url).toContain("/api/scores");
  expect(posts[0].url).not.toContain("workers.dev");

  expect(body.gameId).toBe("u1-factor-frenzy");
  expect(body.standard).toBe("6.NS.B.4");
  expect(body.points).toBe(8);
  expect(body.correct).toBe(6);
  // `total` is ATTEMPTS. Mapping maxScore here instead would record 8/10 for a
  // student who answered 6 of 10 — the exact column confusion this table has
  // suffered before.
  expect(body.total).toBe(10);
  expect(body.misconceptionTag).toBe("gcf-vs-lcm");

  // No student identity may cross the wire: game_scores has no name column.
  expect(JSON.stringify(body)).not.toMatch(/studentName|studentId|classPeriod/);
});

test("an identical resubmit after a reload does not duplicate the row", async ({ page }) => {
  const posts: Post[] = [];
  await captureScorePosts(page, posts);

  await page.goto(SILENT_GAME);
  await page.waitForFunction(
    () => Boolean((window as never as { EduPulse?: unknown }).EduPulse),
    null,
    {
      timeout: 15_000,
    },
  );
  await page.evaluate(
    (s) => (window as never as { EduPulse: { record: (x: unknown) => void } }).EduPulse.record(s),
    SCORE,
  );
  await page.waitForTimeout(1200);
  expect(posts).toHaveLength(1);

  // Reload clears the in-memory guard. The old Worker caught this server-side
  // with INSERT OR IGNORE; /api/scores does a plain INSERT, so the persisted
  // client-side guard is now the only thing standing between a student
  // refreshing their results page and a double-counted attempt.
  await page.reload();
  await page.waitForFunction(
    () => Boolean((window as never as { EduPulse?: unknown }).EduPulse),
    null,
    {
      timeout: 15_000,
    },
  );
  await page.evaluate(
    (s) => (window as never as { EduPulse: { record: (x: unknown) => void } }).EduPulse.record(s),
    SCORE,
  );
  await page.waitForTimeout(1200);

  expect(posts, "the same score submitted twice on the same day must record once").toHaveLength(1);
});
