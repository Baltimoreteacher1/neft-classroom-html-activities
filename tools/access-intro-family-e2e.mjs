#!/usr/bin/env node
/**
 * Practice Together (/practice-together) in a real browser: English, Español and both at 1280/768/375/320, the page's own
 * language switch, the Start buttons and the way back (the return bar, browser Back), keyboard order, closed sections,
 * 48px targets, axe WCAG 2.2 AA, and the claim the page makes about the languages inside the two activities.
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
  console.warn(
    "access-intro-family-e2e: axe-core/playwright is not installed; skipping axe checks.",
  );
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

async function open(lang, width = 1280, path = "/practice-together") {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    ([key, l]) => {
      try {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify({ lang: l, langChosen: true }));
      } catch {}
    },
    [PREFS, lang],
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  await page.goto(base + LAB + path, { waitUntil: "load" });
  await page.waitForSelector("#app .tg-page, #app .voice-step, #app .sc-page, #app h1");
  return { page, context };
}
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const h1 = (page) => page.locator("#app h1").allInnerTexts();

// 1. Each language at each width: one h1, whole page, no sideways scroll, Start buttons present.
const TITLES = { en: "Practice Together", es: "Practicar juntos" };
for (const lang of ["en", "es", "bi"]) {
  for (const width of [1280, 768, 375, 320]) {
    const { page, context } = await open(lang, width);
    const titles = await h1(page);
    ok(titles.length === 1, `${lang} ${width}: one h1`);
    const text = (await page.locator("#app").innerText()).toLowerCase();
    if (lang !== "es") ok(text.includes("practice together"), `${lang} ${width}: English title`);
    if (lang !== "en") ok(text.includes("practicar juntos"), `${lang} ${width}: Spanish title`);
    ok(!(await overflow(page)), `${lang} ${width}: no horizontal scroll`);
    ok((await page.locator(".tg-start").count()) === 2, `${lang} ${width}: two Start buttons`);
    ok(
      (await page.evaluate(() => document.documentElement.lang)) === (lang === "es" ? "es" : "en"),
      `${lang} ${width}: <html lang>`,
    );
    await context.close();
  }
}

// 2. The page's own switch: EN -> ES -> EN+ES -> EN keeps the page whole.
{
  const { page, context } = await open("en");
  for (const [mode, title] of [
    ["es", TITLES.es],
    ["bi", TITLES.en],
    ["en", TITLES.en],
  ]) {
    await page.click(`#app #tgLang-${mode}`);
    await page.waitForFunction(
      (m) => document.querySelector(`#app #tgLang-${m}`)?.getAttribute("aria-pressed") === "true",
      mode,
    );
    ok((await h1(page)).length === 1, `switch to ${mode}: one h1`);
    ok((await page.locator("#app").innerText()).includes(title), `switch to ${mode}: title shows`);
    ok((await page.locator(".tg-card").count()) === 2, `switch to ${mode}: both cards`);
  }
  await context.close();
}

// 3. Español: no English interface text outside lang="en" (names, examples and activity labels are English by design).
{
  const { page, context } = await open("es");
  const leaks = await page.evaluate(() => {
    const clone = document.querySelector("#app .tg-page").cloneNode(true);
    for (const n of clone.querySelectorAll('[lang="en"]')) n.remove();
    // The product name stays English on purpose (Mr. Neft's panel says "Su guía de The Language Page").
    for (const n of clone.querySelectorAll("*"))
      if (n.childNodes.length === 1 && n.firstChild.nodeType === 3)
        n.firstChild.textContent = n.firstChild.textContent.replace(/The Language Page/g, "");
    const re =
      /(?<!\p{L})(the|your|you|and|with|this|that|from|are|will|can|have|each|then|please|choose|practice|together)(?!\p{L})/giu;
    return (clone.textContent.match(re) || []).slice(0, 8);
  });
  ok(leaks.length === 0, `español: no English interface words${leaks.length ? ` (${leaks})` : ""}`);
  ok(
    (await page.locator('.tg-card [lang="en"]').count()) >= 5,
    "español: English names and examples are marked lang=en",
  );
  await context.close();
}

// 4. Start buttons: right route, return hint, activity opens, the return bar and browser Back both come back.
const WANT = [
  [0, "/voice/ladder/school-hallway", null],
  [1, "/scaffold/language-upgrade", "lu68-argue-phones"],
];
for (const lang of ["en", "es"]) {
  for (const [i, route, item] of WANT) {
    const { page, context } = await open(lang);
    const href = await page.locator(".tg-start").nth(i).getAttribute("href");
    const url = new URL(href, base);
    ok(url.pathname === LAB + route, `${lang} start ${i}: route ${route}`);
    ok(url.searchParams.get("intro") === "together", `${lang} start ${i}: return hint`);
    ok(!item || url.searchParams.get("item") === item, `${lang} start ${i}: keeps ?item`);
    await page.locator(".tg-start").nth(i).click();
    await page.waitForURL((u) => u.pathname === LAB + route);
    await page.waitForSelector("#app h1");
    const bar = page.locator("#introReturn a");
    await bar.waitFor({ timeout: 5000 }).catch(() => {});
    ok((await bar.count()) === 1, `${lang} start ${i}: return bar shown on the activity`);
    const label = await bar.innerText().catch(() => "");
    ok(
      lang === "en"
        ? /Back to Practice Together/.test(label)
        : /Volver a Practicar juntos/.test(label),
      `${lang} start ${i}: bar label "${label.replace(/\s+/g, " ").trim()}"`,
    );
    // The in-activity language claim: Español buttons inside the activity.
    const body = await page.locator("#app").innerText();
    if (lang === "es")
      ok(
        i === 0 ? /Escuchar la pregunta/.test(body) : /Empezar con esta ayuda/.test(body),
        `es start ${i}: the activity's buttons are in Spanish`,
      );
    else
      ok(
        !/Empezar con esta ayuda|Escuchar la pregunta/.test(body),
        `en start ${i}: activity buttons in English`,
      );
    await bar.click();
    await page.waitForURL((u) => u.pathname === `${LAB}/practice-together`);
    ok(
      (await h1(page)).includes(TITLES[lang]),
      `${lang} start ${i}: the bar returns to Practice Together`,
    );
    ok(
      (await page.locator("#introReturn").count()) === 0,
      `${lang} start ${i}: bar gone on the family page`,
    );
    // Browser Back from the activity.
    await page.locator(".tg-start").nth(i).click();
    await page.waitForURL((u) => u.pathname === LAB + route);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === `${LAB}/practice-together`);
    await page.waitForSelector("#app .tg-page");
    ok(true, `${lang} start ${i}: browser Back returns to the page`);
    await context.close();
  }
}

// 5. Need help? and More practice start closed; open; links resolve to the verified routes; no nested details.
{
  const { page, context } = await open("en");
  const closed = await page.$$eval(".tg-details", (d) => d.map((x) => x.open));
  ok(closed.length === 2 && closed.every((o) => !o), "Need help? and More practice start closed");
  ok((await page.locator("details details").count()) === 0, "no nested details");
  await page.locator(".tg-details > summary").nth(0).click();
  ok(
    /No account is needed/.test(await page.locator(".tg-help").innerText()),
    "help: no account answer",
  );
  const tools = page.locator('.tg-help a[href*="/tools"]');
  ok((await tools.count()) === 1, "help: links the device check");
  await page.locator(".tg-details > summary").nth(1).click();
  const more = await page.$$eval(".tg-more a.btn", (a) => a.map((x) => x.getAttribute("href")));
  ok(
    more.length === 2 &&
      more[0].includes("/reading-room/rr68p-why-we-have-seasons") &&
      more[1].includes("/wordlab/build") &&
      more.every((h) => h.includes("intro=together")),
    "more practice: the two verified routes, with the return hint",
  );
  // The open state survives a language switch.
  await page.click("#app #tgLang-es");
  await page.waitForFunction(() => document.documentElement.lang === "es");
  const stillOpen = await page.$$eval(".tg-details", (d) => d.map((x) => x.open));
  ok(stillOpen.every(Boolean), "sections stay open across a language switch");
  await tools
    .first()
    .click()
    .catch(() => {});
  await context.close();
}
{
  const { page, context } = await open("en");
  await page.locator(".tg-details > summary").first().click();
  await page.locator('.tg-help a[href*="/tools"]').click();
  await page.waitForURL((u) => u.pathname === `${LAB}/tools`);
  await page
    .waitForFunction(
      () => /device check/i.test(document.querySelector("#app h1")?.textContent || ""),
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  ok(/device check/i.test((await h1(page)).join(" ")), "help link opens the device check page");
  await context.close();
}
{
  const { page, context } = await open("en");
  const hrefs = await page.$$eval(".tg-foot a", (a) => a.map((x) => x.getAttribute("href")));
  ok(
    hrefs.some((h) => h.includes("/site-guide?for=family")) &&
      hrefs.some((h) => /\/family(\?|$)/.test(h)),
    "footer links: Site Guide (for=family) and Family Corner",
  );
  await context.close();
}

// 5b. A teacher's ?grades= link opens that grade; the family's own choice then wins and is remembered; the one
// next action ("Let's begin") brings the choices into view; Mr. Neft is on the page in the page's language.
{
  const { page, context } = await open("en", 1280, "/practice-together?grades=4-5");
  const pressedBand = () =>
    page.$eval('[data-tg-band][aria-pressed="true"]', (b) => b.dataset.tgBand);
  ok((await pressedBand()) === "3-5", "?grades=4-5 opens Grades 3–5");
  ok(
    (await page.locator(".tg-start").first().getAttribute("href")).includes("class-garden"),
    "Grades 3–5 card links its own picture",
  );
  await page.click('[data-tg-band="6-8"]');
  await page.waitForFunction(() => !location.search.includes("grades="));
  ok((await pressedBand()) === "6-8", "the family's own choice replaces the link's grade");
  await page.reload();
  await page.waitForSelector("#app .tg-page");
  ok((await pressedBand()) === "6-8", "the family's choice is remembered after a reload");
  ok(
    (await page.locator("#app [data-pg][data-pg-page='family']").count()) === 1,
    "Mr. Neft panel on the page",
  );
  ok((await page.locator("#app [data-tg-go]").count()) === 1, "one next action");
  await page.click("#app [data-tg-go]");
  await page.waitForFunction(() => document.activeElement?.id === "tgChoose");
  const top = await page.$eval("#tgChoose", (h) => h.getBoundingClientRect().top);
  ok(
    top >= 0 && top < 400,
    `Let's begin brings the choices into view (heading at ${Math.round(top)}px)`,
  );
  await context.close();
}
for (const [path, band] of [
  ["/practice-together?grades=K", "k-2"],
  ["/practice-together?grades=2-3", "k-2"],
  ["/practice-together?grades=6-8", "6-8"],
]) {
  const { page, context } = await open("es", 375, path);
  const got = await page.$eval('[data-tg-band][aria-pressed="true"]', (b) => b.dataset.tgBand);
  ok(got === band, `${path} opens ${band}`);
  ok(
    (await page.locator("#app [data-pg-lang='es']").count()) === 1,
    `${path}: Mr. Neft in Spanish`,
  );
  await context.close();
}
// 5c. The family's grade becomes the lab's grade (menu, directory and later pages agree); Grades K–2 ask for the exact
// grade and name the one activity instead of asking for a choice.
{
  const { page, context } = await open("en", 1280, "/practice-together?grades=6-8");
  const labBand = () =>
    page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "{}").band, PREFS);
  await page.click('[data-tg-band="3-5"]');
  await page.waitForFunction(() => document.body.dataset.labBand === "3-5");
  ok((await labBand()) === "3-5", "choosing Grades 3–5 sets the lab's grade");
  await page.click('[data-tg-band="k-2"]');
  await page.waitForSelector("[data-tg-early]");
  ok(
    (await page.locator("[data-tg-early]").count()) === 3,
    "Grades K–2 offer Kindergarten, Grade 1 and Grade 2",
  );
  await page.click('[data-tg-early="1"]');
  await page.waitForFunction(() => document.body.dataset.labBand === "1");
  ok((await labBand()) === "1", "Grade 1 sets the lab's grade");
  ok(
    (await page.$eval('[data-tg-early][aria-pressed="true"]', (b) => b.dataset.tgEarly)) === "1",
    "Grade 1 shows as chosen",
  );
  ok(
    (await page.locator(".tg-card").innerText()).includes("Mateo"),
    "Grade 1 shows the Grade 1 model child",
  );
  ok(
    (await page.locator("#tgChoose").innerText()).trim() === "Tonight’s activity",
    "K–2 names the one activity",
  );
  ok(
    (await page.locator('[data-tg-band][aria-pressed="false"]').count()) === 2,
    "unchosen grade buttons say aria-pressed=false",
  );
  await page.reload();
  await page.waitForSelector("#app .tg-page");
  ok(
    (await page.$eval('[data-tg-early][aria-pressed="true"]', (b) => b.dataset.tgEarly)) === "1",
    "the exact grade is remembered after a reload",
  );
  await context.close();
}
// 5d. A first visit sees one language question on this page (its own switch), not the site banner as well.
{
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(`${base}${LAB}/practice-together`, { waitUntil: "load" });
  await page.waitForSelector("#app .tg-page");
  ok(
    (await page.locator("#labLangBanner:visible").count()) === 0,
    "no site language banner on Practice Together",
  );
  ok(
    (await page.locator("#app [data-lang-mode]").count()) >= 3,
    "the page's own language switch is there",
  );
  await context.close();
}
{
  const { page, context } = await open("es");
  const href = await page.locator(".tg-print a").first().getAttribute("href");
  ok(href === "/access-practice-lab/guides/family-handout-es.pdf", `es: Spanish handout (${href})`);
  const res = await page.request.get(base + href);
  ok(res.ok() && (await res.body()).length > 10000, "the handout PDF is served");
  await context.close();
}

// 6. Keyboard order, 48px targets, visible focus, reduced motion. (Mr. Neft's panel is the shared guide component,
// sized by intro-tour.css; it is measured by the tour's own tests, not here.)
{
  const { page, context } = await open("en");
  await page.locator("#app h1").focus();
  const order = [];
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    order.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        if (!a?.closest("#app")) return "outside";
        return a.id || a.className.toString().split(" ")[0] || a.tagName;
      }),
    );
  }
  const idx = (k) => order.findIndex((o) => o === k);
  ok(
    idx("tgLang-en") >= 0 &&
      idx("tgLang-en") < idx("tgLang-es") &&
      idx("tgLang-es") < idx("tgLang-bi"),
    `tab order: language switch first (${order.slice(0, 4)})`,
  );
  const starts = order.map((o, i) => (o === "btn" ? i : -1)).filter((i) => i >= 0);
  ok(starts.length >= 2 && starts[0] < starts[1], "tab order: Talk Start before Write Start");
  const focusRing = await page.evaluate(() => {
    document.querySelector(".tg-start").focus();
    return getComputedStyle(document.querySelector(".tg-start")).outlineWidth;
  });
  ok(parseFloat(focusRing) >= 2, `Start shows a focus ring (${focusRing})`);
  const small = await page.$$eval(
    "#app .tg-page .btn, #app .tg-page summary, #app .tg-page .lang-btn",
    (els) =>
      els
        .filter((e) => !e.closest("[data-pg]"))
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.height < 47.5 || r.width < 47.5)
        .map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  ok(small.length === 0, `targets are at least 48px${small.length ? ` (${small})` : ""}`);
  await context.close();
}

// 6b. Grades K–2: one picture-talk routine on the page, built from the remembered early pick. Every button its steps
// name is on the real activity, in the page's language, and "I said my answer" works with no recording.
const EARLY = {
  K: { id: "gk-s-a-garden-see", first: "Lina", label: "Lina, age 5" },
  1: { id: "g1-s-a-garden-name", first: "Mateo", label: "Mateo, age 6" },
  "2-3": { id: "g23-s-a-garden-see", first: "Leo", label: "Leo, age 8" },
};
for (const lang of ["en", "es"]) {
  for (const [pick, want] of Object.entries(EARLY)) {
    const { page, context } = await open(lang, 1280, `/practice-together?grades=${pick}`);
    ok((await page.locator(".tg-card").count()) === 1, `${lang} K–2 ${pick}: one routine card`);
    ok((await page.locator(".tg-start").count()) === 1, `${lang} K–2 ${pick}: one Start button`);
    const href = await page.locator(".tg-start").getAttribute("href");
    const url = new URL(href, base);
    ok(
      url.pathname === `${LAB}/Speaking/A/${want.id}` && url.searchParams.get("grades") === pick,
      `${lang} K–2 ${pick}: Start opens ${want.id} with ?grades=${pick} (${href})`,
    );
    const print = await page.locator(".tg-print a").first().getAttribute("href");
    ok(
      print === `/access-practice-lab/guides/family-handout-k2${lang === "es" ? "-es" : ""}.pdf`,
      `${lang} K–2 ${pick}: the K–2 handout (${print})`,
    );
    const steps = await page.locator(".tg-card .tg-steps").innerText();
    ok(
      lang === "en"
        ? steps.includes(`Hear ${want.label} answer first`)
        : steps.includes(want.first),
      `${lang} K–2 ${pick}: step 1 names ${want.first}`,
    );
    await page.locator(".tg-start").click();
    await page.waitForURL((u) => u.pathname === `${LAB}/Speaking/A/${want.id}`);
    await page.waitForSelector("#app h1");
    await page.waitForTimeout(600);
    const names = await page.$$eval("#app button", (b) =>
      b.map((x) => x.innerText.replace(/\s+/g, " ").trim()),
    );
    const has = (re) => names.some((n) => re.test(n));
    const L =
      lang === "en"
        ? [/^Hear it again$/, new RegExp(`^Hear ${want.label} answer first$`), /^I said my answer$/]
        : [
            /^Escuchar otra vez$/,
            new RegExp(`^Escucha primero la respuesta de ${want.first}`),
            /^Dije mi respuesta$/,
          ];
    ok(L.every(has), `${lang} K–2 ${pick}: the activity has the buttons the steps name`);
    ok(
      /I see ___\./.test(await page.locator("#app").innerText()),
      `${lang} K–2 ${pick}: the “I see ___.” starter`,
    );
    await page.getByRole("button", { name: L[2] }).click();
    ok(
      (await page.locator("#introReturn a").count()) === 1,
      `${lang} K–2 ${pick}: the return bar is on the activity`,
    );
    await context.close();
  }
}
{
  // The family's remembered early pick (from the tour or Start overview) chooses the routine when the link has none.
  const { page, context } = await open("en");
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:intro",
      JSON.stringify({ band: { pick: "1" }, family: { band: "k-2" } }),
    ),
  );
  await page.reload();
  await page.waitForSelector("#app .tg-page");
  ok(
    (await page.locator(".tg-start").getAttribute("href")).includes("g1-s-a-garden-name"),
    "K–2: the remembered Grade 1 pick chooses the Grade 1 routine",
  );
  await context.close();
}

// 6c. "Hear the steps": a fake speech engine records what is read, in which language, and every cancel.
async function openSpeech(
  lang,
  { locale = "en-US", noSpeech = false, path = "/practice-together" } = {},
) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale });
  await context.addInitScript(
    ([key, l, none]) => {
      try {
        localStorage.setItem(key, JSON.stringify({ lang: l, langChosen: true }));
      } catch {}
      if (none) {
        delete window.speechSynthesis;
        delete window.SpeechSynthesisUtterance;
        return;
      }
      window.__said = [];
      window.__cancels = 0;
      class U {
        constructor(text) {
          this.text = text;
        }
      }
      const voices = [
        { lang: "en-US", name: "English", voiceURI: "en" },
        { lang: "es-US", name: "Español", voiceURI: "es" },
      ];
      Object.defineProperty(window, "SpeechSynthesisUtterance", { value: U, configurable: true });
      Object.defineProperty(window, "speechSynthesis", {
        configurable: true,
        value: {
          getVoices: () => voices,
          addEventListener() {},
          speak(u) {
            window.__said.push({ text: u.text, lang: u.lang });
          },
          cancel() {
            window.__cancels++;
          },
        },
      });
    },
    [PREFS, lang, noSpeech],
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  await page.goto(base + LAB + path, { waitUntil: "load" });
  await page.waitForSelector("#app .tg-page");
  return { page, context };
}
const said = (page) => page.evaluate(() => window.__said);
for (const [lang, locale, wantLang, first] of [
  ["en", "en-US", "en-US", "Look at the example."],
  ["es", "en-US", "es-US", "Miren el ejemplo."],
  ["bi", "es-US", "es-US", "Miren el ejemplo."],
  ["bi", "en-US", "en-US", "Look at the example."],
]) {
  const { page, context } = await openSpeech(lang, { locale });
  const btn = page.locator('[data-tg-read="talk"]');
  ok(await btn.isVisible(), `${lang}/${locale}: Hear the steps is shown`);
  await btn.click();
  const s = await said(page);
  ok(
    s.length === 1 && s[0].lang === wantLang && s[0].text.startsWith(first),
    `${lang}/${locale}: reads step 1 in ${wantLang} (${s[0]?.lang}: ${s[0]?.text.slice(0, 40)})`,
  );
  ok(
    (await btn.getAttribute("aria-pressed")) === "true",
    `${lang}/${locale}: the button shows it is reading`,
  );
  await context.close();
}
{
  const { page, context } = await openSpeech("en");
  await page.click('[data-tg-read="talk"]');
  const before = await page.evaluate(() => window.__cancels);
  await page.click('[data-tg-read="write"]');
  ok(
    (await page.evaluate(() => window.__cancels)) > before &&
      (await page.getAttribute('[data-tg-read="talk"]', "aria-pressed")) === "false" &&
      (await page.getAttribute('[data-tg-read="write"]', "aria-pressed")) === "true",
    "one reading at a time: Write stops Talk",
  );
  const last = (await said(page)).at(-1);
  ok(
    last.text.startsWith("Look at the example. Read the plain sentence"),
    "Write reads its own steps",
  );
  await page.click('[data-tg-read="write"]');
  ok(
    (await page.getAttribute('[data-tg-read="write"]', "aria-pressed")) === "false",
    "pressing again stops",
  );
  await page.click('[data-tg-read="talk"]');
  const n = await page.evaluate(() => window.__cancels);
  await page.locator(".tg-start").first().click();
  await page.waitForURL((u) => u.pathname !== `${LAB}/practice-together`);
  ok((await page.evaluate(() => window.__cancels)) > n, "leaving the page stops the reading");
  await context.close();
}
{
  const { page, context } = await openSpeech("es", { path: "/practice-together?grades=K" });
  await page.click('[data-tg-read="early"]');
  const s = await said(page);
  ok(
    s[0]?.lang === "es-US" && s[0].text.startsWith("Escuchen primero."),
    "K–2 card reads its Spanish steps",
  );
  await context.close();
}
{
  const { page, context } = await openSpeech("en", { noSpeech: true });
  ok(
    (await page.locator("[data-tg-read]").count()) === 2 &&
      (await page.locator("[data-tg-read]:visible").count()) === 0,
    "no speech engine: Hear the steps stays hidden",
  );
  await context.close();
}

// 7. axe WCAG 2.2 AA in each language, desktop and phone, with both sections open.
if (AxeBuilder) {
  for (const [lang, path] of [
    ["en", "/practice-together"],
    ["es", "/practice-together"],
    ["bi", "/practice-together"],
    ["en", "/practice-together?grades=K"],
    ["es", "/practice-together?grades=2-3"],
  ]) {
    for (const width of [1280, 375]) {
      const { page, context } = await open(lang, width, path);
      for (const s of await page.locator(".tg-details > summary").all()) await s.click();
      const res = await new AxeBuilder({ page })
        .include("#app")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      ok(
        res.violations.length === 0,
        `axe ${lang} ${path} ${width}${res.violations.length ? ` — ${res.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}` : ""}`,
      );
      await context.close();
    }
  }
}

ok(
  errors.length === 0,
  `no page or console errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-intro-family-e2e: all checks passed");
