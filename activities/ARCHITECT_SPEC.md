# Architect-Style Activity Spec (one per unit)

A hands-on, single-page interactive activity (like Area Architect, but 2D/DOM —
lighter than the 3D games). Path: /activities/architect/unit-N/index.html

REQUIREMENTS
- Self-contained static HTML+CSS+JS. No build step. Works offline.
- THEME: include <link rel="stylesheet" href="/assets/neft-theme.css"> and
  <script src="/assets/neft-theme.js" defer></script> and style ONLY with the
  --nt-* CSS variables so light/dark mode works. Add class="nt-theme-aware" to body.
- ACTIVITY KIT (grading + save): include /assets/nt-activity-kit.css + .js,
  call NTKit.mount('#ntkit'), and on "Check / Submit" call NTKit.grade({activityId:
  "architect-unit-N", activityTitle, standard, items:[{prompt,studentAnswer,
  correctAnswer,points,skill}]}). This gives the student-name field, Save-as-PDF,
  Save-as-DOC (name in filename), auto-grading, and nt_results_v1 saving for free.
- CONTENT: 5–8 interactive problems for THIS unit's standard. Student manipulates
  something (drag/click/build/enter) — not just multiple choice. Clear, short
  Grade-6-ESOL directions ("Build a rectangle with area 24."). Big readable text.
- Clear title, a 1-2 sentence "What to do", visible progress, and a final results
  screen via NTKit. WCAG AA contrast, keyboard usable, visible focus.
