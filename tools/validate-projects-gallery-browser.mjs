#!/usr/bin/env node
/**
 * validate-projects-gallery-browser.mjs — /curriculum/projects/ and /math/projects/, driven the
 * way a student or teacher drives them, against data/project-registry.json.
 *
 *   - one card per registry project, in registry order; title, current unit (never the legacy
 *     folder number), unit colour, type and every launch link equal the registry byte for byte
 *   - search and every filter recounted independently from the registry + Studio mission data
 *   - URL state: refresh, Back/Forward, direct links and invalid parameters
 *   - the detail dialog for all projects: focus moves in, stays in, Esc closes, focus returns;
 *     the challenge, evidence, deliverable, rubric and links are the real ones
 *   - Continue appears only for a seeded save and not otherwise; the page writes nothing; it
 *     works with storage blocked and with script off
 *   - 1440 / 820 / 390: no sideways scroll, 44px targets, axe WCAG A/AA/2.2 (no serious/critical)
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
const ROUTES = ["/curriculum/projects/", "/math/projects/"];

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
// The source tree has no Vite build, so the site-wide telemetry loader cannot resolve its bare
// "web-vitals" import; that is the harness, not the page.
const harmless = (text) => /web-vitals|ERR_ABORTED|Failed to load resource/.test(text);

/* --- the expected world, from the data and never from the page ------------------------ */
const registry = JSON.parse(readFileSync(join(ROOT, "data/project-registry.json"), "utf8"));
const { PROJECTS, UNIT_NAMES } = await load("curriculum/projects/studio/projects.mjs");
const { FAMILY } = await load("curriculum/projects/studio/math.mjs");
const { STUDIO_RUBRIC } = await load("curriculum/projects/studio/rubric.mjs");
const { TOPICS, TYPE_LABELS, UNIT_FALLBACK } = await load("tools/lib/projects-gallery.mjs");
const mission = (id) => PROJECTS.find((p) => p.id === id);
const unitLabel = (n) => (n === 0 ? UNIT_NAMES[0] : `Unit ${n} · ${UNIT_NAMES[n]}`);
const codesOf = (p) =>
  [...new Set([...FAMILY[p.family].standards, ...p.standards.pageCodes])].sort();
const hayOf = (p) => {
  const m = mission(p.id);
  const f = FAMILY[p.family];
  return [
    p.title,
    m.role,
    m.question,
    m.product,
    ...m.choices,
    f.label,
    TOPICS[p.family],
    unitLabel(p.unit),
    TYPE_LABELS[p.classification],
    ...codesOf(p),
    ...f.vocab.flatMap((v) => [v[0], v[1]]),
  ]
    .join(" ")
    .toLowerCase();
};
const expectIds = ({ q = "", unit = "", topic = "", standard = "", type = "" } = {}) =>
  registry.projects
    .filter(
      (p) =>
        (unit === "" || String(p.unit) === unit) &&
        (!topic || p.family === topic) &&
        (!type || p.classification === type) &&
        (!standard || codesOf(p).includes(standard)) &&
        q
          .toLowerCase()
          .split(/\s+/)
          .filter(Boolean)
          .every((t) => hayOf(p).includes(t)),
    )
    .map((p) => p.id);
const expectedLaunch = (p) => ({
  studio: p.studioUrl,
  classic: p.hubUrl ? p.launchUrl : null,
  versions: p.hubUrl
    ? registry.hubs
        .find((h) => h.projects.includes(p.id))
        .projects.filter((id) => id !== p.id)
        .map((id) => registry.projects.find((x) => x.id === id).launchUrl)
    : [],
});
const tokenCss = readFileSync(join(ROOT, "assets/curriculum-system.css"), "utf8");
const unitToken = (n) =>
  tokenCss.match(new RegExp(`--unit-${n}:\\s*(#[0-9a-fA-F]{6})`))?.[1].toLowerCase();
const rgbOf = (hex) =>
  `rgb(${[1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

/** Navigate and wait for the network to settle; one retry when Chromium aborts a navigation that raced the previous page's teardown. */
async function visit(page, target) {
  try {
    await page.goto(target, { waitUntil: "networkidle" });
  } catch (error) {
    if (!/ERR_ABORTED/.test(error.message)) throw error;
    await page.goto(target, { waitUntil: "networkidle" });
  }
}
/* --- browser helpers ------------------------------------------------------------------ */
async function open(viewport, url, contextOptions = {}, init) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (e) => !harmless(String(e)) && errors.push(`${e}\n${e.stack || ""}`));
  page.on("console", (m) => m.type() === "error" && !harmless(m.text()) && errors.push(m.text()));
  await visit(page, url);
  return { page, context, errors };
}
const visibleIds = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".pg-card")].filter((c) => !c.hidden).map((c) => c.dataset.id),
  );
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
        ".pg a:not(.pg-sr), .pg button, .pg select, .pg input, .pg summary, .pg-dialog a, .pg-dialog button, .pg-dialog summary",
      ),
    ]
      .filter((e) => e.offsetParent !== null || e.getClientRects().length)
      .map((e) => ({
        r: e.getBoundingClientRect(),
        t: (e.textContent || e.id).trim().slice(0, 30),
      }))
      .filter(({ r }) => r.width > 1 && r.height > 1 && (r.height < 43.5 || r.width < 43.5))
      .map(({ t }) => t),
  );
async function setFilters(page, { q, unit, topic, standard, type }) {
  if (q !== undefined) await page.fill("#pg-search", q);
  for (const [id, value] of [
    ["#pg-unit", unit],
    ["#pg-topic", topic],
    ["#pg-standard", standard],
    ["#pg-type", type],
  ])
    if (value !== undefined) await page.selectOption(id, value);
}
const statusOf = (page) => page.locator("#pg-status").innerText();

/* ===================================================================================== */
check(
  same(
    Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [i + 1, UNIT_FALLBACK[i + 1].toLowerCase()]),
    ),
    Object.fromEntries(Array.from({ length: 10 }, (_, i) => [i + 1, unitToken(i + 1)])),
  ),
  "the unit colour fallbacks equal the --unit-N tokens in assets/curriculum-system.css",
);

for (const route of ROUTES) {
  const url = BASE + route;
  const tag = route;

  /* --- structure at desktop width --- */
  const { page, context, errors } = await open({ width: 1440, height: 900 }, url);
  const ids = await visibleIds(page);
  check(
    same(
      ids,
      registry.projects.map((p) => p.id),
    ),
    `${tag} one card per registry project (${registry.projects.length}), in registry order`,
  );
  check(
    (await statusOf(page)) ===
      `Showing ${registry.projects.length} of ${registry.projects.length} projects`,
    `${tag} status states the registry count`,
  );
  const heroStats = await page.locator(".pg-stats").innerText();
  const sets = registry.hubs.length;
  const pages = registry.projects.filter((p) => p.files.page && p.hubUrl).length;
  check(
    heroStats.startsWith(
      `${registry.projects.length} projects · ${sets} project sets · ${pages} classic pages`,
    ),
    `${tag} hero counts derive from the registry (${heroStats.split("·").slice(0, 3).join("·").trim()})`,
  );
  const cardFacts = await page.evaluate(() =>
    [...document.querySelectorAll(".pg-card")].map((c) => ({
      id: c.dataset.id,
      title: c.querySelector("h3").textContent.trim(),
      unit: c.dataset.unit,
      unitChip: c.querySelector(".pg-chip-unit").textContent.trim(),
      chips: [...c.querySelectorAll(".pg-meta .pg-chip")].map((e) => e.textContent.trim()),
      border: getComputedStyle(c).borderTopColor,
      hrefs: [...c.querySelectorAll("a[href]")].map((a) => ({
        role: a.dataset.role || (a.classList.contains("pg-ver") ? "version" : "other"),
        href: a.getAttribute("href"),
      })),
      svg: {
        title: !!c.querySelector("svg title")?.textContent.trim(),
        desc: !!c.querySelector("svg desc")?.textContent.trim(),
        use: c.querySelector("svg use")?.getAttribute("href"),
      },
      fallback: c.getAttribute("style"),
    })),
  );
  let linkBad = 0;
  let metaBad = 0;
  let artBad = 0;
  for (const p of registry.projects) {
    const f = cardFacts.find((x) => x.id === p.id);
    const want = expectedLaunch(p);
    const byRole = (role) => f.hrefs.filter((h) => h.role === role).map((h) => h.href);
    const ok =
      same(byRole("studio"), [want.studio]) &&
      same(byRole("continue-studio"), [want.studio]) &&
      same(byRole("classic"), want.classic ? [want.classic] : []) &&
      same(byRole("continue-classic"), want.classic ? [want.classic] : []) &&
      same(byRole("version"), want.versions) &&
      f.hrefs.every((h) => h.role !== "other");
    if (!ok) {
      linkBad += 1;
      console.log(`  links differ for ${p.id}: ${JSON.stringify(f.hrefs)}`);
    }
    const chipOk =
      f.title === p.title &&
      f.unit === String(p.unit) &&
      f.unitChip === unitLabel(p.unit) &&
      f.chips.includes(TYPE_LABELS[p.classification]) &&
      f.border === rgbOf(p.unit === 0 ? UNIT_FALLBACK[0] : unitToken(p.unit));
    if (!chipOk) {
      metaBad += 1;
      console.log(`  title/unit/colour differ for ${p.id}: ${JSON.stringify(f)}`);
    }
    if (!(f.svg.title && f.svg.desc && f.svg.use === `#pg-art-${p.family}`)) artBad += 1;
  }
  check(
    linkBad === 0,
    `${tag} every launch link equals the registry URL byte for byte (${linkBad} differ)`,
  );
  check(
    metaBad === 0,
    `${tag} title, CURRENT unit, unit colour and type match the registry (${metaBad} differ)`,
  );
  check(
    artBad === 0,
    `${tag} every card has a titled, described family drawing (${artBad} do not)`,
  );
  check(
    registry.projects
      .filter((p) => p.unit !== Number(p.legacyFolder?.match(/unit-(\d+)/)?.[1] ?? p.unit))
      .every((p) => cardFacts.find((x) => x.id === p.id).unitChip.startsWith(`Unit ${p.unit} ·`)),
    `${tag} relocated legacy folders show their current unit, not the folder number`,
  );
  check(
    (await page.locator("svg symbol").count()) === 12,
    `${tag} the sprite holds the 12 family drawings`,
  );
  check(
    !(await page.evaluate(() =>
      /\p{Extended_Pictographic}/u.test(
        document.querySelector("main").innerText + document.querySelector("#pg-dialog").innerText,
      ),
    )),
    `${tag} the page uses no emoji`,
  );
  check(await noSideScroll(page), `${tag} no horizontal scroll at 1440px`);
  await axe(page, `${tag} at 1440`);

  /* --- search and filters, recounted --- */
  let filterBad = 0;
  const trial = async (spec, label) => {
    await visit(page, url);
    await setFilters(page, spec);
    await page.waitForTimeout(30);
    const got = await visibleIds(page);
    const want = expectIds(spec);
    const status = await statusOf(page);
    const ok =
      same(got, want) &&
      status === `Showing ${want.length} of ${registry.projects.length} projects`;
    if (!ok) {
      filterBad += 1;
      console.log(`  ${label}: page ${got.length}, registry ${want.length}; status "${status}"`);
    }
  };
  for (let unit = 0; unit <= 10; unit++) await trial({ unit: String(unit) }, `unit ${unit}`);
  for (const type of Object.keys(TYPE_LABELS)) await trial({ type }, `type ${type}`);
  for (const topic of Object.keys(TOPICS)) await trial({ topic }, `topic ${topic}`);
  const allCodes = [...new Set(registry.projects.flatMap(codesOf))].sort();
  for (const standard of allCodes) await trial({ standard }, `standard ${standard}`);
  for (const q of [
    "ratio",
    "6.at.1",
    "robot",
    "pop-up shop",
    "cociente",
    "unit 3",
    "net volume",
    "zzzz",
    "  Data  ",
  ])
    await trial({ q }, `search "${q}"`);
  await trial({ unit: "5", type: "version", q: "room" }, "unit+type+search");
  await trial({ topic: "statistics", standard: "6.DS.1", type: "flagship" }, "topic+standard+type");
  check(
    filterBad === 0,
    `${tag} ${11 + 4 + 12 + allCodes.length + 9 + 2} filter/search states equal the independent recount (${filterBad} differ)`,
  );
  await visit(page, url);
  await setFilters(page, { q: "zzzz" });
  check(
    (await page.locator("#pg-empty").isVisible()) &&
      (await statusOf(page)).startsWith("Showing 0 of"),
    `${tag} no match shows the empty state with a reset`,
  );
  await axe(page, `${tag} empty state`);
  await page.click("#pg-empty-reset");
  check(
    (await visibleIds(page)).length === registry.projects.length,
    `${tag} reset restores every project`,
  );

  /* --- URL state --- */
  await visit(page, url);
  await setFilters(page, { unit: "5" });
  await setFilters(page, { type: "version" });
  const afterTwo = expectIds({ unit: "5", type: "version" });
  check(
    same(await visibleIds(page), afterTwo),
    `${tag} two filters narrow to the registry's ${afterTwo.length}`,
  );
  check(
    page.url().includes("unit=5") && page.url().includes("type=version"),
    `${tag} filters are written to the query string`,
  );
  await page.reload({ waitUntil: "networkidle" });
  check(
    same(await visibleIds(page), afterTwo) && (await page.inputValue("#pg-unit")) === "5",
    `${tag} refresh keeps the view`,
  );
  await page.goBack();
  check(
    same(await visibleIds(page), expectIds({ unit: "5" })) &&
      (await page.inputValue("#pg-type")) === "",
    `${tag} Back undoes the last filter`,
  );
  await page.goForward();
  check(same(await visibleIds(page), afterTwo), `${tag} Forward redoes it`);
  await visit(page, `${url}?topic=ratio&q=smoothie`);
  check(
    same(await visibleIds(page), expectIds({ topic: "ratio", q: "smoothie" })) &&
      (await page.inputValue("#pg-search")) === "smoothie",
    `${tag} a direct link restores topic and search`,
  );
  await visit(page, `${url}?unit=99&type=zzz&project=nope&topic=<b>`);
  check(
    (await visibleIds(page)).length === registry.projects.length &&
      !(await page.locator("#pg-dialog[open]").count()),
    `${tag} unknown parameters are ignored`,
  );

  /* --- detail dialog, every project --- */
  await visit(page, url);
  let dialogBad = 0;
  for (const p of registry.projects) {
    const m = mission(p.id);
    const opener = page.locator(`.pg-card[data-id="${p.id}"] .pg-details`);
    await opener.focus();
    await page.keyboard.press("Enter");
    await page.locator("#pg-dialog[open]").waitFor();
    const got = await page.evaluate(() => {
      const d = document.querySelector("#pg-dialog");
      return {
        title: d.querySelector("#pg-d-title").textContent,
        text: d.innerText,
        focusInside: d.contains(document.activeElement),
        links: [...d.querySelectorAll("#pg-d-actions a")].map((a) => a.getAttribute("href")),
        rubricSummary: d.querySelector("details summary")?.textContent || "",
        url: location.search,
      };
    });
    const want = expectedLaunch(p);
    const textOk = [m.role, m.question, m.twist, m.product, ...m.choices, ...m.evidence].every(
      (s) => got.text.replace(/\s+/g, " ").includes(s),
    );
    const rubricOk = STUDIO_RUBRIC.every(
      (r) => got.text.includes(r.name) && got.text.includes(r.levels),
    );
    const pageRubric =
      p.rubric.rows > 0
        ? got.rubricSummary === `Classic page rubric (${p.rubric.rows} skills)`
        : got.rubricSummary === "";
    const linksOk =
      got.links.includes(want.studio) &&
      (!want.classic || got.links.includes(want.classic)) &&
      want.versions.every((v) => got.links.includes(v)) &&
      got.links.every((h) => [want.studio, want.classic, ...want.versions].includes(h));
    const ok =
      got.title === p.title &&
      got.focusInside &&
      textOk &&
      rubricOk &&
      pageRubric &&
      linksOk &&
      got.url === `?project=${p.id}`;
    if (!ok) {
      dialogBad += 1;
      console.log(
        `  dialog ${p.id}: ${JSON.stringify({ title: got.title, focus: got.focusInside, textOk, rubricOk, pageRubric, linksOk, url: got.url })}`,
      );
    }
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => !document.querySelector("#pg-dialog").open && !location.search.includes("project="),
    );
    const back = await page.evaluate(
      (id) => ({
        closed: !document.querySelector("#pg-dialog").open,
        focus:
          document.activeElement?.closest?.(".pg-card")?.dataset.id === id &&
          document.activeElement.classList.contains("pg-details"),
        url: location.search,
      }),
      p.id,
    );
    if (!(back.closed && back.focus && back.url === "")) {
      dialogBad += 1;
      console.log(`  after Esc ${p.id}: ${JSON.stringify(back)}`);
    }
  }
  check(
    dialogBad === 0,
    `${tag} all ${registry.projects.length} detail dialogs: real challenge, evidence, deliverable, rubric, registry links; focus in; Esc closes and returns focus (${dialogBad} problems)`,
  );

  // Focus is trapped while open.
  await page.locator('.pg-card[data-id="unit-3-a"] .pg-details').click();
  let escaped = 0;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    if (
      !(await page.evaluate(() =>
        document.querySelector("#pg-dialog").contains(document.activeElement),
      ))
    )
      escaped += 1;
  }
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Shift+Tab");
    if (
      !(await page.evaluate(() =>
        document.querySelector("#pg-dialog").contains(document.activeElement),
      ))
    )
      escaped += 1;
  }
  check(escaped === 0, `${tag} Tab and Shift+Tab never leave the open dialog`);
  check(
    (
      await page.evaluate(() =>
        document.querySelector("#pg-d-art svg").getAttribute("aria-labelledby"),
      )
    ).endsWith("-d") &&
      (await page.evaluate(
        () =>
          document.querySelectorAll("[id]").length ===
          new Set([...document.querySelectorAll("[id]")].map((e) => e.id)).size,
      )),
    `${tag} the dialog drawing has its own unique ids`,
  );
  await page.click("#pg-d-close");
  await page.waitForFunction(() => !location.search.includes("project="));
  check(
    (await page.evaluate(() => !document.querySelector("#pg-dialog").open)) &&
      page.url().endsWith(route),
    `${tag} the Close button closes and clears the URL`,
  );
  // Back / Forward / direct link with the dialog.
  await setFilters(page, { unit: "3" });
  await page.locator('.pg-card[data-id="unit-3-b"] .pg-details').click();
  check(
    page.url().includes("project=unit-3-b") && page.url().includes("unit=3"),
    `${tag} opening a project writes ?project= beside the filters`,
  );
  await page.goBack();
  check(
    (await page.evaluate(() => !document.querySelector("#pg-dialog").open)) &&
      same(await visibleIds(page), expectIds({ unit: "3" })),
    `${tag} Back closes the dialog and keeps the filters`,
  );
  await page.goForward();
  check(
    await page.evaluate(() => document.querySelector("#pg-dialog").open),
    `${tag} Forward reopens it`,
  );
  await visit(page, `${url}?project=unit-9-b`);
  await page.locator("#pg-dialog[open]").waitFor();
  check(
    (await page.locator("#pg-d-title").innerText()) ===
      registry.projects.find((p) => p.id === "unit-9-b").title,
    `${tag} a direct ?project= link opens its detail`,
  );
  await axe(page, `${tag} detail dialog at 1440`);
  check(
    errors.length === 0,
    `${tag} no console errors at desktop${errors.length ? `: ${errors[0]}` : ""}`,
  );
  await context.close();

  /* --- tablet and phone --- */
  for (const width of [820, 390]) {
    const view = await open({ width, height: width === 820 ? 1100 : 844 }, url);
    check(await noSideScroll(view.page), `${tag} no horizontal scroll at ${width}px`);
    const small = await smallTargets(view.page);
    check(
      small.length === 0,
      `${tag} every control is at least 44px at ${width}px${small.length ? ` (${small.slice(0, 4).join(" | ")})` : ""}`,
    );
    await axe(view.page, `${tag} at ${width}`);
    await view.page.locator('.pg-card[data-id="unit-10-a"] .pg-details').click();
    check(
      await noSideScroll(view.page),
      `${tag} the dialog does not scroll sideways at ${width}px`,
    );
    const smallDialog = await smallTargets(view.page);
    check(
      smallDialog.length === 0,
      `${tag} dialog controls are at least 44px at ${width}px${smallDialog.length ? ` (${smallDialog.slice(0, 4).join(" | ")})` : ""}`,
    );
    if (width === 390) await axe(view.page, `${tag} detail dialog at 390`);
    check(
      view.errors.length === 0,
      `${tag} no console errors at ${width}px${view.errors.length ? `: ${view.errors[0]}` : ""}`,
    );
    await view.context.close();
  }

  /* --- Continue: only for a seeded save, never written by the page --- */
  {
    const view = await open({ width: 1440, height: 900 }, url);
    const none = await view.page.evaluate(() => ({
      continues: [...document.querySelectorAll(".pg-continue")].filter((e) => e.offsetParent)
        .length,
      saved: [...document.querySelectorAll(".pg-saved")].filter((e) => !e.hidden).length,
      resume: !document.querySelector("#pg-resume").hidden,
    }));
    check(
      none.continues === 0 && none.saved === 0 && !none.resume,
      `${tag} with no saved work there is no Continue and no resume note`,
    );
    await view.page.evaluate(() => {
      const studio = (id, extra) =>
        localStorage.setItem(
          `ewl-project-studio:v1:${id}`,
          JSON.stringify({
            version: 1,
            projectId: id,
            stage: 0,
            choice: "",
            vision: "",
            evidence: ["", "", ""],
            checked: {},
            ...extra,
          }),
        );
      studio("unit-4-a", { stage: 2, choice: "Sticker studio" });
      studio("unit-2-a", {}); // untouched: not progress
      studio("unit-6-a", { projectId: "unit-5-a", stage: 3 }); // belongs to another project
      localStorage.setItem("ewl-project-studio:v1:unit-5-a", "{bad"); // corrupt
      localStorage.setItem(
        "ewl-project-studio:v1:not-a-project",
        JSON.stringify({ projectId: "not-a-project", stage: 3 }),
      );
      localStorage.setItem(
        "nsr:rec:T3A-001",
        JSON.stringify({ url: "/math/unit-3/projects/version-a/index.html", progressPercent: 40 }),
      );
      localStorage.setItem("nt-project-rubric:/math/unit-7/projects/version-a/", "{}");
    });
    const before = await view.page.evaluate(() =>
      JSON.stringify(
        Object.keys(localStorage)
          .filter((k) => /^(ewl-project-studio:|nsr:rec:|nt-project-)/.test(k))
          .sort()
          .map((k) => [k, localStorage.getItem(k)]),
      ),
    );
    await view.page.reload({ waitUntil: "networkidle" });
    const after = await view.page.evaluate(() =>
      JSON.stringify(
        Object.keys(localStorage)
          .filter((k) => /^(ewl-project-studio:|nsr:rec:|nt-project-)/.test(k))
          .sort()
          .map((k) => [k, localStorage.getItem(k)]),
      ),
    );
    check(before === after, `${tag} the gallery reads saved work and writes none`);
    const saved = await view.page.evaluate(() =>
      [...document.querySelectorAll(".pg-card.has-saved")].map((c) => ({
        id: c.dataset.id,
        note: c.querySelector(".pg-saved").textContent,
        links: [...c.querySelectorAll(".pg-continue")]
          .filter((e) => e.offsetParent)
          .map((a) => [a.dataset.role, a.getAttribute("href")]),
      })),
    );
    const byId = Object.fromEntries(saved.map((s) => [s.id, s]));
    const reg = (id) => registry.projects.find((p) => p.id === id);
    check(
      same(saved.map((s) => s.id).sort(), ["unit-3-a", "unit-4-a", "unit-7-a"]),
      `${tag} Continue appears for exactly the three seeded saves (not untouched, corrupt, mismatched or unknown ones)`,
    );
    check(
      same(byId["unit-4-a"]?.links, [["continue-studio", reg("unit-4-a").studioUrl]]) &&
        /Studio: step 3 of 5/.test(byId["unit-4-a"].note),
      `${tag} a Studio save offers Continue to the registry Studio URL with the real step`,
    );
    check(
      same(byId["unit-3-a"]?.links, [["continue-classic", reg("unit-3-a").launchUrl]]) &&
        /about 40%/.test(byId["unit-3-a"].note),
      `${tag} a Save/Resume record offers Continue to the registry classic URL with its saved percent`,
    );
    check(
      same(byId["unit-7-a"]?.links, [["continue-classic", reg("unit-7-a").launchUrl]]) &&
        /saved work found/.test(byId["unit-7-a"].note),
      `${tag} a path-keyed project key is reported only as "saved work found"`,
    );
    check(
      (await view.page.locator("#pg-resume").innerText()).includes("3 projects"),
      `${tag} the resume note counts the saved projects`,
    );
    await view.page.locator('.pg-card[data-id="unit-4-a"] .pg-details').click();
    check(
      (await view.page.locator("#pg-d-actions a").first().innerText()) === "Continue in Studio",
      `${tag} the dialog leads with Continue for a saved project`,
    );
    await axe(view.page, `${tag} with saved work`);
    check(
      view.errors.length === 0,
      `${tag} no console errors with saved work${view.errors.length ? `: ${view.errors[0]}` : ""}`,
    );
    await view.context.close();
  }

  /* --- storage blocked --- */
  {
    const blocked = () => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("blocked", "SecurityError");
        },
      });
    };
    const view = await open({ width: 1440, height: 900 }, url, {}, blocked);
    check(
      (await visibleIds(view.page)).length === registry.projects.length,
      `${tag} storage blocked: every card renders`,
    );
    await setFilters(view.page, { unit: "3" });
    check(
      same(await visibleIds(view.page), expectIds({ unit: "3" })),
      `${tag} storage blocked: filters work`,
    );
    await view.page.locator('.pg-card[data-id="unit-3-a"] .pg-details').click();
    check(
      await view.page.evaluate(() => document.querySelector("#pg-dialog").open),
      `${tag} storage blocked: the detail dialog opens`,
    );
    check(
      (await view.page.evaluate(
        () => [...document.querySelectorAll(".pg-continue")].filter((e) => e.offsetParent).length,
      )) === 0,
      `${tag} storage blocked: no Continue is claimed`,
    );
    const own = view.errors.filter((e) => /gallery\./.test(e));
    check(
      own.length === 0,
      `${tag} storage blocked: the gallery raises no error${own.length ? `: ${own[0].split("\n")[0]}` : ""}`,
    );
    await view.context.close();
  }

  /* --- script off: the cards are still a list of links --- */
  {
    const view = await open({ width: 1440, height: 900 }, url, { javaScriptEnabled: false });
    check(
      (await view.page.locator(".pg-card:visible").count()) === registry.projects.length &&
        !(await view.page.locator("#pg-tools").isVisible()) &&
        (await view.page.locator('.pg-card a[data-role="studio"]:visible').count()) ===
          registry.projects.length,
      `${tag} with script off all ${registry.projects.length} projects and their Studio links show, and the dead filter bar is hidden`,
    );
    await view.context.close();
  }

  /* --- reduced motion and forced colors keep every control visible --- */
  {
    const view = await open({ width: 390, height: 844 }, url, {
      reducedMotion: "reduce",
      forcedColors: "active",
    });
    check(
      await noSideScroll(view.page),
      `${tag} forced colors + reduced motion: no horizontal scroll at 390px`,
    );
    check(view.errors.length === 0, `${tag} forced colors + reduced motion: no console errors`);
    await view.context.close();
  }
}

await browser.close();
server.close();
if (failures.length) {
  console.error(
    `\nvalidate-projects-gallery-browser FAILED (${failures.length}):\n  ${failures.join("\n  ")}`,
  );
  process.exit(1);
}
console.log("\n✓ validate-projects-gallery-browser passed");
