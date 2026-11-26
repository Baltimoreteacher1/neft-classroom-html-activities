// From what ingest.js found to a real Studio activity. Only the teacher's own content is used: no answer, definition,
// distractor or sample is ever made up. Anything that would fail validation (a question with no answer marked, pairs
// that repeat) is left out of the activity and reported in review[] so nothing is silently dropped or guessed.
// Every activity goes through normalizeActivity and validateActivity (the Studio's only model and only validator).

import { newActivityId, pair } from "../core/differentiate-util.js";
import { KINDS, LIMITS, TEMPLATES, normalizeActivity } from "../core/schema.js";
import { runTransform } from "../core/transforms.js";
import { validateActivity } from "../core/validate.js";

const WHY = {
  noAnswer: pair(
    "Left out of the activity: no answer is marked. Mark the answer, then build again.",
    "Se dejó fuera de la actividad: no tiene respuesta marcada. Marca la respuesta y vuelve a crear.",
  ),
  dupPair: pair(
    "Left out of the activity: two pairs repeat the same word or meaning. Change one, then build again.",
    "Se dejó fuera de la actividad: dos parejas repiten la misma palabra o significado. Cambia una y vuelve a crear.",
  ),
  capped: pair(
    "Only the first groups and items fit in one sorting question. The rest were left out.",
    "Solo caben los primeros grupos y elementos en una pregunta de clasificar. El resto se dejó fuera.",
  ),
  empty: pair(
    "Nothing in this source can be used for that yet. Choose another kind of activity or add questions.",
    "Todavía no se puede usar nada de esta fuente para eso. Elige otro tipo de actividad o agrega preguntas.",
  ),
  badKind: pair("That is not a kind of activity.", "Eso no es un tipo de actividad."),
  few: pair(
    "Add at least one question (a game needs three).",
    "Agrega al menos una pregunta (un juego necesita tres).",
  ),
  generic: (message) =>
    pair(
      `The check found a problem: ${message}`,
      "La revisión encontró un problema. Ábrelo en el editor para corregirlo.",
    ),
};

const STEP_WORD = /^\s*(?:first|next|then|after that|finally|last|second|third)\b\s*,?\s*/i;
const cleanStep = (s) => {
  const t = s.replace(STEP_WORD, "").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : s;
};

/** One extracted item as Studio block(s), or { skip: reason } when it cannot be used as it stands. */
function toBlock(item, review) {
  const id = item.id;
  switch (item.type) {
    case "heading":
      return { id, type: "text", role: "heading", text: item.text };
    case "list":
      return { id, type: "text", role: "body", text: item.items.map((t) => `• ${t}`).join("\n") };
    case "table":
      return { id, type: "table", headers: item.headers, rows: item.rows };
    case "passage":
      return { id, type: "passage", title: "", text: item.text };
    case "vocab":
      return {
        id,
        type: "vocab",
        items: item.items.map(({ term, def, es }) => ({ term, def, es: es || "", example: "" })),
      };
    case "pairs":
      if (item.confidence !== "high") return { skip: WHY.dupPair };
      return {
        id,
        type: "question",
        format: "match",
        prompt: "Match each item to its partner.",
        pairs: item.pairs.map((p) => ({ left: p.left, right: p.right })),
      };
    case "sequence":
      return {
        id,
        type: "question",
        format: "order",
        prompt: "Put the steps in the correct order.",
        items: item.steps.map((s) => ({ text: cleanStep(s.text) })),
      };
    case "categories": {
      const cats = item.categories.slice(0, 6);
      const items = cats.flatMap((c, ci) =>
        c.items.map((text) => ({ text, category: `c${ci + 1}` })),
      );
      if (item.categories.length > 6 || items.length > LIMITS.items)
        review.push({ itemId: id, code: "capped", lines: item.lines, reason: WHY.capped });
      return {
        id,
        type: "question",
        format: "sort",
        prompt: "Sort each item into the right group.",
        categories: cats.map((c) => ({ label: c.label })),
        items: items.slice(0, LIMITS.items),
      };
    }
    case "question":
      return questionBlock(item);
    default:
      return { skip: null };
  }
}

function questionBlock(q) {
  const base = { id: q.id, type: "question", format: q.format, prompt: q.prompt };
  if (q.format === "choice") {
    if (!q.answer) return { skip: WHY.noAnswer };
    return { ...base, options: q.options, answer: q.answer };
  }
  if (q.format === "number")
    return {
      ...base,
      answer: q.answer,
      accept: q.accept || [],
      unit: q.unit || "",
      expr: q.expr || "",
    };
  if (q.format === "blank") return { ...base, text: q.text };
  return { ...base, kind: q.kind, sample: q.sample || "", rubric: [] };
}

const sourceNote = (prov) =>
  prov.type === "pasted" ? "Pasted by the teacher." : `Teacher upload: ${prov.name}`.slice(0, 200);

/** Plain-language review lines for what validateActivity still objects to. */
function validationReview(v) {
  return v.errors.map((e) => ({
    itemId: e.blockId || "",
    code: e.code,
    lines: null,
    reason: e.code === "few-questions" ? WHY.few : WHY.generic(e.message),
  }));
}

/**
 * Build an activity from an ingest result.
 * @param {object} result  what ingestText / ingestDocx returned (ok: true)
 * @param {{kind?: string, template?: string, suggestion?: string, transform?: string, include?: string[]}} selection
 *   `suggestion` is a suggestions[].id: it supplies kind, template and transform and limits the questions used to it.
 * @param {{context?: object, supports?: object, title?: string, newId?: () => string}} deps
 * @returns {{ ok: boolean, activity: object|null, review: object[], validation: object|null }}
 *   `activity.context.source` is { origin: "teacher", note } because the schema allows only those two fields.
 */
export function buildActivityFromIngest(result, selection = {}, deps = {}) {
  const review = [];
  const sug = result?.suggestions?.find((s) => s.id === selection.suggestion);
  const kind = selection.kind || sug?.kind || "interactive";
  const wanted = selection.template || sug?.template || "";
  const transform = selection.transform ?? sug?.transform ?? "";
  if (!result?.ok || !KINDS.includes(kind))
    return {
      ok: false,
      activity: null,
      review: [{ code: "bad-kind", reason: WHY.badKind }],
      validation: null,
    };
  const template = TEMPLATES[kind].some((t) => t.id === wanted) ? wanted : TEMPLATES[kind][0].id;
  const include = selection.include || (sug ? [...sug.uses] : null);

  const blocks = [];
  for (const item of result.blocks) {
    const keep = !include || include.includes(item.id) || (sug && item.type === "heading");
    if (!keep) continue;
    const b = toBlock(item, review);
    if (b.skip !== undefined) {
      if (b.skip)
        review.push({ itemId: item.id, code: "left-out", lines: item.lines, reason: b.skip });
      continue;
    }
    blocks.push(b);
  }
  if (!blocks.length)
    return {
      ok: false,
      activity: null,
      review: [...review, { code: "empty", reason: WHY.empty }],
      validation: null,
    };

  const prov = result.provenance || { name: "pasted text", type: "pasted" };
  const firstHeading = result.blocks.find((b) => b.type === "heading")?.text;
  const base =
    prov.type === "pasted" ? "" : prov.name.replace(/\.[^.]*$/, "").replace(/[_-]+/g, " ");
  const draft = normalizeActivity({
    id: (deps.newId || newActivityId)(),
    title: deps.title || firstHeading || base,
    kind,
    template,
    context: { ...deps.context, source: { origin: "teacher", note: sourceNote(prov) } },
    supports: deps.supports,
    blocks,
  });

  let activity = draft;
  if (transform) {
    const made = runTransform(draft, transform, { newId: deps.newId });
    review.push(
      ...made.notes.map((reason) => ({
        code: made.ran ? "transform" : "transform-skipped",
        reason,
      })),
    );
    if (made.ran) activity = made.activity;
  }
  const validation = validateActivity(activity);
  review.push(...validationReview(validation));
  return { ok: validation.ok, activity, review, validation };
}
