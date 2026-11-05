// One entry point that runs every family-mission rule on one page and returns the page model,
// its lesson context and its findings. Shared by the inventory builder and the gate.
import { answerChecks } from "./family-mission-answers.mjs";
import {
  bilingualChecks,
  countChecks,
  linkChecks,
  objectiveChecks,
  titleSourceChecks,
} from "./family-mission-checks.mjs";
import { contaminationHits, lessonStems, modelFamily } from "./family-mission-lexicon.mjs";
import { loadPage, readConfig, readSidecar, splitId } from "./family-mission-page.mjs";

/** Which model families a page's `data-topic` is allowed to serve. A topic that serves none of them is a mismatch. */
export const TOPIC_FAMILIES = {
  percent: ["percent"],
  ratios: ["ratio"],
  "coordinate-plane": ["coordinate", "geometry", "ratio"],
  statistics: ["data"],
  equations: ["equation"],
  inequalities: ["inequality", "equation"],
  exponents: ["expression"],
  expressions: ["expression"],
  properties: ["expression"],
  fractions: ["fraction"],
  area: ["geometry"],
  "surface-area": ["geometry"],
  volume: ["geometry"],
  decimals: ["number"],
  division: ["number"],
  factors: ["number"],
  "number-line": ["number"],
  fallback: ["other"],
};

const flatStrings = (o) =>
  typeof o === "string"
    ? [o]
    : o && typeof o === "object"
      ? Object.values(o).flatMap(flatStrings)
      : [];

/** Text that is on a page by design: the spiral review of earlier lessons and the lesson's review warm-up. */
function exemptStrings(config, sidecar) {
  const spiral = (sidecar?.v3?.spiral || []).flatMap((x) => [x.q?.en, x.exp?.en]);
  return [...spiral, ...flatStrings(config?.warmup), ...flatStrings(config?.reviewWarmup)].filter(
    (t) => t && t.length > 12,
  );
}

export function lessonContext(id) {
  const { baseId, session } = splitId(id);
  const config = readConfig(baseId);
  const sidecar = readSidecar(id);
  const title = sidecar?.sessionTitle || config?.title || "";
  const family = modelFamily({ id, unit: config?.unit, standard: config?.standard, title });
  const vocab = [...(config?.vocabulary || []), ...(sidecar?.vocabulary || [])].map((v) => v.term);
  return {
    id,
    baseId,
    session,
    config,
    sidecar,
    title,
    unit: Number(config?.unit) || 0,
    family: family.family,
    familyRule: family.rule,
    stems: lessonStems([title, config?.title, ...vocab]),
    exempt: exemptStrings(config, sidecar),
    outOfScope: Number(config?.unit) === 10,
  };
}

const finding = (rule, lesson, field, quote, detail) => ({
  rule,
  lesson,
  field,
  quote: String(quote).slice(0, 140),
  detail,
});

/** CONTAMINATION: text whose dominant concept belongs to another lesson family. */
export function contaminationChecks(page, ctx) {
  const out = [];
  const seen = new Set();
  for (const u of page.units) {
    for (const h of contaminationHits(u.en, ctx.family, ctx.stems, ctx.exempt)) {
      const key = h.quote.slice(-60); // the same sentence inside a parent block (card, bridge) is one finding
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(
        finding(
          "CONTAMINATION",
          page.id,
          u.field,
          h.quote,
          `${h.foreign} wording in a ${ctx.family} lesson (${h.signatures} signature${h.signatures > 1 ? "s" : ""}), no ${ctx.family} wording in the sentence`,
        ),
      );
    }
  }
  const allowed = TOPIC_FAMILIES[page.topic];
  if (ctx.family !== "other" && allowed && !allowed.includes(ctx.family))
    out.push(
      finding(
        "TOPIC_MISMATCH",
        page.id,
        "data-topic",
        page.topic,
        `the generator chose the "${page.topic}" visuals/banks for a ${ctx.family} lesson`,
      ),
    );
  return out;
}

/** Everything the gate and the inventory need for one page. */
export function analyzePage(id) {
  const page = loadPage(id);
  const ctx = lessonContext(id);
  const answers = answerChecks(page);
  const findings = [
    ...contaminationChecks(page, ctx),
    ...countChecks(page),
    ...bilingualChecks(page),
    ...titleSourceChecks(page, ctx),
    ...answers.findings,
    ...objectiveChecks(page, ctx),
    ...linkChecks(page),
  ].map((f) => ({ ...f, outOfScope: ctx.outOfScope }));
  return { page, ctx, findings, answerTally: answers.tally };
}

/** Stable identity of a finding for the baseline: rule, lesson, field, start of the quote. */
export const findingKey = (f) => `${f.rule}|${f.lesson}|${f.field}|${String(f.quote).slice(0, 60)}`;
