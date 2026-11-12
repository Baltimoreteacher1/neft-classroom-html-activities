#!/usr/bin/env node
/**
 * Practice Together (/practice-together), the family walkthrough, in a real browser:
 *   - a Spanish-speaking family on a phone (375px): one primary action inside the first screen, the guide docked at the
 *     bottom in Spanish, the whole loop inside the real activity (directions, answer, how sure, check, message, try
 *     again) and the hand-off to step 3 with its one "Start practicing" action;
 *   - K–2 in English: the picture-choice activity and its "try again" path;
 *   - keyboard: Tab reaches the guide, Next moves it, Escape hides it ("Show me how" brings it back);
 *   - a reload keeps the step, the grade switch keeps the step links honest, "Start the family guide again" goes back;
 *   - axe WCAG 2.2 AA on every step, no horizontal scroll at 1280/375/320;
 *   - microphone denied inside the teacher tour's speaking preview: the activity says so and the guide stays usable.
 *
 *   node tools/access-intro-family-e2e.mjs        (serves this working tree)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-intro-family-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-intro-family-e2e: axe-core/playwright is not installed; skipping axe checks.");
}

const LAB = "/access-practice-lab";
const PREFS = "accessPracticeLab:v1:prefs";
const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-family-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

const failures = [];
const errors = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};

async function open(lang, width, path, { denyMic = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
  await context.addInitScript(
    ([key, l, deny]) => {
      try {
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ lang: l, langChosen: true }));
      } catch {}
      if (deny && navigator.mediaDevices)
        navigator.mediaDevices.getUserMedia = () =>
          Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
    },
    [PREFS, lang, denyMic],
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(`${path}: ${e.message}`);
  });
  page.on("console", (m) => {
    // web-vitals is a bare specifier resolved at build time; the source tree cannot load it.
    if (m.type() === "error" && !/web-vitals/.test(m.text())) errors.push(`${path}: ${m.text()}`);
  });
  await page.goto(`${base}${LAB}${path}`, { waitUntil: "load" });
  await page.waitForSelector("#app h1", { timeout: 15000 });
  return { context, page };
}

const frame = (page) => page.frameLocator(".gc-frame");
const title = (page) => page.locator(".gc-title").textContent();
async function coachReady(page) {
  await page.waitForSelector(".gc-frame", { timeout: 15000 });
  await frame(page).locator("main h1, main .early-player, [data-early-player]").first().waitFor({ timeout: 20000 });
  await page.waitForSelector(".gc-card", { timeout: 10000 });
}
async function waitTitle(page, re, ms = 6000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (re.test((await title(page)) || "")) return true;
    await page.waitForTimeout(150);
  }
  return false;
}
const noSideScroll = (page) => page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1);
async function axe(page, label) {
  if (!AxeBuilder) return;
  const r = await new AxeBuilder({ page })
    .include("#app")
    .exclude(".gc-frame")
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(bad.length === 0, `${label}: axe serious/critical 0 (${bad.map((v) => v.id).join(", ") || "none"})`);
}

try {
  // ── Spanish family on a phone ──
  {
    const { context, page } = await open("es", 375, "/practice-together?grades=6-8");
    ok(/Practiquemos inglés juntos/.test(await page.locator("#app h1").textContent()), "ES phone: Spanish welcome");
    ok((await page.locator(".ft-page .btn-primary").count()) === 1, "ES phone: one primary action on step 1");
    const go = await page.locator(".ft-go").boundingBox();
    ok(go && go.y + go.height <= 844, `ES phone: Start is inside the first screen (bottom ${Math.round(go?.y + go?.height)})`);
    ok(await noSideScroll(page), "ES phone: no horizontal scroll on step 1");
    await axe(page, "ES phone step 1");
    await page.locator(".ft-go").click();
    await page.waitForURL(/step=2/);
    await coachReady(page);
    ok(
      (await page.locator(".gt-coach").evaluate((el) => getComputedStyle(el).position)) === "fixed",
      "ES phone: the guide docks at the bottom",
    );
    ok(/Siéntense juntos/.test(await title(page)), "ES phone: the guide speaks Spanish");
    await page.locator("[data-gc=next]").click();
    // A first visit opens the activity's short skill lesson; the guide points at its button first.
    if (await waitTitle(page, /lección/, 2500)) {
      await page.waitForTimeout(400); // the ring moves on the next animation frame
      ok(!(await page.locator(".gc-ring").isHidden()), "ES phone: the ring marks the skill lesson button");
      await frame(page).locator("[data-frame-ready]").click();
    }
    ok(await waitTitle(page, /instrucciones/), "ES phone: the guide reaches the directions");
    await page.waitForTimeout(400); // the ring moves on the next animation frame
    ok(!(await page.locator(".gc-ring").isHidden()), "ES phone: the ring marks a real control");
    await frame(page).locator(".directions [data-say], .directions [data-say-es]").first().click();
    ok(await waitTitle(page, /^(?!Escuchen)/), "ES phone: hearing the directions moves the guide on");
    while (!/elige/.test((await title(page)) || "")) {
      const t = await title(page);
      await page.locator("[data-gc=next]").click();
      if (!(await waitTitle(page, new RegExp(`^(?!${t.replace(/[?¿()]/g, ".")}$)`)))) break;
    }
    ok(/elige/.test(await title(page)), "ES phone: reached the answer step");
    await frame(page).locator("label.choice").first().click();
    ok(await waitTitle(page, /seguro/), "ES phone: choosing an answer moves to “how sure”");
    await frame(page).locator("[data-sure='1']").click();
    ok(await waitTitle(page, /Revisen/), "ES phone: then to Check");
    await frame(page).locator("[data-check]").click();
    ok(await waitTitle(page, /mensaje|Celébrenlo/), "ES phone: the message step follows the check");
    if (/mensaje/.test(await title(page))) {
      await page.locator("[data-gc=next]").click();
      ok(await waitTitle(page, /otra vez/), "ES phone: then try again");
      await frame(page).locator("[data-retry]").click();
    }
    ok(await waitTitle(page, /Practicaron inglés juntos/), "ES phone: the loop ends with a celebration");
    await page.locator("[data-gc=finish]").click();
    await page.waitForURL(/step=3/);
    ok(/Buen trabajo/.test(await page.locator("#app h1").textContent()), "ES phone: step 3 in Spanish");
    ok((await page.locator(".ft-page .btn-primary").count()) === 1, "ES phone: one primary action on step 3");
    ok(
      /intro=together/.test((await page.locator(".ft-next-card .btn-primary").getAttribute("href")) || ""),
      "ES phone: Start practicing opens the next activity with the way back",
    );
    ok(await noSideScroll(page), "ES phone: no horizontal scroll on step 3");
    await axe(page, "ES phone step 3");
    await context.close();
  }

  // ── K–2 in English: pictures, check, try again; keyboard; reload; restart ──
  {
    const { context, page } = await open("en", 1280, "/practice-together?step=2&grades=K");
    await coachReady(page);
    await axe(page, "EN K step 2");
    // Keyboard: Tab from the page reaches the guide's buttons.
    await page.locator("#ftTitle").focus();
    let inCard = false;
    for (let i = 0; i < 60 && !inCard; i++) {
      await page.keyboard.press("Tab");
      inCard = await page.evaluate(() => Boolean(document.activeElement?.closest(".gc-card")));
    }
    ok(inCard, "EN K: Tab reaches the guide card");
    await page.locator("[data-gc=next]").focus();
    await page.keyboard.press("Enter");
    ok(await waitTitle(page, /directions/), "EN K: Enter on Next moves the guide");
    await page.keyboard.press("Escape");
    ok(await page.locator(".gc-pill").isVisible(), "EN K: Escape hides the guide and leaves “Show me how”");
    ok(await page.evaluate(() => document.activeElement?.matches(".gc-pill")), "EN K: focus lands on “Show me how”");
    await page.keyboard.press("Enter");
    ok(await page.locator(".gc-card").isVisible(), "EN K: “Show me how” brings the guide back");
    await frame(page).locator("[data-early-replay]").click();
    ok(await waitTitle(page, /chooses/), "EN K: hearing it again moves to the answer");
    await frame(page).locator("[data-early-pick='b']").click();
    ok(await waitTitle(page, /Check/), "EN K: tapping a picture moves to Check");
    await frame(page).locator("[data-early-check]").click();
    ok(await waitTitle(page, /message|Celebrate/), "EN K: the message follows");
    await page.reload();
    await page.waitForSelector("#app h1");
    ok(/step=2/.test(page.url()) && /Practice together/.test(await page.locator("#app h1").textContent()), "EN K: reload keeps step 2");
    await page.locator(".gt-help summary").click();
    await page.locator("[data-ft-restart]").click();
    await page.waitForURL(/step=1/);
    ok(/Let’s practice English together/.test(await page.locator("#app h1").textContent()), "EN K: restart returns to step 1");
    await page.locator("[data-ft-band='3-5']").click();
    ok((await page.locator("[data-ft-band='3-5']").getAttribute("aria-pressed")) === "true", "EN: grade switch");
    ok(/grades=4-5/.test((await page.locator(".ft-go").getAttribute("href")) || ""), "EN: Start follows the grade");
    const labBand = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}").band, PREFS);
    ok((await labBand()) === "3-5", "EN: the family's grade becomes the lab's grade");
    await page.locator("[data-ft-band='k-2']").click();
    await page.locator("[data-ft-early='1']").click();
    await page.waitForSelector("[data-ft-early='1'][aria-pressed='true']");
    ok(/grades=1\b/.test((await page.locator(".ft-go").getAttribute("href")) || ""), "EN: K–2 exact grade (Grade 1) drives Start");
    ok((await labBand()) === "1", "EN: the exact K–2 grade becomes the lab's grade");
    await axe(page, "EN step 1");
    await context.close();
  }

  // ── Narrow phone ──
  {
    const { context, page } = await open("en", 320, "/practice-together?step=3&grades=6-8");
    ok(await noSideScroll(page), "EN 320: no horizontal scroll on step 3");
    await context.close();
  }

  // ── Microphone denied in the teacher tour's speaking preview ──
  {
    const { context, page } = await open("en", 1280, "/start/tour?part=3&goal=show&grades=6-8&skill=speaking&support=B", {
      denyMic: true,
    });
    await coachReady(page);
    const rec = frame(page).locator("[data-rec-start]").first();
    await rec.click();
    const msg = frame(page).locator("[data-rec-error]");
    await msg.first().waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    ok(/microphone is unavailable/i.test((await msg.first().textContent().catch(() => "")) || ""), "mic denied: the activity explains it");
    ok(await page.locator(".gc-card").isVisible(), "mic denied: the guide stays on screen");
    ok((await page.locator("[data-gt-use]").count()) === 1, "mic denied: “Use this activity” is still there");
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

ok(errors.length === 0, `no page errors (${errors.slice(0, 3).join(" | ") || "none"})`);
console.log(`\naccess-intro-family-e2e: ${failures.length ? `${failures.length} FAILED` : "all passed"}`);
process.exit(failures.length ? 1 : 0);
