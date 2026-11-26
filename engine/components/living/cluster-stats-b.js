// Plays for the "stats-b" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "question-sort": () => import("./question-sort.js").then((m) => m.buildQuestionSortPlay),
  "mad-spread": () => import("./mad-spread.js").then((m) => m.buildMadSpreadPlay),
  "choose-measure": () => import("./choose-measure.js").then((m) => m.buildChooseMeasurePlay),
};
