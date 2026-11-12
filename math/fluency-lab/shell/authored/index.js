// Authored explanation overrides, keyed "grade:skillId". A skill without an entry is taught from the lab's
// validated data (see ../content.js). Each grade band owns one file so authoring can proceed in parallel.
import { BAND as K2 } from "./band-k2.js";
import { BAND as G35 } from "./band-35.js";
import { BAND as G68 } from "./band-68.js";
import { ratios6 } from "./ratios-6.js";

export const AUTHORED = { ...K2, ...G35, ...G68, "6:ratios": ratios6 };
