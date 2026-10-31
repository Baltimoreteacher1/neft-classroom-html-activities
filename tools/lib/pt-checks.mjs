// Independent checks for generated items: recompute what meta.check says, from meta only.
// A check entry is { kind, role?, ...}. role "answer": the result must equal the item's key. role "key" /
// "distractor": the result must equal / differ from meta.value (equation options). No role: facts the explanation
// text relies on; entry.value, when present, is the expected result.
// New kinds go in tools/lib/pt-checks-<name>.mjs exporting CHECKS = { kind: (entry, item, h) => ({ value?: Q, text?: string }) }.
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { equivalent, Q } from "./exact-math.mjs";
import { evaluate, qOf } from "./pt-eval.mjs";

const ZERO = new Q(0n);
const norm = (s) => String(s).replace(/−/g, "-").replace(/\s+/g, "").toLowerCase();
const q = (v) => (v instanceof Q ? v : qOf(v));
const sameQ = (a, b) => a.n === b.n && a.d === b.d;
const text = (v) => (v.d === 1n ? String(v.n) : `${v.n}/${v.d}`);

// root of a linear equation lhs = rhs in one variable, proven by probing three points.
export function root(lhs, rhs, name = "x") {
  const f = (x) => evaluate(lhs, { [name]: x }).sub(evaluate(rhs, { [name]: x }));
  const [f0, f1, f2] = [f(ZERO), f(new Q(1n)), f(new Q(2n))];
  const slope = f1.sub(f0);
  assert.ok(f2.sub(f1).eq(slope), `not linear: ${lhs} = ${rhs}`);
  if (slope.zero()) return null;
  const r = f0.neg().div(slope);
  assert.ok(f(r).zero(), `root does not solve ${lhs} = ${rhs}`);
  return r;
}

function system(entry) {
  const [n1, n2] = entry.vars || ["x", "y"];
  const f = (eq, x, y) =>
    evaluate(eq[0], { [n1]: x, [n2]: y }).sub(evaluate(eq[1], { [n1]: x, [n2]: y }));
  const one = new Q(1n);
  const rows = entry.eqs.map((eq) => {
    const c = f(eq, ZERO, ZERO);
    return [f(eq, one, ZERO).sub(c), f(eq, ZERO, one).sub(c), c.neg()];
  });
  const det = rows[0][0].mul(rows[1][1]).sub(rows[0][1].mul(rows[1][0]));
  assert.ok(!det.zero(), "system has no unique solution");
  const x = rows[0][2].mul(rows[1][1]).sub(rows[0][1].mul(rows[1][2])).div(det);
  const y = rows[0][0].mul(rows[1][2]).sub(rows[0][2].mul(rows[1][0])).div(det);
  for (const eq of entry.eqs) assert.ok(f(eq, x, y).zero(), "system root check");
  return { [n1]: x, [n2]: y };
}

const BUILTIN = {
  expr(entry) {
    const v = evaluate(entry.expr);
    return entry.map
      ? { text: entry.map[text(v)] ?? `unmapped:${text(v)}`, value: v }
      : { value: v };
  },
  solve(entry) {
    const r = root(entry.lhs, entry.rhs, entry.var || "x");
    return r ? { value: r } : { value: null };
  },
  system(entry) {
    return { value: system(entry)[entry.ask] };
  },
  rel(entry) {
    const c = evaluate(entry.a).cmp(evaluate(entry.b));
    return { text: c < 0 ? "<" : c > 0 ? ">" : "=" };
  },
  point(entry) {
    return { text: `(${entry.exprs.map((e) => text(evaluate(e))).join(",")})` };
  },
  clock(entry) {
    const m = Number(evaluate(entry.expr).n);
    const mm = ((m % 720) + 720) % 720;
    return { text: `${Math.floor(mm / 60) || 12}:${String(mm % 60).padStart(2, "0")}` };
  },
  argmax(entry) {
    return extreme(entry, 1);
  },
  argmin(entry) {
    return extreme(entry, -1);
  },
  assoc(entry) {
    const [xs, ys] = [entry.xs.map(q), entry.ys.map(q)];
    const n = new Q(BigInt(xs.length));
    const [mx, my] = [
      xs.reduce((s, v) => s.add(v), ZERO).div(n),
      ys.reduce((s, v) => s.add(v), ZERO).div(n),
    ];
    const cov = xs.reduce((s, x, i) => s.add(x.sub(mx).mul(ys[i].sub(my))), ZERO);
    return { text: cov.n > 0n ? "positive" : cov.n < 0n ? "negative" : "none" };
  },
  work(entry) {
    // error analysis: the chain of steps equals the start until the flawed step, which breaks it.
    let previous = entry.start;
    entry.steps.forEach((step, i) => {
      const ok = equivalent(previous, step);
      if (i === entry.bad)
        assert.ok(!ok, `step ${i + 1} "${step}" should differ from "${previous}"`);
      else assert.ok(ok, `step ${i + 1} "${step}" should equal "${previous}"`);
      previous = step;
    });
    const before = entry.bad === 0 ? entry.start : entry.steps[entry.bad - 1];
    assert.ok(equivalent(before, entry.fix), "the repair keeps the value");
    const good = entry.fixes.filter((f) => equivalent(before, f));
    assert.deepEqual(good, [entry.fix], "exactly one offered repair keeps the value");
    assert.ok(
      !entry.fixes.includes(entry.steps[entry.bad]),
      "the flawed step is not offered as the repair",
    );
    assert.equal(new Set(entry.slips).size, 3, "three distinct slips");
    assert.ok(entry.slips.includes(entry.slip), "the true slip is offered");
    const key = { find: `Step ${entry.bad + 1}`, fix: entry.fix };
    return entry.task === "slip" ? { text: "__slip__" } : { text: key[entry.task] };
  },
};

function extreme(entry, dir) {
  const values = entry.values.map(q);
  let best = values[0];
  for (const v of values) if (v.cmp(best) * dir > 0) best = v;
  const winners = entry.labels.filter((_, i) => sameQ(values[i], best));
  assert.equal(winners.length, 1, "the extreme value is unique");
  return { text: winners[0] };
}

const CUSTOM = {};
for (const file of readdirSync(new URL(".", import.meta.url)).filter((f) =>
  /^pt-checks-.+\.mjs$/.test(f),
))
  Object.assign(CUSTOM, (await import(`./${file}`)).CHECKS);

export function runChecks(item) {
  const meta = item.meta;
  const list = Array.isArray(meta.check) ? meta.check : [meta.check];
  assert.ok(
    list.length > 0 && list.every((c) => c && typeof c.kind === "string"),
    "meta.check lists checks",
  );
  let answered = 0;
  for (const entry of list) {
    const run = CUSTOM[entry.kind] || BUILTIN[entry.kind];
    assert.ok(run, `no independent check for kind "${entry.kind}"`);
    const got = run(entry, item, { evaluate, root, q, text });
    if (entry.value !== undefined)
      assert.ok(
        got.value && sameQ(got.value, q(entry.value)),
        `${entry.kind} ${entry.expr ?? ""}: expected ${entry.value}, got ${got.value && text(got.value)}`,
      );
    if (entry.role === "answer") {
      answered += 1;
      if (got.text !== undefined && got.text !== "__slip__")
        assert.equal(
          norm(got.text),
          norm(item.answers[0]),
          `${entry.kind}: computed "${got.text}", key "${item.answers[0]}"`,
        );
      else if (got.text === "__slip__") assert.ok(true);
      else {
        assert.ok(got.value, `${entry.kind}: no value`);
        const key = item.kind === "choice" ? item.answers[0] : meta.answer;
        assert.ok(
          sameQ(got.value, q(key)),
          `${entry.kind} ${entry.expr ?? entry.lhs ?? ""}: computed ${text(got.value)}, key ${key}`,
        );
      }
    } else if (entry.role === "key" || entry.role === "distractor") {
      assert.ok(meta.value !== undefined, "equation options need meta.value");
      const same = got.value && sameQ(got.value, q(meta.value));
      assert.equal(
        Boolean(same),
        entry.role === "key",
        `option as ${entry.role}: solves to ${got.value && text(got.value)}, answer ${meta.value}`,
      );
      if (entry.role === "key") answered += 1;
    }
  }
  const needsAnswer = item.type !== "explain";
  if (needsAnswer)
    assert.ok(answered >= 1, "an independent check must recompute the answer (role answer or key)");
  return answered;
}
export { norm, q, sameQ, text };
