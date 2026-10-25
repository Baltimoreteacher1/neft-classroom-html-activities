// Browser check for direct model surfacing, theme/layout invariants, and linked models.
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(REPO_ROOT, `.${path}`);
  if (!file.startsWith(`${resolve(REPO_ROOT)}/`)) return void res.writeHead(403).end();
  if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
  if (!existsSync(file) || !statSync(file).isFile()) return void res.writeHead(404).end();
  res.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let checks = 0;
const screenshotDir = process.env.STUDIO_MODEL_SCREENSHOTS;
if (screenshotDir) mkdirSync(screenshotDir, { recursive: true });

async function openActivity(page, lesson, mode, kind) {
  await page.goto(
    `${origin}/math/practice-studio/${lesson}/${mode === "challenge" ? "challenge/" : ""}`,
  );
  await page.waitForFunction(() => Boolean(window.StudioRT?.api));
  const found = await page.evaluate((wanted) => {
    const api = window.StudioRT.api;
    for (let t = 1; t <= api.sections.length; t++) {
      const section = api.sections[t - 1];
      let i = section.items.findIndex((item) => item.k === "act" && item.kind === wanted);
      if (i < 0 && Array.isArray(section.pool)) {
        const pooled = section.pool.find((item) => item.k === "act" && item.kind === wanted);
        const slot = section.items.findIndex((item) => item.k === "pool");
        if (pooled && slot >= 0) {
          section.items[slot] = { ...pooled };
          i = slot;
        }
      }
      if (i >= 0) {
        api.state.idx[t] = i;
        api.selectTab(t);
        api.render(t);
        return { tab: t, index: i };
      }
    }
    return null;
  }, kind);
  assert.ok(found, `${lesson} ${mode} has ${kind}`);
  return found;
}

try {
  const representatives = [
    ["2-1", "askdots"],
    ["2-3", "countoff"],
    ["2-6", "ldiv"],
    ["2-12", "areabox"],
    ["3-3", "ratiomix"],
    ["3-7", ["convchain", "cancelit"]],
    ["5-1", "sizer"],
    ["5-6", "lab"],
    ["6-1", "barcut"],
    ["6-6", ["tiles", "plug", "cexhunt"]],
    ["7-3", ["thermo", "absbench", "dualrank", "nline"]],
    ["7-8", ["plot", "griddetect", "rectcorners", "allpoints", "reflectpredict"]],
    ["8-2", "balance"],
    ["8-5", ["ineq", "boundary", "breakeven", "gate", "sketch"]],
    ["9-2", "plot"],
  ];
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 360, height: 740 },
  ]) {
    for (const mode of ["practice", "challenge"]) {
      const context = await browser.newContext({ viewport, hasTouch: viewport.width === 360 });
      const page = await context.newPage();
      for (const [lesson, kind] of representatives) {
        await page.goto(
          `${origin}/math/practice-studio/${lesson}/${mode === "challenge" ? "challenge/" : ""}`,
        );
        await page.waitForFunction(() => Boolean(window.StudioRT?.api));
        assert.equal(
          await page.locator("body").getAttribute("data-theme"),
          "light",
          `${lesson} ${mode} keeps light theme`,
        );
        await page.locator("[data-path-model]").first().click();
        const host = page
          .locator(".tab-panel.active .act-host[data-act], .tab-panel.active .lab-item")
          .first();
        await host.waitFor({ state: "attached", timeout: 5000 }).catch(async () => {
          const diagnostic = await page.evaluate(() => ({
            tab: window.StudioRT.api.state.activeTab,
            idx: window.StudioRT.api.state.idx,
          }));
          throw new Error(
            `${lesson} direct model action did not render a widget: ${JSON.stringify(diagnostic)}`,
          );
        });
        if (kind === "lab") {
          assert.ok(await host.locator(".lab-model").count(), `${lesson} opens its lab model`);
        } else {
          const actualKind = await host.getAttribute("data-act");
          const expectedKinds = Array.isArray(kind)
            ? kind
            : lesson === "2-6"
              ? ["ldiv", "chipsort"]
              : [kind];
          assert.ok(
            expectedKinds.includes(actualKind) ||
              (lesson === "2-12" && (actualKind || (await host.locator(".lab-model").count()))) ||
              (lesson === "2-1" && (await host.locator(".lab-model").count())),
            `${lesson} opens the expected model family or its lesson lab model`,
          );
        }
        const openedKind = await host.getAttribute("data-act");
        const readModel = () =>
          host.evaluate((el) => {
            const shadow = el.querySelector(".lab-model")?.shadowRoot;
            return `${el.innerHTML}|${shadow?.innerHTML || ""}`;
          });
        const before = await readModel();
        const linkedSelector = {
          askdots: ".u2-question-data-linked",
          areabox: ".u2-decimal-area-linked",
          countoff: ".u2-histogram-median-linked",
          ldiv: ".u2-div-linked",
          faces: ".u5-solid-linked",
          wrapit: ".u5-solid-linked",
          netfold: ".u5-solid-linked",
          packcrate: ".u5-solid-linked",
          tiles: ".u6-alg-linked",
          cexhunt: ".u6-alg-linked",
          thermo: ".u7-rat-linked",
          absbench: ".u7-rat-linked",
          dualrank: ".u7-rat-linked",
          nline: ".u7-rat-linked",
          allpoints: ".u7-coord-linked",
          reflectpredict: ".u7-coord-linked",
          rectcorners: ".u7-coord-linked",
          griddetect: ".u7-coord-linked",
          balance: ".u8-eq-linked",
          boundary: ".u8-ineq-linked",
          ineq: ".u8-ineq-linked",
        }[await host.getAttribute("data-act")];
        const linkedView = linkedSelector ? host.locator(linkedSelector).first() : null;
        if (linkedView) assert.ok(await linkedView.count(), `${lesson} has ${linkedSelector}`);
        const linkedStateBefore = linkedView
          ? `${await linkedView.getAttribute("aria-label")}|${await linkedView.innerText()}|${await linkedView.innerHTML()}`
          : "";
        const linkedBefore =
          lesson === "3-7" ? await host.locator(".u3-conv-linked").innerText() : "";
        const relationBefore =
          lesson === "9-2" ? await host.locator(".u9-var-linked").innerText() : "";
        const changed = await host.evaluate((el) => {
          const root = el.querySelector(".lab-model")?.shadowRoot || el;
          if (el.getAttribute("data-act") === "askdots") {
            const choice = [...root.querySelectorAll('[role="radio"]')].find(
              (button) => button.getAttribute("aria-checked") !== "true",
            );
            if (choice) {
              choice.click();
              return true;
            }
          }
          if (el.getAttribute("data-act") === "ineq") {
            const op = root.querySelector('[data-op=">"]');
            const number = root.querySelector(".si-num");
            const ray = root.querySelector('[data-r="right"]');
            const line = root.querySelector(".si-line[tabindex]");
            const testValue = root.querySelector(".si-val:not([disabled])");
            if (op && number) {
              op.click();
              number.value = "2";
              number.dispatchEvent(new Event("input", { bubbles: true }));
              return true;
            }
            if (ray && line) {
              ray.click();
              line.focus();
              line.dispatchEvent(
                new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
              );
              line.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
              return true;
            }
            if (testValue) {
              testValue.click();
              return true;
            }
          }
          const grid = root.querySelector(".u7-grid");
          if (grid && !grid.classList.contains("done")) {
            grid.focus();
            grid.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
            grid.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
            return true;
          }
          if (el.getAttribute("data-act") === "balance") {
            const pick = root.querySelector(".sa-pick button:not([disabled])");
            if (pick) pick.click();
            const tiles = root.querySelectorAll(".sa-tile:not([disabled])");
            for (const tile of tiles) tile.click();
            if (tiles.length || pick) return true;
          }
          const button = root.querySelector("button:not([disabled])");
          if (button && !el.classList.contains("lab-item")) {
            button.click();
            return true;
          }
          const input = root.querySelector("input:not([readonly]):not([disabled])");
          if (input) {
            const min = Number(input.min || 0);
            const max = Number(input.max || 10);
            const current = Number(input.value);
            input.value = String(current < max ? current + 1 : Math.max(min, current - 1));
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
            return true;
          }
          if (button) {
            button.click();
            return true;
          }
          return false;
        });
        assert.equal(changed, true, `${lesson} exposes a model control`);
        if (linkedView && !["plot", "nline"].includes(openedKind)) {
          assert.notEqual(
            `${await linkedView.getAttribute("aria-label")}|${await linkedView.innerText()}|${await linkedView.innerHTML()}`,
            linkedStateBefore,
            `${openedKind} interaction updates its synchronized representation`,
          );
        }
        if (lesson === "3-7") {
          if (openedKind === "convchain") {
            const operation = host.getByRole("radio", { name: /step 1: multiply/i }).first();
            if (await operation.count()) await operation.click();
            const factor = host.getByRole("radio", { name: /step 1: factor/i }).first();
            if (await factor.count()) await factor.click();
          }
          assert.notEqual(
            await host.locator(".u3-conv-linked").innerText(),
            linkedBefore,
            "conversion controls update the linked equation and unit scale",
          );
        }
        if (lesson === "9-2") {
          await host.locator(".sp-plane").press("Enter");
          assert.notEqual(
            await host.locator(".u9-var-linked").innerText(),
            relationBefore,
            "coordinate interaction updates the input-output relation views",
          );
        }
        assert.notEqual(
          await readModel(),
          before,
          `${lesson} ${mode} control changes widget/model DOM`,
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          true,
          `${lesson} ${mode} has no horizontal overflow`,
        );
        checks += 3;
      }
      await openActivity(page, "3-3", mode, "ratiomix");
      const initialRatio = await page.locator(".rm-linked").first().getAttribute("aria-label");
      assert.ok(initialRatio, "ratio model is visible at the initial zero-batch state");
      const add = page.getByRole("button", { name: /add a batch/i }).first();
      await add.click();
      const first = await page.locator(".rm-linked").first().getAttribute("aria-label");
      assert.notEqual(first, initialRatio, "ratio diagram reflects the first batch");
      await add.click();
      const second = await page.locator(".rm-linked").first().getAttribute("aria-label");
      assert.notEqual(second, first, "ratio diagrams redraw when the same batch count changes");
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
        "ratio activity has no horizontal overflow",
      );
      checks += 3;
      if (screenshotDir)
        await page
          .locator(".rm-linked")
          .first()
          .screenshot({ path: join(screenshotDir, `ratio-${mode}-${viewport.width}.png`) });

      await openActivity(page, "2-6", mode, "ldiv");
      const divisionLink = page.locator(".act-host[data-act=ldiv] .u2-div-linked");
      const divisionBefore = await divisionLink.innerText();
      await page
        .locator('.act-host[data-act=ldiv] .ld-chips button[aria-pressed="false"]')
        .first()
        .click();
      assert.notEqual(
        await divisionLink.innerText(),
        divisionBefore,
        "division estimate updates linked steps",
      );
      checks++;

      await openActivity(page, "5-8", mode, "faces");
      const solidLink = page.locator(".act-host[data-act=faces] .u5-solid-linked");
      const solidBefore = await solidLink.innerText();
      await page
        .locator(".act-host[data-act=faces] .fc-step button[aria-label^=More]")
        .first()
        .click();
      assert.notEqual(
        await solidLink.innerText(),
        solidBefore,
        "face count updates the linked net and formula",
      );
      checks++;

      await openActivity(page, "6-6", mode, "tiles");
      const algebraLink = page.locator(".act-host[data-act=tiles] .u6-alg-linked");
      const algebraBefore = await algebraLink.innerText();
      await page.locator(".act-host[data-act=tiles] button:not([disabled])").first().click();
      assert.notEqual(
        await algebraLink.innerText(),
        algebraBefore,
        "tile action updates linked substitution view",
      );
      checks++;

      await openActivity(page, "7-3", mode, "absbench");
      const rationalLink = page.locator(".act-host[data-act=absbench] .u7-rat-linked");
      const rationalBefore = await rationalLink.innerText();
      await page
        .locator('.act-host[data-act=absbench] button[aria-pressed="false"]')
        .first()
        .click();
      assert.notEqual(
        await rationalLink.innerText(),
        rationalBefore,
        "rational comparison updates signed line",
      );
      checks++;

      await openActivity(page, "8-2", mode, "balance");
      const equationLink = page.locator(".act-host[data-act=balance] .u8-eq-linked");
      const equationBefore = await equationLink.innerText();
      const balanceMoves = page.locator(".act-host[data-act=balance] .sa-tile:not([disabled])");
      for (let i = 0; i < (await balanceMoves.count()); i++) {
        await balanceMoves.nth(i).click();
        if ((await equationLink.innerText()) !== equationBefore) break;
      }
      assert.notEqual(
        await equationLink.innerText(),
        equationBefore,
        "balance move updates equation steps",
      );
      checks++;

      await openActivity(page, "5-1", mode, "sizer");
      const areaBefore = await page.locator(".sz-res b").first().textContent();
      const linkedAreaBefore = await page.locator(".u5-area-linked").innerHTML();
      const figureBefore = await page
        .locator(".sz-fig polygon.sz-sh")
        .first()
        .getAttribute("points");
      const shear = page.getByRole("slider", { name: /top-edge shift/i });
      await shear.fill("2");
      const areaAfter = await page.locator(".sz-res b").first().textContent();
      const figureAfter = await page
        .locator(".sz-fig polygon.sz-sh")
        .first()
        .getAttribute("points");
      assert.equal(areaAfter, areaBefore, "shearing preserves base-times-height area");
      assert.notEqual(figureAfter, figureBefore, "shearing changes the figure");
      assert.notEqual(
        await page.locator(".u5-area-linked").innerHTML(),
        linkedAreaBefore,
        "shearing updates the equal-area ghost and linked formula panel",
      );
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        true,
        "geometry activity has no horizontal overflow",
      );
      checks += 4;
      if (screenshotDir)
        await page
          .locator(".sz-main")
          .first()
          .screenshot({ path: join(screenshotDir, `geometry-${mode}-${viewport.width}.png`) });
      for (const lesson of ["5-2", "5-3"]) {
        await openActivity(page, lesson, mode, "sizer");
        const linked = page.locator(".u5-area-linked");
        await linked.waitFor({ state: "visible" });
        const before = await linked.innerText();
        const dimension = page.locator('.act-host[data-act="sizer"] input[type="range"]').first();
        const min = Number((await dimension.getAttribute("min")) || 0);
        const max = Number((await dimension.getAttribute("max")) || 10);
        const current = Number(await dimension.inputValue());
        await dimension.fill(String(current < max ? current + 1 : Math.max(min, current - 1)));
        assert.notEqual(
          await linked.innerText(),
          before,
          `${lesson} dimensions update area composition`,
        );
        checks += 2;
      }
      for (const lesson of ["5-4", "5-5", "5-7", "5-10"]) {
        await openActivity(page, lesson, mode, "sizer");
        const linked = page.locator(
          lesson === "5-4" ? ".u5-area-linked" : ".u5-area-linked.u5-solid-linked",
        );
        await linked.waitFor({ state: "visible" });
        const before = await linked.innerHTML();
        const dimension = page.locator('.act-host[data-act="sizer"] input[type="range"]').first();
        const min = Number((await dimension.getAttribute("min")) || 0);
        const max = Number((await dimension.getAttribute("max")) || 10);
        const current = Number(await dimension.inputValue());
        await dimension.fill(String(current < max ? current + 1 : Math.max(min, current - 1)));
        assert.notEqual(
          await linked.innerHTML(),
          before,
          `${lesson} dimensions update linked geometry`,
        );
        assert.equal(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          true,
          `${lesson} linked geometry has no horizontal overflow`,
        );
        checks += 3;
      }
      await openActivity(page, "6-1", mode, "barcut");
      const fractionLink = page.locator(".u6-frac-linked");
      await fractionLink.waitFor({ state: "visible" });
      const fracBefore = await fractionLink.innerHTML();
      const cut = page.getByRole("button", { name: /cut into/i }).first();
      if (await cut.count()) await cut.click();
      assert.notEqual(
        await fractionLink.innerHTML(),
        fracBefore,
        "fraction division updates linked tape and jump diagram",
      );
      checks += 2;
      await openActivity(page, "2-1", mode, "askdots");
      const questionData = page.locator(".act-host[data-act=askdots] .u2-question-data-linked");
      await questionData.waitFor({ state: "visible" });
      const dataBefore = await questionData.getAttribute("data-values");
      await page
        .locator('.act-host[data-act="askdots"] [role="radio"][aria-checked="false"]')
        .first()
        .click();
      assert.notEqual(
        await questionData.getAttribute("data-values"),
        dataBefore,
        "question menu updates the linked six-answer distribution",
      );
      checks++;
      await openActivity(page, "2-12", mode, "areabox");
      const decimalArea = page.locator(".act-host[data-act=areabox] .u2-decimal-area-linked");
      await decimalArea.waitFor({ state: "visible" });
      const factorsBefore = await decimalArea.getAttribute("data-factors");
      await page.locator('.act-host[data-act="areabox"] .ab-st button').nth(1).click();
      assert.notEqual(
        await decimalArea.getAttribute("data-factors"),
        factorsBefore,
        "decimal area dimension updates the linked grid and product",
      );
      checks++;
      await context.close();
    }
  }
  console.log(
    `studio linked models browser: ${checks} checks across both modes and two viewport sizes passed.`,
  );
} finally {
  await browser.close();
  server.close();
}
