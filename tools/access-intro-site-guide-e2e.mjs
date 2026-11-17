#!/usr/bin/env node
/**
 * The Site Guide (/site-guide) in a real browser at 1280, 768 and 375: the directory (three groups, name + sentence +
 * link), the audience choice and its saved key, each step-by-step guide on its own page with Back to Guide, search
 * (count, excerpt, no-match links), the first-visitor path (open a guide, open an activity, come back through the
 * return bar), every link it shows resolving to the content it names, Spanish, no horizontal scroll, keyboard-only
 * use, the print stylesheet (details open, URL after each link), and axe WCAG 2.2 AA.
 *
 *   node tools/access-intro-site-guide-e2e.mjs        (serves this working tree)
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
  console.warn("access-intro-site-guide-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-intro-site-guide-e2e: axe-core/playwright is not installed; skipping axe checks.",
  );
}

const LAB = "/access-practice-lab";
const KEY = "accessPracticeLab:v1:intro";
/** Each activity route and the title its page must show (a missing id falls back to a hub or a default, never an error). */
const TITLES = {
  "/voice/ladder/school-hallway": "The Busy Hallway",
  "/speak/spk-startime-argue": "Speak at the School Board Meeting",
  "/scaffold/language-upgrade?item=lu68-argue-phones": "Language Upgrade Lab",
  "/write/wrt-school-start-paragraph": "Should School Start Later?",
  "/scenarios/s68-hallway-bump": "Sorry in the hallway",
  "/newsroom/np-68-03": "Cafeteria Composting Cuts Waste in Half",
  "/reading-room/rr68p-why-we-have-seasons": "Why Do We Have Seasons?",
  "/wordlab/build": "Morpheme Builder",
  "/Listening/A/classroom-directions": "Weather Words: Follow a Direction",
};

const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-site-guide-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok   ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(
      `FAIL ${name}\n     ${String(error.message).split("\n").slice(0, 4).join("\n     ")}`,
    );
  }
}

async function fresh(width, height = 900, { lang } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.errors = () => errors.filter((e) => !/web-vitals/.test(e));
  if (lang)
    await context.addInitScript(
      (l) => localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ lang: l })),
      lang,
    );
  return page;
}
const go = async (page, path) => {
  await page.goto(`${base}${LAB}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".sg-page");
  await page.waitForTimeout(250);
};
const inView = (page, sel) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= 0 && r.top < innerHeight * 0.75;
  }, sel);
const noOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
const GUIDES = ["start", "speaking", "writing", "more", "classroom", "home", "around", "help"];

// ── desktop ───────────────────────────────────────────────────────────────────────────────────
const d = await fresh(1280);
await check(
  "directory: title, lead, three audience choices, three groups of name + sentence + link",
  async () => {
    await go(d, "/site-guide");
    assert.equal(await d.locator("h1").count(), 1);
    assert.match(await d.locator("h1").innerText(), /Your Guide to The Language Page/);
    assert.match(
      await d.locator(".lead").first().innerText(),
      /Every part of the site in one short list/,
    );
    assert.equal(await d.locator("[data-sg-audience]").count(), 3);
    assert.equal(await d.locator("[data-sg-audience][aria-pressed=true]").count(), 0);
    assert.deepEqual(await d.locator(".sg-dir h2").allInnerTexts(), [
      "For teachers",
      "For students",
      "For families",
    ]);
    const entries = await d.$$eval(".sg-entry", (all) =>
      all.map((li) => ({
        links: li.querySelectorAll("a").length,
        text: li.querySelector("p")?.innerText || "",
      })),
    );
    assert.ok(entries.length >= 12 && entries.length <= 20, `${entries.length} entries`);
    for (const e of entries) assert.ok(e.links === 1 && e.text.length > 10);
    // localhost counts as the Family Tour's host, so families get the tour (Practice Together opens it there too).
    assert.ok(await d.locator('[data-sg-entry="family-tour"] a[href*="/family-tour/"]').count());
    assert.equal(await d.locator('[data-sg-entry="practice-together"]').count(), 0);
    assert.deepEqual(await d.locator(".sg-section h2").allInnerTexts(), [
      "Help and Common Questions",
    ]);
    assert.equal(await d.locator(".sg-guides a").count(), GUIDES.length - 1);
    assert.doesNotMatch(await d.locator(".sg-page").innerText(), /flight\s*deck/i);
    assert.deepEqual(d.errors(), []);
  },
);

await check(
  "choosing an audience saves siteGuideAudience, keeps other keys, shows only that group; it survives a reload",
  async () => {
    await d.evaluate((k) => localStorage.setItem(k, JSON.stringify({ tour: { stop: 2 } })), KEY);
    await d.click("[data-sg-audience=teacher]");
    await d.waitForFunction(() => document.querySelectorAll(".sg-dir").length === 1);
    let saved = await d.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(saved.siteGuideAudience, "teacher");
    assert.deepEqual(saved.tour, { stop: 2 });
    await d.reload({ waitUntil: "networkidle" });
    await d.waitForSelector(".sg-page");
    assert.equal(await d.locator("[data-sg-audience=teacher][aria-pressed=true]").count(), 1);
    assert.ok(await d.locator("#sg-dir-teacher").count());
    assert.equal(await d.locator("#sg-dir-family").count(), 0);
    await d.click("[data-sg-audience=family]");
    await d.waitForSelector("#sg-dir-family");
    assert.equal(await d.locator("#sg-dir-teacher").count(), 0);
    saved = await d.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(saved.siteGuideAudience, "family");
    await d.click("[data-sg-audience=family]");
    await d.waitForFunction(() => document.querySelectorAll(".sg-dir").length === 3);
    saved = await d.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(saved.siteGuideAudience, undefined);
    assert.deepEqual(saved.tour, { stop: 2 });
    await go(d, "/site-guide?for=student");
    assert.equal(await d.locator("[data-sg-audience=student][aria-pressed=true]").count(), 1);
    assert.deepEqual(await d.locator(".sg-dir h2").allInnerTexts(), ["For students"]);
    await d.click("[data-sg-audience=student]");
    await d.waitForFunction(() => document.querySelectorAll(".sg-dir").length === 3);
  },
);

await check(
  "each step-by-step guide opens alone on its own page, with a visible Back to Guide",
  async () => {
    for (const id of GUIDES) {
      await go(d, `/site-guide/${id}`);
      assert.deepEqual(await d.$$eval(".sg-section", (s) => s.map((x) => x.id)), [`sg-${id}`], id);
      assert.ok(await inView(d, `#sg-${id}`), `${id} is in view`);
      assert.equal(await d.locator(".sg-dir").count(), 0, `${id}: no directory`);
    }
    const back = d.locator(".sg-back a");
    assert.match(await back.innerText(), /Back to Guide/);
    await back.click();
    await d.waitForFunction(() => !location.pathname.endsWith("/help"));
    assert.equal(await d.locator(".sg-back").count(), 0);
    assert.equal(await d.locator(".sg-dir").count(), 3);
    assert.deepEqual(d.errors(), []);
  },
);

await check(
  "search: count announced, excerpt and link per result, no-match links to Speaking, Writing, Help",
  async () => {
    await go(d, "/site-guide");
    await d.fill("#sgQ", "microphone");
    await d.waitForTimeout(200);
    const status = await d.locator("[data-sg-status]").innerText();
    assert.match(status, /\d+ results?\./);
    assert.ok((await d.locator(".sg-results li").count()) >= 1);
    const first = d.locator(".sg-results li").first();
    assert.ok((await first.locator("a").getAttribute("href")).startsWith(LAB));
    assert.ok((await first.locator(".fine").innerText()).length > 10);
    assert.equal(await d.locator("[data-sg-status]").getAttribute("aria-live"), "polite");
    await d.fill("#sgQ", "launch studio");
    await d.waitForTimeout(200);
    assert.match(
      await d.locator(".sg-results li").first().innerText(),
      /For teachers|Launch Studio/,
    );
    await d.fill("#sgQ", "zzzqqq");
    await d.waitForTimeout(200);
    assert.match(await d.locator("[data-sg-status]").innerText(), /No results/);
    assert.deepEqual(await d.locator("[data-sg-results] a").allInnerTexts(), [
      "Speaking",
      "Writing",
      "Help and Common Questions",
    ]);
    await go(d, "/site-guide?q=hallway");
    assert.ok((await d.locator(".sg-results li").count()) >= 1, "?q= runs the search on load");
    await d.fill("#sgQ", "save");
    await d.keyboard.press("Enter");
    assert.ok((await d.locator(".sg-results li").count()) >= 1);
    assert.ok(!d.url().includes("?q=save&q"), "Enter does not reload the page");
  },
);

await check(
  "first-visitor path: open the Speaking guide, read the card, open the activity, return through Back to Guide",
  async () => {
    await go(d, "/site-guide");
    await d.click('.sg-guides a[href*="/site-guide/speaking"]');
    await d.waitForSelector("#sg-card-hallway");
    const card = d.locator("#sg-card-hallway");
    assert.match(
      await card.innerText(),
      /What it is[\s\S]*What you’ll do[\s\S]*Try it[\s\S]*Get support[\s\S]*Next step/,
    );
    await card.locator("summary").click();
    assert.match(await card.locator("details").innerText(), /Model student from the site/);
    await card.getByRole("link", { name: /Open The Busy Hallway/ }).click();
    await d.waitForSelector("#introReturn");
    assert.match(await d.locator("#introReturn").innerText(), /Back to Guide/);
    assert.match(await d.locator("h1").first().innerText(), /The Busy Hallway/);
    await d.locator("#introReturn a").click();
    await d.waitForSelector(".sg-page");
    assert.equal(await d.locator("#introReturn").count(), 0);
    // browser Back also returns
    await d.goBack();
    await d.waitForTimeout(500);
    await d.goForward();
    await d.waitForSelector(".sg-page");
  },
);

await check(
  "every link the guide shows (directory and every guide page) opens the content it names",
  async () => {
    const hrefs = new Set();
    for (const path of ["/site-guide", ...GUIDES.map((id) => `/site-guide/${id}`)]) {
      await go(d, path);
      for (const h of await d.$$eval(".sg-page a[href]", (a) =>
        a.map((x) => x.getAttribute("href")),
      ))
        if (!h.startsWith("#")) hrefs.add(h);
    }
    assert.ok(hrefs.size > 40, `${hrefs.size} links`);
    const p = await (await browser.newContext()).newPage();
    p.on("pageerror", () => {});
    let opened = 0;
    for (const raw of hrefs) {
      if (/\.(pdf|docx|png)$/.test(raw)) continue;
      const lab = raw.replace(LAB, "");
      if (raw.startsWith("/access-teacher/")) continue;
      const res = await p.goto(`${base}${raw}`, { waitUntil: "networkidle" });
      await p.waitForTimeout(150);
      if (new URL(p.url()).pathname === `${LAB}/family-tour/`) {
        // a static page of its own, not a lab view (on this host /practice-together opens it too)
        assert.equal(res?.status(), 200, raw);
        opened += 1;
        continue;
      }
      const info = await p.evaluate(() => ({
        view: document.body.dataset.labView,
        h1: document.querySelector("#app h1")?.innerText || "",
        title: document.title,
      }));
      assert.ok(!/not found/i.test(info.title + info.h1), `${raw}: "${info.title}"`);
      assert.ok(info.h1 || info.view, raw);
      const key = Object.keys(TITLES).find(
        (k) => lab === k || lab.startsWith(`${k}&`) || lab.startsWith(`${k}?`),
      );
      if (key)
        assert.ok(
          (info.h1 + info.title).includes(TITLES[key]),
          `${raw}: expected "${TITLES[key]}", got "${info.h1}"`,
        );
      else if (!/^\/(?:\?|$)/.test(lab))
        assert.notEqual(info.view, "home", `${raw} fell back to the home page`);
      opened += 1;
    }
    for (const key of Object.keys(TITLES))
      assert.ok(
        [...hrefs].some((h) => h.includes(key.split("?")[0])),
        `${key} is linked`,
      );
    console.log(`     opened ${opened} links`);
  },
);

await check(
  "Spanish: the directory, Help and Practice at Home are in Spanish; the page stays usable",
  async () => {
    const es = await fresh(1280, 900, { lang: "es" });
    await go(es, "/site-guide?for=family");
    assert.match(await es.locator(".sg-dir h2").innerText(), /Para familias/);
    assert.match(
      await es.locator(".sg-dir").innerText(),
      /Recorrido familiar[\s\S]*Rincón de la familia/,
    );
    assert.match(await es.locator("#sg-help").innerText(), /¿Necesito una cuenta\?/);
    assert.match(await es.locator(".sg-guides").innerText(), /Practicar en casa/);
    assert.match(await es.locator(".sg-note").first().innerText(), /asistido por máquina/);
    assert.ok(await noOverflow(es));
    await go(es, "/site-guide/home");
    const home = await es.locator("#sg-home").innerText();
    assert.match(home, /Practicar juntos/);
    assert.match(home, /Elijan una actividad\./);
    assert.ok(
      await es.locator("#sg-home .lead [lang=es]").count(),
      "Spanish text is marked lang=es on the English page",
    );
    assert.ok(await noOverflow(es));
    assert.deepEqual(es.errors(), []);
    await es.context().close();
  },
);

await check(
  "keyboard only: tab reaches the audience buttons, search and the directory links with a visible focus ring",
  async () => {
    await go(d, "/site-guide");
    const seen = new Set();
    for (let i = 0; i < 40; i += 1) {
      await d.keyboard.press("Tab");
      const info = await d.evaluate(() => {
        const e = document.activeElement;
        const cs = getComputedStyle(e);
        return {
          tag: e.tagName,
          attr:
            e.getAttribute("data-sg-audience") ||
            e.closest("[data-sg-entry]")?.getAttribute("data-sg-entry") ||
            e.id ||
            "",
          ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2,
        };
      });
      if (info.attr) seen.add(info.attr);
      if (/^(A|BUTTON|INPUT|SELECT|SUMMARY)$/.test(info.tag) && info.attr)
        assert.ok(info.ring, `${info.attr} shows a focus ring`);
    }
    for (const want of ["teacher", "student", "family", "sgQ", "start", "launch"])
      assert.ok(seen.has(want), `Tab reaches ${want}`);
    await d.focus("#sgQ");
    await d.keyboard.type("write");
    assert.ok((await d.locator(".sg-results li").count()) >= 1);
  },
);

await check(
  "print: chrome hidden, every disclosure open, URL printed after links, no overflow",
  async () => {
    await go(d, "/site-guide?for=teacher");
    await d.emulateMedia({ media: "print" });
    await d.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
    const r = await d.evaluate(() => {
      const hidden = (sel) =>
        [...document.querySelectorAll(sel)].every((e) => getComputedStyle(e).display === "none");
      const closed = [...document.querySelectorAll(".sg-page details:not([open])")].length;
      const link = document.querySelector(".sg-entry a[data-url]");
      return {
        search: hidden(".sg-search"),
        audience: hidden(".sg-audience"),
        guides: hidden(".sg-guides"),
        closed,
        after: getComputedStyle(link, "::after").content,
        top: getComputedStyle(document.querySelector(".lab-top")).display,
      };
    });
    assert.equal(r.search && r.audience && r.guides, true);
    assert.equal(r.closed, 0, "details open for print");
    assert.match(r.after, /thelanguagepage\.com\/access-practice-lab\//);
    assert.equal(r.top, "none");
    await d.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    assert.ok(
      (await d.locator(".sg-page details:not([open])").count()) > 0,
      "details close again after printing",
    );
    await d.emulateMedia({ media: "screen" });
  },
);

if (AxeBuilder) {
  await check(
    "axe WCAG 2.2 AA: no serious or critical violations (general, teacher, family, Spanish, a guide page)",
    async () => {
      for (const [path, lang] of [
        ["/site-guide", "en"],
        ["/site-guide?for=teacher", "en"],
        ["/site-guide?for=family", "es"],
        ["/site-guide/speaking", "en"],
      ]) {
        const page = await fresh(1280, 900, { lang });
        await go(page, path);
        // Open every disclosure on the page itself. Clicking each summary stalled: the header "More" menu covered them.
        await page.$$eval("#app details", (all) => all.forEach((d) => (d.open = true)));
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
        assert.deepEqual(
          bad.map((v) => `${v.id}: ${v.nodes[0].target}`),
          [],
          path,
        );
        await page.context().close();
      }
    },
  );
}

// ── tablet and phone ────────────────────────────────────────────────────────────────────────────
for (const width of [768, 375]) {
  const m = await fresh(width, width === 375 ? 800 : 1000);
  await check(
    `${width}px: no horizontal scroll, the directory fits, search usable, 44px targets`,
    async () => {
      await go(m, "/site-guide");
      assert.ok(await noOverflow(m), "no horizontal scroll");
      const fits = await m.evaluate(() =>
        [...document.querySelectorAll(".sg-entry, .sg-dir, .sg-search")].every(
          (e) => e.getBoundingClientRect().right <= innerWidth + 1,
        ),
      );
      assert.ok(fits, "directory fits the screen");
      await m.fill("#sgQ", "account");
      assert.ok((await m.locator(".sg-results li").count()) >= 1);
      const small = await m.evaluate(() =>
        [
          ...document.querySelectorAll(
            ".sg-page a.btn, .sg-page button, .sg-page summary, .sg-page select, .sg-page input",
          ),
        ]
          .filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44)
          .map((e) => e.textContent.trim().slice(0, 30)),
      );
      assert.deepEqual(small, [], "44px targets");
      assert.ok(await noOverflow(m));
      assert.deepEqual(m.errors(), []);
    },
  );
  await check(`${width}px: guide cards, previews and the screenshot fit the screen`, async () => {
    for (const id of ["speaking", "writing", "classroom", "around"]) {
      await go(m, `/site-guide/${id}`);
      assert.ok(await noOverflow(m), `${id}: no horizontal scroll`);
      const fits = await m.evaluate(() =>
        [
          ...document.querySelectorAll(
            ".sg-card, .sg-routine, .sg-shot img, .sg-worked, .in-preview",
          ),
        ].every((e) => e.getBoundingClientRect().right <= innerWidth + 1),
      );
      assert.ok(fits, id);
    }
    for (const img of await m.$$(".sg-shot img")) {
      await img.scrollIntoViewIfNeeded();
      await m.waitForTimeout(200);
      assert.ok(await img.evaluate((i) => i.complete && i.naturalWidth > 100), "screenshot loaded");
    }
  });
  if (AxeBuilder && width === 375) {
    await check("375px axe: no serious or critical violations", async () => {
      await go(m, "/site-guide?for=family");
      const result = await new AxeBuilder({ page: m })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        result.violations
          .filter((v) => ["serious", "critical"].includes(v.impact))
          .map((v) => v.id),
        [],
      );
    });
  }
  await m.context().close();
}

await browser.close();
server.close();
console.log(`\naccess-intro-site-guide-e2e: ${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
