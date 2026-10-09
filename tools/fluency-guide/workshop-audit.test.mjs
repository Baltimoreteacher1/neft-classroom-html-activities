import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { JSDOM } from "jsdom";
import { extendedWorkshopIds, validateWorkshops, workshops } from "./workshop-bank.mjs";

const source = readFileSync(new URL("./src/studio.js", import.meta.url), "utf8");
const ctx = vm.createContext({});
vm.runInContext(
  source.slice(
    source.indexOf("// Strict value parsing."),
    source.indexOf("// Six self-contained investigations."),
  ) + ";globalThis.api={checkAnswerMatch,answerKind,parseMath,hintsFor};",
  ctx,
);
const api = ctx.api;
const modelCtx = vm.createContext({ window: {} });
vm.runInContext(readFileSync(new URL("./src/models.js", import.meta.url), "utf8"), modelCtx);
const models = modelCtx.window.FluencyModels;
const ids = Object.keys(workshops);
test("comparison tasks use two scalar values and verified comparison symbols", () => {
  const tasks = workshops["7-4"].tasks.slice(0, 6);
  assert.deepEqual(
    tasks.map((p) => p.answer),
    ["<", ">", ">", "<", ">", "="],
  );
  for (const p of tasks) assert.ok(p.model.values.every(Number.isFinite));
});
const val = (s) =>
  s.endsWith("%")
    ? Number(s.slice(0, -1)) / 100
    : s.includes("/")
      ? s
          .split("/")
          .map(Number)
          .reduce((a, b) => a / b)
      : Number(s);
const med = (v) => {
  const a = [...v].sort((a, b) => a - b),
    n = a.length;
  return n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
};
const average = (v) => v.reduce((a, b) => a + b, 0) / v.length;
const common = (a, b) => {
  for (let n = Math.min(a, b); n >= 1; n--) if (a % n === 0 && b % n === 0) return n;
};
// Authored workshops (src/data/workshops-extended.json) carry a `check` expression per skill
// task. Evaluate it independently, and require every number it uses to be visible to the
// student in the prompt or the model, so a check cannot smuggle in a hidden quantity.
const EXTENDED = new Set(extendedWorkshopIds);
const visibleNumbers = (text) =>
  (
    String(text)
      .replace(/(\d),(\d{3})(?!\d)/g, "$1$2")
      .match(/\d+(?:\.\d+)?/g) || []
  ).map(Number);
function evaluateCheck(id, p, i) {
  const src = String(p.check || "")
    .replaceAll("×", "*")
    .replaceAll("÷", "/")
    .replaceAll("−", "-");
  assert.match(src, /^[\d.\s+\-*/()]+$/, `${id}/${i}: check must be plain arithmetic`);
  const shown = new Set([...visibleNumbers(p.prompt), ...visibleNumbers(JSON.stringify(p.model))]);
  for (const n of visibleNumbers(src))
    assert.ok(
      shown.has(n) || [1, 2, 10, 100, 1000].includes(n),
      `${id}/${i}: check uses ${n}, which the task never shows`,
    );
  return Function(`"use strict";return (${src});`)();
}
// Recompute from the visible quantities. These formulas do not import the bank's helpers.
function expected(id, p, i) {
  if (EXTENDED.has(id)) return evaluateCheck(id, p, i);
  const m = p.model;
  switch (id) {
    case "2-1":
      return [
        "statistical",
        "not statistical",
        "statistical",
        "not statistical",
        "statistical",
        "not statistical",
      ][i];
    case "2-2": {
      const interval = p.prompt.match(/frequency in (\d+)–(\d+)/);
      return m.values.filter((v) => v >= +interval[1] && v <= +interval[2]).length;
    }
    case "2-3":
      return med(m.values);
    case "2-4":
      return m.values[
        /Find minimum/.test(p.prompt)
          ? 0
          : /Find Q1/.test(p.prompt)
            ? 1
            : /Find median/.test(p.prompt)
              ? 2
              : /Find Q3/.test(p.prompt)
                ? 3
                : 4
      ];
    case "2-5":
      return /Find the IQR/.test(p.prompt) ? m.values[3] - m.values[1] : m.values[4] - m.values[0];
    case "2-6":
    case "2-7":
      return m.total / m.groups;
    case "2-8":
      return average(m.values);
    case "2-9":
      return average(m.values.map((v) => Math.abs(v - average(m.values))));
    case "2-10":
      return i % 2 === 0 ? "median" : "mean";
    case "3-1":
      return `${m.a}:${/all counters/.test(p.prompt) ? m.a + m.b : m.b}`;
    case "3-2":
      return m.rows[0][1] / m.rows[0][0];
    case "3-3":
      return (m.rows[0][1] * m.rows[1][0]) / m.rows[0][0];
    case "3-4":
    case "9-2": {
      const x = Number(p.prompt.match(/(?:x = |at )(\d+)/)[1]);
      return (m.points[0][1] / m.points[0][0]) * x;
    }
    case "3-5":
      return m.rows[0][2] / m.rows[0][1] < m.rows[1][2] / m.rows[1][1] ? "A" : "B";
    case "3-6":
    case "3-7":
      return m.rows[1][0] === "?" ? m.rows[1][1] / m.rows[0][1] : m.rows[1][0] * m.rows[0][1];
    case "4-1":
    case "4-2":
      return m.n / m.d;
    case "4-3":
    case "4-4":
      return (m.part / 100) * m.whole;
    case "4-5":
      return m.knownPart / (m.part / 100);
    case "5-1":
      return m.b * m.h;
    case "5-2":
      return (m.b * m.h) / 2;
    case "5-3":
      return ((m.b + m.t) * m.h) / 2;
    case "5-4":
      return m.w * m.h - m.cw * m.ch;
    case "5-5":
      return m.l * m.w * m.h;
    case "5-6":
      return /length-by-width/.test(p.prompt)
        ? m.l * m.w
        : /length-by-height/.test(p.prompt)
          ? m.l * m.h
          : m.w * m.h;
    case "5-7":
      return 2 * (m.l * m.w + m.l * m.h + m.w * m.h);
    case "5-8":
      return m.b * m.b + (4 * m.b * m.s) / 2;
    case "6-1":
    case "6-2":
      return m.a / m.b / (m.c / m.d);
    case "6-3":
      return Number(m.tokens[0]) ** m.tokens.length;
    case "6-4": {
      const [a, b, c] = p.prompt
        .match(/Evaluate (\d+) \+ (\d+)\^2 × (\d+)/)
        .slice(1)
        .map(Number);
      return a + b * b * c;
    }
    case "6-5":
    case "9-1": {
      const nums = p.prompt.match(/(?:Evaluate |y = )(\d+)x \+ (\d+).*x = (\d+)/);
      return +nums[1] * +nums[3] + +nums[2];
    }
    case "6-6": {
      const [a, b, c] = p.prompt
        .match(/Are (\d+)\(x \+ (\d+)\).*x \+ (\d+)/)
        .slice(1)
        .map(Number);
      return a * b === c ? "yes" : "no";
    }
    case "6-7": {
      const [a, b] = p.prompt
          .match(/of (\d+) and (\d+)/)
          .slice(1)
          .map(Number),
        g = common(a, b);
      return /LCM/.test(p.prompt) ? (a * b) / g : g;
    }
    case "6-8": {
      const [a, b] = p.prompt
        .match(/in (\d+)x \+ (\d+)x/)
        .slice(1)
        .map(Number);
      return a + b;
    }
    case "7-1":
    case "7-2":
      return -m.values[0];
    case "7-3":
      return Math.abs(m.values[0]);
    case "7-4":
      return m.values[0] < m.values[1] ? "<" : m.values[0] > m.values[1] ? ">" : "=";
    case "7-5":
      return `(${m.points[0][0]}, ${m.points[0][1]})`;
    case "7-6":
      return Math.abs(m.points[1][0] - m.points[0][0]) + Math.abs(m.points[1][1] - m.points[0][1]);
    case "7-7":
      return Math.abs(m.points[1][0] - m.points[0][0]) * Math.abs(m.points[2][1] - m.points[1][1]);
    case "8-1": {
      const x = +p.prompt.match(/x = (\d+)/)[1],
        [a, b] = m.left
          .match(/(\d+)x \+ (\d+)/)
          .slice(1)
          .map(Number);
      return a * x + b === m.right ? "yes" : "no";
    }
    case "8-2": {
      const n = +m.left.match(/[+−] ([\d.]+)/)[1];
      return m.left.includes("−") ? m.right + n : m.right - n;
    }
    case "8-3": {
      const n = +m.left
        .match(/(?:÷ ([\d.]+)|([\d.]+)x)/)
        .slice(1)
        .find((v) => v !== undefined);
      return m.left.includes("÷") ? m.right * n : m.right / n;
    }
    case "8-4":
      return /at least/.test(p.prompt)
        ? "≥"
        : /at most/.test(p.prompt)
          ? "≤"
          : /less than/.test(p.prompt)
            ? "<"
            : ">";
    case "8-5": {
      const x = +p.prompt.match(/Is (-?\d+)/)[1];
      return (
        m.symbol === ">"
          ? x > m.b
          : m.symbol === "<"
            ? x < m.b
            : m.symbol === "≥"
              ? x >= m.b
              : x <= m.b
      )
        ? "yes"
        : "no";
    }
    case "9-3":
      return m.rows[0][1] / m.rows[0][0];
    case "9-4":
      return m.rows[1][0] === "?" ? m.rows[1][1] / m.rows[0][1] : m.rows[1][0] * m.rows[0][1];
    default:
      throw new Error(id);
  }
}
test("all 78 taught lessons have complete, distinct instructional sequences", () => {
  const core = JSON.parse(
    readFileSync(new URL("./src/data/curriculum.core.json", import.meta.url)),
  );
  assert.deepEqual(validateWorkshops(core.units.flatMap((u) => u.lessons.map((l) => l.id))), []);
  assert.equal(ids.length, 78);
  for (const [id, w] of Object.entries(workshops)) {
    assert.equal(w.tasks.length, 8, id);
    assert.equal(w.tasks.filter((p) => p.guidance.length).length, 2, id);
    assert.equal(
      w.tasks.filter(
        (p) =>
          p.mode === "review" && ["Find & repair an error", "Apply & explain"].includes(p.label),
      ).length,
      2,
      id,
    );
    assert.equal(new Set(w.tasks.map((p) => p.prompt)).size, 8, id);
    assert.ok(
      !w.tasks.some((p) => p.prompt === w.example.prompt),
      `${id}: example must differ from practice`,
    );
  }
});
for (const [id, w] of Object.entries(workshops))
  test(`${id}: mathematics, answer behavior, and model accessibility`, () => {
    for (const [i, p] of w.tasks.entries()) {
      const kind = api.answerKind(p),
        res = api.checkAnswerMatch(p.answer, p.answer, p);
      if (i < 6) {
        const answer = expected(id, p, i);
        if (typeof answer === "number")
          assert.ok(Math.abs(val(p.answer) - answer) < 1e-6, `${id}/${i}: ${p.answer} ≠ ${answer}`);
        else assert.equal(p.answer, answer, `${id}/${i}`);
        assert.notEqual(kind, "review", `${id}/${i} should have an objective answer`);
        assert.equal(res.match, true, `${id}/${i} canonical answer`);
        assert.equal(api.checkAnswerMatch("unrelated words", p.answer, p).match, false);
      } else {
        assert.equal(res.review, true);
        assert.equal(res.match, false);
      }
      assert.deepEqual(Array.from(api.hintsFor(p)), p.hints);
      const html = models.render(p.model, p.modelCaption),
        doc = new JSDOM(html).window.document;
      assert.ok(doc.querySelector("figcaption")?.textContent.length > 15);
      assert.ok(doc.querySelector(".flm-description")?.textContent.length > 20);
      for (const s of doc.querySelectorAll("svg")) {
        assert.equal(s.getAttribute("role"), "img");
        assert.ok(s.querySelector("title"));
        assert.ok(s.querySelector("desc"));
      }
      for (const t of doc.querySelectorAll("table")) {
        assert.ok(t.querySelector("caption"));
        assert.ok(t.querySelector("th[scope=col]"));
      }
    }
  });
test("both editions embed the exact model source and preserve existing lesson banks", () => {
  const modelSource = readFileSync(new URL("./src/models.js", import.meta.url), "utf8").trim();
  for (const file of [
    "../../curriculum/fluency/index.html",
    "../../curriculum/fluency/teacher/index.html",
  ]) {
    const doc = new JSDOM(readFileSync(new URL(file, import.meta.url), "utf8")).window.document;
    assert.equal(doc.querySelector("#fluency-models").textContent.trim(), modelSource);
    const dataset = JSON.parse(
      Array.from(doc.querySelectorAll("script"))
        .find((s) => s.textContent.startsWith("window.FluencyData = "))
        .textContent.replace(/^window\.FluencyData = /, "")
        .replace(/;$/, ""),
    );
    assert.equal(dataset.units.flatMap((u) => u.lessons).length, 78);
    assert.equal(
      dataset.units.flatMap((u) => u.lessons).reduce((n, l) => n + l.workshop.tasks.length, 0),
      624,
    );
    assert.equal(
      dataset.units.flatMap((u) => u.lessons).reduce((n, l) => n + l.practice.length, 0),
      312,
    );
  }
});

// Each table is independently checked for a constant multiplicative relationship.
test("all 56 ratio tasks require complete, equivalent ratio tables", () => {
  for (let n = 1; n <= 7; n++) {
    const w = workshops[`3-${n}`];
    assert.ok(w.ratioTables.length);
    for (const [i, p] of w.tasks.entries()) {
      assert.match(p.tableDirections, /Build each ratio table/);
      assert.match(p.prompt, /ratio table/);
      for (const t of p.ratioTables) {
        assert.equal(t.headers.length, 2);
        assert.equal(t.rows.length, 3);
        assert.equal(t.givenRows, i < 2 ? 1 : 0);
        const [x, y] = t.rows[0];
        for (const [a, b] of t.rows) {
          assert.ok([a, b].every(Number.isFinite));
          assert.ok(Math.abs(a * y - b * x) < 1e-8, `${p.prompt}: non-equivalent row`);
        }
      }
    }
  }
});
test("reverse conversions give the known quantity, not the missing answer", () => {
  for (const id of ["3-6", "3-7"])
    for (const p of workshops[id].tasks.slice(0, 6))
      if (p.model.rows[1][0] === "?")
        assert.ok(p.tableDirections.includes(`${p.model.headers[1]} values`));
});
