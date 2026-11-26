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
import { cleanLocks, locksReport } from "./lock-model.mjs";
import { cleanRules, rulesReport } from "./rule-engine.mjs";
import { cleanShop, shopReport } from "./percent-shop.mjs";
import { cleanRatioLab, ratioReport } from "./ratio-lab.mjs";

export const DESIGNERS = {
  area: {
    key: "layout",
    clean: cleanLayout,
    report: (data, values, fmt) => layoutReport(data, roomOf(values), fmt),
  },
  coordinates: { key: "map", clean: cleanMap, report: mapReport },
  division: { key: "supply", clean: cleanPlan, report: planReport },
  expressions: {
    key: "rules",
    clean: cleanRules,
    report: (data, values) => rulesReport(data, values),
  },
  equations: {
    key: "locks",
    clean: cleanLocks,
    report: (data, values) => locksReport(data, values),
  },
  percent: { key: "shop", clean: cleanShop, report: shopReport },
  ratio: { key: "ratiolab", clean: cleanRatioLab, report: ratioReport },
};

export const designerFor = (project) => DESIGNERS[project?.family] || null;
