// The five student destinations: labels, grouping, sub-navigation, old ?view= links, Spanish, target size.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const shots = process.env.NAV_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const errors = [];
  const open = async (viewport, query = "?grade=3&profile=0", lang = "en") => {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript((value) => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify(value)), lang);
    await page.goto(`${base}${query}`, { waitUntil: "networkidle" });
    return page;
  };
  const current = (page) => page.locator("#hub-tabs button[data-view][aria-current]").allInnerTexts();
  const sub = (page) => page.locator("#hub-subnav button").allInnerTexts();

  const page = await open({ width: 1280, height: 900 });
  const tabs = await page.locator("#hub-tabs button[data-view]").allInnerTexts();
  assert.deepEqual(tabs, ["Home", "Learn", "Practice", "Play", "My Growth", "For teachers"]);
  assert.deepEqual(await current(page), ["Home"]);
  assert.equal(await page.locator("#hub-subnav").isHidden(), true, "Home has no sub-navigation");
  // Math Reality: a first-class link in the tab row, a featured card on Home, a card in Practice.
  const reality = page.locator("#hub-tabs a.reality-tab");
  assert.equal(await reality.innerText(), "Math Reality");
  assert.match(await reality.getAttribute("href"), /^reality\/$/);
  assert.equal(await page.locator("#reality-feature [data-reality-link]").getAttribute("href"), "reality/?grade=3");
  assert.equal(await page.locator("#reality-feature [data-reality-link]").innerText(), "Open Math Reality");
  // Reality Lab: the model workspace has its own tab link, a Home link and a Practice card.
  assert.equal(await page.locator("#hub-tabs a.lab-tab").innerText(), "Reality Lab");
  assert.match(await page.locator("#hub-tabs a.lab-tab").getAttribute("href"), /^reality\/lab\/$/);
  assert.equal(await page.locator("#reality-feature [data-lab-link]").innerText(), "Open the Reality Lab");
  await page.locator("#hub-tabs button[data-view]", { hasText: "Practice" }).click();
  assert.equal(await page.locator('#practice-view a[href="reality/?grade=3"]').count(), 1, "Practice links to Math Reality");
  assert.equal(await page.locator('#practice-view a[href="reality/lab/?grade=3"]').count(), 1, "Practice links to the Reality Lab");
  await page.locator("#hub-tabs button[data-view]", { hasText: "Home" }).click();

  const areas = [
    ["Learn", "#models-view", ["Model Lab", "Writing Studio"]],
    ["Practice", "#practice-view", ["Start practicing", "Fix my mistakes"]],
    ["Play", "#games-view", []],
    ["My Growth", "#path-view", []],
  ];
  for (const [name, section, expected] of areas) {
    await page.locator("#hub-tabs button", { hasText: name }).first().click();
    await page.locator(section).waitFor({ state: "visible" });
    assert.deepEqual(await current(page), [name], `${name} is the only current destination`);
    assert.deepEqual(await sub(page), expected, `${name} sub-navigation`);
  }

  // Sub-navigation keeps the destination highlighted.
  await page.locator("#hub-tabs button", { hasText: "Learn" }).click();
  await page.locator("#hub-subnav button", { hasText: "Writing Studio" }).click();
  await page.locator("#write-view").waitFor({ state: "visible" });
  assert.deepEqual(await current(page), ["Learn"]);
  await page.locator("#hub-tabs button", { hasText: "Practice" }).click();
  await page.locator("#hub-subnav button", { hasText: "Fix my mistakes" }).click();
  await page.locator("#notebook-view").waitFor({ state: "visible" });
  assert.deepEqual(await current(page), ["Practice"]);

  // Practice: one dominant action; Today's 10 starts a real session.
  await page.locator("#hub-tabs button", { hasText: "Practice" }).click();
  assert.equal(await page.locator("#practice-view .primary-action").count(), 1, "one primary action");
  await page.locator("#practice-view [data-start-daily]").click();
  await page.locator("#answer-input").waitFor({ state: "visible" });

  // Targets stay 44px tall on a phone and the row does not overflow.
  const phone = await open({ width: 390, height: 800 });
  for (const box of await phone.locator("#hub-tabs button[data-view]").evaluateAll((els) => els.map((el) => el.getBoundingClientRect()))) {
    assert.ok(box.height >= 44, `tab height ${box.height}`);
    assert.ok(box.right <= 391, "tab inside the viewport");
  }
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "no horizontal scroll");
  if (shots) await phone.screenshot({ path: `${shots}/home-390.png` });

  // Old direct links still land in the right place and highlight the right destination.
  for (const [view, destination] of [["notebook", "Practice"], ["write", "Learn"], ["models", "Learn"], ["games", "Play"], ["path", "My Growth"], ["practice", "Practice"]]) {
    const linked = await open({ width: 1280, height: 900 }, `?grade=3&profile=0&view=${view}`);
    assert.deepEqual(await current(linked), [destination], `?view=${view}`);
    await linked.close();
  }

  // Spanish names, and "Play" stays "Reproducir" on media controls while the destination is "Jugar".
  const es = await open({ width: 1280, height: 900 }, "?grade=3&profile=0", "es");
  assert.deepEqual(await es.locator("#hub-tabs button[data-view]").allInnerTexts(), ["Inicio", "Aprender", "Practicar", "Jugar", "Mi crecimiento", "Para docentes"]);
  if (shots) {
    await page.screenshot({ path: `${shots}/practice-1280.png` });
    await es.screenshot({ path: `${shots}/home-es-1280.png` });
  }
  assert.deepEqual(errors, [], "no page errors");
  console.log("hub-nav.browser: five destinations, sub-navigation, old links, Spanish, phone targets pass");
} finally {
  await browser?.close();
  await server.close();
}
