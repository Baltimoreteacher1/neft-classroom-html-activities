// Procedural educational diagrams: structured data in, an accessible standalone SVG out, so accuracy survives when
// a value changes. Each function returns { svg, alt: {en, es}, caption: {en, es}, data, table }.
//
//   fractionModelSvg  prismSvg  tapeDiagramSvg  coordinatePlaneSvg   (diagrams-models.js)
//   barChartSvg  dotPlotSvg  histogramSvg                            (diagrams-charts.js)
//   timelineSvg  foodWebSvg                                          (diagrams-graphs.js)
//
// Every function takes `lang: "en" | "es"` (default "en") for the text drawn inside the figure and the <title>/<desc>.
// Bad input throws a DiagramError with a stable `code` and a message a teacher can read.
//
// Embedding: normalizeActivity (core/schema.js safeImageSrc) accepts only RASTER data: URLs or same-site absolute
// paths ending in .svg/.png/..., never data:image/svg+xml. diagramAsBlock therefore cannot inline an SVG; it builds
// the image block when the caller supplies a publishable `src`, and always offers the same facts as a table block.

import { safeImageSrc } from "../core/schema.js";
import { both } from "./diagram-kit.js";

export { barChartSvg, dotPlotSvg, histogramSvg } from "./diagrams-charts.js";
export { foodWebSvg, timelineSvg } from "./diagrams-graphs.js";
export {
  coordinatePlaneSvg,
  fractionModelSvg,
  prismSvg,
  tapeDiagramSvg,
} from "./diagrams-models.js";
export { CAPS, contrastRatio, DiagramError } from "./diagram-kit.js";

const MAX_TABLE_ROWS = 20;

/**
 * Blocks for an activity from one diagram result.
 * @param {{svg:string, alt:{en:string,es:string}, caption:{en:string,es:string}, table?:object}} diagram
 * @param {{src?:string, lang?:"en"|"es", table?:boolean}} [opts] `src`: a raster data: URL (the SVG rendered to PNG)
 *   or a same-site path to the published .svg
 * @returns {{blocks: object[], svg: string, review: Array<{en:string, es:string}>}}
 */
export function diagramAsBlock(diagram, opts = {}) {
  if (!diagram?.svg || !diagram.alt?.en || !diagram.alt?.es)
    throw new TypeError("diagramAsBlock needs a diagram result.");
  const lang = opts.lang === "es" ? "es" : "en";
  const blocks = [];
  const review = [];
  const src = opts.src ? safeImageSrc(opts.src) : "";
  if (src) {
    blocks.push({
      type: "image",
      src,
      alt: diagram.alt[lang],
      decorative: false,
      caption: diagram.caption[lang],
    });
  } else {
    review.push(
      both((l) =>
        l === "es"
          ? opts.src
            ? "La imagen no es un PNG/JPG/WebP/GIF en data: ni una ruta del sitio; el diagrama no se agregó como imagen."
            : "El esquema de la actividad no admite SVG en línea. Publique el SVG en una ruta del sitio (o conviértalo a PNG) y pásela como src."
          : opts.src
            ? "The image source is not a raster data: URL or a same-site path; the diagram was not added as a picture."
            : "The activity schema cannot carry inline SVG. Publish the SVG at a same-site path (or render it to PNG) and pass it as src.",
      ),
    );
  }
  const t = diagram.table;
  if (opts.table !== false && t) {
    if (t.rows.length > MAX_TABLE_ROWS)
      review.push(
        both((l) =>
          l === "es"
            ? `La tabla de datos tiene más de ${MAX_TABLE_ROWS} filas y no se agregó.`
            : `The data table has more than ${MAX_TABLE_ROWS} rows and was not added.`,
        ),
      );
    else
      blocks.push({
        type: "table",
        headers: t.headers,
        rows: t.rows,
        caption: diagram.caption[lang],
      });
  }
  return { blocks, svg: diagram.svg, review };
}
