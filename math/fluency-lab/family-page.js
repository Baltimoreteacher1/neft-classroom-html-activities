// One-page family summary: this week's progress, the facts worth practicing, and things to say and do together.
// It is built from this device's saved progress and never sent anywhere; a family can print it or save it as a file.
import { TRAILS, loadTrail } from "./fact-trail.js";
import { factLabel, factsReport } from "./class-snapshot.js";
import { GAMES_BY_ID_NAME } from "./game-names.js";
import { dailyGame, earnedIds, loadRewards, rankFor, summarize } from "./rewards.js";
import { bandFor } from "./fact-trail.js";
import { tipOfDay } from "./strategies.js";

const esc = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const FACT_TIPS = {
  add: "Make a ten, count on from the bigger number, or use a double you know.",
  mul: "Break one factor apart, or build from a fact you already know.",
};

export function familySummaryHtml({ grade, name }) {
  const trail = loadTrail();
  const rewards = loadRewards();
  const summary = summarize(trail, rewards);
  const rank = rankFor(summary);
  const stops = TRAILS[grade].stations;
  const done = stops.filter((entry) => (trail.stations[`${grade}:${entry.id}`]?.stars || 0) >= 2).length;
  const tricky = factsReport(grade).tricky.sort((a, b) => b.missed - a.missed).slice(0, 6);
  const tip = tipOfDay(bandFor(grade));
  return `<article class="family-print"><h1>${esc(name)}’s Math Fluency Summary</h1>
    <p>Grade ${grade} · ${new Date().toLocaleDateString()} · Rank: ${esc(rank.name)}</p>
    <h2>This week</h2>
    <ul><li><b>${done} of ${stops.length}</b> trail stops finished (2 or more stars)</li><li><b>${summary.stars}</b> trail stars</li><li><b>${summary.streak}</b> day${summary.streak === 1 ? "" : "s"} in a row</li><li><b>${earnedIds(summary).length}</b> stickers earned</li></ul>
    <h2>Facts to practice together</h2>
    ${tricky.length ? `<ul>${tricky.map((fact) => `<li><b>${esc(factLabel(fact.key))}</b> — ${esc(FACT_TIPS[fact.key.split(":")[0]])}</li>`).join("")}</ul>` : "<p>No tricky facts right now. Keep practicing a little each day.</p>"}
    <h2>Ask your child</h2>
    <ul><li>“Show me how you solved one. What did you do first?”</li><li>“How could you check that answer?”</li><li>“Which strategy helped most today?”</li></ul>
    <h2>Strategy of the day: ${esc(tip.title)}</h2><p>${esc(tip.tip)}</p>
    <h2>Play together</h2><p>Try <b>${esc(GAMES_BY_ID_NAME[dailyGame()])}</b> in the Game Room at eduwonderlab.com/math/fluency-lab/. There are no timers.</p>
    <p class="family-note">Progress lives on this device only. Nothing was uploaded to make this page.</p></article>`;
}

// A standalone file a family can keep or share.
export function familySummaryDocument(options) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>Math Fluency Summary</title><style>body{font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:2rem auto;padding:0 1rem;color:#13233a}h1{font-size:1.6rem}h2{font-size:1.1rem;margin-top:1.4rem;border-bottom:2px solid #d5deea}li{margin:.25rem 0}.family-note{color:#4a5a70;font-size:.9rem}</style></head><body>${familySummaryHtml(options)}</body></html>`;
}
