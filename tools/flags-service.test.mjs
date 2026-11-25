// Flag service: evaluator precedence, requires, kill switch, signed overrides, endpoint, hygiene gate.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { onRequest } from "../functions/api/flags.js";
import { evaluateAll as evalIn, isEnabled as isIn } from "../shared/flags/evaluate.js";
import {
  evaluateAll,
  FlagError,
  isEnabled,
  registry,
  signOverrides,
  verifyOverrides,
} from "../shared/flags/index.js";
import { checkRegistry } from "./flags-hygiene.mjs";

process.env.FLAGS_STRICT = "1";
const KEY = "test-signing-key-0123456789-abcdefghij";
const NOW = Date.parse("2026-11-25T12:00:00Z");
const hours = (n) => new Date(NOW + n * 3_600_000).toISOString();
const flag = (key, extra = {}) => ({
  key,
  default: false,
  environments: { production: null, staging: null, preview: null, local: null },
  cohorts: { teacher: [], class: [], demo: [] },
  killSwitch: false,
  requires: [],
  ...extra,
});
const reg = (...flags) => ({ version: 1, flags });

test("registry defaults: every initial flag is off and documented", () => {
  const all = evaluateAll({ env: "production" });
  assert.equal(Object.keys(all).length, 9);
  assert.ok(Object.values(all).every((v) => v === false));
  for (const key of [
    "student_content_egress",
    "student_feedback_model",
    "speaking_feedback_upload",
    "district_aggregate_view",
    "demo_mode",
    "review_only_default",
    "model_teacher_assistant",
    "experiments",
    "csp_enforce",
  ]) {
    assert.ok(
      registry.flags.some((f) => f.key === key && f.description && f.owner),
      key,
    );
  }
});

test("precedence: override > cohort > environment > default", () => {
  const r = reg(
    flag("f", {
      default: true,
      environments: { production: false, staging: null, preview: null, local: null },
      cohorts: { teacher: ["t1"], class: [], demo: [] },
    }),
  );
  assert.equal(isIn(r, "f", { env: "staging" }), true, "null env inherits default");
  assert.equal(isIn(r, "f", { env: "production" }), false, "environment beats default");
  assert.equal(
    isIn(r, "f", { env: "production", teacherId: "t1" }),
    true,
    "cohort beats environment",
  );
  assert.equal(
    isIn(r, "f", { env: "production", teacherId: "t1" }, { f: false }),
    false,
    "override beats cohort",
  );
  assert.equal(
    isIn(r, "f", { env: "production" }, { f: true }),
    true,
    "override beats environment",
  );
});

test("cohorts match teacher, class and demo ids only", () => {
  const r = reg(flag("f", { cohorts: { teacher: ["t1"], class: ["c1"], demo: ["d1"] } }));
  assert.equal(isIn(r, "f", { env: "local", classId: "c1" }), true);
  assert.equal(isIn(r, "f", { env: "local", demo: "d1" }), true);
  assert.equal(isIn(r, "f", { env: "local", demo: true }), false);
  assert.equal(isIn(r, "f", { env: "local", teacherId: "other" }), false);
});

test("requires: a student feedback flag cannot be on while egress is off", () => {
  const forced = { student_feedback_model: true };
  assert.equal(isEnabled("student_feedback_model", { env: "local" }, forced), false);
  const r = reg(
    flag("student_content_egress", {
      environments: { production: null, staging: null, preview: null, local: true },
    }),
    flag("student_feedback_model", {
      requires: ["student_content_egress"],
      environments: { production: null, staging: null, preview: null, local: true },
    }),
  );
  assert.equal(isIn(r, "student_feedback_model", { env: "local" }), true);
  assert.equal(
    isIn(r, "student_feedback_model", { env: "local" }, { student_content_egress: false }),
    false,
  );
  assert.equal(isIn(r, "student_feedback_model", { env: "staging" }), false);
});

test("unknown flag: false normally, throws in strict mode", () => {
  assert.equal(isIn(reg(flag("f")), "nope", {}), false);
  assert.throws(() => isIn(reg(flag("f")), "nope", {}, {}, { strict: true }), FlagError);
  assert.throws(() => isEnabled("nope"), FlagError);
  assert.throws(() => isIn(reg(flag("f")), "f", { env: "moon" }, {}, { strict: true }), FlagError);
});

test("kill switch: override may turn it off, never on", () => {
  const r = reg(flag("k", { killSwitch: true, default: true }));
  assert.equal(isIn(r, "k", { env: "local" }, { k: false }), false);
  const off = reg(flag("k", { killSwitch: true }));
  assert.equal(isIn(off, "k", { env: "local" }, { k: true }), false);
});

test("untrusted ids cannot enable egress through a cohort", () => {
  const r = reg(
    flag("student_content_egress", { cohorts: { teacher: [], class: ["c1"], demo: [] } }),
  );
  assert.equal(isIn(r, "student_content_egress", { env: "local", classId: "c1" }), true);
  assert.equal(
    isIn(r, "student_content_egress", { env: "local", classId: "c1", trustedIds: false }),
    false,
  );
});

test("requires cycle throws instead of recursing forever", () => {
  const r = reg(
    flag("a", { default: true, requires: ["b"] }),
    flag("b", { default: true, requires: ["a"] }),
  );
  assert.throws(() => evalIn(r, { env: "local" }), FlagError);
});

test("signed overrides: accepted, tampered, expired, wrong key, no key, weak key, far expiry, unknown key", async () => {
  const r = reg(flag("a"), flag("b"));
  const signed = await signOverrides(
    { overrides: { a: true, ghost: true, b: "yes" }, expires: hours(2) },
    KEY,
  );
  assert.deepEqual(await verifyOverrides(signed, KEY, { now: NOW, registry: r }), {
    overrides: { a: true },
    reason: null,
  });

  const tampered = { ...signed, payload: { ...signed.payload, overrides: { a: true, b: true } } };
  assert.equal((await verifyOverrides(tampered, KEY, { now: NOW })).reason, "bad-signature");
  assert.equal((await verifyOverrides(signed, `${KEY}x`, { now: NOW })).reason, "bad-signature");
  assert.equal((await verifyOverrides(signed, undefined, { now: NOW })).reason, "no-key");
  assert.equal((await verifyOverrides(signed, "short", { now: NOW })).reason, "no-key");
  assert.equal(
    (await verifyOverrides(signed, KEY, { now: NOW + 3 * 3_600_000 })).reason,
    "expired",
  );
  const far = await signOverrides({ overrides: { a: true }, expires: hours(24 * 60) }, KEY);
  assert.equal((await verifyOverrides(far, KEY, { now: NOW })).reason, "expiry-too-far");
  const noExp = await signOverrides({ overrides: { a: true } }, KEY);
  assert.equal((await verifyOverrides(noExp, KEY, { now: NOW })).reason, "no-expiry");
  for (const junk of [null, "x", {}, { payload: {}, sig: "zz" }]) {
    assert.deepEqual((await verifyOverrides(junk, KEY, { now: NOW })).overrides, {});
  }
  await assert.rejects(signOverrides({ overrides: {}, expires: hours(1) }, "short"), FlagError);
});

test("signature is independent of key order in the payload", async () => {
  const a = await signOverrides({ overrides: { x: true, y: false }, expires: hours(1) }, KEY);
  const b = await signOverrides({ expires: hours(1), overrides: { y: false, x: true } }, KEY);
  assert.equal(a.sig, b.sig);
});

const call = (url, { env = {}, headers = {} } = {}) =>
  onRequest({ request: new Request(url, { headers }), env });

test("GET /api/flags returns booleans only", async () => {
  const res = await call("https://eduwonderlab.com/api/flags?classId=c1");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(Object.keys(body.flags).length, 9);
  assert.ok(Object.values(body.flags).every((v) => typeof v === "boolean"));
  assert.deepEqual(Object.keys(body).sort(), ["flags", "ok"]);
  const text = JSON.stringify(body);
  for (const f of registry.flags) {
    assert.ok(
      !text.includes(f.description) && !text.includes(`"${f.owner}"`),
      `response leaks ${f.key} metadata`,
    );
  }
  for (const leak of ["owner", "removalDate", "description", "cohorts", "@"]) {
    assert.ok(!text.includes(leak), `response leaks ${leak}`);
  }
});

test("GET /api/flags applies a valid signed override and ignores a bad one or a missing key", async () => {
  const signed = await signOverrides(
    { overrides: { experiments: true }, expires: new Date(Date.now() + 3_600_000).toISOString() },
    KEY,
  );
  const headers = { "x-flags-overrides": JSON.stringify(signed) };
  const url = "https://eduwonderlab.com/api/flags";
  assert.equal(
    (await (await call(url, { env: { FLAGS_SIGNING_KEY: KEY }, headers })).json()).flags
      .experiments,
    true,
  );
  assert.equal(
    (await (await call(url, { env: {}, headers })).json()).flags.experiments,
    false,
    "no key: ignored",
  );
  assert.equal(
    (await (await call(url, { env: { FLAGS_SIGNING_KEY: `${KEY}x` }, headers })).json()).flags
      .experiments,
    false,
  );
  const garbage = { "x-flags-overrides": "{not json" };
  assert.equal(
    (await call(url, { env: { FLAGS_SIGNING_KEY: KEY }, headers: garbage })).status,
    200,
  );
});

test("GET /api/flags rejects other methods", async () => {
  const res = await onRequest({
    request: new Request("https://eduwonderlab.com/api/flags", { method: "POST", body: "{}" }),
    env: {},
  });
  assert.equal(res.status, 405);
});

test("hygiene: real registry is clean; each defect class is caught; clock is injectable", () => {
  assert.deepEqual(checkRegistry(registry, { now: new Date("2026-11-25T00:00:00Z") }), []);
  assert.ok(
    checkRegistry(registry, { now: new Date("2030-01-01T00:00:00Z") }).some(
      (f) => f.code === "EXPIRED",
    ),
  );
  const bad = (mutate) => {
    const copy = structuredClone(registry);
    mutate(copy);
    return checkRegistry(copy, { now: new Date("2026-11-25T00:00:00Z") }).map((f) => f.code);
  };
  assert.ok(
    bad((r) => {
      r.flags[1].owner = "";
    }).includes("MISSING_FIELD"),
  );
  assert.ok(
    bad((r) => {
      delete r.flags[1].removalDate;
    }).includes("MISSING_FIELD"),
  );
  assert.ok(
    bad((r) => {
      r.flags[0].default = true;
    }).includes("EGRESS_DEFAULT_ON"),
  );
  assert.ok(
    bad((r) => {
      r.flags[1].requires = [];
    }).includes("EGRESS_NOT_REQUIRED"),
  );
  assert.ok(
    bad((r) => {
      r.flags[1].requires = ["student_content_egress", "nope"];
    }).includes("UNKNOWN_REQUIRE"),
  );
  assert.ok(
    bad((r) => {
      r.flags[0].requires = ["student_feedback_model"];
    }).includes("REQUIRE_CYCLE"),
  );
  assert.ok(
    bad((r) => {
      r.flags = [];
    }).includes("EMPTY_REGISTRY"),
  );
});

test("hygiene CLI: exit 0 on the real registry, 1 when expired, 3 on unreadable registry", () => {
  const run = (...args) =>
    spawnSync(process.execPath, ["tools/flags-hygiene.mjs", ...args], { encoding: "utf8" });
  assert.equal(run().status, 0);
  assert.equal(run("--now=2030-01-01").status, 1);
  assert.equal(run("--registry=/nonexistent/flags.json").status, 3);
  const bad = run("--registry=shared/flags/negative/bad-registry.json");
  assert.equal(bad.status, 1, "the known-bad registry must fail the gate");
});

test("flags-sign CLI round-trips through verifyOverrides and never prints the key", async () => {
  const out = spawnSync(process.execPath, ["tools/flags-sign.mjs", "--hours=1", "experiments=on"], {
    encoding: "utf8",
    env: { ...process.env, FLAGS_SIGNING_KEY: KEY },
  });
  assert.equal(out.status, 0, out.stderr);
  assert.ok(!out.stdout.includes(KEY));
  const verified = await verifyOverrides(JSON.parse(out.stdout), KEY, { registry });
  assert.deepEqual(verified.overrides, { experiments: true });
  const noKey = spawnSync(process.execPath, ["tools/flags-sign.mjs", "experiments=on"], {
    encoding: "utf8",
    env: { ...process.env, FLAGS_SIGNING_KEY: "" },
  });
  assert.equal(noKey.status, 3);
  assert.equal(
    spawnSync(process.execPath, ["tools/flags-sign.mjs", "bad"], { encoding: "utf8" }).status,
    1,
  );
});
