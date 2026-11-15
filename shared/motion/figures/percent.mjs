// Motion figures: percent (4-1 to 4-5). See docs/motion-figure-contract.md.
// Each figure lives in its own helper file; percent-kit.mjs holds the drawing and exact-number helpers they share.
import discount from "./percent-discount.mjs";
import grid from "./percent-grid.mjs";
import whole from "./percent-whole.mjs";

export default [grid, ...discount, whole];
