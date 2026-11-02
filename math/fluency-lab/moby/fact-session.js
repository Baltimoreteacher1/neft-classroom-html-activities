// Personalized daily fluency session: which facts to practice today and why, built only from the learner's own
// counted evidence. Pure (no DOM, no clock, randomness only through the injected rng). No view lives here.
import { factSteps } from "../problem-bank.js";
import {
  FACT_THRESHOLDS,
  dayOf,
  difficultFacts,
  dueFacts,
  factAccuracy,
  factParts,
  factRank,
  factStatus,
  familyOf,
  gradeFactDomain,
  isTrackedKey,
  isDifficult,
  recordFactAttempt,
  strategyFor,
  strategyHint,
} from "./fact-model.js";

export const SESSION_MINUTES = Object.freeze([5, 10, 15]);
// ASSUMPTION, stated once: about 30 seconds per fact, including reading the strategy and thinking. It sizes the
// session; it is an estimate, never a measurement of the learner, and timed mode does not change it.
export const SECONDS_PER_ITEM = 30;
export const MAX_APPEARANCES = 3; // one fact is shown at most this many times in a session (while others remain)
// A 5-minute session is deliberately short: 10 facts, one tricky and one new fact at most, plus a warm-up.
export const SESSION_PLAN = Object.freeze({
  5: Object.freeze({ items: 10, warmUp: 2, stretch: 1, learnMax: 2, difficultCap: 1, newCap: 1 }),
  10: Object.freeze({ items: 20, warmUp: 3, stretch: 2, learnMax: 4, difficultCap: 3, newCap: 2 }),
  15: Object.freeze({ items: 30, warmUp: 4, stretch: 2, learnMax: 6, difficultCap: 4, newCap: 3 }),
});
const HOLD_BACK_DEVELOPING = 10; // this many facts still developing: introduce at most one new fact
const MAX_STARTERS = 2;

// Every plain-language reason, as an English template (the key in ES_MOBY_FACTS) that uses counted numbers only.
export const WHY_TEMPLATES = Object.freeze({
  "warm.known": "You have answered this right on your own {right} times. A good way to warm up.",
  "warm.starter": "An easy starter from your grade's facts. You have not practiced it here yet.",
  "review.due":
    "You answered this right before, and it has been {days} days. Time to check it still sticks.",
  "review.due-developing":
    "Still developing, and it has been {days} days since you saw it. Another look helps.",
  "review.developing": "Still developing: {right} right on your own out of {n} first tries so far.",
  "review.known": "A fact you know, mixed in to keep it fresh.",
  "review.again": "A second look later in this session, to help it stick.",
  "learn.difficult":
    "This one has been tricky: {misses} misses in your last {n} tries. Look at the strategy first.",
  "learn.new": "A new fact in your grade's set. Look at the strategy first.",
  "learn.partner":
    "A partner fact: it uses the same numbers as the one before. Look at the strategy first.",
  "stretch.next": "A small stretch from the next set of facts. Try the strategy.",
  "stretch.developing": "Still developing: one more look, with the strategy in mind.",
});
export const SUMMARY_TEMPLATES = Object.freeze({
  total:
    "Facts today: {n}, about {minutes} minutes. That is an estimate of {seconds} seconds a fact, not a measure of you.",
  warmKnown: "Warm-up facts you already answered right on your own: {n}",
  warmStarter: "Easy starter facts you have not practiced here yet: {n}",
  due: "Facts due for a check because it has been a while: {n}",
  developing: "Facts still developing, for another look: {n}",
  difficult:
    "Tricky facts (2 or more misses in your last 5 tries), each with a strategy shown first: {n}",
  fresh: "New facts, with partners from the same fact family: {n}",
  stretch: "Stretch facts from the next set: {n}",
  again: "Second looks later in the session, to help facts stick: {n}",
  heldBack: "New facts are limited to {n} because {m} facts are still developing.",
  timed:
    "Timed practice is on. Your time is kept as a separate note and is never needed to master a fact.",
});
export const RECEIPT_TEMPLATES = Object.freeze({
  practiced: "Facts you practiced: {n}",
  firstTry: "Answered right on the first try: {n} of {total}",
  secure: "Facts that became secure: {n}",
  retained: "Facts you kept after time away: {n}",
  look: "Facts worth another look: {n}",
  strategy: "Answers where you used a strategy: {n}",
});

const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (_, name) => String(vars[name]));
const line = (id, template, vars = {}) => ({ id, template, vars, text: fill(template, vars) });
const shuffle = (list, rng) => {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
// Easier-looking facts first, with a little seeded shuffle so two sessions are not identical.
const byRank = (keys, rng) =>
  keys
    .map((key) => [key, factRank(key) + rng() * 40])
    .sort((p, q) => p[1] - q[1])
    .map(([key]) => key);

const STEP_STRATEGY = { doubles: "doubles", "near-doubles": "near", "make-ten": "makeTen" };

// A question in the exact format existing items use ("a ○ b = ?"), so chartKey, validateAnswer and the answer
// checkers all work. Addition and multiplication randomly show either order of the same fact.
export function makeFactItem(key, rng = Math.random) {
  const parts = factParts(key);
  if (!parts) return null;
  let { a, b } = parts;
  if ((parts.op === "add" || parts.op === "mul") && a !== b && rng() < 0.5) [a, b] = [b, a];
  const answer = parts.answer;
  const hint = strategyHint(key);
  const strategy = strategyFor(key);
  return {
    key,
    family: familyOf(key).id,
    question: `${a} ${parts.symbol} ${b} = ?`,
    answers: [String(answer)],
    displayAnswer: String(answer),
    kind: "number",
    choices: null,
    unit: "",
    model: null,
    strategy,
    hint: hint.text,
    hintTemplate: hint.template,
    hintVars: hint.vars,
    steps: factSteps(
      parts.op,
      a,
      b,
      answer,
      parts.op === "add"
        ? STEP_STRATEGY[strategy]
        : parts.op === "sub" && b <= 2
          ? "countBack"
          : undefined,
    ),
    explanation: `${a} ${parts.symbol} ${b} = ${answer}`,
  };
}

function toItem(key, rng, phase, whyKey, whyVars, extra = {}) {
  const item = makeFactItem(key, rng);
  const why = fill(WHY_TEMPLATES[whyKey], whyVars);
  return { ...item, phase, why, whyKey, whyVars, strategyFirst: false, repeat: false, ...extra };
}

export function buildFactSession({
  store,
  grade = 3,
  minutes = 10,
  mode = "untimed",
  now = Date.now(),
  rng = Math.random,
} = {}) {
  const mins = SESSION_MINUTES.includes(minutes) ? minutes : 10;
  const timed = mode === "timed";
  const plan = SESSION_PLAN[mins];
  const domain = gradeFactDomain(grade);
  const facts = store?.facts || {};
  const status = (key) => factStatus(facts[key], now);
  const solid = (key) => ["secure", "retained"].includes(status(key));
  const used = new Set();
  const take = (key) => {
    used.add(key);
    return key;
  };
  // Facts with no evidence yet: this grade's own facts first, then by band order, easier-looking first.
  const bandOf = (key) => domain.bands.findIndex((band) => band.keys.includes(key));
  const freshOrder = (keys) =>
    keys
      .map((key) => [
        key,
        (domain.newSet.has(key) ? 0 : 1e6) + bandOf(key) * 1e4 + factRank(key) + rng() * 40,
      ])
      .sort((p, q) => p[1] - q[1])
      .map(([key]) => key);
  const dueByKey = new Map(dueFacts(store, now).map((entry) => [entry.key, entry]));

  // 1. Tricky facts and new facts (learn): strategy shown BEFORE the learner tries to memorize.
  const learn = [];
  for (const entry of difficultFacts(store, grade, now).slice(
    0,
    Math.min(plan.difficultCap, plan.learnMax),
  )) {
    take(entry.key);
    learn.push({ key: entry.key, kind: "difficult", misses: entry.recentMisses });
  }
  const developingLoad = domain.keys.filter((key) => status(key) === "developing").length;
  const heldBack = developingLoad >= HOLD_BACK_DEVELOPING;
  const newCap = Math.min(plan.newCap, plan.learnMax - learn.length, heldBack ? 1 : plan.newCap);
  const fresh = domain.keys.filter((key) => !used.has(key) && status(key) === "not-yet");
  const queue = freshOrder(fresh);
  let added = 0;
  while (added < newCap && queue.length) {
    const seed = queue.shift();
    if (used.has(seed)) continue;
    learn.push({ key: take(seed), kind: "new" });
    added += 1;
    for (const partner of familyOf(seed).keys) {
      if (added >= newCap) break;
      if (
        partner !== seed &&
        domain.set.has(partner) &&
        !used.has(partner) &&
        status(partner) === "not-yet"
      ) {
        learn.push({ key: take(partner), kind: "partner" });
        added += 1;
      }
    }
  }

  // 2. Warm-up: facts the learner already knows and that are not due (so reviews stay reviews).
  const warmKeys = byRank(
    domain.keys.filter((key) => !used.has(key) && solid(key) && !dueByKey.has(key)),
    rng,
  )
    .slice(0, plan.warmUp)
    .map(take);
  const warm = warmKeys.map((key) => ({ key, kind: "known" }));
  if (warm.length < plan.warmUp) {
    const easy = byRank(
      domain.keys.filter(
        (key) => !used.has(key) && status(key) === "developing" && !isDifficult(facts[key], now),
      ),
      rng,
    );
    for (const key of easy.slice(0, plan.warmUp - warm.length))
      warm.push({ key: take(key), kind: "known" });
  }
  if (warm.length < plan.warmUp) {
    const starters = freshOrder(
      domain.keys.filter((key) => !used.has(key) && status(key) === "not-yet"),
    );
    for (const key of starters.slice(0, Math.min(MAX_STARTERS, plan.warmUp - warm.length)))
      warm.push({ key: take(key), kind: "starter" });
  }

  // 3. Stretch: a small step into the next grade's facts (or one more look at a developing fact).
  const stretch = [];
  const ahead = gradeFactDomain(Math.min(8, domain.grade + 1));
  const reach = byRank(
    ahead.keys.filter(
      (key) =>
        !domain.set.has(key) &&
        !used.has(key) &&
        ["not-yet", "developing"].includes(status(key)) &&
        !isDifficult(facts[key], now),
    ),
    rng,
  );
  for (const key of reach.slice(0, plan.stretch)) stretch.push({ key: take(key), kind: "next" });
  if (stretch.length < plan.stretch) {
    const more = byRank(
      domain.keys.filter(
        (key) => !used.has(key) && status(key) === "developing" && !isDifficult(facts[key], now),
      ),
      rng,
    );
    for (const key of more.slice(0, plan.stretch - stretch.length))
      stretch.push({ key: take(key), kind: "developing" });
  }

  // 4. Review: due facts first (retention), then facts still developing, then known facts mixed in.
  const reviewTarget = Math.max(0, plan.items - warm.length - stretch.length - 2 * learn.length);
  const review = [];
  const dueOrder = [...dueByKey.values()].filter(
    (entry) => domain.set.has(entry.key) && !used.has(entry.key),
  );
  for (const entry of dueOrder.filter((e) => ["secure", "retained"].includes(e.status)))
    review.push({ key: entry.key, kind: "due", days: entry.sinceDays ?? entry.overdueDays });
  for (const entry of dueOrder.filter((e) => e.status === "developing"))
    review.push({
      key: entry.key,
      kind: "due-developing",
      days: entry.sinceDays ?? entry.overdueDays,
    });
  review.splice(reviewTarget);
  review.forEach((entry) => take(entry.key));
  const rest = byRank(
    domain.keys.filter(
      (key) => !used.has(key) && status(key) === "developing" && !isDifficult(facts[key], now),
    ),
    rng,
  );
  for (const key of rest)
    if (review.length < reviewTarget) review.push({ key: take(key), kind: "developing" });
  const known = shuffle(
    domain.keys.filter((key) => !used.has(key) && solid(key)),
    rng,
  );
  for (const key of known)
    if (review.length < reviewTarget) review.push({ key: take(key), kind: "known" });

  // A learner with little evidence gets more DIFFERENT easy starter facts (a first look at what they know) rather
  // than the same few facts over and over: at least half the session's items are distinct facts.
  const distinctGoal = Math.ceil(plan.items / 2);
  const distinctNow = warm.length + learn.length + stretch.length + review.length;
  if (distinctNow < distinctGoal) {
    const more = freshOrder(
      domain.keys.filter((key) => !used.has(key) && status(key) === "not-yet"),
    );
    for (const key of more.slice(0, distinctGoal - distinctNow))
      warm.push({ key: take(key), kind: "starter" });
  }

  // Items: warm-up first, review and learn interleaved, a second look at each learn fact, stretch last.
  const nIndep = (key) => factAccuracy(facts[key]);
  const warmItems = warm.map((entry) =>
    entry.kind === "starter"
      ? toItem(entry.key, rng, "warm-up", "warm.starter", {})
      : toItem(entry.key, rng, "warm-up", "warm.known", {
          right: facts[entry.key]?.firstTryRight || 0,
        }),
  );
  const reviewItems = review.map((entry) => {
    if (entry.kind === "due")
      return toItem(entry.key, rng, "review", "review.due", { days: Math.max(1, entry.days || 1) });
    if (entry.kind === "due-developing")
      return toItem(entry.key, rng, "review", "review.due-developing", {
        days: Math.max(1, entry.days || 1),
      });
    if (entry.kind === "developing") {
      const a = nIndep(entry.key);
      return toItem(entry.key, rng, "review", "review.developing", {
        right: a.right,
        n: a.independent,
      });
    }
    return toItem(entry.key, rng, "review", "review.known", {});
  });
  const learnItems = learn.map((entry) => {
    const [whyKey, vars] =
      entry.kind === "difficult"
        ? [
            "learn.difficult",
            {
              misses: entry.misses,
              n: Math.min(FACT_THRESHOLDS.difficultWindow, facts[entry.key]?.recent.length || 0),
            },
          ]
        : entry.kind === "partner"
          ? ["learn.partner", {}]
          : ["learn.new", {}];
    return toItem(entry.key, rng, "learn", whyKey, vars, {
      strategyFirst: true,
      reason: entry.kind,
    });
  });
  const stretchItems = stretch.map((entry) =>
    toItem(
      entry.key,
      rng,
      "stretch",
      entry.kind === "next" ? "stretch.next" : "stretch.developing",
      {},
    ),
  );

  const mid = [];
  const total = reviewItems.length + learnItems.length;
  let ri = 0;
  let li = 0;
  for (let n = 0; n < total; n += 1) {
    const learnNext =
      li < learnItems.length &&
      (ri >= reviewItems.length || n >= ((li + 0.5) / learnItems.length) * total - 0.5);
    mid.push(learnNext ? learnItems[li++] : reviewItems[ri++]);
  }
  const again = (item) => toItem(item.key, rng, "review", "review.again", {}, { repeat: true });
  const insertLater = (item, minGap) => {
    const first = mid.findIndex((entry) => entry.key === item.key);
    const from = first < 0 ? 0 : first + minGap;
    mid.splice(Math.min(mid.length, from + Math.floor(rng() * 2)), 0, item);
  };
  for (const item of learnItems) insertLater(again(item), 3);

  // Thin evidence (a new learner): spaced second and third looks fill the session instead of more new facts.
  const counts = new Map();
  const tally = () => {
    counts.clear();
    for (const item of [...warmItems, ...mid, ...stretchItems])
      counts.set(item.key, (counts.get(item.key) || 0) + 1);
  };
  const pool = [...learnItems, ...reviewItems, ...warmItems];
  for (let guard = 0; guard < 500; guard += 1) {
    tally();
    if (warmItems.length + mid.length + stretchItems.length >= plan.items || !pool.length) break;
    const cap = [...counts.values()].every((c) => c >= MAX_APPEARANCES)
      ? Infinity
      : MAX_APPEARANCES;
    const pick = pool
      .filter((item) => (counts.get(item.key) || 0) < cap)
      .sort((p, q) => counts.get(p.key) - counts.get(q.key))[0];
    if (!pick) break;
    insertLater(again(pick), 2);
  }
  tally();
  while (
    warmItems.length + mid.length + stretchItems.length > plan.items &&
    mid.some((item) => item.repeat)
  )
    mid.splice(mid.map((item) => item.repeat).lastIndexOf(true), 1);

  const items = repairAdjacent([...warmItems, ...mid, ...stretchItems]);
  const phaseCounts = { "warm-up": 0, review: 0, learn: 0, stretch: 0 };
  for (const item of items) phaseCounts[item.phase] += 1;
  return {
    version: 1,
    grade: domain.grade,
    minutes: mins,
    mode: timed ? "timed" : "untimed",
    secondsPerItem: SECONDS_PER_ITEM,
    createdDay: dayOf(now),
    items,
    heldBack,
    counts: {
      total: items.length,
      phases: phaseCounts,
      knownWarm: warm.filter((e) => e.kind === "known").length,
      starters: warm.filter((e) => e.kind === "starter").length,
      due: review.filter((e) => e.kind === "due").length,
      dueDeveloping: review.filter((e) => e.kind === "due-developing").length,
      developing: review.filter((e) => e.kind === "developing").length,
      known: review.filter((e) => e.kind === "known").length,
      difficult: learn.filter((e) => e.kind === "difficult").length,
      fresh: learn.filter((e) => e.kind !== "difficult").length,
      stretch: stretch.length,
      again: items.filter((item) => item.repeat).length,
      developingLoad,
      newCap,
      uniqueFacts: new Set(items.map((item) => item.key)).size,
    },
  };
}

// No fact is ever shown twice in a row: swap a repeat with another item when that leaves no neighbours equal.
function repairAdjacent(items) {
  const out = [...items];
  const clash = (i) => i > 0 && i < out.length && out[i].key === out[i - 1].key;
  const clashes = (...spots) => spots.some((i) => clash(i) || clash(i + 1));
  // Warm-up stays first and stretch stays last: items only trade places inside their own part of the session.
  const zone = (item) => (item.phase === "warm-up" ? 0 : item.phase === "stretch" ? 2 : 1);
  for (let i = 1; i < out.length; i += 1) {
    if (!clash(i)) continue;
    for (let step = 1; step < out.length && clash(i); step += 1) {
      for (const j of [i + step, i - step]) {
        if (j < 0 || j >= out.length || j === i || zone(out[j]) !== zone(out[i])) continue;
        [out[i], out[j]] = [out[j], out[i]];
        if (clashes(i - 1, i, j - 1, j)) [out[i], out[j]] = [out[j], out[i]];
        else break;
      }
    }
  }
  return out;
}

// Plain-language reasons, built only from counted numbers. Each line carries its template + vars so a view can
// translate the template and keep the numbers.
export function sessionSummary(session) {
  const c = session.counts;
  const lines = [
    line("total", SUMMARY_TEMPLATES.total, {
      n: c.total,
      minutes: Math.round((c.total * session.secondsPerItem) / 60),
      seconds: session.secondsPerItem,
    }),
  ];
  const add = (id, n, extra = {}) => {
    if (n > 0) lines.push(line(id, SUMMARY_TEMPLATES[id], { n, ...extra }));
  };
  add("warmKnown", c.knownWarm);
  add("warmStarter", c.starters);
  add("due", c.due);
  add("developing", c.dueDeveloping + c.developing);
  add("difficult", c.difficult);
  add("fresh", c.fresh);
  add("stretch", c.stretch);
  add("again", c.again);
  if (session.heldBack)
    lines.push(line("heldBack", SUMMARY_TEMPLATES.heldBack, { n: c.newCap, m: c.developingLoad }));
  if (session.mode === "timed") lines.push(line("timed", SUMMARY_TEMPLATES.timed));
  return { total: c.total, minutes: session.minutes, lines };
}

// results: [{key, correct, firstTry, supported, ms, strategy, mode}] in the order answered. Returns the new store
// and a receipt. The session view must NOT also dispatch 'fluency-fact' for these answers (they would count twice).
export function finishSession(store, results, now = Date.now()) {
  const list = Array.isArray(results)
    ? results.filter((entry) => entry && isTrackedKey(entry.key))
    : [];
  const solidNow = (s, key) => ["secure", "retained"].includes(factStatus(s?.facts?.[key], now));
  let next = store;
  const touched = new Set();
  const strategyUse = {};
  let firstTryRight = 0;
  let timedAnswers = 0;
  const before = new Map();
  for (const entry of list) {
    if (!before.has(entry.key))
      before.set(entry.key, {
        solid: solidNow(store, entry.key),
        retained: factStatus(store?.facts?.[entry.key], now) === "retained",
      });
    next = recordFactAttempt(next, entry, now);
    touched.add(entry.key);
    if (entry.correct && entry.firstTry !== false && !entry.supported) firstTryRight += 1;
    if (entry.strategy && next.facts[entry.key])
      strategyUse[entry.strategy] = (strategyUse[entry.strategy] || 0) + 1;
    if (entry.mode === "timed" && Number.isFinite(Number(entry.ms))) timedAnswers += 1;
  }
  const keys = [...touched].filter((key) => next.facts?.[key]);
  return {
    store: next,
    receipt: {
      practiced: keys.length,
      attempts: list.length,
      firstTryRight,
      newlySecure: keys.filter((key) => solidNow(next, key) && !before.get(key).solid),
      newlyRetained: keys.filter(
        (key) => factStatus(next.facts[key], now) === "retained" && !before.get(key).retained,
      ),
      needsAnotherLook: keys.filter((key) => isDifficult(next.facts[key], now)),
      strategyUse,
      timedAnswers,
    },
  };
}

export function receiptSummary(receipt) {
  const lines = [line("practiced", RECEIPT_TEMPLATES.practiced, { n: receipt.practiced })];
  lines.push(
    line("firstTry", RECEIPT_TEMPLATES.firstTry, {
      n: receipt.firstTryRight,
      total: receipt.attempts,
    }),
  );
  const add = (id, n) => {
    if (n > 0) lines.push(line(id, RECEIPT_TEMPLATES[id], { n }));
  };
  add("secure", receipt.newlySecure.length);
  add("retained", receipt.newlyRetained.length);
  add("look", receipt.needsAnotherLook.length);
  add(
    "strategy",
    Object.values(receipt.strategyUse).reduce((sum, n) => sum + n, 0),
  );
  return lines;
}
