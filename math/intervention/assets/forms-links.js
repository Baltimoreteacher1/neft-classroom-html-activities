/* ==========================================================================
   Google Form URLs for each intervention topic's pre/post quizzes.
   Fill these in after running scripts/intervention/forms.gs (it logs the URLs).
   Leave a value empty ("") to show a "Pending" badge on the page.

   Per topic: preStudent / postStudent  = clean responder links (give to students)
              preTeacher / postTeacher  = quiz-mode editor/answer-key links (staff)

   NOTE: the keys below MUST match the topic slugs in scripts/intervention/data.mjs
   (the page looks up window.INTERVENTION_FORMS[<topic slug>]). Running
   scripts/intervention/forms.gs prints this block with the correct keys.
   ========================================================================== */
window.INTERVENTION_FORMS = {
  "number-operations": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "factors-multiples": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "fraction-sense": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "decimals-place-value": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "ratios-rates": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  percents: {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "integers-number-line": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "coordinate-plane": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  expressions: {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "equations-inequalities": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "geometry-measure": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
  "statistics-data": {
    preStudent: "",
    preTeacher: "",
    postStudent: "",
    postTeacher: "",
  },
};
