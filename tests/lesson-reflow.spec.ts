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
      await expect(page.locator(".phase-btn.active")).toContainText("Warmup");
      await page.getByRole("button", { name: "Continue to Phase 2: Objectives 🎯" }).click();
      await expect(page.locator(".phase-btn.active")).toContainText("Objectives");

      await page.getByRole("button", { name: "Continue to Phase 3: Launch 🚀" }).click();
      await expect(page.locator(".phase-btn.active")).toContainText("Launch");

      // Address these boxes by what they ARE, not by where they sit. This used
      // to take `.phase textarea` nth(0)/nth(1), which silently assumed the
      // notice/wonder boxes were the first two textareas in the phase. The
      // Which One Doesn't Belong opener now renders above them by design, and
      // its textarea is collapsed until opened — so nth(0) resolved to a hidden
      // element and the fill retried until the test timed out.
      await page.locator("#nw-notice").fill("I notice a math pattern in the example.");
      await page.locator("#nw-wonder").fill("I wonder how the pattern will help me solve it.");

      // The taught order: Launch → Vocab → Learn It → Explore → Practice. Every
      // hop is a real button a student can press, which is the point — Vocab and
      // Learn It used to advance ONLY by completing their activity, so a student
      // who read the page without finishing it had no way forward.
      //
      // Explore belongs in that chain, and this spec used to leave it out: it
      // went Learn It → Practice and then failed waiting for a "Continue to
      // Practice" button that is not on the Learn It panel and should not be.
      // Learn It is pre-work FOR Explore, so it hands off to Explore — see the
      // canonical-order comment in openExtra("learn") in engine/core/app.js —
      // and jumping straight to Practice is the skipped-phase bug that hand-off
      // exists to prevent. The spec was pinning the old behaviour, so the shell
      // was reported broken for doing the right thing.
      await page.getByRole("button", { name: "Continue to Vocab →" }).click();
      await expect(page.locator(".extra-panel")).toHaveAttribute("aria-label", "Vocabulary");
      await page.getByRole("button", { name: "Continue to Learn It" }).click();
      await expect(page.locator(".extra-panel")).toHaveAttribute("aria-label", "Learn It");
      await page.getByRole("button", { name: "Continue to Explore" }).click();
      await expect(page.locator(".phase-btn.active")).toContainText("Explore");

      // Explore is the first GRADED phase in the chain, so it is the first hop
      // with no labelled "Continue to …" of its own on these lessons: that
      // button is rendered on the Turn & Talk path, and 1-1 and 10-3 open on an
      // interactive activity instead. The shell's own next control is what a
      // student who has read the phase without finishing the activity uses, and
      // the no-dead-ends property this spec is really about is that it works.
      await page.getByRole("button", { name: "Go to the next part of the lesson" }).click();
      await expect(page.locator(".phase-btn.active")).toContainText("Practice");
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
