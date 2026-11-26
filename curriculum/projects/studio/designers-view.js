/**
 * View factories for the designers in designers.mjs, by mission family. A factory receives
 * { project, fields, getState, save, applyDesign, announce, values, data, setData } and returns
 * { html(), render(), attach(section), detach(), restored(data), staticSVG?(values) }.
 * `data()`/`setData(next)` read and write `state.workbench[key]`; `applyDesign(patch, tag, message)`
 * changes design numbers through the workbench (clears checks, records design undo).
 */
import { createFloorDesigner } from "./floor-designer-view.js";
import { createMapDesigner } from "./coord-map-view.js";
import { createSupplyDesigner } from "./supply-plan-view.js";

export const DESIGNER_VIEWS = {
  area: createFloorDesigner,
  coordinates: createMapDesigner,
  division: createSupplyDesigner,
};
