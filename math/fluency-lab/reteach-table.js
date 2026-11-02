// What to reteach for each answer pattern the lab can recognise. Plain statements for a teacher: each names a
// representation to use and a check to ask for. They describe a teaching move, never a diagnosis of a student.
import { t } from "./i18n.js";

const TIPS = {
  subtractInsteadOfAdding: () =>
    t(
      "Use a part-part-whole model. Join the two parts, then check that the total is larger than either part.",
    ),
  omittedAddend: () =>
    t("Ask learners to underline every number in the problem and tick each one off as it is used."),
  addedInsteadOfSubtracting: () =>
    t(
      "Draw a bar model with the whole and the part taken away. Compare how many are left with how many in all.",
    ),
  reversedSubtraction: () =>
    t(
      "Name the whole first. The whole is the starting amount and goes first; the answer must be smaller than the whole.",
    ),
  addedFactors: () =>
    t(
      "Show equal groups as an array. Count the groups and the number in each group, then connect to repeated addition.",
    ),
  oneGroupOff: () =>
    t("Draw the groups and label how many groups and how many in each group before calculating."),
  subtractedInsteadOfDividing: () =>
    t(
      "Model sharing into equal groups. Division asks how many equal groups fit, not what is left after taking away once.",
    ),
  multipliedInsteadOfDividing: () =>
    t(
      "Use a fact family to show that division undoes multiplication, and check by multiplying the answer back.",
    ),
  addedInsteadOfDividing: () =>
    t(
      "Start with the total in an equal-sharing picture and split it into equal groups. Name the size of each group.",
    ),
  addedDenominators: () =>
    t(
      "Use fraction strips to show that parts must be the same size before they are counted. The denominator names the size of the parts.",
    ),
  confusedGcfLcm: () =>
    t(
      "Contrast a list of factors with a list of multiples. The GCF is the largest factor both share; the LCM is the smallest multiple both share.",
    ),
  swappedCoordinates: () =>
    t(
      "Walk the grid: move along the x-axis first, then up or down for y. Say the order aloud before plotting.",
    ),
};

export const reteachTip = (category) => (TIPS[category] ? TIPS[category]() : "");
export const RETEACH_CATEGORIES = Object.keys(TIPS);
