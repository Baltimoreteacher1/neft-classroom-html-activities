// The registry: question format -> interaction widget. Every widget is { el, get, lock, focus, mark, onSubmit? }.

import { buildChoice, buildError, buildMulti } from "./formats-choice.js";
import { buildMatch, buildOrder, buildSentence, buildSort } from "./formats-pairs.js";
import { buildHotspot, buildIdentify, buildNumberline, buildPlot } from "./formats-spatial.js";
import { buildBlank, buildFillTable, buildNumber, buildShort } from "./formats-text.js";

export const WIDGETS = {
  choice: buildChoice,
  multi: buildMulti,
  match: buildMatch,
  sort: buildSort,
  order: buildOrder,
  blank: buildBlank,
  number: buildNumber,
  short: buildShort,
  identify: buildIdentify,
  hotspot: buildHotspot,
  numberline: buildNumberline,
  build: buildSentence,
  error: buildError,
  fillTable: buildFillTable,
  plot: buildPlot,
};

export const buildWidget = (q, ctx) => (WIDGETS[q.format] || buildChoice)(q, ctx);
