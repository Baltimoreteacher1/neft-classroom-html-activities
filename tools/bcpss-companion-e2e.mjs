#!/usr/bin/env node
// bcpss-companion-e2e — the Plan & Respond tab on /bcpss-teachers/, driven the way a teacher drives it, in Chromium
// against the source tree plus the real unit data. At 1366px and 390px:
//   Unit map (goals, sequence, resource groups) · Build a set (purpose, level, fade, print) · Check work (shows
//   observations vs things to check, name warning, nothing sent over the network) · Reteach plan (both pathways, print)
// plus no horizontal scroll, 44px targets on controls, axe WCAG A/AA serious+critical = 0, and no console errors.
// Exits 3 (SKIP) when Chromium is unavailable.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { GROUPS } from "../bcpss-teachers/companion/companion-data.js";
import { NEW_VIEWS } from "../bcpss-teachers/companion/views-registry.js";
import { listUnits } from "../functions/_lib/bcpss/db.js";
import { startStudioServer } from "./lib/bcpss-studio-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNIT = "g6-math-u2";
const results = [];
const GROUP_OF = {
  map: "teach",
  build: "language",
  check: "assess",
  reteach: "assess",
  ...Object.fromEntries(NEW_VIEWS.map((v) => [v.id, v.group])),
};
/** Open a view the way a teacher does: its section tab, then the view. */
async function openView(page, id) {
  await page.click(`[data-cp-group="${GROUP_OF[id]}"]`);
  await page.click(`.cp-nav [data-cp-view="${id}"]`);
}
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : ` — ${detail}`}`);
};

const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (err) {
  process.exit(
    skipExit(
      `Chromium unavailable (${err.message.split("\n")[0]})`,
      "Install Playwright Chromium or set PW_CHROMIUM_PATH.",
    ),
  );
}
const server = await startStudioServer(ROOT);
const detail = await server.detailFor(UNIT);
const axeSource = readFileSync(resolve(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");

async function run(width, label) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
    // The page registers an offline service worker; requests it serves bypass page.route and hit the bare test server.
    serviceWorkers: "block",
    acceptDownloads: true,
  });
  const page = await context.newPage();
  const errors = [];
  const writes = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  page.on(
    "request",
    (r) =>
      r.method() !== "GET" && /\/api\//.test(r.url()) && writes.push(`${r.method()} ${r.url()}`),
  );
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/bcpss/units") {
      const { units } = await listUnits(
        {},
        url.searchParams.get("grade"),
        url.searchParams.get("subject"),
      );
      return route.fulfill({
        json: {
          grade: url.searchParams.get("grade"),
          subject: url.searchParams.get("subject"),
          units,
        },
      });
    }
    if (/^\/api\/bcpss\/units\/[^/]+$/.test(url.pathname)) return route.continue();
    return route.fulfill({ status: 200, json: {} });
  });
  await page.goto(`${server.origin}/bcpss-teachers/?unit=${UNIT}&tab=plan`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector(".cp .cp-question", { timeout: 20000 });
  const T = (s) => `[${label}] ${s}`;

  // Unit map
  const q = await page.textContent(".cp-question");
  check(T("map shows the unit's big question"), q.trim() === detail.studio.essential_question, q);
  check(
    T("map shows content and language goals"),
    (await page.textContent(".cp-goals")).includes(detail.studio.can_do.language),
  );
  await page.waitForSelector(".cp-seq-card[data-cp-unit]", { timeout: 20000 }).catch(() => {});
  const nextCard = await page.$$eval(".cp-seq-card[data-cp-unit]", (els) =>
    els.map((e) => e.dataset.cpUnit),
  );
  check(T("map links the neighbouring unit"), nextCard.includes("g6-math-u3"), nextCard.join(","));
  const groups = await page.$$eval(".cp-group h4", (els) =>
    els.map((e) => e.textContent.replace(/\d+$/, "").trim()),
  );
  check(
    T("map groups resources into the six teacher groups"),
    groups.length >= 5 && groups.includes("Teach and explain"),
    groups.join("|"),
  );

  // Build a set
  await openView(page, "build");
  await page.click('[data-cp-purpose="vocab"]');
  const rows = await page.$$eval(".cp-set .cp-item", (els) => els.length);
  const picked = await page.$$eval(".cp-set .cp-check:checked", (els) => els.length);
  check(
    T("vocabulary purpose assembles a set with defaults picked"),
    rows >= 5 && picked >= 3 && picked <= 5,
    `${rows}/${picked}`,
  );
  await page.click(".cp-set .cp-check:checked");
  check(
    T("unchecking an item sticks across a redraw"),
    (await page.$$eval(".cp-set .cp-check:checked", (e) => e.length)) === picked - 1,
  );
  const before = await page.textContent(".cp-preview");
  await page.click('[data-cp-level="1_2"]');
  await page.click('[data-cp-fade="2"]');
  const after = await page.textContent(".cp-preview");
  check(
    T("fading to word bank removes frames from the preview"),
    before !== after && /only the word bank/.test(after),
    after.slice(0, 200),
  );
  check(
    T("level and fade selections show pressed state"),
    (await page.getAttribute('[data-cp-fade="2"]', "aria-pressed")) === "true" &&
      (await page.getAttribute('[data-cp-level="1_2"]', "aria-pressed")) === "true",
  );
  await page.click('[data-cp-fade="0"]');
  const [pop] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-print="support"]'),
  ]);
  await pop.waitForLoadState("domcontentloaded");
  const popText = await pop.textContent("body");
  check(
    T("support sheet opens as a printable page with the unit's words"),
    /Language Support/.test(popText) &&
      popText.includes(detail.studio.vocab[0].term) &&
      popText.includes(detail.studio.essential_question),
  );
  await pop.close();

  // Check work
  await openView(page, "check");
  await page.fill("#cpText", detail.studio.exit_ticket.model);
  const before404 = writes.length;
  await page.click("[data-cp-analyze]");
  const shown = await page.textContent(".cp-result");
  check(
    T("check work separates what it shows from things to check"),
    /What the work shows/.test(shown) && /Things to check/.test(shown) && /guesses/.test(shown),
  );
  check(
    T("model answer includes every number"),
    /every number in the model/.test(shown),
    shown.slice(0, 300),
  );
  await page.fill("#cpText", "My name is Ana. 2 and 5 is 7");
  await page.click("[data-cp-analyze]");
  check(
    T("a name in the text raises a privacy warning"),
    (await page.textContent(".cp-result")).includes("may contain a name"),
  );
  const full = await page.textContent(".cp-check-view");
  check(
    T("check work never states a level, score or diagnosis"),
    !/proficien|disabilit|\bscore of|level [1-6]\b/i.test(full),
    full.slice(0, 200),
  );
  check(
    T("check work sends nothing over the network"),
    writes.length === before404 && writes.length === 0,
    writes.join(","),
  );
  const [slip] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-print="slip"]'),
  ]);
  await slip.waitForLoadState("domcontentloaded");
  const slipText = await slip.textContent("body");
  check(
    T("feedback slip carries strengths and a fresh task, not analysis notes"),
    /What you did well/.test(slipText) &&
      /Try a new one/.test(slipText) &&
      !/Things to check/.test(slipText),
  );
  await slip.close();

  // Reteach
  await openView(page, "reteach");
  check(T("reteach plan has eight steps"), (await page.$$eval(".cp-step", (e) => e.length)) === 8);
  const contentModel = await page.textContent(".cp-step:nth-child(3)");
  await page.click('[data-cp-pathway="language"]');
  const languageModel = await page.textContent(".cp-step:nth-child(3)");
  check(
    T("content and language pathways differ at the model step"),
    contentModel !== languageModel && /Take apart|mentor|Ask:/.test(languageModel),
    languageModel.slice(0, 160),
  );
  const [plan] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-print="reteach"]'),
  ]);
  await plan.waitForLoadState("domcontentloaded");
  check(
    T("reteach plan prints with all steps"),
    (await plan.$$eval(".step", (e) => e.length)) === 8,
  );
  await plan.close();

  // Grouped navigation
  const groupLabels = await page.$$eval("[data-cp-group]", (els) =>
    els.map((e) => e.firstChild.textContent.trim()),
  );
  check(
    T("views sit under the six teacher sections, one section open at a time"),
    groupLabels.length === 6 &&
      groupLabels[0] === "Teach and explain" &&
      groupLabels.includes("Writing and projects") &&
      (await page.$$eval(".cp-nav .cp-view", (e) => e.length)) < 8,
    groupLabels.join("|"),
  );

  // Read together
  await openView(page, "text");
  await page.waitForSelector(".cp-passage");
  await page.click('[data-cp-act="text:next"]');
  check(
    T("read together: one sentence is current and a thinking prompt shows"),
    (await page.$$eval(".cp-sent--now", (e) => e.length)) === 1 &&
      /Stop and think/.test(await page.textContent(".cp-text")),
  );
  await page.click('[data-cp-act="text:word"]');
  check(
    T("read together: a unit word shows its meaning"),
    /Example:/.test(await page.textContent(".cp-text .cp-say")),
  );
  const q0 = detail.reading.questions[0];
  await page.click(`[data-cp-act="text:ans"][data-cp-arg="0:${q0.answer}"]`);
  check(
    T("read together: a right answer is confirmed"),
    /Yes\./.test(await page.textContent(".cp-text")),
  );
  await page.click('[data-cp-act="text:ev"][data-cp-arg="0"]');
  check(
    T("read together: evidence is highlighted in the text"),
    (await page.$$eval("mark.cp-ev", (e) => e.length)) >= 1,
  );
  const [rd] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-act="text:print"]'),
  ]);
  await rd.waitForLoadState("domcontentloaded");
  check(
    T("read together: the reading sheet prints with a teacher key"),
    /Teacher key/.test(await rd.textContent("body")),
  );
  await rd.close();

  // Word cards
  await openView(page, "words");
  check(
    T("word cards: six pieces on the card"),
    (await page.$$eval(".cp-frayer .cp-piece", (e) => e.length)) === 6,
  );
  await page.click('[data-cp-act="words:step"]');
  const hidden1 = await page.$$eval(".cp-piece--hidden", (e) => e.length);
  await page.click('[data-cp-act="words:step"]');
  const hidden2 = await page.$$eval(".cp-piece--hidden", (e) => e.length);
  check(
    T("word cards: pieces appear one at a time"),
    hidden1 === 5 && hidden2 === 4,
    `${hidden1}/${hidden2}`,
  );
  const [wc] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-act="words:print"][data-cp-arg="blank"]'),
  ]);
  await wc.waitForLoadState("domcontentloaded");
  check(
    T("word cards: blank cards print"),
    (await wc.$$eval(".card", (e) => e.length)) === detail.studio.vocab.length,
  );
  await wc.close();

  // Virtual lab (math ratio, then the model-sentence builder)
  await openView(page, "labs");
  const rects0 = await page.$$eval("svg.cp-svg rect", (e) => e.length);
  await page.click('[data-cp-act="labs:inc"][data-cp-arg="a"]');
  const rects1 = await page.$$eval("svg.cp-svg rect", (e) => e.length);
  check(T("ratio lab: more in A draws more blocks"), rects1 === rects0 + 2, `${rects0}->${rects1}`);
  await page.click('[data-cp-act="labs:inc"][data-cp-arg="k"]');
  check(
    T("ratio lab: another group adds a table row"),
    (await page.$$eval(".cp-table tbody tr", (e) => e.length)) === 3,
  );
  await page.click('[data-cp-act="labs:lab"][data-cp-arg="mentor"]');
  await page.click('[data-cp-act="labs:mcheck"]');
  check(
    T("model sentence: checking an unsorted order does not reveal the answer"),
    /Not all parts are in place|In place/.test(await page.textContent(".cp-labs")),
  );

  // Four-domain practice
  await openView(page, "practice");
  await page.click('[data-cp-act="practice:domain"][data-cp-arg="reading"]');
  check(
    T("practice: reading domain shows the passage"),
    (await page.$$eval(".cp-passage", (e) => e.length)) === 1,
  );
  const [pr] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-act="practice:print"][data-cp-arg="student"]'),
  ]);
  await pr.waitForLoadState("domcontentloaded");
  const prText = await pr.textContent("body");
  check(
    T("practice: the student set prints all four domains and says it is not an ACCESS test"),
    ["Listening", "Speaking", "Reading", "Writing"].every((d) => prText.includes(d)) &&
      /Not an ACCESS test/.test(prText),
  );
  await pr.close();

  // Station rotation and spiral warm-up
  await openView(page, "stations");
  const rows4 = await page.$$eval(".cp-table tbody tr", (e) => e.length);
  await page.click('[data-cp-act="stations:n"][data-cp-arg="3"]');
  const rows3 = await page.$$eval(".cp-table tbody tr", (e) => e.length);
  check(
    T("stations: the rotation chart follows the station count"),
    rows4 === 4 && rows3 === 3,
    `${rows4}/${rows3}`,
  );
  await openView(page, "quick");
  await page.click('[data-cp-act="quick:ans"][data-cp-arg="0:0"]');
  check(
    T("spiral warm-up: an answer gets feedback"),
    (await page.$$eval(".cp-quick .cp-note[role=status]", (e) => e.length)) === 1,
  );

  // Transform a text
  await openView(page, "transform");
  await page.fill("#cpTx", detail.reading.texts["3_4"]);
  await page.click('[data-cp-act="transform:run"]');
  const tr = await page.textContent(".cp-transform .cp-result");
  check(
    T("transform: numbered sentences and unit words come back"),
    /Numbered sentences/.test(tr) && /Unit words found/.test(tr) && /Reading load/.test(tr),
  );
  const [tp] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-act="transform:print"]'),
  ]);
  await tp.waitForLoadState("domcontentloaded");
  check(T("transform: the student copy prints"), /Reading copy/.test(await tp.textContent("body")));
  await tp.close();

  // Cross-subject project
  await openView(page, "projects");
  await page.waitForFunction(
    () => document.querySelector("#cpPartner option[value='g6-sci-u4']"),
    null,
    { timeout: 8000 },
  );
  await page.selectOption("#cpPartner", "g6-sci-u4");
  await page.waitForSelector(".cp-card--lead", { timeout: 8000 });
  const lead = await page.textContent(".cp-card--lead");
  check(
    T("project: an authored connection is labelled authored"),
    /Authored connection/.test(lead),
    lead.slice(0, 120),
  );
  const [pj] = await Promise.all([
    context.waitForEvent("page"),
    page.click('[data-cp-act="projects:print"][data-cp-arg="teacher"]'),
  ]);
  await pj.waitForLoadState("domcontentloaded");
  check(
    T("project: the teacher plan prints the five days"),
    /Five days/.test(await pj.textContent("body")),
  );
  await pj.close();

  // Guess my word
  await openView(page, "guess");
  const c1 = await page.$$eval(".cp-clue", (e) => e.length);
  await page.click('[data-cp-act="guess:clue"]');
  const c2 = await page.$$eval(".cp-clue", (e) => e.length);
  check(T("guess my word: clues appear one at a time"), c1 === 1 && c2 === 2, `${c1}/${c2}`);
  await page.click('[data-cp-act="guess:got"]');
  const stars = await page.textContent(".cp-stars");
  check(
    T("guess my word: a class guess earns stars and reveals the word"),
    /★ [1-9]/.test(stars) && (await page.$$eval(".cp-reveal", (e) => e.length)) === 1,
    stars,
  );
  await page.click('[data-cp-act="guess:next"]');
  check(
    T("guess my word: next word starts with one clue"),
    (await page.$$eval(".cp-clue", (e) => e.length)) === 1,
  );

  // Today's lesson
  await openView(page, "day");
  const sum = async () =>
    (await page.$$eval(".cp-day .cp-step-head span", (e) => e.map((x) => x.textContent))).at(-1);
  const end45 = await sum();
  await page.click('[data-cp-act="day:min"][data-cp-arg="60"]');
  const end60 = await sum();
  check(
    T("today's lesson: steps fill 45 or 60 minutes"),
    /–45 min/.test(end45) && /–60 min/.test(end60),
    `${end45} / ${end60}`,
  );
  await page.click('.cp-day [data-cp-view="text"]');
  check(
    T("today's lesson: a step opens its view"),
    (await page.getAttribute('[data-cp-view="text"]', "aria-pressed")) === "true",
  );

  // Present mode
  await openView(page, "practice");
  await page.click('[data-cp-present="on"]');
  const presentOk = await page.evaluate(() => {
    const root = document.querySelector(".cp--present");
    const visible = (sel) => [...root.querySelectorAll(sel)].some((e) => e.offsetParent);
    return (
      Boolean(root) &&
      !visible(".cp-teacher") &&
      !visible('[data-cp-act$=":print"]') &&
      !document.querySelector(".cp--present .cp-vgroups")
    );
  });
  check(T("present mode hides teacher notes, print buttons and navigation"), presentOk);
  await page.keyboard.press("Escape");
  check(
    T("Escape leaves present mode and returns focus"),
    (await page.$$eval(".cp--present", (e) => e.length)) === 0 &&
      (await page.evaluate(() => document.activeElement?.dataset.cpPresent)) === "on",
  );

  // Word match, four corners, routine, week, tally
  await openView(page, "match");
  const deck = await page.$$eval(".cp-mcard", (e) => e.map((b) => b.getAttribute("aria-label")));
  check(
    T("word match: twelve face-down cards"),
    deck.length === 12 && deck.every((l) => /face down/.test(l)),
  );
  await page.click('[data-cp-act="match:flip"][data-cp-arg="0"]');
  await page.click('[data-cp-act="match:flip"][data-cp-arg="1"]');
  check(
    T("word match: two cards turn over and the result is announced"),
    (await page.$$eval(".cp-mcard--up", (e) => e.length)) >= 2 &&
      /pair|match/i.test(await page.textContent(".cp-match [role=status]")),
  );
  await openView(page, "corners");
  const s1 = await page.textContent(".cp-corners .cp-question");
  await page.click('[data-cp-act="corners:next"]');
  check(
    T("four corners: next statement and four corners shown"),
    s1 !== (await page.textContent(".cp-corners .cp-question")) &&
      (await page.$$eval(".cp-corner", (e) => e.length)) === 4,
  );
  await openView(page, "routine");
  await page.click('[data-cp-act="routine:next"]');
  check(
    T("language routine: steps advance"),
    (await page.textContent(".cp-routine .cp-dot--now")).trim() === "2",
  );
  await openView(page, "week");
  check(T("this week: five days"), (await page.$$eval(".cp-week .cp-card", (e) => e.length)) === 5);
  await page.click('.cp-week [data-cp-view="corners"]');
  check(
    T("this week: a day's section opens its view"),
    (await page.getAttribute('[data-cp-view="corners"].cp-view', "aria-pressed")) === "true",
  );
  await openView(page, "tally");
  for (let k = 0; k < 3; k++) await page.click('[data-cp-act="tally:inc"][data-cp-arg="notyet"]');
  await page.click('[data-cp-act="tally:inc"][data-cp-arg="got"]');
  check(
    T("tally: counts drive the suggested next step"),
    /reteach/i.test(await page.textContent(".cp-tally")) &&
      (await page.$$eval(".cp-tallybar span", (e) => e.length)) === 2,
  );

  // Diagrams
  await openView(page, "map");
  check(
    T("map: the at-a-glance chart is drawn and labelled"),
    (await page.$$eval('svg.cp-svg[aria-label^="Activities in this unit"]', (e) => e.length)) ===
      1 && (await page.$$eval(".cp-tile", (e) => e.length)) === 5,
  );
  await openView(page, "words");
  check(
    T("word cards: the Frayer diagram has its connecting lines"),
    (await page.$$eval(".cp-frayer-lines line", (e) => e.length)) === 4,
  );
  if (width > 640) {
    const hit = await page.evaluate(() => {
      const core = document.querySelector(".cp-frayer-core").getBoundingClientRect();
      return [
        ...document.querySelectorAll(
          ".cp-frayer-quad .cp-piece:not(.cp-frayer-core) p, .cp-frayer-quad .cp-piece h5",
        ),
      ].filter((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return [...range.getClientRects()].some(
          (r) =>
            r.right > core.left &&
            r.left < core.right &&
            r.bottom > core.top &&
            r.top < core.bottom,
        );
      }).length;
    });
    check(
      T("word cards: the centre circle covers none of the text"),
      hit === 0,
      `${hit} text runs overlap`,
    );
  }
  await openView(page, "stations");
  const ring1 = await page.getAttribute("svg.cp-svg--ring", "aria-label");
  await page.click('[data-cp-act="stations:round"][data-cp-arg="1"]');
  const ring2 = await page.getAttribute("svg.cp-svg--ring", "aria-label");
  check(
    T("stations: the ring diagram changes with the round"),
    ring1 !== ring2 && /Round 2/.test(ring2),
    ring2,
  );
  await openView(page, "projects");
  await page.waitForSelector(".cp-svg--venn", { timeout: 8000 });
  const outside = await page.evaluate(() => {
    const svg = document.querySelector("svg.cp-svg--venn");
    const box = svg.getBoundingClientRect();
    return [...svg.querySelectorAll("text")].filter((t) => {
      const r = t.getBoundingClientRect();
      return (
        r.left < box.left - 1 ||
        r.right > box.right + 1 ||
        r.top < box.top - 1 ||
        r.bottom > box.bottom + 1
      );
    }).length;
  });
  check(
    T("project: the Venn diagram keeps every word inside its picture"),
    outside === 0,
    `${outside} outside`,
  );
  await openView(page, "text");
  check(
    T("read together: the sentence strip marks the current sentence"),
    (await page.$$eval(".cp-strip .cp-dot--now", (e) => e.length)) === 1,
  );

  // Layout, targets, axe, keyboard
  for (const view of [
    "map",
    "build",
    "check",
    "reteach",
    "text",
    "words",
    "labs",
    "practice",
    "stations",
    "quick",
    "transform",
    "projects",
    "guess",
    "day",
    "match",
    "corners",
    "routine",
    "week",
    "tally",
  ]) {
    await openView(page, view);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    check(T(`${view}: no horizontal scroll`), overflow <= 0, `${overflow}px`);
    const clipped = await page.$$eval(
      ".cp-view, .cp-chip",
      (els) =>
        els.filter(
          (e) =>
            e.offsetParent &&
            e.getBoundingClientRect().right > document.documentElement.clientWidth + 1,
        ).length,
    );
    check(T(`${view}: no control sits off the right edge`), clipped === 0, `${clipped} clipped`);
    const small = await page.$$eval(".cp button, .cp a.cp-btn, .cp select, .cp .cp-check", (els) =>
      els
        .filter(
          (e) =>
            e.offsetParent &&
            (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5),
        )
        .map((e) => `${e.className}:${Math.round(e.getBoundingClientRect().height)}`),
    );
    check(
      T(`${view}: controls are at least 44px`),
      small.length === 0,
      small.slice(0, 4).join(" "),
    );
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document.querySelector("#panel-plan"), {
        runOnly: ["wcag2a", "wcag2aa", "wcag22aa"],
      });
      return r.violations
        .filter((v) => ["serious", "critical"].includes(v.impact))
        .map((v) => `${v.id}:${v.nodes.length}`);
    });
    check(T(`${view}: axe serious/critical = 0`), axe.length === 0, axe.join(","));
  }
  await openView(page, "map");
  await page.focus('[data-cp-group="language"]');
  await page.keyboard.press("Enter");
  const groupKept =
    (await page.getAttribute('[data-cp-group="language"]', "aria-pressed")) === "true" &&
    (await page.evaluate(() => document.activeElement?.dataset.cpGroup)) === "language";
  await page.focus('.cp-nav [data-cp-view="build"]');
  await page.keyboard.press("Enter");
  check(
    T("keyboard: Enter opens a section, then a view, and focus stays put"),
    groupKept &&
      (await page.getAttribute('.cp-nav [data-cp-view="build"]', "aria-pressed")) === "true" &&
      (await page.evaluate(() => document.activeElement?.dataset.cpView)) === "build",
  );
  await openView(page, "guess");
  await page.click('[data-cp-present="on"]');
  const clues0 = await page.$$eval(".cp-clue", (e) => e.length);
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("PageDown");
  const clues2 = await page.$$eval(".cp-clue", (e) => e.length);
  check(
    T("present mode: arrow keys and clicker keys step forward"),
    clues2 === clues0 + 2,
    `${clues0}->${clues2}`,
  );
  await page.keyboard.press("Escape");
  check(T("no console or page errors"), errors.length === 0, errors.slice(0, 3).join(" | "));
  await context.close();
}

try {
  await run(1366, "desktop");
  await run(390, "phone");
} finally {
  await browser.close();
  await server.close();
}
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
