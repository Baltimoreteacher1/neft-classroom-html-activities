// Creation Quality Inspector: one pass over an activity that says what a teacher should fix, check or know before
// sharing it. It builds on validateActivity (its errors and warnings are translated into findings, never
// re-implemented) and adds the checks validate.js does not make. Pure, deterministic, no network.
//
//   inspectResource(activity, { format?: "student" | "print" | "word", copy? }) -> { ok, findings }
//   applyRepair(activity, repairId, where) -> { activity, applied, changes }       (see inspect-repairs.js)
//
// `format` picks which copy the answer-key check inspects: "student" (default) runs the student copy of the
// standalone HTML export (`copy` replaces export/html.js studentCopy, e.g. with the server's studentCopyFor);
// "print" and "word" render the paper student sheet. A finding's `repair`, when present, is a safe repair id.

import { normalizeActivity } from "../core/schema.js";
import { validateActivity } from "../core/validate.js";
import {
  checkAnswers,
  checkArithmetic,
  checkConfigs,
  checkControls,
  checkDirections,
  checkWorkspace,
} from "./inspect-checks.js";
import {
  checkCurriculumClaims,
  checkExposure,
  checkImages,
  checkMedia,
  checkSpanish,
  checkTerminology,
} from "./inspect-content.js";
import { howFor, validateEs } from "./inspect-i18n.js";

export { applyRepair, REPAIR_IDS } from "./inspect-repairs.js";

const FORMATS = ["student", "print", "word"];
const RANK = { fix: 0, check: 1, note: 2 };
/** validate.js warnings that are information for the teacher rather than something to act on. */
const NOTE_CODES = new Set([
  "check-spanish",
  "teacher-standards",
  "no-hint",
  "no-explanation",
  "long-prompt",
]);

/**
 * @returns {{ok: boolean, findings: Array<{id: string, severity: "fix"|"check"|"note", where: {blockId?: string, questionId?: string},
 *   message: {en: string, es: string}, how: {en: string, es: string}, repair?: string}>}}
 *   ok is true when no finding has severity "fix".
 */
export function inspectResource(input, opts = {}) {
  const format = FORMATS.includes(opts.format) ? opts.format : "student";
  const a = normalizeActivity(structuredClone(input ?? {}));
  const found = [];
  const add = (id, severity, where, message, how, repair) =>
    found.push({ id, severity, where, message, how, ...(repair ? { repair } : {}) });

  const v = validateActivity(a);
  const isQuestion = new Set(a.blocks.filter((b) => b.type === "question").map((b) => b.id));
  const blocked = new Set(v.errors.map((e) => e.blockId).filter(Boolean));
  for (const [list, base] of [
    [v.errors, "fix"],
    [v.warnings, "check"],
  ])
    for (const i of list) {
      const severity = base === "check" && NOTE_CODES.has(i.code) ? "note" : base;
      const where = i.blockId
        ? { blockId: i.blockId, ...(isQuestion.has(i.blockId) ? { questionId: i.blockId } : {}) }
        : {};
      add(
        `validate:${i.code}`,
        severity,
        where,
        { en: i.message, es: validateEs(i.message) },
        howFor(i.code, severity),
      );
    }

  checkDirections(a, add);
  checkAnswers(a, add, blocked);
  checkArithmetic(a, add);
  checkConfigs(a, add);
  checkControls(a, add);
  checkWorkspace(a, add, format);
  checkTerminology(a, add);
  checkImages(input, add);
  checkMedia(a, add);
  checkSpanish(a, add);
  checkCurriculumClaims(a, add);
  checkExposure(a, add, format, opts.copy);

  // An empty picture is repaired like an unusable one; the raw-source finding already covers the same block.
  const brokenAt = new Set(
    found.filter((f) => f.id === "broken-image").map((f) => f.where.blockId),
  );
  const findings = found
    .filter((f) => !(f.id === "validate:bad-image" && brokenAt.has(f.where.blockId)))
    .map((f) => (f.id === "validate:bad-image" ? { ...f, repair: "remove-invalid-image" } : f))
    .map((f, i) => [f, i])
    .sort((x, y) => RANK[x[0].severity] - RANK[y[0].severity] || x[1] - y[1])
    .map(([f]) => f);
  return { ok: !findings.some((f) => f.severity === "fix"), findings };
}
