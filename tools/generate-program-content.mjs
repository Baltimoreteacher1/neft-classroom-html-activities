import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  FORM_TEMPLATES,
  LEARNING_MODULES,
  PATHWAYS,
  STRATEGIES,
} from "../access-practice-lab/src/program/content.js";

const root = resolve("access-practice-lab/content/program");
await mkdir(root, { recursive: true });
const files = {
  "forms.json": FORM_TEMPLATES,
  "strategies.json": { schema: "lp-strategy/1", strategies: STRATEGIES, pathways: PATHWAYS },
  "learning-modules.json": LEARNING_MODULES,
};
const check = process.argv.includes("--check"),
  stale = [];
for (const [name, value] of Object.entries(files)) {
  const expected = `${JSON.stringify(value, null, 2)}\n`,
    target = resolve(root, name);
  if (check) {
    if ((await readFile(target, "utf8").catch(() => "")) !== expected) stale.push(name);
  } else await writeFile(target, expected);
}
if (STRATEGIES.length < 25 || FORM_TEMPLATES.length !== 6 || LEARNING_MODULES.length !== 12)
  throw new Error("Program content counts do not meet the launch contract.");
if (check && stale.length) {
  console.error(`Generated program content is stale: ${stale.join(", ")}`);
  process.exitCode = 1;
} else
  console.log(
    `Generated/checked ${STRATEGIES.length} strategies, ${FORM_TEMPLATES.length} forms and ${LEARNING_MODULES.length} learning modules.`,
  );
