/**
 * Teacher/Student mode chip on project pages.
 *
 * Before this layer, `nt-teacher-mode` was READ by four project layers and
 * WRITABLE by none of them: a teacher who turned teacher mode on in a lesson
 * and then opened a project had no way back to the student view without
 * navigating away. The property that actually matters is therefore the round
 * trip, and specifically that LEAVING never asks for a password — so this spec
 * drives the real DOM rather than asserting the chip merely exists.
 */
import { expect, test } from "@playwright/test";

const PROJECT = "/math/unit-1/projects/version-a/";
const PIN = "BlueHeron2026"; // keep in sync with shared/projects/projects-mode-pill.js

/**
 * Open a project the way a person does: the support-level gate
 * (#gold-level-overlay, projects-gold.js) covers the page until a level is
 * chosen, and the chip deliberately stands down until then. Every test needs
 * the page in its post-gate state, so dismissing it is part of "goto".
 */
async function openProject(page: import("@playwright/test").Page) {
  await page.goto(PROJECT);
  const gate = page.locator("#gold-level-overlay");
  if (await gate.isVisible().catch(() => false)) {
    await gate.locator("button").first().click();
    await expect(gate).toHaveCount(0);
  }
  await expect(page.locator(".ntmp")).toBeVisible();
}

test.describe("projects teacher/student mode chip", () => {
  test("defaults to student, and shows no way in without the password", async ({ page }) => {
    await openProject(page);
    const chip = page.locator(".ntmp-chip");
    await expect(chip).toBeVisible();
    await expect(chip).not.toHaveClass(/is-teacher/);
    // No exit control while already in student mode.
    await expect(page.locator(".ntmp-exit")).toHaveCount(0);
  });

  test("a wrong password does not grant teacher mode", async ({ page }) => {
    await openProject(page);
    await page.locator(".ntmp-chip").click();
    await page.locator('.ntmp-form input[type="password"]').fill("not-the-pin");
    await page.locator(".ntmp-form button").click();
    await expect(page.locator(".ntmp-err")).toHaveText(/nope/i);
    expect(await page.evaluate(() => localStorage.getItem("nt-teacher-mode"))).not.toBe("1");
  });

  test("round trip: student -> teacher (password) -> student (one click, no password)", async ({
    page,
  }) => {
    await openProject(page);

    // In.
    await page.locator(".ntmp-chip").click();
    await page.locator('.ntmp-form input[type="password"]').fill(PIN);
    await page.locator(".ntmp-form button").click();
    await page.waitForLoadState("load");
    await expect(page.locator(".ntmp-chip.is-teacher")).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("nt-teacher-mode"))).toBe("1");

    // Out — the whole point. One click, no credential form anywhere.
    const exit = page.locator(".ntmp-exit");
    await expect(exit).toBeVisible();
    await exit.click();
    await page.waitForLoadState("load");
    await expect(page.locator(".ntmp-chip.is-teacher")).toHaveCount(0);
    await expect(page.locator('.ntmp-form input[type="password"]')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("nt-teacher-mode"))).toBe("0");
  });

  test("teacher mode set elsewhere (a lesson) is exitable from a project page", async ({
    page,
  }) => {
    // Exactly the trap this layer exists to fix: the mode arrives from another
    // surface, so the project page must offer the way out on first paint.
    await openProject(page);
    await page.evaluate(() => localStorage.setItem("nt-teacher-mode", "1"));
    await page.reload();
    // The level choice is remembered, so the gate does not return.
    await expect(page.locator(".ntmp-exit")).toBeVisible();
    await page.locator(".ntmp-exit").click();
    await page.waitForLoadState("load");
    expect(await page.evaluate(() => localStorage.getItem("nt-teacher-mode"))).toBe("0");
  });

  test("the PIN field is a real credential field so managers can autofill it", async ({ page }) => {
    await openProject(page);
    await page.locator(".ntmp-chip").click();
    const pin = page.locator('.ntmp-form input[type="password"]');
    await expect(pin).toHaveAttribute("autocomplete", "current-password");
    // The username peer must exist and must NOT be display:none — password
    // managers skip those. Hidden via clip, per .ntmp-cred-user.
    const user = page.locator(".ntmp-cred-user");
    await expect(user).toHaveCount(1);
    expect(await user.evaluate((el) => getComputedStyle(el).display)).not.toBe("none");
  });
});
