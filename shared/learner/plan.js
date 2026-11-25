/**
 * Daily plan: 10, 15 or 20 minutes. A 2-minute retrieval warm-up from earlier units always comes first and is
 * reserved even when no card is due. The rest is a 0/1 knapsack over activity durations (8-20 minutes)
 * maximising the summed recommendation score, with a domain-balance constraint (at most one activity per domain).
 * Card count in the warm-up respects the daily card budget.
 */
import { DEFAULTS } from "./constants.js";
import { selectDue } from "./leitner.js";

const POOL = 15;

function knapsack(scored, capacity) {
  const [lo, hi] = DEFAULTS.activityMinutes;
  const items = scored
    .filter((s) => s.candidate.minutes >= lo && s.candidate.minutes <= hi)
    .slice(0, POOL);
  const domains = [...new Set(items.map((s) => s.candidate.domain))].sort();
  let states = new Map([["0|0", { score: 0, picks: [] }]]);
  for (const item of items) {
    const bit = 1 << domains.indexOf(item.candidate.domain);
    const next = new Map(states);
    for (const [key, st] of states) {
      const [mask, used] = key.split("|").map(Number);
      const minutes = used + item.candidate.minutes;
      if (mask & bit || minutes > capacity) continue;
      const nk = `${mask | bit}|${minutes}`;
      const cand = { score: st.score + item.score, picks: [...st.picks, item] };
      const cur = next.get(nk);
      if (!cur || cand.score > cur.score + 1e-12) next.set(nk, cand);
    }
    states = next;
  }
  let best = { score: -1, picks: [] };
  for (const st of states.values()) if (st.score > best.score + 1e-12) best = st;
  return best.picks;
}

/**
 * @param {number} minutes one of DEFAULTS.planMinutes
 * @param {Array} scored output of scoreActivities (best first)
 * @param {{cards:Array, today:number, budget?:number, usedToday?:number, currentUnitOrder?:Record<string,number>, currentUnitId?:string}} retrieval
 */
export function planDay(minutes, scored, retrieval, hooks = {}) {
  if (!DEFAULTS.planMinutes.includes(minutes)) {
    throw new Error(`plan length must be one of ${DEFAULTS.planMinutes.join(", ")} minutes`);
  }
  const { cards, today, budget, usedToday, currentUnitId } = retrieval;
  const earlier = cards.filter((c) => c.unitId !== currentUnitId);
  const due = selectDue(earlier, today, { budget, usedToday }, hooks).slice(
    0,
    DEFAULTS.warmupCards,
  );
  const picks = knapsack(scored, minutes - DEFAULTS.warmupMinutes);
  const total = DEFAULTS.warmupMinutes + picks.reduce((n, p) => n + p.candidate.minutes, 0);
  return {
    minutes,
    totalMinutes: total,
    warmup: {
      minutes: DEFAULTS.warmupMinutes,
      cards: due,
      why: "A quick look back at words from earlier units helps them stick.",
    },
    activities: picks.map((p) => ({ id: p.id, minutes: p.candidate.minutes, why: p.why })),
  };
}
