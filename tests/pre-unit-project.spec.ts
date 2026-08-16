/**
 * End-to-end flow for the Pre-Unit culminating project —
 * /math/pre-unit/projects/version-a/ ("Launch Day Supply Depot").
 *
 * tests/projects-smoke.spec.ts already gates the whole project fleet for shared
 * layers, a11y invariants and console errors, and the Pre-Unit page is in that
 * fleet. This file covers what a fleet sweep cannot: that the mathematics of
 * THIS project actually works from the student's side — a wrong answer is
 * diagnosed rather than given away, a right answer unlocks the next thing, the
 * three parts hold different work, progress survives a reload, and the partner
 * panel refuses to hand over an answer the student has not earned.
 *
 * The level tier is chosen once, through the GOLD launch overlay, exactly as a
 * student meets it. Level 1 pre-fills the worked numbers (738 riders / 24 seats,
 * $58.50 / $2.25, 12 m of ribbon at 3/4 m, 7 1/2 lb at 1 1/4 lb), so the
 * expected answers below are 31 buses, 26 packs, 16 banners and 6 bags.
 */
import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const ROUTE = "/math/pre-unit/projects/version-a/";

/** Choose a tier through the one-time launch overlay the GOLD layer shows. */
async function launchAtLevel(page: Page, level: 0 | 1 | 2) {
  await page.waitForFunction(() => document.body?.dataset.goldInit === "1", { timeout: 15_000 });
  const overlay = page.locator("#gold-level-overlay");
  if (await overlay.count()) {
    await page.locator(`.gold-level-option[data-level="${level}"]`).click();
    await expect(overlay).toHaveCount(0);
  }
}

async function open(page: Page, level: 0 | 1 | 2 = 1) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(ROUTE);
  await launchAtLevel(page, level);
  return errors;
}

const readout = (page: Page, id: string) => page.locator(`#${id}`);

test.describe("Pre-Unit culminating project", () => {
  test("a student can work all three parts, and a wrong answer is diagnosed rather than answered", async ({
    page,
  }) => {
    const errors = await open(page, 1);

    // ---- Part 1, step 2: whole-number division with a remainder (Lesson 2-6)
    await page.locator(".step-trail-item", { hasText: "Buses" }).click();
    await expect(page.locator("#step-2")).toHaveClass(/active/);

    // Level 1 supplies the numbers; the student supplies the decision.
    await expect(page.locator("#bus-students")).toHaveValue("738");
    await expect(page.locator("#bus-seats")).toHaveValue("24");

    // The diagram states the two GIVENS and masks the quotient the step asks for.
    await expect(page.locator("#bus-svg-total")).toHaveText("738");
    await expect(page.locator("#bus-svg-result")).toHaveText("?");

    // WRONG — 30 is the classic dropped-remainder answer. It must be NAMED,
    // and 31 must not appear anywhere in the feedback.
    await page.locator("#student-buses-input").fill("30");
    await page.getByRole("button", { name: /Check my bus order/i }).click();
    await expect(readout(page, "bus-out")).toContainText(/fill up completely/i);
    await expect(readout(page, "bus-out")).not.toContainText("31");
    await expect(page.locator("#bus-svg-result")).toHaveText("?");

    // RIGHT
    await page.locator("#student-buses-input").fill("31");
    await page.getByRole("button", { name: /Check my bus order/i }).click();
    await expect(readout(page, "bus-out")).toContainText(/Correct/i);
    await expect(readout(page, "bus-out")).toContainText("remainder 18");
    await expect(page.locator("#bus-svg-result")).toHaveText("31");

    // ---- Part 1, step 3: decimal division (Lesson 2-7)
    await page.locator("#step-2 .nav-btn", { hasText: /Next Step/ }).click();
    await expect(page.locator("#step-3")).toHaveClass(/active/);

    // WRONG — moved the decimal point in one number only.
    await page.locator("#student-packs-input").fill("2600");
    await page.getByRole("button", { name: /Check my supply order/i }).click();
    await expect(readout(page, "packs-out")).toContainText(/only one number|whole number/i);
    await expect(readout(page, "packs-out")).not.toContainText(/= 26\b/);

    await page.locator("#student-equiv-input").fill("5850 ÷ 225");
    await page.locator("#student-packs-input").fill("26");
    await page.getByRole("button", { name: /Check my supply order/i }).click();
    await expect(readout(page, "packs-out")).toContainText(/Correct/i);

    // ---- Part 2, step 4: fraction and mixed-number division (6-1, 6-2)
    await page.locator("#step-3 .nav-btn", { hasText: /Next Step/ }).click();
    await expect(page.locator("#step-4")).toHaveClass(/active/);

    // 12 × 3/4 — a product, not a quotient. Named, not answered.
    await page.locator("#student-banners-input").fill("9");
    await page.getByRole("button", { name: /Check my banner count/i }).click();
    await expect(readout(page, "banners-out")).toContainText(/product, not a quotient/i);
    await expect(readout(page, "banners-out")).not.toContainText("16");

    await page.locator("#student-banners-input").fill("16");
    await page.getByRole("button", { name: /Check my banner count/i }).click();
    await expect(readout(page, "banners-out")).toContainText(/Correct/i);

    // Mixed numbers, and equivalent notation must be accepted.
    await page.locator("#student-bags-input").fill("6/1");
    await page.locator("#bag-strategy").selectOption("reciprocal");
    await page
      .locator("#bag-justify")
      .fill(
        "I used the reciprocal because both amounts were mixed numbers and dividing asks how many bag portions fit in the bin.",
      );
    await page.getByRole("button", { name: /Check my bag count/i }).click();
    await expect(readout(page, "bags-out")).toContainText(/Correct/i);

    // ---- Part 2, step 5: error analysis
    await page.locator("#step-4 .nav-btn", { hasText: /Next Step/ }).click();
    await expect(page.locator("#step-5")).toHaveClass(/active/);

    await page.locator("#err-diagnosis").selectOption("rounded");
    await page.getByRole("button", { name: /Check my repair/i }).click();
    await expect(readout(page, "repair-out")).toContainText(/not the error/i);
    await expect(readout(page, "repair-out")).not.toContainText("16");

    await page.locator("#err-diagnosis").selectOption("multiplied");
    await page.locator("#err-correct").fill("16");
    await page
      .locator("#err-explain")
      .fill(
        "The note multiplied by 3/4, but dividing asks how many 3/4 metre pieces fit in 12 metres, so the answer has to be larger than 12.",
      );
    await page.getByRole("button", { name: /Check my repair/i }).click();
    await expect(readout(page, "repair-out")).toContainText(/Corrected order is right/i);

    // The partner panel opens now that the student's own answer is earned.
    await page.locator("#peer-buses").fill("30");
    await expect(readout(page, "peer-out")).toContainText(/differ/i);
    await expect(readout(page, "peer-out")).toContainText("31");

    // ---- Part 3, step 6: design and defend
    await page.locator("#step-5 .nav-btn", { hasText: /Next Step/ }).click();
    await expect(page.locator("#step-6")).toHaveClass(/active/);

    // A design that breaks the rules is rejected as a DESIGN, not marked wrong:
    // 480 ÷ 24 divides evenly, so the remainder rule is unmet.
    await page.locator("#d-students").fill("480");
    await page.locator("#d-seats").fill("24");
    await page.locator("#d-budget").fill("40");
    await page.locator("#d-unit-cost").fill("2.50");
    await page.locator("#d-rope").fill("9");
    await page.locator("#d-each").fill("3/4");
    await page.getByRole("button", { name: /Submit the depot order/i }).click();
    await expect(readout(page, "design-out")).toContainText(/leave a remainder/i);

    // Legal design, wrong quotient — the misconception is named, the value is not.
    await page.locator("#d-students").fill("487");
    await page.locator("#d-buses").fill("20"); // floor(487/24) = 20, remainder dropped
    await page.locator("#d-packs").fill("16");
    await page.locator("#d-banners").fill("12");
    await page.getByRole("button", { name: /Submit the depot order/i }).click();
    await expect(readout(page, "design-out")).toContainText(/only the full buses/i);
    await expect(readout(page, "design-out")).not.toContainText("21");

    // Correct against the student's OWN numbers: 487/24 → 21, 40/2.50 → 16, 9 ÷ 3/4 → 12.
    await page.locator("#d-buses").fill("21");
    await page.getByRole("button", { name: /Submit the depot order/i }).click();
    await expect(readout(page, "design-out")).toContainText(/Order accepted/i);

    expect(errors, `page errors: ${errors.join(" | ")}`).toEqual([]);
  });

  test("the partner panel will not hand over an answer the student has not earned", async ({
    page,
  }) => {
    // Jumping straight to the compare step, with step 2 unsolved, is exactly
    // how a student would try to read their own bus count off a partner's.
    await open(page, 1);
    await page.locator(".step-trail-item", { hasText: "Repair" }).click();
    await expect(page.locator("#step-5")).toHaveClass(/active/);

    await page.locator("#peer-buses").fill("31");
    await expect(readout(page, "peer-out")).toContainText(/before you compare/i);
    await expect(readout(page, "peer-out")).not.toContainText(/You:/);
  });

  test("progress and level survive a reload, and stale state cannot break the page", async ({
    page,
  }) => {
    await open(page, 1);
    await page.locator(".step-trail-item", { hasText: "Repair" }).click();
    await expect(page.locator("#step-5")).toHaveClass(/active/);

    await page.reload();
    await launchAtLevel(page, 1);
    await expect(page.locator("#step-5")).toHaveClass(/active/);
    await expect(page.locator("#progLabel")).toContainText("Step 5 of 6");

    // A corrupt record must fall back to step 1, not blank the project.
    await page.evaluate(() => {
      localStorage.setItem("nt-wizard:" + location.pathname, "{not json");
    });
    await page.reload();
    await launchAtLevel(page, 1);
    await expect(page.locator("#step-1")).toHaveClass(/active/);
    await expect(page.locator(".hero h1")).toBeVisible();
  });

  test("the three levels carry different work, not different numbers", async ({ page }) => {
    // LEVEL 0 is not "the project with hints". The shared meta layer replaces
    // the six-step wizard with the single worked task authored in
    // projects-meta-config.json, and hides the trail entirely — so the tier is
    // verified through that shell, not through the page's own .lvl0-only
    // blocks, which the shell covers.
    await open(page, 0);
    const shell = page.locator(".ntm-l0-shell");
    await expect(shell).toBeVisible();
    await expect(page.locator(".step-trail")).toBeHidden();
    await expect(shell).toContainText(/one bus holds 24/i);
    await expect(shell).toContainText(/4 students are still waiting/i);
    const level0 = await shell.innerText();

    // LEVEL 2 restores the full wizard and empties the worked numbers: the
    // student must choose values that satisfy a constraint.
    await page.evaluate(() => localStorage.clear());
    await page.goto(ROUTE);
    await launchAtLevel(page, 2);
    await expect(page.locator(".step-trail")).toBeVisible();
    await page.locator(".step-trail-item", { hasText: "Buses" }).click();
    await expect(page.locator("#bus-students")).toHaveValue("");
    await expect(page.locator("#step-2 .lvl1-only").first()).toBeHidden();
    // The shared declutter layer makes the Level 2 challenge opt-in. The button
    // is the Level 2 affordance; the block behind it is the Level 2 work.
    const optIn = page.locator("#step-2 .dc-optbtn");
    await expect(optIn).toBeVisible();
    await optIn.click();
    await expect(page.locator("#step-2 .lvl2-block").first()).toBeVisible();
    const level2 = await page.locator("#step-2").innerText();
    expect(level2).not.toEqual(level0);
    expect(level2).toMatch(/do NOT divide evenly/i);

    // LEVEL 1 keeps the wizard and supplies the worked pair plus a strategy tip
    // that Level 2 does not get. That difference is the fade.
    await page.evaluate(() => localStorage.clear());
    await page.goto(ROUTE);
    await launchAtLevel(page, 1);
    await page.locator(".step-trail-item", { hasText: "Buses" }).click();
    await expect(page.locator("#bus-students")).toHaveValue("738");
    await expect(page.locator("#step-2 .lvl1-only").first()).toBeVisible();
    await expect(page.locator("#step-2 .dc-optbtn")).toBeHidden();
    const level1 = await page.locator("#step-2").innerText();
    expect(level1).not.toEqual(level2);

    // Part 3 — design and defend — is the culminating challenge and exists at
    // every tier that runs the wizard, because independence is the task.
    await expect(page.locator("#step-6")).toContainText(/Design the Depot Order and Defend It/i);
    await expect(page.locator("#step-6")).toContainText(/remainder is NOT zero/i);
  });


  /* The project is used on a projector, on Chromebooks and on phones, and by
     students who run the browser at 200%. A 200% zoom of a 1440-wide laptop is
     a 720-wide CSS viewport, which is why that size is in the list rather than
     a separate zoom step. Horizontal page scroll is the failure being hunted:
     wide content (the SVG diagrams, the rubric table) must scroll inside its
     own box, never drag the page sideways. */
  const VIEWPORTS = [
    { name: "1440 laptop", width: 1440, height: 900 },
    { name: "1366 Chromebook", width: 1366, height: 768 },
    { name: "768 tablet", width: 768, height: 1024 },
    { name: "720 (1440 at 200% zoom)", width: 720, height: 900 },
    { name: "390 phone", width: 390, height: 844 },
  ];

  for (const vp of VIEWPORTS) {
    test(`no WCAG 2.1 AA violations and no sideways page scroll at ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await open(page, 1);

      for (const step of [1, 2, 4, 6]) {
        await page.locator(".step-trail-item").nth(step - 1).click();
        await expect(page.locator(`#step-${step}`)).toHaveClass(/active/);

        /* The PRO layer fades cards in. axe measures contrast at the instant it
           runs, so a card caught mid-fade reports a 1.1:1 ratio that no student
           ever sees — every project page in the fleet does this. Settle the
           reveal before measuring, or the check tests the animation. */
        await page.waitForTimeout(1200);
        await page.evaluate(() => {
          document.querySelectorAll(".pro-reveal").forEach((el) => el.classList.add("pro-in"));
        });
        await page.waitForTimeout(300);

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `horizontal page overflow on step ${step}`).toBeLessThanOrEqual(1);

        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        expect(
          results.violations.map((v) => `${v.id}: ${v.nodes.length}`),
          `axe violations on step ${step} at ${vp.name}`,
        ).toEqual([]);
      }
    });
  }

  test("standalone controls are big enough to tap", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, 1);
    await page.locator(".step-trail-item").nth(1).click();
    const small = await page.evaluate(() => {
      const out: string[] = [];
      document.querySelectorAll("#step-2 button, #step-2 select, #step-2 input").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // not rendered at this level
        if (r.height < 44) out.push(`${el.tagName.toLowerCase()}#${el.id || "?"} h=${Math.round(r.height)}`);
      });
      return out;
    });
    expect(small, "controls under the 44px touch target").toEqual([]);
  });

  test("the whole flow is operable from the keyboard", async ({ page }) => {
    await open(page, 1);
    // The step trail is the primary navigation and must be reachable and
    // operable without a pointer.
    const secondStep = page.locator(".step-trail-item").nth(1);
    await secondStep.focus();
    await expect(secondStep).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#step-2")).toHaveClass(/active/);

    await page.locator("#student-buses-input").focus();
    await page.keyboard.type("31");
    await expect(page.locator("#student-buses-input")).toHaveValue("31");
  });

  test("teacher class context does not segment or leak student project state", async ({ page }) => {
    // The canonical project is ONE project. A teacher entering from 601 sees the
    // same page and the same saved work as one entering from 602 — the class
    // section belongs to planning, not to a student's project state.
    await page.goto(ROUTE);
    await page.evaluate(() =>
      localStorage.setItem("curriculumTeacherWorkflow:v1", JSON.stringify({ section: "601" })),
    );
    await page.reload();
    await launchAtLevel(page, 1);
    await page.locator(".step-trail-item", { hasText: "Supply Packs" }).click();
    await expect(page.locator("#step-3")).toHaveClass(/active/);

    const keys601 = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith("nt-wizard:")),
    );
    expect(keys601).toEqual(["nt-wizard:" + ROUTE]);

    await page.evaluate(() =>
      localStorage.setItem("curriculumTeacherWorkflow:v1", JSON.stringify({ section: "602" })),
    );
    await page.reload();
    await launchAtLevel(page, 1);
    await expect(page.locator("#step-3")).toHaveClass(/active/);
    const keys602 = await page.evaluate(() =>
      Object.keys(localStorage).filter((k) => k.startsWith("nt-wizard:")),
    );
    expect(keys602).toEqual(keys601);
  });
});
