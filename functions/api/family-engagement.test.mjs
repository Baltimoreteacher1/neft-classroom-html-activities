/* Family engagement counters — the no-identifiers invariant, proven four ways.
 *
 *   node --test functions/api/family-engagement.test.mjs
 *
 * 1. The write surface: whatever a caller sends, only five closed-vocabulary
 *    fields can reach the database.
 * 2. The storage: the table has no column that could hold a person, a lesson,
 *    an address or a moment finer than a week.
 * 3. The client: the beacon sends those five fields and nothing it can read off
 *    the page, the address bar or storage.
 * 4. The read: counts under K are hidden, a single hidden cell is not
 *    recoverable by subtraction, and the read is teacher-gated.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  aggregate,
  DEVICES,
  EVENTS,
  K_ANONYMITY,
  LANGS,
  normalizeEngagement,
  onRequest,
  ROUTES,
  suppress,
  TABS,
  weekStart,
} from "./family-engagement.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = readFileSync(join(ROOT, "functions/api/family-engagement.js"), "utf8");
const BEACON = readFileSync(join(ROOT, "assets/family-engagement/engagement-beacon.js"), "utf8");

/** A D1 stand-in that records every statement and bind. */
function fakeDb(rows = []) {
  const writes = [];
  const reads = [];
  return {
    writes,
    reads,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) {
          args = a;
          return stmt;
        },
        async run() {
          if (/INSERT INTO family_engagement/.test(sql)) writes.push(args);
          return { meta: {} };
        },
        async all() {
          reads.push({ sql, args });
          return { results: rows };
        },
      };
      return stmt;
    },
  };
}

const PII = {
  studentName: "Marisol Vega",
  saveCode: "RATIOS-4K7M",
  lessonId: "3-1",
  path: "/lessons/3-1/homework.html?code=RATIOS-4K7M",
  email: "parent@example.com",
  userAgent: "Mozilla/5.0",
  ip: "203.0.113.9",
  timestamp: "2026-10-16T19:03:11Z",
};

async function post(body, env, headers = {}) {
  const res = await onRequest({
    request: new Request("https://eduwonderlab.com/api/family-engagement", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
      headers: { "Content-Type": "text/plain", "User-Agent": "Mozilla/5.0", ...headers },
    }),
    env,
  });
  return res;
}

/* ------------------------------------------------------------ 1. writes -- */

test("only the five closed-vocabulary fields survive normalisation", () => {
  const entry = normalizeEngagement({
    event: "tab",
    route: "core",
    tab: "words",
    lang: "es",
    device: "mobile",
    ...PII,
  });
  assert.deepEqual(entry, { event: "tab", route: "core", tab: "words", lang: "es", device: "mobile" });
  assert.deepEqual(Object.keys(entry).sort(), ["device", "event", "lang", "route", "tab"]);
});

test("anything outside the vocabulary is dropped, never stored", () => {
  for (const bad of [
    null,
    "x",
    [],
    {},
    { event: "open" },
    { event: "open", route: "<script>" },
    { event: "visit", route: "full" },
    { event: "tab", route: "full" },
    { event: "tab", route: "full", tab: "student-7" },
    { event: "route", route: "RATIOS-4K7M" },
  ]) {
    assert.equal(normalizeEngagement(bad), null, JSON.stringify(bad));
  }
  const odd = normalizeEngagement({ event: "open", route: "FULL", lang: "fr", device: "watch" });
  assert.deepEqual(odd, { event: "open", route: "full", tab: "", lang: "en", device: "desktop" });
  // A tab is only meaningful for a tab event; a stray one never reaches storage.
  assert.equal(normalizeEngagement({ event: "open", route: "core", tab: "words" }).tab, "");
});

test("a write carrying names, codes, paths, emails and an IP stores nothing but the vocabulary", async () => {
  const db = fakeDb();
  const res = await post({ event: "open", route: "full", lang: "en", device: "tablet", ...PII }, { DB: db }, {
    "CF-Connecting-IP": PII.ip,
  });
  assert.equal(res.status, 204);
  assert.equal(db.writes.length, 1);
  const [week, event, route, tab, lang, device] = db.writes[0];
  assert.match(week, /^\d{4}-\d{2}-\d{2}$/);
  assert.deepEqual([event, route, tab, lang, device], ["open", "full", "", "en", "tablet"]);
  const everything = JSON.stringify(db.writes);
  for (const secret of Object.values(PII)) {
    assert.equal(everything.includes(secret), false, `${secret} reached the database`);
  }
  assert.equal(db.writes[0].length, 6, "only week + the five fields are bound");
});

test("bad bodies, no database and cross-origin writes are accepted silently and store nothing", async () => {
  const db = fakeDb();
  assert.equal((await post({ event: "open", route: "nope" }, { DB: db })).status, 204);
  assert.equal((await post({ event: "open", route: "full" }, {})).status, 204);
  assert.equal(
    (await post({ event: "open", route: "full" }, { DB: db }, { Origin: "https://evil.example" })).status,
    204,
  );
  assert.equal(db.writes.length, 0);
  assert.equal((await post("{not json", { DB: db })).status, 400);
});

test("the week is the only time ever stored: a Monday date", () => {
  assert.equal(weekStart(new Date("2026-10-16T19:03:11Z")), "2026-10-12");
  assert.equal(weekStart(new Date("2026-10-12T00:00:00Z")), "2026-10-12");
  assert.equal(weekStart(new Date("2026-10-18T23:59:59Z")), "2026-10-12");
});

/* ---------------------------------------------------------- 2. storage -- */

test("the table has no column that could hold a person, a lesson, an address or a time of day", () => {
  const ddl = /CREATE TABLE IF NOT EXISTS family_engagement \(([\s\S]*?)PRIMARY KEY/.exec(SOURCE)[1];
  const columns = [...ddl.matchAll(/^\s*(\w+)\s+(?:TEXT|INTEGER)/gm)].map((m) => m[1]);
  assert.deepEqual(columns, ["week", "event", "route", "tab", "lang", "device", "n"]);
  for (const forbidden of [
    "student",
    "name",
    "code",
    "family",
    "lesson",
    "path",
    "url",
    "ip",
    "agent",
    "session",
    "email",
    "at",
    "time",
    "ts",
  ]) {
    assert.equal(columns.includes(forbidden), false, `column ${forbidden}`);
  }
});

test("the endpoint never logs and never reads identifying request headers", () => {
  assert.doesNotMatch(SOURCE, /console\./);
  assert.doesNotMatch(SOURCE, /CF-Connecting-IP[\s\S]{0,40}bind/);
  const binds = [...SOURCE.matchAll(/\.bind\(([^)]*)\)/g)].map((m) => m[1]);
  for (const b of binds) assert.doesNotMatch(b, /request|ip|agent|header/i, b);
});

/* ------------------------------------------------------------ 3. client -- */

async function runBeacon({ url = "https://eduwonderlab.com/lessons/3-1/homework.html?code=RATIOS-4K7M", mutate } = {}) {
  const dom = new JSDOM(
    `<!doctype html><html lang="es"><body data-homework-route="core" data-active-tab="learn">
       <p id="name">Marisol Vega</p>
       <button data-route-mode="quick">Quick</button>
     </body></html>`,
    { url, runScripts: "outside-only", pretendToBeVisual: true },
  );
  const sent = [];
  dom.window.navigator.sendBeacon = (target, blob) => {
    sent.push({ target, blob });
    return true;
  };
  dom.window.localStorage.setItem("student-name", "Marisol Vega");
  dom.window.localStorage.setItem("hw_answer_3-1", "42");
  if (mutate) mutate(dom.window);
  dom.window.eval(BEACON);
  // The beacon starts at DOMContentLoaded, as it does in a real page.
  await new Promise((r) => setTimeout(r, 30));
  return { dom, sent };
}

async function payloads(sent) {
  return Promise.all(sent.map(async (s) => JSON.parse(await s.blob.text())));
}

test("the beacon sends the five fields only, from a page full of personal data", async () => {
  const { dom, sent } = await runBeacon();
  const body = dom.window.document.body;
  body.dataset.activeTab = "words";
  await new Promise((r) => setTimeout(r, 20));
  dom.window.document.querySelector("[data-route-mode]").click();
  body.dataset.activeTab = "done";
  await new Promise((r) => setTimeout(r, 20));
  const all = await payloads(sent);
  assert.ok(all.length >= 4, `expected open + tab + route + done, got ${all.length}`);
  assert.deepEqual(all[0], { event: "open", route: "core", lang: "es", device: "desktop" });
  for (const p of all) {
    assert.ok(Object.keys(p).every((k) => ["event", "route", "tab", "lang", "device"].includes(k)), JSON.stringify(p));
    assert.ok(EVENTS.includes(p.event) && ROUTES.includes(p.route));
    assert.ok(LANGS.includes(p.lang) && DEVICES.includes(p.device));
    if (p.tab) assert.ok(TABS.includes(p.tab));
  }
  const wire = JSON.stringify(all) + sent.map((s) => s.target).join();
  for (const secret of ["Marisol", "RATIOS", "4K7M", "3-1", "homework.html", "42", "student-name"]) {
    assert.equal(wire.includes(secret), false, `"${secret}" reached the beacon`);
  }
  assert.ok(sent.every((s) => s.target === "/api/family-engagement"));
  assert.ok(all.some((p) => p.event === "tab" && p.tab === "learn"), "leaving Learn for Words completes Learn");
  assert.ok(all.some((p) => p.event === "tab" && p.tab === "done"), "reaching Done is recorded once");
  assert.ok(all.some((p) => p.event === "route" && p.route === "quick"));
});

test("going back a tab, or revisiting one, never counts a tab twice", async () => {
  const { dom, sent } = await runBeacon();
  const body = dom.window.document.body;
  for (const tab of ["words", "learn", "words", "check"]) {
    body.dataset.activeTab = tab;
    await new Promise((r) => setTimeout(r, 15));
  }
  const tabs = (await payloads(sent)).filter((p) => p.event === "tab").map((p) => p.tab);
  assert.deepEqual(tabs, ["learn", "words"]);
});

test("no beacon on localhost, in Teacher Mode, or under Do Not Track", async () => {
  const local = await runBeacon({ url: "http://localhost:8708/lessons/3-1/homework.html" });
  assert.equal(local.sent.length, 0);
  const teacher = await runBeacon({ mutate: (w) => w.localStorage.setItem("nt-teacher-mode", "true") });
  assert.equal(teacher.sent.length, 0);
  const dnt = await runBeacon({
    mutate: (w) => Object.defineProperty(w.navigator, "doNotTrack", { value: "1", configurable: true }),
  });
  assert.equal(dnt.sent.length, 0);
});

/* -------------------------------------------------------------- 4. reads -- */

test("small counts are hidden and one hidden cell is never recoverable by subtraction", () => {
  assert.deepEqual(suppress({ quick: 2, core: 40, full: 60 }), { quick: null, core: null, full: 60 });
  assert.deepEqual(suppress({ quick: 0, core: 40, full: 60 }), { quick: 0, core: 40, full: 60 });
  assert.deepEqual(suppress({ quick: 3, core: 4, full: 60 }), { quick: null, core: null, full: 60 });
  assert.deepEqual(suppress({ en: 90, es: 3 }), { en: null, es: null });
});

test("a week with fewer than K events shows no breakdown and no total", () => {
  const rows = [{ week: "2026-10-12", event: "open", route: "full", tab: "", lang: "es", device: "mobile", n: K_ANONYMITY - 1 }];
  const [week] = aggregate(rows);
  assert.deepEqual(week.open, { total: null, suppressed: true });
  assert.deepEqual(week.route, { total: 0 });
  assert.equal(JSON.stringify(week).includes("mobile"), false);
});

test("a busy week reports totals and breakdowns by route, language and device", () => {
  const mk = (route, lang, device, n, event = "open", tab = "") => ({ week: "2026-10-12", event, route, tab, lang, device, n });
  const [week] = aggregate([
    mk("full", "en", "mobile", 30),
    mk("full", "es", "mobile", 12),
    mk("core", "en", "desktop", 20),
    mk("quick", "en", "tablet", 2),
    mk("full", "en", "mobile", 9, "tab", "learn"),
    mk("full", "en", "mobile", 6, "tab", "check"),
  ]);
  assert.equal(week.open.total, 64);
  assert.equal(week.open.route.full, 42);
  assert.equal(week.open.route.quick, null, "2 is hidden");
  assert.equal(week.open.route.core, null, "and the next smallest is hidden with it, so 2 cannot be got by subtraction");
  assert.equal(week.open.lang.es, 12);
  assert.deepEqual(week.tab.tab.learn, 9);
  assert.equal(week.tab.total, 15);
  assert.equal(Object.hasOwn(week.open, "tab"), false, "opens have no tab breakdown");
});

test("the read needs the teacher key in a header, and a key in the address does not work", async () => {
  const env = { DB: fakeDb(), TEACHER_KEY: "sekret" };
  const get = (path, headers) =>
    onRequest({ request: new Request(`https://eduwonderlab.com/api/family-engagement${path}`, { headers }), env });
  assert.equal((await get("", {})).status, 401);
  assert.equal((await get("?key=sekret", {})).status, 401);
  assert.equal((await get("", { "x-teacher-key": "wrong" })).status, 401);
  assert.equal(
    (await onRequest({ request: new Request("https://eduwonderlab.com/api/family-engagement"), env: { DB: env.DB } })).status,
    503,
  );
  const ok = await get("?weeks=500", { "x-teacher-key": "sekret" });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(body.k, K_ANONYMITY);
  assert.deepEqual(body.weeks, []);
  assert.match(env.DB.reads[0].sql, /FROM family_engagement/);
  assert.doesNotMatch(env.DB.reads[0].sql, /SELECT \*/);
});
