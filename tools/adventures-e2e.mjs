#!/usr/bin/env node
/**
 * Adventure Worlds (/adventures) in a real browser: hub (seven cards) → Mystery Museum map → mission 1 in Grades 6-8
 * end to end (start choice, read with glossary, clue board with a set-aside clue, a wrong choice then the right one,
 * order with the arrow buttons, a respond check that fails then passes, reload-resume mid-mission, completion
 * artifact, mission log, mission 2 unlocked) → "Write this up in Book Studio" lands the learner's text in the editor →
 * Science Discovery Island mission 1 in Grades 3-5 "With help". axe on hub, map and runner screens; no sideways scroll
 * at 390px. BASE=<url> to point elsewhere; --shots <dir> writes 1280px and 390px screenshots.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("adventures-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const LABDIR = new URL("../access-practice-lab/", import.meta.url);
const { worldById } = await import(new URL("src/adventures/worlds/index.js", LABDIR));
const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const LAB = "/access-practice-lab";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch();
const errors = [];
const settle = async (page) => {
  await page.waitForFunction(() => !document.querySelector(".is-entering"));
  await page.waitForTimeout(250);
};
async function axe(page, sel, name) {
  if (!AxeBuilder) return;
  await settle(page);
  const r = await new AxeBuilder({ page })
    .include(sel)
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${name} ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
  );
}
const shot = async (page, name) => {
  if (!SHOTS) return;
  await settle(page);
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
};
const sceneNo = (page) => page.evaluate(() => new URLSearchParams(location.search).get("scene"));
async function next(page) {
  const before = await sceneNo(page);
  await page.click("[data-adv-next]");
  await page.waitForFunction(
    (b) => new URLSearchParams(location.search).get("scene") !== b,
    before,
  );
  await page.waitForSelector("#app h1");
  await settle(page);
}

/** Play the current scene the way a learner would; returns notes for assertions. */
async function play(page, s, label, { wrongFirst = true } = {}) {
  if (s.kind === "read" && s.glossary?.length) {
    await page.click("[data-adv-gloss]");
    ok(
      (await page.locator(".adv-gloss-card p").count()) === 1,
      `${label}: a glossary word shows its meaning`,
    );
  }
  if (s.kind === "clues") {
    const bad = s.clues.find((c) => !c.relevant);
    if (wrongFirst) {
      await page.click(`[data-adv-clue="${bad.id}"]`);
      const fb = await page.locator(".adv-clues .feedback").first().innerText();
      ok(
        fb.includes(bad.why.en.slice(0, 30)),
        `${label}: a weak clue is set aside with its specific reason`,
      );
    }
    for (const c of s.clues.filter((x) => x.relevant).slice(0, s.need ?? 3))
      await page.click(`[data-adv-clue="${c.id}"]`);
    ok(
      (await page.locator(".adv-board-list li").count()) === (s.need ?? 3),
      `${label}: the evidence board holds ${s.need ?? 3} clues`,
    );
  }
  if (s.kind === "choice") {
    const right = s.options.findIndex((o) => o.correct);
    if (wrongFirst) {
      const wrong = s.options.findIndex((o) => !o.correct);
      await page.click(`[data-adv-option="${wrong}"]`);
      const fb = await page.locator(".adv-choice .feedback.is-hint").innerText();
      ok(
        fb.includes(s.options[wrong].feedback.en.slice(0, 25)) &&
          !fb.includes(s.options[right].text.en),
        `${label}: a wrong choice explains without giving the answer`,
      );
      ok(
        await page.locator("[data-adv-next]").isDisabled(),
        `${label}: Next waits for the right choice`,
      );
    }
    await page.click(`[data-adv-option="${right}"]`);
    ok(
      (await page.locator(".adv-choice .feedback.is-right").count()) === 1,
      `${label}: the right choice is confirmed`,
    );
  }
  if (s.kind === "order") {
    for (let guard = 0; guard < 30; guard++) {
      const t = await page.locator(".adv-order-text").allInnerTexts();
      const pos = t.findIndex((x, i) => x !== s.items[i].en);
      if (pos < 0) break;
      const from = t.indexOf(s.items[pos].en);
      await page.click(`[data-adv-move="${from}"][data-dir="-1"]`);
    }
    await page.click("[data-adv-check-order]");
    ok(
      (await page.locator(".adv-order .feedback.is-right").count()) === 1,
      `${label}: the arrow buttons put the steps in order`,
    );
  }
  if (s.kind === "respond") {
    await page.fill("[data-adv-text]", "I think someone took it.");
    await page.click("[data-adv-check-respond]");
    ok(
      (await page.locator(".adv-respond .feedback.is-hint").count()) === 1,
      `${label}: a thin answer gets a specific next step`,
    );
    ok((await page.locator(".adv-model").count()) === 0, `${label}: no model after one check`);
    await page.fill("[data-adv-text]", s.model.en);
    await page.click("[data-adv-check-respond]");
    ok(
      (await page.locator(".adv-respond .feedback.is-right").count()) === 1,
      `${label}: a complete answer with evidence passes`,
    );
  }
}

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  const go = async (path) => {
    await page.goto(`${origin}${LAB}/${path}`);
    await page.waitForSelector("#app h1", { timeout: 15000 });
    await settle(page);
  };

  // Hub
  await go("adventures?grades=6-8");
  ok((await page.locator(".adv-cards > li:not(.adv-sim-door)").count()) === 7, "hub shows seven world cards");
  ok((await page.locator(".adv-sim-door a[href*='/simulations']").count()) === 1, "hub links the Living Simulations");
  ok((await page.locator("a.adv-card").count()) >= 2, "the built worlds are links");
  await axe(page, ".adv-hub", "hub");
  await shot(page, "hub-1280");

  // World map
  await page.click('a.adv-card[href*="mystery-museum"]');
  await page.waitForSelector(".adv-path");
  await settle(page);
  ok((await page.locator(".adv-node").count()) === 4, "map shows four missions");
  ok(
    (await page.locator(".adv-node.is-available").count()) === 1 &&
      (await page.locator(".adv-node.is-locked").count()) === 3,
    "only mission 1 is open",
  );
  ok(
    (await page.locator(".adv-node.is-final .adv-node-kicker").innerText()).includes("Final"),
    "the last mission is the final demonstration",
  );
  await axe(page, ".adv-world", "world map");
  await shot(page, "map-1280");

  // Mystery Museum, mission 1, Grades 6-8
  const museum = worldById("mystery-museum");
  const m1 = museum.missions[0];
  const scenes = m1.bands["6-8"];
  await page.click(`.adv-node a[href*="${m1.id}"]`);
  await page.waitForSelector("[data-adv-mode]");
  await shot(page, "start-1280");
  await axe(page, ".adv-run", "start screen");
  await page.click('[data-adv-mode="own"]');
  await page.waitForFunction(() => new URLSearchParams(location.search).get("scene") === "0");
  await settle(page);
  ok(
    (await page.locator(".adv-progress .chip").innerText()).includes("On my own"),
    "the learner chose to work on their own",
  );
  for (const [i, s] of scenes.entries()) {
    const label = `museum 6-8 scene ${i + 1} (${s.kind})`;
    ok(
      (await page.locator(".adv-progress").innerText()).includes(
        `Scene ${i + 1} of ${scenes.length}`,
      ),
      `${label}: progress shows the scene`,
    );
    if (s.kind === "story") {
      await page.click("[data-adv-es]");
      ok(
        (await page.locator('.adv-es[lang="es"]').count()) === 1,
        `${label}: Help in Spanish shows the Spanish text`,
      );
      ok(
        (await page.locator(".adv-progress .chip").innerText()).includes("With help"),
        `${label}: opening Spanish marks the mission supported`,
      );
      if (SHOTS) await shot(page, "story-1280");
    }
    await play(page, s, label);
    if (s.kind === "clues") {
      if (SHOTS) await shot(page, "clues-1280");
      await axe(page, ".adv-run", "clue board");
      await page.reload();
      await page.waitForSelector(".adv-clues");
      await settle(page);
      ok(
        (await page.locator(".adv-board-list li").count()) === 3 &&
          (await sceneNo(page)) === String(i),
        "reload resumes on the same scene with the board kept",
      );
    }
    if (s.kind === "choice") {
      if (SHOTS) await shot(page, "choice-1280");
      await axe(page, ".adv-run", "choice");
    }
    if (s.kind === "order" && SHOTS) await shot(page, "order-1280");
    if (s.kind === "respond") {
      if (SHOTS) await shot(page, "respond-1280");
      await axe(page, ".adv-run", "respond");
    }
    if (i === 1) {
      await page.click("[data-adv-back]");
      await page.waitForFunction(() => new URLSearchParams(location.search).get("scene") === "0");
      await settle(page);
      ok((await page.locator(".adv-story").count()) === 1, "Back returns to the previous scene");
      await next(page);
    }
    if (i < scenes.length - 1) await next(page);
  }
  await page.click("[data-adv-next]");
  await page.waitForSelector(".adv-done");
  await settle(page);
  const artifact = await page.locator(".adv-artifact").innerText();
  ok(
    artifact.includes(scenes.at(-1).model.en.slice(0, 40)),
    "completion shows the learner's own text as the artifact",
  );
  ok(
    (await page.locator(".adv-artifact-clues li").count()) === 3,
    "completion lists the clues collected",
  );
  await axe(page, ".adv-run", "completion");
  await shot(page, "done-1280");
  await go("adventures/mystery-museum?grades=6-8");
  ok((await page.locator(".adv-log-item").count()) === 1, "mission log shows the finished mission");
  ok(
    (await page.locator(".adv-node.is-done").count()) === 1 &&
      (await page.locator(".adv-node.is-available").count()) === 1,
    "mission 2 unlocks",
  );
  await shot(page, "map-after-1280");

  // Book Studio handoff
  await page.click(`[data-adv-book="${m1.id}"]`);
  await page.waitForFunction(() => location.pathname.includes("/book-studio/edit/"), null, {
    timeout: 15000,
  });
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.click('.bk-page-item [data-bk-page="1"]');
  await page.waitForTimeout(300);
  ok(
    (await page.locator(".bk-canvas").innerText()).includes(scenes.at(-1).model.en.slice(0, 30)),
    "Book Studio opens with the learner's case note on a page",
  );

  // Science Discovery Island, mission 1, Grades 3-5, With help
  const island = worldById("science-island");
  const t1 = island.missions[0];
  const s35 = t1.bands["3-5"];
  await go(`adventures/science-island/${t1.id}?grades=3-5`);
  await page.click('[data-adv-mode="help"]');
  await page.waitForFunction(() => new URLSearchParams(location.search).get("scene") === "0");
  await settle(page);
  for (const [i, s] of s35.entries()) {
    const label = `island 3-5 scene ${i + 1} (${s.kind})`;
    if (s.kind === "respond") {
      ok(
        (await page.locator(".adv-supports").count()) === 1,
        `${label}: "With help" opens frames and the word bank`,
      );
      if (SHOTS) await shot(page, "island-respond-1280");
    }
    if (s.kind === "read" && SHOTS) await shot(page, "island-read-1280");
    await play(page, s, label, { wrongFirst: i % 2 === 0 });
    if (i < s35.length - 1) await next(page);
  }
  await page.click("[data-adv-next]");
  await page.waitForSelector(".adv-done");
  ok(
    (await page.locator(".adv-artifact .eyebrow").innerText()).includes("with help"),
    "a supported run is labelled honestly",
  );
  await go("portfolio?grades=3-5");
  ok(
    (await page.locator("#app").innerText()).includes(
      s35.find((s) => s.kind === "respond").model.en.slice(0, 30),
    ),
    "the artifact is in the portfolio",
  );

  // Phone: no sideways scroll
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await phone.addInitScript(
    (state) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("accessPracticeLab:v1:adventures", state);
        sessionStorage.setItem("seeded", "1");
      }
    },
    await page.evaluate(() => localStorage.getItem("accessPracticeLab:v1:adventures")),
  );
  const p2 = await phone.newPage();
  p2.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  for (const [path, name] of [
    ["adventures?grades=6-8", "hub"],
    ["adventures/mystery-museum?grades=6-8", "map"],
    [`adventures/mystery-museum/${museum.missions[1].id}?grades=6-8`, "start"],
    [`adventures/mystery-museum/${m1.id}?grades=6-8`, "done"],
    [`adventures/science-island/${island.missions[1].id}?grades=3-5`, "start-island"],
  ]) {
    await p2.goto(`${origin}${LAB}/${path}`);
    await p2.waitForSelector("#app h1");
    await settle(p2);
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `phone: ${path} has no sideways scroll (${over}px)`);
    if (SHOTS) await p2.screenshot({ path: join(SHOTS, `${name}-390.png`), fullPage: true });
  }
  // a scene with the clue board and one with ordering, on the phone
  await p2.click('[data-adv-mode="own"]');
  await p2.waitForFunction(() => new URLSearchParams(location.search).get("scene") === "0");
  const m2 = island.missions[1].bands["3-5"];
  for (let i = 0; i < m2.length && m2[i].kind !== "clues"; i++) {
    await settle(p2);
    if (m2[i].kind === "order") {
      await play(p2, m2[i], `phone order ${i}`);
      const over = await p2.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      ok(over <= 1, `phone: order scene has no sideways scroll (${over}px)`);
      if (SHOTS) await p2.screenshot({ path: join(SHOTS, "order-390.png"), fullPage: true });
    }
    await next(p2);
  }
  await settle(p2);
  const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 1, `phone: clue board has no sideways scroll (${over}px)`);
  if (SHOTS) await p2.screenshot({ path: join(SHOTS, "clues-390.png"), fullPage: true });
  await axe(p2, ".adv-run", "phone clue board");
  await phone.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 3).join(" | ")}`);
console.log(
  failures.length ? `\nadventures-e2e: ${failures.length} FAILED` : "\nadventures-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);
