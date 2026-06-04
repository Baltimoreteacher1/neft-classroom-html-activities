# WebQuest Spec (one per unit)  — Path: /webquests/unit-N/index.html

Classic WebQuest structure, themed + gradable. Self-contained static HTML.
- THEME + KIT: same includes as the architect spec (neft-theme + nt-activity-kit),
  style with --nt-* vars, body class="nt-theme-aware".
- SECTIONS (clear headings): Introduction (hook), Task (what they'll produce),
  Process (numbered steps), Resources (links — use real on-site links like
  /math/, the unit's 3D game /games/3d/unit-N/, graphic novels, etc.), Evaluation
  (a visible rubric table), Conclusion.
- A short auto-graded "Check Your Understanding" (4–6 items) at the end via
  NTKit.grade({activityId:"webquest-unit-N", ...}) so it can be saved as PDF/DOC
  with the student name and uploaded for grading.
- Content matched to THIS unit's standard. Plain Grade-6-ESOL language, large
  readable text, AA contrast, keyboard accessible.
