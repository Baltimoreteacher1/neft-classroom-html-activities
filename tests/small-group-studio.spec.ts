import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.describe("small-group guided math studio", () => {
  test("Group 1 uses a mission, language lab, team talk, and retry-first practice", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");
    await expect(page.getByRole("heading", { name: "Launch the mission" })).toBeVisible();
    await expect(page.getByText(/Engineers on Station Helios/)).toBeVisible();

    await page.getByRole("button", { name: "I can try with support" }).first().click();
    await page.getByRole("button", { name: "Build it together →" }).click();
    await expect(page.locator('.sg-step').first()).toHaveClass(/done/);

    const match = page.locator(".sg-match");
    await expect(match.getByText("A number bigger than 1 that you can only divide by 1 and itself.")).toBeVisible();
    await match.getByRole("button", { name: "Prime number", exact: true }).click();
    await expect(match.getByText(/1 of 4 unlocked/)).toBeVisible();

    await expect(page.getByRole("heading", { name: "Talk the math through" })).toBeVisible();
    await expect(page.getByText(/Solver: explain one step/)).toBeVisible();
    await page.getByRole("button", { name: "Start talk timer" }).click();
    await expect(page.getByRole("timer")).not.toHaveText("1:00");

    const firstProblem = page.locator(".prob").filter({ hasText: "Which of the following is a prime number?" });
    await firstProblem.getByRole("button", { name: /15/ }).click();
    await expect(firstProblem.getByText(/does not fit yet/)).toBeVisible();
    await expect(firstProblem.getByRole("button", { name: /17/ })).not.toHaveClass(/correct/);
    await firstProblem.getByRole("button", { name: /17/ }).click();
    await expect(firstProblem.getByText(/Your reasoning landed/)).toBeVisible();

    await expect(page.locator("#app").getByText(/Show a model answer|^Answer:/i)).toHaveCount(0);
  });

  test("Group 2 is a distinct challenge experience and keeps teacher guidance private", async ({ page }) => {
    await page.goto("/lessons/7-2-group2/");
    await expect(page.getByText("Challenge briefing")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Defend it to a skeptic" })).toBeVisible();
    await expect(page.getByText(/Conjecturer: make the claim/)).toBeVisible();
    await expect(page.getByText(/Teacher studio guide|Listen for during team talk/)).toHaveCount(0);

    await page.setViewportSize({ width: 390, height: 844 });
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
    await expect(page.locator("body")).toHaveCSS("font-size", "16px");
  });

  test("teacher mode exposes facilitation and listen-for guidance", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("nt-teacher-mode", "1"));
    await page.goto("/lessons/7-2-group2/");
    const guide = page.getByText(/Teacher studio guide/);
    await expect(guide).toBeVisible();
    await guide.click();
    await expect(page.getByText(/Listen for during team talk/)).toBeVisible();
    await expect(page.getByRole("link", { name: "← Curriculum" })).toBeVisible();
  });

  test("curriculum keeps each small-group pair directly below its main lesson", async ({ page }) => {
    await page.goto("/curriculum/");
    const order = await page.evaluate(() =>
      [...document.querySelectorAll("details.lesson")].map((lesson) => ({
        text: lesson.querySelector("summary")?.textContent?.replace(/\s+/g, " ").trim() || "",
        hrefs: [...lesson.querySelectorAll<HTMLAnchorElement>("a[href]")].map((link) => link.getAttribute("href") || ""),
      })),
    );
    const parent = order.findIndex((item) => item.hrefs.includes("/lessons/1-1/"));
    expect(parent).toBeGreaterThanOrEqual(0);
    expect(order[parent + 1].hrefs).toContain("/lessons/1-1-group1/");
    expect(order[parent + 1].text).toContain("1.1 Small Group: Group 1");
    expect(order[parent + 2].hrefs).toContain("/lessons/1-1-group2/");
    expect(order[parent + 2].text).toContain("1.1 Small Group: Group 2");
  });

  test("visible lesson dropdowns place small groups directly after their main lesson", async ({ page }) => {
    await page.goto("/curriculum/");
    const dropdowns = page.locator(".lesson-select");
    await expect(dropdowns).toHaveCount(10);

    function expectGuidedGroupsAfterMain(labels: string[]) {
      const mainLessons = labels.filter((label) => /^Lesson \d+-\d+ ·/.test(label));

      for (const mainLesson of mainLessons) {
        const lessonId = mainLesson.match(/^Lesson (\d+)-(\d+) ·/)?.slice(1).join(".");
        expect(lessonId, mainLesson).toBeTruthy();
        const parent = labels.indexOf(mainLesson);
        expect(labels[parent + 1], `${lessonId} Group 1 position`).toContain(
          `${lessonId} Small Group: Group 1`,
        );
        expect(labels[parent + 2], `${lessonId} Group 2 position`).toContain(
          `${lessonId} Small Group: Group 2`,
        );
      }
    }

    for (let dropdownIndex = 0; dropdownIndex < 10; dropdownIndex += 1) {
      const labels = await dropdowns.nth(dropdownIndex).locator("option").allTextContents();
      expectGuidedGroupsAfterMain(labels);
    }

    const topPicker = page.locator(".top1-picker").first();
    const topUnit = topPicker.locator("select").nth(1);
    const topLesson = topPicker.locator("select").nth(2);
    for (let unitIndex = 0; unitIndex < 10; unitIndex += 1) {
      await topUnit.selectOption(String(unitIndex));
      expectGuidedGroupsAfterMain(await topLesson.locator("option").allTextContents());
    }
  });

  test("student studio has no serious or critical accessibility violations", async ({ page }) => {
    await page.goto("/lessons/1-1-group1/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter((violation) =>
      violation.impact === "serious" || violation.impact === "critical",
    );
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  });
});
