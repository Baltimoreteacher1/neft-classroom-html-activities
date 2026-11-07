// One loader for the evidence the Portfolio and the Collection Book both read, so the two pages can never disagree
// about what the learner has done. Everything is read from what the lab already stores; nothing is written here.
import { available, list as listRecordings } from "./audio-store.js";
import { loadStudioIndex, loadWarmup } from "./content.js";
import { loadGames } from "./games/state.js";
import { loadLedger } from "./lang/ledger.js";
import { gardenWords } from "./lang/portfolio.js";
import { loadStudio } from "./lang/studio.js";
import { fileOf, getWarmup, TIERS } from "./lang/warmup.js";
import { loadReadingState } from "./reading-state.js";
import { allRecords, practiceDays, PREFIX } from "./store.js";
import { safeJson, storage } from "./util.js";

const titlesOf = (rows = []) => Object.fromEntries(rows.map((r) => [r.id, r.title || r.name]));

/** Warm-up word lists for the tiers the learner has saved days in (at most the two files). */
async function wordLists(warmup) {
  const tiers = new Set(Object.keys(warmup.days).map((k) => k.split("|")[0]));
  const files = new Set([...tiers].map(fileOf));
  const out = {};
  await Promise.all(
    [...files].map(async (f) => {
      const data = await loadWarmup(f).catch(() => null);
      for (const t of TIERS) if (data?.tiers?.[t]) out[t] = data.tiers[t];
    }),
  );
  return out;
}

export async function loadExperience(ctx) {
  const prefs = ctx.prefs;
  const warmup = getWarmup(prefs);
  const studioIndex = await loadStudioIndex().catch(() => null);
  const [lists, recordings] = await Promise.all([wordLists(warmup), available() ? listRecordings().catch(() => []) : []]);
  const reading = loadReadingState();
  const flashcards = safeJson(storage.get(`${PREFIX}:flashcards`), {}) || {};
  const exhibitionRaw = safeJson(storage.get(`${PREFIX}:exhibition`), null);
  const garden = gardenWords({ warmup, wordLists: lists, reading, flashcards });
  return {
    band: ctx.band,
    prefs,
    warmup,
    studio: loadStudio(),
    ledger: loadLedger(),
    reading,
    games: loadGames(),
    flashcards,
    exhibition: exhibitionRaw?.v === 1 ? exhibitionRaw : { v: 1, bands: {} },
    records: allRecords(),
    practice: practiceDays(),
    recordings,
    wordLists: lists,
    garden,
    titles: {
      writing: titlesOf(studioIndex?.writing),
      speaking: titlesOf(studioIndex?.speaking),
      missions: titlesOf(studioIndex?.missions),
    },
  };
}
