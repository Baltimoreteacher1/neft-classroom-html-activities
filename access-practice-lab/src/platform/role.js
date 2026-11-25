// Which workspace role (teacher | student | family) a visitor sees. Pure, so a test can drive it without a browser.
//
// Until 2026-11-24 the default was "teacher" for everybody: a student who opened /speak for the first time saw the
// Teacher | Student | Family View switch pressed on "Teacher", and the shared library strip showed the teacher pillars.
// Order now: a choice the person made with the switch, else the door they came through (the home page and the hub links
// remember it: src/audience.js), else Student, because the lab is a place students practise.
export const ROLE_IDS = Object.freeze(["teacher", "student", "family"]);

/** @param {string} chosen the role saved by pressing the switch ("" when never pressed)
 *  @param {string} audience the remembered door ("teacher" | "student" | "family" | "") */
export function resolveRole(chosen, audience) {
  if (ROLE_IDS.includes(chosen)) return chosen;
  if (ROLE_IDS.includes(audience)) return audience;
  return "student";
}
