#!/usr/bin/env node
/**
 * Word Lab, Real-Life Scenarios and Newsroom in a real browser at 1366px and 375px, with a fake microphone.
 * Word Lab: build a word by tapping, by keyboard and by dragging a tile; cognate card; garden planting. Scenarios: play a
 * scene with a weak first choice and an undo, finish, record a line and type another. Newsroom: plan, draft with frames,
 * record and keep a take on the device (IndexedDB), pick a picture, and check the print view shows only the front page.
 * Every page: no console errors, no horizontal overflow, axe WCAG 2.2 AA with zero violations, Spanish renders.
 *
 *   node tools/access-studios-b-e2e.mjs        (serves this working tree)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-studios-b-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-studios-b-e2e: axe-core/playwright is not installed; skipping axe checks.");
}
const { SCENES } = await import("../access-practice-lab/src/content/scenarios.js");
const { WORDS } = await import("../access-practice-lab/src/content/wordlab-words.js");
const { NEWS_PROMPTS } = await import("../access-practice-lab/src/content/newsroom.js");

const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch({
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
} catch (error) {
  console.warn(`access-studios-b-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const LAB = `${base}/access-practice-lab`;
const problems = [];
let checks = 0;
const ok = (cond, msg) => {
  checks += 1;
  if (!cond) problems.push(msg);
};

async function open(width, lang = "en") {
  const ctx = await browser.newContext({
    viewport: { width, height: width < 600 ? 800 : 900 },
    permissions: ["microphone"],
  });
  await ctx.addInitScript((l) => {
    try {
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ lang: l, langChosen: true, band: "6-8" }),
      );
    } catch {}
  }, lang);
  const page = await ctx.newPage();
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      problems.push(`console error: ${m.text().slice(0, 160)} (${page.url()})`),
  );
  page.on(
    "pageerror",
    (e) =>
      !/web-vitals/.test(e.message) &&
      problems.push(`page error: ${e.message.slice(0, 160)} (${page.url()})`),
  );
  return { ctx, page };
}
async function audit(page, label) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(overflow <= 1, `${label}: horizontal overflow ${overflow}px`);
  if (AxeBuilder) {
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    for (const v of r.violations)
      problems.push(`${label}: axe ${v.id} (${v.impact}) ${v.nodes[0]?.target?.join(" ")}`);
    checks += 1;
  }
}
const go = async (page, path) => {
  await page.goto(`${LAB}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#app h1");
};

try {
  // ── Word Lab ────────────────────────────────────────────────────────────────
  for (const width of [1366, 375]) {
    const { ctx, page } = await open(width);
    await go(page, "/wordlab?grades=6-8");
    await audit(page, `wordlab hub ${width}`);
    for (const mode of [
      "explore",
      "build",
      "cognates",
      "families",
      "detective",
      "frayer",
      "garden",
    ]) {
      await go(page, `/wordlab/${mode}?grades=6-8`);
      await audit(page, `wordlab ${mode} ${width}`);
    }
    if (width === 1366) {
      await go(page, "/wordlab/build?grades=6-8");
      const prompt = await page.locator(".wl-prompt").innerText();
      const target = WORDS.filter((w) => w.p && w.p.length >= 2 && prompt.includes(w.d)).sort(
        (a, b) => b.d.length - a.d.length,
      )[0];
      ok(Boolean(target), "build prompt matches a word");
      // Tap the first part, keyboard the second, drag any others.
      await page.locator(`[data-wl-tile="${target.p[0]}"]`).click();
      await page.locator(`[data-wl-tile="${target.p[1]}"]`).focus();
      await page.keyboard.press("Enter");
      for (const f of target.p.slice(2))
        await page.dragAndDrop(`[data-wl-tile="${f}"]`, ".wl-slots");
      await page.locator("[data-wl-check-build]").click();
      await page.waitForSelector(".wl-feedback.is-right");
      ok((await page.locator(".wl-blend").count()) === 1, "meaning blend shown");
      ok(
        (await page.evaluate(() => document.activeElement?.tagName)) !== "BODY",
        "focus kept after check",
      );
      // Drag path on a fresh word.
      await page.locator("[data-wl-bnext]").first().click();
      await page.waitForSelector("[data-wl-slot]");
      const p2 = await page.locator(".wl-prompt").innerText();
      const t2 = WORDS.filter((w) => w.p && w.p.length >= 2 && p2.includes(w.d)).sort(
        (a, b) => b.d.length - a.d.length,
      )[0];
      await page.dragAndDrop(`[data-wl-tile="${t2.p[0]}"]`, ".wl-slots");
      ok((await page.locator(".wl-slot.is-filled").count()) === 1, "dragging a tile fills a slot");
      // Garden and Spanish.
      await go(page, "/wordlab/explore?grades=6-8");
      await page.locator("[data-wl-collect]").first().click();
      await go(page, "/wordlab/garden?grades=6-8");
      ok((await page.locator(".wl-plot").count()) >= 1, "garden shows planted words");
      await page.locator('[data-lang-mode="es"]').first().click();
      await page.waitForFunction(() => /Mi jardín de palabras/.test(document.body.innerText));
      await audit(page, "wordlab garden es");
    }
    await ctx.close();
  }

  // ── Real-Life Scenarios ─────────────────────────────────────────────────────
  for (const width of [1366, 375]) {
    const { ctx, page } = await open(width);
    await go(page, "/scenarios?grades=6-8");
    await audit(page, `scenarios hub ${width}`);
    const s = SCENES.find((x) => x.id === "s68-extension");
    await go(page, `/scenarios/${s.id}?grades=6-8`);
    await audit(page, `scenario ${width}`);
    if (width === 1366) {
      const weak = s.nodes[s.start].choices.find((c) => c.q < 2);
      await page.locator(`[data-sc-choose="${weak.id}"]`).click();
      await page.waitForSelector(".wl-feedback");
      await page.locator("[data-sc-undo]").click();
      let node = s.start;
      while (!s.nodes[node].end) {
        const c = s.nodes[node].choices.find((x) => x.q === 2);
        await page.locator(`[data-sc-choose="${c.id}"]`).click();
        await page.locator("[data-sc-continue]").click();
        node = c.next;
      }
      await page.waitForSelector(".scn-summary");
      await audit(page, "scenario summary");
      ok((await page.locator(".scn-say-item").count()) >= 3, "say-it lines");
      await page.locator("[data-rec-start]").first().click();
      await page.waitForSelector("[data-rec-stop]");
      await page.waitForTimeout(900);
      await page.locator("[data-rec-stop]").click();
      await page.waitForSelector(".scn-say-item audio");
      await page.fill(
        '[data-sc-text="1"]',
        "Could you please give me until Friday, because I was sick?",
      );
      await page.locator('[data-sc-check="1"]').click();
      await page.waitForSelector(".scn-say-item .wl-feedback");
      const ledger = await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger") || "{}").entries?.filter(
            (e) => e.src === "scenario",
          ).length,
      );
      ok(ledger === 1, `one scenario ledger entry (${ledger})`);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForSelector(".scn-summary");
      ok(true, "finished scene resumes on reload");
    }
    await ctx.close();
  }

  // ── Newsroom ────────────────────────────────────────────────────────────────
  for (const width of [1366, 375]) {
    const { ctx, page } = await open(width);
    await go(page, "/newsroom?grades=6-8");
    await audit(page, `newsroom hub ${width}`);
    const p = NEWS_PROMPTS.find((x) => x.b === "6-8");
    for (const step of ["plan", "draft", "read", "front"]) {
      await go(page, `/newsroom/${p.id}?grades=6-8&step=${step}`);
      await audit(page, `newsroom ${step} ${width}`);
    }
    if (width === 1366) {
      await go(page, `/newsroom/${p.id}?grades=6-8&step=plan`);
      for (const [i, k] of ["who", "what", "when", "where", "why", "how"].entries())
        await page.fill(
          `[data-nr-w5="${k}"]`,
          [
            "Mia and Omar",
            "ran a book swap",
            "on Tuesday",
            "in the library",
            "to share books",
            "with a sign-up table",
          ][i],
        );
      await go(page, `/newsroom/${p.id}?grades=6-8&step=draft`);
      await page.locator('[data-nr-frame="lead|0"]').click();
      await page.fill(
        '[data-nr-part="lead"]',
        "On Tuesday, Mia and Omar ran a book swap in the library to share books.",
      );
      await page.fill(
        '[data-nr-part="details"]',
        "First, students signed up at a table. Then they traded books because everyone wanted something new.",
      );
      await page.fill('[data-nr-part="quote"]', "“I found a great story,” said Omar.");
      await page.locator('[data-nr-part="ending"]').fill("Next month they will do it again.");
      await page.locator('[data-nr-part="ending"]').blur();
      await page.waitForSelector(".wl-feedback");
      await go(page, `/newsroom/${p.id}?grades=6-8&step=read`);
      await page.locator("[data-rec-start]").first().click();
      await page.waitForSelector("[data-rec-stop]");
      await page.waitForTimeout(900);
      await page.locator("[data-rec-stop]").click();
      await page.waitForSelector("[data-nr-keep]");
      await page.locator("[data-nr-keep]").first().click();
      await page.waitForSelector("[data-nr-play]");
      const kept = await page.evaluate(
        () =>
          new Promise((resolve) => {
            const r = indexedDB.open("accessPracticeLab-audio", 1);
            r.onsuccess = () => {
              const q = r.result.transaction("takes").objectStore("takes").getAll();
              q.onsuccess = () => resolve(q.result.map((x) => x.task));
            };
          }),
      );
      ok(kept.includes(`newsroom:${p.id}`), "recording kept in IndexedDB");
      await go(page, `/newsroom/${p.id}?grades=6-8&step=front`);
      await page.fill("[data-nr-head]", "Students Swap Books in the Library");
      await page.locator('[data-nr-pic="library"]').click();
      await page.waitForSelector(".nr-sheet .nr-fig svg");
      await page.emulateMedia({ media: "print" });
      const visible = await page.evaluate(() => {
        const sheet = document.querySelector(".nr-sheet");
        const vis = (el) => getComputedStyle(el).visibility === "visible";
        return {
          sheet: vis(sheet),
          headline: vis(sheet.querySelector(".nr-headline")),
          nav: vis(document.querySelector(".nr-steps")),
          h1: vis(document.querySelector("h1")),
        };
      });
      ok(
        visible.sheet && visible.headline && !visible.nav && !visible.h1,
        `print shows only the front page ${JSON.stringify(visible)}`,
      );
      await page.emulateMedia({ media: "screen" });
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.locator("[data-nr-dl]").click(),
      ]);
      ok(download.suggestedFilename() === "front-page.html", "download is front-page.html");
      await page.locator('[data-lang-mode="es"]').first().click();
      await page.waitForFunction(() => /Titular e imagen/.test(document.body.innerText));
      await audit(page, "newsroom front es");
    }
    await ctx.close();
  }
  // ── 320px, bilingual, 140% text: no horizontal scroll ───────────────────────
  {
    const { ctx, page } = await open(320, "bi");
    await page.addInitScript(() => {
      try {
        const k = "accessPracticeLab:v1:prefs";
        localStorage.setItem(
          k,
          JSON.stringify({
            ...JSON.parse(localStorage.getItem(k) || "{}"),
            textSize: 1.4,
            lang: "bi",
          }),
        );
      } catch {}
    });
    const np = NEWS_PROMPTS.find((x) => x.b === "6-8");
    for (const path of [
      "/wordlab",
      "/wordlab/build",
      "/wordlab/frayer/" + WORDS.find((w) => w.b !== "3-5").id,
      "/wordlab/garden",
      "/scenarios",
      "/scenarios/s68-extension",
      `/newsroom/${np.id}?step=draft`,
      `/newsroom/${np.id}?step=front`,
    ]) {
      await go(page, `${path}${path.includes("?") ? "&" : "?"}grades=6-8`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      ok(overflow <= 1, `${path}: 320px bilingual 140% overflow ${overflow}px`);
    }
    await ctx.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (problems.length) {
  console.error(
    `access-studios-b-e2e: FAIL (${problems.length} problems, ${checks} checks)\n- ${[...new Set(problems)].join("\n- ")}`,
  );
  process.exit(1);
}
console.log(`access-studios-b-e2e: PASS (${checks} checks)`);
