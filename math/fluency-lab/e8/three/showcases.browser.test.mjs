import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import * as THREE from "three";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../../tools/lib/curriculum-source.mjs";

const shots = process.env.THREE_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`;
const browser = await chromium.launch();
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

async function open(query, viewport = { width: 1440, height: 900 }, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (error) => page.errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") page.errors.push(message.text()); });
  await page.addInitScript(() => localStorage.setItem("ewl-fluency-tour-seen", "1"));
  await page.goto(`${base}?${query}`, { waitUntil: "networkidle" });
  await page.locator(".e8ml").waitFor({ timeout: 8000 });
  return page;
}

async function choose(page, name) {
  await page.locator(".e8ml-chip", { hasText: name }).click();
  await page.locator(".e8ml-three-stage").waitFor({ timeout: 12000 });
  await page.locator(".e8ml-three-canvas").waitFor({ state: "visible", timeout: 12000 });
}

async function tapCanvasAt(canvas, point) {
  await canvas.evaluate((canvasElement, position) => {
    const rect = canvasElement.getBoundingClientRect();
    const init = { bubbles: true, pointerId: 1, pointerType: "mouse", button: 0, clientX: rect.left + position.x, clientY: rect.top + position.y };
    canvasElement.dispatchEvent(new PointerEvent("pointerdown", init));
    canvasElement.dispatchEvent(new PointerEvent("pointerup", init));
  }, point);
}

try {
  // Fraction construction: accessible part actions and direct canvas picks update the exact same fraction state.
  {
    const page = await open("grade=4&view=models");
    await choose(page, "Fraction bar");
    check(await page.locator('.e8ml-three-stage[data-three-experience="fraction-construction"]').count() === 1, "fraction scene did not mount");
    let equation = await page.locator(".e8ml-eq").innerText();
    await page.locator(".e8ml-three-parts summary").click();
    await page.getByRole("button", { name: /Part 1 of/ }).click();
    await page.waitForFunction((before) => document.querySelector(".e8ml-eq")?.textContent !== before, equation);
    equation = await page.locator(".e8ml-eq").innerText();
    check(await page.locator('.e8ml-three-piece[data-fraction-piece="0"]').getAttribute("aria-pressed") === "false", "accessible piece did not reflect model state");

    const canvas = page.locator(".e8ml-three-canvas");
    if (shots) await page.screenshot({ path: `${shots}/fraction-initial.png`, fullPage: true });
    const canvasBox = await canvas.boundingBox();
    const count = await page.locator(".e8ml-three-piece").count();
    const camera = new THREE.PerspectiveCamera(39, canvasBox.width / canvasBox.height, 0.1, 60);
    camera.position.set(5.4, 4.1, 7.2);
    camera.lookAt(0, 0.45, 0);
    camera.updateMatrixWorld();
    const target = new THREE.Vector3(-2.5 + (5 / count) * 0.5, 0.08, 0);
    target.project(camera);
    const hitPoint = { x: ((target.x + 1) / 2) * canvasBox.width, y: ((1 - target.y) / 2) * canvasBox.height };
    await tapCanvasAt(canvas, hitPoint);
    await page.waitForFunction((before) => document.querySelector(".e8ml-eq")?.textContent !== before, equation, { timeout: 5000 });
    check((await page.locator(".e8ml-eq").innerText()) !== equation, "a canvas tap did not change the fraction");
    await page.locator('[data-stage-action="fraction-refine"]').click();
    check((await page.locator(".e8ml-eq").innerText()).includes("="), "equivalent-fraction action did not show equivalence");
    await page.locator('[data-stage-action="top"]').click();
    await page.locator('[data-stage-action="reset-view"]').click();

    const axe = await new AxeBuilder({ page }).include(".e8ml-three-stage").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    check(!axe.violations.some((v) => ["serious", "critical"].includes(v.impact)), `fraction scene axe: ${axe.violations.map((v) => v.id).join(", ")}`);
    const box = await canvas.boundingBox();
    check(Boolean(box && box.height >= 295), "fraction canvas did not adapt to the viewport");
    if (shots) await page.screenshot({ path: `${shots}/fraction-desktop.png`, fullPage: true });
    check(page.errors.length === 0, `fraction page errors: ${page.errors.join("; ")}`);
    await page.context().close();
  }

  // Volume construction: scene controls alter prism dimensions and exact volume; separated layers remain reversible.
  {
    const page = await open("grade=5&view=models", { width: 1280, height: 900 });
    await choose(page, "Prism volume");
    const before = await page.locator(".e8ml-eq").innerText();
    const heightBefore = await page.locator(".e8ml-three-dimensions span").nth(2).locator("strong").innerText();
    await page.locator('[data-stage-action="volume-add-height"]').click();
    await page.waitForFunction((value) => document.querySelector(".e8ml-three-dimensions span:nth-child(3) strong")?.textContent !== value, heightBefore);
    check((await page.locator(".e8ml-eq").innerText()) !== before, "volume equation did not update with a new layer");
    await page.locator('[data-stage-action="volume-explode"]').click();
    check(await page.locator('[data-stage-action="volume-explode"]').getAttribute("aria-pressed") === "true", "layer separation state did not update");
    await page.locator('[data-stage-action="volume-add-length"]').click();
    check(await page.locator(".e8ml-three-dimensions span").first().locator("strong").innerText() !== "", "length dimension label missing");
    if (shots) await page.screenshot({ path: `${shots}/volume-desktop.png`, fullPage: true });
    check(page.errors.length === 0, `volume page errors: ${page.errors.join("; ")}`);
    await page.context().close();
  }

  // Algebra reactor: its direct scene actions use the exact reducer, and the same lesson controls remain available.
  {
    const page = await open("grade=7&view=models", { width: 1280, height: 900 });
    await choose(page, "Balance scale for equations");
    let equation = await page.locator(".e8ml-eq").innerText();
    await page.locator('[data-stage-action="balance-add-one"]').click();
    await page.waitForFunction((before) => document.querySelector(".e8ml-eq")?.textContent !== before, equation);
    equation = await page.locator(".e8ml-eq").innerText();
    await page.locator('[data-stage-action="balance-double"]').click();
    check((await page.locator(".e8ml-eq").innerText()) !== equation, "equation did not update after a valid transformation");
    check(await page.locator(".e8ml-visual").getAttribute("aria-label")?.then((value) => value.includes("Balance scale")), "2D accessible equation model is missing");
    if (shots) await page.screenshot({ path: `${shots}/balance-desktop.png`, fullPage: true });
    check(page.errors.length === 0, `balance page errors: ${page.errors.join("; ")}`);
    await page.context().close();
  }

  // Mobile, Spanish and touch: the viewer stays inside the viewport; the 2D control path remains usable.
  {
    const page = await open("grade=4&view=models&lang=es", { width: 390, height: 844 }, { hasTouch: true });
    await choose(page, "Barra de fracciones");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(overflow <= 1, `phone: horizontal overflow ${overflow}px`);
    check((await page.locator(".e8ml-three-viewport").evaluate((el) => el.getBoundingClientRect().height)) === 300, "phone scene height did not reduce");
    await page.locator(".e8ml-2d-fallback summary").click();
    await page.locator('.e8ml-2d-model .cell[data-i="0"]').click();
    check(page.errors.length === 0, `Spanish/touch page errors: ${page.errors.join("; ")}`);
    if (shots) await page.screenshot({ path: `${shots}/fraction-phone-es.png`, fullPage: true });
    await page.context().close();
  }

  // WebGL failure is honest and keeps the 2D lesson interactive.
  {
    const page = await open("grade=4&view=models", { width: 1000, height: 800 });
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (["webgl", "webgl2", "experimental-webgl"].includes(type)) return null;
        return getContext.call(this, type, ...args);
      };
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".e8ml-chip", { hasText: "Fraction bar" }).click();
    await page.locator(".e8ml-three-shell[data-renderer=fallback]").waitFor({ timeout: 12000 });
    check(await page.locator(".e8ml-2d-fallback").evaluate((el) => el.open), "2D fallback should open when WebGL is unavailable");
    check(await page.locator(".e8ml-2d-model svg").count() > 0, "2D fallback model is missing");
    await page.locator('.e8ml-visual .cell[data-i="0"]').click();
    check((await page.locator(".e8ml-eq").innerText()).length > 0, "2D fallback interaction did not remain available");
    await page.context().close();
  }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(`${failures.length} 3D showcase browser failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("3D showcases in Chromium: fraction construction, volume layers, algebra transformations, mobile Spanish, accessibility and WebGL fallback passed.");
