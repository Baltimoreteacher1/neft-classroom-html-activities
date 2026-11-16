// Browser verification of the exponent-copies model where a student meets it: the family Exponent model and the lab bench
// inside the 6-3 and 6-4 Practice and Challenge studios. Explicitly invoked (npm run validate:motion-exponents-browser).
//
//   node tools/verify-motion-exponents-browser.mjs [--out DIR] [--shots-only] [--root PATH]
//
// Per viewport (desktop 1920x1080, Chromebook 1366x768, tablet 820x1180, phone 390x844) and per language it asserts: no console or
// page error, no horizontal scroll, every figure's text renders at 13px or more, the base/exponent controls redraw the picture, the
// figure never moves the page when it redraws, keyboard-only use of "Watch it build", animation present with normal motion and
// opacity-only under prefers-reduced-motion, hidden-page pause, axe WCAG 2.2 AA, plus interaction latency and shipped bundle size.
// --shots-only just writes screenshots (used against a checkout of the old code for the before pictures).
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const args = process.argv.slice(2);
const val = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : null);
const ROOT = resolve(val("--root") || REPO_ROOT);
const OUT = val("--out");
const SHOTS_ONLY = args.includes("--shots-only");
if (OUT) mkdirSync(OUT, { recursive: true });

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
  let file = resolve(ROOT, `.${path}`);
  if (!file.startsWith(`${ROOT}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = join(ROOT, "public", path);
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

const VIEWPORTS = [
  ["desktop", 1920, 1080],
  ["chromebook", 1366, 768],
  ["tablet", 820, 1180],
  ["phone", 390, 844],
];
const NOISE = /web-vitals|\/api\/|favicon|Failed to load resource.*(404|401)/i;
const failures = [];
const note = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

const harness = (lang, base, exp) =>
  `<!doctype html><html lang="${lang}"><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Exponent model</title><link rel=stylesheet href="/assets/design/family/tokens.css"><link rel=stylesheet href="/assets/design/family/family.css"><link rel=stylesheet href="/assets/family-mission/models/models.css"><body style="margin:0;padding:12px;background:#f7f4ec"><main><h1 style="font:700 20px sans-serif">Exponent model</h1><div id=root></div></main><script type=module>import { mountModel } from "/assets/family-mission/models/index.mjs"; window.m = mountModel(document.getElementById("root"), "exponents", { base: ${base}, exponent: ${exp}, maxExponent: ${SHOTS_ONLY ? 6 : 8} }, { lang: "${lang}" }); window.ready = true;</script>`;

async function open(browser, name, w, h, reduced = false) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => !NOISE.test(String(e)) && errs.push(String(e)));
  page.on("console", (m) => m.type() === "error" && !NOISE.test(m.text()) && errs.push(m.text()));
  await page.route("**/__harness.html*", (r) => {
    const u = new URL(r.request().url());
    return r.fulfill({
      contentType: "text/html",
      body: harness(
        u.searchParams.get("lang") || "en",
        u.searchParams.get("b") || 3,
        u.searchParams.get("e") || 4,
      ),
    });
  });
  return { ctx, page, errs, name };
}

/** Running animations that belong to a figure (the page has unrelated CSS transitions of its own). */
const figAnims = (page, sel) =>
  page.evaluate(
    (s) =>
      document
        .getAnimations()
        .filter((a) => a.effect?.target?.closest?.(s))
        .map((a) => a.playState),
    sel,
  );
const labAnims = (page) =>
  page
    .locator(".model-picture")
    .first()
    .evaluate((el) => el.getAnimations({ subtree: true }).length);
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
// Locators pierce the lab's shadow root; document.querySelectorAll does not.
const smallText = (page, scope) =>
  page.locator(`${scope} svg`).evaluateAll((svgs) => {
    const out = [];
    for (const svg of svgs) {
      const vb = svg.viewBox.baseVal;
      if (!vb || !vb.width) continue;
      const k = svg.getBoundingClientRect().width / vb.width;
      for (const t of svg.querySelectorAll("text")) {
        if (getComputedStyle(t).display === "none" || !t.getBoundingClientRect().width) continue;
        const px = Number.parseFloat(getComputedStyle(t).fontSize) * k;
        if (px < 12.5) out.push(`${(t.textContent || "").slice(0, 24)} ${px.toFixed(1)}px`);
      }
    }
    return out;
  });

async function axe(page, where, include) {
  await page.waitForTimeout(400);
  if (!(await page.locator(include).count())) return fail(where, `axe: nothing matches ${include}`);
  const r = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  for (const v of r.violations) fail(where, `axe ${v.id}: ${v.help} (${v.nodes.length})`);
}

const shot = (page, file, sel) =>
  OUT
    ? page
        .locator(sel)
        .first()
        .screenshot({ path: join(OUT, file) })
    : null;

/* ---- the family model ------------------------------------------------------------------------------- */
async function family(browser) {
  for (const [vp, w, h] of VIEWPORTS) {
    for (const lang of ["en", "es"]) {
      const where = `family ${vp} ${lang}`;
      const { ctx, page, errs } = await open(browser, where, w, h);
      await page.goto(`${origin}/__harness.html?lang=${lang}&b=3&e=4`);
      await page.waitForFunction(() => window.ready);
      await page.waitForSelector(".fm-exp-pic svg, .fm-exp-svg", { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(300);
      await shot(page, `family-${vp}-${lang}.png`, "#root");
      if (SHOTS_ONLY) {
        await ctx.close();
        continue;
      }
      assert.ok(
        await page.locator(".fm-exp-pic svg.mc-exponent").count(),
        `${where}: picture mounted`,
      );
      if ((await overflow(page)) > 0) fail(where, `horizontal scroll ${await overflow(page)}px`);
      for (const t of await smallText(page, ".fm-exp-pic")) fail(where, `text under 13px: ${t}`);
      // controls redraw the picture
      for (const [b, e] of [
        [12, 8],
        [1, 8],
        [2, 2],
        [4, 4],
      ]) {
        await page.locator("input").nth(0).fill(String(b));
        await page.locator("input").nth(0).dispatchEvent("change");
        await page.locator("input").nth(1).fill(String(e));
        await page.locator("input").nth(1).dispatchEvent("change");
        const cards = await page.locator(".fm-exp-pic .mc-card").count();
        if (cards !== e) fail(where, `${b}^${e}: ${cards} cards`);
        const total = await page
          .locator(".fm-exp-pic svg")
          .first()
          .evaluate((s) => s.textContent);
        const want = (BigInt(b) ** BigInt(e)).toLocaleString("en-US");
        if (!total.includes(want)) fail(where, `${b}^${e}: picture does not print ${want}`);
        if ((await overflow(page)) > 0) fail(where, `${b}^${e}: horizontal scroll`);
      }
      // out of range input is refused, state kept
      await page.locator("input").nth(0).fill("99");
      await page.locator("input").nth(0).dispatchEvent("change");
      const kept = await page.evaluate(() => window.m.getState().base);
      if (kept > 12) fail(where, `base ${kept} accepted`);
      // no layout shift when the picture redraws
      await page.locator("input").nth(0).fill("3");
      await page.locator("input").nth(0).dispatchEvent("change");
      await page.locator("input").nth(1).fill("4");
      await page.locator("input").nth(1).dispatchEvent("change");
      const y0 = await page
        .locator(".fm-exp-growth")
        .evaluate((e) => e.getBoundingClientRect().top + scrollY);
      await page.locator("input").nth(1).fill("3");
      await page.locator("input").nth(1).dispatchEvent("change");
      await page.locator("input").nth(1).fill("4");
      await page.locator("input").nth(1).dispatchEvent("change");
      const y1 = await page
        .locator(".fm-exp-growth")
        .evaluate((e) => e.getBoundingClientRect().top + scrollY);
      if (Math.abs(y0 - y1) > 2) fail(where, `layout shifted ${y1 - y0}px on redraw`);
      // keyboard only: Tab to "Watch it build", Enter starts motion
      await page.evaluate(() => document.activeElement?.blur());
      let reached = false;
      for (let i = 0; i < 40 && !reached; i++) {
        await page.keyboard.press("Tab");
        reached = await page.evaluate(
          () =>
            document.activeElement?.classList.contains("mc-btn") &&
            document.activeElement.hasAttribute("data-quiet") === false,
        );
      }
      if (!reached) fail(where, "Watch it build is not reachable by keyboard");
      else {
        await page.keyboard.press("Enter");
        const n = (await figAnims(page, ".mc-figure")).length;
        if (n < 1) fail(where, "Watch it build started no animation");
        await page.keyboard.press("Shift+Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter"); // Show all steps
        await page.waitForTimeout(50);
        const left = (await figAnims(page, ".mc-figure")).length;
        if (left) fail(where, `Show all steps left ${left} animations`);
      }
      await axe(page, where, "main");
      if (errs.length) fail(where, `console: ${errs[0]}`);
      await ctx.close();
    }
  }
  // reduced motion: a scene runs fades only; hidden page pauses
  {
    const where = "family reduced-motion";
    const { ctx, page } = await open(browser, where, 1366, 768, true);
    await page.goto(`${origin}/__harness.html?lang=en&b=3&e=4`);
    await page.waitForFunction(() => window.ready);
    await page.locator(".fm-exp-pic .mc-btn").first().click();
    const kinds = await page.evaluate(() => [
      ...new Set(
        document
          .getAnimations()
          .flatMap((a) =>
            a.effect
              .getKeyframes()
              .flatMap((k) =>
                Object.keys(k).filter(
                  (p) => !["offset", "computedOffset", "easing", "composite"].includes(p),
                ),
              ),
          ),
      ),
    ]);
    if (!kinds.length) fail(where, "no fade ran");
    if (kinds.some((p) => p !== "opacity"))
      fail(where, `moving properties under reduced motion: ${kinds}`);
    await ctx.close();
  }
  {
    const where = "family normal-motion keyframes";
    const { ctx, page } = await open(browser, where, 1366, 768);
    await page.goto(`${origin}/__harness.html?lang=en&b=3&e=4`);
    await page.waitForFunction(() => window.ready);
    await page.locator(".fm-exp-pic .mc-btn").first().click();
    const kinds = await page.evaluate(() => [
      ...new Set(
        document
          .getAnimations()
          .flatMap((a) => a.effect.getKeyframes().flatMap((k) => Object.keys(k))),
      ),
    ]);
    if (!kinds.includes("transform") || !kinds.includes("opacity"))
      fail(where, `expected opacity+transform, got ${kinds}`);
    // only compositor-safe properties: nothing that reflows
    for (const p of kinds)
      if (["width", "height", "top", "left", "margin"].includes(p)) fail(where, `animates ${p}`);
    // latency of a control change at the largest picture
    const ms = await page.evaluate(async () => {
      const f = document.querySelectorAll("input");
      const t = [];
      for (let i = 0; i < 15; i++) {
        const s = performance.now();
        f[1].value = i % 2 ? "8" : "7";
        f[1].dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((r) => requestAnimationFrame(r));
        t.push(performance.now() - s);
      }
      t.sort((a, b) => a - b);
      return t[7];
    });
    note.push(`interaction latency (change to next frame, 12^7-12^8), median ${ms.toFixed(1)} ms`);
    if (ms > 100) fail(where, `slow redraw ${ms.toFixed(0)}ms`);
    // hidden page pauses a running scene
    await page.locator(".fm-exp-pic .mc-btn").first().click();
    const paused = await page.evaluate(async () => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      const states = document
        .getAnimations()
        .filter((a) => a.effect?.target?.closest?.(".mc-figure"))
        .map((a) => a.playState);
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
      return states;
    });
    if (!paused.length || paused.some((s) => s !== "paused"))
      fail(where, `hidden page did not pause: ${[...new Set(paused)]}`);
    await ctx.close();
  }
}

/* ---- the lab bench inside the studios --------------------------------------------------------------- */
async function lab(browser) {
  for (const lesson of ["6-3", "6-4"]) {
    for (const mode of ["practice", "challenge"]) {
      for (const [vp, w, h] of VIEWPORTS) {
        const where = `lab ${lesson} ${mode} ${vp}`;
        const { ctx, page, errs } = await open(browser, where, w, h);
        await page.goto(
          `${origin}/math/practice-studio/${lesson}/${mode === "practice" ? "" : "challenge/"}`,
        );
        await page.waitForFunction(() => window.StudioRT?.api?.sections);
        const tab = await page.evaluate(() => {
          const rt = window.StudioRT.api;
          for (let s = 0; s < rt.sections.length; s++) {
            const i = rt.sections[s].items.findIndex((it) => /^lab-/.test(it.id || ""));
            if (i >= 0) {
              rt.state.idx[s + 1] = i;
              rt.selectTab(s + 1);
              rt.render(s + 1);
              return s + 1;
            }
          }
          return 0;
        });
        if (!tab) {
          fail(where, "no bench item");
          await ctx.close();
          continue;
        }
        await page.waitForSelector("[data-control]");
        await page.waitForTimeout(250);
        if (!SHOTS_ONLY) {
          // a bench task unlocks one control (exponent in a practice task, often the base in a stretch task): drive the one a student can
          const free = await page
            .locator("[data-control]")
            .evaluateAll((els) => els.map((i) => !i.readOnly));
          const picked = free.findIndex(Boolean);
          if (picked < 0) {
            fail(where, `no editable control (readonly: ${free})`);
            await ctx.close();
            continue;
          }
          const c = page.locator("[data-control]").nth(picked);
          const read = (i) => page.locator("[data-control]").nth(i).inputValue().then(Number);
          if (picked === 1) {
            for (const e of [1, 2, 3, 4, 5]) {
              await c.fill(String(e));
              await c.dispatchEvent("input");
              const cards = await page.locator(".model-picture .mc-card").count();
              if (cards !== e) fail(where, `exponent ${e}: ${cards} cards`);
              assert.ok(await page.locator(".model-picture .mc-final").count());
            }
            // +1 enters only the new step; a jump of two or a decrease does not animate
            await c.fill("3");
            await c.dispatchEvent("input");
            await page.waitForTimeout(1600);
            await c.fill("4"); // fill fires the one input event a typing student produces
            const up1 = await labAnims(page);
            if (up1 < 1) fail(where, "exponent +1 did not animate the new step");
            await page.waitForTimeout(1700);
            await c.fill("2");
            await c.dispatchEvent("input");
            const jump = await labAnims(page);
            if (jump) fail(where, "a jump or a decrease animated");
            // direct manipulation: sliding across the steps sets the exponent where the pointer is (zones come from the render)
            await page.waitForTimeout(400); // let the picture settle at its container width
            await page.locator(".model-picture svg").first().scrollIntoViewIfNeeded(); // a pointer cannot press below the viewport
            const box = await page.locator(".model-picture svg").first().boundingBox();
            const vbw = await page
              .locator(".model-picture svg")
              .first()
              .evaluate((e) => e.viewBox.baseVal.width);
            if (box) {
              const at = (vx, vy) => [
                box.x + (vx / vbw) * box.width,
                box.y + vy * (box.width / vbw),
              ];
              const [x0, y0] = at(20 + (vbw - 40) * 0.5, 30); // halfway across the steps: exponent 1 + 0.5 * (5 - 1) = 3
              await page.mouse.move(x0, y0);
              await page.mouse.down();
              await page.mouse.up();
              const cards = await page.locator(".model-picture .mc-card").count();
              if (cards !== 3)
                fail(where, `dragging across the steps set exponent ${cards}, expected 3`);
            }
          } else {
            const exp = await read(1);
            const base = await read(0);
            const values = picked === 0 ? [2, 3, 4, 5] : [0, 3, 7, 12]; // base, or the amount added after the power
            for (const v of values) {
              await c.fill(String(v));
              await c.dispatchEvent("input");
              const cards = await page.locator(".model-picture .mc-card").count();
              if (cards !== exp)
                fail(where, `control ${picked} = ${v}: ${cards} cards for exponent ${exp}`);
              const text = await page
                .locator(".model-picture svg")
                .first()
                .evaluate((s) => s.textContent || "");
              const b = picked === 0 ? v : base;
              if (!text.includes((BigInt(b) ** BigInt(exp)).toLocaleString("en-US")))
                fail(where, `${b}^${exp} not printed`);
              if (picked === 2 && v > 0 && !text.includes(`Then add ${v}`))
                fail(where, `the amount added (${v}) is not shown`);
              if (picked === 2 && v === 0 && text.includes("Then add"))
                fail(where, "an added amount of 0 is shown");
            }
          }
          // the studio's own Espanol switch redraws the lab, and its picture words follow
          const es = page.locator("#toggle-es-btn");
          if (await es.isHidden()) await page.locator("#studio-menu-btn").click();
          await es.click();
          await page.waitForTimeout(500);
          const esText = await page
            .locator(".model-picture svg")
            .first()
            .evaluate((s) => s.textContent || "");
          if (!/copias|fila de|cuántos factores/.test(esText))
            fail(where, "Spanish picture words are not shown after the Espanol switch");
          if (await es.isHidden()) await page.locator("#studio-menu-btn").click();
          await es.click();
          await page.waitForTimeout(500);
          if (vp === "chromebook") await axe(page, where, `#stage-${tab}`);
          if (errs.length) fail(where, `console: ${errs[0]}`);
        }
        if (OUT && (mode === "practice" || lesson === "6-3")) {
          await page.waitForTimeout(1700);
          await shot(page, `lab-${lesson}-${mode}-${vp}.png`, ".model-picture");
        }
        await ctx.close();
      }
    }
  }
}

let browser;
try {
  browser = await chromium.launch();
} catch (e) {
  server.close();
  skipExit(`no browser: ${e.message}`);
}
try {
  await family(browser);
  await lab(browser);
} finally {
  await browser.close();
  server.close();
}
if (!SHOTS_ONLY) {
  const files = [
    "exact",
    "exponent-copies",
    "exponent-copies-render",
    "exponent-copies-motion",
    "exponent-copies-view",
    "motion",
    "tokens",
  ]
    .map((n) => `shared/motion/${n}.mjs`)
    .concat("shared/motion/motion.css");
  let raw = 0;
  let gz = 0;
  for (const f of files) {
    const b = readFileSync(join(ROOT, f));
    raw += b.length;
    gz += gzipSync(b).length;
  }
  note.push(
    `shipped motion code: ${files.length} files, ${(raw / 1024).toFixed(1)} KB raw, ${(gz / 1024).toFixed(1)} KB gzip, loaded only where a power is drawn`,
  );
  for (const n of note) console.log(n);
  if (failures.length) {
    console.error(
      `motion exponents browser: ${failures.length} failure(s)\n  ${[...new Set(failures)].slice(0, 60).join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(
    "motion exponents browser: family model and lab bench, 4 viewports, EN and ES, reduced motion, keyboard, axe: all clear.",
  );
}
