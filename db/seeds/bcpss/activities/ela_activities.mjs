// 108 bespoke BCPSS ELA classroom activities (3 per unit across 36 Wit & Wisdom modules).

import { buildActivitiesForSubject } from "../_builder.mjs";
import { ELA_CONNECTIONS, ELA_UNITS } from "../ela.mjs";

export const ELA_ACTIVITIES = buildActivitiesForSubject(ELA_UNITS, ELA_CONNECTIONS);
