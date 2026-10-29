/**
 * Passport check-in, driven in a real browser: a student finishes stops, taps "Copy the note", a teacher
 * opens the link in the Teacher Hub, sees who to stamp, marks them stamped, and it survives a reload.
 * Serves the SOURCE tree (or BASE=<url>). A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-lab-checkin-e2e: SKIP — playwright is not installed");
  process.exit(process.env.CI ? 1 : 0);
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const serve = () =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
      let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
      if (!existsSync(file) || statSync(file).isDirectory()) {
        if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
          file = join(REPO_ROOT, "access-practice-lab/index.html");
        else {
          res.writeHead(404);
          return res.end();
        }
      }
      res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
      createReadStream(file).pipe(res);
    });
    server.listen(0, () => resolve(server));
  });

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const server = process.env.BASE ? null : await serve();
const BASE = process.env.BASE || `http://localhost:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  console.warn(`access-lab-checkin-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
};
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const student = await context.newPage();
  watch(student);
  await student.goto(`${BASE}/access-practice-lab/passport?grades=3-5`, {
    waitUntil: "networkidle",
  });
  await student.waitForSelector("#app h1");
  // Finish the first three Reading A activities with the lab's own storage code.
  await student.evaluate(async () => {
    const { bandRows } = await import("/access-practice-lab/src/content.js");
    const { saveRecord, loadRecord, setStudentName } = await import(
      "/access-practice-lab/src/store.js"
    );
    const rows = (await bandRows("3-5")).filter((r) => r.domain === "Reading" && r.level === "A");
    const record = loadRecord("3-5", "Reading", "A");
    saveRecord("3-5", "Reading", "A", { ...record, complete: rows.slice(0, 3).map((r) => r.id) });
    setStudentName("Mia R.");
  });
  await student.reload({ waitUntil: "networkidle" });
  await student.waitForSelector("#app h1");

  const go = student.locator(".journey-go");
  const open = await student.locator(".journey-card:not(.is-done)").count();
  ok(
    open > 0 && (await go.count()) === open,
    "every unfinished country has exactly one Continue link",
  );
  ok(
    /stop 4/i.test(
      await student.locator(".journey-card.d-reading .journey-go").first().innerText(),
    ),
    "Reading's link points at stop 4",
  );
  ok(
    await student.locator(".pass-checkin [data-checkin-send]").isEnabled(),
    "Send is enabled once a stop is finished",
  );
  ok(
    /Egypt \+3/.test(await student.locator(".pass-checkin [role=status]").first().innerText()),
    "panel says what is new",
  );
  ok(
    !(await student.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)),
    "no horizontal overflow at 390px",
  );

  await student.click("[data-checkin-copy]");
  const note = await student.evaluate(() => navigator.clipboard.readText());
  ok(
    /Egypt: 3 of 12 stops/.test(note) && /access-teacher\/#checkin=/.test(note),
    "the copied note names the country and carries the teacher link",
  );
  ok(
    !/Mia R\.'s .*(answer|writing)/.test(note) && note.length < 900,
    "the note is short and carries no work",
  );
  ok(
    /latest stops/.test(await student.locator(".pass-checkin").innerText()),
    "after sending, the panel says the teacher is up to date",
  );

  const link = note.match(/https?:\/\/\S+#checkin=\S+/)[0].replace(/^https?:\/\/[^/]+/, BASE);
  const teacher = await context.newPage();
  watch(teacher);
  await teacher.goto(link, { waitUntil: "networkidle" });
  await teacher.waitForSelector("#passportCheckins table");
  const row = await teacher.locator("#passportCheckins tbody tr").first().innerText();
  ok(
    /Mia R\./.test(row) && /Egypt \(Reading\): 3 of 12 stops, 3 new/.test(row),
    "teacher sees the student and the stops to stamp",
  );
  ok(
    !(await teacher.evaluate(() => location.hash)),
    "the fragment is removed from the address bar after import",
  );
  await teacher.click("[data-checkin-stamped]");
  ok(
    /Everyone is stamped/.test(await teacher.locator("#passportCheckins").innerText()),
    "Mark stamped clears the queue",
  );
  await teacher.reload({ waitUntil: "networkidle" });
  ok(
    /Stamped students \(1\)/.test(await teacher.locator("#passportCheckins").innerText()),
    "the list survives a reload",
  );
  ok(
    !(await teacher.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)),
    "teacher hub: no horizontal overflow at 390px",
  );

  await teacher.fill("[data-checkin-text]", "not a link");
  await teacher.click("[data-checkin-add]");
  ok(
    /not a Passport check-in/.test(await teacher.locator("[data-checkin-note]").innerText()),
    "a bad paste gets a plain-language message",
  );
  ok(
    errors.length === 0,
    `no page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
  );
} catch (error) {
  failures.push(`crashed: ${error.message}`);
  console.error(error);
} finally {
  await browser.close();
  server?.close();
}
if (failures.length) {
  console.error(`\naccess-lab-checkin-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-lab-checkin-e2e: PASS");
