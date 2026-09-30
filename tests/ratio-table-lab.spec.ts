import { expect, test } from "@playwright/test";

const labPath = "/curriculum/learning-labs/ratio-table-lab/";

test("Lesson 3.4 has a separate lab button that opens the approved activity", async ({ page }) => {
  await page.goto("/curriculum/?lesson=3-4");
  const lab = page.locator("#nav-preview").getByRole("link", { name: "Ratio Table Lab · Section 1", exact: true });
  await expect(lab).toBeVisible();
  await expect(lab).toHaveAttribute("href", labPath + "?student=1");
  await expect(page.locator("#nav-preview").getByRole("link", { name: "Open student lesson", exact: true })).toHaveAttribute("href", /\/curriculum\/student-launch\/\?lesson=3-4$/);
  await page.screenshot({ path: "output/ratio34-curriculum.png", fullPage: false });
  await lab.click();
  await expect(page).toHaveURL(new RegExp(labPath + "\\?student=1$"));
  await expect(page.getByRole("heading", { name: "Ratio table lab", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add a bag", exact: true }).click();
  await expect(page.getByRole("table")).toContainText("12");
  await page.reload();
  await expect(page.getByRole("table")).toContainText("12");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "output/ratio34-lab-mobile.png", fullPage: true });
  await page.goto("/curriculum/?lesson=3-3");
  await expect(page.locator("#nav-lesson-title")).toContainText("Equivalent");
  await expect(page.locator("#nav-preview").getByRole("link", { name: "Ratio Table Lab · Section 1", exact: true })).toHaveCount(0);
});

test("the unit listing also keeps the lab within Lesson 3.4", async ({ page }) => {
  await page.goto("/curriculum/units/");
  const entry = page.locator('details.lesson[data-search^="3-4 determine"]');
  await expect(entry.locator('a[href="' + labPath + '"]')).toHaveCount(1);
  await expect(entry.locator('a[href="/lessons/3-4/"]')).toHaveCount(1);
});
