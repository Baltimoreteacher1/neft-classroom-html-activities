// Prepare: turn one lesson (and optionally a class profile) into an editable list of parts.
import { dominantTier, tierShares } from "../core/classes.js";
import { ENGINES, TIERS } from "../data/taxonomy.js";

const ENGINE_LABEL = Object.fromEntries(ENGINES.map((e) => [e.id, e.label]));
const PRINT_LABEL = { organizer: "graphic organizer", "task-cards": "task cards", "exit-ticket": "exit ticket", "vocab-mat": "vocabulary mat" };

const TIER_MOVES = {
  ee: "give word banks, pictures and a full sentence frame; let students point, gesture or use a home language to show understanding; rehearse the frame aloud with a partner before writing",
  dev: "give a sentence frame with choices; model one answer, then have students rehearse in pairs before they write",
  exp: "give a partial frame or just the sentence starter; ask for one more detail or a precise word",
  br: "ask students to justify and refine word choice; invite them to explain their reasoning to a partner or the class",
};

/** Classroom moves drawn from the class profile. Rigor is never lowered: the same task and answer apply to every group. */
export function recommendFromProfile(cls, lesson) {
  const lines = [];
  const shares = tierShares(cls);
  if (shares) {
    for (const t of TIERS) {
      if (shares[t.id] >= 20) lines.push(`${t.short}, ${shares[t.id]}% of the class: ${TIER_MOVES[t.id]}.`);
    }
    const lead = dominantTier(cls);
    lines.unshift(`Plan first for ${TIERS.find((t) => t.id === lead).short} students, the largest group, and add supports for the others.`);
  } else {
    lines.push("No proficiency counts are set for this class. Add them on the class page to get supports matched to your students.");
  }
  if (cls.domainPriorities.length) lines.push(`You prioritized ${cls.domainPriorities.join(" and ")}. Build in a short oral rehearsal before any writing task.`);
  if (cls.klus.length) lines.push(`Key language uses to emphasize: ${cls.klus.join(", ")}.`);
  const frames = lesson?.languageDemands?.structures;
  if (frames?.length) lines.push(`Model this language structure first: "${frames[0]}"`);
  lines.push("Keep the task and the answer the same for every group. Supports change access to the language, not the rigor.");
  return lines;
}

async function recommend(cls, lesson) {
  if (!cls) return null;
  try {
    const mod = await import("../core/scaffold.js");
    const fn = mod.recommendForClass || mod.classRecommendations || mod.recommend || mod.differentiate;
    if (typeof fn === "function") {
      const out = await fn(cls, lesson);
      const lines = (Array.isArray(out) ? out : [out]).map((o) => (typeof o === "string" ? o : o?.text || [o?.title, o?.detail].filter(Boolean).join(": "))).filter(Boolean);
      if (lines.length) return lines;
    }
  } catch {
    /* scaffold.js is optional; the profile-based moves below always work */
  }
  return recommendFromProfile(cls, lesson);
}

async function vocabPart(lesson, catalog) {
  const col = lesson.vocab?.collection;
  let words = (lesson.vocab?.entries || []).map((e) => e.word);
  if (col && !words.length) {
    try {
      const data = await catalog.vocab(col);
      const ids = new Set(lesson.vocab.ids || []);
      words = data.entries.filter((e) => !ids.size || ids.has(e.id)).map((e) => e.word);
    } catch {
      /* the wall link still works without the word list */
    }
  }
  if (!col && !words.length) return null;
  return { key: "vocab", label: "Vocabulary wall", text: words.length ? `${words.length} words: ${words.join(", ")}.` : "Open the vocabulary wall for this lesson.", href: col ? `#/vocab/${encodeURIComponent(col)}/wall` : null, hrefLabel: "Open word wall" };
}

/** Returns [{ key, label, text, href?, hrefLabel?, activityId? }]. */
export async function buildParts(lesson, cls, catalog) {
  const parts = [];
  const objectives = [lesson.contentObjective && `Content: ${lesson.contentObjective}`, lesson.languageObjective && `Language: ${lesson.languageObjective}`].filter(Boolean);
  if (objectives.length) parts.push({ key: "objectives", label: "Objectives", text: objectives.join("\n") });
  const vocab = await vocabPart(lesson, catalog);
  if (vocab) parts.push(vocab);
  const diff = await recommend(cls, lesson);
  if (diff) parts.push({ key: "differentiation", label: `Supports for ${cls.nickname}`, text: diff.join("\n") });
  const first = lesson.activities?.[0];
  if (first) {
    let title = first.id;
    let engine = first.engine;
    try {
      const a = await catalog.activity(first.id);
      title = a.title;
      engine = a.engine;
    } catch {
      /* fall back to the id */
    }
    parts.push({ key: "activity", label: "Activity", text: `${title}${engine ? ` (${ENGINE_LABEL[engine] || engine})` : ""}`, activityId: first.id });
  }
  const prompts = [...(lesson.launch?.prompts || []), ...(lesson.collaborate?.discussionCards || []).map((c) => (c.frame ? `${c.prompt} Frame: ${c.frame}` : c.prompt))].filter(Boolean);
  if (prompts.length) parts.push({ key: "prompts", label: "Discussion prompts", text: prompts.join("\n") });
  if (lesson.printables?.length) {
    parts.push({ key: "printable", label: "Printable", text: `Available: ${lesson.printables.map((p) => PRINT_LABEL[p] || p).join(", ")}.`, href: `#/create?type=${encodeURIComponent(lesson.printables[0])}&lesson=${encodeURIComponent(lesson.id)}`, hrefLabel: "Open in Resource Studio" });
  }
  const exit = lesson.exitTicket;
  if (exit?.prompt) parts.push({ key: "exit", label: "Exit ticket", text: [exit.prompt, ...(exit.successCriteria || []).map((c) => `Success: ${c}`)].join("\n") });
  return parts;
}
