// Plays for the "decimals" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "place-value-blocks": () => import("./place-value-blocks.js").then((m) => m.buildPlaceValuePlay),
  "decimal-area": () => import("./decimal-area.js").then((m) => m.buildDecimalAreaPlay),
  "partial-quotients": () =>
    import("./partial-quotients.js").then((m) => m.buildPartialQuotientsPlay),
};
