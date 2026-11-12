// Math Reality in a real browser: each grade band's seven-step journey through the actual controls, misconception
// repair, resume after reload, the idea interpreter, Spanish, keyboard use, axe at three widths, phone overflow.
// Set REALITY_SHOTS=/dir to keep screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";

const shots = process.env.REALITY_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/reality/`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ headless: true });
  const open = async (query, viewport = { width: 1280, height: 900 }, context = null) => {
    const page = await (context ?? (await browser.newContext({ viewport }))).newPage();
    page.on("pageerror", (e) => errors.push(`${query}: ${e.message}`));
    page.on("console", (m) => m.type() === "error" && errors.push(`${query}: ${m.text()}`));
    await page.goto(`${base}${query}`, { waitUntil: "networkidle" });
    return page;
  };
  const shot = async (page, name) => {
    if (!shots) return;
    await page.waitForTimeout(500); // let the camera finish easing
    await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
  };
  const setNum = async (page, label, value) => {
    const box = page.getByLabel(label, { exact: true }).first();
    await box.fill(String(value));
    await box.dispatchEvent("change");
  };
  const press = (page, name) => page.getByRole("button", { name, exact: false }).first().click();
  const step = (page) => page.locator("#rl-step-title .rl-kicker").textContent();
  const prompt = (page) => page.locator("#rl-coach .rl-line").first().innerText();
  const nums = (text) => [...text.matchAll(/\d[\d,]*/g)].map((m) => Number(m[0].replaceAll(",", "")));
  const answerBox = async (page, value) => {
    await page.locator("#rl-answer").fill(String(value));
    await page.getByRole("button", { name: "Check", exact: true }).click();
  };
  const finish = async (page) => {
    await press(page, "Next: reflect");
    await page.locator("#rl-reflect").fill("I noticed the pattern.");
    await press(page, "Finish the mission");
    assert.match(await step(page), /Mission complete/i);
  };

  // ---- Grade 2: equal groups ------------------------------------------------------------------------------------
  {
    const page = await open("?world=stadium&grade=2");
    assert.match(await step(page), /Step 1 of 7/);
    assert.equal(await page.locator("#rl-controls .rl-scale").count(), 0, "a Grade 2 student sees no scale controls");
    assert.equal(await page.locator("#rl-controls .rl-control").count(), 2, "only groups and seats per group");
    await setNum(page, "Groups", 4);
    await setNum(page, "Seats in each group", 5);
    await press(page, "Next: predict");
    await shot(page, "g2-predict");
    await press(page, "25 seats");
    await press(page, "Increase Groups");
    assert.match(await step(page), /Step 4 of 7/);
    assert.match(await page.locator("#rl-coach").innerText(), /Seats went from 20 to 25/);
    await press(page, "Next: explain why");
    await press(page, "Every group has the same number of seats");
    await press(page, "Next: try a new one");
    const target = nums(await prompt(page))[0];
    assert.ok([12, 18, 24, 30].includes(target), `a build target (${target})`);
    await setNum(page, "Groups", 3);
    await setNum(page, "Seats in each group", target / 3);
    await shot(page, "g2-apply");
    await press(page, "Check my stands");
    await finish(page);
    await shot(page, "g2-done");
    await page.close();
  }

  // ---- Grade 4: area (wrong reason first, then repair) ----------------------------------------------------------
  {
    const page = await open("?world=stadium&grade=4");
    await setNum(page, "Length (m)", 30);
    await setNum(page, "Width (m)", 20);
    await press(page, "Next: predict");
    await press(page, "4 times as big");
    await setNum(page, "Length (m)", 60);
    assert.match(await step(page), /Step 4 of 7/);
    const observe = await page.locator("#rl-coach").innerText();
    assert.match(observe, /Area went from 600 m² to 1,200 m²/);
    assert.match(observe, /You predicted 4 times as big/);
    assert.match(observe, /Only the length was doubled/, "targeted repair for the doubled-both confusion");
    await press(page, "Next: explain why");
    await press(page, "Only the perimeter changes");
    assert.match(await page.locator("#rl-coach [data-feedback]").innerText(), /Not quite/);
    assert.equal(await page.getByRole("button", { name: "Next: try a new one" }).count(), 0, "no way forward on a wrong reason");
    await press(page, "Twice as long means twice as many rows");
    await press(page, "Next: try a new one");
    const [l, w, k] = nums(await prompt(page));
    await page.getByRole("button", { name: "Give me a hint" }).click();
    await answerBox(page, k * l * w + 1);
    assert.match(await page.locator("#rl-coach [data-feedback]").innerText(), /Not quite/);
    assert.equal(await page.locator("#rl-coach .rl-hints li").count(), 1);
    await page.getByRole("button", { name: "Try another problem" }).click();
    const [l2, w2, k2] = nums(await prompt(page));
    assert.ok(l2 !== l || w2 !== w || k2 !== k, "a different problem");
    await answerBox(page, k2 * l2 * w2);
    assert.match(await page.locator("#rl-coach").innerText(), /Correct\. You solved it on your own/);
    await finish(page);
    await page.close();
  }

  // ---- Grade 6: ratio ---------------------------------------------------------------------------------------------
  {
    const page = await open("?world=stadium&grade=6");
    await setNum(page, "Tickets sold", 30);
    await press(page, "Next: predict");
    await shot(page, "g6-predict");
    await press(page, "60 seats");
    await setNum(page, "Sections", 8);
    assert.match(await step(page), /Step 3 of 7/, "capacity doubled but tickets not yet: still experimenting");
    await setNum(page, "Tickets sold", 60);
    assert.match(await step(page), /Step 4 of 7/);
    assert.match(await page.locator("#rl-reps").innerText(), /60 ÷ 80 = 3\/4 = 75%/);
    await shot(page, "g6-observe");
    await press(page, "Next: explain why");
    await press(page, "Doubling the seats and the tickets sold");
    await press(page, "Next: try a new one");
    const [cap, pct] = nums(await prompt(page));
    assert.match(await page.locator("#rl-reps").innerText(), /hidden/i, "answer-bearing numbers are hidden before the first try");
    await answerBox(page, (cap * pct) / 100);
    await finish(page);
    await page.close();
  }

  // ---- Grade 7: scaling, then resume mid-journey -------------------------------------------------------------------
  {
    const device = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    let page = await open("?world=stadium&grade=7", undefined, device);
    await setNum(page, "Length (m)", 40);
    await setNum(page, "Width (m)", 30);
    await press(page, "Next: predict");
    await press(page, "4 times as big");
    await press(page, "Make both sides ×2");
    assert.match(await step(page), /Step 4 of 7/);
    assert.match(await page.locator("#rl-coach").innerText(), /Your prediction matched/);
    await press(page, "Next: explain why");
    await page.close();
    page = await open("?world=stadium&grade=7", undefined, device); // a fresh tab on the same device
    assert.match(await step(page), /Step 5 of 7/, "resumes on the Explain step");
    assert.match(await page.locator("#rl-stage").getAttribute("aria-label"), /80 m by 60 m/, "the doubled field is still there");
    assert.equal(await page.locator(".rl-crumbs li.is-done").count(), 4, "four steps show as done after resume");
    // The Lab's Home card reflects the unfinished world on the same device.
    const lab = await device.newPage();
    await lab.goto(`${base}../lab.html?grade=7`, { waitUntil: "networkidle" });
    assert.equal(await lab.locator("#reality-feature [data-reality-link]").innerText(), "Continue your world");
    await lab.close();
    await press(page, "The length is multiplied by 2");
    await press(page, "Next: try a new one");
    const [l, w, k] = nums(await prompt(page));
    await answerBox(page, k * k * l * w);
    await finish(page);
    // Finished work survives a reload and can be downloaded without a name.
    await page.reload({ waitUntil: "networkidle" });
    assert.match(await step(page), /Mission complete/i);
    const [download] = await Promise.all([page.waitForEvent("download"), press(page, "Download my work")]);
    const body = JSON.parse(await (await import("node:fs/promises")).readFile(await download.path(), "utf8"));
    assert.equal(body.kind, "math-reality-work");
    assert.equal(body.missions.length, 1);
    assert.equal(body.missions[0].evidence.apply.independent, true);
    assert.equal(body.missions[0].evidence.reflection.graded, false);
    assert.doesNotMatch(JSON.stringify(body), /"(name|email)"/, "no personal fields");
    await page.close();
  }

  // ---- Grade 8: linear cost ---------------------------------------------------------------------------------------
  {
    const page = await open("?world=stadium&grade=8");
    await setNum(page, "Length (m)", 40);
    await setNum(page, "Width (m)", 20);
    await press(page, "Next: predict");
    await press(page, "$500");
    await setNum(page, "Sections", 7);
    await setNum(page, "Seats in each section", 40);
    assert.match(await step(page), /Step 4 of 7/);
    assert.match(await page.locator("#rl-reps").innerText(), /cost = 16,000 \+ 50 × seats/);
    await shot(page, "g8-observe");
    await press(page, "Next: explain why");
    await press(page, "50 is the cost of each extra seat");
    await press(page, "Next: try a new one");
    const text = await prompt(page);
    const [l, w, budget] = nums(text.replace(/\$20|\$50/g, ""));
    await answerBox(page, Math.floor((budget - l * w * 20) / 50));
    await finish(page);
    await page.close();
  }

  // ---- Idea interpreter: honest about what exists -------------------------------------------------------------------
  {
    const page = await open("?grade=6");
    const ask = async (text) => {
      await page.locator("#rl-idea").fill(text);
      await page.getByRole("button", { name: "Go" }).click();
    };
    await ask("I want to open a pizza restaurant");
    assert.match(await page.locator("#rl-msg-host").innerText(), /not built yet, so I cannot simulate it/);
    assert.equal(await page.locator("#rl-stage").count(), 0, "no world is faked for pizza");
    await ask("design a garden");
    assert.match(await page.locator("#rl-msg-host").innerText(), /closest one I have is the Soccer Stadium/);
    await ask("zzz");
    assert.match(await page.locator("#rl-msg-host").innerText(), /could not match/);
    assert.equal(await page.locator(".rl-world-card.is-soon button").count(), 0, "unbuilt worlds have no play button");
    await ask("I want to build a soccer stadium");
    await page.locator("#rl-stage").waitFor();
    assert.match(await step(page), /Step 1 of 7/);
    await page.close();
  }

  // ---- Spanish, keyboard, axe at three widths, phone overflow ----------------------------------------------------
  {
    const page = await open("?grade=7");
    await page.getByRole("button", { name: "Español" }).click();
    assert.match(await page.locator(".rl-ask-label").innerText(), /¿Qué quieres crear o explorar hoy\?/);
    await page.locator('button[data-world="stadium"]').click();
    await page.locator("#rl-stage").waitFor();
    assert.match(await page.locator("#rl-coach").innerText(), /paso 1 de 7/i);
    assert.match(await page.locator("#rl-coach").innerText(), /Ajusta la cancha a 40 m de largo y 30 m de ancho/);
    await page.close();
  }
  {
    const page = await open("?world=stadium&grade=7");
    // Keyboard only: focus the length plus button and press it twice (Enter), then Tab to the next control.
    await page.getByRole("button", { name: "Increase Length (m)" }).focus();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    assert.equal(await page.getByLabel("Length (m)", { exact: true }).first().inputValue(), "30", "20 m plus two 5 m steps by keyboard");
    await page.close();
  }
  for (const [name, viewport] of [["desktop", { width: 1280, height: 900 }], ["tablet", { width: 820, height: 1100 }], ["phone", { width: 390, height: 844 }]]) {
    for (const query of ["?grade=7", "?world=stadium&grade=7", "?world=stadium&grade=2", "?world=stadium&grade=8"]) {
      const page = await open(query, viewport);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, `${name} ${query}: no horizontal scroll`);
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
      const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      assert.deepEqual(bad.map((v) => `${v.id} ${v.nodes[0].target.join(" ")}`), [], `${name} ${query}: axe serious/critical`);
      if (name === "phone") for (const box of await page.locator("button:visible").evaluateAll((els) => els.map((e) => [e.textContent.trim(), e.getBoundingClientRect().height]))) assert.ok(box[1] >= 40, `${name}: "${box[0]}" is ${box[1]}px tall`);
      if (name !== "tablet") await shot(page, `${name}-${query.replace(/[^a-z0-9]/gi, "_")}`);
      await page.close();
    }
  }
  assert.deepEqual(errors, [], "no console or page errors");
  console.log("reality.browser: five grade-band journeys, repair, resume, download, idea interpreter, Spanish, keyboard, axe x3 widths passed");
} finally {
  await browser?.close();
  await server.close();
}
