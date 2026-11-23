// Studio visual kit. One entry point turns a visual spec (STUDIO-SPEC.md, "Visual spec") into a self-contained,
// deterministic, viewBox-scaled SVG string with role="img", <title> and <desc>.
//
//   renderVisual(spec, {resolved})  -> SVG string. Throws VisualError for a missing alt, an unknown kind or a bad field.
//                                      `resolved:true` writes literal hex colours (print, PNG) instead of ds.css variables.
//   visualToPng(spec, width = 960)  -> Promise<Blob> (image/png), browser only.
//   listIcons()                     -> [{name, category, keywords}] (re-exported from core/icons.js)
//
// Colours are ds.css tokens (var(--brand, #1e3a5f) ...) chosen by palette name; there is no second palette.
// Text uses tokens, so it follows the theme. All spec text is escaped; every number is validated.
import { listIcons } from "./icons.js";
import { drawBars, drawMap, drawTimeline, drawVenn } from "./visuals/charts.js";
import { drawCoord } from "./visuals/coord.js";
import { drawCycle, drawFlow } from "./visuals/flow.js";
import { drawLabeled } from "./visuals/labeled.js";
import { drawNumberline } from "./visuals/numberline.js";
import { PALETTE_NAMES, VisualError, esc, makeColors, num } from "./visuals/pal.js";
import { drawScene } from "./visuals/scene.js";
import { drawShapes, iconAt } from "./visuals/shapes.js";
import { drawTable } from "./visuals/table.js";
import { drawTape } from "./visuals/tape.js";

export { PALETTE_NAMES, VisualError, listIcons };

const FONT =
  "'Inter',system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans','Helvetica Neue',Arial,sans-serif";

const KINDS = {
  shapes: drawShapes,
  icon: (spec, { w, h }) => {
    if (typeof spec.name !== "string" || !spec.name)
      throw new VisualError("icon: name is required (see listIcons())");
    const s = Math.min(w, h) * 0.86;
    return iconAt(spec.name, (w - s) / 2, (h - s) / 2, s, {
      color: spec.color,
      skin: spec.skin,
      hair: spec.hair,
    });
  },
  scene: drawScene,
  tape: drawTape,
  numberline: drawNumberline,
  coord: drawCoord,
  table: drawTable,
  cycle: drawCycle,
  flow: drawFlow,
  labeled: (spec, ctx) => drawLabeled(spec, ctx, (base, cx) => drawContent(base, cx)),
  timeline: drawTimeline,
  map: drawMap,
  venn: drawVenn,
  bars: drawBars,
};
export const VISUAL_KINDS = Object.keys(KINDS);

function drawContent(spec, ctx) {
  if (!spec || typeof spec !== "object") throw new VisualError("visual spec must be an object");
  const draw = KINDS[spec.kind];
  if (!draw)
    throw new VisualError(
      `unknown visual kind ${JSON.stringify(spec.kind)}; use one of ${VISUAL_KINDS.join(", ")}`,
    );
  return draw(spec, ctx);
}

function dims(spec) {
  const w = num(spec.w, "visual w", 480);
  const h = num(spec.h, "visual h", 320);
  if (w < 40 || h < 40 || w > 4000 || h > 4000)
    throw new VisualError("visual w and h must be between 40 and 4000");
  return [w, h];
}

export function renderVisual(spec, opts = {}) {
  if (!spec || typeof spec !== "object") throw new VisualError("visual spec must be an object");
  if (typeof spec.alt !== "string" || !spec.alt.trim())
    throw new VisualError(`visual (kind ${JSON.stringify(spec.kind)}) needs alt text`);
  if (spec.longDesc != null && typeof spec.longDesc !== "string")
    throw new VisualError("visual longDesc must be a string");
  const [w, h] = dims(spec);
  const c = makeColors(!!opts.resolved);
  const body = drawContent(spec, { c, w, h });
  const family = opts.resolved ? FONT : `var(--font,${FONT})`;
  const size = opts.width
    ? ` width="${num(opts.width, "width")}" height="${Math.round((num(opts.width, "width") * h) / w)}"`
    : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${size} class="st-vis st-vis--${esc(spec.kind)}" role="img" aria-label="${esc(spec.alt)}" ` +
    `data-kind="${esc(spec.kind)}" preserveAspectRatio="xMidYMid meet" style="font-family:${family};max-width:100%;height:auto">` +
    `<title>${esc(spec.alt)}</title>${spec.longDesc ? `<desc>${esc(spec.longDesc)}</desc>` : ""}${body}</svg>`
  );
}

/** Rasterise a spec to a PNG Blob of the given pixel width (white page behind it). Browser only. */
export async function visualToPng(spec, width = 960) {
  if (typeof document === "undefined")
    throw new VisualError("visualToPng needs a browser (canvas)");
  const px = num(width, "visualToPng width");
  if (px < 16 || px > 6000) throw new VisualError("visualToPng width must be between 16 and 6000");
  const svg = renderVisual(spec, { resolved: true, width: px });
  const [w, h] = dims(spec);
  const img = new Image();
  const loaded = new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new VisualError("the picture could not be rasterised"));
  });
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await loaded;
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = Math.round((px * h) / w);
  const g = canvas.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, canvas.width, canvas.height);
  g.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new VisualError("PNG export failed"))),
      "image/png",
    ),
  );
}
