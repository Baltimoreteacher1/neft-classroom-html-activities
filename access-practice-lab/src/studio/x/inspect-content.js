// Content-level checks for the Creation Quality Inspector: vocabulary spelling, pictures, audio, Spanish,
// curriculum claims and answer-key exposure. Each one calls add(id, severity, where, {en, es}, {en, es}, repairId?).

import { marksOf } from "../core/check.js";
import { safeImageSrc } from "../core/schema.js";
import { studentCopy } from "../export/html.js";
import { renderWorksheetParts } from "../print/worksheet.js";
import { T, at, escapeRe, proseOf, questionsOf } from "./inspect-text.js";

// ── terminology ────────────────────────────────────────────────────────────────

const termRe = (term) =>
  new RegExp(
    `(?<![\\p{L}\\p{N}])${term.trim().split(/\s+/).map(escapeRe).join("[\\s\\-]+")}(?![\\p{L}\\p{N}])`,
    "giu",
  );

/** Vocabulary terms (spelling as the vocab block has it); a term listed twice with different case is left out. */
export function vocabTerms(a) {
  const seen = new Map();
  for (const b of a.blocks)
    if (b.type === "vocab")
      for (const v of b.items) {
        const t = v.term.trim();
        if (t.length < 3) continue;
        const k = t.toLowerCase();
        seen.set(k, seen.has(k) && seen.get(k) !== t ? null : t);
      }
  return [...seen.values()].filter(Boolean);
}

/** Occurrences of `term` in `text` spelled differently from the vocab block: [{ index, found }]. */
export function termVariants(text, term) {
  const out = [];
  let offset = 0;
  for (const part of text.split(/(\[\[[^\]]+\]\])/)) {
    if (!part.startsWith("[[")) {
      for (const m of part.matchAll(termRe(term))) {
        const before = text.slice(0, offset + m.index);
        const start = !before.trim() || /[.!?]\s*$/.test(before) || /\n\s*$/.test(before);
        const capital = term[0].toUpperCase() + term.slice(1);
        if (m[0] !== term && !(start && m[0] === capital))
          out.push({ index: offset + m.index, found: m[0] });
      }
    }
    offset += part.length;
  }
  return out;
}

export function checkTerminology(a, add) {
  const terms = vocabTerms(a);
  if (!terms.length) return;
  for (const b of a.blocks) {
    if (b.type === "vocab") continue;
    for (const term of terms) {
      const hit = proseOf(b).flatMap((s) => termVariants(s, term))[0];
      if (hit)
        add(
          "inconsistent-terminology",
          "check",
          b.type === "question" ? at(b) : { blockId: b.id },
          T(
            `The vocabulary word "${term}" is written "${hit.found}" here.`,
            `La palabra de vocabulario «${term}» aparece escrita «${hit.found}» aquí.`,
          ),
          T(
            "Use the same spelling and capital letters as the vocabulary list.",
            "Use la misma ortografía y mayúsculas que la lista de vocabulario.",
          ),
          "normalize-terminology",
        );
    }
  }
}

// ── pictures, audio, Spanish, curriculum claims ────────────────────────────────

/** Looks at the RAW activity: normalizeActivity erases an unusable source, so only the raw input still has it. */
export function checkImages(raw, add) {
  const bad = (src) => typeof src === "string" && src.trim() && !safeImageSrc(src);
  const why = (src) =>
    /^(?:https?:)?\/\//i.test(src.trim())
      ? T("it points to another website", "apunta a otro sitio web")
      : /^data:/i.test(src.trim())
        ? T("it is not a small PNG, JPG, WebP or GIF", "no es un PNG, JPG, WebP o GIF pequeño")
        : T(
            "it is not a PNG, JPG, WebP, GIF or a path on this site",
            "no es un PNG, JPG, WebP, GIF ni una ruta de este sitio",
          );
  const report = (blockId, src, where) => {
    const r = why(src);
    add(
      "broken-image",
      "fix",
      { blockId, ...where },
      T(`A picture cannot be shown: ${r.en}.`, `No se puede mostrar una imagen: ${r.es}.`),
      T(
        "Remove the picture and add it again from your device. The repair removes it and leaves a teacher note.",
        "Quite la imagen y vuelva a agregarla desde su dispositivo. La reparación la quita y deja una nota para el maestro.",
      ),
      "remove-invalid-image",
    );
  };
  for (const b of raw?.blocks || []) {
    if (!b || typeof b !== "object") continue;
    if (b.type === "image" && bad(b.src)) report(b.id, b.src, {});
    if (b.type === "question" && bad(b.image?.src)) report(b.id, b.image.src, { questionId: b.id });
    if (b.type === "vocab")
      for (const v of Array.isArray(b.items) ? b.items : [])
        if (bad(v?.image?.src)) report(b.id, v.image.src, {});
  }
}

export function checkMedia(a, add) {
  for (const b of a.blocks)
    if (b.type === "audio" && !b.say.trim())
      add(
        "audio-no-text",
        "fix",
        { blockId: b.id },
        T(
          "This audio block has no text to read aloud and no transcript.",
          "Este bloque de audio no tiene texto para leer en voz alta ni transcripción.",
        ),
        T(
          "Type the words that should be read. The same text is shown as the transcript.",
          "Escriba las palabras que se deben leer. El mismo texto se muestra como transcripción.",
        ),
      );
}

export function checkSpanish(a, add) {
  const items = a.blocks.flatMap((b) => (b.type === "vocab" ? b.items.map((v) => ({ b, v })) : []));
  const filled = items.filter((x) => x.v.es.trim());
  if (filled.length && filled.length < items.length)
    for (const b of new Set(items.filter((x) => !x.v.es.trim()).map((x) => x.b)))
      add(
        "incomplete-spanish",
        "check",
        { blockId: b.id },
        T(
          "Some vocabulary words have Spanish and others do not.",
          "Algunas palabras de vocabulario tienen español y otras no.",
        ),
        T(
          "Add the missing Spanish words, or clear the others so the list is consistent.",
          "Agregue las palabras en español que faltan o borre las demás para que la lista sea coherente.",
        ),
      );
}

export function checkCurriculumClaims(a, add) {
  const verified = a.context.source.origin === "curriculum" && Boolean(a.context.unitId);
  const claimed = a.context.standards.filter((s) => s.origin === "curriculum");
  if (claimed.length && !verified)
    add(
      "unsupported-curriculum-claim",
      "fix",
      {},
      T(
        `Standards ${claimed.map((s) => s.code).join(", ")} are labeled as official curriculum, but the activity has no curriculum unit behind them.`,
        `Los estándares ${claimed.map((s) => s.code).join(", ")} se marcan como currículo oficial, pero la actividad no tiene una unidad del currículo que los respalde.`,
      ),
      T(
        "Choose the unit from the curriculum, or relabel the standards as your own choice.",
        "Elija la unidad del currículo o marque los estándares como elección suya.",
      ),
    );
  else if (a.context.source.origin === "curriculum" && !a.context.unitId && !a.lineage)
    add(
      "unsupported-curriculum-claim",
      "check",
      {},
      T(
        "The source says this came from the curriculum, but no unit is recorded.",
        "La fuente dice que esto viene del currículo, pero no se registró ninguna unidad.",
      ),
      T(
        "Choose the curriculum unit, or set the source to your own.",
        "Elija la unidad del currículo o marque la fuente como propia.",
      ),
    );
}

// ── answer-key exposure ────────────────────────────────────────────────────────

/** Does this student-copy question still carry its key? (`orig` is the same question before copying.) */
function keyPresent(q, orig) {
  const same = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  switch (q.format) {
    case "choice":
    case "hotspot":
      return Boolean(q.answer);
    case "multi":
      return q.answers.length > 0;
    case "match":
      return q.pairs.some((p, i) => p.right === orig.pairs[i]?.right);
    case "sort":
      return q.items.some((i) => i.category);
    case "order":
      return same(
        q.items.map((i) => i.id),
        orig.items.map((i) => i.id),
      );
    case "blank":
    case "identify":
      return marksOf(q.text).some((m) => m.answers.length);
    case "number":
      return Boolean(q.answer || q.expr || q.accept.length);
    case "short":
      return Boolean(q.sample || q.rubric.length);
    case "numberline":
      return Boolean(q.answer);
    case "build":
      return same(q.words, orig.words) || q.accept.length > 0;
    case "error":
      return Boolean(q.errorStep || q.fixAnswer);
    case "fillTable":
      return q.rows.some((r) => r.some((c) => c && typeof c === "object" && c.answer));
    case "plot":
      return q.points.length > 0;
    default:
      return false;
  }
}

export function checkExposure(a, add, format, copyFn = studentCopy) {
  const leak = (id, where, en, es) =>
    add(
      id,
      "fix",
      where,
      T(en, es),
      T(
        "Share the student copy or the printable sheet, never the teacher copy.",
        "Comparta la copia del estudiante o la hoja imprimible, nunca la copia del maestro.",
      ),
    );
  if (format === "student") {
    const copy = copyFn(a);
    if ((copy.notes?.teacher || "").trim() || (copy.notes?.misconceptions || []).length)
      leak(
        "answer-key-exposure",
        {},
        "The student copy still carries the teacher notes.",
        "La copia del estudiante todavía incluye las notas del maestro.",
      );
    for (const b of copy.blocks.filter((x) => x.type === "note"))
      leak(
        "answer-key-exposure",
        { blockId: b.id },
        "The student copy still carries a teacher note block.",
        "La copia del estudiante todavía incluye un bloque de nota del maestro.",
      );
    if (copy.context?.source?.note?.trim())
      leak(
        "answer-key-exposure",
        {},
        "The student copy still carries the teacher's source note.",
        "La copia del estudiante todavía incluye la nota de fuente del maestro.",
      );
    if (a.kind === "worksheet") {
      const orig = new Map(questionsOf(a).map((q) => [q.id, q]));
      const open = questionsOf(copy).filter(
        (q) => keyPresent(q, orig.get(q.id) || q) || q.explanation || q.hint || q.misconception,
      );
      if (open.length)
        leak(
          "answer-key-exposure",
          {},
          `The worksheet's student copy still carries the answer key for ${open.length} of ${orig.size} questions (the standalone HTML export keeps answers so the player can check them).`,
          `La copia del estudiante de la hoja todavía incluye la clave de ${open.length} de ${orig.size} preguntas (la exportación HTML independiente conserva las respuestas para que el reproductor las revise).`,
        );
    }
    return;
  }
  // print and Word read the same paper model: the student part may not print any teacher-only wording.
  const html = renderWorksheetParts(a, { part: "student", lang: "en" }).html;
  const visible = proseOf(
    a.blocks
      .filter((b) => b.type !== "note")
      .map((b) => ({ ...b, hint: "", explanation: "", misconception: "", sample: "", rubric: [] })),
  ).join("\n");
  const secret = [
    a.notes.teacher,
    ...a.notes.misconceptions,
    ...a.blocks.flatMap((b) =>
      b.type === "note"
        ? [b.text]
        : b.type === "question"
          ? [b.explanation, b.hint, b.misconception, b.sample, ...(b.rubric || [])]
          : [],
    ),
  ];
  const escaped = (s) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  for (const s of secret
    .map((x) => String(x ?? "").trim())
    .filter((x) => x.length >= 8 && !/[{}^_*]/.test(x) && !visible.includes(x)))
    if (html.includes(escaped(s)))
      leak(
        "answer-key-exposure",
        {},
        `The printed student sheet contains teacher-only text: "${s.slice(0, 40)}".`,
        `La hoja impresa del estudiante contiene texto solo para el maestro: «${s.slice(0, 40)}».`,
      );
}
