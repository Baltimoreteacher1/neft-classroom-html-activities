/* The data contract: templates are safe by shape, validators are strict. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  codeFromBytes,
  contributorHash,
  csvCell,
  entriesToCsv,
  isUnusual,
  normalizeClassCode,
  validateContributionShape,
  validateFieldValue,
  validateOptions,
  validateValues,
} from "./contract.js";
import {
  activeFields,
  availableHooks,
  getTemplate,
  resolveOptions,
  TEMPLATES,
  UNIT_HOOKS,
} from "./templates.js";

const hex = (n) => "a".repeat(n);

test("three authored templates ship, with unique ids", () => {
  assert.equal(TEMPLATES.length, 3);
  assert.equal(new Set(TEMPLATES.map((t) => t.id)).size, 3);
});

test("PRIVACY BY SHAPE: every field is a bounded number or a fixed choice; there is no free text", () => {
  for (const t of TEMPLATES) {
    for (const f of t.fields) {
      assert.ok(["number", "choice"].includes(f.kind), `${t.id}.${f.id} kind`);
      assert.match(f.id, /^[a-z][a-zA-Z0-9]{0,23}$/);
      if (f.kind === "number") {
        assert.ok(Number.isFinite(f.min) && Number.isFinite(f.max) && f.min < f.max, `${f.id} hard range`);
        assert.ok(f.likelyMin >= f.min && f.likelyMax <= f.max && f.likelyMin < f.likelyMax, `${f.id} likely range inside hard range`);
        assert.ok([0.5, 1].includes(f.step), `${f.id} step`);
      } else {
        assert.ok(f.choices.length >= 2 && f.choices.length <= 8);
      }
    }
  }
});

test("NO SENSITIVE VARIABLES: nothing about weight, health, income or location is asked", () => {
  const banned = /weight|pounds|lbs|kg\b|health|sick|diet|income|money|salary|address|street|zip|city|neighborhood|home location|race|gender|name/i;
  const sneaky = (s) => banned.test(s);
  for (const t of TEMPLATES) {
    const text = JSON.stringify([t.id, t.title, t.question, t.why, t.fields, t.options]);
    assert.ok(!sneaky(text.replace(/"short"|"label"/g, "")), `${t.id}: ${text.match(banned)?.[0]}`);
  }
});

test("arm span and height exist only behind an option that defaults OFF, and are skippable", () => {
  const t = getTemplate("pencil-handspan");
  const opt = t.options.find((o) => o.id === "armHeight");
  assert.equal(opt.defaultOn, false);
  const optional = t.fields.filter((f) => f.option === "armHeight");
  assert.deepEqual(optional.map((f) => f.id).sort(), ["armSpan", "height"]);
  assert.ok(optional.every((f) => f.optional));
  assert.deepEqual(activeFields(t, resolveOptions(t, {})).map((f) => f.id), ["pencil", "handSpan"]);
  assert.equal(activeFields(t, { armHeight: true }).length, 4);
  for (const other of TEMPLATES.filter((x) => x.id !== t.id)) {
    assert.ok(other.fields.every((f) => !f.option), "no other template carries body measurements");
  }
});

test("every learner-facing string has both English and Spanish, and Spanish is not a copy", () => {
  const seen = [];
  const walk = (v, path) => {
    if (v && typeof v === "object" && "en" in v && "es" in v) seen.push([path, v]);
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  walk(TEMPLATES, "T");
  walk(UNIT_HOOKS, "U");
  assert.ok(seen.length > 40);
  for (const [path, v] of seen) {
    assert.ok(v.en.trim() && v.es.trim(), path);
    if (v.en.length > 6 && !/^(cm|Unit)/.test(v.en)) assert.notEqual(v.en, v.es, `${path} Spanish is an untranslated copy`);
  }
  for (const f of TEMPLATES.flatMap((t) => t.fields)) assert.ok(f.short?.en && f.short?.es, `${f.id} short`);
});

test("unit hooks follow the data: categories feed Unit 4, pairs feed 3/7/9, numbers feed 2", () => {
  const h = (id) => availableHooks(activeFields(getTemplate(id), {}));
  assert.deepEqual(h("get-to-school"), { u2: false, u3: false, u4: true, u7: false, u9: false });
  assert.deepEqual(h("door-to-seat"), { u2: true, u3: true, u4: false, u7: true, u9: true });
  assert.deepEqual(UNIT_HOOKS.map((u) => u.unit), [3, 4, 7, 9, 2], "district pacing order, Unit 2 last");
});

test("class codes: normalised, unambiguous alphabet, 6 long", () => {
  assert.equal(normalizeClassCode(" abc-def "), "ABCDEF");
  for (const bad of ["", "ABC", "ABCDEFG", "ABCDE0", "ABCDEI", "ABCDEL", "ABCDE!", null, undefined, 123456, {}]) {
    assert.equal(normalizeClassCode(bad), "", String(bad));
  }
  assert.match(codeFromBytes(new Uint8Array([0, 1, 2, 200, 255, 31])), /^[A-HJKMNP-Z2-9]{6}$/);
});

test("field values: types, ranges and steps", () => {
  const f = getTemplate("pencil-handspan").fields[0];
  assert.deepEqual(validateFieldValue(f, 15.5), { ok: true, value: 15.5 });
  for (const [v, err] of [
    [1.5, "too-small"],
    [31, "too-large"],
    [15.2, "bad-step"],
    ["15", "not-a-number"],
    [Number.NaN, "not-a-number"],
    [Infinity, "not-a-number"],
    [null, "not-a-number"],
    [{}, "not-a-number"],
  ]) {
    assert.equal(validateFieldValue(f, v).error, err, String(v));
  }
  assert.equal(isUnusual(f, 25), true);
  assert.equal(isUnusual(f, 12), false);
});

test("validateValues is strict about unknown keys, missing fields and prototype tricks", () => {
  const ok = validateValues("pencil-handspan", {}, { pencil: 12, handSpan: 17 });
  assert.deepEqual(ok, { ok: true, values: { pencil: 12, handSpan: 17 } });
  assert.equal(validateValues("pencil-handspan", {}, { pencil: 12 }).error, "missing-field");
  assert.equal(validateValues("pencil-handspan", {}, { pencil: 12, handSpan: 17, nickname: "Z" }).error, "unknown-field");
  assert.equal(validateValues("pencil-handspan", {}, JSON.parse('{"__proto__":{"x":1},"pencil":12,"handSpan":17}')).error, "unknown-field");
  assert.equal(validateValues("nope", {}, {}).error, "bad-template");
  for (const v of [null, [], "x", 5]) assert.equal(validateValues("pencil-handspan", {}, v).error, "bad-values");
  const withOpt = validateValues("pencil-handspan", { armHeight: true }, { pencil: 12, handSpan: 17, height: 150 });
  assert.equal(withOpt.ok, true, "an optional field may be skipped independently");
});

test("contribution shape: exact top-level keys, id formats", () => {
  const good = { code: "ABCDEF", templateId: "get-to-school", entryId: hex(24), clientId: hex(32), source: "home", values: {} };
  assert.equal(validateContributionShape(good).ok, true);
  for (const patch of [{ name: "x" }, { code: "no" }, { templateId: "x" }, { entryId: "Z".repeat(24) }, { clientId: "short" }, { source: "admin" }]) {
    assert.equal(validateContributionShape({ ...good, ...patch }).ok, false, JSON.stringify(patch));
  }
  for (const body of [null, [], "x", 3]) assert.equal(validateContributionShape(body).ok, false);
});

test("options: only the template's own booleans", () => {
  assert.equal(validateOptions("pencil-handspan", { armHeight: true }).options.armHeight, true);
  assert.equal(validateOptions("pencil-handspan", undefined).options.armHeight, false);
  for (const bad of [{ armHeight: "yes" }, { weight: true }, [], "x"]) {
    assert.equal(validateOptions("pencil-handspan", bad).ok, false, JSON.stringify(bad));
  }
  assert.equal(validateOptions("get-to-school", { armHeight: true }).ok, false);
});

test("contributor hash: deterministic per class, different across classes, hides the id", async () => {
  const a = await contributorHash("salt1", "", hex(32));
  assert.equal(a, await contributorHash("salt1", "", hex(32)));
  assert.notEqual(a, await contributorHash("salt2", "", hex(32)));
  assert.notEqual(a, await contributorHash("salt1", "pepper", hex(32)));
  assert.match(a, /^[a-f0-9]{32}$/);
  assert.ok(!a.includes(hex(8)));
});

test("CSV cells cannot run as spreadsheet formulas", () => {
  assert.equal(csvCell("=1+1"), "'=1+1");
  assert.equal(csvCell("@x"), "'@x");
  assert.equal(csvCell(-3), "-3");
  assert.equal(csvCell('a,"b"'), '"a,""b"""');
  const csv = entriesToCsv("get-to-school", {}, [{ values: { mode: "walk" }, source: "class", day: "2026-10-16" }]);
  assert.equal(csv, "n,day,source,mode\n1,2026-10-16,class,walk\n");
});
