// 108 bespoke BCPSS Science classroom activities (3 per unit across 36 SABES 5E / IQWST units).

import { buildActivitiesForSubject } from "../_builder.mjs";
import { SCIENCE_CONNECTIONS, SCIENCE_UNITS } from "../science.mjs";

export const SCIENCE_ACTIVITIES = buildActivitiesForSubject(SCIENCE_UNITS, SCIENCE_CONNECTIONS);
