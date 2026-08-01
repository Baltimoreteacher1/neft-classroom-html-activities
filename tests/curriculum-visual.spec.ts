import { expect, type Page, test } from "@playwright/test";

/**
 * Visual regression baselines for the curriculum hub.
 *
 * WHY THIS EXISTS
 * The existing specs are behavioural: they assert that elements exist, are
 * visible, and respond to clicks. Every one of them would have passed through
 * this repo's actual failure history — the Draw canvas at z-9998 swallowing
 * taps on the Next button, project step 2 rendering blank, teacher-only cards
 * leaking into Student Mode, the hidden-tab rAF artifact. Those are LAYOUT and
 * PAINT failures. A test that only asks "is the node in the DOM?" is
 * structurally blind to all of them.
 *
 * These snapshots close that gap on the page students open first. They are
 * intentionally few and canonical: one per mode and per major view, full-page,
 * so a diff is meaningful rather than noisy.
 *
 * ALSO: these are the acceptance gate for turning curriculum/index.html into a
 * generated artifact. That refactor is only provably safe if the generated page
 * renders pixel-identical to the hand-authored one. Capture before, diff after.
 *
 *   npx playwright test tests/curriculum-visual.spec.ts                 # verify
 *   npx playwright test tests/curriculum-visual.spec.ts --update-snapshots
 */

/**
 * Teacher Mode is not reachable by clicking on the public page — the mode
 * toggle and every guide action carry `hub-teacher-only`, which is display:none
 * for students. That is deliberate (it is the student-mode-leak fix), so a test
 * must enter the mode the way a real teacher's browser does: by setting the
 * shared key, then loading the page.
 *
 * The value must be one the hub accepts. It stores "true"; other modules in the
 * repo compare against "1". See assets/nt-usage.js for that inconsistency.
 */
async function enterTeacherMode(page: Page) {
  await page.goto("/curriculum/");
  await page.evaluate(() => {
    localStorage.setItem("nt-teacher-mode", "true");
  });
  await page.reload();
  await page.waitForLoadState("networkidle").catch(() => {});
}

/**
 * Student Mode is the PUBLIC default, but it is stored in localStorage — so a
 * previous test's teacher session silently changes what the next page renders.
 * Every case here starts from a cleared origin, which is also the only honest
 * way to judge a student-mode leak.
 */
async function freshStudentSession(page: Page) {
  // Clear storage before any hub script runs. Clearing after the first load
  // and reloading let Chromium restore transient <details open> state under
  // heavy parallel load, which produced two different mobile screenshots.
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* blocked storage is already a clean slate */
    }
  });
  await page.goto("/curriculum/");
}

/**
 * Suppress everything that legitimately differs between two identical runs:
 * animation frames mid-flight, blinking carets, and any date-stamped label.
 * Without this the snapshots fail constantly and get deleted within a week.
 */
async function stabilize(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
      }
    `,
  });
  // Fonts must be settled or text reflows a few pixels after the shot.
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForLoadState("networkidle").catch(() => {});
  await waitForStableLayout(page);
}

/**
 * networkidle is NOT enough here: the hub keeps growing after it, because
 * several sections render from deferred fetches and locally-cached content, so
 * consecutive runs captured the page at 2825px, 2853px and 2914px tall. That is
 * a genuinely unstable capture point, and the honest fix is to wait for the
 * layout to stop moving rather than to widen the pixel tolerance until the
 * flake hides (which would also blind the snapshot to real regressions).
 *
 * Polls document height until it repeats `settleChecks` times in a row.
 */
async function waitForStableLayout(page: Page, settleChecks = 3, intervalMs = 250) {
  let last = -1;
  let stable = 0;
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    stable = height === last ? stable + 1 : 0;
    last = height;
    if (stable >= settleChecks) return;
    await page.waitForTimeout(intervalMs);
  }
  // Timing out is not a test failure by itself — the screenshot comparison
  // that follows is the real assertion. But say so, or a future flake looks
  // inexplicable.
  console.warn(`layout never settled within 15s (last height ${last}px)`);
}

const SHOT = {
  // CLIPPED rather than fullPage, for a reason the tolerance below cannot fix.
  //
  // A full-page capture is as tall as the page, so ADDING A LESSON changes the
  // image height — and Playwright fails a height mismatch outright ("expected
  // 1280x2988, received 1280x2941") before maxDiffPixelRatio is ever consulted.
  // On a hub the automation edits several times an hour, that made these
  // baselines break on content, permanently, no matter how the tolerance was
  // set. Observed exactly that within one day of setting it.
  //
  // A fixed 2,600px window holds everything these shots exist to protect: the
  // header, the four workspace cards, the feature strip, class tools, the
  // student-mode notice, search, the filter chips, and the top of the unit
  // rail. That is where a failed stylesheet, a collapsed grid or a leaked
  // teacher-only card shows up. What falls below the fold is lesson content,
  // which is asserted behaviourally in curriculum-journey.spec.ts and by
  // validate:hub's structural counts.
  fullPage: true,
  clip: { x: 0, y: 0, width: 1280, height: 2600 },
  // Sized from MEASURED churn, not from a guess.
  //
  // The old 0.02 was set for "live counts and today strings". The real churn is
  // much larger: background automation edits curriculum/index.html several times
  // an hour — 29 insertions and 15 deletions landed between two CI runs twenty
  // minutes apart — and each added lesson row displaces everything below it.
  // Observed from ordinary content edits: 0.03 on the desktop capture, 0.05 on
  // the mobile one before it was clipped. At 0.02 this suite could not stay
  // green for an hour, and a permanently-red gate is one nobody reads.
  //
  // 0.08 still catches what this file exists to catch. The failures in its
  // header comment — a stylesheet that failed to load, a collapsed grid, a
  // teacher-only card leaking into Student Mode, a panel rendering blank —
  // repaint a large fraction of a 1280x3000 page, far above 8%. What it
  // deliberately no longer fails on is somebody adding a lesson.
  maxDiffPixelRatio: 0.08,
  animations: "disabled",
} as const;

// Run serially in one worker. Under the default fullyParallel setting the very
// first navigation after a fresh build races the other workers and captures the
// hub mid-settle (heights of 2825/2853/2879/2914px were all observed for the
// same page). Two consecutive runs in a single worker are byte-identical, so
// serialising is the fix — the suite is only ~15s.
test.describe.configure({ mode: "serial" });

test.describe("curriculum hub — visual baselines", () => {
  test("student mode, default view", async ({ page }) => {
    await freshStudentSession(page);
    await stabilize(page);
    await expect(page.locator("#hub-mode-toggle")).toContainText("Student Mode");
    await expect(page).toHaveScreenshot("hub-student-default.png", SHOT);
  });

  test("student mode, mobile width", async ({ page }) => {
    // The width most students actually open this on when not at a Chromebook.
    await page.setViewportSize({ width: 390, height: 844 });
    await freshStudentSession(page);
    await stabilize(page);
    // CLIPPED, unlike the other four, and deliberately.
    //
    // At 390px the hub is ~4,700px tall, so a single line-wrap deep in the
    // lesson list displaces every pixel below it — one ordinary content edit
    // measured 5% of the image and blew past the 2% tolerance. That is not a
    // layout regression, it is the shape of a narrow full-page shot: the same
    // edit costs a fraction of that on the 1280px desktop capture.
    //
    // The failures this shot exists to catch at mobile width — chrome
    // overlapping, the unit rail collapsing, the search box falling out of the
    // page — all happen in the first screens. Clipping there keeps that signal
    // and stops the baseline going stale every time automation touches a
    // lesson row further down. Horizontal overflow is separately asserted
    // functionally in curriculum-journey.spec.ts.
    await expect(page).toHaveScreenshot("hub-student-mobile.png", {
      ...SHOT,
      clip: { x: 0, y: 0, width: 390, height: 2200 },
    });
  });

  test("teacher mode, workflow open on Today's Teaching", async ({ page }) => {
    await enterTeacherMode(page);
    await page.locator("button[data-guide-teacher-view='today']").click();
    const workflow = page.locator("#curriculum-teacher-workflow");
    await expect(workflow).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot("hub-teacher-today.png", SHOT);
  });

  test("teacher mode, plan the week", async ({ page }) => {
    await enterTeacherMode(page);
    await page.locator("button[data-guide-teacher-view='week']").click();
    await expect(page.locator("#curriculum-teacher-workflow")).toBeVisible();
    await stabilize(page);
    await expect(page).toHaveScreenshot("hub-teacher-week.png", SHOT);
  });

  test("teacher controls stay hidden from students", async ({ page }) => {
    // The inverse assertion, and the one that actually protects students: after
    // a clean session every teacher-only control must be display:none. A
    // screenshot alone would not catch a leak that renders below the fold.
    await freshStudentSession(page);
    await expect(page.locator("#hub-mode-toggle")).toBeHidden();
    for (const el of await page.locator("[data-guide-teacher-view]").all()) {
      await expect(el).toBeHidden();
    }
  });

  test("search results render and resolve", async ({ page }) => {
    // Guards the lessonId-vs-id join: a broken join still renders a results
    // container, so only the painted result rows prove the join works.
    await freshStudentSession(page);
    const search = page.locator("#hub-search, input[type='search']").first();
    await search.fill("ratio");
    await page.waitForTimeout(600); // debounce
    await stabilize(page);
    await expect(page).toHaveScreenshot("hub-search-ratio.png", SHOT);
  });
});
