// G-51 activity-play and G-52 a11y-keyboard: the two verification-pass checks worth keeping as regressions.
//   G-51  every one of the 14 unit activity kinds x 3 grade bands is PLAYED to the end in a real browser by a solver that
//         knows only the authored payload; the stars shown must equal the kind's scoring rules, progress must persist,
//         and the page must raise no console error. A mistake-first run must score exactly what the rules say.
//   G-52  keyboard-only walk, axe (A/AA/2.2), overflow and target size on Studio, Vocabulary, Pathways, Insights and the
//         Language Studio player at 320 and 1024 px.
// A missing browser is SKIP (exit 3), never a pass. Negative controls drive the same code at known-bad inputs.
import fs from "node:fs";
import { startStudioServer } from "../lib/bcpss-studio-serve.mjs";
import { layoutProblems, walkProblems } from "./a11y-walk.mjs";
import { KINDS, SOLVERS } from "./play-solvers.mjs";
import { startServer } from "./server.mjs";

const ROOT = new URL("../../", import.meta.url).pathname.replace(/\/$/, "");
const LEVELS = ["l1_2", "l3_4", "l5_6"];
const BANDS = ["k-2", "3-5", "6-8"];
const bandOf = (g) =>
  ["K", "1", "2"].includes(g) ? "k-2" : ["3", "4", "5"].includes(g) ? "3-5" : "6-8";
// Source-tree artefacts, not defects: Vite resolves `web-vitals` and hashed fonts at build time.
const ignorable = (t) => /web-vitals|\.woff2?(\?|$)|\/assets\/fonts\//.test(t);

async function launch() {
  try {
    const { chromium } = await import("playwright");
    return await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (err) {
    return { skip: String(err?.message || err).split("\n")[0] };
  }
}

// ---------------------------------------------------------------- G-51
const FAKE_SPEECH = () => {
  window.SpeechSynthesisUtterance = class {
    constructor(t) {
      this.text = t;
    }
  };
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: { speak: (u) => setTimeout(() => u.onend?.({}), 5), cancel() {}, getVoices: () => [] },
  });
};

/** One deterministic activity per kind x band, rotating the level so all three levels are played. */
export function playSample(units) {
  const cells = new Map();
  for (const d of units)
    d.studio.activities.forEach((activity, k) => {
      const key = `${activity.kind}|${bandOf(String(d.unit.grade))}`;
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push({ unitId: d.unit.id, index: k + 1, activity });
    });
  const sample = [];
  KINDS.forEach((kind, ki) =>
    BANDS.forEach((band, bi) => {
      const list = cells.get(`${kind}|${band}`) || [];
      if (!list.length) return;
      const pick = list[(ki * 7 + bi * 13 + 3) % list.length];
      sample.push({ ...pick, band, level: LEVELS[(ki + bi) % 3] });
    }),
  );
  return sample;
}

/** The verdict on one play-through. Pure, so a control can feed it a wrong score. */
export function verdict(rec) {
  const errs = [];
  const id = `${rec.kind} ${rec.unitId} a${rec.index} (${rec.mode})`;
  if (rec.fail) errs.push(`${id}: ${rec.fail}`);
  else {
    if (rec.shown !== rec.expect)
      errs.push(`${id}: shows ${rec.shown} stars, the kind's rules say ${rec.expect}`);
    if (rec.persisted !== rec.shown)
      errs.push(`${id}: saved ${rec.persisted} stars but showed ${rec.shown}`);
  }
  for (const e of rec.errors || []) errs.push(`${id}: ${e}`);
  return errs;
}

async function playOne(browser, origin, item, mode, timeout = 9000) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(8000);
  await page.addInitScript(FAKE_SPEECH);
  const errors = [];
  page.on(
    "pageerror",
    (e) => !ignorable(e.message) && errors.push(`pageerror ${String(e.message).slice(0, 100)}`),
  );
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !ignorable(m.text()) &&
      !/Failed to load resource/.test(m.text()) &&
      errors.push(`console ${m.text().slice(0, 100)}`),
  );
  const rec = { kind: item.activity.kind, unitId: item.unitId, index: item.index, mode, errors };
  try {
    await page.goto(
      `${origin}/bcpss-teachers/language-studio/?unit=${item.unitId}&a=${item.index}&level=${item.level}`,
    );
    await page.waitForSelector(`.st-kind[data-kind="${item.activity.kind}"] > *`);
    if (await page.$(".st-stage--placeholder")) throw new Error("placeholder card shown");
    const { expect } = await (item.solver || SOLVERS[item.activity.kind])(
      page,
      item.activity,
      mode,
      item.level,
    );
    await page.waitForSelector(".st-win", { timeout });
    rec.expect = expect;
    rec.shown = Number(
      (await page.$eval(".st-stars", (e) => e.getAttribute("aria-label"))).match(/(\d) of 3/)[1],
    );
    rec.persisted = await page.evaluate(
      ([u, a]) =>
        JSON.parse(localStorage.getItem(`bcpss-studio:${u}`) || "null")?.stars?.[a] ?? null,
      [item.unitId, item.index],
    );
  } catch (e) {
    rec.fail = String(e.message).split("\n")[0].slice(0, 140);
  }
  await ctx.close();
  return rec;
}

async function playAll(browser, origin, items, modes, workers = 3) {
  const queue = items.flatMap((item) => modes.map((mode) => ({ item, mode })));
  const results = [];
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (queue.length) {
        const { item, mode } = queue.shift();
        results.push(await playOne(browser, origin, item, mode));
      }
    }),
  );
  return results;
}

export const g51 = {
  id: "G-51",
  name: "activity-play (14 kinds x 3 bands, real browser)",
  browser: true,
  async run({ data }) {
    const browser = await launch();
    if (browser.skip) return { skip: browser.skip };
    const srv = await startStudioServer(ROOT);
    try {
      const sample = playSample(data.units);
      const results = await playAll(browser, srv.origin, sample, ["clean", "stumble"]);
      const errors = results.flatMap(verdict);
      const kinds = new Set(sample.map((s) => s.activity.kind));
      if (kinds.size < KINDS.length)
        errors.push(`only ${kinds.size} of ${KINDS.length} activity kinds were played`);
      return {
        errors,
        info: { activities: sample.length, runs: results.length, kinds: kinds.size },
      };
    } finally {
      await browser.close();
      await srv.close();
    }
  },
  async controls({ data }) {
    const browser = await launch();
    if (browser.skip) return [{ name: "play controls", errors: [`SKIP: ${browser.skip}`] }];
    const srv = await startStudioServer(ROOT);
    try {
      const item = playSample(data.units).find((s) => s.activity.kind === "word_sort");
      // 1. the solver is given a corrupted copy (first word sorted into the wrong group): the page must never finish.
      const p = structuredClone(item.activity.payload);
      p.items[0].cat = (p.items[0].cat + 1) % p.categories.length;
      const broken = await playOne(
        browser,
        srv.origin,
        { ...item, activity: { ...item.activity, payload: p } },
        "clean",
        2500,
      );
      // 2. a wrong star count must be reported by the verdict.
      const wrongScore = verdict({
        kind: "quiz",
        unitId: "x",
        index: 1,
        mode: "clean",
        expect: 3,
        shown: 2,
        persisted: 2,
        errors: [],
      });
      // 3. a score the page did not save must be reported.
      const unsaved = verdict({
        kind: "quiz",
        unitId: "x",
        index: 1,
        mode: "clean",
        expect: 3,
        shown: 3,
        persisted: null,
        errors: [],
      });
      return [
        {
          name: "solver given a wrong answer never reaches the win screen",
          errors: verdict(broken),
        },
        { name: "stars that differ from the scoring rules", errors: wrongScore },
        { name: "stars shown but not persisted", errors: unsaved },
      ];
    } finally {
      await browser.close();
      await srv.close();
    }
  },
};

// ---------------------------------------------------------------- G-52
const A11Y_ROUTES = [
  "/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1&tab=studio",
  "/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1&tab=vocab",
  "/bcpss-teachers/pathways/?grade=6",
  "/bcpss-teachers/insights/",
  "/bcpss-teachers/language-studio/?unit=g6-math-u1",
  "/bcpss-teachers/language-studio/?unit=g6-math-u1&a=2&level=l3_4",
];
const axeSource = () =>
  fs.readFileSync(new URL("../../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");

async function axeProblems(page) {
  await page.addScriptTag({ content: axeSource() });
  const res = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
    }),
  );
  return res.violations
    .filter((v) => ["serious", "critical"].includes(v.impact))
    .map(
      (v) =>
        `axe ${v.id} (${v.impact}): ${v.nodes
          .slice(0, 2)
          .map((n) => n.target.join(" "))
          .join("; ")}`,
    );
}

const pageProblems = async (page) => [
  ...(await axeProblems(page)),
  ...(await layoutProblems(page)),
  ...(await walkProblems(page)),
];

export const g52 = {
  id: "G-52",
  name: "a11y-keyboard (Tab walk, axe, overflow, targets)",
  browser: true,
  async run() {
    const browser = await launch();
    if (browser.skip) return { skip: browser.skip };
    const { server, base } = await startServer();
    try {
      const errors = [];
      for (const route of A11Y_ROUTES)
        for (const width of [320, 1024]) {
          const ctx = await browser.newContext({ viewport: { width, height: 800 } });
          const page = await ctx.newPage();
          await page.goto(base + route, { waitUntil: "load" });
          await page.waitForTimeout(1200);
          for (const p of await pageProblems(page)) errors.push(`${route} @${width}: ${p}`);
          await ctx.close();
        }
      return { errors, info: { routes: A11Y_ROUTES.length, widths: 2 } };
    } finally {
      await browser.close();
      server.close();
    }
  },
  async controls() {
    const browser = await launch();
    if (browser.skip) return [{ name: "a11y controls", errors: [`SKIP: ${browser.skip}`] }];
    try {
      const run = async (html) => {
        const page = await browser.newPage({ viewport: { width: 320, height: 600 } });
        await page.setContent(
          `<!doctype html><html lang="en"><title>t</title><body><main>${html}</main></body></html>`,
        );
        const out = await pageProblems(page);
        await page.close();
        return out;
      };
      return [
        {
          name: "unnamed button",
          errors: await run(
            "<a href='#a'>one</a><button></button><a href='#b'>two</a><a href='#c'>three</a>",
          ),
        },
        {
          name: "focus outline removed",
          errors: await run(
            "<style>a,button{outline:none;box-shadow:none}</style><a href='#a'>one</a><a href='#b'>two</a><a href='#c'>three</a><button>four</button>",
          ),
        },
        {
          name: "positive tabindex",
          errors: await run(
            "<a href='#a' tabindex='3'>one</a><a href='#b'>two</a><a href='#c'>three</a><a href='#d'>four</a>",
          ),
        },
        {
          name: "13px checkbox and 400px wide element",
          errors: await run(
            "<a href='#a'>one</a><a href='#b'>two</a><a href='#c'>three</a><input type='checkbox' aria-label='x' style='width:13px;height:13px'><div style='width:400px;height:5px'></div>",
          ),
        },
      ];
    } finally {
      await browser.close();
    }
  },
};
