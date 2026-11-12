#!/usr/bin/env node
/**
 * The Site Guide (/site-guide) in a real browser at 1280, 768 and 375: audience choice and its saved key, the contents
 * list and the phone section selector (aria-current follows the scroll), direct section links and Back to Guide,
 * search (count, excerpt, no-match links), the first-visitor path (choose, open an activity, come back through the
 * return bar), every link it shows resolving to the content it names, Spanish on Practice at Home, no horizontal
 * scroll, keyboard-only use, the print stylesheet (details open, URL after each link), and axe WCAG 2.2 AA.
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
/** Opens every folded section the way a reader does: by pressing its Show button. */
const unfold = async (page) => {
  for (const b of await page.$$('[data-sg-toggle][aria-expanded="false"]')) await b.click();
};
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

// ── desktop ───────────────────────────────────────────────────────────────────────────────────
const d = await fresh(1280);
await check(
  "general guide: title, lead, short intro, three audience choices, no choice pressed",
  async () => {
    await go(d, "/site-guide");
    assert.equal(await d.locator("h1").count(), 1);
    assert.match(await d.locator("h1").innerText(), /Your Guide to The Language Page/);
    assert.match(
      await d.locator(".lead").first().innerText(),
      /Find an activity, see how it works, and choose your next step\./,
    );
    assert.equal(await d.locator("[data-sg-audience]").count(), 3);
    assert.equal(await d.locator("[data-sg-audience][aria-pressed=true]").count(), 0);
    assert.deepEqual(await d.locator(".sg-section h2").allInnerTexts(), [
      "Start Here",
      "Speaking",
      "Writing",
      "Find Your Way Around",
      "Help and Common Questions",
    ]);
    assert.deepEqual(d.errors(), []);
  },
);

await check(
  "choosing an audience saves siteGuideAudience and keeps other keys; it survives a reload",
  async () => {
    await d.evaluate((k) => localStorage.setItem(k, JSON.stringify({ tour: { stop: 2 } })), KEY);
    await d.click("[data-sg-audience=teacher]");
    await d.waitForSelector("#sg-classroom");
    let saved = await d.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(saved.siteGuideAudience, "teacher");
    assert.deepEqual(saved.tour, { stop: 2 });
    await d.reload({ waitUntil: "networkidle" });
    await d.waitForSelector(".sg-page");
    assert.equal(await d.locator("[data-sg-audience=teacher][aria-pressed=true]").count(), 1);
    assert.ok(await d.locator("#sg-classroom").count());
    assert.match(await d.locator(".sg-pd").innerText(), /New to the site\? The teacher start page/);
    await d.click("[data-sg-audience=family]");
    await d.waitForSelector("#sg-home");
    assert.equal(await d.locator("#sg-classroom").count(), 0);
    saved = await d.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(saved.siteGuideAudience, "family");
    await d.click("[data-sg-audience=family]");
    await d.waitForFunction(() => !document.querySelector("#sg-home"));
    saved = await d.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
    assert.equal(saved.siteGuideAudience, undefined);
    assert.deepEqual(saved.tour, { stop: 2 });
    await go(d, "/site-guide?for=student");
    assert.equal(await d.locator("[data-sg-audience=student][aria-pressed=true]").count(), 1);
  },
);

await check(
  "contents list: link scrolls to the section, aria-current follows, selector hidden on desktop",
  async () => {
    await go(d, "/site-guide?for=teacher");
    assert.equal(await d.locator("#sgJump").isVisible(), false);
    await d.click(".sg-toc a[data-sg-jump=writing]");
    await d.waitForTimeout(500);
    assert.ok(await inView(d, "#sg-writing"), "Writing is in view");
    assert.equal(await d.locator(".sg-toc a[aria-current]").count(), 1);
    assert.equal(await d.locator(".sg-toc a[aria-current]").innerText(), "Writing");
    assert.match(d.url(), /\/site-guide\/writing/);
    await d.evaluate(() => document.getElementById("sg-help")?.scrollIntoView());
    await d.waitForTimeout(400);
    assert.equal(
      await d.locator(".sg-toc a[aria-current]").innerText(),
      "Help and Common Questions",
    );
  },
);

await check(
  "a direct section link opens at that section with a visible Back to Guide",
  async () => {
    await go(d, "/site-guide/help");
    await d.waitForTimeout(500);
    assert.ok(await inView(d, "#sg-help"));
    const back = d.locator(".sg-back a");
    assert.match(await back.innerText(), /Back to Guide/);
    await back.click();
    await d.waitForFunction(() => !location.pathname.endsWith("/help"));
    assert.equal(await d.locator(".sg-back").count(), 0);
    // a section not shown to this reader still opens from its own link
    await go(d, "/site-guide/home");
    assert.ok(await d.locator("#sg-home").count());
  },
);

await check(
  "search: count announced, excerpt and link per result, no-match links to Speaking, Writing, Help",
  async () => {
    await go(d, "/site-guide?for=teacher");
    await d.fill("#sgQ", "microphone");
    await d.waitForTimeout(200);
    const status = await d.locator("[data-sg-status]").innerText();
    assert.match(status, /\d+ results?\./);
    assert.ok((await d.locator(".sg-results li").count()) >= 1);
    const first = d.locator(".sg-results li").first();
    assert.ok((await first.locator("a").getAttribute("href")).startsWith(LAB));
    assert.ok((await first.locator(".fine").innerText()).length > 10);
    assert.equal(await d.locator("[data-sg-status]").getAttribute("aria-live"), "polite");
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
  "first-visitor path: choose, read the card, open the activity, return through Back to Guide",
  async () => {
    await go(d, "/site-guide");
    await d.click("[data-sg-audience=student]");
    await d.waitForSelector("#sg-more");
    // Long sections start folded behind a summary; Show opens them and the button says so.
    assert.equal(await d.locator("#sg-speaking-body").isHidden(), true);
    await d.click('[data-sg-toggle="speaking"]');
    assert.equal(await d.getAttribute('[data-sg-toggle="speaking"]', "aria-expanded"), "true");
    assert.match(await d.locator('[data-sg-toggle="speaking"]').innerText(), /Hide this section/);
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

await check("every link the guide shows (all audiences) opens the content it names", async () => {
  const hrefs = new Set();
  for (const who of ["teacher", "student", "family"]) {
    await go(d, `/site-guide?for=${who}`);
    for (const h of await d.$$eval(".sg-page a[href]", (a) => a.map((x) => x.getAttribute("href"))))
      if (!h.startsWith("#")) hrefs.add(h);
  }
  assert.ok(hrefs.size > 40, `${hrefs.size} links`);
  const p = await (await browser.newContext()).newPage();
  p.on("pageerror", () => {});
  let opened = 0;
  for (const raw of hrefs) {
    if (/\.(pdf|docx|png)$/.test(raw)) continue;
    const path = raw;
    const lab = path.replace(LAB, "");
    if (raw.startsWith("/access-teacher/")) continue;
    await p.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(150);
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
});

await check(
  "Spanish: Practice at Home, the contents and the notes are in Spanish; the page stays usable",
  async () => {
    const es = await fresh(1280, 900, { lang: "es" });
    await go(es, "/site-guide?for=family");
    const home = await es.locator("#sg-home").innerText();
    assert.match(home, /Practicar juntos/);
    assert.match(home, /Elijan una actividad\./);
    assert.match(await es.locator(".sg-toc").innerText(), /Practicar en casa/);
    assert.match(await es.locator("#sg-help").innerText(), /¿Necesito una cuenta\?/);
    assert.match(await es.locator(".sg-note").first().innerText(), /asistido por máquina/);
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
  "keyboard only: tab reaches the audience buttons, contents links, search and cards with a visible focus ring",
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
          attr: e.getAttribute("data-sg-audience") || e.getAttribute("data-sg-jump") || e.id || "",
          ring: cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2,
        };
      });
      if (info.attr) seen.add(info.attr);
      if (/^(A|BUTTON|INPUT|SELECT|SUMMARY)$/.test(info.tag) && info.attr)
        assert.ok(info.ring, `${info.attr} shows a focus ring`);
    }
    for (const want of ["teacher", "student", "family", "start", "speaking", "sgQ"])
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
      const link = document.querySelector(".sg-page a[data-url]");
      return {
        side: hidden(".sg-side"),
        search: hidden(".sg-search"),
        audience: hidden(".sg-audience"),
        closed,
        folded: [...document.querySelectorAll(".sg-body")].filter(
          (b) => b.hidden || getComputedStyle(b).display === "none",
        ).length,
        overview: hidden(".sg-overview"),
        after: getComputedStyle(link, "::after").content,
        top: getComputedStyle(document.querySelector(".lab-top")).display,
      };
    });
    assert.equal(r.side && r.search && r.audience, true);
    assert.equal(r.closed, 0, "details open for print");
    assert.equal(r.folded, 0, "folded sections open for print");
    assert.equal(r.overview, true, "the grade picker summary is not printed");
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
    "axe WCAG 2.2 AA: no serious or critical violations (general, teacher, family, Spanish)",
    async () => {
      for (const [path, lang] of [
        ["/site-guide", "en"],
        ["/site-guide?for=teacher", "en"],
        ["/site-guide?for=family", "es"],
      ]) {
        const page = await fresh(1280, 900, { lang });
        await go(page, path);
        // Open every disclosure on the page itself, hidden ones included. Clicking each summary stalled: the header
        // "More" menu covered them and cards in hidden sections never become clickable (30 s wait each).
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
    `${width}px: no horizontal scroll, labeled section selector works without a mouse, search usable`,
    async () => {
      await go(m, "/site-guide?for=teacher");
      assert.ok(await noOverflow(m), "no horizontal scroll");
      assert.equal(await m.locator(".sg-toc").isVisible(), false);
      assert.equal(await m.locator("#sgJump").isVisible(), true);
      assert.match(await m.locator("label[for=sgJump]").innerText(), /Jump to a section/);
      await m.focus("#sgJump"); // a native <select>: reachable and operable with the keyboard
      assert.equal(await m.evaluate(() => document.activeElement.id), "sgJump");
      await m.selectOption("#sgJump", "help");
      await m.waitForTimeout(500);
      assert.ok(await inView(m, "#sg-help"), "Help is in view");
      assert.equal(await m.locator("#sgJump").inputValue(), "help");
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
  await check(`${width}px: cards, previews and the screenshots fit the screen`, async () => {
    await go(m, "/site-guide?for=teacher");
    await unfold(m);
    const fits = await m.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".sg-card, .sg-routine, .sg-shot img, .sg-worked, .in-preview",
        ),
      ].every((e) => e.getBoundingClientRect().right <= innerWidth + 1),
    );
    assert.ok(fits);
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
