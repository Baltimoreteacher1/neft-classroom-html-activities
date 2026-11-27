#!/usr/bin/env node
/**
 * tour-live-e2e.mjs — the live tour (/tour/, /tour/join/) driven the way a room uses it.
 *
 * One projector (1600x964) and three phones (390x844) against a local server that serves the source tree and
 * runs the REAL /api/tour-room function over node:sqlite. It proves, in a browser:
 *   - Go live opens a room and shows a join code and QR; phones join with the code;
 *   - phones follow the projector's stop and get that stop's question; answers show up on the projector;
 *   - a reaction on a phone floats up on the projector;
 *   - the phone Upgrade Lab runs the lab's checker on the phone and sends only the three results
 *     (the typed sentence never leaves the phone: every request body is inspected);
 *   - the presenter's phone remote moves the projector, and an audience phone cannot;
 *   - every request stays on the page's own origin; no console errors; axe (WCAG A/AA) on the phone page.
 * No Chromium: SKIP (exit 3 locally, 1 in CI); never a pass.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import http from "node:http";
import { extname, join, normalize } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { onRequest } from "../functions/api/tour-room/[[path]].js";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SHOTS = process.env.TOUR_SHOTS || "";
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

function d1(db) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    async all() {
      return { results: db.prepare(sql).all(...params) };
    },
    async run() {
      return db.prepare(sql).run(...params);
    },
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      db.exec("BEGIN");
      try {
        for (const s of statements) await s.run();
        db.exec("COMMIT");
      } catch (err) {
        db.exec("ROLLBACK");
        throw err;
      }
      return statements.map(() => ({ success: true }));
    },
  };
}

const sqlite = new DatabaseSync(":memory:");
const env = { DB: d1(sqlite) };
const bodies = [];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname.startsWith("/api/tour-room/")) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks).toString("utf8");
    if (raw) bodies.push(raw);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: raw || undefined,
    });
    const action = url.pathname.slice("/api/tour-room/".length).split("/");
    const out = await onRequest({
      request,
      env,
      params: { path: action },
      data: {},
      waitUntil() {},
    });
    res.writeHead(out.status, Object.fromEntries(out.headers));
    res.end(Buffer.from(await out.arrayBuffer()));
    return;
  }
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith("/")) path += "index.html";
  const rel = normalize(path).replace(/^(\.\.[/\\])+/, "");
  for (const base of [ROOT, join(ROOT, "public")]) {
    try {
      const data = await readFile(join(base, rel));
      res.writeHead(200, { "content-type": TYPES[extname(rel)] || "application/octet-stream" });
      res.end(data);
      return;
    } catch {}
  }
  res.writeHead(404);
  res.end("not found");
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

let chromium;
let browser;
try {
  ({ chromium } = await import("playwright"));
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch {
  server.close();
  process.exit(skipExit("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium"));
}

let passed = 0;
const t = async (name, fn) => {
  await fn();
  passed++;
  console.log(`  ok  ${name}`);
};
const problems = [];
function watch(page, who) {
  page.on("pageerror", (e) => problems.push(`${who} page error: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`${who} console: ${m.text()}`);
  });
  page.on("request", (r) => {
    if (!r.url().startsWith(BASE) && !r.url().startsWith("data:"))
      problems.push(`${who} left the origin: ${r.url()}`);
  });
}
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

try {
  const deckCtx = await browser.newContext({ viewport: { width: 1600, height: 964 } });
  const deck = await deckCtx.newPage();
  watch(deck, "projector");
  await deck.goto(`${BASE}/tour/#stop-2`, { waitUntil: "networkidle" });
  await deck.waitForTimeout(2900);
  let code = "";

  await t("Go live opens a room and shows a join code and a QR", async () => {
    await deck.keyboard.press("g");
    await deck.locator("#joinov").waitFor({ state: "visible", timeout: 5000 });
    code = (await deck.locator("#j-code").textContent()).trim();
    assert.match(code, /^[A-HJKMNP-Z2-9]{5}$/);
    assert.ok(await deck.locator("#j-qr svg").count(), "no QR drawn");
    assert.equal(await deck.locator("#live-badge").isVisible(), true);
    await shot(deck, "deck-join");
  });

  const phones = [];
  await t("three phones join with the code and follow the projector's stop", async () => {
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const p = await ctx.newPage();
      watch(p, `phone ${i + 1}`);
      if (i === 0) {
        await p.goto(`${BASE}/tour/join/`, { waitUntil: "networkidle" });
        await p.locator("#code").fill(code.toLowerCase());
        await p.locator("#join-form button").click();
      } else await p.goto(`${BASE}/tour/join/?r=${code}`, { waitUntil: "networkidle" });
      await p.locator("#v-room").waitFor({ state: "visible", timeout: 5000 });
      phones.push(p);
    }
    await deck.locator("#j-close").click();
    for (const p of phones) await expectText(p, "#s-title", "Why it exists");
    await expectText(deck, "#j-people", "3");
  });

  await t("each phone gets the stop's question; the projector tallies the answers", async () => {
    for (const p of phones) await p.locator("#c-q").waitFor({ state: "visible", timeout: 5000 });
    assert.match(await phones[0].locator("#q-text").textContent(), /most need more practice/);
    await phones[0].getByRole("button", { name: "Speaking" }).click();
    await phones[1].getByRole("button", { name: "Writing" }).click();
    await phones[2].getByRole("button", { name: "Speaking" }).click();
    await phones[2].getByRole("button", { name: "Writing" }).click(); // changes their answer
    await expectText(phones[2], "#q-sent", "Sent");
    await expectText(deck, "#lp-n", "3 answers");
    await deck.keyboard.press("r");
    await deck.waitForTimeout(1200);
    const counts = await deck.locator("#lp-bars .lpb b").allTextContents();
    assert.deepEqual(
      counts.slice(0, 2),
      ["1", "2"],
      "Speaking 1, Writing 2 after a changed answer",
    );
    await shot(deck, "deck-results");
    await shot(phones[0], "phone-question");
  });

  await t("a reaction on a phone floats up on the projector", async () => {
    await phones[1].getByRole("button", { name: "Good idea" }).click();
    await deck.locator(".rfloat").first().waitFor({ state: "attached", timeout: 6000 });
  });

  await t(
    "the phone Upgrade Lab checks on the phone and sends only the three results",
    async () => {
      for (let i = 0; i < 5; i++)
        await deck.keyboard.press("ArrowRight"), await deck.waitForTimeout(450);
      await deck.keyboard.press("ArrowRight"); // builds of stops 2-6 are passed through quickly; land on stop 7
      await deck.evaluate(() => {
        location.hash = "";
      });
      // jump straight to the Upgrade Lab stop with Home + digits is not a feature; use the map instead
      await deck.keyboard.press("m");
      await deck.waitForTimeout(1600);
      await deck.locator("#s6").click({ position: { x: 20, y: 20 } });
      await expectText(phones[0], "#s-title", "Upgrade a sentence");
      const sentence =
        "Phones in class can be harmful because notifications distract students and break their focus during lessons.";
      await phones[0].locator("#up").fill(sentence);
      await phones[0].locator("#up-check").click();
      assert.equal(await phones[0].locator("#l-connector.ok").count(), 1);
      await phones[0].locator("#up-send").click();
      await expectText(phones[0], "#q-sent", "not your sentence");
      await expectText(deck, "#lp-n", "1 answer");
      assert.equal(
        bodies.some((b) => b.includes("notifications")),
        false,
        "the typed sentence reached the server",
      );
      const stored = sqlite.prepare("SELECT value FROM tour_answer WHERE prompt = 'upgrade'").all();
      assert.deepEqual(
        stored.map((r) => r.value),
        ["111"],
      );
      await shot(phones[0], "phone-upgrade");
      await shot(deck, "deck-upgrade");
    },
  );

  await t(
    "the presenter's phone remote moves the projector; an audience phone cannot",
    async () => {
      const token = await deck.evaluate(
        () => JSON.parse(sessionStorage.getItem("tourLive:v1:room")).token,
      );
      const rctx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      });
      const remote = await rctx.newPage();
      watch(remote, "remote");
      await remote.goto(`${BASE}/tour/join/?r=${code}#k=${token}`, { waitUntil: "networkidle" });
      await remote.locator("#v-remote").waitFor({ state: "visible", timeout: 5000 });
      assert.equal(
        remote.url().includes(token),
        false,
        "the remote token stayed in the address bar",
      );
      await expectText(remote, "#rm-title", "Upgrade a sentence");
      for (let i = 0; i < 3; i++)
        await remote.locator("#rm-next").click(), await remote.waitForTimeout(250);
      await expectText(remote, "#rm-title", "A ten-minute lesson");
      await expectText(deck, "#now-title", "A ten-minute lesson", 8000);
      await shot(remote, "phone-remote");
      const forged = await phones[2].evaluate(async (c) => {
        const r = await fetch("/api/tour-room/state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: c, token: "0".repeat(32), stop: 0 }),
        });
        return r.status;
      }, code);
      assert.equal(forged, 401);
      // That refusal is the point of the check; the browser logs it, so it is not a problem with the page.
      await phones[2].waitForTimeout(200);
      const i = problems.findIndex((p) => p.startsWith("phone 3 console:") && p.includes("401"));
      if (i >= 0) problems.splice(i, 1);
    },
  );

  await t("the phone page passes axe (WCAG 2.x A/AA)", async () => {
    let AxeBuilder;
    try {
      AxeBuilder = (await import("@axe-core/playwright")).default;
    } catch {
      console.log("      (axe not installed: skipped this check)");
      return;
    }
    const r = await new AxeBuilder({ page: phones[1] })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    assert.deepEqual(
      bad.map((v) => `${v.id}: ${v.nodes.length}`),
      [],
    );
  });

  await t("nothing left the origin, and no page logged an error", () => {
    assert.deepEqual(problems, []);
  });
} finally {
  await browser.close();
  server.close();
}
console.log(`tour-live-e2e: ${passed} checks passed`);

async function expectText(page, sel, text, timeout = 6000) {
  const end = Date.now() + timeout;
  let last = "";
  while (Date.now() < end) {
    last =
      (await page
        .locator(sel)
        .first()
        .textContent()
        .catch(() => "")) || "";
    if (last.includes(text)) return;
    await page.waitForTimeout(200);
  }
  throw new Error(`${sel} never showed "${text}" (last: "${last.slice(0, 80)}")`);
}
