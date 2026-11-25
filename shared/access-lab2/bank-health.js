// Item bank health: how many items exist per domain, grade band, practice band and Key Language Use, how many are
// reviewed versus draft, and which cells of the coverage matrix sit below a FLOOR. Nothing below a floor publishes:
// a (domain, grade band) is publishable only when every practice band and every KLU in it meets its floor with
// REVIEWED items, and an item held by an analytics flag does not count. Draft items never count.
import { BANDS, DOMAINS, GRADE_BANDS, isObj, isStr, KLUS } from "./constants.js";
import { withDisclaimer } from "./disclaimer.js";
import { validateItem } from "./item.js";

/** Reviewed items required per (domain, grade band, practice band) and per (domain, grade band, KLU). */
export const DEFAULT_FLOORS = Object.freeze({ cell: 3, klu: 2 });

/** Item-analytics flags. The hold flags keep an item out of any publish until a human clears them. */
export const ITEM_FLAGS = Object.freeze([
  "too-easy",
  "too-hard",
  "ambiguous",
  "low-discrimination",
  "audio-issue",
]);
export const HOLD_FLAGS = Object.freeze(["ambiguous", "audio-issue"]);

function checkFlags(flags) {
  flags.forEach((f, i) => {
    if (
      !isObj(f) ||
      !isStr(f.itemId) ||
      !ITEM_FLAGS.includes(f.flag) ||
      !Number.isInteger(f.count) ||
      f.count < 1
    )
      throw new Error(`flags[${i}] must be { itemId, flag: ${ITEM_FLAGS.join("|")}, count >= 1 }`);
  });
}

/**
 * @param {{ items: object[], gradeBands?: string[], floors?: {cell:number,klu:number}, flags?: object[] }} opts
 * @returns a "bank-health" output: counts, gaps, per (domain, grade band) publish decisions and flagged items.
 */
export function bankHealth({
  items,
  gradeBands = GRADE_BANDS,
  floors = DEFAULT_FLOORS,
  flags = [],
}) {
  checkFlags(flags);
  const held = new Set(flags.filter((f) => HOLD_FLAGS.includes(f.flag)).map((f) => f.itemId));
  const valid = [];
  const invalid = [];
  for (const it of items) {
    const problems = validateItem(it);
    if (problems.length) invalid.push({ id: it?.id ?? "?", reason: problems[0] });
    else valid.push(it);
  }
  const counts = (pred) => {
    const mine = valid.filter(pred);
    const reviewed = mine.filter((it) => it.reviewState === "reviewed");
    return {
      reviewed: reviewed.filter((it) => !held.has(it.id)).length,
      held: reviewed.filter((it) => held.has(it.id)).length,
      draft: mine.filter((it) => it.reviewState === "draft").length,
      other: mine.filter((it) => !["reviewed", "draft"].includes(it.reviewState)).length,
    };
  };
  const cells = [];
  const kluCells = [];
  const gaps = [];
  const publish = [];
  for (const gradeBand of gradeBands)
    for (const domain of DOMAINS) {
      const here = (it) => it.domain === domain && it.gradeBand === gradeBand;
      let ok = true;
      for (const band of BANDS) {
        const c = {
          domain,
          gradeBand,
          band,
          ...counts((it) => here(it) && it.band === band),
          floor: floors.cell,
        };
        c.meets = c.reviewed >= floors.cell;
        if (!c.meets)
          gaps.push({
            scope: "band",
            domain,
            gradeBand,
            band,
            have: c.reviewed,
            need: floors.cell,
          });
        ok = ok && c.meets;
        cells.push(c);
      }
      for (const klu of KLUS) {
        const c = {
          domain,
          gradeBand,
          klu,
          ...counts((it) => here(it) && it.kluTags.includes(klu)),
          floor: floors.klu,
        };
        c.meets = c.reviewed >= floors.klu;
        if (!c.meets)
          gaps.push({ scope: "klu", domain, gradeBand, klu, have: c.reviewed, need: floors.klu });
        ok = ok && c.meets;
        kluCells.push(c);
      }
      publish.push({ domain, gradeBand, publishable: ok });
    }
  const itemFlags = flags.map((f) => ({ ...f, holds: HOLD_FLAGS.includes(f.flag) }));
  return withDisclaimer({
    kind: "bank-health",
    floors: { ...floors },
    totals: { items: valid.length, invalid: invalid.length, ...counts(() => true) },
    cells,
    kluCells,
    gaps,
    publish,
    publishBlocked: publish.filter((p) => !p.publishable).length > 0,
    itemFlags,
    invalid,
  });
}

/** The only items that may reach students: reviewed, not held, and inside a (domain, grade band) that meets every floor. */
export function publishableItems(items, health) {
  const ok = new Set(
    health.publish.filter((p) => p.publishable).map((p) => `${p.domain}|${p.gradeBand}`),
  );
  const held = new Set(health.itemFlags.filter((f) => f.holds).map((f) => f.itemId));
  return items.filter(
    (it) =>
      it.reviewState === "reviewed" &&
      !held.has(it.id) &&
      ok.has(`${it.domain}|${it.gradeBand}`) &&
      validateItem(it).length === 0,
  );
}
