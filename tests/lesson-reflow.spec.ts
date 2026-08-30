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
    test(`every step of the lesson offers a way forward: ${lessonPath}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto(`${lessonPath}?sn=Navigation%20Tester`, { waitUntil: "networkidle" });
      await enterLesson(page);

      // Asserted as a PROPERTY, not as a list of labels — the same reasoning
      // tests/small-group-present.spec.ts gives for the presenter rail, and for
      // the same reason: this spec used to walk a named chain
      // ("Continue to Phase 2: Objectives 🎯" → "Continue to Phase 3: Launch 🚀")
      // and the lesson shell moved to the 3-Act model underneath it. Act 1
      // Warm-Up, Act 2 Lesson and Act 3 Exit Ticket are the phases now, and
      // Objectives, Launch and the rest became STEPS inside them — see the
      // phaseConfigs comment in engine/core/app.js ("The 3-Act names are the
      // default because that is what a Reveal lesson is"). Nothing was broken;
      // the spec was pinning names, so it went red on a deliberate change and
      // stayed red.
      //
      // What the spec is actually FOR survives that intact, and it is stated in
      // its own words further down: "the no-dead-ends property this spec is
      // really about". So that is what it asserts now — at every step a student
      // can reach, there is a visible control that moves them on, all the way
      // through all three Acts. Renaming a step, regrouping the strip, or
      // adding a sub-step cannot make this stale again; only a genuine dead end
      // can fail it.
      const forward = () =>
        page.evaluate(() => {
          const visible = (el: Element) => {
            const style = getComputedStyle(el);
            const box = el.getBoundingClientRect();
            return (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              box.width > 0 &&
              box.height > 0
            );
          };
          const label = (el: Element) =>
            (el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim();
          const button = Array.from(document.querySelectorAll("button")).find(
            (el) => /^(Next:|Continue|Go to the next part)/i.test(label(el)) && visible(el),
          );
          const notice = document.querySelector("#nw-notice");
          const wonder = document.querySelector("#nw-wonder");
          return {
            act: (document.querySelector(".phase-btn.active")?.textContent || "")
              .replace(/\s+/g, " ")
              .trim(),
            next: button ? label(button) : null,
            // Notice & Wonder gates its own hand-off, so the walk has to answer
            // it rather than route around it — a student cannot skip it either.
            gate: !!(notice && wonder && visible(notice) && visible(wonder)),
          };
        });

      const walked: string[] = [];
      const acts = new Set<string>();
      let reachedExitTicket = false;

      // Generous cap: the chain is ~14 hops on 1-1 today and may grow. This is a
      // runaway guard, not an expected length — asserting a step COUNT would be
      // the same brittleness in another costume.
      for (let step = 0; step < 40; step += 1) {
        const state = await forward();
        if (state.act) acts.add(state.act.replace(/[★\s]+$/u, "").trim());
        if (/Exit Ticket/i.test(state.act)) reachedExitTicket = true;

        expect(
          state.next,
          `dead end after ${walked.length} step(s) — on "${state.act}" a student has no visible way forward. Walked: ${walked.join(" → ")}`,
        ).not.toBeNull();

        if (state.gate) {
          await page.locator("#nw-notice").fill("I notice a math pattern in the example.");
          await page.locator("#nw-wonder").fill("I wonder how the pattern helps me solve it.");
        }

        const clicked = await page.evaluate((wanted) => {
          const visible = (el: Element) => {
            const style = getComputedStyle(el);
            const box = el.getBoundingClientRect();
            return style.display !== "none" && box.width > 0 && box.height > 0;
          };
          const button = Array.from(document.querySelectorAll("button")).find(
            (el) =>
              (el.getAttribute("aria-label") || el.textContent || "")
                .replace(/\s+/g, " ")
                .trim() === wanted && visible(el),
          );
          if (!button) return false;
          (button as HTMLElement).click();
          return true;
        }, state.next as string);

        expect(clicked, `"${state.next}" was visible but could not be clicked`).toBe(true);
        walked.push(state.next as string);
        if (reachedExitTicket) break;
        await page.waitForTimeout(400);
      }

      // All three Acts, in one unbroken walk from the top of the lesson.
      expect(reachedExitTicket, `never reached Act 3. Walked: ${walked.join(" → ")}`).toBe(true);
      expect(acts.size, `expected all three Acts, saw: ${[...acts].join(", ")}`).toBeGreaterThanOrEqual(3);
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
