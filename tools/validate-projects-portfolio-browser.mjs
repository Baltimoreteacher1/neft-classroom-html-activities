#!/usr/bin/env node
/**
 * validate-projects-portfolio-browser.mjs — /math/projects/portfolio/ and the Studio completion
 * record, driven the way a student drives them, against data/project-registry.json.
 *
 *   - one card per registry project, in registry order, under its CURRENT unit; counts derive from
 *     the registry; every resume/launch link equals the registry URL byte for byte
 *   - seeded device storage: Studio completion, Studio save, classic Save/Resume record, legacy
 *     completion map, reflections. Status, artifacts, tiles and certificate buttons recounted
 *     independently from the seeds; raw field text and the saved student name never appear
 *   - a certificate exists only for a real, valid completion record (none, partial, invalid and
 *     tampered records all produce nothing); it prints alone on one landscape page
 *   - the Studio writes the v1 record only when the student presses the button on ready work;
 *     never for partial work, teacher view or the exemplar; every existing key is left byte for byte
 *   - the page never writes project data; blocked storage and script off still work
 *   - 1440 / 820 / 390: no sideways scroll, 44px targets, keyboard, reduced motion, axe WCAG A/AA/2.2
 *   - no console errors
 * Serves the SOURCE tree. A missing browser is a SKIP (3 locally, 1 in CI), never a pass.
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { createRequire } from "node:module";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve("axe-core/axe.min.js");
const load = (path) => import(pathToFileURL(join(ROOT, path)).href);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  process.exit(skipExit("playwright is not installed"));
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(ROOT, p.endsWith("/") ? `${p}index.html` : p);
  const pub = join(ROOT, "public", p);
  if (!existsSync(file) && existsSync(pub) && statSync(pub).isFile()) file = pub;
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
const PORTFOLIO = "/math/projects/portfolio/";

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  server.close();
  process.exit(
    skipExit(
      `no browser (${error.message.split("\n")[0]})`,
      "Set PW_CHROMIUM_PATH or run: npx playwright install chromium",
    ),
  );
}

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const harmless = (text) => /web-vitals|ERR_ABORTED|Failed to load resource/.test(text);

/* --- the expected world, from the data and never from the page ------------------------ */
const registry = JSON.parse(readFileSync(join(ROOT, "data/project-registry.json"), "utf8"));
const { UNIT_NAMES } = await load("curriculum/projects/studio/projects.mjs");
const seed = await load("tools/lib/projects-portfolio-seed.mjs");
const { SELF_CHECK_ITEMS, completeKeyFor, validateCompletionRecord } = await load(
  "curriculum/projects/studio/completion.mjs",
);
const unitLabel = (n) => (n === 0 ? UNIT_NAMES[0] : `Unit ${n} · ${UNIT_NAMES[n]}`);
const regById = new Map(registry.projects.map((p) => [p.id, p]));
const units = [...new Set(registry.projects.map((p) => p.unit))].sort((a, b) => a - b);
const hasPage = (p) => p.launchUrl !== p.studioUrl;
/** The page lists each unit's projects together; inside a unit the registry order holds. */
const pageOrder = [...registry.projects].sort((a, b) => a.unit - b.unit);

/* --- seeds ----------------------------------------------------------------------------- */
const DONE = "unit-4-a"; // Studio completion record
const WIP = "unit-4-b"; // Studio save, not finished
const STUDIO_ONLY = "discovery"; // Studio completion on a mission with no classic page
const CLASSIC_WIP = "unit-3-a"; // shared Save/Resume record + reflections
const LEGACY_DONE = "unit-5-a"; // legacy completion map entry
const [, doneJson, doneRecord] = seed.completionEntry(DONE, "DoneSeed");
const [, onlyJson] = seed.completionEntry(STUDIO_ONLY, "OnlySeed");
const wip = seed.startedState(WIP);
const classicPath = regById.get(CLASSIC_WIP).launchUrl;
const legacyPath = regById.get(LEGACY_DONE).launchUrl;
const REFLECT = {
  r1: "The math showed me that unit rates make a fair comparison.",
  r3: "I could use this at the store.",
};
const SEEDS = [
  [completeKeyFor(DONE), doneJson],
  [completeKeyFor(STUDIO_ONLY), onlyJson],
  seed.studioSave(WIP, wip.state),
  seed.classicRecord(classicPath, { percent: 55, answers: 6 }),
  seed.legacyCompletionMap([[legacyPath, { title: "Dream Room Designer" }]]),
  [`nt-project-reflect:${classicPath}`, JSON.stringify(REFLECT)],
  ["nt-student-name", "Maya R."],
];
const EXPECT_STATUS = Object.fromEntries(registry.projects.map((p) => [p.id, "not-started"]));
Object.assign(EXPECT_STATUS, {
  [DONE]: "complete",
  [STUDIO_ONLY]: "complete",
  [LEGACY_DONE]: "complete",
  [WIP]: "in-progress",
  [CLASSIC_WIP]: "in-progress",
});
const doneUnits = new Set(
  Object.entries(EXPECT_STATUS)
    .filter(([, s]) => s === "complete")
    .map(([id]) => regById.get(id).unit),
);

/* --- browser helpers ------------------------------------------------------------------- */
async function visit(page, target) {
  try {
    await page.goto(target, { waitUntil: "networkidle" });
  } catch (error) {
    if (!/ERR_ABORTED/.test(error.message)) throw error;
    await page.goto(target, { waitUntil: "networkidle" });
  }
}
/** `items` are seeded once per context (a reload must not undo what the page did). */
const SEED_SCRIPT = (items) => {
  if (!sessionStorage.getItem("__seeded")) {
    for (const [k, v] of items) localStorage.setItem(k, v);
    sessionStorage.setItem("__seeded", "1");
  }
};
const BLOCK_SCRIPT = () => {
  Object.defineProperty(window, "localStorage", {
    get() {
      throw new DOMException("blocked", "SecurityError");
    },
  });
};
const PRINT_SPY = () => {
  window.__prints = 0;
  window.print = () => {
    window.__prints += 1;
  };
};
async function open(viewport, url, { seeds, init, ...contextOptions } = {}) {
  const context = await browser.newContext({
    viewport,
    timezoneId: "UTC",
    locale: "en-US",
    ...contextOptions,
  });
  if (seeds) await context.addInitScript(SEED_SCRIPT, seeds);
  if (init) await context.addInitScript(init);
  await context.addInitScript(PRINT_SPY);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => !harmless(String(e)) && errors.push(`${e}\n${e.stack || ""}`));
  page.on("console", (m) => m.type() === "error" && !harmless(m.text()) && errors.push(m.text()));
  await visit(page, url);
  return { page, context, errors };
}
async function axe(page, label) {
  await page.addScriptTag({ path: AXE_PATH });
  const result = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    }),
  );
  const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  check(
    !bad.length,
    `axe: ${label} has no serious/critical violation${bad.length ? ` (${bad.map((v) => `${v.id}×${v.nodes.length}`).join(", ")})` : ""}`,
  );
}
const noSideScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
const smallTargets = (page) =>
  page.evaluate(() =>
    [
      ...document.querySelectorAll(
        ".pf a:not(.pf-sr), .pf button, .pf input, .pf summary, .pf-cert-dialog button, .pf-nav a, .pf-sitebar a",
      ),
    ]
      .filter((e) => e.getClientRects().length)
      .map((e) => ({
        r: e.getBoundingClientRect(),
        t: (e.textContent || e.id).trim().slice(0, 30),
      }))
      .filter(({ r }) => r.width > 1 && r.height > 1 && (r.height < 43.5 || r.width < 43.5))
      .map(({ t }) => t),
  );
const cardFacts = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".pf-card")].map((c) => ({
      id: c.dataset.id,
      launch: c.dataset.launch,
      status: c.dataset.status,
      unit: c.closest(".pf-unit").dataset.unit,
      title: c.querySelector("h3").textContent.trim(),
      statusText: c.querySelector('[data-role="status"]').hidden
        ? ""
        : c.querySelector('[data-role="status"]').textContent.trim(),
      artifact: c.querySelector('[data-role="artifact"]').hidden
        ? ""
        : c.querySelector('[data-role="artifact"]').textContent.replace(/\s+/g, " "),
      links: [...c.querySelectorAll("a[href]")].map((a) => ({
        role: a.dataset.role || "other",
        href: a.getAttribute("href"),
        text: a.firstChild?.textContent.trim(),
      })),
    })),
  );
const certOpen = (page) => page.evaluate(() => document.querySelector("#cert-modal").open);
const readKey = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);

/* ===================================================================================== */
/* 1. Structure and registry equality, on an empty device                                */
{
  const { page, context, errors } = await open({ width: 1440, height: 900 }, BASE + PORTFOLIO);
  const facts = await cardFacts(page);
  check(
    same(
      facts.map((f) => f.id),
      pageOrder.map((p) => p.id),
    ),
    `one card per registry project (${registry.projects.length}), grouped by current unit in registry order`,
  );
  let bad = 0;
  for (const p of registry.projects) {
    const f = facts.find((x) => x.id === p.id);
    const wantLinks = [...(hasPage(p) ? [["page", p.launchUrl]] : []), ["studio", p.studioUrl]];
    if (
      !f ||
      f.launch !== p.launchUrl ||
      f.title !== p.title ||
      f.unit !== String(p.unit) ||
      !same(
        f.links.map((l) => [l.role, l.href]),
        wantLinks,
      )
    ) {
      bad += 1;
      console.log(`  card differs for ${p.id}: ${JSON.stringify(f)}`);
    }
  }
  check(
    bad === 0,
    `every launch/resume link, title and CURRENT unit equals the registry byte for byte (${bad} differ)`,
  );
  check(
    same(
      await page.evaluate(() =>
        [...document.querySelectorAll(".pf-unit h2")].map((h) => h.textContent.trim()),
      ),
      units.map(unitLabel),
    ),
    "unit headings are the registry's current units (Pre-Unit, 1-10), never the legacy folder numbers",
  );
  const text = await page.evaluate(() => ({
    total: document.querySelector("#stat-total").textContent,
    unitTotal: document.querySelector("#stat-unit-total").textContent,
    lede: document.querySelector("#pf-sentence").textContent,
    meta: document.querySelector('meta[name="description"]').content,
  }));
  check(
    text.total === String(registry.projects.length) && text.unitTotal === String(units.length),
    `tile totals derive from the registry (${text.total} projects, ${text.unitTotal} units)`,
  );
  check(
    text.lede.startsWith(`${registry.projects.length} projects in ${units.length} units.`) &&
      text.meta.includes(
        `${registry.projects.length} Grade 6 math projects in ${units.length} units`,
      ),
    "header sentence and meta description print the registry counts",
  );
  check(
    facts.every((f) => f.status === "not-started" && f.statusText === "Not started"),
    "an empty device shows every project as Not started",
  );
  check(
    await page.evaluate(
      () =>
        !document.querySelector("#empty-state").hidden &&
        document.querySelector("#pf-print").hidden &&
        [...document.querySelectorAll("[data-cert]")].every((b) => b.hidden),
    ),
    "an empty device shows the how-to, no Print button and no certificate button",
  );
  await page.evaluate(() => window.showCert("unit-4"));
  check(
    !(await certOpen(page)) && (await page.locator("#cert-content").innerHTML()) === "",
    "showCert() with no completion record opens nothing and renders no certificate",
  );
  check(
    !(await page.evaluate(() =>
      /\p{Extended_Pictographic}/u.test(document.querySelector("main").innerText),
    )),
    "no emoji in the page",
  );
  check(
    errors.length === 0,
    `no console errors, empty device${errors.length ? `: ${errors[0]}` : ""}`,
  );
  await context.close();
}

/* ===================================================================================== */
/* 2. Seeded device: status, artifacts, tiles, links, certificate, print                  */
{
  const { page, context, errors } = await open({ width: 1440, height: 900 }, BASE + PORTFOLIO, {
    seeds: SEEDS,
  });
  const before = await page.evaluate(
    (keys) => keys.map((k) => localStorage.getItem(k)),
    SEEDS.map((s) => s[0]),
  );
  const facts = await cardFacts(page);
  const got = Object.fromEntries(facts.map((f) => [f.id, f.status]));
  check(
    same(
      Object.entries(got).sort(([a], [b]) => (a < b ? -1 : 1)),
      Object.entries(EXPECT_STATUS).sort(([a], [b]) => (a < b ? -1 : 1)),
    ),
    "statuses (complete / in progress / not started) match the seeds, id by id",
  );
  for (const f of facts) {
    const p = regById.get(f.id);
    const wantStudio =
      f.id === DONE || f.id === STUDIO_ONLY
        ? "Review in Studio"
        : f.id === WIP
          ? "Continue in Studio"
          : "Open in Studio";
    const wantPage =
      f.id === CLASSIC_WIP || f.id === LEGACY_DONE ? "Continue project page" : "Open project page";
    const studio = f.links.find((l) => l.role === "studio");
    const pageLink = f.links.find((l) => l.role === "page");
    if (
      studio.href !== p.studioUrl ||
      studio.text !== wantStudio ||
      (hasPage(p) && (pageLink?.href !== p.launchUrl || pageLink.text !== wantPage))
    )
      failures.push(`resume links wrong for ${f.id}: ${JSON.stringify(f.links)}`);
  }
  check(
    !failures.some((m) => m.startsWith("resume links wrong")),
    "after seeding, resume links still equal the registry URLs and say Continue/Review only where work exists",
  );
  const tiles = await page.evaluate(() => ({
    complete: document.querySelector("#stat-complete").textContent,
    progress: document.querySelector("#stat-progress").textContent,
    units: document.querySelector("#stat-units").textContent,
    stars: document.querySelector("#stat-stars").textContent,
    starsShown: !document.querySelector("#stat-stars-wrap").hidden,
    empty: document.querySelector("#empty-state").hidden,
    print: !document.querySelector("#pf-print").hidden,
  }));
  const nComplete = Object.values(EXPECT_STATUS).filter((s) => s === "complete").length;
  const nProgress = Object.values(EXPECT_STATUS).filter((s) => s === "in-progress").length;
  check(
    tiles.complete === String(nComplete) &&
      tiles.progress === String(nProgress) &&
      tiles.units === String(doneUnits.size) &&
      tiles.stars === "2" &&
      tiles.starsShown &&
      tiles.empty &&
      tiles.print,
    `tiles recount from the seeds (${nComplete} finished, ${nProgress} in progress, ${doneUnits.size} units, 2 stars)`,
  );
  const byId = Object.fromEntries(facts.map((f) => [f.id, f]));
  const flat = (s) => s.replace(/\s+/g, " ");
  const done = byId[DONE].artifact;
  const mustHave = [
    doneRecord.evidence.vision,
    ...doneRecord.evidence.prompts.map((p) => p.text),
    doneRecord.evidence.revision,
    doneRecord.evidence.claim,
    doneRecord.evidence.context,
    ...SELF_CHECK_ITEMS,
    "Self-check: 4 of 4 boxes checked.",
    "6 of 6 math checks matched",
    "What you changed from your first design",
  ].map(flat);
  const missing = mustHave.filter((t) => !done.includes(t));
  check(
    !missing.length,
    `a Studio completion shows the student's own choices, evidence, revision, recommendation and self-check${missing.length ? ` (missing: ${missing[0]})` : ""}`,
  );
  const wipText = byId[WIP].artifact;
  check(
    wipText.includes(flat(wip.state.vision)) &&
      wipText.includes("step 2 of 5") &&
      !wipText.includes("Your recommendation") &&
      byId[WIP].status === "in-progress",
    "a started Studio save shows only what the student wrote so far (no recommendation, honest step)",
  );
  const classic = byId[CLASSIC_WIP].artifact;
  check(
    classic.includes("about 55% saved") &&
      classic.includes("6 answers written") &&
      classic.includes(REFLECT.r1) &&
      classic.includes(REFLECT.r3) &&
      !classic.includes("SHOULD-NEVER-SHOW") &&
      !classic.includes("my answer 0"),
    "a classic page shows only what its Save/Resume record holds (percent, count, reflections); raw field text and the saved name never appear",
  );
  const legacy = byId[LEGACY_DONE].artifact;
  check(
    legacy.includes("2 of 3 stars") && legacy.includes("rubric self-score 13 of 16"),
    "a legacy completion shows its own stars and rubric self-score",
  );
  check(
    byId[STUDIO_ONLY].links.length === 1 &&
      byId[STUDIO_ONLY].links[0].href === regById.get(STUDIO_ONLY).studioUrl,
    "a Studio-only mission has exactly one link, the registry Studio URL",
  );
  /* certificate buttons: only units with a real completion */
  const certButtons = await page.evaluate(() =>
    [...document.querySelectorAll("[data-cert]")]
      .filter((b) => !b.hidden)
      .map((b) => b.dataset.cert),
  );
  check(
    same(certButtons.sort(), [...doneUnits].map((n) => `unit-${n}`).sort()),
    "certificate buttons appear for exactly the units that hold a real completion record",
  );
  await page.evaluate(() => window.showCert("unit-3"));
  check(!(await certOpen(page)), "a unit with only in-progress work cannot open a certificate");
  /* certificate content, focus, escape */
  const opener = page.locator('[data-cert="unit-4"]');
  await opener.focus();
  await page.keyboard.press("Enter");
  check(await certOpen(page), "Enter on the certificate button opens the certificate dialog");
  const cert = await page.evaluate(() => {
    const c = document.querySelector(".pf-cert");
    return {
      text: c.innerText.replace(/\s+/g, " "),
      label: c.getAttribute("aria-labelledby"),
      heading: document.querySelector("#cert-title")?.textContent,
      art: c.querySelector(".pf-cert-art")?.getAttribute("aria-hidden"),
      focusInside: document.querySelector("#cert-modal").contains(document.activeElement),
      emoji: /\p{Extended_Pictographic}/u.test(c.innerText),
    };
  });
  check(
    cert.text.includes("Maya R.") &&
      cert.text.includes("Pop-Up Shop Owner") &&
      cert.text.includes("October 30, 2026") &&
      cert.text.includes(unitLabel(4)) &&
      cert.text.includes("6.AT.3c") &&
      cert.heading === unitLabel(4) &&
      cert.label === "cert-title" &&
      cert.art === "true" &&
      !cert.emoji,
    "the certificate names the student, the finished project, its date, unit and standards; art is hidden from assistive tech; no emoji",
  );
  check(cert.focusInside, "focus moves into the certificate dialog");
  await page.keyboard.press("Escape");
  await page.fill("#student-name", "Sam T.");
  check(
    (await readKey(page, "nt-student-name")) === "Sam T.",
    "typing a name writes the existing nt-student-name key (the one key this page has always written)",
  );
  await page.click('[data-cert="unit-4"]');
  check(
    (await page.locator(".pf-cert-name").innerText()) === "Sam T.",
    "the certificate prints the name typed on the page",
  );
  await page.keyboard.press("Escape");
  await page.fill("#student-name", "");
  await page.click('[data-cert="unit-4"]');
  check(
    (await page.locator(".pf-cert-name").innerText()).includes("Write your name") &&
      (await page.locator(".pf-cert-name").evaluate((n) => n.getBoundingClientRect().width)) > 150,
    "with no name the certificate keeps a write-in line",
  );
  await page.keyboard.press("Escape");
  await page.fill("#student-name", "Maya R.");
  await page.click('[data-cert="unit-4"]');
  /* print: one landscape page, and only the certificate */
  const pdf = await page.pdf({ preferCSSPageSize: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) || []).length;
  check(pages === 1, `the certificate prints on exactly one page (${pages})`);
  const mediaBox = pdf.toString("latin1").match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
  check(
    mediaBox && Number(mediaBox[1]) > Number(mediaBox[2]),
    `the certificate page is landscape (${mediaBox ? `${mediaBox[1]} x ${mediaBox[2]}` : "no MediaBox"})`,
  );
  await page.emulateMedia({ media: "print" });
  check(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector("main")).display === "none" &&
        getComputedStyle(document.querySelector(".pf-cert")).display !== "none" &&
        getComputedStyle(document.querySelector(".pf-cert-actions")).display === "none",
    ),
    "printing a certificate hides the rest of the page and the buttons",
  );
  await page.emulateMedia({ media: "screen" });
  await page.click("#cert-print");
  check(
    (await page.evaluate(() => window.__prints)) === 1,
    "Print certificate calls window.print()",
  );
  await page.keyboard.press("Escape");
  check(
    !(await certOpen(page)) &&
      (await page.evaluate(() => document.activeElement?.dataset.cert)) === "unit-4",
    "Escape closes the certificate and returns focus to its button",
  );
  /* print view of the portfolio */
  await page.click("#pf-print");
  check(
    (await page.evaluate(() => window.__prints)) === 2,
    "Print my portfolio calls window.print()",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  const openedForPrint = await page.evaluate(() =>
    [...document.querySelectorAll(".pf-artifact details")].every((d) => d.open),
  );
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  const closedAfter = await page.evaluate(() =>
    [...document.querySelectorAll(".pf-artifact details")].every((d) => !d.open),
  );
  check(
    openedForPrint && closedAfter,
    "the print view opens every saved artifact and restores them afterwards",
  );
  await page.emulateMedia({ media: "print" });
  check(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".pf-sitebar")).display === "none" &&
        getComputedStyle(document.querySelector(".pf-links")).display === "none" &&
        document.querySelector(".pf-card").getClientRects().length > 0,
    ),
    "the print stylesheet drops navigation and launch buttons and keeps the cards",
  );
  await page.emulateMedia({ media: "screen" });
  const after = await page.evaluate(
    (keys) => keys.map((k) => localStorage.getItem(k)),
    SEEDS.map((s) => s[0]),
  );
  check(
    same(
      before,
      after.map((v, i) => (SEEDS[i][0] === "nt-student-name" ? before[i] : v)),
    ),
    "the portfolio wrote no project data: every seeded key is byte for byte unchanged",
  );
  check(
    errors.length === 0,
    `no console errors, seeded device${errors.length ? `: ${errors[0]}` : ""}`,
  );
  await context.close();
}

/* ===================================================================================== */
/* 3. Invalid, partial and tampered records never make a certificate                      */
{
  const good = JSON.parse(doneJson);
  const variants = {
    wrongMission: { ...good, missionId: "unit-4-b" },
    wrongVersion: { ...good, version: 2 },
    badDate: { ...good, completedAt: "yesterday" },
    noClaim: { ...good, evidence: { ...good.evidence, claim: "  " } },
    emptyEvidence: {
      ...good,
      evidence: { ...good.evidence, prompts: [{ prompt: "x", text: "" }] },
    },
    uncheckedSelfCheck: {
      ...good,
      selfCheck: {
        ...good.selfCheck,
        items: good.selfCheck.items.map((i, n) => ({ ...i, checked: n !== 2 })),
      },
    },
  };
  const unitKey = `unit-${regById.get(DONE).unit}`;
  let leaked = 0;
  for (const [name, record] of Object.entries(variants)) {
    check(!validateCompletionRecord(record, DONE), `validator rejects a ${name} record`);
    const { page, context } = await open({ width: 1440, height: 900 }, BASE + PORTFOLIO, {
      seeds: [[completeKeyFor(DONE), JSON.stringify(record)]],
    });
    const status = (await cardFacts(page)).find((f) => f.id === DONE).status;
    await page.evaluate((k) => window.showCert(k), unitKey);
    if (status === "complete" || (await certOpen(page))) leaked += 1;
    await context.close();
  }
  for (const [name, raw] of [
    ["corrupt JSON", "{nope"],
    ["an array", "[1,2]"],
    ["null", "null"],
  ]) {
    const { page, context } = await open({ width: 1440, height: 900 }, BASE + PORTFOLIO, {
      seeds: [[completeKeyFor(DONE), raw]],
    });
    const status = (await cardFacts(page)).find((f) => f.id === DONE).status;
    await page.evaluate((k) => window.showCert(k), unitKey);
    if (status === "complete" || (await certOpen(page))) {
      leaked += 1;
      console.log(`  ${name} leaked`);
    }
    await context.close();
  }
  check(
    leaked === 0,
    `no invalid, tampered or corrupt completion record shows as complete or opens a certificate (${leaked} leaked)`,
  );
  const { page, context } = await open({ width: 1440, height: 900 }, BASE + PORTFOLIO, {
    seeds: [
      seed.legacyCompletionMap([[legacyPath, { completedAt: undefined }]]),
      [completeKeyFor("not-a-mission"), doneJson],
    ],
  });
  const facts = await cardFacts(page);
  check(
    facts.every((f) => f.status === "not-started"),
    "a legacy record with no completion time and a record for an unknown mission count for nothing",
  );
  await context.close();
}

/* ===================================================================================== */
/* 4. The Studio writes the record only for real, explicit completion                     */
async function studio(id, { state, init, role } = {}) {
  const items = [];
  if (state) items.push(seed.studioSave(id, state));
  const ctx = await open(
    { width: 1440, height: 1000 },
    `${BASE}/curriculum/projects/studio/?project=${id}${role === "exemplar" ? "&exemplar=true" : ""}`,
    { seeds: items, init },
  );
  return ctx;
}
{
  const ready = seed.readyState(WIP, "Ready");
  const key = completeKeyFor(WIP);
  const { page, context, errors } = await studio(WIP, { state: ready.state });
  const studioKeyBefore = await readKey(page, `ewl-project-studio:v1:${WIP}`);
  const legacyBefore = await readKey(page, "nt-project-complete:v1");
  check((await readKey(page, key)) === null, "opening ready work writes no completion record");
  const button = page.locator("[data-complete]");
  check(
    (await button.count()) === 1 && (await button.innerText()) === "Mark this mission complete",
    "the Publish step offers Mark this mission complete for ready work",
  );
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll("[data-review]")].map((i) => i.parentElement.textContent.trim()),
  );
  check(
    same(labels, SELF_CHECK_ITEMS),
    "the record's self-check wording equals the page's own checklist",
  );
  await button.click();
  const written = JSON.parse(await readKey(page, key));
  check(
    !!validateCompletionRecord(written, WIP) &&
      written.registryId === WIP &&
      written.evidence.claim === ready.state.claim &&
      written.selfCheck.checked === 4 &&
      Number.isFinite(Date.parse(written.completedAt)),
    "pressing the button writes a valid nt-project-complete:v1:<id> record with the student's own evidence",
  );
  check(
    !JSON.stringify(written).match(/"(name|studentName|email)"/i),
    "the record carries no name or contact field",
  );
  check(
    (await readKey(page, `ewl-project-studio:v1:${WIP}`)) === studioKeyBefore &&
      (await readKey(page, "nt-project-complete:v1")) === legacyBefore,
    "the Studio save and the legacy completion key are left byte for byte unchanged",
  );
  check(
    (await page.locator("#completion-panel").innerText()).includes("in your portfolio"),
    "the panel confirms the mission is in the portfolio",
  );
  check(
    errors.length === 0,
    `no console errors in the Studio completion flow${errors.length ? `: ${errors[0]}` : ""}`,
  );
  /* the portfolio now shows it, with a certificate */
  const items = [seed.studioSave(WIP, ready.state), [key, JSON.stringify(written)]];
  const p2 = await open({ width: 1440, height: 900 }, BASE + PORTFOLIO, { seeds: items });
  const f = (await cardFacts(p2.page)).find((x) => x.id === WIP);
  check(
    f.status === "complete" && f.artifact.includes(ready.state.claim),
    "the portfolio shows the newly completed mission with the student's recommendation",
  );
  await p2.page.evaluate((k) => window.showCert(k), `unit-${regById.get(WIP).unit}`);
  check(await certOpen(p2.page), "the finished mission earns a certificate");
  await p2.context.close();
  await context.close();
}
{
  /* partial work, teacher view, exemplar and blocked write: never a record */
  const notReady = seed.readyState(WIP, "Draft").state;
  notReady.evidence[1] = "";
  notReady.stage = 4;
  const a = await studio(WIP, { state: notReady });
  check(
    (await a.page.locator("[data-complete]").count()) === 0 &&
      (await a.page.locator("#completion-panel").innerText()).includes("Finish every item"),
    "unfinished work offers no completion button and says what is missing",
  );
  check((await readKey(a.page, completeKeyFor(WIP))) === null, "unfinished work writes no record");
  await a.context.close();

  const teacher = seed.readyState(WIP, "Teach").state;
  teacher.role = "teacher";
  const t = await studio(WIP, { state: teacher });
  check(
    (await t.page.locator("[data-complete]").count()) === 0,
    "teacher view offers no completion button",
  );
  await t.context.close();

  const ex = await studio(WIP, { role: "exemplar" });
  check(
    (await ex.page.locator("[data-complete]").count()) === 0 &&
      (await readKey(ex.page, completeKeyFor(WIP))) === null,
    "the Completed Exemplar cannot be completed",
  );
  await ex.page.click('[data-action="teacher"]');
  check(
    (await ex.page.locator("[data-complete]").count()) === 0 &&
      (await ex.page.locator("#completion-panel").innerText()).includes("exemplar") &&
      (await readKey(ex.page, completeKeyFor(WIP))) === null,
    "switching the exemplar to student view still cannot complete it",
  );
  await ex.context.close();

  const blocked = await studio(WIP, {
    state: seed.readyState(WIP, "Block").state,
    init: () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (String(k).startsWith("nt-project-complete:v1:"))
          throw new DOMException("full", "QuotaExceededError");
        return set.call(this, k, v);
      };
    },
  });
  await blocked.page.click("[data-complete]");
  const msg = await blocked.page.locator("#completion-status").innerText();
  check(
    msg.includes("not marked complete") &&
      (await readKey(blocked.page, completeKeyFor(WIP))) === null,
    "when the device refuses the write, the Studio says so and does not claim completion",
  );
  check(blocked.errors.length === 0, "a refused write raises no console error");
  await blocked.context.close();
}

/* ===================================================================================== */
/* 5. Blocked storage and script off                                                      */
{
  const { page, context, errors } = await open({ width: 1440, height: 900 }, BASE + PORTFOLIO, {
    init: BLOCK_SCRIPT,
  });
  const facts = await cardFacts(page);
  check(
    facts.length === registry.projects.length,
    "with storage blocked every project card is still there",
  );
  check(
    facts.every((f) =>
      same(
        f.links.map((l) => l.href),
        [
          ...(hasPage(regById.get(f.id)) ? [regById.get(f.id).launchUrl] : []),
          regById.get(f.id).studioUrl,
        ],
      ),
    ),
    "with storage blocked every link still equals the registry URL",
  );
  check(
    (await page.locator(".pf-note").count()) === 1 &&
      facts.every((f) => f.status === "unknown" || f.status === "not-started") &&
      facts.every((f) => f.statusText === ""),
    "with storage blocked the page says so and invents no status",
  );
  check(
    errors.length === 0,
    `no console errors with storage blocked${errors.length ? `: ${errors[0]}` : ""}`,
  );
  await axe(page, "blocked storage");
  await context.close();
}
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    javaScriptEnabled: false,
  });
  const page = await context.newPage();
  await visit(page, BASE + PORTFOLIO);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll(".pf-card a[href]")].map((a) => a.getAttribute("href")),
  );
  const want = pageOrder.flatMap((p) => [...(hasPage(p) ? [p.launchUrl] : []), p.studioUrl]);
  check(
    same(hrefs, want),
    "with script off every project is listed with its registry launch links",
  );
  await context.close();
}

/* ===================================================================================== */
/* 6. Widths, keyboard, reduced motion, axe                                               */
for (const width of [1440, 820, 390]) {
  const tag = `${width}px`;
  const { page, context, errors } = await open({ width, height: 900 }, BASE + PORTFOLIO, {
    seeds: SEEDS,
    reducedMotion: "reduce",
  });
  check(await noSideScroll(page), `${tag} no sideways scroll`);
  const small = await smallTargets(page);
  check(
    !small.length,
    `${tag} every control is at least 44px${small.length ? ` (${small.slice(0, 3).join(", ")})` : ""}`,
  );
  check(
    (await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === "running").length,
    )) === 0,
    `${tag} nothing animates under reduced motion`,
  );
  await axe(page, `${tag} seeded portfolio`);
  /* keyboard: tab reaches a card link with a visible focus ring */
  await page.focus("#student-name");
  for (let i = 0; i < 4; i += 1) await page.keyboard.press("Tab");
  const ring = await page.evaluate(() => {
    const e = document.activeElement;
    const s = getComputedStyle(e);
    return { tag: e.tagName, width: Number.parseFloat(s.outlineWidth), style: s.outlineStyle };
  });
  check(ring.width >= 2 && ring.style !== "none", `${tag} keyboard focus shows a visible ring`);
  await page.locator('[data-cert="unit-4"]').scrollIntoViewIfNeeded();
  await page.locator('[data-cert="unit-4"]').click();
  check(await noSideScroll(page), `${tag} no sideways scroll with the certificate open`);
  const fits = await page.evaluate(() => {
    const c = document.querySelector(".pf-cert").getBoundingClientRect();
    return c.right <= window.innerWidth + 1 && c.left >= -1;
  });
  check(fits, `${tag} the certificate fits the screen`);
  const smallDialog = await page.evaluate(
    () =>
      [...document.querySelectorAll("#cert-modal button")]
        .map((b) => b.getBoundingClientRect())
        .filter((r) => r.height < 43.5 || r.width < 43.5).length,
  );
  check(smallDialog === 0, `${tag} certificate dialog buttons are 44px`);
  const overlap = await page.evaluate(() => {
    const body = document.querySelector(".pf-cert-body").getBoundingClientRect();
    const art = document.querySelector(".pf-cert-art");
    return art && getComputedStyle(art).display !== "none" ? body.width > 0 : true;
  });
  check(overlap, `${tag} certificate layout renders`);
  await page.keyboard.press("Tab");
  check(
    await page.evaluate(() =>
      document.querySelector("#cert-modal").contains(document.activeElement),
    ),
    `${tag} Tab stays inside the open certificate`,
  );
  await axe(page, `${tag} certificate dialog`);
  check(errors.length === 0, `${tag} no console errors${errors.length ? `: ${errors[0]}` : ""}`);
  await context.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\nvalidate:projects-portfolio-browser: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nvalidate:projects-portfolio-browser: PASS");
