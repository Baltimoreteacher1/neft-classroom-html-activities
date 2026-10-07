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

const STUDIO = "/lessons/1-1-group1/?teacher=1&sn=Presenter%20T";

/** Present Mode only mounts for a teacher; facilitation data lives on the teacher route. */
async function openAsTeacher(page: import("@playwright/test").Page) {
  await page.route("**/teacher-small-group/1-1-group1/data", (route) =>
    route.fulfill({
      json: {
        facilitation: {
          group: 1,
          label: "Extra Support",
          teacherMoves: {
            ask: "What do you notice first?",
            lookFor: "Students name equal groups before computing.",
            ifStuck: "Point at the diagram, not the answer.",
          },
        },
      },
    }),
  );
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nt-teacher-mode", "1");
    } catch {}
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        document.body.classList.add("sg-is-teacher");
      },
      { once: true },
    );
  });
  await page.goto(STUDIO, { waitUntil: "domcontentloaded" });
  await page.locator(".sg-hero, main").first().waitFor();
}

test.describe("presenting a small-group studio", () => {
  test("teacher coaching is on screen before presenting, and gone during it", async ({ page }) => {
    await openAsTeacher(page);

    const coach = page.locator(".sg-teacher").first();
    await expect(
      coach,
      "teacher coaching is visible to a teacher who is not presenting",
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Present/ })
      .first()
      .click();
    await expect(page.locator("body")).toHaveClass(/nt-present/);
    await expect(coach, "teacher coaching is blacked out while presenting").toBeHidden();

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

    // Address the word beats by their titles, not by rail position. This spec
    // used to take beats 0 and 1, which assumed the studio opened on the
    // vocabulary. It does not: the rail now leads with two "Focus & Learn"
    // beats and the words start at index 2, so the old indices landed before
    // any card had been revealed and read as a broken progressive reveal.
    // "word N" is a stable contract — the sibling test above pins that those
    // titles exist — whereas the position of the first word beat is not.
    const wordBeat = (n: number) =>
      page
        .locator(".pm-rail-phase")
        .filter({ hasText: new RegExp(`word ${n}\\b`) })
        .first();
    await expect(
      wordBeat(1),
      "the rail exposes the first vocabulary word as its own beat",
    ).toBeVisible();

    const words = page.locator(".sg-vcard");
    await wordBeat(1).click();
    await expect(words.first()).toBeVisible();
    await expect(words.nth(1), "a later word is veiled on the first word beat").toBeHidden();

    // Next word beat: the first word stays up. Progressive, not one-at-a-time —
    // students compare the words they have already met.
    await wordBeat(2).click();
    await expect(words.first()).toBeVisible();
    await expect(words.nth(1)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator("body")).not.toHaveClass(/nt-present/);
    await expect(page.locator(".sgp-veil")).toHaveCount(0);
    await expect(words.first(), "the original reading card returns").toBeVisible();
    await expect(words.nth(1), "the studio returns to one word at a time").toBeHidden();
  });
});
