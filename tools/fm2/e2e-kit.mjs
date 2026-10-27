// Shared helpers for the Family Math 2.0 end-to-end journey suites (tools/fm2/e2e-*.mjs): a soft-failing checker, storage
// seeding and reading, the home / session / progress page drivers, independent oracles for stars and mastery, and a
// small translator from each game's own solution to real clicks and taps (borrowed from the per-game acceptance suites).
// The `window.__fm2` seam is used for two things only: reading the round's own solution, and answering rounds fast where
// the journey is not about the interaction. @fm2 FM-080 FM-081 FM-082 FM-083 FM-084 FM-085 FM-086 FM-087

import { strandKey } from "../../math/fluency-lab/family/fm2/coach.js";
import { loadAll } from "../../math/fluency-lab/family/fm2/registry.js";
import { dayKey } from "../../math/fluency-lab/family/fm2/store.js";
import { assertClean, hasOverflow, launch, smallTargets } from "./harness.mjs";

export const strandOf = (gameId, skill) => strandKey(skill?.strand, skill?.id, gameId);
export { makeRng, seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";
export { decodePlan, encodePlan, planSession } from "../../math/fluency-lab/family/fm2/session.js";
export { duel, hasSolver, marketClear, marketWrong, solveUi, UI_GAMES } from "./e2e-solvers.mjs";
export { assertClean, hasOverflow, launch, smallTargets };

import { solveUi } from "./e2e-solvers.mjs";
export const games = await loadAll();
export const skillsCovering = (list, grade) =>
  list.flatMap((g) =>
    g.skills
      .filter((s) => s.grades[0] <= grade && grade <= s.grades[1])
      .map((s) => `${g.id}:${s.id}`),
  );
export const gameById = (id) => games.find((g) => g.id === id);

export const STORE = "ewl-fm2-v1";
export const SESSION = "ewl-fm2-session-v1";
export const LANG = "ewl-fluency-lang-v1";
export const PROFILES = "ewl-fluency-profiles-v1";
export const keyFor = (base, id = 0) => (id === 0 ? base : `${base}:profile-${id}`);
export const DAY = 86400000;
export const dayOf = (ms = Date.now()) => dayKey(ms);

// ---- checker and runner -------------------------------------------------------------------------------------------
export function checker(name) {
  const fails = [];
  let checks = 0;
  let sectionFails = 0;
  const T = {
    name,
    get checks() {
      return checks;
    },
    get fails() {
      return fails;
    },
    ok(condition, message) {
      checks += 1;
      if (!condition) {
        fails.push(message);
        sectionFails += 1;
        console.log(`  FAIL ${message}`);
      }
      return Boolean(condition);
    },
    eq(actual, expected, message) {
      const same = JSON.stringify(actual) === JSON.stringify(expected);
      return T.ok(
        same,
        same
          ? message
          : `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`,
      );
    },
    match(text, pattern, message) {
      return T.ok(
        pattern.test(text),
        `${message} (${JSON.stringify(String(text).slice(0, 160))} vs ${pattern})`,
      );
    },
    section(title) {
      if (T._open) console.log(`${sectionFails ? "FAIL" : "PASS"} ${T._open}`);
      sectionFails = 0;
      T._open = title;
    },
    end() {
      if (T._open) console.log(`${sectionFails ? "FAIL" : "PASS"} ${T._open}`);
      T._open = null;
    },
  };
  return T;
}

export async function run(name, body) {
  const started = Date.now();
  const T = checker(name);
  const timer = setTimeout(() => {
    console.error(`${name}: exceeded the 6 minute budget`);
    process.exit(2);
  }, 360000);
  timer.unref();
  const h = await launch();
  if (process.env.E2E_INJECT_CSS) {
    // Diagnostic only: loads each game's stylesheet the way play.js does for a single activity, so the rest of a suite can be
    // judged while the planned-session defect (no game CSS) is open. Never set this to certify a build.
    const original = h.context.bind(h);
    h.context = async (options) => {
      const context = await original(options);
      await context.addInitScript(() => {
        const add = () => {
          const shell = document.querySelector("[data-fm2-shell][data-game]");
          const id = shell?.dataset.game;
          if (id && !document.querySelector(`link[href*="games/${id}/game.css"]`)) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = `/math/fluency-lab/family/fm2/games/${id}/game.css`;
            document.head.append(link);
          }
        };
        new MutationObserver(add).observe(document, { childList: true, subtree: true });
      });
      return context;
    };
  }
  try {
    await body(h, T);
    T.end();
    try {
      assertClean(h.problems, name);
      T.ok(true, "no console, network or page errors");
    } catch (error) {
      T.ok(false, error.message);
    }
  } catch (error) {
    T.end();
    T.ok(false, `uncaught: ${error.stack || error.message}`);
  } finally {
    await h.close().catch(() => {});
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`\n${name}: ${T.checks} checks, ${T.fails.length} failed, ${seconds}s`);
  if (T.fails.length) {
    console.log(`FAILED:\n- ${T.fails.join("\n- ")}`);
    process.exit(1);
  }
  console.log(`${name}: PASS`);
  process.exit(0);
}

// ---- storage ------------------------------------------------------------------------------------------------------
export const lsJson = (page, key) =>
  page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    return raw === null ? null : JSON.parse(raw);
  }, key);
export const storeOf = (page, profile = 0) => lsJson(page, keyFor(STORE, profile));
export const sessionOf = (page, profile = 0) => lsJson(page, keyFor(SESSION, profile));

// Writes localStorage once per context, before any page script runs (so a reload keeps whatever the page wrote since).
export async function seedLocal(context, entries) {
  await context.addInitScript((data) => {
    try {
      if (localStorage.getItem("__e2e_seeded")) return;
      for (const [k, v] of Object.entries(data)) localStorage.setItem(k, JSON.stringify(v));
      localStorage.setItem("__e2e_seeded", "1");
    } catch {
      /* storage blocked */
    }
  }, entries);
}
export const attempt = (c, h = 0, l = 1, t = Date.now() - DAY) => ({ c, h, l, t });
export const skillRecord = ({ recent, level = 1, plays, step = 0, dueAt, lastAt }) => ({
  recent,
  level,
  plays: plays ?? recent.length,
  step,
  dueAt: dueAt ?? Date.now() + DAY,
  lastAt: lastAt ?? Date.now() - DAY,
});
export const storeState = (over = {}) => ({
  version: 1,
  skills: {},
  games: {},
  sessions: [],
  days: {},
  settings: { grade: 1, minutes: 10, mode: "solo" },
  resume: null,
  ...over,
});

// Adds ?seed=<n> to a planned-session navigation (a 302), so a real click on Start lands on a known session.
export async function seedSessions(context, seed) {
  await context.route(/play\.html/, (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (
      request.isNavigationRequest() &&
      url.searchParams.has("plan") &&
      !url.searchParams.has("seed") &&
      !url.searchParams.has("resume")
    ) {
      url.searchParams.set("seed", String(seed));
      return route.fulfill({ status: 302, headers: { location: url.toString() } });
    }
    return route.continue();
  });
}

// ---- oracles (written here, not taken from the product) --------------------------------------------------------------
const weightOf = (a) => (!a.c ? 0 : a.h >= 2 ? 0.35 : a.h === 1 ? 0.6 : 1);
export function masteryOracle(recent) {
  const window = recent.slice(-12);
  if (!window.length) return { score: 0, n: 0 };
  let top = 0;
  let bottom = 0;
  window.forEach((a, i) => {
    const w = 0.85 ** (window.length - 1 - i);
    top += w * weightOf(a);
    bottom += w;
  });
  return { score: top / bottom, n: window.length };
}
export function starsOracle(recent) {
  const m = masteryOracle(recent || []);
  if (m.n < 3) return 0;
  return m.score >= 0.9 ? 3 : m.score >= 0.75 ? 2 : m.score >= 0.5 ? 1 : 0;
}
export const starCountOracle = (correct, total) => {
  if (!total) return 0;
  const share = correct / total;
  return share >= 0.9 ? 3 : share >= 0.7 ? 2 : share >= 0.4 ? 1 : 0;
};
export const totalStars = (state) =>
  Object.values(state.skills).reduce((n, r) => n + starsOracle(r.recent), 0);

// ---- reading pages --------------------------------------------------------------------------------------------------
export const text = (page, selector) => page.locator(selector).first().innerText();
export const isVisible = (page, selector) => page.locator(selector).first().isVisible();
export const visibleText = (page) =>
  page.evaluate(() => {
    const parts = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const el = node.parentElement;
      if (
        !el ||
        el.closest(
          "script, style, noscript, template, #nsr-root, [hidden], [lang='en'], dialog:not([open])",
        )
      )
        continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const value = node.textContent.trim();
      if (value) parts.push(value);
    }
    return parts.join(" \n ");
  });
// aria-label / title / alt / placeholder values of everything visible: they are read aloud, so they are language too.
export const labelsText = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[aria-label], [title], img[alt], [placeholder]")]
      .filter((el) => !el.closest("#nsr-root, [hidden], [lang='en']"))
      .flatMap((el) => [
        el.getAttribute("aria-label"),
        el.getAttribute("title"),
        el.getAttribute("alt"),
        el.getAttribute("placeholder"),
      ])
      .filter(Boolean)
      .join(" \n "),
  );
// English interface words that must not appear on a Spanish page (the language toggle shows "English", marked lang=en).
const ENGLISH = [
  "hint",
  "next",
  "finish",
  "back to",
  "start over",
  "show me",
  "how to play",
  "reset this",
  "learner",
  "caregiver",
  "progress",
  "correct!",
  "not yet",
  "round \\d+ of",
  "grade \\d",
  "practice",
  "minutes",
  "streak",
  "session complete",
  "solved",
  "stop for now",
  "skip to",
  "add learner",
  "your place",
  "warm-up",
  "stretch",
  "together",
  "activity \\d+ of",
  "nice work",
  "play again",
  "got it",
];
export const englishLeaks = (value) =>
  ENGLISH.filter((w) => new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu").test(value));
const SPANISH = [
  "siguiente",
  "pista",
  "volver",
  "empezar",
  "estudiante",
  "progreso",
  "ronda",
  "correcto",
  "práctica",
  "minutos",
];
export const spanishHits = (value) =>
  SPANISH.filter((w) => new RegExp(`(^|[^\\p{L}])${w}([^\\p{L}]|$)`, "iu").test(value));

export const roundOf = (page) =>
  page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.round)));
export const solutionOf = (page) =>
  page.evaluate(() => JSON.parse(JSON.stringify(window.__fm2.solve())));
export const fingerprint = async (page) => JSON.stringify(await roundOf(page));
export const shellInfo = (page) =>
  page.evaluate(() => {
    const f = window.__fm2;
    const label = document.querySelector("[data-fm2-round]")?.textContent || "";
    const nums = label.match(/\d+/g) || [];
    return {
      gameId: f.game.id,
      skillId: f.skillId,
      grade: f.grade,
      level: f.level,
      index: f.index,
      total: Number(nums[1] || 0),
      label,
      hints: f.tools.hints,
      attempts: f.tools.attempts,
      solved: f.tools.solved,
      revealed: f.tools.revealed,
      answer: f.game.answerText(f.round),
      title: document.querySelector("[data-fm2-title]")?.textContent || "",
    };
  });
export const feedbackOf = (page) => text(page, "[data-fm2-feedback]");
export const CORRECT = /Correct!|¡Correcto!/;

export async function setup(page, { grade, minutes, mode }) {
  if (grade !== undefined) await page.locator(`[data-testid=grade-${grade}]`).click();
  if (minutes !== undefined) await page.locator(`[data-testid=minutes-${minutes}]`).check();
  if (mode !== undefined) await page.locator(`[data-testid=mode-${mode}]`).check();
}
export async function openHome(h, context, params = {}) {
  const page = await context.newPage();
  const query = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString();
  await page.goto(h.url(query ? `?${query}` : ""));
  await page.waitForSelector("[data-testid=start-session]:not([disabled])");
  return page;
}
export async function readPlan(page) {
  const href = await page.locator("[data-testid=start-session]").getAttribute("href");
  const url = new URL(href, "http://x/");
  return { href, code: url.searchParams.get("plan"), params: Object.fromEntries(url.searchParams) };
}
export const act = (locator, how = "click") => (how === "tap" ? locator.tap() : locator.click());

// ---- answering one round ----------------------------------------------------------------------------------------------
// Fast path: the shell's own solve/submit. Returns the shell result and the feedback text on the page.
export async function answerSeam(page) {
  const result = await page.evaluate(() => {
    const { correct, feedback } = window.__fm2.submit(window.__fm2.solve());
    return {
      correct,
      locked: window.__fm2.tools.solved,
      feedback: feedback ? (feedback.en ?? feedback) : null,
    };
  });
  return { ...result, shown: await feedbackOf(page) };
}
export async function useHints(page, n, how = "click") {
  for (let i = 0; i < n; i += 1) await act(page.locator("[data-fm2-hint]"), how);
}
// Three hints, then Show me: the round ends as "shown" (counted as not solved).
export async function revealRound(page, how = "click") {
  await useHints(page, 3, how);
  await act(page.locator("[data-fm2-showme]"), how);
}
export async function clickNext(page, how = "click") {
  await act(page.locator("[data-fm2-next]"), how);
}

// ---- driving a whole planned session ----------------------------------------------------------------------------------
// `choose(info)` returns what to do in this round: "seam" (default), "ui" (real controls, seam if the game has no solver),
// "reveal" (three hints + Show me) or "hint" (one hint, then solve). Returns a log of every activity and every between card.
export async function stateOfSession(page) {
  return page.evaluate(() => {
    if (document.querySelector("[data-testid=session-complete]")) return "done";
    if (document.querySelector("[data-testid=session-between]")) return "between";
    if (document.querySelector("[data-testid=play-error]")) return "error";
    const next = document.querySelector("[data-fm2-next]");
    if (
      window.__fm2 &&
      document.querySelector("[data-fm2-shell]") &&
      !document.querySelector("[data-fm2-shell]").hidden
    )
      return next && !next.hidden ? "solved" : "round";
    return "wait";
  });
}
const cssChecked = new Set();
export async function playSession(
  page,
  T,
  {
    choose = () => "seam",
    custom = null,
    how = "click",
    onRound = null,
    onBetween = null,
    onDone = null,
  } = {},
) {
  const log = [];
  let activity = null;
  for (let guard = 0; guard < 400; guard += 1) {
    const state = await stateOfSession(page);
    if (state === "done") break;
    if (state === "error") throw new Error("play page showed an error card");
    if (state === "wait") {
      await page.waitForTimeout(40);
      continue;
    }
    if (state === "between") {
      const step = Number(
        await page.locator("[data-testid=session-between]").getAttribute("data-step"),
      );
      const entry = {
        step,
        text: await text(page, "[data-testid=session-between]"),
        next: await text(page, "[data-testid=session-next]"),
        left: await text(page, "[data-testid=session-left]"),
      };
      log.push({ between: entry });
      await onBetween?.(entry, page);
      await act(page.locator("[data-testid=session-go]"), how);
      await page.waitForFunction(
        (s) =>
          !document.querySelector("[data-testid=session-between]") ||
          document.querySelector("[data-testid=session-between]").dataset.step !== String(s),
        step,
      );
      continue;
    }
    const info = await shellInfo(page);
    if (!activity || activity.gameId !== info.gameId || activity.skillId !== info.skillId) {
      activity = {
        gameId: info.gameId,
        skillId: info.skillId,
        level: info.level,
        total: info.total,
        rounds: [],
      };
      log.push({ activity });
      await page
        .waitForFunction(
          (id) =>
            [...document.styleSheets].some((sheet) =>
              (sheet.href || "").includes(`games/${id}/game.css`),
            ),
          info.gameId,
          { timeout: 2500 },
        )
        .catch(() => {});
      const styled = await page.evaluate(
        (id) =>
          Boolean(document.querySelector(`link[rel=stylesheet][href*="games/${id}/game.css"]`)),
        info.gameId,
      );
      if (!cssChecked.has(`${T.name}:${info.gameId}`)) {
        cssChecked.add(`${T.name}:${info.gameId}`);
        T.ok(
          styled,
          `${info.gameId}: the game's own stylesheet is loaded in the session (without it the game is drawn as unstyled controls)`,
        );
      }
    }
    const action = choose({ ...info, step: log.filter((e) => e.activity).length - 1 }) || "seam";
    const row = {
      index: info.index,
      action,
      via: "seam",
      fingerprint: await fingerprint(page),
      answer: info.answer,
    };
    if (state === "round") {
      const handled = custom
        ? await custom({ ...info, step: log.filter((e) => e.activity).length - 1 }, page)
        : null;
      if (handled) {
        row.via = String(handled);
        await page.waitForFunction(
          () => window.__fm2.tools.solved || window.__fm2.tools.revealed,
          null,
          { timeout: 8000 },
        );
      } else if (action === "reveal") {
        await revealRound(page, how);
        row.via = "reveal";
      } else {
        if (action === "hint") await useHints(page, 1, how);
        if ((action === "ui" || action === "hint-ui") && (await solveUi(page, how))) {
          row.via = "ui";
          await page.waitForFunction(
            () => window.__fm2.tools.solved || window.__fm2.tools.revealed,
            null,
            { timeout: 8000 },
          );
        } else {
          const res = await answerSeam(page);
          T.ok(
            res.correct,
            `${info.gameId} round ${info.index + 1}: the seam solution is accepted`,
          );
        }
      }
    }
    row.feedback = await feedbackOf(page);
    row.solved = (await shellInfo(page)).solved;
    row.hints = (await shellInfo(page)).hints;
    row.turn = (await page.locator("[data-fm2-turn]").isVisible())
      ? await text(page, "[data-fm2-turn]")
      : null;
    row.explain = (await page.locator("[data-fm2-explain]").isVisible())
      ? await text(page, "[data-fm2-explain]")
      : null;
    await onRound?.(row, info, page);
    activity.rounds.push(row);
    await clickNext(page, how);
    await page.waitForFunction(
      (prev) =>
        !window.__fm2 ||
        document.querySelector("[data-testid=session-between], [data-testid=session-complete]") ||
        window.__fm2.index !== prev.index ||
        window.__fm2.skillId !== prev.skillId ||
        window.__fm2.game.id !== prev.gameId,
      { index: info.index, skillId: info.skillId, gameId: info.gameId },
    );
  }
  await page.waitForSelector("[data-testid=session-complete]");
  await onDone?.(page);
  return log;
}
export const activitiesOf = (log) => log.filter((e) => e.activity).map((e) => e.activity);

// ---- snapshots of the pages ---------------------------------------------------------------------------------------------
export const starsIn = async (locator) => {
  const label = (await locator.locator(".pk-stars").first().getAttribute("aria-label")) || "";
  return Number((label.match(/\d+/) || ["-1"])[0]);
};
export async function homeStats(page) {
  const n = async (id) => Number(await text(page, `[data-testid=${id}]`));
  return {
    streak: await n("stat-streak"),
    minutes: await n("stat-minutes"),
    stars: await n("stat-stars"),
  };
}
export async function progressSnapshot(page) {
  await page.waitForSelector("[data-testid=mastery-cell]");
  const n = async (id) => Number(await text(page, `[data-testid=${id}]`));
  const skillStars = {};
  for (const row of await page.locator("[data-testid=grade-skills] [data-testid=skill-row]").all())
    skillStars[`${await row.getAttribute("data-game")}:${await row.getAttribute("data-skill")}`] =
      await starsIn(row);
  return {
    streak: await n("stat-streak"),
    minutes: await n("stat-minutes"),
    stars: await n("stat-stars"),
    sessions: await n("stat-sessions"),
    sessionRows: await page.locator("[data-testid=session-row]").allInnerTexts(),
    gameRows: await page
      .locator("[data-testid=game-row]")
      .evaluateAll((rows) => rows.map((r) => ({ game: r.dataset.game, text: r.innerText }))),
    cells: await page
      .locator("[data-testid=mastery-cell]")
      .evaluateAll((cells) => cells.map((c) => Number(c.dataset.level))),
    skillStars,
    empty: await page.locator("[data-testid=progress-empty]").isVisible(),
  };
}
export const noHorizontalScroll = async (page) => !(await hasOverflow(page));
