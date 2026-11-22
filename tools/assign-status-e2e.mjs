// Assignment status, end to end in Chromium: a learner starts and turns in work on a phone, the teacher reviews,
// asks for a revision, reassigns and releases a draft from the status board, and the learner sees the feedback.
// The pages call the REAL class API (functions/api/class) running against a real SQL engine (node:sqlite) through
// a request interceptor, so page and server rules are exercised together. Serves the source tree.
// A missing browser is a SKIP (exit 3).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import { onRequest } from "../functions/api/class/[[path]].js";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP assign-status-e2e: playwright not installed");
  process.exit(3);
}
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

// ── the real API behind the browser ────────────────────────────────────────
const KEY = "teacher-key-for-e2e";
const sqlite = new DatabaseSync(":memory:");
const make = (sql, params) => ({
  bind: (...next) => make(sql, next),
  async first() {
    return sqlite.prepare(sql).get(...params) ?? null;
  },
  async all() {
    return { results: sqlite.prepare(sql).all(...params) };
  },
  async run() {
    const r = sqlite.prepare(sql).run(...params);
    return { success: true, meta: { changes: Number(r.changes) } };
  },
});
const env = {
  TEACHER_KEY: KEY,
  DB: {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec("COMMIT");
        return out;
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
    },
  },
};
let n = 0;
async function api(route, { method = "GET", body, headers = {} } = {}) {
  const request = new Request(`https://example.test/api/class/${route}`, {
    method,
    headers: {
      "CF-Connecting-IP": `10.9.${Math.floor(++n / 250)}.${n % 250}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env, params: { path: route.split("?")[0].split("/") } });
  return { status: res.status, headers: res.headers, text: await res.text() };
}
const json = (r) => JSON.parse(r.text);
const attach = async (context) =>
  context.route("**/api/class/**", async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const r = await api(u.pathname.replace("/api/class/", "") + u.search, {
      method: req.method(),
      body: req.postData() ? JSON.parse(req.postData()) : undefined,
      headers: req.headers(),
    });
    await route.fulfill({
      status: r.status,
      contentType: r.headers.get("content-type") || "application/json",
      body: r.text,
    });
  });

const created = json(
  await api("create", {
    method: "POST",
    headers: { "x-teacher-key": KEY },
    body: { app: "language", title: "Period 3" },
  }),
);
const code = created.code;
const passcode = created.teacherPasscode;
const joined = json(await api("join", { method: "POST", body: { code, alias: "Comet" } }));
await api("join", { method: "POST", body: { code, alias: "River" } });
const saved = await api("settings", {
  method: "POST",
  headers: { "x-teacher-key": KEY },
  body: {
    code,
    settings: {
      assignments: [
        { id: "a-open", title: "Tell a story", path: "/access-practice-lab/speak", due: null },
        {
          id: "a-draft",
          title: "Draft task",
          path: "/access-practice-lab/write",
          due: null,
          draft: true,
        },
      ],
    },
  },
});

let server;
let base = process.env.BASE;
if (!base) ({ server, base } = await serveAccess());
const LAB = `${base}/access-practice-lab`;
const browser = await chromium.launch().catch(() => null);
if (!browser) {
  console.log("SKIP assign-status-e2e: no browser");
  process.exit(3);
}
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
check(saved.status === 200, "class and assignments set up through the real API");
const watch = (page, errors) => {
  page.on("pageerror", (e) => !/"web-vitals"/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/favicon|Failed to load resource|"web-vitals"/.test(m.text()) &&
      errors.push(m.text()),
  );
};
const axe = async (page, label, include) => {
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(
    (inc) =>
      window.axe.run(inc ? { include: [[inc]] } : document, {
        runOnly: ["wcag2a", "wcag2aa", "wcag22aa"],
      }),
    include || null,
  );
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  check(
    !bad.length,
    `${label}: axe serious/critical ${bad.map((v) => `${v.id} ${v.nodes.map((x) => x.html.slice(0, 70)).join(" ; ")}`).join(", ") || "0"}`,
  );
};

// ── learner on a phone ─────────────────────────────────────────────────────
const lctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await attach(lctx);
await lctx.addInitScript(
  (link) => {
    try {
      localStorage.setItem("accessPracticeLabClass:v1:link", JSON.stringify(link));
    } catch {}
  },
  {
    code,
    studentId: joined.studentId,
    studentKey: joined.studentKey,
    alias: "Comet",
    title: "Period 3",
    dirtyAt: 0,
    syncedAt: 0,
    remoteAt: 0,
  },
);
const learner = await lctx.newPage();
const lerrors = [];
watch(learner, lerrors);
const learnerState = () => learner.locator(".cls-status .cls-state").first().innerText();
await learner.goto(`${LAB}/class?grades=6-8`, { waitUntil: "networkidle" });
await learner.waitForSelector("#clsAssignH ~ ul li");
check(
  (await learner.locator("#clsAssignH ~ ul li").count()) === 1,
  "learner sees one assignment: the draft is hidden",
);
check(/Not started/.test(await learnerState()), "status starts as Not started");
check(
  (await learner.locator('[data-astatus="submit"]').count()) === 0,
  "no Turn in button before starting",
);
await learner.click('[data-astatus="start"]');
await learner.waitForFunction(() =>
  /In progress/.test(document.querySelector(".cls-status .cls-state")?.textContent || ""),
);
check(true, "Start moves the work to In progress");
await learner.click('[data-astatus="submit"]');
await learner.waitForFunction(() =>
  /Turned in/.test(document.querySelector(".cls-status .cls-state")?.textContent || ""),
);
check(
  (await learner.locator('[data-astatus="start"]').innerText()) === "Try again",
  "after turning in, the learner may try again (attempts remain)",
);
await learner.reload({ waitUntil: "networkidle" });
await learner.waitForSelector(".cls-status");
check(/Turned in/.test(await learnerState()), "status survives a reload (stored on the server)");
check(
  await learner.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  "@390 no sideways scroll",
);
await axe(learner, "learner class page @390");

// ── teacher ────────────────────────────────────────────────────────────────
const tctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await attach(tctx);
const teacher = await tctx.newPage();
const terrors = [];
watch(teacher, terrors);
await teacher.goto(`${LAB}/class/teacher?grades=6-8`, { waitUntil: "networkidle" });
await teacher.fill("#ctCode", code);
await teacher.fill("#ctPass", passcode);
await teacher.click('form:has(#ctCode) button[type="submit"]');
await teacher.waitForSelector(".cls-assign-board");
const boards = teacher.locator(".cls-assign-board");
check((await boards.count()) === 2, "board lists both assignments, including the draft");
check(
  /Draft: learners cannot see it/.test(await boards.nth(1).innerText()),
  "the draft is labelled for the teacher",
);
const row = (name) =>
  boards.first().locator("tbody tr", { has: teacher.locator(`th:text-is("${name}")`) });
check(/Turned in/.test(await row("Comet").innerText()), "teacher sees Comet's turned-in work");
check(/Not started/.test(await row("River").innerText()), "River has not started");
check(
  (await row("Comet").locator("[data-astatus-teacher]").count()) === 3,
  "teacher gets review, revise and reassign for turned-in work",
);
check(
  (await row("River").locator("[data-astatus-teacher]").count()) === 0,
  "no teacher actions on work that was not started",
);
await row("Comet").locator(".cls-note-in").fill("Add one more detail.");
await row("Comet").locator('[data-astatus-teacher="request_revision"]').click();
await teacher.waitForFunction(() =>
  /Please revise/.test(document.querySelector(".cls-assign-board tbody")?.textContent || ""),
);
check(true, "Ask to revise moves the work to Please revise");
await row("Comet").getByRole("button", { name: "History" }).click();
await teacher.waitForSelector(".cls-assign-board ul.fine li");
check(
  (await teacher.locator(".cls-assign-board ul.fine li").count()) >= 3,
  "history lists the transitions",
);
await axe(teacher, "teacher status board", ".cls-assign-board");

// learner sees feedback and revises
await learner.reload({ waitUntil: "networkidle" });
await learner.waitForSelector(".cls-teacher-note");
check(
  /Add one more detail/.test(await learner.locator(".cls-teacher-note").innerText()),
  "learner reads the teacher's comment",
);
check(/Please revise/.test(await learnerState()), "learner sees Please revise");
check(
  (await learner.locator('[data-astatus="start"]').innerText()) === "Revise",
  "the button says Revise",
);
await learner.click('[data-astatus="start"]');
await learner.waitForFunction(() =>
  /In progress/.test(document.querySelector(".cls-status .cls-state")?.textContent || ""),
);
check(
  /Add one more detail/.test(await learner.locator(".cls-teacher-note").innerText()),
  "the feedback stays visible while revising",
);
await learner.click('[data-astatus="submit"]');
await learner.waitForFunction(() =>
  /Turned in/.test(document.querySelector(".cls-status .cls-state")?.textContent || ""),
);
check(
  /try 2/.test(await learner.locator(".cls-status").innerText()),
  "the revision the teacher asked for is try 2",
);

// teacher reviews, then releases the draft
await teacher
  .waitForFunction(
    () => /Turned in/.test(document.querySelector(".cls-assign-board tbody")?.textContent || ""),
    null,
    { timeout: 20000 },
  )
  .catch(() => {});
await teacher.reload({ waitUntil: "networkidle" });
await teacher.fill("#ctCode", code).catch(() => {});
await teacher.waitForSelector(".cls-assign-board", { timeout: 15000 }).catch(async () => {
  await teacher.fill("#ctCode", code);
  await teacher.fill("#ctPass", passcode);
  await teacher.click('form:has(#ctCode) button[type="submit"]');
  await teacher.waitForSelector(".cls-assign-board");
});
await row("Comet").locator('[data-astatus-teacher="review"]').click();
await teacher.waitForFunction(() =>
  /Reviewed/.test(document.querySelector(".cls-assign-board tbody")?.textContent || ""),
);
check(true, "Mark reviewed moves the work to Reviewed");
await teacher.getByRole("button", { name: "Release to learners" }).click();
await teacher.waitForFunction(
  () => !/Draft: learners cannot see it/.test(document.body.innerText),
  null,
  { timeout: 15000 },
);
check(true, "Release to learners publishes the draft");
await learner.reload({ waitUntil: "networkidle" });
await learner.waitForSelector("#clsAssignH ~ ul li");
check(
  (await learner.locator("#clsAssignH ~ ul li").count()) === 2,
  "the released assignment now shows for the learner",
);
check(
  /Reviewed/.test(await learner.locator(".cls-status .cls-state").first().innerText()),
  "learner sees Reviewed",
);

// the builder carries the lifecycle options through
await teacher.waitForSelector('[aria-label="Due date"]');
check(
  (await teacher
    .locator(
      '[aria-label="Available from"], [aria-label="Tries allowed"], [aria-label="Support level"], #ctDraft',
    )
    .count()) === 4,
  "builder offers start date, tries, support level and draft",
);
await teacher.fill('[aria-label="Due date"]', "2030-05-01");
await teacher.selectOption('[aria-label="Tries allowed"]', "2");
await teacher.selectOption('[aria-label="Support level"]', "1");
await teacher.check("#ctDraft");
await teacher
  .locator('.cls-card:has(h4:text-is("Assignments")) button.btn:text-is("Assign")')
  .click();
await teacher.waitForFunction(
  () => /Draft · due 2030-05-01 · 2 tries · with supports/.test(document.body.innerText),
  null,
  { timeout: 15000 },
);
check(
  true,
  "an assignment saved with due date, 2 tries, support level and draft shows all of them",
);

check(!lerrors.length, `learner: no console or page errors ${lerrors.slice(0, 3).join(" | ")}`);
check(!terrors.length, `teacher: no console or page errors ${terrors.slice(0, 3).join(" | ")}`);
await browser.close();
server?.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");
process.exit(fails.length ? 1 : 0);
