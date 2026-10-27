// E2E journey 3, PARENT-CHILD: choose Together mode on the home, play a planned session whose last activity is the Family
// Math Duel. Checks the turn-taking card in the shell (Learner and Caregiver alternate each round), the caregiver's explain
// prompt after a solved round, the between card's together block, and the duel played through its hand-over screens with a
// challenge (the caregiver's value is typed wrongly on purpose, the learner challenges and corrects it). The coaching text
// is checked against every round's answer and for digits. @fm2 FM-082 FM-027 FM-028

import { strandKey } from "../../math/fluency-lab/family/fm2/coach.js";
import {
  activitiesOf,
  CORRECT,
  dayOf,
  decodePlan,
  duel,
  gameById,
  games,
  hasSolver,
  isVisible,
  makeRng,
  openHome,
  planSession,
  playSession,
  readPlan,
  run,
  seedFrom,
  seedSessions,
  setup,
  storeOf,
  storeState,
  text,
} from "./e2e-kit.mjs";

const duelGame = gameById("family-math-duel");
const MINUTES = 10;

// The home plans with seedFrom(today, grade, mode) over an empty record; find a grade whose duel can be challenged (level 2+).
function pickGrade() {
  for (const grade of [5, 6, 4, 7, 3, 8, 2, 1, 0]) {
    const plan = planSession({
      grade,
      minutes: MINUTES,
      mode: "together",
      state: storeState(),
      games,
      seed: seedFrom(dayOf(), grade, "together"),
    });
    const last = plan.activities.at(-1);
    if (last?.gameId === "family-math-duel" && last.level >= 2) return { grade, plan };
  }
  throw new Error("no grade plans a challengeable duel");
}
// A session seed whose first duel hand is a private one (so the hand-over screen is part of the journey).
function pickSeed(plan, grade) {
  const step = plan.activities.length - 1;
  const a = plan.activities[step];
  for (let seed = 1; seed < 5000; seed += 1) {
    const stepSeed = seedFrom(seed, step, a.gameId, a.skillId);
    const round = duelGame.makeRound(
      a.skillId,
      a.level,
      makeRng(seedFrom(stepSeed, a.gameId, a.skillId, a.level, 0)),
      grade,
    );
    if (round.variant === "private" && round.rights.challenge) return seed;
  }
  throw new Error("no seed gives a private duel hand");
}
const hasAnswer = (value, answer) => {
  const a = String(answer).trim();
  if (!a) return false;
  return new RegExp(
    `(?<![\\w./-])${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w./-])`,
    "i",
  ).test(value);
};

await run("e2e-parent-child", async (h, T) => {
  const { grade, plan: expectedPlan } = pickGrade();
  const seed = pickSeed(expectedPlan, grade);
  const context = await h.context({ width: 1100, height: 900 });
  await seedSessions(context, seed);
  const page = await openHome(h, context);

  T.section("parent-child: choose Together on the home");
  await setup(page, { grade, minutes: MINUTES, mode: "together" });
  T.ok(await page.locator("[data-testid=mode-together]").isChecked(), "Together is selected");
  T.match(
    await text(page, ".hm-hint"),
    /two|together|caregiver|take turns/i,
    "the home explains how Together works",
  );
  T.match(
    await text(page, "[data-testid=plan-summary]"),
    /Together/,
    "the plan summary says Together",
  );
  const { code } = await readPlan(page);
  const plan = decodePlan(code, games);
  T.eq(plan.mode, "together", "the plan is a together plan");
  T.eq(
    plan.activities.at(-1).gameId,
    "family-math-duel",
    "the last activity is the Family Math Duel",
  );
  T.eq(plan.activities.at(-1).role, "together", "the duel carries the Together role");
  T.eq((await storeOf(page)).settings.mode, "together", "the mode is saved as a setting");

  T.section("parent-child: turn-taking, explain prompts and the between cards");
  await page.locator("[data-testid=start-session]").click();
  await page.waitForSelector("[data-fm2-shell]");
  const seen = [];
  let handovers = 0;
  let challengeResult = null;
  const log = await playSession(page, T, {
    choose: ({ step, index, gameId }) =>
      step === 0 && index === 0 && hasSolver(gameId) ? "ui" : "seam",
    custom: async (info, p) => {
      if (info.gameId !== "family-math-duel" || info.index !== 0) return null;
      const result = await duel(p, "click", {
        challenge: true,
        onHandover: async (seat) => {
          handovers += 1;
          const named = await text(p, "[data-testid=handover]");
          T.match(
            named,
            new RegExp(`Hand the device to ${seat === 0 ? "Learner" : "Caregiver"}`),
            `the hand-over screen names the next player (seat ${seat})`,
          );
          T.eq(
            await p.locator(".fd-card, .fd-slot").count(),
            0,
            "no cards or answers are in the page during a hand-over",
          );
        },
      });
      await p.waitForFunction(() => window.__fm2.tools.solved);
      challengeResult = { ...result, panel: await text(p, "[data-testid=duel-result]") };
      return "duel-ui";
    },
    onRound: (row, info) =>
      seen.push({ ...row, gameId: info.gameId, index: info.index, answer: info.answer }),
    onBetween: (entry) => seen.push({ between: entry }),
  });
  const acts = activitiesOf(log);
  T.eq(acts.length, plan.activities.length, "every planned activity was played");
  const rounds = seen.filter((r) => !r.between);
  T.ok(rounds.length >= 6, `${rounds.length} rounds were played in together mode`);
  for (const r of rounds) {
    const label = `${r.gameId} round ${r.index + 1}`;
    T.ok(r.turn, `${label}: the turn card is shown`);
    if (r.gameId === "family-math-duel") {
      T.match(
        r.turn,
        /Both of you play this round/,
        `${label}: the duel prompt has both people play`,
      );
      T.match(
        r.turn,
        new RegExp(
          `${r.index % 2 === 0 ? "Learner" : "Caregiver"}, explain your thinking first`,
          "i",
        ),
        `${label}: the explainer alternates`,
      );
    } else {
      const role = r.index % 2 === 0 ? "Learner" : "Caregiver";
      const other = r.index % 2 === 0 ? "Caregiver" : "Learner";
      T.match(
        r.turn,
        new RegExp(`^${role}\\s*${role}: solve this round`, "i"),
        `${label}: ${role} solves`,
      );
      T.match(r.turn, new RegExp(`${other}:`), `${label}: ${other} has a part (coach or listener)`);
    }
    T.match(r.feedback, CORRECT, `${label}: solved`);
    T.ok(
      r.explain && /talk about it/i.test(r.explain),
      `${label}: the caregiver's "Talk about it" prompt appears after the round`,
    );
    T.ok(
      !hasAnswer(r.turn, r.answer) && !hasAnswer(r.explain || "", r.answer),
      `${label}: the coaching text does not contain the answer "${r.answer}"`,
    );
    T.ok(
      !/\d/.test(r.turn) && !/\d/.test((r.explain || "").replace(/^talk about it/i, "")),
      `${label}: the coaching text contains no digits`,
    );
  }
  if (process.env.E2E_DEBUG)
    for (const r of rounds)
      console.log(
        JSON.stringify({
          g: r.gameId,
          i: r.index,
          via: r.via,
          a: r.answer,
          turn: r.turn,
          explain: r.explain,
        }),
      );
  const roleSequence = rounds
    .filter((r) => r.gameId !== "family-math-duel")
    .map((r) => `${r.index}:${/^learner/i.test(r.turn) ? "L" : "C"}`);
  T.ok(
    roleSequence.length >= 4 &&
      roleSequence.every((x) => (Number(x.split(":")[0]) % 2 === 0) === x.endsWith("L")),
    `roles alternate Learner/Caregiver by round (${roleSequence.join(" ")})`,
  );
  const betweens = seen.filter((r) => r.between).map((r) => r.between);
  T.eq(
    betweens.length,
    plan.activities.length - 1,
    "a between card follows every activity but the last",
  );
  betweens.forEach((entry, i) => {
    const next = plan.activities[i + 1];
    T.match(entry.text, /Playing together/i, `between card ${i + 1}: the together block is shown`);
    T.match(
      entry.text,
      /Learner and Caregiver take turns/,
      `between card ${i + 1}: roles are explained`,
    );
    T.ok(
      entry.text.includes(gameById(next.gameId).together.en),
      `between card ${i + 1}: shows how to play ${next.gameId} together`,
    );
  });

  T.section("parent-child: the duel hand with a challenge");
  T.eq(handovers, 2, "the device changed hands twice (each player once) on the private hand");
  T.ok(challengeResult.challenged, "the learner challenged the caregiver's value");
  T.match(
    challengeResult.panel,
    /Challenge upheld/,
    "the result panel says the challenge was upheld",
  );
  T.match(challengeResult.panel, /Learner/, "the result names the learner");
  const duelRows = rounds.filter((r) => r.gameId === "family-math-duel");
  T.ok(
    duelRows.length >= 1 && duelRows[0].via === "duel-ui",
    "the first duel hand was played with real clicks",
  );

  T.section("parent-child: coaching content is about the skill being played");
  // A ratio/percent question must not be asked about a skill that is not about ratios. Written from the skill's own words,
  // not from the coach's rule table.
  const RATIO_WORDS =
    /\b(ratios?|percents?|percent(age)?s?|rates?|proportion\w*|unit price|scale)\b/i;
  const offTopic = [];
  for (const game of games)
    for (const skill of game.skills) {
      const key = strandKey(skill.strand, skill.id, game.id);
      const words = `${skill.strand.en} ${skill.title.en} ${skill.id.replaceAll("-", " ")} ${game.id.replaceAll("-", " ")}`;
      if (key === "ratios-percents" && !RATIO_WORDS.test(words))
        offTopic.push(`${game.id}/${skill.id} (${skill.strand.en})`);
    }
  T.ok(
    !offTopic.length,
    `${offTopic.length} skills get the ratio/percent coaching card without being about ratios, e.g. ${offTopic.slice(0, 4).join("; ")}`,
  );
  for (const a of acts) {
    const g = gameById(a.gameId);
    const skill = g.skills.find((x) => x.id === a.skillId);
    const key = strandKey(skill.strand, skill.id, g.id);
    T.ok(
      !(
        key === "ratios-percents" &&
        !RATIO_WORDS.test(`${skill.strand.en} ${skill.title.en} ${skill.id}`)
      ),
      `${a.gameId}/${a.skillId}: its coaching questions match its topic (strand "${skill.strand.en}" coached as ${key})`,
    );
  }

  T.section("parent-child: results");
  const sumRounds = acts.reduce((n, a) => n + a.rounds.length, 0);
  T.eq(
    (await text(page, "[data-testid=session-correct]")).trim(),
    `${sumRounds} of ${sumRounds}`,
    "every round was solved",
  );
  T.ok(await isVisible(page, "[data-testid=session-complete]"), "the end screen is shown");
  const store = await storeOf(page);
  T.eq(store.sessions.length, 1, "one session is recorded");
  T.eq(
    [
      store.sessions[0].mode,
      store.sessions[0].grade,
      store.sessions[0].total,
      store.sessions[0].correct,
    ],
    ["together", grade, sumRounds, sumRounds],
    "the recorded session is a together session with the right counts",
  );
  T.ok(
    store.sessions[0].games.includes("family-math-duel"),
    "the duel is listed among the games played",
  );
  T.eq(store.games["family-math-duel"]?.plays, 1, "the duel has one completed play");
  const stars = await page
    .locator("[data-testid=session-activity][data-game=family-math-duel]")
    .getAttribute("data-stars");
  T.eq(stars, "3", "the duel earned three stars");
});
