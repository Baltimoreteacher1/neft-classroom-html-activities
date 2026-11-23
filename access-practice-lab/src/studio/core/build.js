// "Create My Activity": one entry point for the three ways a teacher gives content (Use This Lesson, Add My Content,
// Describe My Idea). It never invents curriculum: lesson content comes from the unit record, math practice from the
// verified generators, and anything else only from what the teacher typed. When there is not enough to build a good
// activity it says what is missing instead of padding.

import { buildActivity, recommend, supportsForWida } from "./generate.js";
import { parseContent } from "./parse.js";

const NUMBER_WORDS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  twelve: 12,
  fifteen: 15,
  twenty: 20,
};
const KIND_WORDS = [
  ["worksheet", /\b(worksheet|printable|handout|packet)\b/i],
  ["game", /\b(game|quest|adventure|challenge|puzzle)\b/i],
  ["check", /\b(quick check|exit ticket|check for understanding|quiz|assessment)\b/i],
  ["interactive", /\b(interactive|activity|drag|sort|match)\b/i],
];

let mathgen;
async function loadMathgen() {
  if (mathgen === undefined) mathgen = await import("./mathgen.js").catch(() => null);
  return mathgen;
}

/** What a plain-language idea tells us without a model: kind, count, supports, grade and subject hints. */
export function readIdea(text) {
  const s = String(text ?? "");
  const kind = KIND_WORDS.find(([, re]) => re.test(s))?.[0] || "";
  const m = s.match(
    /\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty)\s+(?:practice\s+)?(?:questions|problems|items|words|terms)\b/i,
  );
  const count = m ? Number(m[1]) || NUMBER_WORDS[m[1].toLowerCase()] || 0 : 0;
  const grade = s.match(/\bgrade\s*(k|\d)\b/i)?.[1]?.toUpperCase() || "";
  return {
    kind,
    count,
    grade,
    spanish: /\bspanish|español|bilingual\b/i.test(s),
    visuals: /\b(visual|picture|image|model|diagram)s?\b/i.test(s),
    frames: /\bsentence (frames|starters)\b/i.test(s),
    readAloud: /\b(read[- ]aloud|audio|listen)\b/i.test(s),
    explain: /\bexplain( your thinking)?\b/i.test(s),
    answerKey: /\banswer key\b/i.test(s),
    subjectHint: /\b(math|ratio|fraction|equation|decimal|percent|algebra|geometry)\w*\b/i.test(s)
      ? "Math"
      : /\b(reading|passage|vocabulary|writing|grammar)\b/i.test(s)
        ? "ELA"
        : "",
  };
}

/**
 * @param {object} args
 *  mode: "lesson" | "content" | "idea"; kind: chosen kind or ""; text; context; seed (from seedFromDetail);
 *  supports; count; template; ai: async ({ prompt, kind, context }) => { ok, activity } | { ok:false, error } (optional)
 * @returns {Promise<{ activity: object|null, needs: string[], notes: string[], why: string[]|null }>}
 */
export async function createActivity({
  mode,
  kind = "",
  text = "",
  context = {},
  seed = null,
  supports = {},
  count,
  template = "",
  ai = null,
}) {
  const notes = [];
  const idea = mode === "idea" ? readIdea(text) : null;
  if (idea?.kind && !kind) kind = idea.kind;
  const sup = {
    ...supports,
    ...(idea?.spanish ? { spanish: true } : {}),
    ...(idea?.visuals ? { visuals: true } : {}),
    ...(idea?.frames ? { frames: true } : {}),
    ...(idea?.readAloud ? { readAloud: true } : {}),
  };
  const ctx = {
    ...context,
    grade: context.grade || idea?.grade || "",
    subject: context.subject || idea?.subjectHint || "",
  };

  if (mode === "idea" && ai) {
    const res = await ai({ prompt: text, kind, context: ctx }).catch(() => ({
      ok: false,
      error: "failed",
    }));
    if (res?.ok && res.activity)
      return {
        activity: {
          ...res.activity,
          context: {
            ...res.activity.context,
            ...ctx,
            source: { origin: "idea", note: "Drafted from your description. Check every answer." },
          },
        },
        needs: [],
        notes: [
          "This draft was written from your description. Read every question and answer before you share it.",
        ],
        why: null,
      };
    notes.push("The drafting helper could not answer, so this was built without it.");
  }

  const parsed =
    mode === "content" || mode === "idea"
      ? parseContent(mode === "idea" ? "" : text)
      : parseContent("");
  if (mode === "content") for (const n of parsed.notes) notes.push(n);
  const hasContent = Boolean(parsed.vocab.length || parsed.problems.length || parsed.questions.length || parsed.passage || parsed.sequence.length || parsed.categories.length);
  const useSeed = mode === "content" && hasContent ? (seed ? { vocab: [], frames: seed.frames, wordBank: seed.wordBank, l1Watchouts: seed.l1Watchouts } : null) : seed;
    mode === "lesson" ||
    (mode === "content" &&
      !parsed.vocab.length &&
      !parsed.problems.length &&
      !parsed.questions.length &&
      !parsed.passage)
      ? seed
      : mode === "content"
        ? null
        : seed;

  const rec = recommend(parsed, useSeed, ctx.subject);
  const chosenKind = kind || rec.kind;
  const chosenTemplate = template || (kind && kind !== rec.kind ? "" : rec.template);

  let mathQuestions = [];
  const wantsMath =
    (ctx.subject === "Math" || idea?.subjectHint === "Math") &&
    !parsed.problems.length &&
    !parsed.questions.length;
  if (wantsMath) {
    const mg = await loadMathgen();
    const topics = mg
      ? mg.topicForUnit({
          grade: ctx.grade,
          subject: "Math",
          unitTitle: ctx.unitTitle || text,
          standards: (ctx.standards || []).map((s) => s.code),
        })
      : [];
    if (mg && topics.length) {
      const n =
        count || idea?.count || (chosenKind === "worksheet" ? 8 : chosenKind === "check" ? 4 : 8);
      mathQuestions = mg.mathSet({
        topics,
        grade: ctx.grade,
        count: n,
        seed: ctx.unitId || text || "math",
      });
      notes.push(
        "Practice problems were made for this unit and every answer was calculated, not copied.",
      );
    } else if (mode === "idea")
      notes.push("I could not match your idea to a math topic I can make verified problems for.");
  }

  const built = buildActivity({
    kind: chosenKind,
    template: chosenTemplate,
    parsed,
    seed: useSeed,
    context: { ...ctx, source: sourceFor(mode, ctx) },
    supports: sup.wida ? sup : { ...sup, wida: sup.wida || 0 },
    title: "",
    count: count || idea?.count || undefined,
    mathQuestions,
  });
  const needs = [...built.needs];
  if (
    mode === "idea" &&
    !mathQuestions.length &&
    !built.activity.blocks.some((b) => b.type === "question")
  )
    needs.unshift(
      "Describing an idea works best with the drafting helper, which is not turned on here. Add your words, questions or a short text, or choose a lesson, and I will build it right away.",
    );
  return {
    activity:
      needs.length && !built.activity.blocks.some((b) => b.type === "question")
        ? null
        : built.activity,
    needs,
    notes,
    why: kind ? null : rec.why,
  };
}

const sourceFor = (mode, ctx) => ({
  origin: mode === "lesson" && ctx.unitId ? "curriculum" : mode === "idea" ? "idea" : "teacher",
  note: mode === "lesson" && ctx.unitId ? "BCPSS curriculum data on this site" : "",
});

export { supportsForWida };
