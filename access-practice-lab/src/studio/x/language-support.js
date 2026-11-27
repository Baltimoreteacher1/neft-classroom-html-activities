// Academic Language Support Builder. Pure and deterministic: no DOM, no network, no clock, no randomness.
//
//   languageSupportOptions(activity, deps?) -> [{ id, label, what, adds, available, reason, done }]
//   addLanguageSupport(activity, optionId, deps?) -> { ok, optionId, activity, added[], review[] }
//
// Every support is built ONLY from the activity's own context: its vocabulary words, its example sentences and
// reading, the math topic recorded on its generated questions (or named by the unit's own standards), and the
// question formats it already has. When the topic is unknown, only the options that need no topic language are
// offered and the others say why they are unavailable; nothing generic is written in their place. Existing
// questions, answer keys and wording are never touched (checked on every call), and every added block is marked:
// its id starts with `ls-`, it is listed in `lineage.added`, and `review[]` names it for the teacher.
// `deps`: { topics (default MATH_TOPICS), newId, bilingual (default: supports.spanish) }.

import { frameKey } from "../core/differentiate-frames.js";
import {
  clone,
  finish,
  freshId,
  newErrors,
  pair,
  takenIds,
  withAdded,
  words,
} from "../core/differentiate-util.js";
import { MATH_TOPICS, topicForUnit } from "../core/mathgen.js";
import { LIMITS, questionsOf } from "../core/schema.js";
import { DONE, FULL, OPTIONS, OPTION_IDS, PLACE } from "./language-support-options.js";
import { QUOTES, TEXT, fill, frameOf } from "./language-support-text.js";

export { OPTIONS, OPTION_IDS };

const MAX_FRAMES = 3;
/** Limits that keep every built string inside the schema caps (a frame holds 300 characters, an organizer prompt 160). */
const MAX_KERNEL = 110;
const MAX_COMPARE_TERM = 20;

// ── context ─────────────────────────────────────────────────────────────────

/** The math topics this activity is about: generated questions record their topic as `skill`; else the unit's standards. */
function topicsOf(activity, topics) {
  const known = new Map(topics.map((t) => [t.id, t]));
  const counts = new Map();
  for (const q of questionsOf(activity))
    if (known.has(q.skill)) counts.set(q.skill, (counts.get(q.skill) || 0) + 1);
  let ids = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
  const c = activity.context;
  if (!ids.length && /math/i.test(c.subject))
    ids = topicForUnit({
      grade: c.grade,
      subject: "Math",
      unitTitle: c.unitTitle || activity.title,
      standards: c.standards.map((s) => s.code),
    });
  const found = ids
    .map((id) => known.get(id))
    .filter(Boolean)
    .slice(0, 3);
  if (!found.length) return null;
  const join = (lang) => found.map((t) => t[lang].toLowerCase()).join(", ");
  return { ids: found.map((t) => t.id), en: join("en"), es: join("es") };
}

const oneLine = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();

function readContext(activity, deps) {
  const vocab = activity.blocks
    .filter((b) => b.type === "vocab")
    .flatMap((b) => b.items)
    .filter((v) => oneLine(v.term) && oneLine(v.term).length <= 40);
  const questions = questionsOf(activity);
  const passage = activity.blocks
    .filter((b) => b.type === "passage")
    .map((b) => b.text)
    .join("\n");
  const sentences = [
    ...vocab.map((v) => oneLine(v.example)),
    ...passage
      .split(/\n+/)
      .flatMap((p) => p.split(/(?<=[.!?])\s+/))
      .map(oneLine),
  ];
  const kernel = sentences.find((s) => words(s) >= 3 && words(s) <= 16 && s.length <= MAX_KERNEL) || "";
  return {
    topic: topicsOf(activity, deps.topics || MATH_TOPICS),
    terms: vocab.map((v) => oneLine(v.term)),
    compareTerms: vocab.map((v) => oneLine(v.term)).filter((t) => t.length <= MAX_COMPARE_TERM),
    images: vocab.some((v) => v.image?.src),
    kernel,
    questions,
    hasShort: questions.some((q) => q.format === "short"),
    hasPassage: Boolean(passage.trim()),
    bilingual: deps.bilingual ?? activity.supports.spanish === true,
  };
}

// ── wording helpers ─────────────────────────────────────────────────────────

const quote = (lang, s) => `${QUOTES[lang][0]}${s}${QUOTES[lang][1]}`;
/** The block text: English, then Spanish below it when the teacher wants both. */
const textOf = (ctx, make) => (ctx.bilingual ? `${make("en")}\n${make("es")}` : make("en"));
const bold = (s) => `**${s}**`;
/** The subject of a sentence: the n-th vocabulary word, else "this topic". */
const subject = (ctx, lang, n = 0) => (ctx.terms[n] ? quote(lang, ctx.terms[n]) : "");
const joinPair = (ctx, p) => (ctx.bilingual ? `${p.en} / ${p.es}` : p.en);

// ── builders: each returns { type, ... } block fields (without id) ──────────

const text = (body) => ({ type: "text", role: "body", text: body });

const BUILD = {
  "language-objective": (ctx) =>
    text(
      textOf(ctx, (lang) =>
        [
          bold(TEXT.objective.head[lang]),
          ctx.terms.length
            ? fill(TEXT.objective.withWords[lang], {
                words: ctx.terms
                  .slice(0, 4)
                  .map((t) => quote(lang, t))
                  .join(", "),
              })
            : TEXT.objective.noWords[lang],
          ctx.topic ? fill(TEXT.objective.topic[lang], { topic: ctx.topic[lang] }) : "",
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    ),

  "sentence-frames": (ctx, draft) => {
    const keys = [...new Set(ctx.questions.map((q) => frameKey(q, draft)))].slice(0, MAX_FRAMES);
    return text(
      textOf(ctx, (lang) =>
        [
          bold(TEXT.frames.head[lang]),
          TEXT.frames.intro[lang],
          ...keys.map((k, i) => `${i + 1}. ${frameOf(k)[lang]}`),
        ].join("\n"),
      ),
    );
  },

  "because-but-so": (ctx) =>
    text(
      textOf(ctx, (lang) => {
        const s = subject(ctx, lang, 0) || TEXT.bbs.thisTopic[lang];
        return [
          bold(TEXT.bbs.head[lang]),
          TEXT.bbs.intro[lang],
          !ctx.terms.length && ctx.topic
            ? fill(TEXT.bbs.topic[lang], { topic: ctx.topic[lang] })
            : "",
          `1. ${fill(TEXT.bbs.one[lang], { s })}`,
          `2. ${fill(TEXT.bbs.two[lang], { s })}`,
          `3. ${fill(TEXT.bbs.three[lang], { s })}`,
        ]
          .filter(Boolean)
          .join("\n");
      }),
    ),

  "sentence-expansion": (ctx) => {
    const kernel = ctx.kernel;
    const bare = kernel.replace(/[.!?]+$/, "");
    const make = (key) => (lang) => fill(TEXT.expand[key][lang], { kernel: quote(lang, bare) });
    return {
      type: "question",
      format: "short",
      kind: "write",
      skill: "language support",
      prompt: textOf(ctx, make("prompt")),
      frame: joinPair(
        ctx,
        pair(
          fill(TEXT.expand.frame.en, { kernel: bare }),
          fill(TEXT.expand.frame.es, { kernel: bare }),
        ),
      ),
      hint: joinPair(ctx, TEXT.expand.hint),
    };
  },

  "oral-rehearsal": (ctx) =>
    text(
      textOf(ctx, (lang) =>
        [
          bold(TEXT.oral.head[lang]),
          TEXT.oral.one[lang],
          TEXT.oral.two[lang],
          TEXT.oral.three[lang],
        ].join("\n"),
      ),
    ),

  "discussion-prompts": (ctx) =>
    text(
      textOf(ctx, (lang) => {
        const s = subject(ctx, lang, 0) || TEXT.discuss.thisTopic[lang];
        const s2 = subject(ctx, lang, 1);
        return [
          bold(TEXT.discuss.head[lang]),
          TEXT.discuss.intro[lang],
          `1. ${fill(TEXT.discuss.explain[lang], { s })}`,
          `2. ${fill(TEXT.discuss.where[lang], { s })}`,
          s2 ? `3. ${fill(TEXT.discuss.link[lang], { s, s2 })}` : "",
          `${s2 ? 4 : 3}. ${TEXT.discuss.ask[lang]}`,
        ]
          .filter(Boolean)
          .join("\n");
      }),
    ),

  "comparison-structures": (ctx) => ({
    type: "organizer",
    kind: "compare",
    prompts: ["alike", "different"].map((k) =>
      joinPair(
        ctx,
        pair(
          fill(TEXT.compare[k].en, { a: quote("en", ctx.compareTerms[0]), b: quote("en", ctx.compareTerms[1]) }),
          fill(TEXT.compare[k].es, { a: quote("es", ctx.compareTerms[0]), b: quote("es", ctx.compareTerms[1]) }),
        ),
      ),
    ),
  }),

  "claim-evidence-reasoning": (ctx) => ({
    type: "organizer",
    kind: "claim-evidence",
    prompts: [
      TEXT.cer.claim,
      ctx.hasPassage ? TEXT.cer.evidenceText : TEXT.cer.evidenceOwn,
      TEXT.cer.reasoning,
    ].map((p) => joinPair(ctx, p)),
  }),

  "paragraph-organizer": (ctx) => ({
    type: "organizer",
    kind: "sequence",
    prompts: ["topic", "one", "two", "close"].map((k) => joinPair(ctx, TEXT.paragraph[k])),
  }),

  "explanation-task": (ctx, draft) => {
    const use = (lang) =>
      ctx.terms[0] ? ` ${fill(TEXT.explainTask.useWord[lang], { s: subject(ctx, lang, 0) })}` : "";
    const frame = frameOf(frameKey({ format: "short", prompt: "explain", kind: "explain" }, draft));
    return {
      type: "question",
      format: "short",
      kind: "explain",
      skill: "language support",
      prompt: textOf(ctx, (lang) => `${TEXT.explainTask.prompt[lang]}${use(lang)}`),
      frame: joinPair(ctx, frame),
      hint: joinPair(ctx, TEXT.explainTask.hint),
    };
  },

  "writing-revision": (ctx) =>
    text(
      textOf(ctx, (lang) =>
        [
          bold(TEXT.revise.head[lang]),
          `- ${TEXT.revise.read[lang]}`,
          ctx.terms[0] ? `- ${fill(TEXT.revise.word[lang], { s: subject(ctx, lang, 0) })}` : "",
          `- ${TEXT.revise.link[lang]}`,
          `- ${TEXT.revise.marks[lang]}`,
        ]
          .filter(Boolean)
          .join("\n"),
      ),
    ),
};

// ── the option list ─────────────────────────────────────────────────────────

const done = (activity, id) => activity.blocks.some((b) => b.id.startsWith(`ls-${id}`));
function unavailable(option, activity, ctx) {
  if (option.adds !== "setting" && done(activity, option.id)) return DONE;
  if (option.adds !== "setting" && activity.blocks.length >= LIMITS.blocks) return FULL;
  return option.unmet(ctx, activity) || null;
}

/**
 * The supports this activity can take, each with a plain reason when it cannot. `done` marks one already added.
 * Without topic language only the options that need none are available; the others explain why not.
 */
export function languageSupportOptions(activity, deps = {}) {
  const ctx = readContext(activity, deps);
  return OPTIONS.map((o) => {
    const reason = unavailable(o, activity, ctx);
    return {
      id: o.id,
      label: o.label,
      what: o.what,
      adds: o.adds,
      available: !reason,
      reason,
      done: o.adds !== "setting" && done(activity, o.id),
    };
  });
}

function insertAt(blocks, place, block) {
  const firstQuestion = blocks.findIndex((b) => b.type === "question");
  let at;
  if (place === PLACE.beforeQuestions) at = firstQuestion < 0 ? blocks.length : firstQuestion;
  else if (place === PLACE.start) {
    const i = blocks.findIndex((b) => b.type !== "text");
    at = i < 0 ? blocks.length : i;
  } else {
    const last = blocks.map((b) => b.type).lastIndexOf("question");
    at = last < 0 ? blocks.length : last + 1;
  }
  blocks.splice(at, 0, block);
}

const review = (id, en, es) => ({ id, en, es });

/**
 * Add one support to a COPY of the activity (same id; the input is never changed).
 * @returns {{ ok: boolean, optionId: string, activity: object, added: object[], review: {id,en,es}[] }}
 *   `added`: [{ id, kind: "text"|"question"|"organizer"|"setting", optionId, label }]; `review`: what to check.
 *   When the option is unavailable nothing changes and `review` holds the reason.
 */
export function addLanguageSupport(activity, optionId, deps = {}) {
  const option = OPTIONS.find((o) => o.id === optionId);
  if (!option) throw new RangeError(`Unknown language support: ${optionId}`);
  const draft = clone(activity);
  const ctx = readContext(draft, deps);
  const why = unavailable(option, draft, ctx);
  if (why)
    return {
      ok: false,
      optionId,
      activity: finish(draft),
      added: [],
      review: [review("", why.en, why.es)],
    };

  const added = [];
  const notes = [];
  let built = null;
  if (option.adds === "setting") {
    draft.supports.visuals = true;
    added.push({ id: "", kind: "setting", optionId, label: option.label });
    notes.push(
      review(
        "",
        "Pictures with new words are now on. They are the pictures already in your word list.",
        "Las imágenes con palabras nuevas están activadas. Son las imágenes que ya están en tu lista de palabras.",
      ),
    );
  } else {
    const fields = BUILD[optionId](ctx, draft);
    const block = { id: freshId(`ls-${optionId}`, takenIds(draft)), ...fields };
    built = block;
    insertAt(draft.blocks, option.place, block);
    withAdded(draft, [block.id]);
    added.push({ id: block.id, kind: fields.type, optionId, label: option.label });
    notes.push(
      review(
        block.id,
        `Read the added "${option.label.en}". It uses only this activity's own words and context. Edit or delete it if it does not fit.`,
        `Lee "${option.label.es}", que se agregó. Usa solo las palabras y el contexto propios de esta actividad. Edítalo o bórralo si no encaja.`,
      ),
    );
    if (fields.type === "question")
      notes.push(
        review(
          block.id,
          "This is a written task and is not scored. Add a sample answer or a rubric if you want students to compare.",
          "Esta es una tarea escrita y no se califica. Agrega una respuesta de ejemplo o una rúbrica si quieres que los estudiantes comparen.",
        ),
      );
  }
  if (ctx.bilingual && option.adds !== "setting")
    notes.push(
      review(
        "",
        "The Spanish wording is a draft and has not been reviewed by a native speaker. Have it checked before sharing.",
        "El texto en español es un borrador y no lo ha revisado un hablante nativo. Pide que lo revisen antes de compartir.",
      ),
    );

  const next = finish(draft);
  const out = built && next.blocks.find((b) => b.id === built.id);
  for (const key of ["text", "prompt", "frame", "hint", "prompts"]) {
    const want = Array.isArray(built?.[key]) ? built[key].map((x) => x.trim()) : built?.[key]?.trim();
    if (built && built[key] !== undefined && JSON.stringify(out?.[key]) !== JSON.stringify(want))
      throw new Error(`language support text was cut off by a size limit (${optionId}.${key})`);
  }
  const lost = questionsOf(activity).filter(
    (q) => JSON.stringify(questionsOf(next).find((n) => n.id === q.id)) !== JSON.stringify(q),
  );
  if (lost.length) throw new Error(`language support changed an existing question (${lost[0].id})`);
  const bad = newErrors(activity, next);
  if (bad.length) throw new Error(`language support made an invalid activity (${bad[0].code})`);
  return { ok: true, optionId, activity: next, added, review: notes };
}
