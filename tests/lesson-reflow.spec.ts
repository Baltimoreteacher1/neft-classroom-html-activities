import { expect, test } from "@playwright/test";

const LESSON_PATH = "/lessons/1-1/?sn=Layout%20Tester";

/**
 * Dismiss the flagship Mission Briefing if this lesson has one.
 *
 * The 10 unit-entry lessons (1-1, 2-1, 3-1, 4-1, 5-3, 6-1 … 10-1) were moved
 * onto the flagship narrative shell in dfb9d20, which opens on a full-screen
 * story screen and does not call bootLesson() — so no `.sidebar`, no phases,
 * no Continue buttons — until the student presses Start. These specs predate
 * that and drove straight into the phase assertions, so every one of them that
 * targets /lessons/1-1/ has been failing on a lesson that works.
 *
 * Deliberately conditional, not an unconditional click: it keeps the same spec
 * honest for the ~200 non-flagship lessons, which have no briefing at all.
 */
async function enterLesson(page: import("@playwright/test").Page) {
  const start = page.locator(".flagship-mission-start");
  if (await start.count()) {
    await start.click();
    // The overlay leaves on a 350ms transition before bootLesson() runs.
    await page.locator(".flagship-mission").waitFor({ state: "detached" });
  }
  await page.locator(".sidebar").waitFor();
}

test.describe("shared lesson shell reflow", () => {
  for (const lessonPath of ["/lessons/1-1/", "/lessons/10-3/"]) {
    test(`bottom Continue buttons advance each shared lesson phase: ${lessonPath}`, async ({
      page,
    }) => {
      await page.goto(`${lessonPath}?sn=Navigation%20Tester`, { waitUntil: "networkidle" });
      await enterLesson(page);

      // The hero stopped binding a phase name (it shows title/standard now);
      // the shell's statement of "which phase am I on" is the active sidebar
      // phase button, so that is what this spec reads.
      //
      // "Warm-Up", hyphenated, is Joel's own wording — 2026-08-28, quoted in
      // tools/act-flow-contract.test.mjs: "Review (#1) should actually be called
      // Warmup but then it should have a card at the bottom going to math notes
      // review". That test pins the rail and the in-page heading to agree on it.
      // This spec still read "Warmup" and so died on the FIRST assertion of a
      // twelve-hop walk, taking the whole no-dead-ends property with it — the
      // rail renders "1 / Warm-Up / ★★★".
      await expect(page.locator(".phase-btn.active")).toContainText("Warm-Up");

      /* Walk with the IN-PAGE control at the bottom of each step, which is what
       * this spec is named for. There are two forward controls on the page and
       * only one of them belongs to this test: the in-page button lives in
       * `.act-step-next`, while `.nt-next-phase-btn` is the floating pill that
       * `npm run validate:flow-walk` already walks in teacher mode. Selecting by
       * text alone would resolve to whichever came first in the DOM, so the
       * container is what distinguishes them.
       *
       * The 3-Act restructure (2026-08-25..28) is why the old hop list could not
       * work: Objectives, Launch, Learn It, Explore and Practice stopped being
       * top-level phases and became STEPS inside an act, so `.phase-btn.active`
       * now names the act ("1 Warm-Up", "2 Lesson") and never those words. Every
       * assertion here read the act button for a step name, and the button
       * labels moved too — "Continue to Phase 2: Objectives 🎯" does not exist;
       * within an act the control reads "Next: 📓 Math Notes →", and crossing
       * into one it reads "Continue to Vocabulary 🔑". So this walks the steps
       * on the act step strip and keeps the act button for act changes.
       *
       * Deliberately NOT re-implementing flow-walk's contract here. That gate
       * owns the taught sequence, the label-is-a-promise property and the
       * terminate condition, mutation-proven; a second hand-maintained copy of
       * the same walk is the `tools/scorm/template/` shape this repo has been
       * bitten by. What this keeps is its own property: the bottom control on
       * each step is a real button that advances, so there are no dead ends.
       *
       * Every step's panel is in the DOM at once and only the current one is
       * visible, so this has to ask for the visible control — without
       * `:visible` the locator resolves to several buttons and Playwright
       * refuses it in strict mode. It is scoped to `.act-step-panel` rather
       * than `.act-step-next` because the LAST step of an act does not have a
       * `.act-step-next` wrapper: its forward button sits directly in the panel
       * and reads "Continue to Vocabulary 🔑" instead of "Next: … →". Scoping to
       * the wrapper walks four steps and then finds nothing at the act
       * boundary, which is the one hop most worth covering.
       *
       * A step panel can hold more than one primary button — the warm-up also
       * shows "Submit Warmup Answers" — so the forward control is picked by its
       * SHAPE, "Next: …" within an act and "Continue to …" across one. Matching
       * the shape rather than a full label is deliberate: pinning whole strings
       * ("Continue to Phase 2: Objectives 🎯") is what made this spec go stale
       * against a rename it had no stake in. */
      const inPageNext = page
        .locator(".act-step-panel button.btn-primary:visible")
        .filter({ hasText: /^(Next:|Continue to)\s/ });
      const step = page.locator(".act-step-chip.is-current");

      await expect(step).toContainText("Warm-Up");
      await inPageNext.click();
      await expect(step).toContainText("Math Notes");
      await inPageNext.click();
      await expect(step).toContainText("Objectives");
      await inPageNext.click();
      await expect(step).toContainText("Notice & Wonder");

      // Address these boxes by what they ARE, not by where they sit. This used
      // to take `.phase textarea` nth(0)/nth(1), which silently assumed the
      // notice/wonder boxes were the first two textareas in the phase. The
      // Which One Doesn't Belong opener now renders above them by design, and
      // its textarea is collapsed until opened — so nth(0) resolved to a hidden
      // element and the fill retried until the test timed out.
      await page.locator("#nw-notice").fill("I notice a math pattern in the example.");
      await page.locator("#nw-wonder").fill("I wonder how the pattern will help me solve it.");

      // Crossing out of Act 1 into Act 2. This is the hop the act button is for.
      await inPageNext.click();
      await expect(page.locator(".phase-btn.active")).toContainText("Lesson");
      await expect(step).toContainText("Vocabulary");
    });
  }

  test("keeps every lesson navigation item visible at 320 CSS pixels", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    await enterLesson(page);
    await page.evaluate(() => window.scrollTo(0, 48));

    const layout = await page.locator(".sidebar").evaluate((sidebar) => {
      const navs = Array.from(
        sidebar.querySelectorAll<HTMLElement>(".prelesson-nav, .phase-nav, .bonus-nav"),
      );
      const buttons = Array.from(sidebar.querySelectorAll<HTMLElement>(".phase-btn"));
      const sidebarRect = sidebar.getBoundingClientRect();
      const intersects = (a: DOMRect, b: DOMRect) =>
        a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      const floatingChrome = Array.from(
        document.querySelectorAll<HTMLElement>(".minimap-hud, .nt-next-phase-btn"),
      ).filter((element) => getComputedStyle(element).display !== "none");
      const utility = document.querySelector<HTMLElement>(".nt-utility-menu");
      const header = sidebar.querySelector<HTMLElement>(".sidebar-header");

      return {
        navsFit: navs.every((nav) => nav.scrollWidth <= nav.clientWidth + 1),
        buttonsFit: buttons.every((button) => {
          const rect = button.getBoundingClientRect();
          return rect.left >= sidebarRect.left - 1 && rect.right <= sidebarRect.right + 1;
        }),
        floatingChromeClear: floatingChrome.every((element) =>
          buttons.every(
            (button) =>
              !intersects(element.getBoundingClientRect(), button.getBoundingClientRect()),
          ),
        ),
        toolsClear:
          !utility ||
          !header ||
          !intersects(utility.getBoundingClientRect(), header.getBoundingClientRect()),
        toolsFollowDocument: !utility || getComputedStyle(utility).position === "absolute",
        pageFits: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
      };
    });

    expect(layout.pageFits, "lesson page should not scroll sideways").toBe(true);
    expect(layout.navsFit, "lesson navigation should reflow instead of scrolling sideways").toBe(
      true,
    );
    expect(layout.buttonsFit, "every lesson navigation item should remain on-screen").toBe(true);
    expect(layout.floatingChromeClear, "floating controls should not cover lesson navigation").toBe(
      true,
    );
    expect(layout.toolsClear, "the tools menu should not cover the lesson heading").toBe(true);
    expect(layout.toolsFollowDocument, "the tools menu should move with the lesson page").toBe(
      true,
    );
  });

  // The 320px case above only proved this on phones, where the HUD is
  // display:none anyway. On a laptop the fixed bottom-left chrome sat ON the
  // phase rail and hid whichever section label happened to be at that scroll
  // position — reported 2026-08-01 with the open "Launch" step unreadable.
  for (const [width, height, label] of [
    [1280, 800, "laptop"],
    [1024, 640, "chromebook"],
    [1000, 560, "short laptop"],
  ] as const) {
    test(`keeps floating chrome off the phase rail at ${label} size`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
      await enterLesson(page);

      const clashes = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll<HTMLElement>(".phase-btn"));
        const chrome = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".minimap-hud, .nt-teacher-clear, .nt-next-phase-btn",
          ),
        ).filter((element) => getComputedStyle(element).display !== "none");
        const intersects = (a: DOMRect, b: DOMRect) =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

        const out: string[] = [];
        for (const element of chrome) {
          for (const button of buttons) {
            if (intersects(element.getBoundingClientRect(), button.getBoundingClientRect())) {
              out.push(`${element.className} covers "${(button.textContent || "").trim()}"`);
            }
          }
        }
        return out;
      });

      expect(clashes, "floating controls should not cover a phase button").toEqual([]);
    });
  }

  // The mark-up dock (highlight / underline / bold) is the student's only route
  // to annotating a whole-group lesson, and it was PRESENT-BUT-UNREACHABLE:
  // `.annot-dock` sat at `right:0; top:50%`, the exact slot the Learning-Supports
  // rail already owns at z-index 9998, so that rail's collapsed 100px "Tools"
  // pill covered the 44px toggle outright. `querySelector` therefore found the
  // dock on all 85 whole-group lessons while no student could open it — which is
  // why the first assertion here is a HIT TEST, not existence. The small-group
  // surface hit the same bug and fixed it the same way
  // (assets/small-group-designsystem.css section 11).
  //
  // Two assertions, because either alone can pass while the bug is present:
  //
  //   • The hit test only proves something while the supports pill is actually
  //     on screen, and whether it paints depends on what that student has been
  //     assigned. Driven on /lessons/1-1/ WITHOUT `?sn=`, which is the route a
  //     student takes and the one where the pill was measured; the test states
  //     that precondition rather than assuming it.
  //   • The offset assertion needs no pill at all: the viewport's vertical
  //     centre is the slot the supports rail owns, so the dock must not be
  //     centred there. This is what catches a revert to plain `translateY(-50%)`
  //     on any lesson, in any support configuration.
  for (const [width, height, label] of [
    [1440, 900, "desktop"],
    [1280, 800, "laptop"],
    [1024, 768, "chromebook"],
  ] as const) {
    test(`the mark-up dock is reachable, not just present, at ${label} size`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/lessons/1-1/", { waitUntil: "networkidle" });
      const start = page.locator(".flagship-mission-start");
      if (await start.count()) {
        await start.click();
        await page.locator(".flagship-mission").waitFor({ state: "detached" });
      }
      await page.locator(".annot-dock-toggle").waitFor();

      const reach = await page.evaluate(() => {
        const toggle = document.querySelector<HTMLElement>(".annot-dock-toggle");
        if (!toggle) return null;
        const box = toggle.getBoundingClientRect();
        const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
        const pill = document.querySelector<HTMLElement>(".ewl-supports-dock-reopen");
        const pillBox = pill?.getBoundingClientRect();
        return {
          clickable: top === toggle || toggle.contains(top),
          blockedBy: (top as HTMLElement | null)?.className ?? "",
          pillOnScreen: !!pillBox && pillBox.width > 0 && pillBox.height > 0,
          offsetFromCentre: Math.abs(box.top + box.height / 2 - window.innerHeight / 2),
        };
      });

      expect(reach, "every lesson mounts the mark-up dock").not.toBeNull();
      expect(
        reach?.pillOnScreen,
        "this route must show the supports pill, or the hit test proves nothing",
      ).toBe(true);
      expect(
        reach?.clickable,
        `the mark-up toggle must receive its own clicks (covered by "${reach?.blockedBy}")`,
      ).toBe(true);
      expect(
        reach?.offsetFromCentre ?? 0,
        "the dock must claim its own slot, not the centred one the supports rail owns",
      ).toBeGreaterThan(30);
    });
  }

  test("centers the lesson column when browser zoom exposes a wide layout viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2560, height: 900 });
    await page.goto(LESSON_PATH, { waitUntil: "networkidle" });
    await enterLesson(page);

    const gaps = await page.locator(".app").evaluate((app) => {
      const sidebar = app.querySelector<HTMLElement>(".sidebar");
      const main = app.querySelector<HTMLElement>(".main");
      if (!sidebar || !main) throw new Error("lesson shell is incomplete");

      const appRect = app.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      return {
        left: mainRect.left - sidebarRect.right,
        right: appRect.right - mainRect.right,
      };
    });

    expect(
      Math.abs(gaps.left - gaps.right),
      "wide lesson column should stay centered",
    ).toBeLessThan(2);
  });
});
