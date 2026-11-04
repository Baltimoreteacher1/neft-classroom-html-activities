// Trail stars, the fact chart, stickers, and strategy notes travel with the learner's JSON backup.
import { cleanRecent, loadTrail, saveTrail } from "./fact-trail.js";
import { loadGrowthLog, sanitizeGrowthLog, saveGrowthLog } from "./growth-log.js"; // fl4:teacher
import { cleanJournal, loadJournal, saveJournal } from "./language-journal.js";
import { getLevel, setLevel } from "./language-settings.js";
import { cleanRewards, loadRewards, saveRewards } from "./rewards.js";
import { cleanPieces, loadPieces, savePieces } from "./writing-store.js";
import { cleanStudio, exportStudio, importStudio } from "./studio/adaptive.js";
import { cleanLabLite, exportLab, importLab } from "./reality/lab/backup.js";
import { e8Store } from "./e8/e8-local.js";
import { sanitizeE8 } from "./e8/e8-store.js";
import { loadFacts, sanitizeFacts, saveFacts } from "./moby/fact-model.js"; // fl-moby:facts

const count = (value, max = 100000) => (Number.isFinite(value) && value >= 0 ? Math.min(Math.floor(value), max) : 0);

export const exportPlay = () => ({ e8: e8Store.load(), trail: loadTrail(), rewards: loadRewards(), language: { journal: loadJournal(), level: getLevel() }, writing: loadPieces(), growth: loadGrowthLog(), studio: exportStudio(), facts: loadFacts(), reality: exportLab() }); // fl4:teacher: the growth log travels in the backup; fl-moby:facts: per-fact records travel too

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
    // A backup made before Enterprise 8 has none; a missing record leaves the learner's own alone.
    e8: value.e8 && typeof value.e8 === "object" ? sanitizeE8(value.e8) : null,
    // A backup made before the writing studio has no folder; a missing list leaves the learner's folder alone.
    writing: Array.isArray(value.writing) ? cleanPieces(value.writing) : null,
    // A backup made before the Discovery Studio has none; a missing record leaves the learner's own alone.
    studio: value.studio && typeof value.studio === "object" ? cleanStudio(value.studio) : null,
    // A backup made before the growth log has none; a missing log leaves the learner's own log alone.
    growth: value.growth && typeof value.growth === "object" ? sanitizeGrowthLog(value.growth) : null, // fl4:teacher
    // A backup made before the per-fact model has none; a missing record leaves the learner's own facts alone.
    facts: value.facts && typeof value.facts === "object" ? sanitizeFacts(value.facts) : null, // fl-moby:facts
    // A backup made before the Reality Lab has none; a missing record leaves the learner's own sessions alone.
    reality: cleanLabLite(value.reality),
    language: value.language && typeof value.language === "object" ? { journal: cleanJournal(value.language.journal), level: [1, 2, 3, 4].includes(value.language.level) ? value.language.level : 2 } : null,
  };
}

export function importPlay(clean) {
  if (!clean) return;
  saveTrail(clean.trail);
  saveRewards(clean.rewards);
  if (clean.writing) savePieces(clean.writing);
  if (clean.e8) e8Store.save(clean.e8);
  if (clean.growth) saveGrowthLog(clean.growth); // fl4:teacher
  if (clean.studio) importStudio(clean.studio);
  if (clean.facts) saveFacts(clean.facts); // fl-moby:facts
  if (clean.reality) importLab(clean.reality);
  // A backup made before the language layer has no journal; leave the learner's own journal alone.
  if (!clean.language) return;
  saveJournal(clean.language.journal);
  setLevel(clean.language.level);
}
