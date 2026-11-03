// Spanish for Fluency Lab 4.0, one table per workstream so parallel work never edits the same lines.
// English text is the key (like i18n-es.js). Merged into the base table by i18n-es.js.
import { ES_LAB4_ADAPTIVE } from "./i18n-es-lab4-adaptive.js";
import { ES_LAB4_ANIMATIONS } from "./i18n-es-lab4-animations.js";
import { ES_LAB4_ART } from "./i18n-es-lab4-art.js";
import { ES_LAB4_DASHBOARD } from "./i18n-es-lab4-journey.js";
import { ES_LAB4_FAMILY } from "./i18n-es-lab4-family.js";
import { ES_LAB4_GENERATORS } from "./i18n-es-lab4-generators.js";
import { ES_LAB4_GRAPHICS } from "./i18n-es-lab4-graphics.js";
import { ES_LAB4_GRAPHICS_B } from "./i18n-es-lab4-graphics-b.js";
import { ES_LAB4_LESSONS } from "./i18n-es-lab4-lessons.js";
import { ES_LAB4_SCREENS } from "./i18n-es-lab4-screens.js";
import { ES_LAB4_TEACHER } from "./i18n-es-lab4-educator.js";
import { ES_LAB6_NAV } from "./i18n-es-lab6-nav.js";
import { ES_REALITY } from "./i18n-es-lab7-reality.js";
import { ES_ATELIER } from "./i18n-es-lab8-atelier.js";

export const ES_LAB4 = {
  ...ES_LAB4_ADAPTIVE,
  ...ES_LAB4_ANIMATIONS,
  ...ES_LAB4_ART,
  ...ES_LAB4_DASHBOARD,
  ...ES_LAB4_FAMILY, // fl4:family
  ...ES_LAB4_GENERATORS,
  ...ES_LAB4_GRAPHICS,
  ...ES_LAB4_GRAPHICS_B,
  ...ES_LAB4_LESSONS,
  ...ES_LAB4_SCREENS,
  ...ES_LAB4_TEACHER,
  ...ES_LAB6_NAV,
  ...ES_REALITY,
  ...ES_ATELIER,
};
