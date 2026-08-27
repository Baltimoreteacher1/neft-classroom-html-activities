import { expect, test } from "@playwright/test";

/**
 * Presenting a small-group studio, in a real browser.
 *
 * jsdom can prove the blackout CSS was written; only a real browser can prove
 * it PAINTS. That distinction matters more here than anywhere else in the
 * studio: the screen a teacher turns toward the table carries the probing
 * questions for every wrong answer, and "the rule exists" is not the same claim
 * as "the student cannot read it".
 */

const STUDIO = "/lessons/1-1-group1/?sn=Presenter%20T";

/** Present Mode only mounts for a teacher, and the lens only renders for one. */
async function openAsTeacher(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nt-teacher-mode", "1");
    } catch {}
  });
  await page.goto(STUDIO, { waitUntil: "networkidle" });
  await page.locator(".sg-tabs").waitFor();
  // The authenticated `?teacher=1` flow adds this after fetching the plan; the
  // preview server has no Pages Functions, so stand it up directly. What is
  // under test is the blackout, not the auth handshake (covered in
  // tools/small-group-modes.test.mjs).
  await page.evaluate(() => document.body.classList.add("sg-is-teacher"));
}

/**
 * Step the presenter rail forward until `settled` holds, and return the stop it
 * settled on.
 *
 * Beats are DERIVED from the studio's own content — engine/core/small-group-
 * present.js walks each tab panel and emits one beat per vocabulary card, per
 * problem, or per block, labelling each from the heading a teacher would say
 * out loud. So the rail's length and wording are a function of what the lesson
 * authored, and any spec that names a beat ("problem 1", "set up") is pinned to
 * today's content rather than to the shell. 1-1-group1 stopped authoring a
 * multi-problem block and its rail lost those labels; the selector then matched
 * nothing, the guarded `if (await beat.count())` skipped the click in silence,
 * and the assertion that followed failed on a rail that had never been stepped.
 *
 * Searching by OBSERVED STATE instead pins the property the test is about, and
 * a rail that never reaches that state fails loudly here rather than three
 * assertions later. Zero matches is never a pass.
 */
async function stepRailUntil(
  page: import("@playwright/test").Page,
  what: string,
  settled: () => Promise<boolean>,
): Promise<number> {
  const rail = page.locator(".pm-rail-phase");
  const stops = await rail.count();
  expect(stops, "Present Mode builds a rail of beats").toBeGreaterThan(0);
  for (let i = 0; i < stops; i++) {
    await rail.nth(i).click();
    if (await settled()) return i;
  }
  throw new Error(`no beat in the ${stops}-stop presenter rail reaches: ${what}`);
}

test.describe("presenting a small-group studio", () => {
  test("teacher coaching is on screen before presenting, and gone during it", async ({ page }) => {
    await openAsTeacher(page);

    // The lens lives on practice cards, so open a tab that HAS one first. A
    // lens sitting in an inactive tab panel is hidden by the tablist, and
    // asserting against that would pass whether or not the blackout works at
    // all — the first version of this test made exactly that mistake.
    const lensTab = await page.evaluate(
      () => document.querySelector(".sg-lens")?.closest("[id^='sg-tab-']")?.id ?? null,
    );
    expect(lensTab, "a studio renders at least one teacher lens").not.toBeNull();
    await page.locator(`#sg-tab-${lensTab}`).click();

    const lens = page.locator(`#${lensTab} .sg-lens`).first();
    await expect(
      lens,
      "the teacher lens is visible to a teacher who is not presenting",
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Present/ })
      .first()
      .click();
    await expect(page.locator("body")).toHaveClass(/nt-present/);

    // Step to a beat in that SAME tab, so its panel is on screen and the only
    // thing that can be hiding the lens is the blackout. Entering Present Mode
    // resets to the first beat, which is in the first tab — so without this the
    // lens panel is hidden by the TABLIST and "the lens is not visible" would
    // pass on a studio with no blackout at all.
    const panel = page.locator(`#${lensTab}`);
    await stepRailUntil(page, `the ${lensTab} panel on screen`, () => panel.isVisible());
    await expect(panel).toBeVisible();
    await expect(lens, "the lens is blacked out while presenting").toBeHidden();

    // Every teacher-only surface, checked as painted output rather than as CSS.
    for (const selector of [
      ".sg-lens",
      ".sg-teacher",
      ".sg-misconceptions",
      ".sg-facilitation",
      ".ntfr",
    ]) {
      const nodes = page.locator(selector);
      for (let i = 0; i < (await nodes.count()); i++) {
        await expect(nodes.nth(i), `${selector} must not reach the projector`).toBeHidden();
      }
    }
  });

  test("nothing floats on top of the presenter rail", async ({ page }) => {
    await openAsTeacher(page);
    await page
      .getByRole("button", { name: /Present/ })
      .first()
      .click();
    await expect(page.locator(".pm-rail")).toBeVisible();

    // Asserted as a PROPERTY, not as a list of selectors. The studio mounts a
    // drift of floating docks — supports, math supports, annotation tools, the
    // workbench launcher — and each one that lands on the rail clips the beat
    // labels the teacher is reading from. Pinning today's five selectors would
    // pass the day a sixth dock ships; this fails instead.
    const overlapping = await page.evaluate(() => {
      const rail = document.querySelector(".pm-rail");
      if (!rail) return ["no rail"];
      const r = rail.getBoundingClientRect();
      const hits: string[] = [];
      for (const el of Array.from(document.querySelectorAll("body *"))) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed" || cs.display === "none" || cs.visibility === "hidden")
          continue;
        if (rail.contains(el) || el.contains(rail)) continue;
        // The presenter's own nav is allowed anywhere — it IS the controls.
        if (el.closest(".pm-nav")) continue;
        const b = el.getBoundingClientRect();
        if (!b.width || !b.height) continue;
        const clear = b.right < r.left || b.left > r.right || b.bottom < r.top || b.top > r.bottom;
        if (!clear) hits.push(`${el.tagName}.${String(el.className).slice(0, 40)}`);
      }
      return hits;
    });
    expect(overlapping, `floating chrome is covering the rail: ${overlapping}`).toEqual([]);
  });

  test("the rail is a teaching plan, not one stop per tab", async ({ page }) => {
    await openAsTeacher(page);
    const tabCount = await page.locator('.sg-tabs [role="tab"]').count();

    await page
      .getByRole("button", { name: /Present/ })
      .first()
      .click();
    const beats = page.locator(".pm-rail-phase");
    const beatCount = await beats.count();

    // The whole point: more beats than tabs. One stop per tab was the old
    // behaviour and is what made the presenter unusable at a table.
    expect(beatCount, `expected beats to subdivide ${tabCount} tabs`).toBeGreaterThan(tabCount);

    // Labels come from the authored headings, and carry no decorative sub-label.
    const titles = await beats.allTextContents();
    expect(titles.join(" ")).not.toMatch(/The words|Worked example/);
    expect(
      titles.some((t) => /word 1/.test(t)),
      `titles: ${titles.slice(0, 4)}`,
    ).toBe(true);
  });

  test("stepping forward reveals progressively and exiting restores the studio", async ({
    page,
  }) => {
    await openAsTeacher(page);
    await page
      .getByRole("button", { name: /Present/ })
      .first()
      .click();

    const words = page.locator(".sg-vcard");
    // The word beats are not the first beats on the rail — the sections and
    // blocks ahead of the vocabulary grid get their own stops, and how many
    // there are is a property of the lesson's content, not of the shell. This
    // used to assume word 1 was beat 1 and word 2 was beat 2; the rail grew and
    // both assertions started reading a screen where every word was still
    // veiled. Step to the beat that reveals the first word instead.
    const first = await stepRailUntil(page, "the first vocabulary word revealed", () =>
      words.first().isVisible(),
    );
    await expect(words.first()).toBeVisible();
    await expect(words.nth(1), "a later word is veiled on its own beat").toBeHidden();

    // Next beat: the first word stays up. Progressive, not one-at-a-time —
    // students compare the words they have already met.
    await page.locator(".pm-rail-phase").nth(first + 1).click();
    await expect(words.first()).toBeVisible();
    await expect(words.nth(1)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/nt-present/);
    await expect(page.locator(".sgp-veil")).toHaveCount(0);
    await expect(words.nth(1), "the studio is handed back intact").toBeVisible();
  });
});
