// Learner-facing copy for the studio home that reaches t() through a variable. Kept in a module with no DOM so
// tools/fluency-i18n.test.mjs can import ATELIER_I18N_KEYS and check that every line has Spanish.
export const HEADLINES = {
  early: [
    "Mathematics you can hold in your hands.",
    "Count it, build it, and make a ten. Every model here answers back.",
  ],
  discover: [
    "See how numbers fit together.",
    "Slide, cut and compare. The picture and the numbers always change together.",
  ],
  design: [
    "Build a model. Test it. Find the pattern.",
    "Change one quantity and watch a whole structure of equal ratios respond.",
  ],
  analyze: [
    "The structure behind every relationship.",
    "Adjust a rate, read the slope and see why every part of a line agrees.",
  ],
};

export const LANDING = [
  "Math Fluency Lab",
  "Kindergarten to Grade 8. Choose a grade and a skill, then start.",
];

export const STATE_WORD = {
  new: "Not started",
  developing: "Developing",
  secure: "Secure",
  revisiting: "Time to revisit",
};

export const ATELIER_I18N_KEYS = Object.freeze([
  ...Object.values(HEADLINES).flat(),
  ...LANDING,
  ...Object.values(STATE_WORD),
]);
