// Trail stars, the fact chart, stickers, and strategy notes travel with the learner's JSON backup.
import { cleanRecent, loadTrail, saveTrail } from "./fact-trail.js";
import { loadGrowthLog, sanitizeGrowthLog, saveGrowthLog } from "./growth-log.js"; // fl4:teacher
import { cleanJournal, loadJournal, saveJournal } from "./language-journal.js";
import { getLevel, setLevel } from "./language-settings.js";
import { cleanRewards, loadRewards, saveRewards } from "./rewards.js";
import { cleanPieces, loadPieces, savePieces } from "./writing-store.js";
import { cleanStudio, exportStudio, importStudio } from "./studio/adaptive.js";

const count = (value, max = 100000) => (Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), max) : 0);

export const exportPlay = () => ({ trail: loadTrail(), rewards: loadRewards(), language: { journal: loadJournal(), level: getLevel() }, writing: loadPieces(), growth: loadGrowthLog(), studio: exportStudio() }); // fl4:teacher: the growth log travels in the backup

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
    // A backup made before the writing studio has no folder; a missing list leaves the learner's folder alone.
    writing: Array.isArray(value.writing) ? cleanPieces(value.writing) : null,
    // A backup made before the Discovery Studio has none; a missing record leaves the learner's own alone.
    studio: value.studio && typeof value.studio === "object" ? cleanStudio(value.studio) : null,
    // A backup made before the growth log has none; a missing log leaves the learner's own log alone.
    growth: value.growth && typeof value.growth === "object" ? sanitizeGrowthLog(value.growth) : null, // fl4:teacher
    language: value.language && typeof value.language === "object" ? { journal: cleanJournal(value.language.journal), level: [1, 2, 3, 4].includes(value.language.level) ? value.language.level : 2 } : null,
  };
}

export function importPlay(clean) {
  if (!clean) return;
  saveTrail(clean.trail);
  saveRewards(clean.rewards);
  if (clean.writing) savePieces(clean.writing);
  if (clean.growth) saveGrowthLog(clean.growth); // fl4:teacher
  if (clean.studio) importStudio(clean.studio);
  // A backup made before the language layer has no journal; leave the learner's own journal alone.
  if (!clean.language) return;
  saveJournal(clean.language.journal);
  setLevel(clean.language.level);
}
