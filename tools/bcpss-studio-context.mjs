// Prints the facts an author needs for a unit: node tools/bcpss-studio-context.mjs <unitId>... | --list <grade> <subject>
import * as seed from "../data/bcpss-curriculum-seed.mjs";

const a = process.argv.slice(2);
if (a[0] === "--list") {
  for (const u of seed.BCPSS_UNITS.filter((x) => String(x.grade) === a[1] && x.subject === a[2]))
    console.log(u.id, "|", u.unit_title);
  process.exit(0);
}
for (const id of a) {
  const u = seed.BCPSS_UNITS.find((x) => x.id === id);
  if (!u) {
    console.log("UNKNOWN", id);
    continue;
  }
  const c = seed.UNIT_CONNECTIONS.find((x) => x.unit_id === id);
  const r = seed.UNIT_READINGS.find((x) => x.unit_id === id);
  const bp = seed.LANGUAGE_BLUEPRINTS.find((x) => x.id === c?.blueprint_id);
  console.log(
    `\n=== ${u.id}  Grade ${u.grade} ${u.subject} · ${u.curriculum_name} · Unit ${u.unit_number}: ${u.unit_title}`,
  );
  console.log("Summary:", u.unit_summary);
  console.log("Standards:", (u.core_standards || []).join(", "));
  console.log("Language move:", bp?.wida_klu, "-", bp?.move_name, "| syntax:", bp?.syntax_pattern);
  console.log("Existing unit frame:", c?.unit_example_frame);
  console.log(
    "Existing vocab (starting point, you may replace/extend):",
    (c?.tier2_tier3_vocab || [])
      .map((v) => `${v.term}${v.cognate_es ? " (" + v.cognate_es + ")" : ""}: ${v.kid_def}`)
      .join(" ; "),
  );
  console.log("Cross-subject bridge:", c?.cross_subject_bridge_note);
  if (r)
    console.log(
      `Existing reading "${r.title}" (${r.genre}), grades 3-4 version:\n${r.texts?.["3_4"]}`,
    );
}
