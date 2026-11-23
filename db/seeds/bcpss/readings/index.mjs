// Aggregates the authored vocabulary readings (K-8, three WIDA levels per unit).
// Validate a grade file with `node functions/bcpss-readings.test.mjs --file <grade file>`.
import { READINGS_1 } from "./grade-1.mjs";
import { READINGS_2 } from "./grade-2.mjs";
import { READINGS_3 } from "./grade-3.mjs";
import { READINGS_4 } from "./grade-4.mjs";
import { READINGS_5 } from "./grade-5.mjs";
import { READINGS_6 } from "./grade-6.mjs";
import { READINGS_7 } from "./grade-7.mjs";
import { READINGS_8 } from "./grade-8.mjs";
import { READINGS_K } from "./grade-k.mjs";

export const UNIT_READINGS = [
  ...READINGS_K,
  ...READINGS_1,
  ...READINGS_2,
  ...READINGS_3,
  ...READINGS_4,
  ...READINGS_5,
  ...READINGS_6,
  ...READINGS_7,
  ...READINGS_8,
];
