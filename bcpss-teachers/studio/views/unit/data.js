// Unit view data: which Studio resources reference a BCPSS seed unit, and the plain-language family card model.
// Pure data work (no DOM) so it can be tested in Node. The seed unit itself comes from catalog.seedUnit(id).
import { SEED_SUBJECT } from "../../data/taxonomy.js";

export const subjectIdOf = (label) => Object.keys(SEED_SUBJECT).find((k) => SEED_SUBJECT[k] === label) || "";

/** "Request failed (404)" and "(400)" mean the API does not know this id; anything else is a load failure. */
export function isUnknownUnit(err) {
  const msg = `${err?.cause?.message || ""} ${err?.message || ""}`;
  return /\((404|400)\)/.test(msg);
}

/**
 * Studio lessons whose curriculum.unitId is this unit, plus the vocabulary collections and activities those lessons use.
 * Only lessons for the unit's grade and subject are opened; a pack that fails to load is skipped, never fatal.
 */
export async function studioFor(catalog, unit) {
  const subject = subjectIdOf(unit.subject);
  const entries = (await catalog.byKind("lesson")).filter((e) => String(e.grade) === String(unit.grade) && e.subject === subject);
  const packs = (await Promise.all(entries.map((e) => catalog.lesson(e.id).catch(() => null)))).filter((p) => p?.curriculum?.unitId === unit.id);
  const collectionIds = [...new Set(packs.map((p) => p.vocab?.collection).filter(Boolean))];
  const collections = (await Promise.all(collectionIds.map((id) => catalog.vocab(id).catch(() => null)))).filter(Boolean);
  const seen = new Set();
  const activities = [];
  for (const p of packs) {
    for (const a of p.activities || []) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      activities.push({ id: a.id, engine: a.engine, lessonId: p.id, lessonTitle: p.title });
    }
  }
  const metas = await Promise.all(activities.map((a) => catalog.activity(a.id).catch(() => null)));
  activities.forEach((a, i) => {
    a.title = metas[i]?.title || "";
    a.minutes = metas[i]?.minutes || null;
  });
  return { lessons: packs, collections, activities };
}

/** Standards as { code, text } using the studio registry paraphrase where the code exists there, otherwise just the code. */
export function describeStandards(codes, registry) {
  const byCode = new Map((registry || []).map((s) => [s.code, s]));
  return (codes || []).map((code) => ({ code, text: byCode.get(code)?.text || "" }));
}

/**
 * The family card, composed only from the unit title, the seed's standards and the Studio lessons' own homeLanguage blocks.
 * `notes` is empty when no lesson has a family note, and the view says so instead of filling the gap.
 */
export function familyModel(unit, standards, lessons) {
  const notes = [];
  for (const p of lessons) {
    for (const [lang, block] of Object.entries(p.homeLanguage || {})) {
      if (!block || (!block.objective && !block.familyPrompt && !block.vocab?.length)) continue;
      notes.push({
        lang,
        lessonId: p.id,
        lessonTitle: p.title,
        objective: block.objective || "",
        familyPrompt: block.familyPrompt || "",
        vocab: (block.vocab || []).map((v) => ({ en: v.en, es: v.es, verified: v.verified === true })),
      });
    }
  }
  return {
    unitTitle: unit.unit_title,
    standards: standards.filter((s) => s.text || s.code),
    notes,
  };
}
