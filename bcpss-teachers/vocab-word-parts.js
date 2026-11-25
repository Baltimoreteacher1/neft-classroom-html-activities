// Word-parts table for the Visual Vocabulary Studio (not yet reviewed by a person).
// Each entry is keyed by the exact term and names real prefixes/roots/suffixes only.
// Anything not listed here shows no "Word parts" row: the old fallback printed a letter
// count ("Root word: ratio (5 letters)") that teaches nothing.
// Authored 2026-11-25 from standard Latin/Greek roots. No teacher or language specialist has reviewed it;
// the cards that show it carry the unit's draft badge.

const PARTS = {
  decompose: "de- (apart) + compose (put together)",
  decomposer: "de- (apart) + compose (put together) + -er (one who)",
  subtract: "sub- (under, away) + tract (pull)",
  triangle: "tri- (three) + angle",
  rectangle: "rect- (right) + angle",
  polygon: "poly- (many) + gon (angle)",
  hexagon: "hex- (six) + gon (angle)",
  quadrilateral: "quad- (four) + lateral (side)",
  centimeter: "centi- (one hundredth) + meter (measure)",
  kilometer: "kilo- (one thousand) + meter (measure)",
  kilogram: "kilo- (one thousand) + gram",
  diameter: "dia- (across) + meter (measure)",
  perimeter: "peri- (around) + meter (measure)",
  circumference: "circum- (around) + ference (carry)",
  multiply: "multi- (many) + ply (fold)",
  parallelogram: "parallel (side by side) + gram (line)",
  transformation: "trans- (across, change) + form + -ation (action)",
  translation: "trans- (across) + lation (carrying)",
  reflection: "re- (back) + flect (bend) + -ion (act)",
  convert: "con- (fully) + vert (turn)",
  inequality: "in- (not) + equal + -ity (state)",
  denominator: "de- (down) + nomin (name) + -ator (one who)",
  proportional: "pro- (for) + portion + -al (relating to)",
  probability: "probable (likely) + -ity (state)",
  variability: "variable (can change) + -ity (state)",
  distribution: "dis- (apart) + tribut (give) + -ion (act)",
  distribute: "dis- (apart) + tribute (give)",
  substitution: "sub- (in place of) + stitut (set) + -ion (act)",
  photosynthesis: "photo- (light) + synthesis (putting together)",
  photograph: "photo- (light) + graph (write, draw)",
  biography: "bio- (life) + graph (write) + -y",
  biosphere: "bio- (life) + sphere",
  geosphere: "geo- (earth) + sphere",
  hydrosphere: "hydro- (water) + sphere",
  hemisphere: "hemi- (half) + sphere",
  ecosystem: "eco- (home, environment) + system",
  transparent: "trans- (through) + parent (appear)",
  translucent: "trans- (through) + lucent (shining)",
  predict: "pre- (before) + dict (say)",
  interaction: "inter- (between) + action",
  interdependence: "inter- (between) + depend + -ence (state)",
  export: "ex- (out) + port (carry)",
  import: "im- (in) + port (carry)",
  transportation: "trans- (across) + port (carry) + -ation (action)",
  transmit: "trans- (across) + mit (send)",
  transfer: "trans- (across) + fer (carry)",
  reuse: "re- (again) + use",
  recycle: "re- (again) + cycle",
  retell: "re- (again) + tell",
  regroup: "re- (again) + group",
  nonliving: "non- (not) + living",
  independence: "in- (not) + depend + -ence (state)",
  injustice: "in- (not) + justice",
  discount: "dis- (away) + count",
  counterclaim: "counter- (against) + claim",
  dissolve: "dis- (apart) + solve (loosen)",
  dialogue: "dia- (between) + logue (speech)",
};

export const WORD_PARTS = Object.freeze(PARTS);

/** Real word parts for a term, or "" when the table has nothing true to say. */
export function wordPartsFor(term) {
  return (
    PARTS[
      String(term || "")
        .trim()
        .toLowerCase()
    ] || ""
  );
}
