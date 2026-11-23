// 108 bespoke BCPSS Social Studies classroom activities (3 per unit across 36 units).

import { buildActivitiesForSubject } from "../_builder.mjs";
import { SOCIAL_STUDIES_CONNECTIONS, SOCIAL_STUDIES_UNITS } from "../social_studies.mjs";

export const SOCIAL_STUDIES_ACTIVITIES = buildActivitiesForSubject(
  SOCIAL_STUDIES_UNITS,
  SOCIAL_STUDIES_CONNECTIONS,
);
