#!/usr/bin/env node
/**
 * verify-small-group-studio.mjs — the lesson-by-lesson ledger for the Studio 2.0 rebuild.
 *
 * For EVERY small-group studio route (Group 1, Group 2, catch-up) and its Practice Set it
 * opens the page in a real browser at four sizes (desktop 1920×1080, Chromebook 1366×768,
 * tablet 820×1180, phone 390×844) and asserts what a screenshot cannot:
 *
 *   studio   — five stages named in the pathway (small-group-pathway.js), no page error, no
 *              console error, no horizontal overflow, every stage opens with content, every
 *              stepper shows exactly one task, tabs reachable at the phone size
 *   tools    — (Chromebook only) the first manipulative in Your Turn opens, renders controls
 *              and a readout, and responds to its own control
 *   loop     — (Chromebook only) a wrong answer shows a specific message and the Explain box;
 *              the right answer settles the card; a reload restores it (progress persists)
 *   practice — the Practice Set renders its masthead and does not overflow
 *
 * Writes reports/small-group-studio-ledger.md (a row per lesson) and exits 1 on any failure.
 * A sweep that visits fewer routes than it should FAILS: an empty sweep verifies nothing.
 *
 *   node tools/verify-small-group-studio.mjs [--base http://localhost:4731] [--ids 3-1-group1,3-1-group2]
 *                                            [--viewports all|chromebook] [--jobs 4]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { STAGES } from "@eduwonderlab/engine/core/small-group-pathway.js";
import { chromium } from "playwright";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.split("=")[1];
  const at = process.argv.indexOf(`--${name}`);
  return at > -1 ? process.argv[at + 1] : fallback;
};
const BASE = arg("base", "http://localhost:4731").replace(/\/$/, "");
const JOBS = Number(arg("jobs", 4));
const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  chromebook: { width: 1366, height: 768 },
  tablet: { width: 820, height: 1180 },
  phone: { width: 390, height: 844 },
};
const viewportNames =
  arg("viewports", "all") === "all" ? Object.keys(VIEWPORTS) : arg("viewports").split(",");
const DEEP = "chromebook";

const manifest = JSON.parse(readFileSync(join(ROOT, "data/small-group-variants.json"), "utf8"));
const allIds = Object.entries(manifest.bases).flatMap(([base, v]) =>
  v.variants.map((s) => `${base}-${s}`),
);
const ids = arg("ids") ? arg("ids").split(",") : allIds;
const MIN_ROUTES = arg("ids") ? 1 : 200;

const labelsFor = (id) =>
  STAGES.filter((s) => !(/-catchup$/.test(id) && s.key === "together")).map((s) => s.label);
/** Catch-up studios have no guided "Solve Together" practice; every other stage is shared. */
const tabByLabel = (page, label) =>
  page.locator('.sg-tabs [role="tab"]').filter({ hasText: label }).first();

async function studioChecks(page, id, errors) {
  const notes = [];
  const res = await page.goto(`${BASE}/lessons/${id}/`, { waitUntil: "load" });
  if (!res || res.status() >= 400) return [`HTTP ${res?.status()}`];
  await page.waitForSelector('.sg-tabs [role="tab"]', { timeout: 15000 }).catch(() => {});
  const tabs = await page.$$eval('.sg-tabs [role="tab"]', (n) =>
    n.map((t) => (t.querySelector(".lbl")?.childNodes[0]?.textContent || "").trim()),
  );
  if (tabs.join("|") !== labelsFor(id).join("|"))
    notes.push(`stages: ${tabs.join(", ") || "none"}`);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  if (overflow > 1) notes.push(`overflow ${overflow}px`);

  for (let i = 0; i < tabs.length; i++) {
    await page.locator('.sg-tabs [role="tab"]').nth(i).click();
    const m = await page.evaluate((index) => {
      const panel = [...document.querySelectorAll(".sg-panel")][index];
      if (!panel || panel.hidden) return { ok: false };
      const steppers = [...panel.querySelectorAll(".sg-stepper")].filter((s) =>
        s.querySelector(".sg-task"),
      );
      return {
        ok: true,
        text: panel.textContent.trim().length,
        badStepper: steppers.some(
          (s) => [...s.querySelectorAll(".sg-task")].filter((t) => !t.hidden).length !== 1,
        ),
        wide: panel.scrollWidth - document.documentElement.clientWidth,
      };
    }, i);
    if (!m.ok) notes.push(`stage ${i + 1} did not open`);
    else {
      if (m.text < 40) notes.push(`stage ${i + 1} empty`);
      if (m.badStepper) notes.push(`stage ${i + 1} stepper shows ≠1 task`);
      if (m.wide > 1) notes.push(`stage ${i + 1} overflows ${m.wide}px`);
    }
  }
  if (errors.length)
    notes.push(`errors: ${[...new Set(errors)].slice(0, 2).join(" | ").slice(0, 160)}`);
  return notes;
}

/** Manipulative: open the first one in Your Turn, drive its first control, require a readout. */
async function toolChecks(page) {
  await tabByLabel(page, "Your Turn").click();
  const toggle = page
    .locator("div.sg-panel:not([hidden]) .sg-task:not([hidden]) .sgm-toggle")
    .first();
  if (!(await toggle.count())) return { notes: [], tool: "—" };
  const kind = (await toggle.textContent()).replace(/^.*model:\s*/, "").trim();
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  const body = toggle.locator("xpath=following-sibling::div[contains(@class,'sgm-body')]");
  await body.waitFor({ state: "visible", timeout: 4000 }).catch(() => {});
  const probe = await body.evaluate((n) => ({
    controls: n.querySelectorAll("button,input,svg,[role=slider]").length,
    read: (n.querySelector(".sgm-read")?.textContent || "").trim(),
  }));
  const notes = [];
  if (probe.controls < 2) notes.push(`${kind}: tool rendered no controls`);
  if (!probe.read && !/Factor tree/.test(kind)) notes.push(`${kind}: no readout`);
  // Drive it: press the first enabled control that changes the readout.
  const before = probe.read;
  const control = body.locator("button:not([disabled]):not(.sgm-toggle)").first();
  if (await control.count()) {
    await control.click({ trial: false }).catch(() => {});
    const after = await body
      .locator(".sgm-read")
      .first()
      .textContent()
      .catch(() => before);
    if (
      before &&
      after === before &&
      !/Undo|Clear|Reset|Start over|Back|batch/i.test(await control.textContent())
    )
      notes.push(`${kind}: first control changed nothing`);
  }
  return { notes, tool: kind };
}

/** Attempt → diagnose → revise → settle → reload keeps it. Uses the lesson's own config answers. */
async function loopChecks(page, id) {
  const cfg = await (await page.request.get(`${BASE}/lessons/${id}/config.json`)).json();
  const it = cfg.launch?.practice?.onMyOwn?.[0] || cfg.launch?.practice?.practice?.[0];
  if (!it) return ["no On My Own item"];
  await tabByLabel(page, "Your Turn").click();
  const card = page.locator("div.sg-panel:not([hidden]) .sg-task:not([hidden]) .sgp-card").first();
  const notes = [];
  if (it.choices) {
    const wrong = it.choices.findIndex((_, i) => i !== it.correct);
    await card.locator(".sgp-choice").nth(wrong).click();
    if (!(await card.locator(".sgb-feedback.is-wrong").count()))
      notes.push("wrong pick gave no feedback");
    await card.locator(".sgp-choice").nth(it.correct).click();
  } else {
    const input = card.locator(".sgb-input");
    await input.fill("0.123");
    await card.locator(".sgb-submit").click();
    const fb = (await card.locator(".sgb-feedback").textContent()).trim();
    if (!fb) notes.push("wrong answer gave no feedback");
    if (!(await card.locator(".sgp-revise").isVisible()))
      notes.push("Explain/Revise box missing after a miss");
    await input.fill(String(it.accept?.[0] ?? it.answer));
    await card.locator(".sgb-submit").click();
  }
  if (!(await card.evaluate((n) => n.classList.contains("is-right"))))
    notes.push("right answer did not settle the card");
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector('.sg-tabs [role="tab"]');
  await tabByLabel(page, "Your Turn").click();
  await page
    .waitForSelector("div.sg-panel:not([hidden]) .sgp-card.is-right", {
      state: "attached",
      timeout: 3000,
    })
    .catch(() => {});
  const restored = await page.locator("div.sg-panel:not([hidden]) .sgp-card.is-right").count();
  if (!restored) {
    const dbg = await page.evaluate(() => ({
      cards: [...document.querySelectorAll(".sgp-card")].slice(0, 2).map((c) => c.className),
      store: Object.entries(localStorage)
        .filter(([k]) => /nt-sg/.test(k))
        .map(
          ([k, v]) =>
            `${k}:${JSON.stringify(Object.fromEntries(Object.entries(JSON.parse(v)).filter(([a]) => /^p[oct]-|lastTab/.test(a))))}`,
        ),
    }));
    notes.push(`progress not restored after reload ${JSON.stringify(dbg)}`);
  }
  return notes;
}

async function practiceChecks(page, id, errors) {
  const notes = [];
  const res = await page.goto(`${BASE}/lessons/${id}/practice.html`, { waitUntil: "load" });
  if (!res || res.status() >= 400) return [`practice HTTP ${res?.status()}`];
  const m = await page.evaluate(() => ({
    head: !!document.querySelector(".sp-head"),
    pages: document.querySelectorAll(".sp-page").length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  if (!m.head && !m.pages) notes.push("practice set rendered no pages");
  if (m.overflow > 1) notes.push(`practice overflows ${m.overflow}px`);
  if (errors.length) notes.push(`practice errors: ${[...new Set(errors)][0].slice(0, 120)}`);
  return notes;
}

async function runLesson(browser, id, only = viewportNames) {
  const row = { id, viewports: {}, tool: "—", loop: "ok", practice: "ok" };
  for (const name of only) {
    const ctx = await browser.newContext({ viewport: VIEWPORTS[name] });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e.message || e)));
    page.on("console", (m) => {
      const t = m.text();
      if (
        m.type() === "error" &&
        !/web-vitals|Failed to load resource|favicon|sw\.js|ERR_ABORTED/i.test(t)
      )
        errors.push(t);
    });
    let notes = [];
    try {
      notes = await studioChecks(page, id, errors);
      if (name === DEEP || viewportNames.length === 1) {
        const t = await toolChecks(page);
        row.tool = t.tool;
        notes.push(...t.notes);
        const loop = await loopChecks(page, id);
        if (loop.length) {
          row.loop = loop.join("; ");
          notes.push(...loop.map((l) => `loop: ${l}`));
        }
        const pe = [];
        page.removeAllListeners("pageerror");
        page.on("pageerror", (e) => pe.push(String(e.message || e)));
        const pn = await practiceChecks(page, id, pe);
        if (pn.length) {
          row.practice = pn.join("; ");
          notes.push(...pn);
        }
      }
    } catch (e) {
      notes.push(
        `crashed: ${String(e.message || e)
          .split("\n")[0]
          .slice(0, 140)}`,
      );
    }
    // One retry for an infrastructure flake (reset socket, slow navigation) — a real defect repeats.
    if (notes.some((n) => /^(crashed:|loop:)/.test(n)) && !row.retried?.[name]) {
      row.retried = { ...row.retried, [name]: true };
      await ctx.close();
      row.viewports[name] = (await runLesson(browser, id, [name])).viewports[name];
      continue;
    }
    row.viewports[name] = notes;
    await ctx.close();
  }
  return row;
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (e) {
    skipExit(`no browser available (${String(e.message).split("\n")[0]})`);
    return;
  }
  const rows = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: JOBS }, async () => {
      while (next < ids.length) {
        const id = ids[next++];
        rows.push(await runLesson(browser, id));
        if (rows.length % 20 === 0) console.log(`  …${rows.length}/${ids.length}`);
      }
    }),
  );
  await browser.close();
  rows.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  const failing = rows.filter((r) => Object.values(r.viewports).some((n) => n.length));
  const md = [
    "# Small-group Studio 2.0 — verification ledger",
    "",
    `Base: ${BASE} · routes: ${rows.length} · viewports: ${viewportNames.join(", ")} · generated by tools/verify-small-group-studio.mjs`,
    "",
    `**${rows.length - failing.length} of ${rows.length} routes pass every check.**`,
    "",
    `| Route | ${viewportNames.join(" | ")} | Tool | Loop | Practice set |`,
    `| --- | ${viewportNames.map(() => "---").join(" | ")} | --- | --- | --- |`,
    ...rows.map(
      (r) =>
        `| ${r.id} | ${viewportNames.map((v) => (r.viewports[v].length ? `✗ ${r.viewports[v].join("; ")}` : "✓")).join(" | ")} | ${r.tool} | ${r.loop === "ok" ? "✓" : "✗"} | ${r.practice === "ok" ? "✓" : "✗"} |`,
    ),
    "",
  ].join("\n");
  mkdirSync(join(ROOT, "reports"), { recursive: true });
  writeFileSync(join(ROOT, "reports/small-group-studio-ledger.md"), md);
  console.log(
    `ledger: reports/small-group-studio-ledger.md — ${rows.length} routes, ${failing.length} with findings`,
  );
  for (const r of failing.slice(0, 25))
    for (const [v, n] of Object.entries(r.viewports))
      if (n.length) console.error(`  ${r.id} @${v}: ${n.join("; ")}`);
  if (rows.length < MIN_ROUTES) {
    console.error(`FAIL: visited ${rows.length} routes, expected at least ${MIN_ROUTES}`);
    process.exit(1);
  }
  if (failing.length) process.exit(1);
  console.log(
    `PASS verify-small-group-studio — ${rows.length} routes × ${viewportNames.length} viewports`,
  );
}

main();
