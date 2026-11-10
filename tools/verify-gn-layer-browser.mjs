#!/usr/bin/env node
// biome-ignore-all lint/correctness/noUndeclaredVariables: page.evaluate callbacks run inside a book page, where PAGES, GATES, page and solved are the book's own globals
/**
 * verify-gn-layer-browser — every Axiom City graphic novel, driven the way a student drives it.
 *
 *   node tools/verify-gn-layer-browser.mjs [--books=u6-e2,vol-03] [--viewports=desk,tab,phone]
 *                                          [--shots=<dir>] [--no-solve] [--shard=0/3] [--real]
 *
 * For each book at 1366x768, 768x1024 and 390x844: boots with no console error; the cover has no overlap
 * and nothing leaves its card; every page and every gate has no horizontal scroll, clipped text, text under
 * 13px, tap target under 44px or speech bubble over the art; a vocabulary word opens the shared card
 * (focus moves in and stays, arrow keys do not turn the page, Esc closes and returns focus); the Easy read
 * switch (fed a fixture map covering every extracted string) swaps text, announces itself, survives a
 * reload and restores the original text exactly; the hint ladder, the Ask-VEX worked example and the
 * teacher panel fit; the Save/Resume launcher is still there; and the gates behave exactly as they do with
 * the layer removed (same wrong answers rejected, same gates solved by the same automatic solver).
 * A missing browser is a SKIP (exit 3), never a pass.
 */
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { launchBrowser } from "./lib/family-design-browser.mjs";
import { extractBook } from "./lib/gn-extract.mjs";
import { listBooks } from "./lib/gn-layer.mjs";
import { measure, measureCover, snapshot, solveGate } from "./lib/gn-probes.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const VIEWPORTS = { desk: [1366, 768], tab: [768, 1024], phone: [390, 844] };
const wanted = (opt("viewports") || "desk,tab,phone").split(",");
const only = (opt("books") || "").split(",").filter(Boolean);
const shotsDir = opt("shots");
const MARK = "EZ·";
const real = args.includes("--real"); // use each book's own embedded easy map instead of the fixture
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".json": "application/json",
  ".woff2": "font/woff2",
};

// graphic-novels/ from the source tree (this is what the branch changes); everything else from dist/ when built.
function serve() {
  const dist = existsSync(join(ROOT, "dist/index.html")) ? join(ROOT, "dist") : ROOT;
  const server = createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const base = p.startsWith("/graphic-novels/") ? ROOT : dist;
    const file = resolve(base, `.${p}`);
    if (!file.startsWith(`${base}/`) || !existsSync(file) || !statSync(file).isFile())
      return void res.writeHead(404).end("nf");
    res
      .writeHead(200, {
        "content-type": TYPES[extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
      })
      .end(readFileSync(file));
  });
  return new Promise((r) =>
    server.listen(0, "127.0.0.1", () =>
      r({ origin: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }),
    ),
  );
}

const fixtureFor = (items) => ({
  v: 1,
  map: Object.fromEntries(
    items.map((i) => [i.key, `<span class="gn-fixture">${MARK}</span> ${i.html}`]),
  ),
});

async function open(
  browser,
  origin,
  book,
  vp,
  { layer = true, easy = null, teacher = false } = {},
) {
  const ctx = await browser.newContext({
    viewport: { width: VIEWPORTS[vp][0], height: VIEWPORTS[vp][1] },
    hasTouch: vp === "phone",
  });
  if (teacher) await ctx.addInitScript(() => localStorage.setItem("nt-teacher-mode", "1"));
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route("**/graphic-novels/axiom-city/**/*.html", async (route) => {
    const resp = await route.fetch();
    let body = await resp.text();
    if (!layer) body = body.replace(/<!-- gn-layer:begin[\s\S]*?<!-- gn-layer:end -->\n?/, "");
    else if (easy)
      body = body.replace(
        /(<script type="application\/json" id="gn-easy">)[\s\S]*?(<\/script>)/,
        (_, a, b) => a + JSON.stringify(easy).replace(/</g, "\\u003c") + b,
      );
    await route.fulfill({ response: resp, body });
  });
  const rel = book.file.slice(ROOT.length);
  await page.goto(`${origin}${rel}${teacher ? "?teacher=1" : ""}`);
  await page.waitForTimeout(400);
  return { ctx, page, errors };
}

const settle = (page) =>
  page.evaluate(
    () =>
      new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 40))),
      ),
  );
const goto = async (page, i) => {
  await page.evaluate((i) => {
    page = i;
    renderSpread();
  }, i);
  await settle(page);
};
const shot = async (page, name) => {
  if (shotsDir) await page.screenshot({ path: join(shotsDir, `${name}.png`) });
};

async function popupTest(page, sel, { tag, bad, results, slug, vp }) {
  const term = page.locator(sel).first();
  const word = (await term.textContent()).toLowerCase();
  await term.scrollIntoViewIfNeeded();
  await term.click();
  await page.waitForTimeout(100);
  const open = await page.evaluate(() => {
    const p = document.getElementById("gnPopup");
    const r = p.querySelector(".gn-popup").getBoundingClientRect();
    const img = p.querySelector(".gn-popup-img");
    return {
      shown: !p.hidden,
      focusOnClose: document.activeElement?.classList.contains("gn-popup-close"),
      title: p.querySelector(".gn-popup-term").textContent,
      def: p.querySelector(".gn-popup-def").textContent.length > 0,
      imgOk: img.hidden || (img.complete && img.naturalWidth > 0),
      fits: r.left >= 0 && r.right <= innerWidth + 0.5,
    };
  });
  if (!open.shown) bad("vocab popup did not open");
  if (!open.focusOnClose) bad("vocab popup: focus did not move to the close button");
  if (!open.def) bad("vocab popup has no definition");
  if (!open.imgOk) bad("vocab popup picture did not load");
  if (!open.fits) bad("vocab popup overflows the screen horizontally");
  const head = word.split(/\W+/)[0];
  if (!head || !open.title.toLowerCase().includes(head.slice(0, 4)))
    results.notes.push(`${tag}: popup title "${open.title}" for word "${word}" (alias or plural)`);
  const before = await page.evaluate(() => page);
  for (let k = 0; k < 6; k++) await page.keyboard.press("Tab");
  await page.keyboard.press("ArrowRight");
  const trapped = await page.evaluate(() => ({
    inside: !!document.activeElement?.closest("#gnPopup"),
    page,
  }));
  if (!trapped.inside) bad("vocab popup: focus escaped with Tab");
  if (trapped.page !== before) bad("vocab popup: arrow key turned the page behind it");
  await shot(page, `${slug}-${vp}-popup`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(80);
  const closed = await page.evaluate(() => ({
    hidden: document.getElementById("gnPopup").hidden,
    onTerm: document.activeElement?.classList.contains("gn-term"),
    text: document.activeElement?.textContent,
  }));
  if (!closed.hidden) bad("vocab popup: Esc did not close it");
  if (!closed.onTerm || closed.text?.toLowerCase() !== word)
    bad("vocab popup: focus did not return to the word");
}

async function auditBook(browser, origin, book, vp, extracted, results) {
  const tag = `${book.slug} @${vp}`;
  const bad = (msg) => results.failures.push(`${tag}: ${msg}`);
  const fixture = real ? null : fixtureFor(extracted.items);
  const differs = (snap, base) =>
    real ? JSON.stringify(snap) !== JSON.stringify(base) : snap.some((t) => t.includes(MARK));
  const { ctx, page, errors } = await open(browser, origin, book, vp, { easy: fixture });
  if (shotsDir) mkdirSync(shotsDir, { recursive: true });
  const slug = book.slug.replace("axiom-city-", "");

  // --- cover
  const cover = await page.evaluate(measureCover);
  for (const i of cover.issues) bad(`cover: ${i}`);
  results.covers.push({ tag, ...cover });
  const coverMeasure = await page.evaluate(measure);
  for (const k of ["tiny", "targets"]) for (const t of coverMeasure[k]) bad(`cover ${k}: ${t}`);
  if (coverMeasure.hscroll) bad("cover: horizontal scroll");
  if (
    !(await page.evaluate(() =>
      [...document.querySelectorAll("button,a")].some((b) =>
        /Save\s*\/\s*Resume/i.test(b.textContent),
      ),
    ))
  )
    bad("Save/Resume launcher missing");
  await shot(page, `${slug}-${vp}-cover`);

  // --- walk every page
  await page.click("#startBtn");
  await settle(page);
  const count = await page.evaluate(() => PAGES.length);
  const step = await page.evaluate(() => (isMobile() ? 1 : 2));
  const gatePages = await page.evaluate(() =>
    PAGES.map((p, i) => (p.gate ? i : -1)).filter((i) => i >= 0),
  );
  let termSeen = null;
  for (let i = 0; i < count; i += step) {
    await goto(page, i);
    const m = await page.evaluate(measure);
    for (const k of ["tiny", "targets", "clipped", "bubbles"])
      for (const t of m[k]) bad(`page ${i + 1} ${k}: ${t}`);
    if (m.hscroll) bad(`page ${i + 1}: horizontal scroll`);
    results.svg[tag] = Math.max(results.svg[tag] || 0, m.svgTargets);
    if (termSeen === null && (await page.locator("#pageL .gn-term, #pageR .gn-term").count()))
      termSeen = i;
    if (i === 0 || i === Math.floor(count / 2) || i + step >= count)
      await shot(page, `${slug}-${vp}-p${i + 1}`);
  }

  // --- vocabulary pop-up (first underlined word found on a page; else in a gate hint, below)
  let popupDone = false;
  const testPopup = (sel) => popupTest(page, sel, { tag, bad, results, slug, vp });
  if (termSeen !== null) {
    await goto(page, termSeen);
    await testPopup("#pageL .gn-term, #pageR .gn-term");
    popupDone = true;
  }

  // --- Easy read: swap, announce, restore exactly, persist
  await goto(page, gatePages[0] ?? 1);
  const regular = await page.evaluate(snapshot);
  await page.click("[data-gn-mode=easy]");
  await settle(page);
  const easy = await page.evaluate(snapshot);
  if (!differs(easy, regular)) bad("Easy read: nothing on the page changed");
  if (
    !(await page.evaluate(() => /Easy read on/.test(document.getElementById("live").textContent)))
  )
    bad("Easy read: switch not announced in #live");
  if ((await page.getAttribute("[data-gn-mode=easy]", "aria-pressed")) !== "true")
    bad("Easy read: aria-pressed not set");
  await shot(page, `${slug}-${vp}-easy`);
  const m = await page.evaluate(measure);
  for (const k of ["clipped", "bubbles"]) for (const t of m[k]) bad(`easy page ${k}: ${t}`);
  await page.reload();
  await page.waitForTimeout(300);
  await page.click("#resumeBtn");
  await settle(page);
  if ((await page.getAttribute("[data-gn-mode=easy]", "aria-pressed")) !== "true")
    bad("Easy read: choice not remembered after reload");
  await goto(page, gatePages[0] ?? 1);
  if (!differs(await page.evaluate(snapshot), regular)) bad("Easy read: not applied after reload");
  await page.click("[data-gn-mode=regular]");
  await settle(page);
  const restored = await page.evaluate(snapshot);
  if (JSON.stringify(restored) !== JSON.stringify(regular))
    bad("Easy read: switching back did not restore the original text exactly");

  // --- gates: wrong answer rejected, hint ladder, worked example, easy feedback
  for (const gi of gatePages) {
    await goto(page, gi);
    const id = await page.evaluate(
      () => document.querySelector(".gatemount[data-gate]")?.dataset.gate,
    );
    const ladder = [];
    for (let n = 0; n < 3; n++) {
      await page.evaluate(() => document.querySelector(".gatecheck:not(.askvex)")?.click());
      ladder.push(
        await page.evaluate(() => ({
          fb: document.querySelector(".gatefeedback")?.textContent.length || 0,
          hint: document.querySelector(".gatehint:not([hidden])")?.textContent.length || 0,
          askvex: !!document.querySelector(".askvex"),
          solved: !!document.querySelector(".gatesolved"),
        })),
      );
    }
    if (!popupDone && (await page.locator(".gatehint .gn-term").count())) {
      await testPopup(".gatehint .gn-term");
      popupDone = true;
    }
    if (ladder[2].solved) bad(`gate ${id}: empty inputs were accepted`);
    if (!ladder[0].fb) bad(`gate ${id}: no feedback after a wrong answer`);
    if (!ladder[0].hint || !ladder[1].hint) bad(`gate ${id}: hint ladder did not appear`);
    if (!ladder[2].askvex) bad(`gate ${id}: Ask VEX button missing after three misses`);
    const m2 = await page.evaluate(measure);
    for (const k of ["clipped", "bubbles", "tiny", "targets"])
      for (const t of m2[k]) bad(`gate ${id} ${k}: ${t}`);
    await shot(page, `${slug}-${vp}-gate-${id}`);
    if (gi === gatePages[0]) {
      await page.evaluate(() => document.querySelector(".askvex")?.click());
      await page.waitForTimeout(120);
      const w = await page.evaluate(() => {
        const mc = document.querySelector("#workedModal .modalcard").getBoundingClientRect();
        return {
          open: document.getElementById("workedModal").classList.contains("open"),
          fits: mc.left >= 0 && mc.right <= innerWidth + 0.5,
          closeBtn: !!document.querySelector("#workedModal [data-gn-close]"),
        };
      });
      if (!w.open) bad("worked example did not open");
      if (!w.fits) bad("worked example overflows horizontally");
      if (!w.closeBtn) bad("worked example has no close button");
      await shot(page, `${slug}-${vp}-worked`);
      const wm = await page.evaluate(measure);
      for (const k of ["tiny", "targets", "clipped"])
        for (const t of wm[k]) bad(`worked example ${k}: ${t}`);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(80);
      if (
        await page.evaluate(() => document.getElementById("workedModal").classList.contains("open"))
      )
        bad("worked example: Esc did not close it");
    }
  }

  if (!popupDone) bad("no vocabulary word is underlined anywhere in the book, not even in a hint");

  // --- teacher panel (needs the teacher unlock) and completion page
  await goto(page, count - 1);
  const last = await page.evaluate(measure);
  for (const k of ["tiny", "targets", "clipped"])
    for (const t of last[k]) bad(`last page ${k}: ${t}`);
  if (last.hscroll) bad("last page: horizontal scroll");
  await shot(page, `${slug}-${vp}-last`);
  await ctx.close();
  if (errors.length) bad(`console errors: ${errors.slice(0, 3).join(" | ")}`);

  if (vp === wanted[0]) {
    const t = await open(browser, origin, book, vp, { easy: fixture, teacher: true });
    await t.page.click("#startBtn");
    await settle(t.page);
    if (await t.page.locator("#teacherBtn").count()) {
      await t.page.click("#teacherBtn");
      await t.page.waitForTimeout(150);
      const tm = {
        ...(await t.page.evaluate(measure)),
        ...(await t.page.evaluate(() => {
          const r = document.querySelector("#teacherModal .modalcard").getBoundingClientRect();
          return {
            terms: document.querySelectorAll("#teacherBody .gn-term").length,
            fits: r.right <= innerWidth + 0.5 && r.left >= 0,
          };
        })),
      };
      if (tm.terms) bad("teacher panel: vocabulary words must not be underlined there");
      if (!tm.fits || tm.hscroll) bad("teacher panel overflows horizontally");
      for (const k of ["tiny", "targets"]) for (const x of tm[k]) bad(`teacher panel ${k}: ${x}`);
      await shot(t.page, `${slug}-${vp}-teacher`);
    } else bad("teacher panel could not be opened");
    await t.ctx.close();
  }
}

/** Gates must behave identically with and without the layer. */
async function gateParity(browser, origin, book, results) {
  const run = async (layer) => {
    const { ctx, page, errors } = await open(browser, origin, book, "desk", { layer });
    await page.click("#startBtn");
    await settle(page);
    const ids = await page.evaluate(() => Object.keys(GATES));
    const out = {};
    for (const id of ids) {
      const at = await page.evaluate((id) => PAGES.findIndex((p) => p.gate === id), id);
      await goto(page, at);
      await page.evaluate(() => document.querySelector(".gatecheck:not(.askvex)")?.click());
      const wrong = await page.evaluate(
        (id) => ({
          fb: document.querySelector(".gatefeedback")?.textContent,
          solved: solved.has(id),
        }),
        id,
      );
      out[id] = { wrong, solve: opt("no-solve") ? "skipped" : await page.evaluate(solveGate, id) };
    }
    await ctx.close();
    return { out, errors };
  };
  const [base, withLayer] = [await run(false), await run(true)];
  for (const id of Object.keys(base.out)) {
    if (JSON.stringify(base.out[id]) !== JSON.stringify(withLayer.out[id]))
      results.failures.push(
        `${book.slug}: gate ${id} behaves differently with the layer: ${JSON.stringify(base.out[id])} vs ${JSON.stringify(withLayer.out[id])}`,
      );
    results.gates.total++;
    if (withLayer.out[id].solve === "solved") results.gates.solved++;
  }
  if (withLayer.errors.length)
    results.failures.push(`${book.slug}: console errors in gate run: ${withLayer.errors[0]}`);
}

const browser = await launchBrowser();
if (!browser)
  process.exit(
    skipExit(
      "no Chromium available",
      "set PW_CHROMIUM_PATH or run `npx playwright install chromium`",
    ),
  );
const { origin, close } = await serve();
const results = { failures: [], covers: [], notes: [], svg: {}, gates: { total: 0, solved: 0 } };
const [shardAt, shardOf] = (opt("shard") || "0/1").split("/").map(Number);
const books = listBooks()
  .filter((b) => !only.length || only.some((o) => b.slug.includes(o)))
  .filter((_, i) => i % shardOf === shardAt);
if (!books.length) throw new Error("no books matched --books");
const t0 = Date.now();
for (const book of books) {
  const extracted = extractBook(book.file);
  await Promise.all(wanted.map((vp) => auditBook(browser, origin, book, vp, extracted, results)));
  await gateParity(browser, origin, book, results);
  console.log(`${book.slug}: done (${results.failures.length} failures so far)`);
}
await browser.close();
close();
for (const n of results.notes) console.log(`note  ${n}`);
for (const c of results.covers.filter((c) => c.footerOverCharacters))
  console.log(
    `note  ${c.tag}: cover footer text sits over characters (${c.footerOverCharacters}); readable on its scrim`,
  );
const svgBooks = Object.entries(results.svg).filter(([, n]) => n);
if (svgBooks.length)
  console.log(
    `note  art-drawn controls (SVG) under 44px, not changed: ${svgBooks.map(([t, n]) => `${t.replace("axiom-city-", "")}=${n}`).join(", ")}`,
  );
for (const f of results.failures) console.error(`FAIL  ${f}`);
console.log(
  `${books.length} books x ${wanted.length} viewports in ${Math.round((Date.now() - t0) / 1000)}s; gates solved by the auto-solver (layer on): ${results.gates.solved}/${results.gates.total}; ${results.failures.length} failures`,
);
process.exit(results.failures.length ? 1 : 0);
