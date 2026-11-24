// Compact authoring context for a Writing Lab unit: unit facts + the authored studio's words, frames and texts.
// Usage: node tools/bcpss-writing-context.mjs <unitId>...
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as seed from "../data/bcpss-curriculum-seed.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "../db/seeds/bcpss/v2/units");
for (const id of process.argv.slice(2)) {
  const u = seed.BCPSS_UNITS.find((x) => x.id === id);
  if (!u) {
    console.log("UNKNOWN", id);
    continue;
  }
  const c = seed.UNIT_CONNECTIONS.find((x) => x.unit_id === id);
  const bp = seed.LANGUAGE_BLUEPRINTS.find((x) => x.id === c?.blueprint_id);
  console.log(
    `\n=== ${u.id}  Grade ${u.grade} ${u.subject} · ${u.curriculum_name} · Unit ${u.unit_number}: ${u.unit_title}`,
  );
  console.log("Summary:", u.unit_summary);
  console.log("Standards:", (u.core_standards || []).join(", "));
  console.log("Language move:", bp?.wida_klu, "-", bp?.move_name);
  const s = (await import(pathToFileURL(path.join(root, `${id}.mjs`)).href)).default;
  console.log("Essential question:", s.essential_question);
  console.log("Can do:", s.can_do.content, "|", s.can_do.language);
  console.log("Mentor:", s.mentor.text);
  console.log("Connectors:", s.connectors.join(", "));
  console.log(
    "Vocab:",
    s.vocab.map((v) => `${v.term}${v.icon ? " " + v.icon : ""} = ${v.def}`).join(" ; "),
  );
  console.log("Frames l3_4:", s.frames.l3_4.join(" | "));
  for (const a of s.activities) {
    const p = a.payload || {};
    const text = p.text || p.prompt || "";
    console.log(`- [${a.kind}] ${a.title}${text ? ": " + String(text).slice(0, 360) : ""}`);
  }
  if (s.exit_ticket)
    console.log("Exit ticket:", s.exit_ticket.prompt, "| model:", s.exit_ticket.model);
}
