// Plays for the "volume-nets" cluster. One entry per play: name -> () => Promise<builder>.
// Add a play by creating living/<name>.js (exports build<Name>Play) and one line here.
export const PLAYS = {
  "net-fold": () => import("./net-fold.js").then((m) => m.buildNetFoldPlay),
  "surface-area": () => import("./surface-area.js").then((m) => m.buildSurfaceAreaPlay),
  "volume-layers": () => import("./volume-layers.js").then((m) => m.buildVolumeLayersPlay),
};
