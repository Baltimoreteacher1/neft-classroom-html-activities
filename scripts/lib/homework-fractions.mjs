/** Stacked fractions on the family homework page (`assets/lib/stacked-fractions.js`, shared with the Learning Lab pages), read once for the shared bundle. */
import { readFileSync } from "node:fs";

export const HOMEWORK_FRACTIONS_JS = readFileSync(
  new URL("../../assets/lib/stacked-fractions.js", import.meta.url),
  "utf8",
);
