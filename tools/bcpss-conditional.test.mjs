// Contract test: /api/bcpss/units/:id stays backward compatible and gains ?fields= and ETag/304.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  etagOf,
  matchesEtag,
  parseFields,
  selectFields,
} from "../functions/_lib/bcpss/conditional.js";
import { onRequest } from "../functions/api/bcpss/units/[unitId].js";

const call = (qs = "", headers = {}) =>
  onRequest({
    request: new Request(`https://x.test/api/bcpss/units/g6-math-u2${qs}`, { headers }),
    params: { unitId: "g6-math-u2" },
    env: {},
  });

test("no fields param: full unchanged body plus an ETag", async () => {
  const res = await call();
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(res.headers.get("ETag"));
  assert.ok(Object.keys(body).length > 3);
});

test("?fields= returns only the requested keys and is smaller", async () => {
  const full = await (await call()).text();
  const keys = Object.keys(JSON.parse(full)).slice(0, 2);
  const res = await call(`?fields=${keys.join(",")}`);
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.deepEqual(Object.keys(JSON.parse(text)).sort(), [...keys].sort());
  assert.ok(text.length < full.length);
});

test("If-None-Match with the current ETag returns 304 with no body", async () => {
  const etag = (await call()).headers.get("ETag");
  const res = await call("", { "If-None-Match": etag });
  assert.equal(res.status, 304);
  assert.equal(await res.text(), "");
});

test("a different field set has a different ETag", async () => {
  const a = (await call()).headers.get("ETag");
  const key = Object.keys(await (await call()).json())[0];
  const b = (await call(`?fields=${key}`)).headers.get("ETag");
  assert.notEqual(a, b);
});

test("negative control: unknown or malformed fields are rejected, not ignored", async () => {
  assert.equal((await call("?fields=does_not_exist")).status, 400);
  assert.equal((await call("?fields=a;b")).status, 400);
  assert.equal(
    (await call(`?fields=${Array.from({ length: 41 }, (_, i) => `f${i}`).join(",")}`)).status,
    400,
  );
});

test("pure helpers: dotted selection, weak etag matching", async () => {
  const body = { a: { b: 1, c: 2 }, d: 3 };
  assert.deepEqual(selectFields(body, ["a.b"]), { a: { b: 1 } });
  assert.equal(parseFields("a.x", body).error, 'Unknown field "a.x".');
  const e = await etagOf(body);
  assert.ok(matchesEtag(e, e) && matchesEtag("*", e) && !matchesEtag('W/"nope"', e));
});
