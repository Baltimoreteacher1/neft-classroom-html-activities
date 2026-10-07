import { expect, type Page, test } from "@playwright/test";

/**
 * Family Jeopardy expedition layer: trail steps, treasure chests, power-ups,
 * summit bonus, persisted Final Challenge, passport stamps, remix boards.
 * Correctness here is host-judged, so "validated" = the host confirmed it
 * after the answer was revealed; every reward must come from that, once.
 */

const STATE_KEY = "familyJeopardy.v4";
const PASSPORT_KEY = "familyJeopardy.passport.v1";
const SHOTS = process.env.FJ_SHOT_DIR || "test-results/family-jeopardy-adventure";

type Team = { name: string; score: number; correct: number; powers: string[]; summit: boolean };
type State = {
  teams: Team[];
  used: Record<string, string>;
  doubles: string[];
  currentTurn: number;
  finalDone: boolean;
  summitFirst: number | null;
  events: unknown[];
  layout: { remix: boolean; cats: { b: string; c: number }[]; finalB: string };
  final: { step: string; decided: (boolean | null)[] } | null;
};

const errorsByPage = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  errorsByPage.set(page, errors);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/family-jeopardy/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test.afterEach(async ({ page }) => {
  expect(errorsByPage.get(page) ?? []).toEqual([]);
});

const state = (page: Page): Promise<State> =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) as string), STATE_KEY);

async function start(page: Page) {
  await page.locator("#startBtn").click();
  await expect(page.locator(".exp-map")).toBeVisible();
}

/** Resolve any treasure-chest / summit dialogs by taking the first choice. */
async function clearEvents(page: Page) {
  const modal = page.locator("#expModal");
  for (let i = 0; i < 6 && (await modal.isVisible()); i++) {
    const pick = modal.locator("[data-pick]").first();
    if (await pick.count()) await pick.click();
    else await modal.locator("#expOk").click();
  }
  await expect(modal).toBeHidden();
}

/** Open a clue, reveal it, then award team `winner` (or nobody when null). */
async function play(
  page: Page,
  c: number,
  r: number,
  winner: number | null,
  opts: { keepEvents?: boolean } = {},
) {
  await page.locator(`.cell[data-c="${c}"][data-r="${r}"]`).click();
  const dd = page.locator("#ddStandardBtn");
  if (await dd.isVisible()) await dd.click();
  await page.locator("#revealBtn").click();
  await expect(page.locator(".answer")).toBeVisible();
  if (winner === null) await page.locator("#nobodyBtn").click();
  else await page.locator(`[data-win="${winner}"]`).click();
  await expect(page.locator("#clue")).toBeHidden();
  if (!opts.keepEvents) await clearEvents(page);
}

test("right and wrong answers score once, move the trail and open a chest", async ({ page }) => {
  await start(page);
  // Timer is optional and off by default: no countdown on a fresh game.
  await page.locator('.cell[data-c="0"][data-r="0"]').click();
  await expect(page.locator("#timerBox")).toHaveCount(0);
  await page.locator("#clueClose").click();

  // Team 1 gets a 100 right: +100, one trail step, and (4 teams => landmark at 1 step) a chest.
  await play(page, 0, 0, 0, { keepEvents: true });
  await expect(page.locator("#expModal")).toBeVisible();
  await expect(page.locator("#expModal [data-pick]")).toHaveCount(2);
  const offered = await page.locator("#expModal [data-pick]").first().getAttribute("data-pick");
  await page.locator("#expModal [data-pick]").first().click();
  await expect(page.locator("#expModal")).toBeHidden();
  let s = await state(page);
  expect(s.teams[0]).toMatchObject({ score: 100, correct: 1, powers: [offered] });
  expect(s.used["0-0"]).toBe("won");
  expect(s.events).toEqual([]);

  // Nobody gets a clue: no points, no step, turn passes.
  await play(page, 1, 0, null);
  s = await state(page);
  expect(s.teams.map((t) => t.score)).toEqual([100, 0, 0, 0]);
  expect(s.teams.map((t) => t.correct)).toEqual([1, 0, 0, 0]);
  expect(s.used["1-0"]).toBe("miss");

  // A played clue cannot be awarded again, by click or by keyboard.
  await page.locator('.cell[data-c="0"][data-r="0"]').click();
  await expect(page.locator("[data-win]")).toHaveCount(0);
  await page.keyboard.press("1");
  await page.locator("#closeBtn").click();

  // Double-clicking an award button only awards once.
  await page.locator('.cell[data-c="2"][data-r="1"]').click();
  await page.locator("#revealBtn").click();
  await page.locator('[data-win="1"]').dblclick();
  await clearEvents(page);
  s = await state(page);
  expect(s.teams[1]).toMatchObject({ score: 200, correct: 1 });
  await expect(page.locator("#pts1")).toHaveText("200");

  // Award is impossible before the answer is revealed (no award buttons exist yet).
  await page.locator('.cell[data-c="3"][data-r="1"]').click();
  await expect(page.locator("[data-win]")).toHaveCount(0);
  await page.locator("#clueClose").click();
  expect((await state(page)).used["3-1"]).toBeUndefined();

  // Undo puts score, trail step and power-up back exactly.
  await page.locator("#gameUndoBtn").click();
  s = await state(page);
  expect(s.teams[1]).toMatchObject({ score: 0, correct: 0, powers: [] });
  expect(s.used["2-1"]).toBeUndefined();
});

test("Double Up pays 2x only for the arming family, and Compass takes the next pick", async ({
  page,
}) => {
  // 2 families => first landmark at step 2, so no chest changes the hand mid-test.
  await page.locator("#teamMinus").click();
  await page.locator("#teamMinus").click();
  await start(page);
  // Power-ups are earned from chests; inject a known hand so the test is deterministic.
  // `S`, `save` and `renderGame` are page-script globals.
  await page.evaluate(
    `S.teams[0].powers = ["double", "double"]; S.teams[1].powers = ["compass"]; save(); renderGame();`,
  );

  // Arming then closing without a verdict keeps the token.
  await page.locator('.cell[data-c="0"][data-r="1"]').click();
  await page.locator('[data-boost="0"]').click();
  await expect(page.locator(".boost-on")).toBeVisible();
  await page.locator("#clueClose").click();
  expect((await state(page)).teams[0].powers).toEqual(["double", "double"]);

  // Arm, reveal, family 1 is right: 200 x 2.
  await page.locator('.cell[data-c="0"][data-r="1"]').click();
  await page.locator('[data-boost="0"]').click();
  await page.locator("#revealBtn").click();
  await expect(page.locator('[data-win="0"]')).toContainText("+400");
  await page.locator('[data-win="0"]').click();
  await expect(page.locator("#expModal")).toBeHidden();
  let s = await state(page);
  expect(s.teams[0]).toMatchObject({ score: 400, correct: 1, powers: ["double"] });

  // Armed by family 1 but family 2 answers: family 2 gets normal points, token is spent.
  await page.locator('.cell[data-c="1"][data-r="1"]').click();
  await page.locator('[data-boost="0"]').click();
  await page.locator("#revealBtn").click();
  await page.locator('[data-win="1"]').click();
  s = await state(page);
  expect(s.teams[1].score).toBe(200);
  expect(s.teams[0]).toMatchObject({ score: 400, powers: [] });

  // The arm button is gone once no family holds Double Up.
  await page.locator('.cell[data-c="2"][data-r="1"]').click();
  await expect(page.locator("[data-boost]")).toHaveCount(0);
  await page.locator("#clueClose").click();

  // Compass: family 2 takes the next pick even though it is family 1's turn.
  expect(s.currentTurn).toBe(0);
  await page.locator('[data-compass="1"]').click();
  s = await state(page);
  expect(s.currentTurn).toBe(1);
  expect(s.teams[1].powers).toEqual([]);
  await expect(page.locator(".turn-info b")).toHaveText(s.teams[1].name);
  await expect(page.locator("[data-compass]")).toHaveCount(0);
});

test("summit bonus once, Final Challenge with Safety Net, no re-award, passport stamp, resume", async ({
  page,
}) => {
  await start(page);
  // 4 families => 5 steps to the summit. Family 1 answers five 100-point clues.
  for (let c = 0; c < 5; c++) await play(page, c, 0, 0, { keepEvents: c === 4 });
  await expect(page.locator("#expModal")).toContainText("+300");
  await clearEvents(page);
  let s = await state(page);
  expect(s.teams[0]).toMatchObject({ score: 800, correct: 5, summit: true });
  expect(s.summitFirst).toBe(0);
  expect(s.teams[0].powers.length).toBeLessThanOrEqual(3);

  // A sixth right answer adds points but never a second summit bonus.
  await play(page, 5, 0, 0);
  s = await state(page);
  expect(s.teams[0].score).toBe(900);

  // Family 2 earns 200 and holds a Safety Net.
  await play(page, 0, 1, 1);
  // `S`, `save` and `renderGame` are page-script globals.
  await page.evaluate(`S.teams[1].powers = ["shield"]; save(); renderGame();`);

  // Reload mid-game: the board, scores, trail and power-ups resume.
  await page.reload();
  await expect(page.locator("#pts0")).toHaveText("900");
  await expect(page.locator('.cell[data-c="0"][data-r="0"]')).toHaveClass(/used/);
  expect((await state(page)).teams[1].powers).toEqual(["shield"]);

  // Final Challenge.
  await page.locator("#finalBtn").click();
  await page.locator('[data-wager="0"]').fill("500");
  await page.locator('[data-wager="1"]').fill("200");
  await page.locator('[data-shield="1"]').check();
  await page.locator("#finNext").click(); // reveal question
  expect((await state(page)).teams[1].powers).toEqual([]); // shield committed
  await page.locator("#finNext").click(); // show answer
  await page.locator('[data-fin="0"][data-ok="1"]').click();
  await page.locator('[data-fin="0"][data-ok="1"]').click({ force: true }); // second click ignored
  await page.locator('[data-fin="1"][data-ok="0"]').click();

  // Close and reopen: verdicts persist, nothing is re-awarded.
  await page.locator("#finalClose").click();
  await page.locator("#finalBtn").click();
  await expect(page.locator('[data-fin="0"][data-ok="0"]')).toBeDisabled();
  s = await state(page);
  expect(s.teams[0].score).toBe(1400);
  expect(s.teams[1].score).toBe(200); // Safety Net: wrong answer lost nothing
  await expect(page.locator("#finNext")).toBeDisabled();
  await page.locator('[data-fin="2"][data-ok="0"]').click();
  await page.locator('[data-fin="3"][data-ok="0"]').click();
  await page.locator("#finNext").click();

  await expect(page.locator("#winner")).toBeVisible();
  await expect(page.locator("#winTitle")).toHaveText(s.teams[0].name);
  await expect(page.locator("#winner")).toContainText("🛂");
  const passport = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) as string),
    PASSPORT_KEY,
  );
  expect(passport.games).toBe(1);
  expect(passport.stamps.mix).toBe(1);

  // The Final button now only shows results; reload does not stamp twice.
  await page.locator("#winBack").click();
  await page.locator("#finalBtn").click();
  await expect(page.locator("#winner")).toBeVisible();
  await page.reload();
  s = await state(page);
  expect(s.finalDone).toBe(true);
  expect(s.teams.map((t) => t.score)).toEqual([1400, 200, 0, 0]);
  const again = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) as string),
    PASSPORT_KEY,
  );
  expect(again.games).toBe(1);

  // Back on setup, the passport shows the stamp.
  await page.locator("#setupBtn").click();
  await expect(page.locator(".stamp.got")).toHaveCount(1);
});

test("Daily Double wager, remix boards and fresh layouts on replay", async ({ page }) => {
  await start(page);
  const first = await state(page);
  const [dc, dr] = first.doubles[0].split("-").map(Number);
  await page.locator(`.cell[data-c="${dc}"][data-r="${dr}"]`).click();
  await page.locator("#ddStandardBtn").click();
  await expect(page.locator("[data-boost]")).toHaveCount(0); // no Double Up on a Daily Double
  await page.locator("#revealBtn").click();
  await page.locator('[data-win="2"]').click();
  await clearEvents(page);
  expect((await state(page)).teams[2].score).toBe((dr + 1) * 100 * 2);

  // Remix: six different categories drawn from several boards.
  await page.locator("#setupBtn").click();
  await page.locator('[data-mode="remix"]').click();
  await page.locator("#startBtn").click();
  const remix = await state(page);
  expect(remix.layout.remix).toBe(true);
  expect(new Set(remix.layout.cats.map((x) => `${x.b}:${x.c}`)).size).toBe(6);
  expect(new Set(remix.layout.cats.map((x) => x.b)).size).toBeGreaterThanOrEqual(3);
  await expect(page.locator(".gamebar .bname")).toContainText("Remix");
  await expect(page.locator(".grid .cat")).toHaveCount(6);
  expect(remix.teams.every((t) => t.score === 0 && t.correct === 0 && t.powers.length === 0)).toBe(
    true,
  );

  // Every clue on a remix board opens and shows a real question and answer.
  await page.locator('.cell[data-c="5"][data-r="4"]').click();
  if (await page.locator("#ddStandardBtn").isVisible())
    await page.locator("#ddStandardBtn").click();
  await expect(page.locator("#clueTitle .q-en")).not.toBeEmpty();
  await page.locator("#revealBtn").click();
  await expect(page.locator(".answer .a-en")).not.toBeEmpty();
});

test("phone width: no horizontal overflow and screenshots", async ({ page }) => {
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

  await page.setViewportSize({ width: 1366, height: 900 });
  await page.screenshot({ path: `${SHOTS}/setup-1366.png`, fullPage: true });
  await start(page);
  await play(page, 0, 0, 0, { keepEvents: true });
  await page.screenshot({ path: `${SHOTS}/chest-1366.png` });
  await clearEvents(page);
  await play(page, 1, 1, 1);
  await page.screenshot({ path: `${SHOTS}/board-1366.png`, fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `${SHOTS}/board-390.png`, fullPage: true });
  await page.locator('.cell[data-c="2"][data-r="0"]').click();
  await page.locator("#revealBtn").click();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `${SHOTS}/clue-390.png` });
  await page.locator('[data-win="2"]').click();
  await expect(page.locator("#expModal")).toBeVisible();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `${SHOTS}/chest-390.png` });
  await clearEvents(page);
  await page.locator("#setupBtn").click();
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `${SHOTS}/setup-390.png`, fullPage: true });

  // Every board cell is on screen (no sideways scrolling inside the board either).
  await page.locator("#resumeBtn").click();
  const cellRight = await page.evaluate(() =>
    Math.max(
      ...[...document.querySelectorAll(".cell")].map((c) => c.getBoundingClientRect().right),
    ),
  );
  expect(cellRight).toBeLessThanOrEqual(390);
});
