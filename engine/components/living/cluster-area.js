// Plays for the "area" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "area-derive": () => import("./area-derive.js").then((m) => m.buildAreaDerivePlay),
  "area-compose": () => import("./area-compose.js").then((m) => m.buildAreaComposePlay),
  "polygon-triangles": () =>
    import("./polygon-triangles.js").then((m) => m.buildPolygonTrianglesPlay),
};
