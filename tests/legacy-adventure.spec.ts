/**
 * Legacy game adventure layer (math/games/shared/legacy-adventure.js) on all
 * 22 legacy game pages. Each page must mount its own world, award mission
 * supplies exactly once per validated correct answer through the native
 * checker, keep progress across a reload, and fit a 390px phone.
 *
 * Run against the dev server:
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:4190 npx playwright test tests/legacy-adventure.spec.ts
 */
import { expect, type Page, test } from "@playwright/test";

type Recipe = {
  path: string;
  /** Reach the screen where a question is live. */
  start: (page: Page) => Promise<void>;
  /** Produce one correct answer through the native game. */
  solve: (page: Page) => Promise<void>;
  /** Re-fire the same success event for the same question (should not award). */
  repeat: (page: Page) => Promise<void>;
};

const earned = (page: Page) =>
  page.evaluate(() => (window as any).__cabinetAdventure?.getState().earned ?? -1);

async function dismissBrief(page: Page) {
  const brief = page.getByRole("button", { name: /Got it/ });
  if (await brief.count()) await brief.first().click();
}

async function open(page: Page, path: string, errors: string[]) {
  page.on("pageerror", (error) => errors.push(error.message));
  // game-fx.js shows a one-time mission brief per tab; mark it seen so it
  // cannot cover the controls a recipe clicks (it appears 1.5-3s after load).
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem(`gfx-brief:${location.pathname}`, "1");
    } catch {}
  });
  await page.goto(path);
  await page.waitForFunction(() => !!(window as any).__cabinetAdventure, null, { timeout: 15_000 });
  await dismissBrief(page);
}

// RECIPES_START
// Top-level game state declared by each legacy page's classic script.
declare const S: any;
declare function trueRel(duel: any): string;

async function domStart(page: Page) {
  await page.locator("#vocab-go").click();
  await page.locator('[data-level="1"]').first().click();
  await expect(page.locator("#screen-play.on")).toBeVisible();
}

async function clickTimes(page: Page, selector: string, times: number) {
  for (let i = 0; i < times; i++) await page.locator(selector).first().click();
}

/** Click a point given in Phaser game coordinates on the scaled canvas. */
async function clickGame(page: Page, x: number, y: number) {
  const canvas = page.locator(".legacy-phaser-host canvas");
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  const width = await page.evaluate(() => Number((window as any).__legacyAdventureGame.config.width));
  const scale = (box?.width ?? width) / width;
  await canvas.click({ position: { x: x * scale, y: y * scale } });
}

/** Number shown on a Phaser number-line marker (depth-605 container). */
const markerValue = (page: Page) =>
  page.evaluate(() => {
    const scene = (window as any).__legacyAdventureGame.scene.getScene("Game");
    const marker = scene.children.list.find((c: any) => c.type === "Container" && c.depth === 605);
    return Number(marker.list.find((o: any) => o.type === "Text").text);
  });

async function dialMarker(page: Page, answer: number) {
  await page.locator(".legacy-phaser-host canvas").focus();
  // The marker starts at 0; the games require one move before submitting.
  await page.keyboard.press("ArrowRight");
  for (let i = 0; i < 400; i++) {
    const value = await markerValue(page);
    if (value === answer) break;
    await page.keyboard.press(value < answer ? "ArrowRight" : "ArrowLeft");
  }
  expect(await markerValue(page)).toBe(answer);
  await page.keyboard.press("Enter");
}

const recipes: Recipe[] = [
  {
    path: "/math/unit-1/6-ns-b-2game/",
    start: domStart,
    async solve(page) {
      for (let i = 0; i < 20; i++) {
        const n = await page.evaluate(() => {
          if (S.cur.ore === 0) return 0;
          const most = Math.floor(S.cur.ore / S.cur.divisor);
          const options = [...document.querySelectorAll<HTMLElement>("#groups .grp")].map((b) =>
            Number(b.dataset.n),
          );
          return Math.max(...options.filter((v) => v <= most));
        });
        if (!n) break;
        await page.locator(`#groups .grp[data-n="${n}"]`).click();
        await page.locator("#blast").click();
      }
    },
    async repeat(page) {
      await page.locator("#blast").click();
    },
  },
  {
    path: "/math/unit-1/6-ns-b-3game/",
    start: domStart,
    async solve(page) {
      for (let i = 0; i < 60; i++) {
        const d = await page.evaluate(() => {
          const gap = S.cur.target - S.fillCu;
          if (gap === 0) return 0;
          const steps = [...document.querySelectorAll<HTMLElement>("#pour-row [data-d]")]
            .map((b) => Number(b.dataset.d))
            .filter((v) => Math.sign(v) === Math.sign(gap) && Math.abs(v) <= Math.abs(gap));
          return steps.sort((a, b) => Math.abs(b) - Math.abs(a))[0] ?? 0;
        });
        if (!d) break;
        await page.locator(`#pour-row [data-d="${d}"]`).first().click();
      }
      await page.locator("#serve-btn").click();
    },
    async repeat(page) {
      await page.evaluate(() => document.querySelector<HTMLButtonElement>("#serve-btn")?.click());
      await page.keyboard.press("Enter");
    },
  },
  {
    path: "/math/unit-1/6-ns-b-4game/",
    async start(page) {
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame?.scene.getScene("Title")?.sys.isActive());
      await page.locator(".legacy-phaser-host canvas").focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => (window as any).__legacyAdventureGame.scene.getScene("Game")?.sys.isActive());
    },
    async solve(page) {
      await page.evaluate(() => {
        const gs = (window as any).__legacyAdventureGame.scene.getScene("Game");
        gs.keys = 1;
        const chest = gs.chests.getChildren().find((c: any) => !c.getData("opened"));
        gs.__testChest = chest;
        gs.hitChest(chest);
      });
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame.scene.getScene("Game").vennTiles);
      await page.evaluate(() => {
        const gs = (window as any).__legacyAdventureGame.scene.getScene("Game");
        const count = (list: number[]) => list.reduce((m: any, v) => ((m[v] = (m[v] || 0) + 1), m), {});
        const a = count(gs.currentQ.primeA);
        const b = count(gs.currentQ.primeB);
        // Place each prime tile where it belongs: shared factors overlap.
        for (const tile of gs.vennTiles) {
          const v = tile.value;
          if (a[v] > 0 && b[v] > 0) {
            tile.zone = "overlap";
            a[v]--;
            b[v]--;
          } else if (a[v] > 0) {
            tile.zone = "left";
            a[v]--;
          } else {
            tile.zone = "right";
            b[v]--;
          }
        }
        gs.submitVenn(gs.__testChest);
      });
    },
    async repeat(page) {
      await page.evaluate(() => {
        const gs = (window as any).__legacyAdventureGame.scene.getScene("Game");
        (window as any).LegacyAdventure.reward(gs.currentQ);
      });
    },
  },
  {
    path: "/math/unit-1/supplemental/6-1game/",
    start: domStart,
    async solve(page) {
      await clickTimes(page, "#btn-place", await page.evaluate(() => S.cur.target));
      await page.locator("#btn-door").click();
    },
    async repeat(page) {
      await page.locator("#btn-door").click();
      await page.locator("#btn-door").press("Enter");
    },
  },
  {
    path: "/math/unit-2/6-ns-a-1game/",
    start: domStart,
    async solve(page) {
      await clickTimes(page, "#btn-plus", await page.evaluate(() => S.cur.quotient));
      await page.locator("#btn-dive").click();
    },
    async repeat(page) {
      await page.locator("#btn-dive").click();
    },
  },
  {
    path: "/math/unit-4/6-rp-a-2game/",
    start: domStart,
    async solve(page) {
      await clickTimes(page, "#dial-up", await page.evaluate(() => S.cur.rate));
      await page.locator("#ship").click();
    },
    async repeat(page) {
      await page.locator("#ship").click();
    },
  },
  {
    path: "/math/unit-4/6-rp-a-3game/",
    start: domStart,
    async solve(page) {
      const offers = await page.evaluate(() => S.cur.offers.map((o: any) => o.totalC / o.qty));
      for (const cents of offers) {
        await page.keyboard.type(String(cents));
        await page.keyboard.press("Enter");
      }
      const pick = offers[0] === offers[1] ? -1 : offers[0] < offers[1] ? 0 : 1;
      await page.locator(`#choose [data-choice="${pick}"]`).click();
    },
    async repeat(page) {
      await page.evaluate(() => document.querySelector<HTMLElement>("#choose [data-choice]")?.click());
      await page.keyboard.press("Enter");
    },
  },
  {
    path: "/math/unit-5/supplemental/parallelogramandrhombusgame/",
    start: domStart,
    async solve(page) {
      const { b, h } = await page.evaluate(() => ({ b: S.cur.b, h: S.cur.h }));
      for (let i = 1; i < b; i++) await page.keyboard.press("ArrowRight");
      for (let i = 1; i < h; i++) await page.keyboard.press("ArrowUp");
      await page.keyboard.press("Enter");
    },
    async repeat(page) {
      await page.keyboard.press("Enter");
      await page.evaluate(() => document.querySelector<HTMLElement>("#build-go")?.click());
    },
  },
  {
    path: "/math/unit-7/6-ns-c-3game/",
    async start(page) {
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame?.scene.getScene("Title")?.sys.isActive());
      await page.evaluate(() => {
        const g = (window as any).__legacyAdventureGame;
        g.scene.getScene("Title").scene.start("Game", { charColor: 0x38bdf8 });
      });
      await page.waitForFunction(() => (window as any).__legacyAdventureGame.scene.getScene("Game")?.sys.isActive());
      await page.evaluate(() => (window as any).__legacyAdventureGame.scene.getScene("Game").reachGoal());
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame.scene.getScene("Game").isQuestionActive);
    },
    async solve(page) {
      const answer = await page.evaluate(() => {
        const s = (window as any).__legacyAdventureGame.scene.getScene("Game");
        return s.currentQuestions[s.currentQIndex].ans;
      });
      await dialMarker(page, answer);
    },
    async repeat(page) {
      await page.keyboard.press("Enter");
    },
  },
  {
    path: "/math/unit-7/6-ns-c-5game/",
    async start(page) {
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame?.scene.getScene("Title")?.sys.isActive());
      await page.evaluate(() => {
        const g = (window as any).__legacyAdventureGame;
        g.scene.getScene("Title").scene.start("Game", { mode: 0 });
      });
      await page.waitForFunction(() => (window as any).__legacyAdventureGame.scene.getScene("Game")?.sys.isActive());
      await page.evaluate(() => {
        const s = (window as any).__legacyAdventureGame.scene.getScene("Game");
        const draw = s.drawQuestionThermo;
        s.drawQuestionThermo = function (...args: any[]) {
          s.__testQuestion = args[1];
          return draw.apply(this, args);
        };
        s.showQuestion();
      });
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame.scene.getScene("Game").__testQuestion);
    },
    async solve(page) {
      await dialMarker(
        page,
        await page.evaluate(() => (window as any).__legacyAdventureGame.scene.getScene("Game").__testQuestion.ans),
      );
    },
    async repeat(page) {
      await page.keyboard.press("Enter");
    },
  },
  {
    path: "/math/unit-7/6-ns-c-6game/",
    async start(page) {
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame?.scene.getScene("Title")?.sys.isActive());
      await page.evaluate(() => {
        const g = (window as any).__legacyAdventureGame;
        g.scene.getScene("Title").scene.start("Game", { shipTint: 0x8b5cf6 });
      });
      await page.waitForFunction(
        () => {
          const s = (window as any).__legacyAdventureGame.scene.getScene("Game");
          return !!s?.activeMission && s.canMove;
        },
        null,
        { timeout: 15_000 },
      );
    },
    async solve(page) {
      const move = await page.evaluate(() => {
        const s = (window as any).__legacyAdventureGame.scene.getScene("Game");
        let best: number[] | null = null;
        for (let x = -10; x <= 10; x++)
          for (let y = -10; y <= 10; y++)
            if (s.activeMission.test(x, y)) {
              const d = Math.abs(x - s.shipGridX) + Math.abs(y - s.shipGridY);
              if (!best || d < best[2]) best = [x - s.shipGridX, y - s.shipGridY, d];
            }
        return best;
      });
      expect(move).not.toBeNull();
      const [dx, dy] = move as number[];
      await page.locator(".legacy-phaser-host canvas").focus();
      const steps = [
        ...Array(Math.abs(dx)).fill(dx > 0 ? "ArrowRight" : "ArrowLeft"),
        ...Array(Math.abs(dy)).fill(dy > 0 ? "ArrowUp" : "ArrowDown"),
      ];
      for (const key of steps) {
        await page.keyboard.down(key);
        await page.waitForTimeout(60);
        await page.keyboard.up(key);
        await page.waitForTimeout(240);
      }
      await page.keyboard.press("Space");
    },
    async repeat(page) {
      await page.keyboard.press("Space");
    },
  },
  {
    path: "/math/unit-7/6-ns-c-8game/",
    async start(page) {
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame?.scene.getScene("Title")?.sys.isActive());
      await page.evaluate(() => {
        const g = (window as any).__legacyAdventureGame;
        g.scene.getScene("Title").scene.start("Game", { range: 3 });
      });
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame.scene.getScene("Game")?.currentTask);
    },
    async solve(page) {
      const cell = await page.evaluate(() => {
        const s = (window as any).__legacyAdventureGame.scene.getScene("Game");
        const t = s.currentTask.question;
        return [s.ox + t.targetX * s.cs, s.oy - t.targetY * s.cs];
      });
      await clickGame(page, cell[0], cell[1]);
      (globalThis as any).__cityCell = cell;
    },
    async repeat(page) {
      const cell = (globalThis as any).__cityCell;
      await clickGame(page, cell[0], cell[1]);
    },
  },
  {
    path: "/math/unit-8/game-equations-quest/",
    start: domStart,
    async solve(page) {
      const { lx, lc } = await page.evaluate(() => ({ lx: S.cur.lx, lc: S.cur.lc }));
      if (lx === 1) await clickTimes(page, "#op-sub", lc);
      else await page.locator("#op-div").click();
    },
    async repeat(page) {
      await page.evaluate(() => document.querySelector<HTMLElement>("#op-sub")?.click());
    },
  },
  {
    path: "/math/unit-9/6-ee-9gamereview/",
    start: domStart,
    async solve(page) {
      const y = await page.evaluate(() => S.cur.m * S.cur.xs[S.cur.idx] + S.cur.b);
      await clickTimes(page, "#dial-up", y);
      await page.locator("#lock").click();
    },
    async repeat(page) {
      await page.evaluate(() => (window as any).LegacyAdventure.reward(S.cur, S.cur.idx));
    },
  },
  {
    path: "/math/unit-9/6-ee-c-9game/",
    async start(page) {
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame?.scene.getScene("Title")?.startBtn);
      await page.evaluate(() =>
        (window as any).__legacyAdventureGame.scene.getScene("Title").startBtn.emit("pointerdown"),
      );
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame.scene.getScene("Game")?.questionActive, null, {
        timeout: 15_000,
      });
    },
    async solve(page) {
      await page.evaluate(() => {
        const g = (window as any).__legacyAdventureGame.scene.getScene("Game");
        g.__testHit = g.currentAsteroids.find((a: any) => a.isCorrect);
        g.resolveAnswer(g.__testHit);
      });
    },
    async repeat(page) {
      await page.evaluate(() => {
        const g = (window as any).__legacyAdventureGame.scene.getScene("Game");
        g.resolveAnswer(g.__testHit);
      });
    },
  },
  {
    path: "/math/unit-9/6-ee-c-9martiangame/",
    start: domStart,
    async solve(page) {
      await clickTimes(page, "#inc", await page.evaluate(() => S.cur.y));
      await page.locator("#drive").click();
    },
    async repeat(page) {
      await page.locator("#drive").click();
    },
  },
  {
    path: "/math/unit-9/6-ee-c-9variablevelocitygame/",
    start: domStart,
    async solve(page) {
      await page.locator("#c-y").fill(String(await page.evaluate(() => S.cur.y)));
      await page.locator("#c-y").press("Enter");
    },
    async repeat(page) {
      await page.locator("#c-y").press("Enter");
    },
  },
  {
    path: "/math/unit-9/cloudflare-pages-game-for-6-ee-9/",
    start: domStart,
    async solve(page) {
      const x = await page.evaluate(() => S.cur.solution);
      await page.locator("#x-input").fill(String(x));
      await page.locator("#solve-btn").click();
      await page.locator(`#plats-buttons .plat[data-val="${x}"]`).click();
      (globalThis as any).__leapX = x;
    },
    async repeat(page) {
      await page.evaluate(
        (x) => document.querySelector<HTMLElement>(`#plats-buttons .plat[data-val="${x}"]`)?.click(),
        (globalThis as any).__leapX,
      );
    },
  },
  {
    path: "/math/unit-9/game-variable-voyage/",
    start: domStart,
    async solve(page) {
      for (let i = 0; i < 10 && (await page.locator("#machine .tok-slot:not(.filled)").count()); i++) {
        await page.locator("#value-tile").click();
        await page.locator("#machine .tok-slot:not(.filled)").first().click();
      }
      for (let i = 0; i < 10 && (await page.locator("#machine .tok-op.ready").count()); i++)
        await page.locator("#machine .tok-op.ready").first().click();
    },
    async repeat(page) {
      await page.keyboard.press("Enter");
    },
  },
  {
    path: "/math/unit-9/variablecomparisongame/",
    start: domStart,
    async solve(page) {
      const duel = await page.evaluate(() => ({ lv: S.cur.lv, rv: S.cur.rv, rel: trueRel(S.cur) }));
      await clickTimes(page, '.step[data-side="a"][data-dir="1"]', duel.lv);
      await clickTimes(page, '.step[data-side="b"][data-dir="1"]', duel.rv);
      await page.locator(`.cmp[data-rel="${duel.rel}"]`).click();
      (globalThis as any).__duelRel = duel.rel;
    },
    async repeat(page) {
      await page.evaluate(
        (rel) => document.querySelector<HTMLElement>(`.cmp[data-rel="${rel}"]`)?.click(),
        (globalThis as any).__duelRel,
      );
    },
  },
  {
    path: "/math/statistics/6-sp-a-1game/",
    async start(page) {
      await page.waitForFunction(() => !!(window as any).__legacyAdventureGame?.scene.getScene("Title")?.sys.isActive());
      const width = await page.evaluate(() => Number((window as any).__legacyAdventureGame.config.width));
      await clickGame(page, width / 2, 432);
      await page.waitForFunction(() => (window as any).__legacyAdventureGame.scene.getScene("Vocab")?.sys.isActive());
      await page.evaluate(() => {
        const v = (window as any).__legacyAdventureGame.scene.getScene("Vocab");
        v.scene.start("Game", v.payload);
      });
      await page.waitForFunction(
        () => (window as any).__legacyAdventureGame.scene.getScene("Game")?.witnesses?.length > 0,
      );
    },
    async solve(page) {
      const key = await page.evaluate(() => {
        const s = (window as any).__legacyAdventureGame.scene.getScene("Game");
        for (const w of s.witnesses) if (!w.polled) s.pollWitness(w);
        return s.observedSpread() > 0 ? "f" : "g";
      });
      await page.locator(".legacy-phaser-host canvas").focus();
      await page.keyboard.press(key);
      (globalThis as any).__caseKey = key;
    },
    async repeat(page) {
      await page.keyboard.press((globalThis as any).__caseKey);
    },
  },
  {
    path: "/math/statistics/mean-median-mode-game/",
    start: domStart,
    async solve(page) {
      const bars = await page.evaluate(() => ({ bars: S.bars.slice(), target: S.cur.target }));
      const step = (i: number, up: boolean) => page.locator("#chart .col").nth(i).locator(".step").nth(up ? 0 : 1);
      for (let i = 0; i < bars.bars.length; i++) {
        const diff = bars.target - bars.bars[i];
        for (let k = 0; k < Math.abs(diff); k++) await step(i, diff > 0).click();
      }
      // Some rounds start on target; supplies need the student's own change.
      if (bars.bars.every((v: number) => v === bars.target)) {
        await step(0, true).click();
        await step(0, false).click();
      }
      await page.locator("#lock-in").click();
    },
    async repeat(page) {
      await page.evaluate(() => document.querySelector<HTMLElement>("#lock-in")?.click());
    },
  },
];
// RECIPES_END

// Phaser pages boot slowly on a loaded machine; allow headroom.
test.describe.configure({ mode: "parallel", timeout: 90_000 });

for (const recipe of recipes) {
  test.describe(recipe.path, () => {
    test("awards once per solved problem and keeps progress after reload", async ({ page }) => {
      const errors: string[] = [];
      await page.setViewportSize({ width: 1366, height: 768 });
      await page.addInitScript(() => {
        if (sessionStorage.getItem("legacy-test-cleared")) return;
        localStorage.clear();
        sessionStorage.setItem("legacy-test-cleared", "1");
      });
      await open(page, recipe.path, errors);
      await expect(page.locator(".mission-nav.legacy-nav")).toHaveCount(1);
      await expect(page.locator(".legacy-adventure-host")).toHaveCount(1);
      await expect(page.locator(".legacy-trail-path li")).toHaveCount(4);
      expect(await earned(page)).toBe(0);
      await recipe.start(page);
      // Nothing covers the player toolbar, and the adventure bar sits above the game.
      const layout = await page.evaluate(() => {
        const covered = [...document.querySelectorAll<HTMLElement>(".studio-toolbar button, .studio-toolbar a")]
          .filter((el) => el.offsetParent)
          .filter((el) => {
            const r = el.getBoundingClientRect();
            const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
            return r.bottom > 0 && r.top < innerHeight && hit && !el.contains(hit);
          })
          .map((el) => el.textContent);
        const nav = document.querySelector(".mission-nav")!.getBoundingClientRect();
        const host = document.querySelector(".legacy-adventure-host")!.getBoundingClientRect();
        return { covered, navAboveHost: nav.bottom <= host.top + 1 };
      });
      expect(layout.covered).toEqual([]);
      expect(layout.navAboveHost).toBe(true);
      await recipe.solve(page);
      await expect.poll(() => earned(page)).toBe(1);
      await recipe.repeat(page);
      await page.waitForTimeout(150);
      expect(await earned(page)).toBe(1);
      const supplies = await page.evaluate(
        () => (window as any).__cabinetAdventure.getState().supplies,
      );
      expect(supplies).toBe(4);
      await page.reload();
      await page.waitForFunction(() => !!(window as any).__cabinetAdventure);
      expect(await earned(page)).toBe(1);
      await expect(page.locator(".mission-nav [data-view=mission]")).toContainText("4 supplies");
      expect(errors).toEqual([]);
    });

    test("fits a 390px phone and the mission chart opens and closes", async ({ page }) => {
      const errors: string[] = [];
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page, recipe.path, errors);
      await recipe.start(page);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
      const nav = page.locator(".mission-nav");
      await nav.scrollIntoViewIfNeeded();
      // Keyboard: the Mission chart button is reachable and opens with Enter.
      await nav.locator("[data-view=mission]").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator(".cabinet-adventure")).toBeVisible();
      await expect(page.locator(".cabinet-adventure [data-mission-action=check]")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.locator(".cabinet-adventure")).toBeHidden();
      // Reduced motion: an award shows no floating "+4" animation.
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => (window as any).LegacyAdventure.reward({ test: "reduced-motion" }));
      await expect(page.locator(".legacy-trail-rank")).toBeVisible();
      await expect(page.locator(".legacy-reward-burst")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  });
}

test("game shortcuts do not act behind the open mission chart", async ({ page }) => {
  const errors: string[] = [];
  await open(page, "/math/unit-9/6-ee-9gamereview/", errors);
  await domStart(page);
  await page.locator(".mission-nav [data-view=mission]").click();
  await expect(page.locator(".cabinet-adventure")).toBeVisible();
  const before = await page.evaluate(() => ({ dial: S.dial, lives: S.lives }));
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("ArrowUp");
  expect(await page.evaluate(() => ({ dial: S.dial, lives: S.lives }))).toEqual(before);
  await page.keyboard.press("Escape");
  await expect(page.locator(".cabinet-adventure")).toBeHidden();
  await page.locator("body").press("ArrowUp");
  expect(await page.evaluate(() => S.dial)).toBe(before.dial + 1);
  expect(errors).toEqual([]);
});

test("Variable Blaster pays again for a question met in a new game", async ({ page }) => {
  const errors: string[] = [];
  await open(page, "/math/unit-9/6-ee-c-9game/", errors);
  const blaster = recipes.find((r) => r.path === "/math/unit-9/6-ee-c-9game/")!;
  await blaster.start(page);
  const first = await page.evaluate(() => {
    const g = (window as any).__legacyAdventureGame.scene.getScene("Game");
    return g.currentQuestion;
  });
  await blaster.solve(page);
  await expect.poll(() => earned(page)).toBe(1);
  // The same pool question in a later wave is new work and earns again.
  await page.evaluate((q) => {
    const g = (window as any).__legacyAdventureGame.scene.getScene("Game");
    g.questionWave = { q };
    g.questionActive = true;
    g.resolveAnswer({ isCorrect: true, destroy() {}, x: 0, y: 0 });
  }, first);
  await expect.poll(() => earned(page)).toBe(2);
  expect(errors).toEqual([]);
});
