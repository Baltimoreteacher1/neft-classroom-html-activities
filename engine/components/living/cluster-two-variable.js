// Plays for the "two-variable" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "two-var": () => import("./two-var.js").then((m) => m.buildTwoVarPlay),
};
