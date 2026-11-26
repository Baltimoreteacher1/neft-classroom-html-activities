// Plays for the "coordinate" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "plane-points": () => import("./plane-points.js").then((m) => m.buildPlanePointsPlay),
  "plane-distance": () => import("./plane-distance.js").then((m) => m.buildPlaneDistancePlay),
  "plane-polygon": () => import("./plane-polygon.js").then((m) => m.buildPlanePolygonPlay),
  "plane-reflect": () => import("./plane-reflect.js").then((m) => m.buildPlaneReflectPlay),
};
