// E2E journey 6, MOBILE FAMILY: a touch context at 375x667 and again at 320x568. Navigate the home, tap Start, tap the models of
// at least three different games, finish the session, and return home. At every screen: no horizontal overflow; every control in
// the shell is at least 44px; no control is hidden behind the sticky action bar or the floating Save/Resume pill once it is
// scrolled to the middle of the screen; the pill never sits on top of a control at either end of the page.
// @fm2 FM-085 FM-039
import {
  activitiesOf,
  clickNext,
  hasOverflow,
  hasSolver,
  isVisible,
  openHome,
  playSession,
  run,
  shellInfo,
  smallTargets,
  solveUi,
  storeOf,
  text,
} from "./e2e-kit.mjs";

const VIEWPORTS = [
  { width: 375, height: 667 },
  { width: 320, height: 568 },
];
const IGNORE = /^a:Skip to|Save \/ Resume|nsr-/i;

// Controls hidden behind something else once they are scrolled to the middle, and controls under the Save/Resume pill.
async function coverage(page, scope) {
  return page.evaluate((sel) => {
    const controls = [
      ...document.querySelectorAll(
        `${sel} button, ${sel} input:not([type=hidden]), ${sel} a[href], ${sel} select, ${sel} [role=button], ${sel} textarea`,
      ),
    ].filter((el) => {
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return (
        r.width > 0 &&
        r.height > 0 &&
        style.visibility !== "hidden" &&
        !el.closest("[hidden], dialog:not([open]), #nsr-root, .fm2-sr")
      );
    });
    const name = (el) =>
      `${el.tagName.toLowerCase()}:${(el.getAttribute("aria-label") || el.textContent || el.id || el.className).toString().trim().slice(0, 24)}`;
    const covered = [];
    const behindPill = [];
    const pill = document.querySelector("#nsr-root");
    const overlaps = (a, b) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    for (const el of controls) {
      el.scrollIntoView({ block: "center", inline: "nearest" });
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      if (x < 0 || x > innerWidth) continue; // inside an internal horizontal scroller
      const top = document.elementFromPoint(x, y);
      if (!top || !(el.contains(top) || top.contains(el) || top.closest("label")?.contains(el)))
        covered.push(`${name(el)} under ${name(top || document.body)}`);
      if (pill) {
        const p = pill.firstElementChild?.getBoundingClientRect();
        if (p && p.width && overlaps(r, p)) behindPill.push(name(el));
      }
    }
    return { covered, behindPill, count: controls.length };
  }, scope);
}
async function pillAtEnds(page) {
  // The shell pins its action bar and the pill follows the scroll; wait for both to settle before measuring.
  await page.waitForTimeout(250);
  return page.evaluate(() => {
    const out = [];
    const overlaps = (a, b) =>
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    for (const where of ["top", "bottom"]) {
      scrollTo(0, where === "top" ? 0 : document.documentElement.scrollHeight);
      // Measure the pill AFTER each scroll: it moves with the page, so a rect taken before scrolling is stale.
      const pill = document.querySelector("#nsr-root")?.firstElementChild?.getBoundingClientRect();
      if (!pill || !pill.width) continue;
      for (const el of document.querySelectorAll(
        "[data-fm2-shell] button, [data-fm2-shell] input:not([type=hidden]), [data-fm2-shell] a[href], .sr-card button, .sr-card a[href], .fm2-finish button",
      )) {
        const r = el.getBoundingClientRect();
        if (
          r.width &&
          r.height &&
          !el.closest("[hidden], dialog:not([open])") &&
          getComputedStyle(el).visibility !== "hidden" &&
          overlaps(r, pill)
        )
          out.push(
            `${where}: ${(el.getAttribute("aria-label") || el.textContent).trim().slice(0, 24)}`,
          );
      }
    }
    scrollTo(0, 0);
    return out;
  });
}

await run("e2e-mobile-family", async (h, T) => {
  for (const vp of VIEWPORTS) {
    const label = `${vp.width}px`;
    const context = await h.context({ ...vp, touch: true });
    const page = await openHome(h, context, { grade: 4 });

    T.section(`mobile ${label}: home`);
    T.ok(!(await hasOverflow(page)), `${label} home: no horizontal overflow`);
    T.eq(
      (await smallTargets(page)).filter((x) => !IGNORE.test(x)),
      [],
      `${label} home: every control is at least 44px`,
    );
    const startBox = await page.locator("[data-testid=start-session]").boundingBox();
    T.ok(
      startBox && startBox.width >= 44 && startBox.height >= 44,
      `${label} home: Start is a large target (${Math.round(startBox.width)}x${Math.round(startBox.height)})`,
    );
    await page.locator("[data-testid=grade-5]").tap();
    await page.locator("[data-testid=minutes-15]").check();
    T.eq(
      await page.locator("[data-testid=grade-5]").getAttribute("aria-pressed"),
      "true",
      `${label} home: tapping a grade selects it`,
    );

    T.section(`mobile ${label}: tap through a session`);
    await page.locator("[data-testid=start-session]").tap();
    await page.waitForSelector("[data-fm2-shell]");
    const tapped = new Set();
    const audits = [];
    const log = await playSession(page, T, {
      how: "tap",
      choose: ({ index }) => (index === 0 ? "ui" : "seam"),
      custom: async (info, p) => {
        // audit this round's screen (unsolved) before answering it; the answer itself is then given by the default path
        if (info.index > 0) return null;
        const bar = await p.locator(".fm2-toolbar").boundingBox();
        const sticky = await p.evaluate(
          () => getComputedStyle(document.querySelector(".fm2-toolbar")).position,
        );
        audits.push({
          game: info.gameId,
          hasOverflow: await hasOverflow(p),
          small: (await smallTargets(p)).filter((x) => !IGNORE.test(x)),
          cover: await coverage(p, "[data-fm2-shell]"),
          pill: await pillAtEnds(p),
          sticky,
          bar,
        });
        return null;
      },
      onRound: async (row, info, p) => {
        if (row.via === "ui") tapped.add(info.gameId);
        if (info.index === 0) {
          // the same screen once solved: Next is showing
          const next = await p.locator("[data-fm2-next]").boundingBox();
          const cover = await coverage(p, "[data-fm2-shell]");
          const pill = await pillAtEnds(p);
          T.eq(
            cover.covered,
            [],
            `${label} ${info.gameId} solved: nothing hidden behind another element (${cover.count} controls)`,
          );
          T.eq(pill, [], `${label} ${info.gameId} solved: the Save/Resume pill covers no control`);
          T.ok(
            next && next.width >= 44 && next.height >= 44,
            `${label} ${info.gameId} solved: Next is at least 44px (${Math.round(next?.width)}x${Math.round(next?.height)})`,
          );
          T.ok(!(await hasOverflow(p)), `${label} ${info.gameId} solved: no horizontal overflow`);
        }
      },
      onBetween: async (entry, p) => {
        T.ok(
          !(await hasOverflow(p)),
          `${label} between card ${entry.step}: no horizontal overflow`,
        );
        T.eq(
          (await smallTargets(p)).filter((x) => !IGNORE.test(x)),
          [],
          `${label} between card ${entry.step}: controls are at least 44px`,
        );
        T.eq(
          await pillAtEnds(p),
          [],
          `${label} between card ${entry.step}: the pill covers no control`,
        );
      },
    });
    for (const a of audits) {
      T.ok(!a.hasOverflow, `${label} ${a.game}: no horizontal overflow`);
      T.eq(a.small, [], `${label} ${a.game}: every control in the shell is at least 44px`);
      T.eq(
        a.cover.covered,
        [],
        `${label} ${a.game}: nothing is hidden behind the sticky bar or another element (${a.cover.count} controls)`,
      );
      T.eq(
        a.cover.behindPill,
        [],
        `${label} ${a.game}: no control sits behind the Save/Resume pill`,
      );
      T.eq(
        a.pill,
        [],
        `${label} ${a.game}: the Save/Resume pill is clear of every control at the top and bottom of the page`,
      );
      T.ok(
        a.bar && a.bar.height >= 44,
        `${label} ${a.game}: the action bar is ${Math.round(a.bar?.height)}px tall`,
      );
    }
    T.eq(audits.length, activitiesOf(log).length, `${label}: every activity was audited`);

    T.section(`mobile ${label}: end screen and home`);
    T.ok(!(await hasOverflow(page)), `${label} end screen: no horizontal overflow`);
    T.eq(
      (await smallTargets(page)).filter((x) => !IGNORE.test(x)),
      [],
      `${label} end screen: controls are at least 44px`,
    );
    T.eq(await pillAtEnds(page), [], `${label} end screen: the pill covers no control`);

    // top up to three different games' models with taps (the plan has three or four activities, some may repeat a mechanic)
    await page.locator("[data-testid=session-home]").tap();
    await page.waitForSelector("[data-testid=game-card]");
    for (const card of await page
      .locator("[data-testid=game-card][data-ready=true]")
      .evaluateAll((c) => c.map((x) => x.dataset.game))) {
      if (tapped.size >= 3 || tapped.has(card) || !hasSolver(card)) continue;
      await page
        .locator(`[data-testid=game-card][data-game=${card}] [data-testid=game-play]`)
        .tap();
      await page.waitForSelector("[data-fm2-shell]");
      T.ok(await solveUi(page, "tap"), `${label}: ${card} model manipulated with taps`);
      await page.waitForFunction(() => window.__fm2.tools.solved);
      tapped.add(card);
      T.ok(!(await hasOverflow(page)), `${label} ${card}: no horizontal overflow`);
      T.eq(
        (await smallTargets(page)).filter((x) => !IGNORE.test(x)),
        [],
        `${label} ${card}: every control is at least 44px`,
      );
      await page.locator("[data-fm2-exit]").tap();
      await page.waitForSelector("[data-testid=game-card]");
    }
    T.ok(
      tapped.size >= 3,
      `${label}: models of ${tapped.size} different games were manipulated with taps (${[...tapped].join(", ")})`,
    );
    const store = await storeOf(page);
    T.eq(store.sessions.length, 1, `${label}: one session recorded`);
    T.ok(
      await isVisible(page, "[data-testid=start-session]"),
      `${label}: back home, Start is available`,
    );
    T.ok(!(await hasOverflow(page)), `${label} home again: no horizontal overflow`);
    await context.close();
  }
});
