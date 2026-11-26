/**
 * Registry of direct-manipulation designers, by mission family. Pure (no DOM), so the save cleaner,
 * the checkpoint cleaner and the report can use it in Node tests.
 *
 * Each entry:
 *   key            the field under `state.workbench` that holds the designer's data
 *   clean(raw)     validates stored data (never throws; returns the empty value on garbage)
 *   report(data, values, fmt)  plain-text lines for the downloadable defense report
 * The view half (DOM) is registered in designers-view.js under the same family.
 */
import { cleanLayout, layoutReport, roomOf } from "./floor-designer.mjs";
import { cleanMap, mapReport } from "./coord-map.mjs";
import { cleanPlan, planReport } from "./supply-plan.mjs";

export const DESIGNERS = {
  area: {
    key: "layout",
    clean: cleanLayout,
    report: (data, values, fmt) => layoutReport(data, roomOf(values), fmt),
  },
  coordinates: { key: "map", clean: cleanMap, report: mapReport },
  division: { key: "supply", clean: cleanPlan, report: planReport },
};

export const designerFor = (project) => DESIGNERS[project?.family] || null;
