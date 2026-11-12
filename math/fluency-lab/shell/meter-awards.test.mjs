// The mastery meter counts only independent first-try answers at the skill's level (supported answers and
// warm-ups are shown separately and never fill a segment), and celebrations award stars through the lab's
// EXISTING rewards record: same storage key, same cleanRewards, carried by the same backup.
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
globalThis.sessionStorage = { getItem: () => null, setItem: () => {} };
globalThis.document ??= { documentElement: { dataset: {}, lang: "en" } };

const { getSkill } = await import("../problem-bank.js");
const { emptyTutor, recordAnswer, evidence } = await import("../tutor-engine.js");
const { METER_STEPS, STAGE_TEXT, meterChange, meterFor, meterHtml, meterMini } = await import("./meter.js");
const { recordPractice, skillMeter } = await import("./store.js");
const { REWARDS_KEY, cleanRewards, loadRewards } = await import("../rewards.js");
const awards = await import("./awards.js");
const { missingSpanish } = await import("./words.js");
const { REASONS, recommendedNext } = await import("./recommend.js");

const skill = { ...getSkill(6, "ratios"), grade: 6 };
const HOUR = 3600 * 1000;

// --- meter: pure counting over tutor evidence ---
{
  const t = emptyTutor();
  const at = Date.now() - 48 * HOUR;
  const read = () => meterFor(evidence(t, skill, at + 50 * HOUR));
  assert.equal(read().stage, "new");
  recordAnswer(t, skill, { correct: true, independent: false, level: 1 }, at);
  assert.equal(read().filled, 0, "a supported right answer never fills a segment");
  assert.equal(read().helped, 1, "a supported right answer is shown separately");
  assert.equal(read().stage, "warming");
  recordAnswer(t, skill, { correct: true, independent: true, level: 0 }, at);
  assert.equal(read().filled, 0, "a warm-up (smaller numbers) right answer never fills a segment");
  assert.equal(read().helped, 2);
  recordAnswer(t, skill, { correct: false, independent: true, level: 1 }, at);
  assert.equal(read().filled, 0, "a wrong answer never fills a segment");
  recordAnswer(t, skill, { correct: true, independent: true, level: 1 }, at);
  assert.equal(read().filled, 1, "an independent right answer at the skill's level fills one segment");
  assert.equal(read().stage, "started");
  for (let i = 0; i < 7; i += 1) recordAnswer(t, skill, { correct: true, independent: true, level: 1 }, at + i * 60000);
  assert.equal(read().filled, METER_STEPS);
  assert.equal(read().stage, "ready", "eight on my own in one sitting is not yet remembered");
  for (let i = 0; i < 2; i += 1) recordAnswer(t, skill, { correct: true, independent: true, level: 1 }, at + 30 * HOUR + i);
  assert.equal(evidence(t, skill, at + 31 * HOUR).secure, true);
  assert.equal(meterFor(evidence(t, skill, at + 31 * HOUR)).stage, "remembered", "spaced, accurate work is remembered");
  // Many supported answers can never reach the remembered stage.
  const s = emptyTutor();
  for (let i = 0; i < 20; i += 1) recordAnswer(s, skill, { correct: true, independent: false, level: 1 }, at + i * HOUR * 3);
  const m = meterFor(evidence(s, skill, at + 70 * HOUR));
  assert.deepEqual([m.filled, m.stage, m.helped], [0, "warming", 20], "supported work never inflates the meter");
}
// meterChange: only a rise in stage is a milestone.
{
  const a = meterFor({ recent: [{ correct: true, independent: true, level: 1 }] });
  const b = meterFor({ recent: [{ correct: true, independent: true, level: 1 }, { correct: false, independent: true, level: 1 }] });
  assert.equal(meterChange(a, b).rose, false, "a miss is never a milestone");
  assert.equal(meterChange(meterFor({}), a).rose, true);
  const html = meterHtml(a);
  assert.match(html, /role="meter"/);
  assert.match(html, /aria-valuetext="Getting started: 1 of 8 on my own"/, "the stage is in words for screen readers");
  assert.match(meterMini(a), /role="img" aria-label="Getting started: 1 of 8 on my own"/);
}

// --- store: recordPractice → meter, through the same tutor record the lab uses ---
{
  store.clear();
  const item = { question: "2:3 = 4:□", answers: ["6"], level: 1 };
  recordPractice(skill, item, { correct: true, independent: false, firstTry: true, raw: "6", level: 1 });
  assert.equal(skillMeter(skill).filled, 0, "help opened before answering: not counted on the meter");
  recordPractice(skill, item, { correct: true, independent: true, firstTry: true, raw: "6", level: 1 });
  assert.equal(skillMeter(skill).filled, 1, "an independent first try moves the meter");
  recordPractice(skill, item, { correct: true, independent: false, firstTry: false, raw: "6", level: 1 });
  assert.equal(skillMeter(skill).filled, 1, "a second try never moves the meter");
}

// --- rewards: the existing record, cleaned the existing way ---
{
  store.clear();
  const first = awards.awardPractice({ milestone: "stage" });
  assert.equal(first.stars, 1);
  const saved = JSON.parse(store.get(REWARDS_KEY));
  assert.equal(saved.coins.earned, 1, "a milestone star is a coin in the lab's rewards record");
  assert.equal(saved.days.length, 1, "practising is a practice day, as in the lab");
  assert.deepEqual(cleanRewards(saved), saved, "the saved record is already in cleanRewards form");
  assert.equal(awards.awardPractice({ milestone: null }).stars, 0, "a right answer that is not a milestone gives no stars");
  assert.equal(awards.awardPractice({ milestone: "remembered" }).stars, awards.MILESTONE_STARS.remembered);
  assert.equal(loadRewards().coins.earned, 1 + awards.MILESTONE_STARS.remembered);
  // No second economy: the record has exactly the lab's fields.
  assert.deepEqual(Object.keys(saved).sort(), Object.keys(cleanRewards({})).sort());
  // A tampered record is cleaned on load, and a backup round trip keeps the stars.
  store.set(REWARDS_KEY, JSON.stringify({ ...saved, coins: { earned: -5, spent: 9 }, extra: "x" }));
  assert.deepEqual(loadRewards().coins, { earned: 0, spent: 0 }, "a tampered coin count is cleaned");
  assert.equal("extra" in loadRewards(), false);
  awards.awardPractice({ milestone: "stage" });
  const { exportPlay, cleanPlay, importPlay } = await import("../play-backup.js");
  const backup = JSON.parse(JSON.stringify(exportPlay()));
  store.delete(REWARDS_KEY);
  importPlay(cleanPlay(backup));
  assert.equal(loadRewards().coins.earned, 1, "stars from the student app travel in the lab's backup");
  backup.rewards.coins.earned = 1e12;
  assert.equal(cleanPlay(backup).rewards.coins.earned, 100000, "an imported record is cleaned (capped)");
}

// --- words: Spanish for every line, and the buddy praises thinking, never speed ---
{
  assert.deepEqual(missingSpanish(awards.LINE_KEYS), [], "every buddy line has Spanish");
  assert.deepEqual(missingSpanish(REASONS), [], "every recommendation reason has Spanish");
  assert.deepEqual(missingSpanish(Object.values(STAGE_TEXT)), [], "every meter stage is named in Spanish");
  assert.deepEqual(missingSpanish(["Recommended for you", "Up next"]), [], "both strip titles have Spanish");
  for (const line of awards.LINE_KEYS)
    assert.doesNotMatch(line, /fast|quick|speed|second|timer|streak|in a row|hurry/i, `"${line}" praises thinking`);
  const html = awards.celebrationHtml({ kind: "milestone", stars: 1, stickers: [], look: { color: "blue" }, stageName: "Building" });
  assert.match(html, /New stage: Building/);
  assert.match(html, /\+1 star/);
}

// --- recommendations: prerequisite-aware ---
{
  const t = emptyTutor();
  const pre = { ...getSkill(3, "mul-0-5"), grade: 3 };
  for (let i = 0; i < 4; i += 1) recordAnswer(t, pre, { correct: false, independent: true, level: 1 });
  const rows = recommendedNext(t, 6, { limit: 40 });
  assert.ok(rows.some((r) => r.skill.id === "mul-0-5" && r.forSkill), "a shaky foundation is recommended first, with the skill it is for");
  assert.ok(rows.every((r) => r.skill.id !== "ratios"));
  const fresh = recommendedNext(emptyTutor(), 3, { limit: 3 });
  assert.ok(!fresh.some((r) => r.skill.id === "mul-6-9") || fresh.findIndex((r) => r.skill.id === "mul-0-5") < fresh.findIndex((r) => r.skill.id === "mul-6-9"), "a same-grade foundation comes before the skill built on it");
}
console.log("meter + awards: independent-only meter, existing rewards record, backup round trip, Spanish, recommendations — ok");
