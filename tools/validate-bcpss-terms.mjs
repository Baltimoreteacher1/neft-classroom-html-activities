// Validates the shared term bank against schemas/term.schema.json (Ajv) plus bank-level rules:
// unique ids, every unit term present, a Spanish gloss or an explicit "pending" status, and a visible machine/human review status on every gloss.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import { STUDIO_LOADERS, STUDIO_UNIT_IDS } from "../db/seeds/bcpss/v2/index.mjs";
import { TERMS } from "../db/seeds/bcpss/v2/terms.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(path.join(root, "schemas/term.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);
const requireGlosses = process.argv.includes("--require-glosses");
const problems = [];
const add = (m) => problems.push(m);
const ids = new Set();
for (const t of TERMS) {
  if (ids.has(t.id)) add(`${t.id}: duplicate id`);
  ids.add(t.id);
  if (!validate(t))
    for (const e of validate.errors.slice(0, 3))
      add(`${t.id}: schema ${e.instancePath || "/"} ${e.message}`);
  if (requireGlosses && !t.glosses.es.text) add(`${t.id}: Spanish gloss missing`);
}
for (const id of STUDIO_UNIT_IDS) {
  const studio = (await STUDIO_LOADERS[id]()).default;
  for (const v of studio.vocab)
    if (
      !ids.has(
        v.term
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      )
    )
      add(`${id}: term "${v.term}" missing from the bank`);
}
console.log(
  `${TERMS.length} terms; Spanish glosses ${TERMS.filter((t) => t.glosses.es.text).length}; ${problems.length} problems`,
);
for (const p of problems.slice(0, 30)) console.log(` - ${p}`);
process.exit(problems.length ? 1 : 0);
