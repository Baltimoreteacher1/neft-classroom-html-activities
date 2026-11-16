// Motion figures: geometry (lessons 5-1 to 5-10). See docs/motion-figure-contract.md.
import area from "./geometry-area.mjs";
import composite from "./geometry-composite.mjs";
import fractional from "./geometry-fractional.mjs";
import polygon from "./geometry-polygon.mjs";
import solid from "./geometry-solid.mjs";

export default [...area, ...composite, ...polygon, ...solid, ...fractional];
