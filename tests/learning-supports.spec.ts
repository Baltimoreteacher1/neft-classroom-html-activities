import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const UNIT_SAMPLES = ["1-1", "2-1", "3-1", "4-1", "5-1", "6-1", "7-1", "8-1", "9-1", "10-1"];

test("all unit samples retain their original lesson and mount optional supports", async ({ page }) => {
  for (const lessonId of UNIT_SAMPLES) {
    await page.goto(`/lessons/${lessonId}/`);
    await expect(page.locator("#app")).toBeVisible();
    await expect(page.getByRole("button", { name: "Prepare Supports" })).toBeVisible();
    await expect(page.locator("[data-ewl-supports-tools]")).toBeHidden();
  }
});

test("support profiles are reversible without losing host lesson input", async ({ page }) => {
  await page.goto("/lessons/1-1/");
  const hostInput = page.locator("#app input").first();
  await hostInput.fill("student work stays");
  await page.getByRole("button", { name: "Prepare Supports" }).click();
  await page.getByRole("button", { name: /Read & Understand/ }).click();
  await expect(page.getByRole("navigation", { name: "Learning Tools" })).toBeVisible();
  await page.getByRole("button", { name: "Reset supports" }).click();
  await expect(hostInput).toHaveValue("student work stays");
  await expect(page.getByRole("navigation", { name: "Learning Tools" })).toBeHidden();
});

test("teacher dialog traps focus, closes with Escape, and returns focus", async ({ page }) => {
  await page.goto("/lessons/1-1/");
  const opener = page.getByRole("button", { name: "Prepare Supports" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Prepare Learning Supports" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Reset supports" }).focus();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close Learning Supports" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("support UI has no serious accessibility violations", async ({ page }) => {
  await page.goto("/lessons/1-1/#ewl-supports=read-understand,focus-organize,build-math,express-thinking,language-support");
  await page.getByRole("button", { name: "Prepare Supports" }).click();
  const results = await new AxeBuilder({ page }).include("[data-ewl-supports-root]").analyze();
  const blocking = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
  expect(blocking).toEqual([]);
});

test("missing support script leaves the original lesson operational", async ({ page }) => {
  await page.route("**/assets/learning-supports/learning-supports.js", (route) => route.abort());
  await page.goto("/lessons/1-1/");
  await expect(page.locator("#app")).toBeVisible();
  await expect(page.locator("#app input").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Prepare Supports" })).toHaveCount(0);
});
