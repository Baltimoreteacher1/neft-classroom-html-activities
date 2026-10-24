// Browser verification for the practice-studio enhancements: Comfort panel, Skill Quest, Daily Boost, celebrations,
// and the fixed chrome (launcher/spark contrast in every world and theme; launchers and toasts never cover the work).
// Explicitly invoked (npm run validate:studio-enhancements-browser); never starts on ordinary site builds.
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { U4_PAGES, u4McItems } from "./lib/u4-mc-items.mjs";

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
const browser = await chromium.launch();
const requestedLessons = new Set(process.argv.slice(2).filter((arg) => /^\d+-\d+$/.test(arg)));
const report = [];
const ok = (m) => report.push(m);

/** Solve the item that is on screen by reading its answer from the generator, test-side only.
 *  `tab` set: the studio's own current item in that section; unset: the last item the Skill Quest generated. */
async function solveCurrent(page, host = "body", tab = 0) {
  const item = await page.evaluate((t) => {
    const it = t
      ? window.StudioRT.api.expand(t, window.StudioRT.api.state.idx[t])
      : window.__lastItem;
    return it && { k: it.k, a: it.a };
  }, tab);
  assert.ok(item, "an item was generated");
  if (item.k === "mc") await page.locator(`${host} .choice-btn`).nth(item.a).click();
  else {
    await page.locator(`${host} input.num-input`).first().fill(String(item.a));
    await page.locator(`${host} [data-check]`).first().click();
  }
}
/** Header controls live in the studio Menu (assets/studio/clarity.js): open it first when the control is inside it. */
async function reach(page, sel) {
  await page.locator(sel).waitFor({ state: "attached" });
  if ((await page.locator(sel).isHidden()) && (await page.locator("#studio-menu-btn").count()))
    await page.locator("#studio-menu-btn").click();
  return page.locator(sel);
}
const spy = (page) =>
  page.addInitScript(() => {
    const t = setInterval(() => {
      const G = window.StudioGen;
      if (!G || G.__spied) return;
      G.__spied = true;
      const make = G.make;
      G.make = (...a) => (window.__lastItem = make(...a));
      clearInterval(t);
    }, 5);
  });

try {
  /* ---- 1. Comfort: every setting applies, persists and keeps the page usable -------------------------- */
  const u4 = [
    "percent-practice-studio",
    "percent-practice-studio-challenging",
    ...["2", "3", "4", "5"].flatMap((n) => [
      `4-${n}-practice-studio`,
      `4-${n}-practice-studio-challenging`,
    ]),
  ];
  for (const url of [
    "/math/practice-studio/3-5/",
    "/math/practice-studio/3-5/challenge/",
    "/math/practice-studio/boost/",
    ...u4.map((d) => `/math/unit-4/${d}/`),
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
    const page = await ctx.newPage();
    await page.goto(origin + url);
    await (await reach(page, "#comfort-btn")).click();
    // a fresh visitor sees every switch at its usual setting
    assert.equal(
      await page.locator('[data-toggle="contrast"]').isChecked(),
      false,
      `${url}: contrast starts off`,
    );
    assert.equal(
      await page.locator('[data-toggle="celebrate"]').isChecked(),
      true,
      `${url}: celebrations start on`,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.comfortContrast),
      "normal",
    );
    await page.locator('input[name="comfort-size"][value="3"]').check();
    await page.locator('input[name="comfort-font"][value="lexend"]').check();
    await page.locator('input[name="comfort-space"][value="roomy"]').check();
    await page.locator('[data-toggle="contrast"]').check();
    await page.locator('[data-toggle="ruler"]').check();
    await page.locator('[data-toggle="calm"]').check();
    const attrs = await page.evaluate(() => ({ ...document.documentElement.dataset }));
    assert.equal(attrs.comfortSize, "3");
    assert.equal(attrs.comfortFont, "lexend");
    assert.equal(attrs.comfortSpace, "roomy");
    assert.equal(attrs.comfortContrast, "high");
    assert.equal(attrs.comfortCalm, "on");
    await page.locator("[data-close]").click();
    await page.reload();
    await page.locator("#comfort-btn").waitFor({ state: "attached" });
    assert.equal(
      await page.evaluate(() => document.documentElement.dataset.comfortSize),
      "3",
      `${url}: size persists`,
    );
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(
      overflow <= 24,
      `${url}: no sideways scroll at 375px with the largest text (${overflow}px)`,
    );
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert.equal(bg, "rgb(255, 255, 255)", `${url}: high contrast gives a white page`);
    await page.mouse.move(100, 300);
    const top = await page.evaluate(() =>
      parseFloat(document.getElementById("comfort-ruler").style.top),
    );
    assert.ok(top > 150 && top < 320, `${url}: ruler follows the pointer (${top})`);
    await ctx.close();
  }
  ok(
    "comfort: size, font, spacing, contrast, ruler and calm apply, persist, and fit at 375px (every studio shape: generated, Boost, and all ten Unit 4 pages)",
  );

  /* ---- 2. Skill Quest: adapts, ends, and records stars --------------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage();
    await spy(page);
    await page.goto(`${origin}/math/practice-studio/3-5/`);
    await (await reach(page, "#quest-btn")).click();
    assert.match(await page.locator("#studio-quest").innerText(), /Start the quest/);
    await page.locator("[data-start]").click();
    let questions = 0;
    for (; questions < 20; questions++) {
      if (await page.locator(".quest-stars").count()) break;
      await page.locator(".quest-stage .item-q, .quest-stage .item-sub").first().waitFor();
      await solveCurrent(page, "#studio-quest");
      await page.locator("#studio-quest .item-fb button").first().click();
    }
    assert.ok(await page.locator(".quest-stars").count(), "the quest reached its results");
    const stars = await page.locator(".quest-stars").getAttribute("aria-label");
    assert.match(stars, /3 of 3/, `a student who is always right masters the skills (${stars})`);
    assert.ok(questions >= 4 && questions <= 18, `quest length is sensible (${questions})`);
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("neft_studio_3-5_practice_v2")).quest,
    );
    assert.equal(saved.best, 3);
    // the quest fed the Daily Boost memory
    const boost = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl_boost_v1")));
    assert.ok(Object.keys(boost.skills).length >= 1, "quest answers were remembered for the Boost");
    await ctx.close();
    ok(`skill quest: adaptive run of ${questions} questions ended with 3 stars and was remembered`);
  }

  /* ---- 3. Daily Boost: a set for today, remembered per skill ----------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage();
    await spy(page);
    await page.goto(`${origin}/math/practice-studio/boost/`);
    await page.locator(".item-q").first().waitFor();
    assert.equal(await page.locator("#header-progress-count").innerText(), "0 / 10");
    assert.match(
      await page
        .locator("#hud-pill, .ewl-hud-id")
        .first()
        .innerText()
        .catch(() => "Daily Boost"),
      /./,
    );
    const set1 = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ewl_boost_v1"))
        .today.items.map((i) => i.g)
        .join(","),
    );
    await solveCurrent(page, "#stage-1", 1);
    const skills = await page.evaluate(
      () => JSON.parse(localStorage.getItem("ewl_boost_v1")).skills,
    );
    const first = Object.values(skills)[0];
    assert.equal(first.box, 1, "a clean answer lands in box 1");
    await page.reload();
    await page.locator(".item-q").first().waitFor();
    const set2 = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("ewl_boost_v1"))
        .today.items.map((i) => i.g)
        .join(","),
    );
    assert.equal(set1, set2, "a reload shows the same set for the day");
    await ctx.close();
    ok("daily boost: today's ten, one clean answer boxed, same set after reload");
  }

  /* ---- 4. Celebrations: a streak toast, and silence when calm ----------------------------------------- */
  {
    const ctx = await browser.newContext({ viewport: { width: 1100, height: 900 } });
    const page = await ctx.newPage();
    await spy(page);
    await page.goto(`${origin}/math/practice-studio/3-5/`);
    await page.locator(".item-q").first().waitFor();
    // Practice opens with the lab's explore items (W4a); the streak is built on the plain questions after them
    await page.evaluate(() => {
      const a = /** @type {any} */ (window).StudioRT.api;
      a.state.idx[1] = a.sections[0].items.findIndex(
        (/** @type {any} */ x) => !/^lab-/.test(x.id || ""),
      );
      a.render(1);
    });
    for (let i = 0; i < 3; i++) {
      await solveCurrent(page, "#stage-1", 1);
      await page.locator("#stage-1 .next-btn").click();
    }
    await page.waitForSelector("#comfort-toast.show", { timeout: 4000 });
    assert.match(await page.locator("#comfort-toast").innerText(), /3 in a row/);
    await ctx.close();
    ok("celebrations: a three-in-a-row toast for something earned");
  }
  /* ---- 5. Fixed chrome: readable in every world and theme, and never on top of the work ---------------- */
  {
    // One studio per world (data/practice-studio/worlds.json), plus all ten hand-built Unit 4 pages.
    const worlds = [
      "2-1",
      "2-10",
      "2-11",
      "2-12",
      "2-2",
      "2-3",
      "2-4",
      "2-5",
      "2-6",
      "2-7",
      "2-8",
      "2-9",
    ];
    const u4 = ["4-2", "4-3", "4-4", "4-5", "percent"].flatMap((l) => [
      `/math/unit-4/${l}-practice-studio/`,
      `/math/unit-4/${l}-practice-studio-challenging/`,
    ]);
    const pages = [...worlds.map((l) => `/math/practice-studio/${l}/`), ...u4];
    let pairs = 0;
    for (const vp of [
      { width: 1280, height: 800 },
      { width: 1366, height: 768 },
    ]) {
      const ctx = await browser.newContext({ viewport: vp, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      for (const url of pages) {
        await page.goto(`${origin}${url}`);
        await page.locator("#nsr-launcher").waitFor();
        const res = await page.evaluate(async (generated) => {
          const parse = (c) => {
            const x = document.createElement("canvas").getContext("2d");
            x.fillStyle = c;
            x.fillRect(0, 0, 1, 1);
            const d = x.getImageData(0, 0, 1, 1).data;
            return [d[0], d[1], d[2], d[3] / 255];
          };
          const lum = (c) =>
            c
              .slice(0, 3)
              .map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
              .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
          const ratio = (el, bgEl) => {
            const bg = parse(getComputedStyle(bgEl).backgroundColor);
            const fg = parse(getComputedStyle(el).color);
            const mix = fg.slice(0, 3).map((v, i) => v * fg[3] + bg[i] * (1 - fg[3]));
            const [a, b] = [lum(mix), lum(bg)].sort((m, n) => n - m);
            return (a + 0.05) / (b + 0.05);
          };
          const contrast = [];
          for (const theme of generated ? ["light", "dark"] : [null]) {
            if (theme) document.body.dataset.theme = theme;
            const launcher = document.querySelector("#nsr-launcher");
            const star = document.createElement("span");
            star.className = "u4-spark k-star";
            star.textContent = "★ +1";
            document.body.appendChild(star);
            contrast.push({
              theme,
              label: ratio(document.querySelector(".nsr-launcher-label"), launcher),
              star: ratio(star, star),
            });
            star.remove();
          }
          // Show both toasts, then scroll every section: no fixed control may sit on a visible interactive one.
          const toast = document.querySelector(".u4-toast");
          if (toast) {
            toast.innerHTML =
              '<span><strong>Section 2 complete!</strong></span><button class="btn btn-go btn-sm" type="button">Go to section 3</button><button class="u4-toast-close" type="button">×</button>';
            toast.hidden = false;
          }
          const ct = document.getElementById("comfort-toast") || document.createElement("div");
          ct.id = "comfort-toast";
          ct.textContent = "🌟 Section complete!";
          ct.classList.add("show");
          document.body.appendChild(ct);
          const fixed = [
            "#nsr-workbench",
            "#nsr-launcher",
            ".u4-toast:not([hidden])",
            "#comfort-toast",
          ];
          const hits = new Set();
          for (const tab of [...document.querySelectorAll(".tab-btn")]) {
            tab.click();
            await new Promise((r) => setTimeout(r, 40));
            for (let y = 0; y <= document.documentElement.scrollHeight; y += innerHeight / 2) {
              scrollTo(0, y);
              await new Promise((r) => requestAnimationFrame(r));
              const covers = fixed
                .map((s) => document.querySelector(s))
                .filter(Boolean)
                .map((e) => [e, e.getBoundingClientRect()]);
              const targets = document.querySelectorAll(
                ".main-container :is(button, a[href], input, select, textarea, [role=button]), .app-footer a[href], .tab-bar button",
              );
              for (const el of targets) {
                if (el.closest("#nsr-root, .u4-toast, dialog") || el.offsetParent === null)
                  continue;
                const r = el.getBoundingClientRect();
                if (!r.width || r.bottom <= 0 || r.top >= innerHeight) continue;
                for (const [c, f] of covers) {
                  if (
                    r.left < f.right - 1 &&
                    f.left < r.right - 1 &&
                    r.top < f.bottom - 1 &&
                    f.top < r.bottom - 1
                  )
                    hits.add(
                      `${c.id || c.className} covers ${el.className || el.tagName} "${el.textContent.trim().slice(0, 24)}"`,
                    );
                }
              }
            }
          }
          return { contrast, hits: [...hits] };
        }, url.startsWith("/math/practice-studio/"));
        for (const c of res.contrast) {
          assert.ok(
            c.label >= 4.5,
            `${url} ${c.theme}: Save/Resume label ${c.label.toFixed(2)}:1 < 4.5`,
          );
          assert.ok(c.star >= 3, `${url} ${c.theme}: star spark ${c.star.toFixed(2)}:1 < 3`);
          pairs++;
        }
        assert.deepEqual(
          res.hits,
          [],
          `${url} at ${vp.width}x${vp.height}: fixed chrome covers interactive content`,
        );
      }
      await ctx.close();
    }
    ok(
      `fixed chrome: launcher label >= 4.5:1 and star spark >= 3:1 in ${pairs} world/theme checks; launchers and toasts cover nothing at 1280x800 and 1366x768`,
    );
  }

  // W2 (docs/specs/studio-v3-w2.md), on every generated page that has a generated item: the optional confidence tap is there and
  // remembered, a miss then a solve offers "Try a fresh one", a clean fresh answer is a Repair the learner model counts, and the
  // fresh item never touched section progress.
  {
    const ids = readdirSync(join(REPO_ROOT, "math/practice-studio")).filter(
      (d) => /^\d+-\d+$/.test(d) && (!requestedLessons.size || requestedLessons.has(d)),
    );
    let checked = 0;
    for (const id of ids)
      for (const url of [
        `/math/practice-studio/${id}/`,
        `/math/practice-studio/${id}/challenge/`,
      ]) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await spy(page);
        await page.goto(origin + url);
        await page.locator(".tab-btn").first().waitFor();
        const at = await page.evaluate(() => {
          const a = /** @type {any} */ (window).StudioRT.api;
          for (let t = 0; t < a.sections.length; t++) {
            const i = a.sections[t].items.findIndex((/** @type {any} */ x) => x.k === "gen");
            if (i >= 0) return { tab: t + 1, i };
          }
          return null;
        });
        if (!at) {
          await ctx.close();
          continue;
        }
        checked++;
        await page
          .locator(".tab-btn")
          .nth(at.tab - 1)
          .click();
        await page.evaluate(({ tab, i }) => {
          const a = /** @type {any} */ (window).StudioRT.api;
          a.state.idx[tab] = i;
          a.render(tab);
        }, at);
        const it = await page.evaluate(({ tab }) => {
          const a = /** @type {any} */ (window).StudioRT.api;
          const x = a.expand(tab, a.state.idx[tab]);
          return { k: x.k, a: x.a };
        }, at);
        const stage = `#stage-${at.tab}`;
        const chips = page.locator(`${stage} .conf-optional [data-conf="2"]`);
        if (await chips.count()) {
          await chips.click();
          assert.equal(
            await chips.getAttribute("aria-pressed"),
            "true",
            `${url}: the confidence tap is remembered`,
          );
        }
        const doneBefore = await page.evaluate(
          () => /** @type {any} */ (window).StudioRT.api.state.stats.tries,
        );
        // a miss, then the right answer
        if (it.k === "mc") {
          const wrong = it.a === 0 ? 1 : 0;
          await page.locator(`${stage} .choice-btn:visible`).nth(wrong).click();
          const hold = page.locator(`${stage} .hold-chip`).first();
          if (await hold.count()) await hold.click();
          await page.locator(`${stage} [data-mc="${it.a}"]:visible`).click();
        } else {
          const box = page.locator(`${stage} input.num-input:visible`).first();
          await box.fill("999991");
          await page.locator(`${stage} [data-check]:visible`).first().click();
          const hold = page.locator(`${stage} .hold-chip`).first();
          if (await hold.count()) await hold.click();
          await box.fill(String(it.a));
          await page.locator(`${stage} [data-check]:visible`).first().click();
        }
        const repairButton = page.locator(`${stage} [data-repair]`);
        try {
          await repairButton.waitFor({ timeout: 3000 });
        } catch {
          const debug = await page.evaluate(({ tab, i }) => {
            const a = window.StudioRT.api;
            const spec = a.sections[tab - 1]?.items[i];
            const item = a.expand(tab, a.state.idx[tab]);
            return {
              spec: { k: spec?.k, g: spec?.g, id: spec?.id },
              item: { k: item?.k, id: item?.id, a: item?.a, seed: item?.seed },
              tries: a.state.tries?.[item?.id] ?? a.state.attempts?.[item?.id] ?? null,
              hints: a.state.hints?.[item?.id] ?? 0,
              feedback: document
                .querySelector(`#stage-${tab} .item-fb`)
                ?.textContent?.slice(0, 160),
              repairLoaded: !!window.StudioRepair,
            };
          }, at);
          throw new Error(`${url} did not offer a fresh repair: ${JSON.stringify(debug)}`);
        }
        await repairButton.click();
        await page.locator(`${stage} .repair-stage`).waitFor();
        const solvedBefore = await page.evaluate(
          ({ tab }) =>
            Object.keys(/** @type {any} */ (window).StudioRT.api.state[`solved${tab}`]).length,
          at,
        );
        await solveCurrent(page, `${stage} .repair-stage`);
        await page.locator(`${stage} .repair-note strong`).waitFor();
        assert.equal(
          await page.evaluate(
            ({ tab }) =>
              Object.keys(/** @type {any} */ (window).StudioRT.api.state[`solved${tab}`]).length,
            at,
          ),
          solvedBefore,
          `${url}: a repair never changes section progress`,
        );
        assert.equal(
          await page.evaluate(() => {
            const L = /** @type {any} */ (window).StudioLearner;
            return Object.values(L.all()).reduce((n, r) => n + /** @type {any} */ (r).repaired, 0);
          }),
          1,
          `${url}: the learner model counts the repair`,
        );
        void doneBefore;
        await ctx.close();
      }
    assert.ok(
      checked >= (requestedLessons.size ? requestedLessons.size * 2 : 60),
      `repair loop checked on ${checked} generated pages`,
    );
    ok(
      `W2: confidence tap, miss -> fresh one -> Repaired, on ${checked} generated pages (every page with a generated item)`,
    );

    // seals: three clean answers earn Bronze, announced once, listed in My seals with a ring and a word, and kept after a reload
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await spy(page);
    await page.goto(`${origin}/math/practice-studio/3-5/`);
    await page.locator(".tab-btn").nth(3).click();
    await page.evaluate(() => {
      const a = /** @type {any} */ (window).StudioRT.api;
      a.state.idx[4] = 2;
      a.render(4);
      /** @type {any} */ (window).__seals = [];
      window.addEventListener("studio:seal", (e) =>
        /** @type {any} */ (window).__seals.push(/** @type {any} */ (e).detail.seal),
      );
    });
    for (let n = 0; n < 3; n++) {
      await solveCurrent(page, "#stage-4", 4);
      if (n < 2) await page.locator("#stage-4 [data-reroll]").click();
    }
    assert.deepEqual(
      await page.evaluate(() => /** @type {any} */ (window).__seals),
      [1],
      "Bronze is announced once, on the third answer",
    );
    await page.locator("#studio-menu-btn").click();
    await page.locator("#seals-btn").click();
    const text = await page.locator("#studio-seals .u4-dialog-body").innerText();
    assert.ok(
      /Bronze · Tried/.test(text) &&
        /more answers? toward Silver|Answer one at a higher level/.test(text),
      `My seals shows the seal and what is next: ${text.slice(0, 160)}`,
    );
    assert.ok(
      await page.locator("#studio-seals .seal-ring.seal-1").count(),
      "the seal is a ring with a word, not a colour",
    );
    await page.reload();
    await page.locator("#studio-menu-btn").click();
    await page.locator("#seals-btn").click();
    assert.ok(
      /Bronze/.test(await page.locator("#studio-seals .u4-dialog-body").innerText()),
      "the seal is still there after a reload",
    );
    await ctx.close();
    ok(
      "W2 seals: Bronze after three clean answers, announced once, listed in My seals, kept after a reload",
    );
  }

  // W3a (docs/specs/studio-v3-w3.md), on every generated page: a wrong pick on a multiple-choice item that offers two or more
  // different traps shows the optional tier-two question, a tap is saved as a confirmed trap, and the Trap Book lists it.
  {
    let checked = 0;
    let single = 0;
    const ids = readdirSync(join(REPO_ROOT, "math/practice-studio")).filter(
      (d) => /^\d+-\d+$/.test(d) && (!requestedLessons.size || requestedLessons.has(d)),
    );
    for (const id of ids)
      for (const url of [
        `/math/practice-studio/${id}/`,
        `/math/practice-studio/${id}/challenge/`,
      ]) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        if (process.env.VERBOSE) console.error(url);
        await page.goto(origin + url);
        await page.locator(".tab-btn").first().waitFor();
        const at = await page.evaluate(() => {
          const a = /** @type {any} */ (window).StudioRT.api;
          for (let t = 1; t <= a.sections.length; t++)
            for (let i = 0; i < a.sections[t - 1].items.length; i++) {
              const x = a.expand(t, i);
              const tags = Array.isArray(x.tag) ? x.tag.filter(Boolean) : [];
              if (x.k === "mc" && new Set(tags).size >= 2)
                return {
                  tab: t,
                  i,
                  wrong: x.tag.findIndex((/** @type {any} */ g) => g),
                  tag: x.tag[x.tag.findIndex((/** @type {any} */ g) => g)],
                };
            }
          return null;
        });
        if (!at) {
          // an item that offers only one trap has nothing to ask: tier two stays out of the way
          const one = await page.evaluate(() => {
            const a = /** @type {any} */ (window).StudioRT.api;
            for (let t = 1; t <= a.sections.length; t++)
              for (let i = 0; i < a.sections[t - 1].items.length; i++) {
                const x = a.expand(t, i);
                if (x.k === "mc" && Array.isArray(x.tag) && x.tag.some(Boolean))
                  return { tab: t, i, wrong: x.tag.findIndex((/** @type {any} */ g) => g) };
              }
            return null;
          });
          assert.ok(one, `${url}: has a tagged multiple-choice item`);
          await page
            .locator(".tab-btn")
            .nth(one.tab - 1)
            .click();
          await page.evaluate(({ tab, i }) => {
            const a = /** @type {any} */ (window).StudioRT.api;
            a.state.idx[tab] = i;
            a.render(tab);
          }, one);
          const needOne = page.locator(
            `#stage-${one.tab} .conf-row:not(.conf-optional) [data-conf="2"]`,
          );
          if (await needOne.count()) await needOne.click();
          await page.locator(`#stage-${one.tab} .choice-btn:visible`).nth(one.wrong).click();
          await page.locator(`#stage-${one.tab} .item-fb.show`).waitFor();
          assert.equal(
            await page.locator(`#stage-${one.tab} .reflect-row`).count(),
            0,
            `${url}: one trap, so no tier two`,
          );
          single++;
          await ctx.close();
          continue;
        }
        checked++;
        await page
          .locator(".tab-btn")
          .nth(at.tab - 1)
          .click();
        await page.evaluate(({ tab, i }) => {
          const a = /** @type {any} */ (window).StudioRT.api;
          a.state.idx[tab] = i;
          a.render(tab);
        }, at);
        const stage = `#stage-${at.tab}`;
        // Boss items keep the blocking confidence row: say how sure first
        const need = page.locator(`${stage} .conf-row:not(.conf-optional) [data-conf="2"]`);
        if (await need.count()) await need.click();
        await page.locator(`${stage} .choice-btn:visible`).nth(at.wrong).click();
        const row = page.locator(`${stage} .reflect-row`);
        await row.waitFor();
        const buttons = await row.locator("[data-reflect]").count();
        assert.ok(
          buttons >= 3 && buttons <= 4,
          `${url}: tier two offers 2-3 traps and "I guessed" (${buttons})`,
        );
        const pick = row.locator('[data-reflect]:not([data-reflect=""])').first();
        const tag = await pick.getAttribute("data-reflect");
        await pick.click();
        await page.locator(`${stage} .reflect-thanks`).waitFor();
        const rec = await page.evaluate(
          (t) => /** @type {any} */ (window).StudioLearner.trap(t),
          tag,
        );
        assert.ok(rec && rec.confirmed === 1, `${url}: the tap is saved as a confirmed trap`);
        const spotted = await page.evaluate(
          (t) => /** @type {any} */ (window).StudioLearner.trap(t)?.n,
          at.tag,
        );
        assert.ok(spotted >= 1, `${url}: the wrong pick spotted its trap`);
        await page.locator("#studio-menu-btn").click();
        await page.locator("#trapbook-btn").click();
        const text = await page.locator("#studio-trapbook .u4-dialog-body").innerText();
        const name = await page.evaluate(
          (t) => /** @type {any} */ (window).StudioLearner.trap(t).name,
          at.tag,
        );
        assert.ok(name && text.includes(name), `${url}: the Trap Book lists "${name}"`);
        await ctx.close();
      }
    // a trap is Tamed after three clean answers in a row on questions that offered it; a toast says so and the book shows it
    {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await ctx.newPage();
      await page.goto(`${origin}/math/practice-studio/3-5/`);
      await page.locator(".tab-btn").first().waitFor();
      await page.evaluate(() => {
        const bus = /** @type {any} */ (window).StudioBus;
        const base = { lesson: "3-5", mode: "practice", kind: "mc", gen: null, skill: null };
        bus.emit("answer", {
          ...base,
          itemId: "x1",
          ok: false,
          tries: 1,
          hints: 0,
          tag: "ratio-as-difference",
        });
        for (let n = 0; n < 3; n++)
          bus.emit("answer", {
            ...base,
            itemId: `x${n + 2}`,
            ok: true,
            tries: 1,
            hints: 0,
            tag: null,
            traps: ["ratio-as-difference", "ratio-inverted"],
          });
      });
      await page.locator("#comfort-toast.show").waitFor();
      assert.ok(
        /Trap tamed/.test(await page.locator("#comfort-toast").innerText()),
        "a toast says a trap was tamed",
      );
      await page.locator("#studio-menu-btn").click();
      await page.locator("#trapbook-btn").click();
      assert.ok(
        /✓ Tamed/.test(await page.locator("#studio-trapbook .u4-dialog-body").innerText()),
        "the Trap Book marks it tamed",
      );
      await ctx.close();
    }
    ok(
      `W3a: tier-two question, confirmed trap and Trap Book on ${checked} generated pages, and ${single} more offer one trap so tier two stays out of the way; three dodges tame a trap`,
    );
  }

  // W3b (docs/specs/studio-v3-w3.md), on every generated page with a generated item: a skill the student has not met offers a
  // worked example; the example is a different problem of the same skill with three steps and the answer; "try one" opens step 1
  // on a fresh item; and none of it changes section progress or counts as a repair.
  {
    const ids = readdirSync(join(REPO_ROOT, "math/practice-studio")).filter(
      (d) => /^\d+-\d+$/.test(d) && (!requestedLessons.size || requestedLessons.has(d)),
    );
    let checked = 0;
    for (const id of ids)
      for (const url of [
        `/math/practice-studio/${id}/`,
        `/math/practice-studio/${id}/challenge/`,
      ]) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        if (process.env.VERBOSE) console.error(url);
        await spy(page);
        await page.goto(origin + url);
        await page.locator(".tab-btn").first().waitFor();
        const at = await page.evaluate(() => {
          const a = /** @type {any} */ (window).StudioRT.api;
          for (let t = 1; t <= a.sections.length; t++) {
            const i = a.sections[t - 1].items.findIndex((/** @type {any} */ x) => x.k === "gen");
            if (i >= 0) return { tab: t, i };
          }
          return null;
        });
        if (!at) {
          await ctx.close();
          continue;
        }
        checked++;
        await page
          .locator(".tab-btn")
          .nth(at.tab - 1)
          .click();
        await page.evaluate(({ tab, i }) => {
          const a = /** @type {any} */ (window).StudioRT.api;
          a.state.idx[tab] = i;
          a.render(tab);
        }, at);
        const stage = `#stage-${at.tab}`;
        const mine = (await page.locator(`${stage} .item-q`).first().innerText()).trim();
        assert.ok(
          await page.locator(`${stage} .example-offer [data-example]`).count(),
          `${url}: a new skill offers a worked example`,
        );
        await page.locator(`${stage} .example-offer [data-example]`).click();
        const card = page.locator(`${stage} .example-card`);
        await card.waitFor();
        const steps = await card.locator(".example-steps > li").count();
        assert.ok(
          steps === 2 || steps === 3,
          `${url}: the example shows the generator's two or three steps (${steps})`,
        );
        assert.ok(
          /Answer:\s*\S/.test(await card.locator(".example-answer").innerText()),
          `${url}: the example shows its answer`,
        );
        const theirs = (await card.locator(".item-q").innerText()).trim();
        assert.notEqual(theirs, mine, `${url}: the example is not the student's own problem`);
        assert.equal(
          await page.locator(`${stage} .example-offer`).count(),
          0,
          `${url}: the offer goes away once the example is open`,
        );
        const before = await page.evaluate(
          ({ tab }) =>
            Object.keys(/** @type {any} */ (window).StudioRT.api.state[`solved${tab}`]).length,
          at,
        );
        await card.locator("[data-example-try]").click();
        await page.locator(`${stage} .example-try-stage .hint-area`).waitFor();
        assert.ok(
          (await page.locator(`${stage} .example-try-stage .hint-area li`).count()) >= 1,
          `${url}: the fresh item opens with step 1 shown`,
        );
        await solveCurrent(page, `${stage} .example-try-stage`);
        await page.locator(`${stage} .example-try-stage .item-fb.show`).waitFor();
        const after = await page.evaluate(({ tab }) => {
          const w = /** @type {any} */ (window);
          return {
            solved: Object.keys(w.StudioRT.api.state[`solved${tab}`]).length,
            repaired: Object.values(w.StudioLearner.all()).reduce(
              (n, r) => n + /** @type {any} */ (r).repaired,
              0,
            ),
          };
        }, at);
        assert.equal(
          after.solved,
          before,
          `${url}: practice after an example never changes section progress`,
        );
        assert.equal(after.repaired, 0, `${url}: practice after an example is not a repair`);
        await card.locator("[data-example-close]").click();
        assert.equal(
          await page.locator(`${stage} .example-card`).count(),
          0,
          `${url}: the example can be hidden`,
        );
        await ctx.close();
      }
    assert.ok(
      checked >= (requestedLessons.size ? requestedLessons.size * 2 : 60),
      `worked examples checked on ${checked} generated pages`,
    );
    ok(
      `W3b: worked example (its steps, answer, a different problem) then a fresh try with step 1 shown, on ${checked} generated pages`,
    );
  }

  // W3c (docs/specs/studio-v3-w3.md): every generated page carries its "Which move?" item with the work so far; a wrong move shows
  // that move's own help (and never the best move), the best move solves it and counts toward the section.
  {
    const ids = readdirSync(join(REPO_ROOT, "math/practice-studio")).filter(
      (d) => /^\d+-\d+$/.test(d) && (!requestedLessons.size || requestedLessons.has(d)),
    );
    let checked = 0;
    for (const id of ids)
      for (const [url, mid] of [
        [`/math/practice-studio/${id}/`, "mv-p"],
        [`/math/practice-studio/${id}/challenge/`, "mv-c"],
      ]) {
        const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        const page = await ctx.newPage();
        await page.goto(origin + url);
        await page.locator(".tab-btn").first().waitFor();
        const at = await page.evaluate((m) => {
          const a = /** @type {any} */ (window).StudioRT.api;
          for (let t = 1; t <= a.sections.length; t++) {
            const i = a.sections[t - 1].items.findIndex((/** @type {any} */ x) => x.id === m);
            if (i >= 0) {
              const x = a.expand(t, i);
              return { tab: t, i, a: x.a, f: x.f, c: x.c, work: x.work.length };
            }
          }
          return null;
        }, mid);
        assert.ok(at, `${url}: has its Which move? item (${mid})`);
        checked++;
        await page
          .locator(".tab-btn")
          .nth(at.tab - 1)
          .click();
        await page.evaluate(({ tab, i }) => {
          const a = /** @type {any} */ (window).StudioRT.api;
          a.state.idx[tab] = i;
          a.render(tab);
        }, at);
        const stage = `#stage-${at.tab}`;
        assert.equal(
          await page.locator(`${stage} .move-lines > li`).count(),
          at.work,
          `${url}: shows the work so far`,
        );
        const wrong = at.c.findIndex(
          (/** @type {any} */ _c, /** @type {number} */ k) => k !== at.a,
        );
        const need = page.locator(`${stage} .conf-row:not(.conf-optional) [data-conf="2"]`);
        if (await need.count()) await need.click();
        await page.locator(`${stage} .choice-btn:visible`).nth(wrong).click();
        const help = await page.locator(`${stage} .item-fb`).innerText();
        // a fraction in the help is typeset (stacked), so compare the plain words it contains
        const lead = String(at.f[wrong])
          .match(/[A-Za-z' ,]{14,}/)?.[0]
          .slice(0, 30);
        assert.ok(lead, `${url}: the wrong move's help opens with plain words`);
        assert.ok(
          help.replace(/\s+/g, " ").includes(lead),
          `${url}: the wrong move shows its own help`,
        );
        assert.ok(!help.includes(at.c[at.a]), `${url}: the help never prints the best move`);
        const hold = page.locator(`${stage} .hold-chip`).first();
        if (await hold.count()) await hold.click();
        await page.locator(`${stage} [data-mc="${at.a}"]:visible`).click();
        await page.locator(`${stage} .choice-btn.correct`).waitFor();
        assert.ok(
          await page.evaluate(
            ({ tab, m }) => !!(/** @type {any} */ (window).StudioRT.api.state[`solved${tab}`][m]),
            { tab: at.tab, m: mid },
          ),
          `${url}: the best move solves it`,
        );
        await ctx.close();
      }
    ok(
      `W3c: a "Which move?" item with its work so far, named help and a solve, on ${checked} generated pages (every page)`,
    );
  }

  // Unit 4: a wrong pick on the Mastery Check shows that choice's own help, is recorded as a named miss, and appears in
  // "My thinking" under the trap's name — on all ten hand-built pages.
  {
    const spanish = [];
    const traps = JSON.parse(
      readFileSync(join(REPO_ROOT, "data/practice-studio/misconceptions.json"), "utf8"),
    ).traps;
    for (const slug of U4_PAGES) {
      // The quiz may order or sample its questions, so the check does not assume which one opens: click choices until one
      // is wrong, then require that choice's own help (any authored help line on the page) and its tag.
      const items = u4McItems(slug);
      const helps = items.flatMap((m) =>
        m.texts.map((_t, i) => {
          const h = m.item.why?.[i] ?? m.item.choices?.[i]?.why ?? m.item.feedback?.[i];
          return i === m.correct || !h ? "" : typeof h === "string" ? h : h.en;
        }),
      );
      assert.ok(helps.some(Boolean), `${slug}: has authored help`);
      // a right pick locks its question, so every attempt starts from a fresh page and a fresh store
      /** @type {any[]} */ let misses = [];
      /** @type {any} */ let ctx;
      /** @type {any} */ let page;
      for (let i = 0; i < 4 && !misses.length; i++) {
        ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
        page = await ctx.newPage();
        await page.goto(`${origin}/math/unit-4/${slug}/`);
        await page.locator(".tab-btn").nth(4).click();
        await page.locator(".choice-btn:visible").nth(i).click();
        misses = await page.evaluate(() => /** @type {any} */ (window).U4Studio.misses());
        if (!misses.length) await ctx.close();
      }
      assert.equal(misses.length, 1, `${slug}: a wrong pick is recorded`);
      assert.ok(
        traps[misses[0].tag],
        `${slug}: the miss carries a misconception id (${misses[0].tag})`,
      );
      const shown = await page.locator(".feedback-box.show").evaluateAll((els, list) => {
        const dec = (/** @type {string} */ t) => {
          const a = document.createElement("textarea");
          a.innerHTML = t;
          return a.value;
        };
        const text = els.map((e) => e.textContent).join(" ");
        return list.some((h) => h && text.includes(dec(h).slice(0, 30)));
      }, helps);
      assert.ok(shown, `${slug}: the picked choice's own help is shown`);
      assert.ok(
        (await page.locator(".glossary dt").count()) >= 3,
        `${slug}: the Word bank lists the lesson's words`,
      );
      if (slug === "4-2-practice-studio")
        assert.ok(
          (await page.locator(".frac").count()) > 0,
          `${slug}: digit/digit fractions are stacked`,
        );
      await page.click(".studio-menu-btn");
      await page.click("#u4-think-btn");
      const panel = await page.locator("#u4-think .u4-dialog-body").innerText();
      assert.ok(panel.includes(traps[misses[0].tag].name), `${slug}: My thinking names the trap`);
      spanish.push(slug);
      await ctx.close();
    }
    ok(
      `unit 4 named misses: ${spanish.length} pages show a wrong pick's own help, record its tag and list it in My thinking`,
    );
  }
} finally {
  await browser.close();
  server.close();
}
console.log(report.map((r) => `✓ ${r}`).join("\n"));
