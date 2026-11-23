// Canonical BCPSS Curriculum-to-Language Ecosystem seed aggregator.
// Re-exports all modular K-8 BCPSS datasets for both Neon seeding and Cloudflare Pages fallback.

export {
  CURRICULUM_BY_GRADE_SUBJECT,
  GRADES,
  LANGUAGE_BLUEPRINTS,
  SUBJECTS,
} from "../db/seeds/bcpss/blueprints.mjs";

import { UNIT_READINGS } from "../db/seeds/bcpss/readings/index.mjs";
import { ELA_ACTIVITIES } from "../db/seeds/bcpss/activities/ela_activities.mjs";
import { MATH_ACTIVITIES } from "../db/seeds/bcpss/activities/math_activities.mjs";
import { SCIENCE_ACTIVITIES } from "../db/seeds/bcpss/activities/science_activities.mjs";
import { SOCIAL_STUDIES_ACTIVITIES } from "../db/seeds/bcpss/activities/social_studies_activities.mjs";
import { ELA_CONNECTIONS, ELA_UNITS } from "../db/seeds/bcpss/ela.mjs";
import { FAMILY_CARDS } from "../db/seeds/bcpss/family_cards.mjs";
import { MATH_CONNECTIONS, MATH_UNITS } from "../db/seeds/bcpss/math.mjs";
import { SCIENCE_CONNECTIONS, SCIENCE_UNITS } from "../db/seeds/bcpss/science.mjs";
import {
  SOCIAL_STUDIES_CONNECTIONS,
  SOCIAL_STUDIES_UNITS,
} from "../db/seeds/bcpss/social_studies.mjs";

export const BCPSS_UNITS = [
  ...ELA_UNITS,
  ...MATH_UNITS,
  ...SCIENCE_UNITS,
  ...SOCIAL_STUDIES_UNITS,
];

export const UNIT_CONNECTIONS = [
  ...ELA_CONNECTIONS,
  ...MATH_CONNECTIONS,
  ...SCIENCE_CONNECTIONS,
  ...SOCIAL_STUDIES_CONNECTIONS,
];

export const UNIT_ACTIVITIES = [
  ...ELA_ACTIVITIES,
  ...MATH_ACTIVITIES,
  ...SCIENCE_ACTIVITIES,
  ...SOCIAL_STUDIES_ACTIVITIES,
];

export { FAMILY_CARDS, UNIT_READINGS };
