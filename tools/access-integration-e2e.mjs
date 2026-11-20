#!/usr/bin/env node
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { serveAccess } from "./lib/access-serve.mjs";

const local = process.env.BASE ? null : await serveAccess();
const base = process.env.BASE || local.base;
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  permissions: ["microphone"],
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => {
  if (process.env.BASE || !/web-vitals/.test(e.message)) errors.push(e.message);
});
const go = (path) => page.goto(`${base}${path}`);
const axe = async () => {
  const result = await new AxeBuilder({ page }).include("main").analyze();
  assert.deepEqual(
    result.violations.map((v) => v.id),
    [],
  );
};

try {
  await go("/access-practice-lab/packs");
  await page.getByRole("heading", { name: "Newcomer resources" }).waitFor();
  await page.getByRole("link", { name: /Survival vocabulary/ }).click();
  await page.getByRole("heading", { name: "Survival vocabulary" }).waitFor();
  assert.equal(await page.locator(".lp-pack-words article").count(), 12);
  await page.goto(`${base}/access-practice-lab/packs/all-about-me`);
  await page.locator('[data-about-me-field="name-card:0"]').fill("A. Example");
  await page.getByRole("button", { name: "Save to this device" }).first().click();
  assert.equal(
    await page.locator('[data-about-me-field="name-card:0"]').inputValue(),
    "A. Example",
  );
  await page.goto(`${base}/access-practice-lab/packs/speaking-listening-cards`);
  assert.equal(await page.locator(".pg-strategy").count(), 0);
  assert.equal(await page.locator(".lp-extended-grid article[data-pack-card-band]").count(), 36);
  await page.selectOption("[data-pack-band]", "6-8");
  assert.equal(
    await page.locator(".lp-extended-grid article[data-pack-card-band]:not([hidden])").count(),
    12,
  );
  await page.goto(`${base}/access-practice-lab/program/profiles`);
  await page.locator("[data-profile-form]").waitFor();
  await page.locator('[name="alias"]').fill("Demo Alias");
  await page.locator('[name="grade"]').fill("5");
  await page.getByRole("button", { name: "Save locally" }).click();
  await page.getByRole("heading", { name: /Demo Alias/ }).waitFor();
  await page.goto(`${base}/access-practice-lab/program/forms`);
  await page.locator("[data-form-fields] form").waitFor();
  await page.locator('[data-form-entry] [name="alias"]').fill("Demo Alias");
  await page.locator("[data-form-save]").click();
  await page.getByText("Draft", { exact: false }).first().waitFor();
  await page.goto(`${base}/access-practice-lab/program/strategies`);
  await page.locator(".pg-strategy").first().waitFor();
  assert.equal(await page.locator(".pg-strategy").count(), 25);
  await page.selectOption('[data-strategy-filter="domain"]', "Reading");
  assert.ok((await page.locator(".pg-strategy:not([hidden])").count()) > 0);
  await page.goto(`${base}/access-practice-lab/program/instruction`);
  await page.selectOption('[name="profile"]', { label: "Demo Alias" });
  await page.locator("[data-instruction-suggest]").click();
  await page.locator("[data-instruction-results] [data-strategy-accept]").first().click();
  await page.getByText("teacher-selected", { exact: false }).waitFor();
  await page.goto(`${base}/access-practice-lab/program/objectives`);
  await page.locator('[name="content"]').fill("how plants use sunlight");
  await page.locator('[name="target"]').fill("because / so");
  await page.selectOption('[name="function"]', "Explain");
  await page.locator("[data-objective-build]").click();
  await page.getByText(/Students will explain/).waitFor();
  await page.goto(`${base}/access-practice-lab/program/benchmark`);
  await page.locator('[name="alias"]').fill("Demo Alias");
  await page.locator('[name="year"]').fill("2026");
  await page.locator('[name="reading"]').fill("4.2");
  await page.locator("[data-benchmark-save]").click();
  await page.getByText(/Speaking and Writing: needs teacher review/).waitFor();
  await page.goto(`${base}/access-practice-lab/program/learning`);
  await page.locator(".pg-list details").first().locator("summary").click();
  await page.locator("[data-module-complete]").first().click();
  await page.getByText("✓", { exact: false }).first().waitFor();
  await page.goto(`${base}/access-practice-lab/program/import`);
  await page.locator('[data-csv-template="roster"]').click();
  await page.locator("[data-csv-file]").setInputFiles({
    name: "scores.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      "alias,testYear,reading,givenName\nImported Alias,2026,4.3,Example Person\n",
    ),
  });
  await page.locator('[data-map-col="0"]').selectOption("alias");
  await page.locator('[data-map-col="1"]').selectOption("testYear");
  await page.locator('[data-map-col="2"]').selectOption("reading");
  await page.locator("[data-csv-import]").click();
  await page.getByText(/1 alias-only rows imported/).waitFor();
  await page.goto(`${base}/access-practice-lab/program/benchmark`);
  await page.getByRole("heading", { name: /Imported Alias · 2026/ }).waitFor();
  await page.goto(`${base}/access-practice-lab/program/letters`);
  assert.equal(await page.getByRole("button", { name: /Email/ }).first().isDisabled(), true);
  await page.goto(`${base}/access-practice-lab/program/rubrics`);
  await page.locator('[name="title"]').fill("Local Practice Rubric");
  await page
    .locator('[name="criteria"]')
    .fill("Clear idea | Names a clear idea\nUseful detail | Points to one example");
  await page.locator("[data-rubric-save]").click();
  await page.getByRole("heading", { name: "Local Practice Rubric" }).waitFor();
  await page.locator("[data-rubric-signed]").click();
  await page.getByRole("heading", { name: /Signed language/ }).waitFor();
  await page.goto(`${base}/access-practice-lab/program/banks`);
  await page.locator('[name="promptEn"]').fill("Explain one change.");
  await page.locator('[name="promptEs"]').fill("Explica un cambio.");
  await page.locator("[data-question-save]").click();
  await page.locator("[data-question-delete]").waitFor();
  await page.locator("[data-pool-alias]").fill("Demo Alias");
  await page.locator("[data-pool-draw]").click();
  await page.getByText("Explain one change.").waitFor();
  await page.goto(`${base}/access-practice-lab/program/reports`);
  await page.locator("[data-report-export]").waitFor();
  assert.equal(await page.locator("[data-report-export]").count(), 1);
  await page.goto(`${base}/access-practice-lab/task-packs`);
  await page.locator('[name="titleEn"]').fill("Local speaking task");
  await page.locator('[name="titleEs"]').fill("Tarea oral local");
  await page.locator('[name="promptEn"]').fill("Tell what happened.");
  await page.locator('[name="promptEs"]').fill("Cuenta lo que pasó.");
  await page.locator('[name="rehearsal"]').check();
  await page.locator('[name="reviewSec"]').fill("1");
  await page.locator('[name="respondSec"]').fill("8");
  await page.locator('[name="minRespondSec"]').fill("1");
  await page.locator("[data-task-save]").click();
  const studentLink = page.locator('a[href*="/task-packs/student/"]').first();
  await studentLink.waitFor();
  const studentPath = new URL(await studentLink.getAttribute("href"), base).pathname;
  await page.goto(`${base}${studentPath}`);
  await page.getByRole("heading", { name: "Local speaking task" }).waitFor();
  await page.locator("[data-student-confirm]").click();
  await page.waitForFunction(
    () => document.querySelector("[data-student-record]")?.disabled === false,
    null,
    { timeout: 12000 },
  );
  await page.locator("[data-student-record]").click();
  await page.waitForTimeout(350);
  assert.equal(await page.locator("[data-student-next]").isDisabled(), true);
  await page.locator("[data-student-stop]").click();
  await page.locator("[data-student-keep]").click();
  await page.getByText(/Kept on this device/).waitFor();
  await page.waitForFunction(
    () => document.querySelector("[data-student-next]")?.disabled === false,
    null,
    { timeout: 5000 },
  );
  await page.goto(`${base}/access-practice-lab/live`);
  await page.locator("[data-live-create]").waitFor();
  await page.locator('[name="className"]').fill("Local Mock Class");
  await page.locator('[name="participants"]').fill("4");
  await page.locator("[data-live-create-room]").click();
  await page
    .getByText("Mock recording metadata only", { exact: false })
    .count()
    .catch(() => 0);
  await page.getByRole("heading", { name: /Local Mock Class/ }).waitFor();
  assert.equal(await page.locator("[data-live-action$=':start']").count(), 2);
  await page.goto(`${base}/access-practice-lab/partner`);
  await page.getByRole("heading", { name: "Partner Talk" }).waitFor();
  await page.locator("[data-partner-say]").click();
  await go("/access-practice-lab/program/strategies");
  await axe();
  assert.deepEqual(errors, []);
  console.log(
    "PASS newcomer packs, local program workflows, mock rooms, partner talk, axe and console",
  );
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolve) => local?.server?.close(resolve) || resolve());
}
