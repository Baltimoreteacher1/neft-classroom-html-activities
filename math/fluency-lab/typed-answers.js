// Typed answers that are not a single number: an expression (checked by value, any equivalent form in the asked-for
// shape), an inequality ("h ≥ 48", "h>=48" or "48 ≤ h"), and a list in order ("−3, −1/2, 0.75"; fractions, mixed
// numbers and decimals are read by value). problem-bank.js validateAnswer() calls these by item.kind.
import { checkExpressionAnswer } from "./line-work.js";
import { readNumber } from "./response-check.js";

const clean = (value) =>
  String(value ?? "")
    .trim()
    .replaceAll("−", "-")
    .replaceAll("≥", ">=")
    .replaceAll("≤", "<=")
    .replace(/\s+/g, "");

const FLIP = { "<": ">", ">": "<", "<=": ">=", ">=": "<=" };

export function checkInequalityAnswer(value, target) {
  const text = clean(value);
  const v = target.variable;
  let match = new RegExp(`^${v}(<=|>=|<|>)(.+)$`, "i").exec(text);
  let op = match?.[1];
  let bound = match?.[2];
  if (!match) {
    match = new RegExp(`^(.+?)(<=|>=|<|>)${v}$`, "i").exec(text);
    if (!match) return false;
    [op, bound] = [FLIP[match[2]], match[1]];
  }
  return op === target.op && Math.abs(readNumber(bound) - target.value) < 1e-9;
}

export function checkOrderAnswer(value, order) {
  const parts = String(value ?? "")
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length !== order.length) return false;
  return parts.every((part, i) => Math.abs(readNumber(part) - order[i]) < 1e-9);
}

export function checkTypedForm(value, item) {
  if (item.kind === "expression" && item.work) return checkExpressionAnswer(value, item.work);
  if (item.kind === "inequality" && item.inequality) return checkInequalityAnswer(value, item.inequality);
  if (item.kind === "order" && item.order) return checkOrderAnswer(value, item.order);
  return null;
}
