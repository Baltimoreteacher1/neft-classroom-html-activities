// Rows for the Journey inventory: one per bank activity, with strand, Key Language Use, supports, the recommended
// mission and step (the inverse of src/journey/resources.js) and the next activity in teaching order.
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { LAB_DIR } from "./access-lab-content.mjs";

const SUPPORT_FIELDS = [
  ["frames", "frames"],
  ["wordBank", "word bank"],
  ["hint", "hint"],
  ["support", "support note"],
  ["vocabulary", "vocabulary"],
  ["models", "model"],
  ["picture", "picture"],
  ["chart", "chart"],
  ["table", "table"],
];

/** The support features an activity record carries (what the activity page can show when help is opened). */
export function supportsOf(activity) {
  const has = SUPPORT_FIELDS.filter(([k]) => {
    const v = activity[k];
    return Array.isArray(v)
      ? v.length
      : Boolean(v) && (typeof v !== "object" || Object.keys(v).length);
  }).map(([, label]) => label);
  return has.length ? has.join(", ") : "none";
}

const verifiesOf = (a) =>
  a.domain === "Model-Test"
    ? "test item; independent by design"
    : `supported by default; mode=independent shows no help${a.domain === "Speaking" && a.type === "multipleChoice" ? " (warm-up, not speaking evidence)" : ""}`;

const { keyUseForSkill } = await import(pathToFileURL(join(LAB_DIR, "src/lang/purpose.js")).href);

/** One row per bank activity. `R` = src/journey/resources.js, `D` = resources-data.js. */
export function activityRows(index, bank, R, D) {
  const full = new Map();
  const strand = new Map();
  for (const { band, domain, data } of bank)
    for (const [level, L] of Object.entries(data.levels || {})) {
      for (const a of L.activities || []) full.set(`${band}|${domain}|${level}|${a.id}`, a);
      for (const c of L.categories || [])
        for (const id of c.activityIds || [])
          if (!strand.has(`${band}|${domain}|${level}|${id}`))
            strand.set(`${band}|${domain}|${level}|${id}`, c.title);
    }
  const rows = [];
  for (const band of Object.keys(index.bands))
    for (const [domain, Dm] of Object.entries(index.bands[band].domains)) {
      const levels = Object.keys(Dm.levels);
      levels.forEach((level, li) => {
        const list = Dm.levels[level].activities;
        list.forEach(([id, title, type, skill], i) => {
          const key = `${band}|${domain}|${level}|${id}`;
          const klu = keyUseForSkill(skill);
          const text = `${skill} ${title}`.toLowerCase();
          const next = list[i + 1]?.[0] || Dm.levels[levels[li + 1]]?.activities[0]?.[0] || "";
          const test = domain === "Model-Test";
          rows.push({
            band,
            domain,
            level,
            id,
            title,
            type,
            skill: skill || title,
            strand: strand.get(key) || "(unlisted)",
            klu: klu || "none",
            kluSource: klu ? "inferred from skill text" : "none named",
            supports: supportsOf(full.get(key) || {}),
            mission: test ? "" : R.missionFor(klu, text),
            step: test ? "" : R.stepFor(domain, level),
            features: Object.keys(D.FEATURE_PATTERNS).filter((f) =>
              D.FEATURE_PATTERNS[f].test(text),
            ),
            verifies: verifiesOf({ domain, type }),
            next,
          });
        });
      });
    }
  return rows;
}
