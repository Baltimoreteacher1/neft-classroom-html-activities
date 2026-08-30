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

    /* Step to a beat in that SAME tab, so its panel is on screen and the only
     * thing that can be hiding the lens is the blackout.
     *
     * Anchored to the beats the Practice tab actually contributes to the rail.
     * This looked for /problem 1|set up/ — labels the rail stopped using when
     * it became a teaching plan (see the sibling spec that pins exactly that)
     * — and the click was guarded by `if (await beat.count())`, so a stale
     * label did not fail here: it SKIPPED the step in silence, left the
     * practice panel hidden, and the assertion on the next line failed instead.
     * That points the blame at the blackout, which was working the whole time.
     * The step is required now, so a future rename fails at the rename. */
    const practiceBeats = page
      .locator(".pm-rail-phase")
      .filter({ hasText: /Practice Studio|solve together|Try it on your own/ });
    await expect(
      practiceBeats.first(),
      "the rail offers a beat belonging to the Practice tab",
    ).toBeVisible();
    await practiceBeats.first().click();
    await expect(page.locator(`#${lensTab}`)).toBeVisible();
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

    /* Walk the WORD beats, not the first beats on the rail.
     *
     * The rail is a teaching plan — the sibling spec above pins that — so its
     * opening beats are "Focus & Learn" and the vocabulary words start partway
     * down: 18 beats on 1-1-group1, with the words at 3 through 7. This read
     * `.pm-rail-phase` index 0 and 1, which are Focus & Learn beats where no
     * word card is on screen at all, so it failed on the first assertion with
     * every `.sg-vcard` hidden and never reached the property it is named for.
     * Anchoring on the beat LABEL keeps it pointed at the words wherever the
     * plan puts them. Measured on 1-1-group1: word beat 1 shows card 1 only,
     * word beat 2 shows cards 1 and 2 — progressive reveal works, and always
     * did. */
    const wordBeats = page.locator(".pm-rail-phase").filter({ hasText: /Unlock the math words/ });
    await expect(wordBeats.first(), "the rail reaches the vocabulary words").toBeVisible();

    const words = page.locator(".sg-vcard");
    await wordBeats.nth(0).click();
    await expect(words.first()).toBeVisible();
    await expect(words.nth(1), "a later word is veiled on the first word beat").toBeHidden();

    // Second word beat: the first word stays up. Progressive, not one-at-a-time
    // — students compare the words they have already met.
    await wordBeats.nth(1).click();
    await expect(words.first()).toBeVisible();
    await expect(words.nth(1)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/nt-present/);
    await expect(page.locator(".sgp-veil")).toHaveCount(0);
    await expect(words.nth(1), "the studio is handed back intact").toBeVisible();
  });
});
