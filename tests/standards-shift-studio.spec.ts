/**
 * Standards Shift Studio (teacher-tools/standards-shift-studio) e2e.
 *
 * Exercises the full MSDE-readiness loop against the built site: live data
 * loads, pasted standards match into a reviewable crosswalk, the teacher
 * override wins, the sequence doctor mirrors the CLI spine checks, and the
 * generate tab emits a change kit whose crosswalk file parses and matches the
 * schema scripts/apply-standards-crosswalk.mjs consumes. The vite preview
 * server has no teacher auth gate, so the page is reachable directly.
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

const STUDIO_PATH = "/teacher-tools/standards-shift-studio/";

/** Collect console errors + page errors for the lifetime of a page. */
function trackErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

/** Load the studio and wait for the live-data banner to go green. */
async function openStudio(page: Page): Promise<void> {
  await page.goto(STUDIO_PATH);
  await expect(page.locator("#sss-status")).toHaveClass(/is-ready/, { timeout: 10_000 });
}

test("hub card links to the studio from Plan & create", async ({ page }) => {
  await page.goto("/teacher-tools/");
  const card = page.locator('a.tool-card[href="/teacher-tools/standards-shift-studio/"]');
  await expect(card).toBeVisible();
  await expect(card.getByRole("heading", { name: "Standards Shift Studio" })).toBeVisible();
});

test("loads live data and renders the coverage atlas", async ({ page }) => {
  const errors = trackErrors(page);
  await openStudio(page);

  await expect(page.locator("#sss-status")).toContainText(/\d+ lessons · \d+ standards/);
  // Every registry domain header and at least one lesson link render.
  const rows = page.locator("#coverage-table tbody tr");
  expect(await rows.count()).toBeGreaterThan(20);
  await expect(page.locator("#coverage-kpis")).toContainText("covered");
  await expect(page.locator(".sss-lessonlink").first()).toBeVisible();

  // Search narrows the table without wiping it.
  const before = await rows.count();
  await page.fill("#coverage-search", "ratio");
  const after = await rows.count();
  expect(after).toBeGreaterThan(0);
  expect(after).toBeLessThan(before);

  expect(errors).toEqual([]);
});

test.describe("modeling a change", () => {
  test("matches pasted standards — equivalence, re-code, and new", async ({ page }) => {
    await openStudio(page);
    await page.getByRole("tab", { name: "2 · Model the change" }).click();
    await page.fill(
      "#proposed-input",
      [
        // Same standard, cluster-form code — must resolve as unchanged/reworded, not new.
        "6.AT.A.1  Understand the concept of a ratio and use ratio language to describe a ratio relationship between two quantities.",
        // Text of a real standard under a novel code — should draft a re-code or review.
        "6.QQ.7  Find the greatest common factor of two whole numbers and the least common multiple of two whole numbers. Use the distributive property to express a sum of two whole numbers with a common factor.",
        // Genuinely new content — must land as new.
        "6.ZZ.9  Model quantum entanglement of basket-weaving llamas.",
      ].join("\n"),
    );
    await page.fill("#plan-label", "spec run");
    await page.getByRole("button", { name: "Match against my curriculum" }).click();

    await expect(page.locator("#review-card")).toBeVisible();
    const verdictFor = (code: string) =>
      page
        .locator("#match-table tbody tr")
        .filter({ has: page.locator(`.sss-code:text-is("${code}")`) })
        .locator(".sss-verdict")
        .first();
    await expect(verdictFor("6.AT.A.1")).toHaveText(/unchanged|reworded/);
    await expect(verdictFor("6.QQ.7")).toHaveText(/re-code|review me/);
    await expect(verdictFor("6.ZZ.9")).toHaveText("new — no match");
  });

  test("teacher override beats the auto-match and survives reload", async ({ page }) => {
    await openStudio(page);
    await page.getByRole("tab", { name: "2 · Model the change" }).click();
    await page.fill(
      "#proposed-input",
      "6.QQ.7  Find the greatest common factor of two whole numbers.",
    );
    await page.getByRole("button", { name: "Match against my curriculum" }).click();
    await expect(page.locator("#review-card")).toBeVisible();

    const select = page.locator('#match-table select[data-decision="6.QQ.7"]');
    await select.selectOption("__new__");
    await expect(page.locator("#match-table .sss-verdict").first()).toHaveText("new — no match");

    // Autosave → reload restores the pasted text, the match, and the override.
    await page.waitForTimeout(600); // debounce window
    await page.reload();
    await expect(page.locator("#sss-status")).toHaveClass(/is-ready/, { timeout: 10_000 });
    await page.getByRole("tab", { name: "2 · Model the change" }).click();
    await expect(page.locator("#proposed-input")).toHaveValue(/greatest common factor/);
    await expect(page.locator("#review-card")).toBeVisible();
    await expect(page.locator("#match-table .sss-verdict").first()).toHaveText("new — no match");
  });

  test("worked example replays the 2025 re-code through the matcher", async ({ page }) => {
    await openStudio(page);
    await page.getByRole("tab", { name: "2 · Model the change" }).click();
    await page.getByRole("button", { name: "Load worked example (2025 re-code)" }).click();
    await expect(page.locator("#match-msg")).toContainText("Worked example loaded");
    expect(await page.locator("#match-table tbody tr").count()).toBeGreaterThan(30);
    // Cluster-form equivalence keeps the replay from drowning in false "new"s.
    await expect(page.locator("#match-kpis")).toContainText("re-codes");
  });
});

test("sequence doctor flags duplicate slots and reset clears them", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("tab", { name: "3 · Re-sequence" }).click();
  await expect(page.locator("#seq-doctor .sss-doc-ok")).toBeVisible();

  // Collide lesson 1-2 into slot 1·1 — same failure curriculum-scope-sequence.mjs gates on.
  const lessonInput = page.locator('input[data-seq-lesson="1-2"]');
  await lessonInput.fill("1");
  await lessonInput.dispatchEvent("change");
  await expect(page.locator("#seq-doctor .sss-doc-err")).toContainText("Duplicate slot 1·1");
  await expect(page.locator("#seq-kpis")).toContainText("1 moved");

  await page.getByRole("button", { name: "Reset to current sequence" }).click();
  await expect(page.locator("#seq-doctor .sss-doc-ok")).toBeVisible();
  await expect(page.locator("#seq-doctor .sss-doc-err")).toHaveCount(0);
});

test("impact and generate build a valid change kit", async ({ page }) => {
  await openStudio(page);
  await page.getByRole("tab", { name: "2 · Model the change" }).click();
  await page.getByRole("button", { name: "Load worked example (2025 re-code)" }).click();
  await expect(page.locator("#review-card")).toBeVisible();

  await page.getByRole("tab", { name: "4 · Impact" }).click();
  await expect(page.locator("#impact-body")).toContainText("lesson configs re-code");
  await expect(page.locator("#impact-body table").first()).toBeVisible();

  await page.getByRole("tab", { name: "5 · Generate" }).click();
  await expect(page.locator("#brief-preview")).toContainText("# Standards Shift Brief");
  await expect(page.locator("#brief-preview")).toContainText("Apply checklist");
  await expect(page.locator("#prompt-preview")).toContainText("npm run standards-crosswalk");

  // The crosswalk download must parse and match the apply-script schema.
  const downloadPromise = page.waitForEvent("download");
  await page.locator('#generate-body button[data-dl="0"]').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^standards-crosswalk-.*\.json$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const kit = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(Array.isArray(kit.entries)).toBe(true);
  expect(kit.entries.length).toBeGreaterThan(0);
  for (const entry of kit.entries) {
    expect(entry).toEqual(
      expect.objectContaining({
        oldId: expect.any(String),
        newId: expect.any(String),
        newDomain: expect.any(String),
        confidence: expect.any(String),
      }),
    );
  }
});

test("studio has no serious/critical accessibility violations", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await openStudio(page);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  const summary = blocking
    .map((v) => `${v.id} (${v.impact}) — ${v.nodes.length} node(s): ${v.help}`)
    .join("\n");
  expect(blocking, summary).toEqual([]);
  await context.close();
});
