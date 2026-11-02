import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCheckin,
  checkinMessage,
  checkinUrl,
  decodeCheckin,
  encodeCheckin,
  newSince,
} from "../access-practice-lab/src/checkin.js";
import {
  addCheckin,
  emptyRoster,
  markStamped,
  needsStamp,
  removeStudent,
  sanitizeRoster,
  waiting,
} from "../access-practice-lab/src/checkin-roster.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import { journeyHTML, routeProgress } from "../access-practice-lab/src/journey.js";

const text = (wrapped) => wrapped[Object.getOwnPropertySymbols(wrapped)[0]];
const rows = (domain, level, n, done) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${domain}-${level}-${i}`,
    domain,
    level,
    band: "3-5",
    record: { complete: done.includes(i) ? [`${domain}-${level}-${i}`] : [], results: {} },
  }));
const routes = routeProgress([
  ...rows("Reading", "A", 12, [0, 1, 2]),
  ...rows("Listening", "B", 12, []),
]);

test("a check-in round-trips and carries only a nickname, a date and stop flags", () => {
  const c = buildCheckin({ alias: "Mia R.", band: "3-5", date: "2026-10-29", routes });
  assert.deepEqual(Object.keys(c).sort(), ["a", "b", "kind", "r", "t", "v"]);
  assert.equal(c.r.length, 1, "routes with no finished stop are left out");
  const back = decodeCheckin(encodeCheckin(c));
  assert.equal(back.alias, "Mia R.");
  assert.deepEqual(back.routes[0], {
    domain: "Reading",
    level: "A",
    stops: [true, true, true, ...Array(9).fill(false)],
  });
  assert.equal(decodeCheckin(checkinUrl(c, "https://eduwonderlab.com")).alias, "Mia R.");
  assert.ok(
    checkinUrl(c, "https://eduwonderlab.com").startsWith(
      "https://eduwonderlab.com/access-teacher/#checkin=",
    ),
    "fragment, so the server never receives it",
  );
});

test("decode treats input as untrusted", () => {
  const good = {
    v: 1,
    kind: "checkin",
    a: "Sam",
    b: "6-8",
    t: "2026-10-29",
    r: [{ d: "Writing", l: "C", s: "101" }],
  };
  const enc = (o) => encodeCheckin(o);
  assert.ok(decodeCheckin(enc(good)));
  for (const bad of [
    "",
    "not a link",
    "%%%",
    "a".repeat(5000),
    enc({ ...good, kind: "share" }),
    enc({ ...good, b: "9-9" }),
    enc({ ...good, t: "yesterday" }),
    enc({ ...good, a: "" }),
    enc({ ...good, a: "<>" }),
    enc({ ...good, r: [{ d: "Math", l: "A", s: "1" }] }),
    enc({ ...good, r: [{ d: "Reading", l: "Z", s: "1" }] }),
    enc({ ...good, r: [{ d: "Reading", l: "A", s: "2" }] }),
    enc({ ...good, r: [{ d: "Reading", l: "A", s: "1".repeat(13) }] }),
    enc({ ...good, r: [good.r[0], good.r[0]] }),
  ])
    assert.throws(() => decodeCheckin(bad), Error, String(bad).slice(0, 30));
  const noisy = decodeCheckin(enc({ ...good, a: "A<b>\u0007c".padEnd(80, "x") }));
  assert.ok(!/[<>\u0007]/.test(noisy.alias) && noisy.alias.length <= 40);
});

test("new-since counts only stops finished after the last send", () => {
  assert.equal(newSince(routes, {}).length, 1);
  assert.equal(newSince(routes, { "Reading:A": 3 }).length, 0);
  assert.equal(newSince(routes, { "Reading:A": 1 })[0].fresh, 2);
});

test("messages are bilingual, name countries not levels, and the family copy has no link", () => {
  const c = buildCheckin({ alias: "Mia", band: "3-5", date: "2026-10-29", routes });
  const r = decodeCheckin(encodeCheckin(c)).routes;
  const en = checkinMessage(makeI18n("en"), {
    alias: "Mia",
    routes: r,
    url: "https://x/#checkin=abc",
  });
  const es = checkinMessage(makeI18n("es"), { alias: "Mia", routes: r });
  assert.match(en, /Egypt: 3 of 12 stops/);
  assert.match(es, /Egipto: 3 de 12 paradas/);
  assert.ok(en.includes("https://x/#checkin=abc") && !es.includes("http"));
  assert.ok(!/\b(level|nivel)\s*[ABC]\b/i.test(en + es));
});

test("the teacher roster never loses stops, tracks stamping, and survives junk storage", () => {
  const mk = (stops) => ({
    alias: "Mia",
    band: "3-5",
    date: "2026-10-29",
    routes: [{ domain: "Reading", level: "A", stops }],
  });
  const f = (n) => Array.from({ length: 12 }, (_, i) => i < n);
  let { roster, added, id } = addCheckin(emptyRoster(), mk(f(3)));
  assert.equal(added, 3);
  assert.equal(needsStamp(roster.students[id])[0].fresh, 3);
  roster = markStamped(roster, id);
  assert.equal(waiting(roster).length, 0);
  ({ roster, added } = addCheckin(roster, mk(f(5))));
  assert.equal(added, 2);
  assert.equal(needsStamp(roster.students[id])[0].fresh, 2);
  ({ roster, added } = addCheckin(roster, mk(f(1))));
  assert.equal(added, 0, "an older, smaller check-in cannot undo newer stops");
  assert.equal(needsStamp(roster.students[id])[0].done, 5);
  assert.deepEqual(sanitizeRoster(JSON.parse(JSON.stringify(roster))), roster);
  assert.equal(Object.keys(removeStudent(roster, id).students).length, 0);
  for (const junk of [
    null,
    "x",
    [],
    { v: 2 },
    { v: 1, students: { a: { alias: 5 } } },
    { v: 1, students: { a: { alias: "A", band: "3-5", routes: { "Bad:Z": { stops: [true] } } } } },
  ])
    assert.deepEqual(
      Object.values(sanitizeRoster(junk).students).flatMap((s) => Object.keys(s.routes)),
      [],
    );
});

test("every unfinished country offers one Continue link to its first open stop", () => {
  const out = text(journeyHTML(makeI18n("en"), routes));
  assert.equal(out.match(/journey-go/g).length, 2);
  assert.match(out, /Continue: stop 4/);
  assert.match(out, /Start: stop 1/);
  assert.match(text(journeyHTML(makeI18n("es"), routes)), /Continuar: parada 4/);
});
