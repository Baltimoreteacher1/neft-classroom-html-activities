// 162 bespoke BCPSS Math classroom activities (3 per unit across 54 Reveal Math units).

import { buildActivitiesForSubject } from "../_builder.mjs";
import { MATH_CONNECTIONS, MATH_UNITS } from "../math.mjs";

export const MATH_ACTIVITIES = buildActivitiesForSubject(MATH_UNITS, MATH_CONNECTIONS);
