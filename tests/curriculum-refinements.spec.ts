import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  // Fresh public UI only; no classroom records are requested by these journeys.
  await context.route("**/api/**", route => route.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
});

test("mobile reading supports stay in the header and return focus on Escape", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 850 });
  await page.goto("/curriculum/");
  const launcher = page.getByRole("button", { name: "Reading supports", exact: true });
  await expect(launcher).toBeVisible();
  expect(await launcher.evaluate(node => getComputedStyle(node).position)).toBe("static");
  await launcher.click();
  await expect(page.locator("#udlMenuPopover")).toBeVisible();
  await expect(page.locator("#chkDyslexiaFont")).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const audit = await new AxeBuilder({ page }).include(".hub-reading-control").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(audit.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(page.locator("#udlMenuPopover")).toBeHidden();
  await expect(launcher).toBeFocused();
});


test("a shared lesson carries supports to optional resources and the final check", async ({ page }) => {
  await page.goto("/curriculum/student-launch/?lesson=3-2&supports=tts,calculator");
  await expect(page.locator("#lesson-view")).toBeVisible();
  await page.getByText("Choose practice", { exact: false }).click();
  await page.getByText("Explore & apply", { exact: false }).click();
  const paths = await page.locator("#resource-links a").evaluateAll(links => links.map(node => (node as HTMLAnchorElement).href));
  expect(paths.some(path => path.includes("worksheet-level-0.html"))).toBe(true);
  expect(paths.some(path => path.includes("/curriculum/learning-labs/"))).toBe(true);
  expect(paths.some(path => path.includes("readiness/"))).toBe(true);
  expect(paths.some(path => path.endsWith("#reflect"))).toBe(true);
  for (const path of paths) {
    const url = new URL(path);
    expect(url.searchParams.get("student")).toBe("1");
    expect(url.searchParams.get("supports")).toBe("tts,calculator");
  }
});

test("unit Copy link preserves the exact group lesson", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { value: { writeText: async (value: string) => { (window as any).__copiedLessonLink = value; } } });
  });
  await page.goto("/curriculum/units/?u=3&l=3-2-group1");
  await expect(page.locator("#units-browser-select")).toHaveValue("3");
  const card = page.locator("#unit-3");
  await expect(card.locator(".lesson-select option:checked")).toContainText("3.2");
  await card.locator(".lesson-copy-link:not(.lesson-student-launch-copy)").click();
  const copied = await page.evaluate(() => (window as any).__copiedLessonLink);
  const url = new URL(copied);
  expect(url.pathname).toBe("/curriculum/units/");
  expect(url.searchParams.get("l")).toBe("3-2-group1");
  await page.goto(url.pathname + url.search);
  await expect(page.locator("#unit-3 .lesson-select option:checked")).toContainText("3.2");
  expect(await page.locator("#unit-3 .lesson-select").evaluate((node: HTMLSelectElement) => node.selectedOptions[0].textContent)).toMatch(/Group 1/i);
});
