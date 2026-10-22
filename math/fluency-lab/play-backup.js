// Trail stars, the fact chart, stickers, and strategy notes travel with the learner's JSON backup.
import { cleanRecent, loadTrail, saveTrail } from "./fact-trail.js";
import { cleanJournal, loadJournal, saveJournal } from "./language-journal.js";
import { getLevel, setLevel } from "./language-settings.js";
import { cleanRewards, loadRewards, saveRewards } from "./rewards.js";

const count = (value, max = 100000) => (Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), max) : 0);

export const exportPlay = () => ({ trail: loadTrail(), rewards: loadRewards(), language: { journal: loadJournal(), level: getLevel() } });

export function cleanPlay(value) {
  if (!value || typeof value !== "object") return null;
  const stations = {};
  for (const [id, entry] of Object.entries(value.trail?.stations || {}))
    if (/^[1-8]:[\w-]{1,30}$/.test(id) && entry && typeof entry === "object")
      stations[id] = { stars: count(entry.stars, 3), best: count(entry.best, 10), rounds: count(entry.rounds) };
  const facts = {};
  for (const [id, entry] of Object.entries(value.trail?.facts || {}))
    if (/^(add|mul):\d{1,3}:\d{1,3}$/.test(id) && entry && typeof entry === "object")
      facts[id] = {
        right: count(entry.right),
        missed: count(entry.missed),
        last: entry.last === true,
        ...(/^\d{4}-\d{2}-\d{2}$/.test(entry.lastDay) ? { lastDay: entry.lastDay } : {}),
      };
  return {
    trail: { stations, facts, recent: cleanRecent(value.trail?.recent) },
    rewards: cleanRewards(value.rewards || {}),
    language: value.language && typeof value.language === "object" ? { journal: cleanJournal(value.language.journal), level: [1, 2, 3, 4].includes(value.language.level) ? value.language.level : 2 } : null,
  };
}

export function importPlay(clean) {
  if (!clean) return;
  saveTrail(clean.trail);
  saveRewards(clean.rewards);
  // A backup made before the language layer has no journal; leave the learner's own journal alone.
  if (!clean.language) return;
  saveJournal(clean.language.journal);
  setLevel(clean.language.level);
}
