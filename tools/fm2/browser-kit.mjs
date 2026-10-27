// Shared helpers for the Family Math 2.0 visual / accessibility / performance suites: the screen catalog (every page and
// state a family can reach), seeded learner state, a matrix runner (screen x language x width) and the in-page layout audit.
// Plain node + Playwright through harness.mjs. Not a suite itself (no requirement tags): browser-layout, browser-a11y,
// browser-perf and capture-screens carry the tags.
import { loadAll } from "../../math/fluency-lab/family/fm2/registry.js";
import { encodePlan, planSession } from "../../math/fluency-lab/family/fm2/session.js";
import { dayKey } from "../../math/fluency-lab/family/fm2/store.js";

export const WIDTH_HEIGHT = { 320: 640, 375: 667, 390: 844, 768: 1024, 1024: 768, 1440: 900 };
export const SHOTS = "/tmp/claude-501/fm2-shots/qa";
const DAY = 86400000;

// ---- command line: --widths=320,375 --langs=en --only=play,home --jobs=4 ------------------------------------------------
export function parseArgs(argv = process.argv.slice(2)) {
  const get = (name, fallback) => {
    const hit = argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split("=")[1].split(",").filter(Boolean) : fallback;
  };
  return {
    widths: get("widths", Object.keys(WIDTH_HEIGHT)).map(Number),
    langs: get("langs", ["en", "es"]),
    only: get("only", []),
    games: get("games", []),
    jobs: Number(get("jobs", [process.env.FM2_JOBS || 4])[0]),
  };
}

// ---- learner state -------------------------------------------------------------------------------------------------------
const attempts = (pattern, level, now) =>
  pattern.map((c, i) => ({ c, h: 0, l: level, t: now - (pattern.length - i) * 3600000 }));
const PATTERNS = [
  [1, 1, 1, 1, 1, 1],
  [1, 1, 0, 1, 1, 1, 1],
  [1, 0, 1, 1, 0, 1],
  [0, 1, 0, 0, 1],
];

// A learner with a week of practice: stars on most skills (all four star levels), due reviews, a streak, a resume record.
export function seededState(games, grade = 3, now = Date.now()) {
  const state = {
    version: 1,
    skills: {},
    games: {},
    sessions: [],
    days: {},
    settings: { grade, minutes: 10, mode: "solo" },
    resume: null,
  };
  games.forEach((game, g) => {
    const fits = game.skills.filter((s) => s.grades[0] <= grade && grade <= s.grades[1]);
    fits.forEach((skill, i) => {
      const pattern = PATTERNS[(g + i) % PATTERNS.length];
      const level = 1 + ((g + i) % 3);
      state.skills[`${game.id}:${skill.id}`] = {
        recent: attempts(pattern, level, now),
        level,
        plays: pattern.length,
        step: i % 4,
        dueAt: now + (i % 2 ? -DAY : 2 * DAY),
        lastAt: now - i * DAY,
      };
    });
    state.games[game.id] = {
      plays: 2 + g,
      completed: 1 + g,
      bestStars: g % 4,
      lastAt: now - g * DAY,
    };
  });
  [9, 12, 0, 6, 15, 10, 8].forEach((m, i) => {
    if (m) state.days[dayKey(now - (6 - i) * DAY)] = m;
  });
  state.sessions = [4, 3, 1, 0].map((back, i) => ({
    at: now - back * DAY - i * 3600000,
    grade,
    minutes: 8 + i * 2,
    correct: 7 + i,
    total: 10,
    games: games.slice(i, i + 3).map((x) => x.id),
    mode: i % 2 ? "together" : "solo",
  }));
  const lead = games[1];
  const skill = lead.skills.find((s) => s.grades[0] <= grade && grade <= s.grades[1]);
  state.resume = {
    gameId: lead.id,
    skillId: skill.id,
    grade,
    level: 1,
    seed: 5,
    rounds: 5,
    index: 2,
    mode: "solo",
    plan: "",
    step: 0,
    at: now,
    results: [
      { correct: true, hints: 0, attempts: 1, revealed: false },
      { correct: true, hints: 1, attempts: 2, revealed: false },
    ],
  };
  return state;
}

// ---- screen catalog ------------------------------------------------------------------------------------------------------
const STORE_KEY = "ewl-fm2-v1";
const READY = {
  home: () =>
    document.querySelectorAll("[data-testid=game-card][data-ready=true]").length === 10 ||
    Boolean(document.querySelector("[data-testid=home-error-card]")),
  progress: () =>
    (!document.querySelector(".pg-loading") &&
      document.querySelector("[data-testid=progress-body]")?.children.length > 0) ||
    Boolean(document.querySelector("#pg-body .pk-banner[role=alert]")),
  play: () =>
    Boolean(
      document.querySelector(
        "[data-testid=play-error], [data-testid=session-between], [data-testid=session-complete], [data-fm2-finish]:not([hidden])",
      ),
    ) ||
    Boolean(
      window.__fm2 &&
        document.querySelector("[data-fm2-stage] > *") &&
        document.querySelector("[data-fm2-prompt]")?.textContent,
    ),
};

async function settle(page, kind) {
  await page.waitForFunction(READY[kind], null, { timeout: 20000 });
  await page.waitForFunction(
    () => [...document.querySelectorAll("link[rel=stylesheet]")].every((l) => l.sheet),
    null,
    { timeout: 10000 },
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
}

async function newPage(env, { seed = false, storage = null } = {}) {
  const page = await env.context.newPage();
  // Screens of one run share a browser context, so every page clears this origin's storage first (once per tab) and then
  // plants the seeded learner when asked; an "empty" screen is therefore really empty.
  const state = seed ? JSON.stringify(seededState(env.games, 3)) : "";
  await page.addInitScript(
    ([key, value]) => {
      try {
        if (sessionStorage.getItem("fm2-fresh")) return;
        localStorage.clear();
        sessionStorage.setItem("fm2-fresh", "1");
        if (value) localStorage.setItem(key, value);
      } catch {
        /* storage blocked on purpose in some screens */
      }
    },
    [STORE_KEY, state],
  );
  if (storage === "full")
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException("full", "QuotaExceededError");
      };
    });
  if (storage === "blocked")
    await page.addInitScript(() => {
      for (const name of ["localStorage", "sessionStorage"])
        Object.defineProperty(window, name, {
          get() {
            throw new DOMException("blocked", "SecurityError");
          },
        });
    });
  return page;
}

const solveAll = (page, count) =>
  (async () => {
    for (let i = 0; i < count; i += 1) {
      await page.waitForFunction(
        () => window.__fm2 && document.querySelector("[data-fm2-next]")?.hidden,
        null,
        { timeout: 15000 },
      );
      await page.evaluate(() => window.__fm2.submit(window.__fm2.solve()));
      await page.click("[data-fm2-next]");
    }
  })();

// Plays every round of the first `activities` activities of a planned session through the test seam (layout runs need
// the screens a session reaches, not another proof that the interactions work; the accept-* suites do that).
async function playThrough(page, plan, activities) {
  for (let a = 0; a < activities; a += 1) {
    if (a > 0) await page.click("[data-testid=session-go]");
    await page.waitForFunction(() => window.__fm2?.round, null, { timeout: 20000 });
    await solveAll(page, plan.activities[a].rounds);
  }
}

export async function buildScreens() {
  const games = await loadAll();
  const planFor = (minutes, mode, grade = 3) => {
    const plan = planSession({ grade, minutes, mode, state: null, games, seed: 3 });
    return { plan, code: encodePlan(plan) };
  };
  const solo5 = planFor(5, "solo");
  const duo15 = planFor(15, "together", 4);
  const screens = [];
  const add = (id, group, open, extra = {}) => screens.push({ id, group, open, ...extra });
  const q = (env, params) => new URLSearchParams({ lang: env.lang, ...params }).toString();

  // Home and progress screens: one opener, options say what is seeded, broken or opened, or which region to crop.
  const pageScreen = (
    id,
    file,
    { seed = false, storage = null, params = {}, after = null, ...extra } = {},
  ) =>
    add(
      id,
      file === "index.html" ? "home" : "progress",
      async (env) => {
        const page = await newPage(env, { seed, storage });
        await page.goto(env.h.url(`${file}?${q(env, { grade: 3, ...params })}`));
        await settle(page, file === "index.html" ? "home" : "progress");
        if (after) await after(page);
        return page;
      },
      extra,
    );
  const home = (id, options) => pageScreen(id, "index.html", options);
  const openAll = (selector) => (p) =>
    p.evaluate((sel) => document.querySelectorAll(sel).forEach((d) => (d.open = true)), selector);
  home("home");
  home("home-grade-k", { params: { grade: 0 } });
  home("home-grade-8", { params: { grade: 8 } });
  home("home-seeded", { seed: true });
  home("home-skills-open", { seed: true, after: openAll("details.hm-strand") });
  home("home-realworld-open", {
    after: async (p) => {
      await p.click("[data-testid=rw-toggle]");
      await openAll("details.hm-rw")(p);
    },
  });
  home("home-together", {
    params: { mode: "together" },
    after: (p) => p.locator("label:has([data-testid=mode-together])").click(),
  });
  home("home-nostorage-full", { storage: "full" });
  home("home-nostorage-blocked", { storage: "blocked" });
  for (const [id, region] of [
    ["home-mission", "#mission-region"],
    ["home-coach", "#coach-region"],
    ["home-skills", "#skills-region"],
    ["home-realworld", "#rw-region"],
    ["home-progress", "#progress-region"],
  ])
    home(id, { seed: id === "home-progress", crop: region, captureOnly: true });
  pageScreen("progress-empty", "progress.html");
  pageScreen("progress-seeded", "progress.html", { seed: true });
  pageScreen("progress-nostorage", "progress.html", { storage: "full" });

  const play = (
    id,
    game,
    params,
    { after = null, storage = null, crop = null, captureOnly = false } = {},
  ) =>
    add(
      id,
      "play",
      async (env) => {
        const page = await newPage(env, { storage });
        await page.goto(
          env.h.play({ game: game.id, rounds: 5, seed: 11, lang: env.lang, ...params }),
        );
        await settle(page, "play");
        if (after) await after(page);
        return page;
      },
      { game: game.id, crop, captureOnly },
    );
  for (const game of games) {
    play(`play-${game.id}-g3`, game, { grade: 3 });
    play(`play-${game.id}-g6`, game, { grade: 6, level: 2 });
    play(`play-${game.id}-g0-hard`, game, { grade: 0, level: 3 });
    play(`play-${game.id}-g8-hard`, game, { grade: 8, level: 3 });
    play(
      `play-${game.id}-howto`,
      game,
      { grade: 6 },
      {
        after: async (p) => {
          await p.click("[data-fm2-howto]");
          await p.waitForSelector("dialog[open]");
        },
      },
    );
    play(
      `play-${game.id}-solved-together`,
      game,
      { grade: 3, mode: "together" },
      {
        after: async (p) => {
          await p.evaluate(() => window.__fm2.submit(window.__fm2.solve()));
          await p.waitForSelector("[data-fm2-next]:not([hidden])");
        },
      },
    );
    play(
      `play-${game.id}-revealed`,
      game,
      { grade: 8, level: 3, mode: "together" },
      {
        after: async (p) => {
          for (let i = 0; i < 3; i += 1) await p.click("[data-fm2-hint]");
          await p.click("[data-fm2-showme]");
          await p.waitForSelector("[data-fm2-next]:not([hidden])");
        },
      },
    );
  }
  const first = games[0];
  play("play-error-bad-game", first, { game: "no-such-game" });
  play("play-error-bad-skill", first, { skill: "no-such-skill" });
  play("play-error-incomplete", first, { grade: 99 });
  play("play-nostorage-full", games[3], { grade: 3 }, { storage: "full" });
  play("play-nostorage-blocked", games[3], { grade: 3 }, { storage: "blocked" });
  for (const [id, plan] of [
    ["play-error-bad-plan", "garbage-text"],
    ["play-error-unknown-game-plan", "1~g3~m5~s~no-game_skill_1_2_m~no-game_skill_1_2_m"],
  ])
    add(id, "play", async (env) => {
      const page = await newPage(env);
      await page.goto(env.h.play({ plan, grade: 3, lang: env.lang }));
      await settle(page, "play");
      return page;
    });

  const session = (id, { code, plan, activities, mode = "solo", grade = 3, finish = false }) =>
    add(id, "session", async (env) => {
      const page = await newPage(env);
      await page.goto(env.h.play({ plan: code, grade, mode, lang: env.lang, seed: 5 }));
      await settle(page, "play");
      await playThrough(page, plan, activities);
      await page.waitForSelector(
        finish ? "[data-testid=session-complete]" : "[data-testid=session-between]",
        { timeout: 20000 },
      );
      await page.waitForTimeout(150);
      return page;
    });
  session("session-between", { ...solo5, activities: 1 });
  const together5 = planFor(5, "together");
  session("session-between-together", { ...together5, activities: 1, mode: "together" });
  session("session-complete", { ...solo5, activities: solo5.plan.activities.length, finish: true });
  session("session-complete-15-together", {
    ...duo15,
    activities: duo15.plan.activities.length,
    finish: true,
    mode: "together",
    grade: 4,
  });

  // Single-activity finish screens: all rounds solved (3 stars) and one revealed round (1 star).
  const finish = (id, drive) =>
    add(id, "session", async (env) => {
      const page = await newPage(env);
      await page.goto(
        env.h.play({ game: games[0].id, grade: 3, rounds: 2, seed: 11, lang: env.lang }),
      );
      await settle(page, "play");
      await drive(page);
      await page.waitForSelector("[data-fm2-finish]:not([hidden]) h1");
      await page.waitForTimeout(150);
      return page;
    });
  finish("play-finish-single", (page) => solveAll(page, 2));
  finish("play-finish-single-low-stars", async (page) => {
    for (let k = 0; k < 3; k += 1) await page.click("[data-fm2-hint]");
    await page.click("[data-fm2-showme]");
    await page.click("[data-fm2-next]");
    await page.evaluate(() => window.__fm2.submit(window.__fm2.solve()));
    await page.click("[data-fm2-next]");
  });
  return { screens, games };
}

// ---- matrix runner -------------------------------------------------------------------------------------------------------
// Runs fn(page, screen, env) for every screen x language x width. Each (language, width) pair gets its own context and
// `jobs` pairs run at a time; newPage() clears storage per page, so screens never see each other's data.
export async function runMatrix(h, { screens, games, langs, widths, jobs }, fn) {
  const queue = langs.flatMap((lang) => widths.map((width) => ({ lang, width })));
  const failures = [];
  let done = 0;
  const worker = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const context = await h.context({
        width: job.width,
        height: WIDTH_HEIGHT[job.width] || 800,
        locale: job.lang === "es" ? "es-US" : "en-US",
      });
      const env = { h, context, games, lang: job.lang, width: job.width, pageErrors: [] };
      context.on("page", (p) => {
        p.on("pageerror", (e) => env.pageErrors.push(`pageerror: ${e.message}`));
        p.on("console", (m) => {
          if (m.type() === "error") env.pageErrors.push(`console: ${m.text()}`);
        });
        p.on("requestfailed", (r) => {
          if (!/ERR_ABORTED/.test(r.failure()?.errorText || ""))
            env.pageErrors.push(`requestfailed: ${r.url()}`);
        });
        p.on("response", (r) => {
          if (r.status() >= 400 && !r.url().includes("favicon"))
            env.pageErrors.push(`http ${r.status()}: ${r.url()}`);
        });
      });
      for (const screen of screens) {
        env.pageErrors.length = 0;
        let page = null;
        try {
          page = await screen.open(env);
          await fn(page, screen, env);
        } catch (error) {
          failures.push({
            screen: screen.id,
            lang: job.lang,
            width: job.width,
            cat: "screen-failed",
            detail: String(error.message).split("\n")[0].slice(0, 200),
          });
        } finally {
          await page?.close().catch(() => {});
        }
        done += 1;
      }
      await context.close();
      process.stdout.write(`  done ${job.lang} ${job.width}px (${done} screens so far)\n`);
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, jobs) }, worker));
  return failures;
}

export function filterScreens(screens, args) {
  return screens.filter(
    (s) =>
      (!args.only.length || args.only.some((o) => s.id.includes(o) || s.group === o)) &&
      (!args.games.length || !s.game || args.games.includes(s.game)),
  );
}

// Groups identical findings across widths/screens so a report lists each defect once with where it shows up.
export function summarize(findings) {
  const groups = new Map();
  for (const f of findings) {
    const key = `${f.cat}|${f.detail}`;
    if (!groups.has(key)) groups.set(key, { cat: f.cat, detail: f.detail, where: new Set() });
    groups.get(key).where.add(`${f.screen}@${f.lang}/${f.width}`);
  }
  return [...groups.values()].sort((a, b) => b.where.size - a.where.size);
}
export function printSummary(findings, limit = 40) {
  const rows = summarize(findings);
  const byCat = {};
  for (const f of findings) byCat[f.cat] = (byCat[f.cat] || 0) + 1;
  console.log(`  findings by category: ${JSON.stringify(byCat)}`);
  for (const row of rows.slice(0, limit)) {
    const sample = [...row.where].slice(0, 3).join(", ");
    console.log(`  [${row.cat}] ${row.detail}  (x${row.where.size}; e.g. ${sample})`);
  }
  if (rows.length > limit)
    console.log(`  ... ${rows.length - limit} more distinct findings (see the JSON report)`);
}

// ---- the in-page audits (self-contained: Playwright serializes them into the page) ---------------------------------------
export function auditLayout() {
  const out = [];
  const W = window.innerWidth;
  const add = (cat, el, detail = "") =>
    out.push({ cat, detail: `${describe(el)}${detail ? ` ${detail}` : ""}` });
  function describe(el) {
    if (!el?.tagName) return String(el);
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string" && el.className.trim()
        ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
        : "";
    const hook = el.getAttribute("data-testid") ? `[${el.getAttribute("data-testid")}]` : "";
    const text = (el.getAttribute("aria-label") || el.textContent || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 28);
    return `${el.tagName.toLowerCase()}${id}${cls}${hook}${text ? ` "${text}"` : ""}`;
  }
  const ours = (el) => !el.closest("#nsr-root");
  const vis = (el) => el.checkVisibility({ visibilityProperty: true });
  const tiny = (r) => r.width <= 2 || r.height <= 2;
  const skipLink = (el) => el.matches(".skip-link, a.fm2-sr");
  const scrollerOf = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) return p;
    }
    return null;
  };
  const clipped = (el) => {
    let r = el.getBoundingClientRect();
    let box = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let p = el.parentElement; p; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (p === document.documentElement || p === document.body) continue;
      if (/(auto|scroll|hidden|clip)/.test(s.overflowX + s.overflowY)) {
        const c = p.getBoundingClientRect();
        box = {
          left: Math.max(box.left, c.left),
          top: Math.max(box.top, c.top),
          right: Math.min(box.right, c.right),
          bottom: Math.min(box.bottom, c.bottom),
        };
      }
    }
    return box;
  };
  const all = [...document.body.querySelectorAll("*")].filter(
    (el) => !el.closest("svg") || el.tagName.toLowerCase() === "svg",
  );
  const shown = all.filter((el) => vis(el) && ours(el));
  const modal = document.querySelector("dialog[open]");

  // 1 + 2: horizontal overflow of the page and of single elements outside a scrollable region.
  if (document.documentElement.scrollWidth > W + 1) {
    const culprits = shown
      .filter((el) => !skipLink(el) && el.getBoundingClientRect().right > W + 1 && !scrollerOf(el))
      .slice(0, 3);
    out.push({
      cat: "page-overflow",
      detail: `scrollWidth ${document.documentElement.scrollWidth} > ${W}; e.g. ${culprits.map(describe).join(" | ")}`,
    });
  }
  for (const el of shown) {
    const r = el.getBoundingClientRect();
    if (tiny(r) || skipLink(el) || getComputedStyle(el).position === "fixed") continue;
    if ((r.right > W + 1 || r.left < -1 || r.width > W + 1) && !scrollerOf(el))
      add("wide-element", el, `${Math.round(r.left)}..${Math.round(r.right)} of ${W}`);
  }

  // 3: text clipped by overflow hidden (not ellipsis), line clamps, and text spilling out of buttons.
  for (const el of shown) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (
      tiny(r) ||
      el === document.body ||
      skipLink(el) ||
      el.tagName.toLowerCase() === "svg" ||
      el.matches(".fm2-sr")
    )
      continue;
    const cutX =
      /(hidden|clip)/.test(s.overflowX) &&
      el.scrollWidth > el.clientWidth + 1 &&
      s.textOverflow !== "ellipsis";
    const cutY = /(hidden|clip)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1;
    const clamp =
      s.webkitLineClamp && s.webkitLineClamp !== "none" && el.scrollHeight > el.clientHeight + 1;
    if ((cutX || cutY || clamp) && (el.textContent || "").trim())
      add(
        "clipped-text",
        el,
        `scroll ${el.scrollWidth}x${el.scrollHeight} > client ${el.clientWidth}x${el.clientHeight}`,
      );
    else if (
      el.matches("button, a.fm2-btn, summary, label, [role=button]") &&
      s.overflowX === "visible" &&
      el.scrollWidth > el.clientWidth + 1
    )
      add("text-spill", el, `scrollWidth ${el.scrollWidth} > ${el.clientWidth}`);
  }

  // controls: native + ARIA widgets; a visually hidden checkbox/radio is represented by its label.
  const SEL =
    "button, a[href], select, textarea, input:not([type=hidden]), summary, [role=button], [role=slider], [role=radio], [role=checkbox], [role=switch], [draggable=true], [tabindex='0']";
  let controls = [...document.querySelectorAll(SEL)].filter(
    (el) => ours(el) && vis(el) && !skipLink(el),
  );
  controls = controls.map((el) => {
    if (el.matches("input[type=radio], input[type=checkbox]")) {
      const r = el.getBoundingClientRect();
      const hidden = tiny(r) || getComputedStyle(el).opacity === "0";
      const label =
        el.closest("label") || (el.id && document.querySelector(`label[for="${el.id}"]`));
      return hidden && label ? label : el;
    }
    return el;
  });
  controls = [...new Set(controls)].filter(
    (el) =>
      !(
        el.matches("[tabindex='0']") &&
        (el.matches("main, [role=region], [role=group]") || el.querySelector(SEL))
      ),
  );
  if (modal) controls = controls.filter((el) => modal.contains(el));
  const boxes = controls
    .map((el) => ({ el, box: clipped(el) }))
    .filter(({ box }) => box.right - box.left > 1 && box.bottom - box.top > 1);

  // 4: overlap between interactive controls.
  let overlaps = 0;
  for (let i = 0; i < boxes.length && overlaps < 8; i += 1)
    for (let j = i + 1; j < boxes.length && overlaps < 8; j += 1) {
      const a = boxes[i];
      const b = boxes[j];
      if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
      const w = Math.min(a.box.right, b.box.right) - Math.max(a.box.left, b.box.left);
      const h = Math.min(a.box.bottom, b.box.bottom) - Math.max(a.box.top, b.box.top);
      if (w > 2 && h > 2) {
        overlaps += 1;
        out.push({
          cat: "control-overlap",
          detail: `${describe(a.el)} x ${describe(b.el)} (${Math.round(w)}x${Math.round(h)}px)`,
        });
      }
    }

  // 6: touch targets (44x44). Inline links inside a sentence are exempt (WCAG 2.5.8), reported as a note only.
  for (const { el } of boxes) {
    const r = el.getBoundingClientRect();
    if (r.width >= 43.5 && r.height >= 43.5) continue;
    const inline =
      el.matches("a") &&
      getComputedStyle(el).display === "inline" &&
      (el.parentElement?.textContent || "").trim().length >
        (el.textContent || "").trim().length + 12;
    out.push({
      cat: inline ? "inline-link-note" : "small-target",
      detail: `${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}`,
    });
  }
  for (const el of document.querySelectorAll("#nsr-root button, #nsr-root a")) {
    const r = el.getBoundingClientRect();
    if (r.width && r.height && (r.width < 43.5 || r.height < 43.5))
      out.push({
        cat: "external-nsr-small",
        detail: `${describe(el)} ${Math.round(r.width)}x${Math.round(r.height)}`,
      });
  }

  // 7: headings.
  const heads = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6, [role=heading]")].filter(
    (el) => vis(el) && ours(el) && !el.closest("[aria-hidden=true]"),
  );
  const level = (el) => Number(el.tagName[1] || el.getAttribute("aria-level") || 2);
  const h1s = heads.filter((el) => level(el) === 1);
  if (h1s.length !== 1)
    out.push({
      cat: "headings",
      detail: `${h1s.length} visible h1 elements (expected 1): ${h1s.map(describe).join(" | ")}`,
    });
  let prev = 0;
  for (const el of heads) {
    if (!(el.textContent || "").trim()) add("headings", el, "empty heading");
    if (prev && level(el) > prev + 1) add("headings", el, `jumps from h${prev} to h${level(el)}`);
    prev = level(el);
  }
  if (heads.length && level(heads[0]) !== 1)
    add("headings", heads[0], "first heading is not an h1");

  // 8: images and role=img need a name.
  for (const el of document.querySelectorAll("img, [role=img]")) {
    if (!vis(el) || !ours(el) || el.closest("[aria-hidden=true]")) continue;
    const labelled =
      el.getAttribute("aria-labelledby") &&
      document
        .getElementById(el.getAttribute("aria-labelledby").split(/\s+/)[0])
        ?.textContent.trim();
    const named =
      el.getAttribute("aria-label")?.trim() ||
      labelled ||
      el.querySelector(":scope > title")?.textContent.trim() ||
      el.getAttribute("title")?.trim() ||
      (el.tagName === "IMG" &&
        el.hasAttribute("alt") &&
        (el.getAttribute("alt") !== "" || el.getAttribute("role") === "presentation"));
    if (!named) add("img-name", el, "has no accessible name");
  }
  return out;
}

// Does the floating Save/Resume pill or a sticky/fixed bar cover a control that is on screen? Hit-tests five points per
// control at the current scroll position (the caller scrolls to the top and to the bottom).
export function auditCover() {
  const out = [];
  const describe = (el) =>
    `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.getAttribute("data-testid") ? `[${el.getAttribute("data-testid")}]` : ""} "${(el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 24)}"`;
  const vis = (el) => el.checkVisibility({ visibilityProperty: true });
  const covers = [...document.querySelectorAll("*")].filter((el) => {
    if (el.closest("#nsr-root") && el.id !== "nsr-root") return false;
    const s = getComputedStyle(el);
    if (!/(fixed|sticky)/.test(s.position) || !vis(el) || el.matches(".skip-link")) return false;
    const r = el.getBoundingClientRect();
    return r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < window.innerHeight;
  });
  const modal = document.querySelector("dialog[open]");
  const SEL =
    "button, a[href], select, textarea, input:not([type=hidden]), summary, [role=button], [role=slider]";
  for (const el of document.querySelectorAll(SEL)) {
    if (
      !vis(el) ||
      el.closest("#nsr-root") ||
      el.matches(".skip-link, a.fm2-sr") ||
      (modal && !modal.contains(el))
    )
      continue;
    const r = el.getBoundingClientRect();
    if (
      r.width < 2 ||
      r.height < 2 ||
      r.bottom <= 0 ||
      r.top >= window.innerHeight ||
      r.right <= 0 ||
      r.left >= window.innerWidth
    )
      continue;
    const points = [
      [0.5, 0.5],
      [0.2, 0.2],
      [0.8, 0.2],
      [0.2, 0.8],
      [0.8, 0.8],
    ]
      .map(([x, y]) => [r.left + r.width * x, r.top + r.height * y])
      .filter(([x, y]) => x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight);
    for (const [x, y] of points) {
      const hit = document.elementFromPoint(x, y);
      if (!hit || el.contains(hit) || hit.contains(el)) continue;
      const cover = covers.find((c) => c.contains(hit) && !c.contains(el) && !el.contains(c));
      if (cover) {
        out.push({
          cat: "covered-control",
          detail: `${describe(el)} is covered by ${cover.id === "nsr-root" ? "the Save/Resume pill" : describe(cover)}`,
        });
        break;
      }
    }
  }
  return out;
}
