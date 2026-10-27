// E2E coverage matrix. Part A: every grade 0..8 x 5/10/15 minutes (27 solo sessions) plus one together session per grade (9),
// each started with the home's grade/length/mode controls and the Start button, played to the end screen with the test seam and
// checked against the plan: the estimated minutes sit inside the budget band, every activity's skill covers the grade, roles
// follow the plan table, the session completes and the progress page shows it. Part B: every game x every grade 0..8 (90
// combinations) opens play.html with its first suitable skill, mounts with no errors, and its round is solved with the seam.
// Runs in a few parallel pages of one browser. @fm2 FM-087 FM-006 FM-003 FM-004 FM-005 FM-018 FM-002
import {
  activitiesOf,
  answerSeam,
  CORRECT,
  decodePlan,
  feedbackOf,
  gameById,
  games,
  isVisible,
  playSession,
  progressSnapshot,
  readPlan,
  run,
  setup,
  shellInfo,
  storeOf,
  text,
  totalStars,
} from "./e2e-kit.mjs";

const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const MINUTES = [5, 10, 15];
const ROLES = {
  solo: {
    5: ["warmup", "main"],
    10: ["warmup", "main", "stretch"],
    15: ["warmup", "main", "main", "stretch"],
  },
  together: {
    5: ["warmup", "together"],
    10: ["warmup", "main", "together"],
    15: ["warmup", "main", "stretch", "together"],
  },
};
const POOL = 4;

async function pool(items, size, worker) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await worker(item);
    }),
  );
}

await run("e2e-matrix", async (h, T) => {
  // ---- Part A: sessions -----------------------------------------------------------------------------------------------------------
  const combos = [];
  for (const grade of GRADES)
    for (const minutes of MINUTES) combos.push({ grade, minutes, mode: "solo" });
  for (const grade of GRADES) combos.push({ grade, minutes: 10, mode: "together" });
  const plans = new Map();
  T.section("matrix A: 27 solo + 9 together sessions through the home Start flow");
  await pool(combos, POOL, async ({ grade, minutes, mode }) => {
    const label = `grade ${grade}, ${minutes} min, ${mode}`;
    const context = await h.context({ width: 1000, height: 800 });
    const page = await context.newPage();
    try {
      await page.goto(h.url(""));
      await page.waitForSelector("[data-testid=start-session]:not([disabled])");
      await setup(page, { grade, minutes, mode });
      const { code, params } = await readPlan(page);
      const plan = decodePlan(code, games);
      if (!T.ok(plan, `${label}: the Start link carries a decodable plan`)) return;
      plans.set(`${mode}:${minutes}:${grade}`, plan);
      T.eq(
        [plan.grade, plan.minutes, plan.mode, params.grade],
        [grade, minutes, mode, String(grade)],
        `${label}: the plan carries the chosen grade, length and mode`,
      );
      const band = plan.estSec / (minutes * 60);
      T.ok(
        band >= 0.85 && band <= 1.05,
        `${label}: estimated ${(plan.estSec / 60).toFixed(1)} min is inside the ${minutes}-minute band (${(band * 100).toFixed(0)}% of the budget)`,
      );
      T.match(
        await text(page, "[data-testid=plan-summary]"),
        new RegExp(
          `${plan.activities.length} activities · about ${Math.max(1, Math.round(plan.estSec / 60))} min`,
        ),
        `${label}: the home states the same activities and minutes`,
      );
      T.eq(
        plan.activities.map((a) => a.role),
        ROLES[mode][minutes],
        `${label}: roles follow the plan table`,
      );
      const skillKeys = plan.activities.map((a) => `${a.gameId}:${a.skillId}`);
      T.eq(new Set(skillKeys).size, skillKeys.length, `${label}: no skill repeats`);
      T.eq(
        new Set(plan.activities.map((a) => a.gameId)).size,
        plan.activities.length,
        `${label}: every activity is a different game`,
      );
      for (const a of plan.activities) {
        const skill = gameById(a.gameId).skills.find((s) => s.id === a.skillId);
        T.ok(
          skill && skill.grades[0] <= grade && grade <= skill.grades[1],
          `${label}: ${a.gameId}/${a.skillId} (grades ${skill?.grades}) supports grade ${grade}`,
        );
        T.ok(
          a.rounds >= 2 && a.rounds <= 6,
          `${label}: ${a.gameId} has ${a.rounds} rounds (2 to 6)`,
        );
        T.ok(a.level >= 1 && a.level <= 3, `${label}: ${a.gameId} level ${a.level}`);
      }
      if (mode === "together")
        T.eq(
          plan.activities.at(-1).gameId,
          "family-math-duel",
          `${label}: the together activity is the Family Math Duel`,
        );

      await page.locator("[data-testid=start-session]").click();
      await page.waitForSelector("[data-fm2-shell]");
      const log = await playSession(page, T, {});
      const acts = activitiesOf(log);
      T.eq(
        acts.map((a) => [a.gameId, a.skillId, a.total]),
        plan.activities.map((a) => [a.gameId, a.skillId, a.rounds]),
        `${label}: the session played exactly the planned activities and rounds`,
      );
      const rounds = acts.reduce((n, a) => n + a.rounds.length, 0);
      T.eq(
        (await text(page, "[data-testid=session-correct]")).trim(),
        `${rounds} of ${rounds}`,
        `${label}: every round solved on the end screen`,
      );
      const store = await storeOf(page);
      T.eq(
        [
          store.sessions.length,
          store.sessions[0]?.grade,
          store.sessions[0]?.mode,
          store.sessions[0]?.total,
        ],
        [1, grade, mode, rounds],
        `${label}: one session of ${rounds} rounds is stored`,
      );
      T.eq(
        [store.settings.grade, store.settings.minutes, store.settings.mode],
        [grade, minutes, mode],
        `${label}: the chosen settings are stored`,
      );
      await page.locator("[data-testid=session-progress]").click();
      const progress = await progressSnapshot(page);
      T.eq(
        [progress.sessions, progress.sessionRows.length, progress.stars],
        [1, 1, totalStars(store)],
        `${label}: the progress page shows the session`,
      );
      T.match(
        progress.sessionRows[0],
        new RegExp(`${rounds} of ${rounds} solved`),
        `${label}: the progress row shows the solved count`,
      );
    } catch (error) {
      T.ok(false, `${label}: ${error.message.split("\n")[0]}`);
    } finally {
      await context.close();
    }
  });

  T.section("matrix A: plans differ by grade (grade-sensitive pathways)");
  for (const minutes of MINUTES) {
    for (const [a, b] of [
      [0, 3],
      [1, 5],
      [2, 6],
      [3, 8],
      [0, 8],
      [4, 8],
    ]) {
      const pa = plans.get(`solo:${minutes}:${a}`);
      const pb = plans.get(`solo:${minutes}:${b}`);
      if (!pa || !pb) continue;
      const ka = pa.activities.map((x) => `${x.gameId}:${x.skillId}`);
      const kb = pb.activities.map((x) => `${x.gameId}:${x.skillId}`);
      T.ok(
        ka.every((k) => !kb.includes(k)),
        `${minutes} min: grades ${a} and ${b} share no skill (${ka.filter((k) => kb.includes(k)).join(", ") || "none"})`,
      );
    }
  }

  // ---- Part B: every game at every grade -------------------------------------------------------------------------------------------------
  T.section("matrix B: 10 games x 9 grades open and solve");
  const cells = [];
  for (const game of games) for (const grade of GRADES) cells.push({ game, grade });
  const context = await h.context({ width: 1000, height: 800 });
  let opened = 0;
  await pool(cells, 6, async ({ game, grade }) => {
    const skill = game.skills.find((s) => s.grades[0] <= grade && grade <= s.grades[1]);
    const label = `${game.id} grade ${grade}`;
    if (!T.ok(skill, `${label}: the game has a skill for the grade`)) return;
    const level = 1 + (grade % 3);
    const page = await context.newPage();
    try {
      await page.goto(
        h.play({
          game: game.id,
          grade,
          skill: skill.id,
          level,
          rounds: 3,
          seed: 100 + grade,
          lang: "en",
        }),
      );
      await page.waitForSelector("[data-fm2-shell] [data-fm2-stage] > *", { timeout: 15000 });
      const info = await shellInfo(page);
      T.eq(
        [info.gameId, info.skillId, info.grade, info.level, info.total],
        [game.id, skill.id, grade, level, 3],
        `${label}: mounts with ${skill.id} at level ${level}`,
      );
      T.ok((await text(page, "[data-fm2-prompt]")).length > 5, `${label}: shows a prompt`);
      const result = await answerSeam(page);
      T.ok(
        result.correct && CORRECT.test(await feedbackOf(page)),
        `${label}: the round is solved with the seam (${skill.id})`,
      );
      T.ok(await isVisible(page, "[data-fm2-next]"), `${label}: Next appears after solving`);
      opened += 1;
    } catch (error) {
      T.ok(false, `${label}: ${error.message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  });
  T.eq(opened, 90, "all 90 game and grade combinations opened and solved");
  await context.close();
});
