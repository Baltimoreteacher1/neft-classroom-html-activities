// Our Class Investigation — the bridge to the site's existing builders.
//
// The student-built histogram, box plot and coordinate plotter, and the QR code
// for the class link, already exist as engine components. This file re-exports
// them so the investigation page reuses them instead of redrawing them.
//
// It is loaded with a dynamic import and the page works without it:
//   • In the source tree (and dev server) the relative imports below resolve.
//   • In the published site the build must bundle this file as a Rollup entry
//     that keeps this exact path (see the integration note in the report), because
//     /engine is not copied to dist/. Without that, the import rejects and every
//     caller shows its own "not available right now" line. Nothing else breaks.

export { renderBoxPlotBuilder } from "../../engine/components/box-plot-builder.js";
export { renderCoordinatePlot } from "../../engine/components/coordinate-plot-lab.js";
export { renderHistogramBuilder } from "../../engine/components/histogram-builder.js";
export { qrSvg } from "../../engine/core/qr-mini.js";
