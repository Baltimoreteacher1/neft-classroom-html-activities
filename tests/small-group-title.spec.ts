/**
 * The small-group headline a STUDENT reads.
 *
 * The page used to show a badge reading "SMALL GROUP · FOUNDATIONS" with
 * "5.3 Small Group · Group 1" as the headline directly beneath it — the same
 * lesson naming itself two ways in adjacent lines, with the louder one being an
 * ability label students have no reason to see.
 *
 * Asserted in a real browser because the fix is in the renderer, not the data:
 * `config.title` deliberately still says "Group 1" (the playlist builder, the
 * Canvas library, the registry and the search index all carry that string), so
 * reading the config would prove nothing about what a student sees.
 */
import { expect, test } from "@playwright/test";

async function openLesson(page: import("@playwright/test").Page, id: string) {
  await page.goto(`/lessons/${id}/`);
  const name = page.locator('input[type="text"]').first();
  if (await name.count()) await name.fill("Sam");
  const go = page
    .locator('button:has-text("Start"), button:has-text("Begin"), button[type="submit"]')
    .first();
  if (await go.count()) await go.click().catch(() => {});
  await expect(page.locator("h1").first()).toBeVisible();
}

test.describe("small-group student headline", () => {
  // The headline names the MATHEMATICS — small-group review item #28, approved
  // by Joel 2026-10-04 ("Do all of these"). The purpose word lives in the badge
  // directly above it.
  test("the headline names the lesson topic, never a group number", async ({ page }) => {
    for (const [id, n] of [
      ["5-3-group1", 1],
      ["5-3-group2", 2],
    ] as const) {
      await openLesson(page, id);
      const h1 = await page.locator("h1").first().innerText();
      expect(h1).toContain("5.3");
      expect(h1).toContain("Trapezoids");
      expect(h1).not.toMatch(new RegExp(`Group\\s*${n}`, "i"));
    }
  });

  test("the badge above the headline carries the purpose", async ({ page }) => {
    for (const [id, purpose] of [
      ["5-3-group1", "foundations"],
      ["5-3-group2", "challenge"],
    ] as const) {
      await openLesson(page, id);
      const badge = (await page.locator(".sg-kicker").first().innerText()).toLowerCase();
      expect(badge).toContain(purpose);
    }
  });

  test("the catalog identity is deliberately left alone", async ({ page }) => {
    // Changing config.title would ripple into ten generated manifests, so the
    // fix is presentation-only. If someone later rewrites the data instead,
    // this fails and points them back at the reason.
    const config = await page.request.get("/lessons/5-3-group1/config.json");
    expect(config.ok()).toBeTruthy();
    expect((await config.json()).title).toMatch(/Group 1/);
  });
});
