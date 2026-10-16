/* Weekly Family Broadcast — privacy rules, and the student-chosen "Show my family"
 * lead. Drives the real onRequest() against a small in-memory D1 stand-in.
 *
 *   node --test functions/api/family-broadcast.test.mjs
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyShare,
  findShare,
  sanitizeShare,
  SHARE_MAX_SKILLS,
  SHARE_MAX_TEXT,
  shareableText,
} from "../../assets/family-share/family-share.js";
import { __test__, onRequest } from "./family-broadcast.js";

const CODE = "RATIOS-4K7M";
const OTHER = "RATIOS-9ZZZ";

/** A D1 stand-in that answers only the queries family-broadcast.js makes. */
function fakeDb(rows) {
  const queries = [];
  const db = {
    queries,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) {
          args = a;
          return stmt;
        },
        async run() {
          return { meta: { changes: 0 } };
        },
        async first() {
          queries.push({ sql, args });
          if (/FROM student_progress WHERE save_code/.test(sql)) {
            return rows.find((r) => r.save_code === args[0]) || null;
          }
          if (/COUNT\(\*\)/.test(sql)) return { n: 1 };
          if (/FROM load_miss/.test(sql)) return null;
          return null;
        },
        async all() {
          queries.push({ sql, args });
          return { results: [] };
        },
      };
      return stmt;
    },
  };
  return db;
}

function studentRow(state, overrides = {}) {
  return {
    save_code: CODE,
    student_name: "Marisol Vega",
    section: "6-2",
    activity_id: "3-1",
    activity_title: "Understand Ratios",
    updated_at: new Date().toISOString(),
    state_json: JSON.stringify(state),
    ...overrides,
  };
}

async function get(env, query = `code=${CODE}&lang=en`) {
  const res = await onRequest({
    request: new Request(`https://example.test/api/family-broadcast?${query}`),
    env,
  });
  return { res, body: await res.json() };
}

const NOW = new Date().toISOString();
const ON = (items, at = NOW) => ({ v: 1, on: true, items, at });

test("default is off: no familyShare means nothing is shared", async () => {
  const { body } = await get({ DB: fakeDb([studentRow({ custom: {} })]) });
  assert.equal(body.ok, true);
  assert.deepEqual(body.shared, []);
});

test("an opted-in student leads with their own picks, labelled in the family's language", async () => {
  const state = {
    custom: {
      familyShare: {
        familyShare: ON([
          { kind: "skill", std: "6.AT.2" },
          { kind: "words", text: "I found the cost of one by dividing the price by the count." },
          { kind: "model", id: "tape-diagram" },
        ]),
      },
    },
  };
  const en = await get({ DB: fakeDb([studentRow(state)]) });
  assert.equal(en.body.shared.length, 3);
  assert.deepEqual(
    en.body.shared.map((i) => i.kind),
    ["skill", "words", "model"],
  );
  assert.equal(en.body.shared[0].label, "Unit rates");
  assert.equal(en.body.shared[2].label, "Tape diagram");
  assert.equal(en.body.child.displayName, "Marisol");
  assert.equal(en.body.thin, false);

  const es = await get({ DB: fakeDb([studentRow(state)]) }, `code=${CODE}&lang=es`);
  assert.equal(es.body.shared[0].label, "Tasas unitarias");
  assert.equal(es.body.shared[2].label, "Diagrama de cinta");
  assert.equal(es.body.shared[1].text, en.body.shared[1].text, "the student's words are never translated or edited");
});

test("unsharing wins: the newest choice is the one that counts, and erases older copies", async () => {
  const on = ON([{ kind: "skill", std: "6.AT.2" }], "2026-10-01T10:00:00.000Z");
  const state = applyShare({ custom: { p3: { familyShare: on } } }, {
    v: 1,
    on: false,
    items: [],
    at: "2026-10-02T10:00:00.000Z",
  });
  const { body } = await get({ DB: fakeDb([studentRow(state)]) });
  assert.deepEqual(body.shared, []);
  assert.equal(JSON.stringify(state).includes("6.AT.2"), false, "no stale copy of the picks is left");
});

test("the engine's own provider key is read, and the newest copy wins", () => {
  const older = ON([{ kind: "skill", std: "6.AT.1" }], "2026-10-01T00:00:00.000Z");
  const newer = ON([{ kind: "skill", std: "6.AT.4" }], "2026-10-03T00:00:00.000Z");
  const found = findShare({ custom: { p0: { familyShare: older }, p2: { familyShare: newer } } });
  assert.deepEqual(found.items, [{ kind: "skill", std: "6.AT.4" }]);
});

test("only a known standard, a listed tool and a clean sentence can be shared", async () => {
  const state = {
    custom: {
      p0: {
        familyShare: ON([
          { kind: "skill", std: "9.ZZ.9" },
          { kind: "skill", std: "6.AT.1\"><script>" },
          { kind: "model", id: "<img src=x>" },
          { kind: "words", text: "Call me at 410-555-0199 any time" },
          { kind: "words", text: "email me kid@example.com" },
          { kind: "words", text: "see https://evil.example/a" },
          { kind: "grade", value: 98 },
          { kind: "skill", std: "6.AT.1" },
        ]),
      },
    },
  };
  const { body } = await get({ DB: fakeDb([studentRow(state)]) });
  assert.deepEqual(body.shared, [{ kind: "skill", standard: "6.AT.1", label: "Understanding ratios" }]);
});

test("limits: three skills, one explanation, one tool, 280 characters", () => {
  const share = sanitizeShare(
    ON([
      { kind: "skill", std: "6.AT.1" },
      { kind: "skill", std: "6.AT.2" },
      { kind: "skill", std: "6.AT.3" },
      { kind: "skill", std: "6.AT.4" },
      { kind: "words", text: "x".repeat(900) },
      { kind: "words", text: "a second explanation" },
      { kind: "model", id: "tape-diagram" },
      { kind: "model", id: "ratio-table" },
    ]),
  );
  assert.equal(share.items.filter((i) => i.kind === "skill").length, SHARE_MAX_SKILLS);
  assert.equal(share.items.filter((i) => i.kind === "words").length, 1);
  assert.equal(share.items.filter((i) => i.kind === "model").length, 1);
  assert.equal(share.items.find((i) => i.kind === "words").text.length, SHARE_MAX_TEXT);
});

test("a malformed or oversized state shares nothing and does not break the broadcast", async () => {
  for (const state_json of ["{not json", "[]", "null", `{"x":"${"a".repeat(1_600_000)}"}`]) {
    const { res, body } = await get({ DB: fakeDb([studentRow({}, { state_json })]) });
    assert.equal(res.status, 200);
    assert.deepEqual(body.shared, []);
  }
});

test("the text guard rejects contact details and links, and allows ordinary math sentences", () => {
  assert.equal(shareableText("I split the bar into 4 equal parts."), true);
  assert.equal(shareableText("my number is 410 555 0199"), false);
  assert.equal(shareableText("a@b.co"), false);
  assert.equal(shareableText("go to www.example.com"), false);
  assert.equal(shareableText("ok"), false);
});

test("privacy rules survive: bad code, unknown code and a stranger's code are one identical 401", async () => {
  const env = { DB: fakeDb([studentRow({})]) };
  const results = [];
  for (const code of ["nope", "AAA-AAAA", OTHER]) {
    const { res, body } = await get(env, `code=${code}`);
    results.push([res.status, JSON.stringify(body)]);
  }
  assert.deepEqual(new Set(results.map((r) => r.join("|"))).size, 1);
  assert.equal(results[0][0], 401);
});

test("one child only: the response never carries another row's picks or the raw state", async () => {
  const mine = studentRow({
    custom: { p0: { familyShare: ON([{ kind: "words", text: "My own explanation of a ratio." }]) } },
    secretField: "never-returned",
  });
  const theirs = studentRow(
    { custom: { p0: { familyShare: ON([{ kind: "words", text: "Another child's words." }]) } } },
    { save_code: OTHER, student_name: "Dev Patel" },
  );
  const { res, body } = await get({ DB: fakeDb([mine, theirs]) });
  const wire = JSON.stringify(body);
  assert.equal(wire.includes("Another child"), false);
  assert.equal(wire.includes("Dev"), false);
  assert.equal(wire.includes("never-returned"), false);
  assert.equal(wire.includes("state_json"), false);
  assert.equal(res.headers.get("access-control-allow-origin"), null);
  assert.match(res.headers.get("cache-control"), /no-store/);
});

test("with no database the broadcast is impersonal and shares nothing", async () => {
  const { body } = await get({});
  assert.equal(body.offline, true);
  assert.deepEqual(body.shared, []);
});

test("sharedItems drops everything when sharing is off", () => {
  const off = JSON.stringify({ custom: { p0: { familyShare: { v: 1, on: false, items: [{ kind: "skill", std: "6.AT.1" }], at: NOW } } } });
  assert.deepEqual(__test__.sharedItems(off, "en"), []);
});

test("the text guard does not reject ordinary math sentences with numbers", () => {
  assert.equal(shareableText("Half of 0.375 is 0.1875 and 12 + 15 = 27."), true);
  assert.equal(shareableText("The unit rate is 2.5 miles per 1 hour, so 5 hours is 12.5 miles."), true);
});
