/**
 * curriculum-top1.js — RETIRED. Intentionally boots nothing.
 *
 * This file used to render a role-aware "Start Here" command center on the
 * Curriculum Hub (Student / Teacher / Family / Substitute / Intervention /
 * Assessment / Today modes). That persona picker was retired: the hub is a
 * teacher-only page, so the role switch duplicated the lesson Command Center.
 *
 * The retirement was left half-done. inject() became an unconditional `return`
 * with its entire original body still sitting underneath it, and waitForHub()
 * kept polling for window.CurriculumHub and then fetching four JSON files --
 * curriculum-unit-identities, curriculum-supports, curriculum-resource-taxonomy
 * and curriculum-uifr-level4 -- on EVERY hub load, purely to hand them to that
 * no-op. Four requests per load, parsed and thrown away. Everything they fed
 * (buildPanel and the whole render/uifr helper tree, ~1,200 lines) was
 * reachable only from the dead body.
 *
 * DO NOT DELETE THIS FILE. tools/validate-curriculum-top1.mjs asserts that it
 * exists and that curriculum/index.html wires both it and curriculum-top1.css;
 * scripts/generate-curriculum.mjs also emits it in the hub's script list.
 *
 * The stylesheet is NOT retired and carries real behavior: curriculum-top1.css
 * is the live student/teacher visibility gate (`body:not(.teacher-mode)
 * .hub-teacher-only` / `body.teacher-mode .hub-student-only`), keyed off classes
 * other scripts set. It stands on its own and must stay wired.
 *
 * To revive the command center, recover the implementation from git history
 * (before the commit that reduced this file to a stub).
 */
(function () {
  "use strict";
  /* Intentionally empty — see the file comment above. */
})();
