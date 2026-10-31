// Spanish for Fluency Lab 4.0, one table per workstream so parallel work never edits the same lines.
// English text is the key (like i18n-es.js). Merged into the base table by i18n-es.js.
import { ES_LAB4_ADAPTIVE } from "./i18n-es-lab4-adaptive.js";
import { ES_LAB4_ART } from "./i18n-es-lab4-art.js";
import { ES_LAB4_DASHBOARD } from "./i18n-es-lab4-dashboard.js";
import { ES_LAB4_GENERATORS } from "./i18n-es-lab4-generators.js";
import { ES_LAB4_GRAPHICS } from "./i18n-es-lab4-graphics.js";
import { ES_LAB4_LESSONS } from "./i18n-es-lab4-lessons.js";
import { ES_LAB4_TEACHER } from "./i18n-es-lab4-teacher.js";

export const ES_LAB4 = {
  ...ES_LAB4_ADAPTIVE,
  ...ES_LAB4_ART,
  ...ES_LAB4_DASHBOARD,
  ...ES_LAB4_GENERATORS,
  ...ES_LAB4_GRAPHICS,
  ...ES_LAB4_LESSONS,
  ...ES_LAB4_TEACHER,
};
