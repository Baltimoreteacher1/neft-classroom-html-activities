// A teacher's fact plan for one learner: which operations to practise and how many problems a session has.
// It travels as a link (#factplan=fp1.md.15) the teacher sends to that learner; opening it saves the plan for the
// learner in use on that device. The learner's own evidence is never changed. Pure codec plus storage helpers.
import { profileKey, profiles, readLocal, writeLocal } from "../school-tools.js";

export const FACT_PLAN_KEY = "ewl-fluency-moby-factplan-v1";
export const PLAN_OPS = Object.freeze(["add", "sub", "mul", "div"]);
export const PLAN_COUNTS = Object.freeze([5, 10, 15, 20, 25, 30]);
const LETTER = { add: "a", sub: "s", mul: "m", div: "d" };
const OP_OF = { a: "add", s: "sub", m: "mul", d: "div" };

export function cleanFactPlan(value) {
  if (!value || typeof value !== "object") return null;
  const ops = PLAN_OPS.filter((op) => Array.isArray(value.ops) && value.ops.includes(op));
  const count = PLAN_COUNTS.includes(Number(value.count)) ? Number(value.count) : null;
  if (!ops.length && !count) return null;
  return { ops, count };
}

export function encodeFactPlan(value) {
  const plan = cleanFactPlan(value);
  if (!plan) return null;
  return `fp1.${plan.ops.map((op) => LETTER[op]).join("") || "x"}.${plan.count || 0}`;
}

export function decodeFactPlan(token) {
  const match = /^fp1\.([asmd]{1,4}|x)\.(\d{1,2})$/.exec(String(token || "").trim());
  if (!match) return null;
  const count = Number(match[2]);
  if (count && !PLAN_COUNTS.includes(count)) return null;
  const ops = match[1] === "x" ? [] : [...new Set([...match[1]].map((letter) => OP_OF[letter]))];
  return cleanFactPlan({ ops, count });
}

export function factPlanUrl(value, base = "https://eduwonderlab.com/math/fluency-lab/") {
  const token = encodeFactPlan(value);
  return token ? `${base}#factplan=${token}` : null;
}

const key = () => profileKey(FACT_PLAN_KEY, profiles().active);
export const loadFactPlan = () => cleanFactPlan(readLocal(key(), null));
export const saveFactPlan = (plan) => writeLocal(key(), cleanFactPlan(plan));

// Reads #factplan= from a location hash. Returns the plan it saved, or null.
export function acceptFactPlanFromHash(hash) {
  const match = /(?:^#|&)factplan=([^&]+)/.exec(String(hash || ""));
  const plan = match ? decodeFactPlan(decodeURIComponent(match[1])) : null;
  if (plan) saveFactPlan(plan);
  return plan;
}
