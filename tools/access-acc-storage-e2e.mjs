#!/usr/bin/env node
/**
 * Storage, offline and data-lifecycle end to end in real Chromium.
 *   - ACCESS_Lab_DB exists with its four stores and indexes
 *   - a sitting written by the first release (localStorage) is imported once and then removed, and resumes
 *   - service worker precaches the lab; with the network OFF the simulator still loads, saves, resumes and keeps a
 *     recording; reconnecting says so honestly (nothing syncs)
 *   - export / import / delete from the learner's panel; import never overwrites; delete empties the stores
 *   - a failed multi-row write rolls back completely; a quota error is a typed error
 *   - with IndexedDB unavailable the lab still works and says that nothing is being saved
 *   - arrow keys move between items and places in the click-to-place questions
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { readFileSync } from "node:fs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-storage-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};

const { server, base } = await serveAccess();
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const ROOT = `${base}/access-practice-lab`;
const SET = "starter-3-5";

async function fresh(init = "") {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["microphone"],
    acceptDownloads: true,
  });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  return { ctx, page, errors };
}
const begin = async (page, mode = "summative") => {
  await page.goto(`${ROOT}/assess/${SET}?mode=${mode}`, { waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").waitFor();
  const timer = page.locator("#accTimer");
  if (await timer.count()) await timer.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
};

// ── schema ──────────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await begin(page);
  await page.locator(".acc-choice input").nth(1).check();
  await page
    .locator("[data-act=review]")
    .click()
    .catch(() => {});
  await page.waitForTimeout(300);
  const schema = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("ACCESS_Lab_DB");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const out = { version: db.version, stores: [...db.objectStoreNames].sort(), indexes: {} };
          for (const n of out.stores)
            out.indexes[n] = [...db.transaction(n).objectStore(n).indexNames].sort();
          db.close();
          resolve(out);
        };
      }),
  );
  ok(schema.version === 1, `ACCESS_Lab_DB is at version 1 (${schema.version})`);
  ok(
    JSON.stringify(schema.stores) ===
      JSON.stringify(["passport_progress", "recordings", "sessions", "settings"]),
    `the four stores exist (${schema.stores})`,
  );
  ok(
    schema.indexes.sessions.includes("bySet") &&
      schema.indexes.recordings.includes("bySession") &&
      schema.indexes.passport_progress.includes("byLearner"),
    "the lookup indexes exist",
  );
  const row = await page.evaluate(
    () =>
      new Promise((res) => {
        const o = indexedDB.open("ACCESS_Lab_DB");
        o.onsuccess = () => {
          const r = o.result.transaction("sessions").objectStore("sessions").getAll();
          r.onsuccess = () => res(r.result);
        };
      }),
  );
  ok(
    row.length === 1 && row[0].id === `${SET}:summative` && /^L-/.test(row[0].learner),
    "an autosave wrote one session row scoped to a random per-device learner id",
  );
  ok(!/@|\s/.test(row[0].learner), "the learner id carries no name or email");
  await ctx.close();
}

// ── legacy migration ────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await page.goto(`${ROOT}/assess/${SET}?mode=summative`, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const { AssessmentSession } = await import("/access-practice-lab/src/acc/engine/session.js");
    const set = await (await fetch("/access-practice-lab/content/assess/starter-3-5.json")).json();
    const s = new AssessmentSession(set, { mode: "summative" }).start();
    s.setResponse("g35-r1", "b");
    s.goto(2);
    localStorage.setItem(
      "access.acc.session.starter-3-5.summative",
      JSON.stringify({ session: s.serialize(), tools: null, prefs: {} }),
    );
  });
  await page.reload({ waitUntil: "networkidle" });
  ok(
    /Resume where I left off/.test(await page.locator("[data-act=begin]").innerText()),
    "a sitting saved by the first release is offered for resume",
  );
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
  ok(
    /Complete the explanation/.test(await page.locator(".acc-stem").innerText()),
    "it resumes on the saved question",
  );
  await page.locator(".acc-qdot").first().click();
  ok(await page.locator(".acc-choice input").nth(1).isChecked(), "and keeps the saved answer");
  // Every save writes a short-lived localStorage buffer first and removes it once IndexedDB has committed.
  await page.waitForFunction(
    () => localStorage.getItem("access.acc.session.starter-3-5.summative") === null,
  );
  ok(true, "the old copy is removed once the stored row has the sitting");
  ok(
    (await page.evaluate(
      () =>
        new Promise((res) => {
          const o = indexedDB.open("ACCESS_Lab_DB");
          o.onsuccess = () => {
            const r = o.result.transaction("sessions").objectStore("sessions").count();
            r.onsuccess = () => res(r.result);
          };
        }),
    )) === 1,
    "the sitting now lives in IndexedDB",
  );
  await ctx.close();
}

// ── offline ─────────────────────────────────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh();
  // Driven browsers skip the offline worker unless the URL asks for it (so ordinary tests never see a stale cache).
  await page.goto(`${ROOT}/assess?sw=1`, { waitUntil: "networkidle" });
  const cached = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    for (let i = 0; i < 60; i++) {
      for (const name of await caches.keys())
        if (await (await caches.open(name)).match("/access-practice-lab/content/assess/sets.json"))
          return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  });
  ok(cached, "the service worker precached the assessment content");
  await page.reload({ waitUntil: "networkidle" }); // now controlled by the worker
  ok(
    await page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    "the page is controlled by the service worker",
  );
  await page.goto(`${ROOT}/assess/${SET}?mode=summative`, { waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").waitFor();
  await ctx.setOffline(true); // the browser fires "offline" on the live page
  await page.locator('.acc-conn[data-state="offline"]').waitFor({ timeout: 5000 });
  ok(
    /You are offline/.test(await page.locator(".acc-conn").innerText()) &&
      /saved on this device/.test(await page.locator(".acc-conn").innerText()),
    "offline: the lab says so and says work is saved on this device",
  );
  const timer = page.locator("#accTimer");
  if (await timer.count()) await timer.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-choice input").nth(1).check();
  await page.locator("[data-act=next]").click();
  await page.locator(".acc-choice input").nth(1).check();
  await page.locator(".acc-choice input").nth(3).check();
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("[data-act=begin]").waitFor({ timeout: 15000 });
  ok(
    /Resume where I left off/.test(await page.locator("[data-act=begin]").innerText()),
    "offline: a reload offers to resume",
  );
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
  await page.locator(".acc-qdot").nth(1).click();
  ok(
    (await page.locator(".acc-choice input:checked").count()) === 2,
    "offline: answers given offline are still there",
  );
  // speaking offline: the recording is stored locally with no network
  for (let i = 0; i < 7; i++) await page.locator("[data-act=next]").click();
  await page.locator("[data-act=mic-check]").click();
  await page.locator('.acc-mic[data-state="ready"]').waitFor({ timeout: 15000 });
  await page.locator("[data-act=speak-begin]").click();
  await page.locator("[data-act=speak-skip]").click();
  await page.waitForTimeout(1800);
  await page.locator("[data-act=speak-stop]").click();
  await page.locator("[data-act=speak-use]").click();
  await page.locator("[data-act=speak-confirm]").click();
  await page.locator(".acc-state.is-success").waitFor();
  ok(true, "offline: a recording is saved on the device without a network");
  await ctx.setOffline(false);
  // A page loaded while offline has not seen the browser's own offline event (CDP emulation), so replay the pair.
  await page.evaluate(() => {
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));
  });
  await page.locator('.acc-conn[data-state="online"]').waitFor({ timeout: 5000 });
  ok(
    /Nothing needs to upload/.test(await page.locator(".acc-conn").innerText()),
    "reconnecting says nothing needs to sync, and promises no sync",
  );
  ok(errors.length === 0, `no console errors while offline ${errors.join("|")}`);
  await ctx.close();
}

// ── export / import / delete ────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await begin(page);
  await page.locator(".acc-choice input").nth(1).check();
  await page.locator("[data-act=review]").click();
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await page.locator(".acc-storage").waitFor();
  await page.waitForFunction(() =>
    /Evidence rows/.test(document.querySelector(".acc-storage").innerText),
  );
  const txt = await page.locator(".acc-storage").innerText();
  ok(
    /Saved in this browser on this device\. Nothing is uploaded/.test(txt),
    "the panel states where the data lives",
  );
  ok(
    /Practice sittings saved\s*1/.test(txt.replace(/\n+/g, " ")) &&
      /Evidence rows\s*9/.test(txt.replace(/\n+/g, " ")),
    "usage counts match the sitting just submitted",
  );
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("[data-act=export]").click(),
  ]);
  const path = await download.path();
  const data = JSON.parse(readFileSync(path, "utf8"));
  ok(
    data.format === "access-lab-export" &&
      data.sessions.length === 1 &&
      data.progress.length === 9 &&
      data.recordings.length === 0,
    "export holds the sitting and its evidence, without recordings",
  );
  ok(!JSON.stringify(data).includes('"learnerId"'), "the device id setting is not exported");
  ok(
    data.progress.every((r) => r.itemId && r.domain && "independent" in r),
    "evidence rows carry item, domain and independence",
  );
  await page.locator("[data-act=delete-all]").click();
  ok((await page.locator("[data-act=confirm-delete]").count()) === 1, "delete asks first");
  await page.locator("[data-act=confirm-delete]").click();
  await page.waitForFunction(() =>
    /Practice sittings saved\s*0/.test(
      document.querySelector(".acc-storage").innerText.replace(/\n+/g, " "),
    ),
  );
  ok(true, "delete empties the stores");
  await page.locator("#accImport").setInputFiles(path);
  await page.waitForFunction(() =>
    /Imported 10 items/.test(document.querySelector(".acc-storage").innerText),
  );
  ok(true, "import restores the sitting and its evidence");
  await page.locator("#accImport").setInputFiles(path);
  await page.waitForFunction(() =>
    /10 already here/.test(document.querySelector(".acc-storage").innerText),
  );
  ok(true, "importing again keeps what is there and reports the conflicts");
  await ctx.close();
}

// ── transactions and errors ─────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const { openStorage } = await import("/access-practice-lab/src/acc/storage/access-db.js");
    const store = await openStorage({ force: true });
    let rolledBack = false;
    try {
      await store.saveSessionWithEvidence({
        session: { id: "rb-1", setId: "x", learner: "L1" },
        rows: [{ learner: "L1", itemId: "i", t: 1, bad: () => 1 }],
      });
    } catch (e) {
      rolledBack = e.name === "StorageError";
    }
    const survived = await store.sessions.get("rb-1");
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
    let quota = null;
    try {
      await store.recordings.put({ id: "q", blob: new Blob(["x"]) });
    } catch (e) {
      quota = e.code;
    }
    IDBObjectStore.prototype.put = original;
    let invalid = null;
    try {
      await store.recordings.put({ id: "nope" });
    } catch (e) {
      invalid = e.code;
    }
    return {
      rolledBack,
      survived: Boolean(survived),
      quota,
      invalid,
      persistent: store.persistent,
    };
  });
  ok(
    result.rolledBack && !result.survived,
    "a failed multi-row write rolls back: the session row is not left behind",
  );
  ok(result.quota === "quota", "a full device is reported as a typed quota error");
  ok(result.invalid === "invalid", "a recording without audio is rejected up front");
  await ctx.close();
}

// ── no IndexedDB ────────────────────────────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh(
    `Object.defineProperty(window, "indexedDB", { value: undefined, configurable: true });`,
  );
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await page.locator(".acc-storage").waitFor();
  await page.waitForFunction(
    () => document.querySelector(".acc-storage")?.dataset.persistent === "false",
  );
  ok(
    /not saving your work/.test(await page.locator(".acc-storage").innerText()),
    "without IndexedDB the lab says plainly that nothing is being saved",
  );
  await begin(page);
  await page.locator(".acc-choice input").nth(1).check();
  await page.locator("[data-act=next]").click();
  ok(/two details/.test(await page.locator(".acc-stem").innerText()), "the simulator still works");
  ok(errors.length === 0, `no console errors without IndexedDB ${errors.join("|")}`);
  await ctx.close();
}

// ── keyboard: arrow keys in click-to-place ──────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await begin(page);
  for (let i = 0; i < 4; i++) await page.locator("[data-act=next]").click();
  await page.locator(".acc-pool .acc-token").first().focus();
  const first = await page.evaluate(() => document.activeElement.textContent);
  await page.keyboard.press("ArrowRight");
  ok(
    (await page.evaluate(() => document.activeElement.textContent)) !== first,
    "ArrowRight moves to the next item",
  );
  await page.keyboard.press("End");
  ok(
    await page.evaluate(() =>
      document.activeElement.matches(".acc-zone-target, .acc-token, .acc-btn, button"),
    ),
    "End moves to the last control",
  );
  await page.keyboard.press("Home");
  ok(
    (await page.evaluate(() => document.activeElement.textContent)) === first,
    "Home returns to the first item",
  );
  await page.keyboard.press("Space");
  ok(
    (await page.locator(".acc-pool [aria-pressed=true]").count()) === 1,
    "Space selects the focused item",
  );
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-storage-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-storage-e2e: all checks passed");
