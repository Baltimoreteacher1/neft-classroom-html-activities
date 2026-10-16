/**
 * Balance Builder (/algebra-balance-scale/) driven in a real browser: the turn a
 * student actually takes, the help ladder, the misconception chip, Spanish, the
 * level editor + share code, resume through the shared save engine, phone width and
 * axe. Pure rules are proved in algebra-balance-scale/*.test.mjs; this is the page.
 *
 * Run: npx playwright test tests/balance-builder.spec.ts
 * (PLAYWRIGHT_BASE_URL=http://localhost:PORT to point at a server you started.)
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

const URL = "/algebra-balance-scale/";
const MINUS = "−";

async function open(page: Page) {
  const errors: string[] = [];
  // A source-tree server cannot resolve the bare "web-vitals" import that Vite bundles in
  // dist/ (the nt-web-vitals bundle); nothing in this game loads it.
  page.on("pageerror", (e) => {
    if (!/"web-vitals"/.test(e.message)) errors.push(e.message);
  });
  await page.goto(URL);
  await expect(page.locator("#bb-eq")).toBeVisible();
  return errors;
}

async function move(page: Page, op: string, amount: string) {
  await page.locator(`#bb-ops input[value="${op}"]`).check({ force: true });
  await page.fill("#bb-amount", amount);
  await page.click("#bb-apply");
}

async function write(page: Page, left: string, right: string, rel?: string) {
  await page.fill("#bb-left", left);
  await page.fill("#bb-right", right);
  if (rel) await page.locator(`#bb-rel-options input[value="${rel}"]`).check({ force: true });
  await page.click("#bb-check");
}

test("a one-step puzzle: misstep chip, earned hints, typed results, solved", async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator("#bb-eq")).toHaveAttribute("aria-label", "n plus 9 equals 17");

  // Help is earned: nothing before a try.
  await page.click("#bb-hint");
  await expect(page.locator("#bb-hint-text")).toContainText("Try a move first");

  // Adding 9 to both sides keeps the balance but repeats the operation.
  await move(page, "+", "9");
  await expect(page.locator("#bb-chip")).toHaveText("Did not undo the operation");
  await page.click("#bb-undo");

  await page.click("#bb-hint");
  await expect(page.locator("#bb-hint-text")).toContainText("operation undoes");
  await page.click("#bb-hint");
  await expect(page.locator("#bb-hint-text")).toContainText(
    `Try this move: ${MINUS} 9 on both sides`,
  );

  await move(page, MINUS, "9");
  await expect(page.locator("#bb-working")).toContainText("n + 9 − 9");

  // A number already in the problem is named, and the answer is never printed.
  await write(page, "n", "9");
  await expect(page.locator("#bb-chip")).toHaveText(
    "Answered with a number already in the equation",
  );
  await expect(page.locator("#bb-feedback")).not.toContainText(/\b8\b/);

  await write(page, "n", "8");
  await expect(page.locator("#bb-solved-msg")).toContainText("Solved! n = 8");
  await expect(page.locator(".studio-session")).toContainText("1 / 5 solved");
  await page.click("#bb-next");
  await expect(page.locator("#bb-puzzle-title")).toContainText("Puzzle 2");
  expect(errors).toEqual([]);
});

test("keyboard only: tab to the amount, arrows pick the operation, Enter submits", async ({
  page,
}) => {
  await open(page);
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press("Tab");
    if ((await page.evaluate(() => document.activeElement?.id)) === "bb-amount") break;
  }
  await expect(page.locator("#bb-amount")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Tab");
  await page.keyboard.type("9");
  await page.keyboard.press("Enter");
  await expect(page.locator("#bb-left")).toBeFocused();
  await page.keyboard.type("n");
  await page.keyboard.press("Tab");
  await page.keyboard.type("8");
  await page.keyboard.press("Enter");
  await expect(page.locator("#bb-solved-msg")).toContainText("Solved!");
  await expect(page.locator("#bb-next")).toBeFocused();
});

test("x on both sides: a wrong write-up tips the scale and does not give the answer", async ({
  page,
}) => {
  await open(page);
  await page.click('#bb-levels button[data-level="3"]');
  await move(page, MINUS, "2x");
  await write(page, "x + 12", "x + 21");
  await expect(page.locator("#bb-coach")).toContainText("scale would tip");
  await expect(page.locator("#bb-feedback")).not.toContainText(/x = \d/);
});

test("tilt level: the scale leans, a flipped symbol is named, graph slip is named, then correct", async ({
  page,
}) => {
  await open(page);
  await page.click('#bb-levels button[data-level="4"]');
  await expect(page.locator("#bb-eq")).toHaveAttribute("aria-label", "x plus 9 is greater than 23");
  await page.fill("#bb-test-n", "5");
  await page.click("#bb-test-go");
  await expect(page.locator("#bb-coach")).toContainText("The inequality is false");
  await page.fill("#bb-test-n", "30");
  await page.click("#bb-test-go");
  await expect(page.locator("#bb-coach")).toContainText("The inequality is true");

  await move(page, MINUS, "9");
  await write(page, "x", "14", "<");
  await expect(page.locator("#bb-chip")).toHaveText("Right boundary, symbol reversed");
  await write(page, "x", "14", ">");
  await expect(page.locator("#bb-solved-msg")).toContainText("number line");

  await page.locator('#bb-circle input[value="open"]').check({ force: true });
  await page.locator('#bb-dir input[value="left"]').check({ force: true });
  await page.click("#bb-graph-check");
  await expect(page.locator("#bb-chip")).toHaveText("Graph shaded toward the wrong side");
  await page.locator('#bb-dir input[value="right"]').check({ force: true });
  await page.click("#bb-graph-check");
  await expect(page.locator("#bb-solved-msg")).toContainText("Solved! x > 14");
});

test("Spanish: strings, language attribute, chip and hints", async ({ page }) => {
  await open(page);
  await page.click("#bb-lang");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await expect(page.locator("#bb-title")).toHaveText("Constructor de balanzas");
  await move(page, "+", "9");
  await expect(page.locator("#bb-chip")).toHaveText("No deshizo la operación");
  await page.click("#bb-undo");
  await page.click("#bb-hint");
  await expect(page.locator("#bb-hint-text")).toContainText("Mira el lado que tiene n");
  await page.click("#bb-lang");
  await expect(page.locator("#bb-title")).toHaveText("Balance Builder");
});

test("level editor: validator says yes or no, the maker solves it, a friend plays the code", async ({
  browser,
  page,
}) => {
  await open(page);
  await page.click("#bb-levels .bb-level:last-child");
  await page.fill("#ed-la", "3");
  await page.fill("#ed-lb", "0");
  await page.fill("#ed-ra", "0");
  await page.fill("#ed-rb", "10");
  await expect(page.locator("#ed-verdict")).toContainText("not be a whole number");
  await expect(page.locator("#ed-solve")).toBeDisabled();
  await page.fill("#ed-lb", "2");
  await page.fill("#ed-ra", "1");
  await expect(page.locator("#ed-verdict")).toContainText("exactly one whole-number answer");
  await expect(page.locator("#ed-verdict")).not.toContainText(/\b4\b/);
  await page.click("#ed-solve");
  await move(page, MINUS, "x");
  await write(page, "2x + 2", "10");
  await move(page, MINUS, "2");
  await write(page, "2x", "8");
  await move(page, "÷", "2");
  await write(page, "x", "4");
  await page.click("#bb-save");
  const code = ((await page.locator("#ed-new-code").textContent()) ?? "").trim();
  expect(code).toMatch(/^[0-9A-Z]{3}-[0-9A-Z]{3}-[0-9A-Z]{3}$/);

  const friend = await (await browser.newContext()).newPage();
  await open(friend);
  await friend.click("#bb-levels .bb-level:last-child");
  await friend.fill("#ed-code", "ZZZ-ZZZ-ZZZ");
  await friend.click("#ed-friend button[type=submit]");
  await expect(friend.locator("#ed-code-error")).not.toBeEmpty();
  await friend.fill("#ed-code", code.toLowerCase());
  await friend.click("#ed-friend button[type=submit]");
  await expect(friend.locator("#bb-eq")).toHaveAttribute(
    "aria-label",
    "3x plus 2 equals x plus 10",
  );
  await expect(friend.locator("#bb-save")).toBeHidden();
});

test("save/resume: the shared engine brings the board back after a reload", async ({ page }) => {
  await open(page);
  await page.evaluate(() => (window as any).NeftSaveResume.startNew("QA", "6th"));
  await page.click('#bb-levels button[data-level="2"]');
  const start = await page.locator("#bb-eq").getAttribute("aria-label");
  await move(page, MINUS, "12");
  await write(page, "6y", "60");
  const moved = await page.locator("#bb-eq").getAttribute("aria-label");
  expect(moved).not.toBe(start);
  await page.evaluate(() => (window as any).NeftSaveResume.save("spec"));
  await page.reload();
  await expect(page.locator("#bb-eq")).toHaveAttribute("aria-label", moved ?? "");
  await expect(page.locator("#bb-puzzle-title")).toContainText("Two steps");
  await expect(page.locator("#bb-history")).toContainText("6y = 60");
  for (const id of ["bb-amount", "bb-left", "bb-right"]) {
    await expect(page.locator(`#${id}`)).toHaveValue("");
  }
});

test("phone width: no sideways scroll in play or build, EN or ES", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  for (const lang of ["en", "es"]) {
    for (const target of ['#bb-levels button[data-level="3"]', "#bb-levels .bb-level:last-child"]) {
      await page.click(target);
      const [scroll, inner] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        innerWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(inner);
    }
    if (lang === "en") await page.click("#bb-lang");
  }
});

test("touch targets are at least 44px", async ({ page }) => {
  await open(page);
  for (const sel of [
    "#bb-apply",
    "#bb-hint",
    "#bb-undo",
    "#bb-reset",
    "#bb-amount",
    "#bb-lang",
    "#bb-ops .bb-op > span",
  ]) {
    for (const el of await page.locator(sel).all()) {
      const box = await el.boundingBox();
      expect(box?.height ?? 0, sel).toBeGreaterThanOrEqual(44);
    }
  }
});

test("axe finds no WCAG A/AA violation on play or build, EN or ES", async ({ page }) => {
  await open(page);
  for (const lang of ["en", "es"]) {
    for (const target of ['#bb-levels button[data-level="1"]', "#bb-levels .bb-level:last-child"]) {
      await page.click(target);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => v.id),
        `${lang} ${target}`,
      ).toEqual([]);
    }
    if (lang === "en") await page.click("#bb-lang");
  }
});
