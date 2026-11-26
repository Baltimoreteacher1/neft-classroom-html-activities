// The build half of the creation assistant (see intent.js): turn a plan plus the teacher's own content into a valid
// activity using only existing studio machinery (buildActivity, the transforms, the support layer, the tiers and the
// verified math generators). Nothing is invented: meanings, passages, questions and answers come from the context or
// from the generators; anything that cannot be filled is reported in `review[]` as { code, en, es }.
//
// context: { request?, sourceText?, parsed?, vocab?, seed?, activity?, grade?, subject?, standards?, activityContext? }
//   request     the teacher's whole message; its first line is the request and later lines are pasted content
//   sourceText  pasted content that is not part of the message (a passage, "word - meaning" lines, questions)
//   vocab       known words with meanings [{term, def, es?, example?}]; seed: a curriculum lesson seed
//   activity    an existing activity (for versions and transforms)

import { makeVersions } from "../core/differentiate.js";
import { applySupports } from "../core/differentiate-supports.js";
import { clone, newActivityId, pair } from "../core/differentiate-util.js";
import { buildActivity } from "../core/generate.js";
import { mathSet, topicForUnit } from "../core/mathgen.js";
import { hashSeed } from "../core/mathgen/kit.js";
import { parseContent } from "../core/parse.js";
import { KINDS, TIERS, normalizeActivity, questionsOf } from "../core/schema.js";
import { runTransform } from "../core/transforms.js";
import { validateActivity } from "../core/validate.js";

const words = (s) =>
  String(s ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const TITLE_LABEL = {
  interactive: "Activity",
  worksheet: "Worksheet",
  game: "Game",
  check: "Quick Check",
};

/** First line = the request; later lines = pasted content. A long passage after a colon on line one is content too. */
export function splitRequest(raw) {
  const lines = String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const at = lines.findIndex((l) => l.trim());
  if (at < 0) return { head: "", body: "" };
  const head = lines[at].trim();
  const rest = lines
    .slice(at + 1)
    .join("\n")
    .trim();
  const colon = head.indexOf(":");
  if (colon > 0 && words(head.slice(colon + 1)) >= 25)
    return {
      head: head.slice(0, colon).trim(),
      body: `${head.slice(colon + 1).trim()}\n\n${rest}`.trim(),
    };
  return { head, body: rest };
}

export const cleanTerm = (t) =>
  t
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’.]+$/g, "")
    .replace(/^(?:and|y)\s+/i, "")
    .trim();
export const uniqueTerms = (list) => {
  const seen = new Set();
  return list.filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
};
export const validTerms = (list) =>
  list.length >= 2 && list.every((t) => words(t) <= 4 && t.length <= 48);

/** Three or more short lines with no punctuation or "word - meaning" shape: a bare word list. */
export function termsFromBody(body) {
  const lines = String(body ?? "")
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d{1,2}[).])\s+/, "").trim())
    .filter(Boolean);
  if (lines.length < 3 || lines.some((l) => /[:=|]|\s[-–—]\s|[.?!]$/.test(l))) return [];
  const list = uniqueTerms(lines.map(cleanTerm));
  return validTerms(list) ? list : [];
}

const ES_MATH = [
  [/raz[oó]n|proporci/i, "ratio"],
  [/fracci/i, "fraction"],
  [/decimal/i, "decimal"],
  [/porcentaje/i, "percent"],
  [/ecuaci/i, "equation"],
  [/desigualdad/i, "inequality"],
  [/expresi/i, "expression"],
  [/tasa/i, "rate"],
  [/volumen/i, "volume"],
  [/[aá]rea|per[ií]metro/i, "area"],
  [/media|mediana/i, "median"],
  [/coordenad/i, "coordinate"],
  [/entero/i, "integer"],
];

/** Verified math topic ids for a topic phrase ([] for anything that is not math). */
export function mathTopicsFor(topic, context = {}) {
  if (!topic) return [];
  const extra = ES_MATH.filter(([re]) => re.test(topic))
    .map(([, en]) => en)
    .join(" ");
  return topicForUnit({
    grade: context.grade,
    subject: context.subject || "Math",
    unitTitle: `${topic} ${extra}`,
    standards: context.standards || [],
  });
}

const entry = (v) => ({ term: v.term, def: v.def, es: v.es || "", example: v.example || "" });

/** Meanings come from the teacher's own "word - meaning" lines, then known vocab, then the lesson seed. Never invented. */
export function prepareSource(context = {}, { terms = [], mathTopics = [] } = {}) {
  const { body } = context.request ? splitRequest(context.request) : { body: "" };
  const text = [termsFromBody(body).length ? "" : body, context.sourceText]
    .filter(Boolean)
    .join("\n\n");
  const parsed = context.parsed || parseContent(text);
  const known = new Map();
  for (const v of [...parsed.vocab, ...(context.vocab || []), ...(context.seed?.vocab || [])]) {
    const key = String(v?.term ?? "")
      .toLowerCase()
      .trim();
    if (key && v.def && !known.has(key)) known.set(key, entry(v));
  }
  const review = [];
  const missing = [];
  let vocab = parsed.vocab;
  if (terms.length) {
    vocab = [];
    for (const t of terms) {
      const v = known.get(t.toLowerCase());
      if (v) vocab.push(v);
      else missing.push(t);
    }
    if (missing.length)
      review.push({
        code: "no-meaning",
        en: `No meaning was found for: ${missing.join(", ")}. They were left out. Add "word - meaning" lines for them and I will include them.`,
        es: `No se encontró el significado de: ${missing.join(", ")}. Se dejaron fuera. Agrega líneas "palabra - significado" y las incluiré.`,
      });
  } else if (!vocab.length)
    vocab = (context.vocab || []).filter((v) => v?.term && v?.def).map(entry);
  const useMath = mathTopics.length > 0 && !parsed.problems.length && !parsed.questions.length;
  return {
    parsed: { ...parsed, vocab },
    vocab,
    missing,
    useMath,
    mathTopics: useMath ? mathTopics : [],
    review,
    supplied: Boolean(
      vocab.length ||
      parsed.problems.length ||
      parsed.questions.length ||
      parsed.passage ||
      parsed.sequence.length ||
      parsed.categories.length,
    ),
  };
}

// ── review items ────────────────────────────────────────────────────────────

const NEEDS_ES = new Map([
  [
    "A quick check works best with at least three questions. Add a few words, questions or problems.",
    "Una revisión rápida funciona mejor con al menos tres preguntas. Agrega algunas palabras, preguntas o problemas.",
  ],
  [
    "A game needs at least three questions. Add vocabulary with meanings, or questions with answers.",
    "Un juego necesita al menos tres preguntas. Agrega vocabulario con significados, o preguntas con respuestas.",
  ],
  [
    "Add your lesson words, questions or a short text, or choose a lesson, and we will build the activity.",
    "Agrega las palabras de tu lección, preguntas o un texto corto, o elige una lección, y construiremos la actividad.",
  ],
  [
    "Mark the correct answer for each question you typed (put * before it).",
    "Marca la respuesta correcta de cada pregunta que escribiste (pon * antes de ella).",
  ],
  [
    "Add a sample answer to the written-response question so students know what good looks like.",
    "Agrega una respuesta de ejemplo a la pregunta de respuesta escrita para que los estudiantes sepan cómo se ve una buena respuesta.",
  ],
]);
const NOTE_ES = [
  [
    /^Question ".*": mark the correct answer/,
    'Una pregunta no tiene respuesta marcada: pon * antes de la correcta, o agrega "Answer: B".',
  ],
  [
    /^Could not use:/,
    'Una parte del texto no se pudo usar. Escribe las palabras como "palabra - significado", una por línea.',
  ],
  [/^Add a few more problems/, "Agrega algunos problemas más para una práctica completa."],
];

/** English parse/generate notes as review items with real Spanish. */
export function reviewFromNotes(list, code = "needs") {
  return list.map((en) => ({
    code,
    en,
    es:
      NEEDS_ES.get(en) ||
      NOTE_ES.find(([re]) => re.test(en))?.[1] ||
      "Hay algo que revisar antes de compartir; consulta el mensaje en inglés.",
  }));
}

const ES_CODE = {
  "few-questions": "Agrega más preguntas: la actividad no tiene suficientes para este tipo.",
  "no-answer": "Marca cuál es la respuesta correcta de una pregunta.",
  "few-options": "Una pregunta necesita más opciones de respuesta.",
  "dup-option": "Dos opciones dicen lo mismo, así que más de una podría ser correcta.",
  "wrong-math": "La clave de respuestas de una pregunta no coincide con su cálculo.",
};

/** Blocking validation errors as review items. */
export function reviewFromValidation(result) {
  return result.errors.map((e) => ({
    code: `invalid:${e.code}`,
    blockId: e.blockId,
    en: `A check found a problem that blocks sharing: ${e.message}`,
    es:
      ES_CODE[e.code] ||
      `Una revisión encontró un problema que impide compartir (código: ${e.code}).`,
  }));
}

/** Deterministic positional block ids and a fresh activity id; the result is a fixed point of normalizeActivity. */
export function stableIds(activity, deps = {}, prefix = "b") {
  const a = clone(activity);
  a.blocks = a.blocks.map((b, i) => ({ ...b, id: `${prefix}${i + 1}` }));
  a.id = (deps.newId || newActivityId)();
  return normalizeActivity(a);
}

/** Apply the access settings the teacher asked for through the studio's own support layer (it warns, never fakes). */
export function applyRequested(activity, { wida = 0, supports = [] }) {
  const a = clone(activity);
  const low = wida >= 1 && wida <= 2;
  const want = new Set(supports);
  const o = { hints: true };
  if (wida) o.wida = wida;
  if (want.has("readAloud") || low) o.readAloud = true;
  if (want.has("chunk") || low) o.chunk = true;
  if (want.has("visuals") || low) o.visuals = true;
  if (want.has("spanish")) o.spanish = true;
  if (want.has("frames") || (wida >= 1 && wida <= 4)) o.frames = "full";
  const { warnings } = applySupports(a, o);
  return {
    activity: normalizeActivity(a),
    review: warnings.map((w) => ({ code: "support-warning", ...w })),
  };
}

// ── building ────────────────────────────────────────────────────────────────

const missing = (code, en, es) => ({ activity: null, review: [{ code, en, es }], versions: [] });
const mathSeed = (plan, deps) =>
  Number.isInteger(deps.seed)
    ? deps.seed
    : hashSeed("intent", plan.topic, plan.mathTopics.join(","), plan.kind);

function runExisting(plan, base, deps) {
  const res = runTransform(base, plan.transform, { newId: deps.newId, template: plan.template });
  const code = res.ran ? "transform-note" : "transform-blocked";
  return {
    activity: res.ran ? res.activity : null,
    review: res.notes.map((n) => ({ code, ...n })),
    versions: [],
  };
}

/** buildActivity over the prepared source. `activity` is always the built draft (it may have no questions). */
export function buildFromSource(plan, context, deps, prep) {
  const mathQuestions = prep.useMath
    ? mathSet({
        topics: prep.mathTopics,
        grade: context.grade,
        count: plan.mathCount || plan.count || (plan.kind === "check" ? 4 : 8),
        seed: mathSeed(plan, deps),
      })
    : [];
  const base = context.activityContext || {};
  const built = buildActivity({
    kind: plan.kind,
    template: plan.template,
    parsed: prep.parsed,
    seed: plan.terms.length ? null : context.seed || null,
    context: {
      ...base,
      grade: context.grade || base.grade || "",
      subject: prep.useMath ? "Math" : context.subject || base.subject || "",
      source: {
        origin: prep.supplied || context.seed ? "teacher" : "idea",
        note: prep.supplied
          ? "Built from the content you gave the studio."
          : "Built from your request with verified practice problems. Check every answer.",
      },
    },
    supports: { wida: 0 },
    title: plan.topic ? `${cap(plan.topic)} ${TITLE_LABEL[plan.kind]}` : "",
    count: plan.count || undefined,
    mathQuestions,
  });
  const review = [...prep.review, ...reviewFromNotes(built.needs)];
  if (prep.useMath)
    review.push({
      code: "generated-math",
      en: "Practice problems were made by the verified math generators and every answer was calculated, not copied.",
      es: "Los problemas de práctica los hicieron los generadores de matemáticas verificados y cada respuesta se calculó, no se copió.",
    });
  return { activity: built.activity, review };
}

function buildNew(plan, context, deps, prep) {
  const built = buildFromSource(plan, context, deps, prep);
  const ok = questionsOf(built.activity).length > 0;
  return { ...built, activity: ok ? stableIds(built.activity, deps) : null };
}

const NO_PASSAGE = pair(
  "A speaking or writing task needs a reading passage of about 25 words or more. None was given.",
  "Una tarea de expresión oral o de escritura necesita un texto de lectura de unas 25 palabras o más. No se dio ninguno.",
);

/** The single build path: buildFromPlan uses it, and interpretRequest uses it as a dry run so `ok` never lies. */
export function assemblePlan(plan, context, deps = {}) {
  const existing = context.activity ? normalizeActivity(context.activity) : null;
  const prep = prepareSource(context, { terms: plan.terms, mathTopics: plan.mathTopics });
  let out;
  if (plan.transform && existing) out = runExisting(plan, existing, deps);
  else if (plan.transform) {
    if (!prep.parsed.passage) out = missing("no-passage", NO_PASSAGE.en, NO_PASSAGE.es);
    else {
      const first = buildNew(
        { ...plan, kind: "interactive", template: "interactive-reading", count: 8 },
        context,
        deps,
        prep,
      );
      out = first.activity ? runExisting(plan, first.activity, deps) : first;
      out.review = [...first.review.filter((r) => r.code !== "needs"), ...out.review];
    }
  } else if (plan.kind) out = buildNew(plan, context, deps, prep);
  else if (existing) out = { activity: existing, review: [], versions: [] };
  else
    out = missing(
      "no-activity",
      "There is no activity to make versions of yet.",
      "Todavía no hay una actividad de la cual hacer versiones.",
    );
  if (!out.activity) return { activity: null, review: out.review, versions: [], prep };
  let { activity, review } = out;
  if (plan.kind || plan.transform) {
    const sup = applyRequested(activity, plan);
    activity = sup.activity;
    review = [...review, ...sup.review];
  }
  const check = validateActivity(activity);
  if (!check.ok)
    return {
      activity: null,
      review: [...review, ...reviewFromValidation(check)],
      versions: [],
      prep,
    };
  const versions = plan.versions.length
    ? makeVersions(activity, plan.versions, deps).map(
        ({ tier, activity: a, changes, warnings }) => ({
          tier,
          activity: a,
          changes,
          warnings,
        }),
      )
    : [];
  for (const v of versions)
    review.push(...v.warnings.map((w) => ({ code: "version-warning", tier: v.tier, ...w })));
  return { activity, review, versions, prep };
}

const TRANSFORMS = new RegExp(`^(?:speakingTask|writingTask|exitTicket|vocabPractice|toKind:(?:${KINDS.join("|")}))$`);

/** A plan from outside is untrusted: keep only the fields this module reads, with safe types. */
export function cleanPlan(plan) {
  const list = (v) => (Array.isArray(v) ? v.map(String).slice(0, 40) : []);
  return {
    kind: KINDS.includes(plan.kind) ? plan.kind : "",
    template: String(plan.template || ""),
    transform: TRANSFORMS.test(String(plan.transform)) ? String(plan.transform) : "",
    count: Math.max(0, Math.min(40, Math.floor(Number(plan.count)) || 0)),
    topic: String(plan.topic || "").slice(0, 80),
    terms: list(plan.terms),
    supports: list(plan.supports),
    versions: list(plan.versions).filter((t) => TIERS.includes(t)),
    wida: Math.max(0, Math.min(6, Math.floor(Number(plan.wida)) || 0)),
    mathTopics: list(plan.mathTopics),
  };
}

/**
 * Build the first version of what the plan describes, from the context's source content only.
 * @param {object} plan from interpretRequest; context: see the top of this file; deps: { newId, seed }
 * @returns {{ activity: object|null, review: {code,en,es}[], versions: {tier, activity, changes, warnings}[] }}
 *  `activity` always passes normalizeActivity and validateActivity (ok), or is null with the reasons in `review`.
 */
export function buildFromPlan(plan, context = {}, deps = {}) {
  if (!plan || typeof plan !== "object")
    return missing(
      "no-plan",
      "There is no plan to build. Describe what you want first.",
      "No hay un plan para construir. Primero describe lo que quieres.",
    );
  const { activity, review, versions } = assemblePlan(cleanPlan(plan), context, deps);
  return { activity, review, versions };
}
