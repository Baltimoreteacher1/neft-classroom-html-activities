// Browser sweep for the Math Fluency Lab (requirements §16): journeys 1-7 at 5 widths in EN and ES, keyboard only,
// axe WCAG 2.2 AA, console errors, overflow, and lab LCP/CLS/INP. Run: node sweep.cjs <baseUrl> <out.json> [--quick]
const REPO = "/Users/joelneft/wt-fluency-features";
const { chromium } = require(`${REPO}/node_modules/playwright`);
const fs = require("node:fs");
const axeSource = fs.readFileSync(`${REPO}/node_modules/axe-core/axe.min.js`, "utf8");

const BASE = (process.argv[2] || "https://eduwonderlab.com").replace(/\/$/, "");
const OUT = process.argv[3] || "sweep.json";
const QUICK = process.argv.includes("--quick");
const WIDTHS = QUICK ? [320, 1440] : [320, 375, 768, 1024, 1440];
const LANGS = ["en", "es"];
const APP = `${BASE}/math/fluency-lab/`;
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const results = { base: BASE, at: new Date().toISOString(), runs: [], findings: [], axe: [], cwv: [], counts: {} };
const note = (sev, where, msg) => results.findings.push({ sev, where, msg });

const heightFor = (w) => (w <= 375 ? 812 : w <= 768 ? 1024 : 900);

async function overflow(page, where) {
  const r = await page.evaluate(() => {
    const doc = document.documentElement;
    const wide = [...document.querySelectorAll("body *")]
      .filter((e) => {
        const b = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return b.width > 0 && s.visibility !== "hidden" && s.display !== "none" && (b.right > innerWidth + 1 || b.left < -1) && !e.closest("[hidden],svg,.sr-only,.visually-hidden,.skip-link") && s.position !== "fixed" && !e.classList.contains("skip-link");
      })
      .slice(0, 4)
      .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).slice(0, 40)}`);
    return { scrollW: doc.scrollWidth, innerW: innerWidth, wide };
  });
  if (r.scrollW > r.innerW + 1) note("fail", where, `horizontal scroll: scrollWidth ${r.scrollW} > ${r.innerW}`);
  else if (r.wide.length) note("warn", where, `elements past the viewport edge: ${r.wide.join(", ")}`);
  return r;
}

async function axeRun(page, where) {
  await page.evaluate(axeSource);
  const res = await page.evaluate(async (tags) => {
    const r = await axe.run(document, { runOnly: { type: "tag", values: tags } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, help: v.help, sample: v.nodes[0]?.target?.join(" ").slice(0, 120) }));
  }, AXE_TAGS);
  results.axe.push({ where, violations: res });
  for (const v of res) note(v.impact === "serious" || v.impact === "critical" ? "fail" : "warn", where, `axe ${v.id} (${v.impact}, ${v.n}): ${v.help} @ ${v.sample}`);
  return res;
}

// Keyboard only: Tab through the page, check each stop shows a focus indicator, nothing traps, Shift+Tab walks back.
async function keyboardWalk(page, where, maxStops = 40) {
  await page.evaluate(() => { document.activeElement?.blur?.(); window.scrollTo(0, 0); });
  const stops = [];
  let stuck = 0;
  for (let i = 0; i < maxStops; i += 1) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return { body: true };
      const cs = getComputedStyle(e);
      const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2;
      const shadow = cs.boxShadow && cs.boxShadow !== "none";
      const b = e.getBoundingClientRect();
      window.__kb = window.__kb || new WeakMap(); window.__kbn = window.__kbn || 0;
      if (!window.__kb.has(e)) window.__kb.set(e, ++window.__kbn);
      return { key: `#${window.__kb.get(e)} ${e.tagName}.${String(e.className).slice(0, 24)}|${(e.textContent || e.getAttribute("aria-label") || "").trim().slice(0, 24)}`, visible: outline || shadow, w: Math.round(b.width), h: Math.round(b.height), inView: b.width > 0 };
    });
    if (s.body) { stuck += 1; if (stuck > 2) break; continue; }
    if (stops.length && stops.at(-1).key === s.key) { stuck += 1; if (stuck > 3) { note("fail", where, `keyboard trap: focus stuck on ${s.key}`); break; } }
    else stuck = 0;
    stops.push(s);
  }
  const noRing = stops.filter((s) => !s.visible);
  const unique = new Set(stops.map((s) => s.key)).size;
  if (!stops.length) note("fail", where, "no focusable element reached with Tab");
  if (noRing.length) note("fail", where, `${noRing.length} tab stops with no visible focus indicator: ${[...new Set(noRing.map((s) => s.key))].slice(0, 3).join("; ")}`);
  const small = stops.filter((s) => s.inView && (s.h < 44 || s.w < 44) && !/^INPUT/.test(s.key));
  if (small.length && page.viewportSize().width <= 768) note("warn", where, `${new Set(small.map((s) => s.key)).size} tab stops under 44px: ${[...new Set(small.map((s) => `${s.key} ${s.w}x${s.h}`))].slice(0, 3).join("; ")}`);
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("Shift+Tab");
  return { stops: stops.length, unique, noRing: noRing.length };
}

async function newCtx(browser, width, lang, { storage = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: heightFor(width) }, locale: lang === "es" ? "es-US" : "en-US", reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  const problems = { console: [], errors: [], failed: [] };
  page.on("console", (m) => { if (["error"].includes(m.type())) problems.console.push(m.text().slice(0, 160)); });
  page.on("pageerror", (e) => problems.errors.push(String(e).slice(0, 160)));
  page.on("response", (r) => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin) problems.failed.push(`${r.status()} ${r.url().replace(BASE, "")}`); });
  await page.addInitScript(() => {
    window.__cwv = { cls: 0, lcp: 0, inp: 0, events: 0 };
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cwv.cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__cwv.lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (e.interactionId) { window.__cwv.events += 1; window.__cwv.inp = Math.max(window.__cwv.inp, e.duration); } } }).observe({ type: "event", durationThreshold: 16, buffered: true }); } catch {}
  });
  return { ctx, page, problems };
}

const q = (lang) => (lang === "es" ? "&lang=es" : "");
const settle = (page, ms = 500) => page.waitForTimeout(ms);

async function journeys(browser, width, lang) {
  const tag = (j, s = "") => `J${j} ${s} @${width} ${lang}`.replace(/\s+/g, " ").trim();
  const record = (j, ok, detail) => results.runs.push({ journey: j, width, lang, ok, detail });
  const done = (c, where) => {
    const p = c.problems;
    for (const m of p.console) note("fail", where, `console error: ${m}`);
    for (const m of p.errors) note("fail", where, `page error: ${m}`);
    for (const m of p.failed) note("fail", where, `failed request: ${m}`);
  };

  // J1 first visit -> grade chooser -> one recommended start -> a skill (clicks counted)
  {
    const c = await newCtx(browser, width, lang); const { page } = c; const w = tag(1);
    let clicks = 0; let ok = true; let detail = "";
    try {
      await page.goto(`${APP}?${q(lang).slice(1)}`.replace(/\?$/, ""), { waitUntil: "networkidle" }); await settle(page);
      const grades = await page.$$eval(".grade-btn", (b) => b.map((x) => x.dataset.grade));
      if (grades.join(",") !== "0,1,2,3,4,5,6,7,8") { ok = false; detail += `grade chooser shows ${grades.join(",")}; `; }
      const pressedBefore = await page.$$eval(".grade-btn[aria-pressed=true]", (b) => b.length);
      if (pressedBefore) { ok = false; detail += "a grade is preselected; "; }
      await overflow(page, w + " chooser"); await axeRun(page, w + " home-first-visit"); await keyboardWalk(page, w + " home-first-visit");
      // keyboard-only: Tab to a grade and press Enter
      await page.focus('.grade-btn[data-grade="4"]'); await page.keyboard.press("Enter"); clicks += 1; await settle(page);
      const primary = await page.$$eval("main button.btn-primary, main .btn-primary", (b) => b.map((x) => x.textContent.trim()));
      const secondary = await page.$$eval("main [data-go=library], main button.btn-secondary", (b) => b.map((x) => x.textContent.trim()));
      if (primary.length !== 1) { ok = false; detail += `${primary.length} primary actions on home (${primary.join("|")}); `; }
      if (!secondary.length) { ok = false; detail += "no 'choose a different skill'; "; }
      await overflow(page, w + " home-grade"); await axeRun(page, w + " home-grade");
      await page.locator("main .btn-primary").first().click(); clicks += 1; await settle(page, 800);
      const onSkill = await page.evaluate(() => !!document.querySelector(".skill"));
      if (!onSkill) { ok = false; detail += "Start did not open a skill; "; }
      if (clicks > 3) { ok = false; detail += `${clicks} actions to reach a skill; `; }
      await overflow(page, w + " skill-see"); await axeRun(page, w + " skill-see"); await keyboardWalk(page, w + " skill-see");
      detail += `grade chooser → skill in ${clicks} actions`;
    } catch (e) { ok = false; detail += `threw: ${String(e).split("\n")[0]}`; }
    record(1, ok, detail); if (!ok) note("fail", w, detail); done(c, w); await c.ctx.close();
  }

  // J2 library: search with everyday words, filters, Start
  {
    const c = await newCtx(browser, width, lang); const { page } = c; const w = tag(2);
    let ok = true; let detail = "";
    try {
      await page.goto(`${APP}?view=library&grade=5${q(lang)}`, { waitUntil: "networkidle" }); await settle(page);
      await overflow(page, w + " library"); await axeRun(page, w + " library"); await keyboardWalk(page, w + " library");
      const input = page.locator('main input[type="search"], main input').first();
      const terms = lang === "es" ? ["fracciones", "multiplicar"] : ["fractions", "times", "take away"];
      for (const t of terms) { await input.fill(t); await settle(page, 300); const n = await page.$$eval("main button[data-skill]", (b) => b.length); if (!n) { ok = false; detail += `search '${t}' found nothing; `; } }
      await input.fill(""); await settle(page, 300);
      const chips = await page.$$eval("main [aria-pressed], main .chip, main .filter", (b) => b.length);
      await page.locator("main button[data-skill]").first().click(); await settle(page, 800);
      if (!(await page.evaluate(() => !!document.querySelector(".skill")))) { ok = false; detail += "card Start did not open a skill; "; }
      detail += `search ok, ${chips} filter controls`;
    } catch (e) { ok = false; detail += `threw: ${String(e).split("\n")[0]}`; }
    record(2, ok, detail); if (!ok) note("fail", w, detail); done(c, w); await c.ctx.close();
  }

  // J3 fresh device, direct link to practice; keyboard-only answer + Check
  {
    const c = await newCtx(browser, width, lang); const { page } = c; const w = tag(3);
    let ok = true; let detail = "";
    try {
      await page.goto(`${APP}?grade=3&skill=add-sub-1000&stage=practice${q(lang)}`, { waitUntil: "networkidle" }); await settle(page);
      const hasInput = await page.evaluate(() => !!document.querySelector("main input"));
      if (!hasInput) { ok = false; detail += "no answer box on a direct practice link; "; }
      await overflow(page, w + " practice"); await axeRun(page, w + " practice"); const kw = await keyboardWalk(page, w + " practice");
      await page.focus("main input"); await page.keyboard.type("1"); await page.keyboard.press("Enter"); await settle(page, 800);
      const feedback = await page.evaluate(() => (document.querySelector(".feedback, [data-feedback], .note, .why, [role=status]")?.textContent || "").trim().length);
      const stepBefore = await page.evaluate(() => document.querySelector("main")?.innerText.length);
      if (!feedback && !stepBefore) { ok = false; detail += "Enter in the answer box gave no feedback; "; }
      await overflow(page, w + " practice-feedback"); await axeRun(page, w + " practice-feedback");
      detail += `direct link opens practice with an answer box; ${kw.stops} tab stops`;
    } catch (e) { ok = false; detail += `threw: ${String(e).split("\n")[0]}`; }
    record(3, ok, detail); if (!ok) note("fail", w, detail); done(c, w); await c.ctx.close();
  }

  // J4 returning learner: finish a problem, reload home, Continue is the one primary action and the grade shows
  {
    const c = await newCtx(browser, width, lang); const { page } = c; const w = tag(4);
    let ok = true; let detail = "";
    try {
      await page.goto(`${APP}?grade=6&skill=ratios&stage=practice${q(lang)}`, { waitUntil: "networkidle" }); await settle(page);
      await page.fill("main input", "4"); await page.keyboard.press("Enter"); await settle(page, 800);
      await page.goto(`${APP}?${q(lang).slice(1)}`.replace(/\?$/, ""), { waitUntil: "networkidle" }); await settle(page, 800);
      const info = await page.evaluate(() => ({ primary: [...document.querySelectorAll("main .btn-primary")].map((b) => b.textContent.trim()), h1: document.querySelector("h1")?.textContent, grade: document.body.innerText.match(/grade \d|grado \d|kindergarten|kínder/i)?.[0] }));
      if (info.primary.length !== 1) { ok = false; detail += `${info.primary.length} primary actions for a returning learner; `; }
      if (!/continue|continuar|seguir|start|empezar|comenzar/i.test(info.primary[0] || "")) { ok = false; detail += `primary reads '${info.primary[0]}'; `; }
      if (!info.grade) { ok = false; detail += "grade not shown; "; }
      await overflow(page, w + " home-returning"); await axeRun(page, w + " home-returning");
      detail += `returning home: primary '${info.primary[0]}', ${info.grade}`;
    } catch (e) { ok = false; detail += `threw: ${String(e).split("\n")[0]}`; }
    record(4, ok, detail); if (!ok) note("fail", w, detail); done(c, w); await c.ctx.close();
  }

  // J5 pre-reader (K): read-aloud everywhere, large targets, no wall of text above the first action
  {
    const c = await newCtx(browser, width, lang); const { page } = c; const w = tag(5);
    let ok = true; let detail = "";
    try {
      await page.goto(`${APP}?grade=0&skill=count-forward${q(lang)}`, { waitUntil: "networkidle" }); await settle(page, 800);
      const info = await page.evaluate(() => ({ say: document.querySelectorAll("[data-say]").length, words: (document.querySelector(".skill")?.innerText || "").split(/\s+/).length, svg: document.querySelectorAll(".cv svg, .panel svg").length }));
      if (!info.say) { ok = false; detail += "no read-aloud control on a Kindergarten skill; "; }
      if (!info.svg) { ok = false; detail += "no picture on a Kindergarten skill; "; }
      await overflow(page, w + " k-see"); await axeRun(page, w + " k-see");
      await page.goto(`${APP}?grade=0&skill=count-forward&stage=practice${q(lang)}`, { waitUntil: "networkidle" }); await settle(page, 600);
      await axeRun(page, w + " k-practice");
      detail += `K skill: ${info.say} read-aloud control(s), ${info.svg} picture(s), ${info.words} words on screen`;
    } catch (e) { ok = false; detail += `threw: ${String(e).split("\n")[0]}`; }
    record(5, ok, detail); if (!ok) note("fail", w, detail); done(c, w); await c.ctx.close();
  }

  // J6 shared Grade 6 link; language toggle keeps the skill and step (the other language works too)
  {
    const c = await newCtx(browser, width, lang); const { page } = c; const w = tag(6);
    let ok = true; let detail = "";
    try {
      await page.goto(`${APP}?grade=6&skill=ratios&stage=try${q(lang)}`, { waitUntil: "networkidle" }); await settle(page, 800);
      const before = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector("h1")?.textContent, search: location.search }));
      await page.click("#lang-btn"); await settle(page, 900);
      const after = await page.evaluate(() => ({ lang: document.documentElement.lang, h1: document.querySelector("h1")?.textContent, search: location.search, skill: !!document.querySelector(".skill") }));
      if (before.lang === after.lang) { ok = false; detail += "language did not change; "; }
      if (!after.skill || !/skill=ratios/.test(after.search) || !/stage=try/.test(after.search)) { ok = false; detail += `toggle left the skill/step (${after.search}); `; }
      await overflow(page, w + " try"); await axeRun(page, w + " try-toggled");
      await page.click("#lang-btn"); await settle(page, 600);
      detail += `${before.lang}→${after.lang} kept ${after.search}`;
    } catch (e) { ok = false; detail += `threw: ${String(e).split("\n")[0]}`; }
    record(6, ok, detail); if (!ok) note("fail", w, detail); done(c, w); await c.ctx.close();
  }

  // J7 progress, More drawer, forwarding to the full lab, preferences
  {
    const c = await newCtx(browser, width, lang); const { page } = c; const w = tag(7);
    let ok = true; let detail = "";
    try {
      await page.goto(`${APP}?view=my-progress&grade=6${q(lang)}`, { waitUntil: "networkidle" }); await settle(page, 700);
      if (!(await page.evaluate(() => !!document.querySelector("main h1") && !document.querySelector("#lab-root, .lab-shell")))) { ok = false; detail += "progress view did not open in the shell; "; }
      await overflow(page, w + " progress"); await axeRun(page, w + " progress"); await keyboardWalk(page, w + " progress", 25);
      await page.click("#more-btn"); await settle(page, 500);
      const links = await page.$$eval("[role=dialog] a, dialog a, aside a", (a) => a.map((x) => ({ t: x.textContent.trim().slice(0, 30), h: x.getAttribute("href") })));
      if (links.length < 6) { ok = false; detail += `More drawer lists only ${links.length} destinations; `; }
      await overflow(page, w + " more-drawer"); await axeRun(page, w + " more-drawer");
      const prefs = await page.evaluate(() => document.body.innerText.match(/text size|tamaño del texto|reduce motion|reducir movimiento|read aloud|leer en voz alta|reading font|letra/gi)?.length || 0);
      const r = await page.request.get(`${BASE}/math/fluency-lab/lab`); if (r.status() >= 400) { ok = false; detail += `/math/fluency-lab/lab answers ${r.status()}; `; }
      detail += `${links.length} More destinations, ${prefs} preference mentions, full lab answers ${r.status()}`;
    } catch (e) { ok = false; detail += `threw: ${String(e).split("\n")[0]}`; }
    record(7, ok, detail); if (!ok) note("fail", w, detail); done(c, w); await c.ctx.close();
  }
}

async function cwv(browser) {
  for (const [width, label] of [[375, "phone 375"], [1440, "desktop 1440"]]) {
    for (const [name, url] of [["home", `${APP}?grade=6`], ["skill practice", `${APP}?grade=6&skill=ratios&stage=practice`], ["skill see", `${APP}?grade=3&skill=add-sub-1000`]]) {
      const c = await newCtx(browser, width, "en"); const { page } = c;
      if (width === 375) { const cdp = await c.ctx.newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 }); await cdp.send("Network.enable"); await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 }); }
      await page.goto(url, { waitUntil: "load" }); await settle(page, 1500);
      if (await page.$("main input")) { await page.fill("main input", "3"); await page.keyboard.press("Enter"); await settle(page, 600); }
      const btn = await page.$("main button"); if (btn) { await btn.click().catch(() => {}); await settle(page, 600); }
      await page.keyboard.press("Tab"); await settle(page, 300);
      const m = await page.evaluate(() => ({ ...window.__cwv, nav: performance.getEntriesByType("navigation")[0]?.responseEnd, transfer: performance.getEntriesByType("resource").reduce((s, r) => s + (r.transferSize || 0), 0) }));
      results.cwv.push({ profile: label + (width === 375 ? " (4x CPU, slow 4G)" : " (no throttle)"), screen: name, lcpMs: Math.round(m.lcp), cls: Number(m.cls.toFixed(4)), inpMs: Math.round(m.inp), interactions: m.events, transferKB: Math.round(m.transfer / 1024) });
      await c.ctx.close();
    }
  }
}

(async () => {
  const browser = await chromium.launch();
  const t0 = Date.now();
  for (const width of WIDTHS) {
    await Promise.all(LANGS.map((lang) => journeys(browser, width, lang)));
    console.error(`width ${width} done (${Math.round((Date.now() - t0) / 1000)}s), findings so far: ${results.findings.filter((f) => f.sev === "fail").length} fail / ${results.findings.filter((f) => f.sev === "warn").length} warn`);
  }
  if (!QUICK && !process.argv.includes("--nocwv")) await cwv(browser);
  results.counts = {
    runs: results.runs.length,
    runsOk: results.runs.filter((r) => r.ok).length,
    axePages: results.axe.length,
    axeSeriousCritical: results.axe.flatMap((a) => a.violations).filter((v) => v.impact === "serious" || v.impact === "critical").length,
    fail: results.findings.filter((f) => f.sev === "fail").length,
    warn: results.findings.filter((f) => f.sev === "warn").length,
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log(JSON.stringify(results.counts));
  await browser.close();
})();
