// Class-first save on The Language Page (class/join-prompt.js, class/session.js, class/join-cards.js, views/class.js):
// the home join card and "Saved to" chip, ?join=CODE and QR parsing, "Practice on this device only", shared-device
// sign-out (in-page confirm, no native confirm, local data cleared without uploading an empty copy), sign back in
// with code + nickname + student key on another computer (restore AND union merge), and the teacher's join cards,
// reset-key and Google Classroom share link. Driven against the REAL /api/class Function over node:sqlite.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { JSDOM } from "jsdom";

const { VirtualConsole } = await import("jsdom");
const virtualConsole = new VirtualConsole(); // JSDOM cannot navigate; the sign-out reload is a no-op here
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  virtualConsole,
  url: "https://thelanguagepage.test/access-practice-lab/",
});
for (const k of [
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "navigator",
  "HTMLElement",
  "Event",
]) {
  Object.defineProperty(globalThis, k, {
    value: k === "window" ? dom.window : dom.window[k],
    configurable: true,
    writable: true,
  });
}
Object.defineProperty(globalThis, "location", { value: dom.window.location, configurable: true });
dom.window.confirm = globalThis.confirm = () => {
  throw new Error("native confirm() must not be used");
};

const { onRequest } = await import("../functions/api/class/[[path]].js");
const labLink = await import("../access-practice-lab/src/class/link.js");
const session = await import("../access-practice-lab/src/class/session.js");
const { mountJoinPrompt } = await import("../access-practice-lab/src/class/join-prompt.js");
const { classroomShareUrl } = await import("../access-practice-lab/src/class/join-cards.js");
const { mountClassPanel } = await import("../access-practice-lab/src/class/roster-panel.js");
const classView = await import("../access-practice-lab/src/views/class.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { saveRecord, loadRecord, PREFIX } = await import("../access-practice-lab/src/store.js");

function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    run: async () => ({
      success: true,
      meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) },
    }),
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        for (const s of statements) await s.run();
        sqlite.exec("COMMIT");
      } catch (err) {
        sqlite.exec("ROLLBACK");
        throw err;
      }
    },
  };
}

const KEY = "k-test";
const env = { DB: d1(new DatabaseSync(":memory:")), TEACHER_KEY: KEY };
let ip = 0;
const ROOT = new URL("../", import.meta.url);
const uploads = [];
async function serverFetch(input, init = {}) {
  const url = new URL(input, "https://thelanguagepage.test");
  if (!url.pathname.startsWith("/api/class/")) {
    try {
      return new Response(readFileSync(new URL(`.${decodeURIComponent(url.pathname)}`, ROOT)), {
        headers: { "content-type": "application/json" },
      });
    } catch {
      return new Response("not found", { status: 404 });
    }
  }
  if (init.method === "POST" && url.pathname.endsWith("/progress"))
    uploads.push(JSON.parse(init.body));
  const headers = new Headers(init.headers || {});
  headers.set("CF-Connecting-IP", `10.9.0.${++ip % 250}`);
  const request = new Request(url, { method: init.method || "GET", headers, body: init.body });
  return onRequest({
    request,
    env,
    params: { path: url.pathname.replace(/^\/api\/class\//, "").split("/") },
  });
}
globalThis.fetch = serverFetch;
const teacher = async (path, body) =>
  (
    await serverFetch(`/api/class/${path}`, {
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
      headers: { "x-teacher-key": KEY, "content-type": "application/json" },
    })
  ).json();
const settle = async (n = 40) => {
  for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0));
};
const ctx = { prefs: { lang: "en" }, band: "6-8", route: { view: "class" } };
const homeCtx = { ...ctx, route: { view: "home" } };
const submit = (sel) =>
  document.querySelector(sel).dispatchEvent(new dom.window.Event("submit", { cancelable: true }));
const type = (sel, value) => {
  document.querySelector(sel).value = value;
};
const click = (sel) => document.querySelector(sel).click();
const labKeys = () => Object.keys(localStorage).filter((k) => /^accessPracticeLab/.test(k));
async function mountClass(url) {
  dom.reconfigure({ url });
  classView.unmount();
  document.body.innerHTML = toHtml(classView.render(ctx).html);
  classView.mount(document.body, ctx);
  await settle();
}
const record = (id) => ({
  complete: [id],
  answers: { [id]: "a" },
  results: { [id]: { date: new Date().toISOString(), correct: true, practiced: true } },
});

let code;
let key;

test("QR and link parsing: ?join=, ?class=, bare codes; junk is refused", () => {
  assert.equal(session.joinCodeFromSearch("?join=abc234"), "ABC234");
  assert.equal(session.joinCodeFromSearch("?class=ABC234&grades=6-8"), "ABC234");
  assert.equal(session.joinCodeFromSearch("?join=ABC1"), "");
  assert.equal(
    session.codeFromScan("https://thelanguagepage.com/access-practice-lab/class?class=XYZ234"),
    "XYZ234",
  );
  assert.equal(session.codeFromScan(" xyz234 "), "XYZ234");
  assert.equal(session.codeFromScan("javascript:alert(1)"), "");
  assert.equal(session.codeFromScan("hello there"), "");
  const share = new URL(
    classroomShareUrl("https://thelanguagepage.com/access-practice-lab/class?class=XYZ234", "P3"),
  );
  assert.equal(share.origin + share.pathname, "https://classroom.google.com/share");
  assert.equal(
    share.searchParams.get("url"),
    "https://thelanguagepage.com/access-practice-lab/class?class=XYZ234",
  );
});

test("home: the join card is the default, ?join= prefills it, and 'this device only' is remembered", async () => {
  code = (await teacher("create", { app: "language", title: "Period 3 ELD" })).code;
  document.body.innerHTML = '<div id="h"></div>';
  const host = document.querySelector("#h");
  mountJoinPrompt(host, homeCtx, { fetchImpl: serverFetch, search: "" });
  assert.match(host.textContent, /Join your class to save your work on any computer/);
  assert.equal(document.querySelector("#jpCode").value, "");
  click("[data-join-device]");
  assert.equal(session.promptChoice(), "device");
  assert.equal(document.querySelector("[data-join-chip]").dataset.joinChip, "device");
  mountJoinPrompt(host, homeCtx, { fetchImpl: serverFetch, search: "" });
  assert.ok(!document.querySelector("#jpCode"), "the choice is remembered");
  mountJoinPrompt(host, homeCtx, { fetchImpl: serverFetch, search: `?join=${code.toLowerCase()}` });
  assert.equal(
    document.querySelector("#jpCode").value,
    code,
    "?join=CODE reopens the card with the code filled in",
  );
  mountJoinPrompt(
    host,
    { ...homeCtx, prefs: { lang: "es" } },
    { fetchImpl: serverFetch, search: "" },
  );
  assert.match(host.textContent, /Guardando solo en este dispositivo/, "Spanish copy");
});

test("home: joining from the card shows the student key once, then a 'Saved to <class>' chip that opens /class", async () => {
  const host = document.querySelector("#h");
  mountJoinPrompt(host, homeCtx, { fetchImpl: serverFetch, search: `?join=${code}` });
  type("#jpAlias", "Orbit");
  submit(".cls-prompt");
  await settle(80);
  const link = labLink.loadLink();
  assert.equal(link.code, code);
  key = link.studentKey;
  assert.equal(session.promptChoice(), "", "joining clears the device-only choice");
  assert.match(host.textContent, new RegExp(key), "the key is shown once");
  click(".cls-key button");
  assert.ok(!host.textContent.includes(key), "and hidden after 'I wrote it down'");
  const chip = host.querySelector("[data-join-chip='saved']");
  assert.match(chip.textContent, /Saved to Period 3 ELD/);
  assert.equal(new URL(chip.href).pathname, "/access-practice-lab/class");
});

test("shared device: sign out pushes work first, confirms in the page, clears this computer, never uploads an empty copy", async () => {
  await mountClass("https://thelanguagepage.test/access-practice-lab/class");
  saveRecord("6-8", "Reading", "A", record("read-main-idea")); // still waiting in the 4 s push delay
  click("[data-cls-signout]");
  assert.match(
    document.querySelector(".cls-confirm").textContent,
    new RegExp(`class code ${code}, nickname Orbit`),
  );
  const before = uploads.length;
  click(".cls-confirm .btn-primary");
  await settle(120);
  assert.equal(labLink.loadLink(), null, "the class link is gone");
  assert.deepEqual(labKeys(), [], "no lab data is left on this computer");
  assert.match(
    document.querySelector(".cls-confirm [role=status]").textContent,
    /Signing out/,
    "then reloads /class",
  );
  const after = uploads.slice(before);
  assert.ok(after.length >= 1, "the newest work was sent before clearing");
  assert.ok(
    after.every((u) => Object.keys(u.data.data).length > 0),
    "clearing never uploaded an empty copy",
  );
});

test("sign back in on another computer: wrong key is refused, the right key restores the learner's own work", async () => {
  await mountClass("https://thelanguagepage.test/access-practice-lab/class?signin=1");
  assert.ok(
    document.querySelector("form").classList.contains("cls-signin"),
    "?signin puts Sign back in first",
  );
  type("#clsInCode", code);
  type("#clsInAlias", "orbit");
  type("#clsKey", "ABCDEFGH");
  submit(".cls-signin");
  await settle(60);
  assert.match(document.querySelector(".cls-signin .cls-error").textContent, /does not match/);
  assert.equal(labLink.loadLink(), null);
  type("#clsKey", key.toLowerCase());
  submit(".cls-signin");
  await settle(120);
  assert.equal(labLink.loadLink().alias, "Orbit");
  assert.deepEqual(
    loadRecord("6-8", "Reading", "A").complete,
    ["read-main-idea"],
    "own work pulled down",
  );
  assert.ok(!document.querySelector(".cls-key"), "no new key on a sign-back-in");
});

test("sign back in on a computer that already has practice: the two are merged and the union goes back up", async () => {
  classView.unmount();
  labLink.stopSync();
  localStorage.clear();
  saveRecord("6-8", "Reading", "A", record("read-detail"));
  const res = await session.joinAndLink({
    code,
    alias: "Orbit",
    studentKey: key,
    fetchImpl: serverFetch,
  });
  assert.equal(res.ok, true);
  assert.equal(res.decision, "ask");
  assert.deepEqual(loadRecord("6-8", "Reading", "A").complete.sort(), [
    "read-detail",
    "read-main-idea",
  ]);
  await settle(20);
  await labLink.startSync({ fetchImpl: serverFetch }).push();
  const link = labLink.loadLink();
  const remote = await (
    await serverFetch(`/api/class/progress?code=${code}&doc=language`, {
      headers: { "x-class-student": `${link.studentId}.${link.studentKey}` },
    })
  ).json();
  const stored = JSON.parse(
    remote.data.data[`${PREFIX}:6-8:Reading:A`] || remote.data.data[`${PREFIX}:Reading:A`],
  );
  assert.deepEqual(
    stored.complete.sort(),
    ["read-detail", "read-main-idea"],
    "the class copy holds the union",
  );
  labLink.stopSync();
});

test("leave class uses an in-page confirm and keeps this device's practice", async () => {
  await mountClass("https://thelanguagepage.test/access-practice-lab/class");
  globalThis.fetch = async () => {
    throw new TypeError("offline");
  };
  saveRecord("6-8", "Writing", "A", record("write-claim"));
  click("[data-cls-signout]");
  click(".cls-confirm .btn-primary");
  await settle(60);
  assert.match(
    document.querySelector(".cls-confirm").textContent,
    /Sign out anyway/,
    "unsynced work is called out",
  );
  assert.ok(labLink.loadLink(), "nothing is cleared until the learner chooses");
  assert.ok(labKeys().some((k) => k.endsWith(":Writing:A")));
  globalThis.fetch = serverFetch;
  click("[data-cls-cancel]");
  click("[data-cls-leave]");
  assert.ok(document.querySelector(".cls-confirm"));
  click("[data-cls-cancel]");
  assert.ok(labLink.loadLink(), "cancel keeps the class");
  click("[data-cls-leave]");
  click(".cls-confirm .btn-primary");
  assert.equal(labLink.loadLink(), null);
  assert.ok(loadRecord("6-8", "Reading", "A").complete.length > 0, "practice stays");
  classView.unmount();
});

test("teacher: join cards with one class QR, a slip per student, reset key prints the new key, Classroom share link", async () => {
  localStorage.setItem(
    "accessPracticeLabClass:v1:teacher-classes",
    JSON.stringify([{ code, passcode: "", title: "Period 3 ELD" }]),
  );
  sessionStorage.setItem("accessPracticeLabClass:v1:site-key", KEY);
  document.body.innerHTML = '<div id="p"></div>';
  const panel = mountClassPanel(document.querySelector("#p"), {
    fetchImpl: serverFetch,
    origin: "https://thelanguagepage.test",
  });
  [...document.querySelectorAll("button")].find((b) => b.textContent.includes(code)).click();
  await settle(120);
  const area = document.querySelector(".cls-print-area");
  assert.equal(
    area.querySelectorAll(".cls-joincard .cls-qr svg").length,
    1,
    "one QR for the class",
  );
  assert.equal(area.querySelectorAll(".cls-slip").length, 1);
  assert.match(area.querySelector(".cls-slip").textContent, /Nickname: Orbit/);
  const share = new URL(document.querySelector("[data-ct-classroom]").href);
  assert.equal(share.hostname, "classroom.google.com");
  assert.match(share.searchParams.get("url"), new RegExp(`class=${code}`));
  click("[data-ct-reset]");
  await settle(60);
  const slip = area.querySelector(".cls-slip").textContent;
  const newKey = /Student key: ([A-Z2-9]{8})/.exec(slip)?.[1];
  assert.ok(newKey && newKey !== key, "the reset key is printed on the student's slip");
  const signedIn = await session.joinAndLink({
    code,
    alias: "Orbit",
    studentKey: newKey,
    fetchImpl: serverFetch,
  });
  assert.equal(signedIn.ok, true, "the new key signs the student back in");
  let printed = false;
  dom.window.print = () => {
    printed = document.body.classList.contains("cls-printing");
  };
  click("[data-ct-print]");
  assert.equal(printed, true, "print shows only the cards");
  panel.unmount();
  labLink.stopSync();
});
