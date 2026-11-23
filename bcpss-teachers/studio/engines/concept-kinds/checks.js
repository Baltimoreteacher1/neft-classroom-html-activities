// Check types for concept-builder tasks. Pure functions: no DOM. See concept-builder.schema.md section 4.
import { Fraction } from "./rational.js";

const TOKEN = /\[([^\]]*)\]|([^.[\]]+)/g;

/** Resolve a dotted path with [key] segments; returns undefined when anything is missing. */
export function getPath(obj, path) {
  if (typeof path !== "string" || !path) return undefined;
  let cur = obj;
  for (const m of path.matchAll(TOKEN)) {
    const key = m[1] ?? m[2];
    if (cur == null || typeof cur !== "object") return undefined;
    cur = Array.isArray(cur) && /^\d+$/.test(key) ? cur[Number(key)] : cur[key];
  }
  return cur;
}

const str = (v) => String(v ?? "").trim().toLowerCase();

/** Exact equality: rationals compare by value, everything else as trimmed case-insensitive text. */
export function sameValue(a, b) {
  const fa = Fraction.parse(a);
  const fb = Fraction.parse(b);
  if (fa && fb) return fa.eq(fb);
  return str(a) === str(b);
}

const operand = (spec, value) => (spec && typeof spec === "object" && !Array.isArray(spec) && "value" in spec ? spec.value : getPath(value, spec));

function orderMatches(actual, expected) {
  if (!Array.isArray(actual)) return false;
  let i = 0;
  for (const slot of expected) {
    if (Array.isArray(slot)) {
      const got = actual.slice(i, i + slot.length).map(str).sort();
      if (got.length !== slot.length || got.join("|") !== slot.map(str).sort().join("|")) return false;
      i += slot.length;
    } else {
      if (str(actual[i]) !== str(slot)) return false;
      i += 1;
    }
  }
  return i === actual.length;
}

function relation(c, value) {
  const l = operand(c.left, value);
  const r = operand(c.right, value);
  const fl = Fraction.parse(l);
  const fr = Fraction.parse(r);
  if (!fl || !fr) return c.op === "eq" ? sameValue(l, r) : c.op === "ne" ? !sameValue(l, r) : false;
  switch (c.op) {
    case "lt": return fl.lt(fr);
    case "le": return fl.le(fr);
    case "eq": return fl.eq(fr);
    case "ge": return fl.ge(fr);
    case "gt": return fl.gt(fr);
    case "ne": return !fl.eq(fr);
    case "multiple": return !fr.isZero() && fl.div(fr).isInt();
    case "ratio": return !fr.isZero() && fl.div(fr).eq(Fraction.must(c.value));
    case "diff": return fl.sub(fr).eq(Fraction.must(c.value));
    default: return false;
  }
}

export const CHECK_TYPES = ["equals", "within", "order", "set", "relation", "all", "any", "not"];
export const RELATION_OPS = ["lt", "le", "eq", "ge", "gt", "ne", "multiple", "ratio", "diff"];
export const SET_MODES = ["equal", "subset", "superset", "member"];

/** evaluate(check, value) -> boolean. Never throws on a missing path; a malformed check returns false. */
export function evaluate(check, value) {
  if (!check || typeof check !== "object") return false;
  try {
    switch (check.type) {
      case "equals":
        return sameValue(getPath(value, check.of), check.value);
      case "within": {
        const a = Fraction.parse(getPath(value, check.of));
        const b = Fraction.parse(check.value);
        if (!a || !b) return false;
        return a.sub(b).abs().le(Fraction.must(check.tolerance ?? "0"));
      }
      case "order":
        return orderMatches(getPath(value, check.of), check.expected || []);
      case "set": {
        const got = getPath(value, check.of);
        const exp = (check.expected || []).map(str);
        if (check.mode === "member") return exp.includes(str(got));
        if (!Array.isArray(got)) return false;
        const g = new Set(got.map(str));
        const e = new Set(exp);
        if (check.mode === "subset") return [...g].every((x) => e.has(x));
        if (check.mode === "superset") return [...e].every((x) => g.has(x));
        return g.size === e.size && [...g].every((x) => e.has(x));
      }
      case "relation":
        return relation(check, value);
      case "all":
        return (check.checks || []).length > 0 && check.checks.every((c) => evaluate(c, value));
      case "any":
        return (check.checks || []).some((c) => evaluate(c, value));
      case "not":
        return !evaluate(check.check, value);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/** Structural validation of a check; returns problem strings (empty when well formed). */
export function validateCheck(check, where = "check") {
  const out = [];
  const bad = (m) => out.push(`${where}: ${m}`);
  if (!check || typeof check !== "object") return [`${where}: must be an object`];
  if (!CHECK_TYPES.includes(check.type)) return [`${where}: unknown check type "${check.type}"`];
  const needPath = (f) => typeof check[f] === "string" && check[f] ? true : (bad(`${f} must be a path string`), false);
  switch (check.type) {
    case "equals":
      needPath("of");
      if (check.value == null) bad("value required");
      break;
    case "within":
      needPath("of");
      if (!Fraction.parse(check.value)) bad("value must be a rational");
      if (check.tolerance != null && !Fraction.parse(check.tolerance)) bad("tolerance must be a rational");
      break;
    case "order":
      needPath("of");
      if (!Array.isArray(check.expected) || !check.expected.length) bad("expected must be a non-empty array");
      break;
    case "set":
      needPath("of");
      if (!SET_MODES.includes(check.mode)) bad(`mode must be one of ${SET_MODES}`);
      if (!Array.isArray(check.expected)) bad("expected must be an array");
      break;
    case "relation":
      if (!RELATION_OPS.includes(check.op)) bad(`op must be one of ${RELATION_OPS}`);
      for (const side of ["left", "right"]) {
        const v = check[side];
        const ok = typeof v === "string" || (v && typeof v === "object" && "value" in v);
        if (!ok) bad(`${side} must be a path string or {value}`);
      }
      if ((check.op === "ratio" || check.op === "diff") && !Fraction.parse(check.value)) bad("value must be a rational");
      break;
    case "all":
    case "any":
      if (!Array.isArray(check.checks) || !check.checks.length) bad("checks must be a non-empty array");
      else check.checks.forEach((c, i) => out.push(...validateCheck(c, `${where}.checks[${i}]`)));
      break;
    case "not":
      out.push(...validateCheck(check.check, `${where}.check`));
      break;
  }
  return out;
}

/** All literal values a check compares against (for the "hint must not state the answer" rule). */
export function checkLiterals(check, acc = []) {
  if (!check || typeof check !== "object") return acc;
  if (check.type === "equals" || check.type === "within") acc.push(String(check.value));
  if (check.type === "relation" && (check.op === "ratio" || check.op === "diff")) acc.push(String(check.value));
  for (const c of check.checks || []) checkLiterals(c, acc);
  if (check.check) checkLiterals(check.check, acc);
  return acc;
}
