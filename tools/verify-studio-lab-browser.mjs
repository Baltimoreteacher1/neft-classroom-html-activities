// Browser verification for the lab bench inside the Practice Studios (docs/specs/practice-studio-v2.md section 10).
// Explicitly invoked (npm run validate:studio-lab-browser); never starts on ordinary site builds.
//
//   node tools/verify-studio-lab-browser.mjs            every lesson that carries a bench, both pages (Unit 4 included)
//   node tools/verify-studio-lab-browser.mjs 3-3 4-2    only these lessons
//   node tools/verify-studio-lab-browser.mjs --quick    one lesson per unit
//
// For each page it drives the bench the way a student does: a wrong test first (the miss must explain, never print the
// answer), then the right setting, the written items, and the whole mission with its adaptive levels; then it reloads
// to prove the work resumed, and checks the Spanish stack, a phone-width viewport, the console, and axe.
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { UNIT4 } from "../scripts/generate-practice-studios.mjs";
import { goalType, settingsOf, targetSolutions } from "../scripts/lib/practice-studio-bench.mjs";
import { listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(REPO_ROOT, `.${path}`);
  if (!file.startsWith(`${resolve(REPO_ROOT)}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
  if (!existsSync(file) || !statSync(file).isFile())
    return void res.writeHead(404).end("Not found");
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

/* ---- which pages ------------------------------------------------------------------------------------ */
const args = process.argv.slice(2);
const quick = args.includes("--quick");
const wanted = args.filter((a) => /^\d+-\d+$/.test(a));
const STUDIO_UNITS = [2, 3, 5, 6, 7, 8, 9];
const benchOf = (id) => {
  const rel = /^4-/.test(id)
    ? `data/practice-studio-u4/${id}.json`
    : `data/practice-studio/${id}.json`;
  return existsSync(join(REPO_ROOT, rel))
    ? JSON.parse(readFileSync(join(REPO_ROOT, rel), "utf8")).bench
    : null;
};
const pageUrl = (id, mode) => {
  if (/^4-/.test(id)) {
    const [, practice, challenge] = UNIT4.find(([u]) => u === id);
    return `${origin}/math/unit-4/${mode === "practice" ? practice : challenge}/`;
  }
  return `${origin}/math/practice-studio/${id}/${mode === "practice" ? "" : "challenge/"}`;
};
let ids = [
  ...listLessonDirs({ filter: /^\d+-\d+$/ }).filter((id) =>
    STUDIO_UNITS.includes(Number(id.split("-")[0])),
  ),
  ...UNIT4.map(([id]) => id),
]
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
  .filter((id) => benchOf(id));
if (wanted.length) ids = ids.filter((id) => wanted.includes(id));
if (quick) {
  const seen = new Set();
  ids = ids.filter((id) => !seen.has(id[0]) && seen.add(id[0]));
}
assert.ok(ids.length, "no lesson with a bench to verify");

const launch = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {};
const browser = await chromium.launch(launch);
const failures = [];
const stats = { pages: 0, labItems: 0, missions: 0, written: 0, axe: 0 };
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const NOISE = /web-vitals|\/api\/|favicon|Failed to load resource.*(404|401)/i;

/* ---- addressing: a bench item lives in a generated studio stage or a Unit 4 card ------------------------ */
// Every item gets a root selector. In a generated studio that is its section stage; in Unit 4 the card item.
async function planOf(page, unit4) {
  if (!unit4) {
    const sections = await page.evaluate(() => window.StudioRT.api.sections.map((s) => s.items));
    const plan = [];
    sections.forEach((items, s) =>
      items.forEach((it, index) => {
        if (/^lab-/.test(it.id || ""))
          plan.push({ tab: s + 1, index, item: it, root: `#stage-${s + 1}` });
      }),
    );
    return plan;
  }
  const items = await page.evaluate(
    () => JSON.parse(document.getElementById("u4-lab-data").textContent).items,
  );
  await page.evaluate(() =>
    document
      .querySelectorAll("#u4-lab-host .lab-embed-item")
      .forEach((el, i) => el.setAttribute("data-verify-root", String(i))),
  );
  return items.map((item, index) => ({ index, item, root: `[data-verify-root="${index}"]` }));
}

async function openItem(page, spec, unit4) {
  if (unit4) {
    await page.evaluate(
      () =>
        document.getElementById("panel-4")?.classList.contains("active") ||
        document.getElementById("tab-4")?.click(),
    );
    await page.locator(spec.root).scrollIntoViewIfNeeded();
  } else {
    await page.evaluate(({ tab, index }) => {
      const rt = window.StudioRT.api;
      rt.state.idx[tab] = index;
      rt.selectTab(tab);
      rt.render(tab);
    }, spec);
  }
  await page.waitForTimeout(250);
}

// run code with the item's shadow root (model or mission) in hand
const inShadow = (page, spec, sel, fn, arg) =>
  page.evaluate(
    ({ root, sel, fnSrc, arg }) => {
      const host = document.querySelector(`${root} ${sel}`);
      return new Function("host", "arg", `return (${fnSrc})(host, arg)`)(host, arg);
    },
    { root: spec.root, sel, fnSrc: fn.toString(), arg },
  );

const feedback = (page, spec) => page.locator(`${spec.root} .item-fb`).innerText();

/* ---- the four things a student does ---------------------------------------------------------------- */
async function solveLab(page, where, spec) {
  const { item } = spec;
  await page.waitForFunction(
    (s) =>
      !!document.querySelector(`${s.root} .lab-model`)?.shadowRoot?.querySelector("[data-control]"),
    spec,
    { timeout: 15000 },
  );
  const goal = item.goal;
  const type = goalType(goal);
  const set = (i, v) =>
    inShadow(
      page,
      spec,
      ".lab-model",
      (host, a) => {
        const input = host.shadowRoot.querySelector(`[data-control="${a.i}"]`);
        input.value = String(a.v);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      },
      { i, v },
    );
  const check = async () => {
    // "How sure are you?" appears once before the first check; the button is disabled until the student answers it
    const conf = page.locator(`${spec.root} [data-conf="2"]`);
    if (await conf.count()) await conf.click();
    await page.locator(`${spec.root} [data-check-lab]`).click();
  };

  // a wrong test first: it must explain without printing the answer
  if (type === "target") {
    const sols = targetSolutions(item.model, goal);
    const wrong = settingsOf(item.model, goal.free).find(
      (v) => !sols.includes(v) && v !== item.model.values[goal.free],
    );
    if (wrong !== undefined) {
      await set(goal.free, wrong);
      await check();
      const miss = await feedback(page, spec);
      if (!/too (high|low)/i.test(miss))
        fail(where, `${item.id} miss does not say high or low: ${miss.slice(0, 90)}`);
      for (const v of sols)
        if (
          String(v).length > 2 &&
          new RegExp(`(^|[^\\d.])${String(v).replace(".", "\\.")}([^\\d]|$)`).test(
            miss.replace(/model shows[^.]*\./, ""),
          )
        )
          fail(where, `${item.id} miss prints the answer ${v}`);
    }
    await set(goal.free, sols[0]);
  } else if (type === "match") {
    // one wrong build first, then the match
    const [first] = Object.keys(goal.match).map(Number);
    const alt = settingsOf(item.model, first).find(
      (v) => v !== goal.match[first] && v !== item.model.values[first],
    );
    if (alt !== undefined) {
      await set(first, alt);
      await check();
      if (!/not yet|does not meet/i.test(await feedback(page, spec)))
        fail(where, `${item.id} a wrong match was not refused`);
    }
    for (const [i, v] of Object.entries(goal.match)) await set(Number(i), v);
  } else {
    // pass goal: try each test value until the page's own rule accepts one
    for (const v of settingsOf(item.model, 1)) {
      await set(1, v);
      await check();
      if (/Target reached/.test(await feedback(page, spec))) break;
    }
  }
  if (type !== "pass") await check();
  const done = await feedback(page, spec);
  if (!/Target reached/.test(done)) fail(where, `${item.id} did not solve: ${done.slice(0, 100)}`);
  stats.labItems++;
}

async function solveWritten(page, where, spec) {
  const { item } = spec;
  await page
    .locator(`${spec.root} [data-write]`)
    .fill(
      `${"x".repeat(Math.max(item.min, 40))} because the model shows the ratio stays the same.`,
    );
  await page.locator(`${spec.root} [data-check-write]`).click();
  for (const cb of await page.locator(`${spec.root} [data-rubric]`).all()) await cb.check();
  await page.locator(`${spec.root} [data-rubric-done]`).click();
  const text = await feedback(page, spec);
  if (!/Saved/.test(text))
    fail(where, `${item.id} written item did not save: ${text.slice(0, 80)}`);
  stats.written++;
}

async function playMission(page, where, spec) {
  const { item } = spec;
  await page.waitForFunction(
    (s) =>
      !!document.querySelector(`${s.root} .lab-mission`)?.shadowRoot?.querySelector("[data-site]"),
    spec,
    { timeout: 15000 },
  );
  const V = await page.evaluate(
    () =>
      window.StudioRT.api?.data?.labV ||
      JSON.parse(document.getElementById("u4-lab-data")?.textContent || "{}").labV,
  );
  for (const round of [2, 0, 1]) {
    const result = await page.evaluate(
      async ({ root, round, V, model }) => {
        const shadow = document.querySelector(`${root} .lab-mission`).shadowRoot;
        const m = await import(`/curriculum/learning-labs/shared/math.mjs?v=${V}`);
        shadow.querySelector(`[data-site="${round}"]`).click();
        await new Promise((r) => setTimeout(r, 350));
        const level = Number(shadow.querySelector(".lab-expedition-deck").dataset.level);
        const puzzleRound = Number(shadow.querySelector(".lab-expedition-deck").dataset.round);
        const p = m.puzzle(model, puzzleRound, level);
        const set = (i, v) => {
          const input = shadow.querySelector(`#game-${i}`);
          input.value = String(v);
          input.dispatchEvent(new Event("input", { bubbles: true }));
        };
        let missText = "";
        let trailAfterMiss = 0;
        if (round === 0 && model.kind !== "inequality") {
          // one wrong test: it must explain, not hand over the answer
          const f = p.free;
          // one grid step away from the plan, on the control's own step (a division model steps by 1.2, not 1)
          const c = m.controls(model)[f];
          const up = Number((p.goal[f] + c.step).toFixed(6));
          const alt = up <= c.max ? up : Number((p.goal[f] - c.step).toFixed(6));
          if (alt !== p.goal[f] && alt >= c.min && alt <= c.max) {
            set(f, alt);
            await new Promise((r) => setTimeout(r, 60));
            shadow.querySelector("[data-check]").click();
            missText = shadow.querySelector(".game-feedback").textContent;
            trailAfterMiss = shadow.querySelectorAll(".lab-trail li").length;
          }
        }
        // the hint ladder: three presses give a question, the relationship, and (where there is one) a worked build with other numbers
        let hintInfo = null;
        if (round === 1) {
          for (let k = 0; k < 3; k++) shadow.querySelector("[data-hint]").click();
          const items = [...shadow.querySelectorAll(".lab-hints li")].map((li) => li.textContent);
          const goalText = String(p.goal[p.free]);
          const leak = items
            .slice(0, 2)
            .some((t) =>
              new RegExp(`(^|[^\\d.])${goalText.replace(".", "\\.")}([^\\d]|$)`).test(t),
            );
          hintInfo = {
            n: items.length,
            leak,
            same: items[2] ? items[2].includes(`to ${goalText} makes`) : false,
          };
        }
        if (model.kind === "inequality") {
          const threshold = p.start[0];
          const pass = round % 2 === 0;
          set(
            1,
            model.mode === "entry" ? threshold + (pass ? 1 : -1) : threshold + (pass ? -1 : 1),
          );
        } else if (model.kind === "coordinates" && ["reflect", "symmetry"].includes(model.mode)) {
          p.goal.forEach((v, i) => set(i, v));
        } else set(p.free, p.goal[p.free]);
        await new Promise((r) => setTimeout(r, 60));
        shadow.querySelector("[data-check]").click();
        await new Promise((r) => setTimeout(r, 150));
        const text = shadow.querySelector(".game-feedback").textContent;
        // the "how did you find it?" reflection appears after a restore made without a hint; tap one to prove it saves
        const chip = shadow.querySelector(".lab-strategy:not([hidden]) [data-strategy]");
        if (round === 2 && chip) chip.click();
        shadow.querySelector("[data-check]").click();
        await new Promise((r) => setTimeout(r, 200));
        return {
          level,
          text,
          missText,
          hintInfo,
          trail: trailAfterMiss,
        };
      },
      { root: spec.root, round, V, model: item.model },
    );
    if (result.hintInfo && (result.hintInfo.n < 2 || result.hintInfo.leak || result.hintInfo.same))
      fail(where, `mission hint ladder is wrong: ${JSON.stringify(result.hintInfo)}`);
    if (round === 0 && result.missText && !result.trail)
      fail(where, "a wrong test left no line in the test trail");
    if (!/restored/.test(result.text))
      fail(where, `mission destination ${round}: ${result.text.slice(0, 100)}`);
    if (result.missText && !/Test \d/.test(result.missText))
      fail(where, `mission miss gave no diagnosis: ${result.missText.slice(0, 80)}`);
  }
  const done = await feedback(page, spec);
  if (!/Mission complete/.test(done))
    fail(where, `mission did not complete the item: ${done.slice(0, 100)}`);
  // the construction log names every build in the model's own words, and the reflection was kept
  const log = await page.evaluate((root) => {
    const shadow = document.querySelector(`${root} .lab-mission`).shadowRoot;
    return {
      rows: [...shadow.querySelectorAll(".lab-expedition-deck details li")].map(
        (li) => li.textContent,
      ),
      summary: shadow.querySelector(".lab-summary")?.textContent || "",
    };
  }, spec.root);
  if (log.rows.length !== 3 || log.rows.some((r) => !/\d/.test(r) || !/test \d/.test(r)))
    fail(
      where,
      `mission log is not three builds with their equations: ${JSON.stringify(log.rows).slice(0, 160)}`,
    );
  if (!log.rows.some((r) => /I reasoned|I estimated|I tried|field guide/.test(r)))
    fail(where, "the strategy reflection was not kept in the log");
  if (!/Your expedition/.test(log.summary))
    fail(where, "the completed expedition shows no summary");
  stats.missions++;
}

/** Items solved, read from where the page keeps them, so a reload can be compared with what came before. */
const solvedCount = (page, unit4) =>
  page.evaluate((u4) => {
    if (!u4) {
      const s = window.StudioRT.api.state;
      return Object.keys(s.solved3).length + Object.keys(s.solved4).length;
    }
    const key = JSON.parse(document.getElementById("u4-lab-data").textContent).key;
    return Object.keys(JSON.parse(localStorage.getItem(key) || "{}").solved || {}).length;
  }, unit4);

/* ---- the sweep ----------------------------------------------------------------------------------------- */
try {
  const runPage = async ({ id, mode }) => {
    const unit4 = /^4-/.test(id);
    {
      const where = `${id} ${mode}`;
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => {
        if (!NOISE.test(String(e))) errors.push(String(e));
      });
      page.on("console", (m) => {
        if (m.type() === "error" && !NOISE.test(m.text())) errors.push(m.text());
      });
      await page.goto(pageUrl(id, mode));
      await page.waitForFunction(
        (u4) =>
          u4
            ? !!window.StudioLabEmbed && !!document.querySelector("#u4-lab-host .lab-embed-item")
            : !!window.StudioRT?.api,
        unit4,
      );
      await page.waitForTimeout(unit4 ? 1200 : 0);
      stats.pages++;
      let plan = await planOf(page, unit4);
      if (plan.length < 3) fail(where, `expected 3+ bench items, found ${plan.length}`);
      try {
        for (const spec of plan) {
          const label = `${where} ${spec.item.id}`;
          await openItem(page, spec, unit4);
          if (spec.item.k === "lab") await solveLab(page, label, spec);
          else if (spec.item.k === "wr") await solveWritten(page, label, spec);
          else if (spec.item.k === "mission") await playMission(page, label, spec);
        }
        const before = await solvedCount(page, unit4);
        // resume: a reload keeps every solved item
        await page.reload();
        await page.waitForFunction(
          (u4) => (u4 ? !!window.StudioLabEmbed : !!window.StudioRT?.api),
          unit4,
        );
        const after = await solvedCount(page, unit4);
        if (after !== before || !before)
          fail(where, `reload lost progress (${before} -> ${after})`);
        plan = await planOf(page, unit4);
        let first = plan[0];
        // phone width: the bench must not push the page sideways
        await page.setViewportSize({ width: 375, height: 812 });
        await openItem(page, first, unit4);
        await page.waitForTimeout(600);
        const over = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        if (over > 1) fail(where, `horizontal overflow of ${over}px at 375px wide`);
        // Spanish: the stack shows
        await page.setViewportSize({ width: 1366, height: 768 });
        await page.locator("#toggle-es-btn").click();
        plan = await planOf(page, unit4); // Unit 4 redraws its bench on the language change
        first = plan[0];
        await openItem(page, first, unit4);
        if (!(await page.locator(`${first.root} .es-text:visible`).count()))
          fail(where, "Spanish toggle shows no Spanish in the first bench item");
        // the game speaks Spanish too: world text and every sentence carry a Spanish line beneath the English
        const missionSpec = plan.find((x) => x.item.k === "mission");
        if (missionSpec) {
          await openItem(page, missionSpec, unit4);
          await page.waitForFunction(
            (r) =>
              !!document
                .querySelector(`${r} .lab-mission`)
                ?.shadowRoot?.querySelector(".lab-expedition-banner"),
            missionSpec.root,
            { timeout: 15000 },
          );
          const lines = await page.evaluate(
            (r) =>
              document.querySelector(`${r} .lab-mission`).shadowRoot.querySelectorAll(".es-line")
                .length,
            missionSpec.root,
          );
          if (lines < 4) fail(where, `the mission shows ${lines} Spanish lines with Spanish on`);
        }
        if (!unit4) {
          const share = await page.evaluate(() => window.StudioInsight?.shareText?.() || "");
          if (!/Lab bench: .*mission 3 of 3/.test(share))
            fail(where, `share text carries no lab bench line: ${share.slice(-160)}`);
        }
        await page.locator("#toggle-es-btn").click();
        plan = await planOf(page, unit4); // Unit 4 redraws its bench on the language change
        first = plan[0];
        // accessibility on one bench item per page (after the feedback fade-in settles: axe samples a mid-fade colour)
        await page.waitForTimeout(900);
        const axe = await new AxeBuilder({ page })
          .include(first.root)
          .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
          .analyze();
        stats.axe++;
        for (const v of axe.violations.filter(
          (x) => x.impact === "critical" || x.impact === "serious",
        ))
          fail(
            where,
            `axe ${v.id} (${v.impact}): ${v.nodes[0]?.target.join(" ")} ${String(v.nodes[0]?.failureSummary).replace(/\s+/g, " ").slice(0, 220)}`,
          );
      } catch (e) {
        fail(where, `threw: ${String(e).slice(0, 240)}`);
      }
      for (const e of errors) fail(where, `console error: ${e.slice(0, 160)}`);
      await context.close();
    }
  };
  // Pages are independent (a fresh context each), so a small pool keeps the sweep inside the pre-commit gate's time limit.
  const tasks = ids.flatMap((id) => ["practice", "challenge"].map((mode) => ({ id, mode })));
  const POOL = Number(process.env.LAB_BROWSER_POOL || 4);
  await Promise.all(
    Array.from({ length: Math.min(POOL, tasks.length) }, async () => {
      while (tasks.length) await runPage(tasks.shift());
    }),
  );
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`${failures.length} problem(s):\n${failures.slice(0, 80).join("\n")}`);
  process.exit(1);
}
console.log(
  `studio lab browser: ${stats.pages} pages, ${stats.labItems} lab items, ${stats.written} written items, ${stats.missions} missions, ${stats.axe} axe scans — all clear.`,
);
