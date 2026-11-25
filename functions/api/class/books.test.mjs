/* Tests for /api/class/books/* — Book Studio collaboration. The REAL endpoint runs against a REAL SQL engine
 * (node:sqlite) behind the same thin D1 adapter as class.test.mjs and social.test.mjs. */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { makeElement } from "../../../access-practice-lab/src/book/model.js";
import { COLLAB } from "../../../shared/class-platform/book-merge.js";
import { COLLAB_SCHEMA as BOOK_SCHEMA } from "../../_lib/class-platform/book-collab-schema.js";
import { onRequest } from "./[[path]].js";
import { freshDb } from "../../../tools/privacy-d1-fake.mjs";

function d1(sqlite) {
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
  return {
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
  };
}

const KEY = "teacher-secret-for-tests";
let ip = 0;
function world() {
  const sqlite = freshDb();
  return { sqlite, env: { DB: d1(sqlite), TEACHER_KEY: KEY } };
}

async function call(w, route, { method = "GET", body, query = "", headers = {} } = {}) {
  const h = { "CF-Connecting-IP": `10.3.${Math.floor(++ip / 250)}.${ip % 250}`, ...headers };
  if (body !== undefined) h["Content-Type"] = "application/json";
  const request = new Request(`https://example.test/api/class/${route}${query}`, {
    method,
    headers: h,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const res = await onRequest({ request, env: w.env, params: { path: route.split("/") } });
  const type = res.headers.get("Content-Type") || "";
  return { status: res.status, res, json: type.includes("json") ? await res.json() : null };
}

const teacher = { "x-teacher-key": KEY };
const as = (s) => ({ "x-class-student": `${s.studentId}.${s.studentKey}` });
const post = (w, route, who, body) => call(w, route, { method: "POST", headers: who, body });

async function setup(aliases = ["Ana", "Ben", "Cy"], app = "language") {
  const w = world();
  const c = await call(w, "create", { method: "POST", headers: teacher, body: { app, title: "P3" } });
  assert.equal(c.status, 200);
  const code = c.json.code;
  const kids = [];
  for (const alias of aliases) {
    const r = await call(w, "join", { method: "POST", body: { code, alias } });
    assert.equal(r.status, 200);
    kids.push(r.json);
  }
  return { w, code, kids, passcode: c.json.teacherPasscode };
}

const page = (id, ord) => ({ type: "upsertPage", id, baseRev: 0, ord, data: { bg: "#fffaf0" } });
const text = (id, pageId, words, baseRev = 0, extra = {}) => ({
  type: "upsertElement",
  id,
  page: pageId,
  baseRev,
  ord: 1,
  data: makeElement("text", { id, html: `<p>${words}</p>`, ...extra }),
  ...(baseRev ? { fields: ["html"] } : {}),
});

async function sharedBook() {
  const s = await setup();
  const [ana, ben] = s.kids;
  const share = await post(s.w, "books/share", as(ana), { code: s.code, meta: { title: "Our Trip" } });
  assert.equal(share.status, 200, JSON.stringify(share.json));
  assert.match(share.json.bookCode, /^[A-HJ-NP-Z2-9]{6}$/);
  const first = await post(s.w, "books/sync", as(ana), {
    code: s.code,
    bookId: share.json.bookId,
    since: 0,
    ops: [page("pg1aaaa", 1), text("tx1aaaa", "pg1aaaa", "Hello"), text("tx2bbbb", "pg1aaaa", "World")],
  });
  assert.equal(first.status, 200, JSON.stringify(first.json));
  const joined = await post(s.w, "books/join", as(ben), { code: s.code, bookCode: share.json.bookCode });
  assert.equal(joined.status, 200, JSON.stringify(joined.json));
  assert.equal(joined.json.role, "editor");
  return { ...s, ana, ben, bookId: share.json.bookId, bookCode: share.json.bookCode, rev: first.json.rev };
}

test("schema of record matches migration 0014", () => {
  const sql = readFileSync(fileURLToPath(new URL("../../../migrations/0015_book_collab.sql", import.meta.url)), "utf8");
  const norm = (s) => s.replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
  assert.equal(norm(sql), norm(BOOK_SCHEMA.map((s) => `${s};`).join("\n")));
});

test("without D1 every books route is 503 (collaboration unavailable)", async () => {
  const w = { env: {} };
  assert.equal((await call(w, "books/mine", { query: "?code=ABCDEF" })).status, 503);
  assert.equal((await call(w, "books/sync", { method: "POST", body: { code: "ABCDEF" } })).status, 503);
});

test("share → join by code → both see the same book; the joiner gets every item", async () => {
  const { w, code, ben, bookId } = await sharedBook();
  const r = await post(w, "books/sync", as(ben), { code, bookId, since: 0 });
  assert.equal(r.status, 200);
  const ids = r.json.items.map((i) => i.id).sort();
  assert.deepEqual(ids, ["meta", "pg1aaaa", "tx1aaaa", "tx2bbbb"]);
  assert.equal(r.json.items.find((i) => i.id === "meta").data.title, "Our Trip");
  assert.equal(r.json.role, "editor");
  assert.deepEqual(r.json.members.map((m) => m.alias).sort(), ["Ana", "Ben"]);
});

test("only learners of THIS class: another class, no key, a teacher of nothing", async () => {
  const { w, bookCode, bookId, code } = await sharedBook();
  const other = await call(w, "create", { method: "POST", headers: teacher, body: { app: "language", title: "P4" } });
  const zed = (await call(w, "join", { method: "POST", body: { code: other.json.code, alias: "Zed" } })).json;
  const j = await post(w, "books/join", as(zed), { code: other.json.code, bookCode });
  assert.equal(j.status, 404, "a book code does not cross classes");
  const s = await post(w, "books/sync", as(zed), { code: other.json.code, bookId, since: 0 });
  assert.equal(s.status, 404);
  const s2 = await post(w, "books/sync", as(zed), { code, bookId, since: 0 });
  assert.equal(s2.status, 401, "a learner of another class is not a learner of this one");
  assert.equal((await post(w, "books/sync", {}, { code, bookId, since: 0 })).status, 401);
});

test("a classmate who has not joined the book cannot read or write it", async () => {
  const { w, code, kids, bookId } = await sharedBook();
  const cy = kids[2];
  const r = await post(w, "books/sync", as(cy), { code, bookId, since: 0 });
  assert.equal(r.status, 403);
  assert.equal(r.json.error, "not-member");
  const pic = await call(w, "books/media", { headers: as(cy), query: `?code=${code}&bookId=${bookId}&mediaId=m1234567` });
  assert.equal(pic.status, 403);
});

test("concurrent edits: different elements both kept, same field resolves to the later arrival, attribution kept", async () => {
  const { w, code, ana, ben, bookId, rev } = await sharedBook();
  const [a, b] = await Promise.all([
    post(w, "books/sync", as(ana), { code, bookId, since: rev, ops: [text("tx1aaaa", "pg1aaaa", "Ana one", rev)] }),
    post(w, "books/sync", as(ben), { code, bookId, since: rev, ops: [text("tx2bbbb", "pg1aaaa", "Ben two", rev)] }),
  ]);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.notEqual(a.json.opsRev, b.json.opsRev, "every write gets its own revision");
  const c1 = await post(w, "books/sync", as(ana), { code, bookId, since: rev, ops: [text("tx1aaaa", "pg1aaaa", "Ana again", rev)] });
  assert.equal(c1.json.results[0].status, "merged", "stale op merged field by field");
  const c2 = await post(w, "books/sync", as(ben), { code, bookId, since: rev, ops: [text("tx1aaaa", "pg1aaaa", "Ben wins", rev)] });
  assert.equal(c2.json.results[0].status, "merged");
  const all = await post(w, "books/sync", as(ana), { code, bookId, since: 0 });
  const el = (id) => all.json.items.find((i) => i.id === id);
  assert.equal(el("tx1aaaa").data.html, "<p>Ben wins</p>");
  assert.equal(el("tx2bbbb").data.html, "<p>Ben two</p>");
  assert.equal(el("tx1aaaa").by, ben.studentId);
  const ana2 = all.json.members.find((m) => m.alias === "Ana");
  assert.ok(ana2.edits >= 2, "member edit counts attribute work");
});

test("the server sanitizes text it stores", async () => {
  const { w, code, ana, bookId, rev } = await sharedBook();
  const op = text("tx1aaaa", "pg1aaaa", "x", rev);
  op.data.html = '<p onclick="steal()">safe<script>alert(1)</script><img src=x onerror=alert(1)></p>';
  await post(w, "books/sync", as(ana), { code, bookId, since: rev, ops: [op] });
  const row = w.sqlite.prepare("SELECT data FROM class_platform_book_item WHERE item_id = 'tx1aaaa'").get();
  assert.equal(JSON.parse(row.data).html, "<p>safe</p>");
});

test("a page delete takes its elements; a stale edit after it is rejected", async () => {
  const { w, code, ana, ben, bookId, rev } = await sharedBook();
  await post(w, "books/sync", as(ana), { code, bookId, since: rev, ops: [page("pg2bbbb", 2)] });
  const del = await post(w, "books/sync", as(ana), { code, bookId, since: rev, ops: [{ type: "deletePage", id: "pg1aaaa", baseRev: rev }] });
  assert.equal(del.json.results[0].status, "applied");
  const stale = await post(w, "books/sync", as(ben), { code, bookId, since: rev, ops: [text("tx1aaaa", "pg1aaaa", "late", rev)] });
  assert.equal(stale.json.results[0].status, "rejected");
  assert.equal(stale.json.results[0].reason, "deleted");
  const dead = w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_book_item WHERE deleted = 1").get();
  assert.equal(Number(dead.n), 3, "the page and both its elements");
});

test("roles: the owner makes a collaborator a viewer; the server refuses the viewer's edits", async () => {
  const { w, code, ana, ben, bookId, rev } = await sharedBook();
  const notOwner = await post(w, "books/member", as(ben), { code, bookId, studentId: ana.studentId, role: "viewer" });
  assert.equal(notOwner.status, 403);
  const set = await post(w, "books/member", as(ana), { code, bookId, studentId: ben.studentId, role: "viewer" });
  assert.equal(set.status, 200);
  const r = await post(w, "books/sync", as(ben), { code, bookId, since: rev, ops: [text("tx1aaaa", "pg1aaaa", "viewer edit", rev)] });
  assert.equal(r.status, 200);
  assert.equal(r.json.role, "viewer");
  assert.equal(r.json.results[0].status, "rejected");
  assert.equal(r.json.results[0].reason, "read-only");
  assert.equal(r.json.results[0].item.data.html, "<p>Hello</p>", "the shared copy comes back to the device");
  const row = w.sqlite.prepare("SELECT data FROM class_platform_book_item WHERE item_id = 'tx1aaaa'").get();
  assert.equal(JSON.parse(row.data).html, "<p>Hello</p>");
  const pic = await post(w, "books/media", as(ben), { code, bookId, mediaId: "mabc1234", mime: "image/jpeg", data: "x" });
  assert.equal(pic.status, 403);
});

test("teacher: lists books and participants, read-only blocks edits server-side, removes a participant, turns the space off", async () => {
  const { w, code, ana, ben, bookId, rev, passcode } = await sharedBook();
  assert.equal((await call(w, "books/class", { query: `?code=${code}`, headers: as(ana) })).status, 401);
  const list = await call(w, "books/class", { query: `?code=${code}`, headers: { "x-class-teacher": passcode } });
  assert.equal(list.status, 200);
  assert.equal(list.json.enabled, true);
  assert.equal(list.json.books[0].title, "Our Trip");
  assert.equal(list.json.books[0].ownerAlias, "Ana");
  // Members join within the same millisecond, so their list order is not part of the contract: compare as a set.
  assert.deepEqual(
    list.json.books[0].members.map((m) => [m.alias, m.role]).sort((x, y) => x[0].localeCompare(y[0])),
    [["Ana", "owner"], ["Ben", "editor"]],
  );

  const lock = await post(w, "books/lock", teacher, { code, bookId, locked: true });
  assert.equal(lock.status, 200);
  const blocked = await post(w, "books/sync", as(ana), { code, bookId, since: rev, ops: [text("tx1aaaa", "pg1aaaa", "owner edit", rev)] });
  assert.equal(blocked.json.results[0].reason, "read-only", "even the owner cannot edit a read-only book");
  assert.equal(blocked.json.locked, true);
  await post(w, "books/lock", teacher, { code, bookId, locked: false });

  const rm = await post(w, "books/member", teacher, { code, bookId, studentId: ben.studentId, remove: true });
  assert.equal(rm.status, 200);
  assert.equal((await post(w, "books/sync", as(ben), { code, bookId, since: 0 })).json.error, "not-member");
  const back = await post(w, "books/join", as(ben), { code, bookCode: list.json.books[0].bookCode });
  assert.equal(back.json.error, "removed", "a removed participant cannot rejoin by code");

  const off = await post(w, "books/space", teacher, { code, enabled: false });
  assert.equal(off.status, 200);
  const r = await post(w, "books/sync", as(ana), { code, bookId, since: 0 });
  assert.equal(r.status, 403);
  assert.equal(r.json.error, "collab-off");
  const mine = await call(w, "books/mine", { query: `?code=${code}`, headers: as(ana) });
  assert.equal(mine.json.enabled, false);
  assert.equal((await post(w, "books/share", as(ana), { code, meta: {} })).json.error, "collab-off");
});

test("presence: who is here, on which page, editing which element", async () => {
  const { w, code, ana, ben, bookId } = await sharedBook();
  await post(w, "books/sync", as(ana), { code, bookId, since: 0, presence: { pageId: "pg1aaaa", selected: "tx1aaaa", editing: true } });
  const r = await post(w, "books/sync", as(ben), { code, bookId, since: 0, presence: { pageId: "pg1aaaa" } });
  assert.deepEqual(r.json.presence, [
    { studentId: ana.studentId, alias: "Ana", role: "owner", pageId: "pg1aaaa", selected: "tx1aaaa", editing: true },
  ]);
  const bad = await post(w, "books/sync", as(ben), { code, bookId, since: 0, presence: { pageId: "<x>", selected: 5 } });
  assert.equal(bad.status, 200);
});

test("pictures: JPEG only, size and count caps, served to members", async () => {
  const { w, code, ana, ben, bookId } = await sharedBook();
  const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(400, 1)]);
  const up = await post(w, "books/media", as(ana), { code, bookId, mediaId: "mpic00001", mime: "image/jpeg", data: jpeg.toString("base64") });
  assert.equal(up.status, 200, JSON.stringify(up.json));
  const png = await post(w, "books/media", as(ana), { code, bookId, mediaId: "mpic00002", mime: "image/jpeg", data: Buffer.alloc(400, 9).toString("base64") });
  assert.equal(png.json.error, "invalid-picture");
  const huge = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(COLLAB.maxPictureBytes + 10)]);
  const tooBig = await post(w, "books/media", as(ana), { code, bookId, mediaId: "mpic00003", mime: "image/jpeg", data: huge.toString("base64") });
  assert.equal(tooBig.status, 413);
  const get = await call(w, "books/media", { headers: as(ben), query: `?code=${code}&bookId=${bookId}&mediaId=mpic00001` });
  assert.equal(get.status, 200);
  assert.equal(get.res.headers.get("Content-Type"), "image/jpeg");
  assert.equal(Buffer.from(await get.res.arrayBuffer()).length, jpeg.length);
  for (let i = 0; i < COLLAB.maxPictures - 1; i++)
    w.sqlite
      .prepare("INSERT INTO class_platform_book_media (book_id, media_id, mime, bytes, size, by_id, created_at) VALUES (?, ?, 'image/jpeg', ?, 1, 'x', 0)")
      .run(bookId, `mfill${String(i).padStart(4, "0")}`, Buffer.alloc(1));
  const full = await post(w, "books/media", as(ana), { code, bookId, mediaId: "mpic00004", mime: "image/jpeg", data: jpeg.toString("base64") });
  assert.equal(full.json.error, "too-many-pictures");
});

test("changes page by complete revisions and report more", async () => {
  const { w, code, ana, bookId } = await sharedBook();
  for (let n = 0; n < 8; n++) {
    const ops = [page(`pgx${n}aaa`, 10 + n)];
    for (let e = 0; e < 55; e++) ops.push(text(`e${n}x${String(e).padStart(3, "0")}`, `pgx${n}aaa`, "w"));
    const r = await post(w, "books/sync", as(ana), { code, bookId, since: 0, ops });
    assert.equal(r.status, 200, JSON.stringify(r.json).slice(0, 200));
  }
  let since = 0;
  const seen = new Set();
  let rounds = 0;
  for (;;) {
    const r = await post(w, "books/sync", as(ana), { code, bookId, since });
    for (const it of r.json.items) seen.add(it.id);
    rounds++;
    since = r.json.next;
    if (!r.json.more) break;
  }
  assert.ok(rounds > 1, "paged");
  assert.equal(seen.size, 4 + 8 * 56);
});

test("limits: books per owner, ops per sync, bad ops", async () => {
  const { w, code, ana, bookId } = await sharedBook();
  for (let i = 1; i < COLLAB.maxBooksPerOwner; i++)
    assert.equal((await post(w, "books/share", as(ana), { code, meta: { title: `B${i}` } })).status, 200);
  assert.equal((await post(w, "books/share", as(ana), { code, meta: {} })).json.error, "too-many-books");
  const bad = await post(w, "books/sync", as(ana), { code, bookId, since: 0, ops: [{ type: "dropTable" }] });
  assert.equal(bad.status, 400);
});

test("fluency classes have no book space", async () => {
  const s = await setup(["Ana"], "fluency");
  const r = await post(s.w, "books/share", as(s.kids[0]), { code: s.code, meta: {} });
  assert.equal(r.json.error, "invalid-app");
});

test("retention: removing the owner deletes their books; expired books are swept; class delete takes everything", async () => {
  const { w, code, ana, ben, bookId } = await sharedBook();
  // Ben's own book survives Ana's removal; Ana's book goes.
  const benBook = await post(w, "books/share", as(ben), { code, meta: { title: "Ben's" } });
  await post(w, "books/join", as(ana), { code, bookCode: benBook.json.bookCode });
  await post(w, "remove-student", teacher, { code, studentId: ana.studentId });
  const left = w.sqlite.prepare("SELECT book_id FROM class_platform_book").all().map((r) => r.book_id);
  assert.deepEqual(left, [benBook.json.bookId]);
  assert.equal(Number(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_book_item WHERE book_id = ?").get(bookId).n), 0);
  assert.equal(Number(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_book_member WHERE student_id = ?").get(ana.studentId).n), 0);
  // Expiry: the sweep runs on class creation.
  w.sqlite.prepare("UPDATE class_platform_book SET expires_at = 1").run();
  await call(w, "create", { method: "POST", headers: teacher, body: { app: "language", title: "P9" } });
  assert.equal(Number(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_book").get().n), 0);
  assert.equal(Number(w.sqlite.prepare("SELECT COUNT(*) AS n FROM class_platform_book_item").get().n), 0);
  // Class delete.
  const again = await post(w, "books/share", as(ben), { code, meta: {} });
  assert.equal(again.status, 200);
  await post(w, "delete", teacher, { code, confirm: code });
  for (const t of ["class_platform_book", "class_platform_book_item", "class_platform_book_member", "class_platform_book_media", "class_platform_book_space"])
    assert.equal(Number(w.sqlite.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n), 0, t);
});

test("owner stops sharing; a member leaves", async () => {
  const { w, code, ana, ben, bookId } = await sharedBook();
  assert.equal((await post(w, "books/leave", as(ana), { code, bookId })).json.error, "owner-cannot-leave");
  assert.equal((await post(w, "books/unshare", as(ben), { code, bookId })).status, 403);
  assert.equal((await post(w, "books/leave", as(ben), { code, bookId })).status, 200);
  assert.equal((await post(w, "books/unshare", as(ana), { code, bookId })).status, 200);
  assert.equal((await post(w, "books/sync", as(ana), { code, bookId, since: 0 })).json.error, "book-gone");
});
