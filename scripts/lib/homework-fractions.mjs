/** Stacked fractions on the family homework page (`homework-fractions.runtime.js`), read once for the shared bundle. */
import { readFileSync } from "node:fs";

export const HOMEWORK_FRACTIONS_JS = readFileSync(
  new URL("./homework-fractions.runtime.js", import.meta.url),
  "utf8",
);
