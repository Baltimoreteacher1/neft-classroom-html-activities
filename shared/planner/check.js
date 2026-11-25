// Independent plan checker (gate G-30). Pure: (plan, candidates) -> findings [{code, severity, path, message, evidence}].
// It trusts nothing the planner says about itself: caps come from plan.params, accounting from the candidate pool.
//
// Codes (all severity "error"):
//   DAY_COUNT, DAY_OVER_CAP, DAY_MINUTES (a day's total is not the sum of its items), DAY_DATE (dates repeat),
//   ITEM_MINUTES (an item's minutes differ from the pool's scaled minutes), UNACCOUNTED (neither planned nor dropped),
//   DUPLICATE (planned twice), PLACED_AND_DROPPED, DROP_NO_REASON, DROP_REASON (reason code contradicts the facts),
//   DEP_MISSING (planned without its dependency), DEP_ORDER (planned before its dependency), UNKNOWN_ITEM.
import { DROP_CODES } from "./constants.js";
import { priceCandidates } from "./solve.js";

const err = (code, path, message, evidence = null) => ({
  code,
  severity: "error",
  path,
  message,
  evidence,
});

export function checkPlan(plan, candidates) {
  const findings = [];
  const { params } = plan;
  const pool = new Map(priceCandidates(candidates, params).map((c) => [c.id, c]));

  if (plan.days.length !== params.days) {
    findings.push(
      err("DAY_COUNT", "days", `plan has ${plan.days.length} days, asked for ${params.days}`),
    );
  }
  const where = new Map(); // id -> { day, pos }
  plan.days.forEach((d, di) => {
    const sum = d.items.reduce((n, it) => n + it.minutes, 0);
    if (sum > params.block) {
      findings.push(
        err("DAY_OVER_CAP", `days[${di}]`, `day ${d.day} holds ${sum} of ${params.block} minutes`, {
          sum,
          cap: params.block,
        }),
      );
    }
    if (sum !== d.minutes) {
      findings.push(
        err(
          "DAY_MINUTES",
          `days[${di}]`,
          `day ${d.day} says ${d.minutes} but its items add to ${sum}`,
        ),
      );
    }
    d.items.forEach((it, pos) => {
      if (!pool.has(it.id)) {
        findings.push(
          err("UNKNOWN_ITEM", `days[${di}].items[${pos}]`, `${it.id} is not in the candidate pool`),
        );
        return;
      }
      if (where.has(it.id))
        findings.push(err("DUPLICATE", `days[${di}].items[${pos}]`, `${it.id} is planned twice`));
      where.set(it.id, { day: di, pos });
      if (it.minutes !== pool.get(it.id).minutes) {
        findings.push(
          err(
            "ITEM_MINUTES",
            `days[${di}].items[${pos}]`,
            `${it.id} has ${it.minutes} minutes, pool says ${pool.get(it.id).minutes}`,
          ),
        );
      }
    });
  });
  const dates = plan.days.map((d) => d.date).filter(Boolean);
  if (new Set(dates).size !== dates.length)
    findings.push(err("DAY_DATE", "days", "two days share a date"));

  const droppedIds = new Map();
  plan.dropped.forEach((d, i) => {
    if (droppedIds.has(d.id))
      findings.push(err("DUPLICATE", `dropped[${i}]`, `${d.id} is dropped twice`));
    droppedIds.set(d.id, d);
    if (where.has(d.id))
      findings.push(err("PLACED_AND_DROPPED", `dropped[${i}]`, `${d.id} is planned and dropped`));
    if (!Object.hasOwn(DROP_CODES, d.code) || !String(d.reason || "").trim()) {
      findings.push(
        err("DROP_NO_REASON", `dropped[${i}]`, `${d.id} has no usable drop code or reason`, {
          code: d.code,
        }),
      );
    }
  });

  for (const c of pool.values()) {
    const placed = where.get(c.id);
    const dropped = droppedIds.get(c.id);
    if (!placed && !dropped)
      findings.push(
        err("UNACCOUNTED", c.id, `${c.id} (${c.title}) is neither planned nor listed as dropped`),
      );
    if (placed && c.dependsOn) {
      const dep = where.get(c.dependsOn);
      if (!dep)
        findings.push(err("DEP_MISSING", c.id, `${c.id} is planned without ${c.dependsOn}`));
      else if (dep.day > placed.day || (dep.day === placed.day && dep.pos > placed.pos)) {
        findings.push(err("DEP_ORDER", c.id, `${c.id} is planned before ${c.dependsOn}`));
      }
    }
    if (dropped && Object.hasOwn(DROP_CODES, dropped.code)) {
      const parentGone = c.dependsOn && !where.has(c.dependsOn);
      const want =
        c.minutes > params.block ? "too_long" : parentGone ? "needs_dropped" : "low_priority";
      if (dropped.code !== want) {
        findings.push(
          err("DROP_REASON", c.id, `${c.id} dropped as ${dropped.code}, facts say ${want}`, {
            want,
            got: dropped.code,
          }),
        );
      }
    }
  }
  return findings;
}
