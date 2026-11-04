#!/usr/bin/env node
/**
 * The ACCESS Learning Journey in a real browser, driven the way a student drives it (content-driven: every
 * action is read from the mission packs in src/content/journey/, never from a stored answer).
 *
 *   a  new student, both bands, missions 1 and 8: six steps through the app's own buttons only
 *   b  resume mid-step after a reload, and a support-level change that must keep the work
 *   c  supported finish vs "On my own" show; show offers no supports
 *   d  repeat a step; the map shows states; a review is offered next to a forward action
 *   e  family companion (en / es / bilingual), print, the link to the recommended step
 *   f  Passport "My Journey evidence" and a progress code that restores the journey
 *   g  teacher guide and an assigned link that changes no progress
 *   h  accessibility (axe, keyboard, reduced motion, 375px, touch) and i  speech fallbacks:
 *      tools/lib/access-journey-e2e-a11y.mjs
 *
 *   node tools/access-journey-e2e.mjs [a b c ...]     (serves this working tree; BASE=<url> to point elsewhere)
 *
 * A missing browser is a SKIP locally and a FAIL in CI. One browser, one context at a time.
 */
import * as E from "../access-practice-lab/src/journey/engines/listen.js";
import { recommendNext } from "../access-practice-lab/src/journey/recommend.js";
import { missionStatus } from "../access-practice-lab/src/journey/state.js";
import { a11yAndFallbacks } from "./lib/access-journey-e2e-a11y.mjs";
import * as D from "./lib/access-journey-e2e-drive.mjs";
import {
  JOURNEY_KEY,
  LAB,
  loadTools,
  makeLedger,
  newSession,
  readJourney,
  serve,
} from "./lib/access-journey-e2e-kit.mjs";
import { daysAgo, missionSteps, seedJourney } from "./lib/access-journey-e2e-seed.mjs";

const tools = await loadTools();
if (!tools) {
  console.warn("access-journey-e2e: SKIP - playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const { chromium, AxeBuilder } = tools;
const { failures, ok } = makeLedger();
const only = process.argv.slice(2);
const want = (k) => !only.length || only.includes(k);

let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
} catch (error) {
  console.warn(`access-journey-e2e: SKIP - no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}

const STEPS = ["discover", "understand", "build", "communicate", "improve", "show"];
const NEXT_MISSION = { m01: "m02", m08: "m09" };

/** Finish with the console and network checked, then close the context. */
async function endSession(S, label) {
  ok(
    S.errors.length === 0,
    `${label}: no console or page errors${S.errors.length ? ` - ${S.errors[0]}` : ""}`,
  );
  ok(
    S.failed.length === 0,
    `${label}: no failed requests${S.failed.length ? ` - ${S.failed[0]}` : ""}`,
  );
  await S.context.close();
}

const stepRecord = async (page, band, mission, step) =>
  (await readJourney(page))?.bands?.[band]?.missions?.[mission]?.steps?.[step];

/** The engine work for each step, read from the pack. */
function drivers(page, pack, mission) {
  const comm = (task) =>
    task.kind === "converse" ? D.driveConverse(page, task) : D.driveCompose(page, task);
  return {
    discover: () => D.driveDiscover(page, pack.discover),
    understand: async () => {
      const rep = await D.driveListen(page, E, pack.understand.listen, { miss: true });
      await page.waitForSelector("[data-xr=pick]", { timeout: 15000 });
      const read = await D.driveRead(page, pack.understand.read);
      return { rep, read };
    },
    build: () => D.driveBuild(page, pack.build),
    communicate: () => comm(pack.communicate),
    improve: () => D.driveImprove(page, pack),
    show: () => comm(pack.show),
  };
}

/** a) one new student, one mission, from /journey to the next mission, using only the buttons the app offers. */
async function newStudent(band, mission) {
  const label = `a) new student ${band} ${mission}`;
  const pack = await D.packOf(mission, band);
  const S = await newSession(browser, origin, { band, permissions: ["microphone"] });
  const { page } = S;
  const visited = [];
  page.on(
    "framenavigated",
    (f) => f === page.mainFrame() && visited.push(new URL(f.url()).pathname),
  );
  try {
    await S.go("/journey");
    ok(
      (await page.getByRole("heading", { name: /Start My Learning Journey/ }).count()) > 0,
      `${label}: a new student sees "Start My Learning Journey"`,
    );
    if (mission === "m01")
      await page
        .getByRole("link", { name: /Start Mission 1/ })
        .first()
        .click();
    else {
      await page
        .getByRole("link", { name: /^\s*My Journey Map/ })
        .first()
        .click();
      await page.locator(`a[href*="/journey/${mission}?"]`).first().click();
      await page.locator("[data-journey-go]").first().click();
    }
    await page.waitForSelector(`[data-jr-run][data-jr-step="discover"][data-jr-mode="run"]`, {
      timeout: 15000,
    });
    const run = drivers(page, pack, mission);
    for (const [i, step] of STEPS.entries()) {
      if (step === "show") {
        const offered = await page.evaluate(() =>
          [
            "[data-jt-insert]",
            "[data-jt-help-id]",
            "[data-jt-box]",
            "[data-jt-structure]",
            "[data-jt-ask]",
            "[data-sc-help]",
            "[data-act=xray]",
            "[data-jr-support]",
            "[data-jr-own]",
            ".jt-evidence",
          ].filter((s) => document.querySelector(s)),
        );
        ok(
          offered.length === 0,
          `${label}: show renders no frames, word bank, evidence chips, X-ray, hints or support controls${offered.length ? ` (found ${offered})` : ""}`,
        );
      }
      const out = await run[step]();
      if (step === "understand") {
        const r = out.rep.repair;
        ok(
          r?.fixes > 0 && r.replay && /Not yet/.test(r.text),
          `${label}: a wrong placement replays its sentence and offers another try`,
        );
        ok(
          !out.rep.level2 || (out.rep.level2.caption && out.rep.level2.signal),
          `${label}: a second miss shows the sentence with its signal word`,
        );
        ok(
          out.rep.finalIndependent.xray === false && out.rep.finalIndependent.visuals === false,
          `${label}: the final listening check offers no X-ray and no picture clues`,
        );
        ok(
          out.read.main.wrongClaim && out.read.main.weakWhy,
          `${label}: a wrong claim and a weak sentence each get an explanation`,
        );
      }
      await D.finishStep(page);
      if (step === "build") {
        const b = (await stepRecord(page, band, mission, "build")).data?.build?.result;
        ok(
          b?.modules?.length === pack.build.length && b.modules.every((m) => m.transferOk),
          `${label}: build accepted every module and each transfer item`,
        );
      }
      const rec = await stepRecord(page, band, mission, step);
      const wantStage = step === "show" ? "independent" : "supported";
      ok(
        rec?.status === "done" && rec.stage === wantStage,
        `${label}: ${step} saved as done/${wantStage} (got ${rec?.status}/${rec?.stage})`,
      );
      const next = page.locator("[data-jr-next]");
      ok(
        (await next.count()) === 1 &&
          /\/journey\/m\d\d/.test((await next.getAttribute("href")) || ""),
        `${label}: after ${step} the page offers one explicit next action`,
      );
      if (i < STEPS.length - 1) {
        const info = await D.followTo(page, `/${mission}/${STEPS[i + 1]}`);
        if (info.detour)
          console.log(
            `NOTE ${label}: after ${step} the recommended action was a supportive detour; took the offered way forward`,
          );
      }
    }
    const panel = (await page.locator(".jr-mission-done").innerText()).replace(/\s+/g, " ");
    ok(
      /Mission complete: Shown on my own/.test(panel),
      `${label}: the mission-complete panel says "Shown on my own"`,
    );
    const state = await readJourney(page);
    ok(
      missionStatus(state, band, mission) === "independently-demonstrated",
      `${label}: mission status derives to independently-demonstrated`,
    );
    ok(
      await page.locator("[data-jr-panel=complete] .jr-show-summary").count(),
      `${label}: Before / After / On my own summary is on the page`,
    );
    const nextHref = await page.locator("[data-jr-next]").getAttribute("href");
    ok(
      nextHref.includes(`/${NEXT_MISSION[mission]}/discover`),
      `${label}: the recommended action starts ${NEXT_MISSION[mission]}`,
    );
    await page.locator("[data-jr-next]").click();
    await page.waitForSelector(`[data-jr-run][data-jr-step="discover"][data-jr-mode="run"]`, {
      timeout: 15000,
    });
    ok(
      page.url().includes(`/${NEXT_MISSION[mission]}/discover`),
      `${label}: following it opens ${NEXT_MISSION[mission]} Discover`,
    );
    ok(
      !visited.some(
        (p) => /\/access-practice-lab\/?$/.test(p) || /\/access-practice-lab\/home$/.test(p),
      ),
      `${label}: never visited the lab homepage (${visited.length} app navigations)`,
    );
    // Keep the finished journey for the Passport scenario.
    if (band === "6-8" && mission === "m08") return { S, band };
  } catch (error) {
    ok(false, `${label}: ${error.message.split("\n")[0]}`);
    console.log(
      (
        await page
          .locator("#app")
          .innerText()
          .catch(() => "")
      ).slice(0, 600),
    );
  }
  await endSession(S, label);
  return null;
}

// ── b) resume ─────────────────────────────────────────────────────────────────
async function resume() {
  const band = "6-8";
  const pack = await D.packOf("m08", band);
  const label = "b) resume";
  let S = await newSession(browser, origin, { band });
  const { page } = S;
  try {
    await S.go("/journey/m08/discover");
    const [a, b] = pack.discover.objects;
    for (const o of [a, b])
      await page.locator(`.sc-hot[data-sc-examine="${o.id}"]`).first().click();
    await page.waitForSelector(`.sc-hot[data-sc-examine="${b.id}"].is-seen`, { state: "attached" });
    await page.reload();
    await page.waitForSelector(".sc-hot");
    const seen = await page
      .locator(".sc-hot.is-seen")
      .evaluateAll((els) => els.map((e) => e.dataset.scExamine));
    ok(
      seen.length === 2 && seen.includes(a.id) && seen.includes(b.id),
      `${label}: discover keeps the 2 hotspots I examined after a reload (${seen})`,
    );
    ok(
      (await stepRecord(page, band, "m08", "discover"))?.status === "started",
      `${label}: discover is saved as started`,
    );
    const text = await D.driveDiscover(page, pack.discover, { stopAfter: "draft" });
    const half = text.slice(0, Math.floor(text.length / 2));
    await D.typeInto(page, "[data-sc-draft]", half);
    await page.locator("h1").first().click();
    await page.waitForTimeout(1100);
    await page.reload();
    await page.waitForSelector("[data-sc-draft]");
    ok(
      (await page.locator("[data-sc-draft]").inputValue()) === half,
      `${label}: half an explanation is back in the box after a reload`,
    );
    ok(
      (await page.locator(".sc-hot.is-seen").count()) >= pack.discover.collect,
      `${label}: the examined things are still marked`,
    );
    for (const level of ["B", "C", "A"]) {
      await page.locator(`[data-jr-support="${level}"]`).click();
      await page.waitForFunction(
        (l) =>
          document.querySelector(`[data-jr-support="${l}"]`)?.getAttribute("aria-pressed") ===
          "true",
        level,
      );
      ok(
        (await page.locator("[data-sc-draft]").inputValue()) === half &&
          (await page.locator(".sc-hot.is-seen").count()) >= pack.discover.collect,
        `${label}: switching to support ${level} loses no work`,
      );
    }
    const sup = (await readJourney(page)).bands[band].support;
    ok(sup === "A", `${label}: the support level is saved (${sup})`);

    // listening: two cards placed, reload
    await S.go("/journey/m08/understand");
    const t = E.resolveTask(pack.understand.listen, { final: false });
    for (const row of t.expect.slice(0, 2)) {
      await page.locator(`[data-act="item"][data-item="${row.item}"]`).first().click();
      await page.locator(`[data-act="target"][data-target="${row.target}"]`).first().click();
    }
    await page.waitForFunction(() => document.body.innerText.includes("2 of"));
    await page.reload();
    await page.waitForSelector('[data-act="target"]');
    ok(
      /2 of \d+ cards placed/.test(await page.locator("#app").innerText()),
      `${label}: listening keeps the 2 cards I placed`,
    );
    await page.locator('[data-jr-support="C"]').click();
    await page.waitForTimeout(400);
    ok(
      /2 of \d+ cards placed/.test(await page.locator("#app").innerText()),
      `${label}: changing to Expanding mid-listening keeps the placed cards`,
    );

    // build: half a sentence in the middle of a module
    await S.go("/journey/m08/build");
    await page.locator("[data-cn=start]").click();
    await page.waitForSelector('[data-cn-root][data-phase="try"]');
    const partial = "The yield dropped sharply";
    await D.typeInto(page, "[data-cn-text=draft]", partial);
    await page.waitForTimeout(900);
    await page.reload();
    await page.waitForSelector("[data-cn-text=draft]");
    ok(
      (await page.locator("[data-cn-text=draft]").inputValue()) === partial,
      `${label}: build resumes with my half-written sentence`,
    );
    await page.locator('[data-jr-support="B"]').click();
    await page.waitForTimeout(500);
    ok(
      (await page.locator("[data-cn-text=draft]").inputValue()) === partial,
      `${label}: changing support mid-build keeps the sentence`,
    );

    // reading: the claim I picked survives a reload
    const c = pack.understand.read.challenge;
    await S.go("/journey/m08/understand");
    await endSession(S, label);
    S = await newSession(browser, origin, {
      band,
      seed: seedJourney({
        band,
        steps: [
          {
            m: "m08",
            s: "understand",
            partial: true,
            data: {
              listen: {
                result: {
                  correct: 5,
                  total: 5,
                  tries: 5,
                  supportsUsed: [],
                  finalIndependent: true,
                },
              },
            },
          },
        ],
      }),
    });
    await S.go("/journey/m08/understand");
    await S.page.waitForSelector("[data-xr=pick]");
    await S.page.locator(`[data-xr="pick"][data-sid="${c.claim}"]`).click();
    await S.page.waitForSelector('[data-xr="check"]');
    await S.page.reload();
    await S.page.waitForSelector("[data-xr=pick]");
    ok(
      (await S.page.locator('[data-xr="check"]').count()) === 1,
      `${label}: reading keeps the claim I chose after a reload`,
    );
  } catch (error) {
    ok(false, `${label}: ${error.message.split("\n")[0]}`);
  }
  await endSession(S, label);
}

// ── c) supported vs independent ──────────────────────────────────────────────────
async function supportVsIndependent() {
  const band = "6-8";
  const pack = await D.packOf("m08", band);
  const seed = () =>
    seedJourney({ band, steps: missionSteps("m08", band, 5, { commKind: "converse" }) });
  for (const helped of [true, false]) {
    const label = `c) show ${helped ? "with Word help open" : "with no help"}`;
    const S = await newSession(browser, origin, { band, seed: seed() });
    const { page } = S;
    try {
      await S.go("/journey/m08/show");
      await page.waitForSelector("[data-jt-input], [data-jt-draft]");
      const own = await page.evaluate(
        () =>
          /Show is always on your own/.test(document.body.innerText) &&
          !document.querySelector(
            "[data-jr-support], [data-jr-own], [data-jt-insert], [data-jt-help-id]",
          ),
      );
      ok(
        own,
        `${label}: show says it is on my own and offers no support controls, frames or evidence`,
      );
      if (helped) {
        await page.locator("[data-jr-help-toggle]").click();
        await page.waitForSelector(".jr-help");
        ok(
          /recorded as done with support/.test(await page.locator(".jr-help").innerText()),
          `${label}: opening help says plainly it will count as support`,
        );
      }
      await drivers(page, pack, "m08").show();
      await D.finishStep(page);
      const rec = await stepRecord(page, band, "m08", "show");
      const panel = (await page.locator(".jr-mission-done").innerText()).replace(/\s+/g, " ");
      if (helped) {
        ok(rec.stage === "supported", `${label}: show is saved as supported`);
        ok(
          /Mission complete: Completed with support/.test(panel),
          `${label}: the mission reads "Completed with support"`,
        );
        ok(
          /completed with support/.test(panel) && /repeat Show on your own/i.test(panel),
          `${label}: and offers to repeat Show on my own`,
        );
      } else {
        ok(rec.stage === "independent", `${label}: show is saved as independent`);
        ok(
          /Mission complete: Shown on my own/.test(panel),
          `${label}: the mission reads "Shown on my own"`,
        );
      }
      const status = missionStatus(await readJourney(page), band, "m08");
      ok(
        status === (helped ? "completed-with-support" : "independently-demonstrated"),
        `${label}: derived status ${status}`,
      );
    } catch (error) {
      ok(false, `${label}: ${error.message.split("\n")[0]}`);
    }
    await endSession(S, label);
  }
}

// ── d) revisit and review ───────────────────────────────────────────────────────
async function revisitAndReview() {
  const band = "6-8";
  const label = "d) revisit & review";
  const steps = missionSteps("m01", band, 6, { commKind: "compose", at: daysAgo(30) });
  const show = steps.at(-1);
  show.results = {
    converse: { text: "I told the story in order.", mode: "speak", supportsUsed: [], words: 30 },
  };
  const S = await newSession(browser, origin, {
    band,
    seed: seedJourney({ band, steps, cursor: { mission: "m02", step: "discover" } }),
  });
  const { page } = S;
  try {
    await S.go("/journey/map");
    const text = await page.locator("#app").innerText();
    ok(
      /My World, My Story\s+(Completed with support|Shown on my own|Done with support)?\s*6 of 6 steps/.test(
        text,
      ),
      `${label}: the map shows the finished mission as 6 of 6 steps`,
    );
    ok(
      (await page.locator('a[href*="/journey/m01"]').count()) > 0,
      `${label}: the map links to the finished mission`,
    );
    await S.go("/journey");
    const home = (await page.locator("#app").innerText()).replace(/\s+/g, " ");
    ok(
      /with help in/.test(home) && /Try it on your own/.test(home),
      `${label}: home offers a review with a plain reason (used a feature with help; try it on your own)`,
    );
    ok(
      (await page.locator("[data-journey-go], a.btn-primary").count()) > 0,
      `${label}: a forward action sits beside the review`,
    );
    const st = await readJourney(page);
    const rec = recommendNext(st, band, { ledger: { entries: [] } });
    ok(
      rec.kind === "review" && rec.alternatives.length > 0,
      `${label}: the recommendation is a review with a forward alternative (${rec.kind}, ${rec.alternatives.length} alt)`,
    );
    // repeat a finished step
    await S.go("/journey/m01/communicate");
    await page.waitForSelector("[data-jr-repeat]");
    ok(
      /Your first try stays saved/.test(await page.locator(".jr-redo").innerText()),
      `${label}: a finished step offers Repeat and says my first try stays saved`,
    );
    await page.locator("[data-jr-repeat]").click();
    await page.waitForSelector("[data-jt-draft]");
    const after = await stepRecord(page, band, "m01", "communicate");
    ok(
      after.status === "done" && after.revisits === 1,
      `${label}: repeating keeps it done and counts a revisit (${after.status}, ${after.revisits})`,
    );
    const pack = await D.packOf("m01", band);
    await D.driveCompose(page, pack.communicate);
    await D.finishStep(page);
    const again = await stepRecord(page, band, "m01", "communicate");
    ok(
      again.status === "done" && again.attempts === 2,
      `${label}: finishing the repeat records a second attempt (${again.attempts})`,
    );
    await S.go("/journey/map");
    ok(
      (await page.locator("#app").innerText()).includes("My World, My Story"),
      `${label}: the map still shows the mission after a repeat`,
    );
  } catch (error) {
    ok(false, `${label}: ${error.message.split("\n")[0]}`);
  }
  await endSession(S, label);
}

// ── e) family ────────────────────────────────────────────────────────────────────
async function family() {
  const band = "6-8";
  const steps = missionSteps("m08", band, 2, {});
  const journey = seedJourney({ band, steps, cursor: { mission: "m08", step: "build" } });
  const expect = recommendNext(JSON.parse(journey[JOURNEY_KEY]), band, { ledger: { entries: [] } });
  const modes = {
    en: /Do the next practice together/,
    es: /Hagan juntos la siguiente práctica/,
    bi: null,
  };
  for (const [lang, re] of Object.entries(modes)) {
    const label = `e) family companion m08 (${lang})`;
    const S = await newSession(browser, origin, {
      band,
      seed: {
        ...journey,
        "accessPracticeLab:v1:prefs": JSON.stringify({ langChosen: true, band, lang }),
      },
    });
    const { page } = S;
    try {
      await S.go("/family?mission=m08");
      await page.waitForSelector("[data-print], .jf-actions");
      const text = (await page.locator("#app").innerText()).replace(/\s+/g, " ");
      const htmlLang = await page.evaluate(() => document.documentElement.lang);
      if (lang === "en")
        ok(
          re.test(text) && !/Hagan juntos/.test(text) && htmlLang === "en",
          `${label}: English only, page lang en`,
        );
      if (lang === "es")
        ok(
          re.test(text) && !/Do the next practice together/.test(text) && htmlLang === "es",
          `${label}: Spanish, page lang es`,
        );
      if (lang === "bi")
        ok(
          /Do the next practice together/.test(text) &&
            /Hagan juntos la siguiente práctica/.test(text),
          `${label}: both languages together`,
        );
      ok((await page.locator("[data-print]").count()) === 1, `${label}: print button exists`);
      const link = page
        .locator("a", { hasText: /Do the next practice together|Hagan juntos/ })
        .first();
      const href = (await link.getAttribute("href")) || "";
      ok(
        href.includes(`/journey/${expect.mission}/${expect.step}`),
        `${label}: "next practice" goes to the recommended step ${expect.mission}/${expect.step} (${href.replace(LAB, "")})`,
      );
      if (lang === "en") {
        await link.click();
        await page.waitForSelector(`[data-jr-run][data-jr-step="${expect.step}"]`);
        ok(true, `${label}: the link opens ${expect.step}`);
      }
    } catch (error) {
      ok(false, `${label}: ${error.message.split("\n")[0]}`);
    }
    await endSession(S, label);
  }
}

// ── f) passport ──────────────────────────────────────────────────────────────────
async function passport(played) {
  const band = "6-8";
  const label = "f) passport";
  const base = await newSession(browser, origin, { band });
  let baseline = [];
  try {
    await base.go("/passport");
    baseline = await base.page.locator("#app h2").allInnerTexts();
  } catch (error) {
    ok(false, `${label}: baseline passport - ${error.message.split("\n")[0]}`);
  }
  await endSession(base, `${label} baseline`);
  // The 6-8 / m08 context left by scenario a holds a journey made by real play (ledger included); play one if absent.
  const S = played?.S || (await newStudent(band, "m08"))?.S;
  try {
    const { page } = S;
    await S.go("/passport");
    await page.waitForSelector("#journeyEvidence");
    const evidence = (await page.locator("#journeyEvidence").innerText()).replace(/\s+/g, " ");
    ok(/My Journey evidence/.test(evidence), `${label}: "My Journey evidence" is on the Passport`);
    ok(
      /Before and after/i.test(evidence) &&
        (await page.locator("#journeyEvidence .mr-gcard").count()) > 0 &&
        !/appear here after you finish/.test(evidence),
      `${label}: it shows a real Before and After card from the work just done`,
    );
    const heads = await page.locator("#app h2").allInnerTexts();
    ok(
      baseline.every((h) => heads.includes(h)),
      `${label}: every existing Passport section is still there (${baseline.length} headings)`,
    );
    const before = await readJourney(page);
    await page.locator("[data-export]").click();
    await page.waitForFunction(
      () => document.querySelector("[data-import-text]")?.value?.startsWith("ACCESS1"),
      null,
      { timeout: 15000 },
    );
    const code = await page.locator("[data-import-text]").inputValue();
    ok(code.length > 200, `${label}: the progress code is exported (${code.length} chars)`);
    await endSession(S, label);
    const fresh = await newSession(browser, origin, { band });
    await fresh.go("/passport");
    ok(!(await readJourney(fresh.page)), `${label}: the fresh context starts with no journey`);
    await fresh.page.locator("[data-import-text]").fill(code);
    await fresh.page.locator("[data-import]").click();
    await fresh.page.waitForFunction((k) => localStorage.getItem(k), JOURNEY_KEY, {
      timeout: 15000,
    });
    const restored = await readJourney(fresh.page);
    const pick = (j) =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(j.bands[band].missions.m08.steps).map(([k, v]) => [
            k,
            [v.status, v.stage],
          ]),
        ),
      );
    ok(
      pick(restored) === pick(before),
      `${label}: importing the code restores every step's state and stage`,
    );
    await fresh.go("/passport");
    await fresh.page.waitForSelector("#journeyEvidence");
    ok(true, `${label}: the restored Passport shows My Journey evidence`);
    await endSession(fresh, `${label} restore`);
    return;
  } catch (error) {
    ok(false, `${label}: ${error.message.split("\n")[0]}`);
  }
  await S.context.close().catch(() => {});
}

// ── g) teacher ───────────────────────────────────────────────────────────────────
async function teacher() {
  const band = "6-8";
  const label = "g) teacher";
  const steps = missionSteps("m08", band, 2, {});
  const S = await newSession(browser, origin, { band, seed: seedJourney({ band, steps }) });
  const { page } = S;
  try {
    await S.go("/journey/guide");
    ok(
      (await page.locator("h1").count()) === 1 &&
        /guide|teacher|mission/i.test(await page.locator("h1").innerText()),
      `${label}: the guide renders with one h1`,
    );
    ok(
      (await page.locator('a[href*="/journey/m08/"]').count()) > 0,
      `${label}: the guide has direct links to mission steps`,
    );
    const before = await readJourney(page);
    await S.go("/journey/m08/communicate?assigned=1");
    await page.waitForSelector('[data-jr-run][data-jr-step="communicate"]');
    ok(
      (await page.locator("[data-jt-input]").count()) === 1,
      `${label}: the assigned link opens the step`,
    );
    const after = await readJourney(page);
    ok(
      after.bands[band].assigned?.mission === "m08" &&
        after.bands[band].assigned?.step === "communicate",
      `${label}: the step is recorded as teacher-assigned`,
    );
    const strip = (j) =>
      JSON.stringify(
        Object.values(j.bands[band].missions.m08.steps)
          .map((s) => [s.status, s.stage, s.attempts])
          .slice(0, 2),
      );
    ok(strip(before) === strip(after), `${label}: other progress (finished steps) is unchanged`);
  } catch (error) {
    ok(false, `${label}: ${error.message.split("\n")[0]}`);
  }
  await endSession(S, label);
}

// ── run ─────────────────────────────────────────────────────────────────────────
let kept = null;
try {
  if (want("a")) {
    for (const band of ["3-5", "6-8"])
      for (const mission of ["m01", "m08"]) {
        const res = await newStudent(band, mission);
        if (res) kept = res;
      }
  }
  if (want("b")) await resume();
  if (want("c")) await supportVsIndependent();
  if (want("d")) await revisitAndReview();
  if (want("e")) await family();
  if (want("f")) await passport(kept);
  else if (kept) await kept.S.context.close();
  if (want("g")) await teacher();
  if (want("h") || want("i")) await a11yAndFallbacks({ browser, origin, AxeBuilder, ok, only });
} finally {
  await browser.close();
  server?.close();
}
console.log(
  failures.length
    ? `\n${failures.length} check(s) FAILED`
    : "\nAll Learning Journey browser checks passed.",
);
process.exit(failures.length ? 1 : 0);
