/**
 * Anonymous item analytics. Input events carry NO learner identity (an allow-list is enforced, and a learner,
 * alias, name or session key is rejected): {itemId, key, option, optionCount, slice, tier, timeSec, hinted}.
 * `slice` is a coarse cohort label such as a grade band; `tier` is low | mid | high (a coarse bucket of the
 * learner's own practice estimate, computed on-device, never the estimate itself). The collector that feeds
 * this must send at most one first attempt per learner per item so that attempts approximate learners.
 *
 * Output is aggregate-only: every published cell has at least DEFAULTS.minCell attempts and no cell can be
 * isolated by subtracting published cells (see suppression.js). Item flags use published cells only.
 */
import { DEFAULTS } from "./constants.js";
import { suppressCells } from "./suppression.js";

const ALLOWED = new Set([
  "itemId",
  "key",
  "option",
  "optionCount",
  "slice",
  "tier",
  "timeSec",
  "hinted",
]);
const TIERS = ["low", "mid", "high"];
const CHI_CRITICAL_P01 = { 1: 6.63, 2: 9.21, 3: 11.34, 4: 13.28 };

export function assertAnonymousEvent(e) {
  for (const k of Object.keys(e)) {
    if (!ALLOWED.has(k)) throw new Error(`analytics event has non-aggregate field "${k}"`);
  }
  for (const k of ["itemId", "slice", "tier"])
    if (typeof e[k] !== "string") throw new Error(`event.${k} required`);
  if (!TIERS.includes(e.tier)) throw new Error(`event.tier must be one of ${TIERS.join(", ")}`);
  for (const k of ["key", "option", "optionCount"]) {
    if (!Number.isInteger(e[k]) || e[k] < 0) throw new Error(`event.${k} must be a whole number`);
  }
  if (e.option >= e.optionCount || e.key >= e.optionCount)
    throw new Error("option or key outside the option list");
}

const atomId = (e) => `${e.option}|${e.slice}|${e.tier}`;

/** Group events into per-item atoms (finest cells). */
export function buildItemTable(events) {
  const items = new Map();
  for (const e of events) {
    assertAnonymousEvent(e);
    if (!items.has(e.itemId)) {
      items.set(e.itemId, {
        itemId: e.itemId,
        key: e.key,
        optionCount: e.optionCount,
        atoms: new Map(),
      });
    }
    const item = items.get(e.itemId);
    if (item.key !== e.key || item.optionCount !== e.optionCount) {
      throw new Error(`item ${e.itemId}: events disagree about the key or option count`);
    }
    const id = atomId(e);
    const atom = item.atoms.get(id) || { n: 0, correct: 0, timeSum: 0, hints: 0 };
    atom.n++;
    atom.correct += e.option === e.key ? 1 : 0;
    atom.timeSum += e.timeSec || 0;
    atom.hints += e.hinted ? 1 : 0;
    item.atoms.set(id, atom);
  }
  return items;
}

function cellFamily(item) {
  const ids = [...item.atoms.keys()].sort();
  const pick = (test) => ids.filter(test);
  const part = (i, v) => (id) => id.split("|")[i] === String(v);
  const cells = [{ id: "total", kind: "total", atoms: ids }];
  for (let o = 0; o < item.optionCount; o++)
    cells.push({ id: `option:${o}`, kind: "option", ref: o, atoms: pick(part(0, o)) });
  cells.push({
    id: "failure",
    kind: "failure",
    atoms: pick((id) => id.split("|")[0] !== String(item.key)),
  });
  for (const s of [...new Set(ids.map((i) => i.split("|")[1]))].sort()) {
    cells.push({ id: `slice:${s}`, kind: "slice", ref: s, atoms: pick(part(1, s)) });
  }
  for (const t of TIERS)
    cells.push({ id: `tier:${t}`, kind: "tier", ref: t, atoms: pick(part(2, t)) });
  return cells.filter((c) => c.atoms.length);
}

function measure(item, cell) {
  const sum = cell.atoms.reduce(
    (m, a) => {
      const x = item.atoms.get(a);
      return {
        n: m.n + x.n,
        correct: m.correct + x.correct,
        timeSum: m.timeSum + x.timeSum,
        hints: m.hints + x.hints,
      };
    },
    { n: 0, correct: 0, timeSum: 0, hints: 0 },
  );
  return {
    attempts: sum.n,
    successRate: sum.correct / sum.n,
    meanTimeSec: sum.timeSum / sum.n,
    hintRate: sum.hints / sum.n,
  };
}

function flagsFor(item, published) {
  const flags = [];
  const flag = (code, message, evidence) =>
    flags.push({ code, severity: "warn", path: item.itemId, message, evidence });
  const by = (id) => published.find((c) => c.id === id);
  const total = by("total");
  if (total) {
    if (total.successRate > DEFAULTS.tooEasy)
      flag("too-easy", "success rate above 95%", { rate: total.successRate });
    if (total.successRate < DEFAULTS.tooHard)
      flag("too-hard", "success rate below 20%", { rate: total.successRate });
  }
  const hi = by("tier:high");
  const lo = by("tier:low");
  if (hi && lo && hi.successRate - lo.successRate < DEFAULTS.minDiscrimination) {
    flag("non-discriminating", "high and low tiers succeed at about the same rate", {
      gap: hi.successRate - lo.successRate,
    });
  }
  const options = published.filter((c) => c.kind === "option");
  const key = options.find((c) => c.ref === item.key);
  if (key) {
    for (const o of options) {
      if (o.ref !== item.key && o.attempts > key.attempts) {
        flag("distractor-outperforms-key", `option ${o.ref} is chosen more often than the key`, {
          option: o.ref,
          chosen: o.attempts,
          key: key.attempts,
        });
      }
    }
  }
  // Position bias: wrong answers should spread across the distractors. Only distractor choices are tested,
  // because the key is chosen more often by design. Needs >= 2 distractors, all published, >= 30 wrong choices.
  const distractors = options.filter((o) => o.ref !== item.key);
  const wrong = distractors.reduce((n, o) => n + o.attempts, 0);
  const critical = CHI_CRITICAL_P01[distractors.length - 1];
  if (distractors.length === item.optionCount - 1 && critical && wrong >= 30) {
    const expected = wrong / distractors.length;
    const chi = distractors.reduce((s, o) => s + (o.attempts - expected) ** 2 / expected, 0);
    if (chi > critical) {
      flag("position-bias", "wrong answers pile up on one position", {
        chi,
        distractors: distractors.length,
      });
    }
  }
  return flags;
}

/** Publish one item: suppressed cell family plus flags drawn only from published cells. */
export function publishItem(item, minCell = DEFAULTS.minCell) {
  const family = cellFamily(item);
  const atomN = new Map([...item.atoms].map(([id, a]) => [id, a.n]));
  const cells = suppressCells(family, atomN, minCell).map((c) =>
    c.suppressed
      ? { id: c.id, kind: c.kind, ref: c.ref, suppressed: true }
      : { id: c.id, kind: c.kind, ref: c.ref, suppressed: false, ...measure(item, c) },
  );
  const published = cells.filter((c) => !c.suppressed);
  return {
    itemId: item.itemId,
    cells,
    flags: flagsFor(item, published),
    _atomN: atomN,
    _family: family,
  };
}

/** Public result for a batch of events: items without the engine-only fields. */
export function publishAll(events, minCell = DEFAULTS.minCell) {
  return [...buildItemTable(events).values()]
    .sort((a, b) => a.itemId.localeCompare(b.itemId))
    .map((item) => {
      const { _atomN, _family, ...pub } = publishItem(item, minCell);
      return pub;
    });
}

/** Engine-side view for tests that need the atoms to mount a differencing attack. */
export function publishWithAtoms(events, minCell = DEFAULTS.minCell) {
  return [...buildItemTable(events).values()].map((item) => publishItem(item, minCell));
}
