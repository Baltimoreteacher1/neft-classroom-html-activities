import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Empty public sessions; navigation checks do not request classroom records.
test.beforeEach(async ({ context }) => {
  // Production has no Vite client. Disable only the development reload channel
  // when this suite is run against a working tree with concurrent authoring.
  await context.route("**/@vite/client", (route) => route.fulfill({
    contentType: "text/javascript", body: "",
  }));
  await context.route("**/api/**", (route) => route.fulfill({
    status: 401, contentType: "application/json", body: "{}",
  }));
});

test("an exact group deep link survives metadata refresh and reload", async ({ page }) => {
  await page.goto("/curriculum/units/?u=2&l=2-2-group1&supports=tts");
  const primary = page.locator("#unit-2 .units-open-lesson");
  await expect(primary).toHaveAttribute("href", "/lessons/2-2-group1/?student=1&supports=tts");
  await page.evaluate(() => (window as any).CurriculumHub.renderHub());
  await expect(page.locator("#units-browser-select")).toHaveValue("2");
  await expect(primary).toHaveAttribute("href", "/lessons/2-2-group1/?student=1&supports=tts");
  await page.reload();
  await expect(primary).toHaveAttribute("href", "/lessons/2-2-group1/?student=1&supports=tts");
  await expect(page.locator('#unit-2 [data-pathway="2-2-group1"]')).toHaveAttribute("aria-pressed", "true");
});

test("each focus unit offers its exact lesson, support, and challenge routes", async ({ page }) => {
  await page.goto("/curriculum/units/?u=2&l=2-1&supports=tts,calculator");
  for (let unit = 2; unit <= 9; unit++) {
    await page.locator("#units-browser-select").selectOption(String(unit));
    const card = page.locator(`#unit-${unit}`);
    const first = `${unit}-1`;
    for (const suffix of ["-group1", "-group2", ""]) {
      const id = first + suffix;
      const pathway = card.locator(`[data-pathway="${id}"]`);
      await pathway.click();
      await expect(pathway).toHaveAttribute("aria-pressed", "true");
      await expect(card.locator('.units-lesson-pathways [aria-pressed="true"]')).toHaveCount(1);
      await expect(card.locator(".units-open-lesson")).toHaveAttribute(
        "href", `/lessons/${id}/?student=1&supports=tts%2Ccalculator`,
      );
      // Units 7 and 9 expose their main worksheet through Part 2.
      const practiceId = !suffix && [7, 9].includes(unit) ? `${id}-part2` : id;
      await expect(card.getByRole("link", { name: "Practice", exact: true })).toHaveAttribute(
        "href", `/lessons/${practiceId}/worksheet.html?student=1&supports=tts%2Ccalculator`,
      );
      await expect(page).toHaveURL(new RegExp(`l=${id}(?:&|#|$)`));
      // Visible selection and the existing canonical select stay in agreement.
      await expect.poll(() => card.locator(".lesson-select").evaluate((node: HTMLSelectElement, unitNumber) =>
        (window as any).CurriculumHub.unitsData.find((entry: any) => entry.unitIndex === unitNumber)?.lessons[node.selectedIndex]?.lessonId,
      unit)).toBe(id);
    }
  }
});

test("keyboard pathway choice retains support on next lesson and restores history", async ({ page }) => {
  await page.goto("/curriculum/units/?u=6&l=6-1");
  const support = page.locator('#unit-6 [data-pathway="6-1-group1"]');
  await support.focus();
  await page.keyboard.press("Enter");
  await expect(support).toBeFocused();
  await expect(support).toHaveAttribute("aria-pressed", "true");
  await page.locator('#unit-6 .units-lesson-paging button').last().click();
  await expect(page.locator('#unit-6 .units-open-lesson')).toHaveAttribute("href", "/lessons/6-2-group1/?student=1");
  await expect(page.locator('#unit-6 [data-pathway="6-2-group1"]')).toHaveAttribute("aria-pressed", "true");
  await page.goBack();
  await expect(page.locator('#unit-6 .units-open-lesson')).toHaveAttribute("href", "/lessons/6-1-group1/?student=1");
  await page.goBack();
  await expect(page.locator('#unit-6 .units-open-lesson')).toHaveAttribute("href", "/lessons/6-1/?student=1");
});

test("search opens exact pathway choices, keeps focus after refresh, and restores query", async ({ page }) => {
  await page.goto("/curriculum/units/?u=3&l=3-2&supports=tts");
  await page.locator("#curr-search").fill("histogram");
  const result = page.locator('.search-result-item[data-lesson-id="2-2-group1"]');
  await expect(result.locator('.units-result-actions a').first()).toHaveAttribute("href", "/lessons/2-2-group1/?student=1&supports=tts");
  const choices = result.getByRole("link", { name: /^Lesson and support choices:/ });
  await choices.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator('#unit-2 [data-pathway="2-2-group1"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('#unit-2 .units-lesson-heading')).toBeFocused();
  // Reproduce late metadata and input-debounce repaint without a fixed sleep.
  await page.evaluate(() => (window as any).CurriculumHub.renderHub());
  await expect(page.locator('#unit-2 .units-lesson-heading')).toBeFocused();
  await page.goBack();
  await expect(page.locator("#curr-search")).toHaveValue("histogram");
  await expect(result).toBeVisible();
  await expect(page.locator('#curr-search-clear')).toBeVisible();
});

test("resource filter works with result shortcuts and empty-state recovery", async ({ page }) => {
  await page.goto("/curriculum/units/?u=9&l=9-1");
  await page.locator(".units-refine > summary").click();
  await page.locator('.hub-filter-chip[data-filter="notes"]').click();
  await expect(page.locator(".units-result-actions").first()).toBeVisible();
  // A notes-only result must not invent an interactive resource.
  await expect(page.getByRole("link", { name: /^Open lesson:/ })).toHaveCount(0);
  await page.locator("#curr-search").fill("no-such-math-topic-987654");
  await expect(page.locator(".hub-clear-filters")).toBeVisible();
  await page.locator(".hub-clear-filters").click();
  await expect(page.locator("#curr-search")).toBeFocused();
  await expect(page.locator("#curr-search")).toHaveValue("");
  await expect(page.locator("#unit-9 .units-lesson-pathways")).toBeVisible();
});

for (const width of [320, 768, 1440]) {
  test(`lesson pathways and results are accessible without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/curriculum/units/?u=7&l=7-4");
    await expect(page.locator("#unit-7 .units-lesson-pathways")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    let audit = await new AxeBuilder({ page }).include(".units-lesson-pathways").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(audit.violations).toEqual([]);
    await page.locator("#curr-search").fill("coordinate");
    await expect(page.locator(".units-result-actions").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    audit = await new AxeBuilder({ page }).include(".units-results-grid").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(audit.violations).toEqual([]);
  });
}

test("current unit recommendations use the remapped lesson topics and projects", async ({ page }) => {
  await page.goto("/curriculum/units/?u=2&l=2-1");
  await expect(page.locator('#unit-2 .lesson-real-world')).toContainText("soccer team");
  await expect(page.locator('#unit-2 .lesson-info')).not.toContainText("Fraction Division Soccer");
  await expect(page.locator('#unit-2 .lesson-info')).not.toContainText("crime scene tape");
  for (const [unit, path] of [[2, "/math/statistics/projects/"], [7, "/math/unit-7/projects/"], [8, "/math/unit-8/projects/"], [9, "/math/unit-9/projects/"]] as const) {
    await page.locator("#units-browser-select").selectOption(String(unit));
    await page.locator(`#unit-${unit} .units-resource-drawer > summary`).click();
    await expect(page.locator(`#unit-${unit} .unit-resources-row > a[href="${path}"]`).first()).toBeVisible();
  }
  await page.locator("#units-browser-select").selectOption("2");
  await expect(page.locator("#unit-2 .unit-resources-row > a.hub-teacher-only").first()).toBeHidden();
  await page.locator("#curr-search").fill("histogram");
  await expect(page.locator('.search-result-item[data-lesson-id="2-2"]')).toBeVisible();
  await expect(page.locator('.search-result-item[data-lesson-id="8-6"]')).toHaveCount(0);
  await expect(page.locator('.search-result-item[data-lesson-id="8-6-group1"]')).toHaveCount(0);
  await expect(page.locator('.search-result-item[data-lesson-id="8-6-group2"]')).toHaveCount(0);
});
