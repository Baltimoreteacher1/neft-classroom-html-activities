/* One scene function per project id, grouped by file so several authors can work in parallel.
   A scene is (palette) => SVG inner markup for a 1200x600 canvas; the builder adds the
   background and the <svg> wrapper (tools/build-project-identity.mjs documents the contract). */
import { SCENES_A } from "./scenes-a.mjs";
import { SCENES_B } from "./scenes-b.mjs";
import { SCENES_C } from "./scenes-c.mjs";
import { SCENES_D } from "./scenes-d.mjs";

export const ART = { ...SCENES_A, ...SCENES_B, ...SCENES_C, ...SCENES_D };
