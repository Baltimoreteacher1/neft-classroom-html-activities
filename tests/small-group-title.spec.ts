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
  test("support groups are named by purpose, not by group number", async ({ page }) => {
    await openLesson(page, "5-3-group1");
    const h1 = await page.locator("h1").first().innerText();
    expect(h1).toContain("Foundations");
    expect(h1).not.toMatch(/Group\s*1/i);
  });

  test("challenge groups are named by purpose, not by group number", async ({ page }) => {
    await openLesson(page, "5-3-group2");
    const h1 = await page.locator("h1").first().innerText();
    expect(h1).toContain("Challenge");
    expect(h1).not.toMatch(/Group\s*2/i);
  });

  test("the headline agrees with the badge above it", async ({ page }) => {
    for (const id of ["5-3-group1", "5-3-group2"]) {
      await openLesson(page, id);
      const badge = (await page.locator(".sg-kicker").first().innerText()).trim();
      const purpose = badge.split("·").pop()?.trim() ?? "";
      expect(purpose.length).toBeGreaterThan(0);
      // Case-insensitive: the badge is uppercased by CSS, the headline is not.
      expect((await page.locator("h1").first().innerText()).toLowerCase()).toContain(
        purpose.toLowerCase(),
      );
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
