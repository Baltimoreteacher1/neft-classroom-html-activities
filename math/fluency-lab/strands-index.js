// Every strand generator, in one table that problem-bank.js spreads into its GENERATORS and problem-types/
// fam-strands.js reads. A strand file exports an object { generatorName(config, rng) -> problem item }.
import { STRANDS_6 } from "./strands-6.js";
import { STRANDS_345 } from "./strands-345.js";
import { STRANDS_K2 } from "./strands-k2.js";
import { STRANDS_78 } from "./strands-78.js";

export const STRANDS = { ...STRANDS_6, ...STRANDS_K2, ...STRANDS_345, ...STRANDS_78 };
