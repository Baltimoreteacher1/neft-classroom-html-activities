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
  await expect(page.getByRole("heading", { name: "One relationship, three views." })).toBeVisible();
  await page.getByRole("button", { name: "Explore", exact: true }).click();
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

test("the lab teaches, graphs, and compares equivalent ratios", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(labPath);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator("#steps .step-link")).toHaveCount(8);

  // Learn: the additive distractor is named, the equivalent ratio is accepted.
  await page.getByLabel("7 bags : 12 balls").check();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.locator("#feedback")).toContainText("Adding 6 to both numbers");
  await page.getByLabel("3 bags : 18 balls").check();
  await page.getByRole("button", { name: "Check my answer" }).click();
  await expect(page.locator("#feedback")).toContainText("6 balls per bag");

  // Graph: plot by click and by keyboard, then read the line.
  await page.getByRole("button", { name: "Graph", exact: true }).click();
  const hit = (x: number, y: number) => page.locator(`#plot-board .hit[data-x="${x}"][data-y="${y}"]`);
  await hit(3, 12).click();
  await expect(page.locator("#feedback")).toContainText("3 bags hold 18 balls");
  for (const [x, y] of [[1, 6], [2, 12], [3, 18]]) await hit(x, y).click();
  await page.locator("#plot-board").focus();
  for (const key of ["ArrowRight", "ArrowRight", "ArrowUp", "ArrowUp", "Enter"]) await page.keyboard.press(key);
  await page.getByRole("button", { name: "Connect the points" }).click();
  await page.getByLabel("At (0, 0), the origin").check();
  await page.getByRole("button", { name: "Check where it starts" }).click();
  await page.getByLabel("Soccer balls for 4 bags, read from the line").fill("24");
  await page.getByRole("button", { name: "Check my reading" }).click();
  await page.getByLabel("(1, 6)").check();
  await page.getByRole("button", { name: "Check the point" }).click();
  await expect(page.getByRole("heading", { name: "Equivalent ratios make a line." })).toBeVisible();

  // Compare: a non-proportional table is recognised as not equivalent.
  await page.getByRole("button", { name: "Go to Compare" }).click();
  await page.locator("#verdict-gold-yes").click();
  await expect(page.locator("#feedback")).toContainText("different amounts per bag");
  await page.locator("#verdict-gold-no").click();
  await expect(page.locator("#feedback")).toContainText("not equivalent");
  expect(errors).toEqual([]);
});
